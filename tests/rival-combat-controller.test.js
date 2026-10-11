import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RivalCombatController} from '../src/rival-combat-controller.js';
import {createGame,advanceRivalSimulation,getCampSites,planRivalWorldCombat,validateSave} from '../src/engine.js';
import {enableRivalCombat} from '../src/rival-world-combat.js';
function scene(){const world=createGame(12);advanceRivalSimulation(world);enableRivalCombat(world);const camp=getCampSites(world).find(c=>c.difficulty===1);Object.assign(world.rivalCompanies.companies[0],{position:{x:camp.x,y:camp.y},status:'travelling',targetCampId:camp.id});planRivalWorldCombat(world);return world;}
test('worker failure preserves the reserved source and resources without a guessed result or synchronous fallback',async()=>{
 const world=scene(),before=structuredClone(world);let worker;
 const controller=new RivalCombatController({world:()=>world,workerFactory:()=>worker={postMessage(){queueMicrotask(()=>worker.onerror());},terminate(){this.terminated=true;}}});
 await controller.pump();assert.ok(worker.terminated);assert.match(controller.error,/failed/);assert.deepEqual(world,before);assert.equal(world.rivalCompanies.jobs[0].checkpoint,null);validateSave(world);await assert.rejects(controller.flush(),/failed/);controller.close();
});
test('switching campaigns while a worker request is pending never writes a checkpoint into the new company',async()=>{
 const old=scene(),fresh=createGame(19),saved=structuredClone(fresh);let current=old,worker;
 const controller=new RivalCombatController({world:()=>current,workerFactory:()=>worker={postMessage(message){if(message.type==='prepare')queueMicrotask(()=>this.onmessage({data:{requestId:message.requestId,ok:true,result:{status:'running'}}}));else this.message=message;},terminate(){}}});
 const pending=controller.pump();await new Promise(resolve=>setImmediate(resolve));current=fresh;controller.close();await pending;assert.deepEqual(fresh,saved);assert.equal(old.rivalCompanies.jobs[0].checkpoint,null);
});
