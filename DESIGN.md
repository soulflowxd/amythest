# Amythest design

## Purpose

Amythest makes screen time visible and gives people a calm pause before distractions. The Windows companion tracks desktop apps; the Chrome extension tracks sites and videos. Both should feel like one product.

## Visual language — Windows 7 Aero

- **Character:** this should look like a 2009–2011 Windows desktop program, with a purple-tinted glass frame, blue-violet gradients, bright inset content, one-pixel bevels, reflections, and crisp dividers. Avoid the previous flat dark-purple web-dashboard look.
- **Palette:** midnight glass `#202745`, amethyst glass `#574893`, icy lavender `#C9C6EA`, porcelain `#F6F7FC`, dark navy ink `#24304F`, and muted slate `#5F6B86`. Purple is the identity; blue and silver supply the Aero feel.
- **Mark:** one small opal-shaped amethyst mark beside the wordmark. Do not put a second framed copy of the logo in the same view. The companion avatar is distinct from the logo.
- **Windows icon:** use the transparent version of the mark for the title bar and packaged EXE. The in-app mark has no dark square behind it.
- **Type:** Segoe UI on Windows for native familiarity; Inter in the extension where bundled. Use a clear hierarchy: 22–28 px page title, 18–22 px metric, 13–15 px body, 11–12 px supporting labels. Use sentence case for most UI labels.
- **Shape:** frame and large glass areas have soft 8–12 px curves. Inner panes and buttons have tighter 4–7 px curves. Buttons have a silver-lavender face, cool blue edge, top shine, and a subtle lower shadow.
- **Spacing:** 8 px base rhythm; 24 px outer margins; at least 16 px between sections. No text or lists should touch window edges.

## Windows dashboard layout

The Windows app should feel like the Chrome extension dashboard opened as its own desktop app. At the default 1100 × 800 size, the order is:

1. Thin Windows 7 glass caption with joined minimize, maximize, and red close controls.
2. Amythest wordmark and the same “See where your time goes” introduction as the extension dashboard.
3. A large activity card within Today, with day total, distraction goal, an hourly activity chart, and the most used apps. Do not place a separate metric banner above the tabs.
4. Companion cards for focus sessions and a boundary summary beside the activity card. The focus card has a duration choice and Hard Mode commitment. The boundary summary includes actual seven-day desktop time. Boundaries holds Windows app controls; Account shows cloud Chrome website limits. Windows-only controls must clearly say “apps”; browser controls must clearly say “sites.”
5. A Websites view with the Chrome extension’s domain totals, including video and distraction time. This is a breakdown of Chrome usage, not additional desktop time.

Use the dashboard’s spacious card rhythm, heading hierarchy, and purple Aero palette. The desktop title controls remain true to the Windows 7 screenshot. Avoid a compact utility/tray layout as the main experience.

The cards must stay inside the content area when resized. Keep the tab panel visible and never let it cover the header or summary. At narrow widths, reduce column widths before clipping the page. The default screen must show the summary and at least several usage rows without scrolling.

## Interaction

- All desktop apps are tracked while active; only selected distractions advance the distraction goal.
- The focus action should show its current state and end time.
- A blocked app gets an Amythest reminder that explains the reason and offers a temporary break. The reminder is a self-control boundary, not an OS security lock.
- A mouse or keyboard user can reach every control. Keep focus indicators and legible input text.

## Verification

Build the Windows app, run core policy tests, launch the EXE, and inspect the window at its default size. Check the Today and Boundaries views, focus state, and blocked reminder. Update this document when the visual system changes.

## Android dashboard

The Android app takes its screen hierarchy from the supplied Opal screenshots and its restraint from the [monopo saigon DESIGN.md on Refero](https://styles.refero.design/style/3e52dd36-6ab1-48c6-bc40-47ef6d33abc2): a near-black canvas, one spacious title, small quiet labels, and color reserved for a single amethyst accent. It uses the same amethyst mark but does not copy Opal branding. Cards and bottom navigation use translucent purple-gray native gradients, a thin light rim, and rounded lens-like edges inspired by [LiquidGlass](https://github.com/ybouane/liquidglass), [kube.io's glass study](https://kube.io/blog/liquid-glass-css-svg/), and [21st.dev glass components](https://21st.dev/). Those web effects are references, not Android dependencies or a claim of live refraction. Use frosted white only for primary actions and keep text opaque and legible.

Its four persistent bottom destinations have matching line icons: Home, Apps, Timer, and Account. The header uses a compact wordmark and one page title. Home leads with actual daily app time, a separate distraction budget, useful app names and icons, a focus entry, and a seven-day chart. Exclude system launchers and system UI from tracked app totals. Apps leads with a compact selection list, then the daily goal and work-hour reminders. Timer has the adjustable duration and persistent Hard Mode preference. Account hides sign-in fields while signed in and shows separate Android, Chrome, and Windows totals and permission status. Use Android's native controls and readable tap targets. Never fabricate scores, streaks, or time saved.
