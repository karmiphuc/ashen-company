import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,SETTLEMENTS,getItem,getRoamingBands,getFactionPatrols,tick,validateSave,startBattle,joinPatrolBattle,getJoinablePatrolBattle,activateMapTarget,advanceBattle,resolveBattle,retreatBattle,finishBattle,getUndeadEncounters,pursueBand} from '../src/engine.js';
import {campSidebarHTML} from '../src/campaign-ui.js';
import {advanceFactionSimulation,skirmishDuration,worldSkirmishFor} from '../src/faction-patrols.js';
function setTime(s,h){s.day=Math.floor(h/24)+1;s.hour=h%24;}
function fixture(index=0,troops=null){
 const s=createGame(99),army=getFactionPatrols(s)[index];
 if(troops)s.factionPatrols[army.id].troops=[...troops];
 for(const p of Object.values(s.factionPatrols))p.cooldownUntil=14;
 s.factionPatrols[army.id].cooldownUntil=0;
 const band={...getRoamingBands(s).find(b=>b.difficulty>0),x:army.x,y:army.y};Object.assign(s.bands[band.id],{x:band.x,y:band.y});
 const results=[],context={settlements:SETTLEMENTS,getItem,hostiles:()=>[band],currentHostile:id=>id===band.id?band:null,hostileResult:(...args)=>results.push(args)};
 s.hour=8.25;advanceFactionSimulation(s,context);return {s,army,band,context,results};
}

test('world combat duration grows from hours into days with troop count',()=>{
 assert.equal(skirmishDuration(1,1),3);assert.ok(skirmishDuration(8,3)>=8);assert.ok(skirmishDuration(9,20)>=48);assert.equal(skirmishDuration(100,100),72);
 assert.ok(skirmishDuration(8,8)>skirmishDuration(8,2));
});

test('committed patrols remain in place and retain all troops until their saved deadline',()=>{
 let {s,army,band,context,results}=fixture();const f=worldSkirmishFor(s,army.id);assert.ok(f);assert.equal(f.bId,band.id);assert.equal(results.length,0);assert.equal(s.factionReports.length,0);
 const p=s.factionPatrols[army.id],before=structuredClone(p);const snapshot=structuredClone(s);s=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(s,snapshot);
 setTime(s,f.endHour-.25);advanceFactionSimulation(s,context);assert.deepEqual(s.factionPatrols[army.id],before);assert.equal(results.length,0);assert.equal(s.factionReports.length,0);
 setTime(s,f.endHour);advanceFactionSimulation(s,context);assert.equal(results.length,1);assert.ok(s.factionReports.some(r=>r.patrolId===army.id));assert.equal(worldSkirmishFor(s,army.id),null);
 advanceFactionSimulation(s,context);assert.equal(results.length,1,'completion cannot be applied twice');assert.ok(s.factionPatrols[army.id].troops.length<before.troops.length);
});

test('world engagement snapshots reject malformed timers, participants, generations and survivor indices',()=>{
 const {s}=fixture();for(const edit of [s=>s.worldSkirmishes[0].endHour++,s=>s.worldSkirmishes[0].startHour=100,s=>s.worldSkirmishes[0].aCycle++,s=>s.worldSkirmishes[0].bCycle++,s=>s.worldSkirmishes[0].result.aSurvivors=[99],s=>s.worldSkirmishes.push(structuredClone(s.worldSkirmishes[0])),s=>s.worldSkirmishes[0].aTroops.push(0)]){
  const bad=structuredClone(s);edit(bad);const copy=structuredClone(bad);assert.throws(()=>validateSave(bad),/world skirmish/);assert.deepEqual(bad,copy);
 }
 const old=createGame(1);delete old.worldSkirmishes;assert.deepEqual(validateSave(old).worldSkirmishes,[]);
});

test('large and split ticks with save imports preserve timed fights and outcomes exactly',()=>{
 const whole=createGame(1);let split=structuredClone(whole);tick(whole,18);
 for(let i=0;i<72;i++){tick(split,.25);split=validateSave(JSON.parse(JSON.stringify(split)));}
 assert.deepEqual(split,whole);assert.ok(whole.factionReports.length>0);assert.ok(whole.worldSkirmishes.length>0);
});

test('starting a company battle releases an ongoing NPC fight without prematurely assigning casualties',()=>{
 const {s,army,band}=fixture();s.position={x:band.x,y:band.y};const troops=[...s.factionPatrols[army.id].troops];
 assert.equal(startBattle(s,band.id).ok,true);assert.equal(worldSkirmishFor(s,band.id),null);assert.deepEqual(s.factionPatrols[army.id].troops,troops);assert.equal(s.factionReports.length,0);assert.deepEqual(validateSave(s),s);
});


test('joining an allied fight deploys the actual patrol and preserves its roster across saves and turns',()=>{
 let {s,army,band}=fixture();s.position={x:army.x,y:army.y};
 const patrol=getFactionPatrols(s).find(p=>p.id===army.id),before=[...s.factionPatrols[army.id].troops];
 assert.match(campSidebarHTML(s,patrol),/data-join-patrol=.*Join allied battle/);
 assert.equal(patrol.joinableBattle,true);assert.ok(getJoinablePatrolBattle(s,army.id));
 assert.equal(activateMapTarget(s,'patrol',army.id).ok,true);
 assert.equal(worldSkirmishFor(s,band.id),null);
 const allies=s.battle.units.filter(u=>u.ally);assert.equal(allies.length,before.length);
 assert.deepEqual(allies.map(u=>u.equipment.weapon),patrol.enemies.map(e=>e.weapon));
 assert.deepEqual(allies.map(u=>u.equipment.armor),patrol.enemies.map(e=>e.armor));
 assert.ok(allies.every(u=>u.q>=6));
 assert.deepEqual(validateSave(s),s);
 for(let i=0;i<60&&s.battle.status==='active';i++){advanceBattle(s);s=validateSave(JSON.parse(JSON.stringify(s)));}
 assert.deepEqual(s.factionPatrols[army.id].troops,before,'casualties apply only at settlement of the battle');
});

test('travel to an allied battle survives imports and joins upon arrival',()=>{
 let {s,army,band}=fixture();s.position={x:army.x+75,y:army.y+10};
 for(const other of getRoamingBands(s))if(other.id!==band.id)s.bands[other.id].defeatedUntil=56.25;
 assert.equal(joinPatrolBattle(s,army.id).ok,true);assert.equal(s.destinationAction.type,'patrol');
 s=validateSave(JSON.parse(JSON.stringify(s)));
 for(let i=0;i<80&&!s.battle&&s.destination;i++){tick(s,.25);s=validateSave(JSON.parse(JSON.stringify(s)));}
 assert.ok(s.battle?.patrolAssist);assert.equal(s.destination,null);
});

test('a battle that finishes before arrival stops travel without reopening the fight',()=>{
 let {s,army}=fixture();const fight=worldSkirmishFor(s,army.id);setTime(s,fight.endHour-.25);
 s.position={x:army.x+500,y:army.y+50};assert.equal(joinPatrolBattle(s,army.id).ok,true);
 tick(s,.25);assert.equal(s.battle,null);assert.equal(s.destination,null);assert.equal(s.destinationAction,null);
 assert.equal(getJoinablePatrolBattle(s,army.id),null);assert.deepEqual(validateSave(s),s);
});

test('retreat preserves actual patrol and hostile casualties and cannot apply them twice',()=>{
 const {s,army,band}=fixture();s.position={x:army.x,y:army.y};joinPatrolBattle(s,army.id);
 const ally=s.battle.units.find(u=>u.id==='ally-2'),enemy=s.battle.units.find(u=>u.side==='enemy');
 ally.hp=0;ally.alive=false;enemy.hp=0;enemy.alive=false;
 retreatBattle(s);assert.deepEqual(validateSave(s),s);assert.equal(finishBattle(s).ok,true);
 assert.ok(!s.factionPatrols[army.id].troops.includes(1));assert.equal(s.factionPatrols[army.id].losses,1);
 assert.equal(s.factionReports.at(-1).losses,1);assert.ok(!s.worldLosses[band.id].survivors.includes(0));
 assert.deepEqual(validateSave(s),s);const saved=structuredClone(s);assert.equal(finishBattle(s).ok,false);assert.deepEqual(s,saved);
});

test('victory clears the band and records patrol casualties without applying the scheduled NPC outcome',()=>{
 const {s,army,band}=fixture();s.position={x:army.x,y:army.y};joinPatrolBattle(s,army.id);
 const ally=s.battle.units.find(u=>u.ally);ally.hp=0;ally.alive=false;
 for(const enemy of s.battle.units.filter(u=>u.side==='enemy')){enemy.hp=1;enemy.bodyArmor=0;enemy.headArmor=0;}
 assert.equal(resolveBattle(s).ok,true);assert.equal(s.battle.status,'victory');
 assert.deepEqual(validateSave(s),s);finishBattle(s);assert.equal(s.factionPatrols[army.id].wins,1);
 assert.ok(!s.factionPatrols[army.id].troops.includes(0));assert.equal(s.worldSkirmishes.length,0);
 assert.equal(s.factionReports.length,1);assert.deepEqual(validateSave(s),s);
});

test('unavailable patrols and forged assistance snapshots are rejected without mutation',()=>{
 const {s,army}=fixture();const neutral=getFactionPatrols(s).find(p=>p.playerRelation==='neutral');
 const snapshot=structuredClone(s);assert.equal(joinPatrolBattle(s,neutral.id).ok,false);assert.deepEqual(s,snapshot);
 s.position={x:army.x,y:army.y};joinPatrolBattle(s,army.id);
 for(const edit of [b=>b.patrolAssist.cycle++,b=>b.patrolAssist.troops=[0],b=>b.patrolAssist.enemyTroops=[19],b=>b.patrolAssist.id=neutral.id,b=>delete b.patrolAssist]){
  const bad=structuredClone(s);edit(bad.battle);const original=structuredClone(bad);assert.throws(()=>validateSave(bad),/battle/);assert.deepEqual(bad,original);
 }
});


test('a depleted veteran patrol brings only its surviving identities, equipment and combat bonuses',()=>{
 const {s,army}=fixture(2,[0,2,5]);s.position={x:army.x,y:army.y};
 const roster=getFactionPatrols(s).find(p=>p.id===army.id).enemies;
 assert.equal(joinPatrolBattle(s,army.id).ok,true);const allies=s.battle.units.filter(u=>u.ally);
 assert.equal(allies.length,3);assert.deepEqual(s.battle.patrolAssist.troops,[0,2,5]);
 assert.deepEqual(allies.map(u=>u.equipment.weapon),roster.map(e=>e.weapon));
 assert.deepEqual(validateSave(s),s);retreatBattle(s);finishBattle(s);assert.deepEqual(s.factionPatrols[army.id].troops,[0,2,5]);
});

test('joining at the edge of the patrol radius works even when the band is across the patrol',()=>{
 const {s,army,band}=fixture();s.bands[band.id].x=army.x+30;s.position={x:army.x-34,y:army.y};
 assert.equal(joinPatrolBattle(s,army.id).ok,true);assert.ok(s.battle?.patrolAssist);assert.deepEqual(validateSave(s),s);
});

test('allied interception of an undead host can be joined and saved without undead traits on soldiers',async()=>{
 const {advanceAshenWinter}=await import('../src/undead-crisis.js');
 const s=createGame(719),original=structuredClone(s.party[0]);
 while(s.party.length<6)s.party.push({...structuredClone(original),id:`fighter-${s.party.length}`,name:`Fighter ${s.party.length}`});
 s.party.forEach(p=>p.level=7);s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);
 s.day=60;s.shipments={};s.shipmentLegacyThroughDay=60;
 const context={settlements:SETTLEMENTS,report(){}};advanceAshenWinter(s,context);
 setTime(s,s.ashenWinter.warningHour);advanceAshenWinter(s,context);setTime(s,s.ashenWinter.activationHour);advanceAshenWinter(s,context);s.shipmentLegacyThroughDay=s.day;
 const host=getUndeadEncounters(s).find(e=>e.kind==='undead-host'),army=getFactionPatrols(s)[0],now=(s.day-1)*24+s.hour;
 for(const p of Object.values(s.factionPatrols))p.cooldownUntil=now+6;
 Object.assign(s.factionPatrols[army.id],{x:host.x,y:host.y,cooldownUntil:0});s.hour+=.25;
 advanceFactionSimulation(s,{settlements:SETTLEMENTS,getItem,hostiles:()=>[host],currentHostile:id=>id===host.id?host:null,hostileResult(){}});
 s.position={x:host.x,y:host.y};assert.equal(activateMapTarget(s,'undead-host',host.id).ok,true);
 assert.ok(s.battle.units.filter(u=>u.ally).every(u=>u.undeadTraitsVersion===undefined&&u.troopIndex===undefined));
 assert.deepEqual(validateSave(s),s);retreatBattle(s);finishBattle(s);assert.deepEqual(validateSave(s),s);
});


test('double-clicking the fighting enemy enters the existing allied battle when nearby',()=>{
 const {s,army,band}=fixture();s.position={x:band.x,y:band.y};
 assert.equal(activateMapTarget(s,'band',band.id).ok,true);
 assert.equal(s.battle.patrolAssist.id,army.id);assert.equal(s.battle.units.filter(u=>u.ally).length,8);
 assert.equal(s.worldSkirmishes.length,0);assert.equal(s.factionReports.length,0);assert.deepEqual(validateSave(s),s);
});

test('double-clicking the fighting enemy from afar keeps both forces committed until the company joins',()=>{
 let {s,army,band}=fixture();s.position={x:army.x+75,y:army.y+10};
 for(const other of getRoamingBands(s))if(other.id!==band.id)s.bands[other.id].defeatedUntil=56.25;
 const fight=structuredClone(s.worldSkirmishes[0]);assert.equal(activateMapTarget(s,'band',band.id).ok,true);
 assert.equal(s.pursuit,null);assert.deepEqual(s.destinationAction,{type:'patrol',id:army.id});
 tick(s,.25);assert.deepEqual(s.worldSkirmishes[0],fight);assert.equal(s.factionPatrols[army.id].behavior,'engaging');
 s=validateSave(JSON.parse(JSON.stringify(s)));
 for(let i=0;i<40&&s.destination&&!s.battle;i++)tick(s,.25);
 assert.equal(s.battle?.patrolAssist.id,army.id);assert.deepEqual(validateSave(s),s);
});

test('enemy-sidebar pursuit and a saved legacy pursuit use the same allied handoff',()=>{
 for(const legacy of [false,true]){
  const {s,army,band}=fixture();s.position={x:army.x+75,y:army.y+10};
  for(const other of getRoamingBands(s))if(other.id!==band.id)s.bands[other.id].defeatedUntil=56.25;
  if(legacy){s.pursuit=band.id;s.destination={x:band.x,y:band.y};assert.deepEqual(validateSave(s),s);}
  else assert.equal(pursueBand(s,band.id).ok,true);
  tick(s,.25);assert.equal(s.worldSkirmishes.length,1);assert.equal(s.pursuit,null);assert.equal(s.destinationAction.id,army.id);
  assert.deepEqual(validateSave(s),s);
 }
});

test('reserving an enemy already in combat does not release its NPC opponents',()=>{
 const {s,army,band,context}=fixture();s.pursuit=band.id;s.destination={x:band.x+75,y:band.y};
 const fight=structuredClone(s.worldSkirmishes[0]);s.hour+=.25;advanceFactionSimulation(s,context);
 assert.deepEqual(s.worldSkirmishes,[fight]);assert.equal(s.factionPatrols[army.id].targetId,band.id);
});


test('intercepting before the simulation commits a fight brings the nearby allied patrol',()=>{
 const {s,army,band}=fixture(2,[0,2,5]);
 // The player arrives between simulation steps, while the patrol is closing in.
 s.worldSkirmishes=[];s.position={x:band.x,y:band.y};
 const p=s.factionPatrols[army.id];p.behavior='engaging';p.targetId=band.id;
 const roster=getFactionPatrols(s).find(p=>p.id===army.id).enemies;
 assert.equal(activateMapTarget(s,'band',band.id).ok,true);
 assert.equal(s.battle.patrolAssist.id,army.id);
 assert.deepEqual(s.battle.patrolAssist.troops,[0,2,5]);
 const allies=s.battle.units.filter(u=>u.ally);
 assert.deepEqual(allies.map(u=>u.equipment.weapon),roster.map(e=>e.weapon));
 assert.ok(allies.every(u=>s.battle.turnOrder.includes(u.id)));
 assert.deepEqual(validateSave(s),s);
 let allyActed=false;
 for(let i=0;i<300&&s.battle.status==='active';i++){
  advanceBattle(s);if(s.battle.lastEvent?.actorId?.startsWith('ally-'))allyActed=true;
 }
 assert.ok(allyActed,'the deployed patrol must actually take turns');
 retreatBattle(s);finishBattle(s);assert.equal(s.factionReports.at(-1).patrolId,army.id);
 assert.deepEqual(validateSave(s),s);
});

test('nearby assistance excludes distant, recovering, neutral and differently engaged patrols',()=>{
 for(const reason of ['distant','recovering','returning','other-target','neutral']){
  const {s,army,band}=fixture(reason==='neutral'?3:0);s.worldSkirmishes=[];
  s.position={x:band.x,y:band.y};const p=s.factionPatrols[army.id];
  if(reason==='distant')p.x+=100;
  if(reason==='recovering')p.cooldownUntil=s.hour+6;
  if(reason==='returning')p.behavior='returning';
  if(reason==='other-target')p.targetId=getRoamingBands(s).find(b=>b.id!==band.id).id;
  assert.equal(startBattle(s,band.id).ok,true);
  assert.equal(s.battle.patrolAssist,undefined,reason);
  assert.equal(s.battle.units.filter(u=>u.ally).length,0,reason);
  assert.deepEqual(validateSave(s),s);
 }
});


test('retreating with allied assistance and no enemy casualties keeps the save valid',()=>{
 for(const depleted of [false,true]){
  const {s,army,band}=fixture();s.position={x:army.x,y:army.y};
  if(depleted){
   const fight=s.worldSkirmishes[0],size=Math.max(...fight.bTroops)+1;
   fight.bTroops=[0];fight.result.bSurvivors=[];
   s.worldLosses[band.id]={cycle:band.spawnCycle,size,survivors:[0]};
  }
  const before=structuredClone(s.worldLosses);
  assert.equal(joinPatrolBattle(s,army.id).ok,true);retreatBattle(s);finishBattle(s);
  assert.deepEqual(s.worldLosses,before);assert.deepEqual(validateSave(s),s);
 }
});

for(const index of [0,3,5,8])for(const entry of ['map','sidebar','direct'])test(`targeting bandits includes faction patrol ${index} through ${entry}`,()=>{
 const {s,army,band}=fixture(index,[0,2,5]);s.position={x:band.x,y:band.y};
 const roster=getFactionPatrols(s).find(p=>p.id===army.id).enemies;
 const result=entry==='map'?activateMapTarget(s,'band',band.id):entry==='sidebar'?pursueBand(s,band.id):startBattle(s,band.id);
 assert.equal(result.ok,true);assert.equal(s.battle.patrolAssist?.id,army.id);
 const allies=s.battle.units.filter(u=>u.ally);assert.equal(allies.length,3);assert.deepEqual(allies.map(u=>u.equipment.weapon),roster.map(e=>e.weapon));
 assert.ok(allies.every(u=>s.battle.turnOrder.includes(u.id)));assert.deepEqual(validateSave(s),s);
});

test('targeting a timed-out but unresolved patrol fight cannot silently split its opponents',()=>{
 const {s,band}=fixture();s.position={x:band.x,y:band.y};setTime(s,s.worldSkirmishes[0].endHour);
 const before=structuredClone(s);assert.equal(startBattle(s,band.id).ok,false);assert.deepEqual(s,before);
});


test('joining an Eastern March fight from afar survives travel and saving',()=>{
 let {s,army,band}=fixture(5);s.position={x:army.x-75,y:army.y+10};
 for(const other of getRoamingBands(s))if(other.id!==band.id)s.bands[other.id].defeatedUntil=56.25;
 assert.ok(activateMapTarget(s,'band',band.id).ok);assert.deepEqual(s.destinationAction,{type:'patrol',id:army.id});
 s=validateSave(JSON.parse(JSON.stringify(s)));
 for(let i=0;i<40&&s.destination&&!s.battle;i++){tick(s,.25);s=validateSave(JSON.parse(JSON.stringify(s)));}
 assert.equal(s.battle?.patrolAssist.id,army.id);assert.equal(s.battle.units.filter(u=>u.ally).length,8);
});

test('neutral patrol casualties and victory apply once after a shared fight',()=>{
 const {s,army,band}=fixture(5,[0,2,5]);s.position={x:band.x,y:band.y};assert.ok(activateMapTarget(s,'band',band.id).ok);
 const casualty=s.battle.units.find(u=>u.ally);casualty.hp=0;casualty.alive=false;
 for(const enemy of s.battle.units.filter(u=>u.side==='enemy')){enemy.hp=1;enemy.bodyArmor=0;enemy.headArmor=0;}
 assert.ok(resolveBattle(s).ok);assert.equal(s.battle.status,'victory');assert.deepEqual(validateSave(s),s);assert.ok(finishBattle(s).ok);
 assert.deepEqual(s.factionPatrols[army.id].troops,[2,5]);assert.equal(s.factionPatrols[army.id].wins,1);assert.equal(s.factionReports.length,1);assert.equal(s.worldSkirmishes.length,0);
 const after=structuredClone(s);assert.equal(finishBattle(s).ok,false);assert.deepEqual(s,after);assert.deepEqual(validateSave(s),s);
});
