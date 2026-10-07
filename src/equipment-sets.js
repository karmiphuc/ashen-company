// Set membership belongs to the original item design, never to transferred affixes.
export const EQUIPMENT_SETS=Object.freeze([
 Object.freeze({id:'assassin',name:'Assassin',armorIds:Object.freeze(['bb-assassin-robe']),helmetIds:Object.freeze(['bb-assassin-face-mask','bb-assassin-head-wrap']),armorPct:15,bodyFatiguePct:15,headFatiguePct:10}),
]);
const designId=item=>item?.baseId??item?.id;
export function equipmentSetForItem(item){return EQUIPMENT_SETS.find(s=>[...s.armorIds,...s.helmetIds].includes(designId(item)))??null;}
export function equipmentSetStatus(actor,getItem){
 const armor=designId(getItem(actor.equipment?.armor)),helmet=designId(getItem(actor.equipment?.helmet));
 const set=EQUIPMENT_SETS.find(s=>s.armorIds.includes(armor)||s.helmetIds.includes(helmet));if(!set)return null;
 const body=set.armorIds.includes(armor),head=set.helmetIds.includes(helmet);
 return {set,count:Number(body)+Number(head),active:body&&head&&(!actor.side||actor.setArmor?.id===set.id),body,head};
}
export function effectiveArmorFatigue(actor,getItem){
 const status=equipmentSetStatus(actor,getItem),set=status?.active?status.set:null;
 const body=getItem(actor.equipment?.armor)?.fatigue??0,head=getItem(actor.equipment?.helmet)?.fatigue??0;
 // Match named-gear fatigue rounding. Never produce negative loads.
 return {body:set?Math.max(0,Math.round(body*(100-set.bodyFatiguePct)/100)):body,head:set?Math.max(0,Math.round(head*(100-set.headFatiguePct)/100)):head};
}
export function createSetArmorSnapshot(actor,getItem,condition={}){
 // Battle initialization supplies the raw worn condition before it gains protection.
 const status=equipmentSetStatus({equipment:actor.equipment},getItem);if(!status?.active)return null;
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
export function validSetArmorSnapshot(unit,getItem){
 const a=unit.setArmor;if(!a||Object.keys(a).sort().join(',')!=='body,head,id')return false;
 for(const key of ['body','head']){
  const p=a[key];if(!p||Object.keys(p).sort().join(',')!=='baseCurrent,baseMax,effectiveMax,initial'||Object.values(p).some(n=>!Number.isSafeInteger(n)||n<0)||p.baseCurrent>p.baseMax||unit[key==='body'?'bodyArmor':'headArmor']>p.initial)return false;
 }
 const expected=createSetArmorSnapshot(unit,getItem,{body:a.body.baseCurrent,head:a.head.baseCurrent});
 return expected&&a.id===expected.id&&['body','head'].every(key=>Object.keys(expected[key]).every(field=>expected[key][field]===a[key][field]));
}
