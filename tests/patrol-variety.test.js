import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getRoamingBands, startBattle, resolveBattle, finishBattle, tick, validateSave } from '../src/engine.js';

const worldHours = state => (state.day - 1) * 24 + state.hour;
const roster = band => ({
  difficulty: band.difficulty,
  strength: band.strength,
  spawnCycle: band.spawnCycle,
  enemies: band.enemies,
});

test('patrol strength and enemy roster vary by seed but stay bounded and preserve easy nearby bands', () => {
  const easyIds = ['road-thieves', 'hungry-deserters', 'forest-cutthroats', 'river-raiders'];
  const frontierIds = getRoamingBands(createGame(1)).map(band => band.id).filter(id => !easyIds.includes(id));
  const strengthSamples = new Set();

  for (let seed = 1; seed <= 64; seed++) {
    const bands = getRoamingBands(createGame(seed));
    assert.equal(bands.length, 24);
    for (const id of easyIds) {
      const band = bands.find(entry => entry.id === id);
      assert.equal(band.difficulty, 0);
      assert.ok(band.strength >= 1 && band.strength <= 3);
      assert.ok(band.enemies.length >= 1 && band.enemies.length <= 2);
    }
    for (const id of frontierIds) {
      const band = bands.find(entry => entry.id === id);
      const minimum = band.difficulty === 1 ? 2 : band.difficulty === 2 ? 3 : 4;
      const maximum = band.difficulty === 1 ? 4 : band.difficulty === 2 ? 5 : 6;
      assert.ok(band.difficulty >= 1 && band.difficulty <= 3);
      assert.ok(band.strength >= 1 && band.strength <= 3);
      assert.ok(band.enemies.length >= minimum && band.enemies.length <= maximum);
      strengthSamples.add(`${id}:${band.strength}`);
    }
  }
  for (const id of frontierIds) assert.ok(new Set([...strengthSamples].filter(value => value.startsWith(`${id}:`))).size > 1, `${id} varies across seeds`);
});

test('a patrol roster stays stable while moving and after save/reload in the same spawn cycle', () => {
  const state = createGame(821);
  const original = getRoamingBands(state).find(band => band.id === 'pinewood-poachers');
  const initialRoster = roster(original);
  assert.deepEqual(roster(getRoamingBands(state).find(band => band.id === original.id)), initialRoster);
  assert.equal(tick(state, 6).ok, true);
  const moved = getRoamingBands(state).find(band => band.id === original.id);
  assert.notDeepEqual({ x: moved.x, y: moved.y }, { x: original.x, y: original.y });
  assert.deepEqual(roster(moved), initialRoster);

  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(roster(getRoamingBands(restored).find(band => band.id === original.id)), initialRoster);
});

test('a defeated easy patrol returns as a deterministic new spawn cycle', () => {
  const state = createGame(2);
  for (const [id, progress] of Object.entries(state.bands)) if (id !== 'road-thieves') progress.defeatedUntil = worldHours(state) + 48;
  const first = getRoamingBands(state).find(band => band.id === 'road-thieves');
  assert.equal(first.strength, 1);
  assert.equal(first.enemies.length, 1);
  state.position = { x: first.x, y: first.y };
  assert.equal(startBattle(state, first.id).ok, true);
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(state.battle.status, 'victory');
  assert.equal(finishBattle(state).ok, true);
  assert.equal(state.bands[first.id].spawnCycle, 1);
  assert.equal(getRoamingBands(state).some(band => band.id === first.id), false);

  const remaining = state.bands[first.id].defeatedUntil - worldHours(state);
  assert.equal(tick(state, remaining).ok, true);
  const returned = getRoamingBands(state).find(band => band.id === first.id);
  assert.equal(returned.spawnCycle, 1);
  assert.deepEqual(roster(returned), { difficulty: 0, strength: 3, spawnCycle: 1, enemies: first.enemies.concat(first.enemies[0]) });
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(roster(getRoamingBands(restored).find(band => band.id === first.id)), roster(returned));
  assert.deepEqual(validateSave(restored), restored);
});

test('legacy defeated-band records gain a stable spawn cycle when migrated', () => {
  const state = createGame(822);
  const id = 'road-thieves';
  state.bands[id] = { defeatedUntil: worldHours(state) + 1 };
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.bands[id].spawnCycle, 1);
  assert.equal(getRoamingBands(restored).some(band => band.id === id), false);
  assert.equal(tick(restored, 1).ok, true);
  assert.equal(getRoamingBands(restored).find(band => band.id === id).spawnCycle, 1);
});
