# amythest

![amythest logo](icons/mark.svg)

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

- **See your time:** Click the amythest icon to see today's time in Chrome. Open the dashboard for an iOS-style Screen Time view. **Day** shows time by hour; **Week** shows the last seven days and your daily average. All websites are tracked, including productive sites such as GitHub.
- **Focus session:** Pick 15, 25, 45, or 60 minutes in the dashboard, then start a session. Websites on your distraction list will be blocked until it ends.
- **Distraction list:** Add websites such as `youtube.com`. Subdomains such as `music.youtube.com` are included.
- **Work hours:** Turn this on in the dashboard and choose a start and end time. Your distraction list is blocked during those hours Monday through Friday. It uses your computer's local time. Work hours are off by default.
- **Daily site limits:** Enter a website and a number of minutes. Amythest adds up time on that site and its subdomains. Once the limit is reached, the site is blocked for the rest of the day. Limits reset at local midnight.
- **Take a break:** The reminder shown over a blocked website has a five-minute break button. It temporarily pauses focus, work-hour, and daily-limit blocks while keeping you on that website.
- **Distraction goal:** Set a daily goal for time on sites in your distraction list. Productive sites stay in the activity chart but do not move the goal bar unless you add them to that list. This goal is a progress guide; it does not block all websites.
- **Check YouTube Shorts:** Turn this on to ask for a purpose and written reason before each Short. A valid response unlocks only that Short for five minutes; other Shorts still require their own reason. A separate switch hides Shorts shelves and sidebar links on YouTube. This applies even outside focus sessions.
- **Check long-form videos:** Turn this on to ask why you want to watch a YouTube video. The question appears over the video, so the tab keeps its YouTube address. Choose a purpose such as school or robotics and write what you need to do. A valid response unlocks that one video for 15 minutes. Amythest cannot verify whether the reason is true, so this is an intentional pause rather than an automatic judgment.

Written reasons for Shorts and long-form videos are checked locally and are not saved. Only the chosen purpose and temporary access time stay in Chrome storage until access expires.

When the long-form check is on, it replaces whole-site focus blocking for `youtube.com` so the video question can appear. The Shorts switch still asks for a reason on each Short. Turn the long-form check off if you want your distraction list to block all of YouTube during focus sessions and work hours; an approved Short remains accessible for its five-minute window.

Reminders now appear over the original website, so the tab does not change addresses. Amythest pauses ordinary page audio and video while a reminder is visible. The site still loads behind it; this is a self-control screen, not a network block.

Your browsing totals and settings stay in Chrome on your device. Amythest has no account or server. It counts active website time while Chrome is focused, so the totals are approximate. It cannot track other browsers or apps. The animated companion is original to this project; click it for a wave.

The purple square with the white four-point star is the same mark in the toolbar and on the extension pages. The animated robot companion uses [Agent Robot Avatar](https://github.com/CX-ArtLab/agent-robot-avatar) by CX ART Lab under the MIT license, included in `vendor/agent-robot-avatar/`. It is separate from the amythest logo and is not presented as an original amythest character.
