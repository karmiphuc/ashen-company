# Endgame crises: Ashen Winter, then the Broken Crown

Status: Ashen Winter implemented in v0.48.0; faction war remains a roadmap. Release publication has not been performed.

For the first release, [Ashen Winter implementation specification](ASHEN-WINTER-IMPLEMENTATION-SPEC.md) is authoritative. It fixes the scope and rules below where the original roadmap proposed alternatives. War remains a later release.

## Campaign promise

The company first helps the Marches survive an undead invasion. After a recovery period, the factions fight over the weakened world. The war changes settlement ownership and political borders permanently. Each campaign keeps this order but randomizes its locations, protagonists, objectives, and outcome.

Both crises must offer readable choices, battles suited to the existing automatic combat system, and meaningful consequences without destroying the sandbox. Players may support a faction, work as independent mercenaries, or concentrate on keeping their company alive. Ignoring a crisis has consequences but must never make a surviving campaign impossible to continue.

Implement and release Ashen Winter first. Settlement lockdown and player liberation are its central mechanic. The faction war remains a subsequent release using the saved undead aftermath; do not require its political systems to ship Ashen Winter. After the eventual war, the player continues in the changed world. Repeating the pair indefinitely is a later feature: it needs additional scenarios, safeguards for accumulated territorial changes, and long-term balance.

## Existing foundations and required changes

The current game has 48 settlements, nine geographic regions, four political factions, 11 soldier columns, ancient enemy templates and sepulchers, regional equipment, caravans, market shortages, joint battles, and persistent NPC casualties. Its quarter-hour world updates and seeded encounter generation provide the simulation foundation.

Important limitations:

- `src/faction-patrols.js` derives ownership from geography, uses static faction relations, and caches patrol definitions from immutable settlement data. Captures require state-aware ownership, diplomacy, reinforcement, and routes.
- `src/map.js` draws geographic region boundaries into its background. New political boundaries need a separate dynamic overlay.
- `src/engine.js` currently routes player battles through camps, bands, rescue, and deserter encounters. Political patrols and crisis armies need explicit encounter types and outcome handlers.
- Ancient enemies currently have equipment and names, but use ordinary combat behavior. Undead-specific rules require explicit, versioned traits.
- There is one accepted contract slot. Crisis-wide progress must live outside that slot so ordinary jobs remain usable.
- Save validation explicitly reconstructs accepted state. Adding properties without migration and validation would lose or reject crisis progress.

Keep settlement IDs, positions, road topology, terrain, and cultural equipment themes stable. Ownership changes government and relations; it does not turn a northern town into a desert culture.

## 1. Scheduling and randomization

Use one saved crisis director with this lifecycle:

`dormant -> undead warning -> undead active -> undead aftermath -> recovery -> war warning -> war active -> war aftermath -> completed`

Recommended starting values below are tuning proposals, not established balance:

| Rule | Initial target |
| --- | --- |
| Earliest undead eligibility | Day 60 |
| Experienced company gate | At least six living equipped brothers; average level of the best six at least 7 |
| Eligibility delay | Seeded 7–14 campaign days after eligibility is first reached |
| Undead warning | 7 days |
| Typical undead active period | Target 25–40 days with intervention; no automatic deadline victory |
| Recovery after undead resolution | Seeded 14–21 days |
| War warning | 7 days |
| Typical war active period | 30–45 days |

Audit level growth and existing combat difficulty before locking these values. Time alone must not force an unprepared new company into endgame fights. Once scheduled, losing a brother cannot cancel or reroll the event. During recovery, a badly depleted company may defer the war warning until a minimum fighting capacity returns; offer an explicit start option to veterans who want to proceed sooner.

Persist an independently derived seed for each crisis and separate random streams for scheduling, placement, NPC outcomes, objectives, and rewards. Reloading, opening a board, or changing unrelated contracts must not change these rolls. Generate candidate objectives from valid sites and road access, not arbitrary map coordinates.

World time continues to follow existing rules: pauses during combat, menus, and backgrounding; no simulation while the app is closed. Crisis deadlines use campaign hours and appear explicitly to the player.

## 2. Ashen Winter: undead crisis

### Warning and outbreak

Rumors identify two threatened regions and three dormant command sites. Favor existing ancient areas in the Northern Highlands, Eastern Frontier, and Blackwater Basin while varying individual sites and the secondary region. Clearly mark which locations are threatened, the warning deadline, and suggested preparedness.

At activation, three commanders establish crisis-owned tomb sites. These are separate encounter identities layered onto the world; do not repurpose ordinary camp progress, respawn generations, or accepted hunt targets. Start with a cap of six active undead roaming hosts and three simultaneous settlement threats. Cap roster sizes and total allied deployment for the existing battlefield.

### Strategic loop

Each living commander generates pressure in its front. Undead hosts travel through the world toward an announced settlement or road objective. Destroying a host delays that front; destroying its commander stops new hosts from that source. Cleared commander sites remain cleared for the crisis.

Threats progress through visible stages: reported approach, road disruption, siege lockdown, and undead occupation. Give at least 48 hours of approach warning before lockdown, adjusted upward if representative routes cannot be traversed in time. Menus and battles cannot consume that window. NPC guards can intercept approaching hosts and help the company, but cannot automatically reopen a locked settlement or end the crisis.

Once siege lockdown begins, the settlement cannot be used: block entry, markets, buying and selling, hiring, doctor, smithy, stables, new contracts, and contract turn-ins. The exterior panel instead shows the undead force and a **Liberate settlement** action. Enforce this through engine commands as well as the UI; an already-open panel, arrival handler, or direct function call cannot bypass lockdown.

Defeating the besieging or occupying force reopens the settlement immediately. Its services return with temporary recovery shortages and reduced military defenses. If ignored, siege becomes occupation: civilian services stay blocked, a bounded undead garrison holds the town, and the front can threaten neighboring settlements. Occupation never expires merely because time passes. Town IDs, markets, stock, named buybacks, recruits already hired, and accepted contract terms remain preserved behind the access restriction.

If lockdown begins while the company is inside, close service access and move it to a deterministic safe exterior position without triggering instant combat. Arrival at an already-blocked town stops outside and opens the liberation panel. Civilian jobs to that town remain pending until liberation; warn before accepting a job to a known blocked destination. Caravans hold outside or divert under explicit rules rather than completing deliveries through the siege.

Pressure should close useful settlements progressively and make intervention necessary. Avoid an early total-world lockout: cap occupied towns and require fronts to spread through connected targets. First-release default: cap blocked settlements at 12, preserve at least two geographically separated accessible settlements, and use existing camping/foraging for recovery. No new survivor camp is needed. Verify that a depleted company can reach food, recruits, and repairs before another mandatory liberation battle. Restoring blocked settlements still requires fighting.

### Player jobs

- Liberation battle: defeat a besieging host or occupying garrison with a bounded allied militia contingent; reopen that settlement.
- Supply run: deliver ordinary food or medicine before lockdown, or to an exterior relief camp during lockdown; strengthen defenders without opening civilian services.
- Road clearance: intercept a marked host disrupting a caravan route.
- Tomb assault: defeat one commander and permanently remove that source.

Track the three command sites in a persistent crisis journal, available without accepting a contract. Paid crisis jobs are deferred from the first release; ordinary jobs retain the existing single contract slot. The journal provides direct attack access to command sites, so taking a courier job cannot block crisis completion. Paid missions snapshot their targets and terms on acceptance.

### Enemy identity and combat scope

First release uses existing credited ancient artwork and equipment with one explicit skeletal trait version: immunity to morale changes and morale-triggered retreat. Existing fatigue rules remain; bleeding and other new trait systems are deferred. Audit every ability interaction before granting these traits; ordinary humans and legacy ancient battles keep their saved rules.

Roles are shield legionaries, rear-rank pikemen, armored guards, and a commander with a distinctive existing loadout. A commander aura is deferred. Give players tactical answers through flanking, shields, armor damage, and killing the commander. Avoid broad weapon immunity that invalidates an existing company.

Do not include resurrection, corpse spawning, spellcasting, or resurrected named company members in the first release. Those would require additional combat-state, AI, and persistence work. Boss fights are distinct through formations, equipment, and a bounded commander trait rather than overwhelming health pools.

### Resolution and rewards

Victory requires all three commanders defeated and all occupied or besieged settlements liberated by the company. Killing commanders stops new hosts but does not automatically reopen their occupied settlements. Remaining roaming hosts become finite cleanup threats; they cannot create new occupations after all commanders fall. Waiting never grants victory, reopens towns, or lets a coalition finish the crisis for the player. Escalation reaches a bounded peak instead of increasing garrison strength forever. Company destruction follows the existing game-over rules; surviving companies retain a recovery path and unfinished liberation objectives.

Each commander has a one-time fixed reward. Final victory grants a relic selected from existing equipment with bounded permanent bonuses, plus crowns and renown. First release grants one deterministic generated item, with a pending claim if the stash is full; an item chooser is deferred. Credit player contribution separately from NPC accomplishments; no player loot, experience, or payment for unparticipated NPC battles.

Persist town devastation, faction casualties and relief contributions, company service records, and rebuilt settlements. Define contribution by successful actions, not accepted jobs, to prevent farming credit by abandoning missions.

## 3. Recovery links the stories

Publish an aftermath report: commanders defeated, towns saved or devastated, factions that supplied aid, and rewards earned. Recovery jobs restore trade and modestly speed rebuilding. Economy penalties decay rather than stacking permanently.

The war motive is selected from the actual aftermath: disputed reconstruction costs, a poorly defended frontier, unpaid aid, or a faction claiming land in return for its sacrifices. Undead outcomes influence starting war exhaustion, defense reserves, and contested objectives within bounded ranges. A faction hit hard by the invasion must remain viable; a successful undead campaign must not erase the second crisis.

For the later war release, select one war between the existing rival pairs: Western League versus Eastern March, or Highland Clans versus Southern Sultanate. The other two factions stay neutral and maintain trade refuges. Aftermath changes the pair's selection weights and war motive; it does not create uncontrolled four-way warfare.

## 4. Broken Crown: faction war

### Allegiance and diplomacy

War warning shows both sides, their claims, initial fronts, and the expected effects of joining. The Western League's existing allied status is goodwill, not an automatic enlistment.

The company can sign with either side or remain independent. Signing clearly lists enemy patrol hostility, payment benefits, access restrictions, and leaving terms. Neutral relief and trade jobs remain available. Taking an explicitly hostile military job has a visible reputation consequence even without a formal pledge.

Use separate faction-to-faction diplomacy and faction-to-company reputation. Reputation affects prices, recruitment availability, contract eligibility, and patrol behavior through documented thresholds. Restrict military commissions in enemy settlements before restricting civilian essentials. Do not make a diplomatic choice strand the company without food or repair options.

Allow leaving service with a defined penalty and a short cooldown. Blocking instant side switching prevents collecting both sides' victory bonuses. No silent confiscation of inventory or retroactive change to accepted contract rewards.

### Fronts and campaigns

Choose two or three connected frontier objectives on the road graph. Only owned settlements neighboring the contested front are eligible for capture; distant enclaves cannot appear through a random roll.

Separate normal road patrols from capped campaign armies. Patrols continue hunting brigands; campaign armies have an explicit home, target, troop roster, supplies, and recovery schedule. First version uses at most two campaign armies per belligerent and three concurrent sieges. Every campaign army has a inspectable target and strength.

Capture sequence: approach, establish siege, reduce defense, resolve battle, occupy. Towns cannot flip because a patrol merely passes nearby. Siege relief and supply missions alter visible defense/supply values. Blockaded towns reduce trade while retaining essential civilian services.

Retain automatic tactical battles on the current field. Siege missions represent a field assault or relief outside the walls with allied guards, rather than adding climbable walls, siege engines, or a second combat engine. Display that premise honestly.

### Player military jobs

- Escort supplies to a siege army or defend a military convoy.
- Intercept a campaign army before it reaches its target.
- Break a siege alongside local defenders.
- Join an assault against a fortified garrison.
- Recover a recently occupied settlement before its defenses rebuild.

Use wages or a retainer plus a completion payment for long missions. Calibrate payments against wages, tools, medicine, expected armor damage, travel time, and existing elite contracts. Do not require delivering cargo beyond current capacity.

### Ownership and political borders

Persist an owner for every settlement, initially matching the current four factions. A captured settlement records its previous owner, current owner, capture time, occupation period, and garrison. Government affects patrol reinforcement, employer identity, local diplomacy, military recruitment, and trade conditions.

Keep local backgrounds, cultural equipment pools, industries, and terrain unchanged. A new government's soldiers can use their faction equipment while local merchants retain regional stock. Add a limited military recruitment offer rather than replacing every ordinary recruit.

Derive political territory from fixed settlement influence cells clipped to the existing world bounds. Color each cell by current owner; adjacent same-owner cells merge visually. Draw this separately from terrain and geographic labels. A capture updates the cell's political control while region names and geographic borders remain available as a map mode.

Ownership is the source of truth; the map overlay is a derived view. Use a separate influence-cell adjacency graph for border checks, alongside the road graph for campaign movement. Select front objectives requiring plausible adjacency and road access. No procedural relocation of settlements or roads.

### Finishing the war

Track faction exhaustion from troop losses, sieges, supply failures, and elapsed active days. Negotiations begin at a bounded exhaustion threshold or decisive objective outcome. At the maximum duration, force a settlement rather than an endless war. A decisive player battle can produce early peace.

Resolve territorial terms from actual control and completed objectives with a strict first-release cap of three permanent settlement transfers. Protect at least one core city per faction; there is no faction annihilation in this version. Temporary occupation need not guarantee permanent annexation; display provisional and final control distinctly.

The treaty records new ownership, company reputation, rewards, and a campaign summary. Winning-side service can grant a named-quality reward or limited market privilege. Independent relief service earns smaller rewards and goodwill from saved towns. No passive victory payout for merely signing a contract.

Patrol home loss must rebase survivors to a valid friendly city. Reinforcement, reforming armies, route caches, contract issuers, and caravan destinations must use current ownership. Existing civilian contracts stay completable at their original town despite capture; impossible military jobs end with a clear outcome and defined compensation.

## 5. Persistence and simulation design

Suggested modules: `crisis-director.js` for lifecycle and seeded scheduling; `undead-crisis.js` for fronts and commanders; `politics.js` for ownership, diplomacy, and reputation; `war-campaigns.js` for armies and sieges; `crisis-ui.js` for reports and journal. Keep orchestration in the engine while moving new rules out of its already large implementation.

Saved state includes a crisis schema version, phase and phase deadlines, seeds, readiness latch, fronts, command sites, resolved objective IDs, contribution ledger, aftermath summaries, settlement ownership, conditions, reputation, war armies, sieges, exhaustion, and treaty. Store stable IDs rather than copied world definitions. Bound active entities and report history to preserve the existing 4 MiB import limit.

Integrate updates into the existing fixed quarter-hour steps with an explicit documented order: advance clock and movement; update supply and armies; resolve contacts/sieges; apply objective outcomes; evaluate phase transitions; emit reports. Define tie handling for arrival, rescue, and siege expiry on the same step. Stop phase transitions during active battles; resolve an already-started battle from its immutable snapshot.

Getters and UI rendering must not schedule events, advance random streams, or grant rewards. A single result handler applies each objective outcome once, keyed by crisis and encounter ID. No double capture, double commander reward, or duplicate payment after reload/import.

Add explicit battle encounter types and snapshot crisis ID, faction, objectives, allied units, traits, and battle rule versions. Retreat preserves commander/army state under a documented policy and does not reroll equipment or rewards. Use the existing encounter grace period after battle.

Migration: old saves receive default ownership, no retrospective devastation, and a dormant director initialized at their current campaign time. Eligible veteran saves receive a full warning after a seeded grace delay. Never activate a crisis while importing an existing battle or invalidate an accepted contract. Validate unknown IDs, ownership, troop indices, deadlines, duplicate reward claims, and impossible phase combinations; do not mutate the input save.

## 6. Player-facing information

Add a compact world banner for phase, days remaining, and major threats; a crisis journal for objective locations and outcomes; and a political map mode. Settlement panels show geographic region, current ruler, occupation status, siege deadline, and economic consequences. Patrol panels show allegiance, employer relationship, current campaign goal, and troop losses.

Warnings and reports use text/icons as well as faction colors. All critical objectives and threatened towns appear in the existing destination list, so progress does not require precise canvas tapping. Tablet controls need readable targets and no hover-only information. Avoid interrupting every quarter-hour with a modal; show one phase notice and consolidate ordinary reports.

## 7. Implementation order and acceptance gates

1. **Ashen access and persistence foundation.** Add settlement access states, engine-level service guards, migration, explicit undead encounter routing, and immutable battle context. With the crisis dormant, existing gameplay and tests remain unchanged. Lockdown blocks every settlement service, survives reload, preserves underlying town data, and handles arrival or a company already inside. Defer dynamic ownership and diplomacy to the war release.
2. **Director and journal.** Implement eligibility, seeded warnings, lifecycle, recovery, contribution ledger, and saved reports. Verify deterministic scheduling and no rerolls or duplicated transitions under split ticks/reloads.
3. **Complete and ship Ashen Winter.** One front, a commander, roaming host, settlement lockdown, liberation, recovery floor, reward, and resolution through the actual UI. Paid crisis supply missions are deferred. Then expand to three commanders and bounded multi-front simulation. Validate save compatibility, difficulty, tablet UI, offline upgrades, and all existing tests before this first release. Save aftermath for the future war; no war warning runs until that feature ships.
4. **Later release: political foundation and war slice.** Add state-aware ownership, diplomacy, reputation, and home-city rebasing; then one rival pair, one frontier, campaign armies, a siege, ownership transfer, and peace. Test neutral, pledged, and depleted-company paths before expanding front counts.
5. **Permanent consequences and visual borders.** Dynamic political overlay, local services and recruitment, supply effects, occupation recovery, treaty transfers, and aftermath-linked war selection. Verify the whole undead -> recovery -> war -> persistent peace sequence.
6. **Balance, compatibility, and offline release.** Multi-seed simulations, player walkthroughs, old saves/active battles, tablet UI, offline worker upgrade, and current regression suite. Regenerate the offline cache only with the final implementation and include every new module.

Each milestone must deliver a runnable, tested slice. Do not ship war warnings that point at unfinished ownership or resolution mechanics.

## 8. Validation and tuning

Required automated coverage:

- Eligibility, warning lengths, scheduling latch, recovery, and fixed crisis order; no unsupported phase overlap.
- Identical outcomes for identical seeds under one long tick versus quarter-hour ticks, with the same player actions; pause/background behavior unchanged.
- Save/reload between warning, siege, battle action, reward, capture, and treaty steps; repeated imports preserve outcomes without mutating source saves.
- Player and NPC kills, retreat, destroyed armies, commander defeat, warning deadlines, and bounded escalation. NPC activity, waiting, and commander kills alone cannot reopen occupied towns or finish Ashen Winter.
- Contested objectives protected while a player battle is active; no NPC double resolution or free player rewards.
- Ownership and reputation applied consistently to patrols, recruitment, contracts, prices, home cities, and political overlay.
- Lockdown rejects every service at engine and UI levels; close existing panels, handle being inside at lockdown, stop arrivals outside, suspend turn-ins, and prevent caravan delivery bypasses. Liberation restores access once without resetting stock, equipment, named buybacks, accepted civilian contracts, or ordinary camp generations.
- Caps on entities, loot, allied deployments, report history, and save size; bounded costs for map rendering and world ticks.
- Old active battles preserve their prior rules; new undead traits and political battle outcomes affect only supported new snapshots.

Run at least 100 seeded campaign simulations with inactive, independent, and pledged player policies. Simulations assess duration bounds, variety, faction survival, resource accessibility, and economic collapse; they do not establish that real-player combat is balanced. Follow with representative developed companies, including ranged-heavy, shield-heavy, and mixed mounted groups.

For the Ashen release, play through full undead victory, prolonged nonintervention, a heavily depleted company rebuilding for liberation, and commander defeats with occupied towns still locked. Verify recovery through existing camping/foraging and accessible settlements without an additional camp economy. Later, validate a pledged war victory and a neutral survival campaign, including recovery between crises. Verify offline reload in every major phase and browser behavior with no missing resources or exceptions. Physical iPad Safari remains a separate device check.

## Scope decisions

First release: Ashen Winter only, with three randomized undead commanders, capped hosts, settlement lockdown, player liberation, bounded occupation, existing recovery paths, rewards, and saved aftermath. Subsequent release: one rival-pair war, meaningful reputation, settlement capture, political borders, and a permanent treaty.

Defer infinite cycles, faction extinction, four-way wars, player-owned towns, siege machinery, diplomacy negotiations as a separate minigame, resurrecting fallen companions, and new terrain destruction. None is necessary to fulfill the proposed endgame arc.

Largest risks are ownership inconsistencies, save compatibility, rewards applied twice, endless simulation loops, and difficulty overtaking company recovery. Address those in the foundation and complete slices before expanding encounter variety.
