import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,startBattle,advanceBattle,getItem,getDoubleGripBonus,createFamedItemId,validateSave,throwingCapacity} from '../src/engine.js';
import {getItemDetails} from '../src/item-details.js';
import {battleHTML} from '../src/battle-view.js';
function fight(weapon='arming-sword'){
 const state=createGame(251),person=state.party[0];person.equipment.weapon=weapon;person.equipment.shield='round-shield';person.armorDurability.shield=60;person.perks=[];
 const site=getCampSites(state)[0];state.position={x:site.x,y:site.y};assert.ok(startBattle(state,site.id).ok);
 const b=state.battle,actor=b.units.find(u=>u.id===person.id),target=b.units.find(u=>u.side==='enemy');
 for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
 Object.assign(actor,{q:2,r:2,meleeSkill:200,rangedSkill:200,morale:50,ap:9,fatigue:0,turnStartedRound:b.round});
 Object.assign(target,{q:3,r:2,hp:500,maxHp:500,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,morale:50,perks:['steel-brow']});target.equipment.shield=null;
 let index=0;for(const u of b.units)if(u!==actor&&u!==target)Object.assign(u,{q:12,r:10+index++});
 b.activeId=actor.id;b.turnIndex=b.turnOrder.indexOf(actor.id);b.rng=0;return {state,b,actor,target};
}
function hit(state){advanceBattle(state);assert.equal(state.battle.lastEvent.type,'attack',state.battle.lastEvent.message);return state.battle.lastEvent;}
for(const weapon of ['arming-sword','fighting-knife',createFamedItemId('arming-sword',381)])test(`${weapon}: empty offhand increases real health damage by 25%`,()=>{
 const f=fight(weapon),empty=structuredClone(f.state);empty.battle.units.find(u=>u.id===f.actor.id).equipment.shield=null;
 const base=hit(f.state),boost=hit(empty);assert.equal(boost.hpDamage,Math.round(base.hpDamage*1.25));assert.equal(boost.skillName,base.skillName);
});
test('Double Grip retains its damage bonus while Duelist adds penetration',()=>{
 const f=fight(),duelist=structuredClone(f.state),unit=duelist.battle.units.find(u=>u.id===f.actor.id);unit.equipment.shield=null;unit.perks=['duelist'];
 const base=hit(f.state);assert.equal(hit(duelist).hpDamage,Math.round(base.hpDamage*1.25));
});
for(const shield of ['usable','broken'])test(`${shield} equipped shield prevents Double Grip`,()=>{
 const f=fight(),control=structuredClone(f.state);if(shield==='broken')f.actor.shieldDurability=0;assert.equal(getDoubleGripBonus(f.actor),0);assert.equal(hit(f.state).hpDamage,hit(control).hpDamage);
});
test('Double Grip excludes ranged, throwing, two-handed, unarmed, and mount attacks',()=>{
 const unit={equipment:{shield:null}};for(const id of ['hunting-bow','javelins','greatsword','pike','war-horse'])assert.equal(getDoubleGripBonus(unit,getItem(id)),0,id);
 assert.equal(getDoubleGripBonus(unit,{damageMin:12,damageMax:20}),0,'mount bite');assert.equal(getDoubleGripBonus(unit,null),0,'unarmed');
});
test('reserve shields do not occupy the active offhand',()=>{
 const f=fight();f.actor.equipment.shield=null;f.actor.reserveEquipment.shield='round-shield';assert.equal(getDoubleGripBonus(f.actor),.25);
});
test('bonus updates after Quick Hands swaps between melee and throwing sets',()=>{
 const f=fight('javelins');f.actor.equipment.shield=null;f.actor.reserveEquipment={weapon:'fighting-knife',shield:null};f.actor.throwingAmmo={active:throwingCapacity('javelins'),reserve:0};f.actor.perks=['quick-hands'];
 assert.equal(getDoubleGripBonus(f.actor),0);advanceBattle(f.state);assert.equal(f.b.lastEvent.type,'swap');assert.equal(f.actor.equipment.weapon,'fighting-knife');assert.equal(getDoubleGripBonus(f.actor),.25);
});
test('older battle damage keeps its previous rule',()=>{
 const f=fight(),empty=structuredClone(f.state);delete f.b.weaponCompletionVersion;delete empty.battle.weaponCompletionVersion;empty.battle.units.find(u=>u.id===f.actor.id).equipment.shield=null;
 assert.equal(hit(empty).hpDamage,hit(f.state).hpDamage);
});
test('Double Grip appears in weapon hints and active battle status, not on shielded units',()=>{
 const f=fight();assert.match(getItemDetails(getItem('arming-sword')).notes.join(' '),/Double Grip: \+25%/);assert.doesNotMatch(getItemDetails(getItem('javelins')).notes.join(' '),/Double Grip/);
 f.actor.equipment.shield=null;assert.match(battleHTML(f.b,0,false),/Double Grip: \+25%/);f.actor.equipment.shield='round-shield';
 for(const u of f.b.units)u.equipment.shield='round-shield';assert.doesNotMatch(battleHTML(f.b,0,false),/battle-status-double-grip/);
});
test('new battles preserve automatic eligibility and damage after save reload',()=>{
 const state=createGame(51);const person=state.party[0];person.equipment.shield=null;person.armorDurability.shield=0;const site=getCampSites(state)[0];state.position={x:site.x,y:site.y};startBattle(state,site.id);
 const loaded=validateSave(structuredClone(state));assert.deepEqual(loaded,state);assert.equal(getDoubleGripBonus(loaded.battle.units.find(u=>u.id===person.id)),.25);
 for(let i=0;i<12&&loaded.battle;i++){advanceBattle(loaded);assert.deepEqual(validateSave(structuredClone(loaded)),loaded);}
});

test('Double Grip boosts armor damage as well as health damage',()=>{
 const f=fight();f.target.bodyArmor=f.target.headArmor=300;const empty=structuredClone(f.state);empty.battle.units.find(u=>u.id===f.actor.id).equipment.shield=null;
 const base=hit(f.state),boost=hit(empty);assert.ok(boost.armorDamage>base.armorDamage);assert.ok(boost.hpDamage>=base.hpDamage);
});
