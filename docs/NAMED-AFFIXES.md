# Named equipment affixes

New equipment uses immutable `famed7` identities. Stat suffixes and effect prefixes use independent seeded streams; prefix grade and random mastery use additional independent streams. Opening menus, loading saves and retreating cannot reroll an item. Attachments retain their separate `famed5` fine / `famed6` champion protection and fitting rolls.

The eligibility and effect registry lives in `src/affix-prefixes.js`. Existing `famed5` prefixes retain exactly their original pools and rolls. New grades display I / II / III: three-grade rolls use 60 / 30 / 10 percent, two-grade rolls use 70 / 30 percent. Unyoked has one-quarter the selection weight of other eligible prefixes.

| Prefix | Roll | Behavior |
| --- | --- | --- |
| Hearty | 5 / 10 / 15% | Maximum HP; combines multiplicatively with Colossus. Equipping does not heal; removing clamps HP. |
| Merciless | 10 / 15 / 20% | Added damage when learned Executioner applies against temporary injuries. |
| Dueling | 10 / 15 / 20% | Added damage when learned Duelist applies to one-handed melee attacks. |
| Bloodthirsty | 50 / 75 / 100% | A weapon kill banks damage for one subsequent successful weapon hit. Misses preserve the bank; that hit can bank a fresh bonus if it kills. Bleeding and mount bites do not bank or consume it. Area kills bank after the action. |
| Concussive | Fixed | Weapon head hits inflict 2-turn daze: −50% initiative, −20% melee/ranged skill. Undead are immune. Unlike existing weapon daze, fatigue capacity and damage are unchanged. Deathblow recognizes both daze types. |
| Sundering | 25 / 50% | Relative shield damage, including the complete Split Shield impact. |
| Headhunting | 25 / 50% | Relative head chance: 22% becomes 27.5 / 33%. Forced head/body skills remain forced. |
| Crippling | Fixed | Injury threshold is 83% of normal; with learned Crippling Strikes it becomes 50%. Gash's additional multiplier and the 10-damage minimum remain. |
| Masterful | Random | Grants one of the nine existing weapon masteries. Its class restrictions still apply; a matching learned perk does not apply twice. |
| Supple | Fixed | Learned Agile Defense's full protection extends from 15 to 18 armor/helmet fatigue, shifting the whole falloff by 3. |
| Unyielding | Fixed | Learned Last Stand grants 18 rather than 8 defense at or below half health. |
| Prescient | Fixed | Anticipation scales 15% rather than 10% of ranged defense per distance tile; minimum 10 remains. |
| Volleying | Fixed | Learned Volley Fire activates at 2 rather than 3 tiles. |
| Trueflight | +5 / +8 | Flat hit chance for all ranged weapon attacks. |
| Reinforced | 25% | Relative maximum shield durability; applies once to the shield's unboosted rolled maximum. |
| Longshot | Fixed | All ranged weapons, including throwing weapons, gain 1 hex reach and lose 12% damage. |
| Surefooted | Fixed | Removes elevation movement/fatigue surcharge; ground travel still costs normal AP/fatigue. Cannot bypass blockers or mounted zones of control. |
| Unyoked | +1 AP | Adds to turn budgets, including realtime cycles and injury adjustments. Strongest worn copy only. |
| Mending | Fixed | Grants Combat Bandaging: first healing item each round costs 0 AP, item still consumed. |
| Swift-handed | Fixed | Grants Quick Hands: first weapon-set swap or pocket draw/stow each round costs 0 AP. |
| Layered | Fixed | Grants Layered Armor on body armor. Reforging can transfer it to head armor. Removing the last grant stows attachment 2 at its exact durability; insufficient stash capacity rejects the entire operation. |

Existing Bloodrush, Featherbound, Tempered, Farseeing and equipment-perk prefixes remain in the new pool. Bloodrush stacks to +2 Berserk AP; Tempered stacks to 10 extra percentage points of Battle Forged reduction; Featherbound applies once. New graded effects use the strongest worn copy rather than adding multiple copies. Perk enhancements require the underlying perk; a granted Anticipation perk can also be enhanced. Effects and granted perks are active only on worn gear; reserve gear and broken shields grant none.

## Saves and reforging

`forge1` retains its original 21-field profile; `forge2` retains its 30 fields and original eight perk bits. `forge3` stores additional effects and expanded perk flags. Existing key positions and flag positions never move. Canonical encodings and per-effect bounds reject malformed profiles; all ordinary-gear full transfers and named-gear partial merges preserve applicable effects.

Engaged camp/band generations freeze `namedAffixVersion`: absent means legacy, 1 means the original prefix pool, 2 means the expanded pool. Scripted quest/crisis rewards remain pinned to their old identities. New battles use `itemAffixRulesVersion: 2` for extended AP, kill-momentum state, head-hit daze and effect events. Older battles retain their saved version and fields.

`tests/expanded-prefixes.test.js` checks every family and grade, actual combat, perk eligibility, free actions, reloads, expiry, AP refresh, attachment removal, forging and frozen encounters. The original affix suite explicitly continues to exercise version 5.

## Bounded reforging

New forge transactions produce immutable `forge4` identities. They encode original named craftsmanship separately from up to **two prefix families and two RPG suffix families**, including each affix's complete roll. Original named stat rolls do not consume RPG affix slots and stay fixed during merges; transferring to ordinary gear carries that craftsmanship too. Older named gear without RPG affixes represents its entire stat package as one legacy craftsmanship suffix.

Named merges inherit 1–3 eligible complete affixes, bounded by the available slots. Existing families can upgrade only when the donor roll is at least as strong in every field and improves a field. Duplicate values never add. Different free masteries belong to the same Masterful family, so a single item cannot accumulate all masteries. Inactive effects occupy slots; unsuitable ranged, Duelist and mastery effects cannot consume a random merge. Full transfers preserve inactive affixes so they can reactivate on compatible gear.

Existing `forge1`–`forge3` profiles lack reliable provenance. Their stats and identities remain unchanged. They cannot participate in accumulating merges; a full transfer produces a locked `forge4` package with exactly the original flattened profile. The lock survives subsequent transfers and save reloads.

The first reforge waives gold and materials. Later transactions cost 1,000 crowns plus modest trading goods from cargo: timber for ranged/movement work, wool for protective/healing work, iron for other work. Each eligible affix requires one unit; Unyoked requires three iron instead. A merge's displayed recipe prepares **all eligible donor affixes**, independent of the hidden random selection. Legacy flat-package transfers require one iron. Recipes appear before confirmation, with owned/required quantities. Cargo and its purchase-origin records are consumed together only after a fresh quote passes all checks. Trading-quest reservations are not automatic: the player must retain any cargo needed for those contracts.

Canonical sparse profiles, family validation, duplicate checks and slot bounds validate the new format. Decoding derives combat stats from the stored packages. `tests/bounded-forge.test.js` checks catalog round trips, atomic transactions, repeated forging, legacy locks, inactive slots, materials, live combat saves and forge UI.
