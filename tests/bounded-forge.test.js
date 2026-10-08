import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import { encodeForgeItem, encodeBoundedForgeItem, extractForgeAffixes, flattenForgeAffixes, forgeAffixOptions, forgeRecipe, forgeAffixName } from '../src/reforged-items.js';
import { perkFlags, equipmentBoost } from '../src/item-affixes.js';
import { blacksmithPanelHTML, forgeConfirmationHTML, forgeSuccessHTML } from '../src/blacksmith-ui.js';
import { getItemDetails } from '../src/item-details.js';
const catalog=id=>game.ITEMS.find(i=>i.id===id);
const prefix=(id,key,n)=>({id,profile:{[key]:n}});
const suffix=prefix;
const packageOf=({foundation={},prefixes=[],suffixes=[],locked=false}={})=>({locked,foundation,prefixes,suffixes});
const forged=(base,parts)=>game.getItem(encodeBoundedForgeItem(base,packageOf(parts),catalog));
let snapshot;
function ready(){
 if(!snapshot){
  const s=game.createGame(19);s.position={x:745,y:400};s.inventory=Array.from({length:5},(_,i)=>game.createFamedItemId('arming-sword',i,3));s.inventoryCondition=s.inventory.map(()=>null);
  game.checkBlacksmithDiscovery(s);game.acceptBlacksmithQuest(s,1);s.cargo={iron:8,timber:6};s.supplies.tools=10;game.turnInBlacksmithQuest(s,1);
  for(let stage=2;stage<=4;stage++){
   assert.ok(game.acceptBlacksmithQuest(s,stage).ok);const site=game.getBlacksmithQuestEncounters(s)[0];s.position={x:site.x,y:site.y};assert.ok(game.startBattle(s,site.id).ok);
   for(const u of s.battle.units.filter(u=>u.side==='enemy')){u.hp=0;u.alive=false;}game.resolveBattle(s);game.finishBattle(s);s.position={x:745,y:400};assert.ok(game.turnInBlacksmithQuest(s,stage).ok);
  }
  s.gold=50000;s.cargo={iron:10,timber:10,wool:10};snapshot=game.validateSave(s);
 }
 return structuredClone(snapshot);
}
function stash(s,items){s.inventory=items.map(i=>typeof i==='string'?i:i.id);s.inventoryCondition=s.inventory.map(id=>{const i=game.getItem(id);return i.slot==='shield'?game.shieldMaximum(id):i.throwing?game.throwingCapacity(i):i.armor??null;});}
function quote(s){return game.getReforgeQuote(s,0,1,['named','famed'].includes(game.getItem(s.inventory[1]).rarity)?'merge':'transfer');}
function commit(s){const q=quote(s);assert.ok(q.ok,q.message);const r=game.reforgeItem(s,q);assert.ok(r.ok,r.message);assert.deepEqual(game.validateSave(s),s);return {q,r,item:game.getItem(r.itemId)};}

test('every catalog named package round-trips without changing its complete bonus profile',()=>{
 let checked=0;
 for(const b of game.ITEMS.filter(i=>['weapon','armor','helmet','shield'].includes(i.slot)))for(const version of [3,5,7])for(const seed of [0,73,0xffffffff]){
  const original=game.getItem(game.createFamedItemId(b.id,seed,version)),a=extractForgeAffixes(original,catalog,{shieldMaximum:game.shieldMaximum,shieldDamage:game.shieldImpactDamage});
  const restored=game.getItem(encodeBoundedForgeItem(b.id,a,catalog));assert.ok(restored,b.id);assert.deepEqual(restored.forgeProfile,flattenForgeAffixes(a));
  assert.ok(Object.isFrozen(restored.forgeAffixes.foundation));assert.ok(restored.forgeAffixes.prefixes.every(p=>Object.isFrozen(p.profile)));checked++;
 }
 assert.ok(checked>3000);
});

test('bounded identities reject extra slots, duplicate families and forged bundles of unrelated effects',()=>{
 const valid=packageOf({prefixes:[prefix('bloodrush','berserkAp',1),prefix('unyoked','actionPoints',1)],suffixes:[suffix('precision','accuracy',4),{id:'slaying',profile:{damageLow:5,damageHigh:5}}]});
 const id=encodeBoundedForgeItem('arming-sword',valid,catalog);assert.ok(game.getItem(id));
 for(const mutate of [a=>a.prefixes.push(prefix('longshot','rangedReach',1)),a=>a.suffixes.push(suffix('ruin','armorDamage',5)),a=>a.prefixes[1]=a.prefixes[0],a=>a.suffixes[0].profile.damagePct=200,a=>a.prefixes[0].profile.actionPoints=1,a=>a.foundation.actionPoints=1,a=>a.prefixes[1].profile.actionPoints=2]){
  const a=structuredClone(valid);mutate(a);assert.throws(()=>encodeBoundedForgeItem('arming-sword',a,catalog));
 }
 for(const bad of [id+'x',id.replace('unyoked','unknown'),id.replace('6-4','06-4'),id.replace(':n:',':l:'),id.replace(':arming-sword:',':war-horse:')])assert.equal(game.getItem(bad),undefined);
});

test('duplicates upgrade as complete rolls at full slots, never add, and craftsmanship stays fixed',()=>{
 const s=ready(),recipient=forged('mail-shirt',{foundation:{armorPct:20,weight:3},prefixes:[prefix('hearty','healthPct',5),prefix('unyoked','actionPoints',1)],suffixes:[suffix('vitality','maxHp',5),suffix('guard','meleeDefense',2)]});
 const donor=forged('mail-shirt',{foundation:{armorPct:25,weight:6},prefixes:[prefix('hearty','healthPct',15)],suffixes:[suffix('vitality','maxHp',9)]});
 stash(s,[donor,recipient]);let item=commit(s).item;stash(s,[donor,item]);if(quote(s).ok)item=commit(s).item;
 assert.deepEqual(item.forgeAffixes.foundation,{armorPct:20,weight:3});assert.equal(item.perkBoosts.healthPct,15);assert.equal(item.statBonuses.maxHp,9);
 assert.equal(item.forgeAffixes.prefixes.length,2);assert.equal(item.forgeAffixes.suffixes.length,2);
 stash(s,[donor,item]);const before=structuredClone(s);assert.equal(quote(s).ok,false);assert.deepEqual(s,before);
});

test('a distinct third prefix or suffix cannot be merged into a full item',()=>{
 const s=ready(),full=forged('arming-sword',{prefixes:[prefix('bloodrush','berserkAp',1),prefix('unyoked','actionPoints',1)],suffixes:[suffix('precision','accuracy',4),suffix('ruin','armorDamage',10)]});
 const third=forged('arming-sword',{prefixes:[prefix('concussive','dazeHead',1)],suffixes:[{id:'slaying',profile:{damageLow:5,damageHigh:5}}]});stash(s,[third,full]);
 const before=structuredClone(s),q=quote(s);assert.equal(q.ok,false);assert.match(q.message,/slots are full/);assert.deepEqual(s,before);
 const html=blacksmithPanelHTML(s,{donor:0,recipient:1});assert.match(html,/Prefix 2\/2 · Full/);assert.match(html,/Suffix 2\/2 · Full/);assert.match(html,/Why these affixes cannot merge/);assert.match(html,/Slots full/);
});

test('different free masteries occupy the same prefix family and cannot stack on one item',()=>{
 const sword=forged('arming-sword',{prefixes:[prefix('masterful','perkFlags',perkFlags(['sword-training']))]}),axe=forged('arming-sword',{prefixes:[prefix('masterful','perkFlags',perkFlags(['axe-training']))]});
 const s=ready();stash(s,[axe,sword]);assert.equal(quote(s).ok,false);
 assert.throws(()=>forged('arming-sword',{prefixes:[prefix('masterful','perkFlags',perkFlags(['sword-training','axe-training']))]}));
});

test('free mastery prefixes cannot waste a merge on a weapon that cannot use them',()=>{
 const source=forged('arming-sword',{prefixes:[prefix('masterful','perkFlags',perkFlags(['axe-training']))]}),recipient=forged('greatsword',{foundation:{damagePct:20}});
 const s=ready();stash(s,[source,recipient]);assert.equal(quote(s).ok,false);
 const options=forgeAffixOptions(source.forgeAffixes,recipient.forgeAffixes,recipient);assert.match(options[0].reason,/matching its mastery/);
 const axe=forged('hand-axe',{foundation:{damagePct:20}});stash(s,[source,axe]);assert.equal(quote(s).ok,true);
});

test('light-gear eligibility uses the recipient actual forged weight, not its unrolled base',()=>{
 const source=forged('cloth-hood',{prefixes:[prefix('farseeing','rangedRange',1)]}),recipient=forged('greathelm',{foundation:{weight:6}});
 const s=ready();stash(s,[source,recipient]);assert.equal(recipient.fatigue,14);const q=quote(s);assert.ok(q.ok,q.message);assert.equal(q.result.rangedRangeBonus,1);assert.equal(q.result.fatigue,14);
});

test('inactive affixes keep their slots through cross-class transfers and reactivate later',()=>{
 const s=ready(),bow=forged('hunting-bow',{prefixes:[prefix('longshot','rangedReach',1),prefix('trueflight','rangedHit',8)],suffixes:[suffix('precision','accuracy',4)]});
 stash(s,[bow,'greatsword']);const sword=commit(s).item;assert.equal(sword.forgeAffixes.prefixes.length,2);assert.ok(sword.bonuses.some(r=>r.value.includes('inactive')));
 const newPrefix=forged('arming-sword',{prefixes:[prefix('bloodrush','berserkAp',1)]});stash(s,[newPrefix,sword]);assert.equal(quote(s).ok,false);
 stash(s,[sword,'hunting-bow']);const restored=commit(s).item;assert.deepEqual(restored.forgeAffixes,bow.forgeAffixes);assert.ok(restored.bonuses.every(r=>!r.value.includes('inactive')));
});

test('legacy flat forge profiles retain strength and cannot escape the merge lock by transferring',()=>{
 const s=ready(),legacy=game.getItem(encodeForgeItem('arming-sword',{damagePct:150,accuracy:80,berserkAp:2},catalog)),modern=forged('arming-sword',{prefixes:[prefix('unyoked','actionPoints',1)]});
 for(const pair of [[legacy,modern],[modern,legacy]]){stash(s,pair);const before=structuredClone(s);assert.match(quote(s).message,/Legacy/);assert.deepEqual(s,before);}
 stash(s,[legacy,'spear']);const moved=commit(s).item;assert.deepEqual(moved.forgeProfile,legacy.forgeProfile);assert.equal(moved.forgeAffixes.locked,true);
 stash(s,[moved,'arming-sword']);const returned=commit(s).item;assert.equal(returned.forgeAffixes.locked,true);assert.deepEqual(returned.forgeProfile,legacy.forgeProfile);
 stash(s,[modern,returned]);assert.equal(quote(s).ok,false);
});

test('free first use waives materials and gold, later recipes consume cargo and origin records exactly',()=>{
 const s=ready(),donor=forged('mail-shirt',{prefixes:[prefix('unyoked','actionPoints',1),prefix('mending','perkFlags',perkFlags(['combat-bandaging']))],suffixes:[suffix('vigor','endurance',7)]});
 s.cargo={};s.gold=0;stash(s,[donor,'mail-shirt']);const first=commit(s).q;assert.deepEqual(first.materials,{});assert.equal(first.fee,0);assert.deepEqual(s.cargo,{});
 s.gold=1000;s.cargo={iron:3,wool:2};s.cargoOrigins={iron:[{townId:'ironford',count:1},{townId:'oakwatch',count:2}],wool:[{townId:'greyhaven',count:2}]};stash(s,[donor,'mail-shirt']);
 const paid=commit(s).q;assert.deepEqual(paid.materials,{iron:3,wool:2});assert.deepEqual(s.cargo,{});assert.deepEqual(s.cargoOrigins,{});assert.equal(s.gold,0);
});

test('missing goods, insufficient gold, stale cargo and stale origins fail atomically',()=>{
 const donor=forged('arming-sword',{prefixes:[prefix('unyoked','actionPoints',1)]});
 for(const situation of ['missing','poor','stale-cargo','stale-origins']){
  const s=ready();s.legendaryBlacksmith.freeUse=false;s.legendaryBlacksmith.forgeSerial=1;s.cargo={iron:3};stash(s,[donor,'arming-sword']);
  if(situation==='missing')s.cargo={};if(situation==='poor')s.gold=999;
  const q=quote(s);assert.ok(q.ok);
  if(situation==='stale-cargo')s.cargo.iron=2;if(situation==='stale-origins')s.cargoOrigins={iron:[{townId:'ironford',count:1}]};
  const before=structuredClone(s);assert.equal(game.reforgeItem(s,q).ok,false);assert.deepEqual(s,before);assert.deepEqual(game.validateSave(s),s);
 }
});

test('displayed recipe is independent of random selection and quote tampering cannot waive cargo',()=>{
 const donor=forged('arming-sword',{prefixes:[prefix('unyoked','actionPoints',1),prefix('bloodrush','berserkAp',1)],suffixes:[suffix('precision','accuracy',4),suffix('ruin','armorDamage',5)]}),recipient=forged('arming-sword',{foundation:{damagePct:20}});
 let expected;const results=new Set();
 for(let seed=1;seed<=20;seed++){
  const s=ready();s.seed=seed;s.legendaryBlacksmith.freeUse=false;s.legendaryBlacksmith.forgeSerial=1;stash(s,[donor,recipient]);const q=quote(s);assert.ok(q.ok);expected??=q.materials;assert.deepEqual(q.materials,expected);results.add(q.additions.length);
 }
 assert.ok(results.size>1);
 const s=ready();s.legendaryBlacksmith.freeUse=false;s.legendaryBlacksmith.forgeSerial=1;stash(s,[donor,recipient]);const q=quote(s),before={...s.cargo};q.materials={};q.affordable=true;assert.ok(game.reforgeItem(s,q).ok);for(const [id,n]of Object.entries(expected))assert.equal(s.cargo[id],before[id]-n);
});

test('long forging sequences remain bounded through save reloads and repeated identical donors stop improving',()=>{
 let s=ready();s.gold=200000;let recipient=forged('mail-shirt',{foundation:{armorPct:20,weight:3}}),successes=0;
 const donors=[forged('mail-shirt',{prefixes:[prefix('hearty','healthPct',5)],suffixes:[suffix('vitality','maxHp',5)]}),forged('mail-shirt',{prefixes:[prefix('unyoked','actionPoints',1)],suffixes:[suffix('guard','meleeDefense',2)]}),forged('mail-shirt',{prefixes:[prefix('hearty','healthPct',15)],suffixes:[suffix('vitality','maxHp',9)]}),forged('mail-shirt',{prefixes:[prefix('bloodrush','berserkAp',1)],suffixes:[suffix('resolve','resolve',7)]})];
 for(let n=0;n<60;n++){
  s.cargo={iron:10,wool:10,timber:10};stash(s,[donors[n%donors.length],recipient]);const q=quote(s);
  if(q.ok){recipient=commit(s).item;successes++;}else{const before=structuredClone(s);assert.equal(game.reforgeItem(s,q).ok,false);assert.deepEqual(s,before);}
  assert.ok(recipient.forgeAffixes.prefixes.length<=2);assert.ok(recipient.forgeAffixes.suffixes.length<=2);assert.deepEqual(recipient.forgeAffixes.foundation,{armorPct:20,weight:3});s=game.validateSave(structuredClone(s));
 }
 assert.ok(successes>=2&&successes<=8);assert.ok(recipient.statBonuses.maxHp<=9);assert.ok(recipient.perkBoosts.healthPct<=15);
});

test('two prefixes and suffixes affect equipped stats and combat and survive a battle reload',()=>{
 const s=ready(),armor=forged('mail-shirt',{foundation:{armorPct:20,weight:3},prefixes:[prefix('hearty','healthPct',15),prefix('unyoked','actionPoints',1)],suffixes:[suffix('vitality','maxHp',9),suffix('guard','meleeDefense',4)]});
 const before=game.getCompanyStats(s.party[0]).maxHp;stash(s,[armor]);assert.ok(game.equipItem(s,'captain',armor.id).ok);const p=s.party[0];assert.ok(game.getCompanyStats(p).maxHp>before);assert.equal(equipmentBoost(p,'healthPct',game.getItem),15);
 const site=game.getCampSites(s)[0];s.position={x:site.x,y:site.y};assert.ok(game.startBattle(s,site.id).ok);const actor=s.battle.units.find(u=>u.id==='captain');assert.equal(actor.ap,10);assert.equal(actor.maxHp,game.getCompanyStats(p).maxHp);assert.deepEqual(game.validateSave(structuredClone(s)),s);
});

test('forge UI exposes four slots, required/owned materials and a disabled unaffordable action',()=>{
 const s=ready(),donor=forged('mail-shirt',{prefixes:[prefix('unyoked','actionPoints',1)],suffixes:[suffix('vitality','maxHp',9)]});
 s.legendaryBlacksmith.freeUse=false;s.legendaryBlacksmith.forgeSerial=1;s.cargo={};stash(s,[donor,'mail-shirt']);const q=quote(s),html=blacksmithPanelHTML(s,{donor:0,recipient:1});
 assert.match(html,/Prefix 1\/2/);assert.match(html,/Suffix 1\/2/);assert.match(html,/Iron 0\/3/);assert.match(html,/Wool 0\/1/);assert.match(html,/data-action="forge-confirm" disabled/);assert.match(forgeConfirmationHTML(q),/Iron 0\/3/);
 s.cargo={iron:3,wool:1};const result=commit(s);assert.match(forgeSuccessHTML(s,result.r),/Prefix 1\/2/);assert.match(getItemDetails(result.item).notes.join(' '),/1\/2 prefixes, 1\/2 suffixes/);
});

test('recipes use only existing goods, with a modest premium for the extra AP effect',()=>{
 assert.deepEqual(forgeRecipe([prefix('unyoked','actionPoints',1)]),{iron:3});
 assert.deepEqual(forgeRecipe([prefix('longshot','rangedReach',1),prefix('mending','perkFlags',perkFlags(['combat-bandaging']))]),{timber:1,wool:1});
 assert.equal(forgeAffixName('prefix',prefix('hearty','healthPct',15)),'Hearty III');
});
