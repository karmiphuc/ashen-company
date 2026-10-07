import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/engine.js';
import {contractOffersHTML,hiringHTML,huntContractHTML} from '../src/campaign-ui.js';
function take(s,category){const offer=e.getContractOffers(s,'oakwatch').find(o=>e.getContractCategory(o)===category);assert(offer);assert(e.acceptContract(s,'oakwatch',offer.id).ok);return e.getActiveContracts(s).find(c=>e.getContractCategory(c)===category);}
test('weekly notice boards cannot be rerolled by the company contract serial',()=>{
 const s=e.createGame(412),before=e.getContractOffers(s,'oakwatch');s.contractSerial=90;
 const stable=offers=>offers.map(({id,type,from,to,goodId,quantity,campId,campGeneration,reward})=>({id,type,from,to,goodId,quantity,campId,campGeneration,reward}));
 assert.deepEqual(stable(e.getContractOffers(s,'oakwatch')),stable(before));assert.equal(e.getContractBoardRefreshDay(s),8);
});
test('taking each category consumes only that town slot, without promoting replacement work',()=>{
 const s=e.createGame(412);take(s,'combat');assert(!e.getContractOffers(s,'oakwatch').some(o=>e.getContractCategory(o)==='combat'));
 take(s,'courier');take(s,'merchant');assert.equal(e.getActiveContracts(s).length,3);assert.deepEqual(e.getContractOffers(s,'oakwatch'),[]);assert.deepEqual(e.validateSave(s),s);
 const other=e.SETTLEMENTS.find(t=>t.id==='greyhaven');s.position={x:other.x,y:other.y};assert(e.getContractOffers(s,other.id).length>0);
});
test('combat completion does not refill a spent weekly board, and next week refreshes it',()=>{
 const s=e.createGame(412),c=take(s,'combat');c.rescued=true;c.defeated=true;
 if(c.campId)s.camps[c.campId]={clearedDay:s.day,generation:c.campGeneration};
 s.destination={...s.position};e.tick(s,.01);assert.equal(e.getActiveContracts(s).length,0);assert(!e.getContractOffers(s,'oakwatch').some(o=>e.getContractCategory(o)==='combat'));
 s.day=8;s.shipments={};assert(e.getContractOffers(s,'oakwatch').some(o=>e.getContractCategory(o)==='combat'));assert.equal(e.getContractBoardRefreshDay(s),15);
});
test('ready status distinguishes pending combat, return payment and loaded merchant cargo',()=>{
 const s=e.createGame(412),combat=take(s,'combat'),letter=take(s,'courier'),merchant=take(s,'merchant');assert.equal(e.isContractReady(s,combat),false);assert.equal(e.isContractReady(s,letter),false);assert.equal(e.isContractReady(s,merchant),false);
 combat.rescued=true;combat.defeated=true;if(combat.campId)s.camps[combat.campId]={clearedDay:s.day,generation:combat.campGeneration};assert.equal(e.isContractReady(s,combat),true);
 s.cargo[merchant.goodId]=merchant.quantity;assert.equal(e.isContractReady(s,merchant),true);assert.equal(e.isContractReady(s,null),false);
});
test('legacy boards migrate, while malformed saved board histories are rejected',()=>{
 const s=e.createGame(412);delete s.contractBoards;assert.deepEqual(e.validateSave(s).contractBoards,{});
 for(const boards of [{oakwatch:{week:0,used:['combat','combat']}},{oakwatch:{week:1,used:[]}},{unknown:{week:0,used:[]}},{oakwatch:{week:0,used:['unknown']}}])assert.throws(()=>e.validateSave({...s,contractBoards:boards}),/Invalid save/);
});

test('spent contract boards explain the weekly return day without affecting hiring empty states',()=>{
 const s=e.createGame(412);assert.match(contractOffersHTML(s,[]),/This week’s work is taken/);assert.match(contractOffersHTML(s,[]),/refresh on day 8/);assert.match(hiringHTML(s,[]),/All available companions have joined you/);assert.doesNotMatch(hiringHTML(s,[]),/week’s work/);
 const c=take(s,'combat');c.rescued=true;c.defeated=true;if(c.campId)s.camps[c.campId]={clearedDay:s.day,generation:c.campGeneration};assert.match(huntContractHTML(s,c),/class="primary is-ready"/);
});
