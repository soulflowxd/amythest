async function updateShortsVisibility() {
  const { hideShortsFeed = true } = await chrome.storage.local.get("hideShortsFeed");
  document.documentElement.classList.toggle("amythest-hide-shorts", hideShortsFeed);
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.hideShortsFeed) updateShortsVisibility();
});
updateShortsVisibility();
