import { createRivalBattleSnapshot, validateRivalBattleSnapshot, validateSave, getCampSites, advanceBattle, retreatBattle, finishBattle, trainRivalSurvivors } from './engine.js';

export const HEADLESS_RULES_VERSION = 2;
export const HEADLESS_MAX_STEPS = 20000;
export const HEADLESS_MAX_BYTES = 8 * 1024 * 1024;
const fields=['version','companyId','encounterId','steps','status','state','world','enemyWorldIndices','receipt'];
const clock=()=>globalThis.performance?.now?.()??Date.now();
const fail=message=>{throw new TypeError(`Invalid headless combat: ${message}`);};
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));return value;}
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const size=value=>new TextEncoder().encode(JSON.stringify(value)).byteLength;

export function createHeadlessCombat(world,companyId,encounterId){
 const snapshot=createRivalBattleSnapshot(world,companyId,encounterId);
 const job={version:HEADLESS_RULES_VERSION,companyId,encounterId,steps:0,status:'running',...snapshot,receipt:null};
 if(size(job)>HEADLESS_MAX_BYTES)fail('snapshot exceeds size limit');
 return job;
}

// CPU budgets decide when to yield, never who wins. A shared engine action is
// atomic and may overrun the soft budget; queued work resumes unchanged.
export function advanceHeadlessCombat(job,{maxSteps=1,budgetMs=4,now=clock}={}){
 if(!Number.isSafeInteger(maxSteps)||maxSteps<0||maxSteps>256||!Number.isFinite(budgetMs)||budgetMs<0||budgetMs>1000||typeof now!=='function')fail('slice options');
 const start=now();let completed=0,maxActionMs=0;
 while(job.status==='running'&&completed<maxSteps&&now()-start<budgetMs){
  const before=now();
  if(job.steps>=HEADLESS_MAX_STEPS||job.state.battle.round>=1000)retreatBattle(job.state);
  else{const result=advanceBattle(job.state);if(!result.ok)fail(result.message);job.steps++;}
  maxActionMs=Math.max(maxActionMs,now()-before);completed++;
  if(job.state.battle.status!=='active')job.status='ready';
 }
 return {completed,maxActionMs,pending:job.status==='running'};
}

export function advanceHeadlessQueue(jobs,cursor=0,options={}){
 if(!Array.isArray(jobs)||jobs.length>3||!Number.isSafeInteger(cursor)||cursor<0)fail('queue');
 if(!jobs.length)return {cursor:0,completed:0,maxActionMs:0};
 let next=cursor%jobs.length;
 for(let visited=0;visited<jobs.length;visited++){
  const index=next;next=(next+1)%jobs.length;
  if(jobs[index].status==='running')return {cursor:next,...advanceHeadlessCombat(jobs[index],options)};
 }
 return {cursor:next,completed:0,maxActionMs:0};
}

function outcome(job){
 const state=structuredClone(job.state),battle=state.battle;
 const result=finishBattle(state);if(!result.ok)fail(result.message);
 if(job.version>=2)trainRivalSurvivors(state);
 return {companyId:job.companyId,encounterId:job.encounterId,battleId:battle.id,generation:battle.campGeneration,
  outcome:battle.status,enemies:battle.units.filter(unit=>unit.side==='enemy').map((unit,index)=>({worldIndex:job.enemyWorldIndices[index],unit:structuredClone(unit)})),losses:[...battle.casualties],xp:structuredClone(battle.xp),
  party:state.party,gold:state.gold,food:state.food,supplies:state.supplies,
  inventory:state.inventory,inventoryCondition:state.inventoryCondition,cargo:state.cargo,
  campRecord:structuredClone(state.camps[job.encounterId]??null)};
}

// The terminal battle remains as the settlement audit. The future world
// transaction consumes this receipt once; retries here do not replay costs.
export function settleHeadlessCombat(job){
 if(job.status==='running')fail('battle is still running');
 if(!['ready','settled'].includes(job.status))fail('settlement status');
 if(job.status==='ready'){const receipt=outcome(job);if(size({...job,receipt,status:'settled'})>HEADLESS_MAX_BYTES)fail('settled snapshot exceeds size limit');job.receipt=receipt;job.status='settled';}
 return structuredClone(job.receipt);
}

export function restoreHeadlessCombat(input){
 if(!exact(input,fields)||![1,HEADLESS_RULES_VERSION].includes(input.version)||size(input)>HEADLESS_MAX_BYTES)fail('version/fields/size');
 if(!Number.isSafeInteger(input.steps)||input.steps<0||input.steps>HEADLESS_MAX_STEPS||!['running','ready','settled'].includes(input.status))fail('progress');
 const world=validateSave(structuredClone(input.world)),owner=world.rivalCompanies?.companies.find(c=>c.id===input.companyId);
 if(!owner||owner.status==='dissolved')fail('owner');
 const state=validateRivalBattleSnapshot(input.state,world);
 const indices=getCampSites(world).find(c=>c.id===input.encounterId)?.enemies.map((enemy,index)=>enemy.worldIndex??enemy.troopIndex??index);
 if(!same(indices,input.enemyWorldIndices))fail('enemy world identities');
 if(state.battle.campId!==input.encounterId||state.party.length!==owner.party.length||state.party.some((p,i)=>p.id!==owner.party[i].id))fail('participants');
 if(world.battle||!same(state.position,owner.position)||state.gold!==owner.gold
   ||state.food!==Math.max(0,owner.food-(state.battle.status==='retreat'?2:0))
   ||state.supplies.tools!==owner.supplies.tools||state.supplies.medicine!==owner.supplies.medicine
   ||state.supplies.ammo>owner.supplies.ammo||!same(state.inventory,owner.inventory)||!same(state.cargo,owner.cargo))fail('owned resources');
 for(let i=0;i<state.party.length;i++){
  const {throwingAmmo:beforeAmmo,...before}=owner.party[i],{throwingAmmo:currentAmmo,...current}=state.party[i];
  if(!same(before,current))fail('owned member snapshot');
 }

 if((input.status==='running')!==(state.battle.status==='active')||input.status!=='settled'&&input.receipt!==null)fail('status');
 const job={version:input.version,companyId:input.companyId,encounterId:input.encounterId,steps:input.steps,status:input.status,state,world,enemyWorldIndices:[...indices],receipt:null};
 if(input.status==='settled'){job.receipt=outcome(job);if(!same(input.receipt,job.receipt))fail('settlement receipt');}
 return job;
}

export function checkpointHeadlessCombat(job){if(size(job)>HEADLESS_MAX_BYTES)fail('checkpoint exceeds size limit');return structuredClone(job);}
