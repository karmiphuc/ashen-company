import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startBattle,advanceBattle,getItem,shieldImpactDamage,validateSave} from '../src/engine.js';

function duel(weaponId, mount = null) {
  const state=createGame(733);state.position={x:440,y:520};startBattle(state,'quarry-camp');
  const battle=state.battle,actor=battle.units.find(unit=>unit.id==='enemy-1'),target=battle.units.find(unit=>unit.id==='captain');
  for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
  for(const unit of battle.units)if(unit!==actor&&unit!==target){unit.hp=0;unit.alive=false;unit.ap=0;}
  Object.assign(actor,{q:5,r:3,rangedSkill:200,meleeSkill:200});actor.equipment.weapon=weaponId;actor.throwingAmmo={active:5,reserve:0};
  Object.assign(target,{q:3,r:3,hp:1000,maxHp:1000,bodyArmor:1000,headArmor:1000,shieldDurability:48,maxShieldDurability:48});target.equipment.shield='round-shield';target.equipment.mount=mount;
  return {state,battle,actor,target};
}

function attack({state,battle,actor}) {
  actor.ap=2;actor.fatigue=0;actor.reload=0;battle.rng=0;
  battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);
  advanceBattle(state);return battle.lastEvent;
}

test('thrown spears and axes break a round shield in a bounded handful of hits',()=>{
  for(const [id,wear,hits] of [['javelins',12,4],['heavy-javelins',18,3],['throwing-axes',18,3],['heavy-throwing-axes',24,2]]){
    assert.equal(shieldImpactDamage(getItem(id)),wear);
    const fight=duel(id),defense=fight.target.rangedDefense;
    for(let count=0;count<hits;count++){
      const event=attack(fight);assert.equal(event.type,'attack',id);
      assert.equal(event.shieldDamage,Math.min(wear,48-count*wear),id);
    }
    assert.equal(fight.target.shieldDurability,0,id);
    assert.equal(fight.target.equipment.shield,'round-shield');
    assert.ok(fight.target.rangedDefense<defense);
    assert.ok(fight.battle.log.some(entry=>entry.includes('Round Shield breaks')));
  }
});

test('blocked throws damage shields; Shield Expert halves damage and ordinary landed arrows do not',()=>{
  const blocked=duel('throwing-axes');blocked.actor.rangedSkill=-100;
  blocked.battle.rng=1800;blocked.battle.activeId=blocked.actor.id;blocked.battle.turnIndex=blocked.battle.turnOrder.indexOf(blocked.actor.id);
  advanceBattle(blocked.state);assert.equal(blocked.battle.lastEvent.type,'miss');assert.equal(blocked.target.shieldDurability,30);
  const expert=duel('heavy-throwing-axes');expert.target.perks=['shield-expert'];
  assert.equal(attack(expert).shieldDamage,12);assert.equal(expert.target.shieldDurability,36);
  const bow=duel('hunting-bow');bow.target.perks=['shield-expert'];
  assert.equal(attack(bow).shieldDamage,0);assert.equal(bow.target.shieldDurability,48);
});

test('new shield damage event survives a normal battle save round trip',()=>{
  const state=createGame(7391);state.position={x:440,y:520};startBattle(state,'quarry-camp');
  state.battle.lastEvent={actorId:null,targetId:null,type:'miss',message:'Shield block.',shieldDamage:18};
  const loaded=validateSave(JSON.parse(JSON.stringify(state)));assert.equal(loaded.battle.lastEvent.shieldDamage,18);
  state.battle.lastEvent.shieldDamage=-1;assert.throws(()=>validateSave(state),/shieldDamage/);
});
