import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, createFamedItemId, getItem, getCampSites, getRoamingBands,
  startBattle, resolveBattle, retreatBattle, finishBattle, validateSave,
  getCompanyStats, getEquipment, getMarket, equipItem, unequipItem, sellItem, buyItem, tick,
} from '../src/engine.js';
import { getItemDetails } from '../src/item-details.js';
import { itemImage, portraitHTML } from '../src/portraits.js';
import { battleResultsHTML } from '../src/campaign-ui.js';

function atCamp(state, campId) {
  const camp = getCampSites(state).find(entry => entry.id === campId);
  assert.ok(camp, `camp ${campId} exists`);
  state.position = { x: camp.x, y: camp.y };
  state.destination = null;
  state.pursuit = null;
  return camp;
}

test('famed IDs resolve deterministically to immutable item stats and reject malformed variants', () => {
  const id = createFamedItemId('arming-sword', 0x12345678);
  const base = getItem('arming-sword');
  const famed = getItem(id);
  assert.equal(id, 'famed3:arming-sword:305419896');
  assert.equal(famed.id, id);
  assert.equal(famed.baseId, base.id);
  assert.equal(famed.rarity, 'famed');
  assert.equal(famed.visual, base.visual);
  assert.equal(famed.rollModifiers.length,2);
  assert.equal(new Set(famed.rollModifiers).size,2);
  assert.deepEqual(getItem(id), famed);
  assert.ok(Object.isFrozen(famed) && Object.isFrozen(famed.bonuses));

  assert.equal(getItem('famed:arming-sword:0123'), undefined);
  assert.equal(getItem('famed:arming-sword:4294967296'), undefined);
  assert.equal(getItem('famed:unknown:123'), undefined);
  assert.equal(getItem('famed:arming-sword:-1'), undefined);
  for (const [baseId, seed] of [['unknown', 1], ['spear', -1], ['spear', 0x100000000], ['spear', 1.5]]) {
    assert.throws(() => createFamedItemId(baseId, seed), TypeError);
  }

  for (const invalid of ['famed:arming-sword:0123', 'famed:arming-sword:4294967296', 'famed:unknown:1']) {
    const state = createGame(701);
    state.inventory.push(invalid);
    state.inventoryCondition.push(null);
    assert.throws(() => validateSave(state), /Invalid save/);
  }
});

test('famed chance is difficulty-based and a camp generation keeps one drop across reload and retreat', () => {
  const seedByDifficulty = { 1: 12, 2: 9, 3: 8 };
  const chanceByDifficulty = { 1: .15, 2: .25, 3: .40 };
  for (const [difficultyText, seed] of Object.entries(seedByDifficulty)) {
    const difficulty = Number(difficultyText);
    const state = createGame(seed);
    const camp = getCampSites(state).find(entry => !entry.random && entry.difficulty === difficulty);
    assert.equal(camp.famedChance, chanceByDifficulty[difficulty]);
    atCamp(state, camp.id);
    assert.equal(startBattle(state, camp.id).ok, true);
    const dropId = state.battle.famedDrop;
    assert.ok(getItem(dropId)?.rarity === 'famed', `seed ${seed} produces a famed drop`);

    state.battle.rng = (state.battle.rng + 12345) >>> 0;
    const restored = validateSave(JSON.parse(JSON.stringify(state)));
    assert.equal(restored.battle.famedDrop, dropId, 'combat RNG and save/reload do not reroll the drop');
    assert.equal(retreatBattle(restored).ok, true);
    assert.equal(finishBattle(restored).ok, true);
    assert.equal(startBattle(restored, camp.id).ok, true);
    assert.equal(restored.battle.famedDrop, dropId, 'retreating and retrying the same camp generation keeps its drop');
  }
});

test('old active battles without a famed snapshot do not gain a retroactive drop', () => {
  const state = createGame(12);
  const camp = atCamp(state, 'quarry-camp');
  assert.equal(startBattle(state, camp.id).ok, true);
  assert.ok(state.battle.famedDrop);
  delete state.battle.famedDrop;
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.battle.famedDrop, null);
  assert.equal(resolveBattle(restored).ok, true);
  assert.ok(!restored.battle.loot.items.some(id => getItem(id)?.rarity === 'famed'));
});

test('earned famed loot keeps its exact ID through inspection, equip, stow, sale, buyback and combat save', () => {
  const state = createGame(17);
  const camp = atCamp(state, 'quarry-camp');
  assert.equal(startBattle(state, camp.id).ok, true);
  const famedId = state.battle.famedDrop;
  assert.equal(famedId, 'famed3:wood-axe:1017381304');
  assert.equal(resolveBattle(state).ok, true);
  assert.ok(state.battle.loot.items.includes(famedId));

  const pendingLoot = validateSave(JSON.parse(JSON.stringify(state)));
  assert.ok(battleResultsHTML(pendingLoot).includes(`data-inspect="${famedId}" data-item-source="loot"`));
  assert.ok(battleResultsHTML(pendingLoot).includes(getItem(famedId).name));
  assert.equal(finishBattle(pendingLoot).ok, true);
  assert.ok(pendingLoot.inventory.includes(famedId));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(pendingLoot))).inventory, pendingLoot.inventory);

  pendingLoot.position = { x: 350, y: 460 };
  assert.equal(equipItem(pendingLoot, 'captain', famedId).ok, true);
  assert.equal(getEquipment(pendingLoot.party[0]).weapon.id, famedId);
  assert.equal(unequipItem(pendingLoot, 'captain', 'weapon').ok, true);
  assert.ok(pendingLoot.inventory.includes(famedId));
  assert.equal(sellItem(pendingLoot, famedId).ok, true);
  let offer = getMarket(pendingLoot).equipment.find(entry => entry.itemId === famedId);
  assert.equal(offer.buyback, true);
  assert.equal(offer.stock, 1);
  const sold = validateSave(JSON.parse(JSON.stringify(pendingLoot)));
  assert.deepEqual(getMarket(sold).equipment.find(entry => entry.itemId === famedId), offer);

  assert.equal(tickToNextMarketDay(sold), true);
  offer = getMarket(sold).equipment.find(entry => entry.itemId === famedId);
  assert.equal(offer.stock, 1, 'famed buyback survives the next market day');
  assert.equal(buyItem(sold, famedId).ok, true);
  assert.ok(sold.inventory.includes(famedId));
  assert.equal(getMarket(sold).equipment.find(entry => entry.itemId === famedId).stock, 0);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(sold))), sold);

  assert.equal(equipItem(sold, 'captain', famedId).ok, true);
  const band = getRoamingBands(sold).find(entry => entry.id === 'road-thieves');
  sold.position = { x: band.x, y: band.y };
  assert.equal(startBattle(sold, band.id).ok, true);
  assert.equal(sold.battle.units.find(unit => unit.id === 'captain').equipment.weapon, famedId);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(sold))).battle.units.find(unit => unit.id === 'captain').equipment.weapon, famedId);
});

test('famed armor uses its boosted durability in inspection, equipment, combat, and saves', () => {
  const state = createGame(702);
  const famedId = createFamedItemId('mail-shirt', 987654321);
  const famed = getItem(famedId);
  assert.ok(famed.armor > getItem('mail-shirt').armor);
  state.inventory.push(famedId);
  state.inventoryCondition.push(famed.armor);
  assert.equal(equipItem(state, 'captain', famedId).ok, true);
  const captain = state.party.find(person => person.id === 'captain');
  assert.equal(captain.armorDurability.body, famed.armor);
  assert.equal(getCompanyStats(captain).maxBodyArmor, famed.armor);
  captain.armorDurability.body = famed.armor - 17;
  const details = getItemDetails(famed, captain.armorDurability.body);
  assert.equal(details.rarity, 'famed');
  assert.equal(details.baseName, getItem('mail-shirt').name);
  assert.equal(details.stats.find(row => row.label === 'Body armor').value, `${famed.armor - 17} / ${famed.armor}`);
  assert.ok(details.bonuses.some(bonus => bonus.label === 'Protection'));

  const camp = atCamp(state, 'quarry-camp');
  assert.equal(startBattle(state, camp.id).ok, true);
  let unit = state.battle.units.find(entry => entry.id === 'captain');
  assert.equal(unit.equipment.armor, famedId);
  assert.equal(unit.bodyArmor, famed.armor - 17);
  assert.equal(unit.maxBodyArmor, famed.armor);
  const activeReload = validateSave(JSON.parse(JSON.stringify(state)));
  unit = activeReload.battle.units.find(entry => entry.id === 'captain');
  assert.equal(unit.equipment.armor, famedId);
  assert.equal(unit.bodyArmor, famed.armor - 17);
  assert.equal(unit.maxBodyArmor, famed.armor);

  assert.equal(resolveBattle(activeReload).ok, true);
  unit = activeReload.battle.units.find(entry => entry.id === 'captain');
  unit.bodyArmor = famed.armor - 17;
  assert.equal(finishBattle(activeReload).ok, true);
  assert.equal(activeReload.party.find(person => person.id === 'captain').armorDurability.body, famed.armor - 17);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(activeReload))).party.find(person => person.id === 'captain').armorDurability.body, famed.armor - 17);
});

test('item details and portrait layers use the base art while marking famed improvements', () => {
  const famed = getItem(createFamedItemId('arming-sword', 305419896));
  const base = getItem(famed.baseId);
  const details = getItemDetails(famed);
  assert.equal(details.rarity, 'famed');
  assert.equal(details.baseName, base.name);
  assert.deepEqual(details.bonuses, famed.bonuses);
  assert.equal(details.stats.find(row => row.label === 'Base damage').value, `${famed.damageMin}-${famed.damageMax}`);
  assert.equal(details.stats.find(row => row.label === 'Hit modifier').value, `+${famed.hitBonus}`);
  assert.equal(itemImage(famed), 'assets/items/arming-sword.png');
  assert.equal(itemImage(famed), itemImage(base), 'famed equipment reuses its packaged base icon');

  const portrait = portraitHTML({ name: 'Mara', seed: 12 }, { weapon: famed }, 80);
  assert.match(portrait, /data-layer="weapon" class="bb-layer bb-layer-weapon bb-layer-famed" src="assets\/portraits\/weapon-sword\.png"/);
});

function tickToNextMarketDay(state) {
  const hours = 24 - state.hour;
  let remaining = hours;
  while (remaining > 0) {
    const step = Math.min(remaining, 72);
    assert.equal(tick(state, step).ok, true);
    remaining -= step;
  }
  return state.day === 2;
}
