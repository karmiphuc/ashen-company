# Fantasy and Samurai equipment

Version 0.26 imports a focused selection of worn armor, helmets and recruit
appearances from the user-supplied Fantasy Brothers 6.2 and Samurai 2.1 archives.
The additional Jurchen archive was inspected but is not part of this release.

Sources:

- [Fantasy Brothers](https://www.nexusmods.com/battlebrothers/mods/473), by
  cocowing. Its credits attribute Samurai and related artwork to
  F5349490huanzhuoh / wuxiangjinxing and identify additional contributors.
- [Samurai](https://www.nexusmods.com/battlebrothers/mods/436), by
  Encke / wuxiangjinxing, uploaded by F5349490huanzhuoh.

The source manifest records archive hashes, inventory paths, atlas coordinates,
brush names and the hashes of the packaged PNGs. Sprites are cropped from the
original atlases; this project does not claim authorship or a new asset license.
The [horse source manifest](../../assets/fantasy-mount-source.json) records the
War Horse and Armored War Horse crops from Fantasy Brothers' `entity_xx` atlas.
Each portrait uses a rear layer and a front head layer around the rider; the
inventory icons come from that archive. Their stats and separate mount slot are
Ashen Company adaptations, not the mod's offhand shield mechanics.

## Adaptation

Special recruits appear among the ordinary daily hiring offers. Background
bonuses remain small, fees reflect their advantages, and backgrounds do not
restrict equipment or perks. Their appearances survive hiring, save reloads and
battles. Older saves continue to use the existing human portrait selection.

New armor uses the existing durability, repair, equipment, attachment and named
item systems. Inventory descriptions state its protection/fatigue trade-off.
The normal scarce shop rotation applies; this expansion does not restore the
previously halved stock rates. All sprites and modules are cached for offline
play.

This is a content adaptation, not a port of the mods' scripted magic, special
classes, factions or item powers. Descriptions only promise implemented effects.

## Verification

- Deterministic special-offer coverage, hiring fees and background bonuses.
- Save validation and appearance persistence for company and battle units.
- Every imported item has an inventory icon, worn layer and useful description.
- Tablet-size visual inspection of race, armor and helmet combinations.
- Offline cache coverage and the full existing game test suite.
