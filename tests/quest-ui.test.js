import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptContract, createGame, getCaravans, getContractOffers } from '../src/engine.js';
import { battleResultsHTML, caravanListHTML, caravanSidebarHTML, contractOffersHTML, huntContractHTML } from '../src/campaign-ui.js';
import { battleHTML } from '../src/battle-view.js';
import { findOffer } from './helpers/contract-offers.js';

test('combat contract offers explain allied militia and caravan guards', () => {
  const assaultState = createGame(21);
  const assault = findOffer(assaultState, 'assault');
  const assaultOffers = getContractOffers(assaultState, 'oakwatch');
  const rescueState = createGame(21);
  const rescue = findOffer(rescueState, 'rescue');
  const rescueOffers = getContractOffers(rescueState, 'oakwatch');
  assert.ok(assaultOffers.length <= 3 && rescueOffers.length <= 3);
  const html = contractOffersHTML(assaultState, assaultOffers) + contractOffersHTML(rescueState, rescueOffers);
  assert.match(html, /Join a camp assault/);
  assert.match(html, /Three allied militia wait/);
  assert.match(html, /Rescue a besieged caravan/);
  assert.match(html, /three guards fighting beside you/);
  assert.match(html, new RegExp(`data-accept="${assault.id}"`));
  assert.match(html, new RegExp(`data-accept="${rescue.id}"`));
});

test('accepted assault and rescue contracts lead to their targets and back to the issuer', () => {
  for (const type of ['assault', 'rescue']) {
    const state = createGame(21);
    const offer = findOffer(state, type);
    assert.equal(acceptContract(state, 'oakwatch', offer.id).ok, true);
    const pending = huntContractHTML(state, state.contract);
    assert.match(pending, new RegExp(`data-quest-travel="${type === 'assault' ? 'camp' : 'rescue'}" data-target-id="${type === 'assault' ? offer.campId : offer.rescueId}"`));
    assert.match(pending, /Three allied militia|three guards/);
    if (type === 'rescue') {
      state.contract.rescued = true;
    } else {
      state.camps[offer.campId] = { clearedDay: state.day, generation: offer.campGeneration };
    }
    const complete = huntContractHTML(state, state.contract);
    assert.match(complete, /Objective complete/);
    assert.match(complete, /data-travel="oakwatch"/);
    assert.doesNotMatch(complete, /data-quest-travel/);
  }
});

test('quest caravan waits for rescue without a shipment timer', () => {
  const state = createGame(22);
  const offer = findOffer(state, 'rescue');
  assert.equal(acceptContract(state, 'oakwatch', offer.id).ok, true);
  const caravan = getCaravans(state).find(entry => entry.quest);
  const sidebar = caravanSidebarHTML(state, caravan);
  assert.match(sidebar, /Battle awaiting your arrival/);
  assert.match(sidebar, /three guards/);
  assert.match(sidebar, new RegExp(`data-quest-travel="rescue" data-target-id="${caravan.id}"`));
  assert.doesNotMatch(sidebar, /hours|[0-9]h to intervene|delivery|destination/i);
  const list = caravanListHTML(state, true);
  assert.match(list, /Besieged Caravan/);
  assert.match(list, /Battle awaiting your arrival/);
  assert.doesNotMatch(list, /NaNh/);
});

test('allied militia are identified in battle and separated from company casualties', () => {
  const state = createGame(23);
  const battle = {
    status: 'victory', round: 2, activeId: 'captain', tactic: 'offense', loot: { items: [] }, xp: { captain: 10 },
    units: [
      { id: 'captain', name: 'Mara Voss', side: 'company', q: 2, r: 2, hp: 75, maxHp: 100, alive: true, equipment: { weapon: 'arming-sword' } },
      { id: 'ally-1', name: 'Militia Captain', side: 'company', ally: true, q: 3, r: 2, hp: 0, maxHp: 80, alive: false, equipment: { weapon: 'spear' } },
      { id: 'enemy-1', name: 'Brigand', side: 'enemy', q: 7, r: 2, hp: 0, maxHp: 80, alive: false, equipment: { weapon: 'wood-axe' } },
    ],
  };
  const field = battleHTML(battle, 0);
  assert.match(field, /1 company fighters, 1 allied fighters and 1 enemies/);
  assert.match(field, /battle-unit-ally/);
  assert.match(field, /aria-label="Allied fighter, Militia Captain:/);
  assert.match(field, /<strong>Captain<\/strong>/);
  assert.match(field, /<i>Ally<\/i>/);
  state.battle = battle;
  const results = battleResultsHTML(state);
  const [owned, allied] = results.split('<h3>Allied fighters</h3>');
  assert.match(owned, /Mara Voss/);
  assert.doesNotMatch(owned, /Militia Captain/);
  assert.match(allied, /Militia Captain/);
  assert.match(allied, /† Fallen/);
  assert.match(results, /All brothers survived/);
  assert.doesNotMatch(results, /Militia Captain.*experience/);
});
