import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/engine.js';
import {hexNeighbors} from '../src/battle-terrain.js';
function setup(weapon='hunting-bow',{perk=false,threats=0,distant=false,side='company'}={}){
 const s=e.createGame(7391),p=s.party[0];p.equipment.weapon=weapon;p.equipment.shield=null;p.armorDurability.shield=0;p.reserveEquipment={weapon:null,shield:null};p.accessories=[null,null];if(perk){p.level=3;p.perks.push('point-blank');}
 while(s.party.length<7){const extra=structuredClone(s.party[1]);extra.id=`ally-${s.party.length}`;s.party.push(extra);}s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);
 const c=e.getCampSites(s).find(c=>c.enemies.length>=4);s.position={x:c.x,y:c.y};e.startBattle(s,c.id);const b=s.battle;for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
 const actor=b.units.find(u=>u.id===p.id);Object.assign(actor,{q:2,r:2,rangedSkill:95,meleeSkill:0,reload:0,fatigue:0,ap:9,turnStartedRound:b.round});
 const foes=b.units.filter(u=>u.side==='enemy');foes.forEach((u,i)=>Object.assign(u,{q:14,r:i+2,headArmor:u.maxHeadArmor,bodyArmor:u.maxBodyArmor,hp:u.maxHp,morale:100,fatigue:0,stunnedTurns:0,disarmedTurns:0,equipment:{...u.equipment,weapon:'arming-sword'}}));
 const spots=[[3,2],[2,3],[1,3]];
 for(let i=0;i<threats;i++)Object.assign(foes[i],{q:spots[i][0],r:spots[i][1]});
 const target=foes[threats];Object.assign(target,{q:distant?5:3,r:2,hp:1,headArmor:0,bodyArmor:0,attachmentArmor:0,attachment2Armor:0});
 const occupied=new Set(b.units.filter(u=>u.side==='enemy').map(u=>`${u.q},${u.r}`));
 const free=hexNeighbors(b.field,actor).filter(point=>!occupied.has(`${point.q},${point.r}`));
 b.units.filter(u=>u.side==='company'&&u!==actor).forEach((u,i)=>Object.assign(u,free[i]??{q:0,r:i+5}));
 if(side==='enemy'){for(const u of b.units)u.side=u.side==='company'?'enemy':'company';actor.ally=false;}
 e.setBattleTactic(s,'focus');b.focusTargetId=target.id;
 if(side==='enemy'){b.enemyTacticalState.tactic='offense';b.enemyTacticalState.lastChangedRound=b.round;}
 b.activeId=actor.id;b.turnIndex=b.turnOrder.indexOf(actor.id);
 return {s,b,actor,target,foes};
}
for(const weapon of e.ITEMS.filter(i=>i.ranged).map(i=>i.id)){
 test(`${weapon}: adjacent shots require Point Blank`,()=>{
  for(const perk of [false,true]){const {s,b}=setup(weapon,{perk});const ammo=s.supplies.ammo;e.advanceBattle(s);assert.equal(['attack','miss'].includes(b.lastEvent.type)&&b.lastEvent.ranged,perk);if(!e.getItem(weapon).throwing)assert.equal(s.supplies.ammo,ammo-(perk?1:0));assert.equal(b.lastEvent.reactions?.length??0,0);}
 });
}
test('distant ranged skills provoke exactly one/two reactions, even with Point Blank',()=>{
 for(const perk of [false,true])for(const threats of [0,1,2,3])for(const weapon of ['hunting-bow','light-crossbow','javelins','northern-sling']){
  const {s,b,actor,target}=setup(weapon,{perk,threats,distant:true});e.advanceBattle(s);
  assert.equal(b.lastEvent.ranged,true,`${weapon}: ${threats} threats`);assert.equal(b.lastEvent.actorId,actor.id);assert.equal(b.lastEvent.targetId,target.id,`${weapon}: ${threats} threats / ${b.lastEvent.message}`);
  const reactions=(b.lastEvent.reactions??[]).filter(r=>r.skillName==='Opportunity Strike');assert.equal(reactions.length,Math.min(2,threats));assert.equal(new Set(reactions.map(r=>r.actorId)).size,reactions.length);
 }
});
test('ranged engagement marker validates, reloads and leaves old battles unchanged',()=>{
 const {s}=setup('hunting-bow');assert.equal(e.validateSave(structuredClone(s)).battle.rangedEngagementVersion,1);
 for(const value of [null,0,2,'1']){const bad=structuredClone(s);bad.battle.rangedEngagementVersion=value;assert.throws(()=>e.validateSave(bad),/ranged engagement/);}
 delete s.battle.rangedEngagementVersion;const restored=e.validateSave(structuredClone(s));assert.equal(restored.battle.rangedEngagementVersion,undefined);e.advanceBattle(restored);assert.equal(restored.battle.lastEvent.ranged,true);
});
test('opportunity reactions survive reload and deterministic continuation',()=>{
 const {s,b}=setup('hunting-bow',{threats:2,distant:true});e.advanceBattle(s);assert.equal(b.lastEvent.reactions.length,2);
 const restored=e.validateSave(structuredClone(s));assert.deepEqual(restored.battle.lastEvent.reactions,b.lastEvent.reactions);
 e.advanceBattle(s);e.advanceBattle(restored);assert.deepEqual(restored,s);
});
test('a lethal opportunity strike cancels the shot without ammunition or double impact',()=>{
 const {s,b,actor,target,foes}=setup('hunting-bow',{threats:2,distant:true});actor.hp=1;actor.bodyArmor=0;actor.headArmor=0;actor.attachmentArmor=0;actor.attachment2Armor=0;actor.meleeDefense=0;
 for(const foe of foes.slice(0,2)){foe.meleeSkill=300;foe.equipment.weapon='spear';}b.rng=1;
 const ammo=s.supplies.ammo,hp=target.hp;e.advanceBattle(s);assert.equal(actor.alive,false);assert.equal(s.supplies.ammo,ammo);assert.equal(target.hp,hp);
 assert.equal(b.lastEvent.type,'hold');assert.equal(b.lastEvent.targetId,null);assert.equal(b.lastEvent.reactions.length,1);assert.equal(b.lastEvent.reactions[0].fallen,true);e.validateSave(structuredClone(s));
});
test('enemies follow the same adjacent restriction and opportunity cap',()=>{
 for(const perk of [false,true]){const adjacent=setup('hunting-bow',{perk,side:'enemy'});e.advanceBattle(adjacent.s);assert.equal(['attack','miss'].includes(adjacent.b.lastEvent.type)&&adjacent.b.lastEvent.ranged,perk);}
 const far=setup('hunting-bow',{threats:3,distant:true,side:'enemy'});e.advanceBattle(far.s);assert.equal(far.b.lastEvent.targetId,far.target.id);assert.equal(far.b.lastEvent.reactions.length,2);
});
test('disabled adjacent foes cannot react and counterattacks cannot chain',()=>{
 const {s,b,foes}=setup('hunting-bow',{threats:3,distant:true});foes[0].stunnedTurns=1;foes[1].disarmedTurns=1;
 e.advanceBattle(s);assert.equal(b.lastEvent.reactions.length,1);assert.equal(b.lastEvent.reactions[0].actorId,foes[2].id);assert.equal(b.lastEvent.reactions[0].skillName,'Opportunity Strike');
});
