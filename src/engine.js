// Pure game rules for the offline overworld. The UI owns rendering and real time.

export const ITEMS = Object.freeze([
  { id: 'patched-coat', name: 'Patched Coat', slot: 'armor', visual: 'padded', price: 45, armor: 20, fatigue: 2, description: 'Worn cloth, still better than bare skin.' },
  { id: 'quilted-jack', name: 'Quilted Jack', slot: 'armor', visual: 'padded', price: 95, armor: 50, fatigue: 5, description: 'A practical layer for the road.' },
  { id: 'leather-vest', name: 'Leather Vest', slot: 'armor', visual: 'leather', price: 150, armor: 65, fatigue: 8, description: 'Tough leather over a padded lining.' },
  { id: 'padded-gambeson', name: 'Padded Gambeson', slot: 'armor', visual: 'gambeson', price: 215, armor: 85, fatigue: 10, description: 'Thick layered cloth that softens a hard blow.' },
  { id: 'mail-shirt', name: 'Mail Shirt', slot: 'armor', visual: 'mail', price: 320, armor: 110, fatigue: 15, description: 'Heavy rings that turn a sharp edge.' },
  { id: 'reinforced-mail', name: 'Reinforced Mail', slot: 'armor', visual: 'reinforcedmail', price: 405, armor: 160, fatigue: 20, description: 'Mail strengthened with plates at the vital points.' },
  { id: 'brigandine', name: 'Brigandine', slot: 'armor', visual: 'brigandine', price: 480, armor: 210, fatigue: 25, description: 'Riveted plates beneath stout cloth.' },
  { id: 'plate-harness', name: 'Plate Harness', slot: 'armor', visual: 'plate', price: 720, armor: 300, fatigue: 38, description: 'Full steel protection for a seasoned veteran.' },
  { id: 'cloth-hood', name: 'Cloth Hood', slot: 'helmet', visual: 'hood', price: 30, armor: 20, fatigue: 1, description: 'Keeps the rain from your eyes.' },
  { id: 'leather-cap', name: 'Leather Cap', slot: 'helmet', visual: 'hood', price: 65, armor: 40, fatigue: 3, description: 'A fitted cap with a firm brow.' },
  { id: 'iron-helm', name: 'Iron Helm', slot: 'helmet', visual: 'nasal', price: 180, armor: 105, fatigue: 9, description: 'Plain iron, forged to endure.' },
  { id: 'kettle-helm', name: 'Kettle Helm', slot: 'helmet', visual: 'kettle', price: 255, armor: 140, fatigue: 12, description: 'A broad brim turns rain and blades alike.' },
  { id: 'bascinet', name: 'Bascinet', slot: 'helmet', visual: 'bascinet', price: 315, armor: 175, fatigue: 15, description: 'A close steel helm with a strong brow.' },
  { id: 'greathelm', name: 'Greathelm', slot: 'helmet', visual: 'greathelm', price: 390, armor: 210, fatigue: 20, description: 'A closed helm with narrow eye slits.' },
  { id: 'arming-sword', name: 'Arming Sword', slot: 'weapon', visual: 'sword', price: 145, power: 16, damageMin: 19, damageMax: 29, hitBonus: 5, armorDamage: 1, description: 'A balanced blade for a steady hand.' },
  { id: 'spear', name: 'Spear', slot: 'weapon', visual: 'spear', price: 85, power: 13, damageMin: 16, damageMax: 25, hitBonus: 10, armorDamage: .8, description: 'Simple reach, simple upkeep.' },
  { id: 'wood-axe', name: 'Wood Axe', slot: 'weapon', visual: 'axe', price: 75, power: 14, damageMin: 22, damageMax: 33, hitBonus: -5, armorDamage: 1.4, description: 'A working tool with an ugly second purpose.' },
  { id: 'bludgeon', name: 'Bludgeon', slot: 'weapon', visual: 'mace', price: 105, power: 14, damageMin: 17, damageMax: 26, hitBonus: 5, armorDamage: 1.15, armorPiercing: .45, description: 'A weighted club that bruises through armor.' },
  { id: 'rondel-dagger', name: 'Rondel Dagger', slot: 'weapon', visual: 'dagger', price: 135, power: 12, damageMin: 12, damageMax: 19, hitBonus: 12, armorDamage: .45, armorPiercing: .75, description: 'A narrow point seeking gaps in armor.' },
  { id: 'billhook', name: 'Billhook', slot: 'weapon', visual: 'billhook', price: 235, power: 22, damageMin: 22, damageMax: 34, hitBonus: 0, armorDamage: 1.25, range: 2, twoHanded: true, fatigueCost: 15, description: 'A hooked polearm that strikes from behind the line.' },
  { id: 'hunting-bow', name: 'Hunting Bow', slot: 'weapon', visual: 'bow', price: 185, power: 17, damageMin: 16, damageMax: 26, hitBonus: 0, armorDamage: .6, range: 4, ranged: true, twoHanded: true, description: 'A springy yew bow with a bundle of arrows.' },
  { id: 'light-crossbow', name: 'Light Crossbow', slot: 'weapon', visual: 'crossbow', price: 285, power: 27, damageMin: 25, damageMax: 38, hitBonus: 8, armorDamage: 1.2, armorPiercing: .45, range: 5, ranged: true, twoHanded: true, reloadTurns: 1, description: 'A hard shot that must be reloaded after firing.' },
  { id: 'buckler', name: 'Buckler', slot: 'shield', visual: 'round', price: 60, armor: 6, defense: 8, fatigue: 2, description: 'Light protection for a quick fighter.' },
  { id: 'round-shield', name: 'Round Shield', slot: 'shield', visual: 'round', price: 120, armor: 12, defense: 13, fatigue: 5, description: 'Wood and iron across the forearm.' },
  { id: 'kite-shield', name: 'Kite Shield', slot: 'shield', visual: 'kite', price: 220, armor: 20, defense: 18, fatigue: 8, description: 'Broad cover for a crowded road.' },
]);

export const GOODS = Object.freeze([
  { id: 'grain', name: 'Grain', basePrice: 22, description: 'Sacks of barley and rye for hungry towns.' },
  { id: 'timber', name: 'Timber', basePrice: 28, description: 'Cut planks for roofs, carts and palisades.' },
  { id: 'iron', name: 'Iron', basePrice: 48, description: 'Forge bars wanted by smiths and armorers.' },
  { id: 'salt', name: 'Salt', basePrice: 34, description: 'Precious barrels for curing winter stores.' },
  { id: 'wool', name: 'Wool', basePrice: 30, description: 'Bales of fleece for clothiers and camps.' },
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

const CAMP_SITES = Object.freeze([
  { id: 'quarry-camp', name: 'Brigand Camp', x: 440, y: 520, difficulty: 1, description: 'Three desperate raiders shelter in an abandoned quarry.', reward: 110, enemies: [
    { name: 'Brigand Thug', weapon: 'wood-axe', armor: 'patched-coat', helmet: null, shield: null },
    { name: 'Brigand Thug', weapon: 'spear', armor: 'patched-coat', helmet: null, shield: null },
    { name: 'Brigand Poacher', weapon: 'hunting-bow', armor: null, helmet: 'cloth-hood', shield: null },
  ] },
  { id: 'watchtower-camp', name: 'Ruined Watchtower', x: 820, y: 285, difficulty: 2, description: 'A band of raiders holds the broken tower above the road.', reward: 210, enemies: [
    { name: 'Brigand Raider', weapon: 'arming-sword', armor: 'leather-vest', helmet: 'leather-cap', shield: 'buckler' },
    { name: 'Brigand Raider', weapon: 'wood-axe', armor: 'quilted-jack', helmet: null, shield: 'round-shield' },
    { name: 'Brigand Thug', weapon: 'spear', armor: 'patched-coat', helmet: null, shield: null },
    { name: 'Brigand Poacher', weapon: 'hunting-bow', armor: 'patched-coat', helmet: 'cloth-hood', shield: null },
  ] },
  { id: 'hideout', name: 'Brigand Hideout', x: 1040, y: 550, difficulty: 3, description: 'Veteran raiders have fortified the old timber works.', reward: 360, enemies: [
    { name: 'Brigand Leader', weapon: 'arming-sword', armor: 'mail-shirt', helmet: 'iron-helm', shield: 'kite-shield' },
    { name: 'Brigand Raider', weapon: 'wood-axe', armor: 'leather-vest', helmet: 'leather-cap', shield: 'round-shield' },
    { name: 'Brigand Raider', weapon: 'spear', armor: 'quilted-jack', helmet: 'cloth-hood', shield: 'buckler' },
    { name: 'Brigand Poacher', weapon: 'hunting-bow', armor: 'patched-coat', helmet: 'cloth-hood', shield: null },
    { name: 'Brigand Poacher', weapon: 'hunting-bow', armor: 'patched-coat', helmet: null, shield: null },
  ] },
]);

const ROAMING_BANDS = Object.freeze([
  { id: 'road-thieves', name: 'Road Thieves', start: { x: 385, y: 430 }, end: { x: 430, y: 470 }, enemies: [
    { name: 'Brigand Thug', weapon: 'wood-axe', armor: 'patched-coat', helmet: null, shield: null },
  ] },
  { id: 'hungry-deserters', name: 'Hungry Deserters', start: { x: 355, y: 545 }, end: { x: 410, y: 510 }, enemies: [
    { name: 'Deserter', weapon: 'spear', armor: 'patched-coat', helmet: null, shield: null },
    { name: 'Deserter', weapon: 'wood-axe', armor: null, helmet: null, shield: null },
  ] },
  { id: 'forest-cutthroats', name: 'Forest Cutthroats', start: { x: 570, y: 350 }, end: { x: 635, y: 380 }, enemies: [
    { name: 'Cutthroat', weapon: 'arming-sword', armor: 'patched-coat', helmet: null, shield: 'buckler' },
    { name: 'Cutthroat', weapon: 'spear', armor: null, helmet: 'cloth-hood', shield: null },
  ] },
  { id: 'river-raiders', name: 'River Raiders', start: { x: 755, y: 530 }, end: { x: 815, y: 560 }, enemies: [
    { name: 'Brigand Thug', weapon: 'wood-axe', armor: 'quilted-jack', helmet: null, shield: null },
    { name: 'Brigand Thug', weapon: 'spear', armor: 'patched-coat', helmet: null, shield: 'buckler' },
  ] },
]);

const ITEM_BY_ID = new Map(ITEMS.map(item => [item.id, item]));
const NEW_ITEM_IDS = new Set(['bludgeon', 'rondel-dagger', 'light-crossbow', 'billhook', 'padded-gambeson', 'reinforced-mail', 'bascinet']);
const GOOD_BY_ID = new Map(GOODS.map(good => [good.id, good]));
const TOWN_BY_ID = new Map(SETTLEMENTS.map(town => [town.id, town]));
const CAMP_BY_ID = new Map(CAMP_SITES.map(camp => [camp.id, camp]));
const BAND_BY_ID = new Map(ROAMING_BANDS.map(band => [band.id, band]));
// Low factors mark local supply; high factors mark demand. The market spread
// always makes buying and selling in the same settlement a loss.
const MARKET_FACTORS = {
  oakwatch:    { grain: .70, timber: .72, iron: 1.25, salt: 1.20, wool: 1.05 },
  greyhaven:  { grain: 1.15, timber: 1.10, iron: 1.00, salt: 1.05, wool: .88 },
  ironford:   { grain: 1.25, timber: 1.20, iron: .65, salt: 1.15, wool: 1.10 },
  thornwall:  { grain: 1.40, timber: 1.30, iron: 1.15, salt: 1.45, wool: 1.20 },
  redmere:    { grain: 1.10, timber: 1.15, iron: 1.30, salt: .68, wool: 1.00 },
  highpass:   { grain: 1.50, timber: 1.40, iron: .85, salt: 1.50, wool: 1.35 },
  saltwick:   { grain: 1.15, timber: 1.30, iron: 1.50, salt: .58, wool: 1.10 },
  barrowfield:{ grain: .65, timber: .90, iron: 1.30, salt: 1.20, wool: .70 },
};
const GEAR_FACTORS = { oakwatch: 1, greyhaven: 1.05, ironford: .84, thornwall: 1.16, redmere: 1.08, highpass: 1.20, saltwick: 1.12, barrowfield: .96 };
const SLOTS = ['armor', 'helmet', 'weapon', 'shield'];
const BOUNDS = { minX: 180, maxX: 1150, minY: 80, maxY: 730 };
const TOWN_RADIUS = 28;
const ARRIVAL_RADIUS = 2;
const SPEED = 55;
const MAX_LOG = 30;
const MAX_INVENTORY = 512;
const MAX_CARGO = 30;
export const MAX_COMPANY_SIZE = 12;
const CAMP_RADIUS = 35;
const BAND_RADIUS = 28;
const SUPPLY_INFO = {
  tools: { name: 'Tools', buyPrice: 18, stock: 8 },
  medicine: { name: 'Medicine', buyPrice: 30, stock: 6 },
  ammo: { name: 'Ammunition', buyPrice: 4, stock: 30 },
};
const ATTRIBUTES = ['maxHp', 'meleeSkill', 'rangedSkill', 'meleeDefense', 'rangedDefense', 'maxFatigue', 'initiative', 'resolve'];
const TACTICS = ['offense', 'defense', 'focus'];

function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isSafeInteger(seed)) return seed >>> 0;
  if (typeof seed !== 'string' || !seed.length) throw new TypeError('Seed must be a nonempty string or integer.');
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function levelRolls(seed, level) {
  return Object.fromEntries(ATTRIBUTES.map(key => [key, 1 + hashSeed(`${seed}:${level}:${key}`) % 5]));
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
function armorMaximum(itemId) { return ITEM_BY_ID.get(itemId)?.armor ?? 0; }
function itemCondition(itemId) { return ['armor', 'helmet'].includes(ITEM_BY_ID.get(itemId)?.slot) ? armorMaximum(itemId) : null; }
function normalizeMember(person) {
  const level = person.level ?? 1;
  const unspent = person.trainingPoints ?? 0;
  const pendingLevelUps = person.pendingLevelUps === undefined
    ? Array.from({ length: unspent }, (_, index) => {
      const earnedLevel = level - unspent + index + 1;
      return { level: earnedLevel, rolls: levelRolls(person.seed, earnedLevel) };
    })
    : person.pendingLevelUps.map(entry => ({ level: entry.level, rolls: { ...entry.rolls } }));
  return {
    ...person,
    level,
    xp: person.xp ?? 0,
    trainingPoints: pendingLevelUps.length,
    pendingLevelUps,
    attributes: { ...Object.fromEntries(ATTRIBUTES.map(key => [key, 0])), ...person.attributes },
    armorDurability: {
      body: person.armorDurability?.body ?? armorMaximum(person.equipment.armor),
      head: person.armorDurability?.head ?? armorMaximum(person.equipment.helmet),
    },
  };
}

export function getCompanyStats(person) {
  const attributes = person.attributes ?? {};
  const level = person.level ?? 1;
  const background = person.background ?? '';
  const equipped = getEquipment(person);
  const fatigue = Object.values(equipped).reduce((total, item) => total + (item?.fatigue ?? 0), 0);
  const guard = background === 'Guard' || background === 'Caravan Guard';
  const scout = background === 'Scout' || background === 'Hunter' || background === 'Outrider';
  const captain = background === 'Captain';
  const maxHp = 100 + (guard ? 5 : 0) + (attributes.maxHp ?? 0);
  const maxBodyArmor = armorMaximum(person.equipment?.armor);
  const maxHeadArmor = armorMaximum(person.equipment?.helmet);
  return {
    maxHp,
    meleeSkill: 54 + (captain ? 9 : guard ? 6 : 0) + (person.seed % 7) + (attributes.meleeSkill ?? 0),
    rangedSkill: 40 + (scout ? 13 : 0) + (person.seed % 9) + (attributes.rangedSkill ?? 0),
    meleeDefense: 5 + (guard ? 3 : 0) + (attributes.meleeDefense ?? 0) + (equipped.shield?.defense ?? 0),
    rangedDefense: 5 + (scout ? 3 : 0) + (attributes.rangedDefense ?? 0) + (equipped.shield?.defense ?? 0),
    maxFatigue: Math.max(30, 100 + (attributes.maxFatigue ?? 0) - fatigue),
    initiative: Math.max(20, 105 + (scout ? 10 : 0) + (attributes.initiative ?? 0) - fatigue),
    resolve: 42 + (captain ? 10 : 0) + (attributes.resolve ?? 0),
    level,
    xp: person.xp ?? 0,
    nextLevelXp: level * 50,
    trainingPoints: person.pendingLevelUps?.length ?? person.trainingPoints ?? 0,
    dailyWage: 5 + level - 1,
    bodyArmor: person.armorDurability?.body ?? maxBodyArmor,
    headArmor: person.armorDurability?.head ?? maxHeadArmor,
    maxBodyArmor,
    maxHeadArmor,
  };
}

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
    inventoryCondition: [itemCondition('cloth-hood'), itemCondition('buckler')],
    cargo: {},
    marketStock: {},
    supplies: { tools: 8, medicine: 5, ammo: 16 },
    camps: {},
    bands: {},
    pursuit: null,
    tactic: 'offense',
    battle: null,
    gameOver: false,
    position: { x: 350, y: 460 },
    destination: null,
    contract: null,
    contractSerial: 0,
    recruitSerial: 0,
    log: [],
    visited: ['oakwatch'],
  };
  state.party = state.party.map(normalizeMember);
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

function goodPrices(town, good) {
  const buyPrice = Math.max(1, Math.round(good.basePrice * MARKET_FACTORS[town.id][good.id]));
  return { buyPrice, sellPrice: Math.max(1, Math.floor(buyPrice * .75)) };
}

function equipmentPrices(town, item) {
  const buyPrice = Math.max(1, Math.round(item.price * GEAR_FACTORS[town.id]));
  return { buyPrice, sellPrice: Math.max(1, Math.floor(buyPrice / 2)) };
}

function defaultMarketStock(state, town) {
  const goods = Object.fromEntries(GOODS.map(good => {
    const factor = MARKET_FACTORS[town.id][good.id];
    const stock = (factor <= .8 ? 8 : factor >= 1.3 ? 2 : 5) + hashSeed(`${state.seed}:${state.day}:${town.id}:${good.id}`) % 3;
    return [good.id, stock];
  }));
  const equipment = Object.fromEntries(ITEMS.map(item => {
    const premium = item.price >= 350;
    const available = !premium || town.kind === 'city' || town.kind === 'fort';
    return [item.id, available ? 1 + hashSeed(`${state.seed}:${state.day}:${town.id}:${item.id}`) % (item.price < 250 ? 3 : 2) : 0];
  }));
  const food = 18 + (MARKET_FACTORS[town.id].grain <= .8 ? 12 : 0) + hashSeed(`${state.seed}:${state.day}:${town.id}:food`) % 6;
  const supplies = Object.fromEntries(Object.entries(SUPPLY_INFO).map(([kind, info]) => [kind, info.stock + hashSeed(`${state.seed}:${state.day}:${town.id}:${kind}`) % 3]));
  return { day: state.day, food, goods, equipment, supplies };
}

function marketStock(state, town) {
  const existing = state.marketStock?.[town.id];
  return existing?.day === state.day ? existing : defaultMarketStock(state, town);
}

function writableMarketStock(state, town) {
  if (!state.marketStock) state.marketStock = {};
  if (state.marketStock[town.id]?.day !== state.day) state.marketStock[town.id] = defaultMarketStock(state, town);
  return state.marketStock[town.id];
}

export function getMarket(state, townId) {
  const town = townAt(state);
  if (!town || (townId !== undefined && town.id !== townId)) return null;
  const stock = marketStock(state, town);
  return {
    town,
    food: { buyPrice: Math.max(2, Math.round(5 * MARKET_FACTORS[town.id].grain)), stock: stock.food, owned: state.food },
    equipment: ITEMS.map(item => ({ itemId: item.id, ...equipmentPrices(town, item), stock: stock.equipment[item.id], owned: state.inventory.filter(id => id === item.id).length })),
    goods: GOODS.map(good => ({ goodId: good.id, name: good.name, description: good.description, ...goodPrices(town, good), stock: stock.goods[good.id], owned: state.cargo?.[good.id] ?? 0 })),
    supplies: Object.entries(SUPPLY_INFO).map(([kind, info]) => ({ kind, name: info.name, buyPrice: info.buyPrice, stock: stock.supplies?.[kind] ?? info.stock, owned: state.supplies?.[kind] ?? 0 })),
  };
}

function validQuantity(quantity, max) { return Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= max; }
function cargoCount(state) { return Object.values(state.cargo).reduce((total, count) => total + count, 0); }

function requireTown(state) {
  const town = townAt(state);
  return town ? { town } : { error: result(false, 'Visit a settlement to trade or recruit.') };
}
function actionBlocked(state) {
  if (state.battle) return result(false, 'Finish the battle before taking another action.');
  if (state.gameOver) return result(false, 'The company has fallen. Start a new company to play again.');
  return null;
}

function worldHours(state) { return (state.day - 1) * 24 + state.hour; }

function roamingBand(state, band) {
  if ((state.bands?.[band.id]?.defeatedUntil ?? 0) > worldHours(state)) return null;
  const length = distance(band.start, band.end);
  const period = length / 7;
  const phase = ((worldHours(state) + hashSeed(band.id) % 11) / period) % 2;
  const fraction = phase <= 1 ? phase : 2 - phase;
  return {
    id: band.id, name: band.name, kind: 'band', difficulty: 0,
    x: band.start.x + (band.end.x - band.start.x) * fraction,
    y: band.start.y + (band.end.y - band.start.y) * fraction,
    enemies: band.enemies.map(enemy => ({ ...enemy })),
    description: `${band.enemies.length} lightly equipped brigand${band.enemies.length === 1 ? ' roams' : 's roam'} the road. A good first fight for an untested company.`,
    reward: 0,
  };
}

export function getRoamingBands(state) { return ROAMING_BANDS.map(band => roamingBand(state, band)).filter(Boolean); }

export function getEncounterSites(state) { return [...getCampSites(state), ...getRoamingBands(state)]; }

export function pursueBand(state, id) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const band = getRoamingBands(state).find(entry => entry.id === id);
  if (!band) return result(false, 'That band is no longer on the road.');
  if (distance(state.position, band) <= BAND_RADIUS) {
    state.destination = null;
    state.pursuit = null;
    return result(true, `${band.name} is within striking distance.`);
  }
  state.pursuit = id;
  state.destination = { x: band.x, y: band.y };
  const message = `Pursuing ${band.name}.`;
  record(state, message);
  return result(true, message);
}

export function travelTo(state, x, y) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  if (!inBounds(x, y)) return result(false, 'Choose a reachable point on the mainland.');
  if (distance(state.position, { x, y }) <= ARRIVAL_RADIUS) return result(false, 'The company is already here.');
  state.pursuit = null;
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
  if (state.contract?.to === town.id && !completeContract(state, town)) {
    if (state.contract.type === 'supply') {
      const good = GOOD_BY_ID.get(state.contract.goodId);
      const needed = state.contract.quantity - (state.cargo[state.contract.goodId] ?? 0);
      record(state, `${town.name} still needs ${needed} ${good.name.toLowerCase()} before it can pay.`);
    }
  }
}

function completeContract(state, town) {
  const contract = state.contract;
  if (!contract || contract.to !== town.id) return false;
  if (contract.type === 'hunt' && !state.camps[contract.campId]?.clearedDay) return false;
  if (contract.type === 'supply') {
    if ((state.cargo[contract.goodId] ?? 0) < contract.quantity) return false;
    state.cargo[contract.goodId] -= contract.quantity;
    if (!state.cargo[contract.goodId]) delete state.cargo[contract.goodId];
  }
  state.gold += contract.reward;
  state.renown += contract.renown ?? 1;
  const description = contract.type === 'hunt' ? `${CAMP_BY_ID.get(contract.campId).name} cleared` : contract.type === 'supply' ? `${contract.quantity} ${GOOD_BY_ID.get(contract.goodId).name.toLowerCase()} delivered` : `Dispatch from ${TOWN_BY_ID.get(contract.from).name} delivered`;
  record(state, `${description} at ${town.name}. Earned ${contract.reward} crowns and ${contract.renown ?? 1} renown.`);
  state.contract = null;
  return true;
}

function atMidnight(state) {
  state.day += 1;
  const foodNeeded = state.party.length;
  const wages = state.party.reduce((total, person) => total + getCompanyStats(person).dailyWage, 0);
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
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 72) return result(false, 'Time must advance by more than zero and at most 72 hours.');
  let remaining = hours;
  while (remaining > 1e-9) {
    const step = Math.min(remaining, 0.25);
    if (state.pursuit) {
      const target = getRoamingBands(state).find(band => band.id === state.pursuit);
      if (target) state.destination = { x: target.x, y: target.y };
      else { state.pursuit = null; state.destination = null; }
    }
    if (state.destination) {
      const distanceLeft = distance(state.position, state.destination);
      const speed = terrainSpeed(terrainAt(state.position.x, state.position.y));
      const movement = Math.min(distanceLeft, speed * step);
      if (distanceLeft > 0) {
        state.position.x += (state.destination.x - state.position.x) * movement / distanceLeft;
        state.position.y += (state.destination.y - state.position.y) * movement / distanceLeft;
      }
      if (!state.pursuit && distance(state.position, state.destination) <= ARRIVAL_RADIUS) {
        state.position = { ...state.destination };
        state.destination = null;
        onArrival(state);
      }
    }
    advanceClock(state, step);
    let intercepted = false;
    if (state.pursuit) {
      const target = getRoamingBands(state).find(band => band.id === state.pursuit);
      if (!target) { state.pursuit = null; state.destination = null; }
      else if (distance(state.position, target) <= BAND_RADIUS) {
        state.destination = null;
        state.pursuit = null;
        intercepted = true;
        record(state, `${target.name} is within striking distance.`);
      } else state.destination = { x: target.x, y: target.y };
    }
    remaining -= step;
    if (intercepted) break;
  }
  return result(true, state.destination ? 'The company is on the road.' : 'Time passes.');
}

export function getContractOffers(state, townId) {
  if (state.battle || state.gameOver) return [];
  const town = townAt(state);
  if (!town || town.id !== townId) return [];
  const candidates = SETTLEMENTS.filter(place => place.id !== townId);
  const index = (state.seed + state.contractSerial * 3 + SETTLEMENTS.indexOf(town)) % candidates.length;
  const courierTarget = candidates[index];
  const courierReward = Math.round((80 + distance(town, courierTarget) * .34) / 5) * 5;
  const cheapGoods = [...GOODS].sort((a, b) => MARKET_FACTORS[town.id][a.id] - MARKET_FACTORS[town.id][b.id]);
  const good = cheapGoods[(state.seed + state.contractSerial) % 2];
  const buyers = [...candidates].sort((a, b) => MARKET_FACTORS[b.id][good.id] - MARKET_FACTORS[a.id][good.id]);
  const supplyTarget = buyers[(state.seed + state.contractSerial) % 2];
  const quantity = 4 + state.contractSerial % 2;
  const supplyReward = Math.round((quantity * goodPrices(town, good).buyPrice + 60 + distance(town, supplyTarget) * .38) / 5) * 5;
  const serial = state.contractSerial + 1;
  const offers = [
    { id: `courier-${serial}`, type: 'courier', from: town.id, to: courierTarget.id, reward: courierReward, renown: 1 },
    { id: `supply-${serial}`, type: 'supply', from: town.id, to: supplyTarget.id, reward: supplyReward, renown: 2, goodId: good.id, quantity },
  ];
  const camp = getCampSites(state).filter(site => !site.cleared).sort((a, b) => distance(a, town) - distance(b, town))[0];
  if (camp) offers.push({ id: `hunt-${serial}`, type: 'hunt', from: town.id, to: town.id, campId: camp.id, reward: camp.reward + Math.round(distance(camp, town) * .15 / 5) * 5, renown: 2 });
  return offers;
}

export function acceptContract(state, townId, offerId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const town = townAt(state);
  if (!town || town.id !== townId) return result(false, 'Visit the issuing settlement to take its contract.');
  if (state.contract) return result(false, 'Finish the current delivery before taking another.');
  const offers = getContractOffers(state, townId);
  const offer = offerId === undefined ? offers[0] : offers.find(entry => entry.id === offerId);
  if (!offer) return result(false, 'That contract is no longer available.');
  state.contractSerial += 1;
  const { id, ...terms } = offer;
  state.contract = { id: `delivery-${state.contractSerial}`, ...terms, acceptedDay: state.day };
  const destination = TOWN_BY_ID.get(offer.to);
  const message = offer.type === 'supply'
    ? `Deliver ${offer.quantity} ${GOOD_BY_ID.get(offer.goodId).name.toLowerCase()} to ${destination.name} for ${offer.reward} crowns.`
    : offer.type === 'hunt'
      ? `Clear ${CAMP_BY_ID.get(offer.campId).name} and return to ${town.name} for ${offer.reward} crowns.`
    : `Carry sealed dispatches to ${destination.name} for ${offer.reward} crowns.`;
  record(state, message);
  return result(true, message);
}

export function buyItem(state, itemId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  const item = ITEM_BY_ID.get(itemId);
  if (!item) return result(false, 'Unknown item.');
  const offer = getMarket(state).equipment.find(entry => entry.itemId === itemId);
  if (offer.stock < 1) return result(false, 'This item is sold out until the next market day.');
  if (state.gold < offer.buyPrice) return result(false, 'The company cannot afford this item.');
  if (state.inventory.length >= MAX_INVENTORY) return result(false, 'The company pack is full.');
  state.gold -= offer.buyPrice;
  state.inventory.push(item.id);
  state.inventoryCondition.push(itemCondition(item.id));
  writableMarketStock(state, access.town).equipment[itemId] -= 1;
  const message = `Bought ${item.name} for ${offer.buyPrice} crowns.`;
  record(state, message);
  return result(true, message);
}

export function sellItem(state, itemId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  const index = state.inventory.indexOf(itemId);
  if (index < 0) return result(false, 'That item is not in the company pack.');
  const item = ITEM_BY_ID.get(itemId);
  const offer = getMarket(state).equipment.find(entry => entry.itemId === itemId);
  state.inventory.splice(index, 1);
  state.inventoryCondition.splice(index, 1);
  state.gold += offer.sellPrice;
  writableMarketStock(state, access.town).equipment[itemId] += 1;
  const message = `Sold ${item.name} for ${offer.sellPrice} crowns.`;
  record(state, message);
  return result(true, message);
}

export function buyFood(state, quantity = 5) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  if (!validQuantity(quantity, 50)) return result(false, 'Choose 1 to 50 provisions.');
  const offer = getMarket(state).food;
  const cost = offer.buyPrice * quantity;
  if (offer.stock < quantity) return result(false, 'The market does not have that many provisions today.');
  if (state.gold < cost) return result(false, 'The company cannot afford those provisions.');
  if (state.food + quantity > 1000000000) return result(false, 'The company cannot carry more provisions.');
  state.gold -= cost;
  state.food += quantity;
  writableMarketStock(state, access.town).food -= quantity;
  const message = `Bought ${quantity} provisions for ${cost} crowns.`;
  record(state, message);
  return result(true, message);
}

export function buyGood(state, goodId, quantity = 1) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  const good = GOOD_BY_ID.get(goodId);
  if (!good) return result(false, 'Unknown trade good.');
  if (!validQuantity(quantity, MAX_CARGO)) return result(false, 'Choose 1 to 30 units of cargo.');
  const offer = getMarket(state).goods.find(entry => entry.goodId === goodId);
  const cost = offer.buyPrice * quantity;
  if (offer.stock < quantity) return result(false, 'The market does not have that much today.');
  if (state.gold < cost) return result(false, 'The company cannot afford that cargo.');
  if (cargoCount(state) + quantity > MAX_CARGO) return result(false, 'The cargo hold is full.');
  state.gold -= cost;
  state.cargo[goodId] = (state.cargo[goodId] ?? 0) + quantity;
  writableMarketStock(state, access.town).goods[goodId] -= quantity;
  const message = `Bought ${quantity} ${good.name.toLowerCase()} for ${cost} crowns.`;
  record(state, message);
  return completeContract(state, access.town) ? result(true, `${message} Supply contract completed.`) : result(true, message);
}

export function sellGood(state, goodId, quantity = 1) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  const good = GOOD_BY_ID.get(goodId);
  if (!good) return result(false, 'Unknown trade good.');
  if (!validQuantity(quantity, MAX_CARGO)) return result(false, 'Choose 1 to 30 units of cargo.');
  if ((state.cargo[goodId] ?? 0) < quantity) return result(false, 'The company does not carry that much.');
  const offer = getMarket(state).goods.find(entry => entry.goodId === goodId);
  const earnings = offer.sellPrice * quantity;
  if (state.gold + earnings > 1000000000) return result(false, 'The purse cannot hold more crowns.');
  state.cargo[goodId] -= quantity;
  if (!state.cargo[goodId]) delete state.cargo[goodId];
  state.gold += earnings;
  writableMarketStock(state, access.town).goods[goodId] += quantity;
  const message = `Sold ${quantity} ${good.name.toLowerCase()} for ${earnings} crowns.`;
  record(state, message);
  return result(true, message);
}

export function buySupplies(state, kind, quantity = 1) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  if (!SUPPLY_INFO[kind]) return result(false, 'Unknown supply.');
  if (!validQuantity(quantity, 50)) return result(false, 'Choose 1 to 50 supplies.');
  const offer = getMarket(state).supplies.find(entry => entry.kind === kind);
  const cost = offer.buyPrice * quantity;
  if (offer.stock < quantity) return result(false, 'The market does not have that many supplies today.');
  if (state.gold < cost) return result(false, 'The company cannot afford those supplies.');
  if (state.supplies[kind] + quantity > 10000) return result(false, 'The company cannot carry more supplies.');
  state.gold -= cost;
  state.supplies[kind] += quantity;
  writableMarketStock(state, access.town).supplies[kind] -= quantity;
  const message = `Bought ${quantity} ${SUPPLY_INFO[kind].name.toLowerCase()} for ${cost} crowns.`;
  record(state, message);
  return result(true, message);
}

export function equipItem(state, personId, itemId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  const item = ITEM_BY_ID.get(itemId);
  if (!item) return result(false, 'Unknown item.');
  const index = state.inventory.indexOf(itemId);
  if (index < 0) return result(false, 'That item is not in the company pack.');
  const previous = person.equipment[item.slot];
  const displaced = item.twoHanded && person.equipment.shield ? person.equipment.shield
    : item.slot === 'shield' && ITEM_BY_ID.get(person.equipment.weapon)?.twoHanded ? person.equipment.weapon : null;
  if (state.inventory.length - 1 + Number(Boolean(previous)) + Number(Boolean(displaced)) > MAX_INVENTORY) return result(false, 'The company pack is full.');
  const condition = state.inventoryCondition.splice(index, 1)[0];
  state.inventory.splice(index, 1);
  if (previous) {
    state.inventory.push(previous);
    state.inventoryCondition.push(item.slot === 'armor' ? person.armorDurability.body : item.slot === 'helmet' ? person.armorDurability.head : null);
  }
  if (displaced) {
    state.inventory.push(displaced);
    state.inventoryCondition.push(null);
    person.equipment[item.twoHanded ? 'shield' : 'weapon'] = null;
  }
  person.equipment[item.slot] = itemId;
  if (item.slot === 'armor') person.armorDurability.body = condition;
  if (item.slot === 'helmet') person.armorDurability.head = condition;
  const message = `${person.name} equipped ${item.name}.`;
  record(state, message);
  return result(true, message);
}

export function unequipItem(state, personId, slot) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  if (!SLOTS.includes(slot)) return result(false, 'Unknown equipment slot.');
  const itemId = person.equipment[slot];
  if (!itemId) return result(false, 'That slot is already empty.');
  if (state.inventory.length >= MAX_INVENTORY) return result(false, 'The company pack is full.');
  person.equipment[slot] = null;
  state.inventory.push(itemId);
  state.inventoryCondition.push(slot === 'armor' ? person.armorDurability.body : slot === 'helmet' ? person.armorDurability.head : null);
  if (slot === 'armor') person.armorDurability.body = 0;
  if (slot === 'helmet') person.armorDurability.head = 0;
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
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  if (state.party.length >= MAX_COMPANY_SIZE) return result(false, 'The company has room for only twelve members.');
  const cost = 160;
  if (state.gold < cost) return result(false, 'Recruitment costs 160 crowns.');
  const serial = state.recruitSerial++;
  const [name, background] = RECRUITS[(state.seed + serial) % RECRUITS.length];
  const person = normalizeMember({ id: `recruit-${serial + 1}`, name, background, seed: (state.seed ^ Math.imul(serial + 1, 2654435761)) >>> 0, hp: 100, morale: 70, equipment: { armor: null, helmet: null, weapon: null, shield: null } });
  state.party.push(person);
  state.gold -= cost;
  const message = `${name} joins the Ashen Company for ${cost} crowns.`;
  record(state, message);
  return result(true, message);
}

export function getLevelUp(person) {
  const next = person?.pendingLevelUps?.[0];
  return next ? { level: next.level, rolls: { ...next.rolls } } : null;
}

export function trainAttributes(state, personId, keys) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  const next = person.pendingLevelUps?.[0];
  if (!next) return result(false, 'This member has no level-up to spend.');
  if (!Array.isArray(keys) || keys.length !== 3 || new Set(keys).size !== 3 || !keys.every(key => ATTRIBUTES.includes(key))) {
    return result(false, 'Choose three different attributes.');
  }
  for (const key of keys) person.attributes[key] += next.rolls[key];
  if (keys.includes('maxHp')) person.hp += next.rolls.maxHp;
  person.pendingLevelUps.shift();
  person.trainingPoints = person.pendingLevelUps.length;
  const message = `${person.name} trained three attributes at level ${next.level}.`;
  record(state, message);
  return result(true, message);
}

export function trainAttribute() {
  return result(false, 'Choose three different attributes together to spend a level-up.');
}

export function camp(state) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  advanceClock(state, 6);
  if (state.pursuit) {
    const target = getRoamingBands(state).find(band => band.id === state.pursuit);
    state.destination = target ? { x: target.x, y: target.y } : null;
    if (!target) state.pursuit = null;
  }
  const wounded = state.party.some(person => person.hp < getCompanyStats(person).maxHp);
  const medicated = wounded && state.supplies.medicine > 0;
  if (medicated) state.supplies.medicine -= 1;
  for (const person of state.party) {
    person.hp = clamped(person.hp + (medicated ? 24 : 8), 1, getCompanyStats(person).maxHp);
    person.morale = clamped(person.morale + 9, 0, 100);
  }
  let repairs = 0;
  for (const person of state.party) {
    for (const [part, slot] of [['body', 'armor'], ['head', 'helmet']]) {
      const maximum = armorMaximum(person.equipment[slot]);
      while (person.armorDurability[part] < maximum && state.supplies.tools > 0) {
        person.armorDurability[part] = Math.min(maximum, person.armorDurability[part] + 25);
        state.supplies.tools -= 1;
        repairs += 1;
      }
    }
  }
  const message = `The company rests for six hours${medicated ? ' with medicine' : ''}${repairs ? ` and uses ${repairs} tools for repairs` : ''}.`;
  record(state, message);
  return result(true, message);
}

export function forage(state) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  advanceClock(state, 4);
  if (state.pursuit) {
    const target = getRoamingBands(state).find(band => band.id === state.pursuit);
    state.destination = target ? { x: target.x, y: target.y } : null;
    if (!target) state.pursuit = null;
  }
  const terrain = terrainAt(state.position.x, state.position.y);
  const bonus = terrain === 'forest' ? 2 : terrain === 'marsh' ? 1 : terrain === 'mountain' ? -1 : 0;
  const found = Math.max(3, 3 + Math.ceil(state.party.length / 2) + bonus);
  state.food += found;
  const message = `The company forages for four hours and finds ${found} provisions.`;
  record(state, message);
  return result(true, message);
}

export function getCampSites(state) {
  return CAMP_SITES.map(camp => ({
    ...camp,
    kind: 'camp',
    enemies: camp.enemies.map(enemy => ({ ...enemy })),
    cleared: Boolean(state.camps?.[camp.id]?.clearedDay),
  }));
}

export function setBattleTactic(state, tactic) {
  if (!TACTICS.includes(tactic)) return result(false, 'Unknown battle tactic.');
  if (state.gameOver) return result(false, 'The company has fallen.');
  if (state.battle && state.battle.status !== 'active') return result(false, 'Finish the battle before changing tactics.');
  if (state.tactic === tactic && (!state.battle || state.battle.tactic === tactic)) return result(true, `Company tactic remains ${tactic}.`);
  state.tactic = tactic;
  if (state.battle) {
    state.battle.tactic = tactic;
    state.battle.focusTargetId = null;
    state.battle.lastContactRound = state.battle.round;
  }
  const message = `Company tactic set to ${tactic}.`;
  record(state, message);
  return result(true, message);
}

function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function battleRoll(battle) {
  battle.rng = (Math.imul(battle.rng, 1664525) + 1013904223) >>> 0;
  return battle.rng / 4294967296;
}

function battleLog(battle, message) {
  battle.log.push(`Round ${battle.round}: ${message}`);
  if (battle.log.length > 120) battle.log.shift();
}

function makeBattleEvent(actor, target, type, message, weapon = null, from = null, extra = {}) {
  const ranged = weapon?.ranged === true;
  return {
    actorId: actor?.id ?? null, targetId: target?.id ?? null, type,
    weaponId: weapon?.id ?? null, ranged,
    projectile: ranged && (type === 'attack' || type === 'miss') ? weapon.visual === 'crossbow' ? 'bolt' : 'arrow' : null,
    from: from ?? (actor ? { q: actor.q, r: actor.r } : null),
    to: target ? { q: target.q, r: target.r } : actor ? { q: actor.q, r: actor.r } : null,
    message, ...extra,
  };
}

function sortTurnOrder(battle) {
  return battle.units.filter(unit => unit.alive).sort((a, b) =>
    b.initiative - b.fatigue * .2 - (a.initiative - a.fatigue * .2) || a.id.localeCompare(b.id)).map(unit => unit.id);
}

export function startBattle(state, encounterId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const encounterType = BAND_BY_ID.has(encounterId) ? 'band' : 'camp';
  const camp = encounterType === 'band' ? getRoamingBands(state).find(band => band.id === encounterId) : CAMP_BY_ID.get(encounterId);
  if (!camp) return result(false, 'That hostile group is no longer here.');
  if (encounterType === 'camp' && state.camps[camp.id]?.clearedDay) return result(false, 'This camp has already been cleared.');
  if (state.destination || distance(state.position, camp) > (encounterType === 'band' ? BAND_RADIUS + 7 : CAMP_RADIUS)) return result(false, 'Approach the enemy before engaging.');
  if (!state.party.length) return result(false, 'No company members can fight.');
  const deployed = [...state.party].sort((a, b) => {
    const bowA = ITEM_BY_ID.get(a.equipment.weapon)?.range > 1 ? 1 : 0;
    const bowB = ITEM_BY_ID.get(b.equipment.weapon)?.range > 1 ? 1 : 0;
    return bowA - bowB || getCompanyStats(b).bodyArmor + getCompanyStats(b).headArmor - getCompanyStats(a).bodyArmor - getCompanyStats(a).headArmor;
  });
  const company = deployed.map((person, index) => {
    const stats = getCompanyStats(person);
    return {
      id: person.id, name: person.name, side: 'company', q: 2 - Math.floor(index / 4), r: index % 4,
      hp: person.hp, maxHp: stats.maxHp, bodyArmor: stats.bodyArmor, headArmor: stats.headArmor,
      maxBodyArmor: stats.maxBodyArmor, maxHeadArmor: stats.maxHeadArmor,
      equipment: { ...person.equipment }, seed: person.seed, alive: person.hp > 0,
      morale: person.morale, fatigue: 0, ap: 2, reload: 0,
      meleeSkill: stats.meleeSkill, rangedSkill: stats.rangedSkill,
      meleeDefense: stats.meleeDefense, rangedDefense: stats.rangedDefense,
      maxFatigue: stats.maxFatigue, initiative: stats.initiative, resolve: stats.resolve,
    };
  });
  const enemies = camp.enemies.map((enemy, index) => {
    const gear = { armor: enemy.armor, helmet: enemy.helmet, weapon: enemy.weapon, shield: enemy.shield };
    const shieldDefense = ITEM_BY_ID.get(gear.shield)?.defense ?? 0;
    const hp = 25 + camp.difficulty * 12 + (index === 0 && camp.difficulty === 3 ? 12 : 0);
    return {
      id: `enemy-${index + 1}`, name: enemy.name, side: 'enemy', q: ITEM_BY_ID.get(gear.weapon)?.range > 1 ? 8 : 7, r: index % 5,
      hp, maxHp: hp, bodyArmor: armorMaximum(gear.armor), headArmor: armorMaximum(gear.helmet),
      maxBodyArmor: armorMaximum(gear.armor), maxHeadArmor: armorMaximum(gear.helmet),
      equipment: gear, seed: hashSeed(`${state.seed}:${camp.id}:${index}`), alive: true,
      morale: 55 + camp.difficulty * 8, fatigue: 0, ap: 2, reload: 0,
      meleeSkill: 30 + camp.difficulty * 6, rangedSkill: 28 + camp.difficulty * 6,
      meleeDefense: 2 + camp.difficulty * 2 + shieldDefense,
      rangedDefense: 2 + camp.difficulty * 2 + shieldDefense,
      maxFatigue: 85, initiative: 75 + camp.difficulty * 6, resolve: 32 + camp.difficulty * 8,
    };
  });
  const battle = {
    id: `battle-${camp.id}-${state.day}-${state.contractSerial}`, campId: camp.id,
    encounterType, encounterName: camp.name,
    tactic: state.tactic ?? 'offense', focusTargetId: null, lastContactRound: 1, engaged: false,
    status: 'active', round: 1, activeId: null, units: [...company, ...enemies],
    turnOrder: [], turnIndex: 0, rng: hashSeed(`${state.seed}:${camp.id}:${state.day}:${state.contractSerial}`),
    log: [], lastEvent: null,
    loot: { gold: 0, food: 0, tools: 0, medicine: 0, ammo: 0, items: [] },
    casualties: [], xp: {},
  };
  battle.turnOrder = sortTurnOrder(battle);
  battle.activeId = battle.turnOrder[0];
  battleLog(battle, `The company engages ${camp.name}.`);
  state.battle = battle;
  state.destination = null;
  state.pursuit = null;
  const message = `Battle begins at ${camp.name}.`;
  record(state, message);
  return result(true, message);
}

function nextBattleTurn(battle) {
  let next = battle.turnIndex + 1;
  while (true) {
    if (next >= battle.turnOrder.length) {
      battle.round += 1;
      battle.turnOrder = sortTurnOrder(battle);
      next = 0;
    }
    const unit = battle.units.find(entry => entry.id === battle.turnOrder[next]);
    if (unit?.alive) {
      battle.turnIndex = next;
      battle.activeId = unit.id;
      unit.ap = 2;
      return;
    }
    next += 1;
  }
}

function finishBattlePhase(battle) {
  const companyAlive = battle.units.some(unit => unit.side === 'company' && unit.alive);
  const enemiesAlive = battle.units.some(unit => unit.side === 'enemy' && unit.alive);
  if (companyAlive && enemiesAlive) return false;
  battle.status = companyAlive ? 'victory' : 'defeat';
  battle.activeId = null;
  battle.casualties = battle.units.filter(unit => unit.side === 'company' && !unit.alive).map(unit => unit.id);
  if (companyAlive) {
    const band = battle.encounterType === 'band' ? BAND_BY_ID.get(battle.campId) : null;
    const camp = band ?? CAMP_BY_ID.get(battle.campId);
    battle.loot = band ? {
      gold: 28 + camp.enemies.length * 19,
      food: 3,
      tools: 2,
      medicine: 1,
      ammo: 3,
      items: [camp.enemies[0].weapon],
    } : {
      gold: 55 + camp.difficulty * 45,
      food: 2 + camp.difficulty,
      tools: 1 + camp.difficulty,
      medicine: camp.difficulty >= 2 ? 1 : 0,
      ammo: 2 + camp.difficulty,
      items: [camp.enemies[0].weapon],
    };
    for (const unit of battle.units.filter(entry => entry.side === 'company' && entry.alive)) {
      battle.xp[unit.id] = (battle.xp[unit.id] ?? 0) + 30;
    }
  }
  battleLog(battle, companyAlive ? battle.encounterType === 'band' ? 'The brigands break and flee the road.' : 'The brigands break. The camp is yours.' : 'The company is defeated.');
  return true;
}

const HEX_DIRECTIONS = [[1, 0], [1, -1], [0, 1], [0, -1], [-1, 0], [-1, 1]];

function openNeighbors(point, occupied) {
  return HEX_DIRECTIONS.map(([dq, dr]) => ({ q: point.q + dq, r: point.r + dr }))
    .filter(next => next.q >= 0 && next.q < 10 && next.r >= 0 && next.r < 5 && !occupied.has(`${next.q},${next.r}`));
}

function pathToTarget(battle, actor, target, range) {
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const queue = [{ q: actor.q, r: actor.r, path: [] }];
  const visited = new Set([`${actor.q},${actor.r}`]);
  for (let index = 0; index < queue.length; index++) {
    const point = queue[index];
    if (hexDistance(point, target) <= range) return point.path;
    for (const next of openNeighbors(point, occupied)) {
      const key = `${next.q},${next.r}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ ...next, path: [...point.path, next] });
      }
    }
  }
  return null;
}

function stepArcherBack(battle, actor) {
  const enemies = battle.units.filter(unit => unit.alive && unit.side !== actor.side);
  const nearest = Math.min(...enemies.map(unit => hexDistance(actor, unit)));
  if (nearest > 1) return false;
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const option = openNeighbors(actor, occupied)
    .map(point => ({ ...point, safety: Math.min(...enemies.map(unit => hexDistance(point, unit))) }))
    .filter(point => point.safety > nearest && enemies.some(unit => hexDistance(point, unit) <= 4))
    .sort((a, b) => b.safety - a.safety || a.q - b.q || a.r - b.r)[0];
  if (!option) return false;
  actor.q = option.q;
  actor.r = option.r;
  actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + 3);
  return true;
}

function attackTarget(state, actor, target, weapon) {
  const battle = state.battle;
  const ranged = weapon.ranged === true;
  if (ranged && actor.side === 'company') state.supplies.ammo -= 1;
  const skill = ranged ? actor.rangedSkill : actor.meleeSkill;
  const defense = (ranged ? target.rangedDefense : target.meleeDefense) + (target.side === 'company' && battle.tactic === 'defense' ? 5 : 0);
  const chance = clamped(skill + (weapon.hitBonus ?? 0) - defense + 15 + Math.floor((actor.morale - 50) / 8) - Math.floor(actor.fatigue / 7) - (ranged && hexDistance(actor, target) === 1 ? 12 : 0), 12, 90);
  actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + (weapon.fatigueCost ?? (ranged ? 9 : 11)));
  if (weapon.reloadTurns) actor.reload = weapon.reloadTurns;
  actor.ap = 0;
  if (actor.side === 'company' || !ranged && hexDistance(actor, target) <= 1) battle.lastContactRound = battle.round;
  if (!ranged && hexDistance(actor, target) <= 1) battle.engaged = true;
  if (battleRoll(battle) * 100 >= chance) {
    const message = `${actor.name} misses ${target.name}.`;
    battle.lastEvent = makeBattleEvent(actor, target, 'miss', message, weapon);
    battleLog(battle, message);
    return;
  }
  const raw = weapon.damageMin + Math.floor(battleRoll(battle) * (weapon.damageMax - weapon.damageMin + 1));
  const head = battleRoll(battle) < .22;
  const part = head ? 'headArmor' : 'bodyArmor';
  const armorBefore = target[part];
  const armorDamage = Math.max(1, Math.round(raw * (weapon.armorDamage ?? 1) * (head ? 1.1 : 1)));
  target[part] = Math.max(0, armorBefore - armorDamage);
  let hpDamage = armorBefore > 0
    ? Math.max(1, Math.floor(raw * (weapon.armorPiercing ?? .30) - armorBefore * .025) + Math.max(0, Math.floor((armorDamage - armorBefore) * .25)))
    : raw;
  if (head) hpDamage = Math.round(hpDamage * 1.25);
  target.hp = Math.max(0, target.hp - hpDamage);
  target.morale = Math.max(0, target.morale - 3);
  const fallen = target.hp === 0;
  if (fallen) {
    target.alive = false;
    target.ap = 0;
    for (const ally of battle.units.filter(unit => unit.side === target.side && unit.alive)) ally.morale = Math.max(0, ally.morale - 12);
    if (actor.side === 'company') battle.xp[actor.id] = (battle.xp[actor.id] ?? 0) + 20;
  }
  const message = `${actor.name} hits ${target.name}${head ? ' in the head' : ''} for ${hpDamage} health and ${Math.min(armorBefore, armorDamage)} armor${fallen ? '; they fall' : ''}.`;
  battle.lastEvent = makeBattleEvent(actor, target, 'attack', message, weapon, null, { head, hpDamage, armorDamage: Math.min(armorBefore, armorDamage), fallen });
  battleLog(battle, message);
}

export function advanceBattle(state) {
  const battle = state.battle;
  if (!battle || battle.status !== 'active') return result(false, 'There is no active battle.');
  const actor = battle.units.find(unit => unit.id === battle.activeId);
  if (!actor?.alive) {
    nextBattleTurn(battle);
    return result(true, 'The next fighter takes their turn.');
  }
  const enemies = battle.units.filter(unit => unit.alive && unit.side !== actor.side);
  if (!enemies.length) {
    finishBattlePhase(battle);
    return result(true, 'The battle is over.');
  }
  actor.fatigue = Math.max(0, actor.fatigue - 6);
  const equippedWeapon = ITEM_BY_ID.get(actor.equipment.weapon);
  if (actor.reload > 0) {
    actor.reload -= 1;
    actor.ap = 0;
    const message = `${actor.name} reloads ${equippedWeapon?.name ?? 'their weapon'}.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equippedWeapon);
    battleLog(battle, message);
    nextBattleTurn(battle);
    return result(true, message);
  }
  if (actor.fatigue >= actor.maxFatigue - 10) {
    actor.fatigue = Math.max(0, actor.fatigue - 22);
    actor.ap = 0;
    const message = `${actor.name} catches their breath.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equippedWeapon);
    battleLog(battle, message);
    nextBattleTurn(battle);
    return result(true, message);
  }
  const bowWithoutAmmo = equippedWeapon?.ranged && actor.side === 'company' && state.supplies.ammo < 1;
  const weapon = bowWithoutAmmo ? { damageMin: 8, damageMax: 12, hitBonus: -12, armorDamage: .4, range: 1 } : equippedWeapon ?? { damageMin: 8, damageMax: 12, hitBonus: -10, armorDamage: .4, range: 1 };
  const range = weapon.range ?? 1;
  if (weapon.ranged) stepArcherBack(battle, actor);
  const defenseKey = weapon.ranged ? 'rangedDefense' : 'meleeDefense';
  const vulnerability = target => target.hp + (target.bodyArmor + target.headArmor) * .15 + target[defenseKey] * .3;
  const targets = enemies.map(target => ({ target, path: pathToTarget(battle, actor, target, range) }))
    .filter(entry => entry.path !== null)
    .sort((a, b) => a.path.length - b.path.length
      || vulnerability(a.target) - vulnerability(b.target)
      || hexDistance(actor, a.target) - hexDistance(actor, b.target) || a.target.id.localeCompare(b.target.id));
  if (actor.side === 'company' && battle.focusTargetId && !enemies.some(enemy => enemy.id === battle.focusTargetId)) battle.focusTargetId = null;
  const companyTactic = actor.side === 'company' ? battle.tactic : 'offense';
  let choice = targets[0];
  if (companyTactic === 'focus') {
    const shared = targets.find(entry => entry.target.id === battle.focusTargetId);
    choice = shared ?? [...targets].sort((a, b) => vulnerability(a.target) + a.path.length * 3 - vulnerability(b.target) - b.path.length * 3 || a.target.id.localeCompare(b.target.id))[0];
    if (choice) battle.focusTargetId = choice.target.id;
  } else if (companyTactic === 'defense') {
    choice = targets.find(entry => entry.path.length === 0);
    if (!choice && !(battle.engaged && targets[0]?.path.length <= 3) && battle.round - battle.lastContactRound < 4) {
      actor.ap = 0;
      actor.fatigue = Math.max(0, actor.fatigue - 12);
      const message = `${actor.name} holds the line.`;
      battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, equippedWeapon);
      battleLog(battle, message);
      nextBattleTurn(battle);
      return result(true, message);
    }
    choice ??= targets[0];
  }
  if (!choice) {
    actor.ap = 0;
    const message = `${actor.name} holds position and catches their breath.`;
    actor.fatigue = Math.max(0, actor.fatigue - 12);
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equippedWeapon);
    battleLog(battle, message);
    nextBattleTurn(battle);
    return result(true, message);
  }
  const { target, path } = choice;
  const from = { q: actor.q, r: actor.r };
  if (path.length) {
    const destination = path[Math.min(2, path.length) - 1];
    actor.q = destination.q;
    actor.r = destination.r;
    actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + 5);
  }
  if (hexDistance(actor, target) <= range) {
    attackTarget(state, actor, target, weapon);
  } else {
    actor.ap = 0;
    const message = `${actor.name} advances toward ${target.name}.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'move', message, equippedWeapon, from);
    battle.lastEvent.targetId = target.id;
    battleLog(battle, message);
  }
  if (!finishBattlePhase(battle)) nextBattleTurn(battle);
  return result(true, battle.lastEvent.message);
}

export function resolveBattle(state) {
  if (!state.battle || state.battle.status !== 'active') return result(false, 'There is no active battle.');
  for (let turn = 0; turn < 500 && state.battle.status === 'active'; turn++) advanceBattle(state);
  return state.battle.status === 'active' ? result(false, 'The battle is still underway.') : result(true, `Battle ended in ${state.battle.status}.`);
}

export function retreatBattle(state) {
  const battle = state.battle;
  if (!battle || battle.status !== 'active') return result(false, 'There is no active battle.');
  battle.status = 'retreat';
  battle.activeId = null;
  battle.casualties = battle.units.filter(unit => unit.side === 'company' && !unit.alive).map(unit => unit.id);
  state.food = Math.max(0, state.food - 2);
  for (const unit of battle.units.filter(entry => entry.side === 'company' && entry.alive)) {
    unit.hp = Math.max(1, unit.hp - 5);
    unit.morale = Math.max(0, unit.morale - 12);
  }
  battle.lastEvent = makeBattleEvent(null, null, 'retreat', 'The company retreats, losing two provisions and taking wounds.');
  battleLog(battle, battle.lastEvent.message);
  return result(true, battle.lastEvent.message);
}

export function finishBattle(state) {
  const battle = state.battle;
  if (!battle || battle.status === 'active') return result(false, 'Finish the fight before claiming its result.');
  const victory = battle.status === 'victory';
  const survivors = [];
  for (const person of state.party) {
    const unit = battle.units.find(entry => entry.id === person.id);
    if (!unit) continue;
    if (!unit.alive) {
      if (victory) {
        for (const slot of SLOTS) {
          const itemId = person.equipment[slot];
          if (itemId && state.inventory.length < MAX_INVENTORY) {
            state.inventory.push(itemId);
            state.inventoryCondition.push(slot === 'armor' ? unit.bodyArmor : slot === 'helmet' ? unit.headArmor : null);
          }
        }
      }
      continue;
    }
    person.hp = unit.hp;
    person.morale = unit.morale;
    person.armorDurability = { body: unit.bodyArmor, head: unit.headArmor };
    person.xp += battle.xp[person.id] ?? 0;
    while (person.xp >= person.level * 50 && person.level < 20) {
      person.xp -= person.level * 50;
      person.level += 1;
      person.pendingLevelUps.push({ level: person.level, rolls: levelRolls(person.seed, person.level) });
    }
    if (person.level === 20) person.xp = Math.min(person.xp, person.level * 50 - 1);
    person.trainingPoints = person.pendingLevelUps.length;
    survivors.push(person);
  }
  state.party = survivors;
  if (victory) {
    const loot = battle.loot;
    state.gold += loot.gold;
    state.food += loot.food;
    for (const kind of ['tools', 'medicine', 'ammo']) state.supplies[kind] += loot[kind];
    for (const itemId of loot.items) {
      if (state.inventory.length >= MAX_INVENTORY) break;
      state.inventory.push(itemId);
      state.inventoryCondition.push(itemCondition(itemId));
    }
    if (battle.encounterType === 'band') state.bands[battle.campId] = { defeatedUntil: worldHours(state) + 48 };
    else state.camps[battle.campId] = { clearedDay: state.day };
  }
  state.gameOver = state.party.length === 0;
  const message = victory ? `The company claims ${battle.loot.gold} crowns and defeats ${battle.encounterName}.` : state.gameOver ? 'The company has fallen.' : 'The company survives and leaves the battlefield behind.';
  record(state, message);
  state.battle = null;
  return result(true, message);
}

function assert(condition, message) { if (!condition) throw new TypeError(`Invalid save: ${message}`); }
function validCount(value) { return Number.isSafeInteger(value) && value >= 0; }
function validPoint(point) { return point && typeof point === 'object' && !Array.isArray(point) && inBounds(point.x, point.y); }
function recordObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function validHex(point) { return recordObject(point) && Number.isSafeInteger(point.q) && point.q >= 0 && point.q < 10 && Number.isSafeInteger(point.r) && point.r >= 0 && point.r < 5; }

function validateBattle(input, party) {
  if (input === undefined || input === null) return null;
  const encounterType = input.encounterType ?? 'camp';
  assert(recordObject(input) && (encounterType === 'camp' ? CAMP_BY_ID.has(input.campId) : encounterType === 'band' && BAND_BY_ID.has(input.campId)), 'battle encounter');
  const encounterName = encounterType === 'band' ? BAND_BY_ID.get(input.campId).name : CAMP_BY_ID.get(input.campId).name;
  assert(input.encounterName === undefined || input.encounterName === encounterName, 'battle encounter name');
  assert(typeof input.id === 'string' && input.id.length <= 80 && input.id.startsWith('battle-'), 'battle id');
  assert(['active', 'victory', 'defeat', 'retreat'].includes(input.status), 'battle status');
  assert(Number.isSafeInteger(input.round) && input.round >= 1 && input.round <= 1000, 'battle round');
  const tactic = input.tactic ?? 'offense';
  assert(TACTICS.includes(tactic), 'battle tactic');
  const lastContactRound = input.lastContactRound ?? 1;
  assert(Number.isSafeInteger(lastContactRound) && lastContactRound >= 1 && lastContactRound <= input.round, 'battle contact round');
  const engaged = input.engaged ?? false;
  assert(typeof engaged === 'boolean', 'battle engaged');
  assert(validCount(input.rng) && input.rng <= 0xffffffff, 'battle random state');
  assert(Array.isArray(input.units) && input.units.length >= 2 && input.units.length <= MAX_COMPANY_SIZE + 6, 'battle units');
  const ids = new Set();
  const partyIds = new Set(party.map(person => person.id));
  const units = input.units.map(unit => {
    assert(recordObject(unit) && typeof unit.id === 'string' && unit.id.length <= 40 && !ids.has(unit.id), 'battle unit id');
    ids.add(unit.id);
    assert(unit.side === 'company' || unit.side === 'enemy', 'battle side');
    assert(unit.side === 'company' ? partyIds.has(unit.id) : /^enemy-[1-6]$/.test(unit.id), 'battle unit ownership');
    assert(typeof unit.name === 'string' && unit.name.length > 0 && unit.name.length <= 80, 'battle unit name');
    assert(Number.isSafeInteger(unit.q) && unit.q >= 0 && unit.q < 10 && Number.isSafeInteger(unit.r) && unit.r >= 0 && unit.r < 5, 'battle hex');
    assert(validCount(unit.maxHp) && unit.maxHp >= 1 && unit.maxHp <= 300 && validCount(unit.hp) && unit.hp <= unit.maxHp && unit.alive === (unit.hp > 0), 'battle health');
    assert(recordObject(unit.equipment), 'battle equipment');
    for (const slot of SLOTS) assert(unit.equipment[slot] === null || ITEM_BY_ID.get(unit.equipment[slot])?.slot === slot, 'battle equipment');
    assert(!ITEM_BY_ID.get(unit.equipment.weapon)?.twoHanded || !unit.equipment.shield, 'battle two handed weapon');
    assert(unit.maxBodyArmor === armorMaximum(unit.equipment.armor) && unit.maxHeadArmor === armorMaximum(unit.equipment.helmet), 'battle armor maximum');
    assert(validCount(unit.bodyArmor) && unit.bodyArmor <= unit.maxBodyArmor && validCount(unit.headArmor) && unit.headArmor <= unit.maxHeadArmor, 'battle armor');
    assert(validCount(unit.seed) && unit.seed <= 0xffffffff, 'battle unit seed');
    assert(validCount(unit.morale) && unit.morale <= 100 && validCount(unit.fatigue) && unit.fatigue <= 300 && validCount(unit.ap) && unit.ap <= 2, 'battle stamina');
    assert(unit.reload === undefined || validCount(unit.reload) && unit.reload <= 2, 'battle reload');
    for (const key of ['meleeSkill', 'rangedSkill', 'meleeDefense', 'rangedDefense', 'maxFatigue', 'initiative', 'resolve']) assert(validCount(unit[key]) && unit[key] <= 300, `battle ${key}`);
    return {
      id: unit.id, name: unit.name, side: unit.side, q: unit.q, r: unit.r,
      hp: unit.hp, maxHp: unit.maxHp, bodyArmor: unit.bodyArmor, headArmor: unit.headArmor,
      maxBodyArmor: unit.maxBodyArmor, maxHeadArmor: unit.maxHeadArmor,
      equipment: Object.fromEntries(SLOTS.map(slot => [slot, unit.equipment[slot]])),
      seed: unit.seed, alive: unit.alive, morale: unit.morale, fatigue: unit.fatigue, ap: unit.ap, reload: unit.reload ?? 0,
      meleeSkill: unit.meleeSkill, rangedSkill: unit.rangedSkill,
      meleeDefense: unit.meleeDefense, rangedDefense: unit.rangedDefense,
      maxFatigue: unit.maxFatigue, initiative: unit.initiative, resolve: unit.resolve,
    };
  });
  assert(units.some(unit => unit.side === 'company') && units.some(unit => unit.side === 'enemy'), 'battle sides');
  const focusTargetId = input.focusTargetId ?? null;
  assert(focusTargetId === null || units.some(unit => unit.side === 'enemy' && unit.id === focusTargetId), 'battle focus target');
  assert(units.filter(unit => unit.side === 'company').length === party.length, 'battle company roster');
  assert(units.filter(unit => unit.side === 'company').every(unit => party.some(person => person.id === unit.id)), 'battle company roster');
  const companyAlive = units.some(unit => unit.side === 'company' && unit.alive);
  const enemyAlive = units.some(unit => unit.side === 'enemy' && unit.alive);
  assert(input.status === 'active' ? companyAlive && enemyAlive : input.status === 'victory' ? companyAlive && !enemyAlive : input.status === 'defeat' ? !companyAlive : companyAlive, 'battle outcome');
  assert(Array.isArray(input.turnOrder) && input.turnOrder.length >= 1 && input.turnOrder.length <= units.length && input.turnOrder.every(id => ids.has(id)) && new Set(input.turnOrder).size === input.turnOrder.length, 'battle turn order');
  assert(units.filter(unit => unit.alive).every(unit => input.turnOrder.includes(unit.id)), 'battle living turns');
  assert(Number.isSafeInteger(input.turnIndex) && input.turnIndex >= 0 && input.turnIndex < input.turnOrder.length, 'battle turn index');
  assert(input.status === 'active' ? input.activeId === input.turnOrder[input.turnIndex] && units.some(unit => unit.id === input.activeId && unit.alive) : input.activeId === null, 'battle active unit');
  assert(Array.isArray(input.log) && input.log.length <= 120 && input.log.every(entry => typeof entry === 'string' && entry.length <= 300), 'battle log');
  const event = input.lastEvent;
  assert(event === null || (recordObject(event) && ['attack', 'move', 'hit', 'miss', 'fall', 'retreat', 'recover', 'hold'].includes(event.type) && typeof event.message === 'string' && event.message.length <= 300 && (event.actorId === null || ids.has(event.actorId)) && (event.targetId === null || ids.has(event.targetId))), 'battle event');
  if (event?.head !== undefined) assert(typeof event.head === 'boolean', 'battle event head');
  if (event?.fallen !== undefined) assert(typeof event.fallen === 'boolean', 'battle event fallen');
  if (event?.weaponId !== undefined) assert(event.weaponId === null || ITEM_BY_ID.get(event.weaponId)?.slot === 'weapon', 'battle event weapon');
  if (event?.ranged !== undefined) assert(typeof event.ranged === 'boolean', 'battle event ranged');
  if (event?.projectile !== undefined) assert([null, 'arrow', 'bolt'].includes(event.projectile), 'battle event projectile');
  for (const key of ['from', 'to']) if (event?.[key] !== undefined) assert(event[key] === null || validHex(event[key]), `battle event ${key}`);
  for (const key of ['hpDamage', 'armorDamage']) if (event?.[key] !== undefined) assert(validCount(event[key]) && event[key] <= 1000, `battle event ${key}`);
  const actor = units.find(unit => unit.id === event?.actorId);
  const target = units.find(unit => unit.id === event?.targetId);
  const weaponId = event?.weaponId === undefined ? actor?.equipment.weapon ?? null : event.weaponId;
  const ranged = event?.ranged ?? (ITEM_BY_ID.get(weaponId)?.ranged === true);
  const normalizedEvent = event ? {
    actorId: event.actorId, targetId: event.targetId, type: event.type === 'hit' || event.type === 'fall' ? 'attack' : event.type,
    weaponId, ranged, projectile: event.projectile === undefined ? ranged && ['attack', 'miss', 'hit', 'fall'].includes(event.type) ? ITEM_BY_ID.get(weaponId)?.visual === 'crossbow' ? 'bolt' : 'arrow' : null : event.projectile,
    from: event.from === undefined ? actor ? { q: actor.q, r: actor.r } : null : event.from === null ? null : { q: event.from.q, r: event.from.r },
    to: event.to === undefined ? target ? { q: target.q, r: target.r } : actor ? { q: actor.q, r: actor.r } : null : event.to === null ? null : { q: event.to.q, r: event.to.r },
    message: event.message,
    ...(event.head !== undefined ? { head: event.head } : {}),
    ...(event.hpDamage !== undefined ? { hpDamage: event.hpDamage } : {}),
    ...(event.armorDamage !== undefined ? { armorDamage: event.armorDamage } : {}),
    ...(event.fallen !== undefined || event.type === 'fall' ? { fallen: event.fallen ?? true } : {}),
  } : null;
  const loot = input.loot;
  assert(recordObject(loot) && validCount(loot.gold) && loot.gold <= 100000 && Array.isArray(loot.items) && loot.items.length <= 24 && loot.items.every(id => ITEM_BY_ID.has(id)), 'battle loot');
  for (const key of ['food', 'tools', 'medicine', 'ammo']) assert(validCount(loot[key]) && loot[key] <= 1000, `battle loot ${key}`);
  assert(Array.isArray(input.casualties) && input.casualties.length <= MAX_COMPANY_SIZE && input.casualties.every(id => partyIds.has(id)) && new Set(input.casualties).size === input.casualties.length, 'battle casualties');
  assert(recordObject(input.xp) && Object.keys(input.xp).every(id => partyIds.has(id) && validCount(input.xp[id]) && input.xp[id] <= 1000), 'battle xp');
  return {
    id: input.id, campId: input.campId, encounterType, encounterName, tactic, focusTargetId, lastContactRound, engaged, status: input.status, round: input.round, activeId: input.activeId,
    units, turnOrder: [...input.turnOrder], turnIndex: input.turnIndex, rng: input.rng,
    log: [...input.log], lastEvent: normalizedEvent,
    loot: { gold: loot.gold, food: loot.food, tools: loot.tools, medicine: loot.medicine, ammo: loot.ammo, items: [...loot.items] },
    casualties: [...input.casualties], xp: { ...input.xp },
  };
}

export function validateSave(input) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 'expected an object');
  assert(input.version === 1, 'unsupported version');
  assert(validCount(input.seed) && input.seed <= 0xffffffff, 'seed');
  assert(Number.isSafeInteger(input.day) && input.day >= 1 && input.day <= 1000000, 'day');
  assert(Number.isFinite(input.hour) && input.hour >= 0 && input.hour < 24, 'hour');
  const tactic = input.tactic ?? 'offense';
  assert(TACTICS.includes(tactic), 'tactic');
  for (const key of ['gold', 'food']) assert(validCount(input[key]) && input[key] <= 1000000000, key);
  for (const key of ['renown', 'contractSerial', 'recruitSerial']) assert(validCount(input[key]) && input[key] <= 1000000, key);
  assert(validPoint(input.position), 'position');
  assert(input.destination === null || validPoint(input.destination), 'destination');
  assert(Array.isArray(input.inventory) && input.inventory.length <= MAX_INVENTORY && input.inventory.every(id => ITEM_BY_ID.has(id)), 'inventory');
  const inventoryCondition = input.inventoryCondition === undefined ? input.inventory.map(itemCondition) : input.inventoryCondition;
  assert(Array.isArray(inventoryCondition) && inventoryCondition.length === input.inventory.length, 'inventory condition');
  for (let index = 0; index < input.inventory.length; index++) {
    const maximum = itemCondition(input.inventory[index]);
    assert(maximum === null ? inventoryCondition[index] === null : validCount(inventoryCondition[index]) && inventoryCondition[index] <= maximum, 'inventory condition');
  }
  const supplies = input.supplies === undefined ? { tools: 8, medicine: 5, ammo: 16 } : input.supplies;
  assert(recordObject(supplies) && Object.keys(supplies).length === 3, 'supplies');
  for (const kind of Object.keys(SUPPLY_INFO)) assert(validCount(supplies[kind]) && supplies[kind] <= 10000, `supplies ${kind}`);
  const cargo = input.cargo === undefined ? {} : input.cargo;
  assert(recordObject(cargo) && Object.keys(cargo).every(id => GOOD_BY_ID.has(id) && validCount(cargo[id]) && cargo[id] <= MAX_CARGO) && Object.values(cargo).reduce((total, count) => total + count, 0) <= MAX_CARGO, 'cargo');
  const markets = input.marketStock === undefined ? {} : input.marketStock;
  assert(recordObject(markets) && Object.keys(markets).every(id => TOWN_BY_ID.has(id)), 'market stock');
  for (const market of Object.values(markets)) {
    assert(recordObject(market) && Number.isSafeInteger(market.day) && market.day >= 1 && market.day <= input.day && validCount(market.food) && market.food <= 100, 'market stock');
    assert(recordObject(market.goods) && GOODS.every(good => validCount(market.goods[good.id]) && market.goods[good.id] <= 100) && Object.keys(market.goods).length === GOODS.length, 'goods stock');
    assert(recordObject(market.equipment) && ITEMS.filter(item => !NEW_ITEM_IDS.has(item.id)).every(item => validCount(market.equipment[item.id]) && market.equipment[item.id] <= 1024) && Object.keys(market.equipment).every(id => ITEM_BY_ID.has(id) && validCount(market.equipment[id]) && market.equipment[id] <= 1024), 'equipment stock');
    if (market.supplies !== undefined) assert(recordObject(market.supplies) && Object.keys(market.supplies).length === 3 && Object.keys(SUPPLY_INFO).every(kind => validCount(market.supplies[kind]) && market.supplies[kind] <= 100), 'supplies stock');
  }
  const gameOver = input.gameOver === undefined ? false : input.gameOver;
  assert(typeof gameOver === 'boolean', 'game over');
  assert(Array.isArray(input.party) && input.party.length <= MAX_COMPANY_SIZE && (input.party.length > 0 || gameOver), 'party');
  const ids = new Set();
  for (const person of input.party) {
    assert(person && typeof person === 'object' && !Array.isArray(person), 'person');
    assert(typeof person.id === 'string' && person.id.length <= 40 && /^[a-z0-9-]+$/.test(person.id) && !ids.has(person.id), 'person id');
    ids.add(person.id);
    assert(typeof person.name === 'string' && person.name.length > 0 && person.name.length <= 80, 'person name');
    assert(typeof person.background === 'string' && person.background.length > 0 && person.background.length <= 80, 'person background');
    assert(validCount(person.seed) && person.seed <= 0xffffffff, 'person seed');
    assert(Number.isFinite(person.morale) && person.morale >= 0 && person.morale <= 100, 'person morale');
    assert(person.equipment && typeof person.equipment === 'object' && !Array.isArray(person.equipment), 'equipment');
    for (const slot of SLOTS) {
      const itemId = person.equipment[slot];
      assert(itemId === null || ITEM_BY_ID.get(itemId)?.slot === slot, `${slot} equipment`);
    }
    assert(person.attributes === undefined || recordObject(person.attributes), 'person attributes');
    assert(person.armorDurability === undefined || recordObject(person.armorDurability), 'person armor durability');
    assert(person.level !== null && person.xp !== null && person.trainingPoints !== null, 'person progress');
    assert(person.level === undefined || Number.isSafeInteger(person.level) && person.level >= 1 && person.level <= 20, 'person level');
    assert(person.trainingPoints === undefined || validCount(person.trainingPoints) && person.trainingPoints <= 20, 'person training points');
    const earnedLevel = person.level ?? 1;
    if (person.pendingLevelUps === undefined) {
      assert((person.trainingPoints ?? 0) <= earnedLevel - 1, 'legacy training points');
    } else {
      const pending = person.pendingLevelUps;
      assert(Array.isArray(pending) && pending.length <= earnedLevel - 1 && (person.trainingPoints === undefined || person.trainingPoints === pending.length), 'pending level-ups');
      for (let index = 0; index < pending.length; index++) {
        const entry = pending[index];
        const level = earnedLevel - pending.length + index + 1;
        assert(recordObject(entry) && Object.keys(entry).length === 2 && entry.level === level && recordObject(entry.rolls), 'pending level');
        assert(Object.keys(entry.rolls).length === ATTRIBUTES.length && ATTRIBUTES.every(key => Number.isSafeInteger(entry.rolls[key]) && entry.rolls[key] >= 1 && entry.rolls[key] <= 5 && entry.rolls[key] === levelRolls(person.seed, level)[key]), 'level rolls');
      }
    }
    const member = normalizeMember(person);
    assert(Number.isSafeInteger(member.level) && member.level >= 1 && member.level <= 20, 'person level');
    assert(validCount(member.xp) && member.xp < member.level * 50 && validCount(member.trainingPoints) && member.trainingPoints <= 20, 'person experience');
    assert(recordObject(person.attributes ?? {}) && Object.keys(person.attributes ?? {}).every(key => ATTRIBUTES.includes(key)), 'person attributes');
    for (const key of ATTRIBUTES) assert(validCount(member.attributes[key]) && member.attributes[key] <= 1000, `person ${key}`);
    assert(validCount(member.armorDurability.body) && member.armorDurability.body <= armorMaximum(person.equipment.armor), 'body durability');
    assert(validCount(member.armorDurability.head) && member.armorDurability.head <= armorMaximum(person.equipment.helmet), 'head durability');
    assert(validCount(person.hp) && person.hp >= 1 && person.hp <= getCompanyStats(member).maxHp, 'person hp');
  }
  const camps = input.camps === undefined ? {} : input.camps;
  assert(recordObject(camps) && Object.keys(camps).every(id => CAMP_BY_ID.has(id)), 'camps');
  for (const entry of Object.values(camps)) assert(recordObject(entry) && (entry.clearedDay === null || Number.isSafeInteger(entry.clearedDay) && entry.clearedDay >= 1 && entry.clearedDay <= input.day), 'camp state');
  const bands = input.bands === undefined ? {} : input.bands;
  assert(recordObject(bands) && Object.keys(bands).every(id => BAND_BY_ID.has(id)), 'bands');
  for (const entry of Object.values(bands)) assert(recordObject(entry) && Number.isFinite(entry.defeatedUntil) && entry.defeatedUntil >= 0 && entry.defeatedUntil <= worldHours(input) + 48, 'band respawn');
  const pursuit = input.pursuit === undefined ? null : input.pursuit;
  assert(pursuit === null || BAND_BY_ID.has(pursuit) && input.destination !== null && (bands[pursuit]?.defeatedUntil ?? 0) <= worldHours(input), 'pursuit');
  const battle = validateBattle(input.battle, input.party);
  assert(!battle || battle.tactic === tactic, 'battle tactic');
  assert(!battle || input.destination === null && pursuit === null && (battle.encounterType === 'band' ? (bands[battle.campId]?.defeatedUntil ?? 0) <= worldHours(input) : !camps[battle.campId]?.clearedDay), 'battle location');
  assert(!gameOver || input.party.length === 0 && battle === null, 'game over state');
  assert(Array.isArray(input.visited) && input.visited.length <= SETTLEMENTS.length && input.visited.every(id => TOWN_BY_ID.has(id)) && new Set(input.visited).size === input.visited.length, 'visited settlements');
  assert(Array.isArray(input.log) && input.log.length <= MAX_LOG && input.log.every(entry => typeof entry === 'string' && entry.length <= 500), 'log');
  if (input.contract !== null) {
    const contract = input.contract;
    assert(contract && typeof contract === 'object' && !Array.isArray(contract), 'contract');
    assert(typeof contract.id === 'string' && contract.id.length <= 24 && /^delivery-[1-9]\d*$/.test(contract.id) && Number(contract.id.slice(9)) <= input.contractSerial, 'contract id');
    assert(TOWN_BY_ID.has(contract.from) && TOWN_BY_ID.has(contract.to), 'contract route');
    assert(validCount(contract.reward) && contract.reward > 0 && contract.reward <= 5000, 'contract reward');
    assert(Number.isSafeInteger(contract.acceptedDay) && contract.acceptedDay >= 1 && contract.acceptedDay <= input.day, 'contract day');
    assert(contract.type === undefined || ['courier', 'supply', 'hunt'].includes(contract.type), 'contract type');
    assert(contract.renown === undefined || contract.renown === 1 || contract.renown === 2, 'contract renown');
    if (contract.type === 'supply') assert(GOOD_BY_ID.has(contract.goodId) && validQuantity(contract.quantity, MAX_CARGO), 'supply requirement');
    if (contract.type === 'hunt') assert(CAMP_BY_ID.has(contract.campId) && contract.from === contract.to, 'hunt requirement');
    else assert(contract.from !== contract.to, 'contract route');
  }
  const inventory = [...input.inventory];
  const conditions = [...inventoryCondition];
  const party = input.party.map(person => normalizeMember({
    id: person.id, name: person.name, background: person.background, seed: person.seed,
    hp: person.hp, morale: person.morale,
    equipment: Object.fromEntries(SLOTS.map(slot => [slot, person.equipment[slot]])),
    level: person.level, xp: person.xp, trainingPoints: person.trainingPoints,
    pendingLevelUps: person.pendingLevelUps,
    attributes: person.attributes ? { ...person.attributes } : undefined,
    armorDurability: person.armorDurability ? { body: person.armorDurability.body, head: person.armorDurability.head } : undefined,
  }));
  for (const person of party) {
    if (ITEM_BY_ID.get(person.equipment.weapon)?.twoHanded && person.equipment.shield) {
      assert(battle === null && inventory.length < MAX_INVENTORY, 'legacy bow and shield');
      inventory.push(person.equipment.shield);
      conditions.push(null);
      person.equipment.shield = null;
    }
  }
  // Return a new plain state so callers cannot mutate the imported object through aliases.
  return {
    version: 1, seed: input.seed, day: input.day, hour: input.hour,
    gold: input.gold, food: input.food, renown: input.renown,
    party,
    inventory, inventoryCondition: conditions, cargo: { ...cargo }, supplies: { ...supplies },
    marketStock: Object.fromEntries(Object.entries(markets).map(([id, market]) => [id, { day: market.day, food: market.food, goods: { ...market.goods }, equipment: { ...defaultMarketStock({ seed: input.seed, day: market.day }, TOWN_BY_ID.get(id)).equipment, ...market.equipment }, supplies: market.supplies ? { ...market.supplies } : Object.fromEntries(Object.entries(SUPPLY_INFO).map(([kind, info]) => [kind, info.stock])) }])),
    camps: Object.fromEntries(Object.entries(camps).map(([id, entry]) => [id, { clearedDay: entry.clearedDay }])),
    bands: Object.fromEntries(Object.entries(bands).map(([id, entry]) => [id, { defeatedUntil: entry.defeatedUntil }])), pursuit, tactic,
    battle, gameOver,
    position: { x: input.position.x, y: input.position.y },
    destination: input.destination ? { x: input.destination.x, y: input.destination.y } : null,
    contract: input.contract ? { id: input.contract.id, type: input.contract.type ?? 'courier', from: input.contract.from, to: input.contract.to, reward: input.contract.reward, renown: input.contract.renown ?? 1, ...(input.contract.type === 'supply' ? { goodId: input.contract.goodId, quantity: input.contract.quantity } : {}), ...(input.contract.type === 'hunt' ? { campId: input.contract.campId } : {}), acceptedDay: input.contract.acceptedDay } : null,
    contractSerial: input.contractSerial, recruitSerial: input.recruitSerial,
    log: [...input.log], visited: [...input.visited],
  };
}
