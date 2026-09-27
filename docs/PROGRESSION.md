# Future company progression

The user wants perks, deeper backgrounds, and classes in a later update. These possible directions draw on Wayfarer Guild v2 (`v2/js/jobs.js`, `v2/js/state.js`, `v2/js/sim.js`, and `v2/js/ui.js`); they are not implemented features or settled rules.

## Immediate level-up choice

Ashen Company's current level-up direction is to choose three distinct attributes, each with a +1 to +5 roll. Generate and save the offers when the level is earned, before opening the picker; closing or reloading must not reroll them. Require exactly three distinct choices before applying them, and consume the pending level only once. This choice-based system is an Ashen design; Wayfarer's character levels instead grow stats automatically from fixed per-level coefficients.

## Later options

- Keep backgrounds as a brother's origin and starting-stat profile, not a class or equipment lock. A future background trait could add one narrow, readable edge such as a Guard's defense or a Scout's initiative, without blocking other builds.
- Use Wayfarer's job milestones as a reference for future classes or specializations, such as melee, ranged, defense, or company support. At a milestone, let the player pick a clearly described perk. Whether classes restrict equipment or simply guide development remains a future design choice.
- Give veteran milestones a distinctive choice after several ordinary stat selections: specialize for formation defense, ranged pressure, or company support. Keep the choice modest and inspectable, and avoid adding a large skill tree before the current progression loop is balanced.

Wayfarer Guild's useful structural ideas are clearly described advancement milestones and perks that make a character's history persist after changing focus. Its tiers, job switching, weapon restrictions, and accumulating mastery perks are reference mechanics only; Ashen Company has not implemented them.
