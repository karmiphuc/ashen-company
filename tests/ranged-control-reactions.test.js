import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startBattle,getCampSites,advanceBattle,validateSave,throwingCapacity} from '../src/engine.js';
import {hexNeighbors,tileAt} from '../src/battle-terrain.js';
function fixture(weapon='hunting-bow'){
 const s=createGame(51),p=s.party[0];p.equipment.weapon=weapon;p.equipment.shield=null;p.armorDurability.shield=0;
 p.reserveEquipment={weapon:null,shield:null};p.armorDurability.reserveShield=0;p.throwingAmmo={active:throwingCapacity(weapon),reserve:0};
 const camp=getCampSites(s)[0];s.position={x:camp.x,y:camp.y};assert.ok(startBattle(s,camp.id).ok);
 const b=s.battle;for(const t of b.field.tiles){t.terrain='open';t.height=0;}
 const actor=b.units.find(u=>u.id===p.id),guard=b.units.find(u=>u.side==='enemy');
 let i=0;for(const u of b.units)if(u!==actor&&u!==guard)Object.assign(u,{q:1+i++,r:20});
 Object.assign(actor,{q:5,r:8,ap:9,fatigue:0,rangedSkill:100,skillPreference:'damage'});
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
 const f=fixture();f.actor.equipment.weapon='arming-sword';f.s.party[0].equipment.weapon='arming-sword';f.guard.equipment.weapon='hunting-bow';f.guard.ap=9;f.guard.rangedSkill=100;
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
