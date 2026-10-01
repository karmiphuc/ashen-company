import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getCampSites, startBattle, advanceBattle, resolveBattle, validateSave, setCombatSettings } from '../src/engine.js';

function start(seed) {
  const state = createGame(seed);
  const camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y };
  assert.equal(startBattle(state, camp.id).ok, true);
  return state;
}

test('personal orders persist and invalid or mid-battle changes cannot mutate the company', () => {
  const state = createGame(9051);
  assert.equal(setCombatSettings(state, 'captain', { combatRole: 'flanker', skillPreference: 'control' }).ok, true);
  assert.equal(validateSave(structuredClone(state)).party[0].combatRole, 'flanker');
  assert.equal(validateSave(structuredClone(state)).party[0].skillPreference, 'control');
  for (const settings of [{ combatRole: 'wizard' }, { skillPreference: 'random' }]) {
    const before = structuredClone(state);
    assert.equal(setCombatSettings(state, 'captain', settings).ok, false);
    assert.deepEqual(state, before);
  }
  const camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y };
  startBattle(state, camp.id);
  const before = structuredClone(state);
  assert.equal(setCombatSettings(state, 'captain', { combatRole: 'ranged' }).ok, false);
  assert.deepEqual(state, before);
});

test('new battles survive a save reload after every action and match instant resolution', () => {
  let stepped = start(9052);
  const instant = structuredClone(stepped);
  assert.equal(stepped.battle.rulesVersion, 2);
  assert.ok(stepped.battle.units.every(unit => unit.ap === 9));
  for (let action = 0; action < 2000 && stepped.battle.status === 'active'; action++) {
    advanceBattle(stepped);
    stepped = validateSave(structuredClone(stepped));
  }
  assert.notEqual(stepped.battle.status, 'active');
  assert.equal(resolveBattle(instant).ok, true);
  assert.deepEqual(stepped, instant);
});

test('legacy active battle keeps its two-AP turns and battlefield through reload', () => {
  const state = start(9053);
  delete state.battle.rulesVersion;
  delete state.battle.weaponSkillsVersion;
  for (const unit of state.battle.units) {
    unit.ap = 2;
    for (const key of ['shieldWallActive', 'tacticalRole', 'skillPreference', 'aiTargetId', 'formationMovedRound', 'movementCredit', 'spearwallActive', 'riposteActive', 'stunnedTurns', 'stunProtected', 'pendingBerserkAp']) delete unit[key];
  }
  const oldField = structuredClone(state.battle.field);
  const restored = validateSave(structuredClone(state));
  assert.notEqual(restored.battle.rulesVersion, 2);
  assert.deepEqual(restored.battle.field, oldField);
  assert.ok(restored.battle.units.every(unit => unit.ap === 2));
  advanceBattle(restored);
  assert.ok(restored.battle.units.every(unit => unit.ap <= 2));
  assert.deepEqual(validateSave(structuredClone(restored)), restored);
});

test('malformed tactical state is rejected while missing company preferences migrate safely', () => {
  const state = createGame(9054);
  for (const person of state.party) { delete person.combatRole; delete person.skillPreference; }
  const migrated = validateSave(state);
  assert.ok(migrated.party.every(person => person.combatRole === 'auto' && person.skillPreference === 'balanced'));
  for (const [key, value] of [['combatRole', 'unknown'], ['skillPreference', 'unknown']]) {
    const malformed = structuredClone(migrated);
    malformed.party[0][key] = value;
    assert.throws(() => validateSave(malformed), /Invalid save/);
  }
});
