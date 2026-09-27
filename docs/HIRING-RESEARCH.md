# Hiring: small identities, easy choices

This is an Ashen Company feature proposal, not a transcription of Battle Brothers rules. The goal is to make hiring a pleasant choice among a few distinct people. A recruit should have a readable edge and a harmless quirk, never a hidden flaw that makes the purchase feel wasted.

## Source lessons

- [Battle Brothers' developer explanation](https://battlebrothersgame.com/dev-blog-18-character-traits-and-backgrounds/) says backgrounds express a former profession through starting attributes and equipment, while new characters can receive zero to two random traits. Its examples include a fatigue-oriented farmer, a sword-trained noble, Tough, and Eagle-Eyed. Those examples establish the concept, not Ashen Company's numbers.
- [Legends' trait definitions](https://github.com/Battle-Brothers-Legends/Legends-public/blob/development/mod_legends/%21%21config/trait_defs.nut) show a large pool and an explicit `VisibleOnRecruitment` property. [Its background definitions](https://github.com/Battle-Brothers-Legends/Legends-public/blob/development/mod_legends/%21%21config/character_backgrounds.nut) use per-stat ranges. That breadth suits an overhaul but would create too much inspection work for Ashen's casual hiring screen.
- [Reforged's mechanics diary](https://reforged.enduriel.com/docs/dev-diaries-folder/dev-diary-1-combat-mechanics/) shows how even familiar traits such as Huge and Tiny can connect to another combat system, Reach. Ashen should avoid adding such a dependency just to give recruits personality.

## Present Ashen Company constraints

The current hiring screen previews one generated person by cloning the state and calling `recruit`; the purchase calls `recruit` again. The next person depends on `recruitSerial`, and all recruits cost 160 crowns, arrive without equipment, and earn the normal five-crown level-one wage. The nine available recruit backgrounds are Wayfarer, Caravan Guard, Hunter, Farmhand, Deserter, Sailor, Tinker, Outrider, and Pilgrim. `getCompanyStats` already gives Caravan Guard the Guard bonus (+5 HP, +6 melee skill, +3 melee defense) and Hunter/Outrider the Scout bonus (+13 ranged skill, +3 ranged defense, +10 initiative). These existing packages are much larger than the new proposed bonuses. The three founding companions are Captain, Scout, and Guard.

## Recommended first release

Show three candidates at each settlement. Generate them deterministically from campaign seed, town, day, and offer slot, and save the offers or their stable identifiers. Opening and closing the screen must never reroll them. Hiring removes only that candidate; the other two remain until the next day. Ideally each slate includes a melee, ranged, and flexible/support background. Show name, portrait, background, all resulting level-one stats, traits, exact fee, five-crown daily wage, and one-food daily consumption before purchase. Leave recruits unequipped, as today. No tryout fee, hidden traits, refresh button, rarity tier, or ongoing background event is needed.

Each *new* hire gets one small background edge and one positive trait. Half also get a paired tradeoff trait. These are fixed at offer generation. The background should be the character's history, not a class: no equipment or perk restrictions. The trait labels and exact effects remain visible in the company view after hiring.

### Background edges for new hires

| Background | Ashen Company edge | Hiring fee |
| --- | --- | --- |
| Wayfarer | +4 initiative, +2 maximum fatigue | 120 |
| Farmhand | +6 maximum HP, +4 maximum fatigue | 130 |
| Sailor | +2 melee defense, +3 maximum fatigue | 140 |
| Tinker | +2 ranged defense, +3 ranged skill | 140 |
| Pilgrim | +5 maximum HP, +2 ranged defense | 130 |
| Deserter | +4 melee skill, +2 initiative | 150 |
| Caravan Guard | +4 melee skill, +2 melee defense, +3 maximum HP | 180 |
| Hunter | +8 ranged skill, +3 initiative | 180 |
| Outrider | +5 ranged skill, +5 initiative, +2 maximum fatigue | 180 |
| Brawler | +4 melee skill, +4 maximum HP | 150 |

Brawler is the only new name in this set. These edges and fees are *local design values*. They should replace the old hard-coded Guard/Scout bundle for newly generated hires, not stack with it. Store an explicit background ID or rules version on new people; people in older saves with only legacy background strings should keep their current calculated stats. Keep the Captain, Scout, and Guard founders unchanged.

### Traits

| Positive trait | Exact Ashen effect | Paired tradeoff trait | Exact Ashen effect |
| --- | --- | --- | --- |
| Tough | +5 maximum HP | Hulking | +4 maximum HP, -4 initiative |
| Strong | +4 maximum fatigue | Stocky | +4 maximum fatigue, -4 initiative |
| Dexterous | +3 melee skill | Aggressive | +2 melee skill, -2 melee defense |
| Eagle Eyes | +3 ranged skill | Impatient | +3 initiative, -3 ranged skill |
| Quick | +4 initiative | Lean | +4 initiative, -4 maximum HP |
| Sure Footed | +2 melee defense | Cautious | +2 melee defense, -2 melee skill |

The two columns are independent pools; every recruit gets one positive trait, and half get one tradeoff. The tradeoffs are deliberately near zero-sum in their printed numeric adjustments, though attributes have different tactical value. Avoid a combination that exactly cancels its own positive trait where possible; never reroll offers after the player sees them. Trait names echo Battle Brothers/Legends where applicable, but every number and several tradeoff effects are original Ashen adaptations. No trait should alter XP, wages, morale state, death, equipment legality, or level-up rolls in this release.

## Implementation boundaries and checks

- Resolve bonuses in one place, including armor and perks, so the preview and later combat/company stat panels show the same final values. Clamp HP after a max-HP change where needed and spawn new hires at full calculated HP.
- Derive exact candidate details from the saved seed, town, day, and slot; save consumed offer IDs. A preview must not consume money or advance `recruitSerial`; hiring must purchase the displayed candidate without rerolling it. Same-day reopening, save/load, and switching towns must preserve each town's offers.
- Validate trait/background IDs and numeric fields on load. Legacy people without traits or a new background-edge field remain neutral under the new rules and retain the old background calculations. Existing save files should load without forced rerolls or stat loss.
- Check the narrow behavior: distinct same-day offers, no change on reopen/save-load, only selected offer removed, next-day refresh, exact displayed fee and stats charged/retained, and a legacy save whose Guard/Scout bonuses remain as before.
