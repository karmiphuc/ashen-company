import { test, expect } from '@playwright/test';
import * as game from '../src/engine.js';
import { encodeBoundedForgeItem, extractForgeAffixes } from '../src/reforged-items.js';

function readyForge(){
 const state=game.createGame(19),catalog=id=>game.ITEMS.find(item=>item.id===id);
 state.position={x:745,y:400};state.inventory=Array.from({length:5},(_,i)=>game.createFamedItemId('arming-sword',i,3));state.inventoryCondition=state.inventory.map(()=>null);
 game.checkBlacksmithDiscovery(state);game.acknowledgeBlacksmithSummons(state);game.acceptBlacksmithQuest(state,1);state.cargo={iron:8,timber:6};state.supplies.tools=10;game.turnInBlacksmithQuest(state,1);
 for(let stage=2;stage<=4;stage++){
  game.acceptBlacksmithQuest(state,stage);const site=game.getBlacksmithQuestEncounters(state)[0];state.position={x:site.x,y:site.y};game.startBattle(state,site.id);
  for(const unit of state.battle.units.filter(u=>u.side==='enemy')){unit.hp=0;unit.alive=false;}
  game.resolveBattle(state);game.finishBattle(state);state.position={x:745,y:400};game.turnInBlacksmithQuest(state,stage);
 }
 const donor=game.createFamedItemId('mail-shirt',73,3),recipient=encodeBoundedForgeItem('mail-shirt',{locked:false,foundation:{armorPct:10,weight:1},prefixes:[{id:'hearty',profile:{healthPct:5}},{id:'unyoked',profile:{actionPoints:1}}],suffixes:[{id:'vitality',profile:{maxHp:5}},{id:'guard',profile:{meleeDefense:2}}]},catalog);
 state.inventory=[donor,recipient];state.inventoryCondition=state.inventory.map(id=>game.getItem(id).armor);state.gold=50000;state.cargo={iron:10,timber:10,wool:10};
 return {state:game.validateSave(state),profile:extractForgeAffixes(game.getItem(donor),catalog).foundation};
}

test('forge shows and preserves legacy workmanship even when all affix slots are full',async({page})=>{
 const {state,profile}=readyForge(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(save=>{if(!localStorage.getItem('ashen-company-save-v1'))localStorage.setItem('ashen-company-save-v1',save);},JSON.stringify(state));
 await page.goto('./');await page.locator('.world-sidebar [data-action="legendary-blacksmith"]').click();
 await page.locator('[data-forge-select="donor"][data-forge-index="0"]').click();
 await page.locator('[data-forge-select="recipient"][data-forge-index="1"]').click();
 await expect(page.locator('.forge-preview')).toContainText('Prefix 2/2');await expect(page.locator('.forge-preview')).toContainText('Suffix 2/2');
 const additions=page.locator('.forge-preview details').filter({hasText:'Possible additions'});
 await additions.locator('summary').click();await expect(additions).toContainText('Craftsmanship');await expect(additions).toContainText('Protection');
 await expect(page.locator('[data-action="forge-confirm"]')).toBeEnabled();await page.locator('[data-action="forge-confirm"]').click();
 await page.locator('[data-action="forge-commit"]').click();await expect(page.locator('.forge-success')).toContainText('Craftsmanship');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('ashen-company-save-v1')));
 expect(after.inventory).toHaveLength(1);const result=game.getItem(after.inventory[0]);
 for(const [key,n]of Object.entries(profile))expect(result.forgeAffixes.foundation[key]).toBeGreaterThanOrEqual(n);
 expect(result.forgeAffixes.prefixes).toHaveLength(2);expect(result.forgeAffixes.suffixes).toHaveLength(2);
 await page.reload();expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('ashen-company-save-v1')))).inventory).toEqual(after.inventory);
 expect(errors).toEqual([]);
});
