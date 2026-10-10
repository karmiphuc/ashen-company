import { createGame, SETTLEMENTS, getUndeadEncounters, createFamedItemId, validateSave } from '../../src/engine.js';
import { advanceAshenWinter, resolveAshenObjective } from '../../src/undead-crisis.js';
export function completedCompany(seed=719) {
  const state=createGame(seed), original=structuredClone(state.party[0]);
  while(state.party.length<6)state.party.push({...structuredClone(original),id:`veteran-${state.party.length}`});
  state.party.forEach(p=>p.level=7);state.formation=Array.from({length:36},(_,i)=>state.party[i]?.id??null);
  state.day=60;state.shipments={};state.shipmentLegacyThroughDay=60;
  const context={settlements:SETTLEMENTS,report(){}};
  const time=hour=>{state.day=Math.floor(hour/24)+1;state.hour=hour%24;state.shipmentLegacyThroughDay=state.day;};
  advanceAshenWinter(state,context);time(state.ashenWinter.warningHour);advanceAshenWinter(state,context);
  time(state.ashenWinter.activationHour);advanceAshenWinter(state,context);
  for(const encounter of getUndeadEncounters(state).filter(e=>e.kind==='undead-commander'))resolveAshenObjective(state,encounter,context);
  state.inventory=[createFamedItemId('arming-sword',42,7)];state.inventoryCondition=[null];state.position={x:350,y:460};
  return validateSave(state);
}
