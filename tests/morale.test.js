import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceBattle, createGame, getCampSites, getMoraleEffects, startBattle, validateSave } from '../src/engine.js';

function duel() {
  const state = createGame(251);
  const site = getCampSites(state)[0];
  state.position = { x: site.x, y: site.y };
  assert.equal(startBattle(state, site.id).ok, true);
  const battle = state.battle;
  for (const tile of battle.field.tiles) {
    tile.terrain = 'open';
    tile.height = 0;
  }
  const actor = battle.units.find(unit => unit.id === 'captain');
  const target = battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(actor, { q: 2, r: 2, fatigue: 0, morale: 50 });
  Object.assign(battle.units.find(unit => unit.id === 'scout'), { q: 1, r: 1 });
  Object.assign(battle.units.find(unit => unit.id === 'guard'), { q: 1, r: 2 });
  Object.assign(target, { q: 3, r: 2, hp: 300, maxHp: 300, bodyArmor: 0, headArmor: 0, fatigue: 0, morale: 80 });
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy' && unit !== target)) {
    enemy.hp = 0;
    enemy.alive = false;
  }
  battle.turnIndex = battle.turnOrder.indexOf(actor.id);
  battle.activeId = actor.id;
  battle.rng = 0;
  return { state, battle, actor, target };
}

test('resolve and Fortified Mind resist the same wound stress without changing damage', () => {
  const low = duel();
  Object.assign(low.actor, { meleeSkill: 200 });
  low.target.resolve = 20;
  const high = structuredClone(low.state);
  high.battle.units.find(unit => unit.id === 'enemy-1').resolve = 100;
  const fortified = structuredClone(high);
  fortified.battle.units.find(unit => unit.id === 'enemy-1').perks = ['fortified-mind'];
  for (const state of [low.state, high, fortified]) assert.equal(advanceBattle(state).ok, true);
  const highTarget = high.battle.units.find(unit => unit.id === 'enemy-1');
  const fortifiedTarget = fortified.battle.units.find(unit => unit.id === 'enemy-1');
  assert.equal(low.battle.lastEvent.hpDamage, high.battle.lastEvent.hpDamage);
  assert.ok(low.target.morale < highTarget.morale);
  assert.ok(highTarget.morale < fortifiedTarget.morale);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(high))), high);
});

test('morale tiers change hit chance and defense on identical rolls', () => {
  assert.deepEqual([0, 24, 25, 49, 50, 79, 80, 100].map(morale => getMoraleEffects({ morale })), [
    { name: 'Breaking', modifier: -.2 }, { name: 'Breaking', modifier: -.2 },
    { name: 'Wavering', modifier: -.1 }, { name: 'Wavering', modifier: -.1 },
    { name: 'Steady', modifier: 0 }, { name: 'Steady', modifier: 0 },
    { name: 'Confident', modifier: .1 }, { name: 'Confident', modifier: .1 },
  ]);
  const steady = duel();
  Object.assign(steady.actor, { meleeSkill: 18, morale: 50 });
  Object.assign(steady.target, { meleeDefense: 15, morale: 50 });
  const confident = structuredClone(steady.state);
  confident.battle.units.find(unit => unit.id === 'captain').morale = 80;
  advanceBattle(steady.state);
  advanceBattle(confident);
  assert.equal(steady.battle.lastEvent.type, 'miss');
  assert.equal(confident.battle.lastEvent.type, 'attack');

  const normalDefense = duel();
  Object.assign(normalDefense.actor, { meleeSkill: 25, morale: 50 });
  Object.assign(normalDefense.target, { meleeDefense: 20, morale: 50 });
  const confidentDefense = structuredClone(normalDefense.state);
  confidentDefense.battle.units.find(unit => unit.id === 'enemy-1').morale = 80;
  advanceBattle(normalDefense.state);
  advanceBattle(confidentDefense);
  assert.equal(normalDefense.battle.lastEvent.type, 'attack');
  assert.equal(confidentDefense.battle.lastEvent.type, 'miss');
});

test('a kill rallies living allies, stresses surviving enemies, and clamps morale', () => {
  const { state, battle, actor, target } = duel();
  Object.assign(actor, { meleeSkill: 200, morale: 98 });
  Object.assign(target, { hp: 1, maxHp: 300 });
  const ally = battle.units.find(unit => unit.id === 'scout');
  ally.morale = 99;
  const enemyAlly = battle.units.find(unit => unit.id === 'enemy-2');
  Object.assign(enemyAlly, { hp: enemyAlly.maxHp, alive: true, morale: 5 });
  advanceBattle(state);
  assert.equal(target.alive, false);
  assert.equal(actor.morale, 100);
  assert.equal(ally.morale, 100);
  assert.equal(enemyAlly.morale, 0);
  assert.ok(battle.units.every(unit => Number.isInteger(unit.morale) && unit.morale >= 0 && unit.morale <= 100));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});
