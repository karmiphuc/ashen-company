import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getTownServiceQuote } from '../src/engine.js';
import { battleResultsHTML, companySheetHTML, townServiceHTML } from '../src/campaign-ui.js';

test('company sheet shows active shield condition and keeps reserve gear without a redundant bar', () => {
  const state = createGame(91);
  const captain = state.party[0];
  captain.reserveEquipment.shield = 'heater-shield';
  captain.armorDurability.shield = 0;
  captain.armorDurability.reserveShield = 8;
  const html = companySheetHTML(state, captain, 'shield', '');
  assert.match(html, /<span>Shield<\/span><div class="condition-meter armor"><i style="width:0%"><\/i><strong>0 \/ 24 · Broken<\/strong>/);
  assert.doesNotMatch(html, /<span>Reserve shield<\/span>/);
  assert.match(html, /Reserve shield/);
  assert.match(html, /Heater Shield/);
});

test('Smithy distinguishes active and reserve shield repairs and broken status', () => {
  const state = createGame(92);
  const captain = state.party[0];
  captain.reserveEquipment.shield = 'heater-shield';
  captain.armorDurability.shield = 0;
  captain.armorDurability.reserveShield = 8;
  const html = townServiceHTML(state, getTownServiceQuote(state, 'smithy'));
  assert.match(html, /Active Buckler<small>0 \/ 24 durability · \+24 to restore · Broken<\/small>/);
  assert.match(html, /Reserve Heater Shield<small>8 \/ 64 durability · \+56 to restore<\/small>/);
  assert.match(html, /Active and reserve shields can break and be repaired here/);
  assert.doesNotMatch(html, /shields do not wear down/);
});

test('battle results show a recovered shield at its damaged condition', () => {
  const state = createGame(93);
  state.battle = { status: 'victory', round: 1, units: [], loot: { items: ['buckler'], itemConditions: [0] } };
  const html = battleResultsHTML(state);
  assert.match(html, /class="loot-condition">0 \/ 24 durability<\/small>/);
  assert.match(html, /Armor and shield damage and wounds carry over/);
});
