# Amythest project guide

Amythest has a Chrome Manifest V3 extension, a native Windows companion in `windows/`, and a native Android companion in `android/`. Keep changes focused on the part being requested.

By default, only soulflowxd should edit the Windows and Android apps. Other contributors and agents must leave those directories unchanged unless soulflowxd explicitly asks for work there. An explicit request to change Windows or Android in the current task is authorization for that scope.

## Product behavior

- Track time on all websites while Chrome is active. Only sites on the distraction list count toward the daily distraction goal; productive sites such as GitHub stay visible in activity without consuming that goal.
- Keep a blocked tab on its original website. Show reminders and reason prompts as overlays instead of redirecting it to an extension page.
- Short-form checks apply to YouTube Shorts, Instagram Reels, and TikTok video content without blocking ordinary Instagram pages or TikTok messages. A reason unlocks only the selected short video for a limited time.
- Long-form checks ask for a meaningful reason before temporarily unlocking one YouTube video. Navigating to another video must require a new reason, including YouTube's in-page navigation. Amythest cannot verify whether a reason is true; describe this honestly.
- Preserve ordinary typing in reason fields, especially spaces and YouTube keyboard shortcuts.
- Local tracking works without an account. Account sync is opt-in through the existing Convex backend; sync daily totals and limits, never page URLs, titles, typed reasons, secrets, or raw local browsing files.
- Android Usage Access measures app time and Accessibility observes foreground package IDs for reminders. It does not block or close other apps, nor can the main-profile install read locked Pixel Private Space. Android app package IDs selected as boundaries sync only after account sign-in.
- Android focus minutes, streaks, completed sessions, and focus points come only from completed timers. They remain local for now. Do not add sleep tracking or referral rewards without a new request.
- Keep platform boundaries clear: the extension measures websites, while the Windows companion measures desktop processes. A shared account can show both totals and sync each platform's limits.
- Hard Mode is a persistent preference that applies to every focus session until turned off. While a Hard Mode session is active, the app must disable its early-stop and in-app break paths until the deadline; Chrome must also deny checked-video reason unlocks for that session. This is a self-control aid, not uninstall or permission tamper protection. Android currently sends reminders rather than blocking apps; describe that limit plainly.

## Visual direction

- Keep the Chrome extension's existing purple Aero style and bundled Inter font. Android and Windows now use a near-black geode dashboard with restrained purple labels; Windows retains its Windows 7 style caption buttons and pale glossy actions. Follow `DESIGN.md` for thresholds and spacing.
- Reuse the same restrained opal-shaped amethyst mark across the icon, popup, dashboard, overlays, and README. Avoid duplicate logos in one view.
- Use the original full-body Aero companion in normal views and its angry expression on blocked distractions. Keep it interactive and avoid crossed arms.
- Android follows the supplied screen hierarchy using Amythest branding: first-run onboarding and Home use the original four-state amethyst geode without a rectangular background. The geode follows the selected distraction budget and is never a wellness score. Apps groups distractions and rules, Timer has an LCD-style display, and the profile button opens Settings. Keep the Pixel Private Space explanation in documentation, not an in-app card.

## Code and verification

- `background.js` owns tracking and blocking policy; `site-overlay.js` owns in-page prompts; `youtube-cleanup.js` handles YouTube Shorts links. The popup and dashboard are separate extension pages.
- Keep policy decisions consistent across service worker, overlay, popup, and dashboard. Check URL changes on single-page sites before allowing previously approved content.
- Run the relevant Node tests in `tests/` after behavior changes, for example `node --test tests/*.test.js` (use the shell's supported glob syntax). Verify UI changes in Chrome when practical.
- Update `README.md` when user-visible behavior or install steps change. Keep license notices for the bundled avatar and font.
- Never commit secrets or local browsing data. Inspect the diff before committing or pushing.
- Treat account tokens, signing keys, deployment credentials, and `.env.local` as secrets. Do not print their values in tool output, logs, screenshots, tests, or release notes. Scan tracked files and release archives before publishing. Android refresh tokens must remain encrypted with Android Keystore; Windows account tokens remain protected with Windows user encryption.
- Convex production and development have separate account data and signing keys. Only deployment URLs belong in public client configuration; rotate any key accidentally printed by a tool before a client release.
- Follow `DESIGN.md` for visual work. The Windows app is built with `windows/build.ps1`; run its core tests and inspect the native window after changes. It tracks desktop processes separately from the Chrome extension's website totals.
- The Android APK is built with `android/build.ps1`; run `android/test.ps1` for focus accounting, verify the APK signature, and exercise Home, Apps, Timer, Settings/account, and permissions on an emulator after UI or policy changes. Use only synthetic emulator data in screenshots.
- The Windows installer and portable ZIP come from `windows/build.ps1 -Package`. Versioned Chrome and Windows downloads belong in one GitHub release. The screenshot in `docs/screenshots/` must be captured from the built app with sample data, never private usage data.
- Publik lists the GitHub release. After publishing a release, verify its assets and install links; Publik may refresh the listing later. Do not claim the Publik page changed until it is checked.
