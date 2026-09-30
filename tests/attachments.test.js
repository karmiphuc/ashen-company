import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, SETTLEMENTS, buyItem, camp, createFamedItemId, createGame, equipItem, getCompanyStats, getItem, getMarket,
  finishBattle, getTownServiceQuote, startBattle, advanceBattle, unequipItem, useTownService, validateSave,
} from '../src/engine.js';
import { ARMOR_ATTACHMENTS } from '../src/armor-attachments.js';

function addItem(state, id) {
  state.inventory.push(id);
  state.inventoryCondition.push(getItem(id).armor);
}

function beginAttack(seed, attachment = 'scale-mantle') {
  const state = createGame(seed);
  addItem(state, attachment);
  assert.equal(equipItem(state, 'captain', attachment).ok, true);
  state.position = { x: 440, y: 520 };
  assert.equal(startBattle(state, 'quarry-camp').ok, true);
  const battle = state.battle;
  const target = battle.units.find(unit => unit.id === 'captain');
  const actor = battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(target, { q: 3, r: 3, hp: 300, maxHp: 300, meleeDefense: -100 });
  Object.assign(actor, { q: 4, r: 3, meleeSkill: 300 });
  for (const unit of battle.units.filter(unit => unit.side === 'company' && unit.id !== target.id)) Object.assign(unit, { q: 0, r: unit.id === 'scout' ? 0 : 1 });
  battle.turnIndex = battle.turnOrder.indexOf(actor.id);
  battle.activeId = actor.id;
  assert.equal(advanceBattle(state).ok, true);
  return { state, target, event: battle.lastEvent };
}

test('attachment catalog uses the independent slot and is not famed', () => {
  assert.equal(ARMOR_ATTACHMENTS.length, 15);
  assert.deepEqual(ARMOR_ATTACHMENTS.slice(0, 5).map(item => [item.id, item.armor, item.fatigue, item.price]), [
    ['padded-lining', 15, 1, 80],
    ['fur-mantle', 25, 1, 130],
    ['leather-reinforcement', 35, 2, 200],
    ['iron-pauldrons', 60, 4, 340],
    ['scale-mantle', 80, 5, 470],
  ]);
  for (const item of ARMOR_ATTACHMENTS) {
    assert.equal(item.slot, 'attachment');
    assert.ok(item.role);
    assert.equal(ITEMS.find(entry => entry.id === item.id), item);
    assert.throws(() => createFamedItemId(item.id, 1));
  }
});

test('attachment armor efficiency stays near fifteen armor per fatigue', () => {
  assert.deepEqual(ARMOR_ATTACHMENTS.map(item => [item.id, item.armor]), [
    ['padded-lining', 15], ['fur-mantle', 25], ['leather-reinforcement', 35],
    ['iron-pauldrons', 60], ['scale-mantle', 80], ['bone-platings', 40],
    ['horned-pauldrons', 50], ['chain-mantle', 55], ['heraldic-plates', 60],
    ['gladiator-pauldrons', 65], ['skull-chain', 65], ['spiked-chain', 70],
    ['stag-plates', 75], ['heraldic-shoulders', 82], ['kraken-mantle', 90],
  ]);
  for (const item of ARMOR_ATTACHMENTS) {
    const efficiency = item.armor / item.fatigue;
    assert.ok(efficiency >= 15, `${item.id}: ${efficiency} armor per fatigue`);
  }
  for (const id of ['iron-pauldrons', 'scale-mantle', 'stag-plates', 'heraldic-shoulders', 'kraken-mantle']) {
    const item = ARMOR_ATTACHMENTS.find(entry => entry.id === id);
    assert.ok(item.armor / item.fatigue >= 15, `${id} should deliver at least 15 armor per fatigue`);
  }
});

test('all attachments appear in rotating shop stock without bypassing half-stock scarcity', () => {
  const town = SETTLEMENTS.find(entry => entry.id === 'ironford');
  const attachmentIds = new Set(ARMOR_ATTACHMENTS.map(item => item.id));
  const newIds = new Set(ARMOR_ATTACHMENTS.slice(5).map(item => item.id));
  const seen = new Set();
  const purchased = new Set();
  let total = 0;
  let bonePlatings = 0;
  for (let seed = 1; seed <= 500; seed++) {
    const state = createGame(seed);
    state.position = { x: town.x, y: town.y };
    state.gold = 100000;
    for (const row of getMarket(state).equipment) {
      if (!attachmentIds.has(row.itemId)) continue;
      assert.ok(Number.isSafeInteger(row.stock) && row.stock >= 0);
      if (row.stock > 0) seen.add(row.itemId);
      if (row.stock > 0 && newIds.has(row.itemId) && !purchased.has(row.itemId)) {
        assert.equal(buyItem(state, row.itemId).ok, true, row.itemId);
        assert.ok(state.inventory.includes(row.itemId));
        purchased.add(row.itemId);
      }
      total += row.stock;
      if (row.itemId === 'bone-platings') bonePlatings += row.stock;
    }
  }
  assert.deepEqual(seen, attachmentIds, 'every attachment can enter the city armory rotation');
  assert.deepEqual(purchased, newIds, 'every new attachment can be bought');
  assert.ok(total < 500 * 4, 'the expanded catalog does not fill every attachment slot each week');
  assert.ok(bonePlatings > 200 && bonePlatings < 400, 'the new common piece keeps a half-stock roll per copy');
});

test('saved markets from before the attachment expansion gain valid new stock', () => {
  const state = createGame(91);
  const market = getMarket(state);
  const newIds = new Set(ARMOR_ATTACHMENTS.slice(5).map(item => item.id));
  const oldEquipment = Object.fromEntries(market.equipment.filter(row => !newIds.has(row.itemId)).map(row => [row.itemId, row.stock]));
  state.marketStock.oakwatch = {
    day: state.day,
    food: market.food.stock,
    goods: Object.fromEntries(market.goods.map(row => [row.goodId, row.stock])),
    supplies: Object.fromEntries(market.supplies.map(row => [row.kind, row.stock])),
    equipment: oldEquipment,
    armoryCycle: 0,
    appliedEventId: null,
    buyback: [],
  };
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  for (const [id, stock] of Object.entries(oldEquipment)) assert.equal(restored.marketStock.oakwatch.equipment[id], stock, id);
  for (const id of newIds) assert.ok(Number.isSafeInteger(restored.marketStock.oakwatch.equipment[id]), id);
  assert.ok(getMarket(restored).equipment.filter(row => newIds.has(row.itemId)).every(row => Number.isSafeInteger(row.stock)));
});

test('attachments require body armor and stow atomically with it while preserving damage', () => {
  const state = createGame(71);
  addItem(state, 'iron-pauldrons');
  state.party[0].equipment.armor = null;
  state.party[0].armorDurability.body = 0;
  assert.equal(equipItem(state, 'captain', 'iron-pauldrons').ok, false);
  state.party[0].equipment.armor = 'leather-vest';
  state.party[0].armorDurability.body = 41;
  assert.equal(equipItem(state, 'captain', 'iron-pauldrons').ok, true);
  state.party[0].armorDurability.attachment = 23;
  while (state.inventory.length < 511) addItem(state, 'patched-coat');
  assert.equal(unequipItem(state, 'captain', 'armor').ok, false);
  assert.equal(state.party[0].equipment.armor, 'leather-vest');
  assert.equal(state.party[0].equipment.attachment, 'iron-pauldrons');
  state.inventory.pop();
  state.inventoryCondition.pop();
  assert.equal(unequipItem(state, 'captain', 'armor').ok, true);
  assert.equal(state.party[0].equipment.armor, null);
  assert.equal(state.party[0].equipment.attachment, null);
  assert.equal(state.inventoryCondition[state.inventory.indexOf('leather-vest')], 41);
  assert.equal(state.inventoryCondition[state.inventory.indexOf('iron-pauldrons')], 23);
  assert.deepEqual(validateSave(state), state);
});

test('body hits exhaust attachment armor before body armor while head hits leave both alone', () => {
  let body;
  let head;
  for (let seed = 1; seed <= 100 && (!body || !head); seed++) {
    const result = beginAttack(seed);
    if (result.event.type !== 'attack') continue;
    if (result.event.head) head ??= result;
    else body ??= result;
  }
  assert.ok(body && head);
  assert.ok(body.target.attachmentArmor < body.target.maxAttachmentArmor);
  assert.equal(body.target.bodyArmor, body.target.maxBodyArmor);
  assert.equal(head.target.attachmentArmor, head.target.maxAttachmentArmor);
  assert.equal(head.target.bodyArmor, head.target.maxBodyArmor);
  assert.ok(head.target.headArmor < head.target.maxHeadArmor);
});

test('attachment fatigue participates in armor perks and its damage repairs independently', () => {
  const state = createGame(72);
  addItem(state, 'leather-reinforcement');
  const before = getCompanyStats(state.party[0]).maxFatigue;
  assert.equal(equipItem(state, 'captain', 'leather-reinforcement').ok, true);
  assert.equal(getCompanyStats(state.party[0]).maxFatigue, before - 2);
  state.party[0].armorDurability.attachment = 7;
  state.position = { x: 350, y: 460 };
  const quote = getTownServiceQuote(state, 'smithy', 'captain');
  const repair = quote.entries[0].repairs.find(entry => entry.slot === 'attachment');
  assert.deepEqual([repair.current, repair.max, repair.missing], [7, 35, 28]);
  state.gold = 1000;
  assert.equal(useTownService(state, 'smithy', 'captain').ok, true);
  assert.equal(state.party[0].armorDurability.attachment, 35);

  state.party[0].armorDurability.attachment = 1;
  state.party[0].armorDurability.body = getItem(state.party[0].equipment.armor).armor;
  state.party[0].armorDurability.head = getItem(state.party[0].equipment.helmet).armor;
  state.supplies.tools = 1;
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = 1000;
  assert.equal(camp(state).ok, true);
  assert.equal(state.party[0].armorDurability.attachment, 26);
});

test('legacy party and active battle saves gain empty attachment fields', () => {
  const state = createGame(73);
  state.position = { x: 440, y: 520 };
  startBattle(state, 'quarry-camp');
  for (const person of state.party) {
    delete person.equipment.attachment;
    delete person.armorDurability.attachment;
  }
  for (const unit of state.battle.units) {
    delete unit.equipment.attachment;
    delete unit.attachmentArmor;
    delete unit.maxAttachmentArmor;
  }
  const loaded = validateSave(JSON.parse(JSON.stringify(state)));
  assert.ok(loaded.party.every(person => person.equipment.attachment === null && person.armorDurability.attachment === 0));
  assert.ok(loaded.battle.units.every(unit => unit.equipment.attachment === null && unit.attachmentArmor === 0 && unit.maxAttachmentArmor === 0));
  assert.equal(advanceBattle(loaded).ok, true);
  assert.deepEqual(validateSave(loaded), loaded);
});

test('victory recovers a fallen member attachment at its remaining condition', () => {
  const state = createGame(74);
  addItem(state, 'iron-pauldrons');
  assert.equal(equipItem(state, 'captain', 'iron-pauldrons').ok, true);
  state.position = { x: 440, y: 520 };
  assert.equal(startBattle(state, 'quarry-camp').ok, true);
  const fallen = state.battle.units.find(unit => unit.id === 'captain');
  fallen.attachmentArmor = 23;
  fallen.hp = 0;
  fallen.alive = false;
  for (const enemy of state.battle.units.filter(unit => unit.side === 'enemy')) {
    enemy.hp = 0;
    enemy.alive = false;
  }
  const survivor = state.battle.units.find(unit => unit.side === 'company' && unit.alive);
  state.battle.turnIndex = state.battle.turnOrder.indexOf(survivor.id);
  state.battle.activeId = survivor.id;
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(state.battle.status, 'victory');
  assert.equal(finishBattle(state).ok, true);
  const recovered = state.inventory.map((id, index) => ({ id, condition: state.inventoryCondition[index] }))
    .findLast(entry => entry.id === 'iron-pauldrons');
  assert.deepEqual(recovered, { id: 'iron-pauldrons', condition: 23 });
  assert.equal(state.party.some(person => person.id === 'captain'), false);
  assert.deepEqual(validateSave(state), state);
});
