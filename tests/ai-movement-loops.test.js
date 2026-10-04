import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,startBattle,advanceBattle,setBattleTactic,getItem,throwingCapacity,validateSave} from '../src/engine.js';
function setup(weapon='javelins',reserve='arming-sword',tactic='offense'){
 const state=createGame(51),person=state.party[0];person.equipment.weapon=weapon;person.equipment.shield=null;person.armorDurability.shield=0;
 person.reserveEquipment={weapon:reserve,shield:null};person.throwingAmmo={active:throwingCapacity(weapon),reserve:throwingCapacity(reserve)};person.armorDurability.reserveShield=0;person.level=7;person.perks.push('quick-hands');person.combatRole='skirmisher';
 const camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};assert.equal(startBattle(state,camp.id).ok,true);setBattleTactic(state,tactic);
 const battle=state.battle;for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
 const actor=battle.units.find(u=>u.id===person.id),target=battle.units.find(u=>u.side==='enemy');
 Object.assign(actor,{q:5,r:5,ap:9,fatigue:0,turnStartedRound:battle.round});Object.assign(target,{q:6,r:5,hp:100,maxHp:100});
 let index=0;for(const u of battle.units)if(u!==actor&&u!==target)Object.assign(u,{q:1+index++,r:20});
 battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);
 return{state,battle,actor,target};
}
test('adjacent throwing skirmisher draws reserve melee and attacks without retreating',()=>{
 for(const tactic of ['offense','defense','shield-wall','skirmish']){
  const{state,battle,actor,target}=setup('javelins','arming-sword',tactic);
  advanceBattle(state);assert.equal(actor.equipment.weapon,'arming-sword',tactic);
  advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type),`${tactic}: ${battle.lastEvent.message}`);
  assert.equal(battle.lastEvent.targetId,target.id);assert.deepEqual([actor.q,actor.r],[5,5]);
 }
});
test('two-hex melee skirmisher attacks in reach despite a ranged weapon in reserve',()=>{
 const{state,battle,actor,target}=setup('pike','javelins');
 advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type),battle.lastEvent.message);
 assert.equal(battle.lastEvent.targetId,target.id);assert.deepEqual([actor.q,actor.r],[5,5]);
});
test('fatigued ranged unit with a shot available does not waste its remaining AP on optional cover',()=>{
 const{state,battle,actor,target}=setup('hunting-bow','arming-sword','defense');
 Object.assign(target,{q:9,r:5});target.equipment.weapon='hunting-bow';actor.fatigue=actor.maxFatigue-5;
 battle.field.tiles.find(t=>t.q===5&&t.r===6).terrain='trees';
 advanceBattle(state);assert.notEqual(battle.lastEvent.type,'move',battle.lastEvent.message);
 assert.deepEqual([actor.q,actor.r],[5,5]);
});


test('Quick Hands skirmisher draws a usable melee reserve instead of seeking another ranged target',()=>{
 const{state,battle,actor,target}=setup('hunting-bow','arming-sword');
 actor.aiTargetId=battle.units.find(u=>u.side==='enemy'&&u!==target).id;
 advanceBattle(state);assert.equal(battle.lastEvent.type,'swap');assert.equal(actor.equipment.weapon,'arming-sword');assert.equal(actor.ap,9);
 advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type),battle.lastEvent.message);
 assert.equal(battle.lastEvent.targetId,target.id);assert.deepEqual([actor.q,actor.r],[5,5]);
});

test('exhausted two-hex attacker recovers instead of spending more fatigue chasing another target',()=>{
 const{state,battle,actor,target}=setup('pike',null);
 target.q=10;actor.fatigue=actor.maxFatigue-1;
 advanceBattle(state);assert.notEqual(battle.lastEvent.type,'move');assert.deepEqual([actor.q,actor.r],[5,5]);
 assert.ok(actor.fatigue<actor.maxFatigue-1);
});


test('melee commitment survives multiple actions and a saved battle without stepping back',()=>{
 let{state,battle,actor,target}=setup();const targetId=target.id;
 for(let i=0;i<3;i++){
  advanceBattle(state);assert.notEqual(state.battle.lastEvent.type,'move');
  assert.deepEqual([actor.q,actor.r],[5,5]);
  if(state.battle.lastEvent.type==='attack'||state.battle.lastEvent.type==='miss')assert.equal(state.battle.lastEvent.targetId,targetId);
  state=validateSave(structuredClone(state));battle=state.battle;actor=battle.units.find(u=>u.id==='captain');
  if(battle.activeId!==actor.id)break;
 }
});


test('Shield Wall does not pin a loaded throwing weapon in hand during adjacent melee',()=>{
 const{state,battle,actor,target}=setup('javelins','arming-sword','shield-wall');
 actor.equipment.shield='round-shield';actor.shieldDurability=actor.maxShieldDurability=60;
 advanceBattle(state);assert.equal(battle.lastEvent.type,'swap');assert.equal(actor.equipment.weapon,'arming-sword');
 advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type),battle.lastEvent.message);
 assert.equal(battle.lastEvent.targetId,target.id);assert.deepEqual([actor.q,actor.r],[5,5]);
});
