import {rivalSaleableLoot} from './rival-equipment.js';
import {RIVAL_DEFINITIONS} from './rival-definitions.js';
import {rivalStrength} from './rival-goals.js';
import {rivalFightFor} from './rival-world-combat.js';
import {moveWorldToward} from './world-navigation.js';
export const RIVAL_WAR_REASONS=Object.freeze({extortion:'The Jackals demand exclusive hunting grounds and threaten companies that refuse their toll.',competition:'The Gilded Road names your successful company a threat to its livelihood.'});
const clock=w=>(w.day-1)*24+w.hour;
export const rivalOwner=(w,id)=>w.rivalCompanies?.companies.find(c=>`rival:${c.id}`===id);
export const rivalRelation=(w,id)=>w.rivalDiplomacy?.companies[id]?.declaredHour!==null&&w.rivalDiplomacy?.companies[id]?.declaredHour!==undefined?'hostile':'neutral';
export function defaultRivalDiplomacy(){return {version:1,lastCheckDay:0,companies:Object.fromEntries(RIVAL_DEFINITIONS.map(d=>[d.id,{declaredHour:null,reason:null,outlawFaction:null,eliminatedByPlayer:false,bountyClaimed:false,cooldownUntil:0,losses:{gold:0,food:0,tools:0,medicine:0,ammo:0}}]))};}
export function advanceRivalDiplomacy(world,context){
 if(world.rivalCompanies?.version!==2)return;
 world.rivalDiplomacy??=defaultRivalDiplomacy();const record=world.rivalDiplomacy,now=clock(world);
 if(record.lastCheckDay===world.day)return;record.lastCheckDay=world.day;
 for(const company of world.rivalCompanies.companies){
  if(company.status==='dissolved'||rivalFightFor(world,company.id))continue;
  const entry=record.companies[company.id],age=now-world.rivalCompanies.startedHour,level=company.party.reduce((n,p)=>n+p.level,0)/company.party.length;
  if(entry.declaredHour===null&&company.party.length>=5){
   const reason=company.id==='red-jackals'&&age>=14*24&&level>=7&&company.ledger.goldEarned>=6000?'extortion'
    :company.id==='gilded-road'&&age>=28*24&&level>=8&&company.ledger.goldEarned>=10000&&world.renown>=120?'competition':null;
   if(reason){entry.declaredHour=now;entry.reason=reason;context.record(world,`⚔ ${RIVAL_DEFINITIONS.find(d=>d.id===company.id).name} declares war. ${RIVAL_WAR_REASONS[reason]} You may hunt them now; their pursuit begins after one day's warning.`);}
  }
  if(company.id==='red-jackals'&&entry.declaredHour!==null&&!entry.outlawFaction&&company.party.length>=5&&level>=8&&company.ledger.goldEarned>=8000){
   entry.outlawFaction=context.factionAt(company.position).id;
   context.record(world,'⚖ A faction warrant names the seasoned Red Jackals as outlaws. Its settlements can post a hard contract to eliminate the company.');
  }
 }
}
export function rivalHuntsPlayer(world,company,context){
 const entry=world.rivalDiplomacy?.companies[company.id];
 return company.status==='travelling'&&!rivalSaleableLoot(company,context)&&clock(world)%24>=6&&clock(world)%24<20&&rivalRelation(world,company.id)==='hostile'&&clock(world)>=entry.declaredHour+24&&clock(world)>=entry.cooldownUntil
  &&!rivalFightFor(world,company.id)&&world.pursuit!==`rival:${company.id}`&&!context.sanctuary(world,world.position)&&!context.sanctuary(world,company.position)
  &&Math.hypot(world.position.x-company.position.x,world.position.y-company.position.y)<=180&&company.food>=context.food({...world,party:company.party,retinue:context.retinue()})*2
  &&company.party.every(p=>p.hp>=context.stats(p).maxHp*.65)&&rivalStrength(company,context)>=rivalStrength({party:world.party.filter(p=>p.hp>0)},context)*1.1;
}
export function advanceRivalPlayerPursuit(world,company,context,elapsed){
 if(!rivalHuntsPlayer(world,company,context))return false;
 company.targetCampId=null;
 moveWorldToward(company.position,world.position,context.travelSpeed({...world,position:company.position,party:company.party,food:company.food,gold:company.gold,supplies:company.supplies,retinue:context.retinue(),inventory:company.inventory,cargo:company.cargo})*elapsed);
 return true;
}
export function rivalBountyOffer(world,town,context){
 const company=world.rivalCompanies?.companies.find(c=>c.id==='red-jackals'),entry=world.rivalDiplomacy?.companies['red-jackals'];
 if(!company||company.status==='dissolved'||company.party.length<5||company.party.reduce((n,p)=>n+p.level,0)/company.party.length<8||!entry?.outlawFaction||entry.bountyClaimed||context.factionAt(town).id!==entry.outlawFaction)return null;
 return {type:'rival-bounty',from:town.id,to:town.id,rivalId:company.id,factionId:entry.outlawFaction,reward:Math.min(9000,Math.max(3000,company.party.reduce((n,p)=>n+p.level,0)*100)),renown:3};
}
export function validateRivalDiplomacy(input,world,context){
 if(input===undefined)return undefined;
 const check=(x,label)=>{if(!x)throw new TypeError(`Invalid rival diplomacy: ${label}`);},keys=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===[...k].sort().join(','),count=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9;
 check(world.rivalCompanies?.version===2&&keys(input,['version','lastCheckDay','companies'])&&input.version===1&&count(input.lastCheckDay)&&input.lastCheckDay<=world.day,'record');
 check(keys(input.companies,RIVAL_DEFINITIONS.map(d=>d.id)),'identities');
 for(const [id,entry]of Object.entries(input.companies)){
  check(keys(entry,['declaredHour','reason','outlawFaction','eliminatedByPlayer','bountyClaimed','cooldownUntil','losses']),'fields');
  check(entry.declaredHour===null?entry.reason===null: Number.isFinite(entry.declaredHour)&&['red-jackals','gilded-road'].includes(id)&&entry.declaredHour>=world.rivalCompanies.startedHour&&entry.declaredHour<=clock(world)&&entry.reason===(id==='red-jackals'?'extortion':id==='gilded-road'?'competition':null),'declaration');
  check(entry.outlawFaction===null||id==='red-jackals'&&entry.declaredHour!==null&&context.factions.some(f=>f.id===entry.outlawFaction),'warrant');
  check(typeof entry.eliminatedByPlayer==='boolean'&&typeof entry.bountyClaimed==='boolean'&&(!entry.eliminatedByPlayer||world.rivalCompanies.companies.find(c=>c.id===id).party.length===0)&&(!entry.bountyClaimed||entry.eliminatedByPlayer&&entry.outlawFaction),'completion');
  check(Number.isFinite(entry.cooldownUntil)&&entry.cooldownUntil>=0&&entry.cooldownUntil<=clock(world)+24,'cooldown');
  check(keys(entry.losses,['gold','food','tools','medicine','ammo'])&&Object.values(entry.losses).every(count),'loss accounting');
 }
 return structuredClone(input);
}
