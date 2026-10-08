import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getCampSites, startBattle, advanceBattle, validateSave, setBattleTactic, shieldMaximum, getItem } from '../src/engine.js';
import { hexDistance } from '../src/battle-terrain.js';

function setup(weapon = 'arming-sword') {
  const state = createGame(51);
  state.party[0].equipment.weapon = weapon;
  if (getItem(weapon).twoHanded) {
    state.party[0].equipment.shield = null;
    state.party[0].armorDurability.shield = 0;
  }
  const camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y };
  startBattle(state, camp.id);
  const battle = state.battle;
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  const at = (id, q, r) => Object.assign(battle.units.find(unit => unit.id === id), { q, r });
  const actor = at('captain', 4, 4);
  at('guard', 1, 13); at('scout', 2, 13);
  at('enemy-1', 0, 4); at('enemy-2', 9, 4); at('enemy-3', 12, 15);
  battle.activeId = actor.id;
  battle.turnIndex = battle.turnOrder.indexOf(actor.id);
  return { state, battle, actor, at };
}

test('melee approaches the nearest reachable enemy rather than rewarding distant targets', () => {
  const { state, battle, actor, at } = setup();
  at('captain', 6, 6); at('enemy-1', 0, 6);
  const near = at('enemy-2', 9, 6);
  const before = hexDistance(actor, near);
  advanceBattle(state);
  assert.equal(battle.lastEvent.type, 'move');
  assert.equal(actor.aiTargetId, near.id);
  assert.ok(hexDistance(actor, near) < before);
});

test('a reachable pursuit remains committed across steps and save reloads', () => {
  let { state, actor } = setup();
  actor.aiTargetId = 'enemy-2';
  let lastDistance = 5;
  for (let step = 0; step < 3; step++) {
    advanceBattle(state);
    const target = state.battle.units.find(unit => unit.id === 'enemy-2');
    assert.equal(actor.aiTargetId, target.id);
    assert.equal(state.battle.lastEvent.type, 'move');
    assert.ok(hexDistance(actor, target) < lastDistance, 'movement must not reverse to another target');
    lastDistance = hexDistance(actor, target);
    state = validateSave(structuredClone(state));
    actor = state.battle.units.find(unit => unit.id === 'captain');
  }
});

test('an adjacent enemy interrupts distant pursuit and shield-wall reformation', () => {
  for (const tactic of ['offense', 'focus', 'shield-wall']) {
    const { state, battle, actor, at } = setup();
    setBattleTactic(state, tactic);
    actor.aiTargetId = 'enemy-2';
    battle.focusTargetId = 'enemy-2';
    const near = at('enemy-1', 5, 4);
    at('guard', 3, 5);
    actor.equipment.shield = null;
    actor.shieldDurability = actor.maxShieldDurability = 0;
    const origin = { q: actor.q, r: actor.r };
    advanceBattle(state);
    assert.ok(['attack', 'miss'].includes(battle.lastEvent.type), tactic);
    assert.equal(battle.lastEvent.targetId, near.id, tactic);
    assert.deepEqual({ q: actor.q, r: actor.r }, origin, tactic);
  }
});

test('dead and unreachable pursuit targets release the commitment', () => {
  for (const blocked of [false, true]) {
    const { state, actor, at, battle } = setup();
    actor.aiTargetId = 'enemy-1';
    const previous = at('enemy-1', 0, 4);
    if (blocked) {
      for (const tile of battle.field.tiles.filter(tile => tile.q === 1)) tile.terrain = 'dense-trees';
    } else { previous.hp = 0; previous.alive = false; }
    advanceBattle(state);
    assert.equal(actor.aiTargetId, 'enemy-2');
    assert.equal(battle.lastEvent.type, 'move');
  }
});

test('empty-ammo pursuit follows a detour without doubling back into a dead end', () => {
  const { state, battle, actor, at } = setup('hunting-bow');
  state.supplies.ammo = 0;
  at('captain', 6, 6);
  const target = at('enemy-1', 10, 6);
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy' && unit !== target)) {
    enemy.hp = 0; enemy.alive = false;
  }
  for (const tile of battle.field.tiles.filter(tile => tile.q === 8 && tile.r > 0)) tile.terrain = 'dense-trees';
  const visited = new Set([`${actor.q},${actor.r}`]);
  for (let step = 0; step < 30 && hexDistance(actor, target) > 1; step++) {
    actor.ap = 9;
    battle.activeId = actor.id;
    battle.turnIndex = battle.turnOrder.indexOf(actor.id);
    advanceBattle(state);
    assert.equal(battle.lastEvent.type, 'move');
    const point = `${actor.q},${actor.r}`;
    assert.equal(visited.has(point), false, 'a stationary target must not cause a movement loop');
    visited.add(point);
  }
  assert.equal(hexDistance(actor, target), 1);
});

test('reach weapons deal with adjacent threats before a farther pursuit or focus target', () => {
  for (const tactic of ['offense', 'focus']) {
    const { state, battle, actor, at } = setup('billhook');
    setBattleTactic(state, tactic);
    actor.aiTargetId = battle.focusTargetId = 'enemy-2';
    at('enemy-2', 6, 4);
    const near = at('enemy-1', 5, 4);
    advanceBattle(state);
    assert.equal(battle.lastEvent.targetId, near.id);
    assert.ok(['attack', 'miss'].includes(battle.lastEvent.type));
  }
});

test('Offense permits Shieldwall only when surrounded by two or more enemies', () => {
  for (const count of [1, 2]) {
    const { state, battle, actor, at } = setup();
    // Use the melee-focused OG heater; kites prioritize ranged defense.
    actor.equipment.shield = 'heater-shield';
    actor.shieldDurability = actor.maxShieldDurability = shieldMaximum('heater-shield');
    actor.perks = ['shield-expert', 'shield-bearer'];
    actor.skillPreference = 'control';
    const first = at('enemy-1', 5, 4);
    const second = at('enemy-2', count === 2 ? 4 : 9, count === 2 ? 5 : 4);
    for (const target of [first, second]) {
      target.meleeSkill = 0;
      target.meleeDefense = 200;
    }
    advanceBattle(state);
    if (count === 1) {
      assert.notEqual(battle.lastEvent.skillName, 'Shieldwall');
      assert.equal(actor.shieldWallActive, false);
    } else {
      assert.equal(battle.lastEvent.skillName, 'Shieldwall');
      assert.equal(actor.shieldWallActive, true);
    }
  }
});
