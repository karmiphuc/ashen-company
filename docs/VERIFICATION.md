# Verification - version 0.44.4, 2026-10-03

## v0.44.4 checks

All 480 tests pass. One-handed weapons and shields now share the **right** side of the displayed company portrait; their crop bounds are included in right-side framing while the center chest stays clear. The complete ordinary/named/display-only weapon/shield pairing regression now asserts the requested right-hand position and unclipped shields. Mirrored enemy projectile checks follow the corrected grip.

Riding Horse uses reduced animal layers at the lower left, leaving the full-size rider's face and center chest visible. Its mane and head meet the same base plate at the same height. New regression checks cover multiple appearances and helmet choices, the horse's face/chest clearance, shared plate and matching animal scale. The other four mounts and two-handed weapon rest poses retain their placements.

Chromium visual inspection covers right-side shields, weapon poses, all mounts and Riding Horse with multiple helmets and appearances. Fresh offline browser verification loads 523/523 assets, relaunches offline and reports no exceptions.

## v0.44.3 checks

All 479 automated tests pass. Weapon regressions cover every one-handed weapon with every shield, ordinary/named/display-only objects, and every two-handed melee family on foot and on all five mounts. They check the shared left-hand grip, clear center chest, enlarged two-handed sprites, opposite-shoulder axis, complete raster bounds inside the portrait, and preserved animation rest/origin variables. Mounted tests check one common coordinate space and base plate, full-size riders, foreground animal parts below equipment, and projectile origins matching the actual framed grip. Existing 113-helmet anchor and crown/horn framing checks continue to pass.

A fresh Chromium profile verifies all 523 offline assets and an offline relaunch. Rendered galleries inspect all weapon families, all five mounts, representative shields, armor and named items, and company/enemy attack poses. No missing images or browser exceptions.

## v0.44.2 checks

All 475 automated tests pass. Fresh offline browser verification loads all 523 cached assets, the four corrected item presentations and all three new attachment overlays without exceptions. Repeated importer builds are identical. Asset regressions verify cloth Vizier inventory art, native full-torso Animal Pelt/Noble Mail images and anchors, the explicitly adapted full Ancient Attire torso, preservation of all three decorative image pairs, independent attachment protection, damage-preserving equip/stow/save behavior, mounted overlays and regional enemy distribution. Existing attachment market-rotation tests cover the expanded 18-piece catalog and purchase paths. Helmet placement regressions continue to cover all 113 imported helmets.

## v0.44.1 checks

Medical icons now use rolled-bandage and medicine-supply images, with per-file pinned provenance and hashes. All nine shield sprite variants appear on the weapon side, including mounted portraits. Portrait and offline checks pass, with 517 cached assets on a fresh offline browser reload.

All 471 automated tests pass, and fresh offline browser galleries verify all 113 imported helmets with no exceptions. The DLC importer had incorrectly anchored helmets to the torso origin y=63; the native head origin is y=48. All 113 imported helmets failed the source-geometry regression against v0.44.0. The importer now uses separate head/body origins and records native brush bounds and raster dimensions. Tall crowns and wide horns fit by transforming the whole composition, preserving helmet-to-face alignment rather than lowering helmets. Regression coverage checks all 113 helmets, independent reference shapes, all six head appearances, ordinary and named variants, mounted riders, crown/horn clipping and unchanged armor anchors.

## v0.44.0 checks

All 469 automated tests pass. Coverage includes exact 33% area reduction, all regions/roads/towns, unmodified real v0.43 save fixtures, one-time migration and active-battle preservation, city stable distribution and regional beasts, deterministic named-plus-mount camp loot, city-only patrol counts, distant tours, rival victories/defeats, permanent casualties, home recovery, protected company targets, quarter-hour chunk invariance, no NPC company rewards, and malformed-save rejection. Existing hostile-only tests isolate their soldier patrols so caravan timing and deterministic starter fights remain independently covered.

A 30-day campaign simulation produced 343 reported engagements including 26 rival-patrol reports, reached more than 1,000 units from home, and passed save validation after every four simulated hours. Fresh Chromium offline relaunch verifies all 517 cached assets, all 217 catalog designs and their portrait sprites, patrol selection and rosters, and no browser exceptions. Physical iPad Safari is not tested.

## v0.40.0 checks

All 439 automated tests pass after regenerating the offline cache. Mount skill checks cover both charge distances, all six straight directions, fixed AP with mastery, normal damage, guaranteed stun through protection, blocked pushes, trees/cliffs/occupied routes, inadequate AP/fatigue, miss behavior, Spearwall interruption, ranged and formation exclusions, one free bite after hits/misses/area attacks, reaction recursion prevention, wolf kill rewards with immediate Berserk AP, animation markup and save-per-action parity. Earlier engine battle fixtures retain exact resolved results. Reward checks cover three deterministic town events, free guaranteed acquisition, availability without expiry, full-stash retry, once-only claim flags, unavailable/remote claims, battle/game-over rejection and older save loading.

Browser verification exercised the Oakwatch acceptance button and confirmed its claimed status. Paused battle fixtures show charge damage and stun, and the wolf's separate follow-up damage. The event module is included in the offline cache. Physical iPad Safari and airplane-mode retention remain untested.

## v0.39.0 checks

All 426 tests pass after rebuilding the offline cache. Flight tests cover successful and failed 50% rolls, one check per turn, save persistence, opportunity attacks without AP or ammo spending, interrupted flight, escape without kill XP or escaped gear salvage, malformed flight fields and instant/stepwise resolution parity. Dual-crossbow tests exercise identical and different items with Quick Hands and Crossbow Mastery, preserve both loading states across reload, and verify reload affects only the wielded weapon. Without enough AP, the AI reloads rather than paying for an unusable swap.

The browser showed a Breaking enemy with the Fleeing indicator while paused. The animated forest battle completed in three rounds with all brothers surviving; no browser warnings or errors were recorded. Physical iPad Safari remains untested.

## v0.38.0 checks

All 419 tests pass after rebuilding the offline cache. Matching masteries reduce basic and signature attack AP once, including overlapping axe/polearm mastery, bows, crossbows, throwing weapons, daggers and two-handed weapons. A three-AP mastered Knock Out and Spearwall are selected and paid correctly; unmatched masteries and earlier battle rules retain base costs. The existing Aimed Shot test now verifies its six-AP mastered cost. Mastery descriptions render correctly in the browser perk chooser.

## v0.37.0 checks

All 416 automated tests pass after rebuilding the offline cache, and the final diff passes whitespace checks. The delegated review found issues with target priorities, Defense bracing, reaction Berserk, redundant Riposte and shield bypass; each was corrected and covered by a regression. The reviewer hit its usage limit before issuing a final verdict; the final full test run and source checks were completed by the primary agent.

Weapon-family tests cover AP and mastery fatigue, every catalog family and famed inheritance, armor/shield effects, stun protection, stance expiry, blocked and successful interceptions, nested counters, area geometry, friendly-fire restrictions and target priorities. Compatibility tests load a synthetic save produced by the released v0.36 engine, compare its complete resolved result against that previous engine, and compare instant resolution with saving after every action. Existing two-AP and earlier nine-AP battles retain their rules.

Browser verification showed paused Spearwall, Riposte and stun badges, and Greatsword details with Split at 6 AP/25 fatigue and Swing at 6 AP/30 fatigue. A company equipped with sword, spear and greatsword completed an animated forest battle in three rounds with all fighters surviving. The exercised browser flows recorded no warnings or JavaScript errors. Automated cache verification covers the new area-safety module; physical iPad Safari and airplane-mode retention remain untested.

## Historical v0.25.0 checks

The full automated suite passes 252 tests after regenerating the offline cache. Movement checks cover impassable terrain, Pathfinder, formation detours, clear twelve-enemy deployment and save validation. The 100-seed starter samples each produce 100 victories: Road Thieves and Hungry Deserters keep all brothers alive in all samples, while Quarry Camp keeps all alive in 94. Its full-roster test floor is now 90% to allow the casualty variation introduced by obstacles, while retaining the 100% victory requirement.

The catalog contains 40 combat perks. Sword, axe, mace, spear, polearm, dagger and throwing masteries now reduce matching attack fatigue by 25%, rounded up to whole fatigue; overlapping masteries apply the reduction once. The AI uses the same cost to decide whether it can attack. Their existing hit and damage bonuses remain. Retired Student, Field Medic, Forager, Paymaster and Trailblazer IDs are removed from loaded party and active battle saves, refunding their points; unknown IDs still fail validation. Recover remains under Mobility & stamina.

Elevated hexes rise 20 pixels per level and expose earth sidewalls, with matching unit and animation coordinates. Dense tree hexes are impassable and obstruct ranged shots. Existing ordinary tree tiles remain passable cover. New fields keep deployment bands clear of blockers and preserve connected walkable ground; saved fields retain their terrain.

At 1024x768, the mastery chooser displayed the new descriptions and no support group. Learning Axe Mastery spent one point and survived reload. A forest battle completed in twelve rounds, with all brothers surviving. Raised tile faces, tree obstacles and readable unit labels were checked visually. These browser sessions recorded no JavaScript errors.

An independent review exercised ten seeds across all five tactics: all fifty battles ended in victory within 500 actions, every intermediate save validated, and no living unit occupied dense trees. The no-ammo shield-wall regression finished in round nineteen. Formation detours retain one-hex movement and rebuild their saved origins from actual positions.

With the unmodified local production server stopped and direct HTTP unavailable, a fresh browser tab launched from cache and displayed Offline ready and version 0.25. Physical iPad Safari installation, airplane-mode launch and save retention remain untested.

## Historical v0.24.0 checks

The full automated suite passes 247 tests after regenerating the offline cache. The attachment catalog now has fifteen items: thirteen visible outer pieces plus two hidden inner reinforcements. Ten new styles add bone, horned, chain, heraldic, gladiator, skull, spiked, stag and kraken looks, using 22 additional pinned source PNGs. The original five stat rows remain unchanged. All item descriptions and inventory icons resolve; the attachment manifest verifies all 31 attachment images.

Across 500 seeded Ironford markets, every attachment appeared and each of the ten new pieces was bought successfully. Existing market records migrate to include new catalog entries. Nine additions use the existing capped better/premium equipment slots; the single common addition keeps the existing 50% per-copy stock roll. No shop-rule or combat-rule changes were needed.

Browser galleries verified all ten new styles with matching armor and helmets, plus forty comparisons across light, mail, heavy and mounted bodies with weapons and shields. The horse body layer moved from y=57 to y=42 on its 104x142 composition, closing the visible neck gap and bringing it closer to the rider. The head anchor and right-facing company orientation are unchanged; the mirrored enemy comparison remains left-facing. Wolf mounts retain their existing anchors.

With the unmodified local preview server stopped and direct HTTP refused, a fresh tab reopened the game, displayed Offline ready and version 0.24, and loaded the newly cached Kraken Mantle portrait PNG. Physical iPad Safari remains untested.

## Historical v0.23.0 checks

The full automated suite passes 245 tests after regenerating the offline cache. Twenty northern weapons, armor, helmets and shields join five armor attachments. Northern armories favor local better/premium gear without changing the 50% stock reduction. Northern enemy equipment remains tiered; early body armor caps at 85 and middle-tier armor at 175. Weapon-family perks recognize the new weapons; slings emit stones and do not gain bow bonuses. The pinned source manifests verify 49 added PNG files.

Named armor and helmets retain their protection rolls and saved IDs, gain 1.5-2 times the former fatigue relief before rounding/capping, and roll one additional defense, resolve or maximum-fatigue bonus. Tests cover deterministic rolls and exact stat application. Attachments require body armor, absorb body armor damage first, keep their own condition, participate in fatigue perks, and support repair, trading, loot and casualty recovery. Tests cover atomic stowing with full-pack rejection and migrating/resuming older active battles. A separate integration review found no material correctness issue.

Browser checks at 1024x768 inspected the new protection slot and named item details. Stowing body armor also stowed the damaged 9/25 fur mantle; refitting it onto named mail preserved its condition after reload. The mail increased melee defense from 13 to 15. Smithy repair restored the mantle to 25/25 for eight crowns, preserving the helmet and body armor. No JavaScript errors occurred in these exercised flows. Galleries verified all northern helmet anchors and fur, iron and scale attachments over light, mail, heavy and mounted bodies. Padding and leather reinforcement remain visually hidden.

With the unmodified production preview server stopped and direct HTTP refused, a fresh browser tab reopened the game with Offline ready. The marketplace displayed new northern gear and attachments; Padded Lining's new icon, description, stats and purchase controls loaded offline. Physical iPad Safari installation, airplane-mode launch and save retention remain untested.

## Historical v0.22.0 checks

The full automated suite passes 225 tests after regenerating the offline cache. The catalog contains 45 perks, including 26 new weapon, defense, ranged, mobility and support choices. Focused comparisons exercise every new effect, including weapon hit bonuses, armor/health damage, shield defenses after swaps, lightweight movement, reload recovery, healing, foraging, wages and travel. Save tests retain new perk IDs and points; UI tests verify six groups, every card and bundled icon. Existing ranged AI, formation, mounted combat and historical perk tests remain passing.

Enemy progression is gated by both campaign age and the average level of up to six strongest living brothers. Tier 0/1 fights remain unchanged. Tier 2 caps at veteran rank 3, tier 3 at rank 5; ranks require average levels 5/7/9/11/13 and days 14/21/28/35/42 respectively. Each rank grants 8 health, 4 hit skill, 2 defense, 3 initiative and 4 resolve. Experienced larger companies draw reinforcements, capped at twelve enemies. Tests cover both gates, recruit dilution, casualty handling, preserved training fights, twelve-enemy placement, reload and invalid enemy IDs. Existing active battle snapshots retain their original stats.

Enemy cavalry now additionally requires tier 3, day 35 or later, and an experienced core averaging level 9 or higher, before its existing 2% leader roll. A 100-seed initial-world check finds no enemy mounts; the late-game test retains the scout-visible mount in battle. A separate bounded review confirmed progression bounds, legal deployment and old-save compatibility.

Browser checks learned Shield Bearer and Trailblazer, spent exactly two points, increased shield defense from 13 to 18, and retained both perks and +5% travel after reload. At 1024x768 the grouped perk cards and learn control remain readable. Scouting a rank-five hideout showed its seven fighters and explicit +40 health/+20 hit/+10 defense warning before engagement. No JavaScript errors were recorded in that session. Physical iPad Safari behavior remains untested.

With the unmodified production preview server stopped and direct HTTP refused, a fresh tab launched the game and opened the new perk picker. Offline ready was shown and all 45 perk-card images loaded. The new Marksman card retained its level-three lock and description offline.

## Historical v0.21.0 checks

Horse portrait correction: raised the horse head independently of the neck and drew it in front of the rider, so the face is visible instead of buried beneath the torso. The horse's authored layers face right without mirroring; only the wolf assets need their individual horizontal flip. A rendered comparison confirms the company horse faces right and the enemy portrait's existing whole-composition mirror faces left. Wolf mounts and unmounted headgear retain their existing layout. Portrait and offline-cache checks pass.

The full automated suite passes 210 tests after regenerating the offline cache. New coverage checks 72 regional enemy loadouts and valid item references, stable regional routing, mount ownership and old-save migration, additive travel speed, daily food, combat hit/damage/movement bonuses, scout-visible mounted elites, rare mount sales and capture, and statistically halved common shop stock. Mount equipment and inspection UI tests cover slots, filters, food-days and descriptions. Portrait tests cover raised southern headgear and all three mounted compositions. A separate bounded engine review found no serious correctness issues.

Local browser checks equipped a horse, warg and dire wolf, confirmed +30% travel and nine food per day for three brothers, reloaded successfully, and crossed midnight to verify nine provisions consumed. Stowing the horse reduced travel to +20%, food to eight per day, and the rider's hit skills by five. A mounted company won a normal Road Thieves encounter in five rounds and collected its loot. Equipment controls were inspected at 1024x768; a portrait gallery verified the raised Nomad Head Wrap and Southern Helmet, smaller riders and forward-facing animals. Southern scouting and map markers display nomad equipment and faction art. No JavaScript errors were recorded in the mounted-company session.

With the unmodified production preview server stopped and direct HTTP unavailable, a fresh browser tab loaded the game, displayed Offline ready, and rendered the new Southern Nomads scouting portraits and map. Physical iPad Safari installation and airplane-mode retention remain untested.

Existing rolled shop inventories are preserved until weekly rotation. New ordinary equipment stock and shipment extras have half their prior expected availability; courier stock bonuses fall from 50% to 25%. Enemy equipment loot rates are unchanged. Mount offers are separately rare: a 2% weekly city/fort roll, at most one mount. Tier-three encounters have a 2% mounted-leader roll, visible before combat, with a 50% capture chance after victory. Each equipped living rider adds 10% company travel, five hit-skill points, 15% damage and one movement point; horse/warg/dire wolf upkeep adds one/two/three food per day. Terrain costs and formation constraints still apply.

## Historical v0.20.1 checks

The full automated suite passes 193 tests after regenerating the offline cache. Empty-ammo bow/crossbow regressions cover immediate reserve or pocket-blade selection, no unusable ranged swap-back after save/reload, all five tactics, and unarmed fallback when no spare gear exists. Supplied-archer spacing and throwing-weapon behavior remain covered. Enemy projectile tests verify the mirrored weapon-hand origin and travel toward the company.

A local browser fixture using the actual engine and battle renderer showed an empty-ammo bowman drawing an Arming Sword, advancing, and landing a melee hit. With ammunition available, the same fighter kept the Hunting Bow and fired instead. Enemy portraits face the company with their entire equipment composition mirrored; names and health bars remain readable. Enemy arrow flight starts on the mirrored side. No JavaScript errors were recorded. This release's physical iPad behavior and a fresh offline relaunch were not rechecked; the preceding v0.20 offline check remains recorded below.

## Historical v0.20 checks

The full automated suite passes 189 tests. New coverage checks 24 persistent bands, varied enemy equipment, company pursuit and automatic contact battles, settlement safety, post-battle escape time, interrupted camp/forage rewards, and frame-independent world updates. Caravan checks cover physical interception, the seven-hour rescue window, rescue without replacement attackers, late-contact loss timestamps, out-of-contact arrival, and legacy migration. Six historical company/battle fixtures preserve equipment, purse, inventory, and battle positions; five shipment fixtures validate through repeated migration. A 64-seed, 72-hour simulation validates world saves. An independent review passed all 29 targeted world, caravan, roaming, and expansion tests. Generated offline cache consistency and diff checks pass.

Browser checks at 1024x768 confirmed automatic Road Thieves contact during travel, a visible company-pursuit arrow and warning, camp interruption into battle, and a second hostile encounter on the return journey. Ten six-hour rests at Oakwatch remained safe. A naturally dispatched Redmere wagon first showed River Raiders closing, then showed Wagon intercepted with 4.4 hours left after physical contact. The map and sidebar distinguish pursuit, approach, and interception.

With the preview server terminated and direct HTTP unavailable, a fresh browser tab restored Day 4 at 05:00, the intercepted wagon, its 4.4-hour window, and the same resources. Resting six hours offline allowed the raiders to destroy the wagon and created Redmere's Arms Shortage through day 8, including the 20% ordinary-arms price increase and replacement-gear selling opportunity. Reloading offline retained the loss and shortage. No JavaScript errors were recorded. Physical iPad Safari installation and airplane-mode retention remain untested.

## Historical v0.19 checks

The full automated suite passes 183 tests. Formation coverage checks coordinated one-hex bounds, contact holds, reload turns, late-bound completion with Berserk, shield and reserve-shield deployment, pure bow/crossbow rear safety, twelve-unit deployment bounds, legal mid-battle reformation, no-shield fallback, tactic switching, saved movement progress, and ranged standoff completion. A regression reproduces an archer retreat off the wall's planned row, verifies regrouping and save/reload, and completes the battle. Six historical save fixtures retain equipment, purse, inventory, and battle positions. Generated offline cache consistency and diff checks pass.

At 1024x768 and 390x844, all five tactic controls fit and retain 44-pixel touch targets. In a normal camp battle, Advance in Formation visibly logged coordinated steps, and switching to Shield Wall moved the unshielded fighter behind the shield bearers. The saved company formation remains separate from battle-only positioning. Physical iPad Safari installation and airplane-mode retention remain untested.

With the local server stopped and direct HTTP unavailable, a fresh tab restored the paused round-four battle with Shield Wall selected and the same unit positions. Resolving offline ended in victory after 22 rounds with all three companions alive. Collecting loot and reloading retained 1,025 crowns, 34 provisions, 10 tools, 6 medicine, and 20 ammunition. No JavaScript errors occurred.

## Historical v0.18.1 checks

The full automated suite passes 176 tests. Two new regression cases failed against the previous rules: an unpressured empty-ammo archer advanced into melee, and an archer using a defensive backup failed to re-ready the bow when two-hex spacing opened. Both now pass for bows and crossbows, reserve swords and pocket daggers, and all three company tactics. Additional checks cover funded archers retaining ranged weapons, empty-ammo retreat, cornered melee defense, and holding position after pressure ends. Save/reload retains the corrected role without adding save fields. Throwing-weapon melee transitions, crossbow reload turns, and deterministic battle completion remain covered by existing tests.

Six historical save fixtures retain equipment, purse, inventory, and battle positions. Offline cache consistency and diff checks pass. Browser verification was attempted, but the in-app browser was unavailable and the browser inventory was empty. This release has automated combat/save coverage; its rendered behavior, offline browser relaunch, and physical iPad behavior were not reverified.

## Historical v0.18 checks

The full automated suite passes 172 tests. Coverage includes 60-hour wagon journeys at half the previous speed, active legacy-save migration without moving the wagon or extending its raid warning, resolved legacy outcomes, reload idempotence, patrol-route geometry, all 16 settlement shipment routes, and pre-emptive clearing without replacement attackers. Delivery discounts remain available for at least 48 hours after arrival, with equipment granted only once across reloads and weekly stock rotation. Six historical save fixtures retain equipment, purse, inventory, and battle positions. Offline cache consistency and diff checks pass.

At 1024x768, importing the actual v0.16 Ironford raid fixture changed the remaining journey from 14 to 28 hours, preserved its position, and retained the seven-hour River Raiders warning. The new Saltmarsh Waylayers appeared in the destination list as a normal two-brigand patrol. Pursuing them entered a normal battle at day 2, 01:00.

With the server stopped and direct HTTP unavailable, a fresh tab restored that active battle. Resolving it produced victory after five rounds with all three companions alive. Collecting loot increased crowns from 885 to 966, provisions from 27 to 29, tools from 8 to 9, medicine from 5 to 6, and ammunition from 16 to 19. Another offline reload retained these resources and the defeated patrol remained absent. No JavaScript errors occurred. Physical iPad Safari installation and airplane-mode retention remain untested.

## Historical v0.17 checks

The full automated suite passes 167 tests. Four service tests cover pure quotes, exact individual and company bills, per-brother repair rounding, famed armor limits, equipped-only repairs, invalid/unavailable/fully restored/insufficient-funds rejection without mutation, shortage-independent pricing, and save reload. Six historical save fixtures retain equipment, purse, inventory, and battle positions. Cache consistency, syntax, and diff checks pass.

At 1024x768, every town service entrance fits the existing settlement layout. A wounded Ironford company displayed a 39-crown Doctor bill. Healing Mara individually spent 12 crowns, restored 100/100 HP, and reduced the remaining bill to 27. Healing everyone then restored Toren to 100/100 and Bryn to 105/105, leaving 861 crowns. The Smithy displayed each armor piece's current and maximum durability. Repairing Mara cost 12 crowns and restored her vest to 65/65 and cap to 40/40, leaving a 15-crown company bill. These changes survived reload. The Smithy layout was also inspected at 390 pixels.

With the server stopped and direct HTTP unavailable, a fresh tab restored that company. Repairing all remaining equipped armor offline spent 15 crowns; another reload retained 834 crowns and full durability on all six equipped armor pieces. The day and hour, 8 tools, and 5 medicine remained unchanged. No JavaScript errors occurred. Physical iPad Safari installation and airplane-mode retention remain untested.

## Historical v0.16 checks

The full automated suite passes 163 tests. Caravan coverage checks physical arrival before stock and discounts, raid warnings, rescue by victory, pre-emptive clearing, ignored losses, consistent clock advancement, follow persistence, shortage expiry and trade spreads, read-only getters, migration, and malformed records. Six historical saves retain equipment, purse, inventory, and battle positions. Offline cache consistency and diff checks pass.

At 1024x768, a staged Ironford wagon showed its route, 14-hour ETA, assigned River Raiders, and seven hours to intervene. Double-clicking its map marker started following. The pursuit button entered a normal battle, which ended in victory after four rounds with all companions alive. After collecting loot, Market news showed the rescued wagon on the road with no attacking band. Following it at fast speed ended at day 2, 06:00 with a Delivered report and paused travel.

With the local server stopped and direct HTTP unavailable, a fresh tab restored an Ironford Arms Shortage. Selling a Mail Shirt offline paid 297 crowns, raising the purse from 900 to 1,197. Reloading preserved the shortage, purse, and removal of the shirt from the stash. No JavaScript errors occurred in this offline flow. Physical iPad Safari installation and airplane-mode retention remain untested.

## Historical v0.15 checks

The full automated suite passes 155 tests. Seven town-economy cases cover deterministic schedules and expiry, all six advertised price/stock effects, scarce weekly equipment, purchase quotes and resale spreads, shipment grants across reload/expiry/week boundaries, bounded once-only courier rewards, legacy markets, famed buybacks, and malformed market markers. Reloading a saved market just as a shipment starts preserves its pending grant. Six historical fixtures still retain equipment, purse, inventory and battle positions. Offline cache consistency and diff checks pass.

At 1024x768, Market news showed a remote event and its Show on map action selected the correct town with the same notice. An Ironford shipment on day 10 displayed a 10% equipment discount and day-15 rotation. Buying its only Brigandine cost 363 crowns (9,000 to 8,637), removed the trader listing, and remained sold out after reload and advancement to day 11. At Highpass during Good Harvest, buying five provisions cost 30 crowns, increased provisions from 21 to 26, and reduced shop stock from 29 to 24; grain displayed 26 to buy and 24 to sell.

A staged courier approach completed through normal travel, paid 215 crowns, and logged one new Bascinet in Ironford's armory. The item appeared at stock one for 265 crowns and survived reload without duplication.

With the local server stopped and direct HTTP unavailable, a fresh tab restored the courier reward. Buying that Bascinet offline spent 265 crowns (9,215 to 8,950). Reloading preserved one Bascinet in the stash and no remaining trader listing, with no JavaScript errors. The Market news layout was inspected at 390 pixels as well as tablet size. Physical iPad Safari installation and airplane-mode retention remain untested.

## Historical v0.14 checks

The full automated suite passes 148 tests. Seven hiring tests cover pure deterministic offers, distinct roles, exact preview-to-hire identity, pricing, daily refresh, same-day save/load stability, consumed/stale/wrong-town rejection, affordability and company limits, malformed save data, and old-save stat preservation. A sweep across 64 seeds and eight days reaches all ten backgrounds and twelve traits, verifies their stat effects, and checks that tradeoffs never directly cancel the positive trait. New recruit bonuses feed actual battle units and survive an active-battle save/reload. Six historical fixtures retain equipment, purse, inventory and battle positions. Offline cache consistency and `git diff --check` pass.

At 1024x768, the three hiring cards show fees, upkeep, equipment status, background bonuses, traits, and final stats with 44-pixel hire buttons visible. The board also renders as a single column at 390 pixels. Hiring Jonas Vey for 180 crowns changed the balance from 900 to 720, removed only his offer, and retained the other candidates after reload. His company sheet matched the preview: 100 HP, 106 maximum fatigue, 113 initiative, 56 melee skill, and 48 ranged skill, including Strong and Impatient. Advancing past midnight produced three fresh offers.

With the local server stopped and a direct HTTP request failing, a fresh browser tab restored the day-two company. Hiring Milo Hart offline spent 130 crowns, leaving 570. Reloading preserved his Farmhand background, Eagle Eyes and Stocky traits, 106/106 HP, 108 maximum fatigue, 101 initiative and 50 ranged skill. No JavaScript errors occurred in this offline flow. Physical iPad Safari installation and airplane-mode retention remain untested.

## Historical v0.13 checks

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

Combat remains a simplified automatic simulation. The 40 perks use the exact effects described in the chooser; full class-specific trees, faction armies, and a procedural campaign are not implemented. Overworld travel has no pathfinding, and wounds are represented by lost HP rather than Battle Brothers' full injury system. Physical iPad Safari installation, airplane-mode launch, and save retention have not been tested.
