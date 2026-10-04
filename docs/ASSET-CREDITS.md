# Asset credits

## Free regional landmark sprites (v0.50.0)

The retained 18 landmark sprites use freely licensed assets researched on OpenGameArt and in 0 A.D. Version 0.50.1 removes the seven Cethiel sprites and their ruin/temple sites at the user's request. Exact files, authors, dimensions, adaptations and SHA-256 hashes are in [landmark-sources.json](../assets/world/landmark-sources.json).

- **Clint Bellanger**, [Broken Tower](https://opengameart.org/content/broken-tower): the transparent background-layer sprite, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), cropped to its opaque bounds.
- **David Garay Salazar / [Nirdia Entertainment](http://www.nirdia.com/)**, [grass mountains](https://opengameart.org/content/isometric-mountains-render-2d) and [desert mountains](https://opengameart.org/content/iso-mountains-monta%C3%B1as-isom%C3%A9tricas): individual textured peaks and natural rock openings extracted from the sheets. Northern variants are desaturated and brightness-adjusted. These derived PNGs retain [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- **[Wildfire Games](https://www.wildfiregames.com/)**, [0 A.D. art](https://github.com/0ad/0ad/tree/61a3b9507d974084e6badb88a0826bd89a6d5b8b/binaries/data/mods/public/art), pinned to `61a3b9507d974084e6badb88a0826bd89a6d5b8b`: the great pyramid mesh/texture and Ptolemaic sphinx mesh/texture rendered into transparent isometric sprites. The sphinx palette is adapted to weathered sandstone. These derived PNGs retain [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); the upstream [license](https://github.com/0ad/0ad/blob/61a3b9507d974084e6badb88a0826bd89a6d5b8b/binaries/data/mods/public/art/LICENSE.txt) explicitly permits commercial/noncommercial use, modification and redistribution.

`tools/import-free-landmarks.py` records cropping/palette recipes; `tools/render-free-monuments.py` reproduces the textured mesh renders in Blender. Five battlefield sprites now come from the user-pasted Gemini battlefield sheet: two fallen soldiers, a broken wagon, bones and a firepit. The supplied sheet was edited to remove its cream background, sliced to transparent sprite bounds and resized to at most 128px. `tools/import-user-battlefield.py` records normalized crop coordinates, the prepared-sheet hash and sprite hashes. These user-provided assets have separate provenance; no CC license is claimed for them. Small seeded scenes use 16.5–18% of a 100–118 map-unit footprint for human/skeleton remains, 25% for firepits and 50–55% for wagon wrecks, with static smoke above the firepit. Asset licenses apply to these sprites and their derivatives; they do not change the game code license or other artwork terms.

## Settlement outskirts (v0.45.8)

Eleven unchanged PNGs from the pinned **Battle-Brothers-Legends/Legends-public** revision `b014cdf8520e69b2383116d1654977e9dbb10d96` provide dedicated workshop, ore-furnace, militia-yard, crop, lumber, wool, salt, iron, fishing and wagon scenery. The [settlement source manifest](../assets/world/settlement-sources.json) records original paths, URLs, sizes and SHA-256 hashes. The two wagon images are scaled from the repository's tool-item art. Armor racks, anvil emblems, dirt spurs, bare furrows, smoke and status flags are drawn by the map renderer. Existing farm and beggar artwork is reused for poor-harvest hints. These assets follow the Battle Brothers/Legends provenance and personal noncommercial prototype restrictions described below.

## Town workshop scenery (v0.45.0)

Blacksmith and armorsmith map structures reuse the credited `houses_01_01.png` and `houses_02_01.png` settlement artwork as small workshop buildings. This release introduces no new source images; regional and ancient outfits use the existing credited equipment catalog.

## Mounted portrait composition (v0.44.6)

All five mounts reuse the existing credited PNG files unchanged. The renderer normalizes their rear-body opaque bounds beneath the rider, places natural head silhouettes at the lower right, and draws one shared plate. These composition transforms are an adaptation of the supplied bust artwork, not new anatomical mount artwork. Wolf and warg heads are mirrored to face outward; the warg retains its existing color treatment.

## Battle audio

The battle loop is [Heartfelt Battle](https://opengameart.org/content/heartfelt-battle-loopable-fantasy-stringspianohorn) by **request**. Weapon whooshes and cloth sounds come from [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio); metal and body impacts come from [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds). The original five source recordings are released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

The v0.45.7 weapon effects add bow and three swish recordings from [Battle Sound Effects](https://opengameart.org/content/battle-sound-effects) by **artisticdude**, used under its offered CC0 license, plus chopping, chain/gear handling, wood, metal, soft-tissue and blunt contacts from the Kenney packs above (CC0). [Whip Sound](https://opengameart.org/content/whip-sound) by **Reemax** is used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). That recording is trimmed and converted to mono MP3; the other new recordings are silence-trimmed, limited, faded and capped at 0.65 seconds. Each conversion is documented in the manifest. Weapon profiles combine these recordings at action-speed-aware timings; chain and sling sounds are adapted foley, rather than recordings of every individual weapon.

The v0.49.0 impact foley adds distinct flesh, arrow, thrown-pierce, bolt, slash and cavalry layers, remixed from Kenney Impact Sounds (CC0). Hoofbeats are adapted wood-impact foley. The reproducible recipes in `tools/build-combat-impact-audio.py` document every source, pitch, gain and delay; these are layered recordings rather than synthesized tones. Armor/shield contact and health damage can play together, while misses have no damage contact.

The [audio manifest](../assets/audio/source-manifest.json) records each source file, conversion, size and SHA-256 hash. Mono MP3 conversions total about 1.3 MB. One looping music element and at most eight short effect voices keep memory and playback work bounded. Audio is cached for offline play; the world map has no music. Music and effects can be muted independently in the Save menu.

Fantasy Brothers 6.2 and Samurai 2.1 recruit and equipment artwork is documented
in [FANTASY-SAMURAI.md](FANTASY-SAMURAI.md) and
[`assets/fantasy-samurai-source.json`](../assets/fantasy-samurai-source.json).
Those assets retain their original authorship and distribution terms.

Ashen Company includes adapted artwork from *Battle Brothers* and the **Legends** mod. The upstream source repository is [Battle-Brothers-Legends/Legends-public](https://github.com/Battle-Brothers-Legends/Legends-public), pinned here to commit [`b014cdf8520e69b2383116d1654977e9dbb10d96`](https://github.com/Battle-Brothers-Legends/Legends-public/tree/b014cdf8520e69b2383116d1654977e9dbb10d96). Credit belongs to the original Battle Brothers and Legends contributors; this project does not claim authorship of those assets.

The checked-in manifests identify the upstream repository commit and source path for each imported file. Some also record raw download URLs and byte sizes; the portrait, item, battle, and battle-UI manifests record SHA-256 hashes:

- [`assets/portraits/legends-source.json`](../assets/portraits/legends-source.json) — character bodies, heads, hair, beards, armor, helmets, weapons, and shields used in portraits.
- [`assets/items/legends-source.json`](../assets/items/legends-source.json) — equipment inventory images.
- [`assets/legends-v11-source.json`](../assets/legends-v11-source.json) — additional item icons, armor and helmet portrait layers, and distinct weapon portrait art for the v0.11 equipment catalog. Some labels use the nearest supplied Legends art where no exact item image exists; each such substitution is marked in the manifest.
- [`assets/legends-v12-source.json`](../assets/legends-v12-source.json) — inventory and worn portrait artwork for the 36-item v0.12 equipment expansion. Every entry records its exact upstream path, raw URL, byte size, and SHA-256 hash at the pinned commit.
- [`assets/world/sources.json`](../assets/world/sources.json) — world terrain, settlement props, and interface artwork.
- [`assets/battle/legends-source.json`](../assets/battle/legends-source.json) — tactical grass, earth, and road tiles.
- [`assets/ui/battle-icons-source.json`](../assets/ui/battle-icons-source.json) — supplies, medicine, ammunition, and other campaign/battle interface icons.
- [`assets/perks/source-manifest.json`](../assets/perks/source-manifest.json) — 19 Legends perk images used as thematic illustrations for Ashen Company's adapted perk effects. These are Legends images, not the original numbered vanilla perk icons; the manifest maps each local perk to its exact pinned upstream file and hash.
- [`docs/NORTHERN-ASSETS.md`](NORTHERN-ASSETS.md), [`assets/legends-north-source.json`](../assets/legends-north-source.json), and [`assets/legends-attachments-source.json`](../assets/legends-attachments-source.json) — notes and exact provenance for the 71 northern equipment and armor attachment PNGs.

The [Legends Nexus page](https://www.nexusmods.com/battlebrothers/mods/60) lists its credits and distribution terms. It says some included assets belong to other authors and that their permission must be sought; it also says permission from the Legends author is required to use assets, and that conversion to other games is not allowed. The manifests document provenance, not a separate permission grant. This project is personal and noncommercial.

*Battle Brothers* is a game by [Overhype Studios](https://battlebrothersgame.com/). Ashen Company is an independent fan-made browser prototype and is not affiliated with or endorsed by Overhype Studios or the Legends team.

The frontier Scout, Warden, and Sentinel equipment reuses the existing wolf gambeson, reinforced lamellar, plate cuirass, high kettle helm, flat-top helm, and full helm artwork. Frontier inventory PNGs are byte-identical copies of those credited local assets; no new upstream art is introduced.

## Full base-game and DLC equipment

Version 0.42 imports 217 human armor/helmet designs and their original inventory art and worn sprite layers from [kovasap/battle-bros-decompiled](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7), pinned to `e06d68df0915827967f98a05d0c705c1f53df0b7`. These remain Battle Brothers assets by Overhype Studios. [DLC-EQUIPMENT.md](DLC-EQUIPMENT.md) explains coverage, representative variants, atlas extraction, and game-rule adaptations. [The equipment manifest](../assets/dlc-equipment-source.json) records all source definitions, selected art, crop bounds, orientation correction, and hashes. [The regional terrain manifest](../assets/world/regional-sources.json) credits the three desert tiles to the existing pinned Legends source.

The v0.44.1 medical icon correction uses the actual rolled-bandage and medicine inventory artwork from [kovasap/battle-bros-decompiled at e06d68df](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7), plus the pinned Legends small medicine-supplies icon. Individual entries in the v0.11/v0.12 manifests record their source repository and commit; these replace armor-wrap substitutions.

Version 0.44.2 preserves the original fur collar, ancient ceremonial collar and noble brocade artwork as three independent armor attachments. Their exact bytes and pinned sources appear in [reclaimed attachment provenance](../assets/reclaimed-attachments-source.json). Animal Pelt Armor and legacy Noble Mail now use full native animal-hide and noble-mail torso images from the pinned Battle Brothers source. Ancient Attire uses a full dark cloth torso as an explicit human-wear adaptation of an NPC collar; its original ceremonial sprite remains the Ancient Gilded Collar. Vizier Headgear uses its actual cloth worn sprite for inventory art rather than the inherited metal-helmet placeholder.

Version 0.44.3 adjusts display poses without changing asset bytes. Rest poses use the existing Battle Brothers / Legends raster sprites and their visible grip/blade directions, with the diagonal shoulder-rest presentation supplied as a user reference. Native actor layering is also documented in [the pinned Battle Brothers actor source](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/entity/tactical/actor.nut): `addDefaultStatusSprites` adds shield and arms after the actor layers, and `onAppearanceChanged` applies weapon brushes without an additional resting rotation. Mounted portraits retain the packaged animal art and share one composition and base plate with the full-size rider; front animal parts precede shield and weapon layers.

Version 0.44.4 corrects the requested display side: one-handed weapons and shields share the right edge of company portraits, with their bounds framed together. Riding Horse's existing mane and head are scaled equally to 72% and placed at the lower left on the shared plate, keeping the rider's face and center chest clear. Raster asset bytes and provenance remain unchanged.

## Named weapon designs

Version 0.46.9 imports 46 named weapon designs and an explicit Impaler crossbow from the same pinned BB source. Their original inventory icons and worn entity-icon sprites are embedded in `src/named-weapon-art.js`. The [named weapon manifest](../assets/named-weapons-source.json) records definition/name-pool hashes, actual icon paths, source brush bounds, cropped atlas regions and final PNG hashes. Source art remains Battle Brothers artwork by Overhype Studios. Handgonne art is excluded. See [implementation and adaptations](NAMED-WEAPONS.md).

Battle terrain/camp update (v0.47.0): `assets/battle/camp-wall-01.png` through `camp-wall-07.png` and `socket-earth.png` are exact vertically flipped atlas crops from the same pinned BB source (`brushes/object_1.brush`, `brushes/terrain.brush`, `gfx/object_1.png`, `gfx/terrain.png`). `assets/battle/camp-source.json` records source bounds, crop rectangles and output SHA-256; `tools/content/import-bb-camp-art.py` reproduces them. Original art remains the property of Overhype Studios.

Version 0.48.7 uses unchanged Double Mail and wolf/unhold/hyena cloak PNGs from the pinned Legends commit b014cdf8520e69b2383116d1654977e9dbb10d96. [Fur/mail provenance](../assets/fur-mail-attachments-source.json) records paths and hashes. Hyena rear cloak uses an 80% CSS scale to fit the human pawn. Heraldic Plates and Shoulders exchange their existing inventory and worn art mappings; their source PNGs remain unchanged.
