# Regional scenery

These eight places are authored compositions, not encounter entities. They provide landscape history without map targets, rewards or quest activation. Existing roads, mountains and the three dormant caves keep their navigation rules.

| Place | Story and silhouette | Authored anchor (before compaction) |
| --- | --- | --- |
| Bloodied Oasis | Dry stone well, broken paving and an open crescent of withered palms; casualties converge on the well, fallen armored horse outside the approach. | 3200, 2660 |
| Forgotten Caravan Massacre | Staggered wagons, a jackknifed front cart, supplies spilling away from its rear, old skeletons around the spill. | 3820, 1570 |
| Shattered Sanctuary Pass | Cold ruined tower, broken sanctuary steps and paired weathered angels; rubble falls toward the entrance. | 1830, 285 |
| Frozen Skirmish | Sheltered tents behind a breached barricade, two opposing casualty arcs, horses and a fallen standard at the breach. | 1190, 230 |
| Overgrown Chapel & Graveyard | Roofless mossy stone ruin, curved cemetery rows, trees reclaiming the rear and wall feet while leaving the entrance visible. | 1900, 900 |
| Ambushed Supply Train | Two wagons on a muddy diagonal, a displaced wheel and guards around the wheels; small supplies trail toward the wet verge. | 2100, 1280 |
| Burned Farming Village | Three different ruined footprints around a lane, charred beams, broken fencing and an abandoned cart; one ash site still smokes. | 940, 450 |
| Knight's Last Stand | Weathered memorial inside a broken horseshoe of defenders, uneven faction standards, horses at the open breach. | 980, 1330 |

Approximate requested percentages are subordinate to actual geography. The initial northern percentages placed both stories in the temperate Eastern Frontier; the selected anchors put them in the Northern Highlands, clear of peaks and existing settlement service yards. Northern compositions fit the narrow pass with smaller structures; casualties remain at a fixed 13 world units. Wagons are at most 44 units and loose crates at most 10, regardless of scene width.

Placement tests the scene's entire envelope against climate boundaries, blocked mountains, towns, roads, fixed camps and caves. Bounded deterministic relocation handles nearby conflicts. Authored stories take precedence over minor old scenery, and random camp placement reserves their footprints. Scene positions therefore stay stable when random camps respawn. The camp protection search remains in the camp's original region and within navigable world bounds.

Ground textures have feathered irregular edges; scene sprites use depth ordering and opaque textures. Only ground debris and decals rotate, while upright structures keep their perspective. The map's generic vegetation avoids the scene core; authored vegetation provides the chapel's overgrowth. The existing background raster caches all static artwork, rather than redrawing hundreds of decoration sprites each frame.
