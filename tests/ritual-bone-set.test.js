import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,createGame,getItem,createFamedItemId,getCompanyStats,getCampSites,startBattle,retreatBattle,finishBattle,validateSave,equipItem,unequipItem} from '../src/engine.js';
import {encodeBoundedForgeItem} from '../src/reforged-items.js';
import {equipmentSetStatus,createSetArmorSnapshot,baseArmorCondition,effectiveArmorFatigue,equipmentSetBonusText} from '../src/equipment-sets.js';
import {equipmentSetHTML} from '../src/campaign-ui.js';
import {getItemDetails} from '../src/item-details.js';
import {setSimultaneousBetaEnabled} from '../src/combat-config.js';
const armor='bb-barbarian-ritual-armor',helmet='bb-barbarian-ritual-helmet',bone=createFamedItemId('bone-platings',92,6);
function outfit({body=armor,head=helmet,attachment=bone,second=false}={}){
 const state=createGame(51),person=state.party[0];if(second){person.level=10;person.perks.push('layered-armor');}
 for(const [id,destination]of [[body,'active'],[head,'active'],[attachment,second?'attachment-2':'active']]){state.inventory.push(id);state.inventoryCondition.push(getItem(id).armor);assert.equal(equipItem(state,person.id,id,destination).ok,true);}
 return {state,person};
}
function fight(options={},realtime=false){const {state,person}=outfit(options),camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};setSimultaneousBetaEnabled(realtime);try{assert.equal(startBattle(state,camp.id).ok,true);}finally{setSimultaneousBetaEnabled(false);}return {state,person,unit:state.battle.units.find(u=>u.id===person.id)};}

test('only the 300-armor Ritual pair unlocks the unique Ritual Bone completion',()=>{
 const {person}=outfit(),status=equipmentSetStatus(person,getItem),stats=getCompanyStats(person);
 assert.equal(getItem(armor).armor,300);assert.equal(getItem(helmet).armor,300);
 assert.equal(status.set.id,'northern');assert.equal(status.bonuses.name,'Ritual Bone');assert.equal(status.threePiece,true);
 assert.deepEqual([stats.maxBodyArmor,stats.maxHeadArmor],[450,450]);assert.deepEqual(effectiveArmorFatigue(person,getItem),{body:24,head:22});
 assert.equal(stats.maxAttachmentArmor,getItem(bone).armor);
 assert.match(equipmentSetHTML(person),/Ritual Bone 3\/3/);assert.match(equipmentSetBonusText(status.set,{threePiece:true,bonuses:status.bonuses}),/Ritual Bone 3\/3 set: \+50%/);
 const notes=getItemDetails(getItem(bone)).notes.join(' ');assert.match(notes,/Ritual Bone completion/);assert.match(notes,/Ritual Armor and Ritual Helmet/);assert.match(notes,/Only named versions count/);
});

test('the 150-armor Ritual Helm and other top-tier northern bodies cannot substitute',()=>{
 for(const options of [{head:'northern-ritual-helm'},{body:'northern-horned-plate'},{body:'bb-named-skull-and-chain-armor'},{attachment:'bone-platings'}]){
  const {person}=outfit(options),status=equipmentSetStatus(person,getItem);assert.equal(status.threePiece,false);assert.equal(status.active,true);assert.equal(status.bonuses.armorPct,15);
 }
 const {state,person}=outfit();assert.equal(unequipItem(state,person.id,'attachment').ok,true);
 assert.equal(equipmentSetStatus(person,getItem).bonuses.name,'Northern / Barbarian');assert.equal(getCompanyStats(person).maxBodyArmor,345);
 assert.equal(getCompanyStats(person).maxHeadArmor,345);
});

test('named and reforged Ritual designs retain unique membership; arbitrary transferred armor does not',()=>{
 for(const body of [createFamedItemId(armor,42,5),encodeBoundedForgeItem(armor,{locked:false,foundation:{armorPct:20},prefixes:[],suffixes:[]},id=>ITEMS.find(i=>i.id===id))]){
  const {person}=outfit({body,head:createFamedItemId(helmet,43,5)});assert.equal(equipmentSetStatus(person,getItem).bonuses.name,'Ritual Bone');
  assert.equal(getCompanyStats(person).maxBodyArmor,Math.floor(getItem(body).armor*1.5));
 }
 const body=encodeBoundedForgeItem('northern-horned-plate',{locked:false,foundation:{armorPct:20},prefixes:[],suffixes:[]},id=>ITEMS.find(i=>i.id===id));
 assert.equal(equipmentSetStatus(outfit({body}).person,getItem).threePiece,false);
});

test('Ritual Bone survives either attachment slot, realtime saves and worn retreat without healing',()=>{
 for(const second of [false,true])for(const realtime of [false,true]){
  const {state,person,unit}=fight({second},realtime);assert.equal(state.battle.equipmentSetRulesVersion,8);
  assert.equal(unit.setArmor.attachmentSlot,second?'attachment2':'attachment');unit.bodyArmor-=11;unit.headArmor-=8;
  const wear={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head')};
  const loaded=validateSave(JSON.parse(JSON.stringify(state)));assert.deepEqual(loaded.battle,state.battle);
  assert.equal(retreatBattle(loaded).ok,true);assert.equal(finishBattle(loaded).ok,true);
  assert.deepEqual([loaded.party[0].armorDurability.body,loaded.party[0].armorDurability.head],[wear.body,wear.head]);
  assert.ok(wear.body<person.armorDurability.body&&wear.head<person.armorDurability.head);validateSave(JSON.parse(JSON.stringify(loaded)));
 }
});

test('version-seven battles with named Bone Platings retain their prior Northern protection on reload',()=>{
 const {state,person}=fight();state.battle.equipmentSetRulesVersion=7;
 for(const unit of state.battle.units){if(!unit.setArmor)continue;
  unit.setArmor=createSetArmorSnapshot(unit,getItem,{body:unit.setArmor.body.baseCurrent,head:unit.setArmor.head.baseCurrent},7);
  unit.bodyArmor=unit.setArmor.body.initial;unit.maxBodyArmor=unit.setArmor.body.effectiveMax;unit.headArmor=unit.setArmor.head.initial;unit.maxHeadArmor=unit.setArmor.head.effectiveMax;
 }
 const loaded=validateSave(JSON.parse(JSON.stringify(state))),unit=loaded.battle.units.find(u=>u.id===person.id);
 assert.deepEqual(loaded.battle,state.battle);assert.equal(equipmentSetStatus(unit,getItem).threePiece,false);assert.equal(unit.maxBodyArmor,345);
 assert.deepEqual(effectiveArmorFatigue(unit,getItem),{body:26,head:25});
 assert.equal(retreatBattle(loaded).ok,true);assert.equal(finishBattle(loaded).ok,true);
 assert.equal(equipmentSetStatus(loaded.party[0],getItem).bonuses.name,'Ritual Bone');
});

test('saved Ritual completions reject mismatched bases, ordinary Bones and forged attachment slots',()=>{
 const {state,person}=fight();for(const mutate of [u=>u.equipment.attachment='bone-platings',u=>u.equipment.helmet='northern-ritual-helm',u=>u.equipment.armor='northern-horned-plate',u=>u.setArmor.attachmentSlot='attachment2']){
  const broken=structuredClone(state);mutate(broken.battle.units.find(u=>u.id===person.id));assert.throws(()=>validateSave(broken),/set armor/);
 }
});
