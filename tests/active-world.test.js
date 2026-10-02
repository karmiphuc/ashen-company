import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SETTLEMENTS, camp, createGame, finishBattle, forage, getCaravans, getRoamingBands,
  equipItem, pursueBand, resolveBattle, retreatBattle, terrainAt, tick, travelTo, validateSave,
} from '../src/engine.js';

const now = state => (state.day - 1) * 24 + state.hour;

function isolateBand(state, id) {
  for (const [bandId, progress] of Object.entries(state.bands)) {
    if (bandId !== id) progress.defeatedUntil = now(state) + 48;
  }
  return state.bands[id];
}

function placeCompanyAndBand(state, id, company, band) {
  const progress = isolateBand(state, id);
  state.position = { ...company };
  state.destination = null;
  state.destinationAction = null;
  state.pursuit = null;
  Object.assign(progress, { ...band, defeatedUntil: 0, behavior: 'patrolling', targetId: null });
  return progress;
}

test('the overworld has 56 persistent patrols with four weak starters and varied frontier specialists', () => {
  const state = createGame(91);
  const bands = getRoamingBands(state);
  assert.equal(bands.length, 56);
  const starters = ['road-thieves', 'hungry-deserters', 'forest-cutthroats', 'river-raiders'];
  assert.ok(starters.every(id => bands.find(band => band.id === id)?.difficulty === 0));
  assert.ok(bands.filter(band => band.difficulty === 3).every(band => band.enemies.length >= 4 && band.enemies.length <= 6));
  const frontierWeapons = new Set(bands.filter(band => band.difficulty > 0).flatMap(band => band.enemies.map(enemy => enemy.weapon)));
  assert.ok(frontierWeapons.size >= 8, 'frontier forces use varied regional weapons');
  assert.ok(bands.filter(band => band.difficulty > 0).some(band => band.enemies.some(enemy => enemy.name.includes('Nomad'))));
  assert.ok(bands.every(band => band.behavior === 'patrolling' || band.behavior === 'raiding-caravan'));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('raiders naturally hunt and contact the company, while settlements are sanctuaries', () => {
  const state = createGame(1);
  const id = 'road-thieves';
  const progress = placeCompanyAndBand(state, id, { x: 800, y: 800 }, { x: 835, y: 800 });
  assert.equal(tick(state, .25).ok, true);
  assert.equal(state.battle?.campId, id);
  assert.equal(progress.behavior, 'hunting-company');

  const safe = createGame(1);
  const oakwatch = SETTLEMENTS.find(town => town.id === 'oakwatch');
  const safeBand = placeCompanyAndBand(safe, id, oakwatch, { x: oakwatch.x + 30, y: oakwatch.y });
  safeBand.behavior = 'hunting-company';
  assert.equal(tick(safe, .5).ok, true);
  assert.equal(safe.battle, null);
  assert.equal(getRoamingBands(safe).find(band => band.id === id).behavior, 'patrolling');
});

test('band chase speed stays five percent above local terrain pace across campaign stages', () => {
  for (const scenario of [
    { id: 'road-thieves', day: 1, difficulty: 0, company: { x: 300, y: 800 }, hunter: { x: 220, y: 800 }, terrain: 'plains', factor: 1 },
    { id: 'frontier-veterans', day: 100, difficulty: 3, company: { x: 475, y: 445 }, hunter: { x: 395, y: 445 }, terrain: 'forest', factor: .64 },
  ]) {
    const state = createGame(1);
    state.day = scenario.day;
    const hunter = placeCompanyAndBand(state, scenario.id, scenario.company, scenario.hunter);
    hunter.behavior = 'hunting-company';
    assert.equal(terrainAt(hunter.x, hunter.y), scenario.terrain);
    assert.equal(getRoamingBands(state).find(band => band.id === scenario.id).difficulty, scenario.difficulty);
    const before = Math.hypot(state.position.x - hunter.x, state.position.y - hunter.y);

    assert.equal(tick(state, .25).ok, true);

    const after = Math.hypot(state.position.x - hunter.x, state.position.y - hunter.y);
    const expectedStep = 55 * scenario.factor * 1.05 * .25;
    assert.ok(Math.abs(before - after - expectedStep) < 1e-9, `${scenario.id} on day ${scenario.day}`);
  }
});

test('a mounted company can pull away from slightly faster hunters and quarter-hour AI is frame partition independent', () => {
  const escaping = createGame(1);
  const id = 'road-thieves';
  const hunter = placeCompanyAndBand(escaping, id, { x: 300, y: 800 }, { x: 220, y: 800 });
  hunter.behavior = 'hunting-company';
  escaping.inventory.push('riding-horse');
  escaping.inventoryCondition.push(null);
  assert.equal(equipItem(escaping, 'captain', 'riding-horse').ok, true);
  const before = Math.hypot(escaping.position.x - hunter.x, escaping.position.y - hunter.y);
  assert.equal(travelTo(escaping, 600, 800).ok, true);
  assert.equal(tick(escaping, 1).ok, true);
  const after = Math.hypot(escaping.position.x - hunter.x, escaping.position.y - hunter.y);
  assert.ok(after > before, `expected ${after} to exceed ${before}`);
  assert.equal(escaping.battle, null);

  const whole = createGame(1);
  const framed = createGame(1);
  assert.equal(tick(whole, 1).ok, true);
  for (let frame = 0; frame < 140; frame++) assert.equal(tick(framed, 1 / 140).ok, true);
  for (const band of getRoamingBands(whole)) {
    const other = getRoamingBands(framed).find(entry => entry.id === band.id);
    assert.ok(Math.abs(band.x - other.x) < 1e-7 && Math.abs(band.y - other.y) < 1e-7, band.id);
    assert.equal(other.behavior, band.behavior);
  }

  const caravanWhole = createGame(2);
  const caravanFrames = createGame(2);
  assert.equal(tick(caravanWhole, 8).ok, true);
  for (let frame = 0; frame < 1120; frame++) assert.equal(tick(caravanFrames, 1 / 140).ok, true);
  assert.deepEqual(caravanFrames.shipments, caravanWhole.shipments);
  for (const band of getRoamingBands(caravanWhole)) {
    const other = getRoamingBands(caravanFrames).find(entry => entry.id === band.id);
    assert.ok(Math.abs(band.x - other.x) < 1e-7 && Math.abs(band.y - other.y) < 1e-7, `caravan ${band.id}`);
    assert.deepEqual([other.behavior, other.targetId], [band.behavior, band.targetId]);
  }
});

test('camp and forage stop on an attack without granting completion rewards, and retreat grants escape grace', () => {
  for (const action of [camp, forage]) {
    const state = createGame(1);
    const id = 'road-thieves';
    placeCompanyAndBand(state, id, { x: 800, y: 800 }, { x: 860, y: 800 });
    state.party[0].hp = 50;
    const before = { hp: state.party[0].hp, food: state.food, medicine: state.supplies.medicine, tools: state.supplies.tools };
    assert.equal(action(state).ok, true);
    assert.equal(state.battle?.campId, id);
    assert.deepEqual(
      { hp: state.party[0].hp, food: state.food, medicine: state.supplies.medicine, tools: state.supplies.tools },
      before,
    );
    assert.ok(now(state) < 12, 'the action stops before its full duration');
    assert.equal(retreatBattle(state).ok, true);
    assert.equal(finishBattle(state).ok, true);
    assert.ok(state.encounterGraceUntil > now(state));
    assert.equal(tick(state, .25).ok, true);
    assert.equal(state.battle, null);
  }
});

test('caravan raiders physically intercept, warn on contact, lose only after contact grace, and can be cleared once', () => {
  const state = createGame(2);
  let wagon = getCaravans(state).find(entry => entry.id === 'shipment:ironford:1');
  assert.equal(wagon.status, 'en-route');
  assert.equal(wagon.contact, false);
  const raider = getRoamingBands(state).find(band => band.id === wagon.attackerId);
  assert.equal(raider.behavior, 'raiding-caravan');
  assert.equal(raider.targetId, wagon.id);
  const initialDistance = Math.hypot(raider.x - wagon.x, raider.y - wagon.y);
  assert.equal(tick(state, .25).ok, true);
  wagon = getCaravans(state).find(entry => entry.id === wagon.id);
  const movingRaider = getRoamingBands(state).find(band => band.id === wagon.attackerId);
  assert.ok(Math.hypot(movingRaider.x - wagon.x, movingRaider.y - wagon.y) < initialDistance);
  assert.equal(wagon.status, 'en-route');

  assert.equal(tick(state, 7.25).ok, true);
  wagon = getCaravans(state).find(entry => entry.id === wagon.id);
  assert.equal(wagon.status, 'under-attack');
  assert.equal(wagon.contact, true);
  assert.equal(wagon.attackHoursRemaining, 7);

  const loss = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(tick(loss, 7).ok, true);
  const destroyed = getCaravans(loss).find(entry => entry.id === wagon.id);
  assert.equal(destroyed.status, 'lost');
  assert.equal(destroyed.resolvedHour, now(loss));

  const defender = getRoamingBands(state).find(band => band.id === wagon.attackerId);
  state.position = { x: defender.x, y: defender.y };
  assert.equal(pursueBand(state, defender.id).ok, true);
  for (const enemy of state.battle.units.filter(unit => unit.side === 'enemy')) {
    Object.assign(enemy, { hp: 1, bodyArmor: 0, headArmor: 0, morale: 0 });
  }
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(state.battle.status, 'victory');
  assert.equal(finishBattle(state).ok, true);
  assert.equal(state.shipments.ironford.raidCleared, true);
  assert.equal(state.shipments.ironford.attackerId, null);
  assert.equal(tick(state, 20).ok, true);
  assert.equal(state.shipments.ironford.attackerId, null, 'a rescued wagon receives no replacement attacker');
});

test('an out-of-contact wagon escapes at arrival and late renewed contact records the actual loss time', () => {
  const escaped = createGame(16);
  const shipment = escaped.shipments.eastmere;
  shipment.status = 'under-attack';
  shipment.attackHour = 0;
  escaped.day = 3;
  escaped.hour = 11.75;
  Object.assign(escaped.bands[shipment.attackerId], { x: 180, y: 80, behavior: 'raiding-caravan' });
  assert.equal(tick(escaped, .25).ok, true);
  assert.equal(escaped.shipments.eastmere.status, 'delivered');
  assert.equal(escaped.shipments.eastmere.resolvedHour, 60);

  const late = createGame(2);
  const threatened = late.shipments.ironford;
  threatened.status = 'under-attack';
  threatened.attackHour = 8;
  late.hour = 15;
  Object.assign(late.bands[threatened.attackerId], { x: 180, y: 80, behavior: 'raiding-caravan' });
  for (let step = 0; step < 80 && threatened.status !== 'lost'; step++) assert.equal(tick(late, .25).ok, true);
  assert.equal(threatened.status, 'lost');
  assert.ok(threatened.resolvedHour > threatened.attackHour + 7);
  assert.equal(threatened.resolvedHour, now(late));
});
