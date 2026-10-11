import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HeadlessCombatRunner} from '../src/headless-runner.js';
function mock(){const sent=[];const worker={postMessage:data=>sent.push(data),terminate(){this.terminated=true;}};return {sent,worker,runner:new HeadlessCombatRunner({workerFactory:()=>worker})};}
test('worker requests correlate replies and reject operation errors without losing other jobs',async()=>{
 const {sent,worker,runner}=mock();
 const a=runner.step('a'),b=runner.checkpoint('b');assert.equal(sent.length,2);
 worker.onmessage({data:{requestId:sent[1].requestId,ok:true,result:{steps:3}}});assert.deepEqual(await b,{steps:3});
 worker.onmessage({data:{requestId:sent[0].requestId,ok:false,error:'Unknown headless job'}});await assert.rejects(a,/Unknown/);
 assert.equal(runner.pending.size,0);assert.equal(runner.closed,false);runner.close();assert.equal(worker.terminated,true);
});
test('worker failures and cancellation settle every pending promise and never run combat on the caller thread',async()=>{
 for(const kind of ['onerror','onmessageerror','close']){
  const {worker,runner}=mock(),request=runner.checkpoint('a'),rejection=assert.rejects(request,/worker/i);
  if(kind==='close')runner.close();else worker[kind]();
  await rejection;assert.equal(runner.pending.size,0);assert.equal(worker.terminated,true);await assert.rejects(runner.step('a'),/closed/);runner.close();
 }
});
test('pending commands are bounded and failed message cloning does not strand requests',async()=>{
 const {worker,runner}=mock();const requests=Array.from({length:8},()=>runner.checkpoint('a'));const checked=requests.map(p=>assert.rejects(p,/closed/));
 await assert.rejects(runner.checkpoint('a'),/queue is full/);runner.close();await Promise.all(checked);
 const other=mock();other.worker.postMessage=()=>{throw new Error('clone failure');};await assert.rejects(other.runner.prepare({},'a','camp'),/clone failure/);assert.equal(other.runner.pending.size,0);other.runner.close();
});
