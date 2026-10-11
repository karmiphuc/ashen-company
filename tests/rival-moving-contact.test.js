import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advanceRivalSimulation,planRivalWorldCombat,getRoamingBands,validateSave,tick,SETTLEMENTS} from '../src/engine.js';
import {enableRivalCombat,acknowledgeRivalCombat} from '../src/rival-world-combat.js';
import {createHeadlessCombat,advanceHeadlessCombat,settleHeadlessCombat,restoreHeadlessCombat} from '../src/headless-combat.js';
import {nearestWorldPoint} from '../src/world-navigation.js';
for(const seed of [12,13,14])test(`seed ${seed}: six rivals choose, chase and fight moving pairs of bandits without a forced contact`,()=>{
 const probe=createGame(seed),ids=getRoamingBands(probe).filter(b=>b.difficulty===0&&b.enemies.length===2&&SETTLEMENTS.every(t=>Math.hypot(t.x-b.x,t.y-b.y)>90)).map(b=>b.id);assert.ok(ids.length);
 for(const id of ids){
  let world=createGame(seed);advanceRivalSimulation(world);enableRivalCombat(world);
  const band=getRoamingBands(world).find(b=>b.id===id),company=world.rivalCompanies.companies[0];assert.equal(company.party.length,6);
  Object.assign(company,{position:nearestWorldPoint({x:band.x+45,y:band.y}),status:'travelling',targetCampId:null});
  assert.ok(Math.hypot(company.position.x-band.x,company.position.y-band.y)>24);
  planRivalWorldCombat(world);assert.equal(company.targetCampId,id,'AI must choose the moving band itself');
  let job;
  for(let step=0;step<24&&!job;step++){tick(world,.25);job=world.rivalCompanies.jobs.find(j=>j.companyId===company.id);}
  assert.ok(job,`${id}: chase must engage instead of following all day`);assert.equal(job.encounterId,id);assert.equal(job.endHour-job.startedHour,.25);
  world=validateSave(structuredClone(world));job=world.rivalCompanies.jobs.find(j=>j.companyId===company.id);
  const combat=createHeadlessCombat(job.source,job.companyId,job.encounterId);
  while(combat.status==='running')advanceHeadlessCombat(combat,{maxSteps:256,budgetMs:1000});settleHeadlessCombat(combat);restoreHeadlessCombat(combat);
  acknowledgeRivalCombat(world,company.id,combat);tick(world,.25);validateSave(world);
  assert.ok(world.rivalCompanies.reports.some(r=>r.companyId===company.id&&r.encounterId===id));assert.equal(world.rivalCompanies.jobs.some(j=>j.companyId===company.id),false);
 }
});
