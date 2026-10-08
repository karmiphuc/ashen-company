# Backgrounds and talents — v0.47.6

The hiring roster grows from 18 to 28 backgrounds. Ordinary workers and hunters retain affordable fees, while veterans have distinct starting strengths, guaranteed potential in their main combat skill and higher wages. Recruits arrive without equipment; the hiring screen shows current stats, background bonuses, traits, talents and daily upkeep before purchase.

| Added background | Fee | Starting bonuses |
|---|---:|---|
| Militia | 200 | +5 melee skill, +3 melee defense, +3 resolve |
| Miner | 170 | +10 hitpoints, +7 maximum fatigue |
| Fisherman | 140 | +6 maximum fatigue, +2 melee defense |
| Poacher | 160 | +6 ranged skill, +5 initiative |
| Squire | 210 | +4 melee defense, +5 resolve, +3 maximum fatigue |
| Crossbowman | 700 | +12 ranged skill, +8 resolve, +3 ranged defense |
| Sellsword | 1,100 | +12 melee skill, +6 melee defense, +7 resolve, +5 maximum fatigue |
| Hedge Knight | 1,800 | +18 hitpoints, +14 maximum fatigue, +12 melee skill, +7 melee defense, +5 resolve |
| Swordmaster | 2,200 | +22 melee skill, +12 melee defense, +8 resolve |
| Assassin | 1,400 | +18 initiative, +10 melee skill, +7 melee defense |

Samurai is reworked from a 420-crown recruit into a 2,000-crown elite: +18 melee skill, +10 melee defense, +10 resolve, +8 maximum fatigue and +3 initiative. Every Samurai has at least two stars in melee skill and melee defense, plus resolve talent. Existing Samurai receive the improved background bonuses without another hiring fee. Their current health and equipment condition stay unchanged.

For backgrounds priced at least 700 crowns, daily upkeep adds `ceil(hiring fee / 200)` to the usual `5 + level − 1` crowns. A level-one Samurai costs 15 crowns and one food per day. Budget backgrounds retain their existing wage formula. Every offer pool still has at most one rare specialist, preserving affordable choices. Village workers, town trades and castle soldiers have appropriate ordinary background pools; rare specialists can travel to any settlement.

## Fixed attribute talents

Each brother has exactly three distinct talented attributes from the eight trainable attributes. Stars affect growth only; they do not add starting stats or award free levels.

| Stars | Level-up gain |
|---|---|
| None | Saved base roll, +1–5 |
| ★ | Base roll +1, maximum +5 |
| ★★ | Base roll +2, maximum +5 |
| ★★★ | Always +5 |

Talents are deterministic from the brother's seed and background, independent of town, day, gear and reloads. Ordinary rolls have a 50% / 35% / 15% distribution for one / two / three stars per chosen attribute. Veterans priced at least 700 crowns have at least two stars in their main attack skill. Samurai guarantees both melee skill and melee defense at that tier. Star icons and accessible tooltip descriptions appear in hiring, company stats and level-up choices. Resolve is now visible on the hiring board too.

The existing rule of choosing three different attributes per level remains. Earned level-up choices store their final boosted gains, and repeated save imports do not apply talent bonuses again. Saves reject unknown attributes, invalid star counts, malformed talent maps and forged pending rolls.

## Existing companies

Old brothers without talent data receive the same deterministic three talents on import. Pending old level-up rolls gain their talent bonuses once; already learned attributes remain unchanged. Old unspent training points generate equivalent boosted choices. Existing battles retain their recorded unit stats and combat state. Talents persist in reserve brothers and apply when they eventually earn experience.

Coverage includes all backgrounds and talent tiers, exact growth arithmetic, real battle XP and queued levels, hiring preview consistency, equipment changes, old save migration, old active battles, malformed saves, training, Colossus health rounding and the three UI surfaces.

## Specialist buffs — v0.47.6

| Background | Fee | Starting bonuses | Level-one wage |
|---|---:|---|---:|
| Ronin | 1,000 | +14 melee skill, +7 melee defense, +10 initiative, +6 maximum fatigue | 10 |
| Ninja | 1,200 | +14 ranged skill, +8 melee skill, +16 initiative, +6 ranged defense, +4 melee defense, +4 maximum fatigue | 11 |
| Warrior Monk | 900 | +14 resolve, +12 maximum fatigue, +6 melee defense, +8 melee skill | 10 |

Existing brothers receive the stronger background stats, with their fixed talents, learned attributes and current battle snapshots preserved. New specialist recruits have at least two stars in their primary attack skill under the existing veteran talent rule.
