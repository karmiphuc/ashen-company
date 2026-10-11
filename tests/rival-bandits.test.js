import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advanceRivalSimulation,planRivalWorldCombat,getRoamingBands,validateSave,tick,startBattle,SETTLEMENTS,getCompanyStats} from '../src/engine.js';
import {enableRivalCombat,acknowledgeRivalCombat} from '../src/rival-world-combat.js';
import {createHeadlessCombat,advanceHeadlessCombat,settleHeadlessCombat,restoreHeadlessCombat} from '../src/headless-combat.js';
import {RIVAL_GOALS,rivalCanHunt} from '../src/rival-goals.js';
import {getItem,getMarket} from '../src/engine.js';
import {NAMED_WEAPONS} from '../src/named-weapons.js';
const itemCondition=id=>getItem(id)?.armor??null;
function scene(hour=8,difficulty=0){const world=createGame(12);world.hour=hour;advanceRivalSimulation(world);enableRivalCombat(world);const band=getRoamingBands(world).find(b=>b.difficulty===difficulty&&SETTLEMENTS.every(t=>Math.hypot(t.x-b.x,t.y-b.y)>40));const company=world.rivalCompanies.companies[0];company.position={x:band.x,y:band.y};company.status='travelling';return {world,band,company};}
function resolve(job){const combat=createHeadlessCombat(job.source,job.companyId,job.encounterId);while(combat.status==='running')advanceHeadlessCombat(combat,{maxSteps:256,budgetMs:1000});settleHeadlessCombat(combat);return combat;}
test('a physical roaming encounter uses real combat, reloads, and clears the correct spawn exactly once',()=>{
 const {world,band,company}=scene();planRivalWorldCombat(world);const job=world.rivalCompanies.jobs.find(j=>j.companyId===company.id);assert.equal(job.encounterId,band.id);assert.equal(job.endHour-job.startedHour,.25);assert.equal(startBattle({...world,position:{...company.position}},band.id).ok,false);validateSave(world);for(const change of [w=>w.bands[band.id].x++,w=>w.bands[band.id].spawnCycle++]){const bad=structuredClone(world);change(bad);assert.throws(()=>validateSave(bad));}
 const combat=resolve(job);assert.equal(combat.receipt.outcome,'victory');assert.equal(combat.state.battle.encounterType,'band');restoreHeadlessCombat(combat);acknowledgeRivalCombat(world,company.id,combat);validateSave(JSON.parse(JSON.stringify(world)));tick(world,.25);
 assert.equal(world.bands[band.id].spawnCycle,band.spawnCycle+1);assert.equal(world.bands[band.id].defeatedUntil,8.25+48);assert.equal(company.gold,combat.receipt.gold);assert.ok(company.ledger.goldEarned>0);assert.equal(world.camps[band.id],undefined);assert.equal(getRoamingBands(world).some(b=>b.id===band.id),false);validateSave(world);assert.equal(acknowledgeRivalCombat(world,company.id,combat),false);
});
test('night interception cannot be avoided by wounds or supplies and crossing midnight charges actual survivors',()=>{
 const {world,band,company}=scene(23.75,3);company.party.forEach(p=>{p.hp=1;for(const key of Object.keys(p.armorDurability))p.armorDurability[key]=0;});planRivalWorldCombat(world);const job=world.rivalCompanies.jobs.find(j=>j.companyId===company.id);assert.ok(job);const combat=resolve(job);assert.equal(combat.receipt.outcome,'defeat');acknowledgeRivalCombat(world,company.id,combat);validateSave(world);tick(world,.25);assert.equal(world.day,2);assert.equal(company.status,'dissolved');assert.equal(company.ledger.goldEarned,0);assert.ok(world.rivalCompanies.campWear[band.id]);assert.ok(getRoamingBands(world).find(b=>b.id===band.id).enemies.some(e=>e.savedDamage));validateSave(JSON.parse(JSON.stringify(world)));
});
test('goals use different risk margins while wounds and actual armor wear reduce willingness to hunt',()=>{
 const {company}=scene();const context={stats:getCompanyStats,itemCondition,getItem};const band={enemies:Array.from({length:6},()=>({hp:60,skill:60,armor:'reinforced-mail',helmet:'iron-helm'}))};assert.ok(RIVAL_GOALS['gilded-road'].margin>RIVAL_GOALS['red-jackals'].margin);assert.equal(rivalCanHunt(company,band,context),true);company.party.forEach(p=>{p.hp=1;p.armorDurability.body=0;p.armorDurability.head=0;});assert.equal(rivalCanHunt(company,band,context),false);
});
test('weak rivals detour physically from visible stronger bands, and vulnerable rivals can be chased',()=>{
 const {world,band,company}=scene(8,3);company.position.x+=70;company.party.forEach(p=>{p.hp=1;p.armorDurability.body=0;p.armorDurability.head=0;});const before={...company.position};tick(world,.25);assert.ok(Math.hypot(company.position.x-band.x,company.position.y-band.y)>Math.hypot(before.x-band.x,before.y-band.y));assert.ok(Math.hypot(company.position.x-before.x,company.position.y-before.y)<30);assert.equal(world.bands[band.id].behavior,'hunting-rival');assert.equal(world.bands[band.id].targetId,company.id);validateSave(world);
});
test('selected player pursuits and town sanctuary remain protected from rival reservations',()=>{
 const {world,band,company}=scene();world.pursuit=band.id;planRivalWorldCombat(world);assert.equal(world.rivalCompanies.jobs.some(j=>j.encounterId===band.id),false);world.pursuit=null;const town=SETTLEMENTS[0];company.position={x:town.x,y:town.y};Object.assign(world.bands[band.id],{x:town.x,y:town.y});planRivalWorldCombat(world);assert.equal(world.rivalCompanies.jobs.some(j=>j.companyId===company.id),false);
});

test('an immediate player interception takes precedence over a rival standing next to the same band',()=>{const {world,band}=scene();world.position={x:band.x,y:band.y};world.encounterGraceUntil=0;planRivalWorldCombat(world);assert.equal(world.rivalCompanies.jobs.some(j=>j.encounterId===band.id),false);assert.equal(startBattle(world,band.id).ok,true);validateSave(world);});

test('towns liquidate only real ordinary spoils at normal prices and the stash uses the player base limit',()=>{
 const world=createGame(12);advanceRivalSimulation(world);enableRivalCombat(world);const company=world.rivalCompanies.companies[0];const named=NAMED_WEAPONS[0].id;company.inventory=[...Array(129).fill('arming-sword'),named];company.inventoryCondition=Array(130).fill(null);validateSave(world);const before=company.gold,playerGold=world.gold,quote=getMarket(world).equipment.find(e=>e.itemId==='arming-sword').sellPrice;tick(world,.25);assert.equal(company.inventory.length,118);assert.ok(company.inventory.includes(named)||company.party.some(p=>p.equipment.weapon===named));assert.equal(world.gold,playerGold);assert.equal(company.gold-before,quote*12);assert.equal(company.gold-before,company.ledger.goldEarned);assert.ok(company.ledger.goldEarned>0);validateSave(world);
});
