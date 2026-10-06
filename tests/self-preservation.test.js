import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldPreserveBrother } from '../src/tactical-ai.js';
import { createGame, getCampSites, startBattle, advanceBattle, setBattleTactic, validateSave } from '../src/engine.js';
import { setSimultaneousBetaEnabled } from '../src/combat-config.js';
import { hexDistance } from '../src/battle-terrain.js';

const unit = (id, side, hp = 100) => ({ id, side, hp, maxHp: 100, alive: true });
test('caution increases with advantage, excludes enemies, and needs healthier allies', () => {
  const actor = unit('bro', 'company', 40);
  const battle = { units: [actor, unit('ally', 'company'), unit('ally2', 'company'), unit('enemy', 'enemy')] };
  assert.equal(shouldPreserveBrother(battle, actor), true);
  battle.units.push(unit('enemy2', 'enemy'), unit('enemy3', 'enemy'));
  assert.equal(shouldPreserveBrother(battle, actor), false);
  actor.hp = 20;
  assert.equal(shouldPreserveBrother(battle, actor), true);
  battle.units[1].escaped = true; battle.units[2].hp = 20;
  assert.equal(shouldPreserveBrother(battle, actor), false);
  assert.equal(shouldPreserveBrother(battle, battle.units[3]), false);
});

function setup() {
  const state = createGame(51), camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y }; startBattle(state, camp.id);
  const battle = state.battle;
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  const actor = battle.units.find(u => u.id === 'captain');
  Object.assign(actor, { q: 4, r: 4, hp: Math.max(1, Math.floor(actor.maxHp * .2)) });
  actor.perks = actor.perks.filter(p => p !== 'rotation');
  let index = 0;
  for (const u of battle.units) if (u !== actor) Object.assign(u, { q: u.side === 'company' ? 1 : 10, r: 5 + index++ });
  battle.activeId = actor.id; battle.turnIndex = battle.turnOrder.indexOf(actor.id);
  return { state, battle, actor };
}
test('wounded frontliners stop pursuit under every company tactic without save changes', () => {
  for (const tactic of ['offense', 'focus', 'advance-formation', 'shield-wall', 'skirmish', 'defense']) {
    const { state, battle, actor } = setup(); setBattleTactic(state, tactic);
    const from = { q: actor.q, r: actor.r }; advanceBattle(state);
    assert.equal(battle.lastEvent.type, 'hold', tactic);
    assert.deepEqual({ q: actor.q, r: actor.r }, from, tactic);
    assert.match(battle.lastEvent.message, /wounded/);
    assert.doesNotThrow(() => validateSave(structuredClone(state)));
  }
});
test('an unengaged wounded brother falls back instead of entering melee', () => {
  const { state, battle, actor } = setup();
  const enemy = battle.units.find(u => u.side === 'enemy'); Object.assign(enemy, { q: 6, r: 4 });
  const before = hexDistance(actor, enemy); advanceBattle(state);
  assert.equal(battle.lastEvent.type, 'move'); assert.ok(hexDistance(actor, enemy) > before);
  assert.match(battle.lastEvent.message, /falls back wounded/);
});
test('engaged wounded shield users defend without exposing themselves to free attacks', () => {
  const { state, battle, actor } = setup();
  const enemy = battle.units.find(u => u.side === 'enemy'); Object.assign(enemy, { q: 5, r: 4 });
  const hp = actor.hp, ap = actor.ap; advanceBattle(state);
  assert.equal(actor.shieldWallActive, true); assert.equal(actor.ap, ap - 4);
  assert.equal(actor.hp, hp); assert.equal(actor.q, 4); assert.equal(actor.r, 4);
});
test('healthy frontliners continue pursuit', () => {
  const { state, battle, actor } = setup(); actor.hp = actor.maxHp; advanceBattle(state);
  assert.equal(battle.lastEvent.type, 'move');
});

test('realtime wounded brothers hold back and remain deterministic after reload', () => {
  setSimultaneousBetaEnabled(true);
  let state, battle, actor;
  try { ({ state, battle, actor } = setup()); } finally { setSimultaneousBetaEnabled(false); }
  for (const unit of battle.units) battle.simultaneous.actors[unit.id].readyAt = unit === actor ? 0 : 1000;
  const reload = validateSave(structuredClone(state));
  advanceBattle(state); advanceBattle(reload);
  assert.deepEqual(state, reload);
  assert.equal(actor.q, 4); assert.equal(actor.r, 4);
  assert.equal(battle.lastEvent.actorId, actor.id);
  assert.match(battle.lastEvent.message, /holds back wounded/);
});
