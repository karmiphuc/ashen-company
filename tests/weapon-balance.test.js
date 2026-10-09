import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/engine.js';
import {equipmentSkills,COMBAT_SKILLS} from '../src/combat-skills.js';
function fixture(weapon,seed=911){const state=m.createGame(seed),captain=state.party.find(x=>x.id==='captain');captain.equipment.weapon=weapon;captain.equipment.shield=null;captain.armorDurability.shield=0;const c=m.getCampSites(state)[0];state.position={x:c.x,y:c.y};m.startBattle(state,c.id);const b=state.battle;for(const t of b.field.tiles){t.terrain='open';t.height=0;}const at=(id,q,r)=>Object.assign(b.units.find(x=>x.id===id),{q,r});const a=at('captain',5,5),t=at('enemy-1',6,5);at('guard',0,1);at('scout',0,3);at('enemy-2',12,5);at('enemy-3',13,7);a.meleeSkill=200;a.skillPreference='damage';t.meleeDefense=0;t.hp=t.maxHp=300;t.bodyArmor=t.headArmor=t.attachmentArmor=t.attachment2Armor=0;t.equipment.shield=null;t.shieldDurability=0;b.activeId=a.id;b.turnIndex=b.turnOrder.indexOf(a.id);b.rng=1972;return {state,b,a,t,at};}

test('Warbrand and Rhomphaia Split/Swing cost five AP, including named rolls; other swords retain six',()=>{
 for(const base of ['bb-named-warbrand','rhomphaia'])for(const id of [base,m.createFamedItemId(base,42)]){
  const skills=equipmentSkills(m.getItem(id));for(const name of ['split','swing'])assert.equal(skills.find(s=>s.id===name).ap,5);
 }
 assert.ok(equipmentSkills(m.getItem('rhomphaia')).some(s=>s.id==='reap'));
 for(const name of ['split','swing'])assert.equal(equipmentSkills(m.getItem('greatsword')).find(s=>s.id===name).ap,6);
});
test('Duelist adds penetration with ordinary and named bucklers, but not other intact shields',()=>{
 for(const shield of [null,'buckler',m.createFamedItemId('buckler',17),'legacy-buckler','famed:legacy-buckler:17','round-shield']){
  const f=fixture('arming-sword');f.t.headArmor=f.t.bodyArmor=150;f.a.equipment.shield=shield;f.a.shieldDurability=m.shieldMaximum(shield);f.a.perks=['duelist'];f.state.party[0].level=4;f.state.party[0].perks=['duelist'];
  const plain=structuredClone(f.state);plain.battle.units.find(u=>u.id===f.a.id).perks=[];
  m.advanceBattle(f.state);m.advanceBattle(plain);
  const enhanced=f.b.lastEvent.hpDamage,normal=plain.battle.lastEvent.hpDamage;
  if(shield==='round-shield')assert.equal(enhanced,normal);else assert.ok(enhanced>normal,shield);
 }
});
test('Riposte can be activated with exactly two AP',()=>{
 assert.equal(COMBAT_SKILLS.riposte.ap,2);
 const f=fixture('arming-sword');f.a.ap=2;f.a.turnStartedRound=f.b.round;f.a.skillPreference='control';f.a.fatigue=0;
 m.advanceBattle(f.state);assert.equal(f.b.lastEvent.skillName,'Riposte');assert.equal(f.a.ap,0);assert.equal(f.a.riposteActive,true);
});
test('Goedendag Knock Out deals 75 percent normal damage and still stuns',()=>{
 for(const id of ['goedendag',m.createFamedItemId('goedendag',42)]){
  const f=fixture(id);f.a.skillPreference='control';f.t.meleeSkill=200;
  const normal=structuredClone(f.state);normal.battle.units.find(u=>u.id===f.t.id).stunProtected=true;
  m.advanceBattle(f.state);m.advanceBattle(normal);
  assert.equal(f.b.lastEvent.skillName,'Knock Out');assert.ok(f.t.stunnedTurns>0);
  assert.equal(f.b.lastEvent.head,normal.battle.lastEvent.head);
  assert.ok(Math.abs(f.b.lastEvent.hpDamage-normal.battle.lastEvent.hpDamage*.75)<=1);
 }
 assert.equal(equipmentSkills(m.getItem('goedendag')).find(s=>s.id==='knock-out').damageMultiplier,.75);
 assert.equal(equipmentSkills(m.getItem('winged-mace')).find(s=>s.id==='knock-out').damageMultiplier,undefined);
});
test('five-AP Split and Swing execute and pay five AP with each requested weapon',()=>{
 for(const weapon of ['bb-named-warbrand','rhomphaia'])for(const skill of ['Split','Swing']){
  const f=fixture(weapon);f.a.ap=5;f.a.turnStartedRound=f.b.round;
  const extra=f.at('enemy-2',skill==='Split'?7:6,skill==='Split'?5:4);Object.assign(extra,{hp:300,maxHp:300,headArmor:0,bodyArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0});
  m.advanceBattle(f.state);assert.equal(f.b.lastEvent.skillName,skill,weapon);assert.equal(f.a.ap,0);
 }
});
