import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FRONTIER_ITEMS } from '../src/frontier-items.js';
import { buyItem, createGame, equipItem, getCompanyStats, getItem, getMarket, getRoamingBands, SETTLEMENTS, startBattle, terrainAt, validateSave } from '../src/engine.js';
import { itemImage, portraitHTML } from '../src/portraits.js';
import { shipmentPlan, routeSegmentDistance } from '../src/caravans.js';

const ids = new Set(FRONTIER_ITEMS.map(item => item.id));
const newTowns = SETTLEMENTS.slice(16,20);

test('three matching frontier sets render, equip, and persist ordinary and famed condition', () => {
  assert.equal(ids.size, 6);
  for (const base of FRONTIER_ITEMS) for (const id of [base.id, `famed:${base.id}:12345`]) {
    const item = getItem(id);
    assert.ok(readFileSync(new URL(`../${itemImage(item)}`, import.meta.url)).length);
    assert.match(portraitHTML({ seed: 3, name: 'Scout' }, { [item.slot]: item }), /assets\/portraits\//);
    const state = createGame(41);
    state.inventory.push(id);
    state.inventoryCondition.push(item.armor - 7);
    assert.equal(equipItem(state, state.party[0].id, id).ok, true);
    assert.equal(state.party[0].armorDurability[item.slot === 'armor' ? 'body' : 'head'], item.armor - 7);
    assert.equal(getCompanyStats(state.party[0])[item.slot === 'armor' ? 'maxBodyArmor' : 'maxHeadArmor'], item.armor);
    assert.deepEqual(validateSave(validateSave(state)), state);
  }
});

test('old markets and missing frontier patrols migrate once without replenishing purchases or changing battles', () => {
  const old = createGame(42);
  const offer = getMarket(old, 'oakwatch').equipment.find(row => row.stock > 0);
  assert.equal(buyItem(old, offer.itemId).ok, true);
  old.position = { x: 440, y: 520 };
  assert.equal(startBattle(old, 'quarry-camp').ok, true);
  for (const item of FRONTIER_ITEMS) delete old.marketStock.oakwatch.equipment[item.id];
  for (const town of newTowns) delete old.bands[`${town.id}-raiders`];
  old.marketStock.oakwatch.equipment['patched-coat'] = 0;
  const before = structuredClone(old);
  const migrated = validateSave(old);
  assert.deepEqual(old, before, 'import does not mutate source');
  assert.deepEqual(migrated.battle, old.battle);
  assert.equal(migrated.marketStock.oakwatch.equipment['patched-coat'], 0);
  assert.equal(Object.keys(migrated.bands).length, 56);
  for (const item of FRONTIER_ITEMS) assert.ok(Number.isInteger(migrated.marketStock.oakwatch.equipment[item.id]));
  assert.deepEqual(validateSave(migrated), migrated);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(migrated))), migrated);
});

test('eastern settlements have finite markets and patrol coverage on every shipment road', () => {
  const state = createGame(43);
  const bands = getRoamingBands(state);
  for (const town of newTowns) {
    assert.notEqual(terrainAt(town.x, town.y), 'sea');
    state.position = { x: town.x, y: town.y };
    const snapshot = structuredClone(state);
    const market = getMarket(state, town.id);
    assert.ok(market.equipment.every(row => Number.isFinite(row.stock) && Number.isFinite(row.buyPrice)));
    assert.deepEqual(state, snapshot, 'market projections do not mutate campaign');
    const plan = shipmentPlan(town, SETTLEMENTS, { startDay: 1 });
    const origin = SETTLEMENTS.find(row => row.id === plan.originId);
    assert.ok(bands.some(band => routeSegmentDistance(origin, town, band, band) <= 120), town.id);
  }
});
