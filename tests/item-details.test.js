import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/engine.js';
import { getItemDetails } from '../src/item-details.js';

const item = id => ITEMS.find(entry => entry.id === id);
const value = (details, label) => details.stats.find(stat => stat.label === label)?.value;

test('every catalog item has useful details without changing the item', () => {
  assert.equal(ITEMS.length, 99);
  for (const entry of ITEMS) {
    const before = structuredClone(entry);
    const details = getItemDetails(entry);
    assert.equal(details.description, entry.description);
    assert.ok(details.role.length > 45, `${entry.id} needs a distinct use case`);
    assert.ok(details.stats.length >= 2, `${entry.id} needs mechanical stats`);
    assert.ok(details.stats.every(stat => typeof stat.label === 'string' && stat.label && typeof stat.value === 'string' && stat.value));
    assert.ok(details.notes.length >= 2 && details.notes.every(note => typeof note === 'string' && note.length > 20));
    assert.deepEqual(entry, before);
  }
  assert.equal(getItemDetails(null), null);
  assert.equal(getItemDetails({ id: 'unknown', slot: 'weapon' }), null);
});

test('bow and crossbow explain actual ranged costs and differences', () => {
  const bow = getItemDetails(item('hunting-bow'));
  assert.equal(value(bow, 'Base damage'), '16-26');
  assert.equal(value(bow, 'Hit modifier'), '0');
  assert.equal(value(bow, 'Armor damage'), '60% of base hit');
  assert.equal(value(bow, 'Damage through armor'), '30% of base hit');
  assert.equal(value(bow, 'Reach'), '4 hexes');
  assert.equal(value(bow, 'Attack skill'), 'Ranged');
  assert.equal(value(bow, 'Attack fatigue'), '9');
  assert.equal(value(bow, 'Ammunition'), '1 per shot');
  assert.equal(value(bow, 'Reload'), undefined);
  assert.ok(bow.notes.some(note => note.includes('12-point hit penalty')));
  assert.ok(bow.notes.some(note => note.includes('When ammunition runs out, they draw a pocket weapon')));
  assert.ok(bow.notes.some(note => note.includes('percentage points')));
  assert.ok(bow.notes.some(note => note.includes('22% of landed hits')));

  const crossbow = getItemDetails(item('light-crossbow'));
  assert.equal(value(crossbow, 'Base damage'), '25-38');
  assert.equal(value(crossbow, 'Hit modifier'), '+8');
  assert.equal(value(crossbow, 'Armor damage'), '120% of base hit');
  assert.equal(value(crossbow, 'Damage through armor'), '45% of base hit');
  assert.equal(value(crossbow, 'Reach'), '5 hexes');
  assert.equal(value(crossbow, 'Reload'), '1 turn after each shot');
  assert.equal(value(crossbow, 'Hands'), 'Two; shield stowed');
});

test('billhook, dagger, and axe show their real tradeoffs', () => {
  const billhook = getItemDetails(item('billhook'));
  assert.equal(value(billhook, 'Reach'), '2 hexes');
  assert.equal(value(billhook, 'Attack skill'), 'Melee');
  assert.equal(value(billhook, 'Attack fatigue'), '15');
  assert.equal(value(billhook, 'Ammunition'), undefined);
  assert.ok(billhook.notes.some(note => note.includes('does not spend ammunition')));

  const dagger = getItemDetails(item('rondel-dagger'));
  assert.equal(value(dagger, 'Base damage'), '12-19');
  assert.equal(value(dagger, 'Hit modifier'), '+12');
  assert.equal(value(dagger, 'Armor damage'), '45% of base hit');
  assert.equal(value(dagger, 'Damage through armor'), '75% of base hit');
  assert.equal(value(dagger, 'Attack fatigue'), '11');
  assert.equal(value(getItemDetails(item('wood-axe')), 'Hit modifier'), '-5');
});

test('shields give defense rather than armor, while gear shows current durability', () => {
  const shield = getItemDetails(item('kite-shield'));
  assert.equal(value(shield, 'Melee defense'), '+18');
  assert.equal(value(shield, 'Ranged defense'), '+18');
  assert.equal(value(shield, 'Fatigue load'), '8');
  assert.equal(value(shield, 'Body armor'), undefined);
  assert.ok(shield.notes.some(note => note.includes('does not provide body or head armor')));

  const gambeson = getItemDetails(item('padded-gambeson'), 44);
  assert.equal(value(gambeson, 'Body armor'), '44 / 85');
  assert.equal(value(gambeson, 'Fatigue load'), '10');
  assert.equal(value(getItemDetails(item('padded-gambeson')), 'Body armor'), '85 / 85');
  assert.equal(value(getItemDetails(item('bascinet'), 70), 'Head armor'), '70 / 175');
  assert.ok(getItemDetails(item('bascinet')).notes.some(note => note.includes('22% of landed hits')));
  assert.equal(value(getItemDetails(item('greathelm'), -10), 'Head armor'), '0 / 210');
});
