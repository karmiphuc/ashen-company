import {populateLateGameHistory} from '../tests/helpers/rival-late-game.js';
import {test,expect} from '@playwright/test';
import {createGame,advanceRivalSimulation,planRivalWorldCombat,getRoamingBands,validateSave,SETTLEMENTS} from '../src/engine.js';
import {enableRivalCombat} from '../src/rival-world-combat.js';
const key='ashen-company-save-v1';
function scene(contact=false){const world=createGame(12);advanceRivalSimulation(world);enableRivalCombat(world);const band=getRoamingBands(world).find(b=>b.difficulty===0&&SETTLEMENTS.every(t=>Math.hypot(t.x-b.x,t.y-b.y)>40)),company=world.rivalCompanies.companies[0];company.position={x:band.x+(contact?0:80),y:band.y};company.status='travelling';if(contact)planRivalWorldCombat(world);else world.position={x:company.position.x,y:company.position.y+75};return {world,band,company};}
test('iPad map shows rival party figures with compact heraldry and a concise goal hint',async({page})=>{
 const {world}=scene(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,world})=>localStorage.setItem(key,JSON.stringify(world)),{key,world});await page.goto('./');await page.locator('[data-tab="journal"]').first().click();await page.locator('[data-rival-inspect="rival:gilded-road"]').click();await expect(page.locator('.rival-goal')).toContainText('Cautious earners');await page.getByRole('button',{name:'About Cautious earners',exact:true}).click();await expect(page.locator('.rival-goal [role=tooltip]')).toBeVisible();await expect(page.locator('.rival-goal [role=tooltip]')).toContainText('wage reserves');await page.getByRole('button',{name:'About Cautious earners',exact:true}).click();await page.screenshot({path:'/tmp/rival-party-map-ipad.png'});
 for(let i=0;i<10;i++)await page.getByRole('button',{name:'Zoom out',exact:true}).click();await page.screenshot({path:'/tmp/rival-party-overview-ipad.png'});expect(errors).toEqual([]);
});
test('real bandit worker settlement survives reload and player rest completes once despite newly scheduled fights',async({page})=>{
 const {world,band,company}=scene(true),errors=[];validateSave(world);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,world})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(world));},{key,world});await page.goto('./');
 await page.evaluate(()=>{window.rivalFrames={previous:performance.now(),max:0,count:0};function frame(now){const f=window.rivalFrames;f.max=Math.max(f.max,now-f.previous);f.previous=now;f.count++;requestAnimationFrame(frame);}requestAnimationFrame(frame);});
 await expect.poll(async()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).rivalCompanies.jobs.find(j=>j.companyId==='gilded-road')?.checkpoint?.status,key),{timeout:30000}).toBe('settled');
 const frames=await page.evaluate(()=>window.rivalFrames);expect(frames.count).toBeGreaterThan(1);expect(frames.max).toBeLessThan(1000);await page.reload();
 await page.getByRole('button',{name:/Enter settlement/i}).click();await page.getByRole('button',{name:/Make camp/i}).click();
 await expect.poll(async()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).hour,key),{timeout:30000}).toBe(14);
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);validateSave(saved);expect(saved.rivalCompanies.companies[0].ledger.goldEarned).toBeGreaterThan(0);expect(saved.bands[band.id].spawnCycle).toBe(band.spawnCycle+1);expect(saved.rivalCompanies.reports.filter(r=>r.encounterId===band.id)).toHaveLength(1);expect(saved.rivalCompanies.companies[0].party.length).toBeLessThanOrEqual(company.party.length);expect(saved.camps[band.id]).toBeUndefined();expect(errors).toEqual([]);
});

test('late-game band contact starts in the browser worker and commits without six-hour following',async({page})=>{
 const {world,band}=scene(false);const company=world.rivalCompanies.companies[0];company.position={x:band.x,y:band.y};world.position={x:SETTLEMENTS[0].x,y:SETTLEMENTS[0].y};populateLateGameHistory(world);validateSave(world);expect(JSON.stringify(world).length).toBeGreaterThan(300000);
 const wear=structuredClone(world.rivalCompanies.campWear),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,world})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(world));},{key,world});await page.goto('./');
 await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).rivalCompanies.jobs.find(j=>j.companyId==='gilded-road')?.checkpoint?.status,key),{timeout:30000}).toBe('settled');
 await page.reload();await page.locator('[data-speed="1"]').click();
 await expect.poll(()=>page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).rivalCompanies.reports.some(r=>r.encounterId===id),{key,id:band.id}),{timeout:15000}).toBe(true);
 await page.locator('[data-speed="0"]').click();const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);validateSave(saved);
 const reports=saved.rivalCompanies.reports.filter(r=>r.encounterId===band.id);expect(reports).toHaveLength(1);expect(reports[0].hour).toBe(8.25);expect(saved.bands[band.id].spawnCycle).toBe(band.spawnCycle+1);
 for(const [id,value] of Object.entries(wear))if(id!==band.id)expect(saved.rivalCompanies.campWear[id]).toEqual(value);
 expect(errors).toEqual([]);
});
