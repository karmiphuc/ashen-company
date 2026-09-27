import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, getRoamingBands, getEncounterSites, getCampSites, pursueBand,
  travelTo, tick, camp, forage, startBattle, advanceBattle, resolveBattle,
  finishBattle, getCompanyStats, validateSave,
} from '../src/engine.js';

function catchBand(state, id) {
  assert.equal(pursueBand(state, id).ok, true);
  for (let step = 0; step < 12 && state.destination; step++) tick(state, 12);
  assert.equal(state.destination, null);
  assert.equal(state.pursuit, null);
  assert.equal(state.battle?.campId, id, 'catching a patrol starts its battle');
  assert.ok(getRoamingBands(state).some(band => band.id === id));
}

function approachCamp(state) {
  const site = getCampSites(state)[0];
  assert.equal(travelTo(state, site.x, site.y).ok, true);
  for (let step = 0; step < 12 && state.destination; step++) tick(state, 12);
  assert.equal(state.destination, null);
  return site;
}

test('eight visible patrols move with time and can be intercepted', () => {
  const state = createGame(1);
  const first = getRoamingBands(state);
  assert.equal(first.length, 8);
  const originalIds = ['road-thieves', 'hungry-deserters', 'forest-cutthroats', 'river-raiders'];
  const original = first.filter(band => originalIds.includes(band.id));
  const frontier = first.filter(band => !originalIds.includes(band.id));
  assert.equal(original.length, 4);
  assert.equal(original.filter(band => Math.hypot(band.x - 350, band.y - 460) < 140).length, 2);
  assert.ok(original.every(band => band.kind === 'band' && band.difficulty === 0 && band.enemies.length <= 2));
  assert.equal(frontier.length, 4);
  assert.ok(frontier.every(band => band.kind === 'band' && band.difficulty >= 1 && band.enemies.length >= 2));
  assert.equal(getEncounterSites(state).length, getCampSites(state).length + first.length);
  tick(state, 1);
  const moved = getRoamingBands(state);
  assert.ok(moved.some((band, index) => band.x !== first[index].x || band.y !== first[index].y));
  catchBand(state, 'road-thieves');
  const band = getRoamingBands(state).find(entry => entry.id === 'road-thieves');
  assert.ok(Math.hypot(state.position.x - band.x, state.position.y - band.y) <= 28);
  assert.deepEqual(validateSave(state), state);
});

test('bands give renewable fights, shared experience, and leave hunts untouched', () => {
  const state = createGame(2);
  const campState = structuredClone(state.camps);
  for (const id of ['road-thieves', 'hungry-deserters']) {
    catchBand(state, id);
    assert.equal(state.battle.encounterType, 'band');
    assert.equal(advanceBattle(state).ok, true);
    const restored = validateSave(JSON.parse(JSON.stringify(state)));
    assert.deepEqual(restored, state);
    assert.equal(resolveBattle(restored).ok, true);
    assert.equal(resolveBattle(state).ok, true);
    assert.deepEqual(state.battle, restored.battle);
    assert.equal(state.battle.status, 'victory');
    assert.equal(finishBattle(state).ok, true);
    const paidGold = state.gold;
    assert.equal(finishBattle(state).ok, false);
    assert.equal(state.gold, paidGold);
    assert.equal(getRoamingBands(state).some(band => band.id === id), false);
    camp(state);
  }
  assert.deepEqual(state.camps, campState);
  assert.ok(state.party.every(person => getCompanyStats(person).level >= 2));
  assert.deepEqual(validateSave(state), state);
  const defeatedUntil = state.bands['road-thieves'].defeatedUntil;
  while ((state.day - 1) * 24 + state.hour < defeatedUntil) tick(state, 12);
  assert.ok(getRoamingBands(state).some(band => band.id === 'road-thieves'));
});

test('resting and foraging advance patrols while a pursuit remains saveable', () => {
  const state = createGame(3);
  assert.equal(pursueBand(state, 'hungry-deserters').ok, true);
  const initial = getRoamingBands(state).find(band => band.id === state.pursuit);
  camp(state);
  const afterCamp = getRoamingBands(state).find(band => band.id === state.pursuit);
  assert.notDeepEqual({ x: afterCamp.x, y: afterCamp.y }, { x: initial.x, y: initial.y });
  assert.deepEqual(state.destination, { x: afterCamp.x, y: afterCamp.y });
  forage(state);
  assert.deepEqual(validateSave(state), state);
  assert.equal(travelTo(state, 495, 305).ok, true);
  assert.equal(state.pursuit, null);
});

test('melee routing passes around allies instead of stalling on equal-distance detours', () => {
  const state = createGame(10);
  const site = approachCamp(state);
  startBattle(state, site.id);
  const byId = id => state.battle.units.find(unit => unit.id === id);
  Object.assign(byId('captain'), { q: 2, r: 2 });
  Object.assign(byId('scout'), { q: 3, r: 2 });
  Object.assign(byId('guard'), { q: 3, r: 1 });
  Object.assign(byId('enemy-1'), { q: 5, r: 2 });
  Object.assign(byId('enemy-2'), { q: 8, r: 0 });
  Object.assign(byId('enemy-3'), { q: 8, r: 4 });
  state.battle.turnIndex = state.battle.turnOrder.indexOf('captain');
  state.battle.activeId = 'captain';
  assert.equal(advanceBattle(state).ok, true);
  assert.notDeepEqual([byId('captain').q, byId('captain').r], [2, 2]);
  assert.deepEqual(validateSave(state), state);
});

test('archers finish exposed foes while melee fighters hold adjacent enemies', () => {
  const state = createGame(11);
  state.party[0].equipment.weapon = 'hunting-bow';
  state.party[0].equipment.shield = null;
  const site = approachCamp(state);
  startBattle(state, site.id);
  const byId = id => state.battle.units.find(unit => unit.id === id);
  Object.assign(byId('captain'), { q: 2, r: 2 });
  Object.assign(byId('enemy-1'), { q: 4, r: 2, hp: 32, bodyArmor: 20 });
  Object.assign(byId('enemy-2'), { q: 6, r: 2, hp: 7, bodyArmor: 0 });
  state.battle.turnIndex = state.battle.turnOrder.indexOf('captain');
  state.battle.activeId = 'captain';
  advanceBattle(state);
  assert.equal(state.battle.lastEvent.targetId, 'enemy-2');

  const melee = createGame(11);
  const meleeSite = approachCamp(melee);
  startBattle(melee, meleeSite.id);
  const fighter = melee.battle.units.find(unit => unit.id === 'captain');
  const close = melee.battle.units.find(unit => unit.id === 'enemy-1');
  const wounded = melee.battle.units.find(unit => unit.id === 'enemy-2');
  Object.assign(fighter, { q: 2, r: 2 });
  Object.assign(close, { q: 3, r: 2, hp: 32 });
  Object.assign(wounded, { q: 4, r: 2, hp: 1 });
  melee.battle.turnIndex = melee.battle.turnOrder.indexOf('captain');
  melee.battle.activeId = 'captain';
  advanceBattle(melee);
  assert.equal(melee.battle.lastEvent.targetId, 'enemy-1');
});

test('archers step out of melee, empty quivers switch to melee, and exhaustion recovers', () => {
  const state = createGame(12);
  state.party[0].equipment.weapon = 'hunting-bow';
  state.party[0].equipment.shield = null;
  const site = approachCamp(state);
  startBattle(state, site.id);
  const fighter = state.battle.units.find(unit => unit.id === 'captain');
  const enemy = state.battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(fighter, { q: 2, r: 2 });
  Object.assign(enemy, { q: 3, r: 2 });
  state.battle.turnIndex = state.battle.turnOrder.indexOf('captain');
  state.battle.activeId = 'captain';
  advanceBattle(state);
  assert.ok(Math.abs(fighter.q - enemy.q) + Math.abs(fighter.r - enemy.r) > 1);

  state.supplies.ammo = 0;
  Object.assign(fighter, { q: 2, r: 2, fatigue: 0 });
  Object.assign(enemy, { q: 3, r: 2 });
  state.battle.turnIndex = state.battle.turnOrder.indexOf('captain');
  state.battle.activeId = 'captain';
  advanceBattle(state);
  assert.equal(state.supplies.ammo, 0);
  assert.equal(state.battle.lastEvent.targetId, 'enemy-1');

  fighter.fatigue = fighter.maxFatigue;
  state.battle.turnIndex = state.battle.turnOrder.indexOf('captain');
  state.battle.activeId = 'captain';
  advanceBattle(state);
  assert.equal(state.battle.lastEvent.type, 'recover');
  assert.ok(fighter.fatigue < fighter.maxFatigue);
});

test('old saves migrate and malformed pursuit or band records are rejected', () => {
  const old = createGame(4);
  delete old.bands;
  delete old.pursuit;
  assert.deepEqual(validateSave(old).bands, {});
  assert.equal(validateSave(old).pursuit, null);
  const state = createGame(4);
  for (const change of [
    save => { save.pursuit = 'missing'; },
    save => { save.bands.fake = { defeatedUntil: 5 }; },
    save => { save.bands['road-thieves'] = { defeatedUntil: -1 }; },
    save => { save.bands['road-thieves'] = { defeatedUntil: Infinity }; },
  ]) {
    const bad = structuredClone(state);
    change(bad);
    assert.throws(() => validateSave(bad), /Invalid save/);
  }
});

test('seeded starter fights survive and reach an outcome', () => {
  for (const encounter of ['road-thieves', 'hungry-deserters', 'quarry-camp']) {
    let wins = 0;
    let fullRosters = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const state = createGame(seed);
      if (encounter === 'quarry-camp') approachCamp(state);
      else catchBand(state, encounter);
      if (encounter === 'quarry-camp') assert.equal(startBattle(state, encounter).ok, true);
      else assert.equal(state.battle?.campId, encounter);
      assert.equal(resolveBattle(state).ok, true);
      wins += Number(state.battle.status === 'victory');
      fullRosters += Number(state.battle.units.filter(unit => unit.side === 'company').every(unit => unit.alive));
    }
    assert.equal(wins, 100);
    assert.ok(fullRosters >= (encounter === 'quarry-camp' ? 95 : 99));
  }
});
