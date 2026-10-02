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
  // Exactly one worn piece becomes a named-quality variant on a 25% encounter roll.
  // Its original artwork/culture survives; the enemy really wears and benefits from it.
  if(townEventHash(`${key}:named-roll`)%4===0) {
    const candidates=enemies.flatMap((e,index)=>['armor','helmet','weapon','shield'].filter(slot=>e[slot]&&e[slot].length<=40&&!getItem(e[slot])?.rarity).map(slot=>({index,slot,id:e[slot]})));
    if(candidates.length){const chosen=candidates[townEventHash(`${key}:named-slot`)%candidates.length];
      enemies[chosen.index][chosen.slot]=`famed:${chosen.id}:${townEventHash(`${key}:named-item`)}`;
      enemies[chosen.index].name+=' Champion';
    }
  }
  return {id:contract.deserterId,kind:'deserters',name:`${faction.name} Deserters`,...contract.deserterPoint,
    difficulty:3,veteranRank:2,factionId:faction.id,factionLabel:faction.name,enemies,reward:contract.reward,cleared:false,
    description:`Eight elite ${faction.name} deserters keep their faction's arms and armor. Hard contract: one worn item has a 25% chance to be named-quality. Recover it through battle salvage; destroyed armor is lost.`};
}
