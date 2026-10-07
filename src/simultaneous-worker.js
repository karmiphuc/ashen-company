import { advanceSimultaneousBattle } from './engine.js';
import { simultaneousEvents, simultaneousEventSerial, receiveSimultaneousEvents } from './simultaneous-combat.js';
let state=null;
globalThis.onmessage=({data})=>{
  if(data.type==='init'){state=data.state;receiveSimultaneousEvents(state.battle,data.events,data.eventSerial);globalThis.postMessage({type:'ready'});return;}
  if(data.type==='step'&&state){
    advanceSimultaneousBattle(state,data.elapsedMs,{maxActions:8,budgetMs:20});
    // Terrain is immutable during a battle; avoid cloning every hex on each frame.
    const battle={...state.battle};delete battle.field;
    globalThis.postMessage({type:'snapshot',battle,supplies:state.supplies,events:simultaneousEvents(state.battle),eventSerial:simultaneousEventSerial(state.battle)});
  }
};
