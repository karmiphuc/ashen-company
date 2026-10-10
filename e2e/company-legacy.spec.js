import { test, expect } from '@playwright/test';
import { completedCompany } from '../tests/fixtures/legacy-company.mjs';
const key='ashen-company-save-v1';
async function openRetirement(page){await page.locator('#settings-button').click();await page.locator('[data-action="legacy-retire"]').click();await page.locator('[data-legacy-item="0"]').click();}
async function seed(page){const source=completedCompany();await page.addInitScript(({key,save})=>{if(!localStorage.getItem(key))localStorage.setItem(key,save);},{key,save:JSON.stringify(source)});await page.goto('./');return source;}

test('iPad retirement is explicit, keeps a backup and persists a sealed heirloom through reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const source=await seed(page);await openRetirement(page);
 await expect(page.getByText('This ends your current campaign and replaces its active save.')).toBeVisible();await page.getByRole('button', { name: 'Keep playing' }).click();expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).companyLegacy).toBeUndefined();
 await openRetirement(page);await page.locator('[data-action="legacy-confirm"]').click();await expect(page.locator('.legacy-panel')).toContainText('SEALED HEIRLOOM');
 const stored=await page.evaluate(key=>({active:JSON.parse(localStorage.getItem(key)),retired:JSON.parse(localStorage.getItem(key+'-retired'))}),key);expect(stored.active.day).toBe(1);expect(stored.active.companyLegacy.itemId).toBe(source.inventory[0]);expect(stored.active.inventory).not.toContain(source.inventory[0]);expect(stored.retired.seed).toBe(source.seed);expect(stored.retired.ashenWinter.phase).toBe('completed');
 await expect(page.locator('[data-legacy-turnin="1"]')).toBeEnabled();await page.locator('[data-legacy-turnin="1"]').click();await expect(page.locator('.legacy-panel')).toContainText('SIDE QUEST 2/4');
 const bounds=await page.locator('#modal').boundingBox();expect(bounds.width).toBeLessThanOrEqual(1024);expect(bounds.height).toBeLessThanOrEqual(768);
 await page.reload();await page.locator('[data-tab="journal"]').first().click();await expect(page.locator('.legacy-journal')).toContainText('SIDE QUEST 2/4');await page.locator('#settings-button').click();const download=page.waitForEvent('download');await page.locator('[data-action="legacy-export-retired"]').click();expect((await download).suggestedFilename()).toBe('ashen-company-retired.json');expect(errors).toEqual([]);
});

test('a failed active-save write preserves the existing company and can be retried',async({page})=>{
 const source=await seed(page);await openRetirement(page);await page.evaluate(key=>{const original=Storage.prototype.setItem;let fail=true;Storage.prototype.setItem=function(k,v){if(k===key&&fail){fail=false;throw new DOMException('Quota reached','QuotaExceededError');}return original.call(this,k,v);};},key);
 await page.locator('[data-action="legacy-confirm"]').click();await expect(page.locator('#toast')).toContainText('Retirement was not applied');const current=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(current.seed).toBe(source.seed);expect(current.companyLegacy).toBeUndefined();await expect(page.locator('[data-action="legacy-confirm"]')).toBeVisible();await page.locator('[data-action="legacy-confirm"]').click();await expect(page.locator('.legacy-panel')).toContainText('SEALED HEIRLOOM');
});
