import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,startBattle,advanceBattle,setBattleTactic,getItem,shieldMaximum,throwingCapacity,validateSave,resolveBattle,acceptContract,getContractTarget} from '../src/engine.js';
import {COMBAT_ROLES,resolveCombatRole} from '../src/tactical-ai.js';
import {tileAt} from '../src/battle-terrain.js';
import {findOffer} from './helpers/contract-offers.js';

function fight({weapon='arming-sword',reserve=null,reserveShield=null,role='frontliner',tactic='offense',quick=false}={}){
 const state=createGame(6901),person=state.party[0];person.combatRole=role;person.equipment.weapon=weapon;person.equipment.shield=null;person.armorDurability.shield=0;
 person.reserveEquipment={weapon:reserve,shield:reserveShield};person.armorDurability.reserveShield=shieldMaximum(reserveShield);
 person.throwingAmmo={active:throwingCapacity(weapon),reserve:throwingCapacity(reserve)};
 if(quick){person.level=7;person.perks.push('quick-hands');}
 if(tactic==='skirmish'){const scout=state.party.find(p=>p.id==='scout');scout.equipment.weapon='hunting-bow';scout.equipment.shield=null;scout.armorDurability.shield=0;}
 const camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};assert.ok(startBattle(state,camp.id).ok);setBattleTactic(state,tactic);
 const b=state.battle;for(const t of b.field.tiles){t.terrain='open';t.height=0;}
 const actor=b.units.find(u=>u.id===person.id),enemies=b.units.filter(u=>u.side==='enemy'),target=enemies[0];
 Object.assign(actor,{q:4,r:8,ap:9,fatigue:0,turnStartedRound:b.round,meleeSkill:150,rangedSkill:150});
 for(const [i,u]of b.units.filter(u=>u.side==='company'&&u!==actor).entries())Object.assign(u,{q:1+i,r:18});
 for(const [i,u]of enemies.entries())Object.assign(u,{q:8+i*3,r:8-i*2,hp:300,maxHp:300,meleeDefense:0,rangedDefense:0,shieldDurability:0});
 activate(b,actor);b.rng=1972;
 return {state,b,actor,target,enemies};
}
function activate(b,u){b.activeId=u.id;b.turnIndex=b.turnOrder.indexOf(u.id);}
function step(f){assert.ok(advanceBattle(f.state).ok);return f.b.lastEvent;}
function reload(f){f.state=validateSave(structuredClone(f.state));f.b=f.state.battle;f.actor=f.b.units.find(u=>u.id==='captain');f.target=f.b.units.find(u=>u.id===f.target.id);f.enemies=f.b.units.filter(u=>u.side==='enemy');}

test('Skirmish does not alternate loaded throwing weapons and a reserve shield set',()=>{
 const f=fight({weapon:'javelins',reserve:'arming-sword',reserveShield:'round-shield',role:'skirmisher',tactic:'skirmish',quick:true});
 const events=[];for(let n=0;n<3&&f.b.activeId===f.actor.id;n++){events.push(step(f));reload(f);}
 assert.ok(events.some(e=>e.type!=='swap'),events.map(e=>e.message).join('\n'));
 assert.ok(events.filter(e=>e.type==='swap').length<=1);
});

for(const role of ['flanker','breaker'])test(`${role} with a reach weapon keeps an in-range preferred target instead of alternating pursuit`,()=>{
 const f=fight({weapon:'billhook',role});Object.assign(f.actor,{meleeSkill:15});
 for(const [i,u]of f.enemies.entries()){Object.assign(u,{q:i?7:2,r:8,meleeDefense:50,bodyArmor:300,headArmor:175,attachmentArmor:0,attachment2Armor:0});u.equipment.weapon='hunting-bow';u.equipment.armor='plate-harness';u.equipment.helmet='bascinet';u.maxBodyArmor=300;u.maxHeadArmor=175;}
 if(f.enemies[2]){f.enemies[2].alive=false;f.enemies[2].hp=0;}
 const points=[];for(let i=0;i<4&&f.b.activeId===f.actor.id;i++){const e=step(f);points.push([f.actor.q,f.actor.r,e.type]);reload(f);}
 assert.ok(!points.some((p,i)=>i>=2&&p[0]===points[i-2][0]&&p[1]===points[i-2][1]&&p[2]==='move'),JSON.stringify(points));
 assert.ok(points.some(p=>p[2]==='attack'||p[2]==='miss'),JSON.stringify(points));
});

for(const tactic of ['shield-wall','advance-formation','skirmish'])test(`Lunge respects ${tactic} formation orders`,()=>{
 const f=fight({weapon:'bb-named-fencing-sword',role:'flanker',tactic});Object.assign(f.actor,{initiative:180,formationMovedRound:f.b.round});f.target.q=6;
 const before=[f.actor.q,f.actor.r];assert.notEqual(step(f).skillName,'Lunge');assert.deepEqual([f.actor.q,f.actor.r],before);
});

test('Lunge obeys a reachable focus target, including a more tempting off-focus kill',()=>{
 const f=fight({weapon:'bb-named-fencing-sword',role:'flanker',tactic:'focus'});f.target.q=6;f.enemies[1].q=4;f.enemies[1].r=6;f.enemies[1].hp=1;f.b.focusTargetId=f.target.id;
 assert.equal(step(f).skillName,'Lunge');assert.equal(f.b.lastEvent.targetId,f.target.id);
});

test('an unaffordable focused Aimed Shot does not remove a legal ranged attack',()=>{
 const f=fight({weapon:'hunting-bow',role:'ranged',tactic:'focus'});f.actor.ap=4;f.target.q=9;f.enemies[1].q=7;f.enemies[1].r=8;f.b.focusTargetId=f.target.id;
 assert.ok(['attack','miss'].includes(step(f).type),f.b.lastEvent.message);assert.equal(f.b.lastEvent.targetId,f.enemies[1].id);
});

for(const role of COMBAT_ROLES.filter(x=>x!=='auto'))test(`${role} cannot spend movement fatigue above its dazed capacity in formation`,()=>{
 const f=fight({role,tactic:'advance-formation'});f.actor.dazedTurns=2;f.actor.fatigue=Math.floor(f.actor.maxFatigue*.75);const before=[f.actor.q,f.actor.r];
 step(f);assert.deepEqual([f.actor.q,f.actor.r],before);assert.notEqual(f.b.lastEvent.type,'move');assert.ok(f.actor.fatigue<=Math.floor(f.actor.maxFatigue*.75));
});

test('dazed defensive ranged roles do not use optional cover that leaves no usable shot',()=>{
 const f=fight({weapon:'hunting-bow',role:'ranged',tactic:'defense'});f.actor.dazedTurns=2;f.actor.fatigue=Math.floor(f.actor.maxFatigue*.75)-5;f.target.q=8;f.target.equipment.weapon='hunting-bow';tileAt(f.b.field,4,9).terrain='trees';
 const before=[f.actor.q,f.actor.r];step(f);assert.notEqual(f.b.lastEvent.type,'move');assert.deepEqual([f.actor.q,f.actor.r],before);
});

test('new enemy soldiers resolve roles from the same complete loadout policy',()=>{
 const f=fight();for(const unit of f.enemies){const expected=resolveCombatRole({},getItem(unit.equipment.weapon),getItem(unit.reserveEquipment.weapon),{armor:getItem(unit.equipment.armor),mount:getItem(unit.equipment.mount)});assert.equal(unit.tacticalRole,expected);}
});


test('allied soldiers resolve full-loadout roles and preserve them through saves',()=>{
 const state=createGame(901),offer=findOffer(state,'assault');assert.ok(acceptContract(state,'oakwatch',offer.id).ok);
 const site=getContractTarget(state);state.position={x:site.x,y:site.y};assert.ok(startBattle(state,site.id).ok);
 const allies=state.battle.units.filter(u=>u.ally);assert.ok(allies.length>0);
 for(const unit of allies)assert.equal(unit.tacticalRole,resolveCombatRole({},getItem(unit.equipment.weapon),getItem(unit.reserveEquipment.weapon),{armor:getItem(unit.equipment.armor),mount:getItem(unit.equipment.mount)}));
 assert.deepEqual(validateSave(structuredClone(state)),state);
});

test('NPC skirmishers can draw their existing melee backup when adjacent',()=>{
 const f=fight(),npc=f.target;Object.assign(npc,{q:5,r:8,ap:9,fatigue:0,tacticalRole:'skirmisher',turnStartedRound:f.b.round});
 npc.equipment.weapon='javelins';npc.equipment.shield=null;npc.reserveEquipment.weapon='arming-sword';npc.reserveEquipment.shield=null;
 npc.throwingAmmo={active:3,reserve:0};activate(f.b,npc);assert.equal(step(f).type,'swap');assert.equal(npc.equipment.weapon,'arming-sword');assert.equal(npc.tacticalRole,'skirmisher');
});

test('new role marker validates and legacy active battles retain the prior Lunge policy',()=>{
 const f=fight({weapon:'bb-named-fencing-sword',role:'flanker',tactic:'shield-wall'});f.actor.formationMovedRound=f.b.round;f.target.q=6;
 const invalid=structuredClone(f.state);invalid.battle.roleConsistencyVersion=2;assert.throws(()=>validateSave(invalid));
 delete f.b.roleConsistencyVersion;reload(f);assert.equal(f.b.roleConsistencyVersion,undefined);assert.equal(step(f).skillName,'Lunge');
});


test('cover that leaves only an unaffordable Aimed Shot does not replace a safe stationary shot',()=>{
 const f=fight({weapon:'hunting-bow',role:'ranged',tactic:'defense'});f.target.q=9;f.target.equipment.weapon='hunting-bow';tileAt(f.b.field,4,9).terrain='trees';
 const before=[f.actor.q,f.actor.r];const event=step(f);assert.ok(['attack','miss'].includes(event.type),event.message);assert.equal(event.skillName,'Aimed Shot');assert.deepEqual([f.actor.q,f.actor.r],before);
});
