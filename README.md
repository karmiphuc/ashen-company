# Ashen Company

An offline mercenary-company campaign game for desktop and tablet browsers. Lead a band across the Grey Marches, take contracts, recruit and equip companions, and fight automatic tactical battles.

**[Play Ashen Company](https://karmiphuc.github.io/ashen-company/)** · [Player guide](docs/gameplay/GUIDE.md) · [Documentation](docs/README.md) · [Release log](docs/releases/CHANGELOG.md)

## Play

- Tap a settlement or enemy to inspect it; double-click or double-tap to enter, travel or attack.
- Recruit up to 18 brothers, deploy up to 15, and arrange reserves and formation before battle.
- Use settlement markets, the Doctor, Smithy and Armorer to prepare your company.
- Choose company tactics and individual combat roles; battles run automatically with pause, speed and retreat controls.
- Progress saves on this device. Use **Save / Menu → Export save** to keep a backup.

See the [player guide](docs/gameplay/GUIDE.md) for campaign controls, crafting, combat, recovery and offline installation.

## Development

Use Node.js 24, matching the release workflow.

```sh
npm ci
npm start
```

Open `http://127.0.0.1:4173`. After changing runtime files or artwork, regenerate the offline cache:

```sh
npm run prepare-offline
npm test
```

For a production build and browser checks:

```sh
npm run build
npx playwright install --with-deps chromium
npm run test:release
```

Production builds require full Git history with the release base in the first-parent history. The [development guide](docs/development/README.md) covers the source layout and validation; the [release process](docs/development/RELEASES.md) covers automatic versions, GitHub Pages and safe offline updates.

## Documentation

Start with the [documentation index](docs/README.md). It separates current gameplay and equipment references from research, future plans and historical verification.

- [Release log](docs/releases/CHANGELOG.md) and [detailed release notes](docs/releases/NOTES.md)
- [Equipment sets and crafting](docs/equipment/EQUIPMENT-DESIGN-FEATURES.md)
- [Ancient restoration](docs/equipment/ANCIENT-RESTORATION.md) and [Direwolf Moonfang crafting](docs/equipment/DIREWOLF-MOONFANG.md)
- [World and regions](docs/world/REGIONAL-WORLD.md)
- [Asset credits](docs/art/ASSET-CREDITS.md)

Ashen Company uses adapted *Battle Brothers* / Legends artwork and is a personal noncommercial prototype. See the asset credits for sources and licensing.
