import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createGame, SETTLEMENTS, GOODS, getTownLocalSupply, getMarket, getTownEvent, getCampSites, tick, validateSave } from '../src/engine.js';
import { townEventModifiers } from '../src/town-events.js';
import { townFacilities } from '../src/town-facilities.js';
import { settlementScenery, worldSettlementScenery, sceneryAt, SETTLEMENT_SCENERY_ASSETS } from '../src/settlement-scenery.js';
const town = id => SETTLEMENTS.find(town => town.id === id);

test('outskirts match actual seeded workshops and local market supply, without mutating the campaign', () => {
  const state = createGame(2), before = structuredClone(state), structures = worldSettlementScenery(state);
  assert.deepEqual(state, before);
  assert.equal(new Set(structures.map(s => s.key)).size, structures.length);
  for (const place of SETTLEMENTS) {
    const local = structures.filter(s => s.townId === place.id);
    assert.deepEqual(local.filter(s => s.emblem).map(s => s.emblem), townFacilities(state.seed,place).map(s => s.id));
    for (const s of local) { assert.equal(s.targetable,false); assert.equal(s.id,undefined); assert.equal(s.action,undefined); assert.ok(Math.hypot(s.x-place.x,s.y-place.y)>48 && Math.hypot(s.x-place.x,s.y-place.y)<=161); }
    const supply=getTownLocalSupply(place.id);
    if(supply){
      const market=getMarket({...state,position:{x:place.x,y:place.y}});
      const good=GOODS.find(g=>g.id===supply.goodId),mod=townEventModifiers(getTownEvent(state,place.id));
      assert.equal(market.goods.find(g=>g.goodId===good.id).buyPrice,Math.max(1,Math.round(good.basePrice*supply.factor*(good.id==='grain'?mod.grainBuy??mod.goodsBuy??1:mod.goodsBuy??1))));
      assert.ok(supply.factor<=.9);assert.ok(local.some(s=>s.slot==='industry'));
    }
  }
  assert.equal(getTownLocalSupply('unknown'),null);
  assert.equal(structures.find(s=>s.townId==='ironford'&&s.emblem==='blacksmith').art,'ore_smelters_01');
  const stable=settlementScenery(state,town('ironford'),{event:null});
  assert.deepEqual(settlementScenery({...state,day:50},town('ironford'),{event:null}),stable);
});

test('a real armorer raid changes the parked wagon hint, then clears its shortage on expiry', () => {
  const state=createGame(2);tick(state,7.5);
  assert.equal(worldSettlementScenery(state).find(s=>s.townId==='ironford'&&s.slot==='condition').state,'under-attack');
  tick(state,8);
  assert.equal(getTownEvent(state,'ironford').type,'arms-shortage');
  assert.equal(worldSettlementScenery(state).find(s=>s.townId==='ironford'&&s.slot==='condition').state,'lost');
  assert.deepEqual(worldSettlementScenery(validateSave(structuredClone(state))),worldSettlementScenery(state));
  tick(state,72);tick(state,24);
  assert.notEqual(worldSettlementScenery(state).find(s=>s.townId==='ironford'&&s.slot==='condition')?.state,'lost');
});

test('delivered wagons and harvest/trade conditions use distinct, temporary scenery', () => {
  const state=createGame(2), place=town('ironford');
  const shipment=state.shipments.ironford;
  Object.assign(shipment,{attackerId:null,attackerSpawnCycle:null,attackHour:null,raidCleared:true});tick(state,60);
  assert.equal(worldSettlementScenery(state).find(s=>s.townId===place.id&&s.slot==='condition').state,'delivered');
  const expected={'poor-harvest':['hungry','wheat_farm_01'],'good-harvest':['harvest','trade_cart'],
    'trade-caravan':['trade','trade_cart'],'market-fair':['fair','trade_cart'],'militia-muster':['muster','militia_trainingcamp_01']};
  for(const [type,[status,art]] of Object.entries(expected)){
    const scenery=settlementScenery(state,place,{event:{type,description:type}}).find(s=>s.slot==='condition');
    assert.equal(scenery.state,status);assert.equal(scenery.art,art);
  }
  assert.equal(settlementScenery(state,place,{event:null}).find(s=>s.slot==='condition'),undefined);
  assert.equal(settlementScenery(state,place,{event:{type:'armorer-shipment-en-route'}}).find(s=>s.slot==='condition'),undefined,'no invented moving wagon without an active shipment');
});

test('scenery bounds distinguish buildings from settlement centers and empty ground', () => {
  const state=createGame(2), structures=worldSettlementScenery(state), forge=structures.find(s=>s.emblem==='blacksmith');
  assert.equal(sceneryAt(structures,{x:forge.x,y:forge.y-10}),forge);
  assert.equal(sceneryAt(structures,town(forge.townId)),null);
  assert.equal(sceneryAt(structures,{x:0,y:0}),null);assert.equal(sceneryAt(structures,{x:NaN,y:0}),null);
});

test('distinct world-building and wagon PNGs match their pinned source manifest', async () => {
  const manifest=JSON.parse(await readFile(new URL('../assets/world/settlement-sources.json',import.meta.url),'utf8'));
  assert.equal(manifest.assets.length,SETTLEMENT_SCENERY_ASSETS.length);
  for(const name of SETTLEMENT_SCENERY_ASSETS){
    const entry=manifest.assets.find(s=>s.local.endsWith('/'+name+'.png'));assert.ok(entry);
    const data=await readFile(new URL('../'+entry.local,import.meta.url));
    assert.equal(data.length,entry.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),entry.sha256);
    assert.equal(data.subarray(1,4).toString(),'PNG');
  }
});


test('seeded yards avoid initial camps and keep their placement through clearing and harvest changes', () => {
  for (let seed=1;seed<=8;seed++) {
    const state=createGame(seed),camps=getCampSites(state),structures=worldSettlementScenery(state);
    for(const s of structures) assert.ok(!camps.some(c=>Math.hypot(c.x-s.x,c.y-s.y)<75),`${seed}/${s.key} avoids camp artwork`);
    const place=town('barrowfield'),before=settlementScenery(state,place,{event:null});
    state.camps[camps[0].id] = { generation: 5 };
    for(const record of Object.values(state.camps)) record.generation=5;
    assert.deepEqual(settlementScenery(state,place,{event:null}),before);
    const mixed=settlementScenery(state,place,{event:{type:'poor-harvest',description:'Scarce food'},caravans:[{destinationId:place.id,status:'under-attack',description:'Threatened wagon'}]});
    assert.ok(mixed.some(s=>s.state==='hungry'));assert.ok(mixed.some(s=>s.state==='under-attack'));
    assert.deepEqual(mixed.filter(s=>['blacksmith','armorsmith','industry'].includes(s.slot)),before);
  }
});
