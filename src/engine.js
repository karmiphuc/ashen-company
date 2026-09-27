// Pure game rules for the offline overworld. The UI owns rendering and real time.

export const ITEMS = Object.freeze([
  { id: 'patched-coat', name: 'Patched Coat', slot: 'armor', visual: 'padded', price: 45, armor: 6, fatigue: 1, description: 'Worn cloth, still better than bare skin.' },
  { id: 'quilted-jack', name: 'Quilted Jack', slot: 'armor', visual: 'padded', price: 95, armor: 12, fatigue: 2, description: 'A practical layer for the road.' },
  { id: 'leather-vest', name: 'Leather Vest', slot: 'armor', visual: 'leather', price: 150, armor: 18, fatigue: 3, description: 'Tough leather over a padded lining.' },
  { id: 'mail-shirt', name: 'Mail Shirt', slot: 'armor', visual: 'mail', price: 320, armor: 30, fatigue: 6, description: 'Heavy rings that turn a sharp edge.' },
  { id: 'brigandine', name: 'Brigandine', slot: 'armor', visual: 'brigandine', price: 480, armor: 40, fatigue: 8, description: 'Riveted plates beneath stout cloth.' },
  { id: 'plate-harness', name: 'Plate Harness', slot: 'armor', visual: 'plate', price: 720, armor: 54, fatigue: 12, description: 'Full steel protection for a seasoned veteran.' },
  { id: 'cloth-hood', name: 'Cloth Hood', slot: 'helmet', visual: 'hood', price: 30, armor: 3, fatigue: 0, description: 'Keeps the rain from your eyes.' },
  { id: 'leather-cap', name: 'Leather Cap', slot: 'helmet', visual: 'hood', price: 65, armor: 8, fatigue: 1, description: 'A fitted cap with a firm brow.' },
  { id: 'iron-helm', name: 'Iron Helm', slot: 'helmet', visual: 'nasal', price: 180, armor: 20, fatigue: 3, description: 'Plain iron, forged to endure.' },
  { id: 'kettle-helm', name: 'Kettle Helm', slot: 'helmet', visual: 'kettle', price: 255, armor: 27, fatigue: 4, description: 'A broad brim turns rain and blades alike.' },
  { id: 'greathelm', name: 'Greathelm', slot: 'helmet', visual: 'greathelm', price: 390, armor: 36, fatigue: 6, description: 'A closed helm with narrow eye slits.' },
  { id: 'arming-sword', name: 'Arming Sword', slot: 'weapon', visual: 'sword', price: 145, power: 16, description: 'A balanced blade for a steady hand.' },
  { id: 'spear', name: 'Spear', slot: 'weapon', visual: 'spear', price: 85, power: 13, description: 'Simple reach, simple upkeep.' },
  { id: 'wood-axe', name: 'Wood Axe', slot: 'weapon', visual: 'axe', price: 75, power: 14, description: 'A working tool with an ugly second purpose.' },
  { id: 'hunting-bow', name: 'Hunting Bow', slot: 'weapon', visual: 'bow', price: 185, power: 17, description: 'A springy yew bow with a bundle of arrows.' },
  { id: 'buckler', name: 'Buckler', slot: 'shield', visual: 'round', price: 60, armor: 6, fatigue: 1, description: 'Light protection for a quick fighter.' },
  { id: 'round-shield', name: 'Round Shield', slot: 'shield', visual: 'round', price: 120, armor: 12, fatigue: 2, description: 'Wood and iron across the forearm.' },
  { id: 'kite-shield', name: 'Kite Shield', slot: 'shield', visual: 'kite', price: 220, armor: 20, fatigue: 4, description: 'Broad cover for a crowded road.' },
]);

export const SETTLEMENTS = Object.freeze([
  { id: 'oakwatch', name: 'Oakwatch', x: 350, y: 460, kind: 'town', description: 'The company found its footing beneath these old oaks.', color: '#d7ad68' },
  { id: 'greyhaven', name: 'Greyhaven', x: 495, y: 305, kind: 'town', description: 'A stone market where caravans change hands.', color: '#a8b7b3' },
  { id: 'ironford', name: 'Ironford', x: 745, y: 400, kind: 'city', description: 'Smoke rises above its forges and river gates.', color: '#da936c' },
  { id: 'thornwall', name: 'Thornwall', x: 1005, y: 255, kind: 'fort', description: 'A border keep with a long memory.', color: '#c1a78f' },
  { id: 'redmere', name: 'Redmere', x: 925, y: 615, kind: 'town', description: 'Reed boats gather on the rust colored lake.', color: '#cb8679' },
  { id: 'highpass', name: 'Highpass', x: 615, y: 130, kind: 'outpost', description: 'A cold refuge on the mountain road.', color: '#b9c4ce' },
  { id: 'saltwick', name: 'Saltwick', x: 265, y: 660, kind: 'village', description: 'Fisherfolk and salt traders share its quiet harbor.', color: '#81b9b3' },
  { id: 'barrowfield', name: 'Barrowfield', x: 625, y: 605, kind: 'village', description: 'Farmland scattered among ancient burial mounds.', color: '#b8c282' },
]);

const ITEM_BY_ID = new Map(ITEMS.map(item => [item.id, item]));
const TOWN_BY_ID = new Map(SETTLEMENTS.map(town => [town.id, town]));
const SLOTS = ['armor', 'helmet', 'weapon', 'shield'];
const BOUNDS = { minX: 180, maxX: 1150, minY: 80, maxY: 730 };
const TOWN_RADIUS = 28;
const ARRIVAL_RADIUS = 2;
const SPEED = 55;
const MAX_LOG = 30;
const MAX_INVENTORY = 512;

function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isSafeInteger(seed)) return seed >>> 0;
  if (typeof seed !== 'string' || !seed.length) throw new TypeError('Seed must be a nonempty string or integer.');
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function result(ok, message) { return { ok, message }; }

function record(state, message) {
  state.log.push(`Day ${state.day}: ${message}`);
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function inBounds(x, y) { return Number.isFinite(x) && Number.isFinite(y) && x >= BOUNDS.minX && x <= BOUNDS.maxX && y >= BOUNDS.minY && y <= BOUNDS.maxY; }
function clamped(value, min, max) { return Math.max(min, Math.min(max, value)); }
function personById(state, id) { return state.party.find(person => person.id === id); }

export function createGame(seed = Date.now()) {
  const numericSeed = hashSeed(seed);
  const state = {
    version: 1,
    seed: numericSeed,
    day: 1,
    hour: 8,
    gold: 900,
    food: 30,
    renown: 0,
    party: [
      { id: 'captain', name: 'Mara Voss', background: 'Captain', seed: (numericSeed ^ 0x1a41) >>> 0, hp: 100, morale: 80, equipment: { armor: 'leather-vest', helmet: 'leather-cap', weapon: 'arming-sword', shield: 'buckler' } },
      { id: 'scout', name: 'Toren Hale', background: 'Scout', seed: (numericSeed ^ 0x2b52) >>> 0, hp: 100, morale: 78, equipment: { armor: 'quilted-jack', helmet: 'cloth-hood', weapon: 'spear', shield: null } },
      { id: 'guard', name: 'Bryn Calder', background: 'Guard', seed: (numericSeed ^ 0x3c63) >>> 0, hp: 100, morale: 76, equipment: { armor: 'patched-coat', helmet: null, weapon: 'wood-axe', shield: 'round-shield' } },
    ],
    inventory: ['cloth-hood', 'buckler'],
    position: { x: 350, y: 460 },
    destination: null,
    contract: null,
    contractSerial: 0,
    recruitSerial: 0,
    log: [],
    visited: ['oakwatch'],
  };
  record(state, 'The Ashen Company gathers at Oakwatch. The road is yours.');
  return state;
}

export function terrainAt(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < BOUNDS.minX) return 'sea';
  if (Math.hypot(x - 615, y - 145) < 100 || Math.hypot(x - 1080, y - 455) < 85) return 'mountain';
  if (Math.hypot(x - 475, y - 445) < 95 || Math.hypot(x - 840, y - 235) < 120) return 'forest';
  if (Math.hypot(x - 865, y - 555) < 88) return 'marsh';
  return 'plains';
}

function terrainSpeed(terrain) {
  return SPEED * ({ plains: 1, forest: 0.64, mountain: 0.44, marsh: 0.55 }[terrain] ?? 1);
}

export function townAt(state) {
  return SETTLEMENTS.find(town => distance(state.position, town) <= TOWN_RADIUS) ?? null;
}

function requireTown(state) {
  const town = townAt(state);
  return town ? { town } : { error: result(false, 'Visit a settlement to trade or recruit.') };
}

export function travelTo(state, x, y) {
  if (!inBounds(x, y)) return result(false, 'Choose a reachable point on the mainland.');
  if (distance(state.position, { x, y }) <= ARRIVAL_RADIUS) return result(false, 'The company is already here.');
  state.destination = { x, y };
  const town = SETTLEMENTS.find(place => distance(place, state.destination) <= TOWN_RADIUS);
  const message = town ? `Traveling to ${town.name}.` : 'Traveling across the wilds.';
  record(state, message);
  return result(true, message);
}

function onArrival(state) {
  const town = townAt(state);
  if (!town) {
    record(state, 'The company reaches its destination.');
    return;
  }
  if (!state.visited.includes(town.id)) state.visited.push(town.id);
  record(state, `The company arrives at ${town.name}.`);
  if (state.contract?.to === town.id) {
    const reward = state.contract.reward;
    const origin = TOWN_BY_ID.get(state.contract.from);
    state.gold += reward;
    state.renown += 1;
    state.contract = null;
    record(state, `Delivery from ${origin.name} completed. Earned ${reward} crowns and 1 renown.`);
  }
}

function atMidnight(state) {
  state.day += 1;
  const foodNeeded = state.party.length;
  const wages = state.party.length * 5;
  const foodShort = Math.max(0, foodNeeded - state.food);
  const wagesShort = Math.max(0, wages - state.gold);
  state.food = Math.max(0, state.food - foodNeeded);
  state.gold = Math.max(0, state.gold - wages);
  if (foodShort) {
    for (const person of state.party) {
      person.hp = Math.max(1, person.hp - 5);
      person.morale = Math.max(0, person.morale - 12);
    }
    record(state, 'Food ran short overnight. The company is hungry.');
  }
  if (wagesShort) {
    for (const person of state.party) person.morale = Math.max(0, person.morale - 10);
    record(state, 'The company could not collect full wages.');
  }
  if (!foodShort && !wagesShort) record(state, `Paid ${wages} crowns and ate ${foodNeeded} provisions.`);
}

function advanceClock(state, hours) {
  let remaining = hours;
  while (remaining > 1e-9) {
    const toMidnight = 24 - state.hour;
    const step = Math.min(remaining, toMidnight);
    state.hour += step;
    remaining -= step;
    if (state.hour >= 24 - 1e-9) {
      state.hour = 0;
      atMidnight(state);
    }
  }
}

export function tick(state, hours) {
  if (!Number.isFinite(hours) || hours <= 0 || hours > 72) return result(false, 'Time must advance by more than zero and at most 72 hours.');
  let remaining = hours;
  while (remaining > 1e-9) {
    const step = Math.min(remaining, 0.25);
    if (state.destination) {
      const distanceLeft = distance(state.position, state.destination);
      const speed = terrainSpeed(terrainAt(state.position.x, state.position.y));
      const movement = Math.min(distanceLeft, speed * step);
      if (distanceLeft > 0) {
        state.position.x += (state.destination.x - state.position.x) * movement / distanceLeft;
        state.position.y += (state.destination.y - state.position.y) * movement / distanceLeft;
      }
      if (distance(state.position, state.destination) <= ARRIVAL_RADIUS) {
        state.position = { ...state.destination };
        state.destination = null;
        onArrival(state);
      }
    }
    advanceClock(state, step);
    remaining -= step;
  }
  return result(true, state.destination ? 'The company is on the road.' : 'Time passes.');
}

export function acceptContract(state, townId) {
  const town = townAt(state);
  if (!town || town.id !== townId) return result(false, 'Visit the issuing settlement to take its contract.');
  if (state.contract) return result(false, 'Finish the current delivery before taking another.');
  const candidates = SETTLEMENTS.filter(place => place.id !== townId);
  const index = (state.seed + state.contractSerial * 3 + SETTLEMENTS.indexOf(town)) % candidates.length;
  const target = candidates[index];
  const reward = Math.round((145 + distance(town, target) * 0.65) / 5) * 5;
  state.contractSerial += 1;
  state.contract = { id: `delivery-${state.contractSerial}`, from: town.id, to: target.id, reward, acceptedDay: state.day };
  const message = `Carry sealed dispatches from ${town.name} to ${target.name} for ${reward} crowns.`;
  record(state, message);
  return result(true, message);
}

export function buyItem(state, itemId) {
  const access = requireTown(state);
  if (access.error) return access.error;
  const item = ITEM_BY_ID.get(itemId);
  if (!item) return result(false, 'Unknown item.');
  if (state.gold < item.price) return result(false, 'The company cannot afford this item.');
  if (state.inventory.length >= MAX_INVENTORY) return result(false, 'The company pack is full.');
  state.gold -= item.price;
  state.inventory.push(item.id);
  const message = `Bought ${item.name} for ${item.price} crowns.`;
  record(state, message);
  return result(true, message);
}

export function sellItem(state, itemId) {
  const access = requireTown(state);
  if (access.error) return access.error;
  const index = state.inventory.indexOf(itemId);
  if (index < 0) return result(false, 'That item is not in the company pack.');
  const item = ITEM_BY_ID.get(itemId);
  state.inventory.splice(index, 1);
  const price = Math.floor(item.price / 2);
  state.gold += price;
  const message = `Sold ${item.name} for ${price} crowns.`;
  record(state, message);
  return result(true, message);
}

export function equipItem(state, personId, itemId) {
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  const item = ITEM_BY_ID.get(itemId);
  if (!item) return result(false, 'Unknown item.');
  const index = state.inventory.indexOf(itemId);
  if (index < 0) return result(false, 'That item is not in the company pack.');
  const previous = person.equipment[item.slot];
  state.inventory.splice(index, 1);
  if (previous) state.inventory.push(previous);
  person.equipment[item.slot] = itemId;
  const message = `${person.name} equipped ${item.name}.`;
  record(state, message);
  return result(true, message);
}

export function unequipItem(state, personId, slot) {
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  if (!SLOTS.includes(slot)) return result(false, 'Unknown equipment slot.');
  const itemId = person.equipment[slot];
  if (!itemId) return result(false, 'That slot is already empty.');
  if (state.inventory.length >= MAX_INVENTORY) return result(false, 'The company pack is full.');
  person.equipment[slot] = null;
  state.inventory.push(itemId);
  const message = `${person.name} stowed ${ITEM_BY_ID.get(itemId).name}.`;
  record(state, message);
  return result(true, message);
}

export function getEquipment(person) {
  return Object.fromEntries(SLOTS.map(slot => [slot, ITEM_BY_ID.get(person.equipment?.[slot]) ?? null]));
}

const RECRUITS = [
  ['Elsi Rowan', 'Wayfarer'], ['Garrick Vale', 'Caravan Guard'], ['Nessa Flint', 'Hunter'],
  ['Odo Fen', 'Farmhand'], ['Iris Blackwell', 'Deserter'], ['Hugo Reed', 'Sailor'],
  ['Ada Pike', 'Tinker'], ['Kellan Moss', 'Outrider'], ['Sera Wren', 'Pilgrim'],
];

export function recruit(state) {
  const access = requireTown(state);
  if (access.error) return access.error;
  if (state.party.length >= 8) return result(false, 'The company has room for only eight members.');
  const cost = 160;
  if (state.gold < cost) return result(false, 'Recruitment costs 160 crowns.');
  const serial = state.recruitSerial++;
  const [name, background] = RECRUITS[(state.seed + serial) % RECRUITS.length];
  const person = { id: `recruit-${serial + 1}`, name, background, seed: (state.seed ^ Math.imul(serial + 1, 2654435761)) >>> 0, hp: 100, morale: 70, equipment: { armor: null, helmet: null, weapon: null, shield: null } };
  state.party.push(person);
  state.gold -= cost;
  const message = `${name} joins the Ashen Company for ${cost} crowns.`;
  record(state, message);
  return result(true, message);
}

export function camp(state) {
  advanceClock(state, 6);
  for (const person of state.party) {
    person.hp = clamped(person.hp + 24, 1, 100);
    person.morale = clamped(person.morale + 9, 0, 100);
  }
  const message = 'The company rests for six hours and tends its wounds.';
  record(state, message);
  return result(true, message);
}

export function forage(state) {
  advanceClock(state, 4);
  const terrain = terrainAt(state.position.x, state.position.y);
  const bonus = terrain === 'forest' ? 2 : terrain === 'marsh' ? 1 : terrain === 'mountain' ? -1 : 0;
  const found = Math.max(3, 3 + Math.ceil(state.party.length / 2) + bonus);
  state.food += found;
  const message = `The company forages for four hours and finds ${found} provisions.`;
  record(state, message);
  return result(true, message);
}

function assert(condition, message) { if (!condition) throw new TypeError(`Invalid save: ${message}`); }
function validCount(value) { return Number.isSafeInteger(value) && value >= 0; }
function validPoint(point) { return point && typeof point === 'object' && !Array.isArray(point) && inBounds(point.x, point.y); }

export function validateSave(input) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 'expected an object');
  assert(input.version === 1, 'unsupported version');
  assert(validCount(input.seed) && input.seed <= 0xffffffff, 'seed');
  assert(Number.isSafeInteger(input.day) && input.day >= 1 && input.day <= 1000000, 'day');
  assert(Number.isFinite(input.hour) && input.hour >= 0 && input.hour < 24, 'hour');
  for (const key of ['gold', 'food']) assert(validCount(input[key]) && input[key] <= 1000000000, key);
  for (const key of ['renown', 'contractSerial', 'recruitSerial']) assert(validCount(input[key]) && input[key] <= 1000000, key);
  assert(validPoint(input.position), 'position');
  assert(input.destination === null || validPoint(input.destination), 'destination');
  assert(Array.isArray(input.inventory) && input.inventory.length <= MAX_INVENTORY && input.inventory.every(id => ITEM_BY_ID.has(id)), 'inventory');
  assert(Array.isArray(input.party) && input.party.length >= 1 && input.party.length <= 8, 'party');
  const ids = new Set();
  for (const person of input.party) {
    assert(person && typeof person === 'object' && !Array.isArray(person), 'person');
    assert(typeof person.id === 'string' && person.id.length <= 40 && /^[a-z0-9-]+$/.test(person.id) && !ids.has(person.id), 'person id');
    ids.add(person.id);
    assert(typeof person.name === 'string' && person.name.length > 0 && person.name.length <= 80, 'person name');
    assert(typeof person.background === 'string' && person.background.length > 0 && person.background.length <= 80, 'person background');
    assert(validCount(person.seed) && person.seed <= 0xffffffff, 'person seed');
    assert(Number.isFinite(person.hp) && person.hp >= 1 && person.hp <= 100, 'person hp');
    assert(Number.isFinite(person.morale) && person.morale >= 0 && person.morale <= 100, 'person morale');
    assert(person.equipment && typeof person.equipment === 'object' && !Array.isArray(person.equipment), 'equipment');
    for (const slot of SLOTS) {
      const itemId = person.equipment[slot];
      assert(itemId === null || ITEM_BY_ID.get(itemId)?.slot === slot, `${slot} equipment`);
    }
  }
  assert(Array.isArray(input.visited) && input.visited.length <= SETTLEMENTS.length && input.visited.every(id => TOWN_BY_ID.has(id)) && new Set(input.visited).size === input.visited.length, 'visited settlements');
  assert(Array.isArray(input.log) && input.log.length <= MAX_LOG && input.log.every(entry => typeof entry === 'string' && entry.length <= 500), 'log');
  if (input.contract !== null) {
    const contract = input.contract;
    assert(contract && typeof contract === 'object' && !Array.isArray(contract), 'contract');
    assert(typeof contract.id === 'string' && contract.id.length <= 24 && /^delivery-[1-9]\d*$/.test(contract.id) && Number(contract.id.slice(9)) <= input.contractSerial, 'contract id');
    assert(TOWN_BY_ID.has(contract.from) && TOWN_BY_ID.has(contract.to) && contract.from !== contract.to, 'contract route');
    assert(validCount(contract.reward) && contract.reward > 0 && contract.reward <= 5000, 'contract reward');
    assert(Number.isSafeInteger(contract.acceptedDay) && contract.acceptedDay >= 1 && contract.acceptedDay <= input.day, 'contract day');
  }
  // Return a new plain state so callers cannot mutate the imported object through aliases.
  return {
    version: 1, seed: input.seed, day: input.day, hour: input.hour,
    gold: input.gold, food: input.food, renown: input.renown,
    party: input.party.map(person => ({ id: person.id, name: person.name, background: person.background, seed: person.seed, hp: person.hp, morale: person.morale, equipment: Object.fromEntries(SLOTS.map(slot => [slot, person.equipment[slot]])) })),
    inventory: [...input.inventory], position: { x: input.position.x, y: input.position.y },
    destination: input.destination ? { x: input.destination.x, y: input.destination.y } : null,
    contract: input.contract ? { id: input.contract.id, from: input.contract.from, to: input.contract.to, reward: input.contract.reward, acceptedDay: input.contract.acceptedDay } : null,
    contractSerial: input.contractSerial, recruitSerial: input.recruitSerial,
    log: [...input.log], visited: [...input.visited],
  };
}
