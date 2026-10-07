# Ashen Company

Version 0.54.0 adds **Ancient Armory restoration** at every open settlement’s Armorer: matching recovered pieces become restored bronze or silverish steel, with a separate named-item chance, explicit failure refunds, and original-sprite color treatments. See [recipes, stats and save rules](docs/ANCIENT-RESTORATION.md).

See [equipment design features](docs/EQUIPMENT-DESIGN-FEATURES.md) for named
prefixes/suffixes, the bounded merging formula, and matching armory sets.

Version 0.53.0 adds persistent temporary injuries based on original Battle Brothers: specific wound penalties, daily medicine and recovery, separate Doctor wound treatment, Crippling Strikes, and the Surgeon’s one-day recovery benefit. Compact roster badges and inspection hints show care needs. New battles use wounds for Gash and Executioner; resumed older battles keep their previous rules. See [injury rules and compatibility](docs/TEMPORARY-INJURIES.md).

Version 0.48.9 gates 18–20 elite enemies behind 15 living brothers in formation. Smaller companies remain below 18. World-map soldier skirmishes now last 3–72 hours based on participating troop count, lock both sides in place, show fighting time remaining, and apply casualties/reports only at completion. Pending engagements survive save/reload and release safely when the company intervenes.

Version 0.48.8 expands new combat fields to 22×24, leaving retreat space beyond enemy deployment. Enemies cannot complete escape in their first fleeing round. Camps have two rear exits in addition to two assault entrances. Allied reinforcements deploy above/below the battle near the center, away from company formation lanes. Existing saved battles keep their battlefield and escape rules.

Version 0.48.7 swaps Heraldic Plates/Shoulders inventory and worn artwork, adds Double Mail and Unhold/Direwolf/Hyena Fur attachments, and raises Bone Platings to 55 armor with rarer stock. Both attachment slots apply their bonuses; Unhold Fur reduces ranged damage by 25%, Direwolf Fur adds melee morale damage, and regional veterans can carry the new gear.

Version 0.48.6 enlarges equipped one-handed weapons by 30% and two-handed weapons by 50% relative to the pawn. Shields retain their authored size and placement. Named weapon handles stay above the base, mounted grips and combat animation anchors stay aligned, and inventory icons keep their existing sizes.

Version 0.48.5 rolls champions independently for every eligible enemy, with no per-party champion cap. Veteran top-tier camps and bands scale toward 18–20 troops against a full company; their veteran stat ranks keep growing to 10 as player levels and campaign age rise. Starter encounters stay small. New battles support 20 enemies and preserve every defeated champion’s named trophies beyond the ordinary loot limit; existing active battles retain their saved roster and rules.

Version 0.48.4 makes Company & Equipment easier to scan. Preparation, morale, background, behavior, armor, reserve, mount, accessory and recovery guidance moves into labelled ? hints: hover or focus to preview, tap to keep open, tap outside or press Escape to close. Stats, injuries, talents, fatigue, item names and equipment actions stay visible. Wider equipment columns and compact protection slots reduce scrolling; hints fit tablet and phone viewports.

Version 0.48.3 adds a saved **Default battle speed** setting in Save / Menu. New battles start at 3× by default; choose 1× in the Menu if preferred. Reloading, importing, hiding the app and opening dialogs still pause combat.

Version 0.48.2 restores readable equipped weapons and shields: one-handed/ranged foreground art is 20% larger, mounted shields regain up to 48px width, and unmounted shields gain 12%. Grip placement limits extra framing shrink; shield bottoms stay inside the pawn/base frame. Two-handed rest poses and size limits remain intact.

Version 0.48.1 enriches the world map with seeded terrain variation, regional details, curved roads, settlement footprints and clearer village/city/castle silhouettes. Real travellers gain shadows and directional facing; night adds warm settlement lights. Campaign mechanics and saves stay compatible. See [map rendering and validation](docs/MAP-IMMERSION.md).

Version 0.48 adds **Ashen Winter**, the first endgame crisis. From day 60, a company whose six strongest equipped members average level seven can receive a seven-day invasion warning. Three Ancient Legion commanders send hosts along the roads. Besieged and occupied settlements close every service until your company liberates them; waiting will not reopen them. Defeating commanders stops new attacks, and freeing all blocked settlements ends the crisis with crowns, renown, and a saved equipment reward. Existing ancient enemies, artwork, and armory are reused. Old saves receive the full scheduling and warning period; active battles retain their rules. Faction war remains planned for a later release. See [implementation rules](docs/ASHEN-WINTER-IMPLEMENTATION-SPEC.md).

Version 0.47.6 buffs Ronin, Ninja and Warrior Monk into veteran specialists with stronger combat stats, matching hiring fees and guaranteed attack-skill talent for new recruits.

Version 0.47.5 adds 10 backgrounds and fixed star talents to hiring and advancement. Samurai now costs 2,000 crowns with elite melee stats and at least two-star melee skill and defense. See [backgrounds and talents](docs/BACKGROUNDS-TALENTS.md).

Version 0.47.4 combines named armor traits and weapon/shield craftsmanship with the newer BB-style rolls. Owned newer named gear upgrades with its existing seed and damage outside combat; inspection shows every bonus. See [named-item rules](docs/NAMED-ROLLS.md).


Version 0.47.3 supports **18 hired brothers: 15 fielded and 3 reserves**, with reserve swaps in the formation editor. Saved preparation checkboxes buy all affordable town ammunition regardless of current stores and equip the best stash bandages first. See [company preparation and reserves](docs/COMPANY-PREPARATION.md).

Version 0.46.9 adds 46 sourced BB named weapon designs plus Impaler, with their actual inventory and worn art. Named finds remain scarce and regional. The weapon-skill audit fixes Split Shield to damage only shields in new battles, adds fencing Lunge and two-hex Spetum Spearwall, and preserves active old fights. Handgonne is deferred. See [named weapons and skill checks](docs/NAMED-WEAPONS.md).

Version 0.46.8 brings Battle Brothers-style named rolls: weapons and shields get two distinct eligible modifiers; armor and helmets roll 110–125% protection with source-based weight relief. Combat and inspection honor the rolls, while existing saved items retain their stats. See [ranges, sources and compatibility](docs/NAMED-ROLLS.md).

Version 0.44 reduces world area by **33%**, preserving nine regions, all 48 settlements and the road network. City stables now rotate horses and warhorses; armored horses are scarce, and wolves/wargs favor northern, forest and marsh cities. High-tier frontier camp clears have an independent **12% extra mount reward**, alongside named loot.

**Eleven allied and neutral city patrols** tour across the world: two or three per political faction. They hunt roving brigands and fight rival armies in quarter-hour simulation. Both sides lose troops, casualties survive reloads, depleted columns return to friendly cities, and destroyed armies reform after 72 hours. Select their colored map markers or Soldier patrols destinations to inspect rosters, tours and outcomes. Existing saves migrate positions once, including active campaigns and battles.

Version 0.42 adds the sourced base-game and DLC armor catalog: **217 wearable designs (104 body armors and 113 helmets)**, with matching inventory art and worn portrait sprites. Browse collections in the market; northern and southern armories favor local designs, and the new frontier enemies wear regional equipment. Protection and fatigue use source baselines; prices, famed bonuses, and special effects remain adapted to this game. See [catalog coverage and source notes](docs/DLC-EQUIPMENT.md).

The world now has **48 settlements across nine named regions, 71 local roads and highways, 56 patrols, and 39 camps**, including snow-covered highlands and the desert Sunlands. Gold highways connect regional markets, new caravans follow the displayed network, and frontier roads speed travel. Original settlement IDs, shipment routes, starter patrols, and camp generation remain compatible. Repeated content builds and save imports are idempotent. See [regional world details](docs/REGIONAL-WORLD.md).

Version 0.41 adds three matching frontier armor sets (Scout, Warden, and Sentinel), with six body/helmet items using existing credited Legends artwork. The eastern frontier adds Ambercross, Reedharbor, Sunspire, and Cinderhold, four persistent patrols, and forest, marsh, and mountain terrain. The map now has 20 settlements and 28 patrols. Older companies gain the content on import without resetting bought stock, camp progress, or saved battle rules; repeated imports preserve the same state. New equipment enters normal weekly armory rotations and can receive famed variants.

Version 0.40 adds mount skills in new battles. All horses can spend exactly 6 AP to charge 2-3 empty hexes in a straight line and make a normal melee attack. A landed hit guarantees a one-turn stun and pushes a surviving victim one hex if that hex is free. Spearwall can stop the charge. Offense and Thin them out permit charges; defensive and formation tactics keep their line. Wolves and wargs make one free dagger-like bite after a rider attack against an adjacent surviving enemy, including after a missed attack; reactions do not trigger bites.

Three unique events guarantee one mount each, once per campaign: Retired Outrider's Promise at Oakwatch (War Horse, day 10-13), The Smith's Last Charger at Ironford (Armored War Horse, day 24-27), and The Marsh Hunter's Bond at Blackfen (Dire Wolf, day 40-43). Town panels show their stories and acceptance choices. Rewards are free, remain available until claimed, and wait if the stash is full. Existing companies qualify; older active battles finish under their saved rules.

An offline mercenary-company campaign game for desktop and tablet browsers. Lead a band across the Grey Marches, take delivery and brigand-hunt contracts, recruit and outfit companions, and fight automatic tactical battles. Ashen Company uses adapted *Battle Brothers* / Legends artwork; see [asset credits](docs/ASSET-CREDITS.md).

Play at **https://karmiphuc.github.io/ashen-company/**. No account, server, external fonts, or runtime dependencies are required.

## Play

- Drag the map to pan and pinch to zoom. Tap a settlement, hostile camp, or roaming band to select it. Double-click or double-tap to enter a town or attack an enemy directly. Distant targets start travel or pursuit, then open the town or begin combat on arrival. Open ground can be tapped to set a destination; a new travel order replaces the previous action.
- Visit settlements to buy and sell equipment, trade goods, food, and campaign supplies; recruit up to 12 brothers; and take courier, supply, or brigand-hunt contracts.
- Every settlement has a **Doctor** and **Smithy**. Heal one brother or everyone for 1 crown per missing hitpoint; repair one brother's equipped body armor and helmet or the whole company for 1 crown per 2 missing durability, rounded up per brother. Bills are shown before paying. Both services are immediate and use the town's supplies, leaving your medicine and tools untouched. Stashed gear is not repaired; weapons and shields do not lose durability. Camp remains the six-hour option using company supplies.
- Hiring offers three distinct companions per town each day, with their fee, stats, background bonuses, and traits visible before purchase. Ten backgrounds give small starting edges; each new hire gets one positive trait and may have one mild trade-off. No hidden flaws or paid tryouts. Offers stay fixed when reopening or reloading; hired candidates disappear until the next day's board. Fees range from 120 to 180 crowns, with the usual five-crown level-one wage and one food per day. Recruits arrive without equipment. Existing companions keep their previous stats. See [hiring research and design](docs/HIRING-RESEARCH.md).
- Open **Market news** to find temporary harvests, caravans, fairs, armorer shipments, and militia musters across the Marches. Each town has an event every 12 days, lasting three or four days; cities receive regular armorer shipments. Notices show price and stock effects and their final day. Basic gear remains readily available, while better equipment comes from a small weekly selection and finite extra shipments. Completing a courier job has a 50% chance to add one item to the destination armory, recorded in the chronicle. These items still need to be purchased.
- Armorer shipments travel as friendly wagons on the world map. They move at half their previous speed, taking 60 world hours for a full journey. Existing travelling wagons keep their position and take twice as long to finish their remaining route. Select one to see its route, destination, arrival time, and any threatening band; double-tap or choose **Follow caravan** to accompany it. Assigned raiders physically leave their patrol and pursue the wagon. Reaching it starts a seven-hour rescue window; the wagon is lost only if its attackers are still in contact when that window expires. Clearing the assigned band before the attack also protects the shipment. Safe delivery adds finite equipment stock and starts its discount, which lasts at least 48 hours after arrival; a lost wagon leaves a four-day **Arms Shortage**, with scarcer gear and higher offers for ordinary weapons, shields, helmets, and armor. Bring spare loot or buy cheaply elsewhere to profit. Accessories and famed items keep their usual prices. World time pauses during battles and while menus are open.
- The Marches cover 4,820 × 2,920 world units across nine named regions, with 48 settlements and 71 local roads and highways. Three fixed brigand camps return after five days; 36 seeded wild camps relocate and regenerate their raiders after three days. Fifty-six hostile bands patrol the roads and frontier, including the original four small training fights. Raiders pursue the company outside settlement safety and automatically engage on contact. Fast travel slows to normal when a new pursuit is reported. Open roads give you room to escape; wilderness camping and foraging can be interrupted before granting recovery or supplies. A short grace period after a battle lets survivors disengage. Bands return 48 hours after defeat. The map does not simulate factions or generate a changing campaign.
- Inspect the company to equip armor, helmets, two weapon/shield sets, and two accessory pockets. The 383-item armory includes two-handed weapons, longaxes, pikes and polehammers, cleavers, flails, southern blades, throwing weapons, bows and crossbows, eight more body armors, six more helmets, and field medical supplies. Head and body armor have separate durability. Backgrounds affect a brother's starting combat stats. On level-up, choose three different attributes from eight; each has a saved +1 to +5 roll. Each brother has three fixed attribute talents: one star adds +1, two add +2, and three guarantee +5, capped at +5. You can defer the choice, and reloading preserves the same rolls. Every level after the first also grants one perk point. Choose from 19 perks, with stronger choices unlocking at higher levels. Points can be saved, and existing companies receive points for levels already earned.
- Six deterministic face profiles vary head, hair, beard, and body. The same face stays with its brother as equipment changes, and helmets align with the face and meet the armor at the neck.
- Tap equipment in the company slots or stash, trader inventory, or battle spoils to inspect its role, exact combat stats, and handling notes. All 383 items have descriptions. Choose where to equip an item from its details. Marketplace stash tiles sell one copy immediately; loot remains unclaimed until you choose to take it. Sold-out merchant listings disappear. Buy all purchases the maximum available copies of the selected item that your crowns and storage allow, with the quantity and total cost shown before purchase. It also works for food, trade goods, and campaign supplies.
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

- The world has 56 authored roaming bands and 36 seeded camps that relocate after defeat. Bands patrol, hunt the company, and raid shipments, but do not form factions or generate a procedural campaign.
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

Version 0.43 adds nine regional enemy profiles, role-aware imported gear across patrols and generated encounters, scarce named champions, and permanent named/legendary equipment bonuses. Fangshire now provides 77 protection for one fatigue with +5 ranged defense. Rare-item buybacks preserve damage, and v0.42 active battles migrate without repairs or rerolled drops.

Version 0.47.0 fixes tactical hex proportions, neighbor-aware elevation faces and ground-aligned pawns. Camps now have original BB palisade art with movement-blocking walls and open entrances. New enemy formations defend with at least three live ranged fighters, switch to offense below that threshold, and retain a four-quiet-round anti-stalemate fallback. See [battle terrain notes](docs/BATTLE-TERRAIN.md).

Combat impacts distinguish blunt, flesh, slash, arrow, thrown piercing and bolt hits. Cavalry charges add hoofbeat foley and a collision on contact; armor penetration layers the armor and body sounds. Effects remain gesture-unlocked, independently mutable and cached offline.

Ranged and skirmisher units keep space while ammunition lasts. Defensive and shield-wall orders let them seek nearby trees, palisade shelter or friendly shield screens before holding. Flankers prefer reachable archers and polearms, skirmishers pressure the nearest front, and ranged units prefer exposed or finishing targets. Newly rolled named ranged weapons can receive +1 range; existing named rolls retain their saved stats. Aimed Shot retains its additional +1 range.

Skirmish blends a measured advance with a shield line about 5–6 hexes from the enemy. Ranged fighters fire stationary Aimed Shots when possible, otherwise step into range and return to their saved shelter, reserving AP for a same-turn return where feasible. Long trips continue across turns and saves; the company closes in when its ranged ammunition is exhausted.

Breaker is a cavalry role for opening weak points with a safe Charge, then exploiting exposed archers or polearms. Auto selects it for melee riders on war/armored war horses wearing at least 160 body armor. Explicit Flanker remains a cautious circling role and does not charge head-on; company formation tactics still govern both roles.

Regional scenery includes ruined watches, small smoking battlefield remains using the user-provided tile sheet, and a desert necropolis with pyramids and a sphinx. The rejected ruin/temple sprite pack has been removed. Frostspine, Stormteeth and Sunwall are impassable ridges: travel and roving troops take derived routes around them while all existing trade roads remain open. Three untargetable cave entrances reserve future legendary quest sites in deep Greenwood, Frostspine's central cleft and beside the necropolis. Decorations and smoke are baked into the cached background.

The [engineering and product council consultation](docs/ENGINEERING-PRODUCT-COUNCIL.md) prioritizes regression prevention, maintainability and rapid feature delivery against a verified repository baseline.
