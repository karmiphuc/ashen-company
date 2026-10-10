import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,startBattle,advanceBattle,validateSave} from '../src/engine.js';
import {newBattlePerformance,recordBattlePerformance,battleMvpAwards} from '../src/battle-performance.js';
import {battleResultsHTML} from '../src/campaign-ui.js';

function fight(){const state=createGame(7391),camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};assert.ok(startBattle(state,camp.id).ok);return state;}
test('Performance records enemy losses and kills but does not credit friendly fire',()=>{
 const actor={side:'company',battleStats:newBattlePerformance()},enemy={side:'enemy',battleStats:newBattlePerformance()},friend={side:'company',battleStats:newBattlePerformance()};
 recordBattlePerformance(actor,enemy,7,19,true);recordBattlePerformance(actor,friend,5,11,true);
 assert.deepEqual(actor.battleStats,{kills:1,hpDamageDealt:7,armorDamageDealt:19,armorDamageReceived:0});assert.equal(friend.battleStats.armorDamageReceived,11);assert.equal(enemy.battleStats.armorDamageReceived,19);
});
test('Real attacks clamp overkill and armor damage to actual durability loss',()=>{
 const state=fight(),b=state.battle,actor=b.units.find(u=>u.id==='captain'),enemy=b.units.find(u=>u.side==='enemy');
 for(const t of b.field.tiles){t.terrain='open';t.height=0;}
 for(const [i,u]of b.units.entries())Object.assign(u,{q:1+i,r:20});
 Object.assign(actor,{q:4,r:8,ap:9,fatigue:0,meleeSkill:200,turnStartedRound:1,equipment:{...actor.equipment,weapon:'arming-sword',shield:null}});
 Object.assign(enemy,{q:5,r:8,hp:1,bodyArmor:2,headArmor:2,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,shieldDurability:0});
 b.activeId=actor.id;b.turnIndex=b.turnOrder.indexOf(actor.id);b.rng=1972;
 assert.ok(advanceBattle(state).ok);assert.equal(enemy.hp,0);assert.equal(actor.battleStats.kills,1);assert.equal(actor.battleStats.hpDamageDealt,1);assert.equal(actor.battleStats.armorDamageDealt,2);assert.equal(enemy.battleStats.armorDamageReceived,2);
});
test('New battle counters round-trip; missing legacy counters stay absent',()=>{
 const state=fight();assert.deepEqual(validateSave(structuredClone(state)),state);
 for(const unit of state.battle.units)delete unit.battleStats;
 const legacy=validateSave(structuredClone(state));assert.deepEqual(legacy,state);assert.ok(legacy.battle.units.every(u=>u.battleStats===undefined));
});
test('Forged performance counters are rejected without changing the save',()=>{
 for(const change of [stats=>stats.kills=-1,stats=>stats.hpDamageDealt=Infinity,stats=>delete stats.armorDamageDealt,stats=>stats.extra=2]){
  const state=fight();change(state.battle.units[0].battleStats);assert.throws(()=>validateSave(state),/battle performance stats/);
 }
});
test('Results use two-column card markup and put fallen brothers first',()=>{
 const state=fight(),brothers=state.battle.units.filter(u=>u.side==='company'&&!u.ally),dead=brothers[1];dead.alive=false;dead.hp=0;state.battle.status='victory';brothers[0].battleStats={kills:3,armorDamageDealt:145,hpDamageDealt:82,armorDamageReceived:51};state.battle.xp[brothers[0].id]=62;
 const html=battleResultsHTML(state);assert.ok(html.indexOf(`data-result-brother="${dead.id}"`)<html.indexOf(`data-result-brother="${brothers[0].id}"`));assert.match(html,/result-brother-grid/);assert.match(html,/Enemies killed: 3/);assert.match(html,/Armor damage dealt to enemies: 145/);assert.match(html,/Hitpoint damage dealt to enemies: 82/);assert.match(html,/Armor damage received: 51/);assert.match(html,/Experience gained: 62/);assert.match(html,/† Fallen/);
 delete brothers[0].battleStats;assert.match(battleResultsHTML(state),/Enemies killed: not recorded/);
});

test('MVPs include tied and fallen brothers, exclude allies and zero/unrecorded metrics',()=>{
 const units=[{id:'a',side:'company',alive:true,battleStats:{kills:2,armorDamageDealt:40,hpDamageDealt:10,armorDamageReceived:0}},
 {id:'b',side:'company',alive:false,battleStats:{kills:2,armorDamageDealt:10,hpDamageDealt:80,armorDamageReceived:20}},
 {id:'ally',side:'company',ally:true,battleStats:{kills:999,armorDamageDealt:999,hpDamageDealt:999,armorDamageReceived:999}},
 {id:'legacy',side:'company'}];
 assert.deepEqual(battleMvpAwards(units),new Map([['a',{kills:'Most Lethal',armorDamageDealt:'Tank Killer'}],['b',{kills:'Most Lethal',armorDamageReceived:'Tanker',hpDamageDealt:'Assassin'}]]));
 assert.equal(battleMvpAwards([{id:'zero',side:'company',battleStats:newBattlePerformance()}]).size,0);
 const state=fight();state.battle.status='victory';state.battle.units[0].battleStats={kills:1,armorDamageDealt:20,hpDamageDealt:10,armorDamageReceived:5};
 const html=battleResultsHTML(state);for(const label of ['Most Lethal','Tanker','Tank Killer','Assassin'])assert.match(html,new RegExp(`data-mvp="${label}"`));assert.equal((html.match(/result-mvp-symbol/g)||[]).length,4);
});
