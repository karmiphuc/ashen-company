import {test,expect} from '@playwright/test';
import {createGame,advanceRivalSimulation,getCampSites,planRivalWorldCombat,validateSave} from '../src/engine.js';
import {enableRivalCombat} from '../src/rival-world-combat.js';
const key='ashen-company-save-v1';
function fixture(){const world=createGame(12);advanceRivalSimulation(world);enableRivalCombat(world);const camp=getCampSites(world).find(c=>c.difficulty===1),company=world.rivalCompanies.companies[0];Object.assign(company,{position:{x:camp.x,y:camp.y},status:'travelling',targetCampId:camp.id});planRivalWorldCombat(world);return validateSave(world);}
test('live rival worker preserves a reserved fight through reload and commits actual rewards after six campaign hours',async({page})=>{
 const world=fixture(),campId=world.rivalCompanies.jobs[0].encounterId,errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,world})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(world));},{key,world});await page.goto('./');await page.setViewportSize({width:768,height:768});
 await page.evaluate(()=>{window.rivalFrames={frames:0,maxGap:0,last:performance.now(),active:true};const pulse=now=>{const m=window.rivalFrames;if(!m.active)return;m.frames++;m.maxGap=Math.max(m.maxGap,now-m.last);m.last=now;requestAnimationFrame(pulse);};requestAnimationFrame(pulse);});
 await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.rivalCompanies?.jobs?.[0]?.checkpoint?.status==='settled',key,{timeout:30000});
 const frameReport=await page.evaluate(()=>{window.rivalFrames.active=false;return window.rivalFrames;});expect(frameReport.frames).toBeGreaterThan(1);expect(frameReport.maxGap).toBeLessThan(1000);
 const ready=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(ready.hour).toBe(8);expect(ready.rivalCompanies.companies[0].gold).toBe(12000);expect(ready.rivalCompanies.jobs[0].checkpoint.receipt.outcome).toBe('victory');validateSave(ready);
 await page.reload();await page.locator('[data-action="town"]').first().click();await page.getByRole('button',{name:'Make camp for 6 hours',exact:true}).click();
 const result=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(result.hour).toBe(14);expect(result.rivalCompanies.jobs).toHaveLength(0);expect(result.rivalCompanies.companies[0].gold).toBeGreaterThan(12000);expect(result.rivalCompanies.companies[0].ledger.goldEarned).toBeGreaterThan(0);expect(result.camps[campId].clearedDay).toBe(1);expect(result.rivalCompanies.companies[0].party[0].perks.length).toBeGreaterThan(0);validateSave(result);expect(errors).toEqual([]);
 await page.reload();const again=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(again.rivalCompanies.companies[0].gold).toBe(result.rivalCompanies.companies[0].gold);expect(again.rivalCompanies.reports).toHaveLength(1);
});
