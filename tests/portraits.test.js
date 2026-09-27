import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/engine.js';
import { itemImage, portraitHTML, portraitSVG } from '../src/portraits.js';

const PERSON = { seed: 491, name: 'Mara Ash' };
const LAYERS = ['body', 'armor', 'head', 'hair', 'beard', 'helmet', 'shield', 'weapon'];

function equipped(slot, visual) {
  return { [slot]: { id: `${slot}-${visual}`, visual } };
}

test('portrait output is deterministic and preserves authored raster draw order', () => {
  const equipment = {
    armor: { id: 'plate-harness', visual: 'plate' }, helmet: { id: 'greathelm', visual: 'greathelm' },
    weapon: { id: 'hunting-bow', visual: 'bow' }, shield: { id: 'kite-shield', visual: 'kite' },
  };
  const one = portraitSVG(PERSON, equipment, 208);
  assert.equal(one, portraitHTML(PERSON, equipment, 208));
  assert.equal(one, portraitSVG(PERSON, equipment, 208));
  assert.match(one, /data-portrait-canvas="104x142"/);
  assert.match(one, /width:208px;height:284px/);
  assert.match(one, /transform:scale\(2\);transform-origin:top left/);
  assert.deepEqual([...one.matchAll(/data-layer="([a-z]+)"/g)].map(match => match[1]), LAYERS.filter(layer => !['hair', 'beard'].includes(layer)));
  assert.ok(!one.includes('background:#ead8ad'));
  const unhelmeted = portraitSVG(PERSON, { armor: equipment.armor, weapon: equipment.weapon, shield: equipment.shield });
  assert.deepEqual([...unhelmeted.matchAll(/data-layer="([a-z]+)"/g)].map(match => match[1]), LAYERS);
  const openHelm = portraitSVG(PERSON, { helmet: { id: 'iron-helm', visual: 'nasal' } });
  assert.ok(!openHelm.includes('data-layer="hair"'));
  assert.ok(openHelm.includes('data-layer="beard"'));
  assert.match(one, /data-layer="weapon"[^>]*left:63px;top:53px;--layer-rest:rotate\(-30deg\);--layer-origin:27px 42px;--weapon-rest:rotate\(-30deg\);--weapon-origin:27px 42px;transform:rotate\(-30deg\);transform-origin:27px 42px/);
});

test('v0.5 visuals use their own authored layers and aligned head anchors', () => {
  const expected = [
    ['armor', 'gambeson', 'armor-gambeson.png'], ['armor', 'reinforcedmail', 'armor-reinforced-mail.png'],
    ['helmet', 'bascinet', 'helmet-bascinet.png'], ['weapon', 'mace', 'weapon-mace.png'],
    ['weapon', 'dagger', 'weapon-dagger.png'], ['weapon', 'crossbow', 'weapon-crossbow.png'],
    ['weapon', 'billhook', 'weapon-billhook.png'],
  ];
  for (const [slot, visual, file] of expected) {
    assert.match(portraitHTML(PERSON, equipped(slot, visual)), new RegExp(`assets/portraits/${file}`));
  }
  assert.match(portraitHTML(PERSON), /data-layer="body"[^>]*left:11px;top:50px/);
  assert.match(portraitHTML(PERSON, equipped('helmet', 'nasal')), /helmet-nasal\.png"[^>]*left:-20px;top:-55px/);
  assert.match(portraitHTML(PERSON, equipped('helmet', 'bascinet')), /helmet-bascinet\.png"[^>]*left:-26px;top:-53px/);
});

test('actual engine visuals select distinct authored body equipment layers', () => {
  for (const slot of ['armor', 'helmet', 'weapon', 'shield']) {
    const visuals = [...new Set(ITEMS.filter(item => item.slot === slot).map(item => item.visual))];
    const sources = visuals.map(value => {
      const html = portraitHTML(PERSON, equipped(slot, value));
      return html.match(new RegExp(`data-layer="${slot}"[^>]*src="([^"]+)"`))?.[1];
    });
    assert.equal(new Set(sources).size, visuals.length, `${slot} needs one raster layer per visual`);
    for (const source of sources) assert.match(source, /^assets\/portraits\/.+\.png$/);
  }
});

test('engine item IDs resolve to packaged inventory icons and unknown items are safe', () => {
  for (const item of ITEMS) {
    assert.match(itemImage(item), new RegExp(`^assets/items/${item.id}\\.png$`));
  }
  assert.equal(itemImage({ id: 'not-an-item' }), null);
  assert.equal(itemImage(null), null);
});
