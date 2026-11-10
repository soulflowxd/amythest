const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("site limits block the whole site without adding it to distractions", async () => {
  let now = new Date(2026, 10, 9, 9, 59, 0).getTime();
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const saved = {
    blockedSites: ["instagram.com"], siteLimits: { "youtube.com": 1, "github.com": 1 },
    siteLimitScopes: { "github.com": "work" }, workHoursEnabled: true,
    workStart: "10:00", workEnd: "11:00", checkLongForm: true, blockShorts: true,
    pausedUntil: now + 10 * 60000,
    shortAccess: { "youtube:abcdefghijk": { until: now + 3600000 } },
    videoAccess: { abcdefghijk: { until: now + 3600000 } }
  };
  const chrome = { storage: { local: {
    get: async keys => typeof keys === "string" ? { [keys]: saved[keys] } : Array.isArray(keys)
      ? Object.fromEntries(keys.map(key => [key, saved[key]])) : { ...keys, ...saved },
    set: async values => Object.assign(saved, values)
  } } };
  const context = vm.createContext({ chrome, Date: Clock, URL, console });
  vm.runInContext(fs.readFileSync("background.js", "utf8").split("function syncRules()")[0], context);
  const run = code => vm.runInContext(code, context);
  const day = run("dateKey()");
  saved[`usage:${day}`] = { "m.youtube.com": 60000, "github.com": 10 * 60000 };
  saved[`workUsage:${day}`] = { "github.com": 0 };
  assert.equal((await run("policyForUrl('https://m.youtube.com/shorts/abcdefghijk')")).siteLimit, "youtube.com");
  assert.equal((await run("policyForUrl('https://youtube.com/watch?v=abcdefghijk')")).siteLimit, "youtube.com");
  assert.equal((await run("grantShortAccess({url:'https://youtube.com/shorts/abcdefghijk',category:'school',reason:'I need this tutorial for school.'})")).ok, false);
  assert.equal((await run("grantVideoAccess({url:'https://youtube.com/watch?v=abcdefghijk',category:'school',reason:'I need this tutorial for school.'})")).ok, false);
  assert.equal((await run("grantBreak('https://youtube.com/')")).ok, false);
  assert.equal((await run("policyForUrl('https://github.com/')")).mode, "allow");
  assert.equal(saved.blockedSites.includes("github.com"), false);

  now = new Date(2026, 10, 9, 10, 0, 30).getTime();
  saved[`workUsage:${day}`] = { "github.com": 59000 };
  run("active = {domain:'github.com', since: Date.now() - 2000, video:false}");
  const reached = await run("policyForUrl('https://github.com/')");
  assert.equal(reached.siteLimit, "github.com");
  assert.equal(reached.workHours, true);
  assert.equal((await run("grantBreak('https://github.com/')")).ok, false);
  now = new Date(2026, 10, 9, 11, 0, 0).getTime();
  assert.equal((await run("policyForUrl('https://github.com/')")).mode, "allow");
  assert.equal((await run("policyForUrl('https://youtube.com/')")).siteLimit, "youtube.com");
  assert.equal(run("workTimeMs(new Date(2026,10,9,9,59).getTime(),new Date(2026,10,9,10,1).getTime(),{workHoursEnabled:true,workStart:'10:00',workEnd:'11:00'})"), 60000);
  now = new Date(2026, 10, 10, 10, 1).getTime();
  const nextDay = run("dateKey()");
  run("active = {domain:'github.com', since:new Date(2026,10,10,9,59,30).getTime(), video:false}");
  await run("recordElapsed()");
  assert.equal(saved[`usage:${nextDay}`]["github.com"], 90000);
  assert.equal(saved[`workUsage:${nextDay}`]["github.com"], 60000);
});
