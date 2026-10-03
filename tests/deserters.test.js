import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/engine.js';
import {deserterOffer,deserterEncounter,deserterEquipmentReward} from '../src/deserters.js';
import {SOLDIER_FACTIONS,factionTroops} from '../src/faction-patrols.js';
import {matchesArmoryTheme} from '../src/armory-themes.js';
import {contractOffersHTML,huntContractHTML,campSidebarHTML} from '../src/campaign-ui.js';

function findQuest(rare=false){
  for(let seed=1;seed<=150;seed++){
    const state=m.createGame(seed);
    for(const town of m.SETTLEMENTS){state.position={x:town.x,y:town.y};const offer=m.getContractOffers(state,town.id).find(o=>o.type==='deserters');if(!offer)continue;
      const expected=deserterEncounter(seed,{...offer,acceptedDay:state.day},m.getItem);
      if(rare&&!deserterEquipmentReward(seed,{...offer,acceptedDay:state.day},state.party,m.getItem))continue;
      assert.equal(m.acceptContract(state,town.id,offer.id).ok,true);return{state,town,offer};
    }
  }
  assert.fail('Deserter quest missing');
}

test('Deserter offers are infrequent weekly city/garrison rolls, cannot be rerolled or repeated, and expose hard gear rewards',()=>{
  let available=0,total=0;
  for(let seed=1;seed<=100;seed++)for(const town of m.SETTLEMENTS){
    const state=m.createGame(seed),offer=deserterOffer(state,town,1,{x:town.x+100,y:town.y});
    if(town.kind==='village'){assert.equal(offer,null);continue;}total++;if(offer)available++;
    assert.equal(Boolean(offer),Boolean(deserterOffer({...state,contractSerial:90},town,91,{x:town.x+100,y:town.y})));
  }
  assert.ok(available/total>.07&&available/total<.13,`${available}/${total}`);
  const {state,town,offer}=findQuest();
  assert.equal(state.deserterBoards[town.id],0);assert.ok(!m.getContractOffers(state,town.id).some(o=>o.type==='deserters'));
  assert.match(contractOffersHTML(state,[offer]),/Difficulty 3/);assert.match(contractOffersHTML(state,[offer]),/25%/);
  assert.match(huntContractHTML(state,state.contract),/data-quest-travel="deserters"/);
  assert.match(campSidebarHTML(state,m.getQuestEncounter(state)),/Elite faction deserters/);
  assert.equal(m.getCaravans(state).some(c=>c.id===offer.deserterId),false,'deserters are never fake rescue wagons');
});

test('all four faction elites retain their normal corresponding armory without enemy reward upgrades',()=>{
  const themes={'western-league':'mercenary','highland-clans':'north','eastern-march':'mercenary','southern-sultanate':'south'};
  for(const faction of SOLDIER_FACTIONS)for(let seed=1;seed<=40;seed++){
    const contract={factionId:faction.id,deserterId:'deserters-1',acceptedDay:1,deserterPoint:{x:500,y:500},reward:850};
    const enemies=deserterEncounter(seed,contract,m.getItem).enemies,normal=factionTroops(`${seed}:deserters-1:1`,faction.id,3,8);
    for(const [index,e]of enemies.entries())for(const slot of ['armor','helmet','weapon','shield']){
      assert.equal(e[slot],normal[index][slot]);
      if(['armor','helmet'].includes(slot))assert.ok(matchesArmoryTheme(m.getItem(e[slot]),themes[faction.id]));
    }
  }
});

test('25 percent deterministic company reward selects only eligible actively equipped non-named gear',()=>{
  const party=[{id:'pawn',hp:20,equipment:{weapon:'arming-sword',armor:'plate-harness',helmet:'leather-cap',shield:'round-shield',mount:'war-horse'},reserveEquipment:{weapon:'greatsword'}},{id:'dead',hp:0,equipment:{weapon:'billhook'}}];
  const contract={deserterId:'deserters-1',acceptedDay:1};let rewards=0;const slots=new Set();
  for(let seed=1;seed<=400;seed++){
    const reward=deserterEquipmentReward(seed,contract,party,m.getItem);assert.deepEqual(reward,deserterEquipmentReward(seed,contract,party,m.getItem));if(!reward)continue;rewards++;
    assert.equal(reward.personId,'pawn');assert.ok(['weapon','armor','helmet','shield'].includes(reward.slot));assert.equal(reward.id,party[0].equipment[reward.slot]);slots.add(reward.slot);
    assert.equal(deserterEquipmentReward(seed,contract,[{id:'rare',hp:20,equipment:{weapon:m.createFamedItemId('arming-sword',1),helmet:'bb-fangshire',mount:'war-horse'}}],m.getItem),null);
  }
  assert.ok(rewards>=75&&rewards<=125,`${rewards}/400`);assert.equal(slots.size,4);
});

test('Deserter travel, active saves, retreat retry, company named reward and one-time payment work together',()=>{
  const {state,town}=findQuest(true);const site=m.getQuestEncounter(state);
  assert.equal(m.activateMapTarget(state,'deserters',site.id).ok,true);
  assert.equal(state.destinationAction.type,'deserters');assert.deepEqual(m.validateSave(m.validateSave(state)),state);
  for(const p of Object.values(state.bands))p.defeatedUntil=56;
  for(const p of Object.values(state.factionPatrols)){p.troops=[];p.defeatedUntil=56;}
  for(let n=0;n<30&&!state.battle;n++)m.tick(state,1);
  assert.ok(state.battle,'reaching the quest point automatically begins the deserter fight');
  assert.equal(state.battle.encounterType,'deserters');assert.equal(state.battle.units.filter(e=>e.side==='enemy').length,8);
  assert.equal(state.battle.units.filter(e=>e.ally).length,0);
  assert.deepEqual(m.validateSave(state),state);
  const originalGear=state.battle.units.filter(e=>e.side==='enemy').map(e=>e.equipment);
  assert.equal(m.retreatBattle(state).ok,true);assert.equal(m.finishBattle(state).ok,true);assert.equal(state.contract.defeated,false);
  assert.equal(m.startBattle(state,site.id).ok,true);assert.deepEqual(state.battle.units.filter(e=>e.side==='enemy').map(e=>e.equipment),originalGear,'retreat cannot reroll trophies');
  for(const e of state.battle.units.filter(e=>e.side==='enemy'))Object.assign(e,{hp:0,alive:false});
  m.resolveBattle(state);assert.deepEqual(m.validateSave(state),state);
  m.finishBattle(state);assert.equal(state.contract.defeated,true);assert.equal(m.getQuestEncounter(state),null);assert.deepEqual(m.validateSave(state),state);
  for(const p of Object.values(state.bands))p.defeatedUntil=(state.day-1)*24+state.hour+48;
  const before=structuredClone(state.party),reward=deserterEquipmentReward(state.seed,state.contract,state.party,m.getItem);
  assert.ok(reward);const original=m.getItem(reward.id);
  const gold=state.gold;m.travelTo(state,town.x,town.y);for(let n=0;n<30&&state.contract;n++)m.tick(state,1);
  assert.equal(state.contract,null);assert.ok(state.gold>=gold+850-100);assert.deepEqual(m.validateSave(state),state);
  const changes=state.party.flatMap(p=>Object.entries(p.equipment).filter(([slot,id])=>id!==before.find(q=>q.id===p.id).equipment[slot]).map(([slot,id])=>({p,slot,id})));
  assert.equal(changes.length,1);assert.equal(changes[0].p.id,reward.personId);assert.equal(changes[0].slot,reward.slot);
  const named=m.getItem(changes[0].id);assert.equal(named.baseId,original.id);assert.equal(named.rarity,'famed');assert.ok(named.bonuses.length>=2);
  assert.ok(state.log.some(l=>l.includes('named-quality Deserter contract reward')));
  const equipment=structuredClone(state.party.map(p=>p.equipment));m.tick(state,1);assert.deepEqual(state.party.map(p=>p.equipment),equipment,'payment cannot upgrade again');
});

test('company armor upgrade preserves damage, survives save/reload, and pays normally without eligible items',()=>{
  const {state,town}=findQuest(true);state.contract.defeated=true;
  for(const p of state.party){for(const slot of ['armor','helmet','weapon','shield','attachment'])p.equipment[slot]=null;for(const slot of ['body','head','shield','attachment'])p.armorDurability[slot]=0;}
  state.party[0].equipment.armor='plate-harness';state.party[0].armorDurability.body=100;
  state.position={x:town.x+70,y:town.y};
  for(const b of Object.values(state.bands))b.defeatedUntil=56;
  for(const p of Object.values(state.factionPatrols)){p.troops=[];p.defeatedUntil=56;}
  const restored=m.validateSave(JSON.parse(JSON.stringify(state)));
  const pay=g=>{assert.equal(m.travelTo(g,town.x,town.y).ok,true);for(let i=0;i<5&&g.contract;i++)m.tick(g,1);assert.equal(g.contract,null);};
  pay(state);pay(restored);assert.deepEqual(state,restored,'reload preserves the roll and named variant');
  const named=m.getItem(state.party[0].equipment.armor);assert.equal(named.rarity,'famed');assert.equal(named.baseId,'plate-harness');
  assert.equal(named.armor-state.party[0].armorDurability.body,m.getItem('plate-harness').armor-100,'existing damage survives the upgrade');assert.deepEqual(m.validateSave(state),state);
  const empty=findQuest(true);empty.state.contract.defeated=true;
  for(const p of empty.state.party){p.equipment.weapon=m.createFamedItemId(p.equipment.weapon,3);p.equipment.armor=null;p.equipment.helmet=null;p.equipment.shield=null;p.equipment.attachment=null;for(const slot of ['body','head','shield','attachment'])p.armorDurability[slot]=0;}
  empty.state.position={x:empty.town.x+70,y:empty.town.y};const gold=empty.state.gold;
  m.travelTo(empty.state,empty.town.x,empty.town.y);for(let i=0;i<5&&empty.state.contract;i++)m.tick(empty.state,1);
  assert.equal(empty.state.contract,null);assert.ok(empty.state.gold>=gold+850-30);assert.ok(empty.state.party.every(p=>m.getItem(p.equipment.weapon).rarity==='famed'));assert.deepEqual(m.validateSave(empty.state),empty.state);
});
