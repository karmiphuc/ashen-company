import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/engine.js';
import {retinueHTML,companySheetHTML} from '../src/campaign-ui.js';
const game=()=>{const s=e.createGame(7391);e.buyFood(s,1);s.gold=30000;return s;};
const fill=(s,n)=>{s.inventory=Array(n).fill('bandages');s.inventoryCondition=Array(n).fill(null);};

test('cart and one upgrade charge exact costs and use original capacities',()=>{
 const s=game();assert.equal(e.getStashCapacity(s),512);assert.equal(e.getCargoCapacity(s),30);
 assert.equal(e.buyCompanyCart(s).ok,true);assert.equal(s.gold,22500);assert.equal(e.getStashCapacity(s),1024);assert.equal(e.getCargoCapacity(s),60);assert.equal(e.getCompanyTravelMultiplier(s),.95);
 assert.equal(e.buyCompanyCart(s).ok,true);assert.equal(s.gold,7500);assert.equal(e.getStashCapacity(s),1536);assert.equal(e.getCargoCapacity(s),90);assert.equal(e.getCompanyTravelMultiplier(s),1);
 const before=structuredClone(s);assert.equal(e.buyCompanyCart(s).ok,false);assert.deepEqual(s,before);
});
test('unaffordable, travelling, battle and game-over purchases do not mutate state',()=>{
 for(const setup of [s=>s.gold=7499,s=>s.position={x:100,y:100},s=>s.battle={},s=>s.gameOver=true]){const s=game();setup(s);const before=structuredClone(s);assert.equal(e.buyCompanyCart(s).ok,false);assert.deepEqual(s,before);}
 const s=game();e.buyCompanyCart(s);s.gold=14999;const before=structuredClone(s);assert.equal(e.buyCompanyCart(s).ok,false);assert.deepEqual(s,before);
});
test('cart saves preserve full upgraded storage and older saves restore without a cart',()=>{
 for(const level of [0,1,2]){const s=game();for(let i=0;i<level;i++)e.buyCompanyCart(s);fill(s,e.getStashCapacity(s));s.cargo={timber:e.getCargoCapacity(s)};assert.deepEqual(e.validateSave(structuredClone(s)),s);
 const extra=structuredClone(s);extra.inventory.push('bandages');extra.inventoryCondition.push(null);assert.throws(()=>e.validateSave(extra),/inventory/);const cargo=structuredClone(s);cargo.cargo.grain=1;assert.throws(()=>e.validateSave(cargo),/cargo/);}
 const old=game();delete old.retinue.cartLevel;assert.equal(e.validateSave(old).retinue.cartLevel,0);delete old.retinue;assert.equal(e.validateSave(old).retinue.cartLevel,0);
 for(const bad of [-1,3,1.5,'1',null]){const s=game();s.retinue.cartLevel=bad;assert.throws(()=>e.validateSave(s),/retinue/);}
});
test('equipment purchasing and stowing use expanded capacity without overflowing',()=>{
 const s=game();e.buyCompanyCart(s);fill(s,1023);e.getMarket(s);s.marketStock.oakwatch.equipment.bandages=3;
 assert.equal(e.getPurchaseQuote(s,'equipment','bandages').quantity,1);assert.equal(e.buyAll(s,'equipment','bandages').ok,true);assert.equal(s.inventory.length,1024);
 const before=structuredClone(s);assert.equal(e.buyItem(s,'bandages').ok,false);assert.deepEqual(s,before);assert.equal(e.unequipItem(s,s.party[0].id,'weapon').ok,false);
 s.inventory.pop();s.inventoryCondition.pop();assert.equal(e.unequipItem(s,s.party[0].id,'weapon').ok,true);assert.equal(s.inventory.length,1024);e.validateSave(structuredClone(s));
});
test('cargo quotes, bulk purchases and sales support each expanded cap',()=>{
 for(const level of [1,2]){const s=game();for(let i=0;i<level;i++)e.buyCompanyCart(s);e.getMarket(s);const cap=e.getCargoCapacity(s);s.marketStock.oakwatch.goods.timber=cap;s.cargo={grain:1};assert.equal(e.getPurchaseQuote(s,'goods','timber').quantity,cap-1);assert.equal(e.buyAll(s,'goods','timber').ok,true);assert.equal(s.cargo.timber,cap-1);
 const before=structuredClone(s);assert.equal(e.buyGood(s,'timber').ok,false);assert.deepEqual(s,before);assert.equal(e.sellGood(s,'timber',cap-1).ok,true);assert.equal(s.cargo.timber,undefined);e.validateSave(structuredClone(s));}
});
test('speed penalty multiplies mount bonuses and is removed by the upgrade',()=>{
 const s=game();s.party[0].equipment.mount='riding-horse';const base=1+e.getCompanyTravelBonus(s);assert(base>1);e.buyCompanyCart(s);assert.equal(e.getCompanyTravelMultiplier(s),base*.95);e.buyCompanyCart(s);assert.equal(e.getCompanyTravelMultiplier(s),base);
});
test('battle loot is retained beyond the original stash limit with a cart',()=>{
 const s=game();e.buyCompanyCart(s);fill(s,512);const c=e.getCampSites(s)[0];s.position={x:c.x,y:c.y};e.startBattle(s,c.id);for(const u of s.battle.units)if(u.side==='enemy'){u.hp=0;u.alive=false;}const a=s.battle.units.find(u=>u.side==='company');s.battle.activeId=a.id;s.battle.turnIndex=s.battle.turnOrder.indexOf(a.id);e.advanceBattle(s);s.battle.loot.items=['bandages'];s.battle.loot.itemConditions=[null];assert.equal(e.finishBattle(s).ok,true);assert(s.inventory.length>512);e.validateSave(structuredClone(s));
});
test('retinue exposes purchase, upgrade and completion while stash shows its cap',()=>{
 const s=game();assert.match(retinueHTML(s),/Buy cart.*7,500/);e.buyCompanyCart(s);assert.match(retinueHTML(s),/Upgrade cart.*15,000/);assert.match(companySheetHTML(s,s.party[0],'all',''),/\/ 1024 items/);e.buyCompanyCart(s);assert.match(retinueHTML(s),/Fully upgraded/);assert.doesNotMatch(retinueHTML(s),/data-action="buy-company-cart"/);
});

test('world movement uses the cart penalty and upgrade restores baseline distance',()=>{
 const distances=[];
 for(const level of [0,1,2]){const s=game();for(let i=0;i<level;i++)e.buyCompanyCart(s);for(const band of Object.values(s.bands))band.defeatedUntil=48;const origin={...s.position};assert.equal(e.travelTo(s,origin.x+100,origin.y).ok,true);e.tick(s,.25);distances.push(Math.hypot(s.position.x-origin.x,s.position.y-origin.y));}
 assert(distances[0]>0);assert(Math.abs(distances[1]/distances[0]-.95)<1e-8);assert(Math.abs(distances[2]-distances[0])<1e-8);
});
