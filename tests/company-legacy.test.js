import test from 'node:test';
import assert from 'node:assert/strict';
import { completedCompany } from './fixtures/legacy-company.mjs';
import { createGame, createLegacyCampaign, getLegacyRetirementQuote, getCompanyLegacy, turnInLegacyQuest, validateSave, SETTLEMENTS, getContractOffers, acceptContract, travelTo, tick, getCampSites, startBattle, resolveBattle, finishBattle, getItem, createFamedItemId, getStashCapacity, retreatBattle } from '../src/engine.js';
import { recordLegacyContract, recordLegacyVictory, storeLegacyRetirement } from '../src/company-legacy.js';
import { legacyJournalHTML, legacyPanelHTML, legacyRetirementHTML } from '../src/company-legacy-ui.js';
const at=(s,id)=>{const t=SETTLEMENTS.find(t=>t.id===id);s.position={x:t.x,y:t.y};s.destination=null;s.destinationAction=null;};
const reload=s=>validateSave(JSON.parse(JSON.stringify(s)));
const inherited=()=>{const source=completedCompany();const result=createLegacyCampaign(source,getLegacyRetirementQuote(source,0),91);assert.equal(result.ok,true,result.message);return result.state;};
const prepare=s=>{at(s,'oakwatch');assert.equal(turnInLegacyQuest(s,1).ok,true);at(s,'ironford');s.gold=1000;s.cargo={iron:4,timber:4};s.supplies.tools=5;assert.equal(turnInLegacyQuest(s,2).ok,true);};
function contract(s,id){at(s,id);const offer=getContractOffers(s,id).find(c=>c.type==='courier');assert.ok(offer);assert.equal(acceptContract(s,id,offer.id).ok,true);const t=SETTLEMENTS.find(t=>t.id===offer.to);s.position={x:t.x-3,y:t.y};assert.equal(travelTo(s,t.x,t.y).ok,true);assert.equal(tick(s,.1).ok,true);assert.equal(s.contract,null);}
function win(s,camp){s.position={x:camp.x,y:camp.y};s.destination=null;assert.equal(startBattle(s,camp.id).ok,true);for(const u of s.battle.units.filter(u=>u.side==='enemy')){u.hp=0;u.alive=false;}resolveBattle(s);assert.equal(s.battle.status,'victory');assert.equal(finishBattle(s).ok,true);}

test('retirement copies only one sealed identity into a fresh campaign and leaves source untouched',()=>{
 const source=completedCompany(),before=structuredClone(source),quote=getLegacyRetirementQuote(source,0),r=createLegacyCampaign(source,quote,91),baseline=createGame(91);
 assert.equal(r.ok,true);assert.deepEqual(source,before);assert.equal(r.state.companyLegacy.itemId,source.inventory[0]);assert.deepEqual(r.state.party,baseline.party);assert.deepEqual(r.state.inventory,baseline.inventory);assert.equal(r.state.gold,baseline.gold);assert.equal(r.state.ashenWinter.phase,'dormant');assert.equal(r.state.companyLegacy.stage,1);assert.deepEqual(reload(r.state),r.state);
 const stale={...quote,itemId:'spear'};assert.equal(createLegacyCampaign(source,stale).ok,false);source.inventoryCondition[0]=0;assert.equal(createLegacyCampaign(source,quote).ok,false);
});
test('retirement requires completed crisis, an open stationary settlement and a named stash item',()=>{
 const s=createGame(3);assert.equal(getLegacyRetirementQuote(s,0).ok,false);
 const ready=completedCompany();ready.destination={x:400,y:400};assert.equal(getLegacyRetirementQuote(ready,0).ok,false);ready.destination=null;ready.inventory=['spear'];ready.inventoryCondition=[null];assert.equal(getLegacyRetirementQuote(ready,0).ok,false);
 const offer=getContractOffers(ready,'oakwatch').find(c=>c.type==='courier');acceptContract(ready,'oakwatch',offer.id);assert.match(getLegacyRetirementQuote(ready,0).message,/contracts/);
});
test('four actual side quests consume materials, earn contract/battle progress and restore once',()=>{
 let s=inherited();const itemId=s.companyLegacy.itemId;
 recordLegacyContract(s,'old-job');recordLegacyVictory(s,{id:'old-fight',status:'victory',encounterType:'camp',difficulty:3});assert.equal(s.companyLegacy.contracts.length,0);
 const before=structuredClone(s);assert.equal(turnInLegacyQuest(s,2).ok,false);assert.deepEqual(s,before);
 prepare(s);assert.deepEqual(s.cargo,{});assert.equal(s.gold,500);assert.equal(s.supplies.tools,0);assert.equal(s.companyLegacy.stage,3);
 for(const id of ['oakwatch','ironford','stonebridge']){contract(s,id);s=reload(s);}
 assert.equal(s.companyLegacy.contracts.length,3);recordLegacyContract(s,s.companyLegacy.contracts[0]);assert.equal(s.companyLegacy.contracts.length,3);
 at(s,'stonebridge');assert.equal(turnInLegacyQuest(s,3).ok,true);
 const camps=getCampSites(s).filter(c=>c.difficulty>=2&&!c.cleared).slice(0,3);assert.equal(camps.length,3);
 for(const camp of camps){win(s,camp);s=reload(s);}
 assert.equal(s.companyLegacy.victories.length,3);at(s,'ironford');assert.equal(turnInLegacyQuest(s,4).ok,false);s.day=30;s.renown=150;s.shipmentLegacyThroughDay=s.day;
 assert.equal(getCompanyLegacy(s).ready,true);const n=s.inventory.length;assert.equal(turnInLegacyQuest(s,4).ok,true);assert.equal(s.inventory.at(-1),itemId);assert.equal(s.inventoryCondition.at(-1),null);assert.equal(s.inventory.length,n+1);assert.equal(turnInLegacyQuest(s,4).ok,false);assert.deepEqual(reload(s),s);assert.match(legacyPanelHTML(s),/restored to the stash/);
});
test('retreat, easy and story battles do not advance the legacy challenge',()=>{
 const s=inherited();prepare(s);for(let i=0;i<3;i++)recordLegacyContract(s,`job-${i}`);at(s,'stonebridge');turnInLegacyQuest(s,3);
 for(const [status,encounterType,difficulty] of [['retreat','camp',3],['defeat','band',3],['victory','camp',1],['victory','blacksmith',3],['victory','undead-host',3]])recordLegacyVictory(s,{id:'excluded',status,encounterType,difficulty});
 const camp=getCampSites(s).find(c=>c.difficulty>=2);s.position={x:camp.x,y:camp.y};startBattle(s,camp.id);retreatBattle(s);finishBattle(s);assert.equal(s.companyLegacy.victories.length,0);
 recordLegacyVictory(s,{id:'eligible',status:'victory',encounterType:'band',difficulty:2});recordLegacyVictory(s,{id:'eligible',status:'victory',encounterType:'band',difficulty:2});assert.equal(s.companyLegacy.victories.length,1);
});
test('failed turn-ins are atomic; restoration preserves wear and waits for stash capacity',()=>{
 const s=inherited();s.gold=99;const before=structuredClone(s);assert.equal(turnInLegacyQuest(s,1).ok,false);assert.deepEqual(s,before);s.gold=900;prepare(s);
 for(let i=0;i<3;i++)recordLegacyContract(s,`job-${i}`);at(s,'stonebridge');turnInLegacyQuest(s,3);for(let i=0;i<3;i++)recordLegacyVictory(s,{id:`battle-${i}`,status:'victory',encounterType:'camp',difficulty:2});s.day=30;s.renown=150;s.shipmentLegacyThroughDay=30;at(s,'ironford');
 s.companyLegacy.itemId=createFamedItemId('patched-coat',53,7);s.companyLegacy.condition=7;s.inventory=Array(getStashCapacity(s)).fill('spear');s.inventoryCondition=s.inventory.map(()=>null);const full=structuredClone(s);assert.equal(turnInLegacyQuest(s,4).ok,false);assert.deepEqual(s,full);s.inventory.pop();s.inventoryCondition.pop();assert.equal(turnInLegacyQuest(s,4).ok,true);assert.equal(s.inventoryCondition.at(-1),7);assert.ok(getItem(s.inventory.at(-1)).armor>7);assert.deepEqual(reload(s),s);
});
test('legacy validation rejects impossible stages, duplicate progress, invalid items and wear while old saves stay intact',()=>{
 const old=createGame(5);getCompanyLegacy(old);legacyJournalHTML(old);assert.deepEqual(reload(old),old);assert.equal(Object.hasOwn(old,'companyLegacy'),false);
 const valid=inherited();for(const mutate of [l=>l.stage=5,l=>l.itemId='spear',l=>l.condition=1,l=>l.generation=0,l=>l.contracts=['x'],l=>l.victories=['x'],l=>l.extra=true,l=>l.source.seed=-1]){const bad=structuredClone(valid);mutate(bad.companyLegacy);assert.throws(()=>validateSave(bad),/company legacy/);}
 const progressed=structuredClone(valid);prepare(progressed);progressed.companyLegacy.contracts=['x','x'];assert.throws(()=>validateSave(progressed),/company legacy/);
 const source=completedCompany(),copy=structuredClone(source);assert.match(legacyRetirementHTML(source),/day 30/);assert.deepEqual(source,copy);assert.match(legacyPanelHTML(valid),/SIDE QUEST 1\/4/);
});

test('archive and active-save write failures never replace the active company and preserve the prior backup',()=>{
 for(const failure of ['archive','active',null]){
  const values=new Map([['save','original'],['save-retired','older retirement']]);let failed=false;
  const storage={getItem:key=>values.get(key)??null,removeItem:key=>values.delete(key),setItem(key,value){if(!failed&&(failure==='archive'&&key==='save-retired'||failure==='active'&&key==='save')){failed=true;throw new Error('quota');}values.set(key,value);}};
  if(failure){assert.throws(()=>storeLegacyRetirement(storage,'save',{company:'old'},{company:'new'}),/quota/);assert.equal(values.get('save'),'original');assert.equal(values.get('save-retired'),'older retirement');}
  else{storeLegacyRetirement(storage,'save',{company:'old'},{company:'new'});assert.equal(values.get('save'),'{"company":"new"}');assert.equal(values.get('save-retired'),'{"company":"old"}');}
 }
});
