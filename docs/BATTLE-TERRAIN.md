# Battle terrain and camp defense — v0.47.0

The visual reference is Battle Brothers' broad 180×100 terrain tops and stepped, contiguous hill patches. The renderer now uses 76×44 tops, a 33-pixel row step, and a 12-pixel rise per campaign height level. Axial coordinates and combat distances stay the same. The campaign retains its existing 0–2 heights and movement/hit rules; this changes their rendering rather than adding a new elevation balance system.

Raised surfaces no longer draw full-height faces inside a plateau. Each forward-facing edge compares its own height with the neighboring tile; equal/higher neighbors have no exposed face, and a 2→1 step draws only one level. Boundary drops reach the ground. Terrain, walls, trees and fighters share row depth, removing the old global pawn foreground offset. Fighter feet, mounted bases, movement origins and projectile hands use the same projection. Labels move with the new ground anchor.

All new camp encounters have a wooden enclosure around enemy deployment, with two two-hex entrances on the assault side. Walls are impassable; pathfinding, charge, Lunge, knockback, flight and save validation use the same movement/occupancy check. Ranged shots pass the palisade with intervening cover, rather than treating it as an opaque screen. Gate corridors remain open and all walkable cells are connected; foliage cannot seal an entrance. Roaming/quest encounters do not receive camp walls. Existing active battles retain their saved terrain.

New enemy AI uses `enemyTacticsVersion: 1`. Three or more living, non-escaped fighters with ranged weapons select Defense; throwing fighters count only while their active bundle still has ammunition. Infantry hold outside reach, ranged fighters fire when targets enter reach, and melee contact permits a response. Losing that contingent below three switches to Offense immediately. The existing four-quiet-round fallback prevents a Defense-versus-Defense stalemate. Company orders do not choose the enemy tactic or its focused target. Existing active battles without this version keep their prior enemy behavior.

## Inspected BB sources

Pinned source: [kovasap/battle-bros-decompiled, e06d68df](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7).

- `scripts/mapgen/templates/tactical/patches/patch_hill.nut` and `tactical_hills.nut`: contiguous stepped hills, camp plateaus and surrounding slopes.
- `scripts/mapgen/templates/tactical/tiles/grass1.nut`: neighbor transitions and `socket_earth`.
- `scripts/mapgen/templates/tactical/locations/tactical_human_camp.nut` and `tactical_goblin_camp.nut`: ring fortifications with access gaps and cleared approaches.
- `scripts/entity/tactical/objects/human_camp_wall.nut`: original `camp_18_01`–`07` orientation brushes and non-opaque sight behavior.
- `brushes/terrain.brush` and `object_1.brush`: original top/socket geometry and worn camp-wall sprites.

This is a campaign-scale adaptation, not a claim to reproduce every native BB map generator or fortification type. Palisades currently have open gates and cannot be destroyed.

## Verification

Regression coverage checks plateau interiors, independent height drops, projection alignment, every biome's connected gate paths, deployment and invalid wall occupancy, the 2/3 ranged threshold, exhausted throwers, defensive shooting, quiet-round fallback, legacy rules and deterministic complete combat with save imports between actions. Browser screenshots compare the same stepped hill before/after, inspect actual camp walls, and check mobile overflow, terrain inspection and offline reload.
