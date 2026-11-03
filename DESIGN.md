# Amythest design

## Purpose

Amythest makes screen time visible and gives people a calm pause before distractions. The Windows companion tracks desktop apps; the Chrome extension tracks sites and videos. Both should feel like one product.

## Visual language — geode and Aero controls

- **Character:** Android and Windows use a near-black canvas and large original amethyst geode image, with restrained purple surfaces. The Windows caption keeps joined Windows 7 style minimize, maximize, and red close controls. Pale glossy buttons retain a little Aero character.
- **Palette:** near-black `#08070C`, graphite card `#16141D`, lavender ink `#F6F3FC`, amethyst label `#CCB1FA`, muted gray `#AEA8BA`, and dark violet edges `#403652`.
- **Mark:** one small opal-shaped amethyst mark beside the wordmark. Do not put a second framed copy of the logo in the same view. The companion avatar is distinct from the logo.
- **Windows icon:** use the transparent version of the mark for the title bar and packaged EXE. The in-app mark has no dark square behind it.
- **Type:** Segoe UI on Windows for native familiarity; Inter in the extension where bundled. Use a clear hierarchy: 22–28 px page title, 18–22 px metric, 13–15 px body, 11–12 px supporting labels. Use sentence case for most UI labels.
- **Shape:** dark cards have restrained 16 px curves. Buttons have a pale lavender face, cool blue edge, top shine, and a subtle lower shadow.
- **Spacing:** 8 px base rhythm; 24 px outer margins; at least 16 px between sections. No text or lists should touch window edges.

## Windows dashboard layout

The Windows app should feel like the Chrome extension dashboard opened as its own desktop app. At the default 1100 × 800 size, the order is:

1. Thin Windows 7 glass caption with joined minimize, maximize, and red close controls.
2. Amythest wordmark and a short “Your focus, in view” introduction.
3. A large activity card within Today, with day total, distraction goal, an hourly activity chart, and the most used apps. Do not place a separate metric banner above the tabs.
4. A geode card and focus card beside the activity card. The geode opens or closes based on **Windows distracting app time divided by the chosen daily goal**: open below 30%, partly open from 30%, nearly closed from 65%, and closed at 100%. It is an artistic cue, never a claimed health score. The focus card has a duration choice and Hard Mode commitment. Boundaries holds Windows app controls; Account shows cloud Chrome website limits. Windows-only controls must clearly say “apps”; browser controls must clearly say “sites.”
5. A Websites view with the Chrome extension’s domain totals, including video and distraction time. This is a breakdown of Chrome usage, not additional desktop time.

Use the dashboard’s spacious card rhythm, near-black canvas, and restrained purple labels. The desktop title controls remain true to the Windows 7 screenshot. Avoid a compact utility/tray layout as the main experience.

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

The first launch has four sparse geode screens: closed stone, first opening, wider opening, and open crystal. The last screen gives a clear Usage Access action and optional Accessibility action. It says that Usage Access measures app time and Accessibility observes foreground app package IDs for reminders; Android does not let this build close or block other apps. The main bottom destinations are Home, Apps, and Timer. A profile icon in the header opens Settings. Home uses an original amethyst geode cutout on the near-black canvas, with no rectangular image background. The geode uses the same 30%, 65%, and 100% distraction-budget thresholds as Windows. With no Usage Access, it stays neutral and explains why. Completed focus minutes appear beneath it; three compact chips show actual streak, completed sessions, and points earned from completed minutes. Screen time and its app breakdown follow within the first screen. A focus pill sits above the tab bar. Exclude system launchers and system UI from tracked app totals. Apps presents selected distractions without empty icon placeholders, then weekday rules, app choices, and the daily goal. Timer uses a native-drawn LCD-style clock, adjustable duration, useful 15- and 45-minute presets, and persistent Hard Mode preference. Settings groups profile sync, focus preferences, permissions, and app information; it hides sign-in fields while signed in. Do not show a Pixel Private Space card in Settings. Explain that profile boundary only in documentation. Use Android's native controls and readable tap targets. Never fabricate scores, streaks, or time saved. Sleep and referral rewards are outside the current design.
