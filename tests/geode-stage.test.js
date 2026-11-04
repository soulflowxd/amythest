const { test } = require("node:test");
const assert = require("node:assert/strict");
const { geodeStage } = require("../geode.js");

test("geode follows distraction budget thresholds", () => {
  const goal = 120;
  assert.equal(geodeStage(0, goal), 3);
  assert.equal(geodeStage(36 * 60000, goal), 2);
  assert.equal(geodeStage(78 * 60000, goal), 1);
  assert.equal(geodeStage(120 * 60000, goal), 0);
});
