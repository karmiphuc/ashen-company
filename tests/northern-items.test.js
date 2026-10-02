import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { NORTHERN_ITEMS } from '../src/northern-items.js';
import { VISUALS, itemImage, portraitHTML } from '../src/portraits.js';

test('northern equipment has distinct item art and authored portrait layers', () => {
  assert.equal(NORTHERN_ITEMS.length, 20);
  assert.equal(new Set(NORTHERN_ITEMS.map(item => item.id)).size, NORTHERN_ITEMS.length);
  for (const item of NORTHERN_ITEMS) {
    assert.equal(item.region, 'north');
    assert.equal(item.visual, item.id);
    assert.ok(VISUALS[item.slot][item.visual], `missing ${item.id} portrait mapping`);
    const icon = itemImage(item);
    assert.equal(icon, `assets/items/${item.id}.png`);
    assert.doesNotThrow(() => readFileSync(new URL(`../${icon}`, import.meta.url)));
    const html = portraitHTML({ seed: 3, name: 'Northman' }, { [item.slot]: item });
    assert.match(html, new RegExp(`assets/portraits/(?:armor|helmet|weapon|shield)-${item.id}\\.png`));
  }
});

test('northern art matches the pinned Legends source manifest', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/legends-north-source.json', import.meta.url), 'utf8'));
  assert.equal(manifest.commit, 'b014cdf8520e69b2383116d1654977e9dbb10d96');
  assert.equal(manifest.assets.length, NORTHERN_ITEMS.length * 2);
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../${asset.local}`, import.meta.url));
    assert.equal(bytes.length, asset.bytes, asset.local);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.local);
    const repository=(asset.repository??manifest.repository).replace('https://github.com/','');
    assert.ok(['Battle-Brothers-Legends/Legends-public','kovasap/battle-bros-decompiled'].includes(repository));
    assert.ok(asset.url.startsWith(`https://raw.githubusercontent.com/${repository}/${asset.commit??manifest.commit}/`));
  }
});
