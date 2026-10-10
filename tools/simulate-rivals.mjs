import {performance} from 'node:perf_hooks';
import {completedCompany} from '../tests/fixtures/legacy-company.mjs';
import {advanceRivalSimulation,validateSave} from '../src/engine.js';
const reports=[];
for(const offset of [0,1,2]){
 const state=completedCompany(719+offset);advanceRivalSimulation(state);
 const times=[],start=performance.now();
 for(let quarter=1;quarter<=90*96;quarter++){
  state.hour+=.25;if(state.hour>=24){state.day++;state.hour=0;}
  const before=performance.now();advanceRivalSimulation(state);times.push(performance.now()-before);
  if(quarter===30*96||quarter===90*96){validateSave(state);reports.push({seed:state.seed,days:quarter/96,companies:state.rivalCompanies.companies.map(c=>({id:c.id,gold:c.gold,food:c.food,unpaidDays:c.unpaidDays,hungryDays:c.hungryDays,status:c.status,levels:c.party.map(p=>p.level),contracts:0,namedAcquisitions:0,losses:0,ledger:c.ledger})),saveBytes:JSON.stringify(state.rivalCompanies).length});}
 }
 times.sort((a,b)=>a-b);reports.push({seed:state.seed,simulationMs:performance.now()-start,p95StepMs:times[Math.floor(times.length*.95)],maxStepMs:times.at(-1),steps:times.length});
}
console.log(JSON.stringify(reports,null,2));
