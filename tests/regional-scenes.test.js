import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCampSites,SETTLEMENTS,WORLD_ROADS,validateSave} from '../src/engine.js';
import {worldLandmarks,LEGENDARY_CAVES} from '../src/world-landmarks.js';
import {regionalSceneFits,REGIONAL_STORY_SITES,REGIONAL_SCENE_LAYOUTS,sceneFootprintContains} from '../src/regional-scenes.js';
import {regionAt} from '../src/geography.js';

test('all eight regional stories survive seeded camps with complete footprints clear of towns, roads, peaks and caves',()=>{
 for(let seed=1;seed<=100;seed++){
  const state=createGame(seed),before=JSON.stringify(state),camps=getCampSites(state),args={settlements:SETTLEMENTS,roads:WORLD_ROADS,camps},scenes=worldLandmarks(seed,args).filter(o=>o.kind==='scene');
  assert.equal(scenes.length,8,'campaign '+seed);assert.equal(JSON.stringify(state),before);
  for(const scene of scenes){
   assert.ok(regionalSceneFits(scene,{...args,reserved:[...LEGENDARY_CAVES,...scenes.filter(o=>o.id!==scene.id)]}),scene.id+' campaign '+seed);
   assert.equal(regionAt(scene.x,scene.y).id,scene.region);
   assert.ok(sceneFootprintContains(scene,scene));
   assert.ok(!sceneFootprintContains(scene,{x:scene.x+scene.width,y:scene.y}));
  }
  assert.deepEqual(worldLandmarks(seed,args),worldLandmarks(seed,args));
 }
});
test('scenery positions remain stable as random camps clear, respawn and reload',()=>{
 for(const seed of [1,73,7192]){
  const state=createGame(seed),args={settlements:SETTLEMENTS,roads:WORLD_ROADS},stories=worldLandmarks(seed,{...args,camps:getCampSites(state)}).filter(o=>o.kind==='scene');
  assert.deepEqual(worldLandmarks(seed,{...args,camps:getCampSites(state).filter(c=>!c.random)}).filter(o=>o.kind==='scene'),stories);
  for(const c of getCampSites(state).filter(c=>c.random))state.camps[c.id]={generation:2,clearedDay:null,respawnAt:null};
  const loaded=validateSave(structuredClone(state)),camps=getCampSites(loaded);
  assert.deepEqual(worldLandmarks(seed,{...args,camps}).filter(o=>o.kind==='scene'),stories);
  assert.ok(camps.every(c=>stories.every(o=>Math.hypot(c.x-o.x,c.y-o.y)>=o.width*.45+45)));
 }
});
test('stories have distinct structural silhouettes and grounded tiny debris rather than repeating camps',()=>{
 assert.equal(REGIONAL_STORY_SITES.length,8);const signatures=new Set();
 for(const site of REGIONAL_STORY_SITES){const parts=REGIONAL_SCENE_LAYOUTS[site.id];signatures.add(JSON.stringify(parts));
  assert.ok(parts.some(p=>p.layer==='ground'));assert.ok(parts.length>=12);
  for(const p of parts){
   if(/corpse_|bones|skeleton/.test(p.art))assert.ok(p.width<=13);
   if(/crates?$/.test(p.art))assert.ok(p.width<=10);
   if(/(supply_wagon|wagon_wreck)$/.test(p.art))assert.ok(p.width<=44);
   if(p.rotation)assert.ok(p.layer==='ground'||p.art.startsWith('battlefield_'));
  }
 }
 assert.equal(signatures.size,8);
 assert.equal(REGIONAL_SCENE_LAYOUTS['frozen-skirmish'].filter(p=>p.art.includes('corpse')).length,8);
 assert.equal(REGIONAL_SCENE_LAYOUTS['overgrown-chapel'].filter(p=>p.art==='scene_gravestone').length,12);
 assert.equal(REGIONAL_SCENE_LAYOUTS['knights-last-stand'].filter(p=>p.art.includes('corpse')).length,12);
});
