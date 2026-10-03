import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getCampSites, startBattle, advanceBattle, finishBattle, getLootShareQuote,
  getItem, getMarket, getTownEvent, SETTLEMENTS, createFamedItemId, sellItem, tick, validateSave } from '../src/engine.js';
import { battleResultsHTML } from '../src/campaign-ui.js';

function victory() {
  const state=createGame(7391),camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};startBattle(state,camp.id);
  for(const unit of state.battle.units)if(unit.side==='enemy'){unit.hp=0;unit.alive=false;}
  const actor=state.battle.units.find(u=>u.side==='company');state.battle.activeId=actor.id;state.battle.turnIndex=state.battle.turnOrder.indexOf(actor.id);
  advanceBattle(state);assert.equal(state.battle.status,'victory');
  state.battle.loot.items=['mail-shirt','mail-shirt','arming-sword'];
  state.battle.loot.itemConditions=[17,29,null];
  for(const unit of state.battle.units.filter(u=>u.side==='company'))unit.morale=90;
  return state;
}

function ordinaryMarket() {
  for(let seed=1;seed<100;seed++){
    const state=createGame(seed);state.position={x:350,y:460};
    if(!getTownEvent(state,'oakwatch'))return state;
  }
  throw Error('No normal market fixture');
}

test('ordinary resale is 20% while named prices stay at 50%, and actual sales match the quote',()=>{
  const state=ordinaryMarket(),famed=createFamedItemId('mail-shirt',10);
  state.inventory.push('mail-shirt',famed);state.inventoryCondition.push(getItem('mail-shirt').armor,getItem(famed).armor);
  const market=getMarket(state),plain=market.equipment.find(r=>r.itemId==='mail-shirt'),named=market.equipment.find(r=>r.itemId===famed);
  assert.equal(plain.sellPrice,Math.max(1,Math.floor(plain.buyPrice*.2)));
  assert.equal(named.sellPrice,Math.floor(named.buyPrice*.5));
  const gold=state.gold;sellItem(state,'mail-shirt');assert.equal(state.gold,gold+plain.sellPrice);
  const before=state.gold;sellItem(state,famed);assert.equal(state.gold,before+named.sellPrice);
  assert.ok(getMarket(state).equipment.find(r=>r.itemId===famed).buyback);
  validateSave(structuredClone(state));
});

test('equipment town events retain their previous sale rules; unrelated harvests do not exempt equipment',()=>{
  const seen=new Set();
  for(let seed=1;seed<=120&&seen.size<2;seed++){
    const state=createGame(seed),town=SETTLEMENTS.find(t=>t.id==='oakwatch');state.position={x:town.x,y:town.y};
    for(let day=1;day<=30;day++){
      state.day=day;const event=getTownEvent(state,town.id);
      if(!['militia-muster','poor-harvest'].includes(event?.type)||seen.has(event.type))continue;
      const offer=getMarket(state).equipment.find(r=>r.itemId==='mail-shirt');
      assert.equal(offer.sellPrice,Math.max(1,Math.floor(offer.buyPrice*(event.type==='poor-harvest'?.2:.5))));seen.add(event.type);
    }
  }
  assert.equal(seen.size,2);
  const delivered=createGame(2),shipment=delivered.shipments.ironford;
  Object.assign(shipment,{attackerId:null,attackerSpawnCycle:null,attackHour:null,raidCleared:true});tick(delivered,60);
  const town=SETTLEMENTS.find(t=>t.id==='ironford');delivered.position={x:town.x,y:town.y};
  assert.equal(getTownEvent(delivered,'ironford').type,'armorer-shipment');
  const offer=getMarket(delivered).equipment.find(r=>r.itemId==='mail-shirt');
  assert.equal(offer.sellPrice,Math.floor(offer.buyPrice*.5));
});

test('sharing quotes use the nearest market and add duplicate copies separately without mutating state',()=>{
  const state=victory(),before=structuredClone(state),quote=getLootShareQuote(state,[0,1]);
  const town=SETTLEMENTS.find(t=>t.id===quote.townId),marketState=structuredClone(state);marketState.position={x:town.x,y:town.y};
  const price=getMarket(marketState).equipment.find(r=>r.itemId==='mail-shirt').sellPrice;
  assert.equal(quote.value,price*2);assert.equal(quote.xp,Math.min(100,Math.ceil(price*2/(10*quote.count))));
  assert.equal(quote.morale,Math.min(15,Math.ceil(price*2/(25*quote.count))));
  assert.deepEqual(state,before);
  assert.equal(getLootShareQuote(state,[0,0]),null);
});

test('atomic sharing consumes only selected copies, preserves other conditions and resources, and cannot be claimed twice',()=>{
  const state=victory(),plain=structuredClone(state),quote=getLootShareQuote(state,[1]);
  finishBattle(plain);assert.equal(finishBattle(state,{shareLootIndices:[1]}).ok,true);
  assert.equal(state.gold,plain.gold);assert.deepEqual(state.supplies,plain.supplies);assert.equal(state.food,plain.food);
  for(const person of state.party){const original=plain.party.find(p=>p.id===person.id);
    assert.equal(person.xp,original.xp+quote.xp);assert.equal(person.morale,Math.min(100,original.morale+quote.morale));}
  assert.equal(state.inventory.filter(id=>id==='mail-shirt').length,1);
  const index=state.inventory.lastIndexOf('mail-shirt');assert.equal(state.inventoryCondition[index],17);
  assert.ok(state.inventory.includes('arming-sword'));assert.equal(state.battle,null);
  const claimed=structuredClone(state);assert.equal(finishBattle(state,{shareLootIndices:[1]}).ok,false);assert.deepEqual(state,claimed);
  assert.deepEqual(validateSave(structuredClone(state)),state);
});

test('invalid selections and non-victory sharing reject before changing any state',()=>{
  for(const indices of [[-1],[3],[.5],[0,0],null,'0']){
    const state=victory(),before=structuredClone(state);
    assert.equal(finishBattle(state,{shareLootIndices:indices}).ok,false);assert.deepEqual(state,before);
  }
  for(const status of ['active','retreat','defeat']){
    const state=victory();state.battle.status=status;const before=structuredClone(state);
    assert.equal(finishBattle(state,{shareLootIndices:[0]}).ok,false);assert.deepEqual(state,before);
  }
});

test('large shares cap XP/morale and normal level-ups work; fallen and allied fighters receive no reward',()=>{
  const state=victory(),famed=createFamedItemId('plate-harness',10);
  state.battle.loot.items=Array(24).fill(famed);state.battle.loot.itemConditions=Array(24).fill(getItem(famed).armor);
  const fallen=state.battle.units.find(u=>u.id==='guard');fallen.alive=false;fallen.hp=0;
  const quote=getLootShareQuote(state,Array.from({length:24},(_,i)=>i));assert.equal(quote.count,2);assert.equal(quote.xp,100);assert.equal(quote.morale,15);
  const captain=state.party[0];captain.xp=49;
  assert.equal(finishBattle(state,{shareLootIndices:Array.from({length:24},(_,i)=>i)}).ok,true);
  assert.ok(!state.party.some(p=>p.id==='guard'));assert.equal(state.party[0].morale,100);
  assert.ok(state.party[0].level>1);assert.ok(state.party[0].pendingLevelUps.length>0);
  assert.equal(state.inventory.filter(id=>id===famed).length,0);
  validateSave(structuredClone(state));
});

test('sharing works with a full stash and saved result screens quote and resolve identically',()=>{
  const state=victory();state.inventory=Array(512).fill('spear');state.inventoryCondition=Array(512).fill(null);
  const restored=validateSave(structuredClone(state));assert.deepEqual(getLootShareQuote(restored,[0,1]),getLootShareQuote(state,[0,1]));
  finishBattle(state,{shareLootIndices:[0,1]});finishBattle(restored,{shareLootIndices:[0,1]});
  assert.deepEqual(restored,state);assert.equal(state.inventory.length,512);
});

test('loot controls distinguish selection from inspecting, show live rewards, and default to keeping everything',()=>{
  const state=victory(),quote=getLootShareQuote(state,[1]),html=battleResultsHTML(state,[1]);
  assert.match(html,/data-share-loot="1" checked/);assert.match(html,/data-loot-index="1"/);
  assert.match(html,new RegExp(`\\+${quote.xp} XP`));assert.match(html,/Shared items are consumed/);
  assert.match(html,/Share selected &amp; take the rest/);assert.match(html,/Take all loot and continue/);
  assert.match(battleResultsHTML(state),/data-action="share-loot" disabled/);
});
