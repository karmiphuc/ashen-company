import { moveWorldToward, nearestWorldPoint } from './world-navigation.js';
import { regionAt, roadRoute, REGIONS } from './geography.js';
import { worldEnemyTemplates, regionalOutfit, enemyCombatRole } from './regional-enemies.js';
import { regionalMountPool } from './mount-distribution.js';

export const SOLDIER_FACTIONS = Object.freeze([
  {id:'western-league',name:'Western League',relation:'ally',color:'#8fc79d',regions:['western-marches','greenwood','southern-marches'],homes:['oakwatch','greyhaven','stonebridge'],count:3,rival:'eastern-march'},
  {id:'highland-clans',name:'Highland Clans',relation:'neutral',color:'#9fc7da',regions:['northern-highlands'],homes:['ravenfell'],count:2,rival:'southern-sultanate'},
  {id:'eastern-march',name:'Eastern March',relation:'neutral',color:'#dab985',regions:['eastern-frontier','far-steppe'],homes:['kargan','ambercross','windrest'],count:3,rival:'western-league'},
  {id:'southern-sultanate',name:'Southern Sultanate',relation:'neutral',color:'#b8a9d8',regions:['blackwater-basin','saffron-coast','sunlands'],homes:['sultans-rest','brassgate','saffronbay'],count:3,rival:'highland-clans'},
].map(faction=>Object.freeze({...faction,regions:Object.freeze(faction.regions),homes:Object.freeze(faction.homes)})));
export function soldierFactionAt(x,y){const region=regionAt(x,y).id;return SOLDIER_FACTIONS.find(faction=>faction.regions.includes(region));}
export function soldierRelations(a,b){return a===b?'allied':SOLDIER_FACTIONS.find(f=>f.id===a)?.rival===b?'hostile':'neutral';}
const hash=value=>{let h=2166136261;for(const char of String(value))h=Math.imul(h^char.charCodeAt(0),16777619);return h>>>0;};
const definitionCache=new WeakMap();
export function patrolDefinitions(settlements){
  if(definitionCache.has(settlements))return definitionCache.get(settlements);
  const cities=settlements.filter(t=>t.kind==='town'),byId=new Map(cities.map(t=>[t.id,t])),definitions=[];
  for(const faction of SOLDIER_FACTIONS){
    const owned=cities.filter(t=>soldierFactionAt(t.x,t.y).id===faction.id);
    for(let index=0;index<faction.count;index++){
      const home=byId.get(faction.homes[index%faction.homes.length])??owned[index%owned.length];
      const friendly=owned.filter(t=>t.id!==home.id).sort((a,b)=>a.id.localeCompare(b.id));
      const foreign=cities.filter(t=>soldierRelations(faction.id,soldierFactionAt(t.x,t.y).id)==='hostile').sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-Math.hypot(b.x-home.x,b.y-home.y)||a.id.localeCompare(b.id));
      const tour=[home,...friendly.slice(index,index+2),foreign[index%foreign.length],foreign.at(-1),home].filter(Boolean);
      const waypoints=[];
      for(let leg=1;leg<tour.length;leg++){
        const route=roadRoute(settlements,tour[leg-1].id,tour[leg].id);
        for(const point of route.slice(leg===1?0:1))waypoints.push(Object.freeze({...point}));
      }
      const id=`soldiers:${faction.id}:${index+1}`;
      definitions.push(Object.freeze({id,name:`${faction.name} ${index===2?'Veteran Column':'City Patrol'} ${index+1}`,factionId:faction.id,homeId:home.id,home:Object.freeze({x:home.x,y:home.y}),waypoints:Object.freeze(waypoints),tour:Object.freeze(tour.map(t=>t.id)),size:index===2?9:8,difficulty:index===2?3:2}));
    }
  }
  const result=Object.freeze(definitions);definitionCache.set(settlements,result);return result;
}
export function initialPatrolProgress(state,definition){return {x:definition.home.x,y:definition.home.y,waypoint:1,troops:Array.from({length:definition.size},(_,i)=>i),spawnCycle:0,defeatedUntil:0,cooldownUntil:0,lastReinforcedHour:(state.day-1)*24+state.hour,behavior:'touring',targetId:null,wins:0,losses:0};}
export function factionTroops(seed,factionId,difficulty,count) {
  const regionId={'western-league':'western-marches','highland-clans':'northern-highlands','eastern-march':'eastern-frontier','southern-sultanate':'sunlands'}[factionId];
  const region=REGIONS.find(r=>r.id===regionId),templates=worldEnemyTemplates(region.x,region.y,difficulty);
  return Array.from({length:count},(_,index)=>{
    const soldier=regionalOutfit(templates[index%templates.length],seed,index,region.x,region.y,difficulty,{champions:false});
    const title={ranged:'Marksman',skirmisher:'Skirmisher',shield:'Shieldman',melee:'Man-at-arms'}[enemyCombatRole(soldier)];
    soldier.name=`${SOLDIER_FACTIONS.find(f=>f.id===factionId).name} ${title}`;
    return soldier;
  });
}
function roster(state,definition,progress){
  const troops=factionTroops(`${state.seed}:${definition.id}:${progress.spawnCycle}`,definition.factionId,definition.difficulty,definition.size);
  return progress.troops.map(index=>{
    const soldier={...troops[index]};
    if(index===0&&hash(`${state.seed}:${definition.id}:cavalry`)%3===0){const pool=regionalMountPool(definition.home.x,definition.home.y,{reward:true});soldier.mount=pool[hash(definition.id)%pool.length];}
    return soldier;
  });
}
export function factionPatrols(state,settlements){
  const now=(state.day-1)*24+state.hour;
  return patrolDefinitions(settlements).map(definition=>{
    const progress=state.factionPatrols?.[definition.id]??initialPatrolProgress(state,definition),faction=SOLDIER_FACTIONS.find(f=>f.id===definition.factionId);
    const fight=worldSkirmishFor(state,definition.id),remaining=fight?Math.max(0,fight.endHour-now):0;
    return {...(fight?{battleHoursRemaining:remaining,joinableBattle:isJoinablePatrolSkirmish({...definition,active:progress.troops.length>0&&progress.defeatedUntil<=now,playerRelation:faction.relation},fight,now)}:{}),...definition,x:progress.x,y:progress.y,kind:'patrol',playerRelation:faction.relation,color:faction.color,factionLabel:faction.name,rivalLabel:SOLDIER_FACTIONS.find(f=>f.id===faction.rival).name,enemies:roster(state,definition,progress),active:progress.troops.length>0&&progress.defeatedUntil<=now,behavior:progress.behavior,targetId:progress.targetId,wins:progress.wins,losses:progress.losses,respawnHours:Math.max(0,Math.ceil(progress.defeatedUntil-now)),description: fight?`Fighting ${fight.aId===definition.id?fight.bName:patrolDefinitions(settlements).find(d=>d.id===fight.aId)?.name}. About ${Math.ceil(remaining)} hours remain; troops are committed until the battle ends.`:`${faction.relation==='ally'?'Allied':'Neutral'} city soldiers tour the roads, hunt roaming brigands and fight ${SOLDIER_FACTIONS.find(f=>f.id===faction.rival).name} patrols. Casualties persist until they recover at a city.`};
  });
}
function strength(enemies,getItem){return enemies.reduce((sum,e)=>sum+18+(getItem(e.armor)?.armor??0)*.07+(getItem(e.helmet)?.armor??0)*.04+((getItem(e.weapon)?.damageMin??20)+(getItem(e.weapon)?.damageMax??30))*.16+(getItem(e.shield)?.defense??0)*.4+(e.mount?7:0),0);}
export function simulateSkirmish(a,b,getItem,seed){
  const pa=strength(a,getItem)*(.7+hash(`${seed}:a`)%61/100),pb=strength(b,getItem)*(.7+hash(`${seed}:b`)%61/100),aWins=pa>=pb;
  const survive=(troops,won,own,other,key)=>{
    const loss=won?Math.min(troops.length-1,Math.max(1,Math.floor(troops.length*Math.min(.65,other/own*.28)))):Math.max(1,Math.ceil(troops.length*(.65+hash(`${seed}:${key}`)%36/100)));
    return troops.map((_,index)=>index).sort((i,j)=>hash(`${seed}:${key}:${i}`)-hash(`${seed}:${key}:${j}`)).slice(Math.min(troops.length,loss)).sort((a,b)=>a-b);
  };
  return {aWins,aSurvivors:survive(a,aWins,pa,pb,'a'),bSurvivors:survive(b,!aWins,pb,pa,'b')};
}
function move(progress,target,distance){return moveWorldToward(progress,nearestWorldPoint(target)??target,distance);}
function addReport(state,patrol,target,outcome,losses,now){
  state.factionReports??=[];state.factionReports.push({patrolId:patrol.id,factionId:patrol.factionId,opponentId:target.id,opponentName:target.name,kind:target.kind,outcome,losses,hour:now});if(state.factionReports.length>24)state.factionReports.splice(0,state.factionReports.length-24);
}
export function skirmishDuration(aCount,bCount){return Math.min(72,Math.max(3,Math.ceil(2+(aCount+bCount)**2/18)));}
// Neutral soldiers can cooperate against brigands or undead without changing
// faction relations. Battles between faction patrols remain independent.
export function isJoinablePatrolSkirmish(patrol,fight,now){
 return Boolean(patrol?.active&&['ally','neutral'].includes(patrol.playerRelation)&&fight?.aId===patrol.id
   &&['band','undead-host'].includes(fight.bKind)&&fight.endHour>now);
}
export function worldSkirmishFor(state,id){return state.worldSkirmishes?.find(f=>f.aId===id||f.bId===id)??null;}
export function cancelWorldSkirmish(state,id){
 const cancelled=(state.worldSkirmishes??[]).filter(f=>f.aId===id||f.bId===id);
 for(const fight of cancelled)for(const participant of [fight.aId,fight.bId]){const p=state.factionPatrols?.[participant];if(p){p.behavior=p.troops.length?'touring':'reforming';p.targetId=null;}}
 state.worldSkirmishes=(state.worldSkirmishes??[]).filter(f=>!cancelled.includes(f));
}
function finishWorldSkirmish(state,fight,context,byId,now){
 const d=byId.get(fight.aId),p=state.factionPatrols[fight.aId],army={...d,kind:'patrol'},target={id:fight.bId,name:fight.bName,kind:fight.bKind,spawnCycle:fight.bCycle},battle=fight.result,old=p.troops.length;
 p.troops=battle.aSurvivors.map(index=>fight.aTroops[index]);p.cooldownUntil=now+6;p.targetId=null;p.behavior=p.troops.length?'touring':'reforming';
 if(!p.troops.length){p.defeatedUntil=now+72;p.x=d.home.x;p.y=d.home.y;}
 p[battle.aWins?'wins':'losses']+=1;addReport(state,army,target,battle.aWins?'victory':'defeat',old-p.troops.length,now);
 if(target.kind==='patrol'){
  const rival=state.factionPatrols[target.id],rd=byId.get(target.id),before=rival.troops.length;
  rival.troops=battle.bSurvivors.map(index=>fight.bTroops[index]);rival.cooldownUntil=now+6;rival[battle.aWins?'losses':'wins']+=1;rival.targetId=null;rival.behavior=rival.troops.length?'touring':'reforming';
  if(!rival.troops.length){rival.defeatedUntil=now+72;rival.x=rd.home.x;rival.y=rd.home.y;}
  addReport(state,rd,army,battle.aWins?'defeat':'victory',before-rival.troops.length,now);
 }else context.hostileResult(target,battle.bSurvivors,battle.aWins,fight);
}
export function advanceFactionSimulation(state,context){
  const now=(state.day-1)*24+state.hour;
  if(state.factionSimulationHour===now)return;
  state.factionPatrols??={};state.worldSkirmishes??=[];
  const homeFor = definition => {
    const available = context.settlements.filter(t => t.kind === 'town' && soldierFactionAt(t.x,t.y).id === definition.factionId && (context.servicesAvailable?.(t.id) ?? true));
    return available.find(t => t.id === definition.homeId) ?? available.sort((a,b) => Math.hypot(a.x-definition.home.x,a.y-definition.home.y)-Math.hypot(b.x-definition.home.x,b.y-definition.home.y)||a.id.localeCompare(b.id))[0] ?? null;
  };
  const definitions=patrolDefinitions(context.settlements),byId=new Map(definitions.map(d=>[d.id,d]));
  for(const d of definitions){
    const p=state.factionPatrols[d.id]??=initialPatrolProgress(state,d);
    if(!p.troops.length&&p.defeatedUntil<=now&&homeFor(d)){const cycle=p.spawnCycle+1;state.factionPatrols[d.id]={...initialPatrolProgress(state,d),x:homeFor(d).x,y:homeFor(d).y,spawnCycle:cycle,wins:p.wins,losses:p.losses};}
  }
  const reserved=new Set([state.pursuit,state.destinationAction?.id,state.contract?.campId,state.battle?.campId]);
  for(const fight of [...state.worldSkirmishes]){
    const a=state.factionPatrols[fight.aId],b=fight.bKind==='patrol'?state.factionPatrols[fight.bId]:context.currentHostile(fight.bId);
    const bCycle=fight.bKind==='patrol'?b?.spawnCycle:b?.spawnCycle??b?.force?.generation;
    if(!a||a.spawnCycle!==fight.aCycle||!b||bCycle!==fight.bCycle){cancelWorldSkirmish(state,fight.aId);continue;}
    if(now>=fight.endHour){finishWorldSkirmish(state,fight,context,byId,now);state.worldSkirmishes=state.worldSkirmishes.filter(f=>f!==fight);}
  }
  const armies=factionPatrols(state,context.settlements).filter(p=>p.active),hostiles=context.hostiles().filter(target=>target.kind==='band'||target.kind==='undead-host');
  for(const army of armies){
    const p=state.factionPatrols[army.id],d=byId.get(army.id);
    if(!p.troops.length||p.defeatedUntil>now||worldSkirmishFor(state,army.id))continue;
    const recovering=p.troops.length<Math.ceil(d.size/2)||(p.behavior==='returning'&&p.troops.length<d.size);
    const threats=[...hostiles.filter(b=>b.difficulty>0&&!reserved.has(b.id)&&!worldSkirmishFor(state,b.id)),...armies.filter(other=>other.id!==army.id&&!worldSkirmishFor(state,other.id)&&soldierRelations(army.factionId,other.factionId)==='hostile')];
    const target=p.cooldownUntil<=now?threats.filter(t=>Math.hypot(t.x-p.x,t.y-p.y)<=(recovering?35:180)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||a.id.localeCompare(b.id))[0]:null;
    if(target){p.behavior=recovering?'returning':'engaging';p.targetId=target.id;move(p,target,52*.25);}
    else {p.behavior=recovering?'returning':'touring';p.targetId=null;const goal=p.behavior==='returning'?(homeFor(d)??p):d.waypoints[p.waypoint];if(move(p,goal,55*.25)&&p.behavior==='touring')p.waypoint=(p.waypoint+1)%d.waypoints.length;}
    const atCity=context.settlements.some(t=>t.kind==='town'&&Math.hypot(t.x-p.x,t.y-p.y)<=28&&soldierFactionAt(t.x,t.y).id===army.factionId&&(context.servicesAvailable?.(t.id)??true));
    if(atCity&&now-p.lastReinforcedHour>=12&&p.troops.length<d.size){const missing=Array.from({length:d.size},(_,i)=>i).find(i=>!p.troops.includes(i));p.troops.push(missing);p.troops.sort((a,b)=>a-b);p.lastReinforcedHour=now;}
    if(!target||Math.hypot(target.x-p.x,target.y-p.y)>35||p.cooldownUntil>now)continue;
    if(target.kind==='patrol'&&(state.factionPatrols[target.id].cooldownUntil>now||!state.factionPatrols[target.id].troops.length))continue;
    // Both opponents are rebuilt from current surviving troops before a simulated battle.
    const ours=roster(state,d,p),other=target.kind==='patrol'?roster(state,byId.get(target.id),state.factionPatrols[target.id]):context.currentHostile(target.id)?.enemies;
    if(!other?.length)continue;
    const startHour=now,endHour=now+skirmishDuration(ours.length,other.length);
    const aTroops=[...p.troops],bTroops=target.kind==='patrol'?[...state.factionPatrols[target.id].troops]:other.map((e,i)=>target.kind==='undead-host'?e.troopIndex:e.worldIndex??i);
    state.worldSkirmishes.push({id:`skirmish:${army.id}:${target.id}:${Math.round(now*4)}`,aId:army.id,bId:target.id,bName:target.name,bKind:target.kind,aCycle:p.spawnCycle,bCycle:target.spawnCycle??target.force?.generation??0,startHour,endHour,x:p.x,y:p.y,aTroops,bTroops,result:simulateSkirmish(ours,other,context.getItem,`${state.seed}:${Math.round(now*4)}:${army.id}:${target.id}:${p.spawnCycle}`)});
    p.behavior='engaging';p.targetId=target.id;
    if(target.kind==='patrol'){state.factionPatrols[target.id].behavior='engaging';state.factionPatrols[target.id].targetId=army.id;}

  }
  state.factionSimulationHour=now;
}
