# Rival companies: persistent supply-route foundation

This is the first two milestones of the [rival-company plan](../plans/RIVAL-COMPANIES.md), not the completed rival gameplay system. Companies currently travel, buy supplies, pay wages, rest and can become insolvent. **They do not fight, take contracts, acquire loot, recruit, earn XP or attack the player yet.** There are no estimated victories or invented earnings. Player contracts, weekly boards, story objectives and ordinary battles are unchanged. Camp-hunter/contract-specialist identities describe the intended later behavior, not completed work.

## Activation and authored arrivals

After Ashen Winter is completed, the next ordinary quarter-hour world step introduces these three companies once. An older completed-crisis save activates them at its current date; there are no retroactive bills, rerolls or player-level scaling. Companies do not appear before the crisis, and a new inherited campaign starts without them until its own crisis is completed.

| Company | Identity | Brothers / level | Treasury | Supply route |
| --- | --- | --- | --- | --- |
| Gilded Road | Contract specialists | 6 / 3 | 12,000 | Oakwatch → Greyhaven → Stonebridge |
| Red Jackals | Camp hunters | 7 / 4 | 9,000 | Ironford → Highpass → Ravenfell |
| Bronze Oath | Faction-backed veterans | 8 / 5 | 16,000 | Ambercross → Windrest → Kargan |

Each starts with three days of food, eight tools, five medicine and 24 ammo. Bronze Oath's first two brothers have ordinary riding horses, including their food cost. All use existing characters/gear, ordinary seeded talents and legal level-up rolls: train three normal attributes per starting level, with no extra combat multipliers. No learned perks are invented; later randomized perk selection remains its own milestone. Starting money, equipment and levels are explicit authored arrivals, not purchases claimed to have happened offscreen. There are no faction subsidies after arrival.

## Shared-rule audit and current rules

`src/rival-companies.js` owns bounded persistent data and decisions; the engine supplies the existing player services through a small adapter. The refactor shares these rule implementations rather than copying formulas:

| Rule | Shared implementation | Rival behavior |
| --- | --- | --- |
| Movement | `getWorldTravelSpeed`, `getCompanyTravelMultiplier`, `moveWorldToward` | Actual terrain, road and night pace; existing mount bonuses; no pursuit boost or teleport. Fixed routes avoid blocked towns. |
| Wages / food | `applyDailyUpkeep`, `getCompanyStats`, `getDailyFood` | Pay once per crossed midnight; normal hunger/low-morale penalties. No food concession. |
| Temporary injuries | `recoverDailyInjuries` | Persistent wounds, real daily medicine cost, ordinary deterministic healing rolls. |
| Rest / repairs | `applyRestRecovery` | Stop for six hours; normal HP/morale gain, medicine and tools; no recovery concession. |
| Supplies | `provisionQuotes`, `buyFood`, `buySupplies`, shared `marketStock` | Real local prices and daily stock. Essential food first, then medicine/tools only when needed. Reserve three days of wages; never spend unavailable gold. |
| Members / saves | `validateCompanyMembers`, `normalizePersistedMember` | Same gear, HP, injury, talent, training, perk, attachment and durability validation as player members. |
| Future combat | Ordinary `startBattle` / `advanceBattle` / `finishBattle` | **Not adapted yet.** These player-campaign functions have outcome/loot/camp ownership effects which need isolation before headless use. |

Supply quotes avoid building the full equipment catalog. Rest/medical effects do not advance a second world clock. NPC transactions operate on their own roster/resources and share only the real world market stock. A small, separate marker getter lets the map draw crests without recalculating all NPC stats each frame.

Each company has its own treasury, provisions, ammo, tools, medicine, empty stash/cargo containers and resource ledger. Its resource ledger balances starting funds against wages/purchases, starting food against purchases/consumption, and tools/medicine against purchases/use. Ledger records are validated on import. Buying spare ammo, paid medical services, equipment upgrades, cargo trading and foraging are deferred until their associated work/combat policies exist. Ammo is preserved but cannot be spent by nonexistent battles.

Three consecutive unpaid or hungry nights dissolve the company in place. The final roster and accounting remain saved for the chronicle; no refills, replacement roster, resurrection or automatic reactivation. This is deliberately a finite-budget foundation: without the later earnings milestone, some companies will run out of funds over a long campaign. Balance claims about fully working rivals must wait for real earnings and combat.

## Inspection and persistence

Visible world-map crests show company identity and member count. Select a crest, or use **Chronicle → Other banners → Scout** when within normal scouting range. Compact two-column roster cards show real names, levels, HP and equipment portraits. Supply/treasury indicators have accessible labels; accounting and unfinished progression details sit behind expandable hints. Unseen companies do not expose map locations through a scout action.

The optional `rivalCompanies` version-1 record contains activation/simulation clocks and exactly three authored company identities. Each record owns its route, position, rest/shop timing, resources, roster and ledger. Saves without it remain unchanged; no global save/combat version bump. Imported records reject missing/excess companies, invalid clocks/routes/positions, impossible resources or wear, extra top-level fields and unbalanced accounting. They return isolated normalized NPC members. Save size is bounded by three small rosters; no history of unlimited events/fights accumulates.

Future casualties, recruitment, earned income and committed battles will need an explicit evolution of this NPC record: version 1 fixes the starting roster and initial-budget ledger. That later migration must preserve existing insolvency and resource usage; it must not manufacture rewards.

## Evidence and next milestone

Unit coverage checks activation/old saves, normal/night/mounted travel parity, six-hour rest and tool/medicine parity, real stock/prices, midnight bills, wound recovery, reload/partition determinism, dissolution without teleport/refill, malformed saves and inability to launch a placeholder NPC fight. Shared engine, cart, night, retinue, injury, legacy and world regressions cover the extracted services. Browser coverage checks actual endgame inspection/reload and iPad widths; pre-crisis campaigns have no rival UI.

`node tools/simulate-rivals.mjs` reproducibly runs three seeded 30/90-day supply-route simulations through the shared services and validates both checkpoints. This isolates rival scheduling; it does not simulate other NPC combat or claim iPad hardware performance. Contract counts, combat losses, XP gains and named acquisitions are all zero because those systems are not implemented. Record measured p95/max step times and save sizes instead of treating a unit-test pass as a frame-rate guarantee.

Measured on this cloud Node environment, after the lightweight supply-quote change. Day 30/90 means elapsed days after rival arrival, not campaign day:

| Seed | Day-30 treasury: Gilded / Jackals / Oath | Day-90 treasury | Day-90 Jackals | p95 / max rival step | Rival record size |
| --- | --- | --- | --- | --- | --- |
| 719 | 9,810 / 5,905 / 12,650 | 5,430 / 0 / 5,900 | Resting, one hungry night | 0.83 / 40.82 ms | 18,450 bytes |
| 720 | 9,816 / 5,907 / 12,646 | 5,424 / 0 / 5,936 | Dissolved | 0.66 / 14.47 ms | 18,461 bytes |
| 721 | 9,804 / 5,918 / 12,646 | 5,412 / 0 / 5,906 | Dissolved | 0.80 / 39.71 ms | 18,489 bytes |

These are 8,640 quarter-hour steps per seed, not iPad measurements or combat-scheduler benchmarks. An earlier run with full armory projections on every supply quote and concurrent regression/browser work showed substantial timing outliers; the narrow shared quote path removes that unnecessary work. Hardware/browser profiling remains necessary before claiming the eventual full rival system meets frame targets.

Next: build an isolated headless battle adapter and deterministic bounded scheduler using the real combat engine. Add encounter ownership and exactly-once outcomes before allowing camp jobs or quest claims. Earnings, roster/equipment growth and visible rivalry follow; no power-score winner shortcuts and no hidden combat boosts.
