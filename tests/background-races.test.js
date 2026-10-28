const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

async function main() {
  const source = fs.readFileSync("background.js", "utf8").split("function syncRules()")[0];
  const saved = {};
  const updates = [];
  let releaseRead;
  const readGate = new Promise(resolve => { releaseRead = resolve; });
  let delayRead = true;
  const chrome = {
    storage: { local: {
      get: async keys => {
        if (delayRead && Array.isArray(keys)) await readGate;
        if (Array.isArray(keys)) return Object.fromEntries(keys.map(key => [key, saved[key]]));
        if (typeof keys === "string") return { [keys]: saved[keys] };
        return { ...keys, ...saved };
      },
      set: async value => Object.assign(saved, value)
    } },
    declarativeNetRequest: {
      getDynamicRules: async () => [{ id: 1, condition: { urlFilter: "||old.example^" } }],
      updateDynamicRules: async value => updates.push(value)
    },
    action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} },
    tabs: { query: async () => [] }
  };
  const context = vm.createContext({ chrome, console, Date, URL });
  vm.runInContext(source, context);
  vm.runInContext("active = { domain: 'github.com', since: Date.now() - 3000 }", context);
  const recording = vm.runInContext("recordElapsed()", context);
  vm.runInContext("active = null", context);
  releaseRead();
  await recording;
  assert.ok(Object.values(saved).some(value => value?.["github.com"] >= 2000));

  delayRead = false;
  saved.blockedSites = ["youtube.com"];
  saved.focusUntil = Date.now() + 60000;
  saved.checkLongForm = false;
  await vm.runInContext("applyRules()", context);
  assert.equal(updates.length, 1);
  assert.deepEqual([...updates[0].removeRuleIds], [1]);
  assert.equal(updates[0].addRules, undefined);
  console.log("Background race checks passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
