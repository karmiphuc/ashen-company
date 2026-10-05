import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {hexDistance} from '../src/battle-terrain.js';
import {equipmentSkills,weaponCombatProfile} from '../src/combat-skills.js';
import {battleHTML} from '../src/battle-view.js';
import {getItemDetails} from '../src/item-details.js';
import {combatSoundCue} from '../src/audio.js';
import * as m from '../src/engine.js';
function fixture(weapon,seed=911){const state=m.createGame(seed),captain=state.party.find(x=>x.id==='captain');captain.equipment.weapon=weapon;captain.equipment.shield=null;captain.armorDurability.shield=0;const c=m.getCampSites(state)[0];state.position={x:c.x,y:c.y};m.startBattle(state,c.id);const b=state.battle;for(const t of b.field.tiles){t.terrain='open';t.height=0;}const at=(id,q,r)=>Object.assign(b.units.find(x=>x.id===id),{q,r});const a=at('captain',5,5),t=at('enemy-1',6,5);at('guard',0,1);at('scout',0,3);at('enemy-2',12,5);at('enemy-3',13,7);a.meleeSkill=200;a.skillPreference='damage';t.meleeDefense=0;t.hp=t.maxHp=300;t.bodyArmor=t.headArmor=t.attachmentArmor=t.attachment2Armor=0;t.equipment.shield=null;t.shieldDurability=0;b.activeId=a.id;b.turnIndex=b.turnOrder.indexOf(a.id);b.rng=1972;return {state,b,a,t,at};}
const source=JSON.parse(readFileSync(new URL('./fixtures/weapon-source-skills.json',import.meta.url)));
const aliases={flail_skill:'flail',lash_skill:'flail-headshot',smite_skill:'smite',shatter_skill:'shatter',cascade_skill:'cascade',hail_skill:'hail',reap_skill:'reap',whip_skill:'whip-strike',disarm_skill:'disarm',gash_skill:'gash',lunge_skill:'lunge',cudgel_skill:'cudgel',strike_down_skill:'strike-down',crumble_skill:'crumble',knock_over_skill:'knock-over',batter_skill:'batter',demolish_armor_skill:'demolish-armor',strike_skill:'strike',prong_skill:'prong',deathblow_skill:'deathblow',reload_bolt:null};
function sourceAction(name){return name in aliases?aliases[name]:name.replaceAll('_','-');}
function activate(b,unit){b.activeId=unit.id;b.turnIndex=b.turnOrder.indexOf(unit.id);}
function roundtrip(state){assert.deepEqual(m.validateSave(structuredClone(state)),state);}

test('all 101 existing weapons and rolled descendants have an explicit profile and matching displayed costs',()=>{
 const weapons=m.ITEMS.filter(x=>x.slot==='weapon');assert.equal(weapons.length,101);
 for(const item of weapons){const profile=weaponCombatProfile(item);assert.ok(profile,item.id);assert.ok(equipmentSkills(item)[0].basic,item.id);
  const rolled=m.getItem(m.createFamedItemId(item.id,731));assert.equal(weaponCombatProfile(rolled).id,profile.id,item.id);assert.deepEqual(equipmentSkills(rolled),equipmentSkills(item),item.id);
  assert.equal(getItemDetails(item).stats.find(x=>x.label==='Attack AP').value,`${equipmentSkills(item)[0].ap} (new battles)`);
 }
});

test('all 46 existing imported named weapons retain every source-defined action (automatic Reload is separate)',()=>{
 for(const expected of source.weapons){const actual=equipmentSkills(m.getItem(expected.id)).map(x=>x.id);for(const action of expected.sourceSkills.map(sourceAction).filter(Boolean))assert.ok(actual.includes(action),`${expected.id} lacks ${action}`);}
 assert.deepEqual(equipmentSkills(m.getItem('bb-named-fencing-sword')).map(x=>x.id),['slash','lunge']);
 assert.deepEqual(equipmentSkills(m.getItem('bb-named-shamshir')).map(x=>x.id),['slash','gash']);
 assert.equal(weaponCombatProfile(m.getItem('estoc')).id,'estoc');
});

test('Split Man damages both locations with one AP/fatigue payment; Cascade/Hail make independent strikes',()=>{
 for(const id of ['bb-named-greataxe','bb-named-three-headed-flail']){
  const {state,b,a,t}=fixture(id);m.advanceBattle(state);assert.ok(b.lastEvent.strikes);assert.equal(b.lastEvent.strikes.length,id.includes('flail')?3:2);
  assert.equal(a.ap,id.includes('flail')?5:3);
  const skill=equipmentSkills(m.getItem(id)).find(x=>x.name===b.lastEvent.skillName);assert.equal(a.fatigue,Math.max(0,skill.fatigue+(m.getItem(id).fatigueOnSkillUse??0)));
  if(id.includes('flail'))assert.ok(b.lastEvent.strikes.every(x=>x.head));else assert.notEqual(b.lastEvent.strikes[0].head,b.lastEvent.strikes[1].head);
  assert.equal(b.lastEvent.hpDamage,b.lastEvent.strikes.reduce((n,x)=>n+x.hpDamage,0));if(id.includes('flail')){const cues=combatSoundCue(b.lastEvent);assert.equal(cues.filter(x=>x.name==='chain').length,1);assert.equal(cues.filter(x=>x.name==='flesh-hit').length,b.lastEvent.strikes.filter(x=>x.hpDamage>0).length);}roundtrip(state);
 }
});

test('Round Swing, Thresh, Shatter, Split Axe and Reap use their distinct footprints and pay once',()=>{
 const cases=[['bb-named-greataxe','Round Swing',[[6,5],[5,6],[4,5]]],['bb-named-two-handed-flail','Thresh',[[6,5],[5,6],[4,5]]],['bb-named-two-handed-hammer','Shatter',[[6,5],[6,4],[5,6]]],['bb-named-bardiche','Split Axe',[[6,5],[7,5]]],['bb-named-warscythe','Reap',[[7,5],[7,4],[7,3]]]];
 for(const [weapon,expected,points] of cases){const {state,b,a,at}=fixture(weapon);points.forEach(([q,r],i)=>{const enemy=at(`enemy-${i+1}`,q,r);enemy.hp=enemy.maxHp=300;enemy.headArmor=enemy.bodyArmor=enemy.attachmentArmor=enemy.attachment2Armor=0;enemy.equipment.shield=null;enemy.shieldDurability=0;});m.advanceBattle(state);assert.equal(b.lastEvent.skillName,expected);assert.equal(a.ap,3);assert.ok(b.lastEvent.affectedTargets.length>=2);assert.ok(!b.lastEvent.affectedTargets.some(x=>['guard','scout'].includes(x.id)));roundtrip(state);}
});

test('Reap can use an empty central hex; area AI rejects collateral risk and excessive height',()=>{
 const open=fixture('bb-named-warscythe');open.at('enemy-1',7,5);open.at('enemy-2',7,3);m.advanceBattle(open.state);assert.equal(open.b.lastEvent.skillName,'Reap');assert.equal(open.b.lastEvent.affectedTargets.length,2);roundtrip(open.state);
 const high=fixture('bb-named-warscythe');high.at('enemy-1',7,5);high.at('enemy-2',7,4);high.b.field.tiles.find(x=>x.q===7&&x.r===4).height=3;m.advanceBattle(high.state);assert.notEqual(high.b.lastEvent.skillName,'Reap');
 const unsafe=fixture('bb-named-warscythe');unsafe.at('enemy-1',7,5);unsafe.at('enemy-2',7,3);unsafe.at('guard',7,4);m.advanceBattle(unsafe.state);assert.notEqual(unsafe.b.lastEvent.skillName,'Reap');
});

test('Cudgel dazes damage and fatigue capacity without permanently changing base stats; Smite staggers',()=>{
 const f=fixture('bb-named-two-handed-mace');m.advanceBattle(f.state);assert.equal(f.t.dazedTurns,2);roundtrip(f.state);
 const dazed=structuredClone(f.state),normal=structuredClone(f.state);delete normal.battle.units.find(x=>x.id===f.t.id).dazedTurns;
 for(const state of [dazed,normal]){const b=state.battle,t=b.units.find(x=>x.id===f.t.id),a=b.units.find(x=>x.id===f.a.id);activate(b,t);t.meleeSkill=200;t.skillPreference='damage';t.fatigue=0;t.ap=9;a.bodyArmor=a.headArmor=a.attachmentArmor=a.attachment2Armor=0;a.equipment.shield=null;a.shieldDurability=0;b.rng=1972;m.advanceBattle(state);}
 assert.ok(dazed.battle.lastEvent.hpDamage<normal.battle.lastEvent.hpDamage);
 const capacity=structuredClone(f.state),target=capacity.battle.units.find(x=>x.id===f.t.id);activate(capacity.battle,target);target.turnStartedRound=capacity.battle.round;target.fatigue=Math.ceil(target.maxFatigue*.75)-1;m.advanceBattle(capacity);assert.notEqual(capacity.battle.lastEvent.type,'attack');
 const hammer=fixture('bb-named-two-handed-hammer');m.advanceBattle(hammer.state);assert.equal(hammer.t.staggeredTurns,1);roundtrip(hammer.state);
});

test('Disarm costs one action, does no damage, blocks attacks/reactions and expires after the owner turn',()=>{
 const f=fixture('bb-named-battle-whip');f.a.skillPreference='control';f.t.meleeSkill=180;const hp=f.t.hp;m.advanceBattle(f.state);assert.equal(f.b.lastEvent.skillName,'Disarm');assert.equal(f.t.hp,hp);assert.equal(f.t.disarmedTurns,1);assert.equal(f.a.ap,4);roundtrip(f.state);
 activate(f.b,f.t);f.t.ap=9;f.t.fatigue=0;f.t.turnStartedRound=f.b.round;
 for(let i=0;i<12&&f.b.activeId===f.t.id;i++){m.advanceBattle(f.state);assert.notEqual(f.b.lastEvent.type,'attack');}
 assert.equal(f.t.disarmedTurns,0);roundtrip(f.state);
 const miss=fixture('bb-named-battle-whip');miss.a.skillPreference='control';miss.t.meleeSkill=180;miss.b.rng=99999;m.advanceBattle(miss.state);assert.equal(miss.b.lastEvent.skillName,'Disarm');assert.equal(miss.t.disarmedTurns,undefined);
});

test('Repel and Impaler Bolt displace surviving targets and respect blocked exits',()=>{
 for(const weapon of ['bb-named-pike','impaler']){const f=fixture(weapon);f.at(f.t.id,7,5);f.a.skillPreference='control';f.t.meleeSkill=180;m.advanceBattle(f.state);assert.equal(f.b.lastEvent.skillName,weapon==='impaler'?'Impaler Bolt':'Repel');assert.ok(f.b.lastEvent.pushedFrom);assert.equal(hexDistance(f.a,f.t),3);if(weapon==='impaler')assert.equal(f.a.reload,1);else {assert.equal(f.b.lastEvent.hpDamage,0);assert.equal(f.t.staggeredTurns,1);}roundtrip(f.state);}
 const blocked=fixture('bb-named-pike');blocked.at(blocked.t.id,7,5);blocked.a.skillPreference='control';blocked.t.meleeSkill=180;for(const t of blocked.b.field.tiles)if(Math.max(Math.abs(t.q-7),Math.abs(t.r-5),Math.abs(t.q-7+t.r-5))===1)t.terrain='trees';m.advanceBattle(blocked.state);assert.notEqual(blocked.b.lastEvent.skillName,'Repel');
});

test('Whip and Rupture wounds bleed twice, survive saves and credit a bleed kill to the attacker',()=>{
 for(const weapon of ['whip','bb-named-goblin-pike']){const f=fixture(weapon);f.at(f.t.id,7,5);m.advanceBattle(f.state);assert.ok(f.t.bleeding,weapon);assert.equal(f.t.bleeding.turns,2);roundtrip(f.state);const damage=f.t.bleeding.damage;activate(f.b,f.t);const hp=f.t.hp;m.advanceBattle(f.state);assert.equal(f.t.hp,hp-damage);assert.equal(f.t.bleeding.turns,1);assert.equal(f.b.lastEvent.skillName,'Bleeding');roundtrip(f.state);const ammo=f.state.supplies.ammo,ap=f.a.ap,fatigue=f.a.fatigue;f.b.round++;activate(f.b,f.t);f.t.hp=damage;m.advanceBattle(f.state);assert.equal(f.t.alive,false);assert.equal(f.b.xp[f.a.id],20);assert.equal(f.state.supplies.ammo,ammo);assert.equal(f.a.ap,ap);assert.equal(f.a.fatigue,fatigue);roundtrip(f.state);}
});

test('Demolish Armor destroys armor while Gash and Deathblow use their real effects',()=>{
 const f=fixture('bb-named-polehammer');f.at(f.t.id,7,5);f.t.bodyArmor=f.t.headArmor=120;f.t.equipment.armor='plate-harness';f.t.maxBodyArmor=300;f.t.equipment.helmet='bascinet';f.t.maxHeadArmor=175;m.advanceBattle(f.state);assert.equal(f.b.lastEvent.skillName,'Demolish Armor');assert.equal(f.b.lastEvent.hpDamage,6);assert.ok(f.b.lastEvent.armorDamage>35);roundtrip(f.state);
 const gash=fixture('bb-named-shamshir');gash.t.hp=gash.t.maxHp=100;m.advanceBattle(gash.state);assert.equal(gash.b.lastEvent.skillName,'Gash');assert.ok(gash.t.injuries.length>0);assert.equal(gash.t.dazedTurns??0,0);roundtrip(gash.state);
 const qatal=fixture('qatal-dagger');qatal.t.dazedTurns=2;m.advanceBattle(qatal.state);assert.equal(qatal.b.lastEvent.skillName,'Deathblow');roundtrip(qatal.state);
});

test('the new skills respect unavailable AP/fatigue, and warbrand/2H cleaver basic attacks remain fast',()=>{
 for(const weapon of ['bb-named-warbrand','bb-named-crypt-cleaver']){const f=fixture(weapon);m.advanceBattle(f.state);assert.equal(f.a.ap,5);roundtrip(f.state);}
 for(const weapon of ['bb-named-two-handed-hammer','bb-named-battle-whip','bb-named-three-headed-flail']){const f=fixture(weapon);f.a.ap=2;f.a.turnStartedRound=f.b.round;m.advanceBattle(f.state);assert.notEqual(f.b.lastEvent.type,'attack');}
});

test('new status fields and strike/area events validate strictly, and prior active battles do not opt in',()=>{
 const f=fixture('bb-named-battle-whip');for(const [key,value] of [['dazedTurns',3],['disarmedTurns',2],['staggeredTurns',2],['bleeding',{damage:99,turns:2,sourceId:'captain'}]]){const forged=structuredClone(f.state);forged.battle.units[0][key]=value;assert.throws(()=>m.validateSave(forged));}
 const old=fixture('bb-named-warscythe');delete old.b.weaponCompletionVersion;old.at(old.t.id,7,5);old.at('enemy-2',7,4);m.advanceBattle(old.state);assert.notEqual(old.b.lastEvent.skillName,'Reap');roundtrip(old.state);
});

test('new weapon/status battles remain deterministic when saved after every action',()=>{
 for(const weapon of ['bb-named-three-headed-flail','bb-named-warscythe','bb-named-battle-whip','bb-named-two-handed-mace']){let stepped=fixture(weapon).state;const instant=structuredClone(stepped);for(let n=0;n<2500&&stepped.battle.status==='active';n++){m.advanceBattle(stepped);stepped=m.validateSave(structuredClone(stepped));}assert.notEqual(stepped.battle.status,'active',weapon);m.resolveBattle(instant);assert.deepEqual(stepped,instant,weapon);}
});

test('Cascade can fire on a smaller fatigue budget, and 2H/pole mace stun variants execute',()=>{
 const cascade=fixture('bb-named-three-headed-flail');cascade.a.turnStartedRound=cascade.b.round;cascade.a.fatigue=cascade.a.maxFatigue-13;m.advanceBattle(cascade.state);assert.equal(cascade.b.lastEvent.skillName,'Cascade');assert.equal(cascade.b.lastEvent.strikes.length,3);roundtrip(cascade.state);
 for(const [weapon,name] of [['bb-named-two-handed-mace','Strike Down'],['bb-named-polemace','Knock Over']]){const f=fixture(weapon);if(weapon.includes('polemace'))f.at(f.t.id,7,5);f.a.skillPreference='control';f.t.meleeSkill=200;m.advanceBattle(f.state);assert.equal(f.b.lastEvent.skillName,name);assert.equal(f.t.stunnedTurns,1);roundtrip(f.state);}
});

test('stagger changes pending turn order immediately, status tooltips render and undead resist wounds',()=>{
 const f=fixture('bb-named-two-handed-hammer');f.b.turnOrder=[f.a.id,f.t.id,...f.b.turnOrder.filter(x=>![f.a.id,f.t.id].includes(x))];f.b.turnIndex=0;f.t.initiative=120;const guard=f.b.units.find(x=>x.id==='guard');guard.initiative=100;m.advanceBattle(f.state);assert.ok(f.b.turnOrder.indexOf(f.t.id)>f.b.turnOrder.indexOf(guard.id));assert.match(battleHTML(f.b,1,true),/Staggered:.*initiative/);roundtrip(f.state);
 const undead=fixture('whip');undead.at(undead.t.id,7,5);undead.t.undeadTraitsVersion=1;m.advanceBattle(undead.state);assert.equal(undead.t.bleeding,undefined);
 const armored=fixture('bb-named-shamshir');armored.t.equipment.armor='plate-harness';armored.t.bodyArmor=armored.t.maxBodyArmor=300;armored.t.equipment.helmet='bascinet';armored.t.headArmor=armored.t.maxHeadArmor=175;m.advanceBattle(armored.state);assert.equal(armored.t.dazedTurns,undefined,'Gash needs a meaningful wound');
});
