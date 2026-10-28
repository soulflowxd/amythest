const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

async function main() {
  const source = fs.readFileSync("background.js", "utf8").split("function syncRules()")[0];
  const saved = {};
  const redirects = [];
  const updates = [];
  const chrome = {
    storage: { local: {
      get: async keys => typeof keys === "string" ? { [keys]: saved[keys] } : { ...keys, ...saved },
      set: async values => Object.assign(saved, values)
    } },
    tabs: { update: async (id, options) => redirects.push({ id, url: options.url }), query: async () => [] },
    runtime: { getURL: path => `chrome-extension://test/${path}` },
    declarativeNetRequest: { getDynamicRules: async () => [], updateDynamicRules: async value => updates.push(value) },
    action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} }
  };
  const context = vm.createContext({ chrome, URL, Date, console });
  vm.runInContext(source, context);
  const video = "https://www.youtube.com/watch?v=abcdefghijk";
  await vm.runInContext(`gateYouTubeTab({ id: 7, url: ${JSON.stringify(video)} })`, context);
  assert.match(redirects[0].url, /video-gate\.html\?target=/);
  const denied = await vm.runInContext(`grantVideoAccess({ url: ${JSON.stringify(video)}, category: "school", reason: "because" })`, context);
  assert.equal(denied.ok, false);
  const granted = await vm.runInContext(`grantVideoAccess({ url: ${JSON.stringify(video)}, category: "robotics", reason: "I need this tutorial for my sensor project." })`, context);
  assert.equal(granted.ok, true);
  await vm.runInContext(`gateYouTubeTab({ id: 7, url: ${JSON.stringify(video)} })`, context);
  assert.equal(redirects.length, 1);
  await vm.runInContext("gateYouTubeTab({ id: 8, url: 'https://www.youtube.com/shorts/abcdefghijk' })", context);
  assert.equal(redirects[1].url, "chrome-extension://test/shorts-blocked.html");
  await vm.runInContext("applyRules()", context);
  assert.ok(updates.some(update => update.addRules?.some(rule => rule.id === 10000 && rule.condition.regexFilter)));
  console.log("Video flow checks passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
