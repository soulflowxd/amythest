const remaining=document.getElementById("remaining");
document.getElementById("back").addEventListener("click",()=>{ if(history.length>1) history.back(); else chrome.tabs.getCurrent(tab=>chrome.tabs.remove(tab.id)); });
document.getElementById("break").addEventListener("click",async()=>{ await chrome.storage.local.set({ pausedUntil:Date.now()+5*60000 }); await chrome.runtime.sendMessage({ type:"syncRules" }); remaining.textContent="Break started. You can return to the site for 5 minutes."; });
async function update(){ const {focusUntil=0}=await chrome.storage.local.get("focusUntil"); const minutes=Math.max(0,Math.ceil((focusUntil-Date.now())/60000)); if(!remaining.textContent.startsWith("Break")) remaining.textContent=minutes?`${minutes} minutes left in your focus session`:"Your focus session has ended."; }
update(); setInterval(update,30000);
