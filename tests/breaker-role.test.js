import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,getItem,startBattle,advanceBattle,validateSave,setCombatSettings,setBattleTactic} from '../src/engine.js';
import {resolveCombatRole} from '../src/tactical-ai.js';
import {companySheetHTML} from '../src/campaign-ui.js';
function fight(role='breaker'){
 const s=createGame(7391),p=s.party[0];p.combatRole=role;p.equipment.mount='war-horse';p.equipment.armor='reinforced-mail';p.armorDurability.body=160;p.equipment.weapon='arming-sword';
 const camp=getCampSites(s)[0];s.position={x:camp.x,y:camp.y};assert.ok(startBattle(s,camp.id).ok);
 const b=s.battle,actor=b.units.find(u=>u.id===p.id),foes=b.units.filter(u=>u.side==='enemy'),target=foes[0];
 for(const t of b.field.tiles){t.terrain='open';t.height=0;}
 for(const [i,u]of b.units.filter(u=>u.side==='company'&&u!==actor).entries())Object.assign(u,{q:1,r:1+i});
 Object.assign(actor,{q:3,r:8,meleeSkill:200,turnStartedRound:1,ap:9,fatigue:0});
 for(const [i,u]of foes.entries())Object.assign(u,{q:6+i*3,r:8-i*2,hp:300,maxHp:300,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,morale:60,shieldDurability:0,equipment:{...u.equipment,weapon:i?'hunting-bow':'arming-sword',shield:null}});
 b.activeId=actor.id;b.turnIndex=b.turnOrder.indexOf(actor.id);b.rng=1972;
 return {s,b,actor,target,foes};
}
function step(f){assert.ok(advanceBattle(f.s).ok);return f.b.lastEvent;}
test('Auto selects armored melee war-horse riders as Breakers, preserving ranged and explicit roles',()=>{
 for(const mount of ['war-horse','armored-war-horse'])assert.equal(resolveCombatRole({},getItem('arming-sword'),null,{armor:getItem('reinforced-mail'),mount:getItem(mount)}),'breaker');
 for(const mount of ['riding-horse','warg-mount','dire-wolf-mount'])assert.equal(resolveCombatRole({},getItem('arming-sword'),null,{armor:getItem('reinforced-mail'),mount:getItem(mount)}),'frontliner');
 assert.equal(resolveCombatRole({},getItem('arming-sword'),null,{armor:getItem('leather-vest'),mount:getItem('war-horse')}),'frontliner');
 assert.equal(resolveCombatRole({},getItem('hunting-bow'),null,{armor:getItem('reinforced-mail'),mount:getItem('war-horse')}),'ranged');
 assert.equal(resolveCombatRole({},getItem('javelins'),null,{armor:getItem('reinforced-mail'),mount:getItem('war-horse')}),'skirmisher');
 assert.equal(fight('auto').actor.tacticalRole,'breaker');assert.equal(fight('flanker').actor.tacticalRole,'flanker');
});
test('Breaker is selectable and persists in company and active saves',()=>{
 const s=createGame(3);assert.ok(setCombatSettings(s,s.party[0].id,{combatRole:'breaker'}).ok);assert.match(companySheetHTML(s,s.party[0],'all',''),/value="breaker" selected/);assert.deepEqual(validateSave(s),s);
 const f=fight();assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
});
test('Breaker charges to stun and open a gap, then pursues an exposed archer safely',()=>{
 const f=fight();Object.assign(f.foes[1],{q:8,r:6});f.foes[2].alive=false;f.foes[2].hp=0;
 assert.equal(step(f).skillName,'Charge');assert.equal(f.actor.ap,3);assert.equal(f.target.q,7);assert.equal(f.target.stunnedTurns,1);assert.ok(f.b.lastEvent.pushedFrom);
 const e=step(f);assert.equal(e.type,'move');assert.equal(f.actor.aiTargetId,f.foes[1].id);assert.notEqual(f.actor.r,8);assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
});
test('Flanker circles around the front line instead of making a head-on charge',()=>{
 const f=fight('flanker');assert.notEqual(step(f).skillName,'Charge');assert.equal(f.b.lastEvent.type,'move');assert.notEqual(f.actor.r,8);
});
test('Breaker rejects Spearwall and crowded charge landings, and obeys formation tactics',()=>{
 const spear=fight();spear.target.equipment.weapon='spear';spear.target.spearwallActive=true;assert.notEqual(step(spear).skillName,'Charge');
 const crowd=fight();Object.assign(crowd.foes[1],{q:5,r:7});Object.assign(crowd.foes[2],{q:4,r:9});crowd.b.units.push({...structuredClone(crowd.foes[1]),id:'crowd-extra',q:6,r:7});assert.notEqual(step(crowd).skillName,'Charge');
 for(const tactic of ['defense','shield-wall','advance-formation','skirmish']){const f=fight();setBattleTactic(f.s,tactic);assert.notEqual(step(f).skillName,'Charge');}
 const tired=fight();tired.actor.fatigue=tired.actor.maxFatigue;assert.notEqual(step(tired).skillName,'Charge');
});
