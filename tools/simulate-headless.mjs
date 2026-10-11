import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {createGame,advanceRivalSimulation,getCampSites} from '../src/engine.js';
import {createHeadlessCombat,restoreHeadlessCombat,advanceHeadlessCombat,settleHeadlessCombat} from '../src/headless-combat.js';
const results=[];
for(const [seed,companyId,day,level,difficulty] of [[12,'gilded-road',1,1,1],[13,'red-jackals',45,12,2],[14,'bronze-oath',80,20,3]]){
 const world=createGame(seed);world.day=day;world.shipments={};world.shipmentLegacyThroughDay=day;
 for(const member of world.party)member.level=level;
 advanceRivalSimulation(world);const camp=getCampSites(world).find(c=>c.difficulty===difficulty&&!c.cleared);
 const owner=world.rivalCompanies.companies.find(c=>c.id===companyId);owner.position={x:camp.x,y:camp.y};
 const prepared=performance.now(),job=createHeadlessCombat(world,companyId,camp.id),preparationMs=performance.now()-prepared;
 const bytes=Buffer.byteLength(JSON.stringify(job)),timings=[];
 while(job.status==='running')timings.push(advanceHeadlessCombat(job,{maxSteps:1,budgetMs:4}).maxActionMs);
 const receipt=settleHeadlessCombat(job),restored=restoreHeadlessCombat(JSON.parse(JSON.stringify(job)));
 assert.deepEqual(restored.receipt,receipt,'Reload settlement mismatch');
 const sorted=[...timings].sort((a,b)=>a-b),percentile=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
 results.push({seed,companyId,day,difficulty,enemyCount:job.state.battle.units.filter(u=>u.side==='enemy').length,
  outcome:receipt.outcome,steps:job.steps,rounds:job.state.battle.round,losses:receipt.losses.length,
  survivors:receipt.party.length,gold:receipt.gold,ammo:receipt.supplies.ammo,items:receipt.inventory.length,
  snapshotBytes:bytes,preparationMs:+preparationMs.toFixed(2),p95ActionMs:+percentile(.95).toFixed(2),maxActionMs:+sorted.at(-1).toFixed(2)});
}
console.log(JSON.stringify(results,null,2));
