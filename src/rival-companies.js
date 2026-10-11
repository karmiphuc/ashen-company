import { rivalFightFor } from './rival-world-combat.js';
import { moveWorldToward, worldPointInBounds, worldBlocked } from './world-navigation.js';
import { defaultRetinue } from './retinue.js';

// Fixed campaign arrivals, independent of the player's strength or possessions.
export const RIVAL_DEFINITIONS = Object.freeze([
 {id:'gilded-road',name:'Gilded Road',crest:'◇',color:'#ddbd65',identity:'Contract specialists',homes:['oakwatch','greyhaven','stonebridge'],size:6,level:3,gold:12000},
 {id:'red-jackals',name:'Red Jackals',crest:'⚒',color:'#d78068',identity:'Camp hunters',homes:['ironford','highpass','ravenfell'],size:7,level:4,gold:9000},
 {id:'bronze-oath',name:'Bronze Oath',crest:'♜',color:'#9db7ce',identity:'Faction-backed veterans',homes:['ambercross','windrest','kargan'],size:8,level:5,gold:16000},
].map(d=>Object.freeze({...d,homes:Object.freeze(d.homes)})));
const definitions=new Map(RIVAL_DEFINITIONS.map(d=>[d.id,d]));
const nowOf=state=>(state.day-1)*24+state.hour;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ledgerKeys=['wages','provisions','purchases','tools','medicine','foodBought','toolsBought','medicineBought'];
const earnedLedgerKeys=['goldEarned','foodLoot','toolsLoot','medicineLoot','ammoLoot','ammoBought','ammoUsed','ammoOpening'];
const combatCompanyKeys=['targetCampId','lastHuntDay'];
const companyKeys=['id','position','targetTownId','status','restUntil','lastShopDay','routeIndex','gold','food','supplies','party','inventory','inventoryCondition','cargo','unpaidDays','hungryDays','ledger'];
function facade(world,company,now=nowOf(world)){
 return {seed:world.seed,day:Math.floor(now/24)+1,hour:now%24,position:company.position,party:company.party,gold:company.gold,food:company.food,supplies:company.supplies,inventory:company.inventory,inventoryCondition:company.inventoryCondition,cargo:company.cargo,retinue:defaultRetinue(),marketStock:world.marketStock,ashenWinter:world.ashenWinter,shipments:world.shipments,shipmentLegacyThroughDay:world.shipmentLegacyThroughDay,worldLayoutVersion:world.worldLayoutVersion,log:[],destination:null,battle:null,gameOver:false,renown:0};
}
function retain(company,view,before){company.gold=view.gold;company.food=view.food;company.ledger.tools+=Math.max(0,before.tools-view.supplies.tools);company.ledger.medicine+=Math.max(0,before.medicine-view.supplies.medicine);}
const supplySnapshot=company=>({...company.supplies});
function startingCompany(world,definition,context){
 const home=context.settlements.find(t=>t.id===definition.homes[0]);
 const company={id:definition.id,position:{x:home.x,y:home.y},targetTownId:home.id,status:'resting',restUntil:nowOf(world)+6,lastShopDay:0,routeIndex:0,gold:definition.gold,food:definition.size*3,supplies:{tools:8,medicine:5,ammo:24},party:[],inventory:[],inventoryCondition:[],cargo:{},unpaidDays:0,hungryDays:0,ledger:Object.fromEntries(ledgerKeys.map(k=>[k,0]))};
 const names=['Edric Vale','Runa Thorn','Odo Flint','Kara Reed','Bertram Pike','Mira Ash','Soren Frost','Asha Dawn'];
 for(let index=0;index<definition.size;index++){
  const ranged=index>=definition.size-2,reach=index===3;
  const member=context.normalize({id:`${definition.id}-${index+1}`,name:names[index],background:ranged?'Hunter':index===0?'Captain':'Guard',seed:(world.seed^((RIVAL_DEFINITIONS.indexOf(definition)+1)*13579)^((index+1)*7919))>>>0,hp:100,morale:75,level:definition.level,trainingPoints:definition.level-1,combatRole:ranged?'ranged':reach?'reach-support':'frontliner',equipment:{helmet:'iron-helm',armor:'reinforced-mail',weapon:ranged?'hunting-bow':reach?'billhook':index%2?'bludgeon':'arming-sword',shield:ranged||reach?null:'round-shield',mount:index<2&&definition.id==='bronze-oath'?'riding-horse':null}});
  company.party.push(member);
 }
 const view=facade(world,company);
 for(const member of company.party){while(member.pendingLevelUps.length)context.train(view,member.id,[member.combatRole==='ranged'?'rangedSkill':'meleeSkill','meleeDefense','maxFatigue']);member.hp=context.stats(member).maxHp;}
 return company;
}
const sleepingAt=clock=>{const hour=clock%24;return hour>=20||hour<6;};
function nightly(world,company,context,now){
 const view=facade(world,company,now),foodNeeded=context.food(view),wages=company.party.reduce((sum,p)=>sum+context.stats(p).dailyWage,0),gold=company.gold,food=company.food;
 const before=supplySnapshot(company);context.daily(view);retain(company,view,before);
 company.ledger.wages+=gold-company.gold;company.ledger.provisions+=food-company.food;
 company.unpaidDays=gold<wages?company.unpaidDays+1:0;company.hungryDays=food<foodNeeded?company.hungryDays+1:0;
 if(company.unpaidDays>=3||company.hungryDays>=3){company.status='dissolved';company.restUntil=0;}
}
function shop(world,company,context,now){
 const view=facade(world,company,now);
 if(company.lastShopDay===view.day||!context.servicesAvailable(company.targetTownId))return;
 company.lastShopDay=view.day;
 const market=context.market(view);if(!market)return;
 const reserve=company.party.reduce((sum,p)=>sum+context.stats(p).dailyWage,0)*3;
 const foodTarget=Math.ceil(context.food(view)*3);
 const purchase=(offer,needed,buy)=>{const quantity=Math.min(100,offer.stock,needed,Math.max(0,Math.floor((view.gold-reserve)/offer.buyPrice)));if(quantity>0){const before=view.gold,foodBefore=view.food,toolsBefore=view.supplies.tools,medicineBefore=view.supplies.medicine,ammoBefore=view.supplies.ammo;if(buy(quantity).ok){company.ledger.purchases+=before-view.gold;company.ledger.foodBought+=view.food-foodBefore;company.ledger.toolsBought+=view.supplies.tools-toolsBefore;company.ledger.medicineBought+=view.supplies.medicine-medicineBefore;if(company.ledger.ammoBought!==undefined)company.ledger.ammoBought+=view.supplies.ammo-ammoBefore;}}};
 purchase(market.food,Math.max(0,foodTarget-view.food),quantity=>context.buyFood(view,quantity));
 const wounded=company.party.some(p=>p.hp<context.stats(p).maxHp||p.injuries.length);
 const damaged=company.party.some(p=>Object.entries(p.armorDurability).some(([part,value])=>value<({body:context.itemCondition(p.equipment.armor),head:context.itemCondition(p.equipment.helmet),attachment:context.itemCondition(p.equipment.attachment),attachment2:context.itemCondition(p.equipment.attachment2),shield:context.itemCondition(p.equipment.shield),reserveShield:context.itemCondition(p.reserveEquipment.shield)}[part]??0)));
 for(const [kind,target] of [['medicine',wounded?5:0],['tools',damaged?8:0],...(world.rivalCompanies?.version===2?[['ammo',24]]:[])]){const offer=market.supplies.find(s=>s.kind===kind);purchase(offer,Math.max(0,target-view.supplies[kind]),quantity=>context.buySupplies(view,kind,quantity));}
 company.gold=view.gold;company.food=view.food;
}
function nextDestination(company,context){
 const definition=definitions.get(company.id);
 for(let attempts=0;attempts<definition.homes.length;attempts++){
  company.routeIndex=(company.routeIndex+1)%definition.homes.length;
  const target=context.settlements.find(t=>t.id===definition.homes[company.routeIndex]);
  if(context.servicesAvailable(target.id)){company.targetTownId=target.id;return;}
 }
 // No open town: remain in place and try again after a real six-hour rest.
 company.status='resting';
}
export function advanceRivalCompanies(world,context){
 const now=nowOf(world);
 if(world.rivalCompanies===undefined){world.rivalCompanies={version:1,startedHour:now,lastHour:now,companies:RIVAL_DEFINITIONS.map(d=>startingCompany(world,d,context))};return;}
 const record=world.rivalCompanies,elapsed=now-record.lastHour;if(elapsed<=1e-9)return;
 // Caller advances on the existing quarter-hour world schedule; never catch up a forged backlog.
 if(elapsed>.2500001)throw new TypeError('Invalid rival simulation clock');
 const midnight=Math.floor(now/24)>Math.floor(record.lastHour/24);
 for(const company of record.companies){
  if(company.status==='dissolved')continue;
  if(midnight)nightly(world,company,context,now);
  if(company.status==='dissolved'||rivalFightFor(world,company.id))continue;
  // Sleep gates the interval's start: the last evening step can reach town,
  // but 05:45–06:00 never travels. Midnight upkeep still runs while asleep.
  if(sleepingAt(record.lastHour))continue;
  let target=company.targetCampId?context.targetCamp(world,company.targetCampId):context.settlements.find(t=>t.id===company.targetTownId);
  if(!target){company.targetCampId=null;target=context.settlements.find(t=>t.id===company.targetTownId);}
  if(company.status==='resting'){
   if(distance(company.position,target)<=1e-7)shop(world,company,context,now);
   if(now+1e-9<company.restUntil)continue;
   const view=facade(world,company,now),before=supplySnapshot(company);context.rest(view);retain(company,view,before);
   company.status='travelling';nextDestination(company,context);company.restUntil=now+6;
   if(company.status==='resting')continue;
   target=context.settlements.find(t=>t.id===company.targetTownId);
  }
  if(!company.targetCampId&&!context.servicesAvailable(target.id)){nextDestination(company,context);if(company.status==='resting'){company.restUntil=now+6;continue;}target=context.settlements.find(t=>t.id===company.targetTownId);}
  // Price and speed use the start of the step, exactly as player travel does.
  const view=facade(world,company,record.lastHour);
  if(moveWorldToward(company.position,target,context.travelSpeed(view)*elapsed)&&!company.targetCampId){company.status='resting';company.restUntil=now+6;shop(world,company,context,now);}
 }
 record.lastHour=now;
}
export function rivalCompanyMarkers(world){
 return (world.rivalCompanies?.companies??[]).map(company=>{const definition=definitions.get(company.id);return {id:`rival:${company.id}`,kind:'rival',name:definition.name,crest:definition.crest,color:definition.color,x:company.position.x,y:company.position.y,active:company.status!=='dissolved',size:company.party.length};});
}
export function rivalCompanySites(world,context){
 return (world.rivalCompanies?.companies??[]).map(company=>{
  const definition=definitions.get(company.id),view=facade(world,company),target=context.settlements.find(t=>t.id===company.targetTownId),food=context.food(view),wages=company.party.reduce((sum,p)=>sum+context.stats(p).dailyWage,0);
  const town=sleepingAt(nowOf(world))?context.settlements.find(t=>distance(company.position,t)<=1e-7&&context.servicesAvailable(t.id)):null;
  const fight=rivalFightFor(world,company.id);
  const activity=fight?'⚔ Fighting · '+context.camps(world).find(c=>c.id===fight.encounterId)?.name:company.status==='dissolved'?'Company dissolved':sleepingAt(nowOf(world))?town?`Staying at the inn in ${town.name} until dawn`:'Sleeping in camp until dawn':company.status==='travelling'?`Travelling to ${company.targetCampId?context.camps(world).find(c=>c.id===company.targetCampId)?.name??'a camp':target.name}`:'Resting and provisioning';
  return {id:`rival:${company.id}`,kind:'rival',name:definition.name,crest:definition.crest,color:definition.color,identity:definition.identity,x:company.position.x,y:company.position.y,active:company.status!=='dissolved',activity,targetTownId:target.id,party:company.party,gold:company.gold,food:company.food,supplies:company.supplies,ledger:company.ledger,dailyWages:wages,dailyFood:food,unpaidDays:company.unpaidDays,hungryDays:company.hungryDays,playerRelation:'neutral'};
 });
}
const keys=(object,expected)=>object&&typeof object==='object'&&!Array.isArray(object)&&Object.keys(object).length===expected.length&&expected.every(k=>Object.hasOwn(object,k));
export function validateRivalCompanies(input,world,context){
 if(input===undefined)return undefined;
 const check=(ok,label)=>{if(!ok)throw new TypeError(`Invalid rival companies: ${label}`);},count=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000,time=n=>Number.isFinite(n)&&n>=0&&n<=nowOf(world),point=p=>keys(p,['x','y'])&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&worldPointInBounds(p)&&!worldBlocked(p);
 const modern=input.version===2;
 check(keys(input,['version','startedHour','lastHour','companies',...(modern?['jobs','reports','campWear']:[])])&&[1,2].includes(input.version),'version/fields');
 check(time(input.startedHour)&&time(input.lastHour)&&input.lastHour>=input.startedHour&&[input.startedHour,input.lastHour].every(n=>Math.abs(n*4-Math.round(n*4))<1e-7)&&nowOf(world)-input.lastHour<.2500001,'clock/activation');
 check(Array.isArray(input.companies)&&input.companies.length===3&&input.companies.every((c,i)=>c?.id===RIVAL_DEFINITIONS[i].id),'identities');
 const result=structuredClone(input);
 for(const company of result.companies){
  check(keys(company,[...companyKeys,...(modern?combatCompanyKeys:[])]),'company fields');
  const definition=definitions.get(company.id);
  check(point(company.position)&&definition.homes.includes(company.targetTownId),'position/route');
  check(['resting','travelling','dissolved'].includes(company.status)&&Number.isFinite(company.restUntil)&&company.restUntil>=0&&company.restUntil<=input.lastHour+6.0000001,'rest state');
  check(Number.isInteger(company.routeIndex)&&company.routeIndex>=0&&company.routeIndex<definition.homes.length&&company.targetTownId===definition.homes[company.routeIndex],'route index');
  check(count(company.lastShopDay)&&company.lastShopDay<=world.day&&count(company.gold)&&count(company.food)&&count(company.unpaidDays)&&company.unpaidDays<=3&&count(company.hungryDays)&&company.hungryDays<=3,'resources');
  check(keys(company.supplies,['tools','medicine','ammo'])&&Object.values(company.supplies).every(n=>count(n)&&n<=10000),'supplies');
  check(keys(company.ledger,[...ledgerKeys,...(modern?earnedLedgerKeys:[])])&&Object.values(company.ledger).every(count),'ledger');
  check(company.ledger.purchases>=company.ledger.foodBought*2+company.ledger.toolsBought+company.ledger.medicineBought,'purchase accounting');
  check(company.gold+company.ledger.wages+company.ledger.purchases===definition.gold+(company.ledger.goldEarned??0),'treasury accounting');
  check(company.food+company.ledger.provisions===definition.size*3+company.ledger.foodBought+(company.ledger.foodLoot??0),'provision accounting');
  check(company.supplies.tools+company.ledger.tools===8+company.ledger.toolsBought+(company.ledger.toolsLoot??0)&&company.supplies.medicine+company.ledger.medicine===5+company.ledger.medicineBought+(company.ledger.medicineLoot??0),'supply accounting');
  check(Array.isArray(company.party)&&(modern?company.party.length<=definition.size:company.party.length===definition.size)&&company.party.every((p,i)=>modern?Array.from({length:definition.size},(_,j)=>`${company.id}-${j+1}`).includes(p?.id):p?.id===`${company.id}-${i+1}`),'roster');
  if(modern){check(company.targetCampId===null||context.campId(company.targetCampId),'camp destination');check(count(company.lastHuntDay)&&company.lastHuntDay<=world.day,'hunt date');check(company.supplies.ammo+company.ledger.ammoUsed===company.ledger.ammoOpening+company.ledger.ammoLoot+company.ledger.ammoBought,'ammo accounting');}
  company.party=context.validateMembers(company.party,world.day);
  check(Array.isArray(company.inventory)&&company.inventory.length<=128&&company.inventory.every(id=>typeof id==='string'&&id.length<=16000&&context.getItem(id)),'stash');
  check(Array.isArray(company.inventoryCondition)&&company.inventoryCondition.length===company.inventory.length&&company.inventoryCondition.every((n,i)=>context.itemCondition(company.inventory[i])===null?n===null:count(n)&&n<=context.itemCondition(company.inventory[i])),'stash condition');
  check(keys(company.cargo,[]),'cargo');
  check((company.status==='dissolved')===(company.unpaidDays===3||company.hungryDays===3||modern&&!company.party.length),'dissolution');
 }
 if(modern)validateCombatRecords(result,world,context,check,count);
 return result;
}


function validateCombatRecords(record,world,context,check,count){
 const now=nowOf(world),companies=new Set(),camps=new Set();
 check(Array.isArray(record.jobs)&&record.jobs.length<=3,'combat jobs');
 for(const job of record.jobs){
  check(keys(job,['companyId','encounterId','generation','startedHour','endHour','source','checkpoint'])&&definitions.has(job.companyId)&&context.campId(job.encounterId)&&!companies.has(job.companyId)&&!camps.has(job.encounterId),'combat ownership');companies.add(job.companyId);camps.add(job.encounterId);
  check(Number.isFinite(job.startedHour)&&job.startedHour>=0&&job.startedHour<=now&&job.startedHour%24>=6&&job.startedHour%24<=14&&Math.abs(job.startedHour*4-Math.round(job.startedHour*4))<1e-7&&job.endHour===job.startedHour+6&&now<=job.endHour&&count(job.generation),'combat clock');
  check(job.source?.rivalCompanies?.version===2&&job.source.rivalCompanies.jobs.length===0&&JSON.stringify(job.source).length<=300000&&nowOf(job.source)===job.startedHour,'combat source');
  job.source=context.validateWorld(job.source);
  const initial=job.source.rivalCompanies.companies.find(c=>c.id===job.companyId),owner=record.companies.find(c=>c.id===job.companyId),camp=context.camps(job.source).find(c=>c.id===job.encounterId);
  check(owner.status!=='dissolved'&&owner.lastHuntDay===world.day&&camp&&!camp.cleared&&camp.generation===job.generation&&Math.hypot(owner.position.x-camp.x,owner.position.y-camp.y)<=context.radius,'combat contact');
  for(const key of ['party','position','gold','food','supplies','inventory','inventoryCondition','cargo'])check(JSON.stringify(owner[key])===JSON.stringify(initial[key]),'frozen combat participants');
  check(!world.battle||world.battle.campId!==job.encounterId,'player combat conflict');check(!context.contracts(world).some(c=>c.campId===job.encounterId),'accepted contract conflict');
  if(job.checkpoint!==null){check(JSON.stringify(job.checkpoint).length<=750000,'checkpoint size');check(job.checkpoint.world?.rivalCompanies?.jobs?.length===0&&JSON.stringify(job.checkpoint.world)===JSON.stringify(job.source),'checkpoint source');job.checkpoint=context.checkpoint(job.checkpoint);check(job.checkpoint.companyId===job.companyId&&job.checkpoint.encounterId===job.encounterId,'checkpoint owner');}
 }
 check(Array.isArray(record.reports)&&record.reports.length<=12,'combat reports');
 for(const report of record.reports)check(keys(report,['companyId','encounterId','outcome','losses','gold','hour'])&&definitions.has(report.companyId)&&context.campId(report.encounterId)&&['victory','defeat','retreat'].includes(report.outcome)&&count(report.losses)&&report.losses<=8&&Number.isSafeInteger(report.gold)&&report.gold>=0&&report.gold<=1e9&&Number.isFinite(report.hour)&&report.hour>=0&&report.hour<=now,'combat report');
 check(record.campWear&&typeof record.campWear==='object'&&!Array.isArray(record.campWear)&&Object.keys(record.campWear).length<=64,'camp wear');
 for(const [id,wear]of Object.entries(record.campWear)){
  check(context.campId(id)&&keys(wear,['generation','units'])&&count(wear.generation)&&Array.isArray(wear.units)&&wear.units.length>0&&wear.units.length<=20&&new Set(wear.units.map(u=>u.index)).size===wear.units.length,'camp wear identities');
  for(const unit of wear.units)check(keys(unit,['index','hp','bodyArmor','headArmor','shieldDurability','reserveShieldDurability','attachmentArmor','morale','injuries'])&&Object.entries(unit).every(([key,value])=>key==='injuries'?context.injuries(value,world.day):count(value))&&unit.index<20&&unit.hp>0&&unit.hp<=10000&&unit.bodyArmor<=10000&&unit.headArmor<=10000&&unit.shieldDurability<=10000&&unit.reserveShieldDurability<=10000&&unit.attachmentArmor<=10000&&unit.morale<=100,'camp wear values');
 }
}
