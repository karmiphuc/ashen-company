// Live-world reservations and outcome accounting. Combat itself stays in the
// shared turn-based worker; no power-score winner or synthetic rewards.
export const RIVAL_ENGAGEMENT_HOURS=6;
export const rivalClock=world=>(world.day-1)*24+world.hour;
export const rivalFightFor=(world,id)=>(world.rivalCompanies?.jobs??[]).find(job=>job.companyId===id||job.encounterId===id);
export function enableRivalCombat(world){
 const record=world.rivalCompanies;if(!record||record.version===2)return;
 record.version=2;record.jobs=[];record.reports=[];record.campWear={};
 for(const company of record.companies){company.targetCampId=null;company.lastHuntDay=0;Object.assign(company.ledger,{goldEarned:0,foodLoot:0,toolsLoot:0,medicineLoot:0,ammoLoot:0,ammoBought:0,ammoUsed:0,ammoOpening:company.supplies.ammo});}
}
export function rivalCombatBarrier(world,through=rivalClock(world)){
 const job=(world.rivalCompanies?.jobs??[]).find(job=>job.endHour<=through+1e-9&&job.checkpoint?.status!=='settled');
 return job?{ok:false,rivalPending:true,message:'A mercenary battle is resolving. The Marches will resume shortly.'}:null;
}
export function planRivalCombat(world,context){
 if(world.battle||world.gameOver||!world.rivalCompanies)return;
 enableRivalCombat(world);const record=world.rivalCompanies,now=record.lastHour;
 const hour=now%24,day=Math.floor(now/24)+1;
 const reserved=new Set([world.destinationAction?.id,...context.contracts(world).map(c=>c.campId),...record.jobs.map(j=>j.encounterId)]);
 let camps;
 for(const company of record.companies){
  if(company.status==='dissolved'||rivalFightFor(world,company.id))continue;
  const ready=company.food>=context.food({...world,party:company.party,retinue:context.retinue()})*2&&!company.party.some(p=>p.hp<context.stats(p).maxHp*.65);
  if(company.targetCampId&&!ready){company.targetCampId=null;continue;}
  if(company.targetCampId){
   const camp=reserved.has(company.targetCampId)?null:context.targetCamp(world,company.targetCampId);
   if(!camp||context.skirmish(world,camp.id)){company.targetCampId=null;continue;}
   if(Math.hypot(company.position.x-camp.x,company.position.y-camp.y)>context.radius)continue;
   // An engagement plus its aftermath occupies six campaign hours. Restrict
   // starts to daylight so nightly upkeep never uses a stale participant list.
   if(hour<6||hour>14||company.lastHuntDay===day)continue;
   const source=context.snapshot(world);
   const sourceBytes=new TextEncoder().encode(JSON.stringify(source)).byteLength;
   const baseBytes=new TextEncoder().encode(JSON.stringify({...world,rivalCompanies:{...record,jobs:[]}})).byteLength;
   const reservedBytes=record.jobs.reduce((sum,j)=>sum+new TextEncoder().encode(JSON.stringify(j.source)).byteLength+750000,0);
   if(sourceBytes>300000||baseBytes+reservedBytes+sourceBytes+750000>4*1024*1024-65536)continue; // preserve export/import capacity
   record.jobs.push({companyId:company.id,encounterId:camp.id,generation:camp.generation,startedHour:now,endHour:now+RIVAL_ENGAGEMENT_HOURS,source,checkpoint:null});
   company.lastHuntDay=day;reserved.add(camp.id);continue;
  }
  if(company.status!=='travelling'||company.lastHuntDay===world.day||!ready)continue;
  camps??=context.camps(world);
  const candidate=camps.filter(c=>!c.cleared&&!reserved.has(c.id)&&!context.skirmish(world,c.id)&&c.enemyCount<=company.party.length&&c.difficulty<=2&&Math.hypot(company.position.x-c.x,company.position.y-c.y)<=180)
   .sort((a,b)=>Math.hypot(company.position.x-a.x,company.position.y-a.y)-Math.hypot(company.position.x-b.x,company.position.y-b.y)||a.id.localeCompare(b.id)).find(c=>context.canReach(company.position,c));
  if(candidate){company.targetCampId=candidate.id;reserved.add(candidate.id);}
 }
}
export function acknowledgeRivalCombat(world,companyId,checkpoint){
 const job=rivalFightFor(world,companyId);if(!job)return false;
 if(checkpoint.companyId!==companyId||checkpoint.encounterId!==job.encounterId||checkpoint.steps<(job.checkpoint?.steps??0))throw new TypeError('Invalid rival combat acknowledgement');
 job.source=checkpoint.world;job.checkpoint=checkpoint;return true;
}
export function commitRivalCombat(world,context){
 const record=world.rivalCompanies;if(record?.version!==2)return;
 const now=rivalClock(world);
 for(const job of [...record.jobs]){
  if(job.endHour>now+1e-9||job.checkpoint?.status!=='settled')continue;
  const company=record.companies.find(c=>c.id===job.companyId),initial=job.source.rivalCompanies.companies.find(c=>c.id===job.companyId),receipt=job.checkpoint.receipt;
  if(!company||receipt.companyId!==job.companyId||receipt.encounterId!==job.encounterId||receipt.generation!==job.generation)throw new TypeError('Invalid rival world settlement');
  const ledger=company.ledger;
  const loot=receipt.outcome==='victory'?job.checkpoint.state.battle.loot:{food:0,tools:0,medicine:0,ammo:0};
  ledger.goldEarned+=Math.max(0,receipt.gold-initial.gold);ledger.foodLoot+=loot.food;ledger.provisions+=Math.max(0,initial.food+loot.food-receipt.food);
  for(const kind of ['tools','medicine','ammo']){
   ledger[`${kind}Loot`]+=loot[kind];
   ledger[kind==='ammo'?'ammoUsed':kind]+=Math.max(0,initial.supplies[kind]+loot[kind]-receipt.supplies[kind]);
  }
  for(const key of ['party','gold','food','supplies','inventory','inventoryCondition','cargo'])company[key]=structuredClone(receipt[key]);
  company.targetCampId=null;company.status=company.party.length?'resting':'dissolved';company.restUntil=company.party.length?now+6:0;
  if(receipt.outcome==='victory'){
   world.camps[job.encounterId]={...receipt.campRecord,clearedDay:world.day,respawnAt:job.endHour+(receipt.campRecord.respawnAt-job.startedHour)};
   delete world.worldLosses[job.encounterId];delete record.campWear[job.encounterId];
  }else{
   const survivors=receipt.enemies.filter(e=>e.unit.alive||e.unit.escaped),previous=world.worldLosses[job.encounterId];
   const size=Math.max(previous?.size??0,...receipt.enemies.map(e=>e.worldIndex+1));
   if(survivors.length&&survivors.length<size)world.worldLosses[job.encounterId]={cycle:job.generation,size,survivors:survivors.map(e=>e.worldIndex)};
   if(survivors.length)record.campWear[job.encounterId]={generation:job.generation,units:survivors.map(e=>({index:e.worldIndex,hp:Math.max(1,e.unit.hp),bodyArmor:e.unit.bodyArmor,headArmor:e.unit.headArmor,shieldDurability:e.unit.shieldDurability,reserveShieldDurability:e.unit.reserveShieldDurability,attachmentArmor:e.unit.attachmentArmor,morale:e.unit.morale,injuries:(e.unit.injuries??[]).map(({fresh,sourceId,...wound})=>wound)}))};
  }
  const discovery=job.checkpoint.state.discoveryRolls?.[job.encounterId];if(discovery){world.discoveryRolls??={};world.discoveryRolls[job.encounterId]=structuredClone(discovery);}
  record.reports.push({companyId:job.companyId,encounterId:job.encounterId,outcome:receipt.outcome,losses:receipt.losses.length,gold:receipt.gold-initial.gold,hour:job.endHour});record.reports=record.reports.slice(-12);
  record.jobs.splice(record.jobs.indexOf(job),1); // exactly-once commit
 }
}
export function applyRivalCampWear(world,id,generation,enemies){
 const wear=world.rivalCompanies?.campWear?.[id];if(wear?.generation!==generation)return enemies;
 return enemies.map(enemy=>{const damage=wear.units.find(u=>u.index===enemy.worldIndex);if(!damage)return enemy;
  const copy={...enemy,savedDamage:{hp:damage.hp,bodyArmor:damage.bodyArmor,headArmor:damage.headArmor,shieldDurability:damage.shieldDurability,reserveShieldDurability:damage.reserveShieldDurability,attachmentArmor:damage.attachmentArmor,morale:damage.morale,injuries:damage.injuries}};
  Object.defineProperty(copy,'worldIndex',{value:enemy.worldIndex,enumerable:false});return copy;
 });
}
