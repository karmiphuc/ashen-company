import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advanceRivalSimulation,planRivalWorldCombat,getCampSites,validateSave,tick,camp,startBattle,advanceBattle,finishBattle,getRivalCompanies} from '../src/engine.js';
import {createHeadlessCombat,advanceHeadlessCombat,settleHeadlessCombat} from '../src/headless-combat.js';
import {acknowledgeRivalCombat,rivalCombatBarrier,enableRivalCombat} from '../src/rival-world-combat.js';
function scene(seed=12){const world=createGame(seed);advanceRivalSimulation(world);enableRivalCombat(world);const camp=getCampSites(world).find(c=>c.difficulty===1);const company=world.rivalCompanies.companies[0];company.position={x:camp.x,y:camp.y};company.status='travelling';company.targetCampId=camp.id;planRivalWorldCombat(world);return {world,company,camp,job:world.rivalCompanies.jobs[0]};}
function resolve(job){const combat=createHeadlessCombat(job.source,job.companyId,job.encounterId);while(combat.status==='running')advanceHeadlessCombat(combat,{maxSteps:256,budgetMs:1000});settleHeadlessCombat(combat);return combat;}
function advance(world,n){const result=tick(world,n);assert.equal(result?.rivalPending,undefined);}
test('physical daylight contact reserves exactly one real camp and protects player contracts and player attacks',()=>{
 const {world,company,camp:site,job}=scene();assert.ok(job);assert.equal(job.endHour-job.startedHour,6);assert.equal(job.source.rivalCompanies.jobs.length,0);assert.equal(startBattle({...world,position:{x:site.x,y:site.y}},site.id).ok,false);assert.match(getRivalCompanies(world)[0].activity,/Fighting/);validateSave(world);
 const before=structuredClone(world);planRivalWorldCombat(world);assert.deepEqual(world,before);
 const reserved=createGame(12);advanceRivalSimulation(reserved);enableRivalCombat(reserved);const rival=reserved.rivalCompanies.companies[0];rival.position={x:site.x,y:site.y};rival.status='travelling';rival.targetCampId=site.id;reserved.contract={id:'delivery-1',type:'hunt',from:'oakwatch',to:'oakwatch',reward:100,renown:1,campId:site.id,campGeneration:site.generation,acceptedDay:1};reserved.contractSerial=1;planRivalWorldCombat(reserved);assert.equal(reserved.rivalCompanies.jobs.length,0);assert.equal(rival.targetCampId,null);validateSave(reserved);
 const night=createGame(12);night.hour=22;advanceRivalSimulation(night);enableRivalCombat(night);Object.assign(night.rivalCompanies.companies[0],{position:{x:site.x,y:site.y},status:'travelling',targetCampId:site.id});planRivalWorldCombat(night);assert.equal(night.rivalCompanies.jobs.length,0);validateSave(night);
});
test('real victory commits survivor XP, stats, perks, ammo, wear and loot once at a fixed campaign deadline',()=>{
 const {world,company,job}=scene(),player=structuredClone(world.party),gold=world.gold,combat=resolve(job),receipt=structuredClone(combat.receipt);
 acknowledgeRivalCombat(world,company.id,combat);validateSave(world);advance(world,5.75);assert.equal(company.gold,12000);assert.equal(world.rivalCompanies.jobs.length,1);advance(world,.25);
 assert.equal(world.rivalCompanies.jobs.length,0);assert.equal(company.gold,receipt.gold);assert.deepEqual(company.party,receipt.party);assert.deepEqual(company.inventory,receipt.inventory);assert.deepEqual(company.supplies,receipt.supplies);assert.equal(company.ledger.goldEarned,receipt.gold-12000);assert.equal(world.camps[job.encounterId].clearedDay,1);assert.equal(company.status,'resting');assert.equal(company.restUntil,20);assert.deepEqual(world.party,player);assert.equal(world.gold,gold);validateSave(world);
 const after=structuredClone(company);assert.equal(acknowledgeRivalCombat(world,company.id,combat),false);advanceRivalSimulation(world);assert.deepEqual(company,after);assert.equal(world.rivalCompanies.reports.length,1);
});
test('worker completion speed does not change world results, and unresolved deadlines never consume extra world time or camp rewards',()=>{
 const early=scene(),late=scene(),combat=resolve(early.job);acknowledgeRivalCombat(early.world,early.company.id,structuredClone(combat));advance(early.world,6);
 const campBefore=structuredClone(late.world);assert.equal(camp(late.world).rivalPending,true);assert.deepEqual(late.world,campBefore);
 const waiting=tick(late.world,6);assert.equal(waiting.rivalPending,true);assert.equal(late.world.hour,13.75);assert.equal(late.world.rivalCompanies.jobs.length,1);validateSave(late.world);
 acknowledgeRivalCombat(late.world,late.company.id,structuredClone(combat));advance(late.world,.25);assert.deepEqual(late.world.rivalCompanies,early.world.rivalCompanies);assert.deepEqual(late.world.camps,early.world.camps);assert.deepEqual(late.world.worldLosses,early.world.worldLosses);
});
test('running and settled reservations reload unchanged and malformed combat ownership or clocks are rejected',()=>{
 const {world,company,job}=scene();const combat=createHeadlessCombat(job.source,company.id,job.encounterId);advanceHeadlessCombat(combat,{maxSteps:3,budgetMs:1000});acknowledgeRivalCombat(world,company.id,combat);const restored=validateSave(JSON.parse(JSON.stringify(world)));assert.deepEqual(restored.rivalCompanies,world.rivalCompanies);
 for(const mutate of [w=>w.rivalCompanies.jobs[0].endHour++,w=>w.rivalCompanies.jobs[0].companyId='bronze-oath',w=>w.rivalCompanies.jobs[0].source.rivalCompanies.jobs=[{}],w=>w.rivalCompanies.companies[0].party[0].hp--,w=>w.rivalCompanies.companies[0].ledger.goldEarned++,w=>w.rivalCompanies.jobs.push(structuredClone(w.rivalCompanies.jobs[0]))]){const bad=structuredClone(world);mutate(bad);assert.throws(()=>validateSave(bad));}
});
test('partial hours claim the last shared quarter-hour, without creating an invalid save clock',()=>{
 const {world}=scene();world.rivalCompanies.jobs=[];world.rivalCompanies.companies[0].lastHuntDay=0;world.hour=8.1;planRivalWorldCombat(world);assert.equal(world.rivalCompanies.jobs[0].startedHour,8);validateSave(world);
});
test('a real defeat persists dead rivals and surviving enemy wear without replacement troops or phantom rewards',()=>{
 const world=createGame(14);world.day=80;world.shipments={};world.shipmentLegacyThroughDay=80;world.party.forEach(p=>p.level=20);advanceRivalSimulation(world);enableRivalCombat(world);
 const company=world.rivalCompanies.companies[2],site=getCampSites(world).find(c=>c.difficulty===3);Object.assign(company,{position:{x:site.x,y:site.y},status:'travelling',targetCampId:site.id});planRivalWorldCombat(world);
 const job=world.rivalCompanies.jobs[0],combat=resolve(job);assert.equal(combat.receipt.outcome,'defeat');acknowledgeRivalCombat(world,company.id,combat);advance(world,6);
 assert.equal(company.status,'dissolved');assert.equal(company.party.length,0);assert.equal(company.ledger.goldEarned,0);assert.equal(company.inventory.length,0);assert.equal(world.camps[site.id],undefined);assert.ok(world.rivalCompanies.campWear[site.id].units.length);validateSave(world);
 const reload=validateSave(JSON.parse(JSON.stringify(world)));assert.deepEqual(reload.rivalCompanies.campWear,world.rivalCompanies.campWear);
 const worn=getCampSites(world).find(c=>c.id===site.id);assert.ok(worn.enemies.some(e=>e.savedDamage));const player=structuredClone(world);player.position={x:site.x,y:site.y};assert.equal(startBattle(player,site.id).ok,true);validateSave(player);
});
test('legacy rival migration preserves all resources, progress and insolvency',()=>{
 const world=createGame(18);advanceRivalSimulation(world);world.rivalCompanies.companies[0].supplies.ammo=17;const before=structuredClone(world.rivalCompanies);enableRivalCombat(world);const migrated=validateSave(world).rivalCompanies;
 for(let i=0;i<3;i++){const company=migrated.companies[i];for(const key of ['party','position','gold','food','supplies','inventory','status'])assert.deepEqual(company[key],before.companies[i][key]);assert.equal(company.ledger.goldEarned,0);}
 assert.deepEqual(migrated.jobs,[]);assert.deepEqual(migrated.reports,[]);
});

test('live camp routing is independent of world tick batching',()=>{
 const a=createGame(19);advanceRivalSimulation(a);enableRivalCombat(a);const b=structuredClone(a);tick(a,7);for(let i=0;i<28;i++)tick(b,.25);assert.deepEqual(a.rivalCompanies,b.rivalCompanies);assert.ok(a.rivalCompanies.companies.some(c=>c.targetCampId));validateSave(a);validateSave(b);
});
