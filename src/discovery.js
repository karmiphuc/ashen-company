import { townEventHash as hash } from './town-events.js';

export const BOUNTY_HUNTER_COST = 5000;
export const CHAMPION_BOUNTY = 300;
export const CHAMPION_GEAR_CHANCE = .125;
const EVENTS = [
  { id:'challengers', name:'Age of Challengers', champion:8, famed:0, mount:0, description:'Renowned fighters have gathered across the regions. Champion encounter chance rises by 8 percentage points.' },
  { id:'relic-rumors', name:'Relic Rumors', champion:0, famed:15, mount:0, description:'Old caches and trophy hoards are being uncovered. Camp named-item chance rises by 15 percentage points.' },
  { id:'beast-migration', name:'Great Beast Migration', champion:0, famed:0, mount:12, description:'Rare beasts and armored steeds are changing hands. Elite wild-camp mount rewards rise from 12% to 24%.' },
];

// One seeded opportunity per week; opening menus and reloading never reroll it.
export function discoveryEvent(state) {
  const week=Math.floor((state.day-1)/7),key=`${state.seed}:${week}:discovery-event`;
  if(hash(`${key}:roll`)%100>=30)return null;
  const startDay=week*7+1+hash(`${key}:start`)%4,endDay=startDay+2;
  if(state.day<startDay||state.day>endDay)return null;
  return {...EVENTS[hash(`${key}:kind`)%EVENTS.length],startDay,endDay,remainingDays:endDay-state.day+1};
}
export function discoveryBonuses(state,encounter) {
  const cycle=encounter.generation??encounter.spawnCycle;
  const frozen=state.discoveryRolls?.[encounter.id];
  if(frozen&&frozen.cycle===cycle)return {champion:frozen.champion,famed:frozen.famed,mount:frozen.mount};
  const event=discoveryEvent(state);
  return {champion:(state.retinue?.bountyHunter?5:0)+(event?.champion??0),famed:event?.famed??0,mount:event?.mount??0};
}
export function championChance(state,difficulty,bonus=0) {
  return difficulty<1?0:[0,1,3,6][difficulty]+bonus;
}
export function championExtraGear(state, encounter, enemy, index, getItem, createNamedItem) {
  if (!enemy.champion && !/ Champion$/.test(enemy.name)) return {...enemy};
  const cycle=encounter.generation??encounter.spawnCycle??encounter.acceptedDay??0;
  const key=`${state.seed}:${encounter.id}:${cycle}:true-champion`,i=index;
  const gear = {...enemy};
  const frozen = state.discoveryRolls?.[encounter.id];
  // Previously engaged generations retain their original loadouts.
  if (!frozen || frozen.cycle !== cycle || frozen.championGearVersion === 1) {
    const slots = i === 0 ? ['armor','helmet','shield','reserveWeapon','reserveShield'] : ['armor','helmet'];
    for (const slot of slots) {
      if (hash(`${key}:${i}:extra:${slot}:chance`) % 1000 >= CHAMPION_GEAR_CHANCE * 1000) continue;
      const baseId = enemy[slot] ?? (slot === 'reserveWeapon' ? enemy.weapon : slot === 'reserveShield' ? enemy.shield : null);
      const base = getItem(baseId);
      if (!base || slot === 'reserveShield' && getItem(enemy.reserveWeapon ?? enemy.weapon)?.twoHanded) continue;
      if (enemy[slot] && ['famed','named'].includes(base.rarity)) continue;
      gear[slot] = createNamedItem(base.baseId ?? base.id, hash(`${key}:${i}:extra:${slot}:item`));
    }
    if (getItem(gear.reserveWeapon)?.twoHanded) gear.reserveShield = null;
  }
  return gear;
}
export function championRoster(state,encounter,getItem,createFamedItemId,{force=false}={}) {
  const bonus=discoveryBonuses(state,encounter),cycle=encounter.generation??encounter.spawnCycle??encounter.acceptedDay??0;
  const key=`${state.seed}:${encounter.id}:${cycle}:true-champion`;
  const chance=championChance(state,encounter.difficulty,bonus.champion);
  // Every fighter rolls independently; forced bounties guarantee their leader
  // without preventing retainers or existing named elites from being champions.
  return encounter.enemies.map((enemy,i)=>{
    const rollKey=i===0?`${key}:roll`:`${key}:${i}:roll`;
    const appears=enemy.champion||/ Champion$/.test(enemy.name)||(force&&i===0)||hash(rollKey)%100<chance;
    if(!appears)return {...enemy};
    const weapon=getItem(enemy.weapon);
    if(!weapon)return {...enemy};
    const named=['famed','named'].includes(weapon.rarity)?weapon.id:createFamedItemId(weapon.id,hash(`${key}:${i}:weapon`));
    const gear = championExtraGear(state, encounter, {...enemy,champion:true}, i, getItem, createFamedItemId);
    const title=['the Blooded','the Unbroken','the Crow','the Oathless'][hash(i===0?`${key}:title`:`${key}:${i}:title`)%4];
    return {...gear,weapon:named,champion:true,championItemId:named,name:`${enemy.name.replace(/ Champion$/,'')} ${title} Champion`.slice(0,80)};
  });
}
export function bountyOffer(state,town,serial,point,factionId) {
  const week=Math.floor((state.day-1)/7);
  if(state.retinue?.bountyHunterUnlocked||state.retinue?.bountyBoards?.[town.id]===week||town.kind==='village'
    ||hash(`${state.seed}:${town.id}:${week}:bounty-board`)%100>=6)return null;
  return {id:`bounty-${serial}`,type:'bounty',from:town.id,to:town.id,deserterId:`bounty-${serial}`,deserterPoint:{...point},factionId,difficulty:3,reward:1000,renown:4};
}
