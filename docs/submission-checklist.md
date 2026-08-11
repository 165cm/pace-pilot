# PacePilot submission checklist

## Blocking before submission

- Replace the temporary `app.appId` value `2001001` with the App ID issued for PacePilot in Zepp Developer Console.
- Confirm that the App ID in the ZAB package matches the application registered in the Console.
- Select only languages actually supported by the package. The current UI language is English.
- Enter a privacy statement that explains local session-history storage and the use of Alarm and Notification permissions.

## Package and compatibility

- Configuration format: `app.json` v3
- Minimum API level: 3.0
- Square design baseline: 390 x 450 px
- Round design baseline: 480 x 480 px
- All layout dimensions use `px()` or actual device width/height calculations.
- Verify on Bip 6, a 320 x 380 square simulator, and at least one 480 px round simulator.

## Visual inspection

- No important content enters the square-screen safe insets: left/right 24 px, top 16 px, bottom 28 px.
- No text displays an ellipsis in normal, paused, finish, or auto-added states.
- Verify countdowns at `59:59` and `01:00:00`.
- Verify 1, 2, and 12-unit progress bars.
- Verify Stop, Pause, Resume, Start, and preset controls remain fully visible.
- Verify all screens with the system status bar hidden on square devices.
- Confirm that right-swipe navigation is not obstructed.

## Store assets

- Package icon is circular with a transparent safe area.
- Console icon: `store/icon-240.png` (240 x 240 PNG).
- Prepare at least three 360 x 360 transparent-background screenshots.
- For rectangular devices, center the full-height app screenshot with equal left/right margins.

## Functional review

- Work and Finish phases change automatically.
- A unit is added automatically after the planned final unit.
- Pause cancels future alarms; Resume registers shifted alarms.
- Stop removes all future alarms and saves one history record.
- Permission denial blocks the timer with a clear message.
- Screen-off and app-exit notifications work on a physical Bip 6.
- Reopening the app restores the correct phase and absolute time.

## Console metadata

- App name: PacePilot
- Suggested category: Productivity / Tools
- Declare Alarm, Notification, and Local Storage permissions.
- Declare that no third-party SDK is included.
- Upload the English privacy statement from `docs/privacy-policy-en.md`.
