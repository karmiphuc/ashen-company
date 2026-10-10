import { moveWorldToward, worldPointInBounds, worldBlocked } from './world-navigation.js';
import { defaultRetinue } from './retinue.js';

// Fixed endgame arrivals, independent of the player's strength or possessions.
export const RIVAL_DEFINITIONS = Object.freeze([
 {id:'gilded-road',name:'Gilded Road',crest:'◇',color:'#ddbd65',identity:'Contract specialists',homes:['oakwatch','greyhaven','stonebridge'],size:6,level:3,gold:12000},
 {id:'red-jackals',name:'Red Jackals',crest:'⚒',color:'#d78068',identity:'Camp hunters',homes:['ironford','highpass','ravenfell'],size:7,level:4,gold:9000},
 {id:'bronze-oath',name:'Bronze Oath',crest:'♜',color:'#9db7ce',identity:'Faction-backed veterans',homes:['ambercross','windrest','kargan'],size:8,level:5,gold:16000},
].map(d=>Object.freeze({...d,homes:Object.freeze(d.homes)})));
const definitions=new Map(RIVAL_DEFINITIONS.map(d=>[d.id,d]));
const nowOf=state=>(state.day-1)*24+state.hour;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ledgerKeys=['wages','provisions','purchases','tools','medicine','foodBought','toolsBought','medicineBought'];
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
 const purchase=(offer,needed,buy)=>{const quantity=Math.min(100,offer.stock,needed,Math.max(0,Math.floor((view.gold-reserve)/offer.buyPrice)));if(quantity>0){const before=view.gold,foodBefore=view.food,toolsBefore=view.supplies.tools,medicineBefore=view.supplies.medicine;if(buy(quantity).ok){company.ledger.purchases+=before-view.gold;company.ledger.foodBought+=view.food-foodBefore;company.ledger.toolsBought+=view.supplies.tools-toolsBefore;company.ledger.medicineBought+=view.supplies.medicine-medicineBefore;}}};
 purchase(market.food,Math.max(0,foodTarget-view.food),quantity=>context.buyFood(view,quantity));
 const wounded=company.party.some(p=>p.hp<context.stats(p).maxHp||p.injuries.length);
 const damaged=company.party.some(p=>Object.entries(p.armorDurability).some(([part,value])=>value<({body:context.itemCondition(p.equipment.armor),head:context.itemCondition(p.equipment.helmet),attachment:context.itemCondition(p.equipment.attachment),attachment2:context.itemCondition(p.equipment.attachment2),shield:context.itemCondition(p.equipment.shield),reserveShield:context.itemCondition(p.reserveEquipment.shield)}[part]??0)));
 for(const [kind,target] of [['medicine',wounded?5:0],['tools',damaged?8:0]]){const offer=market.supplies.find(s=>s.kind===kind);purchase(offer,Math.max(0,target-view.supplies[kind]),quantity=>context.buySupplies(view,kind,quantity));}
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
 if(world.rivalCompanies===undefined){if(world.ashenWinter?.phase!=='completed')return;world.rivalCompanies={version:1,startedHour:now,lastHour:now,companies:RIVAL_DEFINITIONS.map(d=>startingCompany(world,d,context))};return;}
 const record=world.rivalCompanies,elapsed=now-record.lastHour;if(elapsed<=1e-9)return;
 // Caller advances on the existing quarter-hour world schedule; never catch up a forged backlog.
 if(elapsed>.2500001)throw new TypeError('Invalid rival simulation clock');
 const midnight=Math.floor(now/24)>Math.floor(record.lastHour/24);
 for(const company of record.companies){
  if(company.status==='dissolved')continue;
  if(midnight)nightly(world,company,context,now);
  if(company.status==='dissolved')continue;
  let target=context.settlements.find(t=>t.id===company.targetTownId);
  if(company.status==='resting'){
   if(distance(company.position,target)<=1e-7)shop(world,company,context,now);
   if(now+1e-9<company.restUntil)continue;
   const view=facade(world,company,now),before=supplySnapshot(company);context.rest(view);retain(company,view,before);
   company.status='travelling';nextDestination(company,context);company.restUntil=now+6;
   if(company.status==='resting')continue;
   target=context.settlements.find(t=>t.id===company.targetTownId);
  }
  if(!context.servicesAvailable(target.id)){nextDestination(company,context);if(company.status==='resting'){company.restUntil=now+6;continue;}target=context.settlements.find(t=>t.id===company.targetTownId);}
  // Price and speed use the start of the step, exactly as player travel does.
  const view=facade(world,company,record.lastHour);
  if(moveWorldToward(company.position,target,context.travelSpeed(view)*elapsed)){company.status='resting';company.restUntil=now+6;shop(world,company,context,now);}
 }
 record.lastHour=now;
}
export function rivalCompanyMarkers(world){
 return (world.rivalCompanies?.companies??[]).map(company=>{const definition=definitions.get(company.id);return {id:`rival:${company.id}`,kind:'rival',name:definition.name,crest:definition.crest,color:definition.color,x:company.position.x,y:company.position.y,active:company.status!=='dissolved',size:company.party.length};});
}
export function rivalCompanySites(world,context){
 return (world.rivalCompanies?.companies??[]).map(company=>{
  const definition=definitions.get(company.id),view=facade(world,company),target=context.settlements.find(t=>t.id===company.targetTownId),food=context.food(view),wages=company.party.reduce((sum,p)=>sum+context.stats(p).dailyWage,0);
  return {id:`rival:${company.id}`,kind:'rival',name:definition.name,crest:definition.crest,color:definition.color,identity:definition.identity,x:company.position.x,y:company.position.y,active:company.status!=='dissolved',activity:company.status==='travelling'?`Travelling to ${target.name}`:company.status==='dissolved'?'Company dissolved':'Resting and provisioning',targetTownId:target.id,party:company.party,gold:company.gold,food:company.food,supplies:company.supplies,ledger:company.ledger,dailyWages:wages,dailyFood:food,unpaidDays:company.unpaidDays,hungryDays:company.hungryDays,playerRelation:'neutral'};
 });
}
const keys=(object,expected)=>object&&typeof object==='object'&&!Array.isArray(object)&&Object.keys(object).length===expected.length&&expected.every(k=>Object.hasOwn(object,k));
export function validateRivalCompanies(input,world,context){
 if(input===undefined)return undefined;
 const check=(ok,label)=>{if(!ok)throw new TypeError(`Invalid rival companies: ${label}`);},count=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000,time=n=>Number.isFinite(n)&&n>=0&&n<=nowOf(world),point=p=>keys(p,['x','y'])&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&worldPointInBounds(p)&&!worldBlocked(p);
 check(keys(input,['version','startedHour','lastHour','companies'])&&input.version===1,'version/fields');
 check(world.ashenWinter?.phase==='completed'&&time(input.startedHour)&&time(input.lastHour)&&input.lastHour>=input.startedHour&&[input.startedHour,input.lastHour].every(n=>Math.abs(n*4-Math.round(n*4))<1e-7)&&nowOf(world)-input.lastHour<.2500001,'clock/activation');
 check(Array.isArray(input.companies)&&input.companies.length===3&&input.companies.every((c,i)=>c?.id===RIVAL_DEFINITIONS[i].id),'identities');
 const result=structuredClone(input);
 for(const company of result.companies){
  check(keys(company,companyKeys),'company fields');
  const definition=definitions.get(company.id);
  check(point(company.position)&&definition.homes.includes(company.targetTownId),'position/route');
  check(['resting','travelling','dissolved'].includes(company.status)&&Number.isFinite(company.restUntil)&&company.restUntil>=0&&company.restUntil<=input.lastHour+6.0000001,'rest state');
  check(Number.isInteger(company.routeIndex)&&company.routeIndex>=0&&company.routeIndex<definition.homes.length&&company.targetTownId===definition.homes[company.routeIndex],'route index');
  check(count(company.lastShopDay)&&company.lastShopDay<=world.day&&count(company.gold)&&count(company.food)&&count(company.unpaidDays)&&company.unpaidDays<=3&&count(company.hungryDays)&&company.hungryDays<=3,'resources');
  check(keys(company.supplies,['tools','medicine','ammo'])&&Object.values(company.supplies).every(n=>count(n)&&n<=10000),'supplies');
  check(keys(company.ledger,ledgerKeys)&&Object.values(company.ledger).every(count),'ledger');
  check(company.ledger.purchases>=company.ledger.foodBought*2+company.ledger.toolsBought+company.ledger.medicineBought,'purchase accounting');
  check(company.gold+company.ledger.wages+company.ledger.purchases===definition.gold,'treasury accounting');
  check(company.food+company.ledger.provisions===definition.size*3+company.ledger.foodBought,'provision accounting');
  check(company.supplies.tools+company.ledger.tools===8+company.ledger.toolsBought&&company.supplies.medicine+company.ledger.medicine===5+company.ledger.medicineBought,'supply accounting');
  check(Array.isArray(company.party)&&company.party.length===definition.size&&company.party.every((p,i)=>p?.id===`${company.id}-${i+1}`),'roster');
  company.party=context.validateMembers(company.party,world.day);
  check(Array.isArray(company.inventory)&&company.inventory.length<=128&&company.inventory.every(id=>typeof id==='string'&&id.length<=16000&&context.getItem(id)),'stash');
  check(Array.isArray(company.inventoryCondition)&&company.inventoryCondition.length===company.inventory.length&&company.inventoryCondition.every((n,i)=>context.itemCondition(company.inventory[i])===null?n===null:count(n)&&n<=context.itemCondition(company.inventory[i])),'stash condition');
  check(keys(company.cargo,[]),'cargo');
  check((company.status==='dissolved')===(company.unpaidDays===3||company.hungryDays===3),'dissolution');
 }
 return result;
}
