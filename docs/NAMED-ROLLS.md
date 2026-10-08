# Named-item rolls — v0.47.4

New named rewards combine the older campaign traits and craftsmanship with Battle Brothers' modifier ranges. Each weapon or shield gets **two different modifiers** from its eligible pool; body armor and helmets always roll protection and weight independently. Rolls are deterministic per item, with no reload rerolls.

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
| Body armor (new rolls) | Protection / fatigue bonus | +10–25% / −11 to −1 after the weight floor |
| Helmet (new rolls) | Protection / fatigue bonus | +10–25% / −4 to −1 after the weight floor |
| Shield | Melee or ranged defense, independently | 120–140% |
| Shield | Durability | 120–160% |
| Shield | Equipment fatigue | 70–90% |

Armor protection is rounded down. Weapon damage, shield stats and proportional weight rolls are rounded to the nearest integer. Legacy `famed2`–`famed7` body armor fatigue bottoms out at 8; helmet fatigue at 4. Ultra-light campaign bases below those floors never become heavier. Imported named armor uses its original `sourceArmor` / `sourceFatigue`, avoiding a second boost on top of its old catalog premium. Fangshire retains its innate campaign +5 ranged defense; merged armor also retains a Guard, Deflection, Resolve or Vigor trait. Imported rare armor keeps its existing signature and passive bonus without doubling it.

The combat engine uses the rolled head chance, penetration, armor damage, shield wear, ammunition capacity and fatigue costs. Separate shield melee/ranged rolls affect company stats, combat snapshots, Shieldwall, weapon swaps, and shield breakage. Inspection lists both rolled modifiers and actual costs.

## Restored campaign bonuses

Weapons keep their two BB modifiers and also receive the older damage bonus (+2–6 minimum and +3–9 maximum), accuracy (+2–8) and armor damage (+10–20 percentage points). Shields retain their two modifiers plus +2–5 to both defenses and 1–3 fatigue relief, bounded by zero fatigue. Armor retains its protection and weight rolls plus one passive trait: +2–4 melee defense, +3–5 ranged defense, +4–7 resolve or +4–7 maximum fatigue. Inspection shows the combined bonuses. These are campaign bonuses added to the BB roll rules, not exact BB statistics.

## Sources and campaign adaptations

Ranges and selection rules were checked against the pinned public [Battle Brothers script snapshot](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7):

- [`named_weapon.nut`](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/weapons/named/named_weapon.nut), `randomizeValues`
- [`named_armor.nut`](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/armor/named/named_armor.nut), `randomizeValues`
- [`named_helmet.nut`](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/helmets/named/named_helmet.nut), `randomizeValues`
- [`named_shield.nut`](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/shields/named/named_shield.nut), `randomizeValues`

The campaign's ordinary weapon damage and prices remain its own. Ordinary campaign weapons have no equipment weight or durability. Imported named weapon designs carry their source equipment load and can roll reduced weight when that load is at least 10; weapon-condition rolls remain excluded. Bows/crossbows use company ammunition rather than per-item quivers, so the extra-ammo roll applies to throwing bundles. Shield-damage eligibility uses this campaign's existing shield-wear values. Head chance uses the campaign's existing 22% baseline. Penetration cannot exceed 100%. These are explicit mechanical adaptations, not an exact conversion of every BB base item.

## Persistence

New items use `famed3:<base-id>:<seed>` identities. Owned `famed2` equipment and concrete named weapon designs upgrade with the same seed when loading outside combat, purchasing equipment or claiming a finished battle. Inventory condition, equipment damage and buyback condition stay intact. Active and unclaimed battles keep their existing equipment rules until claimed; old `famed:` identities retain their original rules. Town stock keeps its quantities, including sold-out offers.

Camp finds, champions, Deserter upgrades, regional named trophies and new weekly town offers use the merged rules. The v2 resolver remains available for saved battle snapshots; migration preserves its selected modifiers without rerolling them.

Regression coverage checks all campaign weapon pools across 256 seeds each, armor/shield ranges, source-based imported armor, Fangshire, live attack fatigue before masteries, Aimed Shot, Shieldwall, real head hits, shield breakage, throwing bundles, market buybacks and legacy save compatibility.

## Guaranteed fatigue relief

New body armor and helmets use `famed8` identities. Protection rolls +10–25%; raw relief rolls 3–11 for body armor and 1–4 for helmets. Compute the legacy load `max(min(baseLoad, floor), baseLoad − relief)` with floor 8 for body armor and 4 for helmets. The final fatigue modifier is `−clamp(baseLoad − legacyLoad, 1, 11)`: never zero, always between −11 and −1.

If the legacy load equals the base load, double the **protection bonus**, producing +20–50% rather than doubling the entire armor value, and apply exactly −1 fatigue. A zero-fatigue base therefore becomes −1 fatigue, increasing available fatigue capacity by one. Imported named designs use their unrolled source stats. Sets preserve this negative credit without multiplying it.

New armor/helmet reforge transactions use `forge5`, preserving transferable fatigue relief below zero. Relief is capped at 11, and the final load floor is −11. Weapons and shields still use `forge4`. Existing named and forged identities retain their original stats; saved active battles and already-engaged encounter generations do not reroll. New encounters freeze `namedAffixVersion: 3`; prior version 2 continues to create `famed7` armor. Named Armorer crafting and new market offers use the new armor rule. RPG prefix/suffix selection and the two-slot limits are unchanged.
