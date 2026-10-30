# Amythest account sync backend

This is a **separate Convex project for Amythest**, modeled on the Convex Auth setup in `2026-scouting`. It does not reuse that app's database or credentials. No Amythest website is required: sign-in is in the Chrome extension dashboard, and the Windows app shows account sync status.

## What syncs

- A complete daily snapshot per account, device, source (`chrome` or `windows`), and local calendar date. Chrome snapshots contain up to 200 **domain-level** aggregates. Windows snapshots contain desktop totals and no website list. URLs, page titles, and reasons are never uploaded. The password is sent over HTTPS only when signing in or creating an account; Convex Auth stores a hash.
- Account settings with a revision number. Clients must read the latest revision before writing; a stale write fails instead of replacing a change made on another device.
- Windows app boundaries (daily goal, distracting apps, daily app limits, and work hours) have their own revisioned record. Chrome website limits remain in Chrome account settings. Each dashboard can show the other platform's limits without applying website rules to desktop processes.
- Data is read and written only through functions that require a signed-in user ID. Each database index begins with that user ID.

The two sources are kept separate. Chrome time is included in Windows `chrome.exe` process time; clients must not add those two totals together as though they were independent time.

## Current development deployment

The repository is connected to the separate Amythest development deployment `necessary-marlin-189` (`https://necessary-marlin-189.convex.cloud`). Sync functions and Convex Auth signing keys have been deployed. The public URL is in `cloud-config.js`; the signing key is only in Convex. Password sign-in is enabled without email delivery. Email addresses are unverified, and password recovery is unavailable until a mail provider is configured. This is a development deployment, not a production release.

## Account setup and production

1. The development project and signing keys are already set up. Sign in or create an account in the extension dashboard with an email address and a password of at least eight characters. No Resend key or email code is required. The email is an account identifier, **not verified ownership**; choose a strong unique password and keep it safe because password recovery is unavailable.
2. For another deployment, sign in with `npx convex login`, run `npx convex dev --configure existing --team luqman-khan-feae5 --project amythest --dev-deployment cloud --once`, then `npx @convex-dev/auth` if that deployment has no signing keys. Keep `.env.local` out of Git.
3. For a production release, deploy with `npx convex deploy` and change the extension's public URL in `cloud-config.js` to that production deployment. The Windows app receives that URL from the extension through the local bridge. A deployment URL is public configuration, not a secret.

Local tracking continues without an account. Do not use the scouting deployment URL or its credentials.

## Client contract

Convex functions are available through its normal client or its authenticated HTTP API (`POST /api/query`, `/api/mutation`, `/api/action`). The HTTP API takes `{ "path": "sync:putDay", "args": {…}, "format": "json" }` with `Authorization: Bearer <access JWT>` for signed-in calls. Refresh tokens stay in the extension's local storage and never travel through native messaging; the Windows app can receive a short-lived access token only.

- `auth:signIn` action: `{provider:"password",params:{email,password,flow:"signUp"}}` creates an account; use `flow:"signIn"` to sign in. It returns Convex Auth tokens when sign-in completes. `{refreshToken}` renews a session. `auth:signOut` invalidates the authenticated session.
- `sync:putDay` mutation: `{deviceId,source,date,activeMs,distractionMs,videoMs,sites,observedAt}`. `source` is `chrome` or `windows`; date is `YYYY-MM-DD` in the local calendar; times are nonnegative integer milliseconds; `observedAt` is Unix milliseconds. `sites` is an array of `{domain,activeMs,distractionMs,videoMs}` for Chrome and `[]` for Windows. Returns `{accepted,receivedAt}`. Older retries do not replace newer snapshots.
- `sync:getDays` query: `{from,through}` (inclusive, max 31 days). Returns per-device, per-source snapshots, never a combined total.
- `sync:getSettings` query: `{}`. Returns null or `{revision,updatedAt,dailyDistractionGoalMinutes,distractionDomains,siteLimits,workHours,blockShorts,checkLongForm}`.
- `sync:putSettings` mutation: `{expectedRevision,value}` where `value` has the settings fields above. Initial revision is zero; a revision conflict requires a fresh read and user-visible resolution. Returns `{revision,updatedAt}`.
- `sync:getWindowsSettings` query and `sync:putWindowsSettings` mutation sync Windows boundaries with their own revision. The mutation accepts `{expectedRevision,value}` where `value` contains `goalMinutes`, `distractingApps`, `appLimits`, `workEnabled`, `workStartMinutes`, and `workEndMinutes`. Concurrent edits are rejected; Windows offers to apply the cloud version.
- `sync:setSiteLimit` and `sync:setWindowsAppLimit` update one limit from the other platform's dashboard. Both require `expectedRevision`; `minutes:0` removes the limit. They preserve unrelated settings and reject stale edits.

All data functions reject unauthenticated calls. Device IDs are random stable identifiers (16–64 URL-safe characters), not hardware identifiers. Dates, domains, lengths and values are bounded; only normalized lowercase domains are accepted.

## Checks

Run `npm run typecheck`, `npm run test:sync`, and `npm audit --omit=dev`. A real cross-device round trip requires two signed-in installations.
