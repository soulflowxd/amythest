const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const source = fs.readFileSync("background.js", "utf8").split("function syncRules()")[0];

test("strict work sites override breaks and video approvals; daily quota persists and serializes", async () => {
  let now = new Date(2026, 10, 9, 10).getTime();
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const saved = { blockedSites: ["example.com"], workHoursEnabled: true,
    strictWorkSites: ["youtube.com", "instagram.com"], dailyBreakLimit: 1,
    videoAccess: { abcdefghijk: { until: now + 999999 } },
    shortAccess: { "instagram:ABC": { until: now + 999999 } }, pausedUntil: now + 60000 };
  const chrome = { storage: { local: {
    get: async keys => typeof keys === "string" ? { [keys]: saved[keys] } : { ...keys, ...saved },
    set: async values => Object.assign(saved, values)
  } } };
  const makeContext = () => { const c = vm.createContext({ chrome, Date: Clock, URL, console }); vm.runInContext(source, c); return c; };
  let context = makeContext();
  const run = code => vm.runInContext(code, context);
  assert.equal(run("breakAllowance({}).dailyBreakLimit"), 3);
  const video = "https://www.youtube.com/watch?v=abcdefghijk";
  assert.equal((await run(`policyForUrl('${video}')`)).strictWork, true);
  assert.equal((await run("policyForUrl('https://m.youtube.com/shorts/abcdefghijk')")).mode, "block");
  assert.equal((await run("policyForUrl('https://instagram.com/reel/ABC/')")).strictWork, true);
  assert.equal((await run("grantBreak('https://youtube.com/')")).ok, false);
  assert.equal((await run(`grantVideoAccess({url:'${video}',category:'school',reason:'I need this tutorial for class.'})`)).ok, false);
  assert.equal((await run("grantShortAccess({url:'https://instagram.com/reel/ABC/',category:'school',reason:'I need this example for class.'})")).ok, false);
  assert.equal((await run("policyForUrl('https://notyoutube.com/')")).mode, "allow");
  assert.equal(run("blockedDomains({...DEFAULTS,..." + JSON.stringify(saved) + "},{})").includes("youtube.com"), true);
  now = new Date(2026, 10, 9, 18).getTime();
  assert.equal((await run("policyForUrl('https://youtube.com/')")).mode, "allow");
  now = new Date(2026, 10, 9, 10).getTime(); saved.pausedUntil = 0;
  const results = await Promise.all([run("grantBreak('https://example.com/')"), run("grantBreak('https://example.com/')")]);
  assert.equal(results[0].ok, true); assert.equal(results[1].until, results[0].until);
  assert.equal(saved.breakUsage.count, 1);
  const originalUntil = saved.pausedUntil;
  now += 10000;
  assert.equal((await run("grantBreak('https://example.com/')")).until, originalUntil);
  now = originalUntil + 1;
  context = makeContext(); // service-worker restart must not replenish the quota
  assert.equal((await run("grantBreak('https://example.com/')")).ok, false);
  assert.equal((await run("policyForUrl('https://example.com/')")).breaksRemaining, 0);
  now = new Date(2026, 10, 10, 10).getTime();
  assert.equal((await run("grantBreak('https://example.com/')")).ok, true);
  assert.equal(saved.breakUsage.count, 1);
  now = saved.pausedUntil + 1; saved.dailyBreakLimit = 0;
  assert.equal((await run("grantBreak('https://example.com/')")).ok, false);
  saved.dailyBreakLimit = 3;
  assert.equal((await run("grantBreak('https://example.com/')")).ok, true);
  now = saved.pausedUntil + 1;
  assert.equal((await run("grantBreak('https://example.com/')")).ok, true);
  assert.equal(saved.breakUsage.count, 3);
  now = saved.pausedUntil + 1;
  assert.equal((await run("grantBreak('https://example.com/')")).ok, false);
  now = new Date(2026, 10, 14, 10).getTime();
  assert.equal((await run("policyForUrl('https://youtube.com/')")).mode, "allow");
  saved.workStart = "22:00"; saved.workEnd = "06:00";
  now = new Date(2026, 10, 14, 2).getTime(); // Friday's overnight schedule
  assert.equal((await run("policyForUrl('https://youtube.com/')")).strictWork, true);
  now = new Date(2026, 10, 14, 6).getTime();
  assert.equal((await run("policyForUrl('https://youtube.com/')")).mode, "allow");
});
