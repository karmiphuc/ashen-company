import { advanceSimultaneousBattle } from './engine.js';
import { receiveSimultaneousEvents, simultaneousEvents, simultaneousEventSerial } from './simultaneous-combat.js';
let runner=null,workerUnavailable=false;
// Keep object identity so unchanged portraits and animation histories remain mounted.
export function applySimultaneousSnapshot(state,snapshot) {
  const battle=state.battle,units=new Map(battle.units.map(u=>[u.id,u]));
  const updated=snapshot.battle.units.map(incoming=>{
    const unit=units.get(incoming.id);
    for(const key of Object.keys(unit))if(!Object.hasOwn(incoming,key))delete unit[key];
    Object.assign(unit,incoming);return unit;
  });
  Object.assign(battle,snapshot.battle,{units:updated});
  Object.assign(state.supplies,snapshot.supplies);
  receiveSimultaneousEvents(battle,snapshot.events,snapshot.eventSerial);
}
export function stopSimultaneousWorker(){runner?.worker.terminate();runner=null;}
export function simultaneousWorkerStatus(){return {worker:!!runner,inFlight:runner?.inFlight??false,unavailable:workerUnavailable};}
export function queueSimultaneousFrame(state,elapsedMs){
  const battle=state.battle;
  if(!battle?.simultaneous||battle.status!=='active'){stopSimultaneousWorker();return {updated:false};}
  if(!globalThis.Worker||workerUnavailable){const before=battle.simultaneous.time,result=advanceSimultaneousBattle(state,elapsedMs,{maxActions:2,budgetMs:10});return {updated:!!result.actions||before!==battle.simultaneous.time};}
  if(runner?.battle!==battle){
    stopSimultaneousWorker();
    try{
      const worker=new Worker(new URL('./simultaneous-worker.js',import.meta.url),{type:'module'});
      const current={worker,battle,state,ready:false,inFlight:false,delta:0,updated:false};runner=current;
      worker.onmessage=({data})=>{
        if(runner!==current||state.battle!==battle)return;
        if(data.type==='ready')current.ready=true;
        else if(data.type==='snapshot'){applySimultaneousSnapshot(state,data);current.inFlight=false;current.updated=true;}
      };
      worker.onerror=()=>{if(runner===current){workerUnavailable=true;stopSimultaneousWorker();}};
      worker.postMessage({type:'init',state,events:simultaneousEvents(battle),eventSerial:simultaneousEventSerial(battle)});
    }catch{workerUnavailable=true;stopSimultaneousWorker();return queueSimultaneousFrame(state,elapsedMs);}
  }
  const current=runner,updated=current.updated;current.updated=false;
  current.delta=Math.min(2000,current.delta+elapsedMs);
  if(current.ready&&!current.inFlight&&current.delta>0){current.worker.postMessage({type:'step',elapsedMs:current.delta});current.delta=0;current.inFlight=true;}
  return {updated};
}
