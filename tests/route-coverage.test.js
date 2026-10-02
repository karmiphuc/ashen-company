import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SETTLEMENTS, createGame, finishBattle, getCaravans, getRoamingBands,
  pursueBand, resolveBattle, tick, validateSave,
} from '../src/engine.js';
import { routeSegmentDistance } from '../src/caravans.js';

const threatenedRoutes = [
  ['ironford', 1, 10, 'barrowfield', 'ironford-extortionists'],
  ['redmere', 2, 8, 'ironford', 'river-raiders'],
  ['blackfen', 6, 2, 'wheatmere', 'wheatmere-pillagers'],
  ['highpass', 7, 2, 'greyhaven', 'greyhaven-rabble'],
  ['oakwatch', 8, 4, 'greyhaven', 'road-thieves'],
  ['dunridge', 8, 2, 'pinecross', 'dunridge-lancers'],
  ['eastmere', 13, 8, 'stonebridge', 'east-road-reavers'],
  ['pinecross', 17, 2, 'thornwall', 'pinecross-deserters'],
  ['wheatmere', 17, 8, 'blackfen', 'blackfen-stalkers'],
  ['thornwall', 21, 8, 'ironford', 'ironford-extortionists'],
  ['barrowfield', 23, 6, 'ironford', 'ironford-extortionists'],
  ['southwatch', 28, 4, 'saltwick', 'southwatch-raiders'],
  ['saltwick', 33, 10, 'oakwatch', 'hungry-deserters'],
  ['stonebridge', 42, 2, 'pinecross', 'pinewood-poachers'],
  ['greyhaven', 43, 12, 'highpass', 'greyhaven-rabble'],
  ['farhold', 57, 12, 'stonebridge', 'stonebridge-tollmen'],
];

function passHours(state, hours) {
  while (hours > 0) {
    const step = Math.min(hours, 72);
    assert.equal(tick(state, step).ok, true);
    hours -= step;
  }
}

test('segment distance handles crossing, parallel, collinear disjoint, and point patrols', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 0 };
  assert.equal(routeSegmentDistance(a, b, { x: 5, y: -5 }, { x: 5, y: 5 }), 0);
  assert.equal(routeSegmentDistance(a, b, { x: 0, y: 3 }, { x: 10, y: 3 }), 3);
  assert.equal(routeSegmentDistance(a, b, { x: 20, y: 0 }, { x: 30, y: 0 }), 10);
  assert.equal(routeSegmentDistance(a, b, { x: 5, y: 5 }, { x: 5, y: 5 }), 5);
});

test('every original settlement shipment route retains its assigned patrol by a nearby persistent patrol', () => {
  assert.deepEqual(new Set(threatenedRoutes.map(row => row[0])), new Set(SETTLEMENTS.slice(0, 16).map(town => town.id)));
  for (const [townId, seed, day, originId, attackerId] of threatenedRoutes) {
    const state = createGame(seed);
    passHours(state, (day - 1) * 24 - 8);
    const wagon = getCaravans(state).find(row => row.destinationId === townId && row.status === 'en-route');
    assert.equal(wagon?.originId, originId, `${townId} uses its intended road`);
    assert.equal(wagon?.attackerId, attackerId, `${townId} has a band able to raid its road`);
    assert.ok(getRoamingBands(state).some(band => band.id === attackerId), `${attackerId} is a visible patrol`);
  }
});

test('a blocked nearest raider makes shipment launch choose another available road band', () => {
  const state = createGame(28);
  passHours(state, 48);
  const band = getRoamingBands(state).find(row => row.id === 'saltmarsh-waylayers');
  state.position = { x: band.x, y: band.y };
  assert.equal(pursueBand(state, band.id).ok, true);
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(state.battle.status, 'victory');
  assert.equal(finishBattle(state).ok, true);
  passHours(state, 24);
  const wagon = getCaravans(state).find(row => row.destinationId === 'southwatch');
  assert.equal(wagon?.attackerId, 'southwatch-raiders');
  assert.notEqual(wagon?.attackerId, band.id);
  assert.equal(state.shipments.southwatch.attackerId, 'southwatch-raiders');
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});
