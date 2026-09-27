# Verification - version 0.2, 2026-09-27

## Automated checks

`npm run prepare-offline`, `npm test`, and `git diff --check` pass. Eighteen Node tests cover game startup, inventory conservation, capacity, settlement access, local markets and stock renewal, cross-town profit, supply deliveries, migration of version 1 saves, travel and upkeep, malformed-save rejection, portrait layer selection, item artwork, and offline asset completeness. The generated service worker precaches 118 local files and is checked against a content-derived hash.

## Browser checks for this version

Executed in the Codex in-app browser:

- Bought mail armor for 320 crowns, five provisions for 20 crowns, and one timber for 20 crowns; balances and stocks updated.
- Equipped the mail shirt; the old leather vest returned to baggage and protection rose from 32 to 44.
- Accepted the Oakwatch courier job, travelled to Barrowfield at 3x, and received 185 crowns and one renown on arrival.
- Selected a destination from the settlement list and exercised camera zoom.
- Inspected the painted map, equipment inventory and raster portraits at tablet landscape, 834 x 1194 portrait, and 390 x 844 narrow dimensions. Fixed portrait cropping and the narrow equipment grid during this pass.
- Stopped the local origin server and confirmed a direct HTTP request failed. Closed the game tab and opened a new tab at the same address. The cached game loaded with the saved balances, equipment and destination intact.
- With the origin still stopped, opened the marketplace, bought a kettle helmet for 245 crowns, and equipped it; armor rose to 63 and the character image changed.
- No missing DOM images or browser JavaScript errors were observed in the exercised flows.

## Limits

Browser-sized previews and an origin-stopped check do not prove Safari installation or real iPad airplane-mode behavior. On the device, add the game to the Home Screen, wait for Offline ready, export a save, and test closing/reopening in airplane mode before the flight. Storage may be removed by the browser or operating system.

The app has no combat, enemies, loot loop, factions, or procedural campaign yet. Equipment combat values are displayed groundwork for phase 2. Roads and the passing caravan are scenery; player travel is directly across terrain.
