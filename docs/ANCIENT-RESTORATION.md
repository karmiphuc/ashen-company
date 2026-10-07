# Ancient Armory restoration

An Armorer at every open settlement restores ancient equipment independently of
Odran's quest or randomly generated specialist facilities. Body recipes consume
three matching ordinary stash pieces and 450 crowns; helmet recipes consume two
and 300 crowns. Counts include all materials: there is no additional target item.
Worn/broken pieces qualify. Equipped, named, reforged, and already restored items
do not. Players select exact copies; initial selection favors the most worn.

Each confirmed attempt consumes all submitted pieces. The primary roll is 80%
bronze, 10% silverish steel, and 10% failure. Failure creates no item and refunds
225 crowns for body armor or 150 for helmets. Success produces one fully repaired
piece, followed by an independent 3% named roll using existing version-7 affixes.
Steel adds 20% protection and 12% fatigue to the bronze baseline, rounded to the
nearest integer once, before named bonuses. Unconditional outcomes are 77.6%
ordinary bronze, 2.4% named bronze, 9.7% ordinary steel, 0.3% named steel, 10% failure.

## Restored baselines

The first three body targets below were chosen explicitly by the player. The
remaining metal armor and helmet baselines are implementation defaults, preserving
the relative tier order and protection-to-fatigue efficiency above 10:1. Robes,
ripped cloth, laurels and priest/lich headpieces are not metal restoration recipes.

| Ancient design | Bronze armor / fatigue | Steel armor / fatigue |
| --- | ---: | ---: |
| Breastplate | 180 / 16 | 216 / 18 |
| Plate Harness | 260 / 20 | 312 / 22 |
| Plated Scale Hauberk | 280 / 22 | 336 / 25 |
| Mail | 140 / 12 | 168 / 13 |
| Double Layer Mail | 160 / 13 | 192 / 15 |
| Scale Harness | 170 / 14 | 204 / 16 |
| Scale Coat | 250 / 20 | 300 / 22 |
| Plated Mail Hauberk | 240 / 19 | 288 / 21 |
| Household Helmet | 130 / 9 | 156 / 10 |
| Legionary Helmet | 180 / 12 | 216 / 13 |
| Honor Guard Helmet | 240 / 16 | 288 / 18 |

## Identity, save and integration rules

`src/ancient-restoration.js` defines craft-only, immutable catalog variants with
`restorationSourceId` and `restorationFinish`. Famed and forged identities resolve
against the restored variant's baseline, retaining finish. Named affixes keep the
existing two-prefix/two-suffix limits. Restoration cannot be repeated to stack
baseline upgrades; ordinary ancient definitions and existing active battles are
unchanged. Restored items qualify for the existing Ancient set through original
design identity and keep the ancient helmets' existing morale immunity. No new
set bonus or morale rule is introduced.

The optional `ancientRestorationSerial` is validated and saved. Older saves can
omit it; read-only previews do not add it. RNG is seeded by campaign seed and
attempt serial, independent of material choice, preview count, town and day.
Quotes never disclose the future outcome. Failed and successful attempts advance
the serial equally, and stale quotes cannot spend twice. Loading a post-attempt
save retains the consumed pieces, net fee, output and serial; previews/reopening
the service cannot reroll. As with existing campaign RNG, deliberately restoring
an external pre-attempt backup restores that earlier campaign state.

The UI computes the transaction on a cloned state and writes the complete save
before adopting it. A failed storage write leaves the current company unchanged
and permits a deterministic retry. The result replaces consumed materials, so a
full stash does not require an extra free slot. Double confirmations are rejected.
Craft-only variants are excluded from normal restocks, shipments and courier stock
rewards, but can be equipped, sold and bought back normally.

## Art

Run `node tools/content/restore-ancient-art.mjs` to regenerate the 44 PNGs and
`src/ancient-restoration-art.js`. Selective color masks reveal warm bronze or cool
silverish steel while retaining traces of patina, dark recesses, iron mail,
leather and plumes. This uses the original inventory icons and worn-layer pixels,
not the generated concept illustration: dimensions, alpha, silhouettes and
portrait anchors stay unchanged. The local source manifest records input/output
SHA-256 hashes and refers to the original source provenance manifest.

The same finish is used in inventory, crafting previews, item inspection,
company portraits and combat. The offline cache automatically includes the new
runtime modules and PNGs; regenerate the service worker with `npm run prepare-offline`.
