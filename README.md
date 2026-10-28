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
- **Robot companion:** The robot starts cheerful, becomes neutral after one quarter of your daily distraction goal, and looks sad after three quarters. Time on YouTube long-form and short-form video pages counts even if their website is not on your distraction list. Video page time on a listed site is counted once. The expression resets with each new day; it is a gentle visual cue, not a judgment.
- **Check short-form videos:** Turn this on to pause YouTube Shorts, Instagram Reels, and TikTok's video feed. A specific Short, Reel, or TikTok video asks for a purpose and written reason; a valid response unlocks only that video for five minutes. Feed pages stay paused. Instagram's normal posts and messages, and TikTok messages, remain available. A separate switch hides Shorts shelves and sidebar links on YouTube. This applies even outside focus sessions.
- **Check long-form videos:** Turn this on to ask why you want to watch a YouTube video. The question appears over the video, so the tab keeps its YouTube address. Choose a purpose such as school or robotics and write what you need to do. A valid response unlocks that one video for 15 minutes. Amythest cannot verify whether the reason is true, so this is an intentional pause rather than an automatic judgment.

Written reasons for short-form and long-form videos are checked locally and are not saved. Only the chosen purpose and temporary access time stay in Chrome storage until access expires.

When the long-form check is on, it replaces whole-site focus blocking for `youtube.com` so the video question can appear. The short-form switch prevents default whole-site focus blocking for `instagram.com` and `tiktok.com`, allowing normal Instagram pages and TikTok messages to work. You can still set a separate daily site limit for either domain. Turn the long-form check off if you want your distraction list to block all of YouTube during focus sessions and work hours.

Reminders appear over the original website, so the tab does not change addresses. The Aero-style robot crosses its arms when a distraction is paused and animates while a written reason is being checked. Text fields keep keyboard shortcuts, including YouTube's spacebar shortcut, from interrupting typing. Amythest pauses ordinary page audio and video while a reminder is visible. The site still loads behind it; this is a self-control screen, not a network block.

Your browsing totals and settings stay in Chrome on your device. Amythest has no account or server. It counts active website time while Chrome is focused, so the totals are approximate. It cannot track other browsers or apps.

The soft opal-shaped ring with an amethyst gradient center is the same mark in the toolbar and on extension pages. The interface bundles [Inter](https://github.com/rsms/inter) under the SIL Open Font License, so it works offline. The animated robot companion uses [Agent Robot Avatar](https://github.com/CX-ArtLab/agent-robot-avatar) by CX ART Lab under its MIT license. Its source and license are included in `vendor/agent-robot-avatar/`.

## License

Amythest's original code and artwork are available under the [MIT License](LICENSE). The bundled avatar and font retain their own licenses in `vendor/agent-robot-avatar/LICENSE` and `assets/fonts/OFL.txt`.
