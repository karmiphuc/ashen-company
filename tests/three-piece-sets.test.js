import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,createGame,getItem,createFamedItemId,getCompanyStats,getCampSites,startBattle,advanceBattle,resolveBattle,retreatBattle,finishBattle,validateSave,equipItem,unequipItem} from '../src/engine.js';
import {EQUIPMENT_SETS,equipmentSetStatus,equipmentSetsForItem,equipmentSetCompletionText,equipmentSetBonusText,effectiveArmorFatigue,effectiveAttachmentFatigue,createSetArmorSnapshot,baseArmorCondition,validSetArmorSnapshot} from '../src/equipment-sets.js';
import {encodeBoundedForgeItem} from '../src/reforged-items.js';
import {equipmentSetHTML} from '../src/campaign-ui.js';
import {getItemDetails} from '../src/item-details.js';
import {equipmentRangedReach} from '../src/item-affixes.js';
import {setSimultaneousBetaEnabled} from '../src/combat-config.js';
const selected=EQUIPMENT_SETS.filter(s=>s.threePiece);
const rates={'ancient':[35,15],'northern':[20,15],'adorned':[30,15],'golden-scale':[40,20],'golden-lamellar':[50,20],'black-gold':[35,20],'green-plate':[50,20],'heraldic-knight':[40,20]};
function outfit(set=selected.find(s=>s.id==='green-plate'),{second=false,body=set.armorIds[0],head=set.helmetIds[0],attachment=createFamedItemId(set.threePiece.attachmentId,92,6),bodyCondition,headCondition}={}){
 const state=createGame(51),person=state.party[0];if(second){person.level=10;person.perks.push('layered-armor');}
 for(const [id,condition,destination]of [[body,bodyCondition,'active'],[head,headCondition,'active'],[attachment,undefined,second?'attachment-2':'active']]){
  state.inventory.push(id);state.inventoryCondition.push(condition??getItem(id).armor);assert.equal(equipItem(state,person.id,id,destination).ok,true);
 }
 return {state,person,set};
}
function fight(set,options={},realtime=false){
 const fixture=outfit(set,options),{state,person}=fixture,site=getCampSites(state)[0];state.position={x:site.x,y:site.y};
 setSimultaneousBetaEnabled(realtime);try{assert.equal(startBattle(state,site.id).ok,true);}finally{setSimultaneousBetaEnabled(false);}
 return {...fixture,unit:state.battle.units.find(u=>u.id===person.id)};
}
function leave(state){assert.equal(retreatBattle(state).ok,true);assert.equal(finishBattle(state).ok,true);return validateSave(JSON.parse(JSON.stringify(state)));}

test('eight curated completions use varied replacement bonuses and leave attachment armor unchanged',()=>{
 assert.equal(selected.length,8);
 for(const set of selected){
  const {person}=outfit(set),status=equipmentSetStatus(person,getItem),stats=getCompanyStats(person),[armorPct,fatiguePct]=rates[set.id];
  assert.equal(status.threePiece,true);assert.equal(status.count,3);assert.equal(status.total,3);
  assert.equal(status.bonuses.armorPct,armorPct);assert.equal(status.bonuses.bodyFatiguePct,fatiguePct);
  assert.equal(stats.maxBodyArmor,Math.floor(getItem(person.equipment.armor).armor*(100+armorPct)/100));
  assert.equal(stats.maxHeadArmor,Math.floor(getItem(person.equipment.helmet).armor*(100+armorPct)/100));
  assert.equal(stats.maxAttachmentArmor,getItem(person.equipment.attachment).armor);
  assert.deepEqual(effectiveArmorFatigue(person,getItem),{body:Math.round(getItem(person.equipment.armor).fatigue*(100-fatiguePct)/100),head:Math.round(getItem(person.equipment.helmet).fatigue*(100-fatiguePct)/100)});
  assert.equal(effectiveAttachmentFatigue(person,getItem).attachment,Math.round(getItem(person.equipment.attachment).fatigue*(100-fatiguePct)/100));
  assert.match(equipmentSetBonusText(set,{threePiece:true}),new RegExp(`\\+${armorPct}%`));
 }
});

test('ordinary, unrelated, stashed and incomplete attachments cannot unlock the strong tier',()=>{
 const set=selected.find(s=>s.id==='green-plate');
 for(const attachment of [set.threePiece.attachmentId,createFamedItemId('padded-lining',92,6)]){
  const {person}=outfit(set,{attachment}),status=equipmentSetStatus(person,getItem);assert.equal(status.threePiece,false);assert.equal(status.active,true);
  assert.equal(getCompanyStats(person).maxBodyArmor,448);
 }
 const {state,person}=outfit(set),raw=structuredClone(person.armorDurability);
 assert.equal(unequipItem(state,person.id,'attachment').ok,true);assert.equal(equipmentSetStatus(person,getItem).threePiece,false);
 assert.equal(person.armorDurability.body,raw.body);assert.equal(person.armorDurability.head,raw.head);
 const attachment=state.inventory.find(id=>getItem(id).slot==='attachment');assert.equal(equipItem(state,person.id,attachment).ok,true);
 assert.equal(unequipItem(state,person.id,'helmet').ok,true);assert.equal(equipmentSetStatus(person,getItem).active,false);
 assert.equal(getCompanyStats(person).maxBodyArmor,390);
 for(const id of ['basic-mail','field-mail','hauberk','assassin','ninja','samurai','tycoon','wokou','ronin','noble'])assert.equal(EQUIPMENT_SETS.find(s=>s.id===id).threePiece,null);
});

test('either unlocked attachment slot qualifies and duplicates discount only one attachment',()=>{
 const set=selected.find(s=>s.id==='green-plate'),{state,person}=outfit(set,{second:true}),second=person.equipment.attachment2;
 assert.equal(equipmentSetStatus(person,getItem).attachmentSlot,'attachment2');
 assert.equal(effectiveAttachmentFatigue(person,getItem).attachment2,Math.round(getItem(second).fatigue*.8));
 state.inventory.push(second);state.inventoryCondition.push(getItem(second).armor);assert.equal(equipItem(state,person.id,second).ok,true);
 const status=equipmentSetStatus(person,getItem);assert.equal(status.count,3);assert.equal(status.attachmentSlot,'attachment');
 assert.equal(effectiveAttachmentFatigue(person,getItem).attachment2,getItem(second).fatigue);
 assert.equal(getCompanyStats(person).maxBodyArmor,585);
 validateSave(JSON.parse(JSON.stringify(state)));
});

test('Northern completion is a slight upgrade and broad Ancient completion stays below the narrow heavy pairs',()=>{
 const northern=selected.find(s=>s.id==='northern'),ancient=selected.find(s=>s.id==='ancient');
 const {person}=outfit(northern,{body:'northern-rusty-mail',head:'northern-skull-helm'});
 const stats=getCompanyStats(person);assert.equal(stats.maxBodyArmor,Math.floor(getItem(person.equipment.armor).armor*1.2));
 assert.equal(northern.threePiece.armorPct,20);assert.equal(northern.threePiece.bodyFatiguePct,northern.bodyFatiguePct);
 assert.equal(ancient.threePiece.armorPct,35);
});

test('all curated named completions preserve worn base condition through turn-based and realtime reload/retreat',()=>{
 for(const set of selected)for(const realtime of [false,true]){
  const {state,unit}=fight(set,{bodyCondition:30,headCondition:20},realtime);
  assert.equal(state.battle.equipmentSetRulesVersion,8);assert.equal(unit.setArmor.attachmentSlot,'attachment');
  assert.ok(validSetArmorSnapshot(unit,getItem,7));unit.bodyArmor-=3;unit.headArmor-=2;unit.attachmentArmor-=1;
  const worn={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head'),attachment:unit.attachmentArmor};
  const loaded=validateSave(JSON.parse(JSON.stringify(state)));assert.deepEqual(loaded.battle,state.battle);
  const settled=leave(loaded);assert.deepEqual([settled.party[0].armorDurability.body,settled.party[0].armorDurability.head,settled.party[0].armorDurability.attachment],[worn.body,worn.head,worn.attachment]);
  assert.ok(worn.body<30&&worn.head<20);
 }
});

test('named, reforged and restored base designs keep their curated completion identity',()=>{
 for(const set of selected){
  for(const body of [createFamedItemId(set.armorIds[0],92,5),encodeBoundedForgeItem(set.armorIds[0],{locked:false,foundation:{armorPct:20},prefixes:[],suffixes:[]},id=>ITEMS.find(i=>i.id===id))]){
   const {person}=outfit(set,{body});assert.equal(equipmentSetStatus(person,getItem).threePiece,true);
  }
 }
 const {person}=outfit(selected.find(s=>s.id==='ancient'),{body:'rest-s-ancient-plate-harness',head:'rest-b-ancient-honorguard-helmet'});
 assert.equal(equipmentSetStatus(person,getItem).threePiece,true);
});

test('version-six saved battles retain two-piece pools and fatigue despite carrying named signature attachments',()=>{
 for(const set of selected){
  const {state,person}=fight(set);state.battle.equipmentSetRulesVersion=6;
  for(const unit of state.battle.units){if(!unit.setArmor)continue;
   const before=effectiveArmorFatigue(unit,getItem),beforeAttachment=effectiveAttachmentFatigue(unit,getItem);
   const old=createSetArmorSnapshot(unit,getItem,{body:unit.setArmor.body.baseCurrent,head:unit.setArmor.head.baseCurrent},6);unit.setArmor=old;
   const after=effectiveArmorFatigue(unit,getItem),afterAttachment=effectiveAttachmentFatigue(unit,getItem);
   const delta=before.body+before.head+beforeAttachment.attachment+beforeAttachment.attachment2-after.body-after.head-afterAttachment.attachment-afterAttachment.attachment2;
   unit.maxFatigue+=delta;unit.initiative+=delta;
   unit.bodyArmor=old.body.initial;unit.maxBodyArmor=old.body.effectiveMax;unit.headArmor=old.head.initial;unit.maxHeadArmor=old.head.effectiveMax;
  }
  const loaded=validateSave(JSON.parse(JSON.stringify(state))),unit=loaded.battle.units.find(u=>u.id===person.id);
  assert.deepEqual(loaded.battle,state.battle);assert.equal(equipmentSetStatus(unit,getItem).threePiece,false);
  assert.equal(effectiveAttachmentFatigue(unit,getItem).attachment,getItem(unit.equipment.attachment).fatigue);
  leave(loaded);assert.equal(equipmentSetStatus(loaded.party[0],getItem).threePiece,true);
 }
});

test('snapshot validation rejects forged completion metadata, changed attachments and legacy version upgrades',()=>{
 const {state,person}=fight(),mutations=[u=>delete u.setArmor.attachmentSlot,u=>u.setArmor.attachmentSlot='attachment2',u=>u.setArmor.extra=1,u=>u.equipment.attachment='stag-plates',u=>u.setArmor.body.effectiveMax++];
 for(const mutate of mutations){const broken=structuredClone(state),unit=broken.battle.units.find(u=>u.id===person.id);mutate(unit);assert.throws(()=>validateSave(broken),/set armor|armor maximum/);}
 const old=structuredClone(state);old.battle.equipmentSetRulesVersion=6;assert.throws(()=>validateSave(old),/set armor/);
});

test('completion UI and ordinary/named attachment inspection explain precise varied bonuses behind compact hints',()=>{
 for(const set of selected){
  const {person}=outfit(set);assert.match(equipmentSetHTML(person),/3\/3/);assert.match(equipmentSetHTML(person,'attachment'),/is-completion is-active/);
  const plain=getItem(set.threePiece.attachmentId),notes=getItemDetails(plain).notes.join(' ');
  assert.ok(equipmentSetsForItem(plain).some(s=>s.id===set.id));assert.match(notes,/Only named versions count/);assert.ok(notes.includes(`+${set.threePiece.armorPct}%`));
  assert.ok(equipmentSetCompletionText(set).includes(`−${set.threePiece.attachmentFatiguePct}%`));
 }
});

test('ranged-reach affix cache refreshes when a battle snapshot changes between two and three pieces',()=>{
 const set=selected.find(s=>s.id==='northern');
 const head=encodeBoundedForgeItem('northern-bear-head',{locked:false,foundation:{},prefixes:[{id:'farseeing',profile:{rangedRange:1}}],suffixes:[]},id=>ITEMS.find(i=>i.id===id));
 const actor={side:'company',equipment:{armor:'northern-fur-coat',helmet:head,attachment:createFamedItemId(set.threePiece.attachmentId,92,6)}};
 actor.setArmor=createSetArmorSnapshot(actor,getItem,{},6);const old=effectiveArmorFatigue(actor,getItem);assert.ok(old.body+old.head>15);
 assert.equal(equipmentRangedReach(actor,getItem),0);actor.setArmor=createSetArmorSnapshot(actor,getItem,{},7);
 const next=effectiveArmorFatigue(actor,getItem);assert.ok(next.body+next.head<=15);assert.equal(equipmentRangedReach(actor,getItem),1);
});

test('rare Unhold and Direwolf trophies complete every existing pair without needing new armor designs',()=>{
 for(const set of EQUIPMENT_SETS)for(const [id,armorPct,fatiguePct]of [['unhold-fur',30,15],['direwolf-fur',25,20]]){
  const attachment=createFamedItemId(id,92,6),{state,person}=outfit(set,{attachment});
  const status=equipmentSetStatus(person,getItem);assert.equal(status.threePiece,true);assert.equal(status.set.id,set.id);assert.equal(status.bonuses.armorPct,armorPct);
  assert.equal(status.bonuses.headFatiguePct,fatiguePct);
  const stats=getCompanyStats(person);assert.equal(stats.maxBodyArmor,Math.floor(getItem(person.equipment.armor).armor*(100+armorPct)/100));
  assert.equal(stats.maxAttachmentArmor,getItem(attachment).armor);
  if(id==='unhold-fur'){assert.equal(getItem(attachment).rangedDamageReduction,.25);assert.equal(getItem(attachment).rangedDefenseBonus,5);}
  else assert.equal(getItem(attachment).meleeMoraleDamage,5);
  assert.equal(unequipItem(state,person.id,'attachment').ok,true);assert.equal(equipmentSetStatus(person,getItem).threePiece,false);
 }
 for(const id of ['unhold-fur','direwolf-fur']){
  assert.equal(equipmentSetsForItem(getItem(id)).length,EQUIPMENT_SETS.length);
  const details=getItemDetails(getItem(id)).notes.join(' ');assert.match(details,/Ordinary and named versions qualify/);assert.match(details,/Any matching set completion/);
  const {person}=outfit(EQUIPMENT_SETS.find(s=>s.id==='ninja'),{attachment:id});assert.equal(equipmentSetStatus(person,getItem).threePiece,true);
 }
});

test('multiple qualifying attachments choose the stronger replacement tier without discounting both',()=>{
 const set=selected.find(s=>s.id==='green-plate'),{state,person}=outfit(set,{second:true});
 const unhold=createFamedItemId('unhold-fur',92,6);state.inventory.push(unhold);state.inventoryCondition.push(getItem(unhold).armor);assert.equal(equipItem(state,person.id,unhold).ok,true);
 const status=equipmentSetStatus(person,getItem);assert.equal(status.bonuses.armorPct,50);assert.equal(status.attachmentSlot,'attachment2');
 assert.equal(effectiveAttachmentFatigue(person,getItem).attachment,getItem(unhold).fatigue);
 const dir=createFamedItemId('direwolf-fur',92,6);state.inventory.push(dir);state.inventoryCondition.push(getItem(dir).armor);assert.equal(equipItem(state,person.id,dir,'attachment-2').ok,true);
 const next=equipmentSetStatus(person,getItem);assert.equal(next.bonuses.armorPct,30);assert.equal(next.attachmentSlot,'attachment');
 assert.equal(effectiveAttachmentFatigue(person,getItem).attachment2,getItem(dir).fatigue);
 assert.equal(next.count,3);validateSave(JSON.parse(JSON.stringify(state)));
});

test('universal trophy snapshots retain raw attachment wear and can never upgrade an older active battle',()=>{
 const set=EQUIPMENT_SETS.find(s=>s.id==='ninja');
 for(const id of ['unhold-fur','direwolf-fur']){
  const {state,unit}=fight(set,{attachment:createFamedItemId(id,92,6),bodyCondition:30,headCondition:20},true);
  unit.bodyArmor-=1;unit.attachmentArmor-=2;
  const wear=baseArmorCondition(unit,'body'),attachment=unit.attachmentArmor;
  const loaded=validateSave(JSON.parse(JSON.stringify(state)));leave(loaded);assert.equal(loaded.party[0].armorDurability.body,wear);assert.equal(loaded.party[0].armorDurability.attachment,attachment);
  const legacy={...unit,setArmor:createSetArmorSnapshot(unit,getItem,{body:30,head:20},6)};
  assert.equal(equipmentSetStatus(legacy,getItem).threePiece,false);
  assert.equal(effectiveAttachmentFatigue(legacy,getItem).attachment,getItem(unit.equipment.attachment).fatigue);
 }
});

test('broken worn attachments keep their fixed battle completion without healing any pool',()=>{
 const {state,person,unit}=fight();unit.attachmentArmor=0;
 assert.equal(equipmentSetStatus(unit,getItem).threePiece,true);
 const loaded=validateSave(JSON.parse(JSON.stringify(state)));leave(loaded);
 assert.equal(loaded.party[0].armorDurability.attachment,0);
 assert.equal(loaded.party[0].armorDurability.body,person.armorDurability.body);
});

test('real attacks consume three-piece armor and named enemy loot returns to raw condition',()=>{
 const {state,unit}=fight(),battle=state.battle,enemy=battle.units.find(u=>u.side==='enemy');
 const body=createFamedItemId('bb-green-coat-of-plates-armor',42,5),head=createFamedItemId('bb-sallet-green-helmet',43,5),attachment=createFamedItemId('stag-plates',92,6);
 Object.assign(enemy.equipment,{armor:body,helmet:head,attachment,attachment2:null,shield:null});
 enemy.setArmor=createSetArmorSnapshot(enemy,getItem);enemy.bodyArmor=enemy.maxBodyArmor=enemy.setArmor.body.initial;enemy.headArmor=enemy.maxHeadArmor=enemy.setArmor.head.initial;
 enemy.maxAttachmentArmor=getItem(attachment).armor;enemy.attachmentArmor=0;enemy.attachment2Armor=enemy.maxAttachment2Armor=0;
 Object.assign(enemy,{q:5,r:4,meleeDefense:0,morale:80,shieldDurability:0,maxShieldDurability:0});
 Object.assign(unit,{q:4,r:4,meleeSkill:200,ap:9,fatigue:0,morale:80,turnStartedRound:battle.round});
 for(const [i,other]of battle.units.filter(u=>u!==unit&&u!==enemy).entries())Object.assign(other,{q:0,r:i});
 for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
 battle.activeId=unit.id;battle.turnIndex=battle.turnOrder.indexOf(unit.id);battle.rng=0;
 advanceBattle(state);assert.equal(battle.lastEvent.type,'attack');assert.ok(battle.lastEvent.armorDamage>0);
 assert.ok(enemy.bodyArmor<enemy.maxBodyArmor||enemy.headArmor<enemy.maxHeadArmor);
 const wear={body:baseArmorCondition(enemy,'body'),head:baseArmorCondition(enemy,'head')};
 for(const foe of battle.units.filter(u=>u.side==='enemy')){foe.hp=0;foe.alive=false;}
 resolveBattle(state);assert.equal(battle.status,'victory');
 for(const [id,key]of [[body,'body'],[head,'head']]){
  const index=battle.loot.items.indexOf(id);assert.ok(index>=0);
  assert.equal(battle.loot.itemConditions[index],Math.max(Math.ceil(getItem(id).armor*.25),wear[key]));
  assert.ok(battle.loot.itemConditions[index]<=getItem(id).armor);
 }
 finishBattle(state);validateSave(JSON.parse(JSON.stringify(state)));
});
