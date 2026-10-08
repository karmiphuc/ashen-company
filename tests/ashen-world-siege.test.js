import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,validateSave,getUndeadEncounters,getSettlementAccess} from '../src/engine.js';
import {advanceAshenWinter,resolveAshenObjective,allSettlementsCaptured} from '../src/undead-crisis.js';
import {campaignHour} from '../src/crisis-director.js';
import {worldBlocked,worldRoute} from '../src/world-navigation.js';
import {crisisJournalHTML} from '../src/crisis-ui.js';
const context={settlements:SETTLEMENTS,report(){}};
function time(s,h){s.day=Math.floor(h/24)+1;s.hour=h%24;s.shipmentLegacyThroughDay=s.day;}
function active(seed=719){
 const s=createGame(seed),p=structuredClone(s.party[0]);
 while(s.party.length<6)s.party.push({...structuredClone(p),id:`fighter-${s.party.length}`});
 s.party.forEach(p=>p.level=7);s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);
 time(s,59*24);s.shipments={};advanceAshenWinter(s,context);
 time(s,s.ashenWinter.warningHour);advanceAshenWinter(s,context);
 time(s,s.ashenWinter.activationHour);advanceAshenWinter(s,context);return s;
}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function besiege(s,h){time(s,h.warningUntil);Object.assign(h,h.route.at(-1));h.waypoint=h.route.length;advanceAshenWinter(s,context);return s.ashenWinter.towns[h.targetTownId];}

test('exactly three passable wilderness strongholds, each reachable from every settlement',()=>{
 for(let seed=1;seed<=24;seed++){
  const s=active(seed);assert.equal(s.ashenWinter.fronts.length,3);
  for(const f of s.ashenWinter.fronts){
   assert.ok(!worldBlocked(f.site));assert.ok(SETTLEMENTS.every(t=>dist(f.site,t)>=150));
   assert.ok(SETTLEMENTS.every(t=>worldRoute(f.site,t)));
  }
 }
});

test('all settlements including distant southern towns can be individually targeted, nearest eligible first',()=>{
 for(const town of SETTLEMENTS){
  const s=active();
  // Temporarily protect every other settlement, as after successful defenses/liberations.
  for(const h of Object.values(s.ashenWinter.hosts))resolveAshenObjective(s,{id:h.id,kind:'undead-host'},context);
  const template=structuredClone(Object.values(s.ashenWinter.towns)[0]);
  for(const t of SETTLEMENTS)s.ashenWinter.towns[t.id]={...template,status:'open',hostId:null,protectionUntil:campaignHour(s)+1000};
  delete s.ashenWinter.towns[town.id];const f=s.ashenWinter.fronts[0];time(s,f.nextSpawnHour);advanceAshenWinter(s,context);
  const h=Object.values(s.ashenWinter.hosts).find(h=>h.targetTownId===town.id);
  assert.ok(h,`${town.name} must be attackable`);assert.deepEqual(h.route.at(-1),{x:town.x,y:town.y});
  assert.deepEqual(validateSave(s),s);
 }
 const s=active();const reserved=new Set();
 for(const h of Object.values(s.ashenWinter.hosts)){
  const candidates=SETTLEMENTS.filter(t=>!reserved.has(t.id)).sort((a,b)=>dist(a,h.route[0])-dist(b,h.route[0])||a.id.localeCompare(b.id));
  assert.equal(h.targetTownId,candidates[0].id);reserved.add(h.targetTownId);
 }
});

test('waves are deterministic across reloads, varied in size and interval, and not capped at twelve bands',()=>{
 const s=active(),reload=validateSave(JSON.parse(JSON.stringify(s))),counts=new Set(),days=new Set();
 for(let i=0;i<10;i++){
  const until=Math.min(...s.ashenWinter.fronts.map(f=>f.nextSpawnHour));
  const prior=s.ashenWinter.fronts.map(f=>f.spawnIndex);
  time(s,until);time(reload,until);advanceAshenWinter(s,context);advanceAshenWinter(reload,context);
  assert.deepEqual(reload,s);
  s.ashenWinter.fronts.forEach((f,j)=>{const n=f.spawnIndex-prior[j];if(n){counts.add(n);days.add((f.nextSpawnHour-until)/24);assert.ok(n>=2&&n<=4);assert.ok(f.nextSpawnHour-until>=72&&f.nextSpawnHour-until<=168);}});
 }
 assert.ok(counts.size>1&&days.size>1);assert.ok(Object.keys(s.ashenWinter.hosts).length>12);assert.deepEqual(validateSave(s),s);
});

test('settlement defenders sometimes repel sieges and sometimes fall, without paying player rewards',()=>{
 let wins=0,losses=0;
 for(let seed=1;seed<=20;seed++){
  const s=active(seed),h=Object.values(s.ashenWinter.hosts)[0],t=besiege(s,h),gold=s.gold,renown=s.renown;
  time(s,t.siegeUntil);advanceAshenWinter(s,context);
  if(t.status==='recovering'){wins++;assert.ok(getSettlementAccess(s,h.targetTownId).servicesAvailable);assert.equal(t.force,null);assert.equal(t.protectionUntil,campaignHour(s)+72);}
  else{losses++;assert.equal(t.status,'occupied');assert.ok(!getSettlementAccess(s,h.targetTownId).servicesAvailable);}
  assert.equal(s.gold,gold);assert.equal(s.renown,renown);assert.equal(s.ashenWinter.liberationCount,0);assert.equal(s.ashenWinter.resolved.length,0);
  assert.deepEqual(validateSave(s),s);
 }
 assert.ok(wins>0&&losses>0);
});

test('when every settlement is occupied unassigned bands chase the company, then retarget a liberated town',()=>{
 const s=active();
 // Repeated waves give each town a real unique force; teleport hosts to complete the siege fixture.
 for(let i=0;i<30&&!allSettlementsCaptured(s,SETTLEMENTS);i++){
  for(const h of Object.values(s.ashenWinter.hosts))if(h.targetTownId){const t=besiege(s,h);t.status='occupied';t.force=t.occupationForce;}
  if(!allSettlementsCaptured(s,SETTLEMENTS)){time(s,Math.min(...s.ashenWinter.fronts.map(f=>f.nextSpawnHour)));advanceAshenWinter(s,context);}
 }
 assert.ok(allSettlementsCaptured(s,SETTLEMENTS));
 time(s,Math.min(...s.ashenWinter.fronts.map(f=>f.nextSpawnHour)));advanceAshenWinter(s,context);
 const h=Object.values(s.ashenWinter.hosts)[0];assert.ok(h&&!h.targetTownId);
 s.position={x:SETTLEMENTS[0].x,y:SETTLEMENTS[0].y};const before=dist(h,s.position);
 time(s,campaignHour(s)+.25);advanceAshenWinter(s,context);assert.ok(dist(h,s.position)<before);
 assert.equal(getUndeadEncounters(s).find(e=>e.id===h.id).behavior,'hunting-company');
 assert.match(crisisJournalHTML(s),/hunting your company/);assert.deepEqual(validateSave(s),s);
 const town=SETTLEMENTS[0],t=s.ashenWinter.towns[town.id];t.status='open';t.force=null;t.occupationForce=null;t.hostId=null;t.protectionUntil=0;
 time(s,campaignHour(s)+.25);advanceAshenWinter(s,context);assert.equal(h.targetTownId,town.id);assert.ok(!allSettlementsCaptured(s,SETTLEMENTS));assert.deepEqual(validateSave(s),s);
});

test('destroying a stronghold stops its future waves while the remaining camps keep spawning',()=>{
 const s=active(),f=s.ashenWinter.fronts[0];resolveAshenObjective(s,{id:f.force.id,frontId:f.id,kind:'undead-commander'},context);
 const prior=s.ashenWinter.fronts.map(f=>f.spawnIndex);time(s,Math.max(...s.ashenWinter.fronts.map(f=>f.nextSpawnHour))+24);advanceAshenWinter(s,context);
 assert.equal(f.spawnIndex,prior[0]);assert.ok(s.ashenWinter.fronts.slice(1).every((f,i)=>f.spawnIndex>prior[i+1]));assert.deepEqual(validateSave(s),s);
});
