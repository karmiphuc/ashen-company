import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ARMOR_ATTACHMENTS } from '../src/armor-attachments.js';
import { itemImage, portraitHTML } from '../src/portraits.js';

const PERSON = { seed: 8, name: 'Mara Ash' };
const ARMOR = { id: 'mail-shirt', visual: 'mail' };

test('every attachment has its source icon and fitted overlays only where visible', () => {
  assert.equal(ARMOR_ATTACHMENTS.length, 15);
  const visibleSources = [];
  for (const item of ARMOR_ATTACHMENTS) {
    assert.equal(itemImage(item), `assets/items/${item.id}.png`);
    assert.doesNotThrow(() => readFileSync(new URL(`../assets/items/${item.id}.png`, import.meta.url)));
    const html = portraitHTML(PERSON, { armor: ARMOR, attachment: item });
    if (['padded-lining', 'leather-reinforcement'].includes(item.id)) {
      assert.doesNotMatch(html, /data-layer="attachment-(?:front|back)"/);
    } else {
      assert.match(html, /data-layer="attachment-front"/);
      assert.ok(html.indexOf('data-layer="armor"') < html.indexOf('data-layer="attachment-front"'));
      visibleSources.push(html.match(/data-layer="attachment-front"[^>]*src="([^"]+)"/)?.[1]);
    }
    if (['fur-mantle', 'horned-pauldrons', 'heraldic-shoulders'].includes(item.id)) {
      assert.match(html, /data-layer="attachment-back"/);
      assert.ok(html.indexOf('data-layer="attachment-back"') < html.indexOf('data-layer="armor"'));
    }
  }
  assert.equal(visibleSources.length, 13);
  assert.equal(new Set(visibleSources).size, visibleSources.length);
});

test('attachment art matches the pinned Legends source manifest', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/legends-attachments-source.json', import.meta.url), 'utf8'));
  assert.equal(manifest.commit, 'b014cdf8520e69b2383116d1654977e9dbb10d96');
  assert.equal(manifest.assets.length, 31);
  assert.equal(new Set(manifest.assets.map(asset => asset.local)).size, manifest.assets.length);
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../${asset.local}`, import.meta.url));
    assert.equal(bytes.length, asset.bytes, asset.local);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.local);
  }
});
