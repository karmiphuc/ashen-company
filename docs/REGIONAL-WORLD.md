# Regional world

The world spans **4,820 × 2,920 world units**, with **48 settlements, nine named regions, 71 road links, 56 persistent patrols, and 39 camps**. The nine regions are Western Marches, Northern Highlands, Greenwood, Eastern Frontier, Far Steppe, Southern Marches, Blackwater Basin, Saffron Coast, and Sunlands.

[geography.js](../src/geography.js) owns authored region identities, new settlements, economic profiles, camp cells, and the shared road graph. Highways are gold and wider than local roads. Region borders and labels remain visible in the map overview. Northern highlands use snow and mountain terrain; the Sunlands use sourced desert tiles and an oasis; coastal and basin routes cross marshes. Destinations are grouped by region. Settlement artwork and economic descriptions have complete fallbacks.

The graph combines authored highways, original links, two nearest local connections per settlement, and deterministic connections between any remaining components. Every settlement has a route from Oakwatch and multiple local links. The same graph determines the displayed roads and new-region caravan paths. Routes and outfit pools are cached from immutable definitions to avoid repeating searches during animation.

Road travel in the expanded frontier uses 115% of ordinary plains speed within 18 units of a displayed road. Travelling directly through open country remains available. New-region caravans move along road segments at constant distance progress. Existing settlement shipment origins and saved caravan schedules remain unchanged. The original four weak patrols, original settlement coordinates, and original twelve camp cells retain their identities and generation rules. The 24 extra camps use separate cells and generation keys.

The map's background raster is capped at 4,096 pixels on its longest side, rather than allocating a full-resolution canvas for the expanded world. Rendering scales it back to world coordinates; labels and active entities remain separate. Save-file import now accepts up to 4 MiB, so a company with saved markets in every settlement can reimport its export; structural validation and inventory limits remain enforced.

Desert terrain is credited in [the regional terrain manifest](../assets/world/regional-sources.json), pinned to the project's existing Legends source commit. Offline generation includes all new modules and terrain images.

As of v0.43, nine faction profiles follow the actual named regions: Marchland Brigands, Highland Clans, Greenwood Hunters, Frontier Free Companies, Steppe Warbands, Border Deserters, Blackwater Cultists, Saffron Corsairs, and Sunland Nomads. Non-starter patrols, generated camps, and rescue encounters share deterministic outfits fitted to melee, shield, ranged, and throwing roles. Archers retain light armor; ordinary enemies do not receive legendary relics. An occasional elite leader carries a regional named trophy, with surviving named equipment recovered after victory. Elite roles gain one relevant perk, snapshotted at battle creation. The four weak starter patrols and three authored camps retain their original equipment. Existing active battles keep their combat stats and accept old camp names on import.

## Version 0.44 compact world and patrols

Map area is 67% of v0.43. The original campaign footprint is preserved; added eastern/southern coordinates shrink around x=2120/y=1380. Regions, terrain and authored road topology use inverse coordinates to retain identities. Save layout version 2 migrates company, destination, rescue and hostile patrol positions once. Tactical hex positions are unchanged.

The Western League is allied to the company; the Highland Clans, Eastern March and Southern Sultanate are neutral. Western/Eastern and Highland/Southern armies are rivals. Each faction has two or three columns based only in cities, following roads through friendly and distant rival cities. Neutral armies never initiate combat with the company. Select a patrol to see its soldiers, home, tour, current activity and battle record; recent outcomes appear in the world sidebar.

Every quarter-hour armies seek nearby brigands, random camps or rival patrols. Deterministic strength combines roster size, armor, weapons, shields, cavalry and a seeded battle roll. Winners also suffer losses; losers can be wiped out. Surviving troop identities and hostile casualties persist. Depleted columns return home; a friendly city restores one soldier per 12 hours. Destroyed armies reform at their home city after 72 hours. NPC victories release intercepted caravans and clear camps without granting company loot, experience or gold. Company pursuit, selected attacks, active contract camps and four weak starter bands are protected from NPC interception.

City stable weekly offers: riding horse 20%, warhorse 5%, armored warhorse 1% in major cities, and another 2% regional offer (wolves/wargs in north/forest/marsh, warhorse elsewhere). Castles have 3% warhorse/armored-horse offers; villages have none. Highpass scheduled stock and one-time named town events remain. Difficulty-3 random camp clears independently roll 12% for a regional mount reward, added alongside the existing named-item reward. Battle snapshots persist both rewards and validate mount identity on import.


### Undead world conflict (v0.50.21)

Ashen hosts pursue nearby living bands and active city patrols within 90 world units, diverting from their settlement route while hunting. Within 35 units they commit to the existing timed battle simulation, including its troop-based hours/days duration. Engaged hosts stop moving and cannot close a settlement during that fight; living band movement also pauses. Hosts already at a settlement when its warning expires prioritize the siege over a new detour. Player-reserved or already-engaged targets cannot be borrowed by another battle.

Both participants use their actual surviving troop identities. Timed outcomes update each participant once: guards receive their own losses/recovery/report, bandits retain casualties or respawn after defeat, and undead keep surviving troops and saved damage or are removed with their settlement threat. NPC victories grant the company no gold, loot or crisis contribution.

The company can join guards from **any of the four factions** against undead, regardless of which side initiated. Selecting either the host or guards, sidebar actions and direct engagement all resolve to the same saved fight. Arrival near either side starts the joint battle; approaching from farther away follows the committed guards. Guards deploy on the company's side with their real gear and troop count; undead retain their undead traits. Faction-versus-faction conflicts remain separate.

Older snapshots retain their implicit patrol-first form. New undead-first records add `aKind: "undead-host"`; participant types, force generations, troop identities, outcomes, uniqueness and durations are validated. The patrol-facing view normalizes both orientations before deployment. World clicks select the closest hostile marker, avoiding a nearby human band's earlier position in the roster masking an undead encounter.
