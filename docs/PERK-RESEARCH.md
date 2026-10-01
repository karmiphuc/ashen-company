# Perk research for Ashen Company

This is a bounded survey of Battle Brothers' current vanilla perk pool, its DLC-era changes, and two large perk overhauls. It is not an inventory of every community mod. The intended game design is one selectable perk on every character level-up. The 19 implemented perks below favor a small, direct combat modifier or a single conditional trigger.

## Source indexes and scope

- [Current vanilla perk list and descriptions](https://battlebrothers.fandom.com/wiki/Perks) (community reference; 50 perks across seven rows). [Official Update 1.4 notes](https://battlebrothersgame.com/update-1-4/) confirm DLC-era changes to existing perks including Fast Adaptation, Brawny, Nine Lives, Head Hunter, Fearsome, and Sword Mastery. The paid expansions add weapons and rules that some masteries cover; I did not find a separate DLC-only player perk tree in the official notes or current vanilla list.
- [Legends author source](https://github.com/Battle-Brothers-Legends/Legends-public/tree/development/mod_legends/config) organizes a much larger pool into class, defense, enemy, trait, and weapon perk trees. Its [changelog](https://github.com/Battle-Brothers-Legends/Legends-public/blob/development/Changelog.md) is needed alongside old wiki descriptions because effects change or are removed. For example, current notes say Lookout moved from a perk to a profession and Ballistics no longer reduces distance hit penalties.
- [Reforged author source](https://github.com/Battle-Modders/mod-reforged/tree/development/scripts/skills/perks) is a browseable full code index. The authors [describe over 100 new perks and character-specific groups](https://reforged.enduriel.com/docs/dev-diaries-folder/dev-diary-3-dynamic-perk-trees/). The group overview is a good map; code is the precise source for individual effects.
- [Bullseye enhancement mod author page](https://www.nexusmods.com/battlebrothers/mods/1146) provides a compact example of modded ranged effects: +2 vision, +1% hit chance per tile, cover redirect penalty reduced from 75% to about 33%, and +2 AP after a kill once per turn.

## Complete vanilla perk-name index

| Row | Perks |
| --- | --- |
| 1 | Fast Adaptation; Crippling Strikes; Colossus; Nine Lives; Bags and Belts; Pathfinder; Adrenaline; Recover; Student |
| 2 | Executioner; Bullseye; Dodge; Fortified Mind; Resilient; Steel Brow; Quick Hands; Gifted |
| 3 | Backstabber; Anticipation; Shield Expert; Brawny; Relentless; Rotation; Rally the Troops; Taunt |
| 4 | Mace, Flail, Hammer, Axe, Cleaver, Sword, Dagger, Polearm, Spear, Crossbow and Firearms, Bow, and Throwing Mastery |
| 5 | Reach Advantage; Overwhelm; Lone Wolf; Underdog; Footwork |
| 6 | Berserk; Head Hunter; Nimble; Battle Forged |
| 7 | Fearsome; Duelist; Killing Frenzy; Indomitable |

Vanilla grants one perk point per new level through level 11, for ten ordinary points, and restricts later rows by points already spent. Ashen Company's requested every-level schedule intentionally differs. [Vanilla source](https://battlebrothers.fandom.com/wiki/Perks).

## First implementation set

These 19 implemented perks use names familiar to Battle Brothers players. The source behavior is distinguished from the implemented Ashen Company adaptation so UI text can be honest. The chooser lists the exact local effects below. Unlocks use character level, and one point is earned at every level from 2 through 20. Student has no point refund in this economy.

| Perk | Original behavior | Straightforward adaptation |
| --- | --- | --- |
| Colossus | +25% maximum HP | Gain 25% maximum health. Unlocks at level 2. |
| Fortified Mind | +25% Resolve | Gain 25% resolve and take 20% less morale damage. Unlocks at level 3. |
| Brawny | Armor and helmet Fatigue/Initiative penalties reduced 30% | Reduce armor and helmet fatigue penalties by 30%. Unlocks at level 4. |
| Shield Expert | +25% shield defense; shield damage halved; Knock Back bonus | Gain 25% more melee and ranged defense from shields. Unlocks at level 4. |
| Steel Brow | Head hits lose critical damage | Head hits no longer deal extra health damage. Unlocks at level 3. |
| Bullseye | Obstructed ranged shot redirect chance changes from 75% to 50% | Ignore ranged accuracy penalties from trees and brush. Height still applies. Unlocks at level 3. |
| Bow Mastery | Bow maximum range +1; vision +1; lower Fatigue cost | Gain +1 range with bows and reduce their attack fatigue by 25%. Unlocks at level 5. |
| Crossbow and Firearms Mastery | Fatigue reduction; crossbow armor penetration; firearm reload reduction | Crossbow attacks gain +20 percentage points of armor penetration and cost 25% less fatigue. Unlocks at level 5. |
| Pathfinder | Lower movement AP and Fatigue costs on difficult ground | Reduce rough terrain and uphill movement costs by 1, to a minimum of 1. Unlocks at level 2. |
| Fast Adaptation | Stacking +10% hit chance after each miss, reset on hit | Gain +10 hit chance after each consecutive miss. The bonus resets on a hit. Unlocks at level 2. |
| Executioner | +20% damage to an injured target | Deal 20% more damage to a target below full health. Unlocks at level 3. |
| Berserk | Refund 4 AP on kill, at most once each turn | After a kill, gain 4 AP in new battles or 2 AP in older active battles, once per round. Unlocks at level 7. |
| Killing Frenzy | +25% damage for two turns after a kill; refreshes | After a kill, deal 25% more damage through the next 2 rounds. Unlocks at level 8. |
| Dodge | Defense equals 15% of current Initiative | Gain 15% of current initiative as melee and ranged defense. Unlocks at level 3. |
| Student | +20% battle XP, with perk-point refund at level 11 | Gain 20% more experience from battle. Unlocks at level 2. |
| Backstabber | +10% melee hit chance per surrounding ally, where surround applies | Gain +5 melee hit chance for each other ally adjacent to the target. Unlocks at level 4. |
| Recover | An active skill that consumes the turn and removes 50% of accumulated Fatigue | When catching your breath, recover at least 22 fatigue and otherwise halve current fatigue. Unlocks at level 2. |
| Anticipation | Extra ranged defense grows with base ranged defense and attacker distance, minimum +10 | Gain 10% of base ranged defense per tile of distance, with a minimum +10. Unlocks at level 4. |
| Fearsome | Health-damaging attacks force a morale check, with penalty based on the attacker's Resolve | Health damage from a hit inflicts 10 additional morale damage. Unlocks at level 8. |

The vanilla numbers and conditions above come from the [current perk reference](https://battlebrothers.fandom.com/wiki/Perks); the [official 1.4 notes](https://battlebrothersgame.com/update-1-4/) corroborate the updated values for Fast Adaptation and Brawny. For Bullseye, the 75% to 50% is an obstruction redirect roll, not a flat 25-point hit chance bonus; the [focused Bullseye entry](https://battlebrothers.fandom.com/wiki/Bullseye) explains that distinction.

## Later simple candidates from mods

These are additional small effects worth considering after the first set, with their mod origin kept visible.

| Source | Candidate | Source behavior or usable slice |
| --- | --- | --- |
| [Bullseye enhancement author](https://www.nexusmods.com/battlebrothers/mods/1146) | Hawkeye | +2 vision. |
| Same author | Long Shot | +1% ranged hit chance for each tile of distance. |
| Same author | Quick Kill | +2 AP on kill once per turn. |
| [Legends changelog](https://github.com/Battle-Brothers-Legends/Legends-public/blob/development/Changelog.md) | Wind Reader | Reduces ranged hit penalty per traveled tile by 2%; current Ballistics instead adds 2 damage per tile. |
| Same changelog | Hammer the Gap | Stacking +5% hit chance when attacking the same tile, capped at 10%. |
| Same changelog | Prepared | Crossbows and firearms in bags begin loaded; first-turn bombs and poisons cost zero AP. The loaded-weapon portion is the simple slice. |
| [Reforged author overview](https://reforged.enduriel.com/docs/dev-diaries-folder/dev-diary-3-dynamic-perk-trees/) | Entrenched | Ranged formation bonus; the [source perk](https://github.com/Battle-Modders/mod-reforged/blob/development/scripts/skills/perks/perk_rf_entrenched.nut) should fix exact current numbers before borrowing them. |
| Same overview | Fresh and Furious | Extra action economy while fresh; inspect [source perk](https://github.com/Battle-Modders/mod-reforged/blob/development/scripts/skills/perks/perk_rf_fresh_and_furious.nut) before adopting. |

Some attractive perks need combat systems beyond a direct modifier: Nine Lives needs a death intercept and effect cleanup; Nimble and Battle Forged depend on armor damage order; Overwhelm needs turn order and stacking debuffs; Head Hunter needs head-hit state; Reforged's Take Aim is an active skill with separate crossbow and firearm effects. They are out of the first implementation set.

## Icon source note

The [decompiled vanilla perk script index](https://github.com/ninkjin/Battle-Brothers-Scripts/tree/main/scripts/skills/perks) exposes each perk's `ui/perks/perk_NN.png` mapping. These script references do not provide the bitmap files. The pinned Legends source tree (`b014cdf8520e69b2383116d1654977e9dbb10d96`) contains its custom perk images but almost none of the base game's numbered perk bitmaps. Avoid attributing a custom Legends icon as a vanilla original.
