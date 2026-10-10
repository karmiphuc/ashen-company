# Player guide

[Documentation index](../README.md) · [Play the game](https://karmiphuc.github.io/ashen-company/)

## Travel and contracts

Drag the map to pan and pinch to zoom. Tap a settlement, camp or roaming band to inspect it. Double-click or double-tap to enter a nearby town or attack an enemy; distant targets start travel or pursuit. Tap open ground to travel there. A new travel order replaces the previous destination.

Use the world speed controls to travel or wait. Pause, menus and backgrounding stop world time; the campaign does not advance while the app is closed. Raiders can pursue and engage the company outside settlement safety. Camping or foraging in the wilderness can be interrupted.

Visit settlements for equipment, trade goods, food, tools, medicine and ammunition. Take contracts from their notice boards. **Market news** lists temporary events, armory shipments and shortages. Friendly shipment wagons travel on the map; inspect or follow them, and defeat their assigned attackers to protect the delivery.

The Marches contain nine regions and 48 settlements, with roads, camps and faction patrols. See [regional world rules](../world/REGIONAL-WORLD.md). Ashen Winter can close settlement services until liberation; see the [crisis rules](../world/ASHEN-WINTER-IMPLEMENTATION-SPEC.md).

## Recruit and prepare

Recruit companions from daily town offers. Fees, backgrounds, traits and talents appear before hiring; recruits arrive without equipment. See [backgrounds and talents](BACKGROUNDS-TALENTS.md) for current tiers and bonuses.

The company can hire 18 brothers, with up to 15 deployed and three reserves. Formation ranks determine starting positions. Move or swap a brother in the formation editor before combat; reserves keep their gear and receive wages but stay out of the fight. See [preparation and reserves](COMPANY-PREPARATION.md), including optional ammunition purchasing and automatic bandage preparation.

Level-ups grant attribute choices and perk points. Attribute rolls and talents persist across reloads; choices can be deferred. Each brother also has a combat role and skill preference. See [combat builds](COMBAT-BUILDS.md) and [tactical AI](TACTICAL-AI.md).

## Equipment and crafting

Inspect items in company slots, the stash, markets and battle spoils to compare stats, durability and special effects. Equip body armor, a helmet, weapon/shield sets, accessories and mounts. Head and body protection have separate condition; shields also wear in combat. Stashed and reserve items retain their own condition and ammunition state.

Settlement markets have finite stock, local prices and event effects. **Buy all** shows the affordable quantity and total cost before purchase. Marketplace stash tiles sell one copy immediately; battle loot must be claimed explicitly.

Open a settlement's **Armorer** for Ancient restoration, Direwolf fusion and Direwolf helmets. These recipes use ordinary matching stash materials, including worn or broken pieces. Review the fee, selected copies and result rules before confirming:

- [Ancient restoration](../equipment/ANCIENT-RESTORATION.md): three body pieces or two helmets; a quoted fee from restored bronze stats, bronze/steel outcomes, named chance and failure refunds.
- [Direwolf Moonfang](../equipment/DIREWOLF-MOONFANG.md): fuse Direwolf Hide and Direwolf Mail for 600 crowns; the same menu offers matching helmet recipes.
- [The Rekindled Forge](../equipment/LEGENDARY-BLACKSMITH-DESIGN.md): Odran's separate discovery, quests and named-item reforging.

Matching equipment can activate [set bonuses](../equipment/EQUIPMENT-SETS.md) and [three-piece completions](../equipment/THREE-PIECE-SETS.md). Named gear retains its generated identity and bonuses through normal saves, equip changes and supported buyback.

## Battles and recovery

Battles use generated hex terrain and automatic combat decisions. Choose a company tactic and individual roles, then use pause, speed or retreat as needed. Terrain, cover, armor, fatigue, morale, ammunition and weapon skills affect movement and attacks. Formation orders coordinate fighters without teleporting them or replacing the saved formation.

Fighters switch weapon sets and use carried remedies when appropriate. Each throwing bundle has separate charges; refilling spends company ammunition. Mounts add their own movement, charge or bite behavior. See [tactical AI and weapon skills](TACTICAL-AI.md) and [combat builds and mounts](COMBAT-BUILDS.md) for exact rules. Existing active battles retain their saved compatibility rules.

Victories can award crowns, supplies, experience and enemy equipment. Salvaged armor keeps its remaining condition. Fallen brothers' gear can be recovered after victory when storage permits. Inspect spoils before collecting them.

Camp for six hours to recover and repair using company supplies. Open settlements offer immediate Doctor and Smithy services, with bills shown before payment. Temporary injuries have specific penalties and recovery needs; wound treatment is separate from restoring hitpoints. See [injuries and care](TEMPORARY-INJURIES.md) and [retinue support](RETINUE.md).

## Saves and offline installation

Progress is stored on this device and does not sync. Use **Save / Menu → Export save**, keep the JSON backup in Files, and use **Import save** to restore it. Export before troubleshooting or travelling: the offline indicator confirms cached app files, not permanent save retention.

For iPad:

1. Open the game in Safari while online.
2. Choose **Share → Add to Home Screen**, enabling **Open as Web App** if offered.
3. Launch the Home Screen icon and wait for **Offline ready**.
4. Test closing and relaunching in airplane mode before relying on offline play.

Physical-iPad installation, airplane-mode launch and storage retention still require device verification. Browser offline checks are recorded in [verification history](../releases/VERIFICATION.md).

To update, reconnect and wait for **Offline ready**, then check the version/build in Save / Menu. Do not clear site data to update: it removes the company. See [offline update behavior](../development/RELEASES.md#commands-and-update-behavior).

## Scope

Combat is an automatic adaptation of Battle Brothers rather than its complete manual ruleset. Current faction patrols and Ashen Winter are implemented; the Broken Crown faction-war crisis and permanent injury/casualty recovery remain planned. See [future plans](../README.md#future-plans) and [injury research status](../research/INJURY-RESEARCH.md).
