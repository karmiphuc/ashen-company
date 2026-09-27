# Verification - version 0.7, 2026-09-27

## Automated checks

`npm test` passes all 62 tests. Offline asset and generated service-worker cache consistency pass, as does `git diff --check`.

## v0.7 level-up checks

A migrated day-2 save with one unspent level-up displayed eight attribute choices. The chooser required three distinct selections; removing a selection disabled confirmation until it was replaced. Closing and reopening preserved the same rolls. For Toren, the saved options included +2 HP, +3 maximum fatigue, and +4 ranged skill. Confirming those three changed the corresponding totals (100 to 102 HP, 86 to 89 maximum fatigue, 54 to 58 ranged skill), left the other five attributes unchanged, consumed the level-up, and remained saved after reload. At 1024x768, all eight rows and the complete controls fit on screen.

With the server stopped and direct HTTP requests failing, a fresh tab reopened the cached game. Mara showed the same eight rolls as online. Offline, choosing Melee Skill +2 (63 to 65), Melee Defense +4 (13 to 17), and Resolve +5 (52 to 57) spent the level-up; reloading preserved those exact stats. No JavaScript errors occurred.

## Historical v0.6 browser checks

At a confirmed 1024x768 viewport, the full crossbow detail and action controls remained visible. The six-face by six-helmet gallery showed complete helmet crowns, open face apertures, and no neck gaps. Six portrait profiles keep their head, hair, beard, and body identity when equipment changes.

The migrated day-2 save retained 133 crowns after the local origin server was stopped and direct HTTP requests failed. Reopening a fresh tab loaded the cached game and preserved the save. Crossbow stats and handling were inspectable; no JavaScript errors occurred in the exercised flows.

Physical iPad Safari installation, airplane-mode launch, and save retention have not been tested.

## Historical v0.5-v0.6 verification

Earlier releases passed their recorded automated and browser checks for battle tactics, combat animation, loot, item inspection, portraits, and offline reload. Those results describe prior versions; see Git history for the detailed records.

## Current limits

Combat remains a simplified automatic simulation with three fixed camps and four renewable small roaming bands. Faction armies, perks, and a procedural campaign are not implemented. Player travel crosses terrain directly, and wounds are represented by lost HP rather than Battle Brothers' full injury system.
