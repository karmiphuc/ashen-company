import assert from 'node:assert/strict';
import {createGame,advanceRivalSimulation,planRivalWorldCombat,tick,validateSave} from '../src/engine.js';
import {createHeadlessCombat,advanceHeadlessCombat,settleHeadlessCombat} from '../src/headless-combat.js';
import {acknowledgeRivalCombat} from '../src/rival-world-combat.js';
const results=[];
for(const seed of [12,13,14]){
 const world=createGame(seed);advanceRivalSimulation(world);planRivalWorldCombat(world);let fights=0,losses=0;
 for(let quarter=0;quarter<3*96;quarter++){
  planRivalWorldCombat(world);
  for(const reservation of world.rivalCompanies.jobs){
   if(reservation.checkpoint)continue;
   const job=createHeadlessCombat(reservation.source,reservation.companyId,reservation.encounterId);
   while(job.status==='running')advanceHeadlessCombat(job,{maxSteps:256,budgetMs:1000});settleHeadlessCombat(job);acknowledgeRivalCombat(world,reservation.companyId,job);fights++;losses+=job.receipt.losses.length;
  }
  const result=tick(world,.25);assert.equal(result?.rivalPending,undefined);assert.equal(world.battle,null);
 }
 const restored=validateSave(JSON.parse(JSON.stringify(world)));assert.deepEqual(restored.rivalCompanies,world.rivalCompanies);
 results.push({seed,days:3,fights,losses,saveBytes:Buffer.byteLength(JSON.stringify(world)),companies:world.rivalCompanies.companies.map(c=>({id:c.id,members:c.party.length,gold:c.gold,earned:c.ledger.goldEarned,food:c.food,ammo:c.supplies.ammo,levels:c.party.map(p=>p.level),perks:c.party.map(p=>p.perks.length)}))});
}
console.log(JSON.stringify(results,null,2));
