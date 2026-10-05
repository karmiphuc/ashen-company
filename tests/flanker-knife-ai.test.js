import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,startBattle,advanceBattle,setBattleTactic,getItem,throwingCapacity,validateSave} from '../src/engine.js';
function setup(weapon='javelins',reserve='arming-sword',tactic='offense'){
 const state=createGame(51),person=state.party[0];person.equipment.weapon=weapon;person.equipment.shield=null;person.armorDurability.shield=0;
 person.reserveEquipment={weapon:reserve,shield:null};person.throwingAmmo={active:throwingCapacity(weapon),reserve:throwingCapacity(reserve)};person.armorDurability.reserveShield=0;person.level=7;person.perks.push('quick-hands');person.combatRole='flanker';
 if(tactic==='skirmish'){const shooter=state.party.find(p=>p.id==='scout');shooter.equipment.weapon='hunting-bow';shooter.equipment.shield=null;shooter.armorDurability.shield=0;}
 const camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};assert.equal(startBattle(state,camp.id).ok,true);setBattleTactic(state,tactic);
 const battle=state.battle;for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
 const actor=battle.units.find(u=>u.id===person.id),target=battle.units.find(u=>u.side==='enemy');
 Object.assign(actor,{q:5,r:5,ap:9,fatigue:0,turnStartedRound:battle.round});Object.assign(target,{q:6,r:5,hp:100,maxHp:100});
 let index=0;for(const u of battle.units)if(u!==actor&&u!==target)Object.assign(u,{q:1+index++,r:20});
 battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);
 return{state,battle,actor,target};
}

import {hexDistance} from '../src/battle-terrain.js';
function isolate(battle,actor,targets){for(const u of battle.units)if(u!==actor&&!targets.includes(u))u.alive=false;}
test('loaded javelin flanker skirts a melee line without entering its zone of control',()=>{
 const{state,battle,actor,target}=setup('javelins','fighting-knife');
 Object.assign(target,{q:11,r:5}); target.equipment.weapon='arming-sword';
 const guard=battle.units.find(u=>u.side==='enemy'&&u!==target);Object.assign(guard,{q:11,r:6});guard.equipment.weapon='arming-sword';
 isolate(battle,actor,[target,guard]);
 const visited=new Set();let moved=false,shot=false;
 for(let turn=0;turn<4&&!shot;turn++){
  actor.ap=9;actor.fatigue=0;battle.round++;actor.turnStartedRound=battle.round;battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);
  for(let i=0;i<6&&battle.activeId===actor.id;i++){
   advanceBattle(state);
   assert.ok(hexDistance(actor,target)>=2&&hexDistance(actor,guard)>=2,battle.lastEvent.message);
   if(battle.lastEvent.type==='move'){const key=`${actor.q},${actor.r}`;assert.ok(!visited.has(key),'no backtracking');visited.add(key);moved=true;}
   if(['attack','miss'].includes(battle.lastEvent.type)){shot=true;const lateral=actor.r+actor.q/2;assert.ok(lateral<=9.5||lateral>=12.5,'shot from wing');break;}
  }
 }
 assert.ok(moved);assert.ok(shot,'reaches a wing and throws rather than charging');
});
test('flanker already on a wing throws rather than chasing a distant archer',()=>{
 const{state,battle,actor,target}=setup('javelins','fighting-knife');Object.assign(target,{q:8,r:5});
 const archer=battle.units.find(u=>u.side==='enemy'&&u!==target);Object.assign(archer,{q:12,r:4});archer.equipment.weapon='hunting-bow';target.equipment.weapon='arming-sword';
 isolate(battle,actor,[target,archer]);advanceBattle(state);
 assert.ok(['attack','miss'].includes(battle.lastEvent.type),battle.lastEvent.message);assert.deepEqual([actor.q,actor.r],[5,5]);
});
for(const weapon of ['fighting-knife','rondel-dagger'])test(`${weapon} prefers Puncture against intact armor`,()=>{
 const{state,battle,actor,target}=setup(weapon,null);isolate(battle,actor,[target]);target.bodyArmor=300;target.headArmor=300;target.hp=100;actor.meleeSkill=55;target.meleeDefense=30;
 advanceBattle(state);assert.equal(battle.lastEvent.skillName,'Puncture');assert.equal(battle.lastEvent.armorDamage,0);
});
for(const condition of ['finishing','unarmored','low AP','low fatigue'])test(`knife retains legal Stab for ${condition}`,()=>{
 const{state,battle,actor,target}=setup('fighting-knife',null);isolate(battle,actor,[target]);target.bodyArmor=300;target.headArmor=300;target.hp=100;
 if(condition==='finishing')target.hp=1;
 if(condition==='unarmored')target.bodyArmor=target.headArmor=target.attachmentArmor=target.attachment2Armor=0;
 if(condition==='low AP')actor.ap=3;
 if(condition==='low fatigue')actor.fatigue=actor.maxFatigue-8;
 advanceBattle(state);assert.equal(battle.lastEvent.skillName,'Stab',battle.lastEvent.message);
});
test('Qatal uses Deathblow on a vulnerable enemy',()=>{
 const{state,battle,actor,target}=setup('qatal-dagger',null);isolate(battle,actor,[target]);target.hp=100;target.stunnedTurns=1;
 advanceBattle(state);assert.equal(battle.lastEvent.skillName,'Deathblow');
});
test('loaded flanker draws reserve knife for an affordable safe backstab on an engaged enemy',()=>{
 const{state,battle,actor,target}=setup('javelins','fighting-knife');Object.assign(target,{q:7,r:5,bodyArmor:300,headArmor:300});
 const ally=battle.units.find(u=>u.side===actor.side&&u!==actor);Object.assign(ally,{q:8,r:5});isolate(battle,actor,[target,ally]);
 advanceBattle(state);assert.equal(battle.lastEvent.type,'swap');assert.equal(actor.equipment.weapon,'fighting-knife');
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(hexDistance(actor,target),1);
 advanceBattle(state);assert.equal(battle.lastEvent.skillName,'Puncture');
});
for(const tactic of ['defense','shield-wall','skirmish','advance-formation'])test(`flanker keeps wing duty under ${tactic}`,()=>{
 const{state,battle,actor,target}=setup('javelins','fighting-knife',tactic);isolate(battle,actor,[target]);Object.assign(target,{q:11,r:5});
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move',battle.lastEvent.message);assert.ok(hexDistance(actor,target)>1);
});
test('flanker does not draw a knife when another enemy protects the approach',()=>{
 const{state,battle,actor,target}=setup('javelins','fighting-knife');Object.assign(target,{q:7,r:5});
 const ally=battle.units.find(u=>u.side===actor.side&&u!==actor);Object.assign(ally,{q:8,r:5});
 const guards=battle.units.filter(u=>u.side!==actor.side&&u!==target).slice(0,2);Object.assign(guards[0],{q:7,r:4});Object.assign(guards[1],{q:6,r:6});
 isolate(battle,actor,[target,ally,...guards]);advanceBattle(state);assert.equal(actor.equipment.weapon,'javelins');
});
test('flanker does not swap when its reserve attack cannot be afforded',()=>{
 const{state,battle,actor,target}=setup('javelins','fighting-knife');Object.assign(target,{q:7,r:5,bodyArmor:300});
 const ally=battle.units.find(u=>u.side===actor.side&&u!==actor);Object.assign(ally,{q:8,r:5});isolate(battle,actor,[target,ally]);actor.ap=3;
 advanceBattle(state);assert.equal(actor.equipment.weapon,'javelins');
});
test('flanker decisions and reserve swaps survive save validation between every action',()=>{
 let state=createGame(51);const person=state.party[0];person.combatRole='flanker';person.equipment.weapon='javelins';person.equipment.shield=null;person.armorDurability.shield=0;person.reserveEquipment={weapon:'fighting-knife',shield:null};person.armorDurability.reserveShield=0;person.throwingAmmo={active:throwingCapacity('javelins'),reserve:0};
 const camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};assert.ok(startBattle(state,camp.id).ok);
 for(let i=0;i<30&&state.battle;i++){advanceBattle(state);const snapshot=structuredClone(state);state=validateSave(snapshot);assert.deepEqual(state,snapshot);}
});
