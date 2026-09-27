# Verification - version 0.8, 2026-09-27

## v0.8 checks

The full automated suite passes 79 tests. The offline asset list and generated service-worker cache are built consistently, and `git diff --check` passes.

Engine review covered 30 seeds with three repeat-clear/respawn cycles each; 20 hunt contracts remained valid through camp respawn and paid exactly once. Across 6,000 seeded camp placements, camps stayed inside bounds and clear of the sea, settlements, and fixed camps. All 498 frontier-battle cases resolved and passed save validation across the three tactics and four biomes.

At 1024x768, the expanded map showed all 16 settlements and 15 camps without horizontal overflow. Terrain inspection opened from a tapped battle tile.

With the local server stopped and direct HTTP requests failing, a fresh tab reopened the cached game and restored a round-7 forest battle with 112 terrain tiles, including 31 trees. It preserved the same HP values (100/100/38) and Defense tactic. Switching to Thin them out, the company won in 10 rounds with all three members alive. The 100-crown reward changed the balance from 133 to 233 and persisted after reload with the camp's 120-hour cooldown. Camping for six hours reduced the cooldown to 114 hours. No JavaScript errors occurred. Physical iPad Safari remains untested.

## Historical v0.7 checks

The v0.7 automated suite passed 62 tests; offline asset and generated service-worker cache consistency passed, as did `git diff --check`.

The level-up chooser offered eight attribute choices and required three distinct selections. Removing a selection disabled confirmation until it was replaced. Closing and reopening preserved the rolls. Toren's +2 HP, +3 maximum fatigue, and +4 ranged skill choices changed the corresponding totals (100 to 102 HP, 86 to 89 maximum fatigue, 54 to 58 ranged skill), left the other five attributes unchanged, consumed the level-up, and remained saved after reload. At 1024x768, all eight rows and the complete controls fit on screen.

With the server stopped and direct HTTP requests failing, a fresh tab reopened the cached game. Mara showed the same eight rolls as online. Offline, choosing Melee Skill +2 (63 to 65), Melee Defense +4 (13 to 17), and Resolve +5 (52 to 57) spent the level-up; reloading preserved those exact stats. No JavaScript errors occurred.

## Historical v0.6 browser checks

At a confirmed 1024x768 viewport, the full crossbow detail and action controls remained visible. The six-face by six-helmet gallery showed complete helmet crowns, open face apertures, and no neck gaps. Six portrait profiles keep their head, hair, beard, and body identity when equipment changes.

The migrated day-2 save retained 133 crowns after the local origin server was stopped and direct HTTP requests failed. Reopening a fresh tab loaded the cached game and preserved the save. Crossbow stats and handling were inspectable; no JavaScript errors occurred in the exercised flows.

Physical iPad Safari installation, airplane-mode launch, and save retention have not been tested.

## Historical v0.5 verification

Earlier releases passed their recorded automated and browser checks for battle tactics, combat animation, loot, item inspection, portraits, and offline reload. Those results describe prior versions; see Git history for the detailed records.

## Current limits

Combat remains a simplified automatic simulation. Faction armies, perks, and a procedural campaign are not implemented. Overworld travel has no pathfinding, and wounds are represented by lost HP rather than Battle Brothers' full injury system. Physical iPad Safari installation, airplane-mode launch, and save retention have not been tested.
