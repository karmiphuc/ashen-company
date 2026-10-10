import {test,expect} from '@playwright/test';
import {completedCompany} from '../tests/fixtures/legacy-company.mjs';
import {createLegacyCampaign,getLegacyRetirementQuote,validateSave,SETTLEMENTS} from '../src/engine.js';
const key='ashen-company-save-v1';
function sourceCompany(){const s=completedCompany();s.inventory.push('patched-coat','bone-platings','war-horse','spear');s.inventoryCondition.push(7,1,null,null);return validateSave(s);}
async function load(page,s){await page.addInitScript(({key,text})=>{if(!localStorage.getItem(key))localStorage.setItem(key,text);},{key,text:JSON.stringify(s)});await page.goto('./');}
test('existing sealed four-item legacy remains readable and unchanged after reload',async({page})=>{
 const source=sourceCompany(),s=createLegacyCampaign(source,getLegacyRetirementQuote(source,0,[1,2,3]),91).state;await load(page,s);await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('.legacy-stash-summary')).toContainText('3 stash finds · sealed');await page.reload();await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('.legacy-stash-summary')).toContainText('3 stash finds · sealed');const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(stored.companyLegacy).toEqual(s.companyLegacy);
});
test('quest restoration adds the entire cache exactly once with original condition',async({page})=>{
 const source=sourceCompany(),s=createLegacyCampaign(source,getLegacyRetirementQuote(source,0,[1,2,3]),91).state;
 Object.assign(s,{day:30,renown:150,shipmentLegacyThroughDay:30});Object.assign(s.companyLegacy,{stage:4,contracts:['a','b','c'],victories:['x','y','z']});
 const t=SETTLEMENTS.find(t=>t.id==='ironford');s.position={x:t.x,y:t.y};await load(page,validateSave(s));await page.locator('[data-tab="journal"]').first().click();await page.locator('[data-legacy-turnin="4"]').click();
 await expect(page.locator('#modal .legacy-stash-summary')).toContainText('3 stash finds · restored');const first=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 expect(first.inventory.slice(-4)).toEqual(source.inventory.slice(0,4));expect(first.inventoryCondition.slice(-4)).toEqual(source.inventoryCondition.slice(0,4));
 await page.reload();await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('[data-legacy-turnin]')).toHaveCount(0);expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).inventory).toEqual(first.inventory);
});
