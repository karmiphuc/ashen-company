import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,SETTLEMENTS,WORLD_BOUNDS,getFactionPatrols,getCampSites,getRoamingBands,tick,validateSave,getItem,startBattle,advanceBattle,finishBattle} from '../src/engine.js';
import {LEGACY_WORLD_LIMITS,compactPoint,regionAt} from '../src/geography.js';
import {SOLDIER_FACTIONS,patrolDefinitions,advanceFactionSimulation,simulateSkirmish} from '../src/faction-patrols.js';
import {cityMountOffer,campMountReward,regionalMountPool} from '../src/mount-distribution.js';
const area=b=>(b.maxX-b.minX)*(b.maxY-b.minY);
const emptyContext={settlements:SETTLEMENTS,getItem,hostiles:()=>[],camps:()=>[],currentHostile:()=>null,hostileResult:()=>assert.fail('no hostile targets')};
test('world area shrinks exactly 33%, retaining original towns, all nine regions and real v0.43 saves',()=>{
 assert.ok(Math.abs(area(WORLD_BOUNDS)/area(LEGACY_WORLD_LIMITS)-.67)<1e-12);
 assert.equal(new Set(SETTLEMENTS.map(t=>regionAt(t.x,t.y).id)).size,9);
 const fixtures=JSON.parse(readFileSync(new URL('./fixtures/compact-world-v043.json',import.meta.url)));
 for(const old of [fixtures.travel,fixtures.battle]){
   const original=structuredClone(old),restored=validateSave(old);
   assert.deepEqual(old,original);assert.deepEqual(restored.position,compactPoint(old.position));
   if(old.destination)assert.deepEqual(restored.destination,compactPoint(old.destination));
   for(const [id,band]of Object.entries(old.bands))assert.deepEqual({x:restored.bands[id].x,y:restored.bands[id].y},compactPoint(band));
   if(old.battle)assert.deepEqual(restored.battle,old.battle);
   assert.deepEqual(validateSave(restored),restored);
 }
});
test('city-based factions have two or three patrols each and tours cross distant faction borders',()=>{
 const state=createGame(33),before=structuredClone(state),patrols=getFactionPatrols(state);
 assert.equal(patrols.length,11);assert.deepEqual(state,before);
 for(const faction of SOLDIER_FACTIONS){const group=patrols.filter(p=>p.factionId===faction.id);assert.ok(group.length>=2&&group.length<=3);for(const p of group){assert.equal(SETTLEMENTS.find(t=>t.id===p.homeId).kind,'town');assert.ok(p.waypoints.some(t=>Math.hypot(t.x-p.home.x,t.y-p.home.y)>1000));assert.ok(p.enemies.every(e=>getItem(e.weapon)&&getItem(e.armor)));}}
 assert.equal(patrols.filter(p=>p.playerRelation==='ally').length,3);assert.equal(patrols.filter(p=>p.playerRelation==='neutral').length,8);
});
test('world simulation is chunk invariant, causes persistent casualties and camp clears, and grants no company rewards',()=>{
 const state=createGame(1),split=structuredClone(state),wealth={gold:state.gold,inventory:state.inventory,renown:state.renown};
 tick(state,12);for(let i=0;i<48;i++)tick(split,.25);
 assert.deepEqual(state,split);assert.ok(state.factionReports.length>0);assert.ok(state.factionReports.some(r=>r.losses>0));assert.ok(Object.values(state.camps).some(c=>c.clearedDay));
 assert.deepEqual({gold:state.gold,inventory:state.inventory,renown:state.renown},wealth);
 assert.ok(getFactionPatrols(state).some(p=>p.enemies.length<p.size));assert.deepEqual(validateSave(state),state);
});
test('rival soldier battles can defeat either army, retain losses and reform after three days',()=>{
 const state=createGame(88),[a]=getFactionPatrols(state),b=getFactionPatrols(state).find(p=>p.factionId==='eastern-march');
 Object.assign(state.factionPatrols[b.id],{x:a.x,y:a.y});state.hour+=.25;advanceFactionSimulation(state,emptyContext);
 assert.ok(state.factionReports.some(r=>r.kind==='patrol'&&r.outcome==='defeat'));
 assert.ok(state.factionReports.some(r=>r.kind==='patrol'&&r.outcome==='victory'));
 assert.ok(state.factionPatrols[a.id].troops.length<a.size);assert.ok(state.factionPatrols[b.id].troops.length<b.size);
 assert.deepEqual(validateSave(state),state);
 const p=state.factionPatrols[a.id],cycle=p.spawnCycle;p.troops=[];p.defeatedUntil=8.5;state.hour=8.5;advanceFactionSimulation(state,{...emptyContext,hostiles:()=>[]});
 assert.equal(state.factionPatrols[a.id].spawnCycle,cycle+1);
 const weak=[{weapon:'wood-axe',armor:'patched-coat'}],strong=Array.from({length:8},()=>({weapon:'arming-sword',armor:'bb-coat-of-plates'}));
 assert.equal(simulateSkirmish(weak,strong,getItem,'loss').aWins,false);assert.equal(simulateSkirmish(strong,weak,getItem,'win').aWins,true);
});
test('city stable offers cover every mount, keep beasts regional and never stock villages',()=>{
 const seen=new Set();let offers=0,rare=0;
 for(let seed=1;seed<=150;seed++)for(const town of SETTLEMENTS){const id=cityMountOffer(seed,town,0);if(!id)continue;seen.add(id);offers++;if(id!=='riding-horse'&&id!=='war-horse')rare++;assert.notEqual(town.kind,'village');if(['warg-mount','dire-wolf-mount'].includes(id))assert.ok(regionalMountPool(town.x,town.y).includes(id));}
 assert.deepEqual(seen,new Set(['riding-horse','war-horse','armored-war-horse','warg-mount','dire-wolf-mount']));assert.ok(rare/offers<.2);
});
test('high-tier camps grant an extra mount alongside named loot, with saveable deterministic rewards',()=>{
 let found;
 for(let seed=1;seed<=80&&!found;seed++){const state=createGame(seed);for(const c of getCampSites(state).filter(c=>campMountReward(state.seed,c))){state.position={x:c.x,y:c.y};startBattle(state,c.id);if(state.battle.famedDrop){found=state;break;}state.battle=null;}}
 assert.ok(found);const battle=found.battle;assert.deepEqual(validateSave(found),found);assert.ok(battle.mountReward&&battle.famedDrop);
 const forged=structuredClone(found);forged.battle.mountReward='riding-horse';assert.throws(()=>validateSave(forged),/mount reward/);
 for(const e of battle.units.filter(u=>u.side==='enemy')){e.hp=0;e.alive=false;}
 advanceBattle(found);assert.equal(battle.status,'victory');assert.ok(battle.loot.items.includes(battle.mountReward));assert.ok(battle.loot.items.includes(battle.famedDrop));
 finishBattle(found);assert.ok(found.inventory.includes(battle.mountReward));assert.ok(found.inventory.includes(battle.famedDrop));assert.deepEqual(validateSave(found),found);
});
test('forged troop identities, casualty indices and faction reports are rejected without mutating saves',()=>{
 const state=createGame(19),id=patrolDefinitions(SETTLEMENTS)[0].id;
 for(const change of [s=>s.factionPatrols[id].troops.push(99),s=>s.worldLosses['road-thieves']={cycle:0,size:2,survivors:[2]},s=>s.factionReports.push({patrolId:'fake'})]){const bad=structuredClone(state);change(bad);const before=structuredClone(bad);assert.throws(()=>validateSave(bad));assert.deepEqual(bad,before);}
});

test('depleted patrols return home until fully reinforced; reserved company targets are protected',()=>{
 const state=createGame(7),definition=patrolDefinitions(SETTLEMENTS)[0],p=state.factionPatrols[definition.id];
 p.troops=[0,1,2];p.behavior='returning';state.hour=20.25;advanceFactionSimulation(state,emptyContext);
 assert.equal(p.troops.length,4);assert.equal(p.behavior,'returning');
 state.day=2;state.hour=8.25;advanceFactionSimulation(state,emptyContext);assert.equal(p.troops.length,5);assert.equal(p.behavior,'returning');
 const camp=getCampSites(state).find(c=>c.random);Object.assign(p,{x:camp.x,y:camp.y,troops:Array.from({length:definition.size},(_,i)=>i),behavior:'touring'});
 state.destinationAction={type:'camp',id:camp.id};state.hour+=.25;advanceFactionSimulation(state,{...emptyContext,camps:()=>[camp]});assert.notEqual(p.targetId,camp.id);
});
