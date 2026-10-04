import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startBattle,advanceBattle,getMarket,buyItem,SETTLEMENTS,equipItem} from '../src/engine.js';
import {hexDistance} from '../src/battle-terrain.js';

test('Highpass has a single reliable fortnightly horse, with purchases persisting for the week',()=>{
  for(let seed=1;seed<=60;seed++){
    const state=createGame(seed),town=SETTLEMENTS.find(town=>town.id==='highpass');state.position={x:town.x,y:town.y};state.day=8;
    assert.equal(getMarket(state).equipment.find(row=>row.itemId==='riding-horse').stock,1,'stable delivery survives town equipment shortages');
  }
  const state=createGame(4001),town=SETTLEMENTS.find(town=>town.id==='highpass');state.position={x:town.x,y:town.y};state.gold=10000;
  for(const day of [8,22,36]){
    state.day=day;
    const market=getMarket(state),horse=market.equipment.find(row=>row.itemId==='riding-horse');
    assert.equal(horse.stock,1);
    assert.equal(buyItem(state,'riding-horse').ok,true);
    assert.equal(getMarket(state).equipment.find(row=>row.itemId==='riding-horse').stock,0);
    state.day=day+6;assert.equal(getMarket(state).equipment.find(row=>row.itemId==='riding-horse').stock,0);
  }
});

function adjacentArcher(side,mount){
  const state=createGame(210),horseman=state.party[0];
  state.inventory.push('riding-horse');state.inventoryCondition.push(null);equipItem(state,horseman.id,'riding-horse');
  state.position={x:440,y:520};startBattle(state,'quarry-camp');
  const battle=state.battle,company=battle.units.find(unit=>unit.id==='captain'),enemy=battle.units.find(unit=>unit.id==='enemy-1');
  for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
  for(const unit of battle.units)if(unit!==company&&unit!==enemy){unit.hp=0;unit.alive=false;unit.ap=0;}
  const actor=side==='company'?company:enemy,rider=side==='company'?enemy:company;
  actor.equipment.weapon='hunting-bow';actor.equipment.shield=null;actor.shieldDurability=0;actor.reserveEquipment={weapon:null,shield:null};actor.accessories=[null,null];actor.equipment.mount=null;
  rider.equipment.mount=mount;Object.assign(actor,{q:5,r:3});Object.assign(rider,{q:6,r:3});
  battle.activeId=actor.id;battle.turnIndex=battle.turnOrder.indexOf(actor.id);return{state,battle,actor,rider};
}

test('horse and wolf zones stop archers leaving adjacent combat on either side',()=>{
  for(const side of ['company','enemy'])for(const mount of ['riding-horse','warg-mount','dire-wolf-mount','war-horse','armored-war-horse']){
    const fight=adjacentArcher(side,mount);advanceBattle(fight.state);
    assert.equal(hexDistance(fight.actor,fight.rider),1,`${side} against ${mount}`);
  }
  for(const side of ['company','enemy']){
    const fight=adjacentArcher(side,null);advanceBattle(fight.state);
    assert.ok(hexDistance(fight.actor,fight.rider)>=2,'ordinary footmen do not gain mounted control');
  }
});

test('a fallen rider no longer pins an adjacent archer',()=>{
  const fight=adjacentArcher('company','riding-horse');fight.rider.alive=false;fight.rider.hp=0;
  const other=fight.battle.units.find(unit=>unit.side==='enemy'&&unit!==fight.rider);
  Object.assign(other,{alive:true,hp:30,q:5,r:2});
  advanceBattle(fight.state);assert.ok(hexDistance(fight.actor,other)>=2);
});
