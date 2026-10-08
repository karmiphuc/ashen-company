# Expanded shield roster

The pinned equipment import originally covered only body armor and helmets. `DLC_SHIELDS` adds 26 missing human designs: three ancient, three heraldic, three weathered, Sipar, three crafted designs, twelve named designs and Gilder's Embrace. The importer accounts for all 39 shield source classes, preserving five existing campaign shields and excluding two abstract parents and six creature-only shields. No races or enemy types are added.

Shields retain separate source melee defense, ranged defense, durability and fatigue. Existing campaign shields retain their IDs and artwork, and now use the OG baselines below. Named designs use the existing deterministic two-modifier system and current named affixes. Legacy version-3 identities retain their original rolls; current version-7 rolls keep their expanded affixes. Both start shield durability from the source baseline, avoiding a second bonus on the catalog’s pre-rolled display value. Broken shields grant no defense and remain repairable; condition survives stowing, swapping, selling, buying back and save reloads.

Ordinary and crafted designs enter weekly regional stock within existing slot budgets. Named offers retain the existing scarce one-item limit. Ancient equipment stays out of living settlements. Existing regional shield bearers can carry imported ordinary or named shields, so they can drop through normal combat loot. Advanced frontier camps can award named shield rolls; Gilder's Embrace is restricted to tier-three frontier reward pools and is not sold. Previously saved active battles keep their existing shield stats until the spoils are collected; saved Ashen force shield damage is rescaled proportionally to its new maximum. The crisis's stable legacy troop templates are preserved. Accepted blacksmith quests without the shield-design marker regenerate their original enemy equipment; newly accepted quests record `shieldDesignsVersion: 1` and can use the new shield roster.

Crafted source shields are available as equipment without adding a crafting system. Source regeneration, retaliation and other magical scripts are not simulated; inspection descriptions say so. Gilder's Embrace retains its source durability baseline rather than its original scripted effects.

All designs appear in the collection browser with shield-specific stats. Inventory images come from the pinned source. That repository does not contain the native worn shield brushes, so offhand layers adapt alpha-trimmed inventory art within a 46×72 box, preserving aspect ratio. Only shield art is fitted; brother portraits keep their native dimensions. The manifest records this adaptation, source paths and SHA-256 hashes.

Rebuild with `python3 tools/content/import-bb-shields.py --cache /tmp/bb-shield-source` (Python, Pillow, Node), then `npm run prepare-offline`. Downloads remain outside the checkout, while generated runtime modules and provenance are committed. Both shield modules are cached for offline use.


## Campaign shield baselines

These stats come from the pinned original scripts recorded in `assets/campaign-shields-source.json`. Fatigue is equipment load (subtracted from maximum fatigue). Prices stay at their existing campaign values.

| Shield design | OG equivalent | Melee | Ranged | Durability | Fatigue |
| --- | --- | ---: | ---: | ---: | ---: |
| Buckler | Buckler | 10 | 5 | 16 | 4 |
| Round, Painted Round, Heartwood | Wooden shield | 15 | 15 | 24 | 10 |
| Heater, Painted Heater | Heater shield | 20 | 15 | 32 | 14 |
| Kite, Painted Tower | Kite shield | 15 | 25 | 48 | 16 |
| Adarga | Southern light shield | 15 | 20 | 18 | 10 |
| Iron Round | Metal round shield (Sipar) | 18 | 18 | 60 | 18 |

Custom painted and northern designs use the closest OG equivalent rather than extra custom defenses or lighter fatigue. The tall living Painted Tower uses the kite profile. This balances the old roster against imported shields without introducing new designs.

On first loading an older save, worn and stored shield condition is rescaled by `floor(old condition × new maximum / old maximum)`, including named and reforged shields and market buybacks. Zero remains broken; a positive remainder stays at least 1. Missing condition restores full through the existing save validator. Invalid old condition is rejected rather than repaired silently. Named rolls and forge packages retain their identity and bonuses while adopting the new baseline.

An imported ongoing battle uses hidden legacy definitions until it finishes, preserving shields' defenses, fatigue, durability, set swaps and pending loot throughout reloads. Collecting spoils or finishing a retreat converts the surviving equipment and recovered shields. Legacy definitions never enter shops, catalogs or new encounter pools. The one-time `shieldBalanceVersion` marker prevents repeated wear conversion, while the normal save and combat versions remain unchanged.
