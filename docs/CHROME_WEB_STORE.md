# Chrome Web Store listing draft

Use this text in the developer dashboard after uploading the extension ZIP. Check the final wording against the version actually uploaded.

**Name:** Amythest — mindful screen time

**Category:** Productivity

**Short description:** Track website time, pause distractions, and set focus, work-hour, and daily site limits.

**Single purpose:** Help people understand and limit time spent on websites in Chrome.

**Detailed description:**

> Amythest shows how long you spend on websites while Chrome is active. It keeps productive sites visible in your activity and counts only chosen distractions toward your distraction goal. Set a daily limit for any site, use focus sessions or weekday work hours, and choose strict sites that stay paused during work hours. A reached site limit cannot be bypassed by a break or video reason.
>
> You can pause YouTube Shorts, Instagram Reels, TikTok videos, and long YouTube videos. A written reason temporarily unlocks only the selected video; Amythest cannot verify whether that reason is true. Instagram pages and TikTok messages remain available unless you set a full-site limit.
>
> Activity and settings work locally without an account. Optional account sync shares daily totals and limits across your devices. The extension does not sync full URLs, page titles, or written reasons.

**Privacy policy URL once pushed:** `https://github.com/soulflowxd/amythest/blob/main/PRIVACY.md`

**Support URL:** `https://github.com/soulflowxd/amythest/issues`

**Permission explanations:**

- **Host access to all sites:** Track time on the active site and display an in-page reminder while keeping the tab on its original URL. Users may set a limit for any domain.
- **tabs and webNavigation:** Identify the active tab and respond to URL changes, including video sites that navigate without a full page reload.
- **alarms:** Record elapsed time and refresh limits on a schedule.
- **storage:** Save local settings, daily domain totals, and optional account tokens.
- **declarativeNetRequest:** Clear legacy dynamic blocking rules so the current in-page overlay policy applies consistently.
- **nativeMessaging:** Optionally connect to the Windows companion for daily website totals and account session sharing.

**User data disclosures to review in the dashboard:** Website domain activity and time are collected locally. Optional sign-in uses an email address and password, and optional account sync sends daily per-domain totals and settings to Convex. No advertising, sale, or use of written reasons. Review the store's exact data category labels before selecting them.

**Listing image needed:** Capture the actual Chrome dashboard at 1280×800 or 640×400 with synthetic activity data. The existing popup screenshot is 380×980 and cannot be uploaded as the required listing screenshot.
