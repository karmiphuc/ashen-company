import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,createGame,getItem,createFamedItemId,getCompanyStats,getCampSites,startBattle,advanceBattle,resolveBattle,retreatBattle,finishBattle,validateSave,equipItem,unequipItem,getAgileDefenseMultiplier} from '../src/engine.js';
import {encodeBoundedForgeItem} from '../src/reforged-items.js';
import {EQUIPMENT_SETS,equipmentSetsForRules,equipmentSetStatus,equipmentSetForItem,equipmentSetsForItem,equipmentSetBonusText,effectiveArmorFatigue,createSetArmorSnapshot,baseArmorCondition,validSetArmorSnapshot} from '../src/equipment-sets.js';
import {equipmentSetHTML} from '../src/campaign-ui.js';
import {getItemDetails} from '../src/item-details.js';
import {applySimultaneousSnapshot} from '../src/simultaneous-runner.js';
import {setSimultaneousBetaEnabled} from '../src/combat-config.js';
import {equipmentRangedReach} from '../src/item-affixes.js';

function outfit({body='bb-assassin-robe',head='bb-assassin-face-mask',bodyCondition,headCondition}={}){
 const state=createGame(51),person=state.party[0];
 for(const [id,condition] of [[body,bodyCondition],[head,headCondition]]){
  state.inventory.push(id);state.inventoryCondition.push(condition??getItem(id).armor);
  assert.equal(equipItem(state,person.id,id).ok,true);
 }
 return {state,person};
}
function fight(options={},realtime=false){
 const {state,person}=outfit(options),site=getCampSites(state)[0];state.position={x:site.x,y:site.y};
 setSimultaneousBetaEnabled(realtime);
 try{assert.equal(startBattle(state,site.id).ok,true);}finally{setSimultaneousBetaEnabled(false);}
 return {state,person,unit:state.battle.units.find(u=>u.id===person.id)};
}
function leave(state){assert.equal(retreatBattle(state).ok,true);assert.equal(finishBattle(state).ok,true);validateSave(JSON.parse(JSON.stringify(state)));}

test('Assassin pair grants requested armor and rounded fatigue, including the alternative head wrap',()=>{
 const {person}=outfit(),stats=getCompanyStats(person);
 assert.deepEqual(effectiveArmorFatigue(person,getItem),{body:8,head:5});
 assert.deepEqual([stats.bodyArmor,stats.maxBodyArmor,stats.headArmor,stats.maxHeadArmor],[138,138,161,161]);
 const wrap=outfit({head:'bb-assassin-head-wrap'}).person;
 assert.equal(getCompanyStats(wrap).headArmor,46);
 assert.deepEqual(effectiveArmorFatigue(wrap,getItem),{body:8,head:0});
});

test('only worn matching designs count; stashing or removing a piece disables both bonuses without repairing',()=>{
 const {state,person}=outfit({bodyCondition:80,headCondition:70});
 assert.deepEqual([getCompanyStats(person).bodyArmor,getCompanyStats(person).headArmor],[92,80]);
 assert.equal(unequipItem(state,person.id,'helmet').ok,true);
 assert.equal(equipmentSetStatus(person,getItem).active,false);
 assert.equal(getCompanyStats(person).bodyArmor,80);
 assert.deepEqual(effectiveArmorFatigue(person,getItem),{body:9,head:0});
 assert.equal(equipItem(state,person.id,'bb-assassin-face-mask').ok,true);
 assert.deepEqual(person.armorDurability.body,80);assert.equal(person.armorDurability.head,70);
 assert.equal(equipmentSetForItem(getItem('plate-harness')),null);
});

test('named designs qualify and transferring enhancements cannot confer membership on another design',()=>{
 const body=createFamedItemId('bb-assassin-robe',42,5),head=createFamedItemId('bb-assassin-face-mask',43,5);
 const {person}=outfit({body,head}),stats=getCompanyStats(person);
 assert.equal(equipmentSetStatus(person,getItem).active,true);
 assert.equal(stats.maxBodyArmor,Math.floor(getItem(body).armor*1.15));
 assert.equal(stats.maxHeadArmor,Math.floor(getItem(head).armor*1.15));
 const lookup=id=>id==='transferred'?{id,baseId:'mail-shirt',slot:'armor',armor:120,fatigue:9}:getItem(id);
 assert.equal(equipmentSetStatus({equipment:{armor:'transferred',helmet:head}},lookup).active,false);
 const reforged=encodeBoundedForgeItem('bb-assassin-robe',{locked:false,foundation:{armorPct:20,weight:2},prefixes:[],suffixes:[]},id=>ITEMS.find(i=>i.id===id));
 const smith=outfit({body:reforged,head}).person;
 assert.equal(equipmentSetStatus(smith,getItem).active,true);
 assert.equal(getCompanyStats(smith).maxBodyArmor,Math.floor(getItem(reforged).armor*115/100));
});

test('set fitting feeds fatigue capacity and initiative before Brawny and retains light-gear defenses',()=>{
 const {person}=outfit();person.perks=['brawny','nimble','agile-defense'];
 const fitted=getCompanyStats(person),unpaired=structuredClone(person);unpaired.equipment.helmet=null;
 const withoutHead=getCompanyStats(unpaired);
 // Body 8 + head 5, then Brawny floor(13*.7)=9; body alone floor(9*.7)=6.
 assert.equal(fitted.maxFatigue,withoutHead.maxFatigue-3);
 assert.equal(fitted.initiative,withoutHead.initiative-3);
 assert.equal(getAgileDefenseMultiplier(person),.4);
 person.armorDurability.body=0;person.armorDurability.head=0;
 assert.deepEqual(effectiveArmorFatigue(person,getItem),{body:8,head:5});
 assert.equal(getCompanyStats(person).bodyArmor,0);
});

test('battle snapshots survive saves and realtime worker updates and convert only actual wear',()=>{
 for(const realtime of [false,true]){
  const {state,unit}=fight({bodyCondition:79,headCondition:71},realtime);
  assert.equal(unit.bodyArmor,90);assert.equal(unit.headArmor,81);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))),state);
  const snapshot={battle:structuredClone(state.battle),supplies:structuredClone(state.supplies),events:[],eventSerial:0};
  if(realtime)applySimultaneousSnapshot(state,snapshot);
  assert.deepEqual(state.battle.units.find(u=>u.id===unit.id).setArmor,unit.setArmor);
  leave(state);assert.equal(state.party[0].armorDurability.body,79);assert.equal(state.party[0].armorDurability.head,71);
 }
});

test('taking one point or all boosted armor never heals and raw wear persists after retreat',()=>{
 for(const damage of [1,40,138]){
  const {state,unit}=fight();unit.bodyArmor-=damage;
  assert.equal(baseArmorCondition(unit,'body'),120-Math.ceil(damage*120/138));
  validateSave(JSON.parse(JSON.stringify(state)));leave(state);
  assert.equal(state.party[0].armorDurability.body,120-Math.ceil(damage*120/138));
 }
});

test('real strikes consume the boosted enemy pool and victory loot stores base condition',()=>{
 const {state,unit}=fight(),battle=state.battle,enemy=battle.units.find(u=>u.side==='enemy');
 const body=createFamedItemId('bb-assassin-robe',42,5),head=createFamedItemId('bb-assassin-face-mask',43,5);
 Object.assign(enemy.equipment,{armor:body,helmet:head,attachment:null,attachment2:null,shield:null});
 enemy.setArmor=createSetArmorSnapshot(enemy,getItem);enemy.bodyArmor=enemy.maxBodyArmor=enemy.setArmor.body.initial;
 enemy.headArmor=enemy.maxHeadArmor=enemy.setArmor.head.initial;enemy.attachmentArmor=enemy.maxAttachmentArmor=enemy.attachment2Armor=enemy.maxAttachment2Armor=0;
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

test('victory recovers a fallen brother’s set pieces in base condition',()=>{
 const {state,unit}=fight({bodyCondition:80,headCondition:70});unit.bodyArmor-=10;unit.headArmor-=10;
 const wear={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head')};
 unit.hp=0;unit.alive=false;
 for(const foe of state.battle.units.filter(u=>u.side==='enemy')){foe.hp=0;foe.alive=false;}
 resolveBattle(state);assert.equal(state.battle.status,'victory');finishBattle(state);
 for(const [id,key]of [['bb-assassin-robe','body'],['bb-assassin-face-mask','head']]){
  const index=state.inventory.indexOf(id);assert.ok(index>=0);assert.equal(state.inventoryCondition[index],wear[key]);
 }
 validateSave(JSON.parse(JSON.stringify(state)));
});

test('snapshot validation rejects missing, altered, or inconsistent armor pools',()=>{
 const {state,unit}=fight();assert.equal(validSetArmorSnapshot(unit,getItem),true);
 for(const mutate of [u=>delete u.setArmor,u=>u.setArmor.body.effectiveMax++,u=>u.setArmor.head.initial--,u=>u.setArmor.body.baseCurrent=-1,u=>u.setArmor.id='other']){
  const broken=structuredClone(state);mutate(broken.battle.units.find(u=>u.id===unit.id));
  assert.throws(()=>validateSave(broken),/battle set armor/);
 }
 const broken=structuredClone(state);broken.battle.equipmentSetRulesVersion=10;
 assert.throws(()=>validateSave(broken),/equipment set rules/);
});

test('pre-set active battles retain raw protection and fatigue until they end',()=>{
 const {state,unit,person}=fight();delete state.battle.equipmentSetRulesVersion;
 for(const actor of state.battle.units){if(!actor.setArmor)continue;
  actor.bodyArmor=actor.setArmor.body.baseCurrent;actor.maxBodyArmor=actor.setArmor.body.baseMax;
  actor.headArmor=actor.setArmor.head.baseCurrent;actor.maxHeadArmor=actor.setArmor.head.baseMax;
  delete actor.setArmor;
 }
 const loaded=validateSave(JSON.parse(JSON.stringify(state))),actor=loaded.battle.units.find(u=>u.id===person.id);
 assert.equal(actor.bodyArmor,120);assert.equal(actor.headArmor,140);
 assert.deepEqual(effectiveArmorFatigue(actor,getItem),{body:9,head:6});
 leave(loaded);assert.equal(getCompanyStats(loaded.party[0]).bodyArmor,138);
});

test('set hint exposes active and missing-piece states without adding a new item design',()=>{
 const {state,person}=outfit();assert.match(equipmentSetHTML(person),/Assassin 2\/2/);
 assert.match(equipmentSetHTML(person),/helmet fatigue −10%, body fatigue −15%/);
 assert.match(getItemDetails(getItem('bb-assassin-robe')).notes.join(' '),/Assassin set piece/);
 unequipItem(state,person.id,'helmet');assert.match(equipmentSetHTML(person),/Pair incomplete/);
 assert.match(equipmentSetHTML(person),/Assassin 1\/2/);
 assert.equal(createSetArmorSnapshot(person,getItem),null);
});

test('every ancient and northern/barbarian head/body combination matches its own family',()=>{
 const person=createGame(51).party[0];let pairs=0;
 for(const set of EQUIPMENT_SETS.filter(s=>s.since===2))for(const body of set.armorIds)for(const head of set.helmetIds){
  const armor=getItem(body),helmet=getItem(head);assert.ok(armor,body);assert.ok(helmet,head);
  Object.assign(person.equipment,{armor:body,helmet:head});Object.assign(person.armorDurability,{body:armor.armor,head:helmet.armor});
  const status=equipmentSetStatus(person,getItem),stats=getCompanyStats(person);
  assert.equal(status.active,true,`${body} + ${head}`);assert.equal(status.set.id,set.id);
  assert.equal(stats.maxBodyArmor,Math.floor(armor.armor*115/100));assert.equal(stats.maxHeadArmor,Math.floor(helmet.armor*115/100));
  assert.deepEqual(effectiveArmorFatigue(person,getItem),{body:Math.round(armor.fatigue*.85),head:Math.round(helmet.fatigue*.9)});
  pairs++;
 }
 assert.equal(pairs,372);
});

test('cross-family pairs, cultist clothing and decayed mercenary armor do not activate cultural sets',()=>{
 for(const [body,head]of [['bb-ancient-mail','northern-bear-head'],['northern-horned-plate','bb-ancient-legionary-helmet'],['bb-assassin-robe','barbarian-helmet'],['bb-cultist-leather-robe','bb-nordic-helmet'],['bb-decayed-coat-of-plates','bb-ancient-household-helmet']]){
  const {person}=outfit({body,head});assert.equal(equipmentSetStatus(person,getItem).active,false);
  assert.equal(getCompanyStats(person).maxBodyArmor,getItem(body).armor);
 }
 assert.equal(equipmentSetForItem(getItem('bb-cultist-hood')),null);
 assert.equal(equipmentSetForItem(getItem('bb-decayed-full-helm')),null);
});

test('named and reforged cultural gear retain family membership and damaged wear through reload/retreat',()=>{
 for(const [base,helmet]of [['bb-ancient-plate-harness','bb-ancient-honorguard-helmet'],['bb-rugged-scale-armor','northern-skull-helm']]){
  for(const body of [createFamedItemId(base,92,5),encodeBoundedForgeItem(base,{locked:false,foundation:{armorPct:20},prefixes:[],suffixes:[]},id=>ITEMS.find(i=>i.id===id))]){
   const {state,unit}=fight({body,head:helmet,bodyCondition:30,headCondition:20});
   assert.ok(unit.setArmor);assert.equal(validSetArmorSnapshot(unit,getItem),true);
   unit.bodyArmor-=3;unit.headArmor-=2;
   const wear={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head')};
   const loaded=validateSave(JSON.parse(JSON.stringify(state)));leave(loaded);
   assert.equal(loaded.party[0].armorDurability.body,wear.body);assert.equal(loaded.party[0].armorDurability.head,wear.head);
  }
 }
});

test('Assassin-only version-one battles load without retroactively enabling cultural sets',()=>{
 for(const gear of [{body:'bb-ancient-mail',head:'bb-ancient-legionary-helmet'},{body:'northern-rusty-mail',head:'bb-nordic-helmet'},{}]){
  const {state,person}=fight(gear);state.battle.equipmentSetRulesVersion=1;
  for(const unit of state.battle.units){if(!unit.setArmor||unit.setArmor.id==='assassin')continue;
   const load=effectiveArmorFatigue(unit,getItem),saving=getItem(unit.equipment.armor).fatigue+getItem(unit.equipment.helmet).fatigue-load.body-load.head;
   unit.maxFatigue-=saving;unit.initiative-=saving;
   unit.bodyArmor=unit.setArmor.body.baseCurrent;unit.maxBodyArmor=unit.setArmor.body.baseMax;
   unit.headArmor=unit.setArmor.head.baseCurrent;unit.maxHeadArmor=unit.setArmor.head.baseMax;delete unit.setArmor;
  }
  const loaded=validateSave(JSON.parse(JSON.stringify(state))),unit=loaded.battle.units.find(u=>u.id===person.id);
  assert.equal(Boolean(unit.setArmor),!gear.body);
  assert.equal(createSetArmorSnapshot(unit,getItem,{},1)?.id??null,!gear.body?'assassin':null);
  if(gear.body)assert.deepEqual(effectiveArmorFatigue(unit,getItem),{body:getItem(gear.body).fatigue,head:getItem(gear.head).fatigue});
  leave(loaded);
 }
});

test('cultural hint and item details describe the correct family and bonuses',()=>{
 for(const gear of [{body:'bb-ancient-mail',head:'bb-ancient-household-helmet'},{body:'northern-fur-coat',head:'bb-nordic-helmet'}]){
  const {state,person}=outfit(gear),set=equipmentSetStatus(person,getItem).set;
  assert.ok(equipmentSetHTML(person).includes(`${set.name} 2/2`));
  assert.ok(getItemDetails(getItem(gear.body)).notes.some(n=>n.includes(equipmentSetBonusText(set))));
  unequipItem(state,person.id,'helmet');const html=equipmentSetHTML(person);
  assert.ok(html.includes(set.pairing));assert.ok(!html.includes('Assassin’s'));
 }
});

test('boosted named armor maxima cannot be mistaken for legacy imported armor values',()=>{
 const body=createFamedItemId('bb-named-plated-fur-armor',75,5),{state,unit}=fight({body,head:'northern-metal-cap'});
 const original=getItem('bb-named-plated-fur-armor');
 const legacy=Math.min(500,original.sourceArmor+Math.max(8,Math.round(original.sourceArmor*(.15+(75&15)/100))));
 assert.equal(unit.maxBodyArmor,legacy);assert.notEqual(unit.maxBodyArmor,getItem(body).armor);
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))),state);
});

test('cultural fitting crosses actual light-gear thresholds before Nimble, Agile Defense and ranged-reach checks',()=>{
 const helm=encodeBoundedForgeItem('bb-ancient-laurels',{locked:false,foundation:{},prefixes:[{id:'farseeing',profile:{rangedRange:1}}],suffixes:[]},id=>ITEMS.find(i=>i.id===id));
 for(const gear of [{body:'bb-ancient-double-layer-mail',head:helm},{body:'bb-animal-hide-armor',head:'northern-bear-head'}]){
  const {person,unit}=fight(gear);person.perks=['nimble','agile-defense'];
  assert.equal(getItem(gear.body).fatigue+getItem(gear.head).fatigue,16);
  const load=effectiveArmorFatigue(person,getItem);assert.ok(load.body+load.head<=15);
  const plain=structuredClone(person);plain.perks=[];
  assert.equal(getCompanyStats(person).meleeDefense,getCompanyStats(plain).meleeDefense+5);
  assert.equal(getAgileDefenseMultiplier(person),.4);
  unit.perks=['agile-defense'];assert.equal(getAgileDefenseMultiplier(unit),.4);
  if(gear.head===helm)assert.equal(equipmentRangedReach(unit,getItem),1);
  delete unit.setArmor;assert.ok(getAgileDefenseMultiplier(unit)>.4);
  if(gear.head===helm)assert.equal(equipmentRangedReach(unit,getItem),0);
 }
});

test('every curated, eastern, Adorned and Noble pairing fits',()=>{
 const person=createGame(51).party[0];let pairs=0;
 for(const set of EQUIPMENT_SETS.filter(s=>s.since>=3))for(const body of set.armorIds)for(const head of set.helmetIds){
  const armor=getItem(body),helmet=getItem(head);assert.ok(armor,body);assert.ok(helmet,head);
  Object.assign(person.equipment,{armor:body,helmet:head});Object.assign(person.armorDurability,{body:armor.armor,head:helmet.armor});
  const status=equipmentSetStatus(person,getItem),stats=getCompanyStats(person);
  assert.equal(status.active,true,`${body} + ${head}`);
  const specialist=body==='bb-assassin-robe'&&['bb-assassin-face-mask','bb-assassin-head-wrap'].includes(head);
  assert.equal(status.set.id,specialist?'assassin':set.id);
  assert.equal(stats.maxBodyArmor,Math.floor(armor.armor*115/100));assert.equal(stats.maxHeadArmor,Math.floor(helmet.armor*115/100));
  assert.deepEqual(effectiveArmorFatigue(person,getItem),{body:Math.round(armor.fatigue*.85),head:Math.round(helmet.fatigue*.9)});pairs++;
 }
 assert.equal(pairs,131);
});

test('ordinary Southern and mixed Assassin gear no longer qualify; hints only show current sets',()=>{
 for(const gear of [{body:'bb-assassin-robe',head:'southern-helmet'},{body:'nomad-robe',head:'bb-assassin-face-mask'},{body:'southern-mail',head:'southern-helmet'},{body:'bb-golden-scale-armor',head:'bb-heavy-lamellar-helmet'}]){
  const {person,state,unit}=fight(gear);assert.ok(!equipmentSetStatus(person,getItem)?.active);
  assert.equal(unit.setArmor,undefined);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))),state);
 }
 assert.deepEqual(equipmentSetsForItem(getItem('bb-assassin-robe')).map(s=>s.id),['assassin']);
 assert.doesNotMatch(getItemDetails(getItem('bb-assassin-face-mask')).notes.join(' '),/Southern set piece/);
});

test('all retired Southern pairings retain version-three snapshots and fatigue',()=>{
 const set=equipmentSetsForRules(3).find(s=>s.id==='southern');let pairs=0;
 for(const body of set.armorIds)for(const head of set.helmetIds){
  const actor={equipment:{armor:body,helmet:head}};
  const snapshot=createSetArmorSnapshot(actor,getItem,{},3);assert.ok(snapshot);
  const unit={...actor,side:'player',setArmor:snapshot,bodyArmor:snapshot.body.initial,headArmor:snapshot.head.initial};
  assert.ok(validSetArmorSnapshot(unit,getItem,3));
  assert.equal(equipmentSetStatus(unit,getItem).active,true);
  assert.deepEqual(effectiveArmorFatigue(unit,getItem),{body:Math.round(getItem(body).fatigue*.85),head:Math.round(getItem(head).fatigue*.9)});pairs++;
 }
 assert.equal(pairs,572);
 const {state,person}=fight({body:'southern-mail',head:'southern-helmet'});
 state.battle.equipmentSetRulesVersion=3;
 for(const unit of state.battle.units){
  const snapshot=createSetArmorSnapshot(unit,getItem,{body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head')},3);
  // Fixtures switch memberships only; preserve raw gear condition for every unit.
  if(unit.setArmor){unit.bodyArmor=unit.setArmor.body.baseCurrent;unit.maxBodyArmor=unit.setArmor.body.baseMax;unit.headArmor=unit.setArmor.head.baseCurrent;unit.maxHeadArmor=unit.setArmor.head.baseMax;delete unit.setArmor;}
  if(snapshot){unit.setArmor=snapshot;unit.bodyArmor=snapshot.body.initial;unit.maxBodyArmor=snapshot.body.effectiveMax;unit.headArmor=snapshot.head.initial;unit.maxHeadArmor=snapshot.head.effectiveMax;}
 }
 const loaded=validateSave(JSON.parse(JSON.stringify(state)));assert.equal(loaded.battle.units.find(u=>u.id===person.id).setArmor.id,'southern');
 leave(loaded);assert.ok(!equipmentSetStatus(loaded.party[0],getItem)?.active);
});

test('Southern and Noble named/reforged pieces retain raw wear and family guidance',()=>{
 for(const [base,head,family]of [['bb-golden-scale-armor','bb-gold-and-black-turban','golden-scale'],['noble-tabard','bb-heraldic-mail-helmet','noble']]){
  for(const body of [createFamedItemId(base,92,5),encodeBoundedForgeItem(base,{locked:false,foundation:{armorPct:20},prefixes:[],suffixes:[]},id=>ITEMS.find(i=>i.id===id))]){
   const {state,person,unit}=fight({body,head,bodyCondition:30,headCondition:20});assert.equal(unit.setArmor.id,family);
   unit.bodyArmor-=3;unit.headArmor-=2;const worn={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head')};
   const loaded=validateSave(JSON.parse(JSON.stringify(state)));leave(loaded);
   assert.deepEqual([loaded.party[0].armorDurability.body,loaded.party[0].armorDurability.head],[worn.body,worn.head]);
   assert.ok(getItemDetails(getItem(body)).notes.some(n=>n.includes(equipmentSetStatus(person,getItem).set.name+' set piece')));
  }
 }
 for(const gear of [{body:'southern-mail',head:'full-helm'},{body:'noble-mail',head:'southern-helmet'}])assert.equal(Boolean(equipmentSetStatus(outfit(gear).person,getItem)?.active),false);
});

test('version-two battles retain old families without enabling Southern or Noble fitting on reload',()=>{
 for(const gear of [{body:'bb-assassin-robe',head:'southern-helmet'},{body:'noble-tabard',head:'full-helm'},{body:'northern-rusty-mail',head:'northern-skull-helm'}]){
  const {state,person}=fight(gear);state.battle.equipmentSetRulesVersion=2;
  for(const unit of state.battle.units){if(!['southern','noble'].includes(unit.setArmor?.id))continue;
   const load=effectiveArmorFatigue(unit,getItem),saving=getItem(unit.equipment.armor).fatigue+getItem(unit.equipment.helmet).fatigue-load.body-load.head;
   unit.maxFatigue-=saving;unit.initiative-=saving;
   unit.bodyArmor=unit.setArmor.body.baseCurrent;unit.maxBodyArmor=unit.setArmor.body.baseMax;
   unit.headArmor=unit.setArmor.head.baseCurrent;unit.maxHeadArmor=unit.setArmor.head.baseMax;delete unit.setArmor;
  }
  const loaded=validateSave(JSON.parse(JSON.stringify(state))),unit=loaded.battle.units.find(u=>u.id===person.id);
  assert.equal(unit.setArmor?.id??null,gear.body.startsWith('northern')?'northern':null);
  if(!unit.setArmor){assert.equal(equipmentSetStatus(unit,getItem).active,false);assert.deepEqual(effectiveArmorFatigue(unit,getItem),{body:getItem(gear.body).fatigue,head:getItem(gear.head).fatigue});}
  leave(loaded);
 }
});

test('every new curated pair preserves damaged condition through battle reload and retreat',()=>{
 for(const set of EQUIPMENT_SETS.filter(s=>s.since>=4))for(const body of set.armorIds)for(const head of set.helmetIds){
  const {state,unit}=fight({body,head,bodyCondition:30,headCondition:20});
  assert.equal(unit.setArmor.id,set.id);unit.bodyArmor-=3;unit.headArmor-=2;
  const worn={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head')};
  const loaded=validateSave(JSON.parse(JSON.stringify(state)));leave(loaded);
  assert.deepEqual({body:loaded.party[0].armorDurability.body,head:loaded.party[0].armorDurability.head},worn);
  assert.ok(worn.body<30&&worn.head<20);
 }
});


test('Adorned, Samurai and Tycoon keep specific matching identities and compact guidance',()=>{
 for(const [body,head,id] of [
  ['bb-adorned-mail-shirt','bb-adorned-full-helm','adorned'],
  ['samurai-wushi-armor','samurai-helmet','samurai'],
  ['samurai-tycoon-armor','samurai-tycoon-helmet','tycoon'],
 ]){
  const {person}=outfit({body,head});assert.equal(equipmentSetStatus(person,getItem).set.id,id);
  assert.match(equipmentSetHTML(person),/2\/2/);
  assert.ok(getItemDetails(getItem(body)).notes.some(n=>n.includes(equipmentSetStatus(person,getItem).set.pairing)));
 }
 for(const gear of [
  {body:'samurai-wushi-armor',head:'samurai-tycoon-helmet'},
  {body:'samurai-tycoon-armor',head:'samurai-helmet'},
  {body:'samurai-ninja-suit',head:'samurai-helmet'},
  {body:'bb-adorned-mail-shirt',head:'bb-full-helm'},
  {body:'fantasy-samurai-armor',head:'samurai-helmet'},
 ])assert.ok(!equipmentSetStatus(outfit(gear).person,getItem)?.active);
 const noble=outfit({body:'noble-tabard',head:'bb-adorned-full-helm'}).person;
 assert.equal(equipmentSetStatus(noble,getItem).set.id,'noble');
});

test('version-four battles do not retroactively activate new adorned or eastern pairs',()=>{
 for(const gear of [{body:'bb-adorned-mail-shirt',head:'bb-adorned-full-helm'},{body:'samurai-wushi-armor',head:'samurai-helmet'},{body:'samurai-tycoon-armor',head:'samurai-tycoon-helmet'}]){
  const {state,person}=fight(gear);state.battle.equipmentSetRulesVersion=4;
  for(const unit of state.battle.units){
   if(!['adorned','samurai','tycoon'].includes(unit.setArmor?.id))continue;
   unit.bodyArmor=unit.setArmor.body.baseCurrent;unit.maxBodyArmor=unit.setArmor.body.baseMax;
   unit.headArmor=unit.setArmor.head.baseCurrent;unit.maxHeadArmor=unit.setArmor.head.baseMax;delete unit.setArmor;
  }
  const loaded=validateSave(JSON.parse(JSON.stringify(state))),unit=loaded.battle.units.find(u=>u.id===person.id);
  assert.equal(unit.setArmor,undefined);assert.equal(equipmentSetStatus(unit,getItem).active,false);
  assert.deepEqual(effectiveArmorFatigue(unit,getItem),{body:getItem(gear.body).fatigue,head:getItem(gear.head).fatigue});
  leave(loaded);assert.equal(equipmentSetStatus(loaded.party[0],getItem).active,true);
 }
});


test('named and reforged Adorned and eastern pieces retain their original set membership',()=>{
 for(const [base,head,family]of [['bb-adorned-warriors-armor','bb-adorned-closed-flat-top-with-mail','adorned'],['samurai-wushi-armor','samurai-helmet','samurai'],['samurai-tycoon-armor','samurai-tycoon-helmet','tycoon']]){
  for(const body of [createFamedItemId(base,92,5),encodeBoundedForgeItem(base,{locked:false,foundation:{armorPct:20},prefixes:[],suffixes:[]},id=>ITEMS.find(i=>i.id===id))]){
   const {state,unit}=fight({body,head,bodyCondition:30,headCondition:20});assert.equal(unit.setArmor.id,family);
   unit.bodyArmor-=3;unit.headArmor-=2;const worn={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head')};
   const loaded=validateSave(JSON.parse(JSON.stringify(state)));leave(loaded);
   assert.deepEqual([loaded.party[0].armorDurability.body,loaded.party[0].armorDurability.head],[worn.body,worn.head]);
  }
 }
});


test('early mail, regal and kasa sets have precise companions and shared-hat guidance',()=>{
 for(const set of EQUIPMENT_SETS.filter(s=>s.since===6)){
  for(const body of set.armorIds)for(const head of set.helmetIds){
   const {person}=outfit({body,head});assert.equal(equipmentSetStatus(person,getItem).set.id,set.id);
   assert.match(equipmentSetHTML(person),/2\/2/);
  }
 }
 assert.deepEqual(equipmentSetsForItem(getItem('fantasy-kasa')).map(s=>s.id),['wokou','ronin']);
 const notes=getItemDetails(getItem('fantasy-kasa')).notes.join(' ');assert.match(notes,/Wokou set piece/);assert.match(notes,/Ronin set piece/);
 for(const gear of [{body:'bb-basic-mail-shirt',head:'bb-faction-helm'},{body:'bb-green-coat-of-plates-armor',head:'bb-golden-feathers-helmet'},{body:'bb-black-and-gold-armor',head:'bb-sallet-green-helmet'},{body:'fantasy-samurai-armor',head:'fantasy-kasa'},{body:'samurai-tycoon-armor',head:'fantasy-kasa'}])assert.ok(!equipmentSetStatus(outfit(gear).person,getItem)?.active);
});

test('version-five saves keep new mail, regal and kasa pairs unfitted until the next battle',()=>{
 for(const set of EQUIPMENT_SETS.filter(s=>s.since===6)){
  const gear={body:set.armorIds[0],head:set.helmetIds[0]}, {state,person}=fight(gear);state.battle.equipmentSetRulesVersion=5;
  for(const unit of state.battle.units){
   if(!EQUIPMENT_SETS.some(s=>s.since===6&&s.id===unit.setArmor?.id))continue;
   unit.bodyArmor=unit.setArmor.body.baseCurrent;unit.maxBodyArmor=unit.setArmor.body.baseMax;
   unit.headArmor=unit.setArmor.head.baseCurrent;unit.maxHeadArmor=unit.setArmor.head.baseMax;delete unit.setArmor;
  }
  const loaded=validateSave(JSON.parse(JSON.stringify(state))),unit=loaded.battle.units.find(u=>u.id===person.id);
  assert.equal(unit.setArmor,undefined);assert.equal(equipmentSetStatus(unit,getItem).active,false);
  assert.deepEqual(effectiveArmorFatigue(unit,getItem),{body:getItem(gear.body).fatigue,head:getItem(gear.head).fatigue});
  leave(loaded);assert.equal(equipmentSetStatus(loaded.party[0],getItem).set.id,set.id);
 }
});

test('named and reforged mail, regal and kasa pieces preserve original membership and raw wear',()=>{
 for(const set of EQUIPMENT_SETS.filter(s=>s.since===6)){
  const base=set.armorIds[0],head=set.helmetIds[0];
  for(const body of [createFamedItemId(base,92,5),encodeBoundedForgeItem(base,{locked:false,foundation:{armorPct:20},prefixes:[],suffixes:[]},id=>ITEMS.find(i=>i.id===id))]){
   const {state,unit}=fight({body,head,bodyCondition:30,headCondition:20});assert.equal(unit.setArmor.id,set.id);
   unit.bodyArmor-=3;unit.headArmor-=2;const worn={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head')};
   const loaded=validateSave(JSON.parse(JSON.stringify(state)));leave(loaded);
   assert.deepEqual([loaded.party[0].armorDurability.body,loaded.party[0].armorDurability.head],[worn.body,worn.head]);
  }
 }
});


test('a mismatched regal outfit guides toward the body companion rather than a shared Noble helmet',()=>{
 const {person}=outfit({body:'bb-black-and-gold-armor',head:'bb-sallet-green-helmet'});
 const status=equipmentSetStatus(person,getItem);assert.equal(status.set.id,'black-gold');assert.equal(status.count,1);assert.equal(status.active,false);
 assert.match(equipmentSetHTML(person),/Golden Feathers Helmet/);
});
