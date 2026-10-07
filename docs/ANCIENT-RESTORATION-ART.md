# Ancient Restoration finishes

The armorer uses generated recolors of the original Ancient sprites in
`src/dlc-art.js`. Run `node tools/content/restore-ancient-art.mjs` to regenerate
inventory icons, worn layers and the source/output hash manifest.

Bronze retains its existing warm, shadow-preserving recolor. Restored steel uses
neutral iron shadows and restrained zinc-silver highlights. Existing interior
creases are darkened on the metal side using source-neighbor luminance; lit
surfaces receive a small, deterministic faceted variation inspired by galvanized
steel. The texture is deliberately subtle at inventory/combat scale. This is a
material treatment, not an assertion of historical galvanizing techniques.

The source metal mask excludes neutral mail, dark leather and helmet plumes;
the breastplate's leather skirt is excluded spatially. Pixel dimensions, every
alpha value, portrait anchors and equipment silhouettes remain unchanged. No
plates, pauldrons or ornaments are added: those would require matching icon and
worn-layer drawings for every design. Named steel uses the same finish assets.

Tests in `tests/ancient-restoration.test.js` verify unchanged geometry/alpha,
dark seams, highlight separation, deterministic restrained zinc texture and
untextured bronze. Restoration odds, stats and item IDs are unchanged.
