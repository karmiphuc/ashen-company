import {test,expect} from '@playwright/test';
async function harness(page){
 await page.route('**/presentation-harness.html',route=>route.fulfill({contentType:'text/html',body:'<link rel="stylesheet" href="src/style.css"><link rel="stylesheet" href="src/battle.css"><div id="root"></div>'}));
 await page.goto('presentation-harness.html');
 await page.evaluate(async()=>{
  const engine=await import('./src/engine.js'),config=await import('./src/combat-config.js');
  window.runner=await import('./src/simultaneous-runner.js');window.view=await import('./src/battle-view.js');window.events=await import('./src/simultaneous-combat.js');
  const s=engine.createGame(731);while(s.party.length<9){const p=structuredClone(s.party[0]);p.id=`fixture-${s.party.length}`;s.party.push(p);}s.party.forEach((p,i)=>p.equipment.mount=i<3?'war-horse':null);delete s.formation;
  config.setSimultaneousBetaEnabled(true);s.position={x:440,y:520};engine.startBattle(s,'quarry-camp');config.setSimultaneousBetaEnabled(false);
  window.engine=engine;window.state=s;window.b=s.battle;
  const enemy=b.units.filter(u=>u.side==='enemy');while(enemy.length<10){const u=structuredClone(enemy[0]);u.id=`enemy-fixture-${enemy.length}`;b.units.push(u);enemy.push(u);b.simultaneous.actors[u.id]={readyAt:0,effects:{}};b.turnOrder.push(u.id);}
  b.field.tiles.forEach(t=>{t.terrain='open';t.height=0;});b.units.forEach((u,i)=>{u.q=u.side==='company'?4:13;u.r=(u.side==='company'?i:enemy.indexOf(u))+2;u.tacticalRole='frontliner';});b.tactic='offense';b.formationAdvance=null;
  if(b.units.filter(u=>u.side==='company').length!==9)throw new Error('Expected nine fielded brothers');
  window.root=document.querySelector('#root');root.innerHTML=view.battleHTML(b,1,true);window.render=speed=>view.updateSimultaneousBattleView(root,b,speed);
 });
}
test('a new hit owns its clock and preserves the moving rider and portrait',async({page})=>{
 await harness(page);
 const result=await page.evaluate(()=>{
  const u=b.units[0],attacker=b.units.find(x=>x.side==='enemy');
  const from={q:u.q,r:u.r};u.q++;b.simultaneous.time=50;
  const move={id:1,time:50,duration:450,event:{actorId:u.id,type:'move',from,to:{q:u.q,r:u.r}}};
  events.receiveSimultaneousEvents(b,[move],1);render(1);
  const node=root.querySelector(`[data-unit-id="${u.id}"]`),portrait=node.querySelector('.bb-portrait');
  b.simultaneous.time=350;u.hp-=5;
  const hit={id:2,time:350,duration:700,event:{actorId:attacker.id,targetId:u.id,type:'attack',hit:true,hpDamage:5,from:attacker,to:u}};
  events.receiveSimultaneousEvents(b,[move,hit],2);render(1);
  const animations=node.getAnimations({subtree:true}),impact=animations.find(a=>a.animationName==='pawn-impact'),movement=animations.find(a=>a.animationName==='pawn-step');
  return {sameNode:node===root.querySelector(`[data-unit-id="${u.id}"]`),samePortrait:portrait===node.querySelector('.bb-portrait'),impactAge:impact?.currentTime,moveAge:movement?.currentTime,impactDuration:impact?.effect.getTiming().duration};
 });
 expect(result.sameNode).toBe(true);expect(result.samePortrait).toBe(true);
 expect(result.impactAge).toBeLessThan(100);expect(result.moveAge).toBeGreaterThanOrEqual(300);expect(result.impactDuration).toBe(700);
});
test('pause and speed changes keep source event progress without rewinding',async({page})=>{
 await harness(page);
 const result=await page.evaluate(async()=>{
  const u=b.units[0];u.q++;b.simultaneous.time=50;
  events.receiveSimultaneousEvents(b,[{id:1,time:0,duration:450,event:{actorId:u.id,type:'move',from:{q:u.q-1,r:u.r},to:u}}],1);render(1);
  const node=root.querySelector(`[data-unit-id="${u.id}"]`),animation=()=>node.getAnimations().find(a=>a.animationName==='pawn-step');
  render(0);const paused=animation().currentTime;await new Promise(r=>setTimeout(r,150));view.advanceBattlePresentation(root,b,0);const after=animation().currentTime;
  b.simultaneous.time=100;render(4);return {paused,after,fast:animation().currentTime,duration:animation().effect.getTiming().duration};
 });
 expect(result.after).toBe(result.paused);expect(result.fast).toBeGreaterThanOrEqual(25);expect(result.duration).toBe(112.5);
});
for(const cpuRate of [1,4])test(`mixed mounted combat has bounded frame stalls at CPU ${cpuRate}x`,async({page})=>{
 await harness(page);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
 const metrics=await page.evaluate(async()=>{
  const results=[],initial=structuredClone(state);
  for(const speed of [1,4]){
   runner.stopSimultaneousWorker();state=structuredClone(initial);b=state.battle;root.innerHTML=view.battleHTML(b,speed,true);render(speed);
   const gaps=[],costs=[];let last=performance.now(),start=last,updates=0,snapshots=0,maxSnapshotGap=0,lastSnapshot=last,lastVisible=last,maxVisibleIdle=0,idleState=null;const simStart=b.simultaneous.time;
   await new Promise(resolve=>{function frame(now){const elapsed=now-last;gaps.push(elapsed);last=now;const t=performance.now();const step=runner.queueSimultaneousFrame(state,Math.min(250,elapsed)*speed);if(step.updated){snapshots++;maxSnapshotGap=Math.max(maxSnapshotGap,now-lastSnapshot);lastSnapshot=now;}view.presentSimultaneousBattleFrame(root,b,speed,step.updated,now);costs.push(performance.now()-t);if(events.simultaneousEvents(b).some(e=>['move','attack','miss','hit','fall'].includes(e.event.type)&&b.simultaneous.time-e.time<e.duration))lastVisible=now;else {maxVisibleIdle=Math.max(maxVisibleIdle,now-lastVisible);if(!idleState&&now-lastVisible>1000)idleState={time:b.simultaneous.time,round:b.round,units:b.units.filter(u=>u.alive).map(u=>({id:u.id,ap:u.ap,stun:u.stunnedTurns,escaped:u.escaped,ready:b.simultaneous.actors[u.id].readyAt})),events:events.simultaneousEvents(b).map(e=>({time:e.time,type:e.event.type,message:e.event.message}))};}updates++;if(now-start<8000&&b.status==='active')requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
   gaps.sort((a,b)=>a-b);results.push({speed,updates,fps:updates*1000/(last-start),snapshots,maxSnapshotGap,maxVisibleIdle,idleState,round:b.round,advanced:b.simultaneous.time-simStart,p95:gaps[Math.floor(gaps.length*.95)],max:Math.max(...gaps),maxWork:Math.max(...costs)});
  }
  runner.stopSimultaneousWorker();return results;
 });
 console.log('Mixed combat frame metrics',JSON.stringify(metrics));
 for(const result of metrics){expect(result.updates).toBeGreaterThan(25);expect(result.snapshots).toBeGreaterThan(10);expect(result.advanced).toBeGreaterThan(6000);expect(result.round).toBeGreaterThan(1);expect(result.maxVisibleIdle).toBeLessThan(1000);expect(result.maxSnapshotGap).toBeLessThan(1000);expect(result.fps).toBeGreaterThan(cpuRate===1?45:30);expect(result.p95).toBeLessThan(cpuRate===1?50:100);expect(result.max).toBeLessThan(1000);}
});
test('two incoming hits retain distinct timestamps and cinematic attacks finish',async({page})=>{
 await harness(page);
 const result=await page.evaluate(()=>{
  const u=b.units[0],enemy=b.units.find(x=>x.side==='enemy');b.simultaneous.time=400;
  const attack={id:1,time:0,duration:350,event:{actorId:u.id,targetId:enemy.id,type:'attack',weaponId:u.equipment.weapon,from:u,to:enemy}};
  const hits=[{id:2,time:200,duration:700,event:{actorId:enemy.id,targetId:u.id,type:'attack',hit:true,hpDamage:3}},{id:3,time:400,duration:700,event:{actorId:enemy.id,targetId:u.id,type:'attack',hit:true,hpDamage:4}}];
  events.receiveSimultaneousEvents(b,[attack,...hits],3);render('cinematic');
  const node=root.querySelector(`[data-unit-id="${u.id}"]`),animations=node.getAnimations({subtree:true});
  const hitAges=animations.filter(a=>a.animationName==='impact-float').map(a=>a.currentTime).sort((a,b)=>a-b);
  const swing=animations.find(a=>a.animationName==='cinematic-swing'),impact=animations.find(a=>a.animationName==='pawn-impact');
  return {hitAges,impactDuration:impact?.effect.getTiming().duration,cinematicDuration:swing?.effect.getTiming().duration,cinematicAge:swing?.currentTime,hitCount:node.querySelectorAll('[data-impact-event]').length};
 });
 expect(result.hitCount).toBe(2);expect(result.hitAges[0]).toBeLessThan(100);expect(result.hitAges[1]).toBeGreaterThanOrEqual(200);expect(result.impactDuration).toBe(900);expect(result.cinematicDuration).toBe(900);expect(result.cinematicAge).toBeGreaterThanOrEqual(400);expect(result.cinematicAge).toBeLessThan(900);
});
test('pausing from 4x retains animation progress',async({page})=>{
 await harness(page);
 const result=await page.evaluate(()=>{
  const u=b.units[0];u.q++;b.simultaneous.time=200;
  events.receiveSimultaneousEvents(b,[{id:1,time:0,duration:450,event:{actorId:u.id,type:'move',from:{q:u.q-1,r:u.r},to:u}}],1);render(4);
  const node=root.querySelector(`[data-unit-id="${u.id}"]`),get=()=>node.getAnimations().find(a=>a.animationName==='pawn-step').currentTime;
  const before=get();render(0);return {before,after:get()};
 });
 expect(result.after).toBe(result.before);
});
test('real playback controls preserve the battlefield and fighters',async({page})=>{
 const {createGame,startBattle}=await import('../src/engine.js');const {setSimultaneousBetaEnabled}=await import('../src/combat-config.js');
 const s=createGame(731);s.party[0].equipment.mount='war-horse';setSimultaneousBetaEnabled(true);s.position={x:440,y:520};startBattle(s,'quarry-camp');setSimultaneousBetaEnabled(false);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(save=>{localStorage.setItem('ashen-company-save-v1',save);localStorage.setItem('ashen-company-battle-speed-v1','1');},JSON.stringify(s));
 await page.goto('./');await expect(page.locator('.simultaneous-battle')).toBeVisible();
 const result=await page.evaluate(()=>{
  const view=document.querySelector('.simultaneous-battle'),unit=view.querySelector('[data-unit-id]');
  view.querySelector('[data-battle-speed="4"]').click();const fast=view===document.querySelector('.simultaneous-battle');
  view.querySelector('[data-battle-speed="0"]').click();const paused=view.classList.contains('sim-paused');
  document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));
  return {fast,paused,sameUnit:unit===document.querySelector(`[data-unit-id="${unit.dataset.unitId}"]`),resumed:!view.classList.contains('sim-paused')};
 });
 expect(result).toEqual({fast:true,paused:true,sameUnit:true,resumed:true});expect(errors).toEqual([]);
});
test('projectiles share the display clock through speed changes and pause',async({page})=>{
 await harness(page);
 const result=await page.evaluate(async()=>{
  const u=b.units[0],target=b.units.find(x=>x.side==='enemy');b.simultaneous.time=200;
  events.receiveSimultaneousEvents(b,[{id:1,time:100,duration:700,event:{actorId:u.id,targetId:target.id,type:'attack',ranged:true,weaponId:u.equipment.weapon,from:u,to:target,hit:true,hpDamage:2}}],1);render(1);
  const projectile=root.querySelector('[data-sim-projectile]'),animation=()=>projectile.getAnimations().find(a=>a.animationName==='arrow-flight');
  const normal=animation().currentTime;b.simultaneous.time=300;render(4);const fast=animation().currentTime,duration=animation().effect.getTiming().duration;
  render(0);const paused=animation().currentTime;await new Promise(r=>setTimeout(r,150));view.advanceBattlePresentation(root,b,0);
  return {normal,fast,duration,paused,after:animation().currentTime,same:projectile===root.querySelector('[data-sim-projectile]')};
 });
 expect(result.normal).toBeGreaterThanOrEqual(100);expect(result.fast).toBeGreaterThanOrEqual(50);expect(result.fast).toBeLessThan(75);expect(result.duration).toBe(175);expect(result.paused).toBe(result.after);expect(result.same).toBe(true);
});
test('a completed move can restart for the next identical rider step',async({page})=>{
 await harness(page);
 const result=await page.evaluate(()=>{
  const u=b.units[0];u.q++;b.simultaneous.time=50;
  events.receiveSimultaneousEvents(b,[{id:1,time:0,duration:250,event:{actorId:u.id,type:'move',from:{q:u.q-1,r:u.r},to:u}}],1);render(1);
  const node=root.querySelector(`[data-unit-id="${u.id}"]`),portrait=node.querySelector('.bb-portrait');
  b.simultaneous.time=300;render(1);u.q++;
  events.receiveSimultaneousEvents(b,[{id:2,time:300,duration:250,event:{actorId:u.id,type:'move',from:{q:u.q-1,r:u.r},to:u}}],2);render(1);
  const animation=node.getAnimations().find(a=>a.animationName==='pawn-step');
  return {age:animation?.currentTime,duration:animation?.effect.getTiming().duration,same:portrait===node.querySelector('.bb-portrait')};
 });
 expect(result.same).toBe(true);expect(result.duration).toBe(250);expect(result.age).toBeLessThan(100);
});
test('terminal combat keeps advancing the final fall within a one-second hold',async({page})=>{
 await harness(page);
 const result=await page.evaluate(async()=>{
  const actor=b.units[0],target=b.units.find(x=>x.side==='enemy');b.simultaneous.time=100;render(1);await new Promise(r=>setTimeout(r,200));target.alive=false;target.hp=0;b.status='victory';b.simultaneous.time=100;
  events.receiveSimultaneousEvents(b,[{id:1,time:50,duration:250,event:{actorId:target.id,type:'move',from:{q:target.q-1,r:target.r},to:target}},{id:2,time:100,duration:700,event:{actorId:actor.id,targetId:target.id,type:'fall',hit:true,fallen:true,hpDamage:5,from:actor,to:target}}],2);render(1);
  const node=root.querySelector(`[data-unit-id="${target.id}"]`),animation=node.getAnimations().find(a=>a.animationName==='pawn-fall'),hold=view.battlePresentationHold(b,1);
  const before=animation.currentTime;await new Promise(resolve=>{const start=performance.now();function frame(now){view.advanceBattlePresentation(root,b,1);if(now-start<750)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
  return {before,after:animation.currentTime,hold,duration:animation.effect.getTiming().duration};
 });
 expect(result.duration).toBe(700);expect(result.before).toBeLessThan(100);expect(result.after).toBeGreaterThanOrEqual(700);expect(result.hold).toBeLessThanOrEqual(1000);
});
test('a shield push moves its recipient without replacing the ongoing attack clock',async({page})=>{
 await harness(page);
 const result=await page.evaluate(()=>{
  const u=b.units[0],enemy=b.units.find(x=>x.side==='enemy'),from={q:u.q,r:u.r};u.q++;b.simultaneous.time=300;
  events.receiveSimultaneousEvents(b,[{id:1,time:0,duration:900,event:{actorId:u.id,targetId:enemy.id,type:'attack',weaponId:u.equipment.weapon,from,to:enemy}},{id:2,time:300,duration:450,event:{actorId:enemy.id,targetId:u.id,type:'move',skillName:'Knock Back',pushedFrom:from,from:enemy,to:u}}],2);render(1);
  const node=root.querySelector(`[data-unit-id="${u.id}"]`),animations=node.getAnimations({subtree:true});
  return {moving:node.classList.contains('action-move'),moveAge:animations.find(a=>a.animationName==='pawn-step')?.currentTime,attackAge:animations.find(a=>a.animationName==='weapon-swing')?.currentTime};
 });
 expect(result.moving).toBe(true);expect(result.moveAge).toBeLessThan(100);expect(result.attackAge).toBeGreaterThanOrEqual(300);
});
