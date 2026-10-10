import test from 'node:test';
import {applySimultaneousSnapshot,queueSimultaneousFrame,stopSimultaneousWorker,simultaneousWorkerStatus} from '../src/simultaneous-runner.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame,startBattle,advanceBattle,advanceSimultaneousBattle,validateSave,getCompanyStats,getItem,finishBattle,retreatBattle,SETTLEMENTS,getUndeadEncounters,getFactionPatrols,tick,activateMapTarget} from '../src/engine.js';
import {setSimultaneousBetaEnabled,combatBetaConfigHTML} from '../src/combat-config.js';
import {SIM_STEP_MS,SIM_ROUND_MS,simultaneousActionDelay,simultaneousEvents,simultaneousEventSerial,receiveSimultaneousEvents,rememberSimultaneousEvent,markSimultaneousEffect} from '../src/simultaneous-combat.js';
import {advanceAshenWinter} from '../src/undead-crisis.js';
import {advanceFactionSimulation} from '../src/faction-patrols.js';
import {battleHTML} from '../src/battle-view.js';
function battle(seed=731){const s=createGame(seed);setSimultaneousBetaEnabled(true);s.position={x:440,y:520};assert.ok(startBattle(s,'quarry-camp').ok);setSimultaneousBetaEnabled(false);return s;}
function safe(s){const b=s.battle,living=b.units.filter(u=>u.alive);assert.equal(new Set(living.map(u=>`${u.q},${u.r}`)).size,living.length);assert.ok(b.units.every(u=>u.ap>=0&&u.ap<=13&&u.fatigue>=0&&u.fatigue<=300));assert.deepEqual(validateSave(s),s);}
function steps(s,count=100){for(let i=0;i<count&&s.battle.status==='active';i++)advanceSimultaneousBattle(s,SIM_STEP_MS);}
function openAdjacent(s){const b=s.battle;b.field.tiles.forEach(t=>{t.terrain='open';t.height=0;});b.tactic='offense';b.formationAdvance=null;b.units.forEach((u,i)=>{u.q=u.side==='company'?8:9;u.r=(i%3)+8;u.equipment.weapon='arming-sword';u.equipment.shield=null;u.shieldDurability=0;u.maxShieldDurability=0;u.maxFatigue=150;u.fatigue=0;u.meleeSkill=60;u.meleeDefense=50;u.initiative=100;u.ap=9;u.turnStartedRound=1;b.simultaneous.actors[u.id].readyAt=0;});}

test('default stays turn based, beta applies only to new battles and normal advance routes to its clock',()=>{
 setSimultaneousBetaEnabled(false);assert.match(combatBetaConfigHTML(),/Realtime combat/);assert.doesNotMatch(combatBetaConfigHTML(),/data-simultaneous-beta checked/);const normal=createGame(731);normal.position={x:440,y:520};startBattle(normal,'quarry-camp');assert.equal(normal.battle.simultaneous,undefined);
 const before=structuredClone(normal.battle);setSimultaneousBetaEnabled(true);assert.deepEqual(normal.battle,before);assert.match(combatBetaConfigHTML(),/data-simultaneous-beta/);setSimultaneousBetaEnabled(false);
 const s=battle();assert.equal(s.battle.simultaneous.version,1);const time=s.battle.simultaneous.time;advanceBattle(s);assert.equal(s.battle.simultaneous.time,time+SIM_STEP_MS);safe(s);
});

test('both sides act on overlapping clocks in the same AP cycle',()=>{
 const s=battle();openAdjacent(s);advanceSimultaneousBattle(s,50);
 const events=simultaneousEvents(s.battle);assert.ok(events.some(e=>s.battle.units.find(u=>u.id===e.event.actorId)?.side==='company'));assert.ok(events.some(e=>s.battle.units.find(u=>u.id===e.event.actorId)?.side==='enemy'));
 assert.ok(events.length>=4);assert.equal(new Set(events.map(e=>e.time)).size,1);assert.equal(s.battle.round,1);assert.ok(s.battle.units.filter(u=>u.alive).every(u=>u.ap<9));safe(s);
 const html=battleHTML(s.battle,1,true);assert.match(html,/SIMULTANEOUS · BETA/);assert.ok((html.match(/is-acting/g)??[]).length>=4);
});

test('initiative, fatigue and AP cost affect independent recovery, including a finite free action',()=>{
 const u={initiative:100,fatigue:0};assert.ok(simultaneousActionDelay({...u,initiative:180},4,{type:'attack'})<simultaneousActionDelay({...u,initiative:60},4,{type:'attack'}));
 assert.ok(simultaneousActionDelay({...u,fatigue:80},4,{type:'attack'})>simultaneousActionDelay(u,4,{type:'attack'}));
 assert.ok(simultaneousActionDelay(u,6,{type:'attack'})>simultaneousActionDelay(u,2,{type:'move'}));assert.ok(simultaneousActionDelay(u,0,{type:'swap'})>=150);
});

test('split ticks and mid-cycle save/reload retain identical combat, RNG and readiness',()=>{
 const a=battle(),b=validateSave(JSON.parse(JSON.stringify(a)));advanceSimultaneousBattle(a,1000);
 for(const ms of [17,43,137,303,500])advanceSimultaneousBattle(b,ms);
 assert.deepEqual(a,b);const reload=validateSave(JSON.parse(JSON.stringify(b)));
 for(let i=0;i<30&&a.battle.status==='active';i++){advanceSimultaneousBattle(a,200);advanceSimultaneousBattle(reload,200);assert.deepEqual(a,reload);safe(a);}
});

test('timed stun blocks the fighter for a full cycle and survives reload; all timed effects expire',()=>{
 const s=battle(),u=s.battle.units[0];u.stunnedTurns=1;u.stunProtected=true;markSimultaneousEffect(s.battle,u,'stunnedTurns',1);
 for(const [key,n] of [['dazedTurns',2],['staggeredTurns',1],['disarmedTurns',1],['howlTurns',2]]){u[key]=n;markSimultaneousEffect(s.battle,u,key,n);}
 const reload=validateSave(JSON.parse(JSON.stringify(s))),actor=reload.battle.units.find(x=>x.id===u.id);
 // Empty cycles may skip wall-clock time; effects retain their simulation expiry.
 while(reload.battle.simultaneous.time<6000){
  advanceSimultaneousBattle(reload,SIM_STEP_MS);
  if(reload.battle.simultaneous.time<6000){assert.equal(actor.stunnedTurns,1);assert.ok(!simultaneousEvents(reload.battle).some(e=>e.event.actorId===actor.id));}
 }
 assert.equal(actor.stunnedTurns,0);assert.equal(actor.disarmedTurns,0);assert.equal(actor.staggeredTurns,0);assert.equal(actor.dazedTurns,1);safe(reload);
 while(reload.battle.simultaneous.time<12000&&reload.battle.status==='active')advanceSimultaneousBattle(reload,SIM_STEP_MS);
 assert.equal(actor.dazedTurns,0);assert.equal(actor.howlTurns,0);safe(reload);
});

test('pause is a zero delta, invalid time is rejected, and catch-up is bounded',()=>{
 const s=battle(),before=structuredClone(s);advanceSimultaneousBattle(s,0);assert.deepEqual(s,before);
 for(const ms of [-1,NaN,Infinity])assert.equal(advanceSimultaneousBattle(s,ms).ok,false);assert.deepEqual(s,before);
 advanceSimultaneousBattle(s,999999);assert.equal(s.battle.simultaneous.time,2000);safe(s);
});

test('forged clocks, rosters and effect expiries reject without mutating saves',()=>{
 const s=battle(),id=s.battle.units[0].id;
 for(const change of [c=>c.version=2,c=>c.time=1,c=>c.roundEndsAt++,c=>c.carryMs=50,c=>delete c.actors[id],c=>c.actors.extra=c.actors[id],c=>c.actors[id].readyAt=500000,c=>c.actors[id].effects.madeUp=6000,c=>c.actors[id].effects.stunnedTurns=6000]){
  const bad=structuredClone(s);change(bad.battle.simultaneous);const before=structuredClone(bad);assert.throws(()=>validateSave(bad),/simultaneous combat/);assert.deepEqual(bad,before);
 }
});

test('grid legality, wounds, reactions and saves remain valid throughout seeded fights',()=>{
 for(const seed of [19,53,719]){const s=battle(seed);for(let i=0;i<180&&s.battle.status==='active';i++){advanceSimultaneousBattle(s,100);if(i%15===0)safe(s);}safe(s);}
});

test('beta retreat settles real wounds and removes only the completed battlefield',()=>{
 const s=battle();steps(s,30);assert.ok(retreatBattle(s).ok);safe(s);assert.ok(finishBattle(s).ok);assert.equal(s.battle,null);assert.deepEqual(validateSave(s),s);
});

test('new beta modules are cached for offline play and design records activation and AP timing',async()=>{
 const build=await readFile(new URL('../tools/build-cache.mjs',import.meta.url),'utf8');assert.match(build,/src\/combat-config.js/);assert.match(build,/src\/simultaneous-combat.js/);
 const doc=await readFile(new URL('../docs/development/SIMULTANEOUS-COMBAT-BETA.md',import.meta.url),'utf8');assert.match(doc,/combat-beta=1/);assert.match(doc,/6-second AP cycle/);
});

function veteranCompany(seed=719){
 const s=createGame(seed),p=structuredClone(s.party[0]);while(s.party.length<15)s.party.push({...structuredClone(p),id:`fighter-${s.party.length}`});
 s.party.forEach((p,i)=>{p.level=7;p.combatRole=['frontliner','auto','ranged','flanker','skirmisher'][i%5];p.equipment.weapon=['arming-sword','billhook','hunting-bow','rondel-dagger','hunting-bow'][i%5];if(['billhook','hunting-bow'].includes(p.equipment.weapon))p.equipment.shield=null;const stats=getCompanyStats(p);p.armorDurability.shield=stats.maxShieldDurability;});
 s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);s.day=60;s.shipments={};s.shipmentLegacyThroughDay=60;
 const ctx={settlements:SETTLEMENTS,report(){}};const time=h=>{s.day=Math.floor(h/24)+1;s.hour=h%24;s.shipmentLegacyThroughDay=s.day;};
 advanceAshenWinter(s,ctx);time(s.ashenWinter.warningHour);advanceAshenWinter(s,ctx);time(s.ashenWinter.activationHour);advanceAshenWinter(s,ctx);return s;
}

test('47-fighter allied undead battle retains troop ownership, roles, unique hexes and reloadable clocks',()=>{
 const s=veteranCompany(),host=getUndeadEncounters(s).find(e=>e.kind==='undead-host'&&e.enemies.length===24),army=getFactionPatrols(s)[5];
 const now=(s.day-1)*24+s.hour;for(const p of Object.values(s.factionPatrols))p.cooldownUntil=now+6;
 Object.assign(s.factionPatrols[army.id],{x:host.x,y:host.y,cooldownUntil:0});s.hour+=.25;
 advanceFactionSimulation(s,{settlements:SETTLEMENTS,getItem,hostiles:()=>[host],currentHostile:id=>getUndeadEncounters(s).find(e=>e.id===id),hostileResult(){}});
 s.position={x:host.x,y:host.y};setSimultaneousBetaEnabled(true);assert.ok(activateMapTarget(s,'undead-host',host.id).ok);setSimultaneousBetaEnabled(false);
 assert.equal(s.battle.units.length,47);assert.equal(s.battle.units.filter(u=>u.ally).length,8);assert.equal(s.battle.patrolAssist.id,army.id);safe(s);
 const started=performance.now();for(let i=0;i<100&&s.battle.status==='active';i++){advanceSimultaneousBattle(s,100);if(i%20===0)safe(s);}safe(s);
 console.log(`47-fighter beta: ${Math.round(performance.now()-started)}ms for 10 simulated seconds; ${simultaneousEvents(s.battle).length} concurrent recent actions.`);
 const restored=validateSave(JSON.parse(JSON.stringify(s)));advanceSimultaneousBattle(s,200);advanceSimultaneousBattle(restored,200);assert.deepEqual(s,restored);
});

test('large fortified marshal battle remains saveable with full named equipment',()=>{
 const s=veteranCompany(720),camp=getUndeadEncounters(s).find(e=>e.kind==='undead-commander');s.position={x:camp.x,y:camp.y};setSimultaneousBetaEnabled(true);assert.ok(startBattle(s,camp.id).ok);setSimultaneousBetaEnabled(false);
 assert.equal(s.battle.units.filter(u=>u.side==='enemy').length,30);assert.equal(s.battle.units.filter(u=>u.side==='company'&&!u.ally).length,15);const allies=s.battle.units.filter(u=>u.ally);assert.ok(allies.length>=3&&allies.length<=6);assert.ok(allies.some(u=>!u.name.startsWith('Militia')));const marshal=s.battle.units.find(u=>u.troopIndex===0);for(const slot of ['weapon','armor','helmet','shield'])assert.ok(['named','famed'].includes(getItem(marshal.equipment[slot]).rarity));
 for(let i=0;i<60&&s.battle.status==='active';i++){advanceSimultaneousBattle(s,100);if(i%20===0)safe(s);}safe(s);
});

test('real beta victory awards normal loot and settles once',()=>{
 const s=createGame(19);for(const p of s.party){p.attributes.maxHp=150;p.attributes.meleeSkill=180;p.attributes.meleeDefense=120;p.attributes.maxFatigue=150;p.equipment.weapon='greatsword';p.equipment.shield=null;p.equipment.armor='plate-harness';p.equipment.helmet='greathelm';const stats=getCompanyStats(p);p.hp=stats.maxHp;p.armorDurability={...p.armorDurability,body:stats.maxBodyArmor,head:stats.maxHeadArmor,shield:0};}
 s.position={x:440,y:520};setSimultaneousBetaEnabled(true);startBattle(s,'quarry-camp');setSimultaneousBetaEnabled(false);
 for(let i=0;i<250&&s.battle.status==='active';i++)advanceSimultaneousBattle(s,500);
 assert.equal(s.battle.status,'victory');assert.ok(s.battle.loot.gold>0);safe(s);const gold=s.gold;assert.ok(finishBattle(s).ok);assert.ok(s.gold>gold);assert.equal(finishBattle(s).ok,false);assert.deepEqual(validateSave(s),s);
});

test('cached beta pathfinding preserves the existing tactical action on the same grid',()=>{
 for(const seed of [19,53,719])for(const role of ['frontliner','ranged','skirmisher','flanker','breaker','reach-support'])for(const weapon of ['arming-sword','hunting-bow','light-crossbow','billhook','throwing-spears']){
  const a=battle(seed),actor=a.battle.units[0];actor.tacticalRole=role;actor.equipment.weapon=weapon;
  const b=structuredClone(a);delete b.battle.simultaneous;
  b.battle.activeId=actor.id;b.battle.turnIndex=b.battle.turnOrder.indexOf(actor.id);
  for(const u of a.battle.units)a.battle.simultaneous.actors[u.id].readyAt=u.id===actor.id?0:2000;
  advanceBattle(b);advanceSimultaneousBattle(a,50);
  assert.deepEqual(a.battle.lastEvent,b.battle.lastEvent,`seed ${seed}, ${role}`);
  assert.deepEqual(a.battle.units.map(u=>[u.id,u.q,u.r,u.hp,u.fatigue]),b.battle.units.map(u=>[u.id,u.q,u.r,u.hp,u.fatigue]));
 }
});

test('bounded frames preserve pending equal-time actions across save/reload without duplicate AP costs',()=>{
 const a=battle();openAdjacent(a);advanceSimultaneousBattle(a,50,{maxActions:1});assert.ok(a.battle.simultaneous.pendingIds.length>0);safe(a);
 const b=validateSave(JSON.parse(JSON.stringify(a)));const before=structuredClone(a);advanceSimultaneousBattle(a,0);assert.deepEqual(a,before);
 for(let i=0;i<20&&a.battle.status==='active';i++){advanceSimultaneousBattle(a,50,{maxActions:1});advanceSimultaneousBattle(b,50,{maxActions:1});assert.deepEqual(a,b);safe(a);}
});


test('worker snapshots preserve full combat state, unit identity, removed statuses and supply expenditure',()=>{
 const live=battle(),remote=structuredClone(live),ref=live.battle,units=[...live.battle.units];
 live.battle.units[0].testStaleStatus=true;
 advanceSimultaneousBattle(remote,2000,{maxActions:8});
 applySimultaneousSnapshot(live,{battle:structuredClone(remote.battle),supplies:structuredClone(remote.supplies),events:simultaneousEvents(remote.battle)});
 assert.equal(live.battle,ref);for(const unit of units)assert.equal(live.battle.units.find(u=>u.id===unit.id),unit);
 assert.equal(live.battle.units[0].testStaleStatus,undefined);assert.deepEqual(live,remote);safe(live);
 assert.deepEqual(simultaneousEvents(live.battle),simultaneousEvents(remote.battle));
});

test('worker runner ignores terminated generations and falls back without Worker support',()=>{
 const saved=globalThis.Worker,workers=[];
 class FakeWorker {constructor(){workers.push(this);}postMessage(message){this.last=message;}terminate(){this.terminated=true;}}
 try{
  globalThis.Worker=FakeWorker;const s=battle();queueSimultaneousFrame(s,50);const first=workers[0];
  first.onmessage({data:{type:'ready'}});queueSimultaneousFrame(s,50);assert.equal(first.last.type,'step');assert.equal(simultaneousWorkerStatus().inFlight,true);
  const remote=structuredClone(s);advanceSimultaneousBattle(remote,100);const snapshot={type:'snapshot',battle:remote.battle,supplies:remote.supplies,events:simultaneousEvents(remote.battle)};
  stopSimultaneousWorker();assert.ok(first.terminated);const before=structuredClone(s);first.onmessage({data:snapshot});assert.deepEqual(s,before);
  queueSimultaneousFrame(s,50);const second=workers[1];second.onmessage({data:{type:'snapshot',...snapshot}});assert.deepEqual(s,remote);assert.equal(queueSimultaneousFrame(s,0).updated,true);
  stopSimultaneousWorker();globalThis.Worker=undefined;const time=s.battle.simultaneous.time;queueSimultaneousFrame(s,50);assert.ok(s.battle.simultaneous.time>=time);safe(s);
 }finally{stopSimultaneousWorker();if(saved===undefined)delete globalThis.Worker;else globalThis.Worker=saved;}
});


test('ephemeral event sequence survives worker restarts without replaying or suppressing future sound',()=>{
 const s=battle();steps(s,10);const serial=simultaneousEventSerial(s.battle);assert.ok(serial>0);
 const remote=structuredClone(s);receiveSimultaneousEvents(remote.battle,[],serial);
 const event=rememberSimultaneousEvent(remote.battle,remote.battle.lastEvent,300);assert.equal(event.id,serial+1);
 applySimultaneousSnapshot(s,{battle:remote.battle,supplies:remote.supplies,events:[],eventSerial:event.id});
 globalThis.Worker=class{postMessage(data){if(data.type==='init')assert.equal(data.eventSerial,event.id);}terminate(){}};
 try{queueSimultaneousFrame(s,50);}finally{stopSimultaneousWorker();delete globalThis.Worker;}
});

test('exhausted cycles skip the empty tail only after final recovery and survive reload',()=>{
 const s=battle(),b=s.battle;b.simultaneous.time=1000;
 for(const u of b.units){u.ap=0;b.simultaneous.actors[u.id].readyAt=1300;}
 const affected=b.units[0];affected.howlTurns=2;markSimultaneousEffect(b,affected,'howlTurns',2);
 const reloaded=validateSave(JSON.parse(JSON.stringify(s)));
 for(const state of [s,reloaded]){
  advanceSimultaneousBattle(state,250);assert.equal(state.battle.simultaneous.time,1250);assert.equal(state.battle.round,1);
  advanceSimultaneousBattle(state,50);assert.equal(state.battle.simultaneous.time,1300);assert.equal(state.battle.round,1);
  advanceSimultaneousBattle(state,50,{maxActions:1});assert.equal(state.battle.simultaneous.time,6000);assert.equal(state.battle.round,2);safe(state);
 }
 assert.deepEqual(s,reloaded);assert.equal(s.battle.simultaneous.actors[affected.id].effects.howlTurns,13000);assert.equal(s.battle.units[0].howlTurns,2);
});

test('actionable AP blocks early refresh but a lone stunned fighter does not stall the cycle',()=>{
 const s=battle(),b=s.battle;b.simultaneous.time=1000;
 for(const u of b.units){u.ap=0;b.simultaneous.actors[u.id].readyAt=1000;}
 const actor=b.units[0];actor.ap=2;b.simultaneous.actors[actor.id].readyAt=5000;
 advanceSimultaneousBattle(s,250);assert.equal(b.simultaneous.time,1250);assert.equal(b.round,1);safe(s);
 actor.ap=9;actor.stunnedTurns=1;actor.stunProtected=true;markSimultaneousEffect(b,actor,'stunnedTurns',1);b.simultaneous.actors[actor.id].readyAt=1000;
 const expiry=b.simultaneous.actors[actor.id].effects.stunnedTurns;
 advanceSimultaneousBattle(s,50,{maxActions:1});assert.equal(b.round,2);assert.equal(actor.stunnedTurns,1);
 assert.equal(b.simultaneous.actors[actor.id].effects.stunnedTurns,expiry);safe(s);
 actor.ap=0;const before=structuredClone(s);advanceSimultaneousBattle(s,0);assert.deepEqual(s,before);
});

test('early AP refresh still applies bleeding once and supports old exhausted readiness timestamps',()=>{
 const s=battle(),b=s.battle;b.simultaneous.time=1000;
 for(const u of b.units){u.ap=0;b.simultaneous.actors[u.id].readyAt=1000;}
 const u=b.units[0],hp=u.hp;u.bleeding={damage:3,turns:2,sourceId:b.units.find(x=>x.side==='enemy').id};u.bleedTickRound=1;
 advanceSimultaneousBattle(s,50,{maxActions:1});assert.equal(b.round,2);assert.equal(u.hp,hp-3);assert.equal(u.bleeding.turns,1);assert.equal(u.bleedTickRound,2);safe(s);
 const old=battle();for(const unit of old.battle.units){unit.ap=0;old.battle.simultaneous.actors[unit.id].readyAt=6000;}
 const restored=validateSave(JSON.parse(JSON.stringify(old)));advanceSimultaneousBattle(restored,1000);assert.equal(restored.battle.simultaneous.time,1000);safe(restored);
});

test('compact worker snapshots retain the mounted immutable field',()=>{
 const s=battle(),remote=structuredClone(s),field=s.battle.field;advanceSimultaneousBattle(remote,50);const snapshotBattle=structuredClone(remote.battle);delete snapshotBattle.field;applySimultaneousSnapshot(s,{battle:snapshotBattle,supplies:structuredClone(remote.supplies),events:simultaneousEvents(remote.battle)});assert.equal(s.battle.field,field);assert.deepEqual(s,remote);
});

test('final slow attack settles at its animation end instead of its long next-action cooldown',()=>{
 const s=battle();openAdjacent(s);const b=s.battle,actor=b.units[0];
 for(const u of b.units){u.ap=0;b.simultaneous.actors[u.id].readyAt=0;}
 actor.ap=4;actor.initiative=10;
 advanceSimultaneousBattle(s,50);
 const entry=simultaneousEvents(b).find(e=>e.event.actorId===actor.id);
 assert.ok(entry);assert.ok(['attack','miss'].includes(entry.event.type));assert.equal(actor.ap,0);
 assert.ok(simultaneousActionDelay(actor,4,entry.event)>entry.duration+500);
 assert.equal(b.simultaneous.actors[actor.id].readyAt,entry.time+Math.ceil(entry.duration/SIM_STEP_MS)*SIM_STEP_MS);
 const restored=validateSave(JSON.parse(JSON.stringify(s)));
 for(const state of [s,restored]){
  advanceSimultaneousBattle(state,entry.duration-SIM_STEP_MS);assert.equal(state.battle.round,1);
  advanceSimultaneousBattle(state,SIM_STEP_MS);assert.equal(state.battle.round,1);
  advanceSimultaneousBattle(state,SIM_STEP_MS,{maxActions:1});assert.equal(state.battle.round,2);safe(state);
 }
 assert.deepEqual(s,restored);
});

test('slow fighters with remaining AP recover within one second rather than waiting out a long cooldown',()=>{
 const s=battle();openAdjacent(s);const b=s.battle,actor=b.units[0];
 for(const u of b.units){u.ap=0;b.simultaneous.actors[u.id].readyAt=0;}
 actor.ap=9;actor.initiative=10;
 advanceSimultaneousBattle(s,50);
 const entry=simultaneousEvents(b).find(e=>e.event.actorId===actor.id);
 assert.ok(actor.ap>0);const delay=simultaneousActionDelay(actor,9-actor.ap,entry.event);
 assert.ok(delay>1000);assert.equal(b.simultaneous.actors[actor.id].readyAt,entry.time+1000);
 advanceSimultaneousBattle(s,950);assert.equal(actor.ap,5);
 advanceSimultaneousBattle(s,50);assert.equal(b.round,1);assert.equal(actor.ap,1);safe(s);
});

test('a last-AP Berserk kill retains its extra action and normal recovery within the same cycle',()=>{
 const s=battle();openAdjacent(s);const b=s.battle,actor=b.units[0];
 const person=s.party.find(p=>p.id===actor.id);person.level=20;person.perks.push('berserk');actor.perks.push('berserk');
 for(const u of b.units){u.ap=0;b.simultaneous.actors[u.id].readyAt=0;if(u.side==='enemy'){u.hp=1;u.bodyArmor=0;u.headArmor=0;u.meleeDefense=0;}}
 actor.ap=4;actor.initiative=10;actor.meleeSkill=200;b.rng=0;
 advanceSimultaneousBattle(s,50);
 const entry=simultaneousEvents(b).find(e=>e.event.actorId===actor.id);
 assert.ok(entry.event.effects.some(e=>e.id==='berserk'&&!e.nextTurn));assert.equal(actor.ap,4);assert.equal(b.round,1);
 const delay=Math.min(simultaneousActionDelay(actor,4,entry.event),1000);
 assert.equal(b.simultaneous.actors[actor.id].readyAt,entry.time+delay);assert.ok(delay>entry.duration);
 advanceSimultaneousBattle(s,900);assert.equal(b.round,1);assert.equal(actor.ap,4);safe(s);
 const restored=validateSave(JSON.parse(JSON.stringify(s)));
 for(const state of [s,restored])advanceSimultaneousBattle(state,delay-900);
 assert.deepEqual(s,restored);assert.equal(b.round,1);assert.ok(actor.ap<4,'Berserk AP fund another action before the round refresh');assert.equal(actor.berserkRound,1);safe(s);
});

test('a stunned straggler cannot skip the incoming impact animation at an otherwise empty cycle end',()=>{
 const s=battle(),b=s.battle;b.simultaneous.time=1000;
 for(const u of b.units){u.ap=0;b.simultaneous.actors[u.id].readyAt=1000;}
 const target=b.units[0],attacker=b.units.find(u=>u.side!==target.side);
 target.ap=9;target.stunnedTurns=1;target.stunProtected=true;markSimultaneousEffect(b,target,'stunnedTurns',1);
 rememberSimultaneousEvent(b,{type:'attack',actorId:attacker.id,targetId:target.id},1125);
 advanceSimultaneousBattle(s,850);assert.equal(b.round,1);
 advanceSimultaneousBattle(s,50);assert.equal(b.round,1);
 advanceSimultaneousBattle(s,50,{maxActions:1});assert.equal(b.round,2);assert.equal(target.stunnedTurns,1);safe(s);
});

test('cached Reach Support shelter and rough-terrain routes match turn-based decisions',()=>{
 for(const rough of [false,true]){
  const a=battle(19),btl=a.battle,actor=btl.units.find(u=>u.side==='company'),ally=btl.units.find(u=>u.side==='company'&&u!==actor),target=btl.units.find(u=>u.side==='enemy');
  for(const tile of btl.field.tiles){tile.terrain='open';tile.height=0;}
  for(const [i,u]of btl.units.entries())Object.assign(u,{q:1+i,r:20});
  Object.assign(actor,{q:4,r:8,ap:9,fatigue:0,turnStartedRound:1,tacticalRole:'reach-support',equipment:{...actor.equipment,weapon:'billhook',shield:null,mount:null},shieldDurability:0});
  Object.assign(ally,{q:6,r:8,equipment:{...ally.equipment,weapon:'arming-sword',shield:'round-shield'},shieldDurability:40});
  Object.assign(target,{q:7,r:8,hp:300,maxHp:300});
  if(rough)btl.field.tiles.find(t=>t.q===5&&t.r===8).terrain='trees';
  const b=structuredClone(a);delete b.battle.simultaneous;b.battle.activeId=actor.id;b.battle.turnIndex=b.battle.turnOrder.indexOf(actor.id);
  for(const u of btl.units)btl.simultaneous.actors[u.id].readyAt=u.id===actor.id?0:2000;
  advanceBattle(b);advanceSimultaneousBattle(a,50);
  assert.equal(b.battle.lastEvent.type,'move');assert.deepEqual(btl.lastEvent,b.battle.lastEvent);
  assert.deepEqual(btl.units.map(u=>[u.id,u.q,u.r,u.hp,u.fatigue]),b.battle.units.map(u=>[u.id,u.q,u.r,u.hp,u.fatigue]));
 }
});
