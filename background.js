const DEFAULTS = {
  blockedSites: ["instagram.com", "tiktok.com", "x.com", "youtube.com"],
  siteLimits: {}, focusUntil: 0, pausedUntil: 0, sessionMinutes: 25,
  dailyGoalMinutes: 120, workHoursEnabled: false, workStart: "09:00", workEnd: "17:00"
};
let active = null;
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
  const domains = new Set(scheduled ? settings.blockedSites : []);
  for (const [site, limit] of Object.entries(settings.siteLimits)) {
    const spent = Object.entries(usage).filter(([domain]) => matches(domain, site)).reduce((sum, [, ms]) => sum + ms, 0);
    if (spent >= limit * 60000) domains.add(site);
  }
  return [...domains].slice(0, 200);
}
async function recordElapsed() {
  if (!active) return;
  const now = Date.now();
  const elapsed = Math.max(0, Math.min(now - active.since, 5 * 60 * 1000));
  if (elapsed >= 1000) {
    const key = `usage:${dateKey(active.since)}`;
    const data = await chrome.storage.local.get(key);
    const usage = data[key] || {};
    usage[active.domain] = (usage[active.domain] || 0) + elapsed;
    await chrome.storage.local.set({ [key]: usage });
  }
  active.since = now;
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
  const data = await chrome.storage.local.get(`usage:${dateKey()}`);
  const domains = blockedDomains(settings, data[`usage:${dateKey()}`] || {});
  const current = await chrome.declarativeNetRequest.getDynamicRules();
  const addRules = domains.map((domain, i) => ({
    id: i + 1, priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: `||${domain}^`, resourceTypes: ["main_frame"] }
  }));
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: current.map(r => r.id), addRules });
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
chrome.tabs.onUpdated.addListener((_id, change, tab) => { if (change.url && tab.active) refreshActive(); });
chrome.tabs.onRemoved.addListener(refreshActive);
chrome.windows.onFocusChanged.addListener(refreshActive);
chrome.alarms.onAlarm.addListener(async () => { await recordElapsed(); await syncRules(); });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && Object.keys(changes).some(key => ["blockedSites", "siteLimits", "focusUntil", "pausedUntil", "workHoursEnabled", "workStart", "workEnd"].includes(key) || key.startsWith("usage:"))) syncRules();
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "flushUsage") recordElapsed().then(() => sendResponse({ ok: true }));
  else if (message.type === "syncRules") syncRules().then(() => sendResponse({ ok: true }));
  return true;
});
init();
