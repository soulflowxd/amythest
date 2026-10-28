const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

async function main() {
  const source = fs.readFileSync("background.js", "utf8").split("function syncRules()")[0];
  const saved = {};
  const updates = [];
  const chrome = {
    storage: { local: {
      get: async keys => typeof keys === "string" ? { [keys]: saved[keys] } : { ...keys, ...saved },
      set: async values => Object.assign(saved, values)
    } },
    declarativeNetRequest: {
      getDynamicRules: async () => [{ id: 10000 }],
      updateDynamicRules: async value => updates.push(value)
    },
    action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} }
  };
  const context = vm.createContext({ chrome, URL, Date, console });
  vm.runInContext(source, context);
  const video = "https://www.youtube.com/watch?v=abcdefghijk";
  const initial = await vm.runInContext(`policyForUrl(${JSON.stringify(video)})`, context);
  assert.equal(initial.mode, "video");
  const denied = await vm.runInContext(`grantVideoAccess({ url: ${JSON.stringify(video)}, category: "school", reason: "because" })`, context);
  assert.equal(denied.ok, false);
  const granted = await vm.runInContext(`grantVideoAccess({ url: ${JSON.stringify(video)}, category: "robotics", reason: "I need this tutorial for my sensor project." })`, context);
  assert.equal(granted.ok, true);
  assert.equal((await vm.runInContext(`policyForUrl(${JSON.stringify(video)})`, context)).mode, "allow");
  const shortUrl = "https://www.youtube.com/shorts/abcdefghijk";
  assert.equal((await vm.runInContext(`policyForUrl(${JSON.stringify(shortUrl)})`, context)).mode, "shorts");
  const shortDenied = await vm.runInContext(`grantShortAccess({ url: ${JSON.stringify(shortUrl)}, category: "school", reason: "because" })`, context);
  assert.equal(shortDenied.ok, false);
  const shortGranted = await vm.runInContext(`grantShortAccess({ url: ${JSON.stringify(shortUrl)}, category: "robotics", reason: "I need to check this sensor wiring tip." })`, context);
  assert.equal(shortGranted.ok, true);
  assert.equal((await vm.runInContext(`policyForUrl(${JSON.stringify(shortUrl)})`, context)).mode, "allow");
  assert.equal((await vm.runInContext("policyForUrl('https://www.youtube.com/shorts/otherid1234')", context)).mode, "shorts");
  assert.equal(saved.shortAccess["youtube:abcdefghijk"].reason, undefined);
  saved.shortAccess["youtube:abcdefghijk"].until = Date.now() - 1;
  assert.equal((await vm.runInContext(`policyForUrl(${JSON.stringify(shortUrl)})`, context)).mode, "shorts");
  saved.focusUntil = Date.now() + 60000;
  assert.equal((await vm.runInContext("policyForUrl('https://instagram.com/')", context)).mode, "allow");
  assert.equal((await vm.runInContext("policyForUrl('https://instagram.com/reel/ABC_123/')", context)).mode, "shorts");
  assert.equal((await vm.runInContext("policyForUrl('https://instagram.com/direct/inbox/')", context)).mode, "allow");
  assert.equal((await vm.runInContext("policyForUrl('https://tiktok.com/messages')", context)).mode, "allow");
  assert.equal((await vm.runInContext("policyForUrl('https://tiktok.com/')", context)).mode, "shorts");
  const reel = "https://instagram.com/reel/ABC_123/";
  assert.equal((await vm.runInContext(`grantShortAccess({ url: ${JSON.stringify(reel)}, category: "school", reason: "I need this demonstration for my class project." })`, context)).ok, true);
  assert.equal((await vm.runInContext(`policyForUrl(${JSON.stringify(reel)})`, context)).mode, "allow");
  assert.equal((await vm.runInContext("policyForUrl('https://tiktok.com/@creator/video/123456789')", context)).mode, "shorts");
  await vm.runInContext("applyRules()", context);
  assert.deepEqual([...updates[0].removeRuleIds], [10000]);
  assert.equal(updates[0].addRules, undefined);
  console.log("On-page policy checks passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
