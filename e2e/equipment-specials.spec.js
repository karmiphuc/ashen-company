import { test, expect } from '@playwright/test';
import * as game from '../src/engine.js';
function savedFight(){
 const state=game.createGame(7391),p=state.party[0];p.level=30;p.equipment.weapon='arming-sword';p.equipment.shield='bb-craftable-schrat-shield';p.armorDurability.shield=20;p.equipment.attachment='bone-platings';p.armorDurability.attachment=55;
 const site=game.getCampSites(state)[0];state.position={x:site.x,y:site.y};game.startBattle(state,site.id);const b=state.battle,bro=b.units.find(u=>u.id===p.id),enemy=b.units.find(u=>u.side==='enemy');
 for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
 for(const [i,u]of b.units.entries()){u.q=i+1;u.r=13;if(u!==bro&&u!==enemy){u.hp=0;u.alive=false;u.ap=0;}}
 Object.assign(bro,{q:5,r:5,meleeDefense:0,rangedDefense:0});Object.assign(enemy,{q:6,r:5,meleeSkill:200,turnStartedRound:b.round,ap:4,fatigue:enemy.maxFatigue-11,skillPreference:'damage',tacticalRole:'frontliner'});enemy.equipment.weapon='arming-sword';enemy.equipment.shield=null;enemy.shieldDurability=0;b.activeId=enemy.id;b.turnIndex=b.turnOrder.indexOf(enemy.id);b.rng=0;
 return game.validateSave(state);
}
test('iPad shows compact Bone/Living Shield indicators and preserves spent charge after reload',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.setViewportSize({width:1024,height:768});await page.addInitScript(state=>window.effectsSave=state,savedFight());
 await page.route('**/equipment-effects-harness.html',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="./src/style.css"><link rel="stylesheet" href="./src/campaign.css"><link rel="stylesheet" href="./src/battle.css"></head><body><main id="effects"></main><script type="module">
 import * as game from './src/engine.js';import {battleHTML} from './src/battle-view.js';
 window.effectsState=game.validateSave(JSON.parse(localStorage.getItem('effects-save')??JSON.stringify(window.effectsSave)));
 window.renderEffects=()=>document.querySelector('#effects').innerHTML=battleHTML(window.effectsState.battle);
 window.strike=()=>{game.advanceBattle(window.effectsState);localStorage.setItem('effects-save',JSON.stringify(window.effectsState));window.renderEffects();};window.renderEffects();
 </script></body></html>`}));
 await page.goto('equipment-effects-harness.html');const ready=page.locator('.battle-status-bone-plating'),living=page.locator('.battle-status-living-shield');await expect(ready).toHaveAttribute('aria-label',/Bone Platings ready/);await expect(living).toHaveAttribute('aria-label',/\+20 durability/);const size=await ready.boundingBox();expect(size.width).toBeLessThanOrEqual(24);expect(size.height).toBeLessThanOrEqual(24);
 await page.evaluate(()=>window.strike());await expect(page.locator('.battle-status-bone-plating-spent')).toHaveAttribute('aria-label',/refreshes next battle/);await expect(ready).toHaveCount(0);expect(await page.evaluate(()=>window.effectsState.battle.lastEvent.hpDamage)).toBe(0);
 await page.reload();await expect(page.locator('.battle-status-bone-plating-spent')).toBeVisible();await expect(living).toBeVisible();expect(errors).toEqual([]);
});
