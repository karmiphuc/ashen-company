import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,validateSave,getUndeadEncounters} from '../src/engine.js';
import {campaignHour,ASHEN_CONFIG as C} from '../src/crisis-director.js';
import {advanceAshenWinter,npcAshenVictory,resolveAshenObjective} from '../src/undead-crisis.js';
const context={settlements:SETTLEMENTS,report(){}};
function setTime(s,h){s.day=Math.floor(h/24)+1;s.hour=h%24;s.shipmentLegacyThroughDay=s.day;}
function active(){
 const s=createGame(719),p=structuredClone(s.party[0]);while(s.party.length<6)s.party.push({...structuredClone(p),id:`fighter-${s.party.length}`});
 s.party.forEach(p=>p.level=7);s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);s.day=60;s.hour=.123456789;s.shipments={};s.shipmentLegacyThroughDay=60;
 advanceAshenWinter(s,context);assert.deepEqual(validateSave(s),s);
 setTime(s,s.ashenWinter.warningHour);advanceAshenWinter(s,context);assert.deepEqual(validateSave(s),s);
 setTime(s,s.ashenWinter.activationHour);advanceAshenWinter(s,context);return s;
}
function roundTrip(s){const input=JSON.parse(JSON.stringify(s)),before=structuredClone(input);assert.deepEqual(validateSave(input),before);assert.deepEqual(input,before);}

test('fractional travel time preserves warning, activation, reinforcement and approach timestamps on reload',()=>{
 const s=active();assert.ok(!Number.isInteger(s.ashenWinter.activationHour*4));
 for(const h of Object.values(s.ashenWinter.hosts))assert.ok(!Number.isInteger(h.warningUntil*4));
 roundTrip(s);setTime(s,campaignHour(s)+24+.037);advanceAshenWinter(s,context);roundTrip(s);
});

test('NPC host victory at the reported day-130 fractional time remains saveable without rounding protection',()=>{
 const s=active(),h=Object.values(s.ashenWinter.hosts)[0];s.day=130;s.hour=2.8588951999977;s.shipmentLegacyThroughDay=s.day;
 npcAshenVictory(s,h.id);assert.equal(s.ashenWinter.towns[h.targetTownId].protectionUntil,3170.8588951999977);roundTrip(s);
});

test('player host victory, siege, occupation and liberation keep their fractional deadlines',()=>{
 const s=active(),host=getUndeadEncounters(s).find(e=>e.kind==='undead-host');
 setTime(s,campaignHour(s)+.03125);resolveAshenObjective(s,host,context);roundTrip(s);
 const h=Object.values(s.ashenWinter.hosts)[0];setTime(s,h.warningUntil+.047);Object.assign(h,h.route.at(-1));h.waypoint=h.route.length;
 advanceAshenWinter(s,context);const t=s.ashenWinter.towns[h.targetTownId];assert.equal(t.status,'besieged');assert.equal(t.siegeUntil,campaignHour(s)+C.siegeHours);roundTrip(s);
 setTime(s,t.siegeUntil+.003);advanceAshenWinter(s,context);assert.equal(t.status,'occupied');roundTrip(s);
 const e=getUndeadEncounters(s).find(e=>e.townId===h.targetTownId&&e.kind==='undead-liberation');resolveAshenObjective(s,e,context);
 assert.equal(t.protectionUntil,campaignHour(s)+C.protectionHours);assert.equal(t.recoveryUntil,campaignHour(s)+C.recoveryHours);roundTrip(s);
});

test('legacy crisis upgrade and final rewards preserve fractional campaign time',()=>{
 const s=active();for(const h of Object.values(s.ashenWinter.hosts))if(!h.id.endsWith(':1')){delete s.ashenWinter.towns[h.targetTownId];delete s.ashenWinter.hosts[h.id];}s.ashenWinter.fronts.forEach(f=>f.spawnIndex=1);s.ashenWinter.fronts.forEach(f=>{f.force.size=30;f.force.troops=Array.from({length:30},(_,i)=>i);});s.ashenWinter.version=1;roundTrip(s);setTime(s,campaignHour(s)+.017);advanceAshenWinter(s,context);assert.equal(s.ashenWinter.version,4);roundTrip(s);
 for(const e of getUndeadEncounters(s).filter(e=>e.kind==='undead-commander'))resolveAshenObjective(s,e,context);
 assert.equal(s.ashenWinter.phase,'completed');assert.equal(s.ashenWinter.completedHour,campaignHour(s));assert.equal(s.ashenWinter.aftermath.completedHour,campaignHour(s));roundTrip(s);
});

test('fractional timestamps still reject nonfinite, negative, oversized and nonnumeric deadlines',()=>{
 const s=active(),townId=Object.keys(s.ashenWinter.towns)[0];
 for(const value of [NaN,Infinity,-.01,24000025,'3170.8588951999977']){
  const bad=structuredClone(s);bad.ashenWinter.towns[townId].protectionUntil=value;const before=structuredClone(bad);
  assert.throws(()=>validateSave(bad),/Ashen Winter town deadlines/);assert.deepEqual(bad,before);
 }
});
