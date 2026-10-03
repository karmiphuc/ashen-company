import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startBattle,getCampSites,advanceBattle,validateSave,getItem} from '../src/engine.js';
import {hexDistance,tileAt,rangedCoverModifier,hexNeighbors} from '../src/battle-terrain.js';
import {rangedScreenModifier,rankTacticalActions,tacticalTargetPriority} from '../src/tactical-ai.js';

function fixture(tactic='defense',weapon='hunting-bow',role='ranged') {
  const s=createGame(6901);s.tactic=tactic;s.party[0].equipment.weapon=weapon;s.party[0].equipment.shield=null;s.party[0].armorDurability.shield=0;s.party[0].combatRole=role;
  const camp=getCampSites(s)[0];s.position={x:camp.x,y:camp.y};assert.ok(startBattle(s,camp.id).ok);
  const b=s.battle;b.tactic=tactic;b.engaged=false;b.lastContactRound=b.round;
  for(const t of b.field.tiles){t.terrain='open';t.height=0;}
  const actor=b.units.find(u=>u.id==='captain');Object.assign(actor,{q:4,r:8,ap:9,fatigue:0});
  const shield=b.units.find(u=>u.id==='guard');Object.assign(shield,{q:1,r:1});
  const scout=b.units.find(u=>u.id==='scout');Object.assign(scout,{q:1,r:2});
  const foes=b.units.filter(u=>u.side==='enemy');
  for(const [i,u] of foes.entries())Object.assign(u,{q:10+i,r:8,hp:80,maxHp:80,morale:60,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,shieldDurability:0,rangedDefense:0,equipment:{...u.equipment,weapon:'hunting-bow',shield:null}});
  return {s,b,actor,shield,foes};
}
function activate(b,id='captain'){b.activeId=id;b.turnIndex=b.turnOrder.indexOf(id);}
function act(f){activate(f.b);assert.ok(advanceBattle(f.s).ok);return f.b.lastEvent;}

for(const tactic of ['defense','shield-wall']) test(`${tactic} archers seek tree cover before holding, then stay protected`,()=>{
  const f=fixture(tactic);
  tileAt(f.b.field,4,9).terrain='trees';
  assert.equal(act(f).type,'move');assert.deepEqual({q:f.actor.q,r:f.actor.r},{q:4,r:9});
  assert.match(f.b.lastEvent.message,/cover/);
  const p={q:f.actor.q,r:f.actor.r};act(f);assert.deepEqual({q:f.actor.q,r:f.actor.r},p,'no oscillating away from cover');
  assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
});

test('palisade shelter is sought without stepping onto blocked tiles',()=>{
  const f=fixture();
  Object.assign(f.foes[0],{q:9,r:8});for(const u of f.foes.slice(1))Object.assign(u,{q:9,r:9});
  // Keep the fixture's enemies distinct, and use a wall outside the current shot ray.
  if(f.foes[2])Object.assign(f.foes[2],{q:10,r:9});
  tileAt(f.b.field,5,9).terrain='palisade';
  assert.equal(act(f).type,'move');assert.match(f.b.lastEvent.message,/cover/);
  assert.notEqual(tileAt(f.b.field,f.actor.q,f.actor.r).terrain,'palisade');
  assert.ok(f.foes.some(u=>rangedCoverModifier(f.b.field,u,f.actor)<0),'wall lies between incoming fire and the new position');
});

test('shield screens are directional, require living intact shields, and do not stack',()=>{
  const f=fixture();Object.assign(f.shield,{q:5,r:8,shieldDurability:60});
  const shooter=f.foes[0];
  assert.equal(rangedScreenModifier(f.b,shooter,f.actor),-12);
  f.shield.shieldWallActive=true;
  Object.assign(f.b.units.find(u=>u.id==='scout'),{q:6,r:8,shieldDurability:60,equipment:{...f.actor.equipment,weapon:'spear',shield:'round-shield'}});
  assert.equal(rangedScreenModifier(f.b,shooter,f.actor),-18,'screens use strongest shield, not a sum');
  f.b.units.find(u=>u.id==='scout').shieldDurability=0;
  assert.equal(rangedScreenModifier(f.b,{q:4,r:12},f.actor),0);
  f.shield.shieldDurability=0;assert.equal(rangedScreenModifier(f.b,shooter,f.actor),0);
  f.shield.shieldDurability=60;f.shield.alive=false;assert.equal(rangedScreenModifier(f.b,shooter,f.actor),0);
});

test('archers reposition behind a shield soldier rather than marching beside the shield wall',()=>{
  const f=fixture('shield-wall');Object.assign(f.shield,{q:5,r:9,shieldDurability:60});
  for(const [i,u] of f.foes.entries())Object.assign(u,{q:10+i,r:9});
  assert.equal(act(f).type,'move');
  assert.ok(rangedScreenModifier(f.b,f.foes[0],f.actor)<0);
});

for(const role of ['ranged','skirmisher']) test(`${role} makes space when adjacent, including reloads`,()=>{
  const f=fixture('offense',role==='ranged'?'light-crossbow':'javelins',role);
  for(const [i,u] of f.foes.entries())Object.assign(u,{q:5+i,r:8});
  f.actor.reload=role==='ranged'?1:0;
  const before=Math.min(...f.foes.map(u=>hexDistance(u,f.actor)));
  assert.ok(['move','attack','miss'].includes(act(f).type));
  assert.ok(Math.min(...f.foes.map(u=>hexDistance(u,f.actor)))>before);
  if(role==='ranged')assert.equal(f.actor.reload,1,'reload follows safe repositioning');
});

test('ammo-exhausted ranged roles engage with their melee backup under defensive orders',()=>{
  for(const tactic of ['defense','shield-wall']) {
    const f=fixture(tactic);f.s.supplies.ammo=0;
    f.actor.reserveEquipment.weapon='arming-sword';f.actor.reserveEquipment.shield=null;
    assert.equal(act(f).type,'swap');
    const start={q:f.actor.q,r:f.actor.r};const event=act(f);
    assert.equal(event.type,'move');assert.ok(hexDistance(f.actor,f.foes[0])<hexDistance(start,f.foes[0]));
  }
});

test('flankers pursue reachable archers around the front line and prefer ranged/polearm strikes',()=>{
  const f=fixture('offense','arming-sword','flanker');
  Object.assign(f.foes[0],{q:7,r:8,equipment:{...f.foes[0].equipment,weapon:'arming-sword'}});
  Object.assign(f.foes[1],{q:8,r:10,equipment:{...f.foes[1].equipment,weapon:'hunting-bow'}});
  Object.assign(f.foes[2],{q:9,r:9,equipment:{...f.foes[2].equipment,weapon:'billhook'}});
  assert.equal(act(f).type,'move');assert.equal(f.actor.aiTargetId,f.foes[1].id);
  assert.ok(hexDistance(f.actor,f.foes[0])>1,'does not rush into a frontliner');
  const a={...f.actor,ap:9};const options=f.foes.map(target=>({id:target.id,type:'attack',target,targetWeapon:getItem(target.equipment.weapon),targetDistance:1,apCost:4,expectedHealthDamage:20}));
  assert.equal(rankTacticalActions(a,options)[0].target.id,f.foes[1].id);
  assert.ok(tacticalTargetPriority('flanker',f.foes[2],getItem('billhook'),1)>tacticalTargetPriority('flanker',f.foes[0],getItem('arming-sword'),1));
});

test('skirmishers hit the nearest frontline while ranged roles finish exposed easy targets',()=>{
  const f=fixture('offense','javelins','skirmisher');
  Object.assign(f.foes[0],{q:7,r:8,hp:80,equipment:{...f.foes[0].equipment,weapon:'arming-sword'}});
  Object.assign(f.foes[1],{q:8,r:8,hp:80,equipment:{...f.foes[1].equipment,weapon:'hunting-bow'}});
  Object.assign(f.foes[2],{q:12,r:8});
  assert.equal(act(f).targetId,f.foes[0].id);
  const g=fixture('offense');Object.assign(g.foes[0],{q:8,r:8,hp:80,rangedDefense:25,shieldDurability:40,equipment:{...g.foes[0].equipment,weapon:'arming-sword',shield:'kite-shield'}});
  Object.assign(g.foes[1],{q:7,r:9,hp:1,rangedDefense:0});Object.assign(g.foes[2],{q:12,r:8});
  assert.equal(act(g).targetId,g.foes[1].id);
});


test('friendly shield screening reduces actual ranged hit chance with identical combat rolls',()=>{
 const f=fixture('focus');f.b.focusTargetId=f.foes[0].id;
 Object.assign(f.foes[0],{q:8,r:8,hp:200,maxHp:200});
 Object.assign(f.foes[1],{q:7,r:8,shieldDurability:48,equipment:{...f.foes[1].equipment,weapon:'arming-sword',shield:'round-shield'}});
 f.actor.rangedSkill=50;let screenedMisses=0;
 for(let rng=0;rng<64;rng++){
   const covered=structuredClone(f),exposed=structuredClone(f);
   // Rebind fixture references after cloning whole structures: s.battle is the authoritative battle.
   for(const copy of [covered,exposed]){copy.b=copy.s.battle;copy.actor=copy.b.units.find(u=>u.id==='captain');copy.b.rng=(rng*2654435761)>>>0;}
   exposed.b.units.find(u=>u.id===f.foes[1].id).shieldDurability=0;
   const a=act(exposed),b=act(covered);assert.equal(a.targetId,f.foes[0].id);assert.equal(b.targetId,f.foes[0].id);
   if(a.type==='attack'&&b.type==='miss')screenedMisses++;
   assert.ok(!(a.type==='miss'&&b.type==='attack'),'screen cannot improve incoming accuracy');
 }
 assert.ok(screenedMisses>0,'screening changes actual landed shots');
});

test('cover cannot spend unavailable AP or enter a blocked tile',()=>{
 const f=fixture();f.actor.ap=2;
 for(const p of hexNeighbors(f.b.field,f.actor))tileAt(f.b.field,p.q,p.r).terrain='dense-trees';
 tileAt(f.b.field,4,9).terrain='trees';
 const from={q:f.actor.q,r:f.actor.r};act(f);
 assert.deepEqual({q:f.actor.q,r:f.actor.r},from);
 assert.ok(f.actor.ap>=0);
});

test('depleted throwing ammo permits close engagement without spending company arrows',()=>{
 const f=fixture('defense','javelins','skirmisher');f.actor.throwingAmmo.active=0;
 f.actor.reserveEquipment.weapon='arming-sword';f.actor.reserveEquipment.shield=null;
 const arrows=f.s.supplies.ammo;assert.equal(act(f).type,'swap');
 const from={q:f.actor.q,r:f.actor.r};assert.equal(act(f).type,'move');
 assert.ok(hexDistance(f.actor,f.foes[0])<hexDistance(from,f.foes[0]));assert.equal(f.s.supplies.ammo,arrows);
});
