function isDistraction(domain, blockedSites) {
  return blockedSites.some(site => domain === site || domain.endsWith(`.${site}`));
}
function distractionUsage(usage, blockedSites) {
  return Object.fromEntries(Object.entries(usage).filter(([domain]) => isDistraction(domain, blockedSites)));
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
