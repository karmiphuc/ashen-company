import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createGame } from '../src/engine.js';

test('built release boots, preserves its company and works offline with the exact cache', async ({ page, context }) => {
  const release = JSON.parse(await readFile(new URL('../dist/release.json', import.meta.url), 'utf8'));
  const worker = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  const cache = JSON.parse(worker.match(/^const CACHE = (.*);$/m)[1]);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(save => { if (!localStorage.getItem('ashen-company-save-v1')) localStorage.setItem('ashen-company-save-v1', save); }, JSON.stringify(createGame(51)));
  await page.goto('./');
  await expect(page.locator('#offline-status')).toHaveText('Offline ready', { timeout:60000 });
  expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)).toBe('http://127.0.0.1:4174/ashen-company/');
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

test('an open older build updates only after caching and preserves its company', async ({ page }) => {
  const root = new URL('../dist/', import.meta.url);
  const receipt = JSON.parse(await readFile(new URL('release.json', root), 'utf8'));
  const workerPath = new URL('sw.js', root), modulePath = new URL('src/release.js', root);
  const worker = await readFile(workerPath, 'utf8'), module = await readFile(modulePath, 'utf8');
  const older = `${receipt.version}-previous`;
  const oldWorker = worker.replace(/^const CACHE = .*;$/m, 'const CACHE = "ashen-company-update-fixture";');
  const oldModule = module.replace(JSON.stringify(receipt.version), JSON.stringify(older));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await writeFile(workerPath, oldWorker);await writeFile(modulePath, oldModule);
    await page.addInitScript(save => { if (!localStorage.getItem('ashen-company-save-v1')) localStorage.setItem('ashen-company-save-v1', save); }, JSON.stringify(createGame(52)));
    await page.goto('./');
    await expect(page.locator('#offline-status')).toHaveText('Offline ready', { timeout:60000 });
    await page.locator('#settings-button').click();
    await expect(page.locator('.credits')).toContainText(`Version ${older}`);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('ashen-company-save-v1')));
    await writeFile(modulePath, module);await writeFile(workerPath, worker);
    // The new worker saves the open game before navigating to the cached build.
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.ready;await registration.update(); });
    await page.waitForFunction(() => !document.querySelector('#modal')?.open);
    await expect(page.locator('#offline-status')).toHaveText('Offline ready');
    await page.locator('#settings-button').click();
    await expect(page.locator('.credits')).toContainText(`Version ${receipt.version} ·`);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('ashen-company-save-v1')));
    expect(after.seed).toBe(before.seed);
    expect(after.party).toEqual(before.party);
    expect(errors).toEqual([]);
  } finally {
    // The artifact uploaded to Pages is always the original tested production build.
    await writeFile(workerPath, worker);await writeFile(modulePath, module);
  }
});
