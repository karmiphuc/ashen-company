import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, SETTLEMENTS, createFamedItemId, createGame, getItem, getMarket, validateSave } from '../src/engine.js';
import { NORTHERN_ITEMS } from '../src/northern-items.js';
import { weaponTrainingVisual } from '../src/perks.js';

test('northern items resolve through the catalog, named copies, and legacy saves', () => {
  assert.equal(new Set(ITEMS.map(item => item.id)).size, ITEMS.length);
  for (const item of NORTHERN_ITEMS) {
    assert.equal(getItem(item.id), item);
    assert.equal(getItem(createFamedItemId(item.id, 17)).baseId, item.id);
    if (item.slot === 'weapon' && item.id !== 'northern-sling') assert.ok(weaponTrainingVisual(item));
  }
  assert.equal(weaponTrainingVisual(getItem('northern-sling')), 'northern-sling');
  const oldSave = createGame(1);
  oldSave.marketStock.oakwatch = {
    day: 1, food: 20, goods: { grain: 3, timber: 3, iron: 3, salt: 3, wool: 3 },
    equipment: Object.fromEntries(ITEMS.filter(item => item.region !== 'north').map(item => [item.id, 0])),
  };
  assert.doesNotThrow(() => validateSave(oldSave));
});

test('northern fort armories favor local gear while preserving scarce total stock', () => {
  const sample = townId => {
    const town = SETTLEMENTS.find(entry => entry.id === townId);
    let northern = 0;
    let total = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const state = createGame(seed);
      state.position = { x: town.x, y: town.y };
      for (const row of getMarket(state).equipment) {
        const item = getItem(row.itemId);
        if (item.price < 250 || item.slot === 'mount') continue;
        total += row.stock;
        if (item.region === 'north') northern += row.stock;
      }
    }
    return { northern, total };
  };
  const north = sample('dunridge');
  const south = sample('southwatch');
  assert.ok(north.northern > south.northern * 1.7, `${north.northern} versus ${south.northern}`);
  assert.ok(north.total < 120 * 4, 'the six better and premium slots remain approximately half stocked');
  assert.ok(Math.abs(north.total - south.total) < 120, 'local preference does not add total gear slots');
});
