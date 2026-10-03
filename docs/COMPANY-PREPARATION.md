# Company preparation and reserves

Version 0.47.3 raises hiring capacity to 18 brothers, with up to 15 deployed and three explicit reserve places. The existing three twelve-position formation ranks remain spatial choices, rather than roster capacity. Select a brother, then a formation or reserve slot to move or swap. Deploying a sixteenth brother is rejected without changing the company. New recruits fill available deployment places before reserve places. Formation and reserve changes remain locked during battles.

Reserve brothers stay out of combat, keep their equipment, health, morale and XP, and receive no combat XP or shared-loot reward. They continue receiving normal wages and consuming provisions. Battle results preserve reserves, including when every deployed brother falls. Such a company can deploy a reserve and keep playing. Old campaigns default to empty reserves and retain their original formations; active battles retain their existing participants and rules.

Two saved checkboxes are available in Company & equipment, marketplace Supplies, and Save / Menu:

- **Auto-buy ammunition:** buy all available affordable ammunition at normal local prices, regardless of current stores. No restock target is imposed. Existing town stock, crowns and the 10,000-unit carrying limit apply. Preparation runs on arrival/settlement entry, market visits, world waiting/resting, option changes and before or after combat. It refills throwing bundles using the existing paid supply rules. Repeated preparation against exhausted stock spends nothing.
- **Auto-equip bandages:** fill or upgrade one medical accessory slot per brother, using Surgeon’s Kits (56 healing), Medical Satchels (40) and Bandages (24), strongest first. Fielded brothers receive stash supplies before reserves. Occupied nonmedical slots are preserved, existing treatments are only upgraded, and exchanged treatments return to the stash with aligned inventory condition entries. Purchased and newly looted treatments are prepared automatically. These options do not buy medical items.

Both options default off for new and old companies, persist through saves, and cannot be changed during combat. Preparation does not alter active battle snapshots.

Verification covers affordability/stock/prices, ample stores and daily resupply, throwing bundles, carrying limits, arrival, bandage tiers/upgrade/consumption, actual hiring through the new limits, reserve swaps, complete fights with repeated save imports, a deployed-force wipe, old saves and malformed records. Browser checks exercise both actual checkboxes and reserve slot interactions, reload persistence, 390px overflow, and a battlefield showing fifteen company fighters with no reserves. A fresh offline reload checks the new controls and limits.
