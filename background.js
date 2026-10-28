const DEFAULTS = {
  blockedSites: ["instagram.com", "tiktok.com", "x.com", "youtube.com"],
  siteLimits: {}, focusUntil: 0, pausedUntil: 0, sessionMinutes: 25,
  dailyGoalMinutes: 120, workHoursEnabled: false, workStart: "09:00", workEnd: "17:00",
  blockShorts: true, hideShortsFeed: true, checkLongForm: true, videoAccess: {}, shortAccess: {}
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
chrome.tabs.onActivated.addListener(refreshActive);
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (change.url && tab.active) refreshActive().catch(error => console.error("Could not track active tab", error));
});
chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
  if (details.frameId === 0) chrome.tabs.sendMessage(details.tabId, { type: "policyChanged" }).catch(() => {});
}, { url: [{ hostSuffix: "youtube.com" }, { hostSuffix: "instagram.com" }, { hostSuffix: "tiktok.com" }] });
chrome.tabs.onRemoved.addListener(refreshActive);
chrome.windows.onFocusChanged.addListener(refreshActive);
chrome.alarms.onAlarm.addListener(async () => { await recordElapsed(); await syncRules(); });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && Object.keys(changes).some(key => ["blockedSites", "siteLimits", "focusUntil", "pausedUntil", "workHoursEnabled", "workStart", "workEnd", "blockShorts", "checkLongForm"].includes(key) || key.startsWith("usage:"))) syncRules();
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "flushUsage") recordElapsed().then(() => sendResponse({ ok: true }));
  else if (message.type === "syncRules") syncRules().then(() => sendResponse({ ok: true }));
  else if (message.type === "getSitePolicy") policyForUrl(message.url).then(sendResponse).catch(error => sendResponse({ mode: "allow", error: error.message }));
  else if (message.type === "requestVideoAccess") grantVideoAccess(message).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  else if (message.type === "requestShortAccess") grantShortAccess(message).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});
init();
