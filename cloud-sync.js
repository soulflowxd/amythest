/* Minimal Convex HTTP client for the extension's classic MV3 service worker. */
(() => {
  const validDeployment = value => /^https:\/\/[a-z0-9-]+\.convex\.cloud\/?$/i.test(value || "");
  const deployment = () => (validDeployment(globalThis.AMYTHEST_CONVEX_URL) ? globalThis.AMYTHEST_CONVEX_URL.replace(/\/$/, "") : "");
  const clampMs = value => Number.isFinite(value) ? Math.max(0, Math.min(86400000, Math.floor(value))) : 0;
  const tokenExpiry = token => {
    try {
      const body = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const exp = JSON.parse(atob(body)).exp;
      return Number.isSafeInteger(exp) ? exp * 1000 : 0;
    } catch { return 0; }
  };
  async function call(kind, path, args, token = "") {
    const url = deployment();
    if (!url) throw new Error("Cloud sync is not configured.");
    const response = await fetch(`${url}/api/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ path, format: "json", args })
    });
    if (!response.ok) throw new Error(`Cloud request failed (${response.status}).`);
    const result = await response.json();
    if (result.status !== "success") throw new Error(result.errorMessage || "Cloud request failed.");
    return result.value;
  }
  const settingsValue = local => ({
    dailyDistractionGoalMinutes: local.dailyGoalMinutes || 120,
    distractionDomains: local.blockedSites || [],
    siteLimits: Object.entries(local.siteLimits || {}).map(([domain, minutes]) => ({ domain, minutes })),
    workHours: { enabled: !!local.workHoursEnabled, start: local.workStart || "09:00", end: local.workEnd || "17:00" },
    blockShorts: local.blockShorts !== false,
    checkLongForm: local.checkLongForm !== false
  });
  const localSettings = remote => ({
    dailyGoalMinutes: remote.dailyDistractionGoalMinutes,
    blockedSites: remote.distractionDomains,
    siteLimits: Object.fromEntries(remote.siteLimits.map(({ domain, minutes }) => [domain, minutes])),
    workHoursEnabled: remote.workHours.enabled,
    workStart: remote.workHours.start,
    workEnd: remote.workHours.end,
    blockShorts: remote.blockShorts,
    checkLongForm: remote.checkLongForm
  });
  const dayArgs = (snapshot, deviceId) => ({
    deviceId, source: "chrome", date: snapshot.date,
    activeMs: clampMs(snapshot.sites.reduce((sum, site) => sum + site.activeMs, 0)),
    distractionMs: clampMs(snapshot.sites.reduce((sum, site) => sum + site.distractionMs, 0)),
    videoMs: clampMs(snapshot.sites.reduce((sum, site) => sum + site.videoMs, 0)),
    sites: snapshot.sites, observedAt: snapshot.generatedAt
  });
  globalThis.AmythestCloud = { deployment, validDeployment, call, tokenExpiry, settingsValue, localSettings, dayArgs };
})();
