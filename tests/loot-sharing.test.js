import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getCampSites, startBattle, advanceBattle, finishBattle, getLootShareQuote, getLootKeepQuote, getNamedLootKeepQuote,
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
  assert.equal(quote.value,price*2);assert.equal(quote.xp,Math.min(500,Math.ceil(price*2/(20*quote.count))));
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
  const state=victory(),famed=createFamedItemId('plate-harness',10,1);
  state.battle.loot.items=Array(24).fill(famed);state.battle.loot.itemConditions=Array(24).fill(getItem(famed).armor);
  const fallen=state.battle.units.find(u=>u.id==='guard');fallen.alive=false;fallen.hp=0;
  const quote=getLootShareQuote(state,Array.from({length:24},(_,i)=>i));assert.equal(quote.count,2);assert.equal(quote.xp,500);assert.equal(quote.morale,15);
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

test('loot controls select copies to keep and preview the donation of all unticked items',()=>{
  const state=victory(),quote=getLootKeepQuote(state,[1]),html=battleResultsHTML(state,[1]);
  assert.match(html,/data-keep-loot="1" checked/);assert.match(html,/data-loot-index="1"/);
  assert.match(html,new RegExp(`\\+${quote.xp} XP`));assert.match(html,/Unticked items are donated/);
  assert.match(html,/aria-label="Keep selected items and donate the rest"/);assert.match(html,/Donate all/);assert.match(html,/Take all loot and continue/);
  assert.match(html,/1 kept · 2 donated/);assert.match(battleResultsHTML(state),/data-action="keep-loot"[^>]*disabled/);
  assert.match(battleResultsHTML(state),/0 kept · 3 donated/);assert.match(battleResultsHTML(state,[0,1,2]),/All items kept · no donation/);
});

test('10,000 crowns of sale value produces a 500 XP pool shared across surviving brothers',()=>{
  const state=victory(),famed=createFamedItemId('plate-harness',10,1);
  state.battle.loot.items=[...Array(11).fill(famed),'quilted-jack','goedendag'];
  state.battle.loot.itemConditions=state.battle.loot.items.map(id=>getItem(id).armor??null);
  const indices=state.battle.loot.items.map((_,i)=>i),quote=getLootShareQuote(state,indices);
  assert.equal(quote.value,10000);assert.equal(quote.xpPool,500);assert.equal(quote.count,3);assert.equal(quote.xp,167);
  assert.ok(quote.xp*quote.count>=quote.xpPool&&quote.xp*quote.count<quote.xpPool+quote.count);
  const totalXp=p=>p.xp+25*p.level*(p.level-1),before=state.party.map(p=>totalXp(p)),combat=structuredClone(state.battle.xp);
  const html=battleResultsHTML(state);assert.match(html,/500 XP pool/);assert.match(html,/Maximum 500 XP/);assert.match(html,/5% of sale value/);
  assert.equal(finishBattle(state,{shareLootIndices:indices}).ok,true);
  for(const [index,person]of state.party.entries())assert.equal(totalXp(person)-before[index],167+(combat[person.id]??0));
  validateSave(structuredClone(state));
});


test('keeping a duplicate copy donates the exact complement, preserving its durability and the quoted rewards',()=>{
  const state=victory(),before=structuredClone(state),quote=getLootKeepQuote(state,[1]);
  assert.deepEqual(quote.keepIndices,[1]);assert.deepEqual(quote.donateIndices,[0,2]);
  assert.equal(quote.value,getLootShareQuote(state,[0,2]).value);assert.deepEqual(state,before);
  assert.equal(finishBattle(state,{shareLootIndices:quote.donateIndices}).ok,true);
  assert.equal(state.inventory.filter(id=>id==='mail-shirt').length,1);assert.equal(state.inventoryCondition[state.inventory.indexOf('mail-shirt')],29);
  assert.ok(!state.inventory.includes('arming-sword'));assert.equal(state.party[0].xp,(before.battle.xp.captain??0)+quote.xp);validateSave(structuredClone(state));
});

test('Donate all uses an empty keep selection; keeping all grants no donation XP and invalid selections reject',()=>{
  const state=victory(),before=structuredClone(state),all=getLootKeepQuote(state),keep=getLootKeepQuote(state,[0,1,2]);
  assert.deepEqual(all.donateIndices,[0,1,2]);assert.deepEqual(keep.donateIndices,[]);assert.equal(keep.xp,0);assert.equal(keep.morale,0);
  for(const indices of [[0,0],[-1],[3],[.5],null,'0'])assert.equal(getLootKeepQuote(state,indices),null);
  assert.deepEqual(state,before);assert.equal(finishBattle(state,{shareLootIndices:all.donateIndices}).ok,true);
  assert.ok(!state.inventory.includes('mail-shirt'));assert.ok(!state.inventory.includes('arming-sword'));assert.equal(state.gold,before.gold+before.battle.loot.gold);validateSave(structuredClone(state));
});

test('Named shortcut keeps exact named copies and donates only the remainder',()=>{
 const state=victory(),weapon=createFamedItemId('arming-sword',42),armor=createFamedItemId('mail-shirt',13);
 state.battle.loot.items=['mail-shirt',weapon,'arming-sword',weapon,armor];state.battle.loot.itemConditions=[17,null,null,null,31];const before=structuredClone(state);
 const quote=getNamedLootKeepQuote(state);assert.deepEqual(quote.keepIndices,[1,3,4]);assert.deepEqual(quote.donateIndices,[0,2]);assert.deepEqual(state,before);
 const weapons=getNamedLootKeepQuote(state,true);assert.deepEqual(weapons.keepIndices,[1,3]);assert.deepEqual(weapons.donateIndices,[0,2,4]);
 assert.ok(finishBattle(state,{shareLootIndices:quote.donateIndices}).ok);assert.equal(state.inventory.filter(id=>id===weapon).length,2);assert.ok(state.inventory.includes(armor));assert.equal(state.inventoryCondition[state.inventory.indexOf(armor)],31);assert.deepEqual(validateSave(state),state);
});
test('Named shortcut handles all-named, no-named and non-victory loot',()=>{
 const state=victory();assert.deepEqual(getNamedLootKeepQuote(state).keepIndices,[]);assert.deepEqual(getNamedLootKeepQuote(state).donateIndices,[0,1,2]);
 state.battle.loot.items=[createFamedItemId('arming-sword',4)];state.battle.loot.itemConditions=[null];assert.deepEqual(getNamedLootKeepQuote(state).donateIndices,[]);
 state.battle.status='retreat';assert.equal(getNamedLootKeepQuote(state),null);
});
