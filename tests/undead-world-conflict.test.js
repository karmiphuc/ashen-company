import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,getItem,getRoamingBands,getFactionPatrols,getUndeadEncounters,activateMapTarget,joinPatrolBattle,startBattle,tick,validateSave,retreatBattle,finishBattle,resolveBattle} from '../src/engine.js';
import {advanceAshenWinter} from '../src/undead-crisis.js';
import {advanceFactionSimulation,worldSkirmishFor,undeadCombatTarget} from '../src/faction-patrols.js';
import {campSidebarHTML} from '../src/campaign-ui.js';
const now=s=>(s.day-1)*24+s.hour;
function setTime(s,h){s.day=Math.floor(h/24)+1;s.hour=h%24;}
function active(){
 const s=createGame(719),original=structuredClone(s.party[0]);while(s.party.length<6)s.party.push({...structuredClone(original),id:`fighter-${s.party.length}`,name:`Fighter ${s.party.length}`});
 s.party.forEach(p=>p.level=7);s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);s.day=60;s.shipments={};s.shipmentLegacyThroughDay=60;
 const c={settlements:SETTLEMENTS,report(){}};advanceAshenWinter(s,c);setTime(s,s.ashenWinter.warningHour);advanceAshenWinter(s,c);setTime(s,s.ashenWinter.activationHour);advanceAshenWinter(s,c);s.shipmentLegacyThroughDay=s.day;
 for(const p of Object.values(s.factionPatrols))p.cooldownUntil=now(s)+6;
 const host=getUndeadEncounters(s).find(e=>e.kind==='undead-host');return {s,host};
}
function engage(index=5,initiator='undead'){
 const {s,host}=active(),army=getFactionPatrols(s)[index];Object.assign(s.factionPatrols[army.id],{x:host.x,y:host.y,cooldownUntil:initiator==='undead'?now(s)+6:0});
 s.hour+=.25;const context={settlements:SETTLEMENTS,getItem,hostiles:()=>getUndeadEncounters(s).filter(e=>e.id===host.id),currentHostile:id=>getUndeadEncounters(s).find(e=>e.id===id),hostileResult(){}};
 advanceFactionSimulation(s,context);assert.ok(worldSkirmishFor(s,host.id));assert.deepEqual(validateSave(s),s);return {s,host,army,context};
}
for(const index of [0,3,5,8])for(const initiator of ['undead','guards'])for(const entry of ['enemy','guards','direct'])test(`${initiator}-initiated undead fight joins faction ${index} through ${entry}`,()=>{
 const {s,host,army}=engage(index,initiator),fight=worldSkirmishFor(s,host.id);assert.equal(fight.aId,initiator==='undead'?host.id:army.id);
 const patrol=getFactionPatrols(s).find(p=>p.id===army.id);assert.ok(patrol.joinableBattle);assert.match(patrol.description,/Ashen Legion Host/);assert.match(campSidebarHTML(s,patrol),/data-join-patrol/);
 const troops=[...s.factionPatrols[army.id].troops],roster=patrol.enemies;s.position={x:host.x,y:host.y};
 const result=entry==='enemy'?activateMapTarget(s,'undead-host',host.id):entry==='guards'?joinPatrolBattle(s,army.id):startBattle(s,host.id);
 assert.ok(result.ok,result.message);assert.equal(s.battle.patrolAssist.id,army.id);assert.deepEqual(s.battle.patrolAssist.troops,troops);
 const allies=s.battle.units.filter(u=>u.ally);assert.equal(allies.length,troops.length);assert.deepEqual(allies.map(u=>u.equipment.weapon),roster.map(e=>e.weapon));assert.ok(allies.every(u=>!u.undeadTraitsVersion&&s.battle.turnOrder.includes(u.id)));
 assert.ok(s.battle.units.filter(u=>u.side==='enemy').every(u=>u.undeadTraitsVersion===1));assert.equal(s.worldSkirmishes.length,0);assert.deepEqual(validateSave(s),s);
});

test('undead initiates a timed battle with bandits; both sides hold position across crisis updates',()=>{
 const {s,host}=active(),band=getRoamingBands(s).find(b=>b.difficulty>0);Object.assign(s.bands[band.id],{x:host.x,y:host.y});
 s.hour+=.25;const context={settlements:SETTLEMENTS,getItem,hostiles:()=>[getUndeadEncounters(s).find(e=>e.id===host.id),getRoamingBands(s).find(b=>b.id===band.id)],currentHostile:id=>[...getUndeadEncounters(s),...getRoamingBands(s)].find(e=>e.id===id),hostileResult(){}};
 advanceFactionSimulation(s,context);const fight=worldSkirmishFor(s,host.id);assert.equal(fight.aKind,'undead-host');assert.equal(fight.bId,band.id);assert.ok(fight.endHour-fight.startHour>=3);
 assert.deepEqual(validateSave(s),s);const before=structuredClone(s.ashenWinter.hosts[host.id]);setTime(s,fight.endHour-.25);advanceAshenWinter(s,{settlements:SETTLEMENTS,report(){}});assert.deepEqual(s.ashenWinter.hosts[host.id],before);
 assert.equal(getUndeadEncounters(s).find(e=>e.id===host.id).behavior,'fighting');assert.equal(getRoamingBands(s).find(e=>e.id===band.id).behavior,'fighting');
});

test('joining an undead-initiated guard fight after traveling preserves both saved rosters',()=>{
 let {s,host,army}=engage();for(const b of getRoamingBands(s))s.bands[b.id].defeatedUntil=now(s)+48;
 s.position={x:host.x-75,y:host.y+10};assert.ok(activateMapTarget(s,'undead-host',host.id).ok);s=validateSave(JSON.parse(JSON.stringify(s)));
 for(let i=0;i<40&&!s.battle&&s.destination;i++){tick(s,.25);s=validateSave(JSON.parse(JSON.stringify(s)));}
 assert.equal(s.battle?.patrolAssist.id,army.id);assert.equal(s.battle.units.filter(u=>u.ally).length,8);
});

test('undead-initiated battle casualties settle to the correct patrol and host without granting crisis progress',()=>{
 const {s,host,army}=engage();const f=worldSkirmishFor(s,host.id);f.result={aWins:false,aSurvivors:[],bSurvivors:[0,2,5]};setTime(s,f.endHour);
 // Use the engine simulation callback to apply real host/patrol consequences.
 tick(s,.25);assert.equal(s.ashenWinter.hosts[host.id],undefined);assert.deepEqual(s.factionPatrols[army.id].troops,[0,2,5]);assert.equal(s.factionPatrols[army.id].wins,1);
 assert.equal(s.ashenWinter.hostVictories,0);assert.ok(s.factionReports.some(r=>r.patrolId===army.id&&r.opponentId===host.id&&r.outcome==='victory'));assert.deepEqual(validateSave(s),s);
});

test('reserved and already fighting parties are excluded from undead hunting',()=>{
 const {s,host}=active(),band={...getRoamingBands(s)[0],x:host.x,y:host.y};assert.equal(undeadCombatTarget(s,host,[band]).id,band.id);
 s.pursuit=band.id;assert.equal(undeadCombatTarget(s,host,[band]),null);s.pursuit=null;s.worldSkirmishes=[{aId:host.id,bId:band.id}];assert.equal(undeadCombatTarget(s,host,[band]),null);
});

function bandFight(){
 const {s,host}=active(),band=getRoamingBands(s).find(b=>b.difficulty>0);Object.assign(s.bands[band.id],{x:host.x,y:host.y});
 s.hour+=.25;advanceFactionSimulation(s,{settlements:SETTLEMENTS,getItem,hostiles:()=>[getUndeadEncounters(s).find(e=>e.id===host.id),getRoamingBands(s).find(b=>b.id===band.id)],currentHostile:id=>[...getUndeadEncounters(s),...getRoamingBands(s)].find(e=>e.id===id),hostileResult(){}});
 return {s,host,band,fight:worldSkirmishFor(s,host.id)};
}
for(const winner of ['undead','bandits'])test(`${winner} NPC victory settles both hostile rosters without player rewards`,()=>{
 const {s,host,band,fight}=bandFight(),gold=s.gold;
 // Isolate settlement of this fight from guards and the other bands in its wave.
 for(const h of Object.values(s.ashenWinter.hosts))if(h.id!==host.id){if(h.targetTownId){const t=s.ashenWinter.towns[h.targetTownId];t.status='open';t.hostId=null;}delete s.ashenWinter.hosts[h.id];}
 for(const front of s.ashenWinter.fronts)front.nextSpawnHour=fight.endHour+72;
 for(const p of Object.values(s.factionPatrols)){p.troops=[];p.defeatedUntil=now(s)+72;}
 fight.result=winner==='undead'?{aWins:true,aSurvivors:[0,2],bSurvivors:[]}:{aWins:false,aSurvivors:[],bSurvivors:[0]};
 setTime(s,fight.endHour);tick(s,.25);
 if(winner==='undead'){assert.deepEqual(s.ashenWinter.hosts[host.id].force.troops,fight.aTroops.filter((_,i)=>[0,2].includes(i)));assert.ok(s.bands[band.id].defeatedUntil>now(s));assert.equal(s.bands[band.id].spawnCycle,band.spawnCycle+1);}
 else {assert.equal(s.ashenWinter.hosts[host.id],undefined);assert.deepEqual(s.worldLosses[band.id].survivors,[fight.bTroops[0]]);}
 assert.equal(s.gold,gold);assert.equal(s.ashenWinter.hostVictories,0);assert.equal(s.ashenWinter.liberationCount,0);assert.equal(worldSkirmishFor(s,band.id),null);assert.deepEqual(validateSave(s),s);
});

test('undead hunting closes distance without taking a competing road step',()=>{
 const {s,host}=active(),band={...getRoamingBands(s)[0],x:host.x+60,y:host.y};const h=s.ashenWinter.hosts[host.id],before=Math.hypot(h.x-band.x,h.y-band.y);
 s.hour+=.25;advanceAshenWinter(s,{settlements:SETTLEMENTS,report(){},combatTargets:()=>[band]});
 assert.ok(Math.hypot(h.x-band.x,h.y-band.y)<before);assert.equal(h.waypoint,1);
});

test('new undead-origin snapshots reject forged participant kinds, generations and troop identity',()=>{
 const {s}=bandFight();assert.deepEqual(validateSave(s),s);
 for(const change of [f=>f.aKind='band',f=>f.bKind='undead-host',f=>f.aCycle++,f=>f.aTroops=[99],f=>f.aTroops.pop(),f=>f.endHour++,f=>f.result.aSurvivors=[99]]){
  const bad=structuredClone(s);change(bad.worldSkirmishes[0]);const before=structuredClone(bad);assert.throws(()=>validateSave(bad),/world skirmish/);assert.deepEqual(bad,before);
 }
});

test('a joined undead-initiated battle can retreat and settle without changing troop ownership',()=>{
 const {s,host,army}=engage(5);s.position={x:host.x,y:host.y};assert.ok(activateMapTarget(s,'undead-host',host.id).ok);
 const troops=[...s.factionPatrols[army.id].troops];assert.ok(retreatBattle(s).ok);assert.ok(finishBattle(s).ok);
 assert.deepEqual(s.factionPatrols[army.id].troops,troops);assert.equal(s.ashenWinter.hostVictories,0);assert.deepEqual(validateSave(s),s);
});


test('approaching the undead side of a fight joins immediately without chasing its guards',()=>{
 const {s,host,army}=engage(5);s.position={x:host.x-30,y:host.y};
 assert.ok(Math.hypot(s.position.x-s.factionPatrols[army.id].x,s.position.y-s.factionPatrols[army.id].y)>35);
 assert.ok(activateMapTarget(s,'undead-host',host.id).ok);assert.equal(s.battle?.patrolAssist.id,army.id);assert.equal(s.destination,null);assert.deepEqual(validateSave(s),s);
});


test('an NPC winner with no new bandit casualties remains saveable',()=>{
 const {s,host,band,fight}=bandFight();for(const p of Object.values(s.factionPatrols)){p.troops=[];p.defeatedUntil=now(s)+72;}
 fight.result={aWins:false,aSurvivors:[],bSurvivors:fight.bTroops.map((_,i)=>i)};setTime(s,fight.endHour);tick(s,.25);
 assert.equal(s.ashenWinter.hosts[host.id],undefined);assert.equal(s.worldLosses[band.id],undefined);assert.deepEqual(validateSave(s),s);
});
