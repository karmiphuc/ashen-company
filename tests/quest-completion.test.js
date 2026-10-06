import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getContractOffers,acceptContract,getActiveContracts,getContractCategory,tick,SETTLEMENTS,validateSave,buyGood,checkBlacksmithDiscovery,createFamedItemId,acceptBlacksmithQuest,turnInBlacksmithQuest} from '../src/engine.js';
import {consumeQuestCompletions} from '../src/quest-completion.js';
function take(s,category){const o=getContractOffers(s,'oakwatch').find(o=>getContractCategory(o)===category);assert(acceptContract(s,'oakwatch',o.id).ok);return getActiveContracts(s).find(c=>getContractCategory(c)===category);}
function arrive(s,c){const t=SETTLEMENTS.find(t=>t.id===c.to);s.position={x:t.x,y:t.y};s.destination={...s.position};tick(s,.01);}

test('each paid category emits once, never on acceptance, readiness or reload',()=>{
 for(const category of ['courier','merchant','combat']){
  const s=createGame(412),c=take(s,category);assert.deepEqual(consumeQuestCompletions(s),[]);
  if(category==='merchant')s.cargo[c.goodId]=c.quantity;
  if(category==='combat'){c.rescued=true;c.defeated=true;if(c.campId)s.camps[c.campId]={clearedDay:s.day,generation:c.campGeneration};}
  assert.deepEqual(consumeQuestCompletions(s),[]);arrive(s,c);
  const restored=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(consumeQuestCompletions(restored),[]);
  assert.deepEqual(consumeQuestCompletions(s),[c.id]);assert.deepEqual(consumeQuestCompletions(s),[]);
  tick(s,.01);assert.deepEqual(consumeQuestCompletions(s),[]);
 }
});

test('buying final merchant cargo emits payment, while failed purchase emits nothing',()=>{
 const s=createGame(412),c=take(s,'merchant'),t=SETTLEMENTS.find(t=>t.id===c.to);s.position={x:t.x,y:t.y};s.cargo[c.goodId]=c.quantity-1;s.gold=0;
 assert.equal(buyGood(s,c.goodId,1).ok,false);assert.deepEqual(consumeQuestCompletions(s),[]);
 s.gold=100000;assert(buyGood(s,c.goodId,1).ok);assert.deepEqual(consumeQuestCompletions(s),[c.id]);
});

test('Odran turn-in emits once and unsuccessful or duplicate turn-ins stay silent',()=>{
 const s=createGame(19);s.inventory.push(...Array.from({length:5},(_,i)=>createFamedItemId('arming-sword',i+1)));checkBlacksmithDiscovery(s);s.position={x:745,y:400};assert(acceptBlacksmithQuest(s,1).ok);
 assert.equal(turnInBlacksmithQuest(s,1).ok,false);assert.deepEqual(consumeQuestCompletions(s),[]);
 s.cargo={iron:8,timber:6};s.supplies.tools=10;assert(turnInBlacksmithQuest(s,1).ok);assert.deepEqual(consumeQuestCompletions(s),['blacksmith-1']);
 assert.equal(turnInBlacksmithQuest(s,1).ok,false);assert.deepEqual(consumeQuestCompletions(s),[]);
});
