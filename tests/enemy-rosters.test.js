import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/engine.js';
import {
  REGIONAL_ENEMY_FACTIONS,
  getRegionalCampText,
  getRegionalEnemyFaction,
  getRegionalEnemyTemplates,
} from '../src/enemy-rosters.js';
import { NORTHERN_ITEMS } from '../src/northern-items.js';

const ITEM_BY_ID = new Map(ITEMS.map(item => [item.id, item]));

test('regional rosters contain distinct named loadouts backed by the item catalog', () => {
  const names = new Set();
  let count = 0;
  for (const regionalFaction of Object.values(REGIONAL_ENEMY_FACTIONS)) {
    for (const difficulty of [1, 2, 3]) {
      const entries = regionalFaction.tiers[difficulty];
      assert.ok(entries.length >= 6, `${regionalFaction.id} tier ${difficulty}`);
      for (const entry of entries) {
        assert.deepEqual(Object.keys(entry).sort(), ['armor', 'helmet', 'name', 'shield', 'weapon']);
        assert.equal(names.has(entry.name), false, entry.name);
        names.add(entry.name);
        count++;
        assert.equal(ITEM_BY_ID.get(entry.weapon)?.slot, 'weapon', entry.name);
        if (entry.armor !== null) assert.equal(ITEM_BY_ID.get(entry.armor)?.slot, 'armor', entry.name);
        if (entry.helmet !== null) assert.equal(ITEM_BY_ID.get(entry.helmet)?.slot, 'helmet', entry.name);
        if (entry.shield !== null) assert.equal(ITEM_BY_ID.get(entry.shield)?.slot, 'shield', entry.name);
      }
    }
  }
  assert.ok(count >= 20);
});

test('coordinates choose stable and distinct regional factions', () => {
  assert.equal(getRegionalEnemyFaction(800, 1000).id, 'south');
  assert.equal(getRegionalEnemyFaction(1800, 1000).id, 'south', 'the southern boundary wins in the southeast');
  assert.equal(getRegionalEnemyFaction(800, 200).id, 'north');
  assert.equal(getRegionalEnemyFaction(1800, 200).id, 'north', 'the northern boundary wins in the northeast');
  assert.equal(getRegionalEnemyFaction(1800, 600).id, 'east');
  assert.equal(getRegionalEnemyFaction(800, 600).id, 'forest');

  const samples = [[800, 1000], [800, 200], [1800, 600], [800, 600]];
  const signatures = samples.map(([x, y]) => getRegionalEnemyTemplates(x, y, 2).map(entry => entry.name).join('|'));
  assert.equal(new Set(signatures).size, 4);
});

test('southern tiers use southern weapons, shields, lamellar armor, and turbans', () => {
  const southern = [1, 2, 3].flatMap(difficulty => getRegionalEnemyTemplates(700, 1100, difficulty));
  for (const itemId of ['qatal-dagger', 'shamshir', 'composite-bow', 'adarga', 'leather-lamellar', 'reinforced-lamellar', 'nomad-robe', 'southern-turban']) {
    assert.ok(southern.some(entry => Object.values(entry).includes(itemId)), itemId);
  }
  assert.ok(southern.some(entry => entry.name.includes('Cutthroat')));
  assert.ok(southern.some(entry => entry.name.includes('Archer')));
  assert.ok(southern.some(entry => entry.name.includes('Skirmisher')));
});

test('northern gear appears across tiers without elite armor on early enemies', () => {
  const tiers = [1, 2, 3].map(difficulty => getRegionalEnemyTemplates(800, 200, difficulty));
  const usedIds = new Set(tiers.flatMap(entries => entries.flatMap(entry => [entry.weapon, entry.armor, entry.helmet, entry.shield])));
  for (const item of NORTHERN_ITEMS) assert.ok(usedIds.has(item.id), item.id);
  for (const entry of tiers[0]) {
    assert.ok(ITEM_BY_ID.get(entry.armor).armor <= 85, entry.name);
    assert.ok(ITEM_BY_ID.get(entry.helmet).armor <= 95, entry.name);
  }
  for (const entry of tiers[1]) assert.ok(ITEM_BY_ID.get(entry.armor).armor <= 175, entry.name);
  assert.ok(tiers[2].some(entry => entry.armor === 'northern-horned-plate'));
  assert.ok(tiers[0].some(entry => entry.weapon === 'northern-sling'));
});

test('higher tiers preserve ranged and lightly armored roles', () => {
  for (const regionalFaction of Object.values(REGIONAL_ENEMY_FACTIONS)) {
    const elite = getRegionalEnemyTemplates(
      regionalFaction.id === 'east' ? 1800 : 800,
      regionalFaction.id === 'south' ? 1000 : regionalFaction.id === 'north' ? 200 : 600,
      3,
    );
    assert.ok(elite.some(entry => ITEM_BY_ID.get(entry.weapon).ranged), `${regionalFaction.id} ranged role`);
    assert.ok(elite.some(entry => (ITEM_BY_ID.get(entry.armor)?.armor ?? 0) <= 75), `${regionalFaction.id} light role`);
  }
});

test('template results are fresh and camp text follows the regional faction', () => {
  const first = getRegionalEnemyTemplates(500, 1000, 2);
  first[0].name = 'Changed';
  assert.notEqual(getRegionalEnemyTemplates(500, 1000, 2)[0].name, 'Changed');

  const southern = getRegionalCampText(500, 1000, 2, 5, 4);
  const eastern = getRegionalCampText(1800, 600, 2, 4, 4);
  assert.equal(southern.factionLabel, 'Southern Nomads');
  assert.match(southern.description, /5 southern nomads and cutthroats/);
  assert.equal(eastern.factionLabel, 'Eastern Freeblades');
  assert.notEqual(southern.name, eastern.name);
});

test('regional APIs reject starter tier zero and malformed inputs', () => {
  assert.throws(() => getRegionalEnemyTemplates(500, 500, 0), /difficulty/);
  assert.throws(() => getRegionalEnemyTemplates(Number.NaN, 500, 1), /coordinates/);
  assert.throws(() => getRegionalCampText(500, 500, 1, 0), /enemy count/);
});
