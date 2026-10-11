# Shared headless combat for rival companies

This implements the combat-adapter part of [milestone 3](../plans/RIVAL-COMPANIES.md). It is an executable, worker-backed library with real battle outcomes, not yet an automatic world activity. The [current rival companies](RIVAL-COMPANIES.md) still travel, provision, recover and pay upkeep. Camp reservations, campaign-time scheduling, exactly-once world settlement, earned-income accounting and changing NPC rosters are the next integration step. Preparing a job does not claim or clear a camp, pay a live rival or alter the player's campaign.

## Actual participants and rules

`createHeadlessCombat(world, companyId, encounterId)` requires an existing, solvent rival physically within the normal camp contact radius. The target must be an uncleared ordinary camp with no ongoing patrol fight or accepted player contract targeting it. Unique story, tomb, crisis and caravan objectives are excluded. Preparation uses isolated copies of the real NPC members, gear, HP, injuries, consumables, funds, food, ammo and stash.

Capture the enemy roster from the current world before replacing the player roster with the rival's party. This preserves the camp's actual size, veteran promotions, named rolls, mounts and prior world losses. A smaller rival does not cause an easier camp to be regenerated. Terrain, lighting and random seeds also remain fixed. Reuse the existing formation builder, battle creation, `advanceBattle`, retreat and `finishBattle` rules; there is no second damage, injury, AP, morale, reaction or loot calculator.

Rivals receive neither the player's retinue bonuses nor the player's contracts, legacy rewards, blacksmith state, automation or nearby faction-patrol assistance. The adapter fixes turn-based rules for deterministic offscreen work, independently of the player's realtime-combat setting. It does not change the mode of any player battle.

## Bounded work and recovery

`advanceHeadlessCombat` runs at most the requested number of shared engine actions, capped at 256 per call. Its default is one action and a **soft** 4 ms budget. An individual engine action is atomic and can exceed that budget. CPU exhaustion yields unfinished work without choosing a winner. `advanceHeadlessQueue` rotates across at most three jobs, so one company cannot monopolize the queue.

After 20,000 actions or round 1,000, the shared retreat action ends a stalemate, including its actual food, morale and HP penalties. It never substitutes a victory or loot. These are fixed combat-progress limits, independent of wall-clock speed.

`HeadlessCombatRunner` runs preparation, restoration, combat and settlement in a module worker. There is no synchronous fallback. Worker failure or timeout rejects outstanding requests; callers retain their last acknowledged checkpoint and can restore it into a replacement worker. At most three jobs live in a worker and eight commands may be pending. A checkpoint has an 8 MiB encoded-size limit. The existing offline build includes the worker and all its imports.

A job progresses through `running → ready → settled`. Checkpoints retain the campaign snapshot, participants, terrain, random state, consumed ammo, progress and terminal battle. Restoration uses the existing save/member/battle validators, checks owner identity and resources, prohibits player bonuses, verifies the captured enemy identities and gear, and rejects inconsistent statuses or receipts. Snapshots and returned results do not alias live state.

## Settlement boundary

`settleHeadlessCombat` invokes ordinary `finishBattle` on a private copy. Its receipt contains actual casualties, survivors, XP, gear wear, consumables, gold, food, supplies, stash items and the camp record. It also retains every enemy’s terminal state and original world troop index, including pre-existing world casualties, so integration can preserve opponent losses and wear without renumbering survivors. The terminal battle remains as an audit. Repeated settlement returns the same isolated receipt, and a restored settled checkpoint recomputes and verifies that receipt.

The live [rival-company controller](RIVAL-COMPANIES.md) now reserves physically contacted ordinary camps, saves source/checkpoints, and commits these receipts once at a fixed six-hour expedition deadline. It pauses rival travel and recovery during the commitment, protects accepted player targets, accounts for earned resources and updates real camp casualties and defender wear. No battle winner is estimated and no worker work executes on the UI thread.

Version-2 jobs spend available level-ups after ordinary settlement using player stat rolls and seeded random legal perks, with no extra XP or point grants. Version-1 checkpoints retain their original settlement behavior and receipts, so existing in-flight jobs do not change on reload. Paid contracts, equipment upgrades, recruitment, joining rival fights and hostile ambushes remain later milestones.

## Evidence

`node --test tests/headless-combat.test.js tests/headless-runner.test.js` covers world isolation, contact and accepted-target protection, world-roster parity despite different company strength, ordinary/headless combat parity, real casualty/defeat outcomes, worker error handling, bounded/fair slices, save/reload and batch determinism, stalemate retreat, malformed checkpoints and idempotent settlement.

`e2e/headless-combat.spec.js` exercises the real browser module worker, checks its receipt against the native engine, checks rendering continues during a long worker slice with no measured frame gap above one second, and replaces the worker from an acknowledged checkpoint. These are Chromium checks using the iPad viewport, not physical-iPad measurements.

`node tools/simulate-headless.mjs` repeats three contact scenarios with fixed seeds. It reports real outcomes and measured preparation/action costs; it is not a whole-campaign or economy simulation. The historical level-3/4/5 starting-roster baseline below predates automatic spending of available points; rerun the tool for current outcomes. That baseline recorded:

| Seed / company | Camp | Result | Actions / rounds | Losses | Snapshot | p95 / max action |
| --- | --- | --- | --- | --- | --- | --- |
| 12 / Gilded Road | day 1, tier 1, 3 enemies | victory | 95 / 4 | 0 of 6 | 102,015 B | 17.81 / 37.30 ms |
| 13 / Red Jackals | day 45, tier 2, 5 enemies | victory | 261 / 9 | 1 of 7 | 107,441 B | 12.15 / 64.65 ms |
| 14 / Bronze Oath | day 80, tier 3, 9 enemies | defeat | 532 / 16 | 8 of 8 | 115,507 B | 18.76 / 51.20 ms |

Preparation measured 106.59, 64.18 and 21.80 ms respectively. These measurements justify worker execution; they do not establish a hard 4 ms action limit or live gameplay FPS. The victorious companies earned ordinary loot and XP; the defeated company gained no gold or replacement items and spent all its ammo. All settled receipts survived restoration without changing their outcomes.
