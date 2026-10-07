import { DLC_ITEMS } from './dlc-items.js';
import { NORTHERN_ITEMS } from './northern-items.js';
import { ADDITIONAL_ITEMS } from './additional-items.js';
import { FANTASY_ITEMS } from './fantasy-items.js';
// Set membership belongs to the original item design, never to transferred affixes.
const armorDesigns=[...DLC_ITEMS,...NORTHERN_ITEMS,...ADDITIONAL_ITEMS,...FANTASY_ITEMS].filter(i=>['armor','helmet'].includes(i.slot));
export const EQUIPMENT_SET_RULES_VERSION=6;
export const isEquipmentSetRulesVersion=version=>Number.isInteger(version)&&version>=1&&version<=EQUIPMENT_SET_RULES_VERSION;
const family=(id,name,since,pairing,items)=>Object.freeze({id,name,since,pairing,armorIds:Object.freeze(items.filter(i=>i.slot==='armor').map(i=>i.id)),helmetIds:Object.freeze(items.filter(i=>i.slot==='helmet').map(i=>i.id)),armorPct:15,bodyFatiguePct:15,headFatiguePct:10});
const historicalSets=Object.freeze([
 family('assassin','Assassin',1,'Wear Assassin’s Robe with Assassin’s Face Mask or Assassin’s Head Wrap.',armorDesigns.filter(i=>['bb-assassin-robe','bb-assassin-face-mask','bb-assassin-head-wrap'].includes(i.id))),
 family('ancient','Ancient',2,'Wear any ancient body armor with any ancient helmet or headpiece.',armorDesigns.filter(i=>i.id.startsWith('bb-ancient-'))),
 family('northern','Northern / Barbarian',2,'Wear any northern or barbarian body armor with any northern or barbarian helmet or headpiece.',[
  ...armorDesigns.filter(i=>i.id.startsWith('northern-')||i.collection==='warriors-of-the-north'&&!i.id.includes('cultist')||/^bb-(?:named-)?nordic-/.test(i.id)),
  {id:'barbarian-helmet',slot:'helmet'},
 ]),
 family('southern','Southern',3,'Wear any southern body armor with any southern helmet or head wrap. Assassin pieces also match Southern gear.',armorDesigns.filter(i=>i.collection==='blazing-deserts'||['leather-lamellar','nomad-robe','southern-mail','nomad-head-wrap','southern-helmet','southern-turban'].includes(i.id))),
 family('noble','Noble',3,'Wear noble or heraldic body gear with noble, heraldic, or knightly headgear.',[
  ...armorDesigns.filter(i=>/^bb-(?:named-)?(?:noble|heraldic)-/.test(i.id)||['noble-mail','noble-tabard','sallet','full-helm','bb-full-helm','bb-adorned-full-helm','bb-bascinet-with-mail','bb-sallet-green-helmet','bb-sallet-helmet'].includes(i.id)),
  {id:'bascinet',slot:'helmet'},
 ]),
]);
// Keep old memberships exclusively for battles saved under earlier rules.
export const EQUIPMENT_SETS=Object.freeze([
 ...historicalSets.filter(s=>s.id!=='southern'),
 family('ninja','Ninja',4,'Wear Ninja Suit or Elite Ninja Suit with Ninja Mask or Elite Ninja Mask.',armorDesigns.filter(i=>['samurai-ninja-suit','samurai-elite-ninja-suit','samurai-ninja-mask','samurai-elite-ninja-mask'].includes(i.id))),
 family('golden-scale','Golden Scale',4,'Wear Golden Scale Armor with Gold and Black Turban.',armorDesigns.filter(i=>['bb-golden-scale-armor','bb-gold-and-black-turban'].includes(i.id))),
 family('golden-lamellar','Golden Lamellar',4,'Wear Golden Lamellar Armor with Heavy Lamellar Helmet.',armorDesigns.filter(i=>['bb-named-golden-lamellar-armor','bb-heavy-lamellar-helmet'].includes(i.id))),
 family('adorned','Adorned',5,'Wear Adorned Mail Shirt, Adorned Warrior’s Armor or Adorned Heavy Mail Hauberk with Adorned Closed Flat Top or Adorned Full Helm.',armorDesigns.filter(i=>['bb-adorned-mail-shirt','bb-adorned-warriors-armor','bb-adorned-heavy-mail-hauberk','bb-adorned-closed-flat-top-with-mail','bb-adorned-full-helm'].includes(i.id))),
 family('samurai','Samurai',5,'Wear Samurai Armor with Samurai Helmet.',armorDesigns.filter(i=>['samurai-wushi-armor','samurai-helmet'].includes(i.id))),
 family('tycoon','Tycoon',5,'Wear Tycoon Armor with Tycoon Helmet.',armorDesigns.filter(i=>['samurai-tycoon-armor','samurai-tycoon-helmet'].includes(i.id))),
 family("basic-mail","Basic Mail",6,"Wear Basic Mail Shirt or Patched Mail Shirt with Mail Coif.",armorDesigns.filter(i=>["bb-basic-mail-shirt", "bb-patched-mail-shirt", "bb-mail-coif", "mail-coif"].includes(i.id))),
 family("field-mail","Field Mail",6,"Wear Mail Shirt with Reinforced Mail Coif or Mail Coif.",[...armorDesigns.filter(i=>["bb-mail-shirt", "bb-reinforced-mail-coif", "bb-mail-coif", "mail-coif"].includes(i.id)),{id:'mail-shirt',slot:'armor'}]),
 family("hauberk","Hauberk",6,"Wear Mail Hauberk or Sleeveless Hauberk with Closed Mail Coif.",armorDesigns.filter(i=>["bb-mail-hauberk", "sleeveless-hauberk", "bb-closed-mail-coif"].includes(i.id))),
 family("black-gold","Black & Gold",6,"Wear Black And Gold Armor with Golden Feathers Helmet.",armorDesigns.filter(i=>["bb-black-and-gold-armor", "bb-golden-feathers-helmet"].includes(i.id))),
 family("green-plate","Green Plate",6,"Wear Green Coat Of Plates Armor with Sallet Green Helmet.",armorDesigns.filter(i=>["bb-green-coat-of-plates-armor", "bb-sallet-green-helmet"].includes(i.id))),
 family("heraldic-knight","Heraldic Knight",6,"Wear Heraldic Hauberk with Decorated Full Helm.",armorDesigns.filter(i=>["bb-heraldic-armor", "bb-faction-helm"].includes(i.id))),
 family("wokou","Wokou",6,"Wear Wokou Light Armor with Kasa.",armorDesigns.filter(i=>["fantasy-wokou-armor", "fantasy-kasa"].includes(i.id))),
 family("ronin","Ronin",6,"Wear Ronin Clothes with Kasa or Ronin Hat.",armorDesigns.filter(i=>["samurai-ronin-clothes", "fantasy-kasa", "samurai-ronin-hat"].includes(i.id))),
]);
export const equipmentSetsForRules=version=>(version<4?historicalSets:EQUIPMENT_SETS).filter(s=>s.since<=version);
export function equipmentSetBonusText(set){return `${set.name} set: +${set.armorPct}% head/body armor; −${set.headFatiguePct}% helmet fatigue, −${set.bodyFatiguePct}% body fatigue`;}
const designId=item=>item?.restorationSourceId??item?.baseId??item?.id;
export function equipmentSetsForItem(item){return EQUIPMENT_SETS.filter(s=>[...s.armorIds,...s.helmetIds].includes(designId(item)));}
export function equipmentSetForItem(item){return equipmentSetsForItem(item)[0]??null;}
export function equipmentSetStatus(actor,getItem,rulesVersion){
 const armor=designId(getItem(actor.equipment?.armor)),helmet=designId(getItem(actor.equipment?.helmet));
 // Prefer a complete pair; otherwise guide toward the worn body armor’s companion.
 // Apply one bonus only.
 // Saved units retain their snapshot family, including the retired broad Southern set.
 const sets=rulesVersion===undefined&&actor.side&&actor.setArmor
  ? [...EQUIPMENT_SETS,...historicalSets].filter(s=>s.id===actor.setArmor.id)
  : equipmentSetsForRules(rulesVersion??EQUIPMENT_SET_RULES_VERSION);
 const set=sets.find(s=>s.armorIds.includes(armor)&&s.helmetIds.includes(helmet))??sets.find(s=>s.armorIds.includes(armor))??sets.find(s=>s.helmetIds.includes(helmet));if(!set)return null;
 const body=set.armorIds.includes(armor),head=set.helmetIds.includes(helmet);
 return {set,count:Number(body)+Number(head),active:body&&head&&(!actor.side||actor.setArmor?.id===set.id),body,head};
}
export function effectiveArmorFatigue(actor,getItem){
 const status=equipmentSetStatus(actor,getItem),set=status?.active?status.set:null;
 const body=getItem(actor.equipment?.armor)?.fatigue??0,head=getItem(actor.equipment?.helmet)?.fatigue??0;
 // Match named-gear fatigue rounding. Never produce negative loads.
 return {body:set?Math.max(0,Math.round(body*(100-set.bodyFatiguePct)/100)):body,head:set?Math.max(0,Math.round(head*(100-set.headFatiguePct)/100)):head};
}
export function createSetArmorSnapshot(actor,getItem,condition={},rulesVersion=EQUIPMENT_SET_RULES_VERSION){
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
export function validSetArmorSnapshot(unit,getItem,rulesVersion=EQUIPMENT_SET_RULES_VERSION){
 const a=unit.setArmor;if(!a||Object.keys(a).sort().join(',')!=='body,head,id')return false;
 for(const key of ['body','head']){
  const p=a[key];if(!p||Object.keys(p).sort().join(',')!=='baseCurrent,baseMax,effectiveMax,initial'||Object.values(p).some(n=>!Number.isSafeInteger(n)||n<0)||p.baseCurrent>p.baseMax||unit[key==='body'?'bodyArmor':'headArmor']>p.initial)return false;
 }
 const expected=createSetArmorSnapshot(unit,getItem,{body:a.body.baseCurrent,head:a.head.baseCurrent},rulesVersion);
 return expected&&a.id===expected.id&&['body','head'].every(key=>Object.keys(expected[key]).every(field=>expected[key][field]===a[key][field]));
}
