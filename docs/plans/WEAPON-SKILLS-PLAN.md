# Weapon skills: core families first

**Status: Implemented in v0.37 — core families and additional family signatures**

Date: 2026-09-28

Implementation update: 2026-10-01. Version 0.37 completes the core families, reactions, stuns and restricted area attacks, and adds signatures for the remaining equipment families. Repairable shields were implemented in v0.33. Existing active battles retain their prior rules. This document preserves the agreed design; implementation details and additional family skills are recorded in [current tactical rules](../gameplay/TACTICAL-AI.md).

This document records the original agreed design. The full core scope covers spears, swords, maces, daggers, bows, and shields. The table is now implemented; further item-specific tuning remains future work.

## Summary

Give weapons distinct tactical actions, powered by **9 AP per turn**. Combat stays automatic; each brother gets a **Balanced / Damage / Control** preference alongside the existing company tactic. The initial skills introduce bracing, counterattacking, disabling enemies, bypassing armor, and fast versus accurate shots.

Weapon tiers share their family's skills. Better and famed weapons apply their existing stats to those skills. Battle Brothers is the reference for weapon identity; the numbers and automatic decision rules below are Ashen Company's planned adaptations. See the [Battle Brothers weapon reference](https://battlebrothers.fandom.com/wiki/Weapons).

## Skills and turn rules

| Equipment | Initial skills and behavior |
|---|---|
| One-handed spears | **Thrust:** normal attack, 4 AP. **Spearwall:** 4 AP, 30 fatigue; intercept enemies entering adjacent hexes. A hit stops that step; a miss breaks the wall. |
| One-handed swords | **Slash:** normal attack, 4 AP. **Riposte:** 4 AP, 25 fatigue; counter adjacent melee attacks that miss. |
| Two-handed swords | **Strike:** normal attack, 6 AP. **Split:** 6 AP, 25 fatigue; strike two consecutive hexes. **Swing:** 6 AP, 30 fatigue; strike three adjacent hexes at 80% damage each. |
| Maces | **Bash:** normal attack, 4 AP, or 6 for two-handed weapons. **Knock Out:** same AP, 25 fatigue; half damage and stun on a successful hit. |
| Ordinary daggers | **Stab:** normal attack, 3 AP. **Puncture:** 4 AP, 20 fatigue; -15 hit chance, body-only damage bypassing armor without damaging it. |
| Qatal dagger | **Stab:** 3 AP. **Deathblow:** 3 AP, 10 fatigue; +50% damage against a stunned target. |
| Bows | **Quick Shot:** normal shot, 4 AP. **Aimed Shot:** 7 AP, 15 fatigue; +15 hit chance and +1 range. |
| Shields | **Shieldwall:** 4 AP, 20 fatigue; double the shield's defense contribution. **Knock Back:** 4 AP, 20 fatigue; normal melee accuracy, no damage, push an adjacent enemy one hex. |

- Each living fighter starts their turn with 9 AP. Movement and actions spend the same budget.
- Open-ground movement costs 2 AP; rough terrain and uphill movement retain their additional costs and Pathfinder reductions.
- Normal attacks retain existing weapon fatigue costs. Recover costs 9 AP and removes 22 fatigue; its perk retains stronger recovery. Passive recovery becomes 15 fatigue per turn.
- Weapon-set and pocket-weapon swaps cost 4 AP; consumables cost 4 AP. Crossbows use 3 AP to shoot and 4 AP to reload.
- Other families retain their basic attack and gain family signatures in v0.37; see the current tactical rules.
- Berserk grants **+4 AP once per round in nine-AP battles**; legacy two-AP active battles retain +2 AP. The bonus is spent normally rather than granting a free attack.

## Automatic decisions and friendly fire

- **Balanced:** prioritize likely kills, useful disabling attacks, and efficient damage.
- **Damage:** favor attacks and finishing wounded enemies; use defensive skills only when no useful attack is available.
- **Control:** favor stunning threatening enemies, bracing, counterattacking, and protecting vulnerable allies.
- Company tactics govern positioning: Defense holds formation, Offense advances, and Thin Them Out favors the shared target. Personal preferences govern skill selection.
- Evaluate only legal, affordable actions. Avoid redundant stuns, Puncture against bare targets, and expensive skills without a useful situational benefit.
- Use Spearwall when enemies can approach before the next turn; Riposte when adjacent enemies can attack; Aimed Shot when its accuracy or range justifies losing a second quick shot.

**Avoid area attacks that hit allies by default.** Permit an exception only when all three conditions hold:

1. The attack has **at least a 90% calculated probability of killing an enemy**, including accuracy, armor, and damage variation. This matches the current maximum hit chance.
2. No friendly-fire-free action or affordable action sequence can secure that enemy's death with the same confidence this turn.
3. Every affected ally is guaranteed to survive the attack's worst-case damage, including a possible head hit.

Apply this restriction to every preference. Rank qualifying exceptions by least expected allied health damage, then least allied armor damage. Never accept friendly fire merely for additional nonlethal damage.

Preserve archer spacing and sensible weapon swapping. Equipment details show skills, costs, and automatic-use explanations. Battles show remaining AP, skill names, and status icons; exceptional friendly-fire decisions receive an explicit combat-log explanation. Animate actions separately, including counters, intercepted movement, and forced movement.

## Engine, persistence, and boundaries

- Add a shared skill catalogue and explicit weapon-family mappings for combat and descriptions. Famed items inherit their base weapon's skills.
- Extend battle actions with skill identity and affected targets. Process movement one hex at a time so interception can stop it.
- AI evaluation must not consume random rolls or inspect future rolls. Kill probabilities and allied damage bounds use visible combat state and the same damage rules as execution.
- Stances expire at the owner's next turn or when required equipment is swapped. Reactions cannot trigger further reactions and cost 5 fatigue each.
- Stun skips the target's next turn; it cannot be reapplied until that target subsequently takes a normal turn. Knock Back requires a free destination with at most one elevation difference and cancels stances when it moves the target.
- Save preferences, statuses, remaining AP, and weapon loading state. Existing brothers default to Balanced. The implemented compatibility policy keeps existing active battles on their original rules (2 AP or earlier 9 AP), preserving positions, health, equipment, and progress. New battles use 9 AP, with Berserk adding 4 AP once per round; legacy two-AP battles keep its 2 AP effect.
- **Repairable shields are implemented in v0.33:** broken shields stay owned and can be repaired with tools or at a Smithy. Shield skills preserve that durability system.
- No manual targeting, new injuries, new weapon items, or permanent shield destruction in this release.

## Verification and eventual release

- Test AP/fatigue spending, multi-action turns, every skill, stance expiry, reactions, forced movement, stun protection, perks, ammunition, and swaps.
- Verify useful AI choices through fixed scenarios: spear defense, mace-qatal cooperation, dagger versus armor, bow shot selection, and shield protection.
- Test friendly-fire rejection below the kill threshold, when a safe finishing sequence exists, and whenever an ally could die. Verify the narrowly permitted exception, least-damage selection, and accurate log explanation.
- Compare identical seeded encounters across preferences and weapon families; rule out repeated swaps, movement loops, and endless defensive stances.
- Test old saves and reloads between actions, including statuses and unloaded crossbows. Animated and instant resolution must produce identical outcomes.
- When this feature is implemented, check tablet controls and offline battle/save/reload, run the regression suite, then publish the versioned update and refreshed offline cache to the existing GitHub Pages game.

The core scope is implemented. Manual targeting and further item-specific variants remain outside this release.
