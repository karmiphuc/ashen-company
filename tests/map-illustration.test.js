import test from 'node:test';
import assert from 'node:assert/strict';
import {visualRandom,REGION_STYLE,terrainStamp,roadCurve,settlementProfile,settlementGround,overviewBorderAlpha,showActorLabel,movementPose} from '../src/map-illustration.js';
import {createGame,SETTLEMENTS,WORLD_ROADS,WORLD_REGIONS,validateSave} from '../src/engine.js';
import {updateMap} from '../src/map.js';
test('visual terrain plans are stable, bounded and vary by seed without modifying terrain input',()=>{
 const widths=new Set(),variants=new Set();for(let seed=0;seed<128;seed++)for(let row=0;row<8;row++){
 const a=terrainStamp(seed,row,3,400,200,'forest','plains','greenwood');assert.deepEqual(a,terrainStamp(seed,row,3,400,200,'forest','plains','greenwood'));assert.ok(Math.abs(a.x-400)<=18&&Math.abs(a.y-200)<=10);assert.ok(a.width>=235&&a.width<=320);assert.ok(['forest','plains'].includes(a.family));widths.add(Math.floor(a.width));variants.add(a.family);
 }assert.ok(widths.size>50);assert.equal(variants.size,2);assert.notEqual(visualRandom(1,'same'),visualRandom(2,'same'));
});
test('all road curves stay near the original links and never alter coordinates, lengths or graph identity',()=>{
 const before=JSON.stringify(WORLD_ROADS);for(const road of WORLD_ROADS)for(const seed of [1,73,719]){const c=roadCurve(seed,road),[a,b]=road.points;assert.deepEqual(c,roadCurve(seed,road));assert.ok(Math.hypot(c.x-(a.x+b.x)/2,c.y-(a.y+b.y)/2)<=12.000001);assert.equal(road.length,Math.hypot(a.x-b.x,a.y-b.y));}assert.equal(JSON.stringify(WORLD_ROADS),before);assert.equal(WORLD_ROADS.length,71);
 assert.deepEqual(roadCurve(1,{id:'zero',points:[{x:1,y:2},{x:1,y:2}]}),{x:1,y:2});
});
test('all settlements retain coordinates and get distinct village, town, major city and castle profiles',()=>{
 const before=JSON.stringify(SETTLEMENTS),widths=new Set();for(const town of SETTLEMENTS){const a=settlementGround(719,town);assert.deepEqual(a,settlementGround(719,town));assert.equal(a.points.length,14);assert.ok(a.points.every(p=>Math.abs(p.x-town.x)<=a.radius&&Math.abs(p.y-town.y)<=a.radius*.42));widths.add(a.width);assert.equal(a.military,town.kind==='castle');}
 assert.deepEqual(widths,new Set([98,122,144,150]));assert.equal(JSON.stringify(SETTLEMENTS),before);assert.equal(SETTLEMENTS.length,48);assert.ok(settlementProfile({kind:'village'}).yards<settlementProfile({kind:'town',major:true}).yards);
});
test('every existing region has a visual signature and open steppe remains sparse',()=>{
 assert.deepEqual(new Set(Object.keys(REGION_STYLE)),new Set(WORLD_REGIONS.map(r=>r.id)));assert.ok(REGION_STYLE['far-steppe'].density<REGION_STYLE.greenwood.density/4);assert.notEqual(REGION_STYLE['blackwater-basin'].detail,REGION_STYLE.sunlands.detail);
});
test('borders disappear close up while selected and pursuing actor labels remain visible at overview',()=>{
 assert.equal(overviewBorderAlpha(1),0);assert.equal(overviewBorderAlpha(.7),0);assert.ok(overviewBorderAlpha(.3)>0&&overviewBorderAlpha(.3)<=.18);assert.equal(showActorLabel(.3,false),false);assert.equal(showActorLabel(.3,true),true);assert.equal(showActorLabel(.3,false,true),true);assert.equal(showActorLabel(1,false),true);
});
test('actor direction and dust reflect movement with stable facing on stops and no idle particles',()=>{
 assert.deepEqual(movementPose({x:10,y:10},{x:5,y:10}),{moving:true,flip:true,dx:-5,dy:0});assert.equal(movementPose({x:5,y:10,flip:true},{x:5,y:10}).flip,true);assert.equal(movementPose(null,{x:5,y:10},{x:0,y:10}).flip,true);assert.equal(movementPose({x:5,y:10},{x:5,y:10}).moving,false);
});
test('map updates never change saved campaign state, entities or mechanics',()=>{
 for(const seed of [1,73,719]){const s=createGame(seed),before=JSON.stringify(s);updateMap(s);updateMap(s);assert.equal(JSON.stringify(s),before);assert.deepEqual(validateSave(s),s);}
});
