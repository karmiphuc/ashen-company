import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,validateSave,tick,SETTLEMENTS,travelTo} from '../src/engine.js';
import {FOG_CELL_COUNT,WORLD_VIEW_RADIUS,fogCell,revealWorld,worldPointVisible,worldPointExplored,setWorldFogEnabled,validExploration} from '../src/world-fog.js';

test('new campaign has generous scouting vision but hides the distant world',()=>{
 setWorldFogEnabled(true);const s=createGame(79);
 assert.equal(s.worldExploration.length,FOG_CELL_COUNT);
 assert.ok(worldPointVisible(s,{x:s.position.x+450,y:s.position.y}));
 assert.equal(worldPointVisible(s,{x:s.position.x+WORLD_VIEW_RADIUS+1,y:s.position.y}),false);
 assert.equal(worldPointExplored(s,{x:3000,y:2000}),false);
 assert.deepEqual(validateSave(s),s);
});
test('visited ground is remembered without revealing parties currently there',()=>{
 setWorldFogEnabled(true);const s=createGame(79),old={...s.position};
 s.position={x:2000,y:900};revealWorld(s,SETTLEMENTS);
 assert.ok(worldPointExplored(s,old));assert.equal(worldPointVisible(s,old),false);
 assert.ok(worldPointVisible(s,s.position));assert.deepEqual(validateSave(s),s);
});
test('debug reveal does not permanently explore the whole map',()=>{
 const s=createGame(79),hidden={x:3000,y:2000},bits=s.worldExploration;
 setWorldFogEnabled(false);assert.ok(worldPointExplored(s,hidden));assert.ok(worldPointVisible(s,hidden));
 revealWorld(s,SETTLEMENTS);assert.equal(s.worldExploration,bits);
 setWorldFogEnabled(true);assert.equal(worldPointExplored(s,hidden),false);
});
test('older saves load unchanged and initialize visited town memories lazily',()=>{
 const s=createGame(79);delete s.worldExploration;s.visited.push('frostgate');
 const restored=validateSave(s);assert.deepEqual(restored,s);
 const frostgate=SETTLEMENTS.find(t=>t.id==='frostgate');
 revealWorld(restored,SETTLEMENTS);assert.ok(worldPointExplored(restored,frostgate));
 assert.equal(worldPointVisible(restored,frostgate),false);
 assert.deepEqual(validateSave(restored),restored);
});
test('invalid exploration fields are rejected without modifying save input',()=>{
 const s=createGame(79);
 for(const field of [null,{},'1','x'.repeat(FOG_CELL_COUNT),'0'.repeat(FOG_CELL_COUNT+1)]){
  s.worldExploration=field;const before=structuredClone(s);
  assert.throws(()=>validateSave(s),/Invalid world exploration/);assert.deepEqual(s,before);
 }
 assert.equal(validExploration('0'.repeat(FOG_CELL_COUNT)),true);assert.equal(fogCell({x:0,y:0}),-1);
});
test('world simulation reveals traveled ground and keeps exploration saveable',()=>{
 const s=createGame(79);const before=s.worldExploration;
 travelTo(s,950,460);for(let i=0;i<40&&!s.battle&&s.destination;i++)tick(s,.25);
 assert.notEqual(s.worldExploration,before);assert.ok(worldPointExplored(s,s.position));
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
});
