import {completedCompany} from './legacy-company.mjs';
import {getItem,createFamedItemId,shieldMaximum,validateSave} from '../../src/engine.js';
import {LEGACY_SET_SLOTS} from '../../src/entombed-legacy.js';
export function entombedCompany(){
 const state=completedCompany();state.inventory=[];state.inventoryCondition=[];
 const indices=Array.from({length:3},(_,n)=>Object.fromEntries(LEGACY_SET_SLOTS.map(slot=>{
  const base={helmet:'greathelm',armor:'plate-harness',attachment:'bone-platings',attachment2:'heraldic-plates',mount:'war-horse',weapon:n===1?'greatsword':'arming-sword',shield:'heater-shield'}[slot];
  if(slot==='shield'&&n===1)return [slot,null];
  const id=['helmet','armor','weapon','shield'].includes(slot)?createFamedItemId(base,42+n*13+LEGACY_SET_SLOTS.indexOf(slot),7):base,item=getItem(id);
  if(!item)throw new Error(`Unknown fixture item: ${id}`);
  const i=state.inventory.length;state.inventory.push(id);state.inventoryCondition.push(item.slot==='shield'?shieldMaximum(id)-2:item.armor!==undefined?Math.max(0,item.armor-3):null);return [slot,i];
 })));
 return {state:validateSave(state),indices};
}
