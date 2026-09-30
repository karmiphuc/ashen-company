import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, getContractOffers, acceptContract, getContractTarget, getQuestEncounter, getCaravans,
  getCampSites, startBattle, advanceBattle, resolveBattle, retreatBattle, finishBattle,
  activateMapTarget, tick, travelTo, validateSave, contractObjectiveComplete,
} from '../src/engine.js';

function accept(state, type) {
  const offer = getContractOffers(state, 'oakwatch').find(entry => entry.type === type);
  assert.ok(offer, `${type} offer exists`);
  assert.equal(acceptContract(state, 'oakwatch', offer.id).ok, true);
  return offer;
}

function questAllies(battle) { return battle.units.filter(unit => unit.ally); }

test('joint assault targets a hard camp and militia fight without joining the roster', () => {
  const state = createGame(901);
  const offer = accept(state, 'assault');
  const site = getContractTarget(state);
  assert.equal(site.id, offer.campId);
  assert.ok(site.difficulty >= 2);
  state.position = { x: site.x, y: site.y };
  assert.equal(startBattle(state, site.id).ok, true);
  const battle = state.battle;
  assert.equal(battle.encounterType, 'camp');
  assert.deepEqual(questAllies(battle).map(unit => unit.id), ['ally-1', 'ally-2', 'ally-3']);
  assert.ok(questAllies(battle).every(unit => unit.side === 'company' && unit.alive));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
  const ally = questAllies(battle)[0];
  battle.turnIndex = battle.turnOrder.indexOf(ally.id);
  battle.activeId = ally.id;
  assert.equal(advanceBattle(state).ok, true);
  assert.notEqual(battle.lastEvent.targetId, state.party[0].id, 'militia never targets the company');
  assert.ok(!Object.hasOwn(battle.xp, ally.id));
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy')) Object.assign(enemy, { hp: 0, alive: false });
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(finishBattle(state).ok, true);
  assert.equal(contractObjectiveComplete(state), true);
  assert.equal(getContractTarget(state), null);
  assert.equal(state.party.length, 3);
  assert.ok(!state.inventory.includes('arming-sword') || state.party.every(person => !person.id.startsWith('ally-')));
});

test('rescue caravan waits through days, travel opens allied battle, and reward is claimed once', () => {
  const state = createGame(902);
  const offer = accept(state, 'rescue');
  const encounter = getQuestEncounter(state);
  assert.equal(encounter.id, offer.rescueId);
  assert.deepEqual({ x: encounter.x, y: encounter.y }, offer.rescuePoint);
  assert.equal(getCaravans(state).find(caravan => caravan.id === encounter.id)?.status, 'under-attack');
  assert.equal(tick(state, 48).ok, true);
  assert.equal(getQuestEncounter(state)?.id, encounter.id, 'quest caravan holds until arrival');
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = (state.day - 1) * 24 + state.hour + 48;
  assert.equal(activateMapTarget(state, 'caravan', encounter.id).ok, true);
  assert.deepEqual(state.destinationAction, { type: 'rescue', id: encounter.id });
  for (let turn = 0; turn < 20 && !state.battle; turn++) assert.equal(tick(state, 3).ok, true);
  assert.equal(state.battle?.encounterType, 'rescue');
  assert.equal(questAllies(state.battle).length, 3);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
  for (const enemy of state.battle.units.filter(unit => unit.side === 'enemy')) Object.assign(enemy, { hp: 0, alive: false });
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(finishBattle(state).ok, true);
  assert.equal(state.contract.rescued, true);
  assert.equal(getQuestEncounter(state), null);
  assert.equal(getCaravans(state).some(caravan => caravan.id === encounter.id), false);
  assert.equal(contractObjectiveComplete(state), true);
  const reward = state.contract.reward;
  const gold = state.gold;
  assert.equal(travelTo(state, 350, 460).ok, true);
  for (let turn = 0; turn < 30 && state.contract; turn++) assert.equal(tick(state, 3).ok, true);
  assert.equal(state.contract, null);
  assert.ok(state.gold >= gold + reward);
  assert.deepEqual(validateSave(state), state);
});

test('retreat leaves rescue pending, with no allied casualties or rewards', () => {
  const state = createGame(903);
  accept(state, 'rescue');
  const encounter = getQuestEncounter(state);
  state.position = { x: encounter.x, y: encounter.y };
  assert.equal(startBattle(state, encounter.id).ok, true);
  assert.equal(retreatBattle(state).ok, true);
  assert.ok(state.battle.casualties.every(id => !id.startsWith('ally-')));
  assert.equal(finishBattle(state).ok, true);
  assert.equal(state.contract.rescued, false);
  assert.equal(getQuestEncounter(state)?.id, encounter.id);
  assert.deepEqual(validateSave(state), state);
});

test('ordinary hunt and old saves keep their original route and roster', () => {
  const state = createGame(904);
  const offer = accept(state, 'hunt');
  const site = getCampSites(state).find(entry => entry.id === offer.campId);
  state.position = { x: site.x, y: site.y };
  assert.equal(startBattle(state, site.id).ok, true);
  assert.equal(questAllies(state.battle).length, 0);
  assert.equal(getQuestEncounter(state), null);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('allied guards attack raiders independently and never earn company XP', () => {
  const state = createGame(905);
  accept(state, 'rescue');
  const encounter = getQuestEncounter(state);
  state.position = { x: encounter.x, y: encounter.y };
  startBattle(state, encounter.id);
  const battle = state.battle;
  battle.tactic = 'defense';
  const ally = questAllies(battle)[0];
  const enemy = battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(ally, { q: 3, r: 2, meleeSkill: 200 });
  Object.assign(enemy, { q: 4, r: 2, hp: 1 });
  for (const tile of battle.field.tiles) if (tile.q === 3 && tile.r === 2 || tile.q === 4 && tile.r === 2) tile.terrain = 'open';
  battle.turnIndex = battle.turnOrder.indexOf(ally.id);
  battle.activeId = ally.id;
  battle.rng = 0;
  advanceBattle(state);
  assert.equal(battle.lastEvent.actorId, ally.id);
  assert.equal(battle.lastEvent.targetId, enemy.id);
  assert.equal(enemy.alive, false);
  assert.equal(battle.xp[ally.id], undefined);
});

test('all company fighters falling is defeat even while militia still stands', () => {
  const state = createGame(906);
  accept(state, 'rescue');
  const encounter = getQuestEncounter(state);
  state.position = { x: encounter.x, y: encounter.y };
  startBattle(state, encounter.id);
  const battle = state.battle;
  for (const unit of battle.units.filter(unit => unit.side === 'company' && !unit.ally)) Object.assign(unit, { hp: 0, alive: false });
  const ally = questAllies(battle)[0];
  battle.turnIndex = battle.turnOrder.indexOf(ally.id);
  battle.activeId = ally.id;
  advanceBattle(state);
  assert.equal(battle.status, 'defeat');
  assert.ok(questAllies(battle).some(unit => unit.alive));
  assert.ok(battle.casualties.every(id => !id.startsWith('ally-')));
  assert.deepEqual(validateSave(state), state);
  finishBattle(state);
  assert.equal(state.gameOver, true);
});
