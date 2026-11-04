const $ = id => document.getElementById(id);
const fmt = ms => { const m = Math.floor(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
const dateKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
let settings = {};

async function render() {
  await chrome.runtime.sendMessage({ type: "flushUsage" });
  const data = await chrome.storage.local.get(["focusUntil", "pausedUntil", "sessionMinutes", "hardModeEnabled", "hardModeUntil", "dailyGoalMinutes", "blockedSites", `usage:${dateKey()}`, `videoUsage:${dateKey()}`]);
  settings = data;
  const remaining = Math.max(0, (data.focusUntil || 0) - Date.now());
  const focused = remaining > 0;
  const paused = focused && (data.pausedUntil || 0) > Date.now();
  $("focus-title").textContent = paused ? "Taking a breath" : focused ? "You're in focus mode" : "Ready to focus?";
  $("focus-subtitle").textContent = paused ? "Your break ends soon." : focused ? "Your distractions can wait." : "A little intention goes a long way.";
  const seconds = Math.ceil(remaining / 1000);
  $("timer").textContent = focused ? `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}` : `${data.sessionMinutes || 25}:00`;
  $("timer-caption").textContent = focused ? "Remaining in this session" : "Focus session length";
  const hard = focused && data.hardModeUntil > Date.now();
  $("focus-button").textContent = hard ? "Hard Mode active" : focused ? "End focus session" : "Start focus session";
  $("focus-button").disabled = hard;
  hardControl.querySelector("input").checked = !!data.hardModeEnabled;
  hardControl.querySelector("input").disabled = focused;
  const usage = data[`usage:${dateKey()}`] || {};
  const rows = Object.entries(usage).sort((a,b) => b[1]-a[1]);
  const distractionTotal = distractionTime(usage, data.blockedSites || [], data[`videoUsage:${dateKey()}`] || {});
  showGeode($("popup-geode"), distractionTotal, data.dailyGoalMinutes || 120);
  showAvatarMood($("avatar"), avatarMood(distractionTotal, data.dailyGoalMinutes || 120));
  $("total-time").textContent = fmt(rows.reduce((sum, row) => sum + row[1], 0));
  $("site-count").textContent = rows.length;
  $("distraction-caption").textContent = `Distractions: ${fmt(distractionTotal)} of ${fmt((data.dailyGoalMinutes || 120) * 60000)} goal`;
  $("today-date").textContent = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date());
  $("usage-list").replaceChildren();
  rows.slice(0,3).forEach(([domain, ms]) => {
    const row = document.createElement("div"); row.className = "usage-row";
    const name = document.createElement("span"); name.textContent = domain;
    const time = document.createElement("strong"); time.textContent = fmt(ms);
    row.append(name,time); $("usage-list").append(row);
  });
  if (!rows.length) $("usage-list").innerHTML = '<div class="empty">Your day is a blank canvas.</div>';
  document.body.removeAttribute("data-loading");
}

const hardControl = document.createElement("label");
hardControl.className = "hard-mode-control";
hardControl.innerHTML = '<input type="checkbox"> Hard Mode <small>Stays on for every focus session until you turn it off. No early stop or breaks while active. Device permissions can still be changed.</small>';
$("focus-button").before(hardControl);
hardControl.querySelector("input").addEventListener("change", event => chrome.storage.local.set({ hardModeEnabled: event.target.checked }));
$("focus-button").addEventListener("click", async () => {
  const focused = (settings.focusUntil || 0) > Date.now();
  if (focused && settings.hardModeUntil > Date.now()) return;
  const until = focused ? 0 : Date.now() + (settings.sessionMinutes || 25) * 60000;
  await chrome.storage.local.set({ focusUntil: until, hardModeUntil: !focused && settings.hardModeEnabled ? until : 0, pausedUntil: 0 });
  await chrome.runtime.sendMessage({ type: "syncRules" });
  render();
});
$("dashboard").addEventListener("click", () => chrome.runtime.openOptionsPage());
$("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
render();
setInterval(() => {
  const remaining = Math.max(0, (settings.focusUntil || 0) - Date.now());
  if (remaining) { const seconds = Math.ceil(remaining / 1000); $("timer").textContent = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`; }
}, 1000);
setInterval(render, 15000);
