import { PERK_BY_ID } from './perks.js';

// One source for roll eligibility, grades, forge limits and inspection copy.
// New graded effects use the strongest worn copy; the three original boosts keep stacking.
export const PREFIX_EFFECTS = Object.freeze(Object.fromEntries(Object.entries({
  healthPct: {cap:15, label:'Maximum health', text:n=>`+${n}% maximum health`},
  executionerPct: {cap:20, label:'Executioner enhancement', text:n=>`+${n}% damage against temporarily injured enemies (requires Executioner)`},
  duelistPct: {cap:20, label:'Duelist enhancement', text:n=>`+${n}% damage while Duelist is active (requires Duelist)`},
  killMomentumPct: {cap:100, label:'Kill momentum', text:n=>`A kill banks +${n}% damage for the next successful weapon hit; misses preserve it`},
  dazeHead: {cap:1, label:'Head-hit daze', text:()=>`Weapon head hits daze living enemies for 2 turns: −50% initiative and −20% melee/ranged skill`},
  shieldDamagePct: {cap:50, label:'Shield damage', text:n=>`+${n}% shield damage, including Split Shield`},
  headChancePct: {cap:50, label:'Relative head chance', text:n=>`+${n}% relative head-hit chance (22% becomes ${22*(1+n/100)}%)`},
  injuryThreshold: {cap:17, label:'Injury threshold', text:()=>`Injury thresholds become 83% of normal, or 50% with Crippling Strikes; minimum 10 HP damage`},
  agileThreshold: {cap:3, label:'Agile Defense enhancement', text:()=>`Agile Defense's full protection extends to 18 armor fatigue; its falloff shifts by +3 (requires the perk)`},
  lastStand: {cap:10, label:'Last Stand enhancement', text:()=>`+10 extra melee/ranged defense at half health: +18 total (requires Last Stand)`},
  anticipationPct: {cap:5, label:'Anticipation enhancement', text:()=>`Anticipation gains 5 percentage points of ranged defense per distance tile: 15% per tile (requires the perk)`},
  volleyDistance: {cap:1, label:'Volley Fire enhancement', text:()=>`Volley Fire activates from 2 hexes instead of 3 (requires the perk)`},
  rangedHit: {cap:8, label:'Ranged accuracy', text:n=>`+${n} hit chance on all ranged weapon attacks`},
  shieldHealthPct: {cap:25, label:'Shield durability', text:n=>`+${n}% maximum shield durability`},
  rangedReach: {cap:1, label:'Extended ranged reach', text:()=>`All ranged weapons gain +1 hex reach and deal 12% less damage`},
  heightRelief: {cap:1, label:'Agile climbing', text:()=>`Climbing adds no movement or fatigue cost; ordinary terrain costs still apply`},
  actionPoints: {cap:1, label:'Action points', text:()=>`+1 AP each turn; only one worn bonus applies`},
}).map(([key,value])=>[key,Object.freeze(value)])));

const entry=(id,name,slots,key,grades,options={})=>Object.freeze({id,name,slots:Object.freeze(slots),key,grades:Object.freeze(grades),weight:4,...options});
const armor=['armor','helmet'],all=['armor','helmet','weapon','shield'];
export const EXPANDED_PREFIXES=Object.freeze([
  entry('hearty','Hearty',armor,'healthPct',[5,10,15]),
  entry('merciless','Merciless',['weapon'],'executionerPct',[10,15,20]),
  entry('dueling','Dueling',['weapon'],'duelistPct',[10,15,20],{melee:true,oneHanded:true}),
  entry('bloodthirsty','Bloodthirsty',['weapon'],'killMomentumPct',[50,75,100]),
  entry('concussive','Concussive',['weapon'],'dazeHead',[1]),
  entry('sundering','Sundering',['weapon'],'shieldDamagePct',[25,50]),
  entry('headhunting','Headhunting',['weapon','helmet'],'headChancePct',[25,50]),
  entry('crippling','Crippling',['weapon'],'injuryThreshold',[17]),
  entry('masterful','Masterful',['weapon'],null,[1],{mastery:true}),
  entry('supple','Supple',armor,'agileThreshold',[3],{light:true}),
  entry('unyielding','Unyielding',['armor','shield'],'lastStand',[10]),
  entry('prescient','Prescient',armor,'anticipationPct',[5]),
  entry('volleying','Volleying',['weapon'],'volleyDistance',[1],{ranged:true}),
  entry('trueflight','Trueflight',['weapon','helmet'],'rangedHit',[5,8],{rangedWeapon:true}),
  entry('reinforced','Reinforced',['shield'],'shieldHealthPct',[25]),
  entry('longshot','Longshot',['weapon'],'rangedReach',[1],{ranged:true}),
  entry('surefooted','Surefooted',armor,'heightRelief',[1]),
  entry('unyoked','Unyoked',all,'actionPoints',[1],{weight:1}),
  entry('mending','Mending',['armor','helmet'],null,[1],{perk:'combat-bandaging'}),
  entry('swift-handed','Swift-handed',['armor','helmet'],null,[1],{perk:'quick-hands'}),
  // The slot grant lives on body armor, so swapping a weapon never invalidates attachments.
  entry('layered','Layered',['armor'],null,[1],{perk:'layered-armor'}),
]);
export const AFFIX_MASTERIES=Object.freeze(['sword-training','axe-training','mace-training','spear-training','polearm-training','dagger-training','throwing-training','bow-mastery','crossbow-mastery']);
export function eligibleExpandedPrefixes(item,light){return EXPANDED_PREFIXES.filter(p=>p.slots.includes(item.slot)
  &&(!p.light||light)&&(!p.ranged||item.ranged)&&(!p.rangedWeapon||item.slot!=='weapon'||item.ranged)
  &&(!p.melee||!item.ranged)&&(!p.oneHanded||!item.twoHanded));}
export function prefixEffectText(key,n){return PREFIX_EFFECTS[key]?.text(n);}
export const equipmentPerkText=id=>`Grants ${PERK_BY_ID.get(id)?.name??id} while equipped; does not duplicate a learned copy`;
