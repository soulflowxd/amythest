const { test } = require("node:test");
const assert = require("node:assert/strict");

test("account backend validation rejects URLs and impossible dates", async () => {
  const { validDate, validDomain, validDeviceId, validMs } = await import("../convex/syncValidation.ts");
  assert.equal(validDate("2026-02-28"), true);
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2026-10-29T00:00:00Z"), false);
  assert.equal(validDomain("github.com"), true);
  assert.equal(validDomain("github.com/path"), false);
  assert.equal(validDomain("YOUTUBE.COM"), false);
  assert.equal(validDeviceId("abc1234567890_xyz"), true);
  assert.equal(validDeviceId("short"), false);
  assert.equal(validMs(86_400_000), true);
  assert.equal(validMs(-1), false);
  assert.equal(validMs(1.5), false);
  console.log("account backend tests passed");
});
