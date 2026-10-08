import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startBattle,getCampSites,advanceBattle,validateSave,throwingCapacity,advanceSimultaneousBattle} from '../src/engine.js';
import {battleHTML} from '../src/battle-view.js';
import {setSimultaneousBetaEnabled} from '../src/combat-config.js';
import {simultaneousEvents,rememberSimultaneousEvent} from '../src/simultaneous-combat.js';
import {hexNeighbors,tileAt} from '../src/battle-terrain.js';
function fixture(weapon='hunting-bow'){
 const s=createGame(51),p=s.party[0];p.level=3;p.perks=['point-blank'];p.equipment.weapon=weapon;p.equipment.shield=null;p.armorDurability.shield=0;
 p.reserveEquipment={weapon:null,shield:null};p.armorDurability.reserveShield=0;p.throwingAmmo={active:throwingCapacity(weapon),reserve:0};
 const camp=getCampSites(s)[0];s.position={x:camp.x,y:camp.y};assert.ok(startBattle(s,camp.id).ok);
 const b=s.battle;for(const t of b.field.tiles){t.terrain='open';t.height=0;}
 const actor=b.units.find(u=>u.id===p.id),guard=b.units.find(u=>u.side==='enemy');
 let i=0;for(const u of b.units)if(u!==actor&&u!==guard)Object.assign(u,{q:1+i++,r:20});
 Object.assign(actor,{q:5,r:8,ap:9,fatigue:0,rangedSkill:100,perks:['point-blank'],skillPreference:'damage'});
 Object.assign(guard,{q:6,r:8,hp:200,maxHp:200,ap:0,fatigue:0,morale:60,meleeSkill:100,rangedDefense:0,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,shieldDurability:0,maxShieldDurability:0,equipment:{...guard.equipment,weapon:'arming-sword',shield:null}});
 for(const point of hexNeighbors(b.field,actor))if(point.q!==guard.q||point.r!==guard.r)tileAt(b.field,point.q,point.r).terrain='dense-trees';
 return{s,b,actor,guard};
}
function shoot(f){f.b.activeId=f.actor.id;f.b.turnIndex=f.b.turnOrder.indexOf(f.actor.id);assert.ok(advanceBattle(f.s).ok);return f.b.lastEvent;}
for(const weapon of ['hunting-bow','light-crossbow','javelins','throwing-axes','northern-sling'])test(`${weapon} firing in adjacent melee control provokes exactly one free strike before firing`,()=>{
 const f=fixture(weapon),before=f.guard.fatigue;const event=shoot(f);
 assert.ok(['attack','miss'].includes(event.type),event.message);assert.equal(event.reactions?.length,1,event.message);
 const reaction=event.reactions[0];assert.equal(reaction.skillName,'Opportunity Strike');assert.equal(reaction.actorId,f.guard.id);assert.equal(reaction.targetId,f.actor.id);
 assert.equal(f.guard.ap,0);assert.equal(f.guard.fatigue,before+5);assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
});
test('each adjacent armed melee opponent reacts once, but a guard two hexes away does not',()=>{
 const f=fixture(),extra=f.b.units.filter(u=>u.side==='enemy'&&u!==f.guard);
 const nearby=extra[0],distant=extra[1];
 Object.assign(nearby,{q:5,r:9,equipment:{...nearby.equipment,weapon:'spear',shield:null},shieldDurability:0,maxShieldDurability:0,ap:0,fatigue:0});tileAt(f.b.field,5,9).terrain='open';
 Object.assign(distant,{q:7,r:8,equipment:{...distant.equipment,weapon:'billhook',shield:null},shieldDurability:0,maxShieldDurability:0,ap:0,fatigue:0});
 // Occupy the newly opened neighbor so there remains no safe retreat tile.
 const event=shoot(f);assert.equal(event.reactions.length,2);assert.deepEqual(new Set(event.reactions.map(r=>r.actorId)),new Set([f.guard.id,nearby.id]));assert.equal(distant.fatigue,0);
});
test('ranged, stunned, disarmed, exhausted and dead adjacent opponents cannot react',()=>{
 for(const patch of [{equipment:{weapon:'hunting-bow',shield:null}},{stunnedTurns:1,stunProtected:true},{disarmedTurns:1},{fatigue:100,maxFatigue:100},{alive:false,hp:0}]){
  const f=fixture();Object.assign(f.guard,patch);if(!f.guard.alive){tileAt(f.b.field,f.guard.q,f.guard.r).terrain='dense-trees';const other=f.b.units.find(u=>u.side==='enemy'&&u.alive);Object.assign(other,{q:7,r:8});tileAt(f.b.field,6,8).terrain='trees';f.actor.ap=7;}
  const event=shoot(f);assert.equal(event.reactions,undefined,event.message);
 }
});
test('a lethal reaction interrupts the ranged skill before ammunition is spent',()=>{
 let killed=false;
 for(let rng=1;rng<=20&&!killed;rng++){
  const f=fixture();f.actor.hp=1;f.actor.bodyArmor=f.actor.headArmor=f.actor.attachmentArmor=f.actor.attachment2Armor=0;f.actor.meleeDefense=0;f.b.rng=rng;
  const ammo=f.s.supplies.ammo,event=shoot(f);if(f.actor.alive)continue;killed=true;
  assert.equal(event.type,'hold');assert.match(event.message,/interrupted/);assert.equal(event.reactions[0].fallen,true);assert.equal(f.s.supplies.ammo,ammo);
  assert.ok(f.actor.ap<9);assert.equal(f.guard.hp,200);assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
 }
 assert.ok(killed);
});
test('enemy ranged firing provokes the company melee guard too',()=>{
 const f=fixture();f.actor.equipment.weapon='arming-sword';f.s.party[0].equipment.weapon='arming-sword';f.guard.equipment.weapon='hunting-bow';f.guard.ap=9;f.guard.rangedSkill=100;f.guard.perks=['point-blank'];
 for(const p of hexNeighbors(f.b.field,f.guard))if(p.q!==f.actor.q||p.r!==f.actor.r)tileAt(f.b.field,p.q,p.r).terrain='dense-trees';
 f.b.activeId=f.guard.id;f.b.turnIndex=f.b.turnOrder.indexOf(f.guard.id);assert.ok(advanceBattle(f.s).ok);
 assert.equal(f.b.lastEvent.reactions?.[0].actorId,f.actor.id);assert.equal(f.b.lastEvent.reactions[0].targetId,f.guard.id);
});
test('short-lived advance-on-fire metadata remains loadable but no longer changes enemy commands',()=>{
 const f=fixture();f.guard.rangedProvocation={sourceId:f.actor.id,round:1};assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
});
test('every shot provokes again in the same round, rather than only once per turn',()=>{
 const f=fixture();f.actor.ap=4;assert.equal(shoot(f).reactions.length,1);f.actor.ap=4;
 assert.equal(shoot(f).reactions.length,1);assert.equal(f.guard.fatigue,10);
});

for (const realtime of [false,true]) for(const adjacentTarget of [false,true]) test(`enemy Power Throw provokes two adjacent melee brothers (${realtime?'realtime':'turn based'}, ${adjacentTarget?'Point Blank':'distant target without perk'})`,()=>{
 setSimultaneousBetaEnabled(realtime);
 let f;try{f=fixture();}finally{setSimultaneousBetaEnabled(false);}
 const {s,b,actor,guard}=f,second=b.units.find(u=>u.side==='company'&&u!==actor);
 actor.equipment.weapon='arming-sword';
 Object.assign(second,{q:6,r:9,ap:0,fatigue:0,maxFatigue:150,equipment:{...second.equipment,weapon:'arming-sword',shield:null}});
 Object.assign(guard,{ap:9,maxFatigue:150,rangedSkill:100,perks:['point-blank'],role:'ranged',skillPreference:'damage',reserveEquipment:{weapon:null,shield:null},throwingAmmo:{active:throwingCapacity('javelins'),reserve:0},equipment:{...guard.equipment,weapon:'javelins',shield:null}});
 for(const p of hexNeighbors(b.field,guard))tileAt(b.field,p.q,p.r).terrain='dense-trees';
 tileAt(b.field,actor.q,actor.r).terrain='open';tileAt(b.field,second.q,second.r).terrain='open';
 if(!adjacentTarget){
  guard.perks=[];const distant=b.units.find(u=>u.side==='company'&&u!==actor&&u!==second);
  Object.assign(distant,{q:8,r:8,ap:0});tileAt(b.field,8,8).terrain='open';
 }
 let event;
 if(realtime){
  for(const u of b.units)b.simultaneous.actors[u.id].readyAt=u===guard?0:5000;
  advanceSimultaneousBattle(s,50,{maxActions:1});event=simultaneousEvents(b).at(-1)?.event;
 }else{b.activeId=guard.id;b.turnIndex=b.turnOrder.indexOf(guard.id);assert.ok(advanceBattle(s).ok);event=b.lastEvent;}
 assert.equal(event?.skillName,'Power Throw',event?.message);
 assert.equal(event.reactions?.length,2,event.message);
 assert.deepEqual(new Set(event.reactions.map(r=>r.actorId)),new Set([actor.id,second.id]));
 if(realtime){
  // A newer guard action must not erase the independent incoming reaction cue.
  rememberSimultaneousEvent(b,{actorId:actor.id,targetId:guard.id,type:'hold',skillName:'Hold',message:'Hold'},200);
  assert.match(battleHTML(b,1,true),/Opportunity ×2/);
 }
});

test('an ordinary ranged fighter cannot fire at an adjacent enemy without Point Blank',()=>{
 for(const weapon of ['hunting-bow','light-crossbow','javelins','throwing-axes','northern-sling']){
  const f=fixture(weapon);f.actor.perks=[];
  for(const u of f.b.units)if(u!==f.actor&&u!==f.guard)u.alive=false;
  const ammo=f.s.supplies.ammo,charges=f.actor.throwingAmmo.active;
  const event=shoot(f);assert.ok(!['attack','miss'].includes(event.type),event.message);
  assert.equal(f.s.supplies.ammo,ammo);assert.equal(f.actor.throwingAmmo.active,charges);
 }
});
test('three adjacent melee guards provoke only two Opportunity Strikes',()=>{
 const f=fixture(),guards=f.b.units.filter(u=>u.side==='enemy'&&u!==f.guard).slice(0,2);
 for(const [i,u] of guards.entries()){Object.assign(u,{q:5-i,r:9,ap:0,fatigue:0,maxFatigue:150,equipment:{...u.equipment,weapon:'arming-sword',shield:null}});tileAt(f.b.field,u.q,u.r).terrain='open';}
 const event=shoot(f);assert.equal(event.reactions.length,2);assert.equal(new Set(event.reactions.map(r=>r.actorId)).size,2);
 assert.equal([f.guard,...guards].filter(u=>u.fatigue===5).length,2);
});
