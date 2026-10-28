const $ = id => document.getElementById(id);
const fmt = ms => { const m = Math.floor(ms/60000); return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`; };
const dateKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
let state = {};

async function render() {
  await chrome.runtime.sendMessage({ type: "flushUsage" });
  state = await chrome.storage.local.get(["blockedSites", "focusUntil", "sessionMinutes", "dailyGoalMinutes", `usage:${dateKey()}`]);
  const usage = state[`usage:${dateKey()}`] || {};
  const rows = Object.entries(usage).sort((a,b) => b[1]-a[1]);
  const total = rows.reduce((sum, row) => sum+row[1], 0);
  $("daily-total").textContent = fmt(total);
  $("date-label").textContent = new Intl.DateTimeFormat("en", { weekday:"long", month:"long", day:"numeric" }).format(new Date());
  $("goal-progress").style.width = `${Math.min(100, total / ((state.dailyGoalMinutes || 120)*60000)*100)}%`;
  $("goal-caption").textContent = `${fmt(total)} of ${fmt((state.dailyGoalMinutes || 120)*60000)} daily goal`;
  $("duration").value = state.sessionMinutes || 25;
  $("goal").value = state.dailyGoalMinutes || 120;
  $("site-usage").replaceChildren();
  rows.slice(0,8).forEach(([domain, ms]) => {
    const row = document.createElement("div"); row.className="usage-row";
    const name = document.createElement("span"); name.textContent=domain;
    const time = document.createElement("strong"); time.textContent=fmt(ms);
    row.append(name,time); $("site-usage").append(row);
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
  const remaining = Math.max(0,(state.focusUntil || 0)-Date.now());
  $("start-focus").innerHTML = remaining ? 'End focus session <span>×</span>' : 'Start a focus session <span>→</span>';
  $("focus-status").textContent = remaining ? `${Math.ceil(remaining/60000)} minutes remaining. You have this.` : "No session running. Start whenever you're ready.";
}

$("add-site").addEventListener("submit", async e => {
  e.preventDefault();
  let value=$("site-input").value.trim().toLowerCase();
  try { if (!value.includes("://")) value=`https://${value}`; value=new URL(value).hostname.replace(/^www\./,""); }
  catch { $("form-error").textContent="Enter a website like example.com."; return; }
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(value)) { $("form-error").textContent="Enter a website like example.com."; return; }
  if ((state.blockedSites || []).includes(value)) { $("form-error").textContent="That site is already on your list."; return; }
  if ((state.blockedSites || []).length >= 100) { $("form-error").textContent="Your list can hold up to 100 sites."; return; }
  $("form-error").textContent=""; $("site-input").value="";
  await chrome.storage.local.set({ blockedSites:[...(state.blockedSites || []),value] }); render();
});
$("duration").addEventListener("change", e => chrome.storage.local.set({ sessionMinutes:Number(e.target.value) }));
$("goal").addEventListener("change", e => chrome.storage.local.set({ dailyGoalMinutes:Number(e.target.value) }));
$("start-focus").addEventListener("click", async () => {
  const focused=(state.focusUntil || 0)>Date.now();
  await chrome.storage.local.set({ focusUntil:focused?0:Date.now()+(state.sessionMinutes || 25)*60000, pausedUntil:0 });
  await chrome.runtime.sendMessage({ type:"syncRules" }); render();
});
render(); setInterval(render,30000);
