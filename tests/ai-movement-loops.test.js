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

test('fatigue-limited two-hex attacker can still use spare AP for a legal approach',()=>{
 const{state,battle,actor,target}=setup('pike',null);
 target.q=8;actor.fatigue=actor.maxFatigue-5;actor.ap=3;
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.ok(actor.q>5);
 assert.ok(actor.ap>=0&&actor.ap<3);assert.ok(actor.fatigue<=actor.maxFatigue);
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

function runActorTurn(state,actor,round){
 const battle=state.battle;const events=[];battle.round=round;actor.ap=9;
 battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);
 for(let i=0;i<12&&battle.activeId===actor.id&&battle.status==='active';i++){
  const from={q:actor.q,r:actor.r};advanceBattle(state);
  events.push({type:battle.lastEvent.type,from,to:{q:actor.q,r:actor.r},message:battle.lastEvent.message});
 }
 return events;
}

test('polearm rear ranks do not alternate between Shield Wall reformation and pursuit',()=>{
 for(const weapon of ['pike','billhook']){
  const{state,battle,actor,target}=setup(weapon,null,'shield-wall');actor.tacticalRole='frontliner';
  target.q=10;const shield=battle.units.find(u=>u.id==='guard');Object.assign(shield,{q:4,r:6});
  const events=[];for(let round=1;round<=8;round++)events.push(...runActorTurn(state,actor,round));
  const settled=events.filter(e=>e.type==='move').slice(2);
  assert.ok(settled.every(e=>e.to.q<shield.q),'pursuit must respect the same rear line as reformation');
  assert.ok(actor.q<shield.q);
  // When the shield line advances, the polearm follows and can acquire reach.
  shield.q=8;let attacked=false;
  for(let round=9;round<=14&&!attacked;round++)attacked=runActorTurn(state,actor,round).some(e=>['attack','miss'].includes(e.type));
  assert.ok(attacked,'holding a rear rank must not prevent following a moving shield line or attacking');
 }
});

test('a committed ranged pursuit does not repeatedly return to distant cover without firing',()=>{
 const{state,battle,actor,target}=setup('javelins','arming-sword','shield-wall');Object.assign(actor,{q:5,r:8});
 for(const t of battle.field.tiles)t.terrain=(t.q+t.r)%4===0?'trees':'open';
 const foes=battle.units.filter(u=>u.side==='enemy');
 for(let i=0;i<foes.length;i++)Object.assign(foes[i],{q:9+i,r:[10,5,9][i],hp:500,maxHp:500});
 const shield=battle.units.find(u=>u.id==='guard');Object.assign(shield,{q:4,r:8});
 let priorMove=null,shots=0;
 for(let round=1;round<=9;round++)for(const event of runActorTurn(state,actor,round)){
  if(['attack','miss'].includes(event.type)){priorMove=null;shots++;}
  if(event.type==='move'){
   if(priorMove)assert.notDeepEqual(event.to,priorMove.from,'cover must not undo the previous pursuit step');
   priorMove=event;
  }
 }
 assert.ok(shots>0,'the approach must eventually produce an attack');
});

test('a 3-AP Skirmish staging move advances without scheduling a phantom retreat',()=>{
 let{state,battle,actor,target}=setup('javelins','arming-sword','skirmish');target.q=10;actor.ap=3;
 advanceBattle(state);assert.equal(battle.lastEvent.type,'move');assert.equal(actor.skirmishReturn,undefined);
 assert.ok(actor.q>5);const staged={q:actor.q,r:actor.r};
 state=validateSave(structuredClone(state));battle=state.battle;actor=battle.units.find(u=>u.id==='captain');
 const events=runActorTurn(state,actor,battle.round+1);
 assert.ok(events.some(e=>['attack','miss'].includes(e.type)),'the next turn should fire from the advanced position');
 const returned=events.find(e=>/falls back/.test(e.message));
 if(returned)assert.ok(returned.to.q>=staged.q,'a real sortie returns to the staged shelter, not the pre-advance tile');
});

test('finishing a Skirmish return does not immediately reopen an unaffordable sortie',()=>{
 const{state,battle,actor,target}=setup('javelins','arming-sword','skirmish');target.q=11;
 actor.q=7;actor.skirmishReturn={q:5,r:5,phase:'return'};
 const events=runActorTurn(state,actor,2);
 assert.deepEqual([actor.q,actor.r],[5,5],JSON.stringify(events));assert.equal(actor.skirmishReturn,undefined);
 const arrived=events.findIndex(e=>e.type==='move'&&e.to.q===5&&e.to.r===5);
 assert.ok(arrived>=0);assert.ok(events.slice(arrived+1).every(e=>e.type!=='move'));
});
