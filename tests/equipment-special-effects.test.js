import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import { bonePlatingReady } from '../src/equipment-specials.js';
import { getItemDetails } from '../src/item-details.js';
import { encodeForgeItem } from '../src/reforged-items.js';
import { battleHTML } from '../src/battle-view.js';
import { setSimultaneousBetaEnabled } from '../src/combat-config.js';
const tree='bb-craftable-schrat-shield';
function fixture({bone=null,second=null,shield=null,condition=10,reserveShield=null,weapon='arming-sword',perks=[],realtime=false,legacy=false}={}){
 const state=game.createGame(7391),person=state.party[0];person.level=30;person.perks=[...new Set([...perks,...(second?['layered-armor']:[])])];
 Object.assign(person.equipment,{weapon,shield,attachment:bone,attachment2:second});
 Object.assign(person.armorDurability,{shield:shield?condition:0,attachment:game.getItem(bone)?.armor??0,attachment2:game.getItem(second)?.armor??0});
 person.reserveEquipment={weapon:reserveShield?'arming-sword':null,shield:reserveShield};person.armorDurability.reserveShield=reserveShield?12:0;person.accessories=[null,null];
 const site=game.getCampSites(state)[0];state.position={x:site.x,y:site.y};setSimultaneousBetaEnabled(realtime);try{assert.ok(game.startBattle(state,site.id).ok);}finally{setSimultaneousBetaEnabled(false);}
 const battle=state.battle,bro=battle.units.find(u=>u.id===person.id),enemy=battle.units.find(u=>u.side==='enemy');
 for(const tile of battle.field.tiles){tile.terrain='open';tile.height=0;}
 for(const [i,u]of battle.units.entries()){u.q=i+1;u.r=13;}
 for(const u of battle.units)if(u!==bro&&u!==enemy){u.alive=false;u.hp=0;u.ap=0;}
 Object.assign(bro,{q:5,r:5,meleeDefense:0,rangedDefense:0});Object.assign(enemy,{q:6,r:5,meleeSkill:200,rangedSkill:200,turnStartedRound:battle.round,skillPreference:'damage',tacticalRole:'frontliner'});enemy.equipment.weapon='arming-sword';enemy.equipment.shield=null;enemy.shieldDurability=0;
 if(legacy){delete battle.equipmentEffectsVersion;for(const u of battle.units){delete u.equipmentEffectsVersion;delete u.bonePlatingSpent;delete u.shieldRegenRound;}}
 select({battle},enemy);battle.rng=0;return {state,battle,bro,enemy,person};
}
function select(f,u){f.battle.activeId=u.id;f.battle.turnIndex=f.battle.turnOrder.indexOf(u.id);}
function strike(f,seed=0){select(f,f.enemy);f.battle.rng=seed;f.enemy.ap=4;f.enemy.fatigue=f.enemy.maxFatigue-11;game.advanceBattle(f.state);return f.battle.lastEvent;}
function ownTurn(f){select(f,f.bro);f.bro.ap=9;f.enemy.q=10;game.advanceBattle(f.state);}
const reload=f=>game.validateSave(structuredClone(f.state));

test('Bone absorbs exactly one body hit across both slots and named variants, preserving every armor pool',()=>{
 for(const id of ['bone-platings',game.createFamedItemId('bone-platings',92,6)])for(const slot of ['first','second','both']){
  const f=fixture({bone:slot==='second'?null:id,second:slot==='first'?null:id}),before=[f.bro.hp,f.bro.bodyArmor,f.bro.headArmor,f.bro.attachmentArmor,f.bro.attachment2Armor];
  const event=strike(f);assert.equal(event.head,false);assert.equal(event.bonePlatingAbsorbed,true);assert.equal(event.hpDamage,0);assert.equal(event.armorDamage,0);assert.deepEqual([f.bro.hp,f.bro.bodyArmor,f.bro.headArmor,f.bro.attachmentArmor,f.bro.attachment2Armor],before);assert.equal(f.bro.bonePlatingSpent,true);assert.equal(bonePlatingReady(f.bro,game.getItem),false);assert.deepEqual(reload(f),f.state);
  assert.match(battleHTML(f.battle),/Bone Platings spent/);const again=strike(f);assert.ok(again.hpDamage>0||again.armorDamage>0);assert.equal(again.bonePlatingAbsorbed,undefined);
 }
});

test('Bone ignores head hits, misses, armor bypass, shield strikes and bleeding',()=>{
 const head=fixture({bone:'bone-platings'});const event=strike(head,2);assert.equal(event.head,true);assert.ok(event.hpDamage>0);assert.equal(head.bro.bonePlatingSpent,false);assert.equal(strike(head).bonePlatingAbsorbed,true);
 const miss=fixture({bone:'bone-platings'});miss.bro.meleeDefense=300;miss.enemy.meleeSkill=0;assert.equal(strike(miss).type,'miss');assert.equal(miss.bro.bonePlatingSpent,false);
 const bypass=fixture({bone:'bone-platings'});bypass.enemy.equipment.weapon='rondel-dagger';bypass.enemy.ap=4;bypass.enemy.fatigue=0;game.advanceBattle(bypass.state);assert.equal(bypass.battle.lastEvent.skillName,'Puncture');assert.ok(bypass.battle.lastEvent.hpDamage>0);assert.equal(bypass.bro.bonePlatingSpent,false);
 const split=fixture({bone:'bone-platings',shield:'round-shield',condition:40});split.enemy.equipment.weapon='hand-axe';split.enemy.ap=4;split.enemy.fatigue=0;split.enemy.skillPreference='control';split.bro.meleeDefense=300;game.advanceBattle(split.state);assert.equal(split.battle.lastEvent.skillName,'Split Shield');assert.equal(split.bro.bonePlatingSpent,false);
 const bleed=fixture({bone:'bone-platings'});bleed.bro.bleeding={damage:6,turns:2,sourceId:bleed.enemy.id};const hp=bleed.bro.hp;ownTurn(bleed);assert.equal(bleed.battle.lastEvent.skillName,'Bleeding');assert.equal(bleed.bro.hp,hp-6);assert.equal(bleed.bro.bonePlatingSpent,false);
});

test('Bone saved charges remain spent and malformed or missing charge/version fields reject',()=>{
 const f=fixture({bone:'bone-platings'});strike(f);const state=reload(f),bro=state.battle.units.find(u=>u.id===f.bro.id),enemy=state.battle.units.find(u=>u.id===f.enemy.id);const restored={state,battle:state.battle,bro,enemy};assert.equal(strike(restored).bonePlatingAbsorbed,undefined);
 for(const n of [null,0,'false']){const bad=structuredClone(f.state);bad.battle.units.find(u=>u.id===f.bro.id).bonePlatingSpent=n;assert.throws(()=>game.validateSave(bad),/bone plating/);}
 const missing=structuredClone(f.state);delete missing.battle.units.find(u=>u.id===f.bro.id).bonePlatingSpent;assert.throws(()=>game.validateSave(missing),/bone plating/);
 const wrong=structuredClone(f.state);wrong.battle.equipmentEffectsVersion=2;assert.throws(()=>game.validateSave(wrong),/equipment effect/);
});

test('Living Shield regrows once per turn, caps at its rolled maximum and never restores broken shields',()=>{
 for(const id of [tree,game.createFamedItemId(tree,1234),encodeForgeItem(tree,{shieldDurability:20},id=>game.ITEMS.find(i=>i.id===id))]){
  const f=fixture({shield:id});ownTurn(f);assert.equal(f.bro.shieldDurability,30);assert.equal(f.bro.shieldRegenRound,1);assert.deepEqual(reload(f),f.state);for(const stamp of [-1,1.5,2]){const bad=structuredClone(f.state);bad.battle.units.find(u=>u.id===f.bro.id).shieldRegenRound=stamp;assert.throws(()=>game.validateSave(bad),/shield regeneration/);}assert.match(battleHTML(f.battle),/Living Tree Shield: \+20 durability/);
  ownTurn(f);assert.equal(f.bro.shieldDurability,30);f.battle.round=2;ownTurn(f);assert.equal(f.bro.shieldDurability,Math.min(50,f.bro.maxShieldDurability));
  const broken=fixture({shield:id,condition:0});ownTurn(broken);assert.equal(broken.bro.shieldDurability,0);assert.doesNotMatch(battleHTML(broken.battle),/Living Tree Shield: \+20 durability/);
 }
});

test('drawing Living Shield after turn start cannot farm regeneration; reserve shield waits until active',()=>{
 const f=fixture({weapon:'throwing-axes',shield:'round-shield',reserveShield:tree,perks:['quick-hands']});f.bro.throwingAmmo.active=0;select(f,f.bro);game.advanceBattle(f.state);assert.equal(f.battle.lastEvent.type,'swap');assert.equal(f.bro.equipment.shield,tree);assert.equal(f.bro.shieldDurability,12);assert.equal(f.bro.shieldRegenRound,1);ownTurn(f);assert.equal(f.bro.shieldDurability,12);f.battle.round=2;ownTurn(f);assert.equal(f.bro.shieldDurability,32);
});

test('combat completion repairs surviving active and reserve Living Shields but leaves broken ones at zero',()=>{
 for(const condition of [0,7]){
  const f=fixture({shield:tree,condition,reserveShield:tree});f.bro.reserveShieldDurability=condition;
  for(const unit of f.battle.units.filter(u=>u.side==='enemy')){unit.hp=0;unit.alive=false;}
  assert.ok(game.resolveBattle(f.state).ok);assert.ok(game.finishBattle(f.state).ok);assert.equal(f.person.armorDurability.shield,condition?40:0);assert.equal(f.person.armorDurability.reserveShield,condition?40:0);assert.deepEqual(game.validateSave(structuredClone(f.state)),f.state);
 }
});

test('legacy active battles keep ordinary Bone damage and unchanged Living Shield condition',()=>{
 const bone=fixture({bone:'bone-platings',legacy:true});assert.ok(strike(bone).armorDamage>0);assert.equal(bone.bro.bonePlatingSpent,undefined);assert.deepEqual(reload(bone),bone.state);
 const living=fixture({shield:tree,legacy:true});ownTurn(living);assert.equal(living.bro.shieldDurability,10);assert.deepEqual(reload(living),living.state);
});

test('Hyena grants +15 initiative with the existing ranged defense, including named fitting',()=>{
 for(const id of ['hyena-fur',game.createFamedItemId('hyena-fur',55,6)]){
  const item=game.getItem(id);assert.ok(item.initiativeBonus>=15);const p=game.createGame(7391).party[0],before=game.getCompanyStats(p);p.equipment.attachment=id;p.armorDurability.attachment=item.armor;const after=game.getCompanyStats(p);assert.equal(after.initiative-before.initiative,item.initiativeBonus-item.fatigue);assert.equal(after.rangedDefense-before.rangedDefense,item.rangedDefenseBonus);assert.ok(getItemDetails(item).stats.some(row=>row.label==='Initiative'&&row.value===`+${item.initiativeBonus}`));
 }
 assert.ok(getItemDetails(game.getItem('bone-platings')).stats.some(row=>row.label==='First body hit'));
 assert.ok(getItemDetails(game.getItem(tree)).stats.some(row=>row.label==='Regeneration'&&row.value==='+20 durability per turn'));
});

test('realtime cycles regenerate once and damage absorption uses the same saved charge',()=>{
 const f=fixture({shield:tree,bone:'bone-platings',realtime:true});f.bro.ap=9;f.bro.turnStartedRound=1;f.enemy.q=10;
 for(const u of f.battle.units)f.battle.simultaneous.actors[u.id].readyAt=u===f.bro?0:5000;
 game.advanceSimultaneousBattle(f.state,50);assert.equal(f.bro.shieldDurability,30);game.advanceSimultaneousBattle(f.state,1000);assert.equal(f.bro.shieldDurability,30);assert.deepEqual(reload(f),f.state);
 f.battle.simultaneous.time=5950;f.battle.simultaneous.roundEndsAt=6000;for(const u of f.battle.units){u.ap=0;f.battle.simultaneous.actors[u.id].readyAt=6000;}
 game.advanceSimultaneousBattle(f.state,50);assert.equal(f.battle.round,2);assert.equal(f.bro.shieldDurability,40);assert.equal(f.bro.shieldRegenRound,2);
});

test('multi-hit flails and Split Man consume one charge for one body strike and their aggregate saves reload',()=>{
 for(const [weapon,ap,fatigue] of [['three-headed-flail',4,13],['greataxe',6,15]])for(const seed of [0,2]){
  const f=fixture({bone:'bone-platings'});f.enemy.equipment.weapon=weapon;f.enemy.ap=ap;f.enemy.fatigue=f.enemy.maxFatigue-fatigue;f.battle.rng=seed;game.advanceBattle(f.state);
  assert.ok(f.battle.lastEvent.strikes);const blocked=f.battle.lastEvent.strikes.filter(x=>x.bonePlatingAbsorbed);assert.equal(blocked.length,1);assert.equal(blocked[0].hpDamage,0);assert.equal(blocked[0].armorDamage,0);assert.ok(f.battle.lastEvent.hpDamage>0||f.battle.lastEvent.armorDamage>0);assert.deepEqual(reload(f),f.state);
 }
});

test('realtime Bone absorption stays spent across the next cycle and serialized clocks',()=>{
 const f=fixture({bone:'bone-platings',realtime:true});f.enemy.ap=4;f.enemy.fatigue=f.enemy.maxFatigue-11;f.battle.rng=0;
 for(const u of f.battle.units)f.battle.simultaneous.actors[u.id].readyAt=u===f.enemy?0:1000;
 game.advanceSimultaneousBattle(f.state,50);assert.equal(f.battle.lastEvent.bonePlatingAbsorbed,true);assert.equal(f.bro.bonePlatingSpent,true);assert.deepEqual(reload(f),f.state);
});
