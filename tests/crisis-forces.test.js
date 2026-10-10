import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,getUndeadEncounters,startBattle,advanceBattle,validateSave} from '../src/engine.js';
import {advanceAshenWinter,crisisForceSize,crisisAllyRoster} from '../src/undead-crisis.js';
const context={settlements:SETTLEMENTS,report(){}};
function time(s,h){s.day=Math.floor(h/24)+1;s.hour=h%24;s.shipmentLegacyThroughDay=s.day;}
function active(seed,count=6){
 const s=createGame(seed),p=structuredClone(s.party[0]);while(s.party.length<count)s.party.push({...structuredClone(p),id:`fighter-${s.party.length}`});
 s.party.forEach(p=>p.level=7);s.formation=Array.from({length:36},(_,i)=>i<15?s.party[i]?.id??null:null);s.reserveIds=Array.from({length:3},(_,i)=>s.party[15+i]?.id??null);
 time(s,59*24);s.shipments={};advanceAshenWinter(s,context);time(s,s.ashenWinter.warningHour);advanceAshenWinter(s,context);time(s,s.ashenWinter.activationHour);advanceAshenWinter(s,context);return s;
}
function fight(s,e){s.position={x:e.x,y:e.y};assert.equal(startBattle(s,e.id).ok,true);const occupied=s.battle.units.map(u=>`${u.q},${u.r}`);assert.equal(new Set(occupied).size,occupied.length);assert.deepEqual(validateSave(s),s);}
test('crisis scaling counts living party including reserves and clamps to 25–50',()=>{
 for(const [count,expected] of [[1,25],[12,25],[13,26],[18,36],[25,50],[40,50]])assert.equal(crisisForceSize({party:Array.from({length:count},()=>({hp:1})).concat({hp:0})}),expected);
});
test('seeded siege and marshal support obey troop mixtures for 200 seeds',()=>{
 for(let seed=0;seed<200;seed++)for(const kind of ['undead-liberation','undead-commander']){
  const roster=crisisAllyRoster(seed,kind),guards=roster.filter(x=>x==='guard').length,militia=roster.length-guards;
  assert.deepEqual(crisisAllyRoster(seed,kind),roster);
  if(kind==='undead-liberation'){assert.ok(roster.length>=10&&roster.length<=14);assert.ok(guards>=3&&guards<=5);assert.ok(militia>=7);}
  else{assert.ok(roster.length>=3&&roster.length<=6);assert.ok(guards>=1);}
 }
});
test('marshal armies scale at creation, deploy with faction support and survive saves',()=>{
 for(const count of [6,18]){const s=active(719,count),e=getUndeadEncounters(s).find(e=>e.kind==='undead-commander');assert.equal(e.enemies.length,Math.max(25,count*2));fight(s,e);
 const allies=s.battle.units.filter(u=>u.ally);assert.equal(allies.length,crisisAllyRoster(e.force.seed,e.kind).length);assert.ok(allies.some(u=>!u.name.startsWith('Militia')));
 const bad=structuredClone(s);bad.battle.units.find(u=>u.ally).id='ally-99';assert.throws(()=>validateSave(bad),/battle unit owner/);
 const wrong=structuredClone(s);wrong.battle.units.find(u=>u.ally).name='Wrong faction guard';assert.throws(()=>validateSave(wrong),/crisis soldier identity/);
 }
});
test('siege grows once on arrival, retains casualties and deploys 7+ militia and 3–5 faction guards',()=>{
 const s=active(719,18),h=Object.values(s.ashenWinter.hosts)[0],townId=h.targetTownId;
 const lost=h.force.troops.pop();time(s,h.warningUntil);Object.assign(h,h.route.at(-1));h.waypoint=h.route.length;advanceAshenWinter(s,context);
 const e=getUndeadEncounters(s).find(e=>e.townId===townId&&e.kind==='undead-liberation');assert.equal(e.force.size,36);assert.equal(e.enemies.length,35);assert.ok(!e.force.troops.includes(lost));
 const frozen=structuredClone(e.force);fight(s,e);const allies=s.battle.units.filter(u=>u.ally);assert.ok(allies.filter(u=>u.name.startsWith('Militia')).length>=7);assert.ok(allies.filter(u=>!u.name.startsWith('Militia')).length>=3);assert.deepEqual(e.force,frozen);
 const legacy=structuredClone(s);delete legacy.battle.crisisAlliesVersion;legacy.battle.units=legacy.battle.units.filter(u=>!u.ally||Number(u.id.slice(5))<=3);legacy.battle.turnOrder=legacy.battle.turnOrder.filter(id=>!id.startsWith('ally-')||Number(id.slice(5))<=3);legacy.battle.activeId=legacy.battle.turnOrder[legacy.battle.turnIndex];assert.doesNotThrow(()=>validateSave(legacy));
});

test('maximum 50-undead siege and marshal formations deploy without collisions and round-trip',()=>{
 for(const kind of ['undead-commander','undead-liberation']){
  const s=active(737,18);
  if(kind==='undead-liberation'){const h=Object.values(s.ashenWinter.hosts)[0];time(s,h.warningUntil);Object.assign(h,h.route.at(-1));h.waypoint=h.route.length;advanceAshenWinter(s,context);}
  const e=getUndeadEncounters(s).find(e=>e.kind===kind);e.force.size=50;e.force.troops=Array.from({length:50},(_,i)=>i);fight(s,getUndeadEncounters(s).find(x=>x.id===e.id));assert.equal(s.battle.units.filter(u=>u.side==='enemy').length,50);for(let i=0;i<3;i++)assert.equal(advanceBattle(s).ok,true);assert.doesNotThrow(()=>validateSave(s));
 }
});

test('legacy version-three upgrade preserves injuries and missing marshal while growing uncommitted forces once',()=>{
 const s=active(719,18);for(const f of s.ashenWinter.fronts){f.force.size=30;f.force.troops=f.force.troops.filter(i=>i<30);}const front=s.ashenWinter.fronts[0];front.force.size=30;front.force.troops=Array.from({length:29},(_,i)=>i+1);front.force.damage={1:{hp:12,bodyArmor:3,headArmor:4,shieldDurability:5}};s.ashenWinter.version=3;
 assert.doesNotThrow(()=>validateSave(s));advanceAshenWinter(s,context);assert.equal(s.ashenWinter.version,4);assert.equal(front.force.size,36);assert.ok(!front.force.troops.includes(0));assert.deepEqual(front.force.damage[1],{hp:12,bodyArmor:3,headArmor:4,shieldDurability:5});const frozen=structuredClone(front.force);advanceAshenWinter(s,context);assert.deepEqual(front.force,frozen);assert.doesNotThrow(()=>validateSave(s));
});
test('legacy committed marshal battle is not resized by the crisis upgrade',()=>{
 const s=active(719,18),e=getUndeadEncounters(s).find(e=>e.kind==='undead-commander');fight(s,e);s.ashenWinter.version=3;const army=structuredClone(e.force),battle=structuredClone(s.battle);advanceAshenWinter(s,context);assert.deepEqual(e.force,army);assert.deepEqual(s.battle,battle);assert.doesNotThrow(()=>validateSave(s));
});
test('legacy scheduled campaign creates saveable newly scaled warning fronts',()=>{
 const s=active(719,6);s.battle=null;s.ashenWinter.phase='scheduled';s.ashenWinter.fronts=[];s.ashenWinter.hosts={};s.ashenWinter.towns={};s.ashenWinter.version=3;time(s,s.ashenWinter.warningHour);advanceAshenWinter(s,context);assert.equal(s.ashenWinter.phase,'warning');assert.equal(s.ashenWinter.version,4);assert.doesNotThrow(()=>validateSave(s));
});

test('large marshal battles deploy through varied seeded terrain across all three fronts',()=>{
 for(let seed=1;seed<=8;seed++){
  const original=active(seed,18);
  for(const encounter of getUndeadEncounters(original).filter(e=>e.kind==='undead-commander')){const s=structuredClone(original);fight(s,getUndeadEncounters(s).find(e=>e.id===encounter.id));}
 }
});
