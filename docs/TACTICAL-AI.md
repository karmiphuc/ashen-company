# Tactical AI and weapon skills

Version 0.37 adds automatic skills to every weapon family, including reactions, stuns and restricted area attacks. Skills use existing equipment stats, durability, ammunition and mastery discounts.

Version 0.38 makes matching weapon masteries reduce ordinary attacks and weapon skills by 1 AP, with a minimum of 1 AP. Overlapping masteries apply the discount once. The AI checks and spends the same discounted cost, including Spearwall and Riposte. The table and equipment details show base costs. Shieldwall, Knock Back, reloads, swaps, consumables and reaction costs are unchanged. Earlier battles without the weapon-skills marker keep their original costs.

## Company and personal orders

Company tactics still govern the overall advance, formation and focus target. Each brother has an equipment-derived Auto role that can be overridden with Frontliner, Skirmisher, Ranged or Flanker, and a Balanced, Damage or Control skill preference. Drawing a backup weapon does not change the role chosen at deployment.

The AI compares affordable actions using expected damage, kill probability, incoming danger, protection, positioning and resource costs. It keeps useful targets rather than changing them for small gains. Ranged fighters prefer spacing; flankers favor opportunities to surround; company formations constrain movement. These are automatic preferences, not guarantees of victory.

## New battle rules

Version 0.36 keeps a reachable pursuit target across movement steps and save reloads. Without a valid target, fighters choose the nearest reachable route; dead or blocked targets release the commitment. Melee fighters deal with adjacent enemies before farther targets, including with reach weapons. Shield Wall reformation does not pull a melee fighter away from an enemy already in reach. Under Offense, the Shieldwall skill is available only with at least two adjacent enemies; it remains an automatic choice rather than a mandatory action.

New battles use 9 AP per turn and `weaponSkillsVersion: 1`. Old active battles without that marker retain their previous skills, positions and progress, whether they use two or nine AP. Settings default to Auto and Balanced when loading an older company.

| Action | AP | Notes |
| --- | --- | --- |
| Quick Shot | 4 | Normal bow shot and weapon fatigue. |
| Aimed Shot | 7 | +15 hit chance, +1 range; 15 fatigue before mastery. |
| Shieldwall | 4 | 20 fatigue; double the working shield defense until the owner's next turn or gear change. |
| Knock Back | 4 | 20 fatigue; attempt a push into a free adjacent hex, no damage. Trees, occupied hexes and excessive height changes block the push. |
| Spearwall | 4 | 30 fatigue; intercept an enemy entering an adjacent hex. A hit stops movement; a miss ends the wall. |
| Riposte | 4 | 25 fatigue; counter missed adjacent melee attacks. |
| Split / Swing | 6 | Two-handed swords: 25 fatigue for two consecutive hexes; 30 for three adjacent hexes at 80% damage. |
| Knock Out | 4 / 6 | Maces: 25 fatigue, half damage; a hit stuns. Two-handed weapons cost 6 AP. |
| Puncture | 4 | Daggers: 20 fatigue, -15 hit; body-only damage bypasses armor without damaging it. |
| Deathblow | 3 | Qatal: 10 fatigue; +50% damage against stunned targets. |
| Split Shield | 4 / 6 | Axes: 18 fatigue; extra wear against a working shield. |
| Crush Armor | 4 / 6 | Hammers: 18 fatigue; +50% armor damage. |
| Decapitate | 4 / 6 | Cleavers: 18 fatigue; +40% damage against injured targets. |
| Lash | 4 / 6 | Flails: 18 fatigue, -10 hit; head strike bypasses shield defense. |
| Hook | 6 | Polearms: 20 fatigue; pull the target toward the attacker if the destination is legal. |
| Power Throw | 4 | Throwing weapons: 18 fatigue, +25% damage; consumes one bundle charge. |
| Piercing Bolt | 3 | Crossbows: 16 fatigue; +20 armor penetration points, then reload. |
| Whip Crack | 4 | Whips: 16 fatigue, -10 hit; head strike bypasses shield defense. |
| Stunning Stone | 4 | Slings: 18 fatigue, -10 hit, half damage; a hit stuns. |
| Basic dagger / Qatal attack | 3 | Existing damage and fatigue. |
| Basic one-handed/throwing attack | 4 | Existing damage, perks and ammo. |
| Two-handed/reach melee attack | 6 | Existing damage, perks and fatigue. |
| Crossbow shot / reload | 3 / 4 | Ammo spent only on a shot. |
| Open-ground movement | 2 per hex | Rough terrain and uphill movement cost more. |
| Weapon swap / consumable | 4 | Quick Hands and Combat Bandaging retain their free first use each round. |
| Recover | 9 | Recover 22 fatigue, or the stronger Recover perk effect. |

Passive fatigue recovery is 15 per turn. Berserk grants 4 AP once per round after a kill in nine-AP battles; legacy two-AP battles retain their 2 AP effect. These AP must pay for actual actions. Throwing bundles retain their separate counts and paid refills. Mounts add 2 movement and 4 initiative in battle while terrain continues to affect routes. Shield durability, morale, masteries and named equipment remain in effect.

Reactions cost 5 fatigue each and cannot trigger another reaction. Spearwall and Riposte expire at the owner's next turn, on incompatible gear changes or forced movement. A stun skips one turn; the victim cannot be stunned again until it takes a normal turn. Status indicators, skill names, secondary impacts and reaction animations show what happened without changing the battle result.

A Berserk kill during a reaction stores its 4 AP for the fighter's next activation instead of losing them when the turn starts. This pending reward survives saving and remains subject to Berserk's round limit.

The AI rejects unaffordable and redundant skills, compares damage and control benefits, and preserves ranged spacing and committed pursuit targets. Named and fantasy weapons inherit the skills of their underlying weapon family. A stronger item does not unlock an unrelated skill.

Area attacks avoid allies by default. An exception requires an enemy kill probability of at least 90%, proof that no affordable safe sequence can reach that confidence, and guaranteed allied survival under maximum damage, including head hits. Missing proof rejects the attack. The safe-alternative check deliberately overestimates what safe attacks could achieve, so it may reject borderline exceptions. It never uses future random rolls. Qualifying exceptions are ranked by expected allied health damage, then armor damage, and explained in the combat log.

## Verification

Use fixed battles to check ranged spacing, ranged-to-melee fallback, shield protection and expiry, legal pushes, short action sequences, ammo, mastery fatigue, free-action limits and formation bounds. Save and reload between actions, compare animated stepping with instant resolution, and reject malformed roles, preferences and skill state. AI evaluation must not consume battle randomness or inspect future rolls.

Design reference: [Battle Brothers developer explanation of utility AI](https://battlebrothersgame.com/dev-blog-27-ai-battle-brothers-part-1/). The scoring, roles and automatic company rules here are Ashen Company adaptations.

Weapon references: the developer's [combat mechanics](https://battlebrothersgame.com/tactical-combat-mechanics/), [longaxe and hammer discussion](https://battlebrothersgame.com/new-weapons/) and [new weapon variants](https://battlebrothersgame.com/dev-blog-101-new-weapons/). The simplified automatic skills and numerical bonuses above are this game's adaptations.
