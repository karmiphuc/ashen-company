# Tactical AI and weapon skills

Version 0.37 adds automatic skills to every weapon family, including reactions, stuns and restricted area attacks. Skills use existing equipment stats, durability, ammunition and mastery discounts.

Version 0.38 makes matching weapon masteries reduce ordinary attacks and weapon skills by 1 AP, with a minimum of 1 AP. Overlapping masteries apply the discount once. The AI checks and spends the same discounted cost, including Spearwall and Riposte. The table and equipment details show base costs. Shieldwall, Knock Back, reloads, swaps, consumables and reaction costs are unchanged. Earlier battles without the weapon-skills marker keep their original costs.

Version 0.39 gives enemies below 25 morale (Breaking) one 50% flee roll per turn. Success replaces their actions with movement toward an edge, respecting terrain, occupied hexes and mount control. Leaving an adjacent opponent's reach offers that opponent an opportunity strike before the move: no AP, 5 fatigue, normal accuracy and basic damage, no counter chain. Adjacent ranged fighters use a basic unarmed strike. A kill stops flight; Spearwall can also intercept the destination. Escaped enemies disappear without granting kill XP or dropping their equipment. The roll and fleeing state persist through saves. Earlier battles without the weapon-skills marker retain their original behavior.

Crossbows retain independent active/reserve loading states, even for two identical items. The AI draws a loaded reserve crossbow before reloading if ammunition, fatigue, target range and AP permit a swap plus a shot. Quick Hands or Crossbow Mastery allow two shots within a normal nine-AP turn; two unmastered shots plus a paid swap cost ten AP. When both are unloaded, reload affects only the currently wielded crossbow. Swapping never reloads a weapon.

## Company and personal orders

Company tactics still govern the overall advance, formation and focus target. Each brother has an equipment-derived Auto role that can be overridden with Frontliner, Skirmisher, Ranged or Flanker, and a Balanced, Damage or Control skill preference. Drawing a backup weapon does not change the role chosen at deployment.

The AI compares affordable actions using expected damage, kill probability, incoming danger, protection, positioning and resource costs. It keeps useful targets rather than changing them for small gains. Ranged fighters prefer spacing; flankers favor opportunities to surround; company formations constrain movement. These are automatic preferences, not guarantees of victory.

## Adaptive enemy commands

New battles carry `enemyAdaptiveRulesVersion: 1` and a saved enemy command. The opening command retains the existing ranged-contingent choice. At each new round, the enemy checks current opposing fire, the last incoming ranged attack (including misses), live shooters and their ammunition/range, surviving shields and melee contact. Deep archers count as available troops but cannot justify holding a frontline they cannot support. Enemies favor Shield-wall advance when shielded infantry are being outranged, Skirmish when their ranged troops need to step up, Defense when at least three shooters can counterfire, and Offense when support is spent or infantry are engaged.

Every committed command holds for at least **five full battle rounds**, including the opening command; the earliest first change is round 6. This uses complete rounds, not individual AP actions or unit activations. Evaluation runs at most once per round through battle advancement. Rendering and attack scoring only read the committed command and never change tactics or consume random rolls. The displayed enemy intent names the actual command and its remaining change cooldown; each change is logged once. State and cooldown persist through saves and instant resolution.

Shield-wall infantry pay the normal 4 AP and shield fatigue to raise working shields, then advance at most one hex per round while protected. They can still fight opponents in reach. When the next terrain step and shield stance cannot both fit their AP/fatigue budget, they prioritize progress rather than repeatedly raising shields without moving. Deep ranged fighters seek firing positions instead of holding behind unreachable targets. Skirmishing uses the same legal firing sorties, return-to-shelter behavior and cover checks as the company, oriented to the enemy's side. Enemy movements and pending returns do not alter company formation plans, and changing company orders does not cancel enemy returns.

Already-active battles without the adaptive marker keep their previous live ranged-count policy or legacy offense. New save fields, command values and round bounds are validated; enemy pending returns require an adaptive Skirmish command. No change to enemy equipment, races, ammunition budgets or terrain passability is introduced.

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

Mount skills are enabled by `mountSkillsVersion: 1` on new battles. Earlier active battles preserve their saved combat behavior. Horse Charge costs a fixed 6 AP, unaffected by weapon mastery, and normal attack fatigue plus each actual movement step's fatigue. It needs 2-3 empty gap hexes in one axial direction, stops adjacent to its target, and checks occupancy, trees, height changes and mount control. Spearwall checks every step and can stop the charge before the attack; the committed 6 AP are still spent. AI charges only under Offense or Thin them out, with a melee weapon, a non-ranged role and no adjacent threat. A landed normal attack always stuns a surviving target, even through existing stun protection, and pushes it one hex straight backward only if legal. A blocked push does not cancel damage or stun.

Wolf and warg mounts bite once after a rider attack, including a miss or multi-target skill, provided the rider survives and an adjacent enemy survives. Bites use their own 12-20 base damage and 40% armor penetration, ordinary hit/armor/morale rules and applicable rider bonuses. They cost no AP, fatigue or ammo and never follow reactions, stances or movement. Kill rewards use the rider's normal perks and current-turn Berserk limit. Mounted area attacks conservatively avoid friendly-fire exceptions because mount abilities add safe attack sequences outside the basic-attack estimator. Combat events preserve charge movement, pushes and bite reaction feedback across saves.

Use fixed battles to check ranged spacing, ranged-to-melee fallback, shield protection and expiry, legal pushes, short action sequences, ammo, mastery fatigue, free-action limits and formation bounds. Save and reload between actions, compare animated stepping with instant resolution, and reject malformed roles, preferences and skill state. AI evaluation must not consume battle randomness or inspect future rolls.

Design reference: [Battle Brothers developer explanation of utility AI](https://battlebrothersgame.com/dev-blog-27-ai-battle-brothers-part-1/). The scoring, roles and automatic company rules here are Ashen Company adaptations.

Weapon references: the developer's [combat mechanics](https://battlebrothersgame.com/tactical-combat-mechanics/), [longaxe and hammer discussion](https://battlebrothersgame.com/new-weapons/) and [new weapon variants](https://battlebrothersgame.com/dev-blog-101-new-weapons/). The simplified automatic skills and numerical bonuses above are this game's adaptations.

### Night conditions

The world clock shows evening from 18:00, night from 20:00 until 06:00, and dawn until 08:00. Evening and dawn apply a light blue tint; night adds a darker blue gradient over the world map and battlefield only. A banner names the phase and night penalties.

Night multiplies company travel speed by 0.8 after terrain, road, mount and cart modifiers. A new battle captures its starting lighting and preserves it through saves. At night, ordinary ranged attack hit chances lose 40 percentage points and melee attack chances lose 10, equally for company, allies and enemies. These reductions apply after the normal chance calculation, keeping the existing 12–90% bounds; AI attack predictions use the same chance calculation. Older saved battles without lighting retain their existing accuracy rules.


## Role consistency review — v0.50.19

Astra reviewed every defined role against movement, weapon selection, target commitment, commands, skill legality and fatigue budgets. The review reproduced two alternating-action loops: loaded skirmishers repeatedly traded throwing weapons for shield sets, while reach-weapon flankers/breakers discarded an already-reached target and alternated pursuit. Both paths now keep a useful commitment. Lunge follows formation and focus orders, and unaffordable actions cannot suppress legal alternatives during target-priority filtering.

| Role | Consistent duty |
| --- | --- |
| Auto | Resolve once from the full weapon, reserve, armor and mount loadout; temporary swaps preserve the resolved role. Applies to company, allies and enemies. |
| Frontliner | Engage the practical front and obey the commanded formation/shield line. |
| Skirmisher | Prefer nearby frontline targets with loaded throwing weapons; draw an existing melee backup when adjacent or depleted without alternating shield readiness and throwing readiness. |
| Ranged | Prefer easy or finishing targets, keep distance, and seek directional tree/palisade/shield cover. When a shot is already available, optional cover must leave an affordable legal shot, including the extra AP for Aimed Shot. Distant-threat shelter and emergency melee escape remain possible. |
| Flanker | Prefer ranged/reach targets and safe approaches; keep an equally useful arrived target. Lunge cannot dive beside an additional enemy or ignore a formation/focus command. |
| Breaker | Use an affordable safe cavalry charge under offensive orders, then pursue exposed targets with the same stable commitment. |

Movement, reforming, firing sorties, return paths, charges and fatigue-consuming reactions now share the reduced fatigue capacity imposed by Daze. NPCs may use their existing backup equipment; the change does not manufacture new loadouts. Allies keep their independent offensive orders, while enemies keep their saved adaptive command.

New battles carry `roleConsistencyVersion: 1`; an already-active battle without it retains its previous decision policy. The marker and resolved roles survive validated saves. Regressions exercise the reproduced loops, every explicit role's movement budget, focused skills, NPC backup swaps, allied role resolution, cover/shot budgets and legacy behavior. Existing formation, cover, breaker, skirmish, weapon-skill and step/reload-versus-instant tests also remain in use.

## Ranged attacks while engaged

New battles use `rangedEngagementVersion: 1`. Every ranged weapon (bows, crossbows, slings, throwing bundles and named variants) requires Point Blank to target an adjacent enemy. The perk also removes the existing close-shot accuracy penalty. Without it, the AI must create space, use a melee backup or choose another legal action; it cannot spend ammunition on an adjacent shot.

A ranged attack or skill against a non-adjacent target provokes one opportunity strike from each of up to two eligible adjacent opponents, regardless of Point Blank. Eligibility follows reaction readiness: alive, not stunned/disarmed and able to spend five fatigue. Highest initiative reacts first, with stable ID tie-breaking; no extra random selection is consumed. Each opponent makes a single basic melee strike (unarmed if holding a ranged weapon), spending reaction fatigue but no AP or ammunition. Reactions cannot chain. They happen before the shot; death or incapacitation interrupts firing without spending its ammunition. A surviving shooter pays the normal AP/fatigue/ammunition cost.

The AI considers this exposure when choosing shots. Reaction damage and callouts remain in the action event and survive reload. Adjacent shots permitted by Point Blank do not trigger this distant-shot rule. Saved battles without the new marker retain their previous rules, including historical two-AP combat.
