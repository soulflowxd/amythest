# Amythest for Android (early APK)

This companion has Home, Apps, Timer, and Account screens. Home shows today's app usage and a seven-day chart. Apps lets you choose distractions, set a daily limit for an app, and turn on weekday work-hour reminders. Timer supports 5–180 minute focus sessions. Amythest can remind you to hop off a distracting app during focus or work hours, or after a daily limit. It does not block or close apps.

## Install

1. Build with `powershell -ExecutionPolicy Bypass -File android/build.ps1`.
2. Copy `android/dist/amythest-0.7.0-android.apk` to your phone and open it, or download it from the [v0.7.0 release](https://github.com/soulflowxd/amythest/releases/tag/v0.7.0).
3. If Android asks, allow installation from the app used to open the APK.
4. Open Amythest and tap **Allow Usage Access**, then enable Amythest in Android settings.
5. Amythest also offers **App awareness**. Choose **Open settings** in its prompt or card, then enable Amythest under Accessibility. This lets it observe foreground app package names locally; it does not read screen text.
6. Allow notifications when Android asks. Without Accessibility and notification permission, the app still shows usage but cannot send foreground distraction reminders.

## Hard Mode

Turn on **Hard Mode for next session** on the Timer screen before starting. Amythest then disables its early-stop button until the timer expires. Android reminders still appear, but this APK does not block other apps. Android settings can revoke access or uninstall Amythest, so Hard Mode is a commitment aid rather than device-level protection.

## Account sync

Open **Account** and sign in with the same Amythest email and password used by the Chrome extension. Android uploads daily totals to the existing Convex development deployment under its own `android` source. The account view shows separate Android, Chrome, and Windows snapshots. Android also syncs its daily goal, selected distracting package IDs, per-app limits, and work hours to other Android installations on that account. It never uploads screen text, app labels, or full local browsing files. Local tracking works without signing in. Chrome website limits and Windows app limits remain platform specific. If two Android devices change settings before either syncs, Amythest reports the conflict rather than silently replacing the cloud version.

Account email ownership is not verified. Password recovery is not available yet. The password is never stored on the phone; the refresh token is kept in Android's private app storage, and Android backup is disabled for this app.

This is a development-signed APK. Android may warn about installing outside the Play Store. Keep the same signing key for upgrades; the local build key lives in ignored `android/dist/` and is not a production release key.

## Pixel Private Space

Private Space is a separate Android profile. The Amythest installation in your main profile cannot read its app usage. If your Pixel allows it, install a second copy of this APK inside Private Space and grant that copy Usage Access there. It will show usage for that profile separately. This version does not combine the two profiles or see into a locked Private Space.
Accessibility access in the main profile does not guarantee Private Space visibility.

Requires Android 8.0 or newer. App totals come from Android's Usage Access API and may differ from Digital Wellbeing. The focus timer is a reminder, not an app lock.
