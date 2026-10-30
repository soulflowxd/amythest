const $ = id => document.getElementById(id);
const fmt = ms => { const m = Math.floor(ms/60000); return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`; };
const dateKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
let state = {};
let chartView = "day";
const keyFor = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function parseDomain(raw) {
  let value = raw.trim().toLowerCase();
  try { if (!value.includes("://")) value = `https://${value}`; value = new URL(value).hostname.replace(/^www\./, ""); }
  catch { return null; }
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(value) ? value : null;
}

async function render() {
  await chrome.runtime.sendMessage({ type: "flushUsage" });
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - (6-i)); return d; });
  const keys = days.flatMap(d => [`usage:${keyFor(d)}`, `videoUsage:${keyFor(d)}`, `hours:${keyFor(d)}`, `hoursBySite:${keyFor(d)}`]);
  state = await chrome.storage.local.get(["blockedSites", "siteLimits", "focusUntil", "sessionMinutes", "dailyGoalMinutes", "workHoursEnabled", "workStart", "workEnd", "blockShorts", "hideShortsFeed", "checkLongForm", ...keys]);
  const usage = chartView === "day" ? (state[`usage:${dateKey()}`] || {}) : days.reduce((sum, d) => { for (const [site, ms] of Object.entries(state[`usage:${keyFor(d)}`] || {})) sum[site] = (sum[site] || 0) + ms; return sum; }, {});
  const rows = Object.entries(usage).sort((a,b) => b[1]-a[1]);
  const total = rows.reduce((sum, row) => sum+row[1], 0);
  const videoUsage = chartView === "day" ? (state[`videoUsage:${dateKey()}`] || {}) : days.reduce((sum, d) => { for (const [site, ms] of Object.entries(state[`videoUsage:${keyFor(d)}`] || {})) sum[site] = (sum[site] || 0) + ms; return sum; }, {});
  const distractionTotal = distractionTime(usage, state.blockedSites || [], videoUsage);
  const todayDistractionTime = distractionTime(state[`usage:${dateKey()}`] || {}, state.blockedSites || [], state[`videoUsage:${dateKey()}`] || {});
  showAvatarMood(document.querySelector(".intro-avatar"), avatarMood(todayDistractionTime, state.dailyGoalMinutes || 120));
  $("daily-total").textContent = fmt(total);
  $("date-label").textContent = chartView === "day" ? new Intl.DateTimeFormat("en", { weekday:"long", month:"long", day:"numeric" }).format(new Date()) : `${new Intl.DateTimeFormat("en", { month:"short", day:"numeric" }).format(days[0])} – ${new Intl.DateTimeFormat("en", { month:"short", day:"numeric" }).format(days[6])}`;
  $("chart-subtitle").textContent = chartView === "day" ? "Today in Chrome" : "Last 7 days in Chrome";
  const goalMs = (state.dailyGoalMinutes || 120) * 60000 * (chartView === "week" ? 7 : 1);
  $("goal-progress").style.width = `${Math.min(100, distractionTotal / goalMs * 100)}%`;
  $("goal-caption").textContent = `${fmt(distractionTotal)} / ${fmt(goalMs)}`;
  $("secondary-label").textContent = chartView === "day" ? "Most used" : "Daily average";
  $("secondary-value").textContent = chartView === "day" ? (rows[0]?.[0] || "—") : fmt(total / 7);
  $("view-day").classList.toggle("selected", chartView === "day");
  $("view-week").classList.toggle("selected", chartView === "week");
  $("view-day").setAttribute("aria-pressed", chartView === "day" ? "true" : "false");
  $("view-week").setAttribute("aria-pressed", chartView === "week" ? "true" : "false");
  const bySite = state[`hoursBySite:${dateKey()}`] || {};
  const values = chartView === "day" ? allHours(bySite).map((ms, i) => ms + (state[`hours:${dateKey()}`]?.[i] || 0)) : days.map(d => Object.values(state[`usage:${keyFor(d)}`] || {}).reduce((sum, ms) => sum + ms, 0));
  const max = Math.max(...values, chartView === "day" ? 30 * 60000 : 2 * 60 * 60000);
  $("axis-top").textContent = fmt(max);
  $("axis-mid").textContent = fmt(max / 2);
  $("activity-chart").replaceChildren();
  $("activity-chart").classList.toggle("weekly", chartView === "week");
  values.forEach((ms, i) => {
    const item = document.createElement("div"); item.className = "chart-item";
    const bar = document.createElement("div"); bar.className = "chart-bar";
    bar.style.height = `${Math.max(ms ? 3 : 0, ms / max * 100)}%`;
    const label = document.createElement("span"); label.textContent = chartView === "day" ? (i % 4 === 0 ? `${i}` : "") : new Intl.DateTimeFormat("en", { weekday:"short" }).format(days[i]).slice(0,1);
    item.title = chartView === "day" ? `${i}:00–${i+1}:00: ${fmt(ms)}` : `${days[i].toDateString()}: ${fmt(ms)}`;
    item.append(bar,label); $("activity-chart").append(item);
  });
  $("activity-chart").setAttribute("aria-label", chartView === "day" ? `Hourly screen time today, ${fmt(total)} total` : `Daily screen time over 7 days, ${fmt(total)} total`);
  $("duration").value = state.sessionMinutes || 25;
  $("goal").value = state.dailyGoalMinutes || 120;
  $("work-enabled").checked = !!state.workHoursEnabled;
  $("work-start").value = state.workStart || "09:00";
  $("work-end").value = state.workEnd || "17:00";
  $("work-status").textContent = state.workHoursEnabled ? "Your distraction list is blocked Monday through Friday during these hours." : "Work hours are off.";
  $("block-shorts").checked = state.blockShorts !== false;
  $("hide-shorts-feed").checked = state.hideShortsFeed !== false;
  $("check-long-form").checked = state.checkLongForm !== false;
  $("site-usage").replaceChildren();
  rows.slice(0,8).forEach(([domain, ms]) => {
    const row = document.createElement("div"); row.className="usage-row";
    const name = document.createElement("span"); name.textContent=domain;
    const type = document.createElement("small"); type.className = "site-type";
    type.textContent = isDistraction(domain, state.blockedSites || []) ? "Counts toward goal" : videoUsage[domain] ? "Video time counts toward goal" : "Tracked only";
    const time = document.createElement("strong"); time.textContent=fmt(ms);
    const info = document.createElement("div"); info.className = "site-info"; info.append(name,type);
    row.append(info,time); $("site-usage").append(row);
  });
  if (!rows.length) $("site-usage").innerHTML='<div class="empty">Your browsing story starts here.</div>';
  $("blocked-list").replaceChildren();
  (state.blockedSites || []).forEach(domain => {
    const row=document.createElement("div"); row.className="blocked-row";
    const label=document.createElement("span"); label.textContent=domain;
    const button=document.createElement("button"); button.textContent="Remove"; button.setAttribute("aria-label",`Remove ${domain}`);
    button.addEventListener("click", async () => { await chrome.storage.local.set({ blockedSites: state.blockedSites.filter(s => s !== domain) }); render(); });
    row.append(label,button); $("blocked-list").append(row);
  });
  $("limits-list").replaceChildren();
  Object.entries(state.siteLimits || {}).sort((a,b) => a[0].localeCompare(b[0])).forEach(([domain, minutes]) => {
    const row = document.createElement("div"); row.className = "blocked-row";
    const label = document.createElement("span"); label.textContent = `${domain} · ${minutes} min/day`;
    const button = document.createElement("button"); button.textContent = "Remove"; button.setAttribute("aria-label", `Remove limit for ${domain}`);
    button.addEventListener("click", async () => { const siteLimits = { ...state.siteLimits }; delete siteLimits[domain]; await chrome.storage.local.set({ siteLimits }); render(); });
    row.append(label, button); $("limits-list").append(row);
  });
  if (!Object.keys(state.siteLimits || {}).length) $("limits-list").innerHTML = '<div class="empty">No limits set yet.</div>';
  const remaining = Math.max(0,(state.focusUntil || 0)-Date.now());
  $("start-focus").textContent = remaining ? 'End focus session' : 'Start a focus session';
  $("focus-status").textContent = remaining ? `${Math.ceil(remaining/60000)} minutes remaining. You have this.` : "No session running. Start whenever you're ready.";
  document.body.removeAttribute("data-loading");
}

$("add-site").addEventListener("submit", async e => {
  e.preventDefault();
  const value = parseDomain($("site-input").value);
  if (!value) { $("form-error").textContent="Enter a website like example.com."; return; }
  if ((state.blockedSites || []).includes(value)) { $("form-error").textContent="That site is already on your list."; return; }
  if ((state.blockedSites || []).length >= 100) { $("form-error").textContent="Your list can hold up to 100 sites."; return; }
  $("form-error").textContent=""; $("site-input").value="";
  await chrome.storage.local.set({ blockedSites:[...(state.blockedSites || []),value] }); render();
});
$("add-limit").addEventListener("submit", async e => {
  e.preventDefault();
  const domain = parseDomain($("limit-site").value);
  const minutes = Number($("limit-minutes").value);
  if (!domain) { $("limit-error").textContent = "Enter a website like example.com."; return; }
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) { $("limit-error").textContent = "Choose 1 to 1440 minutes."; return; }
  if (!state.siteLimits?.[domain] && Object.keys(state.siteLimits || {}).length >= 100) { $("limit-error").textContent = "You can set up to 100 site limits."; return; }
  $("limit-error").textContent = ""; $("limit-site").value = ""; $("limit-minutes").value = "";
  await chrome.storage.local.set({ siteLimits: { ...(state.siteLimits || {}), [domain]: minutes } }); render();
});
$("work-enabled").addEventListener("change", e => chrome.storage.local.set({ workHoursEnabled: e.target.checked }));
$("work-start").addEventListener("change", e => chrome.storage.local.set({ workStart: e.target.value }));
$("work-end").addEventListener("change", e => chrome.storage.local.set({ workEnd: e.target.value }));
$("block-shorts").addEventListener("change", e => chrome.storage.local.set({ blockShorts: e.target.checked }));
$("hide-shorts-feed").addEventListener("change", e => chrome.storage.local.set({ hideShortsFeed: e.target.checked }));
$("check-long-form").addEventListener("change", e => chrome.storage.local.set({ checkLongForm: e.target.checked }));
$("duration").addEventListener("change", e => chrome.storage.local.set({ sessionMinutes:Number(e.target.value) }));
$("goal").addEventListener("change", e => chrome.storage.local.set({ dailyGoalMinutes:Number(e.target.value) }));
$("start-focus").addEventListener("click", async () => {
  const focused=(state.focusUntil || 0)>Date.now();
  await chrome.storage.local.set({ focusUntil:focused?0:Date.now()+(state.sessionMinutes || 25)*60000, pausedUntil:0 });
  await chrome.runtime.sendMessage({ type:"syncRules" }); render();
});
render(); setInterval(render,30000);
const deviceSummary = document.createElement("div");
deviceSummary.id = "cloud-device-summary";
deviceSummary.className = "cloud-device-summary";
deviceSummary.setAttribute("aria-live", "polite");
$("cloud-actions").after(deviceSummary);
async function renderCloudDevices(signedIn) {
  deviceSummary.replaceChildren();
  if (!signedIn) return;
  const result = await chrome.runtime.sendMessage({ type: "cloudDaySummary" });
  if (!result?.ok) { deviceSummary.textContent = result?.error || "Device totals are unavailable."; return; }
  const heading = document.createElement("strong");
  heading.textContent = "Today across your devices";
  deviceSummary.append(heading);
  if (!result.days.length) deviceSummary.append(" No synced activity yet.");
  for (const day of result.days) {
    const row = document.createElement("div");
    row.className = "cloud-device-row";
    const source = day.source === "chrome" ? "Chrome" : "Windows";
    const minutes = Math.floor((day.activeMs || 0) / 60000);
    row.textContent = `${source} ${String(day.deviceId || "").slice(0, 6)} · ${minutes}m active · ${Math.floor((day.distractionMs || 0) / 60000)}m distractions`;
    deviceSummary.append(row);
  }
  const limits = result.windowsSettings?.appLimits || [];
  const label = document.createElement("strong");
  label.textContent = "Windows app limits";
  deviceSummary.append(label);
  if (!limits.length) deviceSummary.append(" No app limits set.");
  for (const limit of limits) {
    const row = document.createElement("div");
    row.className = "cloud-device-row";
    row.textContent = `${limit.app}.exe · ${limit.minutes} min/day `;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => cloudAction(remove, "cloudSetWindowsLimit", { app: limit.app, minutes: 0 }));
    row.append(remove);
    deviceSummary.append(row);
  }
}
async function renderCloudStatus() {
  const status = await chrome.runtime.sendMessage({ type: "cloudStatus" });
  const configured = !!status?.configured;
  const signedIn = !!status?.signedIn;
  $("cloud-email-form").hidden = !configured || signedIn;
  $("cloud-app-limit-form").hidden = !signedIn;
  $("cloud-actions").hidden = !signedIn;
  $("cloud-reload").hidden = !status?.settingsConflict;
  $("cloud-status").textContent = !configured
    ? "Cloud sync is not configured in this build. Your activity still stays on this device."
    : signedIn
      ? `Signed in as ${status.email}. ${status.lastSyncAt ? `Last synced ${new Date(status.lastSyncAt).toLocaleString()}.` : "Waiting for first sync."}`
      : "Sign in or create an account to sync across devices.";
  $("cloud-message").textContent = status?.settingsConflict
    ? "Settings changed on another device. Reload cloud settings to use that version."
    : status?.error || "";
  await renderCloudDevices(signedIn);
}
async function cloudAction(button, type, fields = {}) {
  button.disabled = true;
  $("cloud-message").textContent = "";
  try {
    const result = await chrome.runtime.sendMessage({ type, ...fields });
    if (!result?.ok && result?.error) throw new Error(result.error);
    return result;
  } catch (error) {
    $("cloud-message").textContent = error.message || "Cloud request failed.";
    return null;
  } finally {
    button.disabled = false;
    await renderCloudStatus();
  }
}
$("cloud-email-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = event.submitter || event.currentTarget.querySelector("button");
  const flow = button.dataset.flow;
  const password = $("cloud-password").value;
  if (await cloudAction(button, "cloudPasswordAuth", { email: $("cloud-email").value, password, flow })) {
    $("cloud-password").value = "";
    await renderCloudStatus();
  }
});
$("cloud-app-limit-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  if (await cloudAction(button, "cloudSetWindowsLimit", { app: $("cloud-app").value, minutes: Number($("cloud-app-minutes").value) })) {
    $("cloud-app").value = "";
    $("cloud-app-minutes").value = "";
  }
});
$("cloud-sync-now").addEventListener("click", event => cloudAction(event.currentTarget, "cloudSyncNow"));
$("cloud-reload").addEventListener("click", event => cloudAction(event.currentTarget, "cloudReloadSettings"));
$("cloud-sign-out").addEventListener("click", async event => {
  await cloudAction(event.currentTarget, "cloudSignOut");
});
renderCloudStatus();
$("view-day").addEventListener("click", () => { chartView = "day"; render(); });
$("view-week").addEventListener("click", () => { chartView = "week"; render(); });
