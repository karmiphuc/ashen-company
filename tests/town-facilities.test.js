import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,getMarket,getItem,SETTLEMENT_TYPES,buyItem,sellItem,validateSave} from '../src/engine.js';
import {townFacilities,townArmoryBudget,townDesign} from '../src/town-facilities.js';
import {townFacilitiesHTML,inventoryProtectionText} from '../src/campaign-ui.js';

test('facilities are sparse, persistent and coherent; capped regional shelves rotate independently of visits',()=>{
  const distribution=new Set();
  for(let seed=1;seed<=12;seed++)for(const town of SETTLEMENTS){
    const state=createGame(seed);state.position={x:town.x,y:town.y};
    const before=structuredClone(state),market=getMarket(state),budget=townArmoryBudget(seed,town);
    assert.deepEqual(state,before,'scouting a market is read-only');
    const signature=townFacilities(seed,town).map(f=>f.id).join('|');distribution.add(signature);
    assert.equal(signature,townFacilities(seed,town).map(f=>f.id).join('|'));
    const stocked=market.equipment.filter(e=>e.stock>0&&getItem(e.itemId).slot!=='mount');
    assert.ok(stocked.length<=Object.values(budget).reduce((a,b)=>a+b,0)+6,'shipment bonus stays small');
    for(const row of stocked){const item=getItem(row.itemId);assert.ok(townDesign(item,town),`${town.name} stocks ${item.id}`);}
    if(!market.event){
      for(const [slot,limit]of Object.entries(budget))assert.ok(stocked.filter(e=>getItem(e.itemId).slot===slot).length<=limit,`${town.id}/${slot} quota`);
      assert.ok(stocked.filter(e=>getItem(e.itemId).price>=450).length<=Math.max(1,SETTLEMENT_TYPES[town.kind].premium+market.facilities.length));
    }
    assert.equal(market.armory.nextRestockDay,8);
  }
  assert.ok(distribution.has('')&&distribution.has('blacksmith')&&distribution.has('armorsmith')&&distribution.has('blacksmith|armorsmith'));
});

test('specialists expand only appropriate shelves and are visible before travelling',()=>{
  for(const town of SETTLEMENTS){
    let base=null,smith=null,armorer=null;
    for(let seed=1;seed<300&&(!base||!smith||!armorer);seed++){
      const ids=townFacilities(seed,town).map(f=>f.id).join('|'),budget=townArmoryBudget(seed,town);
      if(ids==='')base=budget;if(ids==='blacksmith')smith=budget;if(ids==='armorsmith')armorer=budget;
    }
    if(base&&smith&&armorer){assert.equal(smith.armor,base.armor);assert.ok(smith.weapon>base.weapon);assert.equal(armorer.weapon,base.weapon);assert.ok(armorer.armor>base.armor);}
  }
  const state=createGame(42);assert.match(townFacilitiesHTML(state,'ironford'),/Blacksmith/);assert.match(townFacilitiesHTML(state,'highpass'),/Armorsmith/);
});

test('purchases and sales persist within rotation; old bulky stock is reduced without losing company gear or named buybacks',()=>{
  const state=createGame(42);state.gold=100000;
  let row=getMarket(state).equipment.find(e=>e.stock>0&&getItem(e.itemId).slot==='armor');
  assert.equal(buyItem(state,row.itemId).ok,true);assert.equal(getMarket(state).equipment.find(e=>e.itemId===row.itemId).stock,row.stock-1);
  assert.deepEqual(validateSave(state),state);
  assert.equal(sellItem(state,row.itemId).ok,true);assert.equal(getMarket(state).equipment.find(e=>e.itemId===row.itemId).stock,row.stock);
  const old=structuredClone(state),inventory=[...old.inventory];delete old.marketStock.oakwatch.armoryVersion;
  for(const id of Object.keys(old.marketStock.oakwatch.equipment))old.marketStock.oakwatch.equipment[id]=9;
  old.marketStock.oakwatch.buyback=[{itemId:'famed:plate-harness:42',condition:150}];
  const restored=validateSave(old),before=structuredClone(restored),market=getMarket(restored);
  assert.deepEqual(restored,before);assert.deepEqual(restored.inventory,inventory);
  assert.ok(market.equipment.filter(e=>e.stock>0).length<50);
  assert.equal(market.equipment.find(e=>e.itemId==='famed:plate-harness:42').condition,150);
  assert.deepEqual(validateSave(restored),restored);
  assert.equal(buyItem(restored,market.equipment.find(e=>e.stock>0&&e.itemId==='patched-coat').itemId).ok,true);
  assert.equal(restored.marketStock.oakwatch.armoryVersion,1);
});

test('inventory protection grid presents both remaining durability and fatigue load',()=>{
  assert.equal(inventoryProtectionText(getItem('plate-harness'),123),'123 / 300 durability · 38 fatigue');
  assert.equal(inventoryProtectionText(getItem('cloth-hood'),null),'20 / 20 durability · 1 fatigue');
});
