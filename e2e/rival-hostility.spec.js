import {test,expect} from '@playwright/test';
import {createGame,advanceRivalSimulation,planRivalWorldCombat,tick,validateSave,SETTLEMENTS,getRoamingBands} from '../src/engine.js';
import {advanceRivalDiplomacy} from '../src/rival-diplomacy.js';
import {soldierFactionAt} from '../src/faction-patrols.js';
const key='ashen-company-save-v1';
function scene(mature=false){
 const world=createGame(12);advanceRivalSimulation(world);planRivalWorldCombat(world);tick(world,.25);const company=world.rivalCompanies.companies[1],entry=world.rivalDiplomacy.companies[company.id];company.position={x:600,y:480};company.status='travelling';
 if(mature){world.day=31;world.shipments={};world.shipmentLegacyThroughDay=31;world.rivalCompanies.lastHour=728.25;company.party.forEach(p=>p.level=8);company.gold+=8000;company.ledger.goldEarned=8000;advanceRivalDiplomacy(world,{record:(w,text)=>w.log.push(text),factionAt:p=>soldierFactionAt(p.x,p.y)});const town=SETTLEMENTS.find(t=>soldierFactionAt(t.x,t.y).id===entry.outlawFaction);world.position={x:town.x,y:town.y};for(const band of getRoamingBands(world))world.bands[band.id].defeatedUntil=world.rivalCompanies.lastHour+48;}
 else{entry.declaredHour=8.25;entry.reason='extortion';world.position={...company.position};}
 validateSave(world);return {world,company};
}
test('iPad war inspection exposes a compact notice, touch explanation and real rival battle that reloads',async({page})=>{
 const {world,company}=scene(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(({key,world})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(world));},{key,world});await page.goto('./');
 await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('.rival-journal')).toContainText('⚔ At war');await page.locator('[data-rival-inspect="rival:red-jackals"]').click();await expect(page.locator('.rival-war-notice')).toContainText('At war');await page.getByRole('button',{name:'About Declaration of war',exact:true}).click();await expect(page.locator('.rival-war-notice [role=tooltip]')).toContainText('one day');await page.getByRole('button',{name:'About Declaration of war',exact:true}).click();
 await page.setViewportSize({width:768,height:768});expect(await page.locator('.rival-company-panel').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.screenshot({path:'/tmp/rival-war-ipad.png'});
 await page.getByRole('button',{name:'⚔ Engage rivals',exact:true}).click();await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).battle?.encounterType,key)).toBe('rival');
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);validateSave(saved);expect(saved.battle.units.filter(u=>u.side==='enemy')).toHaveLength(company.party.length);await page.reload();await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).battle?.encounterType,key)).toBe('rival');expect(errors).toEqual([]);
});
test('seasoned outlaw warrant can be accepted on iPad and its map button hunts the actual moving company',async({page})=>{
 const {world}=scene(true),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(({key,world})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(world));},{key,world});await page.goto('./');
 await page.locator('[data-action="contracts"]').first().click();await expect(page.getByRole('heading',{name:'⚖ Eliminate the Red Jackals',exact:true})).toBeVisible();await page.screenshot({path:'/tmp/rival-bounty-ipad.png'});await page.locator('[data-accept$=":rival-bounty"]').click();
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);validateSave(saved);expect(saved.contract.type).toBe('rival-bounty');await page.reload();const button=page.locator('.map-quests [data-quest-travel="rival"]');await expect(button).toBeVisible();await button.click();await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).pursuit,key)).toBe('rival:red-jackals');expect(errors).toEqual([]);
});
