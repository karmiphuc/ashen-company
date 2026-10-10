import {test,expect} from '@playwright/test';
import {entombedCompany} from '../tests/fixtures/entombed-company.mjs';
import {createLegacyCampaign,getLegacySetRetirementQuote,getItem} from '../src/engine.js';
import {companyMemory,appendCompanyMemory} from '../src/company-history.js';
const key='ashen-company-save-v1';
test('past banners persist across reload, export independently, and fit iPad and phone',async({page})=>{
 const {state,indices}=entombedCompany(),next=createLegacyCampaign(state,getLegacySetRetirementQuote(state,indices)).state;
 const memory=companyMemory(state,next,getItem),history=appendCompanyMemory(null,memory);
 await page.addInitScript(({key,next,state,history})=>{if(!localStorage.getItem(key)){localStorage.setItem(key,JSON.stringify(next));localStorage.setItem(key+'-retired',JSON.stringify(state));localStorage.setItem(key+'-history',history);}},{key,next,state,history});
 await page.goto('./');await page.locator('[data-tab="journal"]').first().click();await page.locator('[data-action="company-history"]').click();
 await expect(page.locator('.company-history')).toContainText(memory.warrior);await expect(page.locator('.company-history-grid article')).toHaveCount(1);await page.locator('.company-history-grid summary').click();await expect(page.locator('.company-history')).toContainText(memory.sets[0][0]);
 for(const width of [1024,768,390]){await page.setViewportSize({width,height:768});expect(await page.locator('#modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);}
 await page.setViewportSize({width:1024,height:768});await page.screenshot({path:'/tmp/company-history-ipad.png'});
 const download=page.waitForEvent('download');await page.locator('[data-action="history-export"]').click();expect((await download).suggestedFilename()).toBe('ashen-company-history.json');
 await page.reload();await page.locator('[data-tab="journal"]').first().click();await page.locator('[data-action="company-history"]').click();await expect(page.locator('.company-history-grid article')).toHaveCount(1);
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).companyLegacy.stage,key)).toBe(1);
});
test('old retired backup is visible without rewriting it or granting rewards',async({page})=>{
 const {state,indices}=entombedCompany(),next=createLegacyCampaign(state,getLegacySetRetirementQuote(state,indices)).state;
 await page.addInitScript(({key,next,state})=>{localStorage.setItem(key,JSON.stringify(next));localStorage.setItem(key+'-retired',JSON.stringify(state));},{key,next,state});await page.goto('./');await page.locator('[data-tab="journal"]').first().click();await page.locator('[data-action="company-history"]').click();await expect(page.locator('.company-history-grid article')).toHaveCount(1);expect(await page.evaluate(key=>localStorage.getItem(key+'-history'),key)).toBeNull();
});
