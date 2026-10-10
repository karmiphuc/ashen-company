# Endgame goals and Company Legacy

Design reference for [issue #174](https://github.com/karmiphuc/ashen-company/issues/174). The implemented inheritance chain is described below; rival companies, mentor/charter inheritances and defeat salvage remain planned.

## Why this exists

Completing Ashen Winter should be a milestone with a satisfying exit into a different campaign. The current crisis reward is not being rebalanced in this feature. The proposed two complementary systems are persistent competitors that create current-campaign pressure and retirement that creates a reason to restart.

## Implemented: one sealed heirloom and four side quests

After completing Ashen Winter, stop in an open settlement, finish active ordinary contracts and open **Chronicle → Plan your legacy**, or **Save / Menu → Company Legacy**. Stow a named weapon, body armor, helmet or shield to make it eligible. Select exactly one physical stash item. Named attachments, accessories and mounts are excluded from this first inheritance implementation.

The confirmation explains that retirement ends the current active campaign. It offers an export before proceeding. The app writes the retired company to a single local backup (`ashen-company-save-v1-retired`) before writing the new active save; if either write fails, the live company stays unchanged. **Save / Menu → Export retired company** exports that backup. A later retirement replaces the backup. Exports remain the durable way to preserve older companies or move between devices.

The new campaign has normal starting recruits, resources and world state. Its heirloom is sealed outside the inventory: it cannot be equipped, sold, merged or transferred. This deliberately gives it no early combat advantage rather than inventing a second weakened-item formula. Complete these sequential side quests:

| Step | Where | Requirement |
| --- | --- | --- |
| A New Banner | Oakwatch | Consume 100 crowns and 10 provisions |
| The Sealed Reliquary | Ironford | Consume 500 crowns, 4 iron, 4 timber and 5 tools |
| An Honest Reputation | Stonebridge | Complete 3 ordinary contracts after step 2 |
| Earn the Old Name | Ironford | Win 3 difficulty-2+ camp or roaming-band battles after step 3; reach day 30 and 150 renown |

Each step is turned in at its settlement while services are open and the company is stationary. The chronicle shows the current objective and progress, a lime-green ready action, and a button to locate its settlement. A blocked settlement preserves progress. This side chain does not occupy any of the three ordinary contract categories.

Progress is earned only during the relevant step. Existing completions do not count retroactively; blacksmith and crisis side quests do not count as ordinary contracts. Battle progress is recorded on successful result collection, not on starting a fight. Retreats, defeats, difficulty-1 fights and story encounters do not count. Stored IDs prevent duplicate credit; counters stop at three.

The fourth turn-in requires a free stash slot. It restores precisely the selected item ID and condition: original named rolls, prefixes/suffixes, forge profile and attachments intrinsic to that item remain as encoded by its identity. It does not copy separately equipped attachment items, reroll affixes, repair the item or add bonuses. Normal equipment eligibility, fatigue, affix limits and legacy merge restrictions continue to apply. Restoration can happen only once per campaign.

The chain stores a bounded generation number and prior company seed/day/renown. No roster, XP, gold, retinue, cargo, contracts, other gear or permanent combat bonuses are granted at campaign start. A separate [Frozen Vigil quest chain](LEGACY-WARRIOR.md) can later awaken and recruit one preserved top survivor after a solo challenge; this is an earned quest reward, not an immediately usable inherited fighter. A later retirement again requires finishing that campaign's crisis and selects one item, so generations do not stack power. Ordinary new-game creation remains available without inheritance.

Existing saves with no legacy field remain unchanged. Legacy saves validate stage sequencing, unique bounded progress IDs, named item identity, wear and source history. Current combat and save versions do not change merely to add this optional subsystem. Local exported saves can be restored; this is an offline game, not a server-enforced anti-cheat system.

## Planned: broader inheritance choices

The proposed retirement menu eventually offers exactly **one** of these choices:

- **Heirloom:** implemented above. A future design may offer gradual restoration instead of a seal, but must preserve original identity and existing affix limits without granting an endgame arsenal at campaign start.
- **Veteran mentor:** a retired survivor provides training/advice outside the combat roster initially. Define limited costs and benefits before implementing; do not transfer a level-30 fighter into early battles.
- **Company charter:** a distinct starting origin, such as mounted hunters with fewer recruits and higher upkeep. Tradeoffs should alter decisions rather than add permanent damage or gold.

Other proposed legacy unlocks are banners, backgrounds, unusual origins and challenge contracts. Company history could record roster, notable achievements and signature gear. The full retired save already preserves those facts locally, but a dedicated history gallery is not implemented.

Defeat could record achievements and allow salvage only for an heirloom actually evacuated. Neither defeat inheritance nor salvage is implemented: no automatic post-wipe replacement item or revival. Cross-device legacy storage, exact mentor effects and charter balance need their own design and migration tests.

## Planned: pressure during a continuing campaign

[Rival companies](RIVAL-COMPANIES.md) should earn their growth through travel, contracts and real combat. Hostility escalates visibly and offers negotiation, intimidation, avoidance or fighting. Their actual roster and equipment determine an ambush.

Endgame competitors can race the player for announced rare bounties, ancient expeditions or lucrative commissions, with explicit ownership/cooperation rules. Do not silently remove accepted player quests or inflate all enemies. The original longer-term crisis sequence remains Ashen first, then a faction war that can change borders; it is a separate design and not implemented by this legacy chain.

## Validation requirements

Exercise all four actual engine turn-ins, contract completion and battle-result hooks, old-save compatibility and reloads between steps. Check repeated actions, stale retirement selection, invalid identities/counters/conditions, full stash, closed towns and insufficient materials. Browser coverage must exercise explicit retirement confirmation, cancellation, storage failure, backup export access and touch layout on iPad. Use existing production release/offline checks; do not manually bump versions.
