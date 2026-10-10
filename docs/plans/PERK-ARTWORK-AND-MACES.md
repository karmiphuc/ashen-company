# Perk artwork and mace progression

Each perk has an intentional local icon. Added perks no longer silently reuse
one of five category placeholders. Weapon masteries show their own recognizable
weapon silhouette: sword, axe, mace, spear, polearm, dagger, thrown javelin, bow
and crossbow. Original suitable icons remain; the expanded artwork follows the
same painted circular game style. New perks must register dedicated artwork;
missing mappings fail immediately and are covered by asset tests.

Artwork is imported unchanged from the existing Battle Brothers Legends source,
pinned to commit `b014cdf8520e69b2383116d1654977e9dbb10d96`. Source URLs, sizes
and hashes live in `assets/perks/source-manifest.json` and
`assets/items/mace-source-manifest.json`. Icons and worn weapon sprites are
separate source images. Both are cached for offline use. No runtime downloads.

Four mace variants fill the sparse progression:

| Weapon | Damage | Crowns | Use |
| --- | --- | --- | --- |
| Flanged Mace | 23–35 | 210 | One-handed bridge from bludgeon to winged mace |
| Footman's Mace | 34–48 | 425 | Premium one-handed mace, compatible with a shield |
| Two-Handed Spiked Club | 30–44 | 240 | Affordable heavy mace and daze |
| Two-Handed Flanged Mace | 45–65 | 620 | Premium heavy mace, daze and Strike Down |

Normal rotating settlement armories stock these items. One-handed maces use
Bash/Knock Out; two-handed maces use the existing Cudgel/Strike Down skill set.
They favor health damage and control; hammers retain substantially stronger armor
stripping. Mace Mastery's existing shared blunt-weapon coverage is preserved.
Generated named descendants inherit the same skill profile and their base art.
Existing saved encounter gear and named drop tables are not rewritten.
