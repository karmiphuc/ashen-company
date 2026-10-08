import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, SETTLEMENTS, createGame, createFamedItemId, getItem, getCompanyStats, equipItem, unequipItem, getCampSites, startBattle, advanceBattle, validateSave, getMarket, buyItem, sellItem, shieldMaximum, shieldImpactDamage, throwingCapacity, setBattleTactic, swapWeaponSet } from '../src/engine.js';
import { rollNamedItem } from '../src/named-rolls.js';
import { getItemDetails } from '../src/item-details.js';

const named=(base,seed,version=2)=>getItem(createFamedItemId(base,seed,version));
function find(base,mod,predicate=()=>true){for(let seed=0;seed<4096;seed++){const item=named(base,seed);if(item.rollModifiers.includes(mod)&&predicate(item))return item;}throw Error(`Missing ${base} ${mod}`);}
const within=(x,min,max)=>assert.ok(x>=min-1e-9&&x<=max+1e-9,`${x} outside ${min}–${max}`);
function arm(state,item,slot='active'){state.inventory.push(item.id);state.inventoryCondition.push(item.armor??(item.slot==='shield'?shieldMaximum(item.id):item.throwing?throwingCapacity(item):null));assert.equal(equipItem(state,'captain',item.id,slot).ok,true);}
function fight(weapon,shield=null){const state=createGame(51);arm(state,weapon);if(shield)arm(state,shield);const site=getCampSites(state)[0];state.position={x:site.x,y:site.y};assert.equal(startBattle(state,site.id).ok,true);const battle=state.battle;for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}const at=(id,q,r)=>Object.assign(battle.units.find(u=>u.id===id),{q,r});at('captain',2,2);at('guard',1,1);at('scout',1,3);at('enemy-1',weapon.ranged?4:3,2);at('enemy-2',11,4);at('enemy-3',12,5);battle.activeId='captain';battle.turnIndex=battle.turnOrder.indexOf('captain');const actor=battle.units.find(u=>u.id==='captain'),target=battle.units.find(u=>u.id==='enemy-1');target.hp=target.maxHp=300;return{state,battle,actor,target,at};}

test('named weapons roll exactly two eligible BB modifiers across all campaign weapon types',()=>{
 const seen=new Set();
 for(const catalog of ITEMS.filter(i=>i.slot==='weapon')){
  const base=catalog.sourceStats?{...catalog,...catalog.sourceStats,fatigueOnSkillUse:catalog.sourceStats.fatigueOnSkillUse,ammoMax:catalog.sourceStats.ammoMax}:catalog;
  const snapshot=structuredClone(base);
  for(let seed=0;seed<256;seed++){
   const version=base.ranged&&!catalog.sourceNamedWeapon?4:2,item=named(base.id,seed,version),mods=new Set(item.rollModifiers);assert.equal(mods.size,2);assert.ok(item.bonuses.length>=2);assert.deepEqual(item,named(base.id,seed,version));assert.ok(Object.isFrozen(item)&&Object.isFrozen(item.rollModifiers));
   for(const mod of mods)seen.add(mod);
   if(mods.has('damage')){const legacyLow=version===4?2+(seed&15)%5:0,legacyHigh=version===4?legacyLow+1+((seed>>>4)&15)%3:0;within(item.damageMin,Math.round(base.damageMin*1.1)+legacyLow,Math.round(base.damageMin*1.3)+legacyLow);within(item.damageMax,Math.round(base.damageMax*1.1)+legacyHigh,Math.round(base.damageMax*1.3)+legacyHigh);assert.ok(Array.from({length:21},(_,n)=>110+n).some(p=>item.damageMin===Math.round(base.damageMin*p/100)+legacyLow&&item.damageMax===Math.round(base.damageMax*p/100)+legacyHigh));}else{assert.equal(item.damageMin,base.damageMin+(version===4?2+(seed&15)%5:0));assert.equal(item.damageMax,base.damageMax+(version===4?3+(seed&15)%5+((seed>>>4)&15)%3:0));}
   if(mods.has('armor-damage'))within(item.armorDamage-(base.armorDamage??1)-(version===4?(((seed>>>12)&15)%3)*.05+.1:0),.1,.3);else assert.ok(Math.abs(item.armorDamage-((base.armorDamage??1)+(version===4?(((seed>>>12)&15)%3)*.05+.1:0)))<1e-9);
   if(mods.has('head-chance'))within(item.headChance-(base.headChance??.22),.1,.2);else assert.equal(item.headChance,base.headChance);
   if(mods.has('piercing'))within(item.armorPiercing-(base.armorPiercing??.3),.08,.16);else assert.equal(item.armorPiercing,base.armorPiercing);
   if(mods.has('accuracy')){assert.ok(base.hitBonus||base.ranged);within(item.hitBonus-(base.hitBonus??0)-(version===4?2+((seed>>>8)&15)%7:0),5,15);}else assert.equal(item.hitBonus,(base.hitBonus??0)+(version===4?2+((seed>>>8)&15)%7:0));
   if(mods.has('ammo')){assert.ok(base.throwing);within(item.ammoMax,6,8);}else assert.equal(item.ammoMax,base.ammoMax);
   if(mods.has('range')){assert.ok(base.ranged);assert.equal(item.range,(base.range??1)+1);assert.ok(item.bonuses.some(bonus=>bonus.label==='Range'&&bonus.value==='+1 hex'));}else assert.equal(item.range,base.range);
   if(mods.has('shield-damage')){assert.ok(shieldImpactDamage(base)>=16);within(item.shieldDamage,Math.round(shieldImpactDamage(base)*1.5),shieldImpactDamage(base)*2);}else assert.equal(item.shieldDamage,base.shieldDamage);
   if(mods.has('skill-fatigue'))within(item.fatigueOnSkillUse,-3,-1);else assert.equal(item.fatigueOnSkillUse,base.fatigueOnSkillUse);
   if(mods.has('weight')){assert.ok(base.fatigue>=10);within(item.fatigue,Math.round(base.fatigue*.5),Math.round(base.fatigue*.8));}else assert.equal(item.fatigue,base.fatigue);
  }
  assert.deepEqual(base,snapshot,'source definition remains unchanged');
 }
 assert.deepEqual([...seen].sort(),['damage','armor-damage','head-chance','piercing','accuracy','ammo','range','shield-damage','skill-fatigue','weight'].sort());
});

test('named ranged weapons can roll +1 range and use it for actual crossbow targeting',()=>{
 let item;for(let seed=0;seed<4096&&!item;seed++){const candidate=getItem(createFamedItemId('light-crossbow',seed));if(candidate.rollModifiers.includes('range'))item=candidate;}assert.ok(item);assert.equal(item.rollVersion,7);assert.match(item.id,/^famed7:/);assert.equal(item.range,getItem('light-crossbow').range+1);
 const {state,battle,actor,at}=fight(item);at('enemy-1',2+item.range,2);const start={q:actor.q,r:actor.r};
 advanceBattle(state);
 assert.equal(battle.lastEvent.type,'attack');assert.equal(battle.lastEvent.weaponId,item.id);assert.equal(battle.lastEvent.skillName,'Piercing Bolt');
 assert.deepEqual({q:actor.q,r:actor.r},start,'the added range lets the crossbow fire without moving');
 assert.ok(item.rollModifiers.includes('range'));assert.deepEqual(validateSave(structuredClone(state)),state);
 let namedDesign;for(let seed=0;seed<4096&&!namedDesign;seed++){const candidate=getItem(createFamedItemId('bb-named-warbow',seed));if(candidate.rollModifiers.includes('range'))namedDesign=candidate;}
 assert.ok(namedDesign);assert.equal(namedDesign.rollVersion,7);assert.equal(namedDesign.range,getItem('bb-named-warbow').range+1);assert.ok(namedDesign.sourceNamedWeapon);
});

test('legacy ranged named IDs keep their pre-range rolls and new defaults use v5 affixes and retain old ranged identities',()=>{
 const old2=getItem('famed2:hunting-bow:12345'),old3=getItem('famed3:hunting-bow:12345');
 assert.equal(old2.rollVersion,2);assert.equal(old3.rollVersion,3);assert.ok(!old2.rollModifiers.includes('range'));assert.ok(!old3.rollModifiers.includes('range'));
 assert.deepEqual(old2.rollModifiers,['piercing','damage']);assert.equal(old2.range,getItem('hunting-bow').range);assert.equal(old2.damageMin,18);assert.equal(old2.damageMax,30);assert.equal(old2.armorPiercing,.44);
 assert.deepEqual(old3.rollModifiers,['piercing','damage']);assert.equal(old3.range,getItem('hunting-bow').range);assert.equal(old3.damageMin,24);assert.equal(old3.damageMax,37);assert.equal(old3.armorPiercing,.44);assert.equal(old3.hitBonus,2);
 assert.equal(createFamedItemId('hunting-bow',12345),'famed7:hunting-bow:12345');assert.equal(createFamedItemId('arming-sword',12345),'famed7:arming-sword:12345');
 assert.throws(()=>createFamedItemId('arming-sword',1,4),TypeError);assert.equal(getItem('famed4:arming-sword:1'),undefined);
});

test('weapon load reduction is restricted to heavy bases, while accuracy respects the eligibility pool',()=>{
 const base={...getItem('greatsword'),fatigue:15,hitBonus:0};const mods=new Set();
 for(let seed=0;seed<512;seed++){const item=rollNamedItem(base,`fixture:${seed}`,seed);for(const mod of item.rollModifiers)mods.add(mod);if(item.rollModifiers.includes('weight'))within(item.fatigue,8,12);else assert.equal(item.fatigue,15);assert.ok(!item.rollModifiers.includes('accuracy'));}
 assert.ok(mods.has('weight'));assert.equal(getItem('greatsword').fatigue,undefined);
});

test('body armor and helmets roll 110–125% protection and their own weight ranges without invented signatures',()=>{
 for(const baseId of ['mail-shirt','plate-harness','greathelm','cloth-hood','bb-black-and-gold-armor','bb-brown-coat-of-plates-armor','bb-fangshire']){
  const base=getItem(baseId),armor=base.sourceArmor??base.armor,fatigue=base.sourceFatigue??base.fatigue,helmet=base.slot==='helmet';const gains=new Set(),reliefs=new Set();
  for(let seed=0;seed<512;seed++){const item=named(baseId,seed);within(item.armor,Math.floor(armor*1.1),Math.floor(armor*1.25));within(item.fatigue,Math.max(Math.min(fatigue,helmet?4:8),fatigue-(helmet?4:9)),Math.max(Math.min(fatigue,helmet?4:8),fatigue-(helmet?1:3)));assert.deepEqual(item.rollModifiers,['protection','weight']);assert.equal(item.signature,undefined);assert.deepEqual(item.statBonuses,baseId==='bb-fangshire'?base.statBonuses:undefined);gains.add(item.armor);reliefs.add(item.fatigue);}
  if(fatigue>17)assert.equal(reliefs.size,helmet?4:7);assert.ok(gains.size>1);
 }
});

test('named shields independently roll defense, durability, load and skill fatigue, and both defenses reach company stats',()=>{
 const base=getItem('round-shield'),maximum=shieldMaximum(base.id),seen=new Set();
 for(let seed=0;seed<512;seed++){const item=named(base.id,seed),mods=new Set(item.rollModifiers);assert.equal(mods.size,2);for(const mod of mods)seen.add(mod);if(mods.has('melee-defense'))within(item.defense,Math.round(base.defense*1.2),Math.round(base.defense*1.4));else assert.equal(item.defense,base.defense);if(mods.has('ranged-defense'))within(item.rangedDefense,Math.round(base.defense*1.2),Math.round(base.defense*1.4));else assert.equal(item.rangedDefense,base.defense);if(mods.has('durability'))within(shieldMaximum(item.id),Math.round(maximum*1.2),Math.round(maximum*1.6));else assert.equal(shieldMaximum(item.id),maximum);if(mods.has('weight'))within(item.fatigue,Math.round(base.fatigue*.7),Math.round(base.fatigue*.9));else assert.equal(item.fatigue,base.fatigue);}
 assert.deepEqual([...seen].sort(),['melee-defense','ranged-defense','durability','weight','skill-fatigue'].sort());
 const item=find(base.id,'ranged-defense',i=>!i.rollModifiers.includes('melee-defense'));const state=createGame(9);arm(state,base);const ordinary=getCompanyStats(state.party[0]);arm(state,item);const improved=getCompanyStats(state.party[0]);assert.equal(improved.meleeDefense,ordinary.meleeDefense);assert.equal(improved.rangedDefense-ordinary.rangedDefense,item.rangedDefense-base.defense);state.party[0].armorDurability.shield=0;const broken=getCompanyStats(state.party[0]);assert.equal(improved.meleeDefense-broken.meleeDefense,item.defense);assert.equal(improved.rangedDefense-broken.rangedDefense,item.rangedDefense);assert.deepEqual(validateSave(structuredClone(state)),state);
});

test('skill fatigue rolls reduce attacks before mastery, with no accidental mastery discount',()=>{
 const item=find('arming-sword','skill-fatigue');
 for(const mastery of [false,true]){const {state,battle,actor}=fight(item);if(mastery){actor.perks.push('sword-training');state.party[0].perks.push('sword-training');}assert.equal(advanceBattle(state).ok,true);assert.equal(battle.lastEvent.type,'attack');const expected=(item.fatigueCost??11)+item.fatigueOnSkillUse;assert.equal(actor.fatigue,mastery?Math.ceil(expected*.75):expected);}
});

test('named bow skill fatigue also changes Aimed Shot and is visible in inspection',()=>{
 const item=find('hunting-bow','skill-fatigue');for(const mastery of [false,true]){const {state,battle,actor,at}=fight(item);at('enemy-1',2+item.range+(mastery?1:0)+1,2);if(mastery){actor.perks.push('bow-mastery');state.party[0].perks.push('bow-mastery');}advanceBattle(state);assert.equal(battle.lastEvent.skillName,'Aimed Shot');assert.equal(actor.fatigue,mastery?Math.ceil((15+item.fatigueOnSkillUse)*.75):15+item.fatigueOnSkillUse);}
 const details=getItemDetails(item);assert.ok(details.notes.some(n=>n.includes('less fatigue before masteries')));assert.equal(details.stats.find(s=>s.label==='Attack fatigue').value,String(9+item.fatigueOnSkillUse));
});

test('shield fatigue rolls apply to Shieldwall independently of the weapon',()=>{
 const shield=find('round-shield','skill-fatigue'),weapon=find('arming-sword','skill-fatigue');const {state,battle,actor,at}=fight(weapon,shield);at('enemy-1',4,2);setBattleTactic(state,'shield-wall');actor.skillPreference='control';state.party[0].skillPreference='control';advanceBattle(state);assert.equal(battle.lastEvent.skillName,'Shieldwall');assert.equal(actor.fatigue,20+shield.fatigueOnSkillUse);assert.equal(actor.shieldWallActive,true);assert.deepEqual(validateSave(structuredClone(state)),state);
});

test('increased throwing capacity survives attacks, stowing, weapon swaps and reload',()=>{
 const item=find('heavy-javelins','ammo');const {state,battle,actor,at}=fight(item);at('enemy-1',5,2);assert.equal(actor.throwingAmmo.active,item.ammoMax);advanceBattle(state);assert.equal(battle.lastEvent.weaponId,item.id);assert.equal(actor.throwingAmmo.active,item.ammoMax-1);assert.deepEqual(validateSave(structuredClone(state)),state);
 const peaceful=createGame(7);arm(peaceful,item);peaceful.party[0].throwingAmmo.active=item.ammoMax-2;arm(peaceful,getItem('javelins'),'reserve');assert.equal(swapWeaponSet(peaceful,'captain').ok,true);assert.equal(peaceful.party[0].throwingAmmo.reserve,item.ammoMax-2);swapWeaponSet(peaceful,'captain');assert.equal(unequipItem(peaceful,'captain','weapon').ok,true);assert.equal(peaceful.inventoryCondition[peaceful.inventory.indexOf(item.id)],item.ammoMax-2);assert.deepEqual(validateSave(structuredClone(peaceful)),peaceful);assert.equal(throwingCapacity('javelins'),5);
});

test('modern named armor market finds retain their two source-based rolls through purchase, damage and buyback',()=>{
 let state,row;for(let seed=1;seed<100&&!row;seed++){state=createGame(seed);for(const town of SETTLEMENTS){state.position={x:town.x,y:town.y};row=getMarket(state).equipment.find(r=>r.stock>0&&getItem(r.itemId)?.rollVersion===7&&getItem(r.itemId)?.sourceArmor!==undefined);if(row)break;}}
 assert.ok(row);const item=getItem(row.itemId);assert.equal(item.rarity,'named');assert.ok(item.sourceArmor!==undefined);state.gold=50000;assert.equal(buyItem(state,item.id).ok,true);assert.equal(getMarket(state).equipment.find(r=>r.itemId===item.id).stock,0);const index=state.inventory.indexOf(item.id);state.inventoryCondition[index]-=5;const damaged=state.inventoryCondition[index];assert.deepEqual(validateSave(structuredClone(state)),state);assert.equal(sellItem(state,item.id).ok,true);assert.equal(getMarket(state).equipment.find(r=>r.itemId===item.id).stock,1);assert.equal(buyItem(state,item.id).ok,true);assert.equal(state.inventoryCondition[state.inventory.indexOf(item.id)],damaged);assert.deepEqual(validateSave(structuredClone(state)),state);
});

test('legacy famed identities preserve stats in active battles and versioned malformed IDs are rejected',()=>{
 const old=getItem(createFamedItemId('mail-shirt',987654321,1));assert.equal(old.rollVersion,undefined);assert.ok(old.signature);const {state}=fight(getItem(createFamedItemId('arming-sword',42,1)));assert.deepEqual(validateSave(structuredClone(state)),state);
 for(const id of ['famed2:arming-sword:01','famed2:arming-sword:4294967296','famed2:unknown:1','famed2:war-horse:1','famed2:arming-sword:-1'])assert.equal(getItem(id),undefined);assert.throws(()=>createFamedItemId('arming-sword',1,4),TypeError);
});

test('head-chance rolls change actual strike locations using the same combat random numbers',()=>{
 const item=find('arming-sword','head-chance'),fixture=fight(getItem('arming-sword')).state;let extraHeads=0;
 for(let rng=0;rng<128;rng++){const ordinary=structuredClone(fixture),improved=structuredClone(fixture);for(const state of [ordinary,improved]){state.battle.rng=rng;const actor=state.battle.units.find(u=>u.id==='captain');actor.meleeSkill=200;actor.skillPreference='damage';}improved.battle.units.find(u=>u.id==='captain').equipment.weapon=item.id;advanceBattle(ordinary);advanceBattle(improved);const before=ordinary.battle.lastEvent,after=improved.battle.lastEvent;assert.equal(before.type,after.type);if(before.type==='attack'){if(before.head)assert.equal(after.head,true);if(!before.head&&after.head)extraHeads++;}}
 assert.ok(extraHeads>0,'extra named head hits are actually resolved by combat');
});

test('breaking an asymmetric named shield removes its exact melee and ranged bonuses',()=>{
 const shield=find('round-shield','ranged-defense',i=>!i.rollModifiers.includes('melee-defense'));const {state,battle,actor,target}=fight(getItem('arming-sword'),shield);const before={melee:actor.meleeDefense,ranged:actor.rangedDefense};actor.shieldDurability=1;target.equipment.weapon='wood-axe';target.meleeSkill=200;battle.activeId=target.id;battle.turnIndex=battle.turnOrder.indexOf(target.id);advanceBattle(state);assert.equal(actor.shieldDurability,0);assert.equal(before.melee-actor.meleeDefense,shield.defense);assert.equal(before.ranged-actor.rangedDefense,shield.rangedDefense);
});

test('legacy market stock remains stable and does not acquire an extra named offer on import',()=>{
 const state=createGame(19);state.gold=50000;const offer=getMarket(state).equipment.find(r=>r.stock>0&&!getItem(r.itemId).rarity);assert.ok(offer);buyItem(state,offer.itemId);const market=Object.values(state.marketStock)[0];for(const id of Object.keys(market.equipment)){if(/^famed[23]:/.test(id)){market.equipment[getItem(id).baseId]=market.equipment[id];delete market.equipment[id];}}
 const before=structuredClone(market.equipment),restored=validateSave(structuredClone(state));assert.deepEqual(Object.values(restored.marketStock)[0].equipment,before);assert.deepEqual(validateSave(restored),restored);
});


test('pre-range named camp rewards survive import with their original v3 identity',()=>{
 const state=createGame(6),camp=getCampSites(state).find(c=>c.id==='wild-camp-6');
 state.position={x:camp.x,y:camp.y};assert.ok(startBattle(state,camp.id).ok);
 assert.equal(state.battle.famedDrop,'famed7:heavy-crossbow:1566254893');
 state.battle.famedDrop=state.battle.famedDrop.replace('famed7:','famed3:');
 assert.deepEqual(validateSave(structuredClone(state)),state);
 const bad=structuredClone(state);bad.battle.famedDrop='famed3:heavy-crossbow:1';
 assert.throws(()=>validateSave(bad),/battle famed drop/);
});
