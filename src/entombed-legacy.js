import {equipmentBoost} from './item-affixes.js';
// Three owned loadouts, released by three independent tomb side quests.
export const LEGACY_SET_SLOTS = Object.freeze(['helmet','armor','attachment','attachment2','mount','weapon','shield']);
export const LEGACY_TOMB_STAGES = Object.freeze([
 {name:'The First Fallen',townId:'oakwatch',day:15,renown:75,size:4,objective:'Reach day 15 and 75 renown. Defeat the First Fallen’s mounted guardians, then report to Oakwatch to unveil set I.'},
 {name:'The Silent Procession',townId:'ironford',day:30,renown:150,size:6,objective:'Reach day 30 and 150 renown. Defeat the Silent Procession, then report to Ironford to unveil set II.'},
 {name:'The Last Cavalcade',townId:'ravenfell',day:60,renown:300,size:9,objective:'Reach day 60 and 300 renown. Defeat six undead cavalry guards and three entombed elites wearing your exact three sets. Report to Ravenfell to unveil set III.'},
]);
export function initialEntombedLegacy(source,sets,generation){
 return {version:3,generation,source:{...source},sets:structuredClone(sets),stage:1,defeated:false,guards:null};
}
export function tombReady(state){const l=state.companyLegacy,q=LEGACY_TOMB_STAGES[l?.stage-1];return Boolean(l?.version===3&&q&&state.day>=q.day&&state.renown>=q.renown);}
export function validateEntombedLegacy(input,{getItem,itemCondition,now}){
 const check=(ok,label)=>{if(!ok)throw new TypeError(`Invalid company legacy: ${label}`);};
 const count=n=>Number.isSafeInteger(n)&&n>=0;
 const keys=(v,k)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===k.length&&k.every(x=>Object.hasOwn(v,x));
 check(keys(input,['version','generation','source','sets','stage','defeated','guards'])&&input.version===3,'tomb fields');
 check(count(input.generation)&&input.generation>=1&&input.generation<=1000000,'generation');
 check(keys(input.source,['seed','day','renown'])&&count(input.source.seed)&&input.source.seed<=0xffffffff&&count(input.source.day)&&input.source.day>=1&&input.source.day<=1000000&&count(input.source.renown)&&input.source.renown<=1000000,'source');
 check(Array.isArray(input.sets)&&input.sets.length===3,'three sets');
 for(const set of input.sets){
  check(keys(set,LEGACY_SET_SLOTS),'loadout slots');
  for(const slot of LEGACY_SET_SLOTS){const entry=set[slot];if(entry===null){check(['attachment','attachment2','shield'].includes(slot),'required gear');continue;}
   check(keys(entry,['itemId','condition'])&&typeof entry.itemId==='string'&&entry.itemId.length<=16000,'gear fields');
   const item=getItem(entry.itemId);check(item?.slot===(slot==='attachment2'?'attachment':slot),'gear slot');
   const max=itemCondition(entry.itemId);check(max===null?entry.condition===null:count(entry.condition)&&entry.condition<=max,'gear condition');
  }
  const weapon=getItem(set.weapon.itemId);check(!weapon.ranged&&!weapon.throwing,'melee weapon');
  check(weapon.twoHanded?set.shield===null:set.shield!==null,'weapon and shield');
  check(!set.attachment2||set.attachment,'second attachment');
 }
 check(Number.isInteger(input.stage)&&input.stage>=1&&input.stage<=4&&typeof input.defeated==='boolean','tomb stage');
 check(input.stage!==4||!input.defeated&&input.guards===null,'completed tomb');
 const earned=input.stage===4?3:input.stage-1;
 check(!earned||now>=24*(LEGACY_TOMB_STAGES[earned-1].day-1),'premature unveiling');
 check(input.guards===null||Array.isArray(input.guards)&&input.stage<=3&&input.guards.length>0&&input.guards.length<=LEGACY_TOMB_STAGES[input.stage-1].size,'guard roster');
 if(input.guards){const ids=new Set();for(const guard of input.guards){
  check(keys(guard,['index','hp','bodyArmor','headArmor','attachmentArmor','attachment2Armor','shieldDurability'])&&count(guard.index)&&guard.index<LEGACY_TOMB_STAGES[input.stage-1].size&&!ids.has(guard.index),'guard identity');ids.add(guard.index);
  check(count(guard.hp)&&guard.hp>=1&&guard.hp<=300&&['bodyArmor','headArmor','attachmentArmor','attachment2Armor','shieldDurability'].every(k=>count(guard[k])&&guard[k]<=10000),'guard wear');
 }}
 check(!input.defeated||input.guards===null,'defeated guards');
 check(!input.defeated||now>=24*(LEGACY_TOMB_STAGES[input.stage-1].day-1),'premature tomb victory');
 if(input.guards)for(const guard of input.guards){const gear=tombGuardOutfit(input,guard.index);
  check(guard.hp<=tombGuardHealth(input,guard.index,getItem),'guard health');
  for(const [key,slot] of [['bodyArmor','armor'],['headArmor','helmet'],['attachmentArmor','attachment'],['attachment2Armor','attachment2'],['shieldDurability','shield']])check(guard[key]<=(gear[slot]?itemCondition(gear[slot])??0:0),'guard condition');
 }
 return structuredClone(input);
}

export function tombGuardOutfit(legacy,index){
 const elite=legacy.stage===3&&index<3,set=elite?legacy.sets[index]:legacy.stage<3&&index===0?legacy.sets[legacy.stage-1]:null;
 const gear=set?Object.fromEntries(LEGACY_SET_SLOTS.map(slot=>[slot,set[slot]?.itemId??null])):{helmet:'bb-ancient-legionary-helmet',armor:'bb-ancient-mail',attachment:null,attachment2:null,mount:'war-horse',weapon:'arming-sword',shield:'heater-shield'};
 return {name:elite?`Entombed Legend ${['I','II','III'][index]}`:index===0?'Fallen Tomb Warden':'Undead Cavalry Guard',...gear,troopIndex:index,...(set?{entombedSet:set}:{}),savedDamage:legacy.guards?.find(g=>g.index===index)??null};
}
export const tombRank=stage=>[1,3,5][stage-1];
export function tombGuardHealth(legacy,index,getItem){const gear=tombGuardOutfit(legacy,index),equipment=Object.fromEntries(LEGACY_SET_SLOTS.map(slot=>[slot,gear[slot]]));return Math.min(300,Math.round((61+tombRank(legacy.stage)*8+(index===0?12:0)+Object.values(equipment).reduce((sum,id)=>sum+(getItem(id)?.statBonuses?.maxHp??0),0))*(1+equipmentBoost({equipment},'healthPct',getItem)/100)));}
