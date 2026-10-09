# Mastery and heavy-weapon perk balance

New battles carry `perkBalanceVersion: 1`. Existing active battles without this
marker retain their earlier mastery AP discounts, broad Polearm matching, flat
Reach Advantage defense, Duelist damage and movement fatigue. Each combat unit
carries the same marker so shared fatigue and AI affordability helpers can use
consistent rules, including simulated pathfinding copies. Save validation checks
that unit and battle markers agree. This is a combat rule version, not a release
version or a reason to reroll gear.

## Approved scope

Eight masteries (Sword, Axe, Mace, Spear, Polearm, Throwing, Bow and Crossbow),
Pathfinder, Reach Advantage and Duelist change. Dagger Mastery and Battle Forged
remain unchanged. Heavy Weapon Specialist is a new selectable level-5 weapon
perk. Existing perks keep their IDs, learned points and equipment grants.

### Mastery costs and identities

- All matching masteries retain 25% attack fatigue reduction, rounded up once.
  Learned and equipment-granted copies never stack that discount twice.
- Only Dagger and true Polearm Mastery reduce matching weapon skill AP by 1.
  Dagger retains the existing 3-to-2 AP basic stab.
- Polearm Mastery covers genuine polearms and ordinary pikes, excluding longaxes,
  polehammers, polemaces, whips and Spetums. Those weapons retain their own family
  mastery for fatigue and close-range accuracy. Polearm's existing 10% damage
  bonus remains.
- Riposte stays 2 AP. Warbrand/Romphaia Split and Swing stay 5 AP, including with
  mastery; those deliberately reduced skills receive no further AP discount.
- Sword retains its +8 hit and improved Gash injury threshold. Its grouped cleaver
  weapons now inflict double their normal skill bleeding on qualifying wounds.
- Axe retains +15% armor damage and gains +50% Split Shield durability damage.
  The AI predicts the same shield damage that execution applies.
- Mace retains +10% health damage. Dedicated mace stun skills already guarantee
  stun on an eligible successful hit, including without mastery, so they remain
  stronger than an unlock requirement. Hammers/flails do not gain generic stun.
- Spear retains +8 hit. A missed Spearwall interception no longer ends the stance
  with Spear Mastery. Duration, fatigue limits and successful blocking remain.
- Throwing retains +8 hit and gains +40% damage within two hexes, +20% at three,
  and no distance damage bonus farther away. Adjacent throws still require Point
  Blank and provoke the existing opportunity strikes.
- Bow retains +1 range; Aimed Shot remains 7 AP. Crossbow retains +20 percentage
  points penetration. Reload remains 4 AP and has no fatigue cost, already better
  than OG's fatigue cost; mastery does not make reload free or cheaper in AP.

These are OG-aligned corrections with existing Ashen Company bonuses preserved,
not a wholesale replacement of grouped masteries by vanilla's separate perks.
Vanilla references: [perk scripts](https://github.com/ninkjin/Battle-Brothers-Scripts/tree/main/scripts/skills/perks),
[active skills](https://github.com/ninkjin/Battle-Brothers-Scripts/tree/main/scripts/skills/actives),
and the [perk reference](https://battlebrothers.fandom.com/wiki/Perks).

### Heavy Weapon Specialist

Qualifying gear must be a two-handed melee weapon whose own item range is 1.
Weapons with native range greater than 1 never qualify, even against an adjacent
target. The perk grants:

- +10 **percentage points** of armor penetration, capped by the usual 100% limit.
- 10% less weapon attack fatigue.
- 5% more damage on actual area skills, including each hit when other targets miss.

Mastery and specialist fatigue multiply: `ceil(base * 0.75 * 0.90)`, a 32.5%
combined reduction before rounding. Named skill-fatigue adjustments enter the
base first. Ordinary attack armor damage receives no specialist damage bonus.
Reaction strikes retain their existing fixed 5 fatigue. Movement, stance skills,
mount bites and bleeding do not gain the specialist damage bonuses. AP is unchanged.
The perk reuses credited Legends artwork, bundled for offline play.

### Reach Advantage

Successful two-handed melee weapon hits grant one stack, up to five, worth +5
melee defense each. Each successful area target counts separately. Misses,
bleeding, mount bites, non-damaging skills and shield destruction do not count;
Split Man's secondary body-part damage does not count as another hit.

Stacks expire at the actor's next turn, including a stunned turn. Realtime combat
clears stacks when AP refreshes for the new cycle. Switching away from a two-handed
melee weapon clears them. Company-sheet defense does not include unearned stacks.
A compact shield-plus status icon exposes the current stack count and defense
through its tooltip and accessible label. Earned stacks survive save/load.

### Pathfinder and Duelist

Pathfinder keeps Ashen's terrain/climb relief (rough or uphill movement drops from
4 to 2 AP), and additionally halves movement fatigue **after that relief**,
rounding up per step. It also halves open-ground movement fatigue. Marathoner
stacks before rounding: open ground costs 1 fatigue with both perks versus 3
without either. Mounted travel in combat uses the same fatigue calculation while
retaining the existing mounted AP costs. Blocked terrain and mount control stay
impassable.

Duelist replaces its base 12% damage multiplier with +25 percentage points of
armor penetration for one-handed melee weapons with an empty offhand, broken
shield or buckler. Full shields, two-handed weapons and ranged weapons are
excluded. Named `duelistPct` damage enhancements still apply when eligible;
penetration does not increase damage against an unarmored target by itself.

## Verification

Behavior tests cover cost boundaries, actual fatigue spending, mastery overlap
and equipment grants; specialist penetration, area hits/misses and exclusions;
Reach stacking, hit defense, both combat resets and save validation; shield
breaking, Spearwall misses, cleaver bleeding, throwing distance, Pathfinder
stacking, intentional skill costs and legacy battle behavior. Existing combat,
injury, forge, tactical-role, realtime and perk UI suites run alongside them.
