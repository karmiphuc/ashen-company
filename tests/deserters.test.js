import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/engine.js';
import {deserterOffer,deserterEncounter} from '../src/deserters.js';
import {SOLDIER_FACTIONS,factionTroops} from '../src/faction-patrols.js';
import {matchesArmoryTheme} from '../src/armory-themes.js';
import {contractOffersHTML,huntContractHTML,campSidebarHTML} from '../src/campaign-ui.js';

function findQuest(rare=false){
  for(let seed=1;seed<=150;seed++){
    const state=m.createGame(seed);
    for(const town of m.SETTLEMENTS){state.position={x:town.x,y:town.y};const offer=m.getContractOffers(state,town.id).find(o=>o.type==='deserters');if(!offer)continue;
      const expected=deserterEncounter(seed,{...offer,acceptedDay:state.day},m.getItem);
      if(rare&&!expected.enemies.some(e=>['armor','helmet','weapon','shield'].some(k=>e[k]?.startsWith('famed:'))))continue;
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

test('all four faction elites retain corresponding armory; exactly one existing worn piece upgrades on a 25% roll',()=>{
  const themes={'western-league':'mercenary','highland-clans':'north','eastern-march':'mercenary','southern-sultanate':'south'};
  for(const faction of SOLDIER_FACTIONS){
    let named=0;
    for(let seed=1;seed<=400;seed++){
      const contract={factionId:faction.id,deserterId:'deserters-1',acceptedDay:1,deserterPoint:{x:500,y:500},reward:850};
      const enemies=deserterEncounter(seed,contract,m.getItem).enemies;
      const normal=factionTroops(`${seed}:deserters-1:1`,faction.id,3,8);
      let changed=0;
      for(const [index,e]of enemies.entries())for(const slot of ['armor','helmet','weapon','shield']){
        if(e[slot]!==normal[index][slot]){changed++;const item=m.getItem(e[slot]);assert.equal(item.baseId,normal[index][slot]);assert.equal(item.rarity,'famed');assert.ok(item.bonuses.length>=2);}
        if(['armor','helmet'].includes(slot))assert.ok(matchesArmoryTheme(m.getItem(e[slot]),themes[faction.id]));
      }
      assert.ok(changed<=1);if(changed)named++;
      assert.deepEqual(enemies,deserterEncounter(seed,contract,m.getItem).enemies);
    }
    assert.ok(named>=75&&named<=125,`${faction.id}: ${named}/400`);
  }
});

test('Deserter travel, active saves, retreat retry, actual named benefits, victory salvage and one-time payment work together',()=>{
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
  const enemy=state.battle.units.find(e=>e.side==='enemy'&&Object.values(e.equipment).some(id=>id?.startsWith('famed:'))),rare=Object.values(enemy.equipment).find(id=>id?.startsWith('famed:'));
  const item=m.getItem(rare);if(item.slot==='armor')assert.equal(enemy.maxBodyArmor,item.armor);if(item.slot==='helmet')assert.equal(enemy.maxHeadArmor,item.armor);
  for(const e of state.battle.units.filter(e=>e.side==='enemy'))Object.assign(e,{hp:0,alive:false});
  m.resolveBattle(state);assert.ok(state.battle.loot.items.includes(rare),'the worn named trophy is salvaged');assert.deepEqual(m.validateSave(state),state);
  m.finishBattle(state);assert.equal(state.contract.defeated,true);assert.equal(m.getQuestEncounter(state),null);assert.ok(state.inventory.includes(rare));assert.deepEqual(m.validateSave(state),state);
  for(const p of Object.values(state.bands))p.defeatedUntil=(state.day-1)*24+state.hour+48;
  const gold=state.gold;m.travelTo(state,town.x,town.y);for(let n=0;n<30&&state.contract;n++)m.tick(state,1);
  assert.equal(state.contract,null);assert.ok(state.gold>=gold+850-100);assert.deepEqual(m.validateSave(state),state);
});
