// Earned gear only: use native swaps, preserving conditions and displaced items.
// Keep each fighter's weapon style; an archer must not sell their bow for a mace.
export function rivalSaleableLoot(company,context){return company.inventory.some(id=>!['named','famed'].includes(context.getItem(id)?.rarity));}
function compatible(person,item,current){
 if(item.slot!=='weapon')return item.slot!=='shield'||!current?.twoHanded;
 if(Boolean(item.ranged)!==Boolean(current?.ranged))return false;
 return Boolean(item.twoHanded)===Boolean(current?.twoHanded)&&((item.range??1)>1)===((current?.range??1)>1);
}
function score(person,item,condition,context){
 if(!item)return 0;
 if(item.slot==='weapon')return ((item.damageMin??0)+(item.damageMax??0))/2*(1+(item.armorDamage??1)*.15)+(item.hitBonus??0)*.5-(item.fatigueCost??0)*.2;
 if(item.slot==='mount')return (item.travelBonus??0)*60+(item.damageBonus??0)*100+(item.meleeDefenseBonus??0)-(item.fatigue??0)*.5;
 if(item.slot==='shield')return (item.defense??0)+(item.rangedDefense??0)*.5+(condition??0)*.15-(item.fatigue??0)*.5;
 return (condition??0)*.75+(context.itemCondition(item.id)??0)*.25-(item.fatigue??0)*3;
}
export function equipRivalLoot(view,context){
 let swaps=0;
 for(const person of view.party){
  for(const slot of ['weapon','armor','helmet','shield','attachment','mount']){
   const current=context.getItem(person.equipment[slot]);
   const key={armor:'body',helmet:'head',shield:'shield',attachment:'attachment'}[slot];
   const baseline=score(person,current,key?person.armorDurability[key]:null,context);
   const candidates=view.inventory.map((id,index)=>({id,index,item:context.getItem(id)})).filter(c=>c.item?.slot===slot&&compatible(person,c.item,slot==='shield'?context.getItem(person.equipment.weapon):current))
    .map(c=>({...c,score:score(person,c.item,view.inventoryCondition[c.index],context)})).filter(c=>c.score>baseline+Math.max(1,Math.abs(baseline)*.05)).sort((a,b)=>b.score-a.score||a.index-b.index);
   for(const candidate of candidates){
    // Validate the entire swap in a small isolated native view. This includes
    // fatigue, matching sets, perk effects, shield conflicts and stash limits.
    const trial={...view,party:[structuredClone(person)],inventory:[...view.inventory],inventoryCondition:[...view.inventoryCondition],log:[]};
    if(!context.equipItem(trial,person.id,candidate.id).ok)continue;
    const before=context.stats(person),after=context.stats(trial.party[0]);
    if(after.maxFatigue<Math.min(30,before.maxFatigue))continue;
    if(['armor','helmet','attachment'].includes(slot)&&(after.meleeDefense<before.meleeDefense||after.rangedDefense<before.rangedDefense))continue;
    if(context.equipItem(view,person.id,candidate.id).ok)swaps++;
    break;
   }
  }
 }
 return swaps;
}
