# Named-item rolls — v0.46.8

New named rewards use Battle Brothers' modifier ranges rather than the previous small flat boosts. Each weapon or shield gets **two different modifiers** from its eligible pool; body armor and helmets always roll protection and weight independently. Rolls are deterministic per item, with no reload rerolls.

| Equipment | Eligible roll | Range |
|---|---|---|
| Weapon | Damage | 110–130% of base min/max, one multiplier |
| Weapon | Armor damage | +10–30 percentage points |
| Weapon | Damage through armor | +8–16 percentage points |
| Weapon | Head hit chance | +10–20 percentage points |
| Weapon | Accuracy, when the base has a modifier or is ranged | +5–15 |
| Weapon | Equipment fatigue, when base load is at least 10 | 50–80% of base load |
| Weapon | Shield damage, when base shield damage is at least 16 | 150–200% of base |
| Throwing bundle | Ammunition | +1–3 throws |
| Weapon or shield | Skill fatigue | −1–3, before weapon mastery |
| Body armor | Protection / fatigue relief | 110–125% / 3–9 |
| Helmet | Protection / fatigue relief | 110–125% / 1–4 |
| Shield | Melee or ranged defense, independently | 120–140% |
| Shield | Durability | 120–160% |
| Shield | Equipment fatigue | 70–90% |

Armor protection is rounded down. Weapon damage, shield stats and proportional weight rolls are rounded to the nearest integer. Body armor fatigue bottoms out at 8; helmet fatigue at 4. Ultra-light campaign bases below those floors never become heavier. Imported named armor uses its original `sourceArmor` / `sourceFatigue`, avoiding a second boost on top of its old catalog premium. Fangshire retains its innate campaign +5 ranged defense; random armor resolve/defense signatures are no longer added to new rolls.

The combat engine uses the rolled head chance, penetration, armor damage, shield wear, ammunition capacity and fatigue costs. Separate shield melee/ranged rolls affect company stats, combat snapshots, Shieldwall, weapon swaps, and shield breakage. Inspection lists both rolled modifiers and actual costs.

## Sources and campaign adaptations

Ranges and selection rules were checked against the pinned public [Battle Brothers script snapshot](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7):

- [`named_weapon.nut`](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/weapons/named/named_weapon.nut), `randomizeValues`
- [`named_armor.nut`](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/armor/named/named_armor.nut), `randomizeValues`
- [`named_helmet.nut`](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/helmets/named/named_helmet.nut), `randomizeValues`
- [`named_shield.nut`](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/shields/named/named_shield.nut), `randomizeValues`

The campaign's ordinary weapon damage and prices remain its own. Ordinary campaign weapons have no equipment weight or durability. Imported named weapon designs carry their source equipment load and can roll reduced weight when that load is at least 10; weapon-condition rolls remain excluded. Bows/crossbows use company ammunition rather than per-item quivers, so the extra-ammo roll applies to throwing bundles. Shield-damage eligibility uses this campaign's existing shield-wear values. Head chance uses the campaign's existing 22% baseline. Penetration cannot exceed 100%. These are explicit mechanical adaptations, not an exact conversion of every BB base item.

## Persistence

New items use `famed2:<base-id>:<seed>` identities. Camp finds, champions, Deserter upgrades, regional named trophies and new weekly town offers use the versioned rolls. Existing `famed:` identities and plain named catalog IDs keep their previous values, remaining durability, buyback conditions and active-battle snapshots. Loading old markets does not duplicate their existing named stock. Old items are not silently rerolled.

Regression coverage checks all campaign weapon pools across 256 seeds each, armor/shield ranges, source-based imported armor, Fangshire, live attack fatigue before masteries, Aimed Shot, Shieldwall, real head hits, shield breakage, throwing bundles, market buybacks and legacy save compatibility.
