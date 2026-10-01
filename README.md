# Ashen Company

An offline mercenary-company campaign game for desktop and tablet browsers. Lead a band across the Grey Marches, take delivery and brigand-hunt contracts, recruit and outfit companions, and fight automatic tactical battles. Ashen Company uses adapted *Battle Brothers* / Legends artwork; see [asset credits](docs/ASSET-CREDITS.md).

Play at **https://karmiphuc.github.io/ashen-company/**. No account, server, external fonts, or runtime dependencies are required.

## Play

- Drag the map to pan and pinch to zoom. Tap a settlement, hostile camp, or roaming band to select it. Double-click or double-tap to enter a town or attack an enemy directly. Distant targets start travel or pursuit, then open the town or begin combat on arrival. Open ground can be tapped to set a destination; a new travel order replaces the previous action.
- Visit settlements to buy and sell equipment, trade goods, food, and campaign supplies; recruit up to 12 brothers; and take courier, supply, or brigand-hunt contracts.
- Every settlement has a **Doctor** and **Smithy**. Heal one brother or everyone for 1 crown per missing hitpoint; repair one brother's equipped body armor and helmet or the whole company for 1 crown per 2 missing durability, rounded up per brother. Bills are shown before paying. Both services are immediate and use the town's supplies, leaving your medicine and tools untouched. Stashed gear is not repaired; weapons and shields do not lose durability. Camp remains the six-hour option using company supplies.
- Hiring offers three distinct companions per town each day, with their fee, stats, background bonuses, and traits visible before purchase. Ten backgrounds give small starting edges; each new hire gets one positive trait and may have one mild trade-off. No hidden flaws or paid tryouts. Offers stay fixed when reopening or reloading; hired candidates disappear until the next day's board. Fees range from 120 to 180 crowns, with the usual five-crown level-one wage and one food per day. Recruits arrive without equipment. Existing companions keep their previous stats. See [hiring research and design](docs/HIRING-RESEARCH.md).
- Open **Market news** to find temporary harvests, caravans, fairs, armorer shipments, and militia musters across the Marches. Each town has an event every 12 days, lasting three or four days; cities receive regular armorer shipments. Notices show price and stock effects and their final day. Basic gear remains readily available, while better equipment comes from a small weekly selection and finite extra shipments. Completing a courier job has a 50% chance to add one item to the destination armory, recorded in the chronicle. These items still need to be purchased.
- Armorer shipments travel as friendly wagons on the world map. They move at half their previous speed, taking 60 world hours for a full journey. Existing travelling wagons keep their position and take twice as long to finish their remaining route. Select one to see its route, destination, arrival time, and any threatening band; double-tap or choose **Follow caravan** to accompany it. Assigned raiders physically leave their patrol and pursue the wagon. Reaching it starts a seven-hour rescue window; the wagon is lost only if its attackers are still in contact when that window expires. Clearing the assigned band before the attack also protects the shipment. Safe delivery adds finite equipment stock and starts its discount, which lasts at least 48 hours after arrival; a lost wagon leaves a four-day **Arms Shortage**, with scarcer gear and higher offers for ordinary weapons, shields, helmets, and armor. Bring spare loot or buy cheaply elsewhere to profit. Accessories and famed items keep their usual prices. World time pauses during battles and while menus are open.
- The Marches now cover roughly four times the map area, with 16 settlements. Three fixed brigand camps return after five days; 12 seeded wild camps relocate and regenerate their raiders after three days. Twenty-four hostile bands patrol the roads and frontier, including the original four small training fights. Raiders pursue the company outside settlement safety and automatically engage on contact. Fast travel slows to normal when a new pursuit is reported. Open roads give you room to escape; wilderness camping and foraging can be interrupted before granting recovery or supplies. A short grace period after a battle lets survivors disengage. Bands return 48 hours after defeat. The map does not simulate factions or generate a changing campaign.
- Inspect the company to equip armor, helmets, two weapon/shield sets, and two accessory pockets. The 96-item armory includes two-handed weapons, longaxes, pikes and polehammers, cleavers, flails, southern blades, throwing weapons, bows and crossbows, eight more body armors, six more helmets, and field medical supplies. Head and body armor have separate durability. Backgrounds affect a brother's starting combat stats. On level-up, choose three different attributes from eight; each has a saved +1 to +5 roll. You can defer the choice, and reloading preserves the same rolls. Every level after the first also grants one perk point. Choose from 19 perks, with stronger choices unlocking at higher levels. Points can be saved, and existing companies receive points for levels already earned.
- Six deterministic face profiles vary head, hair, beard, and body. The same face stays with its brother as equipment changes, and helmets align with the face and meet the armor at the neck.
- Tap equipment in the company slots or stash, trader inventory, or battle spoils to inspect its role, exact combat stats, and handling notes. All 96 items have descriptions. Choose where to equip an item from its details. Marketplace stash tiles sell one copy immediately; loot remains unclaimed until you choose to take it. Sold-out merchant listings disappear. Buy all purchases the maximum available copies of the selected item that your crowns and storage allow, with the quantity and total cost shown before purchase. It also works for food, trade goods, and campaign supplies.
- Engage a camp or roaming band for an automatic battle on a generated 14 × 8 terrain field. Woods and brush provide ranged cover; mud, trees, elevation, and hills shape movement and shots. Combatants act in initiative order; they route around allies, archers try to keep their distance, and fatigue prompts recovery. Choose Offense to advance, Defense to hold the line, or Thin them out to focus attacks. Use pause, speed, or retreat; you do not select each brother's moves or attacks. Melee attacks swing or thrust, ranged fighters aim and send an arrow or bolt, and hits show armor/health loss. Hitpoints, head/body armor, fatigue, morale, and ammunition affect the battle. This remains a simplified approximation of Battle Brothers' tactical combat, not its full ruleset.
- Survivors carry battle damage back to the campaign. Victories can award equipment, crowns, food, tools, medicine, ammunition, and experience. Brothers who fall stay dead; their worn equipment can be recovered after a victory if the stash has room. Camp for six hours to recover wounds and repair armor using supplies.

Roaming bands roll their numbers and equipment within their tier: the original four nearby patrols keep 1-2 lightly equipped enemies, while larger frontier warbands offer more dangerous fights. Shipment raiders are selected by how close their patrol route runs to the wagon road. Clearing that band protects the delivery without another group taking its place. A band's roster stays stable while it roams and rerolls after defeat and respawn.

Loadouts are automatic during battle. A melee fighter with a ranged reserve opens with it while enemies approach; a shield-and-throwing-weapon user switches to their melee set when the lines meet or ammunition runs out. Bow and crossbow users try to escape first, drawing a carried dagger when trapped or out of ammunition. At half health or lower, fighters prioritize carried healing items, including in melee; stimulants relieve high fatigue. In new battles, switching sets, drawing a dagger, and using a remedy each cost 4 AP, with the free first-use exceptions from Quick Hands and Combat Bandaging. Used supplies stay consumed, crossbows retain their reload state across swaps, and survivors return to their chosen starting equipment after battle. Each throwing bundle has five charges; company ammunition pays for refills after battle.

Clearing a camp has a 15%, 25%, or 40% chance of a famed item, depending on difficulty. Famed weapons, armor, helmets, and shields receive a generated name and improved combat stats, with a gold glow on their artwork. Inspect them to compare their bonuses with the ordinary item. Camp difficulty limits the base equipment tier. Each camp generation has a fixed reward roll, so retreating or reloading cannot reroll its reward. Famed items can be equipped, stowed, sold, and bought back while the merchant still stocks them; their name and bonuses survive save export/import.

The campaign also includes local market stocks and prices, five trade goods, wages and daily provisions, foraging, autosave, and JSON save export/import. Choose 1× or 3× to advance world time while travelling or waiting; pause, menus, and backgrounding stop it. The world does not simulate while the app is closed.

Use **Battle formation** to arrange 12 front, 12 middle, and 12 rear positions on the 14 x 16 battlefield. Tap an occupied slot, then another slot to move or swap the fighters. The formation is saved and determines their starting battle positions. Arrange it before pursuing a roaming band: catching a pursued band starts combat directly. A camp's sidebar action retains its encounter preview; double-tapping the camp bypasses that preview.

Two additional battle orders are available before or during combat. **Advance in Formation** moves the company in coordinated one-hex steps, waiting for the current step to finish before starting another and attacking without individual pursuit. **Shield Wall** places shielded melee fighters and throwing skirmishers ahead of archers and unshielded two-handers. During battle, fighters move into their ranks normally; the order does not teleport them or overwrite the saved company formation. Bowmen with a backup shield remain archers.

Each brother has a combat role and a Balanced, Damage, or Control preference in the company screen. New battles use 9 AP and automatic weapon skills for every weapon family, including Spearwall, Riposte, stuns, armor-breaking strikes and sword area attacks. Roles and preferences guide affordable choices. Active battles from older saves finish under their original rules, including earlier nine-AP battles. See [current tactical rules](docs/TACTICAL-AI.md).

Victories recover a mix of crowns, supplies, and enemy equipment. Salvaged body armor and helmets retain their remaining durability; destroyed or badly ruined pieces are not recovered. Inspect the condition of each individual loot item before collecting it, then repair worn armor in camp with tools.

## Install for offline play on iPad

1. Open the game in Safari while online.
2. Choose **Share > Add to Home Screen**. Enable **Open as Web App** if Safari shows that option, then add it.
3. Launch the Home Screen icon and wait for **Offline ready**.
4. Turn on airplane mode, close the app, relaunch it, and confirm your company loads.

These are the intended Safari steps; installation and airplane-mode play have not yet been tested on a physical iPad. Verify them before relying on the game during travel. Progress is saved on the device and does not sync. iPadOS may remove browser storage, so use **Save / Menu > Export save** and keep a backup in Files. **Import save** restores it. The offline indicator confirms app files are cached; it does not guarantee save retention.

## Current limits

- The world has 24 authored roaming bands and 12 seeded camps that relocate after defeat. Bands patrol, hunt the company, and raid shipments, but do not form factions or generate a procedural campaign.
- Battles use generated terrain on a fixed-size hex field with simplified automatic behavior. Company tactics offer five broad AI orders, but there are no manual unit moves, the full Battle Brothers skill trees or its complete combat simulation.
- Level-ups use a three-of-eight attribute chooser with saved rolls. A separate perk chooser grants one permanent choice per earned level. Backgrounds and traits provide small stat modifiers; class-specific perk trees and background events are not implemented.
- iPad Safari installation, airplane-mode launch, and save retention have not been verified on a physical iPad.

## Future work

The [weapon-skills roadmap](docs/WEAPON-SKILLS-PLAN.md) records the agreed design. Version 0.37 implements the core weapon-family skills, reactions and restricted area attacks. Further tuning and additional item-specific abilities remain future work. See [current tactical rules](docs/TACTICAL-AI.md).

## Development

Requires Node.js 22 or newer. No installation step.

```sh
npm start
npm run prepare-offline
npm test
```

Open `http://127.0.0.1:4173`. The site is static and can be hosted from the main branch root on GitHub Pages. URLs are relative to support project subpaths. After changing app files or artwork, run `npm run prepare-offline` to rebuild the offline list and content-derived cache version, then reload after the new worker activates.

`src/engine.js` holds campaign and combat rules. `src/app.js` binds the interface and local save. `src/battle-view.js` renders the battle, `src/campaign-ui.js` renders company and campaign screens, and `src/portraits.js` assembles character and equipment layers.

See [asset credits](docs/ASSET-CREDITS.md), [research notes](docs/RESEARCH.md), [perk references and adaptations](docs/PERK-RESEARCH.md), and [verification notes](docs/VERIFICATION.md).
