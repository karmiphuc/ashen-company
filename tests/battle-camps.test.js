import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BATTLE_PROJECTION,tilePosition,elevationFaces} from '../src/battle-geometry.js';
import {createBattleField,tileAt,hexNeighbors,movementCost,blockedTerrain,rangedCoverModifier} from '../src/battle-terrain.js';
import {enemyBattleTactic} from '../src/tactical-ai.js';
import {portraitGroundAnchor,portraitHTML} from '../src/portraits.js';
import {battleHTML} from '../src/battle-view.js';
import * as m from '../src/engine.js';
function fight(seed=51){const state=m.createGame(seed),site=m.getCampSites(state)[3];state.position={x:site.x,y:site.y};assert.equal(m.startBattle(state,site.id).ok,true);return state;}
function roster(state,count){const battle=state.battle,base=battle.units.find(u=>u.side==='enemy');battle.units=battle.units.filter(u=>u.side==='company');for(let i=0;i<4;i++){const unit=structuredClone(base);Object.assign(unit,{id:`enemy-${i+1}`,q:i<count?12:11,r:2+i,equipment:{...unit.equipment,weapon:i<count?'hunting-bow':'arming-sword'},alive:true,throwingAmmo:{active:0,reserve:0}});battle.units.push(unit);}battle.turnOrder=battle.units.map(u=>u.id);battle.activeId='enemy-4';battle.turnIndex=battle.turnOrder.indexOf(battle.activeId);return battle;}

test('BB-shaped hex projection keeps equal-height shared edges aligned and raises only the surface',()=>{
 const g=BATTLE_PROJECTION;assert.ok(g.width/g.height>1.7);assert.equal(g.stepY,g.height*.75);
 const a=tilePosition({q:5,r:5,height:2}),b=tilePosition({q:5,r:6,height:2});assert.deepEqual([b.x-a.x,b.y-a.y],[38,33]);
 const low=tilePosition({q:5,r:5,height:0});assert.equal(low.y-a.y,24);
});

test('plateau interiors have no walls; exposed faces match each neighbor height independently',()=>{
 const tile={q:4,r:4,height:2};assert.deepEqual(elevationFaces(tile,()=>({height:2})),[]);assert.deepEqual(elevationFaces(tile,()=>({height:3})),[]);
 const faces=elevationFaces(tile,(q)=>({height:q===4?1:0}));assert.deepEqual(faces.map(f=>[f.edge,f.drop]),[['SE',1],['SW',2]]);
 assert.deepEqual(faces[0].points,[[76,33],[38,44],[38,56],[76,45]]);assert.deepEqual(faces[1].points,[[38,44],[0,33],[0,57],[38,68]]);
});

test('camp walls are deterministic, impassable and have connected wide entrances in every biome',()=>{
 for(const biome of ['plains','forest','mountain','marsh','snow','desert'])for(let seed=1;seed<=8;seed++){
  const field=createBattleField(seed,'fort',biome,{fortified:true});assert.deepEqual(field,createBattleField(seed,'fort',biome,{fortified:true}));
  assert.equal(tileAt(field,8,3).terrain,'palisade');assert.equal(movementCost(field,{q:7,r:3},{q:8,r:3}),Infinity);
  for(const r of [4,5,9,10]){assert.equal(tileAt(field,8,r).terrain,'open');assert.ok(Number.isFinite(movementCost(field,{q:7,r},{q:8,r})));}
  const walkable=field.tiles.filter(t=>!blockedTerrain(t.terrain)),seen=new Set([`${walkable[0].q},${walkable[0].r}`]),queue=[walkable[0]];
  for(const t of queue)for(const n of hexNeighbors(field,t)){const key=`${n.q},${n.r}`;if(!seen.has(key)&&Number.isFinite(movementCost(field,t,n))){seen.add(key);queue.push(n);}}
  assert.equal(seen.size,walkable.length,`${biome}:${seed}`);assert.ok(rangedCoverModifier(field,{q:7,r:3},{q:10,r:3})<0);
 }
 assert.ok(!createBattleField(4,'road','plains').tiles.some(t=>t.terrain==='palisade'));
});

test('new camp battles deploy safely behind walls, roaming encounters stay unwalled and saves reject wall occupancy',()=>{
 const state=fight(),b=state.battle;assert.equal(b.enemyTacticsVersion,1);assert.ok(b.field.tiles.some(t=>t.terrain==='palisade'));assert.ok(b.units.every(u=>!blockedTerrain(tileAt(b.field,u.q,u.r).terrain)));assert.deepEqual(m.validateSave(structuredClone(state)),state);
 const bad=structuredClone(state);Object.assign(bad.battle.units.find(u=>u.side==='company'),{q:8,r:3});assert.throws(()=>m.validateSave(bad));
 const bandState=m.createGame(4),band=m.getRoamingBands(bandState)[0];bandState.position={x:band.x,y:band.y};assert.equal(m.startBattle(bandState,band.id).ok,true);assert.ok(!bandState.battle.field.tiles.some(t=>t.terrain==='palisade'));
});

test('three live ranged enemies defend, two attack; spent throwing bundles and escaped units do not count',()=>{
 const state=fight(),b=roster(state,3);assert.equal(enemyBattleTactic(b,m.getItem),'defense');const archer=b.units.find(u=>u.id==='enemy-1');archer.alive=false;assert.equal(enemyBattleTactic(b,m.getItem),'offense');archer.alive=true;archer.escaped=true;assert.equal(enemyBattleTactic(b,m.getItem),'offense');archer.escaped=false;archer.equipment.weapon='javelins';assert.equal(enemyBattleTactic(b,m.getItem),'offense');archer.throwingAmmo.active=1;assert.equal(enemyBattleTactic(b,m.getItem),'defense');delete b.enemyTacticsVersion;assert.equal(enemyBattleTactic(b,m.getItem),'offense');
});

test('defending infantry hold independently of company orders and advance after losing ranged superiority',()=>{
 const state=fight(),b=roster(state,3),actor=b.units.find(u=>u.id==='enemy-4'),origin={q:actor.q,r:actor.r};b.tactic='offense';m.advanceBattle(state);assert.equal(b.lastEvent.type,'hold');assert.deepEqual({q:actor.q,r:actor.r},origin);assert.equal(actor.ap,0);
 actor.ap=9;b.activeId=actor.id;b.turnIndex=b.turnOrder.indexOf(actor.id);b.units.find(u=>u.id==='enemy-1').equipment.weapon='arming-sword';actor.equipment.shield=null;actor.shieldDurability=actor.maxShieldDurability=0;m.advanceBattle(state);assert.equal(b.lastEvent.type,'move');assert.notDeepEqual({q:actor.q,r:actor.r},origin);
});

test('ranged defenders shoot in reach, defense releases after four quiet rounds and old battles keep offense',()=>{
 const state=fight(),b=roster(state,3),archer=b.units.find(u=>u.id==='enemy-1'),target=b.units.find(u=>u.side==='company');Object.assign(target,{q:9,r:2});b.activeId=archer.id;b.turnIndex=b.turnOrder.indexOf(archer.id);m.advanceBattle(state);assert.ok(['attack','miss'].includes(b.lastEvent.type));
 for(const legacy of [false,true]){const s=fight(),battle=roster(s,3),actor=battle.units.find(u=>u.id==='enemy-4');actor.equipment.shield=null;actor.shieldDurability=actor.maxShieldDurability=0;if(legacy)delete battle.enemyTacticsVersion;else battle.round=5;m.advanceBattle(s);assert.equal(battle.lastEvent.type,'move');}
});

test('new fortified battles resolve identically with save imports between every action',()=>{
 const state=fight(79),instant=structuredClone(state);assert.equal(m.resolveBattle(instant).ok,true);let loaded=state,steps=0;while(loaded.battle.status==='active'&&steps++<2200){m.advanceBattle(loaded);loaded=m.validateSave(structuredClone(loaded));}assert.notEqual(loaded.battle.status,'active');assert.deepEqual(loaded,instant);
});

test('rendered palisades, cliffs and pawn feet retain row depth without a global foreground offset',()=>{
 const state=fight(),html=battleHTML(state.battle,0),css=readFileSync(new URL('../src/battle.css',import.meta.url),'utf8');assert.match(html,/battle-palisade/);assert.match(html,/Impassable wooden wall/);assert.match(html,/Enemy tactic:/);assert.match(html,/data-drop="[12]"/);assert.match(html,/--pawn-foot:[\d.]+px/);assert.match(css,/z-index:var\(--unit-depth,15\)/);assert.doesNotMatch(css,/150 \+ var\(--unit-depth/);assert.match(css,/height:44px;min-width:0/);
});


test('an actual three-ranged camp preserves defensive rules through reloads and resolves without stalling',()=>{
 const state=m.createGame(51),site=m.getCampSites(state).find(c=>c.id==='wild-camp-8');state.position={x:site.x,y:site.y};m.startBattle(state,site.id);assert.equal(enemyBattleTactic(state.battle,m.getItem),'defense');
 let loaded=m.validateSave(structuredClone(state)),steps=0;const invalid=structuredClone(loaded);invalid.battle.enemyTacticsVersion=2;assert.throws(()=>m.validateSave(invalid));
 const instant=structuredClone(loaded);m.resolveBattle(instant);while(loaded.battle.status==='active'&&steps++<2200){m.advanceBattle(loaded);assert.ok(loaded.battle.units.filter(u=>u.alive).every(u=>!blockedTerrain(tileAt(loaded.battle.field,u.q,u.r).terrain)));loaded=m.validateSave(structuredClone(loaded));}
 assert.notEqual(loaded.battle.status,'active');assert.deepEqual(loaded,instant);
});


test('mounted ground anchors follow the actual shared plate and equipment frame for all species',()=>{
 for(const mount of m.ITEMS.filter(i=>i.slot==='mount'))for(const weapon of ['arming-sword','greatsword','bb-named-two-handed-mace']){
  const equipment={mount,weapon:m.getItem(weapon),helmet:m.getItem('bb-named-conic-helmet-with-faceguard')},html=portraitHTML({seed:42,name:'Rider'},equipment),style=html.match(/bb-portrait-composition" style="([^"]+)"/)[1];
  const top=Number(style.match(/top:([\d.]+)px/)[1]),scale=Number(style.match(/transform:scale\(([\d.]+)\)/)[1]);
  assert.ok(Math.abs(portraitGroundAnchor(equipment).y-(top+160*scale))<1e-8,`${mount.id}:${weapon}: foot matches visible plate bottom`);
 }
});
