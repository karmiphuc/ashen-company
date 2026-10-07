import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, pursueBand, tick, resolveBattle, finishBattle,
  getLevelUp, trainAttributes, trainAttribute, getCompanyStats, equipItem, validateSave,
} from '../src/engine.js';

const ATTRIBUTES = ['maxHp', 'meleeSkill', 'rangedSkill', 'meleeDefense', 'rangedDefense', 'maxFatigue', 'initiative', 'resolve'];

function approachBand(state, id) {
  assert.equal(pursueBand(state, id).ok, true);
  for (let step = 0; step < 12 && state.destination; step++) tick(state, 12);
  assert.equal(state.destination, null);
  assert.equal(state.battle?.campId, id, 'catching a patrol starts its battle');
}

function winBand(state, id = 'road-thieves') {
  // Exercise progression with a company one XP below its next level; a single
  // patrol's changing reward balance must not determine whether this fixture levels.
  for (const person of state.party) if (person.level === 1) person.xp = 49;
  approachBand(state, id);
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(state.battle.status, 'victory');
  assert.equal(finishBattle(state).ok, true);
}

test('level rolls are stored for all eight stats and never change on reload or gear swap', () => {
  const state = createGame(39);
  winBand(state);
  const member = state.party.find(person => getLevelUp(person));
  assert.ok(member);
  const offer = getLevelUp(member);
  assert.equal(offer.level, 2);
  assert.deepEqual(Object.keys(offer.rolls), ATTRIBUTES);
  assert.ok(Object.values(offer.rolls).every(value => Number.isInteger(value) && value >= 1 && value <= 5));
  assert.equal(member.trainingPoints, 1);
  assert.equal(getCompanyStats(member).trainingPoints, 1);
  const saved = validateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(getLevelUp(saved.party.find(person => person.id === member.id)), offer);
  assert.equal(equipItem(state, member.id, 'cloth-hood').ok, true);
  assert.deepEqual(getLevelUp(member), offer);
  offer.rolls.maxHp = 99;
  assert.notEqual(getLevelUp(member).rolls.maxHp, 99);
  assert.equal(getLevelUp(null), null);
});

test('three distinct choices apply their own rolls atomically and preserve wound deficit', () => {
  const state = createGame(40);
  winBand(state);
  const member = state.party.find(person => getLevelUp(person));
  const offer = getLevelUp(member);
  member.hp -= 7;
  const before = structuredClone(state);
  for (const keys of [['meleeSkill'], ['meleeSkill', 'meleeSkill', 'resolve'], ['meleeSkill', 'resolve', 'unknown'], null]) {
    assert.equal(trainAttributes(state, member.id, keys).ok, false);
    assert.deepEqual(state, before);
  }
  assert.equal(trainAttribute(state, member.id, 'meleeSkill').ok, false);
  assert.deepEqual(state, before);
  const oldStats = getCompanyStats(member);
  const oldHp = member.hp;
  assert.equal(trainAttributes(state, member.id, ['maxHp', 'meleeSkill', 'resolve']).ok, true);
  assert.equal(member.hp, oldHp + offer.rolls.maxHp);
  assert.equal(getCompanyStats(member).maxHp, oldStats.maxHp + offer.rolls.maxHp);
  assert.equal(getCompanyStats(member).meleeSkill, oldStats.meleeSkill + offer.rolls.meleeSkill);
  assert.equal(getCompanyStats(member).resolve, oldStats.resolve + offer.rolls.resolve);
  assert.equal(member.attributes.rangedSkill, 0);
  assert.equal(member.trainingPoints, 0);
  assert.equal(getLevelUp(member), null);
  assert.equal(trainAttributes(state, member.id, ['maxHp', 'meleeSkill', 'resolve']).ok, false);
  assert.deepEqual(validateSave(state), state);
});

test('several earned levels queue separately and consume oldest choices first', () => {
  const state = createGame(41);
  approachBand(state, 'road-thieves');
  resolveBattle(state);
  state.battle.xp.captain = 450;
  finishBattle(state);
  const captain = state.party.find(person => person.id === 'captain');
  assert.equal(captain.level, 4);
  assert.deepEqual(captain.pendingLevelUps.map(entry => entry.level), [2, 3, 4]);
  assert.equal(captain.trainingPoints, 3);
  const first = getLevelUp(captain);
  trainAttributes(state, captain.id, ['meleeSkill', 'rangedSkill', 'resolve']);
  assert.equal(captain.attributes.meleeSkill, first.rolls.meleeSkill);
  assert.equal(getLevelUp(captain).level, 3);
  trainAttributes(state, captain.id, ['meleeSkill', 'rangedSkill', 'resolve']);
  assert.equal(getLevelUp(captain).level, 4);
  assert.equal(captain.trainingPoints, 1);
  assert.deepEqual(validateSave(state), state);
});

test('old unspent points migrate without changing earned attributes', () => {
  const legacy = createGame(42);
  const captain = legacy.party[0];
  captain.level = 4;
  captain.xp = 10;
  captain.attributes.meleeSkill = 9;
  captain.trainingPoints = 2;
  delete captain.pendingLevelUps;
  const migrated = validateSave(legacy);
  const restored = migrated.party[0];
  assert.equal(restored.attributes.meleeSkill, 9);
  assert.deepEqual(restored.pendingLevelUps.map(entry => entry.level), [3, 4]);
  assert.equal(restored.trainingPoints, 2);
  assert.deepEqual(validateSave(migrated), migrated);
  const oldRoll = getLevelUp(restored).rolls.meleeSkill;
  trainAttributes(migrated, restored.id, ['meleeSkill', 'maxHp', 'resolve']);
  assert.equal(restored.attributes.meleeSkill, 9 + oldRoll);
  assert.equal(getLevelUp(restored).level, 4);
});

test('training is blocked during battle and level 30 XP stays saveable', () => {
  const state = createGame(43);
  winBand(state);
  const member = state.party.find(person => getLevelUp(person));
  approachBand(state, 'hungry-deserters');
  const before = structuredClone(state);
  assert.equal(trainAttributes(state, member.id, ['meleeSkill', 'resolve', 'maxHp']).ok, false);
  assert.deepEqual(state, before);
  resolveBattle(state);
  finishBattle(state);

  const advancing = createGame(44);
  advancing.party[0].level = 20;
  advancing.party[0].xp = 999;
  winBand(advancing);
  assert.equal(advancing.party[0].level, 21);
  assert.equal(getLevelUp(advancing.party[0]).level, 21);
  assert.deepEqual(validateSave(advancing), advancing);

  const veteran = createGame(44);
  veteran.party[0].level = 30;
  veteran.party[0].xp = 1499;
  approachBand(veteran, 'road-thieves');
  resolveBattle(veteran);
  finishBattle(veteran);
  assert.equal(veteran.party[0].xp, 1499);
  assert.deepEqual(validateSave(veteran), veteran);
});

test('save validation rejects forged, duplicate, out-of-order, and out-of-range progress', () => {
  const state = createGame(45);
  winBand(state);
  const person = state.party.find(entry => getLevelUp(entry));
  const index = state.party.findIndex(entry => entry.id === person.id);
  const mutations = [
    save => { save.party[index].pendingLevelUps[0].rolls.maxHp = 0; },
    save => { save.party[index].pendingLevelUps[0].rolls.maxHp = 6; },
    save => { save.party[index].pendingLevelUps[0].rolls.maxHp = save.party[index].pendingLevelUps[0].rolls.maxHp % 5 + 1; },
    save => { delete save.party[index].pendingLevelUps[0].rolls.resolve; },
    save => { save.party[index].pendingLevelUps[0].rolls.fake = 3; },
    save => { save.party[index].pendingLevelUps.push(structuredClone(save.party[index].pendingLevelUps[0])); },
    save => { save.party[index].pendingLevelUps[0].level = 1; },
    save => { save.party[index].trainingPoints = 0; },
  ];
  for (const mutate of mutations) {
    const bad = structuredClone(state);
    mutate(bad);
    assert.throws(() => validateSave(bad), /Invalid save/);
  }
  const impossibleLegacy = createGame(46);
  delete impossibleLegacy.party[0].pendingLevelUps;
  impossibleLegacy.party[0].trainingPoints = 2;
  assert.throws(() => validateSave(impossibleLegacy), /Invalid save/);

  const twoLevels = createGame(47);
  twoLevels.party[0].level = 3;
  twoLevels.party[0].trainingPoints = 2;
  delete twoLevels.party[0].pendingLevelUps;
  const migrated = validateSave(twoLevels);
  migrated.party[0].pendingLevelUps[1].level = 2;
  assert.throws(() => validateSave(migrated), /Invalid save/);
});
