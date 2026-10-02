# Regional world

The world spans **4,820 × 2,920 world units**, with **48 settlements, nine named regions, 71 road links, 56 persistent patrols, and 39 camps**. The nine regions are Western Marches, Northern Highlands, Greenwood, Eastern Frontier, Far Steppe, Southern Marches, Blackwater Basin, Saffron Coast, and Sunlands.

[geography.js](../src/geography.js) owns authored region identities, new settlements, economic profiles, camp cells, and the shared road graph. Highways are gold and wider than local roads. Region borders and labels remain visible in the map overview. Northern highlands use snow and mountain terrain; the Sunlands use sourced desert tiles and an oasis; coastal and basin routes cross marshes. Destinations are grouped by region. Settlement artwork and economic descriptions have complete fallbacks.

The graph combines authored highways, original links, two nearest local connections per settlement, and deterministic connections between any remaining components. Every settlement has a route from Oakwatch and multiple local links. The same graph determines the displayed roads and new-region caravan paths. Routes and outfit pools are cached from immutable definitions to avoid repeating searches during animation.

Road travel in the expanded frontier uses 115% of ordinary plains speed within 18 units of a displayed road. Travelling directly through open country remains available. New-region caravans move along road segments at constant distance progress. Existing settlement shipment origins and saved caravan schedules remain unchanged. The original four weak patrols, original settlement coordinates, and original twelve camp cells retain their identities and generation rules. The 24 extra camps use separate cells and generation keys.

The map's background raster is capped at 4,096 pixels on its longest side, rather than allocating a full-resolution canvas for the expanded world. Rendering scales it back to world coordinates; labels and active entities remain separate. Save-file import now accepts up to 4 MiB, so a company with saved markets in every settlement can reimport its export; structural validation and inventory limits remain enforced.

Desert terrain is credited in [the regional terrain manifest](../assets/world/regional-sources.json), pinned to the project's existing Legends source commit. Offline generation includes all new modules and terrain images.
