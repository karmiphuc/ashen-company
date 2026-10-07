import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createGame } from '../src/engine.js';

test('built release boots, preserves its company and works offline with the exact cache', async ({ page, context }) => {
  const release = JSON.parse(await readFile(new URL('../dist/release.json', import.meta.url), 'utf8'));
  const worker = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  const cache = JSON.parse(worker.match(/^const CACHE = (.*);$/m)[1]);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(save => { if (!localStorage.getItem('ashen-company-save-v1')) localStorage.setItem('ashen-company-save-v1', save); }, JSON.stringify(createGame(51)));
  await page.goto('/');
  await expect(page.locator('#offline-status')).toHaveText('Offline ready', { timeout:60000 });
  await page.locator('#settings-button').click();
  await expect(page.locator('.credits')).toContainText(`Version ${release.version}`);
  await expect(page.locator('.credits')).toContainText(release.commit.slice(0, 8));
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('ashen-company-save-v1')));
  expect(await page.evaluate(() => caches.keys())).toContain(cache);
  await context.setOffline(true);
  await page.reload();
  await page.locator('#settings-button').click();
  await expect(page.locator('.credits')).toContainText(`Version ${release.version}`);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('ashen-company-save-v1')));
  expect(after.seed).toBe(before.seed);
  expect(after.party.map(p => p.id)).toEqual(before.party.map(p => p.id));
  expect(errors).toEqual([]);
});
