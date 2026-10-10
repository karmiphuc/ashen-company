import {test} from 'node:test';
import assert from 'node:assert/strict';
import {entombedCompany} from './fixtures/entombed-company.mjs';
import {createGame,advanceRivalSimulation,getRivalCompanies,getRivalMapCompanies,getWorldTravelSpeed,getProvisionMarket,getMarket,getCompanyStats,tick,camp,validateSave,activateMapTarget,startBattle} from '../src/engine.js';
import {moveWorldToward} from '../src/world-navigation.js';
import {defaultRetinue} from '../src/retinue.js';
import {RIVAL_DEFINITIONS} from '../src/rival-companies.js';
import {rivalSidebarHTML,rivalJournalHTML} from '../src/rival-company-ui.js';
function ready(){const {state}=entombedCompany();advanceRivalSimulation(state);return state;}
function step(state,hours=.25){state.hour+=hours;if(state.hour>=24){state.day+=Math.floor(state.hour/24);state.hour%=24;}advanceRivalSimulation(state);}
function hours(state,n){for(let i=0;i<n*4;i++)step(state);}
test('three fixed endgame companies activate once at the current clock without retroactive bills or changing player progress',()=>{
 const fresh=createGame(17);advanceRivalSimulation(fresh);assert.equal(fresh.rivalCompanies,undefined);
 const {state}=entombedCompany(),before=structuredClone(state);advanceRivalSimulation(state);const saved=structuredClone(state.rivalCompanies);advanceRivalSimulation(state);assert.deepEqual(state.rivalCompanies,saved);
 assert.equal(saved.startedHour,(state.day-1)*24+state.hour);assert.deepEqual(saved.companies.map(c=>c.gold),[12000,9000,16000]);assert.deepEqual(saved.companies.map(c=>c.party.length),[6,7,8]);
 for(const company of saved.companies)for(const member of company.party){assert.equal(member.trainingPoints,0);assert.equal(member.pendingLevelUps.length,0);assert.equal(member.perks.length,0);assert.equal(member.xp,0);}
 delete state.rivalCompanies;assert.deepEqual(state,before);assert.equal(validateSave(before).rivalCompanies,undefined);
});
test('rival movement equals normal player movement with terrain, roads, mounts and night, and rest stops travel',()=>{
 for(const hour of [12,22]){
  const state=ready(),company=state.rivalCompanies.companies[2];state.hour=hour;state.rivalCompanies.lastHour=(state.day-1)*24+hour;
  company.status='travelling';company.routeIndex=1;company.targetTownId='windrest';company.restUntil=0;
  const point={...company.position},view={...state,party:company.party,position:point,retinue:defaultRetinue()};const target=(getRivalCompanies(state).find(s=>s.id==='rival:bronze-oath'));
  assert.equal(target.targetTownId,'windrest');
  const destination=awaitTown('windrest');moveWorldToward(point,destination,getWorldTravelSpeed(view)*.25);step(state);assert.deepEqual(company.position,point);
 }
 const state=ready(),before={...state.rivalCompanies.companies[0].position};hours(state,1);assert.deepEqual(state.rivalCompanies.companies[0].position,before);
});
import {SETTLEMENTS} from '../src/engine.js';
const awaitTown=id=>SETTLEMENTS.find(t=>t.id===id);
test('NPC purchases use real local prices and stock while preserving wage reserves and player treasury',()=>{
 const state=ready(),company=state.rivalCompanies.companies[0],playerGold=state.gold;company.food=0;company.ledger.provisions=18;
 const view={...state,party:company.party,position:company.position,food:0,supplies:company.supplies,retinue:defaultRetinue()};const offer=getProvisionMarket(view).food;assert.deepEqual(getProvisionMarket(view).food,getMarket(view).food);
 step(state);assert.equal(company.food,18);assert.equal(company.gold,12000-18*offer.buyPrice);assert.equal(company.ledger.foodBought,18);assert.equal(getProvisionMarket(view).food.stock,offer.stock-18);assert.equal(state.gold,playerGold);validateSave(state);
});
test('six-hour healing and repairs match ordinary camping and consume actual tools and medicine',()=>{
 const state=ready(),company=state.rivalCompanies.companies[0];company.party[0].hp=40;company.party[0].armorDurability.body=40;
 const player=createGame(87);player.party=structuredClone(company.party);player.formation=Array(36).fill(null);player.party.forEach((p,i)=>player.formation[i]=p.id);player.supplies={...company.supplies};player.food=1000;player.gold=10000;
 const expected=camp(player);assert.equal(expected.ok,true);hours(state,6);
 assert.equal(company.party[0].hp,player.party[0].hp);assert.equal(company.party[0].armorDurability.body,player.party[0].armorDurability.body);assert.deepEqual(company.supplies,player.supplies);assert.equal(company.ledger.tools,player.supplies.tools<8?8-player.supplies.tools:0);validateSave(state);
});
test('midnight bills, injury medicine and recovery survive reload and cannot repeat',()=>{
 const state=ready(),wounded=state.rivalCompanies.companies[0].party[0];wounded.injuries=[{id:'fractured-hand',acquiredDay:state.day,healingDays:0,treated:false}];hours(state,16);const company=state.rivalCompanies.companies[0];assert.equal(wounded.injuries[0].healingDays,1);assert.equal(company.ledger.medicine,1);assert.equal(company.ledger.wages,42);assert.equal(company.ledger.provisions,6);
 const reloaded=validateSave(JSON.parse(JSON.stringify(state)));advanceRivalSimulation(reloaded);assert.deepEqual(reloaded.rivalCompanies,state.rivalCompanies);hours(state,12);hours(reloaded,12);assert.deepEqual(reloaded.rivalCompanies,state.rivalCompanies);hours(state,72);hours(reloaded,72);assert.deepEqual(reloaded.rivalCompanies,state.rivalCompanies);assert.equal(reloaded.rivalCompanies.companies[0].party[0].injuries.length,0);validateSave(reloaded);
});
test('three unpaid nights dissolve the actual band without teleporting, refilling supplies or resurrecting it',()=>{
 const state=ready(),company=state.rivalCompanies.companies[0];company.gold=0;company.ledger.purchases=12000;company.food=0;company.ledger.provisions=18;
 hours(state,72);assert.equal(company.status,'dissolved');assert.equal(company.unpaidDays,3);assert.equal(company.hungryDays,3);const snapshot=structuredClone(company);hours(state,24);assert.deepEqual(company,snapshot);assert.equal(getRivalMapCompanies(state).find(s=>s.id==='rival:gilded-road').active,false);validateSave(state);
});
test('world ticks are partition independent and inspection cannot start a placeholder fight',()=>{
 const {state}=entombedCompany(),a=structuredClone(state),b=structuredClone(state);tick(a,2);for(let i=0;i<8;i++){tick(b,.1);tick(b,.15);}assert.deepEqual(a.rivalCompanies,b.rivalCompanies);assert.deepEqual(a.marketStock,b.marketStock);
 const before=structuredClone(a);assert.equal(activateMapTarget(a,'rival','rival:gilded-road').ok,true);assert.equal(startBattle(a,'rival:gilded-road').ok,false);assert.deepEqual(a,before);
 const site=getRivalCompanies(a)[0],html=rivalSidebarHTML(a,site);assert.match(html,/normal movement/);assert.match(html,/not active yet/);assert.match(rivalJournalHTML(a),/Other|OTHER BANNERS/);validateSave(a);
});
test('save validation rejects malformed ownership, clocks, resources, gear and ledger while returning isolated NPC records',()=>{
 const state=ready();const mutations=[s=>s.rivalCompanies.version=2,s=>s.rivalCompanies.lastHour-=1,s=>s.rivalCompanies.lastHour-=.1,s=>s.rivalCompanies.companies.pop(),s=>s.rivalCompanies.companies[0].id='fake',s=>s.rivalCompanies.companies[0].gold++,s=>s.rivalCompanies.companies[0].food++,s=>{s.rivalCompanies.companies[0].food++;s.rivalCompanies.companies[0].ledger.foodBought++;},s=>s.rivalCompanies.companies[0].position.x=-1,s=>s.rivalCompanies.companies[0].targetTownId='ravenfell',s=>s.rivalCompanies.companies[0].party[0].equipment.weapon='unknown',s=>s.rivalCompanies.companies[0].party[0].hp=100000,s=>s.rivalCompanies.companies[0].supplies.tools++,s=>s.rivalCompanies.companies[0].status='dissolved',s=>s.rivalCompanies.companies[0].extra=true];
 for(const mutate of mutations){const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateSave(bad));}
 const restored=validateSave(state);restored.rivalCompanies.companies[0].party[0].name='Edited';assert.notEqual(state.rivalCompanies.companies[0].party[0].name,'Edited');assert.equal(JSON.stringify(state.rivalCompanies).length<50000,true);
});
