// One display clock drives independent CSS animation tracks. Simulation and saves
// remain authoritative; presentation state is deliberately never serialized.
const clocks=new WeakMap(), contexts=new WeakMap(), tracks=new WeakMap(), dirty=new WeakSet();
const rateFor=speed=>speed===4?4:1;
export function patchFighter(current,incoming) {
  if(current.isEqualNode(incoming))return;
  for(const attr of [...current.attributes])if(!incoming.hasAttribute(attr.name))current.removeAttribute(attr.name);
  for(const attr of incoming.attributes)if(current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);
  // Reconcile semantic children without detaching unchanged animated elements.
  const old=[...current.childNodes],used=new Set();let cursor=current.firstChild;
  for(const next of [...incoming.childNodes]){
    const match=old.find(n=>!used.has(n)&&n.nodeType===next.nodeType&&
      (n.nodeType!==1||n.tagName===next.tagName&&n.classList[0]===next.classList[0]&&n.dataset.impactEvent===next.dataset.impactEvent));
    if(match){
      used.add(match);
      if(match.nodeType===1)patchFighter(match,next);
      else if(match.nodeValue!==next.nodeValue)match.nodeValue=next.nodeValue;
      if(match!==cursor)current.insertBefore(match,cursor);cursor=match.nextSibling;
    }else {current.insertBefore(next,cursor);cursor=next.nextSibling;}
  }
  // An omitted portrait means its equipment fingerprint was unchanged.
  for(const n of old)if(!used.has(n)&&!(n.nodeType===1&&n.classList[0]==='bb-portrait'))n.remove();
}
function displayTime(view,battle,speed,now) {
  let clock=clocks.get(battle);
  if(!clock){clock={simulation:battle.simultaneous.time,anchor:now,shown:battle.simultaneous.time,rate:rateFor(speed),paused:speed===0};clocks.set(battle,clock);}
  const next=battle.simultaneous.time,rate=speed===0?clock.rate:rateFor(speed);
  if(next!==clock.simulation||rate!==clock.rate||clock.paused!==(speed===0)){
    clock.simulation=next;clock.anchor=now;clock.rate=rate;clock.paused=speed===0;
  }
  // Smooth between 50ms snapshots, never build an unbounded visual queue.
  const proposed=next+(speed===0?0:Math.min(100,(now-clock.anchor)*rate));
  clock.shown=Math.max(clock.shown,proposed);return clock.shown;
}
export function syncPresentation(view,node,battle,speed,context) {
  node.dataset.presented='true';
  contexts.set(node,context);dirty.add(view);
}

export function advanceBattlePresentation(root,battle,speed) {
  const view=root.querySelector('.simultaneous-battle');if(!view)return;
  const time=displayTime(view,battle,speed,performance.now()),rate=clocks.get(battle).rate;
  if(dirty.has(view)){
    // Read animations once, after all DOM writes, avoiding per-fighter style flushes.
    const list=view.getAnimations({subtree:true}).map(animation=>{
      const target=animation.effect?.target,node=target?.closest('[data-unit-id]'),context=contexts.get(node);
      const impact=/pawn-impact|pawn-fall|impact-bar|impact-float/.test(animation.animationName??'');
      const entry=impact?context?.incoming:context?.own??context?.incoming;
      const callout=target?.closest('[data-event-time]');
      animation.pause();const timing=animation.effect.getComputedTiming();return {animation,end:timing.endTime,time:callout?Number(callout.dataset.eventTime):entry?.time??battle.simultaneous.time};
    });tracks.set(view,list);dirty.delete(view);
  }
  for(const track of tracks.get(view)??[]){const age=Math.min(track.end,Math.max(0,(time-track.time)/rate));if(track.animation.currentTime!==age)track.animation.currentTime=age;}
}
