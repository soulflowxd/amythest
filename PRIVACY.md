# Amythest Chrome extension privacy

Last updated: November 11, 2026

Amythest is a screen-time and focus extension. It measures time on websites while Chrome is active and shows reminders on sites you choose to limit. The extension runs locally without an account.

## What Amythest handles

- Website domains and time spent on them, including time on video pages, are saved in Chrome's local extension storage for activity charts, limits, and the distraction goal. The extension checks the current page URL to apply rules, but does not save full page URLs or page titles.
- Your settings include distraction domains, site limits, work hours, focus sessions, the daily break count, and temporary video access. Written reasons are checked on your device and are not saved. A selected purpose and temporary access expiration may be saved locally until access expires.
- If you choose to create an account or sign in, Amythest sends your email address and password to its Convex authentication service. The extension stores account tokens in Chrome's local extension storage. It syncs settings, daily totals, and per-domain website time to Convex. It does not sync full page URLs, titles, written reasons, the local break counter, or strict work-hours site list. Account sync is optional.
- If you connect the Windows companion, the extension can send per-domain daily totals and an account session token to that app through Chrome native messaging. The Windows app protects account tokens with Windows user encryption.

## Permissions

Amythest requests access to websites so it can measure active-tab time and show an in-page reminder without redirecting the tab. It uses tabs, web navigation, and alarms to notice page changes and update time records. It uses storage for settings and activity, declarative net request for its blocking policy, and native messaging for the optional Windows companion.

## Sharing and control

Amythest does not sell browsing data or use it for advertising. Website data stays on your device unless you opt in to account sync or connect the Windows companion. Convex processes the account information and synced data needed to provide that optional service. You can sign out in the dashboard. Removing the extension clears its local storage through Chrome; signing out does not by itself erase data already synced to your account.

To request deletion of synced account data or ask a privacy question, open an issue at [the Amythest repository](https://github.com/soulflowxd/amythest/issues). Do not put passwords or private browsing details in a public issue.

The use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.
