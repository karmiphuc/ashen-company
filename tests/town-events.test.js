import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, SETTLEMENTS, createGame, createFamedItemId, getTownEvent, getTownEconomy, getMarket,
  getContractOffers, acceptContract, travelTo, tick, buyAll, buyFood, buyGood,
  sellGood, buyItem, sellItem, getPurchaseQuote, validateSave,
} from '../src/engine.js';

function atTown(state, townId) {
  const town = SETTLEMENTS.find(entry => entry.id === townId);
  assert.ok(town);
  state.position = { x: town.x, y: town.y };
  state.destination = null;
}

function advanceTo(state, day) {
  while (state.day < day) assert.equal(tick(state, 24).ok, true);
}

function arrive(state, townId) {
  const town = SETTLEMENTS.find(entry => entry.id === townId);
  assert.equal(travelTo(state, town.x, town.y).ok, true);
  for (let i = 0; i < 12 && state.destination; i++) assert.equal(tick(state, 12).ok, true);
  assert.equal(state.destination, null);
}

function equipmentCounts(market) {
  return Object.fromEntries(market.equipment.filter(row => !row.famed).map(row => [row.itemId, row.stock]));
}

test('town events are deterministic, local, finite, and read without changing a save', () => {
  const state = createGame(7391);
  const events = [];
  for (let day = 1; day <= 40; day++) {
    state.day = day;
    const before = structuredClone(state);
    const overview = getTownEconomy(state);
    assert.deepEqual(state, before);
    assert.deepEqual(overview, getTownEconomy(validateSave(state)));
    for (const town of SETTLEMENTS) {
      const event = getTownEvent(state, town.id);
      assert.deepEqual(event, getTownEvent(validateSave(state), town.id));
      if (event) {
        assert.ok(event.startDay <= day && event.endDay >= day);
        assert.ok(event.daysRemaining >= 1 && event.daysRemaining <= 4);
        assert.ok(event.name && event.description && event.effects.length);
        events.push({ townId: town.id, event });
      }
    }
    assert.deepEqual(state, before);
  }
  assert.ok(events.length > 0);
  const { townId, event } = events.find(entry => entry.event.endDay < 40);
  state.day = event.endDay + 1;
  assert.notEqual(getTownEvent(state, townId)?.id, event.id, 'expired event does not linger');
  assert.equal(getTownEvent(state, 'unknown-town'), null);
});

test('high-end gear is scarce across seeds and read or reload cannot restock a purchase', () => {
  const premium = new Set(ITEMS.filter(item => item.price >= 450).map(item => item.id));
  assert.ok(premium.size > 2);
  const observed = new Set();
  let ordinaryDays = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const state = createGame(seed);
    atTown(state, 'ironford');
    if (getTownEvent(state, 'ironford')) continue;
    ordinaryDays++;
    const available = getMarket(state).equipment.filter(row => premium.has(row.itemId) && row.stock > 0);
    assert.ok(available.length <= 2, 'a city displays a tiny premium selection');
    for (const row of available) observed.add(row.itemId);
  }
  assert.ok(ordinaryDays >= 3);
  assert.ok(observed.size >= 2, 'the premium selection rotates between companies');

  const state = createGame(7391);
  atTown(state, 'oakwatch');
  state.gold = 100000;
  const market = getMarket(state);
  const rare = market.equipment.find(row => premium.has(row.itemId) && row.stock > 0);
  assert.ok(rare, 'a town offers a limited premium item');
  assert.equal(buyItem(state, rare.itemId, rare.stock).ok, true);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === rare.itemId).stock, 0);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === rare.itemId).stock, 0);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(getMarket(restored).equipment.find(row => row.itemId === rare.itemId).stock, 0);
  advanceTo(restored, 2);
  assert.equal(getMarket(restored).equipment.find(row => row.itemId === rare.itemId).stock, 0,
    'the next daily food and trade refresh does not refill the armory');
  assert.ok(getMarket(restored).armory.nextRestockDay > restored.day);
});

test('event market quotes govern single, bulk, and resale transactions without instant profit', () => {
  const state = createGame(7391);
  state.gold = 100000;
  let found = null;
  for (let day = 1; day <= 30 && !found; day++) {
    state.day = day;
    for (const town of SETTLEMENTS) {
      if (getTownEvent(state, town.id)) { found = town; break; }
    }
  }
  assert.ok(found);
  atTown(state, found.id);
  const market = getMarket(state);
  assert.equal(market.event.id, getTownEvent(state, found.id).id);
  assert.ok(market.food.buyPrice > 0 && market.food.stock > 0);
  const foodBefore = state.food;
  const foodGold = state.gold;
  assert.equal(buyFood(state, 1).ok, true);
  assert.equal(state.food, foodBefore + 1);
  assert.equal(state.gold, foodGold - market.food.buyPrice);

  const good = market.goods.find(row => row.stock > 0);
  assert.ok(good.buyPrice > good.sellPrice);
  const goodsQuote = getPurchaseQuote(state, 'goods', good.goodId);
  assert.ok(goodsQuote.quantity > 0 && goodsQuote.quantity <= good.stock);
  assert.equal(goodsQuote.cost, goodsQuote.quantity * good.buyPrice);
  const beforeTrade = state.gold;
  assert.equal(buyGood(state, good.goodId, 1).ok, true);
  assert.equal(state.gold, beforeTrade - good.buyPrice);
  assert.equal(sellGood(state, good.goodId, 1).ok, true);
  assert.equal(state.gold, beforeTrade - good.buyPrice + good.sellPrice);
  assert.ok(state.gold < beforeTrade);

  const gear = market.equipment.find(row => row.stock > 0 && !row.famed);
  assert.ok(gear.buyPrice > gear.sellPrice);
  const beforeGear = state.gold;
  assert.equal(buyItem(state, gear.itemId).ok, true);
  assert.equal(state.gold, beforeGear - gear.buyPrice);
  assert.equal(sellItem(state, gear.itemId).ok, true);
  assert.equal(state.gold, beforeGear - gear.buyPrice + gear.sellPrice);
  assert.ok(state.gold < beforeGear);
  const gearQuote = getPurchaseQuote(state, 'equipment', gear.itemId);
  assert.ok(gearQuote.quantity > 0);
  assert.equal(gearQuote.cost, gearQuote.quantity * gear.buyPrice);
  const beforeBulk = state.gold;
  assert.equal(buyAll(state, 'equipment', gear.itemId).ok, true);
  assert.equal(state.gold, beforeBulk - gearQuote.cost);
  assert.equal(getMarket(state).equipment.find(row => row.itemId === gear.itemId).stock, 0);
});

test('harvest, caravan, fair, shipment, and muster change their advertised markets', () => {
  const observed = new Set();
  for (let seed = 1; seed <= 40 && observed.size < 6; seed++) {
    const state = createGame(seed);
    for (let day = 2; day <= 24 && observed.size < 6; day++) {
      for (const town of SETTLEMENTS) {
        const event = getTownEvent({ ...state, day }, town.id);
        if (!event || event.startDay !== day || observed.has(event.type)) continue;
        atTown(state, town.id);
        state.day = day - 1;
        const before = getMarket(state);
        state.day = day;
        const during = getMarket(state);
        const grain = market => market.goods.find(row => row.goodId === 'grain');
        const pricedGear = market => market.equipment.find(row => row.itemId === 'mail-shirt');
        assert.ok(during.goods.every(row => row.buyPrice > row.sellPrice), `${event.type} keeps trade spread`);
        assert.ok(during.equipment.every(row => row.buyPrice > row.sellPrice), `${event.type} keeps gear spread`);
        if (event.type === 'good-harvest') {
          assert.ok(during.food.buyPrice < before.food.buyPrice);
          assert.ok(grain(during).buyPrice < grain(before).buyPrice);
          assert.ok(during.food.stock > before.food.stock);
          assert.ok(grain(during).stock > grain(before).stock);
        } else if (event.type === 'poor-harvest') {
          assert.ok(during.food.buyPrice > before.food.buyPrice);
          assert.ok(grain(during).buyPrice > grain(before).buyPrice);
          assert.ok(during.food.stock < before.food.stock && during.food.stock >= 12);
          assert.ok(grain(during).stock < grain(before).stock);
        } else if (event.type === 'trade-caravan') {
          assert.ok(during.goods.every((row, index) => row.stock > before.goods[index].stock));
          assert.ok(during.goods.some((row, index) => row.buyPrice < before.goods[index].buyPrice));
        } else if (event.type === 'market-fair') {
          assert.ok(during.goods.some((row, index) => row.sellPrice > before.goods[index].sellPrice));
        } else if (event.type === 'armorer-shipment-en-route') {
          assert.equal(pricedGear(during).buyPrice, pricedGear(before).buyPrice,
            'an unarrived wagon has not discounted gear yet');
        } else if (event.type === 'militia-muster') {
          assert.ok(pricedGear(during).buyPrice > pricedGear(before).buyPrice);
          const count = market => market.equipment.filter(row => ITEMS.find(item => item.id === row.itemId)?.price >= 250 && row.stock > 0).length;
          assert.ok(count(during) < count(before), 'the muster visibly reserves ordinary gear');
          const buyback = createGame(seed);
          buyback.day = day;
          atTown(buyback, town.id);
          const famedId = createFamedItemId('spear', 1234);
          buyback.inventory.push(famedId);
          buyback.inventoryCondition.push(null);
          assert.equal(sellItem(buyback, famedId).ok, true);
          assert.equal(getMarket(buyback).equipment.find(row => row.itemId === famedId).stock, 1);
          buyback.day = event.endDay + 1;
          assert.equal(getMarket(buyback).equipment.find(row => row.itemId === famedId).stock, 1,
            'the muster does not erase a famed buyback');
          assert.deepEqual(validateSave(JSON.parse(JSON.stringify(buyback))), buyback);
        }
        observed.add(event.type);
      }
    }
  }
  assert.deepEqual([...observed].sort(), [
    'armorer-shipment-en-route', 'good-harvest', 'market-fair', 'militia-muster', 'poor-harvest', 'trade-caravan',
  ]);
});

test('a city shipment stays ungranted across reload until its physical arrival', () => {
  const state = createGame(16);
  atTown(state, 'eastmere');
  assert.equal(buyFood(state, 1).ok, true);
  assert.equal(state.marketStock.eastmere.appliedEventId, null);
  const projection = equipmentCounts(getMarket(state));
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(equipmentCounts(getMarket(restored)), projection,
    'an explicit null marker still permits the upcoming shipment after reload');
  assert.equal(getTownEvent(restored, 'eastmere')?.type, 'armorer-shipment-en-route');
  assert.equal(tick(restored, 22).ok, true);
  const delivered = getTownEvent(restored, 'eastmere');
  assert.equal(delivered?.type, 'armorer-shipment');
  assert.ok(Object.entries(equipmentCounts(getMarket(restored))).some(([id, count]) => count > projection[id]),
    'only the delivered wagon adds finite stock');
  assert.equal(buyFood(restored, 1).ok, true);
  assert.equal(restored.marketStock.eastmere.appliedEventId, delivered.id);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(restored))), restored);
});

test('courier market rewards have a stable roll, add at most one item, and apply once', () => {
  const outcomes = new Set();
  let saturationChecked = false;
  for (let seed = 1; seed <= 48 && outcomes.size < 2; seed++) {
    const delivering = createGame(seed);
    const control = createGame(seed);
    const offer = getContractOffers(delivering, 'oakwatch').find(entry => entry.type === 'courier');
    assert.equal(acceptContract(delivering, 'oakwatch', offer.id).ok, true);
    const target = SETTLEMENTS.find(town => town.id === offer.to);
    for (const state of [delivering, control]) {
      state.position = { x: target.x - 30, y: target.y };
      state.destination = null;
    }
    const restored = validateSave(JSON.parse(JSON.stringify(delivering)));
    for (const state of [delivering, restored, control]) arrive(state, target.id);
    assert.equal(delivering.contract, null);
    const expected = equipmentCounts(getMarket(control));
    const actual = equipmentCounts(getMarket(delivering));
    const changed = Object.entries(actual).filter(([id, count]) => count !== expected[id]);
    assert.ok(changed.length <= 1, 'a courier grants no more than one market item');
    if (changed.length) {
      const [id, count] = changed[0];
      assert.equal(count, expected[id] + 1);
      if (!saturationChecked) {
        const capped = createGame(seed);
        assert.equal(acceptContract(capped, 'oakwatch', offer.id).ok, true);
        atTown(capped, target.id);
        assert.equal(buyFood(capped, 1).ok, true);
        for (const item of ITEMS) capped.marketStock[target.id].equipment[item.id] = 1024;
        validateSave(capped);
        capped.position = { x: target.x - 30, y: target.y };
        arrive(capped, target.id);
        assert.equal(capped.contract, null);
        assert.ok(Object.values(capped.marketStock[target.id].equipment).every(stock => stock <= 1024));
        assert.deepEqual(validateSave(JSON.parse(JSON.stringify(capped))), capped);
        saturationChecked = true;
      }
    }
    outcomes.add(changed.length);
    assert.deepEqual(equipmentCounts(getMarket(restored)), actual, 'reload cannot reroll the courier');
    assert.deepEqual(equipmentCounts(getMarket(delivering)), actual, 'market reads cannot repeat the grant');
    assert.deepEqual(equipmentCounts(getMarket(validateSave(delivering))), actual);
    assert.equal(tick(delivering, 1).ok, true);
    assert.deepEqual(equipmentCounts(getMarket(delivering)), actual, 'time passing cannot repeat the grant');
  }
  assert.deepEqual([...outcomes].sort(), [0, 1], 'sample includes both courier roll outcomes');
  assert.equal(saturationChecked, true);
});

test('market save migration keeps depleted stock and famed buybacks; malformed event markers fail', () => {
  const state = createGame(7391);
  assert.equal(buyFood(state, 1).ok, true);
  const famedId = createFamedItemId('spear', 4321);
  state.inventory.push(famedId);
  state.inventoryCondition.push(null);
  assert.equal(sellItem(state, famedId).ok, true);
  state.marketStock.oakwatch.equipment.spear = 0;
  const oldSave = structuredClone(state);
  delete oldSave.marketStock.oakwatch.armoryCycle;
  delete oldSave.marketStock.oakwatch.appliedEventId;
  const migrated = validateSave(oldSave);
  assert.equal(migrated.marketStock.oakwatch.equipment.spear, 0);
  assert.deepEqual(migrated.marketStock.oakwatch.buyback, [{ itemId: famedId, condition: null }]);
  assert.equal(getMarket(migrated).equipment.find(row => row.itemId === famedId).stock, 1);
  for (const value of [-1, 1, '0']) {
    const corrupted = structuredClone(state);
    corrupted.marketStock.oakwatch.armoryCycle = value;
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
  for (const value of [[], 'ironford:1:armorer-shipment', 'oakwatch:2:armorer-shipment', 'oakwatch:1:unknown']) {
    const corrupted = structuredClone(state);
    corrupted.marketStock.oakwatch.appliedEventId = value;
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }

  let shipment;
  for (let seed = 1; seed <= 100 && !shipment; seed++) {
    for (let day = 2; day <= 7; day++) {
      const event = getTownEvent({ seed, day }, 'ironford');
      if (event?.startDay === day) { shipment = { seed, event }; break; }
    }
  }
  assert.ok(shipment);
  const beforeEvent = createGame(shipment.seed);
  atTown(beforeEvent, 'ironford');
  assert.equal(buyFood(beforeEvent, 1).ok, true);
  beforeEvent.marketStock.ironford.equipment.spear = 0;
  advanceTo(beforeEvent, shipment.event.startDay);
  const projected = equipmentCounts(getMarket(beforeEvent));
  const oldPreEventSave = structuredClone(beforeEvent);
  delete oldPreEventSave.marketStock.ironford.armoryCycle;
  delete oldPreEventSave.marketStock.ironford.appliedEventId;
  const importedPreEvent = validateSave(oldPreEventSave);
  assert.equal(importedPreEvent.marketStock.ironford.equipment.spear, 0);
  assert.equal(importedPreEvent.marketStock.ironford.appliedEventId, null,
    'a market saved before the shipment does not infer a future event marker');
  assert.deepEqual(equipmentCounts(getMarket(importedPreEvent)), projected);
  assert.equal(getTownEvent(beforeEvent, 'ironford')?.type, 'armorer-shipment-en-route');
  assert.equal(buyFood(importedPreEvent, 1).ok, true);
  assert.equal(importedPreEvent.marketStock.ironford.appliedEventId, null,
    'an unarrived shipment is not marked as applied by a market write');
  assert.deepEqual(equipmentCounts(getMarket(importedPreEvent)), projected);

  const duringEvent = createGame(shipment.seed);
  atTown(duringEvent, 'ironford');
  advanceTo(duringEvent, shipment.event.startDay);
  assert.equal(buyFood(duringEvent, 1).ok, true);
  const stockedDuringEvent = equipmentCounts(getMarket(duringEvent));
  delete duringEvent.marketStock.ironford.armoryCycle;
  delete duringEvent.marketStock.ironford.appliedEventId;
  const importedSameDay = validateSave(duringEvent);
  assert.equal(importedSameDay.marketStock.ironford.appliedEventId, null,
    'a same-day new-format market does not invent a delivered marker');
  assert.deepEqual(equipmentCounts(getMarket(importedSameDay)), stockedDuringEvent,
    'a same-day legacy market keeps its stock without a second shipment');
});
