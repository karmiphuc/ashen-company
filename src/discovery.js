import { townEventHash as hash } from './town-events.js';

export const BOUNTY_HUNTER_COST = 5000;
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
export function championRoster(state,encounter,getItem,createFamedItemId,{force=false}={}) {
  const bonus=discoveryBonuses(state,encounter),cycle=encounter.generation??encounter.spawnCycle??encounter.acceptedDay??0;
  const key=`${state.seed}:${encounter.id}:${cycle}:true-champion`;
  const chance=championChance(state,encounter.difficulty,bonus.champion);
  // Existing named elite leaders are promoted into the full champion system too.
  const leader=encounter.enemies.findIndex(enemy=>/ Champion$/.test(enemy.name));
  const index=leader>=0?leader:0;
  const appears=force||leader>=0||hash(`${key}:roll`)%100<chance;
  return encounter.enemies.map((enemy,i)=>{
    if(!appears||i!==index)return {...enemy};
    const weapon=getItem(enemy.weapon);
    if(!weapon)return {...enemy};
    const named=['famed','named'].includes(weapon.rarity)?weapon.id:createFamedItemId(weapon.id,hash(`${key}:${i}:weapon`));
    const title=['the Blooded','the Unbroken','the Crow','the Oathless'][hash(`${key}:title`)%4];
    return {...enemy,weapon:named,champion:true,championItemId:named,name:`${enemy.name.replace(/ Champion$/,'')} ${title} Champion`.slice(0,80)};
  });
}
export function bountyOffer(state,town,serial,point,factionId) {
  const week=Math.floor((state.day-1)/7);
  if(state.retinue?.bountyHunterUnlocked||state.retinue?.bountyBoards?.[town.id]===week||town.kind==='village'
    ||hash(`${state.seed}:${town.id}:${week}:bounty-board`)%100>=6)return null;
  return {id:`bounty-${serial}`,type:'bounty',from:town.id,to:town.id,deserterId:`bounty-${serial}`,deserterPoint:{...point},factionId,difficulty:3,reward:1000,renown:4};
}
