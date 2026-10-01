import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, SETTLEMENTS, createGame, getItem, getMarket, buyItem, sellItem, equipItem, unequipItem,
  getCompanyStats, getDailyFood, getCompanyTravelBonus, travelTo, tick, validateSave,
  getRoamingBands, startBattle, advanceBattle,
} from '../src/engine.js';

const mountIds = ['riding-horse', 'war-horse', 'armored-war-horse', 'warg-mount', 'dire-wolf-mount'];

test('mounts use their own slot, conserve ownership, and migrate old saves', () => {
  const state = createGame(17);
  assert.equal(state.party[0].equipment.mount, null);
  const old = structuredClone(state);
  for (const person of old.party) delete person.equipment.mount;
  assert.deepEqual(validateSave(old).party.map(person => person.equipment.mount), [null, null, null]);
  state.inventory.push('riding-horse', 'warg-mount');
  state.inventoryCondition.push(null, null);
  assert.equal(equipItem(state, 'captain', 'riding-horse').ok, true);
  assert.equal(equipItem(state, 'captain', 'warg-mount').ok, true);
  assert.equal(state.party[0].equipment.mount, 'warg-mount');
  assert.equal(state.inventory.filter(id => id === 'riding-horse').length, 1);
  assert.equal(getDailyFood(state), 5);
  assert.equal(getCompanyTravelBonus(state), .1);
  assert.equal(unequipItem(state, 'captain', 'mount').ok, true);
  assert.equal(state.inventory.filter(id => mountIds.includes(id)).length, 2);
  assert.deepEqual(validateSave(state), state);
  assert.equal(equipItem(state, 'captain', 'warg-mount', 'reserve').ok, false);
});

test('living mounted members add world speed and daily food, with battle skill and damage properties', () => {
  const mounted = createGame(28);
  const plain = createGame(28);
  mounted.inventory.push('dire-wolf-mount');
  mounted.inventoryCondition.push(null);
  assert.equal(equipItem(mounted, 'captain', 'dire-wolf-mount').ok, true);
  assert.equal(getCompanyStats(mounted.party[0]).meleeSkill, getCompanyStats(plain.party[0]).meleeSkill + 5);
  assert.equal(getCompanyStats(mounted.party[0]).rangedSkill, getCompanyStats(plain.party[0]).rangedSkill + 5);
  assert.equal(getDailyFood(mounted), getDailyFood(plain) + 3);
  assert.equal(getCompanyTravelBonus(mounted), .1);
  for (const state of [mounted, plain]) for (const band of Object.values(state.bands)) band.defeatedUntil = 1000;
  for (const state of [mounted, plain]) assert.equal(travelTo(state, 700, 460).ok, true);
  tick(mounted, 1);
  tick(plain, 1);
  assert.ok(mounted.position.x > plain.position.x);
  mounted.party[0].hp = 0;
  assert.equal(getCompanyTravelBonus(mounted), 0);
  assert.equal(getDailyFood(mounted), plain.party.length);
  for (const id of mountIds) {
    const item = getItem(id);
    assert.equal(item.slot, 'mount');
    assert.equal(item.damageBonus, id === 'armored-war-horse' ? .2 : .15);
    assert.equal(item.movementBonus, 1);
  }
});

test('fantasy war horses carry their catalog trade-offs into company stats', () => {
  const plain = createGame(280);
  for (const [id, hit, food, price] of [['war-horse', 5, 2, 1800], ['armored-war-horse', 7, 3, 2600]]) {
    const state = createGame(280);
    const item = getItem(id);
    assert.equal(item.price, price);
    state.inventory.push(id);
    state.inventoryCondition.push(null);
    assert.equal(equipItem(state, 'captain', id).ok, true);
    assert.equal(getCompanyStats(state.party[0]).meleeSkill, getCompanyStats(plain.party[0]).meleeSkill + hit);
    assert.equal(getDailyFood(state), getDailyFood(plain) + food);
    assert.equal(getCompanyTravelBonus(state), .1);
    assert.deepEqual(validateSave(state), state);
  }
});

test('weekly large town and castle mount offers are rare, deterministic, and tradable', () => {
  let offer = null;
  let opportunities = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const state = createGame(seed);
    for (const town of SETTLEMENTS.filter(entry => entry.major || entry.kind === 'castle')) {
      state.position = { x: town.x, y: town.y };
      const offered = getMarket(state).equipment.filter(row => mountIds.includes(row.itemId) && row.stock > 0);
      assert.ok(offered.length <= 1);
      opportunities += offered.length;
      if (!offer && offered.length) offer = { state: structuredClone(state), itemId: offered[0].itemId };
    }
  }
  assert.ok(opportunities > 0 && opportunities < 80, 'roughly two percent of eligible weekly armories offer a mount');
  const { state, itemId } = offer;
  assert.equal(getMarket(state).equipment.find(row => row.itemId === itemId).stock, 1);
  state.gold = 5000;
  assert.equal(buyItem(state, itemId).ok, true);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === itemId).stock, 0);
  assert.equal(sellItem(state, itemId).ok, true);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === itemId).stock, 1);
  assert.deepEqual(validateSave(state), state);
});

test('ordinary armory stock is halved in expectation without changing item catalog or enemy loot', () => {
  const ordinary = ITEMS.filter(item => item.slot !== 'mount');
  let copies = 0;
  for (let seed = 1; seed <= 500; seed++) {
    const state = createGame(seed);
    copies += getMarket(state).equipment.find(row => row.itemId === 'patched-coat').stock;
  }
  assert.ok(copies > 280 && copies < 500, 'common gear stock averages about half the former one-to-two copies');
  assert.ok(ordinary.some(item => item.id === 'patched-coat'));
});

test('mounted battle snapshot retains the mount and its hit bonus through save loading', () => {
  const state = createGame(4);
  state.inventory.push('riding-horse');
  state.inventoryCondition.push(null);
  assert.equal(equipItem(state, 'captain', 'riding-horse').ok, true);
  const camp = { x: 440, y: 520, id: 'quarry-camp' };
  state.position = { x: camp.x, y: camp.y };
  assert.equal(startBattle(state, camp.id).ok, true);
  const captain = state.battle.units.find(unit => unit.id === 'captain');
  assert.equal(captain.equipment.mount, 'riding-horse');
  assert.equal(captain.meleeSkill, getCompanyStats(state.party[0]).meleeSkill);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
  assert.equal(advanceBattle(state).ok, true);
});

test('mounted attacks deal more damage at the same roll', () => {
  const mounted = createGame(212);
  mounted.inventory.push('riding-horse');
  mounted.inventoryCondition.push(null);
  equipItem(mounted, 'captain', 'riding-horse');
  mounted.position = { x: 440, y: 520 };
  startBattle(mounted, 'quarry-camp');
  const plain = structuredClone(mounted);
  const prepare = (state, hasMount) => {
    const battle = state.battle;
    const actor = battle.units.find(unit => unit.id === 'captain');
    const target = battle.units.find(unit => unit.side === 'enemy');
    actor.meleeSkill = 200;
    actor.equipment.mount = hasMount ? 'riding-horse' : null;
    target.q = actor.q + 1;
    target.r = actor.r;
    target.hp = target.maxHp = 300;
    target.bodyArmor = target.headArmor = 0;
    battle.turnIndex = battle.turnOrder.indexOf(actor.id);
    battle.activeId = actor.id;
  };
  prepare(mounted, true);
  prepare(plain, false);
  assert.equal(advanceBattle(mounted).ok, true);
  assert.equal(advanceBattle(plain).ok, true);
  assert.equal(mounted.battle.lastEvent.type, 'attack');
  assert.equal(plain.battle.lastEvent.type, 'attack');
  assert.ok(mounted.battle.lastEvent.hpDamage > plain.battle.lastEvent.hpDamage);
});

test('rare mounted elites are visible while scouting and keep their mount in battle', () => {
  let encounter = null;
  for (let seed = 1; seed <= 300 && !encounter; seed++) {
    const state = createGame(seed);
    state.day = 35;
    state.shipments = {};
    state.shipmentLegacyThroughDay = 35;
    for (const person of state.party) person.level = 9;
    const band = getRoamingBands(state).find(entry => entry.difficulty === 3 && entry.enemies[0].mount);
    if (band) encounter = { state, band };
  }
  assert.ok(encounter, 'a rare mounted elite appears across seeded encounters');
  const { state, band } = encounter;
  state.position = { x: band.x, y: band.y };
  assert.equal(startBattle(state, band.id).ok, true);
  const elite = state.battle.units.find(unit => unit.id === 'enemy-1');
  assert.equal(elite.equipment.mount, band.enemies[0].mount);
  assert.ok(mountIds.includes(elite.equipment.mount));
  assert.deepEqual(validateSave(state), state);
});

test('a mount can carry its rider farther in a combat turn', () => {
  let extraDistance = false;
  for (let seed = 1; seed <= 30 && !extraDistance; seed++) {
    const mounted = createGame(seed);
    mounted.inventory.push('riding-horse');
    mounted.inventoryCondition.push(null);
    equipItem(mounted, 'captain', 'riding-horse');
    mounted.position = { x: 440, y: 520 };
    startBattle(mounted, 'quarry-camp');
    const plain = structuredClone(mounted);
    for (const state of [mounted, plain]) {
      const battle = state.battle;
      battle.turnIndex = battle.turnOrder.indexOf('captain');
      battle.activeId = 'captain';
    }
    plain.battle.units.find(unit => unit.id === 'captain').equipment.mount = null;
    advanceBattle(mounted);
    advanceBattle(plain);
    const rider = mounted.battle.units.find(unit => unit.id === 'captain');
    const walker = plain.battle.units.find(unit => unit.id === 'captain');
    extraDistance = rider.q > walker.q;
  }
  assert.equal(extraDistance, true);
});
