# World-map illustration (0.48.1)

Issue #38 improves the existing canvas with seeded terrain jitter, larger woodland and highland masses, mixed biome edges, regional color and clustered micro-details. Sparse steppe scrub, northern snow drifts, swamp reeds and temperate field marks reuse existing assets and small Canvas primitives. No new art downloads are required.

Roads gain gentle quadratic curves, earth shoulders and wagon ruts. These curves are drawing instructions only: all 71 road links, distances and travel rules retain their original values. Close-up regional borders disappear; overview borders remain faint.

Settlements have irregular dirt footprints, connecting paths, local crop patches and yards. Villages use 98px central art, towns 122px, major towns 150px and castles 144px. Yard density increases with importance; castles use military marks. Existing service and event-driven outskirts remain intact.

Real companies, caravans, bands and patrols gain directional facing, elongated shadows and small movement dust marks. Idle actors produce no dust. Overview hides ordinary distant actor labels while retaining selection and pursuit cues. Night renders warm settlement and caravan lights after the darkness layer.

## Compatibility and cost

Visual plans never modify campaign saves, terrain rules, settlement coordinates or region identities. Actor facing is held only in renderer memory. The background stays capped at 4096px on its longest side, is reused for ordinary updates and is rebuilt when campaign seed changes. There is no additional animation loop, cosmetic NPC simulation or save migration.

## Validation

- All 676 tests pass, including deterministic/bounded visual plans, all road and settlement invariants, zoom readability, facing and save-state immutability.
- `npm run prepare-offline` includes the new helper; offline browser reload verifies all 574 cached files and module availability.
- Desktop (1440×1000), tablet (768×1024) and phone (390×844) screenshots check nine regions, overview and day/night rendering.
- Browser interaction checks exercise actual touch pan/pinch and mouse settlement selection; cache instrumentation verifies reuse, the raster limit and a single rebuild for a new seed.
