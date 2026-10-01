import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,startBattle,advanceBattle,validateSave,resolveBattle} from '../src/engine.js';
import {battleHTML} from '../src/battle-view.js';

function fight(perks=[],duplicate=false) {
  const state=createGame(7391),person=state.party[0];
  person.level=30;person.perks=perks;person.equipment.weapon='light-crossbow';person.equipment.shield=null;person.armorDurability.shield=0;
  person.reserveEquipment.weapon=duplicate?'light-crossbow':'heavy-crossbow';person.reserveEquipment.shield=null;person.armorDurability.reserveShield=0;
  const camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};startBattle(state,camp.id);
  const battle=state.battle,actor=battle.units.find(u=>u.id===person.id),enemy=battle.units.find(u=>u.side==='enemy');
  for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
  for(const u of battle.units)if(u!==actor&&u!==enemy){u.hp=0;u.alive=false;}
  Object.assign(actor,{q:2,r:2,rangedSkill:200,meleeSkill:200});
  Object.assign(enemy,{q:5,r:2,hp:300,maxHp:300,bodyArmor:0,headArmor:0,attachmentArmor:0,meleeDefense:0,rangedDefense:0});
  battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);battle.rng=0;
  return {state,battle,actor,enemy};
}

test('dual crossbows fire before reloading, preserve both loading states and reload only the wielded one',()=>{
  for(const perks of [['quick-hands'],['crossbow-mastery']])for(const duplicate of [false,true]) {
    let {state,actor,enemy}=fight(perks,duplicate);
    advanceBattle(state);assert.equal(state.battle.lastEvent.type,'attack');assert.equal(actor.reload,1);assert.equal(actor.reserveReload,0);
    state=validateSave(structuredClone(state));actor=state.battle.units.find(u=>u.id===actor.id);
    advanceBattle(state);assert.equal(state.battle.lastEvent.type,'swap');assert.equal(actor.reload,0);assert.equal(actor.reserveReload,1);
    advanceBattle(state);assert.equal(state.battle.lastEvent.type,'attack');assert.equal(actor.reload,1);assert.equal(actor.reserveReload,1);
    const ammo=state.supplies.ammo;
    // Complete the current turn, then observe the next activation without skipping enemy actions.
    while(state.battle.activeId===actor.id)advanceBattle(state);
    while(state.battle.activeId!==actor.id&&state.battle.status==='active')advanceBattle(state);
    assert.equal(state.battle.status,'active');advanceBattle(state);
    assert.equal(state.battle.lastEvent.skillName,'Reload');assert.equal(actor.reload,0);assert.equal(actor.reserveReload,1);
    assert.equal(state.supplies.ammo,ammo);validateSave(structuredClone(state));
  }
});

test('without discounted AP or a free swap the AI reloads instead of wasting a paid swap',()=>{
  const {state,actor}=fight();advanceBattle(state);advanceBattle(state);
  assert.equal(state.battle.lastEvent.skillName,'Reload');assert.equal(actor.battleSetSwapped,false);
});

test('broken enemies roll once per turn; successful fleeing persists across an action reload',()=>{
  const {state,battle,actor,enemy}=fight();enemy.morale=10;enemy.q=8;
  battle.activeId=enemy.id;battle.turnIndex=battle.turnOrder.indexOf(enemy.id);battle.rng=0;
  advanceBattle(state);assert.equal(battle.lastEvent.skillName,'Flee');assert.equal(enemy.fleeRollRound,1);
  const rng=battle.rng,restored=validateSave(structuredClone(state));
  advanceBattle(restored);assert.equal(restored.battle.lastEvent.skillName,'Flee');assert.equal(restored.battle.rng,rng);
  const moved=restored.battle.units.find(u=>u.id===enemy.id);
  assert.notDeepEqual([moved.q,moved.r],[enemy.q,enemy.r]);
  assert.ok(actor.alive);
});

test('failed flight roll does not repeat during the same turn and steady enemies never roll',()=>{
  for(const morale of [10,25]) {
    const {state,battle,enemy}=fight();enemy.morale=morale;enemy.q=9;
    battle.activeId=enemy.id;battle.turnIndex=battle.turnOrder.indexOf(enemy.id);battle.rng=1000;
    advanceBattle(state);const rng=battle.rng;
    assert.notEqual(battle.lastEvent.skillName,'Flee');
    advanceBattle(state);assert.equal(battle.rng,rng);
    assert.equal(enemy.fleeRollRound,morale===10?1:undefined);
  }
});

test('leaving adjacency grants a free melee strike, and escape grants no kill or gear salvage',()=>{
  const {state,battle,actor,enemy}=fight();actor.equipment.weapon='arming-sword';actor.meleeSkill=200;
  actor.q=11;enemy.q=12;enemy.morale=10;enemy.hp=300;
  enemy.equipment.weapon='northern-sling';
  battle.activeId=enemy.id;battle.turnIndex=battle.turnOrder.indexOf(enemy.id);battle.rng=0;
  const ap=actor.ap,ammo=state.supplies.ammo;
  advanceBattle(state);assert.equal(battle.lastEvent.reactions[0].skillName,'Opportunity Strike');
  assert.equal(actor.ap,ap);assert.equal(state.supplies.ammo,ammo);assert.ok(enemy.hp<300);
  enemy.q=13;enemy.ap=9;advanceBattle(state);
  assert.equal(enemy.escaped,true);assert.equal(battle.status,'victory');assert.equal(battle.xp[actor.id],30);
  assert.ok(!battle.loot.items.includes('northern-sling'));validateSave(structuredClone(state));
  assert.ok(!battleHTML(battle).includes('data-unit-id="enemy-1"'));
});

test('new flight saves resolve identically with reloads between every action',()=>{
  let {state,battle,enemy}=fight();enemy.morale=10;battle.rng=0;
  const instant=structuredClone(state);resolveBattle(instant);
  for(let i=0;i<1000&&state.battle.status==='active';i++){advanceBattle(state);state=validateSave(structuredClone(state));}
  assert.deepEqual(state,instant);
});

test('an opportunity kill stops flight and forged flight state is rejected',()=>{
  const {state,battle,actor,enemy}=fight();actor.equipment.weapon='arming-sword';actor.meleeSkill=200;
  actor.q=11;enemy.q=12;enemy.morale=10;enemy.hp=1;
  battle.activeId=enemy.id;battle.turnIndex=battle.turnOrder.indexOf(enemy.id);battle.rng=0;
  advanceBattle(state);
  assert.equal(enemy.alive,false);assert.equal(enemy.escaped,undefined);
  assert.equal(battle.lastEvent.reactions[0].fallen,true);assert.equal(battle.xp[actor.id],50);
  validateSave(structuredClone(state));
  const future=structuredClone(state);future.battle.units.find(u=>u.id===enemy.id).fleeRollRound=battle.round+1;
  assert.throws(()=>validateSave(future),/fleeRollRound/);
  const wrongSide=structuredClone(state);wrongSide.battle.units.find(u=>u.id===actor.id).fleeRound=1;
  assert.throws(()=>validateSave(wrongSide),/fleeRound/);
});
