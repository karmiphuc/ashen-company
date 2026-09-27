# Ashen Company

An offline mercenary-company campaign game for desktop and tablet browsers. Lead a band across the Grey Marches, take delivery and brigand-hunt contracts, recruit and outfit companions, and fight automatic tactical battles. Ashen Company uses adapted *Battle Brothers* / Legends artwork; see [asset credits](docs/ASSET-CREDITS.md).

Play at **https://karmiphuc.github.io/ashen-company/**. No account, server, external fonts, or runtime dependencies are required.

## Play

- Drag the map to pan and pinch to zoom. Select a settlement or hostile camp, then travel from the sidebar. Open ground can be tapped to set a destination.
- Visit settlements to buy and sell equipment, trade goods, food, and campaign supplies; recruit up to 12 brothers; and take courier, supply, or brigand-hunt contracts.
- The current world has eight settlements and three fixed brigand camps. Camp difficulty is shown from one to three; other contract offers do not use a dynamic Battle Brothers-style skull rating. There are no roaming hostile parties or faction simulation.
- Inspect the company to equip armor, helmets, weapons, and shields. Head and body armor have separate durability. Backgrounds affect a brother's starting combat stats; battle experience grants levels and attribute increases. There are no perk trees yet.
- Engage a camp for an automatic battle. Combatants act in initiative order and use simplified automatic movement and attacks. Use pause, speed, or retreat; you do not select each brother's moves or attacks. Hitpoints, head/body armor, fatigue, morale, and ammunition affect the battle. This is a compact approximation of Battle Brothers' tactical combat, not its full ruleset.
- Survivors carry battle damage back to the campaign. Victories can award equipment, crowns, food, tools, medicine, ammunition, and experience. Brothers who fall are lost with their worn equipment. Camp for six hours to recover wounds and repair armor using supplies.

The campaign also includes local market stocks and prices, five trade goods, wages and daily provisions, foraging, autosave, and JSON save export/import. Travel pauses on arrival, when menus are open, and when the app goes into the background. The world does not simulate while the app is closed.

## Install for offline play on iPad

1. Open the game in Safari while online.
2. Choose **Share > Add to Home Screen**. Enable **Open as Web App** if Safari shows that option, then add it.
3. Launch the Home Screen icon and wait for **Offline ready**.
4. Turn on airplane mode, close the app, relaunch it, and confirm your company loads.

These are the intended Safari steps; installation and airplane-mode play have not yet been tested on a physical iPad. Verify them before relying on the game during travel. Progress is saved on the device and does not sync. iPadOS may remove browser storage, so use **Save / Menu > Export save** and keep a backup in Files. **Import save** restores it. The offline indicator confirms app files are cached; it does not guarantee save retention.

## Current limits

- The world contains three authored camps, not roaming armies, faction activity, random encounters, or a procedural campaign.
- Battles run on a small fixed hex field with simplified automatic behavior. There are no manual tactics, full Battle Brothers skill trees, perks, or its complete combat simulation.
- Attribute increases are available after level-ups, but traits and perk progression are not implemented.
- iPad Safari installation, airplane-mode launch, and save retention have not been verified on a physical iPad.

## Development

Requires Node.js 22 or newer. No installation step.

```sh
npm start
npm run prepare-offline
npm test
```

Open `http://127.0.0.1:4173`. The site is static and can be hosted from the main branch root on GitHub Pages. URLs are relative to support project subpaths. After changing app files or artwork, run `npm run prepare-offline` to rebuild the offline list and content-derived cache version, then reload after the new worker activates.

`src/engine.js` holds campaign and combat rules. `src/app.js` binds the interface and local save. `src/battle-view.js` renders the battle, `src/campaign-ui.js` renders company and campaign screens, and `src/portraits.js` assembles character and equipment layers.

See [asset credits](docs/ASSET-CREDITS.md), [research notes](docs/RESEARCH.md), and [verification notes](docs/VERIFICATION.md).
