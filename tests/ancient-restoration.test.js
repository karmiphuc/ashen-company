import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createGame, getItem, ITEMS, SETTLEMENTS, getCampSites, getAncientRestorationQuote, restoreAncientEquipment, validateSave, equipItem, unequipItem, sellItem, buyItem, getMarket, getCompanyStats, createFamedItemId, startBattle, retreatBattle, finishBattle } from '../src/engine.js';
import { ancientRestorationOutcome, ancientRestorationRolls, RESTORED_ANCIENT_ITEMS, restoredAncientId, ANCIENT_RESTORATION_TARGETS, ancientRestorationRecipe } from '../src/ancient-restoration.js';
import { ancientArmorerHTML, ancientRestorationConfirmationHTML, ancientRestorationResultHTML } from '../src/ancient-armorer-ui.js';
import { townActionsHTML } from '../src/campaign-ui.js';
import { getItemDetails } from '../src/item-details.js';
import { itemImage, portraitHTML } from '../src/portraits.js';
import { DLC_ART } from '../src/dlc-art.js';
import { ANCIENT_RESTORATION_ART } from '../src/ancient-restoration-art.js';
import { equipmentSetStatus } from '../src/equipment-sets.js';
import { extractForgeAffixes, encodeBoundedForgeItem } from '../src/reforged-items.js';
import { decodePng } from '../tools/content/restore-ancient-art.mjs';
import { listOfflineAssets } from '../tools/build-cache.mjs';

const body = 'bb-ancient-plate-harness', head = 'bb-ancient-honorguard-helmet';
const catalog = id => ITEMS.find(item => item.id === id);
function materials(state, source = body, extra = []) {
  const count = getItem(source).slot === 'armor' ? 3 : 2;
  state.inventory = [...Array(count).fill(source), ...extra];
  state.inventoryCondition = state.inventory.map((id, index) => index < count ? Math.max(0, getItem(id).armor - index * 45) : getItem(id).armor ?? null);
  return Array.from({ length: count }, (_, i) => i);
}
function seedFor(finish, named = false) {
  for (let seed = 0; seed < 20000; seed++) {
    const r = ancientRestorationRolls(seed, 0);
    if (r.finish === finish && r.named === named) return seed;
  }
  throw new Error('Outcome not found.');
}
function craft(finish, named = false, source = body) {
  const state = createGame(seedFor(finish, named));
  const indices = materials(state, source, ['cloth-hood']);
  const quote = getAncientRestorationQuote(state, indices);
  assert.equal(quote.ok, true);
  const outcome = restoreAncientEquipment(state, quote);
  assert.equal(outcome.ok, true);
  return { state, quote, outcome };
}

test('exact probability boundaries and successful-only named rolls', () => {
  assert.deepEqual(ancientRestorationOutcome(0, 0), { finish: 'bronze', named: true });
  assert.deepEqual(ancientRestorationOutcome(.799999, .03), { finish: 'bronze', named: false });
  assert.deepEqual(ancientRestorationOutcome(.8, .029999), { finish: 'steel', named: true });
  assert.deepEqual(ancientRestorationOutcome(.899999, .5), { finish: 'steel', named: false });
  assert.deepEqual(ancientRestorationOutcome(.9, 0), { finish: null, named: false });
  for (const value of [1, -1, NaN, Infinity, '0']) assert.throws(() => ancientRestorationOutcome(value, 0));
});

test('seeded primary and independent named outcomes have the requested distributions', () => {
  const counts = { bronze: 0, steel: 0, failure: 0, namedBronze: 0, namedSteel: 0 };
  for (let serial = 0; serial < 100000; serial++) {
    const r = ancientRestorationRolls(7391, serial); counts[r.finish ?? 'failure']++;
    if (r.named) counts[r.finish === 'bronze' ? 'namedBronze' : 'namedSteel']++;
  }
  assert.ok(Math.abs(counts.bronze / 100000 - .8) < .008);
  assert.ok(Math.abs(counts.steel / 100000 - .1) < .005);
  assert.ok(Math.abs(counts.failure / 100000 - .1) < .005);
  assert.ok(Math.abs(counts.namedBronze / counts.bronze - .03) < .004);
  assert.ok(Math.abs(counts.namedSteel / counts.steel - .03) < .008);
});

test('approved stats and all explicit variants resolve against immutable restored baselines', () => {
  for (const [source, bronzeStats, steelStats] of [
    ['bb-ancient-breastplate', [180, 16], [216, 18]],
    [body, [260, 20], [312, 22]],
    ['bb-ancient-plated-scale-hauberk', [280, 22], [336, 25]],
  ]) for (const [finish, expected] of [['bronze', bronzeStats], ['steel', steelStats]]) {
    const item = getItem(restoredAncientId(source, finish));
    assert.deepEqual([item.armor, item.fatigue], expected);
    assert.equal(item.restorationSourceId, source); assert.ok(Object.isFrozen(item));
  }
  for (const item of RESTORED_ANCIENT_ITEMS) {
    assert.ok(item.id.length <= 40); assert.ok(item.armor / item.fatigue > 10);
    const named = getItem(createFamedItemId(item.id, 71, 7));
    assert.equal(named.restorationSourceId, item.restorationSourceId); assert.equal(named.restorationFinish, item.restorationFinish);
    assert.ok(named.armor > item.armor); assert.ok(named.fatigue <= item.fatigue);
    assert.ok(getItemDetails(named).notes.some(note => note.includes('Restored Ancient Armory')));
  }
  assert.equal(restoredAncientId('bb-ancient-priest-attire', 'bronze'), null);
});

test('all four successful result types consume exact copies, create full condition, survive reload, and reject replay', () => {
  for (const finish of ['bronze', 'steel']) for (const named of [false, true]) {
    const { state, quote, outcome } = craft(finish, named);
    assert.equal(state.gold, 280); assert.equal(state.ancientRestorationSerial, 1);
    assert.equal(outcome.finish, finish); assert.equal(outcome.named, named);
    assert.deepEqual(state.inventory, ['cloth-hood', outcome.itemId]);
    assert.equal(state.inventoryCondition[1], getItem(outcome.itemId).armor);
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
    const before = structuredClone(state);
    assert.equal(restoreAncientEquipment(state, quote).ok, false); assert.deepEqual(state, before);
    assert.match(ancientRestorationResultHTML(outcome), /fully repaired/);
  }
});

test('failure refunds half the calculated fee; helmets still use two pieces', () => {
  for (const [source, netFee, count] of [[body, 310, 3], [head, 280, 2]]) {
    const { state, quote, outcome } = craft(null, false, source);
    assert.equal(quote.count, count); assert.equal(state.gold, 900 - netFee);
    assert.deepEqual(state.inventory, ['cloth-hood']); assert.deepEqual(state.inventoryCondition, [20]);
    assert.equal(outcome.itemId, null); assert.equal(outcome.named, false); assert.equal(outcome.refund, netFee);
    assert.equal(state.ancientRestorationSerial, 1); assert.deepEqual(validateSave(state), state);
  }
  const { state, outcome } = craft('steel', false, head);
  assert.equal(state.gold, 340); assert.equal(getItem(outcome.itemId).armor, 288); assert.equal(getItem(outcome.itemId).fatigue, 18);
});

test('full stash crafting replaces materials without requiring another slot', () => {
  const state = createGame(seedFor('bronze')); const indices = materials(state);
  while (state.inventory.length < 24) { state.inventory.push('cloth-hood'); state.inventoryCondition.push(20); }
  assert.equal(restoreAncientEquipment(state, getAncientRestorationQuote(state, indices)).ok, true);
  assert.equal(state.inventory.length, 22); assert.deepEqual(validateSave(state), state);
});

test('invalid material selections, stale quotes and insufficient funds never mutate the company', () => {
  const s = createGame(19); materials(s);
  for (const indices of [[], [0, 1], [0, 0, 1], [-1, 0, 1], [0, 1, 99], [0, 1, 2.5]]) {
    const before = structuredClone(s); assert.equal(getAncientRestorationQuote(s, indices).ok, false); assert.deepEqual(s, before);
  }
  for (const id of ['plate-harness', 'bb-ancient-priest-attire', restoredAncientId(body, 'bronze'), createFamedItemId(body, 71)]) {
    materials(s, id); const before = structuredClone(s);
    assert.equal(getAncientRestorationQuote(s, [0, 1, 2]).ok, false); assert.deepEqual(s, before);
  }
  materials(s); s.inventory[2] = 'bb-ancient-mail'; assert.equal(getAncientRestorationQuote(s, [0, 1, 2]).ok, false);
  for (const mutate of [x => x.gold--, x => x.inventoryCondition[0]--, x => x.ancientRestorationSerial++, x => x.position = { ...SETTLEMENTS[1] }]) {
    materials(s); const quote = getAncientRestorationQuote(s, [0, 1, 2]); mutate(s);
    const before = structuredClone(s); assert.equal(restoreAncientEquipment(s, quote).ok, false); assert.deepEqual(s, before);
  }
  materials(s); s.gold = 619; const quote = getAncientRestorationQuote(s, [0, 1, 2]), before = structuredClone(s);
  assert.equal(restoreAncientEquipment(s, quote).ok, false); assert.deepEqual(s, before);
});

test('every open settlement offers restoration, independently of workshops, and closure/travel/combat blocks it', () => {
  const s = createGame(19); materials(s);
  for (const town of SETTLEMENTS) {
    s.position = { x: town.x, y: town.y };
    assert.equal(getAncientRestorationQuote(s, [0, 1, 2]).ok, true, town.id);
    assert.match(townActionsHTML(s, town.id), /data-action="ancient-armorer"/);
  }
  const town = SETTLEMENTS[0]; s.position = { x: town.x, y: town.y };
  for (const mutate of [x => x.ashenWinter.towns[town.id] = { status: 'occupied', force: { id: 'test-occupation' } }, x => x.destination = { x: 200, y: 200 }, x => x.battle = {}, x => x.gameOver = true, x => x.position = { x: 0, y: 0 }]) {
    const blocked = structuredClone(s); mutate(blocked); const before = structuredClone(blocked);
    assert.equal(getAncientRestorationQuote(blocked, [0, 1, 2]).ok, false); assert.deepEqual(blocked, before);
  }
});

test('old saves omit the serial; previews cannot mutate or reroll, and post-attempt saves retain the next roll', () => {
  const s = createGame(seedFor('bronze')); delete s.ancientRestorationSerial; materials(s);
  const before = structuredClone(s);
  for (let i = 0; i < 10; i++) { getAncientRestorationQuote(s, [0, 1, 2]); ancientArmorerHTML(s, { sourceId: body, indices: [0, 1, 2] }); }
  assert.deepEqual(s, before); assert.deepEqual(validateSave(s), before);
  restoreAncientEquipment(s, getAncientRestorationQuote(s, [0, 1, 2]));
  const loaded = validateSave(JSON.parse(JSON.stringify(s)));
  assert.equal(loaded.ancientRestorationSerial, 1);
  assert.deepEqual(ancientRestorationRolls(loaded.seed, loaded.ancientRestorationSerial), ancientRestorationRolls(s.seed, s.ancientRestorationSerial));
  for (const invalid of [-1, .5, '1', 1000001, null]) assert.throws(() => validateSave({ ...loaded, ancientRestorationSerial: invalid }));
});

test('restored and named gear retain finish through forge identities, equip, resale/buyback and combat saves', () => {
  const { state, outcome } = craft('steel', true);
  const item = getItem(outcome.itemId), affixes = extractForgeAffixes(item, catalog);
  const forged = getItem(encodeBoundedForgeItem(item.baseId, affixes, catalog));
  assert.equal(forged.armor, item.armor); assert.equal(forged.restorationFinish, 'steel');
  assert.equal(itemImage(forged), itemImage(item));
  state.gold = 50000;
  assert.equal(equipItem(state, 'captain', item.id).ok, true);
  const helmet = restoredAncientId(head, 'bronze'); state.inventory.push(helmet); state.inventoryCondition.push(getItem(helmet).armor);
  assert.equal(equipItem(state, 'captain', helmet).ok, true);
  assert.equal(equipmentSetStatus(state.party[0], getItem).set.id, 'ancient');
  assert.equal(equipmentSetStatus(state.party[0], getItem).active, true);
  assert.ok(getCompanyStats(state.party[0]).maxBodyArmor > item.armor);
  assert.equal(unequipItem(state, 'captain', 'armor').ok, true);
  assert.equal(sellItem(state, item.id).ok, true); assert.equal(buyItem(state, item.id).ok, true);
  assert.equal(equipItem(state, 'captain', item.id).ok, true);
  const camp = getCampSites(state).find(c => c.id === 'quarry-camp'); state.position = { x: camp.x, y: camp.y };
  assert.equal(startBattle(state, camp.id).ok, true); assert.deepEqual(validateSave(state), state);
  retreatBattle(state); finishBattle(state); assert.deepEqual(validateSave(state), state);
});

test('normal stock never contains craft-only variants; UI states exact odds, costs and losses', () => {
  const s = createGame(7391); materials(s);
  const market = getMarket(s);
  for (const item of RESTORED_ANCIENT_ITEMS) assert.equal(market.equipment.find(row => row.itemId === item.id).stock, 0);
  const html = ancientArmorerHTML(s, { sourceId: body, indices: [0, 1, 2] });
  assert.match(html, /80% bronze · 10% silverish steel · 10% failure/);
  assert.match(html, /separate 3%/); assert.match(html, /260 armor · 20 fatigue/); assert.match(html, /312 armor · 22 fatigue/);
  assert.match(ancientRestorationConfirmationHTML(getAncientRestorationQuote(s, [0, 1, 2])), /310 crowns refunded/);
});

test('all filtered sprites retain dimensions, every alpha value and original portrait anchors, and are cached offline', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/ancient-restoration/source-manifest.json', import.meta.url)));
  const cache = new Set(await listOfflineAssets());
  assert.equal(manifest.assets.length, 44);
  for (const record of manifest.assets) {
    const source = DLC_ART[record.sourceId], bytes = readFileSync(new URL('../' + record.path, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
    const original = decodePng(source[record.layer]), output = decodePng(bytes);
    assert.deepEqual([output.width, output.height], [original.width, original.height]);
    let changed = 0;
    for (let i = 0; i < output.rgba.length; i += 4) {
      assert.equal(output.rgba[i + 3], original.rgba[i + 3]);
      if (original.rgba[i + 3] === 0) assert.deepEqual(output.rgba.subarray(i, i + 4), original.rgba.subarray(i, i + 4));
      if (!output.rgba.subarray(i, i + 3).equals(original.rgba.subarray(i, i + 3))) changed++;
    }
    assert.ok(changed > 0); assert.ok(cache.has('./' + record.path));
    const spec = ANCIENT_RESTORATION_ART[record.sourceId][record.finish];
    for (const key of ['left', 'top', 'width', 'height', 'hideHead', 'hideBeard']) assert.equal(spec[key], source[key]);
  }
  for (const name of ['ancient-restoration.js', 'ancient-restoration-art.js', 'ancient-armorer-ui.js']) assert.ok(cache.has('./src/' + name));
  const armor = getItem(restoredAncientId(body, 'steel')), helmet = getItem(restoredAncientId(head, 'bronze'));
  const html = portraitHTML({ name: 'Test', seed: 1 }, { armor, helmet });
  assert.match(html, /src="\.\/assets\/ancient-restoration\/bb-ancient-plate-harness-steel-portrait.png"/);
  assert.match(html, /bb-ancient-honorguard-helmet-bronze-portrait.png/);
});

test('every restoration fee uses repaired bronze protection and fatigue, including exact affordability', () => {
  for (const sourceId of Object.keys(ANCIENT_RESTORATION_TARGETS)) {
    const bronze = getItem(restoredAncientId(sourceId, 'bronze'));
    const fee = bronze.armor * 2 + bronze.fatigue * 5;
    assert.equal(ancientRestorationRecipe(sourceId).fee, fee);
    const s = createGame(seedFor('bronze'));
    const indices = materials(s, sourceId);
    s.inventoryCondition.fill(0);
    s.gold = fee - 1;
    const quote = getAncientRestorationQuote(s, indices);
    assert.equal(quote.fee, fee); assert.equal(quote.refund, Math.floor(fee / 2));
    assert.equal(quote.affordable, false);
    const before = structuredClone(s);
    assert.equal(restoreAncientEquipment(s, quote).ok, false);
    assert.deepEqual(s, before);
    s.gold = fee;
    assert.equal(restoreAncientEquipment(s, getAncientRestorationQuote(s, indices)).ok, true);
    assert.equal(s.gold, 0);
  }
});

test('failure refunds stay whole and saveable for every calculated recipe fee', () => {
  for (const sourceId of Object.keys(ANCIENT_RESTORATION_TARGETS)) {
    const s = createGame(seedFor(null));
    const indices = materials(s, sourceId);
    const quote = getAncientRestorationQuote(s, indices);
    const outcome = restoreAncientEquipment(s, quote);
    assert.equal(outcome.ok, true); assert.equal(outcome.crafted, false);
    assert.equal(outcome.refund, Math.floor(quote.fee / 2));
    assert.equal(s.gold, 900 - quote.fee + Math.floor(quote.fee / 2));
    assert.ok(Number.isSafeInteger(s.gold));
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
    assert.match(ancientArmorerHTML(createGame(51), { sourceId, indices: [] }), new RegExp(`Failure returns ${quote.refund} of ${quote.fee} crowns`));
  }
});
