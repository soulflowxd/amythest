using System;
using System.Collections.Generic;
using System.IO;
using Amythest.Windows;

internal sealed class FakeCloudTransport : ICloudTransport
{
    public int Calls;
    public string LastBody;
    public bool ReturnRemote;
    public string Post(string url, string token, string body)
    {
        if (!url.StartsWith("https://test-project.convex.cloud/api/")) throw new Exception("Unexpected endpoint");
        if (token != "test-only-access-token-1234567890") throw new Exception("Missing access token");
        Calls++;
        LastBody = body;
        if (body.Contains("sync:putWindowsSettings")) return "{\"status\":\"success\",\"value\":{\"revision\":1,\"updatedAt\":100}}";
        if (body.Contains("sync:getWindowsSettings")) return ReturnRemote
            ? "{\"status\":\"success\",\"value\":{\"revision\":2,\"goalMinutes\":60,\"distractingApps\":[\"discord\"],\"appLimits\":[{\"app\":\"discord\",\"minutes\":20}],\"workEnabled\":false,\"workStartMinutes\":540,\"workEndMinutes\":1020}}"
            : "{\"status\":\"success\",\"value\":null}";
        if (body.Contains("sync:getSettings")) return "{\"status\":\"success\",\"value\":null}";
        if (url.EndsWith("/mutation")) return "{\"status\":\"success\",\"value\":{\"accepted\":true,\"receivedAt\":100}}";
        return "{\"status\":\"success\",\"value\":[{\"deviceId\":\"other-device\",\"source\":\"chrome\",\"date\":\"2026-10-29\",\"activeMs\":30000,\"distractionMs\":12000,\"videoMs\":8000,\"sites\":[],\"observedAt\":100}]}";
    }
}

internal static class TestCloudSync
{
    private static void Check(bool ok, string message) { if (!ok) throw new Exception(message); }
    private static int Main()
    {
        string folder = Path.Combine(Path.GetTempPath(), "amythest-cloud-test-" + Guid.NewGuid().ToString("N"));
        FakeCloudTransport fake = new FakeCloudTransport();
        CloudSync cloud = new CloudSync(folder, fake);
        Settings settings = new Settings();
        settings.DistractingApps.Add("discord");
        Dictionary<string, long> usage = new Dictionary<string, long> { { "discord", 12000 }, { "chrome", 30000 } };
        DateTime date = new DateTime(2026, 10, 29);
        CloudDay day = cloud.CreateDay(date, usage, settings);
        Check(day.activeMs == 42000 && day.distractionMs == 12000 && day.videoMs == 0, "Windows totals remain distinct from sites");
        Check(day.deviceId == cloud.DeviceId(), "Stable device ID");
        Check(!cloud.SyncToday(date, usage, settings).Connected && fake.Calls == 0, "Offline local fallback");
        AccountSession session = new AccountSession { type = "accountSession", version = 1,
            accessToken = "test-only-access-token-1234567890", deploymentUrl = "https://test-project.convex.cloud",
            expiresAt = CloudSync.EpochNow() + 3600000 };
        Check(NativeBridge.SaveAccountSession(session, folder), "Protected session accepted");
        CloudSyncResult result = cloud.SyncToday(date, usage, settings);
        Check(result.Connected && fake.Calls == 5, "Authenticated totals and limits upload/query");
        Check(result.Days.Count == 1 && result.Days[0].source == "chrome", "Other device returned");
        Check(result.WindowsSettings != null && result.WindowsSettings.revision == 1, "Windows limits created");
        Check(fake.LastBody.Contains("sync:putWindowsSettings"), "Correct Windows settings mutation");
        fake.ReturnRemote = true;
        CloudSyncResult adopted = cloud.SyncToday(date, usage, new Settings());
        Check(adopted.Connected && !adopted.SettingsConflict && adopted.WindowsSettings.appLimits[0].minutes == 20, "Remote limits available for a new device");
        settings.CloudRevision = 1;
        settings.CloudFingerprint = "prior-settings";
        settings.DailyLimits["discord"] = 30;
        CloudSyncResult conflict = cloud.SyncToday(date, usage, settings);
        Check(conflict.SettingsConflict && conflict.WindowsSettings.appLimits[0].minutes == 20, "Concurrent Windows limits are not overwritten");
        Console.WriteLine("Windows cloud sync tests passed");
        return 0;
    }
}
