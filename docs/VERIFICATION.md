# Verification - version 0.3, 2026-09-27

## Automated checks

`npm test` passes all 28 tests. Coverage includes deterministic battle resume, every-turn save validation, active-battle action guards, retreat, casualties and defeat, one-time loot, hunt payment, two-handed equipment, persistent armor condition, supply recovery, training, old-save migration, markets, travel, asset packaging and generated service-worker consistency. All 133 runtime files are packaged offline. A separate review simulated 450 battles (150 seeds across three camps); all resolved, with a maximum of 29 rounds.

## Browser checks

Executed in the Codex in-app browser against the local build:

- Bought five tools for 90 crowns; tools rose from 8 to 13 and crowns fell from 900 to 810.
- Accepted Oakwatch's brigand contract, selected the camp, travelled at 3x, and started the encounter.
- Paused the battle in round 2 and reloaded the saved battle. A stale development cache initially rejected the save; preservation kept the original intact, and the refreshed build restored it successfully.
- Won in six rounds. The result displayed individual XP (30, 50, 70), surviving HP (100, 100, 70), 100 crowns, three food, two tools, three ammunition and a wood axe. Claiming returned to the cleared camp.
- Rested for six hours, consuming one tool and one medicine. Bryn recovered to 94/105 HP. Returning to Oakwatch paid the 125-crown contract, bringing the balance to 1,035.
- Spent Bryn's earned attribute increase: melee defense rose from 21 to 23 and the training controls disappeared.
- Inspected contracts, market supplies, the company sheet, settlement services and battle rendering. Tested 1194 x 834 landscape and 834 x 1194 portrait dimensions; no document horizontal overflow or missing DOM images in the inspected company view.
- Selected a second hostile camp through the destination list, travelled there, began a battle and paused in round 2.
- Stopped the origin server and confirmed direct HTTP access failed. Closed the tab and opened a new one at the same address. The cached game reopened the same battle with 1,018 crowns, 14 tools, four medicine and 19 ammunition.
- With the server still stopped, retreated, settled the result and reloaded. Resource changes and company state persisted. No browser JavaScript errors appeared in the exercised flows.

## Limits

These checks do not prove Safari installation or physical-iPad airplane-mode operation. On the device, add the game to the Home Screen, wait for Offline ready, export a save, then test closing and reopening in airplane mode before the flight.

Combat is a simplified automatic simulation. There are three fixed camps; roving armies, factions, perks and a procedural campaign are not implemented. Roads and the passing caravan remain scenery. Player travel crosses terrain directly. Wounds are represented by lost HP rather than Battle Brothers' full injury system.
