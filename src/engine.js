import { WARRIOR_STAGES, freezeLegacyWarrior, warriorReady } from './legacy-warrior.js';
import { LEGACY_STAGES, initialLegacy, legacyStageReady, recordLegacyContract, recordLegacyVictory, validateLegacy } from './company-legacy.js';
import { EQUIPMENT_EFFECTS_VERSION, hasBonePlating, bonePlatingReady, bonePlatingAbsorbs, livingShieldRegeneration } from './equipment-specials.js';
import { PERFORMANCE_KEYS, newBattlePerformance, recordBattlePerformance } from './battle-performance.js';
import {PREVIOUS_SHIELDS,previousShieldDefinitions,migrateShieldBalance,rebalanceShieldCondition} from './shield-balance.js';
import { EQUIPMENT_SET_RULES_VERSION, isEquipmentSetRulesVersion, effectiveArmorFatigue, effectiveAttachmentFatigue, createSetArmorSnapshot, baseArmorCondition, validSetArmorSnapshot } from './equipment-sets.js';
import { equipmentPerkUpgrade, equipmentPerk, equipmentBoost, equipmentRangedReach, rollAttachment } from './item-affixes.js';
import { recordQuestCompletion } from './quest-completion.js';
import { BLACKSMITH_STAGES, initialBlacksmith, blacksmithIndex, blacksmithUnlocked, discoverBlacksmith, blacksmithEncounters, validateBlacksmith } from './legendary-blacksmith.js';
import { resolveForgeItem, extractForgeAffixes, forgeBaseline, encodeBoundedForgeItem, mergeForgeAffixes, flattenForgeAffixes, forgeAffixOptions, forgeCraftsmanshipOption, forgeAffixName, forgeRecipe, forgeProfileRows, isNamedItem, isForgeSlot } from './reforged-items.js';
import { copyInjuries, INJURY_BY_ID, injuryStat, injuryMultiplier, injuryAdjustment, injuryRange, freshInjuryBleeding, injuryHealingRange, injuryRemainingDays, injuryDailyMedicine, validInjuries, attackInjuryPool, eligibleInjuries } from './injuries.js';
import { isSimultaneousBetaEnabled } from './combat-config.js';
import { SimultaneousPathQueue, SIM_STEP_MS, SIM_ROUND_MS, initialSimultaneousClock, simultaneousPriority, simultaneousActionDelay, simultaneousEventDuration, simultaneousEvents, markSimultaneousEffect, expireSimultaneousEffects, rememberSimultaneousEvent, validateSimultaneousClock } from './simultaneous-combat.js';
import { revealWorld, validExploration } from './world-fog.js';
import {RETINUE_MEMBERS,hasRetinue,getScoutLevel,getBandAwarenessMultiplier,defaultRetinue} from './retinue.js';
export {RETINUE_MEMBERS,hasRetinue,getScoutLevel,getBandAwarenessMultiplier} from './retinue.js';
import { landmarkCampPoint } from './world-landmarks.js';
import { worldBlocked, worldSegmentClear, worldRoute, moveWorldToward, nearestWorldPoint } from './world-navigation.js';
import { armoryTheme, isAncientHelmet, matchesArmoryTheme } from './armory-themes.js';
import { NAMED_WEAPONS } from './named-weapons.js';
import { rollNamedItem } from './named-rolls.js';
// Pure game rules for the offline overworld. The UI owns rendering and real time.
import { createBattleField, DEPLOYMENT_ROW_OFFSET, blockedTerrain, legacyBattleField, tileAt, hexDistance, hexNeighbors, movementCost, heightHitModifier, rangedCoverModifier } from './battle-terrain.js';
import { ADDITIONAL_ITEMS } from './additional-items.js';
import { ARMOR_ATTACHMENTS } from './armor-attachments.js';
import { NORTHERN_ITEMS } from './northern-items.js';
import { FANTASY_ITEMS } from './fantasy-items.js';
import { DLC_ITEMS } from './dlc-items.js';
import { DLC_SHIELDS } from './dlc-shields.js';
import { DIREWOLF_HELMET_ITEMS, direwolfHelmetRecipe } from './direwolf-helmets.js';
import { MOONFANG_ITEM, MOONFANG_ID, MOONFANG_FEE, DIREWOLF_HIDE, DIREWOLF_MAIL, direwolfCraftRoll } from './direwolf-crafting.js';
import { RESTORED_ANCIENT_ITEMS, ancientRestorationRecipe, restoredAncientId, ancientRestorationRolls } from './ancient-restoration.js';
import { WORLD_ENEMY_PROFILES, worldEnemyTemplates, worldCampText, regionalOutfit, enemyRoleBonuses, ancientCampAt, ancientEnemies } from './regional-enemies.js';
import { REGIONAL_SETTLEMENTS, WORLD_LIMITS, FRONTIER_CAMP_CELLS, REGIONS, regionAt, roadNetwork, distanceToRoad, WORLD_LAYOUT_VERSION, compactPoint, authoredPoint } from './geography.js';
import { FRONTIER_ITEMS } from './frontier-items.js';
import { MOUNTS } from './mounts.js';
import { factionPatrols, soldierFactionAt, patrolDefinitions, initialPatrolProgress, advanceFactionSimulation, worldSkirmishFor, isJoinablePatrolSkirmish, patrolSkirmishSide, cancelWorldSkirmish, skirmishDuration } from './faction-patrols.js';
import { cityMountOffer, campMountReward, regionalMountPool } from './mount-distribution.js';
import { getMountRewardDefinitions, scheduledMountReward } from './mount-events.js';
import { enemyProgression, enemyRosterSize } from './enemy-progression.js';
import { getRegionalCampText } from './enemy-rosters.js';
import { PERKS, PERK_BY_ID, REMOVED_PERK_MIN_LEVEL, hasPerk as learnedPerk, weaponTrainingVisual, weaponMasteryMatches } from './perks.js';
import { RECRUIT_BACKGROUND_BY_ID, RECRUIT_TRAIT_BY_ID, makeRecruitProfile, makeRecruitName, makeTalents, talentGain } from './recruits.js';
import { BOUNTY_HUNTER_COST, CHAMPION_BOUNTY, discoveryEvent, discoveryBonuses, championRoster, championExtraGear, bountyOffer } from './discovery.js';
import { deserterOffer, deserterEncounter, deserterEquipmentReward } from './deserters.js';
import { ARMORY_STOCK_VERSION, townFacilities, townArmoryBudget, townDesign } from './town-facilities.js';
import { scheduledTownEvent, townEventHash, townEventModifiers } from './town-events.js';
import { CARAVAN_ATTACK_WARNING_HOURS, CARAVAN_SHORTAGE_HOURS, CARAVAN_TRAVEL_HOURS, routeSegmentDistance, shipmentId, shipmentPlan, shipmentPosition } from './caravans.js';
import { ASHEN_CONFIG, initialAshenWinter, crisisHash } from './crisis-director.js';
import { settlementAccess } from './settlement-access.js';
import { UNDEAD_TYPES, allSettlementsCaptured, advanceAshenWinter, ashenEncounterRecords, exteriorPoint, resolveAshenObjective, recordAshenCasualties, npcAshenVictory, validateAshenWinter } from './undead-crisis.js';
import { COMBAT_SKILLS, WEAPON_ACTIONS, equipmentSkills, weaponSkillFamily } from './combat-skills.js';
import { evaluateAreaSafety, compareAreaSafety } from './area-safety.js';
import { COMBAT_ROLES, SKILL_PREFERENCES, resolveCombatRole, isAffordableAction, rankTacticalActions, enemyBattleTactic, updateEnemyTactic, ENEMY_TACTICS, tacticalTargetPriority, rangedScreenModifier, shouldPreserveBrother } from './tactical-ai.js';

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
  { id: 'buckler', name: 'Buckler', slot: 'shield', visual: 'round', price: 60, armor: 10, defense: 10, rangedDefense: 5, durability: 16, fatigue: 4, description: 'Light protection for a quick fighter.' },
  { id: 'round-shield', name: 'Round Shield', slot: 'shield', visual: 'round', price: 120, armor: 15, defense: 15, rangedDefense: 15, durability: 24, fatigue: 10, description: 'Wood and iron across the forearm.' },
  { id: 'kite-shield', name: 'Kite Shield', slot: 'shield', visual: 'kite', price: 220, armor: 15, defense: 15, rangedDefense: 25, durability: 48, fatigue: 16, description: 'Broad cover for a crowded road.' },
  ...ADDITIONAL_ITEMS,
  ...ARMOR_ATTACHMENTS,
  ...NORTHERN_ITEMS,
  ...FANTASY_ITEMS,
  ...MOUNTS,
  ...FRONTIER_ITEMS,
  ...DLC_ITEMS,
  ...DLC_SHIELDS,
  ...RESTORED_ANCIENT_ITEMS,
  MOONFANG_ITEM,
  ...DIREWOLF_HELMET_ITEMS,
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

const ITEM_BY_ID = new Map([...ITEMS,...previousShieldDefinitions(ITEMS)].map(item => [item.id, item]));
const FAMED_ID = /^(famed9|famed8|famed7|famed6|famed5|famed4|famed3|famed2|famed):([a-z0-9-]{1,40}):(0|[1-9][0-9]{0,9})$/;
const FAMED_NAMES = ['Ashen', 'Blackthorn', 'Dawnward', 'Grimwolf', 'Ironbound', 'Oathkeeper', 'Ravenmark', 'Stormborn', 'Thornheart', 'Wolfguard'];

export function createFamedItemId(baseId, seed, rulesVersion) {
  const base=ITEM_BY_ID.get(baseId),rangedWeapon=base?.slot==='weapon'&&(base.ranged??base.sourceStats?.ranged)===true;
  const version=rulesVersion??(base?.slot==='attachment'?5:9);
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(version) || version===4&&!rangedWeapon || version===6&&base?.slot!=='attachment' || [7,9].includes(version)&&base?.slot==='attachment' || version===8&&!['armor','helmet'].includes(base?.slot) || base?.slot==='attachment'&&version<5 || !base || ['accessory', 'mount'].includes(base.slot) || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new TypeError('Invalid famed item base or seed.');
  return `${version===1?'famed':`famed${version}`}:${baseId}:${seed}`;
}

const affixItemCache = new Map();
function berserkAp(actor){return 4+equipmentBoost(actor,'berserkAp',getItem);}
export function hasEquipmentPerk(actor,id){return hasPerk(actor,id);}
export function getTurnAp(actor){return Math.max(0,9+injuryAdjustment(actor,'ap')+equipmentBoost(actor,'actionPoints',getItem));}
function carriedAffixBoost(unit,key,cap){return Math.min(cap,[...Object.values(unit.equipment),...Object.values(unit.reserveEquipment??{}),unit.pocketStowedWeapon].reduce((sum,id)=>sum+(getItem(id)?.perkBoosts?.[key]??0),0));}
function savedApLimit(unit,battle){return battle.rulesVersion===2?13+(battle.itemAffixRulesVersion>=1?carriedAffixBoost(unit,'berserkAp',2):0)+(battle.itemAffixRulesVersion===2?carriedAffixBoost(unit,'actionPoints',1):0):2;}
function hasPerk(actor,id){return learnedPerk(actor,id)||equipmentPerk(actor,id,getItem);}
function perkUpgraded(actor,id){return equipmentPerkUpgrade(actor,id,getItem);}
function relentlessFactor(actor){return hasPerk(actor,'relentless')?(perkUpgraded(actor,'relentless')?.25:.5):1;}
function battleSwapCost(actor,battle){return hasPerk(actor,'quick-hands')&&actor.freeSwapRound!==battle.round?0:perkUpgraded(actor,'quick-hands')?2:4;}
let simultaneousItemCache = null;
const simultaneousActionCaches = new WeakMap();
export function getItem(id) {
  if(simultaneousItemCache?.has(id))return simultaneousItemCache.get(id);
  const item=resolveItem(id);
  simultaneousItemCache?.set(id,item);
  return item;
}
function resolveItem(id) {
  const base = ITEM_BY_ID.get(id);
  if (base) return base;
  if(typeof id==='string'&&/^forge[1-5]:/.test(id))return resolveForgeItem(id,key=>ITEM_BY_ID.get(key));
  if (typeof id !== 'string' || id.length > 80) return undefined;
  if(affixItemCache.has(id))return affixItemCache.get(id);
  const match = FAMED_ID.exec(id);
  if (!match) return undefined;
  const original = ITEM_BY_ID.get(match[2]);
  const seed = Number(match[3]);
  if (!original || ['accessory', 'mount'].includes(original.slot) || original.slot==='attachment'&&!['famed5','famed6'].includes(match[1]) || match[1]==='famed6'&&original.slot!=='attachment' || match[1]==='famed8'&&!['armor','helmet'].includes(original.slot) || match[1]==='famed4'&&!(original.ranged??original.sourceStats?.ranged) || !Number.isSafeInteger(seed) || seed > 0xffffffff) return undefined;
  if(['famed5','famed6','famed7','famed8','famed9'].includes(match[1])) {
    const item=original.slot==='attachment'?rollAttachment(original,id,seed,{champion:match[1]==='famed6'}):rollNamedItem(original,id,seed,{merged:true,rangeRoll:true,rulesVersion:Number(match[1].slice(5)),shieldDurability:original.sourceNamedShield?original.sourceStats.durability:shieldMaximum(original.id),shieldDamage:shieldImpactDamage(original.sourceStats?{...original,...original.sourceStats}:original)});
    if(affixItemCache.size>=2048)affixItemCache.delete(affixItemCache.keys().next().value);affixItemCache.set(id,item);return item;
  }
  if(match[1]==='famed2'||match[1]==='famed3'||match[1]==='famed4')return rollNamedItem(original,id,seed,{merged:match[1]==='famed3'||match[1]==='famed4',rangeRoll:match[1]==='famed4',rulesVersion:Number(match[1].slice(5)),shieldDurability:original.sourceNamedShield?original.sourceStats.durability:shieldMaximum(original.id),shieldDamage:shieldImpactDamage(original.sourceStats?{...original,...original.sourceStats}:original)});
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
    if(Object.hasOwn(PREVIOUS_SHIELDS,original.id))item.rangedDefense=(original.rangedDefense??original.defense??0)+2+roll(0)%4;
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


// Legendary side quests are independent of the ordinary contract slot.
function blacksmithEncounter(state,stage,acceptedDay,{shieldDesigns=true}={}){
 const town=TOWN_BY_ID.get('ironford'),spec=BLACKSMITH_STAGES[stage-1],seed=hashSeed(`${state.seed}:blacksmith:${stage}:${acceptedDay}:v1`);
 const radii=stage===2?[210,270,330]:stage===3?[470,530,610]:[680,740,810];let point=null;
 for(const radius of radii)for(let j=0;j<24&&!point;j++){
  const angle=(seed%360+j*15)*Math.PI/180,candidate=nearestWorldPoint({x:clamped(town.x+Math.cos(angle)*radius,WORLD_BOUNDS.minX+30,WORLD_BOUNDS.maxX-30),y:clamped(town.y+Math.sin(angle)*radius,WORLD_BOUNDS.minY+30,WORLD_BOUNDS.maxY-30)});
  if(candidate&&worldRoute(town,candidate)&&SETTLEMENTS.every(t=>distance(t,candidate)>TOWN_RADIUS+65)&&CAMP_SITES.every(c=>distance(c,candidate)>95))point=candidate;
 }
 if(!point)throw new TypeError('No reachable blacksmith quest site.');
 const pool=stage===3?ancientEnemies(3):worldEnemyTemplates(point.x,point.y,spec.difficulty);
 const enemies=Array.from({length:spec.size},(_,i)=>regionalOutfit(pool[(i+seed%pool.length)%pool.length],`blacksmith:${seed}`,i,point.x,point.y,spec.difficulty,{champions:false,shieldDesigns,...(stage===3?{theme:'ancient'}:{})}));
 if(stage===4){enemies[0]={...enemies[0],name:'The Collector',weapon:createFamedItemId('arming-sword',hashSeed(`${seed}:collector`),3),champion:true};enemies[0].championItemId=enemies[0].weapon;}
 return {id:`blacksmith-${stage}-${seed}`,...(shieldDesigns?{shieldDesignsVersion:1}:{}),name:spec.site,kind:'blacksmith',...point,difficulty:spec.difficulty,enemies,reward:100+spec.difficulty*95,acceptedDay,ancient:stage===3};
}
export function getBlacksmithQuestEncounters(state){return blacksmithEncounters(state);}
export function checkBlacksmithDiscovery(state){
 const discovered=discoverBlacksmith(state,getItem);
 if(discovered)record(state,'Word of your named collection has reached Odran, the Last Ember. Visit the Legendary Blacksmith in Ironford. Restore his forge with 8 Iron, 6 Timber and 10 Tools.');
 return discovered;
}
export function acknowledgeBlacksmithSummons(state){const c=state.legendaryBlacksmith;if(!c||c.announcement!=='pending')return result(false,'There is no pending summons.');c.announcement='read';return result(true,'Odran’s directions remain in Side quests.');}
export function getLegendaryBlacksmith(state){
 const c=state.legendaryBlacksmith??initialBlacksmith(),index=blacksmithIndex(state),q=index>=0?c.quests[index]:null;
 const materials={iron:state.cargo.iron??0,timber:state.cargo.timber??0,tools:state.supplies.tools};
 return {...structuredClone(c),discovered:c.triggeredDay!==null,unlocked:blacksmithUnlocked(state),stage:index+1,quest:index>=0?{...BLACKSMITH_STAGES[index],...structuredClone(q),ready:q.status==='ready'||index===0&&q.status==='active'&&materials.iron>=8&&materials.timber>=6&&materials.tools>=10}:null,materials,town:TOWN_BY_ID.get('ironford'),access:getSettlementAccess(state,'ironford')};
}
function blacksmithAccess(state){const blocked=actionBlocked(state);if(blocked)return blocked;const access=requireTown(state);if(access.error)return access.error;if(access.town.id!=='ironford'||state.destination)return result(false,'Visit Odran’s forge in Ironford.');if(state.legendaryBlacksmith?.triggeredDay===null||!state.legendaryBlacksmith)return result(false,'Odran has not sent his summons yet. Own five named items and wait for the next daily discovery check.');return null;}
export function acceptBlacksmithQuest(state,stage){
 const blocked=blacksmithAccess(state);if(blocked)return blocked;
 const c=state.legendaryBlacksmith,index=blacksmithIndex(state);if(stage!==index+1||c.quests[index]?.status!=='offered')return result(false,'That side quest is not available to accept.');
 const encounter=stage>1?blacksmithEncounter(state,stage,state.day):null;
 Object.assign(c.quests[index],{status:'active',acceptedDay:state.day,encounter,survivors:encounter?encounter.enemies.map((_,i)=>i):null});
 const message=`Accepted ${BLACKSMITH_STAGES[index].name}. ${BLACKSMITH_STAGES[index].objective}`;record(state,message);return result(true,message);
}
export function turnInBlacksmithQuest(state,stage){
 const blocked=blacksmithAccess(state);if(blocked)return blocked;
 const c=state.legendaryBlacksmith,index=blacksmithIndex(state),view=getLegendaryBlacksmith(state);
 if(stage!==index+1||!view.quest?.ready)return result(false,'Finish this side quest’s objective before returning to Odran.');
 if(stage===1){consumeCargoOrigins(state,'iron',8,'ironford');consumeCargoOrigins(state,'timber',6,'ironford');state.cargo.iron-=8;state.cargo.timber-=6;if(!state.cargo.iron)delete state.cargo.iron;if(!state.cargo.timber)delete state.cargo.timber;state.supplies.tools-=10;}
 c.quests[index].status='turnedIn';state.gold=Math.min(1000000000,state.gold+BLACKSMITH_STAGES[index].reward);
 if(stage<4)c.quests[index+1].status='offered';else{c.freeUse=true;c.rewardId=createFamedItemId('arming-sword',hashSeed(`${state.seed}:blacksmith:reward:v1`),3);}
 const message=stage===4?'Odran’s forge is restored. Named merging and full transfers are unlocked; your first reforge is free. Claim the named sword at the forge.':`Odran pays ${BLACKSMITH_STAGES[index].reward} crowns. Next: ${BLACKSMITH_STAGES[index+1].name}. ${BLACKSMITH_STAGES[index+1].objective}`;
 record(state,message);recordQuestCompletion(state,`blacksmith-${stage}`);return result(true,message);
}
export function claimBlacksmithReward(state){
 const blocked=blacksmithAccess(state);if(blocked)return blocked;const c=state.legendaryBlacksmith;
 if(!blacksmithUnlocked(state)||c.rewardClaimed||!c.rewardId)return result(false,'There is no unclaimed forge reward.');
 if(state.inventory.length>=getStashCapacity(state))return result(false,'Free one stash slot to claim Odran’s named sword.');
 state.inventory.push(c.rewardId);state.inventoryCondition.push(itemCondition(c.rewardId));c.rewardClaimed=true;return result(true,'Odran’s named sword joins the stash.');
}
function recordBlacksmithBattle(state,battle){
 const c=state.legendaryBlacksmith,index=c?.quests.findIndex(q=>q.status==='active'&&q.encounter?.id===battle.campId);if(index===undefined||index<1)return;
 const q=c.quests[index],units=battle.units.filter(u=>u.side==='enemy');
 const success=battle.status==='victory'&&(index!==3||!q.survivors.includes(0)||units.some(u=>u.champion&&!u.alive&&!u.escaped));
 if(success){q.status='ready';q.survivors=[];q.damage={};record(state,`${BLACKSMITH_STAGES[index].name}: quest object recovered. Return to Odran in Ironford to turn it in.`);return;}
 q.survivors=units.filter(u=>u.alive||u.escaped).map(u=>Number(u.id.slice(6))-1);
 if(!q.survivors.length){q.survivors=[0];q.damage={};}else q.damage=Object.fromEntries(units.filter(u=>u.alive||u.escaped).map(u=>[Number(u.id.slice(6))-1,{hp:u.escaped?u.maxHp:u.hp,bodyArmor:baseArmorCondition(u,'body'),headArmor:baseArmorCondition(u,'head'),shieldDurability:u.shieldDurability}]));
 record(state,`${BLACKSMITH_STAGES[index].name} remains active. Surviving guards and their worn equipment await a retry.`);
}
const forgeCatalog=id=>ITEM_BY_ID.get(id);
function forgeStamp(state){return JSON.stringify([state.inventory,state.inventoryCondition,state.gold,state.cargo,state.cargoOrigins,state.legendaryBlacksmith?.forgeSerial,state.legendaryBlacksmith?.freeUse,state.legendaryBlacksmith?.quests[3].status]);}
export function getReforgeQuote(state,donorIndex,recipientIndex,mode){
 const blocked=blacksmithAccess(state);if(blocked)return {...blocked};
 if(!blacksmithUnlocked(state))return result(false,'Complete Odran’s four side quests to unlock reforging.');
 if(!Number.isSafeInteger(donorIndex)||!Number.isSafeInteger(recipientIndex)||donorIndex===recipientIndex||donorIndex<0||recipientIndex<0)return result(false,'Choose two different stash copies.');
 const donor=getItem(state.inventory[donorIndex]),recipient=getItem(state.inventory[recipientIndex]);
 if(!isNamedItem(donor)||!isForgeSlot(donor.slot)||!recipient||recipient.slot!==donor.slot)return result(false,'Sacrifice named gear to another item in the same category. All weapon classes are compatible.');
 const expectedMode=isNamedItem(recipient)?'merge':'transfer';if(mode!==expectedMode)return result(false,expectedMode==='merge'?'Named recipients use accumulating merges.':'Ordinary recipients receive a full transfer.');
 const source=extractForgeAffixes(donor,forgeCatalog,{shieldMaximum,shieldDamage:shieldImpactDamage}),existing=mode==='merge'?extractForgeAffixes(recipient,forgeCatalog,{shieldMaximum,shieldDamage:shieldImpactDamage}):null,base=ITEM_BY_ID.get(recipient.baseId??recipient.id);
 if(!source||mode==='merge'&&!existing||!base)return result(false,'This enhancement package cannot be reforged safely.');
 const c=state.legendaryBlacksmith;if(c.forgeSerial>=1000000)return result(false,'The forge record is full.');
 let affixes=source,additions=[...source.prefixes.map(affix=>({kind:'prefix',affix})),...source.suffixes.map(affix=>({kind:'suffix',affix}))];
 if(mode==='merge'){
  if(source.locked||existing.locked)return {...result(false,'Legacy reforged gear keeps its bonuses, but further merges are locked. Full transfers preserve this restriction.'),donorAffixes:source,recipientAffixes:existing};
  const merge=mergeForgeAffixes(source,existing,recipient,hashSeed(`${state.seed}:forge:${c.forgeSerial}:${donor.id}:${recipient.id}`));
  if(!merge.selected.length)return {...result(false,'This donor has no applicable improvement: slots are full, rolls are already as strong, or effects are inactive.'),donorAffixes:source,recipientAffixes:existing,blockedAffixes:merge.options};
  affixes=merge.affixes;additions=merge.selected;
 }
 let resultId;try{resultId=encodeBoundedForgeItem(base.id,affixes,forgeCatalog);}catch{return result(false,'This combination is outside the forge’s safety bounds.');}
 const forged=getItem(resultId),oldMax=itemCondition(recipient.id),newMax=itemCondition(resultId),current=state.inventoryCondition[recipientIndex];
 const condition=oldMax===null?null:recipient.throwing?Math.min(newMax,current):Math.max(0,newMax-(oldMax-current));
 const fee=c.freeUse?0:1000;
 // Charge the eligible recipe, not the hidden random outcome: costs cannot reveal or reroll the result.
 const options=mode==='merge'?[...forgeAffixOptions(source,existing,recipient),forgeCraftsmanshipOption(source,existing,recipient)].filter(o=>o?.eligible):additions;
 const materials=c.freeUse?{}:forgeRecipe(options),materialsAvailable=Object.entries(materials).every(([id,n])=>(state.cargo[id]??0)>=n);
 const selected=[...new Set(additions.flatMap(a=>Object.keys(a.affix.profile)))];
 const possible=mode==='merge'?options.map(o=>({label:forgeAffixName(o.kind,o.affix),value:o.kind==='foundation'?forgeProfileRows(o.affix.profile,recipient).map(r=>`${r.label} ${r.value}`).join('; '):o.upgrade?'Stronger roll · replaces the existing roll':'New affix · occupies one slot'})):forgeProfileRows(flattenForgeAffixes(source),forged);
 return {ok:true,message:mode==='merge'?'Keeps the stronger craftsmanship bonuses and inherits eligible affixes within two prefix and two suffix slots. Duplicate rolls improve without adding together.':'Transfers the donor’s complete package, including slot usage and inactive effects.',mode,donorIndex,recipientIndex,donor,recipient,result:forged,resultId,condition,fee,materials,materialsAvailable,ownedMaterials:{...state.cargo},donorAffixes:source,recipientAffixes:existing,affordable:state.gold>=fee&&materialsAvailable,stamp:forgeStamp(state),selected,additions,possible,warnings:forged.forgeWarnings};
}
export function reforgeItem(state,quote){
 if(!quote||!quote.ok)return result(false,'Select a valid reforge before confirming.');
 const fresh=getReforgeQuote(state,quote.donorIndex,quote.recipientIndex,quote.mode);
 if(!fresh.ok)return fresh;
 if(fresh.stamp!==quote.stamp||fresh.resultId!==quote.resultId||fresh.fee!==quote.fee)return result(false,'The stash, cargo or forge quote changed. Review the new preview before destroying anything.');
 if(!fresh.materialsAvailable)return result(false,'Bring the required trading goods in cargo before reforging.');
 if(!fresh.affordable)return result(false,`Odran requires ${fresh.fee} crowns.`);
 const ids=[...state.inventory],conditions=[...state.inventoryCondition];ids[fresh.recipientIndex]=fresh.resultId;conditions[fresh.recipientIndex]=fresh.condition;
 ids.splice(fresh.donorIndex,1);conditions.splice(fresh.donorIndex,1);
 for(const [id,n]of Object.entries(fresh.materials)){consumeCargoOrigins(state,id,n,'ironford');state.cargo[id]-=n;if(!state.cargo[id])delete state.cargo[id];}
 state.inventory=ids;state.inventoryCondition=conditions;state.gold-=fresh.fee;state.legendaryBlacksmith.freeUse=false;state.legendaryBlacksmith.forgeSerial++;
 const added=fresh.additions.length?fresh.additions.map(a=>({label:forgeAffixName(a.kind,a.affix),value:a.upgrade&&a.kind!=='foundation'?'Stronger roll':forgeProfileRows(a.affix.profile,fresh.result).map(r=>r.value+(r.inactive?` · inactive: ${r.inactive}`:'')).join('; ')})):forgeProfileRows(fresh.result.forgeProfile,fresh.result);
 const message=`Odran destroys ${fresh.donor.name} and reforges ${fresh.recipient.name}. ${added.map(r=>`${r.label} ${r.value}`).join('; ')}.`;
 record(state,message.slice(0,470));return {...result(true,message),itemId:fresh.resultId,added};
}

function direwolfCraftStamp(state) {
  return JSON.stringify([state.seed, state.direwolfCraftSerial ?? 0, state.inventory, state.inventoryCondition, state.gold, townAt(state)?.id, state.destination]);
}
export function getDirewolfHelmetQuote(state, recipeId, indices) {
  const blocked = actionBlocked(state); if (blocked) return blocked;
  const access = requireTown(state); if (access.error) return access.error;
  if (state.destination) return result(false, 'Stop at the settlement to visit its Armorer.');
  if ((state.direwolfCraftSerial ?? 0) >= 1000000) return result(false, 'The direwolf crafting record is full.');
  const recipe = direwolfHelmetRecipe(recipeId);
  if (!recipe || !Array.isArray(indices) || indices.length !== recipe.materialIds.length || new Set(indices).size !== indices.length || indices.some(index => !Number.isSafeInteger(index) || index < 0 || index >= state.inventory.length)) return result(false, 'Choose the exact stash pieces required by this helmet recipe.');
  if (indices.some((index, i) => state.inventory[index] !== recipe.materialIds[i])) return result(false, 'Use the original recipe designs. Added named workmanship and reforged variants cannot be used as materials.');
  if (!Array.isArray(state.inventoryCondition) || state.inventoryCondition.length !== state.inventory.length) return result(false, 'The stash condition record must be repaired before crafting.');
  return { ok: true, recipeId, indices: [...indices], fee: recipe.fee, affordable: state.gold >= recipe.fee, item: getItem(recipe.itemId), stamp: JSON.stringify([recipeId, direwolfCraftStamp(state)]) };
}
export function craftDirewolfHelmet(state, quote) {
  if (!quote?.ok) return result(false, 'Review a valid helmet recipe first.');
  const fresh = getDirewolfHelmetQuote(state, quote.recipeId, quote.indices);
  if (!fresh.ok) return fresh;
  if (fresh.stamp !== quote.stamp) return result(false, 'The stash or helmet quote changed. Review it before consuming any pieces.');
  if (!fresh.affordable) return result(false, `The Armorer requires ${fresh.fee} crowns.`);
  const roll = direwolfCraftRoll(state.seed, state.direwolfCraftSerial ?? 0);
  const itemId = roll.named ? createFamedItemId(fresh.item.id, roll.namedSeed) : fresh.item.id;
  const maximum = itemCondition(itemId), consumed = new Set(fresh.indices);
  const inventory = state.inventory.filter((_, index) => !consumed.has(index));
  const conditions = state.inventoryCondition.filter((_, index) => !consumed.has(index));
  inventory.push(itemId); conditions.push(maximum);
  state.inventory = inventory; state.inventoryCondition = conditions;
  state.gold -= fresh.fee; state.direwolfCraftSerial = (state.direwolfCraftSerial ?? 0) + 1;
  const message = `The Armorer crafts ${getItem(itemId).name}. ${fresh.indices.length} ${fresh.indices.length === 1 ? 'piece' : 'pieces'} and ${fresh.fee} crowns consumed.`;
  record(state, message); return { ...result(true, message), itemId, named: roll.named };
}
export function getDirewolfCraftQuote(state, hideIndex, mailIndex) {
  const blocked = actionBlocked(state); if (blocked) return blocked;
  const access = requireTown(state); if (access.error) return access.error;
  if (state.destination) return result(false, 'Stop at the settlement to visit its Armorer.');
  if ((state.direwolfCraftSerial ?? 0) >= 1000000) return result(false, 'The direwolf crafting record is full.');
  if (![hideIndex, mailIndex].every(index => Number.isSafeInteger(index) && index >= 0 && index < state.inventory.length) || hideIndex === mailIndex || state.inventory[hideIndex] !== DIREWOLF_HIDE || state.inventory[mailIndex] !== DIREWOLF_MAIL) return result(false, 'Choose one ordinary Direwolf Hide Armor and one ordinary Direwolf Mail Armor from your stash.');
  if (!Array.isArray(state.inventoryCondition) || state.inventoryCondition.length !== state.inventory.length) return result(false, 'The stash condition record must be repaired before crafting.');
  return { ok: true, hideIndex, mailIndex, fee: MOONFANG_FEE, affordable: state.gold >= MOONFANG_FEE, item: MOONFANG_ITEM, stamp: direwolfCraftStamp(state) };
}
export function craftDirewolfMoonfang(state, quote) {
  if (!quote?.ok) return result(false, 'Review a valid direwolf recipe first.');
  const fresh = getDirewolfCraftQuote(state, quote.hideIndex, quote.mailIndex);
  if (!fresh.ok) return fresh;
  if (fresh.stamp !== quote.stamp) return result(false, 'The stash or crafting quote changed. Review it before consuming any pieces.');
  if (!fresh.affordable) return result(false, `The Armorer requires ${MOONFANG_FEE} crowns.`);
  const roll = direwolfCraftRoll(state.seed, state.direwolfCraftSerial ?? 0);
  const itemId = roll.named ? createFamedItemId(MOONFANG_ID, roll.namedSeed) : MOONFANG_ID;
  const maximum = itemCondition(itemId);
  const consumed = new Set([fresh.hideIndex, fresh.mailIndex]);
  const inventory = state.inventory.filter((_, index) => !consumed.has(index));
  const conditions = state.inventoryCondition.filter((_, index) => !consumed.has(index));
  inventory.push(itemId); conditions.push(maximum);
  state.inventory = inventory; state.inventoryCondition = conditions;
  state.gold -= MOONFANG_FEE; state.direwolfCraftSerial = (state.direwolfCraftSerial ?? 0) + 1;
  const message = `The Armorer crafts ${getItem(itemId).name}${roll.named ? ' with named workmanship' : ''}. One Direwolf Hide, one Direwolf Mail and ${MOONFANG_FEE} crowns consumed.`;
  record(state, message);
  return { ...result(true, message), itemId, named: roll.named };
}

function ancientRestorationStamp(state) {
  return JSON.stringify([state.seed, state.ancientRestorationSerial ?? 0, state.inventory, state.inventoryCondition, state.gold, townAt(state)?.id, state.destination]);
}
export function getAncientRestorationQuote(state, indices) {
  const blocked = actionBlocked(state); if (blocked) return blocked;
  const access = requireTown(state); if (access.error) return access.error;
  if (state.destination) return result(false, 'Stop at the settlement to visit its Armorer.');
  if ((state.ancientRestorationSerial ?? 0) >= 1000000) return result(false, 'The restoration record is full.');
  if (!Array.isArray(indices) || !indices.length || indices.some(index => !Number.isSafeInteger(index) || index < 0 || index >= state.inventory.length) || new Set(indices).size !== indices.length) return result(false, 'Choose distinct ancient pieces from the stash.');
  const sourceId = state.inventory[indices[0]], recipe = ancientRestorationRecipe(sourceId);
  if (!recipe || indices.length !== recipe.count || indices.some(index => state.inventory[index] !== sourceId)) return result(false, 'Use three matching ancient body pieces or two matching ancient helmets. Named, restored and reforged gear cannot be used as materials.');
  if (!Array.isArray(state.inventoryCondition) || state.inventoryCondition.length !== state.inventory.length) return result(false, 'The stash condition record must be repaired before crafting.');
  return { ok: true, source: getItem(sourceId), indices: [...indices].sort((a, b) => a - b), ...recipe,
    bronze: getItem(restoredAncientId(sourceId, 'bronze')), steel: getItem(restoredAncientId(sourceId, 'steel')),
    refund: Math.floor(recipe.fee / 2), affordable: state.gold >= recipe.fee, stamp: ancientRestorationStamp(state) };
}
export function restoreAncientEquipment(state, quote) {
  if (!quote?.ok) return result(false, 'Review a valid restoration recipe first.');
  const fresh = getAncientRestorationQuote(state, quote.indices);
  if (!fresh.ok) return fresh;
  if (fresh.stamp !== quote.stamp || fresh.sourceId !== quote.sourceId) return result(false, 'The stash or restoration quote changed. Review it before consuming any pieces.');
  if (!fresh.affordable) return result(false, `The Armorer requires ${fresh.fee} crowns.`);
  const outcome = ancientRestorationRolls(state.seed, state.ancientRestorationSerial ?? 0);
  const baseId = outcome.finish ? restoredAncientId(fresh.sourceId, outcome.finish) : null;
  const itemId = baseId ? outcome.named ? createFamedItemId(baseId, outcome.namedSeed) : baseId : null;
  // Build every result before applying the single inventory/currency transaction.
  const consumed = new Set(fresh.indices);
  const inventory = state.inventory.filter((_, index) => !consumed.has(index));
  const conditions = state.inventoryCondition.filter((_, index) => !consumed.has(index));
  if (itemId) { inventory.push(itemId); conditions.push(itemCondition(itemId)); }
  state.inventory = inventory; state.inventoryCondition = conditions;
  state.gold -= fresh.fee - (itemId ? 0 : fresh.refund);
  state.ancientRestorationSerial = (state.ancientRestorationSerial ?? 0) + 1;
  const message = itemId ? `The Armorer restores ${getItem(itemId).name}${outcome.named ? ' with named workmanship' : ''}. ${fresh.count} pieces and ${fresh.fee} crowns consumed.` : `Restoration fails. ${fresh.count} pieces consumed; ${fresh.refund} crowns refunded.`;
  record(state, message);
  return { ...result(true, message), crafted: Boolean(itemId), itemId, finish: outcome.finish, named: outcome.named, refund: itemId ? 0 : fresh.refund };
}

const NEW_ITEM_IDS = new Set(['bludgeon', 'rondel-dagger', 'light-crossbow', 'billhook', 'padded-gambeson', 'reinforced-mail', 'bascinet', ...ADDITIONAL_ITEMS.map(item => item.id), ...ARMOR_ATTACHMENTS.map(item => item.id), ...NORTHERN_ITEMS.map(item => item.id), ...FANTASY_ITEMS.map(item => item.id), ...MOUNTS.map(item => item.id), ...FRONTIER_ITEMS.map(item => item.id), ...DLC_ITEMS.map(item => item.id), ...DLC_SHIELDS.map(item => item.id), ...RESTORED_ANCIENT_ITEMS.map(item => item.id), MOONFANG_ID, ...DIREWOLF_HELMET_ITEMS.map(item => item.id), ...NAMED_WEAPONS.map(item => item.id)]);
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
    injuries: copyInjuries(person.injuries),
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

export function getCompanyStats(person, {ignoreInjuries = false} = {}) {
  const attributes = person.attributes ?? {};
  const level = person.level ?? 1;
  const background = person.background ?? '';
  const recruit = recruitBonuses(person);
  const equipped = getEquipment(person);
  const famedStatBonus = key => Object.values(equipped).reduce((sum,item)=>sum+(item?.statBonuses?.[key]??0),0);
  const mountHit = person.hp > 0 ? equipped.mount?.hitBonus ?? 0 : 0;
  const mountInitiative = person.hp > 0 ? equipped.mount?.initiativeBonus ?? 0 : 0;
  const mount = person.hp > 0 ? equipped.mount : null;
  const setFatigue=effectiveArmorFatigue(person,getItem),armorFatigue=setFatigue.body+setFatigue.head;
  const setAttachments=effectiveAttachmentFatigue(person,getItem),attachmentFatigue=setAttachments.attachment+setAttachments.attachment2;
  const otherFatigue = (equipped.weapon?.fatigue ?? 0) + (equipped.shield?.fatigue ?? 0);
  const perkFatigue = otherFatigue + (hasPerk(person, 'brawny') ? Math.floor(armorFatigue * .7) : armorFatigue);
  const fatigue=perkFatigue+attachmentFatigue;
  const legacy = !person.backgroundId;
  const guard = legacy && (background === 'Guard' || background === 'Caravan Guard');
  const scout = legacy && (background === 'Scout' || background === 'Hunter' || background === 'Outrider');
  const captain = legacy && background === 'Captain';
  const baseMaxHp = 100 + (guard ? 5 : 0) + (attributes.maxHp ?? 0) + (recruit.maxHp ?? 0) + famedStatBonus('maxHp');
  const maxHp = Math.round(baseMaxHp*(hasPerk(person,'colossus')?1.25:1)*(1+equipmentBoost(person,'healthPct',getItem)/100));
  const setArmor=createSetArmorSnapshot(person,getItem,{body:person.armorDurability?.body,head:person.armorDurability?.head});
  const maxBodyArmor = setArmor?.body.effectiveMax??armorMaximum(person.equipment?.armor);
  const maxAttachmentArmor = armorMaximum(person.equipment?.attachment);
  const maxAttachment2Armor=armorMaximum(person.equipment?.attachment2);
  const maxHeadArmor = setArmor?.head.effectiveMax??armorMaximum(person.equipment?.helmet);
  const shieldDefense = (person.armorDurability?.shield ?? shieldMaximum(person.equipment?.shield)) > 0 ? equipped.shield?.defense ?? 0 : 0;
  const rangedShieldDefense=(person.armorDurability?.shield??shieldMaximum(person.equipment?.shield))>0?equipped.shield?.rangedDefense??shieldDefense:0;
  const effectiveRangedShieldDefense=(hasPerk(person,'shield-expert')?Math.ceil(rangedShieldDefense*(perkUpgraded(person,'shield-expert')?1.4:1.25)):rangedShieldDefense)+(rangedShieldDefense&&hasPerk(person,'shield-bearer')?5:0);
  const effectiveShieldDefense = (hasPerk(person, 'shield-expert') ? Math.ceil(shieldDefense * (perkUpgraded(person,'shield-expert')?1.4:1.25)) : shieldDefense)
    + (shieldDefense && hasPerk(person, 'shield-bearer') ? 5 : 0);
  const initiative = Math.max(20, 105 + (scout ? 10 : 0) + (attributes.initiative ?? 0) + (recruit.initiative ?? 0) + mountInitiative + famedStatBonus('initiative') + attachmentBonus(person.equipment,'initiativeBonus')
    - (hasPerk(person, 'relentless') ? Math.ceil(perkFatigue * relentlessFactor(person))+attachmentFatigue : fatigue));
  const dodgeDefense = hasPerk(person, 'dodge') ? Math.floor(initiative * .15) : 0;
  const nimbleBoost=equipmentBoost(person,'nimble',getItem,1);
  const nimbleDefense = armorFatigue <= 15+nimbleBoost*5 && hasPerk(person, 'nimble') ? 5*(1+nimbleBoost) : 0;
  const giftedSkill = hasPerk(person, 'gifted') ? 3 : 0;
  const giftedDefense = hasPerk(person, 'gifted') ? 2 : 0;
  const baseResolve = 42 + (captain ? 10 : 0) + (attributes.resolve ?? 0) + (recruit.resolve ?? 0);
  const stats = {
    maxHp,
    meleeSkill: 54 + (captain ? 9 : guard ? 6 : 0) + (person.seed % 7) + (attributes.meleeSkill ?? 0) + (recruit.meleeSkill ?? 0) + giftedSkill + mountHit + famedStatBonus('meleeSkill'),
    rangedSkill: 40 + (scout ? 13 : 0) + (person.seed % 9) + (attributes.rangedSkill ?? 0) + (recruit.rangedSkill ?? 0) + giftedSkill + mountHit + famedStatBonus('rangedSkill'),
    meleeDefense: 5 + (guard ? 3 : 0) + (attributes.meleeDefense ?? 0) + (recruit.meleeDefense ?? 0) + effectiveShieldDefense + dodgeDefense + nimbleDefense + giftedDefense + famedStatBonus('meleeDefense') + (mount?.meleeDefenseBonus ?? 0),
    rangedDefense: 5 + (scout ? 3 : 0) + (attributes.rangedDefense ?? 0) + (recruit.rangedDefense ?? 0) + effectiveRangedShieldDefense + dodgeDefense + nimbleDefense + giftedDefense + famedStatBonus('rangedDefense') + (mount?.rangedDefenseBonus ?? 0) + attachmentBonus(person.equipment,'rangedDefenseBonus'),
    maxFatigue: Math.max(30, 100 + (attributes.maxFatigue ?? 0) + (recruit.maxFatigue ?? 0) - fatigue - (mount?.fatigue ?? 0) + famedStatBonus('maxFatigue')),
    initiative,
    resolve: (hasPerk(person, 'fortified-mind') ? Math.ceil(baseResolve * 1.25) : baseResolve) + famedStatBonus('resolve'),
    level,
    xp: person.xp ?? 0,
    nextLevelXp: level * 50,
    trainingPoints: person.pendingLevelUps?.length ?? person.trainingPoints ?? 0,
    dailyWage: Math.max(1, 5 + level - 1 + ((RECRUIT_BACKGROUND_BY_ID.get(person.backgroundId)?.cost??0)>=700?Math.ceil(RECRUIT_BACKGROUND_BY_ID.get(person.backgroundId).cost/200):0)),
    bodyArmor: setArmor?.body.initial??person.armorDurability?.body??maxBodyArmor,
    attachmentArmor: person.armorDurability?.attachment ?? maxAttachmentArmor,
    attachment2Armor:person.armorDurability?.attachment2??maxAttachment2Armor,
    headArmor: setArmor?.head.initial??person.armorDurability?.head??maxHeadArmor,
    maxBodyArmor,
    maxAttachmentArmor, maxAttachment2Armor,
    maxHeadArmor,
    shieldDurability: person.armorDurability?.shield ?? shieldMaximum(person.equipment?.shield),
    maxShieldDurability: shieldMaximum(person.equipment?.shield),
    reserveShieldDurability: person.armorDurability?.reserveShield ?? shieldMaximum(person.reserveEquipment?.shield),
    maxReserveShieldDurability: shieldMaximum(person.reserveEquipment?.shield),
  };
  if (!ignoreInjuries&&person.injuries?.length) for (const key of ['maxHp','meleeSkill','rangedSkill','meleeDefense','rangedDefense','maxFatigue','initiative','resolve']) stats[key]=injuryStat({...stats,injuries:person.injuries},key);
  stats.maxHp=Math.max(1,stats.maxHp);
  if(Object.values(person.equipment).some(id=>getItem(id)?.forgeVersion))for(const key of ['meleeSkill','rangedSkill','meleeDefense','rangedDefense','maxFatigue','initiative','resolve'])stats[key]=Math.min(300,stats[key]);
  return stats;
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
export function getBattleChampionBounty(state) {
  const battle=state.battle;
  if (!state.retinue?.bountyHunter || !battle || battle.status!=='victory') return 0;
  return battle.units.filter(unit=>unit.side==='enemy' && unit.champion && !unit.alive && !unit.escaped).length*CHAMPION_BOUNTY;
}
export function getBattleLootGold(state) {
  const base=state.battle?.loot?.gold??0;
  return Math.floor(base*(hasRetinue(state,'scavenger')&&state.battle?.status==='victory'?1.25:1))+getBattleChampionBounty(state);
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
    version: 1, shieldBalanceVersion:1,
    ancientRestorationSerial: 0,
    direwolfCraftSerial: 0,
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
    marketStock: {}, deserterBoards: {}, contractBoards: {}, retinue:defaultRetinue(), discoveryRolls:{},
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
    additionalContracts: [],
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
  revealWorld(state, SETTLEMENTS);
  record(state, 'The Ashen Company gathers at Oakwatch. The road is yours.');
  return state;
}

// Retirement constructs a fresh campaign; the caller commits storage before replacing the live state.
export function getCompanyLegacy(state) {
  const legacy=state.companyLegacy;
  if(!legacy)return null;
  return {...structuredClone(legacy),item:getItem(legacy.itemId),quest:legacy.stage<=4?LEGACY_STAGES[legacy.stage-1]:null,ready:legacyStageReady(state)};
}
export function getLegacyRetirementQuote(state,index) {
  const blocked=actionBlocked(state);if(blocked)return blocked;
  const access=requireTown(state);if(access.error)return access.error;
  if(state.destination||state.ashenWinter?.phase!=='completed')return result(false,'Complete the Ashen crisis and stop in an open settlement before retiring.');
  if(getActiveContracts(state).length)return result(false,'Finish your active contracts before retiring.');
  if((state.companyLegacy?.generation??0)>=1000000)return result(false,'This lineage has reached its limit.');
  if(!Number.isInteger(index)||index<0||index>=state.inventory.length)return result(false,'Choose one named weapon, armor, helmet or shield from your stash.');
  const itemId=state.inventory[index],item=getItem(itemId);
  if(!isNamedItem(item)||!['weapon','armor','helmet','shield'].includes(item.slot))return result(false,'Choose a named weapon, armor, helmet or shield.');
  return {ok:true,itemId,index,condition:state.inventoryCondition[index],stamp:JSON.stringify([state.seed,state.day,state.hour,state.inventory,state.inventoryCondition,state.companyLegacy?.generation??0]),message:'One sealed heirloom. All other equipment, gold and levels stay with the retired company.'};
}
export function createLegacyCampaign(state,quote,seed=Date.now()) {
  const fresh=getLegacyRetirementQuote(state,quote?.index);
  if(!fresh.ok)return fresh;
  if(!quote||quote.stamp!==fresh.stamp||quote.itemId!==fresh.itemId||quote.condition!==fresh.condition)return result(false,'The heirloom selection changed. Choose it again.');
  const next=createGame(seed);
  next.legacyWarrior=freezeLegacyWarrior(state,hashSeed,getCompanyStats);
  next.companyLegacy=initialLegacy({seed:state.seed,day:state.day,renown:state.renown},fresh.itemId,fresh.condition,(state.companyLegacy?.generation??0)+1);
  record(next,'A retired company entrusted you with a sealed heirloom. Company Legacy in the chronicle records four steps to earn it.');
  return {ok:true,state:validateSave(next),message:'A new banner rises. Your heirloom remains sealed until its four side quests are complete.'};
}
export function turnInLegacyQuest(state,stage) {
  const blocked=actionBlocked(state);if(blocked)return blocked;
  const access=requireTown(state);if(access.error)return access.error;
  const legacy=state.companyLegacy,quest=LEGACY_STAGES[(legacy?.stage??0)-1];
  if(!legacy||legacy.stage!==stage||!quest)return result(false,'That legacy quest is not available.');
  if(state.destination||access.town.id!==quest.townId)return result(false,`Report to ${TOWN_BY_ID.get(quest.townId).name}.`);
  if(!legacyStageReady(state))return result(false,quest.objective);
  if(stage===4&&state.inventory.length>=getStashCapacity(state))return result(false,'Free one stash slot to restore your heirloom.');
  if(stage===1){state.gold-=100;state.food-=10;}
  if(stage===2){state.gold-=500;state.supplies.tools-=5;for(const id of ['iron','timber']){consumeCargoOrigins(state,id,4,quest.townId);state.cargo[id]-=4;if(!state.cargo[id])delete state.cargo[id];}}
  if(stage===4){state.inventory.push(legacy.itemId);state.inventoryCondition.push(legacy.condition);}
  legacy.stage++;
  const message=stage===4?`${getItem(legacy.itemId).name} is restored to your stash with its original bonuses and condition.`:`${quest.name} completed. Next: ${LEGACY_STAGES[stage].name}.`;
  record(state,message);recordQuestCompletion(state,`company-legacy-${stage}`);return result(true,message);
}

export function recoverLegacyWarrior(state,retired){
 if(state.legacyWarrior||!state.companyLegacy||!retired)return false;
 const source=state.companyLegacy.source;if(retired.seed!==source.seed||retired.day!==source.day||retired.renown!==source.renown)return false;
 const validated=validateSave(retired);state.legacyWarrior=freezeLegacyWarrior(validated,hashSeed,getCompanyStats);return Boolean(state.legacyWarrior);
}
export function getLegacyWarrior(state){const w=state.legacyWarrior;if(!w)return null;return {...structuredClone(w),quest:WARRIOR_STAGES[w.stage-1]??null,ready:warriorReady(state)};}
export function getLegacyWarriorEncounters(state){
 const w=state.legacyWarrior;if(!w||w.stage!==4||w.defeated)return [];
 const home=TOWN_BY_ID.get('ravenfell'),point=nearestWorldPoint({x:home.x+90,y:home.y+70});
 return [{id:`legacy-warrior-${w.sourceSeed}`,kind:'legacy-warrior',name:`Frozen Vigil · ${w.member.name}`,...point,difficulty:3,reward:0,description:'One awakened warrior, with the preserved build of your earlier company. No reinforcements. Your brothers can fall; defeating him earns his allegiance, not duplicate equipment.',enemies:[{name:w.member.name,...w.member.equipment}]}];
}
function restoredWarriorMember(state){
 const w=state.legacyWarrior,member=structuredClone(w.member);member.injuries=[];member.hp=getCompanyStats(member).maxHp;
 if(w.condition){Object.assign(member,w.condition);}
 return member;
}
export function turnInWarriorQuest(state,stage){
 const blocked=actionBlocked(state);if(blocked)return blocked;const access=requireTown(state);if(access.error)return access.error;
 const w=state.legacyWarrior,quest=WARRIOR_STAGES[(w?.stage??0)-1];
 if(!w||w.stage!==stage||!quest)return result(false,'That warrior quest is not available.');
 if(state.destination||access.town.id!==quest.townId)return result(false,`Report to ${TOWN_BY_ID.get(quest.townId).name}.`);
 if(!warriorReady(state))return result(false,quest.objective);
 if(stage===4){
  const member=restoredWarriorMember(state);member.id=`legacy-warrior-${w.sourceSeed}`;member.hp=Math.max(1,member.hp);
  const formation=[...getFormation(state)],reserves=[...getReserveSlots(state)],fielded=getBattleRoster(state).length;
  const vacancy=fielded<MAX_BATTLE_SIZE?[...FRONT_FORMATION,...MIDDLE_FORMATION,...REAR_FORMATION].find(i=>formation[i]===null):reserves.findIndex(id=>id===null);
  if(state.party.length>=MAX_COMPANY_SIZE||vacancy===undefined||vacancy<0||state.party.some(p=>p.id===member.id))return result(false,'Free a company and formation/reserve place before recruiting the warrior.');
  state.party.push(normalizeMember(member));if(fielded<MAX_BATTLE_SIZE)formation[vacancy]=member.id;else reserves[vacancy]=member.id;state.formation=formation;state.reserveIds=reserves;
 }else if(stage===1){state.gold-=100;state.food-=5;}
 else if(stage===2){consumeCargoOrigins(state,'wool',4,quest.townId);state.cargo.wool-=4;if(!state.cargo.wool)delete state.cargo.wool;state.supplies.medicine-=5;state.supplies.tools-=8;}
 else{consumeCargoOrigins(state,'iron',6,quest.townId);state.cargo.iron-=6;if(!state.cargo.iron)delete state.cargo.iron;state.gold-=1000;state.supplies.tools-=6;}
 w.stage++;const message=stage===4?`${w.member.name} joins your company, wounded from the challenge. Normal wages and upkeep apply.`:`${quest.name} completed. ${WARRIOR_STAGES[stage].objective}`;
 record(state,message);recordQuestCompletion(state,`legacy-warrior-${stage}`);return result(true,message);
}
function recordWarriorBattle(state,battle){
 const w=state.legacyWarrior;if(battle.encounterType!=='legacy-warrior'||!w)return;
 const unit=battle.units.find(u=>u.side==='enemy'),swapped=unit.battleSetSwapped;
 const original=structuredClone(w.member),gear=swapped?{...unit.equipment,weapon:unit.reserveEquipment.weapon,shield:unit.reserveEquipment.shield}:{...unit.equipment};
 original.equipment=gear;original.reserveEquipment=swapped?{weapon:unit.equipment.weapon,shield:unit.equipment.shield}:{...unit.reserveEquipment};
 original.armorDurability={body:baseArmorCondition(unit,'body'),head:baseArmorCondition(unit,'head'),attachment:unit.attachmentArmor,attachment2:unit.attachment2Armor,shield:swapped?unit.reserveShieldDurability:unit.shieldDurability,reserveShield:swapped?unit.shieldDurability:unit.reserveShieldDurability};
 original.throwingAmmo=swapped?{active:unit.throwingAmmo.reserve,reserve:unit.throwingAmmo.active}:{...unit.throwingAmmo};original.accessories=[...unit.accessories];
 original.injuries=copyInjuries(unit.injuries).map(({fresh,sourceId,...wound})=>wound);
 if(unit.pocketDrawnFrom!==null){original.accessories[unit.pocketDrawnFrom]=unit.equipment.weapon;if(swapped)original.reserveEquipment.weapon=unit.pocketStowedWeapon;else original.equipment.weapon=unit.pocketStowedWeapon;}
 for(const [set,key] of [['equipment','active'],['reserveEquipment','reserve']])original.throwingAmmo[key]=Math.min(original.throwingAmmo[key],throwingCapacity(original[set].weapon));
 original.hp=Math.min(Math.max(1,unit.hp),getCompanyStats(original).maxHp);w.condition=original;
 if(battle.status==='victory'&&!unit.escaped){w.defeated=true;record(state,`${w.member.name} yields. Return to Ravenfell to recruit the awakened warrior.`);}
}
function validateWarrior(input,world){
 if(input===undefined)return undefined;
 assert(recordObject(input)&&Object.keys(input).length===7&&input.version===1&&validCount(input.sourceSeed)&&input.sourceSeed<=0xffffffff&&Number.isSafeInteger(input.sourceDay)&&input.sourceDay>=1&&input.sourceDay<=1000000&&Number.isInteger(input.stage)&&input.stage>=1&&input.stage<=5&&typeof input.defeated==='boolean','legacy warrior');
 assert(input.stage<2||world.day>=30,'premature warrior discovery');assert(input.stage<4||world.day>=60,'premature warrior challenge');
 assert(!input.defeated||input.stage>=4&&input.condition!==null,'warrior defeat stage');assert(input.stage!==5||input.defeated,'warrior recruitment');
 const validateMember=member=>{const probe=createGame(input.sourceSeed);probe.day=Math.max(input.sourceDay,world.day);probe.shipments={};probe.shipmentLegacyThroughDay=probe.day;probe.party=[member];probe.formation=Array.from({length:36},(_,i)=>i===0?member.id:null);return validateSave(probe).party[0];};
 const member=validateMember(input.member);assert(member.hp>0,'frozen warrior survivor');
 const condition=input.condition===null?null:validateMember(input.condition);
 if(condition){
  const mutable=new Set(['hp','armorDurability','throwingAmmo','injuries','accessories']);
  for(const key of Object.keys(member))if(!mutable.has(key))assert(JSON.stringify(condition[key])===JSON.stringify(member[key]),'warrior preserved build');
  assert(condition.accessories.every((id,i)=>id===null||id===member.accessories[i]),'warrior accessory ownership');
 }
 assert(input.stage<4?condition===null:true,'premature warrior condition');
 return {...structuredClone(input),member,condition};
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
  return { settlements: SETTLEMENTS, report: message => record(state, message), hostiles: () => getRoamingBands(state),combatTargets:()=>[...getRoamingBands(state),...getFactionPatrols(state).filter(p=>p.active)] };
}
// Fixed designs and seeded rolls keep a marshal's trophy kit stable across saves
// and retreats. One-handed weapons always leave room for their named shield.
const ASHEN_MARSHAL_KITS = [
  {weapon:'military-cleaver',shield:'northern-iron-round-shield',armor:'bb-named-bronze-armor',helmet:'bb-named-metal-bull-helmet'},
  {weapon:'warhammer',shield:'kite-shield',armor:'bb-green-coat-of-plates-armor',helmet:'bb-named-nordic-helmet-with-closed-mail'},
  {weapon:'arming-sword',shield:'kite-shield',armor:'bb-brown-coat-of-plates-armor',helmet:'bb-heraldic-mail-helmet'},
];
function ashenMarshalGear(encounter) {
  const kit=ASHEN_MARSHAL_KITS[Number(encounter.frontId.split(':')[1])-1];
  const gear=Object.fromEntries(Object.entries(kit).map(([slot,id])=>[slot,createFamedItemId(id,crisisHash(`${encounter.force.seed}:marshal:${slot}`),3)]));
  return {...gear,marshal:true,champion:true,championItemId:gear.weapon};
}
export function getUndeadEncounters(state) {
  return ashenEncounterRecords(state, SETTLEMENTS).filter(e => e.force.troops.length).map(encounter => {
    const pool = ancientEnemies(encounter.force.tier);
    const enemies = encounter.force.troops.map(troop => ({ ...pool[(troop + encounter.force.seed % pool.length) % pool.length],
      ...(encounter.kind === 'undead-commander' && troop === 0 ? ashenMarshalGear(encounter) : {}),
      name: encounter.kind === 'undead-commander' && troop === 0 ? encounter.name : pool[(troop + encounter.force.seed % pool.length) % pool.length].name,
      troopIndex: troop, undeadTraitsVersion: 1, savedDamage: encounter.force.damage[troop] ?? null }));
    const fight=worldSkirmishFor(state,encounter.id);
    return { ...encounter,...(encounter.kind === 'undead-host' && !encounter.townId && allSettlementsCaptured(state,SETTLEMENTS)?{behavior:'hunting-company'}:{}),...(fight?{battleHoursRemaining:Math.max(0,fight.endHour-worldHours(state)),behavior:'fighting'}:{}), enemies, difficulty: encounter.force.tier, veteranRank: encounter.force.rank,
      generation: encounter.force.generation, cleared: false, factionLabel: 'Ashen Legion',
      reward: encounter.kind === 'undead-host' ? ASHEN_CONFIG.hostGold : encounter.kind === 'undead-liberation' ? ASHEN_CONFIG.liberationGold : ASHEN_CONFIG.commanderGold,
      description: fight?`Fighting ${fight.aId===encounter.id?fight.bName:patrolDefinitions(SETTLEMENTS).find(p=>p.id===fight.aId)?.name??'faction soldiers'}. About ${Math.ceil(fight.endHour-worldHours(state))} hours remain.`: encounter.kind === 'undead-commander' ? 'Destroy this fortified wilderness stronghold and its marshal to stop waves of 2–4 undead bands every 3–7 days.'
        : encounter.kind === 'undead-liberation' ? 'Defeat this force to reopen all settlement services.' : 'Intercept this host before it closes a settlement.' };
  });
}
export function getAshenFinalItem(state) {
  const crisis = state.ashenWinter;
  if (!crisis || crisis.phase !== 'completed') return null;
  const bases = ['greatsword', 'plate-harness', 'greathelm', 'polehammer'];
  const base=bases[crisisHash(`${crisis.seed}:final-base`) % bases.length];
  return createFamedItemId(base, crisisHash(`${crisis.seed}:final-item`),getItem(base).ranged?4:3);
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
  const gear = ITEMS.filter(item=>!item.craftOnly&&item.slot!=='mount'&&!['named','famed'].includes(item.rarity)&&townDesign(item,town)&&(!item.marketChance||townEventHash(`${state.seed}:${town.id}:${cycle}:rare-attachment:${item.id}`)%100<item.marketChance*100));
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
    const rare=[...DLC_ITEMS,...DLC_SHIELDS,...NAMED_WEAPONS].filter(item=>item.rarity==='named'&&item.sourceKind!=='legendary'&&townDesign(item,town));
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
  const candidates = ITEMS.filter(item => !item.craftOnly && item.slot !== 'mount' && item.rarity !== 'named' && item.price >= 250 && equipment[item.id] === 0 && townDesign(item,town));
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
    ? { ...Object.fromEntries([...MOUNTS, ...FRONTIER_ITEMS, ...DLC_ITEMS, ...DLC_SHIELDS, ...NAMED_WEAPONS].map(item => [item.id, replenished[item.id]])), ...existing.equipment }
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
    enemies: survivingWorldEnemies(state, band.id, spawnCycle, championRoster(state,{id:band.id,spawnCycle,difficulty:tier,enemies:rollEncounterNamed(state,{id:band.id,spawnCycle},enemies)},getItem,championItemFactory(armoryTheme(regionAt(band.start.x,band.start.y).id),{affixes:encounterAffixes(state,band.id,spawnCycle)}))),
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
 const patrol=getFactionPatrols(state).find(p=>p.id===id);
 const fight=patrol&&worldSkirmishFor(state,id);
 return isJoinablePatrolSkirmish(patrol,fight,worldHours(state))?{patrol,fight:patrolSkirmishSide(id,fight)}:null;
}
function alliedBattleAgainst(state,id){
 const fight=worldSkirmishFor(state,id);
 const patrolId=fight&&((fight.aKind??'patrol')==='patrol'?fight.aId:fight.bKind==='patrol'?fight.bId:null);
 return patrolId?getJoinablePatrolBattle(state,patrolId):null;
}
export function joinPatrolBattle(state,id) {
 const blocked=actionBlocked(state);if(blocked)return blocked;
 const joint=getJoinablePatrolBattle(state,id);
 if(!joint)return result(false,'That allied battle has already ended or is unavailable.');
 const opponent=[...getRoamingBands(state),...getUndeadEncounters(state)].find(e=>e.id===joint.fight.bId);
 const contact=Math.min(distance(state.position,joint.patrol),opponent?distance(state.position,opponent):Infinity);
 if(contact>CAMP_RADIUS){
  const travel=travelTo(state,joint.patrol.x,joint.patrol.y);
  if(travel.ok)state.destinationAction={type:'patrol',id};return travel;
 }
 state.destination=null;state.destinationAction=null;state.pursuit=null;
 return startBattle(state,joint.fight.bId,{patrolId:id});
}
function advanceSoldiers(state) {
  const currentHostile=id=>[...getRoamingBands(state),...getUndeadEncounters(state).filter(e=>e.kind==='undead-host')].find(b=>b.id===id);
  advanceFactionSimulation(state,{settlements:SETTLEMENTS,getItem,servicesAvailable:id=>getSettlementAccess(state,id).servicesAvailable,hostiles:()=>[...getRoamingBands(state),...getUndeadEncounters(state).filter(e=>e.kind==='undead-host')],currentHostile,
    hostileResult(target,survivors,won,fight,committedTroops=fight?.bTroops) {
      const current=currentHostile(target.id);if(!current)return;
      if (target.kind === 'undead-host') {
        if (survivors.length) {
          const troops = survivors.map(index => committedTroops?.[index]??current.enemies[index].troopIndex);
          const damage = Object.fromEntries(Object.entries(current.force.damage).filter(([i])=>troops.includes(Number(i))));
          recordAshenCasualties(state,target.id,troops,damage);
        } else npcAshenVictory(state,target.id);
        return;
      }
      // No new casualty record is needed when every committed bandit survives.
      if(survivors.length===(committedTroops?.length??current.enemies.length))return;
      state.worldLosses??={};
      if(survivors.length) {
        const previous=state.worldLosses[target.id];
        state.worldLosses[target.id]={cycle:target.spawnCycle,size:Math.max(previous?.size??0,...(committedTroops??current.enemies.map(e=>e.worldIndex)).map(i=>i+1)),survivors:survivors.map(index=>committedTroops?.[index]??current.enemies[index].worldIndex)};
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

export function getEncounterSites(state) { return [...getLegacyWarriorEncounters(state),...getBlacksmithQuestEncounters(state), ...getCampSites(state), ...getRoamingBands(state), ...getUndeadEncounters(state), ...getFactionPatrols(state), ...(getQuestEncounter(state) ? [getQuestEncounter(state)] : [])]; }

// Keep the legacy primary contract field for old saves and combat consumers.
export function getContractCategory(contract) {
  return !contract.type || contract.type==='courier' ? 'courier' : contract.type==='supply' ? 'merchant' : 'combat';
}
export function getActiveContracts(state) { return [state.contract,...(state.additionalContracts??[])].filter(Boolean); }
export function canAcceptContract(state, offer) { return !getActiveContracts(state).some(c=>getContractCategory(c)===getContractCategory(offer)); }
function storeContracts(state, contracts) {
  const combat=contracts.find(c=>getContractCategory(c)==='combat');
  state.contract=combat??contracts[0]??null;
  state.additionalContracts=contracts.filter(c=>c!==state.contract);
}

export function getQuestEncounter(state) {
  const contract = state.contract;
  if(contract?.type==='bounty'){if(contract.defeated)return null;const site=deserterEncounter(state.seed,contract,getItem);return {...site,kind:'bounty',name:'Wanted Champion and Retainers',acceptedDay:contract.acceptedDay,enemies:championRoster(state,{...site,acceptedDay:contract.acceptedDay,enemies:rollEncounterNamed(state,{id:site.id,generation:contract.acceptedDay},site.enemies)},getItem,championItemFactory(armoryTheme(regionAt(site.x,site.y).id)),{force:true}),description:'Eight elite faction fighters shelter a wanted champion. Defeat them and return for 1,000 crowns and the right to hire the Bounty Hunter retinue for 5,000 crowns. The defeated champion guarantees their named trophy.'};}
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

export function getContractTarget(state, contract = state.contract) {
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
    : type==='legacy-warrior'?getLegacyWarriorEncounters(state).find(e=>e.id===id):type==='blacksmith'?getBlacksmithQuestEncounters(state).find(e=>e.id===id)
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
  if (['camp', 'rescue', 'deserters','bounty','blacksmith','legacy-warrior'].includes(type) && distance(state.position, target) <= CAMP_RADIUS) return startBattle(state, id);
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
  for(const contract of getActiveContracts(state)) {
    if(contract.to===town.id&&!completeContract(state,town,contract)&&contract.type==='supply') {
      const good=GOOD_BY_ID.get(contract.goodId),needed=contract.quantity-(state.cargo[contract.goodId]??0);
      record(state,`${town.name} still needs ${needed} ${good.name.toLowerCase()} before it can pay.`);
    }
  }
}

function completeContract(state, town, contract) {
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
  if(contract.type==='bounty'){state.retinue??=defaultRetinue();state.retinue.bountyHunterUnlocked=true;record(state,'The Bounty Hunter is available: hire the retinue for 5,000 crowns for a permanent +5 percentage points to champion encounter chance and 300 crowns per defeated champion.');}
  const description = contract.type === 'bounty' ? 'Wanted champion defeated' : contract.type === 'deserters' ? 'Elite deserters defeated' : contract.type === 'hunt' ? 'Brigand hunt completed' : contract.type === 'assault' ? 'Joint assault completed'
    : contract.type === 'rescue' ? 'Caravan rescue completed' : contract.type === 'supply' ? `${contract.quantity} ${GOOD_BY_ID.get(contract.goodId).name.toLowerCase()} delivered` : `Dispatch from ${TOWN_BY_ID.get(contract.from).name} delivered`;
  record(state, `${description} at ${town.name}. Earned ${contract.reward} crowns and ${contract.renown ?? 1} renown.`);
  if ((contract.type === undefined || contract.type === 'courier') && townEventHash(`${state.seed}:${contract.id}:${town.id}:courier-item`) % 4 === 0) {
    const better = townEventHash(`${state.seed}:${contract.id}:${town.id}:courier-quality`) % 3 === 0;
    const stock = writableMarketStock(state, town);
    const event = scheduledTownEvent(state, town);
    const candidates = ITEMS.filter(item => {
      const rightTier = better ? item.price >= 250 && item.price < 450 : item.price < 250;
      return !item.craftOnly && item.slot !== 'mount' && rightTier && stock.equipment[item.id] < 1024 && visibleEquipmentStock(state, town, item, stock.equipment[item.id] + 1, event) > 0;
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
  useContractBoardSlot(state,contract.from,getContractCategory(contract),contract.acceptedDay);
  storeContracts(state,getActiveContracts(state).filter(c=>c!==contract));
  recordLegacyContract(state,contract.id);
  recordQuestCompletion(state,contract.id);
  return true;
}


// Stable per-wound/day rolls keep recovery independent of travel partitioning and combat RNG.
function recoverDailyInjuries(state) {
  for (const person of state.party) {
    const remaining = [];
    for (const wound of person.injuries ?? []) {
      if (state.supplies.medicine < 1) { remaining.push(wound); continue; }
      state.supplies.medicine -= 1;
      wound.healingDays += 1;
      const [minimum,maximum] = injuryHealingRange(wound,hasRetinue(state,'surgeon'));
      const roll = hashSeed(`${state.seed}:injury-recovery:${person.id}:${wound.id}:${wound.acquiredDay}:${state.day}`)%100+1;
      if (wound.healingDays>=minimum && roll<=wound.healingDays/maximum*100) record(state,`${person.name} recovers from ${INJURY_BY_ID.get(wound.id).name}.`);
      else remaining.push(wound);
    }
    person.injuries = remaining;
    // Recovering maximum HP makes room for healing; it does not grant free hitpoints.
    person.hp = Math.min(person.hp,getCompanyStats(person).maxHp);
  }
}

export function getInjuryCare(state, person) {
  const surgeon = hasRetinue(state,'surgeon');
  return (person.injuries ?? []).map(wound => ({...wound,...INJURY_BY_ID.get(wound.id),
    remainingDays:injuryRemainingDays(wound,surgeon), paused:state.supplies.medicine<1,
    fresh:wound.fresh===true}));
}

function atMidnight(state) {
  const previousDiscovery=discoveryEvent(state);
  state.day += 1;
  recoverDailyInjuries(state);
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
  checkBlacksmithDiscovery(state);
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
  const undead = getUndeadEncounters(state).find(e => e.kind === 'undead-host' && !worldSkirmishFor(state,e.id) && distance(e, state.position) <= BAND_RADIUS);
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
  checkBlacksmithDiscovery(state);
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
    else if(!engagement&&arrivedAction?.type==='legacy-warrior')engagement=startBattle(state,arrivedAction.id);
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
    else if(!engagement&&arrivedAction?.type==='blacksmith')engagement=getBlacksmithQuestEncounters(state).some(e=>e.id===arrivedAction.id)?startBattle(state,arrivedAction.id):result(false,'That side quest site is no longer active.');
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
    revealWorld(state, SETTLEMENTS);
    remaining -= step;
    if(state.destinationAction?.type==='patrol'&&!getJoinablePatrolBattle(state,state.destinationAction.id)){
      state.destination=null;state.destinationAction=null;record(state,'The allied battle has ended before the company could join.');
    }
    if (engagement) break;
  }
  applyCompanyAutomation(state);
  return engagement ?? result(true, state.destination ? 'The company is on the road.' : 'Time passes.');
}

export function getContractBoardRefreshDay(state) { return (Math.floor((state.day-1)/7)+1)*7+1; }
function useContractBoardSlot(state, townId, category, acceptedDay=state.day) {
  const week=Math.floor((acceptedDay-1)/7);
  if(week!==Math.floor((state.day-1)/7))return;
  state.contractBoards??={};
  const board=state.contractBoards[townId]?.week===week?state.contractBoards[townId]:{week,used:[]};
  if(!board.used.includes(category))board.used.push(category);
  state.contractBoards[townId]=board;
}
export function isContractReady(state, contract) {
  if(!contract)return false;
  return getContractCategory(contract)==='combat'?contractObjectiveComplete(state,contract):contract.type==='supply'?(state.cargo[contract.goodId]??0)>=contract.quantity:townAt(state)?.id===contract.to;
}

export function getContractOffers(state, townId) {
  if (state.battle || state.gameOver) return [];
  const town = townAt(state);
  if (!town || town.id !== townId || townBlocked(state, town.id)) return [];
  const cycle=Math.floor((state.day-1)/7),boardSeed=townEventHash(`${state.seed}:${town.id}:${cycle}:board`);
  const candidates = SETTLEMENTS.filter(place => place.id !== townId);
  const index = boardSeed % candidates.length;
  const courierTarget = candidates[index];
  const courierReward = Math.round((80 + distance(town, courierTarget) * .34) / 5) * 5;
  const cheapGoods = [...GOODS].sort((a, b) => MARKET_FACTORS[town.id][a.id] - MARKET_FACTORS[town.id][b.id]);
  const good = cheapGoods[boardSeed % 2];
  const buyers = [...candidates].sort((a, b) => MARKET_FACTORS[b.id][good.id] - MARKET_FACTORS[a.id][good.id]);
  const supplyTarget = buyers[boardSeed % 2];
  const quantity = 4 + boardSeed % 2;
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
  const deserters=deserterOffer(state,town,serial,rescuePoint);
  if(deserters)offers.push(deserters);
  const bounty=bountyOffer(state,town,serial,rescuePoint,soldierFactionAt(town.x,town.y).id);
  if(bounty)offers.push(bounty);
  const combat=bounty??deserters??offers.filter(o=>getContractCategory(o)==='combat').sort((a,b)=>townEventHash(`${boardSeed}:${a.type}`)-townEventHash(`${boardSeed}:${b.type}`))[0];
  const board=[offers[0],offers[1],...(combat?[combat]:[])];
  const used=state.contractBoards?.[townId]?.week===cycle?state.contractBoards[townId].used:[];
  return board.filter(offer=>!used.includes(getContractCategory(offer))).map(offer=>({...offer,id:`${townId}:${cycle}:${offer.type}`}));
}

export function acceptContract(state, townId, offerId) {
  const blocked = actionBlocked(state);
  if (blocked) return blocked;
  const town = townAt(state);
  if (!town || town.id !== townId) return result(false, 'Visit the issuing settlement to take its contract.');
  const accessBlocked = townBlocked(state, town.id); if (accessBlocked) return accessBlocked;
  const offers = getContractOffers(state, townId);
  const offer = offerId === undefined ? offers[0] : offers.find(entry => entry.id === offerId);
  if (!offer) return result(false, 'That contract is no longer available.');
  if(!canAcceptContract(state,offer))return result(false,`Finish your current ${getContractCategory(offer)} contract before taking another of that kind.`);
  const existingContracts=getActiveContracts(state);
  if(offer.type==='bounty'){state.retinue??=defaultRetinue();state.retinue.bountyBoards[townId]=Math.floor((state.day-1)/7);}
  if(offer.type==='deserters'){state.deserterBoards??={};state.deserterBoards[townId]=Math.floor((state.day-1)/7);}
  state.contractSerial += 1;
  const { id, ...terms } = offer;
  state.contract = { id: `delivery-${state.contractSerial}`, ...terms, acceptedDay: state.day,
    ...(offer.type === 'rescue' ? { rescued: false } : ['deserters','bounty'].includes(offer.type) ? {defeated:false} : {}) };
  if(offer.type==='rescue')state.contract.rescueId=`rescue-${state.contractSerial}`;
  if(['deserters','bounty'].includes(offer.type))state.contract.deserterId=`${offer.type}-${state.contractSerial}`;
  storeContracts(state,[...existingContracts,state.contract]);
  useContractBoardSlot(state,townId,getContractCategory(offer));
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
  checkBlacksmithDiscovery(state);
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
  return completeContract(state, access.town,getActiveContracts(state).find(c=>c.type==='supply'&&c.to===access.town.id)) ? result(true, `${message} Supply contract completed.`) : result(true, message);
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
  if (!['doctor','smithy','injury-treatment'].includes(service)) return { ...quote, message: 'Choose Doctor, wound treatment or Smithy.' };
  const blocked = actionBlocked(state);
  if (blocked) return { ...quote, message: blocked.message };
  if (!town) return { ...quote, message: 'Visit a settlement to use the Doctor or Smithy.' };
  const accessBlocked = townBlocked(state, town.id); if (accessBlocked) return { ...quote, ...accessBlocked };
  const members = memberId === null ? state.party : state.party.filter(person => person.id === memberId);
  if (!members.length) return { ...quote, message: 'Unknown company member.' };
  quote.entries = members.map(person => {
    if (service === 'injury-treatment') {
      const wounds = getInjuryCare(state,person).filter(wound=>!wound.treated);
      const cost = wounds.reduce((sum,wound)=>sum+Math.max(10,Math.round(wound.remainingDays[1]*20*(1+((person.level??1)-1)*.2)*(hasRetinue(state,'surgeon')?.75:1)/10)*10),0);
      return {memberId:person.id,name:person.name,wounds,amount:wounds.length,cost};
    }
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
  if (!quote.totalAmount) return { ...quote, message: service === 'injury-treatment' ? 'No untreated injuries.' : service === 'doctor' ? 'No healing is needed.' : 'No equipped armor or shields need repairs.' };
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
    if (service === 'injury-treatment') for (const wound of person.injuries) wound.treated = true;
    else if (service === 'doctor') person.hp = entry.maxHp;
    else for (const repair of entry.repairs) person.armorDurability[repair.part] = repair.max;
  }
  const message = service === 'injury-treatment'
    ? `Doctor treats ${quote.totalAmount} wound${quote.totalAmount===1?'':'s'} for ${quote.totalCost} crowns. Recovery durations are halved; daily medicine is still required.`
    : service === 'doctor'
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

function conditionalAttachment(person,equipment){return person.equipment.attachment2&&(!equipment.armor||!hasPerk({...person,equipment},'layered-armor'))?'attachment2':null;}
function stowAttachment(state,person,key){if(!key)return;state.inventory.push(person.equipment[key]);state.inventoryCondition.push(person.armorDurability[key]);person.equipment[key]=null;person.armorDurability[key]=0;}

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
  const dependent=destination==='active'&&accessory<0?conditionalAttachment(person,{...person.equipment,[targetSlot]:itemId}):null;
  if (state.inventory.length - 1 + Number(Boolean(previous)) + Number(Boolean(displaced)) + Number(Boolean(dependent)) > getStashCapacity(state)) return result(false, 'The company pack is full.');
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
  stowAttachment(state,person,dependent);
  person.hp=Math.min(person.hp,getCompanyStats(person).maxHp);
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
  const dependent=destination==='active'&&accessory<0&&slot!=='attachment2'?conditionalAttachment(person,{...person.equipment,[slot]:null}):null;
  const attachedSlots=destination==='active'&&slot==='armor'?['attachment','attachment2'].filter(key=>person.equipment[key]):dependent?[dependent]:[];
  if (state.inventory.length + 1 + attachedSlots.length > getStashCapacity(state)) return result(false, 'The company pack is full.');
  for(const key of attachedSlots){state.inventory.push(person.equipment[key]);state.inventoryCondition.push(person.armorDurability[key]);person.equipment[key]=null;person.armorDurability[key]=0;}
  if (accessory >= 0) person.accessories[accessory] = null;
  else set[slot] = null;
  state.inventory.push(itemId);
  state.inventoryCondition.push(condition);
  if (accessory < 0) setEquippedCondition(person, destination, slot, 0);
  person.hp=Math.min(person.hp,getCompanyStats(person).maxHp);
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

function recruitPerson(state, town, slot, usedNames = []) {
  const profile = makeRecruitProfile(state.seed, town.id, state.day, slot, town.kind);
  const background = RECRUIT_BACKGROUND_BY_ID.get(profile.backgroundId);
  const regionId=regionAt(town.x,town.y).id;
  const culture=regionId==='northern-highlands'?'northern':['sunlands','saffron-coast'].includes(regionId)?'southern':'western';
  const person = normalizeMember({
    id: `recruit-${town.id}-${state.day}-${slot}`,
    name: state.party.find(p=>p.id===`recruit-${town.id}-${state.day}-${slot}`)?.name ?? makeRecruitName(profile.personSeed,background.id,{culture,usedNames}),
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
  const slots=SETTLEMENT_TYPES[town.kind].hires;
  const boardIds=new Set(Array.from({length:slots},(_,slot)=>`recruit-${town.id}-${state.day}-${slot}`));
  const usedNames=state.party.filter(p=>!boardIds.has(p.id)).map(p=>p.name);
  return Array.from({ length: slots }, (_, slot) => {const offer=recruitPerson(state,town,slot,usedNames);usedNames.push(offer.person.name);return offer;})
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
  checkBlacksmithDiscovery(state);
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
  const medicated = wounded && state.supplies.medicine > injuryDailyMedicine(state.party);
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

const CAMP_RESPAWN_MIN_DAYS = 14;
const CAMP_RESPAWN_MAX_DAYS = 42;
function campRespawnHours(state, id, generation = 0) {
  const days = CAMP_RESPAWN_MIN_DAYS + hashSeed(`${state.seed}:${id}:${generation}:camp-respawn`) % (CAMP_RESPAWN_MAX_DAYS - CAMP_RESPAWN_MIN_DAYS + 1);
  return days * 24;
}
function savedCampRespawnAt(state, id, entry) {
  if (!entry?.clearedDay) return entry?.respawnAt ?? null;
  const clearedDayStart = (entry.clearedDay - 1) * 24;
  const legacyHours = CAMP_BY_ID.has(id) ? 120 : 72;
  const previousDeadline = entry.respawnAt ?? clearedDayStart + legacyHours;
  // Extend only pending legacy timers. Occupied camps must not disappear on loading.
  if (previousDeadline > worldHours(state) && previousDeadline < clearedDayStart + legacyHours + 24) {
    const clearedAt = entry.respawnAt == null ? clearedDayStart : Math.max(clearedDayStart, previousDeadline - legacyHours);
    return clearedAt + campRespawnHours(state, id, entry.generation ?? 0);
  }
  return previousDeadline;
}
function campRecord(state, id) {
  const entry = state.camps?.[id];
  const respawnAt = entry?.respawnAt ?? savedCampRespawnAt(state, id, entry);
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
  if(!newCamp)return legacy;
  const theme=camp.factionId==='ancient'?'ancient':armoryTheme(regionAt(camp.x,camp.y).id);
  const shields=DLC_SHIELDS.filter(item=>item.sourceKind==='legendary'?camp.difficulty===3
    :camp.difficulty>=2&&(theme==='ancient'?item.sourceCulture==='ancient'
      :item.sourceCulture!=='ancient'&&(!item.region||item.region===theme)));
  return [...legacy,
    ...DLC_ITEMS.filter(item => (item.sourceArmor ?? item.armor) > 0 && (item.sourceArmor ?? item.armor) <= [0,110,220,400][camp.difficulty]).map(item=>item.id),
    ...shields.map(item=>item.id),
    ...NAMED_WEAPONS.filter(item=>camp.difficulty>=2&&namedWeaponFitsTheme(item,theme)).map(item=>item.id)];
}

function namedWeaponFitsTheme(item,theme) {
  if(theme==='ancient')return item.sourceCulture==='ancient';
  if(item.sourceCulture==='ancient')return false;
  if(theme==='north'||theme==='south')return item.sourceCulture===theme;
  if(theme==='forest')return item.fatigue<=12;
  return item.sourceCulture==='mercenary';
}
function encounterAffixes(state,id,cycle){const frozen=state.discoveryRolls?.[id];return !frozen||frozen.cycle!==cycle?4:frozen.namedAffixVersion??0;}
function namedRollVersion(item,affixes){return affixes>=4?9:affixes>=3?(['armor','helmet'].includes(item.slot)?8:7):affixes===2?7:affixes===1?5:item.ranged?4:3;}
function championItemFactory(theme,{affixes=4}={}) {
  return (baseId,seed)=>{
    const base=getItem(baseId);
    const named=(id,roll)=>createFamedItemId(id,roll,base.slot==='attachment'?(affixes?6:3):namedRollVersion(getItem(id),affixes));
    if(base.slot==='attachment')return named(baseId,seed);
    if (base.slot !== 'weapon') {
      const maxProtection = theme === 'forest' ? (base.slot === 'armor' ? 150 : 110)
        : base.armor <= 110 ? (base.slot === 'armor' ? 150 : 110) : 400;
      const pool = DLC_ITEMS.filter(item => item.slot === base.slot && item.rarity === 'named'
        && item.sourceKind !== 'legendary' && matchesArmoryTheme(item, theme)
        && (item.armor ?? 0) <= maxProtection && (item.fatigue ?? 0) <= (base.fatigue ?? 0) + 3);
      return named(pool.length ? pool[seed % pool.length].id : baseId, seed);
    }
    const pool=NAMED_WEAPONS.filter(item=>namedWeaponFitsTheme(item,theme)
      && weaponSkillFamily(item)===weaponSkillFamily(base)&&Boolean(item.twoHanded)===Boolean(base.twoHanded)
      && Boolean(item.ranged)===Boolean(base.ranged)&&Boolean(item.throwing)===Boolean(base.throwing)
      && (item.range??1)===(base.range??1));
    return named(pool.length?pool[seed%pool.length].id:baseId,seed);
  };
}
function rollEncounterNamed(state,encounter,enemies){return enemies.map((enemy,index)=>({...enemy,...Object.fromEntries(['armor','helmet','weapon','shield'].map(slot=>{const id=enemy[slot],item=getItem(id);return [slot,(item?.sourceArmor!==undefined||item?.sourceNamedWeapon||item?.sourceNamedShield)&&item.rarity==='named'?createFamedItemId(id,hashSeed(`${state.seed}:${encounter.id}:${encounter.generation??encounter.spawnCycle??0}:${index}:${slot}:named-rolls`),namedRollVersion(item,encounterAffixes(state,encounter.id,encounter.generation??encounter.spawnCycle??0))):id];}))}));}

function famedDropForCamp(seed,camp,affixVersion=4) {
  const chance = (FAMED_CHANCES[camp.difficulty] ?? 0) + (camp.discoveryBonuses?.famed??0)/100;
  if (hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-roll`) % 10000 >= chance * 10000) return null;
  const bases = famedBasesForCamp(camp);
  const baseId = bases[hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-base`) % bases.length];
  return createFamedItemId(baseId,hashSeed(`${seed}:${camp.id}:${camp.generation}:famed-item`),namedRollVersion(getItem(baseId),affixVersion));
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
    const champions=championRoster(state,{...camp,generation:progress.generation,enemies:rollEncounterNamed(state,{id:camp.id,generation:progress.generation},enemies)},getItem,championItemFactory(camp.factionId==='ancient'?'ancient':armoryTheme(regionAt(camp.x,camp.y).id),{affixes:encounterAffixes(state,camp.id,progress.generation)}));
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
  battle.log.push((battle.simultaneous?`Cycle ${battle.round} · ${(battle.simultaneous.time/1000).toFixed(1)}s: ${message}`:`Round ${battle.round}: ${message}`).slice(0,battle.itemAffixRulesVersion===2?600:300));
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
    injuryStat(b,'initiative') * (b.staggeredTurns>0?.5:1) * (b.affixDazedTurns>0?.5:b.dazedTurns>0?.75:1) - b.fatigue * .2 - (injuryStat(a,'initiative') * (a.staggeredTurns>0?.5:1) * (a.affixDazedTurns>0?.5:a.dazedTurns>0?.75:1) - a.fatigue * .2) || a.id.localeCompare(b.id)).map(unit => unit.id);
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
  const warrior=getLegacyWarriorEncounters(state).find(e=>e.id===encounterId);
  const blacksmith=getBlacksmithQuestEncounters(state).find(e=>e.id===encounterId);
  const undead = getUndeadEncounters(state).find(e => e.id === encounterId);
  const encounterType = warrior?'legacy-warrior':blacksmith ? 'blacksmith' : undead ? undead.kind : getQuestEncounter(state)?.id === encounterId ? state.contract.type : BAND_BY_ID.has(encounterId) ? 'band' : 'camp';
  const camp = warrior ?? blacksmith ?? undead ?? (['rescue','deserters','bounty'].includes(encounterType) ? getQuestEncounter(state) : encounterType === 'band' ? getRoamingBands(state).find(band => band.id === encounterId) : getCampSites(state).find(site=>site.id===encounterId));
  if (!camp) return result(false, 'That hostile group is no longer here.');
  if (encounterType === 'camp' && camp.cleared) return result(false, `This camp is deserted. Raiders may return in ${Math.ceil(camp.respawnHours/24)} days.`);
  const npcFight=worldSkirmishFor(state,encounterId);
  // A player interception can happen before the next world-simulation step.
  // Bring the nearby patrol along instead of leaving it behind when no NPC
  // skirmish has been committed yet. Never borrow troops from another fight.
  const nearbyPatrol=!npcFight&&!patrolId&&['band','undead-host'].includes(encounterType)
    ?getFactionPatrols(state).filter(p=>p.active&&p.playerRelation==='ally'&&p.behavior!=='returning'&&!worldSkirmishFor(state,p.id)
      &&(state.factionPatrols[p.id]?.cooldownUntil??0)<=worldHours(state)&&distance(p,camp)<=CAMP_RADIUS
      &&(!p.targetId||p.targetId===encounterId))
      .sort((a,b)=>distance(a,camp)-distance(b,camp)||a.id.localeCompare(b.id))[0]:null;
  const assistance=npcFight?(patrolId?getJoinablePatrolBattle(state,patrolId):alliedBattleAgainst(state,encounterId)):nearbyPatrol?{
    patrol:nearbyPatrol,fight:{aCycle:state.factionPatrols[nearbyPatrol.id].spawnCycle,
      aTroops:[...state.factionPatrols[nearbyPatrol.id].troops],bTroops:camp.enemies.map(e=>e.worldIndex??e.troopIndex)}
  }:null;
  if(npcFight&&!assistance||patrolId&&(!assistance||assistance.fight.bId!==encounterId))return result(false,'That patrol battle is no longer available. Let the ongoing fight resolve before intercepting.');
  const patrolAssist=assistance?{id:assistance.patrol.id,cycle:assistance.fight.aCycle,troops:[...assistance.fight.aTroops],enemyTroops:[...assistance.fight.bTroops]}:null;
  if (state.destination || (patrolId?Math.min(distance(state.position,assistance.patrol),distance(state.position,camp)):distance(state.position,camp)) > (patrolId?CAMP_RADIUS:encounterType === 'band' ? BAND_RADIUS + 7 : CAMP_RADIUS)) return result(false, 'Approach the enemy before engaging.');
  if (!getBattleRoster(state).length) return result(false, 'Move a brother from reserve into the formation before fighting.');
  applyCompanyAutomation(state);
  if(['camp','band'].includes(encounterType)){state.discoveryRolls??={};const cycle=camp.generation??camp.spawnCycle,previous=state.discoveryRolls[camp.id];state.discoveryRolls[camp.id]={cycle,...discoveryBonuses(state,camp),...(encounterAffixes(state,camp.id,cycle)?{namedAffixVersion:encounterAffixes(state,camp.id,cycle)}:{}),...(!previous||previous.cycle!==cycle||previous.championGearVersion===1?{championGearVersion:1}:{})};}
  refillThrowingAmmo(state);
  const field = createBattleField(state.seed, (blacksmith?`${camp.id}:${camp.acceptedDay}:blacksmith`:`${camp.id}:${state.day}:${state.contractSerial}`), terrainAt(camp.x, camp.y), {fortified:encounterType === 'camp' || encounterType === 'undead-commander'});
  const company = getFormation(state).flatMap((personId, index) => {
    const person = personById(state, personId);
    if (!person) return [];
    const stats = getCompanyStats(person,{ignoreInjuries:true});
    return [{
      id: person.id, name: person.name, side: 'company', q: 2 - Math.floor(index / 12), r: 2 + DEPLOYMENT_ROW_OFFSET + index % 12,
      hp: person.hp, maxHp: getCompanyStats(person).maxHp, injuries:copyInjuries(person.injuries).map(wound=>({...wound,fresh:false,sourceId:null})), bodyArmor: stats.bodyArmor, attachmentArmor: stats.attachmentArmor, attachment2Armor:stats.attachment2Armor, headArmor: stats.headArmor,
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
      meleeDefense: stats.meleeDefense - (hasPerk(person, 'dodge') ? Math.floor(stats.initiative * .15) : 0),
      rangedDefense: stats.rangedDefense - (hasPerk(person, 'dodge') ? Math.floor(stats.initiative * .15) : 0),
      maxFatigue: stats.maxFatigue, initiative: stats.initiative, resolve: stats.resolve,
    }];
  });
  if (['shield-wall','skirmish'].includes(state.tactic)) shieldWallDeployment(company);
  const makeEnemyUnit = (enemy, index, unitDifficulty=camp.difficulty, unitRank=camp.veteranRank??0, undeadUnit=Boolean(undead||blacksmith?.ancient)) => {
    const rank = unitRank;
    // These authored champions bypass ordinary camp/band promotion.
    if (!['camp','band','bounty'].includes(encounterType)) enemy = championExtraGear(state, camp, enemy,
      enemy.troopIndex ?? index, getItem, championItemFactory(undead || blacksmith?.ancient ? 'ancient' : armoryTheme(regionAt(camp.x,camp.y).id)));
    const rareMount = getItem(enemy.mount);
    const gear = { armor: enemy.armor, attachment: enemy.attachment ?? null, attachment2:null, helmet: enemy.helmet, weapon: enemy.weapon, shield: enemy.shield, mount: rareMount?.id ?? null };
    const role = enemyRoleBonuses(enemy, CAMP_BY_ID.has(camp.id) ? 0 : unitDifficulty);
    const worn={equipment:gear,perks:role.perks,side:'enemy',prefixPerkRulesVersion:1,shieldDurability:enemy.savedDamage?.shieldDurability??shieldMaximum(gear.shield)};
    const shieldDefense=shieldDefenseFor(worn,gear.shield),rangedShieldDefense=shieldDefenseFor(worn,gear.shield,worn.shieldDurability,true);
    const bonus = key => Object.values(gear).reduce((sum,id)=>sum+(getItem(id)?.statBonuses?.[key]??0),0);
    const baseHp = 25 + unitDifficulty * 12 + rank * 8 + ((enemy.troopIndex ?? index) === 0 && unitDifficulty === 3 ? 12 : 0);
    const hp=Math.min(300,Math.round(((enemy.marshal?baseHp*2:enemy.champion?Math.ceil(baseHp*1.4):baseHp)+bonus('maxHp'))*(1+equipmentBoost({equipment:gear},'healthPct',getItem)/100))),championSkill=enemy.marshal?26:enemy.champion?12:0,championDefense=enemy.marshal?14:enemy.champion?8:0;
    return {
      ...(enemy.champion?{champion:true,championItemId:enemy.championItemId}:{}),
      id: `enemy-${(enemy.troopIndex ?? index) + 1}`, ...(undeadUnit ? { undeadTraitsVersion: 1, troopIndex: enemy.troopIndex } : {}), name: enemy.name, side: 'enemy', q: getItem(gear.weapon)?.ranged ? 12 + Math.floor(index / 12) : 11 - Math.floor(index / 12), r: 2 + DEPLOYMENT_ROW_OFFSET + FRONT_FORMATION[index % 12],
      hp: enemy.savedDamage?.hp ?? hp, maxHp: hp, bodyArmor: enemy.savedDamage?.bodyArmor ?? armorMaximum(gear.armor), attachmentArmor: armorMaximum(gear.attachment), attachment2Armor:0, maxAttachment2Armor:0, headArmor: enemy.savedDamage?.headArmor ?? armorMaximum(gear.helmet),
      maxBodyArmor: armorMaximum(gear.armor), maxAttachmentArmor: armorMaximum(gear.attachment), maxHeadArmor: armorMaximum(gear.helmet),
      shieldDurability: enemy.savedDamage?.shieldDurability ?? shieldMaximum(gear.shield), maxShieldDurability: shieldMaximum(gear.shield),
      reserveShieldDurability: shieldMaximum(enemy.reserveShield), maxReserveShieldDurability: shieldMaximum(enemy.reserveShield), battleSetSwapped: false,
      equipment: gear, reserveEquipment: { weapon: enemy.reserveWeapon ?? null, shield: enemy.reserveShield ?? null },
      throwingAmmo: { active: throwingCapacity(gear.weapon), reserve: throwingCapacity(enemy.reserveWeapon) }, accessories: [null, null],
      pocketDrawnFrom: null, pocketStowedWeapon: null, pocketStowedReload: 0, pocketDrawnRound: 0, reserveReload: 0, meleePhase: false,
      perks: role.perks, adaptation: 0, berserkRound: 0, frenzyUntilRound: 0, turnStartedRound: 0, freeSwapRound: 0, freeHealRound: 0,
      seed: hashSeed(`${state.seed}:${camp.id}:${enemy.troopIndex ?? index}`), alive: true,
      morale: undeadUnit ? 60 : 55 + unitDifficulty * 8, fatigue: 0, ap: 9, reload: 0, shieldWallActive: false, aiTargetId: null, formationMovedRound: 0,
      spearwallActive: false, riposteActive: false, stunnedTurns: 0, stunProtected: false, pendingBerserkAp: 0,
      meleeSkill: 30 + championSkill + unitDifficulty * 6 + rank * 4 + (rareMount?.hitBonus ?? 0) + role.meleeSkill + bonus('meleeSkill'), rangedSkill: 28 + championSkill + unitDifficulty * 6 + rank * 4 + (rareMount?.hitBonus ?? 0) + role.rangedSkill + bonus('rangedSkill'),
      meleeDefense: 2 + championDefense + unitDifficulty * 2 + rank * 2 + shieldDefense + bonus('meleeDefense') + (rareMount?.meleeDefenseBonus ?? 0),
      rangedDefense: 2 + championDefense + unitDifficulty * 2 + rank * 2 + rangedShieldDefense + bonus('rangedDefense') + (rareMount?.rangedDefenseBonus ?? 0) + attachmentBonus(gear,'rangedDefenseBonus'),
      maxFatigue: 85 + (enemy.marshal?40:enemy.champion?20:0) + bonus('maxFatigue') - (rareMount?.fatigue ?? 0), initiative: bonus('initiative') + 75 + (enemy.champion?8:0) + unitDifficulty * 6 + rank * 3 + (rareMount?.initiativeBonus ?? 0) + role.initiative + attachmentBonus(gear,'initiativeBonus'), resolve: 32 + (unitDifficulty>=3?20:0) + (enemy.champion?40:0) + unitDifficulty * 8 + rank * 4 + bonus('resolve'),
    };
  };
  const enemies=warrior?[(()=>{
    const person=restoredWarriorMember(state),stats=getCompanyStats(person,{ignoreInjuries:true}),template=structuredClone(company[0]);
    Object.assign(template,{id:'enemy-1',side:'enemy',name:person.name,skillPreference:person.skillPreference,q:11,r:10,equipment:{...person.equipment},reserveEquipment:{...person.reserveEquipment},accessories:[...person.accessories],throwingAmmo:{...person.throwingAmmo},perks:[...person.perks],seed:person.seed,injuries:copyInjuries(person.injuries).map(w=>({...w,fresh:false,sourceId:null})),hp:person.hp,maxHp:getCompanyStats(person).maxHp,morale:person.morale,alive:true});
    for(const key of ['bodyArmor','headArmor','attachmentArmor','attachment2Armor','maxBodyArmor','maxHeadArmor','maxAttachmentArmor','maxAttachment2Armor','shieldDurability','maxShieldDurability','reserveShieldDurability','maxReserveShieldDurability','meleeSkill','rangedSkill','meleeDefense','rangedDefense','maxFatigue','initiative','resolve'])template[key]=stats[key];
    // Waking disorientation applies once; retreat must not reset the penalty.
    if(state.legacyWarrior.condition===null)template.dazedTurns=2;
    template.bodyArmor=person.armorDurability.body;template.headArmor=person.armorDurability.head;
    if(hasPerk(person,'dodge')){template.meleeDefense-=Math.floor(stats.initiative*.15);template.rangedDefense-=Math.floor(stats.initiative*.15);}
    delete template.appearanceId;if(person.appearanceId)template.appearanceId=person.appearanceId;
    return template;
  })()]:camp.enemies.map((e,i)=>makeEnemyUnit(e,i));
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
  for(const unit of [...enemies,...allies])unit.tacticalRole=resolveCombatRole(warrior&&unit.side==='enemy'?state.legacyWarrior.member:{},getItem(unit.equipment.weapon),getItem(unit.reserveEquipment.weapon),{armor:getItem(unit.equipment.armor),mount:getItem(unit.equipment.mount)});
  for(const unit of [...company,...allies,...enemies]){
    const person=unit.side==='company'?personById(state,unit.id):null;
    const raw={body:person?person.armorDurability.body:unit.bodyArmor,head:person?person.armorDurability.head:unit.headArmor};
    const snapshot=createSetArmorSnapshot(unit,getItem,raw);if(!snapshot)continue;
    unit.setArmor=snapshot;unit.maxBodyArmor=snapshot.body.effectiveMax;unit.bodyArmor=snapshot.body.initial;unit.maxHeadArmor=snapshot.head.effectiveMax;unit.headArmor=snapshot.head.initial;
    if(!person){const load=effectiveArmorFatigue(unit,getItem),attachments=effectiveAttachmentFatigue(unit,getItem),saving=(getItem(unit.equipment.armor)?.fatigue??0)+(getItem(unit.equipment.helmet)?.fatigue??0)-load.body-load.head+['attachment','attachment2'].reduce((sum,slot)=>sum+(getItem(unit.equipment[slot])?.fatigue??0)-attachments[slot],0);unit.maxFatigue+=saving;unit.initiative+=saving;}
  }
  const battle = {
    id: `battle-${camp.id}-${state.day}-${state.contractSerial}`, campId: camp.id,
    ...(undead ? { crisisContext: { crisisId: state.ashenWinter.crisisId, frontId: undead.frontId, townId: undead.townId, forceSeed: undead.force.seed, generation: undead.force.generation } } : {}),
    ...(patrolAssist?{patrolAssist}:{}),
    encounterType, encounterName: camp.name, difficulty: camp.difficulty, campGeneration: encounterType === 'camp' ? camp.generation : null,
    famedDrop: encounterType === 'camp' ? famedDropForCamp(state.seed,camp,encounterAffixes(state,camp.id,camp.generation)) : null, mountReward: encounterType==='camp' ? campMountReward(state.seed,camp,camp.discoveryBonuses?.mount??0) : null, field,
    tactic: state.tactic ?? 'offense', focusTargetId: null, lastContactRound: 1, engaged: false,
    injuryRulesVersion:1, injuryRng:hashSeed(`${state.seed}:${camp.id}:${state.day}:${state.contractSerial}:injuries`),
    status: 'active', equipmentSetRulesVersion:EQUIPMENT_SET_RULES_VERSION, itemAffixRulesVersion:2, lighting:getTimeOfDay(state.hour).phase, escapeRulesVersion:1, championLootVersion:2, enemyScalingVersion:1, enemyTacticsVersion:1, championRulesVersion:1, attachmentRulesVersion:1, equipmentEffectsVersion:EQUIPMENT_EFFECTS_VERSION, prefixPerkRulesVersion:1, perkBalanceVersion:1, perkCombatVersion:1, rulesVersion: 2, weaponSkillsVersion: 1, weaponAuditVersion: 1, weaponCompletionVersion: 1, roleConsistencyVersion: 1, mountSkillsVersion: 1, mountBalanceVersion: 1, round: 1, activeId: null, units: [...company, ...allies, ...enemies],
    enemyOpening: encounterType==='band'&&enemyOpening,
    turnOrder: [], turnIndex: 0, rng: hashSeed(`${state.seed}:${camp.id}:${state.day}:${state.contractSerial}`),
    lootSeed: hashSeed(`${state.seed}:${camp.id}:${encounterType === 'band' ? camp.spawnCycle : camp.generation}:salvage`),
    log: [], lastEvent: null,
    loot: { gold: 0, food: 0, tools: 0, medicine: 0, ammo: 0, items: [], itemConditions: [] },
    casualties: [], xp: {},
  };
  for (const unit of battle.units) { unit.battleStats = newBattlePerformance(); unit.prefixPerkRulesVersion=1; unit.equipmentEffectsVersion=EQUIPMENT_EFFECTS_VERSION; if(hasBonePlating(unit,getItem))unit.bonePlatingSpent=false; }
  battle.enemyTacticalState = {tactic:'offense',lastChangedRound:1,lastEvaluatedRound:0,lastRangedAttackRound:0};
  battle.enemyAdaptiveRulesVersion = 1;
  for (const unit of battle.units) unit.movementCredit = Math.max(0, movementBudget(unit, battle) - 2) * 2;
  battle.formationAdvance = ['advance-formation', 'shield-wall'].includes(battle.tactic) ? makeFormationAdvancePlan(battle) : null;
  for (const unit of battle.units) { unit.injuries ??= []; unit.perkBalanceVersion=1; unit.ap=getTurnAp(unit); }
  battle.turnOrder = sortTurnOrder(battle);
  orderCompanyTurnsForFormation(battle);
  if(battle.enemyOpening)battle.turnOrder.sort((a,b)=>Number(battle.units.find(u=>u.id===b).side==='enemy')-Number(battle.units.find(u=>u.id===a).side==='enemy'));
  battle.activeId = battle.turnOrder[0];
  if(isSimultaneousBetaEnabled()){battle.simultaneous=initialSimultaneousClock(battle);for(const unit of battle.units){regenerateLivingShield(battle,unit);if(unit.dazedTurns>0)markSimultaneousEffect(battle,unit,'dazedTurns',unit.dazedTurns);}}
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
  if(battle.simultaneous)return;
  const previous = battle.units.find(unit => unit.id === battle.activeId);
  if (previous?.overwhelmed) delete previous.overwhelmed;
  if (previous?.howlTurns > 0) previous.howlTurns -= 1;
  if(battle.weaponCompletionVersion===1)for(const key of ['dazedTurns','affixDazedTurns','staggeredTurns','disarmedTurns'])if(previous?.[key]>0)previous[key]--;
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
      if(battle.perkBalanceVersion===1)delete unit.reachAdvantageStacks;
      unit.ap = battle.rulesVersion === 2 ? getTurnAp(unit) + (battle.weaponSkillsVersion === 1 ? unit.pendingBerserkAp ?? 0 : 0) : 2;
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
  if(battle.encounterType==='legacy-warrior')return {gold:0,food:0,tools:0,medicine:0,ammo:0,items:[],itemConditions:[]};
  const tier = battle.difficulty ?? 0;
  const band = battle.encounterType === 'band';
  const seed = battle.lootSeed ?? hashSeed(battle.id);
  const roll = (key, count) => hashSeed(`${seed}:${key}`) % count;
  const items = [];
  const itemConditions = [];
  const addItem = (id, condition = itemCondition(id), trophy=false) => {
    if (id && items.length < (trophy ? battle.championLootVersion>=1 ? Math.max(24,enemies.length*(battle.championLootVersion===2?8:6)) : battle.enemyScalingVersion===1 ? 80 : 24 : 24)) { items.push(id); itemConditions.push(condition); }
  };
  const guaranteed=new Set();
  for (const enemy of enemies) if (enemy.champion && !enemy.escaped) {
    const slots = [['weapon','active'],['shield','active'],['armor','active'],['helmet','active'],['attachment','active'],['attachment2','active'],['weapon','reserve'],['shield','reserve']];
    for (const [slot,set] of slots) {
      const id = (set === 'reserve' ? enemy.reserveEquipment : enemy.equipment)?.[slot];
      if (!['famed','named'].includes(getItem(id)?.rarity)) continue;
      const maximum = itemCondition(id), worn = slot === 'armor' ? baseArmorCondition(enemy,'body') : slot === 'helmet' ? baseArmorCondition(enemy,'head') : slot==='attachment' ? enemy.attachmentArmor : slot==='attachment2' ? enemy.attachment2Armor
        : slot === 'shield' ? set === 'reserve' ? enemy.reserveShieldDurability : enemy.shieldDurability
        : getItem(id)?.throwing ? enemy.throwingAmmo?.[set] : null;
      addItem(id, maximum === null ? null : Math.max(Math.ceil(maximum*.25),worn ?? maximum), true);
      if (set === 'active') guaranteed.add(`${enemy.id}:${slot}`);
    }
  }
  if (!band) {addItem(battle.famedDrop);addItem(battle.mountReward);}
  for (const enemy of enemies) {
    for (const slot of ['weapon', 'shield', 'armor', 'attachment', 'attachment2', 'helmet']) {
      const id = enemy.equipment[slot];
      if (!id || items.length >= 24 || guaranteed.has(`${enemy.id}:${slot}`)) continue;
      const maximum = armorMaximum(id);
      const condition = slot === 'weapon' && getItem(id)?.throwing ? enemy.throwingAmmo?.active ?? throwingCapacity(id)
        : slot === 'armor' ? baseArmorCondition(enemy,'body') : slot === 'attachment' ? enemy.attachmentArmor : slot==='attachment2'?enemy.attachment2Armor : slot === 'helmet' ? baseArmorCondition(enemy,'head') : slot === 'shield' ? enemy.shieldDurability : null;
      if (maximum && condition < Math.ceil(maximum * .25)) continue;
      const chance = ['named','famed'].includes(getItem(id)?.rarity) ? 100 : slot === 'weapon' ? 70 : slot === 'shield' ? 55 : 40;
      if (roll(`${enemy.id}:${slot}`, 100) < chance) {const enhanced=slot==='attachment'&&!getItem(id).rollVersion&&roll(`${enemy.id}:${slot}:fine`,100)<20?createFamedItemId(id,hashSeed(`${seed}:${enemy.id}:${slot}:attachment`),5):id;addItem(enhanced,condition);}
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
  const mounts=simultaneousActionCaches.get(battle)?.mounted??battle.units;
  if (mounts.some(unit => unit.alive && unit.side !== actor.side && getItem(unit.equipment.mount)
    && hexDistance(from, unit) <= 1 && hexDistance(to, unit) > 1)) return Infinity;
  let cost = movementCost(battle.field, from, to);
  if (!Number.isFinite(cost)) return Infinity;
  if(equipmentBoost(actor,'heightRelief',getItem)){const tile=tileAt(battle.field,to.q,to.r);cost=['trees','mud'].includes(tile.terrain)?2:1;}
  return (hasPerk(actor, 'pathfinder') ? Math.max(1, cost - 1) : cost);
}

function movementFatigue(actor, cost) {
  return Math.ceil(cost * (hasPerk(actor, 'marathoner') ? 2 : 3) * (actor.perkBalanceVersion===1 && hasPerk(actor,'pathfinder') ? (perkUpgraded(actor,'pathfinder')?.25:.5) : 1));
}

function movementBudget(actor, battle) {
  const load=effectiveArmorFatigue(actor,getItem);
  const lightArmor = load.body+load.head+(battle?.attachmentRulesVersion===1?0:getItem(actor.equipment.attachment)?.fatigue??0)<=15;
  return 2 + (getItem(actor.equipment.mount) && battle?.mountBalanceVersion !== 1 ? 2 : 0) + (lightArmor && hasPerk(actor, 'fleet-footed') ? perkUpgraded(actor,'fleet-footed')?2:1 : 0);
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
  const worn={...actor,equipment:{...actor.equipment,shield:shieldId},shieldDurability:durability};
  return (hasPerk(worn, 'shield-expert') ? Math.ceil(defense * (perkUpgraded(worn,'shield-expert')?1.4:1.25)) : defense)
    + (defense && hasPerk(actor, 'shield-bearer') ? 5 : 0);
}

function changeBattleWeapon(actor, weaponId, shieldId, shieldDurability = actor.shieldDurability, battle=null) {
  const oldDefense = shieldDefenseFor(actor, actor.equipment.shield),oldRangedDefense=shieldDefenseFor(actor,actor.equipment.shield,actor.shieldDurability,true);
  const oldFatigue = battleGearFatigue(actor.equipment),oldRelentlessFactor=relentlessFactor(actor);
  actor.equipment.weapon = weaponId;
  if(actor.perkBalanceVersion===1&&(!getItem(weaponId)?.twoHanded||getItem(weaponId)?.ranged))delete actor.reachAdvantageStacks;
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
  const setLoad=effectiveArmorFatigue(actor,getItem);
  const armorFatigue = setLoad.body+setLoad.head+(battle?.attachmentRulesVersion===1?0:getItem(actor.equipment.attachment)?.fatigue??0);
  const armorPenalty = hasPerk(actor, 'brawny') ? Math.floor(armorFatigue * .7) : armorFatigue;
  const initiativeDelta = actor.prefixPerkRulesVersion===1
    ? Math.ceil((armorPenalty+oldFatigue)*oldRelentlessFactor)-Math.ceil((armorPenalty+newFatigue)*relentlessFactor(actor))
    : hasPerk(actor, 'relentless')
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
    ? actor.accessories.findIndex(id => getItem(id)?.consumable === 'recover' && actor.fatigue >= injuryStat(actor,'maxFatigue') * .75)
    : -1;
  if (selected < 0) return false;
  const item = getItem(actor.accessories[selected]);
  if (item.consumable === 'heal' && actor.hp >= actor.maxHp || item.consumable === 'recover' && actor.fatigue === 0) return false;
  const free = item.consumable === 'heal' && hasPerk(actor, 'combat-bandaging') && actor.freeHealRound !== state.battle.round;
  if (!free && state.battle.rulesVersion === 2 && actor.ap < 4) return false;
  if (item.consumable === 'heal') actor.hp = Math.min(actor.maxHp, actor.hp + Math.ceil(item.heal*(perkUpgraded(actor,'combat-bandaging')?1.25:1)));
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

function finishBattleSwap(state, actor, message, plannedCost=null) {
  const cost=plannedCost??battleSwapCost(actor,state.battle),free=cost===0;
  if (free) actor.freeSwapRound = state.battle.round;
  else actor.ap = state.battle.rulesVersion === 2 ? actor.ap - cost : 0;
  state.battle.lastEvent = makeBattleEvent(actor, null, 'swap', message, getItem(actor.equipment.weapon));
  battleLog(state.battle, message);
  if (!free && actor.ap <= 0) nextBattleTurn(state.battle);
  return true;
}

function switchBattleSet(state, actor, message) {
  const plannedCost=actor.prefixPerkRulesVersion===1?battleSwapCost(actor,state.battle):null;
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
  return finishBattleSwap(state, actor, message, plannedCost);
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
  const plannedCost=actor.prefixPerkRulesVersion===1?battleSwapCost(actor,state.battle):null;
  if (!roleRules(state.battle)&&(actor.side !== 'company' || actor.ally)) return false;
  const nearest = Math.min(...enemies.map(enemy => hexDistance(actor, enemy)));
  if (state.battle.rulesVersion === 2 && actor.ap < battleSwapCost(actor,state.battle)) return false;
  if (roleRules(state.battle) && actor.tacticalRole==='flanker' && getItem(actor.equipment.mount)
    && getItem(actor.equipment.weapon) && !getItem(actor.equipment.weapon).ranged
    && enemies.some(enemy=>!isMoraleImmune(enemy) && enemy.morale<25 && hexDistance(actor,enemy)===1)) return false;
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
      return finishBattleSwap(state, actor, message, plannedCost);
    }
    return false;
  }
  const active = getItem(actor.equipment.weapon);
  const reserve = getItem(actor.reserveEquipment.weapon);
  const reserveHasAmmo = battleWeaponHasAmmo(state, actor, reserve, 'reserve');
  if (roleRules(state.battle) && actor.tacticalRole==='reach-support') {
    const swapCost=battleSwapCost(actor,state.battle);
    if (!active?.ranged && !reserve?.ranged && reserve) {
      const backup=nearest===1 && (active?.range??1)>1 && (reserve.range??1)===1;
      const restore=nearest>=2 && (active?.range??1)===1 && (reserve.range??1)>1
        && !(combatCommand(state.battle,actor)==='shield-wall' && actor.equipment.shield && actor.shieldDurability>0);
      if ((backup && canAfford(state.battle,actor,swapCost+attackApCost(reserve,state.battle,actor),attackFatigueCost(actor,reserve,state.battle)))
        || restore && actor.ap>=swapCost) {
        return switchBattleSet(state,actor,`${actor.name} draws ${reserve.name} ${backup?'for close fighting':'to support the line'}.`);
      }
    }
  }

  const outOfAmmo = roleRules(state.battle)?!battleWeaponHasAmmo(state,actor,active):active?.throwing ? (actor.throwingAmmo?.active ?? 0) === 0 : state.supplies.ammo === 0;
  if (roleRules(state.battle) && actor.tacticalRole==='flanker' && active?.throwing && !outOfAmmo
    && nearest>1 && ['dagger','qatal'].includes(weaponSkillFamily(reserve))) {
    const swapCost=battleSwapCost(actor,state.battle);
    for (const target of enemies.filter(enemy=>hexDistance(actor,enemy)===2)) {
      const engaged=state.battle.units.some(u=>u.alive && u.side===actor.side && u.id!==actor.id && hexDistance(u,target)===1);
      if (!engaged) continue;
      const path=pathToTarget(state.battle,actor,target,1,false,true,flankerGoal(state.battle,actor,target,false));
      if (path?.length!==1) continue;
      const option=completedSkillOptions(actor,target,reserve,state.battle)[0] ?? equipmentSkills(reserve)[0];
      const moveAp=battleMoveApCost(state.battle,actor,actor,path[0]);
      const fatigue=movementFatigue(actor,battleMovementCost(state.battle,actor,actor,path[0]))+attackSkillFatigue(actor,reserve,option);
      if (canAfford(state.battle,actor,swapCost+moveAp+attackApCost(reserve,state.battle,actor,option),fatigue)) {
        actor.aiTargetId=target.id;
        return switchBattleSet(state,actor,`${actor.name} draws ${reserve.name} to flank an engaged enemy.`);
      }
    }
  }
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
      return finishBattleSwap(state, actor, message, plannedCost);
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

// Mounted wing fighters pin broken enemies with a real melee weapon in hand.
// Recompute paths each action: no pursuit state survives recovery or casualties.
function mountedFlankerPursuit(state, actor, enemies) {
  const battle=state.battle;
  if (!roleRules(battle) || actor.tacticalRole!=='flanker' || !getItem(actor.equipment.mount)
    || actor.disarmedTurns || shouldPreserveBrother(battle,actor)) return null;
  const broken=enemies.filter(enemy=>!enemy.escaped && !isMoraleImmune(enemy) && enemy.morale<25);
  if (!broken.length) return null;
  const adjacent=enemies.filter(enemy=>hexDistance(actor,enemy)===1);
  if (adjacent.length && !adjacent.some(enemy=>broken.includes(enemy))) return null;
  const active=getItem(actor.equipment.weapon),reserve=getItem(actor.reserveEquipment.weapon);
  const pocket=actor.accessories.findIndex(id=>getItem(id)?.pocketWeapon && !getItem(id).ranged);
  if ((!active || active.ranged) && (!reserve || reserve.ranged) && pocket<0) return null;
  const choices=(adjacent.length?broken.filter(enemy=>hexDistance(actor,enemy)===1):broken)
    .map(target=>({target,path:pathToTarget(battle,actor,target,1,false,true)}))
    .filter(entry=>entry.path!==null)
    .sort((a,b)=>pathCost(battle,actor,actor,a.path)-pathCost(battle,actor,actor,b.path)
      || a.target.id.localeCompare(b.target.id));
  if (!choices.length) return null;
  const {target,path}=choices[0];
  if (!active || active.ranged) {
    const swapCost=battleSwapCost(actor,battle);
    if (actor.ap<swapCost) return null;
    actor.aiTargetId=target.id;
    if (reserve && !reserve.ranged) {
      switchBattleSet(state,actor,`${actor.name} draws ${reserve.name} to intercept a broken enemy.`);
    } else {
      actor.pocketStowedWeapon=actor.equipment.weapon;actor.pocketStowedReload=actor.reload;
      actor.pocketDrawnFrom=pocket;actor.pocketDrawnRound=battle.round;
      changeBattleWeapon(actor,actor.accessories[pocket],actor.equipment.shield,actor.shieldDurability,battle);
      actor.accessories[pocket]=null;actor.reload=0;
      finishBattleSwap(state,actor,`${actor.name} draws a pocket weapon to intercept a broken enemy.`,actor.prefixPerkRulesVersion===1?swapCost:null);
    }
    return result(true,battle.lastEvent.message);
  }
  // Once engaged, retain the melee set and let normal adjacent attacks resolve.
  if (adjacent.length || !path.length) return null;
  const charge=horseChargePlan(battle,actor,target,active);
  if (charge) {performHorseCharge(state,actor,target,active,charge);return result(true,battle.lastEvent.message);}
  const moved=moveToRangedPosition(state,actor,{point:path[0],message:`${actor.name} rides to intercept ${target.name}.`},'pursuit');
  if (moved) actor.aiTargetId=target.id;
  return moved;
}

function enemiesAdjacent(battle,actor) {
  return battle.units.some(unit=>unit.alive&&unit.side!==actor.side&&hexDistance(actor,unit)===1);
}

function readyShieldWallSet(state, actor) {
  // A loaded throwing set is the skirmisher's current duty. Do not replace
  // it with the shield set that weapon selection would immediately undo.
  if(roleRules(state.battle)&&getItem(actor.equipment.weapon)?.throwing&&battleWeaponHasAmmo(state,actor,getItem(actor.equipment.weapon))&&!enemiesAdjacent(state.battle,actor))return false;
  if (state.battle.rulesVersion === 2 && actor.ap < battleSwapCost(actor,state.battle)) return false;
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
  if (!meleeApproachSafe(battle,actor,getItem(actor.equipment.weapon),destination,battleMoveApCost(battle,actor,from,destination),movementFatigue(actor,cost))) return null;
  actor.q = destination.q;
  actor.r = destination.r;
  actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + movementFatigue(actor, cost));
  if (living.every(reached)) plan.completedRound = battle.round;
  return from;
}

function moveOneFormationHex(battle, actor, destination, message) {
  const from = { q: actor.q, r: actor.r };
  const cost = battleMovementCost(battle, actor, actor, destination);
  if (!Number.isFinite(cost)) return false;
  actor.q = destination.q;
  actor.r = destination.r;
  actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + movementFatigue(actor, cost));
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

function simultaneousTargetPath(battle,actor,target,range,keepRangedSpace,occupied,cache,goalTest=null) {
  const stamp=battle.units.filter(u=>u.alive).map(u=>`${u.id}:${u.q},${u.r}`).join('|');
  if(cache.stamp!==stamp){cache.stamp=stamp;cache.paths=new Map();}
  const key=`${actor.id}:${actor.q},${actor.r}:${actor.side}:${hasPerk(actor,'pathfinder')}:${equipmentBoost(actor,'heightRelief',getItem)}:${keepRangedSpace}`;
  let points=cache.paths.get(key);
  if(!points){
    const queue=new SimultaneousPathQueue({q:actor.q,r:actor.r,path:[],cost:0});
    const best=new Map([[`${actor.q},${actor.r}`,0]]);points=[];
    while(queue.length){
      const p=queue.shift();if(p.cost>best.get(`${p.q},${p.r}`))continue;
      points.push(p);
      for(const next of openNeighbors(battle,p,occupied)){
        if(keepRangedSpace&&nearestEnemyDistance(battle,actor,next)<2)continue;
        const cost=p.cost+battleMovementCost(battle,actor,p,next),id=`${next.q},${next.r}`;
        if(cost<(best.get(id)??Infinity)){best.set(id,cost);queue.push({...next,path:[...p.path,next],cost});}
      }
    }
    cache.paths.set(key,points);
  }
  let goal=null;
  for(const p of points){
    if(goal&&p.cost>goal.cost)break;
    if(goalTest&&!goalTest(p)||hexDistance(p,target)>range||keepRangedSpace&&nearestEnemyDistance(battle,actor,p)<2)continue;
    const aim=keepRangedSpace?rangedTerrainModifier(battle,actor,p,target):heightHitModifier(battle.field,p,target);
    const quality=aim+(tileAt(battle.field,p.q,p.r).terrain==='trees'?5:0);
    if(!goal||quality>goal.quality)goal={path:p.path,cost:p.cost,quality};
  }
  return goal?.path??(keepRangedSpace&&hexDistance(actor,target)<=range&&(!goalTest||goalTest(actor))?[]:null);
}

function pathToTarget(battle, actor, target, range, keepRangedSpace = false, flank = false, flankGoal = null) {
  const occupied = new Set(battle.units.filter(unit => unit.alive && unit.id !== actor.id).map(unit => `${unit.q},${unit.r}`));
  const cache=simultaneousActionCaches.get(battle);
  if(cache&&!flank)return simultaneousTargetPath(battle,actor,target,range,keepRangedSpace,occupied,cache,flankGoal);
  const flankThreats = flank ? battle.units.filter(unit=>unit.alive && unit.side!==actor.side && unit.id!==target.id) : [];
  const first = { q: actor.q, r: actor.r, path: [], cost: 0 };
  const queue = battle.simultaneous ? new SimultaneousPathQueue(first) : [first];
  const best = new Map([[`${actor.q},${actor.r}`, 0]]);
  let goal = null;
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost || a.q - b.q || a.r - b.r);
    const point = queue.shift();
    if (point.cost > best.get(`${point.q},${point.r}`)) continue;
    if (goal && point.cost > goal.cost) break;
    if ((!flankGoal || flankGoal(point)) && hexDistance(point, target) <= range && (!keepRangedSpace || nearestEnemyDistance(battle, actor, point) >= 2)) {
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
  return goal?.path ?? (keepRangedSpace && hexDistance(actor, target) <= range && (!flankGoal || flankGoal(actor)) ? [] : null);
}

// Safe melee reach uses the same occupancy/terrain search as other roles.
// A useful current position is always stable; cover only influences an advance.
function reachSupportPath(battle, actor, target, weapon) {
  const range=effectiveWeaponRange(actor,weapon);
  if (range<=1 || weapon.ranged || enemiesAdjacent(battle,actor))
    return pathToTarget(battle,actor,target,range,weapon.ranged===true);
  let direct=pathToTarget(battle,actor,target,range,true);
  if (!direct?.length) return direct;
  const enemies=battle.units.filter(unit=>unit.alive && !unit.escaped && unit.side!==actor.side);
  const canAdvance=path=>!path?.length || !enemies.some(enemy=>hexDistance(path[0],enemy)<=range)
    || canAfford(battle,actor,battleMoveApCost(battle,actor,actor,path[0])+attackApCost(weapon,battle,actor),
      movementFatigue(actor,battleMovementCost(battle,actor,actor,path[0]))+attackFatigueCost(actor,weapon,battle));
  if (!canAdvance(direct)) {
    // Wait after spending AP; at a fresh turn find a usable alternate route.
    const cheapestStep=Math.min(...hexNeighbors(battle.field,actor).map(point=>battleMoveApCost(battle,actor,actor,point)));
    if (actor.ap<attackApCost(weapon,battle,actor)+cheapestStep) return null;
    direct=pathToTarget(battle,actor,target,range,true,false,point=>canAdvance(point.path));
    if (!direct) return null;
  }
  const allies=battle.units.filter(unit=>unit.alive && !unit.escaped && unit.side===actor.side && unit.id!==actor.id
    && hexDistance(unit,target)<=range && !getItem(unit.equipment.weapon)?.ranged);
  const behind=(point,screen)=>hexDistance(point,screen)===1 && hexDistance(screen,target)<hexDistance(point,target);
  const shields=allies.filter(unit=>unit.equipment.shield && unit.shieldDurability>0);
  for (const screens of [shields,allies]) {
    if (!screens.length) continue;
    const sheltered=pathToTarget(battle,actor,target,range,true,false,point=>canAdvance(point.path) && screens.some(screen=>behind(point,screen)));
    if (sheltered && pathCost(battle,actor,actor,sheltered)<=pathCost(battle,actor,actor,direct)+2) return sheltered;
  }
  return direct;
}

// Axial r + q/2 is the lateral axis of the battlefield. Flankers work
// outside the hostile melee line, rather than simply rushing its archers.
function flankerGoal(battle, actor, target, ranged) {
  const enemies=battle.units.filter(u=>u.alive && u.side!==actor.side);
  const line=enemies.filter(u=>!getItem(u.equipment.weapon)?.ranged);
  const lateral=u=>u.r+u.q/2;
  const low=Math.min(...(line.length?line:enemies).map(lateral))-1;
  const high=Math.max(...(line.length?line:enemies).map(lateral))+1;
  const engaged=battle.units.some(u=>u.alive && u.side===actor.side && u.id!==actor.id && hexDistance(u,target)===1);
  return point=>lateral(point)<=low || lateral(point)>=high || !ranged && engaged;
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
  actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + movementFatigue(actor, option.cost));
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
  if (!meleeApproachSafe(battle,actor,getItem(actor.equipment.weapon),point,battleMoveApCost(battle,actor,from,point),movementFatigue(actor,battleMovementCost(battle,actor,from,point)))) return null;
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
  if (roleRules(battle) && actor.tacticalRole==='flanker') return null;
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

const AXE_VISUALS = new Set(['axe', 'greataxe', 'hand-axe', 'longaxe', 'bardiche', 'throwingaxe', 'heavythrowingaxe']);
const WEAPON_MASTERY_IDS = ['sword-training', 'axe-training', 'mace-training', 'spear-training', 'polearm-training', 'dagger-training', 'throwing-training'];


function battleMasteryMatches(actor,id,weapon) {
  if(actor.perkBalanceVersion!==1){
    if(id==='polearm-training')return !weapon?.ranged&&(weapon?.range??1)>=2;
    if(id==='spear-training')return !weapon?.throwing&&/spear|pike/.test(weaponTrainingVisual(weapon)??'');
    if(id==='mace-training'&&['polemace','heavymace','heavyflail'].includes(weaponTrainingVisual(weapon)))return false;
  }
  return weaponMasteryMatches(id,weapon);
}

function heavyWeaponSpecialist(actor,weapon) {
  return actor.perkBalanceVersion===1 && weapon?.slot==='weapon' && weapon.twoHanded && !weapon.ranged && (weapon.range??1)===1 && hasPerk(actor,'heavy-weapon-specialist');
}

function upgradedWeaponMastery(actor,weapon){
  return isBow(weapon)&&perkUpgraded(actor,'bow-mastery') || isCrossbow(weapon)&&perkUpgraded(actor,'crossbow-mastery') || WEAPON_MASTERY_IDS.some(id=>battleMasteryMatches(actor,id,weapon)&&perkUpgraded(actor,id));
}

function masteredFatigue(actor,weapon,base) {
  return Math.ceil(base * (hasWeaponMastery(actor,weapon) ? .75 : 1) * (heavyWeaponSpecialist(actor,weapon) ? .9 : 1));
}

function hasWeaponMastery(actor, weapon) {
  return isBow(weapon) && hasPerk(actor, 'bow-mastery')
    || isCrossbow(weapon) && hasPerk(actor, 'crossbow-mastery')
    || WEAPON_MASTERY_IDS.some(id => hasPerk(actor, id) && battleMasteryMatches(actor,id, weapon));
}

function attackFatigueCost(actor, weapon, battle=null) {
  const base = Math.max(0,((battle?.weaponCompletionVersion===1?equipmentSkills(weapon)[0]?.fatigue:undefined) ?? weapon?.fatigueCost ?? (weapon?.ranged ? 9 : 11))+(weapon?.fatigueOnSkillUse??0));
  return masteredFatigue(actor,weapon,base);
}

function attackApCost(weapon, battle = null, actor = null, option = null) {
  if (option?.id === 'charge') return option.ap;
  const base = option?.ap ?? (battle?.weaponCompletionVersion===1&&battle.weaponSkillsVersion===1?equipmentSkills(weapon)[0]?.ap:undefined) ?? (isCrossbow(weapon) ? 3 : weapon?.ranged ? 4
    : battle?.weaponSkillsVersion === 1 && ['dagger', 'qatal'].includes(weaponSkillFamily(weapon)) ? 3
    : weapon?.twoHanded || (weapon?.range ?? 1) > 1 && !weapon?.ranged ? 6 : 4);
  const fixedSkillCost=actor?.perkBalanceVersion===1&&(['split','swing'].includes(option?.id)&&base===5 || option?.id==='riposte');
  const discount=!fixedSkillCost && actor && (actor.perkBalanceVersion===1
    ? upgradedWeaponMastery(actor,weapon) || weaponMasteryMatches('dagger-training',weapon)&&hasPerk(actor,'dagger-training') || weaponMasteryMatches('polearm-training',weapon)&&hasPerk(actor,'polearm-training')
    : hasWeaponMastery(actor,weapon));
  const extraPolearm=!fixedSkillCost&&actor&&perkUpgraded(actor,'polearm-training')&&battleMasteryMatches(actor,'polearm-training',weapon);
  return battle?.weaponSkillsVersion === 1 && discount ? Math.max(1, base - 1 - Number(extraPolearm)) : base;
}

function weaponTrainingHit(actor, weapon) {
  if (hasPerk(actor, 'sword-training') && battleMasteryMatches(actor,'sword-training', weapon)) return 8;
  if (hasPerk(actor, 'spear-training') && battleMasteryMatches(actor,'spear-training', weapon)) return 8;
  if (hasPerk(actor, 'throwing-training') && battleMasteryMatches(actor,'throwing-training', weapon)) return 8;
  if (perkUpgraded(actor,'dagger-training') && battleMasteryMatches(actor,'dagger-training',weapon)) return 10;
  return 0;
}

function effectiveWeaponRange(actor, weapon) {
  const range = (weapon?.range ?? 1) + (weapon?.ranged&&!weapon.throwing?equipmentRangedReach(actor,getItem):0) + (weapon?.ranged?equipmentBoost(actor,'rangedReach',getItem):0) + (isBow(weapon) && hasPerk(actor, 'bow-mastery') ? 1 : 0);
  return weapon ? injuryRange(actor,{...weapon,range}) : range;
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

function moraleDamage(unit, amount, battle = null) {
  const resolve = injuryStat(unit,'resolve') * (battle ? 1 + getLoneWolfBonus(battle, unit) : 1);
  const resistance = clamped(1 - (resolve - 40) * .005, .6, 1.2);
  return Math.max(1, Math.round(amount * resistance * (hasPerk(unit, 'fortified-mind') ? .8 : 1)));
}

export function shieldImpactDamage(weapon) {
  if(weapon?.shieldDamage!==undefined)return weapon.shieldDamage;
  const visual = weaponTrainingVisual(weapon) ?? '';
  if (weapon?.throwing) return visual.includes('axe') ? (visual.includes('heavy') ? 24 : 18) : (visual.includes('heavy') ? 18 : 12);
  return !weapon?.ranged && AXE_VISUALS.has(visual) ? 12 : 0;
}

function regenerateLivingShield(battle,unit){
  if(battle.equipmentEffectsVersion!==EQUIPMENT_EFFECTS_VERSION||unit.shieldRegenRound===battle.round||!unit.alive)return;
  // Record every owner's turn, even with a different shield: swapping cannot farm regeneration.
  unit.shieldRegenRound=battle.round;
  const amount=livingShieldRegeneration(unit,getItem);
  if(!amount)return;
  const restored=Math.min(amount,unit.maxShieldDurability-unit.shieldDurability);
  if(restored>0){unit.shieldDurability+=restored;battleLog(battle,`${unit.name}'s Living Tree Shield regrows ${restored} durability.`);}
}
function finishedShieldCondition(battle,id,condition){return battle.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&condition>0&&getItem(id)?.shieldRegeneration?shieldMaximum(id):condition;}

function wearShield(battle, unit, amount) {
  if (!unit.equipment.shield || unit.shieldDurability <= 0 || amount <= 0) return 0;
  const previous = unit.shieldDurability;
  const wear = hasPerk(unit, 'shield-expert') ? Math.max(1, Math.ceil(amount * (perkUpgraded(unit,'shield-expert')?.4:.5))) : amount;
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

export function getLoneWolfBonus(battle, unit) {
  return hasPerk(unit, 'lone-wolf') && !battle.units.some(ally => ally.alive && !ally.escaped && ally.side === unit.side && ally.id !== unit.id && hexDistance(ally, unit) <= 1) ? .15 : 0;
}

export function getOverwhelmMultiplier(battle, unit) {
  return unit.overwhelmed?.round === battle.round ? Math.max(0, 1 - unit.overwhelmed.stacks * .1) : 1;
}

export function getHeadHitChance(actor, weapon, option = null) {
  if (option?.head !== undefined) return option.head ? 1 : 0;
  if (option?.id === 'puncture') return 0;
  if (['flail-headshot', 'whip-crack'].includes(option?.id)) return 1;
  return weapon?.id && actor.headHunterReady && hasPerk(actor, 'head-hunter') && !option?.freeFollowup ? 1 : Math.min(1,(weapon.headChance??.22)*(1+equipmentBoost(actor,'headChancePct',getItem)/100));
}

function applyOverwhelm(battle, actor, target, weapon, option) {
  if (battle.perkCombatVersion !== 1 || !hasPerk(actor, 'overwhelm') || !target.alive || actor.side === target.side || !weapon.id
    || option?.reaction || option?.freeFollowup || option?.dot || option?.id === 'split-shield'
    || option?.areaFollowup && !option?.areaAction
    || (battle.simultaneous ? target.ap<=0 : target.turnStartedRound === battle.round || !battle.turnOrder.slice(battle.turnIndex + 1).includes(target.id))) return;
  const stacks = target.overwhelmed?.round === battle.round ? target.overwhelmed.stacks : 0;
  target.overwhelmed = { round: battle.round, stacks: Math.min(100, stacks + 1) };
}

export function attackHitChance(battle, actor, target, weapon, hitBonus = 0, option = null) {
  const ranged = weapon.ranged === true;
  const skill = (ranged ? injuryStat(actor,'rangedSkill') : injuryStat(actor,'meleeSkill')) * (1 + getLoneWolfBonus(battle, actor)) * getOverwhelmMultiplier(battle, actor) * (actor.affixDazedTurns>0?.8:1);
  const dodgeDefense = hasPerk(target, 'dodge')
    ? Math.floor(Math.max(0, combatInitiative(target) - target.fatigue * (hasPerk(target, 'relentless') ? perkUpgraded(target,'relentless')?.05:.1 : .2)) * .15) : 0;
  const reachDefense = hasPerk(target, 'reach-advantage') && getItem(target.equipment.weapon)?.twoHanded
    && !getItem(target.equipment.weapon)?.ranged ? battle.perkBalanceVersion===1 ? (target.reachAdvantageStacks??0)*5 : 5 : 0;
  const anticipationDefense = ranged && hasPerk(target, 'anticipation')
    ? Math.max(perkUpgraded(target,'anticipation')?15:10, Math.floor(injuryStat(target,'rangedDefense') * ((perkUpgraded(target,'anticipation')?.15:.1)+equipmentBoost(target,'anticipationPct',getItem)/100) * hexDistance(actor, target))) : 0;
  const shieldBypass = (option?.shieldBypass || ['flail-headshot', 'whip-crack'].includes(option?.id)) ? shieldDefenseFor(target, target.equipment.shield) : 0;
  const defenseKey=ranged?'rangedDefense':'meleeDefense';
  const baseDefense=injuryStat(shieldBypass?{...target,[defenseKey]:target[defenseKey]-shieldBypass}:target,defenseKey);
  const defense = (Math.round((baseDefense) * (1 + getMoraleEffects(target).modifier)) + dodgeDefense + anticipationDefense
    + (!shieldBypass && target.shieldWallActive && target.shieldDurability > 0 ? shieldDefenseFor(target, target.equipment.shield,target.shieldDurability,ranged) : 0)
    + (!ranged ? reachDefense : 0)
    + (hasPerk(target, 'last-stand') && target.hp * 2 <= target.maxHp ? 8+equipmentBoost(target,'lastStand',getItem) : 0)
    + ((target.side === 'company' && battle.tactic === 'defense' || target.side === 'enemy' && enemyBattleTactic(battle,getItem) === 'defense') ? 5 : 0)) * (1 + getLoneWolfBonus(battle, target));
  const terrainHit = ranged ? rangedTerrainModifier(battle, actor, actor, target) : heightHitModifier(battle.field, actor, target);
  const adjacentAllies = !ranged && !hasPerk(target, 'underdog') && (battle.perkCombatVersion === 1 || hasPerk(actor, 'backstabber'))
    ? battle.units.filter(unit => unit.alive && !unit.escaped && unit.side === actor.side && unit.id !== actor.id && hexDistance(unit, target) === 1).length : 0;
  const surroundingHit = adjacentAllies * ((battle.perkCombatVersion === 1 ? 5 : 0) + (hasPerk(actor, 'backstabber') ? perkUpgraded(actor,'backstabber')?8:5 : 0));
  const distance = hexDistance(actor, target);
  const higher = tileAt(battle.field, actor.q, actor.r).height > tileAt(battle.field, target.q, target.r).height;
  const perkHit = weaponTrainingHit(actor, weapon) + (hasPerk(actor, 'high-ground') && higher ? 8 : 0)
    + (ranged && distance >= 3 && hasPerk(actor, 'marksman') ? 8 : 0) + (ranged?equipmentBoost(actor,'rangedHit',getItem):0);
  const adjacentShotPenalty = ranged && distance === 1 && !hasPerk(actor, 'point-blank') ? 12 : 0;
  const baseChance = clamped(Math.round(skill * (1 + getMoraleEffects(actor).modifier)) + (weapon.hitBonus ?? 0) + (weapon.skillHitBonus ?? 0) - defense + 15 + terrainHit
    + surroundingHit + (hasPerk(actor, 'fast-adaptation') ? actor.adaptation * 10 : 0) + perkHit + hitBonus
    - Math.floor(actor.fatigue / 7) - adjacentShotPenalty - (battle.weaponCompletionVersion===1&&!ranged&&weapon.range>=2&&distance===1&&!(battle.perkBalanceVersion===1?hasWeaponMastery(actor,weapon):hasPerk(actor,'polearm-training'))?15:0), 12, 90);
  return clamped(baseChance - getNightHitPenalty(battle,ranged), 12, 90);
}

function attackSkillFatigue(actor, weapon, option) {
  if (!option?.fatigue) return attackFatigueCost(actor, weapon);
  if (option.id === 'aimed-shot') return aimedFatigueCost(actor);
  const base=Math.max(0,option.fatigue+(weapon?.fatigueOnSkillUse??0));
  return masteredFatigue(actor,weapon,base);
}

export function getDoubleGripBonus(unit, weapon = getItem(unit.equipment?.weapon)) {
  return weapon?.slot==='weapon' && !weapon.ranged && !weapon.twoHanded && !unit.equipment?.shield ? .25 : 0;
}

// Light-armor checks include set fitting, before Brawny or other perk discounts.
export function getAgileDefenseMultiplier(unit) {
  if (!hasPerk(unit, 'agile-defense')) return 1;
  const load=effectiveArmorFatigue(unit,getItem),weight=load.body+load.head;
  return Math.min(1, .4 + Math.pow(Math.max(0, weight - 15-equipmentBoost(unit,'agileThreshold',getItem)), 1.23) / 100);
}

function bankKillMomentum(actor,procs,effects){const amount=equipmentBoost(actor,'killMomentumPct',getItem);if(!amount)return;actor.killMomentumPct=amount;procs.push(`Kill momentum: +${amount}% on the next weapon hit.`);effects.push({id:'kill-momentum',amount});}

function attackDamageRoll(battle, actor, target, weapon, base, head, option = null) {
  const ranged = weapon.ranged === true;
  const distance = hexDistance(actor, target);
  if(battle.weaponAuditVersion===1&&option?.id==='split-shield')return {hp:0,armorDamage:0,before:0};
  if(option?.noDamage)return {hp:0,armorDamage:0,before:0};
  if(option?.dot)return {hp:option.fixedHealth,armorDamage:0,before:0};
  const specialist=heavyWeaponSpecialist(actor,weapon);
  const duelist=!ranged&&weapon.slot==='weapon'&&!weapon.twoHanded
    &&(!actor.equipment.shield||actor.shieldDurability===0||(getItem(actor.equipment.shield)?.legacyShieldId??getItem(actor.equipment.shield)?.baseId??actor.equipment.shield)==='buckler')&&hasPerk(actor,'duelist');
  const bonus = option?.id === 'deathblow' && (target.stunnedTurns > 0 || battle.weaponCompletionVersion===1&&(target.dazedTurns>0||target.affixDazedTurns>0)) ? 1.5
    : option?.id === 'decapitate' && target.hp < target.maxHp ? 1.4
      : option?.id === 'power-throw' ? 1.25 : ['knock-out', 'stunning-stone'].includes(option?.id) ? option?.damageMultiplier ?? .5 : option?.damageMultiplier ?? 1;
  const damageMultiplier = (battle.weaponCompletionVersion===1 ? 1+getDoubleGripBonus(actor,weapon) : 1)
    * injuryMultiplier(actor,'damage')
    * (ranged&&equipmentBoost(actor,'rangedReach',getItem)?.88:1)
    * (weapon.slot==='weapon'&&!option?.freeFollowup&&!option?.dot&&actor.killMomentumPct&&equipmentBoost(actor,'killMomentumPct',getItem)?1+Math.min(actor.killMomentumPct,equipmentBoost(actor,'killMomentumPct',getItem))/100:1)
    * (hasPerk(actor, 'executioner') && (battle.injuryRulesVersion===1 ? target.injuries?.length>0 : target.hp < target.maxHp) ? 1.2+equipmentBoost(actor,'executionerPct',getItem)/100 : 1)
    * (hasPerk(actor, 'killing-frenzy') && actor.frenzyUntilRound >= battle.round ? 1.25 : 1)
    * (hasPerk(actor, 'polearm-training') && battleMasteryMatches(actor,'polearm-training', weapon) ? 1.1 : 1)
    * (hasPerk(actor, 'shield-strike') && !ranged && actor.equipment.shield && actor.shieldDurability > 0 ? 1.1 : 1)
    * (duelist ? (battle.perkBalanceVersion===1?1:1.12)+equipmentBoost(actor,'duelistPct',getItem)/100 : 1)
    * (hasPerk(actor, 'opportunist') && !ranged
      && (option?.areaAction && option.shieldWasUsable !== undefined ? !option.shieldWasUsable
        : !target.equipment.shield || target.shieldDurability === 0) ? 1.1 : 1)
    * (battle.perkBalanceVersion===1&&weapon.throwing&&hasPerk(actor,'throwing-training') ? distance<=2?1.4:distance===3?1.2:1 : 1)
    * (specialist&&option?.area ? 1.05 : 1)
    * (hasPerk(actor, 'volley-fire') && ranged && distance >= 3-equipmentBoost(actor,'volleyDistance',getItem) ? 1.1 : 1) * bonus;
  const mount = getItem(actor.equipment.mount);
  const mountDamage = mount ? battle.mountBalanceVersion === 1 ? mount.damageBonus : mount.visual === 'armoredhorse' ? .2 : .15 : 0;
  const chargeBonus = battle.mountBalanceVersion === 1 && option?.id === 'charge' ? mount?.chargeDamageBonus ?? 0 : 0;
  const raw = Math.round(base * damageMultiplier * (1 + mountDamage) * (1 + chargeBonus)
    * (actor.howlTurns > 0 ? .8 : 1) * (actor.dazedTurns>0?.75:1)
    * (1 + Math.max(0, heightHitModifier(battle.field, actor, target) / 10) * .1));
  const before = head ? target.headArmor : target.attachmentArmor + (target.attachment2Armor??0) + target.bodyArmor;
  let armorDamage = option?.noArmor || option?.id === 'puncture' ? 0 : Math.max(1, Math.round(raw * (weapon.armorDamage ?? 1)
    * (head ? 1.1 : 1) * (option?.armorMultiplier??(option?.id === 'crush-armor' ? 1.5 : 1))
    * (hasPerk(actor, 'axe-training') && battleMasteryMatches(actor,'axe-training', weapon) ? 1.15 : 1)
    * (!head&&(target.attachmentArmor>0||target.attachment2Armor>0)&&perkUpgraded(target,'layered-armor')?.9:1)
    * (hasPerk(target, 'battle-forged') && before > 0 ? .85-equipmentBoost(target,'battleForged',getItem)*.05 : 1)));
  const piercing = Math.min(1, (weapon.armorPiercing ?? .30)
    + (isCrossbow(weapon) && hasPerk(actor, 'crossbow-mastery') ? .2 : 0)
    + (hasPerk(actor, 'dagger-training') && battleMasteryMatches(actor,'dagger-training', weapon) ? .15 : 0)
    + (battle.perkBalanceVersion===1&&duelist ? .25 : 0)
    + (specialist ? .1 : 0)
    + (option?.id === 'piercing-bolt' ? .2 : 0));
  if(battle.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&target.bonePlatingSpent===false&&bonePlatingAbsorbs(target,getItem,head,piercing,option))return {hp:0,armorDamage:0,before,bonePlatingAbsorbed:true};
  let hp = option?.id === 'puncture' ? raw : before > 0
    ? Math.max(1, Math.floor(raw * piercing - before * .025) + Math.max(0, Math.floor((armorDamage - before) * .25))) : raw;
  if (head && !hasPerk(target, 'steel-brow')) hp = Math.round(hp * 1.25);
  if(head&&perkUpgraded(target,'steel-brow'))hp=Math.max(1,Math.round(hp*.9));
  if (hasPerk(actor, 'mace-training') && battleMasteryMatches(actor,'mace-training', weapon)) hp = Math.round(hp * 1.1);
  if (hasPerk(target, 'iron-jaw')) hp = Math.max(1, Math.round(hp * .8));
  // Fur reduces final received missile damage at either hit location.
  if(ranged){const multiplier=1-attachmentEffect(target.equipment,'rangedDamageReduction');hp=Math.max(1,Math.round(hp*multiplier));armorDamage=armorDamage?Math.max(1,Math.round(armorDamage*multiplier)):0;}
  // Trample bypasses armor and earlier modifiers; Agile Defense reduces the complete hit.
  hp += battle.mountBalanceVersion === 1 && option?.id === 'charge' ? mount?.chargeDirectDamage ?? 0 : 0;
  if(option?.minimumHealth)hp=Math.max(hp,option.minimumHealth);
  if(option?.fixedHealth!==undefined)hp=option.fixedHealth;
  if (hasPerk(target, 'agile-defense') && hp > 0) hp = Math.max(1, Math.round(hp * getAgileDefenseMultiplier(target)));
  return { hp, armorDamage, before };
}

function predictAttack(battle, actor, target, weapon, option = null) {
  const ranged = weapon.ranged === true;
  const hitChance = battle.weaponAuditVersion===1&&option?.id==='split-shield'?1:attackHitChance(battle, actor, target, weapon, typeof option === 'number' ? option : option?.hitBonus ?? 0,
    typeof option === 'number' ? null : option) / 100;
  let health = 0, armor = 0, kill = 0, absorbedBodyHealth=0, absorbedBodyArmor=0, bodyChance=0;
  const hits=option?.hits??1,multiBone=hits>1&&bonePlatingReady(target,getItem),predictionTarget=multiBone?{...target,bonePlatingSpent:true}:target;
  const rolls = Math.max(1, weapon.damageMax - weapon.damageMin + 1);
  for (let base = weapon.damageMin; base <= weapon.damageMax; base++) for (const [head, weight] of (option?.id === 'puncture' ? [[false, 1]] : option?.head===true || ['flail-headshot', 'whip-crack'].includes(option?.id) ? [[true, 1]] : [[true, getHeadHitChance(actor, weapon, option)], [false, 1-getHeadHitChance(actor, weapon, option)]])) {
    const { hp, armorDamage, before } = attackDamageRoll(battle, actor, predictionTarget, weapon, base, head, option);
    const probability = weight / rolls;
    if(multiBone&&!head&&attackDamageRoll(battle,actor,target,weapon,base,head,option).bonePlatingAbsorbed){absorbedBodyHealth+=hp/rolls;absorbedBodyArmor+=Math.min(before,armorDamage)/rolls;bodyChance+=probability;}
    health += hp * probability;
    armor += Math.min(before, armorDamage) * probability;
    if (hp >= target.hp) kill += probability;
  }
  // Multi-hit weapons spend at most one charge, not one charge per predicted strike.
  const absorbedChance=multiBone?1-(1-hitChance*bodyChance)**hits:0;
  return { expectedHealthDamage: health * hitChance * hits-absorbedBodyHealth*absorbedChance, expectedArmorDamage: armor * hitChance * hits-absorbedBodyArmor*absorbedChance,
    expectedShieldDamage: target.shieldDurability > 0 ? battle.perkBalanceVersion===1
      ? attackShieldDamage(actor,weapon,option)*hitChance+attackShieldDamage(actor,weapon,option,true)*(1-hitChance)
      : (option?.id==='split-shield'?shieldImpactDamage(weapon)+16:shieldImpactDamage(weapon)||(ranged?1-hitChance:2-hitChance)) : 0,
    killProbability: hits>1?0:kill * hitChance };
}

// Using a ranged attack inside hostile control provokes one free strike per
// adjacent armed melee opponent, capped at two. It happens before firing, including on a miss.
function rangedControlReactions(state, shooter) {
  const battle=state.battle,reactions=[];
  const defenders=battle.units.filter(unit=>unit.alive && !unit.escaped && unit.side!==shooter.side
    && hexDistance(unit,shooter)===1 && !unit.stunnedTurns && !unit.disarmedTurns
    && getItem(unit.equipment.weapon) && !getItem(unit.equipment.weapon).ranged
    && unit.fatigue+5<=tacticalFatigueLimit(battle,unit)).slice(0,2);
  for(const defender of defenders){
    if(!shooter.alive || shooter.stunnedTurns>0 || shooter.disarmedTurns>0)break;
    const weapon=getItem(defender.equipment.weapon);
    const impact=attackTarget(state,defender,shooter,weapon,{reaction:true,name:'Opportunity Strike'});
    const event=battle.lastEvent;
    reactions.push({actorId:defender.id,targetId:shooter.id,type:event.type,
      from:{q:defender.q,r:defender.r},to:{q:shooter.q,r:shooter.r},
      ...impact,weaponId:weapon.id,effects:event.effects??[],skillName:'Opportunity Strike'});
  }
  return reactions;
}

function inflictTemporaryInjury(state,actor,target,weapon,option,healthDamage,head) {
  const battle=state.battle;
  if(battle.injuryRulesVersion!==1)return null;
  let threshold=equipmentBoost(actor,'injuryThreshold',getItem)?(hasPerk(actor,'crippling-strikes')?.5:.83):hasPerk(actor,'crippling-strikes')?.66:1;
  if(option?.id==='gash')threshold*=hasPerk(actor,'sword-training')?.5:.66;
  const eligible=eligibleInjuries(target,attackInjuryPool(weapon,option??{},head),healthDamage,head,threshold);
  if(!eligible.length)return null;
  battle.injuryRng=(Math.imul(battle.injuryRng,1664525)+1013904223)>>>0;
  const id=eligible[Math.floor(battle.injuryRng/4294967296*eligible.length)],definition=INJURY_BY_ID.get(id);
  target.injuries??=[];
  target.injuries.push({id,acquiredDay:state.day,healingDays:0,treated:false,fresh:true,sourceId:actor.id});
  if(definition.initialHpCap)target.hp=Math.min(target.hp,Math.max(1,Math.floor(target.maxHp*definition.initialHpCap)));
  if(definition.effects.ap)target.ap=Math.min(target.ap,getTurnAp(target));
  if(definition.effects.initiative&&!battle.simultaneous){
    const remaining=new Set(battle.turnOrder.slice(battle.turnIndex+1));
    battle.turnOrder.splice(battle.turnIndex+1,remaining.size,...sortTurnOrder(battle).filter(id=>remaining.has(id)));
  }
  return definition;
}

function attackShieldDamage(actor,weapon,option,miss=false) {
  const base=option?.id==='split-shield'?shieldImpactDamage(weapon)+16:shieldImpactDamage(weapon)||(weapon.ranged?miss?1:0:miss?2:1);
  return Math.ceil(base*(option?.id==='split-shield'&&actor.perkBalanceVersion===1&&hasPerk(actor,'axe-training')&&weaponMasteryMatches('axe-training',weapon)?1.5:1)*(1+equipmentBoost(actor,'shieldDamagePct',getItem)/100));
}

function attackTarget(state, actor, target, weapon, option = null) {
  const battle = state.battle;
  if(battle.weaponCompletionVersion===1&&battle.weaponSkillsVersion===1&&!option?.id)option={...equipmentSkills(weapon)[0],...option};
  if (battle.weaponSkillsVersion===1 && weapon.ranged && !option?.reaction && !option?.areaFollowup && !option?.controlReactionChecked) {
    const reactions = rangedControlReactions(state, actor);
    if (!actor.alive || actor.stunnedTurns>0 || actor.disarmedTurns>0) {
      actor.ap=Math.max(0,actor.ap-attackApCost(weapon,battle,actor,option));
      actor.fatigue=Math.min(injuryStat(actor,'maxFatigue'),actor.fatigue+attackSkillFatigue(actor,weapon,option));
      const message=`${actor.name}'s ranged attack is interrupted by an Opportunity Strike.`;
      battle.lastEvent=makeBattleEvent(actor,target,'hold',message,weapon,null,{...(option?.name?{skillName:option.name}:{}),...(reactions.length?{reactions}:{})});
      battleLog(battle,message);
      return {hit:false,hpDamage:0,armorDamage:0,shieldDamage:0,head:false,fallen:false};
    }
    const impact=attackTarget(state,actor,target,weapon,{...option,controlReactionChecked:true});
    if(reactions.length)battle.lastEvent.reactions=[...reactions,...(battle.lastEvent.reactions??[])];
    return impact;
  }
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
    actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + (option?.freeFollowup ? 0 : option?.reaction ? 5 : attackSkillFatigue(actor, weapon, option)));
    if (weapon.reloadTurns&&!option?.dot) actor.reload = weapon.reloadTurns;
    if (!option?.reaction) actor.ap = battle.rulesVersion === 2 ? Math.max(0, actor.ap - attackApCost(weapon, battle, actor, option)) : 0;
  }
  if (actor.side === 'company' || !ranged && hexDistance(actor, target) <= 1) battle.lastContactRound = battle.round;
  if (!ranged && hexDistance(actor, target) <= 1) battle.engaged = true;
  applyOverwhelm(battle, actor, target, weapon, option);
  if (battleRoll(battle) * 100 >= chance) {
    const shieldDamage = option?.noDamage||option?.dot?0:wearShield(battle,target,attackShieldDamage(actor,weapon,option,true));
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
  if(battle.perkBalanceVersion===1&&hasPerk(actor,'reach-advantage')&&weapon.slot==='weapon'&&weapon.twoHanded&&!weapon.ranged&&!option?.dot&&!option?.freeFollowup&&!option?.noDamage&&option?.id!=='split-shield'&&!(option?.oppositeHit&&option?.areaFollowup))actor.reachAdvantageStacks=Math.min(5,(actor.reachAdvantageStacks??0)+1);
  const shieldDamage = option?.noDamage||option?.dot?0:wearShield(battle,target,attackShieldDamage(actor,weapon,option));
  if(battle.weaponAuditVersion===1&&option?.id==='split-shield'){
    const message=`${actor.name} strikes ${target.name}'s shield for ${shieldDamage} durability.`;
    battle.lastEvent=makeBattleEvent(actor,target,'attack',message,weapon,null,{head:false,hpDamage:0,armorDamage:0,shieldDamage,fallen:false,skillName:option.name});battleLog(battle,message);
    return {hit:true,hpDamage:0,armorDamage:0,shieldDamage,head:false,fallen:false};
  }
  const baseDamage = weapon.damageMin + Math.floor(battleRoll(battle) * (weapon.damageMax - weapon.damageMin + 1));
  const headChance = getHeadHitChance(actor, weapon, option);
  const head = headChance === 0 ? false : headChance === 1 ? true : battleRoll(battle) < headChance;
  if (head && hasPerk(actor, 'head-hunter') && weapon.id && !option?.dot && !option?.freeFollowup && !option?.noDamage) actor.headHunterReady = !actor.headHunterReady;
  const { hp: hpDamage, armorDamage, before: armorBefore, bonePlatingAbsorbed=false } = attackDamageRoll(battle, actor, target, weapon, baseDamage, head, option);
  if(bonePlatingAbsorbed)target.bonePlatingSpent=true;
  const weaponHit=weapon.slot==='weapon'&&!option?.freeFollowup&&!option?.dot&&!option?.noDamage;
  const consumedMomentum=weaponHit&&actor.killMomentumPct&&Math.min(actor.killMomentumPct,equipmentBoost(actor,'killMomentumPct',getItem));
  if(consumedMomentum)delete actor.killMomentumPct;
  const headDaze=weaponHit&&head&&equipmentBoost(actor,'dazeHead',getItem)&&target.hp>hpDamage&&target.undeadTraitsVersion!==1;
  if(headDaze){target.affixDazedTurns=2;markSimultaneousEffect(battle,target,'affixDazedTurns',2);}
  if (head) target.headArmor = Math.max(0, target.headArmor - armorDamage);
  else {
    const outerDamage=Math.min(target.attachment2Armor??0,armorDamage);
    if(target.attachment2Armor!==undefined)target.attachment2Armor-=outerDamage;
    const attachmentDamage = Math.min(target.attachmentArmor, armorDamage-outerDamage);
    target.attachmentArmor -= attachmentDamage;
    target.bodyArmor = Math.max(0, target.bodyArmor - (armorDamage - attachmentDamage - outerDamage));
  }
  const hpBefore = target.hp;
  target.hp = Math.max(0, target.hp - hpDamage);
  recordBattlePerformance(actor,target,hpBefore-target.hp,Math.min(armorBefore,armorDamage),hpBefore>0 && target.hp===0);
  if ((['knock-out', 'stunning-stone'].includes(option?.id) || option?.stunChance && battleRoll(battle)<option.stunChance) && target.hp > 0 && !target.stunProtected) {
    target.stunnedTurns = 1;
    markSimultaneousEffect(battle,target,'stunnedTurns',1);
    target.stunProtected = true;
    if(battle.weaponCompletionVersion===1)clearWeaponStances(target);
  }
  if(battle.weaponCompletionVersion===1&&target.hp>0){
    if(option?.daze&&!(battle.injuryRulesVersion===1&&option.id==='gash')&&(!option.woundThreshold||hpDamage>=Math.ceil(target.maxHp*option.woundThreshold))&&target.undeadTraitsVersion!==1){target.dazedTurns=option.daze;markSimultaneousEffect(battle,target,'dazedTurns',option.daze);}
    if(option?.stagger){target.staggeredTurns=option.stagger;markSimultaneousEffect(battle,target,'staggeredTurns',option.stagger);}
    if(option?.disarm){target.disarmedTurns=option.disarm;markSimultaneousEffect(battle,target,'disarmedTurns',option.disarm);target.spearwallActive=false;target.riposteActive=false;}
    if(!battle.simultaneous&&(option?.daze||option?.stagger||headDaze)){const remaining=new Set(battle.turnOrder.slice(battle.turnIndex+1));battle.turnOrder.splice(battle.turnIndex+1,remaining.size,...sortTurnOrder(battle).filter(id=>remaining.has(id)));}
    if(option?.bleed&&hpDamage>=3&&target.undeadTraitsVersion!==1){
      const bleed=option.bleed*(battle.perkBalanceVersion===1&&hasPerk(actor,'sword-training')&&weaponMasteryMatches('sword-training',weapon)?2:1);
      if(battle.simultaneous)target.bleedTickRound=battle.round;
      target.bleeding={damage:Math.min(18,(target.bleeding?.damage??0)+bleed),turns:2,sourceId:actor.id};
    }
  }
  if(!option?.noDamage&&!bonePlatingAbsorbed)changeBattleMorale(battle, target, -moraleDamage(target, 3 + Math.min(8, Math.floor(hpDamage / 8)) + (hasPerk(actor, 'fearsome') && hpDamage > 0 ? 10 : 0) + (!ranged ? Math.max(getItem(actor.equipment?.armor)?.meleeMoraleDamage ?? 0, attachmentEffect(actor.equipment,'meleeMoraleDamage')) : 0), battle));
  const wound = inflictTemporaryInjury(state,actor,target,weapon,option,hpDamage,head);
  const fallen = target.hp === 0;
  const perkProcs = [], effects = [];
  if(headDaze){perkProcs.push('Head-hit daze: −50% initiative, −20% attack.');effects.push({id:'affix-daze',amount:2});}
  if(consumedMomentum)effects.push({id:'kill-momentum-hit',amount:consumedMomentum});
  if (fallen) {
    target.alive = false;
    target.ap = 0;
    if (battle.weaponSkillsVersion === 1) clearWeaponStances(target);
    for (const ally of battle.units.filter(unit => unit.side === target.side && unit.alive)) changeBattleMorale(battle, ally, -moraleDamage(ally, 12, battle));
    for (const ally of battle.units.filter(unit => unit.side === actor.side && unit.alive)) changeBattleMorale(battle, ally, ally === actor ? 4 : 2);
    if (actor.side === 'company' && !actor.ally) battle.xp[actor.id] = (battle.xp[actor.id] ?? 0) + 20;
    if(weaponHit&&!option?.deferKillPerks)bankKillMomentum(actor,perkProcs,effects);
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
      if (battle.weaponSkillsVersion === 1 && option?.reaction && !option?.freeFollowup) actor.pendingBerserkAp = berserkAp(actor);
      else actor.ap = battle.rulesVersion === 2 ? actor.ap + berserkAp(actor) : 2;
      actor.berserkRound = battle.round;
      effects.push({ id: 'berserk', amount: battle.rulesVersion === 2 ? berserkAp(actor) : 2, ...(battle.weaponSkillsVersion === 1 && option?.reaction && !option?.freeFollowup ? { nextTurn: true } : {}) });
      perkProcs.push(battle.weaponSkillsVersion === 1 && option?.reaction && !option?.freeFollowup ? `Berserk: +${berserkAp(actor)} AP next turn.`
        : `Berserk: +${battle.rulesVersion === 2 ? berserkAp(actor) : 2} AP.`);
    }
  }
  const message = option?.dot?`${target.name} loses ${hpDamage} health to bleeding${fallen?'; they fall':''}.`: `${actor.name}${option?.freeFollowup ? "'s mount uses Wolf Bite against" : ' hits'} ${target.name}${head ? ' in the head' : ''} for ${hpDamage} health and ${Math.min(armorBefore, armorDamage)} armor${fallen ? '; they fall' : ''}.${shieldDamage ? ` Shield: -${shieldDamage}.` : ''}${perkProcs.length ? ` ${perkProcs.join(' ')}` : ''}${wound?` ${target.name} suffers ${wound.name}.`:''}${bonePlatingAbsorbed?` ${target.name}'s Bone Platings absorb the hit.`:''}`;
  battle.lastEvent = makeBattleEvent(actor, target, 'attack', message, weapon, null, { head, hpDamage, armorDamage: Math.min(armorBefore, armorDamage), shieldDamage, fallen, ...(bonePlatingAbsorbed?{bonePlatingAbsorbed:true}:{}), ...(effects.length ? { effects } : {}),
    ...(option?.name ? { skillName: option.name } : {}) });
  battleLog(battle, message);
  return { hit: true, hpDamage, armorDamage: Math.min(armorBefore, armorDamage), shieldDamage, head, fallen, ...(bonePlatingAbsorbed?{bonePlatingAbsorbed:true}:{}) };
}

const SWING_DIRECTIONS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

function horseChargePlan(battle, actor, target, weapon) {
  const mount = getItem(actor.equipment.mount);
  if (battle.mountSkillsVersion !== 1 || !/horse/.test(mount?.visual ?? '') || weapon.ranged
    || ['ranged','reach-support'].includes(actor.tacticalRole) || actor.ap < 6
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
  if (actor.tacticalRole==='flanker') {
    const others=battle.units.filter(unit=>unit.alive && !unit.escaped && unit.side!==actor.side && unit.id!==target.id);
    if (others.some(unit=>hexDistance(unit,target)<=2)
      || path.some(point=>others.some(unit=>hexDistance(point,unit)<=1))
      || path.some(point=>battle.units.some(unit=>unit.alive && !unit.escaped && unit.side!==actor.side
        && unit.spearwallActive && hexDistance(point,unit)<=1))) return null;
  }
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
    markSimultaneousEffect(battle,target,'stunnedTurns',1);
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
  for (const target of targets) { target.howlTurns = 2; markSimultaneousEffect(battle,target,'howlTurns',2); }
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
  const swapCost = battleSwapCost(actor,battle);
  const alternate = [getItem(actor.reserveEquipment.weapon), ...actor.accessories.map(getItem)]
    .some(item => item?.slot === 'weapon' && actor.ap >= swapCost + (attackApCost(item, battle, actor)));
  if (alternate) return 1;
  // Treat any extra attack budget as a possible safe sequence, even if movement might block it.
  if (actor.ap >= attackCost * 2) return 1;
  if (actor.fatigue + attackFatigueCost(actor, weapon,battle) > injuryStat(actor,'maxFatigue')) return 0;
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
        && from.fatigue + attackFatigueCost(from, weapon,battle) <= injuryStat(from,'maxFatigue'))
        probability = Math.max(probability, predictAttack(battle, from, target, weapon).killProbability);
      for (const point of hexNeighbors(battle.field, from)) {
        if (occupied.has(`${point.q},${point.r}`)) continue;
        const step = battleMoveApCost(battle, from, from, point);
        if (!Number.isFinite(step) || from.spentAp + step + attackCost > actor.ap) continue;
        const fatigue = from.fatigue + movementFatigue(from, battleMovementCost(battle, from, from, point));
        if (fatigue + attackFatigueCost(from, weapon,battle) > injuryStat(from,'maxFatigue')) continue;
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
    if (!impact.hit && !(battle.perkBalanceVersion===1&&hasPerk(defender,'spear-training'))) defender.spearwallActive = false;
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
  if(skill.id==='deathblow')return target.stunnedTurns>0||target.dazedTurns>0||target.affixDazedTurns>0;
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
 if(events.some(event=>event.bonePlatingAbsorbed)){delete state.battle.lastEvent.bonePlatingAbsorbed;state.battle.lastEvent.message+=` ${target.name}'s Bone Platings absorb one strike.`;}
 return total;
}
function tickBleeding(state,unit){
 const bleed=unit.bleeding,injuryDamage=freshInjuryBleeding(unit);if(!bleed&&!injuryDamage)return false;
 const sourceId=bleed?.sourceId??unit.injuries?.find(wound=>wound.fresh&&INJURY_BY_ID.get(wound.id)?.freshBleed)?.sourceId;
 const source=state.battle.units.find(x=>x.id===sourceId)??unit;
 if(bleed){bleed.turns--;if(!bleed.turns)delete unit.bleeding;}
 // Reuse death/morale/XP handling, without contact, attack resources or mount followups.
 attackTarget(state,source,unit,{id:null,slot:'weapon',damageMin:0,damageMax:0,armorDamage:0,armorPiercing:0},
  {id:'bleeding',name:'Bleeding',dot:true,fixedHealth:(bleed?.damage??0)+injuryDamage,head:false,chanceOverride:100,reaction:true,areaFollowup:true});
 return true;
}
function combatInitiative(unit){return injuryStat(unit,'initiative')*(unit.staggeredTurns>0?.5:1)*(unit.affixDazedTurns>0?.5:unit.dazedTurns>0?.75:1);}
function availableFatigue(unit){return injuryStat(unit,'maxFatigue')*(unit.dazedTurns>0?.75:1);}

function roleRules(battle){return battle?.roleConsistencyVersion===1&&battle.weaponSkillsVersion===1;}
function combatCommand(battle,actor){return actor.side==='enemy'?enemyBattleTactic(battle,getItem):actor.ally?'offense':battle.tactic;}
function tacticalFatigueLimit(battle,actor){return roleRules(battle)?availableFatigue(actor):injuryStat(actor,'maxFatigue');}
function canAfford(battle,actor,apCost,fatigueCost){return isAffordableAction({...actor,maxFatigue:tacticalFatigueLimit(battle,actor)},{apCost,fatigueCost});}
function canUseRangedTarget(battle,actor,weapon,target,origin=actor){
 return battle.weaponSkillsVersion!==1||!weapon.ranged||hexDistance(origin,target)>1||hasPerk(actor,'point-blank');
}
function canFireAfterMove(state,actor,weapon,point,moveAp=0,moveFatigue=0){
 const battle=state.battle;
 if(!weapon?.ranged||actor.disarmedTurns||actor.stunnedTurns||actor.reload>0||!battleWeaponHasAmmo(state,actor,weapon))return false;
 const basic=battle.weaponCompletionVersion===1?equipmentSkills(weapon)[0]:null;
 const options=[basic,...(isBow(weapon)?[COMBAT_SKILLS['aimed-shot']]:[])];
 return battle.units.some(target=>target.alive&&target.side!==actor.side&&options.some(option=>
   canUseRangedTarget(battle,actor,weapon,target,point)
   &&hexDistance(point,target)<=effectiveWeaponRange(actor,weapon)+(option?.rangeBonus??0)
   &&canAfford(battle,actor,moveAp+attackApCost(weapon,battle,actor,option),moveFatigue+attackSkillFatigue(actor,weapon,option))));
}

// Reserve an actual attack budget before exposing a cautious melee unit.
// Only newly entered hostile reach matters: this must not make an already
// engaged fighter disengage, or stop useful movement through safe ground.
function meleeApproachSafe(battle, actor, weapon, point, moveAp, moveFatigue) {
  if (!roleRules(battle) || weapon?.ranged) return true;
  const enemies=battle.units.filter(u=>u.alive && !u.escaped && u.side!==actor.side);
  const threats=enemies.filter(enemy=>{
    const enemyWeapon=getItem(enemy.equipment.weapon);
    if (enemyWeapon?.ranged || enemy.stunnedTurns>0) return false;
    const reach=effectiveWeaponRange(enemy,enemyWeapon);
    return hexDistance(actor,enemy)>reach && hexDistance(point,enemy)<=reach;
  });
  if (!threats.length) return true;
  if (!weapon || actor.disarmedTurns || actor.stunnedTurns || actor.reload>0) return false;
  const frontline=actor.tacticalRole==='breaker'
    || actor.tacticalRole==='frontliner' && effectiveWeaponRange(actor,weapon)===1
    || actor.equipment.shield && actor.shieldDurability>0;
  if (frontline && threats.length===1 && actor.hp>actor.maxHp*.5) return true;
  const mover={...actor,...point};
  const basic=battle.weaponCompletionVersion===1?equipmentSkills(weapon)[0]:null;
  return enemies.some(target=>{
    const options=[basic,...(battle.weaponCompletionVersion===1?completedSkillOptions(mover,target,weapon,battle):[])];
    return options.some(option=>{
      const range=effectiveWeaponRange(actor,weapon)+(option?.rangeBonus??0);
      // An enemy polearm can threaten an intermediate hex before our shorter
      // weapon reaches it. Budget the whole remaining approach, not just this step.
      const path=hexDistance(point,target)<=range?[]:pathToTarget(battle,mover,target,range,false,actor.tacticalRole==='flanker');
      if (!path) return false;
      let ap=moveAp,fatigue=moveFatigue,previous=mover;
      let credit=Math.max(0,(actor.movementCredit??0)-battleMovementCost(battle,actor,actor,point)*2);
      for (const next of path) {
        const stepper={...actor,movementCredit:credit};
        ap+=battleMoveApCost(battle,stepper,previous,next);
        const cost=battleMovementCost(battle,actor,previous,next);
        fatigue+=movementFatigue(actor,cost);credit=Math.max(0,credit-cost*2);previous=next;
      }
      return canAfford(battle,actor,ap+attackApCost(weapon,battle,actor,option),fatigue+attackSkillFatigue(actor,weapon,option));
    });
  });
}

function battleMoveApCost(battle, actor, from, to) {
  const cost = battleMovementCost(battle, actor, from, to);
  if (!Number.isFinite(cost)) return Infinity;
  if (battle.mountBalanceVersion === 1 && getItem(actor.equipment.mount)) return 1+injuryAdjustment(actor,'movement');
  return Math.max(0, cost * 2 - (actor.movementCredit ?? 0))+injuryAdjustment(actor,'movement');
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
    actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + movementFatigue(actor, battleMovementCost(battle, actor, from, point)));
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

export function rotateBattleUnits(state, actorId, allyId) {
  const battle = state.battle, actor = battle?.units.find(unit => unit.id === actorId), ally = battle?.units.find(unit => unit.id === allyId);
  if (!battle || battle.status !== 'active' || battle.perkCombatVersion !== 1 || battle.activeId !== actorId
    || !hasPerk(actor, 'rotation') || !actor.alive || !ally?.alive || actor.escaped || ally.escaped || actor.id === ally.id
    || actor.side !== ally.side || hexDistance(actor, ally) !== 1 || actor.stunnedTurns || ally.stunnedTurns
    || actor.immobilized || ally.immobilized || actor.ap < 3 || actor.fatigue + 25 > availableFatigue(actor)
    || !passableHex(actor, battle.field) || !passableHex(ally, battle.field)
    || Math.abs(tileAt(battle.field, actor.q, actor.r).height - tileAt(battle.field, ally.q, ally.r).height) > 1)
    return result(false, 'Rotation needs an adjacent, mobile ally, 3 AP and 25 available fatigue.');
  const from = { q: actor.q, r: actor.r }, allyFrom = { q: ally.q, r: ally.r };
  Object.assign(actor, allyFrom); Object.assign(ally, from);
  actor.ap -= 3; actor.fatigue += 25;
  actor.rotationRound = ally.rotationRound = battle.round;
  clearWeaponStances(actor); clearWeaponStances(ally);
  delete actor.skirmishReturn; delete ally.skirmishReturn;
  actor.aiTargetId = ally.aiTargetId = null;
  const message = `${actor.name} uses Rotation to relieve ${ally.name}.`;
  battle.lastEvent = makeBattleEvent(actor, ally, 'move', message, null, from,
    { skillName: 'Rotation', to: { q: actor.q, r: actor.r }, pushedFrom: allyFrom });
  battleLog(battle, message);
  if (actor.ap <= 0) nextBattleTurn(battle);
  return result(true, message);
}

function rescueWithRotation(state, actor) {
  const battle = state.battle;
  if (!hasPerk(actor, 'rotation') || battle.perkCombatVersion !== 1 || actor.rotationRound === battle.round
    || actor.ap < 3 || actor.fatigue + 25 > tacticalFatigueLimit(battle, actor)
    || !isMoraleImmune(actor) && actor.morale < 25) return null;
  const enemies = battle.units.filter(unit => unit.alive && !unit.escaped && unit.side !== actor.side);
  const pressure = point => enemies.filter(enemy => hexDistance(point, enemy) === 1).length;
  const healthyMelee = unit => unit.hp / unit.maxHp >= .65 && getItem(unit.equipment.weapon)
    && !getItem(unit.equipment.weapon).ranged && !['ranged', 'skirmisher', 'flanker'].includes(unit.tacticalRole);
  const vulnerable = unit => unit.hp / unit.maxHp < .45 || getItem(unit.equipment.weapon)?.ranged;
  const ownPressure = pressure(actor);
  const allies = battle.units.filter(ally => ally.alive && !ally.escaped && ally.side === actor.side && ally.id !== actor.id
    && hexDistance(actor, ally) === 1 && ally.rotationRound !== battle.round && !ally.stunnedTurns
    && (pressure(ally) > ownPressure && healthyMelee(actor) && vulnerable(ally)
      || pressure(ally) < ownPressure && healthyMelee(ally) && vulnerable(actor)))
    .sort((a, b) => Math.abs(pressure(b) - ownPressure) - Math.abs(pressure(a) - ownPressure)
      || a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id));
  for (const ally of allies) { const outcome = rotateBattleUnits(state, actor.id, ally.id); if (outcome.ok) return outcome; }
  return null;
}

function preserveWoundedBrother(state, actor, enemies) {
  const battle = state.battle;
  if (!shouldPreserveBrother(battle, actor)) return null;
  const weapon = getItem(actor.equipment.weapon);
  const nearest = point => Math.min(...enemies.map(enemy => hexDistance(point, enemy)));
  const distance = nearest(actor);
  // Rotation runs first. Never leave melee contact and invite free attacks.
  if (distance <= 1) {
    if (actor.equipment.shield && actor.shieldDurability > 0 && !weapon?.twoHanded && !actor.shieldWallActive
      && actor.ap >= 4 && actor.fatigue + shieldSkillFatigue(actor) <= availableFatigue(actor)) {
      actor.ap -= 4; actor.fatigue += shieldSkillFatigue(actor); actor.shieldWallActive = true;
      const message = `${actor.name} shields up to survive while allies finish the fight.`;
      battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, weapon, null, { skillName: COMBAT_SKILLS.shieldwall.name });
      battleLog(battle, message);
      if (actor.ap <= 0) nextBattleTurn(battle);
      return result(true, message);
    }
    return null; // Trapped fighters can still attack and control nearby threats.
  }
  if (weapon?.ranged && battleWeaponHasAmmo(state, actor, weapon)
    && enemies.some(enemy => hexDistance(actor, enemy) <= effectiveWeaponRange(actor, weapon))) return null;
  const occupied = new Set(battle.units.filter(unit => unit.alive && !unit.escaped).map(unit => `${unit.q},${unit.r}`));
  const point = distance <= 3 ? openNeighbors(battle, actor, occupied)
    .filter(next => nearest(next) > distance && canAfford(battle, actor,
      battleMoveApCost(battle, actor, actor, next), movementFatigue(actor, battleMovementCost(battle, actor, actor, next))))
    .sort((a, b) => nearest(b) - nearest(a) || a.q - b.q || a.r - b.r)[0] : null;
  if (point) return moveToRangedPosition(state, actor,
    { point, message: `${actor.name} falls back wounded, leaving the advance to healthier allies.` }, 'preserve');
  actor.ap = 0; actor.fatigue = Math.max(0, actor.fatigue - 12);
  const message = `${actor.name} holds back wounded while healthier allies fight.`;
  battle.lastEvent = makeBattleEvent(actor, null, 'hold', message, weapon);
  battleLog(battle, message); nextBattleTurn(battle);
  return result(true, message);
}

function advanceBattleV2(state) {
  const battle = state.battle;
  const actor = battle.units.find(unit => unit.id === battle.activeId);
  if (!actor?.alive) { nextBattleTurn(battle); return result(true, 'The next fighter takes their turn.'); }
  regenerateLivingShield(battle,actor);
  if(battle.weaponCompletionVersion===1&&actor.bleedTickRound!==battle.round&&(actor.bleeding||freshInjuryBleeding(actor))){actor.bleedTickRound=battle.round;tickBleeding(state,actor);if(!finishBattlePhase(battle)&&!actor.alive)nextBattleTurn(battle);return result(true,battle.lastEvent.message);}
  if (battle.weaponSkillsVersion === 1 && actor.stunnedTurns > 0) {
    actor.stunnedTurns = 0;
    actor.ap = 0;
    if(battle.perkBalanceVersion===1)delete actor.reachAdvantageStacks;
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
    actor.fatigue = Math.max(0, actor.fatigue - Math.max(0,15+injuryAdjustment(actor,'fatigueRecovery')));
    if(battle.perkBalanceVersion===1)delete actor.reachAdvantageStacks;
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
  const rotation = rescueWithRotation(state, actor); if (rotation) return rotation;
  if (useBattleAccessory(state, actor, enemies)) return result(true, battle.lastEvent.message);
  const preservation = preserveWoundedBrother(state, actor, enemies); if (preservation) return preservation;
  const preserving = shouldPreserveBrother(battle, actor);
  const mountedPursuit=mountedFlankerPursuit(state,actor,enemies);if(mountedPursuit)return mountedPursuit;
  const fallingBack=preserving ? null : returnSkirmisher(state,actor);if (fallingBack) return fallingBack;
  if (readyShieldWallSet(state, actor) || chooseBattleWeapon(state, actor, enemies)) return result(true, battle.lastEvent.message);
  const equipped = getItem(actor.equipment.weapon);
  const reserve = getItem(actor.reserveEquipment.weapon);
  const swapCost = battleSwapCost(actor,battle);
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
  const wingDuty=roleRules(battle) && role==='flanker';
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
  if (rangedAI && spacingWeapon && (!wingDuty || nearest<=1) && (companyTactic!=='skirmish' || nearest<=1)) {
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
      .sort((a, b) => a.hp + (a.bodyArmor + a.attachmentArmor + (a.attachment2Armor??0) + a.headArmor) * .15 + injuryStat(a,'meleeDefense') * .3
        - b.hp - (b.bodyArmor + b.attachmentArmor + (b.attachment2Armor??0) + b.headArmor) * .15 - injuryStat(b,'meleeDefense') * .3
        || hexDistance(actor, a) - hexDistance(actor, b) || a.id.localeCompare(b.id))[0]?.id ?? null;
  }
  if (!wingDuty && companyTactic === 'defense' && (!rangedAI || !ammunitionSpent) && !nearbyTarget && (battle.round - battle.lastContactRound < 4)
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
  if (!preserving && !wingDuty && companyTactic === 'advance-formation' && !sideInMeleeContact(battle) && actor.formationMovedRound !== battle.round) {
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
  if (!preserving && !wingDuty && actor.side==='company' && !actor.ally && (!rangedAI || !spacingWeapon && !ammunitionSpent) && companyTactic === 'shield-wall' && actor.formationMovedRound !== battle.round && (weapon.ranged || !nearbyTarget)) {
    const reform = shieldWallReformStep(state, actor);
    if (reform) {
      const cost = battleMoveApCost(battle, actor, actor, reform);
      if (actor.ap >= cost&&(!roleRules(battle)||canAfford(battle,actor,cost,movementFatigue(actor,battleMovementCost(battle,actor,actor,reform))))
        && meleeApproachSafe(battle,actor,weapon,reform,cost,movementFatigue(actor,battleMovementCost(battle,actor,actor,reform)))) {
        const from = { q: actor.q, r: actor.r };
        actor.q = reform.q; actor.r = reform.r;
        actor.ap -= cost;
        actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + movementFatigue(actor, battleMovementCost(battle, actor, from, actor)));
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
      actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + movementFatigue(actor, battleMovementCost(battle, actor, retreatFrom, actor)));
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
    const charge = !(role==='breaker' && battle.round<5 && distance>nearest)
      && !actor.disarmedTurns && ['offense', 'focus'].includes(companyTactic) && horseChargePlan(battle, actor, target, weapon);
    if (charge) {
      const predicted = predictAttack(battle, { ...actor, ...charge.path.at(-1) }, target, weapon, COMBAT_SKILLS.charge);
      candidates.push({ id: 'charge', type: 'charge', targetId: target.id, target, plan: charge, apCost: 6,
        fatigueCost: charge.fatigueCost, ...predicted, preventedDamage: injuryStat(target,'meleeSkill') * .25,
        incomingDamage: role==='breaker'?enemies.filter(e=>e.id!==target.id && hexDistance(charge.path.at(-1),e)<=1).length*12:0,
        bonus: 24+(role==='breaker'?breakerOpeningBonus(battle,actor,target,charge):0) });
    }
    const lunge=!actor.disarmedTurns&&lungePlan(battle,actor,target,weapon);
    if(lunge)candidates.push({id:'lunge',type:'lunge',targetId:target.id,target,plan:lunge,apCost:attackApCost(weapon,battle,actor,lunge.option),fatigueCost:attackSkillFatigue(actor,weapon,lunge.option),...predictAttack(battle,{...actor,...lunge.point},target,weapon,lunge.option),bonus:22});
    if (distance <= range && canAttack && canUseRangedTarget(battle,actor,weapon,target)) {
      candidates.push({ id: 'attack', type: 'attack', targetId: target.id, target, apCost: attackCost,
        option:basicOption,fatigueCost: basicFatigue, ...normal,
        wastedAmmo: weapon.ranged && target.hp < normal.expectedHealthDamage * .4 ? 1 : 0,
        bonus: 18 + (isBow(weapon) && actor.ap >= attackCost * 2 && (!weapon.reloadTurns) && (!actor.ally && actor.side === 'company' ? state.supplies.ammo >= 2 : true) ? normal.expectedHealthDamage * .75 : 0) });
    }
    if (skillFamily && !actor.disarmedTurns && distance <= range && actor.reload === 0 && canUseRangedTarget(battle,actor,weapon,target)) for(const option of (battle.weaponCompletionVersion===1?completedSkillOptions(actor,target,weapon,battle):[skillOptionForTarget(skillFamily, actor, target, weapon, battle)])) {
      if (role==='reach-support' && option?.id==='hook' && nearest>1) {
        const pulled=hookDestination(battle,actor,target);
        if (pulled && hexDistance(actor,pulled)===1) continue;
      }
      const fatigueCost = option && attackSkillFatigue(actor, weapon, option);
      if (option && actor.ap >= attackApCost(weapon, battle, actor, option) && actor.fatigue + fatigueCost <= availableFatigue(actor)) {
        const predicted = predictAttack(battle, actor, target, weapon, option);
        candidates.push({ id: option.id, type: 'attack', targetId: target.id, target, option,
          apCost: attackApCost(weapon, battle, actor, option), fatigueCost, ...predicted,
          preventedDamage: option.disarm||option.daze||option.stagger||option.stunChance||['knock-out','stunning-stone'].includes(option.id)?injuryStat(target,'meleeSkill')*.25:0,
          bonus: 18 + (['knock-out', 'stunning-stone'].includes(option.id) ? (actor.skillPreference === 'control' ? 22 : 3)
            : option.id === 'demolish-armor' ? 12 : option.id === 'hook' ? 10 : option.id === 'split-shield' ? 8 : option.id === 'puncture' ? 8 : 0) });
      }
    }
    if(!actor.disarmedTurns && (battle.weaponCompletionVersion===1?equipmentSkills(weapon).some(x=>x.area):skillFamily==='two-handed-sword')) {
      for (const option of (battle.weaponCompletionVersion===1?equipmentSkills(weapon).filter(x=>x.area):['split','swing'].map(id=>COMBAT_SKILLS[id]))) {
        const fatigueCost = attackSkillFatigue(actor, weapon, option);
        if (actor.ap < attackApCost(weapon, battle, actor, option) || actor.fatigue + fatigueCost > injuryStat(actor,'maxFatigue')) continue;
        const candidate = areaAttackCandidate(state, actor, target, weapon, option);
        if (candidate) candidates.push(candidate);
      }
    }
    if (!actor.disarmedTurns && aimed && canUseRangedTarget(battle,actor,weapon,target) && distance <= range + 1 && actor.reload === 0 && actor.fatigue + aimedFatigueCost(actor) <= availableFatigue(actor)) {
      candidates.push({ id: 'aimed-shot', type: 'attack', targetId: target.id, target, apCost: attackApCost(weapon, battle, actor, COMBAT_SKILLS['aimed-shot']),
        fatigueCost: aimedFatigueCost(actor), ...aimed, bonus: 15 });
    }
    if (distance === 1 && actor.equipment.shield && actor.shieldDurability > 0 && actor.fatigue + shieldSkillFatigue(actor) <= availableFatigue(actor)) {
      const push = knockBackDestination(battle, actor, target);
      if (push) candidates.push({ id: 'knock-back', type: 'knock-back', targetId: target.id, target, push, apCost: 4, fatigueCost: shieldSkillFatigue(actor),
        preventedDamage: injuryStat(target,'meleeSkill') * .18, incomingDamage: 2, bonus: actor.skillPreference === 'control' ? 8 : -6 });
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
    if (actor.ap < attackApCost(weapon, battle, actor, option) || actor.fatigue + attackSkillFatigue(actor, weapon, option) > injuryStat(actor,'maxFatigue')) continue;
    const candidate = areaAttackCandidate(state, actor, ally, weapon, option);
    if (candidate) candidates.push(candidate);
  }
  const targetPaths = enemies.map(target => {
    const priority = rangedAI ? tacticalTargetPriority(role,target,getItem(target.equipment.weapon),hexDistance(actor,target),nearest,battle.round) : 0;
    const flanking = wingDuty && nearest>1;
    return {target,priority,path:role==='reach-support'?reachSupportPath(battle,actor,target,weapon)
      :pathToTarget(battle,actor,target,range,weapon.ranged===true,flanking,wingDuty&&nearest>1?flankerGoal(battle,actor,target,weapon.ranged===true):null)};
  }).filter(entry=>roleRules(battle)?entry.path!==null:entry.path?.length).sort((a,b)=>(['flanker','skirmisher'].includes(role) ? b.priority-a.priority : 0)
    || pathCost(battle,actor,actor,a.path)-pathCost(battle,actor,actor,b.path)
    || b.priority-a.priority || a.target.id.localeCompare(b.target.id));
  const arrived=roleRules(battle)&&targetPaths.find(entry=>entry.target.id===actor.aiTargetId&&entry.path.length===0);
  const breakerHunt=role==='breaker' && !weapon.ranged && battle.round>=5 && ['offense','focus'].includes(companyTactic);
  const cheapest=targetPaths[0];
  // Hunt through openings, rather than taking a long Flanker detour.
  const breakthrough=breakerHunt && (nearest===1 || !nearbyTarget) && targetPaths.filter(entry=>entry.path.length
    && (getItem(entry.target.equipment.weapon)?.ranged || (getItem(entry.target.equipment.weapon)?.range??1)>1)
    && pathCost(battle,actor,actor,entry.path)<=pathCost(battle,actor,actor,cheapest.path)+2
    && (nearest>1 || enemies.filter(enemy=>hexDistance(actor,enemy)===1)
      .every(enemy=>hexDistance(entry.path[0],enemy)===1)))
    .sort((a,b)=>b.priority-a.priority || pathCost(battle,actor,actor,a.path)-pathCost(battle,actor,actor,b.path))[0];
  const preferred=arrived&&arrived.priority>=(targetPaths[0]?.priority??0)?arrived:targetPaths[0];
  const specialFlank = nearest>1 && preferred && roleRules(battle)&&role==='flanker' ? preferred : null;
  const pursuit = (companyTactic === 'focus' && targetPaths.find(entry=>entry.target.id===battle.focusTargetId))
    || breakthrough || specialFlank || (['skirmisher','breaker','reach-support'].includes(role) ? targetPaths[0] : targetPaths.find(entry=>entry.target.id===actor.aiTargetId)) || targetPaths[0];
  const breakingThrough=breakthrough && pursuit===breakthrough;
  const formationLocked = companyTactic === 'advance-formation' && (actor.formationMovedRound === battle.round
    || !wingDuty && (sideInMeleeContact(battle) || battle.formationAdvance?.completedRound >= battle.round));
  const wallLocked = wingDuty && ['shield-wall','skirmish'].includes(companyTactic) && actor.formationMovedRound===battle.round
    || !wingDuty && (companyTactic==='skirmish' && !ammunitionSpent && skirmishFireSupport(state,actor.side)
    || (!rangedAI || !ammunitionSpent) && companyTactic === 'shield-wall' && (actor.side==='enemy'
      ? !weapon.ranged && actor.formationMovedRound===battle.round
      : actor.formationMovedRound===battle.round || battle.round - battle.lastContactRound < 4));
  for (const entry of formationLocked || wallLocked || nearbyTarget && !specialFlank && !breakingThrough || !pursuit || !pursuit.path.length ? [] : [pursuit]) {
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
    if (role==='reach-support' && !weapon.ranged && range>1
      && enemies.some(enemy=>hexDistance(point,enemy)<=range)
      && !canAfford(battle,actor,apCost+attackCost,
        movementFatigue(actor,battleMovementCost(battle,actor,actor,point))+basicFatigue)) continue;
    const alliesOnTarget = battle.units.filter(unit => unit.alive && unit.side === actor.side && unit.id !== actor.id
      && hexDistance(unit, entry.target) <= 1).length;
    const adjacentThreats = enemies.filter(enemy => hexDistance(point, enemy) <= 1).length;
    candidates.push({ id: `move-${entry.target.id}`, type: 'move', targetId: entry.target.id, point, apCost,
      fatigueCost: movementFatigue(actor, battleMovementCost(battle, actor, actor, point)), bonus: 14 + (breakingThrough ? 35 : 0) + ((rangedAI ? ammunitionSpent : noAmmo) ? 15 : 0) + (specialFlank && pursuit===specialFlank && !weapon.ranged ? 35 : 0)
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
      || wall.fatigueCost+advance.fatigueCost>injuryStat(actor,'maxFatigue')-actor.fatigue)) wall.bonus=-8;
  }
  if (actor.ap >= 9) candidates.push({ id: 'recover', type: 'recover', apCost: 9, fatigueCost: 0, bonus: actor.fatigue >= injuryStat(actor,'maxFatigue') * .55 ? 18 : -20 });
  if (companyTactic==='skirmish' && skirmishFireSupport(state,actor.side)) candidates.push({id:'skirmish-hold',type:'hold',apCost:0,fatigueCost:0,bonus:0});
  const offensive = action => (roleRules(battle)?['attack','area','charge','lunge']:['attack','area','charge']).includes(action.type);
  if(roleRules(battle))for(let i=candidates.length-1;i>=0;i--)if(!canAfford(battle,actor,candidates[i].apCost,candidates[i].fatigueCost)||candidates[i].legal===false)candidates.splice(i,1);
  for (let i=candidates.length-1;i>=0;i--) {
    const action=candidates[i];
    if (preserving && ['move','charge','lunge'].includes(action.type)) { candidates.splice(i,1); continue; }
    if (action.type==='move' && !meleeApproachSafe(battle,actor,weapon,action.point,action.apCost,action.fatigueCost)) candidates.splice(i,1);
  }
  // Prefer the dagger's health-focused special when it is useful and affordable.
  // A reliable single-hit finish, or an unaffordable special, still permits Stab.
  if (battle.weaponCompletionVersion===1 && ['dagger','qatal'].includes(skillFamily)) {
    for (const basic of candidates.filter(a=>a.id==='attack')) {
      const special=candidates.find(a=>a.targetId===basic.targetId && ['puncture','deathblow'].includes(a.id));
      if (!special) continue;
      const hitChance=attackHitChance(battle,actor,basic.target,weapon,basic.option?.hitBonus??0,basic.option)/100;
      const rejected=basic.killProbability<hitChance*.75?basic:special;
      candidates.splice(candidates.indexOf(rejected),1);
    }
  }
  if (wingDuty && !weapon.ranged && candidates.some(action=>action.type==='attack')) {
    for (let i=candidates.length-1;i>=0;i--) if (candidates[i].type==='move' && candidates[i].targetId) candidates.splice(i,1);
  }
  if (roleRules(battle) && role==='flanker' && weapon.ranged && targetPaths.some(entry=>entry.path.length===0
    && candidates.some(action=>action.type==='attack' && action.targetId===entry.target.id))) {
    for (let i=candidates.length-1;i>=0;i--) if (candidates[i].type==='move' && candidates[i].targetId) candidates.splice(i,1);
  }
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
  for (const action of candidates) if (role==='breaker' && action.type==='area') {
    action.bonus += 8 * Math.max(0,action.targets.filter(target=>target.side!==actor.side).length-1);
  }
  for (const action of candidates) if (action.targetId) {
    action.target ??= enemies.find(enemy=>enemy.id===action.targetId);
    if (action.target && wingDuty && getItem(actor.equipment.mount) && !weapon.ranged
      && !isMoraleImmune(action.target) && action.target.morale<25 && hexDistance(actor,action.target)===1) action.bonus+=60;
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
  const ranked = rankTacticalActions(battle.weaponCompletionVersion===1?{...actor,maxFatigue:availableFatigue(actor)}:actor, candidates, { role, round:battle.round, targetPriorities:rangedAI, nearestDistance:nearest, tactic: battle.enemyTacticsVersion === 1 ? companyTactic : battle.tactic, focusTargetId: battle.enemyTacticsVersion === 1 && actor.side === 'enemy' ? null : battle.focusTargetId,
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
    if(interception.blocked||!actor.alive){actor.ap=Math.max(0,actor.ap-choice.apCost);actor.fatigue=Math.min(injuryStat(actor,'maxFatigue'),actor.fatigue+choice.fatigueCost);const message=`${actor.name}'s lunge is stopped by Spearwall.`;battle.lastEvent=makeBattleEvent(actor,choice.target,'hold',message,weapon,null,{skillName:'Lunge',moveFrom:from,reactions:interception.reactions});battleLog(battle,message);}
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
      bankKillMomentum(actor,procs,effects);
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
        actor.ap += berserkAp(actor);
        actor.berserkRound = battle.round;
        procs.push(`Berserk: +${berserkAp(actor)} AP.`);
        effects.push({ id: 'berserk', amount: berserkAp(actor) });
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
    actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + choice.fatigueCost);
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
    actor.fatigue = hasPerk(actor, 'recover') ? Math.max(0, actor.fatigue - Math.max(22, Math.ceil(actor.fatigue * (perkUpgraded(actor,'recover')?.75:.5)))) : Math.max(0, actor.fatigue - 22);
    const message = `${actor.name} catches their breath.`;
    battle.lastEvent = makeBattleEvent(actor, null, 'recover', message, equipped);
    battleLog(battle, message);
  }
  if (retreatReactions.length) battle.lastEvent.reactions = [...retreatReactions, ...(battle.lastEvent.reactions ?? [])];
  if (!finishBattlePhase(battle) && (actor.ap <= 0 || !actor.alive)) nextBattleTurn(battle);
  return result(true, battle.lastEvent.message);
}

function refreshSimultaneousRound(state) {
  const battle=state.battle,clock=battle.simultaneous;
  battle.round++;clock.roundEndsAt+=SIM_ROUND_MS;
  battle.turnOrder=sortTurnOrder(battle);orderCompanyTurnsForFormation(battle);
  battle.turnIndex=0;battle.activeId=battle.turnOrder[0];
  for(const unit of battle.units){
    delete unit.overwhelmed;
    if(battle.perkBalanceVersion===1)delete unit.reachAdvantageStacks;
    if(!unit.alive)continue;
    regenerateLivingShield(battle,unit);
    unit.ap=getTurnAp(unit)+(unit.pendingBerserkAp??0);unit.pendingBerserkAp=0;
    unit.shieldWallActive=false;unit.spearwallActive=false;unit.riposteActive=false;
    unit.movementCredit=Math.max(0,movementBudget(unit,battle)-2)*2;
    if(unit.bleeding||freshInjuryBleeding(unit)){unit.bleedTickRound=battle.round;tickBleeding(state,unit);rememberSimultaneousEvent(battle,battle.lastEvent,300);}
  }
  finishBattlePhase(battle);
}

// Delta is simulation milliseconds; speed and pause belong to the UI.
export function advanceSimultaneousBattle(state,elapsedMs=SIM_STEP_MS,{maxActions=Infinity,budgetMs=Infinity}={}) {
  const battle=state.battle,clock=battle?.simultaneous;
  if(!clock||battle.status!=='active')return result(false,'There is no active simultaneous battle.');
  if(!Number.isFinite(elapsedMs)||elapsedMs<0||!(maxActions>0)||!(budgetMs>0))return result(false,'Invalid battle time.');
  if(elapsedMs===0)return {...result(true,'The battle is paused.'),actions:0};
  const total=clock.carryMs+Math.min(elapsedMs,2000)+clock.backlogMs;
  clock.carryMs=total%SIM_STEP_MS;
  clock.backlogMs=Math.min(2000,Math.floor(total/SIM_STEP_MS)*SIM_STEP_MS);
  const started=globalThis.performance?.now()??0;
  let actions=0;
  while((clock.backlogMs>=SIM_STEP_MS||clock.pendingIds.length)&&battle.status==='active'){
    if(!clock.pendingIds.length){
      if(clock.time+SIM_STEP_MS>=1000*SIM_ROUND_MS)break;
      // End an exhausted AP cycle after its final recoveries/animations, rather
      // than showing several seconds of an empty battlefield. Advance virtual
      // time through the idle tail so effect expiry and cycle bookkeeping agree.
      const living=battle.units.filter(u=>u.alive);
      if(living.every(u=>(u.ap<=0||u.stunnedTurns>0)&&clock.actors[u.id].readyAt<=clock.time)
        && simultaneousEvents(battle).every(entry=>entry.time+entry.duration<=clock.time))
        clock.time=Math.max(clock.time,clock.roundEndsAt-SIM_STEP_MS);
      clock.backlogMs-=SIM_STEP_MS;clock.time+=SIM_STEP_MS;expireSimultaneousEffects(battle);
      if(clock.time>=clock.roundEndsAt)refreshSimultaneousRound(state);
      if(battle.status!=='active')break;
      if(updateEnemyTactic(battle,getItem,state.supplies.ammo))battleLog(battle,`Enemy tactic changes to ${enemyBattleTactic(battle,getItem)}.`);
      clock.pendingIds=battle.units.filter(unit=>unit.alive&&unit.ap>0&&clock.actors[unit.id].readyAt<=clock.time&&!unit.stunnedTurns).sort(simultaneousPriority).map(u=>u.id);
    }
    while(clock.pendingIds.length&&battle.status==='active'){
      if(actions>=maxActions||actions>0&&(globalThis.performance?.now()??0)-started>=budgetMs)return {...result(true,battle.lastEvent?.message??'The simultaneous battle continues.'),actions};
      const actorId=clock.pendingIds.shift(),actor=battle.units.find(u=>u.id===actorId);
      // Earlier equal-time actions may kill or stun a fighter. Never commit a stale action.
      if(!actor.alive||actor.ap<=0||actor.stunnedTurns)continue;
      battle.turnIndex=battle.turnOrder.indexOf(actor.id);battle.activeId=actor.id;
      const before=actor.ap,previous=battle.lastEvent,previousItems=simultaneousItemCache;
      simultaneousItemCache=new Map();
      simultaneousActionCaches.set(battle,{mounted:battle.units.filter(u=>getItem(u.equipment.mount))});
      try { advanceBattleV2(state); }
      finally { simultaneousItemCache=previousItems;simultaneousActionCaches.delete(battle); }
      const event=battle.lastEvent===previous?null:battle.lastEvent;
      const berserkRefund=event?.effects?.find(e=>e.id==='berserk'&&!e.nextTurn)?.amount??0;
      const delay=simultaneousActionDelay(actor,event?.type==='hold'?0:before-actor.ap+berserkRefund,event);
      // Recovery paces another action when AP remain (including Berserk).
      // Once exhausted, only the visible action must finish before the AP refresh.
      // Keep initiative-based recovery without leaving a slow straggler idle
      // for multiple seconds after its animation has already finished.
      const settle=actor.ap>0?Math.min(delay,1000):Math.ceil(simultaneousEventDuration(event,delay)/SIM_STEP_MS)*SIM_STEP_MS;
      clock.actors[actor.id].readyAt=clock.time+settle;
      rememberSimultaneousEvent(battle,event,delay);actions++;
      if(battle.status==='active'){
        const active=battle.units.filter(u=>u.alive).sort(simultaneousPriority)[0];
        battle.activeId=active.id;battle.turnIndex=battle.turnOrder.indexOf(active.id);
      }
    }
  }
  return {...result(true,battle.lastEvent?.message??'The simultaneous battle continues.'),actions};
}

export function advanceBattle(state) {
  const battle = state.battle;
  if (!battle || battle.status !== 'active') return result(false, 'There is no active battle.');
  if(battle.simultaneous)return advanceSimultaneousBattle(state);
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
    if(battle.perkBalanceVersion===1)delete actor.reachAdvantageStacks;
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
  if (actor.fatigue + attackFatigueCost(actor, fatigueWeapon) > injuryStat(actor,'maxFatigue')) {
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
      ? Math.max(0, actor.fatigue - Math.max(22, Math.ceil(actor.fatigue * (perkUpgraded(actor,'recover')?.75:.5))))
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
  const vulnerability = target => target.hp + (target.bodyArmor + target.attachmentArmor + (target.attachment2Armor??0) + target.headArmor) * .15 + injuryStat(target,defenseKey) * .3;
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
    actor.fatigue = Math.min(injuryStat(actor,'maxFatigue'), actor.fatigue + movementFatigue(actor, used));
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
  for (let turn = 0; turn < (state.battle.rulesVersion === 2 ? 2000 : 500) && state.battle.status === 'active'; turn++) state.battle.simultaneous?advanceSimultaneousBattle(state,500):advanceBattle(state);
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
    if (!isMoraleImmune(unit)) unit.morale = Math.max(0, unit.morale - moraleDamage(unit, 12, battle));
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

export function getNamedLootKeepQuote(state, weaponsOnly = false) {
  if (state.battle?.status !== 'victory') return null;
  const keepIndices=state.battle.loot.items.flatMap((id,index)=>{
    const item=getItem(id);
    return item?.rarity==='famed' && (!weaponsOnly || item.slot==='weapon') ? [index] : [];
  });
  return getLootKeepQuote(state,keepIndices);
}

export function finishBattle(state, { shareLootIndices = [] } = {}) {
  const battle = state.battle;
  if (!battle || battle.status === 'active') return result(false, 'Finish the fight before claiming its result.');
  const victory = battle.status === 'victory';
  if (!Array.isArray(shareLootIndices) || !victory && shareLootIndices.length) return result(false, 'Only victory spoils can be shared.');
  const sharing = victory ? getLootShareQuote(state, shareLootIndices) : null;
  if (victory && !sharing) return result(false, 'Choose valid, distinct spoils to share.');
  const shared = new Set(shareLootIndices);
  const championBounty=getBattleChampionBounty(state);
  const battleGold=victory?getBattleLootGold(state):0;
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
    const activeShieldCondition = finishedShieldCondition(battle,person.equipment.shield,unit.battleSetSwapped ? unit.reserveShieldDurability : unit.shieldDurability);
    const reserveShieldCondition = finishedShieldCondition(battle,person.reserveEquipment.shield,unit.battleSetSwapped ? unit.shieldDurability : unit.reserveShieldDurability);
    const carriedAccessories = [...unit.accessories];
    if (unit.pocketDrawnFrom !== null) carriedAccessories[unit.pocketDrawnFrom] = unit.equipment.weapon;
    if (!unit.alive) {
      if (victory) {
        for (const [itemId, condition] of [
          ...SLOTS.map(slot => [person.equipment[slot], slot === 'armor' ? baseArmorCondition(unit,'body') : slot === 'attachment' ? unit.attachmentArmor : slot==='attachment2'?unit.attachment2Armor??person.armorDurability.attachment2 : slot === 'helmet' ? baseArmorCondition(unit,'head') : slot === 'shield' ? activeShieldCondition : slot === 'weapon' && getItem(person.equipment.weapon)?.throwing ? throwingAmmo.active : null]),
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
    if(battle.injuryRulesVersion===1)person.injuries=copyInjuries(unit.injuries).map(({fresh,sourceId,...wound})=>wound);
    person.hp = Math.max(1,Math.min(unit.hp,getCompanyStats(person).maxHp));
    person.morale = Math.min(100, unit.morale + (isMoraleImmune(unit) ? 0 : sharing?.morale ?? 0));
    person.accessories = carriedAccessories;
    person.throwingAmmo = throwingAmmo;
    person.armorDurability = { body: baseArmorCondition(unit,'body'), attachment: unit.attachmentArmor, attachment2:unit.attachment2Armor??person.armorDurability.attachment2, head: baseArmorCondition(unit,'head'),
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
    state.gold = Math.min(1000000000,state.gold+battleGold);
    if (championBounty) record(state,`Bounty Hunter collects ${championBounty} crowns for ${championBounty/CHAMPION_BOUNTY} defeated champion${championBounty===CHAMPION_BOUNTY?'':'s'}.`);
    state.food += loot.food;
    for (const kind of ['tools', 'medicine', 'ammo']) state.supplies[kind] += loot[kind];
    for (let index = 0; index < loot.items.length; index++) {
      if (shared.has(index)) continue;
      if (state.inventory.length >= getStashCapacity(state)) break;
      const itemId = loot.items[index];
      state.inventory.push(itemId);
      state.inventoryCondition.push(finishedShieldCondition(battle,itemId,loot.itemConditions?.[index] ?? itemCondition(itemId)));
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
    else if(!['blacksmith','legacy-warrior'].includes(battle.encounterType)) { const camp=getCampSites(state).find(site=>site.id===battle.campId); state.camps[battle.campId] = { clearedDay:state.day,respawnAt:worldHours(state)+campRespawnHours(state,battle.campId,camp.generation),generation:camp.generation }; }
  }
  recordWarriorBattle(state,battle);
  recordLegacyVictory(state,battle);
  if(battle.encounterType==='blacksmith')recordBlacksmithBattle(state,battle);
  if (!victory && undeadEncounter) {
    const remaining = battle.units.filter(u => u.side === 'enemy' && u.alive);
    recordAshenCasualties(state, battle.campId, remaining.map(u => u.troopIndex), Object.fromEntries(remaining.map(u => [u.troopIndex, { hp: u.hp, bodyArmor: baseArmorCondition(u,'body'), headArmor: baseArmorCondition(u,'head'), shieldDurability: rebalanceShieldCondition(u.equipment.shield,u.shieldDurability,getItem) }])));
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
  let message = victory ? `The company claims ${battleGold} crowns and defeats ${battle.encounterName}.` : state.gameOver ? 'The company has fallen.' : 'The company survives and leaves the battlefield behind.';
  if (sharing?.selectedCount) record(state, `Shared ${sharing.selectedCount} spoils worth ${sharing.value} crowns at ${sharing.townName}: each surviving brother receives ${sharing.xp} XP and up to ${sharing.morale} morale.`);
  if (!crisisWasComplete && state.ashenWinter?.phase === 'completed') message += ' Ashen Winter ends: all settlements are free. Claim your equipment reward in the journal.';
  record(state, message);
  state.battle = null;
  migrateShieldBalance(state,getItem,getUndeadEncounters,{inPlace:true});
  for(const fight of [...(state.worldSkirmishes??[])])if((fight.aKind==='undead-host'&&!state.ashenWinter?.hosts[fight.aId])||(fight.bKind==='undead-host'&&!state.ashenWinter?.hosts[fight.bId]))cancelWorldSkirmish(state,fight.aId);
  mergeOwnedNamedBonuses(state);
  checkBlacksmithDiscovery(state);
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
  const warrior=encounterType==='legacy-warrior'?getLegacyWarriorEncounters(worldState).find(e=>e.id===input.campId):null;
  const blacksmith=encounterType==='blacksmith'?getBlacksmithQuestEncounters(worldState).find(e=>e.id===input.campId):null;
  const undead = UNDEAD_TYPES.includes(encounterType) ? getUndeadEncounters(worldState).find(e => e.id === input.campId && e.kind === encounterType) : null;
  assert(recordObject(input) && (encounterType === 'camp' ? isCampId(input.campId) : encounterType === 'band' ? BAND_BY_ID.has(input.campId)
    : warrior || blacksmith || undead || ['rescue','deserters','bounty'].includes(encounterType) && worldState.contract?.type===encounterType && getQuestEncounter(worldState)?.id === input.campId), 'battle encounter');
  const encounter = warrior ?? blacksmith ?? undead ?? (encounterType === 'band' ? BAND_BY_ID.get(input.campId) : ['rescue','deserters','bounty'].includes(encounterType) ? getQuestEncounter(worldState)
    : getCampSites(worldState).find(camp=>camp.id===input.campId));
  if (undead) assert(recordObject(input.crisisContext) && input.crisisContext.crisisId === worldState.ashenWinter.crisisId && input.crisisContext.frontId === undead.frontId && input.crisisContext.townId === undead.townId && input.crisisContext.forceSeed === undead.force.seed && input.crisisContext.generation === undead.force.generation, 'crisis battle context');
  else assert(input.crisisContext === undefined, 'unexpected crisis context');
  const patrolAssist=input.patrolAssist;
  const assistingPatrol=patrolAssist&&getFactionPatrols(worldState).find(p=>p.id===patrolAssist.id);
  if(patrolAssist!==undefined){
    const d=patrolDefinitions(SETTLEMENTS).find(d=>d.id===patrolAssist?.id),p=d&&worldState.factionPatrols[d.id];
    assert(recordObject(patrolAssist)&&Object.keys(patrolAssist).sort().join(',')==='cycle,enemyTroops,id,troops'&&d&&['ally','neutral'].includes(assistingPatrol?.playerRelation)
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
  assert(input.equipmentEffectsVersion===undefined||input.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION,'battle equipment effect rules');
  assert(input.prefixPerkRulesVersion===undefined||input.prefixPerkRulesVersion===1,'battle prefix perk rules');
  assert(input.perkBalanceVersion===undefined||input.perkBalanceVersion===1,'battle perk balance rules');
  assert(input.perkCombatVersion===undefined||input.perkCombatVersion===1,'battle expanded perk rules');
  assert(input.roleConsistencyVersion===undefined||input.roleConsistencyVersion===1,'battle role consistency rules');
  assert(input.injuryRulesVersion===undefined||input.injuryRulesVersion===1,'battle injury rules');
  assert(input.injuryRulesVersion===1 ? validCount(input.injuryRng)&&input.injuryRng<=0xffffffff : input.injuryRng===undefined,'battle injury RNG');
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
    && famedBasesForCamp({...encounter,difficulty})?.includes(famedItem.legacyShieldId??famedItem.baseId)
    && (famedDrop === createFamedItemId(famedItem.baseId, famedSeed)||famedDrop===createFamedItemId(famedItem.baseId,famedSeed,2)||famedDrop===createFamedItemId(famedItem.baseId,famedSeed,3)||famedDrop===createFamedItemId(famedItem.baseId,famedSeed,5)||famedDrop===createFamedItemId(famedItem.baseId,famedSeed,7)||famedDrop===createFamedItemId(famedItem.baseId,famedSeed,9)||['armor','helmet'].includes(famedItem.slot)&&famedDrop===createFamedItemId(famedItem.baseId,famedSeed,8)||famedItem.slot==='weapon'&&famedItem.ranged&&famedDrop===createFamedItemId(famedItem.baseId,famedSeed,4)||famedDrop===`famed:${famedItem.baseId}:${famedSeed}`)
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
  assert(input.equipmentSetRulesVersion===undefined||isEquipmentSetRulesVersion(input.equipmentSetRulesVersion),'battle equipment set rules');
  assert(input.itemAffixRulesVersion===undefined||[1,2].includes(input.itemAffixRulesVersion),'battle item affix rules');
  assert(input.championLootVersion===undefined||[1,2].includes(input.championLootVersion),'battle champion loot rules');
  assert(input.enemyScalingVersion===undefined||input.enemyScalingVersion===1,'battle enemy scaling rules');
  const enemyLimit=warrior?1:undead?ASHEN_CONFIG.commanderSize:input.enemyScalingVersion===1?20:12;
  const validEnemyId=id=>/^enemy-[1-9]\d?$/.test(id)&&Number(id.slice(6))<=enemyLimit;
  assert(Array.isArray(input.units) && input.units.length >= 2 && input.units.length <= MAX_BATTLE_SIZE + (patrolAssist?9:3) + enemyLimit, 'battle units');
  assert(warrior?input.units.filter(u=>u.side==='enemy').length===1:input.units.filter(u=>u.side==='enemy').length<=enemyLimit,'battle enemy count');
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
    else if(blacksmith?.ancient&&unit.side==='enemy')assert(unit.undeadTraitsVersion===1&&blacksmith.enemies.some(e=>e.troopIndex===unit.troopIndex)&&unit.id===`enemy-${unit.troopIndex+1}`&&unit.morale===60,'blacksmith ancient troop');
    else assert(unit.undeadTraitsVersion === undefined && unit.troopIndex === undefined, 'unexpected undead traits');
    assert(unit.ally === undefined || unit.ally === true, 'battle ally marker');
    assert(unit.ally ? (questAllies||patrolAssist) && unit.side === 'company' && new RegExp(`^ally-[1-${patrolAssist?patrolAssist.troops.length:3}]$`).test(unit.id)
      : unit.side === 'company' ? partyIds.has(unit.id) : validEnemyId(unit.id), 'battle unit ownership');
    assert(typeof unit.name === 'string' && unit.name.length > 0 && unit.name.length <= 80, 'battle unit name');
    if(unit.ally&&patrolAssist)assert(unit.name===assistingPatrol?.enemies[Number(unit.id.slice(5))-1]?.name,'battle patrol soldier identity');
    assert(passableHex(unit, field), 'battle hex');
    assert(validCount(unit.maxHp) && unit.maxHp >= 1 && unit.maxHp <= 300 && validCount(unit.hp) && unit.hp <= unit.maxHp && unit.alive === (unit.hp > 0), 'battle health');
    assert(input.injuryRulesVersion===1 ? validInjuries(unit.injuries,worldState.day,{battle:true}) : unit.injuries===undefined,'battle injuries');
    assert(unit.undeadTraitsVersion!==1 || !unit.injuries?.length,'undead injuries');
    assert(!unit.injuries?.some(wound=>wound.sourceId!==null&&!input.units.some(source=>source.id===wound.sourceId)),'battle injury source');
    assert(!unit.injuries?.some(wound=>wound.fresh&&(wound.acquiredDay!==worldState.day||wound.healingDays!==0||wound.treated)),'battle fresh injuries');
    if(input.injuryRulesVersion===1&&unit.side==='company'&&!unit.ally){
      const original=party.find(person=>person.id===unit.id)?.injuries??[];
      const existing=unit.injuries.filter(wound=>!wound.fresh);
      assert(existing.length===original.length&&existing.every((wound,index)=>['id','acquiredDay','healingDays','treated'].every(key=>wound[key]===original[index][key])),'battle injury ownership');
    }
    assert(unit.champion===undefined||input.championRulesVersion===1&&unit.side==='enemy'&&unit.champion===true,'battle champion');
    assert(unit.championItemId===undefined||unit.champion&&['famed','named'].includes(getItem(unit.championItemId)?.rarity)&&[unit.equipment?.weapon,unit.reserveEquipment?.weapon,unit.pocketStowedWeapon].includes(unit.championItemId),'battle champion trophy');
    assert(!unit.champion||unit.championItemId,'battle champion trophy');
    assert(recordObject(unit.equipment), 'battle equipment');
    for (const slot of SLOTS) assert(unit.equipment[slot] === null || ['attachment','attachment2', 'mount'].includes(slot) && unit.equipment[slot] === undefined || getItem(unit.equipment[slot])?.slot === (slot==='attachment2'?'attachment':slot), 'battle equipment');
    assert(unit.equipment.attachment === undefined || unit.equipment.attachment === null || unit.equipment.armor, 'battle attachment requires armor');
    assert(!unit.equipment.attachment2||input.attachmentRulesVersion===1&&unit.equipment.armor&&(unit.side==='company'&&!unit.ally&&hasPerk(party.find(person=>person.id===unit.id),'layered-armor')||warrior&&unit.side==='enemy'&&hasPerk(worldState.legacyWarrior.member,'layered-armor')),'battle second attachment');
    assert(!getItem(unit.equipment.weapon)?.twoHanded || !unit.equipment.shield, 'battle two handed weapon');
    const reserveEquipment = unit.reserveEquipment ?? { weapon: null, shield: null };
    const accessories = unit.accessories ?? [null, null];
    const partyMember = unit.side === 'company' && !unit.ally ? party.find(person => person.id === unit.id) : null;
    const warriorMember=warrior&&unit.side==='enemy'?worldState.legacyWarrior.member:null;
    assert(unit.appearanceId === (partyMember??warriorMember)?.appearanceId, 'battle unit appearance');
    if(warriorMember)assert(unit.name===warriorMember.name&&unit.seed===warriorMember.seed,'warrior identity');
    if (partyMember) assert((unit.equipment.mount ?? null) === (partyMember.equipment.mount ?? null), 'battle mount owner');
    const perks = unit.perks ?? partyMember?.perks ?? [];
    assert(Array.isArray(perks) && perks.every(id => typeof id === 'string' && (PERK_BY_ID.has(id) || REMOVED_PERK_MIN_LEVEL.has(id))) && new Set(perks).size === perks.length, 'battle perks');
    assert(unit.side === 'enemy' ? warriorMember?JSON.stringify(perks)===JSON.stringify(warriorMember.perks):perks.length === 0 || difficulty === 3 && perks.length === 1 && ['bullseye','shield-expert','quick-hands','backstabber'].includes(perks[0]) : unit.ally ? (patrolAssist ? perks.length===0||assistingPatrol.difficulty===3&&perks.length===1&&['bullseye','shield-expert','quick-hands','backstabber'].includes(perks[0]) : perks.length === 0) : perks.length === (partyMember.perks ?? []).length && perks.every((id, index) => id === partyMember.perks[index]), 'battle perk owner');
    assert(unit.equipmentEffectsVersion===input.equipmentEffectsVersion,'battle unit equipment effect rules');
    if(unit.bonePlatingSpent!==undefined)assert(input.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&typeof unit.bonePlatingSpent==='boolean'&&hasBonePlating(unit,getItem),'battle bone plating charge');
    if(input.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&hasBonePlating(unit,getItem))assert(typeof unit.bonePlatingSpent==='boolean','battle missing bone plating charge');
    if(unit.shieldRegenRound!==undefined)assert(input.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&validCount(unit.shieldRegenRound)&&unit.shieldRegenRound<=input.round,'battle shield regeneration round');
    assert(unit.prefixPerkRulesVersion===input.prefixPerkRulesVersion,'battle unit prefix perk rules');
    assert(unit.perkBalanceVersion===input.perkBalanceVersion,'battle unit perk balance rules');
    if(unit.reachAdvantageStacks!==undefined)assert(input.perkBalanceVersion===1&&validCount(unit.reachAdvantageStacks)&&unit.reachAdvantageStacks<=5&&hasPerk(unit,'reach-advantage')&&getItem(unit.equipment.weapon)?.twoHanded&&!getItem(unit.equipment.weapon)?.ranged,'battle reach advantage stacks');
    if (unit.headHunterReady !== undefined) assert(input.perkCombatVersion === 1 && hasPerk({perks}, 'head-hunter') && typeof unit.headHunterReady === 'boolean', 'battle head hunter');
    if (unit.rotationRound !== undefined) assert(input.perkCombatVersion === 1 && validCount(unit.rotationRound) && unit.rotationRound <= input.round, 'battle rotation round');
    if (unit.overwhelmed !== undefined) assert(input.perkCombatVersion === 1 && recordObject(unit.overwhelmed) && Object.keys(unit.overwhelmed).sort().join(',') === 'round,stacks' && validCount(unit.overwhelmed.round) && unit.overwhelmed.round >= 1 && unit.overwhelmed.round <= input.round && validCount(unit.overwhelmed.stacks) && unit.overwhelmed.stacks >= 1 && unit.overwhelmed.stacks <= 100, 'battle overwhelm');
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
      if (!unit.setArmor && original?.sourceArmor !== undefined && ![2,3].includes(item.rollVersion)) {
        const seed = item.baseId ? Number(item.id.split(':')[2]) : null;
        const legacy = seed === null ? original.sourceArmor : Math.min(500,original.sourceArmor + Math.max(8,Math.round(original.sourceArmor * (.15 + (seed & 15) / 100))));
        if (unit[key] === legacy) unit[key] = item.armor;
      }
    }
    assert(unit.setArmor===undefined||isEquipmentSetRulesVersion(input.equipmentSetRulesVersion)&&validSetArmorSnapshot(unit,getItem,input.equipmentSetRulesVersion),'battle set armor');
    const expectedSet=input.equipmentSetRulesVersion?createSetArmorSnapshot(unit,getItem,{},input.equipmentSetRulesVersion):null;
    assert(Boolean(unit.setArmor)===Boolean(expectedSet),'battle set armor presence');
    assert(unit.maxBodyArmor === (expectedSet?.body.effectiveMax??armorMaximum(unit.equipment.armor)) && maxAttachmentArmor === armorMaximum(unit.equipment.attachment) && unit.maxHeadArmor === (expectedSet?.head.effectiveMax??armorMaximum(unit.equipment.helmet)), 'battle armor maximum');
    assert(validCount(unit.bodyArmor) && unit.bodyArmor <= unit.maxBodyArmor && validCount(attachmentArmor) && attachmentArmor <= maxAttachmentArmor && validCount(unit.headArmor) && unit.headArmor <= unit.maxHeadArmor, 'battle armor');
    assert(validCount(shieldDurability) && shieldDurability <= maxShieldDurability && validCount(reserveShieldDurability) && reserveShieldDurability <= maxReserveShieldDurability
      && (unit.maxShieldDurability === undefined || unit.maxShieldDurability === maxShieldDurability)
      && (unit.maxReserveShieldDurability === undefined || unit.maxReserveShieldDurability === maxReserveShieldDurability)
      && typeof battleSetSwapped === 'boolean', 'battle shield durability');
    assert(validCount(unit.seed) && unit.seed <= 0xffffffff, 'battle unit seed');
    assert(validCount(unit.morale) && unit.morale <= 100 && validCount(unit.fatigue) && unit.fatigue <= 300 && validCount(unit.ap) && unit.ap <= savedApLimit(unit,input), 'battle stamina');
    assert(unit.shieldWallActive === undefined || rulesVersion === 2 && typeof unit.shieldWallActive === 'boolean', 'battle shieldwall');
    for (const key of ['spearwallActive', 'riposteActive', 'stunProtected'])
      assert(unit[key] === undefined || weaponSkillsVersion === 1 && typeof unit[key] === 'boolean', `battle ${key}`);
    for(const key of ['dazedTurns','affixDazedTurns','staggeredTurns','disarmedTurns'])assert(unit[key]===undefined||input.weaponCompletionVersion===1&&validCount(unit[key])&&unit[key]<=(['dazedTurns','affixDazedTurns'].includes(key)?2:1),`battle ${key}`);
    if(unit.rangedProvocation!==undefined)assert(input.enemyAdaptiveRulesVersion===1 && unit.side==='enemy'
      && recordObject(unit.rangedProvocation) && Object.keys(unit.rangedProvocation).sort().join(',')==='round,sourceId'
      && validCount(unit.rangedProvocation.round) && unit.rangedProvocation.round>=1 && unit.rangedProvocation.round<=input.round
      && input.units.some(source=>source.side==='company' && source.id===unit.rangedProvocation.sourceId),'battle ranged provocation');
    assert(unit.bleedTickRound===undefined||input.weaponCompletionVersion===1&&validCount(unit.bleedTickRound)&&unit.bleedTickRound<=input.round,'battle bleed tick');
    if(unit.bleeding!==undefined)assert(input.weaponCompletionVersion===1&&recordObject(unit.bleeding)&&Object.keys(unit.bleeding).sort().join(',')==='damage,sourceId,turns'&&validCount(unit.bleeding.damage)&&unit.bleeding.damage>=1&&unit.bleeding.damage<=18&&[1,2].includes(unit.bleeding.turns)&&input.units.some(x=>x.id===unit.bleeding.sourceId),'battle bleeding');
    assert(unit.stunnedTurns === undefined || weaponSkillsVersion === 1 && validCount(unit.stunnedTurns) && unit.stunnedTurns <= 1, 'battle stun');
    assert(unit.killMomentumPct===undefined||input.itemAffixRulesVersion===2&&validCount(unit.killMomentumPct)&&unit.killMomentumPct>0&&unit.killMomentumPct<=100&&carriedAffixBoost(unit,'killMomentumPct',100)>=unit.killMomentumPct,'battle kill momentum');
    assert(unit.affixDazedTurns===undefined||input.itemAffixRulesVersion===2,'battle affix daze rules');
    assert(unit.pendingBerserkAp === undefined || weaponSkillsVersion === 1 && (input.itemAffixRulesVersion>=1?[0,4,5,6]:[0,4]).includes(unit.pendingBerserkAp), 'battle pending Berserk');
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
    if (unit.battleStats !== undefined) assert(recordObject(unit.battleStats)
      && Object.keys(unit.battleStats).length === PERFORMANCE_KEYS.length
      && PERFORMANCE_KEYS.every(key=>validCount(unit.battleStats[key])), 'battle performance stats');
    assert(unit.tacticalRole === undefined || COMBAT_ROLES.includes(unit.tacticalRole) && unit.tacticalRole !== 'auto', 'battle tactical role');
    assert(unit.skillPreference === undefined || SKILL_PREFERENCES.includes(unit.skillPreference), 'battle skill preference');
    assert(unit.reload === undefined || validCount(unit.reload) && unit.reload <= 2, 'battle reload');
    for (const key of ['meleeSkill', 'rangedSkill', 'meleeDefense', 'rangedDefense', 'maxFatigue', 'initiative', 'resolve']) assert(validCount(unit[key]) && unit[key] <= 300, `battle ${key}`);
    return {
      id: unit.id, name: unit.name, side: unit.side, ...(unit.ally ? { ally: true } : {}), q: unit.q, r: unit.r,
      ...(input.injuryRulesVersion===1?{injuries:copyInjuries(unit.injuries)}:{}),
      ...(unit.setArmor===undefined?{}:{setArmor:structuredClone(unit.setArmor)}),
      ...(unit.battleStats === undefined ? {} : {battleStats:{...unit.battleStats}}),
      hp: unit.hp, maxHp: unit.maxHp, bodyArmor: unit.bodyArmor, attachmentArmor, headArmor: unit.headArmor,
      maxBodyArmor: unit.maxBodyArmor, maxAttachmentArmor, ...(input.attachmentRulesVersion===1?{attachment2Armor,maxAttachment2Armor}:{}), maxHeadArmor: unit.maxHeadArmor,
      equipment: Object.fromEntries(SLOTS.filter(slot=>slot!=='attachment2'||input.attachmentRulesVersion===1||unit.equipment.attachment2!==undefined).map(slot => [slot, unit.equipment[slot] ?? null])),
      reserveEquipment: { weapon: reserveEquipment.weapon, shield: reserveEquipment.shield }, accessories: [...accessories],
      pocketDrawnFrom, pocketStowedWeapon, pocketStowedReload: unit.pocketStowedReload ?? 0,
      pocketDrawnRound: unit.pocketDrawnRound ?? 0, reserveReload: unit.reserveReload ?? 0, meleePhase: unit.meleePhase ?? false,
      shieldDurability, maxShieldDurability, reserveShieldDurability, maxReserveShieldDurability, battleSetSwapped,
      throwingAmmo: { active: throwingAmmo.active, reserve: throwingAmmo.reserve },
      ...(input.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION?{equipmentEffectsVersion:EQUIPMENT_EFFECTS_VERSION}:{}),
      ...(unit.bonePlatingSpent===undefined?{}:{bonePlatingSpent:unit.bonePlatingSpent}),
      ...(unit.shieldRegenRound===undefined?{}:{shieldRegenRound:unit.shieldRegenRound}),
      ...(input.prefixPerkRulesVersion===1?{prefixPerkRulesVersion:1}:{}),
      ...(input.perkBalanceVersion===1?{perkBalanceVersion:1}:{}),
      ...(unit.reachAdvantageStacks===undefined?{}:{reachAdvantageStacks:unit.reachAdvantageStacks}),
      ...(unit.headHunterReady === undefined ? {} : {headHunterReady:unit.headHunterReady}),
      ...(unit.rotationRound === undefined ? {} : {rotationRound:unit.rotationRound}),
      ...(unit.overwhelmed === undefined ? {} : {overwhelmed:{...unit.overwhelmed}}),
      perks: perks.filter(id => PERK_BY_ID.has(id)), adaptation, berserkRound, frenzyUntilRound, turnStartedRound, freeSwapRound, freeHealRound,
      ...(unit.champion?{champion:true,championItemId:unit.championItemId}:{}),
      ...(unit.killMomentumPct===undefined?{}:{killMomentumPct:unit.killMomentumPct}),
      ...Object.fromEntries(['dazedTurns','affixDazedTurns','staggeredTurns','disarmedTurns','bleedTickRound'].filter(key=>unit[key]!==undefined).map(key=>[key,unit[key]])),
      ...(unit.bleeding===undefined?{}:{bleeding:{...unit.bleeding}}),
      ...(unit.rangedProvocation===undefined?{}:{rangedProvocation:{...unit.rangedProvocation}}),
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
  assert(Array.isArray(input.log) && input.log.length <= 120 && input.log.every(entry => typeof entry === 'string' && entry.length <= (input.itemAffixRulesVersion===2?600:300)), 'battle log');
  const simultaneous=input.simultaneous===undefined?undefined:validateSimultaneousClock(input.simultaneous,units,input.round);
  assert(simultaneous===undefined||rulesVersion===2&&input.weaponCompletionVersion===1,'simultaneous combat rules');
  const event = input.lastEvent;
  assert(event === null || (recordObject(event) && ['attack', 'move', 'hit', 'miss', 'fall', 'retreat', 'recover', 'hold', 'swap', 'use'].includes(event.type) && typeof event.message === 'string' && event.message.length <= (input.itemAffixRulesVersion===2?600:300) && (event.actorId === null || ids.has(event.actorId)) && (event.targetId === null || ids.has(event.targetId))), 'battle event');
  if(event?.bonePlatingAbsorbed!==undefined)assert(input.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&event.bonePlatingAbsorbed===true&&event.type==='attack'&&event.head===false&&event.hpDamage===0&&event.armorDamage===0&&units.find(u=>u.id===event.targetId)?.bonePlatingSpent===true,'battle bone plating event');
  if (event?.head !== undefined) assert(typeof event.head === 'boolean', 'battle event head');
  if (event?.fallen !== undefined) assert(typeof event.fallen === 'boolean', 'battle event fallen');
  if (event?.weaponId !== undefined) assert(event.weaponId === null || getItem(event.weaponId)?.slot === 'weapon', 'battle event weapon');
  if (event?.itemId !== undefined) assert(getItem(event.itemId)?.slot === 'accessory', 'battle event item');
  if (event?.skillName !== undefined) assert(['Reload', 'Stunned', 'Flee', ...(input.perkCombatVersion===1?['Rotation']:[]), ...(input.weaponCompletionVersion===1?['Bleeding',...Object.values(WEAPON_ACTIONS).map(skill=>skill.name)]:[]), ...Object.values(COMBAT_SKILLS).map(skill => skill.name)].includes(event.skillName), 'battle event skill');
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
  if(event?.strikes!==undefined)assert(input.weaponCompletionVersion===1&&Array.isArray(event.strikes)&&event.strikes.length>=1&&event.strikes.length<=3&&event.strikes.every(x=>recordObject(x)&&['hpDamage','armorDamage','shieldDamage'].every(k=>validCount(x[k])&&x[k]<=1000)&&['hit','head','fallen'].every(k=>typeof x[k]==='boolean')&&(x.bonePlatingAbsorbed===undefined||input.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&x.bonePlatingAbsorbed===true&&x.hit&&!x.head&&x.hpDamage===0&&x.armorDamage===0&&units.find(u=>u.id===event.targetId)?.bonePlatingSpent===true)),'battle multi-strike impacts');
  if (event?.reactions !== undefined) {
    assert(weaponSkillsVersion === 1 && Array.isArray(event.reactions) && event.reactions.length >= 1 && event.reactions.length <= 12
      && event.reactions.every(reaction => recordObject(reaction) && ids.has(reaction.actorId) && ids.has(reaction.targetId)
        && ['attack', 'miss'].includes(reaction.type) && ['Riposte', 'Spearwall', 'Opportunity Strike', 'Wolf Bite'].includes(reaction.skillName)
        && validHex(reaction.from, field) && validHex(reaction.to, field)
        && ['hpDamage', 'armorDamage', 'shieldDamage'].every(key => validCount(reaction[key]) && reaction[key] <= 1000)
        && typeof reaction.head === 'boolean' && typeof reaction.fallen === 'boolean'), 'battle event reactions');
  }
  for (const entry of [event, ...(event?.reactions ?? [])].filter(Boolean)) {
    if (entry.effects !== undefined) assert(Array.isArray(entry.effects) && entry.effects.length <= (input.itemAffixRulesVersion===2?7:4)
      && new Set(entry.effects.map(effect => effect?.id)).size === entry.effects.length
      && entry.effects.every(effect => recordObject(effect) && ['battle-flow','killing-frenzy','berserk','howling',...(input.itemAffixRulesVersion===2?['affix-daze','kill-momentum','kill-momentum-hit']:[])].includes(effect.id)
        && (effect.id!=='affix-daze'||effect.amount===2)
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
    ...(event.bonePlatingAbsorbed===undefined?{}:{bonePlatingAbsorbed:event.bonePlatingAbsorbed}),
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
  assert(recordObject(loot) && validCount(loot.gold) && loot.gold <= 100000 && Array.isArray(loot.items) && loot.items.length <= (input.championLootVersion>=1?Math.max(24,input.units.filter(u=>u.side==='enemy').length*(input.championLootVersion===2?8:6)):undead?ASHEN_CONFIG.commanderSize*4:input.enemyScalingVersion===1?80:24) && loot.items.every(id => getItem(id)), 'battle loot');
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
    ...(input.injuryRulesVersion===1?{injuryRulesVersion:1,injuryRng:input.injuryRng}:{}),
    ...(input.weaponCompletionVersion===undefined?{}:{weaponCompletionVersion:1}),
    ...(input.equipmentEffectsVersion===undefined?{}:{equipmentEffectsVersion:EQUIPMENT_EFFECTS_VERSION}),
    ...(input.prefixPerkRulesVersion===undefined?{}:{prefixPerkRulesVersion:1}),
    ...(input.perkBalanceVersion===undefined?{}:{perkBalanceVersion:1}),
    ...(input.perkCombatVersion===undefined?{}:{perkCombatVersion:1}),
    ...(input.roleConsistencyVersion===undefined?{}:{roleConsistencyVersion:1}),
    ...(input.attachmentRulesVersion===undefined?{}:{attachmentRulesVersion:1}),
    ...(input.championRulesVersion===undefined?{}:{championRulesVersion:1}),
    ...(input.escapeRulesVersion===undefined?{}:{escapeRulesVersion:1}),
    ...(input.enemyScalingVersion===undefined?{}:{enemyScalingVersion:1}),
    ...(input.equipmentSetRulesVersion===undefined?{}:{equipmentSetRulesVersion:input.equipmentSetRulesVersion}),
    ...(input.itemAffixRulesVersion===undefined?{}:{itemAffixRulesVersion:input.itemAffixRulesVersion}),
    ...(input.championLootVersion===undefined?{}:{championLootVersion:input.championLootVersion}),
    ...(input.rulesVersion === undefined ? {} : { rulesVersion }),
    ...(input.weaponSkillsVersion === undefined ? {} : { weaponSkillsVersion }),
    ...(input.mountSkillsVersion === undefined ? {} : { mountSkillsVersion }),
    ...(input.mountBalanceVersion === undefined ? {} : { mountBalanceVersion }),
    ...(simultaneous===undefined?{}:{simultaneous}),
    field, units, turnOrder: [...input.turnOrder], turnIndex: input.turnIndex, rng: input.rng, lootSeed,
    log: [...input.log], lastEvent: normalizedEvent,
    loot: { gold: loot.gold, food: loot.food, tools: loot.tools, medicine: loot.medicine, ammo: loot.ammo, items: [...loot.items], itemConditions: [...itemConditions] },
    casualties: [...input.casualties], xp: { ...input.xp },
  };
}

export function validateSave(input) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 'expected an object');
  input=migrateShieldBalance(input,getItem,getUndeadEncounters);
  assert(input.ancientRestorationSerial === undefined || validCount(input.ancientRestorationSerial) && input.ancientRestorationSerial <= 1000000, 'ancient restoration serial');
  assert(input.direwolfCraftSerial === undefined || validCount(input.direwolfCraftSerial) && input.direwolfCraftSerial <= 1000000, 'direwolf craft serial');
  const ashenWinter = validateAshenWinter(input.ashenWinter, input.seed, SETTLEMENTS);
  const legacyWarrior=validateWarrior(input.legacyWarrior,input);
  const companyLegacy=validateLegacy(input.companyLegacy,{getItem,isNamedItem,itemCondition,now:worldHours(input)});
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
  assert(recordObject(discoveryRolls)&&Object.entries(discoveryRolls).every(([id,roll])=>(isCampId(id)||BAND_BY_ID.has(id))&&recordObject(roll)&&(roll.championGearVersion===undefined||roll.championGearVersion===1)&&(roll.namedAffixVersion===undefined||[1,2,3,4].includes(roll.namedAffixVersion))&&validCount(roll.cycle)&&roll.cycle<=1000000&&[0,5,8,13].includes(roll.champion)&&[0,15].includes(roll.famed)&&[0,12].includes(roll.mount)),'discovery encounter rolls');
  const contractBoards=input.contractBoards??{};
  assert(recordObject(contractBoards)&&Object.entries(contractBoards).every(([id,board])=>TOWN_BY_ID.has(id)&&recordObject(board)&&Object.keys(board).length===2&&validCount(board.week)&&board.week<=Math.floor((input.day-1)/7)&&Array.isArray(board.used)&&board.used.length<=3&&board.used.every(c=>['courier','merchant','combat'].includes(c))&&new Set(board.used).size===board.used.length),'contract boards');
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
    assert(person.injuries===undefined || validInjuries(person.injuries,input.day),'person injuries');
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
    assert(entry.respawnAt===undefined || entry.respawnAt===null && entry.clearedDay===null || Number.isFinite(entry.respawnAt) && entry.clearedDay!==null && entry.respawnAt>=(entry.clearedDay-1)*24 && entry.respawnAt<=Math.min(worldHours(input)+CAMP_RESPAWN_MAX_DAYS*24,entry.clearedDay*24+CAMP_RESPAWN_MAX_DAYS*24),'camp respawn');
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
  const worldSkirmishes=structuredClone(input.worldSkirmishes??[]),committed=new Set();
  assert(Array.isArray(worldSkirmishes)&&worldSkirmishes.length<=definitions.length+ASHEN_CONFIG.maxHosts,'world skirmishes');
  for(const f of worldSkirmishes){
    assert(recordObject(f)&&Object.keys(f).length===(f.aKind===undefined?14:15)&&(f.aKind===undefined||f.aKind==='undead-host')&&typeof f.id==='string'&&f.id===`skirmish:${f.aId}:${f.bId}:${Math.round(f.startHour*4)}`&&(f.aKind==='undead-host'?Boolean(ashenWinter.hosts[f.aId]):knownPatrols.has(f.aId))&&f.aId!==f.bId
      &&(f.aKind!=='undead-host'||['band','patrol'].includes(f.bKind))
      &&['patrol','band','undead-host'].includes(f.bKind)&&typeof f.bName==='string'&&f.bName.length<=120&&inBounds(f.x,f.y)
      &&Number.isFinite(f.startHour)&&f.startHour>=0&&f.startHour<=now&&Number.isFinite(f.endHour)&&validCount(f.aCycle)&&validCount(f.bCycle),'world skirmish record');
    assert(!committed.has(f.aId)&&!committed.has(f.bId),'world skirmish participants');committed.add(f.aId);committed.add(f.bId);
    const a=f.aKind==='undead-host'?ashenWinter.hosts[f.aId]:normalizedPatrols[f.aId],b=f.bKind==='patrol'?normalizedPatrols[f.bId]:f.bKind==='band'?normalizedBands[f.bId]:ashenWinter.hosts[f.bId];
    // Older patrol views omitted spawnCycle, so a respawned defender was
    // committed as cycle zero. Repair only that known omission; all troop,
    // engagement and outcome checks below still have to pass.
    const legacyDefenderCycle=f.bKind==='patrol'&&f.bCycle===0&&b?.spawnCycle>0;
    assert(a&&b&&(f.aKind==='undead-host'?a.force.generation:a.spawnCycle)===f.aCycle
      &&((f.bKind==='undead-host'?b.force.generation:b.spawnCycle)===f.bCycle||legacyDefenderCycle),'world skirmish generation');
    const ids=(list,max)=>Array.isArray(list)&&list.length>0&&list.length<=max&&new Set(list).size===list.length&&list.every(i=>validCount(i)&&i<max);
    assert(ids(f.aTroops,f.aKind==='undead-host'?a.force.size:definitions.find(d=>d.id===f.aId).size)&&ids(f.bTroops,f.bKind==='patrol'?definitions.find(d=>d.id===f.bId).size:f.bKind==='band'?20:b.force.size),'world skirmish troops');
    if(f.aKind==='undead-host')assert(JSON.stringify(a.force.troops)===JSON.stringify(f.aTroops),'world skirmish undead army');
    else assert(JSON.stringify(a.troops)===JSON.stringify(f.aTroops)&&a.behavior==='engaging'&&a.targetId===f.bId,'world skirmish army');
    if(f.bKind==='patrol')assert(JSON.stringify(b.troops)===JSON.stringify(f.bTroops)&&b.behavior==='engaging'&&b.targetId===f.aId,'world skirmish rival');
    if(f.bKind==='undead-host')assert(JSON.stringify(b.force.troops)===JSON.stringify(f.bTroops),'world skirmish host');
    assert(f.endHour===f.startHour+skirmishDuration(f.aTroops.length,f.bTroops.length),'world skirmish duration');
    const r=f.result,survivors=(list,max)=>Array.isArray(list)&&list.length<=max&&new Set(list).size===list.length&&list.every(i=>validCount(i)&&i<max);
    assert(recordObject(r)&&Object.keys(r).length===3&&typeof r.aWins==='boolean'&&survivors(r.aSurvivors,f.aTroops.length)&&survivors(r.bSurvivors,f.bTroops.length)
      &&(r.aWins?r.aSurvivors.length>0:r.bSurvivors.length>0),'world skirmish outcome');
    if(legacyDefenderCycle)f.bCycle=b.spawnCycle;
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
    assert(recordObject(destinationAction) && ['town', 'camp', 'caravan', 'patrol', 'rescue', 'deserters', 'bounty', 'blacksmith', 'legacy-warrior', ...UNDEAD_TYPES].includes(destinationAction.type), 'destination action');
    const target = UNDEAD_TYPES.includes(destinationAction.type) ? getUndeadEncounters(input).find(e => e.id === destinationAction.id) : destinationAction.type === 'town' ? (TOWN_BY_ID.has(destinationAction.id) && townBlocked(input, destinationAction.id) && input.destination?.x !== TOWN_BY_ID.get(destinationAction.id).x ? exteriorPoint(TOWN_BY_ID.get(destinationAction.id), SETTLEMENTS) : TOWN_BY_ID.get(destinationAction.id))
      : destinationAction.type === 'legacy-warrior' ? getLegacyWarriorEncounters(input).find(e=>e.id===destinationAction.id) : destinationAction.type === 'blacksmith' ? getBlacksmithQuestEncounters(input).find(e=>e.id===destinationAction.id)
      : destinationAction.type === 'patrol' ? getJoinablePatrolBattle(input,destinationAction.id)?.patrol
      : destinationAction.type === 'camp' ? getCampSites(input).find(site => site.id === destinationAction.id)
      : ['rescue','deserters','bounty'].includes(destinationAction.type) ? getQuestEncounter(input)?.id === destinationAction.id ? getQuestEncounter(input) : null
      : getCaravans(input).find(caravan => caravan.id === destinationAction.id && (caravan.status === 'en-route' || caravan.status === 'under-attack'));
    assert(target && input.destination && pursuit === null && !input.battle
      && (['caravan','patrol'].includes(destinationAction.type) || UNDEAD_TYPES.includes(destinationAction.type) || input.destination.x === target.x && input.destination.y === target.y), 'destination action target');
    if (destinationAction.type === 'camp') assert(!target.cleared && destinationAction.generation === target.generation, 'destination camp generation');
  }
  const legendaryBlacksmith=validateBlacksmith(input.legendaryBlacksmith,input.day,{getItem,validPoint,shieldMaximum,expectedReward:createFamedItemId('arming-sword',hashSeed(`${input.seed}:blacksmith:reward:v1`),3),expectedEncounter:(stage,day)=>blacksmithEncounter(input,stage,day,{shieldDesigns:input.legendaryBlacksmith?.quests[stage-1]?.encounter?.shieldDesignsVersion===1})});
  const battle = validateBattle(input.battle, input.party, input);
  assert(!battle || battle.tactic === tactic, 'battle tactic');
  assert(!battle || input.destination === null && pursuit === null && (battle.encounterType==='legacy-warrior'?Boolean(getLegacyWarriorEncounters(input).find(e=>e.id===battle.campId)):battle.encounterType==='blacksmith'?Boolean(getBlacksmithQuestEncounters(input).find(e=>e.id===battle.campId)):UNDEAD_TYPES.includes(battle.encounterType) ? Boolean(getUndeadEncounters(input).find(e => e.id === battle.campId)) : battle.encounterType === 'band' ? (bands[battle.campId]?.defeatedUntil ?? 0) <= worldHours(input) : !campRecord(input,battle.campId).cleared), 'battle location');
  assert(!gameOver || input.party.length === 0 && battle === null, 'game over state');
  assert(Array.isArray(input.visited) && input.visited.length <= SETTLEMENTS.length && input.visited.every(id => TOWN_BY_ID.has(id)) && new Set(input.visited).size === input.visited.length, 'visited settlements');
  assert(Array.isArray(input.log) && input.log.length <= MAX_LOG && input.log.every(entry => typeof entry === 'string' && entry.length <= 500), 'log');
  assert(input.additionalContracts===undefined||Array.isArray(input.additionalContracts)&&input.additionalContracts.length<=2,'additional contracts');
  assert((input.additionalContracts??[]).every(recordObject),'additional contract records');
  const activeContracts=getActiveContracts(input);
  assert(activeContracts.length<=3&&new Set(activeContracts.map(getContractCategory)).size===activeContracts.length&&new Set(activeContracts.map(c=>c.id)).size===activeContracts.length,'contract slots');
  assert(!input.additionalContracts?.length||input.contract&&input.additionalContracts.every(c=>getContractCategory(c)!=='combat'),'primary combat contract');
  for (const contract of activeContracts) {
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
  const normalizeContract = contract => contract ? { id: contract.id, type: contract.type ?? 'courier', from: contract.from, to: contract.to, reward: contract.reward, renown: contract.renown ?? 1, ...(contract.type === 'supply' ? { goodId: contract.goodId, quantity: contract.quantity } : {}), ...(['hunt', 'assault'].includes(contract.type) ? { campId: contract.campId, campGeneration: contract.campGeneration??0 } : {}), ...(contract.type === 'rescue' ? { rescueId: contract.rescueId, rescuePoint: { ...contract.rescuePoint }, rescueDifficulty: contract.rescueDifficulty, rescued: contract.rescued } : {}), ...(['deserters','bounty'].includes(contract.type)?{deserterId:contract.deserterId,deserterPoint:{...contract.deserterPoint},factionId:contract.factionId,difficulty:3,defeated:contract.defeated}:{}), acceptedDay: contract.acceptedDay } : null;
  const inventory = [...input.inventory];
  const conditions = [...inventoryCondition];
  const party = input.party.map(person => normalizeMember({
    id: person.id, name: person.name, background: person.background, seed: person.seed,
    combatRole: person.combatRole ?? 'auto', skillPreference: person.skillPreference ?? 'balanced',
    ...(person.backgroundId === undefined ? {} : { backgroundId: person.backgroundId }),
    ...(person.appearanceId ? { appearanceId: person.appearanceId } : {}),
    traits: [...(person.traits ?? [])],
    hp: person.hp, morale: person.morale, injuries:copyInjuries(person.injuries),
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
  assert(input.worldExploration===undefined || validExploration(input.worldExploration), 'Invalid world exploration.');
  return {
    ...(input.worldExploration===undefined?{}:{worldExploration:input.worldExploration}),
    version: 1, shieldBalanceVersion:1, seed: input.seed, day: input.day, hour: input.hour,
    ...(input.ancientRestorationSerial === undefined ? {} : { ancientRestorationSerial: input.ancientRestorationSerial }),
    ...(input.direwolfCraftSerial === undefined ? {} : { direwolfCraftSerial: input.direwolfCraftSerial }),
    ...(legendaryBlacksmith===undefined?{}:{legendaryBlacksmith}),
    ashenWinter,
    ...(companyLegacy===undefined?{}:{companyLegacy}),
    ...(legacyWarrior===undefined?{}:{legacyWarrior}),
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
    contractBoards:Object.fromEntries(Object.entries(contractBoards).map(([id,board])=>[id,{week:board.week,used:[...board.used]}])),
    deserterBoards:{...deserterBoards},retinue:{...defaultRetinue(),...retinue,members:[...members],scoutLevel,cartLevel:retinue.cartLevel??0,bountyBoards:{...retinue.bountyBoards}},discoveryRolls:Object.fromEntries(Object.entries(discoveryRolls).map(([id,roll])=>[id,{...roll}])),
    shipments: normalizedShipments,
    shipmentLegacyThroughDay,
    ...(input.mountRewards === undefined ? {} : { mountRewards: { ...mountRewards } }),
    camps: Object.fromEntries(Object.entries(camps).map(([id, entry]) => [id, { clearedDay:entry.clearedDay,respawnAt:savedCampRespawnAt(input,id,entry),generation:entry.generation??0 }])),
    worldLayoutVersion: WORLD_LAYOUT_VERSION,
    factionPatrols:normalizedPatrols, worldSkirmishes:structuredClone(worldSkirmishes), worldLosses:structuredClone(worldLosses), factionReports:structuredClone(factionReports), factionSimulationHour,
    bands: normalizedBands, pursuit, encounterGraceUntil, tactic,
    battle, gameOver,
    position: { x: input.position.x, y: input.position.y },
    destination: input.destination ? { x: input.destination.x, y: input.destination.y } : null,
    destinationAction: destinationAction ? { type: destinationAction.type, id: destinationAction.id, ...(destinationAction.type === 'camp' ? { generation: destinationAction.generation } : {}) } : null,
    contract: normalizeContract(input.contract),
    additionalContracts: (input.additionalContracts??[]).map(normalizeContract),
    contractSerial: input.contractSerial, recruitSerial: input.recruitSerial, hiredRecruitOffers: [...hiredRecruitOffers],
    log: [...input.log], visited: [...input.visited],
  };
}


export function getDiscoveryEvent(state) { return discoveryEvent(state); }
export function getRetinue(state) {
  return {unlocked:!!state.retinue?.bountyHunterUnlocked,hired:!!state.retinue?.bountyHunter,cost:BOUNTY_HUNTER_COST,championBonus:5,championBounty:CHAMPION_BOUNTY};
}
export function hireBountyHunter(state) {
  const blocked=actionBlocked(state);if(blocked)return blocked;
  const access=requireTown(state);if(access.error)return access.error;
  if(!state.retinue?.bountyHunterUnlocked)return result(false,'Complete a wanted champion contract first.');
  if(state.retinue.bountyHunter)return result(false,'The Bounty Hunter already serves your company.');
  if(state.gold<BOUNTY_HUNTER_COST)return result(false,'The Bounty Hunter requires 5,000 crowns.');
  state.gold-=BOUNTY_HUNTER_COST;state.retinue.bountyHunter=true;
  const message='Bounty Hunter hired: permanent +5 percentage points to champion encounter chance and 300 crowns per defeated champion. No formation slot or daily wage.';
  record(state,message);return result(true,message);
}
