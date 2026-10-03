import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startBattle,advanceBattle,validateSave} from '../src/engine.js';
import {createBattleField,tileAt,blockedTerrain} from '../src/battle-terrain.js';
import {battleHTML} from '../src/battle-view.js';

function battle(){const state=createGame(73);state.position={x:440,y:520};assert.equal(startBattle(state,'quarry-camp').ok,true);return state;}
function fleeing(mount=null){const state=battle(),b=state.battle,e=b.units.find(u=>u.side==='enemy'),p=b.units.find(u=>u.id==='captain');
 for(const t of b.field.tiles){t.terrain='open';t.height=0;}
 for(const u of b.units)if(u!==e&&u!==p){u.hp=0;u.alive=false;}
 Object.assign(p,{q:2,r:12});Object.assign(e,{q:12,r:11,morale:10,ap:9,fleeRound:1,fleeRollRound:1,equipment:{...e.equipment,mount}});
 b.turnOrder=[e.id,p.id];b.turnIndex=0;b.activeId=e.id;e.movementCredit=0;
 return {state,e,p};}

test('expanded combat render includes every tile and deployment leaves at least six tiles to any enemy boundary',()=>{
 const s=battle(),b=s.battle;assert.deepEqual([b.field.columns,b.field.rows],[22,24]);
 for(const u of b.units.filter(u=>u.side==='enemy'))assert.ok(Math.min(u.q,u.r,21-u.q,23-u.r)>=6);
 const html=battleHTML(b,0);assert.equal((html.match(/class="battle-hex /g)||[]).length,528);assert.match(html,/22 × 24/);assert.deepEqual(validateSave(s),s);
});

test('two distinct rear camp exits cross the wall with walkable run-out corridors',()=>{
 for(const biome of ['plains','forest','mountain','marsh','snow','desert'])for(let seed=1;seed<=10;seed++){
  const f=createBattleField(seed,'fort',biome,{fortified:true});
  for(const r of [8,9,13,14])for(const q of [12,13,14,15])assert.equal(tileAt(f,q,r).terrain,'open');
  for(const r of [6,7,10,11,12,15,16,17])assert.equal(tileAt(f,13,r).terrain,'palisade');
  for(const r of [8,9,13,14])assert.equal(tileAt(f,8,r).terrain,'open');
  assert.ok(f.tiles.some(t=>t.q>15&&!blockedTerrain(t.terrain)));
 }
});

test('normal and mounted enemies cannot escape during the first fleeing turn; progress persists through reload',()=>{
 for(const mount of [null,'riding-horse','war-horse','warg-mount']){
  let {state,e,p}=fleeing(mount);const id=e.id;
  for(let i=0;i<20&&state.battle.activeId===id;i++){
   advanceBattle(state);state=validateSave(structuredClone(state));e=state.battle.units.find(u=>u.id===id);
   assert.equal(e.escaped,undefined);assert.equal(e.firstFleeRound,1);
  }
  assert.ok(e.alive);assert.equal(state.battle.activeId,p.id);
  state.battle.round=2;state.battle.activeId=id;state.battle.turnIndex=0;e.ap=9;e.fleeRound=2;e.fleeRollRound=2;
  for(let i=0;i<20&&e.alive;i++)advanceBattle(state);
  assert.equal(e.escaped,true);assert.equal(state.battle.status,'victory');assert.deepEqual(validateSave(state),state);
 }
});

test('an enemy already at an edge still waits one fleeing turn and forged first-round escape is rejected',()=>{
 let {state,e}=fleeing('riding-horse');e.q=21;advanceBattle(state);assert.equal(e.escaped,undefined);assert.equal(e.ap,0);assert.equal(e.firstFleeRound,1);
 const forged=structuredClone(state),enemy=forged.battle.units.find(u=>u.id===e.id);Object.assign(enemy,{escaped:true,alive:false,hp:0});assert.throws(()=>validateSave(forged),/two-turn escape/);
 const bad=structuredClone(state);bad.battle.units.find(u=>u.id===e.id).firstFleeRound=2;assert.throws(()=>validateSave(bad),/first fleeing round/);
});

test('existing 14×16 saves retain their field and immediate edge escape rules',()=>{
 const {state,e,p}=fleeing();const b=state.battle;b.field.columns=14;b.field.rows=16;b.field.tiles=b.field.tiles.filter(t=>t.q<14&&t.r<16);delete b.escapeRulesVersion;
 e.q=13;e.r=6;p.q=2;p.r=6;for(const [i,u] of b.units.entries())if(u!==e&&u!==p){u.q=3;u.r=i;}
 const restored=validateSave(state);assert.deepEqual(restored,state);advanceBattle(restored);assert.equal(restored.battle.units.find(u=>u.id===e.id).escaped,true);
});
