import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getMountRewardEvents, claimMountReward, SETTLEMENTS, validateSave } from '../src/engine.js';
import { mountRewardHTML } from '../src/campaign-ui.js';

function arrive(state, townId) {
  const town = SETTLEMENTS.find(entry => entry.id === townId);
  state.position = { x: town.x, y: town.y };
}

test('three guaranteed mount rewards unlock deterministically in staggered settlements and survive save loading', () => {
  const state = createGame(419);
  const events = getMountRewardEvents(state);
  assert.deepEqual(events.map(event => event.id), ['war-horse', 'armored-war-horse', 'dire-wolf-mount']);
  assert.deepEqual(events.map(event => event.townId), ['oakwatch', 'ironford', 'blackfen']);
  assert.ok(events[0].availableDay < events[1].availableDay && events[1].availableDay < events[2].availableDay);
  for (const event of events) {
    state.day = event.availableDay;
    arrive(state, event.townId);
    assert.equal(mountRewardHTML(state, event.townId).includes(event.acceptLabel), true);
    const before = state.inventory.length;
    assert.equal(claimMountReward(state, event.id).ok, true);
    assert.equal(state.inventory.at(-1), event.itemId);
    assert.equal(state.inventory.length, before + 1);
    assert.equal(claimMountReward(state, event.id).ok, false);
    assert.equal(state.inventory.length, before + 1);
    const restored = validateSave(JSON.parse(JSON.stringify(state)));
    assert.equal(restored.mountRewards[event.id], true);
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(restored))), restored);
  }
  assert.equal(state.inventory.filter(id => ['war-horse', 'armored-war-horse', 'dire-wolf-mount'].includes(id)).length, 3);
});

test('rewards cannot be claimed early, remotely, or lost to a full stash; old saves gain claim flags', () => {
  const state = createGame(44), event = getMountRewardEvents(state)[0];
  state.day = event.availableDay;
  state.position = { x: 1800, y: 1300 };
  assert.equal(claimMountReward(state, event.id).ok, false);
  arrive(state, event.townId);
  state.inventory = Array(512).fill('cloth-hood');
  state.inventoryCondition = Array(512).fill(20);
  assert.equal(claimMountReward(state, event.id).ok, false);
  assert.equal(state.mountRewards[event.id], false);
  state.inventory.pop();
  state.inventoryCondition.pop();
  assert.equal(claimMountReward(state, event.id).ok, true);
  const oldSave = createGame(45);
  delete oldSave.mountRewards;
  assert.equal(Object.hasOwn(validateSave(oldSave), 'mountRewards'), false);
});

test('rewards reject active, resolved, and game-over states and direct raw-save claims initialize flags', () => {
  for (const blocked of [{ battle: { status: 'active' } }, { battle: { status: 'resolved' } }, { gameOver: true }]) {
    const state = createGame(58), event = getMountRewardEvents(state)[0];
    state.day = event.availableDay;
    Object.assign(state, blocked);
    const before = [...state.inventory];
    assert.equal(claimMountReward(state, event.id).ok, false);
    assert.deepEqual(state.inventory, before);
    assert.equal(state.mountRewards[event.id], false);
  }
  const raw = createGame(59), event = getMountRewardEvents(raw)[0];
  raw.day = event.availableDay;
  delete raw.mountRewards;
  delete raw.inventoryCondition;
  assert.equal(claimMountReward(raw, event.id).ok, true);
  assert.equal(raw.mountRewards[event.id], true);
  assert.equal(raw.inventoryCondition.length, raw.inventory.length);
});
