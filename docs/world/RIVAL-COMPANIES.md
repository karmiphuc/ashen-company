# Rival companies: supply routes, goals and real combat

Persistent rival companies now run supply routes, nearby camp expeditions and roaming band conflicts using the shared turn-based combat engine in a worker. They physically reach camps, retain real survivors, wounds, armor wear and ammo usage, and earn ordinary loot/XP with normal stat and random perk progression. **Paid contracts, recruitment, equipment purchases remain pending.** No power-score victories or invented earnings are used. Accepted player contracts and story/crisis encounters are protected.

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

Each company has its own treasury, provisions, ammo, tools, medicine, stash/cargo containers and resource ledger. Its resource ledger balances starting funds against wages/purchases, starting food against purchases/consumption, and tools/medicine against purchases/use. Ledger records are validated on import. Ammo purchases use real town stock and prices, aiming for 24 reserve ammo after an expedition. Paid medical services, equipment purchases, cargo trading and foraging remain pending. The income/consumption ledger records actual loot, ammo expenditure and purchases.

Three consecutive unpaid or hungry nights dissolve the company in place. The final roster and accounting remain saved for the chronicle; no refills, replacement roster, resurrection or automatic reactivation. This is deliberately a finite-budget foundation: camp earnings may still fail to cover losses or upkeep. No profitable outcome is guaranteed.

## Inspection and persistence

Each company has a permanent swallowtail banner with its own color, crest and stripe pattern, distinct from bandit sprites and their small difficulty flags. The banner remains readable at overview zoom and is repeated beside the company name in inspection and the chronicle. Visible world-map parties carry compact company heraldry and member counts. Select a party, or use **Chronicle → Other banners → Scout** when within normal scouting range. Compact two-column roster cards show real names, levels, HP and equipment portraits. Supply/treasury indicators have accessible labels; accounting and unfinished progression details sit behind expandable hints. Unseen companies do not expose map locations through a scout action.

The optional `rivalCompanies` record accepts the original version-1 supply routes. The live controller migrates these to version 2 without changing any resources, levels, gear, shortages or dissolution. Version 2 adds camp destinations, last expedition date, earned-income/ammo ledgers, up to three reservations, twelve recent reports and bounded defender wear records. Casualties reduce the original roster; no replacements are generated. Jobs save their fixed source and acknowledged running/settled checkpoint, with no nested jobs inside those source snapshots. Save validation checks ownership, contact, clocks, frozen resources, shared battle state, receipts, wear and accounting. Isolated snapshots retain the complete fighting company and target defender wear, but omit unrelated rival stash contents, defender wear and reports. This keeps accumulated late-game history from silently blocking contact reservations without changing the live campaign. Snapshot limits reserve space within the existing 4 MiB import/export limit. No global save/combat version bump.

### Live expedition timing and recovery

Healthy companies with two days of provisions may detour to a nearby unclaimed camp of difficulty 1–2 whose visible roster does not outnumber them. Movement still uses actual terrain/mount rules. A company can start at most one expedition per day, only from 06:00–14:00. Accepted player objectives and the player's selected travel target are excluded; reserved camps cannot be attacked or offered as new player contracts. Story, crisis and patrol encounters are not eligible.

An expedition occupies six campaign hours for combat and aftermath, regardless of worker speed. The turn-based simulation determines the actual outcome. Completed results wait for that fixed deadline. If computation is still pending at the deadline, world time pauses before crossing it while rendering continues; the simulation never estimates an outcome, bills the wrong roster at midnight, or charges extra world time. Camp/forage actions wait for pending reports before advancing their full duration. Worker failure preserves the last acknowledged checkpoint and retries; there is no synchronous combat fallback.

At the deadline, the transaction applies actual survivor gear/HP/injuries, XP, stat/perk choices, loot and resource consumption once, updates the real camp, and begins an ordinary six-hour recovery stop. A defeated company's surviving opponents retain casualties, HP, morale, wounds and armor/shield wear. Wear applies only to that camp generation; a future regenerated camp gets its normal new roster. A wiped-out rival stays dissolved. Night sleep and real midnight food/wages continue normally outside the reserved daylight expedition.

## Evidence and next milestone

The [shared headless combat adapter](HEADLESS-RIVAL-COMBAT.md) now resolves real isolated encounters in a worker. Its controller reserves encounters and commits real results to live companies. Paid contracts, equipment purchases, recruitment remain pending.

Unit coverage checks activation/old saves, daytime/mounted travel parity, nighttime camps/inns and dawn resume, six-hour rest and tool/medicine parity, real stock/prices, midnight bills, wound recovery, reload/partition determinism, dissolution without teleport/refill, malformed saves and inability to launch a placeholder NPC fight. Shared engine, cart, night, retinue, injury, legacy and world regressions cover the extracted services. Browser coverage checks actual endgame inspection/reload and iPad widths; campaign-start rivals are visible before any crisis and survive reload.

`node tools/simulate-rivals.mjs` reproducibly runs three seeded 30/90-day supply-route simulations through the shared services and validates both checkpoints. This isolates rival scheduling; it does not simulate other NPC combat or claim iPad hardware performance. That isolated supply-only tool disables combat, so its contract counts, combat losses, XP gains and named acquisitions remain zero; use the live-world tool below for combat evidence. Record measured p95/max step times and save sizes instead of treating a unit-test pass as a frame-rate guarantee.

Historical baseline measured before nighttime sleep, after the lightweight supply-quote change; these treasury and timing figures do not describe the new sleeping schedule. Day 30/90 means elapsed days after rival arrival, not campaign day:

| Seed | Day-30 treasury: Gilded / Jackals / Oath | Day-90 treasury | Day-90 Jackals | p95 / max rival step | Rival record size |
| --- | --- | --- | --- | --- | --- |
| 719 | 9,810 / 5,905 / 12,650 | 5,430 / 0 / 5,900 | Resting, one hungry night | 0.83 / 40.82 ms | 18,450 bytes |
| 720 | 9,816 / 5,907 / 12,646 | 5,424 / 0 / 5,936 | Dissolved | 0.66 / 14.47 ms | 18,461 bytes |
| 721 | 9,804 / 5,918 / 12,646 | 5,412 / 0 / 5,906 | Dissolved | 0.80 / 39.71 ms | 18,489 bytes |

These are 8,640 quarter-hour steps per seed, not iPad measurements or combat-scheduler benchmarks. An earlier run with full armory projections on every supply quote and concurrent regression/browser work showed substantial timing outliers; the narrow shared quote path removes that unnecessary work. Hardware/browser profiling remains necessary before claiming the eventual full rival system meets frame targets.

Next: paid contract claims, affordable gear purchases, recruitment. The real combat adapter, bounded worker scheduler, encounter ownership and exactly-once camp/band outcomes are implemented. Preserve normal earned progression and costs in subsequent milestones.

### Live simulation evidence

The historical camp-only run of `node tools/simulate-rival-world.mjs` advanced three real campaign seeds for three days, resolving each physically contacted camp through the native turn-based engine and validating reloads. Seeds 12/13/14 produced 4/2/3 fights and 1/0/0 losses. Rival camp earnings were 613/275/445 crowns total; final saves were approximately 63/85/62 kB. Some companies had no earnings and others lost a brother; there is no guaranteed profitable result or level-up. These are functional Node simulations, not physical-iPad FPS measurements. Live browser coverage checks background worker completion, reload, deadline application, ordinary camping, exactly-once rewards and rendering without a measured frame gap above one second.

## Roaming bands, money goals and map parties

Rivals now appear as small parties using the existing world character figures, with their permanent heraldry beside the figures. Character silhouettes and compact flags stay visible at overview zoom; the hit target uses the party's actual position. No new race, character artwork or combat bonuses are introduced. The inspection panel shows one short goal label; its hint explains the priority.

| Company | Money goal | Voluntary scouting / safety margin |
| --- | --- | --- |
| Gilded Road | Cautious earners: preserve wage reserves and take nearby, low-risk spoils | 80 world units / 1.60× estimated opponent strength |
| Red Jackals | Loot hunters: seek camps and isolated bands for ordinary loot | 180 world units / 1.05× |
| Bronze Oath | Road wardens: prioritize caravan raiders, then nearby road spoils | 130 world units / 1.25× |

Scouting estimates consider surviving roster, health, actual armor wear, attack/defense, visible enemy tier/veterancy and champion status. Estimates only guide movement: they cannot decide winners or produce rewards. Camp choice favors ordinary reward relative to travel distance. Supply readiness and one voluntary expedition per day still apply. No paid contract fee or faction salary is manufactured for the wardens.

Awake rivals detour from stronger bands within 100 world units, spending the ordinary travel budget on reachable steps that increase separation. Terrain can trap them; there is no teleport, speed concession or guarantee of escape. Bandits can pursue a nearby vulnerable rival outside an accessible town, using existing bandit detection/leash/speed rules. Existing wagon assignments retain priority, and a nearer eligible player target still takes precedence. These decisions do not read hidden player gear or resources.

Physical interception outside town reserves an actual shared-engine fight even if the rival is wounded, resting, sleeping or short of provisions. A rival cannot opt out because its estimate says it would lose. Player-selected pursuits, accepted contracts, player battles and existing faction commitments remain protected. Each band can be committed to only one fight; its movement and new faction claims stop until settlement. A protected player target therefore remains the player's encounter rather than being stolen by the NPC system.

Roaming encounters occupy one fixed quarter-hour of campaign time, followed by the ordinary six-hour rival recovery stop. Camp expeditions retain their six-hour daylight commitment. This shorter road duration permits night ambushes without freezing a roster across unpaid midnights: a 23:45 fight settles at midnight before normal rival upkeep charges the actual survivors. Worker CPU time never changes either duration. If unresolved, the existing world-time barrier waits for an acknowledged result while rendering continues. Player camping/foraging also resumes only the remaining hours if a new NPC fight starts mid-action; no early recovery, restarted duration or duplicated forage reward.

Victories apply normal band loot, XP, stat/perk progression and the existing 48-hour replacement/spawn-cycle rules. Defeats retain actual rival deaths and surviving bandit HP, morale, armor/shield/attachment damage and injuries, tied to the original spawn cycle. A replacement band does not inherit stale damage. Defeating a caravan's actual assigned raider releases that shipment using the same accounting. Saves keep existing rival version-two fields and permit bounded camp-or-band reservations/wear (128 records maximum; the authored ordinary encounter catalog is smaller). Existing camp checkpoints and prior rival resources/progress remain valid.

Companies use the ordinary 512-slot base stash limit, matching native combat settlement. At an accessible town they sell at most twelve actually owned ordinary spoils per shop day through the normal sale service and local stock/prices. Actual sale proceeds enter the earned-income ledger before supply purchases. Before selling, they equip useful earned weapons, armor, helmets, shields, attachments and mounts through native equipment swaps. Swaps preserve item condition, displaced gear and HP, respect stash/attachment rules, retain ranged/reach/one-handed weapon styles, avoid exhausting fatigue capacity, and reject armor swaps that remove existing defense bonuses. Named/famed reserves are retained. Equipment purchases remain pending; there are no invented sale receipts or equipment subsidies.

### Cashing in and earned equipment

Ordinary spoils redirect a company toward the nearest reachable open town, using route length through real terrain. They finish their actual six-hour post-battle recovery and travel at normal speed; nighttime sleep still applies. While carrying saleable loot, scouting requires 1.75 times their normal safety margin, camp raids are deferred, and only roaming enemies already within the immediate encounter radius qualify for opportunistic hunting. Forced interceptions still resolve real combat, regardless of loot or readiness.

Town visits equip useful finds before selling up to twelve ordinary items per day at normal local prices and stock limits. Larger backlogs keep the company resting safely for the next day's sale instead of seeking another raid. Retained named reserves do not repeatedly force a selling trip. Gold proceeds enter the existing earned-income ledger; food, supplies and wages still cost real money. The existing save schema accepts any real settlement as a modern selling destination while preserving authored home-route indices for subsequent patrols. Legacy route validation remains unchanged.

Equipment selection uses a conservative condition/fatigue/damage heuristic rather than a perfect build optimizer. Named perk combinations are preserved by native swaps, but shopping for equipment, second attachment/reserve-set optimization, recruitment and cargo trading are future work.

## Declarations of war and faction warrants

Diplomacy is checked once per campaign day, after live rival recovery/progression. Existing companies and saves retain their people, resources and jobs; a missing `rivalDiplomacy` record starts neutral, without retroactive declarations or bills. Its optional version-1 record tracks declaration/reason, faction warrant, elimination/claim state, pursuit cooldown and actual lost resources. The rival company/job schema remains version 2.

| Company | Declaration requirements | Goal |
|---|---|---|
| Red Jackals | At least 14 actual days since rival activation, 5 surviving members, average level 7, 6,000 genuinely earned crowns | Predatory competition: demand exclusive hunting grounds and threaten companies refusing their toll |
| Gilded Road | At least 28 actual days, 5 survivors, average level 8, 10,000 earned crowns and player renown 120 | Cautious commercial rivals escalate only after building a successful company |
| Bronze Oath | Remains neutral | Lawful road wardens; no invented player/faction grievance |

A declaration is permanent and immediately authorizes player engagement/pursuit. It appears in the chronicle, compact map hostility markings, the company's sidebar and a notification when issued. The short war notice has a touch-accessible explanation. Neutral, dissolved, town-sheltered and already-committed companies cannot be attacked. Declarations grant one day before rivals initiate pursuit.

After the warning, a travelling hostile company may hunt within 180 world units only in daylight, outside accessible towns, with at least two days of food, all members above 65% health and estimated strength at least 1.1 times the player's visible company. Loot liquidation and recovery take priority. Movement uses ordinary company speed, terrain and mounts. Hostile companies avoid a visibly stronger player within 100 units using the existing physical detour budget. Sleep/town sanctuary, NPC fight ownership and encounter grace remain in force. A player pursuing a declared rival can catch it at night. Post-battle pursuit cooldown is 24 hours; this never prevents the player hunting remaining members.

### Actual player-versus-rival combat

Enemy units are built from the rival's persistent members, without camp difficulty/rank/champion stat promotions or new gear rolls. Their stats, learned and equipment-granted perks, roles, equipment, reserve sets, accessories, set bonuses, mounts, HP, injuries, morale and conditions are preserved. Enemy bows/crossbows spend the rival ammunition pool; thrown ammunition stays attached to the real weapon. Reload validation binds the enemy roster, owned equipment/perks and frozen purse to the live rival.

After any result, dead members stay dead. Survivors retain wounds, durability, spent ammo and actual earned kill XP; their legal stat/random-perk upgrades use the existing rival progression service. Escaped members retain their HP and gear, and the company recovers normally without replacement troops. A retreat or partial victory cannot recreate defenders, refill ammunition or yield the same gear twice.

Player victory salvages the defeated members' actual gear. Eliminating the last surviving member also exposes the real stash, provisions, tools, medicine, remaining ammo and treasury (subject to the normal 100,000-crown battle-loot ceiling). No random camp cash, supplies, bonus attachment rolls or duplicate named gear are generated. Transferred/lost resources balance through the diplomacy loss ledger. A rival victory can collect up to 1,000 actual player crowns; when the player loses or retreats, abandoned dead-player gear can enter the rival's normal 512-slot stash. This uses real possessions, not invented rewards.

### Hard outlaw contract

Once declared Jackals have at least 5 survivors, average level 8 and 8,000 earned crowns, the faction governing their current location issues a warrant. Its settlements may prioritize one `rival-bounty` on their existing weekly combat board. Offers require the live company still to meet the roster/level threshold; there is no stronger quest copy, extra fighters, teleport or special stat boost. Payment is the current summed member levels × 100 crowns, bounded to 3,000–9,000 at acceptance, plus 3 renown.

The contract consumes the ordinary combat slot, leaving the letter and merchant slots available. Its bronze map navigation button pursues the real moving company and turns lime green after player elimination of its last member. Escaped survivors keep the objective open. Return to the issuing settlement for one payment; entering the town from nearby also settles ready contracts. The warrant is permanently marked claimed after payment. If the company falls elsewhere or dissolves, the contract is withdrawn without payment and frees the combat slot; weekly board consumption remains intact. Killing the company before taking the warrant grants its ordinary actual loot but no retroactive contract payment.

Rival paid contracts, equipment purchases, recruitment, joining NPC battles and negotiated diplomacy remain future work. Wars do not replace the real economy with catch-up levels, respawns or subsidies.
