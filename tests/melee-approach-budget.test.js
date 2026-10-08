import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,startBattle,advanceBattle,setBattleTactic,getItem,throwingCapacity,validateSave} from '../src/engine.js';
function setup(weapon='javelins',reserve='arming-sword',tactic='offense'){
 const state=createGame(51),person=state.party[0];person.equipment.weapon=weapon;person.equipment.shield=null;person.armorDurability.shield=0;
 person.reserveEquipment={weapon:reserve,shield:null};person.throwingAmmo={active:throwingCapacity(weapon),reserve:throwingCapacity(reserve)};person.armorDurability.reserveShield=0;person.level=7;person.perks.push('quick-hands');person.combatRole='skirmisher';
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
function isolate(battle,actor,target){for(const u of battle.units)if(u!==actor&&u!==target){u.alive=false;u.hp=0;}}
function scene(weapon='arming-sword',enemyWeapon='arming-sword',distance=2,ap=2){
 const f=setup(weapon,null);isolate(f.battle,f.actor,f.target);Object.assign(f.target,{q:5+distance,r:5});f.target.equipment.weapon=enemyWeapon;f.actor.ap=ap;return f;
}
test('cautious melee holds one step short rather than spending its last AP entering melee',()=>{
 const{state,battle,actor,target}=scene();advanceBattle(state);assert.deepEqual([actor.q,actor.r],[5,5]);assert.equal(hexDistance(actor,target),2);assert.equal(battle.lastEvent.type,'hold');
});
test('polearm stages outside an enemy polearm reach when a follow-up attack cannot fit',()=>{
 const{state,battle,actor,target}=scene('pike','pike',3);actor.tacticalRole='frontliner';advanceBattle(state);assert.equal(hexDistance(actor,target),3);assert.equal(battle.lastEvent.type,'hold');
});
test('polearm can use spare AP to approach its own reach safely against a one-hex enemy',()=>{
 const{state,battle,actor,target}=scene('pike','arming-sword',3);advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(hexDistance(actor,target),2);
});
for(const weapon of ['arming-sword','pike'])test(`${weapon} commits when movement plus a real attack fits the remaining budget`,()=>{
 const distance=weapon==='pike'?3:2;const{state,battle,actor,target}=scene(weapon,weapon,distance,weapon==='pike'?8:6);
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type),battle.lastEvent.message);assert.equal(battle.lastEvent.targetId,target.id);
});
test('fatigue limits and dazed capacity are part of the follow-up attack budget',()=>{
 for(const dazed of [false,true]){
  const{state,battle,actor}=scene('arming-sword','arming-sword',2,9);if(dazed)actor.dazedTurns=2;actor.fatigue=Math.floor(actor.maxFatigue*(dazed?.75:1))-5;
  advanceBattle(state);assert.deepEqual([actor.q,actor.r],[5,5]);assert.notEqual(battle.lastEvent.type,'move');
 }
});
test('melee units can pressure ranged targets with spare AP',()=>{
 const{state,battle,actor,target}=scene('arming-sword','hunting-bow');advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(hexDistance(actor,target),1);
});
for(const aggressive of ['frontliner','breaker','shield'])test(`${aggressive} may push into a single opponent without saving an attack`,()=>{
 const{state,battle,actor,target}=scene();if(aggressive==='shield'){actor.equipment.shield='round-shield';actor.shieldDurability=60;}else actor.tacticalRole=aggressive;
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(hexDistance(actor,target),1);
});
test('a broken shield or badly wounded frontliner does not justify a free enemy attack',()=>{
 for(const kind of ['broken shield','wounded']){
  const{state,battle,actor}=scene();if(kind==='broken shield'){actor.equipment.shield='round-shield';actor.shieldDurability=0;}else{actor.tacticalRole='frontliner';actor.hp=actor.maxHp*.4;}
  advanceBattle(state);assert.deepEqual([actor.q,actor.r],[5,5]);assert.equal(battle.lastEvent.type,'hold');
 }
});
test('mounted melee uses the actual one-AP movement cost in its attack budget',()=>{
 const{state,battle,actor,target}=scene('arming-sword','arming-sword',2,5);actor.equipment.mount='riding-horse';
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(actor.ap,4);assert.equal(hexDistance(actor,target),1);advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type));
});
test('staging ends on the next turn with a move and attack, without moving backward',()=>{
 const{state,battle,actor,target}=scene();advanceBattle(state);assert.equal(hexDistance(actor,target),2);
 battle.round++;actor.ap=9;actor.fatigue=0;actor.turnStartedRound=battle.round;battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(hexDistance(actor,target),1);advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type));
});
test('formation advancement applies the same attack budget before spending AP or fatigue',()=>{
 const{state,battle,actor}=scene('pike','pike',3,2);actor.tacticalRole='frontliner';setBattleTactic(state,'advance-formation');
 const fatigue=actor.fatigue,plan=structuredClone(battle.formationAdvance);advanceBattle(state);assert.deepEqual([actor.q,actor.r],[5,5]);assert.equal(actor.fatigue,fatigue);assert.deepEqual(battle.formationAdvance,plan);
});
test('enemy skirmishers use the same staging decision as company skirmishers',()=>{
 const{state,battle,actor,target}=scene();actor.side='enemy';target.side='company';battle.enemyTacticalState.tactic='offense';
 advanceBattle(state);assert.deepEqual([actor.q,actor.r],[5,5]);assert.equal(battle.lastEvent.type,'hold');
});

test('shorter melee weapon budgets both steps through hostile polearm reach instead of stalling forever',()=>{
 const{state,battle,actor,target}=scene('arming-sword','pike',3,8);
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(hexDistance(actor,target),2);
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(hexDistance(actor,target),1);
 advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type));
});
test('short melee holds beyond hostile polearm reach if the full approach and attack cannot fit',()=>{
 const{state,battle,actor,target}=scene('arming-sword','pike',3,6);advanceBattle(state);assert.equal(battle.lastEvent.type,'hold');assert.equal(hexDistance(actor,target),3);
});
test('ranged prey does not excuse entering another melee enemy reach without an attack budget',()=>{
 const{state,battle,actor,target}=scene('arming-sword','hunting-bow');
 const guard=battle.units.find(u=>u!==actor&&u!==target&&u.side==='enemy');Object.assign(guard,{alive:true,hp:100,q:8,r:4});guard.equipment.weapon='pike';
 advanceBattle(state);assert.deepEqual([actor.q,actor.r],[5,5]);assert.notEqual(battle.lastEvent.type,'move');
});
test('healthy frontliners do not spend their last AP stepping into two new melee threats',()=>{
 const{state,battle,actor,target}=scene();actor.tacticalRole='frontliner';
 const guard=battle.units.find(u=>u!==actor&&u!==target&&u.side==='enemy');Object.assign(guard,{alive:true,hp:100,q:6,r:6});guard.equipment.weapon='arming-sword';
 advanceBattle(state);assert.deepEqual([actor.q,actor.r],[5,5]);assert.equal(battle.lastEvent.type,'hold');
});
test('movement credit can make the full approach and attack affordable',()=>{
 const{state,battle,actor}=scene('arming-sword','arming-sword',2,5);actor.movementCredit=1;advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(actor.ap,4);advanceBattle(state);assert.ok(['attack','miss'].includes(battle.lastEvent.type));
});
test('disarmed frontliners hold rather than treating their role as a free attack budget',()=>{
 const{state,battle,actor}=scene();actor.tacticalRole='frontliner';actor.disarmedTurns=2;advanceBattle(state);assert.deepEqual([actor.q,actor.r],[5,5]);assert.equal(battle.lastEvent.type,'hold');
});
test('older active battles retain their previous approach decisions',()=>{
 const{state,battle,actor,target}=scene();delete battle.roleConsistencyVersion;advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(hexDistance(actor,target),1);
});
