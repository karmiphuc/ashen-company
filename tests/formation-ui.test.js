import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/engine.js';
import { formationHTML } from '../src/campaign-ui.js';

test('formation editor renders three twelve-slot ranks in enemy-facing order', () => {
  const state = createGame(6301);
  state.formation = Array(36).fill(null);
  state.formation[0] = 'captain';
  state.formation[12] = 'guard';
  state.formation[24] = 'scout';

  const html = formationHTML(state, 12);
  const name = id => state.party.find(person => person.id === id).name;
  const columns = [...html.matchAll(/<section class="formation-column formation-(rear|middle|front)"><h3>(?:Rear|Middle|Front)<\/h3><div class="formation-line">([\s\S]*?)<\/div><\/section>/g)];
  assert.deepEqual(columns.map(([, name]) => name), ['rear', 'middle', 'front']);
  const indexesByColumn = columns.map(([, , slots]) => [...slots.matchAll(/data-formation-slot="(\d+)"/g)].map(([, index]) => Number(index)));
  assert.deepEqual(indexesByColumn, [
    Array.from({ length: 12 }, (_, index) => index + 24),
    Array.from({ length: 12 }, (_, index) => index + 12),
    Array.from({ length: 12 }, (_, index) => index),
  ]);
  assert.ok(html.includes(`data-formation-slot="0" aria-pressed="false" aria-label="Front position 1: ${name('captain')}`));
  assert.ok(html.includes(`data-formation-slot="12" aria-pressed="true" aria-label="Middle position 1: ${name('guard')}, selected`));
  assert.ok(html.includes(`data-formation-slot="24" aria-pressed="false" aria-label="Rear position 1: ${name('scout')}`));
  assert.match(html, /Enemies approach from the right/);
});
