# Rival companies: persistent supply-route foundation

Persistent rival companies now run supply routes and nearby camp expeditions using the shared turn-based combat engine in a worker. They physically reach camps, retain real survivors, wounds, armor wear and ammo usage, and earn ordinary loot/XP with normal stat and random perk progression. **Paid contracts, recruitment, equipment upgrades and attacks on the player remain pending.** No power-score victories or invented earnings are used. Accepted player contracts and story/crisis encounters are protected.

## Activation and authored arrivals

The first ordinary quarter-hour world step introduces these three companies once, from the start of every campaign, including inherited campaigns. Older saves without rivals activate them at their current date regardless of crisis progress; there are no retroactive bills, rerolls or player-level scaling. Existing companies keep their progress and dissolved companies stay dissolved.

| Company | Identity | Brothers / level | Treasury | Supply route |
| --- | --- | --- | --- | --- |
| Gilded Road | Contract specialists | 6 / 3 | 12,000 | Oakwatch → Greyhaven → Stonebridge |
| Red Jackals | Camp hunters | 7 / 4 | 9,000 | Ironford → Highpass → Ravenfell |
| Bronze Oath | Faction-backed veterans | 8 / 5 | 16,000 | Ambercross → Windrest → Kargan |

Each starts with three days of food, eight tools, five medicine and 24 ammo. Bronze Oath's first two brothers have ordinary riding horses, including their food cost. All use existing characters/gear and ordinary seeded talents. New companies retain the approved authored level-3/4/5 starts, with zero XP and three normal stat rolls per starting level-up. They start without learned perks; the combat adapter spends their valid available perk points alongside later earned points. Starting money and equipment remain explicit authored arrivals, not purchases claimed to have happened offscreen. There are no faction subsidies, hidden stat multipliers or scaling to the player. Previously saved companies retain their existing stats, levels and gear; no retroactive reset or additional rewards occur.

The real-combat adapter now trains surviving members after ordinary battle XP creates level-ups: three role-appropriate attributes using the actual pending player rolls, then seeded random valid perks within normal level and point limits. Reloads and repeated settlement do not reroll choices or spend points twice. This reward handling now applies to committed live camp expeditions.

## Shared-rule audit and current rules

`src/rival-companies.js` owns bounded persistent data and decisions; the engine supplies the existing player services through a small adapter. The refactor shares these rule implementations rather than copying formulas:

| Rule | Shared implementation | Rival behavior |
| --- | --- | --- |
| Movement | `getWorldTravelSpeed`, `getCompanyTravelMultiplier`, `moveWorldToward` | Actual terrain and road pace while awake; existing mount bonuses; no pursuit boost or teleport. Fixed routes avoid blocked towns. |
| Wages / food | `applyDailyUpkeep`, `getCompanyStats`, `getDailyFood` | Pay once per crossed midnight; normal hunger/low-morale penalties. No food concession. |
| Temporary injuries | `recoverDailyInjuries` | Persistent wounds, real daily medicine cost, ordinary deterministic healing rolls. |
| Rest / repairs | `applyRestRecovery` | Stop for six hours; normal HP/morale gain, medicine and tools; no recovery concession. |
| Supplies | `provisionQuotes`, `buyFood`, `buySupplies`, shared `marketStock` | Real local prices and daily stock. Essential food first, then medicine/tools only when needed. Reserve three days of wages; never spend unavailable gold. |
| Members / saves | `validateCompanyMembers`, `normalizePersistedMember` | Same gear, HP, injury, talent, training, perk, attachment and durability validation as player members. |
| Combat adapter | Ordinary `startBattle` / `advanceBattle` / `finishBattle`, `trainAttributes`, `learnPerk` | Worker-backed real outcomes, XP, stat rolls and random valid perks; physical reservations and exactly-once live results. |

Rivals sleep from 20:00 until 06:00. Travelling companies camp at their current position; companies at an accessible settlement stay at its inn. Sleep preserves the route, stops travel and shopping, and defers any expired six-hour recovery until morning; it adds no free healing or supply refill. Midnight wages, food, injury recovery and insolvency still run normally. Inspection shows the camp or inn activity. This is derived from the existing clock and position, so old saves need no migration.

Supply quotes avoid building the full equipment catalog. Rest/medical effects do not advance a second world clock. NPC transactions operate on their own roster/resources and share only the real world market stock. A small, separate marker getter lets the map draw crests without recalculating all NPC stats each frame.

Each company has its own treasury, provisions, ammo, tools, medicine, empty stash/cargo containers and resource ledger. Its resource ledger balances starting funds against wages/purchases, starting food against purchases/consumption, and tools/medicine against purchases/use. Ledger records are validated on import. Ammo purchases use real town stock and prices, aiming for 24 reserve ammo after an expedition. Paid medical services, equipment upgrades, cargo trading and foraging remain pending. The income/consumption ledger records actual loot, ammo expenditure and purchases.

Three consecutive unpaid or hungry nights dissolve the company in place. The final roster and accounting remain saved for the chronicle; no refills, replacement roster, resurrection or automatic reactivation. This is deliberately a finite-budget foundation: camp earnings may still fail to cover losses or upkeep. No profitable outcome is guaranteed.

## Inspection and persistence

Each company has a permanent swallowtail banner with its own color, crest and stripe pattern, distinct from bandit sprites and their small difficulty flags. The banner remains readable at overview zoom and is repeated beside the company name in inspection and the chronicle. Visible world-map banners show company identity and member count. Select a crest, or use **Chronicle → Other banners → Scout** when within normal scouting range. Compact two-column roster cards show real names, levels, HP and equipment portraits. Supply/treasury indicators have accessible labels; accounting and unfinished progression details sit behind expandable hints. Unseen companies do not expose map locations through a scout action.

The optional `rivalCompanies` record accepts the original version-1 supply routes. The live controller migrates these to version 2 without changing any resources, levels, gear, shortages or dissolution. Version 2 adds camp destinations, last expedition date, earned-income/ammo ledgers, up to three reservations, twelve recent reports and bounded defender wear records. Casualties reduce the original roster; no replacements are generated. Jobs save their fixed source and acknowledged running/settled checkpoint, with no nested jobs inside those source snapshots. Save validation checks ownership, contact, clocks, frozen resources, shared battle state, receipts, wear and accounting. Snapshot limits reserve space within the existing 4 MiB import/export limit. No global save/combat version bump.

### Live expedition timing and recovery

Healthy companies with two days of provisions may detour to a nearby unclaimed camp of difficulty 1–2 whose visible roster does not outnumber them. Movement still uses actual terrain/mount rules. A company can start at most one expedition per day, only from 06:00–14:00. Accepted player objectives and the player's selected travel target are excluded; reserved camps cannot be attacked or offered as new player contracts. Story, crisis and patrol encounters are not eligible.

An expedition occupies six campaign hours for combat and aftermath, regardless of worker speed. The turn-based simulation determines the actual outcome. Completed results wait for that fixed deadline. If computation is still pending at the deadline, world time pauses before crossing it while rendering continues; the simulation never estimates an outcome, bills the wrong roster at midnight, or charges extra world time. Camp/forage actions wait for pending reports before advancing their full duration. Worker failure preserves the last acknowledged checkpoint and retries; there is no synchronous combat fallback.

At the deadline, the transaction applies actual survivor gear/HP/injuries, XP, stat/perk choices, loot and resource consumption once, updates the real camp, and begins an ordinary six-hour recovery stop. A defeated company's surviving opponents retain casualties, HP, morale, wounds and armor/shield wear. Wear applies only to that camp generation; a future regenerated camp gets its normal new roster. A wiped-out rival stays dissolved. Night sleep and real midnight food/wages continue normally outside the reserved daylight expedition.

## Evidence and next milestone

The [shared headless combat adapter](HEADLESS-RIVAL-COMBAT.md) now resolves real isolated encounters in a worker. It does not yet claim camps or apply receipts to live rival companies; their automatic combat and earnings remain pending integration.

Unit coverage checks activation/old saves, daytime/mounted travel parity, nighttime camps/inns and dawn resume, six-hour rest and tool/medicine parity, real stock/prices, midnight bills, wound recovery, reload/partition determinism, dissolution without teleport/refill, malformed saves and inability to launch a placeholder NPC fight. Shared engine, cart, night, retinue, injury, legacy and world regressions cover the extracted services. Browser coverage checks actual endgame inspection/reload and iPad widths; campaign-start rivals are visible before any crisis and survive reload.

`node tools/simulate-rivals.mjs` reproducibly runs three seeded 30/90-day supply-route simulations through the shared services and validates both checkpoints. This isolates rival scheduling; it does not simulate other NPC combat or claim iPad hardware performance. Contract counts, combat losses, XP gains and named acquisitions are all zero because those systems are not implemented. Record measured p95/max step times and save sizes instead of treating a unit-test pass as a frame-rate guarantee.

Historical baseline measured before nighttime sleep, after the lightweight supply-quote change; these treasury and timing figures do not describe the new sleeping schedule. Day 30/90 means elapsed days after rival arrival, not campaign day:

| Seed | Day-30 treasury: Gilded / Jackals / Oath | Day-90 treasury | Day-90 Jackals | p95 / max rival step | Rival record size |
| --- | --- | --- | --- | --- | --- |
| 719 | 9,810 / 5,905 / 12,650 | 5,430 / 0 / 5,900 | Resting, one hungry night | 0.83 / 40.82 ms | 18,450 bytes |
| 720 | 9,816 / 5,907 / 12,646 | 5,424 / 0 / 5,936 | Dissolved | 0.66 / 14.47 ms | 18,461 bytes |
| 721 | 9,804 / 5,918 / 12,646 | 5,412 / 0 / 5,906 | Dissolved | 0.80 / 39.71 ms | 18,489 bytes |

These are 8,640 quarter-hour steps per seed, not iPad measurements or combat-scheduler benchmarks. An earlier run with full armory projections on every supply quote and concurrent regression/browser work showed substantial timing outliers; the narrow shared quote path removes that unnecessary work. Hardware/browser profiling remains necessary before claiming the eventual full rival system meets frame targets.

Next: build an isolated headless battle adapter and deterministic bounded scheduler using the real combat engine. Add encounter ownership and exactly-once outcomes before allowing camp jobs or quest claims. Earnings, roster/equipment growth and visible rivalry follow; no power-score winner shortcuts and no hidden combat boosts.

### Live simulation evidence

`node tools/simulate-rival-world.mjs` advances three real campaign seeds for three days, resolving each physically contacted camp through the native turn-based engine and validating reloads. Seeds 12/13/14 produced 4/2/3 fights and 1/0/0 losses. Rival camp earnings were 613/275/445 crowns total; final saves were approximately 63/85/62 kB. Some companies had no earnings and others lost a brother; there is no guaranteed profitable result or level-up. These are functional Node simulations, not physical-iPad FPS measurements. Live browser coverage checks background worker completion, reload, deadline application, ordinary camping, exactly-once rewards and rendering without a measured frame gap above one second.
