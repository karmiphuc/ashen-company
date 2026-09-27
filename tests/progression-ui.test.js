import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, validateSave, getLevelUp, trainAttributes } from '../src/engine.js';
import { levelUpHTML, companySheetHTML, statLabels } from '../src/campaign-ui.js';

function readyCompany() {
  const state = createGame(7391);
  state.party[0].level = 2;
  state.party[0].trainingPoints = 1;
  delete state.party[0].pendingLevelUps;
  return validateSave(state);
}

test('level-up offers eight exact rolls without spending a level until confirmation', () => {
  const state = readyCompany(), person = state.party[0];
  const before = JSON.stringify(state), pending = getLevelUp(person);
  const html = levelUpHTML(person);
  for (const [key,label] of Object.entries(statLabels)) {
    assert.ok(html.includes(`aria-label="${label} +${pending.rolls[key]}"`));
  }
  assert.match(html, /0 \/ 3 selected/);
  assert.match(html, /data-action="confirm-level-up" disabled/);
  assert.equal(JSON.stringify(state), before);
  assert.match(companySheetHTML(state,person,'all',''), /data-action="level-up"/);
});

test('three choices expose confirmation and leave the five other options disabled', () => {
  const state = readyCompany(), person = state.party[0];
  const keys = ['maxHp','meleeSkill','resolve'];
  const html = levelUpHTML(person,keys);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,3);
  assert.equal((html.match(/aria-pressed="false"[^>]*disabled/g)||[]).length,5);
  assert.match(html,/3 \/ 3 selected/);
  assert.doesNotMatch(html,/data-action="confirm-level-up" disabled/);
  assert.equal(trainAttributes(state,person.id,keys).ok,true);
  assert.equal(levelUpHTML(person),'');
  assert.doesNotMatch(companySheetHTML(state,person,'all',''),/data-action="level-up"/);
});
