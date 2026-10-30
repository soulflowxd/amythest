const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

async function main() {
  const source = fs.readFileSync("background.js", "utf8").split("async function init()")[0];
  const saved = {};
  const calls = [];
  const chrome = {
    storage: { local: {
      get: async keys => Object.fromEntries(keys.map(key => [key, saved[key]])),
      set: async values => Object.assign(saved, values)
    } },
    runtime: { sendNativeMessage: async (host, payload) => {
      calls.push({ host, payload });
      return { ok: true };
    } }
  };
  const context = vm.createContext({ chrome, console, Date, URL });
  vm.runInContext(source, context);
  const day = vm.runInContext("dateKey()", context);
  saved[`usage:${day}`] = { "github.com": 120000, "youtube.com": 180000, "bad/domain": 10000 };
  saved[`videoUsage:${day}`] = { "github.com": 30000, "youtube.com": 50000 };
  saved.blockedSites = ["youtube.com"];
  await vm.runInContext("syncNativeUsage()", context);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].host, "com.amythest.screentime");
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].payload)), {
    type: "dailyWebsiteUsage", version: 1, date: day,
    generatedAt: calls[0].payload.generatedAt,
    sites: [
      { domain: "youtube.com", activeMs: 180000, videoMs: 50000, distractionMs: 180000 },
      { domain: "github.com", activeMs: 120000, videoMs: 30000, distractionMs: 30000 }
    ]
  });
  await vm.runInContext("syncNativeUsage()", context);
  assert.equal(calls.length, 1, "syncs should be throttled for one minute");

  const many = Object.fromEntries(Array.from({ length: 240 }, (_, i) => [`site${i}.example`, (i + 1) * 1000]));
  context.many = many;
  const snapshot = vm.runInContext("dailyWebsiteSnapshot('2026-10-29', many, {}, [], 1)", context);
  assert.equal(snapshot.sites.length, 200);
  assert.equal(snapshot.sites[0].domain, "site239.example");
  console.log("Native website sync checks passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
