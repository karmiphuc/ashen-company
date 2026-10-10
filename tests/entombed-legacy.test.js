import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {LEGACY_SET_SLOTS,LEGACY_TOMB_STAGES} from '../src/entombed-legacy.js';
import {entombedCompany} from './fixtures/entombed-company.mjs';
const reload=s=>g.validateSave(JSON.parse(JSON.stringify(s)));
const at=(s,id)=>{const t=g.SETTLEMENTS.find(t=>t.id===id);s.position={x:t.x,y:t.y};s.destination=null;s.destinationAction=null;};
function inherited(){const {state,indices}=entombedCompany();const q=g.getLegacySetRetirementQuote(state,indices);assert.equal(q.ok,true,q.message);const r=g.createLegacyCampaign(state,q,91);assert.equal(r.ok,true,r.message);return r.state;}
function eligible(s){const q=LEGACY_TOMB_STAGES[s.companyLegacy.stage-1];s.day=q.day;s.renown=q.renown;s.shipmentLegacyThroughDay=s.day;}
function enter(s){eligible(s);const site=g.getLegacyTombEncounters(s)[0];assert.ok(site);s.position={x:site.x,y:site.y};s.destination=null;s.destinationAction=null;assert.equal(g.startBattle(s,site.id).ok,true);return site;}
function win(s){for(const u of s.battle.units.filter(u=>u.side==='enemy')){u.hp=0;u.alive=false;}g.resolveBattle(s);assert.equal(s.battle.status,'victory');assert.equal(s.battle.loot.items.length,0);assert.equal(g.finishBattle(s).ok,true);}
function claim(s){const stage=s.companyLegacy.stage;at(s,LEGACY_TOMB_STAGES[stage-1].townId);assert.equal(g.turnInLegacyQuest(s,stage).ok,true);}
test('three complete stash loadouts preserve every named roll and condition while the source and fresh-company balance stay intact',()=>{
 const {state,indices}=entombedCompany(),before=structuredClone(state),quote=g.getLegacySetRetirementQuote(state,indices),r=g.createLegacyCampaign(state,quote,91),baseline=g.createGame(91);
 assert.equal(r.ok,true);assert.deepEqual(state,before);assert.deepEqual(r.state.party,baseline.party);assert.deepEqual(r.state.inventory,baseline.inventory);assert.equal(r.state.gold,baseline.gold);assert.equal(r.state.companyLegacy.version,3);assert.deepEqual(reload(r.state),r.state);
 for(let n=0;n<3;n++)for(const slot of LEGACY_SET_SLOTS){const i=indices[n][slot];assert.deepEqual(r.state.companyLegacy.sets[n][slot],i===null?null:{itemId:state.inventory[i],condition:state.inventoryCondition[i]});}
 const stale=structuredClone(quote);stale.sets[0].armor.condition=0;assert.equal(g.createLegacyCampaign(state,stale).ok,false);state.inventoryCondition[0]--;assert.equal(g.createLegacyCampaign(state,quote).ok,false);
});
test('loadout selection rejects missing/duplicate copies, shield conflicts, ranged gear and premature retirement',()=>{
 const {state,indices}=entombedCompany();for(const mutate of [a=>a.pop(),a=>a[1].mount=a[0].mount,a=>a[0].helmet=null,a=>a[0].shield=null,a=>a[1].shield=a[0].shield,a=>a[0].armor=999,a=>a[0].extra=0,a=>a[0].attachment=null]){const bad=structuredClone(indices);mutate(bad);assert.equal(g.getLegacySetRetirementQuote(state,bad).ok,false);}
 const weaponIndex=indices[0].weapon;state.inventory[weaponIndex]='warbow';assert.equal(g.getLegacySetRetirementQuote(state,indices).ok,false);state.inventory[weaponIndex]='arming-sword';state.ashenWinter.phase='dormant';assert.equal(g.getLegacySetRetirementQuote(state,indices).ok,false);
});
test('three real tomb battles unveil one set each, final cavalry elites wear all exact sets, and no duplicate loot or repeat claims exist',()=>{
 let s=inherited();for(let stage=1;stage<=3;stage++){
  assert.equal(g.getLegacyTombEncounters(s).length,0);assert.equal(g.turnInLegacyQuest(s,stage).ok,false);enter(s);
  const enemies=s.battle.units.filter(u=>u.side==='enemy');assert.equal(enemies.length,LEGACY_TOMB_STAGES[stage-1].size);assert.ok(enemies.every(u=>u.undeadTraitsVersion===1&&u.equipment.mount&&u.morale===60));assert.ok(!s.battle.units.some(u=>u.ally));
  if(stage===3)for(let n=0;n<3;n++){const u=enemies[n],set=s.companyLegacy.sets[n];for(const slot of LEGACY_SET_SLOTS)assert.equal(u.equipment[slot],set[slot]?.itemId??null);assert.equal(u.attachment2Armor,set.attachment2.condition);assert.deepEqual(u.perks,['layered-armor']);assert.equal(u.champion,undefined);}
  s=reload(s);const bad=structuredClone(s);bad.battle.units.find(u=>u.side==='enemy').equipment.weapon='spear';assert.throws(()=>reload(bad),/tomb gear/);
  win(s);assert.equal(s.companyLegacy.defeated,true);s=reload(s);const before=s.inventory.length,entries=Object.values(s.companyLegacy.sets[stage-1]).filter(Boolean);claim(s);assert.equal(s.inventory.length,before+entries.length);assert.deepEqual(s.inventory.slice(-entries.length),entries.map(e=>e.itemId));assert.deepEqual(s.inventoryCondition.slice(-entries.length),entries.map(e=>e.condition));assert.equal(g.turnInLegacyQuest(s,stage).ok,false);s=reload(s);
 }
 assert.equal(s.companyLegacy.stage,4);assert.equal(g.getLegacyTombEncounters(s).length,0);assert.equal(s.companyLegacy.guards,null);
});
test('retreat preserves guardian casualties and component wear without changing the inherited originals',()=>{
 let s=inherited();enter(s);const original=structuredClone(s.companyLegacy.sets),enemies=s.battle.units.filter(u=>u.side==='enemy');enemies[1].hp=0;enemies[1].alive=false;const w=enemies[0];w.hp-=9;w.bodyArmor-=5;w.headArmor-=2;w.attachmentArmor=0;w.attachment2Armor-=2;w.shieldDurability-=2;
 const expected={hp:w.hp,bodyArmor:w.bodyArmor,headArmor:w.headArmor,attachmentArmor:w.attachmentArmor,attachment2Armor:w.attachment2Armor,shieldDurability:w.shieldDurability};assert.equal(g.retreatBattle(s).ok,true);assert.equal(g.finishBattle(s).ok,true);s=reload(s);assert.equal(s.companyLegacy.defeated,false);assert.equal(s.companyLegacy.guards.length,3);enter(s);const retry=s.battle.units.find(u=>u.id==='enemy-1');for(const [key,value] of Object.entries(expected))assert.equal(retry[key],value);assert.ok(!s.battle.units.some(u=>u.id==='enemy-2'));assert.deepEqual(s.companyLegacy.sets,original);assert.deepEqual(reload(s),s);
});
test('full stash keeps an entire unveiled set pending atomically; side quests do not consume contract slots',()=>{
 const s=inherited();enter(s);win(s);at(s,'oakwatch');const offer=g.getContractOffers(s,'oakwatch').find(q=>q.type==='courier');assert.ok(offer);assert.equal(g.acceptContract(s,'oakwatch',offer.id).ok,true);
 const entries=Object.values(s.companyLegacy.sets[0]).filter(Boolean);s.inventory=Array(g.getStashCapacity(s)-entries.length+1).fill('spear');s.inventoryCondition=s.inventory.map(()=>null);const before=structuredClone(s);assert.equal(g.turnInLegacyQuest(s,1).ok,false);assert.deepEqual(s,before);s.inventory.pop();s.inventoryCondition.pop();assert.equal(g.turnInLegacyQuest(s,1).ok,true);assert.ok(s.contract);assert.deepEqual(reload(s),s);
});
test('malformed tomb records and duplicate battle loot fail validation; ordinary old saves remain untouched',()=>{
 const s=inherited();for(const mutate of [l=>l.stage=4,l=>l.sets.pop(),l=>l.sets[0].armor.condition=9999,l=>l.sets[0].shield=null,l=>l.sets[0].mount.itemId='spear',l=>l.extra=1,l=>l.defeated=true,l=>l.guards=[]]){const bad=structuredClone(s);mutate(bad.companyLegacy);assert.throws(()=>reload(bad),/company legacy/);}
 enter(s);const bad=structuredClone(s);bad.battle.loot.items=[s.companyLegacy.sets[0].weapon.itemId];bad.battle.loot.itemConditions=[null];assert.throws(()=>reload(bad),/tomb duplicate loot/);const old=g.createGame(7);assert.deepEqual(reload(old),old);
 g.retreatBattle(s);g.finishBattle(s);const corrupted=structuredClone(s);corrupted.companyLegacy.guards[0].bodyArmor=9999;assert.throws(()=>reload(corrupted),/guard condition/);
});

test('real AI actions and saved retries work in both turn-based and realtime tomb battles',async()=>{
 const {setSimultaneousBetaEnabled}=await import('../src/combat-config.js');
 for(const realtime of [false,true]){
  setSimultaneousBetaEnabled(realtime);
  try{
   let s=inherited();Object.assign(s,{day:60,renown:300,shipmentLegacyThroughDay:60});s.companyLegacy.stage=3;enter(s);
   assert.equal(Boolean(s.battle.simultaneous),realtime);
   for(let i=0;i<150&&s.battle.status==='active';i++){assert.equal(g.advanceBattle(s).ok,true);if(i%10===0)s=reload(s);}
   assert.ok(s.battle.units.some(u=>u.battleStats.hpDamageDealt>0||u.battleStats.armorDamageDealt>0),'actual attacks must resolve');s=reload(s);
   if(s.battle.status==='active')g.retreatBattle(s);assert.equal(g.finishBattle(s).ok,true);s=reload(s);
   if(!s.gameOver&&!s.companyLegacy.defeated){enter(s);assert.deepEqual(reload(s),s);}
  }finally{setSimultaneousBetaEnabled(false);}
 }
});

test('tomb map actions survive travel saves, engage on arrival and do not overlap the solo Frozen Vigil site',()=>{
 let s=inherited();eligible(s);at(s,'oakwatch');const site=g.getLegacyTombEncounters(s)[0];assert.equal(g.activateMapTarget(s,'legacy-tomb',site.id).ok,true);assert.equal(s.destinationAction.type,'legacy-tomb');s=reload(s);
 // Move along the final short approach, then let the real world arrival hook engage.
 s.position={x:site.x-3,y:site.y};assert.equal(g.tick(s,.1).ok,true);assert.equal(s.battle.encounterType,'legacy-tomb');assert.deepEqual(reload(s),s);
 const other=inherited();Object.assign(other,{day:60,renown:300,shipmentLegacyThroughDay:60});other.companyLegacy.stage=3;other.legacyWarrior.stage=4;const tomb=g.getLegacyTombEncounters(other)[0],warrior=g.getLegacyWarriorEncounters(other)[0];assert.notDeepEqual({x:tomb.x,y:tomb.y},{x:warrior.x,y:warrior.y});
});

test('tomb scouting communicates the quest reward and routes its action to the story encounter',async()=>{
 const {campSidebarHTML}=await import('../src/campaign-ui.js');const s=inherited();eligible(s);const site=g.getLegacyTombEncounters(s)[0],html=campSidebarHTML(s,site);assert.match(html,/4 undead cavalry/);assert.match(html,/data-quest-travel="legacy-tomb"/);assert.match(html,/Their gear does not drop/);assert.doesNotMatch(html,/Named loot chance/);
});
