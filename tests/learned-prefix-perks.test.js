import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import { AFFIX_PERKS, equipmentPerkUpgrade, perkFlags } from '../src/item-affixes.js';
import { AFFIX_MASTERIES, LEARNED_PERK_ENHANCEMENTS, equipmentPerkText } from '../src/affix-prefixes.js';
import { encodeForgeItem, extractForgeProfile, forgeProfileRows } from '../src/reforged-items.js';
import { equipmentSkills } from '../src/combat-skills.js';
import { setSimultaneousBetaEnabled } from '../src/combat-config.js';
const catalogue=id=>game.ITEMS.find(i=>i.id===id);
const grant=(base,perks)=>encodeForgeItem(base,{perkFlags:perkFlags(perks)},catalogue);
function fight({weapon='arming-sword',perk=null,learned=true,distance=1,legacy=false,realtime=false,armor='leather-vest',shield=null,accessory=null,reserve=null}={}) {
 const state=game.createGame(7391),person=state.party[0];person.level=30;person.perks=perk&&learned?[perk]:[];
 Object.assign(person.equipment,{weapon,armor:perk?grant(armor,[perk]):armor,helmet:null,shield});
 Object.assign(person.armorDurability,{head:0,body:game.getItem(person.equipment.armor).armor,shield:game.shieldMaximum(shield),attachment:0,attachment2:0});
 person.equipment.attachment=null;person.equipment.attachment2=null;person.reserveEquipment={weapon:reserve,shield:null};person.accessories=[accessory,null];
 const camp=game.getCampSites(state)[0];state.position={x:camp.x,y:camp.y};setSimultaneousBetaEnabled(realtime);
 try{assert.ok(game.startBattle(state,camp.id).ok);}finally{setSimultaneousBetaEnabled(false);}
 const battle=state.battle,actor=battle.units.find(u=>u.id===person.id),target=battle.units.find(u=>u.side==='enemy');
 if(legacy){delete battle.prefixPerkRulesVersion;for(const unit of battle.units)delete unit.prefixPerkRulesVersion;}
 for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
 for(const [i,unit] of battle.units.entries()){unit.q=i+1;unit.r=13;}
 Object.assign(actor,{q:5,r:5,meleeSkill:200,rangedSkill:200,fatigue:0,turnStartedRound:battle.round,skillPreference:'damage',tacticalRole:'frontliner'});
 Object.assign(target,{q:5+distance,r:5,hp:1000,maxHp:1000,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,shieldDurability:0,morale:50});target.equipment.shield=null;
 for(const unit of battle.units)if(unit!==actor&&unit!==target){unit.alive=false;unit.hp=0;unit.ap=0;}
 battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);battle.rng=0;
 return {state,person,battle,actor,target};
}
function hit(f,ap=6){f.actor.ap=ap;game.advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'attack',JSON.stringify(f.battle.lastEvent));return f.battle.lastEvent;}

test('all 20 granted perks explain their learned benefit in item and forge details',()=>{
 assert.deepEqual(Object.keys(LEARNED_PERK_ENHANCEMENTS).sort(),[...AFFIX_PERKS].sort());
 for(const id of AFFIX_PERKS){assert.match(equipmentPerkText(id),/if learned,/);const item=game.getItem(grant('mail-shirt',[id]));assert.equal(forgeProfileRows(item.forgeProfile,item)[0].value,equipmentPerkText(id));}
});

test('learned eligibility updates live and duplicates, reserves, broken shields and old battles do not stack',()=>{
 const item=grant('mail-shirt',['recover']),shield=grant('round-shield',['recover']);
 const actor={equipment:{armor:item},perks:[]};assert.equal(equipmentPerkUpgrade(actor,'recover',game.getItem),false);
 actor.perks.push('recover');assert.equal(equipmentPerkUpgrade(actor,'recover',game.getItem),true);
 actor.equipment.helmet=grant('mail-coif',['recover']);assert.equal(equipmentPerkUpgrade(actor,'recover',game.getItem),true);
 actor.equipment={};actor.reserveEquipment={weapon:item};assert.equal(equipmentPerkUpgrade(actor,'recover',game.getItem),false);
 actor.equipment={shield};actor.shieldDurability=1;assert.equal(equipmentPerkUpgrade(actor,'recover',game.getItem),true);actor.shieldDurability=0;assert.equal(equipmentPerkUpgrade(actor,'recover',game.getItem),false);
 actor.equipment={armor:item};actor.side='company';assert.equal(equipmentPerkUpgrade(actor,'recover',game.getItem),false);actor.prefixPerkRulesVersion=1;assert.equal(equipmentPerkUpgrade(actor,'recover',game.getItem),true);
});

test('all nine matching masteries enhance AP or dagger accuracy while retaining normal fatigue costs; nonmatching mastery has no effect',()=>{
 const examples=[['arming-sword','sword-training',1],['hand-axe','axe-training',1],['flanged-mace','mace-training',1],['spear','spear-training',1],['billhook','polearm-training',2],['rondel-dagger','dagger-training',1],['throwing-axes','throwing-training',2],['hunting-bow','bow-mastery',3],['light-crossbow','crossbow-mastery',3]];
 for(const [weapon,perk,distance] of examples){
  const gear=fight({weapon,perk,distance,learned:false}),learned=fight({weapon,perk,distance}),old=fight({weapon,perk,distance,legacy:true});
  const skill=equipmentSkills(game.getItem(weapon))[0];
  for(const f of [gear,learned,old]){f.actor.fatigue=f===learned?f.actor.maxFatigue-Math.ceil((skill.fatigue??game.getItem(weapon).fatigueCost??9)*.75):0;hit(f);}
  assert.equal(learned.actor.ap,gear.actor.ap+(perk==='dagger-training'?0:1),perk);
  assert.equal(learned.actor.fatigue,learned.actor.maxFatigue,perk);
  // Legacy/base mastery still needs its original fatigue budget; exercise that separately.
  const legacy=fight({weapon,perk,distance,legacy:true});legacy.actor.fatigue=0;hit(legacy);const used=equipmentSkills(game.getItem(weapon)).find(s=>s.name===legacy.battle.lastEvent.skillName);assert.equal(legacy.actor.fatigue,Math.ceil((used.fatigue??game.getItem(weapon).fatigueCost??9)*.75),perk);
  const wrong=fight({weapon:'arming-sword',perk:perk==='sword-training'?'axe-training':perk}),plain=fight();hit(wrong);hit(plain);assert.equal(wrong.actor.ap,plain.actor.ap,perk);assert.equal(wrong.actor.fatigue,plain.actor.fatigue,perk);
 }
});

test('mastery enhancement preserves 5 AP Warbrand/Romphaia area attacks and Heavy Weapon Specialist rounding',()=>{
 for(const weapon of ['bb-named-warbrand','rhomphaia']){
  const f=fight({weapon,perk:weapon==='bb-named-warbrand'?'sword-training':'polearm-training'});f.actor.ap=5;f.actor.fatigue=0;
  const second=f.battle.units.find(u=>u.side==='enemy'&&u!==f.target);Object.assign(second,{alive:true,hp:1000,maxHp:1000,q:7,r:5,headArmor:200,bodyArmor:200,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,morale:50});
  Object.assign(f.target,{headArmor:200,bodyArmor:200});f.battle.rng=4;game.advanceBattle(f.state);assert.ok(['Split','Swing'].includes(f.battle.lastEvent.skillName));assert.equal(f.actor.ap,0);
 }
 const f=fight({weapon:'greatsword',perk:'sword-training'});f.actor.perks.push('heavy-weapon-specialist');f.actor.fatigue=f.actor.maxFatigue-11;hit(f);assert.equal(f.actor.fatigue,f.actor.maxFatigue);assert.equal(f.actor.ap,1);
});

test('Pathfinder and Fleet Footed improve real movement without stacking multiple grants',()=>{
 for(const [learned,legacy,fatigue] of [[false,false,2],[true,false,1],[true,true,2]]){
  const f=fight({perk:'pathfinder',learned,legacy,distance:3});game.advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'move');assert.equal(f.actor.fatigue,fatigue);
 }
 for(const [learned,legacy,credit] of [[false,false,2],[true,false,4]]){
  const f=fight({perk:'fleet-footed',learned,legacy});assert.equal(f.actor.movementCredit,credit);
 }
});

test('Recover removes 75% current fatigue, respects its minimum and does not double for duplicate gear',()=>{
 for(const [learned,legacy,remaining] of [[false,false,47],[true,false,23],[true,true,47]]){
  const f=fight({perk:'recover',learned,legacy});f.actor.fatigue=95;f.actor.maxFatigue=100;game.advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'recover');assert.equal(f.actor.fatigue,remaining);
 }
 const f=fight({perk:'recover'});f.actor.equipment.helmet=grant('cloth-hood',['recover']);f.actor.fatigue=95;f.actor.maxFatigue=100;game.advanceBattle(f.state);assert.equal(f.actor.fatigue,23);
});

test('Combat Bandaging heals 25% more with the same free use and item consumption',()=>{
 for(const [learned,legacy,multiplier] of [[false,false,1],[true,false,1.25],[true,true,1]]){
  const f=fight({perk:'combat-bandaging',learned,legacy,accessory:'bandages'});f.actor.hp=30;const ap=f.actor.ap;game.advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'use');assert.equal(f.actor.hp,Math.min(f.actor.maxHp,30+Math.ceil(game.getItem('bandages').heal*multiplier)));assert.equal(f.actor.ap,ap);assert.equal(f.actor.accessories[0],null);
 }
});

test('Quick Hands uses 2 AP for later swaps and snapshots the cost before removing the granting weapon',()=>{
 for(const [learned,legacy,cost] of [[false,false,4],[true,false,2],[true,true,4]]){
  const f=fight({weapon:'light-crossbow',perk:'quick-hands',learned,legacy,reserve:'arming-sword'});f.state.supplies.ammo=0;f.actor.reload=1;f.actor.freeSwapRound=f.battle.round;f.actor.ap=cost;
  game.advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'swap');assert.equal(f.actor.ap,0);assert.equal(f.actor.equipment.weapon,'arming-sword');
 }
 const f=fight({weapon:grant('light-crossbow',['quick-hands']),perk:'quick-hands',reserve:'arming-sword'});f.actor.equipment.armor='leather-vest';f.actor.freeSwapRound=f.battle.round;f.actor.ap=2;f.state.supplies.ammo=0;f.actor.reload=1;game.advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'swap');assert.equal(f.actor.ap,0);assert.equal(equipmentPerkUpgrade(f.actor,'quick-hands',game.getItem),false);
 const low=fight({weapon:'light-crossbow',perk:'quick-hands',reserve:'arming-sword'});low.actor.freeSwapRound=low.battle.round;low.actor.ap=1;low.state.supplies.ammo=0;low.actor.reload=1;game.advanceBattle(low.state);assert.notEqual(low.battle.lastEvent.type,'swap');
});

test('Backstabber and Anticipation improve exact hit probabilities without changing other attacks',()=>{
 const f=fight({perk:'backstabber'});f.actor.meleeSkill=45;const ally=f.battle.units.find(u=>u.side==='company'&&u!==f.actor);Object.assign(ally,{alive:true,hp:100,q:6,r:4});
 const weapon=game.getItem('arming-sword'),up=game.attackHitChance(f.battle,f.actor,f.target,weapon);f.actor.perks=[];assert.equal(up-game.attackHitChance(f.battle,f.actor,f.target,weapon),3);
 const ranged=fight({perk:'anticipation',weapon:'hunting-bow',distance:4});Object.assign(ranged.actor,{rangedDefense:40});Object.assign(ranged.target,{rangedSkill:100});
 const bow=game.getItem('hunting-bow'),hit=game.attackHitChance(ranged.battle,ranged.target,ranged.actor,bow);ranged.actor.perks=[];assert.equal(game.attackHitChance(ranged.battle,ranged.target,ranged.actor,bow)-hit,8);
});

test('Shield Expert boosts both defense values; Relentless boosts equipment initiative and Dodge',()=>{
 for(const perk of ['shield-expert','relentless']){
  const f=fight({perk,armor:'mail-shirt',shield:'round-shield'}),stats=game.getCompanyStats(f.person);f.person.perks=[];const base=game.getCompanyStats(f.person);
  if(perk==='shield-expert'){const shield=game.getItem('round-shield');assert.equal(stats.meleeDefense-base.meleeDefense,Math.ceil(shield.defense*1.4)-Math.ceil(shield.defense*1.25));assert.equal(stats.rangedDefense-base.rangedDefense,Math.ceil(shield.rangedDefense*1.4)-Math.ceil(shield.rangedDefense*1.25));}
  else assert.ok(stats.initiative>base.initiative);
 }
 const f=fight({perk:'relentless'});Object.assign(f.actor,{initiative:100,fatigue:80});f.actor.perks.push('dodge');f.target.meleeSkill=70;
 const up=game.attackHitChance(f.battle,f.target,f.actor,game.getItem('arming-sword'));f.actor.perks=['dodge'];assert.equal(game.attackHitChance(f.battle,f.target,f.actor,game.getItem('arming-sword'))-up,1);
});

test('new and legacy active battles round-trip in both combat modes; marker mismatch rejects',()=>{
 for(const realtime of [false,true]){
  const state=game.createGame(7391),p=state.party[0];p.level=30;p.perks=['sword-training'];p.equipment.weapon=grant('arming-sword',['sword-training']);const site=game.getCampSites(state)[0];state.position={x:site.x,y:site.y};setSimultaneousBetaEnabled(realtime);try{assert.ok(game.startBattle(state,site.id).ok);}finally{setSimultaneousBetaEnabled(false);}
  assert.deepEqual(game.validateSave(structuredClone(state)),state);
  const bad=structuredClone(state);delete bad.battle.units[0].prefixPerkRulesVersion;assert.throws(()=>game.validateSave(bad),/prefix perk/);
  delete state.battle.prefixPerkRulesVersion;for(const unit of state.battle.units)delete unit.prefixPerkRulesVersion;assert.deepEqual(game.validateSave(structuredClone(state)),state);
 }
});

test('forge transfer retains perk identity and learned enhancement without changing encoded profiles',()=>{
 const source=game.getItem(grant('greatsword',['sword-training'])),profile=extractForgeProfile(source,catalogue,{shieldMaximum:game.shieldMaximum,shieldDamage:game.shieldImpactDamage});const recipient=game.getItem(encodeForgeItem('arming-sword',profile,catalogue));assert.deepEqual(recipient.grantedPerks,['sword-training']);assert.equal(recipient.forgeProfile.perkFlags,source.forgeProfile.perkFlags);
 const f=fight({weapon:recipient.id,perk:'sword-training'});f.actor.equipment.armor='leather-vest';hit(f);assert.equal(f.actor.ap,3);
});

test('Steel Brow reduces only head health damage; Layered Armor reduces only protected body armor damage',()=>{
 for(const perk of ['steel-brow','layered-armor']){
  const seen=new Set();
  for(const seed of [0,1,2,3,4,5,6,7,8,9]){
   const plain=fight(),enhanced=fight();
   for(const f of [plain,enhanced]){
    f.target.equipment.armor=grant('mail-shirt',[perk]);f.target.equipment.attachment='scale-mantle';f.target.perks=f===enhanced?[perk]:[];
    Object.assign(f.target,{bodyArmor:300,headArmor:300,attachmentArmor:60,attachment2Armor:0});f.battle.rng=seed;
   }
   const a=hit(plain),b=hit(enhanced);assert.equal(b.head,a.head);seen.add(a.head);
   if(perk==='steel-brow'){assert.equal(b.armorDamage,a.armorDamage);assert.equal(b.hpDamage,a.head?Math.max(1,Math.round(a.hpDamage*.9)):a.hpDamage);}
   else {assert.equal(b.hpDamage,a.hpDamage);if(a.head)assert.equal(b.armorDamage,a.armorDamage);else assert.ok(Math.abs(b.armorDamage-a.armorDamage*.9)<=1);}
  }
  assert.deepEqual([...seen].sort(),[false,true]);
 }
 const plain=fight(),enhanced=fight();enhanced.target.equipment.armor=grant('mail-shirt',['layered-armor']);enhanced.target.perks=['layered-armor'];for(const f of [plain,enhanced]){f.target.bodyArmor=300;f.target.headArmor=300;f.target.attachmentArmor=0;f.battle.rng=0;}assert.equal(hit(enhanced).armorDamage,hit(plain).armorDamage);
});

test('Shield Expert reduces real shield wear and a broken granting shield loses the enhancement',()=>{
 for(const [learned,multiplier] of [[false,.5],[true,.4]]){
  const f=fight();f.actor.equipment.weapon='wood-axe';f.target.equipment.shield=grant('round-shield',['shield-expert']);f.target.shieldDurability=100;f.target.maxShieldDurability=100;f.target.meleeDefense=-100;f.target.perks=learned?['shield-expert']:[];
  hit(f);assert.equal(f.target.shieldDurability,100-Math.ceil(game.shieldImpactDamage(game.getItem('wood-axe'))*multiplier));
  f.target.shieldDurability=0;assert.equal(equipmentPerkUpgrade(f.target,'shield-expert',game.getItem),false);
 }
});

test('learned Dagger prefix adds exactly 10 hit chance, keeps 2 AP Stab and 25% fatigue relief',()=>{
 const f=fight({weapon:'rondel-dagger',perk:'dagger-training'});f.actor.meleeSkill=40;
 const dagger=game.getItem('rondel-dagger'),chance=game.attackHitChance(f.battle,f.actor,f.target,dagger);
 f.actor.perks=[];assert.equal(chance-game.attackHitChance(f.battle,f.actor,f.target,dagger),10);
 f.actor.perks=['dagger-training'];f.actor.meleeSkill=200;f.actor.ap=2;hit(f,2);assert.equal(f.actor.ap,0);assert.equal(f.actor.fatigue,6);
});

test('realtime actions use the same mastery AP discount and unchanged fatigue, with shorter recovery',()=>{
 const clocks=[];
 for(const learned of [false,true]){
  const f=fight({weapon:'greatsword',perk:'sword-training',learned,realtime:true});f.actor.ap=9;f.actor.initiative=200;
  for(const unit of f.battle.units)f.battle.simultaneous.actors[unit.id].readyAt=unit===f.actor?0:1000;
  game.advanceSimultaneousBattle(f.state,50);assert.equal(f.battle.lastEvent.type,'attack');assert.equal(f.actor.ap,learned?4:3);assert.equal(f.actor.fatigue,12);clocks.push(f.battle.simultaneous.actors[f.actor.id].readyAt);
 }
 assert.ok(clocks[1]<clocks[0]);
});

test('learned Polearm prefix makes Strike cost 4 AP; learned Sword prefix leaves Riposte at 2 AP',()=>{
 const polearm=fight({weapon:'billhook',perk:'polearm-training',distance:2});polearm.actor.ap=4;polearm.actor.fatigue=polearm.actor.maxFatigue-12;game.advanceBattle(polearm.state);assert.equal(polearm.battle.lastEvent.skillName,'Strike');assert.equal(polearm.actor.ap,0);
 const sword=fight({perk:'sword-training'});sword.actor.ap=2;sword.actor.skillPreference='control';game.advanceBattle(sword.state);assert.equal(sword.battle.lastEvent.skillName,'Riposte');assert.equal(sword.actor.ap,0);assert.equal(sword.actor.riposteActive,true);
});
