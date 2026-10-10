import {test,expect} from '@playwright/test';
import {completedCompany} from '../tests/fixtures/legacy-company.mjs';
import {advanceRivalSimulation,validateSave} from '../src/engine.js';
const key='ashen-company-save-v1';
test('endgame rivals can be scouted from the chronicle on iPad, expose their real roster, and persist across reload',async({page})=>{
 const state=completedCompany();state.inventory=[];state.inventoryCondition=[];advanceRivalSimulation(state);validateSave(state);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));},{key,state});await page.goto('./');
 await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('.rival-journal')).toContainText('Gilded Road');await expect(page.locator('.rival-journal')).toContainText('Red Jackals');await page.locator('[data-rival-inspect="rival:gilded-road"]').click();
 await expect(page.locator('.rival-company-panel')).toContainText('Contract specialists');await expect(page.locator('.rival-roster>div')).toHaveCount(6);await expect(page.locator('.rival-company-panel')).toContainText('Lv 3');await page.screenshot({path:'/tmp/rival-company-ipad.png'});
 await page.locator('.rival-company-panel summary').first().click();await expect(page.locator('.rival-company-panel')).toContainText('Daily upkeep: 42 crowns');await page.locator('.rival-company-panel summary').last().click();await expect(page.locator('.rival-company-panel')).toContainText('not active yet');
 for(const width of [1024,768]){await page.setViewportSize({width,height:768});const layout=await page.locator('.rival-company-panel').evaluate(el=>{const box=el.getBoundingClientRect();return {width:el.clientWidth,scroll:el.scrollWidth,overflow:[...el.querySelectorAll('*')].filter(node=>node.getBoundingClientRect().right>box.right+1).map(node=>({tag:node.tagName,class:node.className,width:node.getBoundingClientRect().width,text:node.textContent.slice(0,50)})).slice(0,12)};});expect(layout.scroll<=layout.width+1,JSON.stringify({viewport:width,...layout})).toBe(true);}
 await page.reload();await page.locator('[data-tab="journal"]').first().click();await page.locator('[data-rival-inspect="rival:gilded-road"]').click();await expect(page.locator('.rival-roster>div')).toHaveCount(6);
 const persisted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).rivalCompanies,key);expect(persisted.companies[0].gold).toBe(12000);expect(persisted.companies[0].party[0].level).toBe(3);expect(errors).toEqual([]);
});
test('mounted rivals keep full-size bodies and reserve room for horses in the narrow iPad sidebar',async({page})=>{
 const state=completedCompany();state.inventory=[];state.inventoryCondition=[];advanceRivalSimulation(state);state.position={...state.rivalCompanies.companies[2].position};
 await page.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));},{key,state});await page.goto('./');await page.setViewportSize({width:768,height:768});await page.locator('[data-tab="journal"]').first().click();await page.locator('[data-rival-inspect="rival:bronze-oath"]').click();await expect(page.locator('.rival-roster>div')).toHaveCount(8);await expect(page.locator('.rival-mounted')).toHaveCount(2);expect(await page.locator('.rival-company-panel').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);expect(await page.locator('.rival-mounted .bb-portrait').first().evaluate(el=>el.getBoundingClientRect().width)).toBe(58);await page.screenshot({path:'/tmp/rival-mounted-ipad.png'});
});
test('pre-crisis campaigns do not show late-game rival bands',async({page})=>{await page.goto('./');await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('.rival-journal')).toHaveCount(0);});
