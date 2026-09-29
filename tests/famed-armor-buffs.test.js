import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, createFamedItemId, getItem, getCompanyStats, getMarket,
  equipItem, unequipItem, sellItem, buyItem, startBattle, validateSave,
} from '../src/engine.js';

const signatures = [
  { id: 'guarded', key: 'meleeDefense', label: 'Melee defense', minimum: 2, count: 3 },
  { id: 'deflecting', key: 'rangedDefense', label: 'Ranged defense', minimum: 3, count: 3 },
  { id: 'stalwart', key: 'resolve', label: 'Resolve', minimum: 4, count: 4 },
  { id: 'vigorous', key: 'maxFatigue', label: 'Maximum fatigue', minimum: 4, count: 4 },
];

test('famed armor and helmets keep their protection roll while fatigue relief scales 1.5 to 2 times', () => {
  const factors = new Set();
  const reliefs = new Set();
  const seenSignatures = new Set();
  for (const baseId of ['mail-shirt', 'greathelm']) {
    const base = getItem(baseId);
    for (let index = 0; index < 1024; index++) {
      const seed = (Math.imul(index, 0x9e3779b9) + 0x12345678) >>> 0;
      const id = createFamedItemId(baseId, seed);
      const item = getItem(id);
      const oldReduction = 1 + ((seed >>> 4) & 15) % 3;
      const factor = 1.5 + (((seed >>> 8) & 15) % 3) * .25;
      const relief = Math.ceil(oldReduction * factor);
      const protection = Math.max(8, Math.round(base.armor * (.15 + ((seed >>> 0) & 15) / 100)));
      const signature = signatures[((seed >>> 12) & 15) % 4];
      const expectedStat = signature.minimum + (((seed >>> 16) & 15) % signature.count);
      factors.add(factor);
      reliefs.add(relief);
      seenSignatures.add(item.signature);
      assert.equal(item.id, id);
      assert.equal(item.armor, Math.min(500, base.armor + protection));
      assert.equal(item.fatigue, Math.max(0, base.fatigue - relief));
      assert.ok(item.fatigue >= 0);
      assert.equal(item.signature, signature.id);
      assert.deepEqual(item.statBonuses, { [signature.key]: expectedStat });
      assert.ok(Object.isFrozen(item.statBonuses));
      assert.ok(item.bonuses.some(row => row.label === signature.label && row.value === `+${expectedStat}`));
      assert.ok(item.bonuses.some(row => row.label === 'Fatigue cost' && row.value === `-${base.fatigue - item.fatigue}`));
      assert.match(item.name, new RegExp(base.name));
      assert.ok(item.description.includes(base.description));
      assert.deepEqual(getItem(id), item);
    }
  }
  assert.deepEqual([...factors].sort(), [1.5, 1.75, 2]);
  assert.deepEqual([...reliefs].sort((a, b) => a - b), [2, 3, 4, 5, 6]);
  assert.deepEqual([...seenSignatures].sort(), signatures.map(entry => entry.id).sort());
});

test('famed armor and helmet signatures add their stats once and stack when equipped', () => {
  const state = createGame(733);
  const captain = state.party[0];
  const ids = ['mail-shirt', 'greathelm'];
  const observed = {};
  for (const [index, signature] of signatures.entries()) {
    const baseId = ids[index % 2];
    const slot = getItem(baseId).slot;
    const seed = index * 4096 + 3 * 65536;
    const famedId = createFamedItemId(baseId, seed);
    const famed = getItem(famedId);
    assert.equal(famed.signature, signature.id);
    state.inventory.push(baseId, famedId);
    state.inventoryCondition.push(getItem(baseId).armor, famed.armor);
    assert.equal(equipItem(state, 'captain', baseId).ok, true);
    const ordinary = getCompanyStats(captain);
    assert.equal(equipItem(state, 'captain', famedId).ok, true);
    const boosted = getCompanyStats(captain);
    const fatigueRelief = getItem(baseId).fatigue - famed.fatigue;
    for (const key of ['meleeDefense', 'rangedDefense', 'resolve']) {
      assert.equal(boosted[key] - ordinary[key], famed.statBonuses[key] ?? 0, `${signature.id} ${key}`);
    }
    assert.equal(boosted.initiative - ordinary.initiative, fatigueRelief);
    assert.equal(boosted.maxFatigue - ordinary.maxFatigue, fatigueRelief + (famed.statBonuses.maxFatigue ?? 0));
    observed[slot] = famed;
  }
  const combined = getCompanyStats(captain);
  assert.equal(combined[signatures[3].key] - getCompanyStats({ ...captain, equipment: { ...captain.equipment, helmet: 'greathelm' } })[signatures[3].key], observed.helmet.statBonuses.maxFatigue + (getItem('greathelm').fatigue - observed.helmet.fatigue));
  assert.deepEqual(validateSave(state), state);
  state.position = { x: 440, y: 520 };
  assert.equal(startBattle(state, 'quarry-camp').ok, true);
  const unit = state.battle.units.find(entry => entry.id === 'captain');
  assert.equal(unit.meleeDefense, combined.meleeDefense);
  assert.equal(unit.rangedDefense, combined.rangedDefense);
  assert.equal(unit.resolve, combined.resolve);
  assert.equal(unit.maxFatigue, combined.maxFatigue);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('an existing famed armor ID survives equip, damaged stow, resale, buyback, and reload', () => {
  const state = createGame(734);
  const id = 'famed:mail-shirt:987654321';
  const item = getItem(id);
  state.inventory.push(id);
  state.inventoryCondition.push(item.armor);
  assert.equal(equipItem(state, 'captain', id).ok, true);
  state.party[0].armorDurability.body -= 17;
  assert.equal(unequipItem(state, 'captain', 'armor').ok, true);
  const condition = state.inventoryCondition[state.inventory.indexOf(id)];
  assert.equal(condition, item.armor - 17);
  assert.equal(sellItem(state, id).ok, true);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === id).stock, 1);
  state.gold = 5000;
  assert.equal(buyItem(state, id).ok, true);
  assert.equal(state.inventoryCondition[state.inventory.indexOf(id)], condition);
  const reloaded = validateSave(JSON.parse(JSON.stringify(state)));
  assert.ok(reloaded.inventory.includes(id));
  assert.equal(reloaded.inventoryCondition[reloaded.inventory.indexOf(id)], condition);
  assert.deepEqual(getItem(id), item);
});

test('famed shields and weapons keep their existing rolls and gain no armor signature', () => {
  for (let seed = 0; seed < 512; seed++) {
    const shield = getItem(createFamedItemId('round-shield', seed));
    const weapon = getItem(createFamedItemId('arming-sword', seed));
    const baseShield = getItem('round-shield');
    const baseWeapon = getItem('arming-sword');
    assert.equal(shield.defense, baseShield.defense + 2 + (seed & 15) % 4);
    assert.equal(shield.fatigue, Math.max(0, baseShield.fatigue - (1 + ((seed >>> 4) & 15) % 3)));
    assert.equal(weapon.damageMin, baseWeapon.damageMin + 2 + (seed & 15) % 5);
    assert.equal(shield.statBonuses, undefined);
    assert.equal(weapon.statBonuses, undefined);
    assert.equal(shield.signature, undefined);
    assert.equal(weapon.signature, undefined);
  }
});
