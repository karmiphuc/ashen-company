import test from 'node:test';
import { baseArmorCondition } from '../src/equipment-sets.js';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,getItem,getUndeadEncounters,getFactionPatrols,startBattle,advanceBattle,validateSave,retreatBattle,finishBattle} from '../src/engine.js';
import {ASHEN_CONFIG as C,campaignHour} from '../src/crisis-director.js';
import {advanceFactionSimulation} from '../src/faction-patrols.js';
import {advanceAshenWinter,validateAshenWinter} from '../src/undead-crisis.js';
const context={settlements:SETTLEMENTS,report(){}};
function setTime(s,h){s.day=Math.floor(h/24)+1;s.hour=h%24;s.shipmentLegacyThroughDay=s.day;}
function active(seed=719){
 const s=createGame(seed),p=structuredClone(s.party[0]);
 while(s.party.length<6)s.party.push({...structuredClone(p),id:`fighter-${s.party.length}`});
 s.party.forEach(p=>p.level=7);s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);
 s.day=60;s.shipments={};s.shipmentLegacyThroughDay=60;
 advanceAshenWinter(s,context);setTime(s,s.ashenWinter.warningHour);advanceAshenWinter(s,context);
 setTime(s,s.ashenWinter.activationHour);advanceAshenWinter(s,context);return s;
}
function legacy(s){
 s.ashenWinter.version=1;
 for(const h of Object.values(s.ashenWinter.hosts))if(!h.id.endsWith(':1')){delete s.ashenWinter.towns[h.targetTownId];delete s.ashenWinter.hosts[h.id];}
 for(const f of s.ashenWinter.fronts)f.spawnIndex=1;
 const resize=(f,size)=>{f.size=size;f.troops=f.troops.filter(i=>i<size);};
 for(const f of s.ashenWinter.fronts){resize(f.force,12);f.nextSpawnHour=campaignHour(s)+72;}
 for(const h of Object.values(s.ashenWinter.hosts)){resize(h.force,6);resize(h.occupationForce,10);}
 return s;
}
function engage(s,e){s.position={x:e.x,y:e.y};assert.ok(startBattle(s,e.id).ok);}

test('each stronghold immediately raises 2–4 bands and saves a 3–7 day wave timer',()=>{
 const s=active();
 for(const f of s.ashenWinter.fronts){
  assert.ok(f.spawnIndex>=2&&f.spawnIndex<=4);
  assert.ok(f.nextSpawnHour-campaignHour(s)>=72&&f.nextSpawnHour-campaignHour(s)<=168);
 }
 assert.ok(Object.values(s.ashenWinter.hosts).every(h=>[20,24].includes(h.force.size)));
 const before=structuredClone(s.ashenWinter);assert.deepEqual(validateSave(s),s);
 setTime(s,campaignHour(s)+24);advanceAshenWinter(s,context);
 assert.deepEqual(s.ashenWinter.fronts.map(f=>f.spawnIndex),before.fronts.map(f=>f.spawnIndex));
 for(const f of s.ashenWinter.fronts){const old=f.spawnIndex;setTime(s,f.nextSpawnHour);advanceAshenWinter(s,context);assert.ok(f.spawnIndex-old>=2&&f.spawnIndex-old<=4);}
 assert.deepEqual(validateSave(s),s);
});

test('active old crisis receives strong hosts immediately without healing or resurrecting existing troops',()=>{
 const s=legacy(active()),host=Object.values(s.ashenWinter.hosts)[0];host.force.troops=[0,2,5];
 host.force.damage={2:{hp:20,bodyArmor:30,headArmor:20,shieldDurability:10}};
 const old=structuredClone(host.force),before=structuredClone(s);assert.deepEqual(validateSave(s),s);assert.deepEqual(s,before);
 advanceAshenWinter(s,context);assert.equal(s.ashenWinter.version,3);assert.deepEqual(host.force,old);
 assert.ok(Object.keys(s.ashenWinter.hosts).length>=9);
 assert.ok(Object.values(s.ashenWinter.hosts).filter(h=>h.id.endsWith(':2')).every(h=>h.force.troops.length===24));
 assert.deepEqual(validateSave(s),s);
});

for(const index of [0,1,2])test(`marshal ${index+1} carries four stable named trophies, a one-handed weapon and superior boss stats`,()=>{
 const s=active(719+index),e=getUndeadEncounters(s).filter(e=>e.kind==='undead-commander')[index];
 assert.equal(e.enemies.length,30);const commander=e.enemies.find(u=>u.troopIndex===0);
 assert.ok(commander.champion);assert.equal(getItem(commander.weapon).twoHanded??false,false);
 for(const slot of ['weapon','shield','armor','helmet'])assert.ok(['named','famed'].includes(getItem(commander[slot]).rarity));
 assert.deepEqual(getUndeadEncounters(validateSave(s)).find(u=>u.id===e.id).enemies,e.enemies);
 engage(s,e);const boss=s.battle.units.find(u=>u.troopIndex===0);
 assert.ok(boss.maxHp>=146);assert.ok(boss.meleeSkill>=74);assert.ok(boss.meleeDefense>=40);
 assert.ok(boss.maxBodyArmor>=308&&boss.maxHeadArmor>=290&&boss.maxShieldDurability>0);
 assert.equal(new Set(s.battle.units.map(u=>`${u.q},${u.r}`)).size,s.battle.units.length);
 assert.deepEqual(validateSave(s),s);
 const kit=structuredClone(boss.equipment);boss.hp=100;boss.bodyArmor=120;boss.headArmor=110;boss.shieldDurability=10;
 const worn={body:baseArmorCondition(boss,'body'),head:baseArmorCondition(boss,'head')};
 const expectedBody=boss.setArmor?Math.floor(worn.body*boss.maxBodyArmor/boss.setArmor.body.baseMax):worn.body;
 const expectedHead=boss.setArmor?Math.floor(worn.head*boss.maxHeadArmor/boss.setArmor.head.baseMax):worn.head;
 assert.ok(retreatBattle(s).ok);assert.ok(finishBattle(s).ok);assert.deepEqual(validateSave(s),s);
 const retry=getUndeadEncounters(s).find(u=>u.id===e.id);engage(s,retry);
 const resumed=s.battle.units.find(u=>u.troopIndex===0);
 assert.deepEqual(resumed.equipment,kit);assert.equal(resumed.hp,100);assert.equal(resumed.bodyArmor,expectedBody);assert.equal(resumed.headArmor,expectedHead);assert.equal(resumed.shieldDurability,10);
 assert.ok(resumed.bodyArmor<=boss.bodyArmor&&resumed.headArmor<=boss.headArmor);
 assert.equal(resumed.setArmor?.body.baseCurrent??resumed.bodyArmor,worn.body);assert.equal(resumed.setArmor?.head.baseCurrent??resumed.headArmor,worn.head);
 assert.deepEqual(validateSave(s),s);
});

test('killing a marshal guarantees the entire named kit in post-battle loot',()=>{
 const s=active(),e=getUndeadEncounters(s).find(e=>e.kind==='undead-commander');engage(s,e);
 const boss=s.battle.units.find(u=>u.troopIndex===0),kit=['weapon','shield','armor','helmet'].map(slot=>boss.equipment[slot]);
 for(const enemy of s.battle.units.filter(u=>u.side==='enemy')){enemy.hp=0;enemy.alive=false;}
 const actor=s.battle.units.find(u=>u.side==='company');s.battle.activeId=actor.id;s.battle.turnIndex=s.battle.turnOrder.indexOf(actor.id);
 advanceBattle(s);assert.equal(s.battle.status,'victory');for(const id of kit)assert.ok(s.battle.loot.items.includes(id));
 assert.deepEqual(validateSave(s),s);
});

test('legacy active battle remains exactly saved and reinforcement upgrade does not change its roster',()=>{
 const s=legacy(active()),e=getUndeadEncounters(s).find(e=>e.kind==='undead-host');engage(s,e);
 const battle=structuredClone(s.battle),host=structuredClone(s.ashenWinter.hosts[e.id]);
 assert.deepEqual(validateSave(s),s);advanceAshenWinter(s,context);
 assert.deepEqual(s.battle,battle);assert.deepEqual(s.ashenWinter.hosts[e.id],host);assert.deepEqual(validateSave(s),s);
});

test('oversized hosts and troop identities remain rejected despite the expanded crisis limits',()=>{
 const s=active(),id=Object.keys(s.ashenWinter.hosts)[0];
 for(const mutate of [h=>h.force.size=30,h=>h.force.troops.push(20),h=>h.occupationForce.size=30]){
  const bad=structuredClone(s.ashenWinter);mutate(bad.hosts[id]);assert.throws(()=>validateAshenWinter(bad,s.seed,SETTLEMENTS));
 }
});


test('legacy ongoing NPC battles keep their six-troop roster and saved outcome during the pressure upgrade',()=>{
 const s=legacy(active()),host=getUndeadEncounters(s).find(e=>e.kind==='undead-host'),army=getFactionPatrols(s)[5];
 for(const patrol of Object.values(s.factionPatrols))patrol.cooldownUntil=campaignHour(s)+6;
 Object.assign(s.factionPatrols[army.id],{x:host.x,y:host.y,cooldownUntil:0});s.hour+=.25;
 advanceFactionSimulation(s,{settlements:SETTLEMENTS,getItem,hostiles:()=>[host],currentHostile:id=>getUndeadEncounters(s).find(e=>e.id===id),hostileResult(){}});
 assert.equal(s.worldSkirmishes.length,1);const fights=structuredClone(s.worldSkirmishes),force=structuredClone(s.ashenWinter.hosts[host.id].force);
 advanceAshenWinter(s,context);assert.deepEqual(s.worldSkirmishes,fights);assert.deepEqual(s.ashenWinter.hosts[host.id].force,force);assert.deepEqual(validateSave(s),s);
});

test('a killed marshal cannot reappear on a commander rematch',()=>{
 const s=active(),front=s.ashenWinter.fronts[0];front.force.troops=front.force.troops.filter(i=>i!==0);
 const e=getUndeadEncounters(s).find(e=>e.id===front.force.id);assert.ok(e.enemies.every(enemy=>!enemy.champion));engage(s,e);
 assert.ok(s.battle.units.filter(u=>u.side==='enemy').every(u=>u.troopIndex!==0));assert.deepEqual(validateSave(s),s);
});
