import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTLEMENTS, SETTLEMENT_TYPES, createGame, getItem, getMarket, getRecruitOffers, getContractOffers, acceptContract, validateSave } from '../src/engine.js';

test('settlements use three fixed classes with distinct stocks and hiring pools', () => {
  assert.deepEqual(new Set(SETTLEMENTS.map(town => town.kind)), new Set(['town', 'village', 'castle']));
  const totals = Object.fromEntries(Object.keys(SETTLEMENT_TYPES).map(kind => [kind, { count: 0, food: 0, ammo: 0, medicine: 0, premium: 0 }]));
  for (let seed = 1; seed <= 20; seed++) for (const town of SETTLEMENTS) {
    const state = createGame(seed);
    state.position = { x: town.x, y: town.y };
    const market = getMarket(state), tally = totals[town.kind];
    if (market.event) continue;
    tally.count++;
    tally.food += market.food.stock;
    tally.ammo += market.supplies.find(row => row.kind === 'ammo').stock;
    tally.medicine += market.supplies.find(row => row.kind === 'medicine').stock;
    tally.premium += market.equipment.filter(row => row.stock && getItem(row.itemId).price >= 450).length;
    assert.equal(getRecruitOffers(state).length, SETTLEMENT_TYPES[town.kind].hires);
    assert.ok(market.armory.summary.includes(SETTLEMENT_TYPES[town.kind].summary));
  }
  const average = (kind, field) => totals[kind][field] / totals[kind].count;
  assert.ok(average('village', 'food') > average('town', 'food'));
  assert.ok(average('castle', 'ammo') > average('town', 'ammo'));
  assert.ok(average('town', 'medicine') > average('village', 'medicine'));
  assert.ok(average('village','premium')<average('town','premium'),'occasional village smiths have fewer premium designs than cities');
  assert.ok(average('castle', 'premium') > average('town', 'premium'));
});

test('quest boards offer one to three stable jobs, vary locally, and retain accepted terms', () => {
  const counts = new Set(), types = new Set();
  for (let seed = 1; seed <= 30; seed++) for (const town of SETTLEMENTS) {
    const state = createGame(seed);
    state.position = { x: town.x, y: town.y };
    const before = structuredClone(state), offers = getContractOffers(state, town.id);
    assert.ok(offers.length >= 1 && offers.length <= 3);
    assert.equal(new Set(offers.map(offer => offer.type)).size, offers.length);
    assert.deepEqual(getContractOffers(state, town.id), offers);
    assert.deepEqual(state, before);
    counts.add(offers.length);
    offers.forEach(offer => types.add(offer.type));
    if (seed === 1) {
      assert.equal(acceptContract(state, town.id, offers[0].id).ok, true);
      assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))).contract, state.contract);
    }
  }
  assert.deepEqual(counts, new Set([1, 2, 3]));
  assert.deepEqual(types, new Set(['courier', 'supply', 'hunt', 'assault', 'rescue', 'deserters', 'bounty']));
});
