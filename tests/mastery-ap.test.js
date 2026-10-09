import test from 'node:test';
import assert from 'node:assert/strict';
import {equipmentSkills} from '../src/combat-skills.js';
import {createGame,getCampSites,startBattle,advanceBattle,getItem,validateSave} from '../src/engine.js';

function fight(weapon,perks,distance=1) {
  const state=createGame(7391),person=state.party[0];
  person.level=30;person.perks=perks;person.equipment.weapon=weapon;
  if(getItem(weapon).twoHanded){person.equipment.shield=null;person.armorDurability.shield=0;}
  const camp=getCampSites(state)[0];state.position={x:camp.x,y:camp.y};startBattle(state,camp.id);
  const battle=state.battle,actor=battle.units.find(u=>u.id===person.id),target=battle.units.find(u=>u.side==='enemy');
  for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
  for(const u of battle.units)if(u!==actor&&u!==target){u.hp=0;u.alive=false;}
  Object.assign(actor,{q:2,r:2,meleeSkill:200,rangedSkill:200,turnStartedRound:battle.round});
  Object.assign(target,{q:2+distance,r:2,hp:300,maxHp:300,bodyArmor:0,headArmor:0,attachmentArmor:0,meleeDefense:0,rangedDefense:0});
  battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);
  return {state,battle,actor,target};
}

test('only dagger and true polearm masteries discount basic attack AP in new battles',()=>{
  for(const [weapon,perks,cost,distance] of [
    ['arming-sword',['sword-training'],4,1],['rondel-dagger',['dagger-training'],2,1],
    ['greatsword',['sword-training'],6,1],['longaxe',['axe-training','polearm-training'],6,2],
    ['hunting-bow',['bow-mastery'],4,3],['light-crossbow',['crossbow-mastery'],3,3],
    ['javelins',['throwing-training'],4,3], ['billhook',['polearm-training'],5,2],
  ]) {
    const {state,battle,actor}=fight(weapon,perks,distance);
    actor.ap=cost; actor.fatigue=actor.maxFatigue-Math.ceil((equipmentSkills(getItem(weapon))[0].fatigue??getItem(weapon).fatigueCost??(getItem(weapon).ranged?9:11))*.75);
    advanceBattle(state);
    assert.equal(battle.lastEvent.type,'attack',weapon);
    assert.equal(actor.ap,0,weapon);
    validateSave(structuredClone(state));
  }
});

test('signature attacks and Spearwall spend their full AP with non-polearm mastery',()=>{
  const mace=fight('bludgeon',['mace-training']);
  mace.actor.ap=4;mace.actor.skillPreference='control';
  advanceBattle(mace.state);
  assert.equal(mace.battle.lastEvent.skillName,'Knock Out');assert.equal(mace.actor.ap,0);
  const spear=fight('spear',['spear-training'],2);
  spear.battle.tactic='defense';spear.actor.skillPreference='control';spear.actor.ap=4;
  advanceBattle(spear.state);
  assert.equal(spear.battle.lastEvent.skillName,'Spearwall');assert.equal(spear.actor.ap,0);
});

test('unmatched mastery and earlier battles keep base AP costs',()=>{
  for(const legacy of [false,true]){
    const {state,battle,actor}=fight('arming-sword',[legacy?'sword-training':'axe-training']);
    if(legacy){delete battle.weaponSkillsVersion;for(const u of battle.units)for(const key of ['spearwallActive','riposteActive','stunnedTurns','stunProtected','pendingBerserkAp'])delete u[key];}
    actor.ap=4;advanceBattle(state);assert.equal(actor.ap,0);
    assert.equal(battle.lastEvent.type,'attack');
  }
});
