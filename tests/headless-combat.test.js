import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advanceRivalSimulation,getCampSites,startBattle,advanceBattle,finishBattle,getCompanyStats,trainRivalSurvivors} from '../src/engine.js';
import {createHeadlessCombat,restoreHeadlessCombat,advanceHeadlessCombat,advanceHeadlessQueue,settleHeadlessCombat,HEADLESS_MAX_STEPS} from '../src/headless-combat.js';
import {setSimultaneousBetaEnabled} from '../src/combat-config.js';
function scene(seed=12,companyId='gilded-road',{day=1,level=1,difficulty=1}={}){
 const world=createGame(seed);world.day=day;world.shipments={};world.shipmentLegacyThroughDay=day;
 for(const person of world.party)person.level=level;
 advanceRivalSimulation(world);const camp=getCampSites(world).find(c=>c.difficulty===difficulty&&!c.cleared);
 const owner=world.rivalCompanies.companies.find(c=>c.id===companyId);owner.position={x:camp.x,y:camp.y};
 return {world,camp,companyId};
}
function jobFor(scene){return createHeadlessCombat(scene.world,scene.companyId,scene.camp.id);}
function finish(job){for(let slice=0;slice<1000&&job.status==='running';slice++)advanceHeadlessCombat(job,{maxSteps:256,budgetMs:1000});assert.equal(job.status,'ready');return settleHeadlessCombat(job);}
const saved=job=>restoreHeadlessCombat(JSON.parse(JSON.stringify(job)));

test('isolated rival preparation preserves live resources, quests and the actual world enemy roster',()=>{
 const s=scene(12,'gilded-road',{day:45,level:12,difficulty:2});s.world.retinue.members=['scavenger','drillmaster'];
 const before=structuredClone(s.world),job=jobFor(s);
 assert.deepEqual(s.world,before);assert.deepEqual(job.state.party,before.rivalCompanies.companies[0].party);
 assert.deepEqual(job.state.retinue.members,[]);assert.equal(job.state.contract,null);assert.equal(job.state.rivalCompanies,undefined);
 const ordinary=structuredClone(s.world);ordinary.position={x:s.camp.x,y:s.camp.y};assert.equal(startBattle(ordinary,s.camp.id).ok,true);
 assert.deepEqual(job.state.battle.units.filter(u=>u.side==='enemy'),ordinary.battle.units.filter(u=>u.side==='enemy'));
 assert.equal(saved(job).state.battle.difficulty,s.camp.difficulty);
 assert.notEqual(getCampSites(job.state).find(c=>c.id===s.camp.id).veteranRank,s.camp.veteranRank,'NPC strength must not regenerate a weaker camp');
 job.state.supplies.ammo=0;job.state.party[0].hp=1;job.world.party[0].hp=1;assert.deepEqual(s.world,before);
});

test('rivals must arrive, cannot take player-accepted camps or cleared camps, and keep their own combat mode',()=>{
 const s=scene(),remote=structuredClone(s.world);remote.rivalCompanies.companies[0].position={x:350,y:460};assert.throws(()=>createHeadlessCombat(remote,s.companyId,s.camp.id),/reach the camp/);
 const reserved=structuredClone(s.world);reserved.contractSerial=1;reserved.contract={id:'delivery-1',type:'hunt',from:'oakwatch',to:'oakwatch',reward:100,renown:1,campId:s.camp.id,campGeneration:s.camp.generation,acceptedDay:reserved.day};assert.throws(()=>createHeadlessCombat(reserved,s.companyId,s.camp.id),/reserved/);
 const cleared=structuredClone(s.world);cleared.camps[s.camp.id]={clearedDay:1,generation:s.camp.generation,respawnAt:100};assert.throws(()=>createHeadlessCombat(cleared,s.companyId,s.camp.id),/unavailable/);
 assert.throws(()=>createHeadlessCombat(s.world,'missing',s.camp.id),/company/);assert.throws(()=>createHeadlessCombat(s.world,s.companyId,'legacy-warrior'),/unavailable/);
 setSimultaneousBetaEnabled(true);try{assert.equal(jobFor(s).state.battle.simultaneous,undefined);}finally{setSimultaneousBetaEnabled(false);}
});

test('bounded headless slices match ordinary combat, including ammo, injury, wear, casualties, XP and real loot',()=>{
 const s=scene(),before=structuredClone(s.world),job=saved(jobFor(s)),ordinary=structuredClone(job.state);
 while(ordinary.battle.status==='active')assert.equal(advanceBattle(ordinary).ok,true);
 const receipt=finish(job);assert.deepEqual(job.state.battle,ordinary.battle);assert.equal(finishBattle(ordinary).ok,true);trainRivalSurvivors(ordinary);
 for(const field of ['party','gold','food','supplies','inventory','inventoryCondition','cargo'])assert.deepEqual(receipt[field],ordinary[field],field);
 assert.deepEqual(receipt.campRecord,ordinary.camps[s.camp.id]);assert.equal(receipt.outcome,'victory');assert.ok(receipt.gold>12000);assert.ok(receipt.party.some(p=>p.xp>0));assert.ok(receipt.supplies.ammo<24);assert.ok(receipt.party.some(p=>p.armorDurability.body<210));
 assert.deepEqual(s.world,before);const snapshot=structuredClone(job),retry=settleHeadlessCombat(job);assert.deepEqual(job,snapshot);assert.deepEqual(retry,receipt);retry.party[0].hp=1;assert.notEqual(job.receipt.party[0].hp,1);assert.deepEqual(saved(job).receipt,receipt);
});

test('real combat preserves casualties and defeat without granting replacement gear or rewards',()=>{
 for(const [seed,companyId,day,level,difficulty,expectedLosses,expectedOutcome] of [[13,'red-jackals',45,12,2,1,'victory'],[14,'bronze-oath',80,20,3,8,'defeat']]){
  const s=scene(seed,companyId,{day,level,difficulty}),before=structuredClone(s.world),job=jobFor(s),gold=job.state.gold,receipt=finish(job);
  assert.equal(receipt.outcome,expectedOutcome);assert.equal(receipt.losses.length,expectedLosses);assert.equal(receipt.party.length,before.rivalCompanies.companies.find(c=>c.id===companyId).party.length-expectedLosses);
  if(expectedOutcome==='defeat'){assert.equal(receipt.gold,gold);assert.equal(receipt.inventory.length,0);assert.equal(receipt.campRecord,null);assert.equal(receipt.supplies.ammo,0);}
  assert.deepEqual(s.world,before);assert.deepEqual(saved(job).receipt,receipt);
 }
});

test('previous world casualties retain their original troop identities in checkpoints and settlement',()=>{
 const s=scene();s.world.worldLosses[s.camp.id]={cycle:s.camp.generation,size:3,survivors:[1,2]};
 const job=jobFor(s);assert.deepEqual(job.enemyWorldIndices,[1,2]);assert.deepEqual(saved(job).enemyWorldIndices,[1,2]);
 const receipt=finish(job);assert.deepEqual(receipt.enemies.map(enemy=>enemy.worldIndex),[1,2]);assert.equal(receipt.enemies.length,2);assert.deepEqual(saved(job).receipt.enemies,receipt.enemies);
 const bad=structuredClone(job);bad.enemyWorldIndices=[0,1];assert.throws(()=>restoreHeadlessCombat(bad),/world identities/);
});

test('batch sizes, round-robin scheduling and repeated save/load never reroll the outcome',()=>{
 const a=saved(jobFor(scene(13))),b=saved(a);const queue=[b,saved(jobFor(scene(14,'bronze-oath')))];let cursor=0;
 for(let round=0;queue.some(job=>job.status==='running')&&round<10000;round++){
  const slice=advanceHeadlessQueue(queue,cursor,{maxSteps:1+(round%5),budgetMs:1000});cursor=slice.cursor;
  if(round%7===0)for(let i=0;i<queue.length;i++)queue[i]=saved(queue[i]);
 }
 const receipt=finish(a);assert.equal(queue[0].status,'ready');assert.deepEqual(settleHeadlessCombat(queue[0]),receipt);assert.equal(queue[0].steps,a.steps);
 assert.equal(queue[1].status,'ready');assert.ok(settleHeadlessCombat(queue[1]).party.some(p=>p.equipment.mount));
});

test('an exhausted CPU slice makes no decisions and queue cursors give each company a turn',()=>{
 const jobs=[jobFor(scene(12)),jobFor(scene(13)),jobFor(scene(14))],before=structuredClone(jobs);
 assert.deepEqual(advanceHeadlessCombat(jobs[0],{budgetMs:0}),{completed:0,maxActionMs:0,pending:true});assert.deepEqual(jobs,before);
 let cursor=0;for(let i=0;i<3;i++)cursor=advanceHeadlessQueue(jobs,cursor,{budgetMs:1000}).cursor;
 assert.deepEqual(jobs.map(job=>job.steps),[1,1,1]);assert.equal(cursor,0);
 assert.throws(()=>advanceHeadlessQueue([...jobs,jobs[0]]),/queue/);assert.throws(()=>advanceHeadlessCombat(jobs[0],{maxSteps:10000}),/options/);
});

test('deterministic stalemate guard retreats through the shared rules and does not invent a win or loot',()=>{
 const job=jobFor(scene()),food=job.state.food,gold=job.state.gold;job.steps=HEADLESS_MAX_STEPS;
 advanceHeadlessCombat(job,{budgetMs:1000});assert.equal(job.status,'ready');assert.equal(job.state.battle.status,'retreat');assert.equal(job.steps,HEADLESS_MAX_STEPS);
 const receipt=settleHeadlessCombat(job);assert.equal(receipt.gold,gold);assert.equal(receipt.food,food-2);assert.equal(receipt.campRecord,null);assert.equal(receipt.inventory.length,0);assert.ok(receipt.party.every(p=>p.hp<getCompanyStats(p).maxHp));assert.equal(saved(job).status,'settled');
});

test('restore rejects forged modes, ownership, version, progress, clocks and settlement receipts',()=>{
 const job=jobFor(scene());
 for(const mutate of [j=>j.version=3,j=>j.extra=true,j=>j.steps=-1,j=>j.status='settled',j=>j.companyId='bronze-oath',j=>j.encounterId='another-camp',j=>j.state.gold++,j=>j.state.party[0].level++,j=>j.state.retinue.members.push('scavenger'),j=>j.state.battle.units.pop(),j=>j.state.hour++,j=>j.state.battle.units[0].hp=99999,j=>j.state.battle.units[0].equipment.weapon='missing',j=>j.world.rivalCompanies.companies[0].gold++]){
  const bad=structuredClone(job);mutate(bad);assert.throws(()=>restoreHeadlessCombat(bad));
 }
 const terminal=jobFor(scene());finish(terminal);for(const mutate of [j=>j.receipt.gold++,j=>j.receipt.party[0].equipment.weapon='spear',j=>j.receipt.outcome='defeat']){const bad=structuredClone(terminal);mutate(bad);assert.throws(()=>restoreHeadlessCombat(bad),/receipt/);}
 assert.throws(()=>settleHeadlessCombat(job),/still running/);assert.equal(saved(terminal).status,'settled');
});

test('rivals gain only battle XP and spend earned stat rolls and legal perks deterministically',()=>{
 const s=scene(),job=jobFor(s);assert.ok(job.state.party.every(p=>p.level===3&&p.xp===0&&p.perks.length===0));
 while(job.state.battle.status==='active')assert.equal(advanceBattle(job.state).ok,true);job.status='ready';
 const ordinary=structuredClone(job.state);assert.equal(finishBattle(ordinary).ok,true);const untrained=structuredClone(ordinary);
 const receipt=settleHeadlessCombat(job);trainRivalSurvivors(ordinary);assert.deepEqual(receipt.party,ordinary.party);
 for(const member of receipt.party){const earned=untrained.party.find(p=>p.id===member.id);assert.equal(member.level,earned.level);assert.equal(member.xp,earned.xp);assert.equal(member.trainingPoints,0);assert.equal(member.pendingLevelUps.length,0);assert.equal(member.perks.length,member.level-1);}
 const before=structuredClone(ordinary);trainRivalSurvivors(ordinary);assert.deepEqual(ordinary,before);assert.deepEqual(saved(job).receipt,receipt);
 // A multi-level reward has real pending rolls and perk points; spending them
 // must use exactly those values without increasing XP or granting extra levels.
 const member=ordinary.party[0];member.level=7;member.perks=[];member.pendingLevelUps=[{level:7,rolls:{maxHp:2,maxFatigue:3,resolve:4,initiative:2,meleeSkill:5,rangedSkill:1,meleeDefense:2,rangedDefense:3}}];member.trainingPoints=1;
 const copy=structuredClone(ordinary),attributes={...member.attributes},xp=member.xp;trainRivalSurvivors(ordinary);trainRivalSurvivors(copy);assert.deepEqual(ordinary,copy);assert.equal(member.level,7);assert.equal(member.xp,xp);assert.equal(member.attributes.meleeSkill,attributes.meleeSkill+5);assert.equal(member.attributes.meleeDefense,attributes.meleeDefense+2);assert.equal(member.attributes.maxFatigue,attributes.maxFatigue+3);assert.equal(new Set(member.perks).size,6);
});
test('old version-one combat checkpoints preserve their original settlement without automatic perk spending',()=>{
 const job=jobFor(scene());job.version=1;const ordinary=structuredClone(job.state);while(ordinary.battle.status==='active')advanceBattle(ordinary);finishBattle(ordinary);const receipt=finish(job);assert.deepEqual(receipt.party,ordinary.party);assert.equal(saved(job).version,1);assert.deepEqual(saved(job).receipt,receipt);
});
