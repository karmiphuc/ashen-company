import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startBattle,getCampSites,getItem,advanceBattle,advanceSimultaneousBattle,validateSave,getCompanyStats,attackHitChance,PERKS} from '../src/engine.js';
import {equipmentSkills} from '../src/combat-skills.js';
import {weaponMasteryMatches} from '../src/perks.js';
import {setSimultaneousBetaEnabled} from '../src/combat-config.js';
import {perkFlags} from '../src/item-affixes.js';
import {encodeForgeItem} from '../src/reforged-items.js';
import {ITEMS} from '../src/engine.js';
import {battleHTML} from '../src/battle-view.js';

function fight(weapon,perks=[],distance=1,{realtime=false,legacy=false}={}) {
 const state=createGame(7391),person=state.party[0];person.level=30;person.perks=perks;
 person.equipment.weapon=weapon;person.equipment.shield=null;person.armorDurability.shield=0;
 person.reserveEquipment={weapon:null,shield:null};person.accessories=[null,null];
 const camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};
 setSimultaneousBetaEnabled(realtime);try{assert.ok(startBattle(state,camp.id).ok);}finally{setSimultaneousBetaEnabled(false);}
 const battle=state.battle,actor=battle.units.find(u=>u.id===person.id),target=battle.units.find(u=>u.side==='enemy');
 if(legacy){delete battle.perkBalanceVersion;for(const unit of battle.units)delete unit.perkBalanceVersion;}
 for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
 for(const [i,unit] of battle.units.entries()){unit.q=i+1;unit.r=13;}
 Object.assign(actor,{q:5,r:5,meleeSkill:200,rangedSkill:200,fatigue:0,turnStartedRound:battle.round,skillPreference:'damage',tacticalRole:'frontliner'});
 Object.assign(target,{q:5+distance,r:5,hp:1000,maxHp:1000,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,shieldDurability:0,morale:50});target.equipment.shield=null;
 for(const unit of battle.units)if(unit!==actor&&unit!==target){unit.alive=false;unit.hp=0;unit.ap=0;}
 battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);battle.rng=0;
 return {state,battle,actor,target,person};
}
function basic(f) {
 const weapon=getItem(f.actor.equipment.weapon),skill=equipmentSkills(weapon)[0];
 f.actor.ap=6;f.actor.fatigue=f.actor.maxFatigue-(skill.fatigue??weapon.fatigueCost??9);
 advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'attack',weapon.id+': '+JSON.stringify(f.battle.lastEvent));
 assert.equal(f.battle.lastEvent.skillName,skill.name,weapon.id);return f.battle.lastEvent;
}

test('Heavy Weapon Specialist reduces fatigue multiplicatively with one rounding and never discounts AP',()=>{
 for(const [perks,spent] of [[[],15],[['sword-training'],12],[['heavy-weapon-specialist'],14],[['sword-training','heavy-weapon-specialist'],11]]){
  const f=fight('greatsword',perks);f.actor.ap=6;f.actor.fatigue=f.actor.maxFatigue-spent;
  advanceBattle(f.state);assert.equal(f.battle.lastEvent.skillName,'Overhead Strike');assert.equal(f.actor.ap,0);assert.equal(f.actor.fatigue,f.actor.maxFatigue);
 }
});

test('Heavy Weapon Specialist adds penetration without increasing ordinary armor damage',()=>{
 const plain=fight('greatsword'),heavy=fight('greatsword',['heavy-weapon-specialist']);
 for(const f of [plain,heavy])Object.assign(f.target,{headArmor:200,bodyArmor:200});
 const a=basic(plain),b=basic(heavy);assert.equal(a.armorDamage,b.armorDamage);assert.ok(b.hpDamage>a.hpDamage);
});

test('Heavy Weapon Specialist excludes every reach weapon and all one-handed/ranged weapons',()=>{
 for(const [weapon,distance] of [['billhook',2],['longaxe',2],['polehammer',2],['rhomphaia',2],['arming-sword',1],['hunting-bow',3]]){
  const a=fight(weapon,[],distance),b=fight(weapon,['heavy-weapon-specialist'],distance);
  const ea=basic(a),eb=basic(b);assert.equal(eb.hpDamage,ea.hpDamage,weapon);assert.equal(eb.armorDamage,ea.armorDamage,weapon);assert.equal(a.actor.fatigue,b.actor.fatigue,weapon);
 }
});

test('Heavy Weapon Specialist increases real area armor damage including when a secondary target misses',()=>{
 for(const secondaryMiss of [false,true]){
  const plain=fight('greatsword'),heavy=fight('greatsword',['heavy-weapon-specialist']);
  for(const f of [plain,heavy]){
   f.actor.skillPreference='damage';f.actor.ap=6;f.actor.fatigue=0;f.battle.rng=4;
   Object.assign(f.target,{headArmor:200,bodyArmor:200});
   {const other=f.battle.units.find(u=>u.side==='enemy'&&u!==f.target);Object.assign(other,{alive:true,hp:1000,maxHp:1000,q:7,r:5,headArmor:200,bodyArmor:200,attachmentArmor:0,attachment2Armor:0,meleeDefense:secondaryMiss?160:0,rangedDefense:0,morale:50});}
   advanceBattle(f.state);assert.ok(['Split','Swing'].includes(f.battle.lastEvent.skillName),JSON.stringify(f.battle.lastEvent));
  }
  assert.equal(heavy.battle.lastEvent.skillName,plain.battle.lastEvent.skillName);
  if(secondaryMiss)assert.equal(heavy.battle.lastEvent.affectedTargets.filter(t=>t.hit).length,1);
  assert.ok(heavy.battle.lastEvent.armorDamage>plain.battle.lastEvent.armorDamage);
 }
});

test('Reach Advantage starts empty, gains one stack per hit, caps at five and excludes misses',()=>{
 const f=fight('greatsword',['reach-advantage']);assert.equal(f.actor.reachAdvantageStacks,undefined);
 for(let i=0;i<7;i++){f.actor.ap=9;f.actor.fatigue=0;f.battle.rng=0;advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'attack');assert.equal(f.actor.reachAdvantageStacks,Math.min(5,i+1));}
 f.actor.ap=9;f.actor.fatigue=0;f.actor.meleeSkill=-1000;f.battle.rng=0x70000000;
 const before=f.actor.reachAdvantageStacks;advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'miss');assert.equal(f.actor.reachAdvantageStacks,before);
 const html=battleHTML(f.battle);assert.match(html,/Reach Advantage ×5: \+25 melee defense/);
});

test('Reach Advantage counts each area target, but not the secondary body part of Split Man',()=>{
 const f=fight('greatsword',['reach-advantage']);f.actor.skillPreference='damage';
 const other=f.battle.units.find(u=>u.side==='enemy'&&u!==f.target);Object.assign(other,{alive:true,hp:1000,maxHp:1000,q:7,r:5,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,morale:50});
 advanceBattle(f.state);assert.equal(f.battle.lastEvent.skillName,'Split');assert.equal(f.actor.reachAdvantageStacks,2);
 const axe=fight('greataxe',['reach-advantage']);basic(axe);assert.equal(axe.actor.reachAdvantageStacks,1);
});

test('Reach Advantage changes defense and expires on the next turn, including realtime refresh',()=>{
 const f=fight('greatsword',['reach-advantage']);f.actor.reachAdvantageStacks=3;
 const chance=attackHitChance(f.battle,f.target,f.actor,getItem(f.target.equipment.weapon));delete f.actor.reachAdvantageStacks;
 assert.equal(attackHitChance(f.battle,f.target,f.actor,getItem(f.target.equipment.weapon))-chance,15);
 f.actor.reachAdvantageStacks=3;f.actor.turnStartedRound=0;f.actor.ap=9;f.actor.fatigue=f.actor.maxFatigue-12;advanceBattle(f.state);assert.equal(f.actor.reachAdvantageStacks,1);
 const real=fight('greatsword',['reach-advantage'],1,{realtime:true});real.actor.reachAdvantageStacks=3;
 for(const clock of Object.values(real.battle.simultaneous.actors))clock.readyAt=real.battle.simultaneous.roundEndsAt;
 for(let i=0;i<120;i++)advanceSimultaneousBattle(real.state,50,{maxActions:1});
 assert.equal(real.battle.round,2);assert.ok((real.actor.reachAdvantageStacks??0)<=1);
});

test('Duelist adds penetration with empty offhand/buckler, not damage against unarmored targets',()=>{
 for(const shield of [null,'buckler','round-shield']){
  const plain=fight('arming-sword'),duel=fight('arming-sword',['duelist']);
  for(const f of [plain,duel]){f.actor.equipment.shield=shield;f.actor.shieldDurability=shield?getItem(shield).durability:0;Object.assign(f.target,{headArmor:150,bodyArmor:150});}
  const a=basic(plain),b=basic(duel);assert.equal(a.armorDamage,b.armorDamage);assert.equal(b.hpDamage>a.hpDamage,shield!=='round-shield');
 }
 const a=basic(fight('arming-sword')),b=basic(fight('arming-sword',['duelist']));assert.equal(a.hpDamage,b.hpDamage);
});

test('Throwing Mastery has OG distance damage bonuses without reducing AP',()=>{
 for(const [distance,multiplier] of [[2,1.4],[3,1.2],[4,1]]){
  const catalogue=id=>ITEMS.find(item=>item.id===id),weapon=distance===4?encodeForgeItem('javelins',{range:1},catalogue):'javelins';
  const a=fight(weapon,[],distance),b=fight(weapon,['throwing-training'],distance);const ea=basic(a),eb=basic(b);
  assert.ok(Math.abs(eb.hpDamage-ea.hpDamage*multiplier)<=2);assert.equal(a.actor.ap,b.actor.ap);
 }
});

test('specific polearm eligibility and intentional skill costs stay intact',()=>{
 for(const id of ['billhook','pike','rhomphaia'])assert.ok(weaponMasteryMatches('polearm-training',getItem(id)),id);
 for(const id of ['longaxe','polehammer','polemace','spetum'])assert.equal(weaponMasteryMatches('polearm-training',getItem(id)),false,id);
 for(const id of ['warbrand','rhomphaia'])for(const skill of equipmentSkills(getItem(id)).filter(s=>['split','swing'].includes(s.id)))assert.equal(skill.ap,5);
 assert.equal(equipmentSkills(getItem('arming-sword')).find(s=>s.id==='riposte').ap,2);
 const rhom=fight('rhomphaia',['polearm-training']);rhom.actor.skillPreference='damage';rhom.actor.ap=5;
 const other=rhom.battle.units.find(u=>u.side==='enemy'&&u!==rhom.target);Object.assign(other,{alive:true,hp:1000,maxHp:1000,q:7,r:5,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,morale:50});
 advanceBattle(rhom.state);assert.ok(['Split','Swing'].includes(rhom.battle.lastEvent.skillName));assert.equal(rhom.actor.ap,0);
 const dagger=fight('rondel-dagger',['dagger-training']);dagger.actor.ap=2;dagger.actor.fatigue=dagger.actor.maxFatigue-6;advanceBattle(dagger.state);assert.equal(dagger.battle.lastEvent.skillName,'Stab');assert.equal(dagger.actor.ap,0);
});

test('equipment-granted mastery gets one fatigue reduction and no blanket AP discount',()=>{
 const catalogue=id=>ITEMS.find(item=>item.id===id),id=encodeForgeItem('greatsword',{perkFlags:perkFlags(['sword-training'])},catalogue);
 for(const learned of [[],['sword-training']]){const f=fight(id,learned);f.actor.ap=6;f.actor.fatigue=f.actor.maxFatigue-12;advanceBattle(f.state);assert.equal(f.battle.lastEvent.skillName,'Overhead Strike');assert.equal(f.actor.ap,0);assert.equal(f.actor.fatigue,f.actor.maxFatigue);}
});

test('new rule markers and earned stacks round-trip; malformed stacks reject; legacy saves retain costs',()=>{
 const state=createGame(7391),person=state.party[0];person.level=30;person.perks=['reach-advantage'];person.equipment.weapon='greatsword';person.equipment.shield=null;person.armorDurability.shield=0;
 const site=getCampSites(state)[0];state.position={x:site.x,y:site.y};startBattle(state,site.id);const actor=state.battle.units.find(u=>u.id===person.id);actor.reachAdvantageStacks=2;
 assert.deepEqual(validateSave(structuredClone(state)),state);
 for(const n of [-1,6,1.5,NaN]){const bad=structuredClone(state);bad.battle.units.find(u=>u.id===person.id).reachAdvantageStacks=n;assert.throws(()=>validateSave(bad),/reach advantage stacks/);}
 const old=structuredClone(state);delete old.battle.perkBalanceVersion;for(const unit of old.battle.units){delete unit.perkBalanceVersion;delete unit.reachAdvantageStacks;}assert.deepEqual(validateSave(old),old);
 const legacy=fight('arming-sword',['sword-training'],1,{legacy:true});legacy.actor.ap=3;advanceBattle(legacy.state);assert.equal(legacy.battle.lastEvent.type,'attack');assert.equal(legacy.actor.ap,0);
 const oldPole=fight('longaxe',['polearm-training'],2,{legacy:true});oldPole.actor.ap=5;advanceBattle(oldPole.state);assert.equal(oldPole.battle.lastEvent.type,'attack');assert.equal(oldPole.actor.ap,0);
 assert.equal(getCompanyStats(person).meleeDefense,getCompanyStats({...person,perks:[]}).meleeDefense);
 assert.equal(PERKS.find(p=>p.id==='battle-forged').description,'Armor takes 15% less damage from hits.');
});

test('Axe Mastery increases Split Shield damage by 50%, without changing its AP',()=>{
 const plain=fight('wood-axe'),mastered=fight('wood-axe',['axe-training']);
 for(const f of [plain,mastered]){f.actor.skillPreference='control';f.actor.ap=4;f.target.equipment.shield='round-shield';f.target.shieldDurability=200;f.target.bodyArmor=f.target.headArmor=500;advanceBattle(f.state);assert.equal(f.battle.lastEvent.skillName,'Split Shield');assert.equal(f.actor.ap,0);}
 assert.equal(mastered.battle.lastEvent.shieldDamage,plain.battle.lastEvent.shieldDamage*1.5);
});

test('Spear Mastery preserves Spearwall after a real missed interception',()=>{
 for(const mastery of [false,true]){
  const f=fight('arming-sword',[],2);f.target.equipment.weapon='spear';f.target.spearwallActive=true;f.target.meleeSkill=-1000;f.target.perks=mastery?['spear-training']:[];f.target.fatigue=0;
  advanceBattle(f.state);assert.equal(f.battle.lastEvent.reactions[0].skillName,'Spearwall');assert.equal(f.battle.lastEvent.reactions[0].type,'miss');assert.equal(f.target.spearwallActive,mastery);
 }
});

test('Sword Mastery doubles cleaver bleeding while legacy battles retain the original wound',()=>{
 for(const [perks,legacy,damage] of [[[],false,3],[['sword-training'],false,6],[['sword-training'],true,3]]){
  const f=fight('military-cleaver',perks,1,{legacy});basic(f);assert.equal(f.target.bleeding.damage,damage);
 }
});

test('Pathfinder halves movement fatigue after terrain relief, stacks with Marathoner and respects legacy rules',()=>{
 for(const [perks,legacy,fatigue,ap] of [[[],false,3,7],[['pathfinder'],false,2,7],[['pathfinder','marathoner'],false,1,7],[['pathfinder'],true,3,7]]){
  const f=fight('arming-sword',perks,3,{legacy});advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'move');assert.equal(f.actor.fatigue,fatigue);assert.equal(f.actor.ap,ap);
 }
});
