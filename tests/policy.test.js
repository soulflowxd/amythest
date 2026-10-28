const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("background.js", "utf8").split("async function recordElapsed")[0];
const policy = vm.runInNewContext(`${source}\n({ isWorkTime, blockedDomains })`);
const base = {
  blockedSites: ["youtube.com"], siteLimits: { "example.com": 30 },
  focusUntil: 0, pausedUntil: 0, workHoursEnabled: true,
  workStart: "09:00", workEnd: "17:00"
};
const mondayMorning = new Date(2026, 9, 26, 10).getTime();
const sundayMorning = new Date(2026, 9, 25, 10).getTime();
assert.equal(policy.isWorkTime(base, new Date(mondayMorning)), true);
assert.equal(policy.isWorkTime(base, new Date(sundayMorning)), false);
assert.deepEqual([...policy.blockedDomains(base, {}, mondayMorning)], ["youtube.com"]);
assert.deepEqual([...policy.blockedDomains(base, { "www.example.com": 20 * 60000, "mail.example.com": 10 * 60000 }, sundayMorning)], ["example.com"]);
assert.deepEqual([...policy.blockedDomains({ ...base, pausedUntil: mondayMorning + 300000 }, { "example.com": 31 * 60000 }, mondayMorning)], []);
console.log("Policy checks passed");
