const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("background.js", "utf8").split("function recordElapsed()")[0];
const policy = vm.runInNewContext(`${source}\n({ youtubeVideo, youtubeShorts, youtubeShortId, validVideoReason, blockedDomains })`, { URL, Date });
assert.equal(policy.youtubeVideo("https://www.youtube.com/watch?v=abcdefghijk").id, "abcdefghijk");
assert.equal(policy.youtubeVideo("https://m.youtube.com/live/abcdefghijk").id, "abcdefghijk");
assert.equal(policy.youtubeVideo("https://notyoutube.com/watch?v=abcdefghijk"), null);
assert.equal(policy.youtubeShorts("https://www.youtube.com/shorts/abcdefghijk"), true);
assert.equal(policy.youtubeShortId("https://www.youtube.com/shorts/abcdefghijk"), "abcdefghijk");
assert.equal(policy.youtubeShortId("https://www.youtube.com/shorts/"), null);
assert.equal(policy.youtubeShorts("https://www.youtube.com/watch?v=abcdefghijk"), false);
assert.equal(policy.validVideoReason("robotics", "I need this wiring tutorial for my sensor."), true);
assert.equal(policy.validVideoReason("school", "because I said so"), false);
const settings = { blockedSites: ["youtube.com", "instagram.com"], siteLimits: {}, focusUntil: Date.now() + 60000, pausedUntil: 0, checkLongForm: true, workHoursEnabled: false };
assert.deepEqual([...policy.blockedDomains(settings, {})], ["instagram.com"]);
console.log("Video policy checks passed");
