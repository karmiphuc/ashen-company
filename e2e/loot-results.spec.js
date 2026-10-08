import {test,expect} from '@playwright/test';
import {createGame,getCampSites,startBattle,advanceBattle,validateSave,createFamedItemId} from '../src/engine.js';

function results(){
 const state=createGame(7391),camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};startBattle(state,camp.id);
 const b=state.battle,brothers=b.units.filter(u=>u.side==='company'&&!u.ally),dead=brothers[1];dead.hp=0;dead.alive=false;b.casualties=[dead.id];
 for(const enemy of b.units.filter(u=>u.side==='enemy')){enemy.alive=false;enemy.hp=0;}
 const actor=brothers[0];b.activeId=actor.id;b.turnIndex=b.turnOrder.indexOf(actor.id);advanceBattle(state);
 actor.battleStats={kills:3,armorDamageDealt:145,hpDamageDealt:82,armorDamageReceived:51};dead.battleStats={kills:1,armorDamageDealt:75,hpDamageDealt:44,armorDamageReceived:122};
 return {state:validateSave(state),deadId:dead.id};
}
test('loot performance cards stay in two columns on tablets, show casualties first and preserve loot actions',async({page})=>{
 const {state,deadId}=results();await page.addInitScript(save=>localStorage.setItem('ashen-company-save-v1',save),JSON.stringify(state));await page.goto('./');
 const cards=page.locator('.result-company > .result-brother-grid > .result-brother');await expect(cards.first()).toHaveAttribute('data-result-brother',deadId);await expect(cards.first()).toHaveClass(/fallen/);await expect(cards.first().locator('.result-status')).toHaveText('† Fallen');
 await expect(page.locator('[aria-label="Armor damage dealt to enemies: 145"]')).toBeVisible();await expect(page.locator('[aria-label="Hitpoint damage dealt to enemies: 82"]')).toBeVisible();await expect(page.locator('[aria-label="Armor damage received: 51"]')).toBeVisible();
 for(const viewport of [{width:1024,height:768},{width:768,height:1024},{width:1366,height:1024},{width:390,height:844}]){
  await page.setViewportSize(viewport);const first=await cards.nth(0).boundingBox(),second=await cards.nth(1).boundingBox();expect(Math.abs(first.y-second.y)).toBeLessThan(2);expect(second.x).toBeGreaterThan(first.x+first.width);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  for(const metric of await cards.nth(1).locator('.result-metric').all())expect(await metric.evaluate(el=>el.scrollWidth<=el.clientWidth+2),`${viewport.width}: ${await metric.getAttribute('aria-label')}`).toBeTruthy();
 }
 await page.setViewportSize({width:1024,height:768});await page.screenshot({path:'/tmp/loot-performance-tablet.png',fullPage:true});
 const actions=page.locator('.loot-actions');await expect(actions).toBeVisible();await expect(actions.locator('button')).toHaveCount(4);await expect(page.locator('[data-action="keep-named-loot"]')).toBeDisabled();expect(await actions.evaluate(el=>el.closest('.result-panel').querySelector('h2').textContent)).toBe('Spoils of war');
 await page.locator('[data-action="finish-battle"]').click();await expect(page.locator('.battle-results')).toHaveCount(0);
});

test('★ Keep named keeps named weapons and armor while donating unticked regular loot',async({page})=>{
 const {state}=results(),weapon=createFamedItemId('arming-sword',42),armor=createFamedItemId('mail-shirt',13);
 state.battle.loot.items=['wood-axe',weapon,weapon,armor];state.battle.loot.itemConditions=[null,null,null,31];const owned=state.inventory.filter(id=>id==='wood-axe').length;
 await page.addInitScript(save=>localStorage.setItem('ashen-company-save-v1',save),JSON.stringify(validateSave(state)));await page.goto('./');
 await expect(page.locator('.loot-actions > button')).toHaveCount(4);const shortcut=page.locator('[data-action="keep-named-loot"]');await expect(shortcut).toBeEnabled();
 await page.locator('[data-keep-loot="0"]').check();await shortcut.click();await expect(page.locator('.battle-results')).toHaveCount(0);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ashen-company-save-v1')));expect(saved.inventory.filter(id=>id===weapon)).toHaveLength(2);expect(saved.inventory).toContain(armor);expect(saved.inventoryCondition[saved.inventory.indexOf(armor)]).toBe(31);expect(saved.inventory.filter(id=>id==='wood-axe')).toHaveLength(owned);
 expect(saved.battle).toBeNull();expect(validateSave(saved)).toEqual(saved);
});
