function isDistraction(domain, blockedSites) {
  return blockedSites.some(site => domain === site || domain.endsWith(`.${site}`));
}
function distractionUsage(usage, blockedSites) {
  return Object.fromEntries(Object.entries(usage).filter(([domain]) => isDistraction(domain, blockedSites)));
}
function distractionTime(usage, blockedSites, videoUsage = {}) {
  const siteTime = Object.values(distractionUsage(usage, blockedSites)).reduce((sum, ms) => sum + ms, 0);
  const extraVideoTime = Object.entries(videoUsage).reduce((sum, [domain, ms]) => sum + (isDistraction(domain, blockedSites) ? 0 : ms), 0);
  return siteTime + extraVideoTime;
}
function avatarMood(distractionMs, goalMinutes) {
  const ratio = distractionMs / (Math.max(1, goalMinutes) * 60000);
  return ratio >= .75 ? "sad" : ratio >= .25 ? "idle" : "happy";
}
function showAvatarMood(avatar, mood) {
  if (!avatar || avatar.dataset.mood === mood) return;
  avatar.dataset.mood = mood;
  customElements.whenDefined("amythest-avatar").then(() => {
    if (avatar.isConnected && avatar.dataset.mood === mood) avatar.setState(mood);
  });
}
function distractionHours(hoursBySite, blockedSites) {
  const result = Array(24).fill(0);
  for (const [domain, hours] of Object.entries(hoursBySite)) {
    if (isDistraction(domain, blockedSites)) hours.forEach((ms, hour) => { result[hour] += ms; });
  }
  return result;
}
function allHours(hoursBySite) {
  return distractionHours(hoursBySite, Object.keys(hoursBySite));
}
