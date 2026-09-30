import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, GOODS, SETTLEMENTS, createGame, travelTo, tick, townAt, getContractOffers, acceptContract,
  getMarket, buyFood, buyGood, sellGood, buyItem, sellItem, equipItem, unequipItem, recruit, camp, forage,
  getEquipment, terrainAt, validateSave, retreatBattle, finishBattle,
} from '../src/engine.js';
import { VISUALS } from '../src/portraits.js';

function ownedItems(state) {
  return [...state.inventory, ...state.party.flatMap(person => Object.values(person.equipment).filter(Boolean))].sort();
}

function reach(state, townId) {
  const town = SETTLEMENTS.find(entry => entry.id === townId);
  assert.equal(travelTo(state, town.x, town.y).ok, true);
  for (let i = 0; i < 40 && (state.destination || state.battle); i++) {
    tick(state, 12);
    if (state.battle) {
      assert.equal(retreatBattle(state).ok, true);
      assert.equal(finishBattle(state).ok, true);
      assert.equal(travelTo(state, town.x, town.y).ok, true);
    }
  }
  assert.equal(state.destination, null);
  assert.equal(townAt(state)?.id, townId);
}

test('new games are deterministic and start in Oakwatch with valid saves', () => {
  const one = createGame(2026);
  assert.deepEqual(one, createGame(2026));
  assert.equal(townAt(one).name, 'Oakwatch');
  assert.equal(one.gold, 900);
  assert.equal(one.party.length, 3);
  assert.deepEqual(validateSave(one), one);
  assert.deepEqual(validateSave(createGame(0xffffffff)), createGame(0xffffffff));
  assert.ok(ITEMS.length >= 12 && SETTLEMENTS.length >= 6);
});

test('every item visual is supported by the portrait renderer', () => {
  for (const item of ITEMS) assert.ok(VISUALS[item.slot]?.[item.visual], `${item.id} has unsupported art`);
  for (const id of ['plate-harness', 'kettle-helm', 'greathelm', 'hunting-bow']) assert.ok(ITEMS.some(item => item.id === id));
});

test('equipping and stowing preserve every owned item', () => {
  const state = createGame(7);
  const before = ownedItems(state);
  assert.equal(equipItem(state, 'captain', 'cloth-hood').ok, true);
  assert.equal(getEquipment(state.party[0]).helmet.id, 'cloth-hood');
  assert.equal(unequipItem(state, 'captain', 'helmet').ok, true);
  assert.equal(equipItem(state, 'captain', 'leather-cap').ok, true);
  assert.deepEqual(ownedItems(state), before);
  assert.equal(equipItem(state, 'captain', 'brigandine').ok, false);
  assert.equal(unequipItem(state, 'captain', 'invalid').ok, false);
  assert.deepEqual(ownedItems(state), before);
});

test('a full pack cannot grow beyond the save limit', () => {
  const state = createGame(8);
  state.inventory = Array(512).fill('buckler');
  state.inventoryCondition = Array(512).fill(24);
  assert.equal(buyItem(state, 'spear').ok, false);
  assert.equal(unequipItem(state, 'captain', 'helmet').ok, false);
  assert.equal(state.inventory.length, 512);
  assert.deepEqual(validateSave(state), state);
});

test('trade, recruiting and contracts require the issuing town', () => {
  const state = createGame(9);
  const localItem = getMarket(state).equipment.find(row => row.stock > 0 && row.buyPrice <= state.gold).itemId;
  assert.equal(buyItem(state, localItem).ok, true);
  assert.equal(sellItem(state, localItem).ok, true);
  assert.equal(recruit(state).ok, true);
  assert.equal(travelTo(state, 420, 460).ok, true);
  assert.equal(tick(state, 3).ok, true);
  assert.equal(townAt(state), null);
  const gold = state.gold;
  const partySize = state.party.length;
  assert.equal(buyItem(state, 'spear').ok, false);
  assert.equal(buyFood(state, 5).ok, false);
  assert.equal(buyGood(state, 'grain', 1).ok, false);
  assert.equal(sellGood(state, 'grain', 1).ok, false);
  assert.equal(getMarket(state), null);
  assert.equal(sellItem(state, 'cloth-hood').ok, false);
  assert.equal(recruit(state).ok, false);
  assert.equal(acceptContract(state, 'oakwatch').ok, false);
  assert.equal(state.gold, gold);
  assert.equal(state.party.length, partySize);
});

test('markets differ by town, have finite stock, and renew the next day', () => {
  const state = createGame(7391);
  const snapshot = structuredClone(state);
  const market = getMarket(state);
  assert.deepEqual(state, snapshot);
  assert.equal(market.town.id, 'oakwatch');
  assert.equal(GOODS.length, market.goods.length);
  const grain = market.goods.find(entry => entry.goodId === 'grain');
  assert.ok(grain.buyPrice > grain.sellPrice);
  assert.equal(buyGood(state, 'grain', grain.stock).ok, true);
  assert.equal(getMarket(state).goods.find(entry => entry.goodId === 'grain').stock, 0);
  assert.equal(buyGood(state, 'grain').ok, false);
  const foodBefore = state.food;
  assert.equal(buyFood(state, 5).ok, true);
  assert.equal(state.food, foodBefore + 5);
  tick(state, 16);
  assert.equal(state.day, 2);
  assert.ok(getMarket(state).goods.find(entry => entry.goodId === 'grain').stock > 0);
  const oakMail = market.equipment.find(entry => entry.itemId === 'mail-shirt').buyPrice;
  reach(state, 'ironford');
  assert.ok(getMarket(state).equipment.find(entry => entry.itemId === 'mail-shirt').buyPrice < oakMail);
});

test('trade profits across towns without same-town buy/sell profit', () => {
  const state = createGame(13);
  const oak = getMarket(state).goods.find(entry => entry.goodId === 'grain');
  assert.ok(oak.sellPrice < oak.buyPrice);
  assert.equal(buyGood(state, 'grain', 4).ok, true);
  reach(state, 'thornwall');
  const thornwall = getMarket(state).goods.find(entry => entry.goodId === 'grain');
  assert.ok(thornwall.sellPrice > oak.buyPrice);
  const beforeSelling = state.gold;
  assert.equal(sellGood(state, 'grain', 4).ok, true);
  assert.equal(state.gold, beforeSelling + thornwall.sellPrice * 4);
  assert.equal(state.cargo.grain, undefined);
  assert.deepEqual(validateSave(state), state);
});

test('supply contracts require and consume cargo, while old courier saves migrate', () => {
  const state = createGame(7391);
  const beforeOffers = structuredClone(state);
  const offers = getContractOffers(state, 'oakwatch');
  assert.deepEqual(state, beforeOffers);
  assert.deepEqual(offers.map(offer => offer.type), ['courier', 'supply', 'hunt', 'assault', 'rescue']);
  const supply = offers[1];
  assert.equal(acceptContract(state, 'oakwatch', supply.id).ok, true);
  assert.equal(state.contract.goodId, supply.goodId);
  assert.equal(buyGood(state, supply.goodId, supply.quantity).ok, true);
  reach(state, supply.to);
  assert.equal(state.contract, null);
  assert.equal(state.cargo[supply.goodId], undefined);
  assert.equal(state.renown, 2);
  assert.deepEqual(validateSave(state), state);

  const legacy = createGame(44);
  acceptContract(legacy, 'oakwatch');
  delete legacy.cargo;
  delete legacy.marketStock;
  delete legacy.contract.type;
  delete legacy.contract.renown;
  const imported = validateSave(legacy);
  assert.deepEqual(imported.cargo, {});
  assert.deepEqual(imported.marketStock, {});
  assert.equal(imported.contract.type, 'courier');
  assert.equal(imported.contract.renown, 1);
  reach(imported, imported.contract.to);
  assert.equal(imported.contract, null);
  assert.equal(imported.renown, 1);
});

test('an undersupplied delivery remains open and can finish after arrival', () => {
  const state = createGame(7391);
  const offer = getContractOffers(state, 'oakwatch')[1];
  acceptContract(state, 'oakwatch', offer.id);
  reach(state, offer.to);
  assert.equal(state.contract?.type, 'supply');
  for (let i = 0; i < 3 && state.contract; i++) {
    const available = getMarket(state).goods.find(entry => entry.goodId === offer.goodId).stock;
    const needed = offer.quantity - (state.cargo[offer.goodId] ?? 0);
    if (available) assert.equal(buyGood(state, offer.goodId, Math.min(needed, available)).ok, true);
    if (state.contract) tick(state, 24);
  }
  assert.equal(state.contract, null);
  assert.equal(state.renown, 2);
});

test('travel obeys bounds and difficult terrain slows progress', () => {
  const state = createGame(11);
  assert.equal(travelTo(state, 50, 460).ok, false);
  assert.equal(travelTo(state, Infinity, 460).ok, false);
  assert.equal(terrainAt(475, 445), 'forest');
  assert.equal(terrainAt(615, 145), 'mountain');
  const plains = createGame(11);
  plains.position = { x: 350, y: 600 };
  travelTo(plains, 700, 600);
  tick(plains, 0.1);
  const forest = createGame(11);
  forest.position = { x: 475, y: 445 };
  travelTo(forest, 700, 445);
  tick(forest, 0.1);
  const mountain = createGame(11);
  mountain.position = { x: 615, y: 145 };
  travelTo(mountain, 800, 145);
  tick(mountain, 0.1);
  assert.ok(plains.position.x - 350 > forest.position.x - 475);
  assert.ok(forest.position.x - 475 > mountain.position.x - 615);
  const snapshot = structuredClone(state);
  assert.equal(tick(state, NaN).ok, false);
  assert.deepEqual(state, snapshot);
});

test('delivery pays on arrival and another can be taken', () => {
  const state = createGame(14);
  assert.equal(acceptContract(state, 'oakwatch').ok, true);
  const contract = { ...state.contract };
  const target = SETTLEMENTS.find(town => town.id === contract.to);
  reach(state, target.id);
  assert.equal(state.destination, null);
  assert.equal(state.contract, null);
  assert.equal(state.renown, 1);
  assert.equal(townAt(state)?.id, target.id);
  assert.ok(state.visited.includes(target.id));
  assert.equal(state.gold, 900 + contract.reward - (state.day - 1) * 15);
  assert.equal(acceptContract(state, target.id).ok, true);
  assert.notEqual(state.contract.to, target.id);
});

test('time costs apply, but shortages never make resources negative or kill the party', () => {
  const state = createGame(31);
  state.party[0].hp = 40;
  assert.equal(camp(state).ok, true);
  assert.equal(state.hour, 14);
  assert.equal(state.party[0].hp, 64);
  const initialFood = state.food;
  assert.equal(forage(state).ok, true);
  assert.equal(state.hour, 18);
  assert.ok(state.food > initialFood);
  state.gold = 0;
  state.food = 0;
  tick(state, 30);
  assert.equal(state.day, 3);
  assert.equal(state.gold, 0);
  assert.equal(state.food, 0);
  assert.ok(state.party.every(person => person.hp >= 1 && person.morale >= 0));
  assert.equal(forage(state).ok, true);
  assert.ok(state.food > 0);
});

test('save validation rejects corrupted resources, coordinates and item references', () => {
  const base = createGame(5);
  const variants = [
    save => { save.gold = -1; },
    save => { save.food = NaN; },
    save => { save.position.x = Infinity; },
    save => { save.inventory.push('unknown-helmet'); },
    save => { save.party[0].equipment.armor = 'spear'; },
    save => { save.party[0].hp = 0; },
    save => { save.party[0].name = 'x'.repeat(81); },
    save => { save.party[0].id = 'x'.repeat(41); },
    save => { save.inventory = Array(513).fill('buckler'); },
    save => { save.log = Array(31).fill('Day 1: test'); },
    save => { save.day = 1000001; },
    save => { save.contractSerial = 1000001; },
    save => { save.cargo = { grain: 31 }; },
    save => { save.cargo = { unknown: 1 }; },
    save => { save.marketStock = { oakwatch: { day: 1, food: -1, goods: {}, equipment: {} } }; },
    save => { save.visited.push('missing-place'); },
    save => { save.contract = { id: 'delivery-1', from: 'oakwatch', to: 'nowhere', reward: 100, acceptedDay: 1 }; },
    save => { save.contractSerial = 1; save.contract = { id: 'delivery-1', from: 'oakwatch', to: 'greyhaven', reward: 5001, acceptedDay: 1 }; },
    save => { save.contractSerial = 1; save.contract = { id: 'delivery-1', type: 'supply', from: 'oakwatch', to: 'greyhaven', reward: 100, acceptedDay: 1, renown: 2, goodId: 'unknown', quantity: 4 }; },
  ];
  for (const mutate of variants) {
    const corrupted = structuredClone(base);
    mutate(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
  const imported = validateSave(base);
  imported.inventory.push('buckler');
  imported.party[0].equipment.armor = null;
  assert.notDeepEqual(imported, base);
});
