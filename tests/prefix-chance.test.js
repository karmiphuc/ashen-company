import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createFamedItemId, getItem, validateSave, getCampSites, startBattle } from '../src/engine.js';
import { NAMED_PREFIX_CHANCE } from '../src/item-affixes.js';

test('new named gear has a deterministic 35% prefix chance with unchanged suffix and craftsmanship rolls',()=>{
 assert.equal(NAMED_PREFIX_CHANCE,35);let count=0;
 for(let seed=0;seed<4000;seed++){
  const item=getItem(createFamedItemId('mail-shirt',seed)),previous=getItem(createFamedItemId('mail-shirt',seed,8));
  assert.equal(item.rollVersion,9);assert.deepEqual(item.affixSuffix,previous.affixSuffix);
  assert.deepEqual(item.enhancementProfile,previous.enhancementProfile);
  if(item.affixPrefix){count++;assert.deepEqual(item.affixPrefix,previous.affixPrefix);}
  else{assert.ok(!item.grantedPerks?.length);assert.ok(!Object.keys(item.perkBoosts??{}).length);assert.ok(!item.bonuses.some(b=>b.label.startsWith('Prefix')));}
 }
 assert.ok(count>1280&&count<1520,`${count}/4000 prefixes`);
});

test('older prefixes remain guaranteed and version 9 supports weapons, shields and armor but excludes attachments',()=>{
 for(const base of ['arming-sword','round-shield','cloth-hood','mail-shirt']){
  let present=0,absent=0;
  for(let seed=0;seed<100;seed++){
   assert.ok(getItem(createFamedItemId(base,seed,7)).affixPrefix);
   const item=getItem(createFamedItemId(base,seed,9));item.affixPrefix?present++:absent++;
  }
  assert.ok(present&&absent,base);
 }
 assert.throws(()=>createFamedItemId('stag-plates',73,9));assert.equal(getItem('famed9:stag-plates:73'),undefined);
 const state=createGame(73);state.inventory=['famed9:mail-shirt:73','famed9:arming-sword:74'];state.inventoryCondition=state.inventory.map(id=>getItem(id).armor??null);
 assert.deepEqual(validateSave(structuredClone(state)),state);
});

test('new encounter generations freeze prefix chance rules while engaged older generations retain every roll',()=>{
 const state=createGame(1),camp=getCampSites(state).find(c=>c.id==='wild-camp-19');
 state.discoveryRolls[camp.id]={cycle:camp.generation,champion:0,famed:0,mount:0,namedAffixVersion:3,championGearVersion:1};
 const ids=()=>getCampSites(state).find(c=>c.id===camp.id).enemies.flatMap(e=>[e.armor,e.helmet]).filter(id=>id.startsWith('famed'));
 const old=ids();assert.ok(old.every(id=>id.startsWith('famed8:')));
 delete state.discoveryRolls[camp.id];assert.deepEqual(ids(),old.map(id=>id.replace('famed8:','famed9:')));
 state.position={x:camp.x,y:camp.y};assert.ok(startBattle(state,camp.id).ok);
 assert.equal(state.discoveryRolls[camp.id].namedAffixVersion,4);assert.deepEqual(validateSave(structuredClone(state)),state);
});
