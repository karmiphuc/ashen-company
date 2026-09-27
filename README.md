# Ashen Company

An original, offline mercenary-company web game inspired by the strategic travel and layered equipment of Battle Brothers and Mount & Blade. Built for touch, including iPad. No account, server, external fonts, or runtime dependencies.

## Play

Open **https://karmiphuc.github.io/ashen-company/**.

1. Start at Oakwatch with three companions and 900 crowns.
2. Take a delivery contract. Tap its destination to travel; use 1x or 3x speed.
3. Collect payment automatically on arrival, then take another job.
4. Buy equipment in settlements. Open **The company** and equip it from baggage.
5. Recruit up to eight companions, camp to heal, and forage for provisions.

Every companion consumes one provision and earns five crowns per day. Travel pauses on arrival, when opening a menu, and when the app goes into the background. There is no progress simulation while the app is closed. Roads and the small wandering caravan are visual scenery; movement is direct and terrain changes speed.

## Before a flight

In Safari on your iPad, open the game online, choose **Share > Add to Home Screen**, enable **Open as Web App** if shown, and launch the new icon. Wait for **Offline ready**. Then turn on airplane mode, close and reopen the game from its icon, and verify your company is present.

Progress saves to this device. Use **Settings > Export save** to keep a backup in Files; **Import save** restores it. Saves do not sync between devices. Browser data can be evicted by iPadOS under storage pressure, so export before travelling. The readiness indicator checks that every required app file is cached.

## Current scope

- Eight settlements on an original continuous map; tap-to-travel, pause and speed controls.
- Renewable delivery contracts, wages, food, camping, foraging and recruiting.
- Eighteen equipment items across body armor, helmets, weapons and shields.
- Original SVG character portraits with separate equipment layers, varied faces, and instant visual updates.
- Local autosave, validated JSON import/export and an offline service worker.
- Responsive tablet landscape, portrait and phone layouts.

This is the first playable overworld prototype, not a full Battle Brothers clone. Map layout and settlement stocks are fixed. Protection, weapon power and gear fatigue are displayed groundwork for phase 2; they do not currently drive combat. There are no battles, enemies, tactical formations, loot drops, procedural campaigns or faction simulation yet.

## Phase 2: automated battles

Add encounters and an auto-resolved battle scene where the equipped portraits fight without manual turn control. Carry armor, weapon power, fatigue, injuries and loot back into the campaign. Keep the map and economic loop playable independently.

## Development

Requires Node.js 22 or newer. No installation step.

```sh
npm start
npm test
```

Open `http://127.0.0.1:4173`. The website is static and can be hosted directly from the main branch root on GitHub Pages. All URLs are relative to support project subpaths. When changing app assets, increment the cache version in `sw.js` so previously installed clients refresh their offline bundle.

`src/engine.js` holds pure game rules. `src/app.js` binds the UI and local save. `src/portraits.js` assembles original SVG layers. `src/map.js` draws the world. The 160x160 portrait canvas anchors heads and shoulders consistently; the draw order is background, rear weapon, torso/armor, face, helmet, foreground shield, finish.

See [the research notes](docs/RESEARCH.md) for primary sources, design decisions and iPad storage limitations, and [verification](docs/VERIFICATION.md) for the tested boundary.
