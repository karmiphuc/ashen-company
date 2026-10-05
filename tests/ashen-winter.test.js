import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, validateSave, SETTLEMENTS, getUndeadEncounters, getSettlementAccess,
  getMarket, getRecruitOffers, getContractOffers, getTownServiceQuote, buyItem, buyAll,
  buyFood, buySupplies, buyGood, sellGood, sellItem, recruit, acceptContract, useTownService,
  claimMountReward, activateMapTarget, tick, camp, forage, startBattle, advanceBattle,
  resolveBattle, retreatBattle, finishBattle, getCompanyStats, getAshenFinalItem, claimAshenReward, getCaravans,
  applyCompanyAutomation, getBattleRoster, hireRetinueMember, upgradeScout, buyCompanyCart, hireBountyHunter,
} from '../src/engine.js';
import { ASHEN_CONFIG, campaignHour, initialAshenWinter } from '../src/crisis-director.js';
import { advanceAshenWinter, validateAshenWinter, resolveAshenObjective, exteriorPoint, npcAshenVictory } from '../src/undead-crisis.js';
import { crisisBannerHTML, crisisJournalHTML, settlementCrisisHTML } from '../src/crisis-ui.js';
import { scheduledTownEvent } from '../src/town-events.js';
import { shipmentPlan, CARAVAN_TRAVEL_HOURS } from '../src/caravans.js';
import { advanceFactionSimulation, patrolDefinitions } from '../src/faction-patrols.js';
import { campSidebarHTML } from '../src/campaign-ui.js';

const context = { settlements: SETTLEMENTS, report() {} };
function setHour(s, hour) { s.day = Math.floor(hour / 24) + 1; s.hour = hour % 24; }
function company(seed = 719) {
  const s = createGame(seed), original = structuredClone(s.party[0]);
  while (s.party.length < 6) s.party.push({ ...structuredClone(original), id: `fighter-${s.party.length}`, name: `Fighter ${s.party.length}` });
  s.party.forEach(p => { p.level = 7; });
  s.formation = Array.from({ length: 36 }, (_, i) => s.party[i]?.id ?? null);
  s.day = 60; s.shipments = {}; s.shipmentLegacyThroughDay = s.day;
  s.encounterGraceUntil = 0;
  return s;
}
function active(seed = 719) {
  const s = company(seed);
  advanceAshenWinter(s, context);
  setHour(s, s.ashenWinter.warningHour); advanceAshenWinter(s, context);
  setHour(s, s.ashenWinter.activationHour); advanceAshenWinter(s, context);
  s.shipmentLegacyThroughDay = s.day;
  return s;
}
function pureSteps(s, hours) {
  const end = campaignHour(s) + hours;
  while (campaignHour(s) < end) { setHour(s, campaignHour(s) + .25); advanceAshenWinter(s, context); }
  s.shipmentLegacyThroughDay = s.day;
}
function besieged(seed = 719) {
  const s = active(seed); pureSteps(s, 60);
  const townId = Object.keys(s.ashenWinter.towns).find(id => getSettlementAccess(s, id).status === 'besieged');
  assert.ok(townId, 'a host actually reached and closed a town');
  return { s, townId, town: SETTLEMENTS.find(t => t.id === townId) };
}
function strong(s) {
  const original=structuredClone(s.party[0]);
  while(s.party.length<12)s.party.push({...structuredClone(original),id:`fighter-${s.party.length}`,name:`Fighter ${s.party.length}`});
  s.formation=Array.from({length:36},(_,i)=>s.party[i]?.id??null);
  s.gold = 50000; s.food = 1000; s.supplies = { tools: 1000, medicine: 1000, ammo: 1000 };
  for (const p of s.party) {
    p.attributes = { ...p.attributes, maxHp: 150, meleeSkill: 150, rangedSkill: 150, meleeDefense: 100, rangedDefense: 100, maxFatigue: 100 };
    p.equipment = { ...p.equipment, armor: 'plate-harness', helmet: 'greathelm', weapon: 'greatsword', shield: null };
    const stats = getCompanyStats(p); p.hp = stats.maxHp;
    p.armorDurability.body = stats.maxBodyArmor; p.armorDurability.head = stats.maxHeadArmor; p.armorDurability.shield = 0;
  }
}
function win(s, encounter) {
  s.destination = null; s.destinationAction = null; s.position = { x: encounter.x, y: encounter.y };
  assert.equal(startBattle(s, encounter.id).ok, true);
  // Exercise the real combat runner, loot generation, and outcome application.
  for (let i = 0; i < 8 && s.battle.status === 'active'; i++) resolveBattle(s);
  assert.equal(s.battle.status, 'victory');
  assert.equal(finishBattle(s).ok, true);
}

test('old saves migrate dormant without scheduling; fresh saves round-trip', () => {
  const s = createGame(2); assert.deepEqual(validateSave(s), s);
  delete s.ashenWinter;
  const before = structuredClone(s), restored = validateSave(s);
  assert.deepEqual(s, before); assert.equal(restored.ashenWinter.phase, 'dormant');
});

test('eligibility needs age and six equipped veterans and latches despite losses', () => {
  for (const change of [s => s.day = 59, s => s.party.pop(), s => s.party[0].equipment.armor = null, s => s.party[0].level = 1]) {
    const s = company(); change(s); advanceAshenWinter(s, context); assert.equal(s.ashenWinter.phase, 'dormant');
  }
  const s = company(); advanceAshenWinter(s, context); const scheduled = structuredClone(s.ashenWinter);
  s.party = s.party.slice(0, 1); advanceAshenWinter(s, context);
  assert.deepEqual(s.ashenWinter, scheduled);
  assert.ok(scheduled.warningHour >= campaignHour(s) + 168 && scheduled.warningHour <= campaignHour(s) + 336);
});

test('warning and three fronts persist; queries never mutate state', () => {
  const s = active(); assert.equal(s.ashenWinter.fronts.length, 3); assert.equal(Object.keys(s.ashenWinter.hosts).length, 10);
  const before = structuredClone(s);
  getUndeadEncounters(s); getSettlementAccess(s, 'oakwatch'); crisisBannerHTML(s); crisisJournalHTML(s);
  assert.deepEqual(s, before); assert.deepEqual(validateSave(s), s);
});

test('every settlement command is blocked without transactions or reward mutation', () => {
  const { s, townId, town } = besieged(); s.position = { x: town.x, y: town.y };
  const commands = [() => hireRetinueMember(s, 'broker'), () => upgradeScout(s), () => buyCompanyCart(s), () => hireBountyHunter(s), () => buyItem(s, 'spear'), () => buyAll(s, 'food'), () => buyFood(s), () => buySupplies(s, 'tools'),
    () => buyGood(s, 'grain'), () => sellGood(s, 'grain'), () => sellItem(s, 'cloth-hood'), () => recruit(s),
    () => acceptContract(s, townId), () => useTownService(s, 'doctor'), () => useTownService(s, 'smithy')];
  for (const command of commands) {
    const before = structuredClone(s); assert.equal(command().code, 'SETTLEMENT_BLOCKED'); assert.deepEqual(s, before);
  }
  assert.equal(getMarket(s), null); assert.deepEqual(getRecruitOffers(s), []); assert.deepEqual(getContractOffers(s, townId), []);
  assert.equal(getTownServiceQuote(s, 'doctor').code, 'SETTLEMENT_BLOCKED');
  assert.match(settlementCrisisHTML(s, townId), /Settlement closed/);
});

test('automatic ammunition purchases respect closed settlement services', () => {
  const { s, town } = besieged();
  s.position = { x: town.x, y: town.y };
  s.automation = { buyAmmo: true, equipBandages: false };
  s.supplies.ammo = 0; s.gold = 10000;
  const before = structuredClone(s);
  assert.doesNotThrow(() => applyCompanyAutomation(s));
  assert.deepEqual(s, before);
  assert.deepEqual(validateSave(s), s);
});

test('liberation supports fifteen fielded brothers and preserves three reserves', () => {
  const { s, townId } = besieged(); strong(s);
  const original = structuredClone(s.party[0]);
  while(s.party.length < 18) s.party.push({ ...structuredClone(original), id: `fighter-${s.party.length}`, name: `Fighter ${s.party.length}` });
  s.formation = Array.from({ length: 36 }, (_, i) => i < 15 ? s.party[i].id : null);
  s.reserveIds = s.party.slice(15).map(p => p.id);
  const reserves = structuredClone(s.party.slice(15));
  const encounter = getUndeadEncounters(s).find(e => e.townId === townId && e.kind === 'undead-liberation');
  s.position = { x: encounter.x, y: encounter.y };
  assert.equal(startBattle(s, encounter.id).ok, true);
  assert.equal(getBattleRoster(s).length, 15);
  assert.equal(s.battle.units.filter(u => u.side === 'company' && !u.ally).length, 15);
  assert.equal(s.battle.units.filter(u => u.ally).length, 3);
  s.battle = validateSave(s).battle;
  for(let i = 0; i < 8 && s.battle.status === 'active'; i++) resolveBattle(s);
  assert.equal(s.battle.status, 'victory');
  assert.equal(finishBattle(s).ok, true);
  assert.deepEqual(s.party.filter(p => s.reserveIds.includes(p.id)), reserves);
  assert.equal(getSettlementAccess(s, townId).status, 'recovering');
  assert.deepEqual(validateSave(s), s);
});

test('blocked mount claims preserve existing entitlements and all state', () => {
  const { s, townId } = besieged();
  s.ashenWinter.towns.oakwatch = s.ashenWinter.towns[townId]; delete s.ashenWinter.towns[townId];
  s.position = { ...SETTLEMENTS.find(t => t.id === 'oakwatch') };
  const before = structuredClone(s); assert.equal(claimMountReward(s, 'war-horse').code, 'SETTLEMENT_BLOCKED'); assert.deepEqual(s, before);
});

test('blocked travel stops outside and does not auto-pay a civilian contract', () => {
  const { s, townId, town } = besieged();
  s.contract = { id: 'delivery-1', type: 'courier', from: 'oakwatch', to: townId, reward: 100, renown: 1, acceptedDay: s.day };
  s.contractSerial = 1; s.position = { x: town.x, y: town.y }; const gold = s.gold;
  const r = activateMapTarget(s, 'town', townId);
  assert.equal(r.blockedTown, townId); assert.ok(Math.hypot(s.position.x-town.x,s.position.y-town.y)>38);
  assert.equal(s.gold, gold); assert.ok(s.contract);
  assert.deepEqual(validateSave(s), s);
});

test('waiting produces permanent occupation and defeating commanders alone cannot reopen it', () => {
  const { s, townId } = besieged(); pureSteps(s, 80);
  assert.equal(getSettlementAccess(s, townId).status, 'occupied');
  for (const commander of getUndeadEncounters(s).filter(e => e.kind === 'undead-commander')) resolveAshenObjective(s, commander, context);
  assert.equal(s.ashenWinter.phase, 'cleanup'); assert.equal(getSettlementAccess(s, townId).servicesAvailable, false);
  pureSteps(s, 720); assert.equal(s.ashenWinter.phase, 'cleanup'); assert.equal(getSettlementAccess(s, townId).servicesAvailable, false);
  assert.equal(s.ashenWinter.finalRewardGranted, false); assert.deepEqual(validateSave(s), s);
});

test('real liberation battle, allies, undead traits and active save validation', () => {
  const { s, townId } = besieged(); strong(s);
  const e = getUndeadEncounters(s).find(e => e.townId === townId && e.kind === 'undead-liberation');
  s.position = { x: e.x, y: e.y }; assert.equal(startBattle(s, e.id).ok, true);
  assert.equal(s.battle.units.filter(u => u.ally).length, 3);
  assert.ok(s.battle.units.filter(u => u.side === 'enemy').every(u => u.undeadTraitsVersion === 1 && u.morale === 60));
  assert.deepEqual(validateSave(s), s);
  for (let i=0; i<8 && s.battle.status==='active'; i++) resolveBattle(s);
  assert.equal(s.battle.status, 'victory'); const gold = s.gold;
  finishBattle(s); assert.equal(s.gold-gold, ASHEN_CONFIG.liberationGold);
  assert.equal(getSettlementAccess(s, townId).status, 'recovering');
  assert.equal(getSettlementAccess(s, townId).servicesAvailable, true); assert.equal(s.ashenWinter.liberationCount, 1);
  assert.equal(finishBattle(s).ok, false);
  const town=SETTLEMENTS.find(t=>t.id===townId);s.position = { x:town.x,y:town.y }; assert.ok(getMarket(s));
  assert.deepEqual(validateSave(s), s);
});

test('retreat stores troop casualties and exact damage without rerolling equipment or loot seed', () => {
  const s = active(), e = getUndeadEncounters(s).find(e=>e.kind==='undead-host');
  s.position = { x:e.x,y:e.y }; startBattle(s,e.id);
  const enemy=s.battle.units.find(u=>u.side==='enemy'); enemy.hp-=7; enemy.bodyArmor-=13;
  const dead=s.battle.units.find(u=>u.side==='enemy'&&u.id!==enemy.id); dead.hp=0;dead.alive=false;
  const lootSeed=s.battle.lootSeed, gear=structuredClone(enemy.equipment);
  retreatBattle(s); finishBattle(s);
  const restored=validateSave(s), next=getUndeadEncounters(restored).find(x=>x.id===e.id);
  assert.equal(next.enemies.length,e.enemies.length-1);
  restored.position={x:next.x,y:next.y}; startBattle(restored,next.id);
  const resumed=restored.battle.units.find(u=>u.id===enemy.id);
  assert.equal(resumed.hp,enemy.hp);assert.equal(resumed.bodyArmor,enemy.bodyArmor);assert.deepEqual(resumed.equipment,gear);
  assert.equal(restored.battle.lootSeed,lootSeed);assert.deepEqual(validateSave(restored),restored);
});

test('undead combat saves round-trip between real actions without morale changes', () => {
  const s=active(), e=getUndeadEncounters(s).find(e=>e.kind==='undead-host');strong(s);
  s.position={x:e.x,y:e.y};startBattle(s,e.id);
  for(let i=0;i<160&&s.battle.status==='active';i++){
    advanceBattle(s);assert.ok(s.battle.units.filter(u=>u.side==='enemy').every(u=>u.morale===60));
    assert.deepEqual(validateSave(s),s);
  }
});

test('real commander victory prevents reinforcements, cleanup and completion pay only once', () => {
  const s=active();strong(s);
  for(const e of getUndeadEncounters(s).filter(e=>e.kind==='undead-commander')) {
    s.position={x:350,y:460}; useTownService(s,'doctor');useTownService(s,'smithy');win(s,e);
  }
  assert.equal(s.ashenWinter.phase,'completed');assert.equal(getUndeadEncounters(s).length,0);
  assert.equal(s.ashenWinter.finalRewardGranted,true);assert.ok(getAshenFinalItem(s));
  const gold=s.gold, renown=s.renown; pureSteps(s,100); assert.equal(s.gold,gold);assert.equal(s.renown,renown);
  s.inventory=Array(512).fill('spear');s.inventoryCondition=Array(512).fill(null);
  assert.equal(claimAshenReward(s).ok,false);s.inventory=[];s.inventoryCondition=[];
  assert.equal(claimAshenReward(s).ok,true);assert.equal(claimAshenReward(s).ok,false);
  assert.equal(s.inventory.length,1);assert.deepEqual(validateSave(s),s);
});

test('NPC interception stops one approaching host without loot or liberation', () => {
  const s=active(), host=Object.values(s.ashenWinter.hosts)[0]; const gold=s.gold;
  npcAshenVictory(s,host.id);assert.equal(s.ashenWinter.hosts[host.id],undefined);assert.equal(s.gold,gold);
  assert.equal(getSettlementAccess(s,host.targetTownId).status,'open');assert.equal(s.ashenWinter.liberationCount,0);
});

test('invalid crisis states are rejected without mutating imported data', () => {
  const s=active();
  for(const change of [s=>s.ashenWinter.version=4,s=>s.ashenWinter.seed++,s=>s.ashenWinter.phase='completed',
    s=>s.ashenWinter.fronts[0].force.troops.push(99),s=>s.ashenWinter.finalRewardGranted=true,
    s=>Object.values(s.ashenWinter.hosts)[0].targetTownId='fake',s=>s.ashenWinter.resolved=['fake']]){
    const invalid=structuredClone(s);change(invalid);const before=structuredClone(invalid);assert.throws(()=>validateSave(invalid));assert.deepEqual(invalid,before);
  }
});

test('clock integration cannot bypass lockdown by camping or foraging', () => {
  for(const action of [camp,forage]){
    const s=active(), host=Object.values(s.ashenWinter.hosts)[0], town=SETTLEMENTS.find(t=>t.id===host.targetTownId);
    host.route=[{x:town.x,y:town.y},{x:town.x,y:town.y}];host.waypoint=1;host.x=town.x;host.y=town.y;
    host.warningUntil=campaignHour(s)+.25;s.ashenWinter.towns[town.id].warningUntil=host.warningUntil;
    s.position={x:town.x,y:town.y}; const food=s.food, hp=s.party[0].hp;
    const r=action(s);assert.equal(r.blockedTown,town.id);assert.equal(r.interrupted,true);
    assert.equal(s.food,food);assert.equal(s.party[0].hp,hp);assert.equal(getSettlementAccess(s,town.id).servicesAvailable,false);
  }
});

test('arrival at the exact lockdown deadline loses access before automatic contract payment', () => {
  const s=active(),host=Object.values(s.ashenWinter.hosts)[0],town=SETTLEMENTS.find(t=>t.id===host.targetTownId);
  host.route=[{x:town.x,y:town.y},{x:town.x,y:town.y}];host.waypoint=1;host.x=town.x;host.y=town.y;
  host.warningUntil=campaignHour(s)+.25;s.ashenWinter.towns[town.id].warningUntil=host.warningUntil;
  s.contract={id:'delivery-1',type:'courier',from:'oakwatch',to:town.id,reward:100,renown:1,acceptedDay:s.day};s.contractSerial=1;
  s.position={x:town.x-10,y:town.y};s.destination={x:town.x,y:town.y};s.destinationAction={type:'town',id:town.id};
  const gold=s.gold;const r=tick(s,.25);assert.equal(r.blockedTown,town.id);assert.equal(s.gold,gold);assert.ok(s.contract);
});

test('crisis destination and journal expose liberation and commander actions', () => {
  const {s,townId}=besieged();const e=getUndeadEncounters(s).find(e=>e.townId===townId&&e.kind==='undead-liberation');
  assert.match(campSidebarHTML(s,e),/Liberate settlement/);assert.match(crisisJournalHTML(s),/Destroy stronghold/);
  s.position={x:350,y:460};const r=activateMapTarget(s,e.kind,e.id);assert.equal(r.ok,true);assert.equal(s.destinationAction.id,e.id);
  assert.deepEqual(validateSave(s),s);
});

test('invasions spread beyond the old twelve-town cap without auto-ending', () => {
  for(let seed=1;seed<=8;seed++){
    const s=active(seed);pureSteps(s,24*36);
    validateAshenWinter(s.ashenWinter,s.seed,SETTLEMENTS);
    assert.equal(s.ashenWinter.phase,'active');
    assert.ok(Object.keys(s.ashenWinter.towns).length>12);
    assert.ok(Object.values(s.ashenWinter.towns).some(t=>t.status==='occupied'));
    assert.equal(s.ashenWinter.finalRewardGranted,false);
    assert.ok(Buffer.byteLength(JSON.stringify(s))<4*1024*1024);
  }
});


test('caravans hold outside a blockade, round-trip, then deliver exactly once after liberation', () => {
  const {s,townId}=besieged(2),town=SETTLEMENTS.find(t=>t.id==='ironford');
  if(townId!==town.id){s.ashenWinter.towns[town.id]=s.ashenWinter.towns[townId];delete s.ashenWinter.towns[townId];}
  let event;
  for(let day=s.day;day<s.day+24;day++){
    const candidate=scheduledTownEvent({seed:s.seed,day},town);
    if(candidate?.type==='armorer-shipment'){event=candidate;break;}
  }
  assert.ok(event);const plan=shipmentPlan(town,SETTLEMENTS,event);
  // This test needs a persistent occupation, not a siege the defenders may win.
  s.ashenWinter.towns[town.id].status='occupied';
  s.ashenWinter.towns[town.id].force=s.ashenWinter.towns[town.id].occupationForce;
  setHour(s,plan.arrivalHour-.25);s.shipmentLegacyThroughDay=0;
  for(const front of s.ashenWinter.fronts)front.nextSpawnHour=campaignHour(s)+72;
  s.shipments={ironford:{startDay:event.startDay,originId:plan.originId,status:'en-route',travelHours:CARAVAN_TRAVEL_HOURS,
    travelStartHour:plan.departureHour,attackerId:null,attackerSpawnCycle:null,attackHour:null,resolvedHour:null,raidCleared:true}};
  s.position={x:350,y:460};tick(s,.25);
  const shipment=s.shipments.ironford;
  assert.equal(shipment.heldBySiege,true);assert.equal(shipment.status,'en-route');
  assert.equal(getCaravans(s).find(c=>c.destinationId==='ironford').heldBySiege,true);
  assert.deepEqual(validateSave(s),s);
  tick(s,1);assert.equal(shipment.status,'en-route');assert.equal(shipment.resolvedHour,null);
  strong(s);const encounter=getUndeadEncounters(s).find(e=>e.kind==='undead-liberation'&&e.townId==='ironford');win(s,encounter);
  s.position={x:350,y:460};tick(s,.25);assert.equal(shipment.status,'delivered');assert.equal(shipment.heldBySiege,false);
  const deliveredHour=shipment.resolvedHour;assert.equal(deliveredHour,campaignHour(s));
  assert.deepEqual(validateSave(s),s);tick(s,.25);assert.equal(shipment.resolvedHour,deliveredHour);
});

test('split clock steps and saves yield identical crisis schedules and outcomes', () => {
  const whole=company(47),split=structuredClone(whole);
  tick(whole,12);
  for(let i=0;i<48;i++)tick(split,.25);
  assert.deepEqual(whole,split);
  const a=active(47),b=structuredClone(a);
  pureSteps(a,100);
  for(let i=0;i<400;i++){
    setHour(b,campaignHour(b)+.25);advanceAshenWinter(b,context);
    b.ashenWinter=validateAshenWinter(b.ashenWinter,b.seed,SETTLEMENTS);
  }
  assert.deepEqual(a.ashenWinter,b.ashenWinter);
});

test('human patrols cannot reinforce in a blocked city and recover at another friendly city', () => {
  const {s,townId}=besieged(),definition=patrolDefinitions(SETTLEMENTS)[0],home=definition.home;
  s.ashenWinter.towns[definition.homeId]=s.ashenWinter.towns[townId];delete s.ashenWinter.towns[townId];
  const progress=s.factionPatrols[definition.id];Object.assign(progress,{x:home.x,y:home.y,troops:[0,1],behavior:'returning',lastReinforcedHour:campaignHour(s)-24});
  advanceFactionSimulation(s,{settlements:SETTLEMENTS,getItem:()=>null,hostiles:()=>[],currentHostile:()=>null,servicesAvailable:id=>getSettlementAccess(s,id).servicesAvailable});
  assert.equal(progress.troops.length,2);assert.equal(progress.behavior,'returning');
  assert.ok(Math.hypot(progress.x-home.x,progress.y-home.y)>0);
});

test('occupation deadlines preserve a wounded besieging force after retreat', () => {
  const {s,townId}=besieged(),e=getUndeadEncounters(s).find(e=>e.kind==='undead-liberation'&&e.townId===townId);
  s.position={x:e.x,y:e.y};startBattle(s,e.id);
  const target=s.battle.units.find(u=>u.side==='enemy');target.hp-=5;
  retreatBattle(s);finishBattle(s);pureSteps(s,80);
  const occupied=getUndeadEncounters(s).find(e=>e.kind==='undead-liberation'&&e.townId===townId);
  assert.equal(getSettlementAccess(s,townId).status,'occupied');assert.equal(occupied.id,e.id);
  assert.equal(occupied.enemies.find(x=>x.troopIndex===target.troopIndex).savedDamage.hp,target.hp);
  assert.deepEqual(validateSave(s),s);
});

test('last liberation completes cleanup and cannot duplicate crisis or battle rewards', () => {
  const {s}=besieged();strong(s);
  for(const commander of getUndeadEncounters(s).filter(e=>e.kind==='undead-commander'))resolveAshenObjective(s,commander,context);
  assert.equal(s.ashenWinter.phase,'cleanup');
  const blockades=getUndeadEncounters(s).filter(e=>e.kind==='undead-liberation');
  for(const [index,e] of blockades.entries()){
    s.position={x:350,y:460};useTownService(s,'doctor');useTownService(s,'smithy');
    const gold=s.gold;win(s,e);
    assert.equal(s.gold-gold,ASHEN_CONFIG.liberationGold+(index===blockades.length-1?ASHEN_CONFIG.finalGold:0));
    assert.equal(s.ashenWinter.phase,index===blockades.length-1?'completed':'cleanup');
  }
  const before=structuredClone(s);assert.equal(finishBattle(s).ok,false);assert.deepEqual(s,before);
  assert.ok(SETTLEMENTS.every(t=>getSettlementAccess(s,t.id).servicesAvailable));assert.deepEqual(validateSave(s),s);
});

test('oversized saved wounds and forged undead traits are rejected', () => {
  const s=active(),e=getUndeadEncounters(s).find(e=>e.kind==='undead-host');
  const invalid=structuredClone(s),host=invalid.ashenWinter.hosts[e.id];
  host.force.damage[0]={hp:300,bodyArmor:0,headArmor:0,shieldDurability:0};assert.throws(()=>validateSave(invalid));
  s.position={x:e.x,y:e.y};startBattle(s,e.id);
  const forged=structuredClone(s);delete forged.battle.units.find(u=>u.side==='enemy').undeadTraitsVersion;
  assert.throws(()=>validateSave(forged));
  const old=createGame(3);const normal=getUndeadEncounters(old);assert.deepEqual(normal,[]);
});

test('engine NPC battles against undead persist valid reports and no player rewards', () => {
  const s=active(),host=Object.values(s.ashenWinter.hosts)[0];
  const definition=patrolDefinitions(SETTLEMENTS)[0],progress=s.factionPatrols[definition.id];
  Object.assign(progress,{x:host.x,y:host.y,troops:Array.from({length:definition.size},(_,i)=>i),cooldownUntil:0,behavior:'touring'});
  for(const band of Object.values(s.bands))band.defeatedUntil=campaignHour(s)+48;
  const gold=s.gold;tick(s,.25);
  const fight=s.worldSkirmishes.find(f=>f.bId===host.id);assert.ok(fight);assert.ok(!s.factionReports.some(r=>r.kind==='undead-host'));
  const point={x:host.x,y:host.y};tick(s,.25);assert.deepEqual({x:host.x,y:host.y},point);assert.deepEqual(validateSave(s),s);
  tick(s,fight.endHour-campaignHour(s));
  assert.ok(s.factionReports.some(r=>r.kind==='undead-host'));
  assert.ok(s.gold<=gold);assert.equal(s.ashenWinter.liberationCount,0);
  assert.deepEqual(validateSave(s),s);
});

test('undead road contact interrupts an active march and starts a saved battle', () => {
  const s = active(), host = Object.values(s.ashenWinter.hosts)[0];
  s.position = { x: host.x, y: host.y };
  s.destination = { x: host.x + 200, y: host.y };
  s.destinationAction = null;
  s.encounterGraceUntil = 0;
  for(const band of Object.values(s.bands)) band.defeatedUntil = campaignHour(s) + 48;
  for(const patrol of Object.values(s.factionPatrols)) patrol.cooldownUntil = campaignHour(s) + 6;
  const outcome = tick(s, .25);
  assert.equal(outcome.ok, true);
  assert.equal(s.battle?.encounterType, 'undead-host');
  assert.equal(s.battle.campId, host.id);
  assert.equal(s.destination, null);
  assert.equal(s.destinationAction, null);
  assert.equal(s.pursuit, null);
  assert.deepEqual(validateSave(s), s);
});
