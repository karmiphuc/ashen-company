# Release notes

These notes preserve the feature summaries previously scattered through the README. Historical entries describe behavior at that release; use the [documentation index](../README.md) for current rules. This is a highlights archive, not a record of every patch. Merged source changes do not by themselves confirm a live deployment.

See the [release log](CHANGELOG.md) for navigation and the [release process](../development/RELEASES.md) for versioning and deployment.

## 0.55 patch releases

Versions below follow the automatic first-parent numbering from the 0.55.0 base.

### 0.55.9

Balance Duelist, Riposte and Warbrand/Rhomphaia attacks (#94). [Source commit](https://github.com/karmiphuc/ashen-company/commit/2a5504b250d5cf84b6a5d10b04b3ffcf48839f34).

### 0.55.8

Enforce adjacent ranged restrictions and expose opportunity reactions (#154). [Source commit](https://github.com/karmiphuc/ashen-company/commit/94645f58a1b02c115f870f4306c3ec956773ca44).

### 0.55.7

Document Battle Brothers torso perspective for future artwork (#157). [Source commit](https://github.com/karmiphuc/ashen-company/commit/dd85ccb01567f954a375ec5cc6add63b8e3436e6).

### 0.55.6

Prevent stunned stragglers from stalling realtime AP cycles (#155). [Source commit](https://github.com/karmiphuc/ashen-company/commit/01cd2ad22a608f50351dd702650059cbd7bdab50).

### 0.55.5

Preserve metal seams in restored Ancient armor finishes (#153). [Source commit](https://github.com/karmiphuc/ashen-company/commit/b9115fd4c3d28b6d755fb8b51f3487fd1978a966).

### 0.55.4

Smooth realtime combat with independent animation clocks (#152). [Source commit](https://github.com/karmiphuc/ashen-company/commit/b6249dd86ed45a287ef3756aad78b1f0591aea90).

### 0.55.3

Add Direwolf Armorer crafting and stat-based Ancient restoration prices (#145). [Source commit](https://github.com/karmiphuc/ashen-company/commit/17b715a0e344c8958aece1ef77c25744f657d450).

This patch adds **Direwolf Moonfang Harness** crafting to every town Armorer: fuse one Direwolf Hide and one Direwolf Mail for 600 crowns into the selected asymmetric wolf-mantle design, with 195 armor / 13 fatigue, non-stacking melee intimidation and a 3% named chance. Direwolf Leather Hood (120/3), the existing Wolf Helmet (178/5), and combined Alpha Helm (265/15) complete a matching Direwolf set. See [crafting and artwork rules](../equipment/DIREWOLF-MOONFANG.md).

### 0.55.2

Record completed temporary injuries and remaining OG injury scope (#110). [Source commit](https://github.com/karmiphuc/ashen-company/commit/037dd704cb7c10749f4c7be19d0c044688daa301).

### 0.55.1

Automate versioned, tested and verified Pages releases (#151). [Source commit](https://github.com/karmiphuc/ashen-company/commit/6293884497100f2c6e04a34353eb95b3a2bc7dcc).

### Versioning migration

The UI hardcoded 0.53.0 while package metadata had reached 0.54.0. Later equipment
features shipped without another release number. Legacy GitHub Pages published
main directly: no repository test/build gate caught the drift. Version 0.55.0
unified the displayed version; the Verified release pipeline removes the remaining
manual patch-bump and deployment steps.

## 0.55.0

Version 0.55.0 adds bounded named-item forging, 18 matching head/body equipment families and selective three-piece completions, including Ritual Bone. The Save / Menu release label now comes from package metadata, fixing the stale 0.53.0 display. See [equipment design features](../equipment/EQUIPMENT-DESIGN-FEATURES.md) and [three-piece rules](../equipment/THREE-PIECE-SETS.md).

## 0.54.0

Version 0.54.0 adds **Ancient Armory restoration** at every open settlement’s Armorer: matching recovered pieces become restored bronze or silverish steel, with a separate named-item chance, explicit failure refunds, and original-sprite color treatments. See [recipes, stats and save rules](../equipment/ANCIENT-RESTORATION.md).

## 0.53.0

Version 0.53.0 adds persistent temporary injuries based on original Battle Brothers: specific wound penalties, daily medicine and recovery, separate Doctor wound treatment, Crippling Strikes, and the Surgeon’s one-day recovery benefit. Compact roster badges and inspection hints show care needs. New battles use wounds for Gash and Executioner; resumed older battles keep their previous rules. See [injury rules and compatibility](../gameplay/TEMPORARY-INJURIES.md).

## 0.48.9

Version 0.48.9 gates 18–20 elite enemies behind 15 living brothers in formation. Smaller companies remain below 18. World-map soldier skirmishes now last 3–72 hours based on participating troop count, lock both sides in place, show fighting time remaining, and apply casualties/reports only at completion. Pending engagements survive save/reload and release safely when the company intervenes.

## 0.48.8

Version 0.48.8 expands new combat fields to 22×24, leaving retreat space beyond enemy deployment. Enemies cannot complete escape in their first fleeing round. Camps have two rear exits in addition to two assault entrances. Allied reinforcements deploy above/below the battle near the center, away from company formation lanes. Existing saved battles keep their battlefield and escape rules.

## 0.48.7

Version 0.48.7 swaps Heraldic Plates/Shoulders inventory and worn artwork, adds Double Mail and Unhold/Direwolf/Hyena Fur attachments, and raises Bone Platings to 55 armor with rarer stock. Both attachment slots apply their bonuses; Unhold Fur reduces ranged damage by 25%, Direwolf Fur adds melee morale damage, and regional veterans can carry the new gear.

## 0.48.6

Version 0.48.6 enlarges equipped one-handed weapons by 30% and two-handed weapons by 50% relative to the pawn. Shields retain their authored size and placement. Named weapon handles stay above the base, mounted grips and combat animation anchors stay aligned, and inventory icons keep their existing sizes.

## 0.48.5

Version 0.48.5 rolls champions independently for every eligible enemy, with no per-party champion cap. Veteran top-tier camps and bands scale toward 18–20 troops against a full company; their veteran stat ranks keep growing to 10 as player levels and campaign age rise. Starter encounters stay small. New battles support 20 enemies and preserve every defeated champion’s named trophies beyond the ordinary loot limit; existing active battles retain their saved roster and rules.

## 0.48.4

Version 0.48.4 makes Company & Equipment easier to scan. Preparation, morale, background, behavior, armor, reserve, mount, accessory and recovery guidance moves into labelled ? hints: hover or focus to preview, tap to keep open, tap outside or press Escape to close. Stats, injuries, talents, fatigue, item names and equipment actions stay visible. Wider equipment columns and compact protection slots reduce scrolling; hints fit tablet and phone viewports.

## 0.48.3

Version 0.48.3 adds a saved **Default battle speed** setting in Save / Menu. New battles start at 3× by default; choose 1× in the Menu if preferred. Reloading, importing, hiding the app and opening dialogs still pause combat.

## 0.48.2

Version 0.48.2 restores readable equipped weapons and shields: one-handed/ranged foreground art is 20% larger, mounted shields regain up to 48px width, and unmounted shields gain 12%. Grip placement limits extra framing shrink; shield bottoms stay inside the pawn/base frame. Two-handed rest poses and size limits remain intact.

## 0.48.1

Version 0.48.1 enriches the world map with seeded terrain variation, regional details, curved roads, settlement footprints and clearer village/city/castle silhouettes. Real travellers gain shadows and directional facing; night adds warm settlement lights. Campaign mechanics and saves stay compatible. See [map rendering and validation](../world/MAP-IMMERSION.md).

## 0.48

Version 0.48 adds **Ashen Winter**, the first endgame crisis. From day 60, a company whose six strongest equipped members average level seven can receive a seven-day invasion warning. Three Ancient Legion commanders send hosts along the roads. Besieged and occupied settlements close every service until your company liberates them; waiting will not reopen them. Defeating commanders stops new attacks, and freeing all blocked settlements ends the crisis with crowns, renown, and a saved equipment reward. Existing ancient enemies, artwork, and armory are reused. Old saves receive the full scheduling and warning period; active battles retain their rules. Faction war remains planned for a later release. See [implementation rules](../world/ASHEN-WINTER-IMPLEMENTATION-SPEC.md).

## 0.47.6

Version 0.47.6 buffs Ronin, Ninja and Warrior Monk into veteran specialists with stronger combat stats, matching hiring fees and guaranteed attack-skill talent for new recruits.

## 0.47.5

Version 0.47.5 adds 10 backgrounds and fixed star talents to hiring and advancement. Samurai now costs 2,000 crowns with elite melee stats and at least two-star melee skill and defense. See [backgrounds and talents](../gameplay/BACKGROUNDS-TALENTS.md).

## 0.47.4

Version 0.47.4 combines named armor traits and weapon/shield craftsmanship with the newer BB-style rolls. Owned newer named gear upgrades with its existing seed and damage outside combat; inspection shows every bonus. See [named-item rules](../equipment/NAMED-ROLLS.md).

## 0.47.3

Version 0.47.3 supports **18 hired brothers: 15 fielded and 3 reserves**, with reserve swaps in the formation editor. Saved preparation checkboxes buy all affordable town ammunition regardless of current stores and equip the best stash bandages first. See [company preparation and reserves](../gameplay/COMPANY-PREPARATION.md).

## 0.47.0

Version 0.47.0 fixes tactical hex proportions, neighbor-aware elevation faces and ground-aligned pawns. Camps now have original BB palisade art with movement-blocking walls and open entrances. New enemy formations defend with at least three live ranged fighters, switch to offense below that threshold, and retain a four-quiet-round anti-stalemate fallback. See [battle terrain notes](../world/BATTLE-TERRAIN.md).

## 0.46.9

Version 0.46.9 adds 46 sourced BB named weapon designs plus Impaler, with their actual inventory and worn art. Named finds remain scarce and regional. The weapon-skill audit fixes Split Shield to damage only shields in new battles, adds fencing Lunge and two-hex Spetum Spearwall, and preserves active old fights. Handgonne is deferred. See [named weapons and skill checks](../equipment/NAMED-WEAPONS.md).

## 0.46.8

Version 0.46.8 brings Battle Brothers-style named rolls: weapons and shields get two distinct eligible modifiers; armor and helmets roll 110–125% protection with source-based weight relief. Combat and inspection honor the rolls, while existing saved items retain their stats. See [ranges, sources and compatibility](../equipment/NAMED-ROLLS.md).

## 0.44

Version 0.44 reduces world area by **33%**, preserving nine regions, all 48 settlements and the road network. City stables now rotate horses and warhorses; armored horses are scarce, and wolves/wargs favor northern, forest and marsh cities. High-tier frontier camp clears have an independent **12% extra mount reward**, alongside named loot.

**Eleven allied and neutral city patrols** tour across the world: two or three per political faction. They hunt roving brigands and fight rival armies in quarter-hour simulation. Both sides lose troops, casualties survive reloads, depleted columns return to friendly cities, and destroyed armies reform after 72 hours. Select their colored map markers or Soldier patrols destinations to inspect rosters, tours and outcomes. Existing saves migrate positions once, including active campaigns and battles.

## 0.43

Version 0.43 adds nine regional enemy profiles, role-aware imported gear across patrols and generated encounters, scarce named champions, and permanent named/legendary equipment bonuses. Fangshire now provides 77 protection for one fatigue with +5 ranged defense. Rare-item buybacks preserve damage, and v0.42 active battles migrate without repairs or rerolled drops.

## 0.42

Version 0.42 adds the sourced base-game and DLC armor catalog: **217 wearable designs (104 body armors and 113 helmets)**, with matching inventory art and worn portrait sprites. Browse collections in the market; northern and southern armories favor local designs, and the new frontier enemies wear regional equipment. Protection and fatigue use source baselines; prices, famed bonuses, and special effects remain adapted to this game. See [catalog coverage and source notes](../equipment/DLC-EQUIPMENT.md).

The world now has **48 settlements across nine named regions, 71 local roads and highways, 56 patrols, and 39 camps**, including snow-covered highlands and the desert Sunlands. Gold highways connect regional markets, new caravans follow the displayed network, and frontier roads speed travel. Original settlement IDs, shipment routes, starter patrols, and camp generation remain compatible. Repeated content builds and save imports are idempotent. See [regional world details](../world/REGIONAL-WORLD.md).

## 0.41

Version 0.41 adds three matching frontier armor sets (Scout, Warden, and Sentinel), with six body/helmet items using existing credited Legends artwork. The eastern frontier adds Ambercross, Reedharbor, Sunspire, and Cinderhold, four persistent patrols, and forest, marsh, and mountain terrain. The map now has 20 settlements and 28 patrols. Older companies gain the content on import without resetting bought stock, camp progress, or saved battle rules; repeated imports preserve the same state. New equipment enters normal weekly armory rotations and can receive famed variants.

## 0.40

Version 0.40 adds mount skills in new battles. All horses can spend exactly 6 AP to charge 2-3 empty hexes in a straight line and make a normal melee attack. A landed hit guarantees a one-turn stun and pushes a surviving victim one hex if that hex is free. Spearwall can stop the charge. Offense and Thin them out permit charges; defensive and formation tactics keep their line. Wolves and wargs make one free dagger-like bite after a rider attack against an adjacent surviving enemy, including after a missed attack; reactions do not trigger bites.

Three unique events guarantee one mount each, once per campaign: Retired Outrider's Promise at Oakwatch (War Horse, day 10-13), The Smith's Last Charger at Ironford (Armored War Horse, day 24-27), and The Marsh Hunter's Bond at Blackfen (Dire Wolf, day 40-43). Town panels show their stories and acceptance choices. Rewards are free, remain available until claimed, and wait if the stash is full. Existing companies qualify; older active battles finish under their saved rules.

## Additional historical implementation notes

These descriptions had no release number in the original README. Their original text is retained without assigning a patch.

Combat impacts distinguish blunt, flesh, slash, arrow, thrown piercing and bolt hits. Cavalry charges add hoofbeat foley and a collision on contact; armor penetration layers the armor and body sounds. Effects remain gesture-unlocked, independently mutable and cached offline.

Ranged and skirmisher units keep space while ammunition lasts. Defensive and shield-wall orders let them seek nearby trees, palisade shelter or friendly shield screens before holding. Flankers prefer reachable archers and polearms, skirmishers pressure the nearest front, and ranged units prefer exposed or finishing targets. Newly rolled named ranged weapons can receive +1 range; existing named rolls retain their saved stats. Aimed Shot retains its additional +1 range.

Skirmish blends a measured advance with a shield line about 5–6 hexes from the enemy. Ranged fighters fire stationary Aimed Shots when possible, otherwise step into range and return to their saved shelter, reserving AP for a same-turn return where feasible. Long trips continue across turns and saves; the company closes in when its ranged ammunition is exhausted.

Breaker is a cavalry role for opening weak points with a safe Charge, then exploiting exposed archers or polearms. Auto selects it for melee riders on war/armored war horses wearing at least 160 body armor. Explicit Flanker remains a cautious circling role and does not charge head-on; company formation tactics still govern both roles.

Regional scenery includes ruined watches, small smoking battlefield remains using the user-provided tile sheet, and a desert necropolis with pyramids and a sphinx. The rejected ruin/temple sprite pack has been removed. Frostspine, Stormteeth and Sunwall are impassable ridges: travel and roving troops take derived routes around them while all existing trade roads remain open. Three untargetable cave entrances reserve future legendary quest sites in deep Greenwood, Frostspine's central cleft and beside the necropolis. Decorations and smoke are baked into the cached background.
