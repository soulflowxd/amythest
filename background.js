const DEFAULTS = {
  blockedSites: ["instagram.com", "tiktok.com", "x.com", "youtube.com"],
  siteLimits: {}, focusUntil: 0, pausedUntil: 0, sessionMinutes: 25,
  dailyGoalMinutes: 120, workHoursEnabled: false, workStart: "09:00", workEnd: "17:00",
  blockShorts: true, hideShortsFeed: true, checkLongForm: true, videoAccess: {}
};
let active = null;
let recording = Promise.resolve();
let syncing = Promise.resolve();

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
  const domains = new Set(scheduled ? settings.blockedSites.filter(site => !(settings.checkLongForm && site === "youtube.com")) : []);
  for (const [site, limit] of Object.entries(settings.siteLimits)) {
    const spent = Object.entries(usage).filter(([domain]) => matches(domain, site)).reduce((sum, [, ms]) => sum + ms, 0);
    if (spent >= limit * 60000) domains.add(site);
  }
  return [...domains].slice(0, 200);
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
    const data = await chrome.storage.local.get([key, hourKey]);
    const usage = data[key] || {};
    usage[current.domain] = (usage[current.domain] || 0) + elapsed;
    const hoursBySite = data[hourKey] || {};
    const hours = hoursBySite[current.domain] || Array(24).fill(0);
    hours[new Date(since).getHours()] += elapsed;
    hoursBySite[current.domain] = hours;
    await chrome.storage.local.set({ [key]: usage, [hourKey]: hoursBySite });
  });
  return recording;
}
async function refreshActive() {
  await recordElapsed();
  const window = await chrome.windows.getLastFocused();
  if (!window.focused) { active = null; return; }
  const [tab] = await chrome.tabs.query({ active: true, windowId: window.id });
  const domain = hostname(tab?.url);
  active = domain ? { domain, since: Date.now() } : null;
}
async function applyRules() {
  const settings = await chrome.storage.local.get(DEFAULTS);
  const validAccess = Object.fromEntries(Object.entries(settings.videoAccess).filter(([, entry]) => entry.until > Date.now()));
  if (Object.keys(validAccess).length !== Object.keys(settings.videoAccess).length) await chrome.storage.local.set({ videoAccess: validAccess });
  const data = await chrome.storage.local.get(`usage:${dateKey()}`);
  const domains = blockedDomains(settings, data[`usage:${dateKey()}`] || {});
  const current = await chrome.declarativeNetRequest.getDynamicRules();
  const addRules = domains.map((domain, i) => ({
    id: i + 1, priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: `||${domain}^`, resourceTypes: ["main_frame"] }
  }));
  if (settings.blockShorts) addRules.push({
    id: 10000, priority: 2,
    action: { type: "redirect", redirect: { extensionPath: "/shorts-blocked.html" } },
    condition: { regexFilter: "^https?://(www\\.|m\\.)?youtube\\.com/shorts(?:/|\\?|$)", resourceTypes: ["main_frame"] }
  });
  const currentById = new Map(current.map(rule => [rule.id, rule]));
  const unchanged = current.length === addRules.length && addRules.every(rule => {
    const saved = currentById.get(rule.id);
    return saved?.condition.urlFilter === rule.condition.urlFilter &&
      saved?.condition.regexFilter === rule.condition.regexFilter &&
      saved?.action.type === rule.action.type &&
      saved?.action.redirect?.extensionPath === rule.action.redirect.extensionPath;
  });
  if (!unchanged) {
    if (current.length) await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: current.map(r => r.id) });
    if (addRules.length) await chrome.declarativeNetRequest.updateDynamicRules({ addRules });
  }
  await chrome.action.setBadgeText({ text: domains.length ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#7556b8" });
  const tabs = await chrome.tabs.query({ active: true });
  for (const tab of tabs) {
    const domain = hostname(tab.url);
    if (domain && domains.some(site => matches(domain, site))) {
      await chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("blocked.html") });
    }
  }
}
async function gateYouTubeTab(tab) {
  if (!tab?.id || !tab.url) return;
  const settings = await chrome.storage.local.get(DEFAULTS);
  if (settings.blockShorts && youtubeShorts(tab.url)) {
    await chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("shorts-blocked.html") });
    return;
  }
  const video = youtubeVideo(tab.url);
  if (!video) return;
  if (!settings.checkLongForm || settings.videoAccess[video.id]?.until > Date.now()) return;
  await chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(`video-gate.html?target=${encodeURIComponent(video.url)}`) });
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
function syncRules() {
  syncing = syncing.catch(() => {}).then(applyRules);
  return syncing;
}
async function init() {
  const stored = await chrome.storage.local.get(null);
  const missing = Object.fromEntries(Object.entries(DEFAULTS).filter(([key]) => stored[key] === undefined));
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
  chrome.alarms.create("heartbeat", { periodInMinutes: 1 });
  await syncRules();
  await refreshActive();
}
chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);
chrome.tabs.onActivated.addListener(async info => {
  try { await refreshActive(); await gateYouTubeTab(await chrome.tabs.get(info.tabId)); }
  catch (error) { console.error("Could not check active tab", error); }
});
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (change.url) {
    if (tab.active) refreshActive().catch(error => console.error("Could not track active tab", error));
    gateYouTubeTab(tab).catch(error => console.error("Could not check video", error));
  }
});
chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
  if (details.frameId === 0) chrome.tabs.get(details.tabId).then(gateYouTubeTab).catch(error => console.error("Could not check video navigation", error));
}, { url: [{ hostSuffix: "youtube.com" }] });
chrome.tabs.onRemoved.addListener(refreshActive);
chrome.windows.onFocusChanged.addListener(refreshActive);
chrome.alarms.onAlarm.addListener(async () => { await recordElapsed(); await syncRules(); });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && Object.keys(changes).some(key => ["blockedSites", "siteLimits", "focusUntil", "pausedUntil", "workHoursEnabled", "workStart", "workEnd", "blockShorts", "checkLongForm"].includes(key) || key.startsWith("usage:"))) syncRules();
  if (area === "local" && (changes.blockShorts || changes.checkLongForm)) chrome.tabs.query({ active: true }).then(tabs => Promise.all(tabs.map(gateYouTubeTab))).catch(error => console.error("Could not check open videos", error));
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "flushUsage") recordElapsed().then(() => sendResponse({ ok: true }));
  else if (message.type === "syncRules") syncRules().then(() => sendResponse({ ok: true }));
  else if (message.type === "requestVideoAccess") grantVideoAccess(message).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});
init();
