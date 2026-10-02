import { regionAt, roadRoute } from './geography.js';
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
function roster(state,definition,progress){
  const templates=worldEnemyTemplates(definition.home.x,definition.home.y,definition.difficulty);
  return progress.troops.map(index=>{
    const soldier=regionalOutfit(templates[index%templates.length],`${state.seed}:${definition.id}:${progress.spawnCycle}`,index,definition.home.x,definition.home.y,definition.difficulty,{champions:false});
    const role=enemyCombatRole(soldier),title={ranged:'Marksman',skirmisher:'Skirmisher',shield:'Shieldman',melee:'Man-at-arms'}[role];
    soldier.name=`${SOLDIER_FACTIONS.find(f=>f.id===definition.factionId).name} ${title}`;
    if(index===0&&hash(`${state.seed}:${definition.id}:cavalry`)%3===0){const pool=regionalMountPool(definition.home.x,definition.home.y,{reward:true});soldier.mount=pool[hash(definition.id)%pool.length];}
    return soldier;
  });
}
export function factionPatrols(state,settlements){
  const now=(state.day-1)*24+state.hour;
  return patrolDefinitions(settlements).map(definition=>{
    const progress=state.factionPatrols?.[definition.id]??initialPatrolProgress(state,definition),faction=SOLDIER_FACTIONS.find(f=>f.id===definition.factionId);
    return {...definition,x:progress.x,y:progress.y,kind:'patrol',playerRelation:faction.relation,color:faction.color,factionLabel:faction.name,rivalLabel:SOLDIER_FACTIONS.find(f=>f.id===faction.rival).name,enemies:roster(state,definition,progress),active:progress.troops.length>0&&progress.defeatedUntil<=now,behavior:progress.behavior,targetId:progress.targetId,wins:progress.wins,losses:progress.losses,respawnHours:Math.max(0,Math.ceil(progress.defeatedUntil-now)),description:`${faction.relation==='ally'?'Allied':'Neutral'} city soldiers tour the roads, hunt roaming brigands and fight ${SOLDIER_FACTIONS.find(f=>f.id===faction.rival).name} patrols. Casualties persist until they recover at a city.`};
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
function move(progress,target,distance){const length=Math.hypot(target.x-progress.x,target.y-progress.y);if(length<=distance){progress.x=target.x;progress.y=target.y;return true;}progress.x+=(target.x-progress.x)*distance/length;progress.y+=(target.y-progress.y)*distance/length;return false;}
function addReport(state,patrol,target,outcome,losses,now){
  state.factionReports??=[];state.factionReports.push({patrolId:patrol.id,factionId:patrol.factionId,opponentId:target.id,opponentName:target.name,kind:target.kind,outcome,losses,hour:now});if(state.factionReports.length>24)state.factionReports.splice(0,state.factionReports.length-24);
}
export function advanceFactionSimulation(state,context){
  const now=(state.day-1)*24+state.hour;
  if(state.factionSimulationHour===now)return;
  state.factionPatrols??={};
  const definitions=patrolDefinitions(context.settlements),byId=new Map(definitions.map(d=>[d.id,d]));
  for(const d of definitions){
    const p=state.factionPatrols[d.id]??=initialPatrolProgress(state,d);
    if(!p.troops.length&&p.defeatedUntil<=now){const cycle=p.spawnCycle+1;state.factionPatrols[d.id]={...initialPatrolProgress(state,d),spawnCycle:cycle,wins:p.wins,losses:p.losses};}
  }
  const armies=factionPatrols(state,context.settlements).filter(p=>p.active),hostiles=context.hostiles().filter(target=>target.kind==='band');
  const reserved=new Set([state.pursuit,state.destinationAction?.id,state.contract?.campId]);
  for(const army of armies){
    const p=state.factionPatrols[army.id],d=byId.get(army.id);
    if(!p.troops.length||p.defeatedUntil>now)continue;
    const recovering=p.troops.length<Math.ceil(d.size/2)||(p.behavior==='returning'&&p.troops.length<d.size);
    const threats=[...hostiles.filter(b=>b.difficulty>0&&!reserved.has(b.id)),...armies.filter(other=>other.id!==army.id&&soldierRelations(army.factionId,other.factionId)==='hostile')];
    const target=p.cooldownUntil<=now?threats.filter(t=>Math.hypot(t.x-p.x,t.y-p.y)<=(recovering?35:180)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||a.id.localeCompare(b.id))[0]:null;
    if(target){p.behavior=recovering?'returning':'engaging';p.targetId=target.id;move(p,target,52*.25);}
    else {p.behavior=recovering?'returning':'touring';p.targetId=null;const goal=p.behavior==='returning'?d.home:d.waypoints[p.waypoint];if(move(p,goal,55*.25)&&p.behavior==='touring')p.waypoint=(p.waypoint+1)%d.waypoints.length;}
    const atCity=context.settlements.some(t=>t.kind==='town'&&Math.hypot(t.x-p.x,t.y-p.y)<=28&&soldierFactionAt(t.x,t.y).id===army.factionId);
    if(atCity&&now-p.lastReinforcedHour>=12&&p.troops.length<d.size){const missing=Array.from({length:d.size},(_,i)=>i).find(i=>!p.troops.includes(i));p.troops.push(missing);p.troops.sort((a,b)=>a-b);p.lastReinforcedHour=now;}
    if(!target||Math.hypot(target.x-p.x,target.y-p.y)>35||p.cooldownUntil>now)continue;
    if(target.kind==='patrol'&&(state.factionPatrols[target.id].cooldownUntil>now||!state.factionPatrols[target.id].troops.length))continue;
    // Both opponents are rebuilt from current surviving troops before a simulated battle.
    const ours=roster(state,d,p),other=target.kind==='patrol'?roster(state,byId.get(target.id),state.factionPatrols[target.id]):context.currentHostile(target.id)?.enemies;
    if(!other?.length)continue;
    const battle=simulateSkirmish(ours,other,context.getItem,`${state.seed}:${Math.round(now*4)}:${army.id}:${target.id}:${p.spawnCycle}`),old=p.troops.length;
    p.troops=battle.aSurvivors.map(index=>p.troops[index]);p.cooldownUntil=now+6;
    if(!p.troops.length){p.defeatedUntil=now+72;p.behavior='reforming';p.x=d.home.x;p.y=d.home.y;}
    p[battle.aWins?'wins':'losses']+=1;
    addReport(state,army,target,battle.aWins?'victory':'defeat',old-p.troops.length,now);
    if(target.kind==='patrol'){
      const rival=state.factionPatrols[target.id],rivalDefinition=byId.get(target.id),before=rival.troops.length;
      rival.troops=battle.bSurvivors.map(index=>rival.troops[index]);rival.cooldownUntil=now+6;rival[battle.aWins?'losses':'wins']+=1;
      if(!rival.troops.length){rival.defeatedUntil=now+72;rival.behavior='reforming';rival.x=rivalDefinition.home.x;rival.y=rivalDefinition.home.y;}
      addReport(state,target,army,battle.aWins?'defeat':'victory',before-rival.troops.length,now);
    }else context.hostileResult(target,battle.bSurvivors,battle.aWins);
  }
  state.factionSimulationHour=now;
}
