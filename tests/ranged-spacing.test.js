import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, getCampSites, startBattle, advanceBattle, resolveBattle,
  setBattleTactic, validateSave,
} from '../src/engine.js';
import { hexDistance } from '../src/battle-terrain.js';

function setup(weaponId = 'hunting-bow', seed = 51) {
  const state = createGame(seed);
  const captain = state.party.find(person => person.id === 'captain');
  captain.equipment.weapon = weaponId;
  captain.equipment.shield = null;
  const camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y };
  assert.equal(startBattle(state, camp.id).ok, true);
  const battle = state.battle;
  for (const tile of battle.field.tiles) {
    tile.terrain = 'open';
    tile.height = 0;
  }
  const at = (id, q, r) => Object.assign(battle.units.find(unit => unit.id === id), { q, r });
  at('captain', 2, 2);
  at('guard', 1, 1);
  at('scout', 1, 3);
  at('enemy-1', 4, 2);
  at('enemy-2', 11, 4);
  at('enemy-3', 12, 5);
  battle.turnIndex = battle.turnOrder.indexOf('captain');
  battle.activeId = 'captain';
  return { state, battle, actor: battle.units.find(unit => unit.id === 'captain'), at };
}

function minimumEnemyDistance(battle, actor) {
  return Math.min(...battle.units.filter(unit => unit.side === 'enemy' && unit.alive).map(enemy => hexDistance(actor, enemy)));
}

test('funded bows keep space instead of stepping adjacent for a better shot', () => {
  for (const tactic of ['offense', 'focus', 'defense']) {
    const { state, battle, actor } = setup();
    assert.equal(setBattleTactic(state, tactic).ok, true);
    battle.field.tiles.find(tile => tile.q === 4 && tile.r === 2).terrain = 'trees';
    battle.field.tiles.find(tile => tile.q === 3 && tile.r === 2).height = 2;
    const ammo = state.supplies.ammo;
    assert.equal(advanceBattle(state).ok, true);
    assert.ok(minimumEnemyDistance(battle, actor) >= 2, `${tactic} walked adjacent to an enemy`);
    assert.ok(['attack', 'miss'].includes(battle.lastEvent.type), `${tactic} did not shoot`);
    assert.equal(battle.lastEvent.ranged, true);
    assert.equal(state.supplies.ammo, ammo - 1);
    assert.deepEqual(validateSave(state), state);
  }
});

test('ranged positioning accounts for nearby enemies other than the chosen target', () => {
  const { state, battle, actor, at } = setup();
  at('enemy-1', 5, 2);
  at('enemy-2', 3, 3);
  battle.field.tiles.find(tile => tile.q === 5 && tile.r === 2).terrain = 'trees';
  battle.field.tiles.find(tile => tile.q === 3 && tile.r === 2).height = 2;
  const ammo = state.supplies.ammo;
  assert.equal(advanceBattle(state).ok, true);
  assert.ok(minimumEnemyDistance(battle, actor) >= 2);
  assert.ok(['attack', 'miss'].includes(battle.lastEvent.type));
  assert.equal(state.supplies.ammo, ammo - 1);
});

test('retreating archers shoot an in-range threat when the focus target is distant', () => {
  const { state, battle, actor, at } = setup();
  setBattleTactic(state, 'focus');
  at('enemy-1', 3, 2);
  at('enemy-2', 10, 2);
  battle.focusTargetId = 'enemy-2';
  const ammo = state.supplies.ammo;
  assert.equal(advanceBattle(state).ok, true);
  assert.ok(minimumEnemyDistance(battle, actor) >= 2);
  assert.equal(battle.lastEvent.targetId, 'enemy-1');
  assert.equal(state.supplies.ammo, ammo - 1);
});

test('crossbows fire from range and keep their reload turn', () => {
  const { state, battle, actor, at } = setup('light-crossbow');
  at('enemy-1', 7, 2);
  const ammo = state.supplies.ammo;
  assert.equal(advanceBattle(state).ok, true);
  assert.ok(minimumEnemyDistance(battle, actor) >= 2);
  assert.equal(battle.lastEvent.weaponId, 'light-crossbow');
  assert.equal(battle.lastEvent.ranged, true);
  assert.equal(state.supplies.ammo, ammo - 1);
  assert.equal(actor.reload, 1);
  battle.turnIndex = battle.turnOrder.indexOf('captain');
  battle.activeId = 'captain';
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(battle.lastEvent.type, 'recover');
  assert.equal(actor.reload, 0);
  assert.equal(state.supplies.ammo, ammo - 1);
});

test('a cornered bowman shoots at close range; empty ammo uses melee fallback', () => {
  const trapped = setup();
  trapped.at('captain', 0, 0);
  trapped.at('enemy-1', 1, 0);
  trapped.at('guard', 0, 1);
  const ammo = trapped.state.supplies.ammo;
  assert.equal(advanceBattle(trapped.state).ok, true);
  assert.equal(trapped.battle.lastEvent.ranged, true);
  assert.equal(trapped.state.supplies.ammo, ammo - 1);

  const empty = setup();
  empty.at('enemy-1', 3, 2);
  empty.state.supplies.ammo = 0;
  assert.equal(advanceBattle(empty.state).ok, true);
  assert.ok(['attack', 'miss'].includes(empty.battle.lastEvent.type));
  assert.equal(empty.battle.lastEvent.ranged, false);
  assert.equal(empty.state.supplies.ammo, 0);
});

test('bow and crossbow fights still resolve under all three tactics', () => {
  for (const weaponId of ['hunting-bow', 'light-crossbow']) {
    for (const tactic of ['offense', 'focus', 'defense']) {
      for (let seed = 1; seed <= 6; seed++) {
        const { state } = setup(weaponId, seed);
        setBattleTactic(state, tactic);
        assert.equal(resolveBattle(state).ok, true);
        assert.notEqual(state.battle.status, 'active', `${weaponId}/${tactic}/${seed} stalled`);
        assert.ok(state.supplies.ammo >= 0);
        assert.deepEqual(validateSave(state), state);
      }
    }
  }
});
