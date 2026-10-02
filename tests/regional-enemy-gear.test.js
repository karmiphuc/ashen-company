import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REGIONS, regionAt } from '../src/geography.js';
import { armoryTheme, matchesArmoryTheme } from '../src/armory-themes.js';
import { DLC_ITEMS } from '../src/dlc-items.js';
import { WORLD_ENEMY_PROFILES, worldEnemyTemplates, regionalOutfit, enemyCombatRole, enemyRoleBonuses } from '../src/regional-enemies.js';
import { SETTLEMENTS, createGame, getCampSites, getRoamingBands, getItem, getCompanyStats, equipItem, getMarket, buyItem, sellItem, startBattle, resolveBattle, validateSave } from '../src/engine.js';
import { getItemDetails } from '../src/item-details.js';

test('nine regions have distinct combat rosters, weapons, light roles and usable catalog gear', () => {
  const rosters=new Set();
  assert.equal(Object.keys(WORLD_ENEMY_PROFILES).length,9);
  for(const region of REGIONS)for(const tier of [1,2,3]){
    const roster=worldEnemyTemplates(region.x,region.y,tier);
    rosters.add(roster.map(enemy=>enemy.name).join('|'));
    assert.ok(roster.some(enemy=>enemyCombatRole(enemy)==='ranged'),region.name);
    for(let seed=1;seed<=32;seed++)for(const [index,enemy]of roster.entries()){
      const geared=regionalOutfit(enemy,seed,index,region.x,region.y,tier);
      assert.equal(getItem(geared.weapon)?.slot,'weapon');
      for(const slot of ['armor','helmet'])assert.equal(getItem(geared[slot])?.slot,slot);
      if(enemyCombatRole(geared)==='ranged'){
        assert.ok(getItem(geared.armor).armor<=110,'archers keep light body armor even when carrying trophies');
        assert.ok(getItem(geared.helmet).armor<=110);
        assert.ok(getItem(geared.armor).fatigue<=12);
        assert.ok(getItem(geared.helmet).fatigue<=8);
      }
      if(tier===1){assert.ok(getItem(geared.armor).armor<=100);assert.ok(getItem(geared.helmet).armor<=110);assert.notEqual(getItem(geared.armor).rarity,'named');}
      assert.deepEqual(geared,regionalOutfit(enemy,seed,index,region.x,region.y,tier));
    }
  }
  assert.equal(rosters.size,27);
});

test('old and new non-starter patrols and seeded camps receive broad imported gear without touching weak starters', () => {
  const used=new Set(),factions=new Set();
  for(let seed=1;seed<=100;seed++){
    const s=createGame(seed),before=structuredClone(s),sites=[...getCampSites(s),...getRoamingBands(s)];
    for(const site of sites){
      if(site.factionId)factions.add(site.factionId);
      for(const enemy of site.enemies)for(const id of [enemy.armor,enemy.helmet])if(id?.startsWith('bb-'))used.add(id);
      if(site.difficulty===0)assert.ok(site.enemies.every(e=>!e.armor?.startsWith('bb-')&&!e.helmet?.startsWith('bb-')));
    }
    assert.ok(getRoamingBands(s).find(b=>b.id==='dunridge-lancers')?.enemies.some(e=>e.armor.startsWith('bb-')));
    assert.deepEqual(s,before,'scouting does not mutate campaign state');
  }
  assert.ok(used.size>=150,`${used.size} imported designs are distributed`);
  assert.equal(factions.size,10);assert.ok(factions.has('ancient'));
});

test('elite role perks and signature benefits enter new combat snapshots and survive repeated imports', () => {
  let champion=null;
  for(let seed=1;seed<=100&&!champion;seed++){
    const state=createGame(seed),site=getRoamingBands(state).find(site=>site.difficulty===3&&site.enemies.some(e=>[e.armor,e.helmet].some(id=>getItem(id)?.rarity==='named')));
    if(site)champion={state,site};
  }
  assert.ok(champion);
  const {state,site}=champion;state.position={x:site.x,y:site.y};assert.equal(startBattle(state,site.id).ok,true);
  const leader=state.battle.units.find(u=>u.id==='enemy-1'),bonuses=enemyRoleBonuses(site.enemies[0],3);
  assert.deepEqual(leader.perks,bonuses.perks);
  const defense=[leader.equipment.armor,leader.equipment.helmet].reduce((sum,id)=>sum+(getItem(id).statBonuses?.rangedDefense??0),0);
  assert.equal(leader.rangedDefense,8+(getItem(leader.equipment.shield)?.defense??0)+defense);
  assert.deepEqual(validateSave(validateSave(state)),state);
  const bad=structuredClone(state);bad.battle.units.find(u=>u.id==='enemy-1').perks=['berserk'];assert.throws(()=>validateSave(bad),/perk owner/);
  const rareId=[leader.equipment.armor,leader.equipment.helmet].find(id=>getItem(id)?.rarity==='named');
  const slot=getItem(rareId).slot==='armor'?'bodyArmor':'headArmor';leader[slot]=Math.ceil(getItem(rareId).armor*.7);
  for(const enemy of state.battle.units.filter(u=>u.side==='enemy')){enemy.hp=0;enemy.alive=false;}
  assert.equal(resolveBattle(state).ok,true);assert.ok(state.battle.loot.items.includes(rareId),'surviving named trophy is recovered');
  assert.equal(state.battle.loot.itemConditions[state.battle.loot.items.indexOf(rareId)],leader[slot]);
  assert.deepEqual(validateSave(state),state);
});

test('all imported named and legendary pieces have permanent benefits; Fangshire bonuses apply once', () => {
  for(const item of DLC_ITEMS.filter(i=>['named','legendary'].includes(i.sourceKind))){
    assert.equal(item.rarity,'named');assert.ok(item.armor>item.sourceArmor);assert.ok(item.fatigue<=item.sourceFatigue);assert.ok(item.bonuses.length>=2);
    assert.ok(Object.isFrozen(item.statBonuses));assert.ok(getItemDetails(item).bonuses.length>=2);
  }
  const helm=getItem('bb-fangshire');assert.equal(helm.armor,77);assert.equal(helm.fatigue,1);assert.deepEqual(helm.statBonuses,{rangedDefense:5});
  const state=createGame(42),p=state.party[0],before=getCompanyStats({...p,equipment:{...p.equipment,helmet:null}});
  state.inventory.push(helm.id);state.inventoryCondition.push(53);assert.equal(equipItem(state,p.id,helm.id).ok,true);
  assert.equal(getCompanyStats(p).rangedDefense-before.rangedDefense,5);assert.equal(p.armorDurability.head,53);
  assert.deepEqual(validateSave(validateSave(state)),state);
  const famed=getItem('famed:bb-fangshire:0');assert.equal(famed.statBonuses.rangedDefense,5,'a generated signature retains the permanent source-design signature');
});

test('named market offers remain scarce, within budgets, and purchase/sale paths support intrinsic IDs', () => {
  let found=null;
  for(let seed=1;seed<=100&&!found;seed++){
    const state=createGame(seed);state.position={x:SETTLEMENTS.find(t=>t.id==='frostgate').x,y:140};state.gold=100000;
    const rare=getMarket(state).equipment.filter(row=>row.stock>0&&getItem(row.itemId).rarity==='named');
    assert.ok(rare.length<=1);
    if(rare.length)found={state,id:rare[0].itemId};
  }
  assert.ok(found);const {state,id}=found;
  assert.equal(buyItem(state,id).ok,true);assert.equal(getMarket(state).equipment.find(r=>r.itemId===id).stock,0);
  state.inventoryCondition[state.inventory.indexOf(id)]=20;assert.deepEqual(validateSave(state),state);assert.equal(sellItem(state,id).ok,true);assert.equal(buyItem(state,id).ok,true);assert.equal(state.inventoryCondition[state.inventory.indexOf(id)],20,'rare buybacks preserve damage');assert.deepEqual(validateSave(state),state);
});

test('real v0.42 active-battle fixtures retain damage and stats while adopting new maxima and DLC drop validation', () => {
  const {fixtures}=JSON.parse(readFileSync(new URL('./fixtures/rare-gear-v042.json',import.meta.url)));
  for(const fixture of fixtures){
    const before=structuredClone(fixture.state),restored=validateSave(fixture.state);
    assert.deepEqual(fixture.state,before,'import leaves input untouched');
    assert.deepEqual(validateSave(restored),restored);
    assert.equal(restored.battle.famedDrop,before.battle.famedDrop);
    for(const unit of restored.battle.units){
      const previous=before.battle.units.find(u=>u.id===unit.id);
      assert.equal(unit.headArmor,previous.headArmor);assert.equal(unit.bodyArmor,previous.bodyArmor);assert.equal(unit.rangedDefense,previous.rangedDefense);
      assert.equal(unit.maxHeadArmor,getItem(unit.equipment.helmet)?.armor??0);
    }
  }
});

test('DLC famed drops round trip for multiple camps and cannot be replaced with arbitrary variants', () => {
  let checked=0;
  for(let seed=1;seed<=15;seed++)for(const id of ['wild-camp-13','wild-camp-24','wild-camp-36']){
    const state=createGame(seed),camp=getCampSites(state).find(c=>c.id===id);state.position={x:camp.x,y:camp.y};assert.equal(startBattle(state,id).ok,true);
    if(!state.battle.famedDrop?.includes('bb-'))continue;
    checked++;assert.deepEqual(validateSave(state),state);
    const bad=structuredClone(state);bad.battle.famedDrop='famed:bb-fangshire:0';assert.throws(()=>validateSave(bad),/famed drop/);
  }
  assert.ok(checked>=5);
});


test('regional enemies keep strict cultural sets and even elite woodland fighters remain light',()=>{
  for(const region of REGIONS)for(const tier of [1,2,3])for(let seed=1;seed<=100;seed++){
    const theme=armoryTheme(region.id);
    for(const [index,enemy]of worldEnemyTemplates(region.x,region.y,tier).entries()){
      const geared=regionalOutfit(enemy,seed,index,region.x,region.y,tier);
      for(const slot of ['armor','helmet'])assert.ok(matchesArmoryTheme(getItem(geared[slot]),theme),`${region.id}/${tier}: ${geared[slot]}`);
      if(theme==='forest'){assert.ok(getItem(geared.armor).fatigue<=15);assert.ok(getItem(geared.helmet).fatigue<=9);}
      if(theme==='north'&&enemyCombatRole(geared)!=='ranged')assert.ok(/northern-|longaxe|two-handed-hammer|javelin|throwing-axes/.test(geared.weapon));
    }
  }
});

test('ancient tombs occur only in special regions and all guards and reinforcements wear ancient gear',()=>{
  let found=0;
  for(let seed=1;seed<=20;seed++){
    const state=createGame(seed);state.day=100;
    for(const site of getCampSites(state).filter(c=>c.factionId==='ancient')){
      found++;assert.ok(['blackwater-basin','eastern-frontier','northern-highlands'].includes(regionAt(site.x,site.y).id));
      assert.match(site.name,/Ancient Sepulcher/);assert.ok(site.enemies.every(e=>!e.mount));
      for(const e of site.enemies)for(const slot of ['armor','helmet'])assert.ok(matchesArmoryTheme(getItem(e[slot]),'ancient'));
    }
  }
  assert.ok(found>=20,'special camps are consistently present');
});

test('real v0.44.6 active battle at a newly ancient site retains its original name, worn gear, damage and turn state',()=>{
  const {state}=JSON.parse(readFileSync(new URL('./fixtures/regional-battle-v0446.json',import.meta.url)));
  const restored=validateSave(state);
  assert.notEqual(getCampSites(restored).find(c=>c.id===state.battle.campId).name,state.battle.encounterName);
  assert.deepEqual(restored.battle.units,state.battle.units);
  assert.equal(restored.battle.encounterName,state.battle.encounterName);
  assert.deepEqual(restored.battle.turnOrder,state.battle.turnOrder);
  assert.equal(restored.battle.rng,state.battle.rng);
  assert.deepEqual(validateSave(restored),restored);
});
