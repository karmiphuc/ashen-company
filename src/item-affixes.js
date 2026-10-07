import { PREFIX_EFFECTS, AFFIX_MASTERIES, eligibleExpandedPrefixes, prefixEffectText, equipmentPerkText } from './affix-prefixes.js';
// Stable, bounded affixes. Gear grants effects while worn; it never learns perks.
export const AFFIX_PERKS = Object.freeze(['pathfinder','fleet-footed','recover','relentless','steel-brow','shield-expert','backstabber','anticipation',...AFFIX_MASTERIES,'combat-bandaging','quick-hands','layered-armor']);
export const perkFlags = perks => (perks ?? []).reduce((flags,id) => flags | (AFFIX_PERKS.includes(id) ? 1 << AFFIX_PERKS.indexOf(id) : 0), 0);
export const flaggedPerks = flags => AFFIX_PERKS.filter((_,index) => flags & (1 << index));
export function activeAffixItems(actor, getItem) {
  return ['armor','helmet','weapon','shield','attachment','attachment2'].flatMap(slot => {
    if (slot === 'shield' && (actor.shieldDurability ?? actor.armorDurability?.shield ?? 1) <= 0) return [];
    const item = getItem(actor.equipment?.[slot]); return item ? [item] : [];
  });
}
const affixSlots=Object.freeze(['armor','helmet','weapon','shield','attachment','attachment2']);
const actorAffixes=new WeakMap(),emptyAffixes={perks:new Set(),boosts:{},range:0};
function currentAffixes(actor,getItem) {
  if(!actor?.equipment)return emptyAffixes;
  const equipment=actor.equipment,shieldUsable=(actor.shieldDurability??actor.armorDurability?.shield??1)>0;
  const cached=actorAffixes.get(actor);
  if(cached&&cached.getItem===getItem&&cached.shieldUsable===shieldUsable
    &&affixSlots.every((slot,index)=>equipment[slot]===cached.ids[index]))return cached;
  const summary={getItem,shieldUsable,ids:affixSlots.map(slot=>equipment[slot]),perks:new Set(),boosts:{},range:0};
  for(const slot of affixSlots){
    if(slot==='shield'&&!shieldUsable)continue;
    const id=equipment[slot];
    // Legacy and ordinary gear cannot grant affixes; avoid resolving their rolls.
    if(typeof id!=='string'||!id.startsWith('famed5:')&&!id.startsWith('famed7:')&&!id.startsWith('forge2:')&&!id.startsWith('forge3:'))continue;
    const item=getItem(id);if(!item)continue;
    for(const perk of item.grantedPerks??[])summary.perks.add(perk);
    for(const [key,value]of Object.entries(item.perkBoosts??{}))summary.boosts[key]=PREFIX_EFFECTS[key]?Math.max(summary.boosts[key]??0,value):(summary.boosts[key]??0)+value;
    summary.range+=item.rangedRangeBonus??0;
  }
  if(summary.range){const load=affixSlots.slice(0,2).reduce((sum,slot)=>sum+(getItem(equipment[slot])?.fatigue??0),0);summary.range=load<=15?Math.min(1,summary.range):0;}
  actorAffixes.set(actor,summary);return summary;
}
export function equipmentBoost(actor,key,getItem,cap=PREFIX_EFFECTS[key]?.cap??2){return Math.min(cap,currentAffixes(actor,getItem).boosts[key]??0);}
export function equipmentPerk(actor,id,getItem){return currentAffixes(actor,getItem).perks.has(id);}
export function equipmentRangedReach(actor,getItem){return currentAffixes(actor,getItem).range;}
function seededRoll(seed, salt) {
  let state=(seed ^ salt)>>>0;
  return (min,max) => {state=(state+0x6D2B79F5)>>>0;let x=state;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return min+((x^(x>>>14))>>>0)%(max-min+1);};
}
export function applyNamedAffixes(item, original, seed, bonuses, {expanded=false}={}) {
  const suffixRoll=seededRoll(seed,0x73756666),prefixRoll=seededRoll(seed,0x70726566);
  const light=(original.sourceFatigue ?? original.fatigue ?? 0) <= (item.slot === 'helmet' ? 9 : 15);
  const suffixes = item.slot === 'weapon' ? [
    ['precision','of Precision','hitBonus','Accuracy',2,4],
    ['ruin','of Ruin','armorDamage','Armor damage',5,10],
    ['slaying','of Slaying','damage','Damage',3,5],
    ...(item.throwing ? [['plenty','of Plenty','ammoMax','Bundle throws',1,2]] : [])
  ] : item.slot === 'shield' ? [
    ['guard','of the Guard','defense','Melee defense',2,4],
    ['deflection','of Deflection','rangedDefense','Ranged defense',2,4],
    ['endurance','of Endurance','durability','Shield durability',5,10]
  ] : [
    ['guard','of the Guard','meleeDefense','Melee defense',2,4],
    ['deflection','of Deflection','rangedDefense','Ranged defense',3,5],
    ['resolve','of Resolve','resolve','Resolve',4,7],
    ['vigor','of Vigor','maxFatigue','Maximum fatigue',4,7],
    ['vitality','of Vitality','maxHp','Hitpoints',5,9],
    ['striking','of Striking','meleeSkill','Melee skill',2,4],
    ...(light ? [['aim','of Aim','rangedSkill','Ranged skill',2,4],['alacrity','of Alacrity','initiative','Initiative',3,6]] : [])
  ];
  const [suffixId,suffix,key,label,min,max]=suffixes[suffixRoll(0,suffixes.length-1)],value=suffixRoll(min,max);
  if (['armor','helmet'].includes(item.slot)) item.statBonuses=Object.freeze({...item.statBonuses,[key]:(item.statBonuses?.[key]??0)+value});
  else if (key === 'damage') {item.damageMin+=value;item.damageMax+=value;item.enhancementProfile.damageLow=(item.enhancementProfile.damageLow??0)+value;item.enhancementProfile.damageHigh=(item.enhancementProfile.damageHigh??0)+value;}
  else if (key === 'armorDamage') item.armorDamage=Math.round((item.armorDamage+value/100)*100)/100;
  else item[key]=(item[key] ?? (key === 'ammoMax' ? 5 : 0))+value;
  bonuses.push(Object.freeze({label:`Suffix · ${label}`,value:`+${value}${key==='armorDamage'?' percentage points':''}`}));
  const prefixPool = item.slot === 'shield' ? [
    ['bulwark','Bulwark','shield-expert','Shield Expert'],['tireless','Tireless','recover','Recover'],['tempered','Tempered',null,'Battle Forged: 5% extra armor damage reduction (requires the perk)']
  ] : item.slot === 'helmet' ? [
    ['steadfast','Steadfast','steel-brow','Steel Brow'],['watchful','Watchful','anticipation','Anticipation'],
    ...(light ? [['featherbound','Featherbound',null,'Nimble: double defense bonus; armor fatigue limit +5 (requires the perk)'],['farseeing','Farseeing',null,'+1 bow/crossbow range while wearing light armor']] : [])
  ] : item.slot === 'armor' ? [
    ['tireless','Tireless','recover','Recover'],['trailblazer','Trailblazer','pathfinder','Pathfinder'],['bloodrush','Bloodrush',null,'Berserk: +1 AP per kill proc (requires the perk)'],
    ...(light ? [['featherbound','Featherbound',null,'Nimble: double defense bonus; armor fatigue limit +5 (requires the perk)'],['fleet','Fleet','fleet-footed','Fleet Footed'],['balanced','Balanced','relentless','Relentless']] : [['tempered','Tempered',null,'Battle Forged: 5% extra armor damage reduction (requires the perk)']])
  ] : [
    ['tireless','Tireless','recover','Recover'],['trailblazer','Trailblazer','pathfinder','Pathfinder'],['bloodrush','Bloodrush',null,'Berserk: +1 AP per kill proc (requires the perk)'],
    ...(item.ranged ? [['watchful','Watchful','anticipation','Anticipation']] : [['ruthless','Ruthless','backstabber','Backstabber']])
  ];
  if(!expanded){
  const [prefixId,prefix,perk,effect]=prefixPool[prefixRoll(0,prefixPool.length-1)];
  item.grantedPerks=Object.freeze(perk?[perk]:[]);
  if(prefixId==='farseeing')item.rangedRangeBonus=1;
  item.perkBoosts=Object.freeze(prefixId==='bloodrush'?{berserkAp:1}:prefixId==='featherbound'?{nimble:1}:prefixId==='tempered'?{battleForged:1}:{});
  item.affixPrefix=Object.freeze({id:prefixId,name:prefix,effect});item.affixSuffix=Object.freeze({id:suffixId,name:suffix});
  item.name=`${prefix} ${item.name} ${suffix}`;
  bonuses.push(Object.freeze({label:`Prefix · ${prefix}`,value:perk?`Grants ${effect} while equipped`:effect}));
  item.signatureDescription=`${prefix}: ${effect}. Equipment perks do not stack with the same learned perk or another item granting it. Reserve gear grants no effects. Berserk bonuses stack up to +2 AP; Battle Forged up to 10% extra reduction. Nimble enhancement applies once.`;
    return;
  }
  const choices=[...prefixPool.map(([id,name,perk,effect])=>({id,name,perk,effect,weight:4,grades:[1]})),...eligibleExpandedPrefixes(item,light)];
  let pick=prefixRoll(1,choices.reduce((sum,p)=>sum+p.weight,0));
  const prefix=choices.find(p=>(pick-=p.weight)<=0);
  const gradeRoll=seededRoll(seed,0x67726164)(0,99),grade=prefix.grades.length===3?(gradeRoll<60?0:gradeRoll<90?1:2):prefix.grades.length===2?(gradeRoll<70?0:1):0;
  const amount=prefix.grades[grade],perk=prefix.mastery?AFFIX_MASTERIES[seededRoll(seed,0x6d617374)(0,AFFIX_MASTERIES.length-1)]:prefix.perk;
  const effect=prefix.key?prefixEffectText(prefix.key,amount):perk?equipmentPerkText(perk):prefix.effect;
  item.grantedPerks=Object.freeze(perk?[perk]:[]);
  if(prefix.id==='farseeing')item.rangedRangeBonus=1;
  item.perkBoosts=Object.freeze(prefix.key?{[prefix.key]:amount}:prefix.id==='bloodrush'?{berserkAp:1}:prefix.id==='featherbound'?{nimble:1}:prefix.id==='tempered'?{battleForged:1}:{});
  if(prefix.key==='shieldHealthPct'){item.unboostedShieldDurability=item.durability;item.durability=Math.ceil(item.durability*(1+amount/100));}
  const display=prefix.name+(prefix.grades.length>1?` ${['I','II','III'][grade]}`:'');
  item.affixPrefix=Object.freeze({id:prefix.id,name:display,effect,tier:grade+1,value:amount});item.affixSuffix=Object.freeze({id:suffixId,name:suffix});
  item.name=`${display} ${item.name} ${suffix}`;
  bonuses.push(Object.freeze({label:`Prefix · ${display}`,value:effect}));
  item.signatureDescription=`${display}: ${effect}. Only worn gear grants effects. Graded bonuses use the strongest worn copy; learned perks are never duplicated.`;

}
export function rollAttachment(original,id,seed,{champion=false}={}) {
  const protectionRoll=seededRoll(seed,0x61726d72),traitRoll=seededRoll(seed,0x61747472);
  const pct=protectionRoll(champion?115:105,champion?130:115),armor=Math.ceil((original.armor??0)*pct/100);
  const traits=[['fitted','Fitted','fatigue',champion?2:1],['nimble','Nimble','initiativeBonus',champion?5:2],['screened','Screened','rangedDefenseBonus',champion?3:1]];
  const [trait,prefix,key,value]=traits[traitRoll(0,traits.length-1)];
  const item={...original,id,baseId:original.id,rarity:'famed',rollVersion:champion?6:5,armor,name:`${champion?'Masterwork':'Fine'} ${prefix} ${original.name}`};
  item[key]=key==='fatigue'?Math.max(0,(original.fatigue??0)-value):(original[key]??0)+value;
  item.attachmentTier=champion?'champion':'fine';
  item.bonuses=Object.freeze([{label:'Attachment protection',value:`+${armor-(original.armor??0)} (${pct-100}%)`},
    {label:key==='fatigue'?'Fatigue cost':key==='initiativeBonus'?'Initiative':'Ranged defense',value:`${key==='fatigue'?'-':'+'}${key==='fatigue'?(original.fatigue??0)-item.fatigue:value}`}].map(Object.freeze));
  item.signatureDescription=`${champion?'Champion masterwork':'Fine attachment'}: protection and fitting use separate rolls. Existing attachment effects remain intact; no perk is granted.`;
  item.description=`${original.description} ${item.signatureDescription}`;item.price=Math.round(original.price*(champion?1.8:1.3));
  item.enhancementProfile=Object.freeze({});item.rollModifiers=Object.freeze(['protection',trait]);
  return Object.freeze(item);
}
