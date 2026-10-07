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

test('the existing Armorer exposes Direwolf tabs and saves both crafting transactions', async ({ page }) => {
  const state = createGame(51);
  state.gold = 3000;
  state.inventory = ['bb-ancient-plate-harness', 'bb-ancient-plate-harness', 'bb-ancient-plate-harness', 'bb-werewolf-hide-armor', 'bb-werewolf-mail-armor'];
  state.inventoryCondition = [0, 90, 100, 0, 0];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(save => {
    if (!localStorage.getItem('ashen-company-save-v1')) localStorage.setItem('ashen-company-save-v1', save);
  }, JSON.stringify(state));
  await page.goto('./');
  await page.locator('[data-action="town"]').click();
  await page.locator('[data-action="ancient-armorer"]').click();
  await expect(page.getByRole('navigation', { name: 'Armorer recipes' })).toContainText('Direwolf fusion');
  await page.locator('[data-ancient-design="bb-ancient-plate-harness"]').click();
  await page.locator('[data-action="ancient-confirm"]').click();
  await expect(page.locator('.ancient-confirmation')).toContainText('620 crowns');
  await expect(page.locator('.ancient-confirmation')).toContainText('310 crowns refunded');
  await page.locator('[data-action="ancient-commit"]').click();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('ashen-company-save-v1')));
  expect(restored.ancientRestorationSerial).toBe(1);
  expect(restored.inventory).not.toContain('bb-ancient-plate-harness');
  expect([2380, 2690]).toContain(restored.gold);
  await page.locator('[data-action="ancient-armorer"]').click();
  await page.locator('[data-action="direwolf-helmets"]').click();
  await expect(page.locator('#modal')).toContainText('Direwolf Leather Hood');
  await page.locator('[data-action="direwolf-armorer"]').click();
  await page.locator('[data-action="direwolf-confirm"]').click();
  await page.locator('[data-action="direwolf-commit"]').click();
  await expect(page.locator('.ancient-result')).toContainText('fully repaired');
  const crafted = await page.evaluate(() => JSON.parse(localStorage.getItem('ashen-company-save-v1')));
  expect(crafted.gold).toBe(restored.gold - 600);
  expect(crafted.inventory.some(id => id.includes('direwolf-moonfang-harness'))).toBe(true);
  expect(crafted.inventory).not.toContain('bb-werewolf-hide-armor');
  expect(crafted.inventory).not.toContain('bb-werewolf-mail-armor');
  await page.reload();
  const loaded = await page.evaluate(() => JSON.parse(localStorage.getItem('ashen-company-save-v1')));
  expect(loaded.inventory).toEqual(crafted.inventory);
  expect(loaded.gold).toBe(crafted.gold);
  expect(errors).toEqual([]);
});
