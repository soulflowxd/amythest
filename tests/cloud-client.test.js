const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let request;
const context = {
  AMYTHEST_CONVEX_URL: 'https://test-project.convex.cloud',
  fetch: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ status: 'success', value: { accepted: true } }) };
  },
};
context.globalThis = context;
vm.runInNewContext(fs.readFileSync('cloud-sync.js', 'utf8'), context);

(async () => {
  const result = await context.AmythestCloud.call('mutation', 'sync:putDay', { deviceId: 'device-1' }, 'test-token');
  assert.equal(result.accepted, true);
  assert.equal(request.url, 'https://test-project.convex.cloud/api/mutation');
  assert.equal(request.options.headers.Authorization, 'Bearer test-token');
  assert.equal(JSON.parse(request.options.body).format, 'json');
  assert.deepEqual(JSON.parse(request.options.body).args, { deviceId: 'device-1' });
  assert.equal(context.AmythestCloud.validDeployment('http://evil.example'), false);
  assert.equal(context.AmythestCloud.validDeployment('https://test-project.convex.cloud'), true);
  const settings = context.AmythestCloud.settingsValue({
    blockedSites: ['youtube.com'], siteLimits: { 'github.com': 30 },
    siteLimitScopes: { 'github.com': 'work' }, workHoursEnabled: true
  });
  assert.equal(settings.siteLimits[0].workHoursOnly, true);
  assert.equal(settings.distractionDomains.includes('github.com'), false);
  const roundTrip = context.AmythestCloud.localSettings(settings);
  assert.equal(roundTrip.siteLimitScopes['github.com'], 'work');
  assert.equal(roundTrip.blockedSites.includes('github.com'), false);
  console.log('Cloud client HTTP checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
