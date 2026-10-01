# Tactical AI and the first weapon skills

This update introduces automatic roles and bow/shield skills. Spearwall, Riposte, stuns, dagger skills and area attacks remain future work.

## Company and personal orders

Company tactics still govern the overall advance, formation and focus target. Each brother has an equipment-derived Auto role that can be overridden with Frontliner, Skirmisher, Ranged or Flanker, and a Balanced, Damage or Control skill preference. Drawing a backup weapon does not change the role chosen at deployment.

The AI compares affordable actions using expected damage, kill probability, incoming danger, protection, positioning and resource costs. It keeps useful targets rather than changing them for small gains. Ranged fighters prefer spacing; flankers favor opportunities to surround; company formations constrain movement. These are automatic preferences, not guarantees of victory.

## New battle rules

New battles use 9 AP per turn. Old active battles retain their previous 2-AP rules, positions and progress. Settings default to Auto and Balanced when loading an older company.

| Action | AP | Notes |
| --- | --- | --- |
| Quick Shot | 4 | Normal bow shot and weapon fatigue. |
| Aimed Shot | 7 | +15 hit chance, +1 range; 15 fatigue before mastery. |
| Shieldwall | 4 | 20 fatigue; double the working shield defense until the owner's next turn or gear change. |
| Knock Back | 4 | 20 fatigue; attempt a push into a free adjacent hex, no damage. Trees, occupied hexes and excessive height changes block the push. |
| Basic one-handed/throwing attack | 4 | Existing damage, perks and ammo. |
| Two-handed/reach melee attack | 6 | Existing damage, perks and fatigue. |
| Crossbow shot / reload | 3 / 4 | Ammo spent only on a shot. |
| Open-ground movement | 2 per hex | Rough terrain and uphill movement cost more. |
| Weapon swap / consumable | 4 | Quick Hands and Combat Bandaging retain their free first use each round. |
| Recover | 9 | Recover 22 fatigue, or the stronger Recover perk effect. |

Passive fatigue recovery is 15 per turn. Berserk grants 2 AP once per round after a kill; these AP must pay for actual actions. Throwing bundles retain their separate counts and paid refills. Shield durability, mounts, terrain, morale, masteries and named equipment remain in effect.

## Verification

Use fixed battles to check ranged spacing, ranged-to-melee fallback, shield protection and expiry, legal pushes, short action sequences, ammo, mastery fatigue, free-action limits and formation bounds. Save and reload between actions, compare animated stepping with instant resolution, and reject malformed roles, preferences and skill state. AI evaluation must not consume battle randomness or inspect future rolls.

Design reference: [Battle Brothers developer explanation of utility AI](https://battlebrothersgame.com/dev-blog-27-ai-battle-brothers-part-1/). The scoring, roles and automatic company rules here are Ashen Company adaptations.
