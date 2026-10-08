import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetArmorSnapshot } from '../src/equipment-sets.js';
import { championRoster } from '../src/discovery.js';
import { createGame, getCampSites, getItem, createFamedItemId, startBattle, advanceBattle, validateSave, shieldMaximum } from '../src/engine.js';
const named = id => ['famed','named'].includes(getItem(id)?.rarity);
const enemy = {name:'Veteran Champion',weapon:'arming-sword',shield:'round-shield',armor:'mail',helmet:'mail-coif'};
// Use known ordinary armor IDs from the game's starting loadout.
const game = createGame(51);
enemy.armor = game.party[0].equipment.armor; enemy.helmet = game.party[0].equipment.helmet;
function roster(seed, discoveryRolls = {}) {
  return championRoster({seed,day:1,discoveryRolls},{id:'test-camp',generation:0,difficulty:3,enemies:[enemy,enemy]},getItem,createFamedItemId);
}
test('every champion has independent armor and helmet opportunities; leader includes shield and reserves', () => {
  const counts = { armor:0,helmet:0,both:0,reserveWeapon:0,reserveShield:0,shield:0 };
  for (let seed=1; seed<=4000; seed++) {
    const [leader, champion] = roster(seed);
    assert.ok(named(champion.weapon));
    for (const slot of ['armor','helmet']) if (named(champion[slot])) counts[slot]++;
    if (named(champion.armor) && named(champion.helmet)) counts.both++;
    assert.equal(champion.reserveWeapon,undefined); assert.equal(champion.reserveShield,undefined);
    for (const slot of ['shield','reserveWeapon','reserveShield']) if (named(leader[slot])) counts[slot]++;
  }
  for (const slot of ['armor','helmet','shield','reserveWeapon','reserveShield']) assert.ok(counts[slot]>350 && counts[slot]<650, `${slot}: ${counts[slot]}`);
  assert.ok(counts.both>20 && counts.both<110, `both: ${counts.both}`);
});
test('rolls are repeatable, do not mutate templates and leave legacy frozen encounters unchanged', () => {
  const before = structuredClone(enemy);
  assert.deepEqual(roster(123),roster(123)); assert.deepEqual(enemy,before);
  for (let seed=1;seed<100;seed++) {
    const frozen = {'test-camp':{cycle:0,champion:0,famed:0,mount:0}};
    for (const champion of roster(seed,frozen)) {
      assert.equal(champion.armor,enemy.armor); assert.equal(champion.helmet,enemy.helmet);
      assert.equal(champion.reserveWeapon,undefined);
    }
    const current = {'test-camp':{cycle:0,champion:0,famed:0,mount:0,championGearVersion:1}};
    assert.deepEqual(roster(seed,current),roster(seed));
  }
});
test('two-handed leaders never gain incompatible reserve shields', () => {
  const template = {...enemy,weapon:'greatsword',shield:null};
  for(let seed=1;seed<=100;seed++) {
    const [leader] = championRoster({seed,day:1},{id:'test-camp',difficulty:3,enemies:[template]},getItem,createFamedItemId);
    assert.ok(!leader.reserveShield);
  }
});
test('champion reserve trophies survive swaps, zero condition, and result save/reload', () => {
  const state=createGame(51),site=getCampSites(state)[0]; state.position={x:site.x,y:site.y}; startBattle(state,site.id);
  const champion=state.battle.units.find(u=>u.side==='enemy');
  const weapon=createFamedItemId('arming-sword',981),reserve=createFamedItemId('arming-sword',982),shield=createFamedItemId('round-shield',983);
  champion.champion=true;champion.championItemId=weapon;champion.equipment.weapon=reserve;champion.equipment.shield=null;
  champion.shieldDurability=champion.maxShieldDurability=0;
  champion.reserveEquipment={weapon,shield}; champion.reserveShieldDurability=0;champion.maxReserveShieldDurability=shieldMaximum(shield);
  assert.doesNotThrow(()=>validateSave(structuredClone(state)));
  for(const unit of state.battle.units.filter(u=>u.side==='enemy')) {unit.hp=0;unit.alive=false;}
  const actor=state.battle.units.find(u=>u.side==='company');state.battle.activeId=actor.id;state.battle.turnIndex=state.battle.turnOrder.indexOf(actor.id);advanceBattle(state);
  for(const id of [weapon,reserve,shield]) assert.equal(state.battle.loot.items.filter(x=>x===id).length,1);
  assert.ok(state.battle.loot.itemConditions[state.battle.loot.items.indexOf(shield)]>0);
  assert.deepEqual(validateSave(structuredClone(state)),state);
});
test('full champion kits cannot overflow the former eighty-trophy limit', () => {
  const state=createGame(7391),original=structuredClone(state.party[0]);
  while(state.party.length<15) state.party.push({...structuredClone(original),id:`fighter-${state.party.length}`,name:'Veteran'});
  for(const person of state.party)person.level=13;
  state.formation=Array.from({length:36},(_,i)=>state.party[i]?.id??null);state.day=60;state.shipments={};state.shipmentLegacyThroughDay=60;
  const site=getCampSites(state).find(s=>s.enemies.length===20);state.position={x:site.x,y:site.y};assert.ok(startBattle(state,site.id).ok);
  const trophies=[];
  for(const [i,u] of state.battle.units.filter(u=>u.side==='enemy').entries()) {
    const ids=['arming-sword','round-shield','mail-shirt','mail-coif','arming-sword','round-shield'].map((id,j)=>createFamedItemId(id,1000+i*6+j));
    trophies.push(...ids);u.champion=true;u.championItemId=ids[0];
    Object.assign(u.equipment,{weapon:ids[0],shield:ids[1],armor:ids[2],helmet:ids[3]});u.reserveEquipment={weapon:ids[4],shield:ids[5]};
    u.maxShieldDurability=shieldMaximum(ids[1]);u.maxReserveShieldDurability=shieldMaximum(ids[5]);u.shieldDurability=u.reserveShieldDurability=0;
    // This synthetic full kit now matches Field Mail; initialize its real set pools.
    const snapshot=createSetArmorSnapshot(u,getItem,{},state.battle.equipmentSetRulesVersion);
    if(snapshot)u.setArmor=snapshot;else delete u.setArmor;
    u.maxBodyArmor=snapshot?.body.effectiveMax??getItem(ids[2]).armor;u.maxHeadArmor=snapshot?.head.effectiveMax??getItem(ids[3]).armor;
    u.bodyArmor=u.headArmor=0;u.hp=0;u.alive=false;
  }
  const actor=state.battle.units.find(u=>u.side==='company');state.battle.activeId=actor.id;state.battle.turnIndex=state.battle.turnOrder.indexOf(actor.id);advanceBattle(state);
  assert.equal(state.battle.loot.items.length,120);
  for(const id of trophies)assert.ok(state.battle.loot.items.includes(id));
  assert.deepEqual(validateSave(structuredClone(state)).battle.loot,state.battle.loot);
});
