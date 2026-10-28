const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("distraction-usage.js", "utf8");
const { distractionUsage, distractionHours, allHours } = vm.runInNewContext(`${source}\n({ distractionUsage, distractionHours, allHours })`);
const allSites = { "github.com": 5 * 60000, "youtube.com": 3 * 60000, "music.youtube.com": 2 * 60000 };
const distractions = distractionUsage(allSites, ["youtube.com"]);
assert.equal(Object.values(distractions).reduce((sum, ms) => sum + ms, 0), 5 * 60000);
assert.equal("github.com" in distractions, false);
assert.equal(allSites["github.com"], 5 * 60000);
const hours = distractionHours({ "github.com": [60000], "youtube.com": [120000] }, ["youtube.com"]);
assert.equal(hours[0], 120000);
assert.equal(allHours({ "github.com": [60000], "youtube.com": [120000] })[0], 180000);
console.log("Distraction goal checks passed");
