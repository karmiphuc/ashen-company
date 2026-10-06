import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, createGame, createFamedItemId, getItem, getCompanyStats, getCampSites, startBattle, advanceBattle, validateSave, equipItem, unequipItem, shieldMaximum, attackHitChance } from '../src/engine.js';
import { equipmentPerk, equipmentBoost, equipmentRangedReach, perkFlags } from '../src/item-affixes.js';
import { encodeForgeItem, extractForgeProfile } from '../src/reforged-items.js';
import { getItemDetails } from '../src/item-details.js';
import { setSimultaneousBetaEnabled } from '../src/combat-config.js';
const catalog=id=>ITEMS.find(i=>i.id===id);
const forged=(base,profile)=>getItem(encodeForgeItem(base,profile,catalog));
function equip(state,item) {state.inventory.push(item.id);state.inventoryCondition.push(item.slot==='shield'?shieldMaximum(item.id):item.armor??null);assert.ok(equipItem(state,'captain',item.id).ok);}
function find(base,predicate) {for(let seed=0;seed<2000;seed++){const item=getItem(createFamedItemId(base,seed));if(predicate(item))return item;}assert.fail(`No matching affix on ${base}`);}
function fight({weapon='arming-sword',armor=null,perks=[],realtime=false}={}) {
  const state=createGame(51);state.party[0].perks=perks;state.party[0].level=20;
  if(armor)equip(state,armor); if(typeof weapon==='object')equip(state,weapon);
  const site=getCampSites(state)[0];state.position={x:site.x,y:site.y};
  setSimultaneousBetaEnabled(realtime);try {assert.ok(startBattle(state,site.id).ok);}finally{setSimultaneousBetaEnabled(false);}
  const battle=state.battle;for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
  const at=(id,q,r)=>Object.assign(battle.units.find(u=>u.id===id),{q,r});
  const actor=at('captain',4,4),target=at('enemy-1',5,4);
  at('guard',1,13);at('scout',2,13);at('enemy-2',10,12);at('enemy-3',12,15);
  battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);
  return {state,battle,actor,target,at};
}
test('prefix and suffix identities are independent, varied, immutable and preserve legacy identities',()=>{
  const prefixes=new Set(),suffixes=new Set(),pairs=new Map();
  for(let seed=0;seed<1000;seed++){
    const item=getItem(createFamedItemId('cloth-hood',seed));prefixes.add(item.affixPrefix.id);suffixes.add(item.affixSuffix.id);
    const pool=pairs.get(item.affixSuffix.id)??new Set();pool.add(item.affixPrefix.id);pairs.set(item.affixSuffix.id,pool);
    assert.ok(Object.isFrozen(item));assert.ok(Object.isFrozen(item.statBonuses));
    assert.equal(item.name.startsWith(item.affixPrefix.name),true);assert.ok(item.name.endsWith(item.affixSuffix.name));
    assert.deepEqual(item,getItem(item.id));
  }
  assert.ok(prefixes.size>=4);assert.equal(suffixes.size,8);assert.ok([...pairs.values()].every(p=>p.size>=3));
  assert.equal(getItem('famed3:mail-shirt:42').affixPrefix,undefined);
  assert.equal(getItem('famed4:hunting-bow:42').affixPrefix,undefined);
  for(const id of ['famed5:arming-sword:01','famed6:arming-sword:1','famed3:fur-mantle:1','famed5:war-horse:1'])assert.equal(getItem(id),undefined);
});
test('numeric suffix bonuses enter company stats, and removing vitality gear clamps health safely',()=>{
  const state=createGame(10),person=state.party[0],before=getCompanyStats(person);
  const item=find('mail-shirt',i=>i.affixSuffix.id==='vitality');equip(state,item);
  assert.equal(getCompanyStats(person).maxHp,before.maxHp+item.statBonuses.maxHp);
  person.hp=getCompanyStats(person).maxHp;assert.ok(unequipItem(state,person.id,'armor').ok);
  assert.equal(person.hp,getCompanyStats(person).maxHp);assert.doesNotThrow(()=>validateSave(structuredClone(state)));
  for(const [suffix,key] of [['aim','rangedSkill'],['striking','meleeSkill'],['alacrity','initiative']]) {
    const gear=find('cloth-hood',i=>i.affixSuffix.id===suffix);const clean=forged('cloth-hood',{armorPct:gear.enhancementProfile.armorPct,weight:catalog('cloth-hood').fatigue-gear.fatigue});
    const s=createGame(10);equip(s,clean);const plain=getCompanyStats(s.party[0]);equip(s,gear);
    assert.equal(getCompanyStats(s.party[0])[key]-plain[key],gear.statBonuses[key]);
  }
});
test('gear perks are worn-only, do not stack or become learned, and broken shield perks disappear',()=>{
  const state=createGame(11),person=state.party[0],gear=find('mail-shirt',i=>i.grantedPerks.includes('pathfinder'));equip(state,gear);
  assert.ok(equipmentPerk(person,'pathfinder',getItem));assert.ok(!person.perks.includes('pathfinder'));
  const profile=extractForgeProfile(gear,catalog,{shieldMaximum});assert.equal(profile.perkFlags,perkFlags(['pathfinder']));
  assert.deepEqual(getItem(encodeForgeItem('plate-harness',profile,catalog)).grantedPerks,['pathfinder']);
  unequipItem(state,person.id,'armor');assert.ok(!equipmentPerk(person,'pathfinder',getItem));
  person.reserveEquipment.weapon=find('arming-sword',i=>i.grantedPerks.includes('pathfinder')).id;
  assert.ok(!equipmentPerk(person,'pathfinder',getItem));
  const shield=find('round-shield',i=>i.grantedPerks.includes('shield-expert'));equip(state,shield);
  assert.ok(equipmentPerk(person,'shield-expert',getItem));person.armorDurability.shield=0;assert.ok(!equipmentPerk(person,'shield-expert',getItem));
});
test('Farseeing supplies actual ranged targeting only with light armor and does not stack',()=>{
  const helmet=find('cloth-hood',i=>i.rangedRangeBonus===1),bow=getItem(createFamedItemId('light-crossbow',7,3));
  const {state,battle,actor,at}=fight({weapon:bow});
  actor.equipment.helmet=helmet.id;actor.maxHeadArmor=actor.headArmor=helmet.armor;
  actor.equipment.armor='patched-coat';actor.maxBodyArmor=actor.bodyArmor=getItem('patched-coat').armor;
  at('enemy-1',4+bow.range+1,4);actor.rangedSkill=150;
  assert.equal(equipmentRangedReach(actor,getItem),1);advanceBattle(state);assert.equal(battle.lastEvent.type,'attack');
  actor.equipment.armor='plate-harness';assert.equal(equipmentRangedReach(actor,getItem),0);
});
test('Nimble enhancement doubles defense and raises its armor fatigue limit without granting Nimble',()=>{
  const state=createGame(9),person=state.party[0];person.equipment.helmet=null;person.armorDurability.head=0;
  const plain=forged('brigandine',{weight:5}),boost=forged('brigandine',{weight:5,nimbleBoost:1});equip(state,plain);
  person.perks=['nimble'];person.level=20;const before=getCompanyStats(person);equip(state,boost);
  assert.equal(getCompanyStats(person).meleeDefense-before.meleeDefense,10);
  assert.equal(getCompanyStats(person).rangedDefense-before.rangedDefense,10);
  person.perks=[];assert.equal(getCompanyStats(person).meleeDefense,before.meleeDefense);
  assert.match(getItemDetails(boost).notes.join(' '),/Requires Nimble/);
});
test('Berserk affixes add AP to real kill procs and stack while preserving the learned perk requirement',()=>{
  for(const count of [0,1,2]){
    const weapon=forged('arming-sword',{damagePct:20,...(count?{berserkAp:1}:{})});
    const armor=count===2?forged('mail-shirt',{armorPct:10,berserkAp:1}):null;
    const {state,battle,actor,target}=fight({weapon,armor,perks:['berserk']});target.hp=1;actor.meleeSkill=200;actor.ap=9;battle.rng=12345;
    advanceBattle(state);assert.equal(target.alive,false);assert.equal(battle.lastEvent.effects.find(e=>e.id==='berserk').amount,4+count);
    assert.match(battle.lastEvent.message,new RegExp(`Berserk: \\+${4+count} AP`));assert.doesNotThrow(()=>validateSave(structuredClone(state)));
  }
  const {state,battle,actor,target}=fight({weapon:forged('arming-sword',{damagePct:20,berserkAp:2})});target.hp=1;actor.meleeSkill=200;
  advanceBattle(state);assert.ok(!battle.lastEvent.effects?.some(e=>e.id==='berserk'));
});
test('realtime recovery uses the actual boosted Berserk refund and saves deterministically',()=>{
  const {state,battle,actor,target}=fight({weapon:forged('arming-sword',{damagePct:20,berserkAp:2}),perks:['berserk'],realtime:true});
  target.hp=1;actor.meleeSkill=200;for(const unit of battle.units)battle.simultaneous.actors[unit.id].readyAt=unit===actor?0:1000;
  const reload=validateSave(structuredClone(state));advanceBattle(state);advanceBattle(reload);assert.deepEqual(state,reload);
  assert.equal(battle.lastEvent.effects.find(e=>e.id==='berserk').amount,6);
});
test('Battle Forged prefix reduces real received armor damage and needs Battle Forged',()=>{
  const shots=[];
  for(const boost of [0,1,2]){
    const armor=forged('plate-harness',{armorPct:10,...(boost?{battleForgedBoost:boost}:{})});
    const {state,battle,actor,target}=fight({armor,perks:['battle-forged']});
    target.meleeSkill=200;target.equipment.weapon='greataxe';target.equipment.shield=null;target.shieldDurability=target.maxShieldDurability=0;actor.equipment.helmet='greathelm';actor.headArmor=actor.maxHeadArmor=getItem('greathelm').armor;actor.meleeDefense=-100;battle.rng=12345;battle.activeId=target.id;battle.turnIndex=battle.turnOrder.indexOf(target.id);
    advanceBattle(state);assert.equal(battle.lastEvent.type,'attack');shots.push(battle.lastEvent.armorDamage);
  }
  assert.ok(shots[0]>shots[1]);assert.ok(shots[1]>shots[2]);
});
test('fine and champion attachments use smaller separate rolls, preserve innate fur effects and round-trip',()=>{
  const base=getItem('unhold-fur');
  for(let seed=0;seed<100;seed++){
    const fine=getItem(createFamedItemId(base.id,seed,5)),master=getItem(createFamedItemId(base.id,seed,6));
    assert.ok(fine.armor>=74&&fine.armor<=81);assert.ok(master.armor>=81&&master.armor<=91);
    assert.equal(master.rangedDamageReduction,base.rangedDamageReduction);assert.equal(master.grantedPerks,undefined);
    const state=createGame(seed);equip(state,master);assert.deepEqual(validateSave(structuredClone(state)),state);
    assert.equal(extractForgeProfile(master,catalog),null);
  }
});
test('forge2 preserves prefixes, suffix stats and perk boosts while forge1 keeps its old encoding',()=>{
  const legacy=encodeForgeItem('mail-shirt',{armorPct:10},catalog);assert.ok(legacy.startsWith('forge1:'));assert.equal(legacy.split(':')[2].split('.').length,21);
  const profile={armorPct:10,meleeSkill:3,rangedSkill:4,initiative:5,maxHp:6,perkFlags:perkFlags(['pathfinder','recover']),berserkAp:1,nimbleBoost:1,battleForgedBoost:1};
  const item=forged('mail-shirt',profile);assert.ok(item.id.startsWith('forge2:'));assert.deepEqual(extractForgeProfile(item,catalog),profile);
  assert.equal(getItem(item.id).perkBoosts.berserkAp,1);assert.deepEqual(item.grantedPerks,['pathfinder','recover']);
  for(const id of [item.id+'0',item.id.replace('forge2:','forge1:'),item.id.replace('forge2:','forge3:')])assert.equal(getItem(id),undefined);
});
test('champion named armor attachments get the stronger tier, guaranteed loot and stable generation identities',()=>{
  const state=createGame(1),site=getCampSites(state).find(s=>s.id==='wild-camp-19');
  const template=site.enemies.find(e=>getItem(e.attachment)?.attachmentTier==='champion');assert.ok(template);
  state.position={x:site.x,y:site.y};assert.ok(startBattle(state,site.id).ok);
  const champion=state.battle.units.find(u=>u.name===template.name);assert.equal(champion.equipment.attachment,template.attachment);
  assert.equal(getItem(champion.equipment.attachment).attachmentTier,'champion');champion.attachmentArmor=0;
  assert.deepEqual(validateSave(structuredClone(state)),state);
  for(const u of state.battle.units.filter(u=>u.side==='enemy')){u.hp=0;u.alive=false;}
  const actor=state.battle.units.find(u=>u.side==='company');state.battle.activeId=actor.id;state.battle.turnIndex=state.battle.turnOrder.indexOf(actor.id);advanceBattle(state);
  const index=state.battle.loot.items.indexOf(template.attachment);assert.ok(index>=0);assert.ok(state.battle.loot.itemConditions[index]>0);
  assert.deepEqual(validateSave(structuredClone(state)),state);
});
test('Fleet prefix supplies the existing light-armor movement credit without learning or duplicating the perk',()=>{
  const armor=find('patched-coat',i=>i.grantedPerks.includes('fleet-footed'));
  const {state,actor}=fight({armor});assert.equal(actor.movementCredit,2);assert.ok(!state.party[0].perks.includes('fleet-footed'));
  const second=fight({armor,perks:['fleet-footed']});assert.equal(second.actor.movementCredit,2);
});
test('equipment Shield Expert loses its entire shield defense bonus when the shield breaks',()=>{
  const shield=find('round-shield',i=>i.grantedPerks.includes('shield-expert'));
  const {state,battle,actor,target}=fight();actor.equipment.shield=shield.id;actor.maxShieldDurability=shieldMaximum(shield.id);actor.shieldDurability=1;
  const expected=Math.ceil(shield.defense*1.25),rangedExpected=Math.ceil(shield.rangedDefense*1.25);
  actor.meleeDefense=expected-100;actor.rangedDefense=rangedExpected;target.equipment.weapon='wood-axe';target.meleeSkill=200;
  battle.activeId=target.id;battle.turnIndex=battle.turnOrder.indexOf(target.id);advanceBattle(state);
  assert.equal(actor.shieldDurability,0);assert.equal(actor.meleeDefense,-100);assert.equal(actor.rangedDefense,0);
});
