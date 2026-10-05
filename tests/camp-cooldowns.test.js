import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,validateSave,getCampSites} from '../src/engine.js';

const elapsed=s=>(s.day-1)*24+s.hour;
const setTime=(s,h)=>{s.day=Math.floor(h/24)+1;s.hour=h%24;};

test('pending old fixed and wilderness cooldowns extend from the original fractional clearance time once',()=>{
 const s=createGame(831),clearedAt=elapsed(s)+.375;setTime(s,clearedAt+1);
 s.camps={'quarry-camp':{clearedDay:s.day,respawnAt:clearedAt+120,generation:2},'wild-camp-1':{clearedDay:s.day,respawnAt:clearedAt+72,generation:4}};
 const input=structuredClone(s),restored=validateSave(s);assert.deepEqual(s,input);
 for(const id of Object.keys(s.camps)){
  const record=restored.camps[id],days=(record.respawnAt-clearedAt)/24;
  assert.ok(Number.isInteger(days)&&days>=14&&days<=42);assert.equal(record.generation,s.camps[id].generation);
  assert.equal(record.clearedDay,s.camps[id].clearedDay);assert.ok(getCampSites(restored).find(c=>c.id===id).cleared);
 }
 assert.deepEqual(validateSave(restored),restored);
 setTime(restored,elapsed(restored)+24);assert.deepEqual(validateSave(restored),restored,'remaining cooldown is not reset on reload');
});
test('random cooldowns cover all 14–42 day durations across camps and clearance generations',()=>{
 const durations=new Set(),perCamp=new Map();
 for(let generation=0;generation<20;generation++){
  const s=createGame(832);s.camps=Object.fromEntries(getCampSites(s).map(c=>[c.id,{clearedDay:1,respawnAt:8+(c.random?72:120),generation}]));
  const restored=validateSave(s);
  for(const [id,record] of Object.entries(restored.camps)){
   const days=(record.respawnAt-8)/24;assert.ok(Number.isInteger(days)&&days>=14&&days<=42);durations.add(days);
   if(!perCamp.has(id))perCamp.set(id,new Set());perCamp.get(id).add(days);
  }
 }
 assert.equal(durations.size,29);assert.ok([...perCamp.values()].every(days=>days.size>1));
});
test('already expired old timers keep camps active and preserve hunt generation',()=>{
 const s=createGame(833);setTime(s,150);
 s.camps={'quarry-camp':{clearedDay:1,respawnAt:128,generation:3},'wild-camp-1':{clearedDay:1,respawnAt:80,generation:2}};
 const restored=validateSave(s);assert.deepEqual(restored,s);
 for(const [id,entry] of Object.entries(s.camps)){
  const site=getCampSites(restored).find(c=>c.id===id);assert.equal(site.cleared,false);assert.equal(site.generation,entry.generation+1);
 }
});
test('long pending deadlines survive reloads and the 42-day upper limit stays enforced',()=>{
 const s=createGame(834),clearance=elapsed(s);
 s.camps={'quarry-camp':{clearedDay:s.day,respawnAt:clearance+42*24,generation:1}};
 assert.deepEqual(validateSave(s),s);
 s.camps['quarry-camp'].respawnAt+=1;assert.throws(()=>validateSave(s),/camp respawn/);
 s.camps['quarry-camp'].respawnAt=(s.day-1)*24-1;assert.throws(()=>validateSave(s),/camp respawn/);
});
