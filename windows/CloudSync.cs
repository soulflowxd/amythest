using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Text;
using System.Web.Script.Serialization;

namespace Amythest.Windows
{
    public sealed class CloudDay
    {
        public string deviceId { get; set; }
        public string source { get; set; }
        public string date { get; set; }
        public long activeMs { get; set; }
        public long distractionMs { get; set; }
        public long videoMs { get; set; }
        public List<WebsiteRow> sites { get; set; }
        public long observedAt { get; set; }
    }

    public sealed class CloudSyncResult
    {
        public bool Connected { get; set; }
        public string Message { get; set; }
        public List<CloudDay> Days { get; set; }
        public CloudWindowsSettings WindowsSettings { get; set; }
        public CloudSiteSettings SiteSettings { get; set; }
        public bool SettingsConflict { get; set; }
    }

    public sealed class CloudAppLimit { public string app { get; set; } public int minutes { get; set; } }
    public sealed class CloudSiteLimit { public string domain { get; set; } public int minutes { get; set; } }
    public sealed class CloudSiteSettings { public int revision { get; set; } public List<CloudSiteLimit> siteLimits { get; set; } }
    public sealed class CloudWindowsSettings
    {
        public int revision { get; set; }
        public int goalMinutes { get; set; }
        public List<string> distractingApps { get; set; }
        public List<CloudAppLimit> appLimits { get; set; }
        public bool workEnabled { get; set; }
        public int workStartMinutes { get; set; }
        public int workEndMinutes { get; set; }
        public static CloudWindowsSettings From(Settings s) { return new CloudWindowsSettings {
            goalMinutes = s.GoalMinutes, distractingApps = s.DistractingApps.OrderBy(x => x).ToList(),
            appLimits = s.DailyLimits.OrderBy(x => x.Key).Select(x => new CloudAppLimit { app = x.Key, minutes = x.Value }).ToList(),
            workEnabled = s.WorkEnabled, workStartMinutes = s.WorkStartMinutes, workEndMinutes = s.WorkEndMinutes
        }; }
        public void Apply(Settings s) {
            s.GoalMinutes = goalMinutes; s.WorkEnabled = workEnabled;
            s.WorkStartMinutes = workStartMinutes; s.WorkEndMinutes = workEndMinutes;
            s.DistractingApps.Clear(); foreach (string app in distractingApps ?? new List<string>()) s.DistractingApps.Add(app);
            s.DailyLimits.Clear(); foreach (CloudAppLimit limit in appLimits ?? new List<CloudAppLimit>()) s.DailyLimits[limit.app] = limit.minutes;
            s.CloudRevision = revision; s.CloudFingerprint = Fingerprint(this);
        }
        public static string Fingerprint(CloudWindowsSettings value) {
            string json = new JavaScriptSerializer().Serialize(new { value.goalMinutes, value.distractingApps, value.appLimits, value.workEnabled, value.workStartMinutes, value.workEndMinutes });
            using (SHA256 sha = SHA256.Create()) return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(json)));
        }
    }

    public interface ICloudTransport
    {
        string Post(string url, string token, string body);
    }

    public sealed class ConvexTransport : ICloudTransport
    {
        public string Post(string url, string token, string body)
        {
            ServicePointManager.SecurityProtocol |= (SecurityProtocolType)3072;
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = "POST";
            request.ContentType = "application/json";
            request.Accept = "application/json";
            request.Headers[HttpRequestHeader.Authorization] = "Bearer " + token;
            request.Timeout = 10000;
            request.ReadWriteTimeout = 10000;
            byte[] bytes = Encoding.UTF8.GetBytes(body);
            request.ContentLength = bytes.Length;
            using (Stream stream = request.GetRequestStream()) stream.Write(bytes, 0, bytes.Length);
            using (WebResponse response = request.GetResponse())
            using (Stream stream = response.GetResponseStream())
            using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                return reader.ReadToEnd();
        }
    }

    public sealed class CloudSync
    {
        private readonly string folder;
        private readonly ICloudTransport transport;
        private static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = 1024 * 1024 };

        public CloudSync(string folder, ICloudTransport transport)
        {
            this.folder = folder;
            this.transport = transport;
        }

        public static long EpochNow() { return (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds; }

        public string DeviceId()
        {
            Directory.CreateDirectory(folder);
            string path = Path.Combine(folder, "windows-device-id.txt");
            if (File.Exists(path))
            {
                string stored = File.ReadAllText(path, Encoding.ASCII).Trim();
                Guid parsed;
                if (Guid.TryParseExact(stored, "N", out parsed)) return stored;
            }
            string value = Guid.NewGuid().ToString("N");
            File.WriteAllText(path, value, Encoding.ASCII);
            return value;
        }

        public CloudDay CreateDay(DateTime date, IDictionary<string, long> usage, Settings settings)
        {
            long total = usage.Values.Where(value => value > 0).Sum(value => Math.Min(value, 86400000));
            long distractions = usage.Where(pair => settings.DistractingApps.Contains(pair.Key) && pair.Value > 0)
                .Sum(pair => Math.Min(pair.Value, 86400000));
            return new CloudDay {
                deviceId = DeviceId(), source = "windows", date = date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                activeMs = Math.Min(total, 86400000), distractionMs = Math.Min(distractions, 86400000),
                videoMs = 0, sites = new List<WebsiteRow>(), observedAt = EpochNow()
            };
        }

        public CloudSyncResult SyncToday(DateTime date, IDictionary<string, long> usage, Settings settings)
        {
            AccountSession session = NativeBridge.LoadAccountSession(folder);
            if (session == null) return new CloudSyncResult { Connected = false, Message = "Sign in from the Chrome extension to sync devices.", Days = new List<CloudDay>() };
            try
            {
                CloudDay day = CreateDay(date, usage, settings);
                Call(session, "mutation", "sync:putDay", day);
                object result = Call(session, "query", "sync:getDays", new { from = day.date, through = day.date });
                List<CloudDay> days = Json.Deserialize<List<CloudDay>>(Json.Serialize(result)) ?? new List<CloudDay>();
                object siteResult = Call(session, "query", "sync:getSettings", new { });
                CloudSiteSettings sites = siteResult == null ? null : Json.Deserialize<CloudSiteSettings>(Json.Serialize(siteResult));
                object windowsResult = Call(session, "query", "sync:getWindowsSettings", new { });
                CloudWindowsSettings remote = windowsResult == null ? null : Json.Deserialize<CloudWindowsSettings>(Json.Serialize(windowsResult));
                CloudWindowsSettings local = CloudWindowsSettings.From(settings);
                string fingerprint = CloudWindowsSettings.Fingerprint(local);
                if (remote == null) {
                    object saved = Call(session, "mutation", "sync:putWindowsSettings", new { expectedRevision = 0, value = local });
                    remote = local; remote.revision = Convert.ToInt32(((Dictionary<string, object>)saved)["revision"]);
                } else if (settings.CloudFingerprint != "" && fingerprint != settings.CloudFingerprint) {
                    if (remote.revision != settings.CloudRevision) return new CloudSyncResult {
                        Connected = true, Message = "Windows limits changed on another device. Review cloud limits before replacing local edits.",
                        Days = days, WindowsSettings = remote, SiteSettings = sites, SettingsConflict = true
                    };
                    object saved = Call(session, "mutation", "sync:putWindowsSettings", new { expectedRevision = remote.revision, value = local });
                    remote = local; remote.revision = Convert.ToInt32(((Dictionary<string, object>)saved)["revision"]);
                }
                return new CloudSyncResult { Connected = true, Message = "Account screen time and limits synced.", Days = days, WindowsSettings = remote, SiteSettings = sites };
            }
            catch (WebException)
            {
                return new CloudSyncResult { Connected = false, Message = "Sync is offline. Local tracking continues.", Days = new List<CloudDay>() };
            }
            catch (Exception)
            {
                return new CloudSyncResult { Connected = false, Message = "Sync needs attention. Local tracking continues.", Days = new List<CloudDay>() };
            }
        }

        public void SetSiteLimit(string domain, int minutes, int expectedRevision)
        {
            string normalized = (domain ?? "").Trim().ToLowerInvariant();
            if (normalized.Length < 1 || normalized.Length > 253 ||
                !Regex.IsMatch(normalized, @"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$") ||
                minutes < 0 || minutes > 1440 || expectedRevision < 0)
                throw new ArgumentException("Enter a valid website and daily minute limit.");
            AccountSession session = NativeBridge.LoadAccountSession(folder);
            if (session == null) throw new InvalidOperationException("Sign in from Chrome first.");
            Call(session, "mutation", "sync:setSiteLimit", new { expectedRevision, domain = normalized, minutes });
        }

        private object Call(AccountSession session, string method, string path, object args)
        {
            Uri endpoint;
            if (!Uri.TryCreate(session.deploymentUrl, UriKind.Absolute, out endpoint) || endpoint.Scheme != Uri.UriSchemeHttps ||
                !endpoint.Host.EndsWith(".convex.cloud", StringComparison.OrdinalIgnoreCase) || endpoint.AbsolutePath != "/")
                throw new InvalidOperationException("Invalid account deployment URL");
            string body = Json.Serialize(new { path = path, args = args, format = "json" });
            string response = transport.Post(session.deploymentUrl.TrimEnd('/') + "/api/" + method, session.accessToken, body);
            Dictionary<string, object> envelope = Json.Deserialize<Dictionary<string, object>>(response);
            if (envelope == null || !envelope.ContainsKey("status") || !String.Equals(envelope["status"] as string, "success", StringComparison.Ordinal))
                throw new InvalidOperationException("Cloud sync request failed");
            return envelope.ContainsKey("value") ? envelope["value"] : null;
        }
    }
}
