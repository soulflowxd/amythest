using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

namespace Amythest.Windows
{
    public sealed class Settings
    {
        public int CloudRevision = 0;
        public string CloudFingerprint = "";
        public int GoalMinutes = 120;
        public bool WorkEnabled = false;
        public int WorkStartMinutes = 9 * 60;
        public int WorkEndMinutes = 17 * 60;
        public DateTime FocusUntil = DateTime.MinValue;
        public DateTime PausedUntil = DateTime.MinValue;
        public readonly HashSet<string> DistractingApps = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        public readonly Dictionary<string, int> DailyLimits = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
    }

    public static class AppPolicy
    {
        private static readonly Regex AppPattern = new Regex("^[a-z0-9][a-z0-9._-]{0,79}$", RegexOptions.Compiled);
        private static readonly HashSet<string> Protected = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        { "amythest", "explorer", "taskmgr", "cmd", "powershell", "pwsh" };

        public static string NormalizeApp(string value)
        {
            if (value == null) return null;
            value = value.Trim().ToLowerInvariant();
            if (value.EndsWith(".exe", StringComparison.Ordinal)) value = value.Substring(0, value.Length - 4);
            return AppPattern.IsMatch(value) ? value : null;
        }

        public static bool CanBlock(string app) { return app != null && !Protected.Contains(app); }

        public static bool WorkHoursActive(Settings settings, DateTime now)
        {
            if (!settings.WorkEnabled) return false;
            int minute = now.Hour * 60 + now.Minute;
            int start = settings.WorkStartMinutes, end = settings.WorkEndMinutes;
            if (start == end) return false;
            if (start < end) return IsWeekday(now.DayOfWeek) && minute >= start && minute < end;
            if (minute >= start) return IsWeekday(now.DayOfWeek);
            return IsWeekday(now.AddDays(-1).DayOfWeek) && minute < end;
        }

        private static bool IsWeekday(DayOfWeek day) { return day >= DayOfWeek.Monday && day <= DayOfWeek.Friday; }

        public static string BlockReason(string app, long todayMs, Settings settings, DateTime now, DateTime focusUntil, DateTime pausedUntil)
        {
            if (app == null || Protected.Contains(app) || pausedUntil > now) return null;
            int limit;
            if (settings.DailyLimits.TryGetValue(app, out limit) && todayMs >= (long)limit * 60000)
                return "You've reached today's limit for " + app + ".";
            if (settings.DistractingApps.Contains(app))
            {
                if (focusUntil > now) return "You're in a focus session.";
                if (WorkHoursActive(settings, now)) return "You're within your work hours.";
            }
            return null;
        }
    }

    public sealed class LocalStore
    {
        public readonly string Folder;
        public LocalStore(string folder)
        {
            Folder = folder;
            Directory.CreateDirectory(Folder);
        }

        private string SettingsPath { get { return Path.Combine(Folder, "settings.tsv"); } }
        private string UsagePath(DateTime day) { return Path.Combine(Folder, "usage-" + day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) + ".tsv"); }
        private string HoursPath(DateTime day) { return Path.Combine(Folder, "hours-" + day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) + ".tsv"); }

        public Settings LoadSettings()
        {
            Settings settings = new Settings();
            if (!File.Exists(SettingsPath)) return settings;
            foreach (string line in File.ReadAllLines(SettingsPath, Encoding.UTF8))
            {
                string[] cells = line.Split('\t');
                int value;
                if (cells.Length == 2 && cells[0] == "goal" && int.TryParse(cells[1], out value)) settings.GoalMinutes = Math.Max(1, Math.Min(1440, value));
                else if (cells.Length == 2 && cells[0] == "cloud-revision" && int.TryParse(cells[1], out value)) settings.CloudRevision = Math.Max(0, value);
                else if (cells.Length == 2 && cells[0] == "cloud-fingerprint") settings.CloudFingerprint = cells[1];
                else if (cells.Length == 4 && cells[0] == "work")
                {
                    int start, end;
                    if (int.TryParse(cells[2], out start) && int.TryParse(cells[3], out end))
                    {
                        settings.WorkEnabled = cells[1] == "true";
                        settings.WorkStartMinutes = Math.Max(0, Math.Min(1439, start));
                        settings.WorkEndMinutes = Math.Max(0, Math.Min(1439, end));
                    }
                }
                else if (cells.Length == 2 && cells[0] == "distraction")
                {
                    string app = AppPolicy.NormalizeApp(cells[1]);
                    if (AppPolicy.CanBlock(app)) settings.DistractingApps.Add(app);
                }
                else if (cells.Length == 3 && cells[0] == "limit" && int.TryParse(cells[2], out value))
                {
                    string app = AppPolicy.NormalizeApp(cells[1]);
                    if (AppPolicy.CanBlock(app)) settings.DailyLimits[app] = Math.Max(1, Math.Min(1440, value));
                }
                else if (cells.Length == 2 && cells[0] == "focus")
                {
                    long ticks;
                    if (long.TryParse(cells[1], out ticks)) { try { settings.FocusUntil = DateTime.FromBinary(ticks); } catch { } }
                }
                else if (cells.Length == 2 && cells[0] == "paused")
                {
                    long ticks;
                    if (long.TryParse(cells[1], out ticks)) { try { settings.PausedUntil = DateTime.FromBinary(ticks); } catch { } }
                }
            }
            return settings;
        }

        public void SaveSettings(Settings settings)
        {
            List<string> lines = new List<string>();
            lines.Add("goal\t" + settings.GoalMinutes);
            lines.Add("cloud-revision\t" + settings.CloudRevision);
            lines.Add("cloud-fingerprint\t" + settings.CloudFingerprint);
            lines.Add("work\t" + (settings.WorkEnabled ? "true" : "false") + "\t" + settings.WorkStartMinutes + "\t" + settings.WorkEndMinutes);
            lines.Add("focus\t" + settings.FocusUntil.ToBinary().ToString(CultureInfo.InvariantCulture));
            lines.Add("paused\t" + settings.PausedUntil.ToBinary().ToString(CultureInfo.InvariantCulture));
            foreach (string app in settings.DistractingApps.OrderBy(x => x)) lines.Add("distraction\t" + app);
            foreach (KeyValuePair<string, int> pair in settings.DailyLimits.OrderBy(x => x.Key)) lines.Add("limit\t" + pair.Key + "\t" + pair.Value);
            File.WriteAllLines(SettingsPath, lines.ToArray(), Encoding.UTF8);
        }

        public Dictionary<string, long> LoadUsage(DateTime day)
        {
            Dictionary<string, long> usage = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
            string path = UsagePath(day);
            if (!File.Exists(path)) return usage;
            foreach (string line in File.ReadAllLines(path, Encoding.UTF8))
            {
                string[] cells = line.Split('\t');
                long ms;
                if (cells.Length == 2 && long.TryParse(cells[1], out ms) && ms >= 0 && AppPolicy.NormalizeApp(cells[0]) != null)
                    usage[cells[0]] = ms;
            }
            return usage;
        }

        public void SaveUsage(DateTime day, Dictionary<string, long> usage)
        {
            string[] lines = usage.OrderBy(x => x.Key).Select(x => x.Key + "\t" + x.Value.ToString(CultureInfo.InvariantCulture)).ToArray();
            File.WriteAllLines(UsagePath(day), lines, Encoding.UTF8);
        }

        public long[] LoadHours(DateTime day)
        {
            long[] hours = new long[24];
            string path = HoursPath(day);
            if (!File.Exists(path)) return hours;
            foreach (string line in File.ReadAllLines(path, Encoding.UTF8))
            {
                string[] cells = line.Split('\t');
                int hour; long ms;
                if (cells.Length == 2 && int.TryParse(cells[0], out hour) && long.TryParse(cells[1], out ms) && hour >= 0 && hour < 24 && ms >= 0 && ms <= 3600000)
                    hours[hour] = ms;
            }
            return hours;
        }

        public void SaveHours(DateTime day, long[] hours)
        {
            if (hours == null || hours.Length != 24) throw new ArgumentException("Expected 24 hourly totals.");
            string[] lines = Enumerable.Range(0, 24).Select(hour => hour + "\t" + Math.Max(0, Math.Min(3600000, hours[hour])).ToString(CultureInfo.InvariantCulture)).ToArray();
            File.WriteAllLines(HoursPath(day), lines, Encoding.UTF8);
        }
    }

    public static class ForegroundApp
    {
        [StructLayout(LayoutKind.Sequential)] private struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
        [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);
        [DllImport("user32.dll")] private static extern bool GetLastInputInfo(ref LASTINPUTINFO info);

        public static bool IsIdle(int thresholdSeconds)
        {
            LASTINPUTINFO info = new LASTINPUTINFO();
            info.cbSize = (uint)Marshal.SizeOf(info);
            if (!GetLastInputInfo(ref info)) return false;
            uint elapsed = unchecked((uint)Environment.TickCount - info.dwTime);
            return elapsed > (uint)thresholdSeconds * 1000;
        }

        public static string CurrentName()
        {
            IntPtr window = GetForegroundWindow();
            if (window == IntPtr.Zero) return null;
            uint pid;
            GetWindowThreadProcessId(window, out pid);
            if (pid == 0) return null;
            try { return AppPolicy.NormalizeApp(Process.GetProcessById((int)pid).ProcessName); }
            catch { return null; }
        }
    }
}
