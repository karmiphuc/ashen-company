import { test, expect } from '@playwright/test';
import { createGame, getDiscoveryEvent } from '../src/engine.js';

test('iPad map puts icon actions in rows and keeps world conditions compact', async ({ page }) => {
  const seed=Array.from({length:100},(_,i)=>i+1).find(seed=>getDiscoveryEvent({seed,day:1})?.id==='challengers');
  const state=createGame(seed);
  state.hour=22;
  await page.setViewportSize({width:1024,height:768});
  await page.addInitScript(save=>localStorage.setItem('ashen-company-save-v1',save),JSON.stringify(state));
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  const side=page.locator('.world-sidebar');
  await expect(side.locator('[data-action="market-news"]')).toHaveCount(0);
  await expect(side.locator('.location-description')).toHaveCount(0);
  const enter=side.getByRole('button',{name:'Enter settlement',exact:true});
  const market=side.getByRole('button',{name:/Marketplace:/});
  await expect(enter).toBeVisible();await expect(market.locator('img')).toBeVisible();
  for(const size of [{width:1024,height:768},{width:768,height:1024},{width:1366,height:1024},{width:1600,height:900}]){
    await page.setViewportSize(size);
    const a=await enter.boundingBox(),b=await market.boundingBox();
    expect(a.y).toBe(b.y);expect(a.height).toBe(44);expect(b.x).toBeGreaterThan(a.x);
    expect((await side.locator('.location-header').boundingBox()).height).toBeLessThan(105);
    expect((await page.locator('.world-status-row').boundingBox()).height).toBeLessThanOrEqual(40);
    const map=await page.locator('.world-layout').boundingBox(),roster=await page.locator('.company-strip').boundingBox();
    expect(map.y+map.height).toBeLessThanOrEqual(roster.y+1);
  }
  await page.setViewportSize({width:1024,height:768});
  await expect(page.locator('#world-time')).toContainText('Night');
  await expect(page.locator('#discovery-news')).toContainText('Champions');
  await page.screenshot({path:'/tmp/world-sidebar.png'});
  await page.getByRole('button',{name:'About Night',exact:true}).click();
  await expect(page.locator('#company-hint-world-light')).toContainText('ranged hit chance −40');
  await market.click();await expect(page.locator('.market-workspace')).toBeVisible();
  expect(errors).toEqual([]);
});
