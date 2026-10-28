# Amethyst

A mindful screen time extension for Google Chrome. It tracks time spent on websites on this device and blocks a personal distraction list during focus sessions.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select this folder.
5. Pin Amethyst to your toolbar. Open the popup to start a focus session, or open the dashboard to change settings.

## What it does

- Tracks active website time while Chrome is focused. Data is stored locally with `chrome.storage.local`.
- Shows today's total time and most visited websites.
- Starts 15, 25, 45, or 60 minute focus sessions.
- Blocks up to 100 chosen domains during a session, including subdomains.
- Offers a five-minute break from the block page.
- Lets you set a daily screen time goal.
- Includes an original animated amethyst companion that reacts to focus and breaks. Click it for a wave.

Amethyst has no account, server, analytics, or sync. Chrome may suspend the extension's service worker; a one-minute alarm keeps tracking and focus rules current. Time shown is approximate. It does not track other browsers or apps.
