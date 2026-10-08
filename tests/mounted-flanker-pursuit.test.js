import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,getItem,startBattle,advanceBattle} from '../src/engine.js';
function fight(role='flanker'){
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

function pursuit(weapon='arming-sword',reserve=null){
 const f=fight();f.actor.equipment.weapon=weapon;f.actor.reserveEquipment.weapon=reserve;f.actor.equipment.shield=null;f.actor.shieldDurability=0;
 Object.assign(f.target,{q:7,r:8,morale:10});Object.assign(f.foes[1],{q:10,r:5,morale:60});f.foes[2].alive=false;f.foes[2].hp=0;return f;
}
test('Mounted Flanker prioritizes a broken melee enemy over a healthy archer',()=>{
 const f=pursuit();assert.equal(step(f).type,'move');assert.equal(f.actor.aiTargetId,f.target.id);assert.deepEqual([f.actor.q,f.actor.r],[4,8]);
});
test('Mounted Flanker draws a loaded melee reserve before chasing',()=>{
 const f=pursuit('hunting-bow','arming-sword');assert.equal(step(f).type,'swap');assert.equal(f.actor.equipment.weapon,'arming-sword');assert.equal(f.actor.aiTargetId,f.target.id);assert.equal(step(f).type,'move');assert.equal(f.actor.equipment.weapon,'arming-sword');
});
test('Mounted Flanker retains melee at contact and strikes when its captive flees',()=>{
 const f=pursuit('arming-sword','hunting-bow');Object.assign(f.actor,{q:6,r:8,meleeSkill:200});
 const e=step(f);assert.ok(['attack','miss'].includes(e.type),e.message);assert.equal(f.actor.equipment.weapon,'arming-sword');assert.equal(f.actor.aiTargetId,f.target.id);
 f.b.round=2;f.actor.q=f.b.field.columns-2;f.target.q=f.b.field.columns-1;f.target.firstFleeRound=1;
 Object.assign(f.target,{fleeRollRound:f.b.round,fleeRound:f.b.round,ap:9,fatigue:0,injuries:[],turnStartedRound:f.b.round});f.b.activeId=f.target.id;f.b.turnIndex=f.b.turnOrder.indexOf(f.target.id);
 const escape=step(f);assert.ok(escape.reactions?.some(r=>r.actorId===f.actor.id && r.skillName==='Opportunity Strike'),JSON.stringify(escape));
});
test('An engaged mounted Flanker does not leave a healthy opponent to chase',()=>{
 const f=pursuit();Object.assign(f.foes[1],{q:4,r:8,equipment:{...f.foes[1].equipment,weapon:'arming-sword'}});const before=[f.actor.q,f.actor.r];
 assert.ok(['attack','miss'].includes(step(f).type));assert.deepEqual([f.actor.q,f.actor.r],before);
});
test('An unmounted Flanker keeps its normal archer priority',()=>{
 const f=pursuit();f.actor.equipment.mount=null;step(f);assert.equal(f.actor.aiTargetId,f.foes[1].id);
});
test('Recovered and morale-immune enemies do not attract mounted pursuit',()=>{
 for(const immune of [false,true]){const f=pursuit();if(immune)f.target.undeadTraitsVersion=1;else f.target.morale=60;step(f);assert.equal(f.actor.aiTargetId,f.foes[1].id);}
});
test('Mounted pursuit draws a pocket melee weapon and does not swap back',()=>{
 const f=pursuit('hunting-bow',null);f.actor.accessories[0]='fighting-knife';assert.equal(step(f).type,'swap');assert.equal(f.actor.equipment.weapon,'fighting-knife');assert.equal(step(f).type,'move');assert.equal(f.actor.equipment.weapon,'fighting-knife');
});
test('Mounted interception avoids a healthy guard’s melee reach',()=>{
 const f=pursuit();Object.assign(f.foes[1],{q:5,r:8,equipment:{...f.foes[1].equipment,weapon:'arming-sword'}});
 assert.equal(step(f).type,'move');const dq=f.actor.q-f.foes[1].q,dr=f.actor.r-f.foes[1].r;assert.ok(Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))>1);
});
test('Pursuit does not grant a free swap without Quick Hands',()=>{
 const f=pursuit('hunting-bow','arming-sword');f.actor.ap=4;assert.equal(step(f).type,'swap');assert.equal(f.actor.ap,0);
});
test('Wounded mounted Flanker leaves interception to healthy brothers',()=>{
 const f=pursuit();f.actor.hp=1;f.target.hp=20;const before=f.actor.q;step(f);assert.ok(f.actor.q<=before);assert.notEqual(f.actor.aiTargetId,f.target.id);
});
