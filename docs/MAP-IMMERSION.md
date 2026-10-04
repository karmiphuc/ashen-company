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

## Regional landmarks and travel barriers (0.50.0)

The continuation of #38 / #39 uses deliberate sites rather than uniform random scattering. Ruined watches mark old borders, battle remains mark former crossings and caravan routes, and the Sunlands hold grouped pyramids and a sphinx. Version 0.50.1 removes the rejected ruin and temple art/sites; the user-pasted battlefield sheet supplies resized transparent remains for crossing and convoy scenes. Small watch and battlefield positions vary deterministically by seed; large monuments and future quest anchors have stable identities. Placement preserves town footprints, road readability and active camp markers.

Three named ranges are authored in gaps between the 71 existing road links: snowy Frostspine, rocky Stormteeth in the steppe, and desert Sunwall. Their convex footprints block travel; Frostspine has two ridge masses with an open central cleft. `world-navigation.js` derives a visibility graph around ridge corners. Player routes, chasing bands, roving patrols and crisis hosts share the same barriers; caravan road semantics and timings remain unchanged. Derived paths are not saved. Imported actors inside a new ridge walk out using ordinary movement; obsolete destinations inside a ridge stop safely. Seeded camp markers move to accessible ridge feet or outside monument/cave footprints, retaining IDs, generations and their seeded roster/loot rolls.

`LEGENDARY_CAVES` reserves exactly three dormant, untargetable entrances for future quest implementation:

| Stable ID | Setting | Authored coordinates before map compaction |
| --- | --- | --- |
| `greenwood-cave` | Veiled Hollow, remote deep forest | 2020, 970 |
| `frostspine-cave` | Frostspine Grotto, central walkable cleft | 2140, 314 |
| `sunlands-cave` | Sunken Passage, beside the necropolis | 3750, 2100 |

No legendary encounters or rewards activate yet. Decoration clicks produce no target or travel order. All textured sprites and static smoke are baked into the existing raster capped at 4096px; no animation loop or decorative NPC simulation is added.

Landmark artwork comes from freely licensed Clint Bellanger, Nirdia and Wildfire Games assets. Source/derivative licenses and reproducible crop/render recipes are documented in [ASSET-CREDITS.md](ASSET-CREDITS.md) and `assets/world/landmark-sources.json`. Landmark and ridge rendering has no flat polygon fallback.
