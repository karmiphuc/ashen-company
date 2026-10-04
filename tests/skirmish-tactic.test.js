import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startBattle,getCampSites,advanceBattle,validateSave,setBattleTactic,shieldMaximum,resolveBattle} from '../src/engine.js';
import {tileAt,hexDistance} from '../src/battle-terrain.js';
import {tacticsHTML,battleHTML} from '../src/battle-view.js';

function fixture(weapon='light-crossbow',distance=6) {
  const s=createGame(7192);s.tactic='skirmish';
  const archer=s.party[0];archer.equipment.weapon=weapon;archer.equipment.shield=null;archer.armorDurability.shield=0;archer.combatRole='ranged';
  const guard=s.party.find(p=>p.id==='guard');guard.equipment.weapon='javelins';guard.equipment.shield='round-shield';guard.armorDurability.shield=shieldMaximum('round-shield');
  const camp=getCampSites(s)[0];s.position={x:camp.x,y:camp.y};assert.ok(startBattle(s,camp.id).ok);
  const b=s.battle;for(const t of b.field.tiles){t.terrain='open';t.height=0;}
  const actor=b.units.find(u=>u.id===archer.id),shield=b.units.find(u=>u.id==='guard'),scout=b.units.find(u=>u.id==='scout'),foes=b.units.filter(u=>u.side==='enemy');
  Object.assign(actor,{q:3,r:8,ap:9,fatigue:0,rangedSkill:70});Object.assign(shield,{q:2,r:7});Object.assign(scout,{q:1,r:9});
  for(const [i,u] of foes.entries())Object.assign(u,{q:3+distance+i,r:8,hp:200,maxHp:200,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,shieldDurability:0,rangedDefense:0,equipment:{...u.equipment,weapon:'arming-sword',shield:null}});
  activate(b,actor.id);return{s,b,actor,shield,foes};
}
function activate(b,id){b.activeId=id;b.turnIndex=b.turnOrder.indexOf(id);}
function step(f){assert.ok(advanceBattle(f.s).ok);return f.b.lastEvent;}
function reload(f){f.s=validateSave(structuredClone(f.s));f.b=f.s.battle;f.actor=f.b.units.find(u=>u.id==='captain');f.shield=f.b.units.find(u=>u.id==='guard');f.foes=f.b.units.filter(u=>u.side==='enemy');}

test('Skirmish is selectable before and during combat, persists, and renders desktop/mobile controls',()=>{
 const s=createGame(2);assert.ok(setBattleTactic(s,'skirmish').ok);assert.equal(validateSave(s).tactic,'skirmish');
 const f=fixture();assert.equal(f.b.formationAdvance,null);const html=battleHTML(f.b,0);assert.match(html,/data-tactic="skirmish" aria-pressed="true"/);assert.match(html,/<option value="skirmish" selected/);
 assert.match(tacticsHTML('skirmish'),/safe Aimed Shots stay stationary/);
 f.actor.skirmishReturn={q:1,r:8,phase:'return'};assert.ok(setBattleTactic(f.s,'defense').ok);assert.equal(f.actor.skirmishReturn,undefined);assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
 const legacy=fixture();delete legacy.b.rulesVersion;assert.equal(setBattleTactic(legacy.s,'skirmish').ok,true,'same tactic is a no-op');setBattleTactic(legacy.s,'offense');const old=structuredClone(legacy.s);assert.equal(setBattleTactic(legacy.s,'skirmish').ok,false);assert.deepEqual(legacy.s,old);
 assert.match(tacticsHTML('offense',false,false),/data-tactic="skirmish"[^>]*disabled/);
});

test('shield throwers advance at most one hex each round, stop at 5–6 and keep their shields',()=>{
 const f=fixture();Object.assign(f.shield,{q:1,r:8});activate(f.b,f.shield.id);
 assert.equal(step(f).type,'move');assert.equal(f.shield.q,2);assert.equal(f.shield.formationMovedRound,f.b.round);
 assert.equal(f.shield.equipment.shield,'round-shield');const p={q:f.shield.q,r:f.shield.r};step(f);assert.deepEqual({q:f.shield.q,r:f.shield.r},p,'no chasing ahead in the same round');
 for(let i=0;i<3;i++){f.b.round++;f.shield.ap=9;activate(f.b,f.shield.id);step(f);}assert.ok([5,6].includes(Math.min(...f.foes.map(u=>hexDistance(u,f.shield)))));
 const stopped={q:f.shield.q,r:f.shield.r};f.b.round++;f.shield.ap=9;activate(f.b,f.shield.id);step(f);assert.deepEqual({q:f.shield.q,r:f.shield.r},stopped);
});

test('crossbows step up, fire and return to their original shelter within the same 9-AP turn',()=>{
 const f=fixture();const home={q:f.actor.q,r:f.actor.r};const round=f.b.round;
 assert.equal(step(f).type,'move');assert.equal(f.actor.skirmishReturn.phase,'aim');reload(f);
 assert.ok(['attack','miss'].includes(step(f).type));assert.equal(f.actor.skirmishReturn.phase,'return');const ammo=f.s.supplies.ammo;reload(f);
 assert.equal(step(f).type,'move');assert.deepEqual({q:f.actor.q,r:f.actor.r},home);assert.equal(f.actor.skirmishReturn,undefined);assert.equal(f.b.round,round);assert.equal(f.actor.reload,1);assert.equal(f.s.supplies.ammo,ammo);assert.ok(f.actor.ap>=0);reload(f);
});

test('a safe Aimed Shot fires from shelter without creating a sortie',()=>{
 const f=fixture('hunting-bow',5);tileAt(f.b.field,f.actor.q,f.actor.r).terrain='trees';const home={q:f.actor.q,r:f.actor.r};
 assert.ok(['attack','miss'].includes(step(f).type));assert.equal(f.b.lastEvent.skillName,'Aimed Shot');assert.deepEqual({q:f.actor.q,r:f.actor.r},home);assert.equal(f.actor.skirmishReturn,undefined);assert.equal(f.actor.ap,2);reload(f);
});

test('bows choose an affordable Quick Shot to reserve same-turn return AP',()=>{
 const f=fixture('hunting-bow',6);const home={q:f.actor.q,r:f.actor.r};assert.equal(step(f).type,'move');f.actor.perks.push('bow-mastery');f.s.party[0].level=5;f.s.party[0].perks.push('bow-mastery');
 assert.ok(['attack','miss'].includes(step(f).type));assert.equal(f.b.lastEvent.skillName,'Quick Shot');assert.equal(step(f).type,'move');assert.deepEqual({q:f.actor.q,r:f.actor.r},home);assert.ok(f.actor.ap>=0);reload(f);
});

test('an unaffordable same-turn return survives a new turn and save reload',()=>{
 const f=fixture('hunting-bow',6);const home={q:f.actor.q,r:f.actor.r};assert.equal(step(f).type,'move');
 assert.ok(['attack','miss'].includes(step(f).type));assert.equal(f.b.lastEvent.skillName,'Aimed Shot');assert.equal(f.actor.ap,0);assert.equal(f.actor.skirmishReturn.phase,'return');reload(f);
 f.b.round++;f.actor.ap=9;activate(f.b,f.actor.id);assert.equal(step(f).type,'move');assert.deepEqual({q:f.actor.q,r:f.actor.r},home);assert.equal(f.actor.skirmishReturn,undefined);reload(f);
});

test('returning archers find an adjacent shelter when their original tile is occupied',()=>{
 const f=fixture();const home={q:f.actor.q,r:f.actor.r};step(f);step(f);Object.assign(f.shield,home);
 assert.equal(step(f).type,'move');assert.notDeepEqual({q:f.actor.q,r:f.actor.r},home);assert.ok(hexDistance(f.actor,home)<=1);assert.equal(f.actor.skirmishReturn,undefined);assert.notEqual(f.actor.q+','+f.actor.r,f.shield.q+','+f.shield.r);reload(f);
});

test('sorties respect fatigue, occupied or impassable tiles and do not walk into melee',()=>{
 const f=fixture();f.actor.fatigue=f.actor.maxFatigue;f.actor.turnStartedRound=f.b.round;const p={q:f.actor.q,r:f.actor.r};step(f);assert.deepEqual({q:f.actor.q,r:f.actor.r},p);assert.ok(f.actor.ap>=0);
 const blocked=fixture();for(const t of blocked.b.field.tiles)if(t.q>=4)t.terrain='palisade';const start={q:blocked.actor.q,r:blocked.actor.r};step(blocked);assert.deepEqual({q:blocked.actor.q,r:blocked.actor.r},start);
});

test('stationary firing seeks nearby tree cover when enemy bows threaten an exposed archer',()=>{
 const f=fixture('hunting-bow',4);for(const u of f.foes)u.equipment.weapon='hunting-bow';tileAt(f.b.field,3,9).terrain='trees';
 assert.equal(step(f).type,'move');assert.match(f.b.lastEvent.message,/cover/);assert.equal(tileAt(f.b.field,f.actor.q,f.actor.r).terrain,'trees');assert.equal(f.actor.skirmishReturn,undefined);reload(f);
});

test('Skirmish closes for melee when the company runs out of ranged ammunition',()=>{
 const f=fixture();f.s.supplies.ammo=0;f.actor.reserveEquipment.weapon='arming-sword';f.actor.reserveEquipment.shield=null;
 assert.equal(step(f).type,'swap');assert.equal(step(f).type,'move');assert.ok(f.actor.q>3);assert.equal(f.actor.skirmishReturn,undefined);
});

test('malformed pending returns are rejected without mutating the save',()=>{
 const f=fixture();step(f);const saved=structuredClone(f.s);assert.deepEqual(validateSave(saved),f.s);
 for(const mutate of [p=>p.phase='teleport',p=>p.q=-1,p=>p.extra=1]){const bad=structuredClone(saved);mutate(bad.battle.units.find(u=>u.id==='captain').skirmishReturn);const before=structuredClone(bad);assert.throws(()=>validateSave(bad),/skirmish return/);assert.deepEqual(bad,before);}
 const wrong=structuredClone(saved);wrong.tactic=wrong.battle.tactic='offense';assert.throws(()=>validateSave(wrong),/skirmish return/);
});

test('Skirmish resolves across seeds and stepwise reload matches instant resolution',()=>{
 for(const seed of [31,71,103]){const s=createGame(seed);s.tactic='skirmish';s.party[0].equipment.weapon='hunting-bow';s.party[0].equipment.shield=null;s.party[0].armorDurability.shield=0;const camp=getCampSites(s)[0];s.position={x:camp.x,y:camp.y};startBattle(s,camp.id);const instant=structuredClone(s);assert.ok(resolveBattle(instant).ok);let loaded=s;for(let i=0;i<1800&&loaded.battle.status==='active';i++){advanceBattle(loaded);loaded=validateSave(structuredClone(loaded));}assert.notEqual(loaded.battle.status,'active');assert.deepEqual(loaded,instant);}
});
