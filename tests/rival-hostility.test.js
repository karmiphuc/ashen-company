import {setSimultaneousBetaEnabled} from '../src/combat-config.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advanceRivalSimulation,planRivalWorldCombat,tick,getCompanyStats,getItem,startBattle,advanceBattle,finishBattle,retreatBattle,validateSave,getRivalCompanies,getContractOffers,acceptContract,contractObjectiveComplete,activateMapTarget,SETTLEMENTS,getCampSites,getWorldTravelSpeed,getDailyFood} from '../src/engine.js';
import {advanceRivalDiplomacy,rivalHuntsPlayer,advanceRivalPlayerPursuit} from '../src/rival-diplomacy.js';
import {moveWorldToward} from '../src/world-navigation.js';
import {defaultRetinue} from '../src/retinue.js';
import {soldierFactionAt} from '../src/faction-patrols.js';
import {rivalSidebarHTML,rivalJournalHTML} from '../src/rival-company-ui.js';
const context={record:(w,text)=>w.log.push(text),factionAt:p=>soldierFactionAt(p.x,p.y),stats:getCompanyStats,getItem,retinue:defaultRetinue,food:w=>w.party.length,travelSpeed:()=>100,sanctuary:(w,p)=>SETTLEMENTS.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<=40)};
const clock=w=>(w.day-1)*24+w.hour;
function scene(){const world=createGame(12);advanceRivalSimulation(world);planRivalWorldCombat(world);tick(world,.25);return {world,company:world.rivalCompanies.companies[1],entry:world.rivalDiplomacy.companies['red-jackals']};}
function season(world,company,level=8,earned=8000){world.day=31;world.shipments={};world.shipmentLegacyThroughDay=31;world.rivalCompanies.lastHour=clock(world);company.party.forEach(p=>p.level=level);company.ledger.goldEarned=earned;company.gold+=earned;}
function declare(world,company,entry){company.position={x:600,y:480};company.status='travelling';world.position={...company.position};entry.declaredHour=clock(world);entry.reason='extortion';}
function resolve(world){let steps=0;while(world.battle.status==='active'&&steps++<6000){advanceBattle(world);if(steps%10===0)world=validateSave(JSON.parse(JSON.stringify(world)));}assert.notEqual(world.battle.status,'active');return world;}
test('daily goal declarations require real age, roster levels and earned income; lawful bands stay neutral',()=>{
 const {world,company,entry}=scene();season(world,company,7,5999);advanceRivalDiplomacy(world,context);assert.equal(entry.declaredHour,null);
 company.gold++;company.ledger.goldEarned++;advanceRivalDiplomacy(world,context);assert.equal(entry.declaredHour,null,'only one daily check');
 world.day++;world.shipmentLegacyThroughDay=world.day;world.rivalCompanies.lastHour=clock(world);advanceRivalDiplomacy(world,context);assert.equal(entry.reason,'extortion');assert.equal(entry.outlawFaction,null);
 assert.equal(world.rivalDiplomacy.companies['bronze-oath'].declaredHour,null);assert.equal(world.rivalDiplomacy.companies['gilded-road'].declaredHour,null);
 const logs=world.log.length;advanceRivalDiplomacy(world,context);assert.equal(world.log.length,logs);validateSave(world);
});
test('war gives a day of warning; hunting uses normal movement eligibility, daylight, recovery and town safety',()=>{
 const {world,company,entry}=scene();declare(world,company,entry);world.position.x+=80;assert.equal(rivalHuntsPlayer(world,company,context),false);
 world.day++;world.rivalCompanies.lastHour=clock(world);assert.equal(rivalHuntsPlayer(world,company,context),true);
 company.inventory=['arming-sword'];assert.equal(rivalHuntsPlayer(world,company,context),false);company.inventory=[];
 world.hour=22;assert.equal(rivalHuntsPlayer(world,company,context),false);world.hour=8;
 company.status='resting';assert.equal(rivalHuntsPlayer(world,company,context),false);company.status='travelling';
 world.position={x:SETTLEMENTS[0].x,y:SETTLEMENTS[0].y};assert.equal(rivalHuntsPlayer(world,company,context),false);
});
test('neutral and sheltered rivals cannot be attacked; a war unlocks pursuit',()=>{
 const {world,company,entry}=scene();company.position={x:600,y:480};world.position={...company.position};assert.equal(startBattle(world,'rival:red-jackals').ok,false);
 entry.declaredHour=clock(world);entry.reason='extortion';assert.equal(activateMapTarget(world,'rival','rival:red-jackals').ok,true);assert.equal(world.battle.encounterType,'rival');validateSave(world);
 const again=scene();declare(again.world,again.company,again.entry);const town=SETTLEMENTS[0];again.company.position={x:town.x,y:town.y};again.world.position={...again.company.position};assert.equal(startBattle(again.world,'rival:red-jackals').ok,false);
});
test('rival enemy units preserve exact earned stats, perks, gear and wounds, and reject forged ownership on reload',()=>{
 const {world,company,entry}=scene();declare(world,company,entry);company.party[0].perks=['pathfinder','colossus'];company.party[0].armorDurability.body=73;
 assert.equal(startBattle(world,'rival:red-jackals').ok,true);const p=company.party[0],unit=world.battle.units.find(u=>u.id==='enemy-1'),stats=getCompanyStats(p,{ignoreInjuries:true});
 assert.equal(unit.meleeSkill,stats.meleeSkill);assert.equal(unit.maxFatigue,stats.maxFatigue);assert.equal(unit.maxHp,getCompanyStats(p).maxHp);assert.deepEqual(unit.perks,p.perks);assert.deepEqual(unit.equipment,p.equipment);assert.equal(unit.bodyArmor,73);validateSave(world);
 for(const mutate of [w=>w.battle.rivalPurse.gold++,w=>w.battle.units.find(u=>u.id==='enemy-1').perks=[],w=>w.battle.units.find(u=>u.id==='enemy-1').equipment.armor='patched-coat']){const bad=structuredClone(world);mutate(bad);assert.throws(()=>validateSave(bad));}
});
test('real victory eliminates the last rival once and transfers actual treasury, supplies and owned stash',()=>{
 let {world,company,entry}=scene();declare(world,company,entry);company.party=company.party.slice(0,1);company.party[0].hp=1;Object.keys(company.party[0].armorDurability).forEach(k=>company.party[0].armorDurability[k]=0);
 company.inventory=['winged-mace'];company.inventoryCondition=[null];const gold=world.gold,treasury=company.gold;
 startBattle(world,'rival:red-jackals');world=resolve(world);assert.equal(world.battle.status,'victory');assert.equal(world.battle.loot.gold,treasury);assert.ok(world.battle.loot.items.includes('winged-mace'));
 assert.equal(finishBattle(world).ok,true);assert.equal(world.gold,gold+treasury);const owner=world.rivalCompanies.companies[1];assert.equal(owner.party.length,0);assert.equal(owner.status,'dissolved');assert.equal(owner.gold,0);assert.equal(world.rivalDiplomacy.companies[owner.id].eliminatedByPlayer,true);validateSave(world);
 assert.equal(startBattle(world,'rival:red-jackals').ok,false);assert.equal(finishBattle(world).ok,false);
});
test('retreat preserves actual rival casualties and wear without giving loot or resetting their survivors',()=>{
 const {world,company,entry}=scene();declare(world,company,entry);startBattle(world,'rival:red-jackals');const units=world.battle.units.filter(u=>u.side==='enemy');units[0].hp=0;units[0].alive=false;units[1].hp-=11;units[1].bodyArmor-=27;
 const treasury=company.gold;retreatBattle(world);finishBattle(world);assert.equal(company.party.length,6);assert.equal(company.party.some(p=>p.id==='red-jackals-1'),false);assert.equal(company.party[0].hp,units[1].hp);assert.equal(company.party[0].armorDurability.body,units[1].bodyArmor);assert.equal(company.gold,treasury);assert.equal(entry.eliminatedByPlayer,false);validateSave(world);
});
test('faction warrants offer a hard live-company bounty only after the Jackals mature, using the combat slot',()=>{
 const {world,company,entry}=scene();season(world,company);company.position={x:600,y:480};advanceRivalDiplomacy(world,context);assert.equal(entry.reason,'extortion');assert.ok(entry.outlawFaction);
 const town=SETTLEMENTS.find(t=>soldierFactionAt(t.x,t.y).id===entry.outlawFaction);world.position={x:town.x,y:town.y};const offer=getContractOffers(world,town.id).find(o=>o.type==='rival-bounty');assert.ok(offer);assert.ok(offer.reward>=3000);assert.equal(acceptContract(world,town.id,offer.id).ok,true);assert.equal(world.contract.rivalId,company.id);assert.equal(contractObjectiveComplete(world),false);validateSave(world);
 const restored=validateSave(JSON.parse(JSON.stringify(world)));assert.equal(restored.contract.type,'rival-bounty');assert.equal(restored.contract.factionId,entry.outlawFaction);
 company.party=company.party.slice(0,4);world.contract=null;assert.equal(getContractOffers({...world,contractBoards:{}},town.id).some(o=>o.type==='rival-bounty'),false);
});
test('hostile UI clearly exposes hunting and war reasons without adding controls for neutral bands',()=>{
 const {world,company,entry}=scene();declare(world,company,entry);const hostile=getRivalCompanies(world)[1],neutral=getRivalCompanies(world)[0];assert.match(rivalSidebarHTML(world,hostile),/At war/);assert.match(rivalSidebarHTML(world,hostile),/data-engage="rival:red-jackals"/);assert.match(rivalSidebarHTML(world,hostile),/Declaration of war/);assert.doesNotMatch(rivalSidebarHTML(world,neutral),/data-engage/);assert.match(rivalJournalHTML(world),/⚔ At war/);
});
test('enemy bows spend the rival ammunition pool and cannot continue firing after it is exhausted',()=>{
 let {world,company,entry}=scene();declare(world,company,entry);company.party=company.party.slice(-1);company.supplies.ammo=1;company.ledger.ammoUsed=23;
 startBattle(world,'rival:red-jackals');let steps=0;
 while(world.battle.status==='active'&&steps++<500){advanceBattle(world);assert.ok(world.battle.rivalAmmoUsed<=1);if(steps%10===0)world=validateSave(JSON.parse(JSON.stringify(world)));}
 assert.equal(world.battle.rivalAmmoUsed,1);if(world.battle.status==='active')retreatBattle(world);finishBattle(world);const owner=world.rivalCompanies.companies[1];assert.equal(owner.supplies.ammo,0);assert.equal(owner.ledger.ammoUsed,24);validateSave(world);
});
test('an elimination bounty pays once at its issuer and cannot trap the combat slot when the rival falls elsewhere',()=>{
 let {world,company,entry}=scene();season(world,company);company.position={x:600,y:480};advanceRivalDiplomacy(world,context);
 const town=SETTLEMENTS.find(t=>soldierFactionAt(t.x,t.y).id===entry.outlawFaction);world.position={x:town.x,y:town.y};acceptContract(world,town.id,getContractOffers(world,town.id).find(o=>o.type==='rival-bounty').id);const reward=world.contract.reward;
 company.party=company.party.slice(0,1);company.party[0].hp=1;Object.keys(company.party[0].armorDurability).forEach(k=>company.party[0].armorDurability[k]=0);world.position={...company.position};startBattle(world,'rival:red-jackals');world=resolve(world);finishBattle(world);assert.equal(contractObjectiveComplete(world),true);
 const gold=world.gold;world.position={x:town.x,y:town.y};activateMapTarget(world,'town',town.id);tick(world,.25);assert.equal(world.gold,gold+reward);assert.equal(world.contract,null);assert.equal(world.rivalDiplomacy.companies['red-jackals'].bountyClaimed,true);validateSave(world);tick(world,.25);assert.equal(world.gold,gold+reward);
 const other=scene();season(other.world,other.company);other.company.position={x:600,y:480};advanceRivalDiplomacy(other.world,context);const issuer=SETTLEMENTS.find(t=>soldierFactionAt(t.x,t.y).id===other.entry.outlawFaction);other.world.position={x:issuer.x,y:issuer.y};acceptContract(other.world,issuer.id,getContractOffers(other.world,issuer.id).find(o=>o.type==='rival-bounty').id);other.company.party=[];other.company.status='dissolved';other.company.restUntil=0;const untouched=other.world.gold;tick(other.world,.25);assert.equal(other.world.contract,null);assert.equal(other.world.gold,untouched);validateSave(other.world);
});

test('a real NPC commitment prevents player entry and preserves its frozen roster',()=>{
 const {world,company,entry}=scene();declare(world,company,entry);const camp=getCampSites(world).find(c=>c.difficulty===1);company.position={x:camp.x,y:camp.y};company.targetCampId=camp.id;world.position={...company.position};planRivalWorldCombat(world);assert.ok(world.rivalCompanies.jobs.some(j=>j.companyId===company.id));assert.equal(startBattle(world,'rival:red-jackals').ok,false);validateSave(world);
});

test('hostile pursuit follows native travel at the rival position, with its own provisions and terrain',()=>{
 const {world,company,entry}=scene();declare(world,company,entry);world.day=2;world.rivalCompanies.lastHour=clock(world);world.position.x+=80;world.food=0;
 const native={...context,food:getDailyFood,travelSpeed:getWorldTravelSpeed};assert.equal(rivalHuntsPlayer(world,company,native),true);const before={...company.position},expected={...before};
 const view={...world,position:before,party:company.party,food:company.food,gold:company.gold,supplies:company.supplies,retinue:defaultRetinue(),inventory:company.inventory,cargo:company.cargo};
 moveWorldToward(expected,world.position,getWorldTravelSpeed(view)*.25);assert.equal(advanceRivalPlayerPursuit(world,company,native,.25),true);assert.deepEqual(company.position,expected);assert.ok(Math.hypot(company.position.x-before.x,company.position.y-before.y)<=getWorldTravelSpeed(view)*.25+1e-7);
});
test('a real rival victory earns XP, legal upgrades and captured possessions rather than invented camp rewards',()=>{
 let {world,company,entry}=scene();declare(world,company,entry);company.party=company.party.slice(0,1);company.party[0].xp=getCompanyStats(company.party[0]).nextLevelXp-1;const level=company.party[0].level,treasury=company.gold,captured=Math.min(1000,world.gold);
 world.party.forEach(p=>{p.hp=1;for(const key of Object.keys(p.armorDurability))p.armorDurability[key]=0;});startBattle(world,'rival:red-jackals');world=resolve(world);assert.equal(world.battle.status,'defeat');finishBattle(world);const owner=world.rivalCompanies.companies[1];assert.equal(owner.gold,treasury+captured);assert.equal(owner.ledger.goldEarned,captured);assert.ok(owner.party[0].level>level);assert.ok(owner.inventory.length>0);assert.equal(owner.party[0].pendingLevelUps.length,0);validateSave(world);
});

test('realtime rival battle survives reload and settles the same persistent owner and treasury',()=>{
 let {world,company,entry}=scene();declare(world,company,entry);company.party=company.party.slice(0,1);company.party[0].hp=1;Object.keys(company.party[0].armorDurability).forEach(k=>company.party[0].armorDurability[k]=0);
 const treasury=company.gold;setSimultaneousBetaEnabled(true);
 try{assert.equal(startBattle(world,'rival:red-jackals').ok,true);}finally{setSimultaneousBetaEnabled(false);}
 assert.ok(world.battle.simultaneous);world=validateSave(structuredClone(world));world=resolve(world);
 assert.equal(world.battle.status,'victory');assert.equal(world.battle.loot.gold,treasury);assert.equal(finishBattle(world).ok,true);
 assert.equal(world.rivalCompanies.companies[1].status,'dissolved');validateSave(world);
});
