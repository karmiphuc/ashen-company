import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SETTLEMENTS, WORLD_BOUNDS, createGame, getCampSites, getRoamingBands,
  getMarket, townAt, travelTo, tick, startBattle, resolveBattle, finishBattle,
  acceptContract, huntComplete, validateSave,
} from '../src/engine.js';
import { findOffer } from './helpers/contract-offers.js';

const hours = state => (state.day - 1) * 24 + state.hour;
const campById = (state, id) => getCampSites(state).find(camp => camp.id === id);

function passHours(state, amount) {
  while (amount > 0) {
    const current = hours(state);
    for (const progress of Object.values(state.bands)) progress.defeatedUntil = Math.max(progress.defeatedUntil, current + 48);
    const step = Math.min(amount, 48);
    assert.equal(tick(state, step).ok, true);
    amount -= step;
  }
}

function defeatCamp(state, id) {
  const camp = campById(state, id);
  assert.ok(camp, `camp ${id} exists`);
  state.position = { x: camp.x, y: camp.y };
  state.destination = null;
  state.pursuit = null;
  assert.equal(startBattle(state, id).ok, true);
  // This fixture tests camp cooldowns rather than starter-company combat balance.
  for (const unit of state.battle.units.filter(unit => unit.side === 'enemy')) {
    unit.hp = 1;
    unit.armor = 0;
    unit.headArmor = 0;
  }
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(state.battle.status, 'victory');
  assert.equal(finishBattle(state).ok, true);
}

function reachTown(state, town) {
  if (townAt(state)?.id === town.id) return;
  const until = hours(state) + 48;
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = until;
  assert.equal(travelTo(state, town.x, town.y).ok, true);
  for (let step = 0; state.destination && step < 32; step++) {
    for (const progress of Object.values(state.bands)) progress.defeatedUntil = hours(state) + 48;
    assert.equal(tick(state, 12).ok, true);
  }
  assert.equal(state.destination, null, `${town.name} is reachable`);
  assert.equal(townAt(state)?.id, town.id);
}

test('expanded map bounds contain all 48 reachable towns and have market rows', () => {
  assert.equal(SETTLEMENTS.length, 48);
  const bounds = WORLD_BOUNDS;
  for (const town of SETTLEMENTS) {
    assert.ok(town.x >= bounds.minX && town.x <= bounds.maxX, `${town.id} x is in bounds`);
    assert.ok(town.y >= bounds.minY && town.y <= bounds.maxY, `${town.id} y is in bounds`);
    const marketState = createGame(811);
    marketState.position = { x: town.x, y: town.y };
    const market = getMarket(marketState, town.id);
    assert.equal(market?.town.id, town.id, `${town.id} resolves its own market`);
    assert.ok(market.goods.every(good => Number.isFinite(good.buyPrice) && good.buyPrice > 0), `${town.id} has goods prices`);
    assert.ok(market.equipment.every(item => Number.isFinite(item.buyPrice) && item.buyPrice > 0), `${town.id} has gear prices`);

    const travelState = createGame(812);
    reachTown(travelState, town);
  }

  const edgeState = createGame(813);
  assert.equal(travelTo(edgeState, bounds.maxX + 1, bounds.maxY).ok, false);
  assert.equal(travelTo(edgeState, bounds.minX, bounds.minY).ok, true);
  assert.deepEqual(validateSave(edgeState), edgeState);
});

test('fifty-six roaming bands preserve four nearby light patrols and cover the new trade roads', () => {
  const bands = getRoamingBands(createGame(814));
  assert.equal(bands.length, 56);
  const legacyIds = ['road-thieves', 'hungry-deserters', 'forest-cutthroats', 'river-raiders'];
  const legacy = bands.filter(band => legacyIds.includes(band.id));
  const frontier = bands.filter(band => !legacyIds.includes(band.id));
  assert.equal(legacy.length, 4);
  assert.ok(legacy.every(band => band.difficulty === 0 && band.enemies.length <= 2));
  assert.equal(frontier.length, 52);
  assert.ok(frontier.every(band => band.difficulty >= 1 && band.enemies.length >= 2));
  for (const band of bands) {
    assert.ok(band.x >= WORLD_BOUNDS.minX && band.x <= WORLD_BOUNDS.maxX, `${band.id} x is in bounds`);
    assert.ok(band.y >= WORLD_BOUNDS.minY && band.y <= WORLD_BOUNDS.maxY, `${band.id} y is in bounds`);
  }
});

test('fixed and seeded camps reopen at the exact cooldown boundary', () => {
  for (const id of ['quarry-camp', 'wild-camp-1']) {
    const state = createGame(815);
    const initial = campById(state, id);
    assert.equal(initial.generation, 0);
    assert.equal(initial.cleared, false);
    defeatCamp(state, id);
    const defeatedAt = hours(state);
    const cooldown = initial.random ? 72 : 120;
    const defeated = campById(state, id);
    assert.equal(defeated.cleared, true);
    assert.equal(defeated.respawnHours, cooldown);
    assert.equal(defeated.generation, 0);
    assert.equal(startBattle(state, id).ok, false);

    passHours(state, cooldown - 1);
    assert.equal(campById(state, id).cleared, true);
    assert.equal(campById(state, id).respawnHours, 1);
    assert.equal(startBattle(state, id).ok, false);
    passHours(state, 1);
    const respawned = campById(state, id);
    assert.equal(respawned.cleared, false);
    assert.equal(respawned.respawnHours, 0);
    assert.equal(respawned.generation, 1);
    assert.equal(hours(state), defeatedAt + cooldown);
    state.position = { x: respawned.x, y: respawned.y };
    assert.equal(startBattle(state, id).ok, true);
  }
});

test('seeded camp offers regenerate deterministically by generation and do not mutate saves on read', () => {
  const state = createGame(816);
  const seeded = getCampSites(state).filter(camp => camp.random);
  assert.equal(seeded.length, 36);
  const first = seeded[0];
  const before = structuredClone(first);
  state.camps[first.id] = { clearedDay: 1, respawnAt: hours(state), generation: 0 };
  const campsBeforeRead = structuredClone(state.camps);
  const next = campById(state, first.id);
  assert.equal(next.generation, 1);
  assert.equal(next.cleared, false);
  assert.notDeepEqual({ x: next.x, y: next.y, difficulty: next.difficulty, enemies: next.enemies },
    { x: before.x, y: before.y, difficulty: before.difficulty, enemies: before.enemies });
  assert.ok(next.x >= WORLD_BOUNDS.minX && next.x <= WORLD_BOUNDS.maxX);
  assert.ok(next.y >= WORLD_BOUNDS.minY && next.y <= WORLD_BOUNDS.maxY);
  assert.deepEqual(state.camps, campsBeforeRead, 'reading an expired camp does not rewrite its progress record');

  const reloaded = validateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(campById(reloaded, first.id), next);
  assert.deepEqual(validateSave(reloaded), reloaded);
});

test('a hunt stays complete after respawn, while a new-generation hunt needs a new defeat', () => {
  const state = createGame(817);
  const offer = findOffer(state, 'hunt');
  assert.equal(acceptContract(state, 'oakwatch', offer.id).ok, true);
  const contract = structuredClone(state.contract);
  assert.equal(contract.campGeneration, campById(state, contract.campId).generation);

  defeatCamp(state, contract.campId);
  assert.equal(huntComplete(state, contract), true);
  const cooldown = campById(state, contract.campId).respawnHours;
  passHours(state, cooldown);
  const activeAgain = campById(state, contract.campId);
  assert.equal(activeAgain.cleared, false);
  assert.equal(activeAgain.generation, contract.campGeneration + 1);
  assert.equal(huntComplete(state, contract), true, 'the accepted hunt retains its proof after the camp returns');
  assert.equal(huntComplete(state, {
    ...contract,
    acceptedDay: state.day,
    campGeneration: activeAgain.generation,
  }), false, 'a new-generation hunt cannot reuse an older defeat');

  const reloaded = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(huntComplete(reloaded), true);
  assert.deepEqual(reloaded.contract, state.contract);
});

test('camp progress stays bounded through generations and legacy cleared camps migrate', () => {
  const state = createGame(818);
  for (let generation = 0; generation < 5; generation++) {
    state.camps['quarry-camp'] = {
      clearedDay: 1,
      respawnAt: hours(state),
      generation,
    };
    const active = campById(state, 'quarry-camp');
    assert.equal(active.generation, generation + 1);
    assert.equal(active.cleared, false);
  }
  assert.deepEqual(Object.keys(state.camps), ['quarry-camp']);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);

  const oldSave = createGame(819);
  oldSave.day = 3;
  oldSave.hour = 8;
  oldSave.camps = { 'quarry-camp': { clearedDay: 2 } };
  const migrated = validateSave(oldSave);
  assert.equal(migrated.camps['quarry-camp'].clearedDay, 2);
  assert.equal(migrated.camps['quarry-camp'].generation, 0);
  assert.equal(campById(migrated, 'quarry-camp').cleared, true);
  assert.ok(migrated.camps['quarry-camp'].respawnAt > hours(migrated));
  assert.deepEqual(validateSave(migrated), migrated);
});
