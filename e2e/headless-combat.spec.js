import {test,expect} from '@playwright/test';
import {createGame,advanceRivalSimulation,getCampSites} from '../src/engine.js';
import {createHeadlessCombat,advanceHeadlessCombat,settleHeadlessCombat} from '../src/headless-combat.js';
function fixture(){const world=createGame(12);advanceRivalSimulation(world);const camp=getCampSites(world).find(c=>c.difficulty===1);world.rivalCompanies.companies[0].position={x:camp.x,y:camp.y};return {world,companyId:'gilded-road',encounterId:camp.id};}
const setup=fixture();
const expectedJob=createHeadlessCombat(setup.world,setup.companyId,setup.encounterId);
while(expectedJob.status==='running')advanceHeadlessCombat(expectedJob,{maxSteps:256,budgetMs:1000});
const expected=settleHeadlessCombat(expectedJob);

test('real module worker finishes the same battle while the iPad page continues rendering',async({page})=>{
 await page.goto('./');
 const result=await page.evaluate(async setup=>{
  const {HeadlessCombatRunner}=await import('./src/headless-runner.js');const runner=new HeadlessCombatRunner();
  let frames=0,last=performance.now(),maxGap=0,active=true;
  const pulse=time=>{if(!active)return;frames++;maxGap=Math.max(maxGap,time-last);last=time;requestAnimationFrame(pulse);};requestAnimationFrame(pulse);
  try{
   await runner.prepare(setup.world,setup.companyId,setup.encounterId);let progress={status:'running'};
   while(progress.status==='running')progress=await runner.step(setup.companyId,{maxSteps:256,budgetMs:1000});
   const receipt=await runner.settle(setup.companyId),again=await runner.settle(setup.companyId);
   await new Promise(resolve=>requestAnimationFrame(resolve));return {receipt,again,frames,maxGap};
  }finally{active=false;runner.close();}
 },setup);
 expect(result.receipt).toEqual(expected);expect(result.again).toEqual(expected);expect(result.frames).toBeGreaterThan(3);expect(result.maxGap).toBeLessThan(1000);
});

test('checkpoint survives worker replacement and malformed requests do not destroy the acknowledged job',async({page})=>{
 await page.goto('./');
 const result=await page.evaluate(async setup=>{
  const {HeadlessCombatRunner}=await import('./src/headless-runner.js');let runner=new HeadlessCombatRunner();
  try{
   await runner.prepare(setup.world,setup.companyId,setup.encounterId);await runner.step(setup.companyId,{maxSteps:16,budgetMs:1000});
   let error;try{await runner.step(setup.companyId,{maxSteps:-1});}catch(failure){error=failure.message;}
   const checkpoint=await runner.checkpoint(setup.companyId);runner.close();runner=new HeadlessCombatRunner();await runner.restore(checkpoint);
   let progress={status:'running'};while(progress.status==='running')progress=await runner.step(setup.companyId,{maxSteps:8,budgetMs:4});
   const receipt=await runner.settle(setup.companyId);await runner.forget(setup.companyId);
   let forgotten;try{await runner.checkpoint(setup.companyId);}catch(failure){forgotten=failure.message;}
   return {receipt,error,forgotten,steps:progress.steps};
  }finally{runner.close();}
 },setup);
 expect(result.receipt).toEqual(expected);expect(result.error).toContain('slice options');expect(result.forgotten).toContain('Unknown headless job');expect(result.steps).toBe(expectedJob.steps);
});
