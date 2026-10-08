import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {rollNamedItem} from '../src/named-rolls.js';
import {extractForgeAffixes,encodeBoundedForgeItem,flattenForgeAffixes} from '../src/reforged-items.js';
import {effectiveArmorFatigue} from '../src/equipment-sets.js';
const catalog=id=>g.ITEMS.find(i=>i.id===id);
const named=(base,seed=73,version)=>g.getItem(g.createFamedItemId(base,seed,version));
test('every new named body/head design has 1–11 fatigue relief and zero-relief bases double only their protection bonus',()=>{
 let reachedEleven=false;
 for(const base of g.ITEMS.filter(i=>['armor','helmet'].includes(i.slot)))for(const seed of [0,1,73,1234,0xffffffff]){
  const item=named(base.id,seed),old=named(base.id,seed,7),load=base.sourceFatigue??base.fatigue??0;
  const relief=load-item.fatigue;
  assert.equal(item.rollVersion,8);assert.ok(relief>=1&&relief<=11,item.id);reachedEleven ||= relief===11;
  assert.equal(item.enhancementProfile.armorPct,old.enhancementProfile.armorPct*(old.fatigue===load?2:1));
  assert.deepEqual(item.affixPrefix,old.affixPrefix);assert.deepEqual(item.affixSuffix,old.affixSuffix);
  assert.ok(!item.bonuses.some(b=>b.label==='Fatigue cost'&&b.value==='-0'));
 }
 assert.ok(reachedEleven);
});
test('zero/one fatigue bases receive exactly one relief without doubling their entire armor value',()=>{
 for(const slot of ['armor','helmet'])for(const fatigue of [0,1,4])for(let seed=0;seed<64;seed++){
  const base={id:'test-light',name:'Light Armor',slot,armor:100,fatigue,price:100,description:'Fixture.'};
  const old=rollNamedItem(base,'old',seed,{merged:true,rangeRoll:true,rulesVersion:7});
  const item=rollNamedItem(base,'new',seed,{merged:true,rangeRoll:true,rulesVersion:8});
  assert.equal(item.fatigue,fatigue-1);assert.equal(item.armor,100+old.enhancementProfile.armorPct*2);
 }
});
test('negative fatigue is transferable, canonical, saveable and retained by matching sets',()=>{
 const source=named('bb-assassin-head-wrap'),a=extractForgeAffixes(source,catalog);
 assert.equal(source.fatigue,-1);assert.equal(a.foundation.weight,1);
 const recipient='bb-ancient-laurels',id=encodeBoundedForgeItem(recipient,a,catalog),item=g.getItem(id);
 assert.match(id,/^forge5:/);assert.equal(item.fatigue,-1);assert.deepEqual(item.forgeProfile,flattenForgeAffixes(a));
 const state=g.createGame(731),bro=state.party[0];state.inventory.push(id);state.inventoryCondition.push(item.armor);
 assert.ok(g.equipItem(state,bro.id,id).ok);assert.deepEqual(g.validateSave(structuredClone(state)),state);
 const naked=g.getCompanyStats({...bro,equipment:{...bro.equipment,helmet:null}}),worn=g.getCompanyStats(bro);
 assert.equal(worn.maxFatigue-naked.maxFatigue,1+(item.statBonuses?.maxFatigue??0));
 const camp=g.getCampSites(state)[0];state.position={x:camp.x,y:camp.y};assert.ok(g.startBattle(state,camp.id).ok);assert.deepEqual(g.validateSave(structuredClone(state)),state);
 const actor={equipment:{armor:'bb-assassin-robe',helmet:source.id}};
 assert.equal(effectiveArmorFatigue(actor,g.getItem).head,-1);
 const body='bb-noble-gear',bodyId=encodeBoundedForgeItem(body,a,catalog);assert.equal(g.getItem(bodyId).fatigue,-1);
 const heavyId=encodeBoundedForgeItem('greathelm',a,catalog);assert.equal(g.getItem(heavyId).fatigue,g.getItem('greathelm').fatigue-1);
});
test('old identities retain their original armor, zero fatigue relief and forge floor',()=>{
 const old=named('bb-assassin-head-wrap',73,7);assert.equal(old.fatigue,0);
 const a=extractForgeAffixes(named('bb-assassin-head-wrap'),catalog);
 const id=encodeBoundedForgeItem('bb-ancient-laurels',a,catalog,4);
 assert.equal(g.getItem(id).fatigue,0);assert.match(id,/^forge4:/);
 assert.equal(g.getItem('famed8:arming-sword:73'),undefined);
 assert.throws(()=>g.createFamedItemId('arming-sword',73,8));
});
test('modern armor credit is bounded through subsequent forging without changing old forge behavior',()=>{
 const a={locked:false,foundation:{weight:80,armorPct:20},prefixes:[],suffixes:[]};
 const item=g.getItem(encodeBoundedForgeItem('bb-noble-gear',a,catalog));
 assert.equal(item.fatigue,-11);assert.ok(item.forgeWarnings.some(w=>w.includes('Fatigue load capped at -11')));
 const restored=g.getItem(encodeBoundedForgeItem('bb-noble-gear',extractForgeAffixes(item,catalog),catalog));assert.equal(restored.fatigue,-11);
});

test('an engaged expanded-affix encounter keeps its version-7 armor while new encounters use version 8',()=>{
 const state=g.createGame(1),site=g.getCampSites(state).find(c=>c.id==='wild-camp-19');
 const frozen={cycle:site.generation,champion:0,famed:0,mount:0,championGearVersion:1,namedAffixVersion:2};
 state.discoveryRolls[site.id]=frozen;
 const armorIds=()=>g.getCampSites(state).find(c=>c.id===site.id).enemies.flatMap(e=>[e.armor,e.helmet]).filter(id=>id.startsWith('famed'));
 const prior=armorIds();assert.ok(prior.length);assert.ok(prior.every(id=>id.startsWith('famed7:')));
 const saved=g.validateSave(structuredClone(state));assert.deepEqual(saved.discoveryRolls[site.id],frozen);
 state.discoveryRolls[site.id]={...frozen,namedAffixVersion:3};
 assert.deepEqual(armorIds(),prior.map(id=>id.replace('famed7:','famed8:')));
 assert.deepEqual(g.validateSave(structuredClone(state)),state);
});
