# Verification - version 0.4, 2026-09-27

## Automated checks

`npm test` passes all 36 tests, including save migration and battle resume, encounter patrol/chase/respawn, tactical pathing and archer decisions, fatigue recovery, combat loot and progression, offline packaging, and service-worker cache consistency.

A deterministic replay used seeds 1-150, creating a fresh starter company for each encounter. Wounds are total company HP lost from its starting 300 HP, with fallen brothers at zero HP; rounds are the terminal battle round.

| Encounter | Wins | All survive | Mean wounds | Mean rounds |
|---|---:|---:|---:|---:|
| Quarry Camp | 100% | 96.7% | 45.15 | 5.67 |
| Ruined Watchtower | 87.3% | 12.0% | 181.25 | 14.14 |
| Brigand Hideout | 0% | 0% | 300.00 | 9.48 |
| Road Thieves | 100% | 100% | 3.38 | 2.29 |
| Hungry Deserters | 100% | 100% | 10.07 | 2.92 |
| Forest Cutthroats | 100% | 100% | 14.71 | 3.07 |
| River Raiders | 100% | 99.3% | 14.97 | 3.35 |

The four patrol tests each began with a fresh company at Oakwatch and pursued that band. A separate 150-seed run equipped all three brothers at level 3 with mail shirts, iron helms, spears, and round shields using the equipment API. Against the Watchtower, this setup won 100% of fights, had 90% no-casualty fights, and averaged 53.77 wounds over 10.82 rounds. Against the Hideout it won 34%, had 3.3% no-casualty fights, and averaged 269.40 wounds over 23.64 rounds. These are bounded seeded samples, not proof of overall balance.

## Browser checks - v0.4

Executed in the Codex in-app browser:

- Loaded the existing v0.3 company without losing crowns, levels, equipment or resources. New bands appeared in the map and destination list.
- Started a fresh local test company, selected Road Thieves, pursued the moving marker and stopped within striking distance. The sidebar changed from Pursue to Engage.
- The one-enemy fight ended in two rounds with all three brothers alive. Reloaded its victory screen before claiming: individual XP and loot remained intact.
- Claimed 47 crowns, three provisions, two tools, one medicine, three ammunition and an axe. Road Thieves disappeared from the encounter list; all three camps remained available.
- Rested and pursued the two Hungry Deserters. Paused the battle in round 1 and reloaded it successfully.
- Stopped the local origin server and confirmed a direct HTTP request failed. Closed the tab and reopened the game in a fresh tab: the same paused roadside encounter loaded with Offline ready.
- While the server remained stopped, resolved the fight in four rounds and claimed 66 crowns plus equipment and supplies. All brothers survived. Toren reached level 2 with 30 XP toward the next level and an available attribute increase after the two fights.
- Verified that 3x can advance world time while the company stands still, with the status correctly saying Waiting.
- Defeated bands returned to the destination list as world time advanced, without a page reload. A paused pursuit retained its target and displayed Pursuit paused after reloading.
- No browser JavaScript errors were observed in the exercised flows.

## Limits

These checks do not prove Safari installation or physical-iPad airplane-mode operation. On the device, add the game to the Home Screen, wait for Offline ready, export a save, then test closing and reopening in airplane mode before the flight.

Combat is a simplified automatic simulation. There are three fixed camps and four renewable small roaming bands. Faction armies, perks and a procedural campaign are not implemented. Roads and the passing caravan remain scenery. Player travel crosses terrain directly. Wounds are represented by lost HP rather than Battle Brothers' full injury system.
