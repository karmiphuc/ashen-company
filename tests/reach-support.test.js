import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,getItem,startBattle,advanceBattle,validateSave,setCombatSettings,setBattleTactic} from '../src/engine.js';
import {resolveCombatRole} from '../src/tactical-ai.js';
import {companySheetHTML} from '../src/campaign-ui.js';
function fight(role='reach-support'){
 const s=createGame(7391),p=s.party[0];p.combatRole=role;p.equipment.mount=null;p.equipment.armor='reinforced-mail';p.armorDurability.body=160;p.equipment.weapon='billhook';p.equipment.shield=null;p.armorDurability.shield=0;
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

function support(){
 const f=fight();f.actor.equipment.mount=null;Object.assign(f.actor,{q:4,r:8});Object.assign(f.target,{q:7,r:8,morale:60});f.foes[1].alive=false;f.foes[1].hp=0;f.foes[2].alive=false;f.foes[2].hp=0;return f;
}
function screen(f,q=6,r=8,shield=true){const ally=f.b.units.find(u=>u.side===f.actor.side&&u!==f.actor);Object.assign(ally,{q,r,equipment:{...ally.equipment,weapon:'arming-sword',shield:shield?'round-shield':null},shieldDurability:shield?40:0});return ally;}
test('Auto selects extended melee reach before mounted Breaker while preserving explicit and ranged roles',()=>{
 for(const weapon of ['billhook','polehammer'])assert.equal(resolveCombatRole({},getItem(weapon),null,{armor:getItem('reinforced-mail'),mount:getItem('war-horse')}),'reach-support');
 assert.equal(resolveCombatRole({combatRole:'breaker'},getItem('billhook'),null),'breaker');assert.equal(resolveCombatRole({},getItem('hunting-bow'),getItem('billhook')),'ranged');assert.equal(resolveCombatRole({},getItem('arming-sword'),null),'frontliner');
});
test('Reach Support is selectable and survives company and active-save round trips',()=>{
 const s=createGame(21);assert.ok(setCombatSettings(s,s.party[0].id,{combatRole:'reach-support'}).ok);s.party[0].equipment.weapon='billhook';s.party[0].equipment.shield=null;s.party[0].armorDurability.shield=0;assert.match(companySheetHTML(s,s.party[0],'all',''),/value="reach-support" selected/);assert.deepEqual(validateSave(s),s);
 const camp=getCampSites(s)[0];s.position={x:camp.x,y:camp.y};assert.ok(startBattle(s,camp.id).ok);assert.deepEqual(validateSave(structuredClone(s)),s);
});
test('Reach Support advances behind a shield frontliner and attacks without crossing the screen',()=>{
 const f=support();screen(f);const events=[];
 for(let i=0;i<4&&f.b.activeId===f.actor.id;i++){const e=step(f);events.push(e.type);assert.ok(f.actor.q<=5);}
 assert.ok(events.includes('move'));assert.ok(events.some(e=>['attack','miss'].includes(e)),events.join(','));assert.deepEqual([f.actor.q,f.actor.r],[5,8]);
});
test('A regular melee teammate also provides a useful screen',()=>{
 const f=support();screen(f,6,8,false);for(let i=0;i<4&&f.b.activeId===f.actor.id;i++)step(f);assert.deepEqual([f.actor.q,f.actor.r],[5,8]);
});
test('Unscreened Reach Support stops at two hexes and attacks a shorter weapon',()=>{
 const f=support();const points=[];for(let i=0;i<5&&f.b.activeId===f.actor.id;i++){const e=step(f);points.push([f.actor.q,f.actor.r,e.type]);assert.ok(f.actor.q<=5);}
 assert.ok(points.some(p=>['attack','miss'].includes(p[2])),JSON.stringify(points));assert.deepEqual([f.actor.q,f.actor.r],[5,8]);
});
for(const round of [1,5])test(`A useful attack position remains stable in round ${round}`,()=>{
 const f=support();f.b.round=round;f.actor.turnStartedRound=round;Object.assign(f.actor,{q:5,r:8});screen(f,6,7);const before=[f.actor.q,f.actor.r];
 const e=step(f);assert.ok(['attack','miss'].includes(e.type),e.message);assert.deepEqual([f.actor.q,f.actor.r],before);
});
test('Adjacent enemies cause fighting, never an unsafe retreat',()=>{
 const f=support();Object.assign(f.target,{q:5,r:8});const before=[f.actor.q,f.actor.r];assert.ok(['attack','miss'].includes(step(f).type));assert.deepEqual([f.actor.q,f.actor.r],before);
});
test('An adjacent enemy can trigger an affordable melee backup, without swap oscillation',()=>{
 const f=support();f.actor.reserveEquipment.weapon='arming-sword';Object.assign(f.target,{q:5,r:8});assert.equal(step(f).type,'swap');assert.equal(f.actor.equipment.weapon,'arming-sword');assert.ok(['attack','miss'].includes(step(f).type));assert.equal(f.actor.equipment.weapon,'arming-sword');
});
test('Cannot afford backup plus attack: keep the reach weapon and use its attack',()=>{
 const f=support();f.actor.reserveEquipment.weapon='arming-sword';f.actor.ap=6;Object.assign(f.target,{q:5,r:8});assert.ok(['attack','miss'].includes(step(f).type));assert.equal(f.actor.equipment.weapon,'billhook');
});
test('Approach into attack range reserves AP for an actual attack',()=>{
 const f=support();Object.assign(f.actor,{q:4,r:8,ap:5});const before=[f.actor.q,f.actor.r];assert.notEqual(step(f).type,'move');assert.deepEqual([f.actor.q,f.actor.r],before);
});
test('Reach Support follows a moving screen over multiple rounds without shuffling backwards',()=>{
 const f=support(),ally=screen(f),moves=[];
 for(let round=1;round<=4;round++){
  f.b.round=round;Object.assign(f.actor,{ap:9,fatigue:0,turnStartedRound:round});f.b.activeId=f.actor.id;f.b.turnIndex=f.b.turnOrder.indexOf(f.actor.id);
  Object.assign(f.target,{q:6+round,r:8,hp:300,maxHp:300});Object.assign(ally,{q:5+round,r:8});
  const events=[];for(let n=0;n<4&&f.b.activeId===f.actor.id;n++){const e=step(f);events.push(e.type);if(e.type==='move')moves.push([f.actor.q,f.actor.r]);}
  assert.ok(events.some(type=>['attack','miss'].includes(type)),`${round}: ${events}`);assert.deepEqual([f.actor.q,f.actor.r],[4+round,8]);assert.equal(f.target.q-f.actor.q,2);
 }
 assert.deepEqual(moves,[[5,8],[6,8],[7,8],[8,8]]);
});
test('Reach Support does not Hook an unengaged enemy into its own adjacent hex',()=>{
 const f=support();f.actor.q=5;const e=step(f);assert.notEqual(e.skillName,'Hook');assert.equal(f.target.q-f.actor.q,2);
});
test('A blocked sheltered hex does not prevent an alternate safe attack position',()=>{
 const f=support();screen(f);f.b.field.tiles.find(t=>t.q===5&&t.r===8).terrain='trees';
 const events=[];for(let round=1;round<=3;round++){f.b.round=round;Object.assign(f.actor,{ap:9,fatigue:0,turnStartedRound:round});f.b.activeId=f.actor.id;f.b.turnIndex=f.b.turnOrder.indexOf(f.actor.id);for(let n=0;n<5&&f.b.activeId===f.actor.id;n++){const e=step(f);events.push(e.type);assert.ok(Math.max(Math.abs(f.actor.q-f.target.q),Math.abs(f.actor.r-f.target.r),Math.abs(f.actor.q+f.actor.r-f.target.q-f.target.r))>=2);}}
 assert.ok(events.some(type=>['attack','miss'].includes(type)),events.join(','));
});
test('Reach Support never uses mounted Charge to leave its support duty',()=>{
 const f=support();f.actor.equipment.mount='war-horse';f.actor.q=3;assert.notEqual(step(f).skillName,'Charge');
});
