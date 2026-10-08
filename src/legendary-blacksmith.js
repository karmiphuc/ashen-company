export const BLACKSMITH_STAGES=Object.freeze([
 {name:'Cold Hearth',objective:'Bring 8 Iron, 6 Timber and 10 Tools to Odran in Ironford.',reward:400},
 {name:'Anvil in Chains',site:'Anvil Thieves',objective:'Defeat the Anvil Thieves, claim the battle result, then return the anvil to Ironford.',reward:700,size:8,difficulty:2},
 {name:'The First Temper',site:'The Buried Furnace',objective:'Defeat the ancient custodians, claim the tempering plate, and return to Ironford.',reward:1000,size:10,difficulty:3},
 {name:"A Master's Oath",site:"The Collector's Guard",objective:'Kill the Collector champion, claim the pattern-book, and return to Ironford. An escaped Collector must be hunted again.',reward:0,size:10,difficulty:3},
]);
export function initialBlacksmith(){return {version:1,lastCheckDay:null,triggeredDay:null,announcement:'none',quests:BLACKSMITH_STAGES.map(()=>({status:'locked',acceptedDay:null,encounter:null,survivors:null,damage:{}})),forgeSerial:0,freeUse:false,rewardId:null,rewardClaimed:false};}
export function blacksmithIndex(state){return (state.legendaryBlacksmith?.quests??[]).findIndex(q=>['offered','active','ready'].includes(q.status));}
export function blacksmithUnlocked(state){return state.legendaryBlacksmith?.quests?.[3]?.status==='turnedIn';}
export function countOwnedNamed(state,getItem){const named=id=>['named','famed'].includes(getItem(id)?.rarity);let n=state.inventory.filter(named).length;for(const p of state.party.filter(p=>p.hp>0))n+=[...Object.values(p.equipment),...Object.values(p.reserveEquipment??{}),...(p.accessories??[])].filter(named).length;return n;}
export function discoverBlacksmith(state,getItem){
 if(state.battle||state.gameOver)return false;
 const chain=state.legendaryBlacksmith??=initialBlacksmith();
 if(chain.triggeredDay!==null||chain.lastCheckDay===state.day)return false;
 chain.lastCheckDay=state.day;
 if(countOwnedNamed(state,getItem)<5)return false;
 chain.triggeredDay=state.day;chain.announcement='pending';chain.quests[0].status='offered';return true;
}
export function blacksmithEncounters(state){const chain=state.legendaryBlacksmith;if(!chain)return [];return chain.quests.flatMap((q,index)=>q.status!=='active'||!q.encounter?[]:[{...q.encounter,enemies:q.survivors.map(i=>({...q.encounter.enemies[i],troopIndex:i,...(q.damage[i]?{savedDamage:{...q.damage[i]}}:{})})),stage:index+1,kind:'blacksmith',description:BLACKSMITH_STAGES[index].objective,cleared:false}]);}
export function validateBlacksmith(input,day,{getItem,validPoint,expectedEncounter,expectedReward,shieldMaximum}){
 if(input===undefined)return undefined;
 const fail=()=>{throw new TypeError('Invalid save: legendary blacksmith progression.');};
 const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===[...keys].sort().join(',');
 const canonical=o=>JSON.stringify(o,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
 const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 if(!exact(input,['version','lastCheckDay','triggeredDay','announcement','quests','forgeSerial','freeUse','rewardId','rewardClaimed'])||input.version!==1||!['none','pending','read'].includes(input.announcement)||!integer(input.forgeSerial,0,1000000)||typeof input.freeUse!=='boolean'||typeof input.rewardClaimed!=='boolean'||!Array.isArray(input.quests)||input.quests.length!==4)fail();
 for(const key of ['lastCheckDay','triggeredDay'])if(input[key]!==null&&!integer(input[key],1,day))fail();
 if(input.triggeredDay!==null&&input.quests[0].status==='locked')fail();
 if(input.triggeredDay===null?(input.announcement!=='none'||input.quests.some(q=>q.status!=='locked')):input.announcement==='none'||input.lastCheckDay<input.triggeredDay)fail();
 let open=false,completed=true;
 for(const [i,q] of input.quests.entries()){
  if(!exact(q,['status','acceptedDay','encounter','survivors','damage'])||!['locked','offered','active','ready','turnedIn'].includes(q.status)||!q.damage||typeof q.damage!=='object'||Array.isArray(q.damage))fail();
  if(q.status==='locked'){if(q.acceptedDay!==null||q.encounter!==null||q.survivors!==null||Object.keys(q.damage).length)fail();completed=false;continue;}
  if(!completed||open)fail();
  if(q.status==='offered'){if(q.acceptedDay!==null||q.encounter!==null||q.survivors!==null||Object.keys(q.damage).length)fail();open=true;completed=false;continue;}
  if(!integer(q.acceptedDay,input.triggeredDay,day))fail();
  if(i===0){if(q.encounter!==null||q.survivors!==null||Object.keys(q.damage).length||q.status==='ready')fail();}
  else{
   const e=q.encounter,expected=expectedEncounter(i+1,q.acceptedDay);
   if(!e||!validPoint(e)||canonical(e)!==canonical(expected)||!Array.isArray(q.survivors)||new Set(q.survivors).size!==q.survivors.length||q.survivors.some(n=>!integer(n,0,e.enemies.length-1)))fail();
   if(q.status==='active'&&!q.survivors.length||['ready','turnedIn'].includes(q.status)&&q.survivors.length)fail();
   for(const [index,d] of Object.entries(q.damage))if(!q.survivors.includes(Number(index))||!exact(d,['hp','bodyArmor','headArmor','shieldDurability'])||Object.values(d).some(n=>!integer(n,0,1000))||d.hp<1||d.hp>300||d.bodyArmor>(getItem(e.enemies[index].armor)?.armor??0)||d.headArmor>(getItem(e.enemies[index].helmet)?.armor??0)||d.shieldDurability>shieldMaximum(e.enemies[index].shield))fail();
  }
  if(q.status!=='turnedIn'){open=true;completed=false;}
 }
 if(input.triggeredDay!==null&&!open&&input.quests.some(q=>q.status!=='turnedIn'))fail();
 const unlocked=input.quests[3].status==='turnedIn';
 if(!unlocked&&(input.freeUse||input.forgeSerial||input.rewardId!==null||input.rewardClaimed)||unlocked&&(input.rewardId!==expectedReward||!getItem(input.rewardId)||!['named','famed'].includes(getItem(input.rewardId).rarity))||unlocked&&input.freeUse!==(input.forgeSerial===0))fail();
 return structuredClone(input);
}
