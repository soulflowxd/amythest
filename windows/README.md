# Amythest for Windows

The window layout and visual rules are documented in the repository's `DESIGN.md`. The bundled title-bar icon uses the transparent Amythest mark.

This is a native Windows companion to the Amythest Chrome extension. It tracks time spent in foreground desktop apps while you are using the computer. The Chrome extension continues to handle individual websites and videos.

## Run it

Choose one download:

- **Installer:** Run `amythest-0.6.0-windows-setup.exe`. It installs for your Windows account, adds a Start menu shortcut, and can be removed from Installed Apps. No administrator permission is needed.
- **Portable:** Extract `amythest-0.6.0-windows.zip` into a folder and open `Amythest.exe`. Keep `Amythest.NativeHost.exe` and `icon48.png` beside it.

Leave Amythest running to track time. Closing its window sends it to the system tray; right-click the tray icon to reopen it or quit. Uninstalling the app leaves local screen-time data in `%LOCALAPPDATA%\Amythest` so it can be restored later.

The app uses the Windows .NET Framework 4.x desktop runtime. It does not need Node, Git, an account, or a server. Windows may show a SmartScreen warning because this app is not code-signed.

## Set boundaries

- **Today:** See an hourly activity chart and all tracked desktop apps with their foreground time.
- **Websites:** See active site time, video time, and distraction time from the Chrome extension. This is a separate breakdown of Chrome, so it is not added to desktop app time.
- **Account:** After signing in through the extension, see the same day's Chrome and Windows totals from each connected device. Set or remove Chrome website limits here; they sync back to the extension. Each activity source stays on its own row.
- **Distraction goal:** Only apps you add as distractions count toward this goal.
- **Distracting apps:** Enter a process name such as `discord.exe`. The `.exe` suffix is optional. While a focus session or work hours are active, opening one shows a full-screen reminder.
- **Daily app limits:** Set a minute limit for any app. After the limit, that app shows the reminder until the next local day.
- **Work hours:** Set a weekday start and end time. Overnight schedules are supported.
- **Focus session:** Start or end a 25-minute session from the main window.
- **Five-minute break:** The reminder lets you temporarily pause blocking. It never closes another app or deletes its data.

The reminder is a self-control prompt, not an unbreakable security restriction. Amythest skips counting after 60 seconds without keyboard or mouse input. It does not count time when its own window is active. Windows system processes such as Explorer and Task Manager cannot be added to the block list.

## Connect the Chrome extension

1. Install the Amythest extension as described in the repository README.
2. Open `chrome://extensions` and enable **Developer mode**. Copy the 32-letter ID shown on the Amythest card.
3. In the Windows app, open **Websites**, paste the ID, and select **Connect Chrome**.
4. Reload Amythest on `chrome://extensions`. Visit a site and wait about a minute for the Websites tab to update.

The bridge uses Chrome native messaging on this Windows account. It sends only daily totals by domain to `%LOCALAPPDATA%\Amythest`, without page URLs, titles, or typed text. The extension works without the Windows app, and the Windows app works without the extension.

## Optional account sync

Connect Chrome as described above, then create an account or sign in with email and password in the extension dashboard. No email verification or Resend setup is needed. The extension passes a short-lived access token to the Windows bridge. The Windows app protects it with Windows user encryption and syncs desktop totals and **app boundaries** while it is valid. It never receives the refresh token; keep Chrome running so the extension can renew the Windows session. Signing out in the extension clears the Windows token. Windows app limits and distractions sync to other Windows installations on the account; Chrome website limits and video controls sync to other Chrome installations. You can also edit app limits from the extension and website limits from the Windows Account tab. A website rule never becomes a Windows process rule. If edits on two Windows devices conflict, the Account tab asks you to review and choose the cloud version. Website and desktop totals remain separate to avoid counting Chrome twice. If the account service is unavailable, tracking still works locally. The **Websites** view shows sync status.

## Build from source

On Windows, run `powershell -ExecutionPolicy Bypass -File windows\build.ps1 -Package` from the repository root. The script uses the Windows .NET Framework C# compiler and produces `windows\dist\Amythest.exe`, `windows\dist\Amythest.NativeHost.exe`, and `windows\dist\amythest-0.6.0-windows.zip`. If NSIS 3 is available, it also produces `windows\dist\amythest-0.6.0-windows-setup.exe` from `windows\installer.nsi`. Pass `-OutputDirectory` to build elsewhere when the installed or portable EXE is running. It compiles and runs core and bridge tests before packaging. The repository's MIT license also covers the Windows app.
