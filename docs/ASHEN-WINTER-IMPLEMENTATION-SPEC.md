# Ashen Winter implementation specification

Status: implemented in v0.48.0 and integrated with v0.47.6 for release.

This specification takes precedence over the broader ENDGAME-CRISES-PLAN.md for Ashen Winter. Faction war, changing ownership, and political borders are a subsequent release.

## 1. Required player experience

Undead forces close settlements. A blocked settlement offers no civilian services until the company defeats its besieging force or occupying garrison. Waiting, NPC victories, or destroying a distant commander do not reopen it. Defeating commanders stops replenishment; liberating blocked settlements finishes the crisis.

The player sees where attacks are heading, when access will close, what force must be defeated, and what progress is needed for victory. Objectives are available without taking a paid contract. Existing camp, band, market, company, and save behavior remains unchanged outside the crisis. Accepting an ordinary job to a known blocked town requires a visible warning; its saved terms remain valid and turn-in waits for liberation.

## 2. Scope and default constants

Ship one Ashen Winter per campaign. Include three commanders, moving hosts, settlement lockdown, occupation, liberation, warnings, journal, saved aftermath, and one-time rewards. Reuse the existing Ancient Legion enemy archetypes, ancient armory, artwork, world roads, automatic battles, and allied deployment support. Do not introduce new races or a new equipment catalog.

Exclude faction war, dynamic rulers, new political borders, paid crisis contract types, survivor camp, resurrection, spells, walls, siege engines, new injury systems, and new relic art. Supply missions are deferred; ordinary civilian contracts still work at accessible towns. This keeps the first release focused on the complete lockdown/liberation loop.

Put initial balance values in one exported configuration object. These values are implementation defaults subject to measured tuning, not claims of established balance:

| Setting | Default |
| --- | --- |
| Earliest eligibility | Day 60 |
| Company eligibility | At least 6 living equipped members; average level of best 6 at least 7 |
| Equipped definition | Weapon and body armor present; no shield, helmet, mount, or specific class requirement |
| Delay after first eligibility | Seeded 7–14 days |
| Global warning | 7 days |
| Commanders | 3, one per front |
| Host spawn interval | 24 hours per living commander, beginning on activation |
| Active roaming hosts | At most 12 globally, 4 per front |
| Simultaneous approach/siege targets | At most 3 globally, 1 per front |
| Blocked towns | At most 12 globally, 4 per front |
| Minimum approach warning | 48 hours; increase to route travel estimate + 24 hours when greater |
| Siege before occupation | 72 hours after lockdown |
| Post-liberation protection | 72 hours |
| Town recovery conditions | 72 hours after liberation |
| Opening host / later host size | 20 / 24 enemies |
| Occupying garrison size | 24 enemies, never grows with time |
| Commander encounter size | 30 enemies including commander |
| Relief allies | At most 3 human militia; none for commander assaults |

Keep at least two geographically separated, reachable settlements open; all towns remain traversable destinations on the road graph even when services are closed. No town is permanently exempt by name. The blocked-town cap includes both sieges and occupations. A host must reserve capacity before starting a settlement approach. At the cap, further hosts patrol roads rather than locking more towns. No invasion-wide timeout, free coalition victory, or unbounded increase in garrison strength.

Use the existing party-size/level scaling only once when an encounter is generated, with final sizes capped as above. Do not apply scaling again at battle entry. Test these default encounters with eligible companies before release; adjust centralized values if required without weakening lockdown or adding automatic victory.

## 3. Campaign and town state machines

Campaign: `dormant -> scheduled -> warning -> active -> cleanup -> aftermath -> completed`.

- `dormant`: evaluate eligibility during world updates only.
- `scheduled`: latch eligibility and a seeded warning start. Later casualties do not cancel it.
- `warning`: snapshot fronts, commanders, encounter seeds, and activation hour; show seven-day countdown.
- `active`: living commanders generate hosts; hosts approach and close towns.
- `cleanup`: all commanders defeated. Cancel unsettled approaches, stop spawns, prevent new sieges, and require liberation of every already-blocked town. Remaining road hosts are optional finite encounters.
- `aftermath`: entered exactly once when commanders are defeated and blocked-town count is zero. Freeze contribution summary and grant final reward entitlement.
- `completed`: no further attacks. Keep aftermath and any unclaimed reward; do not schedule war in this release. Remaining road hosts disperse at completion without player loot or experience.

Town: `open -> threatened -> besieged -> occupied -> recovering -> open`.

- `threatened`: full services available; a moving host reserves this town and cannot close it before its warning deadline and physical arrival.
- `besieged`: all services blocked. The attacking host becomes the town encounter; it no longer also exists as an independent road battle.
- `occupied`: all services still blocked. At the siege deadline, replace the force with the snapshotted occupation roster/seed. This does not reroll loot. Occupation lasts until player victory.
- `recovering`: full services restored; protection and recovery expire after 72 hours.
- Defeating an approaching host returns its target to open and protects it for 72 hours. Defeating a siege or garrison enters recovering.
- Destroying a commander cancels that front's unsettled approaches but leaves its besieged/occupied towns locked. Road hosts from that front remain attackable but cannot start new settlement threats.

Never destroy settlement records, change ownership, reset market stocks, or change ordinary camp generations. Standard weekly market rotation continues under its existing rules; lockdown itself neither replenishes nor deletes stock. Existing settlement events may continue, but cannot bypass access restrictions.

## 4. Placement, movement, and escalation

Select command sites from existing ancient-compatible areas in Northern Highlands, Eastern Frontier, and Blackwater Basin. One front starts in each region, with a seed-selected site and commander identity. Use separate crisis IDs and encounter data rather than replacing normal sepulchers or accepted hunt targets. Verify valid terrain, in-bounds exterior positions, and road access.

Hosts follow road routes toward accessible target settlements. Rank connected candidates by distance and local strategic value, then use seeded tie selection. Do not repeatedly target the same protected town or reserve a town already assigned to another front. Expand through occupied front towns toward neighboring settlements; do not teleport across the map.

Spawn only when caps permit; advance a saved spawn index when a host is created. If capped, retry on the next fixed world step without accumulating missed waves. View rendering never consumes random values. Store host roster seed, troop identities, position, route progress, target, approach deadline, and spawn index.

NPC patrols can fight road hosts using the existing bounded simulation and preserve both sides' casualties. Reserve company-selected, pursued, or active-battle targets. NPCs cannot attack commander sites, resolve town liberation, or receive player credit. Blocked towns do not reinforce/reform human patrols; rebase recovering patrols to a nearest accessible friendly city if possible, otherwise leave them waiting with no free troops. Geographic faction ownership remains static.

## 5. Settlement access contract

Add pure `getSettlementAccess(state, townId)` returning status, `servicesAvailable`, reason, encounter ID, approach/occupation deadlines where applicable, and recovery end hour. Reject unknown IDs. Keep `townAt(state)` as a geometric lookup; it must not silently hide blocked towns.

`requireTown` must check settlement access as well as physical location. Audit commands that bypass it. All blocked attempts return a stable failure code such as `SETTLEMENT_BLOCKED` and a readable reason, without changing inventory, gold, stock, reward flags, or contract progress.

| Capability | Threatened/recovering/open | Besieged/occupied |
| --- | --- | --- |
| Enter town, market, buy/sell, buy-all | Allowed under existing rules | Blocked |
| Recruitment, doctor, smithy, stable purchases | Allowed | Blocked |
| Notice board and accept contract | Allowed | Blocked |
| Civilian completion/turn-in, including auto-arrival | Allowed | Blocked; preserve terms and cargo |
| One-time town mount reward claims | Allowed | Blocked; preserve entitlement |
| View map, inspect blockade, journal, manage company | Allowed | Allowed |
| Travel to exterior; start liberation battle | Normal destination behavior | Allowed |
| Camp and forage outside town | Existing rules | Existing rules; still consumes world time |

Market/recruit getters and quotes should return their established empty/unavailable shape when blocked, with access information supplied separately; do not change every call site's data shape gratuitously. Inspect-only content must not trigger stock writes or claim rewards.

Arrival at a blocked town stops outside `TOWN_RADIUS` and opens the exterior blockade panel. No automatic attack, turn-in, or `openTown` success. If a deadline closes the town while the company is within its radius, move it to a deterministic in-bounds exterior point, close existing service dialogs, stop travel, and pause speed with a single notice. Preserve an accepted contract and carried goods. Do not instantly place the company in hostile contact; give the existing encounter grace.

Exterior placement must avoid another town's service radius and immediate enemy contact. Search stable candidate offsets and use a validated fallback. Direct travel to town coordinates cannot restore service access; engine guards remain authoritative regardless of position.

## 6. Caravans and recovery economy

Do not launch a new civilian shipment from a blocked origin. Existing shipments can travel, but at a blocked destination stop at a fixed exterior holding point. Use a `heldBySiege` flag with saved hold start/position while preserving the existing shipment status and raider state. A held shipment cannot become delivered or add market stock.

Existing brigand attacks remain effective; siege holding alone never grants raid-cleared status or starts an arms-shortage loss. Destroyed shipments stay lost. Liberation permits a surviving held shipment to deliver on the next world step, with actual delivery time recorded once. Do not generate multiple overlapping shipments for the same town; skip new scheduled departures while a previous held shipment remains unresolved. Update caravan following, map presentation, and save validation for holding behavior.

Recovering towns reopen all services immediately. Apply a capped 10% food/supply buy-price increase for 72 hours; do not alter equipment sale prices, named items, or buybacks. Compose with existing town events through a single quote path, cap the combined recovery/event buy multiplier at 1.5, and expose the resulting price. No repeated recovery stacking. A pending town mount reward remains claimable after liberation even if its original appearance window has elapsed.

No new emergency camp. Existing forage provides food and existing camp provides slow healing even without medicine. Unblocked towns supply recruits and repairs; ordinary jobs supply wages. Include a depleted-company walkthrough proving these routes work without liberating a fortified town first. Failing that walkthrough is a release blocker to resolve through caps, target placement, and encounter tuning.

## 7. Battles and result application

Add explicit encounter types `undead-host`, `undead-liberation`, and `undead-commander` to encounter lookup, travel/pursuit, battle start, loot, finish, retreat, and save validation. Do not fall through to the ordinary camp-clear branch in `finishBattle`.

Snapshot crisis/encounter/front IDs, town or commander ID, force generation, seed, troop identities, ally roster, traits, reward entitlement, and rules version in the battle. Active battle data stays valid independently of later UI queries. World time does not advance during combat.

Skeletal units have `undeadTraitsVersion: 1` and ignore morale changes and morale-triggered retreat; use a fixed steady morale modifier. Humans, allied militia, existing ancient encounters, and old saved battles retain existing behavior. Keep current fatigue costs/recovery for this release. Do not introduce bleeding immunity as a feature when no applicable bleeding system exists. No resurrection or additional combat actions.

Commander identity is shown in its name and distinctive existing loadout. Defer commander aura to avoid an unspecified AI/ability system. Use ordinary current weapon skills and equipment so every company archetype has a viable response.

At victory, apply troop/equipment salvage and existing survivor damage first, then the crisis outcome exactly once. Liberation updates town access immediately when its result is claimed; no separate trip to an issuer is needed. Allies surviving without any company survivors must not award player victory. Retreat does not reopen towns, kill commanders, reroll loot, or refresh enemies. Persist surviving enemy troop identities and damage; the scene retains its original generation. No free world-time regeneration during repeated retries.

Reward defaults: host 150 crowns, liberation 300 crowns and 2 renown, commander 600 crowns and 3 renown, plus existing condition-aware enemy salvage. Do not add a second camp/band reward on top. Final reward is 1,000 crowns, 5 renown, and one deterministic named-quality item selected from valid existing weapon/body-armor/helmet bases. These amounts are centralized tuning values.

Final equipment entitlement waits if stash space is unavailable and can be claimed later from the journal without repeating currency/renown rewards. Do not overwrite gear, discard loot silently, or require a new reward chooser UI. Persist resolved objective IDs and reward claims; rendering, repeated finish calls, reload, or import cannot pay again.

## 8. Clock integration and ordering

Both `tick` and `advanceStationaryTime` must call a shared world-step helper. Camping and foraging cannot bypass escalation. Preserve their existing interruption behavior; if lockdown displaces a company, return that interruption without also granting a completed rest/forage reward.

At each quarter-hour boundary: advance clock/upkeep and company movement; update director and host movement/deadlines; apply lockdown and displacement; update caravans with the new access state; simulate patrol contacts/recovery; check player contacts; finalize arrivals using current access; evaluate crisis resolution; emit coalesced reports. Avoid the current pre-clock auto-completion path for town arrival.

If arrival and lockdown occur on the same step, lockdown wins: no service use or contract payment. If a host is reserved for player contact and arrives at its target that step, start the correct liberation encounter rather than resolving it twice. If the last commander dies, cleanup begins on result application before another wave can spawn.

Handle warnings and wave/deadline hours as fixed quarter-hour-compatible timestamps. Current campaign time is the only clock. Reading getters, importing, or closing menus must not advance it. Preserve existing pause/background behavior and break out of a multi-hour tick after a player encounter or mandatory lockdown notice.

## 9. Saved state and migration

Add `ashenWinter` with schema version 1. Use bounded, ID-based records:

```text
phase; crisisId; seed; latchedEligibilityHour;
warningStartHour; activationHour; completedHour;
fronts[3]: commanderId, sitePoint, defeated, nextSpawnHour, spawnIndex;
hosts[<=6]: id, frontId, generation, seed, troops, damage,
            route, routeProgress, point, targetTownId, arrivalNotBeforeHour;
towns[<=48]: status, frontId, encounterId, warningUntilHour,
            siegeUntilHour, protectionUntilHour, recoveryUntilHour,
            forceSeed, generation, survivingTroops, damage;
resolvedObjectives; rewardClaims; liberationCount; contributionSummary;
pendingFinalItem; aftermath;
```

Use explicit null/absence rules per phase and reconstruct only validated fields. Treat this schema outline as the required information, not permission to duplicate full immutable definitions. Keep report history bounded and ID counters within existing count limits. Preserve the current 4 MiB import limit.

Old saves without this field receive dormant state at their current time; initialization and eligibility evaluation occur on the next world update. No retrospective attacks, rewards, or automatic warnings on import. Existing battles remain valid and defer scheduling until world time resumes. New crisis saves persist schedules and outcomes exactly.

Validate faction-independent front IDs, settlement IDs, finite in-bounds points, quarter-hour-compatible deadlines, caps, troop indices, damage bounds, reward types, unique resolved IDs, and legal phase/status relationships. Active undead battles must match their saved force generation and unresolved objective. Validate new crisis state before validating battle references. Replace the validator's current camp-default location check with exhaustive encounter-specific checks. Reject corrupt state without mutating the supplied object or the running company.

## 10. UI and implementation files

Suggested pure modules: `crisis-director.js` (eligibility, phases, seeded scheduling), `undead-crisis.js` (fronts/hosts/towns/outcomes), `settlement-access.js` (service access projection), and `crisis-ui.js` (journal and banners). Export player actions through `engine.js`; UI must not mutate saved state directly.

Engine touchpoints: `createGame`, `requireTown`, quote/getter functions, contracts and `completeContract`, town mount rewards, `activateMapTarget`, `onArrival`, both time loops, `advanceCaravans`, patrol context, encounter lookup, battle routing/results/retreat, and `validateSave`/battle validator.

UI touchpoints: `app.js` sidebar, town dialogs, market/recruit/service/mount buttons, arrival results and clock notices; `map.js` town badges and host markers; journal; destination list; relevant styles. Add all new runtime modules to `tools/build-cache.mjs` and regenerate `sw.js` during implementation.

Threatened town: amber text/icon and countdown. Blocked town: red skull/lock icon, “Settlement closed — liberate to restore services,” enemy count, siege/occupation status, and exterior travel/liberation action. Recovering town: open status and remaining recovery time. Provide equivalent text in the destination list; color alone is insufficient.

Journal shows all three commanders, blocked towns, active warnings, defeated objectives, and reward claim state. Use one warning/activation/lockdown/completion notice per event, never per tick. No political border mode in this release.

## 11. Build sequence and acceptance tests

Implement in this order:

1. Save schema/migration, pure settlement access, and guard every town operation.
2. Shared world step, deterministic director, placement, and warning UI.
3. One host -> lockdown -> liberation vertical slice with save/reload.
4. Occupation, retreat survivors, caravans, patrol integration, and recovery.
5. Three fronts, commanders, cleanup, rewards, journal, and completion.
6. Balance walkthroughs, regression suite, offline build and browser checks.

Required release gates:

- Same seeded actions produce identical schedules, forces, captures, and rewards under split ticks and reloads. Getters do not change state.
- Every service row in section 5 is exercised in each town status. Include direct API calls, stale dialogs, one-time mount claims, and auto-completion on arrival.
- Lockdown while inside, arriving at the exact deadline, camping/foraging through deadlines, and held-caravan delivery cannot bypass the block.
- Occupied towns remain locked indefinitely without liberation. NPC wins and commander deaths do not reopen them. All commanders dead plus one blocked town cannot complete the crisis.
- Defeating the last commander prevents the next wave; liberation of the last blocked town grants completion exactly once. Claims retry safely when inventory is full.
- Host/siege/garrison identities, troop casualties, retreat damage, loot, and ordinary camp/contract records round-trip without resets or rerolls.
- Human patrols gain no troops from blocked cities; unblocked routes and cities still work. NPC resolutions grant no company rewards.
- Caps and reservation rules hold across at least 100 seeded nonintervention simulations. Waiting never ends the crisis; escalation reaches a bounded plateau with recovery access preserved.
- Walk through an eligible mixed company, ranged-heavy company, shield-heavy company, and depleted surviving company. Measure reward economics and meaningful battle difficulty.
- Existing tests pass. Add focused crisis/access/caravan/battle/migration tests; do not replace current tests with mocks that bypass engine integration.
- Browser walkthrough covers warning, closed settlement, blocked services, real liberation, occupation, retreat/retry, commander kills, cleanup, reward claim, and exported/imported saves. Verify offline reload and worker upgrade with no missing modules or exceptions.

Physical iPad Safari validation remains a separate device check. See VERIFICATION.md for executed automated and browser checks.


## Implementation notes

The saved director moves directly from cleanup to completed; its aftermath report and final reward entitlement are created atomically during result application rather than requiring a separately saved aftermath phase. Commander ranks snapshot existing enemy progression (capped at 2), while later hosts and garrisons cap at rank 1. Wounded besieging forces retain their troop identities, equipment, and wounds when occupation begins; the larger preset garrison replaces only an untouched siege force. Final equipment uses the existing generated famed-item mechanism.

## Crisis pressure revision (0.50.22)

The three commanders always carry independently seeded named one-handed weapons, shields, body armor and helmets. They have twice the ordinary commander health, +26 attack skill and +14 defense before their gear bonuses; ordinary champions have 1.4× health, +12 attack and +8 defense. All four equipped named trophies drop when the commander dies. Wounds and gear rolls persist across retreats.

Existing version-1 crises upgrade their reinforcement schedule on their next world update. Existing forces keep their sizes, surviving troop identities and wounds, including player and NPC battles already underway. New hosts use the larger version-2 sizes. Existing living commanders gain their named kit on their next engagement; an already-running tactical battle remains unchanged. Defeated commanders stay defeated and completed crises never restart. Town warning, blockade and open-settlement limits remain unchanged.
