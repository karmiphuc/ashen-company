import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getItem,getCompanyStats,startBattle,advanceBattle,validateSave,equipItem} from '../src/engine.js';
import {getItemDetails} from '../src/item-details.js';

function fight(seed,weapon='hunting-bow',targetFur=null,actorFur=null){
 const state=createGame(seed);state.position={x:440,y:520};startBattle(state,'quarry-camp');const battle=state.battle;
 const actor=battle.units.find(u=>u.id==='captain'), target=battle.units.find(u=>u.id==='enemy-1');
 for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
 for(const [i,u] of battle.units.entries())Object.assign(u,{q:11,r:i});
 Object.assign(actor,{q:2,r:3,perks:[],meleeSkill:95,rangedSkill:95,ap:9,skillPreference:'basic',equipment:{...actor.equipment,weapon,shield:null,attachment:actorFur}});
 Object.assign(target,{q:weapon==='hunting-bow'?5:3,r:3,hp:300,maxHp:300,headArmor:100,bodyArmor:100,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,morale:75,resolve:40,equipment:{...target.equipment,attachment:targetFur,shield:null}});
 battle.turnIndex=battle.turnOrder.indexOf(actor.id);battle.activeId=actor.id;
 return {state,battle,actor,target};
}

test('requested mail and pelt stats are exact and both slots contribute flat bonuses',()=>{
 for(const [id,armor,fatigue] of [['double-mail',45,2],['unhold-fur',70,3],['direwolf-fur',60,3],['hyena-fur',50,2],['bone-platings',55,2]])assert.deepEqual([getItem(id).armor,getItem(id).fatigue],[armor,fatigue]);
 const p=createGame(20).party[0],before=getCompanyStats(p);
 p.equipment.attachment='hyena-fur';p.equipment.attachment2='unhold-fur';p.armorDurability.attachment=50;p.armorDurability.attachment2=70;
 const after=getCompanyStats(p);assert.equal(after.maxFatigue,before.maxFatigue-5);assert.equal(after.initiative,before.initiative+10);assert.equal(after.rangedDefense,before.rangedDefense+10);
 const restored=createGame(20);restored.inventory.push('hyena-fur','unhold-fur','double-mail','direwolf-fur');restored.inventoryCondition.push(50,70,45,60);assert.deepEqual(validateSave(restored),restored);
});

test('Unhold Fur reduces ranged armor and health damage, covers head hits and does not mitigate melee',()=>{
 let head=false,body=false;
 for(let seed=1;seed<=20;seed++){
  const ordinary=fight(seed),fur=fight(seed,'hunting-bow','unhold-fur');advanceBattle(ordinary.state);advanceBattle(fur.state);
  const a=ordinary.battle.lastEvent,b=fur.battle.lastEvent;if(a.type!=='attack')continue;
  assert.equal(a.head,b.head);assert.equal(b.hpDamage,Math.max(1,Math.round(a.hpDamage*.75)));assert.equal(b.armorDamage,Math.round(a.armorDamage*.75));assert.ok(Math.abs(b.armorDamage/a.armorDamage-.75)<.06);
  if(a.head)head=true;else body=true;
  const duplicate=fight(seed,'hunting-bow','unhold-fur');duplicate.target.equipment.attachment2='unhold-fur';advanceBattle(duplicate.state);assert.equal(duplicate.battle.lastEvent.hpDamage,b.hpDamage);assert.equal(duplicate.battle.lastEvent.armorDamage,b.armorDamage);
  const melee=fight(seed,'arming-sword'),meleeFur=fight(seed,'arming-sword','unhold-fur');advanceBattle(melee.state);advanceBattle(meleeFur.state);assert.equal(melee.battle.lastEvent.hpDamage,meleeFur.battle.lastEvent.hpDamage);assert.equal(melee.battle.lastEvent.armorDamage,meleeFur.battle.lastEvent.armorDamage);
 }
 assert.ok(head&&body,'both hit locations were exercised');
});

test('Direwolf Fur adds melee morale pressure, excludes shots and respects undead immunity',()=>{
 let hits=0;
 for(let seed=1;seed<=10;seed++){
  const normal=fight(seed,'arming-sword'),fur=fight(seed,'arming-sword',null,'direwolf-fur');advanceBattle(normal.state);advanceBattle(fur.state);
  if(normal.battle.lastEvent.type==='attack'){assert.equal(normal.target.morale-fur.target.morale,5);hits++;}
  const shot=fight(seed),furShot=fight(seed,'hunting-bow',null,'direwolf-fur');advanceBattle(shot.state);advanceBattle(furShot.state);assert.equal(shot.target.morale,furShot.target.morale);
  const undead=fight(seed,'arming-sword',null,'direwolf-fur');undead.target.undeadTraitsVersion=1;advanceBattle(undead.state);assert.equal(undead.target.morale,75);
 }
 assert.ok(hits>0);
});


test('fur bonuses and two-slot combat equipment survive save/reload and appear in item details',()=>{
 const state=createGame(11),person=state.party[0];person.level=4;person.perks=['layered-armor'];
 for(const id of ['unhold-fur','hyena-fur']){state.inventory.push(id);state.inventoryCondition.push(getItem(id).armor);}
 assert.equal(equipItem(state,person.id,'hyena-fur').ok,true);assert.equal(equipItem(state,person.id,'unhold-fur','attachment-2').ok,true);
 state.position={x:440,y:520};startBattle(state,'quarry-camp');
 const loaded=validateSave(JSON.parse(JSON.stringify(state)));assert.deepEqual(loaded,state);assert.equal(advanceBattle(loaded).ok,true);assert.deepEqual(validateSave(loaded),loaded);
 const details=getItemDetails(getItem('unhold-fur'));assert.ok(details.stats.some(s=>s.label==='Incoming ranged damage'&&s.value==='−25%'));assert.ok(details.stats.some(s=>s.label==='Ranged defense'&&s.value==='+5'));
});
