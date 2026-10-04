import {RETINUE_MEMBERS,hasRetinue,getScoutLevel,getBandAwarenessMultiplier,defaultRetinue} from './retinue.js';
export {RETINUE_MEMBERS,hasRetinue,getScoutLevel,getBandAwarenessMultiplier} from './retinue.js';
import { landmarkCampPoint } from './world-landmarks.js';
import { worldBlocked, worldSegmentClear, worldRoute, moveWorldToward, nearestWorldPoint } from './world-navigation.js';
import { armoryTheme, isAncientHelmet } from './armory-themes.js';
import { NAMED_WEAPONS } from './named-weapons.js';
import { rollNamedItem } from './named-rolls.js';
// Pure game rules for the offline overworld. The UI owns rendering and real time.
import { createBattleField, DEPLOYMENT_ROW_OFFSET, blockedTerrain, legacyBattleField, tileAt, hexDistance, hexNeighbors, movementCost, heightHitModifier, rangedCoverModifier } from './battle-terrain.js';
import { ADDITIONAL_ITEMS } from './additional-items.js';
import { ARMOR_ATTACHMENTS } from './armor-attachments.js';
import { NORTHERN_ITEMS } from './northern-items.js';
import { FANTASY_ITEMS } from './fantasy-items.js';
import { DLC_ITEMS } from './dlc-items.js';
import { WORLD_ENEMY_PROFILES, worldEnemyTemplates, worldCampText, regionalOutfit, enemyRoleBonuses, ancientCampAt, ancientEnemies } from './regional-enemies.js';
import { REGIONAL_SETTLEMENTS, WORLD_LIMITS, FRONTIER_CAMP_CELLS, REGIONS, regionAt, roadNetwork, distanceToRoad, WORLD_LAYOUT_VERSION, compactPoint, authoredPoint } from './geography.js';
import { FRONTIER_ITEMS } from './frontier-items.js';
import { MOUNTS } from './mounts.js';
import { factionPatrols, soldierFactionAt, patrolDefinitions, initialPatrolProgress, advanceFactionSimulation, worldSkirmishFor, cancelWorldSkirmish, skirmishDuration } from './faction-patrols.js';
import { cityMountOffer, campMountReward, regionalMountPool } from './mount-distribution.js';
import { getMountRewardDefinitions, scheduledMountReward } from './mount-events.js';
import { enemyProgression, enemyRosterSize } from './enemy-progression.js';
import { getRegionalCampText } from './enemy-rosters.js';
import { PERKS, PERK_BY_ID, REMOVED_PERK_MIN_LEVEL, hasPerk, weaponTrainingVisual } from './perks.js';
import { RECRUIT_BACKGROUND_BY_ID, RECRUIT_TRAIT_BY_ID, makeRecruitProfile, makeTalents, talentGain } from './recruits.js';
import { BOUNTY_HUNTER_COST, discoveryEvent, discoveryBonuses, championRoster, bountyOffer } from './discovery.js';
import { deserterOffer, deserterEncounter, deserterEquipmentReward } from './deserters.js';
import { ARMORY_STOCK_VERSION, townFacilities, townArmoryBudget, townDesign } from './town-facilities.js';
import { scheduledTownEvent, townEventHash, townEventModifiers } from './town-events.js';
import { CARAVAN_ATTACK_WARNING_HOURS, CARAVAN_SHORTAGE_HOURS, CARAVAN_TRAVEL_HOURS, routeSegmentDistance, shipmentId, shipmentPlan, shipmentPosition } from './caravans.js';
import { ASHEN_CONFIG, initialAshenWinter, crisisHash } from './crisis-director.js';
import { settlementAccess } from './settlement-access.js';
import { UNDEAD_TYPES, advanceAshenWinter, ashenEncounterRecords, exteriorPoint, resolveAshenObjective, recordAshenCasualties, npcAshenVictory, validateAshenWinter } from './undead-crisis.js';
import { COMBAT_SKILLS, WEAPON_ACTIONS, equipmentSkills, weaponSkillFamily } from './combat-skills.js';
import { evaluateAreaSafety, compareAreaSafety } from './area-safety.js';
import { COMBAT_ROLES, SKILL_PREFERENCES, resolveCombatRole, isAffordableAction, rankTacticalActions, enemyBattleTactic, updateEnemyTactic, ENEMY_TACTICS, tacticalTargetPriority, rangedScreenModifier } from './tactical-ai.js';

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
  ...ARMOR_ATTACHMENTS,
  ...NORTHERN_ITEMS,
  ...FANTASY_ITEMS,
  ...MOUNTS,
  ...FRONTIER_ITEMS,
  ...DLC_ITEMS,
  ...NAMED_WEAPONS,
]);

export const GOODS = Object.freeze([
  { id: 'grain', name: 'Grain', basePrice: 22, description: 'Sacks of barley and rye for hungry towns.' },
  { id: 'timber', name: 'Timber', basePrice: 28, description: 'Cut planks for roofs, carts and palisades.' },
  { id: 'iron', name: 'Iron', basePrice: 48, description: 'Forge bars wanted by smiths and armorers.' },
  { id: 'salt', name: 'Salt', basePrice: 34, description: 'Precious barrels for curing winter stores.' },
  { id: 'wool', name: 'Wool', basePrice: 30, description: 'Bales of fleece for clothiers and camps.' },
]);

const AUTHORED_SETTLEMENTS = [
  { id: 'oakwatch', name: 'Oakwatch', x: 350, y: 460, kind: 'town', description: 'The company found its footing beneath these old oaks.', color: '#d7ad68' },
  { id: 'greyhaven', name: 'Greyhaven', x: 495, y: 305, kind: 'town', description: 'A stone market where caravans change hands.', color: '#a8b7b3' },
  { id: 'ironford', name: 'Ironford', x: 745, y: 400, kind: 'town', major: true, description: 'Smoke rises above its forges and river gates.', color: '#da936c' },
  { id: 'thornwall', name: 'Thornwall', x: 1005, y: 255, kind: 'castle', description: 'A border keep with a long memory.', color: '#c1a78f' },
  { id: 'redmere', name: 'Redmere', x: 925, y: 615, kind: 'town', description: 'Reed boats gather on the rust colored lake.', color: '#cb8679' },
  { id: 'highpass', name: 'Highpass', x: 615, y: 130, kind: 'castle', description: 'A cold refuge on the mountain road.', color: '#b9c4ce' },
  { id: 'saltwick', name: 'Saltwick', x: 265, y: 660, kind: 'village', description: 'Fisherfolk and salt traders share its quiet harbor.', color: '#81b9b3' },
  { id: 'barrowfield', name: 'Barrowfield', x: 625, y: 605, kind: 'village', description: 'Farmland scattered among ancient burial mounds.', color: '#b8c282' },
  { id: 'pinecross', name: 'Pinecross', x: 1290, y: 350, kind: 'town', description: 'A timber market at the edge of the eastern pinewoods.', color: '#a9bb87' },
  { id: 'dunridge', name: 'Dunridge', x: 1660, y: 175, kind: 'castle', description: 'A fortified pass above the northern trade road.', color: '#bab6a6' },
  { id: 'eastmere', name: 'Eastmere', x: 1960, y: 560, kind: 'town', major: true, description: 'A busy caravan city beyond the reed marshes.', color: '#d1ae72' },
  { id: 'stonebridge', name: 'Stonebridge', x: 1440, y: 735, kind: 'town', description: 'Smiths and toll keepers share the old stone crossing.', color: '#b7ae99' },
  { id: 'southwatch', name: 'Southwatch', x: 420, y: 1010, kind: 'castle', description: 'A southern refuge among the wooded hills.', color: '#aaa98b' },
  { id: 'wheatmere', name: 'Wheatmere', x: 820, y: 1230, kind: 'village', description: 'Wide grain fields feed the southern frontier.', color: '#d5bf78' },
  { id: 'blackfen', name: 'Blackfen', x: 1230, y: 1135, kind: 'village', description: 'Reed cutters and hunters live above the black water.', color: '#9cae84' },
  { id: 'farhold', name: 'Farhold', x: 1860, y: 1180, kind: 'castle', description: 'The last stronghold on a road haunted by veteran raiders.', color: '#c9a28e' },
  { id: 'ambercross', name: 'Ambercross', x: 2510, y: 410, kind: 'town', description: 'A caravan market beneath the amber hills.', color: '#c9ad82' },
  { id: 'reedharbor', name: 'Reedharbor', x: 2550, y: 1080, kind: 'village', description: 'Reed boats bring salt to the eastern frontier.', color: '#c9ad82' },
  { id: 'sunspire', name: 'Sunspire', x: 2930, y: 220, kind: 'castle', description: 'A watch keep guarding the high eastern road.', color: '#c9ad82' },
  { id: 'cinderhold', name: 'Cinderhold', x: 2970, y: 850, kind: 'castle', description: 'A stone fortress overlooking the cinder woods.', color: '#c9ad82' },
];
export const SETTLEMENTS = Object.freeze([...AUTHORED_SETTLEMENTS.map(town=>Object.freeze({...town,...compactPoint(town)})),...REGIONAL_SETTLEMENTS]);

export const SETTLEMENT_TYPES = Object.freeze({
  village: Object.freeze({ summary: 'Plentiful provisions, simple equipment and two civilian hires.', food: 12, goods: 0, tools: 0, medicine: 0, ammo: 0, hires: 2, better: 1, premium: 0, shipments: 1 }),
  town: Object.freeze({ summary: 'More trade goods, tools and medicine, with three varied hires.', food: 0, goods: 2, tools: 2, medicine: 2, ammo: 0, hires: 3, better: 3, premium: 1, shipments: 3 }),
  castle: Object.freeze({ summary: 'Quality military equipment, extra tools and ammunition, with three military hires.', food: -4, goods: -1, tools: 4, medicine: 0, ammo: 15, hires: 3, better: 4, premium: 2, shipments: 3 }),
});

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
  { id: 'ambercross-raiders', name: 'Ambercross Raiders', difficulty: 2, start: { x: 2330, y: 470 }, end: { x: 2460, y: 350 } },
  { id: 'reedharbor-raiders', name: 'Reedharbor Raiders', difficulty: 2, start: { x: 2370, y: 1140 }, end: { x: 2500, y: 1020 } },
  { id: 'sunspire-raiders', name: 'Sunspire Raiders', difficulty: 3, start: { x: 2750, y: 280 }, end: { x: 2880, y: 160 } },
  { id: 'cinderhold-raiders', name: 'Cinderhold Raiders', difficulty: 3, start: { x: 2790, y: 910 }, end: { x: 2920, y: 790 } },
  ...REGIONAL_SETTLEMENTS.map((compactTown, index) => { const town=authoredPoint(compactTown);return ({ id: `${compactTown.id}-patrol`, name: `${compactTown.name} ${compactTown.kind === 'castle' ? 'Deserters' : 'Waylayers'}`, difficulty: compactTown.kind === 'village' ? 1 : compactTown.kind === 'castle' ? 3 : 2, start: { x: town.x - 100, y: town.y + 50 }, end: { x: Math.min(4950, town.x + 130), y: Math.max(85, town.y - 50) } });}),
].map(band=>Object.freeze({...band,start:compactPoint(band.start),end:compactPoint(band.end)})));

const ITEM_BY_ID = new Map(ITEMS.map(item => [item.id, item]));
const FAMED_ID = /^(famed4|famed3|famed2|famed):([a-z0-9-]{1,40}):(0|[1-9][0-9]{0,9})$/;
const FAMED_NAMES = ['Ashen', 'Blackthorn', 'Dawnward', 'Grimwolf', 'Ironbound', 'Oathkeeper', 'Ravenmark', 'Stormborn', 'Thornheart', 'Wolfguard'];

export function createFamedItemId(baseId, seed, rulesVersion) {
  const base=ITEM_BY_ID.get(baseId),rangedWeapon=base?.slot==='weapon'&&(base.ranged??base.sourceStats?.ranged)===true;
  const version=rulesVersion??(rangedWeapon?4:3);
  if (![1, 2, 3, 4].includes(version) || version===4&&!rangedWeapon || !base || ['accessory', 'attachment', 'mount'].includes(base.slot) || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new TypeError('Invalid famed item base or seed.');
  return `${version === 1 ? 'famed' : version===2?'famed2':version===3?'famed3':'famed4'}:${baseId}:${seed}`;
}

export function getItem(id) {
  const base = ITEM_BY_ID.get(id);
  if (base) return base;
  if (typeof id !== 'string' || id.length > 80) return undefined;
  const match = FAMED_ID.exec(id);
  if (!match) return undefined;
  const original = ITEM_BY_ID.get(match[2]);
  const seed = Number(match[3]);
  if (!original || ['accessory', 'attachment', 'mount'].includes(original.slot) || match[1]==='famed4'&&!(original.ranged??original.sourceStats?.ranged) || !Number.isSafeInteger(seed) || seed > 0xffffffff) return undefined;
  if(match[1]==='famed2'||match[1]==='famed3'||match[1]==='famed4')return rollNamedItem(original,id,seed,{merged:match[1]==='famed3'||match[1]==='famed4',rangeRoll:match[1]==='famed4',rulesVersion:Number(match[1].slice(5)),shieldDurability:shieldMaximum(original.id),shieldDamage:shieldImpactDamage(original.sourceStats?{...original,...original.sourceStats}:original)});
  const roll = shift => (seed >>> shift) & 15;
  const bonuses = [];
  const item = { ...original, id, baseId: original.id, rarity: 'famed' };
  if (original.slot === 'armor' || original.slot === 'helmet') {
    const gain = Math.max(8, Math.round(original.armor * (.15 + roll(0) / 100)));
    item.armor = Math.min(500, original.armor + gain);
    const fatigueRelief = Math.ceil((1 + roll(4) % 3) * (1.5 + roll(8) % 3 * .25));
    item.fatigue = Math.max(0, (original.fatigue ?? 0) - fatigueRelief);
    const signatures = [
      { id: 'guarded', suffix: 'of the Guard', stat: 'meleeDefense', label: 'Melee defense', value: 2 + roll(16) % 3, flavor: 'Its careful fit guards the wearer in close combat.' },
      { id: 'deflecting', suffix: 'of Deflection', stat: 'rangedDefense', label: 'Ranged defense', value: 3 + roll(16) % 3, flavor: 'Its angled surfaces turn aside distant attacks.' },
      { id: 'stalwart', suffix: 'of Resolve', stat: 'resolve', label: 'Resolve', value: 4 + roll(16) % 4, flavor: 'Its workmanship steadies the wearer.' },
      { id: 'vigorous', suffix: 'of Vigor', stat: 'maxFatigue', label: 'Maximum fatigue', value: 4 + roll(16) % 4, flavor: 'Its balanced weight leaves the wearer more endurance.' },
    ];
    const signature = signatures[roll(12) % signatures.length];
    item.signature = signature.id;
    item.statBonuses = Object.freeze({ ...original.statBonuses, [signature.stat]: (original.statBonuses?.[signature.stat] ?? 0) + signature.value });
    item.name = `${FAMED_NAMES[seed % FAMED_NAMES.length]} ${original.name} ${signature.suffix}`;
    item.description = `A rare, finely worked ${original.name.toLowerCase()}. ${signature.flavor} ${original.description}`;
    bonuses.push({ label: 'Protection', value: `+${item.armor - original.armor}` });
    if (item.fatigue < original.fatigue) bonuses.push({ label: 'Fatigue cost', value: `-${original.fatigue - item.fatigue}` });
    bonuses.push({ label: signature.label, value: `+${signature.value}` });
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
  item.price = Math.min(original.collection ? 20000 : 5000, Math.round(original.price * 2.4 + (original.slot === 'armor' || original.slot === 'helmet' ? item.armor - original.armor : 0)));
  if (!item.signature) item.name = `${FAMED_NAMES[seed % FAMED_NAMES.length]} ${original.name}`;
  item.description = item.signature ? item.description : `A rare, finely worked ${original.name.toLowerCase()}. ${original.description}`;
  item.bonuses = Object.freeze(bonuses.map(bonus => Object.freeze(bonus)));
  return Object.freeze(item);
}
export function mergedNamedItemId(id) {
  if(typeof id!=='string')return id;
  if(id.startsWith('famed2:'))return `famed3:${id.slice(7)}`;
  const index=NAMED_WEAPONS.findIndex(item=>item.id===id);
  return index<0?id:createFamedItemId(id,0x42420000+index,3);
}

export function mergeOwnedNamedBonuses(state) {
  if(state.battle)return false;
  let changed=false;
  const merge=id=>{const next=mergedNamedItemId(id);if(next!==id)changed=true;return next;};
  state.inventory=state.inventory.map(merge);
  for(const person of state.party){
    for(const slot of Object.keys(person.equipment))person.equipment[slot]=merge(person.equipment[slot]);
    for(const slot of Object.keys(person.reserveEquipment))person.reserveEquipment[slot]=merge(person.reserveEquipment[slot]);
    person.accessories=person.accessories.map(merge);
  }
  for(const market of Object.values(state.marketStock??{})){
    for(const [id,count] of Object.entries(market.equipment)){
      const next=mergedNamedItemId(id);
      if(next!==id&&(!ITEM_BY_ID.has(id)||count>0)&&count+(market.equipment[next]??0)<=1024){market.equipment[next]=(market.equipment[next]??0)+count;if(ITEM_BY_ID.has(id))market.equipment[id]=0;else delete market.equipment[id];changed=true;}
    }
    for(const entry of market.buyback??[])entry.itemId=merge(entry.itemId);
  }
  if(changed)record(state,'Named equipment regains its legacy traits and craftsmanship alongside the newer stat rolls. Existing damage and roll seeds are preserved.');
  return changed;
}

const NEW_ITEM_IDS = new Set(['bludgeon', 'rondel-dagger', 'light-crossbow', 'billhook', 'padded-gambeson', 'reinforced-mail', 'bascinet', ...ADDITIONAL_ITEMS.map(item => item.id), ...ARMOR_ATTACHMENTS.map(item => item.id), ...NORTHERN_ITEMS.map(item => item.id), ...FANTASY_ITEMS.map(item => item.id), ...MOUNTS.map(item => item.id), ...FRONTIER_ITEMS.map(item => item.id), ...DLC_ITEMS.map(item => item.id), ...NAMED_WEAPONS.map(item => item.id)]);
const GOOD_BY_ID = new Map(GOODS.map(good => [good.id, good]));
const TOWN_BY_ID = new Map(SETTLEMENTS.map(town => [town.id, town]));
const CAMP_BY_ID = new Map(CAMP_SITES.map(camp => [camp.id, camp]));
const RANDOM_CAMP_IDS = Array.from({ length: 36 }, (_, index) => `wild-camp-${index + 1}`);
const isCampId = id => CAMP_BY_ID.has(id) || RANDOM_CAMP_IDS.includes(id);
const BAND_BY_ID = new Map(ROAMING_BANDS.map(band => [band.id, band]));
// Low factors mark local supply; high factors mark demand. The market spread
// always makes buying and selling in the same settlement a loss.
const MARKET_FACTORS = {
  ...Object.fromEntries(REGIONAL_SETTLEMENTS.map(town => { const region = regionAt(town.x,town.y); return [town.id, Object.fromEntries(GOODS.map(good => [good.id, region[good.id]]))]; })),
  ambercross: { grain: .85, timber: 1.15, iron: 1.20, salt: 1.10, wool: .75 },
  reedharbor: { grain: 1.10, timber: .90, iron: 1.40, salt: .60, wool: 1.20 },
  sunspire: { grain: 1.45, timber: 1.30, iron: .80, salt: 1.35, wool: 1.15 },
  cinderhold: { grain: 1.35, timber: .75, iron: 1.10, salt: 1.30, wool: 1.25 },
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
// Map industry hints use the same local-supply factors as trade prices.
export function getTownLocalSupply(townId) {
  const factors = MARKET_FACTORS[townId];
  if (!factors) return null;
  const good = [...GOODS].sort((a, b) => factors[a.id] - factors[b.id])[0];
  return factors[good.id] <= .9 ? { goodId: good.id, name: good.name, factor: factors[good.id] } : null;
}
const GEAR_FACTORS = { ...Object.fromEntries(REGIONAL_SETTLEMENTS.map(town => [town.id, regionAt(town.x,town.y).gear])), ambercross: 1.03, reedharbor: 1.12, sunspire: 1.18, cinderhold: 1.20, oakwatch: 1, greyhaven: 1.05, ironford: .84, thornwall: 1.16, redmere: 1.08, highpass: 1.20, saltwick: 1.12, barrowfield: .96, pinecross:1.04, dunridge:1.12, eastmere:.98, stonebridge:.88, southwatch:1.08, wheatmere:1.02, blackfen:1.15, farhold:1.22 };
const SLOTS = ['armor', 'attachment', 'attachment2', 'helmet', 'weapon', 'shield', 'mount'];
export const WORLD_BOUNDS = WORLD_LIMITS;
export const WORLD_REGIONS = REGIONS;
export const WORLD_ROADS = roadNetwork(SETTLEMENTS);
const BOUNDS = WORLD_BOUNDS;
const TOWN_RADIUS = 28;
const ARRIVAL_RADIUS = 2;
const SPEED = 55;
const MAX_LOG = 30;
const MAX_INVENTORY = 512;
const MAX_CARGO = 30;
export const MAX_COMPANY_SIZE = 18;
export const MAX_BATTLE_SIZE = 15;
export const AUTO_AMMO_CAP = 999;
export const MAX_SAVE_FILE_BYTES = 4 * 1024 * 1024;
const CAMP_RADIUS = 35;
const BAND_RADIUS = 28;
const BAND_AGGRO_RADIUS = 120;
const BAND_CHASE_LEASH = 260;
const BAND_PATROL_SPEED = 7;
const BAND_CHASE_BONUS = .05;
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
const TACTICS = ['offense', 'defense', 'focus', 'advance-formation', 'shield-wall', 'skirmish'];
const FORMATION_DIRECTIONS = { e: [1, 0], ne: [1, -1], se: [0, 1], w: [-1, 0], sw: [-1, 1], nw: [0, -1] };

function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isSafeInteger(seed)) return seed >>> 0;
  if (typeof seed !== 'string' || !seed.length) throw new TypeError('Seed must be a nonempty string or integer.');
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function levelRolls(seed, level, talents = {}) {
  return Object.fromEntries(ATTRIBUTES.map(key => [key, talentGain(1 + hashSeed(`${seed}:${level}:${key}`) % 5,talents[key]??0)]));
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
const FRONT_FORMATION = [5, 6, 4, 7, 3, 8, 2, 9, 1, 10, 0, 11];
const MIDDLE_FORMATION = FRONT_FORMATION.map(index => index + 12);
const REAR_FORMATION = FRONT_FORMATION.map(index => index + 24);

function expandedFormation(formation) {
  if (formation.length !== 12) return [...formation];
  const slots = Array(36).fill(null);
  formation.forEach((id, index) => { slots[index < 6 ? index + 3 : index + 21] = id; });
  return slots;
}

function seedFormation(party) {
  const slots = Array(36).fill(null);
  const ranged = party.filter(person => getItem(person.equipment?.weapon)?.ranged === true);
  const melee = party.filter(person => !ranged.includes(person));
  for (const person of [...melee, ...ranged].slice(0,MAX_BATTLE_SIZE)) {
    const preferred = ranged.includes(person) ? [...REAR_FORMATION, ...MIDDLE_FORMATION, ...FRONT_FORMATION] : [...FRONT_FORMATION, ...MIDDLE_FORMATION, ...REAR_FORMATION];
    slots[preferred.find(index => slots[index] === null)] = person.id;
  }
  return slots;
}

export function getFormation(state) {
  return expandedFormation(state.formation ?? seedFormation(state.party));
}

export function getReserveSlots(state) {
  return state.reserveIds ? [...state.reserveIds] : Array(3).fill(null);
}

export function getBattleRoster(state) {
  return getFormation(state).filter(Boolean).map(id=>personById(state,id)).filter(Boolean);
}

export function moveFormation(state, fromIndex, toIndex) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  if (!Number.isSafeInteger(fromIndex) || !Number.isSafeInteger(toIndex) || fromIndex < 0 || fromIndex >= 39 || toIndex < 0 || toIndex >= 39) return result(false, 'Choose two formation or reserve slots.');
  const formation = [...getFormation(state),...getReserveSlots(state)];
  if (!formation[fromIndex]) return result(false, 'Select a company member to move.');
  [formation[fromIndex], formation[toIndex]] = [formation[toIndex], formation[fromIndex]];
  if(formation.slice(0,36).filter(Boolean).length>MAX_BATTLE_SIZE)return result(false,'Only 15 brothers can be fielded. Swap with a fielded brother or move one to reserve first.');
  state.formation = formation.slice(0,36);
  state.reserveIds = formation.slice(36);
  const message = 'Company formation updated.';
  record(state, message);
  applyCompanyAutomation(state);
  return result(true, message);
}

function armorMaximum(itemId) { return getItem(itemId)?.armor ?? 0; }
export function shieldMaximum(itemId) {
  const item = getItem(itemId);
  return item?.slot === 'shield' ? item.durability ?? Math.max(24, item.armor * 4) : 0;
}
const THROWING_WEAPON_AMMO = 5;
export function throwingCapacity(itemOrId) {
  const item = typeof itemOrId === 'string' ? getItem(itemOrId) : itemOrId;
  return item?.throwing === true ? item.ammoMax??THROWING_WEAPON_AMMO : 0;
}
function itemCondition(itemId) {
  const item = getItem(itemId);
  const slot = item?.slot;
  return slot === 'shield' ? shieldMaximum(itemId) : item?.throwing ? throwingCapacity(item) : ['armor', 'attachment', 'helmet'].includes(slot) ? armorMaximum(itemId) : null;
}
function restoredCondition(itemId, condition) {
  return (getItem(itemId)?.slot === 'shield' || getItem(itemId)?.throwing) && condition === null ? itemCondition(itemId) : condition;
}
function normalizeMember(person) {
  const talents = person.talents ?? makeTalents(person.seed,person.backgroundId);
  const level = person.level ?? 1;
  const unspent = person.trainingPoints ?? 0;
  const pendingLevelUps = person.pendingLevelUps === undefined
    ? Array.from({ length: unspent }, (_, index) => {
      const earnedLevel = level - unspent + index + 1;
      return { level: earnedLevel, rolls: levelRolls(person.seed, earnedLevel,talents) };
    })
    : person.pendingLevelUps.map(entry => ({ level: entry.level, rolls: person.talents===undefined?Object.fromEntries(ATTRIBUTES.map(key=>[key,talentGain(entry.rolls[key],talents[key]??0)])):{ ...entry.rolls } }));
  return {
    ...person,
    talents: {...talents},
    combatRole: person.combatRole ?? 'auto', skillPreference: person.skillPreference ?? 'balanced',
    equipment: { ...person.equipment, attachment: person.equipment.attachment ?? null, attachment2:person.equipment.attachment2??null, mount: person.equipment.mount ?? null },
    traits: [...(person.traits ?? [])],
    reserveEquipment: { weapon: person.reserveEquipment?.weapon ?? null, shield: person.reserveEquipment?.shield ?? null },
    throwingAmmo: {
      active: person.throwingAmmo?.active ?? throwingCapacity(person.equipment?.weapon),
      reserve: person.throwingAmmo?.reserve ?? throwingCapacity(person.reserveEquipment?.weapon),
    },
    accessories: [...(person.accessories ?? [null, null])],
    level,
    xp: person.xp ?? 0,
    perks: (person.perks ?? []).filter(id => PERK_BY_ID.has(id)),
    trainingPoints: pendingLevelUps.length,
    pendingLevelUps,
    attributes: { ...Object.fromEntries(ATTRIBUTES.map(key => [key, 0])), ...person.attributes },
    armorDurability: {
      body: person.armorDurability?.body ?? armorMaximum(person.equipment.armor),
      attachment: person.armorDurability?.attachment ?? armorMaximum(person.equipment.attachment),
      attachment2:person.armorDurability?.attachment2??armorMaximum(person.equipment.attachment2),
      head: person.armorDurability?.head ?? armorMaximum(person.equipment.helmet),
      shield: person.armorDurability?.shield ?? shieldMaximum(person.equipment.shield),
      reserveShield: person.armorDurability?.reserveShield ?? shieldMaximum(person.reserveEquipment?.shield),
    },
  };
}

function refillThrowingAmmo(state) {
  let refilled = 0;
  for (const person of state.party ?? []) {
    person.throwingAmmo ??= {
      active: throwingCapacity(person.equipment?.weapon),
      reserve: throwingCapacity(person.reserveEquipment?.weapon),
    };
    for (const set of ['active', 'reserve']) {
      const equipment = set === 'active' ? person.equipment : person.reserveEquipment;
      const maximum = throwingCapacity(equipment?.weapon);
      if (!maximum || state.supplies.ammo <= 0) continue;
      const amount = Math.min(Math.max(0, maximum - person.throwingAmmo[set]), state.supplies.ammo);
      person.throwingAmmo[set] += amount;
      state.supplies.ammo -= amount;
      refilled += amount;
    }
  }
  if (refilled) record(state, 'The company replenishes ' + refilled + ' throwing weapon charges.');
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

function attachmentItems(equipment){return ['attachment','attachment2'].map(slot=>getItem(equipment?.[slot])).filter(Boolean);}
function attachmentBonus(equipment,key){return attachmentItems(equipment).reduce((sum,item)=>sum+(item[key]??0),0);}
function attachmentEffect(equipment,key){return Math.max(0,...attachmentItems(equipment).map(item=>item[key]??0));}

export function getCompanyStats(person) {
  const attributes = person.attributes ?? {};
  const level = person.level ?? 1;
  const background = person.background ?? '';
  const recruit = recruitBonuses(person);
  const equipped = getEquipment(person);
  const famedStatBonus = key => (equipped.armor?.statBonuses?.[key] ?? 0) + (equipped.helmet?.statBonuses?.[key] ?? 0);
  const mountHit = person.hp > 0 ? equipped.mount?.hitBonus ?? 0 : 0;
  const mountInitiative = person.hp > 0 ? equipped.mount?.initiativeBonus ?? 0 : 0;
  const mount = person.hp > 0 ? equipped.mount : null;
  const armorFatigue = (equipped.armor?.fatigue ?? 0) + (equipped.helmet?.fatigue ?? 0);
  const attachmentFatigue=(equipped.attachment?.fatigue??0)+(equipped.attachment2?.fatigue??0);
  const otherFatigue = (equipped.weapon?.fatigue ?? 0) + (equipped.shield?.fatigue ?? 0);
  const perkFatigue = otherFatigue + (hasPerk(person, 'brawny') ? Math.floor(armorFatigue * .7) : armorFatigue);
  const fatigue=perkFatigue+attachmentFatigue;
  const legacy = !person.backgroundId;
  const guard = legacy && (background === 'Guard' || background === 'Caravan Guard');
  const scout = legacy && (background === 'Scout' || background === 'Hunter' || background === 'Outrider');
  const captain = legacy && background === 'Captain';
  const baseMaxHp = 100 + (guard ? 5 : 0) + (attributes.maxHp ?? 0) + (recruit.maxHp ?? 0);
  const maxHp = hasPerk(person, 'colossus') ? Math.round(baseMaxHp * 1.25) : baseMaxHp;
  const maxBodyArmor = armorMaximum(person.equipment?.armor);
  const maxAttachmentArmor = armorMaximum(person.equipment?.attachment);
  const maxAttachment2Armor=armorMaximum(person.equipment?.attachment2);
  const maxHeadArmor = armorMaximum(person.equipment?.helmet);
  const shieldDefense = (person.armorDurability?.shield ?? shieldMaximum(person.equipment?.shield)) > 0 ? equipped.shield?.defense ?? 0 : 0;
  const rangedShieldDefense=(person.armorDurability?.shield??shieldMaximum(person.equipment?.shield))>0?equipped.shield?.rangedDefense??shieldDefense:0;
  const effectiveRangedShieldDefense=(hasPerk(person,'shield-expert')?Math.ceil(rangedShieldDefense*1.25):rangedShieldDefense)+(rangedShieldDefense&&hasPerk(person,'shield-bearer')?5:0);
  const effectiveShieldDefense = (hasPerk(person, 'shield-expert') ? Math.ceil(shieldDefense * 1.25) : shieldDefense)
    + (shieldDefense && hasPerk(person, 'shield-bearer') ? 5 : 0);
  const initiative = Math.max(20, 105 + (scout ? 10 : 0) + (attributes.initiative ?? 0) + (recruit.initiative ?? 0) + mountInitiative + attachmentBonus(person.equipment,'initiativeBonus')
    - (hasPerk(person, 'relentless') ? Math.ceil(perkFatigue / 2)+attachmentFatigue : fatigue));
  const dodgeDefense = hasPerk(person, 'dodge') ? Math.floor(initiative * .15) : 0;
  const nimbleDefense = armorFatigue <= 15 && hasPerk(person, 'nimble') ? 5 : 0;
  const reachDefense = hasPerk(person, 'reach-advantage') && equipped.weapon?.twoHanded && !equipped.weapon.ranged ? 5 : 0;
  const giftedSkill = hasPerk(person, 'gifted') ? 3 : 0;
  const giftedDefense = hasPerk(person, 'gifted') ? 2 : 0;
  const baseResolve = 42 + (captain ? 10 : 0) + (attributes.resolve ?? 0) + (recruit.resolve ?? 0);
  return {
    maxHp,
    meleeSkill: 54 + (captain ? 9 : guard ? 6 : 0) + (person.seed % 7) + (attributes.meleeSkill ?? 0) + (recruit.meleeSkill ?? 0) + giftedSkill + mountHit,
    rangedSkill: 40 + (scout ? 13 : 0) + (person.seed % 9) + (attributes.rangedSkill ?? 0) + (recruit.rangedSkill ?? 0) + giftedSkill + mountHit,
    meleeDefense: 5 + (guard ? 3 : 0) + (attributes.meleeDefense ?? 0) + (recruit.meleeDefense ?? 0) + effectiveShieldDefense + dodgeDefense + nimbleDefense + reachDefense + giftedDefense + famedStatBonus('meleeDefense') + (mount?.meleeDefenseBonus ?? 0),
    rangedDefense: 5 + (scout ? 3 : 0) + (attributes.rangedDefense ?? 0) + (recruit.rangedDefense ?? 0) + effectiveRangedShieldDefense + dodgeDefense + nimbleDefense + giftedDefense + famedStatBonus('rangedDefense') + (mount?.rangedDefenseBonus ?? 0) + attachmentBonus(person.equipment,'rangedDefenseBonus'),
    maxFatigue: Math.max(30, 100 + (attributes.maxFatigue ?? 0) + (recruit.maxFatigue ?? 0) - fatigue - (mount?.fatigue ?? 0) + famedStatBonus('maxFatigue')),
    initiative,
    resolve: (hasPerk(person, 'fortified-mind') ? Math.ceil(baseResolve * 1.25) : baseResolve) + famedStatBonus('resolve'),
    level,
    xp: person.xp ?? 0,
    nextLevelXp: level * 50,
    trainingPoints: person.pendingLevelUps?.length ?? person.trainingPoints ?? 0,
    dailyWage: Math.max(1, 5 + level - 1 + ((RECRUIT_BACKGROUND_BY_ID.get(person.backgroundId)?.cost??0)>=700?Math.ceil(RECRUIT_BACKGROUND_BY_ID.get(person.backgroundId).cost/200):0)),
    bodyArmor: person.armorDurability?.body ?? maxBodyArmor,
    attachmentArmor: person.armorDurability?.attachment ?? maxAttachmentArmor,
    attachment2Armor:person.armorDurability?.attachment2??maxAttachment2Armor,
    headArmor: person.armorDurability?.head ?? maxHeadArmor,
    maxBodyArmor,
    maxAttachmentArmor, maxAttachment2Armor,
    maxHeadArmor,
    shieldDurability: person.armorDurability?.shield ?? shieldMaximum(person.equipment?.shield),
    maxShieldDurability: shieldMaximum(person.equipment?.shield),
    reserveShieldDurability: person.armorDurability?.reserveShield ?? shieldMaximum(person.reserveEquipment?.shield),
    maxReserveShieldDurability: shieldMaximum(person.reserveEquipment?.shield),
  };
}

function baseDailyFood(state) {
  return state.party.reduce((total, person) => total + 1 + (person.hp > 0 ? getItem(person.equipment?.mount)?.foodUpkeep ?? 0 : 0), 0);
}

export function getDailyFood(state) { return hasRetinue(state,'quartermaster') ? baseDailyFood(state)*4/5 : baseDailyFood(state); }
function dailyFoodConsumption(state) {
  if(!hasRetinue(state,'quartermaster'))return baseDailyFood(state);
  const numerator=baseDailyFood(state)*4+(state.retinue.foodRemainder??0);
  state.retinue.foodRemainder=numerator%5;
  return Math.floor(numerator/5);
}
export function hireRetinueMember(state,id) {
  const blocked=actionBlocked(state);if(blocked)return blocked;
  const access=requireTown(state);if(access.error)return access.error;
  const definition=RETINUE_MEMBERS.find(member=>member.id===id);
  if(!definition)return result(false,'Unknown retinue member.');
  if(hasRetinue(state,id))return result(false,`${definition.name} already serves your company.`);
  if(state.gold<definition.cost)return result(false,`Hiring ${definition.name} requires ${definition.cost.toLocaleString('en-US')} crowns.`);
  state.retinue??=defaultRetinue();state.retinue.members??=[];
  state.gold-=definition.cost;state.retinue.members.push(id);
  if(id==='scout')state.retinue.scoutLevel=1;
  const message=`${definition.name} hired. Permanent company support, with no wage or formation slot.`;
  record(state,message);return result(true,message);
}
export function upgradeScout(state) {
  const blocked=actionBlocked(state);if(blocked)return blocked;
  const access=requireTown(state);if(access.error)return access.error;
  if(getScoutLevel(state)!==1)return result(false,getScoutLevel(state)===2?'Scout is fully upgraded.':'Hire a Scout first.');
  if(state.gold<10000)return result(false,'The Scout upgrade requires 10,000 crowns.');
  state.gold-=10000;state.retinue.scoutLevel=2;
  const message='Scout upgraded: enemy bands detect and pursue your company at 33% shorter ranges.';
  record(state,message);return result(true,message);
}
export function getBattleLootGold(state) {
  const base=state.battle?.loot?.gold??0;
  return Math.floor(base*(hasRetinue(state,'scavenger')&&state.battle?.status==='victory'?1.25:1));
}
export function getBattleExperience(state,id) {
  const battle=state.battle;if(!battle)return 0;
  const unit=battle.units.find(u=>u.id===id);
  if(unit)return unit.alive?Math.round((battle.xp[id]??0)*(hasRetinue(state,'drillmaster')?1.15:1)):0;
  if(!hasRetinue(state,'drillmaster')||battle.status!=='victory'||!getReserveSlots(state).includes(id))return 0;
  const survivors=battle.units.filter(u=>u.side==='company'&&!u.ally&&u.alive);
  return survivors.length?Math.round(survivors.reduce((sum,u)=>sum+(battle.xp[u.id]??0),0)/survivors.length*.15):0;
}
function awardExperience(person,amount) {
  person.xp+=amount;
  while(person.xp>=person.level*50&&person.level<30){person.xp-=person.level*50;person.level++;person.pendingLevelUps.push({level:person.level,rolls:levelRolls(person.seed,person.level,person.talents)});}
  if(person.level===30)person.xp=Math.min(person.xp,person.level*50-1);
  person.trainingPoints=person.pendingLevelUps.length;
}

export const NIGHT_TRAVEL_MULTIPLIER = .8;
export function getTimeOfDay(hour) {
  const phase=hour>=20||hour<6?'night':hour>=18?'evening':hour<8?'dawn':'day';
  return {phase,label:{day:'Daylight',evening:'Evening',night:'Night',dawn:'Dawn'}[phase],travelMultiplier:phase==='night'?NIGHT_TRAVEL_MULTIPLIER:1};
}
export function getNightHitPenalty(battle, ranged) { return battle.lighting==='night' ? ranged ? 40 : 10 : 0; }

export function getStashCapacity(state) { return MAX_INVENTORY * (cartLevel(state) + 1); }
export function getCargoCapacity(state) { return MAX_CARGO * (cartLevel(state) + 1); }
function cartLevel(state) { return [1,2].includes(state.retinue?.cartLevel) ? state.retinue.cartLevel : 0; }
export function getCompanyTravelMultiplier(state) {
  return (1 + getCompanyTravelBonus(state)) * (cartLevel(state) === 1 ? .95 : 1) * getTimeOfDay(state.hour).travelMultiplier * (hasRetinue(state,'scout')?1.1:1);
}
export function getCompanyCart(state) {
  const level=cartLevel(state);
  return {level,cost:level===0?7500:level===1?15000:0,stashCapacity:getStashCapacity(state),cargoCapacity:getCargoCapacity(state),speedPenalty:level===1?5:0};
}
export function buyCompanyCart(state) {
  const blocked=actionBlocked(state);if(blocked)return blocked;
  const access=requireTown(state);if(access.error)return access.error;
  const cart=getCompanyCart(state);
  if(cart.level===2)return result(false,'The company cart is fully upgraded.');
  if(state.gold<cart.cost)return result(false,`The cart requires ${cart.cost.toLocaleString('en-US')} crowns.`);
  state.gold-=cart.cost;
  state.retinue??=defaultRetinue();
  state.retinue.cartLevel=cart.level+1;
  const message=cart.level===0?'Company cart purchased: double stash and cargo capacity; travel speed reduced by 5%.':'Company cart upgraded: triple original stash and cargo capacity; travel speed penalty removed.';
  record(state,message);return result(true,message);
}

export function getCompanyTravelBonus(state) {
  return state.party.reduce((total, person) => total + (person.hp > 0
    ? (getItem(person.equipment?.mount)?.travelBonus ?? 0) : 0), 0);
}

export function createGame(seed = Date.now()) {
  const numericSeed = hashSeed(seed);
  const state = {
    version: 1,
    ashenWinter: initialAshenWinter(numericSeed),
    worldLayoutVersion: WORLD_LAYOUT_VERSION,
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
    marketStock: {}, deserterBoards: {}, retinue:defaultRetinue(), discoveryRolls:{},
    shipments: {},
    shipmentLegacyThroughDay: 0,
    mountRewards: Object.fromEntries(getMountRewardDefinitions().map(reward => [reward.id, false])),
    supplies: { tools: 8, medicine: 5, ammo: 16 },
    automation:{buyAmmo:false,equipBandages:false}, reserveIds:[null,null,null],
    camps: {},
    bands: {},
    factionPatrols: {}, factionReports: [], worldSkirmishes: [], worldLosses: {}, factionSimulationHour: 8,
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
  state.factionPatrols = Object.fromEntries(patrolDefinitions(SETTLEMENTS).map(d=>[d.id,initialPatrolProgress(state,d)]));
  state.party = state.party.map(normalizeMember);
  state.formation = seedFormation(state.party);
  advanceCaravans(state, worldHours(state));
  record(state, 'The Ashen Company gathers at Oakwatch. The road is yours.');
  return state;
}

export function terrainAt(x, y) {
  if (!inBounds(x, y)) return 'sea';
  if (worldBlocked({x,y})) return 'mountain';
  ({x,y}=authoredPoint({x,y}));
  if (Math.hypot(x - 615, y - 145) < 100 || Math.hypot(x - 1080, y - 455) < 85) return 'mountain';
  if (Math.hypot(x - 475, y - 445) < 95 || Math.hypot(x - 840, y - 235) < 120) return 'forest';
  if (Math.hypot(x - 865, y - 555) < 88) return 'marsh';
  if (Math.hypot((x - 1640) / 1.6, y - 290) < 145 || Math.hypot(x - 1660, (y - 1100) / 1.5) < 155 || Math.hypot(x - 590, y - 900) < 95) return 'mountain';
  if (Math.hypot(x - 1330, (y - 450) / 1.5) < 160 || Math.hypot((x - 640) / 1.5, y - 1050) < 150 || Math.hypot(x - 1870, y - 880) < 185) return 'forest';
  if (Math.hypot((x - 1230) / 1.4, y - 1120) < 155 || Math.hypot(x - 1920, y - 500) < 120) return 'marsh';
  // Preserve terrain in the original footprint; new regions introduce distinct climates.
  if (x > 2120 || y > 1380) {
    const point=compactPoint({x,y}),region = regionAt(point.x,point.y);
    if (region.climate === 'snow') return y < 180 ? 'snow' : 'mountain';
    if (region.climate === 'desert') return Math.hypot(x-2400,y-1900)<140 ? 'plains' : 'desert';
    if (region.climate === 'marsh') return 'marsh';
    if (region.climate === 'forest') return 'forest';
    if (region.climate === 'temperate' && Math.hypot(x-1000,y-1450)<180) return 'forest';
    if (region.climate === 'coastal' && Math.hypot(x-1600,y-1900)<150) return 'marsh';
  }
  if (Math.hypot(x - 2860, y - 290) < 150) return 'mountain';
  if (Math.hypot(x - 2800, y - 820) < 160) return 'forest';
  if (Math.hypot(x - 2470, y - 1090) < 120) return 'marsh';
  return 'plains';
}

function terrainSpeed(terrain) {
  return SPEED * ({ plains: 1, forest: 0.64, mountain: 0.44, marsh: 0.55, snow: .60, desert: .75 }[terrain] ?? 1);
}

export function townAt(state) {
  return SETTLEMENTS.find(town => distance(state.position, town) <= TOWN_RADIUS) ?? null;
}

export function getSettlementAccess(state, townId) {
  if (!TOWN_BY_ID.has(townId)) throw new TypeError('Unknown settlement.');
  return settlementAccess(state, townId);
}
function townBlocked(state, townId) {
  const access = getSettlementAccess(state, townId);
  return access.servicesAvailable ? null : { ...result(false, access.reason), code: 'SETTLEMENT_BLOCKED', blockedTown: townId };
}
function ashenContext(state) {
  return { settlements: SETTLEMENTS, report: message => record(state, message), hostiles: () => getRoamingBands(state) };
}
export function getUndeadEncounters(state) {
  return ashenEncounterRecords(state, SETTLEMENTS).filter(e => e.force.troops.length).map(encounter => {
    const pool = ancientEnemies(encounter.force.tier);
    const enemies = encounter.force.troops.map(troop => ({ ...pool[(troop + encounter.force.seed % pool.length) % pool.length],
      name: encounter.kind === 'undead-commander' && troop === 0 ? encounter.name : pool[(troop + encounter.force.seed % pool.length) % pool.length].name,
      troopIndex: troop, undeadTraitsVersion: 1, savedDamage: encounter.force.damage[troop] ?? null }));
    return { ...encounter, enemies, difficulty: encounter.force.tier, veteranRank: encounter.force.rank,
      generation: encounter.force.generation, cleared: false, factionLabel: 'Ashen Legion',
      reward: encounter.kind === 'undead-host' ? ASHEN_CONFIG.hostGold : encounter.kind === 'undead-liberation' ? ASHEN_CONFIG.liberationGold : ASHEN_CONFIG.commanderGold,
      description: encounter.kind === 'undead-commander' ? 'Defeat this commander to stop its front from closing more settlements.'
        : encounter.kind === 'undead-liberation' ? 'Defeat this force to reopen all settlement services.' : 'Intercept this host before it closes a settlement.' };
  });
}
export function getAshenFinalItem(state) {
  const crisis = state.ashenWinter;
  if (!crisis || crisis.phase !== 'completed') return null;
  const bases = ['greatsword', 'plate-harness', 'greathelm', 'polehammer'];
  return createFamedItemId(bases[crisisHash(`${crisis.seed}:final-base`) % bases.length], crisisHash(`${crisis.seed}:final-item`));
}
export function claimAshenReward(state) {
  const blocked = actionBlocked(state); if (blocked) return blocked;
  const crisis = state.ashenWinter, id = getAshenFinalItem(state);
  if (!id || crisis.finalItemClaimed) return result(false, 'No unclaimed Ashen Winter equipment reward.');
  if (state.inventory.length >= getStashCapacity(state)) return result(false, 'Make room in the stash to claim your equipment reward.');
  state.inventory.push(id); state.inventoryCondition.push(itemCondition(id)); crisis.finalItemClaimed = true;
  record(state, `Claimed ${getItem(id).name}, the Ashen Winter reward.`);
  return result(true, 'Ashen Winter equipment reward claimed.');
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

export function getMountRewardEvents(state) {
  return getMountRewardDefinitions().map(reward => ({
    ...scheduledMountReward(state, reward),
    claimed: state.mountRewards?.[reward.id] === true,
  }));
}

export function claimMountReward(state, rewardId) {
  const reward = getMountRewardDefinitions().find(entry => entry.id === rewardId);
  if (!reward) return result(false, 'That mount reward is not available.');
  if (state.battle || state.gameOver) return result(false, 'Mount rewards can only be claimed while the company is active between battles.');
  const accessBlocked = townBlocked(state, reward.townId); if (accessBlocked) return accessBlocked;
  if (!state.mountRewards || typeof state.mountRewards !== 'object' || Array.isArray(state.mountRewards)) state.mountRewards = {};
  for (const entry of getMountRewardDefinitions()) state.mountRewards[entry.id] = state.mountRewards[entry.id] === true;
  if (state.mountRewards?.[reward.id]) return result(false, `${reward.name} has already been claimed.`);
  if (townAt(state)?.id !== reward.townId) return result(false, `Visit ${reward.townName} to claim this mount.`);
  const scheduled = scheduledMountReward(state, reward);
  if (!scheduled.available) return result(false, `The ${reward.name} is expected around day ${scheduled.availableDay}.`);
  if (state.inventory.length >= getStashCapacity(state)) return result(false, 'The company pack is full. Make room and claim this mount later.');
  if (!Array.isArray(state.inventoryCondition) || state.inventoryCondition.length !== state.inventory.length)
    state.inventoryCondition = state.inventory.map(itemCondition);
  state.inventory.push(reward.itemId);
  state.inventoryCondition.push(null);
  state.mountRewards[reward.id] = true;
  record(state, `Claimed the one-time ${reward.name} reward at ${reward.townName}.`);
  return result(true, `${reward.name} is now in the company stash.`);
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

function cargoFromHere(state,goodId,townId) {
  return (state.cargoOrigins?.[goodId]??[]).filter(lot=>lot.townId===townId).reduce((sum,lot)=>sum+lot.count,0);
}
function recordCargoOrigin(state,goodId,townId,quantity) {
  state.cargoOrigins??={};const lots=state.cargoOrigins[goodId]??=[];
  const lot=lots.find(entry=>entry.townId===townId);
  if(lot)lot.count+=quantity;else lots.push({townId,count:quantity});
}
function consumeCargoOrigins(state,goodId,quantity,townId) {
  if(!state.cargoOrigins?.[goodId])return;
  const lots=state.cargoOrigins[goodId];
  // Sell eligible cargo before local purchases, matching the displayed one-unit quote.
  let remaining=Math.max(0,quantity-Math.max(0,(state.cargo[goodId]??0)-lots.reduce((sum,lot)=>sum+lot.count,0)));
  for(const lot of [...lots].sort((a,b)=>Number(a.townId===townId)-Number(b.townId===townId))){const used=Math.min(remaining,lot.count);lot.count-=used;remaining-=used;}
  state.cargoOrigins[goodId]=lots.filter(lot=>lot.count>0);
  if(!state.cargoOrigins[goodId].length)delete state.cargoOrigins[goodId];
}
function cargoSaleValue(state,town,good,quantity) {
  const base=goodPrices(state,town,good).sellPrice;
  if(!hasRetinue(state,'broker'))return base*quantity;
  const eligible=Math.max(0,(state.cargo[good.id]??0)-cargoFromHere(state,good.id,town.id));
  const rewarded=Math.min(quantity,eligible);
  return Math.floor(base*1.5)*rewarded+base*(quantity-rewarded);
}

function recoveryFactor(state, townId, ordinary = 1) {
  return getSettlementAccess(state, townId).status === 'recovering' ? Math.min(1.5, ordinary * 1.1) : ordinary;
}

function equipmentPrices(state, town, item) {
  const modifiers = townEventModifiers(getTownEvent(state, town.id));
  const ordinaryGear = !['famed','named'].includes(item.rarity) && item.slot !== 'accessory';
  const baseBuyPrice = Math.max(1, Math.round(item.price * GEAR_FACTORS[town.id]));
  const buyPrice = Math.max(1, Math.round(baseBuyPrice * (ordinaryGear ? modifiers.equipmentBuy ?? 1 : 1)));
  let sellPrice = ordinaryGear && modifiers.equipmentSell
    ? Math.max(1, Math.min(buyPrice - 1, Math.max(
      Math.floor(baseBuyPrice * modifiers.equipmentSell),
      Math.ceil(Math.min(...SETTLEMENTS.filter(place => place.id !== town.id).map(place => Math.round(item.price * GEAR_FACTORS[place.id]))) * 1.05),
    ))) : Math.max(1, Math.floor(buyPrice * (['famed','named'].includes(item.rarity) || ordinaryGear && modifiers.equipmentBuy ? .5 : .2)));
  if(hasRetinue(state,'broker'))sellPrice=Math.max(1,Math.min(Math.max(1,buyPrice-1),Math.floor(sellPrice*1.1)));
  return { buyPrice, sellPrice };
}

function rotatedItems(items, state, town, cycle, label) {
  return [...items].sort((a, b) => townEventHash(`${state.seed}:${town.id}:${cycle}:${label}:${a.id}`) - townEventHash(`${state.seed}:${town.id}:${cycle}:${label}:${b.id}`));
}

function defaultArmoryStock(state, town, cycle = armoryCycle(state.day)) {
  const equipment = Object.fromEntries(ITEMS.map(item => [item.id, 0]));
  const facilities = townFacilities(state.seed,town), budget=townArmoryBudget(state.seed,town);
  const gear = ITEMS.filter(item=>item.slot!=='mount'&&!['named','famed'].includes(item.rarity)&&townDesign(item,town)&&(!item.marketChance||townEventHash(`${state.seed}:${town.id}:${cycle}:rare-attachment:${item.id}`)%100<item.marketChance*100));
  const selected=[];
  for(const slot of ['armor','helmet','weapon','shield','attachment','accessory']) {
    const specialist=facilities.some(f=>f.id===(['armor','helmet','attachment'].includes(slot)?'armorsmith':'blacksmith'));
    const count={armor:2+Number(specialist)*2,helmet:2+Number(specialist),weapon:4+Number(specialist)*2,shield:2+Number(specialist),attachment:1+Number(specialist),accessory:4}[slot];
    const common=rotatedItems(gear.filter(item=>item.slot===slot&&item.price<250),state,town,cycle,`${slot}:common`);
    selected.push(...common.slice(0,Math.min(count,budget[slot])));
  }
  const type=SETTLEMENT_TYPES[town.kind];
  const addRotated=(items,count,label)=>{
    for(const item of rotatedItems(items,state,town,cycle,label)){
      if(!count)break;
      const same=selected.filter(i=>i.slot===item.slot);
      if(same.length>=budget[item.slot]){
        const replace=same.filter(i=>i.price<250).at(-1);if(!replace)continue;
        selected.splice(selected.indexOf(replace),1);
      }
      selected.push(item);count--;
    }
  };
  addRotated(gear.filter(i=>i.price>=250&&i.price<450),type.better,'better');
  addRotated(gear.filter(i=>i.price>=450),type.premium,'premium');
  for(const facility of facilities){
    const slots=facility.id==='blacksmith'?['weapon','shield']:['armor','helmet','attachment'];
    addRotated(gear.filter(i=>slots.includes(i.slot)&&i.price>=250&&i.price<450&&!selected.includes(i)),1,`${facility.id}:better`);
    addRotated(gear.filter(i=>slots.includes(i.slot)&&i.price>=450&&!selected.includes(i)),1,`${facility.id}:premium`);
  }
  // Familiar starter essentials remain in the opening town, within its slot budgets.
  if(town.id==='oakwatch'&&cycle===0)for(const id of ['patched-coat','quilted-jack','cloth-hood','leather-cap','spear','arming-sword','wood-axe','buckler','round-shield']){
    const item=getItem(id);if(selected.some(i=>i.id===id))continue;
    const essentials=new Set(['patched-coat','quilted-jack','cloth-hood','leather-cap','spear','arming-sword','wood-axe','buckler','round-shield']);
    const same=selected.filter(i=>i.slot===item.slot&&!essentials.has(i.id));
    if(selected.filter(i=>i.slot===item.slot).length>=budget[item.slot])selected.splice(selected.indexOf(same.at(-1)),1);
    selected.push(item);
  }
  for(const item of selected)equipment[item.id]=1;
  // Named offers require a specialist or a wealthy/garrison settlement; at most one.
  if ((facilities.length||town.kind==='castle'||town.major) && townEventHash(`${state.seed}:${town.id}:${cycle}:named-offer`)%100<8) {
    const rare=[...DLC_ITEMS,...NAMED_WEAPONS].filter(item=>item.rarity==='named'&&item.sourceKind!=='legendary'&&townDesign(item,town));
    if(rare.length){const item=rare[townEventHash(`${state.seed}:${town.id}:${cycle}:named-kind`)%rare.length];
      const premium=ITEMS.filter(i=>i.price>=450&&equipment[i.id]>0);if(premium.length)equipment[premium.at(-1).id]=0;
      const existing=ITEMS.filter(i=>i.slot===item.slot&&equipment[i.id]>0);if(existing.length>=budget[item.slot])equipment[existing.at(-1).id]=0;
      equipment[createFamedItemId(item.id,townEventHash(`${state.seed}:${town.id}:${cycle}:named-rolls`))]=1;
    }
  }
  const mountOffer=cityMountOffer(state.seed,town,cycle);
  if(mountOffer)equipment[mountOffer]=1;
  if (town.id === 'highpass' && cycle % 2 === 1) equipment['riding-horse'] = 1;
  return equipment;
}

function dailyMarketStock(state, town) {
  const type = SETTLEMENT_TYPES[town.kind];
  const modifiers = townEventModifiers(scheduledTownEvent(state, town));
  const goods = Object.fromEntries(GOODS.map(good => {
    const factor = MARKET_FACTORS[town.id][good.id];
    const adjustment = (good.id === 'grain' ? modifiers.grainStock : null) ?? modifiers.goodsStock ?? 0;
    const minimum = good.id === 'grain' && modifiers.grainStock < 0 ? 2 : 0;
    const stock = (factor <= .8 ? 8 : factor >= 1.3 ? 2 : 5) + hashSeed(`${state.seed}:${state.day}:${town.id}:${good.id}`) % 3 + adjustment + type.goods;
    return [good.id, Math.max(minimum, stock)];
  }));
  const baseFood = 18 + (MARKET_FACTORS[town.id].grain <= .8 ? 12 : 0) + hashSeed(`${state.seed}:${state.day}:${town.id}:food`) % 6 + type.food;
  const food = Math.max(modifiers.foodStock < 0 ? 12 : 0, baseFood + (modifiers.foodStock ?? 0));
  const supplies = Object.fromEntries(Object.entries(SUPPLY_INFO).map(([kind, info]) => [kind, info.stock + hashSeed(`${state.seed}:${state.day}:${town.id}:${kind}`) % 3 + type[kind]]));
  return { food, goods, supplies };
}

function addShipmentStock(equipment, state, town, event, cycle) {
  const candidates = ITEMS.filter(item => item.slot !== 'mount' && item.rarity !== 'named' && item.price >= 250 && equipment[item.id] === 0 && townDesign(item,town));
  const count = SETTLEMENT_TYPES[town.kind].shipments + Number(Boolean(town.major));
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
  const equipment = existing && existingCycle === cycle && existing.armoryVersion === ARMORY_STOCK_VERSION
    ? { ...Object.fromEntries([...MOUNTS, ...FRONTIER_ITEMS, ...DLC_ITEMS, ...NAMED_WEAPONS].map(item => [item.id, replenished[item.id]])), ...existing.equipment }
    : replenished;
  let appliedEventId = existing?.armoryVersion === ARMORY_STOCK_VERSION ? existing?.appliedEventId ?? null : null;
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
    armoryVersion: ARMORY_STOCK_VERSION,
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
  if (town.id === 'highpass' && item.id === 'riding-horse' && armoryCycle(state.day) % 2 === 1) return stock;
  if (event?.type === 'arms-shortage' && !['famed','named'].includes(item.rarity) && item.slot !== 'accessory' && item.price >= 250)
    return Math.max(0, stock - 1);
  if (['famed','named'].includes(item.rarity) || event?.type !== 'militia-muster' || item.price < 250) return stock;
  return townEventHash(`${event.id}:${item.id}:reserved`) % 2 === 0 ? 0 : stock;
}

export function getMarket(state, townId) {
  const town = townAt(state);
  if (!town || (townId !== undefined && town.id !== townId) || townBlocked(state, town.id)) return null;
  const stock = marketStock(state, town);
  const event = getTownEvent(state, town.id);
  const cycle = armoryCycle(state.day);
  const famedIds = new Set([...Object.keys(stock.equipment),...(stock.buyback ?? []).map(entry => entry.itemId), ...state.inventory.filter(id => ['famed','named'].includes(getItem(id)?.rarity))].filter(id=>!ITEM_BY_ID.has(id)));
  return {
    town,
    event,
    facilities: townFacilities(state.seed,town),
    armory: {
      cycleStartDay: cycle * ARMORY_ROTATION_DAYS + 1,
      nextRestockDay: (cycle + 1) * ARMORY_ROTATION_DAYS + 1,
      daysUntilRestock: (cycle + 1) * ARMORY_ROTATION_DAYS + 1 - state.day,
      summary: `${SETTLEMENT_TYPES[town.kind].summary} Small regional selections rotate weekly. Blacksmiths expand weapons and shields; armorsmiths expand armor and helmets. Provisions, trade goods, and supplies restock daily.${town.id === 'highpass' ? ' One Riding Horse arrives on days 8, 22, 36 and every 14 days thereafter; available that week until bought.' : ''}`,
    },
    food: { buyPrice: Math.max(2, Math.round(5 * MARKET_FACTORS[town.id].grain * recoveryFactor(state, town.id, townEventModifiers(event).foodBuy ?? 1))), stock: stock.food, owned: state.food },
    equipment: [
      ...ITEMS.map(item => {
        const offers = (stock.buyback ?? []).filter(entry=>entry.itemId===item.id);
        return { itemId: item.id, ...equipmentPrices(state,town,item), stock: visibleEquipmentStock(state,town,item,stock.equipment[item.id],event) + offers.length, owned: state.inventory.filter(id=>id===item.id).length, ...(offers.length ? {condition:offers[0].condition,buyback:true} : {}) };
      }),
      ...[...famedIds].map(itemId => {
        const offers = (stock.buyback ?? []).filter(entry => entry.itemId === itemId);
        return { itemId, ...equipmentPrices(state, town, getItem(itemId)), stock: (stock.equipment[itemId]??0)+offers.length, owned: state.inventory.filter(id => id === itemId).length, condition: offers[0]?.condition ?? null, famed: true, buyback: offers.length > 0 };
      }),
    ],
    goods: GOODS.map(good => {
      const prices=goodPrices(state,town,good),owned=state.cargo?.[good.id]??0,broker=hasRetinue(state,'broker');
      return {goodId:good.id,name:good.name,description:good.description,...prices,
        sellPrice:broker?(owned?cargoSaleValue(state,town,good,1):Math.floor(prices.sellPrice*1.5)):prices.sellPrice,
        brokerLocal:broker&&owned>0&&cargoFromHere(state,good.id,town.id)===owned,
        stock:stock.goods[good.id],owned};
    }),
    supplies: Object.entries(SUPPLY_INFO).map(([kind, info]) => ({ kind, name: info.name, buyPrice: Math.round(info.buyPrice * recoveryFactor(state, town.id)), stock: stock.supplies?.[kind] ?? info.stock, owned: state.supplies?.[kind] ?? 0 })),
  };
}

function validQuantity(quantity, max) { return Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= max; }
function cargoCount(state) { return Object.values(state.cargo).reduce((total, count) => total + count, 0); }

function requireTown(state) {
  const town = townAt(state);
  return town ? townBlocked(state, town.id) ? { error: townBlocked(state, town.id) } : { town } : { error: result(false, 'Visit a settlement to trade or recruit.') };
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
  return { ...(shipment.heldBySiege ? shipment.holdPosition : shipmentPosition(plan, origin, town, shipment.resolvedHour ?? hour)), plan, origin, town };
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
      || state.shipments[town.id]?.startDay === event.startDay || state.shipments[town.id]?.heldBySiege) continue;
    const plan = shipmentPlan(town, SETTLEMENTS, event);
    const origin = TOWN_BY_ID.get(plan.originId);
    if (townBlocked(state, origin.id)) continue;
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
    if (toHour >= plan.arrivalHour && townBlocked(state, townId) && !shipment.heldBySiege) {
      shipment.heldBySiege = true; shipment.holdStartHour = toHour;
      shipment.holdPosition = exteriorPoint(town, SETTLEMENTS);
      record(state, `Armorer wagon waits outside the undead blockade of ${town.name}.`);
    }
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
    } else if ((shipment.status === 'en-route' || shipment.status === 'under-attack' && !contact) && toHour >= plan.arrivalHour && !townBlocked(state, townId)) {
      shipment.status = 'delivered';
      shipment.resolvedHour = shipment.heldBySiege ? toHour : plan.arrivalHour;
      if (shipment.heldBySiege) shipment.heldBySiege = false;
      shipment.attackerId = null;
      shipment.attackerSpawnCycle = null;
      shipment.attackHour = null;
      record(state, `Armorer wagon reaches ${town.name}; new gear is available at a discount.`);
    }
  }
}

export function getCaravans(state) {
  const now = worldHours(state);
  const caravans = Object.entries(state.shipments ?? {}).flatMap(([townId, shipment]) => {
    const town = TOWN_BY_ID.get(townId);
    if (!town || (shipment.resolvedHour !== null && now >= shipment.resolvedHour + CARAVAN_SHORTAGE_HOURS)) return [];
    const travelHours = shipment.travelHours ?? 30;
    const travelStartHour = shipment.travelStartHour ?? (shipment.startDay - 1) * 24;
    const plan = shipmentPlan(town, SETTLEMENTS, { startDay: shipment.startDay }, travelHours, travelStartHour);
    const origin = TOWN_BY_ID.get(plan.originId);
    const position = shipment.heldBySiege ? shipment.holdPosition : shipmentPosition(plan, origin, town, shipment.resolvedHour ?? now);
    const active = shipment.status === 'en-route' || shipment.status === 'under-attack';
    const attackerId = active && shipment.attackerId && bandSpawnCycle(state, shipment.attackerId) === shipment.attackerSpawnCycle
      && (state.bands?.[shipment.attackerId]?.defeatedUntil ?? 0) <= now ? shipment.attackerId : null;
    const attackHoursRemaining = shipment.status === 'under-attack' && attackerId
      ? Math.max(0, shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS - now) : null;
    const contact = active && attackerId ? caravanInContact(state, townId, { ...shipment, travelHours, travelStartHour }, now) : false;
    const description = shipment.heldBySiege && shipment.status !== 'lost' ? `Held outside ${town.name} until the company liberates the settlement.` : shipment.status === 'delivered' ? `Delivered from ${origin.name} to ${town.name}.${getTownEvent(state, town.id)?.type === 'armorer-shipment' ? ' The armory has fresh stock.' : ''}`
      : shipment.status === 'lost' ? `Raiders destroyed the wagon bound for ${town.name}. Arms are scarce there.`
      : attackerId ? `${BAND_BY_ID.get(attackerId).name} are targeting this wagon from ${origin.name} to ${town.name}.`
      : `Friendly armorer wagon traveling from ${origin.name} to ${town.name}.`;
    return [{ id: plan.id, kind: 'caravan', name: `${town.name} Armorer Wagon`, ...position,
      originId: origin.id, destinationId: town.id, status: shipment.status,
      etaHours: active ? Math.max(0, plan.arrivalHour - now) : 0,
      heldBySiege: shipment.heldBySiege === true, attackerId, attackHoursRemaining, contact, resolvedHour: shipment.resolvedHour, description }];
  });
  const rescue = getQuestEncounter(state);
  if (rescue?.kind==='rescue') caravans.push({ id: rescue.id, kind: 'caravan', quest: true, name: 'Besieged Caravan',
    x: rescue.x, y: rescue.y, status: 'under-attack', originId: state.contract.from,
    destinationId: state.contract.to, attackerId: null, attackHoursRemaining: null, contact: true,
    resolvedHour: null, description: 'Caravan guards are holding off raiders until the company arrives.' });
  return caravans;
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
  const pool = tier ? worldEnemyTemplates(band.start.x, band.start.y, tier) : band.enemies;
  const offset = Math.floor(random() * pool.length);
  const committed=worldSkirmishFor(state,band.id);
  const committedTroops=committed?.bTroops??(state.battle?.campId===band.id?state.battle.patrolAssist?.enemyTroops:null);
  const committedSize=committedTroops?Math.max(...committedTroops)+1:0;
  const enemies = Array.from({ length: committedTroops?committedSize:enemyRosterSize(state,tier,count) }, (_, index) => { const enemy = { ...pool[(index + offset) % pool.length] }; return regionalOutfit(enemy, `${state.seed}:${band.id}:${spawnCycle}`, index, band.start.x, band.start.y, tier); });
  if (progression.cavalry && enemies.length) enemies[0].mount = rareEnemyMount(state.seed, band.id, spawnCycle, band.start.x, band.start.y);
  const position = activeBandProgress(state, band);
  const target = position.behavior === 'raiding-caravan' ? getCaravans(state).find(caravan => caravan.id === position.targetId
    && (caravan.status === 'en-route' || caravan.status === 'under-attack')) : null;
  const behavior = position.behavior === 'raiding-caravan' && !target ? 'patrolling' : position.behavior ?? 'patrolling';
  return {
    id: band.id, name: band.name, kind: 'band', difficulty: tier, strength, spawnCycle, veteranRank: progression.rank,
    ...(tier ? { factionId: regionAt(band.start.x,band.start.y).id, factionLabel: WORLD_ENEMY_PROFILES[regionAt(band.start.x,band.start.y).id].label } : {}),
    ...(committed?{battleHoursRemaining:Math.max(0,committed.endHour-worldHours(state))}:{}),
    x: position.x, y: position.y, behavior:committed?'fighting':behavior, targetId: behavior === 'raiding-caravan' ? position.targetId : null,
    enemies: survivingWorldEnemies(state, band.id, spawnCycle, championRoster(state,{id:band.id,spawnCycle,difficulty:tier,enemies:rollEncounterNamed(state,{id:band.id,spawnCycle},enemies)},getItem,championWeaponFactory(armoryTheme(regionAt(band.start.x,band.start.y).id)))),
    description: committed ? `Fighting faction soldiers. About ${Math.ceil(committed.endHour-worldHours(state))} hours remain.` : target ? `These raiders are closing on the armorer wagon bound for ${TOWN_BY_ID.get(target.destinationId).name}. Defeat them before they reach it.`
      : position.behavior === 'hunting-company' ? 'These raiders have spotted the Ashen Company and are giving chase.'
      : tier ? `${enemies.length} armed raiders patrol the frontier. Scout their equipment before engaging.` : `${enemies.length} lightly equipped brigand${enemies.length === 1 ? ' roams' : 's roam'} the road. A good first fight for an untested company.`,
    reward: 0,
  };
}

function survivingWorldEnemies(state,id,cycle,enemies) {
  const losses=state.worldLosses?.[id];
  return enemies.map((enemy,index)=>Object.defineProperty({...enemy},'worldIndex',{value:index})).filter(enemy=>!losses||losses.cycle!==cycle||enemy.worldIndex>=losses.size||losses.survivors.includes(enemy.worldIndex));
}
export function getFactionPatrols(state) { return factionPatrols(state,SETTLEMENTS); }
export function getJoinablePatrolBattle(state,id) {
 const patrol=getFactionPatrols(state).find(p=>p.id===id&&p.active&&p.playerRelation==='ally');
 const fight=patrol&&worldSkirmishFor(state,id);
 return fight&&fight.aId===id&&['band','undead-host'].includes(fight.bKind)&&fight.endHour>worldHours(state)?{patrol,fight}:null;
}
function alliedBattleAgainst(state,id){
 const fight=worldSkirmishFor(state,id);return fight?.bId===id?getJoinablePatrolBattle(state,fight.aId):null;
}
export function joinPatrolBattle(state,id) {
 const blocked=actionBlocked(state);if(blocked)return blocked;
 const joint=getJoinablePatrolBattle(state,id);
 if(!joint)return result(false,'That allied battle has already ended or is unavailable.');
 if(distance(state.position,joint.patrol)>CAMP_RADIUS){
  const travel=travelTo(state,joint.patrol.x,joint.patrol.y);
  if(travel.ok)state.destinationAction={type:'patrol',id};return travel;
 }
 state.destination=null;state.destinationAction=null;state.pursuit=null;
 return startBattle(state,joint.fight.bId,{patrolId:id});
}
function advanceSoldiers(state) {
  const currentHostile=id=>[...getRoamingBands(state),...getUndeadEncounters(state).filter(e=>e.kind==='undead-host')].find(b=>b.id===id);
  advanceFactionSimulation(state,{settlements:SETTLEMENTS,getItem,servicesAvailable:id=>getSettlementAccess(state,id).servicesAvailable,hostiles:()=>[...getRoamingBands(state),...getUndeadEncounters(state).filter(e=>e.kind==='undead-host')],currentHostile,
    hostileResult(target,survivors,won,fight) {
      const current=currentHostile(target.id);if(!current)return;
      if (target.kind === 'undead-host') {
        if (survivors.length) {
          const troops = survivors.map(index => fight?.bTroops[index]??current.enemies[index].troopIndex);
          const damage = Object.fromEntries(Object.entries(current.force.damage).filter(([i])=>troops.includes(Number(i))));
          recordAshenCasualties(state,target.id,troops,damage);
        } else npcAshenVictory(state,target.id);
        return;
      }
      state.worldLosses??={};
      if(survivors.length) {
        const previous=state.worldLosses[target.id];
        state.worldLosses[target.id]={cycle:target.spawnCycle,size:Math.max(previous?.size??0,...(fight?.bTroops??current.enemies.map(e=>e.worldIndex)).map(i=>i+1)),survivors:survivors.map(index=>fight?.bTroops[index]??current.enemies[index].worldIndex)};
      }else {
        delete state.worldLosses[target.id];
        state.bands[target.id]={...state.bands[target.id],defeatedUntil:worldHours(state)+48,spawnCycle:target.spawnCycle+1,behavior:'patrolling',targetId:null};
        for(const shipment of Object.values(state.shipments??{}))if(shipment.attackerId===target.id&&(shipment.status==='under-attack'||shipment.status==='en-route')){shipment.status='en-route';shipment.attackerId=null;shipment.attackerSpawnCycle=null;shipment.attackHour=null;}
      }
    }
  });
}

export function getRoamingBands(state) { return ROAMING_BANDS.map(band => roamingBand(state, band)).filter(Boolean); }

function moveTowardPoint(progress, target, maximum) {
  moveWorldToward(progress,nearestWorldPoint(target)??target,maximum);
}

function moveAlongPatrol(progress, band, maximum) {
  if (!worldSegmentClear(band.start,band.end)) {
    const target=nearestWorldPoint(progress.direction===-1?band.start:band.end);
    if(target && moveWorldToward(progress,target,maximum)) progress.direction=progress.direction===-1?1:-1;
    return;
  }
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
  return SETTLEMENTS.some(town => distance(state.position, town) <= TOWN_RADIUS && getSettlementAccess(state,town.id).servicesAvailable);
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
    if (progress.defeatedUntil > now || worldSkirmishFor(state,band.id)) continue;
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
      && (separation <= BAND_AGGRO_RADIUS * getBandAwarenessMultiplier(state) || progress.behavior === 'hunting-company' && separation <= BAND_CHASE_LEASH * getBandAwarenessMultiplier(state));
    if (canHunt) {
      progress.behavior = 'hunting-company';
      progress.targetId = null;
      const chaseSpeed = terrainSpeed(terrainAt(progress.x, progress.y)) * (1 + BAND_CHASE_BONUS);
      moveTowardPoint(progress, state.position, chaseSpeed * WORLD_STEP_HOURS);
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
  return startBattle(state, bandId, {enemyOpening:true});
}

export function getEncounterSites(state) { return [...getCampSites(state), ...getRoamingBands(state), ...getUndeadEncounters(state), ...getFactionPatrols(state), ...(getQuestEncounter(state) ? [getQuestEncounter(state)] : [])]; }

export function getQuestEncounter(state) {
  const contract = state.contract;
  if(contract?.type==='bounty'){if(contract.defeated)return null;const site=deserterEncounter(state.seed,contract,getItem);return {...site,kind:'bounty',name:'Wanted Champion and Retainers',acceptedDay:contract.acceptedDay,enemies:championRoster(state,{...site,acceptedDay:contract.acceptedDay,enemies:rollEncounterNamed(state,{id:site.id,generation:contract.acceptedDay},site.enemies)},getItem,championWeaponFactory(armoryTheme(regionAt(site.x,site.y).id)),{force:true}),description:'Eight elite faction fighters shelter a wanted champion. Defeat them and return for 1,000 crowns and the right to hire the Bounty Hunter retinue for 5,000 crowns. The defeated champion guarantees their named trophy.'};}
  if(contract?.type==='deserters'){if(contract.defeated)return null;const site=deserterEncounter(state.seed,contract,getItem);return {...site,enemies:rollEncounterNamed(state,{id:site.id,generation:contract.acceptedDay},site.enemies)};}
  if (contract?.type !== 'rescue' || contract.rescued) return null;
  const difficulty = contract.rescueDifficulty ?? 1;
  const pool = worldEnemyTemplates(contract.rescuePoint.x, contract.rescuePoint.y, difficulty);
  const scaling = enemyProgression({ ...state, day: contract.acceptedDay }, difficulty);
  const count = Math.min(6, 4 + scaling.reinforcements);
  const offset = hashSeed(`${state.seed}:${contract.rescueId}:roster`) % pool.length;
  return { id: contract.rescueId, kind: 'rescue', name: 'Besieged Caravan', ...contract.rescuePoint,
    difficulty, enemies: rollEncounterNamed(state,{id:contract.rescueId,generation:contract.acceptedDay},Array.from({ length: count }, (_, index) => regionalOutfit(pool[(offset + index) % pool.length], `${state.seed}:${contract.rescueId}`, index, contract.rescuePoint.x, contract.rescuePoint.y, difficulty))),
    reward: contract.reward, cleared: false, veteranRank: scaling.rank };
}

export function getContractTarget(state) {
  const contract = state.contract;
  if (!contract || contractObjectiveComplete(state, contract)) return null;
  if (['rescue','deserters','bounty'].includes(contract.type)) return getQuestEncounter(state);
  if (contract.type === 'hunt' || contract.type === 'assault') return getCampSites(state).find(site => site.id === contract.campId && !site.cleared && site.generation === contract.campGeneration) ?? null;
  return null;
}

export function pursueBand(state, id) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const band = getRoamingBands(state).find(entry => entry.id === id);
  if (!band) return result(false, 'That band is no longer on the road.');
  const joint=alliedBattleAgainst(state,id);
  if(joint)return joinPatrolBattle(state,joint.patrol.id);
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
  if (worldBlocked({x,y}) || !worldRoute(state.position,{x,y})) return result(false,'These sheer mountain peaks are impassable. Choose a valley or pass.');
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
  if (UNDEAD_TYPES.includes(type)) {
    const joint=alliedBattleAgainst(state,id);
    if(joint)return joinPatrolBattle(state,joint.patrol.id);
    const encounter = getUndeadEncounters(state).find(e => e.id === id);
    if (!encounter) return result(false, 'That undead force is no longer available.');
    if (distance(state.position, encounter) <= CAMP_RADIUS) return startBattle(state, id);
    const travel = travelTo(state, encounter.x, encounter.y);
    if (travel.ok) state.destinationAction = { type: encounter.kind, id };
    return travel;
  }
  if(type==='patrol'){if(getJoinablePatrolBattle(state,id))return joinPatrolBattle(state,id);const patrol=getFactionPatrols(state).find(p=>p.id===id);return result(Boolean(patrol),patrol?`${patrol.name} are ${patrol.playerRelation} soldiers.`:'Patrol unavailable.');}
  if (type === 'caravan' && getQuestEncounter(state)?.id === id) type = 'rescue';
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
  const target = type === 'town' ? TOWN_BY_ID.get(id) : type === 'camp' ? getCampSites(state).find(site => site.id === id)
    : ['rescue','deserters','bounty'].includes(type) ? (getQuestEncounter(state)?.id === id ? getQuestEncounter(state) : null) : null;
  if (!target) return result(false, 'That destination is unavailable.');
  if (type === 'camp' && target.cleared) return result(false, 'This camp has already been cleared.');
  if (type === 'town' && townBlocked(state, id)) {
    const outside = exteriorPoint(target, SETTLEMENTS);
    if (distance(state.position, target) <= TOWN_RADIUS || distance(state.position, outside) <= ARRIVAL_RADIUS) {
      state.position = outside; state.destination = null; state.pursuit = null; state.destinationAction = null;
      return { ...result(true, townBlocked(state, id).message), blockedTown: id };
    }
    const travel = travelTo(state, outside.x, outside.y);
    if (travel.ok) state.destinationAction = { type: 'town', id };
    return travel;
  }
  if (type === 'town' && townAt(state)?.id === id) {
    state.destination = null; state.pursuit = null; state.destinationAction = null;
    return { ...result(true, `Entering ${target.name}.`), openTown: id };
  }
  if (['camp', 'rescue', 'deserters','bounty'].includes(type) && distance(state.position, target) <= CAMP_RADIUS) return startBattle(state, id);
  const travel = travelTo(state, target.x, target.y);
  if (travel.ok) {
    state.destinationAction = { type, id, ...(type === 'camp' ? { generation: target.generation } : {}) };
    return result(true, type === 'camp' ? `Marching to attack ${target.name}.` : ['deserters','bounty'].includes(type) ? `Marching to confront ${target.name}.` : type === 'rescue' ? `Marching to relieve ${target.name}.` : `Traveling to enter ${target.name}.`);
  }
  return travel;
}

function onArrival(state) {
  const town = townAt(state);
  if (town && townBlocked(state, town.id)) return;
  if (!town) {
    record(state, 'The company reaches its destination.');
    return;
  }
  if (!state.visited.includes(town.id)) state.visited.push(town.id);
  record(state, `The company arrives at ${town.name}.`);
  applyCompanyAutomation(state);
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
  if (!contract || contract.to !== town.id || townBlocked(state, town.id)) return false;
  if (['hunt', 'assault', 'rescue', 'deserters','bounty'].includes(contract.type) && !contractObjectiveComplete(state, contract)) return false;
  if (contract.type === 'supply') {
    if ((state.cargo[contract.goodId] ?? 0) < contract.quantity) return false;
    consumeCargoOrigins(state,contract.goodId,contract.quantity,contract.to);
    state.cargo[contract.goodId] -= contract.quantity;
    if (!state.cargo[contract.goodId]) delete state.cargo[contract.goodId];
  }
  state.gold += contract.reward;
  state.renown += contract.renown ?? 1;
  if(contract.type==='bounty'){state.retinue??=defaultRetinue();state.retinue.bountyHunterUnlocked=true;record(state,'The Bounty Hunter is available: hire the retinue for 5,000 crowns for a permanent +5 percentage points to champion encounter chance.');}
  const description = contract.type === 'bounty' ? 'Wanted champion defeated' : contract.type === 'deserters' ? 'Elite deserters defeated' : contract.type === 'hunt' ? 'Brigand hunt completed' : contract.type === 'assault' ? 'Joint assault completed'
    : contract.type === 'rescue' ? 'Caravan rescue completed' : contract.type === 'supply' ? `${contract.quantity} ${GOOD_BY_ID.get(contract.goodId).name.toLowerCase()} delivered` : `Dispatch from ${TOWN_BY_ID.get(contract.from).name} delivered`;
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
  if(contract.type==='deserters'){
    const upgrade=deserterEquipmentReward(state.seed,contract,state.party,getItem);
    if(upgrade){
      const person=state.party.find(p=>p.id===upgrade.personId),original=getItem(upgrade.id);
      const namedId=createFamedItemId(upgrade.id,upgrade.seed),named=getItem(namedId);
      const condition=equippedCondition(person,'active',upgrade.slot);
      person.equipment[upgrade.slot]=namedId;
      const oldMax=upgrade.slot==='shield'?shieldMaximum(upgrade.id):original.armor;
      const newMax=upgrade.slot==='shield'?shieldMaximum(namedId):named.armor;
      // Preserve existing damage; the named item's additional capacity is real.
      setEquippedCondition(person,'active',upgrade.slot,Number.isFinite(oldMax)?condition+newMax-oldMax:condition);
      record(state,`${person.name}'s ${original.name} is upgraded to ${named.name}, a named-quality Deserter contract reward.`);
    }
  }
  state.contract = null;
  return true;
}

function atMidnight(state) {
  const previousDiscovery=discoveryEvent(state);
  state.day += 1;
  const currentDiscovery=discoveryEvent(state);
  if(currentDiscovery?.id!==previousDiscovery?.id||currentDiscovery?.startDay!==previousDiscovery?.startDay){if(previousDiscovery)record(state,`${previousDiscovery.name} has ended.`);if(currentDiscovery)record(state,`${currentDiscovery.name}: ${currentDiscovery.description} Ends after day ${currentDiscovery.endDay}.`);}
  const foodNeeded = dailyFoodConsumption(state);
  const wages = state.party.reduce((total, person) => total + getCompanyStats(person).dailyWage, 0);
  const foodShort = Math.max(0, foodNeeded - state.food);
  const wagesShort = Math.max(0, wages - state.gold);
  state.food = Math.max(0, state.food - foodNeeded);
  state.gold = Math.max(0, state.gold - wages);
  if (foodShort) {
    for (const person of state.party) {
      person.hp = Math.max(1, person.hp - 5);
      if (!isMoraleImmune(person)) person.morale = Math.max(0, person.morale - 12);
    }
    record(state, 'Food ran short overnight. The company is hungry.');
  }
  if (wagesShort) {
    for (const person of state.party) if (!isMoraleImmune(person)) person.morale = Math.max(0, person.morale - 10);
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
    if (state.destinationAction?.type === 'patrol') {
      const joint=getJoinablePatrolBattle(state,state.destinationAction.id);
      if(joint)state.destination={x:joint.patrol.x,y:joint.patrol.y};
      else {state.destination=null;state.destinationAction=null;record(state,'The allied battle has ended before the company could join.');}
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

function advanceWorldStep(state) {
  snapWorldStepClock(state);
  const displaced = advanceAshenWinter(state, ashenContext(state));
  advanceCaravans(state, worldHours(state));
  advanceSoldiers(state);
  const contact = advanceRoamingBands(state);
  if (displaced) return { ...result(true, displaced.message), blockedTown: displaced.townId, interrupted: true };
  if (contact) return startHostileContact(state, contact);
  const undead = getUndeadEncounters(state).find(e => e.kind === 'undead-host' && distance(e, state.position) <= BAND_RADIUS);
  if (undead && !companyInSanctuary(state) && worldHours(state) >= (state.encounterGraceUntil ?? 0)) return startHostileContact(state, undead.id);
  return null;
}

export function tick(state, hours) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 72) return result(false, 'Time must advance by more than zero and at most 72 hours.');
  // Resume old enemy pursuits as assistance, before NPC reservations can split the fight.
  const pendingEnemy=state.pursuit??(UNDEAD_TYPES.includes(state.destinationAction?.type)?state.destinationAction.id:null);
  const joint=pendingEnemy&&alliedBattleAgainst(state,pendingEnemy);
  if(joint){const joined=joinPatrolBattle(state,joint.patrol.id);if(!joined.ok||state.battle)return joined;}
  let remaining = hours;
  let engagement = null;
  while (remaining > 1e-9) {
    const now = worldHours(state);
    const nextWorldStep = (Math.floor((now + 1e-9) / WORLD_STEP_HOURS) + 1) * WORLD_STEP_HOURS;
    const step = Math.min(remaining, Math.max(1e-9, nextWorldStep - now));
    let arrivedAction = null;
    let arrived = false;
    if (state.destinationAction?.type === 'caravan') {
      const caravan = getCaravans(state).find(entry => entry.id === state.destinationAction.id && (entry.status === 'en-route' || entry.status === 'under-attack'));
      if (caravan) state.destination = { x: caravan.x, y: caravan.y };
      else {
        state.destinationAction = null;
        state.destination = null;
        record(state, 'The wagon has left the road; the company stops following it.');
      }
    }
    if (UNDEAD_TYPES.includes(state.destinationAction?.type)) {
      const target = getUndeadEncounters(state).find(e => e.id === state.destinationAction.id);
      if (target) state.destination = { x: target.x, y: target.y };
      else { state.destination = null; state.destinationAction = null; }
    }
    if (state.pursuit) {
      const target = getRoamingBands(state).find(band => band.id === state.pursuit);
      if (target) state.destination = { x: target.x, y: target.y };
      else { state.pursuit = null; state.destination = null; }
    }
    if (state.destination) {
      if (worldBlocked(state.destination)) {
        state.destination=null;state.destinationAction=null;state.pursuit=null;
        record(state,'The old route ends at sheer mountain peaks. Choose a pass around the range.');
      }
    }
    if (state.destination) {
      const distanceLeft = distance(state.position, state.destination);
      const onNewRoad = (state.position.x > 2120 || state.position.y > 1380) && distanceToRoad(state.position.x,state.position.y,WORLD_ROADS) <= 18;
      const speed = (onNewRoad ? SPEED * 1.15 : terrainSpeed(terrainAt(state.position.x, state.position.y))) * getCompanyTravelMultiplier(state);
      const movement = Math.min(distanceLeft, speed * step);
      if (distanceLeft > 0) {
        moveWorldToward(state.position,state.destination,movement);
      }
      if (!state.pursuit && state.destinationAction?.type !== 'caravan' && distance(state.position, state.destination) <= ARRIVAL_RADIUS && worldSegmentClear(state.position,state.destination)) {
        state.position = { ...state.destination };
        state.destination = null;
        arrived = true;
        arrivedAction = state.destinationAction;
        state.destinationAction = null;
      }
    }
    advanceClock(state, step);
    const reachedWorldStep = Math.abs(worldHours(state) / WORLD_STEP_HOURS - Math.round(worldHours(state) / WORLD_STEP_HOURS)) < 1e-7;
    if (reachedWorldStep) engagement = advanceWorldStep(state);
    if (arrived && !engagement) onArrival(state);
    if (reachedWorldStep && state.destinationAction?.type === 'caravan') {
      const caravan = getCaravans(state).find(entry => entry.id === state.destinationAction.id
        && (entry.status === 'en-route' || entry.status === 'under-attack'));
      if (!caravan) { state.destination = null; state.destinationAction = null; }
    }
    if (!engagement && arrivedAction?.type === 'town') {
      const town = TOWN_BY_ID.get(arrivedAction.id), blocked = townBlocked(state, town.id);
      if (blocked) { state.position = exteriorPoint(town, SETTLEMENTS); engagement = { ...result(true, blocked.message), blockedTown: town.id }; }
      else engagement = { ...result(true, `Entering ${town.name}.`), openTown: town.id };
    }
    else if (!engagement && UNDEAD_TYPES.includes(arrivedAction?.type)) {
      const target = getUndeadEncounters(state).find(e => e.id === arrivedAction.id);
      engagement = target ? startBattle(state, target.id) : result(false, 'The undead force is no longer there.');
    }
    else if (!engagement && arrivedAction?.type === 'camp') {
      const camp = getCampSites(state).find(site => site.id === arrivedAction.id);
      engagement = camp && !camp.cleared && camp.generation === arrivedAction.generation
        ? startBattle(state, arrivedAction.id) : result(false, 'That camp is no longer available to attack.');
    }
    else if (!engagement && arrivedAction?.type==='patrol') engagement=joinPatrolBattle(state,arrivedAction.id);
    else if (!engagement && ['rescue','deserters','bounty'].includes(arrivedAction?.type)) engagement = getQuestEncounter(state)?.id === arrivedAction.id
      ? startBattle(state, arrivedAction.id) : result(false, 'The caravan is no longer awaiting rescue.');
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
    if(state.destinationAction?.type==='patrol'&&!getJoinablePatrolBattle(state,state.destinationAction.id)){
      state.destination=null;state.destinationAction=null;record(state,'The allied battle has ended before the company could join.');
    }
    if (engagement) break;
  }
  applyCompanyAutomation(state);
  return engagement ?? result(true, state.destination ? 'The company is on the road.' : 'Time passes.');
}

export function getContractOffers(state, townId) {
  if (state.battle || state.gameOver) return [];
  const town = townAt(state);
  if (!town || town.id !== townId || townBlocked(state, town.id)) return [];
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
  const availableCamps = getCampSites(state).filter(site => !site.cleared).sort((a, b) => distance(a, town) - distance(b, town));
  const camp = availableCamps[0];
  if (camp) offers.push({ id: `hunt-${serial}`, type: 'hunt', from: town.id, to: town.id, campId: camp.id, campGeneration:camp.generation, reward: camp.reward + Math.round(distance(camp, town) * .15 / 5) * 5, renown: 2 });
  const assaultCamp = availableCamps.find(site => site.difficulty >= 2) ?? camp;
  if (assaultCamp) offers.push({ id: `assault-${serial}`, type: 'assault', from: town.id, to: town.id,
    campId: assaultCamp.id, campGeneration: assaultCamp.generation,
    reward: assaultCamp.reward + 150 + Math.round(distance(assaultCamp, town) * .15 / 5) * 5, renown: 3 });
  const road = [...candidates].filter(place => distance(place, town) >= 350).sort((a, b) => distance(a, town) - distance(b, town))[0]
    ?? [...candidates].sort((a, b) => distance(a, town) - distance(b, town))[0];
  const roadDistance = distance(road, town);
  const rescuePoint = { x: Math.round(town.x + (road.x - town.x) * Math.min(190, roadDistance * .7) / roadDistance),
    y: Math.round(town.y + (road.y - town.y) * Math.min(190, roadDistance * .7) / roadDistance) };
  offers.push({ id: `rescue-${serial}`, type: 'rescue', from: town.id, to: town.id,
    rescueId: `rescue-${serial}`, rescuePoint, rescueDifficulty: state.day >= 28 ? 3 : state.day >= 10 ? 2 : 1,
    reward: 260 + Math.min(100, Math.floor(state.day / 5) * 20), renown: 3 });
  const cycle = Math.floor((state.day - 1) / 7);
  const boardSeed = townEventHash(`${state.seed}:${town.id}:${cycle}:board`);
  const count = 1 + boardSeed % 3;
  const deserters=deserterOffer(state,town,serial,rescuePoint);
  if(deserters)offers.push(deserters);
  const bounty=bountyOffer(state,town,serial,rescuePoint,soldierFactionAt(town.x,town.y).id);
  if(bounty)offers.push(bounty);
  const sorted=offers.sort((a, b) => townEventHash(`${boardSeed}:${state.contractSerial}:${a.type}`) - townEventHash(`${boardSeed}:${state.contractSerial}:${b.type}`)).slice(0, count);
  if(deserters&&!sorted.includes(deserters))sorted[sorted.length-1]=deserters;
  if(bounty&&!sorted.includes(bounty)){if(sorted.length<3)sorted.push(bounty);else sorted[sorted.findLastIndex(offer=>offer.type!=='deserters')]=bounty;}
  return sorted;
}

export function acceptContract(state, townId, offerId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const town = townAt(state);
  if (!town || town.id !== townId) return result(false, 'Visit the issuing settlement to take its contract.');
  const accessBlocked = townBlocked(state, town.id); if (accessBlocked) return accessBlocked;
  if (state.contract) return result(false, 'Finish the current delivery before taking another.');
  const offers = getContractOffers(state, townId);
  const offer = offerId === undefined ? offers[0] : offers.find(entry => entry.id === offerId);
  if (!offer) return result(false, 'That contract is no longer available.');
  if(offer.type==='bounty'){state.retinue??=defaultRetinue();state.retinue.bountyBoards[townId]=Math.floor((state.day-1)/7);}
  if(offer.type==='deserters'){state.deserterBoards??={};state.deserterBoards[townId]=Math.floor((state.day-1)/7);}
  state.contractSerial += 1;
  const { id, ...terms } = offer;
  state.contract = { id: `delivery-${state.contractSerial}`, ...terms, acceptedDay: state.day,
    ...(offer.type === 'rescue' ? { rescued: false } : ['deserters','bounty'].includes(offer.type) ? {defeated:false} : {}) };
  const destination = TOWN_BY_ID.get(offer.to);
  const message = offer.type === 'bounty' ? `Defeat the wanted champion and seven elite retainers, then return to ${town.name}. Earn 1,000 crowns and unlock the Bounty Hunter retinue (5,000 crowns to hire).` : offer.type === 'deserters' ? `Hunt elite faction deserters and return to ${town.name} for ${offer.reward} crowns. Hard fight; on completion, 25% chance to upgrade one non-named item equipped by your company.` : offer.type === 'supply'
    ? `Deliver ${offer.quantity} ${GOOD_BY_ID.get(offer.goodId).name.toLowerCase()} to ${destination.name} for ${offer.reward} crowns.`
    : offer.type === 'hunt'
      ? `Clear ${getCampSites(state).find(camp=>camp.id===offer.campId).name} and return to ${town.name} for ${offer.reward} crowns.`
    : offer.type === 'assault'
      ? `Join militia in an assault on ${getCampSites(state).find(camp=>camp.id===offer.campId).name}; return to ${town.name} for ${offer.reward} crowns.`
    : offer.type === 'rescue'
      ? `Relieve the besieged caravan and return to ${town.name} for ${offer.reward} crowns.`
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
  const capacity = kind === 'equipment' ? getStashCapacity(state) - state.inventory.length
    : kind === 'food' ? 1000000000 - state.food : kind === 'goods' ? getCargoCapacity(state) - cargoCount(state)
    : 10000 - state.supplies[id];
  const quantity = Math.max(0, Math.min(offer.stock, Math.floor(state.gold / offer.buyPrice), capacity));
  return { quantity, cost: quantity * offer.buyPrice };
}

export function buyAll(state, kind, id) {
  const blocked = actionBlocked(state); if (blocked) return blocked;
  const access = requireTown(state); if (access.error) return access.error;
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
  if (!validQuantity(quantity, getStashCapacity(state))) return result(false, 'Choose a valid number of items.');
  const offer = getMarket(state).equipment.find(entry => entry.itemId === itemId);
  if (!offer) return result(false, 'This item is not for sale here.');
  if (offer.stock < quantity) return result(false, 'The market does not have that many items today.');
  const cost = offer.buyPrice * quantity;
  if (state.gold < cost) return result(false, 'The company cannot afford this item.');
  if (state.inventory.length + quantity > getStashCapacity(state)) return result(false, 'The company pack is full.');
  state.gold -= cost;
  state.inventory.push(...Array(quantity).fill(item.id));
  if (['famed','named'].includes(item.rarity)) {
    const market = writableMarketStock(state, access.town), buyback = market.buyback ?? [];
    for (let count = 0; count < quantity; count++) {
      const index = buyback.findIndex(entry => entry.itemId === itemId);
      if (index >= 0) state.inventoryCondition.push(buyback.splice(index, 1)[0].condition);
      else { state.inventoryCondition.push(itemCondition(item.id)); market.equipment[itemId] -= 1; }
    }
  } else {
    state.inventoryCondition.push(...Array(quantity).fill(itemCondition(item.id)));
    writableMarketStock(state, access.town).equipment[itemId] -= quantity;
  }
  const message = `Bought ${quantity > 1 ? `${quantity} x ` : ''}${item.name} for ${cost} crowns.`;
  record(state, message);
  mergeOwnedNamedBonuses(state);
  applyCompanyAutomation(state);
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
  if (['famed','named'].includes(item.rarity) && (marketStock(state, access.town).buyback?.length ?? 0) >= MAX_INVENTORY) return result(false, 'The market cannot hold more famed gear.');
  if (!['famed','named'].includes(item.rarity) && marketStock(state, access.town).equipment[itemId] >= 1024) return result(false, 'The armory cannot hold more of that item.');
  state.inventory.splice(index, 1);
  const condition = state.inventoryCondition.splice(index, 1)[0];
  state.gold += sellPrice;
  if (['famed','named'].includes(item.rarity)) (writableMarketStock(state, access.town).buyback ??= []).push({ itemId, condition });
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
  if (!validQuantity(quantity, getCargoCapacity(state))) return result(false, `Choose 1 to ${getCargoCapacity(state)} units of cargo.`);
  const offer = getMarket(state).goods.find(entry => entry.goodId === goodId);
  const cost = offer.buyPrice * quantity;
  if (offer.stock < quantity) return result(false, 'The market does not have that much today.');
  if (state.gold < cost) return result(false, 'The company cannot afford that cargo.');
  if (cargoCount(state) + quantity > getCargoCapacity(state)) return result(false, 'The cargo hold is full.');
  state.gold -= cost;
  recordCargoOrigin(state,goodId,access.town.id,quantity);
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
  if (!validQuantity(quantity, getCargoCapacity(state))) return result(false, `Choose 1 to ${getCargoCapacity(state)} units of cargo.`);
  if ((state.cargo[goodId] ?? 0) < quantity) return result(false, 'The company does not carry that much.');
  const earnings = cargoSaleValue(state,access.town,good,quantity);
  if (state.gold + earnings > 1000000000) return result(false, 'The purse cannot hold more crowns.');
  consumeCargoOrigins(state,goodId,quantity,access.town.id);
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
  if (kind === 'ammo') refillThrowingAmmo(state);
  const message = `Bought ${quantity} ${SUPPLY_INFO[kind].name.toLowerCase()} for ${cost} crowns.`;
  record(state, message);
  return result(true, message);
}

export function setCompanyAutomation(state, key, enabled) {
  const blocked=actionBlocked(state);if(blocked)return blocked;
  if(!['buyAmmo','equipBandages'].includes(key)||typeof enabled!=='boolean')return result(false,'Choose a valid company automation option.');
  state.automation={buyAmmo:false,equipBandages:false,...state.automation,[key]:enabled};
  applyCompanyAutomation(state);
  return result(true,`${key==='buyAmmo'?'Auto-buy ammunition':'Auto-equip bandages'} ${enabled?'enabled':'disabled'}.`);
}

export function applyCompanyAutomation(state) {
  if(state.battle||state.gameOver)return;
  const settlement = townAt(state);
  if(state.automation?.buyAmmo&&settlement&&getSettlementAccess(state,settlement.id).servicesAvailable&&!state.destination){
    refillThrowingAmmo(state);
    while(state.supplies.ammo<AUTO_AMMO_CAP){
      const offer=getMarket(state).supplies.find(s=>s.kind==='ammo');
      const amount=Math.min(100,AUTO_AMMO_CAP-state.supplies.ammo,offer.stock,Math.floor(state.gold/offer.buyPrice));
      if(amount<=0||!buySupplies(state,'ammo',amount).ok)break;
    }
  }
  if(state.automation?.equipBandages){
    const fielded=getBattleRoster(state),members=[...fielded,...state.party.filter(p=>!fielded.includes(p))];
    for(const person of members){
      const best=state.inventory.map(getItem).filter(i=>i?.consumable==='heal').sort((a,b)=>b.heal-a.heal||a.id.localeCompare(b.id))[0];
      if(!best)break;
      const carried=person.accessories.map(getItem),healing=carried.map((i,index)=>({i,index})).filter(e=>e.i?.consumable==='heal');
      if(healing.some(e=>e.i.heal>=best.heal))continue;
      const slot=healing.length?healing.sort((a,b)=>a.i.heal-b.i.heal)[0].index:person.accessories.findIndex(id=>id===null);
      if(slot>=0)equipItem(state,person.id,best.id,`accessory-${slot+1}`);
    }
  }
}

export function getTownServiceQuote(state, service, memberId = null) {
  const town = townAt(state);
  const quote = { ok: false, service, townId: town?.id ?? null, entries: [], totalCost: 0, totalAmount: 0 };
  if (service !== 'doctor' && service !== 'smithy') return { ...quote, message: 'Choose Doctor or Smithy.' };
  const blocked = actionBlocked(state);
  if (blocked) return { ...quote, message: blocked.message };
  if (!town) return { ...quote, message: 'Visit a settlement to use the Doctor or Smithy.' };
  const accessBlocked = townBlocked(state, town.id); if (accessBlocked) return { ...quote, ...accessBlocked };
  const members = memberId === null ? state.party : state.party.filter(person => person.id === memberId);
  if (!members.length) return { ...quote, message: 'Unknown company member.' };
  quote.entries = members.map(person => {
    if (service === 'doctor') {
      const maxHp = getCompanyStats(person).maxHp;
      const hpMissing = Math.max(0, maxHp - person.hp);
      return { memberId: person.id, name: person.name, currentHp: person.hp, maxHp,
        hpMissing, amount: hpMissing, cost: Math.ceil(hpMissing*(hasRetinue(state,'surgeon')?.75:1)) };
    }
    const repairs = [['armor', 'body', 'active'], ['attachment', 'attachment', 'active'], ['attachment2','attachment2','active'], ['helmet', 'head', 'active'], ['shield', 'shield', 'active'], ['shield', 'reserveShield', 'reserve']].flatMap(([slot, part, set]) => {
      const itemId = set === 'reserve' ? person.reserveEquipment.shield : person.equipment[slot];
      if (!itemId) return [];
      const max = slot === 'shield' ? shieldMaximum(itemId) : armorMaximum(itemId);
      const current = person.armorDurability[part];
      return [{ slot, part, set, itemId, current, max, missing: Math.max(0, max - current) }];
    });
    const amount = repairs.reduce((total, repair) => total + repair.missing, 0);
    return { memberId: person.id, name: person.name, repairs, amount, cost: Math.ceil(amount / 2) };
  });
  quote.totalAmount = quote.entries.reduce((total, entry) => total + entry.amount, 0);
  quote.totalCost = quote.entries.reduce((total, entry) => total + entry.cost, 0);
  if (!quote.totalAmount) return { ...quote, message: service === 'doctor' ? 'No healing is needed.' : 'No equipped armor or shields need repairs.' };
  if (state.gold < quote.totalCost) return { ...quote, message: `The company needs ${quote.totalCost} crowns for this service.` };
  return { ...quote, ok: true };
}

export function useTownService(state, service, memberId = null) {
  const quote = getTownServiceQuote(state, service, memberId);
  if (!quote.ok) return { ...result(false, quote.message), ...(quote.code ? { code: quote.code, blockedTown: quote.blockedTown } : {}) };
  state.gold -= quote.totalCost;
  for (const entry of quote.entries) {
    if (!entry.amount) continue;
    const person = state.party.find(member => member.id === entry.memberId);
    if (service === 'doctor') person.hp = entry.maxHp;
    else for (const repair of entry.repairs) person.armorDurability[repair.part] = repair.max;
  }
  const message = service === 'doctor'
    ? `Doctor restores ${quote.totalAmount} HP for ${quote.totalCost} crowns at ${TOWN_BY_ID.get(quote.townId).name}.`
    : `Smithy restores ${quote.totalAmount} armor and shield durability for ${quote.totalCost} crowns at ${TOWN_BY_ID.get(quote.townId).name}.`;
  record(state, message);
  return result(true, message);
}

function equippedCondition(person, destination, slot) {
  if (slot === 'shield') return person.armorDurability[destination === 'reserve' ? 'reserveShield' : 'shield'];
  if (slot === 'weapon') {
    const weaponId = (destination === 'reserve' ? person.reserveEquipment : person.equipment).weapon;
    return throwingCapacity(weaponId) ? person.throwingAmmo?.[destination] ?? throwingCapacity(weaponId) : null;
  }
  if(destination==='attachment-2')return person.armorDurability.attachment2;
  if (destination !== 'active') return null;
  return slot === 'armor' ? person.armorDurability.body : slot === 'attachment' ? person.armorDurability.attachment : slot==='attachment2'?person.armorDurability.attachment2
    : slot === 'helmet' ? person.armorDurability.head : null;
}

function setEquippedCondition(person, destination, slot, condition) {
  if (slot === 'shield') person.armorDurability[destination === 'reserve' ? 'reserveShield' : 'shield'] = condition;
  else if (slot === 'weapon') {
    const itemId = (destination === 'reserve' ? person.reserveEquipment : person.equipment).weapon;
    person.throwingAmmo[destination] = throwingCapacity(itemId) ? restoredCondition(itemId, condition) ?? throwingCapacity(itemId) : 0;
  }
  else if (destination==='attachment-2'||destination==='active'&&slot==='attachment2') person.armorDurability.attachment2=condition;
  else if (destination === 'active' && slot === 'armor') person.armorDurability.body = condition;
  else if (destination === 'active' && slot === 'attachment') person.armorDurability.attachment = condition;
  else if (destination === 'active' && slot === 'helmet') person.armorDurability.head = condition;
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
  const secondAttachment=destination==='attachment-2';
  if(secondAttachment&&(item.slot!=='attachment'||!hasPerk(person,'layered-armor')))return result(false,'Layered Armor unlocks the second attachment slot.');
  const targetSlot=secondAttachment?'attachment2':item.slot;
  if (accessory >= 0 && item.slot !== 'accessory' && !item.pocketWeapon) return result(false, 'Only a supply or pocket weapon fits that slot.');
  if (accessory < 0 && destination !== 'active' && destination !== 'reserve' && !secondAttachment) return result(false, 'Unknown equipment destination.');
  if (accessory < 0 && destination === 'reserve' && !['weapon', 'shield'].includes(item.slot)) return result(false, 'Reserve slots hold a weapon and shield.');
  if (accessory < 0 && destination === 'active' && !SLOTS.includes(item.slot)) return result(false, 'That item needs an accessory slot.');
  const set = destination === 'reserve' ? person.reserveEquipment : person.equipment;
  if ((destination === 'active'||secondAttachment) && item.slot === 'attachment' && !set.armor) return result(false, 'Equip body armor before adding an armor attachment.');
  const previous = accessory >= 0 ? person.accessories[accessory] : set[targetSlot];
  const displaced = accessory >= 0 ? null : item.twoHanded && set.shield ? set.shield
    : item.slot === 'shield' && getItem(set.weapon)?.twoHanded ? set.weapon : null;
  if (state.inventory.length - 1 + Number(Boolean(previous)) + Number(Boolean(displaced)) > getStashCapacity(state)) return result(false, 'The company pack is full.');
  const condition = restoredCondition(itemId, state.inventoryCondition.splice(index, 1)[0]);
  state.inventory.splice(index, 1);
  if (previous) {
    state.inventory.push(previous);
    state.inventoryCondition.push(accessory >= 0 ? null : equippedCondition(person, destination, targetSlot));
  }
  if (displaced) {
    state.inventory.push(displaced);
    state.inventoryCondition.push(equippedCondition(person, destination, item.twoHanded ? 'shield' : 'weapon'));
    if (item.twoHanded) setEquippedCondition(person, destination, 'shield', 0);
    else setEquippedCondition(person, destination, 'weapon', 0);
    set[item.twoHanded ? 'shield' : 'weapon'] = null;
  }
  if (accessory >= 0) person.accessories[accessory] = itemId;
  else set[targetSlot] = itemId;
  if (accessory < 0) setEquippedCondition(person, destination, targetSlot, condition);
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
  if(destination==='attachment-2'){if(slot!=='attachment'&&slot!=='attachment2')return result(false,'Unknown equipment slot.');destination='active';slot='attachment2';}
  if (accessory >= 0 ? slot !== 'accessory' : destination === 'reserve' ? !['weapon', 'shield'].includes(slot) : destination !== 'active' || !SLOTS.includes(slot)) return result(false, 'Unknown equipment slot.');
  const set = destination === 'reserve' ? person.reserveEquipment : person.equipment;
  const itemId = accessory >= 0 ? person.accessories[accessory] : set[slot];
  if (!itemId) return result(false, 'That slot is already empty.');
  const condition = accessory >= 0 ? null : equippedCondition(person, destination, slot);
  const attachedSlots=destination==='active'&&slot==='armor'?['attachment','attachment2'].filter(key=>person.equipment[key]):[];
  if (state.inventory.length + 1 + attachedSlots.length > getStashCapacity(state)) return result(false, 'The company pack is full.');
  for(const key of attachedSlots){state.inventory.push(person.equipment[key]);state.inventoryCondition.push(person.armorDurability[key]);person.equipment[key]=null;person.armorDurability[key]=0;}
  if (accessory >= 0) person.accessories[accessory] = null;
  else set[slot] = null;
  state.inventory.push(itemId);
  state.inventoryCondition.push(condition);
  if (accessory < 0) setEquippedCondition(person, destination, slot, 0);
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
  [person.armorDurability.shield, person.armorDurability.reserveShield] = [person.armorDurability.reserveShield, person.armorDurability.shield];
  [person.throwingAmmo.active, person.throwingAmmo.reserve] = [person.throwingAmmo.reserve, person.throwingAmmo.active];
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
  const profile = makeRecruitProfile(state.seed, town.id, state.day, slot, town.kind);
  const background = RECRUIT_BACKGROUND_BY_ID.get(profile.backgroundId);
  const person = normalizeMember({
    id: `recruit-${town.id}-${state.day}-${slot}`,
    name: profile.name,
    background: background.name,
    backgroundId: background.id,
    ...(background.appearanceId ? { appearanceId: background.appearanceId } : {}),
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
  if (!town || townBlocked(state, town.id)) return [];
  const consumed = new Set(state.hiredRecruitOffers ?? []);
  return Array.from({ length: SETTLEMENT_TYPES[town.kind].hires }, (_, slot) => recruitPerson(state, town, slot))
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
  if (state.party.length >= MAX_COMPANY_SIZE) return result(false, 'The company has room for only eighteen members (15 fielded and 3 reserves).');
  const offers = getRecruitOffers(state);
  const offer = offerId === undefined ? offers[0] : offers.find(entry => entry.id === offerId);
  if (!offer) return result(false, 'That recruit is no longer available here today.');
  if (state.gold < offer.cost) return result(false, `Recruitment costs ${offer.cost} crowns.`);
  const formation = getFormation(state);
  const reserves=getReserveSlots(state),fielded=formation.filter(Boolean).length;
  const vacancy = fielded<MAX_BATTLE_SIZE ? [...FRONT_FORMATION, ...MIDDLE_FORMATION, ...REAR_FORMATION].find(index => formation[index] === null) : reserves.findIndex(id=>id===null);
  if (vacancy === undefined || vacancy < 0) return result(false, 'The company formation has no open place.');
  const person = normalizeMember(offer.person);
  state.party.push(person);
  if(fielded<MAX_BATTLE_SIZE)formation[vacancy]=person.id;else reserves[vacancy]=person.id;
  state.formation = formation;state.reserveIds=reserves;
  state.gold -= offer.cost;
  state.recruitSerial += 1;
  state.hiredRecruitOffers = [
    ...(state.hiredRecruitOffers ?? []).filter(id => recruitOfferDay(id) === state.day),
    offer.id,
  ];
  applyCompanyAutomation(state);
  const message = `${person.name} joins the Ashen Company${fielded>=MAX_BATTLE_SIZE?' in reserve':''} for ${offer.cost} crowns.`;
  record(state, message);
  return result(true, message);
}

export function getLevelUp(person) {
  const next = person?.pendingLevelUps?.[0];
  return next ? { level: next.level, rolls: { ...next.rolls } } : null;
}

export function getPerkPoints(person) {
  const level = Number.isSafeInteger(person?.level) ? person.level : 1;
  const learned = Array.isArray(person?.perks) ? person.perks.filter(id => PERK_BY_ID.has(id)).length : 0;
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
      const interruption = advanceWorldStep(state);
      if (interruption) return interruption;
      if (state.destinationAction?.type === 'caravan') {
        const caravan = getCaravans(state).find(entry => entry.id === state.destinationAction.id && ['en-route', 'under-attack'].includes(entry.status));
        if (!caravan) { state.destination = null; state.destinationAction = null; }
      }
    }
  }
  if (state.pursuit) {
    const target = getRoamingBands(state).find(band => band.id === state.pursuit);
    state.destination = target ? { x: target.x, y: target.y } : null;
    if (!target) state.pursuit = null;
  }
  applyCompanyAutomation(state);
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
    person.hp = clamped(person.hp + (medicated ? 24 : 8) * (hasRetinue(state,'surgeon')?1.25:1), 1, getCompanyStats(person).maxHp);
    if (!isMoraleImmune(person)) person.morale = clamped(person.morale + 9, 0, 100);
  }
  let repairs = 0;
  for (const person of state.party) {
    for (const [part, slot, set] of [['body', 'armor', 'active'], ['attachment', 'attachment', 'active'], ['attachment2','attachment2','active'], ['head', 'helmet', 'active'], ['shield', 'shield', 'active'], ['reserveShield', 'shield', 'reserve']]) {
      const itemId = set === 'reserve' ? person.reserveEquipment.shield : person.equipment[slot];
      const maximum = slot === 'shield' ? shieldMaximum(itemId) : armorMaximum(itemId);
      while (person.armorDurability[part] < maximum && state.supplies.tools > 0) {
        let output=25,cost=1;
        if(hasRetinue(state,'armorer')){
          const repairUnits=125+(state.retinue.repairRemainder??0),toolUnits=4+(state.retinue.toolRemainder??0);
          output=Math.floor(repairUnits/4);state.retinue.repairRemainder=repairUnits%4;
          cost=Math.floor(toolUnits/5);state.retinue.toolRemainder=toolUnits%5;
        }
        person.armorDurability[part] = Math.min(maximum, person.armorDurability[part] + output);
        state.supplies.tools -= cost;
        repairs += cost;
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
  const found = Math.max(3, 3 + Math.ceil(state.party.length / 2) + bonus);
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
  1: ['spear', 'arming-sword', 'wood-axe', 'bludgeon', 'rondel-dagger', 'quilted-jack', 'leather-vest', 'padded-gambeson', 'leather-cap', 'iron-helm', 'round-shield', 'falchion', 'javelins', 'northern-crude-club', 'northern-fur-coat', 'northern-leather-hood'],
  2: ['arming-sword', 'billhook', 'light-crossbow', 'mail-shirt', 'reinforced-mail', 'brigandine', 'kettle-helm', 'bascinet', 'kite-shield', 'fighting-spear', 'polehammer', 'warhammer', 'southern-mail', 'northern-serrated-axe', 'northern-warcleaver', 'northern-rusty-mail', 'northern-rusted-hauberk', 'northern-skull-helm', 'northern-heartwood-shield'],
  3: ['billhook', 'light-crossbow', 'brigandine', 'plate-harness', 'reinforced-mail', 'bascinet', 'greathelm', 'kite-shield', 'arming-sword', 'greatsword', 'greataxe', 'heavy-crossbow', 'coat-of-scales', 'northern-rusty-greatsword', 'northern-heavy-flail', 'northern-heavy-lamellar', 'northern-horned-plate', 'northern-ritual-helm', 'northern-bear-head', 'northern-iron-round-shield'],
};

function famedBasesForCamp(camp) {
  const newCamp = /^wild-camp-(?:1[3-9]|[2-3][0-9])$/.test(camp.id), legacy = FAMED_BASES[camp.difficulty] ?? [];
  return newCamp ? [...legacy, ...DLC_ITEMS.filter(item => (item.sourceArmor ?? item.armor) > 0 && (item.sourceArmor ?? item.armor) <= [0,110,220,400][camp.difficulty]).map(item=>item.id),...NAMED_WEAPONS.filter(item=>camp.difficulty>=2&&namedWeaponFitsTheme(item,camp.factionId==='ancient'?'ancient':armoryTheme(regionAt(camp.x,camp.y).id))).map(item=>item.id)] : legacy;
}

function namedWeaponFitsTheme(item,theme) {
  if(theme==='ancient')return item.sourceCulture==='ancient';
  if(item.sourceCulture==='ancient')return false;
  if(theme==='north'||theme==='south')return item.sourceCulture===theme;
  if(theme==='forest')return item.fatigue<=12;
  return item.sourceCulture==='mercenary';
}
function championWeaponFactory(theme) {
  return (baseId,seed)=>{
    const base=getItem(baseId),pool=NAMED_WEAPONS.filter(item=>namedWeaponFitsTheme(item,theme)
      && weaponSkillFamily(item)===weaponSkillFamily(base)&&Boolean(item.twoHanded)===Boolean(base.twoHanded)
      && Boolean(item.ranged)===Boolean(base.ranged)&&Boolean(item.throwing)===Boolean(base.throwing)
      && (item.range??1)===(base.range??1));
    return createFamedItemId(pool.length?pool[seed%pool.length].id:baseId,seed);
  };
}
function rollEncounterNamed(state,encounter,enemies){return enemies.map((enemy,index)=>({...enemy,...Object.fromEntries(['armor','helmet','weapon','shield'].map(slot=>{const id=enemy[slot],item=getItem(id);return [slot,(item?.sourceArmor!==undefined||item?.sourceNamedWeapon)&&item.rarity==='named'?createFamedItemId(id,hashSeed(`${state.seed}:${encounter.id}:${encounter.generation??encounter.spawnCycle??0}:${index}:${slot}:named-rolls`)):id];}))}));}

function famedDropForCamp(seed, camp) {
  const chance = (FAMED_CHANCES[camp.difficulty] ?? 0) + (camp.discoveryBonuses?.famed??0)/100;
  if (hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-roll`) % 10000 >= chance * 10000) return null;
  const bases = famedBasesForCamp(camp);
  const baseId = bases[hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-base`) % bases.length];
  return createFamedItemId(baseId, hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-item`));
}

function rareEnemyMount(seed, encounterId, cycle, x, y) {
  if (hashSeed(`${seed}:${encounterId}:${cycle}:mounted-elite`) % 100 >= 2) return null;
  const pool=regionalMountPool(x,y,{reward:true});
  return pool[hashSeed(`${seed}:${encounterId}:elite-mount-kind`) % pool.length];
}

function randomCamp(state, id, index, generation) {
  let seed = hashSeed(`${state.seed}:${id}:${generation}`);
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed / 4294967296; };
  const column = index % 4, row = Math.floor(index / 4);
  let x, y;
  for (let attempt=0;attempt<60;attempt++) {
    if (index < 12) {
      x = Math.round(BOUNDS.minX + column * 485 + 65 + random() * 355);
      y = Math.round(BOUNDS.minY + row * (1300/3) + 65 + random() * (1300/3-130));
    } else {
      const cell = FRONTIER_CAMP_CELLS[(index-12) % FRONTIER_CAMP_CELLS.length];
      x = Math.round(cell.x + 40 + random() * (cell.width-80));
      y = Math.round(cell.y + 30 + random() * (cell.height-60));
    }
    if (!SETTLEMENTS.some(town => {const point=authoredPoint(town);return Math.hypot(point.x-x,point.y-y)<90;}) && !CAMP_SITES.some(camp => Math.hypot(camp.x-x,camp.y-y)<85)) break;
  }
  ({x,y}=compactPoint({x,y}));
  const difficulty = column === 0 && row < 2 ? 1 : 1 + Math.floor(random() * 3);
  const ancient=ancientCampAt(x,y,index);
  const pool = ancient ? ancientEnemies(difficulty) : worldEnemyTemplates(x, y, difficulty);
  const count = 2 + difficulty + Math.floor(random() * 2);
  const offset = Math.floor(random() * pool.length);
  const enemies = Array.from({ length: count }, (_, enemyIndex) => { const enemy={ ...pool[(offset + enemyIndex) % pool.length] }; return regionalOutfit(enemy, `${state.seed}:${id}:${generation}`, enemyIndex, x, y, difficulty, {theme:ancient?'ancient':undefined}); });
  const text = ancient ? {factionId:'ancient',factionLabel:'Ancient Legion',name:`Ancient Sepulcher ${index+1}`,description:`${enemies.length} ancient guardians defend a buried legion's tomb in ${regionAt(x,y).name}.`} : worldCampText(x, y, enemies.length, index);
  return {id,...text,...nearestWorldPoint(landmarkCampPoint(nearestWorldPoint({x,y}),state.seed,{settlements:SETTLEMENTS,roads:WORLD_ROADS,camps:CAMP_SITES})),difficulty,enemies,reward:100+difficulty*95,random:true};
}

export function getCampSites(state) {
  return [...CAMP_SITES.map(camp=>camp.id),...RANDOM_CAMP_IDS].map((id,index)=>{
    const progress = campRecord(state,id), fixed = CAMP_BY_ID.get(id);
    const camp = fixed || randomCamp(state,id,index-CAMP_SITES.length,progress.generation);
    const scaling = enemyProgression(state, camp.difficulty);
    const enemies = Array.from({ length: enemyRosterSize(state,camp.difficulty,camp.enemies.length) }, (_, enemyIndex) => { const enemy={...camp.enemies[enemyIndex % camp.enemies.length]}; return !fixed && enemyIndex>=camp.enemies.length ? regionalOutfit(enemy, `${state.seed}:${id}:${progress.generation}`, enemyIndex, camp.x, camp.y, camp.difficulty, {champions:false,theme:camp.factionId==='ancient'?'ancient':undefined}) : enemy; });
    if (scaling.cavalry && enemies.length && camp.factionId!=='ancient') enemies[0].mount = rareEnemyMount(state.seed, camp.id, progress.generation, camp.x, camp.y);
    const discovery=discoveryBonuses(state,{...camp,generation:progress.generation});
    const champions=championRoster(state,{...camp,generation:progress.generation,enemies:rollEncounterNamed(state,{id:camp.id,generation:progress.generation},enemies)},getItem,championWeaponFactory(camp.factionId==='ancient'?'ancient':armoryTheme(regionAt(camp.x,camp.y).id)));
    return {...camp,discoveryBonuses:discovery,description:scaling.reinforcements?`${enemies.length} fighters hold this position. Veteran reinforcements have gathered as your company has grown.`:camp.description,kind:'camp',generation:progress.generation,veteranRank:scaling.rank,famedChance:(FAMED_CHANCES[camp.difficulty]??0)+discovery.famed/100,mountChance:camp.random&&camp.difficulty===3?(12+discovery.mount)/100:0,enemies:survivingWorldEnemies(state,id,progress.generation,champions),cleared:progress.cleared,clearedDay:progress.cleared?state.camps[id].clearedDay:null,respawnHours:progress.cleared?Math.ceil(progress.respawnAt-worldHours(state)):0};
  });
}

export function huntComplete(state, contract=state.contract) {
  const entry=state.camps?.[contract?.campId];
  return ['hunt', 'assault'].includes(contract?.type) && Boolean(entry?.clearedDay) && entry.clearedDay>=contract.acceptedDay && (entry.generation??0)>=(contract.campGeneration??0);
}

export function contractObjectiveComplete(state, contract = state.contract) {
  return ['deserters','bounty'].includes(contract?.type) ? contract.defeated === true : contract?.type === 'rescue' ? contract.rescued === true : huntComplete(state, contract);
}

export function setBattleTactic(state, tactic) {
  if (!TACTICS.includes(tactic)) return result(false, 'Unknown battle tactic.');
  if (state.gameOver) return result(false, 'The company has fallen.');
  if (state.battle && state.battle.status !== 'active') return result(false, 'Finish the battle before changing tactics.');
  if (state.tactic === tactic && (!state.battle || state.battle.tactic === tactic)) return result(true, `Company tactic remains ${tactic}.`);
  if (tactic==='skirmish' && state.battle && state.battle.rulesVersion!==2) return result(false,'Skirmish requires 9-AP battle turns. Choose it before the next battle.');
  state.tactic = tactic;
  if (state.battle) {
    state.battle.tactic = tactic;
    for (const unit of state.battle.units) if (unit.side === 'company') delete unit.skirmishReturn;
    state.battle.focusTargetId = null;
    state.battle.lastContactRound = state.battle.round;
    state.battle.formationAdvance = ['advance-formation', 'shield-wall'].includes(tactic) ? makeFormationAdvancePlan(state.battle) : null;
  }
  const message = `Company tactic set to ${tactic}.`;
  record(state, message);
  return result(true, message);
}

export function setCombatSettings(state, personId, settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings) || Object.keys(settings).length < 1 || Object.keys(settings).length > 2
    || !Object.keys(settings).every(key => ['combatRole', 'skillPreference'].includes(key))) return result(false, 'Unknown combat setting.');
  if (state.gameOver || state.battle) return result(false, 'Change combat settings outside battle.');
  const person = personById(state, personId);
  if (!person) return result(false, 'Unknown company member.');
  if (Object.hasOwn(settings, 'combatRole') && !COMBAT_ROLES.includes(settings.combatRole)
    || Object.hasOwn(settings, 'skillPreference') && !SKILL_PREFERENCES.includes(settings.skillPreference)) return result(false, 'Unknown combat setting.');
  Object.assign(person, settings);
  return result(true, `${person.name}'s combat settings updated.`);
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
  if (weapon.visual === 'northern-sling') return 'stone';
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
    b.initiative * (b.staggeredTurns>0?.5:1) * (b.dazedTurns>0?.75:1) - b.fatigue * .2 - (a.initiative * (a.staggeredTurns>0?.5:1) * (a.dazedTurns>0?.75:1) - a.fatigue * .2) || a.id.localeCompare(b.id)).map(unit => unit.id);
}

function hasShieldSet(unit) {
  if (unit.equipment.shield && unit.shieldDurability > 0 && !getItem(unit.equipment.weapon)?.twoHanded) return true;
  return Boolean(unit.reserveEquipment.shield && unit.reserveShieldDurability > 0 && !getItem(unit.reserveEquipment.weapon)?.twoHanded);
}

function isPureRangedUnit(unit) {
  const active = getItem(unit.equipment.weapon);
  return Boolean(active?.ranged && !active.throwing);
}

function isShieldWallFront(unit) {
  return hasShieldSet(unit) && !isPureRangedUnit(unit);
}

function orderCompanyTurnsForFormation(battle) {
  if (!['advance-formation', 'shield-wall', 'skirmish'].includes(battle.tactic)) return;
  const [dq, dr] = FORMATION_DIRECTIONS[battle.formationAdvance?.direction] ?? FORMATION_DIRECTIONS.e;
  const companySlots = battle.turnOrder.map((id, index) => ({ id, index }))
    .filter(entry => { const unit = battle.units.find(unit => unit.id === entry.id); return unit?.side === 'company' && !unit.ally; });
  const ordered = companySlots.map(entry => battle.units.find(unit => unit.id === entry.id))
    .sort((a, b) => (b.q * dq + b.r * dr) - (a.q * dq + a.r * dr) || b.q - a.q || a.r - b.r || a.id.localeCompare(b.id));
  companySlots.forEach((entry, index) => { battle.turnOrder[entry.index] = ordered[index].id; });
}

function makeFormationAdvancePlan(battle) {
  const company = battle.units.filter(unit => unit.alive && unit.side === 'company' && !unit.ally);
  return {
    step: 1, direction: chooseFormationDirection(battle, company), completedRound: 0,
    startedRound: battle.round,
    origins: Object.fromEntries(battle.units.filter(unit => unit.side === 'company' && !unit.ally).map(unit => [unit.id, { q: unit.q, r: unit.r }])),
  };
}

function chooseFormationDirection(battle, company) {
  const enemies = battle.units.filter(unit => unit.alive && unit.side === 'enemy');
  const companyCenter = { q: company.reduce((sum, unit) => sum + unit.q, 0) / company.length, r: company.reduce((sum, unit) => sum + unit.r, 0) / company.length };
  const enemyCenter = { q: enemies.reduce((sum, unit) => sum + unit.q, 0) / enemies.length, r: enemies.reduce((sum, unit) => sum + unit.r, 0) / enemies.length };
  return Object.entries(FORMATION_DIRECTIONS)
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
  const cells = columns => columns.flatMap(q => FRONT_FORMATION.map(index => ({ q, r: index + 2 })));
  for (const unit of shields) place(unit, cells([2, 1, 0]));
  const rearColumns = shields.some(unit => unit.q === 1) ? [0, 1, 2] : [1, 0, 2];
  for (const unit of rear) place(unit, cells(rearColumns));
}

export function startBattle(state, encounterId, {enemyOpening=false,patrolId=null}={}) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const undead = getUndeadEncounters(state).find(e => e.id === encounterId);
  const encounterType = undead ? undead.kind : getQuestEncounter(state)?.id === encounterId ? state.contract.type : BAND_BY_ID.has(encounterId) ? 'band' : 'camp';
  const camp = undead ?? (['rescue','deserters','bounty'].includes(encounterType) ? getQuestEncounter(state) : encounterType === 'band' ? getRoamingBands(state).find(band => band.id === encounterId) : getCampSites(state).find(site=>site.id===encounterId));
  if (!camp) return result(false, 'That hostile group is no longer here.');
  if (encounterType === 'camp' && camp.cleared) return result(false, `This camp is deserted. Raiders may return in ${camp.respawnHours} hours.`);
  const npcFight=worldSkirmishFor(state,encounterId);
  // A player interception can happen before the next world-simulation step.
  // Bring the nearby patrol along instead of leaving it behind when no NPC
  // skirmish has been committed yet. Never borrow troops from another fight.
  const nearbyPatrol=!npcFight&&!patrolId&&['band','undead-host'].includes(encounterType)
    ?getFactionPatrols(state).filter(p=>p.active&&p.playerRelation==='ally'&&p.behavior!=='returning'&&!worldSkirmishFor(state,p.id)
      &&(state.factionPatrols[p.id]?.cooldownUntil??0)<=worldHours(state)&&distance(p,camp)<=CAMP_RADIUS
      &&(!p.targetId||p.targetId===encounterId))
      .sort((a,b)=>distance(a,camp)-distance(b,camp)||a.id.localeCompare(b.id))[0]:null;
  const assistance=npcFight?getJoinablePatrolBattle(state,patrolId??npcFight.aId):nearbyPatrol?{
    patrol:nearbyPatrol,fight:{aCycle:state.factionPatrols[nearbyPatrol.id].spawnCycle,
      aTroops:[...state.factionPatrols[nearbyPatrol.id].troops],bTroops:camp.enemies.map(e=>e.worldIndex??e.troopIndex)}
  }:null;
  if(patrolId&&(!assistance||assistance.fight.bId!==encounterId))return result(false,'That allied battle is no longer available.');
  const patrolAssist=assistance?{id:assistance.patrol.id,cycle:assistance.fight.aCycle,troops:[...assistance.fight.aTroops],enemyTroops:[...assistance.fight.bTroops]}:null;
  if (state.destination || distance(state.position,patrolId?assistance.patrol:camp) > (patrolId?CAMP_RADIUS:encounterType === 'band' ? BAND_RADIUS + 7 : CAMP_RADIUS)) return result(false, 'Approach the enemy before engaging.');
  if (!getBattleRoster(state).length) return result(false, 'Move a brother from reserve into the formation before fighting.');
  applyCompanyAutomation(state);
  if(['camp','band'].includes(encounterType)){state.discoveryRolls??={};state.discoveryRolls[camp.id]={cycle:camp.generation??camp.spawnCycle,...discoveryBonuses(state,camp)};}
  refillThrowingAmmo(state);
  const field = createBattleField(state.seed, `${camp.id}:${state.day}:${state.contractSerial}`, terrainAt(camp.x, camp.y), {fortified:encounterType === 'camp'});
  const company = getFormation(state).flatMap((personId, index) => {
    const person = personById(state, personId);
    if (!person) return [];
    const stats = getCompanyStats(person);
    return [{
      id: person.id, name: person.name, side: 'company', q: 2 - Math.floor(index / 12), r: 2 + DEPLOYMENT_ROW_OFFSET + index % 12,
      hp: person.hp, maxHp: stats.maxHp, bodyArmor: stats.bodyArmor, attachmentArmor: stats.attachmentArmor, attachment2Armor:stats.attachment2Armor, headArmor: stats.headArmor,
      maxBodyArmor: stats.maxBodyArmor, maxAttachmentArmor: stats.maxAttachmentArmor, maxAttachment2Armor:stats.maxAttachment2Armor, maxHeadArmor: stats.maxHeadArmor,
      shieldDurability: stats.shieldDurability, maxShieldDurability: stats.maxShieldDurability,
      reserveShieldDurability: stats.reserveShieldDurability, maxReserveShieldDurability: stats.maxReserveShieldDurability, battleSetSwapped: false,
      equipment: { ...person.equipment }, reserveEquipment: { ...person.reserveEquipment },
      throwingAmmo: { ...(person.throwingAmmo ?? { active: throwingCapacity(person.equipment.weapon), reserve: throwingCapacity(person.reserveEquipment.weapon) }) },
      accessories: [...person.accessories],
      pocketDrawnFrom: null, pocketStowedWeapon: null, pocketStowedReload: 0, pocketDrawnRound: 0, reserveReload: 0, meleePhase: false,
      perks: [...person.perks], adaptation: 0, berserkRound: 0, frenzyUntilRound: 0, turnStartedRound: 0, freeSwapRound: 0, freeHealRound: 0,
      tacticalRole: resolveCombatRole(person, getItem(person.equipment.weapon), getItem(person.reserveEquipment.weapon), {armor:getItem(person.equipment.armor),mount:getItem(person.equipment.mount)}), skillPreference: person.skillPreference,
      aiTargetId: null, formationMovedRound: 0,
      seed: person.seed, ...(person.appearanceId ? { appearanceId: person.appearanceId } : {}), alive: person.hp > 0,
      morale: person.morale, fatigue: 0, ap: 9, reload: 0, shieldWallActive: false,
      spearwallActive: false, riposteActive: false, stunnedTurns: 0, stunProtected: false, pendingBerserkAp: 0,
      meleeSkill: stats.meleeSkill, rangedSkill: stats.rangedSkill,
      meleeDefense: stats.meleeDefense - (hasPerk(person, 'dodge') ? Math.floor(stats.initiative * .15) : 0)
        - (hasPerk(person, 'reach-advantage') && getItem(person.equipment.weapon)?.twoHanded && !getItem(person.equipment.weapon)?.ranged ? 5 : 0),
      rangedDefense: stats.rangedDefense - (hasPerk(person, 'dodge') ? Math.floor(stats.initiative * .15) : 0),
      maxFatigue: stats.maxFatigue, initiative: stats.initiative, resolve: stats.resolve,
    }];
  });
  if (['shield-wall','skirmish'].includes(state.tactic)) shieldWallDeployment(company);
  const makeEnemyUnit = (enemy, index, unitDifficulty=camp.difficulty, unitRank=camp.veteranRank??0, undeadUnit=Boolean(undead)) => {
    const rank = unitRank;
    const rareMount = getItem(enemy.mount);
    const gear = { armor: enemy.armor, attachment: enemy.attachment ?? null, attachment2:null, helmet: enemy.helmet, weapon: enemy.weapon, shield: enemy.shield, mount: rareMount?.id ?? null };
    const shieldDefense = getItem(gear.shield)?.defense ?? 0;
    const role = enemyRoleBonuses(enemy, CAMP_BY_ID.has(camp.id) ? 0 : unitDifficulty);
    const bonus = key => (getItem(gear.armor)?.statBonuses?.[key] ?? 0) + (getItem(gear.helmet)?.statBonuses?.[key] ?? 0);
    const baseHp = 25 + unitDifficulty * 12 + rank * 8 + ((enemy.troopIndex ?? index) === 0 && unitDifficulty === 3 ? 12 : 0);
    const hp=enemy.champion?Math.ceil(baseHp*1.4):baseHp,championSkill=enemy.champion?12:0,championDefense=enemy.champion?8:0;
    return {
      ...(enemy.champion?{champion:true,championItemId:enemy.championItemId}:{}),
      id: `enemy-${(enemy.troopIndex ?? index) + 1}`, ...(undeadUnit ? { undeadTraitsVersion: 1, troopIndex: enemy.troopIndex } : {}), name: enemy.name, side: 'enemy', q: getItem(gear.weapon)?.ranged ? 12 + Math.floor(index / 12) : 11 - Math.floor(index / 12), r: 2 + DEPLOYMENT_ROW_OFFSET + FRONT_FORMATION[index % 12],
      hp: enemy.savedDamage?.hp ?? hp, maxHp: hp, bodyArmor: enemy.savedDamage?.bodyArmor ?? armorMaximum(gear.armor), attachmentArmor: armorMaximum(gear.attachment), attachment2Armor:0, maxAttachment2Armor:0, headArmor: enemy.savedDamage?.headArmor ?? armorMaximum(gear.helmet),
      maxBodyArmor: armorMaximum(gear.armor), maxAttachmentArmor: armorMaximum(gear.attachment), maxHeadArmor: armorMaximum(gear.helmet),
      shieldDurability: enemy.savedDamage?.shieldDurability ?? shieldMaximum(gear.shield), maxShieldDurability: shieldMaximum(gear.shield),
      reserveShieldDurability: 0, maxReserveShieldDurability: 0, battleSetSwapped: false,
      equipment: gear, reserveEquipment: { weapon: null, shield: null },
      throwingAmmo: { active: throwingCapacity(gear.weapon), reserve: 0 }, accessories: [null, null],
      pocketDrawnFrom: null, pocketStowedWeapon: null, pocketStowedReload: 0, pocketDrawnRound: 0, reserveReload: 0, meleePhase: false,
      perks: role.perks, adaptation: 0, berserkRound: 0, frenzyUntilRound: 0, turnStartedRound: 0, freeSwapRound: 0, freeHealRound: 0,
      seed: hashSeed(`${state.seed}:${camp.id}:${enemy.troopIndex ?? index}`), alive: true,
      morale: undeadUnit ? 60 : 55 + unitDifficulty * 8, fatigue: 0, ap: 9, reload: 0, shieldWallActive: false, aiTargetId: null, formationMovedRound: 0,
      spearwallActive: false, riposteActive: false, stunnedTurns: 0, stunProtected: false, pendingBerserkAp: 0,
      meleeSkill: 30 + championSkill + unitDifficulty * 6 + rank * 4 + (rareMount?.hitBonus ?? 0) + role.meleeSkill, rangedSkill: 28 + championSkill + unitDifficulty * 6 + rank * 4 + (rareMount?.hitBonus ?? 0) + role.rangedSkill,
      meleeDefense: 2 + championDefense + unitDifficulty * 2 + rank * 2 + shieldDefense + bonus('meleeDefense') + (rareMount?.meleeDefenseBonus ?? 0),
      rangedDefense: 2 + championDefense + unitDifficulty * 2 + rank * 2 + (getItem(gear.shield)?.rangedDefense ?? shieldDefense) + bonus('rangedDefense') + (rareMount?.rangedDefenseBonus ?? 0) + attachmentBonus(gear,'rangedDefenseBonus'),
      maxFatigue: 85 + (enemy.champion?20:0) + bonus('maxFatigue') - (rareMount?.fatigue ?? 0), initiative: 75 + (enemy.champion?8:0) + unitDifficulty * 6 + rank * 3 + (rareMount?.initiativeBonus ?? 0) + role.initiative + attachmentBonus(gear,'initiativeBonus'), resolve: 32 + (enemy.champion?20:0) + unitDifficulty * 8 + rank * 4 + bonus('resolve'),
    };
  };
  const enemies=camp.enemies.map((e,i)=>makeEnemyUnit(e,i));
  const jointBattle = encounterType === 'undead-liberation' || encounterType === 'rescue' || encounterType === 'camp' && state.contract?.type === 'assault'
    && state.contract.campId === camp.id && state.contract.campGeneration === camp.generation && !huntComplete(state);
  // Additional ranged ranks cannot occupy q=13, the camp's rear palisade.
  // Keep legal original cells and place overflow in free walkable deployment
  // cells, preserving deterministic placement and troop identity.
  const enemyOccupied=new Set(company.map(u=>`${u.q},${u.r}`));
  for(const unit of enemies){
    if(!passableHex(unit,field)||enemyOccupied.has(`${unit.q},${unit.r}`)){
      const columns=getItem(unit.equipment.weapon)?.ranged?[12,11,10,9]:[11,10,9,12];
      const rows=[unit.r,...FRONT_FORMATION.map(r=>r+2+DEPLOYMENT_ROW_OFFSET).filter(r=>r!==unit.r)];
      const point=columns.flatMap(q=>rows.map(r=>({q,r}))).find(h=>passableHex(h,field)&&!enemyOccupied.has(`${h.q},${h.r}`));
      if(!point)return result(false,'No room to deploy the enemy force.');
      Object.assign(unit,point);
    }
    enemyOccupied.add(`${unit.q},${unit.r}`);
  }
  const allies = [];
  if (jointBattle||patrolAssist) for (let index = 0; index < (patrolAssist?patrolAssist.troops.length:3); index++) {
    const allyRank = camp.veteranRank ?? 0;
    const gear = { armor: 'patched-coat', attachment: null, attachment2:null, helmet: 'cloth-hood',
      weapon: ['arming-sword', 'spear', 'bludgeon'][index], shield: index === 1 ? 'round-shield' : 'buckler', mount: null };
    const occupied = new Set([...company, ...enemies, ...allies].map(unit => `${unit.q},${unit.r}`));
    const edgeRows=hashSeed(`${state.seed}:${camp.id}:ally-edge`)%2?[19,20]:[4,3];
    const point = [...edgeRows,...(edgeRows[0]>10?[18,21,17,22]:[5,2,6,1])].flatMap(r => [9,10,8,7,6].map(q => ({q,r})))
      .find(hex => passableHex(hex, field) && !occupied.has(`${hex.q},${hex.r}`));
    if(!point)return result(false,'No room to deploy allied reinforcements.');
    if(patrolAssist){
      const soldier=makeEnemyUnit(assistance.patrol.enemies[index],index,assistance.patrol.difficulty,0,false);
      delete soldier.undeadTraitsVersion;delete soldier.troopIndex;
      Object.assign(soldier,{id:`ally-${index+1}`,side:'company',ally:true,q:point.q,r:point.r,morale:70});
      allies.push(soldier);continue;
    }
    const shield = shieldMaximum(gear.shield);
    allies.push({ id: `ally-${index + 1}`, name: encounterType === 'rescue' ? ['Caravan Guard', 'Wagon Spearman', 'Caravan Veteran'][index]
      : ['Militia Captain', 'Militia Spearman', 'Militia Fighter'][index], side: 'company', ally: true,
      q: point.q, r: point.r, hp: 62 + allyRank * 8, maxHp: 62 + allyRank * 8, bodyArmor: armorMaximum(gear.armor), attachmentArmor: 0, attachment2Armor:0, maxAttachment2Armor:0, headArmor: armorMaximum(gear.helmet),
      maxBodyArmor: armorMaximum(gear.armor), maxAttachmentArmor: 0, maxHeadArmor: armorMaximum(gear.helmet),
      shieldDurability: shield, maxShieldDurability: shield, reserveShieldDurability: 0, maxReserveShieldDurability: 0, battleSetSwapped: false,
      equipment: gear, reserveEquipment: { weapon: null, shield: null }, throwingAmmo: { active: 0, reserve: 0 }, accessories: [null, null],
      spearwallActive: false, riposteActive: false, stunnedTurns: 0, stunProtected: false, pendingBerserkAp: 0,
      pocketDrawnFrom: null, pocketStowedWeapon: null, pocketStowedReload: 0, pocketDrawnRound: 0, reserveReload: 0, meleePhase: false,
      perks: [], adaptation: 0, berserkRound: 0, frenzyUntilRound: 0, turnStartedRound: 0, freeSwapRound: 0, freeHealRound: 0,
      seed: hashSeed(`${state.seed}:${camp.id}:ally:${index}`), alive: true, morale: 70, fatigue: 0, ap: 9, reload: 0, shieldWallActive: false, aiTargetId: null, formationMovedRound: 0,
      meleeSkill: 47 + allyRank * 3, rangedSkill: 25, meleeDefense: 7 + allyRank + getItem(gear.shield).defense,
      rangedDefense: 7 + allyRank + (getItem(gear.shield).rangedDefense??getItem(gear.shield).defense), maxFatigue: 85, initiative: 75 + allyRank * 2, resolve: 45 + allyRank * 2 });
  }
  // Resolve each soldier once from the full loadout, including NPC mounts.
  for(const unit of [...enemies,...allies])unit.tacticalRole=resolveCombatRole({},getItem(unit.equipment.weapon),getItem(unit.reserveEquipment.weapon),{armor:getItem(unit.equipment.armor),mount:getItem(unit.equipment.mount)});
  const battle = {
    id: `battle-${camp.id}-${state.day}-${state.contractSerial}`, campId: camp.id,
    ...(undead ? { crisisContext: { crisisId: state.ashenWinter.crisisId, frontId: undead.frontId, townId: undead.townId, forceSeed: undead.force.seed, generation: undead.force.generation } } : {}),
    ...(patrolAssist?{patrolAssist}:{}),
    encounterType, encounterName: camp.name, difficulty: camp.difficulty, campGeneration: encounterType === 'camp' ? camp.generation : null,
    famedDrop: encounterType === 'camp' ? famedDropForCamp(state.seed, camp) : null, mountReward: encounterType==='camp' ? campMountReward(state.seed,camp,camp.discoveryBonuses?.mount??0) : null, field,
    tactic: state.tactic ?? 'offense', focusTargetId: null, lastContactRound: 1, engaged: false,
    status: 'active', lighting:getTimeOfDay(state.hour).phase, escapeRulesVersion:1, enemyScalingVersion:1, enemyTacticsVersion:1, championRulesVersion:1, attachmentRulesVersion:1, rulesVersion: 2, weaponSkillsVersion: 1, weaponAuditVersion: 1, weaponCompletionVersion: 1, roleConsistencyVersion: 1, mountSkillsVersion: 1, mountBalanceVersion: 1, round: 1, activeId: null, units: [...company, ...allies, ...enemies],
    enemyOpening: encounterType==='band'&&enemyOpening,
    turnOrder: [], turnIndex: 0, rng: hashSeed(`${state.seed}:${camp.id}:${state.day}:${state.contractSerial}`),
    lootSeed: hashSeed(`${state.seed}:${camp.id}:${encounterType === 'band' ? camp.spawnCycle : camp.generation}:salvage`),
    log: [], lastEvent: null,
    loot: { gold: 0, food: 0, tools: 0, medicine: 0, ammo: 0, items: [], itemConditions: [] },
    casualties: [], xp: {},
  };
  battle.enemyTacticalState = {tactic:enemyBattleTactic(battle,getItem),lastChangedRound:1,lastEvaluatedRound:0,lastRangedAttackRound:0};
  battle.enemyAdaptiveRulesVersion = 1;
  for (const unit of battle.units) unit.movementCredit = Math.max(0, movementBudget(unit, battle) - 2) * 2;
  battle.formationAdvance = ['advance-formation', 'shield-wall'].includes(battle.tactic) ? makeFormationAdvancePlan(battle) : null;
  battle.turnOrder = sortTurnOrder(battle);
  orderCompanyTurnsForFormation(battle);
  if(battle.enemyOpening)battle.turnOrder.sort((a,b)=>Number(battle.units.find(u=>u.id===b).side==='enemy')-Number(battle.units.find(u=>u.id===a).side==='enemy'));
  battle.activeId = battle.turnOrder[0];
  battleLog(battle, battle.enemyOpening?`${camp.name} catch the company. Enemies act first in the opening round.`:`The company engages ${camp.name}.`);
  cancelWorldSkirmish(state,encounterId);
  state.battle = battle;
  state.destination = null;
  state.destinationAction = null;
  state.pursuit = null;
  const message = `Battle begins at ${camp.name}.`;
  record(state, message);
  return result(true, message);
}

function nextBattleTurn(battle) {
  const previous = battle.units.find(unit => unit.id === battle.activeId);
  if (previous?.howlTurns > 0) previous.howlTurns -= 1;
  if(battle.weaponCompletionVersion===1)for(const key of ['dazedTurns','staggeredTurns','disarmedTurns'])if(previous?.[key]>0)previous[key]--;
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
      unit.ap = battle.rulesVersion === 2 ? 9 + (battle.weaponSkillsVersion === 1 ? unit.pendingBerserkAp ?? 0 : 0) : 2;
      if (battle.rulesVersion === 2) {
        unit.shieldWallActive = false;
        if (battle.weaponSkillsVersion === 1) {
          unit.spearwallActive = false;
          unit.riposteActive = false;
          unit.pendingBerserkAp = 0;
        }
        unit.movementCredit = Math.max(0, movementBudget(unit, battle) - 2) * 2;
      }
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
  const addItem = (id, condition = itemCondition(id), trophy=false) => {
    if (id && items.length < (trophy&&battle.enemyScalingVersion===1?80:24)) { items.push(id); itemConditions.push(condition); }
  };
  const guaranteed=new Set();
  for(const enemy of enemies)if(enemy.champion&&!enemy.escaped)for(const slot of ['weapon','shield','armor','helmet']){const id=enemy.equipment[slot];if(!['famed','named'].includes(getItem(id)?.rarity))continue;const maximum=itemCondition(id),worn=slot==='armor'?enemy.bodyArmor:slot==='helmet'?enemy.headArmor:slot==='shield'?enemy.shieldDurability:getItem(id)?.throwing?enemy.throwingAmmo?.active:null;addItem(id,maximum===null?null:Math.max(Math.ceil(maximum*.25),worn??maximum),true);guaranteed.add(`${enemy.id}:${slot}`);}
  if (!band) {addItem(battle.famedDrop);addItem(battle.mountReward);}
  for (const enemy of enemies) {
    for (const slot of ['weapon', 'shield', 'armor', 'attachment', 'attachment2', 'helmet']) {
      const id = enemy.equipment[slot];
      if (!id || items.length >= 24 || guaranteed.has(`${enemy.id}:${slot}`)) continue;
      const maximum = armorMaximum(id);
      const condition = slot === 'weapon' && getItem(id)?.throwing ? enemy.throwingAmmo?.active ?? throwingCapacity(id)
        : slot === 'armor' ? enemy.bodyArmor : slot === 'attachment' ? enemy.attachmentArmor : slot==='attachment2'?enemy.attachment2Armor : slot === 'helmet' ? enemy.headArmor : slot === 'shield' ? enemy.shieldDurability : null;
      if (maximum && condition < Math.ceil(maximum * .25)) continue;
      const chance = ['named','famed'].includes(getItem(id)?.rarity) ? 100 : slot === 'weapon' ? 70 : slot === 'shield' ? 55 : 40;
      if (roll(`${enemy.id}:${slot}`, 100) < chance) addItem(id, condition);
    }
    if (enemy.equipment.mount && roll(`${enemy.id}:mount-capture`, 2) === 0) addItem(enemy.equipment.mount);
  }
  if (!items.length || items.length === 1 && items[0] === battle.famedDrop) {
    const fallback = enemies[0];
    const weaponId = fallback?.equipment.weapon;
    const condition = getItem(weaponId)?.throwing ? fallback.throwingAmmo?.active ?? throwingCapacity(weaponId) : itemCondition(weaponId);
    addItem(weaponId, condition);
  }
  return {
    gold: UNDEAD_TYPES.includes(battle.encounterType) ? (battle.encounterType === 'undead-host' ? ASHEN_CONFIG.hostGold : battle.encounterType === 'undead-liberation' ? ASHEN_CONFIG.liberationGold : ASHEN_CONFIG.commanderGold) : (band ? 20 + enemies.length * 17 + tier * 12 : 45 + enemies.length * 14 + tier * 25) + roll('gold', band ? 21 : 31),
    food: (band ? 2 : 2 + tier) + roll('food', 3),
    tools: (band ? 1 : 1 + tier) + roll('tools', 2),
    medicine: band ? roll('medicine', 2) : Number(tier >= 2) + roll('medicine', 2),
    ammo: (band ? 2 : 2 + tier) + roll('ammo', 3),
    items, itemConditions,
  };
}

function finishBattlePhase(battle) {
  const companyAlive = battle.units.some(unit => unit.side === 'company' && !unit.ally && unit.alive);
  const enemiesAlive = battle.units.some(unit => unit.side === 'enemy' && unit.alive);
  if (companyAlive && enemiesAlive) return false;
  battle.status = companyAlive ? 'victory' : 'defeat';
  battle.activeId = null;
  battle.casualties = battle.units.filter(unit => unit.side === 'company' && !unit.ally && !unit.alive).map(unit => unit.id);
  if (companyAlive) {
    const enemies = battle.units.filter(unit=>unit.side==='enemy' && !unit.escaped);
    battle.loot = victoryLoot(battle, enemies);
    for (const unit of battle.units.filter(entry => entry.side === 'company' && !entry.ally && entry.alive)) {
      battle.xp[unit.id] = (battle.xp[unit.id] ?? 0) + 30;
    }
  }
  battleLog(battle, companyAlive && UNDEAD_TYPES.includes(battle.encounterType) ? 'The undead force is destroyed.' : companyAlive ? battle.encounterType === 'band' ? 'The brigands break and flee the road.' : 'The brigands break. The camp is yours.' : 'The company is defeated.');
  return true;
}

function openNeighbors(battle, point, occupied) {
  return hexNeighbors(battle.field, point)
    .filter(next => Number.isFinite(movementCost(battle.field, point, next)) && !occupied.has(`${next.q},${next.r}`));
}

function battleMovementCost(battle, actor, from, to) {
  if (battle.units.some(unit => unit.alive && unit.side !== actor.side && getItem(unit.equipment.mount)
    && hexDistance(from, unit) <= 1 && hexDistance(to, unit) > 1)) return Infinity;
  const cost = movementCost(battle.field, from, to);
  if (!Number.isFinite(cost)) return Infinity;
  return hasPerk(actor, 'pathfinder') ? Math.max(1, cost - 1) : cost;
}

function movementFatigue(actor, cost) {
  return cost * (hasPerk(actor, 'marathoner') ? 2 : 3);
}

function movementBudget(actor, battle) {
  const lightArmor = (getItem(actor.equipment.armor)?.fatigue ?? 0) + (battle?.attachmentRulesVersion===1?0:getItem(actor.equipment.attachment)?.fatigue??0)
    + (getItem(actor.equipment.helmet)?.fatigue ?? 0) <= 15;
  return 2 + (getItem(actor.equipment.mount) && battle?.mountBalanceVersion !== 1 ? 2 : 0) + Number(lightArmor && hasPerk(actor, 'fleet-footed'));
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

function shieldDefenseFor(actor, shieldId, durability = actor.shieldDurability, ranged=false) {
  const item=getItem(shieldId),defense=durability>0?(ranged?item?.rangedDefense??item?.defense??0:item?.defense??0):0;
  return (hasPerk(actor, 'shield-expert') ? Math.ceil(defense * 1.25) : defense)
    + (defense && hasPerk(actor, 'shield-bearer') ? 5 : 0);
}

function changeBattleWeapon(actor, weaponId, shieldId, shieldDurability = actor.shieldDurability, battle=null) {
  const oldDefense = shieldDefenseFor(actor, actor.equipment.shield),oldRangedDefense=shieldDefenseFor(actor,actor.equipment.shield,actor.shieldDurability,true);
  const oldFatigue = battleGearFatigue(actor.equipment);
  actor.equipment.weapon = weaponId;
  if(roleRules(battle)&&!getItem(weaponId)?.ranged)delete actor.skirmishReturn;
  actor.equipment.shield = shieldId;
  actor.shieldWallActive = false;
  if (Object.hasOwn(actor, 'spearwallActive')) actor.spearwallActive = false;
  if (Object.hasOwn(actor, 'riposteActive')) actor.riposteActive = false;
  actor.shieldDurability = shieldDurability;
  actor.maxShieldDurability = shieldMaximum(shieldId);
  const defenseDelta = shieldDefenseFor(actor, shieldId) - oldDefense;
  const newFatigue = battleGearFatigue(actor.equipment);
  const fatigueDelta = oldFatigue - newFatigue;
  const armorFatigue = (getItem(actor.equipment.armor)?.fatigue ?? 0) + (battle?.attachmentRulesVersion===1?0:getItem(actor.equipment.attachment)?.fatigue??0)
    + (getItem(actor.equipment.helmet)?.fatigue ?? 0);
  const armorPenalty = hasPerk(actor, 'brawny') ? Math.floor(armorFatigue * .7) : armorFatigue;
  const initiativeDelta = hasPerk(actor, 'relentless')
    ? Math.ceil((armorPenalty + oldFatigue) / 2) - Math.ceil((armorPenalty + newFatigue) / 2) : fatigueDelta;
  actor.meleeDefense += defenseDelta;
  actor.rangedDefense += shieldDefenseFor(actor,shieldId,shieldDurability,true)-oldRangedDefense;
  actor.maxFatigue = Math.max(30, actor.maxFatigue + fatigueDelta);
  actor.initiative = Math.max(20, actor.initiative + initiativeDelta);
}

function useBattleAccessory(state, actor, enemies) {
  if (actor.side !== 'company') return false;
  const index = actor.accessories.findIndex(id => getItem(id)?.consumable === 'heal' && actor.hp <= actor.maxHp * .5);
  const safeToRecover = Math.min(...enemies.map(enemy => hexDistance(actor, enemy))) >= 2;
  const selected = index >= 0 ? index : safeToRecover
    ? actor.accessories.findIndex(id => getItem(id)?.consumable === 'recover' && actor.fatigue >= actor.maxFatigue * .75)
    : -1;
  if (selected < 0) return false;
  const item = getItem(actor.accessories[selected]);
  if (item.consumable === 'heal' && actor.hp >= actor.maxHp || item.consumable === 'recover' && actor.fatigue === 0) return false;
  const free = item.consumable === 'heal' && hasPerk(actor, 'combat-bandaging') && actor.freeHealRound !== state.battle.round;
  if (!free && state.battle.rulesVersion === 2 && actor.ap < 4) return false;
  if (item.consumable === 'heal') actor.hp = Math.min(actor.maxHp, actor.hp + item.heal);
  else actor.fatigue = Math.max(0, actor.fatigue - item.recover);
  actor.accessories[selected] = null;
  if (free) actor.freeHealRound = state.battle.round;
  else actor.ap = state.battle.rulesVersion === 2 ? actor.ap - 4 : 0;
  const message = `${actor.name} uses ${item.name}.`;
  state.battle.lastEvent = makeBattleEvent(actor, null, 'use', message, getItem(actor.equipment.weapon), null, { itemId: item.id });
  battleLog(state.battle, message);
  if (!free && actor.ap <= 0) nextBattleTurn(state.battle);
  return true;
}

function finishBattleSwap(state, actor, message) {
  const free = hasPerk(actor, 'quick-hands') && actor.freeSwapRound !== state.battle.round;
  if (free) actor.freeSwapRound = state.battle.round;
  else actor.ap = state.battle.rulesVersion === 2 ? actor.ap - 4 : 0;
  state.battle.lastEvent = makeBattleEvent(actor, null, 'swap', message, getItem(actor.equipment.weapon));
  battleLog(state.battle, message);
  if (!free && actor.ap <= 0) nextBattleTurn(state.battle);
  return true;
}

function switchBattleSet(state, actor, message) {
  const active = { weapon: actor.equipment.weapon, shield: actor.equipment.shield };
  const closingWithMelee = getItem(active.weapon)?.throwing && !getItem(actor.reserveEquipment.weapon)?.ranged;
  const readyingThrowing = getItem(actor.reserveEquipment.weapon)?.throwing;
  const previousReload = actor.reload;
  const activeShieldDurability = actor.shieldDurability;
  const reserveShieldDurability = actor.reserveShieldDurability;
  changeBattleWeapon(actor, actor.reserveEquipment.weapon, actor.reserveEquipment.shield, reserveShieldDurability, state.battle);
  actor.reserveEquipment = active;
  actor.reserveShieldDurability = activeShieldDurability;
  actor.maxReserveShieldDurability = shieldMaximum(active.shield);
  [actor.throwingAmmo.active, actor.throwingAmmo.reserve] = [actor.throwingAmmo.reserve, actor.throwingAmmo.active];
  actor.battleSetSwapped = !actor.battleSetSwapped;
  if (closingWithMelee) actor.meleePhase = true;
  else if (readyingThrowing) actor.meleePhase = false;
  actor.reload = actor.reserveReload;
  actor.reserveReload = previousReload;
  return finishBattleSwap(state, actor, message);
}

function companyArcherWeapon(state, actor) {
  if(roleRules(state.battle)&&(actor.side!=='company'||actor.ally)&&actor.tacticalRole==='ranged')return [actor.equipment.weapon,actor.reserveEquipment.weapon,actor.pocketStowedWeapon].map(getItem).find(item=>item?.ranged&&!item.throwing)??null;
  const weapon = actor.side === 'company' && !actor.ally ? getItem(personById(state, actor.id)?.equipment.weapon) : null;
  return weapon?.ranged && !weapon.throwing ? weapon : null;
}

function battleWeaponHasAmmo(state, actor, weapon, set = 'active') {
  if (!weapon?.ranged) return true;
  if (weapon.throwing) return (actor.throwingAmmo?.[set] ?? 0) > 0;
  return actor.side !== 'company' || actor.ally || state.supplies.ammo > 0;
}

function chooseBattleWeapon(state, actor, enemies) {
  if (!roleRules(state.battle)&&(actor.side !== 'company' || actor.ally)) return false;
  const nearest = Math.min(...enemies.map(enemy => hexDistance(actor, enemy)));
  if (state.battle.rulesVersion === 2 && actor.ap < 4 && !(hasPerk(actor, 'quick-hands') && actor.freeSwapRound !== state.battle.round)) return false;
  const archer = companyArcherWeapon(state, actor);
  if (actor.pocketDrawnFrom !== null) {
    const readyToShoot = archer ? nearest >= 2 : nearest >= 3 && state.battle.round >= actor.pocketDrawnRound + 2;
    const stowedWeapon = getItem(actor.pocketStowedWeapon);
    if (battleWeaponHasAmmo(state, actor, stowedWeapon) && readyToShoot && stowedWeapon?.ranged) {
      const pocket = actor.equipment.weapon;
      changeBattleWeapon(actor, actor.pocketStowedWeapon, actor.equipment.shield, actor.shieldDurability, state.battle);
      actor.reload = actor.pocketStowedReload;
      actor.accessories[actor.pocketDrawnFrom] = pocket;
      actor.pocketDrawnFrom = null;
      actor.pocketStowedWeapon = null;
      actor.pocketStowedReload = 0;
      actor.pocketDrawnRound = 0;
      const message = `${actor.name} readies ${getItem(actor.equipment.weapon).name} again.`;
      return finishBattleSwap(state, actor, message);
    }
    return false;
  }
  const active = getItem(actor.equipment.weapon);
  const reserve = getItem(actor.reserveEquipment.weapon);
  const reserveHasAmmo = battleWeaponHasAmmo(state, actor, reserve, 'reserve');
  const outOfAmmo = roleRules(state.battle)?!battleWeaponHasAmmo(state,actor,active):active?.throwing ? (actor.throwingAmmo?.active ?? 0) === 0 : state.supplies.ammo === 0;
  const throwingDuty=roleRules(state.battle)&&actor.tacticalRole==='skirmisher'&&reserve?.throwing&&reserveHasAmmo&&nearest>=2;
  if (combatCommand(state.battle,actor) === 'shield-wall' && !throwingDuty && actor.equipment.shield && actor.shieldDurability > 0
    && !(active?.ranged && (outOfAmmo || nearest<=1 && reserve && !reserve.ranged))) return false;
  if (active?.ranged && outOfAmmo && reserve?.ranged && battleWeaponHasAmmo(state, actor, reserve, 'reserve')) {
    return switchBattleSet(state, actor, actor.name + ' readies ' + reserve.name + '.');
  }
  if (active?.ranged && (nearest <= 1 || outOfAmmo)) {
    if ((active.throwing || actor.tacticalRole==='skirmisher' && hasPerk(actor,'quick-hands')) && reserve && !reserve.ranged) return switchBattleSet(state, actor, `${actor.name} switches to ${reserve.name} for close fighting.`);
    if (!outOfAmmo && archerRetreatOption(state.battle, actor, effectiveWeaponRange(actor, active))) return false;
    const pocketIndex = actor.accessories.findIndex(id => getItem(id)?.pocketWeapon);
    if (pocketIndex >= 0) {
      actor.pocketStowedWeapon = actor.equipment.weapon;
      actor.pocketStowedReload = actor.reload;
      actor.pocketDrawnFrom = pocketIndex;
      actor.pocketDrawnRound = state.battle.round;
      changeBattleWeapon(actor, actor.accessories[pocketIndex], actor.equipment.shield, actor.shieldDurability, state.battle);
      actor.accessories[pocketIndex] = null;
      actor.reload = 0;
      const message = `${actor.name} draws ${getItem(actor.equipment.weapon).name} from a pocket.`;
      return finishBattleSwap(state, actor, message);
    }
    if (reserve && !reserve.ranged) return switchBattleSet(state, actor, `${actor.name} switches to ${reserve.name} for close fighting.`);
  }
  if (!active?.ranged && reserve?.throwing && (actor.throwingAmmo?.reserve ?? 0) > 0 && nearest >= (actor.meleePhase ? 4 : 3)) {
    return switchBattleSet(state, actor, actor.name + ' readies ' + reserve.name + '.');
  }
  if (!active?.ranged && reserve?.ranged && reserveHasAmmo && nearest >= (archer ? 2 : actor.meleePhase ? 4 : 3)) {
    return switchBattleSet(state, actor, `${actor.name} readies ${reserve.name} behind ${getItem(actor.reserveEquipment.shield)?.name ?? 'the line'}.`);
  }
  return false;
}

function enemiesAdjacent(battle,actor) {
  return battle.units.some(unit=>unit.alive&&unit.side!==actor.side&&hexDistance(actor,unit)===1);
}

function readyShieldWallSet(state, actor) {
  // A loaded throwing set is the skirmisher's current duty. Do not replace
  // it with the shield set that weapon selection would immediately undo.
  if(roleRules(state.battle)&&getItem(actor.equipment.weapon)?.throwing&&battleWeaponHasAmmo(state,actor,getItem(actor.equipment.weapon))&&!enemiesAdjacent(state.battle,actor))return false;
  if (state.battle.rulesVersion === 2 && actor.ap < 4 && !(hasPerk(actor, 'quick-hands') && actor.freeSwapRound !== state.battle.round)) return false;
  if (!['shield-wall','skirmish'].includes(state.battle.tactic) || actor.side !== 'company' || actor.ally || actor.equipment.shield && actor.shieldDurability > 0
    || companyArcherWeapon(state, actor) || getItem(actor.reserveEquipment.weapon)?.ranged && enemiesAdjacent(state.battle,actor) || actor.reserveShieldDurability <= 0 || getItem(actor.reserveEquipment.weapon)?.twoHanded
    || getItem(actor.reserveEquipment.weapon)?.throwing && (actor.throwingAmmo?.reserve ?? 0) <= 0) return false;
  return switchBattleSet(state, actor, `${actor.name} readies ${getItem(actor.reserveEquipment.shield).name} for the shield wall.`);
}

function sideInMeleeContact(battle, side='company') {
  const allies = battle.units.filter(unit => unit.alive && unit.side === side && !unit.ally);
  const opponents = battle.units.filter(unit => unit.alive && unit.side !== side);
  return allies.some(unit => opponents.some(enemy => hexDistance(unit, enemy) <= 1));
}

function formationStep(battle, actor, direction) {
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  return hexNeighbors(battle.field, actor)
    .filter(point => direction > 0 ? point.q === actor.q + 1 : point.q === actor.q - 1)
    .filter(point => Number.isFinite(battleMovementCost(battle, actor, actor, point)))
    .filter(point => !occupied.has(`${point.q},${point.r}`))
    .sort((a, b) => Math.abs(a.r - actor.r) - Math.abs(b.r - actor.r) || a.r - b.r)[0] ?? null;
}

function advanceFormationStep(battle, actor) {
  const plan = battle.formationAdvance;
  if (!plan || actor.side !== 'company' || actor.ally) return null;
  if (plan.completedRound >= battle.round) return null;
  const living = battle.units.filter(unit => unit.alive && unit.side === 'company' && !unit.ally);
  const reached = unit => {
    const [dq, dr] = FORMATION_DIRECTIONS[plan.direction];
    return unit.q === plan.origins[unit.id].q + dq * plan.step
      && unit.r === plan.origins[unit.id].r + dr * plan.step;
  };
  if (living.every(reached)) {
    if (plan.completedRound === 0) plan.completedRound = battle.round;
    if (sideInMeleeContact(battle) || plan.completedRound >= battle.round) return null;
    plan.origins = Object.fromEntries(battle.units.filter(unit => unit.side === 'company' && !unit.ally).map(unit => [unit.id, { q: unit.q, r: unit.r }]));
    plan.step = 1;
    plan.direction = chooseFormationDirection(battle, living);
    plan.startedRound = battle.round;
    plan.completedRound = 0;
  }
  if (reached(actor)) return null;
  const [moveQ, moveR] = FORMATION_DIRECTIONS[plan.direction];
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const destination = { q: actor.q + moveQ, r: actor.r + moveR };
  if (!Number.isFinite(movementCost(battle.field, actor, destination)) || occupied.has(`${destination.q},${destination.r}`)) return null;
  const from = { q: actor.q, r: actor.r };
  const cost = battleMovementCost(battle, actor, actor, destination);
  if (!Number.isFinite(cost) || roleRules(battle)&&!canAfford(battle,actor,battleMoveApCost(battle,actor,from,destination),movementFatigue(actor,cost))) return null;
  actor.q = destination.q;
  actor.r = destination.r;
  actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + movementFatigue(actor, cost));
  if (living.every(reached)) plan.completedRound = battle.round;
  return from;
}

function moveOneFormationHex(battle, actor, destination, message) {
  const from = { q: actor.q, r: actor.r };
  const cost = battleMovementCost(battle, actor, actor, destination);
  if (!Number.isFinite(cost)) return false;
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
  const company = battle.units.filter(unit => unit.alive && unit.side === 'company' && !unit.ally);
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
    + (hasPerk(actor, 'bullseye') ? 0 : rangedCoverModifier(battle.field, from, target))
    + (battle.weaponSkillsVersion === 1 && !hasPerk(actor, 'bullseye') ? rangedScreenModifier(battle,from,target) : 0);
}

function pathToTarget(battle, actor, target, range, keepRangedSpace = false, flank = false) {
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const flankThreats = flank ? battle.units.filter(unit=>unit.alive && unit.side!==actor.side && unit.id!==target.id) : [];
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
      if (flankThreats.some(unit=>hexDistance(next,unit)<=1)) continue;
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
    .filter(point => Number.isFinite(point.cost) && point.safety > nearest && enemies.some(unit => hexDistance(point, unit) <= range))
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
    .filter(option => Number.isFinite(option.cost) && option.quality >= current + 10)
    .sort((a, b) => b.quality - a.quality || a.cost - b.cost || a.point.q - b.point.q || a.point.r - b.point.r)[0]?.point ?? null;
}

function rangedProtectionAt(battle, actor, point, threats) {
  if (!threats.length) return 0;
  const target = {...actor,...point};
  return threats.reduce((sum, enemy) => sum + (hasPerk(enemy,'bullseye') ? 0
    : -rangedCoverModifier(battle.field,enemy,target) - rangedScreenModifier(battle,enemy,target)),0)/threats.length;
}

function rangedPositionStep(state, actor, enemies, weapon, tactic) {
  const battle = state.battle;
  const nearest = nearestEnemyDistance(battle,actor,actor);
  const spacing = nearest <= 1;
  const defensive = ['defense','shield-wall'].includes(tactic);
  if (!spacing && (!defensive || actor.fatigue+attackFatigueCost(actor,weapon,battle)>tacticalFatigueLimit(battle,actor))) return null;
  const shooters = enemies.filter(enemy=>getItem(enemy.equipment.weapon)?.ranged
    && battleWeaponHasAmmo(state,enemy,getItem(enemy.equipment.weapon)));
  // With no shooters, shelter still faces the enemy approach and keeps the rear behind shields.
  const threats = shooters.length ? shooters : enemies;
  const shootRange = effectiveWeaponRange(actor,weapon) + (isBow(weapon) ? 1 : 0);
  // Once pursuit begins, finish closing into firing range before returning to
  // shelter. Otherwise cover and pursuit undo each other on alternate turns.
  const pursuing=enemies.find(enemy=>enemy.id===actor.aiTargetId);
  if(!spacing&&pursuing&&hexDistance(actor,pursuing)>shootRange)return null;
  const canShootHere = enemies.some(enemy=>hexDistance(actor,enemy)<=shootRange);
  const reserveAp = actor.reload > 0 ? 4 : attackApCost(weapon,battle,actor);
  const budget = Math.min(6, spacing && actor.ap<reserveAp+2 ? actor.ap : Math.max(0,actor.ap-reserveAp));
  const baseline = rangedProtectionAt(battle,actor,actor,threats);
  const occupied = new Set(battle.units.filter(u=>u.alive && u.id!==actor.id).map(u=>`${u.q},${u.r}`));
  const queue = [{q:actor.q,r:actor.r,path:[],cost:0,fatigue:0}];
  const best = new Map([[`${actor.q},${actor.r}`,0]]);
  const options = [];
  while (queue.length) {
    queue.sort((a,b)=>a.cost-b.cost || a.q-b.q || a.r-b.r);
    const point = queue.shift();
    if (point.cost>best.get(`${point.q},${point.r}`)) continue;
    const distance = nearestEnemyDistance(battle,actor,point);
    const protection = rangedProtectionAt(battle,actor,point,threats);
    const withinRange = enemies.some(enemy=>hexDistance(point,enemy)<=shootRange);
    if (point.path.length && distance >= 2 && (!canShootHere || withinRange)
      && (!roleRules(battle)||spacing||!canShootHere||canFireAfterMove(state,actor,weapon,point,point.cost,point.fatigue))
      && (spacing ? distance>nearest : protection>=baseline+6)) {
      // Distance wins when threatened. Cover gains must outweigh the extra travel.
      const quality = (spacing ? Math.min(2,distance)*40 : 0) + (protection-baseline)*2 - point.cost*2;
      options.push({...point,quality});
    }
    if (point.path.length >= 3) continue;
    for (const next of openNeighbors(battle,point,occupied)) {
      if (nearestEnemyDistance(battle,actor,next)<=1) continue;
      const mover = point.path.length ? {...actor,movementCredit:0} : actor;
      const step = battleMoveApCost(battle,mover,point,next);
      const cost = point.cost+step;
      const fatigue = point.fatigue+movementFatigue(actor,battleMovementCost(battle,actor,point,next));
      const key = `${next.q},${next.r}`;
      if (cost<=budget && fatigue+(spacing?0:attackFatigueCost(actor,weapon,battle))<=tacticalFatigueLimit(battle,actor)-actor.fatigue && cost<(best.get(key)??Infinity)) {
        best.set(key,cost);queue.push({...next,path:[...point.path,next],cost,fatigue});
      }
    }
  }
  const choice = options.sort((a,b)=>b.quality-a.quality || a.cost-b.cost || a.q-b.q || a.r-b.r)[0];
  return choice ? {point:choice.path[0],spacing} : null;
}

function moveToRangedPosition(state, actor, position, tactic) {
  const battle = state.battle, from = {q:actor.q,r:actor.r}, point = position.point;
  if(roleRules(battle)&&!canAfford(battle,actor,battleMoveApCost(battle,actor,from,point),movementFatigue(actor,battleMovementCost(battle,actor,from,point))))return null;
  actor.ap -= battleMoveApCost(battle,actor,from,point);
  actor.fatigue += movementFatigue(actor,battleMovementCost(battle,actor,from,point));
  Object.assign(actor,point);clearWeaponStances(actor);consumeMovementCredit(battle,actor,from,point);
  const interception = spearwallReactionsOnMove(state,actor,from);
  if (!interception.blocked && actor.side==='company' && !actor.ally && tactic==='shield-wall') battle.formationAdvance=makeFormationAdvancePlan(battle);
  const message = interception.blocked ? `${actor.name} is stopped by Spearwall.`
    : position.message ?? (position.spacing ? `${actor.name} keeps distance from the enemy.` : `${actor.name} moves into cover.`);
  battle.lastEvent=makeBattleEvent(actor,null,interception.blocked?'hold':'move',message,getItem(actor.equipment.weapon),from,
    interception.reactions.length?{reactions:interception.reactions}:{});
  battleLog(battle,message);
  if (!finishBattlePhase(battle) && (actor.ap<=0 || !actor.alive)) nextBattleTurn(battle);
  return result(true,message);
}

// Skirmish keeps the infantry line steady while ranged fighters make short firing sorties.
function skirmishFireSupport(state, side='company') {
  return state.battle.units.some(unit=>unit.alive && !unit.escaped && unit.side===side && !unit.ally
    && [[getItem(unit.equipment.weapon),'active'],[getItem(unit.reserveEquipment.weapon),'reserve'],[getItem(unit.pocketStowedWeapon),'active']]
      .some(([weapon,set])=>weapon?.ranged && !weapon.throwing && battleWeaponHasAmmo(state,unit,weapon,set)));
}

function skirmishLineDuty(state, actor) {
  return !(actor.side==='enemy' ? isPureRangedUnit(actor) : companyArcherWeapon(state,actor)) && (actor.tacticalRole==='frontliner' || hasShieldSet(actor));
}

function skirmishMove(state, actor, point, message) {
  return moveToRangedPosition(state,actor,{point,message:`${actor.name} ${message}`},'skirmish');
}

function skirmishReturnPath(battle, actor) {
  const home=actor.skirmishReturn;
  if (!home) return null;
  const occupied=new Set(battle.units.filter(u=>u.alive && u.id!==actor.id).map(u=>`${u.q},${u.r}`));
  const goals=[home,...hexNeighbors(battle.field,home)].filter(p=>passableHex(p,battle.field)
    && !occupied.has(`${p.q},${p.r}`) && nearestEnemyDistance(battle,actor,p)>=Math.max(2,nearestEnemyDistance(battle,actor,home)));
  return goals.map(point=>({point,path:pathToTarget(battle,actor,{...actor,...point},0,true)}))
    .filter(entry=>entry.path!==null).sort((a,b)=>hexDistance(a.point,home)-hexDistance(b.point,home)
      || pathCost(battle,actor,actor,a.path)-pathCost(battle,actor,actor,b.path)
      || a.point.q-b.point.q || a.point.r-b.point.r)[0]?.path ?? null;
}

function returnSkirmisher(state, actor) {
  const battle=state.battle,plan=actor.skirmishReturn;
  if ((actor.side==='enemy' ? enemyBattleTactic(battle,getItem) : battle.tactic)!=='skirmish' || actor.ally || !plan) return null;
  const weapon=getItem(actor.equipment.weapon);
  if (plan.phase==='aim' && (roleRules(battle)&&actor.disarmedTurns || !battleWeaponHasAmmo(state,actor,weapon) || actor.reload>0
    || actor.fatigue+attackFatigueCost(actor,weapon,battle)>tacticalFatigueLimit(battle,actor))) plan.phase='return';
  if (plan.phase!=='return') return null;
  const path=skirmishReturnPath(battle,actor);
  if (!path?.length) {delete actor.skirmishReturn;return null;}
  const point=path[0],cost=battleMoveApCost(battle,actor,actor,point);
  const fatigue=movementFatigue(actor,battleMovementCost(battle,actor,actor,point));
  if (actor.ap<cost || actor.fatigue+fatigue>tacticalFatigueLimit(battle,actor)) {
    actor.ap=0;actor.fatigue=Math.max(0,actor.fatigue-12);
    const message=`${actor.name} waits to fall back to shelter.`;
    battle.lastEvent=makeBattleEvent(actor,null,'hold',message,weapon);battleLog(battle,message);nextBattleTurn(battle);
    return result(true,message);
  }
  const moved=skirmishMove(state,actor,point,'falls back behind the skirmish line.');
  if (path.length===1 && actor.q===point.q && actor.r===point.r) {
    delete actor.skirmishReturn;actor.formationMovedRound=battle.round;
  }
  return moved;
}

function skirmishPosition(state, actor, enemies, weapon, ammunitionSpent) {
  const battle=state.battle;
  if (actor.ally || (actor.side==='enemy' ? enemyBattleTactic(battle,getItem) : battle.tactic)!=='skirmish' || ammunitionSpent || !skirmishFireSupport(state,actor.side)) return null;
  const nearest=nearestEnemyDistance(battle,actor,actor);
  const occupied=new Set(battle.units.filter(u=>u.alive && u.id!==actor.id).map(u=>`${u.q},${u.r}`));
  if (skirmishLineDuty(state,actor)) {
    if (actor.formationMovedRound===battle.round || nearest<=2 || sideInMeleeContact(battle,actor.side)) return null;
    const shooters=enemies.filter(u=>getItem(u.equipment.weapon)?.ranged);
    const safe=point=>shooters.every(u=>hexDistance(point,u)>effectiveWeaponRange(u,getItem(u.equipment.weapon))+(isBow(getItem(u.equipment.weapon))?1:0));
    const direction=nearest>6?1:nearest<5 || !safe(actor)?-1:0;
    const options=openNeighbors(battle,actor,occupied).map(point=>({point,distance:nearestEnemyDistance(battle,actor,point),
      cost:battleMoveApCost(battle,actor,actor,point),fatigue:movementFatigue(actor,battleMovementCost(battle,actor,actor,point))}))
      .filter(o=>o.cost<=actor.ap && o.fatigue<=tacticalFatigueLimit(battle,actor)-actor.fatigue && o.distance>=Math.min(5,nearest+1)
        && (direction>0?o.distance<nearest && safe(o.point):direction<0?o.distance>nearest:false))
      .sort((a,b)=>Math.abs(a.distance-6)-Math.abs(b.distance-6) || a.cost-b.cost || a.point.q-b.point.q || a.point.r-b.point.r);
    if (!options.length && direction>0) {
      // Step around a friendly blocker without pushing past the holding distance.
      for (const target of [...enemies].sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b))) {
        const path=pathToTarget(battle,actor,target,6,true);
        if (!path?.length || !path.every(p=>safe(p) && nearestEnemyDistance(battle,actor,p)>=5)) continue;
        const point=path[0],cost=battleMoveApCost(battle,actor,actor,point);
        const fatigue=movementFatigue(actor,battleMovementCost(battle,actor,actor,point));
        if (cost<=actor.ap && fatigue<=tacticalFatigueLimit(battle,actor)-actor.fatigue) {options.push({point});break;}
      }
    }
    if (!options.length) return null;
    actor.formationMovedRound=battle.round;
    return skirmishMove(state,actor,options[0].point,'steadies the skirmish line.');
  }
  if (!weapon.ranged || actor.reload>0 || nearest<=1 || roleRules(battle)&&actor.disarmedTurns) return null;
  const range=effectiveWeaponRange(actor,weapon),aimRange=range+(isBow(weapon)?1:0);
  // Fire from shelter, including a stationary Aimed Shot, before stepping into the open.
  if (enemies.some(target=>hexDistance(actor,target)<=aimRange)) {
    const shooters=enemies.filter(u=>getItem(u.equipment.weapon)?.ranged);
    if (!actor.skirmishReturn && shooters.some(u=>hexDistance(actor,u)<=effectiveWeaponRange(u,getItem(u.equipment.weapon))+(isBow(getItem(u.equipment.weapon))?1:0))
      && rangedProtectionAt(battle,actor,actor,shooters)===0) {
      const cover=rangedPositionStep(state,actor,enemies,weapon,'shield-wall');
      if (cover) return moveToRangedPosition(state,actor,cover,'skirmish');
    }
    return null;
  }
  if (!actor.skirmishReturn && actor.formationMovedRound===battle.round) return null;
  const queue=[{q:actor.q,r:actor.r,path:[],cost:0,fatigue:0}],best=new Map([[`${actor.q},${actor.r}`,0]]),shots=[],stages=[];
  while (queue.length) {
    queue.sort((a,b)=>a.cost-b.cost || a.q-b.q || a.r-b.r);
    const point=queue.shift();if (point.cost>best.get(`${point.q},${point.r}`)) continue;
    if (point.path.length) {
      const returning=[...point.path.slice(0,-1).reverse(),{q:actor.q,r:actor.r}];
      let returnCost=0,returnFatigue=0,previous=point;
      for (const next of returning) {returnCost+=battleMoveApCost(battle,{...actor,movementCredit:0},previous,next);
        returnFatigue+=movementFatigue(actor,battleMovementCost(battle,actor,previous,next));previous=next;}
      for (const target of enemies) {
        const distance=hexDistance(point,target),aimed=distance>range && isBow(weapon) && distance<=range+1;
        const option=aimed?COMBAT_SKILLS['aimed-shot']:null,ap=attackApCost(weapon,battle,actor,option),fatigue=aimed?aimedFatigueCost(actor):attackFatigueCost(actor,weapon,battle);
        if (distance<=aimRange && point.cost+ap<=actor.ap && point.fatigue+fatigue<=tacticalFatigueLimit(battle,actor)-actor.fatigue) {
          const roundTrip=point.cost+ap+returnCost<=actor.ap && point.fatigue+fatigue+returnFatigue<=tacticalFatigueLimit(battle,actor)-actor.fatigue;
          const predicted=predictAttack(battle,{...actor,...point},target,weapon,option);
          shots.push({...point,quality:(roundTrip?100:0)+predicted.expectedHealthDamage+predicted.killProbability*35-point.cost*2});
        }
      }
      stages.push({...point,distance:Math.min(...enemies.map(u=>hexDistance(point,u)))});
    }
    if (point.path.length>=3) continue;
    for (const next of openNeighbors(battle,point,occupied)) {
      if (nearestEnemyDistance(battle,actor,next)<2) continue;
      const mover=point.path.length?{...actor,movementCredit:0}:actor,cost=point.cost+battleMoveApCost(battle,mover,point,next);
      const fatigue=point.fatigue+movementFatigue(actor,battleMovementCost(battle,actor,point,next)),key=`${next.q},${next.r}`;
      if (cost<=actor.ap && fatigue<=tacticalFatigueLimit(battle,actor)-actor.fatigue && cost<(best.get(key)??Infinity)) {
        best.set(key,cost);queue.push({...next,path:[...point.path,next],cost,fatigue});
      }
    }
  }
  const shot=shots.sort((a,b)=>b.quality-a.quality || a.cost-b.cost || a.q-b.q || a.r-b.r)[0];
  const stage=stages.filter(o=>o.distance<nearest && o.distance>=aimRange)
    .sort((a,b)=>a.distance-b.distance || a.cost-b.cost || a.q-b.q || a.r-b.r)[0];
  const choice=shot ?? stage;if (!choice) return null;
  // A staging move is an advance, not a sortie: there is no shot to return
  // from yet. Only record shelter when the remaining route includes a shot.
  if(shot)actor.skirmishReturn ??= {q:actor.q,r:actor.r,phase:'aim'};
  actor.formationMovedRound=battle.round;
  return skirmishMove(state,actor,choice.path[0],'steps up for a skirmish shot.');
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
const WEAPON_MASTERY_IDS = ['sword-training', 'axe-training', 'mace-training', 'spear-training', 'polearm-training', 'dagger-training', 'throwing-training'];

function weaponMasteryMatches(perkId, weapon) {
  const visual = weaponTrainingVisual(weapon);
  switch (perkId) {
    case 'sword-training': return SWORD_VISUALS.has(visual);
    case 'axe-training': return AXE_VISUALS.has(visual);
    case 'mace-training': return MACE_VISUALS.has(visual);
    case 'spear-training': return !weapon?.throwing && /spear|pike/.test(visual ?? '');
    case 'polearm-training': return !weapon?.ranged && (weapon?.range ?? 1) >= 2;
    case 'dagger-training': return DAGGER_VISUALS.has(visual);
    case 'throwing-training': return weapon?.throwing === true;
    default: return false;
  }
}

function hasWeaponMastery(actor, weapon) {
  return isBow(weapon) && hasPerk(actor, 'bow-mastery')
    || isCrossbow(weapon) && hasPerk(actor, 'crossbow-mastery')
    || WEAPON_MASTERY_IDS.some(id => hasPerk(actor, id) && weaponMasteryMatches(id, weapon));
}

function attackFatigueCost(actor, weapon, battle=null) {
  const base = Math.max(0,((battle?.weaponCompletionVersion===1?equipmentSkills(weapon)[0]?.fatigue:undefined) ?? weapon?.fatigueCost ?? (weapon?.ranged ? 9 : 11))+(weapon?.fatigueOnSkillUse??0));
  return hasWeaponMastery(actor, weapon) ? Math.ceil(base * .75) : base;
}

function attackApCost(weapon, battle = null, actor = null, option = null) {
  if (option?.id === 'charge') return option.ap;
  const base = option?.ap ?? (battle?.weaponCompletionVersion===1&&battle.weaponSkillsVersion===1?equipmentSkills(weapon)[0]?.ap:undefined) ?? (isCrossbow(weapon) ? 3 : weapon?.ranged ? 4
    : battle?.weaponSkillsVersion === 1 && ['dagger', 'qatal'].includes(weaponSkillFamily(weapon)) ? 3
    : weapon?.twoHanded || (weapon?.range ?? 1) > 1 && !weapon?.ranged ? 6 : 4);
  return battle?.weaponSkillsVersion === 1 && actor && hasWeaponMastery(actor, weapon) ? Math.max(1, base - 1) : base;
}

function weaponTrainingHit(actor, weapon) {
  if (hasPerk(actor, 'sword-training') && weaponMasteryMatches('sword-training', weapon)) return 8;
  if (hasPerk(actor, 'spear-training') && weaponMasteryMatches('spear-training', weapon)) return 8;
  if (hasPerk(actor, 'throwing-training') && weaponMasteryMatches('throwing-training', weapon)) return 8;
  return 0;
}

function effectiveWeaponRange(actor, weapon) {
  return (weapon?.range ?? 1) + (isBow(weapon) && hasPerk(actor, 'bow-mastery') ? 1 : 0);
}

export function isMoraleImmune(unit) {
  return unit.undeadTraitsVersion === 1 || isAncientHelmet(getItem(unit.equipment?.helmet));
}

export function getMoraleEffects(unit) {
  const morale = isMoraleImmune(unit) ? 60 : unit.morale ?? 50;
  if (morale >= 80) return { name: 'Confident', modifier: .1 };
  if (morale >= 50) return { name: 'Steady', modifier: 0 };
  if (morale >= 25) return { name: 'Wavering', modifier: -.1 };
  return { name: 'Breaking', modifier: -.2 };
}

function moraleDamage(unit, amount) {
  const resistance = clamped(1 - (unit.resolve - 40) * .005, .6, 1.2);
  return Math.max(1, Math.round(amount * resistance * (hasPerk(unit, 'fortified-mind') ? .8 : 1)));
}

export function shieldImpactDamage(weapon) {
  if(weapon?.shieldDamage!==undefined)return weapon.shieldDamage;
  const visual = weaponTrainingVisual(weapon) ?? '';
  if (weapon?.throwing) return visual.includes('axe') ? (visual.includes('heavy') ? 24 : 18) : (visual.includes('heavy') ? 18 : 12);
  return !weapon?.ranged && AXE_VISUALS.has(visual) ? 12 : 0;
}

function wearShield(battle, unit, amount) {
  if (!unit.equipment.shield || unit.shieldDurability <= 0 || amount <= 0) return 0;
  const previous = unit.shieldDurability;
  const wear = hasPerk(unit, 'shield-expert') ? Math.max(1, Math.ceil(amount * .5)) : amount;
  unit.shieldDurability = Math.max(0, unit.shieldDurability - wear);
  if (unit.shieldDurability === 0) {
    unit.shieldWallActive = false;
    const defense = shieldDefenseFor(unit, unit.equipment.shield, 1);
    unit.meleeDefense -= defense;
    unit.rangedDefense -= shieldDefenseFor(unit, unit.equipment.shield, 1, true);
    battleLog(battle, `${unit.name}'s ${getItem(unit.equipment.shield).name} breaks.`);
  }
  return previous - unit.shieldDurability;
}

function changeBattleMorale(battle, unit, amount) {
  if (isMoraleImmune(unit)) return;
  const previous = getMoraleEffects(unit).name;
  unit.morale = clamped(unit.morale + amount, 0, 100);
  const current = getMoraleEffects(unit).name;
  if (previous !== current && unit.hp > 0) battleLog(battle, `${unit.name} is now ${current.toLowerCase()}.`);
}

function shieldSkillFatigue(actor){return Math.max(0,20+(getItem(actor.equipment.shield)?.fatigueOnSkillUse??0));}

function aimedFatigueCost(actor) {
  const base=Math.max(0,15+(getItem(actor.equipment.weapon)?.fatigueOnSkillUse??0));return hasPerk(actor, 'bow-mastery') ? Math.ceil(base * .75) : base;
}

export function attackHitChance(battle, actor, target, weapon, hitBonus = 0, option = null) {
  const ranged = weapon.ranged === true;
  const skill = ranged ? actor.rangedSkill : actor.meleeSkill;
  const dodgeDefense = hasPerk(target, 'dodge')
    ? Math.floor(Math.max(0, combatInitiative(target) - target.fatigue * (hasPerk(target, 'relentless') ? .1 : .2)) * .15) : 0;
  const reachDefense = hasPerk(target, 'reach-advantage') && getItem(target.equipment.weapon)?.twoHanded
    && !getItem(target.equipment.weapon)?.ranged ? 5 : 0;
  const anticipationDefense = ranged && hasPerk(target, 'anticipation')
    ? Math.max(10, Math.floor(target.rangedDefense * .1 * hexDistance(actor, target))) : 0;
  const shieldBypass = (option?.shieldBypass || ['flail-headshot', 'whip-crack'].includes(option?.id)) ? shieldDefenseFor(target, target.equipment.shield) : 0;
  const defense = Math.round(((ranged ? target.rangedDefense : target.meleeDefense) - shieldBypass) * (1 + getMoraleEffects(target).modifier)) + dodgeDefense + anticipationDefense
    + (!shieldBypass && target.shieldWallActive && target.shieldDurability > 0 ? shieldDefenseFor(target, target.equipment.shield,target.shieldDurability,ranged) : 0)
    + (!ranged ? reachDefense : 0)
    + (hasPerk(target, 'last-stand') && target.hp * 2 <= target.maxHp ? 8 : 0)
    + ((target.side === 'company' && battle.tactic === 'defense' || target.side === 'enemy' && enemyBattleTactic(battle,getItem) === 'defense') ? 5 : 0);
  const terrainHit = ranged ? rangedTerrainModifier(battle, actor, actor, target) : heightHitModifier(battle.field, actor, target);
  const adjacentAllies = !ranged && hasPerk(actor, 'backstabber')
    ? battle.units.filter(unit => unit.alive && unit.side === actor.side && unit.id !== actor.id && hexDistance(unit, target) <= 1).length : 0;
  const distance = hexDistance(actor, target);
  const higher = tileAt(battle.field, actor.q, actor.r).height > tileAt(battle.field, target.q, target.r).height;
  const perkHit = weaponTrainingHit(actor, weapon) + (hasPerk(actor, 'high-ground') && higher ? 8 : 0)
    + (ranged && distance >= 3 && hasPerk(actor, 'marksman') ? 8 : 0);
  const adjacentShotPenalty = ranged && distance === 1 && !hasPerk(actor, 'point-blank') ? 12 : 0;
  const baseChance = clamped(Math.round(skill * (1 + getMoraleEffects(actor).modifier)) + (weapon.hitBonus ?? 0) + (weapon.skillHitBonus ?? 0) - defense + 15 + terrainHit
    + adjacentAllies * 5 + (hasPerk(actor, 'fast-adaptation') ? actor.adaptation * 10 : 0) + perkHit + hitBonus
    - Math.floor(actor.fatigue / 7) - adjacentShotPenalty - (battle.weaponCompletionVersion===1&&!ranged&&weapon.range>=2&&distance===1&&!hasPerk(actor,'polearm-training')?15:0), 12, 90);
  return clamped(baseChance - getNightHitPenalty(battle,ranged), 12, 90);
}

function attackSkillFatigue(actor, weapon, option) {
  if (!option?.fatigue) return attackFatigueCost(actor, weapon);
  if (option.id === 'aimed-shot') return aimedFatigueCost(actor);
  const base=Math.max(0,option.fatigue+(weapon?.fatigueOnSkillUse??0));
  return hasWeaponMastery(actor,weapon)?Math.ceil(base*.75):base;
}

function attackDamageRoll(battle, actor, target, weapon, base, head, option = null) {
  const ranged = weapon.ranged === true;
  const distance = hexDistance(actor, target);
  if(battle.weaponAuditVersion===1&&option?.id==='split-shield')return {hp:0,armorDamage:0,before:0};
  if(option?.noDamage)return {hp:0,armorDamage:0,before:0};
  if(option?.dot)return {hp:option.fixedHealth,armorDamage:0,before:0};
  const bonus = option?.id === 'deathblow' && (target.stunnedTurns > 0 || battle.weaponCompletionVersion===1&&target.dazedTurns>0) ? 1.5
    : option?.id === 'decapitate' && target.hp < target.maxHp ? 1.4
      : option?.id === 'power-throw' ? 1.25 : ['knock-out', 'stunning-stone'].includes(option?.id) ? .5 : option?.damageMultiplier ?? 1;
  const damageMultiplier = (hasPerk(actor, 'executioner') && target.hp < target.maxHp ? 1.2 : 1)
    * (hasPerk(actor, 'killing-frenzy') && actor.frenzyUntilRound >= battle.round ? 1.25 : 1)
    * (hasPerk(actor, 'polearm-training') && weaponMasteryMatches('polearm-training', weapon) ? 1.1 : 1)
    * (hasPerk(actor, 'shield-strike') && !ranged && actor.equipment.shield && actor.shieldDurability > 0 ? 1.1 : 1)
    * (hasPerk(actor, 'duelist') && !ranged && weapon.slot === 'weapon' && !weapon.twoHanded && (!actor.equipment.shield || actor.shieldDurability === 0) ? 1.12 : 1)
    * (hasPerk(actor, 'opportunist') && !ranged
      && (option?.areaAction && option.shieldWasUsable !== undefined ? !option.shieldWasUsable
        : !target.equipment.shield || target.shieldDurability === 0) ? 1.1 : 1)
    * (hasPerk(actor, 'volley-fire') && ranged && distance >= 3 ? 1.1 : 1) * bonus;
  const mount = getItem(actor.equipment.mount);
  const mountDamage = mount ? battle.mountBalanceVersion === 1 ? mount.damageBonus : mount.visual === 'armoredhorse' ? .2 : .15 : 0;
  const chargeBonus = battle.mountBalanceVersion === 1 && option?.id === 'charge' ? mount?.chargeDamageBonus ?? 0 : 0;
  const raw = Math.round(base * damageMultiplier * (1 + mountDamage) * (1 + chargeBonus)
    * (actor.howlTurns > 0 ? .8 : 1) * (actor.dazedTurns>0?.75:1)
    * (1 + Math.max(0, heightHitModifier(battle.field, actor, target) / 10) * .1));
  const before = head ? target.headArmor : target.attachmentArmor + (target.attachment2Armor??0) + target.bodyArmor;
  let armorDamage = option?.noArmor || option?.id === 'puncture' ? 0 : Math.max(1, Math.round(raw * (weapon.armorDamage ?? 1)
    * (head ? 1.1 : 1) * (option?.armorMultiplier??(option?.id === 'crush-armor' ? 1.5 : 1))
    * (hasPerk(actor, 'axe-training') && weaponMasteryMatches('axe-training', weapon) ? 1.15 : 1)
    * (hasPerk(target, 'battle-forged') && before > 0 ? .85 : 1)));
  const piercing = Math.min(1, (weapon.armorPiercing ?? .30)
    + (isCrossbow(weapon) && hasPerk(actor, 'crossbow-mastery') ? .2 : 0)
    + (hasPerk(actor, 'dagger-training') && weaponMasteryMatches('dagger-training', weapon) ? .15 : 0)
    + (option?.id === 'piercing-bolt' ? .2 : 0));
  let hp = option?.id === 'puncture' ? raw : before > 0
    ? Math.max(1, Math.floor(raw * piercing - before * .025) + Math.max(0, Math.floor((armorDamage - before) * .25))) : raw;
  if (head && !hasPerk(target, 'steel-brow')) hp = Math.round(hp * 1.25);
  if (hasPerk(actor, 'mace-training') && weaponMasteryMatches('mace-training', weapon)) hp = Math.round(hp * 1.1);
  if (hasPerk(target, 'iron-jaw')) hp = Math.max(1, Math.round(hp * .8));
  // Fur reduces final received missile damage at either hit location.
  if(ranged){const multiplier=1-attachmentEffect(target.equipment,'rangedDamageReduction');hp=Math.max(1,Math.round(hp*multiplier));armorDamage=armorDamage?Math.max(1,Math.round(armorDamage*multiplier)):0;}
  // Trample health damage bypasses armor, head multipliers and damage-reduction perks.
  hp += battle.mountBalanceVersion === 1 && option?.id === 'charge' ? mount?.chargeDirectDamage ?? 0 : 0;
  if(option?.minimumHealth)hp=Math.max(hp,option.minimumHealth);
  if(option?.fixedHealth!==undefined)hp=option.fixedHealth;
  return { hp, armorDamage, before };
}

function predictAttack(battle, actor, target, weapon, option = null) {
  const ranged = weapon.ranged === true;
  const hitChance = battle.weaponAuditVersion===1&&option?.id==='split-shield'?1:attackHitChance(battle, actor, target, weapon, typeof option === 'number' ? option : option?.hitBonus ?? 0,
    typeof option === 'number' ? null : option) / 100;
  let health = 0, armor = 0, kill = 0;
  const rolls = Math.max(1, weapon.damageMax - weapon.damageMin + 1);
  for (let base = weapon.damageMin; base <= weapon.damageMax; base++) for (const [head, weight] of (option?.id === 'puncture' ? [[false, 1]] : option?.head===true || ['flail-headshot', 'whip-crack'].includes(option?.id) ? [[true, 1]] : [[true, weapon.headChance??.22], [false, 1-(weapon.headChance??.22)]])) {
    const { hp, armorDamage, before } = attackDamageRoll(battle, actor, target, weapon, base, head, option);
    const probability = weight / rolls;
    health += hp * probability;
    armor += Math.min(before, armorDamage) * probability;
    if (hp >= target.hp) kill += probability;
  }
  const hits=option?.hits??1;
  return { expectedHealthDamage: health * hitChance * hits, expectedArmorDamage: armor * hitChance * hits,
    expectedShieldDamage: target.shieldDurability > 0 ? (option?.id === 'split-shield' ? shieldImpactDamage(weapon) + 16 : shieldImpactDamage(weapon) || (ranged ? 1 - hitChance : 2 - hitChance)) : 0,
    killProbability: hits>1?0:kill * hitChance };
}

function attackTarget(state, actor, target, weapon, option = null) {
  const battle = state.battle;
  if(battle.weaponCompletionVersion===1&&battle.weaponSkillsVersion===1&&!option?.id)option={...equipmentSkills(weapon)[0],...option};
  if(!option?.strikeFollowup&&(option?.hits>1||option?.oppositeHit))return attackMultiple(state,actor,target,weapon,option);
  const ranged = weapon.ranged === true;
  if (battle.enemyAdaptiveRulesVersion===1 && ranged && actor.side==='company' && target.side==='enemy')
    battle.enemyTacticalState.lastRangedAttackRound=battle.round;
  if (!option?.reaction && !option?.areaFollowup) {
    if (weapon.throwing) actor.throwingAmmo.active = Math.max(0, actor.throwingAmmo.active - 1);
    else if (ranged && actor.side === 'company' && !actor.ally) state.supplies.ammo = Math.max(0, state.supplies.ammo - 1);
  }
  const chance = battle.weaponAuditVersion===1&&option?.id==='split-shield'?100:option?.chanceOverride ?? attackHitChance(battle, actor, target, weapon, option?.hitBonus ?? 0, option);
  if (!option?.areaFollowup) {
    actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + (option?.freeFollowup ? 0 : option?.reaction ? 5 : attackSkillFatigue(actor, weapon, option)));
    if (weapon.reloadTurns&&!option?.dot) actor.reload = weapon.reloadTurns;
    if (!option?.reaction) actor.ap = battle.rulesVersion === 2 ? Math.max(0, actor.ap - attackApCost(weapon, battle, actor, option)) : 0;
  }
  if (actor.side === 'company' || !ranged && hexDistance(actor, target) <= 1) battle.lastContactRound = battle.round;
  if (!ranged && hexDistance(actor, target) <= 1) battle.engaged = true;
  if (battleRoll(battle) * 100 >= chance) {
    const shieldDamage = option?.noDamage||option?.dot?0:wearShield(battle, target, option?.id === 'split-shield' ? shieldImpactDamage(weapon) + 16 : shieldImpactDamage(weapon) || (ranged ? 1 : 2));
    if (hasPerk(actor, 'fast-adaptation')) actor.adaptation += 1;
    const message = `${actor.name}${option?.freeFollowup ? "'s mount misses with Wolf Bite against" : ' misses'} ${target.name}.${shieldDamage ? ` ${target.name}'s shield takes ${shieldDamage} damage.` : ''}`;
    battle.lastEvent = makeBattleEvent(actor, target, 'miss', message, weapon, null, { shieldDamage, ...(option?.name ? { skillName: option.name } : {}) });
    battleLog(battle, message);
    if (battle.weaponSkillsVersion === 1 && !option?.reaction && !option?.areaAction && !ranged
      && target.alive && target.riposteActive && !target.disarmedTurns && target.stunnedTurns === 0
      && target.fatigue + 5 <= tacticalFatigueLimit(battle,target) && hexDistance(actor, target) === 1) {
      const attackEvent = battle.lastEvent;
      const counterWeapon = getItem(target.equipment.weapon);
      const counter = attackTarget(state, target, actor, counterWeapon, { name: 'Riposte', reaction: true });
      const reactionEvent = battle.lastEvent;
      battle.lastEvent = { ...attackEvent, reactions: [{ actorId: target.id, targetId: actor.id, type: reactionEvent.type,
        from: { q: target.q, r: target.r }, to: { q: actor.q, r: actor.r }, hpDamage: counter.hpDamage,
        armorDamage: counter.armorDamage, shieldDamage: counter.shieldDamage, head: counter.head,
        fallen: counter.fallen, weaponId: counterWeapon?.id ?? null, effects: reactionEvent.effects ?? [], skillName: 'Riposte' }] };
    }
    return { hit: false, hpDamage: 0, armorDamage: 0, shieldDamage, head: false, fallen: false };
  }
  actor.adaptation = 0;
  const shieldDamage = option?.noDamage||option?.dot?0:wearShield(battle, target, option?.id === 'split-shield' ? shieldImpactDamage(weapon) + 16 : shieldImpactDamage(weapon) || (ranged ? 0 : 1));
  if(battle.weaponAuditVersion===1&&option?.id==='split-shield'){
    const message=`${actor.name} strikes ${target.name}'s shield for ${shieldDamage} durability.`;
    battle.lastEvent=makeBattleEvent(actor,target,'attack',message,weapon,null,{head:false,hpDamage:0,armorDamage:0,shieldDamage,fallen:false,skillName:option.name});battleLog(battle,message);
    return {hit:true,hpDamage:0,armorDamage:0,shieldDamage,head:false,fallen:false};
  }
  const baseDamage = weapon.damageMin + Math.floor(battleRoll(battle) * (weapon.damageMax - weapon.damageMin + 1));
  const head = option?.head!==undefined?option.head:option?.id === 'puncture' ? false : ['flail-headshot', 'whip-crack'].includes(option?.id) ? true : battleRoll(battle) < (weapon.headChance??.22);
  const { hp: hpDamage, armorDamage, before: armorBefore } = attackDamageRoll(battle, actor, target, weapon, baseDamage, head, option);
  if (head) target.headArmor = Math.max(0, target.headArmor - armorDamage);
  else {
    const outerDamage=Math.min(target.attachment2Armor??0,armorDamage);
    if(target.attachment2Armor!==undefined)target.attachment2Armor-=outerDamage;
    const attachmentDamage = Math.min(target.attachmentArmor, armorDamage-outerDamage);
    target.attachmentArmor -= attachmentDamage;
    target.bodyArmor = Math.max(0, target.bodyArmor - (armorDamage - attachmentDamage - outerDamage));
  }
  target.hp = Math.max(0, target.hp - hpDamage);
  if ((['knock-out', 'stunning-stone'].includes(option?.id) || option?.stunChance && battleRoll(battle)<option.stunChance) && target.hp > 0 && !target.stunProtected) {
    target.stunnedTurns = 1;
    target.stunProtected = true;
    if(battle.weaponCompletionVersion===1)clearWeaponStances(target);
  }
  if(battle.weaponCompletionVersion===1&&target.hp>0){
    if(option?.daze&&(!option.woundThreshold||hpDamage>=Math.ceil(target.maxHp*option.woundThreshold))&&target.undeadTraitsVersion!==1)target.dazedTurns=option.daze;
    if(option?.stagger)target.staggeredTurns=option.stagger;
    if(option?.disarm){target.disarmedTurns=option.disarm;target.spearwallActive=false;target.riposteActive=false;}
    if(option?.daze||option?.stagger){const remaining=new Set(battle.turnOrder.slice(battle.turnIndex+1));battle.turnOrder.splice(battle.turnIndex+1,remaining.size,...sortTurnOrder(battle).filter(id=>remaining.has(id)));}
    if(option?.bleed&&hpDamage>=3&&target.undeadTraitsVersion!==1){
      target.bleeding={damage:Math.min(18,(target.bleeding?.damage??0)+option.bleed),turns:2,sourceId:actor.id};
    }
  }
  if(!option?.noDamage)changeBattleMorale(battle, target, -moraleDamage(target, 3 + Math.min(8, Math.floor(hpDamage / 8)) + (hasPerk(actor, 'fearsome') && hpDamage > 0 ? 10 : 0) + (!ranged ? attachmentEffect(actor.equipment,'meleeMoraleDamage') : 0)));
  const fallen = target.hp === 0;
  const perkProcs = [], effects = [];
  if (fallen) {
    target.alive = false;
    target.ap = 0;
    if (battle.weaponSkillsVersion === 1) clearWeaponStances(target);
    for (const ally of battle.units.filter(unit => unit.side === target.side && unit.alive)) changeBattleMorale(battle, ally, -moraleDamage(ally, 12));
    for (const ally of battle.units.filter(unit => unit.side === actor.side && unit.alive)) changeBattleMorale(battle, ally, ally === actor ? 4 : 2);
    if (actor.side === 'company' && !actor.ally) battle.xp[actor.id] = (battle.xp[actor.id] ?? 0) + 20;
    if (option?.deferKillPerks) option.deferKillPerks.kills += 1;
    else if (hasPerk(actor, 'battle-flow')) {
      const recovered = Math.min(10, actor.fatigue);
      actor.fatigue -= recovered;
      perkProcs.push(`Battle Flow: -${recovered} fatigue.`);
      effects.push({ id: 'battle-flow', amount: recovered });
    }
    if (!option?.deferKillPerks && hasPerk(actor, 'killing-frenzy')) {
      actor.frenzyUntilRound = battle.round + 2;
      perkProcs.push('Killing Frenzy: +25% damage.');
      effects.push({ id: 'killing-frenzy', amount: 25 });
    }
    if (!option?.deferKillPerks && hasPerk(actor, 'berserk') && actor.berserkRound !== battle.round) {
      if (battle.weaponSkillsVersion === 1 && option?.reaction && !option?.freeFollowup) actor.pendingBerserkAp = 4;
      else actor.ap = battle.rulesVersion === 2 ? actor.ap + 4 : 2;
      actor.berserkRound = battle.round;
      effects.push({ id: 'berserk', amount: battle.rulesVersion === 2 ? 4 : 2, ...(battle.weaponSkillsVersion === 1 && option?.reaction && !option?.freeFollowup ? { nextTurn: true } : {}) });
      perkProcs.push(battle.weaponSkillsVersion === 1 && option?.reaction && !option?.freeFollowup ? 'Berserk: +4 AP next turn.'
        : `Berserk: +${battle.rulesVersion === 2 ? 4 : 2} AP.`);
    }
  }
  const message = option?.dot?`${target.name} loses ${hpDamage} health to bleeding${fallen?'; they fall':''}.`: `${actor.name}${option?.freeFollowup ? "'s mount uses Wolf Bite against" : ' hits'} ${target.name}${head ? ' in the head' : ''} for ${hpDamage} health and ${Math.min(armorBefore, armorDamage)} armor${fallen ? '; they fall' : ''}.${shieldDamage ? ` Shield: -${shieldDamage}.` : ''}${perkProcs.length ? ` ${perkProcs.join(' ')}` : ''}`;
  battle.lastEvent = makeBattleEvent(actor, target, 'attack', message, weapon, null, { head, hpDamage, armorDamage: Math.min(armorBefore, armorDamage), shieldDamage, fallen, ...(effects.length ? { effects } : {}),
    ...(option?.name ? { skillName: option.name } : {}) });
  battleLog(battle, message);
  return { hit: true, hpDamage, armorDamage: Math.min(armorBefore, armorDamage), shieldDamage, head, fallen };
}

const SWING_DIRECTIONS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

function horseChargePlan(battle, actor, target, weapon) {
  const mount = getItem(actor.equipment.mount);
  if (battle.mountSkillsVersion !== 1 || !/horse/.test(mount?.visual ?? '') || weapon.ranged
    || ['ranged','flanker'].includes(actor.tacticalRole) || actor.ap < 6
    || battle.units.some(unit => unit.alive && unit.side !== actor.side && hexDistance(actor, unit) === 1)) return null;
  const distance = hexDistance(actor, target);
  if (distance < 3 || distance > 4) return null;
  const direction = SWING_DIRECTIONS.find(([q, r]) => target.q - actor.q === q * distance && target.r - actor.r === r * distance);
  if (!direction) return null;
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const path = [];
  let from = actor, fatigueCost = attackFatigueCost(actor, weapon,battle);
  for (let step = 1; step < distance; step++) {
    const point = { q: actor.q + direction[0] * step, r: actor.r + direction[1] * step };
    const cost = battleMovementCost(battle, actor, from, point);
    if (occupied.has(`${point.q},${point.r}`) || !Number.isFinite(cost)
      || Math.abs(tileAt(battle.field, from.q, from.r).height - tileAt(battle.field, point.q, point.r).height) > 1) return null;
    fatigueCost += movementFatigue(actor, cost);
    path.push(point); from = point;
  }
  if (actor.fatigue + fatigueCost > tacticalFatigueLimit(battle,actor)) return null;
  if (actor.tacticalRole==='breaker') {
    const threats=battle.units.filter(u=>u.alive && u.side!==actor.side && u.id!==target.id);
    if (threats.filter(u=>hexDistance(path.at(-1),u)<=1).length>2
      || path.some(p=>battle.units.some(u=>u.alive && u.side!==actor.side && u.spearwallActive && hexDistance(p,u)<=1))) return null;
  }
  return { path, direction, fatigueCost };
}

function breakerOpeningBonus(battle,actor,target,plan) {
  const point={q:target.q+plan.direction[0],r:target.r+plan.direction[1]},tile=tileAt(battle.field,point.q,point.r);
  const opens=tile && Number.isFinite(movementCost(battle.field,target,point))
    && Math.abs(tile.height-tileAt(battle.field,target.q,target.r).height)<=1
    && !battle.units.some(u=>u.alive && u.q===point.q && u.r===point.r);
  const relieved=battle.units.filter(u=>u.alive && u.side===actor.side && u.id!==actor.id && hexDistance(u,target)===1).length;
  return (opens?24:4)+Math.min(18,relieved*6);
}

function performHorseCharge(state, actor, target, weapon, plan) {
  const battle = state.battle, origin = { q: actor.q, r: actor.r }, reactions = [];
  actor.ap -= 6;
  actor.aiTargetId = target.id;
  clearWeaponStances(actor);
  for (const point of plan.path) {
    const from = { q: actor.q, r: actor.r };
    const cost = battleMovementCost(battle, actor, from, point);
    actor.q = point.q; actor.r = point.r;
    actor.fatigue += movementFatigue(actor, cost);
    consumeMovementCredit(battle, actor, from, point);
    const interception = spearwallReactionsOnMove(state, actor, from);
    reactions.push(...interception.reactions);
    if (interception.blocked || !actor.alive) {
      const message = `${actor.name}'s charge is stopped by Spearwall.`;
      battle.lastEvent = makeBattleEvent(actor, target, 'hold', message, weapon, null,
        { skillName: 'Charge', moveFrom: origin, reactions });
      battleLog(battle, message);
      return;
    }
  }
  const impact = attackTarget(state, actor, target, weapon, { ...COMBAT_SKILLS.charge, ap: 0 });
  if (impact.hit && target.alive) {
    target.stunnedTurns = 1;
    target.stunProtected = true;
    clearWeaponStances(target);
    const destination = { q: target.q + plan.direction[0], r: target.r + plan.direction[1] };
    const tile = tileAt(battle.field, destination.q, destination.r);
    if (tile && Number.isFinite(movementCost(battle.field, target, destination))
      && Math.abs(tile.height - tileAt(battle.field, target.q, target.r).height) <= 1
      && !battle.units.some(unit => unit.alive && unit.q === destination.q && unit.r === destination.r)) {
      battle.lastEvent.pushedFrom = { q: target.q, r: target.r };
      target.q = destination.q; target.r = destination.r;
      battle.lastEvent.to = destination;
    }
    battle.lastEvent.message += ' Stunned by the charge.';
    battleLog(battle, `${target.name} is stunned by the charge.`);
  }
  battle.lastEvent.moveFrom = origin;
  if (reactions.length) battle.lastEvent.reactions = [...reactions, ...(battle.lastEvent.reactions ?? [])];
}

function wolfFollowup(state, actor, preferred) {
  const battle = state.battle;
  if (battle.mountSkillsVersion !== 1 || !actor.alive || !['wolf', 'warg'].includes(getItem(actor.equipment.mount)?.visual)) return;
  const target = [preferred, ...battle.units].find(unit => unit?.alive && unit.side !== actor.side && hexDistance(actor, unit) === 1);
  if (!target) return;
  const original = battle.lastEvent;
  const bite = { damageMin: 12, damageMax: 20, armorPiercing: .4, armorDamage: .6, range: 1 };
  const impact = attackTarget(state, actor, target, bite, { name: 'Wolf Bite', reaction: true, freeFollowup: true });
  const event = battle.lastEvent;
  battle.lastEvent = { ...original, reactions: [...(original.reactions ?? []), {
    actorId: actor.id, targetId: target.id, type: event.type, from: { q: actor.q, r: actor.r }, to: { q: target.q, r: target.r },
    hpDamage: impact.hpDamage, armorDamage: impact.armorDamage, shieldDamage: impact.shieldDamage,
    head: impact.head, fallen: impact.fallen, weaponId: null, effects: event.effects ?? [], skillName: 'Wolf Bite',
  }] };
}

function wargHowl(state, actor) {
  const battle = state.battle, mount = getItem(actor.equipment.mount);
  if (battle.mountBalanceVersion !== 1 || !actor.alive || !mount?.howlChance) return;
  const targets = battle.units.filter(unit => unit.alive && unit.side !== actor.side && hexDistance(actor, unit) <= mount.howlRadius);
  if (!targets.length || battleRoll(battle) >= mount.howlChance) return;
  for (const target of targets) target.howlTurns = 2;
  const message = `${actor.name}'s warg uses Howling: nearby enemies deal 20% less damage for their next 2 turns.`;
  battle.lastEvent.effects = [...(battle.lastEvent.effects ?? []), { id: 'howling', amount: 20 }];
  battle.lastEvent.message = (battle.lastEvent.message + ' Howling: nearby enemy damage −20% for 2 turns.').slice(0, 300);
  battleLog(battle, message);
}

function areaTargets(battle, actor, primary, skillId) {
  const dq=primary.q-actor.q,dr=primary.r-actor.r;
  const action=equipmentSkills(getItem(actor.equipment.weapon)).find(skill=>skill.id===skillId);
  const shape=battle.weaponCompletionVersion===1?action?.area:skillId==='split'?'line':'arc';
  const distance=hexDistance(actor,primary);
  if(shape==='reach-arc'?distance!==2:distance!==1)return [];
  let offsets;
  if(shape==='line')offsets=[[dq,dr],[dq*2,dr*2]];
  else if(shape==='ring')offsets=SWING_DIRECTIONS;
  else if(shape==='reach-arc'){
    // A contiguous arc on the radius-two hex ring, including off-axis anchors.
    const ring=[[2,0],[2,-1],[2,-2],[1,-2],[0,-2],[-1,-1],[-2,0],[-2,1],[-2,2],[-1,2],[0,2],[1,1]];
    const i=ring.findIndex(([q,r])=>q===dq&&r===dr);
    offsets=[-1,0,1].map(n=>ring[(i+n+12)%12]);
  }else{const i=SWING_DIRECTIONS.findIndex(([q,r])=>q===dq&&r===dr);offsets=[-1,0,1].map(n=>SWING_DIRECTIONS[(i+n+6)%6]);}
  const targets=offsets.map(([q,r])=>battle.units.find(unit=>unit.alive&&unit.q===actor.q+q&&unit.r===actor.r+r)).filter(Boolean).filter(unit=>battle.weaponCompletionVersion!==1||Math.abs(tileAt(battle.field,unit.q,unit.r).height-tileAt(battle.field,actor.q,actor.r).height)<=1);
  return primary.id&&targets.includes(primary)?[primary,...targets.filter(target=>target!==primary)]:targets;
}

function maximumHealthDamage(battle, actor, target, weapon, option) {
  return Math.max(...[false, true].map(head => attackDamageRoll(battle, actor, target, weapon, weapon.damageMax, head, option).hp));
}

function safeKillProbability(battle, actor, target, weapon) {
  // Mount follow-ups and charges add safe alternatives beyond the basic-attack bound.
  if (battle.mountSkillsVersion === 1 && getItem(actor.equipment.mount)) return 1;
  const range = effectiveWeaponRange(actor, weapon);
  const attackCost = attackApCost(weapon, battle, actor);
  const swapCost = hasPerk(actor, 'quick-hands') && actor.freeSwapRound !== battle.round ? 0 : 4;
  const alternate = [getItem(actor.reserveEquipment.weapon), ...actor.accessories.map(getItem)]
    .some(item => item?.slot === 'weapon' && actor.ap >= swapCost + (attackApCost(item, battle, actor)));
  if (alternate) return 1;
  // Treat any extra attack budget as a possible safe sequence, even if movement might block it.
  if (actor.ap >= attackCost * 2) return 1;
  if (actor.fatigue + attackFatigueCost(actor, weapon,battle) > actor.maxFatigue) return 0;
  if (hasPerk(actor, 'berserk') && actor.berserkRound !== battle.round
    && battle.units.some(unit => unit.alive && unit.side !== actor.side && unit.id !== target.id
      && hexDistance(actor, unit) <= range && predictAttack(battle, actor, unit, weapon).killProbability > 0)) return 1;
  const distance = hexDistance(actor, target);
  let probability = 0;
  if (distance <= range && actor.ap >= attackCost) {
    probability = predictAttack(battle, actor, target, weapon).killProbability;
  }
  if (distance > range) {
    const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
    const queue = [{ ...actor, spentAp: 0 }];
    const seen = new Set();
    while (queue.length) {
      const from = queue.shift();
      const key = `${from.q},${from.r}:${from.spentAp}:${from.movementCredit}:${from.fatigue}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (from.spentAp > 0 && hexDistance(from, target) <= range
        && from.fatigue + attackFatigueCost(from, weapon,battle) <= from.maxFatigue)
        probability = Math.max(probability, predictAttack(battle, from, target, weapon).killProbability);
      for (const point of hexNeighbors(battle.field, from)) {
        if (occupied.has(`${point.q},${point.r}`)) continue;
        const step = battleMoveApCost(battle, from, from, point);
        if (!Number.isFinite(step) || from.spentAp + step + attackCost > actor.ap) continue;
        const fatigue = from.fatigue + movementFatigue(from, battleMovementCost(battle, from, from, point));
        if (fatigue + attackFatigueCost(from, weapon,battle) > from.maxFatigue) continue;
        const moved = { ...from, q: point.q, r: point.r, fatigue, spentAp: from.spentAp + step };
        consumeMovementCredit(battle, moved, from, point);
        queue.push(moved);
      }
    }
  }
  if (actor.ap >= attackCost) for (const primary of battle.units.filter(unit => unit.alive && unit.side !== actor.side
    && hexDistance(actor, unit) === 1)) for (const id of (battle.weaponCompletionVersion===1?equipmentSkills(weapon).filter(x=>x.area).map(x=>x.id):['split','swing'])) {
    const option=battle.weaponCompletionVersion===1?equipmentSkills(weapon).find(x=>x.id===id):COMBAT_SKILLS[id];
    const affected = areaTargets(battle, actor, primary, id);
    if (affected.includes(target) && affected.every(unit => unit.side !== actor.side)
      && actor.fatigue + attackSkillFatigue(actor, weapon, option) <= availableFatigue(actor))
      probability = Math.max(probability, predictAttack(battle, actor, target, weapon, option).killProbability);
  }
  return probability;
}

function areaAttackCandidate(state, actor, primary, weapon, option) {
  const battle = state.battle;
  const targets = areaTargets(battle, actor, primary, option.id);
  if (targets.length < 2 || !targets.some(target => target.side !== actor.side)) return null;
  const impacts = targets.map(target => {
    const prediction = predictAttack(battle, actor, target, weapon, option);
    return { id: target.id, ally: target.side === actor.side, hp: target.hp, ...prediction,
      maxHealthDamage: maximumHealthDamage(battle, actor, target, weapon, option) };
  });
  const safeKillProbabilityById = impacts.some(impact => impact.ally)
    ? Object.fromEntries(targets.filter(target => target.side !== actor.side)
      .map(target => [target.id, safeKillProbability(battle, actor, target, weapon)])) : {};
  const safety = evaluateAreaSafety(impacts, { safeKillProbabilityById });
  if (!safety.allowed || primary.side === actor.side && !safety.exception) return null;
  const enemies = impacts.filter(impact => !impact.ally);
  const priorityTarget = !primary.id || primary.side === actor.side ? targets.find(target => target.side !== actor.side) : primary;
  return { id: option.id, type: 'area', targetId: priorityTarget.id, target: priorityTarget, areaAnchor: primary, targets, safety,
    apCost: attackApCost(weapon, battle, actor, option), fatigueCost: attackSkillFatigue(actor, weapon, option),
    expectedHealthDamage: enemies.reduce((sum, impact) => sum + impact.expectedHealthDamage, 0),
    expectedArmorDamage: enemies.reduce((sum, impact) => sum + impact.expectedArmorDamage, 0),
    killProbability: Math.max(...enemies.map(impact => impact.killProbability)),
    bonus: targets.length > 2 ? 15 : 10 };
}

function knockBackDestination(battle, actor, target) {
  const occupied = new Set(battle.units.filter(unit => unit.alive).map(unit => `${unit.q},${unit.r}`));
  const height = tileAt(battle.field, target.q, target.r).height;
  return hexNeighbors(battle.field, target)
    .filter(point => hexDistance(actor, point) > hexDistance(actor, target)
      && !occupied.has(`${point.q},${point.r}`)
      && tileAt(battle.field, point.q, point.r).terrain !== 'trees'
      && Math.abs(tileAt(battle.field, point.q, point.r).height - height) <= 1
      && Number.isFinite(movementCost(battle.field, target, point)))
    .sort((a, b) => hexDistance(actor, b) - hexDistance(actor, a) || a.q - b.q || a.r - b.r)[0] ?? null;
}

function hookDestination(battle, actor, target) {
  const occupied = new Set(battle.units.filter(unit => unit.alive).map(unit => `${unit.q},${unit.r}`));
  const height = tileAt(battle.field, target.q, target.r).height;
  return hexNeighbors(battle.field, target)
    .filter(point => hexDistance(actor, point) < hexDistance(actor, target)
      && !occupied.has(`${point.q},${point.r}`)
      && tileAt(battle.field, point.q, point.r).terrain !== 'trees'
      && Math.abs(tileAt(battle.field, point.q, point.r).height - height) <= 1
      && Number.isFinite(movementCost(battle.field, target, point)))
    .sort((a, b) => hexDistance(actor, a) - hexDistance(actor, b) || a.q - b.q || a.r - b.r)[0] ?? null;
}

function clearWeaponStances(unit) {
  unit.shieldWallActive = false;
  if (Object.hasOwn(unit, 'spearwallActive')) unit.spearwallActive = false;
  if (Object.hasOwn(unit, 'riposteActive')) unit.riposteActive = false;
}

function spearwallReactionsOnMove(state, mover, from) {
  const battle = state.battle;
  if (battle.weaponSkillsVersion !== 1 || !mover.alive) return { blocked: false, reactions: [] };
  const destination = { q: mover.q, r: mover.r };
  const defenders = battle.units.filter(unit => unit.alive && unit.side !== mover.side && unit.spearwallActive
    && unit.stunnedTurns === 0 && !unit.disarmedTurns && unit.fatigue + 5 <= tacticalFatigueLimit(battle,unit)
    && weaponSkillFamily(getItem(unit.equipment.weapon)) === 'spear'
    && hexDistance(unit, from) > (getItem(unit.equipment.weapon)?.spearwall?effectiveWeaponRange(unit,getItem(unit.equipment.weapon)):1)
    && hexDistance(unit, destination) === (getItem(unit.equipment.weapon)?.spearwall?effectiveWeaponRange(unit,getItem(unit.equipment.weapon)):1))
    .sort((a, b) => a.id.localeCompare(b.id));
  const reactions = [];
  for (const defender of defenders) {
    const impact = attackTarget(state, defender, mover, getItem(defender.equipment.weapon), { name: 'Spearwall', reaction: true });
    const event = battle.lastEvent;
    reactions.push({ actorId: defender.id, targetId: mover.id, type: event.type,
      from: { q: defender.q, r: defender.r }, to: destination,
      hpDamage: impact.hpDamage, armorDamage: impact.armorDamage, shieldDamage: impact.shieldDamage,
      head: impact.head, fallen: impact.fallen, weaponId: defender.equipment.weapon, effects: event.effects ?? [], skillName: 'Spearwall' });
    if (!impact.hit) defender.spearwallActive = false;
    if (impact.hit || !mover.alive) {
      mover.q = from.q; mover.r = from.r;
      return { blocked: true, reactions };
    }
  }
  return { blocked: false, reactions };
}

function spearwallUseful(battle, actor, enemies) {
  const reach=getItem(actor.equipment.weapon)?.spearwall?effectiveWeaponRange(actor,getItem(actor.equipment.weapon)):1;
  return enemies.some(enemy => hexDistance(actor, enemy) >= reach+1 && hexDistance(actor, enemy) <= reach+2
    && pathToTarget(battle, enemy, actor, reach, false) !== null);
}

function lungePlan(battle,actor,target,weapon) {
  if(roleRules(battle)&&(!['offense','focus'].includes(combatCommand(battle,actor))||actor.tacticalRole==='ranged'))return null;
  if(battle.weaponAuditVersion!==1||!weapon.fencing||hexDistance(actor,target)!==2
    ||battle.units.some(unit=>unit.alive&&unit.side!==actor.side&&hexDistance(actor,unit)===1))return null;
  const point=hexNeighbors(battle.field,actor).filter(point=>hexDistance(point,target)===1
    &&Number.isFinite(movementCost(battle.field,actor,point))
    &&Math.abs(tileAt(battle.field,point.q,point.r).height-tileAt(battle.field,actor.q,actor.r).height)<=1
    && !battle.units.some(unit=>unit.alive&&unit.q===point.q&&unit.r===point.r)
    && (!roleRules(battle)||actor.tacticalRole!=='flanker'||!battle.units.some(unit=>unit.alive&&unit.side!==actor.side&&unit.id!==target.id&&hexDistance(point,unit)<=1)))
    .sort((a,b)=>a.q-b.q||a.r-b.r)[0];
  if(!point)return null;
  return {point,option:{...COMBAT_SKILLS.lunge,damageMultiplier:Math.min(2,2*Math.max(0,combatInitiative(actor)-actor.fatigue)/175)}};
}
function skillOptionForTarget(family, actor, target, weapon, battle) {
  const id = ({ mace: 'knock-out', dagger: 'puncture', qatal: 'deathblow', axe: 'split-shield',
    hammer: 'crush-armor', cleaver: 'decapitate', flail: 'flail-headshot', polearm: 'hook',
    throwing: 'power-throw', crossbow: 'piercing-bolt', whip: 'whip-crack', sling: 'stunning-stone' })[family];
  if (!id) return null;
  const armor = target.headArmor + target.bodyArmor + target.attachmentArmor + (target.attachment2Armor??0);
  if (['knock-out', 'stunning-stone'].includes(id) && (target.stunnedTurns || target.stunProtected)
    || id === 'puncture' && target.bodyArmor + target.attachmentArmor + (target.attachment2Armor??0) === 0 || id === 'deathblow' && !target.stunnedTurns
    || id === 'split-shield' && target.shieldDurability === 0
    || id === 'crush-armor' && armor === 0 || id === 'decapitate' && target.hp >= target.maxHp
    || id === 'flail-headshot' && target.headArmor >= target.bodyArmor + target.attachmentArmor + (target.attachment2Armor??0)
      && !(target.equipment.shield && target.shieldDurability > 0)
    || id === 'piercing-bolt' && armor === 0
    || id === 'hook' && !hookDestination(battle, actor, target)) return null;
  return { ...COMBAT_SKILLS[id], ap: weapon.twoHanded && !weapon.ranged ? 6 : COMBAT_SKILLS[id].ap };
}

function completedSkillOptions(actor,target,weapon,battle) {
 return equipmentSkills(weapon).map(skill=>skill.id==='disarm'&&hasWeaponMastery(actor,weapon)?{...skill,hitBonus:-10}:skill).filter(skill=>!skill.basic&&!skill.area&&!['spearwall','riposte','lunge','aimed-shot'].includes(skill.id)).filter(skill=>{
  if(skill.id==='split-shield')return target.shieldDurability>0;
  if(skill.id==='puncture')return target.bodyArmor+target.attachmentArmor+(target.attachment2Armor??0)>0;
  if(skill.id==='deathblow')return target.stunnedTurns>0||target.dazedTurns>0;
  if(skill.id==='decapitate')return target.hp<target.maxHp;
  if(['crush-armor','demolish-armor','piercing-bolt'].includes(skill.id))return target.headArmor+target.bodyArmor+target.attachmentArmor+(target.attachment2Armor??0)>0;
  if(skill.id==='hook')return !!hookDestination(battle,actor,target);
  if(skill.push&&!knockBackDestination(battle,actor,target))return false;
  if(skill.disarm)return !target.disarmedTurns&&!!getItem(target.equipment.weapon);
  if(skill.daze)return !target.dazedTurns&&target.undeadTraitsVersion!==1;
  if(skill.stunChance||['knock-out','stunning-stone'].includes(skill.id))return !target.stunnedTurns&&!target.stunProtected;
  return true;
 });
}
function attackMultiple(state,actor,target,weapon,option){
 const impacts=[],events=[];let opposite;
 const count=option.hits??2,chance=attackHitChance(state.battle,actor,target,weapon,option.hitBonus??0,option);
 for(let i=0;i<count&&target.alive&&actor.alive;i++){
  const strike={...option,chanceOverride:chance,strikeFollowup:true,areaFollowup:i>0};
  if(option.oppositeHit&&i>0){strike.head=opposite;strike.damageMultiplier=.5;strike.chanceOverride=100;}
  const impact=attackTarget(state,actor,target,weapon,strike);impacts.push(impact);events.push(state.battle.lastEvent);
  if(i===0&&option.oppositeHit){if(!impact.hit)break;opposite=!impact.head;}
 }
 const effects=[...new Map(events.flatMap(x=>x.effects??[]).map(x=>[x.id,x])).values()],reactions=events.flatMap(x=>x.reactions??[]);
 const total={hit:impacts.some(x=>x.hit),hpDamage:impacts.reduce((n,x)=>n+x.hpDamage,0),armorDamage:impacts.reduce((n,x)=>n+x.armorDamage,0),shieldDamage:impacts.reduce((n,x)=>n+x.shieldDamage,0),head:impacts[0].head,fallen:!target.alive};
 state.battle.lastEvent={...events[0],type:total.hit?'attack':'miss',hpDamage:total.hpDamage,armorDamage:total.armorDamage,shieldDamage:total.shieldDamage,head:total.head,fallen:total.fallen,skillName:option.name,strikes:impacts.map(x=>({...x})),...(effects.length?{effects}:{}),...(reactions.length?{reactions}:{}),message:`${actor.name} uses ${option.name} on ${target.name}: ${total.hpDamage} health, ${total.armorDamage} armor (${impacts.filter(x=>x.hit).length}/${impacts.length} strikes hit).`};
 return total;
}
function tickBleeding(state,unit){
 const bleed=unit.bleeding;if(!bleed)return false;
 const source=state.battle.units.find(x=>x.id===bleed.sourceId);
 bleed.turns--;if(!bleed.turns)delete unit.bleeding;
 // Reuse death/morale/XP handling, without contact, attack resources or mount followups.
 attackTarget(state,source,unit,{id:null,slot:'weapon',damageMin:0,damageMax:0,armorDamage:0,armorPiercing:0},
  {id:'bleeding',name:'Bleeding',dot:true,fixedHealth:bleed.damage,head:false,chanceOverride:100,reaction:true,areaFollowup:true});
 return true;
}
function combatInitiative(unit){return unit.initiative*(unit.staggeredTurns>0?.5:1)*(unit.dazedTurns>0?.75:1);}
function availableFatigue(unit){return unit.maxFatigue*(unit.dazedTurns>0?.75:1);}

function roleRules(battle){return battle?.roleConsistencyVersion===1&&battle.weaponSkillsVersion===1;}
function combatCommand(battle,actor){return actor.side==='enemy'?enemyBattleTactic(battle,getItem):actor.ally?'offense':battle.tactic;}
function tacticalFatigueLimit(battle,actor){return roleRules(battle)?availableFatigue(actor):actor.maxFatigue;}
function canAfford(battle,actor,apCost,fatigueCost){return isAffordableAction({...actor,maxFatigue:tacticalFatigueLimit(battle,actor)},{apCost,fatigueCost});}
function canFireAfterMove(state,actor,weapon,point,moveAp=0,moveFatigue=0){
 const battle=state.battle;
 if(!weapon?.ranged||actor.disarmedTurns||actor.stunnedTurns||actor.reload>0||!battleWeaponHasAmmo(state,actor,weapon))return false;
 const basic=battle.weaponCompletionVersion===1?equipmentSkills(weapon)[0]:null;
 const options=[basic,...(isBow(weapon)?[COMBAT_SKILLS['aimed-shot']]:[])];
 return battle.units.some(target=>target.alive&&target.side!==actor.side&&options.some(option=>
   hexDistance(point,target)<=effectiveWeaponRange(actor,weapon)+(option?.rangeBonus??0)
   &&canAfford(battle,actor,moveAp+attackApCost(weapon,battle,actor,option),moveFatigue+attackSkillFatigue(actor,weapon,option))));
}

function battleMoveApCost(battle, actor, from, to) {
  const cost = battleMovementCost(battle, actor, from, to);
  if (!Number.isFinite(cost)) return Infinity;
  if (battle.mountBalanceVersion === 1 && getItem(actor.equipment.mount)) return 1;
  return Math.max(0, cost * 2 - (actor.movementCredit ?? 0));
}

function consumeMovementCredit(battle, actor, from, to) {
  const cost = battleMovementCost(battle, actor, from, to) * 2;
  actor.movementCredit = Math.max(0, (actor.movementCredit ?? 0) - cost);
}

// Follow a complete cheapest escape route rather than greedily circling a local obstacle.
// Recomputing needs no saved route and adapts to casualties and moving blockers.
function fleeRoute(battle, actor, enemies, occupied) {
  const queue = [{ q: actor.q, r: actor.r, cost: 0, first: null }];
  const best = new Map([[`${actor.q},${actor.r}`, 0]]);
  const safety = point => Math.min(...enemies.map(enemy => hexDistance(point, enemy)));
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost || safety(b.first ?? b) - safety(a.first ?? a)
      || a.q - b.q || a.r - b.r);
    const point = queue.shift();
    if (point.cost > best.get(`${point.q},${point.r}`)) continue;
    if (point.q === 0 || point.r === 0 || point.q === battle.field.columns - 1 || point.r === battle.field.rows - 1) return point.first;
    for (const next of openNeighbors(battle, point, occupied)) {
      const cost = point.cost + battleMovementCost(battle, actor, point, next);
      const key = `${next.q},${next.r}`;
      if (cost < (best.get(key) ?? Infinity)) {
        best.set(key, cost);
        queue.push({ ...next, cost, first: point.first ?? next });
      }
    }
  }
  return null;
}

function fleeBattleEnemy(state, actor, enemies) {
  const battle = state.battle;
  const from = { q: actor.q, r: actor.r };
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const edgeDistance = point => Math.min(point.q, point.r, battle.field.columns - 1 - point.q, battle.field.rows - 1 - point.r);
  const routeStep = fleeRoute(battle, actor, enemies, occupied);
  const apCost = routeStep ? battleMoveApCost(battle, actor, actor, routeStep) : Infinity;
  const point = apCost <= actor.ap ? { ...routeStep, apCost } : null;
  if(battle.escapeRulesVersion===1)actor.firstFleeRound??=battle.round;
  const atEdge = edgeDistance(actor) === 0;
  const exiting = atEdge && (battle.escapeRulesVersion!==1 || battle.round>actor.firstFleeRound);
  const reactions = [];
  if (point || exiting) for (const enemy of enemies.filter(unit => hexDistance(actor, unit) === 1
    && !unit.stunnedTurns && !unit.disarmedTurns && unit.fatigue + 5 <= tacticalFatigueLimit(battle,unit))) {
    const equipped = getItem(enemy.equipment.weapon);
    const weapon = equipped && !equipped.ranged ? equipped : { damageMin: 8, damageMax: 12, hitBonus: -12, armorDamage: .4, range: 1 };
    const impact = attackTarget(state, enemy, actor, weapon, { reaction: true, name: 'Opportunity Strike' });
    const event = battle.lastEvent;
    reactions.push({ actorId: enemy.id, targetId: actor.id, type: event.type,
      from: { q: enemy.q, r: enemy.r }, to: from, ...impact, weaponId: weapon.id ?? null, effects: event.effects ?? [], skillName: 'Opportunity Strike' });
    if (!actor.alive) break;
  }
  let message;
  if (!actor.alive) message = `${actor.name} is cut down while fleeing.`;
  else if (exiting) {
    actor.escaped = true; actor.alive = false; actor.hp = 0;
    clearWeaponStances(actor);
    message = `${actor.name} flees the battlefield.`;
  } else if (point) {
    actor.ap -= point.apCost;
    actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + movementFatigue(actor, battleMovementCost(battle, actor, from, point)));
    consumeMovementCredit(battle, actor, from, point);
    actor.q = point.q; actor.r = point.r;
    clearWeaponStances(actor);
    const interception = spearwallReactionsOnMove(state, actor, from);
    reactions.push(...interception.reactions);
    message = interception.blocked ? `${actor.name} tries to flee but is stopped by Spearwall.` : `${actor.name} flees from the company.`;
  } else { actor.ap = 0; message = atEdge ? `${actor.name} reaches the boundary but is still within reach.` : `${actor.name} tries to flee but cannot find a way out.`; }
  battle.lastEvent = makeBattleEvent(actor, null, actor.alive && point ? 'move' : 'hold', message,
    getItem(actor.equipment.weapon), from, { skillName: 'Flee', ...(reactions.length ? { reactions } : {}) });
  battleLog(battle, message);
  if (!finishBattlePhase(battle) && (!actor.alive || actor.ap <= 0)) nextBattleTurn(battle);
  return result(true, message);
}

function advanceBattleV2(state) {
  const battle = state.battle;
  const actor = battle.units.find(unit => unit.id === battle.activeId);
  if (!actor?.alive) { nextBattleTurn(battle); return result(true, 'The next fighter takes their turn.'); }
  if(battle.weaponCompletionVersion===1&&actor.bleedTickRound!==battle.round&&actor.bleeding){actor.bleedTickRound=battle.round;tickBleeding(state,actor);if(!finishBattlePhase(battle)&&!actor.alive)nextBattleTurn(battle);return result(true,battle.lastEvent.message);}
  if (battle.weaponSkillsVersion === 1 && actor.stunnedTurns > 0) {
    actor.stunnedTurns = 0;
    actor.ap = 0;
    actor.turnStartedRound = battle.round;
    const message = `${actor.name} is stunned and loses a turn.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, getItem(actor.equipment.weapon), null, { skillName: 'Stunned' });
    battleLog(battle, message);
    nextBattleTurn(battle);
    return result(true, message);
  }
  const enemies = battle.units.filter(unit => unit.alive && unit.side !== actor.side);
  if (!enemies.length) { finishBattlePhase(battle); return result(true, 'The battle is over.'); }
  if (actor.turnStartedRound !== battle.round) {
    actor.fatigue = Math.max(0, actor.fatigue - 15);
    actor.turnStartedRound = battle.round;
    if (battle.weaponSkillsVersion === 1) actor.stunProtected = false;
  }
  if (battle.weaponSkillsVersion === 1 && actor.side === 'enemy' && !isMoraleImmune(actor) && actor.morale < 25) {
    if (actor.fleeRollRound !== battle.round) {
      actor.fleeRollRound = battle.round;
      if (battleRoll(battle) < .5) actor.fleeRound = battle.round;
    }
    if (actor.fleeRound === battle.round) return fleeBattleEnemy(state, actor, enemies);
  }
  const fallingBack=returnSkirmisher(state,actor);if (fallingBack) return fallingBack;
  if (useBattleAccessory(state, actor, enemies)) return result(true, battle.lastEvent.message);
  if (readyShieldWallSet(state, actor) || chooseBattleWeapon(state, actor, enemies)) return result(true, battle.lastEvent.message);
  const equipped = getItem(actor.equipment.weapon);
  const reserve = getItem(actor.reserveEquipment.weapon);
  const swapCost = hasPerk(actor, 'quick-hands') && actor.freeSwapRound !== battle.round ? 0 : 4;
  if (actor.side === 'company' && !actor.ally && isCrossbow(equipped) && actor.reload > 0
    && isCrossbow(reserve) && actor.reserveReload === 0 && battleWeaponHasAmmo(state, actor, reserve, 'reserve')
    && enemies.some(enemy => hexDistance(actor, enemy) >= 2 && hexDistance(actor, enemy) <= effectiveWeaponRange(actor, reserve))
    && actor.ap >= swapCost + attackApCost(reserve, battle, actor)
    && actor.fatigue + attackFatigueCost(actor, reserve,battle) <= availableFatigue(actor)) {
    switchBattleSet(state, actor, `${actor.name} draws a loaded ${reserve.name} instead of reloading.`);
    return result(true, battle.lastEvent.message);
  }
  const rangedAI = battle.weaponSkillsVersion === 1;
  const noAmmo = equipped?.ranged && !battleWeaponHasAmmo(state, actor, equipped);
  const weapon = noAmmo || !equipped ? { damageMin: 8, damageMax: 12, hitBonus: -12, armorDamage: .4, range: 1 } : equipped;
  const role = actor.tacticalRole ?? (weapon.ranged ? weapon.throwing ? 'skirmisher' : 'ranged' : 'frontliner');
  const rangedSets = [[equipped,'active'],[reserve,'reserve'],[getItem(actor.pocketStowedWeapon),'active']]
    .filter(([item])=>item?.ranged);
  const ammunitionSpent = noAmmo || ['ranged','skirmisher'].includes(role) && rangedSets.length>0
    && rangedSets.every(([item,set])=>!battleWeaponHasAmmo(state,actor,item,set));
  // Spacing belongs to the weapon in hand. A loaded reserve must not pull a
  // melee backup away from the adjacent opponent it was drawn to fight.
  const spacingWeapon = weapon.ranged ? weapon : null;
  const range = effectiveWeaponRange(actor, weapon);
  const attackCost = attackApCost(weapon, battle, actor);
  const skillFamily = battle.weaponSkillsVersion === 1 && !noAmmo ? weaponSkillFamily(weapon) : null;
  const candidates = [];
  const nearest = Math.min(...enemies.map(enemy => hexDistance(actor, enemy)));
  const companyTactic = actor.side === 'company' && !actor.ally ? battle.tactic : actor.side === 'enemy' ? enemyBattleTactic(battle,getItem) : 'offense';
  const skirmishMoveResult=skirmishPosition(state,actor,enemies,weapon,ammunitionSpent);
  if (skirmishMoveResult) return skirmishMoveResult;
  if (rangedAI && spacingWeapon && (companyTactic!=='skirmish' || nearest<=1)) {
    const position = rangedPositionStep(state,actor,enemies,spacingWeapon,companyTactic);
    const canRetreatAndShoot = position?.spacing && weapon.ranged && actor.reload===0
      && actor.ap>=battleMoveApCost(battle,actor,actor,position.point)+attackCost
      && companyTactic!=='advance-formation'
      &&(!roleRules(battle)||canFireAfterMove(state,actor,weapon,position.point,battleMoveApCost(battle,actor,actor,position.point),movementFatigue(actor,battleMovementCost(battle,actor,actor,position.point))));
    if (position && !canRetreatAndShoot) {
      const moved=moveToRangedPosition(state,actor,position,companyTactic);
      if(moved)return moved;
    }
  }
  if ((!rangedAI || !noAmmo) && actor.reload > 0 && actor.ap >= 4) {
    actor.reload -= 1;
    actor.ap -= 4;
    if (hasPerk(actor, 'reload-drill')) actor.fatigue = Math.max(0, actor.fatigue - 12);
    const message = `${actor.name} reloads ${equipped?.name ?? 'their weapon'}.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equipped, null, { skillName: 'Reload' });
    battleLog(battle, message);
    if (actor.ap <= 0) nextBattleTurn(battle);
    return result(true, message);
  }
  const nearbyTarget = enemies.some(enemy => hexDistance(actor, enemy) <= range)
    || roleRules(battle)&&canFireAfterMove(state,actor,weapon,actor);
  if (companyTactic === 'focus' && !enemies.some(enemy => enemy.id === battle.focusTargetId)) {
    battle.focusTargetId = enemies.filter(enemy => pathToTarget(battle, actor, enemy, range, weapon.ranged === true) !== null)
      .sort((a, b) => a.hp + (a.bodyArmor + a.attachmentArmor + (a.attachment2Armor??0) + a.headArmor) * .15 + a.meleeDefense * .3
        - b.hp - (b.bodyArmor + b.attachmentArmor + (b.attachment2Armor??0) + b.headArmor) * .15 - b.meleeDefense * .3
        || hexDistance(actor, a) - hexDistance(actor, b) || a.id.localeCompare(b.id))[0]?.id ?? null;
  }
  if (companyTactic === 'defense' && (!rangedAI || !ammunitionSpent) && !nearbyTarget && (battle.round - battle.lastContactRound < 4)
    && !(battle.engaged && nearest <= 3)
    && !(skillFamily === 'spear' && !actor.spearwallActive && spearwallUseful(battle, actor, enemies) && actor.ap >= attackApCost(weapon, battle, actor, battle.weaponCompletionVersion===1?equipmentSkills(weapon).find(x=>x.id==='spearwall'):COMBAT_SKILLS.spearwall)
      && actor.fatigue + attackSkillFatigue(actor, weapon, battle.weaponCompletionVersion===1?equipmentSkills(weapon).find(x=>x.id==='spearwall'):COMBAT_SKILLS.spearwall) <= availableFatigue(actor))) {
    actor.ap = 0;
    actor.fatigue = Math.max(0, actor.fatigue - 12);
    const message = `${actor.name} holds the line.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, equipped);
    battleLog(battle, message);
    nextBattleTurn(battle);
    return result(true, message);
  }
  if (companyTactic === 'advance-formation' && !sideInMeleeContact(battle) && actor.formationMovedRound !== battle.round) {
    const from = { q: actor.q, r: actor.r };
    const previousFatigue = actor.fatigue;
    const previousPlan = structuredClone(battle.formationAdvance);
    const moved = advanceFormationStep(battle, actor);
    const apCost = moved ? battleMoveApCost(battle, actor, from, actor) : 0;
    if (moved && apCost > actor.ap) {
      actor.q = from.q; actor.r = from.r;
      actor.fatigue = previousFatigue;
      battle.formationAdvance = previousPlan;
    } else if (moved) {
      actor.ap -= apCost;
      consumeMovementCredit(battle, actor, from, actor);
      const interception = spearwallReactionsOnMove(state, actor, from);
      if (interception.blocked) battle.formationAdvance = previousPlan;
      else actor.formationMovedRound = battle.round;
      const message = interception.blocked ? `${actor.name} is stopped by Spearwall.` : `${actor.name} advances one step with the formation.`;
      battle.lastEvent = makeBattleEvent(actor, null, interception.blocked ? 'hold' : 'move', message, equipped, from,
        interception.reactions.length ? { reactions: interception.reactions } : {});
      battleLog(battle, message);
      if (actor.ap <= 0) nextBattleTurn(battle);
      return result(true, message);
    }
  }
  if (actor.side==='company' && !actor.ally && (!rangedAI || !spacingWeapon && !ammunitionSpent) && companyTactic === 'shield-wall' && actor.formationMovedRound !== battle.round && (weapon.ranged || !nearbyTarget)) {
    const reform = shieldWallReformStep(state, actor);
    if (reform) {
      const cost = battleMoveApCost(battle, actor, actor, reform);
      if (actor.ap >= cost&&(!roleRules(battle)||canAfford(battle,actor,cost,movementFatigue(actor,battleMovementCost(battle,actor,actor,reform))))) {
        const from = { q: actor.q, r: actor.r };
        actor.q = reform.q; actor.r = reform.r;
        actor.ap -= cost;
        actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + movementFatigue(actor, battleMovementCost(battle, actor, from, actor)));
        consumeMovementCredit(battle, actor, from, actor);
        const interception = spearwallReactionsOnMove(state, actor, from);
        if (!interception.blocked) {
          actor.formationMovedRound = battle.round;
          battle.formationAdvance = makeFormationAdvancePlan(battle);
        }
        const message = interception.blocked ? `${actor.name} is stopped by Spearwall.` : `${actor.name} reforms the shield wall.`;
        battle.lastEvent = makeBattleEvent(actor, null, interception.blocked ? 'hold' : 'move', message, equipped, from,
          interception.reactions.length ? { reactions: interception.reactions } : {});
        battleLog(battle, message);
        if (actor.ap <= 0) nextBattleTurn(battle);
        return result(true, message);
      }
    }
  }
  let retreatFrom = null;
  let retreatReactions = [];
  if (weapon.ranged && nearest <= 1 && actor.reload === 0 && companyTactic !== 'advance-formation') {
    const retreat = archerRetreatOption(battle, actor, range);
    const cost = retreat ? battleMoveApCost(battle, actor, actor, retreat) : Infinity;
    if (retreat && actor.ap >= cost + attackCost&&(!roleRules(battle)||canFireAfterMove(state,actor,weapon,retreat,cost,movementFatigue(actor,retreat.cost)))) {
      retreatFrom = { q: actor.q, r: actor.r };
      actor.q = retreat.q; actor.r = retreat.r;
      actor.ap -= cost;
      actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + movementFatigue(actor, battleMovementCost(battle, actor, retreatFrom, actor)));
      consumeMovementCredit(battle, actor, retreatFrom, actor);
      const interception = spearwallReactionsOnMove(state, actor, retreatFrom);
      retreatReactions = interception.reactions;
      if (interception.blocked) {
        const message = `${actor.name} is stopped by Spearwall.`;
        battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, equipped, retreatFrom,
          { reactions: retreatReactions });
        battleLog(battle, message);
        if (!finishBattlePhase(battle) && (actor.ap <= 0 || !actor.alive)) nextBattleTurn(battle);
        return result(true, message);
      }
      if (actor.side==='company' && !actor.ally && companyTactic === 'shield-wall') battle.formationAdvance = makeFormationAdvancePlan(battle);
    }
  }
  const basicOption=battle.weaponCompletionVersion===1?equipmentSkills(weapon)[0]:null;
  const basicFatigue=basicOption?attackSkillFatigue(actor,weapon,basicOption):attackFatigueCost(actor,weapon,battle);
  const canAttack = !actor.disarmedTurns && actor.fatigue + basicFatigue <= availableFatigue(actor) && actor.reload === 0;
  for (const target of enemies) {
    const distance = hexDistance(actor, target);
    const normal = predictAttack(battle, actor, target, weapon,basicOption);
    const aimed = isBow(weapon) ? predictAttack(battle, actor, target, weapon, 15) : null;
    const charge = !actor.disarmedTurns && ['offense', 'focus'].includes(companyTactic) && horseChargePlan(battle, actor, target, weapon);
    if (charge) {
      const predicted = predictAttack(battle, { ...actor, ...charge.path.at(-1) }, target, weapon, COMBAT_SKILLS.charge);
      candidates.push({ id: 'charge', type: 'charge', targetId: target.id, target, plan: charge, apCost: 6,
        fatigueCost: charge.fatigueCost, ...predicted, preventedDamage: target.meleeSkill * .25,
        incomingDamage: role==='breaker'?enemies.filter(e=>e.id!==target.id && hexDistance(charge.path.at(-1),e)<=1).length*12:0,
        bonus: 24+(role==='breaker'?breakerOpeningBonus(battle,actor,target,charge):0) });
    }
    const lunge=!actor.disarmedTurns&&lungePlan(battle,actor,target,weapon);
    if(lunge)candidates.push({id:'lunge',type:'lunge',targetId:target.id,target,plan:lunge,apCost:attackApCost(weapon,battle,actor,lunge.option),fatigueCost:attackSkillFatigue(actor,weapon,lunge.option),...predictAttack(battle,{...actor,...lunge.point},target,weapon,lunge.option),bonus:22});
    if (distance <= range && canAttack) {
      candidates.push({ id: 'attack', type: 'attack', targetId: target.id, target, apCost: attackCost,
        option:basicOption,fatigueCost: basicFatigue, ...normal,
        wastedAmmo: weapon.ranged && target.hp < normal.expectedHealthDamage * .4 ? 1 : 0,
        bonus: 18 + (isBow(weapon) && actor.ap >= attackCost * 2 && (!weapon.reloadTurns) && (!actor.ally && actor.side === 'company' ? state.supplies.ammo >= 2 : true) ? normal.expectedHealthDamage * .75 : 0) });
    }
    if (skillFamily && !actor.disarmedTurns && distance <= range && actor.reload === 0) for(const option of (battle.weaponCompletionVersion===1?completedSkillOptions(actor,target,weapon,battle):[skillOptionForTarget(skillFamily, actor, target, weapon, battle)])) {
      const fatigueCost = option && attackSkillFatigue(actor, weapon, option);
      if (option && actor.ap >= attackApCost(weapon, battle, actor, option) && actor.fatigue + fatigueCost <= availableFatigue(actor)) {
        const predicted = predictAttack(battle, actor, target, weapon, option);
        candidates.push({ id: option.id, type: 'attack', targetId: target.id, target, option,
          apCost: attackApCost(weapon, battle, actor, option), fatigueCost, ...predicted,
          preventedDamage: option.disarm||option.daze||option.stagger||option.stunChance||['knock-out','stunning-stone'].includes(option.id)?target.meleeSkill*.25:0,
          bonus: 18 + (['knock-out', 'stunning-stone'].includes(option.id) ? (actor.skillPreference === 'control' ? 22 : 3)
            : option.id === 'demolish-armor' ? 12 : option.id === 'hook' ? 10 : option.id === 'split-shield' ? 8 : option.id === 'puncture' ? 8 : 0) });
      }
    }
    if(!actor.disarmedTurns && (battle.weaponCompletionVersion===1?equipmentSkills(weapon).some(x=>x.area):skillFamily==='two-handed-sword')) {
      for (const option of (battle.weaponCompletionVersion===1?equipmentSkills(weapon).filter(x=>x.area):['split','swing'].map(id=>COMBAT_SKILLS[id]))) {
        const fatigueCost = attackSkillFatigue(actor, weapon, option);
        if (actor.ap < attackApCost(weapon, battle, actor, option) || actor.fatigue + fatigueCost > actor.maxFatigue) continue;
        const candidate = areaAttackCandidate(state, actor, target, weapon, option);
        if (candidate) candidates.push(candidate);
      }
    }
    if (!actor.disarmedTurns && aimed && distance <= range + 1 && actor.reload === 0 && actor.fatigue + aimedFatigueCost(actor) <= availableFatigue(actor)) {
      candidates.push({ id: 'aimed-shot', type: 'attack', targetId: target.id, target, apCost: attackApCost(weapon, battle, actor, COMBAT_SKILLS['aimed-shot']),
        fatigueCost: aimedFatigueCost(actor), ...aimed, bonus: 15 });
    }
    if (distance === 1 && actor.equipment.shield && actor.shieldDurability > 0 && actor.fatigue + shieldSkillFatigue(actor) <= availableFatigue(actor)) {
      const push = knockBackDestination(battle, actor, target);
      if (push) candidates.push({ id: 'knock-back', type: 'knock-back', targetId: target.id, target, push, apCost: 4, fatigueCost: shieldSkillFatigue(actor),
        preventedDamage: target.meleeSkill * .18, incomingDamage: 2, bonus: actor.skillPreference === 'control' ? 8 : -6 });
    }
  }
  if(battle.weaponCompletionVersion===1&&!actor.disarmedTurns){
    const occupied=new Set(battle.units.filter(x=>x.alive).map(x=>`${x.q},${x.r}`));
    for(const option of equipmentSkills(weapon).filter(x=>x.area==='arc'||x.area==='reach-arc')){
      if(actor.ap<attackApCost(weapon,battle,actor,option)||actor.fatigue+attackSkillFatigue(actor,weapon,option)>availableFatigue(actor))continue;
      const radius=option.area==='reach-arc'?2:1;
      const anchors=radius===1?hexNeighbors(battle.field,actor):[...new Map(hexNeighbors(battle.field,actor).flatMap(x=>hexNeighbors(battle.field,x)).filter(x=>hexDistance(actor,x)===2).map(x=>[`${x.q},${x.r}`,x])).values()];
      for(const anchor of anchors.filter(x=>!occupied.has(`${x.q},${x.r}`))){const candidate=areaAttackCandidate(state,actor,anchor,weapon,option);if(candidate)candidates.push(candidate);}
    }
  }
  const surrounded = enemies.filter(enemy => hexDistance(actor, enemy) <= 1).length >= 2;
  if (actor.equipment.shield && actor.shieldDurability > 0 && !actor.shieldWallActive && actor.fatigue + shieldSkillFatigue(actor) <= availableFatigue(actor)
    && (companyTactic !== 'offense' || surrounded)) {
    candidates.push({ id: 'shieldwall', type: 'shieldwall', apCost: 4, fatigueCost: shieldSkillFatigue(actor),
      preventedDamage: nearest <= 2 ? shieldDefenseFor(actor, actor.equipment.shield) * .8 : 0,
      bonus: actor.side==='enemy' && companyTactic==='shield-wall' && nearest>1 ? 60
        : companyTactic==='skirmish' && nearest<=7 ? 20
        : (battle.enemyAdaptiveRulesVersion===1 ? companyTactic : battle.tactic)==='shield-wall' && nearest<=2 ? 5 : -8 });
  }
  if (!actor.disarmedTurns && skillFamily === 'spear' && !actor.spearwallActive && spearwallUseful(battle, actor, enemies)
    && actor.fatigue + attackSkillFatigue(actor, weapon, battle.weaponCompletionVersion===1?equipmentSkills(weapon).find(x=>x.id==='spearwall'):COMBAT_SKILLS.spearwall) <= availableFatigue(actor))
    candidates.push({ id: 'spearwall', type: 'stance', apCost: attackApCost(weapon, battle, actor, battle.weaponCompletionVersion===1?equipmentSkills(weapon).find(x=>x.id==='spearwall'):COMBAT_SKILLS.spearwall), fatigueCost: attackSkillFatigue(actor, weapon, battle.weaponCompletionVersion===1?equipmentSkills(weapon).find(x=>x.id==='spearwall'):COMBAT_SKILLS.spearwall),
      preventedDamage: 18, bonus: actor.skillPreference === 'control' ? 14 : 3 });
  if (!actor.disarmedTurns && skillFamily === 'sword' && (battle.weaponCompletionVersion!==1||equipmentSkills(weapon).some(x=>x.id==='riposte')) && !actor.riposteActive
    && enemies.some(enemy => hexDistance(actor, enemy) === 1 && enemy.stunnedTurns === 0
      && !getItem(enemy.equipment.weapon)?.ranged)
    && !(companyTactic === 'offense' && actor.equipment.shield && actor.shieldDurability > 0
      && enemies.filter(enemy => hexDistance(actor, enemy) === 1).length >= 2)
    && actor.fatigue + attackSkillFatigue(actor, weapon, COMBAT_SKILLS.riposte) <= availableFatigue(actor))
    candidates.push({ id: 'riposte', type: 'stance', apCost: attackApCost(weapon, battle, actor, COMBAT_SKILLS.riposte), fatigueCost: attackSkillFatigue(actor, weapon, COMBAT_SKILLS.riposte),
      preventedDamage: 12, bonus: actor.skillPreference === 'control' ? 10 : -2 });
  if (!actor.disarmedTurns && skillFamily === 'two-handed-sword' && (battle.weaponCompletionVersion!==1||equipmentSkills(weapon).some(x=>x.id==='split'))) for (const ally of battle.units.filter(unit => unit.alive
    && unit.side === actor.side && unit.id !== actor.id && hexDistance(actor, unit) === 1)) {
    const option = battle.weaponCompletionVersion===1?equipmentSkills(weapon).find(x=>x.id==='split'):COMBAT_SKILLS.split;
    if (actor.ap < attackApCost(weapon, battle, actor, option) || actor.fatigue + attackSkillFatigue(actor, weapon, option) > actor.maxFatigue) continue;
    const candidate = areaAttackCandidate(state, actor, ally, weapon, option);
    if (candidate) candidates.push(candidate);
  }
  const targetPaths = enemies.map(target => {
    const priority = rangedAI ? tacticalTargetPriority(role,target,getItem(target.equipment.weapon),hexDistance(actor,target),nearest) : 0;
    const flanking = ['flanker','breaker'].includes(role) && priority>0 && nearest>1;
    return {target,priority,path:pathToTarget(battle,actor,target,range,weapon.ranged===true,flanking)};
  }).filter(entry=>roleRules(battle)?entry.path!==null:entry.path?.length).sort((a,b)=>(['flanker','breaker','skirmisher'].includes(role) ? b.priority-a.priority : 0)
    || pathCost(battle,actor,actor,a.path)-pathCost(battle,actor,actor,b.path)
    || b.priority-a.priority || a.target.id.localeCompare(b.target.id));
  const arrived=roleRules(battle)&&targetPaths.find(entry=>entry.target.id===actor.aiTargetId&&entry.path.length===0);
  const preferred=arrived&&arrived.priority>=(targetPaths[0]?.priority??0)?arrived:targetPaths[0];
  const specialFlank = ['flanker','breaker'].includes(role) && nearest>1 && preferred?.priority>0 ? preferred : null;
  const pursuit = (companyTactic === 'focus' && targetPaths.find(entry=>entry.target.id===battle.focusTargetId))
    || specialFlank || (role==='skirmisher' ? targetPaths[0] : targetPaths.find(entry=>entry.target.id===actor.aiTargetId)) || targetPaths[0];
  const formationLocked = companyTactic === 'advance-formation' && (actor.formationMovedRound === battle.round
    || sideInMeleeContact(battle) || battle.formationAdvance?.completedRound >= battle.round);
  const wallLocked = companyTactic==='skirmish' && !ammunitionSpent && skirmishFireSupport(state,actor.side)
    || (!rangedAI || !ammunitionSpent) && companyTactic === 'shield-wall' && (actor.side==='enemy'
      ? !weapon.ranged && actor.formationMovedRound===battle.round
      : actor.formationMovedRound===battle.round || battle.round - battle.lastContactRound < 4);
  for (const entry of formationLocked || wallLocked || nearbyTarget && !specialFlank || !pursuit || !pursuit.path.length ? [] : [pursuit]) {
    const point = entry.path[0];
    // Pursuit must respect the same rear-line boundary as reformation. A
    // reach fighter may leave shelter to acquire a target in reach, but not
    // step forward merely to be ordered back on its next turn.
    if(companyTactic==='shield-wall'&&!weapon.ranged&&actor.side==='company'&&!actor.ally&&!ammunitionSpent
      &&!hasShieldSet(actor)){
      const shields=battle.units.filter(u=>u.alive&&u.side==='company'&&!u.ally
        &&hasShieldSet(u)&&!companyArcherWeapon(state,u));
      if(shields.length&&point.q>=Math.max(...shields.map(u=>u.q))
        &&!enemies.some(enemy=>hexDistance(point,enemy)<=range))continue;
    }
    const apCost = battleMoveApCost(battle, actor, actor, point);
    const alliesOnTarget = battle.units.filter(unit => unit.alive && unit.side === actor.side && unit.id !== actor.id
      && hexDistance(unit, entry.target) <= 1).length;
    const adjacentThreats = enemies.filter(enemy => hexDistance(point, enemy) <= 1).length;
    candidates.push({ id: `move-${entry.target.id}`, type: 'move', targetId: entry.target.id, point, apCost,
      fatigueCost: movementFatigue(actor, battleMovementCost(battle, actor, actor, point)), bonus: 14 + ((rangedAI ? ammunitionSpent : noAmmo) ? 15 : 0) + (specialFlank && pursuit===specialFlank ? 35 : 0)
        + (companyTactic === 'advance-formation' || companyTactic === 'shield-wall' ? 20 : 0),
      spacingGain: weapon.ranged ? nearestEnemyDistance(battle, actor, point) - nearest : 0,
      flankGain: alliesOnTarget && hexDistance(point, entry.target) <= 1 && hexDistance(actor, entry.target) > 1 ? 1 : 0,
      incomingDamage: adjacentThreats * 4,
      blocksAlly: battle.units.some(unit => unit.alive && unit.side === actor.side && unit.id !== actor.id
        && hexDistance(unit, point) === 1 && hexDistance(unit, entry.target) > hexDistance(point, entry.target)) ? .2 : 0 });
  }
  if (weapon.ranged && nearest <= 1 && companyTactic !== 'advance-formation') {
    const retreat = archerRetreatOption(battle, actor, range);
    if (retreat) candidates.push({ id: 'retreat', type: 'move', point: retreat, apCost: battleMoveApCost(battle, actor, actor, retreat),
      fatigueCost: movementFatigue(actor, retreat.cost), preventedDamage: 8, spacingGain: retreat.safety - nearest, bonus: 28 });
  }
  if (actor.side==='enemy' && companyTactic==='shield-wall' && !weapon.ranged && nearest>1) {
    const wall=candidates.find(action=>action.type==='shieldwall');
    const advance=candidates.find(action=>action.type==='move' && action.targetId);
    // Do not spend every turn raising a shield when rough terrain leaves no AP to advance.
    if (wall && (!advance || wall.apCost+advance.apCost>actor.ap
      || wall.fatigueCost+advance.fatigueCost>actor.maxFatigue-actor.fatigue)) wall.bonus=-8;
  }
  if (actor.ap >= 9) candidates.push({ id: 'recover', type: 'recover', apCost: 9, fatigueCost: 0, bonus: actor.fatigue >= actor.maxFatigue * .55 ? 18 : -20 });
  if (companyTactic==='skirmish' && skirmishFireSupport(state,actor.side)) candidates.push({id:'skirmish-hold',type:'hold',apCost:0,fatigueCost:0,bonus:0});
  const offensive = action => (roleRules(battle)?['attack','area','charge','lunge']:['attack','area','charge']).includes(action.type);
  if(roleRules(battle))for(let i=candidates.length-1;i>=0;i--)if(!canAfford(battle,actor,candidates[i].apCost,candidates[i].fatigueCost)||candidates[i].legal===false)candidates.splice(i,1);
  const hitsAdjacentEnemy = action => offensive(action) && (action.targets ?? [action.target])
    .some(target => target.side !== actor.side && hexDistance(actor, target) === 1);
  const hitsFocus = action => offensive(action) && (action.targets ?? [action.target])
    .some(target => target.id === battle.focusTargetId);
  if (!weapon.ranged && candidates.some(action => action.type === 'attack' && action.apCost <= actor.ap && hexDistance(actor, action.target) === 1)) {
    for (let index = candidates.length - 1; index >= 0; index--) {
      if (offensive(candidates[index]) && !hitsAdjacentEnemy(candidates[index])) candidates.splice(index, 1);
    }
  }
  if (companyTactic === 'focus' && candidates.some(hitsFocus)) {
    for (let index = candidates.length - 1; index >= 0; index--) {
      if (offensive(candidates[index]) && !hitsFocus(candidates[index])) candidates.splice(index, 1);
    }
  }
  for (const action of candidates) if (action.targetId) {
    action.target ??= enemies.find(enemy=>enemy.id===action.targetId);
    if (action.target) {action.targetWeapon=getItem(action.target.equipment.weapon);action.targetDistance=hexDistance(actor,action.target);}
  }
  if (actor.skirmishReturn?.phase==='aim') {
    const path=skirmishReturnPath(battle,actor);
    let cost=0,fatigue=0,point=actor;
    for (const next of path??[]) {cost+=battleMoveApCost(battle,{...actor,movementCredit:0},point,next);
      fatigue+=movementFatigue(actor,battleMovementCost(battle,actor,point,next));point=next;}
    const canReturn=action=>offensive(action) && action.apCost+cost<=actor.ap
      && action.fatigueCost+fatigue<=tacticalFatigueLimit(battle,actor)-actor.fatigue;
    if (path && candidates.some(canReturn)) for (let i=candidates.length-1;i>=0;i--)
      if (offensive(candidates[i]) && !canReturn(candidates[i])) candidates.splice(i,1);
  }
  const ranked = rankTacticalActions(battle.weaponCompletionVersion===1?{...actor,maxFatigue:availableFatigue(actor)}:actor, candidates, { role, targetPriorities:rangedAI, nearestDistance:nearest, tactic: battle.enemyTacticsVersion === 1 ? companyTactic : battle.tactic, focusTargetId: battle.enemyTacticsVersion === 1 && actor.side === 'enemy' ? null : battle.focusTargetId,
    previousTargetId: enemies.some(enemy => enemy.id === actor.aiTargetId) ? actor.aiTargetId : null });
  const permittedExceptions = ranked.filter(entry => entry.type === 'area' && entry.safety.exception)
    .sort((a, b) => compareAreaSafety(a.safety, b.safety));
  if (permittedExceptions.length) for (const entry of ranked) if (entry.type === 'area' && entry.safety.exception
    && entry !== permittedExceptions[0]) entry.score = -Infinity;
  ranked.sort((a, b) => b.score - a.score || a.candidateIndex - b.candidateIndex);
  const choice = ranked[0];
  if (!choice || choice.score < -10) {
    actor.ap = 0;
    const message = `${actor.name} holds position.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, equipped);
    battleLog(battle, message);
  } else if (choice.type === 'charge') {
    performHorseCharge(state, actor, choice.target, weapon, choice.plan);
  } else if (choice.type === 'lunge') {
    const from={q:actor.q,r:actor.r};actor.aiTargetId=choice.target.id;clearWeaponStances(actor);Object.assign(actor,choice.plan.point);
    const interception=spearwallReactionsOnMove(state,actor,from);
    if(interception.blocked||!actor.alive){actor.ap=Math.max(0,actor.ap-choice.apCost);actor.fatigue=Math.min(actor.maxFatigue,actor.fatigue+choice.fatigueCost);const message=`${actor.name}'s lunge is stopped by Spearwall.`;battle.lastEvent=makeBattleEvent(actor,choice.target,'hold',message,weapon,null,{skillName:'Lunge',moveFrom:from,reactions:interception.reactions});battleLog(battle,message);}
    else {attackTarget(state,actor,choice.target,weapon,choice.plan.option);battle.lastEvent.moveFrom=from;if(interception.reactions.length)battle.lastEvent.reactions=interception.reactions;wolfFollowup(state,actor,choice.target);wargHowl(state,actor);}
  } else if (choice.type === 'hold') {
    actor.ap=0;actor.fatigue=Math.max(0,actor.fatigue-12);
    const message=`${actor.name} holds the skirmish line.`;
    battle.lastEvent=makeBattleEvent(actor,null,'hold',message,equipped);battleLog(battle,message);
  } else if (choice.type === 'attack') {
    if (actor.skirmishReturn) actor.skirmishReturn.phase='return';
    actor.aiTargetId = choice.target.id;
    const option = choice.option ?? (choice.id === 'aimed-shot' ? COMBAT_SKILLS['aimed-shot']
      : isBow(weapon) ? COMBAT_SKILLS['quick-shot'] : null);
    const impact = attackTarget(state, actor, choice.target, weapon, option);
    if (option?.id === 'hook' && impact.hit && choice.target.alive) {
      const destination = hookDestination(battle, actor, choice.target);
      if (destination) {
        const from = { q: choice.target.q, r: choice.target.r };
        choice.target.q = destination.q; choice.target.r = destination.r;
        clearWeaponStances(choice.target);
        battle.lastEvent.pushedFrom = from;
        battle.lastEvent.to = { q: destination.q, r: destination.r };
      }
    }
    if(option?.push&&impact.hit&&choice.target.alive){const destination=knockBackDestination(battle,actor,choice.target);if(destination){const from={q:choice.target.q,r:choice.target.r};Object.assign(choice.target,destination);clearWeaponStances(choice.target);choice.target.shieldWallActive=false;battle.lastEvent.pushedFrom=from;battle.lastEvent.to={...destination};}}
    if (retreatFrom) battle.lastEvent.moveFrom = retreatFrom;
    if(!option?.noDamage){wolfFollowup(state, actor, choice.target);wargHowl(state, actor);}
  } else if (choice.type === 'area') {
    actor.aiTargetId = choice.target.id;
    const option = battle.weaponCompletionVersion===1?equipmentSkills(weapon).find(x=>x.id===choice.id):COMBAT_SKILLS[choice.id];
    const deferredKills = { kills: 0 };
    const chances = new Map(choice.targets.map(target => [target.id,
      attackHitChance(battle, actor, target, weapon, option.hitBonus ?? 0, option)]));
    const shields = new Map(choice.targets.map(target => [target.id, Boolean(target.equipment.shield && target.shieldDurability > 0)]));
    const affectedTargets = [];
    let primaryEvent = null;
    for (const target of choice.targets) {
      if (!target.alive) continue;
      const impact = attackTarget(state, actor, target, weapon,
        { ...option, areaAction: true, areaFollowup: target !== choice.targets[0], deferKillPerks: deferredKills,
          chanceOverride: chances.get(target.id), shieldWasUsable: shields.get(target.id) });
      const event = battle.lastEvent;
      affectedTargets.push({ id: target.id, hit: impact.hit, hpDamage: impact.hpDamage, armorDamage: impact.armorDamage,
        shieldDamage: impact.shieldDamage, head: impact.head, fallen: impact.fallen });
      if (target === choice.areaAnchor) primaryEvent = event;
    }
    battle.lastEvent = primaryEvent ?? battle.lastEvent;
    battle.lastEvent.affectedTargets = affectedTargets;
    if (deferredKills.kills) {
      const procs = [], effects = [];
      if (hasPerk(actor, 'battle-flow')) {
        const recovered = Math.min(actor.fatigue, 10 * deferredKills.kills);
        actor.fatigue -= recovered;
        procs.push(`Battle Flow: -${recovered} fatigue.`);
        effects.push({ id: 'battle-flow', amount: recovered });
      }
      if (hasPerk(actor, 'killing-frenzy')) {
        actor.frenzyUntilRound = battle.round + 2;
        procs.push('Killing Frenzy: +25% damage.');
        effects.push({ id: 'killing-frenzy', amount: 25 });
      }
      if (hasPerk(actor, 'berserk') && actor.berserkRound !== battle.round) {
        actor.ap += 4;
        actor.berserkRound = battle.round;
        procs.push('Berserk: +4 AP.');
        effects.push({ id: 'berserk', amount: 4 });
      }
      if (procs.length) {
        battle.lastEvent.effects = effects;
        battle.lastEvent.message += ` ${procs.join(' ')}`;
        battleLog(battle, procs.join(' '));
      }
    }
    if (choice.safety.exception) {
      battle.lastEvent.friendlyFire = affectedTargets.some(impact => impact.hit
        && choice.targets.some(target => target.id === impact.id && target.side === actor.side));
      battle.lastEvent.message += ' A necessary finishing strike risks friendly fire.';
      battleLog(battle, 'A necessary finishing strike risks friendly fire.');
    }
    wolfFollowup(state, actor, choice.target);
    wargHowl(state, actor);
  } else if (choice.type === 'stance') {
    actor.ap -= choice.apCost;
    actor.fatigue += choice.fatigueCost;
    actor[choice.id === 'spearwall' ? 'spearwallActive' : 'riposteActive'] = true;
    const message = `${actor.name} prepares ${COMBAT_SKILLS[choice.id].name}.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, equipped, null, { skillName: COMBAT_SKILLS[choice.id].name });
    battleLog(battle, message);
  } else if (choice.type === 'knock-back') {
    actor.aiTargetId = choice.target.id;
    const chance = attackHitChance(battle, actor, choice.target, { ...weapon, ranged: false });
    actor.ap -= 4;
    actor.fatigue += choice.fatigueCost;
    const hit = battleRoll(battle) * 100 < chance;
    const from = { q: choice.target.q, r: choice.target.r };
    if (hit) { choice.target.q = choice.push.q; choice.target.r = choice.push.r; clearWeaponStances(choice.target); }
    const message = `${actor.name} ${hit ? 'knocks back' : 'fails to knock back'} ${choice.target.name}.`;
    battle.lastEvent = makeBattleEvent(actor, choice.target, hit ? 'move' : 'miss', message, equipped, null,
      { skillName: COMBAT_SKILLS['knock-back'].name, ...(hit ? { pushedFrom: from } : {}) });
    battleLog(battle, message);
  } else if (choice.type === 'shieldwall') {
    actor.ap -= 4;
    actor.fatigue += choice.fatigueCost;
    actor.shieldWallActive = true;
    const message = `${actor.name} raises a shieldwall.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, equipped, null, { skillName: COMBAT_SKILLS.shieldwall.name });
    battleLog(battle, message);
  } else if (choice.type === 'move') {
    const from = { q: actor.q, r: actor.r };
    actor.q = choice.point.q; actor.r = choice.point.r;
    actor.ap -= choice.apCost;
    actor.fatigue = Math.min(actor.maxFatigue, actor.fatigue + choice.fatigueCost);
    consumeMovementCredit(battle, actor, from, actor);
    const interception = spearwallReactionsOnMove(state, actor, from);
    if (!interception.blocked && choice.targetId) actor.aiTargetId = choice.targetId;
    if (!interception.blocked && (companyTactic === 'advance-formation' || companyTactic === 'shield-wall')) actor.formationMovedRound = battle.round;
    if (!interception.blocked && actor.side==='company' && !actor.ally && companyTactic === 'shield-wall') battle.formationAdvance = makeFormationAdvancePlan(battle);
    const message = interception.blocked ? `${actor.name} is stopped by Spearwall.` : `${actor.name} moves across the field.`;
    battle.lastEvent = makeBattleEvent(actor, null, interception.blocked ? 'hold' : 'move', message, equipped, from,
      interception.reactions.length ? { reactions: interception.reactions } : {});
    battleLog(battle, message);
  } else {
    actor.ap = 0;
    actor.fatigue = hasPerk(actor, 'recover') ? Math.max(0, actor.fatigue - Math.max(22, Math.ceil(actor.fatigue / 2))) : Math.max(0, actor.fatigue - 22);
    const message = `${actor.name} catches their breath.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equipped);
    battleLog(battle, message);
  }
  if (retreatReactions.length) battle.lastEvent.reactions = [...retreatReactions, ...(battle.lastEvent.reactions ?? [])];
  if (!finishBattlePhase(battle) && (actor.ap <= 0 || !actor.alive)) nextBattleTurn(battle);
  return result(true, battle.lastEvent.message);
}

export function advanceBattle(state) {
  const battle = state.battle;
  if (!battle || battle.status !== 'active') return result(false, 'There is no active battle.');
  if (battle.rulesVersion === 2) {
    if (updateEnemyTactic(battle,getItem,state.supplies.ammo)) battleLog(battle,`Enemy tactic changes to ${enemyBattleTactic(battle,getItem)}.`);
    return advanceBattleV2(state);
  }
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
  if (useBattleAccessory(state, actor, enemies)) {
    return result(true, battle.lastEvent.message);
  }
  const formationCompanyCount = battle.units.filter(unit => unit.alive && unit.side === 'company' && !unit.ally).length;
  const formationMoveFrom = battle.tactic === 'advance-formation' && !actor.ally && formationCompanyCount > 1 ? advanceFormationStep(battle, actor) : null;
  if (readyShieldWallSet(state, actor)) return result(true, battle.lastEvent.message);
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
  const fatigueWeapon = equippedWeapon?.ranged && !battleWeaponHasAmmo(state, actor, equippedWeapon) ? null : equippedWeapon;
  if (actor.fatigue + attackFatigueCost(actor, fatigueWeapon) > actor.maxFatigue) {
    const tiredWallMove = battle.tactic === 'shield-wall' && battle.round - battle.lastContactRound >= 4
      ? advanceFormationStep(battle, actor) : null;
    if (tiredWallMove) {
      actor.ap = 0;
      const message = `${actor.name} advances with the shield wall.`;
      battle.lastEvent = makeBattleEvent(actor, null, 'move', message, equippedWeapon, tiredWallMove);
      battleLog(battle, message);
      nextBattleTurn(battle);
      return result(true, message);
    }
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
  const bowWithoutAmmo = equippedWeapon?.ranged && !equippedWeapon.throwing && actor.side === 'company' && state.supplies.ammo < 1;
  const throwingWithoutAmmo = equippedWeapon?.throwing && (actor.throwingAmmo?.active ?? 0) < 1;
  const weapon = bowWithoutAmmo || throwingWithoutAmmo ? { damageMin: 8, damageMax: 12, hitBonus: -12, armorDamage: .4, range: 1 } : equippedWeapon ?? { damageMin: 8, damageMax: 12, hitBonus: -10, armorDamage: .4, range: 1 };
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
  const vulnerability = target => target.hp + (target.bodyArmor + target.attachmentArmor + (target.attachment2Armor??0) + target.headArmor) * .15 + target[defenseKey] * .3;
  const targets = enemies.map(target => ({ target, path: pathToTarget(battle, actor, target, range, weapon.ranged === true) }))
    .filter(entry => entry.path !== null)
    .sort((a, b) => pathCost(battle, actor, actor, a.path) - pathCost(battle, actor, actor, b.path)
      || vulnerability(a.target) - vulnerability(b.target)
        - (weapon.ranged ? rangedTerrainModifier(battle, actor, actor, a.target)
          - rangedTerrainModifier(battle, actor, actor, b.target) : 0)
      || hexDistance(actor, a.target) - hexDistance(actor, b.target) || a.target.id.localeCompare(b.target.id));
  if (actor.side === 'company' && battle.focusTargetId && !enemies.some(enemy => enemy.id === battle.focusTargetId)) battle.focusTargetId = null;
  const companyTactic = actor.side === 'company' && !actor.ally ? battle.tactic : actor.side === 'enemy' ? enemyBattleTactic(battle,getItem) : 'offense';
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
    const plan = battle.formationAdvance;
    const direction = plan && FORMATION_DIRECTIONS[plan.direction];
    const planned = direction && { q: actor.q + direction[0], r: actor.r + direction[1] };
    const origin = plan?.origins[actor.id];
    const reached = origin && direction && actor.q === origin.q + direction[0] && actor.r === origin.r + direction[1];
    const livingCompany = battle.units.filter(unit => unit.alive && unit.side === 'company' && !unit.ally);
    if (!formationMoveFrom && livingCompany.length === 1 && choice.path.length && plan.completedRound < battle.round) {
      const movementRound = battle.round;
      moveOneFormationHex(battle, actor, choice.path[0], `${actor.name} advances around the obstacle.`);
      battle.formationAdvance = makeFormationAdvancePlan(battle);
      battle.formationAdvance.completedRound = movementRound;
      return result(true, battle.lastEvent.message);
    }
    if (!formationMoveFrom && !reached && choice.path.length && planned && plan.completedRound < battle.round) {
      const movementRound = battle.round;
      moveOneFormationHex(battle, actor, choice.path[0], `${actor.name} routes around impassable trees.`);
      battle.formationAdvance = makeFormationAdvancePlan(battle);
      battle.formationAdvance.completedRound = movementRound;
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
  if (actor.side === 'company' && companyTactic === 'shield-wall' && choice
    && battle.units.filter(unit => unit.alive && unit.side === 'company' && !unit.ally).length > 1) {
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
    const shields = battle.units.filter(unit => unit.alive && unit.side === 'company' && !unit.ally && hasShieldSet(unit));
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
    const livingCompany = battle.units.filter(unit => unit.alive && unit.side === 'company' && !unit.ally);
    const wallPlan = battle.formationAdvance;
    const wallDirection = wallPlan && FORMATION_DIRECTIONS[wallPlan.direction];
    const wallReached = unit => wallDirection && wallPlan.origins[unit.id]
      && unit.q === wallPlan.origins[unit.id].q + wallDirection[0] * wallPlan.step
      && unit.r === wallPlan.origins[unit.id].r + wallDirection[1] * wallPlan.step;
    if (timedAdvance && !wallReached(actor) && choice.path.length) {
      const movementRound = battle.round;
      moveOneFormationHex(battle, actor, choice.path[0], `${actor.name} routes around impassable trees.`);
      battle.formationAdvance = makeFormationAdvancePlan(battle);
      battle.formationAdvance.completedRound = movementRound;
      return result(true, battle.lastEvent.message);
    }
    if (timedAdvance && wallReached(actor) && livingCompany.some(unit => !wallReached(unit)) && choice.path.length) {
      moveOneFormationHex(battle, actor, choice.path[0], `${actor.name} opens a path for the shield wall.`);
      battle.formationAdvance = makeFormationAdvancePlan(battle);
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
    if (actor.side==='company' && !actor.ally && companyTactic === 'shield-wall') battle.formationAdvance = makeFormationAdvancePlan(battle);
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
  for (let turn = 0; turn < (state.battle.rulesVersion === 2 ? 2000 : 500) && state.battle.status === 'active'; turn++) advanceBattle(state);
  return state.battle.status === 'active' ? result(false, 'The battle is still underway.') : result(true, `Battle ended in ${state.battle.status}.`);
}

export function retreatBattle(state) {
  const battle = state.battle;
  if (!battle || battle.status !== 'active') return result(false, 'There is no active battle.');
  battle.status = 'retreat';
  battle.activeId = null;
  battle.casualties = battle.units.filter(unit => unit.side === 'company' && !unit.ally && !unit.alive).map(unit => unit.id);
  state.food = Math.max(0, state.food - 2);
  for (const unit of battle.units.filter(entry => entry.side === 'company' && !entry.ally && entry.alive)) {
    unit.hp = Math.max(1, unit.hp - 5);
    if (!isMoraleImmune(unit)) unit.morale = Math.max(0, unit.morale - moraleDamage(unit, 12));
  }
  battle.lastEvent = makeBattleEvent(null, null, 'retreat', 'The company retreats, losing two provisions and taking wounds.');
  battleLog(battle, battle.lastEvent.message);
  return result(true, battle.lastEvent.message);
}

// Loot is quoted against the nearest real market, using exactly the same sale rules as the trader.
export function getLootShareQuote(state, indices = []) {
  const battle = state.battle;
  if (battle?.status !== 'victory' || !Array.isArray(indices) || indices.length > battle.loot.items.length
    || new Set(indices).size !== indices.length || [...indices].some(index => !Number.isSafeInteger(index) || index < 0 || index >= battle.loot.items.length)) return null;
  const marketTown = [...SETTLEMENTS].sort((a, b) => Math.hypot(a.x - state.position.x, a.y - state.position.y)
    - Math.hypot(b.x - state.position.x, b.y - state.position.y) || a.id.localeCompare(b.id))[0];
  const survivors = battle.units.filter(unit => unit.side === 'company' && !unit.ally && unit.alive
    && state.party.some(person => person.id === unit.id));
  const prices = battle.loot.items.map(id => equipmentPrices(state, marketTown, getItem(id)).sellPrice);
  const value = indices.reduce((sum, index) => sum + prices[index], 0);
  const count = survivors.length;
  const xpPool = Math.ceil(value / 20);
  const xp = value && count ? Math.min(500, Math.ceil(xpPool / count)) : 0;
  const morale = value && count ? Math.min(15, Math.ceil(value / (25 * count))) : 0;
  return { townId: marketTown.id, townName: marketTown.name, prices, value, count, xpPool, xp, morale, selectedCount: indices.length };
}

// The loot screen selects copies to keep; donation always uses the exact complement.
export function getLootKeepQuote(state, keepIndices = []) {
  if (!getLootShareQuote(state, keepIndices)) return null;
  const kept = new Set(keepIndices);
  const donateIndices = state.battle.loot.items.map((_, index) => index).filter(index => !kept.has(index));
  return { ...getLootShareQuote(state, donateIndices), keepIndices: [...keepIndices], donateIndices };
}

export function finishBattle(state, { shareLootIndices = [] } = {}) {
  const battle = state.battle;
  if (!battle || battle.status === 'active') return result(false, 'Finish the fight before claiming its result.');
  const victory = battle.status === 'victory';
  if (!Array.isArray(shareLootIndices) || !victory && shareLootIndices.length) return result(false, 'Only victory spoils can be shared.');
  const sharing = victory ? getLootShareQuote(state, shareLootIndices) : null;
  if (victory && !sharing) return result(false, 'Choose valid, distinct spoils to share.');
  const shared = new Set(shareLootIndices);
  const crisisWasComplete = state.ashenWinter?.phase === 'completed';
  const undeadEncounter = UNDEAD_TYPES.includes(battle.encounterType) ? getUndeadEncounters(state).find(e => e.id === battle.campId) : null;
  const formation = getFormation(state);
  const survivors = [];
  for (const person of state.party) {
    const unit = battle.units.find(entry => entry.id === person.id);
    if (!unit) {awardExperience(person,getBattleExperience(state,person.id));survivors.push(person);continue;}
    const battleAmmo = unit.throwingAmmo ?? {
      active: throwingCapacity(unit.equipment.weapon),
      reserve: throwingCapacity(unit.reserveEquipment?.weapon),
    };
    const throwingAmmo = unit.battleSetSwapped
      ? { active: battleAmmo.reserve, reserve: battleAmmo.active }
      : { active: battleAmmo.active, reserve: battleAmmo.reserve };
    const activeShieldCondition = unit.battleSetSwapped ? unit.reserveShieldDurability : unit.shieldDurability;
    const reserveShieldCondition = unit.battleSetSwapped ? unit.shieldDurability : unit.reserveShieldDurability;
    const carriedAccessories = [...unit.accessories];
    if (unit.pocketDrawnFrom !== null) carriedAccessories[unit.pocketDrawnFrom] = unit.equipment.weapon;
    if (!unit.alive) {
      if (victory) {
        for (const [itemId, condition] of [
          ...SLOTS.map(slot => [person.equipment[slot], slot === 'armor' ? unit.bodyArmor : slot === 'attachment' ? unit.attachmentArmor : slot==='attachment2'?unit.attachment2Armor??person.armorDurability.attachment2 : slot === 'helmet' ? unit.headArmor : slot === 'shield' ? activeShieldCondition : slot === 'weapon' && getItem(person.equipment.weapon)?.throwing ? throwingAmmo.active : null]),
          ...['weapon', 'shield'].map(slot => [person.reserveEquipment[slot], slot === 'shield' ? reserveShieldCondition : slot === 'weapon' && getItem(person.reserveEquipment.weapon)?.throwing ? throwingAmmo.reserve : null]),
          ...carriedAccessories.map(id => [id, null]),
        ]) {
          if (itemId && state.inventory.length < getStashCapacity(state)) {
            state.inventory.push(itemId);
            state.inventoryCondition.push(condition);
          }
        }
      }
      continue;
    }
    person.hp = unit.hp;
    person.morale = Math.min(100, unit.morale + (isMoraleImmune(unit) ? 0 : sharing?.morale ?? 0));
    person.accessories = carriedAccessories;
    person.throwingAmmo = throwingAmmo;
    person.armorDurability = { body: unit.bodyArmor, attachment: unit.attachmentArmor, attachment2:unit.attachment2Armor??person.armorDurability.attachment2, head: unit.headArmor,
      shield: activeShieldCondition, reserveShield: reserveShieldCondition };
    awardExperience(person,getBattleExperience(state,person.id)+(sharing?.xp??0));
    survivors.push(person);
  }
  state.party = survivors;
  const survivingIds = new Set(survivors.map(person => person.id));
  state.formation = formation.map(id => survivingIds.has(id) ? id : null);
  state.reserveIds=getReserveSlots(state).map(id=>survivingIds.has(id)?id:null);
  if (victory) {
    const loot = battle.loot;
    state.gold = Math.min(1000000000,state.gold+getBattleLootGold(state));
    state.food += loot.food;
    for (const kind of ['tools', 'medicine', 'ammo']) state.supplies[kind] += loot[kind];
    for (let index = 0; index < loot.items.length; index++) {
      if (shared.has(index)) continue;
      if (state.inventory.length >= getStashCapacity(state)) break;
      const itemId = loot.items[index];
      state.inventory.push(itemId);
      state.inventoryCondition.push(loot.itemConditions?.[index] ?? itemCondition(itemId));
    }
    if (undeadEncounter) resolveAshenObjective(state, undeadEncounter, ashenContext(state));
    else if (battle.encounterType === 'band') {
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
    else if(['deserters','bounty'].includes(battle.encounterType)){
      if(state.contract?.type===battle.encounterType&&state.contract.deserterId===battle.campId){
        const captured=battle.encounterType!=='bounty'||battle.units.some(unit=>unit.champion&&!unit.alive&&!unit.escaped);
        state.contract.defeated=captured;
        if(!captured)record(state,'The wanted champion escaped with their trophy. The contract remains open; hunt them again before returning for payment.');
      }
    }
    else if (battle.encounterType === 'rescue') {
      if (state.contract?.type === 'rescue' && state.contract.rescueId === battle.campId) state.contract.rescued = true;
    }
    else { const camp=getCampSites(state).find(site=>site.id===battle.campId); state.camps[battle.campId] = { clearedDay:state.day,respawnAt:worldHours(state)+(camp.random?72:120),generation:camp.generation }; }
  }
  if (!victory && undeadEncounter) {
    const remaining = battle.units.filter(u => u.side === 'enemy' && u.alive);
    recordAshenCasualties(state, battle.campId, remaining.map(u => u.troopIndex), Object.fromEntries(remaining.map(u => [u.troopIndex, { hp: u.hp, bodyArmor: u.bodyArmor, headArmor: u.headArmor, shieldDurability: u.shieldDurability }])));
  }
  if(battle.patrolAssist){
    const a=battle.patrolAssist,p=state.factionPatrols[a.id],definition=patrolDefinitions(SETTLEMENTS).find(d=>d.id===a.id);
    p.troops=a.troops.filter((_,i)=>battle.units.find(u=>u.id===`ally-${i+1}`)?.alive);
    p.cooldownUntil=worldHours(state)+6;p.targetId=null;p.behavior=p.troops.length?'touring':'reforming';
    if(!p.troops.length){p.defeatedUntil=worldHours(state)+72;p.x=definition.home.x;p.y=definition.home.y;}
    p[victory?'wins':'losses']++;
    state.factionReports.push({patrolId:a.id,factionId:definition.factionId,opponentId:battle.campId,opponentName:battle.encounterName,kind:battle.encounterType==='band'?'band':'undead-host',outcome:victory?'victory':'defeat',losses:a.troops.length-p.troops.length,hour:worldHours(state)});
    state.factionReports=state.factionReports.slice(-24);
    if(!victory&&battle.encounterType==='band'){
      const enemyUnits=battle.units.filter(u=>u.side==='enemy');
      const survivors=a.enemyTroops.filter((_,i)=>enemyUnits[i].alive||enemyUnits[i].escaped);
      // No casualties means no casualty record. Preserve any earlier losses;
      // a full roster recorded as survivors is deliberately invalid on import.
      if(survivors.length&&survivors.length<a.enemyTroops.length){
        const previous=state.worldLosses[battle.campId];
        state.worldLosses[battle.campId]={cycle:state.bands[battle.campId].spawnCycle,
          size:Math.max(previous?.size??0,...a.enemyTroops.map(i=>i+1)),survivors};
      }else if(!survivors.length){
        delete state.worldLosses[battle.campId];
        const band=state.bands[battle.campId];
        Object.assign(band,{defeatedUntil:worldHours(state)+48,spawnCycle:band.spawnCycle+1,behavior:'patrolling',targetId:null});
      }
    }
  }
  refillThrowingAmmo(state);
  state.gameOver = state.party.length === 0;
  state.encounterGraceUntil = Math.max(state.encounterGraceUntil ?? 0, worldHours(state) + ENCOUNTER_GRACE_HOURS);
  if (!victory && battle.encounterType === 'band' && state.bands[battle.campId]) {
    state.bands[battle.campId].behavior = 'patrolling';
    state.bands[battle.campId].targetId = null;
  }
  let message = victory ? `The company claims ${battle.loot.gold} crowns and defeats ${battle.encounterName}.` : state.gameOver ? 'The company has fallen.' : 'The company survives and leaves the battlefield behind.';
  if (sharing?.selectedCount) record(state, `Shared ${sharing.selectedCount} spoils worth ${sharing.value} crowns at ${sharing.townName}: each surviving brother receives ${sharing.xp} XP and up to ${sharing.morale} morale.`);
  if (!crisisWasComplete && state.ashenWinter?.phase === 'completed') message += ' Ashen Winter ends: all settlements are free. Claim your equipment reward in the journal.';
  record(state, message);
  state.battle = null;
  for(const fight of [...(state.worldSkirmishes??[])])if(fight.bKind==='undead-host'&&!state.ashenWinter?.hosts[fight.bId])cancelWorldSkirmish(state,fight.aId);
  mergeOwnedNamedBonuses(state);
  applyCompanyAutomation(state);
  return result(true, message);
}

function assert(condition, message) { if (!condition) throw new TypeError(`Invalid save: ${message}`); }
function validCount(value) { return Number.isSafeInteger(value) && value >= 0; }
function validPoint(point) { return point && typeof point === 'object' && !Array.isArray(point) && inBounds(point.x, point.y); }
function recordObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function validHex(point, field) { return recordObject(point) && Number.isSafeInteger(point.q) && point.q >= 0 && point.q < field.columns && Number.isSafeInteger(point.r) && point.r >= 0 && point.r < field.rows; }
function passableHex(point, field) { return validHex(point, field) && !blockedTerrain(tileAt(field, point.q, point.r)?.terrain); }

function validateBattleField(input) {
  if (input === undefined) return legacyBattleField();
  assert(recordObject(input) && (input.columns === 22 && input.rows === 24 || input.columns === 14 && [8, 16].includes(input.rows) || input.columns === 10 && input.rows === 5), 'battle field size');
  assert(['plains', 'forest', 'mountain', 'marsh', 'snow', 'desert'].includes(input.biome), 'battle field biome');
  assert(Array.isArray(input.tiles) && input.tiles.length === input.columns * input.rows, 'battle field tiles');
  const tiles = input.tiles.map((tile, index) => {
    const q = Math.floor(index / input.rows);
    const r = index % input.rows;
    assert(recordObject(tile) && tile.q === q && tile.r === r && ['open', 'trees', 'brush', 'mud', 'rock', 'dense-trees', 'palisade'].includes(tile.terrain) && Number.isSafeInteger(tile.height) && tile.height >= 0 && tile.height <= 2, 'battle field tile');
    return { q, r, terrain: tile.terrain, height: tile.height };
  });
  return { columns: input.columns, rows: input.rows, biome: input.biome, tiles };
}

function validateBattle(input, party, worldState) {
  if (input === undefined || input === null) return null;
  const encounterType = input.encounterType ?? 'camp';
  const undead = UNDEAD_TYPES.includes(encounterType) ? getUndeadEncounters(worldState).find(e => e.id === input.campId && e.kind === encounterType) : null;
  assert(recordObject(input) && (encounterType === 'camp' ? isCampId(input.campId) : encounterType === 'band' ? BAND_BY_ID.has(input.campId)
    : undead || ['rescue','deserters','bounty'].includes(encounterType) && worldState.contract?.type===encounterType && getQuestEncounter(worldState)?.id === input.campId), 'battle encounter');
  const encounter = undead ?? (encounterType === 'band' ? BAND_BY_ID.get(input.campId) : ['rescue','deserters','bounty'].includes(encounterType) ? getQuestEncounter(worldState)
    : getCampSites(worldState).find(camp=>camp.id===input.campId));
  if (undead) assert(recordObject(input.crisisContext) && input.crisisContext.crisisId === worldState.ashenWinter.crisisId && input.crisisContext.frontId === undead.frontId && input.crisisContext.townId === undead.townId && input.crisisContext.forceSeed === undead.force.seed && input.crisisContext.generation === undead.force.generation, 'crisis battle context');
  else assert(input.crisisContext === undefined, 'unexpected crisis context');
  const patrolAssist=input.patrolAssist;
  if(patrolAssist!==undefined){
    const d=patrolDefinitions(SETTLEMENTS).find(d=>d.id===patrolAssist?.id),p=d&&worldState.factionPatrols[d.id];
    assert(recordObject(patrolAssist)&&Object.keys(patrolAssist).sort().join(',')==='cycle,enemyTroops,id,troops'&&d&&getFactionPatrols(worldState).find(a=>a.id===d.id)?.playerRelation==='ally'
      &&['band','undead-host'].includes(encounterType)&&p.spawnCycle===patrolAssist.cycle&&JSON.stringify(p.troops)===JSON.stringify(patrolAssist.troops)
      &&Array.isArray(patrolAssist.enemyTroops)&&patrolAssist.enemyTroops.length>0&&new Set(patrolAssist.enemyTroops).size===patrolAssist.enemyTroops.length
      &&patrolAssist.enemyTroops.every(i=>validCount(i)&&i<(encounterType==='band'?20:undead.force.size)),'battle patrol assistance');
  }
  if(patrolAssist){
    const current=encounterType==='band'?getRoamingBands(worldState).find(b=>b.id===input.campId)?.enemies:undead.enemies;
    assert(JSON.stringify(patrolAssist.enemyTroops)===JSON.stringify(current?.map(e=>e.worldIndex??e.troopIndex))
      &&input.units?.filter(u=>u.side==='enemy').length===patrolAssist.enemyTroops.length,'battle patrol enemy roster');
  }
  const encounterName = input.encounterName ?? encounter.name;
  if(input.enemyOpening!==undefined)assert(typeof input.enemyOpening==='boolean'&&(!input.enemyOpening||encounterType==='band'),'enemy opening');
  const difficulty = input.difficulty ?? encounter.difficulty ?? 0;
  assert(Number.isSafeInteger(difficulty) && difficulty >= 0 && difficulty <= 3, 'battle difficulty');
  const campGeneration = input.campGeneration ?? (encounterType === 'camp' ? encounter.generation : null);
  assert(encounterType === 'camp' ? validCount(campGeneration) && campGeneration <= 1000000 && campGeneration === encounter.generation : campGeneration === null, 'battle camp generation');
  assert(input.enemyTacticsVersion===undefined||input.enemyTacticsVersion===1,'battle enemy tactic rules');
  assert(input.lighting===undefined||['day','evening','night','dawn'].includes(input.lighting),'battle lighting');
  assert(input.roleConsistencyVersion===undefined||input.roleConsistencyVersion===1,'battle role consistency rules');
  assert(input.weaponCompletionVersion===undefined||input.weaponCompletionVersion===1,'battle completed weapon rules');
  assert(input.weaponAuditVersion===undefined||input.weaponAuditVersion===1,'battle weapon audit rules');
  assert(input.attachmentRulesVersion===undefined||input.attachmentRulesVersion===1,'battle attachment rules');
  assert(input.championRulesVersion===undefined||input.championRulesVersion===1,'battle champion rules');
  const discovery=input.championRulesVersion===1?discoveryBonuses(worldState,encounter):{famed:0,mount:0};
  const famedDrop = input.famedDrop ?? null;
  const famedItem = getItem(famedDrop);
  const famedSeed = hashSeed(`${worldState.seed}:${encounter.id}:${campGeneration}:famed-item`);
  const famedRoll = hashSeed(`${worldState.seed}:${encounter.id}:${campGeneration}:famed-roll`) % 10000;
  assert(famedDrop === null || encounterType === 'camp' && ['famed','named'].includes(famedItem?.rarity)
    && famedBasesForCamp({...encounter,difficulty})?.includes(famedItem.baseId)
    && (famedDrop === createFamedItemId(famedItem.baseId, famedSeed)||famedDrop===createFamedItemId(famedItem.baseId,famedSeed,2)||famedDrop===createFamedItemId(famedItem.baseId,famedSeed,3)||famedDrop===`famed:${famedItem.baseId}:${famedSeed}`)
    && famedRoll < ((FAMED_CHANCES[difficulty] ?? 0)+discovery.famed/100) * 10000, 'battle famed drop');
  const previousRegionalCampName=encounterType==='camp'&&/^wild-camp-/.test(encounter.id)?worldCampText(encounter.x,encounter.y,encounter.enemies.length,Number(encounter.id.slice(10))-1).name:null;
  const legacyCampName = encounterType==='camp' && /^wild-camp-/.test(encounter.id) ? getRegionalCampText(authoredPoint(encounter).x,authoredPoint(encounter).y,difficulty,1,Number(encounter.id.slice(10))-1).name : null;
  const mountReward=input.mountReward ?? null;
  assert(mountReward===null || encounterType==='camp' && MOUNTS.some(item=>item.id===mountReward) && mountReward===campMountReward(worldState.seed,{...encounter,difficulty,generation:campGeneration},discovery.mount), 'battle mount reward');
  assert(input.encounterName === undefined || input.encounterName === encounter.name || input.encounterName === previousRegionalCampName || input.encounterName === legacyCampName, 'battle encounter name');
  assert(typeof input.id === 'string' && input.id.length <= 80 && input.id.startsWith('battle-'), 'battle id');
  assert(['active', 'victory', 'defeat', 'retreat'].includes(input.status), 'battle status');
  const rulesVersion = input.rulesVersion ?? 1;
  assert(rulesVersion === 1 || rulesVersion === 2, 'battle rules version');
  const weaponSkillsVersion = input.weaponSkillsVersion ?? 0;
  assert((weaponSkillsVersion === 0 || weaponSkillsVersion === 1) && (weaponSkillsVersion === 0 || rulesVersion === 2), 'battle weapon skills version');
  const mountSkillsVersion = input.mountSkillsVersion ?? 0;
  const mountBalanceVersion = input.mountBalanceVersion ?? 0;
  assert((mountBalanceVersion === 0 || mountBalanceVersion === 1) && (mountBalanceVersion === 0 || mountSkillsVersion === 1), 'battle mount balance version');
  assert((mountSkillsVersion === 0 || mountSkillsVersion === 1) && (mountSkillsVersion === 0 || weaponSkillsVersion === 1), 'battle mount skills version');
  assert(Number.isSafeInteger(input.round) && input.round >= 1 && input.round <= 1000, 'battle round');
  const tactic = input.tactic ?? 'offense';
  assert(TACTICS.includes(tactic) && (tactic!=='skirmish'||rulesVersion===2), 'battle tactic');
  assert(input.enemyAdaptiveRulesVersion===undefined || input.enemyAdaptiveRulesVersion===1 && input.enemyTacticsVersion===1 && rulesVersion===2 && weaponSkillsVersion===1,'battle adaptive enemy rules');
  const enemyTacticalState=input.enemyTacticalState;
  if (input.enemyAdaptiveRulesVersion===1) {
    assert(recordObject(enemyTacticalState) && Object.keys(enemyTacticalState).sort().join(',')==='lastChangedRound,lastEvaluatedRound,lastRangedAttackRound,tactic'
      && ENEMY_TACTICS.includes(enemyTacticalState.tactic),'battle enemy tactical state');
    for (const key of ['lastChangedRound','lastEvaluatedRound','lastRangedAttackRound']) assert(validCount(enemyTacticalState[key]) && enemyTacticalState[key]<=input.round,'battle enemy tactic round');
    assert(enemyTacticalState.lastChangedRound>=1 && (enemyTacticalState.lastEvaluatedRound===0 || enemyTacticalState.lastChangedRound<=enemyTacticalState.lastEvaluatedRound),'battle enemy tactic change round');
  } else assert(enemyTacticalState===undefined,'unexpected enemy tactical state');
  const lastContactRound = input.lastContactRound ?? 1;
  assert(Number.isSafeInteger(lastContactRound) && lastContactRound >= 1 && lastContactRound <= input.round, 'battle contact round');
  const engaged = input.engaged ?? false;
  assert(typeof engaged === 'boolean', 'battle engaged');
  assert(validCount(input.rng) && input.rng <= 0xffffffff, 'battle random state');
  const lootSeed = input.lootSeed ?? hashSeed(input.id);
  assert(validCount(lootSeed) && lootSeed <= 0xffffffff, 'battle loot seed');
  const field = validateBattleField(input.field);
  assert(input.escapeRulesVersion===undefined||input.escapeRulesVersion===1,'battle escape rules');
  assert(input.enemyScalingVersion===undefined||input.enemyScalingVersion===1,'battle enemy scaling rules');
  const enemyLimit=input.enemyScalingVersion===1?20:12;
  const validEnemyId=id=>new RegExp(`^enemy-([1-9]|1[0-9]${enemyLimit===20?'|20':''})$`).test(id)&&Number(id.slice(6))<=enemyLimit;
  assert(Array.isArray(input.units) && input.units.length >= 2 && input.units.length <= MAX_BATTLE_SIZE + (patrolAssist?9:3) + enemyLimit, 'battle units');
  assert(input.units.filter(u=>u.side==='enemy').length<=enemyLimit,'battle enemy count');
  const ids = new Set();
  const partyIds = new Set(party.map(person => person.id));
  const questAllies = encounterType === 'undead-liberation' || encounterType === 'rescue' || encounterType === 'camp' && worldState.contract?.type === 'assault'
    && worldState.contract.campId === input.campId && worldState.contract.campGeneration === campGeneration
    && !huntComplete(worldState);
  const units = input.units.map(unit => {
    assert(recordObject(unit) && typeof unit.id === 'string' && unit.id.length <= 40 && !ids.has(unit.id), 'battle unit id');
    unit = {...unit};
    ids.add(unit.id);
    assert(unit.side === 'company' || unit.side === 'enemy', 'battle side');
    if (undead && unit.side === 'enemy') assert(unit.undeadTraitsVersion === 1 && undead.force.troops.includes(unit.troopIndex) && unit.id === `enemy-${unit.troopIndex + 1}` && unit.morale === 60, 'undead troop');
    else assert(unit.undeadTraitsVersion === undefined && unit.troopIndex === undefined, 'unexpected undead traits');
    assert(unit.ally === undefined || unit.ally === true, 'battle ally marker');
    assert(unit.ally ? (questAllies||patrolAssist) && unit.side === 'company' && new RegExp(`^ally-[1-${patrolAssist?patrolAssist.troops.length:3}]$`).test(unit.id)
      : unit.side === 'company' ? partyIds.has(unit.id) : validEnemyId(unit.id), 'battle unit ownership');
    assert(typeof unit.name === 'string' && unit.name.length > 0 && unit.name.length <= 80, 'battle unit name');
    assert(passableHex(unit, field), 'battle hex');
    assert(validCount(unit.maxHp) && unit.maxHp >= 1 && unit.maxHp <= 300 && validCount(unit.hp) && unit.hp <= unit.maxHp && unit.alive === (unit.hp > 0), 'battle health');
    assert(unit.champion===undefined||input.championRulesVersion===1&&unit.side==='enemy'&&unit.champion===true,'battle champion');
    assert(unit.championItemId===undefined||unit.champion&&['famed','named'].includes(getItem(unit.championItemId)?.rarity)&&unit.equipment?.weapon===unit.championItemId,'battle champion trophy');
    assert(!unit.champion||unit.championItemId,'battle champion trophy');
    assert(recordObject(unit.equipment), 'battle equipment');
    for (const slot of SLOTS) assert(unit.equipment[slot] === null || ['attachment','attachment2', 'mount'].includes(slot) && unit.equipment[slot] === undefined || getItem(unit.equipment[slot])?.slot === (slot==='attachment2'?'attachment':slot), 'battle equipment');
    assert(unit.equipment.attachment === undefined || unit.equipment.attachment === null || unit.equipment.armor, 'battle attachment requires armor');
    assert(!unit.equipment.attachment2||input.attachmentRulesVersion===1&&unit.equipment.armor&&unit.side==='company'&&!unit.ally&&party.find(person=>person.id===unit.id)?.perks.includes('layered-armor'),'battle second attachment');
    assert(!getItem(unit.equipment.weapon)?.twoHanded || !unit.equipment.shield, 'battle two handed weapon');
    const reserveEquipment = unit.reserveEquipment ?? { weapon: null, shield: null };
    const accessories = unit.accessories ?? [null, null];
    const partyMember = unit.side === 'company' && !unit.ally ? party.find(person => person.id === unit.id) : null;
    assert(unit.appearanceId === partyMember?.appearanceId, 'battle unit appearance');
    if (partyMember) assert((unit.equipment.mount ?? null) === (partyMember.equipment.mount ?? null), 'battle mount owner');
    const perks = unit.perks ?? partyMember?.perks ?? [];
    assert(Array.isArray(perks) && perks.every(id => typeof id === 'string' && (PERK_BY_ID.has(id) || REMOVED_PERK_MIN_LEVEL.has(id))) && new Set(perks).size === perks.length, 'battle perks');
    assert(unit.side === 'enemy' ? perks.length === 0 || difficulty === 3 && perks.length === 1 && ['bullseye','shield-expert','quick-hands','backstabber'].includes(perks[0]) : unit.ally ? (patrolAssist ? perks.length===0||getFactionPatrols(worldState).find(a=>a.id===patrolAssist.id).difficulty===3&&perks.length===1&&['bullseye','shield-expert','quick-hands','backstabber'].includes(perks[0]) : perks.length === 0) : perks.length === (partyMember.perks ?? []).length && perks.every((id, index) => id === partyMember.perks[index]), 'battle perk owner');
    const adaptation = unit.adaptation ?? 0;
    const berserkRound = unit.berserkRound ?? 0;
    const frenzyUntilRound = unit.frenzyUntilRound ?? 0;
    const turnStartedRound = unit.turnStartedRound ?? 0;
    const freeSwapRound = unit.freeSwapRound ?? 0;
    const freeHealRound = unit.freeHealRound ?? 0;
    const formationMovedRound = unit.formationMovedRound ?? 0;
    const aiTargetId = unit.aiTargetId ?? null;
    const movementCredit = unit.movementCredit ?? 0;
    assert(validCount(adaptation) && adaptation <= 1000, 'battle adaptation');
    assert(validCount(berserkRound) && berserkRound <= input.round, 'battle berserk round');
    if (unit.howlTurns !== undefined) assert(mountBalanceVersion === 1 && validCount(unit.howlTurns) && unit.howlTurns <= 2, 'battle howl turns');
    assert(validCount(frenzyUntilRound) && frenzyUntilRound <= input.round + 2, 'battle frenzy round');
    assert(validCount(turnStartedRound) && turnStartedRound <= input.round, 'battle turn started round');
    assert(validCount(freeSwapRound) && freeSwapRound <= input.round && validCount(freeHealRound) && freeHealRound <= input.round, 'battle free actions');
    assert(validCount(formationMovedRound) && formationMovedRound <= input.round && (aiTargetId === null || partyIds.has(aiTargetId)
      || new RegExp(`^ally-[1-${patrolAssist?patrolAssist.troops.length:3}]$`).test(aiTargetId) || validEnemyId(aiTargetId)), 'battle AI state');
    assert(validCount(movementCredit) && movementCredit <= Math.max(0, movementBudget(unit, { mountBalanceVersion,attachmentRulesVersion:input.attachmentRulesVersion }) - 2) * 2, 'battle movement credit');
    assert(recordObject(reserveEquipment) && (reserveEquipment.weapon === null || getItem(reserveEquipment.weapon)?.slot === 'weapon') && (reserveEquipment.shield === null || getItem(reserveEquipment.shield)?.slot === 'shield') && (!getItem(reserveEquipment.weapon)?.twoHanded || reserveEquipment.shield === null), 'battle reserve equipment');
    assert(Array.isArray(accessories) && accessories.length === 2 && accessories.every(id => id === null || getItem(id)?.slot === 'accessory' || getItem(id)?.pocketWeapon === true), 'battle accessories');
    const pocketDrawnFrom = unit.pocketDrawnFrom ?? null;
    const pocketStowedWeapon = unit.pocketStowedWeapon ?? null;
    assert(pocketDrawnFrom === null && pocketStowedWeapon === null || (pocketDrawnFrom === 0 || pocketDrawnFrom === 1) && accessories[pocketDrawnFrom] === null && getItem(unit.equipment.weapon)?.pocketWeapon === true && getItem(pocketStowedWeapon)?.ranged === true, 'battle pocket weapon');
    assert(validCount(unit.pocketStowedReload ?? 0) && (unit.pocketStowedReload ?? 0) <= 2 && validCount(unit.reserveReload ?? 0) && (unit.reserveReload ?? 0) <= 2, 'battle reserve reload');
    assert(validCount(unit.pocketDrawnRound ?? 0) && (unit.pocketDrawnRound ?? 0) <= input.round && (pocketDrawnFrom !== null || (unit.pocketDrawnRound ?? 0) === 0), 'battle pocket round');
    assert(unit.meleePhase === undefined || typeof unit.meleePhase === 'boolean', 'battle melee phase');
    const maxAttachmentArmor = unit.maxAttachmentArmor ?? armorMaximum(unit.equipment.attachment);
    const attachmentArmor = unit.attachmentArmor ?? maxAttachmentArmor;
    const maxAttachment2Armor=unit.maxAttachment2Armor??armorMaximum(unit.equipment.attachment2),attachment2Armor=unit.attachment2Armor??maxAttachment2Armor;
    assert(maxAttachment2Armor===armorMaximum(unit.equipment.attachment2)&&validCount(attachment2Armor)&&attachment2Armor<=maxAttachment2Armor,'battle second attachment armor');
    const maxShieldDurability = shieldMaximum(unit.equipment.shield);
    const maxReserveShieldDurability = shieldMaximum(reserveEquipment.shield);
    const shieldDurability = unit.shieldDurability ?? maxShieldDurability;
    const reserveShieldDurability = unit.reserveShieldDurability ?? maxReserveShieldDurability;
    const stowedWeapon = pocketDrawnFrom === null ? unit.equipment.weapon : pocketStowedWeapon;
    const originalActive = partyMember?.equipment;
    const originalReserve = partyMember?.reserveEquipment ?? { weapon: null, shield: null };
    const battleSetSwapped = unit.battleSetSwapped ?? Boolean(originalActive
      && stowedWeapon === originalReserve.weapon && unit.equipment.shield === originalReserve.shield
      && reserveEquipment.weapon === originalActive.weapon && reserveEquipment.shield === originalActive.shield
      && (stowedWeapon !== originalActive.weapon || unit.equipment.shield !== originalActive.shield));
    const partyAmmo = partyMember
      ? partyMember.throwingAmmo ?? { active: throwingCapacity(originalActive?.weapon), reserve: throwingCapacity(originalReserve.weapon) }
      : { active: throwingCapacity(stowedWeapon), reserve: throwingCapacity(reserveEquipment.weapon) };
    const legacyAmmo = battleSetSwapped
      ? { active: partyAmmo.reserve, reserve: partyAmmo.active }
      : { active: partyAmmo.active, reserve: partyAmmo.reserve };
    const throwingAmmo = unit.throwingAmmo ?? legacyAmmo;
    const activeAmmoWeapon = pocketDrawnFrom === null ? unit.equipment.weapon : stowedWeapon;
    assert(recordObject(throwingAmmo) && Object.keys(throwingAmmo).length === 2
      && Object.hasOwn(throwingAmmo, 'active') && Object.hasOwn(throwingAmmo, 'reserve')
      && validCount(throwingAmmo.active) && throwingAmmo.active <= throwingCapacity(activeAmmoWeapon)
      && validCount(throwingAmmo.reserve) && throwingAmmo.reserve <= throwingCapacity(reserveEquipment.weapon), 'battle throwing ammo');
    // Upgraded imported rare designs keep their remaining durability in active old battles.
    for (const [slot,key] of [['armor','maxBodyArmor'],['helmet','maxHeadArmor']]) {
      const item = getItem(unit.equipment[slot]);
      const original = item?.baseId ? getItem(item.baseId) : item;
      if (original?.sourceArmor !== undefined && ![2,3].includes(item.rollVersion)) {
        const seed = item.baseId ? Number(item.id.split(':')[2]) : null;
        const legacy = seed === null ? original.sourceArmor : Math.min(500,original.sourceArmor + Math.max(8,Math.round(original.sourceArmor * (.15 + (seed & 15) / 100))));
        if (unit[key] === legacy) unit[key] = item.armor;
      }
    }
    assert(unit.maxBodyArmor === armorMaximum(unit.equipment.armor) && maxAttachmentArmor === armorMaximum(unit.equipment.attachment) && unit.maxHeadArmor === armorMaximum(unit.equipment.helmet), 'battle armor maximum');
    assert(validCount(unit.bodyArmor) && unit.bodyArmor <= unit.maxBodyArmor && validCount(attachmentArmor) && attachmentArmor <= maxAttachmentArmor && validCount(unit.headArmor) && unit.headArmor <= unit.maxHeadArmor, 'battle armor');
    assert(validCount(shieldDurability) && shieldDurability <= maxShieldDurability && validCount(reserveShieldDurability) && reserveShieldDurability <= maxReserveShieldDurability
      && (unit.maxShieldDurability === undefined || unit.maxShieldDurability === maxShieldDurability)
      && (unit.maxReserveShieldDurability === undefined || unit.maxReserveShieldDurability === maxReserveShieldDurability)
      && typeof battleSetSwapped === 'boolean', 'battle shield durability');
    assert(validCount(unit.seed) && unit.seed <= 0xffffffff, 'battle unit seed');
    assert(validCount(unit.morale) && unit.morale <= 100 && validCount(unit.fatigue) && unit.fatigue <= 300 && validCount(unit.ap) && unit.ap <= (rulesVersion === 2 ? 13 : 2), 'battle stamina');
    assert(unit.shieldWallActive === undefined || rulesVersion === 2 && typeof unit.shieldWallActive === 'boolean', 'battle shieldwall');
    for (const key of ['spearwallActive', 'riposteActive', 'stunProtected'])
      assert(unit[key] === undefined || weaponSkillsVersion === 1 && typeof unit[key] === 'boolean', `battle ${key}`);
    for(const key of ['dazedTurns','staggeredTurns','disarmedTurns'])assert(unit[key]===undefined||input.weaponCompletionVersion===1&&validCount(unit[key])&&unit[key]<=(key==='dazedTurns'?2:1),`battle ${key}`);
    assert(unit.bleedTickRound===undefined||input.weaponCompletionVersion===1&&validCount(unit.bleedTickRound)&&unit.bleedTickRound<=input.round,'battle bleed tick');
    if(unit.bleeding!==undefined)assert(input.weaponCompletionVersion===1&&recordObject(unit.bleeding)&&Object.keys(unit.bleeding).sort().join(',')==='damage,sourceId,turns'&&validCount(unit.bleeding.damage)&&unit.bleeding.damage>=1&&unit.bleeding.damage<=18&&[1,2].includes(unit.bleeding.turns)&&input.units.some(x=>x.id===unit.bleeding.sourceId),'battle bleeding');
    assert(unit.stunnedTurns === undefined || weaponSkillsVersion === 1 && validCount(unit.stunnedTurns) && unit.stunnedTurns <= 1, 'battle stun');
    assert(unit.pendingBerserkAp === undefined || weaponSkillsVersion === 1 && [0, 4].includes(unit.pendingBerserkAp), 'battle pending Berserk');
    for (const key of ['fleeRollRound', 'fleeRound']) assert(unit[key] === undefined
      || weaponSkillsVersion === 1 && unit.side === 'enemy' && validCount(unit[key]) && unit[key] >= 1 && unit[key] <= input.round, `battle ${key}`);
    assert(unit.fleeRound === undefined || unit.fleeRollRound >= unit.fleeRound, 'battle flee roll');
    assert(unit.firstFleeRound===undefined||input.escapeRulesVersion===1&&unit.side==='enemy'&&validCount(unit.firstFleeRound)&&unit.firstFleeRound>=1&&unit.firstFleeRound<=input.round,'first fleeing round');
    assert(!unit.escaped||input.escapeRulesVersion!==1||unit.firstFleeRound<input.round,'two-turn escape');
    assert(unit.escaped === undefined || weaponSkillsVersion === 1 && unit.side === 'enemy' && unit.escaped === true && !unit.alive && unit.hp === 0, 'battle escaped');
    if (weaponSkillsVersion === 1) assert((unit.stunnedTurns ?? 0) === 0 || unit.stunProtected === true, 'battle stun protection');
    if (unit.spearwallActive) assert(weaponSkillFamily(getItem(unit.equipment.weapon)) === 'spear', 'battle spearwall weapon');
    if (unit.riposteActive) assert(weaponSkillFamily(getItem(unit.equipment.weapon)) === 'sword'&&(input.weaponCompletionVersion!==1||equipmentSkills(getItem(unit.equipment.weapon)).some(x=>x.id==='riposte')), 'battle riposte weapon');
    if (unit.skirmishReturn!==undefined) assert((unit.side==='enemy' ? input.enemyAdaptiveRulesVersion===1 && enemyTacticalState.tactic==='skirmish' : tactic==='skirmish' && !unit.ally) && rulesVersion===2
      && getItem(unit.equipment.weapon)?.ranged && recordObject(unit.skirmishReturn)
      && Object.keys(unit.skirmishReturn).sort().join(',')==='phase,q,r' && passableHex(unit.skirmishReturn,field)
      && ['aim','return'].includes(unit.skirmishReturn.phase),'battle skirmish return');
    assert(unit.tacticalRole === undefined || COMBAT_ROLES.includes(unit.tacticalRole) && unit.tacticalRole !== 'auto', 'battle tactical role');
    assert(unit.skillPreference === undefined || SKILL_PREFERENCES.includes(unit.skillPreference), 'battle skill preference');
    assert(unit.reload === undefined || validCount(unit.reload) && unit.reload <= 2, 'battle reload');
    for (const key of ['meleeSkill', 'rangedSkill', 'meleeDefense', 'rangedDefense', 'maxFatigue', 'initiative', 'resolve']) assert(validCount(unit[key]) && unit[key] <= 300, `battle ${key}`);
    return {
      id: unit.id, name: unit.name, side: unit.side, ...(unit.ally ? { ally: true } : {}), q: unit.q, r: unit.r,
      hp: unit.hp, maxHp: unit.maxHp, bodyArmor: unit.bodyArmor, attachmentArmor, headArmor: unit.headArmor,
      maxBodyArmor: unit.maxBodyArmor, maxAttachmentArmor, ...(input.attachmentRulesVersion===1?{attachment2Armor,maxAttachment2Armor}:{}), maxHeadArmor: unit.maxHeadArmor,
      equipment: Object.fromEntries(SLOTS.filter(slot=>slot!=='attachment2'||input.attachmentRulesVersion===1||unit.equipment.attachment2!==undefined).map(slot => [slot, unit.equipment[slot] ?? null])),
      reserveEquipment: { weapon: reserveEquipment.weapon, shield: reserveEquipment.shield }, accessories: [...accessories],
      pocketDrawnFrom, pocketStowedWeapon, pocketStowedReload: unit.pocketStowedReload ?? 0,
      pocketDrawnRound: unit.pocketDrawnRound ?? 0, reserveReload: unit.reserveReload ?? 0, meleePhase: unit.meleePhase ?? false,
      shieldDurability, maxShieldDurability, reserveShieldDurability, maxReserveShieldDurability, battleSetSwapped,
      throwingAmmo: { active: throwingAmmo.active, reserve: throwingAmmo.reserve },
      perks: perks.filter(id => PERK_BY_ID.has(id)), adaptation, berserkRound, frenzyUntilRound, turnStartedRound, freeSwapRound, freeHealRound,
      ...(unit.champion?{champion:true,championItemId:unit.championItemId}:{}),
      ...Object.fromEntries(['dazedTurns','staggeredTurns','disarmedTurns','bleedTickRound'].filter(key=>unit[key]!==undefined).map(key=>[key,unit[key]])),
      ...(unit.bleeding===undefined?{}:{bleeding:{...unit.bleeding}}),
      ...(unit.howlTurns === undefined ? {} : { howlTurns: unit.howlTurns }),
      ...(unit.fleeRollRound === undefined ? {} : { fleeRollRound: unit.fleeRollRound }),
      ...(unit.firstFleeRound===undefined?{}:{firstFleeRound:unit.firstFleeRound}),
      ...(unit.fleeRound === undefined ? {} : { fleeRound: unit.fleeRound }),
      ...(unit.escaped === undefined ? {} : { escaped: unit.escaped }),
      ...(rulesVersion === 2 ? { shieldWallActive: unit.shieldWallActive ?? false } : {}),
      ...(weaponSkillsVersion === 1 ? { spearwallActive: unit.spearwallActive ?? false, riposteActive: unit.riposteActive ?? false,
        stunnedTurns: unit.stunnedTurns ?? 0, stunProtected: unit.stunProtected ?? false,
        pendingBerserkAp: unit.pendingBerserkAp ?? 0 } : {}),
      ...(unit.skirmishReturn===undefined?{}:{skirmishReturn:{q:unit.skirmishReturn.q,r:unit.skirmishReturn.r,phase:unit.skirmishReturn.phase}}),
      ...(unit.tacticalRole === undefined ? {} : { tacticalRole: unit.tacticalRole }),
      ...(unit.skillPreference === undefined ? {} : { skillPreference: unit.skillPreference }),
      ...(rulesVersion === 2 ? { aiTargetId, formationMovedRound, movementCredit } : {}),
      ...(unit.undeadTraitsVersion === undefined ? {} : { undeadTraitsVersion: unit.undeadTraitsVersion, troopIndex: unit.troopIndex }),
      seed: unit.seed, ...(unit.appearanceId ? { appearanceId: unit.appearanceId } : {}), alive: unit.alive, morale: unit.morale, fatigue: unit.fatigue, ap: unit.ap, reload: unit.reload ?? 0,
      meleeSkill: unit.meleeSkill, rangedSkill: unit.rangedSkill,
      meleeDefense: unit.meleeDefense, rangedDefense: unit.rangedDefense,
      maxFatigue: unit.maxFatigue, initiative: unit.initiative, resolve: unit.resolve,
    };
  });
  assert(units.some(unit => unit.side === 'company') && units.some(unit => unit.side === 'enemy'), 'battle sides');
  assert(new Set(units.filter(unit => unit.alive).map(unit => `${unit.q},${unit.r}`)).size === units.filter(unit => unit.alive).length, 'battle occupied hexes');
  const focusTargetId = input.focusTargetId ?? null;
  assert(focusTargetId === null || units.some(unit => unit.side === 'enemy' && unit.id === focusTargetId), 'battle focus target');
  const fieldedIds=new Set(getBattleRoster(worldState).map(p=>p.id));
  assert(units.filter(unit => unit.side === 'company' && !unit.ally).length === fieldedIds.size && units.filter(unit=>unit.side==='company'&&!unit.ally).every(unit=>fieldedIds.has(unit.id)), 'battle company roster');
  assert(units.filter(unit => unit.ally).length === (patrolAssist?patrolAssist.troops.length:questAllies ? 3 : 0), 'battle allied roster');
  assert(units.filter(unit => unit.side === 'company' && !unit.ally).every(unit => party.some(person => person.id === unit.id)), 'battle company roster');
  const formationAdvanceInput = input.formationAdvance ?? null;
  assert(['advance-formation', 'shield-wall'].includes(tactic) ? recordObject(formationAdvanceInput) : formationAdvanceInput === null, 'battle formation advance');
  let formationAdvance = null;
  if (formationAdvanceInput) {
    const companyIds = units.filter(unit => unit.side === 'company' && !unit.ally).map(unit => unit.id);
    assert(formationAdvanceInput.step === 1
      && Object.hasOwn(FORMATION_DIRECTIONS, formationAdvanceInput.direction)
      && Number.isSafeInteger(formationAdvanceInput.startedRound) && formationAdvanceInput.startedRound >= 1 && formationAdvanceInput.startedRound <= input.round
      && validCount(formationAdvanceInput.completedRound) && formationAdvanceInput.completedRound <= input.round
      && recordObject(formationAdvanceInput.origins) && Object.keys(formationAdvanceInput.origins).length === companyIds.length
      && companyIds.every(id => passableHex(formationAdvanceInput.origins[id], field))
      && new Set(units.filter(unit => unit.side === 'company' && !unit.ally && unit.alive).map(unit => `${formationAdvanceInput.origins[unit.id].q},${formationAdvanceInput.origins[unit.id].r}`)).size === units.filter(unit => unit.side === 'company' && !unit.ally && unit.alive).length, 'battle formation advance plan');
    formationAdvance = { step: formationAdvanceInput.step, direction: formationAdvanceInput.direction, completedRound: formationAdvanceInput.completedRound, startedRound: formationAdvanceInput.startedRound,
      origins: Object.fromEntries(companyIds.map(id => [id, { q: formationAdvanceInput.origins[id].q, r: formationAdvanceInput.origins[id].r }])) };
  }
  const companyAlive = units.some(unit => unit.side === 'company' && !unit.ally && unit.alive);
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
  if (event?.skillName !== undefined) assert(['Reload', 'Stunned', 'Flee', ...(input.weaponCompletionVersion===1?['Bleeding',...Object.values(WEAPON_ACTIONS).map(skill=>skill.name)]:[]), ...Object.values(COMBAT_SKILLS).map(skill => skill.name)].includes(event.skillName), 'battle event skill');
  if (event?.ranged !== undefined) assert(typeof event.ranged === 'boolean', 'battle event ranged');
  if (event?.projectile !== undefined) assert([null, 'arrow', 'bolt', 'javelin', 'axe', 'stone'].includes(event.projectile), 'battle event projectile');
  for (const key of ['from', 'to', 'moveFrom']) if (event?.[key] !== undefined) assert(event[key] === null || validHex(event[key], field), `battle event ${key}`);
  if (event?.pushedFrom !== undefined) assert(validHex(event.pushedFrom, field), 'battle event pushed from');
  for (const key of ['hpDamage', 'armorDamage', 'shieldDamage']) if (event?.[key] !== undefined) assert(validCount(event[key]) && event[key] <= 1000, `battle event ${key}`);
  if (event?.friendlyFire !== undefined) assert(weaponSkillsVersion === 1 && typeof event.friendlyFire === 'boolean', 'battle event friendly fire');
  if (event?.affectedTargets !== undefined) {
    assert(weaponSkillsVersion === 1 && Array.isArray(event.affectedTargets) && event.affectedTargets.length >= 1
      && event.affectedTargets.length <= (input.weaponCompletionVersion===1?6:3) && new Set(event.affectedTargets.map(impact => impact.id)).size === event.affectedTargets.length
      && event.affectedTargets.every(impact => recordObject(impact) && ids.has(impact.id)
        && ['hpDamage', 'armorDamage', 'shieldDamage'].every(key => validCount(impact[key]) && impact[key] <= 1000)
        && typeof impact.hit === 'boolean' && typeof impact.head === 'boolean' && typeof impact.fallen === 'boolean'), 'battle event area impacts');
  }
  if(event?.strikes!==undefined)assert(input.weaponCompletionVersion===1&&Array.isArray(event.strikes)&&event.strikes.length>=1&&event.strikes.length<=3&&event.strikes.every(x=>recordObject(x)&&['hpDamage','armorDamage','shieldDamage'].every(k=>validCount(x[k])&&x[k]<=1000)&&['hit','head','fallen'].every(k=>typeof x[k]==='boolean')),'battle multi-strike impacts');
  if (event?.reactions !== undefined) {
    assert(weaponSkillsVersion === 1 && Array.isArray(event.reactions) && event.reactions.length >= 1 && event.reactions.length <= 12
      && event.reactions.every(reaction => recordObject(reaction) && ids.has(reaction.actorId) && ids.has(reaction.targetId)
        && ['attack', 'miss'].includes(reaction.type) && ['Riposte', 'Spearwall', 'Opportunity Strike', 'Wolf Bite'].includes(reaction.skillName)
        && validHex(reaction.from, field) && validHex(reaction.to, field)
        && ['hpDamage', 'armorDamage', 'shieldDamage'].every(key => validCount(reaction[key]) && reaction[key] <= 1000)
        && typeof reaction.head === 'boolean' && typeof reaction.fallen === 'boolean'), 'battle event reactions');
  }
  for (const entry of [event, ...(event?.reactions ?? [])].filter(Boolean)) {
    if (entry.effects !== undefined) assert(Array.isArray(entry.effects) && entry.effects.length <= 4
      && new Set(entry.effects.map(effect => effect?.id)).size === entry.effects.length
      && entry.effects.every(effect => recordObject(effect) && ['battle-flow', 'killing-frenzy', 'berserk', 'howling'].includes(effect.id)
        && (effect.id !== 'howling' || mountBalanceVersion === 1 && effect.amount === 20)
        && validCount(effect.amount) && effect.amount <= 100 && (effect.nextTurn === undefined || effect.id === 'berserk' && typeof effect.nextTurn === 'boolean')), 'battle event effects');
    if (entry.weaponId !== undefined) assert(entry.weaponId === null || getItem(entry.weaponId)?.slot === 'weapon', 'battle event weapon');
  }
  const actor = units.find(unit => unit.id === event?.actorId);
  const target = units.find(unit => unit.id === event?.targetId);
  const weaponId = event?.weaponId === undefined ? actor?.equipment.weapon ?? null : event.weaponId;
  const ranged = event?.ranged ?? (getItem(weaponId)?.ranged === true);
  const normalizedEvent = event ? {
    actorId: event.actorId, targetId: event.targetId, type: event.type === 'hit' || event.type === 'fall' ? 'attack' : event.type,
    weaponId, ranged, projectile: event.projectile === undefined ? ranged && ['attack', 'miss', 'hit', 'fall'].includes(event.type) ? projectileForWeapon(getItem(weaponId)) : null : event.projectile,
    ...(event.itemId === undefined ? {} : { itemId: event.itemId }),
    ...(event.effects === undefined ? {} : { effects: event.effects.map(effect => ({ id: effect.id, amount: effect.amount, ...(effect.nextTurn === undefined ? {} : { nextTurn: effect.nextTurn }) })) }),
    ...(event.skillName === undefined ? {} : { skillName: event.skillName }),
    ...(event.pushedFrom === undefined ? {} : { pushedFrom: { q: event.pushedFrom.q, r: event.pushedFrom.r } }),
    from: event.from === undefined ? actor ? { q: actor.q, r: actor.r } : null : event.from === null ? null : { q: event.from.q, r: event.from.r },
    to: event.to === undefined ? target ? { q: target.q, r: target.r } : actor ? { q: actor.q, r: actor.r } : null : event.to === null ? null : { q: event.to.q, r: event.to.r },
    ...(event.moveFrom === undefined ? {} : { moveFrom: event.moveFrom === null ? null : { q: event.moveFrom.q, r: event.moveFrom.r } }),
    message: event.message,
    ...(event.head !== undefined ? { head: event.head } : {}),
    ...(event.hpDamage !== undefined ? { hpDamage: event.hpDamage } : {}),
    ...(event.armorDamage !== undefined ? { armorDamage: event.armorDamage } : {}),
    ...(event.shieldDamage !== undefined ? { shieldDamage: event.shieldDamage } : {}),
    ...(event.fallen !== undefined || event.type === 'fall' ? { fallen: event.fallen ?? true } : {}),
    ...(event.friendlyFire === undefined ? {} : { friendlyFire: event.friendlyFire }),
    ...(event.strikes===undefined?{}:{strikes:event.strikes.map(x=>({...x}))}),
    ...(event.affectedTargets === undefined ? {} : { affectedTargets: event.affectedTargets.map(impact => ({ ...impact })) }),
    ...(event.reactions === undefined ? {} : { reactions: event.reactions.map(reaction => ({ ...reaction,
      from: { ...reaction.from }, to: { ...reaction.to },
      ...(reaction.effects === undefined ? {} : { effects: reaction.effects.map(effect => ({ id: effect.id, amount: effect.amount, ...(effect.nextTurn === undefined ? {} : { nextTurn: effect.nextTurn }) })) }) })) }),
  } : null;
  const loot = input.loot;
  assert(recordObject(loot) && validCount(loot.gold) && loot.gold <= 100000 && Array.isArray(loot.items) && loot.items.length <= (input.enemyScalingVersion===1?80:24) && loot.items.every(id => getItem(id)), 'battle loot');
  const itemConditions = (loot.itemConditions ?? loot.items.map(itemCondition)).map((condition, index) => restoredCondition(loot.items[index], condition));
  assert(Array.isArray(itemConditions) && itemConditions.length === loot.items.length && itemConditions.every((condition, index) => {
    const maximum = itemCondition(loot.items[index]);
    return maximum === null ? condition === null : validCount(condition) && condition <= maximum;
  }), 'battle loot condition');
  for (const key of ['food', 'tools', 'medicine', 'ammo']) assert(validCount(loot[key]) && loot[key] <= 1000, `battle loot ${key}`);
  assert(Array.isArray(input.casualties) && input.casualties.length <= MAX_COMPANY_SIZE && input.casualties.every(id => partyIds.has(id)) && new Set(input.casualties).size === input.casualties.length, 'battle casualties');
  assert(recordObject(input.xp) && Object.keys(input.xp).every(id => partyIds.has(id) && validCount(input.xp[id]) && input.xp[id] <= 1000), 'battle xp');
  return {
    ...(undead ? { crisisContext: { ...input.crisisContext } } : {}),
    ...(patrolAssist?{patrolAssist:structuredClone(patrolAssist)}:{}),
    id: input.id, campId: input.campId, ...(input.enemyOpening===undefined?{}:{enemyOpening:input.enemyOpening}), encounterType, encounterName, difficulty, campGeneration, famedDrop, ...(input.mountReward===undefined?{}:{mountReward}), tactic, focusTargetId, lastContactRound, engaged, formationAdvance, status: input.status, round: input.round, activeId: input.activeId,
    ...(input.enemyTacticsVersion===undefined?{}:{enemyTacticsVersion:1}),
    ...(input.enemyAdaptiveRulesVersion===undefined?{}:{enemyAdaptiveRulesVersion:1,enemyTacticalState:{...enemyTacticalState}}),
    ...(input.lighting===undefined?{}:{lighting:input.lighting}),
    ...(input.weaponAuditVersion===undefined?{}:{weaponAuditVersion:1}),
    ...(input.weaponCompletionVersion===undefined?{}:{weaponCompletionVersion:1}),
    ...(input.roleConsistencyVersion===undefined?{}:{roleConsistencyVersion:1}),
    ...(input.attachmentRulesVersion===undefined?{}:{attachmentRulesVersion:1}),
    ...(input.championRulesVersion===undefined?{}:{championRulesVersion:1}),
    ...(input.escapeRulesVersion===undefined?{}:{escapeRulesVersion:1}),
    ...(input.enemyScalingVersion===undefined?{}:{enemyScalingVersion:1}),
    ...(input.rulesVersion === undefined ? {} : { rulesVersion }),
    ...(input.weaponSkillsVersion === undefined ? {} : { weaponSkillsVersion }),
    ...(input.mountSkillsVersion === undefined ? {} : { mountSkillsVersion }),
    ...(input.mountBalanceVersion === undefined ? {} : { mountBalanceVersion }),
    field, units, turnOrder: [...input.turnOrder], turnIndex: input.turnIndex, rng: input.rng, lootSeed,
    log: [...input.log], lastEvent: normalizedEvent,
    loot: { gold: loot.gold, food: loot.food, tools: loot.tools, medicine: loot.medicine, ammo: loot.ammo, items: [...loot.items], itemConditions: [...itemConditions] },
    casualties: [...input.casualties], xp: { ...input.xp },
  };
}

export function validateSave(input) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 'expected an object');
  const ashenWinter = validateAshenWinter(input.ashenWinter, input.seed, SETTLEMENTS);
  input = { ...input, ashenWinter };
  for (const encounter of getUndeadEncounters(input)) for (const enemy of encounter.enemies) {
    const d = enemy.savedDamage; if (!d) continue;
    assert(d.bodyArmor <= armorMaximum(enemy.armor) && d.headArmor <= armorMaximum(enemy.helmet) && d.shieldDurability <= shieldMaximum(enemy.shield), 'undead force durability');
  }
  assert(input.version === 1, 'unsupported version');
  assert(input.worldLayoutVersion === undefined || [1,WORLD_LAYOUT_VERSION].includes(input.worldLayoutVersion), 'world layout');
  if(input.worldLayoutVersion !== WORLD_LAYOUT_VERSION) {
    const convert=point=>point && typeof point==='object' && Number.isFinite(point.x) && Number.isFinite(point.y) ? {...point,...compactPoint(point)} : point;
    input={...input,worldLayoutVersion:WORLD_LAYOUT_VERSION,position:convert(input.position),destination:convert(input.destination),bands:input.bands && Object.fromEntries(Object.entries(input.bands).map(([id,entry])=>[id,convert(entry)])),contract:input.contract ? {...input.contract,...(input.contract.rescuePoint ? {rescuePoint:convert(input.contract.rescuePoint)} : {})} : input.contract};
  }
  assert(validCount(input.seed) && input.seed <= 0xffffffff, 'seed');
  assert(Number.isSafeInteger(input.day) && input.day >= 1 && input.day <= 1000000, 'day');
  assert(Number.isFinite(input.hour) && input.hour >= 0 && input.hour < 24, 'hour');
  const tactic = input.tactic ?? 'offense';
  assert(TACTICS.includes(tactic), 'tactic');
  const mountRewards = input.mountRewards === undefined
    ? Object.fromEntries(getMountRewardDefinitions().map(reward => [reward.id, false])) : input.mountRewards;
  const mountRewardIds = getMountRewardDefinitions().map(reward => reward.id);
  assert(recordObject(mountRewards) && Object.keys(mountRewards).length === mountRewardIds.length
    && mountRewardIds.every(id => typeof mountRewards[id] === 'boolean'), 'mount rewards');
  for (const key of ['gold', 'food']) assert(validCount(input[key]) && input[key] <= 1000000000, key);
  for (const key of ['renown', 'contractSerial', 'recruitSerial']) assert(validCount(input[key]) && input[key] <= 1000000, key);
  const hiredRecruitOffers = input.hiredRecruitOffers ?? [];
  assert(Array.isArray(hiredRecruitOffers) && hiredRecruitOffers.length <= 48 && hiredRecruitOffers.every(id => typeof id === 'string' && recruitOfferDay(id) !== null && recruitOfferDay(id) <= input.day) && new Set(hiredRecruitOffers).size === hiredRecruitOffers.length, 'hired recruit offers');
  assert(validPoint(input.position), 'position');
  assert(input.destination === null || validPoint(input.destination), 'destination');
  assert(Array.isArray(input.inventory) && input.inventory.length <= getStashCapacity(input) && input.inventory.every(id => getItem(id)), 'inventory');
  const inventoryCondition = (input.inventoryCondition === undefined ? input.inventory.map(itemCondition) : input.inventoryCondition)
    .map((condition, index) => restoredCondition(input.inventory[index], condition));
  assert(Array.isArray(inventoryCondition) && inventoryCondition.length === input.inventory.length, 'inventory condition');
  for (let index = 0; index < input.inventory.length; index++) {
    const maximum = itemCondition(input.inventory[index]);
    assert(maximum === null ? inventoryCondition[index] === null : validCount(inventoryCondition[index]) && inventoryCondition[index] <= maximum, 'inventory condition');
  }
  const supplies = input.supplies === undefined ? { tools: 8, medicine: 5, ammo: 16 } : input.supplies;
  assert(recordObject(supplies) && Object.keys(supplies).length === 3, 'supplies');
  for (const kind of Object.keys(SUPPLY_INFO)) assert(validCount(supplies[kind]) && supplies[kind] <= 10000, `supplies ${kind}`);
  const cargo = input.cargo === undefined ? {} : input.cargo;
  assert(recordObject(cargo) && Object.keys(cargo).every(id => GOOD_BY_ID.has(id) && validCount(cargo[id]) && cargo[id] <= getCargoCapacity(input)) && Object.values(cargo).reduce((total, count) => total + count, 0) <= getCargoCapacity(input), 'cargo');
  if(input.cargoOrigins!==undefined){
    assert(recordObject(input.cargoOrigins)&&Object.entries(input.cargoOrigins).every(([id,lots])=>GOOD_BY_ID.has(id)&&Array.isArray(lots)&&lots.length<=SETTLEMENTS.length&&lots.every(lot=>recordObject(lot)&&TOWN_BY_ID.has(lot.townId)&&validQuantity(lot.count,getCargoCapacity(input)))&&new Set(lots.map(lot=>lot.townId)).size===lots.length&&lots.reduce((sum,lot)=>sum+lot.count,0)<=(cargo[id]??0)),'cargo origins');
  }
  const retinue=input.retinue??defaultRetinue();
  assert(recordObject(retinue)&&[0,1,2].includes(retinue.cartLevel===undefined?0:retinue.cartLevel)&&typeof retinue.bountyHunterUnlocked==='boolean'&&typeof retinue.bountyHunter==='boolean'&&(!retinue.bountyHunter||retinue.bountyHunterUnlocked)&&recordObject(retinue.bountyBoards)&&Object.entries(retinue.bountyBoards).every(([id,week])=>TOWN_BY_ID.has(id)&&validCount(week)&&week<=Math.floor((input.day-1)/7)),'retinue');
  const members=retinue.members===undefined?[]:retinue.members;
  assert(Array.isArray(members)&&members.every(id=>RETINUE_MEMBERS.some(member=>member.id===id))&&new Set(members).size===members.length,'retinue members');
  const scoutLevel=retinue.scoutLevel===undefined?(members.includes('scout')?1:0):retinue.scoutLevel;
  assert([0,1,2].includes(scoutLevel)&&(members.includes('scout')?scoutLevel>0:scoutLevel===0),'retinue scout');
  for(const [key,limit] of [['foodRemainder',4],['toolRemainder',4],['repairRemainder',3]])assert(retinue[key]===undefined||validCount(retinue[key])&&retinue[key]<=limit,'retinue savings');
  const discoveryRolls=input.discoveryRolls??{};
  assert(recordObject(discoveryRolls)&&Object.entries(discoveryRolls).every(([id,roll])=>(isCampId(id)||BAND_BY_ID.has(id))&&recordObject(roll)&&validCount(roll.cycle)&&roll.cycle<=1000000&&[0,5,8,13].includes(roll.champion)&&[0,15].includes(roll.famed)&&[0,12].includes(roll.mount)),'discovery encounter rolls');
  const deserterBoards=input.deserterBoards??{};
  assert(recordObject(deserterBoards)&&Object.entries(deserterBoards).every(([id,week])=>TOWN_BY_ID.has(id)&&validCount(week)&&week<=Math.floor((input.day-1)/7)),'deserter boards');
  const markets = input.marketStock === undefined ? {} : input.marketStock;
  assert(recordObject(markets) && Object.keys(markets).every(id => TOWN_BY_ID.has(id)), 'market stock');
  for (const [townId, market] of Object.entries(markets)) {
    assert(recordObject(market) && Number.isSafeInteger(market.day) && market.day >= 1 && market.day <= input.day && validCount(market.food) && market.food <= 100, 'market stock');
    assert(recordObject(market.goods) && GOODS.every(good => validCount(market.goods[good.id]) && market.goods[good.id] <= 100) && Object.keys(market.goods).length === GOODS.length, 'goods stock');
    assert(recordObject(market.equipment) && ITEMS.filter(item => !NEW_ITEM_IDS.has(item.id)).every(item => validCount(market.equipment[item.id]) && market.equipment[item.id] <= 1024) && Object.keys(market.equipment).every(id => Boolean(getItem(id)) && validCount(market.equipment[id]) && market.equipment[id] <= 1024), 'equipment stock');
    if (market.buyback !== undefined) assert(Array.isArray(market.buyback) && market.buyback.length <= MAX_INVENTORY && market.buyback.every(entry => recordObject(entry) && ['famed','named'].includes(getItem(entry.itemId)?.rarity) && (itemCondition(entry.itemId) === null ? entry.condition === null : validCount(restoredCondition(entry.itemId, entry.condition)) && restoredCondition(entry.itemId, entry.condition) <= itemCondition(entry.itemId))), 'famed buyback');
    if (market.supplies !== undefined) assert(recordObject(market.supplies) && Object.keys(market.supplies).length === 3 && Object.keys(SUPPLY_INFO).every(kind => validCount(market.supplies[kind]) && market.supplies[kind] <= 100), 'supplies stock');
    if (market.armoryVersion !== undefined) assert(market.armoryVersion === ARMORY_STOCK_VERSION, 'armory version');
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
    const holdKeys = ['heldBySiege', 'holdStartHour', 'holdPosition'];
    const shipmentSize = Object.keys(shipment).filter(k => !holdKeys.includes(k)).length;
    const legacyTiming = recordObject(shipment) && (shipmentSize === 7
      || shipmentSize === 8 && typeof shipment.raidCleared === 'boolean');
    const legacyRaid = recordObject(shipment) && shipmentSize === 9;
    const currentRaid = recordObject(shipment) && shipmentSize === 10;
    assert(recordObject(shipment) && (legacyTiming || legacyRaid || currentRaid)
      && ['startDay', 'originId', 'status', 'attackerId', 'attackerSpawnCycle', 'attackHour', 'resolvedHour']
        .every(key => Object.hasOwn(shipment, key))
      && (legacyTiming || ['travelHours', 'travelStartHour'].every(key => Object.hasOwn(shipment, key)))
      && (!currentRaid || Object.hasOwn(shipment, 'raidCleared') && typeof shipment.raidCleared === 'boolean'), 'shipment record');
    if (shipment.heldBySiege !== undefined) assert(typeof shipment.heldBySiege === 'boolean' && Number.isFinite(shipment.holdStartHour) && shipment.holdStartHour <= worldHours(input) && validPoint(shipment.holdPosition), 'shipment holding');
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
    if (shipment.status === 'en-route') assert(shipment.resolvedHour === null && (shipment.heldBySiege || now < (legacyTiming ? departureHour + 30 : plan.arrivalHour))
      && (currentRaid ? shipment.attackHour === null : shipment.attackHour === null || now < shipment.attackHour), 'shipment travel');
    if (shipment.status === 'under-attack') assert(shipment.attackerId !== null && shipment.resolvedHour === null
      && shipment.attackHour !== null && now >= shipment.attackHour
      && (currentRaid || now < shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS)
      && bandSpawnCycle(input, shipment.attackerId) === shipment.attackerSpawnCycle, 'shipment threat');
    if (shipment.status === 'delivered') assert(shipment.attackerId === null
      && (shipment.resolvedHour === plan.arrivalHour || shipment.heldBySiege === false && shipment.resolvedHour >= plan.arrivalHour) && now >= shipment.resolvedHour, 'shipment delivery');
    if (shipment.status === 'lost') assert(shipment.attackerId !== null
      && (currentRaid ? shipment.resolvedHour >= shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS
        : shipment.resolvedHour === shipment.attackHour + CARAVAN_ATTACK_WARNING_HOURS)
      && now >= shipment.resolvedHour, 'shipment loss');
    normalizedShipments[townId] = {
      ...(shipment.heldBySiege === undefined ? {} : { heldBySiege: shipment.heldBySiege, holdStartHour: shipment.holdStartHour, holdPosition: { ...shipment.holdPosition } }), ...shipment, travelHours, travelStartHour,
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
    assert(person.combatRole === undefined || COMBAT_ROLES.includes(person.combatRole), 'person combat role');
    assert(person.skillPreference === undefined || SKILL_PREFERENCES.includes(person.skillPreference), 'person skill preference');
    assert(typeof person.background === 'string' && person.background.length > 0 && person.background.length <= 80, 'person background');
    const backgroundDefinition = person.backgroundId === undefined ? null : RECRUIT_BACKGROUND_BY_ID.get(person.backgroundId);
    assert(person.backgroundId === undefined || backgroundDefinition && person.background === backgroundDefinition.name, 'person background id');
    assert(person.appearanceId === backgroundDefinition?.appearanceId, 'person appearance');
    const traits = person.traits ?? [];
    assert(Array.isArray(traits) && traits.length <= 2 && traits.every(id => typeof id === 'string' && RECRUIT_TRAIT_BY_ID.has(id)) && new Set(traits).size === traits.length, 'person traits');
    assert(backgroundDefinition ? traits.length >= 1 && RECRUIT_TRAIT_BY_ID.get(traits[0]).kind === 'positive' && (traits.length === 1 || RECRUIT_TRAIT_BY_ID.get(traits[1]).kind === 'tradeoff') : traits.length === 0, 'person trait kinds');
    assert(validCount(person.seed) && person.seed <= 0xffffffff, 'person seed');
    assert(person.talents===undefined||recordObject(person.talents)&&Object.keys(person.talents).length===3&&Object.entries(person.talents).every(([key,stars])=>ATTRIBUTES.includes(key)&&Number.isSafeInteger(stars)&&stars>=1&&stars<=3), 'person talents');
    assert(Number.isFinite(person.morale) && person.morale >= 0 && person.morale <= 100, 'person morale');
    assert(person.equipment && typeof person.equipment === 'object' && !Array.isArray(person.equipment), 'equipment');
    for (const slot of SLOTS) {
      const itemId = ['attachment','attachment2', 'mount'].includes(slot) ? person.equipment[slot] ?? null : person.equipment[slot];
      assert(itemId === null || getItem(itemId)?.slot === (slot==='attachment2'?'attachment':slot), `${slot} equipment`);
    }
    assert(!person.equipment.attachment || person.equipment.armor, 'attachment requires armor');
    assert(!person.equipment.attachment2||person.equipment.armor&&hasPerk(person,'layered-armor'),'second attachment requires Layered Armor and body armor');
    const reserve = person.reserveEquipment ?? { weapon: null, shield: null };
    const accessories = person.accessories ?? [null, null];
    assert(recordObject(reserve) && (reserve.weapon === null || getItem(reserve.weapon)?.slot === 'weapon') && (reserve.shield === null || getItem(reserve.shield)?.slot === 'shield') && (!getItem(reserve.weapon)?.twoHanded || reserve.shield === null), 'reserve equipment');
    assert(Array.isArray(accessories) && accessories.length === 2 && accessories.every(id => id === null || getItem(id)?.slot === 'accessory' || getItem(id)?.pocketWeapon === true), 'accessories');
    assert(person.attributes === undefined || recordObject(person.attributes), 'person attributes');
    assert(person.armorDurability === undefined || recordObject(person.armorDurability), 'person armor durability');
    assert(person.level !== null && person.xp !== null && person.trainingPoints !== null, 'person progress');
    assert(person.level === undefined || Number.isSafeInteger(person.level) && person.level >= 1 && person.level <= 30, 'person level');
    assert(person.trainingPoints === undefined || validCount(person.trainingPoints) && person.trainingPoints <= 29, 'person training points');
    const earnedLevel = person.level ?? 1;
    const perks = person.perks ?? [];
    assert(Array.isArray(perks) && perks.length <= earnedLevel - 1 && perks.every(id => typeof id === 'string' && (PERK_BY_ID.get(id)?.minLevel ?? REMOVED_PERK_MIN_LEVEL.get(id) ?? Infinity) <= earnedLevel) && new Set(perks).size === perks.length, 'person perks');
    if (person.pendingLevelUps === undefined) {
      assert((person.trainingPoints ?? 0) <= earnedLevel - 1, 'legacy training points');
    } else {
      const pending = person.pendingLevelUps;
      assert(Array.isArray(pending) && pending.length <= earnedLevel - 1 && (person.trainingPoints === undefined || person.trainingPoints === pending.length), 'pending level-ups');
      for (let index = 0; index < pending.length; index++) {
        const entry = pending[index];
        const level = earnedLevel - pending.length + index + 1;
        assert(recordObject(entry) && Object.keys(entry).length === 2 && entry.level === level && recordObject(entry.rolls), 'pending level');
        assert(Object.keys(entry.rolls).length === ATTRIBUTES.length && ATTRIBUTES.every(key => Number.isSafeInteger(entry.rolls[key]) && entry.rolls[key] >= 1 && entry.rolls[key] <= 5 && entry.rolls[key] === levelRolls(person.seed, level,person.talents)[key]), 'level rolls');
      }
    }
    const member = normalizeMember(person);
    if (person.throwingAmmo !== undefined) assert(recordObject(person.throwingAmmo)
      && Object.keys(person.throwingAmmo).length === 2
      && Object.hasOwn(person.throwingAmmo, 'active') && Object.hasOwn(person.throwingAmmo, 'reserve'), 'person throwing ammo');
    assert(validCount(member.throwingAmmo.active) && member.throwingAmmo.active <= throwingCapacity(person.equipment.weapon)
      && validCount(member.throwingAmmo.reserve) && member.throwingAmmo.reserve <= throwingCapacity(reserve.weapon), 'person throwing ammo');
    assert(Number.isSafeInteger(member.level) && member.level >= 1 && member.level <= 30, 'person level');
    assert(validCount(member.xp) && member.xp < member.level * 50 && validCount(member.trainingPoints) && member.trainingPoints <= 29, 'person experience');
    assert(recordObject(person.attributes ?? {}) && Object.keys(person.attributes ?? {}).every(key => ATTRIBUTES.includes(key)), 'person attributes');
    for (const key of ATTRIBUTES) assert(validCount(member.attributes[key]) && member.attributes[key] <= 1000, `person ${key}`);
    assert(validCount(member.armorDurability.body) && member.armorDurability.body <= armorMaximum(person.equipment.armor), 'body durability');
    assert(validCount(member.armorDurability.attachment) && member.armorDurability.attachment <= armorMaximum(person.equipment.attachment), 'attachment durability');
    assert(validCount(member.armorDurability.attachment2)&&member.armorDurability.attachment2<=armorMaximum(person.equipment.attachment2),'second attachment durability');
    assert(validCount(member.armorDurability.head) && member.armorDurability.head <= armorMaximum(person.equipment.helmet), 'head durability');
    assert(validCount(member.armorDurability.shield) && member.armorDurability.shield <= shieldMaximum(person.equipment.shield), 'shield durability');
    assert(validCount(member.armorDurability.reserveShield) && member.armorDurability.reserveShield <= shieldMaximum(reserve.shield), 'reserve shield durability');
    assert(validCount(person.hp) && person.hp >= 1 && person.hp <= getCompanyStats(member).maxHp, 'person hp');
  }
  const formation = input.formation === undefined ? seedFormation(input.party) : input.formation;
  const reserveIds=input.reserveIds===undefined?[null,null,null]:input.reserveIds,automation=input.automation===undefined?{buyAmmo:false,equipBandages:false}:input.automation;
  assert(Array.isArray(reserveIds)&&reserveIds.length===3&&reserveIds.every(id=>id===null||ids.has(id)),'reserves');
  assert(recordObject(automation)&&typeof automation.buyAmmo==='boolean'&&typeof automation.equipBandages==='boolean','company automation');
  assert(Array.isArray(formation) && [12, 36].includes(formation.length) && formation.every(id => id === null || ids.has(id)) && formation.filter(Boolean).length<=MAX_BATTLE_SIZE && [...formation,...reserveIds].filter(Boolean).length===ids.size && new Set([...formation,...reserveIds].filter(Boolean)).size===ids.size,'formation');
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
  const patrols=input.factionPatrols??Object.fromEntries(patrolDefinitions(SETTLEMENTS).map(d=>[d.id,initialPatrolProgress(input,d)]));
  const definitions=patrolDefinitions(SETTLEMENTS),now=worldHours(input),knownPatrols=new Set(definitions.map(d=>d.id));
  assert(recordObject(patrols)&&Object.keys(patrols).length===definitions.length,'faction patrols');
  for(const d of definitions){const p=patrols[d.id];assert(recordObject(p)&&Object.keys(p).length===12&&inBounds(p.x,p.y)&&validCount(p.waypoint)&&p.waypoint<d.waypoints.length
    &&Array.isArray(p.troops)&&p.troops.length<=d.size&&new Set(p.troops).size===p.troops.length&&p.troops.every(i=>validCount(i)&&i<d.size)
    &&validCount(p.spawnCycle)&&p.spawnCycle<=1000000&&validCount(p.wins)&&p.wins<=1000000000&&validCount(p.losses)&&p.losses<=1000000000
    &&Number.isFinite(p.defeatedUntil)&&p.defeatedUntil>=0&&p.defeatedUntil<=now+72
    &&Number.isFinite(p.cooldownUntil)&&p.cooldownUntil>=0&&p.cooldownUntil<=now+6
    &&Number.isFinite(p.lastReinforcedHour)&&p.lastReinforcedHour>=0&&p.lastReinforcedHour<=now
    &&['touring','returning','engaging','clearing-camp','reforming'].includes(p.behavior)
    &&(p.targetId===null||knownPatrols.has(p.targetId)||BAND_BY_ID.has(p.targetId)||isCampId(p.targetId)||/^ashen:[1-3]:host:[1-9]\d*$/.test(p.targetId)),'faction patrol state');}
  const normalizedPatrols=structuredClone(patrols);
  for(const p of Object.values(normalizedPatrols))if(p.behavior==='clearing-camp'||p.targetId!==null&&isCampId(p.targetId)){
    p.targetId=null;p.behavior=p.troops.length?'touring':'reforming';
  }
  const worldLosses=input.worldLosses??{};
  assert(recordObject(worldLosses)&&Object.keys(worldLosses).length<=ROAMING_BANDS.length+CAMP_SITES.length+RANDOM_CAMP_IDS.length,'world casualties');
  for(const [id,p]of Object.entries(worldLosses))assert((BAND_BY_ID.has(id)||isCampId(id))&&recordObject(p)&&Object.keys(p).length===3&&validCount(p.cycle)&&p.cycle<=1000000&&validCount(p.size)&&p.size>0&&p.size<=20
    &&Array.isArray(p.survivors)&&p.survivors.length>0&&p.survivors.length<p.size&&new Set(p.survivors).size===p.survivors.length&&p.survivors.every(i=>validCount(i)&&i<p.size),'world casualty state');
  const factionReports=input.factionReports??[];
  assert(Array.isArray(factionReports)&&factionReports.length<=24&&factionReports.every(r=>recordObject(r)&&Object.keys(r).length===8&&knownPatrols.has(r.patrolId)&&definitions.find(d=>d.id===r.patrolId).factionId===r.factionId
    &&(knownPatrols.has(r.opponentId)||BAND_BY_ID.has(r.opponentId)||isCampId(r.opponentId)||/^ashen:[1-3]:host:[1-9]\d*$/.test(r.opponentId))&&typeof r.opponentName==='string'&&r.opponentName.length<=120
    &&['band','camp','patrol','undead-host'].includes(r.kind)&&['victory','defeat'].includes(r.outcome)&&validCount(r.losses)&&r.losses<=9&&Number.isFinite(r.hour)&&r.hour>=0&&r.hour<=now),'faction reports');
  const worldSkirmishes=input.worldSkirmishes??[],committed=new Set();
  assert(Array.isArray(worldSkirmishes)&&worldSkirmishes.length<=definitions.length,'world skirmishes');
  for(const f of worldSkirmishes){
    assert(recordObject(f)&&Object.keys(f).length===14&&typeof f.id==='string'&&f.id===`skirmish:${f.aId}:${f.bId}:${Math.round(f.startHour*4)}`&&knownPatrols.has(f.aId)&&f.aId!==f.bId
      &&['patrol','band','undead-host'].includes(f.bKind)&&typeof f.bName==='string'&&f.bName.length<=120&&inBounds(f.x,f.y)
      &&Number.isFinite(f.startHour)&&f.startHour>=0&&f.startHour<=now&&Number.isFinite(f.endHour)&&validCount(f.aCycle)&&validCount(f.bCycle),'world skirmish record');
    assert(!committed.has(f.aId)&&!committed.has(f.bId),'world skirmish participants');committed.add(f.aId);committed.add(f.bId);
    const a=normalizedPatrols[f.aId],b=f.bKind==='patrol'?normalizedPatrols[f.bId]:f.bKind==='band'?normalizedBands[f.bId]:ashenWinter.hosts[f.bId];
    assert(b&&a.spawnCycle===f.aCycle&&(f.bKind==='undead-host'?b.force.generation:b.spawnCycle)===f.bCycle,'world skirmish generation');
    const ids=(list,max)=>Array.isArray(list)&&list.length>0&&list.length<=max&&new Set(list).size===list.length&&list.every(i=>validCount(i)&&i<max);
    assert(ids(f.aTroops,definitions.find(d=>d.id===f.aId).size)&&ids(f.bTroops,f.bKind==='patrol'?definitions.find(d=>d.id===f.bId).size:f.bKind==='band'?20:b.force.size),'world skirmish troops');
    assert(JSON.stringify(a.troops)===JSON.stringify(f.aTroops)&&a.behavior==='engaging'&&a.targetId===f.bId,'world skirmish army');
    if(f.bKind==='patrol')assert(JSON.stringify(b.troops)===JSON.stringify(f.bTroops)&&b.behavior==='engaging'&&b.targetId===f.aId,'world skirmish rival');
    if(f.bKind==='undead-host')assert(JSON.stringify(b.force.troops)===JSON.stringify(f.bTroops),'world skirmish host');
    assert(f.endHour===f.startHour+skirmishDuration(f.aTroops.length,f.bTroops.length),'world skirmish duration');
    const r=f.result,survivors=(list,max)=>Array.isArray(list)&&list.length<=max&&new Set(list).size===list.length&&list.every(i=>validCount(i)&&i<max);
    assert(recordObject(r)&&Object.keys(r).length===3&&typeof r.aWins==='boolean'&&survivors(r.aSurvivors,f.aTroops.length)&&survivors(r.bSurvivors,f.bTroops.length)
      &&(r.aWins?r.aSurvivors.length>0:r.bSurvivors.length>0),'world skirmish outcome');
  }
  const factionSimulationHour=input.factionSimulationHour??now;
  assert(Number.isFinite(factionSimulationHour)&&factionSimulationHour>=0&&factionSimulationHour<=now,'faction simulation clock');
  const encounterGraceUntil = input.encounterGraceUntil ?? 0;
  assert(Number.isFinite(encounterGraceUntil) && encounterGraceUntil >= 0
    && encounterGraceUntil <= worldHours(input) + ENCOUNTER_GRACE_HOURS, 'encounter grace');
  const pursuit = input.pursuit === undefined ? null : input.pursuit;
  assert(pursuit === null || BAND_BY_ID.has(pursuit) && input.destination !== null && (bands[pursuit]?.defeatedUntil ?? 0) <= worldHours(input), 'pursuit');
  const destinationAction = input.destinationAction ?? null;
  if (destinationAction !== null) {
    assert(recordObject(destinationAction) && ['town', 'camp', 'caravan', 'patrol', 'rescue', 'deserters', 'bounty', ...UNDEAD_TYPES].includes(destinationAction.type), 'destination action');
    const target = UNDEAD_TYPES.includes(destinationAction.type) ? getUndeadEncounters(input).find(e => e.id === destinationAction.id) : destinationAction.type === 'town' ? (TOWN_BY_ID.has(destinationAction.id) && townBlocked(input, destinationAction.id) && input.destination?.x !== TOWN_BY_ID.get(destinationAction.id).x ? exteriorPoint(TOWN_BY_ID.get(destinationAction.id), SETTLEMENTS) : TOWN_BY_ID.get(destinationAction.id))
      : destinationAction.type === 'patrol' ? getJoinablePatrolBattle(input,destinationAction.id)?.patrol
      : destinationAction.type === 'camp' ? getCampSites(input).find(site => site.id === destinationAction.id)
      : ['rescue','deserters','bounty'].includes(destinationAction.type) ? getQuestEncounter(input)?.id === destinationAction.id ? getQuestEncounter(input) : null
      : getCaravans(input).find(caravan => caravan.id === destinationAction.id && (caravan.status === 'en-route' || caravan.status === 'under-attack'));
    assert(target && input.destination && pursuit === null && !input.battle
      && (['caravan','patrol'].includes(destinationAction.type) || UNDEAD_TYPES.includes(destinationAction.type) || input.destination.x === target.x && input.destination.y === target.y), 'destination action target');
    if (destinationAction.type === 'camp') assert(!target.cleared && destinationAction.generation === target.generation, 'destination camp generation');
  }
  const battle = validateBattle(input.battle, input.party, input);
  assert(!battle || battle.tactic === tactic, 'battle tactic');
  assert(!battle || input.destination === null && pursuit === null && (UNDEAD_TYPES.includes(battle.encounterType) ? Boolean(getUndeadEncounters(input).find(e => e.id === battle.campId)) : battle.encounterType === 'band' ? (bands[battle.campId]?.defeatedUntil ?? 0) <= worldHours(input) : !campRecord(input,battle.campId).cleared), 'battle location');
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
    assert(contract.type === undefined || ['courier', 'supply', 'hunt', 'assault', 'rescue', 'deserters','bounty'].includes(contract.type), 'contract type');
    assert(contract.renown === undefined || ([1, 2, 3].includes(contract.renown)||contract.type==='bounty'&&contract.renown===4), 'contract renown');
    if (contract.type === 'supply') assert(GOOD_BY_ID.has(contract.goodId) && validQuantity(contract.quantity, MAX_CARGO), 'supply requirement');
    if (contract.type === 'hunt' || contract.type === 'assault') assert(isCampId(contract.campId) && contract.from === contract.to && (contract.campGeneration===undefined || validCount(contract.campGeneration) && contract.campGeneration<=1000000), 'hunt requirement');
    else if (contract.type === 'rescue') assert(contract.from === contract.to && contract.rescueId === `rescue-${Number(contract.id.slice(9))}`
      && validPoint(contract.rescuePoint) && [1, 2, 3].includes(contract.rescueDifficulty) && typeof contract.rescued === 'boolean', 'rescue requirement');
    else if(['deserters','bounty'].includes(contract.type))assert(contract.from===contract.to&&contract.deserterId===`${contract.type==='bounty'?'bounty':'deserters'}-${Number(contract.id.slice(9))}`&&validPoint(contract.deserterPoint)&&contract.factionId===soldierFactionAt(TOWN_BY_ID.get(contract.from).x,TOWN_BY_ID.get(contract.from).y).id&&contract.difficulty===3&&typeof contract.defeated==='boolean','deserter requirement');
    else assert(contract.from !== contract.to, 'contract route');
  }
  const inventory = [...input.inventory];
  const conditions = [...inventoryCondition];
  const party = input.party.map(person => normalizeMember({
    id: person.id, name: person.name, background: person.background, seed: person.seed,
    combatRole: person.combatRole ?? 'auto', skillPreference: person.skillPreference ?? 'balanced',
    ...(person.backgroundId === undefined ? {} : { backgroundId: person.backgroundId }),
    ...(person.appearanceId ? { appearanceId: person.appearanceId } : {}),
    traits: [...(person.traits ?? [])],
    hp: person.hp, morale: person.morale,
    equipment: Object.fromEntries(SLOTS.map(slot => [slot, person.equipment[slot] ?? null])),
    reserveEquipment: { weapon: person.reserveEquipment?.weapon ?? null, shield: person.reserveEquipment?.shield ?? null },
    accessories: [...(person.accessories ?? [null, null])],
    throwingAmmo: person.throwingAmmo ? { active: person.throwingAmmo.active, reserve: person.throwingAmmo.reserve } : undefined,
    level: person.level, xp: person.xp, trainingPoints: person.trainingPoints,
    perks: [...(person.perks ?? [])],
    pendingLevelUps: person.pendingLevelUps,
    talents: person.talents?{...person.talents}:undefined,
    attributes: person.attributes ? { ...person.attributes } : undefined,
    armorDurability: person.armorDurability ? { body: person.armorDurability.body, attachment: person.armorDurability.attachment, attachment2:person.armorDurability.attachment2, head: person.armorDurability.head,
      shield: person.armorDurability.shield, reserveShield: person.armorDurability.reserveShield } : undefined,
  }));
  for (const person of party) {
    if (getItem(person.equipment.weapon)?.twoHanded && person.equipment.shield) {
      assert(battle === null && inventory.length < getStashCapacity(input), 'legacy bow and shield');
      inventory.push(person.equipment.shield);
      conditions.push(person.armorDurability.shield);
      person.equipment.shield = null;
      person.armorDurability.shield = 0;
    }
  }
  // Return a new plain state so callers cannot mutate the imported object through aliases.
  return {
    version: 1, seed: input.seed, day: input.day, hour: input.hour,
    ashenWinter,
    gold: input.gold, food: input.food, renown: input.renown,
    party, formation: expandedFormation(formation), reserveIds:[...reserveIds],automation:{buyAmmo:automation.buyAmmo,equipBandages:automation.equipBandages},
    inventory, inventoryCondition: conditions, cargo: { ...cargo },...(input.cargoOrigins===undefined?{}:{cargoOrigins:Object.fromEntries(Object.entries(input.cargoOrigins).map(([id,lots])=>[id,lots.map(lot=>({...lot}))]))}), supplies: { ...supplies },
    marketStock: Object.fromEntries(Object.entries(markets).map(([id, market]) => {
      const town = TOWN_BY_ID.get(id);
      const marketEvent = scheduledTownEvent({ seed: input.seed, day: market.day }, town);
      return [id, {
        day: market.day,
        food: market.food,
        goods: { ...market.goods },
        equipment: { ...Object.fromEntries(Object.entries(defaultArmoryStock({ seed: input.seed, day: market.day }, town)).filter(([itemId]) => ITEM_BY_ID.has(itemId))), ...market.equipment },
        supplies: market.supplies ? { ...market.supplies } : Object.fromEntries(Object.entries(SUPPLY_INFO).map(([kind, info]) => [kind, info.stock])),
        armoryCycle: market.armoryCycle ?? armoryCycle(market.day),
        ...(market.armoryVersion === undefined ? {} : {armoryVersion: market.armoryVersion}),
        appliedEventId: market.appliedEventId === undefined
          ? (marketEvent?.type === 'armorer-shipment' && (input.shipments === undefined
            || shipments[id]?.status === 'delivered' && shipments[id].startDay === marketEvent.startDay) ? marketEvent.id : null)
          : market.appliedEventId,
        buyback: (market.buyback ?? []).map(entry => ({ itemId: entry.itemId, condition: restoredCondition(entry.itemId, entry.condition) })),
      }];
    })),
    deserterBoards:{...deserterBoards},retinue:{...defaultRetinue(),...retinue,members:[...members],scoutLevel,cartLevel:retinue.cartLevel??0,bountyBoards:{...retinue.bountyBoards}},discoveryRolls:Object.fromEntries(Object.entries(discoveryRolls).map(([id,roll])=>[id,{...roll}])),
    shipments: normalizedShipments,
    shipmentLegacyThroughDay,
    ...(input.mountRewards === undefined ? {} : { mountRewards: { ...mountRewards } }),
    camps: Object.fromEntries(Object.entries(camps).map(([id, entry]) => [id, { clearedDay:entry.clearedDay,respawnAt:entry.respawnAt??(entry.clearedDay?(entry.clearedDay-1)*24+(CAMP_BY_ID.has(id)?120:72):null),generation:entry.generation??0 }])),
    worldLayoutVersion: WORLD_LAYOUT_VERSION,
    factionPatrols:normalizedPatrols, worldSkirmishes:structuredClone(worldSkirmishes), worldLosses:structuredClone(worldLosses), factionReports:structuredClone(factionReports), factionSimulationHour,
    bands: normalizedBands, pursuit, encounterGraceUntil, tactic,
    battle, gameOver,
    position: { x: input.position.x, y: input.position.y },
    destination: input.destination ? { x: input.destination.x, y: input.destination.y } : null,
    destinationAction: destinationAction ? { type: destinationAction.type, id: destinationAction.id, ...(destinationAction.type === 'camp' ? { generation: destinationAction.generation } : {}) } : null,
    contract: input.contract ? { id: input.contract.id, type: input.contract.type ?? 'courier', from: input.contract.from, to: input.contract.to, reward: input.contract.reward, renown: input.contract.renown ?? 1, ...(input.contract.type === 'supply' ? { goodId: input.contract.goodId, quantity: input.contract.quantity } : {}), ...(['hunt', 'assault'].includes(input.contract.type) ? { campId: input.contract.campId, campGeneration: input.contract.campGeneration??0 } : {}), ...(input.contract.type === 'rescue' ? { rescueId: input.contract.rescueId, rescuePoint: { ...input.contract.rescuePoint }, rescueDifficulty: input.contract.rescueDifficulty, rescued: input.contract.rescued } : {}), ...(['deserters','bounty'].includes(input.contract.type)?{deserterId:input.contract.deserterId,deserterPoint:{...input.contract.deserterPoint},factionId:input.contract.factionId,difficulty:3,defeated:input.contract.defeated}:{}), acceptedDay: input.contract.acceptedDay } : null,
    contractSerial: input.contractSerial, recruitSerial: input.recruitSerial, hiredRecruitOffers: [...hiredRecruitOffers],
    log: [...input.log], visited: [...input.visited],
  };
}


export function getDiscoveryEvent(state) { return discoveryEvent(state); }
export function getRetinue(state) {
  return {unlocked:!!state.retinue?.bountyHunterUnlocked,hired:!!state.retinue?.bountyHunter,cost:BOUNTY_HUNTER_COST,championBonus:5};
}
export function hireBountyHunter(state) {
  const blocked=actionBlocked(state);if(blocked)return blocked;
  const access=requireTown(state);if(access.error)return access.error;
  if(!state.retinue?.bountyHunterUnlocked)return result(false,'Complete a wanted champion contract first.');
  if(state.retinue.bountyHunter)return result(false,'The Bounty Hunter already serves your company.');
  if(state.gold<BOUNTY_HUNTER_COST)return result(false,'The Bounty Hunter requires 5,000 crowns.');
  state.gold-=BOUNTY_HUNTER_COST;state.retinue.bountyHunter=true;
  const message='Bounty Hunter hired: permanent +5 percentage points to champion encounter chance. No formation slot or daily wage.';
  record(state,message);return result(true,message);
}
