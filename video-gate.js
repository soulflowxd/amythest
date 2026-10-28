const target = new URLSearchParams(location.search).get("target");
const form = document.getElementById("reason-form");
const error = document.getElementById("gate-error");
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({
      type: "requestVideoAccess", url: target,
      category: document.getElementById("purpose").value,
      reason: document.getElementById("reason").value
    });
    if (!result?.ok) { error.textContent = result?.error || "Could not open this video. Please try again."; return; }
    location.replace(result.url);
  } catch {
    error.textContent = "Could not open this video. Please try again.";
  } finally { button.disabled = false; }
});
document.getElementById("close-tab").addEventListener("click", async () => {
  const tab = await chrome.tabs.getCurrent();
  if (tab) chrome.tabs.remove(tab.id);
});
