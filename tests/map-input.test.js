import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapActivationTracker, isMapTapGesture } from '../src/map.js';

const point = (x = 100, y = 100) => ({ x, y });
const target = (type, id) => ({ type, id, entity: { id } });

test('a second nearby tap on the same map entity activates it once', () => {
  for (const type of ['band', 'camp', 'town']) {
    const tracker = createMapActivationTracker();
    const selected = target(type, `${type}-1`);
    assert.equal(tracker.tap(selected, point(), 100), null);
    assert.equal(tracker.tap(selected, point(108, 105), 450), selected);
    assert.equal(tracker.tap(selected, point(108, 105), 500), null, `${type} third tap starts a new pair`);
  }
});

test('activation requires the same type and id within the timing and distance limits', () => {
  const tracker = createMapActivationTracker();
  const band = target('band', 'shared-id');
  const camp = target('camp', 'shared-id');
  assert.equal(tracker.tap(band, point(), 0), null);
  assert.equal(tracker.tap(camp, point(), 100), null, 'matching ids of different entity types do not activate');
  assert.equal(tracker.tap(camp, point(), 451), null, 'more than 350 ms does not activate');
  assert.equal(tracker.tap(camp, point(125, 100), 500), null, 'more than 24 pixels does not activate');
  assert.equal(tracker.tap(camp, point(124, 100), 600), camp, 'the rejected distant tap becomes the start of a new pair');
});

test('drag, pinch, pointer cancellation, and empty-map taps break a pending pair', () => {
  const camp = target('camp', 'quarry-camp');
  for (const interruption of ['drag', 'pinch', 'pointer cancellation']) {
    const tracker = createMapActivationTracker();
    tracker.tap(camp, point(), 100);
    tracker.cancel();
    assert.equal(tracker.tap(camp, point(), 200), null, `${interruption} must cancel activation`);
  }
  const tracker = createMapActivationTracker();
  tracker.tap(camp, point(), 100);
  tracker.tap(null, point(), 150);
  assert.equal(tracker.tap(camp, point(), 200), null);
});

test('tap movement keeps small pointer jitter but rejects a drag-sized move', () => {
  assert.equal(isMapTapGesture(point(10, 10), point(14, 15)), true);
  assert.equal(isMapTapGesture(point(10, 10), point(17, 10)), true);
  assert.equal(isMapTapGesture(point(10, 10), point(18, 10)), false);
  assert.equal(isMapTapGesture(null, point()), false);
});
