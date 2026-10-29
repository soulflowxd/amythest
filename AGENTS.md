# Amythest project guide

Amythest is a Chrome Manifest V3 screen-time extension. Keep changes focused on the extension in this repository.

## Product behavior

- Track time on all websites while Chrome is active. Only sites on the distraction list count toward the daily distraction goal; productive sites such as GitHub stay visible in activity without consuming that goal.
- Keep a blocked tab on its original website. Show reminders and reason prompts as overlays instead of redirecting it to an extension page.
- Short-form checks apply to YouTube Shorts, Instagram Reels, and TikTok video content without blocking ordinary Instagram pages or TikTok messages. A reason unlocks only the selected short video for a limited time.
- Long-form checks ask for a meaningful reason before temporarily unlocking one YouTube video. Navigating to another video must require a new reason, including YouTube's in-page navigation. Amythest cannot verify whether a reason is true; describe this honestly.
- Preserve ordinary typing in reason fields, especially spaces and YouTube keyboard shortcuts.
- Keep settings and browsing data local to Chrome. Do not add secrets, credentials, telemetry, or a server without an explicit user request.

## Visual direction

- Use the existing purple Windows Aero / Frutiger Aero style, bundled Inter font, consistent corner radii, and pale glossy buttons.
- Reuse the same restrained opal-shaped amethyst mark across the icon, popup, dashboard, overlays, and README. Avoid duplicate logos in one view.
- Use the original full-body Aero companion in normal views and its angry expression on blocked distractions. Keep it interactive and avoid crossed arms.

## Code and verification

- `background.js` owns tracking and blocking policy; `site-overlay.js` owns in-page prompts; `youtube-cleanup.js` handles YouTube Shorts links. The popup and dashboard are separate extension pages.
- Keep policy decisions consistent across service worker, overlay, popup, and dashboard. Check URL changes on single-page sites before allowing previously approved content.
- Run the relevant Node tests in `tests/` after behavior changes, for example `node --test tests/*.test.js` (use the shell's supported glob syntax). Verify UI changes in Chrome when practical.
- Update `README.md` when user-visible behavior or install steps change. Keep license notices for the bundled avatar and font.
- Never commit secrets or local browsing data. Inspect the diff before committing or pushing.

## User's Codex usage limit

Check remaining Codex usage during substantial work. If the task is finished, stop at or before 15% remaining. If unfinished, stop once remaining usage reaches 10%; report what is left. Do not redeem a usage reset without the user's explicit confirmation.
