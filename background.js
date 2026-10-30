if (typeof importScripts === "function") importScripts("cloud-config.js", "cloud-sync.js");

const DEFAULTS = {
  blockedSites: ["instagram.com", "tiktok.com", "x.com", "youtube.com"],
  siteLimits: {}, focusUntil: 0, pausedUntil: 0, sessionMinutes: 25,
  dailyGoalMinutes: 120, workHoursEnabled: false, workStart: "09:00", workEnd: "17:00",
  blockShorts: true, hideShortsFeed: true, checkLongForm: true, videoAccess: {}, shortAccess: {}
};
let active = null;
let recording = Promise.resolve();
let syncing = Promise.resolve();
let nativeSyncing = null;
let cloudSyncing = null;
let applyingCloudSettings = false;
const CLOUD_SETTING_KEYS = ["dailyGoalMinutes", "blockedSites", "siteLimits", "workHoursEnabled", "workStart", "workEnd", "blockShorts", "checkLongForm"];

function dateKey(time = Date.now()) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function hostname(url) {
  try { const u = new URL(url); return ["http:", "https:"].includes(u.protocol) ? u.hostname.replace(/^www\./, "") : null; }
  catch { return null; }
}
function matches(domain, site) { return domain === site || domain.endsWith(`.${site}`); }
function youtubeVideo(url) {
  try {
    const parsed = new URL(url);
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname)) return null;
    const id = parsed.pathname === "/watch" ? parsed.searchParams.get("v") : parsed.pathname.match(/^\/live\/([\w-]{11})\/?$/)?.[1];
    return /^[\w-]{11}$/.test(id || "") ? { id, url: parsed.href } : null;
  } catch { return null; }
}
function youtubeShorts(url) {
  try {
    const parsed = new URL(url);
    return ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname) && /^\/shorts(?:\/|$)/.test(parsed.pathname);
  } catch { return false; }
}
function youtubeShortId(url) {
  try {
    const parsed = new URL(url);
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname)) return null;
    return parsed.pathname.match(/^\/shorts\/([\w-]{11})\/?$/)?.[1] || null;
  } catch { return null; }
}
function shortContent(url) {
  try {
    const { hostname: host, pathname } = new URL(url);
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host) && /^\/shorts(?:\/|$)/.test(pathname)) {
      const id = youtubeShortId(url);
      return { kind: "YouTube Short", key: id ? `youtube:${id}` : null };
    }
    if (["instagram.com", "www.instagram.com"].includes(host)) {
      const id = pathname.match(/^\/reels?\/([\w-]+)\/?$/)?.[1];
      if (id) return { kind: "Instagram Reel", key: `instagram:${id}` };
      if (/^\/reels(?:\/|$)/.test(pathname)) return { kind: "Instagram Reels", key: null };
    }
    if (["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(host)) {
      if (/^\/(?:messages|message|inbox)(?:\/|$)/.test(pathname)) return null;
      const id = pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/)?.[1];
      if (id) return { kind: "TikTok video", key: `tiktok:${id}` };
      if (/^\/(?:$|foryou(?:\/|$)|following(?:\/|$)|explore(?:\/|$)|search(?:\/|$)|discover(?:\/|$)|tag\/|music\/|live(?:\/|$))/.test(pathname)) return { kind: "TikTok feed", key: null };
    }
  } catch { /* Ignore non-web URLs. */ }
  return null;
}
function validVideoReason(category, reason) {
  const words = reason.trim().match(/[a-zA-Z]{3,}/g) || [];
  return ["school", "robotics", "work", "research", "other"].includes(category) && reason.trim().length >= 15 && words.length >= 3 && new Set(reason.toLowerCase().replace(/[^a-z]/g, "")).size >= 5;
}
function isWorkTime({ workHoursEnabled, workStart, workEnd }, now = new Date()) {
  if (!workHoursEnabled) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = Number(workStart.slice(0, 2)) * 60 + Number(workStart.slice(3));
  const end = Number(workEnd.slice(0, 2)) * 60 + Number(workEnd.slice(3));
  const day = now.getDay();
  if (start === end) return false;
  if (start < end) return day >= 1 && day <= 5 && minutes >= start && minutes < end;
  return (day >= 1 && day <= 5 && minutes >= start) || (day >= 2 && day <= 6 && minutes < end);
}
function blockedDomains(settings, usage, now = Date.now()) {
  if (settings.pausedUntil > now) return [];
  const scheduled = settings.focusUntil > now || isWorkTime(settings, new Date(now));
  const domains = new Set(scheduled ? settings.blockedSites.filter(site => !(settings.checkLongForm && site === "youtube.com") && !(settings.blockShorts && ["instagram.com", "tiktok.com"].includes(site))) : []);
  for (const [site, limit] of Object.entries(settings.siteLimits)) {
    const spent = Object.entries(usage).filter(([domain]) => matches(domain, site)).reduce((sum, [, ms]) => sum + ms, 0);
    if (spent >= limit * 60000) domains.add(site);
  }
  return [...domains].slice(0, 200);
}
function sitePolicy(url, settings, usage, now = Date.now()) {
  const domain = hostname(url);
  if (!domain) return { mode: "allow" };
  if (settings.pausedUntil > now) return { mode: "allow" };
  const short = settings.blockShorts ? shortContent(url) : null;
  if (short) {
    if (!short.key || !(settings.shortAccess?.[short.key]?.until > now)) return { mode: "shorts", shortId: short.key, shortKind: short.kind };
    return { mode: "allow" };
  }
  if (blockedDomains(settings, usage, now).some(site => matches(domain, site))) {
    return { mode: "block", focusUntil: settings.focusUntil, workHours: isWorkTime(settings, new Date(now)) };
  }
  const video = youtubeVideo(url);
  if (settings.checkLongForm && video && !(settings.videoAccess?.[video.id]?.until > now)) {
    return { mode: "video", videoId: video.id };
  }
  return { mode: "allow" };
}
function recordElapsed() {
  if (!active) return recording;
  const current = active;
  const now = Date.now();
  const since = current.since;
  const elapsed = Math.max(0, Math.min(now - since, 5 * 60 * 1000));
  if (elapsed < 1000) return recording;
  current.since = now;
  recording = recording.catch(error => console.error("Could not save screen time", error)).then(async () => {
    const key = `usage:${dateKey(since)}`;
    const hourKey = `hoursBySite:${dateKey(since)}`;
    const videoKey = `videoUsage:${dateKey(since)}`;
    const data = await chrome.storage.local.get([key, hourKey, videoKey]);
    const usage = data[key] || {};
    usage[current.domain] = (usage[current.domain] || 0) + elapsed;
    const hoursBySite = data[hourKey] || {};
    const hours = hoursBySite[current.domain] || Array(24).fill(0);
    hours[new Date(since).getHours()] += elapsed;
    hoursBySite[current.domain] = hours;
    const updates = { [key]: usage, [hourKey]: hoursBySite };
    if (current.video) {
      const videoUsage = data[videoKey] || {};
      videoUsage[current.domain] = (videoUsage[current.domain] || 0) + elapsed;
      updates[videoKey] = videoUsage;
    }
    await chrome.storage.local.set(updates);
  });
  return recording;
}
async function refreshActive() {
  await recordElapsed();
  void syncNativeUsage();
  const window = await chrome.windows.getLastFocused();
  if (!window.focused) { active = null; return; }
  const [tab] = await chrome.tabs.query({ active: true, windowId: window.id });
  const domain = hostname(tab?.url);
  active = domain ? { domain, since: Date.now(), video: !!(youtubeVideo(tab.url) || shortContent(tab.url)) } : null;
}
async function applyRules() {
  const settings = await chrome.storage.local.get(DEFAULTS);
  const validAccess = Object.fromEntries(Object.entries(settings.videoAccess).filter(([, entry]) => entry.until > Date.now()));
  if (Object.keys(validAccess).length !== Object.keys(settings.videoAccess).length) await chrome.storage.local.set({ videoAccess: validAccess });
  const validShorts = Object.fromEntries(Object.entries(settings.shortAccess).filter(([, entry]) => entry.until > Date.now()));
  if (Object.keys(validShorts).length !== Object.keys(settings.shortAccess).length) await chrome.storage.local.set({ shortAccess: validShorts });
  const current = await chrome.declarativeNetRequest.getDynamicRules();
  if (current.length) await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: current.map(rule => rule.id) });
  const data = await chrome.storage.local.get(`usage:${dateKey()}`);
  const domains = blockedDomains(settings, data[`usage:${dateKey()}`] || {});
  await chrome.action.setBadgeText({ text: domains.length || settings.blockShorts ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#7556b8" });
}
async function policyForUrl(url) {
  const settings = await chrome.storage.local.get(DEFAULTS);
  const data = await chrome.storage.local.get(`usage:${dateKey()}`);
  return sitePolicy(url, settings, data[`usage:${dateKey()}`] || {});
}
async function grantBreak(url) {
  const policy = await policyForUrl(url);
  if (policy.mode !== "block") return { ok: false, error: "This site is no longer blocked." };
  const until = Date.now() + 5 * 60000;
  await chrome.storage.local.set({ pausedUntil: until });
  return { ok: true, until };
}
async function grantVideoAccess(message) {
  const video = youtubeVideo(message.url);
  if (!video || !validVideoReason(message.category, message.reason || "")) return { ok: false, error: "Choose a purpose and write at least three meaningful words about what you need to do." };
  const { videoAccess } = await chrome.storage.local.get(DEFAULTS);
  const now = Date.now();
  const current = Object.fromEntries(Object.entries(videoAccess).filter(([, entry]) => entry.until > now));
  current[video.id] = { until: now + 15 * 60000, category: message.category };
  await chrome.storage.local.set({ videoAccess: current });
  return { ok: true, url: video.url };
}
async function grantShortAccess(message) {
  const shortId = shortContent(message.url)?.key;
  if (!shortId || !validVideoReason(message.category, message.reason || "")) return { ok: false, error: "Choose a purpose and write at least three meaningful words about why you need this video." };
  const { shortAccess } = await chrome.storage.local.get(DEFAULTS);
  const now = Date.now();
  const current = Object.fromEntries(Object.entries(shortAccess).filter(([, entry]) => entry.until > now));
  current[shortId] = { until: now + 5 * 60000, category: message.category };
  await chrome.storage.local.set({ shortAccess: current });
  return { ok: true };
}
function syncRules() {
  syncing = syncing.catch(() => {}).then(applyRules);
  return syncing;
}
function dailyWebsiteSnapshot(date, usage, videoUsage, blockedSites, generatedAt) {
  const cleanMs = value => Number.isFinite(value) ? Math.max(0, Math.min(86400000, Math.floor(value))) : 0;
  const sites = Object.entries(usage || {})
    .filter(([domain]) => /^[a-z0-9.-]{1,253}$/.test(domain) && !domain.startsWith(".") && !domain.endsWith("."))
    .map(([domain, spent]) => {
      const activeMs = cleanMs(spent);
      const videoMs = Math.min(activeMs, cleanMs(videoUsage?.[domain]));
      const distractionMs = blockedSites.some(site => matches(domain, site)) ? activeMs : videoMs;
      return { domain, activeMs, videoMs, distractionMs };
    })
    .filter(site => site.activeMs > 0)
    .sort((a, b) => b.activeMs - a.activeMs)
    .slice(0, 200);
  return { type: "dailyWebsiteUsage", version: 1, date, generatedAt, sites };
}
async function syncNativeUsage() {
  if (nativeSyncing) return nativeSyncing;
  nativeSyncing = (async () => {
    if (typeof chrome.runtime.sendNativeMessage !== "function") return;
    const now = Date.now();
    const day = dateKey(now);
    const usageKey = `usage:${day}`;
    const videoKey = `videoUsage:${day}`;
    const data = await chrome.storage.local.get(["nativeLastSyncAt", usageKey, videoKey, "blockedSites"]);
    if (now - (data.nativeLastSyncAt || 0) < 60000) return;
    await chrome.storage.local.set({ nativeLastSyncAt: now });
    const payload = dailyWebsiteSnapshot(day, data[usageKey] || {}, data[videoKey] || {}, data.blockedSites || DEFAULTS.blockedSites, now);
    await chrome.runtime.sendNativeMessage("com.amythest.screentime", payload);
  })().catch(() => { /* The Windows companion is optional. */ }).finally(() => { nativeSyncing = null; });
  return nativeSyncing;
}
async function cloudAccessToken() {
  const { cloudAuth } = await chrome.storage.local.get("cloudAuth");
  if (!cloudAuth?.token) return null;
  if (globalThis.AmythestCloud.tokenExpiry(cloudAuth.token) > Date.now() + 5 * 60000) return cloudAuth.token;
  if (!cloudAuth.refreshToken) return null;
  const result = await globalThis.AmythestCloud.call("action", "auth:signIn", { refreshToken: cloudAuth.refreshToken });
  if (!result?.tokens?.token) throw new Error("Your cloud session expired. Sign in again.");
  const updated = { ...cloudAuth, ...result.tokens };
  await chrome.storage.local.set({ cloudAuth: updated });
  void sendNativeAccountSession(updated.token);
  return updated.token;
}
async function sendNativeAccountSession(token) {
  try {
    if (typeof chrome.runtime.sendNativeMessage !== "function") return;
    await chrome.runtime.sendNativeMessage("com.amythest.screentime", {
      type: "accountSession", version: 1, deploymentUrl: globalThis.AmythestCloud.deployment(),
      accessToken: token, expiresAt: globalThis.AmythestCloud.tokenExpiry(token)
    });
  } catch { /* The Windows companion is optional. */ }
}
async function cloudStatus() {
  const data = await chrome.storage.local.get(["cloudAuth", "cloudLastSyncAt", "cloudSyncError", "cloudSettingsConflict"]);
  return { configured: !!globalThis.AmythestCloud?.deployment(), signedIn: !!data.cloudAuth?.token,
    email: data.cloudAuth?.email || "", lastSyncAt: data.cloudLastSyncAt || 0,
    error: data.cloudSyncError || "", settingsConflict: !!data.cloudSettingsConflict };
}
async function cloudDaySummary() {
  const token = await cloudAccessToken();
  if (!token) return { ok: false, error: "Sign in to see your devices." };
  const day = dateKey();
  const days = await globalThis.AmythestCloud.call("query", "sync:getDays", { from: day, through: day }, token);
  const windowsSettings = await globalThis.AmythestCloud.call("query", "sync:getWindowsSettings", {}, token);
  return { ok: true, days: Array.isArray(days) ? days : [], windowsSettings };
}
async function setWindowsAppLimit(app, minutes) {
  const token = await cloudAccessToken();
  if (!token) throw new Error("Sign in to change app limits.");
  const normalized = String(app || "").trim().toLowerCase().replace(/\.exe$/, "");
  const value = Number(minutes);
  if (!/^[a-z0-9][a-z0-9._-]{0,79}$/.test(normalized) || !Number.isSafeInteger(value) || value < 0 || value > 1440)
    throw new Error("Enter a valid app and limit in minutes.");
  const current = await globalThis.AmythestCloud.call("query", "sync:getWindowsSettings", {}, token);
  if (!current) throw new Error("Connect the Windows app to this account first.");
  await globalThis.AmythestCloud.call("mutation", "sync:setWindowsAppLimit", { expectedRevision: current.revision, app: normalized, minutes: value }, token);
  return { ok: true };
}
async function signInCloud(email, password, flow) {
  if (!globalThis.AmythestCloud?.deployment()) throw new Error("Cloud sync is not configured yet.");
  const normalized = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) throw new Error("Enter a valid email address.");
  if (typeof password !== "string" || password.length < 8) throw new Error("Use a password with at least eight characters.");
  if (flow !== "signIn" && flow !== "signUp") throw new Error("Choose sign in or create account.");
  const result = await globalThis.AmythestCloud.call("action", "auth:signIn", { provider: "password", params: { email: normalized, password, flow } });
  if (!result?.tokens?.token || !result.tokens.refreshToken) throw new Error("Could not sign in. Check your email and password.");
  await chrome.storage.local.set({ cloudAuth: { email: normalized, ...result.tokens }, cloudSettingsDirty: false, cloudSettingsConflict: false, cloudSyncError: "" });
  void sendNativeAccountSession(result.tokens.token);
  await syncCloud({ initial: true, force: true });
  return { ok: true };
}
async function signOutCloud() {
  const token = await cloudAccessToken().catch(() => null);
  if (token) await globalThis.AmythestCloud.call("action", "auth:signOut", {}, token).catch(() => {});
  await chrome.storage.local.set({ cloudAuth: null, cloudSettingsDirty: false, cloudSettingsConflict: false, cloudSyncError: "" });
  try { await chrome.runtime.sendNativeMessage("com.amythest.screentime", { type: "accountSignOut", version: 1 }); }
  catch { /* The Windows companion is optional. */ }
  return { ok: true };
}
async function reloadCloudSettings() {
  const token = await cloudAccessToken();
  if (!token) throw new Error("Sign in to reload cloud settings.");
  const remote = await globalThis.AmythestCloud.call("query", "sync:getSettings", {}, token);
  if (!remote) throw new Error("No cloud settings are available yet.");
  applyingCloudSettings = true;
  try {
    await chrome.storage.local.set({ ...globalThis.AmythestCloud.localSettings(remote), cloudSettingsRevision: remote.revision,
      cloudSettingsDirty: false, cloudSettingsConflict: false, cloudSyncError: "" });
  } finally { applyingCloudSettings = false; }
  return { ok: true };
}
async function syncCloud({ initial = false, force = false } = {}) {
  if (!globalThis.AmythestCloud?.deployment()) return;
  if (cloudSyncing) return cloudSyncing;
  cloudSyncing = (async () => {
    const now = Date.now();
    const day = dateKey(now);
    const usageKey = `usage:${day}`;
    const videoKey = `videoUsage:${day}`;
    const keys = ["cloudAuth", "cloudDeviceId", "cloudLastSyncAt", "cloudSettingsDirty", "cloudSettingsRevision", "blockedSites", "siteLimits", "dailyGoalMinutes", "workHoursEnabled", "workStart", "workEnd", "blockShorts", "checkLongForm", usageKey, videoKey];
    const data = await chrome.storage.local.get(keys);
    if (!data.cloudAuth?.token) return;
    const token = await cloudAccessToken();
    if (!token) throw new Error("Your cloud session expired. Sign in again.");
    let deviceId = data.cloudDeviceId;
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      await chrome.storage.local.set({ cloudDeviceId: deviceId });
    }
    if (initial) {
      const remote = await globalThis.AmythestCloud.call("query", "sync:getSettings", {}, token);
      if (remote) {
        applyingCloudSettings = true;
        try { await chrome.storage.local.set({ ...globalThis.AmythestCloud.localSettings(remote), cloudSettingsRevision: remote.revision, cloudSettingsDirty: false }); }
        finally { applyingCloudSettings = false; }
      } else {
        const result = await globalThis.AmythestCloud.call("mutation", "sync:putSettings", { expectedRevision: 0, value: globalThis.AmythestCloud.settingsValue(data) }, token);
        await chrome.storage.local.set({ cloudSettingsRevision: result.revision, cloudSettingsDirty: false });
      }
    } else if (data.cloudSettingsDirty) {
      try {
        const result = await globalThis.AmythestCloud.call("mutation", "sync:putSettings", { expectedRevision: data.cloudSettingsRevision || 0, value: globalThis.AmythestCloud.settingsValue(data) }, token);
        await chrome.storage.local.set({ cloudSettingsRevision: result.revision, cloudSettingsDirty: false, cloudSettingsConflict: false });
      } catch (error) {
        await chrome.storage.local.set({ cloudSettingsConflict: true });
        throw error;
      }
    } else if (force || now - (data.cloudLastSyncAt || 0) >= 60000) {
      const remote = await globalThis.AmythestCloud.call("query", "sync:getSettings", {}, token);
      if (remote && remote.revision > (data.cloudSettingsRevision || 0)) {
        applyingCloudSettings = true;
        try { await chrome.storage.local.set({ ...globalThis.AmythestCloud.localSettings(remote), cloudSettingsRevision: remote.revision }); }
        finally { applyingCloudSettings = false; }
      }
    }
    if (force || initial || now - (data.cloudLastSyncAt || 0) >= 60000) {
      const snapshot = dailyWebsiteSnapshot(day, data[usageKey] || {}, data[videoKey] || {}, data.blockedSites || DEFAULTS.blockedSites, now);
      const args = globalThis.AmythestCloud.dayArgs(snapshot, deviceId);
      await globalThis.AmythestCloud.call("mutation", "sync:putDay", args, token);
      await chrome.storage.local.set({ cloudLastSyncAt: now });
    }
    await chrome.storage.local.set({ cloudSyncError: "" });
  })().catch(async error => {
    await chrome.storage.local.set({ cloudSyncError: error.message || "Cloud sync failed." });
  }).finally(() => { cloudSyncing = null; });
  return cloudSyncing;
}
async function init() {
  const stored = await chrome.storage.local.get(null);
  const missing = Object.fromEntries(Object.entries(DEFAULTS).filter(([key]) => stored[key] === undefined));
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
  await chrome.storage.local.setAccessLevel?.({ accessLevel: "TRUSTED_CONTEXTS" });
  chrome.alarms.create("heartbeat", { periodInMinutes: 1 });
  await syncRules();
  await refreshActive();
  void syncNativeUsage();
  void syncCloud();
  if (globalThis.AmythestCloud?.deployment()) void cloudAccessToken().then(token => { if (token) void sendNativeAccountSession(token); }).catch(() => {});
}
chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);
chrome.tabs.onActivated.addListener(refreshActive);
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (change.url && tab.active) refreshActive().catch(error => console.error("Could not track active tab", error));
});
chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
  if (details.frameId === 0) {
    chrome.tabs.sendMessage(details.tabId, { type: "policyChanged" }).catch(() => {});
    refreshActive().catch(error => console.error("Could not track video time", error));
  }
}, { url: [{ hostSuffix: "youtube.com" }, { hostSuffix: "instagram.com" }, { hostSuffix: "tiktok.com" }] });
chrome.tabs.onRemoved.addListener(refreshActive);
chrome.windows.onFocusChanged.addListener(refreshActive);
chrome.alarms.onAlarm.addListener(async () => { await recordElapsed(); await syncNativeUsage(); await syncCloud(); await syncRules(); });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && Object.keys(changes).some(key => ["blockedSites", "siteLimits", "focusUntil", "pausedUntil", "workHoursEnabled", "workStart", "workEnd", "blockShorts", "checkLongForm"].includes(key) || key.startsWith("usage:"))) syncRules();
  if (area === "local" && !applyingCloudSettings && Object.keys(changes).some(key => CLOUD_SETTING_KEYS.includes(key))) {
    chrome.storage.local.set({ cloudSettingsDirty: true }).then(() => void syncCloud());
  }
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "flushUsage") recordElapsed().then(() => sendResponse({ ok: true }));
  else if (message.type === "syncRules") syncRules().then(() => sendResponse({ ok: true }));
  else if (message.type === "getSitePolicy") policyForUrl(message.url).then(sendResponse).catch(error => sendResponse({ mode: "allow", error: error.message }));
  else if (message.type === "requestBreak") grantBreak(message.url).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "requestVideoAccess") grantVideoAccess(message).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "requestShortAccess") grantShortAccess(message).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "cloudStatus") cloudStatus().then(sendResponse);
  else if (message.type === "cloudDaySummary") cloudDaySummary().then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "cloudSetWindowsLimit") setWindowsAppLimit(message.app, message.minutes).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "cloudPasswordAuth") signInCloud(message.email, message.password, message.flow).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "cloudSignOut") signOutCloud().then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "cloudSyncNow") syncCloud({ force: true }).then(() => cloudStatus().then(sendResponse));
  else if (message.type === "cloudReloadSettings") reloadCloudSettings().then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});
init();
