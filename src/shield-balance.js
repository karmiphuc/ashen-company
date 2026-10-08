// The previous campaign baselines are only available to imported ongoing battles.
export const PREVIOUS_SHIELDS=Object.freeze({
 buckler:[6,8,2], 'round-shield':[12,13,5], 'kite-shield':[20,18,8],
 'heater-shield':[16,16,6], adarga:[14,15,3],
 'painted-round-shield':[15,15,4], 'painted-heater-shield':[18,18,6],
 'painted-tower-shield':[22,22,12], 'northern-heartwood-shield':[17,17,5],
 'northern-iron-round-shield':[20,20,8],
});
function replaceBase(id,replace){
 if(typeof id!=='string')return id;
 const parts=id.split(':'),index=parts.length===1?0:1;
 parts[index]=replace(parts[index]);return parts.join(':');
}
export function previousShieldId(id){return replaceBase(id,base=>Object.hasOwn(PREVIOUS_SHIELDS,base)?`legacy-${base}`:base);}
export function currentShieldId(id){return replaceBase(id,base=>base.startsWith('legacy-')&&Object.hasOwn(PREVIOUS_SHIELDS,base.slice(7))?base.slice(7):base);}
export function previousShieldDefinitions(items){return items.filter(i=>Object.hasOwn(PREVIOUS_SHIELDS,i.id)).map(item=>{
 const [armor,defense,fatigue]=PREVIOUS_SHIELDS[item.id];
 const old={...item,id:`legacy-${item.id}`,armor,defense,fatigue,durability:Math.max(24,armor*4),legacyShieldId:item.id};
 delete old.rangedDefense;return Object.freeze(old);
});}
function maximum(item){return item?.slot==='shield'?item.durability??Math.max(24,item.armor*4):0;}
export function rebalanceShieldCondition(id,condition,getItem,{previous=false}={}){
 const target=currentShieldId(id),source=previous?previousShieldId(id):id;
 if(source===target||condition===undefined||condition===null)return condition;
 const before=maximum(getItem(source)),after=maximum(getItem(target));
 if(!before||!after)return condition; // The normal save validator rejects unknown IDs.
 if(!Number.isSafeInteger(condition)||condition<0||condition>before)throw new TypeError('Invalid prior shield condition.');
 return condition===0?0:Math.max(1,Math.floor(condition*after/before));
}
function remapBattle(value){
 if(Array.isArray(value))return value.map(remapBattle);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,remapBattle(v)]));
 return typeof value==='string'?previousShieldId(value):value;
}
// Conversion is one-time, nonmutating on import, and leaves broken shields broken.
export function migrateShieldBalance(input,getItem,getUndeadEncounters,{inPlace=false}={}){
 if(input.shieldBalanceVersion!==undefined&&input.shieldBalanceVersion!==1)throw new TypeError('Invalid shield balance version.');
 const previous=input.shieldBalanceVersion===undefined;
 if(!previous){
  if(input.battle)return input;
  const aliased=id=>currentShieldId(id)!==id;
  const hasAliases=(input.party??[]).some(p=>aliased(p.equipment?.shield)||aliased(p.reserveEquipment?.shield))
   ||(input.inventory??[]).some(aliased)
   ||Object.values(input.marketStock??{}).some(m=>(m.buyback??[]).some(r=>aliased(r.itemId)));
  if(!hasAliases)return input;
 }
 const state=inPlace?input:structuredClone(input);
 if(previous&&state.battle)state.battle=remapBattle(state.battle);
 const condition=(id,value)=>rebalanceShieldCondition(id,value,getItem,{previous});
 for(const person of state.party??[]){
  for(const [set,key]of [['equipment','shield'],['reserveEquipment','reserveShield']]){
   const id=person[set]?.shield;if(!id)continue;
   if(previous&&state.battle){person[set].shield=previousShieldId(id);continue;}
   if(person.armorDurability)person.armorDurability[key]=condition(id,person.armorDurability[key]);
   person[set].shield=currentShieldId(id);
  }
 }
 if(Array.isArray(state.inventory))for(let i=0;i<state.inventory.length;i++){
  const id=state.inventory[i];if(Array.isArray(state.inventoryCondition))state.inventoryCondition[i]=condition(id,state.inventoryCondition[i]);
  state.inventory[i]=currentShieldId(id);
 }
 for(const market of Object.values(state.marketStock??{}))for(const row of market.buyback??[]){
  row.condition=condition(row.itemId,row.condition);row.itemId=currentShieldId(row.itemId);
 }
 if(previous)for(const encounter of getUndeadEncounters(state))for(const enemy of encounter.enemies){
  if(enemy.savedDamage)enemy.savedDamage.shieldDurability=condition(enemy.shield,enemy.savedDamage.shieldDurability);
 }
 state.shieldBalanceVersion=1;return state;
}
