# Verification - version 0.5, 2026-09-27

## Automated checks

The v0.5 suite passes all 47 tests. Coverage includes save migration and battle resume, combat decisions and tactics, the seven new inventory IDs (`padded-gambeson`, `reinforced-mail`, `bascinet`, `bludgeon`, `rondel-dagger`, `billhook`, and `light-crossbow`), portrait alignment, complete tactical-event serialization, offline asset packaging, and generated service-worker consistency.

Battle presentation now animates melee swings and thrusts, ranged aim and arrow/bolt flight, movement, hits, damage bars, and falls. Portrait-layer anchors align the new equipment with the existing head, body, and weapon positions. Renderer coverage checks paused/restored battles do not replay projectiles, tactic choices and disabled end-state controls, misses and older event records, and visual alignment for equipment layers. Tactical tests cover Offense, Defense, Thin them out, and weapon behavior.

## v0.5 browser checks

Executed in the Codex in-app browser. After the local origin server was stopped and HTTP requests failed, the same paused round-3 battle reopened in a fresh tab with its selected Focus tactic and 14 ammunition intact, and showed Offline ready. Changed to Offense, resumed at 3x, and watched the battle finish normally in four rounds with all three brothers alive. Claiming the reward raised crowns from 33 to 99 and updated provisions, tools, medicine, ammunition, and equipment; the defeated band left the encounter list.

At a 1024x768 viewport, all three tactics and the speed, retreat, and resolve controls were visible. Checked 12 equipment combinations for correct helmet/neck alignment and observed the arrow's CSS transform while in flight. No JavaScript errors were observed in the exercised flows. Physical iPad Safari installation, airplane-mode launch, and save retention remain unverified.

## Historical v0.4 checks

The following checks describe the earlier v0.4 build and are not evidence for v0.5.

The v0.4 automated suite passed all 36 tests, including save migration and battle resume, encounter patrol/chase/respawn, tactical pathing and archer decisions, fatigue recovery, combat loot and progression, offline packaging, and service-worker cache consistency.

A deterministic replay used seeds 1-150, creating a fresh starter company for each encounter. Wounds were total company HP lost from its starting 300 HP, with fallen brothers at zero HP; rounds were the terminal battle round.

| Encounter | Wins | All survive | Mean wounds | Mean rounds |
|---|---:|---:|---:|---:|
| Quarry Camp | 100% | 96.7% | 45.15 | 5.67 |
| Ruined Watchtower | 87.3% | 12.0% | 181.25 | 14.14 |
| Brigand Hideout | 0% | 0% | 300.00 | 9.48 |
| Road Thieves | 100% | 100% | 3.38 | 2.29 |
| Hungry Deserters | 100% | 100% | 10.07 | 2.92 |
| Forest Cutthroats | 100% | 100% | 14.71 | 3.07 |
| River Raiders | 100% | 99.3% | 14.97 | 3.35 |

The four patrol tests each began with a fresh company at Oakwatch and pursued that band. A separate 150-seed run equipped all three brothers at level 3 with mail shirts, iron helms, spears, and round shields using the equipment API. Against the Watchtower, this setup won 100% of fights, had 90% no-casualty fights, and averaged 53.77 wounds over 10.82 rounds. Against the Hideout it won 34%, had 3.3% no-casualty fights, and averaged 269.40 wounds over 23.64 rounds. These bounded seeded samples were not proof of overall balance and apply only to the v0.4 engine.

The v0.4 browser run covered loading an existing save, patrol selection and pursuit, paused battle reload, combat loot and experience, waiting-time advancement, band respawn, pursuit resume, and an offline reload after stopping the local origin server. No JavaScript errors were observed in those exercised flows. This is historical v0.4 evidence only.

## Current limits

Battles remain a simplified automatic simulation. There are three fixed camps and four renewable small roaming bands. Faction armies, perks, and a procedural campaign are not implemented. Roads and the passing caravan are scenery. Player travel crosses terrain directly. Wounds are represented by lost HP rather than Battle Brothers' full injury system. iPad Safari installation, airplane-mode launch, and save retention have not been verified on a physical iPad.
