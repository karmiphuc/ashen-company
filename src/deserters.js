import { townEventHash } from './town-events.js';
import { factionTroops, soldierFactionAt, SOLDIER_FACTIONS } from './faction-patrols.js';

export function deserterOffer(state,town,serial,point) {
  const week=Math.floor((state.day-1)/7);
  // One stable board roll per week. Rerolling ordinary jobs cannot summon deserters.
  if(state.deserterBoards?.[town.id]===week||town.kind==='village'||townEventHash(`${state.seed}:${town.id}:${week}:deserter-board`)%100>=10)return null;
  return {id:`deserters-${serial}`,type:'deserters',from:town.id,to:town.id,
    deserterId:`deserters-${serial}`,deserterPoint:{...point},factionId:soldierFactionAt(town.x,town.y).id,
    difficulty:3,reward:850,renown:3};
}
export function deserterEncounter(seed,contract,getItem) {
  const faction=SOLDIER_FACTIONS.find(f=>f.id===contract.factionId);
  const key=`${seed}:${contract.deserterId}:${contract.acceptedDay}`;
  const enemies=factionTroops(key,faction.id,3,8).map(e=>({...e,name:`Deserter ${e.name}`}));
  return {id:contract.deserterId,kind:'deserters',name:`${faction.name} Deserters`,...contract.deserterPoint,
    difficulty:3,veteranRank:2,factionId:faction.id,factionLabel:faction.name,enemies,reward:contract.reward,cleared:false,
    description:`Eight elite ${faction.name} deserters keep their faction's arms and armor. Hard contract: on completion, a 25% chance upgrades one non-named item equipped by your company to named quality.`};
}

export function deserterEquipmentReward(seed,contract,party,getItem) {
  const key=`${seed}:${contract.deserterId}:${contract.acceptedDay}`;
  if(townEventHash(`${key}:named-roll`)%4!==0)return null;
  const candidates=party.filter(p=>p.hp>0).flatMap(person=>['armor','helmet','weapon','shield'].flatMap(slot=>{
    const id=person.equipment?.[slot],item=getItem(id);
    return item&&id.length<=40&&!['named','famed'].includes(item.rarity)?[{personId:person.id,slot,id}]:[];
  }));
  if(!candidates.length)return null;
  return {...candidates[(townEventHash(`${key}:company-slot`)>>>8)%candidates.length],seed:townEventHash(`${key}:company-item`)};
}
