import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DLC_SHIELDS} from '../src/dlc-shields.js';
import {DLC_SHIELD_ART} from '../src/dlc-shield-art.js';
import {ITEMS,createGame,getItem,createFamedItemId,shieldMaximum,equipItem,unequipItem,getCompanyStats,validateSave,getMarket,SETTLEMENTS,startBattle,getCampSites,advanceBattle} from '../src/engine.js';
import {itemImage,portraitHTML} from '../src/portraits.js';
import {equipmentCatalogHTML} from '../src/equipment-catalog.js';
import {regionalOutfit} from '../src/regional-enemies.js';
import {rollNamedItem} from '../src/named-rolls.js';
import {townDesign} from '../src/town-facilities.js';
import {listOfflineAssets} from '../tools/build-cache.mjs';
const source=JSON.parse(readFileSync(new URL('../assets/dlc-shields-source.json',import.meta.url)));
const png=uri=>Buffer.from(uri.split(',')[1],'base64');
const digest=uri=>createHash('sha256').update(png(uri)).digest('hex');
test('shield source inventory accounts for all classes with OG-balanced existing shield definitions',()=>{
 assert.equal(DLC_SHIELDS.length,26);assert.equal(source.records.length+source.excluded.length,39);
 assert.equal(new Set(ITEMS.map(i=>i.id)).size,ITEMS.length);
 for(const row of source.records){assert.deepEqual(getItem(row.item.id),row.item);assert.match(row.sourceSha256,/^[a-f0-9]{64}$/);}
 assert.equal(shieldMaximum('buckler'),16);assert.equal(shieldMaximum('kite-shield'),48);
 for(const item of DLC_SHIELDS){assert.equal(item.slot,'shield');assert.ok(item.defense>0&&item.rangedDefense>0&&item.durability>0);assert.ok(item.id.length<=40);}
});
test('every shield uses source inventory art and an offhand layer contained in the native portrait',()=>{
 for(const asset of source.assets){const item=getItem(asset.id),art=DLC_SHIELD_ART[asset.id];
  assert.equal(digest(itemImage(item)),asset.iconSha256);assert.equal(digest(art.portrait),asset.portraitSha256);
  assert.ok(art.left>=0&&art.top>=0&&art.left+art.width<=104&&art.top+art.height<=142);
  for(const id of [item.id,createFamedItemId(item.id,813)])for(const mount of [null,...ITEMS.filter(i=>i.slot==='mount')]){const html=portraitHTML({name:'Guard',seed:3},{shield:getItem(id),mount});assert.ok(html.includes(art.portrait));assert.ok([...html.matchAll(/style="([^"]*)"/g)].every(match=>!match[1].includes('NaN')),`${id}: mounted geometry must remain finite`);}
 }
 const html=equipmentCatalogHTML();for(const item of DLC_SHIELDS)assert.ok(html.includes(`data-inspect="${item.id}"`));assert.ok(html.includes('Shield · +'));
 const assets=listOfflineAssets();return assets.then(rows=>{assert.ok(rows.includes('./src/dlc-shields.js'));assert.ok(rows.includes('./src/dlc-shield-art.js'));});
});
test('ordinary and named shields retain broken/damaged condition, defenses and rolled bonuses through saves',()=>{
 for(const base of DLC_SHIELDS)for(const id of [base.id,createFamedItemId(base.id,1234)])for(const condition of [0,7]){
  const state=createGame(813),bro=state.party[0],item=getItem(id);state.inventory.push(id);state.inventoryCondition.push(condition);
  const plain=getCompanyStats({...bro,equipment:{...bro.equipment,shield:null}});
  assert.equal(equipItem(state,bro.id,id).ok,true);assert.equal(bro.armorDurability.shield,condition);
  const stats=getCompanyStats(bro);assert.equal(stats.meleeDefense-plain.meleeDefense,condition?item.defense:0);assert.equal(stats.rangedDefense-plain.rangedDefense,condition?item.rangedDefense:0);
  assert.deepEqual(validateSave(validateSave(structuredClone(state))),state);
  assert.equal(unequipItem(state,bro.id,'shield').ok,true);assert.equal(state.inventoryCondition[state.inventory.indexOf(id)],condition);
  if(base.sourceNamedShield){assert.equal(item.rarity,'named');assert.equal(item.rollModifiers.length,2);assert.deepEqual(getItem(id),getItem(id));}
 }
});
test('ancient shields stay out of living shops; southern shields respect region and existing bearers recover imported gear',()=>{
 const ancient=DLC_SHIELDS.filter(i=>i.sourceCulture==='ancient'),south=DLC_SHIELDS.filter(i=>i.region==='south');
 for(const item of ancient)for(const town of SETTLEMENTS)assert.equal(townDesign(item,town),false);
 assert.ok(south.some(i=>i.name.includes('Sipar')));
 const bearer={name:'Guard',weapon:'arming-sword',shield:'round-shield',armor:'mail-shirt',helmet:'iron-helm'};
 for(const theme of ['ancient','south','mercenary']){let seen=false;for(let seed=0;seed<40;seed++){const u=regionalOutfit(bearer,seed,0,100,100,3,{theme});const item=getItem(u.shield);if(DLC_SHIELDS.some(s=>s.id===item.id)){seen=true;assert.equal(item.sourceCulture==='ancient',theme==='ancient');}}
 assert.equal(seen,true,theme);const archer=regionalOutfit({...bearer,weapon:'hunting-bow',shield:null},1,0,100,100,3,{theme});assert.equal(archer.shield,null);}
 const state=createGame(817);let ordinary=false,named=false;
 for(const day of [1,8,15,22,29,36])for(const town of SETTLEMENTS){state.day=day;state.position={x:town.x,y:town.y};for(const row of getMarket(state).equipment.filter(r=>r.stock>0)){const item=getItem(row.itemId);if(DLC_SHIELDS.some(s=>s.id===(item.baseId??item.id))){if(item.rarity==='named')named=true;else ordinary=true;}}}
 assert.equal(ordinary,true);assert.equal(named,true);
});
test('an imported shield can block, break and validate in actual combat',()=>{
 const state=createGame(818),id='bb-auxiliary-shield';state.inventory.push(id);state.inventoryCondition.push(1);equipItem(state,state.party[0].id,id);
 const camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};startBattle(state,camp.id);
 const b=state.battle,actor=b.units.find(u=>u.side==='enemy'),target=b.units.find(u=>u.id===state.party[0].id);
 for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
 for(const u of b.units)if(u!==actor&&u!==target){u.alive=false;u.hp=0;u.ap=0;}
 Object.assign(actor,{q:3,r:2,ap:9,turnStartedRound:b.round});actor.equipment.weapon='arming-sword';Object.assign(target,{q:2,r:2});
 b.activeId=actor.id;b.turnIndex=b.turnOrder.indexOf(actor.id);advanceBattle(state);assert.equal(target.shieldDurability,0);assert.equal(target.equipment.shield,id);validateSave(structuredClone(state));
});

test('named shield durability rolls start from source durability rather than a previously improved display roll',()=>{
 for(const base of DLC_SHIELDS.filter(i=>i.sourceNamedShield))for(const seed of [0,1,1234,4294967295])for(const version of [3,7]){
  const id=createFamedItemId(base.id,seed,version),actual=getItem(id);
  const expected=rollNamedItem(base,id,seed,{merged:true,rangeRoll:version>=4,rulesVersion:version,shieldDurability:base.sourceStats.durability});
  assert.deepEqual(actual,expected,base.id);assert.ok(actual.durability<=Math.round(base.sourceStats.durability*1.6));
 }
});

test('pre-shield blacksmith quests retain their exact accepted enemy roster on reload',()=>{
 const state=createGame(731);state.legendaryBlacksmith=JSON.parse(readFileSync(new URL('./fixtures/blacksmith-before-shields.json',import.meta.url)));
 const loaded=validateSave(structuredClone(state));
 assert.deepEqual(loaded.legendaryBlacksmith,state.legendaryBlacksmith);
 assert.equal(loaded.legendaryBlacksmith.quests[1].encounter.shieldDesignsVersion,undefined);
});
