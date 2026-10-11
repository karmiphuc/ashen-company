import {HeadlessCombatRunner} from './headless-runner.js';
import {planRivalWorldCombat} from './engine.js';
import {acknowledgeRivalCombat,rivalClock} from './rival-world-combat.js';

// One RPC at a time. A completed worker checkpoint is the only persisted
// acknowledgement. On replacement/load, the same source and seed resume.
export class RivalCombatController {
 constructor({world,onChange=()=>{},workerFactory}={}){this.world=world;this.onChange=onChange;this.workerFactory=workerFactory;this.runner=null;this.loaded=new Set();this.busy=null;this.cursor=0;this.lastWorld=null;this.lastClock=null;this.retryAt=0;this.error=null;this.closed=false;}
 reset(){this.runner?.close();this.runner=null;this.loaded.clear();this.lastClock=null;}
 pump(){
  if(this.closed||this.busy||Date.now()<this.retryAt)return this.busy;
  const world=this.world();if(!world||world.gameOver)return;
  if(world!==this.lastWorld){this.reset();this.lastWorld=world;}
  if(this.lastClock!==world.rivalCompanies?.lastHour){planRivalWorldCombat(world);this.lastClock=world.rivalCompanies?.lastHour;}
  const jobs=world.rivalCompanies?.jobs??[],pending=jobs.filter(j=>j.checkpoint?.status!=='settled');
  if(!pending.length){if(this.loaded.size)this.reset();return;}
  const job=pending[this.cursor++%pending.length];
  this.busy=this.advance(world,job).catch(error=>{this.error=error.message;this.reset();this.retryAt=Date.now()+1000;}).finally(()=>{this.busy=null;});return this.busy;
 }
 async advance(world,job){
  this.runner??=new HeadlessCombatRunner(this.workerFactory?{workerFactory:this.workerFactory}:{});
  const runner=this.runner;
  if(!this.loaded.has(job.companyId)){
   if(job.checkpoint)await runner.restore(job.checkpoint);else await runner.prepare(job.source,job.companyId,job.encounterId);
   this.loaded.add(job.companyId);
  }
  const progress=await runner.step(job.companyId,{maxSteps:16,budgetMs:12});
  if(progress.status==='ready')await runner.settle(job.companyId);
  const checkpoint=await runner.checkpoint(job.companyId);
  if(this.closed||this.world()!==world||!(world.rivalCompanies?.jobs??[]).includes(job))return;
  acknowledgeRivalCombat(world,job.companyId,checkpoint);this.error=null;this.onChange(world,checkpoint);
  if(checkpoint.status==='settled'){await runner.forget(job.companyId);this.loaded.delete(job.companyId);}
 }
 async flush(){
  while(!this.closed){
   const pending=this.world()?.rivalCompanies?.jobs?.some(j=>j.checkpoint?.status!=='settled');if(!pending)return;
   if(Date.now()<this.retryAt)throw new Error(this.error??'Mercenary battle reports are temporarily unavailable.');
   await (this.busy??this.pump());
  }
 }
 async rest(action,hours){
  const world=this.world(),end=rivalClock(world)+hours;
  while(!this.closed&&this.world()===world){
   await this.flush();
   if(this.closed||this.world()!==world)break;
   const result=action(world,{remainingHours:Math.max(0,end-rivalClock(world))});
   if(!result?.rivalPending)return result;
   // New fights can begin during stationary time. Resume only the unspent
   // hours after their reports arrive; never restart the full rest or heal early.
  }
  return {ok:false,message:'The company changed before resting finished.'};
 }
 close(){this.closed=true;this.reset();}
}
