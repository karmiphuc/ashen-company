# Prefix rewards after learning a perk

A free-perk prefix grants its ordinary perk while worn. If the brother has also
spent a perk point learning that **same** perk, the grant activates one enhanced
version instead. This keeps gear rewarding at the level-30 cap without granting
another perk point or doubling the ordinary perk. No benefit stacks from duplicate
items. Reserve weapons and pockets are inactive; broken shields grant nothing.

| Granted perk | Benefit when learned and granted by worn gear |
| --- | --- |
| Sword, Axe, Mace, Spear, Throwing, Bow, Crossbow mastery | Matching weapon skills gain **−1 AP**. Attack fatigue reduction remains 25%. |
| Dagger mastery | **+10 hit chance** with matching daggers. Its existing −1 AP and 25% fatigue relief remain. |
| Polearm mastery | Matching weapon skills gain **another −1 AP** on top of base mastery (standard 6 AP Strike becomes 4 AP). Attack fatigue reduction remains 25%. |
| Pathfinder | Movement fatigue reduction becomes **75%**, from 50%, after terrain relief; rounded up per step. |
| Fleet Footed | Light armor movement bonus becomes **+2 points**, from +1, including initial movement credit. |
| Recover | Removes **75%** of current fatigue, from 50%; minimum relief remains 22 and the action still ends the turn. |
| Relentless | Equipment initiative fatigue penalty becomes **25%** of normal, from 50%; current combat fatigue's Dodge penalty becomes 0.05 per fatigue instead of 0.1. Attachment penalties retain their existing rules. |
| Steel Brow | Keeps head-crit immunity and reduces head-hit health damage by **10%**. Body hits are unchanged. |
| Shield Expert | Shield defense multiplier becomes **1.4**, from 1.25, for melee and ranged defense. Shield wear becomes **40%**, from 50%, rounded up with minimum 1. Maximum durability is unchanged. |
| Backstabber | Its additional surrounding bonus becomes **+8** hit chance per other adjacent ally, from +5; stacks with the ordinary surrounding bonus. |
| Anticipation | Defense scaling becomes **15%** per distance tile, from 10%, with minimum 15 instead of 10. Prescient's separate +5 percentage points still apply. |
| Combat Bandaging | Healing supplies restore **25% more** health, rounded up and capped at maximum HP. First use remains free and supplies are consumed. Injuries and armor are unchanged. |
| Quick Hands | First swap remains free; later swaps cost **2 AP**, from 4. Applies to set changes and pocket draws/stows. Cost is captured before changing equipment. |
| Layered Armor | Reduces body armor damage by **10%** while either attachment retains positive protection. Head armor is unchanged; no extra slot is added. |

## Mastery guardrails

- Weapon family matching still applies. An unrelated mastery grants no discount.
- Dagger keeps its existing −1 AP and gains hit chance instead. Polearm gains
  another −1 AP, for a total −2 AP reduction on eligible skills.
- Riposte stays **2 AP**. Warbrand/Romphaia Split and Swing stay **5 AP**.
- Shield skills, reloads, opportunity strikes and mount Charge retain their costs.
- Multiple applicable masteries or grants apply the reduction once. Minimum paid
  attack cost is 1 AP.
- Heavy Weapon Specialist stacks multiplicatively with fatigue reduction, with a
  single final rounding: `ceil(base fatigue × 0.75 × 0.90)`.

## Persistence and presentation

Enhancements derive from the existing equipment-perk bit flags and learned perk
IDs. Old named items benefit without changing their identities, prefix chances,
rolls, forge families, two-prefix/two-suffix limits or transfer recipes. Forging
preserves the grant, and it activates on a matching recipient/loadout. Learning a
perk takes effect immediately even if the worn-item cache is already populated.

Item inspection and forge effect rows state both the grant and the conditional
learned benefit. Weapon inspection labels base costs and explains discounts.

New battles and every unit carry `prefixPerkRulesVersion: 1`. Active saves without
that marker retain their previous combat behavior until the battle ends. Validation
rejects unknown versions or mismatched unit/battle markers. Both turn-based and
realtime modes use the same costs and eligibility; the company sheet uses current
rules outside combat.

Behavioral coverage is in `tests/learned-prefix-perks.test.js`, including all nine
masteries, exact damage/defense/resource changes, duplicate grants, live learning,
forge transfer, swap eligibility/cost removal, legacy saves and both combat modes.
