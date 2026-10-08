import test from 'node:test';
import assert from 'node:assert/strict';
import { getItem, createGame, createFamedItemId } from '../src/engine.js';
import { getMainItemComparison } from '../src/item-details.js';
const bro = () => createGame(123).party[0];
const changes = (comparison, label) => comparison.stats.find(row => row.label === label).parts.filter(part => part.change).map(part => part.change);

test('main weapon baseline ignores reserve and pocket weapons without mutating brother', () => {
  const p = bro(); p.reserveEquipment.weapon = 'billhook'; p.accessories = ['rondel-dagger', null];
  const before = structuredClone(p), result = getMainItemComparison(getItem('wood-axe'), p);
  assert.equal(result.equipped.id, 'arming-sword');
  assert.deepEqual(changes(result, 'Hit modifier'), ['worse']);
  assert.deepEqual(p, before);
});
test('damage endpoints compare independently, including a mixed tradeoff', () => {
  const p = bro(), base = getItem(p.equipment.weapon);
  const result = getMainItemComparison({ ...base, damageMin: base.damageMin + 1, damageMax: base.damageMax - 1 }, p);
  assert.deepEqual(changes(result, 'Base damage'), ['better', 'worse']);
  assert.equal(result.stats.find(row => row.label === 'Base damage').parts.map(part => part.text).join(''), `${base.damageMin+1}-${base.damageMax-1}`);
});
test('armor compares both current condition and maximum, with lower load better', () => {
  const p = bro(); p.equipment.armor = 'padded-gambeson'; p.armorDurability.body = 80;
  const base = getItem('padded-gambeson');
  const result = getMainItemComparison({ ...base, armor: 100, fatigue: base.fatigue - 1 }, p, 50);
  assert.deepEqual(changes(result, 'Body armor'), ['worse', 'better']);
  assert.deepEqual(changes(result, 'Fatigue load'), ['better']);
  assert.equal(result.stats.find(row => row.label === 'Body armor').previous, '80 / 85');
});
test('helmets use head slot rather than body or reserve shield', () => {
  const p = bro(); p.armorDurability.head = 0;
  const result = getMainItemComparison(getItem('iron-helm'), p);
  assert.equal(result.equipped.id, 'leather-cap');
  assert.deepEqual(changes(result, 'Head armor'), ['better', 'better']);
});
test('broken main shield supplies zero defense rather than reserve defense', () => {
  const p = bro(); p.armorDurability.shield = 0; p.reserveEquipment.shield = 'kite-shield';
  const result = getMainItemComparison(getItem('round-shield'), p);
  assert.equal(result.equipped.id, 'buckler');
  assert.deepEqual(changes(result, 'Melee defense'), ['better']);
  assert.deepEqual(changes(result, 'Fatigue load'), ['worse']);
});
test('named fatigue savings color both basic attack and shared signature costs', () => {
  const p = bro(); p.equipment.weapon = 'hunting-bow';
  const base = getItem(createFamedItemId('hunting-bow', 41));
  const result = getMainItemComparison({ ...base, fatigueOnSkillUse: -2 }, p);
  assert.deepEqual(changes(result, 'Attack fatigue'), ['better']);
  assert.deepEqual(changes(result, 'Aimed Shot'), ['equal', 'better']);
  assert.equal(result.stats.find(row => row.label === 'Attack skill').parts[0].change, undefined);
});
test('identical items stay neutral and empty main slots never fall back to reserve', () => {
  const p = bro(), item = getItem(p.equipment.weapon);
  assert.deepEqual(changes(getMainItemComparison(item, p), 'Base damage'), ['equal', 'equal']);
  p.equipment.weapon = null; p.reserveEquipment.weapon = 'billhook';
  assert.equal(getMainItemComparison(item, p), null);
  assert.equal(getMainItemComparison(item, null), null);
  assert.equal(getMainItemComparison(getItem('fur-mantle'), p), null);
});

test('missing optional bonuses show ordinary values against an equipped named weapon', () => {
  const p = bro();
  const named = getItem(createFamedItemId('wood-axe', 24));
  p.equipment.weapon = named.id;
  const result = getMainItemComparison(getItem('arming-sword'), p);
  assert.deepEqual(changes(result, 'Shield damage'), ['worse']);
  assert.equal(result.stats.find(row => row.label === 'Shield damage').value, '0 per hit or block');
});
