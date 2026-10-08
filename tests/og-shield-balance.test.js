import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ITEMS,createGame,getItem,shieldMaximum,validateSave,retreatBattle,finishBattle,getUndeadEncounters,SETTLEMENTS} from '../src/engine.js';
import {PREVIOUS_SHIELDS,previousShieldId,currentShieldId,migrateShieldBalance} from '../src/shield-balance.js';
import {encodeBoundedForgeItem} from '../src/reforged-items.js';
import {advanceAshenWinter} from '../src/undead-crisis.js';
const manifest=JSON.parse(readFileSync(new URL('../assets/campaign-shields-source.json',import.meta.url)));
const oldBattle=()=>JSON.parse(readFileSync(new URL('./fixtures/v036-active-battle.json',import.meta.url)));

test('all ten campaign shields match their pinned OG equivalents and legacy art stays hidden',()=>{
 assert.equal(manifest.records.flatMap(r=>r.campaignIds).length,10);
 for(const record of manifest.records)for(const id of record.campaignIds){
  const item=getItem(id);for(const [key,value]of Object.entries(record.stats))assert.equal(item[key],value,`${id}: ${key}`);
  const old=getItem(previousShieldId(id));assert.equal(old.visual,item.visual);assert.ok(!ITEMS.includes(old));
 }
});

test('older worn, reserve, stashed and buyback shields preserve proportional wear exactly once',()=>{
 for(const base of Object.keys(PREVIOUS_SHIELDS))for(const id of [base,`famed:${base}:73`,`famed3:${base}:73`,`famed7:${base}:73`,encodeBoundedForgeItem(base,{locked:false,foundation:{weight:2},prefixes:[],suffixes:[]},getItem)]){
  const oldMax=shieldMaximum(previousShieldId(id)),newMax=shieldMaximum(id);
  for(const condition of [0,1,Math.floor(oldMax/2),oldMax]){
   const expected=condition===0?0:Math.max(1,Math.floor(condition*newMax/oldMax));
   const s=createGame(810);delete s.shieldBalanceVersion;
   // Restore every pre-change baseline before exercising the old-save path.
   for(const p of s.party)for(const [set,key]of [['equipment','shield'],['reserveEquipment','reserveShield']])if(p[set]?.shield)p.armorDurability[key]=shieldMaximum(previousShieldId(p[set].shield));
   s.inventory=s.inventory.filter(i=>getItem(i).slot!=='shield');s.inventoryCondition=s.inventory.map(i=>getItem(i).armor??null);
   s.party[0].equipment.shield=id;s.party[0].reserveEquipment.shield=id;
   s.party[0].armorDurability.shield=condition;s.party[0].armorDurability.reserveShield=condition;
   s.inventory.push(id);s.inventoryCondition.push(condition);
   s.marketStock={test:{buyback:[{itemId:id,condition,price:1}]}};
   // Exercise migration separately for buybacks because market keys have their own validation.
   const before=structuredClone(s),m=migrateShieldBalance(s,getItem,getUndeadEncounters);
   assert.deepEqual(s,before);assert.equal(m.marketStock.test.buyback[0].condition,expected);
   delete m.marketStock.test;
   const loaded=validateSave(m);
   assert.equal(loaded.party[0].armorDurability.shield,expected);assert.equal(loaded.party[0].armorDurability.reserveShield,expected);
   assert.equal(loaded.inventoryCondition.at(-1),expected);assert.deepEqual(validateSave(loaded),loaded);
  }
 }
});

test('ongoing old battles preserve tactical state on repeated reloads and convert after retreat',()=>{
 const original=oldBattle(),before=structuredClone(original);let s=validateSave(original);assert.deepEqual(original,before);
 for(let i=0;i<3;i++)s=validateSave(s);
 for(const unit of original.battle.units){const restored=s.battle.units.find(u=>u.id===unit.id);
  for(const key of ['meleeDefense','rangedDefense','maxFatigue','shieldDurability','maxShieldDurability','q','r','ap'])assert.equal(restored[key],unit[key]);
 }
 assert.equal(s.party[0].equipment.shield,'legacy-buckler');
 const condition=s.battle.units.find(u=>u.id==='captain').shieldDurability;
 assert.equal(retreatBattle(s).ok,true);assert.equal(finishBattle(s).ok,true);
 assert.equal(s.party[0].equipment.shield,'buckler');assert.equal(s.party[0].armorDurability.shield,condition===0?0:Math.max(1,Math.floor(condition*16/24)));
 assert.ok(s.inventory.every(id=>currentShieldId(id)===id));assert.deepEqual(validateSave(s),s);
});

test('old save conditions beyond the prior maximum and unknown balance versions are rejected',()=>{
 const s=oldBattle();s.inventory=['buckler'];s.inventoryCondition=[25];assert.throws(()=>validateSave(s),/prior shield condition/);
 s.inventoryCondition=[0];s.shieldBalanceVersion=2;assert.throws(()=>validateSave(s),/shield balance version/);
});

test('persistent Ashen force damage adopts OG durability without regenerating troops',()=>{
 const s=createGame(719),bro=structuredClone(s.party[0]);while(s.party.length<6)s.party.push({...structuredClone(bro),id:`fighter-${s.party.length}`});
 s.party.forEach(p=>p.level=7);s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);s.day=60;s.shipments={};s.shipmentLegacyThroughDay=60;
 const context={settlements:SETTLEMENTS,report(){}};advanceAshenWinter(s,context);
 s.day=Math.floor(s.ashenWinter.warningHour/24)+1;s.hour=s.ashenWinter.warningHour%24;advanceAshenWinter(s,context);
 s.day=Math.floor(s.ashenWinter.activationHour/24)+1;s.hour=s.ashenWinter.activationHour%24;advanceAshenWinter(s,context);
 const e=getUndeadEncounters(s).find(e=>e.enemies.some(u=>Object.hasOwn(PREVIOUS_SHIELDS,u.shield)));
 assert.ok(e);const enemy=e.enemies.find(u=>Object.hasOwn(PREVIOUS_SHIELDS,u.shield));
 e.force.damage[enemy.troopIndex]={hp:20,bodyArmor:0,headArmor:0,shieldDurability:Math.floor(shieldMaximum(previousShieldId(enemy.shield))/2)};
 const troops=structuredClone(e.force.troops);delete s.shieldBalanceVersion;
 const m=migrateShieldBalance(s,getItem,getUndeadEncounters);
 const updated=getUndeadEncounters(m).find(x=>x.id===e.id);
 assert.deepEqual(updated.force.troops,troops);assert.equal(updated.enemies.find(u=>u.troopIndex===enemy.troopIndex).savedDamage.shieldDurability,Math.floor(shieldMaximum(enemy.shield)/2));
});

