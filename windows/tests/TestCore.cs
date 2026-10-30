using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Web.Script.Serialization;
using Amythest.Windows;

internal static class TestCore
{
    private static void Check(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
    }

    private static int Main()
    {
        Check(AppPolicy.NormalizeApp("Discord.exe") == "discord", "normalize process name");
        Check(AppPolicy.NormalizeApp("../../bad") == null, "reject paths");
        Check(!AppPolicy.CanBlock("explorer"), "protect Windows shell");
        Settings settings = new Settings();
        settings.DistractingApps.Add("discord");
        settings.DailyLimits["steam"] = 10;
        settings.WorkEnabled = true;
        settings.WorkStartMinutes = 9 * 60;
        settings.WorkEndMinutes = 17 * 60;
        DateTime weekday = new DateTime(2026, 10, 29, 10, 0, 0);
        Check(AppPolicy.WorkHoursActive(settings, weekday), "weekday work hours");
        Check(!AppPolicy.WorkHoursActive(settings, weekday.AddDays(2)), "weekend outside work hours");
        Check(AppPolicy.BlockReason("discord", 0, settings, weekday, DateTime.MinValue, DateTime.MinValue) != null, "work-hour distraction block");
        Check(AppPolicy.BlockReason("steam", 10 * 60000, settings, weekday, DateTime.MinValue, DateTime.MinValue) != null, "daily app limit");
        Check(AppPolicy.BlockReason("discord", 0, settings, weekday, DateTime.MinValue, weekday.AddMinutes(5)) == null, "break bypass");
        Check(AppPolicy.BlockReason("explorer", 99999999, settings, weekday, weekday.AddMinutes(25), DateTime.MinValue) == null, "protected process");

        string folder = Path.Combine(Path.GetTempPath(), "amythest-core-test-" + Guid.NewGuid().ToString("N"));
        LocalStore store = new LocalStore(folder);
        settings.GoalMinutes = 90;
        settings.FocusUntil = weekday.AddMinutes(25);
        store.SaveSettings(settings);
        Settings restored = store.LoadSettings();
        Check(restored.GoalMinutes == 90 && restored.DistractingApps.Contains("discord"), "settings round trip");
        Check(restored.FocusUntil == settings.FocusUntil, "focus time round trip");
        Dictionary<string, long> usage = new Dictionary<string, long>();
        usage["chrome"] = 12345;
        store.SaveUsage(weekday, usage);
        Check(store.LoadUsage(weekday)["chrome"] == 12345, "usage round trip");
        long[] hours = new long[24];
        hours[10] = 12345;
        store.SaveHours(weekday, hours);
        Check(store.LoadHours(weekday)[10] == 12345, "hourly activity round trip");
        Check(!NativeBridge.ValidExtensionId("not-an-extension"), "extension ID validation");
        Check(NativeBridge.ValidExtensionId(new string('a', 32)), "valid extension ID");
        WebsiteSnapshot snapshot = new WebsiteSnapshot { type = "dailyWebsiteUsage", version = 1, date = DateTime.Today.ToString("yyyy-MM-dd"), generatedAt = 123456,
            sites = new List<WebsiteRow> { new WebsiteRow { domain = "youtube.com", activeMs = 60000, videoMs = 40000, distractionMs = 30000 } } };
        Check(NativeBridge.SaveSnapshot(snapshot, folder), "website snapshot stored");
        WebsiteSnapshot restoredSites = NativeBridge.LoadSnapshot(DateTime.Today, folder);
        Check(restoredSites != null && restoredSites.sites.Count == 1 && restoredSites.sites[0].videoMs == 40000, "website snapshot round trip");
        snapshot.sites[0].domain = "../bad";
        Check(!NativeBridge.SaveSnapshot(snapshot, folder), "reject unsafe domain");
        snapshot.sites[0].domain = "youtube.com";
        byte[] message = Encoding.UTF8.GetBytes(new JavaScriptSerializer().Serialize(snapshot));
        MemoryStream inbound = new MemoryStream();
        byte[] size = BitConverter.GetBytes(message.Length);
        inbound.Write(size, 0, size.Length);
        inbound.Write(message, 0, message.Length);
        inbound.Position = 0;
        MemoryStream outbound = new MemoryStream();
        Check(NativeBridge.RunHost(inbound, outbound, folder) == 0, "framed native message accepted");
        Check(Encoding.UTF8.GetString(outbound.ToArray()).Contains("{\"ok\":true}"), "native host acknowledgement");
        long expires = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds + 60000;
        AccountSession account = new AccountSession { type = "accountSession", version = 1, accessToken = new string('x', 40), expiresAt = expires, deploymentUrl = "https://test-deployment.convex.cloud/" };
        Check(NativeBridge.SaveAccountSession(account, folder), "account session stored encrypted");
        Check(NativeBridge.LoadAccountSession(folder).accessToken == account.accessToken, "account session round trip");
        Check(!Encoding.UTF8.GetString(File.ReadAllBytes(Path.Combine(folder, "account-session.bin"))).Contains(account.accessToken), "account token encrypted at rest");
        NativeBridge.ClearAccountSession(folder);
        Check(NativeBridge.LoadAccountSession(folder) == null, "account sign-out clears token");
        Console.WriteLine("Windows core tests passed");
        return 0;
    }
}
