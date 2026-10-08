import { PREFIX_EFFECTS, EXPANDED_PREFIXES, AFFIX_MASTERIES, prefixEffectText } from './affix-prefixes.js';
import { perkFlags, flaggedPerks } from './item-affixes.js';
import {weaponTrainingVisual,weaponMasteryMatches,PERK_BY_ID} from './perks.js';
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
  diff('shieldDurability',item.unboostedShieldDurability??item.durability??shieldMaximum(item.id),base.durability??shieldMaximum(definition.id));
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
export function forgeProfileRows(profile,item){return Object.entries(profile).map(([key,n])=>({key,label:labels[key]??PREFIX_EFFECTS[key]?.label,value:PREFIX_EFFECTS[key]?prefixEffectText(key,n):key==='perkFlags'?flaggedPerks(n).map(id=>PERK_BY_ID.get(id)?.name??id).join(', '):key==='nimbleBoost'?'Double defense; fatigue limit +5 (requires Nimble)':key==='battleForgedBoost'?`${n*5}% extra armor reduction (requires Battle Forged)`:key==='berserkAp'?`+${n} AP per proc (requires Berserk)`:`${['weight','skillFatigue'].includes(key)?'-':'+'}${n}${['armorPct','damagePct'].includes(key)?'%':['armorDamage','piercing','headChance'].includes(key)?' percentage points':''}`,inactive:key==='perkFlags'&&item.slot==='weapon'&&flaggedPerks(n).every(id=>AFFIX_MASTERIES.includes(id)&&!weaponMasteryMatches(id,item))?'Requires a weapon matching its mastery':['rangedReach','rangedHit','volleyDistance'].includes(key)&&item.slot==='weapon'&&!item.ranged?'Requires a ranged weapon':key==='duelistPct'&&(item.ranged||item.twoHanded)?'Requires a one-handed melee weapon':key==='rangedRange'&&(item.fatigue??0)>15?'Requires light armor and a bow/crossbow':key==='range'&&!item.ranged?'Requires a ranged weapon':key==='ammo'&&!item.throwing?'Requires a throwing weapon':key==='shieldDamage'&&!baseShieldDamage(item)?'Requires a shield-breaking weapon':null}));}
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
 if(typeof id==='string'&&/^forge[45]:/.test(id))return resolveBoundedForgeItem(id,catalog);
 if(typeof id!=='string'||id.length>384)return undefined;
 const match=/^(forge1|forge2|forge3):([a-z0-9-]{1,40}):([0-9a-z.]+)$/.exec(id);if(!match)return undefined;
 const definition=catalog(match[2]),parts=match[3].split('.');if(!definition||!isForgeSlot(definition.slot)||parts.length!==(match[1]==='forge1'?21:match[1]==='forge2'?30:FORGE_KEYS.length))return undefined;
 const profile=normalizeForgeProfile(Object.fromEntries(parts.map((n,i)=>[FORGE_KEYS[i],parseInt(n,36)])),definition.slot);
 if(!profile||!Object.keys(profile).length||encodeForgeItem(definition.id,profile,catalog)!==id)return undefined;
 if(match[1]==='forge2'&&(profile.perkFlags??0)>255)return undefined;
 const item=applyForgeProfile(definition,profile,id);if(cache.size>=512)cache.delete(cache.keys().next().value);cache.set(id,item);return item;
}
export function applyForgeProfile(definition,p,id,affixes=null){
 const b=forgeBaseline(definition),item={...b,id,baseId:definition.id,rarity:'famed',forgeProfile:Object.freeze({...p}),forgeVersion:1,name:`${definition.name} — Reforged`},capped=[];
 const cap=(key,value,min,max)=>{const actual=Math.min(max,Math.max(min,value));if(actual!==value)capped.push(`${key} capped at ${actual}`);return actual;};
 const signedArmor=id.startsWith('forge5:')&&['armor','helmet'].includes(b.slot);
 const relief=signedArmor?cap('Fatigue relief',p.weight??0,0,11):p.weight??0;
 item.fatigue=cap('Fatigue load',(b.fatigue??0)-relief,signedArmor?-11:0,80);
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
 if(affixes){
  item.forgeVersion=id.startsWith('forge5:')?5:4;item.forgeAffixes=freezeForgeAffixes(affixes);
  if(!affixes.locked){
   const prefixes=affixes.prefixes.map(a=>forgeAffixName('prefix',a)),suffixes=affixes.suffixes.map(a=>forgeAffixName('suffix',a));
   item.name=`${prefixes.join(' ')} ${definition.name} ${suffixes.join(' & ')} — Reforged`.trim();
  }
  item.signatureDescription=affixes.locked?'Legacy workmanship preserved. Further merges are locked; full transfers preserve this restriction.':'Two prefix and two suffix slots. Identical affixes use the stronger roll; the stronger workmanship values are kept without adding duplicate values.';
 }
 item.price=Math.min(20000,Math.round((b.price??100)*2.4+Object.values(p).reduce((n,x)=>n+x,0)*10));
 return Object.freeze(item);
}

// forge4 keeps provenance rather than guessing slots from flattened stat fields.
const oldPrefixes=[['bulwark','Bulwark','shield-expert'],['tireless','Tireless','recover'],['trailblazer','Trailblazer','pathfinder'],['fleet','Fleet','fleet-footed'],['balanced','Balanced','relentless'],['steadfast','Steadfast','steel-brow'],['watchful','Watchful','anticipation'],['ruthless','Ruthless','backstabber'],['farseeing','Farseeing',null,'rangedRange'],['bloodrush','Bloodrush',null,'berserkAp'],['featherbound','Featherbound',null,'nimbleBoost'],['tempered','Tempered',null,'battleForgedBoost']];
const prefixDefinitions=new Map([...oldPrefixes.map(([id,name,perk,key])=>[id,{id,name,perk,key,grades:[1]}]),...EXPANDED_PREFIXES.map(p=>[p.id,p])]);
const suffixNames={precision:'of Precision',ruin:'of Ruin',slaying:'of Slaying',plenty:'of Plenty',guard:'of the Guard',deflection:'of Deflection',endurance:'of Endurance',resolve:'of Resolve',vigor:'of Vigor',vitality:'of Vitality',striking:'of Striking',aim:'of Aim',alacrity:'of Alacrity',craftsmanship:'Legacy craftsmanship'};
const prefixKeys=new Set(['rangedRange','perkFlags','berserkAp','nimbleBoost','battleForgedBoost',...Object.keys(PREFIX_EFFECTS)]);
function freezeForgeAffixes(a){return Object.freeze({locked:a.locked,foundation:Object.freeze({...a.foundation}),prefixes:Object.freeze(a.prefixes.map(p=>Object.freeze({id:p.id,profile:Object.freeze({...p.profile})}))),suffixes:Object.freeze(a.suffixes.map(p=>Object.freeze({id:p.id,profile:Object.freeze({...p.profile})})))});}
export function forgeAffixName(kind,a){
 if(kind==='foundation')return 'Craftsmanship';
 if(kind==='suffix')return suffixNames[a.id];
 const d=prefixDefinitions.get(a.id);if(!d)return a.id;
 const grade=d.key?d.grades.indexOf(a.profile[d.key]):-1;
 return d.name+(d.grades.length>1&&grade>=0?` ${['I','II','III'][grade]}`:'');
}
export function flattenForgeAffixes(a){
 const result={...a.foundation};
 for(const part of [...a.prefixes,...a.suffixes])for(const [key,n]of Object.entries(part.profile))result[key]=key==='perkFlags'?(result[key]??0)|n:(result[key]??0)+n;
 return result;
}
export function extractForgeAffixes(item,catalog,options={}){
 if(item.forgeAffixes){
  const a=item.forgeAffixes,legacy=a.suffixes.find(part=>part.id==='craftsmanship');
  if(a.locked||!legacy)return a;
  const foundation={...a.foundation};
  for(const [key,n]of Object.entries(legacy.profile))foundation[key]=(foundation[key]??0)+n;
  return freezeForgeAffixes({...a,foundation,suffixes:a.suffixes.filter(part=>part!==legacy)});
 }
 const full=extractForgeProfile(item,catalog,options);if(!full)return null;
 if(item.forgeVersion)return freezeForgeAffixes({locked:true,foundation:full,prefixes:[],suffixes:[]});
 const foundation={...full},prefixes=[],suffixes=[];
 if(item.affixPrefix){const profile=Object.fromEntries(Object.entries(full).filter(([key])=>prefixKeys.has(key)));if(Object.keys(profile).length)prefixes.push({id:item.affixPrefix.id,profile});for(const key of Object.keys(profile))delete foundation[key];}
 if(item.affixSuffix?.profile){const profile={...item.affixSuffix.profile};suffixes.push({id:item.affixSuffix.id,profile});for(const [key,n]of Object.entries(profile)){foundation[key]=(foundation[key]??0)-n;if(!foundation[key])delete foundation[key];}}

 return freezeForgeAffixes({locked:false,foundation,prefixes,suffixes});
}
function validAffixRecord(a,kind,slot){
 if(!a||typeof a!=='object'||Object.keys(a).sort().join(',')!=='id,profile')return false;
 const p=normalizeForgeProfile(a.profile,slot);if(!p||!Object.keys(p).length)return false;
 if(kind==='prefix'){
  const d=prefixDefinitions.get(a.id);if(!d)return false;
  if(d.mastery)return Object.keys(p).length===1&&flaggedPerks(p.perkFlags).length===1&&AFFIX_MASTERIES.includes(flaggedPerks(p.perkFlags)[0]);
  return Object.keys(p).length===1&&(d.perk?p.perkFlags===perkFlags([d.perk]):d.grades.includes(p[d.key]));
 }
 if(!Object.hasOwn(suffixNames,a.id)||Object.keys(p).some(key=>prefixKeys.has(key)))return false;
 if(a.id==='craftsmanship')return true;
 const key={precision:'accuracy',ruin:'armorDamage',plenty:'ammo',guard:slot==='shield'?'shieldMelee':'meleeDefense',deflection:slot==='shield'?'shieldRanged':'rangedDefense',endurance:'shieldDurability',resolve:'resolve',vigor:'endurance',vitality:'maxHp',striking:'meleeSkill',aim:'rangedSkill',alacrity:'initiative'}[a.id];
 const cap={precision:4,ruin:10,plenty:2,guard:4,deflection:5,endurance:10,resolve:7,vigor:7,vitality:9,striking:4,aim:4,alacrity:6}[a.id];
 return a.id==='slaying'?Object.keys(p).sort().join(',')==='damageHigh,damageLow'&&p.damageLow===p.damageHigh&&p.damageLow<=5:Object.keys(p).length===1&&p[key]>0&&p[key]<=cap;
}
function validForgeAffixes(a,slot){
 if(!a||typeof a.locked!=='boolean'||!Array.isArray(a.prefixes)||!Array.isArray(a.suffixes)||a.prefixes.length>2||a.suffixes.length>2)return false;
 if(!normalizeForgeProfile(a.foundation,slot)||!normalizeForgeProfile(flattenForgeAffixes(a),slot))return false;
 if(a.locked)return !a.prefixes.length&&!a.suffixes.length&&Object.keys(a.foundation).length>0;
 return !Object.keys(a.foundation).some(key=>prefixKeys.has(key))&&['prefix','suffix'].every(kind=>{const parts=a[`${kind}es`];return new Set(parts.map(p=>p.id)).size===parts.length&&parts.every(p=>validAffixRecord(p,kind,slot));});
}
const sparseProfile=p=>FORGE_KEYS.flatMap((key,index)=>p[key]?[`${index.toString(36)}-${p[key].toString(36)}`]:[]).join('.')||'0';
function parseSparseProfile(raw){
 if(raw==='0')return {};
 const p={};for(const part of raw.split('.')){const match=/^([0-9a-z]+)-([0-9a-z]+)$/.exec(part);if(!match)return null;const key=FORGE_KEYS[parseInt(match[1],36)],n=parseInt(match[2],36);if(!key||Object.hasOwn(p,key)||!Number.isSafeInteger(n)||n<=0)return null;p[key]=n;}
 return sparseProfile(p)===raw?p:null;
}
export function encodeBoundedForgeItem(baseId,a,catalog,version){
 version??=['armor','helmet'].includes(catalog(baseId)?.slot)?5:4;
 if(![4,5].includes(version))throw new TypeError('Invalid bounded forge version.');
 const base=catalog(baseId);if(!base||!isForgeSlot(base.slot)||!validForgeAffixes(a,base.slot))throw new TypeError('Invalid bounded affix package.');
 const record=parts=>[...parts].sort((a,b)=>a.id.localeCompare(b.id)).map(p=>`${p.id},${sparseProfile(p.profile)}`).join(';')||'0';
 const id=`forge${version}:${baseId}:${a.locked?'l':'n'}:${sparseProfile(a.foundation)}:${record(a.prefixes)}:${record(a.suffixes)}`;
 if(id.length>1536||!Object.keys(flattenForgeAffixes(a)).length)throw new TypeError('Invalid bounded affix identity.');return id;
}
function resolveBoundedForgeItem(id,catalog){
 if(id.length>1536)return undefined;
 const parts=id.split(':');if(parts.length!==6||!['l','n'].includes(parts[2]))return undefined;
 const definition=catalog(parts[1]);if(!definition||!isForgeSlot(definition.slot))return undefined;
 const parseRecords=raw=>raw==='0'?[]:raw.split(';').map(raw=>{const [id,p,...extra]=raw.split(',');const profile=p&&parseSparseProfile(p);return !extra.length&&profile?{id,profile}:null;});
 const a={locked:parts[2]==='l',foundation:parseSparseProfile(parts[3]),prefixes:parseRecords(parts[4]),suffixes:parseRecords(parts[5])};
 try{if(!a.foundation||a.prefixes.some(p=>!p)||a.suffixes.some(p=>!p)||encodeBoundedForgeItem(definition.id,a,catalog,Number(parts[0].slice(5)))!==id)return undefined;}catch{return undefined;}
 const item=applyForgeProfile(definition,flattenForgeAffixes(a),id,a);if(cache.size>=512)cache.delete(cache.keys().next().value);cache.set(id,item);return item;
}
export function forgeAffixOptions(source,recipient,item){
 if(source.locked||recipient.locked)return [];
 return ['prefix','suffix'].flatMap(kind=>source[`${kind}es`].map(a=>{
  const old=recipient[`${kind}es`].find(p=>p.id===a.id);
  if(kind==='suffix'&&a.id==='craftsmanship'&&old)a={id:a.id,profile:bestCraftsmanship(old.profile,a.profile)};
  const inactive=forgeProfileRows(a.profile,item).find(r=>r.inactive)?.inactive;
  // A duplicate is upgraded as a complete package only when no field regresses.
  const stronger=!old||Object.entries(old.profile).every(([key,n])=>key==='perkFlags'?(a.profile[key]??0)===n:(a.profile[key]??0)>=n)&&Object.entries(a.profile).some(([key,n])=>n>(old.profile[key]??0));
  return {kind,affix:a,upgrade:!!old,inactive,eligible:!inactive&&stronger&&(!!old||recipient[`${kind}es`].length<2),reason:inactive||(!stronger?'Already as strong':!old&&recipient[`${kind}es`].length>=2?'Slots full':null)};
 }));
}
function bestCraftsmanship(existing,incoming){
 const profile={...existing};
 for(const [key,n]of Object.entries(incoming))profile[key]=Math.max(profile[key]??0,n);
 return profile;
}
export function forgeCraftsmanshipOption(source,recipient,item){
 if(source.locked||recipient.locked)return null;
 const profile=bestCraftsmanship(recipient.foundation,source.foundation);
 const improvements=Object.fromEntries(Object.entries(profile).filter(([key,n])=>n>(recipient.foundation[key]??0)));
 if(!Object.keys(improvements).length)return null;
 // Cross-class reach and ammunition retain their requirements.
 const applicable=Object.fromEntries(Object.entries(improvements).filter(([key,n])=>!forgeProfileRows({[key]:n},item)[0].inactive));
 if(!Object.keys(applicable).length)return null;
 return {kind:'foundation',affix:{id:'craftsmanship',profile:applicable},upgrade:true,eligible:true};
}
export function mergeForgeAffixes(source,recipient,item,seed){
 const a={locked:false,foundation:{...recipient.foundation},prefixes:[...recipient.prefixes],suffixes:[...recipient.suffixes]},options=forgeAffixOptions(source,recipient,item).filter(o=>o.eligible),selected=[];
 const craftsmanship=forgeCraftsmanshipOption(source,recipient,item);
 if(craftsmanship){Object.assign(a.foundation,craftsmanship.affix.profile);selected.push(craftsmanship);}
 // Stable pair/serial seed: menu reopen and save reload cannot change selection.
 const rank=(id)=>{let h=seed>>>0;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
 for(const o of options.sort((a,b)=>rank(a.kind+a.affix.id)-rank(b.kind+b.affix.id)||a.affix.id.localeCompare(b.affix.id))){
  const list=a[`${o.kind}es`],index=list.findIndex(p=>p.id===o.affix.id);if(index<0&&list.length>=2)continue;
  if(index>=0)list[index]=o.affix;else list.push(o.affix);selected.push(o);if(selected.filter(part=>part.kind!=='foundation').length>=1+seed%3)break;
 }
 return {affixes:freezeForgeAffixes(a),selected,options:forgeAffixOptions(source,recipient,item)};
}
export function forgeRecipe(affixes){
 const goods={};
 const add=(id,n)=>{goods[id]=(goods[id]??0)+n;};
 for(const a of affixes){
  const id=a.affix?.id??a.id;
  if(['trueflight','longshot','volleying','farseeing','surefooted','trailblazer','fleet','plenty','precision','aim','alacrity'].includes(id))add('timber',1);
  else if(['hearty','supple','unyielding','prescient','mending','swift-handed','layered','featherbound','balanced','tireless','guard','deflection','vigor','vitality','resolve'].includes(id))add('wool',1);
  else add('iron',id==='unyoked'?3:1);
 }
 if(!Object.keys(goods).length)add('iron',1);return goods;
}
