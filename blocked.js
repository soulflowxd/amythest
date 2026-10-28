const remaining=document.getElementById("remaining");
document.getElementById("back").addEventListener("click",()=>{ if(history.length>1) history.back(); else chrome.tabs.getCurrent(tab=>chrome.tabs.remove(tab.id)); });
document.getElementById("break").addEventListener("click",async()=>{ await chrome.storage.local.set({ pausedUntil:Date.now()+5*60000 }); await chrome.runtime.sendMessage({ type:"syncRules" }); remaining.textContent="Break started. You can return to the site for 5 minutes."; });
async function update(){
  const {focusUntil=0,workHoursEnabled=false,workStart="09:00",workEnd="17:00",siteLimits={}}=await chrome.storage.local.get(["focusUntil","workHoursEnabled","workStart","workEnd","siteLimits"]);
  const minutes=Math.max(0,Math.ceil((focusUntil-Date.now())/60000));
  const now=new Date(), time=now.getHours()*60+now.getMinutes(), start=Number(workStart.slice(0,2))*60+Number(workStart.slice(3)), end=Number(workEnd.slice(0,2))*60+Number(workEnd.slice(3));
  const workTime=workHoursEnabled && now.getDay()>=1 && now.getDay()<=5 && (start<end ? time>=start&&time<end : time>=start||time<end);
  document.getElementById("block-reason").textContent=minutes?"You're in a focus session, so this site is paused.":workTime?"This site is paused during your work hours.":Object.keys(siteLimits).length?"You may have reached today's limit for this site.":"This site is paused right now.";
  if(!remaining.textContent.startsWith("Break")) remaining.textContent=minutes?`${minutes} minutes left in your focus session`:workTime?"Your work hours are active.":"Your daily limit resets tomorrow.";
}
update(); setInterval(update,30000);
