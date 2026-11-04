---
name: Amythest native apps
description: Opal-inspired focus and screen time with an original amethyst geode
colors:
  canvas: "#050506"
  surface: "#141416"
  control: "#222225"
  ink: "#F9F9FA"
  secondary: "#AAAAB1"
  accent: "#C3AAFF"
  action: "#FFFFFF"
  windows-surface: "#141417"
  windows-ink: "#F6F3FC"
  windows-secondary: "#AEA8BA"
  windows-accent: "#CCB1FA"
  windows-action: "#F2F0F7"
  windows-control: "#232328"
typography:
  windows-body:
    fontFamily: "Segoe UI"
    fontSize: "10pt"
    fontWeight: 400
  windows-app-row:
    fontFamily: "Segoe UI"
    fontSize: "11pt"
    fontWeight: 400
  android-body:
    fontFamily: "sans-serif"
    fontSize: "13sp"
    fontWeight: 400
  android-control:
    fontFamily: "sans-serif-medium"
    fontSize: "15sp"
    fontWeight: 500
  windows-home-title:
    fontFamily: "Segoe UI"
    fontSize: "25pt"
    fontWeight: 700
  android-page-title:
    fontFamily: "sans-serif"
    fontSize: "31sp"
    fontWeight: 700
rounded:
  windows-section: "22px"
  windows-control: "20px"
  android-section: "24dp"
  android-control: "18dp"
  android-primary: "26dp"
spacing:
  small: "8px"
  group: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.android-primary}"
    height: "48dp"
---
# Amythest design

## Overview

Windows and Android follow the supplied Opal app hierarchy with Amythest branding. The original animated amethyst geode leads Home. The native apps use black space, flat charcoal groups, white type and white primary actions. This replaces the former Windows Aero / Frutiger Aero direction completely for native apps.

Chrome remains a separate existing surface with its current purple Aero design and bundled Inter font. Do not propagate this native redesign into the extension without a new request.

## Colors

Black is the canvas; charcoal distinguishes a content group. The unprefixed palette records Android values; `windows-*` records the closely related Windows palette. Headings and primary values are white. Secondary descriptions are neutral gray. Reserve lavender for selected navigation, progress and the geode. Never use purple for every heading. Error and disabled states must stay readable and explicit.

## Typography

Use Segoe UI on Windows and Android's system sans-serif. Use regular or medium body text, semibold headings and bold principal metrics. Avoid tiny all-caps labels, excessive tracking, font effects and fabricated wellness scores. Time values use stable numerals. Android supports native text scaling.

## Layout

Windows has four primary top destinations: Home, Apps, Timer, Settings. Home places a large unframed geode beside screen time, the daily distraction budget, activity and readable app rows. Apps holds app boundaries. Timer holds duration, start/end, persistent Hard Mode and its state. Settings groups account sync and secondary Chrome website detail. At 940 × 700, content stays reachable without clipping.

Android uses Home, Apps and Timer bottom destinations, with Settings reached through the profile action. Home leads with the complete geode cutout, authentic completed focus minutes and progress, then screen time and app breakdown. Apps groups distractions and rules. Timer has a flat digital display and an obvious white action. Settings groups account, preferences and permissions. The first-run geode introduction uses the same flat system.

Use proximity and whitespace before adding containers. Keep at least 48dp Android touch targets and preserve keyboard focus on Windows. Scroll content beyond fixed actions and navigation so the final row can be revealed completely.

Android Home places the focus action within the scrolling content, above screen time. Only the compact navigation row remains fixed; its selected icon and label use lavender without a filled capsule. A short scroll-edge fade softens content entering the navigation boundary.

## Elevation & Depth

Native surfaces are flat and separated by tone. No glossy shine, decorative bevels, Aero gradients, chrome-colored caption bars, colored halos or heavy outline around every group. Windows uses the standard OS title bar, resizable frame, system menu and minimize/maximize/close controls. Request the dark title-bar theme through DWM; do not draw replacement caption buttons or override resize hit testing.

## Shapes

Use 22px section curves and 20px action curves on Windows; Android sections use 24dp, secondary actions 18dp, and primary actions 26dp. Pills are reserved for major focus actions or compact navigation selection. Do not put the geode in a framed image tile or crop its silhouette.

## Components

The geode uses distracting time divided by the local platform daily goal: open below 30%, partly open at 30%, nearly closed at 65%, resting at 100%. Stage changes fade through adjacent artwork. Honor reduced motion. Missing Android Usage Access shows a neutral state with an explanation. It is an artistic budget cue.

Primary actions are white with dark labels; secondary actions use flat charcoal. Inputs retain native editing behavior and legible text. Hard Mode stays persistent and disables early stop/break paths while active. Android sends reminders and cannot close other apps. Do not imply stronger enforcement.

## Do's and Don'ts

- Do preserve Amythest's mark, original geode, truthful totals, platform boundaries and existing account behavior.
- Do review all destinations, narrow Windows sizes, Android scrolling and permission states in built apps with synthetic data.
- Do keep Pixel Private Space limitations in documentation, not a new in-app card.
- Don't restore Windows 7 captions, glossy buttons or Frutiger styling in native apps.
- Don't add sleep tracking, referral rewards, fake scores or invented time saved.
