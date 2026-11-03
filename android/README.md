# Amythest for Android (early APK)

The four-step introduction shows an original amethyst geode opening. You can allow Usage Access there and optionally enable app reminders through Accessibility. Home, Apps, and Timer tabs follow; tap the profile icon for Settings and account sync. Home shows today's app usage, a seven-day chart, completed focus progress, and the geode. The geode has four states based only on distracting app time as a fraction of your daily budget; without Usage Access it shows a neutral state. It is a visual cue, not a health or sleep score. Apps lets you choose distractions, set a daily limit for an app, and turn on weekday work-hour reminders. Timer supports 5–180 minute focus sessions with a digital clock. Amythest can remind you to hop off a distracting app during focus or work hours, or after a daily limit. It does not block or close apps.

Focus minutes, completed sessions, streaks, and focus points are recorded locally when a timer finishes. Ending a session early earns no points. One completed focus minute earns one point; points have no monetary value. Sleep and referral rewards are not in this build.

To check timer accounting without a phone, run `powershell -ExecutionPolicy Bypass -File android/test.ps1`.

## Install

1. Build with `powershell -ExecutionPolicy Bypass -File android/build.ps1`.
2. Copy `android/dist/amythest-0.7.5-android.apk` to your phone and open it, or download it from the [v0.7.5 release](https://github.com/soulflowxd/amythest/releases/tag/v0.7.5).
3. If Android asks, allow installation from the app used to open the APK.
4. Follow the four introduction screens. On the last screen, tap **Allow Usage Access**, then enable Amythest in Android settings. Return to Amythest to continue.
5. Optionally tap **Enable app reminders** on the last screen or in Settings, then enable Amythest under Accessibility. This lets it observe foreground app package names locally; it does not read screen text.
6. Allow notifications when Android asks. Without Accessibility and notification permission, the app still shows usage but cannot send foreground distraction reminders.

## Hard Mode

Turn on **Hard Mode** on the Timer screen. This preference stays on for every future focus session until you turn it off. During a Hard Mode session, Amythest disables its early-stop button until the timer expires. Android reminders still appear, but this APK does not block other apps. Android settings can revoke access or uninstall Amythest, so Hard Mode is a commitment aid rather than device-level protection.

## Account sync

Tap the profile icon, then sign in with the same Amythest email and password used by the updated Chrome extension. Android uploads daily totals to the Amythest production Convex deployment under its own `android` source. Settings shows separate Android, Chrome, and Windows snapshots. Android also syncs its daily goal, selected distracting package IDs, per-app limits, and work hours to other Android installations on that account. Focus points and streaks stay local for now. It never uploads screen text, app labels, or full local browsing files. Local tracking works without signing in. Chrome website limits and Windows app limits remain platform specific. If two Android devices change settings before either syncs, Amythest reports the conflict rather than silently replacing the cloud version. Accounts from the previous development deployment need to be created again on production.

Account email ownership is not verified. Password recovery is not available yet. The password is never stored on the phone; the refresh token is encrypted using an app-specific Android Keystore key before being saved in private app storage. Existing unencrypted refresh tokens migrate on the next launch; if migration cannot complete, Amythest signs out and asks you to sign in again. Android backup is disabled for this app.

This is a development-signed APK. Android may warn about installing outside the Play Store. Keep the same signing key for upgrades; the local build key lives in ignored `android/dist/` and is not a production release key.

## Pixel Private Space

Private Space is a separate Android profile. The Amythest installation in your main profile cannot read its app usage. If your Pixel allows it, install a second copy of this APK inside Private Space and grant that copy Usage Access there. It will show usage for that profile separately. This version does not combine the two profiles or see into a locked Private Space.
Accessibility access in the main profile does not guarantee Private Space visibility.

Requires Android 8.0 or newer. App totals come from Android's Usage Access API and may differ from Digital Wellbeing. The focus timer is a reminder, not an app lock.
