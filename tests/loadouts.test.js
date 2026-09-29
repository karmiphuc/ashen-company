import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, createGame, createFamedItemId, getItem, getCampSites, getCompanyStats, getMarket, buyItem, buyFood,
  equipItem, unequipItem, swapWeaponSet, startBattle, advanceBattle, resolveBattle,
  retreatBattle, finishBattle, setBattleTactic, validateSave,
} from '../src/engine.js';

function addItem(state, id) {
  state.inventory.push(id);
  state.inventoryCondition.push(getItem(id)?.armor && ['armor', 'helmet'].includes(getItem(id).slot) ? getItem(id).armor : null);
}

function carried(state) {
  return [
    ...state.inventory,
    ...state.party.flatMap(person => [
      ...Object.values(person.equipment),
      ...Object.values(person.reserveEquipment),
      ...person.accessories,
    ].filter(Boolean)),
  ].sort();
}

function battleWith(state) {
  const camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y };
  assert.equal(startBattle(state, camp.id).ok, true);
  const battle = state.battle;
  const actor = battle.units.find(unit => unit.id === 'captain');
  const at = (id, q, r) => Object.assign(battle.units.find(unit => unit.id === id), { q, r });
  const activate = () => {
    battle.turnIndex = battle.turnOrder.indexOf('captain');
    battle.activeId = 'captain';
  };
  return { battle, actor, at, activate };
}

test('the additional catalog has valid slot types and only gear can be famed', () => {
  assert.ok(ITEMS.length >= 96);
  for (const item of ITEMS) {
    assert.equal(getItem(item.id), item);
    assert.ok(['armor', 'helmet', 'weapon', 'shield', 'accessory', 'mount'].includes(item.slot));
    if (item.slot === 'accessory' || item.slot === 'mount') assert.throws(() => createFamedItemId(item.id, 1));
  }
  const famed = getItem(createFamedItemId('javelins', 7));
  assert.equal(famed.throwing, true);
  assert.equal(famed.ranged, true);
});

test('reserve and accessory equipment conserve items and keep two-handed sets legal', () => {
  const state = createGame(31);
  for (const id of ['greatsword', 'javelins', 'bandages', 'qatal-dagger']) addItem(state, id);
  const before = carried(state);
  assert.equal(equipItem(state, 'captain', 'greatsword').ok, true);
  assert.equal(equipItem(state, 'captain', 'javelins', 'reserve').ok, true);
  assert.equal(equipItem(state, 'captain', 'buckler', 'reserve').ok, true);
  assert.equal(equipItem(state, 'captain', 'bandages', 'accessory-1').ok, true);
  assert.equal(equipItem(state, 'captain', 'qatal-dagger', 'accessory-2').ok, true);
  const person = state.party[0];
  assert.deepEqual(person.reserveEquipment, { weapon: 'javelins', shield: 'buckler' });
  assert.deepEqual(person.accessories, ['bandages', 'qatal-dagger']);
  assert.equal(person.equipment.shield, null);
  assert.deepEqual(carried(state), before);
  assert.deepEqual(validateSave(state), state);
  const beforeDefense = getCompanyStats(person).meleeDefense;
  assert.equal(swapWeaponSet(state, 'captain').ok, true);
  assert.equal(person.equipment.weapon, 'javelins');
  assert.equal(person.equipment.shield, 'buckler');
  assert.ok(getCompanyStats(person).meleeDefense > beforeDefense);
  assert.deepEqual(carried(state), before);
  assert.equal(equipItem(state, 'captain', 'arming-sword', 'accessory-1').ok, false);
  assert.equal(equipItem(state, 'captain', 'bandages', 'reserve').ok, false);
  assert.equal(unequipItem(state, 'captain', 'accessory', 'accessory-1').ok, true);
  assert.equal(person.accessories[0], null);
  assert.deepEqual(carried(state), before);
});

test('old saved market stock recognizes new weapons and accessories', () => {
  const state = createGame(41);
  buyFood(state, 1);
  for (const item of ITEMS.slice(25)) delete state.marketStock.oakwatch.equipment[item.id];
  const loaded = validateSave(state);
  assert.ok(getMarket(loaded).equipment.some(entry => entry.itemId === 'javelins'));
  assert.ok(getMarket(loaded).equipment.some(entry => entry.itemId === 'bandages'));
  loaded.marketStock.oakwatch.equipment.javelins = 1;
  loaded.marketStock.oakwatch.equipment.bandages = 1;
  assert.equal(buyItem(loaded, 'javelins').ok, true);
  assert.equal(buyItem(loaded, 'bandages').ok, true);
  assert.equal(equipItem(loaded, 'captain', 'bandages', 'accessory-1').ok, true);
  assert.deepEqual(validateSave(loaded), loaded);
});

test('battle auto-readies throwing shield set, then returns to melee when ammunition runs out', () => {
  const state = createGame(33);
  addItem(state, 'greatsword');
  addItem(state, 'javelins');
  equipItem(state, 'captain', 'greatsword');
  equipItem(state, 'captain', 'javelins', 'reserve');
  equipItem(state, 'captain', 'buckler', 'reserve');
  const original = structuredClone(state.party[0]);
  const { battle, actor, activate } = battleWith(state);
  const defense = actor.meleeDefense;
  activate();
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(battle.lastEvent.type, 'swap');
  assert.equal(actor.equipment.weapon, 'javelins');
  assert.equal(actor.equipment.shield, 'buckler');
  assert.equal(actor.meleeDefense, defense + getItem('buckler').defense);
  assert.deepEqual(validateSave(state), state);
  state.supplies.ammo = 0;
  activate();
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(actor.equipment.weapon, 'greatsword');
  assert.equal(actor.equipment.shield, null);
  assert.equal(actor.meleeDefense, defense);
  assert.deepEqual(validateSave(state), state);
  retreatBattle(state);
  finishBattle(state);
  assert.deepEqual(state.party[0].equipment, original.equipment);
  assert.deepEqual(state.party[0].reserveEquipment, original.reserveEquipment);
});

test('throwing weapons spend ammunition and retain shield defense', () => {
  const state = createGame(34);
  addItem(state, 'javelins');
  equipItem(state, 'captain', 'javelins');
  const { battle, actor, at, activate } = battleWith(state);
  at('captain', 2, 2);
  at('guard', 1, 1);
  at('enemy-1', 4, 2);
  activate();
  const ammo = state.supplies.ammo;
  advanceBattle(state);
  assert.equal(state.supplies.ammo, ammo - 1);
  assert.ok(['attack', 'miss'].includes(battle.lastEvent.type));
  assert.equal(battle.lastEvent.projectile, 'javelin');
  assert.equal(actor.equipment.shield, 'buckler');
  assert.deepEqual(validateSave(state), state);
});

test('heavy crossbows and thrown axes emit their correct projectile kinds', () => {
  for (const [weaponId, projectile] of [['heavy-crossbow', 'bolt'], ['heavy-throwing-axes', 'axe']]) {
    const state = createGame(40);
    addItem(state, weaponId);
    equipItem(state, 'captain', weaponId);
    const { battle, at, activate } = battleWith(state);
    at('captain', 2, 2);
    at('guard', 1, 1);
    at('enemy-1', 4, 2);
    activate();
    advanceBattle(state);
    assert.equal(battle.lastEvent.weaponId, weaponId);
    assert.equal(battle.lastEvent.projectile, projectile);
    assert.deepEqual(validateSave(state), state);
  }
});

test('a shielded thrower draws the two-handed melee set on contact without swapping back at two hexes', () => {
  const state = createGame(38);
  addItem(state, 'greatsword');
  addItem(state, 'javelins');
  equipItem(state, 'captain', 'greatsword');
  equipItem(state, 'captain', 'javelins', 'reserve');
  equipItem(state, 'captain', 'buckler', 'reserve');
  const { battle, actor, at, activate } = battleWith(state);
  activate();
  advanceBattle(state);
  assert.equal(actor.equipment.weapon, 'javelins');
  at('captain', 2, 2);
  at('guard', 1, 1);
  at('enemy-1', 3, 2);
  activate();
  advanceBattle(state);
  assert.equal(battle.lastEvent.type, 'swap');
  assert.equal(actor.equipment.weapon, 'greatsword');
  assert.equal(actor.equipment.shield, null);
  assert.equal(actor.meleePhase, true);
  at('enemy-1', 4, 2);
  activate();
  advanceBattle(state);
  assert.notEqual(battle.lastEvent.type, 'swap');
  assert.equal(actor.equipment.weapon, 'greatsword');
  assert.deepEqual(validateSave(state), state);
});

test('trapped archers draw a pocket dagger, then return to bow without gear loss', () => {
  const state = createGame(35);
  addItem(state, 'hunting-bow');
  addItem(state, 'qatal-dagger');
  equipItem(state, 'captain', 'hunting-bow');
  equipItem(state, 'captain', 'qatal-dagger', 'accessory-1');
  const before = carried(state);
  const { battle, actor, at, activate } = battleWith(state);
  at('captain', 0, 0);
  at('guard', 0, 1);
  at('enemy-1', 1, 0);
  activate();
  const ammo = state.supplies.ammo;
  advanceBattle(state);
  assert.equal(battle.lastEvent.type, 'swap');
  assert.equal(actor.equipment.weapon, 'qatal-dagger');
  assert.equal(actor.pocketStowedWeapon, 'hunting-bow');
  assert.equal(actor.accessories[0], null);
  assert.equal(state.supplies.ammo, ammo);
  assert.deepEqual(validateSave(state), state);
  at('enemy-1', 6, 0);
  battle.round += 2;
  activate();
  advanceBattle(state);
  assert.equal(actor.equipment.weapon, 'hunting-bow');
  assert.equal(actor.accessories[0], 'qatal-dagger');
  assert.deepEqual(validateSave(state), state);
  retreatBattle(state);
  finishBattle(state);
  assert.deepEqual(carried(state), before);
});

test('empty-ammo archers draw a melee reserve under every tactic and do not swap back after reload', () => {
  for (const tactic of ['offense', 'defense', 'focus', 'advance-formation', 'shield-wall']) {
    const state = createGame(`empty-ammo-${tactic}`);
    addItem(state, 'light-crossbow');
    equipItem(state, 'captain', 'light-crossbow');
    equipItem(state, 'captain', 'arming-sword', 'reserve');
    state.supplies.ammo = 0;
    setBattleTactic(state, tactic);
    let { battle, actor, activate } = battleWith(state);
    actor.reload = 1;
    activate();
    advanceBattle(state);
    assert.equal(battle.lastEvent.type, 'swap', tactic);
    assert.equal(actor.equipment.weapon, 'arming-sword', tactic);
    assert.equal(actor.reserveEquipment.weapon, 'light-crossbow', tactic);
    assert.equal(actor.reserveReload, 1, tactic);

    const restored = validateSave(JSON.parse(JSON.stringify(state)));
    battle = restored.battle;
    actor = battle.units.find(unit => unit.id === 'captain');
    battle.turnIndex = battle.turnOrder.indexOf('captain');
    battle.activeId = 'captain';
    advanceBattle(restored);
    assert.equal(actor.equipment.weapon, 'arming-sword', `${tactic} stays on melee without ammunition`);
    assert.notEqual(battle.lastEvent.type, 'swap', `${tactic} does not swap back to an unusable ranged weapon`);
  }
});

test('an empty-ammo archer draws a pocket dagger, while a supplied archer keeps shooting', () => {
  const empty = createGame('empty-pocket');
  addItem(empty, 'hunting-bow');
  addItem(empty, 'qatal-dagger');
  equipItem(empty, 'captain', 'hunting-bow');
  equipItem(empty, 'captain', 'qatal-dagger', 'accessory-1');
  empty.supplies.ammo = 0;
  const emptyBattle = battleWith(empty);
  emptyBattle.activate();
  advanceBattle(empty);
  assert.equal(emptyBattle.battle.lastEvent.type, 'swap');
  assert.equal(emptyBattle.actor.equipment.weapon, 'qatal-dagger');
  assert.equal(emptyBattle.actor.pocketStowedWeapon, 'hunting-bow');

  const supplied = createGame('supplied-archer');
  addItem(supplied, 'hunting-bow');
  equipItem(supplied, 'captain', 'hunting-bow');
  equipItem(supplied, 'captain', 'arming-sword', 'reserve');
  const suppliedBattle = battleWith(supplied);
  suppliedBattle.at('captain', 2, 2);
  suppliedBattle.at('enemy-1', 4, 2);
  suppliedBattle.activate();
  const ammo = supplied.supplies.ammo;
  advanceBattle(supplied);
  assert.equal(suppliedBattle.actor.equipment.weapon, 'hunting-bow');
  assert.ok(['attack', 'miss'].includes(suppliedBattle.battle.lastEvent.type));
  assert.equal(supplied.supplies.ammo, ammo - 1);
});

test('an empty-ammo archer without spare gear closes and fights unarmed', () => {
  const state = createGame('empty-unarmed');
  addItem(state, 'hunting-bow');
  equipItem(state, 'captain', 'hunting-bow');
  state.supplies.ammo = 0;
  const { battle, actor, at, activate } = battleWith(state);
  at('captain', 2, 2);
  at('enemy-1', 3, 2);
  activate();
  advanceBattle(state);
  assert.equal(actor.equipment.weapon, 'hunting-bow');
  assert.ok(['attack', 'miss'].includes(battle.lastEvent.type));
  assert.equal(battle.lastEvent.ranged, false);
});

test('a shielded thrower keeps the shield while drawing and stowing a pocket blade', () => {
  const state = createGame(42);
  addItem(state, 'javelins');
  addItem(state, 'qatal-dagger');
  equipItem(state, 'captain', 'javelins');
  equipItem(state, 'captain', 'qatal-dagger', 'accessory-1');
  const { battle, actor, at, activate } = battleWith(state);
  const defense = actor.meleeDefense;
  at('captain', 0, 0);
  at('guard', 0, 1);
  at('enemy-1', 1, 0);
  activate();
  advanceBattle(state);
  assert.equal(actor.equipment.weapon, 'qatal-dagger');
  assert.equal(actor.equipment.shield, 'buckler');
  assert.equal(actor.meleeDefense, defense);
  at('enemy-1', 6, 0);
  battle.round += 2;
  activate();
  advanceBattle(state);
  assert.equal(actor.equipment.weapon, 'javelins');
  assert.equal(actor.equipment.shield, 'buckler');
  assert.equal(actor.accessories[0], 'qatal-dagger');
  assert.equal(actor.meleeDefense, defense);
  assert.deepEqual(validateSave(state), state);
});

test('field supplies consume one slot and one turn each, then stay consumed', () => {
  const state = createGame(36);
  addItem(state, 'bandages');
  addItem(state, 'stimulant');
  equipItem(state, 'captain', 'bandages', 'accessory-1');
  equipItem(state, 'captain', 'stimulant', 'accessory-2');
  const { battle, actor, activate } = battleWith(state);
  actor.hp = 45;
  activate();
  advanceBattle(state);
  assert.equal(battle.lastEvent.type, 'use');
  assert.equal(battle.lastEvent.itemId, 'bandages');
  assert.equal(actor.hp, 69);
  assert.equal(actor.accessories[0], null);
  assert.deepEqual(validateSave(state), state);
  actor.fatigue = Math.ceil(actor.maxFatigue * .85);
  activate();
  advanceBattle(state);
  assert.equal(battle.lastEvent.itemId, 'stimulant');
  assert.equal(actor.accessories[1], null);
  assert.deepEqual(validateSave(state), state);
  retreatBattle(state);
  finishBattle(state);
  assert.deepEqual(state.party[0].accessories, [null, null]);
});

test('victory recovers a casualty’s original set, reserve set, and drawn pocket weapon once', () => {
  const state = createGame(39);
  for (const id of ['hunting-bow', 'qatal-dagger', 'javelins']) addItem(state, id);
  equipItem(state, 'captain', 'hunting-bow');
  equipItem(state, 'captain', 'javelins', 'reserve');
  equipItem(state, 'captain', 'qatal-dagger', 'accessory-1');
  const { battle, actor, at, activate } = battleWith(state);
  at('captain', 0, 0);
  at('guard', 0, 1);
  at('enemy-1', 1, 0);
  activate();
  advanceBattle(state);
  assert.equal(actor.pocketDrawnFrom, 0);
  actor.hp = 0;
  actor.alive = false;
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy')) {
    enemy.hp = 0;
    enemy.alive = false;
  }
  battle.turnIndex = battle.turnOrder.indexOf('guard');
  battle.activeId = 'guard';
  advanceBattle(state);
  assert.equal(battle.status, 'victory');
  assert.deepEqual(validateSave(state), state);
  const expectedLoot = Object.fromEntries(['hunting-bow', 'qatal-dagger', 'javelins'].map(id => [id, 1 + battle.loot.items.filter(entry => entry === id).length]));
  finishBattle(state);
  assert.equal(state.party.some(person => person.id === 'captain'), false);
  for (const [id, count] of Object.entries(expectedLoot)) assert.equal(state.inventory.filter(entry => entry === id).length, count, id);
});

test('legacy saves migrate empty carried slots and malformed new gear is rejected', () => {
  const state = createGame(37);
  const { battle } = battleWith(state);
  for (const person of state.party) {
    delete person.reserveEquipment;
    delete person.accessories;
  }
  for (const unit of battle.units) {
    delete unit.reserveEquipment;
    delete unit.accessories;
    delete unit.pocketDrawnFrom;
    delete unit.pocketStowedWeapon;
    delete unit.pocketStowedReload;
    delete unit.pocketDrawnRound;
    delete unit.reserveReload;
  }
  const loaded = validateSave(state);
  assert.deepEqual(loaded.party[0].reserveEquipment, { weapon: null, shield: null });
  assert.deepEqual(loaded.party[0].accessories, [null, null]);
  assert.deepEqual(loaded.battle.units[0].accessories, [null, null]);
  assert.deepEqual(validateSave(loaded), loaded);
  const badReserve = structuredClone(loaded);
  badReserve.party[0].reserveEquipment = { weapon: 'greatsword', shield: 'buckler' };
  assert.throws(() => validateSave(badReserve), /reserve equipment/);
  const badPocket = structuredClone(loaded);
  badPocket.battle.units[0].accessories[0] = 'arming-sword';
  assert.throws(() => validateSave(badPocket), /battle accessories/);
});

test('a pre-catalog famed battle snapshot keeps its earned reward through victory', () => {
  const state = createGame(12);
  const { battle } = battleWith(state);
  const oldDrop = 'famed:arming-sword:2907154113';
  battle.famedDrop = oldDrop;
  assert.deepEqual(validateSave(state), state);
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy')) {
    enemy.hp = 0;
    enemy.alive = false;
  }
  battle.turnIndex = battle.turnOrder.indexOf('guard');
  battle.activeId = 'guard';
  advanceBattle(state);
  assert.equal(battle.status, 'victory');
  assert.equal(battle.loot.items[0], oldDrop);
  assert.deepEqual(validateSave(state), state);
  finishBattle(state);
  assert.ok(state.inventory.includes(oldDrop));
});

test('starter fights with equipped alternate sets terminate deterministically', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const state = createGame(seed);
    addItem(state, 'greatsword');
    addItem(state, 'javelins');
    equipItem(state, 'captain', 'greatsword');
    equipItem(state, 'captain', 'javelins', 'reserve');
    battleWith(state);
    assert.equal(resolveBattle(state).ok, true);
    assert.notEqual(state.battle.status, 'active');
    assert.deepEqual(validateSave(state), state);
  }
});
