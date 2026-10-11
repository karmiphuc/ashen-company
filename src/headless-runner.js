// Preparation, validation and atomic combat actions stay off the UI thread.
// Failure leaves the last acknowledged checkpoint available to the owner;
// there is no synchronous fallback or invented result.
export class HeadlessCombatRunner {
 constructor({workerFactory=()=>new Worker(new URL('./headless-worker.js',import.meta.url),{type:'module'})}={}){
  this.pending=new Map();this.serial=0;this.closed=false;this.worker=workerFactory();
  this.worker.onmessage=({data})=>{
   const request=this.pending.get(data?.requestId);if(!request)return;
   clearTimeout(request.timer);this.pending.delete(data.requestId);
   if(data.ok)request.resolve(data.result);else request.reject(new Error(data.error??'Headless worker request failed'));
  };
  this.worker.onerror=()=>this.close(new Error('Headless worker failed; restore the last checkpoint'));
  this.worker.onmessageerror=()=>this.close(new Error('Headless worker response could not be read'));
 }
 request(type,payload={}){
  if(this.closed)return Promise.reject(new Error('Headless worker is closed'));
  if(this.pending.size>=8)return Promise.reject(new Error('Headless request queue is full'));
  const requestId=++this.serial;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>this.close(new Error('Headless worker timed out; restore the last checkpoint')),10000);
   this.pending.set(requestId,{resolve,reject,timer});
   try{this.worker.postMessage({...payload,type,requestId});}catch(error){clearTimeout(timer);this.pending.delete(requestId);reject(error);}
  });
 }
 prepare(world,companyId,encounterId){return this.request('prepare',{world,companyId,encounterId});}
 restore(snapshot){return this.request('restore',{snapshot});}
 step(companyId,options={}){return this.request('step',{companyId,options});}
 checkpoint(companyId){return this.request('checkpoint',{companyId});}
 settle(companyId){return this.request('settle',{companyId});}
 forget(companyId){return this.request('forget',{companyId});}
 close(reason=new Error('Headless worker closed')){
  if(this.closed)return;
  this.closed=true;this.worker.terminate();
  for(const request of this.pending.values()){clearTimeout(request.timer);request.reject(reason);}
  this.pending.clear();
 }
}
