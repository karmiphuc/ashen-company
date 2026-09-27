# Verification - 2026-09-27

## Automated rules

Run `npm test`. The Node tests cover deterministic startup, supported equipment visuals, inventory conservation during equip/stow, pack limits, settlement access rules, travel bounds and terrain speeds, contract completion and renewal, daily upkeep, and rejection of invalid saves.

## Browser checks

Executed against the local static site using Playwright and installed Microsoft Edge, with a 1194 x 834 touch viewport:

- Initial render and all-assets offline-ready message.
- Buy mail armor and a kettle helmet, equip both, confirm portrait and equipment slots update.
- Take a delivery, travel at accelerated speed, receive the reward and renown.
- Disable networking, reload, recover the saved company, camp and open equipment.
- Check 834 x 1194 tablet portrait and 390 x 844 phone widths for horizontal overflow.
- Inspect world, company and portrait screenshots; no uncaught page errors.
- Export the current company when storage is unavailable or an old save is corrupt; preserve the corrupt original separately and restore autosaving by importing the current export.

WebKit 26.5 checks passed for initial rendering, touch interactions, reloading and opening a new tab after the origin server was stopped, retaining the saved company, navigation state, and save export/import.

The Playwright WebKit `setOffline(true)` navigation check failed with an internal error matching a documented upstream automation issue: [microsoft/playwright #42775](https://github.com/microsoft/playwright/issues/42775). Server-stopped checks were run separately and passed. These checks establish cached operation without the origin server; they do not establish real iPad airplane-mode behavior.

## Remaining device check

Actual Safari on iPad, Add to Home Screen installation, and a full airplane-mode relaunch on the user's device remain unverified. Follow the preflight steps in the README. iPadOS can evict browser storage, so keep an exported save backup.

## Scope

No combat, injury/loot loop, faction simulation or procedural map is claimed. Equipment protection/power/fatigue are groundwork for a later automated-combat phase. The small caravan and road network are scenery; the player travels directly across terrain.
