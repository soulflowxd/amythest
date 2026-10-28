# amythest

Amythest helps you spend less time on distracting websites in Google Chrome. It shows your screen time, lets you start a focus session, and can block sites during work hours or after you reach a daily limit.

## Install it in Chrome

1. Download this repo as a ZIP from GitHub, then unzip it. If you already have the project folder, use that instead.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** in the top right.
4. Click **Load unpacked**.
5. Select the folder containing `manifest.json`. Do not select the ZIP file or `manifest.json` itself.
6. Click the puzzle-piece icon in Chrome and pin **amythest**.

After you change the extension's files, click **Reload** on its card at `chrome://extensions`.

## Use it

- **See your time:** Click the amythest icon to see today's time in Chrome. Open the dashboard for your most visited sites.
- **Focus session:** Pick 15, 25, 45, or 60 minutes in the dashboard, then start a session. Websites on your distraction list will be blocked until it ends.
- **Distraction list:** Add websites such as `youtube.com`. Subdomains such as `music.youtube.com` are included.
- **Work hours:** Turn this on in the dashboard and choose a start and end time. Your distraction list is blocked during those hours Monday through Friday. It uses your computer's local time. Work hours are off by default.
- **Daily site limits:** Enter a website and a number of minutes. Amythest adds up time on that site and its subdomains. Once the limit is reached, the site is blocked for the rest of the day. Limits reset at local midnight.
- **Take a break:** The block page has a five-minute break button. It temporarily pauses all blocks, including work-hour and daily-limit blocks.
- **Daily goal:** Set a goal for your total Chrome screen time. This is a progress guide; it does not block all websites.

Your browsing totals and settings stay in Chrome on your device. Amythest has no account or server. It counts active website time while Chrome is focused, so the totals are approximate. It cannot track other browsers or apps. The animated companion is original to this project; click it for a wave.
