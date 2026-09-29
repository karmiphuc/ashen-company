import test from 'node:test';
import assert from 'node:assert/strict';
import { enemyProgression } from '../src/enemy-progression.js';
import { createGame, getCampSites, getRoamingBands, startBattle, advanceBattle, validateSave } from '../src/engine.js';

function company(level, day, size = 3, seed = 7391) {
  const state = createGame(seed);
  const original = structuredClone(state.party[0]);
  while (state.party.length < size) state.party.push({ ...structuredClone(original), id: `fighter-${state.party.length}`, name: `Fighter ${state.party.length}` });
  for (const person of state.party) person.level = level;
  state.formation = Array.from({ length: 12 }, (_, index) => state.party[index]?.id ?? null);
  state.day = day;
  state.shipments = {};
  state.shipmentLegacyThroughDay = day;
  return state;
}

test('enemy growth needs both experienced fighters and campaign age', () => {
  assert.equal(enemyProgression(company(1, 200, 12), 3).rank, 0);
  assert.equal(enemyProgression(company(20, 1, 12), 3).rank, 0);
  assert.equal(enemyProgression(company(5, 14), 3).rank, 1);
  assert.equal(enemyProgression(company(7, 21), 3).rank, 2);
  assert.equal(enemyProgression(company(9, 28), 3).rank, 3);
  assert.equal(enemyProgression(company(20, 200, 12), 3).rank, 5);
  assert.equal(enemyProgression(company(20, 200, 12), 2).rank, 3);
});

test('enemy cavalry requires late campaign and high-level core, and never appears in easier tiers', () => {
  for (const [level, day] of [[1, 1], [8, 100], [20, 34]]) {
    assert.equal(enemyProgression(company(level, day), 3).cavalry, false);
  }
  assert.equal(enemyProgression(company(9, 35), 3).cavalry, true);
  for (const tier of [0, 1, 2]) assert.equal(enemyProgression(company(20, 200), tier).cavalry, false);
  for (let seed = 1; seed <= 100; seed++) {
    const early = company(1, 1, 3, seed);
    assert.ok([...getCampSites(early), ...getRoamingBands(early)].every(site => site.enemies.every(enemy => !enemy.mount)));
  }
});

test('starter bands and low-tier camps remain training encounters throughout the campaign', () => {
  const early = company(1, 1), late = company(20, 200, 12);
  const easy = state => [...getRoamingBands(state), ...getCampSites(state)].filter(site => site.difficulty <= 1)
    .map(site => [site.id, site.enemies.length, site.veteranRank]);
  // Time changes seeded respawn cycles for bands, so compare their permitted low-tier limits.
  assert.ok(easy(late).every(([, count, rank]) => count <= 4 && rank === 0));
  assert.equal(getCampSites(early)[0].enemies.length, getCampSites(late)[0].enemies.length);
});

test('strongest six avoid recruit dilution while casualties reduce the surviving core', () => {
  const state = company(11, 60, 6);
  const rank = enemyProgression(state, 3).rank;
  const novice = structuredClone(state.party[0]);
  state.party.push({ ...novice, id: 'novice', level: 1 });
  assert.equal(enemyProgression(state, 3).rank, rank);
  for (const person of state.party.slice(0, 6)) person.hp = 0;
  assert.equal(enemyProgression(state, 3).rank, 0);
});

test('late encounters add bounded veteran numbers and stats, deploy legally, and survive reload', () => {
  const early = company(1, 1), late = company(13, 42, 12);
  const encounterId = getCampSites(late).find(site => site.enemies.length === 12).id;
  const enter = state => {
    const site = getCampSites(state).find(camp => camp.id === encounterId);
    state.position = { x: site.x, y: site.y };
    assert.equal(startBattle(state, site.id).ok, true);
    return state.battle.units.filter(unit => unit.side === 'enemy');
  };
  const initial = enter(early), veterans = enter(late);
  assert.equal(veterans.length, 12);
  assert.equal(veterans[1].maxHp - initial[1].maxHp, 40);
  assert.equal(veterans[1].meleeSkill - initial[1].meleeSkill, 20);
  assert.equal(veterans[1].meleeDefense - initial[1].meleeDefense, 10);
  assert.equal(new Set(late.battle.units.map(unit => `${unit.q}:${unit.r}`)).size, late.battle.units.length);
  const loaded = validateSave(JSON.parse(JSON.stringify(late)));
  assert.deepEqual(loaded.battle, late.battle);
  assert.equal(advanceBattle(loaded).ok, true);
  assert.doesNotThrow(() => validateSave(loaded));
});

test('save validation rejects enemy counts beyond the twelve-unit limit', () => {
  const state = company(13, 42, 12);
  const site = getCampSites(state).find(camp => camp.id === 'hideout');
  state.position = { x: site.x, y: site.y };
  startBattle(state, site.id);
  state.battle.units.find(unit => unit.side === 'enemy').id = 'enemy-13';
  assert.throws(() => validateSave(state), /battle unit ownership/);
});
