import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/engine.js';
import { portraitSVG } from '../src/portraits.js';

const PERSON = { seed: 491, name: 'Mara Ash', skin: '#c9825f' };
const SLOT_ORDER = ['background', 'weapon', 'torso', 'face', 'helmet', 'shield', 'finish'];

function equipmentFor(slot, visual) {
  return { [slot]: { id: `${slot}-${visual}`, visual } };
}

test('portrait SVG is deterministic and keeps stable drawing layers', () => {
  const equipment = {
    armor: { id: 'plate-harness', visual: 'plate' },
    helmet: { id: 'greathelm', visual: 'greathelm' },
    weapon: { id: 'hunting-bow', visual: 'bow' },
    shield: { id: 'kite-shield', visual: 'kite' },
  };
  const one = portraitSVG(PERSON, equipment, 280);
  const two = portraitSVG(PERSON, equipment, 280);

  assert.equal(one, two);
  assert.match(one, /viewBox="0 0 160 160" width="280" height="280"/);
  assert.deepEqual([...one.matchAll(/data-layer="([a-z]+)"/g)].map(match => match[1]), SLOT_ORDER);
  assert.ok(one.indexOf('data-layer="weapon"') < one.indexOf('data-layer="torso"'));
  assert.ok(one.indexOf('data-layer="helmet"') > one.indexOf('data-layer="face"'));
  assert.ok(one.indexOf('data-layer="shield"') > one.indexOf('data-layer="helmet"'));
});

test('every engine visual has a distinct SVG treatment in its equipment slot', () => {
  const visualsBySlot = new Map();
  for (const item of ITEMS) {
    if (!visualsBySlot.has(item.slot)) visualsBySlot.set(item.slot, new Set());
    visualsBySlot.get(item.slot).add(item.visual);
  }

  for (const [slot, visuals] of visualsBySlot) {
    const portraits = [...visuals].map(visual => portraitSVG(PERSON, equipmentFor(slot, visual)));
    assert.equal(new Set(portraits).size, visuals.size, `${slot} visuals should have distinct art`);
  }
});

test('portrait colors accept hex values and reject unsafe SVG/CSS values', () => {
  const valid = portraitSVG(
    { ...PERSON, skin: '#a1b2c3' },
    {
      armor: { id: 'test-armor', visual: 'leather', color: '#123abc' },
      helmet: { id: 'test-helm', visual: 'nasal', color: '#456def' },
      weapon: { id: 'test-weapon', visual: 'sword', color: '#789abc' },
      shield: { id: 'test-shield', visual: 'round', color: '#abcdef' },
    },
  );
  for (const color of ['#a1b2c3', '#123abc', '#456def', '#789abc', '#abcdef']) {
    assert.ok(valid.includes(color), `expected safe color ${color}`);
  }

  const unsafe = 'url(#injected)';
  const sanitized = portraitSVG(
    { ...PERSON, skin: unsafe },
    {
      armor: { id: 'unsafe-armor', visual: 'plate', color: unsafe },
      helmet: { id: 'unsafe-helm', visual: 'greathelm', color: unsafe },
      weapon: { id: 'unsafe-weapon', visual: 'axe', color: unsafe },
      shield: { id: 'unsafe-shield', visual: 'kite', color: unsafe },
    },
  );
  assert.ok(!sanitized.includes(unsafe));
  assert.match(sanitized, /fill="#[0-9a-f]{3,8}"/i);
});
