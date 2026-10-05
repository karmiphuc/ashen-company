import { equipmentSkills } from './combat-skills.js';
// OG Battle Brothers temporary wound definitions, pinned to vanilla source
// kovasap/battle-bros-decompiled e06d68df0915827967f98a05d0c705c1f53df0b7.
// Thresholds are fractions of maximum HP, not probabilities.
export const INJURIES = Object.freeze(
[
  {"id": "fractured-hand","name": "Fractured Hand","days": [3,4],"effects": {"meleeSkill": 0.8,"rangedSkill": 0.8}},
  {"id": "fractured-ribs","name": "Fractured Ribs","days": [3,4],"effects": {"maxFatigue": 0.7}},
  {"id": "crushed-finger","name": "Crushed Finger","days": [2,3],"effects": {"meleeSkill": 0.95,"rangedSkill": 0.95}},
  {"id": "fractured-elbow","name": "Fractured Elbow","days": [3,5],"effects": {"meleeDefense": 0.75}},
  {"id": "sprained-ankle","name": "Sprained Ankle","days": [2,3],"effects": {"movement": 1,"initiative": 0.8}},
  {"id": "bruised-leg","name": "Bruised Leg","days": [2,3],"effects": {"movement": 1,"initiative": 0.8}},
  {"id": "dislocated-shoulder","name": "Dislocated Shoulder","days": [5,7],"effects": {"ap": -3}},
  {"id": "broken-arm","name": "Broken Arm","days": [5,7],"effects": {"meleeSkill": 0.5,"rangedSkill": 0.5,"damage": 0.5}},
  {"id": "smashed-hand","name": "Smashed Hand","days": [4,6],"effects": {"meleeSkill": 0.6,"rangedSkill": 0.6}},
  {"id": "broken-ribs","name": "Broken Ribs","days": [5,7],"effects": {"maxFatigue": 0.6}},
  {"id": "broken-leg","name": "Broken Leg","days": [5,7],"effects": {"movement": 2,"initiative": 0.6}},
  {"id": "broken-nose","name": "Broken Nose","days": [3,5],"effects": {"fatigueRecovery": -5}},
  {"id": "severe-concussion","name": "Severe Concussion","days": [3,5],"effects": {"vision": -2,"initiative": 0.5,"meleeSkill": 0.5,"rangedSkill": 0.5,"meleeDefense": 0.5,"rangedDefense": 0.5}},
  {"id": "crushed-windpipe","name": "Crushed Windpipe","days": [3,5],"effects": {"fatigueRecovery": -10,"maxFatigue": 0.5}},
  {"id": "fractured-skull","name": "Fractured Skull","days": [6,9],"effects": {"vision": -2,"initiative": 0.5,"meleeSkill": 0.5,"rangedSkill": 0.5,"meleeDefense": 0.5,"rangedDefense": 0.5}},
  {"id": "deep-abdominal-cut","name": "Deep Abdominal Cut","days": [3,4],"effects": {"maxHp": 0.75,"maxFatigue": 0.75},"initialHpCap": 0.75},
  {"id": "cut-leg-muscles","name": "Cut Leg Muscles","days": [3,5],"effects": {"meleeDefense": 0.6,"initiative": 0.6}},
  {"id": "cut-arm-sinew","name": "Cut Arm Sinew","days": [4,6],"effects": {"damage": 0.6}},
  {"id": "cut-arm","name": "Cut Arm","days": [2,4],"effects": {"meleeSkill": 0.85,"rangedSkill": 0.85}},
  {"id": "cut-artery","name": "Cut Artery","days": [1,3],"effects": {"maxHp": 0.65},"freshBleed": 3},
  {"id": "exposed-ribs","name": "Exposed Ribs","days": [3,6],"effects": {"maxHp": 0.65},"initialHpCap": 0.65},
  {"id": "split-shoulder","name": "Split Shoulder","days": [4,6],"effects": {"damage": 0.5}},
  {"id": "cut-achilles-tendon","name": "Cut Achilles Tendon","days": [3,5],"effects": {"movement": 2,"initiative": 0.7}},
  {"id": "split-hand","name": "Split Hand","days": [5,7],"effects": {"meleeSkill": 0.5,"rangedSkill": 0.5}},
  {"id": "deep-chest-cut","name": "Deep Chest Cut","days": [5,6],"effects": {"maxHp": 0.65,"maxFatigue": 0.65,"meleeSkill": 0.65,"rangedSkill": 0.65},"initialHpCap": 0.65},
  {"id": "ripped-ear","name": "Ripped Ear","days": [2,3],"effects": {"initiative": 0.85}},
  {"id": "split-nose","name": "Split Nose","days": [2,4],"effects": {"fatigueRecovery": -5},"excludes": ["broken-nose"]},
  {"id": "pierced-cheek","name": "Pierced Cheek","days": [1,2],"effects": {"fatigueRecovery": -3}},
  {"id": "grazed-neck","name": "Grazed Neck","days": [1,2],"effects": {"maxHp": 0.85},"freshBleed": 1},
  {"id": "deep-face-cut","name": "Deep Face Cut","days": [2,3],"effects": {"meleeSkill": 0.75,"rangedSkill": 0.75,"meleeDefense": 0.75,"rangedDefense": 0.75,"vision": -2}},
  {"id": "cut-throat","name": "Cut Neck Vein","days": [1,4],"effects": {"maxHp": 0.5},"freshBleed": 6},
  {"id": "pierced-leg-muscles","name": "Pierced Leg Muscles","days": [3,5],"effects": {"meleeDefense": 0.7,"initiative": 0.7}},
  {"id": "injured-shoulder","name": "Injured Shoulder","days": [3,4],"effects": {"damage": 0.75}},
  {"id": "pierced-hand","name": "Pierced Hand","days": [3,4],"effects": {"meleeSkill": 0.8,"rangedSkill": 0.8}},
  {"id": "pierced-chest","name": "Pierced Chest","days": [3,4],"effects": {"maxFatigue": 0.8}},
  {"id": "pierced-side","name": "Pierced Side","days": [3,4],"effects": {"maxFatigue": 0.8}},
  {"id": "pierced-arm-muscles","name": "Pierced Arm Muscles","days": [3,4],"effects": {"meleeSkill": 0.75,"rangedSkill": 0.75}},
  {"id": "grazed-kidney","name": "Grazed Kidney","days": [3,6],"effects": {"maxHp": 0.4},"initialHpCap": 0.4},
  {"id": "pierced-lung","name": "Pierced Lung","days": [5,7],"effects": {"maxFatigue": 0.4}},
  {"id": "stabbed-guts","name": "Stabbed Guts","days": [3,5],"effects": {"maxHp": 0.6,"maxFatigue": 0.6},"initialHpCap": 0.6},
  {"id": "injured-knee-cap","name": "Injured Knee Cap","days": [5,8],"effects": {"movement": 2,"initiative": 0.6}},
  {"id": "grazed-eye-socket","name": "Grazed Eye Socket","days": [2,4],"effects": {"rangedSkill": 0.5,"vision": -2}},
  {"id": "burnt-legs","name": "Burnt Leg","days": [2,3],"effects": {"movement": 1,"initiative": 0.8}},
  {"id": "burnt-hands","name": "Burnt Hands","days": [4,5],"effects": {"meleeSkill": 0.75,"rangedSkill": 0.75}},
  {"id": "burnt-face","name": "Burnt Face","days": [3,4],"effects": {"meleeSkill": 0.75,"rangedSkill": 0.75,"meleeDefense": 0.75,"rangedDefense": 0.75,"vision": -2}},
  {"id": "inhaled-flames","name": "Inhaled Flames","days": [4,6],"effects": {"ap": -2,"maxFatigue": 0.6}}
].map(entry => Object.freeze({...entry, days:Object.freeze(entry.days), effects:Object.freeze(entry.effects), ...(entry.excludes?{excludes:Object.freeze(entry.excludes)}:{})})));
export const INJURY_BY_ID = new Map(INJURIES.map(entry => [entry.id, entry]));
export const INJURY_POOLS = Object.freeze(Object.fromEntries(Object.entries({
  "BluntBody": [["fractured-hand",0.25],["fractured-ribs",0.25],["crushed-finger",0.25],["fractured-elbow",0.25],["sprained-ankle",0.25],["bruised-leg",0.25],["dislocated-shoulder",0.5],["broken-arm",0.5],["smashed-hand",0.5],["broken-ribs",0.5],["broken-leg",0.5]],
  "BluntHead": [["broken-nose",0.25],["severe-concussion",0.5],["crushed-windpipe",0.5],["fractured-skull",0.6]],
  "CuttingBody": [["deep-abdominal-cut",0.25],["cut-leg-muscles",0.25],["cut-arm-sinew",0.25],["cut-arm",0.25],["cut-artery",0.25],["exposed-ribs",0.25],["split-shoulder",0.5],["cut-achilles-tendon",0.5],["split-hand",0.5],["deep-chest-cut",0.5]],
  "CuttingHead": [["ripped-ear",0.25],["split-nose",0.25],["pierced-cheek",0.25],["grazed-neck",0.25],["deep-face-cut",0.5],["cut-throat",0.5]],
  "PiercingBody": [["pierced-leg-muscles",0.25],["injured-shoulder",0.25],["pierced-hand",0.25],["pierced-chest",0.25],["pierced-side",0.25],["pierced-arm-muscles",0.25],["grazed-kidney",0.5],["pierced-lung",0.5],["stabbed-guts",0.5],["injured-knee-cap",0.5]],
  "PiercingHead": [["ripped-ear",0.25],["pierced-cheek",0.25],["grazed-neck",0.25],["grazed-eye-socket",0.5],["crushed-windpipe",0.5]],
  "BurningBody": [["burnt-legs",0.25],["burnt-hands",0.5]],
  "BurningHead": [["burnt-face",0.25],["inhaled-flames",0.5]]
}).map(([key,pool])=>[key,Object.freeze(pool.map(entry=>Object.freeze(entry)))])));

export function copyInjuries(injuries = []) { return injuries.map(wound => ({...wound})); }

// Unit attributes remain their unmodified values; read effects through this layer.
// Fresh maximum-HP penalties start after combat; existing wounds already affect unit.maxHp.
export function injuryMultiplier(person, key) {
  return (person.injuries ?? []).reduce((value, wound) => value * (INJURY_BY_ID.get(wound.id)?.effects[key] ?? 1), 1);
}
export function injuryAdjustment(person, key) {
  return (person.injuries ?? []).reduce((value, wound) => value + (INJURY_BY_ID.get(wound.id)?.effects[key] ?? 0), 0);
}
export function injuryStat(person, key) {
  if(!person.injuries?.length)return person[key];
  return Math.max(0,Math.floor(person[key]*injuryMultiplier(person,key)+1e-9));
}
export function injuryRange(person, weapon) {
  const visionLoss=injuryAdjustment(person,'vision');
  return weapon.ranged && visionLoss<0 ? Math.max(1,Math.min(weapon.range,7+visionLoss)) : weapon.range;
}
export function freshInjuryBleeding(person) {
  return (person.injuries ?? []).reduce((damage,wound) => damage + (wound.fresh ? INJURY_BY_ID.get(wound.id)?.freshBleed ?? 0 : 0),0);
}
export function injuryHealingRange(wound, surgeon = false) {
  const definition = INJURY_BY_ID.get(wound.id);
  return definition.days.map(days => Math.max(1, days * (wound.treated ? .5 : 1) - Number(surgeon)));
}
export function injuryRemainingDays(wound, surgeon = false) {
  return injuryHealingRange(wound,surgeon).map(days => Math.max(1, Math.ceil(days-wound.healingDays)));
}
export function injuryDailyMedicine(party) { return party.reduce((sum,person)=>sum+(person.injuries?.length??0),0); }

export function validInjuries(wounds, day, {battle = false} = {}) {
  return Array.isArray(wounds) && wounds.length <= INJURIES.length
    && new Set(wounds.map(wound=>wound?.id)).size === wounds.length
    && wounds.every(wound => wound && typeof wound === 'object' && !Array.isArray(wound)
      && Object.keys(wound).sort().join(',') === (battle ? 'acquiredDay,fresh,healingDays,id,sourceId,treated' : 'acquiredDay,healingDays,id,treated')
      && INJURY_BY_ID.has(wound.id) && Number.isSafeInteger(wound.acquiredDay) && wound.acquiredDay>=1 && wound.acquiredDay<=day
      && Number.isSafeInteger(wound.healingDays) && wound.healingDays>=0 && wound.healingDays<=day-wound.acquiredDay
      && typeof wound.treated==='boolean' && (!battle || typeof wound.fresh==='boolean' && (wound.sourceId===null || typeof wound.sourceId==='string')));
}

// Damage families belong to the action, including mixed pools and ranged projectiles.
const BLUNT = new Set(['bash','cudgel','crumble','batter','hammer','smite','shatter','knock-out','strike-down','knock-over','flail','cascade','hail','pound','thresh','flail-headshot','stunning-stone','sling-stone','crush-armor','demolish-armor']);
const PIERCING = new Set(['thrust','stab','puncture','prong','impale','estoc-thrust','lunge','deathblow','shoot-bolt','impaler-bolt','piercing-bolt','quick-shot','aimed-shot','throw-javelin','rupture']);
export function attackInjuryPool(weapon, action = {}, head = false) {
  if (action.noDamage || action.dot || action.id==='split-shield') return [];
  const location = head ? 'Head' : 'Body';
  const id = ['charge','power-throw'].includes(action.id) ? equipmentSkills(weapon)[0]?.id : action.id;
  let family = BLUNT.has(id) ? 'Blunt' : PIERCING.has(id) ? 'Piercing' : 'Cutting';
  if (!id && weapon.ranged) family = /sling/.test(weapon.visual??'') ? 'Blunt' : /axe/.test(weapon.visual??'') ? 'Cutting' : 'Piercing';
  return INJURY_POOLS[family+location];
}
export function eligibleInjuries(target, pool, healthDamage, head = false, thresholdMultiplier = 1) {
  if (target.hp<=0 || target.undeadTraitsVersion===1 || target.injuryImmune===true || healthDamage<10 || !(thresholdMultiplier>0)) return [];
  const held = new Set((target.injuries ?? []).map(wound=>wound.id));
  return pool.filter(([id,threshold]) => !held.has(id)
    && !(INJURY_BY_ID.get(id)?.excludes ?? []).some(excluded=>held.has(excluded))
    && threshold * thresholdMultiplier * (head?1.25:1) <= healthDamage/target.maxHp).map(([id])=>id);
}

const EFFECT_LABELS = {maxHp:'maximum HP',maxFatigue:'maximum fatigue',meleeSkill:'melee skill',rangedSkill:'ranged skill',meleeDefense:'melee defense',rangedDefense:'ranged defense',initiative:'initiative',damage:'damage dealt',movement:'movement AP per tile',fatigueRecovery:'fatigue recovery per turn',ap:'AP per turn',vision:'vision (ranged reach cap)'};
export function injuryEffectText(wound) {
  const definition=INJURY_BY_ID.get(wound.id);
  if(!definition)return '';
  return Object.entries(definition.effects).map(([key,value]) => {
    if(key==='maxHp'&&wound.fresh)return definition.freshBleed ? `${definition.freshBleed} bleeding HP per round until combat ends; −${Math.round((1-value)*100)}% maximum HP afterward` : `−${Math.round((1-value)*100)}% maximum HP after combat`;
    return `${['movement','fatigueRecovery','ap','vision'].includes(key)?(value>0?'+':'−')+Math.abs(value):'−'+Math.round((1-value)*100)+'%'} ${EFFECT_LABELS[key]}`;
  }).join(' · ');
}
