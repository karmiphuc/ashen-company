import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, camp, createFamedItemId, createGame, equipItem, getCompanyStats, getItem,
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
  assert.deepEqual(ARMOR_ATTACHMENTS.map(item => [item.id, item.armor, item.fatigue, item.price]), [
    ['padded-lining', 15, 1, 80],
    ['fur-mantle', 25, 2, 130],
    ['leather-reinforcement', 35, 4, 200],
    ['iron-pauldrons', 60, 7, 340],
    ['scale-mantle', 80, 10, 470],
  ]);
  for (const item of ARMOR_ATTACHMENTS) {
    assert.equal(item.slot, 'attachment');
    assert.ok(item.role);
    assert.equal(ITEMS.find(entry => entry.id === item.id), item);
    assert.throws(() => createFamedItemId(item.id, 1));
  }
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
  assert.equal(getCompanyStats(state.party[0]).maxFatigue, before - 4);
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
