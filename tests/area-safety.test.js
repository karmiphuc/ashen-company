import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAreaSafety, compareAreaSafety } from '../src/area-safety.js';

const enemy = { id: 'enemy-1', ally: false, hp: 20, killProbability: .9, maxHealthDamage: 35, expectedHealthDamage: 25, expectedArmorDamage: 10 };
const ally = { id: 'guard', ally: true, hp: 50, killProbability: 0, maxHealthDamage: 30, expectedHealthDamage: 8, expectedArmorDamage: 6 };
const options = { safeKillProbabilityById: { 'enemy-1': .89 } };

test('area attacks without friendly targets are allowed but empty or ally-only attacks are not', () => {
  assert.equal(evaluateAreaSafety([enemy]).allowed, true);
  assert.equal(evaluateAreaSafety([enemy]).exception, false);
  assert.equal(evaluateAreaSafety([]).allowed, false);
  assert.equal(evaluateAreaSafety([ally], options).allowed, false);
});

test('friendly fire requires a 90% kill with no equally certain safe finishing sequence', () => {
  const allowed = evaluateAreaSafety([enemy, ally], options);
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.exception, true);
  assert.equal(allowed.allyHealthDamage, 8);
  assert.equal(allowed.allyArmorDamage, 6);
  for (const killProbability of [.899, .5, 0]) {
    assert.equal(evaluateAreaSafety([{ ...enemy, killProbability }, ally], options).allowed, false);
  }
  for (const safeProbability of [.9, 1]) {
    assert.equal(evaluateAreaSafety([enemy, ally], { safeKillProbabilityById: { 'enemy-1': safeProbability } }).allowed, false);
  }
  assert.equal(evaluateAreaSafety([enemy, ally]).allowed, false, 'a missing safe-sequence proof is not permission');
});

test('every friendly must survive worst-case damage, including a potentially fatal head hit', () => {
  for (const maxHealthDamage of [50, 51, 100]) {
    assert.equal(evaluateAreaSafety([enemy, { ...ally, maxHealthDamage }], options).allowed, false);
  }
  const fragile = { ...ally, id: 'scout', hp: 5, maxHealthDamage: 5 };
  assert.equal(evaluateAreaSafety([enemy, ally, fragile], options).allowed, false);
  assert.equal(evaluateAreaSafety([enemy, { ...ally, hp: 31 }], options).allowed, true);
});

test('eligible exceptions rank by least friendly health damage, then armor damage', () => {
  const lowerHealth = evaluateAreaSafety([enemy, { ...ally, expectedHealthDamage: 1, expectedArmorDamage: 20 }], options);
  const lowerArmor = evaluateAreaSafety([enemy, { ...ally, expectedHealthDamage: 1, expectedArmorDamage: 10 }], options);
  const higherHealth = evaluateAreaSafety([enemy, ally], options);
  assert.ok(compareAreaSafety(lowerArmor, lowerHealth) < 0);
  assert.ok(compareAreaSafety(lowerHealth, higherHealth) < 0);
});

test('malformed or duplicate impact records fail closed without mutating input', () => {
  const impacts = [enemy, ally];
  const before = structuredClone(impacts);
  evaluateAreaSafety(impacts, options);
  assert.deepEqual(impacts, before);
  for (const patch of [{ hp: NaN }, { maxHealthDamage: Infinity }, { killProbability: 1.1 }, { killProbability: .1 }, { expectedArmorDamage: -1 }, { expectedHealthDamage: undefined }, { expectedHealthDamage: 31 }]) {
    assert.equal(evaluateAreaSafety([enemy, { ...ally, ...patch }], options).allowed, false);
  }
  assert.equal(evaluateAreaSafety([enemy, ally, ally], options).allowed, false);
  assert.equal(evaluateAreaSafety([enemy, ally], { safeKillProbabilityById: { 'enemy-1': NaN } }).allowed, false);
});
