import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/engine.js';
import {discoveryEvent,discoveryBonuses,championRoster,bountyOffer} from '../src/discovery.js';
import {campMountReward} from '../src/mount-distribution.js';
import {getRoamingBands} from '../src/engine.js';
import {retinueHTML,discoveryNewsHTML,contractOffersHTML,campSidebarHTML,huntContractHTML} from '../src/campaign-ui.js';
import {battleHTML} from '../src/battle-view.js';

function wanted() {
  for(let seed=1;seed<100;seed++){
    const state=m.createGame(seed);
    for(const town of m.SETTLEMENTS){state.position={x:town.x,y:town.y};const offer=m.getContractOffers(state,town.id).find(o=>o.type==='bounty');if(offer){assert.equal(m.acceptContract(state,town.id,offer.id).ok,true);return {state,town,offer};}}
  }
  assert.fail('No wanted champion contract');
}
function win(state) {
  for(const enemy of state.battle.units.filter(u=>u.side==='enemy')){enemy.hp=0;enemy.alive=false;}
  const actor=state.battle.units.find(u=>u.side==='company');state.battle.activeId=actor.id;state.battle.turnIndex=state.battle.turnOrder.indexOf(actor.id);m.advanceBattle(state);
  assert.equal(state.battle.status,'victory');
}
function eventFixture(id) {
  for(let seed=1;seed<=300;seed++){const state=m.createGame(seed);for(let day=1;day<=28;day++){state.day=day;if(m.getDiscoveryEvent(state)?.id===id){state.shipments={};state.shipmentLegacyThroughDay=day;return state;}}}
  assert.fail('Event missing');
}

test('temporary discovery events are seeded, infrequent, last three days, and all themes appear',()=>{
  const seen=new Set();let weeks=0;
  for(let seed=1;seed<=150;seed++){
    const state={seed,day:1};const days=[];
    for(let day=1;day<=7;day++){state.day=day;const event=discoveryEvent(state);if(event){assert.deepEqual(event,discoveryEvent(structuredClone(state)));seen.add(event.id);days.push(day);assert.equal(event.endDay-event.startDay,2);}}
    if(days.length){weeks++;assert.equal(days.length,3);assert.equal(days[2]-days[0],2);}
  }
  assert.equal(seen.size,3);assert.ok(weeks>25&&weeks<65,`${weeks}/150`);
});

test('named champions follow their original regional weapon, get unique trophies, and bonuses raise encounter odds',()=>{
  const counts={base:0,retinue:0,event:0},names=new Set();
  const encounter={id:'test-camp',generation:0,difficulty:3,enemies:[{name:'Northern Reaver',weapon:'northern-warcleaver',armor:'northern-rusty-mail',helmet:'northern-skull-helm',shield:null}]};
  for(let seed=1;seed<=1000;seed++)for(const [kind,bonus] of Object.entries({base:0,retinue:5,event:13})){
    const state={seed,day:1,discoveryRolls:{'test-camp':{cycle:0,champion:bonus,famed:0,mount:0}}};
    const roster=championRoster(state,encounter,m.getItem,m.createFamedItemId),enemy=roster[0];
    if(enemy.champion){counts[kind]++;assert.equal(m.getItem(enemy.weapon).baseId,'northern-warcleaver');assert.equal(enemy.armor,'northern-rusty-mail');assert.equal(enemy.championItemId,enemy.weapon);names.add(enemy.weapon);}
    assert.deepEqual(roster,championRoster(state,encounter,m.getItem,m.createFamedItemId));
  }
  assert.ok(counts.base>30&&counts.base<90);assert.ok(counts.retinue>counts.base);assert.ok(counts.event>counts.retinue);assert.ok(names.size>100);
});

test('low-tier camps and non-starter bands can contain champions; ordinary starter brigands stay ordinary',()=>{
  let low=false,band=false;
  for(let seed=1;seed<=100&&!low;seed++)low=m.getCampSites(m.createGame(seed)).some(c=>c.difficulty===1&&c.enemies.some(e=>e.champion));
  for(let seed=1;seed<=60&&!band;seed++){const groups=getRoamingBands(m.createGame(seed));assert.ok(groups.filter(b=>b.difficulty===0).every(b=>b.enemies.every(e=>!e.champion)));band=groups.some(b=>b.enemies.some(e=>e.champion));}
  assert.ok(low);assert.ok(band);
});

test('wanted contracts are rare city-only stable board rolls, distinct from Deserters, and cannot repeat after unlock',()=>{
  let offers=0,total=0;
  for(let seed=1;seed<=100;seed++)for(const town of m.SETTLEMENTS){const state=m.createGame(seed),offer=bountyOffer(state,town,1,town,'western-league');if(town.kind==='village'){assert.equal(offer,null);continue;}total++;if(offer)offers++;
    assert.equal(Boolean(offer),Boolean(bountyOffer({...state,contractSerial:80},town,81,town,'western-league')));
  }
  assert.ok(offers/total>.03&&offers/total<.09,`${offers}/${total}`);
  const {state,town,offer}=wanted();assert.ok(!m.getContractOffers(state,town.id).some(o=>o.type==='bounty'));
  assert.match(contractOffersHTML(state,[offer]),/5,000/);assert.match(huntContractHTML(state,state.contract),/data-quest-travel="bounty"/);
  const site=m.getQuestEncounter(state);assert.equal(site.enemies.length,8);assert.equal(site.enemies.filter(e=>e.champion).length,1);assert.equal(site.difficulty,3);assert.match(campSidebarHTML(state,site),/guaranteed/);assert.match(campSidebarHTML(state,site),/data-quest-travel="bounty"/);
  m.validateSave(structuredClone(state));state.retinue.bountyHunterUnlocked=true;assert.equal(bountyOffer(state,town,2,town,'western-league'),null);
});

test('champion combat stats, markers, guaranteed destroyed named armor and named weapon survive active/result saves',()=>{
  const {state}=wanted(),site=m.getQuestEncounter(state);state.position={x:site.x,y:site.y};assert.equal(m.startBattle(state,site.id).ok,true);
  const champion=state.battle.units.find(u=>u.champion),normal=state.battle.units.find(u=>u.side==='enemy'&&!u.champion);
  assert.ok(champion.maxHp>normal.maxHp);assert.ok(champion.meleeSkill>normal.meleeSkill);assert.match(battleHTML(state.battle,0,false),/champion-star/);
  const namedArmor=m.createFamedItemId('plate-harness',123),namedHelmet=m.createFamedItemId('greathelm',456),namedShield=m.createFamedItemId('kite-shield',789);
  Object.assign(champion.equipment,{armor:namedArmor,helmet:namedHelmet,shield:namedShield});
  if(m.getItem(champion.equipment.weapon).twoHanded){champion.equipment.weapon=m.createFamedItemId('arming-sword',999);champion.championItemId=champion.equipment.weapon;}
  champion.maxBodyArmor=m.getItem(namedArmor).armor;champion.maxHeadArmor=m.getItem(namedHelmet).armor;champion.maxShieldDurability=m.shieldMaximum(namedShield);champion.bodyArmor=0;champion.headArmor=0;champion.shieldDurability=0;
  assert.deepEqual(m.validateSave(structuredClone(state)),state);
  const trophy=champion.championItemId;win(state);
  for(const id of [trophy,namedArmor,namedHelmet,namedShield]){assert.equal(state.battle.loot.items.filter(x=>x===id).length,1);const i=state.battle.loot.items.indexOf(id);if(id!==trophy)assert.ok(state.battle.loot.itemConditions[i]>0);}
  assert.deepEqual(m.validateSave(structuredClone(state)),state);m.finishBattle(state);assert.ok(state.inventory.includes(trophy));assert.equal(state.contract.defeated,true);
});

test('escaping champions keep their named trophy; ordinary survivors cannot grant it',()=>{
  const {state}=wanted(),site=m.getQuestEncounter(state);state.position={x:site.x,y:site.y};m.startBattle(state,site.id);
  const champion=state.battle.units.find(u=>u.champion),trophy=champion.championItemId;champion.escaped=true;champion.firstFleeRound=1;champion.fleeRound=2;champion.fleeRollRound=2;state.battle.round=2;win(state);
  assert.ok(!state.battle.loot.items.includes(trophy));m.validateSave(structuredClone(state));m.finishBattle(state);assert.equal(state.contract.defeated,false);assert.equal(state.retinue.bountyHunterUnlocked,false);
});

test('Bounty Hunter requires a returned wanted victory and 5,000 crowns, cannot be hired twice, and saves without occupying a formation slot',()=>{
  const {state,town}=wanted();assert.equal(m.hireBountyHunter(state).ok,false);
  const site=m.getQuestEncounter(state);state.position={x:site.x,y:site.y};m.startBattle(state,site.id);win(state);m.finishBattle(state);
  assert.equal(state.retinue.bountyHunterUnlocked,false,'fight alone does not unlock the retinue before returning');
  for(const band of Object.values(state.bands))band.defeatedUntil=56;
  for(const patrol of Object.values(state.factionPatrols)){patrol.troops=[];patrol.defeatedUntil=56;}
  m.travelTo(state,town.x,town.y);for(let i=0;i<30&&state.contract;i++)m.tick(state,1);
  assert.equal(state.contract,null);assert.equal(state.retinue.bountyHunterUnlocked,true);assert.equal(m.getRetinue(state).hired,false);
  state.gold=4999;assert.equal(m.hireBountyHunter(state).ok,false);assert.equal(state.gold,4999);
  const roster=structuredClone(state.party),formation=[...state.formation];state.gold=6000;assert.equal(m.hireBountyHunter(state).ok,true);assert.equal(state.gold,1000);assert.deepEqual(state.party,roster);assert.deepEqual(state.formation,formation);
  assert.equal(m.hireBountyHunter(state).ok,false);assert.equal(state.gold,1000);assert.deepEqual(m.validateSave(structuredClone(state)),state);assert.match(retinueHTML(state),/Bounty Hunter hired/);
});

test('engaging locks discovery boosts and champion gear across retreat, event expiry and save/reload',()=>{
  const state=eventFixture('challengers');state.retinue.bountyHunterUnlocked=true;state.retinue.bountyHunter=true;
  const site=m.getCampSites(state).find(c=>c.enemies.some(e=>e.champion)&&c.difficulty>=2);assert.ok(site);state.position={x:site.x,y:site.y};m.startBattle(state,site.id);
  const gear=state.battle.units.filter(u=>u.side==='enemy').map(u=>u.equipment);assert.equal(state.discoveryRolls[site.id].champion,13);
  m.retreatBattle(state);m.finishBattle(state);state.day=state.day+7;state.shipments={};state.shipmentLegacyThroughDay=state.day;
  const saved=m.validateSave(structuredClone(state));m.startBattle(saved,site.id);
  assert.deepEqual(saved.battle.units.filter(u=>u.side==='enemy').map(u=>u.equipment),gear);
  assert.equal(discoveryBonuses(saved,m.getCampSites(saved).find(c=>c.id===site.id)).champion,13);m.validateSave(structuredClone(saved));
});

test('relic and beast events really increase seeded loot odds and snapshots validate after event expiry',()=>{
  const relic=eventFixture('relic-rumors'),site=m.getCampSites(relic).find(c=>c.difficulty===3&&c.random);assert.equal(site.famedChance,.55);
  relic.position={x:site.x,y:site.y};m.startBattle(relic,site.id);const drop=relic.battle.famedDrop;relic.day+=7;relic.shipments={};relic.shipmentLegacyThroughDay=relic.day;assert.equal(m.validateSave(structuredClone(relic)).battle.famedDrop,drop);
  const beast=eventFixture('beast-migration'),camp=m.getCampSites(beast).find(c=>c.difficulty===3&&c.random);assert.equal(camp.mountChance,.24);
  let normal=0,boosted=0;const mounts=new Set();
  for(let seed=1;seed<=1000;seed++){if(campMountReward(seed,camp))normal++;const reward=campMountReward(seed,camp,12);if(reward){boosted++;mounts.add(reward);}}
  assert.ok(boosted>normal*1.5);assert.ok(mounts.has('armored-war-horse'));
  beast.position={x:camp.x,y:camp.y};m.startBattle(beast,camp.id);beast.day+=7;beast.shipments={};beast.shipmentLegacyThroughDay=beast.day;m.validateSave(structuredClone(beast));assert.match(discoveryNewsHTML(eventFixture('beast-migration')),/24%/);
});

test('legacy saves/battles load without champion markers; invalid retinue, roll and champion records reject',()=>{
  const state=m.createGame(7391),site=m.getCampSites(state)[0];state.position={x:site.x,y:site.y};m.startBattle(state,site.id);
  const legacy=structuredClone(state);delete legacy.retinue;delete legacy.discoveryRolls;delete legacy.battle.championRulesVersion;
  for(const unit of legacy.battle.units){delete unit.champion;delete unit.championItemId;}
  assert.ok(m.validateSave(legacy));
  for(const edit of [s=>s.retinue.bountyHunter=true,s=>s.discoveryRolls[site.id].champion=99,s=>s.battle.units[0].champion=true,s=>{s.battle.units[0].championItemId='spear';}]){const bad=structuredClone(state);edit(bad);assert.throws(()=>m.validateSave(bad));}
});

test('champion trophies are reserved before the ordinary 24-item loot limit fills',()=>{
  const {state}=wanted(),site=m.getQuestEncounter(state);state.position={x:site.x,y:site.y};m.startBattle(state,site.id);
  const champion=state.battle.units.find(u=>u.champion),trophy=champion.championItemId;
  for(const enemy of state.battle.units.filter(u=>u.side==='enemy'&&!u.champion)){
    enemy.equipment.weapon=m.createFamedItemId('arming-sword',100);enemy.equipment.armor=m.createFamedItemId('mail-shirt',101);enemy.equipment.helmet=m.createFamedItemId('greathelm',102);enemy.equipment.shield=m.createFamedItemId('kite-shield',103);
    enemy.maxBodyArmor=enemy.bodyArmor=m.getItem(enemy.equipment.armor).armor;enemy.maxHeadArmor=enemy.headArmor=m.getItem(enemy.equipment.helmet).armor;enemy.maxShieldDurability=enemy.shieldDurability=m.shieldMaximum(enemy.equipment.shield);
  }
  state.battle.units=state.battle.units.filter(u=>u!==champion).concat(champion);win(state);
  assert.equal(state.battle.loot.items.length,24);assert.equal(state.battle.loot.items[0],trophy);assert.equal(state.battle.loot.items.filter(id=>id===trophy).length,1);m.validateSave(structuredClone(state));
});


test('every fighter rolls independently with no champion cap, including ten champions and existing named leaders',()=>{
 const enemies=Array.from({length:10},(_,i)=>({name:`Raider ${i}`,weapon:'arming-sword',armor:'mail-shirt',helmet:'iron-helm',shield:null}));
 const state={seed:73,day:1,discoveryRolls:{uncapped:{cycle:0,champion:100,famed:0,mount:0}}},encounter={id:'uncapped',generation:0,difficulty:3,enemies};
 const roster=championRoster(state,encounter,m.getItem,m.createFamedItemId);assert.equal(roster.filter(e=>e.champion).length,10);assert.equal(new Set(roster.map(e=>e.championItemId)).size,10);assert.deepEqual(roster,championRoster(state,encounter,m.getItem,m.createFamedItemId));
 const ordinary={...state,discoveryRolls:{}};let multi=false;for(let seed=1;seed<=100;seed++){ordinary.seed=seed;if(championRoster(ordinary,encounter,m.getItem,m.createFamedItemId).filter(e=>e.champion).length>1)multi=true;}assert.ok(multi,'normal independent rolls permit multiple champions');
 const promoted=championRoster(ordinary,{...encounter,enemies:enemies.map(e=>({...e,name:e.name+' Champion'}))},m.getItem,m.createFamedItemId);assert.ok(promoted.every(e=>e.champion));
});

test('twenty defeated champions keep all forty named trophies through result save and reload',()=>{
 const state=m.createGame(7391),original=structuredClone(state.party[0]);
 while(state.party.length<15)state.party.push({...structuredClone(original),id:`fighter-${state.party.length}`,name:'Veteran'});
 for(const p of state.party)p.level=13;state.formation=Array.from({length:36},(_,i)=>state.party[i]?.id??null);state.day=60;state.shipments={};state.shipmentLegacyThroughDay=60;
 const site=m.getCampSites(state).find(s=>s.enemies.length===20);state.position={x:site.x,y:site.y};assert.equal(m.startBattle(state,site.id).ok,true);
 const trophies=[];for(const [i,e]of state.battle.units.filter(u=>u.side==='enemy').entries()){
  const weapon=m.createFamedItemId('arming-sword',1000+i),armor=m.createFamedItemId('mail-shirt',2000+i);trophies.push(weapon,armor);
  e.champion=true;e.championItemId=weapon;e.equipment.weapon=weapon;e.equipment.armor=armor;e.bodyArmor=0;e.maxBodyArmor=m.getItem(armor).armor;
 }
 win(state);assert.equal(state.battle.loot.items.length,40);for(const id of trophies)assert.ok(state.battle.loot.items.includes(id),id);
 const loaded=m.validateSave(JSON.parse(JSON.stringify(state)));assert.deepEqual(loaded.battle.loot,state.battle.loot);
});
