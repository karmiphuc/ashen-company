# Ashen Company

An offline mercenary-company overworld game for iPad and desktop browsers. Travel between settlements, trade local goods, provision the company, fulfil contracts, recruit companions, and outfit them with layered armor, helmets, weapons, and shields. The art includes Battle Brothers / Legends assets; see [asset credits](docs/ASSET-CREDITS.md).

Play at **https://karmiphuc.github.io/ashen-company/**. No account, server, external fonts, or runtime dependencies are required.

## Play

- Drag the map to pan and pinch to zoom. Tap a settlement to select it, then use the sidebar to travel there. Tapping open ground starts travel directly. Travel can be paused or run at 1x or 3x speed.
- At settlements, recruit companions and use the marketplace to buy or sell equipment, trade goods, and provisions. Local stock and prices vary.
- Take courier jobs for a delivery payment, or buy the requested cargo for a supply contract. Supply goods are consumed on delivery. Good routes include Oakwatch timber to Highpass, Saltwick salt to Thornwall, and Ironford iron to Saltwick.
- Equip the company from the Equipment view. Tap a companion portrait to select them; choose a carried item to equip it or return equipment to baggage.
- Camp to heal or forage for food. Each companion eats one provision and costs five crowns per day. Carrying capacity for trade cargo is 30 items.

Travel pauses at arrival, when a menu is open, and when the app goes into the background. The world does not simulate while the app is closed.

## Install for offline play on iPad

1. Open the game in Safari while online.
2. Choose **Share > Add to Home Screen**. Enable **Open as Web App** if Safari shows that option, then add it.
3. Launch the new Home Screen icon and wait for **Offline ready**.
4. Turn on airplane mode, close the app, reopen it from the icon, and confirm the company loads.

Progress is saved on this device and does not sync. Browser storage can be removed by iPadOS, so use **Save / Menu > Export save** and keep the file in Files before travelling. Use **Import save** to restore it. The offline indicator checks whether required app files are cached; it does not guarantee the device will retain the save.

## Current scope

- Eight settlements on an original continuous map, with map drag/pinch controls, terrain-adjusted travel, pause, and speed controls.
- Courier and supply contracts, local market prices and stocks, five trade goods, provisions, recruiting, camping, and foraging.
- Eighteen equipment items across body armor, helmets, weapons, and shields, shown on layered companion portraits.
- Local autosave, validated JSON save import/export, and a service worker for offline launch.
- Responsive tablet landscape, portrait, and phone layouts.

This is a playable overworld prototype. There is no combat yet. Protection, weapon power, and fatigue are displayed groundwork for phase 2; they do not currently drive battles. Tactical formations, enemies, loot drops, procedural campaigns, and faction simulation are not implemented.

## Phase 2: automated battles

Add encounters and an auto-resolved battle scene where equipped companions fight without manual turn control. Carry armor, weapon power, fatigue, injuries, and loot back into the campaign.

## Development

Requires Node.js 22 or newer. No installation step.

```sh
npm start
npm run prepare-offline
npm test
```

Open `http://127.0.0.1:4173`. The site is static and can be hosted from the main branch root on GitHub Pages. URLs are relative to support project subpaths. After changing app files or artwork, run `npm run prepare-offline` to rebuild the complete offline list and content-derived cache version, then reload the preview after its new worker activates.

`src/engine.js` holds game rules. `src/app.js` binds the UI and local save. `src/portraits.js` assembles the character and equipment layers. `src/map.js` draws and navigates the world map. Portrait layers share fixed anchors so equipment remains aligned as it is added.

See [asset credits](docs/ASSET-CREDITS.md), [research notes](docs/RESEARCH.md), and [verification notes](docs/VERIFICATION.md).
