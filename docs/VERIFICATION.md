# Verification - version 0.13, 2026-09-27

## v0.13 checks

The full automated suite passes 141 tests. Perk coverage includes point budgets and level gates, duplicate/unknown/overspent rejection, legacy migration, stat rounding and wound-deficit preservation, terrain movement, cover and hit modifiers, every packaged bow/crossbow variant and famed copies, damage/morale/recovery/XP effects, and save/reload during a Berserk bonus action. A second kill cannot trigger Berserk again in the same round. All 19 perk images match their credited source hashes and are included with the perk module in the offline cache. Six historical fixtures retain equipment, purse, inventory and battle positions after migration.

At 1024x768, a level-8 legacy fixture received seven perk points independently of its pending stat training. Colossus spent one point and raised maximum/current health from 100 to 125. Training a rolled +4 health then showed and applied 130/130 health. Completing three attribute choices opened the perk chooser. Learning Berserk and reloading preserved both learned perks and five remaining points. A level-1 fighter could inspect Berserk but could not learn it. Perk descriptions, learned state, icons and the fixed action footer were inspected in the browser.

With the local server stopped and a direct HTTP request failing, a fresh browser tab restored the company. Learning Bullseye offline and reloading preserved it and four remaining points. In a staged offline battle, a kill visibly logged Killing Frenzy (+25% damage) and Berserk (+2 AP), leaving the captain active with 2 AP and 11 fatigue. Reloading preserved that exact state; the immediate bonus attack then spent the AP and raised fatigue to 22 without another recovery. Resolving the battle produced victory in four rounds with all three members alive. No JavaScript errors occurred in the offline tab. Physical iPad Safari installation and airplane-mode retention remain untested.

## Historical v0.12 checks

The full automated suite passes 131 tests. New checks cover bulk purchase stock, affordability and storage caps, distinct famed armor conditions, invalid purchase atomicity, saved town/camp arrival actions, legacy save defaults, and double-tap timing, movement, cancellation and target matching. Generated offline cache consistency and `git diff --check` pass.

The catalog contains 96 items. The 36 additions have 71 inventory and worn-layer PNGs, verified against their pinned source manifest. A browser gallery was inspected and weapon grips, rotations, scale and helmet offsets were corrected individually. At 1024x768, a v0.11 company save migrated to Sallet, Plate Cuirass, Bardiche, Composite Bow and other new equipment and rendered in the equipment screen.

Browser double-clicks travelled to Greyhaven and opened its settlement menu, attacked a camp on arrival, and pursued a moving Hungry Deserters band directly into combat. Both battles completed. The shared pointer handler covers mouse and touch; physical iPad double-tapping remains untested.

Buying all two Bandages spent 116 crowns and removed the trader listing. Buying all 31 ammunition spent 124 crowns, raised ammunition from 16 to 47, and removed its supply card. Buying all three Hand Axes spent 510 crowns and removed their trader listing while retaining three copies in the stash.

With both local servers stopped and a direct HTTP request failing, a fresh tab restored the new equipped items, 9,490 crowns, three Hand Axes and the exhausted listing. Buying both Surgeon's Kits offline spent 360 crowns; reloading retained 9,130 crowns and both kits. No JavaScript errors occurred in that offline tab. Physical iPad Safari installation and airplane-mode save retention remain untested.

## Historical v0.11 checks

The full automated suite passes 118 tests, including new coverage for reserve sets, pocket daggers, safe consumable use, shield stats, crossbow reload preservation, casualty recovery, legacy famed rewards, and thrown-weapon rendering. Six saved fixtures from v0.9 through v0.10.1 migrate without changing their equipment, purse, inventory, or battle positions.

In the browser, accessory filtering included the Qatal Dagger, exact-slot equipping replaced the chosen pocket, and Heavy Throwing Axes could be assigned to the reserve set. Swapping active and reserve sets persisted after reload. A Bandages marketplace tile sold immediately for 27 crowns; buying a Medical Satchel for 110 added a second copy to the stash.

In staged battles, a greatsword fighter readied Javelins and Heater Shield on approach. A wounded captain used Bandages, healing from 35 to 59 HP, consuming one accessory and the full turn; the result persisted after reload. A trapped bow user drew the Qatal Dagger from a pocket and spent the turn, preserving the bow.

A javelin attack displayed the packaged javelin icon in flight and dealt 10 health and 20 armor damage in the staged browser case. The renderer also has automated coverage for spinning throwing axes and heavy-crossbow bolts.

At 1024x768, the equipment screen and a 35-item gallery were inspected. New weapon sprites use individual grip pivots; large blades and polearms stay visible at the portrait's right side. All 60 inventory icons exist, and the 67 new source assets match their pinned SHA-256 provenance manifest.

With both local servers stopped and a direct HTTP request failing, a fresh tab loaded the saved company with its reserve and accessories. An offline set swap persisted after reload. A staged camp battle resolved offline in nine rounds with all three fighters alive; claiming loot and reloading restored Greatsword as the captain's active weapon and Javelins in reserve. No JavaScript errors occurred in that fresh offline tab. Physical iPad Safari installation and airplane-mode save retention remain untested.

## Historical v0.10.1 checks

The full automated suite passes 102 tests. Six new regressions cover ranged spacing across tactics, nearby non-target enemies, retreat with a distant focus target, crossbow reload, trapped/empty-ammo behavior, and seeded battle completion. Offline cache consistency and `git diff --check` pass.

At 1024x768, tapping a Cloth Hood in the marketplace sold one of two copies immediately: the balance changed from 4,520 to 4,535 crowns while the marketplace remained open. A second tap sold the remaining copy, removed its stash tile, and raised the balance to 4,550. Reloading preserved the sales. Trader inventory still opened item details before purchase.

In a reproduced terrain case, a bow-equipped captain at (2,2) previously stepped into adjacent melee at (3,2) to gain elevation against an enemy at (4,2). In the browser, the fixed actor stayed at (2,2), fired, and consumed one arrow (16 to 15). Equipment-screen armor inspection remained available.

With the local server stopped and direct HTTP requests failing, a fresh tab restored that battle with 15 arrows and the same actor position. Resolving offline produced a five-round victory with all brothers alive and 12 arrows remaining; another reload preserved the result. No JavaScript errors occurred. Physical iPad Safari remains untested.

## Historical v0.10 checks

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

Combat remains a simplified automatic simulation. The 19 perks use the exact effects described in the chooser; full class-specific trees, faction armies, and a procedural campaign are not implemented. Overworld travel has no pathfinding, and wounds are represented by lost HP rather than Battle Brothers' full injury system. Physical iPad Safari installation, airplane-mode launch, and save retention have not been tested.
