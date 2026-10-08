import { test, expect } from '@playwright/test';
import { createGame, validateSave, trainAttributes, learnPerk, getPerkChoices } from '../src/engine.js';

test('tablet roster halves its height and highlights only unspent progression', async ({ page }) => {
  let state = createGame(7391);
  state.party[0].level = 2;
  state.party[0].trainingPoints = 1;
  delete state.party[0].pendingLevelUps;
  state = validateSave(state);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.addInitScript(save => {
    if (!localStorage.getItem('ashen-company-save-v1')) localStorage.setItem('ashen-company-save-v1', save);
  }, JSON.stringify(state));
  await page.goto('./');
  const card = page.locator(`[data-person="${state.party[0].id}"]`).first();
  await expect(card).toHaveClass(/progression-ready/);
  await expect(card).toHaveAttribute('title', 'Level-up available; Perk available');
  await expect(card).toHaveCSS('border-top-color', 'rgb(183, 243, 74)');
  for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 1366, height: 1024 }]) {
    await page.setViewportSize(viewport);
    expect((await page.locator('.company-strip').boundingBox()).height).toBe(66);
    expect((await card.boundingBox()).height).toBe(55);
    const portrait = await card.locator('.bb-portrait').boundingBox();
    expect(portrait.height).toBeLessThan(40);
    expect(portrait.width / portrait.height).toBeCloseTo(80 / 109, 2);
    expect(portrait.y + portrait.height).toBeLessThanOrEqual((await card.locator('.mini-name').boundingBox()).y + 1);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  expect((await page.locator('.company-strip').boundingBox()).height).toBe(132);
  expect(trainAttributes(state, state.party[0].id, ['maxHp', 'meleeSkill', 'resolve']).ok).toBe(true);
  await page.addInitScript(save => localStorage.setItem('ashen-company-save-v1', save), JSON.stringify(state));
  await page.reload();
  await expect(card).toHaveAttribute('title', 'Perk available');
  expect(learnPerk(state, state.party[0].id, getPerkChoices(state.party[0])[0].id).ok).toBe(true);
  await page.addInitScript(save => localStorage.setItem('ashen-company-save-v1', save), JSON.stringify(state));
  await page.reload();
  await expect(card).not.toHaveClass(/progression-ready/);
  await expect(card).not.toHaveAttribute('title');
});
