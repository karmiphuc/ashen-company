import {test,expect} from '@playwright/test';
import {completedCompany} from '../tests/fixtures/legacy-company.mjs';
import {createLegacyCampaign,getLegacyRetirementQuote,validateSave,SETTLEMENTS} from '../src/engine.js';
const key='ashen-company-save-v1';
function sourceCompany(){const s=completedCompany();s.inventory.push('patched-coat','bone-platings','war-horse','spear');s.inventoryCondition.push(7,1,null,null);return validateSave(s);}
async function load(page,s){await page.addInitScript(({key,text})=>{if(!localStorage.getItem(key))localStorage.setItem(key,text);},{key,text:JSON.stringify(s)});await page.goto('./');}
test('iPad stash keepsakes use a searchable visual picker, enforce three copies and stay sealed on reload',async({page})=>{
 await page.setViewportSize({width:1024,height:768});const errors=[];page.on('pageerror',e=>errors.push(e.message));const source=sourceCompany();await load(page,source);
 await page.locator('#settings-button').click();await page.locator('[data-action="legacy-retire"]').click();await page.locator('[data-legacy-item="0"]').click();
 for(const index of [1,2,3])await page.locator(`[data-legacy-cache="${index}"]`).check();
 await expect(page.locator('[data-legacy-cache-count]')).toHaveText('3/3');await expect(page.locator('[data-legacy-cache="4"]')).toBeDisabled();
 await page.locator('[data-legacy-cache="2"]').uncheck();await expect(page.locator('[data-legacy-cache="4"]')).toBeEnabled();await page.locator('[data-legacy-cache="2"]').check();
 await page.locator('[data-legacy-cache-search]').fill('horse');await expect(page.locator('.legacy-cache-item:visible')).toHaveCount(1);await expect(page.locator('[data-legacy-cache="3"]')).toBeChecked();
 await page.locator('[data-legacy-cache-search]').fill('missing');await expect(page.locator('[data-legacy-cache-empty]')).toBeVisible();
 await page.locator('[data-legacy-cache-search]').fill('');await page.screenshot({path:'/tmp/legacy-stash-picker.png'});
 const box=await page.locator('#modal').boundingBox();expect(box.width).toBeLessThanOrEqual(1024);expect(box.height).toBeLessThanOrEqual(768);
 await page.locator('[data-action="legacy-confirm"]').click();await expect(page.locator('.legacy-stash-summary')).toContainText('3 stash finds · sealed');
 const stored=await page.evaluate(key=>({active:JSON.parse(localStorage.getItem(key)),retired:JSON.parse(localStorage.getItem(key+'-retired'))}),key);
 expect(stored.active.companyLegacy.stash).toEqual([{itemId:'patched-coat',condition:7},{itemId:'war-horse',condition:null},{itemId:'bone-platings',condition:1}]);expect(stored.active.inventory).not.toContain('war-horse');expect(stored.retired.inventory).toEqual(source.inventory);
 await page.reload();await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('.legacy-stash-summary')).toContainText('3 stash finds · sealed');expect(errors).toEqual([]);
});
test('quest restoration adds the entire cache exactly once with original condition',async({page})=>{
 const source=sourceCompany(),s=createLegacyCampaign(source,getLegacyRetirementQuote(source,0,[1,2,3]),91).state;
 Object.assign(s,{day:30,renown:150,shipmentLegacyThroughDay:30});Object.assign(s.companyLegacy,{stage:4,contracts:['a','b','c'],victories:['x','y','z']});
 const t=SETTLEMENTS.find(t=>t.id==='ironford');s.position={x:t.x,y:t.y};await load(page,validateSave(s));await page.locator('[data-tab="journal"]').first().click();await page.locator('[data-legacy-turnin="4"]').click();
 await expect(page.locator('#modal .legacy-stash-summary')).toContainText('3 stash finds · restored');const first=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 expect(first.inventory.slice(-4)).toEqual(source.inventory.slice(0,4));expect(first.inventoryCondition.slice(-4)).toEqual(source.inventoryCondition.slice(0,4));
 await page.reload();await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('[data-legacy-turnin]')).toHaveCount(0);expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).inventory).toEqual(first.inventory);
});
