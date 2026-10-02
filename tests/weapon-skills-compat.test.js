import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advanceBattle, resolveBattle, validateSave } from '../src/engine.js';

function oldBattle() {
  return JSON.parse(readFileSync(new URL('./fixtures/v036-active-battle.json', import.meta.url), 'utf8'));
}

test('v0.36 saved battle resolves identically to the previous released engine', () => {
  const state = validateSave(oldBattle());
  const expected = JSON.parse(readFileSync(new URL('./fixtures/v036-resolved-battle.json', import.meta.url), 'utf8'));
  assert.equal(resolveBattle(state).ok, true);
  assert.deepEqual(state, validateSave(expected));
});

test('an actual v0.36 active battle preserves its rules, position and AP without opting into new weapon skills', () => {
  const original = oldBattle();
  const restored = validateSave(structuredClone(original));
  assert.equal(restored.battle.rulesVersion, 2);
  assert.notEqual(restored.battle.weaponSkillsVersion, 1);
  assert.deepEqual(restored.battle.field, original.battle.field);
  for (const unit of original.battle.units) {
    const saved = restored.battle.units.find(candidate => candidate.id === unit.id);
    for (const key of ['q', 'r', 'hp', 'ap', 'fatigue', 'reload', 'movementCredit']) assert.equal(saved[key], unit[key]);
  }
  for (let step = 0; step < 1000 && restored.battle.status === 'active'; step++) {
    advanceBattle(restored);
    assert.notEqual(restored.battle.weaponSkillsVersion, 1);
    assert.ok(restored.battle.units.every(unit => !unit.spearwallActive && !unit.riposteActive && !unit.stunnedTurns));
    validateSave(structuredClone(restored));
  }
  assert.notEqual(restored.battle.status, 'active');
});

test('v0.36 stepping with a reload after every action matches instant resolution', () => {
  let stepped = validateSave(oldBattle());
  const instant = structuredClone(stepped);
  for (let step = 0; step < 2000 && stepped.battle.status === 'active'; step++) {
    advanceBattle(stepped);
    stepped = validateSave(structuredClone(stepped));
  }
  assert.notEqual(stepped.battle.status, 'active');
  assert.equal(resolveBattle(instant).ok, true);
  assert.deepEqual(stepped, instant);
});
