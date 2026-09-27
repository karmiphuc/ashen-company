import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getCampSites, startBattle, travelTo, tick, advanceBattle, validateSave } from '../src/engine.js';
import {
  createBattleField, legacyBattleField, tileAt, hexDistance, hexNeighbors,
  movementCost, heightHitModifier, rangedCoverModifier,
} from '../src/battle-terrain.js';

function approach(state) {
  const site = getCampSites(state)[0];
  assert.equal(travelTo(state, site.x, site.y).ok, true);
  for (let step = 0; step < 12 && state.destination; step++) tick(state, 12);
  assert.equal(startBattle(state, site.id).ok, true);
}

function flatField() {
  const field = createBattleField(1, 'test', 'plains');
  for (const tile of field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  return field;
}

test('procedural fields are deterministic, complete and connected', () => {
  for (const biome of ['plains', 'forest', 'mountain', 'marsh']) {
    const field = createBattleField(7391, 'quarry-camp:1', biome);
    assert.deepEqual(field, createBattleField(7391, 'quarry-camp:1', biome));
    assert.equal(field.columns, 14);
    assert.equal(field.rows, 8);
    assert.equal(field.tiles.length, 112);
    assert.equal(new Set(field.tiles.map(tile => `${tile.q},${tile.r}`)).size, 112);
    const seen = new Set(['0,0']);
    const queue = [{ q: 0, r: 0 }];
    for (const point of queue) for (const next of hexNeighbors(field, point)) {
      const key = `${next.q},${next.r}`;
      if (!seen.has(key)) { seen.add(key); queue.push(next); }
    }
    assert.equal(seen.size, 112);
    assert.ok(field.tiles.every(tile => tile.height >= 0 && tile.height <= 2));
  }
  assert.notDeepEqual(createBattleField(1, 'quarry', 'forest'), createBattleField(2, 'quarry', 'forest'));
  for (let seed = 1; seed <= 20; seed++) {
    const forest = createBattleField(seed, 'grove', 'forest');
    assert.ok(forest.tiles.filter(tile => tile.terrain === 'trees').length >= 5);
    const high = forest.tiles.filter(tile => tile.height === 2);
    assert.ok(high.length > 0);
    assert.ok(high.some(tile => hexNeighbors(forest, tile).some(neighbor => tileAt(forest, neighbor.q, neighbor.r).height >= 1)));
  }
});

test('trees, mud, elevation and intervening cover affect travel and shots', () => {
  const field = flatField();
  const from = { q: 2, r: 2 };
  const next = tileAt(field, 3, 2);
  const target = tileAt(field, 6, 2);
  assert.equal(hexDistance(from, target), 4);
  assert.equal(movementCost(field, from, next), 1);
  next.terrain = 'trees';
  assert.equal(movementCost(field, from, next), 2);
  next.terrain = 'mud';
  assert.equal(movementCost(field, from, next), 2);
  next.terrain = 'open';
  next.height = 1;
  assert.equal(movementCost(field, from, next), 2);
  next.height = 0;
  next.terrain = 'trees';
  assert.equal(rangedCoverModifier(field, from, target), -8);
  next.terrain = 'open';
  target.terrain = 'trees';
  assert.equal(rangedCoverModifier(field, from, target), -20);
  target.terrain = 'brush';
  assert.equal(rangedCoverModifier(field, from, target), -10);
  tileAt(field, 2, 2).height = 2;
  assert.equal(heightHitModifier(field, from, target), 20);
  target.height = 2;
  tileAt(field, 2, 2).height = 0;
  assert.equal(heightHitModifier(field, from, target), -20);
});

test('battle movement spends terrain cost and deployed units never overlap', () => {
  const base = createGame(5);
  approach(base);
  assert.equal(base.battle.field.columns, 14);
  assert.equal(base.battle.field.rows, 8);
  assert.equal(new Set(base.battle.units.map(unit => `${unit.q},${unit.r}`)).size, base.battle.units.length);
  const open = structuredClone(base);
  const slow = structuredClone(base);
  for (const tile of open.battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  for (const tile of slow.battle.field.tiles) { tile.terrain = 'trees'; tile.height = 0; }
  for (const state of [open, slow]) {
    state.battle.turnIndex = state.battle.turnOrder.indexOf('captain');
    state.battle.activeId = 'captain';
  }
  const start = open.battle.units.find(unit => unit.id === 'captain');
  const origin = { q: start.q, r: start.r };
  assert.equal(advanceBattle(open).ok, true);
  assert.equal(advanceBattle(slow).ok, true);
  const openCaptain = open.battle.units.find(unit => unit.id === 'captain');
  const slowCaptain = slow.battle.units.find(unit => unit.id === 'captain');
  assert.equal(hexDistance(origin, openCaptain), 2);
  assert.equal(hexDistance(origin, slowCaptain), 1);
});

test('elevation changes the outcome of the same seeded melee swing', () => {
  const base = createGame(19);
  approach(base);
  const battle = base.battle;
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  const byId = id => battle.units.find(unit => unit.id === id);
  Object.assign(byId('captain'), { q: 2, r: 2, meleeSkill: 40, fatigue: 0 });
  Object.assign(byId('guard'), { q: 1, r: 1 });
  Object.assign(byId('scout'), { q: 1, r: 2 });
  Object.assign(byId('enemy-1'), { q: 3, r: 2 });
  battle.turnIndex = battle.turnOrder.indexOf('captain');
  battle.activeId = 'captain';
  battle.rng = 19000;
  const high = structuredClone(base);
  const low = structuredClone(base);
  tileAt(high.battle.field, 2, 2).height = 2;
  tileAt(low.battle.field, 3, 2).height = 2;
  assert.equal(advanceBattle(high).ok, true);
  assert.equal(advanceBattle(low).ok, true);
  assert.equal(high.battle.lastEvent.targetId, 'enemy-1');
  assert.equal(low.battle.lastEvent.targetId, 'enemy-1');
  assert.equal(high.battle.lastEvent.type, 'attack');
  assert.equal(low.battle.lastEvent.type, 'miss');
});

test('tree cover changes the outcome of the same seeded ranged shot', () => {
  const base = createGame(23);
  approach(base);
  const battle = base.battle;
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  const byId = id => battle.units.find(unit => unit.id === id);
  Object.assign(byId('captain'), { q: 2, r: 2, rangedSkill: 55, fatigue: 0, equipment: { ...byId('captain').equipment, weapon: 'hunting-bow', shield: null } });
  Object.assign(byId('guard'), { q: 1, r: 1 });
  Object.assign(byId('scout'), { q: 1, r: 2 });
  Object.assign(byId('enemy-1'), { q: 5, r: 2 });
  battle.turnIndex = battle.turnOrder.indexOf('captain');
  battle.activeId = 'captain';
  battle.rng = 19000;
  const open = structuredClone(base);
  const covered = structuredClone(base);
  tileAt(covered.battle.field, 5, 2).terrain = 'trees';
  advanceBattle(open);
  advanceBattle(covered);
  assert.equal(open.battle.lastEvent.targetId, 'enemy-1');
  assert.equal(covered.battle.lastEvent.targetId, 'enemy-1');
  assert.equal(open.battle.lastEvent.type, 'attack');
  assert.equal(covered.battle.lastEvent.type, 'miss');
});

test('archers choose an exposed target over an equally vulnerable covered one', () => {
  const state = createGame(31);
  approach(state);
  const battle = state.battle;
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  const byId = id => battle.units.find(unit => unit.id === id);
  Object.assign(byId('captain'), { q: 2, r: 2, equipment: { ...byId('captain').equipment, weapon: 'hunting-bow', shield: null } });
  Object.assign(byId('guard'), { q: 1, r: 1 });
  Object.assign(byId('scout'), { q: 1, r: 2 });
  Object.assign(byId('enemy-1'), { q: 5, r: 2, hp: 40, bodyArmor: 0, headArmor: 0, rangedDefense: 0 });
  Object.assign(byId('enemy-2'), { q: 4, r: 3, hp: 40, bodyArmor: 0, headArmor: 0, rangedDefense: 0 });
  tileAt(battle.field, 5, 2).terrain = 'trees';
  battle.turnIndex = battle.turnOrder.indexOf('captain');
  battle.activeId = 'captain';
  advanceBattle(state);
  assert.equal(battle.lastEvent.targetId, 'enemy-2');
});

test('new fields round-trip, malformed fields fail, and fieldless active saves stay flat', () => {
  const state = createGame(11);
  approach(state);
  advanceBattle(state);
  assert.deepEqual(validateSave(state), state);
  for (const mutate of [
    save => { save.battle.field.tiles[0].q = 1; },
    save => { save.battle.field.tiles[1].terrain = 'lava'; },
    save => { save.battle.field.tiles.pop(); },
    save => { save.battle.field.rows = 9; },
    save => { save.battle.units[0].q = 14; },
    save => { save.battle.units[1].q = save.battle.units[0].q; save.battle.units[1].r = save.battle.units[0].r; },
  ]) {
    const bad = structuredClone(state);
    mutate(bad);
    assert.throws(() => validateSave(bad), /Invalid save/);
  }
  const old = createGame(12);
  approach(old);
  for (const unit of old.battle.units) {
    if (unit.side === 'enemy') { unit.q = unit.equipment.weapon === 'hunting-bow' ? 8 : 7; unit.r -= 1; }
    else unit.r -= 1;
  }
  delete old.battle.field;
  old.battle.lastEvent = null;
  const restored = validateSave(old);
  assert.deepEqual(restored.battle.field, legacyBattleField());
  assert.deepEqual(validateSave(restored), restored);
});
