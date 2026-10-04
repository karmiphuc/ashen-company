import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,WORLD_ROADS,getCampSites,getRoamingBands,getFactionPatrols,travelTo,tick,validateSave,terrainAt} from '../src/engine.js';
import {compactPoint,regionAt,distanceToRoad} from '../src/geography.js';
import {WORLD_MOUNTAIN_RANGES,worldBlocked,worldRoute,worldSegmentClear,moveWorldToward,nearestWorldPoint,worldPointInBounds} from '../src/world-navigation.js';
import {LEGENDARY_CAVES,worldLandmarks,landmarkAt} from '../src/world-landmarks.js';
const center=p=>({x:p.reduce((n,q)=>n+q.x,0)/p.length,y:p.reduce((n,q)=>n+q.y,0)/p.length});
test('three authored ranges block peaks but leave all existing roads and settlements open',()=>{
 assert.equal(WORLD_MOUNTAIN_RANGES.length,3);for(const r of WORLD_MOUNTAIN_RANGES)for(const p of r.parts){assert.ok(worldBlocked(center(p)));assert.equal(terrainAt(center(p).x,center(p).y),'mountain');assert.ok(p.every(worldPointInBounds));}
 assert.equal(WORLD_ROADS.length,71);assert.ok(WORLD_ROADS.every(r=>worldSegmentClear(...r.points)));assert.ok(SETTLEMENTS.every(t=>!worldBlocked(t)));
});
test('routes detour around all ridges in both directions and movement never tunnels through them',()=>{
 for(const r of WORLD_MOUNTAIN_RANGES)for(const p of r.parts){const middle=center(p),a={x:Math.min(...p.map(q=>q.x))-30,y:middle.y},b={x:Math.max(...p.map(q=>q.x))+30,y:middle.y};
  assert.equal(worldSegmentClear(a,b),false);
  for(const [from,to]of [[a,b],[b,a]]){const route=worldRoute(from,to);assert.ok(route?.length>1);let previous=from;for(const q of route){assert.ok(worldSegmentClear(previous,q));previous=q;}
   const actor={...from};let steps=0;while(!moveWorldToward(actor,to,7)&&steps++<200){assert.ok(!worldBlocked(actor));}assert.ok(steps<200);assert.deepEqual(actor,to);
  }
 }
});
test('all city pairs and cave entrances remain reachable by valid routes',()=>{
 for(const a of SETTLEMENTS)for(const b of SETTLEMENTS){let previous=a;const route=worldRoute(a,b);assert.ok(route);for(const p of route){assert.ok(worldSegmentClear(previous,p));previous=p;}}
 for(const cave of LEGENDARY_CAVES){assert.ok(!worldBlocked(cave));assert.ok(worldRoute(SETTLEMENTS[0],cave));}
});
test('player travel refuses blocked destinations, follows detours and survives reload',()=>{
 const range=WORLD_MOUNTAIN_RANGES[2].parts[0],middle=center(range),s=createGame(312),a={x:Math.min(...range.map(q=>q.x))-50,y:middle.y},b={x:Math.max(...range.map(q=>q.x))+50,y:middle.y};s.position=a;
 const before=structuredClone(s);assert.equal(travelTo(s,middle.x,middle.y).ok,false);assert.deepEqual(s,before);assert.ok(travelTo(s,b.x,b.y).ok);
 let loaded=s;for(let i=0;i<240&&loaded.destination&&!loaded.battle;i++){tick(loaded,.25);assert.ok(!worldBlocked(loaded.position));loaded=validateSave(structuredClone(loaded));}
 assert.equal(loaded.battle,null);assert.equal(loaded.destination,null);assert.deepEqual(loaded.position,b);
});
test('legacy actors inside new peaks walk out gradually and obsolete destinations stop safely',()=>{
 const middle=center(WORLD_MOUNTAIN_RANGES[0].parts[0]),exit=nearestWorldPoint(middle);assert.ok(exit&&!worldBlocked(exit));const actor={...middle};moveWorldToward(actor,exit,1);assert.ok(Math.hypot(actor.x-middle.x,actor.y-middle.y)<=1.00001);
 const s=createGame(3);s.destination=middle;tick(s,.25);assert.equal(s.destination,null);assert.match(s.log.at(-1).text??s.log.at(-1),/mountain peaks/);assert.deepEqual(validateSave(s),s);
});
test('regional landmarks are deterministic, spaced from commerce, and major desert monuments remain together',()=>{
 for(const seed of [1,73,7192]){const s=createGame(seed),before=JSON.stringify(s),args={settlements:SETTLEMENTS,camps:getCampSites(s),roads:WORLD_ROADS},a=worldLandmarks(seed,args);assert.deepEqual(a,worldLandmarks(seed,args));assert.equal(JSON.stringify(s),before);assert.ok(a.length>=12);assert.ok(a.every(o=>!['temple','ruins'].includes(o.kind)));
  for(const o of a){assert.ok(worldPointInBounds(o));assert.ok(!worldBlocked(o));assert.equal(landmarkAt(a,o)?.id,o.id);if(o.region){assert.equal(regionAt(o.x,o.y).id,o.region);assert.ok(distanceToRoad(o.x,o.y,WORLD_ROADS)>=o.width*.24+22);assert.ok(SETTLEMENTS.every(t=>Math.hypot(t.x-o.x,t.y-o.y)>=o.width*.4+85));}}
  assert.ok(a.some(o=>o.id==='necropolis-pyramid'));assert.ok(a.some(o=>o.kind==='sphinx'));assert.ok(a.some(o=>o.kind==='battlefield'));
  const encampments=a.filter(o=>o.kind==='warcamp');assert.ok(new Set(encampments.map(o=>o.region)).size>=6,'minor bivouacs remain across regions without crowding the larger stories');
  assert.equal(a.filter(o=>o.kind==='scene').length,8,'all authored regional stories remain visible');
 }
 assert.notDeepEqual(worldLandmarks(1),worldLandmarks(2));
});
test('exactly three dormant caves reserve forest, central mountain-cleft and pyramid-side quest sites',()=>{
 assert.equal(LEGENDARY_CAVES.length,3);assert.deepEqual(LEGENDARY_CAVES.map(c=>c.setting),['forest','mountain','desert']);assert.ok(LEGENDARY_CAVES.every(c=>c.futureQuest));
 const [forest,mountain,desert]=LEGENDARY_CAVES;assert.equal(terrainAt(forest.x,forest.y),'forest');assert.equal(regionAt(forest.x,forest.y).id,'greenwood');assert.ok(SETTLEMENTS.every(t=>Math.hypot(t.x-forest.x,t.y-forest.y)>250));
 assert.ok(mountain.y>Math.max(...WORLD_MOUNTAIN_RANGES[0].parts[0].map(p=>p.y))&&mountain.y<Math.min(...WORLD_MOUNTAIN_RANGES[0].parts[1].map(p=>p.y)));
 const pyramid=worldLandmarks(1).find(o=>o.id==='necropolis-pyramid');assert.ok(Math.hypot(desert.x-pyramid.x,desert.y-pyramid.y)<210);
});
test('seeded camps and moving bands/patrols stay accessible around new ranges',()=>{
 for(const seed of [1,73,7192]){const s=createGame(seed);assert.ok(getCampSites(s).every(c=>!worldBlocked(c)));
  s.position=compactPoint({x:4800,y:2900});for(let i=0;i<96;i++)tick(s,.25);
  assert.ok(getRoamingBands(s).every(b=>!worldBlocked(b)));assert.ok(getFactionPatrols(s).filter(p=>p.active).every(p=>!worldBlocked(p)));assert.deepEqual(validateSave(s),s);
 }
});
