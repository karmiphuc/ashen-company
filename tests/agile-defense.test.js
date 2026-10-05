import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getItem, getAgileDefenseMultiplier, getCompanyStats, getCampSites, startBattle, advanceBattle, learnPerk, getPerkPoints, validateSave, PERKS } from '../src/engine.js';

function light(perks = ['agile-defense']) {
  const p = createGame(123).party[0]; p.perks = perks;
  p.equipment.armor = 'mail-shirt'; p.equipment.helmet = null;
  return p;
}
function encounter(weapon='arming-sword', armored=false) {
  const s=createGame(251), p=s.party[0];p.equipment.weapon=weapon;p.equipment.shield=null;p.armorDurability.shield=0;
  const site=getCampSites(s)[0];s.position={x:site.x,y:site.y};assert.equal(startBattle(s,site.id).ok,true);
  const b=s.battle, a=b.units.find(u=>u.id==='captain'), t=b.units.find(u=>u.id==='enemy-1');
  for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
  Object.assign(a,{q:3,r:3,meleeSkill:200,rangedSkill:200,morale:50,fatigue:0,skillPreference:'damage'});
  Object.assign(t,{q:getItem(weapon).ranged?6:4,r:3,hp:300,maxHp:300,bodyArmor:armored?1000:0,headArmor:armored?1000:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,morale:80,perks:['agile-defense'],equipment:{...t.equipment,armor:'mail-shirt',helmet:null,shield:null},shieldDurability:0});
  for(const other of b.units.filter(u=>u!==a&&u!==t))Object.assign(other,{q:0,r:other.id==='scout'?0:1,hp:0,alive:false});
  a.turnStartedRound=b.round;a.ap=4;a.fatigue=a.maxFatigue-14;
  b.turnIndex=b.turnOrder.indexOf(a.id);b.activeId=a.id;b.rng=0;
  return {s,b,a,t};
}

test('Agile Defense is separate from Nimble and costs one level-five perk point',()=>{
  const s=createGame(31),p=s.party[0];p.level=4;const before=structuredClone(s);
  assert.equal(learnPerk(s,p.id,'agile-defense').ok,false);assert.deepEqual(s,before);
  p.level=5;const points=getPerkPoints(p);assert.equal(learnPerk(s,p.id,'agile-defense').ok,true);assert.equal(getPerkPoints(p),points-1);
  assert.equal(learnPerk(s,p.id,'agile-defense').ok,false);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
  const site=getCampSites(s)[0];s.position={x:site.x,y:site.y};startBattle(s,site.id);
  assert.ok(s.battle.units.find(u=>u.id===p.id).perks.includes('agile-defense'));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
  assert.match(PERKS.find(x=>x.id==='nimble').description,/\+5 melee and ranged defense/);
});
test('full protection at zero and exactly 15 raw body/head fatigue tapers smoothly to none',()=>{
  const p=light();assert.equal(getAgileDefenseMultiplier(p),.4);
  p.equipment.armor=null;assert.equal(getAgileDefenseMultiplier(p),.4);
  p.equipment.armor='mail-shirt';p.equipment.helmet='kettle-helm';
  assert.equal(getAgileDefenseMultiplier(p),.4+12**1.23/100);
  p.equipment.armor='plate-harness';assert.equal(getAgileDefenseMultiplier(p),1);
  p.perks=[];p.equipment.armor=null;assert.equal(getAgileDefenseMultiplier(p),1);
});
test('both attachments, shield, mount, Brawny and broken condition never improve or reduce the weight check',()=>{
  const p=light(['agile-defense','brawny','layered-armor']);
  Object.assign(p.equipment,{attachment:'kraken-mantle',attachment2:'scale-mantle',shield:'kite-shield',mount:'armored-war-horse'});
  p.armorDurability.body=0;p.armorDurability.head=0;assert.equal(getAgileDefenseMultiplier(p),.4);
  p.equipment.armor='mail-shirt';p.equipment.helmet='kettle-helm';
  assert.equal(getAgileDefenseMultiplier(p),.4+12**1.23/100);
  const without=light([]), withBoth=light(['nimble','agile-defense']);
  assert.equal(getCompanyStats(withBoth).meleeDefense,getCompanyStats(without).meleeDefense+5);
});
test('real melee and missile hits reduce health 60% without altering armor damage',()=>{
  for(const weapon of ['arming-sword','bludgeon','hunting-bow','light-crossbow','javelins']){
    const {s,b}=encounter(weapon),plain=structuredClone(s);plain.battle.units.find(u=>u.id==='enemy-1').perks=[];
    advanceBattle(s);advanceBattle(plain);
    assert.equal(b.lastEvent.type,'attack',weapon);assert.equal(plain.battle.lastEvent.type,'attack',weapon);
    assert.equal(b.lastEvent.skillName,plain.battle.lastEvent.skillName,weapon);
    assert.equal(b.lastEvent.hpDamage,Math.max(1,Math.round(plain.battle.lastEvent.hpDamage*.4)),weapon);
    assert.equal(b.lastEvent.armorDamage,plain.battle.lastEvent.armorDamage,weapon);
  }
});
test('hammer minimum health damage is reduced, even through thick armor',()=>{
  const {s,b}=encounter('warhammer',true),plain=structuredClone(s);plain.battle.units.find(u=>u.id==='enemy-1').perks=[];
  advanceBattle(s);advanceBattle(plain);assert.equal(b.lastEvent.type,'attack');
  assert.equal(plain.battle.lastEvent.hpDamage,6);assert.equal(b.lastEvent.hpDamage,2);
  assert.equal(b.lastEvent.armorDamage,plain.battle.lastEvent.armorDamage);
});
test('Iron Jaw stacks multiplicatively with Agile Defense',()=>{
  const {s,b,t}=encounter();t.perks.push('iron-jaw');const plain=structuredClone(s);plain.battle.units.find(u=>u.id===t.id).perks=['iron-jaw'];
  advanceBattle(s);advanceBattle(plain);assert.equal(b.lastEvent.hpDamage,Math.max(1,Math.round(plain.battle.lastEvent.hpDamage*.4)));
});
test('bleeding continues to deal its fixed health damage',()=>{
  const {s,b,a,t}=encounter();Object.assign(t,{bleeding:{damage:10,turns:2,sourceId:a.id},bleedTickRound:0});b.turnIndex=b.turnOrder.indexOf(t.id);b.activeId=t.id;
  advanceBattle(s);assert.equal(b.lastEvent.skillName,'Bleeding');assert.equal(b.lastEvent.hpDamage,10);
});

test('armor-bypassing Puncture also loses 60% health damage',()=>{
  const {s,b,a}=encounter('rondel-dagger',true);a.ap=9;a.fatigue=0;
  const plain=structuredClone(s);plain.battle.units.find(u=>u.id==='enemy-1').perks=[];
  advanceBattle(s);advanceBattle(plain);
  assert.equal(b.lastEvent.skillName,'Puncture');assert.equal(plain.battle.lastEvent.skillName,'Puncture');
  assert.equal(b.lastEvent.hpDamage,Math.max(1,Math.round(plain.battle.lastEvent.hpDamage*.4)));
  assert.equal(b.lastEvent.armorDamage,0);
});
