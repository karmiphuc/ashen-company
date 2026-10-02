# Base game and DLC equipment catalog

Version 0.42 imports **217 concrete human-wearable designs: 104 body armors and 113 helmets**. The catalog includes ordinary clothing and military armor, southern and gladiator equipment, northern barbarian equipment, ancient and decayed armor, named designs, legendary designs, the Fangshire supporter helmet, Lindwurm equipment, and the Of Flesh and Faith adorned equipment.

The source is [kovasap/battle-bros-decompiled](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7), pinned to `e06d68df0915827967f98a05d0c705c1f53df0b7`. The source inventory contains 256 armor/helmet scripts. Every script is accounted for in [the source manifest](../assets/dlc-equipment-source.json): 217 imported definitions and 39 non-human equipment or abstract parent classes excluded from the human company catalog. These are Battle Brothers assets by Overhype Studios; public availability does not grant new distribution rights. Existing project attribution applies.

Protection and fatigue use the source definition's baseline `ConditionMax` and `StaminaModifier`. Prices are adapted to 35% of positive source value, with a five-crown minimum. Zero-valued NPC designs use a protection/weight-based price (protection × 5 plus 30 crowns per fatigue point below 30, minimum 40), so a 300-durability ritual robe cannot become five-crown plate armor. Named and legendary designs now receive deterministic permanent bonuses over the recorded source baseline: 15–30% extra protection (at least eight, capped at 500), two to six points of fatigue relief, and one defense, resolve, or endurance signature. Fangshire has 77 protection, one fatigue cost, and +5 ranged defense. Generated famed variants retain these permanent signatures and add their own bonus. Rare designs use a premium price with a 500-crown minimum. A fixed representative cosmetic variant is selected for each definition. The manifest records source paths and hashes, the original descriptions and vision modifiers, and the exact selected artwork. Collection labels route designs to thematic shelves; they do not reproduce the original game's DLC unlock system.

Inventory art uses the actual source item image. Worn art is extracted from the source entity atlas using its `.brush` UV bounds and sprite placement. The atlas stores images upside down, so the importer restores the brush's display orientation with a vertical flip. Every result has a recorded SHA-256 hash. The generated art module embeds PNGs to keep offline assets self-contained and avoid hundreds of extra network requests or external hotlinks.

The **Browse armor collections** button in the market lists all 217 designs and filters by collection. Inspection explains protection, weight, and handling. Legendary scripted regeneration, acid immunity, and original helmet vision penalties are not simulated; this is explicitly stated in item descriptions/inspection. The catalog contains their adapted protection and fatigue, rather than claiming those original effects.

New regional towns can stock DLC equipment from their first week. Existing towns retain their original opening-week selection and add DLC designs on alternating weekly rotations. North and south favor their regional designs. New frontier patrols wear regional sourced equipment; the new camps can also award famed versions within their protection tier. Existing camp rewards and the original patrol rosters keep their rolls.

## Rebuild

Requires Python 3 with Pillow for the development importer; the browser has no runtime dependencies.

```sh
python3 tools/content/import-bb-equipment.py --cache /tmp/bb-source
npm run prepare-offline
npm test
```

The importer caches pinned sources outside the repository. It fails on unresolved stats, missing sprites, duplicate IDs, or truncated source inventories. Repeated imports produce identical catalog, artwork, and manifest bytes. Save imports fill missing rows once while preserving depleted stock and individual armor condition.

Named pieces appear as at most one scarce weekly offer in eligible castles and major towns, consuming a normal premium stock slot. Legendary relics are excluded from routine market stock except Fangshire. Named equipment sold back to an armory keeps its damage; buying it back does not repair it. Existing active battles migrate rare-item armor maxima while retaining remaining armor, combat stats, and rolled drops.
