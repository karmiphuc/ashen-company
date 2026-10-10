# Legendary blacksmith: The Rekindled Forge

Implemented in **0.52.0**. The user's newer accumulation request supersedes the earlier replacement-only design.

## Discovery and side quests

Owning five named/famed physical item copies reveals Odran in Ironford on the next safe daily check. Stash, living brothers' active/reserve equipment and accessories count. Existing saves receive a first safe check; loading/previewing never mutates saves. Discovery is permanent even if items are lost. A persistent summons explains where to go, offers map/journal shortcuts and waits until combat and other dialogs close. Acknowledged directions remain in the journal.

The chain is independent of ordinary contracts, has no deadline and requires explicit acceptance and return to Odran for each stage:

| Stage | Objective | Reward |
| --- | --- | --- |
| Cold Hearth | Deliver 8 Iron, 6 Timber and 10 Tools | 400 crowns |
| Anvil in Chains | Defeat eight thieves and recover the anvil | 700 crowns |
| The First Temper | Defeat ten ancient custodians and recover the plate | 1,000 crowns |
| A Master's Oath | Kill the Collector champion and defeat his nine guards | Forge access, one free reforge, named sword |

Accepted encounter locations and rosters are deterministic, reachable and outside settlements/camps. Surviving troops retain injuries and equipment wear through retreat/reload. An escaped Collector must be fought again; a Collector killed before retreat stays dead. Quest objects are progression flags, independent of loot selection and stash capacity. The final sword is claimed separately and only once, allowing space to be freed first. Crisis occupations/blockades prevent forge services without deleting progress. Quest directions remain visible under fog without revealing surrounding terrain.

## Reforge operations

Both selections are **physical stash copies**, in the same category: body armor, helmet, weapon or shield. Every weapon class is compatible with every other weapon class. Mounts and attachments cannot be reforged. The donor is destroyed; the recipient keeps its artwork, skills, family, innate properties and current wear. The first operation is free, then each costs **1,000 crowns**.

* **Named → named:** add 1–3 random, distinct applicable donor bonus groups to the recipient's existing package. Damage's minimum/maximum/percentage components count as one group; armor protection components count as one group. Selected increments are added at full value, subject to visible bounds. There is no individual-stat picker. A campaign/operation/pair seed prevents rerolling by reopening or reloading.
* **Named → ordinary:** copy the donor's entire accumulated package. Incompatible range, throwing-capacity or shield-breaking bonuses remain identified as inactive metadata, and can activate on a suitable later recipient. This preserves the package when transferring across weapon classes.

Typed integer enhancements cover protection percentage/flat, damage percentage/minimum/maximum, equipment fatigue relief, accuracy, armor damage, penetration, head chance, ranged reach, throwing capacity, shield damage, skill-fatigue relief, armor signature defense/resolve/endurance, and shield melee/ranged defense/durability. Existing v1–v4 rolls and concrete named designs are extracted against their original unrolled baseline, including the older unique craftsmanship. Innate Fangshire defense remains a property of its design, not an extra transferable duplicate.

Percentage increments add above the original baseline, not multiply repeatedly. Absolute armor/shield damage is retained; throwing ammunition never refills. Body protection caps at 650, head at 500, weapon damage at 300, shield defense at 80, shield durability at 500, penetration/head chance at 100%; relevant equipped company stats cap at 300. Profile components have separate finite bounds, including +2 reach and +15 throwing capacity. The UI explains limits and marks inactive bonuses; full transfers show exact effective stats and cap warnings.

## Persistence and atomicity

A canonical `forge1:<catalog base>:<21 base36 components>` ID contains one bounded, flattened profile. It does not embed ancestors or parse display text. The resolver rejects unknown bases, wrong-category components, malformed/counterfeit encodings and out-of-bounds modifiers, then returns an immutable cached item. Repeated reforging keeps identities bounded; existing catalog and famed IDs are unchanged. Profiles represent equipment state, not a cryptographic anti-cheat provenance ledger.

Quotes are pure. Commit revalidates town access, quest unlock, selected copy indices, recipient mode, money, free entitlement, stash conditions and operation serial. A stale quote or double confirmation cannot destroy a second item. Only after complete validation are donor removal, recipient replacement, fee and entitlement committed. Reforged identities work through equipment, combat, saves, detail inspection, resale and buyback. Save validation checks the chain, deterministic encounters, surviving identities, durability and one-time reward/free-use flags. Saves without this feature load without an added field.

## Art and validation

The workshop is the unmodified CC0 [Medieval Blacksmith Isometric 2.5D](https://opengameart.org/content/medieval-blacksmith-isometric-25d) by feudalwars. It is shown at Ironford and in the forge UI. Source and SHA-256 are pinned in `assets/world/legendary-blacksmith-source.json`, with credits in `docs/art/ASSET-CREDITS.md`.

`tests/legendary-blacksmith.test.js` covers discovery, the complete chain, retreat/Collector outcomes, all existing named roll versions, full transfer and accumulating merges, stale/invalid transactions, wear/ammunition, equipment/combat/save/resale and malformed progression. Browser checks cover desktop/mobile selection, confirmation, actual commit, touch targets and overflow. The private recovery save is checked locally and is never committed.
