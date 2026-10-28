const DEFAULTS = { blockedSites: ["instagram.com", "tiktok.com", "x.com", "youtube.com"], focusUntil: 0, pausedUntil: 0, sessionMinutes: 25, dailyGoalMinutes: 120 };
let active = null;

function dateKey(time = Date.now()) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hostname(url) {
  try { const u = new URL(url); return ["http:", "https:"].includes(u.protocol) ? u.hostname.replace(/^www\./, "") : null; }
  catch { return null; }
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

async function syncRules() {
  const { blockedSites = DEFAULTS.blockedSites, focusUntil = 0, pausedUntil = 0 } = await chrome.storage.local.get(DEFAULTS);
  const current = await chrome.declarativeNetRequest.getDynamicRules();
  const enabled = focusUntil > Date.now() && pausedUntil <= Date.now();
  const addRules = enabled ? blockedSites.slice(0, 100).map((domain, i) => ({
    id: i + 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: `||${domain}^`, resourceTypes: ["main_frame"] }
  })) : [];
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: current.map(r => r.id), addRules });
  await chrome.action.setBadgeText({ text: enabled ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#7556b8" });
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
  if (area === "local" && ["blockedSites", "focusUntil", "pausedUntil"].some(key => changes[key])) syncRules();
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "flushUsage") recordElapsed().then(() => sendResponse({ ok: true }));
  else if (message.type === "syncRules") syncRules().then(() => sendResponse({ ok: true }));
  return true;
});

init();
