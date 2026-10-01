import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCombatRole, rankTacticalActions } from '../src/tactical-ai.js';

const actor = { ap: 9, fatigue: 0, maxFatigue: 100, tacticalRole: 'ranged', skillPreference: 'balanced' };
test('a backup dagger does not turn an automatic archer into a frontliner', () => {
  assert.equal(resolveCombatRole({}, { ranged: false }, { ranged: true }), 'ranged');
  assert.equal(resolveCombatRole({ combatRole: 'flanker' }, { throwing: true, ranged: true }), 'flanker');
});
test('utility ranking rejects impossible actions and prefers safer damage for archers', () => {
  const candidates = [
    { id: 'rush', expectedHealthDamage: 20, incomingDamage: 20, apCost: 6 },
    { id: 'shoot', expectedHealthDamage: 15, incomingDamage: 0, apCost: 4 },
    { id: 'unaffordable', expectedHealthDamage: 100, apCost: 10 },
    { id: 'illegal', expectedHealthDamage: 100, legal: false },
  ];
  assert.deepEqual(rankTacticalActions(actor, candidates).map(action => action.id), ['shoot', 'rush']);
});
test('control preferences reward useful defense while damage prefers attacking', () => {
  const candidates = [{ id: 'attack', expectedHealthDamage: 20, apCost: 4 }, { id: 'shield', preventedDamage: 18, apCost: 4 }];
  assert.equal(rankTacticalActions({ ...actor, skillPreference: 'control' }, candidates)[0].id, 'shield');
  assert.equal(rankTacticalActions({ ...actor, skillPreference: 'damage' }, candidates)[0].id, 'attack');
});
test('stable target persistence and formation penalties apply without consuming randomness', () => {
  const candidates = [{ id: 'move', targetId: 'a', formationDistance: 3 }, { id: 'hold', targetId: 'b' }];
  assert.equal(rankTacticalActions(actor, candidates, { tactic: 'defense', previousTargetId: 'b' })[0].id, 'hold');
  assert.deepEqual(rankTacticalActions(actor, candidates), rankTacticalActions(actor, candidates));
});
