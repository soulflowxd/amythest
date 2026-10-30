using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
using Microsoft.Win32;

namespace Amythest.Windows
{
    public sealed class WebsiteRow
    {
        public string domain { get; set; }
        public long activeMs { get; set; }
        public long videoMs { get; set; }
        public long distractionMs { get; set; }
    }

    public sealed class WebsiteSnapshot
    {
        public string type { get; set; }
        public int version { get; set; }
        public string date { get; set; }
        public long generatedAt { get; set; }
        public List<WebsiteRow> sites { get; set; }
    }

    public sealed class AccountSession
    {
        public string type { get; set; }
        public int version { get; set; }
        public string accessToken { get; set; }
        public long expiresAt { get; set; }
        public string deploymentUrl { get; set; }
    }

    public static class NativeBridge
    {
        public const string HostName = "com.amythest.screentime";
        private static readonly Regex ExtensionId = new Regex("^[a-p]{32}$", RegexOptions.Compiled);
        private static readonly Regex Domain = new Regex("^[a-z0-9][a-z0-9.-]{0,252}$", RegexOptions.Compiled);
        private static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = 1024 * 1024 };

        public static string DataFolder { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Amythest"); } }

        public static bool ValidExtensionId(string id) { return id != null && ExtensionId.IsMatch(id); }

        public static string Register(string id, string hostExecutable, string folder)
        {
            if (!ValidExtensionId(id)) throw new ArgumentException("Paste the 32-letter Chrome extension ID from chrome://extensions.");
            if (!File.Exists(hostExecutable)) throw new FileNotFoundException("The Chrome bridge is missing. Keep Amythest.NativeHost.exe beside Amythest.exe.", hostExecutable);
            Directory.CreateDirectory(folder);
            string manifestPath = Path.Combine(folder, HostName + ".json");
            string manifest = Json.Serialize(new Dictionary<string, object> {
                { "name", HostName }, { "description", "Amythest local website screen time bridge" },
                { "path", Path.GetFullPath(hostExecutable) }, { "type", "stdio" },
                { "allowed_origins", new[] { "chrome-extension://" + id + "/" } }
            });
            File.WriteAllText(manifestPath, manifest, new UTF8Encoding(false));
            using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Google\Chrome\NativeMessagingHosts\" + HostName))
                key.SetValue("", manifestPath, RegistryValueKind.String);
            File.WriteAllText(Path.Combine(folder, "chrome-extension-id.txt"), id, Encoding.ASCII);
            return manifestPath;
        }

        public static bool IsRegistered(string folder)
        {
            using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\Google\Chrome\NativeMessagingHosts\" + HostName))
            {
                string path = key == null ? null : key.GetValue("") as string;
                return path != null && File.Exists(path) && File.Exists(Path.Combine(folder, "chrome-extension-id.txt"));
            }
        }

        public static bool SaveSnapshot(WebsiteSnapshot snapshot, string folder)
        {
            if (snapshot == null || snapshot.type != "dailyWebsiteUsage" || snapshot.version != 1 || snapshot.sites == null || snapshot.sites.Count > 200) return false;
            DateTime date;
            if (!DateTime.TryParseExact(snapshot.date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date)) return false;
            if (date.Date < DateTime.Today.AddDays(-7) || date.Date > DateTime.Today) return false;
            if (snapshot.generatedAt <= 0) return false;
            HashSet<string> seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (WebsiteRow row in snapshot.sites)
            {
                if (row == null || row.domain == null || !Domain.IsMatch(row.domain) || row.domain.Contains("..") || !seen.Add(row.domain)) return false;
                if (row.activeMs < 0 || row.activeMs > 86400000 || row.videoMs < 0 || row.videoMs > 86400000 || row.distractionMs < 0 || row.distractionMs > 86400000) return false;
            }
            Directory.CreateDirectory(folder);
            string target = Path.Combine(folder, "chrome-sites-" + snapshot.date + ".tsv");
            string temporary = target + "." + Guid.NewGuid().ToString("N") + ".tmp";
            List<string> lines = new List<string> { "generatedAt\t" + snapshot.generatedAt.ToString(CultureInfo.InvariantCulture) };
            lines.AddRange(snapshot.sites.Select(row => row.domain + "\t" + row.activeMs + "\t" + row.videoMs + "\t" + row.distractionMs));
            try
            {
                File.WriteAllLines(temporary, lines.ToArray(), new UTF8Encoding(false));
                if (File.Exists(target)) File.Replace(temporary, target, null);
                else File.Move(temporary, target);
            }
            finally { if (File.Exists(temporary)) File.Delete(temporary); }
            return true;
        }

        public static WebsiteSnapshot LoadSnapshot(DateTime date, string folder)
        {
            string path = Path.Combine(folder, "chrome-sites-" + date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) + ".tsv");
            if (!File.Exists(path)) return null;
            string[] lines = File.ReadAllLines(path, Encoding.UTF8);
            if (lines.Length == 0) return null;
            string[] header = lines[0].Split('\t');
            long timestamp;
            if (header.Length != 2 || header[0] != "generatedAt" || !long.TryParse(header[1], out timestamp)) return null;
            WebsiteSnapshot snapshot = new WebsiteSnapshot { type = "dailyWebsiteUsage", version = 1, date = date.ToString("yyyy-MM-dd"), generatedAt = timestamp, sites = new List<WebsiteRow>() };
            foreach (string line in lines.Skip(1).Take(200))
            {
                string[] cell = line.Split('\t');
                long active, video, distraction;
                if (cell.Length == 4 && Domain.IsMatch(cell[0]) && long.TryParse(cell[1], out active) && long.TryParse(cell[2], out video) && long.TryParse(cell[3], out distraction) && active >= 0 && video >= 0 && distraction >= 0)
                    snapshot.sites.Add(new WebsiteRow { domain = cell[0], activeMs = active, videoMs = video, distractionMs = distraction });
            }
            return snapshot;
        }

        public static int RunHost(Stream input, Stream output, string folder)
        {
            try
            {
                byte[] prefix = ReadExactly(input, 4);
                int length = BitConverter.ToInt32(prefix, 0);
                if (length <= 0 || length > 1024 * 1024) return 2;
                string request = Encoding.UTF8.GetString(ReadExactly(input, length));
                Dictionary<string, object> envelope = Json.Deserialize<Dictionary<string, object>>(request);
                bool ok = false;
                if (envelope != null && envelope.ContainsKey("type"))
                {
                    string type = envelope["type"] as string;
                    if (type == "dailyWebsiteUsage") ok = SaveSnapshot(Json.Deserialize<WebsiteSnapshot>(request), folder);
                    else if (type == "accountSession") ok = SaveAccountSession(Json.Deserialize<AccountSession>(request), folder);
                    else if (type == "accountSignOut" && Convert.ToInt32(envelope["version"]) == 1) { ClearAccountSession(folder); ok = true; }
                }
                byte[] response = Encoding.UTF8.GetBytes(ok ? "{\"ok\":true}" : "{\"ok\":false}");
                byte[] size = BitConverter.GetBytes(response.Length);
                output.Write(size, 0, size.Length);
                output.Write(response, 0, response.Length);
                output.Flush();
                return ok ? 0 : 2;
            }
            catch (Exception error) { Console.Error.WriteLine(error.GetType().Name + ": " + error.Message); return 2; }
        }

        public static bool SaveAccountSession(AccountSession session, string folder)
        {
            Uri url;
            long now = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;
            if (session == null || session.type != "accountSession" || session.version != 1 ||
                session.accessToken == null || session.accessToken.Length < 20 || session.accessToken.Length > 8192 ||
                !Uri.TryCreate(session.deploymentUrl, UriKind.Absolute, out url) || url.Scheme != Uri.UriSchemeHttps ||
                !url.Host.EndsWith(".convex.cloud", StringComparison.OrdinalIgnoreCase) || url.AbsolutePath != "/" ||
                session.expiresAt <= now || session.expiresAt > now + 86400000) return false;
            Directory.CreateDirectory(folder);
            byte[] plaintext = Encoding.UTF8.GetBytes(Json.Serialize(session));
            byte[] protectedBytes = ProtectedData.Protect(plaintext, null, DataProtectionScope.CurrentUser);
            File.WriteAllBytes(Path.Combine(folder, "account-session.bin"), protectedBytes);
            return true;
        }

        public static AccountSession LoadAccountSession(string folder)
        {
            string path = Path.Combine(folder, "account-session.bin");
            if (!File.Exists(path)) return null;
            try
            {
                byte[] plaintext = ProtectedData.Unprotect(File.ReadAllBytes(path), null, DataProtectionScope.CurrentUser);
                AccountSession session = Json.Deserialize<AccountSession>(Encoding.UTF8.GetString(plaintext));
                return session != null && session.expiresAt > (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds ? session : null;
            }
            catch { return null; }
        }

        public static void ClearAccountSession(string folder)
        {
            string path = Path.Combine(folder, "account-session.bin");
            if (File.Exists(path)) File.Delete(path);
        }

        private static byte[] ReadExactly(Stream stream, int count)
        {
            byte[] buffer = new byte[count];
            int offset = 0;
            while (offset < count)
            {
                int read = stream.Read(buffer, offset, count - offset);
                if (read <= 0) throw new EndOfStreamException();
                offset += read;
            }
            return buffer;
        }
    }
}
