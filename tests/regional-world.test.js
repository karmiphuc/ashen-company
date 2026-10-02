import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTLEMENTS, WORLD_BOUNDS, WORLD_REGIONS, WORLD_ROADS, createGame, getMarket, getCampSites, getRoamingBands, getCaravans, travelTo, tick, terrainAt, validateSave } from '../src/engine.js';
import { REGIONAL_SETTLEMENTS, roadRoute, regionAt, distanceToRoad, regionalTownArt, regionalTownSpecialty } from '../src/geography.js';
import { shipmentPlan, shipmentPosition } from '../src/caravans.js';
const inBounds=point=>point.x>=WORLD_BOUNDS.minX&&point.x<=WORLD_BOUNDS.maxX&&point.y>=WORLD_BOUNDS.minY&&point.y<=WORLD_BOUNDS.maxY;

test('48 settlements populate nine distinct regions and one connected road network with local loops and highways', () => {
  assert.equal(SETTLEMENTS.length,48);assert.equal(WORLD_REGIONS.length,9);assert.equal(WORLD_ROADS.length,71);
  assert.equal(new Set(SETTLEMENTS.map(town=>town.id)).size,48);
  assert.equal(new Set(WORLD_ROADS.map(road=>road.id)).size,71);
  assert.ok(WORLD_ROADS.filter(road=>road.kind==='highway').length>=20);
  assert.deepEqual(new Set(SETTLEMENTS.map(town=>regionAt(town.x,town.y).id)),new Set(WORLD_REGIONS.map(region=>region.id)));
  for(const town of SETTLEMENTS){
    assert.ok(inBounds(town));assert.notEqual(terrainAt(town.x,town.y),'sea');
    assert.ok(regionalTownArt(town)&&regionalTownSpecialty(town));
    const route=roadRoute(SETTLEMENTS,'oakwatch',town.id);
    assert.deepEqual(route.at(-1),{x:town.x,y:town.y});assert.ok(route.every(inBounds));
    if(town.id!=='oakwatch')assert.ok(WORLD_ROADS.filter(road=>road.from===town.id||road.to===town.id).length>=2,town.id);
  }
  for(const road of WORLD_ROADS)assert.equal(distanceToRoad(road.points[0].x,road.points[0].y,[road]),0);
  assert.equal(terrainAt(4950,2700),'desert');assert.equal(terrainAt(3300,100),'snow');
});

test('new caravans remain on displayed roads through their journey while original route origins remain stable', () => {
  for(const town of REGIONAL_SETTLEMENTS){
    const plan=shipmentPlan(town,SETTLEMENTS,{startDay:12});
    const origin=SETTLEMENTS.find(row=>row.id===plan.originId);
    assert.ok(plan.roadPoints.length>=2,town.id);
    for(let step=0;step<=12;step++){
      const point=shipmentPosition(plan,origin,town,plan.departureHour+plan.travelHours*step/12);
      assert.ok(inBounds(point));assert.ok(distanceToRoad(point.x,point.y,WORLD_ROADS)<.001,town.id);
    }
    assert.deepEqual(shipmentPosition(plan,origin,town,plan.arrivalHour),{x:town.x,y:town.y});
  }
  const farhold=SETTLEMENTS.find(town=>town.id==='farhold');
  assert.equal(shipmentPlan(farhold,SETTLEMENTS,{startDay:1}).originId,'stonebridge');
});

test('all regional markets remain pure with finite supplies, prices, stock and regional gear', () => {
  for(const town of REGIONAL_SETTLEMENTS){
    const state=createGame(1007);state.position={x:town.x,y:town.y};const before=structuredClone(state);
    const market=getMarket(state,town.id);
    assert.ok(market.equipment.every(row=>Number.isSafeInteger(row.stock)&&row.stock>=0&&row.buyPrice>row.sellPrice&&Number.isFinite(row.buyPrice)));
    assert.ok(market.goods.every(row=>Number.isFinite(row.buyPrice)&&row.buyPrice>row.sellPrice));
    assert.deepEqual(state,before);assert.deepEqual(getMarket(validateSave(state),town.id),market);
  }
});

test('additional patrols and camps are deterministic, in bounds, persist progress and equip regional DLC gear', () => {
  const state=createGame(1009),camps=getCampSites(state),bands=getRoamingBands(state);
  assert.equal(camps.length,39);assert.equal(bands.length,56);
  assert.deepEqual(camps,getCampSites(state));assert.deepEqual(bands,getRoamingBands(state));
  assert.ok([...camps,...bands].every(inBounds));
  assert.ok(bands.filter(band=>band.id.endsWith('-patrol')).some(band=>band.enemies.some(enemy=>enemy.armor?.startsWith('bb-'))));
  state.camps['wild-camp-36']={clearedDay:1,respawnAt:80,generation:4};
  const id=REGIONAL_SETTLEMENTS[0].id+'-patrol';state.bands[id].defeatedUntil=30;
  const legacy=structuredClone(state);for(const town of REGIONAL_SETTLEMENTS.slice(1))delete legacy.bands[town.id+'-patrol'];
  const restored=validateSave(legacy);
  assert.deepEqual(restored.camps,state.camps);assert.deepEqual(restored.bands[id],state.bands[id]);
  assert.equal(Object.keys(restored.bands).length,56);assert.deepEqual(validateSave(restored),restored);
  assert.deepEqual(getCampSites(restored).slice(0,15),camps.slice(0,15),'original camps retain their locations and rosters');
});

test('roads speed frontier travel and snow/desert positions round trip without accepting out-of-bounds destinations', () => {
  const state=createGame(1013);state.position={x:4100,y:1875};
  for(const band of Object.values(state.bands))band.defeatedUntil=48;
  assert.equal(travelTo(state,4150,1900).ok,true);assert.equal(tick(state,.25).ok,true);
  assert.ok(state.position.x>4114,'highway provides more than ordinary desert movement');
  assert.deepEqual(validateSave(state),state);
  assert.equal(travelTo(state,WORLD_BOUNDS.maxX+1,1800).ok,false);
});
