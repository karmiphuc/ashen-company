import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ITEMS } from '../src/engine.js';
import { itemImage, portraitHTML, portraitSVG } from '../src/portraits.js';

const PERSON = { seed: 8, name: 'Mara Ash' };
const LAYERS = ['body', 'armor', 'head', 'hair', 'beard', 'helmet', 'shield', 'weapon'];

function equipped(slot, visual) {
  return { [slot]: { id: `${slot}-${visual}`, visual } };
}

function layerSource(html, layer) {
  return html.match(new RegExp(`data-layer="${layer}"[\\s\\S]*?src="([^"]+)"`))?.[1];
}

function appearance(html) {
  return html.match(/data-appearance="(\d+)"/)?.[1];
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

test('equipment visuals use their own authored layers and aligned head anchors', () => {
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
  assert.match(portraitHTML(PERSON, equipped('helmet', 'headwrap')), /helmet-headwrap\.png"[^>]*left:-20px;top:-63px/);
  assert.match(portraitHTML(PERSON, equipped('helmet', 'southernhelm')), /helmet-southern\.png"[^>]*left:-20px;top:-63px/);
  const bascinet = portraitHTML(PERSON, equipped('helmet', 'bascinet'));
  assert.match(bascinet, /bb-portrait-composition"[^>]*top:13px/);
  assert.match(bascinet, /helmet-bascinet\.png"[^>]*left:17px;top:-13px/);
  assert.match(bascinet, /data-layer="head"[^>]*clip-path:polygon\(9px 17px,49px 17px,49px 54px,10px 58px\)/);
  assert.match(bascinet, /data-layer="beard"[^>]*clip-path:polygon\(9px 17px,49px 17px,49px 54px,10px 58px\)/);
});

test('mounts place authored animal layers around the rider without changing unmounted portraits', () => {
  const bare = portraitHTML(PERSON);
  assert.doesNotMatch(bare, /data-layer="mount-/);
  for (const [id, visual, body, head] of [
    ['riding-horse', 'horse', 'mount-horse-body.png', 'mount-horse-head.png'],
    ['war-horse', 'warhorse', 'mount-war-horse-body.png', 'mount-war-horse-head.png'],
    ['armored-war-horse', 'armoredhorse', 'mount-armored-war-horse-body.png', 'mount-armored-war-horse-head.png'],
    ['warg-mount', 'warg', 'mount-wolf-body.png', 'mount-wolf-head.png'],
    ['dire-wolf-mount', 'wolf', 'mount-wolf-body.png', 'mount-wolf-head.png'],
  ]) {
    const html = portraitHTML(PERSON, { mount: { id, visual } });
    assert.equal(layerSource(html, 'mount-body'), `assets/portraits/${body}`);
    assert.equal(layerSource(html, 'mount-head'), `assets/portraits/${head}`);
    assert.ok(html.indexOf('data-layer="mount-body"') < html.indexOf('data-layer="body"'));
    if (['horse', 'warhorse', 'armoredhorse'].includes(visual)) {
      assert.ok(html.indexOf('data-layer="mount-head"') > html.indexOf('data-layer="head"'));
      if (visual === 'horse') {
        assert.match(html, /data-layer="mount-head"[^>]*left:52px;top:35px/);
        assert.match(html, /data-layer="mount-body"[^>]*left:12px;top:42px/);
      } else {
        assert.match(html, /data-layer="mount-head"[^>]*left:55px;top:38px/);
        assert.match(html, /data-layer="mount-body"[^>]*left:-15px;top:20px/);
      }
    } else assert.ok(html.indexOf('data-layer="mount-head"') < html.indexOf('data-layer="body"'));
    assert.match(html, /bb-portrait-rider"[^>]*transform:translate\(2px,0\) scale\(\.76\)/);
    for (const part of ['body', 'head']) {
      assert.match(html, new RegExp(`data-layer="mount-${part}"[^>]*transform:scaleX\\(${['horse', 'warhorse', 'armoredhorse'].includes(visual) ? 1 : -1}\\)`));
    }
    assert.match(itemImage({ id }), new RegExp(`^assets/items/${id}\\.png$`));
  }
});

test('six authored heads remain deterministic across equipment, scale, and battle-style display objects', () => {
  const profiles = new Map();
  for (let seed = 0; seed < 256; seed++) {
    const html = portraitHTML({ seed, name: `Brother ${seed}` });
    assert.match(html, /data-appearance="[0-5]"/);
    assert.match(layerSource(html, 'head'), /^assets\/portraits\/head-.+\.png$/);
    profiles.set(layerSource(html, 'head'), layerSource(html, 'body'));
  }
  assert.equal(profiles.size, 6);
  assert.equal(profiles.get('assets/portraits/head-34.png'), 'assets/portraits/body-03.png');
  for (const [head, body] of profiles) {
    if (head.includes('head-african-')) assert.match(body, /assets\/portraits\/body-african-0[0-2]\.png/);
  }

  const person = { seed: 8831, name: 'Stable Brother' };
  const bare = portraitHTML(person, {}, 54);
  const equippedPortrait = portraitHTML(person, {
    armor: { visual: 'plate' }, helmet: { visual: 'bascinet' }, weapon: { visual: 'sword' }, shield: { visual: 'round' },
  }, 208);
  assert.equal(appearance(bare), appearance(equippedPortrait));
  assert.equal(layerSource(bare, 'head'), layerSource(equippedPortrait, 'head'));
  assert.equal(layerSource(bare, 'body'), layerSource(equippedPortrait, 'body'));
});

test('seed 7391 starter company opens with three visibly distinct authored heads', () => {
  const starters = [
    { name: 'Mara Voss', seed: (7391 ^ 0x1a41) >>> 0 },
    { name: 'Toren Hale', seed: (7391 ^ 0x2b52) >>> 0 },
    { name: 'Bryn Calder', seed: (7391 ^ 0x3c63) >>> 0 },
  ];
  const heads = starters.map(person => layerSource(portraitHTML(person), 'head'));
  assert.equal(new Set(heads).size, starters.length);
});

test('portrait provenance manifest hashes every packaged source raster', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/portraits/legends-source.json', import.meta.url), 'utf8'));
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../assets/portraits/${asset.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file);
  }
});

test('Fantasy war horse layers and icons match their source manifest', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/fantasy-mount-source.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.assets.map(asset => asset.brush), ['xxhorse_1', 'xxheavyhorse_1']);
  for (const asset of manifest.assets) for (const part of ['body', 'head', 'inventory']) {
    const file = asset[part];
    const bytes = readFileSync(new URL(`../${file.path}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  }
});

test('v0.11 item art exists and matches its pinned-source manifest', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/legends-v11-source.json', import.meta.url), 'utf8'));
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../${asset.local}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.local);
  }
  for (const item of ITEMS.filter(item=>!item.collection)) {
    const image = itemImage(item);
    assert.ok(image, `${item.id} has an item-image mapping`);
    assert.doesNotThrow(() => readFileSync(new URL(`../${image}`, import.meta.url)), `${item.id} image exists`);
  }
});

test('v0.12 expansion art exists and matches its pinned-source manifest', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/legends-v12-source.json', import.meta.url), 'utf8'));
  assert.equal(manifest.commit, 'b014cdf8520e69b2383116d1654977e9dbb10d96');
  assert.equal(manifest.assets.length, 71);
  assert.equal(new Set(manifest.assets.map(asset => asset.local)).size, manifest.assets.length);
  const itemIds = new Set(manifest.assets.map(asset => asset.itemId));
  assert.equal(itemIds.size, 36);
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../${asset.local}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.local);
    assert.match(asset.url, new RegExp(`^https://raw\\.githubusercontent\\.com/Battle-Brothers-Legends/Legends-public/${manifest.commit}/`));
  }
});

test('actual engine visuals select distinct authored body equipment layers', () => {
  for (const slot of ['armor', 'helmet', 'weapon', 'shield']) {
    const visuals = [...new Set(ITEMS.filter(item => item.slot === slot && !item.collection).map(item => item.visual))];
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
    if (item.collection) assert.match(itemImage(item), /^data:image\/png;base64,/);
    else assert.match(itemImage(item), new RegExp(`^assets/items/${item.id}\\.png$`));
  }
  assert.equal(itemImage({ id: 'not-an-item' }), null);
  assert.equal(itemImage(null), null);
});
