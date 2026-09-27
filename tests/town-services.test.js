import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SETTLEMENTS, createFamedItemId, createGame, getCompanyStats, getItem,
  getTownServiceQuote, useTownService, tick, validateSave,
} from '../src/engine.js';

function atIronford(state) {
  const town = SETTLEMENTS.find(place => place.id === 'ironford');
  state.position = { x: town.x, y: town.y };
  state.destination = null;
  state.destinationAction = null;
  return state;
}

function damagedCompany() {
  const state = atIronford(createGame(17));
  const [captain, scout, guard] = state.party;
  captain.hp = getCompanyStats(captain).maxHp - 25;
  guard.hp = getCompanyStats(guard).maxHp - 10;
  const famedArmor = createFamedItemId('leather-vest', 17);
  captain.equipment.armor = famedArmor;
  captain.armorDurability.body = getItem(famedArmor).armor - 21;
  captain.armorDurability.head -= 10;
  guard.armorDurability.body -= 5;
  assert.equal(scout.hp, getCompanyStats(scout).maxHp);
  return state;
}

test('Doctor quotes exact missing HP for each brother and heals one or all without time or supplies', () => {
  const state = damagedCompany();
  const before = structuredClone(state);
  const quote = getTownServiceQuote(state, 'doctor');
  assert.deepEqual(state, before, 'a quote is read-only');
  assert.deepEqual(quote.entries.map(entry => [entry.memberId, entry.hpMissing, entry.cost]),
    [['captain', 25, 25], ['scout', 0, 0], ['guard', 10, 10]]);
  assert.deepEqual([quote.ok, quote.townId, quote.totalAmount, quote.totalCost], [true, 'ironford', 35, 35]);
  assert.equal(getTownServiceQuote(state, 'doctor', 'captain').totalCost, 25);

  const oldGold = state.gold, oldTime = [state.day, state.hour], oldSupplies = structuredClone(state.supplies);
  assert.equal(useTownService(state, 'doctor', 'captain').ok, true);
  assert.equal(state.gold, oldGold - 25);
  assert.equal(state.party[0].hp, getCompanyStats(state.party[0]).maxHp);
  assert.equal(state.party[2].hp, getCompanyStats(state.party[2]).maxHp - 10);
  assert.deepEqual([state.day, state.hour], oldTime);
  assert.deepEqual(state.supplies, oldSupplies);
  assert.equal(getTownServiceQuote(state, 'doctor').totalCost, 10);
  assert.equal(useTownService(state, 'doctor').ok, true);
  assert.equal(state.gold, oldGold - 35);
  assert.ok(state.party.every(person => person.hp === getCompanyStats(person).maxHp));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('Smithy quotes each equipped armor piece and rounds each brother separately, including famed caps', () => {
  const state = damagedCompany();
  const before = structuredClone(state);
  const quote = getTownServiceQuote(state, 'smithy');
  assert.deepEqual(state, before, 'a quote does not repair or spend crowns');
  assert.deepEqual(quote.entries.map(entry => [entry.memberId, entry.amount, entry.cost]),
    [['captain', 31, 16], ['scout', 0, 0], ['guard', 5, 3]]);
  assert.deepEqual([quote.totalAmount, quote.totalCost], [36, 19]);
  assert.deepEqual(quote.entries[0].repairs.map(repair => [repair.slot, repair.missing]),
    [['armor', 21], ['helmet', 10]]);
  assert.equal(quote.entries[0].repairs[0].max, getItem(state.party[0].equipment.armor).armor);
  assert.ok(quote.entries[1].repairs.every(repair => repair.missing === 0), 'intact equipped pieces remain visible in the quote');
  assert.deepEqual(quote.entries[2].repairs.map(repair => repair.slot), ['armor'], 'empty helmet slots are not repaired');

  const oldGold = state.gold, oldTime = [state.day, state.hour], oldSupplies = structuredClone(state.supplies);
  assert.equal(getTownServiceQuote(state, 'smithy', 'captain').totalCost, 16);
  assert.equal(useTownService(state, 'smithy', 'captain').ok, true);
  assert.equal(state.gold, oldGold - 16);
  assert.equal(state.party[2].armorDurability.body, getItem(state.party[2].equipment.armor).armor - 5);
  assert.equal(getTownServiceQuote(state, 'smithy').totalCost, 3);
  assert.equal(useTownService(state, 'smithy').ok, true);
  assert.equal(state.gold, oldGold - 19);
  assert.equal(state.party[0].armorDurability.body, getItem(state.party[0].equipment.armor).armor);
  assert.equal(state.party[0].armorDurability.head, getItem(state.party[0].equipment.helmet).armor);
  assert.equal(state.party[2].armorDurability.body, getItem(state.party[2].equipment.armor).armor);
  assert.deepEqual([state.day, state.hour], oldTime);
  assert.deepEqual(state.supplies, oldSupplies);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('invalid, unavailable, full, and unaffordable services reject without changing the save', () => {
  const state = damagedCompany();
  const reject = (service, memberId) => {
    const before = structuredClone(state);
    assert.equal(useTownService(state, service, memberId).ok, false);
    assert.deepEqual(state, before);
  };
  reject('stable');
  reject('doctor', 'unknown');
  reject('doctor', '');
  state.gold = 0;
  const poorQuote = getTownServiceQuote(state, 'smithy');
  assert.equal(poorQuote.ok, false);
  assert.equal(poorQuote.totalCost, 19, 'an unaffordable quote still gives the full bill');
  reject('smithy');
  state.gold = 900;
  state.position = { x: 1100, y: 800 };
  reject('doctor');
  atIronford(state);
  state.battle = {};
  reject('doctor');
  state.battle = null;
  state.gameOver = true;
  reject('smithy');
  state.gameOver = false;
  assert.equal(useTownService(state, 'doctor').ok, true);
  assert.equal(useTownService(state, 'smithy').ok, true);
  reject('doctor');
  reject('smithy');
});

test('shortage market prices do not alter Doctor or Smithy bills', () => {
  const normal = damagedCompany();
  const shortage = damagedCompany();
  shortage.seed = 2;
  shortage.shipments = createGame(2).shipments;
  tick(shortage, 15);
  assert.equal(shortage.shipments.ironford.status, 'lost');
  for (const service of ['doctor', 'smithy']) {
    assert.deepEqual(
      getTownServiceQuote(shortage, service).entries.map(entry => entry.cost),
      getTownServiceQuote(normal, service).entries.map(entry => entry.cost),
    );
  }
});
