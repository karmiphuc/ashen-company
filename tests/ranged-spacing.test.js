import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, getCampSites, startBattle, advanceBattle, resolveBattle,
  setBattleTactic, validateSave,
} from '../src/engine.js';
import { hexDistance } from '../src/battle-terrain.js';

function setup(weaponId = 'hunting-bow', seed = 51, backup = null) {
  const state = createGame(seed);
  const captain = state.party.find(person => person.id === 'captain');
  captain.equipment.weapon = weaponId;
  captain.equipment.shield = null;
  if (backup === 'pocket') captain.accessories[0] = 'rondel-dagger';
  else if (backup) captain.reserveEquipment = { weapon: backup, shield: null };
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

test('unpressured archers with empty ammo hold position instead of swapping and charging', () => {
  for (const weapon of ['hunting-bow', 'light-crossbow']) {
    for (const backup of [null, 'arming-sword', 'pocket']) {
      for (const tactic of ['offense', 'focus', 'defense']) {
        const { state, battle, actor, at } = setup(weapon, 51, backup);
        setBattleTactic(state, tactic);
        at('enemy-1', 6, 2);
        state.supplies.ammo = 0;
        for (let turn = 0; turn < 3; turn++) {
          battle.activeId = actor.id;
          battle.turnIndex = battle.turnOrder.indexOf(actor.id);
          advanceBattle(state);
          assert.equal(actor.equipment.weapon, weapon, `${weapon}/${backup}/${tactic} swapped without pressure`);
          assert.deepEqual({ q: actor.q, r: actor.r }, { q: 2, r: 2 });
          assert.equal(state.supplies.ammo, 0);
        }
        assert.deepEqual(validateSave(state), state);
      }
    }
  }
});

test('defensive melee backups return to ranged fire as soon as two-hex space opens, including after reload', () => {
  for (const weapon of ['hunting-bow', 'light-crossbow']) {
    for (const backup of ['arming-sword', 'pocket']) {
      for (const tactic of ['offense', 'focus', 'defense']) {
        const initial = setup(weapon, 51, backup);
        setBattleTactic(initial.state, tactic);
        initial.at('captain', 0, 0);
        initial.at('guard', 0, 1);
        initial.at('enemy-1', 1, 0);
        advanceBattle(initial.state);
        assert.equal(initial.battle.lastEvent.type, 'swap');
        initial.at('enemy-1', 2, 0);
        const state = validateSave(JSON.parse(JSON.stringify(initial.state)));
        const battle = state.battle;
        const actor = battle.units.find(unit => unit.id === 'captain');
        battle.activeId = actor.id;
        battle.turnIndex = battle.turnOrder.indexOf(actor.id);
        const ammo = state.supplies.ammo;
        advanceBattle(state);
        assert.equal(actor.equipment.weapon, weapon, `${weapon}/${backup}/${tactic} stayed in melee`);
        assert.deepEqual({ q: actor.q, r: actor.r }, { q: 0, r: 0 });
        battle.activeId = actor.id;
        battle.turnIndex = battle.turnOrder.indexOf(actor.id);
        advanceBattle(state);
        assert.equal(battle.lastEvent.ranged, true);
        assert.equal(state.supplies.ammo, ammo - 1);
        assert.ok(minimumEnemyDistance(battle, actor) >= 2);
        assert.deepEqual(validateSave(state), state);
      }
    }
  }
});

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

test('funded archers keep their ranged weapon despite carrying a melee reserve or pocket blade', () => {
  for (const weapon of ['hunting-bow', 'light-crossbow']) {
    for (const backup of ['arming-sword', 'pocket']) {
      const { state, battle, actor } = setup(weapon, 51, backup);
      const ammo = state.supplies.ammo;
      advanceBattle(state);
      assert.equal(actor.equipment.weapon, weapon);
      assert.equal(battle.lastEvent.ranged, true);
      assert.equal(state.supplies.ammo, ammo - 1);
      assert.ok(minimumEnemyDistance(battle, actor) >= 2);
    }
  }
});

test('empty-ammo archers retreat if possible and only draw melee when trapped', () => {
  for (const backup of ['arming-sword', 'pocket']) {
    const { state, battle, actor, at } = setup('hunting-bow', 51, backup);
    state.supplies.ammo = 0;
    at('enemy-1', 3, 2);
    advanceBattle(state);
    assert.equal(battle.lastEvent.type, 'move');
    assert.equal(actor.equipment.weapon, 'hunting-bow');
    assert.ok(minimumEnemyDistance(battle, actor) >= 2);
    at('captain', 0, 0);
    at('guard', 0, 1);
    at('enemy-1', 1, 0);
    battle.activeId = actor.id;
    battle.turnIndex = battle.turnOrder.indexOf(actor.id);
    advanceBattle(state);
    assert.equal(battle.lastEvent.type, 'swap');
    assert.equal(actor.equipment.weapon, backup === 'pocket' ? 'rondel-dagger' : backup);
    at('enemy-1', 2, 0);
    battle.activeId = actor.id;
    battle.turnIndex = battle.turnOrder.indexOf(actor.id);
    advanceBattle(state);
    assert.equal(battle.lastEvent.type, 'hold');
    assert.deepEqual({ q: actor.q, r: actor.r }, { q: 0, r: 0 });
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
  empty.at('captain', 0, 0);
  empty.at('guard', 0, 1);
  empty.at('enemy-1', 1, 0);
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
