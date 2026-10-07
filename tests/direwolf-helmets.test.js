import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame, getItem, ITEMS, getDirewolfHelmetQuote, craftDirewolfHelmet, createFamedItemId, equipItem, getCompanyStats, validateSave, getCampSites, startBattle, retreatBattle, finishBattle, getMarket } from '../src/engine.js';
import { DIREWOLF_BODY_IDS, DIREWOLF_LEATHER_HELMET as leather, DIREWOLF_ALPHA_HELMET as alpha, DIREWOLF_EXISTING_HELMET as wolf, direwolfHelmetRecipe } from '../src/direwolf-helmets.js';
import { direwolfCraftRoll } from '../src/direwolf-crafting.js';
import { equipmentSetStatus, effectiveArmorFatigue, effectiveAttachmentFatigue, equipmentSetsForRules } from '../src/equipment-sets.js';
import { itemImage, portraitHTML } from '../src/portraits.js';
import { extractForgeAffixes, encodeBoundedForgeItem } from '../src/reforged-items.js';
import { decodePng } from '../tools/content/restore-ancient-art.mjs';
import { listOfflineAssets } from '../tools/build-cache.mjs';

function materials(state, recipeId) {
  state.inventory = [...direwolfHelmetRecipe(recipeId).materialIds, 'cloth-hood'];
  state.inventoryCondition = state.inventory.map((id, i) => i < state.inventory.length - 1 ? 0 : 20);
  state.gold = 2000;
  return state.inventory.slice(0, -1).map((_, i) => i);
}
function seedFor(named) { for (let seed = 0; seed < 20000; seed++) if (direwolfCraftRoll(createGame(seed).seed, 0).named === named) return seed; throw Error('Missing outcome'); }
test('confirmed stats and reused Wolf Helmet artwork and intrinsic resolve are exact', () => {
  for (const [id, armor, fatigue] of [[leather, 120, 3], [wolf, 178, 5], [alpha, 265, 15]]) assert.deepEqual([getItem(id).armor, getItem(id).fatigue], [armor, fatigue]);
  assert.equal(getItem('direwolf-moonfang-harness').armor, 195);
  assert.equal(getItem(wolf).statBonuses.resolve, 4); assert.equal(getItem(alpha).statBonuses.resolve, 4);
  assert.match(itemImage(getItem(wolf)), /^data:image\/png;base64,/);
});
test('leather and Alpha recipes consume exact original materials, repair output, save serial and reject replay', () => {
  for (const recipeId of [leather, alpha]) for (const named of [false, true]) {
    const s = createGame(seedFor(named)), indices = materials(s, recipeId);
    const quote = getDirewolfHelmetQuote(s, recipeId, indices), result = craftDirewolfHelmet(s, quote);
    assert.equal(result.ok, true); assert.equal(result.named, named);
    assert.equal(getItem(result.itemId).baseId || result.itemId, recipeId);
    assert.equal(s.gold, 2000 - direwolfHelmetRecipe(recipeId).fee); assert.equal(s.direwolfCraftSerial, 1);
    assert.deepEqual(s.inventory, ['cloth-hood', result.itemId]); assert.deepEqual(s.inventoryCondition, [20, getItem(result.itemId).armor]);
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
    const before = structuredClone(s); assert.equal(craftDirewolfHelmet(s, quote).ok, false); assert.deepEqual(s, before);
  }
});
test('invalid, duplicate, swapped, upgraded, poor and stale materials never mutate the company', () => {
  const s = createGame(21); materials(s, alpha);
  for (const indices of [[], [0], [0, 0], [1, 0], [-1, 1], [0, 99], [null, 1]]) {
    const before = structuredClone(s); assert.equal(getDirewolfHelmetQuote(s, alpha, indices).ok, false); assert.deepEqual(s, before);
  }
  assert.equal(getDirewolfHelmetQuote(s, 'toString', [0, 1]).ok, false);
  s.inventory[0] = createFamedItemId(leather, 71, 7); assert.equal(getDirewolfHelmetQuote(s, alpha, [0, 1]).ok, false);
  materials(s, alpha); s.gold = 449; const before = structuredClone(s); assert.equal(craftDirewolfHelmet(s, getDirewolfHelmetQuote(s, alpha, [0, 1])).ok, false); assert.deepEqual(s, before);
  for (const mutate of [x => x.gold--, x => x.inventoryCondition[0]++, x => x.direwolfCraftSerial++, x => x.destination = { x: 100, y: 100 }, x => x.battle = {}, x => x.gameOver = true]) {
    const state = createGame(21); materials(state, alpha); const q = getDirewolfHelmetQuote(state, alpha, [0, 1]); mutate(state);
    const before = structuredClone(state); assert.equal(craftDirewolfHelmet(state, q).ok, false); assert.deepEqual(state, before);
  }
});
test('full-stash crafting needs no free slot and read-only previews preserve old saves', () => {
  const s = createGame(seedFor(false)); materials(s, leather); delete s.direwolfCraftSerial;
  while (s.inventory.length < 24) { s.inventory.push('cloth-hood'); s.inventoryCondition.push(20); }
  const before = structuredClone(s); for (let i = 0; i < 10; i++) getDirewolfHelmetQuote(s, leather, [0]);
  assert.deepEqual(s, before); assert.deepEqual(validateSave(s), s);
  assert.equal(craftDirewolfHelmet(s, getDirewolfHelmetQuote(s, leather, [0])).ok, true); assert.equal(s.inventory.length, 24); assert.deepEqual(validateSave(s), s);
});
test('all nine Direwolf body/head pairs fit once with correct rounded protection and fatigue', () => {
  for (const body of DIREWOLF_BODY_IDS) for (const head of [leather, wolf, alpha]) {
    const s = createGame(21), p = s.party[0]; s.inventory.push(body, head); s.inventoryCondition.push(getItem(body).armor, getItem(head).armor);
    equipItem(s, p.id, body); equipItem(s, p.id, head);
    const status = equipmentSetStatus(p, getItem), stats = getCompanyStats(p);
    assert.equal(status.set.id, 'direwolf'); assert.equal(status.active, true);
    assert.deepEqual([stats.maxBodyArmor, stats.maxHeadArmor], [Math.floor(getItem(body).armor * 115 / 100), Math.floor(getItem(head).armor * 115 / 100)]);
    assert.deepEqual(effectiveArmorFatigue(p, getItem), { body: Math.round(getItem(body).fatigue * .85), head: Math.round(getItem(head).fatigue * .9) });
  }
  assert.equal(equipmentSetStatus({ equipment: { armor: 'mail-shirt', helmet: leather } }, getItem).active, false);
  assert.equal(equipmentSetsForRules(8).some(s => s.id === 'direwolf'), false);
});
test('named and reforged designs retain set membership; transferring affixes does not transfer the family', () => {
  const catalog = id => ITEMS.find(item => item.id === id);
  for (const head of [leather, wolf, alpha]) {
    const named = getItem(createFamedItemId(head, 71, 7)), affixes = extractForgeAffixes(named, catalog);
    const forgedId = encodeBoundedForgeItem(head, affixes, catalog);
    const actor = { equipment: { armor: createFamedItemId('direwolf-moonfang-harness', 71, 7), helmet: forgedId } };
    assert.equal(equipmentSetStatus(actor, getItem).active, true);
    assert.equal(itemImage(getItem(forgedId)), itemImage(getItem(head)));
    const other = encodeBoundedForgeItem('iron-helm', affixes, catalog);
    actor.equipment.helmet = other; assert.equal(equipmentSetStatus(actor, getItem).active, false);
  }
});
test('Direwolf Fur completes the family with replacement bonuses and works in either attachment slot', () => {
  for (const slot of ['attachment', 'attachment2']) {
    const s = createGame(21), p = s.party[0]; p.level = 4; p.perks = ['layered-armor'];
    for (const id of ['direwolf-moonfang-harness', alpha, 'direwolf-fur']) { s.inventory.push(id); s.inventoryCondition.push(getItem(id).armor); }
    equipItem(s, p.id, 'direwolf-moonfang-harness'); equipItem(s, p.id, alpha); equipItem(s, p.id, 'direwolf-fur', slot === 'attachment2' ? 'attachment-2' : 'active');
    const status = equipmentSetStatus(p, getItem), stats = getCompanyStats(p);
    assert.equal(status.threePiece, true); assert.equal(status.attachmentSlot, slot);
    assert.deepEqual([stats.maxBodyArmor, stats.maxHeadArmor], [243, 331]);
    assert.deepEqual(effectiveArmorFatigue(p, getItem), { body: 10, head: 12 });
    assert.equal(effectiveAttachmentFatigue(p, getItem)[slot], 2);
    const camp = getCampSites(s)[0]; s.position = { x: camp.x, y: camp.y }; startBattle(s, camp.id);
    const u = s.battle.units.find(u => u.id === p.id); assert.equal(u.setArmor.attachmentSlot, slot);
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
  }
});
test('version-nine battle snapshots survive save/reload and retreat without healing; version-eight battles stay unfitted', () => {
  for (const head of [leather, wolf, alpha]) {
    const s = createGame(21), p = s.party[0], body = 'direwolf-moonfang-harness';
    s.inventory.push(body, head); s.inventoryCondition.push(100, 70); equipItem(s, p.id, body); equipItem(s, p.id, head);
    const camp = getCampSites(s)[0]; s.position = { x: camp.x, y: camp.y }; startBattle(s, camp.id);
    const u = s.battle.units.find(u => u.id === p.id); assert.equal(u.setArmor.id, 'direwolf'); assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
    u.bodyArmor--; u.headArmor--; retreatBattle(s); finishBattle(s);
    assert.ok(p.armorDurability.body < 100); assert.ok(p.armorDurability.head < 70); assert.deepEqual(validateSave(s), s);
    startBattle(s, camp.id); s.battle.equipmentSetRulesVersion = 8;
    for (const unit of s.battle.units) if (unit.setArmor?.id === 'direwolf') { unit.bodyArmor = unit.maxBodyArmor = unit.setArmor.body.baseCurrent; unit.headArmor = unit.maxHeadArmor = unit.setArmor.head.baseCurrent; delete unit.setArmor; }
    // Maxima must remain the raw design maxima for an older battle.
    const old = s.battle.units.find(u => u.id === p.id); old.maxBodyArmor = getItem(body).armor; old.maxHeadArmor = getItem(head).armor;
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s); assert.equal(equipmentSetStatus(old, getItem).active, false);
  }
});
test('craft-only helmets never spawn in ordinary stock and transparent sprites are cached for named and ordinary gear', async () => {
  const s = createGame(21), stock = getMarket(s).equipment, cache = new Set(await listOfflineAssets());
  for (const id of [leather, alpha]) {
    assert.equal(stock.find(row => row.itemId === id).stock, 0);
    for (const variant of [id, createFamedItemId(id, 71, 7)]) assert.match(portraitHTML(s.party[0], { armor: getItem('direwolf-moonfang-harness'), helmet: getItem(variant) }), /src="\.\/assets\/direwolf-helmets\/.*-portrait.png"/);
  }
  for (const finish of ['leather', 'alpha']) for (const layer of ['icon', 'portrait']) {
    const path = `./assets/direwolf-helmets/${finish}-${layer}.png`, png = decodePng(readFileSync(new URL('../' + path, import.meta.url)));
    assert.deepEqual([png.width, png.height], layer === 'portrait' ? [74, 110] : [140, 180]); assert.equal(png.rgba[3], 0); assert.ok(cache.has(path));
  }
});
