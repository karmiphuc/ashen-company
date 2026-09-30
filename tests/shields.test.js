import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, getCampSites, startBattle, advanceBattle, retreatBattle, finishBattle,
  getCompanyStats, shieldMaximum, equipItem, unequipItem, swapWeaponSet,
  getTownServiceQuote, useTownService, camp, validateSave,
  createFamedItemId, sellItem, buyItem,
} from '../src/engine.js';

function battleWith(state) {
  const site = getCampSites(state)[0];
  state.position = { x: site.x, y: site.y };
  assert.equal(startBattle(state, site.id).ok, true);
  return state.battle;
}

function addItem(state, id, condition) {
  state.inventory.push(id);
  state.inventoryCondition.push(condition);
}

test('shield maximum, equipped condition, pack transfers, and set swaps preserve zero', () => {
  const state = createGame(801);
  const captain = state.party[0];
  assert.equal(shieldMaximum('buckler'), 24);
  assert.equal(shieldMaximum('kite-shield'), 80);
  assert.equal(captain.armorDurability.shield, 24);
  addItem(state, 'kite-shield', 0);
  assert.equal(equipItem(state, 'captain', 'kite-shield', 'reserve').ok, true);
  assert.equal(captain.armorDurability.reserveShield, 0);
  assert.equal(swapWeaponSet(state, 'captain').ok, true);
  assert.equal(captain.armorDurability.shield, 0);
  assert.equal(getCompanyStats(captain).meleeDefense, getCompanyStats({ ...captain, equipment: { ...captain.equipment, shield: null } }).meleeDefense);
  assert.equal(unequipItem(state, 'captain', 'shield').ok, true);
  const stored = state.inventory.lastIndexOf('kite-shield');
  assert.equal(state.inventoryCondition[stored], 0);
  assert.deepEqual(validateSave(state), state);
});

test('melee misses and hits wear shields; a break removes defense without losing the item', () => {
  const state = createGame(802);
  const battle = battleWith(state);
  const captain = battle.units.find(unit => unit.id === 'captain');
  const attacker = battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(captain, { q: 2, r: 1, shieldDurability: 2 });
  Object.assign(attacker, { q: 3, r: 1 });
  for (const ally of battle.units.filter(unit => unit.side === 'company' && unit !== captain)) Object.assign(ally, { hp: 0, alive: false });
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy' && unit !== attacker)) Object.assign(enemy, { hp: 0, alive: false });
  battle.turnIndex = battle.turnOrder.indexOf(attacker.id);
  battle.activeId = attacker.id;
  battle.rng = 1800;
  const defense = captain.meleeDefense;
  advanceBattle(state);
  assert.equal(battle.lastEvent.type, 'miss');
  assert.equal(captain.shieldDurability, 0);
  assert.equal(captain.meleeDefense, defense - 8);
  assert.equal(captain.equipment.shield, 'buckler');
  assert.ok(battle.log.some(entry => entry.includes('Buckler breaks')));
  assert.deepEqual(validateSave(state), state);

  const hit = createGame(803);
  const hitBattle = battleWith(hit);
  const defender = hitBattle.units.find(unit => unit.id === 'captain');
  const striker = hitBattle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(defender, { q: 2, r: 1 });
  Object.assign(striker, { q: 3, r: 1, meleeSkill: 200 });
  for (const ally of hitBattle.units.filter(unit => unit.side === 'company' && unit !== defender)) Object.assign(ally, { hp: 0, alive: false });
  for (const enemy of hitBattle.units.filter(unit => unit.side === 'enemy' && unit !== striker)) Object.assign(enemy, { hp: 0, alive: false });
  hitBattle.turnIndex = hitBattle.turnOrder.indexOf(striker.id);
  hitBattle.activeId = striker.id;
  hitBattle.rng = 0;
  advanceBattle(hit);
  assert.equal(hitBattle.lastEvent.type, 'attack');
  assert.equal(defender.shieldDurability, 23);
});

test('battle set swaps carry durability back to original sets, including legacy swapped saves', () => {
  const tracked = createGame(807);
  addItem(tracked, 'kite-shield', 7);
  equipItem(tracked, 'captain', 'kite-shield', 'reserve');
  tracked.party[0].armorDurability.shield = 3;
  const trackedBattle = battleWith(tracked);
  const trackedUnit = trackedBattle.units.find(entry => entry.id === 'captain');
  [trackedUnit.equipment.shield, trackedUnit.reserveEquipment.shield] = [trackedUnit.reserveEquipment.shield, trackedUnit.equipment.shield];
  [trackedUnit.equipment.weapon, trackedUnit.reserveEquipment.weapon] = [trackedUnit.reserveEquipment.weapon, trackedUnit.equipment.weapon];
  [trackedUnit.shieldDurability, trackedUnit.reserveShieldDurability] = [trackedUnit.reserveShieldDurability, trackedUnit.shieldDurability];
  [trackedUnit.maxShieldDurability, trackedUnit.maxReserveShieldDurability] = [trackedUnit.maxReserveShieldDurability, trackedUnit.maxShieldDurability];
  trackedUnit.battleSetSwapped = true;
  assert.equal(retreatBattle(tracked).ok, true);
  assert.equal(finishBattle(tracked).ok, true);
  assert.equal(tracked.party[0].armorDurability.shield, 3);
  assert.equal(tracked.party[0].armorDurability.reserveShield, 7);
  assert.deepEqual(validateSave(tracked), tracked);

  const state = createGame(804);
  const captain = state.party[0];
  addItem(state, 'kite-shield', 7);
  equipItem(state, 'captain', 'kite-shield', 'reserve');
  captain.armorDurability.shield = 3;
  const battle = battleWith(state);
  const unit = battle.units.find(entry => entry.id === 'captain');
  // A saved pre-durability battle could already have switched sets.
  [unit.equipment.shield, unit.reserveEquipment.shield] = [unit.reserveEquipment.shield, unit.equipment.shield];
  [unit.equipment.weapon, unit.reserveEquipment.weapon] = [unit.reserveEquipment.weapon, unit.equipment.weapon];
  delete unit.battleSetSwapped;
  delete unit.shieldDurability;
  delete unit.reserveShieldDurability;
  delete unit.maxShieldDurability;
  delete unit.maxReserveShieldDurability;
  const legacy = validateSave(state);
  const migrated = legacy.battle.units.find(entry => entry.id === 'captain');
  assert.equal(migrated.battleSetSwapped, true);
  assert.equal(migrated.shieldDurability, 80);
  assert.equal(migrated.reserveShieldDurability, 24);
  assert.equal(retreatBattle(legacy).ok, true);
  assert.equal(finishBattle(legacy).ok, true);
  assert.equal(legacy.party[0].armorDurability.shield, 24);
  assert.equal(legacy.party[0].armorDurability.reserveShield, 80);
  assert.deepEqual(validateSave(legacy), legacy);
});

test('a fallen fighter returns both shield conditions as repairable loot', () => {
  const state = createGame(808);
  addItem(state, 'kite-shield', 7);
  equipItem(state, 'captain', 'kite-shield', 'reserve');
  const battle = battleWith(state);
  const captain = battle.units.find(unit => unit.id === 'captain');
  Object.assign(captain, { hp: 0, alive: false, shieldDurability: 2, reserveShieldDurability: 7 });
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy')) Object.assign(enemy, { hp: 0, alive: false });
  battle.turnIndex = battle.turnOrder.indexOf('guard');
  battle.activeId = 'guard';
  advanceBattle(state);
  assert.equal(battle.status, 'victory');
  assert.equal(finishBattle(state).ok, true);
  assert.equal(state.inventoryCondition[state.inventory.lastIndexOf('buckler')], 2);
  assert.equal(state.inventoryCondition[state.inventory.lastIndexOf('kite-shield')], 7);
  assert.deepEqual(validateSave(state), state);
});

test('famed shield buyback preserves zero and migrates legacy null condition', () => {
  const state = createGame(809);
  const id = createFamedItemId('kite-shield', 77);
  addItem(state, id, 0);
  assert.equal(sellItem(state, id).ok, true);
  const stock = Object.values(state.marketStock).find(market => market.buyback?.some(entry => entry.itemId === id));
  assert.equal(stock.buyback.find(entry => entry.itemId === id).condition, 0);
  assert.equal(validateSave(state).marketStock[Object.keys(state.marketStock).find(key => state.marketStock[key] === stock)].buyback.find(entry => entry.itemId === id).condition, 0);
  assert.equal(buyItem(state, id).ok, true);
  assert.equal(state.inventoryCondition[state.inventory.lastIndexOf(id)], 0);
  const legacy = structuredClone(state);
  legacy.inventoryCondition[legacy.inventory.lastIndexOf(id)] = null;
  assert.equal(validateSave(legacy).inventoryCondition[legacy.inventory.lastIndexOf(id)], shieldMaximum(id));
});

test('rest and smithy repair active and reserve shields', () => {
  const state = createGame(805);
  const captain = state.party[0];
  addItem(state, 'kite-shield', 0);
  equipItem(state, 'captain', 'kite-shield', 'reserve');
  captain.armorDurability.shield = 0;
  const quote = getTownServiceQuote(state, 'smithy', 'captain');
  assert.equal(quote.ok, true);
  assert.ok(quote.entries[0].repairs.some(repair => repair.set === 'active' && repair.slot === 'shield' && repair.missing === 24));
  assert.ok(quote.entries[0].repairs.some(repair => repair.set === 'reserve' && repair.slot === 'shield' && repair.missing === 80));
  assert.equal(useTownService(state, 'smithy', 'captain').ok, true);
  assert.equal(captain.armorDurability.shield, 24);
  assert.equal(captain.armorDurability.reserveShield, 80);
  captain.armorDurability.shield = 0;
  captain.armorDurability.reserveShield = 0;
  state.supplies.tools = 2;
  assert.equal(camp(state).ok, true);
  assert.equal(captain.armorDurability.shield, 24);
  assert.equal(captain.armorDurability.reserveShield, 25);
  assert.deepEqual(validateSave(state), state);
});

test('legacy null shield condition restores full, while zero survives and over-maximum fails', () => {
  const state = createGame(806);
  const buckler = state.inventory.indexOf('buckler');
  state.inventoryCondition[buckler] = null;
  delete state.party[0].armorDurability.shield;
  const loaded = validateSave(state);
  assert.equal(loaded.inventoryCondition[buckler], 24);
  assert.equal(loaded.party[0].armorDurability.shield, 24);
  const broken = structuredClone(loaded);
  broken.inventoryCondition[buckler] = 0;
  broken.party[0].armorDurability.shield = 0;
  assert.equal(validateSave(broken).inventoryCondition[buckler], 0);
  const bad = structuredClone(broken);
  bad.inventoryCondition[buckler] = 25;
  assert.throws(() => validateSave(bad), /inventory condition/);
});
