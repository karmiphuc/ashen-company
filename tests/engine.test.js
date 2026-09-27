import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, SETTLEMENTS, createGame, travelTo, tick, townAt, acceptContract,
  buyItem, sellItem, equipItem, unequipItem, recruit, camp, forage,
  getEquipment, terrainAt, validateSave,
} from '../src/engine.js';

function ownedItems(state) {
  return [...state.inventory, ...state.party.flatMap(person => Object.values(person.equipment).filter(Boolean))].sort();
}

test('new games are deterministic and start in Oakwatch with valid saves', () => {
  const one = createGame(2026);
  assert.deepEqual(one, createGame(2026));
  assert.equal(townAt(one).name, 'Oakwatch');
  assert.equal(one.gold, 900);
  assert.equal(one.party.length, 3);
  assert.deepEqual(validateSave(one), one);
  assert.deepEqual(validateSave(createGame(0xffffffff)), createGame(0xffffffff));
  assert.ok(ITEMS.length >= 12 && SETTLEMENTS.length >= 6);
});

test('every item visual is supported by the portrait renderer', () => {
  const supported = {
    armor: new Set(['padded', 'leather', 'mail', 'brigandine', 'plate']),
    helmet: new Set(['hood', 'nasal', 'kettle', 'greathelm']),
    weapon: new Set(['sword', 'spear', 'axe', 'bow']),
    shield: new Set(['round', 'kite']),
  };
  for (const item of ITEMS) assert.ok(supported[item.slot]?.has(item.visual), `${item.id} has unsupported art`);
  for (const id of ['plate-harness', 'kettle-helm', 'greathelm', 'hunting-bow']) assert.ok(ITEMS.some(item => item.id === id));
});

test('equipping and stowing preserve every owned item', () => {
  const state = createGame(7);
  const before = ownedItems(state);
  assert.equal(equipItem(state, 'captain', 'cloth-hood').ok, true);
  assert.equal(getEquipment(state.party[0]).helmet.id, 'cloth-hood');
  assert.equal(unequipItem(state, 'captain', 'helmet').ok, true);
  assert.equal(equipItem(state, 'captain', 'leather-cap').ok, true);
  assert.deepEqual(ownedItems(state), before);
  assert.equal(equipItem(state, 'captain', 'brigandine').ok, false);
  assert.equal(unequipItem(state, 'captain', 'invalid').ok, false);
  assert.deepEqual(ownedItems(state), before);
});

test('a full pack cannot grow beyond the save limit', () => {
  const state = createGame(8);
  state.inventory = Array(512).fill('buckler');
  assert.equal(buyItem(state, 'spear').ok, false);
  assert.equal(unequipItem(state, 'captain', 'helmet').ok, false);
  assert.equal(state.inventory.length, 512);
  assert.deepEqual(validateSave(state), state);
});

test('trade, recruiting and contracts require the issuing town', () => {
  const state = createGame(9);
  assert.equal(buyItem(state, 'mail-shirt').ok, true);
  assert.equal(sellItem(state, 'mail-shirt').ok, true);
  assert.equal(recruit(state).ok, true);
  assert.equal(travelTo(state, 420, 460).ok, true);
  assert.equal(tick(state, 3).ok, true);
  assert.equal(townAt(state), null);
  const gold = state.gold;
  const partySize = state.party.length;
  assert.equal(buyItem(state, 'spear').ok, false);
  assert.equal(sellItem(state, 'cloth-hood').ok, false);
  assert.equal(recruit(state).ok, false);
  assert.equal(acceptContract(state, 'oakwatch').ok, false);
  assert.equal(state.gold, gold);
  assert.equal(state.party.length, partySize);
});

test('travel obeys bounds and difficult terrain slows progress', () => {
  const state = createGame(11);
  assert.equal(travelTo(state, 50, 460).ok, false);
  assert.equal(travelTo(state, Infinity, 460).ok, false);
  assert.equal(terrainAt(475, 445), 'forest');
  assert.equal(terrainAt(615, 145), 'mountain');
  const plains = createGame(11);
  plains.position = { x: 350, y: 600 };
  travelTo(plains, 700, 600);
  tick(plains, 0.1);
  const forest = createGame(11);
  forest.position = { x: 475, y: 445 };
  travelTo(forest, 700, 445);
  tick(forest, 0.1);
  const mountain = createGame(11);
  mountain.position = { x: 615, y: 145 };
  travelTo(mountain, 800, 145);
  tick(mountain, 0.1);
  assert.ok(plains.position.x - 350 > forest.position.x - 475);
  assert.ok(forest.position.x - 475 > mountain.position.x - 615);
  const snapshot = structuredClone(state);
  assert.equal(tick(state, NaN).ok, false);
  assert.deepEqual(state, snapshot);
});

test('delivery pays on arrival and another can be taken', () => {
  const state = createGame(14);
  assert.equal(acceptContract(state, 'oakwatch').ok, true);
  const contract = { ...state.contract };
  const target = SETTLEMENTS.find(town => town.id === contract.to);
  assert.equal(travelTo(state, target.x, target.y).ok, true);
  for (let i = 0; i < 8 && state.destination; i++) tick(state, 12);
  assert.equal(state.destination, null);
  assert.equal(state.contract, null);
  assert.equal(state.renown, 1);
  assert.equal(townAt(state)?.id, target.id);
  assert.ok(state.visited.includes(target.id));
  assert.equal(state.gold, 900 + contract.reward - (state.day - 1) * 15);
  assert.equal(acceptContract(state, target.id).ok, true);
  assert.notEqual(state.contract.to, target.id);
});

test('time costs apply, but shortages never make resources negative or kill the party', () => {
  const state = createGame(31);
  state.party[0].hp = 40;
  assert.equal(camp(state).ok, true);
  assert.equal(state.hour, 14);
  assert.equal(state.party[0].hp, 64);
  const initialFood = state.food;
  assert.equal(forage(state).ok, true);
  assert.equal(state.hour, 18);
  assert.ok(state.food > initialFood);
  state.gold = 0;
  state.food = 0;
  tick(state, 30);
  assert.equal(state.day, 3);
  assert.equal(state.gold, 0);
  assert.equal(state.food, 0);
  assert.ok(state.party.every(person => person.hp >= 1 && person.morale >= 0));
  assert.equal(forage(state).ok, true);
  assert.ok(state.food > 0);
});

test('save validation rejects corrupted resources, coordinates and item references', () => {
  const base = createGame(5);
  const variants = [
    save => { save.gold = -1; },
    save => { save.food = NaN; },
    save => { save.position.x = Infinity; },
    save => { save.inventory.push('unknown-helmet'); },
    save => { save.party[0].equipment.armor = 'spear'; },
    save => { save.party[0].hp = 0; },
    save => { save.party[0].name = 'x'.repeat(81); },
    save => { save.party[0].id = 'x'.repeat(41); },
    save => { save.inventory = Array(513).fill('buckler'); },
    save => { save.log = Array(31).fill('Day 1: test'); },
    save => { save.day = 1000001; },
    save => { save.contractSerial = 1000001; },
    save => { save.visited.push('missing-place'); },
    save => { save.contract = { id: 'delivery-1', from: 'oakwatch', to: 'nowhere', reward: 100, acceptedDay: 1 }; },
    save => { save.contractSerial = 1; save.contract = { id: 'delivery-1', from: 'oakwatch', to: 'greyhaven', reward: 5001, acceptedDay: 1 }; },
  ];
  for (const mutate of variants) {
    const corrupted = structuredClone(base);
    mutate(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
  const imported = validateSave(base);
  imported.inventory.push('buckler');
  imported.party[0].equipment.armor = null;
  assert.notDeepEqual(imported, base);
});
