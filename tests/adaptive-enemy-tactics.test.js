import test from 'node:test';
import {setSimultaneousBetaEnabled} from '../src/combat-config.js';
import assert from 'node:assert/strict';
import {createGame,getCampSites,startBattle,advanceBattle,validateSave,getItem,shieldMaximum,setBattleTactic,resolveBattle} from '../src/engine.js';
import {enemyBattleTactic,recommendEnemyTactic,updateEnemyTactic,ENEMY_TACTIC_COOLDOWN} from '../src/tactical-ai.js';
import {hexDistance,tileAt} from '../src/battle-terrain.js';
import {battleHTML} from '../src/battle-view.js';

function fixture(shielded=true) {
 const s=createGame(51),camp=getCampSites(s).find(c=>c.id==='wild-camp-8');s.position={x:camp.x,y:camp.y};assert.ok(startBattle(s,camp.id).ok);
 const b=s.battle,openingTactic=b.enemyTacticalState.tactic;for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
 const company=b.units.filter(u=>u.side==='company');
 company.forEach((u,i)=>Object.assign(u,{q:i===0?4:3,r:8+i*2,equipment:{...u.equipment,weapon:'hunting-bow',shield:null},shieldDurability:0,maxShieldDurability:0,rangedSkill:100}));
 // Keep battle and campaign equipment aligned for save validation.
 for(const u of company){const p=s.party.find(p=>p.id===u.id);p.equipment.weapon='hunting-bow';p.equipment.shield=null;p.armorDurability.shield=0;}
 const foes=b.units.filter(u=>u.side==='enemy');
 foes.forEach((u,i)=>{
  const front=i<2,shield=front&&shielded?'round-shield':null;
  Object.assign(u,{q:front?8:14+i-2,r:8+(i%3)*2,morale:60,hp:200,maxHp:200,ap:9,fatigue:0,
   tacticalRole:front?'frontliner':'ranged',equipment:{...u.equipment,weapon:front?'arming-sword':'light-crossbow',shield},
   shieldDurability:shieldMaximum(shield),maxShieldDurability:shieldMaximum(shield),reload:0,throwingAmmo:{active:0,reserve:0}});
 });
 b.enemyTacticalState.tactic='defense';return{s,b,company,foes,openingTactic,front:foes[0],archer:foes[2]};
}
function activate(f,u){f.b.activeId=u.id;f.b.turnIndex=f.b.turnOrder.indexOf(u.id);}
function step(f,u){activate(f,u);assert.ok(advanceBattle(f.s).ok);return f.b.lastEvent;}
function refresh(f){f.s=validateSave(structuredClone(f.s));f.b=f.s.battle;f.company=f.b.units.filter(u=>u.side==='company');f.foes=f.b.units.filter(u=>u.side==='enemy');f.front=f.foes[0];f.archer=f.foes[2];}

test('outmatched ranged support selects shield-wall advance or skirmish from live equipment and positions',()=>{
 const wall=fixture();assert.equal(recommendEnemyTactic(wall.b,getItem,wall.s.supplies.ammo),'shield-wall');
 const skirmish=fixture(false);assert.equal(recommendEnemyTactic(skirmish.b,getItem,skirmish.s.supplies.ammo),'skirmish');
 for(const archer of skirmish.foes.slice(2))archer.equipment.weapon='javelins';
 assert.equal(recommendEnemyTactic(skirmish.b,getItem,skirmish.s.supplies.ammo),'offense','spent throwing bundles cannot supply fire support');
 skirmish.foes[2].throwingAmmo.active=1;
 assert.equal(recommendEnemyTactic(skirmish.b,getItem,skirmish.s.supplies.ammo),'skirmish');
 skirmish.foes[2].escaped=true;assert.equal(recommendEnemyTactic(skirmish.b,getItem,skirmish.s.supplies.ammo),'offense');
});

test('ranged defenders only hold when they can actually counterfire and melee contact calls for offense',()=>{
 const f=fixture();for(const [i,u] of f.foes.slice(2).entries())Object.assign(u,{q:8,r:7+i*2});
 assert.equal(recommendEnemyTactic(f.b,getItem,f.s.supplies.ammo),'defense');
 for(const [i,u] of f.company.entries())Object.assign(u,{q:7,r:8+i*2});
 assert.equal(recommendEnemyTactic(f.b,getItem,f.s.supplies.ammo),'offense');
 const empty=fixture();assert.equal(recommendEnemyTactic(empty.b,getItem,0),'offense','no current incoming arrows when the company is out of ammo');
});

test('commands commit at most once per round and never less than two full rounds apart',()=>{
 const f=fixture(),initialRng=f.b.rng;
 for(let round=1;round<=2;round++){f.b.round=round;assert.equal(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo),false);assert.equal(enemyBattleTactic(f.b,getItem),'defense');}
 f.b.round=3;assert.ok(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo));assert.equal(enemyBattleTactic(f.b,getItem),'shield-wall');
 for(const [i,u] of f.company.entries())Object.assign(u,{q:7,r:8+i*2});
 for(let round=4;round<3+ENEMY_TACTIC_COOLDOWN;round++){f.b.round=round;assert.equal(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo),false);assert.equal(enemyBattleTactic(f.b,getItem),'shield-wall');}
 f.b.round=5;assert.ok(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo));assert.equal(enemyBattleTactic(f.b,getItem),'offense');
 for(const [i,u] of f.company.entries())Object.assign(u,{q:4,r:8+i*2});
 assert.equal(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo),false);assert.equal(f.b.enemyTacticalState.lastChangedRound,5);assert.equal(f.b.rng,initialRng);
 const snapshot=structuredClone(f.s);for(let i=0;i<20;i++){enemyBattleTactic(f.b,getItem);battleHTML(f.b,0);}
 assert.deepEqual(f.s,snapshot,'reading intent never reevaluates or spends randomness');
});

test('shielded frontliners raise their shields then advance despite sustained arrow fire',()=>{
 const f=fixture();f.b.round=6;f.b.enemyTacticalState.lastRangedAttackRound=5;
 const origin={q:f.front.q,r:f.front.r},distance=Math.min(...f.company.map(u=>hexDistance(f.front,u))),companyPlan=structuredClone(f.b.formationAdvance);
 assert.equal(step(f,f.front).skillName,'Shieldwall');assert.equal(f.front.shieldWallActive,true);assert.equal(f.front.ap,5);
 refresh(f);assert.equal(step(f,f.front).type,'move');assert.equal(f.front.shieldWallActive,true);assert.ok(f.front.ap>=0);assert.ok(f.front.fatigue<=f.front.maxFatigue);
 assert.ok(Math.min(...f.company.map(u=>hexDistance(f.front,u)))<distance);assert.equal(hexDistance(origin,f.front),1);
 const moved={q:f.front.q,r:f.front.r};step(f,f.front);assert.deepEqual({q:f.front.q,r:f.front.r},moved,'one protected infantry step per round');
 assert.deepEqual(f.b.formationAdvance,companyPlan,'enemy movements cannot rewrite company formation');
 assert.equal(f.b.log.filter(line=>line.includes('Enemy tactic changes')).length,1);assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
 assert.match(battleHTML(f.b,0),/Shield-wall advance/);assert.match(battleHTML(f.b,0),/Change cooldown: 2 rounds/);
});

test('deep archers advance into firing range while infantry maintain the shield-wall command',()=>{
 const f=fixture();f.b.round=6;const distance=Math.min(...f.company.map(u=>hexDistance(f.archer,u))),plan=structuredClone(f.b.formationAdvance);
 for(let action=0;action<4&&f.archer.ap>0;action++)step(f,f.archer);
 assert.ok(Math.min(...f.company.map(u=>hexDistance(f.archer,u)))<distance);assert.equal(enemyBattleTactic(f.b,getItem),'shield-wall');
 assert.deepEqual(f.b.formationAdvance,plan);assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
});

test('shield-wall movement makes progress when the remaining AP cannot cover both a stance and rough terrain',()=>{
 const f=fixture();f.b.round=6;f.front.ap=6;f.front.turnStartedRound=6;
 for(const tile of f.b.field.tiles)tile.terrain='mud';
 const from={q:f.front.q,r:f.front.r};assert.equal(step(f,f.front).type,'move');
 assert.equal(hexDistance(from,f.front),1);assert.equal(f.front.ap,2);assert.ok(f.front.fatigue<=f.front.maxFatigue);
 assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
});

test('losing shield coverage releases shield-wall commands only after the committed cooldown',()=>{
 const f=fixture();f.b.round=6;assert.ok(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo));
 for(const u of f.foes)u.shieldDurability=0;
 f.b.round=7;assert.equal(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo),false);assert.equal(enemyBattleTactic(f.b,getItem),'shield-wall');
 f.b.round=8;assert.ok(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo));assert.equal(enemyBattleTactic(f.b,getItem),'skirmish');
});

test('enemy skirmish sorties persist through reload and fall back after shooting without company-order interference',()=>{
 const f=fixture(false);f.b.round=6;Object.assign(f.archer,{q:10,r:8});const home={q:f.archer.q,r:f.archer.r};
 assert.equal(step(f,f.archer).type,'move');assert.equal(enemyBattleTactic(f.b,getItem),'skirmish');assert.ok(f.archer.skirmishReturn);
 refresh(f);assert.ok(setBattleTactic(f.s,'shield-wall').ok);assert.ok(f.archer.skirmishReturn,'company tactic change preserves enemy pending return');
 assert.ok(['attack','miss'].includes(step(f,f.archer).type));assert.equal(f.archer.skirmishReturn.phase,'return');
 refresh(f);assert.equal(step(f,f.archer).type,'move');assert.deepEqual({q:f.archer.q,r:f.archer.r},home);assert.equal(f.archer.skirmishReturn,undefined);
 assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
});

test('incoming hits and misses latch recent ranged pressure without depending on the last animation event',()=>{
 const f=fixture();step(f,f.company[0]);assert.ok(['attack','miss'].includes(f.b.lastEvent.type));
 assert.equal(f.b.enemyTacticalState.lastRangedAttackRound,1);const plan=structuredClone(f.b.enemyTacticalState);
 step(f,f.front);assert.equal(f.b.lastEvent.type,'hold');assert.deepEqual(f.b.enemyTacticalState,plan);
 refresh(f);assert.equal(f.b.enemyTacticalState.lastRangedAttackRound,1);
});

test('adaptive commands reject malformed saves and older active fights retain the original live-count policy',()=>{
 const f=fixture();assert.deepEqual(validateSave(structuredClone(f.s)),f.s);
 for(const patch of [{tactic:'random'},{lastChangedRound:0},{lastChangedRound:7},{lastEvaluatedRound:2},{lastRangedAttackRound:-1},{lastRangedAttackRound:NaN},{extra:true}]){
  const bad=structuredClone(f.s);Object.assign(bad.battle.enemyTacticalState,patch);assert.throws(()=>validateSave(bad),/enemy tact/);
 }
 const bad=structuredClone(f.s);delete bad.battle.enemyAdaptiveRulesVersion;assert.throws(()=>validateSave(bad),/unexpected enemy tactical/);
 delete f.b.enemyAdaptiveRulesVersion;delete f.b.enemyTacticalState;refresh(f);
 assert.equal(enemyBattleTactic(f.b,getItem),'defense');f.foes[2].alive=false;f.foes[2].hp=0;
 assert.equal(enemyBattleTactic(f.b,getItem),'offense');const before=structuredClone(f.b);assert.equal(updateEnemyTactic(f.b,getItem,16),false);assert.deepEqual(f.b,before);
});

test('adaptive camp battles resolve identically with stepped reloads and instant execution',()=>{
 for(const seed of [51,79]){
  const s=createGame(seed),camp=getCampSites(s).find(c=>c.id==='wild-camp-8');s.party[0].equipment.weapon='hunting-bow';s.party[0].equipment.shield=null;s.party[0].armorDurability.shield=0;s.position={x:camp.x,y:camp.y};assert.ok(startBattle(s,camp.id).ok);
  const instant=structuredClone(s);assert.ok(resolveBattle(instant).ok);let loaded=s,lastChange=loaded.battle.enemyTacticalState.lastChangedRound;
  for(let action=0;action<2500&&loaded.battle.status==='active';action++){
   assert.ok(advanceBattle(loaded).ok);loaded=validateSave(structuredClone(loaded));const current=loaded.battle.enemyTacticalState.lastChangedRound;
   if(current!==lastChange){assert.ok(current-lastChange>=2);lastChange=current;}
   assert.ok(loaded.battle.units.filter(u=>u.alive).every(u=>!['palisade','dense-trees'].includes(tileAt(loaded.battle.field,u.q,u.r).terrain)));
  }
  assert.notEqual(loaded.battle.status,'active');assert.deepEqual(loaded,instant);
 }
});


test('new enemies open offensively for two rounds/cycles then adapt, including ranged-heavy camps and reloads',()=>{
 for(const simultaneous of [false,true]){
  setSimultaneousBetaEnabled(simultaneous);let f;
  try{f=fixture();}finally{setSimultaneousBetaEnabled(false);}
  assert.equal(f.openingTactic,'offense');assert.equal(!!f.b.simultaneous,simultaneous);
  f.b.enemyTacticalState.tactic=f.openingTactic;
  for(const [i,u] of f.foes.slice(2).entries())Object.assign(u,{q:8,r:7+i*2});
  assert.equal(recommendEnemyTactic(f.b,getItem,f.s.supplies.ammo),'defense');
  for(const round of [1,2,3]){
   f.b.round=round;if(simultaneous){f.b.simultaneous.time=(round-1)*6000;f.b.simultaneous.roundEndsAt=round*6000;}
   const changed=updateEnemyTactic(f.b,getItem,f.s.supplies.ammo);
   assert.equal(changed,round===3);assert.equal(enemyBattleTactic(f.b,getItem),round<3?'offense':'defense');
   refresh(f);assert.equal(enemyBattleTactic(f.b,getItem),round<3?'offense':'defense');
   assert.equal(updateEnemyTactic(f.b,getItem,f.s.supplies.ammo),false,'same-round calls cannot change the command');
  }
 }
});
