# Injury research and implementation direction

Researched 2026-10-05. This document proposes work; it does not change gameplay.

## Reference and confidence

The reference is original Battle Brothers behavior in the community-decompiled vanilla source at commit [`e06d68df`](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7). This is a reproducible code snapshot, not an assertion that every detail matches the latest commercial patch. Legends and other mod rules are excluded. Numbers below were checked against the source, rather than inferred from wound names.

Source index (all links pin the same revision):

- [Damage handling and temporary injury selection](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/entity/tactical/actor.nut).
- [Damage constants, including 10 minimum damage and 33% survival](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/config/character.nut).
- [Injury pools, thresholds and permanent injury pool](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/config/character_injuries.nut).
- [Temporary injury lifecycle, recovery and treatment](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/skills/injury/injury.nut); [medicine constants](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/config/world_assets.nut).
- [Fatal blows and surviving with permanent injuries](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/entity/tactical/player.nut); [Surgeon](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/retinue/followers/surgeon_follower.nut); [Survivor trait](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/skills/traits/survivor_trait.nut).
- [Crippling Strikes](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/skills/perks/perk_crippling_strikes.nut); [Gash](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/skills/actives/gash_skill.nut).

## The three separate systems

Lost HP is a health deficit. A temporary injury is a persistent, specific stat penalty with its own recovery. A permanent injury is usually the price of surviving incapacitation. Healing HP does not erase either injury category. Bleeding, stun and daze are separate combat conditions; a bandage stopping bleeding is not treatment for a pierced lung.

This separation creates the interesting decision: an apparently healthy brother can still be unfit for his normal role, while an injured specialist may remain worth fielding. Injuries should encourage reserves, treatment and role changes without preventing new contracts.

## Original temporary injury rules

1. Resolve armor and health damage first. A fatal hit follows death/survival handling instead of ordinary temporary wound selection.
2. A surviving, injury-susceptible target needs at least **10 health damage from that individual hit**. Armor damage alone, accumulated damage from earlier hits, or simply having low remaining HP is insufficient.
3. The attack supplies its injury pool for the struck body part. Pools include blunt, cutting, piercing, burning and mixed types. Define these on skills; weapon class alone is insufficient.
4. Each candidate requires `healthDamage / currentMaximumHP >= candidateThreshold × attackModifier × globalModifier × targetModifier × headModifier`. The head modifier is **1.25**; the global default is 1.
5. Most ordinary pool thresholds are **0.25 or 0.50**. Thus an unmodified 80-HP target needs 20/40 body damage or 25/50 head damage. Fractured Skull is an exception with a 0.60 base threshold, becoming 0.75 for a head hit. The 10-damage floor still applies after threshold reductions.
6. Remove already-held injury IDs, exclusions and invalid wounds. Randomly choose a valid eligible pool entry and apply at most **one temporary injury per hit**. There is no additional blanket injury-chance roll once a valid candidate exists. Heavy damage also leaves lesser wounds eligible; severe wounds are not guaranteed.
7. Different wounds can coexist. The same injury does not stack with itself. Multi-hit attacks can produce more than one wound across distinct hits.

Crippling Strikes multiplies the threshold to inflict injuries by **0.66**. Gash uses **0.66**, or **0.50** with sword specialization. These lower required damage; they are not additive percentage-point chances. Apply their interaction through the attack-property pipeline and retain the absolute minimum damage.

Most combat penalties apply when the wound is acquired, but timing is definition-specific. Some maximum-HP penalties are activated out of combat. Iron Will can defer eligible fresh-injury effects until combat ends. Do not flatten these into one generic immediate modifier.

### Representative wounds

These values come from the corresponding files under `scripts/skills/injury/` in the pinned source. Durations are untreated ranges, subject to daily recovery rules.

| Wound | Typical source pool | Effect | Recovery |
| --- | --- | --- | --- |
| Fractured Ribs | Blunt body, 25% | −30% maximum fatigue | 3–4 days |
| Cut Arm Sinew | Cutting body, 25% | −40% damage dealt | 4–6 days |
| Deep Abdominal Cut | Cutting body, 25% | −25% maximum HP and fatigue; HP timing is special | 3–4 days |
| Pierced Lung | Piercing body, 50% | −60% maximum fatigue | 5–7 days |
| Severe Concussion | Blunt head, 50% before head modifier | −50% initiative, melee/ranged skill and both defenses | 3–5 days |

Use the complete source pools in a later implementation. A generic “wounded: −10% everything” loses both tactical identity and counterplay.

## Recovery and treatment

Ordinary healing injuries consume **one medicine per injury per day**, including days before recovery becomes possible. Several injured brothers can therefore exhaust supplies quickly. Without sufficient medicine, the healing clock pauses; topping up HP does not bypass that pause.

Recovery is evaluated on a new day. Once the effective minimum duration is reached, the recovery chance is elapsed healing days divided by effective maximum duration, expressed as a percentage. Recovery is guaranteed by the maximum when medicine is available. The displayed range is not a single randomly selected deadline.

Temple treatment halves the minimum and maximum healing durations; it does not immediately remove the wound. Its price depends on the wound's remaining duration, treatment multiplier, brother's level, settlement prices and difficulty. There are special-condition exceptions to the ordinary medicine rule; implement only supported wound definitions instead of treating poison and every status as a healing injury.

The OG Surgeon reduces injury recovery by one day, with a minimum of one. His separate survival protection is discussed below. HP recovery, injury recovery, and treatment discounts must remain distinguishable in the UI.

## Permanent injuries and fatal blows

Ordinary eligible incapacitations have a **33%** survival chance in this snapshot. Survivor multiplies this by **2.72**, approximately 90%; it is not 99%. A survivor is removed from active combat and receives a new permanent injury from the eligible pool. This is not a mid-fight resurrection or a random permanent wound on every large hit.

Ordinary survival rejects nonstandard fatality types, scenarios, automatic retreat and guests. The Surgeon has an important exception: for eligible brothers without an existing permanent injury, his kill-path override can neutralize several fatality types. Kraken and being devoured remain excluded, and origin-specific restrictions exist. Do not implement the misleading blanket rule “Surgeon rescues every death” or assume his behavior is identical to the ordinary survival roll.

The ordinary permanent pool contains **11 entries** in this snapshot: Missing Nose, Missing Eye, Missing Ear, Brain Damage, Traumatized, Broken Knee, Weakened Heart, Collapsed Lung, Missing Finger, Maimed Foot and Broken Elbow Joint. A permanent-injury script existing elsewhere does not automatically make it part of this pool. Existing permanent injuries do not categorically prevent another ordinary survival roll; duplicates are excluded from the new-injury pool. Some scripted events can also cause permanent injuries directly.

Permanent injuries do not recover through ordinary rest or temple treatment. Their effects are individual: Brain Damage, for example, gives +15% resolve but −25% initiative and experience gain. Rare special cures, events and origin exceptions should be researched separately before claiming exhaustive OG parity.

## Current Ashen Company gaps

At the researched main revision, `src/engine.js` models damage and HP recovery but has no persistent injury collection or recovery lifecycle. Doctor restores HP immediately. A six-hour rest consumes one medicine for the entire wounded company and restores 24 HP with medicine or 8 without it, with Surgeon scaling. The Surgeon in `src/retinue.js` costs 6,000 gold and grants +25% rest healing and −25% Doctor fees; it explicitly does not resurrect casualties.

Gash currently uses a daze surrogate rather than persistent cutting injuries, as documented in `docs/WEAPON-SKILL-COMPLETION.md`. Combat status effects and casualty removal cannot simply be relabeled as injuries. Existing saves and resumed battles need explicit compatibility rules.

## Recommended implementation order

### 1. Temporary injuries and clear recovery UX

Build a data-driven wound catalogue with source-verified pools, thresholds, effects, validity and timing. Start with supported attacks and living actors on both sides. Reuse existing ancient-armory/undead identities and explicit susceptibility flags; create no new races and do not assume every beast has human anatomy.

Keep injury selection in the resolved health-damage pipeline. Route all derived stats through one modifier layer so inspection, AI, combat and equipment screens agree. Replace Gash's surrogate only when the actual injury integration and related skill interactions are ready.

Persist unique wound IDs, acquisition time, treatment state and recovery progress. Process recovery once per crossed world-day boundary, including long travel and rests; reloading or splitting travel must not generate extra recovery rolls. Use deterministic RNG with deliberate save/version handling. Do not infer wounds retroactively from missing HP in old saves.

Preserve the existing HP treatment service and add a separate wound-treatment quote. Treatment must be affordable, atomic and repeat-safe. OG per-wound daily medicine consumption is the target, but review this game's small starting medicine stock and its separate HP medicine cost before shipping: accidental double charges would make the system punitive rather than tactical.

Show a compact wound badge on the sticky roster and affected stat markers in equipment/combat inspection. A hint reveals wound name, exact effects, remaining recovery range and treatment state. Clearly mark “recovery paused: no medicine.” After combat, show new wounds beside casualties. Offer a convenient reserve swap, without forced retirement or contract locking. Keep detailed mechanics behind hints, not paragraphs in the main screen.

### 2. Permanent injuries and casualty recovery

Add a distinct incapacitated survivor outcome before removing roster members and distributing their equipment. Apply each outcome exactly once through battle completion, retreat and reload paths. Permanent wounds must remain visible in roster history and derived stats.

Implement fatality eligibility explicitly; do not invent fatality types from an animation or a weapon label. Review victory, retreat and recovery outcomes against OG battle-state handling before finalizing the feature. Keep ordinary survival, Nine Lives-style death prevention and Surgeon protection separate.

### 3. Perks, retinue and balancing

Finish Crippling Strikes, Gash, injury-sensitive damage bonuses and any fresh-injury suppression against supported OG definitions. Add the Surgeon's one-day wound benefit once recovery exists. Treat his survival guarantee as a separate, reviewed balance change; silently adding it to the current 6,000-gold HP-healing service would substantially change casualty risk.

Validate medicine availability, wounded-brother turnover and reserve usefulness through actual campaigns. Adjust economy inputs transparently if needed rather than secretly changing the injury formula. Injuries should create memorable tactical choices, not require constant menu maintenance.

## Regression acceptance criteria

- Threshold boundaries, the 10-damage floor, head multiplier, modified maximum HP and combined attack modifiers are tested with fixed damage fixtures.
- Armor-only hits, unsupported damage events, immune actors and fatal hits cannot produce ordinary temporary wounds. Damage-over-time receives wounds only if its source explicitly defines an eligible injury pool.
- One wound per hit, duplicate exclusion, valid anatomy, mixed pools and severe-hit eligibility all behave consistently.
- Wound acquisition, delayed effects, stacking, recovery and equipment swaps preserve health deficits without granting free healing or allowing maximum-HP exploits.
- Daily medicine use and recovery are invariant under travel partitioning, repeated UI actions, save/load and battle resumption. Shortage pauses progress rather than banking free healing days.
- Treatment costs and effects are atomic; injury recovery cannot clear permanent injuries or silently cure unrelated combat statuses.
- Incapacitation, permanent injuries, casualty equipment and survivor restoration resolve once. Fatality restrictions and Surgeon exceptions have explicit fixtures.
- Existing saves remain loadable with no inferred wounds. Compatibility of active battles is versioned, with documented behavior rather than altered random outcomes by accident.
- Browser checks cover sticky roster badges, small screens, wound hints, treatment quotes and post-combat summaries. Wounds never become a new contract lock.

This research is ready to guide a temporary-injury implementation PR. Permanent casualty survival should follow in a separate PR because it changes roster ownership, equipment recovery and defeat handling.
