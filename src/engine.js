// Pure game rules for the offline overworld. The UI owns rendering and real time.
import { createBattleField, legacyBattleField, tileAt, hexDistance, hexNeighbors, movementCost, heightHitModifier, rangedCoverModifier } from './battle-terrain.js';
import { ADDITIONAL_ITEMS } from './additional-items.js';
import { MOUNTS } from './mounts.js';
import { enemyProgression } from './enemy-progression.js';
import { getRegionalEnemyFaction, getRegionalEnemyTemplates, getRegionalCampText } from './enemy-rosters.js';
import { PERKS, PERK_BY_ID, hasPerk } from './perks.js';
import { RECRUIT_BACKGROUND_BY_ID, RECRUIT_TRAIT_BY_ID, makeRecruitProfile } from './recruits.js';
import { scheduledTownEvent, townEventHash, townEventModifiers } from './town-events.js';
import { CARAVAN_ATTACK_WARNING_HOURS, CARAVAN_SHORTAGE_HOURS, CARAVAN_TRAVEL_HOURS, routeSegmentDistance, shipmentId, shipmentPlan, shipmentPosition } from './caravans.js';

export { PERKS } from './perks.js';

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
  { id: 'rondel-dagger', name: 'Rondel Dagger', slot: 'weapon', visual: 'dagger', price: 135, power: 12, damageMin: 12, damageMax: 19, hitBonus: 12, armorDamage: .45, armorPiercing: .75, pocketWeapon: true, description: 'A narrow point seeking gaps in armor.' },
  { id: 'billhook', name: 'Billhook', slot: 'weapon', visual: 'billhook', price: 235, power: 22, damageMin: 22, damageMax: 34, hitBonus: 0, armorDamage: 1.25, range: 2, twoHanded: true, fatigueCost: 15, description: 'A hooked polearm that strikes from behind the line.' },
  { id: 'hunting-bow', name: 'Hunting Bow', slot: 'weapon', visual: 'bow', price: 185, power: 17, damageMin: 16, damageMax: 26, hitBonus: 0, armorDamage: .6, range: 4, ranged: true, twoHanded: true, description: 'A springy yew bow with a bundle of arrows.' },
  { id: 'light-crossbow', name: 'Light Crossbow', slot: 'weapon', visual: 'crossbow', price: 285, power: 27, damageMin: 25, damageMax: 38, hitBonus: 8, armorDamage: 1.2, armorPiercing: .45, range: 5, ranged: true, twoHanded: true, reloadTurns: 1, description: 'A hard shot that must be reloaded after firing.' },
  { id: 'buckler', name: 'Buckler', slot: 'shield', visual: 'round', price: 60, armor: 6, defense: 8, fatigue: 2, description: 'Light protection for a quick fighter.' },
  { id: 'round-shield', name: 'Round Shield', slot: 'shield', visual: 'round', price: 120, armor: 12, defense: 13, fatigue: 5, description: 'Wood and iron across the forearm.' },
  { id: 'kite-shield', name: 'Kite Shield', slot: 'shield', visual: 'kite', price: 220, armor: 20, defense: 18, fatigue: 8, description: 'Broad cover for a crowded road.' },
  ...ADDITIONAL_ITEMS,
  ...MOUNTS,
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
  { id: 'pinecross', name: 'Pinecross', x: 1290, y: 350, kind: 'town', description: 'A timber market at the edge of the eastern pinewoods.', color: '#a9bb87' },
  { id: 'dunridge', name: 'Dunridge', x: 1660, y: 175, kind: 'fort', description: 'A fortified pass above the northern trade road.', color: '#bab6a6' },
  { id: 'eastmere', name: 'Eastmere', x: 1960, y: 560, kind: 'city', description: 'A busy caravan city beyond the reed marshes.', color: '#d1ae72' },
  { id: 'stonebridge', name: 'Stonebridge', x: 1440, y: 735, kind: 'town', description: 'Smiths and toll keepers share the old stone crossing.', color: '#b7ae99' },
  { id: 'southwatch', name: 'Southwatch', x: 420, y: 1010, kind: 'fort', description: 'A southern refuge among the wooded hills.', color: '#aaa98b' },
  { id: 'wheatmere', name: 'Wheatmere', x: 820, y: 1230, kind: 'village', description: 'Wide grain fields feed the southern frontier.', color: '#d5bf78' },
  { id: 'blackfen', name: 'Blackfen', x: 1230, y: 1135, kind: 'village', description: 'Reed cutters and hunters live above the black water.', color: '#9cae84' },
  { id: 'farhold', name: 'Farhold', x: 1860, y: 1180, kind: 'fort', description: 'The last stronghold on a road haunted by veteran raiders.', color: '#c9a28e' },
]);

const CAMP_SITES = Object.freeze([
  { id: 'quarry-camp', name: 'Brigand Camp', x: 440, y: 520, difficulty: 1, description: 'Three desperate raiders shelter in an abandoned quarry.', reward: 110, enemies: [
    { name: 'Brigand Thug', weapon: 'wood-axe', armor: 'patched-coat', helmet: null, shield: null },
    { name: 'Brigand Thug', weapon: 'spear', armor: 'patched-coat', helmet: null, shield: null },
    { name: 'Brigand Poacher', weapon: 'hunting-bow', armor: null, helmet: 'cloth-hood', shield: null },
  ] },
  { id: 'watchtower-camp', name: 'Ruined Watchtower', x: 820, y: 285, difficulty: 2, description: 'A band of raiders holds the broken tower above the road.', reward: 210, enemies: [
    { name: 'Brigand Raider', weapon: 'arming-sword', armor: 'leather-vest', helmet: 'leather-cap', shield: 'buckler' },
    { name: 'Brigand Raider', weapon: 'falchion', armor: 'quilted-jack', helmet: null, shield: 'round-shield' },
    { name: 'Brigand Thug', weapon: 'spear', armor: 'patched-coat', helmet: null, shield: null },
    { name: 'Brigand Poacher', weapon: 'hunting-bow', armor: 'patched-coat', helmet: 'cloth-hood', shield: null },
  ] },
  { id: 'hideout', name: 'Brigand Hideout', x: 1040, y: 550, difficulty: 3, description: 'Veteran raiders have fortified the old timber works.', reward: 360, enemies: [
    { name: 'Brigand Leader', weapon: 'winged-mace', armor: 'mail-shirt', helmet: 'iron-helm', shield: 'kite-shield' },
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
  { id: 'pinewood-poachers', name: 'Pinewood Poachers', difficulty: 1, start: { x: 1200, y: 410 }, end: { x: 1410, y: 550 } },
  { id: 'east-road-reavers', name: 'East Road Reavers', difficulty: 2, start: { x: 1500, y: 715 }, end: { x: 1810, y: 610 } },
  { id: 'saltmarsh-waylayers', name: 'Saltmarsh Waylayers', difficulty: 1, start: { x: 300, y: 735 }, end: { x: 400, y: 960 } },
  { id: 'southern-deserters', name: 'Southern Deserters', difficulty: 1, start: { x: 520, y: 920 }, end: { x: 740, y: 1100 } },
  { id: 'fen-reavers', name: 'Fen Reavers', difficulty: 2, start: { x: 1130, y: 1020 }, end: { x: 1430, y: 1220 } },
  { id: 'frontier-veterans', name: 'Frontier Veterans', difficulty: 3, start: { x: 1740, y: 900 }, end: { x: 1990, y: 1130 } },
  { id: 'greyhaven-rabble', name: 'Greyhaven Rabble', difficulty: 1, start: { x: 455, y: 235 }, end: { x: 690, y: 245 } },
  { id: 'ironford-extortionists', name: 'Ironford Extortionists', difficulty: 2, start: { x: 720, y: 330 }, end: { x: 940, y: 345 } },
  { id: 'redmere-skirmishers', name: 'Redmere Skirmishers', difficulty: 2, start: { x: 820, y: 675 }, end: { x: 1080, y: 700 } },
  { id: 'thornwall-outlaws', name: 'Thornwall Outlaws', difficulty: 2, start: { x: 950, y: 180 }, end: { x: 1210, y: 235 } },
  { id: 'highpass-marauders', name: 'Highpass Marauders', difficulty: 3, start: { x: 650, y: 95 }, end: { x: 930, y: 135 } },
  { id: 'barrowfield-robbers', name: 'Barrowfield Robbers', difficulty: 1, start: { x: 540, y: 680 }, end: { x: 740, y: 790 } },
  { id: 'pinecross-deserters', name: 'Pinecross Deserters', difficulty: 2, start: { x: 1120, y: 300 }, end: { x: 1450, y: 265 } },
  { id: 'dunridge-lancers', name: 'Dunridge Lancers', difficulty: 3, start: { x: 1440, y: 125 }, end: { x: 1810, y: 255 } },
  { id: 'eastmere-freeblades', name: 'Eastmere Freeblades', difficulty: 3, start: { x: 1740, y: 440 }, end: { x: 2050, y: 690 } },
  { id: 'stonebridge-tollmen', name: 'Stonebridge Tollmen', difficulty: 2, start: { x: 1280, y: 690 }, end: { x: 1600, y: 790 } },
  { id: 'southwatch-raiders', name: 'Southwatch Raiders', difficulty: 2, start: { x: 280, y: 900 }, end: { x: 560, y: 1120 } },
  { id: 'wheatmere-pillagers', name: 'Wheatmere Pillagers', difficulty: 2, start: { x: 680, y: 1140 }, end: { x: 1030, y: 1300 } },
  { id: 'blackfen-stalkers', name: 'Blackfen Stalkers', difficulty: 3, start: { x: 1060, y: 1040 }, end: { x: 1390, y: 1300 } },
  { id: 'farhold-warbands', name: 'Farhold Warband', difficulty: 3, start: { x: 1580, y: 1080 }, end: { x: 2070, y: 1280 } },
]);

const ITEM_BY_ID = new Map(ITEMS.map(item => [item.id, item]));
const FAMED_ID = /^famed:([a-z0-9-]{1,40}):(0|[1-9][0-9]{0,9})$/;
const FAMED_NAMES = ['Ashen', 'Blackthorn', 'Dawnward', 'Grimwolf', 'Ironbound', 'Oathkeeper', 'Ravenmark', 'Stormborn', 'Thornheart', 'Wolfguard'];

export function createFamedItemId(baseId, seed) {
  if (!ITEM_BY_ID.has(baseId) || ['accessory', 'mount'].includes(ITEM_BY_ID.get(baseId).slot) || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new TypeError('Invalid famed item base or seed.');
  return `famed:${baseId}:${seed}`;
}

export function getItem(id) {
  const base = ITEM_BY_ID.get(id);
  if (base) return base;
  if (typeof id !== 'string' || id.length > 80) return undefined;
  const match = FAMED_ID.exec(id);
  if (!match) return undefined;
  const original = ITEM_BY_ID.get(match[1]);
  const seed = Number(match[2]);
  if (!original || ['accessory', 'mount'].includes(original.slot) || !Number.isSafeInteger(seed) || seed > 0xffffffff) return undefined;
  const roll = shift => (seed >>> shift) & 15;
  const bonuses = [];
  const item = { ...original, id, baseId: original.id, rarity: 'famed' };
  if (original.slot === 'armor' || original.slot === 'helmet') {
    const gain = Math.max(8, Math.round(original.armor * (.15 + roll(0) / 100)));
    item.armor = Math.min(500, original.armor + gain);
    item.fatigue = Math.max(0, (original.fatigue ?? 0) - (1 + roll(4) % 3));
    bonuses.push({ label: 'Protection', value: `+${item.armor - original.armor}` });
    if (item.fatigue < original.fatigue) bonuses.push({ label: 'Fatigue cost', value: `-${original.fatigue - item.fatigue}` });
  } else if (original.slot === 'shield') {
    item.defense = (original.defense ?? 0) + 2 + roll(0) % 4;
    item.fatigue = Math.max(0, (original.fatigue ?? 0) - (1 + roll(4) % 3));
    bonuses.push({ label: 'Melee and ranged defense', value: `+${item.defense - original.defense}` });
    if (item.fatigue < original.fatigue) bonuses.push({ label: 'Fatigue cost', value: `-${original.fatigue - item.fatigue}` });
  } else {
    const low = 2 + roll(0) % 5;
    const high = low + 1 + roll(4) % 3;
    item.damageMin = original.damageMin + low;
    item.damageMax = original.damageMax + high;
    item.hitBonus = (original.hitBonus ?? 0) + 2 + roll(8) % 7;
    item.armorDamage = Math.round(((original.armorDamage ?? 1) + .1 + roll(12) % 3 * .05) * 100) / 100;
    bonuses.push({ label: 'Damage', value: `+${low} to +${high}` }, { label: 'Hit modifier', value: `+${item.hitBonus - (original.hitBonus ?? 0)}` }, { label: 'Armor damage', value: `+${Math.round((item.armorDamage - (original.armorDamage ?? 1)) * 100)}%` });
  }
  item.price = Math.min(5000, Math.round(original.price * 2.4 + (original.slot === 'armor' || original.slot === 'helmet' ? item.armor - original.armor : 0)));
  item.name = `${FAMED_NAMES[seed % FAMED_NAMES.length]} ${original.name}`;
  item.description = `A rare, finely worked ${original.name.toLowerCase()}. ${original.description}`;
  item.bonuses = Object.freeze(bonuses.map(bonus => Object.freeze(bonus)));
  return Object.freeze(item);
}
const NEW_ITEM_IDS = new Set(['bludgeon', 'rondel-dagger', 'light-crossbow', 'billhook', 'padded-gambeson', 'reinforced-mail', 'bascinet', ...ADDITIONAL_ITEMS.map(item => item.id), ...MOUNTS.map(item => item.id)]);
const GOOD_BY_ID = new Map(GOODS.map(good => [good.id, good]));
const TOWN_BY_ID = new Map(SETTLEMENTS.map(town => [town.id, town]));
const CAMP_BY_ID = new Map(CAMP_SITES.map(camp => [camp.id, camp]));
const RANDOM_CAMP_IDS = Array.from({ length: 12 }, (_, index) => `wild-camp-${index + 1}`);
const isCampId = id => CAMP_BY_ID.has(id) || RANDOM_CAMP_IDS.includes(id);
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
  pinecross:  { grain: 1.05, timber: .60, iron: 1.35, salt: 1.20, wool: 1.10 },
  dunridge:   { grain: 1.45, timber: 1.30, iron: .78, salt: 1.40, wool: 1.20 },
  eastmere:   { grain: 1.20, timber: 1.35, iron: 1.10, salt: .75, wool: .85 },
  stonebridge:{ grain: 1.15, timber: 1.05, iron: .72, salt: 1.15, wool: 1.20 },
  southwatch: { grain: 1.25, timber: .82, iron: 1.15, salt: 1.35, wool: 1.10 },
  wheatmere:  { grain: .60, timber: 1.15, iron: 1.40, salt: 1.25, wool: .75 },
  blackfen:   { grain: 1.10, timber: .80, iron: 1.30, salt: .70, wool: 1.30 },
  farhold:    { grain: 1.50, timber: 1.35, iron: 1.25, salt: 1.40, wool: 1.45 },
};
const GEAR_FACTORS = { oakwatch: 1, greyhaven: 1.05, ironford: .84, thornwall: 1.16, redmere: 1.08, highpass: 1.20, saltwick: 1.12, barrowfield: .96, pinecross:1.04, dunridge:1.12, eastmere:.98, stonebridge:.88, southwatch:1.08, wheatmere:1.02, blackfen:1.15, farhold:1.22 };
const SLOTS = ['armor', 'helmet', 'weapon', 'shield', 'mount'];
export const WORLD_BOUNDS = Object.freeze({ minX: 180, maxX: 2120, minY: 80, maxY: 1380 });
const BOUNDS = WORLD_BOUNDS;
const TOWN_RADIUS = 28;
const ARRIVAL_RADIUS = 2;
const SPEED = 55;
const MAX_LOG = 30;
const MAX_INVENTORY = 512;
const MAX_CARGO = 30;
export const MAX_COMPANY_SIZE = 12;
const CAMP_RADIUS = 35;
const BAND_RADIUS = 28;
const BAND_AGGRO_RADIUS = 120;
const BAND_CHASE_LEASH = 260;
const BAND_PATROL_SPEED = 7;
const BAND_CHASE_SPEED = 42;
const BAND_RAID_SPEED = 36;
const CARAVAN_CONTACT_RADIUS = 10;
const ENCOUNTER_GRACE_HOURS = 1.5;
const WORLD_STEP_HOURS = .25;
const SUPPLY_INFO = {
  tools: { name: 'Tools', buyPrice: 18, stock: 8 },
  medicine: { name: 'Medicine', buyPrice: 30, stock: 6 },
  ammo: { name: 'Ammunition', buyPrice: 4, stock: 30 },
};
const ATTRIBUTES = ['maxHp', 'meleeSkill', 'rangedSkill', 'meleeDefense', 'rangedDefense', 'maxFatigue', 'initiative', 'resolve'];
const TACTICS = ['offense', 'defense', 'focus', 'advance-formation', 'shield-wall'];
const FORMATION_DIRECTIONS = { e: [1, 0], ne: [1, -1], se: [0, 1], w: [-1, 0], sw: [-1, 1], nw: [0, -1] };

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
const FRONT_FORMATION = [2, 3, 1, 4, 0, 5];
const REAR_FORMATION = [8, 9, 7, 10, 6, 11];

function seedFormation(party) {
  const slots = Array(12).fill(null);
  const ranged = party.filter(person => getItem(person.equipment?.weapon)?.ranged === true);
  const melee = party.filter(person => !ranged.includes(person));
  for (const person of [...melee, ...ranged]) {
    const preferred = ranged.includes(person) ? [...REAR_FORMATION, ...FRONT_FORMATION] : [...FRONT_FORMATION, ...REAR_FORMATION];
    slots[preferred.find(index => slots[index] === null)] = person.id;
  }
  return slots;
}

export function getFormation(state) {
  return [...(state.formation ?? seedFormation(state.party))];
}

export function moveFormation(state, fromIndex, toIndex) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  if (!Number.isSafeInteger(fromIndex) || !Number.isSafeInteger(toIndex) || fromIndex < 0 || fromIndex >= 12 || toIndex < 0 || toIndex >= 12) return result(false, 'Choose two formation slots.');
  const formation = getFormation(state);
  if (!formation[fromIndex]) return result(false, 'Select a company member to move.');
  [formation[fromIndex], formation[toIndex]] = [formation[toIndex], formation[fromIndex]];
  state.formation = formation;
  const message = 'Company formation updated.';
  record(state, message);
  return result(true, message);
}
function armorMaximum(itemId) { return getItem(itemId)?.armor ?? 0; }
function itemCondition(itemId) { return ['armor', 'helmet'].includes(getItem(itemId)?.slot) ? armorMaximum(itemId) : null; }
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
    equipment: { ...person.equipment, mount: person.equipment.mount ?? null },
    traits: [...(person.traits ?? [])],
    reserveEquipment: { weapon: person.reserveEquipment?.weapon ?? null, shield: person.reserveEquipment?.shield ?? null },
    accessories: [...(person.accessories ?? [null, null])],
    level,
    xp: person.xp ?? 0,
    perks: [...(person.perks ?? [])],
    trainingPoints: pendingLevelUps.length,
    pendingLevelUps,
    attributes: { ...Object.fromEntries(ATTRIBUTES.map(key => [key, 0])), ...person.attributes },
    armorDurability: {
      body: person.armorDurability?.body ?? armorMaximum(person.equipment.armor),
      head: person.armorDurability?.head ?? armorMaximum(person.equipment.helmet),
    },
  };
}

const LEGACY_BACKGROUND_INFO = Object.freeze({
  Captain: Object.freeze({ role: 'leader', description: 'A proven company leader with strong close-combat instincts and resolve.', bonuses: Object.freeze({ meleeSkill: 9, resolve: 10 }) }),
  Scout: Object.freeze({ role: 'ranged', description: 'An experienced pathfinder who spots danger and acts early.', bonuses: Object.freeze({ rangedSkill: 13, rangedDefense: 3, initiative: 10 }) }),
  Guard: Object.freeze({ role: 'frontline', description: 'A dependable shield hand trained to hold the line.', bonuses: Object.freeze({ maxHp: 5, meleeSkill: 6, meleeDefense: 3 }) }),
  'Caravan Guard': Object.freeze({ role: 'frontline', description: 'A road guard accustomed to close ambushes and long marches.', bonuses: Object.freeze({ maxHp: 5, meleeSkill: 6, meleeDefense: 3 }) }),
  Hunter: Object.freeze({ role: 'ranged', description: 'A practiced tracker with a sharp eye and quick reactions.', bonuses: Object.freeze({ rangedSkill: 13, rangedDefense: 3, initiative: 10 }) }),
  Outrider: Object.freeze({ role: 'ranged', description: 'A swift advance scout comfortable fighting at range.', bonuses: Object.freeze({ rangedSkill: 13, rangedDefense: 3, initiative: 10 }) }),
});

function exposedRecruitEntry(entry) {
  return entry ? { ...entry, bonuses: { ...entry.bonuses }, ...(entry.role ? { bio: entry.description } : {}) } : null;
}

export function getBackground(person) {
  const defined = RECRUIT_BACKGROUND_BY_ID.get(person?.backgroundId);
  if (defined) return exposedRecruitEntry(defined);
  const name = typeof person?.background === 'string' ? person.background : '';
  if (!name) return null;
  const legacy = LEGACY_BACKGROUND_INFO[name];
  const description = legacy?.description ?? `A seasoned ${name.toLowerCase()} with no special stat modifier.`;
  return {
    id: null,
    name,
    role: legacy?.role ?? 'support',
    bio: description,
    description,
    bonuses: { ...(legacy?.bonuses ?? {}) },
  };
}

export function getTraits(person) {
  return (person?.traits ?? []).map(id => exposedRecruitEntry(RECRUIT_TRAIT_BY_ID.get(id))).filter(Boolean);
}

function recruitBonuses(person) {
  const entries = [RECRUIT_BACKGROUND_BY_ID.get(person.backgroundId), ...(person.traits ?? []).map(id => RECRUIT_TRAIT_BY_ID.get(id))].filter(Boolean);
  const bonuses = {};
  for (const entry of entries) for (const [key, value] of Object.entries(entry.bonuses)) bonuses[key] = (bonuses[key] ?? 0) + value;
  return bonuses;
}

export function getCompanyStats(person) {
  const attributes = person.attributes ?? {};
  const level = person.level ?? 1;
  const background = person.background ?? '';
  const recruit = recruitBonuses(person);
  const equipped = getEquipment(person);
  const mountHit = person.hp > 0 ? equipped.mount?.hitBonus ?? 0 : 0;
  const armorFatigue = (equipped.armor?.fatigue ?? 0) + (equipped.helmet?.fatigue ?? 0);
  const otherFatigue = (equipped.weapon?.fatigue ?? 0) + (equipped.shield?.fatigue ?? 0);
  const fatigue = otherFatigue + (hasPerk(person, 'brawny') ? Math.floor(armorFatigue * .7) : armorFatigue);
  const legacy = !person.backgroundId;
  const guard = legacy && (background === 'Guard' || background === 'Caravan Guard');
  const scout = legacy && (background === 'Scout' || background === 'Hunter' || background === 'Outrider');
  const captain = legacy && background === 'Captain';
  const baseMaxHp = 100 + (guard ? 5 : 0) + (attributes.maxHp ?? 0) + (recruit.maxHp ?? 0);
  const maxHp = hasPerk(person, 'colossus') ? Math.round(baseMaxHp * 1.25) : baseMaxHp;
  const maxBodyArmor = armorMaximum(person.equipment?.armor);
  const maxHeadArmor = armorMaximum(person.equipment?.helmet);
  const shieldDefense = equipped.shield?.defense ?? 0;
  const effectiveShieldDefense = (hasPerk(person, 'shield-expert') ? Math.ceil(shieldDefense * 1.25) : shieldDefense)
    + (shieldDefense && hasPerk(person, 'shield-bearer') ? 5 : 0);
  const initiative = Math.max(20, 105 + (scout ? 10 : 0) + (attributes.initiative ?? 0) + (recruit.initiative ?? 0) - fatigue);
  const dodgeDefense = hasPerk(person, 'dodge') ? Math.floor(initiative * .15) : 0;
  const nimbleDefense = armorFatigue <= 10 && hasPerk(person, 'nimble') ? 5 : 0;
  const baseResolve = 42 + (captain ? 10 : 0) + (attributes.resolve ?? 0) + (recruit.resolve ?? 0);
  return {
    maxHp,
    meleeSkill: 54 + (captain ? 9 : guard ? 6 : 0) + (person.seed % 7) + (attributes.meleeSkill ?? 0) + (recruit.meleeSkill ?? 0) + mountHit,
    rangedSkill: 40 + (scout ? 13 : 0) + (person.seed % 9) + (attributes.rangedSkill ?? 0) + (recruit.rangedSkill ?? 0) + mountHit,
    meleeDefense: 5 + (guard ? 3 : 0) + (attributes.meleeDefense ?? 0) + (recruit.meleeDefense ?? 0) + effectiveShieldDefense + dodgeDefense + nimbleDefense,
    rangedDefense: 5 + (scout ? 3 : 0) + (attributes.rangedDefense ?? 0) + (recruit.rangedDefense ?? 0) + effectiveShieldDefense + dodgeDefense + nimbleDefense,
    maxFatigue: Math.max(30, 100 + (attributes.maxFatigue ?? 0) + (recruit.maxFatigue ?? 0) - fatigue),
    initiative,
    resolve: hasPerk(person, 'fortified-mind') ? Math.ceil(baseResolve * 1.25) : baseResolve,
    level,
    xp: person.xp ?? 0,
    nextLevelXp: level * 50,
    trainingPoints: person.pendingLevelUps?.length ?? person.trainingPoints ?? 0,
    dailyWage: Math.max(1, 5 + level - 1 - Number(hasPerk(person, 'paymaster'))),
    bodyArmor: person.armorDurability?.body ?? maxBodyArmor,
    headArmor: person.armorDurability?.head ?? maxHeadArmor,
    maxBodyArmor,
    maxHeadArmor,
  };
}

export function getDailyFood(state) {
  return state.party.reduce((total, person) => total + 1 + (person.hp > 0 ? getItem(person.equipment?.mount)?.foodUpkeep ?? 0 : 0), 0);
}

export function getCompanyTravelBonus(state) {
  return state.party.reduce((total, person) => total + (person.hp > 0
    ? (getItem(person.equipment?.mount)?.travelBonus ?? 0) + (hasPerk(person, 'trailblazer') ? .05 : 0) : 0), 0);
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
    shipments: {},
    shipmentLegacyThroughDay: 0,
    supplies: { tools: 8, medicine: 5, ammo: 16 },
    camps: {},
    bands: {},
    pursuit: null,
    encounterGraceUntil: 0,
    tactic: 'offense',
    battle: null,
    gameOver: false,
    position: { x: 350, y: 460 },
    destination: null,
    destinationAction: null,
    contract: null,
    contractSerial: 0,
    recruitSerial: 0,
    hiredRecruitOffers: [],
    log: [],
    visited: ['oakwatch'],
  };
  state.bands = Object.fromEntries(ROAMING_BANDS.map(band => [band.id, initialBandProgress(state, band)]));
  state.party = state.party.map(normalizeMember);
  state.formation = seedFormation(state.party);
  advanceCaravans(state, worldHours(state));
  record(state, 'The Ashen Company gathers at Oakwatch. The road is yours.');
  return state;
}

export function terrainAt(x, y) {
  if (!inBounds(x, y)) return 'sea';
  if (Math.hypot(x - 615, y - 145) < 100 || Math.hypot(x - 1080, y - 455) < 85) return 'mountain';
  if (Math.hypot(x - 475, y - 445) < 95 || Math.hypot(x - 840, y - 235) < 120) return 'forest';
  if (Math.hypot(x - 865, y - 555) < 88) return 'marsh';
  if (Math.hypot((x - 1640) / 1.6, y - 290) < 145 || Math.hypot(x - 1660, (y - 1100) / 1.5) < 155 || Math.hypot(x - 590, y - 900) < 95) return 'mountain';
  if (Math.hypot(x - 1330, (y - 450) / 1.5) < 160 || Math.hypot((x - 640) / 1.5, y - 1050) < 150 || Math.hypot(x - 1870, y - 880) < 185) return 'forest';
  if (Math.hypot((x - 1230) / 1.4, y - 1120) < 155 || Math.hypot(x - 1920, y - 500) < 120) return 'marsh';
  return 'plains';
}

function terrainSpeed(terrain) {
  return SPEED * ({ plains: 1, forest: 0.64, mountain: 0.44, marsh: 0.55 }[terrain] ?? 1);
}

export function townAt(state) {
  return SETTLEMENTS.find(town => distance(state.position, town) <= TOWN_RADIUS) ?? null;
}

const ARMORY_ROTATION_DAYS = 7;

function armoryCycle(day) { return Math.floor((day - 1) / ARMORY_ROTATION_DAYS); }

export function getTownEvent(state, townId) {
  const town = TOWN_BY_ID.get(townId);
  if (!town) return null;
  const scheduled = scheduledTownEvent(state, town);
  const shipment = state.shipments?.[town.id];
  if (shipment?.status === 'lost' && worldHours(state) < shipment.resolvedHour + CARAVAN_SHORTAGE_HOURS) {
    const hours = shipment.resolvedHour + CARAVAN_SHORTAGE_HOURS - worldHours(state);
    const effects = ['Ordinary arms cost 20% more.', 'Armorers pay well for replacement arms, making imports profitable.', 'Armory stock is thin; basic supplies remain available.'];
    return { id: `${shipmentId(town.id, shipment.startDay)}:shortage`, type: 'arms-shortage', name: 'Arms Shortage',
      description: 'Raiders destroyed an incoming armorer wagon. Local smiths urgently need replacement gear.',
      effects, effectText: effects.join(' '), startDay: Math.floor(shipment.resolvedHour / 24) + 1,
      endDay: Math.floor((shipment.resolvedHour + CARAVAN_SHORTAGE_HOURS) / 24) + 1,
      daysRemaining: Math.ceil(hours / 24) };
  }
  if (shipment?.status === 'delivered') {
    const delivered = scheduledTownEvent({ seed: state.seed, day: shipment.startDay }, town);
    if (delivered?.type === 'armorer-shipment') {
      const expiryHour = Math.max(delivered.endDay * 24, shipment.resolvedHour + 48);
      if (worldHours(state) < expiryHour) return { ...delivered, endDay: Math.ceil(expiryHour / 24),
        daysRemaining: Math.ceil((expiryHour - worldHours(state)) / 24) };
    }
  }
  if (scheduled?.type !== 'armorer-shipment') return scheduled;
  if ((shipment?.startDay === scheduled.startDay && shipment.status === 'delivered')
    || (shipment?.startDay !== scheduled.startDay && (state.shipmentLegacyThroughDay ?? 0) >= scheduled.startDay)) return scheduled;
  const effects = ['A friendly armorer wagon is on the road.', 'Extra stock and its 10% discount begin only if it arrives.'];
  return { ...scheduled, type: 'armorer-shipment-en-route', name: 'Armorer Shipment En Route', description: 'A guarded wagon is carrying arms toward this settlement.',
    effects, effectText: effects.join(' '), status: shipment?.status ?? 'en-route' };
}

export function getTownEconomy(state) {
  const events = SETTLEMENTS.flatMap(town => {
    const event = getTownEvent(state, town.id);
    return event ? [{ town, ...event }] : [];
  });
  return {
    events,
    rumors: events.map(event => `${event.town.name}: ${event.name}. ${event.effectText}`),
  };
}

function goodPrices(state, town, good) {
  const modifiers = townEventModifiers(scheduledTownEvent(state, town));
  const eventFactor = (good.id === 'grain' ? modifiers.grainBuy : null) ?? modifiers.goodsBuy ?? 1;
  const baseBuyPrice = Math.max(1, Math.round(good.basePrice * MARKET_FACTORS[town.id][good.id]));
  const buyPrice = Math.max(1, Math.round(baseBuyPrice * eventFactor));
  const baseSellPrice = Math.max(1, Math.floor(baseBuyPrice * .75));
  const sellPrice = Math.max(1, Math.floor(baseSellPrice * (modifiers.goodsSell ?? (modifiers.goodsBuy ?? 1))));
  return { buyPrice, sellPrice };
}

function equipmentPrices(state, town, item) {
  const modifiers = townEventModifiers(getTownEvent(state, town.id));
  const ordinaryGear = item.rarity !== 'famed' && item.slot !== 'accessory';
  const baseBuyPrice = Math.max(1, Math.round(item.price * GEAR_FACTORS[town.id]));
  const buyPrice = Math.max(1, Math.round(baseBuyPrice * (ordinaryGear ? modifiers.equipmentBuy ?? 1 : 1)));
  const sellPrice = ordinaryGear && modifiers.equipmentSell
    ? Math.max(1, Math.min(buyPrice - 1, Math.max(
      Math.floor(baseBuyPrice * modifiers.equipmentSell),
      Math.ceil(Math.min(...SETTLEMENTS.filter(place => place.id !== town.id).map(place => Math.round(item.price * GEAR_FACTORS[place.id]))) * 1.05),
    ))) : Math.max(1, Math.floor(buyPrice / 2));
  return { buyPrice, sellPrice };
}

function rotatedItems(items, state, town, cycle, label) {
  return [...items].sort((a, b) => townEventHash(`${state.seed}:${town.id}:${cycle}:${label}:${a.id}`) - townEventHash(`${state.seed}:${town.id}:${cycle}:${label}:${b.id}`));
}

function defaultArmoryStock(state, town, cycle = armoryCycle(state.day)) {
  const equipment = Object.fromEntries(ITEMS.map(item => [item.id, 0]));
  const gear = ITEMS.filter(item => item.slot !== 'mount');
  const halfStock = (item, count, source) => Array.from({ length: count }, (_, copy) => {
    let roll = townEventHash(`${state.seed}:${town.id}:${cycle}:${source}:${item.id}:${copy}`);
    roll ^= roll >>> 16;
    roll = Math.imul(roll, 0x7feb352d);
    roll ^= roll >>> 15;
    return roll & 1;
  }).reduce((total, kept) => total + kept, 0);
  const common = gear.filter(item => item.price < 250);
  const better = gear.filter(item => item.price >= 250 && item.price < 450);
  const premium = gear.filter(item => item.price >= 450);
  for (const item of common) equipment[item.id] = halfStock(item, 1 + Number(townEventHash(`${state.seed}:${town.id}:${cycle}:common:${item.id}`) % 4 === 0), 'base');
  const betterSlots = town.kind === 'city' || town.kind === 'fort' ? 4 : town.kind === 'town' ? 3 : 2;
  const premiumSlots = town.kind === 'city' || town.kind === 'fort' ? 2 : town.kind === 'town' ? 1 : 0;
  for (const item of rotatedItems(better, state, town, cycle, 'better').slice(0, betterSlots)) equipment[item.id] = halfStock(item, 1, 'better');
  for (const item of rotatedItems(premium, state, town, cycle, 'premium').slice(0, premiumSlots)) equipment[item.id] = halfStock(item, 1, 'premium');
  if (['city', 'fort'].includes(town.kind) && townEventHash(`${state.seed}:${town.id}:${cycle}:mount-offer`) % 100 < 2) {
    const mount = MOUNTS[townEventHash(`${state.seed}:${town.id}:${cycle}:mount-kind`) % MOUNTS.length];
    equipment[mount.id] = 1;
  }
  return equipment;
}

function dailyMarketStock(state, town) {
  const modifiers = townEventModifiers(scheduledTownEvent(state, town));
  const goods = Object.fromEntries(GOODS.map(good => {
    const factor = MARKET_FACTORS[town.id][good.id];
    const adjustment = (good.id === 'grain' ? modifiers.grainStock : null) ?? modifiers.goodsStock ?? 0;
    const minimum = good.id === 'grain' && modifiers.grainStock < 0 ? 2 : 0;
    const stock = (factor <= .8 ? 8 : factor >= 1.3 ? 2 : 5) + hashSeed(`${state.seed}:${state.day}:${town.id}:${good.id}`) % 3 + adjustment;
    return [good.id, Math.max(minimum, stock)];
  }));
  const baseFood = 18 + (MARKET_FACTORS[town.id].grain <= .8 ? 12 : 0) + hashSeed(`${state.seed}:${state.day}:${town.id}:food`) % 6;
  const food = Math.max(modifiers.foodStock < 0 ? 12 : 0, baseFood + (modifiers.foodStock ?? 0));
  const supplies = Object.fromEntries(Object.entries(SUPPLY_INFO).map(([kind, info]) => [kind, info.stock + hashSeed(`${state.seed}:${state.day}:${town.id}:${kind}`) % 3]));
  return { food, goods, supplies };
}

function addShipmentStock(equipment, state, town, event, cycle) {
  const candidates = ITEMS.filter(item => item.slot !== 'mount' && item.price >= 250 && equipment[item.id] === 0);
  const count = town.kind === 'city' ? 4 : town.kind === 'fort' ? 3 : 2;
  for (const item of rotatedItems(candidates, state, town, cycle, event.id).slice(0, count)) {
    if (townEventHash(`${state.seed}:${town.id}:${event.id}:shipment:${item.id}`) % 2 === 0) equipment[item.id] += 1;
  }
}

function projectedMarketStock(state, town) {
  const existing = state.marketStock?.[town.id];
  const cycle = armoryCycle(state.day);
  const existingCycle = existing?.armoryCycle ?? (existing ? armoryCycle(existing.day) : -1);
  const daily = existing?.day === state.day
    ? { food: existing.food, goods: { ...existing.goods }, supplies: { ...(existing.supplies ?? Object.fromEntries(Object.entries(SUPPLY_INFO).map(([kind, info]) => [kind, info.stock]))) } }
    : dailyMarketStock(state, town);
  const replenished = defaultArmoryStock(state, town, cycle);
  const equipment = existing && existingCycle === cycle
    ? { ...Object.fromEntries(MOUNTS.map(item => [item.id, replenished[item.id]])), ...existing.equipment }
    : replenished;
  let appliedEventId = existing?.appliedEventId ?? null;
  const event = getTownEvent(state, town.id);
  const stockEvent = event?.type === 'armorer-shipment' ? event : null;
  if (stockEvent && appliedEventId !== stockEvent.id) {
    addShipmentStock(equipment, state, town, stockEvent, cycle);
    appliedEventId = stockEvent.id;
  }
  return {
    day: state.day,
    ...daily,
    equipment,
    armoryCycle: cycle,
    appliedEventId,
    buyback: (existing?.buyback ?? []).map(entry => ({ ...entry })),
  };
}

function marketStock(state, town) { return projectedMarketStock(state, town); }

function writableMarketStock(state, town) {
  if (!state.marketStock) state.marketStock = {};
  state.marketStock[town.id] = projectedMarketStock(state, town);
  return state.marketStock[town.id];
}

function visibleEquipmentStock(state, town, item, stock, event) {
  if (event?.type === 'arms-shortage' && item.rarity !== 'famed' && item.slot !== 'accessory' && item.price >= 250)
    return Math.max(0, stock - 1);
  if (item.rarity === 'famed' || event?.type !== 'militia-muster' || item.price < 250) return stock;
  return townEventHash(`${event.id}:${item.id}:reserved`) % 2 === 0 ? 0 : stock;
}

export function getMarket(state, townId) {
  const town = townAt(state);
  if (!town || (townId !== undefined && town.id !== townId)) return null;
  const stock = marketStock(state, town);
  const event = getTownEvent(state, town.id);
  const cycle = armoryCycle(state.day);
  const famedIds = new Set([...(stock.buyback ?? []).map(entry => entry.itemId), ...state.inventory.filter(id => getItem(id)?.rarity === 'famed')]);
  return {
    town,
    event,
    armory: {
      cycleStartDay: cycle * ARMORY_ROTATION_DAYS + 1,
      nextRestockDay: (cycle + 1) * ARMORY_ROTATION_DAYS + 1,
      daysUntilRestock: (cycle + 1) * ARMORY_ROTATION_DAYS + 1 - state.day,
      summary: 'Armory stock rotates weekly. Provisions, trade goods, and supplies restock daily.',
    },
    food: { buyPrice: Math.max(2, Math.round(5 * MARKET_FACTORS[town.id].grain * (townEventModifiers(event).foodBuy ?? 1))), stock: stock.food, owned: state.food },
    equipment: [
      ...ITEMS.map(item => ({ itemId: item.id, ...equipmentPrices(state, town, item), stock: visibleEquipmentStock(state, town, item, stock.equipment[item.id], event), owned: state.inventory.filter(id => id === item.id).length })),
      ...[...famedIds].map(itemId => {
        const offers = (stock.buyback ?? []).filter(entry => entry.itemId === itemId);
        return { itemId, ...equipmentPrices(state, town, getItem(itemId)), stock: offers.length, owned: state.inventory.filter(id => id === itemId).length, condition: offers[0]?.condition ?? null, famed: true, buyback: offers.length > 0 };
      }),
    ],
    goods: GOODS.map(good => ({ goodId: good.id, name: good.name, description: good.description, ...goodPrices(state, town, good), stock: stock.goods[good.id], owned: state.cargo?.[good.id] ?? 0 })),
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

function snapWorldStepClock(state) {
  const absolute = Math.round(worldHours(state) / WORLD_STEP_HOURS) * WORLD_STEP_HOURS;
  state.day = Math.floor(absolute / 24) + 1;
  state.hour = absolute - (state.day - 1) * 24;
}

function bandSpawnCycle(state, id) {
  const progress = state.bands?.[id];
  return progress?.spawnCycle ?? (progress ? 1 : 0);
}

function patrolProgressAt(state, band, now = worldHours(state)) {
  const length = distance(band.start, band.end);
  const period = length / BAND_PATROL_SPEED;
  const phase = ((now + hashSeed(band.id) % 11) / period) % 2;
  const fraction = phase <= 1 ? phase : 2 - phase;
  return {
    defeatedUntil: 0,
    spawnCycle: 0,
    x: band.start.x + (band.end.x - band.start.x) * fraction,
    y: band.start.y + (band.end.y - band.start.y) * fraction,
    direction: phase < 1 ? 1 : -1,
    behavior: 'patrolling',
    targetId: null,
  };
}

function initialBandProgress(state, band) {
  return patrolProgressAt(state, band);
}

function activeBandProgress(state, band) {
  return state.bands?.[band.id] ?? initialBandProgress(state, band);
}

function shipmentAttackBand(state, town, origin, startDay) {
  if (townEventHash(`${state.seed}:${town.id}:${startDay}:shipment-raid`) % 3 === 2) return null;
  const assigned = new Set(Object.values(state.shipments ?? {})
    .filter(shipment => shipment.status === 'en-route' || shipment.status === 'under-attack')
    .map(shipment => shipment.attackerId));
  return [...ROAMING_BANDS]
    .filter(band => routeSegmentDistance(origin, town, band.start, band.end) <= 180
      && !assigned.has(band.id)
      && (activeBandProgress(state, band).defeatedUntil ?? 0) <= worldHours(state)
      && activeBandProgress(state, band).behavior !== 'raiding-caravan')
    .sort((a, b) => routeSegmentDistance(origin, town, a.start, a.end) - routeSegmentDistance(origin, town, b.start, b.end)
      || distance(activeBandProgress(state, a), origin) - distance(activeBandProgress(state, b), origin)
      || a.id.localeCompare(b.id))[0] ?? null;
}

function caravanPositionFor(state, townId, shipment, hour = worldHours(state)) {
  const town = TOWN_BY_ID.get(townId);
  const plan = shipmentPlan(town, SETTLEMENTS, { startDay: shipment.startDay }, shipment.travelHours, shipment.travelStartHour);
  const origin = TOWN_BY_ID.get(plan.originId);
  return { ...shipmentPosition(plan, origin, town, shipment.resolvedHour ?? hour), plan, origin, town };
}

function caravanInContact(state, townId, shipment, hour = worldHours(state)) {
  if (!shipment.attackerId || bandSpawnCycle(state, shipment.attackerId) !== shipment.attackerSpawnCycle) return false;
  const band = BAND_BY_ID.get(shipment.attackerId);
  const progress = band && activeBandProgress(state, band);
  if (!progress || progress.defeatedUntil > hour) return false;
  return distance(progress, caravanPositionFor(state, townId, shipment, hour)) <= CARAVAN_CONTACT_RADIUS;
}

function advanceCaravans(state, toHour = worldHours(state)) {
  if (!state.shipments) state.shipments = {};
  for (const town of SETTLEMENTS) {
    const event = scheduledTownEvent(state, town);
    if (event?.type !== 'armorer-shipment' || event.startDay <= (state.shipmentLegacyThroughDay ?? 0)
      || state.shipments[town.id]?.startDay === event.startDay) continue;
    const plan = shipmentPlan(town, SETTLEMENTS, event);
    const origin = TOWN_BY_ID.get(plan.originId);
    const attacker = shipmentAttackBand(state, town, origin, event.startDay);
    state.shipments[town.id] = {
      startDay: event.startDay, originId: origin.id, status: 'en-route',
      travelHours: CARAVAN_TRAVEL_HOURS, travelStartHour: plan.departureHour,
      attackerId: attacker?.id ?? null, attackerSpawnCycle: attacker ? bandSpawnCycle(state, attacker.id) : null,
      attackHour: null,
      resolvedHour: null,
      raidCleared: false,
    };
    if (attacker) {
      const progress = activeBandProgress(state, attacker);
      progress.behavior = 'raiding-caravan';
      progress.targetId = plan.id;
    }
    record(state, `Armorer wagon leaves ${origin.name} for ${town.name}.`);
  }
  for (const [townId, shipment] of Object.entries(state.shipments)) {
    if (shipment.status === 'delivered' || shipment.status === 'lost') continue;
    const town = TOWN_BY_ID.get(townId);
    const { plan } = caravanPositionFor(state, townId, shipment, toHour);
    if (shipment.attackerId && (bandSpawnCycle(state, shipment.attackerId) !== shipment.attackerSpawnCycle
      || (state.bands?.[shipment.attackerId]?.defeatedUntil ?? 0) > toHour)) {
      shipment.status = 'en-route';
      shipment.attackerId = null;
      shipment.attackerSpawnCycle = null;
      shipment.attackHour = null;
      shipment.raidCleared = true;
      record(state, `The road to ${town.name} is safe again; its armorer wagon can continue.`);
    }
    const deadline = shipment.attackHour === null ? null : shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS;
    const contact = shipment.status === 'under-attack' && caravanInContact(state, townId, shipment, toHour);
    if (shipment.status === 'under-attack' && deadline !== null && toHour >= deadline && contact) {
      shipment.status = 'lost';
      shipment.resolvedHour = toHour;
      record(state, `Raiders destroy the armorer wagon bound for ${town.name}. Arms are scarce there for four days.`);
    } else if ((shipment.status === 'en-route' || shipment.status === 'under-attack' && !contact) && toHour >= plan.arrivalHour) {
      shipment.status = 'delivered';
      shipment.resolvedHour = plan.arrivalHour;
      shipment.attackerId = null;
      shipment.attackerSpawnCycle = null;
      shipment.attackHour = null;
      record(state, `Armorer wagon reaches ${town.name}; new gear is available at a discount.`);
    }
  }
}

export function getCaravans(state) {
  const now = worldHours(state);
  return Object.entries(state.shipments ?? {}).flatMap(([townId, shipment]) => {
    const town = TOWN_BY_ID.get(townId);
    if (!town || (shipment.resolvedHour !== null && now >= shipment.resolvedHour + CARAVAN_SHORTAGE_HOURS)) return [];
    const travelHours = shipment.travelHours ?? 30;
    const travelStartHour = shipment.travelStartHour ?? (shipment.startDay - 1) * 24;
    const plan = shipmentPlan(town, SETTLEMENTS, { startDay: shipment.startDay }, travelHours, travelStartHour);
    const origin = TOWN_BY_ID.get(plan.originId);
    const position = shipmentPosition(plan, origin, town, shipment.resolvedHour ?? now);
    const active = shipment.status === 'en-route' || shipment.status === 'under-attack';
    const attackerId = active && shipment.attackerId && bandSpawnCycle(state, shipment.attackerId) === shipment.attackerSpawnCycle
      && (state.bands?.[shipment.attackerId]?.defeatedUntil ?? 0) <= now ? shipment.attackerId : null;
    const attackHoursRemaining = shipment.status === 'under-attack' && attackerId
      ? Math.max(0, shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS - now) : null;
    const contact = active && attackerId ? caravanInContact(state, townId, { ...shipment, travelHours, travelStartHour }, now) : false;
    const description = shipment.status === 'delivered' ? `Delivered from ${origin.name} to ${town.name}.${getTownEvent(state, town.id)?.type === 'armorer-shipment' ? ' The armory has fresh stock.' : ''}`
      : shipment.status === 'lost' ? `Raiders destroyed the wagon bound for ${town.name}. Arms are scarce there.`
      : attackerId ? `${BAND_BY_ID.get(attackerId).name} are targeting this wagon from ${origin.name} to ${town.name}.`
      : `Friendly armorer wagon traveling from ${origin.name} to ${town.name}.`;
    return [{ id: plan.id, kind: 'caravan', name: `${town.name} Armorer Wagon`, ...position,
      originId: origin.id, destinationId: town.id, status: shipment.status,
      etaHours: active ? Math.max(0, plan.arrivalHour - now) : 0,
      attackerId, attackHoursRemaining, contact, resolvedHour: shipment.resolvedHour, description }];
  });
}

function roamingBand(state, band) {
  const progress = state.bands?.[band.id];
  if ((progress?.defeatedUntil ?? 0) > worldHours(state)) return null;
  const spawnCycle = bandSpawnCycle(state, band.id);
  let rosterSeed = hashSeed(`${state.seed}:${band.id}:${spawnCycle}:roster`);
  const random = () => { rosterSeed = (Math.imul(rosterSeed, 1664525) + 1013904223) >>> 0; return rosterSeed / 4294967296; };
  const tier = band.difficulty ?? 0;
  const progression = enemyProgression(state, tier);
  const strength = 1 + Math.floor(random() * 3);
  const count = tier === 0 ? strength === 1 ? 1 : 2 : tier === 1 ? 2 + Number(strength === 3) : tier === 2 ? 2 + strength : 3 + strength;
  const pool = tier ? getRegionalEnemyTemplates(band.start.x, band.start.y, tier) : band.enemies;
  const offset = Math.floor(random() * pool.length);
  const enemies = Array.from({ length: Math.min(12, count + progression.reinforcements) }, (_, index) => ({ ...pool[(index + offset) % pool.length] }));
  if (progression.cavalry && enemies.length) enemies[0].mount = rareEnemyMount(state.seed, band.id, spawnCycle);
  const position = activeBandProgress(state, band);
  const target = position.behavior === 'raiding-caravan' ? getCaravans(state).find(caravan => caravan.id === position.targetId
    && (caravan.status === 'en-route' || caravan.status === 'under-attack')) : null;
  const behavior = position.behavior === 'raiding-caravan' && !target ? 'patrolling' : position.behavior ?? 'patrolling';
  return {
    id: band.id, name: band.name, kind: 'band', difficulty: tier, strength, spawnCycle, veteranRank: progression.rank,
    ...(tier ? { factionId: getRegionalEnemyFaction(band.start.x, band.start.y).id, factionLabel: getRegionalEnemyFaction(band.start.x, band.start.y).label } : {}),
    x: position.x, y: position.y, behavior, targetId: behavior === 'raiding-caravan' ? position.targetId : null,
    enemies,
    description: target ? `These raiders are closing on the armorer wagon bound for ${TOWN_BY_ID.get(target.destinationId).name}. Defeat them before they reach it.`
      : position.behavior === 'hunting-company' ? 'These raiders have spotted the Ashen Company and are giving chase.'
      : tier ? `${enemies.length} armed raiders patrol the frontier. Scout their equipment before engaging.` : `${enemies.length} lightly equipped brigand${enemies.length === 1 ? ' roams' : 's roam'} the road. A good first fight for an untested company.`,
    reward: 0,
  };
}

export function getRoamingBands(state) { return ROAMING_BANDS.map(band => roamingBand(state, band)).filter(Boolean); }

function moveTowardPoint(progress, target, maximum) {
  const remaining = distance(progress, target);
  if (remaining <= maximum || remaining <= 1e-9) {
    progress.x = target.x;
    progress.y = target.y;
    return;
  }
  progress.x += (target.x - progress.x) * maximum / remaining;
  progress.y += (target.y - progress.y) * maximum / remaining;
}

function moveAlongPatrol(progress, band, maximum) {
  const dx = band.end.x - band.start.x;
  const dy = band.end.y - band.start.y;
  const length = Math.hypot(dx, dy);
  let fraction = Math.max(0, Math.min(1, ((progress.x - band.start.x) * dx + (progress.y - band.start.y) * dy) / (length * length)));
  let direction = progress.direction === -1 ? -1 : 1;
  const patrolPoint = { x: band.start.x + dx * fraction, y: band.start.y + dy * fraction };
  const returnDistance = distance(progress, patrolPoint);
  if (returnDistance > 1e-9) {
    moveTowardPoint(progress, patrolPoint, maximum);
    if (returnDistance >= maximum) return;
    maximum -= returnDistance;
  }
  fraction += direction * maximum / length;
  while (fraction < 0 || fraction > 1) {
    if (fraction > 1) { fraction = 2 - fraction; direction = -1; }
    else { fraction = -fraction; direction = 1; }
  }
  progress.x = band.start.x + dx * fraction;
  progress.y = band.start.y + dy * fraction;
  progress.direction = direction;
}

function companyInSanctuary(state) {
  return SETTLEMENTS.some(town => distance(state.position, town) <= TOWN_RADIUS);
}

function assignedShipment(state, bandId) {
  return Object.entries(state.shipments ?? {}).find(([, shipment]) =>
    (shipment.status === 'en-route' || shipment.status === 'under-attack')
      && shipment.attackerId === bandId
      && shipment.attackerSpawnCycle === bandSpawnCycle(state, bandId)) ?? null;
}

function advanceRoamingBands(state) {
  const now = worldHours(state);
  const sanctuary = companyInSanctuary(state);
  let contactId = null;
  for (const band of ROAMING_BANDS) {
    const progress = activeBandProgress(state, band);
    if (!state.bands?.[band.id]) state.bands[band.id] = progress;
    if (progress.defeatedUntil > now) continue;
    const shipmentEntry = assignedShipment(state, band.id);
    if (shipmentEntry) {
      const [townId, shipment] = shipmentEntry;
      const caravan = caravanPositionFor(state, townId, shipment, now);
      progress.behavior = 'raiding-caravan';
      progress.targetId = shipmentId(townId, shipment.startDay);
      moveTowardPoint(progress, caravan, BAND_RAID_SPEED * WORLD_STEP_HOURS);
      if (distance(progress, caravan) <= CARAVAN_CONTACT_RADIUS && shipment.attackHour === null) {
        shipment.status = 'under-attack';
        shipment.attackHour = now;
        record(state, `${band.name} reach the armorer wagon bound for ${caravan.town.name}. Intercept them within seven hours.`);
      }
      continue;
    }
    const separation = distance(progress, state.position);
    const canHunt = !sanctuary && now >= (state.encounterGraceUntil ?? 0)
      && (separation <= BAND_AGGRO_RADIUS || progress.behavior === 'hunting-company' && separation <= BAND_CHASE_LEASH);
    if (canHunt) {
      progress.behavior = 'hunting-company';
      progress.targetId = null;
      moveTowardPoint(progress, state.position, BAND_CHASE_SPEED * WORLD_STEP_HOURS);
      if (distance(progress, state.position) <= BAND_RADIUS && contactId === null) contactId = band.id;
    } else {
      progress.behavior = 'patrolling';
      progress.targetId = null;
      moveAlongPatrol(progress, band, BAND_PATROL_SPEED * WORLD_STEP_HOURS);
    }
  }
  return contactId;
}

function startHostileContact(state, bandId) {
  state.destination = null;
  state.destinationAction = null;
  state.pursuit = null;
  return startBattle(state, bandId);
}

export function getEncounterSites(state) { return [...getCampSites(state), ...getRoamingBands(state)]; }

export function pursueBand(state, id) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const band = getRoamingBands(state).find(entry => entry.id === id);
  if (!band) return result(false, 'That band is no longer on the road.');
  state.destinationAction = null;
  if (distance(state.position, band) <= BAND_RADIUS) {
    state.destination = null;
    state.pursuit = null;
    return startBattle(state, id);
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
  state.destinationAction = null;
  state.destination = { x, y };
  const town = SETTLEMENTS.find(place => distance(place, state.destination) <= TOWN_RADIUS);
  const message = town ? `Traveling to ${town.name}.` : 'Traveling across the wilds.';
  record(state, message);
  return result(true, message);
}

export function activateMapTarget(state, type, id) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  if (type === 'band') return pursueBand(state, id);
  if (type === 'caravan') {
    const caravan = getCaravans(state).find(entry => entry.id === id && (entry.status === 'en-route' || entry.status === 'under-attack'));
    if (!caravan) return result(false, 'That wagon is no longer on the road.');
    state.pursuit = null;
    state.destination = { x: caravan.x, y: caravan.y };
    state.destinationAction = { type: 'caravan', id };
    const message = `Following the armorer wagon bound for ${TOWN_BY_ID.get(caravan.destinationId).name}.`;
    record(state, message);
    return result(true, message);
  }
  const target = type === 'town' ? TOWN_BY_ID.get(id) : type === 'camp' ? getCampSites(state).find(site => site.id === id) : null;
  if (!target) return result(false, 'That destination is unavailable.');
  if (type === 'camp' && target.cleared) return result(false, 'This camp has already been cleared.');
  if (type === 'town' && townAt(state)?.id === id) {
    state.destination = null; state.pursuit = null; state.destinationAction = null;
    return { ...result(true, `Entering ${target.name}.`), openTown: id };
  }
  if (type === 'camp' && distance(state.position, target) <= CAMP_RADIUS) return startBattle(state, id);
  const travel = travelTo(state, target.x, target.y);
  if (travel.ok) {
    state.destinationAction = { type, id, ...(type === 'camp' ? { generation: target.generation } : {}) };
    return result(true, type === 'camp' ? `Marching to attack ${target.name}.` : `Traveling to enter ${target.name}.`);
  }
  return travel;
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
  if (contract.type === 'hunt' && !huntComplete(state, contract)) return false;
  if (contract.type === 'supply') {
    if ((state.cargo[contract.goodId] ?? 0) < contract.quantity) return false;
    state.cargo[contract.goodId] -= contract.quantity;
    if (!state.cargo[contract.goodId]) delete state.cargo[contract.goodId];
  }
  state.gold += contract.reward;
  state.renown += contract.renown ?? 1;
  const description = contract.type === 'hunt' ? 'Brigand hunt completed' : contract.type === 'supply' ? `${contract.quantity} ${GOOD_BY_ID.get(contract.goodId).name.toLowerCase()} delivered` : `Dispatch from ${TOWN_BY_ID.get(contract.from).name} delivered`;
  record(state, `${description} at ${town.name}. Earned ${contract.reward} crowns and ${contract.renown ?? 1} renown.`);
  if ((contract.type === undefined || contract.type === 'courier') && townEventHash(`${state.seed}:${contract.id}:${town.id}:courier-item`) % 4 === 0) {
    const better = townEventHash(`${state.seed}:${contract.id}:${town.id}:courier-quality`) % 3 === 0;
    const stock = writableMarketStock(state, town);
    const event = scheduledTownEvent(state, town);
    const candidates = ITEMS.filter(item => {
      const rightTier = better ? item.price >= 250 && item.price < 450 : item.price < 250;
      return item.slot !== 'mount' && rightTier && stock.equipment[item.id] < 1024 && visibleEquipmentStock(state, town, item, stock.equipment[item.id] + 1, event) > 0;
    });
    if (candidates.length) {
      const item = candidates[townEventHash(`${state.seed}:${contract.id}:${town.id}:courier-choice`) % candidates.length];
      stock.equipment[item.id] += 1;
      record(state, `${town.name}'s factor adds ${item.name} to the local armory stock.`);
    }
  }
  state.contract = null;
  return true;
}

function atMidnight(state) {
  state.day += 1;
  const foodNeeded = getDailyFood(state);
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
    if (state.destinationAction?.type === 'caravan') {
      const caravan = getCaravans(state).find(entry => entry.id === state.destinationAction.id && (entry.status === 'en-route' || entry.status === 'under-attack'));
      if (caravan) state.destination = { x: caravan.x, y: caravan.y };
      else {
        state.destination = null;
        state.destinationAction = null;
        record(state, 'The wagon journey ends; the company stops following it.');
      }
    }
  }
}

export function tick(state, hours) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 72) return result(false, 'Time must advance by more than zero and at most 72 hours.');
  let remaining = hours;
  let engagement = null;
  while (remaining > 1e-9) {
    const now = worldHours(state);
    const nextWorldStep = (Math.floor((now + 1e-9) / WORLD_STEP_HOURS) + 1) * WORLD_STEP_HOURS;
    const step = Math.min(remaining, Math.max(1e-9, nextWorldStep - now));
    let arrivedAction = null;
    if (state.destinationAction?.type === 'caravan') {
      const caravan = getCaravans(state).find(entry => entry.id === state.destinationAction.id && (entry.status === 'en-route' || entry.status === 'under-attack'));
      if (caravan) state.destination = { x: caravan.x, y: caravan.y };
      else {
        state.destinationAction = null;
        state.destination = null;
        record(state, 'The wagon has left the road; the company stops following it.');
      }
    }
    if (state.pursuit) {
      const target = getRoamingBands(state).find(band => band.id === state.pursuit);
      if (target) state.destination = { x: target.x, y: target.y };
      else { state.pursuit = null; state.destination = null; }
    }
    if (state.destination) {
      const distanceLeft = distance(state.position, state.destination);
      const speed = terrainSpeed(terrainAt(state.position.x, state.position.y)) * (1 + getCompanyTravelBonus(state));
      const movement = Math.min(distanceLeft, speed * step);
      if (distanceLeft > 0) {
        state.position.x += (state.destination.x - state.position.x) * movement / distanceLeft;
        state.position.y += (state.destination.y - state.position.y) * movement / distanceLeft;
      }
      if (!state.pursuit && state.destinationAction?.type !== 'caravan' && distance(state.position, state.destination) <= ARRIVAL_RADIUS) {
        state.position = { ...state.destination };
        state.destination = null;
        onArrival(state);
        arrivedAction = state.destinationAction;
        state.destinationAction = null;
      }
    }
    advanceClock(state, step);
    const reachedWorldStep = Math.abs(worldHours(state) / WORLD_STEP_HOURS - Math.round(worldHours(state) / WORLD_STEP_HOURS)) < 1e-7;
    if (reachedWorldStep) { snapWorldStepClock(state); advanceCaravans(state, worldHours(state)); }
    const hostileContact = reachedWorldStep ? advanceRoamingBands(state) : null;
    if (reachedWorldStep && state.destinationAction?.type === 'caravan') {
      const caravan = getCaravans(state).find(entry => entry.id === state.destinationAction.id
        && (entry.status === 'en-route' || entry.status === 'under-attack'));
      if (!caravan) { state.destination = null; state.destinationAction = null; }
    }
    if (arrivedAction?.type === 'town') engagement = { ...result(true, `Entering ${TOWN_BY_ID.get(arrivedAction.id).name}.`), openTown: arrivedAction.id };
    else if (arrivedAction?.type === 'camp') {
      const camp = getCampSites(state).find(site => site.id === arrivedAction.id);
      engagement = camp && !camp.cleared && camp.generation === arrivedAction.generation
        ? startBattle(state, arrivedAction.id) : result(false, 'That camp is no longer available to attack.');
    }
    if (!engagement && hostileContact) engagement = startHostileContact(state, hostileContact);
    if (!engagement && state.pursuit) {
      const target = getRoamingBands(state).find(band => band.id === state.pursuit);
      if (!target) { state.pursuit = null; state.destination = null; }
      else if (distance(state.position, target) <= BAND_RADIUS) {
        state.destination = null;
        state.pursuit = null;
        engagement = startBattle(state, target.id);
      } else state.destination = { x: target.x, y: target.y };
    }
    remaining -= step;
    if (engagement) break;
  }
  return engagement ?? result(true, state.destination ? 'The company is on the road.' : 'Time passes.');
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
  const supplyReward = Math.round((quantity * goodPrices(state, town, good).buyPrice + 60 + distance(town, supplyTarget) * .38) / 5) * 5;
  const serial = state.contractSerial + 1;
  const offers = [
    { id: `courier-${serial}`, type: 'courier', from: town.id, to: courierTarget.id, reward: courierReward, renown: 1 },
    { id: `supply-${serial}`, type: 'supply', from: town.id, to: supplyTarget.id, reward: supplyReward, renown: 2, goodId: good.id, quantity },
  ];
  const camp = getCampSites(state).filter(site => !site.cleared).sort((a, b) => distance(a, town) - distance(b, town))[0];
  if (camp) offers.push({ id: `hunt-${serial}`, type: 'hunt', from: town.id, to: town.id, campId: camp.id, campGeneration:camp.generation, reward: camp.reward + Math.round(distance(camp, town) * .15 / 5) * 5, renown: 2 });
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
      ? `Clear ${getCampSites(state).find(camp=>camp.id===offer.campId).name} and return to ${town.name} for ${offer.reward} crowns.`
    : `Carry sealed dispatches to ${destination.name} for ${offer.reward} crowns.`;
  record(state, message);
  return result(true, message);
}

export function getPurchaseQuote(state, kind, id) {
  const market = getMarket(state);
  if (!market) return { quantity: 0, cost: 0 };
  const offer = kind === 'equipment' ? market.equipment.find(row => row.itemId === id)
    : kind === 'food' ? market.food : kind === 'goods' ? market.goods.find(row => row.goodId === id)
    : kind === 'supplies' ? market.supplies.find(row => row.kind === id) : null;
  if (!offer) return { quantity: 0, cost: 0 };
  const capacity = kind === 'equipment' ? MAX_INVENTORY - state.inventory.length
    : kind === 'food' ? 1000000000 - state.food : kind === 'goods' ? MAX_CARGO - cargoCount(state)
    : 10000 - state.supplies[id];
  const quantity = Math.max(0, Math.min(offer.stock, Math.floor(state.gold / offer.buyPrice), capacity));
  return { quantity, cost: quantity * offer.buyPrice };
}

export function buyAll(state, kind, id) {
  const { quantity } = getPurchaseQuote(state, kind, id);
  if (!quantity) return result(false, 'Nothing can be bought: check stock, crowns and storage.');
  if (kind === 'equipment') return buyItem(state, id, quantity);
  if (kind === 'food') return buyFood(state, quantity);
  if (kind === 'goods') return buyGood(state, id, quantity);
  return buySupplies(state, id, quantity);
}

export function buyItem(state, itemId, quantity = 1) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  const item = getItem(itemId);
  if (!item) return result(false, 'Unknown item.');
  if (!validQuantity(quantity, MAX_INVENTORY)) return result(false, 'Choose a valid number of items.');
  const offer = getMarket(state).equipment.find(entry => entry.itemId === itemId);
  if (!offer) return result(false, 'This item is not for sale here.');
  if (offer.stock < quantity) return result(false, 'The market does not have that many items today.');
  const cost = offer.buyPrice * quantity;
  if (state.gold < cost) return result(false, 'The company cannot afford this item.');
  if (state.inventory.length + quantity > MAX_INVENTORY) return result(false, 'The company pack is full.');
  state.gold -= cost;
  state.inventory.push(...Array(quantity).fill(item.id));
  if (item.rarity === 'famed') {
    const buyback = writableMarketStock(state, access.town).buyback;
    for (let count = 0; count < quantity; count++) {
      const index = buyback.findIndex(entry => entry.itemId === itemId);
      state.inventoryCondition.push(buyback.splice(index, 1)[0].condition);
    }
  } else {
    state.inventoryCondition.push(...Array(quantity).fill(itemCondition(item.id)));
    writableMarketStock(state, access.town).equipment[itemId] -= quantity;
  }
  const message = `Bought ${quantity > 1 ? `${quantity} x ` : ''}${item.name} for ${cost} crowns.`;
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
  const item = getItem(itemId);
  const offer = getMarket(state).equipment.find(entry => entry.itemId === itemId);
  const sellPrice = offer?.sellPrice ?? equipmentPrices(state, access.town, item).sellPrice;
  if (item.rarity === 'famed' && (marketStock(state, access.town).buyback?.length ?? 0) >= MAX_INVENTORY) return result(false, 'The market cannot hold more famed gear.');
  if (item.rarity !== 'famed' && marketStock(state, access.town).equipment[itemId] >= 1024) return result(false, 'The armory cannot hold more of that item.');
  state.inventory.splice(index, 1);
  const condition = state.inventoryCondition.splice(index, 1)[0];
  state.gold += sellPrice;
  if (item.rarity === 'famed') (writableMarketStock(state, access.town).buyback ??= []).push({ itemId, condition });
  else writableMarketStock(state, access.town).equipment[itemId] += 1;
  const message = `Sold ${item.name} for ${sellPrice} crowns.`;
  record(state, message);
  return result(true, message);
}

export function buyFood(state, quantity = 5) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  if (!validQuantity(quantity, 100)) return result(false, 'Choose 1 to 100 provisions.');
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
  if (!validQuantity(quantity, 100)) return result(false, 'Choose 1 to 100 supplies.');
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

export function getTownServiceQuote(state, service, memberId = null) {
  const town = townAt(state);
  const quote = { ok: false, service, townId: town?.id ?? null, entries: [], totalCost: 0, totalAmount: 0 };
  if (service !== 'doctor' && service !== 'smithy') return { ...quote, message: 'Choose Doctor or Smithy.' };
  const blocked = actionBlocked(state);
  if (blocked) return { ...quote, message: blocked.message };
  if (!town) return { ...quote, message: 'Visit a settlement to use the Doctor or Smithy.' };
  const members = memberId === null ? state.party : state.party.filter(person => person.id === memberId);
  if (!members.length) return { ...quote, message: 'Unknown company member.' };
  quote.entries = members.map(person => {
    if (service === 'doctor') {
      const maxHp = getCompanyStats(person).maxHp;
      const hpMissing = Math.max(0, maxHp - person.hp);
      return { memberId: person.id, name: person.name, currentHp: person.hp, maxHp,
        hpMissing, amount: hpMissing, cost: hpMissing };
    }
    const repairs = [['armor', 'body'], ['helmet', 'head']].flatMap(([slot, part]) => {
      const itemId = person.equipment[slot];
      if (!itemId) return [];
      const max = armorMaximum(itemId);
      const current = person.armorDurability[part];
      return [{ slot, itemId, current, max, missing: Math.max(0, max - current) }];
    });
    const amount = repairs.reduce((total, repair) => total + repair.missing, 0);
    return { memberId: person.id, name: person.name, repairs, amount, cost: Math.ceil(amount / 2) };
  });
  quote.totalAmount = quote.entries.reduce((total, entry) => total + entry.amount, 0);
  quote.totalCost = quote.entries.reduce((total, entry) => total + entry.cost, 0);
  if (!quote.totalAmount) return { ...quote, message: service === 'doctor' ? 'No healing is needed.' : 'No equipped armor needs repairs.' };
  if (state.gold < quote.totalCost) return { ...quote, message: `The company needs ${quote.totalCost} crowns for this service.` };
  return { ...quote, ok: true };
}

export function useTownService(state, service, memberId = null) {
  const quote = getTownServiceQuote(state, service, memberId);
  if (!quote.ok) return result(false, quote.message);
  state.gold -= quote.totalCost;
  for (const entry of quote.entries) {
    if (!entry.amount) continue;
    const person = state.party.find(member => member.id === entry.memberId);
    if (service === 'doctor') person.hp = entry.maxHp;
    else for (const repair of entry.repairs) person.armorDurability[repair.slot === 'armor' ? 'body' : 'head'] = repair.max;
  }
  const message = service === 'doctor'
    ? `Doctor restores ${quote.totalAmount} HP for ${quote.totalCost} crowns at ${TOWN_BY_ID.get(quote.townId).name}.`
    : `Smithy restores ${quote.totalAmount} armor for ${quote.totalCost} crowns at ${TOWN_BY_ID.get(quote.townId).name}.`;
  record(state, message);
  return result(true, message);
}

function accessoryIndex(destination) {
  return destination === 'accessory-1' ? 0 : destination === 'accessory-2' ? 1 : -1;
}

export function equipItem(state, personId, itemId, destination = 'active') {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  const item = getItem(itemId);
  if (!item) return result(false, 'Unknown item.');
  const index = state.inventory.indexOf(itemId);
  if (index < 0) return result(false, 'That item is not in the company pack.');
  const accessory = accessoryIndex(destination);
  if (accessory >= 0 && item.slot !== 'accessory' && !item.pocketWeapon) return result(false, 'Only a supply or pocket weapon fits that slot.');
  if (accessory < 0 && destination !== 'active' && destination !== 'reserve') return result(false, 'Unknown equipment destination.');
  if (accessory < 0 && destination === 'reserve' && !['weapon', 'shield'].includes(item.slot)) return result(false, 'Reserve slots hold a weapon and shield.');
  if (accessory < 0 && destination === 'active' && !SLOTS.includes(item.slot)) return result(false, 'That item needs an accessory slot.');
  const set = destination === 'reserve' ? person.reserveEquipment : person.equipment;
  const previous = accessory >= 0 ? person.accessories[accessory] : set[item.slot];
  const displaced = accessory >= 0 ? null : item.twoHanded && set.shield ? set.shield
    : item.slot === 'shield' && getItem(set.weapon)?.twoHanded ? set.weapon : null;
  if (state.inventory.length - 1 + Number(Boolean(previous)) + Number(Boolean(displaced)) > MAX_INVENTORY) return result(false, 'The company pack is full.');
  const condition = state.inventoryCondition.splice(index, 1)[0];
  state.inventory.splice(index, 1);
  if (previous) {
    state.inventory.push(previous);
    state.inventoryCondition.push(destination === 'active' && item.slot === 'armor' ? person.armorDurability.body : destination === 'active' && item.slot === 'helmet' ? person.armorDurability.head : null);
  }
  if (displaced) {
    state.inventory.push(displaced);
    state.inventoryCondition.push(null);
    set[item.twoHanded ? 'shield' : 'weapon'] = null;
  }
  if (accessory >= 0) person.accessories[accessory] = itemId;
  else set[item.slot] = itemId;
  if (destination === 'active' && item.slot === 'armor') person.armorDurability.body = condition;
  if (destination === 'active' && item.slot === 'helmet') person.armorDurability.head = condition;
  const message = `${person.name} equipped ${item.name}${destination === 'active' ? '' : ` in ${destination}`}.`;
  record(state, message);
  return result(true, message);
}

export function unequipItem(state, personId, slot, destination = 'active') {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  const accessory = accessoryIndex(destination);
  if (accessory >= 0 ? slot !== 'accessory' : destination === 'reserve' ? !['weapon', 'shield'].includes(slot) : destination !== 'active' || !SLOTS.includes(slot)) return result(false, 'Unknown equipment slot.');
  const set = destination === 'reserve' ? person.reserveEquipment : person.equipment;
  const itemId = accessory >= 0 ? person.accessories[accessory] : set[slot];
  if (!itemId) return result(false, 'That slot is already empty.');
  if (state.inventory.length >= MAX_INVENTORY) return result(false, 'The company pack is full.');
  if (accessory >= 0) person.accessories[accessory] = null;
  else set[slot] = null;
  state.inventory.push(itemId);
  state.inventoryCondition.push(destination === 'active' && slot === 'armor' ? person.armorDurability.body : destination === 'active' && slot === 'helmet' ? person.armorDurability.head : null);
  if (destination === 'active' && slot === 'armor') person.armorDurability.body = 0;
  if (destination === 'active' && slot === 'helmet') person.armorDurability.head = 0;
  const message = `${person.name} stowed ${getItem(itemId).name}.`;
  record(state, message);
  return result(true, message);
}

export function swapWeaponSet(state, personId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  if (!person.reserveEquipment.weapon && !person.reserveEquipment.shield) return result(false, 'There is no reserve weapon set.');
  const active = { weapon: person.equipment.weapon, shield: person.equipment.shield };
  person.equipment.weapon = person.reserveEquipment.weapon;
  person.equipment.shield = person.reserveEquipment.shield;
  person.reserveEquipment = active;
  const message = `${person.name} switches weapon sets.`;
  record(state, message);
  return result(true, message);
}

export function getEquipment(person) {
  return Object.fromEntries(SLOTS.map(slot => [slot, getItem(person.equipment?.[slot]) ?? null]));
}

function recruitOfferDay(id) {
  const match = /^hire:([a-z0-9-]+):([1-9]\d{0,6}):([0-2])$/.exec(id);
  return match && TOWN_BY_ID.has(match[1]) ? Number(match[2]) : null;
}

function recruitPerson(state, town, slot) {
  const profile = makeRecruitProfile(state.seed, town.id, state.day, slot);
  const background = RECRUIT_BACKGROUND_BY_ID.get(profile.backgroundId);
  const person = normalizeMember({
    id: `recruit-${town.id}-${state.day}-${slot}`,
    name: profile.name,
    background: background.name,
    backgroundId: background.id,
    traits: [...profile.traitIds],
    seed: profile.personSeed,
    hp: 100,
    morale: 70,
    equipment: { armor: null, helmet: null, weapon: null, shield: null },
  });
  person.hp = getCompanyStats(person).maxHp;
  return { id: profile.offerId, person, cost: background.cost };
}

export function getRecruitOffers(state) {
  const town = townAt(state);
  if (!town) return [];
  const consumed = new Set(state.hiredRecruitOffers ?? []);
  return Array.from({ length: 3 }, (_, slot) => recruitPerson(state, town, slot))
    .filter(offer => !consumed.has(offer.id))
    .map(offer => ({
      ...offer,
      background: getBackground(offer.person),
      traits: getTraits(offer.person),
      stats: getCompanyStats(offer.person),
    }));
}

export function recruit(state, offerId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const access = requireTown(state);
  if (access.error) return access.error;
  if (state.party.length >= MAX_COMPANY_SIZE) return result(false, 'The company has room for only twelve members.');
  const offers = getRecruitOffers(state);
  const offer = offerId === undefined ? offers[0] : offers.find(entry => entry.id === offerId);
  if (!offer) return result(false, 'That recruit is no longer available here today.');
  if (state.gold < offer.cost) return result(false, `Recruitment costs ${offer.cost} crowns.`);
  const formation = getFormation(state);
  const vacancy = [...FRONT_FORMATION, ...REAR_FORMATION].find(index => formation[index] === null);
  if (vacancy === undefined) return result(false, 'The company formation has no open place.');
  const person = normalizeMember(offer.person);
  state.party.push(person);
  formation[vacancy] = person.id;
  state.formation = formation;
  state.gold -= offer.cost;
  state.recruitSerial += 1;
  state.hiredRecruitOffers = [
    ...(state.hiredRecruitOffers ?? []).filter(id => recruitOfferDay(id) === state.day),
    offer.id,
  ];
  const message = `${person.name} joins the Ashen Company for ${offer.cost} crowns.`;
  record(state, message);
  return result(true, message);
}

export function getLevelUp(person) {
  const next = person?.pendingLevelUps?.[0];
  return next ? { level: next.level, rolls: { ...next.rolls } } : null;
}

export function getPerkPoints(person) {
  const level = Number.isSafeInteger(person?.level) ? person.level : 1;
  const learned = Array.isArray(person?.perks) ? person.perks.length : 0;
  return Math.max(0, level - 1 - learned);
}

export function getPerkChoices(person) {
  const level = Number.isSafeInteger(person?.level) ? person.level : 1;
  const learned = new Set(Array.isArray(person?.perks) ? person.perks : []);
  return PERKS.filter(perk => perk.minLevel <= level && !learned.has(perk.id));
}

export function learnPerk(state, personId, perkId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  const perk = PERK_BY_ID.get(perkId);
  if (!perk) return result(false, 'Unknown perk.');
  person.perks ??= [];
  if (person.perks.includes(perkId)) return result(false, `${person.name} already knows ${perk.name}.`);
  if (person.level < perk.minLevel) return result(false, `${perk.name} unlocks at level ${perk.minLevel}.`);
  if (getPerkPoints(person) < 1) return result(false, 'This member has no perk point to spend.');
  const oldMaxHp = getCompanyStats(person).maxHp;
  person.perks.push(perkId);
  if (perkId === 'colossus') person.hp += getCompanyStats(person).maxHp - oldMaxHp;
  const message = `${person.name} learned ${perk.name}.`;
  record(state, message);
  return result(true, message);
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
  const oldMaxHp = getCompanyStats(person).maxHp;
  for (const key of keys) person.attributes[key] += next.rolls[key];
  if (keys.includes('maxHp')) person.hp += getCompanyStats(person).maxHp - oldMaxHp;
  person.pendingLevelUps.shift();
  person.trainingPoints = person.pendingLevelUps.length;
  const message = `${person.name} trained three attributes at level ${next.level}.`;
  record(state, message);
  return result(true, message);
}

export function trainAttribute() {
  return result(false, 'Choose three different attributes together to spend a level-up.');
}

function advanceStationaryTime(state, hours) {
  let remaining = hours;
  while (remaining > 1e-9) {
    const now = worldHours(state);
    const nextWorldStep = (Math.floor((now + 1e-9) / WORLD_STEP_HOURS) + 1) * WORLD_STEP_HOURS;
    const step = Math.min(remaining, Math.max(1e-9, nextWorldStep - now));
    advanceClock(state, step);
    remaining -= step;
    const reachedWorldStep = Math.abs(worldHours(state) / WORLD_STEP_HOURS - Math.round(worldHours(state) / WORLD_STEP_HOURS)) < 1e-7;
    if (reachedWorldStep) {
      snapWorldStepClock(state);
      advanceCaravans(state, worldHours(state));
      if (state.destinationAction?.type === 'caravan') {
        const caravan = getCaravans(state).find(entry => entry.id === state.destinationAction.id
          && (entry.status === 'en-route' || entry.status === 'under-attack'));
        if (!caravan) { state.destination = null; state.destinationAction = null; }
      }
      const hostileContact = advanceRoamingBands(state);
      if (hostileContact) return startHostileContact(state, hostileContact);
    }
  }
  if (state.pursuit) {
    const target = getRoamingBands(state).find(band => band.id === state.pursuit);
    state.destination = target ? { x: target.x, y: target.y } : null;
    if (!target) state.pursuit = null;
  }
  return null;
}

export function camp(state) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const interrupted = advanceStationaryTime(state, 6);
  if (interrupted) return interrupted;
  const wounded = state.party.some(person => person.hp < getCompanyStats(person).maxHp);
  const medicated = wounded && state.supplies.medicine > 0;
  if (medicated) state.supplies.medicine -= 1;
  for (const person of state.party) {
    person.hp = clamped(person.hp + (medicated ? 24 : 8) + (hasPerk(person, 'field-medic') ? 8 : 0), 1, getCompanyStats(person).maxHp);
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
  const interrupted = advanceStationaryTime(state, 4);
  if (interrupted) return interrupted;
  const terrain = terrainAt(state.position.x, state.position.y);
  const bonus = terrain === 'forest' ? 2 : terrain === 'marsh' ? 1 : terrain === 'mountain' ? -1 : 0;
  const found = Math.max(3, 3 + Math.ceil(state.party.length / 2) + bonus) + state.party.filter(person => person.hp > 0 && hasPerk(person, 'forager')).length * 2;
  state.food += found;
  const message = `The company forages for four hours and finds ${found} provisions.`;
  record(state, message);
  return result(true, message);
}

function campRecord(state, id) {
  const entry = state.camps?.[id];
  const respawnAt = entry?.respawnAt ?? (entry?.clearedDay ? (entry.clearedDay - 1) * 24 + (CAMP_BY_ID.has(id) ? 120 : 72) : null);
  const cleared = respawnAt !== null && respawnAt > worldHours(state);
  return { cleared, respawnAt, generation: (entry?.generation ?? 0) + (respawnAt !== null && !cleared ? 1 : 0) };
}

const FAMED_CHANCES = [0, .15, .25, .40];
const FAMED_BASES = {
  1: ['spear', 'arming-sword', 'wood-axe', 'bludgeon', 'rondel-dagger', 'quilted-jack', 'leather-vest', 'padded-gambeson', 'leather-cap', 'iron-helm', 'round-shield', 'falchion', 'javelins'],
  2: ['arming-sword', 'billhook', 'light-crossbow', 'mail-shirt', 'reinforced-mail', 'brigandine', 'kettle-helm', 'bascinet', 'kite-shield', 'fighting-spear', 'polehammer', 'warhammer', 'southern-mail'],
  3: ['billhook', 'light-crossbow', 'brigandine', 'plate-harness', 'reinforced-mail', 'bascinet', 'greathelm', 'kite-shield', 'arming-sword', 'greatsword', 'greataxe', 'heavy-crossbow', 'coat-of-scales'],
};

function famedDropForCamp(seed, camp) {
  const chance = FAMED_CHANCES[camp.difficulty] ?? 0;
  if (hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-roll`) % 10000 >= chance * 10000) return null;
  const bases = FAMED_BASES[camp.difficulty];
  const baseId = bases[hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-base`) % bases.length];
  return createFamedItemId(baseId, hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-item`));
}

function rareEnemyMount(seed, encounterId, cycle) {
  if (hashSeed(`${seed}:${encounterId}:${cycle}:mounted-elite`) % 100 >= 2) return null;
  return MOUNTS[hashSeed(`${seed}:${encounterId}:elite-mount-kind`) % MOUNTS.length].id;
}

function randomCamp(state, id, index, generation) {
  let seed = hashSeed(`${state.seed}:${id}:${generation}`);
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed / 4294967296; };
  const column = index % 4, row = Math.floor(index / 4);
  let x, y;
  for (let attempt=0;attempt<60;attempt++) {
    x = Math.round(BOUNDS.minX + column * 485 + 65 + random() * 355);
    y = Math.round(BOUNDS.minY + row * (1300/3) + 65 + random() * (1300/3-130));
    if (!SETTLEMENTS.some(town => Math.hypot(town.x-x,town.y-y)<90) && !CAMP_SITES.some(camp => Math.hypot(camp.x-x,camp.y-y)<85)) break;
  }
  const difficulty = column === 0 && row < 2 ? 1 : 1 + Math.floor(random() * 3);
  const pool = getRegionalEnemyTemplates(x, y, difficulty);
  const count = 2 + difficulty + Math.floor(random() * 2);
  const offset = Math.floor(random() * pool.length);
  const enemies = Array.from({ length: count }, (_, enemyIndex) => ({ ...pool[(offset + enemyIndex) % pool.length] }));
  const text = getRegionalCampText(x, y, difficulty, enemies.length, index);
  return {id,...text,x,y,difficulty,enemies,reward:100+difficulty*95,random:true};
}

export function getCampSites(state) {
  return [...CAMP_SITES.map(camp=>camp.id),...RANDOM_CAMP_IDS].map((id,index)=>{
    const progress = campRecord(state,id), fixed = CAMP_BY_ID.get(id);
    const camp = fixed || randomCamp(state,id,index-CAMP_SITES.length,progress.generation);
    const scaling = enemyProgression(state, camp.difficulty);
    const enemies = Array.from({ length: Math.min(12, camp.enemies.length + scaling.reinforcements) }, (_, enemyIndex) => ({ ...camp.enemies[enemyIndex % camp.enemies.length] }));
    if (scaling.cavalry && enemies.length) enemies[0].mount = rareEnemyMount(state.seed, camp.id, progress.generation);
    return {...camp,description:scaling.reinforcements?`${enemies.length} fighters hold this position. Veteran reinforcements have gathered as your company has grown.`:camp.description,kind:'camp',generation:progress.generation,veteranRank:scaling.rank,famedChance:FAMED_CHANCES[camp.difficulty]??0,enemies,cleared:progress.cleared,clearedDay:progress.cleared?state.camps[id].clearedDay:null,respawnHours:progress.cleared?Math.ceil(progress.respawnAt-worldHours(state)):0};
  });
}

export function huntComplete(state, contract=state.contract) {
  const entry=state.camps?.[contract?.campId];
  return contract?.type==='hunt' && Boolean(entry?.clearedDay) && entry.clearedDay>=contract.acceptedDay && (entry.generation??0)>=(contract.campGeneration??0);
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
    state.battle.formationAdvance = ['advance-formation', 'shield-wall'].includes(tactic) ? makeFormationAdvancePlan(state.battle) : null;
  }
  const message = `Company tactic set to ${tactic}.`;
  record(state, message);
  return result(true, message);
}

function battleRoll(battle) {
  battle.rng = (Math.imul(battle.rng, 1664525) + 1013904223) >>> 0;
  return battle.rng / 4294967296;
}

function battleLog(battle, message) {
  battle.log.push(`Round ${battle.round}: ${message}`);
  if (battle.log.length > 120) battle.log.shift();
}

function projectileForWeapon(weapon) {
  if (!weapon?.ranged) return null;
  if (weapon.throwing) return weapon.visual.includes('axe') ? 'axe' : 'javelin';
  return weapon.visual.includes('crossbow') ? 'bolt' : 'arrow';
}

function makeBattleEvent(actor, target, type, message, weapon = null, from = null, extra = {}) {
  const ranged = weapon?.ranged === true;
  return {
    actorId: actor?.id ?? null, targetId: target?.id ?? null, type,
    weaponId: weapon?.id ?? null, ranged,
    projectile: ranged && (type === 'attack' || type === 'miss') ? projectileForWeapon(weapon) : null,
    from: from ?? (actor ? { q: actor.q, r: actor.r } : null),
    to: target ? { q: target.q, r: target.r } : actor ? { q: actor.q, r: actor.r } : null,
    message, ...extra,
  };
}

function sortTurnOrder(battle) {
  return battle.units.filter(unit => unit.alive).sort((a, b) =>
    b.initiative - b.fatigue * .2 - (a.initiative - a.fatigue * .2) || a.id.localeCompare(b.id)).map(unit => unit.id);
}

function hasShieldSet(unit) {
  if (unit.equipment.shield && !getItem(unit.equipment.weapon)?.twoHanded) return true;
  return Boolean(unit.reserveEquipment.shield && !getItem(unit.reserveEquipment.weapon)?.twoHanded);
}

function isPureRangedUnit(unit) {
  const active = getItem(unit.equipment.weapon);
  return Boolean(active?.ranged && !active.throwing);
}

function isShieldWallFront(unit) {
  return hasShieldSet(unit) && !isPureRangedUnit(unit);
}

function orderCompanyTurnsForFormation(battle) {
  if (!['advance-formation', 'shield-wall'].includes(battle.tactic)) return;
  const companySlots = battle.turnOrder.map((id, index) => ({ id, index }))
    .filter(entry => battle.units.find(unit => unit.id === entry.id)?.side === 'company');
  const ordered = companySlots.map(entry => battle.units.find(unit => unit.id === entry.id))
    .sort((a, b) => b.q - a.q || a.r - b.r || a.id.localeCompare(b.id));
  companySlots.forEach((entry, index) => { battle.turnOrder[entry.index] = ordered[index].id; });
}

function makeFormationAdvancePlan(battle) {
  const company = battle.units.filter(unit => unit.alive && unit.side === 'company');
  return {
    step: 1, direction: chooseFormationDirection(battle, company), completedRound: 0,
    startedRound: battle.round,
    origins: Object.fromEntries(battle.units.filter(unit => unit.side === 'company').map(unit => [unit.id, { q: unit.q, r: unit.r }])),
  };
}

function chooseFormationDirection(battle, company) {
  const enemies = battle.units.filter(unit => unit.alive && unit.side === 'enemy');
  const companyCenter = { q: company.reduce((sum, unit) => sum + unit.q, 0) / company.length, r: company.reduce((sum, unit) => sum + unit.r, 0) / company.length };
  const enemyCenter = { q: enemies.reduce((sum, unit) => sum + unit.q, 0) / enemies.length, r: enemies.reduce((sum, unit) => sum + unit.r, 0) / enemies.length };
  return Object.entries(FORMATION_DIRECTIONS)
    .filter(([, [dq, dr]]) => company.every(unit => tileAt(battle.field, unit.q + dq, unit.r + dr)))
    .map(([id, [dq, dr]]) => ({ id, distance: hexDistance({ q: companyCenter.q + dq, r: companyCenter.r + dr }, enemyCenter) }))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))[0]?.id ?? 'e';
}

function shieldWallDeployment(company) {
  const shields = company.filter(isShieldWallFront);
  if (!shields.length) return;
  const rear = company.filter(unit => !shields.includes(unit)).sort((a, b) => Number(isPureRangedUnit(b)) - Number(isPureRangedUnit(a)) || a.r - b.r || a.id.localeCompare(b.id));
  shields.sort((a, b) => a.r - b.r || a.id.localeCompare(b.id));
  const occupied = new Set();
  const place = (unit, candidates) => {
    const point = candidates.find(entry => !occupied.has(`${entry.q},${entry.r}`));
    Object.assign(unit, point);
    occupied.add(`${point.q},${point.r}`);
  };
  const cells = columns => columns.flatMap(q => Array.from({ length: 6 }, (_, index) => ({ q, r: index + 1 })));
  for (const unit of shields) place(unit, cells([2, 1, 0]));
  const rearColumns = shields.some(unit => unit.q === 1) ? [0, 1, 2] : [1, 0, 2];
  for (const unit of rear) place(unit, cells(rearColumns));
}

export function startBattle(state, encounterId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const encounterType = BAND_BY_ID.has(encounterId) ? 'band' : 'camp';
  const camp = encounterType === 'band' ? getRoamingBands(state).find(band => band.id === encounterId) : getCampSites(state).find(site=>site.id===encounterId);
  if (!camp) return result(false, 'That hostile group is no longer here.');
  if (encounterType === 'camp' && camp.cleared) return result(false, `This camp is deserted. Raiders may return in ${camp.respawnHours} hours.`);
  if (state.destination || distance(state.position, camp) > (encounterType === 'band' ? BAND_RADIUS + 7 : CAMP_RADIUS)) return result(false, 'Approach the enemy before engaging.');
  if (!state.party.length) return result(false, 'No company members can fight.');
  const field = createBattleField(state.seed, `${camp.id}:${state.day}:${state.contractSerial}`, terrainAt(camp.x, camp.y));
  const company = getFormation(state).flatMap((personId, index) => {
    const person = personById(state, personId);
    if (!person) return [];
    const stats = getCompanyStats(person);
    return [{
      id: person.id, name: person.name, side: 'company', q: index < 6 ? 2 : 1, r: 1 + index % 6,
      hp: person.hp, maxHp: stats.maxHp, bodyArmor: stats.bodyArmor, headArmor: stats.headArmor,
      maxBodyArmor: stats.maxBodyArmor, maxHeadArmor: stats.maxHeadArmor,
      equipment: { ...person.equipment }, reserveEquipment: { ...person.reserveEquipment }, accessories: [...person.accessories],
      pocketDrawnFrom: null, pocketStowedWeapon: null, pocketStowedReload: 0, pocketDrawnRound: 0, reserveReload: 0, meleePhase: false,
      perks: [...person.perks], adaptation: 0, berserkRound: 0, frenzyUntilRound: 0, turnStartedRound: 0,
      seed: person.seed, alive: person.hp > 0,
      morale: person.morale, fatigue: 0, ap: 2, reload: 0,
      meleeSkill: stats.meleeSkill, rangedSkill: stats.rangedSkill,
      meleeDefense: stats.meleeDefense - (hasPerk(person, 'dodge') ? Math.floor(stats.initiative * .15) : 0),
      rangedDefense: stats.rangedDefense - (hasPerk(person, 'dodge') ? Math.floor(stats.initiative * .15) : 0),
      maxFatigue: stats.maxFatigue, initiative: stats.initiative, resolve: stats.resolve,
    }];
  });
  if ((state.tactic ?? 'offense') === 'shield-wall') shieldWallDeployment(company);
  const enemies = camp.enemies.map((enemy, index) => {
    const rank = camp.veteranRank ?? 0;
    const rareMount = getItem(enemy.mount);
    const gear = { armor: enemy.armor, helmet: enemy.helmet, weapon: enemy.weapon, shield: enemy.shield, mount: rareMount?.id ?? null };
    const shieldDefense = getItem(gear.shield)?.defense ?? 0;
    const hp = 25 + camp.difficulty * 12 + rank * 8 + (index === 0 && camp.difficulty === 3 ? 12 : 0);
    return {
      id: `enemy-${index + 1}`, name: enemy.name, side: 'enemy', q: getItem(gear.weapon)?.ranged ? 12 + Math.floor(index / 6) : 11 - Math.floor(index / 6), r: 1 + index % 6,
      hp, maxHp: hp, bodyArmor: armorMaximum(gear.armor), headArmor: armorMaximum(gear.helmet),
      maxBodyArmor: armorMaximum(gear.armor), maxHeadArmor: armorMaximum(gear.helmet),
      equipment: gear, reserveEquipment: { weapon: null, shield: null }, accessories: [null, null],
      pocketDrawnFrom: null, pocketStowedWeapon: null, pocketStowedReload: 0, pocketDrawnRound: 0, reserveReload: 0, meleePhase: false,
      perks: [], adaptation: 0, berserkRound: 0, frenzyUntilRound: 0, turnStartedRound: 0,
      seed: hashSeed(`${state.seed}:${camp.id}:${index}`), alive: true,
      morale: 55 + camp.difficulty * 8, fatigue: 0, ap: 2, reload: 0,
      meleeSkill: 30 + camp.difficulty * 6 + rank * 4 + (rareMount?.hitBonus ?? 0), rangedSkill: 28 + camp.difficulty * 6 + rank * 4 + (rareMount?.hitBonus ?? 0),
      meleeDefense: 2 + camp.difficulty * 2 + rank * 2 + shieldDefense,
      rangedDefense: 2 + camp.difficulty * 2 + rank * 2 + shieldDefense,
      maxFatigue: 85, initiative: 75 + camp.difficulty * 6 + rank * 3, resolve: 32 + camp.difficulty * 8 + rank * 4,
    };
  });
  const battle = {
    id: `battle-${camp.id}-${state.day}-${state.contractSerial}`, campId: camp.id,
    encounterType, encounterName: camp.name, difficulty: camp.difficulty, campGeneration: encounterType === 'camp' ? camp.generation : null,
    famedDrop: encounterType === 'camp' ? famedDropForCamp(state.seed, camp) : null, field,
    tactic: state.tactic ?? 'offense', focusTargetId: null, lastContactRound: 1, engaged: false,
    status: 'active', round: 1, activeId: null, units: [...company, ...enemies],
    turnOrder: [], turnIndex: 0, rng: hashSeed(`${state.seed}:${camp.id}:${state.day}:${state.contractSerial}`),
    lootSeed: hashSeed(`${state.seed}:${camp.id}:${encounterType === 'band' ? camp.spawnCycle : camp.generation}:salvage`),
    log: [], lastEvent: null,
    loot: { gold: 0, food: 0, tools: 0, medicine: 0, ammo: 0, items: [], itemConditions: [] },
    casualties: [], xp: {},
  };
  battle.formationAdvance = ['advance-formation', 'shield-wall'].includes(battle.tactic) ? makeFormationAdvancePlan(battle) : null;
  battle.turnOrder = sortTurnOrder(battle);
  orderCompanyTurnsForFormation(battle);
  battle.activeId = battle.turnOrder[0];
  battleLog(battle, `The company engages ${camp.name}.`);
  state.battle = battle;
  state.destination = null;
  state.destinationAction = null;
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
      orderCompanyTurnsForFormation(battle);
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

function victoryLoot(battle, enemies) {
  const tier = battle.difficulty ?? 0;
  const band = battle.encounterType === 'band';
  const seed = battle.lootSeed ?? hashSeed(battle.id);
  const roll = (key, count) => hashSeed(`${seed}:${key}`) % count;
  const items = [];
  const itemConditions = [];
  const addItem = (id, condition = itemCondition(id)) => {
    if (id && items.length < 24) { items.push(id); itemConditions.push(condition); }
  };
  if (!band) addItem(battle.famedDrop);
  for (const enemy of enemies) {
    for (const slot of ['weapon', 'shield', 'armor', 'helmet']) {
      const id = enemy.equipment[slot];
      if (!id || items.length >= 24) continue;
      const maximum = armorMaximum(id);
      const condition = slot === 'armor' ? enemy.bodyArmor : slot === 'helmet' ? enemy.headArmor : null;
      if (maximum && condition < Math.ceil(maximum * .25)) continue;
      const chance = slot === 'weapon' ? 70 : slot === 'shield' ? 55 : 40;
      if (roll(`${enemy.id}:${slot}`, 100) < chance) addItem(id, condition);
    }
    if (enemy.equipment.mount && roll(`${enemy.id}:mount-capture`, 2) === 0) addItem(enemy.equipment.mount);
  }
  if (!items.length || items.length === 1 && items[0] === battle.famedDrop) addItem(enemies[0]?.equipment.weapon);
  return {
    gold: (band ? 20 + enemies.length * 17 + tier * 12 : 45 + enemies.length * 14 + tier * 25) + roll('gold', band ? 21 : 31),
    food: (band ? 2 : 2 + tier) + roll('food', 3),
    tools: (band ? 1 : 1 + tier) + roll('tools', 2),
    medicine: band ? roll('medicine', 2) : Number(tier >= 2) + roll('medicine', 2),
    ammo: (band ? 2 : 2 + tier) + roll('ammo', 3),
    items, itemConditions,
  };
}

function finishBattlePhase(battle) {
  const companyAlive = battle.units.some(unit => unit.side === 'company' && unit.alive);
  const enemiesAlive = battle.units.some(unit => unit.side === 'enemy' && unit.alive);
  if (companyAlive && enemiesAlive) return false;
  battle.status = companyAlive ? 'victory' : 'defeat';
  battle.activeId = null;
  battle.casualties = battle.units.filter(unit => unit.side === 'company' && !unit.alive).map(unit => unit.id);
  if (companyAlive) {
    const enemies = battle.units.filter(unit=>unit.side==='enemy');
    battle.loot = victoryLoot(battle, enemies);
    for (const unit of battle.units.filter(entry => entry.side === 'company' && entry.alive)) {
      battle.xp[unit.id] = (battle.xp[unit.id] ?? 0) + 30;
    }
  }
  battleLog(battle, companyAlive ? battle.encounterType === 'band' ? 'The brigands break and flee the road.' : 'The brigands break. The camp is yours.' : 'The company is defeated.');
  return true;
}

function openNeighbors(battle, point, occupied) {
  return hexNeighbors(battle.field, point).filter(next => !occupied.has(`${next.q},${next.r}`));
}

function battleMovementCost(battle, actor, from, to) {
  const cost = movementCost(battle.field, from, to);
  return hasPerk(actor, 'pathfinder') ? Math.max(1, cost - 1) : cost;
}

function movementFatigue(actor, cost) {
  return cost * (hasPerk(actor, 'marathoner') ? 2 : 3);
}

function movementBudget(actor) {
  const lightArmor = (getItem(actor.equipment.armor)?.fatigue ?? 0) + (getItem(actor.equipment.helmet)?.fatigue ?? 0) <= 10;
  return 2 + (getItem(actor.equipment.mount)?.movementBonus ?? 0) + Number(lightArmor && hasPerk(actor, 'fleet-footed'));
}

function pathCost(battle, actor, origin, path) {
  let total = 0;
  let point = origin;
  for (const next of path) {
    total += battleMovementCost(battle, actor, point, next);
    point = next;
  }
  return total;
}

function nearestEnemyDistance(battle, actor, point) {
  return Math.min(...battle.units.filter(unit => unit.alive && unit.side !== actor.side).map(unit => hexDistance(point, unit)));
}

function battleGearFatigue(equipment) {
  return (getItem(equipment.weapon)?.fatigue ?? 0) + (getItem(equipment.shield)?.fatigue ?? 0);
}

function shieldDefenseFor(actor, shieldId) {
  const defense = getItem(shieldId)?.defense ?? 0;
  return (hasPerk(actor, 'shield-expert') ? Math.ceil(defense * 1.25) : defense)
    + (defense && hasPerk(actor, 'shield-bearer') ? 5 : 0);
}

function changeBattleWeapon(actor, weaponId, shieldId) {
  const oldDefense = shieldDefenseFor(actor, actor.equipment.shield);
  const oldFatigue = battleGearFatigue(actor.equipment);
  actor.equipment.weapon = weaponId;
  actor.equipment.shield = shieldId;
  const defenseDelta = shieldDefenseFor(actor, shieldId) - oldDefense;
  const fatigueDelta = oldFatigue - battleGearFatigue(actor.equipment);
  actor.meleeDefense += defenseDelta;
  actor.rangedDefense += defenseDelta;
  actor.maxFatigue = Math.max(30, actor.maxFatigue + fatigueDelta);
  actor.initiative = Math.max(20, actor.initiative + fatigueDelta);
}

function useBattleAccessory(state, actor, enemies) {
  if (actor.side !== 'company' || Math.min(...enemies.map(enemy => hexDistance(actor, enemy))) < 2) return false;
  const index = actor.accessories.findIndex(id => {
    const item = getItem(id);
    return item?.consumable === 'heal' && actor.hp <= actor.maxHp * .55 && actor.maxHp - actor.hp >= Math.min(20, item.heal)
      || item?.consumable === 'recover' && actor.fatigue >= actor.maxFatigue * .75;
  });
  if (index < 0) return false;
  const item = getItem(actor.accessories[index]);
  if (item.consumable === 'heal') actor.hp = Math.min(actor.maxHp, actor.hp + item.heal);
  else actor.fatigue = Math.max(0, actor.fatigue - item.recover);
  actor.accessories[index] = null;
  actor.ap = 0;
  const message = `${actor.name} uses ${item.name}.`;
  state.battle.lastEvent = makeBattleEvent(actor, null, 'use', message, getItem(actor.equipment.weapon), null, { itemId: item.id });
  battleLog(state.battle, message);
  nextBattleTurn(state.battle);
  return true;
}

function switchBattleSet(state, actor, message) {
  const active = { weapon: actor.equipment.weapon, shield: actor.equipment.shield };
  const closingWithMelee = getItem(active.weapon)?.throwing && !getItem(actor.reserveEquipment.weapon)?.ranged;
  const readyingThrowing = getItem(actor.reserveEquipment.weapon)?.throwing;
  const previousReload = actor.reload;
  changeBattleWeapon(actor, actor.reserveEquipment.weapon, actor.reserveEquipment.shield);
  actor.reserveEquipment = active;
  if (closingWithMelee) actor.meleePhase = true;
  else if (readyingThrowing) actor.meleePhase = false;
  actor.reload = actor.reserveReload;
  actor.reserveReload = previousReload;
  actor.ap = 0;
  state.battle.lastEvent = makeBattleEvent(actor, null, 'swap', message, getItem(actor.equipment.weapon));
  battleLog(state.battle, message);
  nextBattleTurn(state.battle);
  return true;
}

function companyArcherWeapon(state, actor) {
  const weapon = actor.side === 'company' ? getItem(personById(state, actor.id)?.equipment.weapon) : null;
  return weapon?.ranged && !weapon.throwing ? weapon : null;
}

function chooseBattleWeapon(state, actor, enemies) {
  if (actor.side !== 'company') return false;
  const nearest = Math.min(...enemies.map(enemy => hexDistance(actor, enemy)));
  const archer = companyArcherWeapon(state, actor);
  if (actor.pocketDrawnFrom !== null) {
    const readyToShoot = archer ? nearest >= 2 : nearest >= 3 && state.battle.round >= actor.pocketDrawnRound + 2;
    if (state.supplies.ammo > 0 && readyToShoot && getItem(actor.pocketStowedWeapon)?.ranged) {
      const pocket = actor.equipment.weapon;
      changeBattleWeapon(actor, actor.pocketStowedWeapon, actor.equipment.shield);
      actor.reload = actor.pocketStowedReload;
      actor.accessories[actor.pocketDrawnFrom] = pocket;
      actor.pocketDrawnFrom = null;
      actor.pocketStowedWeapon = null;
      actor.pocketStowedReload = 0;
      actor.pocketDrawnRound = 0;
      actor.ap = 0;
      const message = `${actor.name} readies ${getItem(actor.equipment.weapon).name} again.`;
      state.battle.lastEvent = makeBattleEvent(actor, null, 'swap', message, getItem(actor.equipment.weapon));
      battleLog(state.battle, message);
      nextBattleTurn(state.battle);
      return true;
    }
    return false;
  }
  const active = getItem(actor.equipment.weapon);
  const reserve = getItem(actor.reserveEquipment.weapon);
  if (state.battle.tactic === 'shield-wall' && actor.equipment.shield) return false;
  const outOfAmmo = state.supplies.ammo === 0;
  if (active?.ranged && (nearest <= 1 || outOfAmmo)) {
    if (active.throwing && reserve && !reserve.ranged) return switchBattleSet(state, actor, `${actor.name} switches to ${reserve.name} for close fighting.`);
    if (!outOfAmmo && archerRetreatOption(state.battle, actor, effectiveWeaponRange(actor, active))) return false;
    const pocketIndex = actor.accessories.findIndex(id => getItem(id)?.pocketWeapon);
    if (pocketIndex >= 0) {
      actor.pocketStowedWeapon = actor.equipment.weapon;
      actor.pocketStowedReload = actor.reload;
      actor.pocketDrawnFrom = pocketIndex;
      actor.pocketDrawnRound = state.battle.round;
      changeBattleWeapon(actor, actor.accessories[pocketIndex], actor.equipment.shield);
      actor.accessories[pocketIndex] = null;
      actor.reload = 0;
      actor.ap = 0;
      const message = `${actor.name} draws ${getItem(actor.equipment.weapon).name} from a pocket.`;
      state.battle.lastEvent = makeBattleEvent(actor, null, 'swap', message, getItem(actor.equipment.weapon));
      battleLog(state.battle, message);
      nextBattleTurn(state.battle);
      return true;
    }
    if (reserve && !reserve.ranged) return switchBattleSet(state, actor, `${actor.name} switches to ${reserve.name} for close fighting.`);
  }
  if (!active?.ranged && reserve?.ranged && !outOfAmmo && nearest >= (archer ? 2 : actor.meleePhase ? 4 : 3)) {
    return switchBattleSet(state, actor, `${actor.name} readies ${reserve.name} behind ${getItem(actor.reserveEquipment.shield)?.name ?? 'the line'}.`);
  }
  return false;
}

function readyShieldWallSet(state, actor) {
  if (state.battle.tactic !== 'shield-wall' || actor.side !== 'company' || actor.equipment.shield
    || companyArcherWeapon(state, actor) || !actor.reserveEquipment.shield || getItem(actor.reserveEquipment.weapon)?.twoHanded) return false;
  return switchBattleSet(state, actor, `${actor.name} readies ${getItem(actor.reserveEquipment.shield).name} for the shield wall.`);
}

function companyInMeleeContact(battle) {
  const company = battle.units.filter(unit => unit.alive && unit.side === 'company');
  const enemies = battle.units.filter(unit => unit.alive && unit.side === 'enemy');
  return company.some(unit => enemies.some(enemy => hexDistance(unit, enemy) <= 1));
}

function formationStep(battle, actor, direction) {
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  return hexNeighbors(battle.field, actor)
    .filter(point => direction > 0 ? point.q === actor.q + 1 : point.q === actor.q - 1)
    .filter(point => !occupied.has(`${point.q},${point.r}`))
    .sort((a, b) => Math.abs(a.r - actor.r) - Math.abs(b.r - actor.r) || a.r - b.r)[0] ?? null;
}

function advanceFormationStep(battle, actor) {
  const plan = battle.formationAdvance;
  if (!plan || actor.side !== 'company') return null;
  const living = battle.units.filter(unit => unit.alive && unit.side === 'company');
  const [dq, dr] = FORMATION_DIRECTIONS[plan.direction];
  const reached = unit => unit.q === plan.origins[unit.id].q + dq * plan.step
    && unit.r === plan.origins[unit.id].r + dr * plan.step;
  if (living.every(reached)) {
    if (plan.completedRound === 0) plan.completedRound = battle.round;
    if (companyInMeleeContact(battle) || plan.completedRound >= battle.round) return null;
    plan.origins = Object.fromEntries(battle.units.filter(unit => unit.side === 'company').map(unit => [unit.id, { q: unit.q, r: unit.r }]));
    plan.step = 1;
    plan.direction = chooseFormationDirection(battle, living);
    plan.startedRound = battle.round;
    plan.completedRound = 0;
  }
  if (reached(actor)) return null;
  const [moveQ, moveR] = FORMATION_DIRECTIONS[plan.direction];
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const destination = { q: actor.q + moveQ, r: actor.r + moveR };
  if (!tileAt(battle.field, destination.q, destination.r) || occupied.has(`${destination.q},${destination.r}`)) return null;
  const from = { q: actor.q, r: actor.r };
  const cost = battleMovementCost(battle, actor, actor, destination);
  actor.q = destination.q;
  actor.r = destination.r;
  actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + movementFatigue(actor, cost));
  if (living.every(reached)) plan.completedRound = battle.round;
  return from;
}

function moveOneFormationHex(battle, actor, destination, message) {
  const from = { q: actor.q, r: actor.r };
  const cost = battleMovementCost(battle, actor, actor, destination);
  actor.q = destination.q;
  actor.r = destination.r;
  actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + movementFatigue(actor, cost));
  actor.ap = 0;
  battle.lastEvent = makeBattleEvent(actor, null, 'move', message, getItem(actor.equipment.weapon), from);
  battleLog(battle, message);
  nextBattleTurn(battle);
}

function shieldWallReformStep(state, actor) {
  const battle = state.battle;
  const company = battle.units.filter(unit => unit.alive && unit.side === 'company');
  const shields = company.filter(unit => hasShieldSet(unit) && !companyArcherWeapon(state, unit));
  if (!shields.length) return null;
  const shieldDuty = shields.includes(actor);
  const rear = company.filter(unit => !shields.includes(unit));
  const shieldFrontQ = Math.max(...shields.map(unit => unit.q));
  if (shieldDuty && rear.some(unit => unit.q >= actor.q)) return formationStep(battle, actor, 1);
  if (!shieldDuty && actor.q >= shieldFrontQ) return formationStep(battle, actor, -1);
  return null;
}

function rangedTerrainModifier(battle, actor, from, target) {
  return heightHitModifier(battle.field, from, target)
    + (hasPerk(actor, 'bullseye') ? 0 : rangedCoverModifier(battle.field, from, target));
}

function pathToTarget(battle, actor, target, range, keepRangedSpace = false) {
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const queue = [{ q: actor.q, r: actor.r, path: [], cost: 0 }];
  const best = new Map([[`${actor.q},${actor.r}`, 0]]);
  let goal = null;
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost || a.q - b.q || a.r - b.r);
    const point = queue.shift();
    if (point.cost > best.get(`${point.q},${point.r}`)) continue;
    if (goal && point.cost > goal.cost) break;
    if (hexDistance(point, target) <= range && (!keepRangedSpace || nearestEnemyDistance(battle, actor, point) >= 2)) {
      const aim = keepRangedSpace ? rangedTerrainModifier(battle, actor, point, target) : heightHitModifier(battle.field, point, target);
      const safety = tileAt(battle.field, point.q, point.r).terrain === 'trees' ? 5 : 0;
      const quality = aim + safety;
      if (!goal || quality > goal.quality) goal = { path: point.path, cost: point.cost, quality };
      continue;
    }
    for (const next of openNeighbors(battle, point, occupied)) {
      if (keepRangedSpace && nearestEnemyDistance(battle, actor, next) < 2) continue;
      const key = `${next.q},${next.r}`;
      const cost = point.cost + battleMovementCost(battle, actor, point, next);
      if (cost < (best.get(key) ?? Infinity)) {
        best.set(key, cost);
        queue.push({ ...next, path: [...point.path, next], cost });
      }
    }
  }
  return goal?.path ?? (keepRangedSpace && hexDistance(actor, target) <= range ? [] : null);
}

function archerRetreatOption(battle, actor, range) {
  const enemies = battle.units.filter(unit => unit.alive && unit.side !== actor.side);
  const nearest = Math.min(...enemies.map(unit => hexDistance(actor, unit)));
  if (nearest > 1) return null;
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  return openNeighbors(battle, actor, occupied)
    .map(point => ({ ...point, cost: battleMovementCost(battle, actor, actor, point), safety: Math.min(...enemies.map(unit => hexDistance(point, unit))) }))
    .filter(point => point.safety > nearest && enemies.some(unit => hexDistance(point, unit) <= range))
    .sort((a, b) => b.safety - a.safety || a.cost - b.cost || a.q - b.q || a.r - b.r)[0];
}

function stepArcherBack(battle, actor, range) {
  const option = archerRetreatOption(battle, actor, range);
  if (!option) return false;
  actor.q = option.q;
  actor.r = option.r;
  actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + movementFatigue(actor, option.cost));
  return true;
}

function betterRangedPosition(battle, actor, target, range) {
  if (hexDistance(actor, target) > range) return null;
  const current = rangedTerrainModifier(battle, actor, actor, target);
  if (current > -12) return null;
  const safety = nearestEnemyDistance(battle, actor, actor);
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  return openNeighbors(battle, actor, occupied)
    .filter(point => hexDistance(point, target) <= range && nearestEnemyDistance(battle, actor, point) >= Math.max(2, safety))
    .map(point => ({ point, cost: battleMovementCost(battle, actor, actor, point), quality: rangedTerrainModifier(battle, actor, point, target) }))
    .filter(option => option.quality >= current + 10)
    .sort((a, b) => b.quality - a.quality || a.cost - b.cost || a.point.q - b.point.q || a.point.r - b.point.r)[0]?.point ?? null;
}

function isBow(weapon) {
  return weapon?.ranged === true && !weapon.throwing && weapon.visual?.includes('bow') && !weapon.visual.includes('crossbow');
}

function isCrossbow(weapon) {
  return weapon?.ranged === true && !weapon.throwing && weapon.visual?.includes('crossbow');
}

const SWORD_VISUALS = new Set(['sword', 'longsword', 'greatsword', 'shamshir', 'estoc', 'cleaver', 'falx']);
const AXE_VISUALS = new Set(['axe', 'greataxe', 'hand-axe', 'longaxe', 'bardiche', 'throwingaxe', 'heavythrowingaxe']);
const MACE_VISUALS = new Set(['mace', 'hammer', 'heavyhammer', 'polehammer', 'flail', 'three-headed-flail', 'goedendag']);
const DAGGER_VISUALS = new Set(['dagger', 'fighting-knife', 'qatal']);

function weaponTrainingHit(actor, weapon) {
  if (hasPerk(actor, 'sword-training') && SWORD_VISUALS.has(weapon.visual)) return 8;
  if (hasPerk(actor, 'spear-training') && !weapon.throwing && /spear|pike/.test(weapon.visual ?? '')) return 8;
  if (hasPerk(actor, 'throwing-training') && weapon.throwing) return 8;
  return 0;
}

function effectiveWeaponRange(actor, weapon) {
  return (weapon?.range ?? 1) + (isBow(weapon) && hasPerk(actor, 'bow-mastery') ? 1 : 0);
}

function moraleDamage(unit, amount) {
  return hasPerk(unit, 'fortified-mind') ? Math.ceil(amount * .8) : amount;
}

function attackTarget(state, actor, target, weapon) {
  const battle = state.battle;
  const ranged = weapon.ranged === true;
  if (ranged && actor.side === 'company') state.supplies.ammo -= 1;
  const skill = ranged ? actor.rangedSkill : actor.meleeSkill;
  const dodgeDefense = hasPerk(target, 'dodge') ? Math.floor(Math.max(0, target.initiative - target.fatigue * .2) * .15) : 0;
  const anticipationDefense = ranged && hasPerk(target, 'anticipation')
    ? Math.max(10, Math.floor(target.rangedDefense * .1 * hexDistance(actor, target)))
    : 0;
  const defense = (ranged ? target.rangedDefense : target.meleeDefense) + dodgeDefense + anticipationDefense
    + (hasPerk(target, 'last-stand') && target.hp * 2 <= target.maxHp ? 8 : 0)
    + (target.side === 'company' && battle.tactic === 'defense' ? 5 : 0);
  const terrainHit = ranged ? rangedTerrainModifier(battle, actor, actor, target) : heightHitModifier(battle.field, actor, target);
  const adjacentAllies = !ranged && hasPerk(actor, 'backstabber')
    ? battle.units.filter(unit => unit.alive && unit.side === actor.side && unit.id !== actor.id && hexDistance(unit, target) <= 1).length
    : 0;
  const adaptationBonus = hasPerk(actor, 'fast-adaptation') ? actor.adaptation * 10 : 0;
  const distance = hexDistance(actor, target);
  const higher = tileAt(battle.field, actor.q, actor.r).height > tileAt(battle.field, target.q, target.r).height;
  const perkHit = weaponTrainingHit(actor, weapon) + (hasPerk(actor, 'high-ground') && higher ? 8 : 0)
    + (ranged && distance >= 3 && hasPerk(actor, 'marksman') ? 8 : 0);
  const adjacentShotPenalty = ranged && distance === 1 && !hasPerk(actor, 'point-blank') ? 12 : 0;
  const chance = clamped(skill + (weapon.hitBonus ?? 0) - defense + 15 + terrainHit + adjacentAllies * 5 + adaptationBonus + perkHit + Math.floor((actor.morale - 50) / 8) - Math.floor(actor.fatigue / 7) - adjacentShotPenalty, 12, 90);
  const mastered = isBow(weapon) && hasPerk(actor, 'bow-mastery') || isCrossbow(weapon) && hasPerk(actor, 'crossbow-mastery');
  const fatigueCost = weapon.fatigueCost ?? (ranged ? 9 : 11);
  actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + (mastered ? Math.ceil(fatigueCost * .75) : fatigueCost));
  if (weapon.reloadTurns) actor.reload = weapon.reloadTurns;
  actor.ap = 0;
  if (actor.side === 'company' || !ranged && hexDistance(actor, target) <= 1) battle.lastContactRound = battle.round;
  if (!ranged && hexDistance(actor, target) <= 1) battle.engaged = true;
  if (battleRoll(battle) * 100 >= chance) {
    if (hasPerk(actor, 'fast-adaptation')) actor.adaptation += 1;
    const message = `${actor.name} misses ${target.name}.`;
    battle.lastEvent = makeBattleEvent(actor, target, 'miss', message, weapon);
    battleLog(battle, message);
    return;
  }
  actor.adaptation = 0;
  const baseDamage = weapon.damageMin + Math.floor(battleRoll(battle) * (weapon.damageMax - weapon.damageMin + 1));
  const damageMultiplier = (hasPerk(actor, 'executioner') && target.hp < target.maxHp ? 1.2 : 1)
    * (hasPerk(actor, 'killing-frenzy') && actor.frenzyUntilRound >= battle.round ? 1.25 : 1)
    * (hasPerk(actor, 'polearm-training') && !ranged && (weapon.range ?? 1) >= 2 ? 1.1 : 1)
    * (hasPerk(actor, 'shield-strike') && !ranged && actor.equipment.shield ? 1.1 : 1)
    * (hasPerk(actor, 'duelist') && !ranged && weapon.slot === 'weapon' && !weapon.twoHanded && !actor.equipment.shield ? 1.12 : 1)
    * (hasPerk(actor, 'opportunist') && !ranged && !target.equipment.shield ? 1.1 : 1)
    * (hasPerk(actor, 'volley-fire') && ranged && distance >= 3 ? 1.1 : 1);
  const raw = Math.round(baseDamage * damageMultiplier * (1 + (getItem(actor.equipment.mount)?.damageBonus ?? 0)) * (1 + Math.max(0, heightHitModifier(battle.field, actor, target) / 10) * .1));
  const head = battleRoll(battle) < .22;
  const part = head ? 'headArmor' : 'bodyArmor';
  const armorBefore = target[part];
  const armorDamage = Math.max(1, Math.round(raw * (weapon.armorDamage ?? 1) * (head ? 1.1 : 1)
    * (hasPerk(actor, 'axe-training') && AXE_VISUALS.has(weapon.visual) ? 1.15 : 1)
    * (hasPerk(target, 'battle-forged') && armorBefore > 0 ? .85 : 1)));
  target[part] = Math.max(0, armorBefore - armorDamage);
  const armorPiercing = Math.min(1, (weapon.armorPiercing ?? .30) + (isCrossbow(weapon) && hasPerk(actor, 'crossbow-mastery') ? .2 : 0)
    + (hasPerk(actor, 'dagger-training') && DAGGER_VISUALS.has(weapon.visual) ? .15 : 0));
  let hpDamage = armorBefore > 0
    ? Math.max(1, Math.floor(raw * armorPiercing - armorBefore * .025) + Math.max(0, Math.floor((armorDamage - armorBefore) * .25)))
    : raw;
  if (head && !hasPerk(target, 'steel-brow')) hpDamage = Math.round(hpDamage * 1.25);
  if (hasPerk(actor, 'mace-training') && MACE_VISUALS.has(weapon.visual)) hpDamage = Math.round(hpDamage * 1.1);
  if (hasPerk(target, 'iron-jaw')) hpDamage = Math.max(1, Math.round(hpDamage * .8));
  target.hp = Math.max(0, target.hp - hpDamage);
  target.morale = Math.max(0, target.morale - moraleDamage(target, 3 + (hasPerk(actor, 'fearsome') && hpDamage > 0 ? 10 : 0)));
  const fallen = target.hp === 0;
  const perkProcs = [];
  if (fallen) {
    target.alive = false;
    target.ap = 0;
    for (const ally of battle.units.filter(unit => unit.side === target.side && unit.alive)) ally.morale = Math.max(0, ally.morale - moraleDamage(ally, 12));
    if (actor.side === 'company') battle.xp[actor.id] = (battle.xp[actor.id] ?? 0) + 20;
    if (hasPerk(actor, 'killing-frenzy')) {
      actor.frenzyUntilRound = battle.round + 2;
      perkProcs.push('Killing Frenzy: +25% damage.');
    }
    if (hasPerk(actor, 'berserk') && actor.berserkRound !== battle.round) {
      actor.ap = 2;
      actor.berserkRound = battle.round;
      perkProcs.push('Berserk: +2 AP.');
    }
  }
  const message = `${actor.name} hits ${target.name}${head ? ' in the head' : ''} for ${hpDamage} health and ${Math.min(armorBefore, armorDamage)} armor${fallen ? '; they fall' : ''}.${perkProcs.length ? ` ${perkProcs.join(' ')}` : ''}`;
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
  if (actor.turnStartedRound !== battle.round) {
    actor.fatigue = Math.max(0, actor.fatigue - 6);
    actor.turnStartedRound = battle.round;
  }
  const formationMoveFrom = battle.tactic === 'advance-formation' ? advanceFormationStep(battle, actor) : null;
  if (readyShieldWallSet(state, actor)) return result(true, battle.lastEvent.message);
  if (useBattleAccessory(state, actor, enemies)) {
    if (formationMoveFrom) battle.lastEvent.moveFrom = formationMoveFrom;
    return result(true, battle.lastEvent.message);
  }
  if (chooseBattleWeapon(state, actor, enemies)) {
    if (formationMoveFrom) battle.lastEvent.moveFrom = formationMoveFrom;
    return result(true, battle.lastEvent.message);
  }
  const equippedWeapon = getItem(actor.equipment.weapon);
  if (actor.reload > 0) {
    actor.reload -= 1;
    actor.ap = 0;
    if (hasPerk(actor, 'reload-drill')) actor.fatigue = Math.max(0, actor.fatigue - 12);
    const message = `${actor.name} reloads ${equippedWeapon?.name ?? 'their weapon'}.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equippedWeapon);
    if (formationMoveFrom) battle.lastEvent.moveFrom = formationMoveFrom;
    battleLog(battle, message);
    nextBattleTurn(battle);
    return result(true, message);
  }
  if (actor.fatigue >= actor.maxFatigue - 10) {
    actor.fatigue = hasPerk(actor, 'recover')
      ? Math.max(0, actor.fatigue - Math.max(22, Math.ceil(actor.fatigue / 2)))
      : Math.max(0, actor.fatigue - 22);
    actor.ap = 0;
    const message = `${actor.name} catches their breath.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equippedWeapon);
    if (formationMoveFrom) battle.lastEvent.moveFrom = formationMoveFrom;
    battleLog(battle, message);
    nextBattleTurn(battle);
    return result(true, message);
  }
  const bowWithoutAmmo = equippedWeapon?.ranged && actor.side === 'company' && state.supplies.ammo < 1;
  const weapon = bowWithoutAmmo ? { damageMin: 8, damageMax: 12, hitBonus: -12, armorDamage: .4, range: 1 } : equippedWeapon ?? { damageMin: 8, damageMax: 12, hitBonus: -10, armorDamage: .4, range: 1 };
  const range = effectiveWeaponRange(actor, weapon);
  const initialPosition = { q: actor.q, r: actor.r };
  const archerBackup = state.supplies.ammo > 0 && !weapon.ranged && companyArcherWeapon(state, actor);
  const retreated = battle.tactic !== 'advance-formation' && (weapon.ranged || archerBackup) && stepArcherBack(battle, actor, archerBackup ? effectiveWeaponRange(actor, archerBackup) : range);
  if (retreated && battle.tactic === 'shield-wall') battle.formationAdvance = makeFormationAdvancePlan(battle);
  if (archerBackup) {
    const target = enemies.filter(enemy => hexDistance(actor, enemy) <= range)
      .sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))[0];
    if (!retreated && target) attackTarget(state, actor, target, weapon);
    else {
      actor.ap = 0;
      if (!retreated) actor.fatigue = Math.max(0, actor.fatigue - 12);
      const message = retreated ? `${actor.name} falls back from close combat.`
        : `${actor.name} holds position${state.supplies.ammo === 0 ? '; the company is out of ammunition' : ' with a backup weapon ready'}.`;
      battle.lastEvent = makeBattleEvent(actor, null, retreated ? 'move' : 'hold', message, equippedWeapon, retreated ? initialPosition : null);
      battleLog(battle, message);
    }
    if (formationMoveFrom) battle.lastEvent.moveFrom = formationMoveFrom;
    if (!finishBattlePhase(battle) && actor.ap <= 0) nextBattleTurn(battle);
    return result(true, battle.lastEvent.message);
  }
  const defenseKey = weapon.ranged ? 'rangedDefense' : 'meleeDefense';
  const vulnerability = target => target.hp + (target.bodyArmor + target.headArmor) * .15 + target[defenseKey] * .3;
  const targets = enemies.map(target => ({ target, path: pathToTarget(battle, actor, target, range, weapon.ranged === true) }))
    .filter(entry => entry.path !== null)
    .sort((a, b) => pathCost(battle, actor, actor, a.path) - pathCost(battle, actor, actor, b.path)
      || vulnerability(a.target) - vulnerability(b.target)
        - (weapon.ranged ? rangedTerrainModifier(battle, actor, actor, a.target)
          - rangedTerrainModifier(battle, actor, actor, b.target) : 0)
      || hexDistance(actor, a.target) - hexDistance(actor, b.target) || a.target.id.localeCompare(b.target.id));
  if (actor.side === 'company' && battle.focusTargetId && !enemies.some(enemy => enemy.id === battle.focusTargetId)) battle.focusTargetId = null;
  const companyTactic = actor.side === 'company' ? battle.tactic : 'offense';
  let choice = targets[0];
  if (companyTactic === 'focus') {
    const shared = targets.find(entry => entry.target.id === battle.focusTargetId);
    choice = shared ?? [...targets].sort((a, b) => vulnerability(a.target) + pathCost(battle, actor, actor, a.path) * 3 - vulnerability(b.target) - pathCost(battle, actor, actor, b.path) * 3 || a.target.id.localeCompare(b.target.id))[0];
    if (choice) battle.focusTargetId = choice.target.id;
  } else if (companyTactic === 'defense') {
    choice = targets.find(entry => entry.path.length === 0);
    if (!choice && !(battle.engaged && targets[0] && pathCost(battle, actor, actor, targets[0].path) <= 3) && battle.round - battle.lastContactRound < 4) {
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
  if (actor.side === 'company' && companyTactic === 'advance-formation' && choice) {
    const { target } = choice;
    if (hexDistance(actor, target) <= range) {
      attackTarget(state, actor, target, weapon);
      if (formationMoveFrom) battle.lastEvent.moveFrom = formationMoveFrom;
      if (!finishBattlePhase(battle) && actor.ap <= 0) nextBattleTurn(battle);
      return result(true, battle.lastEvent.message);
    }
    actor.ap = 0;
    const message = formationMoveFrom ? `${actor.name} advances one step with the formation.` : `${actor.name} holds formation.`;
    battle.lastEvent = makeBattleEvent(actor, null, formationMoveFrom ? 'move' : 'hold', message, equippedWeapon, formationMoveFrom);
    battle.lastEvent.targetId = target.id;
    battleLog(battle, message);
    if (!finishBattlePhase(battle) && actor.ap <= 0) nextBattleTurn(battle);
    return result(true, battle.lastEvent.message);
  }
  if (actor.side === 'company' && companyTactic === 'shield-wall' && choice) {
    const reform = shieldWallReformStep(state, actor);
    if (reform) {
      moveOneFormationHex(battle, actor, reform, `${actor.name} reforms the shield wall.`);
      battle.formationAdvance = makeFormationAdvancePlan(battle);
      return result(true, battle.lastEvent.message);
    }
    if (choice.path.length === 0) {
      attackTarget(state, actor, choice.target, weapon);
      if (!finishBattlePhase(battle) && actor.ap <= 0) nextBattleTurn(battle);
      return result(true, battle.lastEvent.message);
    }
    const shields = battle.units.filter(unit => unit.alive && unit.side === 'company' && hasShieldSet(unit));
    const timedAdvance = battle.round - battle.lastContactRound >= 4;
    const wallMoveFrom = timedAdvance ? advanceFormationStep(battle, actor) : null;
    if (wallMoveFrom) {
      actor.ap = 0;
      const message = `${actor.name} advances with the shield wall.`;
      battle.lastEvent = makeBattleEvent(actor, null, 'move', message, equippedWeapon, wallMoveFrom);
      battleLog(battle, message);
      nextBattleTurn(battle);
      return result(true, battle.lastEvent.message);
    }
    const immediateGap = !isPureRangedUnit(actor) && !hasShieldSet(actor) && (getItem(actor.equipment.weapon)?.range ?? 1) <= 2
      && shields.length && choice.path.length === 1 && actor.q < Math.max(...shields.map(unit => unit.q));
    if (!immediateGap) {
      actor.ap = 0;
      actor.fatigue = Math.max(0, actor.fatigue - 12);
      const message = `${actor.name} holds behind the shield wall.`;
      battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, equippedWeapon);
      battleLog(battle, message);
      nextBattleTurn(battle);
      return result(true, message);
    }
  }
  if (!choice) {
    actor.ap = 0;
    const message = `${actor.name} holds position and catches their breath.`;
    actor.fatigue = Math.max(0, actor.fatigue - 12);
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equippedWeapon);
    if (formationMoveFrom) battle.lastEvent.moveFrom = formationMoveFrom;
    battleLog(battle, message);
    nextBattleTurn(battle);
    return result(true, message);
  }
  if (retreated) {
    const ready = targets.filter(entry => hexDistance(actor, entry.target) <= range);
    choice = ready.find(entry => entry.target.id === battle.focusTargetId) ?? ready[0] ?? choice;
  }
  const { target } = choice;
  let { path } = choice;
  if (weapon.ranged && !retreated && path.length === 0) {
    const better = betterRangedPosition(battle, actor, target, range);
    if (better) path = [better];
  }
  if (retreated) path = [];
  if (path.length) {
    let used = 0;
    let destination = actor;
    for (const next of path) {
      const cost = battleMovementCost(battle, actor, destination, next);
      if (used + cost > movementBudget(actor)) break;
      used += cost;
      destination = next;
    }
    actor.q = destination.q;
    actor.r = destination.r;
    actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + movementFatigue(actor, used));
    if (companyTactic === 'shield-wall') battle.formationAdvance = makeFormationAdvancePlan(battle);
  }
  if (hexDistance(actor, target) <= range) {
    attackTarget(state, actor, target, weapon);
    if (initialPosition.q !== actor.q || initialPosition.r !== actor.r) battle.lastEvent.moveFrom = initialPosition;
  } else {
    actor.ap = 0;
    const message = retreated ? `${actor.name} falls back from ${target.name}.` : `${actor.name} advances toward ${target.name}.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'move', message, equippedWeapon, initialPosition);
    battle.lastEvent.targetId = target.id;
    battleLog(battle, message);
  }
  if (!finishBattlePhase(battle) && actor.ap <= 0) nextBattleTurn(battle);
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
    unit.morale = Math.max(0, unit.morale - moraleDamage(unit, 12));
  }
  battle.lastEvent = makeBattleEvent(null, null, 'retreat', 'The company retreats, losing two provisions and taking wounds.');
  battleLog(battle, battle.lastEvent.message);
  return result(true, battle.lastEvent.message);
}

export function finishBattle(state) {
  const battle = state.battle;
  if (!battle || battle.status === 'active') return result(false, 'Finish the fight before claiming its result.');
  const victory = battle.status === 'victory';
  const formation = getFormation(state);
  const survivors = [];
  for (const person of state.party) {
    const unit = battle.units.find(entry => entry.id === person.id);
    if (!unit) continue;
    const carriedAccessories = [...unit.accessories];
    if (unit.pocketDrawnFrom !== null) carriedAccessories[unit.pocketDrawnFrom] = unit.equipment.weapon;
    if (!unit.alive) {
      if (victory) {
        for (const [itemId, condition] of [
          ...SLOTS.map(slot => [person.equipment[slot], slot === 'armor' ? unit.bodyArmor : slot === 'helmet' ? unit.headArmor : null]),
          ...['weapon', 'shield'].map(slot => [person.reserveEquipment[slot], null]),
          ...carriedAccessories.map(id => [id, null]),
        ]) {
          if (itemId && state.inventory.length < MAX_INVENTORY) {
            state.inventory.push(itemId);
            state.inventoryCondition.push(condition);
          }
        }
      }
      continue;
    }
    person.hp = unit.hp;
    person.morale = unit.morale;
    person.accessories = carriedAccessories;
    person.armorDurability = { body: unit.bodyArmor, head: unit.headArmor };
    const earnedXp = battle.xp[person.id] ?? 0;
    person.xp += hasPerk(person, 'student') ? Math.round(earnedXp * 1.2) : earnedXp;
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
  const survivingIds = new Set(survivors.map(person => person.id));
  state.formation = formation.map(id => survivingIds.has(id) ? id : null);
  if (victory) {
    const loot = battle.loot;
    state.gold += loot.gold;
    state.food += loot.food;
    for (const kind of ['tools', 'medicine', 'ammo']) state.supplies[kind] += loot[kind];
    for (let index = 0; index < loot.items.length; index++) {
      if (state.inventory.length >= MAX_INVENTORY) break;
      const itemId = loot.items[index];
      state.inventory.push(itemId);
      state.inventoryCondition.push(loot.itemConditions?.[index] ?? itemCondition(itemId));
    }
    if (battle.encounterType === 'band') {
      const previous = state.bands[battle.campId];
      const defeatedCycle = bandSpawnCycle(state, battle.campId);
      state.bands[battle.campId] = { ...previous, defeatedUntil: worldHours(state) + 48,
        spawnCycle: (previous?.spawnCycle ?? (previous ? 1 : 0)) + 1, behavior: 'patrolling', targetId: null };
      for (const [townId, shipment] of Object.entries(state.shipments ?? {})) {
        if ((shipment.status !== 'en-route' && shipment.status !== 'under-attack')
          || shipment.attackerId !== battle.campId || shipment.attackerSpawnCycle !== defeatedCycle) continue;
        shipment.status = 'en-route';
        shipment.attackerId = null;
        shipment.attackerSpawnCycle = null;
        shipment.attackHour = null;
        shipment.raidCleared = true;
        record(state, `The road to ${TOWN_BY_ID.get(townId).name} is safe again; its armorer wagon can continue.`);
      }
    }
    else { const camp=getCampSites(state).find(site=>site.id===battle.campId); state.camps[battle.campId] = { clearedDay:state.day,respawnAt:worldHours(state)+(camp.random?72:120),generation:camp.generation }; }
  }
  state.gameOver = state.party.length === 0;
  state.encounterGraceUntil = Math.max(state.encounterGraceUntil ?? 0, worldHours(state) + ENCOUNTER_GRACE_HOURS);
  if (!victory && battle.encounterType === 'band' && state.bands[battle.campId]) {
    state.bands[battle.campId].behavior = 'patrolling';
    state.bands[battle.campId].targetId = null;
  }
  const message = victory ? `The company claims ${battle.loot.gold} crowns and defeats ${battle.encounterName}.` : state.gameOver ? 'The company has fallen.' : 'The company survives and leaves the battlefield behind.';
  record(state, message);
  state.battle = null;
  return result(true, message);
}

function assert(condition, message) { if (!condition) throw new TypeError(`Invalid save: ${message}`); }
function validCount(value) { return Number.isSafeInteger(value) && value >= 0; }
function validPoint(point) { return point && typeof point === 'object' && !Array.isArray(point) && inBounds(point.x, point.y); }
function recordObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function validHex(point, field) { return recordObject(point) && Number.isSafeInteger(point.q) && point.q >= 0 && point.q < field.columns && Number.isSafeInteger(point.r) && point.r >= 0 && point.r < field.rows; }

function validateBattleField(input) {
  if (input === undefined) return legacyBattleField();
  assert(recordObject(input) && (input.columns === 14 && input.rows === 8 || input.columns === 10 && input.rows === 5), 'battle field size');
  assert(['plains', 'forest', 'mountain', 'marsh'].includes(input.biome), 'battle field biome');
  assert(Array.isArray(input.tiles) && input.tiles.length === input.columns * input.rows, 'battle field tiles');
  const tiles = input.tiles.map((tile, index) => {
    const q = Math.floor(index / input.rows);
    const r = index % input.rows;
    assert(recordObject(tile) && tile.q === q && tile.r === r && ['open', 'trees', 'brush', 'mud', 'rock'].includes(tile.terrain) && Number.isSafeInteger(tile.height) && tile.height >= 0 && tile.height <= 2, 'battle field tile');
    return { q, r, terrain: tile.terrain, height: tile.height };
  });
  return { columns: input.columns, rows: input.rows, biome: input.biome, tiles };
}

function validateBattle(input, party, worldState) {
  if (input === undefined || input === null) return null;
  const encounterType = input.encounterType ?? 'camp';
  assert(recordObject(input) && (encounterType === 'camp' ? isCampId(input.campId) : encounterType === 'band' && BAND_BY_ID.has(input.campId)), 'battle encounter');
  const encounter = encounterType === 'band' ? BAND_BY_ID.get(input.campId) : getCampSites(worldState).find(camp=>camp.id===input.campId);
  const encounterName = encounter.name;
  const difficulty = input.difficulty ?? encounter.difficulty ?? 0;
  assert(Number.isSafeInteger(difficulty) && difficulty >= 0 && difficulty <= 3, 'battle difficulty');
  const campGeneration = input.campGeneration ?? (encounterType === 'camp' ? encounter.generation : null);
  assert(encounterType === 'band' ? campGeneration === null : validCount(campGeneration) && campGeneration <= 1000000 && campGeneration === encounter.generation, 'battle camp generation');
  const famedDrop = input.famedDrop ?? null;
  const famedItem = getItem(famedDrop);
  const famedSeed = hashSeed(`${worldState.seed}:${encounter.id}:${campGeneration}:famed-item`);
  const famedRoll = hashSeed(`${worldState.seed}:${encounter.id}:${campGeneration}:famed-roll`) % 10000;
  assert(famedDrop === null || encounterType === 'camp' && famedItem?.rarity === 'famed'
    && FAMED_BASES[difficulty]?.includes(famedItem.baseId)
    && famedDrop === createFamedItemId(famedItem.baseId, famedSeed)
    && famedRoll < (FAMED_CHANCES[difficulty] ?? 0) * 10000, 'battle famed drop');
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
  const lootSeed = input.lootSeed ?? hashSeed(input.id);
  assert(validCount(lootSeed) && lootSeed <= 0xffffffff, 'battle loot seed');
  const field = validateBattleField(input.field);
  assert(Array.isArray(input.units) && input.units.length >= 2 && input.units.length <= MAX_COMPANY_SIZE + 12, 'battle units');
  const ids = new Set();
  const partyIds = new Set(party.map(person => person.id));
  const units = input.units.map(unit => {
    assert(recordObject(unit) && typeof unit.id === 'string' && unit.id.length <= 40 && !ids.has(unit.id), 'battle unit id');
    ids.add(unit.id);
    assert(unit.side === 'company' || unit.side === 'enemy', 'battle side');
    assert(unit.side === 'company' ? partyIds.has(unit.id) : /^enemy-([1-9]|1[0-2])$/.test(unit.id), 'battle unit ownership');
    assert(typeof unit.name === 'string' && unit.name.length > 0 && unit.name.length <= 80, 'battle unit name');
    assert(validHex(unit, field), 'battle hex');
    assert(validCount(unit.maxHp) && unit.maxHp >= 1 && unit.maxHp <= 300 && validCount(unit.hp) && unit.hp <= unit.maxHp && unit.alive === (unit.hp > 0), 'battle health');
    assert(recordObject(unit.equipment), 'battle equipment');
    for (const slot of SLOTS) assert(unit.equipment[slot] === null || slot === 'mount' && unit.equipment[slot] === undefined || getItem(unit.equipment[slot])?.slot === slot, 'battle equipment');
    assert(!getItem(unit.equipment.weapon)?.twoHanded || !unit.equipment.shield, 'battle two handed weapon');
    const reserveEquipment = unit.reserveEquipment ?? { weapon: null, shield: null };
    const accessories = unit.accessories ?? [null, null];
    const partyMember = unit.side === 'company' ? party.find(person => person.id === unit.id) : null;
    if (partyMember) assert((unit.equipment.mount ?? null) === (partyMember.equipment.mount ?? null), 'battle mount owner');
    const perks = unit.perks ?? partyMember?.perks ?? [];
    assert(Array.isArray(perks) && perks.every(id => typeof id === 'string' && PERK_BY_ID.has(id)) && new Set(perks).size === perks.length, 'battle perks');
    assert(unit.side === 'enemy' ? perks.length === 0 : perks.length === (partyMember.perks ?? []).length && perks.every((id, index) => id === partyMember.perks[index]), 'battle perk owner');
    const adaptation = unit.adaptation ?? 0;
    const berserkRound = unit.berserkRound ?? 0;
    const frenzyUntilRound = unit.frenzyUntilRound ?? 0;
    const turnStartedRound = unit.turnStartedRound ?? 0;
    assert(validCount(adaptation) && adaptation <= 1000, 'battle adaptation');
    assert(validCount(berserkRound) && berserkRound <= input.round, 'battle berserk round');
    assert(validCount(frenzyUntilRound) && frenzyUntilRound <= input.round + 2, 'battle frenzy round');
    assert(validCount(turnStartedRound) && turnStartedRound <= input.round, 'battle turn started round');
    assert(recordObject(reserveEquipment) && (reserveEquipment.weapon === null || getItem(reserveEquipment.weapon)?.slot === 'weapon') && (reserveEquipment.shield === null || getItem(reserveEquipment.shield)?.slot === 'shield') && (!getItem(reserveEquipment.weapon)?.twoHanded || reserveEquipment.shield === null), 'battle reserve equipment');
    assert(Array.isArray(accessories) && accessories.length === 2 && accessories.every(id => id === null || getItem(id)?.slot === 'accessory' || getItem(id)?.pocketWeapon === true), 'battle accessories');
    const pocketDrawnFrom = unit.pocketDrawnFrom ?? null;
    const pocketStowedWeapon = unit.pocketStowedWeapon ?? null;
    assert(pocketDrawnFrom === null && pocketStowedWeapon === null || (pocketDrawnFrom === 0 || pocketDrawnFrom === 1) && accessories[pocketDrawnFrom] === null && getItem(unit.equipment.weapon)?.pocketWeapon === true && getItem(pocketStowedWeapon)?.ranged === true, 'battle pocket weapon');
    assert(validCount(unit.pocketStowedReload ?? 0) && (unit.pocketStowedReload ?? 0) <= 2 && validCount(unit.reserveReload ?? 0) && (unit.reserveReload ?? 0) <= 2, 'battle reserve reload');
    assert(validCount(unit.pocketDrawnRound ?? 0) && (unit.pocketDrawnRound ?? 0) <= input.round && (pocketDrawnFrom !== null || (unit.pocketDrawnRound ?? 0) === 0), 'battle pocket round');
    assert(unit.meleePhase === undefined || typeof unit.meleePhase === 'boolean', 'battle melee phase');
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
      equipment: Object.fromEntries(SLOTS.map(slot => [slot, unit.equipment[slot] ?? null])),
      reserveEquipment: { weapon: reserveEquipment.weapon, shield: reserveEquipment.shield }, accessories: [...accessories],
      pocketDrawnFrom, pocketStowedWeapon, pocketStowedReload: unit.pocketStowedReload ?? 0,
      pocketDrawnRound: unit.pocketDrawnRound ?? 0, reserveReload: unit.reserveReload ?? 0, meleePhase: unit.meleePhase ?? false,
      perks: [...perks], adaptation, berserkRound, frenzyUntilRound, turnStartedRound,
      seed: unit.seed, alive: unit.alive, morale: unit.morale, fatigue: unit.fatigue, ap: unit.ap, reload: unit.reload ?? 0,
      meleeSkill: unit.meleeSkill, rangedSkill: unit.rangedSkill,
      meleeDefense: unit.meleeDefense, rangedDefense: unit.rangedDefense,
      maxFatigue: unit.maxFatigue, initiative: unit.initiative, resolve: unit.resolve,
    };
  });
  assert(units.some(unit => unit.side === 'company') && units.some(unit => unit.side === 'enemy'), 'battle sides');
  assert(new Set(units.filter(unit => unit.alive).map(unit => `${unit.q},${unit.r}`)).size === units.filter(unit => unit.alive).length, 'battle occupied hexes');
  const focusTargetId = input.focusTargetId ?? null;
  assert(focusTargetId === null || units.some(unit => unit.side === 'enemy' && unit.id === focusTargetId), 'battle focus target');
  assert(units.filter(unit => unit.side === 'company').length === party.length, 'battle company roster');
  assert(units.filter(unit => unit.side === 'company').every(unit => party.some(person => person.id === unit.id)), 'battle company roster');
  const formationAdvanceInput = input.formationAdvance ?? null;
  assert(['advance-formation', 'shield-wall'].includes(tactic) ? recordObject(formationAdvanceInput) : formationAdvanceInput === null, 'battle formation advance');
  let formationAdvance = null;
  if (formationAdvanceInput) {
    const companyIds = units.filter(unit => unit.side === 'company').map(unit => unit.id);
    assert(formationAdvanceInput.step === 1
      && Object.hasOwn(FORMATION_DIRECTIONS, formationAdvanceInput.direction)
      && Number.isSafeInteger(formationAdvanceInput.startedRound) && formationAdvanceInput.startedRound >= 1 && formationAdvanceInput.startedRound <= input.round
      && validCount(formationAdvanceInput.completedRound) && formationAdvanceInput.completedRound <= input.round
      && recordObject(formationAdvanceInput.origins) && Object.keys(formationAdvanceInput.origins).length === companyIds.length
      && companyIds.every(id => validHex(formationAdvanceInput.origins[id], field))
      && new Set(units.filter(unit => unit.side === 'company' && unit.alive).map(unit => `${formationAdvanceInput.origins[unit.id].q},${formationAdvanceInput.origins[unit.id].r}`)).size === units.filter(unit => unit.side === 'company' && unit.alive).length
      && units.filter(unit => unit.side === 'company' && unit.alive).every(unit => {
        const [dq, dr] = FORMATION_DIRECTIONS[formationAdvanceInput.direction];
        const origin = formationAdvanceInput.origins[unit.id];
        return tileAt(field, origin.q + dq, origin.r + dr);
      }), 'battle formation advance plan');
    formationAdvance = { step: formationAdvanceInput.step, direction: formationAdvanceInput.direction, completedRound: formationAdvanceInput.completedRound, startedRound: formationAdvanceInput.startedRound,
      origins: Object.fromEntries(companyIds.map(id => [id, { q: formationAdvanceInput.origins[id].q, r: formationAdvanceInput.origins[id].r }])) };
  }
  const companyAlive = units.some(unit => unit.side === 'company' && unit.alive);
  const enemyAlive = units.some(unit => unit.side === 'enemy' && unit.alive);
  assert(input.status === 'active' ? companyAlive && enemyAlive : input.status === 'victory' ? companyAlive && !enemyAlive : input.status === 'defeat' ? !companyAlive : companyAlive, 'battle outcome');
  assert(Array.isArray(input.turnOrder) && input.turnOrder.length >= 1 && input.turnOrder.length <= units.length && input.turnOrder.every(id => ids.has(id)) && new Set(input.turnOrder).size === input.turnOrder.length, 'battle turn order');
  assert(units.filter(unit => unit.alive).every(unit => input.turnOrder.includes(unit.id)), 'battle living turns');
  assert(Number.isSafeInteger(input.turnIndex) && input.turnIndex >= 0 && input.turnIndex < input.turnOrder.length, 'battle turn index');
  assert(input.status === 'active' ? input.activeId === input.turnOrder[input.turnIndex] && units.some(unit => unit.id === input.activeId && unit.alive) : input.activeId === null, 'battle active unit');
  assert(Array.isArray(input.log) && input.log.length <= 120 && input.log.every(entry => typeof entry === 'string' && entry.length <= 300), 'battle log');
  const event = input.lastEvent;
  assert(event === null || (recordObject(event) && ['attack', 'move', 'hit', 'miss', 'fall', 'retreat', 'recover', 'hold', 'swap', 'use'].includes(event.type) && typeof event.message === 'string' && event.message.length <= 300 && (event.actorId === null || ids.has(event.actorId)) && (event.targetId === null || ids.has(event.targetId))), 'battle event');
  if (event?.head !== undefined) assert(typeof event.head === 'boolean', 'battle event head');
  if (event?.fallen !== undefined) assert(typeof event.fallen === 'boolean', 'battle event fallen');
  if (event?.weaponId !== undefined) assert(event.weaponId === null || getItem(event.weaponId)?.slot === 'weapon', 'battle event weapon');
  if (event?.itemId !== undefined) assert(getItem(event.itemId)?.slot === 'accessory', 'battle event item');
  if (event?.ranged !== undefined) assert(typeof event.ranged === 'boolean', 'battle event ranged');
  if (event?.projectile !== undefined) assert([null, 'arrow', 'bolt', 'javelin', 'axe'].includes(event.projectile), 'battle event projectile');
  for (const key of ['from', 'to', 'moveFrom']) if (event?.[key] !== undefined) assert(event[key] === null || validHex(event[key], field), `battle event ${key}`);
  for (const key of ['hpDamage', 'armorDamage']) if (event?.[key] !== undefined) assert(validCount(event[key]) && event[key] <= 1000, `battle event ${key}`);
  const actor = units.find(unit => unit.id === event?.actorId);
  const target = units.find(unit => unit.id === event?.targetId);
  const weaponId = event?.weaponId === undefined ? actor?.equipment.weapon ?? null : event.weaponId;
  const ranged = event?.ranged ?? (getItem(weaponId)?.ranged === true);
  const normalizedEvent = event ? {
    actorId: event.actorId, targetId: event.targetId, type: event.type === 'hit' || event.type === 'fall' ? 'attack' : event.type,
    weaponId, ranged, projectile: event.projectile === undefined ? ranged && ['attack', 'miss', 'hit', 'fall'].includes(event.type) ? projectileForWeapon(getItem(weaponId)) : null : event.projectile,
    ...(event.itemId === undefined ? {} : { itemId: event.itemId }),
    from: event.from === undefined ? actor ? { q: actor.q, r: actor.r } : null : event.from === null ? null : { q: event.from.q, r: event.from.r },
    to: event.to === undefined ? target ? { q: target.q, r: target.r } : actor ? { q: actor.q, r: actor.r } : null : event.to === null ? null : { q: event.to.q, r: event.to.r },
    ...(event.moveFrom === undefined ? {} : { moveFrom: event.moveFrom === null ? null : { q: event.moveFrom.q, r: event.moveFrom.r } }),
    message: event.message,
    ...(event.head !== undefined ? { head: event.head } : {}),
    ...(event.hpDamage !== undefined ? { hpDamage: event.hpDamage } : {}),
    ...(event.armorDamage !== undefined ? { armorDamage: event.armorDamage } : {}),
    ...(event.fallen !== undefined || event.type === 'fall' ? { fallen: event.fallen ?? true } : {}),
  } : null;
  const loot = input.loot;
  assert(recordObject(loot) && validCount(loot.gold) && loot.gold <= 100000 && Array.isArray(loot.items) && loot.items.length <= 24 && loot.items.every(id => getItem(id)), 'battle loot');
  const itemConditions = loot.itemConditions ?? loot.items.map(itemCondition);
  assert(Array.isArray(itemConditions) && itemConditions.length === loot.items.length && itemConditions.every((condition, index) => {
    const maximum = itemCondition(loot.items[index]);
    return maximum === null ? condition === null : validCount(condition) && condition <= maximum;
  }), 'battle loot condition');
  for (const key of ['food', 'tools', 'medicine', 'ammo']) assert(validCount(loot[key]) && loot[key] <= 1000, `battle loot ${key}`);
  assert(Array.isArray(input.casualties) && input.casualties.length <= MAX_COMPANY_SIZE && input.casualties.every(id => partyIds.has(id)) && new Set(input.casualties).size === input.casualties.length, 'battle casualties');
  assert(recordObject(input.xp) && Object.keys(input.xp).every(id => partyIds.has(id) && validCount(input.xp[id]) && input.xp[id] <= 1000), 'battle xp');
  return {
    id: input.id, campId: input.campId, encounterType, encounterName, difficulty, campGeneration, famedDrop, tactic, focusTargetId, lastContactRound, engaged, formationAdvance, status: input.status, round: input.round, activeId: input.activeId,
    field, units, turnOrder: [...input.turnOrder], turnIndex: input.turnIndex, rng: input.rng, lootSeed,
    log: [...input.log], lastEvent: normalizedEvent,
    loot: { gold: loot.gold, food: loot.food, tools: loot.tools, medicine: loot.medicine, ammo: loot.ammo, items: [...loot.items], itemConditions: [...itemConditions] },
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
  const hiredRecruitOffers = input.hiredRecruitOffers ?? [];
  assert(Array.isArray(hiredRecruitOffers) && hiredRecruitOffers.length <= 48 && hiredRecruitOffers.every(id => typeof id === 'string' && recruitOfferDay(id) !== null && recruitOfferDay(id) <= input.day) && new Set(hiredRecruitOffers).size === hiredRecruitOffers.length, 'hired recruit offers');
  assert(validPoint(input.position), 'position');
  assert(input.destination === null || validPoint(input.destination), 'destination');
  assert(Array.isArray(input.inventory) && input.inventory.length <= MAX_INVENTORY && input.inventory.every(id => getItem(id)), 'inventory');
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
  for (const [townId, market] of Object.entries(markets)) {
    assert(recordObject(market) && Number.isSafeInteger(market.day) && market.day >= 1 && market.day <= input.day && validCount(market.food) && market.food <= 100, 'market stock');
    assert(recordObject(market.goods) && GOODS.every(good => validCount(market.goods[good.id]) && market.goods[good.id] <= 100) && Object.keys(market.goods).length === GOODS.length, 'goods stock');
    assert(recordObject(market.equipment) && ITEMS.filter(item => !NEW_ITEM_IDS.has(item.id)).every(item => validCount(market.equipment[item.id]) && market.equipment[item.id] <= 1024) && Object.keys(market.equipment).every(id => ITEM_BY_ID.has(id) && validCount(market.equipment[id]) && market.equipment[id] <= 1024), 'equipment stock');
    if (market.buyback !== undefined) assert(Array.isArray(market.buyback) && market.buyback.length <= MAX_INVENTORY && market.buyback.every(entry => recordObject(entry) && getItem(entry.itemId)?.rarity === 'famed' && (itemCondition(entry.itemId) === null ? entry.condition === null : validCount(entry.condition) && entry.condition <= itemCondition(entry.itemId))), 'famed buyback');
    if (market.supplies !== undefined) assert(recordObject(market.supplies) && Object.keys(market.supplies).length === 3 && Object.keys(SUPPLY_INFO).every(kind => validCount(market.supplies[kind]) && market.supplies[kind] <= 100), 'supplies stock');
    if (market.armoryCycle !== undefined) assert(validCount(market.armoryCycle) && market.armoryCycle === armoryCycle(market.day), 'armory cycle');
    if (market.appliedEventId !== undefined && market.appliedEventId !== null) {
      assert(typeof market.appliedEventId === 'string' && market.appliedEventId.length <= 96, 'market event');
      const match = /^([a-z0-9-]+):([1-9]\d*):([a-z-]+)$/.exec(market.appliedEventId);
      const eventDay = Number(match?.[2]);
      const event = match && Number.isSafeInteger(eventDay) && eventDay <= input.day ? scheduledTownEvent({ seed: input.seed, day: eventDay }, TOWN_BY_ID.get(townId)) : null;
      assert(match && match[1] === townId && match[3] === 'armorer-shipment' && event?.id === market.appliedEventId, 'market event');
    }
  }
  const shipmentLegacyThroughDay = input.shipmentLegacyThroughDay ?? (input.shipments === undefined ? input.day : 0);
  assert(validCount(shipmentLegacyThroughDay) && shipmentLegacyThroughDay <= input.day, 'shipment migration');
  const shipments = input.shipments ?? {};
  assert(recordObject(shipments) && Object.keys(shipments).length <= SETTLEMENTS.length
    && Object.keys(shipments).every(id => TOWN_BY_ID.has(id)), 'shipments');
  const normalizedShipments = {};
  for (const [townId, shipment] of Object.entries(shipments)) {
    const legacyTiming = recordObject(shipment) && (Object.keys(shipment).length === 7
      || Object.keys(shipment).length === 8 && typeof shipment.raidCleared === 'boolean');
    const legacyRaid = recordObject(shipment) && Object.keys(shipment).length === 9;
    const currentRaid = recordObject(shipment) && Object.keys(shipment).length === 10;
    assert(recordObject(shipment) && (legacyTiming || legacyRaid || currentRaid)
      && ['startDay', 'originId', 'status', 'attackerId', 'attackerSpawnCycle', 'attackHour', 'resolvedHour']
        .every(key => Object.hasOwn(shipment, key))
      && (legacyTiming || ['travelHours', 'travelStartHour'].every(key => Object.hasOwn(shipment, key)))
      && (!currentRaid || Object.hasOwn(shipment, 'raidCleared') && typeof shipment.raidCleared === 'boolean'), 'shipment record');
    assert(Number.isSafeInteger(shipment.startDay) && shipment.startDay >= 1 && shipment.startDay <= input.day
      && shipment.startDay > shipmentLegacyThroughDay, 'shipment day');
    const town = TOWN_BY_ID.get(townId);
    const event = scheduledTownEvent({ seed: input.seed, day: shipment.startDay }, town);
    assert(event?.type === 'armorer-shipment' && event.startDay === shipment.startDay, 'shipment schedule');
    const now = worldHours(input);
    const departureHour = (shipment.startDay - 1) * 24;
    const active = shipment.status === 'en-route' || shipment.status === 'under-attack';
    const travelHours = legacyTiming ? (active ? CARAVAN_TRAVEL_HOURS : 30) : shipment.travelHours;
    const travelStartHour = legacyTiming ? (active ? 2 * departureHour - now : departureHour) : shipment.travelStartHour;
    assert((travelHours === CARAVAN_TRAVEL_HOURS || !active && travelHours === 30)
      && Number.isFinite(travelStartHour) && travelStartHour >= departureHour - 30
      && travelStartHour <= departureHour && (travelHours !== 30 || travelStartHour === departureHour), 'shipment timing');
    const plan = shipmentPlan(town, SETTLEMENTS, event, travelHours, travelStartHour);
    assert(shipment.originId === plan.originId && ['en-route', 'under-attack', 'delivered', 'lost'].includes(shipment.status), 'shipment route');
    const oldAttackHour = plan.departureHour + 13 + townEventHash(`${input.seed}:${townId}:${shipment.startDay}:attack-time`) % 4;
    assert(shipment.attackerId === null && shipment.attackerSpawnCycle === null && shipment.attackHour === null
      || BAND_BY_ID.has(shipment.attackerId) && validCount(shipment.attackerSpawnCycle)
        && shipment.attackerSpawnCycle <= 1000000
        && ((legacyRaid || legacyTiming) && shipment.attackHour === oldAttackHour
          || currentRaid && (shipment.attackHour === null || Number.isFinite(shipment.attackHour)
            && shipment.attackHour >= plan.departureHour && shipment.attackHour <= now)),
    'shipment attacker');
    if (shipment.status === 'en-route') assert(shipment.resolvedHour === null && now < (legacyTiming ? departureHour + 30 : plan.arrivalHour)
      && (currentRaid ? shipment.attackHour === null : shipment.attackHour === null || now < shipment.attackHour), 'shipment travel');
    if (shipment.status === 'under-attack') assert(shipment.attackerId !== null && shipment.resolvedHour === null
      && shipment.attackHour !== null && now >= shipment.attackHour
      && (currentRaid || now < shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS)
      && bandSpawnCycle(input, shipment.attackerId) === shipment.attackerSpawnCycle, 'shipment threat');
    if (shipment.status === 'delivered') assert(shipment.attackerId === null
      && shipment.resolvedHour === plan.arrivalHour && now >= shipment.resolvedHour, 'shipment delivery');
    if (shipment.status === 'lost') assert(shipment.attackerId !== null
      && (currentRaid ? shipment.resolvedHour >= shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS
        : shipment.resolvedHour === shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS)
      && now >= shipment.resolvedHour, 'shipment loss');
    normalizedShipments[townId] = { ...shipment, travelHours, travelStartHour,
      attackHour: (legacyTiming || legacyRaid) && shipment.status === 'en-route' ? null : shipment.attackHour,
      raidCleared: shipment.raidCleared ?? false };
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
    const backgroundDefinition = person.backgroundId === undefined ? null : RECRUIT_BACKGROUND_BY_ID.get(person.backgroundId);
    assert(person.backgroundId === undefined || backgroundDefinition && person.background === backgroundDefinition.name, 'person background id');
    const traits = person.traits ?? [];
    assert(Array.isArray(traits) && traits.length <= 2 && traits.every(id => typeof id === 'string' && RECRUIT_TRAIT_BY_ID.has(id)) && new Set(traits).size === traits.length, 'person traits');
    assert(backgroundDefinition ? traits.length >= 1 && RECRUIT_TRAIT_BY_ID.get(traits[0]).kind === 'positive' && (traits.length === 1 || RECRUIT_TRAIT_BY_ID.get(traits[1]).kind === 'tradeoff') : traits.length === 0, 'person trait kinds');
    assert(validCount(person.seed) && person.seed <= 0xffffffff, 'person seed');
    assert(Number.isFinite(person.morale) && person.morale >= 0 && person.morale <= 100, 'person morale');
    assert(person.equipment && typeof person.equipment === 'object' && !Array.isArray(person.equipment), 'equipment');
    for (const slot of SLOTS) {
      const itemId = slot === 'mount' ? person.equipment[slot] ?? null : person.equipment[slot];
      assert(itemId === null || getItem(itemId)?.slot === slot, `${slot} equipment`);
    }
    const reserve = person.reserveEquipment ?? { weapon: null, shield: null };
    const accessories = person.accessories ?? [null, null];
    assert(recordObject(reserve) && (reserve.weapon === null || getItem(reserve.weapon)?.slot === 'weapon') && (reserve.shield === null || getItem(reserve.shield)?.slot === 'shield') && (!getItem(reserve.weapon)?.twoHanded || reserve.shield === null), 'reserve equipment');
    assert(Array.isArray(accessories) && accessories.length === 2 && accessories.every(id => id === null || getItem(id)?.slot === 'accessory' || getItem(id)?.pocketWeapon === true), 'accessories');
    assert(person.attributes === undefined || recordObject(person.attributes), 'person attributes');
    assert(person.armorDurability === undefined || recordObject(person.armorDurability), 'person armor durability');
    assert(person.level !== null && person.xp !== null && person.trainingPoints !== null, 'person progress');
    assert(person.level === undefined || Number.isSafeInteger(person.level) && person.level >= 1 && person.level <= 20, 'person level');
    assert(person.trainingPoints === undefined || validCount(person.trainingPoints) && person.trainingPoints <= 20, 'person training points');
    const earnedLevel = person.level ?? 1;
    const perks = person.perks ?? [];
    assert(Array.isArray(perks) && perks.length <= earnedLevel - 1 && perks.every(id => typeof id === 'string' && PERK_BY_ID.has(id) && PERK_BY_ID.get(id).minLevel <= earnedLevel) && new Set(perks).size === perks.length, 'person perks');
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
  const formation = input.formation === undefined ? seedFormation(input.party) : input.formation;
  assert(Array.isArray(formation) && formation.length === 12 && formation.every(id => id === null || ids.has(id)) && formation.filter(id => id !== null).length === ids.size && new Set(formation.filter(id => id !== null)).size === ids.size, 'formation');
  const camps = input.camps === undefined ? {} : input.camps;
  assert(recordObject(camps) && Object.keys(camps).every(isCampId), 'camps');
  for (const [id,entry] of Object.entries(camps)) {
    assert(recordObject(entry) && (entry.clearedDay === null || Number.isSafeInteger(entry.clearedDay) && entry.clearedDay >= 1 && entry.clearedDay <= input.day), 'camp state');
    assert(entry.generation===undefined || validCount(entry.generation) && entry.generation<=1000000,'camp generation');
    assert(entry.respawnAt===undefined || entry.respawnAt===null && entry.clearedDay===null || Number.isFinite(entry.respawnAt) && entry.clearedDay!==null && entry.respawnAt>=(entry.clearedDay-1)*24 && entry.respawnAt<=worldHours(input)+(CAMP_BY_ID.has(id)?120:72),'camp respawn');
  }
  const bands = input.bands === undefined ? {} : input.bands;
  assert(recordObject(bands) && Object.keys(bands).every(id => BAND_BY_ID.has(id)), 'bands');
  const normalizedBands = {};
  for (const band of ROAMING_BANDS) {
    const entry = bands[band.id];
    const legacy = entry === undefined || recordObject(entry) && entry.x === undefined;
    const base = patrolProgressAt(input, band);
    if (legacy) {
      if (entry !== undefined) assert(recordObject(entry) && Number.isFinite(entry.defeatedUntil) && entry.defeatedUntil >= 0
        && entry.defeatedUntil <= worldHours(input) + 48
        && (entry.spawnCycle === undefined || validCount(entry.spawnCycle) && entry.spawnCycle >= 1 && entry.spawnCycle <= 1000000), 'band respawn');
      const threat = Object.entries(normalizedShipments).find(([, shipment]) => shipment.attackerId === band.id
        && (shipment.status === 'en-route' || shipment.status === 'under-attack'));
      if (threat) {
        const [townId, shipment] = threat;
        if (shipment.status === 'under-attack') {
          const caravan = caravanPositionFor(input, townId, shipment, worldHours(input));
          const remaining = Math.max(0, shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS - worldHours(input));
          const diversion = Math.max(0, Math.min(1, 1 - remaining / CARAVAN_ATTACK_WARNING_HOURS));
          base.x += (caravan.x - base.x) * diversion;
          base.y += (caravan.y - base.y) * diversion;
        }
        base.behavior = 'raiding-caravan';
        base.targetId = shipmentId(townId, shipment.startDay);
      }
      normalizedBands[band.id] = { ...base, defeatedUntil: entry?.defeatedUntil ?? 0,
        spawnCycle: entry?.spawnCycle ?? (entry ? 1 : 0) };
      continue;
    }
    assert(recordObject(entry) && Object.keys(entry).length === 7
      && Number.isFinite(entry.defeatedUntil) && entry.defeatedUntil >= 0 && entry.defeatedUntil <= worldHours(input) + 48
      && validCount(entry.spawnCycle) && entry.spawnCycle <= 1000000
      && inBounds(entry.x, entry.y) && (entry.direction === 1 || entry.direction === -1)
      && ['patrolling', 'hunting-company', 'raiding-caravan'].includes(entry.behavior)
      && (entry.targetId === null || typeof entry.targetId === 'string' && entry.targetId.length <= 80)
      && (entry.behavior === 'raiding-caravan') === (entry.targetId !== null), 'band state');
    normalizedBands[band.id] = { defeatedUntil: entry.defeatedUntil, spawnCycle: entry.spawnCycle,
      x: entry.x, y: entry.y, direction: entry.direction, behavior: entry.behavior, targetId: entry.targetId };
  }
  const encounterGraceUntil = input.encounterGraceUntil ?? 0;
  assert(Number.isFinite(encounterGraceUntil) && encounterGraceUntil >= 0
    && encounterGraceUntil <= worldHours(input) + ENCOUNTER_GRACE_HOURS, 'encounter grace');
  const pursuit = input.pursuit === undefined ? null : input.pursuit;
  assert(pursuit === null || BAND_BY_ID.has(pursuit) && input.destination !== null && (bands[pursuit]?.defeatedUntil ?? 0) <= worldHours(input), 'pursuit');
  const destinationAction = input.destinationAction ?? null;
  if (destinationAction !== null) {
    assert(recordObject(destinationAction) && ['town', 'camp', 'caravan'].includes(destinationAction.type), 'destination action');
    const target = destinationAction.type === 'town' ? TOWN_BY_ID.get(destinationAction.id)
      : destinationAction.type === 'camp' ? getCampSites(input).find(site => site.id === destinationAction.id)
      : getCaravans(input).find(caravan => caravan.id === destinationAction.id && (caravan.status === 'en-route' || caravan.status === 'under-attack'));
    assert(target && input.destination && pursuit === null && !input.battle
      && (destinationAction.type === 'caravan' || input.destination.x === target.x && input.destination.y === target.y), 'destination action target');
    if (destinationAction.type === 'camp') assert(!target.cleared && destinationAction.generation === target.generation, 'destination camp generation');
  }
  const battle = validateBattle(input.battle, input.party, input);
  assert(!battle || battle.tactic === tactic, 'battle tactic');
  assert(!battle || input.destination === null && pursuit === null && (battle.encounterType === 'band' ? (bands[battle.campId]?.defeatedUntil ?? 0) <= worldHours(input) : !campRecord(input,battle.campId).cleared), 'battle location');
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
    if (contract.type === 'hunt') assert(isCampId(contract.campId) && contract.from === contract.to && (contract.campGeneration===undefined || validCount(contract.campGeneration) && contract.campGeneration<=1000000), 'hunt requirement');
    else assert(contract.from !== contract.to, 'contract route');
  }
  const inventory = [...input.inventory];
  const conditions = [...inventoryCondition];
  const party = input.party.map(person => normalizeMember({
    id: person.id, name: person.name, background: person.background, seed: person.seed,
    ...(person.backgroundId === undefined ? {} : { backgroundId: person.backgroundId }),
    traits: [...(person.traits ?? [])],
    hp: person.hp, morale: person.morale,
    equipment: Object.fromEntries(SLOTS.map(slot => [slot, person.equipment[slot] ?? null])),
    reserveEquipment: { weapon: person.reserveEquipment?.weapon ?? null, shield: person.reserveEquipment?.shield ?? null },
    accessories: [...(person.accessories ?? [null, null])],
    level: person.level, xp: person.xp, trainingPoints: person.trainingPoints,
    perks: [...(person.perks ?? [])],
    pendingLevelUps: person.pendingLevelUps,
    attributes: person.attributes ? { ...person.attributes } : undefined,
    armorDurability: person.armorDurability ? { body: person.armorDurability.body, head: person.armorDurability.head } : undefined,
  }));
  for (const person of party) {
    if (getItem(person.equipment.weapon)?.twoHanded && person.equipment.shield) {
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
    party, formation: [...formation],
    inventory, inventoryCondition: conditions, cargo: { ...cargo }, supplies: { ...supplies },
    marketStock: Object.fromEntries(Object.entries(markets).map(([id, market]) => {
      const town = TOWN_BY_ID.get(id);
      const marketEvent = scheduledTownEvent({ seed: input.seed, day: market.day }, town);
      return [id, {
        day: market.day,
        food: market.food,
        goods: { ...market.goods },
        equipment: { ...defaultArmoryStock({ seed: input.seed, day: market.day }, town), ...market.equipment },
        supplies: market.supplies ? { ...market.supplies } : Object.fromEntries(Object.entries(SUPPLY_INFO).map(([kind, info]) => [kind, info.stock])),
        armoryCycle: market.armoryCycle ?? armoryCycle(market.day),
        appliedEventId: market.appliedEventId === undefined
          ? (marketEvent?.type === 'armorer-shipment' && (input.shipments === undefined
            || shipments[id]?.status === 'delivered' && shipments[id].startDay === marketEvent.startDay) ? marketEvent.id : null)
          : market.appliedEventId,
        buyback: (market.buyback ?? []).map(entry => ({ itemId: entry.itemId, condition: entry.condition })),
      }];
    })),
    shipments: normalizedShipments,
    shipmentLegacyThroughDay,
    camps: Object.fromEntries(Object.entries(camps).map(([id, entry]) => [id, { clearedDay:entry.clearedDay,respawnAt:entry.respawnAt??(entry.clearedDay?(entry.clearedDay-1)*24+(CAMP_BY_ID.has(id)?120:72):null),generation:entry.generation??0 }])),
    bands: normalizedBands, pursuit, encounterGraceUntil, tactic,
    battle, gameOver,
    position: { x: input.position.x, y: input.position.y },
    destination: input.destination ? { x: input.destination.x, y: input.destination.y } : null,
    destinationAction: destinationAction ? { type: destinationAction.type, id: destinationAction.id, ...(destinationAction.type === 'camp' ? { generation: destinationAction.generation } : {}) } : null,
    contract: input.contract ? { id: input.contract.id, type: input.contract.type ?? 'courier', from: input.contract.from, to: input.contract.to, reward: input.contract.reward, renown: input.contract.renown ?? 1, ...(input.contract.type === 'supply' ? { goodId: input.contract.goodId, quantity: input.contract.quantity } : {}), ...(input.contract.type === 'hunt' ? { campId: input.contract.campId, campGeneration: input.contract.campGeneration??0 } : {}), acceptedDay: input.contract.acceptedDay } : null,
    contractSerial: input.contractSerial, recruitSerial: input.recruitSerial, hiredRecruitOffers: [...hiredRecruitOffers],
    log: [...input.log], visited: [...input.visited],
  };
}
