import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame, getItem, ITEMS, SETTLEMENTS, getDirewolfCraftQuote, craftDirewolfMoonfang, validateSave, createFamedItemId, equipItem, unequipItem, getCompanyStats, getMarket, sellItem, buyItem, startBattle, advanceBattle } from '../src/engine.js';
import { MOONFANG_ID, DIREWOLF_HIDE, DIREWOLF_MAIL, direwolfCraftRoll } from '../src/direwolf-crafting.js';
import { direwolfArmorerHTML, direwolfConfirmationHTML, direwolfResultHTML } from '../src/direwolf-armorer-ui.js';
import { getItemDetails } from '../src/item-details.js';
import { itemImage, portraitHTML } from '../src/portraits.js';
import { extractForgeAffixes, encodeBoundedForgeItem } from '../src/reforged-items.js';
import { decodePng } from '../tools/content/restore-ancient-art.mjs';
import { listOfflineAssets } from '../tools/build-cache.mjs';

function materials(state) {
  state.inventory = [DIREWOLF_MAIL, 'cloth-hood', DIREWOLF_HIDE, DIREWOLF_HIDE];
  state.inventoryCondition = [0, 20, 0, 100];
}
function seedFor(named) {
  for (let seed = 0; seed < 20000; seed++) if (direwolfCraftRoll(createGame(seed).seed, 0).named === named) return seed;
  throw Error('No matching seed');
}
test('the selected lightweight baseline and signature survive named and bounded forge identities', () => {
  const base = getItem(MOONFANG_ID);
  assert.deepEqual([base.armor, base.fatigue, base.meleeMoraleDamage], [195, 13, 5]);
  const named = getItem(createFamedItemId(MOONFANG_ID, 71, 7));
  assert.ok(named.armor > 195); assert.ok(named.fatigue <= 13);
  const catalog = id => ITEMS.find(i => i.id === id);
  const forged = getItem(encodeBoundedForgeItem(MOONFANG_ID, extractForgeAffixes(named, catalog), catalog));
  assert.equal(forged.meleeMoraleDamage, 5); assert.equal(itemImage(forged), itemImage(base));
  assert.ok(getItemDetails(forged).notes.some(note => note.includes('does not stack')));
});
test('exact ordinary materials are consumed, spare copies survive, output is repaired and replay is rejected', () => {
  for (const named of [false, true]) {
    const s = createGame(seedFor(named)); materials(s);
    const q = getDirewolfCraftQuote(s, 2, 0), r = craftDirewolfMoonfang(s, q);
    assert.equal(r.ok, true); assert.equal(r.named, named);
    assert.equal(s.gold, 300); assert.equal(s.direwolfCraftSerial, 1);
    assert.deepEqual(s.inventory, ['cloth-hood', DIREWOLF_HIDE, r.itemId]);
    assert.deepEqual(s.inventoryCondition, [20, 100, getItem(r.itemId).armor]);
    const loaded = validateSave(JSON.parse(JSON.stringify(s))); assert.deepEqual(loaded, s);
    const before = structuredClone(s); assert.equal(craftDirewolfMoonfang(s, q).ok, false); assert.deepEqual(s, before);
    assert.match(direwolfResultHTML(r), /fully repaired/);
  }
});
test('bad, duplicate, named, forged and stale selections cannot spend materials or crowns', () => {
  const s = createGame(21); materials(s);
  for (const [hide, mail] of [[0, 2], [2, 2], [-1, 0], [2, 99], [null, 0], [2, .5]]) {
    const before = structuredClone(s); assert.equal(getDirewolfCraftQuote(s, hide, mail).ok, false); assert.deepEqual(s, before);
  }
  for (const id of [createFamedItemId(DIREWOLF_HIDE, 1), MOONFANG_ID]) {
    materials(s); s.inventory[2] = id; assert.equal(getDirewolfCraftQuote(s, 2, 0).ok, false);
  }
  for (const change of [x => x.gold--, x => x.inventoryCondition[2]++, x => x.direwolfCraftSerial++, x => x.position = { ...SETTLEMENTS[1] }]) {
    const state = createGame(21); materials(state); const quote = getDirewolfCraftQuote(state, 2, 0); change(state);
    const before = structuredClone(state); assert.equal(craftDirewolfMoonfang(state, quote).ok, false); assert.deepEqual(state, before);
  }
  materials(s); s.gold = 599; const before = structuredClone(s);
  assert.equal(craftDirewolfMoonfang(s, getDirewolfCraftQuote(s, 2, 0)).ok, false); assert.deepEqual(s, before);
});
test('all open settlements permit fusion; travel, occupation, battle and game over block it', () => {
  const s = createGame(21); materials(s);
  for (const town of SETTLEMENTS) { s.position = { x: town.x, y: town.y }; assert.equal(getDirewolfCraftQuote(s, 2, 0).ok, true, town.id); }
  const town = SETTLEMENTS[0]; s.position = { x: town.x, y: town.y };
  for (const change of [x => x.destination = { x: 100, y: 100 }, x => x.battle = {}, x => x.gameOver = true, x => x.ashenWinter.towns[town.id] = { status: 'occupied', force: { id: 'test' } }]) {
    const blocked = structuredClone(s); change(blocked); const before = structuredClone(blocked);
    assert.equal(getDirewolfCraftQuote(blocked, 2, 0).ok, false); assert.deepEqual(blocked, before);
  }
});
test('old saves remain valid, previews do not mutate the sequence and named probability is independent', () => {
  const s = createGame(21); delete s.direwolfCraftSerial; materials(s);
  const before = structuredClone(s);
  for (let i = 0; i < 10; i++) { getDirewolfCraftQuote(s, 2, 0); direwolfArmorerHTML(s, { hideIndex: 2, mailIndex: 0 }); }
  assert.deepEqual(s, before); assert.deepEqual(validateSave(s), before);
  craftDirewolfMoonfang(s, getDirewolfCraftQuote(s, 2, 0)); assert.equal(validateSave(s).direwolfCraftSerial, 1);
  for (const invalid of [-1, .5, '1', null, 1000001]) assert.throws(() => validateSave({ ...s, direwolfCraftSerial: invalid }));
  let named = 0; for (let seed = 0; seed < 100000; seed++) named += Number(direwolfCraftRoll(seed, 0).named);
  assert.ok(Math.abs(named / 100000 - .03) < .003);
  assert.notDeepEqual(direwolfCraftRoll(21, 0), direwolfCraftRoll(21, 1));
});
test('full stash, equip, resale, buyback and named combat saves preserve the harness', () => {
  const s = createGame(seedFor(true)); materials(s);
  while (s.inventory.length < 24) { s.inventory.push('cloth-hood'); s.inventoryCondition.push(20); }
  const r = craftDirewolfMoonfang(s, getDirewolfCraftQuote(s, 2, 0)); assert.equal(s.inventory.length, 23);
  const p = s.party[0]; assert.equal(equipItem(s, p.id, r.itemId).ok, true); assert.equal(getCompanyStats(p).maxBodyArmor, getItem(r.itemId).armor);
  assert.equal(unequipItem(s, p.id, 'armor').ok, true); s.gold = 50000;
  assert.equal(sellItem(s, r.itemId).ok, true); assert.equal(buyItem(s, r.itemId).ok, true);
  assert.equal(equipItem(s, p.id, r.itemId).ok, true);
  s.position = { x: 440, y: 520 }; assert.equal(startBattle(s, 'quarry-camp').ok, true);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
});

function fight(seed, armor, attachment = null, weapon = 'arming-sword') {
  const s = createGame(seed); s.position = { x: 440, y: 520 }; startBattle(s, 'quarry-camp');
  const b = s.battle, actor = b.units.find(u => u.id === 'captain'), target = b.units.find(u => u.id === 'enemy-1');
  for (const tile of b.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  b.units.forEach((u, i) => Object.assign(u, { q: 11, r: i }));
  Object.assign(actor, { q: 2, r: 3, perks: [], meleeSkill: 95, rangedSkill: 95, ap: 9, skillPreference: 'basic', bodyArmor: 0, equipment: { ...actor.equipment, armor, weapon, shield: null, attachment, attachment2: attachment } });
  Object.assign(target, { q: weapon === 'hunting-bow' ? 5 : 3, r: 3, hp: 300, maxHp: 300, headArmor: 100, bodyArmor: 100, attachmentArmor: 0, attachment2Armor: 0, meleeDefense: 0, rangedDefense: 0, morale: 75, resolve: 40, equipment: { ...target.equipment, shield: null, attachment: null } });
  b.turnIndex = b.turnOrder.indexOf(actor.id); b.activeId = actor.id;
  return { s, actor, target };
}
test('Moonfang intimidation applies to melee at zero durability, never doubles with fur, and respects shot/undead rules', () => {
  let hits = 0;
  for (let seed = 1; seed <= 8; seed++) {
    const base = fight(seed, DIREWOLF_MAIL), harness = fight(seed, MOONFANG_ID), layered = fight(seed, MOONFANG_ID, 'direwolf-fur');
    for (const f of [base, harness, layered]) advanceBattle(f.s);
    if (base.s.battle.lastEvent.type === 'attack') { assert.equal(base.target.morale - harness.target.morale, 5); assert.equal(layered.target.morale, harness.target.morale); hits++; }
    const shot = fight(seed, DIREWOLF_MAIL, null, 'hunting-bow'), wolfShot = fight(seed, MOONFANG_ID, null, 'hunting-bow');
    advanceBattle(shot.s); advanceBattle(wolfShot.s); assert.equal(shot.target.morale, wolfShot.target.morale);
    const undead = fight(seed, MOONFANG_ID); undead.target.undeadTraitsVersion = 1; advanceBattle(undead.s); assert.equal(undead.target.morale, 75);
  }
  assert.ok(hits > 0);
});
test('the craft-only item stays out of normal stock and recipe copy describes every cost and outcome', () => {
  const s = createGame(21); materials(s); assert.equal(getMarket(s).equipment.find(row => row.itemId === MOONFANG_ID).stock, 0);
  const html = direwolfArmorerHTML(s, { hideIndex: 2, mailIndex: 0 });
  for (const text of ['195 armor · 13 fatigue', 'Guaranteed crafting', '3%', '600 crowns', 'permanently consumed', 'does not stack']) assert.ok(html.toLowerCase().includes(text.toLowerCase()), text);
  assert.match(direwolfConfirmationHTML(getDirewolfCraftQuote(s, 2, 0)), /stash copy 3/);
});
test('transparent icon and worn layers are packaged, aligned and available offline for ordinary/named armor', async () => {
  const cache = new Set(await listOfflineAssets());
  for (const [name, width, height] of [['icon', 140, 280], ['portrait', 148, 110]]) {
    const path = `./assets/direwolf-moonfang/${name}.png`; const png = decodePng(readFileSync(new URL('../' + path, import.meta.url)));
    assert.deepEqual([png.width, png.height], [width, height]); assert.equal(png.rgba[3], 0);
    let transparent = 0, visible = 0; for (let i = 3; i < png.rgba.length; i += 4) png.rgba[i] === 0 ? transparent++ : visible++;
    assert.ok(transparent > width * height * .1); assert.ok(visible > width * height * .3); assert.ok(cache.has(path));
  }
  for (const id of [MOONFANG_ID, createFamedItemId(MOONFANG_ID, 71, 7)]) {
    assert.equal(itemImage(getItem(id)), './assets/direwolf-moonfang/icon.png');
    assert.match(portraitHTML({ name: 'Test', seed: 1 }, { armor: getItem(id) }), /data-layer="armor"[^>]*src="\.\/assets\/direwolf-moonfang\/portrait.png"[^>]*left:-26px;top:10px/);
  }
});
