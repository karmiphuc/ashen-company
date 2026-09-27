# Verification - version 0.10, 2026-09-27

## v0.10 checks

The full automated suite passes 96 tests, including seven new cases for mixed salvage with exact durability, saved formation deployment, automatic pursuit combat, and legacy save migration. Offline asset/cache consistency and `git diff --check` pass.

At 1024x768, a six-member formation supported occupied-slot swaps and moving Toren from the front to the rear; reloading preserved both changes. A natural seed-60 camp victory yielded 115 crowns, 5 provisions, 3 tools, 5 ammunition, three weapons, and two Patched Coats at 7/20 and 6/20 durability. Inspecting the second coat showed 6/20; collecting the reward preserved worn condition in the stash and added the supplies. Nearby engagement entered a running battle directly, and pursuing a band from farther away automatically entered battle on contact without a confirmation dialog.

With the local server stopped and direct HTTP requests failing, a fresh tab loaded the cached game. Moving Toren to the rear line offline persisted after another reload. No JavaScript errors occurred in the exercised flows. Physical iPad Safari installation and airplane-mode retention remain untested.

An engine balance check across 100 seeds per tactic won every starter-band and first-camp battle. The two starter bands kept full rosters across all tactics; the first camp retained complete rosters in 97 offense, 98 defense, and 93 focused-fire runs. Across 100 victories, the first camp averaged 2.75 recovered items and 128 crowns; road thieves averaged 1.42 items and 60 crowns. These are sampled outcomes, not guarantees.

## Historical v0.9 checks

The full automated suite passes 89 tests, including ten new cases for famed equipment and patrol variety. Offline asset/cache consistency and `git diff --check` pass. Checks cover malformed famed IDs, real camp drops, no reload/retreat reroll, legacy battle migration, item inspection, equipment, damaged armor, sell/buyback, combat saves, and stable bounded patrol rosters.

Across 15,000 generated camps, observed famed drop rates were approximately 14.2%, 24.6%, and 39.8% for the three difficulty tiers (targets 15%, 25%, and 40%). An additional engine check exercised the four beginner bands across four spawn cycles and 100 seeds each: all fights were won, with 99-100 complete rosters surviving per batch. Duplicate famed armor instances retained their distinct 10/57 durability through sale, reload, and buyback.

At 1024x768, a naturally generated seed-12 camp victory awarded a Grimwolf Arming Sword with 22-33 damage, +13 hit modifier, and 115% armor damage. The reward could be inspected before claiming, equipped, and reloaded. A separate equipment fixture verified gold silhouette outlines on stash, worn items, and equipped-slot icons; boosted body/head protection was 138/210, and the famed shield raised both defenses to 20. Selling the named shield for 144 crowns and buying it back for 288 preserved its name and bonuses.

With the local server stopped and direct HTTP requests failing, a fresh browser tab restored the same famed loadout, 4,856-crown balance, and effective stats from cache. Equipping Oathkeeper Light Crossbow offline persisted across another reload. Camp scouting showed its 15% famed-item chance offline. No JavaScript errors occurred in these flows. Physical iPad Safari installation and airplane-mode retention remain untested.

## Historical v0.8 checks

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
