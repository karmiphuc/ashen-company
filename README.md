# Ashen Company

An offline mercenary-company campaign game for desktop and tablet browsers. Lead a band across the Grey Marches, take delivery and brigand-hunt contracts, recruit and outfit companions, and fight automatic tactical battles. Ashen Company uses adapted *Battle Brothers* / Legends artwork; see [asset credits](docs/ASSET-CREDITS.md).

Play at **https://karmiphuc.github.io/ashen-company/**. No account, server, external fonts, or runtime dependencies are required.

## Play

- Drag the map to pan and pinch to zoom. Select a settlement, hostile camp, or roaming band, then travel or pursue it from the sidebar. Open ground can be tapped to set a destination.
- Visit settlements to buy and sell equipment, trade goods, food, and campaign supplies; recruit up to 12 brothers; and take courier, supply, or brigand-hunt contracts.
- The Marches now cover roughly four times the map area, with 16 settlements. Three fixed brigand camps return after five days; 12 seeded wild camps relocate and regenerate their raiders after three days. Eight hostile bands patrol authored routes: four small nearby groups and four stronger frontier bands. Bands can be pursued and return 48 hours after defeat. The map does not simulate factions or generate a changing campaign.
- Inspect the company to equip armor, helmets, weapons, and shields. The armory now includes a padded gambeson, reinforced mail, bascinet, bludgeon, rondel dagger, billhook, and light crossbow. Head and body armor have separate durability. Backgrounds affect a brother's starting combat stats. On level-up, choose three different attributes from eight; each has a saved +1 to +5 roll. You can defer the choice, and reloading preserves the same rolls. There are no perk trees yet.
- Six deterministic face profiles vary head, hair, beard, and body. The same face stays with its brother as equipment changes, and helmets align with the face and meet the armor at the neck.
- Tap equipment in the company slots or stash, marketplace, or battle spoils to inspect its role, exact combat stats, and handling notes. All 25 items have their own descriptions. Buy, sell, equip, and stow actions are available from the detail view; loot remains unclaimed until you choose to take it.
- Engage a camp or roaming band for an automatic battle on a generated 14 × 8 terrain field. Woods and brush provide ranged cover; mud, trees, elevation, and hills shape movement and shots. Combatants act in initiative order; they route around allies, archers try to keep their distance, and fatigue prompts recovery. Choose Offense to advance, Defense to hold the line, or Thin them out to focus attacks. Use pause, speed, or retreat; you do not select each brother's moves or attacks. Melee attacks swing or thrust, ranged fighters aim and send an arrow or bolt, and hits show armor/health loss. Hitpoints, head/body armor, fatigue, morale, and ammunition affect the battle. This remains a simplified approximation of Battle Brothers' tactical combat, not its full ruleset.
- Survivors carry battle damage back to the campaign. Victories can award equipment, crowns, food, tools, medicine, ammunition, and experience. Brothers who fall stay dead; their worn equipment can be recovered after a victory if the stash has room. Camp for six hours to recover wounds and repair armor using supplies.

The campaign also includes local market stocks and prices, five trade goods, wages and daily provisions, foraging, autosave, and JSON save export/import. Choose 1× or 3× to advance world time while travelling or waiting; pause, menus, and backgrounding stop it. The world does not simulate while the app is closed.

## Install for offline play on iPad

1. Open the game in Safari while online.
2. Choose **Share > Add to Home Screen**. Enable **Open as Web App** if Safari shows that option, then add it.
3. Launch the Home Screen icon and wait for **Offline ready**.
4. Turn on airplane mode, close the app, relaunch it, and confirm your company loads.

These are the intended Safari steps; installation and airplane-mode play have not yet been tested on a physical iPad. Verify them before relying on the game during travel. Progress is saved on the device and does not sync. iPadOS may remove browser storage, so use **Save / Menu > Export save** and keep a backup in Files. **Import save** restores it. The offline indicator confirms app files are cached; it does not guarantee save retention.

## Current limits

- The world has eight authored roaming bands and 12 seeded camps that relocate after defeat. They do not form roaming armies, factions, random encounters, or a procedural campaign.
- Battles use generated terrain on a fixed-size hex field with simplified automatic behavior. Company tactics offer three broad AI orders, but there are no manual unit moves, full Battle Brothers skill trees, perks, or its complete combat simulation.
- Level-ups use a three-of-eight attribute chooser with saved rolls. Traits and perk progression are not implemented.
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
