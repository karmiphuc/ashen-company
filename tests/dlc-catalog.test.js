import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DLC_ITEMS } from '../src/dlc-items.js';
import { DLC_ART } from '../src/dlc-art.js';
import { ITEMS, createGame, equipItem, unequipItem, buyItem, getItem, getCompanyStats, getMarket, validateSave } from '../src/engine.js';
import { itemImage, portraitHTML } from '../src/portraits.js';
import { listOfflineAssets } from '../tools/build-cache.mjs';

const manifest = JSON.parse(readFileSync(new URL('../assets/dlc-equipment-source.json', import.meta.url), 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = uri => Buffer.from(uri.slice('data:image/png;base64,'.length), 'base64');

test('catalog covers every concrete human equipment class in the pinned source with recorded source baselines and deterministic rare bonuses', () => {
  assert.equal(manifest.commit, 'e06d68df0915827967f98a05d0c705c1f53df0b7');
  assert.equal(DLC_ITEMS.length, 217);
  assert.equal(DLC_ITEMS.filter(item=>item.slot==='armor').length, 104);
  assert.equal(DLC_ITEMS.filter(item=>item.slot==='helmet').length, 113);
  assert.equal(manifest.records.length + manifest.excluded.length, 256);
  assert.equal(new Set([...manifest.records.map(row=>row.source), ...manifest.excluded.map(row=>row.path)]).size, 256);
  assert.equal(new Set(ITEMS.map(item=>item.id)).size, ITEMS.length);
  for(const collection of ['supporter-edition','base','warriors-of-the-north','blazing-deserts','beasts-and-exploration','of-flesh-and-faith','lindwurm']) assert.ok(DLC_ITEMS.some(item=>item.collection===collection),collection);
  for(const record of manifest.records){
    const item=getItem(record.item.id);
    assert.deepEqual(item,record.item);
    const famed=getItem(`famed:${item.id}:12345`);
    assert.ok(famed.price>=item.price,`${item.id} famed gear retains premium value`);
    if(record.sourceValue===0&&item.armor>=200)assert.ok(item.price>=1000,'NPC zero value cannot create cheap elite armor');
    assert.ok(item.id.length<=40 && item.price>0 && Number.isInteger(item.armor) && item.armor<=500);
    assert.match(record.sourceSha256,/^[a-f0-9]{64}$/);
    assert.ok(item.description.length>20 && item.role.length>45);
  }
});

test('all inventory icons and actual worn atlas layers match provenance and render ordinary and famed designs', () => {
  for(const asset of manifest.assets){
    const item=getItem(asset.id),art=DLC_ART[asset.id];
    assert.equal(digest(bytes(itemImage(item))),asset.iconSha256,asset.id);
    const png=bytes(art.portrait);
    assert.equal(digest(png),asset.portraitSha256,asset.id);
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png.readUInt32BE(16),asset.crop[2]-asset.crop[0]);
    assert.equal(png.readUInt32BE(20),asset.crop[3]-asset.crop[1]);
    assert.ok(Number.isFinite(art.left)&&Number.isFinite(art.top));
    for(const piece of [item,getItem(`famed:${item.id}:123`)]){
      const html=portraitHTML({name:'Veteran',seed:3},{[item.slot]:piece});
      assert.ok(html.includes(art.portrait),`${item.id} uses its worn art`);
      if(art.hideHead&&item.slot==='helmet')assert.ok(!html.includes('data-layer="head"'));
    }
  }
});

test('each ordinary and famed design preserves damaged condition through equip, stow and repeated save imports', () => {
  for(const base of DLC_ITEMS)for(const id of [base.id,`famed:${base.id}:1234`]){
    const item=getItem(id),state=createGame(813),brother=state.party[0];
    state.inventory.push(id);state.inventoryCondition.push(Math.max(0,item.armor-9));
    assert.equal(equipItem(state,brother.id,id).ok,true);
    const conditionKey=item.slot==='armor'?'body':'head';
    assert.equal(brother.armorDurability[conditionKey],Math.max(0,item.armor-9));
    assert.equal(getCompanyStats(brother)[item.slot==='armor'?'maxBodyArmor':'maxHeadArmor'],item.armor);
    assert.deepEqual(validateSave(validateSave(state)),state);
    assert.equal(unequipItem(state,brother.id,item.slot).ok,true);
    assert.equal(state.inventoryCondition[state.inventory.indexOf(id)],Math.max(0,item.armor-9));
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))),state);
  }
});

test('old market imports fill missing DLC rows once and never replenish a bought item', async () => {
  const state=createGame(914);const offered=getMarket(state).equipment.find(row=>row.stock>0&&row.buyPrice<=state.gold);
  assert.equal(buyItem(state,offered.itemId).ok,true);
  for(const item of DLC_ITEMS)delete state.marketStock.oakwatch.equipment[item.id];
  const before=structuredClone(state),restored=validateSave(state);
  assert.deepEqual(state,before);
  for(const item of DLC_ITEMS)assert.ok(Number.isInteger(restored.marketStock.oakwatch.equipment[item.id]));
  assert.equal(restored.marketStock.oakwatch.equipment[offered.itemId],state.marketStock.oakwatch.equipment[offered.itemId]);
  assert.deepEqual(validateSave(restored),restored);
  const assets=await listOfflineAssets();
  for(const file of ['dlc-items.js','dlc-art.js','geography.js'])assert.ok(assets.includes(`./src/${file}`));
});

test('malformed DLC IDs and out-of-range equipment condition are rejected atomically', () => {
  const state=createGame(921);state.inventory.push('bb-missing-dlc-armor');state.inventoryCondition.push(1);
  const before=structuredClone(state);assert.throws(()=>validateSave(state));assert.deepEqual(state,before);
  const known=createGame(922),item=DLC_ITEMS.find(item=>item.armor>0);
  known.inventory.push(item.id);known.inventoryCondition.push(item.armor+1);
  assert.throws(()=>validateSave(known));
});

test('a campaign trading in every settlement stays exportable with the expanded save limit', async () => {
  const { SETTLEMENTS, MAX_SAVE_FILE_BYTES } = await import('../src/engine.js');
  const state=createGame(933);state.gold=100000;
  for(const town of SETTLEMENTS){
    state.position={x:town.x,y:town.y};
    const offer=getMarket(state).equipment.find(row=>row.stock>0&&row.buyPrice<=state.gold);
    assert.ok(offer,town.id);assert.equal(buyItem(state,offer.itemId).ok,true);
  }
  const json=JSON.stringify(state,null,2);
  assert.ok(Buffer.byteLength(json)>250000,'fixture exceeds the old import limit');
  assert.ok(Buffer.byteLength(json)<MAX_SAVE_FILE_BYTES);
  assert.deepEqual(validateSave(JSON.parse(json)),state);
});

test('collection browser lists every design, filters expansions, escapes text, and exposes safe inspection actions', async () => {
  const { equipmentCatalogHTML } = await import('../src/equipment-catalog.js');
  const all=equipmentCatalogHTML();assert.equal((all.match(/data-item-source="catalog"/g)||[]).length,264);
  const south=equipmentCatalogHTML('blazing-deserts');
  assert.equal((south.match(/data-item-source="catalog"/g)||[]).length,DLC_ITEMS.filter(item=>item.collection==='blazing-deserts').length);
  assert.ok(!south.includes('data-inspect="bb-heavy-iron-armor"'));
  assert.equal(equipmentCatalogHTML('<script>'),all);
  assert.ok(all.includes('data-catalog-filter'));
});
