# Endgame goals and Company Legacy

Design reference for [issue #174](https://github.com/karmiphuc/ashen-company/issues/174). The implemented inheritance chain is described below; the rival supply-route foundation is implemented; rival combat/progression, mentor/charter inheritances and defeat salvage remain planned.

## Why this exists

Completing Ashen Winter should be a milestone with a satisfying exit into a different campaign. The current crisis reward is not being rebalanced in this feature. The proposed two complementary systems are persistent competitors that create current-campaign pressure and retirement that creates a reason to restart.

## Implemented: three entombed legends and three complete sets

After completing Ashen Winter, finish active contracts and stop in an open settlement. Open **Chronicle → Plan your legacy**, or **Save / Menu → Company Legacy**. Stow the equipment you want to preserve, then assemble exactly three loadouts from actual stash copies. Each requires a helmet, body armor, mount and melee weapon: one-handers require a shield; two-handers leave the shield slot empty. Each loadout can carry up to two optional attachments. These are complete equipment loadouts, not a requirement to use a curated matching armor family. Named and ordinary gear are both eligible. Ranged/throwing weapons, accessories, reserve weapons and extra cargo are outside this bounded package.

The picker shows three compact columns with item previews. Choosing a copy disables it elsewhere; selecting a two-hander clears/disables its shield. No physical copy can be inherited twice, although separately owned identical items are valid. Review all three sets before the explicit retirement confirmation. Retirement exports on request and writes one local retired-company backup before replacing the active save. A failed archive or active-save write preserves the live company; a later retirement replaces that backup. Exports are the durable cross-device safeguard.

**Lore:** fallen legends were entombed with their equipment. A new company follows three tomb quests to unveil their legacy, one complete set at a time. New recruits, gold, XP, food and the world begin normally. All three sets initially live outside usable inventory; they cannot be sold, equipped or forged before being earned.

| Tomb quest | Report to | Earliest challenge | Opposition | Reward |
| --- | --- | --- | --- | --- |
| The First Fallen | Oakwatch | Day 15, 75 renown | One warden wearing set I and three mounted undead guards | Complete set I |
| The Silent Procession | Ironford | Day 30, 150 renown | One warden wearing set II and five mounted undead guards | Complete set II |
| The Last Cavalcade | Ravenfell | Day 60, 300 renown | Three elites wearing the exact three sets and six mounted undead guards | Complete set III |

The chronicle reveals each site once its date and renown gates are reached, with an action to navigate there and engage on arrival. Win the actual battle, collect the result, then report to that quest’s open settlement while stationary. The action becomes lime green when ready. These quests occupy no ordinary contract category. There are no extra registration/material fees; combat, recovery, upkeep and progression gates are the costs.

The guardians use existing undead traits, armor, weapons and mounts; no new races or hidden player-build copies. Their authored veteran ranks rise from 1 to 3 to 5. The three final elites carry the original item identities, including prefixes/suffixes, forge attributes, both attachments, shields and mounts. A second attachment grants the guard Layered Armor solely to make that loadout legal. Matching set and attachment effects follow normal combat rules, and equipment fatigue is charged. Selected wear is preserved for their starting gear; retreat retains casualties, HP and component damage for retries. Guards do not heal or respawn on retreat. Battle saves enforce the authored roster and exact gear ownership.

**Duplicate protection:** all tomb equipment and supply/gold loot is suppressed. Keeping the original named identities on the guards preserves every combat bonus; changing them to ordinary item IDs would discard those rolls. Tomb turn-ins are the only gear reward. The final guards may wear sets I and II after those sets have already been unveiled, but they do not drop a second copy. Ordinary battle XP and brother casualties still apply. No inherited armor is repaired or rerolled: quest rewards use the retirement snapshot, not damage accumulated by guardians.

Each reward requires space for its whole loadout. A full stash leaves the quest/reward pending without partially adding pieces or advancing the stage. Claims advance a single stage and cannot repeat. The saved record retains all three snapshots for the chronicle, with a bounded generation and source seed/day/renown. A later retirement requires completing its campaign’s crisis and selecting three new owned sets; histories do not automatically add old rewards.

The separate [Frozen Vigil warrior chain](../world/LEGACY-WARRIOR.md) remains available: it preserves one top survivor and eventually recruits him after the solo challenge. It does not turn these tomb guards into copied player brothers.

## Compatibility: existing one-to-four-item legacies

Existing single-heirloom (version 1) and heirloom plus up to three stash keepsakes (version 2) campaigns retain their original four-step chain and pending rewards. They are not silently expanded into three sets or rewritten. Their fourth turn-in still requires day 30, 150 renown, three prior ordinary contracts and three difficulty-2+ camp/band wins, and restores the original package atomically. Existing saves without inheritance remain unchanged. New UI retirements create version 3 of the optional company-legacy record, with three loadout snapshots, stage, victory flag and bounded guardian wear; no global save/combat version bump is needed. Offline exports are not server-enforced anti-cheat.

## Planned: broader inheritance choices

The proposed retirement menu eventually offers exactly **one** of these choices:

- **Heirloom:** implemented above. A future design may offer gradual restoration instead of a seal, but must preserve original identity and existing affix limits without granting an endgame arsenal at campaign start.
- **Veteran mentor:** a retired survivor provides training/advice outside the combat roster initially. Define limited costs and benefits before implementing; do not transfer a level-30 fighter into early battles.
- **Company charter:** a distinct starting origin, such as mounted hunters with fewer recruits and higher upkeep. Tradeoffs should alter decisions rather than add permanent damage or gold.

Other proposed legacy unlocks are banners, backgrounds, unusual origins and challenge contracts. Company history now records those retirement memories in the gallery below.

Defeat could record achievements and allow salvage only for an heirloom actually evacuated. Neither defeat inheritance nor salvage is implemented: no automatic post-wipe replacement item or revival. Cross-device legacy storage, exact mentor effects and charter balance need their own design and migration tests.

## Planned: pressure during a continuing campaign

[Rival companies](../plans/RIVAL-COMPANIES.md) now persist and establish supply routes after Ashen Winter; their [first milestone](../world/RIVAL-COMPANIES.md) has normal upkeep and no battle/contract rewards yet. They should earn their later growth through travel, contracts and real combat. Hostility escalates visibly and offers negotiation, intimidation, avoidance or fighting. Their actual roster and equipment determine an ambush.

Endgame competitors can race the player for announced rare bounties, ancient expeditions or lucrative commissions, with explicit ownership/cooperation rules. Do not silently remove accepted player quests or inflate all enemies. The original longer-term crisis sequence remains Ashen first, then a faction war that can change borders; it is a separate design and not implemented by this legacy chain.

## Validation

Exercise three real encounter/turn-in sequences, exact final-elite gear and both attachment effects, no duplicate loot, full-stash atomic claims, age/renown gates, wrong or closed settlements, ordinary-contract independence and repeated turn-ins. Simulate normal and realtime actions, save/reload active battles and casualty/damage persistence across retreat. Reject malformed slot types, shield/two-hander conflicts, impossible guardian wear, duplicate indices, stale or tampered quotes and forged battle equipment/loot. Retain the old four-step engine and browser tests for versions 1 and 2. Browser coverage includes cancellation, storage failure/retry, backup export, compact touch layouts and final tomb navigation/reward persistence. Run production build and existing release/offline checks; do not manually bump release numbers.

## Implemented: company-history gallery

Open **Chronicle → ◇ Past banners**. Compact cards show retirement day, renown, Ashen victory, tomb sets unveiled during that campaign and surviving roster count. Expand a card for each brother’s name/level, the Frozen Vigil survivor and the names of the chosen inherited gear. These are retirement snapshots, not live quest progress or a complete lifetime death ledger; only brothers still present in the retiring roster can be recorded. No rewards, extra gear or combat bonuses come from history.

Up to twelve recent retirement summaries persist separately on this device. Each new retirement records its summary before replacing the active save, with rollback attempts for both history and the latest full backup if saving fails. Invalid history blocks retirement rather than silently erasing memories; active gameplay/saves remain independent. Existing latest-retirement backups are read through normal save validation and shown without requiring a new retirement. That older summary is retained when the next retirement creates the history store. Histories do not sync between devices. **Export history** downloads summary JSON for safekeeping; it cannot be imported as a playable campaign. **Retired save** still exports the latest complete retired campaign, and older complete saves require the player’s own exports. Clearing browser storage removes local memories.

Rival combat and progression, company charters, mentors and faction war remain separate planned features. The gallery deliberately grants no account-wide power before those systems have fair progression rules.
