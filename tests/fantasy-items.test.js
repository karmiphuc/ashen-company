import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { FANTASY_ITEMS } from '../src/fantasy-items.js';
import { FANTASY_APPEARANCES } from '../src/fantasy-art.js';
import { ITEMS, SETTLEMENTS, createGame, equipItem, getCompanyStats, getItem, getMarket, validateSave } from '../src/engine.js';
import { getItemDetails } from '../src/item-details.js';
import { itemImage, portraitHTML } from '../src/portraits.js';
import { listOfflineAssets } from '../tools/build-cache.mjs';

const MANIFEST = JSON.parse(readFileSync(new URL('../assets/fantasy-samurai-source.json', import.meta.url), 'utf8'));
const FANTASY_IDS = new Set(FANTASY_ITEMS.map(item => item.id));

test('all 24 fantasy and samurai items equip and survive a save round trip with correct armor limits', () => {
  assert.equal(FANTASY_ITEMS.length, 24);
  assert.equal(FANTASY_IDS.size, FANTASY_ITEMS.length);
  assert.equal(new Set(ITEMS.map(item => item.id)).size, ITEMS.length);
  for (const item of FANTASY_ITEMS) {
    assert.equal(getItem(item.id), item);
    const details = getItemDetails(item);
    assert.equal(details.description, item.description);
    assert.ok(details.role && details.stats.length >= 2 && details.notes.length >= 2, item.id);

    const state = createGame(318);
    state.inventory.push(item.id);
    state.inventoryCondition.push(item.armor);
    const member = state.party[0];
    assert.equal(equipItem(state, member.id, item.id).ok, true, item.id);
    assert.equal(member.equipment[item.slot], item.id);
    const stats = getCompanyStats(member);
    const key = item.slot === 'armor' ? 'body' : 'head';
    const maxKey = item.slot === 'armor' ? 'maxBodyArmor' : 'maxHeadArmor';
    assert.equal(member.armorDurability[key], item.armor, item.id);
    assert.equal(stats[maxKey], item.armor, item.id);
    const restored = validateSave(JSON.parse(JSON.stringify(state)));
    assert.deepEqual(restored, state);
    assert.equal(getCompanyStats(restored.party[0])[maxKey], item.armor, item.id);
  }
});

test('weekly armory budgets keep the new gear scarce while every item can appear', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 120; seed++) {
    const state = createGame(seed);
    for (const day of [1, 8, 15, 22]) {
      state.day = day;
      for (const town of SETTLEMENTS) {
        state.position = { x: town.x, y: town.y };
        const market = getMarket(state);
        const stocked = market.equipment.filter(row => row.stock > 0).map(row => getItem(row.itemId));
        for (const item of stocked) if (FANTASY_IDS.has(item.id)) seen.add(item.id);
        assert.ok(stocked.filter(item => FANTASY_IDS.has(item.id)).length < FANTASY_ITEMS.length);
        if (market.event?.type === 'armorer-shipment') continue;
        const better = stocked.filter(item => item.slot !== 'mount' && item.price >= 250 && item.price < 450);
        const premium = stocked.filter(item => item.slot !== 'mount' && item.price >= 450);
        const broadTown = town.kind === 'city' || town.kind === 'fort';
        assert.ok(better.length <= (broadTown ? 4 : town.kind === 'town' ? 3 : 2), `${town.id} day ${day} better stock`);
        assert.ok(premium.length <= (broadTown ? 2 : town.kind === 'town' ? 1 : 0), `${town.id} day ${day} premium stock`);
      }
    }
    if (seen.size === FANTASY_ITEMS.length) break;
  }
  assert.deepEqual(seen, FANTASY_IDS);
});

test('legacy saved markets gain the new catalog without changing their saved stock', () => {
  const oldSave = createGame(7);
  const originalEquipment = Object.fromEntries(ITEMS.filter(item => !FANTASY_IDS.has(item.id)).map(item => [item.id, 0]));
  originalEquipment['quilted-jack'] = 2;
  oldSave.marketStock.oakwatch = {
    day: 1, food: 20, goods: { grain: 3, timber: 3, iron: 3, salt: 3, wool: 3 },
    equipment: originalEquipment,
  };
  const migrated = validateSave(JSON.parse(JSON.stringify(oldSave)));
  assert.equal(migrated.marketStock.oakwatch.equipment['quilted-jack'], 2);
  for (const item of FANTASY_ITEMS) {
    assert.ok(Number.isSafeInteger(migrated.marketStock.oakwatch.equipment[item.id]), item.id);
    assert.ok(migrated.marketStock.oakwatch.equipment[item.id] >= 0, item.id);
  }
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(migrated))), migrated);
});

test('the 73 imported rasters match their manifest and resolve in item and appearance portraits', async () => {
  assert.equal(MANIFEST.assets.length, 73);
  assert.equal(new Set(MANIFEST.assets.map(asset => asset.destination)).size, MANIFEST.assets.length);
  const cached = new Set(await listOfflineAssets());
  for (const module of ['src/fantasy-art.js', 'src/fantasy-items.js']) assert.ok(cached.has(`./${module}`));
  for (const asset of MANIFEST.assets) {
    const bytes = readFileSync(new URL(`../${asset.destination}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.destination);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', asset.destination);
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    assert.ok(width > 0 && height > 0 && width <= 1024 && height <= 1024, asset.destination);
    if (asset.kind === 'worn-layer') {
      assert.equal(width, asset.geometry[1] - asset.geometry[0], asset.destination);
      assert.equal(height, asset.geometry[3] - asset.geometry[2], asset.destination);
      assert.ok(asset.anchor.length === 2 && asset.anchor.every(Number.isFinite), asset.destination);
    }
    assert.ok(cached.has(`./${asset.destination}`), asset.destination);
  }
  for (const item of FANTASY_ITEMS) {
    assert.equal(itemImage(item), `assets/items/${item.id}.png`);
    const html = portraitHTML({ seed: 3, name: 'Traveler' }, { [item.slot]: item });
    assert.ok(html.includes(`assets/portraits/${item.id}.png`), item.id);
  }
  assert.deepEqual(new Set(Object.keys(FANTASY_APPEARANCES)), new Set(['elf', 'half-orc', 'dwarf', 'goblin', 'samurai', 'ninja']));
  for (const appearanceId of Object.keys(FANTASY_APPEARANCES)) {
    const html = portraitHTML({ seed: 21, name: 'Traveler', appearanceId });
    const sources = [...html.matchAll(/src="(assets\/portraits\/[^\"]+)"/g)].map(match => match[1]);
    assert.ok(sources.length >= 2, appearanceId);
    for (const source of sources) assert.doesNotThrow(() => readFileSync(new URL(`../${source}`, import.meta.url)), source);
  }
});
