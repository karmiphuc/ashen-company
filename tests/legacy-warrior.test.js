import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../src/engine.js';import {completedCompany}from './fixtures/legacy-company.mjs';
import {setSimultaneousBetaEnabled}from '../src/combat-config.js';
import {expireSimultaneousEffects,SIM_ROUND_MS}from '../src/simultaneous-combat.js';
import {warriorJournalHTML}from '../src/legacy-warrior-ui.js';
const at=(s,id)=>{const t=g.SETTLEMENTS.find(t=>t.id===id);s.position={x:t.x,y:t.y};s.destination=null;s.destinationAction=null;};
const fresh=()=>{const source=completedCompany();return g.createLegacyCampaign(source,g.getLegacyRetirementQuote(source,0),12).state;};
function challenge(){const s=fresh();s.day=60;s.renown=300;s.shipments={};s.shipmentLegacyThroughDay=60;s.gold=5000;s.food=100;s.supplies={tools:50,medicine:20,ammo:16};s.cargo={wool:4,iron:6};for(const [i,id]of ['oakwatch','ravenfell','ironford'].entries()){at(s,id);assert.equal(g.turnInWarriorQuest(s,i+1).ok,true);assert.deepEqual(g.validateSave(s),s);}const e=g.getLegacyWarriorEncounters(s)[0];s.position={x:e.x,y:e.y};return s;}

test('retirement freezes a fixed top survivor independently of heirloom and next seed; old saves can recover from a matching archive',()=>{
 const source=completedCompany(),copy=structuredClone(source),a=g.createLegacyCampaign(source,g.getLegacyRetirementQuote(source,0),12).state,b=g.createLegacyCampaign(source,g.getLegacyRetirementQuote(source,0),13).state;
 assert.deepEqual(a.legacyWarrior,b.legacyWarrior);assert.deepEqual(source,copy);assert.ok(source.party.some(p=>p.id===a.legacyWarrior.member.id));assert.equal(a.party.some(p=>p.id===a.legacyWarrior.member.id&&p.level===7),false);assert.deepEqual(g.validateSave(a),a);
 delete a.legacyWarrior;assert.equal(g.recoverLegacyWarrior(a,{...source,seed:1}),false);assert.equal(g.recoverLegacyWarrior(a,source),true);assert.equal(g.recoverLegacyWarrior(a,source),false);assert.deepEqual(a.legacyWarrior,b.legacyWarrior);
});
test('four independent quests lead to exactly one real preserved-build opponent and one wounded recruit, without duplicate drops',()=>{
 const s=challenge(),frozen=s.legacyWarrior.member,site=g.getLegacyWarriorEncounters(s)[0];assert.equal(g.startBattle(s,site.id).ok,true);assert.equal(s.battle.units.filter(u=>u.side==='enemy').length,1);assert.equal(s.battle.units.filter(u=>u.ally).length,0);
 const enemy=s.battle.units.find(u=>u.side==='enemy'),stats=g.getCompanyStats({...frozen,injuries:[]},{ignoreInjuries:true});assert.equal(enemy.name,frozen.name);assert.deepEqual(enemy.perks,frozen.perks);assert.deepEqual(enemy.equipment,frozen.equipment);assert.equal(enemy.meleeSkill,stats.meleeSkill);assert.equal(enemy.maxFatigue,stats.maxFatigue);assert.equal(enemy.maxHp,stats.maxHp);assert.deepEqual(g.validateSave(s),s);
 for(let i=0;i<8&&s.battle.status==='active';i++){g.advanceBattle(s);assert.deepEqual(g.validateSave(s),s);}
 enemy.hp=0;enemy.alive=false;g.resolveBattle(s);assert.equal(s.battle.status,'victory');assert.deepEqual(s.battle.loot.items,[]);assert.equal(s.battle.loot.gold,0);assert.equal(g.finishBattle(s).ok,true);assert.equal(s.legacyWarrior.defeated,true);assert.deepEqual(g.validateSave(s),s);assert.equal(g.getLegacyWarriorEncounters(s).length,0);
 at(s,'ravenfell');const n=s.party.length;assert.equal(g.turnInWarriorQuest(s,4).ok,true);assert.equal(s.party.length,n+1);const recruit=s.party.at(-1);assert.equal(recruit.level,frozen.level);assert.deepEqual(recruit.attributes,frozen.attributes);assert.deepEqual(recruit.perks,frozen.perks);assert.equal(recruit.hp,1);assert.equal(g.turnInWarriorQuest(s,4).ok,false);assert.deepEqual(g.validateSave(s),s);
});
test('retreat persists HP, armor, reserve state and ammo across reload and retry',()=>{
 let s=challenge();const site=g.getLegacyWarriorEncounters(s)[0];g.startBattle(s,site.id);const u=s.battle.units.find(u=>u.side==='enemy');u.hp-=9;u.bodyArmor=Math.max(0,u.bodyArmor-10);g.retreatBattle(s);assert.equal(g.finishBattle(s).ok,true);assert.equal(s.legacyWarrior.defeated,false);s=g.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(g.startBattle(s,site.id).ok,true);const retry=s.battle.units.find(u=>u.side==='enemy');assert.equal(retry.dazedTurns??0,0);assert.equal(retry.hp,u.hp);assert.equal(retry.bodyArmor,u.bodyArmor);assert.deepEqual(g.validateSave(s),s);
});
test('quest resource/age gates and malformed frozen builds are rejected without changing the company',()=>{
 const s=fresh(),copy=structuredClone(s);assert.equal(g.turnInWarriorQuest(s,1).ok,false);assert.deepEqual(s,copy);assert.match(warriorJournalHTML(s),/1\/4/);
 for(const change of [w=>w.stage=5,w=>w.member.level=99,w=>w.sourceSeed=-1,w=>w.member.equipment.weapon='missing',w=>w.condition={...w.member,hp:0}]){const bad=structuredClone(s);change(bad.legacyWarrior);assert.throws(()=>g.validateSave(bad));}
});

test('a full company keeps the defeated warrior available and battle saves reject extra enemies',()=>{
 const s=challenge(),site=g.getLegacyWarriorEncounters(s)[0];g.startBattle(s,site.id);const bad=structuredClone(s),clone=structuredClone(bad.battle.units.find(u=>u.side==='enemy'));clone.id='enemy-2';clone.r++;bad.battle.units.push(clone);assert.throws(()=>g.validateSave(bad),/enemy|battle units/);
 const u=s.battle.units.find(u=>u.side==='enemy');u.hp=0;u.alive=false;g.resolveBattle(s);g.finishBattle(s);at(s,'ravenfell');const member=s.party[0];while(s.party.length<18)s.party.push({...structuredClone(member),id:`reserve-${s.party.length}`});const before=structuredClone(s);assert.equal(g.turnInWarriorQuest(s,4).ok,false);assert.deepEqual(s,before);assert.equal(s.legacyWarrior.stage,4);
});

test('a real endgame build retains learned perks, stat growth, both attachments and named gear without template boosts',()=>{
 const source=completedCompany(),v=source.party[0];v.level=30;v.attributes.meleeSkill+=60;v.attributes.meleeDefense+=35;v.attributes.maxHp+=45;v.attributes.maxFatigue+=35;v.perks=['colossus','steel-brow','battle-flow','battle-forged','layered-armor'];v.equipment.weapon=g.createFamedItemId('arming-sword',73,7);v.equipment.attachment='bone-platings';v.equipment.attachment2='hyena-fur';v.armorDurability.attachment=g.getItem('bone-platings').armor;v.armorDurability.attachment2=g.getItem('hyena-fur').armor;
 const s=g.createLegacyCampaign(source,g.getLegacyRetirementQuote(source,0),44).state;assert.equal(s.legacyWarrior.member.id,v.id);s.day=60;s.renown=300;s.shipments={};s.shipmentLegacyThroughDay=60;s.legacyWarrior.stage=4;const site=g.getLegacyWarriorEncounters(s)[0];s.position={x:site.x,y:site.y};assert.equal(g.startBattle(s,site.id).ok,true);const enemy=s.battle.units.find(u=>u.side==='enemy'),stats=g.getCompanyStats(v,{ignoreInjuries:true});assert.deepEqual(enemy.perks,v.perks);assert.equal(enemy.meleeSkill,stats.meleeSkill);assert.equal(enemy.meleeDefense,stats.meleeDefense);assert.equal(enemy.initiative,stats.initiative);assert.equal(enemy.maxHp,stats.maxHp);assert.equal(enemy.equipment.attachment2,'hyena-fur');assert.deepEqual(g.validateSave(s),s);
});

test('a saved retry cannot replace the preserved gear or buy unearned attribute/perk upgrades',()=>{
 const valid=challenge(),site=g.getLegacyWarriorEncounters(valid)[0];g.startBattle(valid,site.id);g.retreatBattle(valid);g.finishBattle(valid);
 for(const change of [w=>w.condition.equipment.weapon='greatsword',w=>w.condition.attributes.meleeSkill++,w=>w.condition.perks.push('colossus'),w=>w.condition.level++,w=>w.condition.name='Imposter']){const bad=structuredClone(valid);change(bad.legacyWarrior);assert.throws(()=>g.validateSave(bad));}
});


test('awakening daze lasts two owner turns and survives battle reload without renewing on retry',()=>{
 let s=challenge();g.startBattle(s,g.getLegacyWarriorEncounters(s)[0].id);
 let enemy=s.battle.units.find(u=>u.side==='enemy');assert.equal(enemy.dazedTurns,2);
 s=g.validateSave(JSON.parse(JSON.stringify(s)));enemy=s.battle.units.find(u=>u.side==='enemy');assert.equal(enemy.dazedTurns,2);
 // End actors' turns without attacking to isolate the existing owner-turn clock.
 const changes=[];let previous=2;
 for(let i=0;i<200&&enemy.dazedTurns>0;i++){
  const actor=s.battle.units.find(u=>u.id===s.battle.activeId);actor.ap=0;g.advanceBattle(s);
  if(enemy.dazedTurns!==previous){assert.equal(actor.id,enemy.id);changes.push(enemy.dazedTurns);previous=enemy.dazedTurns;s=g.validateSave(JSON.parse(JSON.stringify(s)));enemy=s.battle.units.find(u=>u.side==='enemy');}
 }
 assert.deepEqual(changes,[1,0]);
});
test('realtime awakening daze is scheduled, saved and expires after two combat rounds',()=>{
 setSimultaneousBetaEnabled(true);
 try{
  let s=challenge();g.startBattle(s,g.getLegacyWarriorEncounters(s)[0].id);s=g.validateSave(JSON.parse(JSON.stringify(s)));
  const b=s.battle,u=b.units.find(u=>u.side==='enemy');assert.equal(u.dazedTurns,2);assert.equal(b.simultaneous.actors[u.id].effects.dazedTurns,2*SIM_ROUND_MS);
  b.simultaneous.time=SIM_ROUND_MS;expireSimultaneousEffects(b);assert.equal(u.dazedTurns,1);
  b.simultaneous.time=2*SIM_ROUND_MS;expireSimultaneousEffects(b);assert.equal(u.dazedTurns,0);assert.equal(b.simultaneous.actors[u.id].effects.dazedTurns,undefined);
 }finally{setSimultaneousBetaEnabled(false);}
});
