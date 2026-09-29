import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getMarket, getPurchaseQuote, buyAll, buyItem, buyFood, sellItem, createFamedItemId, validateSave, activateMapTarget, getCampSites, getRoamingBands, SETTLEMENTS, tick, travelTo } from '../src/engine.js';

function quietBands(state, except = null) {
  for (const [id, progress] of Object.entries(state.bands)) if (id !== except) progress.defeatedUntil = 48;
}

function trader() {
  const state = createGame(7391);
  assert.equal(buyFood(state, 1).ok, true);
  state.gold = 100000;
  return state;
}

test('buy all respects stock and crowns, removes exactly those copies, and roundtrips', () => {
  const state = trader(), id = 'bandages';
  state.marketStock.oakwatch.equipment[id] = 7;
  const offer = getMarket(state).equipment.find(row => row.itemId === id);
  state.gold = offer.buyPrice * 3 + 1;
  assert.deepEqual(getPurchaseQuote(state, 'equipment', id), { quantity: 3, cost: offer.buyPrice * 3 });
  assert.equal(buyAll(state, 'equipment', id).ok, true);
  assert.equal(state.gold, 1);
  assert.equal(state.inventory.filter(item => item === id).length, 3);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === id).stock, 4);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
  state.gold = 100000;
  assert.equal(buyAll(state, 'equipment', id).ok, true);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === id).stock, 0);
});

test('buy all honors each storage limit and can buy a whole 100-unit supply stock', () => {
  const state = trader();
  state.inventory = Array(511).fill('buckler'); state.inventoryCondition = Array(511).fill(null);
  state.marketStock.oakwatch.equipment.bandages = 5;
  assert.equal(getPurchaseQuote(state, 'equipment', 'bandages').quantity, 1);
  assert.equal(buyAll(state, 'equipment', 'bandages').ok, true);
  assert.equal(state.inventory.length, 512);
  state.cargo = { timber: 29 }; state.marketStock.oakwatch.goods.grain = 5;
  assert.equal(buyAll(state, 'goods', 'grain').ok, true);
  assert.equal(state.cargo.grain, 1);
  state.supplies.tools = 9998; state.marketStock.oakwatch.supplies.tools = 100;
  assert.equal(buyAll(state, 'supplies', 'tools').ok, true);
  assert.equal(state.supplies.tools, 10000);
  state.supplies.ammo = 0; state.marketStock.oakwatch.supplies.ammo = 100;
  assert.equal(buyAll(state, 'supplies', 'ammo').ok, true);
  assert.equal(state.supplies.ammo, 100);
  state.food = 999999999; state.marketStock.oakwatch.food = 100;
  assert.equal(buyAll(state, 'food').ok, true);
  assert.equal(state.food, 1000000000);
  validateSave(state);
});

test('bulk famed buyback preserves each individual armor condition', () => {
  const state = trader(), id = createFamedItemId('mail-shirt', 321);
  state.inventory.push(id, id); state.inventoryCondition.push(11, 37);
  assert.equal(sellItem(state, id).ok, true); assert.equal(sellItem(state, id).ok, true);
  assert.equal(buyAll(state, 'equipment', id).ok, true);
  assert.deepEqual(state.inventoryCondition.slice(-2), [11, 37]);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === id).stock, 0);
  validateSave(state);
});

test('invalid or impossible purchases never partially mutate the campaign', () => {
  const state = trader();
  for (const args of [['bad', 'bad'], ['equipment', 'bad'], ['goods', 'bad'], ['supplies', 'bad']]) {
    const before = structuredClone(state);
    assert.equal(buyAll(state, ...args).ok, false); assert.deepEqual(state, before);
  }
  for (const quantity of [0, -1, 1.5, 513]) {
    const before = structuredClone(state);
    assert.equal(buyItem(state, 'bandages', quantity).ok, false); assert.deepEqual(state, before);
  }
  state.gold = 0;
  const before = structuredClone(state);
  assert.equal(buyAll(state, 'food').ok, false); assert.deepEqual(state, before);
});

test('town activation opens locally or travels and opens once after saved arrival', () => {
  let state = createGame(7391);
  quietBands(state);
  assert.equal(activateMapTarget(state, 'town', 'oakwatch').openTown, 'oakwatch');
  assert.equal(activateMapTarget(state, 'town', 'greyhaven').ok, true);
  assert.deepEqual(state.destinationAction, { type: 'town', id: 'greyhaven' });
  state = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(tick(state, 72).openTown, 'greyhaven');
  assert.equal(state.destination, null); assert.equal(state.destinationAction, null);
  assert.equal(tick(state, .1).openTown, undefined);
});

test('camp activation attacks nearby or travels directly into combat without a preview', () => {
  for (const nearby of [true, false]) {
    let state = createGame(7391), camp = getCampSites(state)[0];
    quietBands(state);
    if (nearby) state.position = { x: camp.x, y: camp.y };
    assert.equal(activateMapTarget(state, 'camp', camp.id).ok, true);
    if (!nearby) { assert.equal(state.battle, null); state = validateSave(JSON.parse(JSON.stringify(state))); tick(state, 72); }
    assert.equal(state.battle.campId, camp.id);
    assert.equal(state.destinationAction, null); assert.equal(state.destination, null);
    validateSave(state);
  }
});

test('band activation pursues the moving target and new travel cancels queued camp action', () => {
  const state = createGame(7391), camp = getCampSites(state)[0];
  quietBands(state);
  activateMapTarget(state, 'camp', camp.id);
  const target = SETTLEMENTS.find(town => town.id === 'greyhaven');
  travelTo(state, target.x, target.y);
  assert.equal(state.destinationAction, null);
  state.bands['road-thieves'].defeatedUntil = 0;
  const band = getRoamingBands(state)[0];
  activateMapTarget(state, 'band', band.id);
  if (!state.battle) { assert.equal(state.pursuit, band.id); tick(state, 72); }
  assert.equal(state.battle.campId, band.id);
  validateSave(state);
});

test('saved arrival actions reject mismatched destinations and legacy saves default to none', () => {
  const state = createGame(7391); delete state.destinationAction;
  assert.equal(validateSave(state).destinationAction, null);
  activateMapTarget(state, 'camp', getCampSites(state)[0].id);
  state.destination.x += 1;
  assert.throws(() => validateSave(state), /destination action target/);
});
