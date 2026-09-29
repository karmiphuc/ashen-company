import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { PERKS, createGame, getCampSites } from '../src/engine.js';
import { perksHTML, campSidebarHTML } from '../src/campaign-ui.js';

test('build picker groups every perk once and uses packaged icons', () => {
  const person = createGame(1).party[0];
  person.level = 10;
  const html = perksHTML(person, 'duelist');
  assert.equal((html.match(/class="perk-category"/g) || []).length, 6);
  assert.equal((html.match(/data-perk="/g) || []).length, PERKS.length);
  for (const perk of PERKS) {
    assert.ok(html.includes(`data-perk="${perk.id}"`));
    assert.ok(existsSync(new URL(`../assets/perks/${perk.icon || perk.id}.png`, import.meta.url)));
  }
  assert.match(html, /Learn Duelist/);
});

test('scouting discloses veteran bonuses before committing to combat', () => {
  const state = createGame(7391);
  state.day = 42;
  for (const person of state.party) person.level = 13;
  const site = getCampSites(state).find(camp => camp.id === 'hideout');
  const html = campSidebarHTML(state, site);
  assert.match(html, /Veteran rank 5/);
  assert.match(html, /\+40 health, \+20 hit skill and \+10 defense/);
});
