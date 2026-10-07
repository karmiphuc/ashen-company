import { DLC_ITEMS } from './dlc-items.js';
import { NORTHERN_ITEMS } from './northern-items.js';
// Set membership belongs to the original item design, never to transferred affixes.
const armorDesigns=[...DLC_ITEMS,...NORTHERN_ITEMS].filter(i=>['armor','helmet'].includes(i.slot));
const family=(id,name,since,pairing,items)=>Object.freeze({id,name,since,pairing,armorIds:Object.freeze(items.filter(i=>i.slot==='armor').map(i=>i.id)),helmetIds:Object.freeze(items.filter(i=>i.slot==='helmet').map(i=>i.id)),armorPct:15,bodyFatiguePct:15,headFatiguePct:10});
export const EQUIPMENT_SETS=Object.freeze([
 family('assassin','Assassin',1,'Wear Assassin’s Robe with Assassin’s Face Mask or Assassin’s Head Wrap.',armorDesigns.filter(i=>['bb-assassin-robe','bb-assassin-face-mask','bb-assassin-head-wrap'].includes(i.id))),
 family('ancient','Ancient',2,'Wear any ancient body armor with any ancient helmet or headpiece.',armorDesigns.filter(i=>i.id.startsWith('bb-ancient-'))),
 family('northern','Northern / Barbarian',2,'Wear any northern or barbarian body armor with any northern or barbarian helmet or headpiece.',[
  ...armorDesigns.filter(i=>i.id.startsWith('northern-')||i.collection==='warriors-of-the-north'&&!i.id.includes('cultist')||/^bb-(?:named-)?nordic-/.test(i.id)),
  {id:'barbarian-helmet',slot:'helmet'},
 ]),
]);
export function equipmentSetBonusText(set){return `${set.name} set: +${set.armorPct}% head/body armor; −${set.headFatiguePct}% helmet fatigue, −${set.bodyFatiguePct}% body fatigue`;}
const designId=item=>item?.baseId??item?.id;
export function equipmentSetForItem(item){return EQUIPMENT_SETS.find(s=>[...s.armorIds,...s.helmetIds].includes(designId(item)))??null;}
export function equipmentSetStatus(actor,getItem,rulesVersion=2){
 const armor=designId(getItem(actor.equipment?.armor)),helmet=designId(getItem(actor.equipment?.helmet));
 const set=EQUIPMENT_SETS.find(s=>s.since<=rulesVersion&&(s.armorIds.includes(armor)||s.helmetIds.includes(helmet)));if(!set)return null;
 const body=set.armorIds.includes(armor),head=set.helmetIds.includes(helmet);
 return {set,count:Number(body)+Number(head),active:body&&head&&(!actor.side||actor.setArmor?.id===set.id),body,head};
}
export function effectiveArmorFatigue(actor,getItem){
 const status=equipmentSetStatus(actor,getItem),set=status?.active?status.set:null;
 const body=getItem(actor.equipment?.armor)?.fatigue??0,head=getItem(actor.equipment?.helmet)?.fatigue??0;
 // Match named-gear fatigue rounding. Never produce negative loads.
 return {body:set?Math.max(0,Math.round(body*(100-set.bodyFatiguePct)/100)):body,head:set?Math.max(0,Math.round(head*(100-set.headFatiguePct)/100)):head};
}
export function createSetArmorSnapshot(actor,getItem,condition={},rulesVersion=2){
 // Battle initialization supplies the raw worn condition before it gains protection.
 const status=equipmentSetStatus({equipment:actor.equipment},getItem,rulesVersion);if(!status?.active)return null;
 const pool=(slot,key)=>{
  const baseMax=getItem(actor.equipment?.[slot])?.armor??0,baseCurrent=condition[key]??baseMax;
  const effectiveMax=Math.floor(baseMax*(100+status.set.armorPct)/100);
  return {baseMax,baseCurrent,effectiveMax,initial:baseMax?Math.floor(baseCurrent*effectiveMax/baseMax):0};
 };
 return {id:status.set.id,body:pool('armor','body'),head:pool('helmet','head')};
}
export function baseArmorCondition(unit,key){
 const current=unit[key==='body'?'bodyArmor':'headArmor'],pool=unit.setArmor?.[key];if(!pool)return current;
 // Convert only actual damage, preserving zero-damage round trips exactly.
 // Rounding wear up prevents entry/retreat or set swapping from repairing armor.
 const damage=Math.max(0,pool.initial-current);
 return Math.max(0,pool.baseCurrent-(pool.effectiveMax?Math.ceil(damage*pool.baseMax/pool.effectiveMax):0));
}
export function validSetArmorSnapshot(unit,getItem,rulesVersion=2){
 const a=unit.setArmor;if(!a||Object.keys(a).sort().join(',')!=='body,head,id')return false;
 for(const key of ['body','head']){
  const p=a[key];if(!p||Object.keys(p).sort().join(',')!=='baseCurrent,baseMax,effectiveMax,initial'||Object.values(p).some(n=>!Number.isSafeInteger(n)||n<0)||p.baseCurrent>p.baseMax||unit[key==='body'?'bodyArmor':'headArmor']>p.initial)return false;
 }
 const expected=createSetArmorSnapshot(unit,getItem,{body:a.body.baseCurrent,head:a.head.baseCurrent},rulesVersion);
 return expected&&a.id===expected.id&&['body','head'].every(key=>Object.keys(expected[key]).every(field=>expected[key][field]===a[key][field]));
}
