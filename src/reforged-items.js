import { PREFIX_EFFECTS, prefixEffectText } from './affix-prefixes.js';
import { perkFlags, flaggedPerks } from './item-affixes.js';
import {weaponTrainingVisual,PERK_BY_ID} from './perks.js';
// Immutable enhancement identities: one bounded, flattened profile per item.
// All modifiers are beneficial increments above the recipient's unrolled base.
export const FORGE_KEYS=Object.freeze(['armorPct','armorFlat','damagePct','damageLow','damageHigh','weight','accuracy','armorDamage','piercing','headChance','range','ammo','shieldDamage','skillFatigue','meleeDefense','rangedDefense','resolve','endurance','shieldMelee','shieldRanged','shieldDurability','meleeSkill','rangedSkill','initiative','maxHp','rangedRange','perkFlags','berserkAp','nimbleBoost','battleForgedBoost',...Object.keys(PREFIX_EFFECTS)]);
export const FORGE_LIMITS=Object.freeze([300,600,200,200,200,80,100,200,100,100,2,15,100,20,80,80,80,80,80,80,500,80,80,80,80,1,1048575,2,1,2,...Object.values(PREFIX_EFFECTS).map(effect=>effect.cap)]);
const armorKeys=new Set(['armorPct','armorFlat','weight','meleeDefense','rangedDefense','resolve','endurance','meleeSkill','rangedSkill','initiative','maxHp','rangedRange','perkFlags','berserkAp','nimbleBoost','battleForgedBoost',...Object.keys(PREFIX_EFFECTS)]);
const shieldKeys=new Set(['weight','skillFatigue','shieldMelee','shieldRanged','shieldDurability','perkFlags','berserkAp','battleForgedBoost',...Object.keys(PREFIX_EFFECTS)]);
const weaponKeys=new Set(['damagePct','damageLow','damageHigh','weight','accuracy','armorDamage','piercing','headChance','range','ammo','shieldDamage','skillFatigue','perkFlags','berserkAp','executionerPct','duelistPct','killMomentumPct','dazeHead','shieldDamagePct','headChancePct','injuryThreshold','volleyDistance','rangedHit','rangedReach','actionPoints']);
export const isNamedItem=item=>['named','famed'].includes(item?.rarity);
export const isForgeSlot=slot=>['weapon','armor','helmet','shield'].includes(slot);
export function forgeBaseline(definition){
 const base={...definition,...definition.sourceStats};
 delete base.bonuses;delete base.signature;delete base.signatureDescription;delete base.enhancementProfile;
 if(definition.sourceArmor!==undefined){base.armor=definition.sourceArmor;base.fatigue=definition.sourceFatigue;delete base.statBonuses;}
 if(definition.id==='bb-fangshire')base.statBonuses={...definition.statBonuses};
 return base;
}
export function normalizeForgeProfile(input,slot){
 const allowed=slot==='weapon'?weaponKeys:slot==='shield'?shieldKeys:armorKeys;
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!FORGE_KEYS.includes(k)))return null;
 const profile={};
 for(let i=0;i<FORGE_KEYS.length;i++){const key=FORGE_KEYS[i],n=input[key]??0;if(!Number.isSafeInteger(n)||n<0||n>FORGE_LIMITS[i]||n&&!allowed.has(key))return null;if(n)profile[key]=n;}
 if((profile.damageLow??0)>(profile.damageHigh??0))return null;
 if(!['armor','helmet'].includes(slot)&&flaggedPerks(profile.perkFlags??0).includes('layered-armor'))return null;
 return profile;
}
export function extractForgeProfile(item,catalog,{shieldMaximum=()=>0,shieldDamage=()=>0}={}){
 if(!isNamedItem(item)||!isForgeSlot(item.slot))return null;
 if(item.forgeProfile)return {...item.forgeProfile};
 const definition=catalog(item.baseId??item.id),base=forgeBaseline(definition),p=item.rollVersion&&!item.id.startsWith('famed:')?{...item.enhancementProfile}:{};
 const diff=(key,a,b)=>{const n=Math.max(0,Math.round((a??0)-(b??0)));if(n)p[key]=n;};
 diff('weight',base.fatigue,item.fatigue);diff('skillFatigue',base.fatigueOnSkillUse,item.fatigueOnSkillUse);
 if(['armor','helmet'].includes(item.slot)){
  if(!p.armorPct)diff('armorFlat',item.armor,base.armor);
  for(const [stat,key] of [['meleeDefense','meleeDefense'],['rangedDefense','rangedDefense'],['resolve','resolve'],['maxFatigue','endurance'],['meleeSkill','meleeSkill'],['rangedSkill','rangedSkill'],['initiative','initiative'],['maxHp','maxHp']])diff(key,item.statBonuses?.[stat],base.statBonuses?.[stat]);
 }else if(item.slot==='shield'){
  diff('shieldMelee',item.defense,base.defense);diff('shieldRanged',item.rangedDefense??item.defense,base.rangedDefense??base.defense);
  diff('shieldDurability',item.unboostedShieldDurability??item.durability??shieldMaximum(item.id),shieldMaximum(definition.id));
 }else{
  if(!p.damagePct){diff('damageLow',item.damageMin,base.damageMin);diff('damageHigh',item.damageMax,base.damageMax);}
  diff('accuracy',item.hitBonus,base.hitBonus);diff('armorDamage',100*(item.armorDamage??1),100*(base.armorDamage??1));
  diff('piercing',100*(item.armorPiercing??.3),100*(base.armorPiercing??.3));diff('headChance',100*(item.headChance??.22),100*(base.headChance??.22));
  diff('range',item.range,base.range);diff('ammo',item.ammoMax??5,base.ammoMax??5);diff('shieldDamage',shieldDamage(item),shieldDamage(base));
 }
 diff('rangedRange',item.rangedRangeBonus,base.rangedRangeBonus);
 if(perkFlags(item.grantedPerks))p.perkFlags=perkFlags(item.grantedPerks);
 for(const [key,field] of [['berserkAp','berserkAp'],['nimbleBoost','nimble'],['battleForgedBoost','battleForged']])diff(key,item.perkBoosts?.[field],base.perkBoosts?.[field]);
 for(const key of Object.keys(PREFIX_EFFECTS))diff(key,item.perkBoosts?.[key],base.perkBoosts?.[key]);
 return normalizeForgeProfile(p,item.slot);
}
function baseShieldDamage(item){if(item.shieldDamage!==undefined)return item.shieldDamage;const visual=weaponTrainingVisual(item)??'';return item.throwing?(visual.includes('axe')?(visual.includes('heavy')?24:18):(visual.includes('heavy')?18:12)):!item.ranged&&['axe','greataxe','hand-axe','longaxe','bardiche','throwingaxe','heavythrowingaxe'].includes(visual)?12:0;}
const labels={armorPct:'Protection',armorFlat:'Protection',damagePct:'Damage',damageLow:'Minimum damage',damageHigh:'Maximum damage',weight:'Fatigue relief',accuracy:'Accuracy',armorDamage:'Armor damage',piercing:'Armor penetration',headChance:'Head hit chance',range:'Ranged reach',ammo:'Throwing capacity',shieldDamage:'Shield damage',skillFatigue:'Skill fatigue relief',meleeDefense:'Melee defense',rangedDefense:'Ranged defense',resolve:'Resolve',endurance:'Maximum fatigue',shieldMelee:'Melee shield defense',shieldRanged:'Ranged shield defense',shieldDurability:'Shield durability',meleeSkill:'Melee skill',rangedSkill:'Ranged skill',initiative:'Initiative',maxHp:'Hitpoints',rangedRange:'Light armor ranged reach',perkFlags:'Equipment perks',berserkAp:'Berserk bonus AP',nimbleBoost:'Nimble enhancement',battleForgedBoost:'Battle Forged enhancement'};
export function forgeProfileRows(profile,item){return Object.entries(profile).map(([key,n])=>({key,label:labels[key]??PREFIX_EFFECTS[key]?.label,value:PREFIX_EFFECTS[key]?prefixEffectText(key,n):key==='perkFlags'?flaggedPerks(n).map(id=>PERK_BY_ID.get(id)?.name??id).join(', '):key==='nimbleBoost'?'Double defense; fatigue limit +5 (requires Nimble)':key==='battleForgedBoost'?`${n*5}% extra armor reduction (requires Battle Forged)`:key==='berserkAp'?`+${n} AP per proc (requires Berserk)`:`${['weight','skillFatigue'].includes(key)?'-':'+'}${n}${['armorPct','damagePct'].includes(key)?'%':['armorDamage','piercing','headChance'].includes(key)?' percentage points':''}`,inactive:key==='rangedRange'&&(item.fatigue??0)>15?'Requires light armor and a bow/crossbow':key==='range'&&!item.ranged?'Requires a ranged weapon':key==='ammo'&&!item.throwing?'Requires a throwing weapon':key==='shieldDamage'&&!baseShieldDamage(item)?'Requires a shield-breaking weapon':null}));}
export function forgeGroups(profile,recipient){
 const rows=forgeProfileRows(profile,recipient).filter(r=>!r.inactive);
 const groups=new Map();for(const row of rows){const group=['damagePct','damageLow','damageHigh'].includes(row.key)?'damage':['armorPct','armorFlat'].includes(row.key)?'protection':row.key;groups.set(group,[...(groups.get(group)??[]),row.key]);}return [...groups.values()];
}
export function encodeForgeItem(baseId,profile,catalog){
 const base=catalog(baseId),p=base&&isForgeSlot(base.slot)&&normalizeForgeProfile(profile,base.slot);if(!p||!Object.keys(p).length)throw new TypeError('Invalid reforge profile.');
 const version=Object.keys(p).some(key=>FORGE_KEYS.indexOf(key)>=30)||(p.perkFlags??0)>255?3:Object.keys(p).some(key=>FORGE_KEYS.indexOf(key)>=21)?2:1,keys=FORGE_KEYS.slice(0,version===1?21:version===2?30:FORGE_KEYS.length);
 return `forge${version}:${baseId}:${keys.map(k=>(p[k]??0).toString(36)).join('.')}`;
}
const cache=new Map();
export function resolveForgeItem(id,catalog){
 if(cache.has(id))return cache.get(id);
 if(typeof id!=='string'||id.length>384)return undefined;
 const match=/^(forge1|forge2|forge3):([a-z0-9-]{1,40}):([0-9a-z.]+)$/.exec(id);if(!match)return undefined;
 const definition=catalog(match[2]),parts=match[3].split('.');if(!definition||!isForgeSlot(definition.slot)||parts.length!==(match[1]==='forge1'?21:match[1]==='forge2'?30:FORGE_KEYS.length))return undefined;
 const profile=normalizeForgeProfile(Object.fromEntries(parts.map((n,i)=>[FORGE_KEYS[i],parseInt(n,36)])),definition.slot);
 if(!profile||!Object.keys(profile).length||encodeForgeItem(definition.id,profile,catalog)!==id)return undefined;
 if(match[1]==='forge2'&&(profile.perkFlags??0)>255)return undefined;
 const item=applyForgeProfile(definition,profile,id);if(cache.size>=512)cache.delete(cache.keys().next().value);cache.set(id,item);return item;
}
export function applyForgeProfile(definition,p,id){
 const b=forgeBaseline(definition),item={...b,id,baseId:definition.id,rarity:'famed',forgeProfile:Object.freeze({...p}),forgeVersion:1,name:`${definition.name} — Reforged`},capped=[];
 const cap=(key,value,min,max)=>{const actual=Math.min(max,Math.max(min,value));if(actual!==value)capped.push(`${key} capped at ${actual}`);return actual;};
 item.fatigue=cap('Fatigue load',(b.fatigue??0)-(p.weight??0),0,80);
 item.fatigueOnSkillUse=(b.fatigueOnSkillUse??0)-(p.skillFatigue??0);
 if(['armor','helmet'].includes(b.slot)){
  item.armor=cap('Protection',Math.floor(b.armor*(1+(p.armorPct??0)/100))+(p.armorFlat??0),0,b.slot==='armor'?650:500);
  item.statBonuses=Object.freeze({...b.statBonuses,...Object.fromEntries([['meleeDefense','meleeDefense'],['rangedDefense','rangedDefense'],['resolve','resolve'],['endurance','maxFatigue'],['meleeSkill','meleeSkill'],['rangedSkill','rangedSkill'],['initiative','initiative'],['maxHp','maxHp']].filter(([k])=>p[k]).map(([k,stat])=>[stat,(b.statBonuses?.[stat]??0)+p[k]]))});
 }else if(b.slot==='shield'){
  item.defense=cap('Melee defense',(b.defense??0)+(p.shieldMelee??0),0,80);item.rangedDefense=cap('Ranged defense',(b.rangedDefense??b.defense??0)+(p.shieldRanged??0),0,80);
  item.durability=cap('Shield durability',(b.durability??Math.max(24,(b.armor??6)*4))+(p.shieldDurability??0),1,500);
 }else{
  item.damageMin=cap('Minimum damage',Math.round(b.damageMin*(1+(p.damagePct??0)/100))+(p.damageLow??0),1,300);
  item.damageMax=cap('Maximum damage',Math.round(b.damageMax*(1+(p.damagePct??0)/100))+(p.damageHigh??0),item.damageMin,300);
  item.hitBonus=cap('Accuracy',(b.hitBonus??0)+(p.accuracy??0),-100,100);
  item.armorDamage=cap('Armor damage',(b.armorDamage??1)+(p.armorDamage??0)/100,0,4);
  item.armorPiercing=cap('Armor penetration',(b.armorPiercing??.3)+(p.piercing??0)/100,0,1);
  item.headChance=cap('Head hit chance',(b.headChance??.22)+(p.headChance??0)/100,0,1);
  if(b.ranged)item.range=(b.range??1)+(p.range??0);
  if(b.throwing)item.ammoMax=(b.ammoMax??5)+(p.ammo??0);
  if(p.shieldDamage&&forgeProfileRows({shieldDamage:p.shieldDamage},b)[0].inactive===null)item.shieldDamage=baseShieldDamage(b)+p.shieldDamage;
 }
 item.grantedPerks=Object.freeze(flaggedPerks(p.perkFlags??0));item.rangedRangeBonus=p.rangedRange??0;
 item.perkBoosts=Object.freeze({berserkAp:p.berserkAp??0,nimble:p.nimbleBoost??0,battleForged:p.battleForgedBoost??0,...Object.fromEntries(Object.keys(PREFIX_EFFECTS).filter(key=>p[key]).map(key=>[key,p[key]]))});
 if(b.slot==='shield'&&p.shieldHealthPct){item.unboostedShieldDurability=item.durability;item.durability=cap('Shield durability',Math.ceil(item.durability*(1+p.shieldHealthPct/100)),1,500);}
 item.bonuses=Object.freeze(forgeProfileRows(p,b).map(r=>Object.freeze({label:r.label,value:r.value+(r.inactive?` · inactive: ${r.inactive}`:'')})));
 item.forgeWarnings=Object.freeze(capped);item.signatureDescription='Accumulated workmanship from sacrificed named gear. The original design and skills remain.';
 item.description=`${definition.description} Reforged by Odran, the Last Ember. ${capped.join('; ')}`;
 item.price=Math.min(20000,Math.round((b.price??100)*2.4+Object.values(p).reduce((n,x)=>n+x,0)*10));
 return Object.freeze(item);
}
