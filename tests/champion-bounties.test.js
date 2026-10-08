import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/engine.js';
import {battleResultsHTML,retinueHTML} from '../src/campaign-ui.js';
import {CHAMPION_BOUNTY} from '../src/discovery.js';
function fight(hired=true){
 for(let seed=1;seed<=100;seed++){
  const state=e.createGame(seed);state.retinue.bountyHunterUnlocked=true;state.retinue.bountyHunter=hired;
  const site=e.getCampSites(state).find(s=>s.difficulty===3&&s.enemies.some(u=>u.champion)&&s.enemies.some(u=>!u.champion));
  if(!site)continue;state.position={x:site.x,y:site.y};assert.ok(e.startBattle(state,site.id).ok);return state;
 }
 assert.fail('champion fixture');
}
function win(state){for(const u of state.battle.units.filter(u=>u.side==='enemy')){u.alive=false;u.hp=0;}const actor=state.battle.units.find(u=>u.side==='company');state.battle.activeId=actor.id;state.battle.turnIndex=state.battle.turnOrder.indexOf(actor.id);e.advanceBattle(state);assert.equal(state.battle.status,'victory');}
test('Bounty Hunter pays once per slain champion and quote survives reload and donation',()=>{
 let state=fight();assert.equal(e.getBattleChampionBounty(state),0);const kills=state.battle.units.filter(u=>u.champion).length;win(state);
 const base=state.battle.loot.gold,expected=base+kills*CHAMPION_BOUNTY,gold=state.gold;
 assert.equal(e.getBattleChampionBounty(state),kills*300);assert.equal(e.getBattleLootGold(state),expected);
 assert.match(battleResultsHTML(state),new RegExp(`Bounty Hunter: ${kills*300} crowns included`));
 state=e.validateSave(structuredClone(state));assert.equal(e.getBattleLootGold(state),expected);
 assert.ok(e.finishBattle(state,{shareLootIndices:state.battle.loot.items.map((_,i)=>i)}).ok);assert.equal(state.gold,gold+expected);
 assert.equal(e.finishBattle(state).ok,false);assert.equal(state.gold,gold+expected);e.validateSave(structuredClone(state));
});
test('Scavenger multiplies ordinary spoils, not champion bounties',()=>{
 const state=fight();state.retinue.members.push('scavenger');win(state);state.battle.loot.gold=101;
 assert.equal(e.getBattleLootGold(state),126+e.getBattleChampionBounty(state));const gold=state.gold,quote=e.getBattleLootGold(state);e.finishBattle(state);assert.equal(state.gold,gold+quote);
});
test('unhired Bounty Hunter does not pay champion bounties',()=>{
 const state=fight(false);win(state);assert.equal(e.getBattleChampionBounty(state),0);assert.equal(e.getBattleLootGold(state),state.battle.loot.gold);
});
test('escaped champions pay nothing even when victory is won',()=>{
 const state=fight();const enemy=state.battle.units.find(u=>u.champion);enemy.escaped=true;enemy.firstFleeRound=1;enemy.fleeRound=2;enemy.fleeRollRound=2;state.battle.round=2;
 win(state);const dead=state.battle.units.filter(u=>u.champion&&!u.escaped).length;assert.equal(e.getBattleChampionBounty(state),dead*300);e.validateSave(structuredClone(state));
});
test('retreats and defeats do not pay or permit repeat bounty collection',()=>{
 const state=fight();const enemy=state.battle.units.find(u=>u.champion);enemy.alive=false;enemy.hp=0;e.retreatBattle(state);
 const gold=state.gold;assert.equal(e.getBattleChampionBounty(state),0);assert.ok(e.finishBattle(state).ok);assert.equal(state.gold,gold);
 const defeated=fight();win(defeated);defeated.battle.status='defeat';assert.equal(e.getBattleChampionBounty(defeated),0);
});
test('hard-tier elites gain 20 resolve and champions gain a further 40',()=>{
 const state=fight();const units=state.battle.units.filter(u=>u.side==='enemy');
 for(const u of units){const bonus=(e.getItem(u.equipment.armor)?.statBonuses?.resolve??0)+(e.getItem(u.equipment.helmet)?.statBonuses?.resolve??0);assert.equal(u.resolve,32+3*8+(state.battle.veteranRank??0)*4+20+(u.champion?40:0)+bonus);}
 assert.deepEqual(e.validateSave(structuredClone(state)),state);
 const legacy=structuredClone(state);for(const u of legacy.battle.units.filter(u=>u.side==='enemy'))u.resolve-=20+(u.champion?20:0);
 assert.deepEqual(e.validateSave(legacy),legacy,'already-started fights keep saved resolve');
});
test('retinue card explains the fixed bounty alongside its existing chance bonus',()=>{
 const state=fight();assert.equal(e.getRetinue(state).championBounty,300);const html=retinueHTML(state);assert.match(html,/300 crowns per champion/);assert.match(html,/Champion chance \+5 points/);
});
