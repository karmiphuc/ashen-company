# Persistent rival mercenary companies

Implementation plan: [issue #174](https://github.com/karmiphuc/ashen-company/issues/174). The inheritance feature did not introduce rivals. The first persistent supply-route milestone is now implemented; see [current behavior and shared-rule audit](../world/RIVAL-COMPANIES.md). Combat, paid work, growth and rivalry remain planned. Existing faction patrols are a different system and currently use an approximate offscreen outcome model; reusing that outcome calculation would not satisfy these requirements.

## Company identities and growth

Start with three persistent companies: profitable contract specialists, aggressive camp hunters and disciplined faction-backed mercenaries. Reuse existing races, backgrounds, equipment, mounts and role AI. Authored starting budgets/rosters must be explicit; faction identity does not imply unlimited subsidies.

Each member retains HP, injuries, morale, XP, level, stats, equipment and condition. Earn XP through actual work and surviving combat. Implement ordinary, role-weighted stat growth first; random perk selection comes later, respects prerequisites/points and persists seeded choices. Until implemented, members keep starting perks without substitute hidden stat bonuses.

Named gear comes from real drops or purchases. Members choose affordable, role-appropriate equipment and retain its actual rolls, durability, attachments and reserve state. No guaranteed replacement gear, free resurrection or scaling to the player's level. Losses, bankruptcy, downsizing, retreat and dissolution must be possible.

## Fairness and economy

Use the player's movement calculation: terrain/roads, night, mounts, relevant equipment and carried-load/cart modifiers. No teleportation or exceptional pursuit speed. Companies physically reach jobs, targets and settlements.

Maintain their own treasury, wages, provisions, ammo, repair tools, medicine, stash/cargo and stock transactions. Purchases use settlement prices and availability; repairs cost tools/time or paid services, injuries require recovery/treatment, and ammo is actually spent. Essential supplies and wage reserves take priority over upgrades. Do not generate bailout income, combat bonuses or extra loot.

Small explicit food/recovery concessions are acceptable: proposed 10% lower food use and 10% faster recovery, configurable and inspectable. These are provisional tuning values; demonstrate operation with both disabled. They must not change damage, accuracy, armor, XP, drops or map speed.

Rival contract claims need a small bounded share of eligible work, preserving the player's three categories and weekly board pacing. Do not take an accepted player quest, manufacture replacement offers, consume every useful slot or resolve unique blacksmith/story/crisis objectives without specific integration. Claimed targets need one owner/encounter commitment and exactly-once rewards.

## Actual combat, persistence and performance

Use a headless adapter to the shared combat engine, including formation, terrain, lighting, AP, fatigue, ammo, injuries, morale, fleeing, reactions, shield/armor damage, death and existing named/set/attachment mechanics. Do not select a winner using power scores or probability alone.

Create encounters after physical contact. Persist their seed, rule version, combat progress and locked participants. Map battle progress to deterministic campaign duration; CPU speed must not decide campaign time or award instant victories. Save/load must neither reroll outcomes nor duplicate supply costs, casualty records, XP or loot.

Schedule bounded batches fairly across pending fights; pause company travel while fighting. Prefer worker execution where compatible. A CPU limit queues remaining work rather than inventing an outcome. Define explicit retreat/stalemate rules. Joining visible NPC fights must preserve current casualties, positions and supplies; otherwise omit joining until this transfer is implemented correctly.

Use finite collections and outcome transactions, strict validation and clear migrations. Isolate NPC state from player combat/inventory. Reuse existing services behind small modules rather than building another combat engine or broadly expanding `engine.js`.

## Rivalry and counterplay

Track observed competition, interference, renown, faction relations and captain temperament. Rivals know what scouting/contact reveals, not hidden player inventory or unseen injuries. Escalate through remarks, threats/demands and stalking before an attack. Their real surviving roster, supplies and willingness to retreat govern decisions; elapsed time alone does not force aggression.

Provide negotiation, payment, intimidation, scouts, avoidance and fighting. Attacks use normal detection/pathing. Add cooldowns and de-escalation to prevent repeated ambush spam. Defeated rivals lose members/gear, retreat and rebuild through earned resources, surrender or dissolve.

Map crests and compact inspection should communicate identity, visible roster/gear, activity and relationship. Supply hardship/recovery use accessible icons with hints, with detailed accounting behind expansion. Touch panels must preserve map space and the fixed company bar.

## Delivery order and evidence

1. **Implemented:** shared-rule audit, bounded persistent companies, old-save activation and inspection.
2. **Implemented:** travel, upkeep, affordable supply purchases, recovery and insolvency. Gear purchases, paid treatment and earnings are deferred to the work/combat milestone.
3. Real headless encounters, deterministic scheduling, claims and exactly-once results.
4. Earned stats, equipment/roster management and legitimate named accumulation.
5. Visible hostility, pursuit, negotiation and player encounters; safe joining separately if necessary.
6. Random valid perk choices.
7. Announced contested endgame objectives.

Run seeded 30/90-day simulations and report distributions of money, shortages, losses, contracts, levels and named acquisitions. Do not require every company to survive. Check accounting, equivalent movement, seeded headless/ordinary combat parity, save/reload/batch determinism and malformed-state rejection. Cover mounted/ranged/reach behavior and opportunity strikes. Measure iPad frame times and save sizes with multiple encounters: aim for ~4 ms simulation slices, no feature-attributable synchronous task over 50 ms and no simulation pause over one second. These performance targets need measurement, not assertions based only on a passing unit suite.

The issue records detailed acceptance checklists and unresolved choices: world-time mapping, eligible contract pool, starting budgets, final concession values, encounter joining and later legacy options. Resolve them in their corresponding implementation milestone.
