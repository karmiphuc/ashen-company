import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,getItem,getRoamingBands,getFactionPatrols,tick,validateSave,startBattle} from '../src/engine.js';
import {advanceFactionSimulation,skirmishDuration,worldSkirmishFor} from '../src/faction-patrols.js';
function setTime(s,h){s.day=Math.floor(h/24)+1;s.hour=h%24;}
function fixture(){
 const s=createGame(99),army=getFactionPatrols(s)[0];
 for(const p of Object.values(s.factionPatrols))p.cooldownUntil=14;
 s.factionPatrols[army.id].cooldownUntil=0;
 const band={...getRoamingBands(s).find(b=>b.difficulty>0),x:army.x,y:army.y};Object.assign(s.bands[band.id],{x:band.x,y:band.y});
 const results=[],context={settlements:SETTLEMENTS,getItem,hostiles:()=>[band],currentHostile:id=>id===band.id?band:null,hostileResult:(...args)=>results.push(args)};
 s.hour=8.25;advanceFactionSimulation(s,context);return {s,army,band,context,results};
}

test('world combat duration grows from hours into days with troop count',()=>{
 assert.equal(skirmishDuration(1,1),3);assert.ok(skirmishDuration(8,3)>=8);assert.ok(skirmishDuration(9,20)>=48);assert.equal(skirmishDuration(100,100),72);
 assert.ok(skirmishDuration(8,8)>skirmishDuration(8,2));
});

test('committed patrols remain in place and retain all troops until their saved deadline',()=>{
 let {s,army,band,context,results}=fixture();const f=worldSkirmishFor(s,army.id);assert.ok(f);assert.equal(f.bId,band.id);assert.equal(results.length,0);assert.equal(s.factionReports.length,0);
 const p=s.factionPatrols[army.id],before=structuredClone(p);const snapshot=structuredClone(s);s=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(s,snapshot);
 setTime(s,f.endHour-.25);advanceFactionSimulation(s,context);assert.deepEqual(s.factionPatrols[army.id],before);assert.equal(results.length,0);assert.equal(s.factionReports.length,0);
 setTime(s,f.endHour);advanceFactionSimulation(s,context);assert.equal(results.length,1);assert.ok(s.factionReports.some(r=>r.patrolId===army.id));assert.equal(worldSkirmishFor(s,army.id),null);
 advanceFactionSimulation(s,context);assert.equal(results.length,1,'completion cannot be applied twice');assert.ok(s.factionPatrols[army.id].troops.length<before.troops.length);
});

test('world engagement snapshots reject malformed timers, participants, generations and survivor indices',()=>{
 const {s}=fixture();for(const edit of [s=>s.worldSkirmishes[0].endHour++,s=>s.worldSkirmishes[0].startHour=100,s=>s.worldSkirmishes[0].aCycle++,s=>s.worldSkirmishes[0].bCycle++,s=>s.worldSkirmishes[0].result.aSurvivors=[99],s=>s.worldSkirmishes.push(structuredClone(s.worldSkirmishes[0])),s=>s.worldSkirmishes[0].aTroops.push(0)]){
  const bad=structuredClone(s);edit(bad);const copy=structuredClone(bad);assert.throws(()=>validateSave(bad),/world skirmish/);assert.deepEqual(bad,copy);
 }
 const old=createGame(1);delete old.worldSkirmishes;assert.deepEqual(validateSave(old).worldSkirmishes,[]);
});

test('large and split ticks with save imports preserve timed fights and outcomes exactly',()=>{
 const whole=createGame(1);let split=structuredClone(whole);tick(whole,18);
 for(let i=0;i<72;i++){tick(split,.25);split=validateSave(JSON.parse(JSON.stringify(split)));}
 assert.deepEqual(split,whole);assert.ok(whole.factionReports.length>0);assert.ok(whole.worldSkirmishes.length>0);
});

test('starting a company battle releases an ongoing NPC fight without prematurely assigning casualties',()=>{
 const {s,army,band}=fixture();s.position={x:band.x,y:band.y};const troops=[...s.factionPatrols[army.id].troops];
 assert.equal(startBattle(s,band.id).ok,true);assert.equal(worldSkirmishFor(s,band.id),null);assert.deepEqual(s.factionPatrols[army.id].troops,troops);assert.equal(s.factionReports.length,0);assert.deepEqual(validateSave(s),s);
});
