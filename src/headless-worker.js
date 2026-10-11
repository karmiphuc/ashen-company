import {createHeadlessCombat,restoreHeadlessCombat,advanceHeadlessCombat,settleHeadlessCombat,checkpointHeadlessCombat} from './headless-combat.js';
const jobs=new Map();
globalThis.onmessage=({data})=>{
 const requestId=data?.requestId;
 try{
  if(!Number.isSafeInteger(requestId)||requestId<1)throw new TypeError('Invalid headless request');
  let result;
  if(data.type==='prepare'||data.type==='restore'){
   const companyId=data.type==='prepare'?data.companyId:data.snapshot?.companyId;
   if(jobs.has(companyId)||jobs.size>=3)throw new TypeError('Headless job already exists or queue is full');
   const job=data.type==='prepare'?createHeadlessCombat(data.world,companyId,data.encounterId):restoreHeadlessCombat(data.snapshot);
   jobs.set(job.companyId,job);result={companyId:job.companyId,status:job.status,steps:job.steps};
  }else{
   const job=jobs.get(data.companyId);if(!job)throw new TypeError('Unknown headless job');
   if(data.type==='step')result={...advanceHeadlessCombat(job,data.options),status:job.status,steps:job.steps};
   else if(data.type==='checkpoint')result=checkpointHeadlessCombat(job);
   else if(data.type==='settle')result=settleHeadlessCombat(job);
   else if(data.type==='forget'){jobs.delete(data.companyId);result=true;}
   else throw new TypeError('Unknown headless command');
  }
  globalThis.postMessage({requestId,ok:true,result});
 }catch(error){globalThis.postMessage({requestId,ok:false,error:error.message});}
};
