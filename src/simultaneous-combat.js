// An event scheduler, not a second copy of the tactical AI or damage rules.
export const SIM_STEP_MS = 50;
export const SIM_ROUND_MS = 6000;
export const SIM_EFFECTS = Object.freeze({stunnedTurns:1,dazedTurns:2,staggeredTurns:1,disarmedTurns:1,howlTurns:2});
const frames = new WeakMap();
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
export const simultaneousInitiative = unit => Math.max(1,unit.initiative*(unit.staggeredTurns>0?.5:1)*(unit.dazedTurns>0?.75:1)-unit.fatigue*.2);
export const simultaneousPriority = (a,b) => simultaneousInitiative(b)-simultaneousInitiative(a)||a.id.localeCompare(b.id);
export function initialSimultaneousClock(battle) {
  return {version:1,time:0,carryMs:0,backlogMs:0,pendingIds:[],roundEndsAt:SIM_ROUND_MS,actors:Object.fromEntries(battle.units.map(unit=>[unit.id,{
    readyAt:Math.ceil((clamp(180-simultaneousInitiative(unit),0,180)+(battle.enemyOpening&&unit.side==='company'?500:0))/SIM_STEP_MS)*SIM_STEP_MS,
    effects:{} }]))};
}
export function simultaneousActionDelay(unit,apSpent,event) {
  const pace = clamp(110/simultaneousInitiative(unit),.65,1.8);
  // Free swaps and maintenance ticks still have a finite recovery time.
  const base = event?.type==='move'?180:event?.skillName==='Bleeding'?50:160;
  return Math.ceil(Math.max(base,Math.max(0,apSpent)*220*pace)/SIM_STEP_MS)*SIM_STEP_MS;
}
export function markSimultaneousEffect(battle,unit,key,turns) {
  const clock=battle.simultaneous;
  if(clock&&SIM_EFFECTS[key])clock.actors[unit.id].effects[key]=clock.time+turns*SIM_ROUND_MS;
}
export function expireSimultaneousEffects(battle) {
  const clock=battle.simultaneous;
  for(const unit of battle.units)for(const [key,until] of Object.entries(clock.actors[unit.id].effects)){
    unit[key]=Math.max(0,Math.ceil((until-clock.time)/SIM_ROUND_MS));
    if(until<=clock.time){delete clock.actors[unit.id].effects[key];if(key==='stunnedTurns')unit.stunProtected=false;}
  }
}
export function rememberSimultaneousEvent(battle,event,delay) {
  if(!event)return;
  const previous=frames.get(battle)??{serial:0,events:[]};
  const duration=event.type==='move'?Math.min(delay,450):['attack','miss','hit','fall'].includes(event.type)?Math.min(Math.max(delay*.8,350),900):Math.min(Math.max(delay,250),700);
  const entry={id:++previous.serial,time:battle.simultaneous.time,duration,event:structuredClone(event)};
  previous.events=previous.events.filter(e=>battle.simultaneous.time-e.time<Math.max(e.duration,1000));
  previous.events.push(entry);frames.set(battle,previous);return entry;
}
export function simultaneousEvents(battle) {
  return (frames.get(battle)?.events??[]).filter(e=>battle.simultaneous.time-e.time<Math.max(e.duration,1000));
}
export function validateSimultaneousClock(input,units,round) {
  const valid=(ok,message)=>{if(!ok)throw new TypeError(`Invalid save: simultaneous combat ${message}`);};
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const keys=(x,list)=>object(x)&&Object.keys(x).length===list.length&&list.every(k=>Object.hasOwn(x,k));
  const stamp=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000*SIM_ROUND_MS+2*SIM_ROUND_MS&&x%SIM_STEP_MS===0;
  valid(keys(input,['version','time','carryMs','backlogMs','pendingIds','roundEndsAt','actors'])&&input.version===1,'version');
  valid(stamp(input.time)&&stamp(input.roundEndsAt)&&input.roundEndsAt===round*SIM_ROUND_MS
    &&input.time>=(round-1)*SIM_ROUND_MS&&input.time<input.roundEndsAt,'clock');
  valid(Number.isFinite(input.carryMs)&&input.carryMs>=0&&input.carryMs<SIM_STEP_MS,'remainder');
  valid(stamp(input.backlogMs)&&input.backlogMs<=2000,'backlog');
  valid(Array.isArray(input.pendingIds)&&input.pendingIds.length<=units.length&&new Set(input.pendingIds).size===input.pendingIds.length
    &&input.pendingIds.every(id=>units.some(u=>u.id===id)&&input.actors?.[id]?.readyAt<=input.time),'pending actions');
  valid(keys(input.actors,units.map(u=>u.id)),'roster');
  for(const unit of units){const actor=input.actors[unit.id];
    valid(keys(actor,['readyAt','effects'])&&stamp(actor.readyAt)&&actor.readyAt<=input.time+2*SIM_ROUND_MS&&object(actor.effects),'action timing');
    valid(Object.keys(actor.effects).every(k=>Object.hasOwn(SIM_EFFECTS,k)),'effect identity');
    for(const [key,max] of Object.entries(SIM_EFFECTS)){
      const until=actor.effects[key];
      valid(until===undefined?!(unit[key]>0):stamp(until)&&until>input.time&&until<=input.time+max*SIM_ROUND_MS
        &&unit[key]===Math.ceil((until-input.time)/SIM_ROUND_MS),'effect timing');
    }
  }
  return structuredClone(input);
}

// Stable Dijkstra queue: identical cost/q/r ordering without sorting the whole frontier.
export class SimultaneousPathQueue {
  constructor(first){this.heap=[];this.serial=0;if(first)this.push(first);}
  get length(){return this.heap.length;}
  sort(){return this;}
  before(a,b){return a.value.cost-b.value.cost||a.value.q-b.value.q||a.value.r-b.value.r||a.serial-b.serial;}
  push(value){const entry={value,serial:this.serial++};let i=this.heap.length;this.heap.push(entry);while(i>0){const p=(i-1)>>1;if(this.before(this.heap[p],entry)<=0)break;this.heap[i]=this.heap[p];i=p;}this.heap[i]=entry;}
  shift(){if(!this.heap.length)return undefined;const first=this.heap[0],last=this.heap.pop();if(this.heap.length){let i=0;while(i*2+1<this.heap.length){let child=i*2+1;if(child+1<this.heap.length&&this.before(this.heap[child+1],this.heap[child])<0)child++;if(this.before(last,this.heap[child])<=0)break;this.heap[i]=this.heap[child];i=child;}this.heap[i]=last;}return first.value;}
}

export const simultaneousEventSerial = battle => frames.get(battle)?.serial??0;
export function receiveSimultaneousEvents(battle,events,serial=events.at(-1)?.id??0) {
  frames.set(battle,{serial,events});
}
