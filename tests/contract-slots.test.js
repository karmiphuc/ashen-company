import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,acceptContract,getActiveContracts,getContractCategory,getContractTarget,getQuestEncounter,validateSave,buyGood,tick,SETTLEMENTS} from '../src/engine.js';
import {findOffer} from './helpers/contract-offers.js';
function accept(state,type){const offer=findOffer(state,type);assert.equal(acceptContract(state,'oakwatch',offer.id).ok,true);return getActiveContracts(state).find(c=>c.type===type);}
for(const order of [['courier','supply','rescue'],['rescue','supply','courier'],['supply','hunt','courier']])test(`independent slots and save roundtrip: ${order}`,()=>{
 const s=createGame(412);for(const type of order)accept(s,type);
 assert.equal(getActiveContracts(s).length,3);assert.equal(getContractCategory(s.contract),'combat');
 assert.deepEqual(validateSave(s),s);
 const before=structuredClone(s);for(const type of order){const offer=findOffer(s,type);const serial=s.contractSerial;assert.equal(acceptContract(s,'oakwatch',offer.id).ok,false);assert.equal(s.contractSerial,serial);}
 assert.deepEqual(getActiveContracts(s),getActiveContracts(before));
 assert(getContractTarget(s));if(s.contract.type==='rescue')assert.equal(getQuestEncounter(s).id,s.contract.rescueId);
});
test('delivery payments remove only their own slots, preserving combat',()=>{
 const s=createGame(412),courier=accept(s,'courier'),supply=accept(s,'supply');accept(s,'rescue');const combatId=s.contract.id;
 s.cargo[supply.goodId]=supply.quantity;s.gold=100000;
 for(const c of [courier,supply]){const town=SETTLEMENTS.find(t=>t.id===c.to);s.position={x:town.x,y:town.y};s.destination={x:town.x,y:town.y};assert.equal(tick(s,.01).ok,true);assert(!getActiveContracts(s).some(q=>q.id===c.id));assert.equal(s.contract.id,combatId);}
 assert.equal(getActiveContracts(s).length,1);assert.deepEqual(validateSave(s),s);
});
test('legacy single contract loads and malformed or duplicate slots are rejected',()=>{
 const s=createGame(412);accept(s,'courier');delete s.additionalContracts;assert.equal(validateSave(s).additionalContracts.length,0);
 const dup=structuredClone(s);dup.additionalContracts=[structuredClone(s.contract)];assert.throws(()=>validateSave(dup),/Invalid save/);
 const malformed=structuredClone(s);malformed.additionalContracts=[null];assert.throws(()=>validateSave(malformed),/Invalid save/);
});

test('combat payment preserves deliveries and a later weekly board can supply new combat work',()=>{
 const s=createGame(412);accept(s,'courier');accept(s,'supply');const rescue=accept(s,'rescue');rescue.rescued=true;
 const issuer=SETTLEMENTS.find(t=>t.id===rescue.to);s.position={x:issuer.x,y:issuer.y};s.destination={...s.position};tick(s,.01);
 assert.equal(getActiveContracts(s).length,2);assert(!getActiveContracts(s).some(c=>c.id===rescue.id));accept(s,'hunt');assert.deepEqual(validateSave(s),s);
});
test('buying the final cargo at its destination completes the merchant slot',()=>{
 const s=createGame(412);accept(s,'courier');const supply=accept(s,'supply');accept(s,'rescue');s.gold=100000;
 const destination=SETTLEMENTS.find(t=>t.id===supply.to);s.position={x:destination.x,y:destination.y};
 s.cargo[supply.goodId]=supply.quantity-1;assert.equal(buyGood(s,supply.goodId,1).ok,true);assert(!getActiveContracts(s).some(c=>c.id===supply.id));assert.equal(getActiveContracts(s).length,2);assert.equal(s.contract.type,'rescue');assert.deepEqual(validateSave(s),s);
});
