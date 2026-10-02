import { townEventHash } from './town-events.js';
import { regionAt } from './geography.js';
import { armoryTheme, matchesArmoryTheme } from './armory-themes.js';

export const ARMORY_STOCK_VERSION = 1;
const DEFINITIONS = {
  blacksmith: {name:'Blacksmith',description:'Forged weapons and shields; a few better pieces rotate each week.'},
  armorsmith: {name:'Armorsmith',description:'More body armor and helmets, including heavy regional designs.'},
};
// Seeded once by settlement identity, never rerolled by visiting or resting.
export function townFacilities(seed, town) {
  const chance = town.kind === 'village' ? 12 : town.kind === 'castle' ? 48 : 58;
  const forced = {ironford:'blacksmith',highpass:'armorsmith',brassgate:'armorsmith',spicehaven:'armorsmith'};
  return Object.keys(DEFINITIONS).filter(id => forced[town.id] === id
    || townEventHash(`${seed}:${town.id}:facility:${id}`) % 100 < chance)
    .map(id => ({id,...DEFINITIONS[id]}));
}
export function townArmoryBudget(seed, town) {
  const facilities = townFacilities(seed,town), has = id => facilities.some(f=>f.id===id);
  const base = town.kind === 'village' ? 3 : town.kind === 'castle' ? 5 : 4;
  return {armor:base+(has('armorsmith')?4:0),helmet:base+(has('armorsmith')?3:0),
    weapon:base+2+(has('blacksmith')?4:0),shield:2+(has('blacksmith')?2:0),
    attachment:has('armorsmith')?3:1,accessory:4};
}
export function townGearTheme(town) {
  const theme=armoryTheme(regionAt(town.x,town.y).id);
  // Swamp cities supply living soldiers, not the local cult or buried legions.
  return theme==='cult'?'south':theme;
}
export function townDesign(item,town) {
  if(item.slot==='accessory'||item.slot==='attachment')return true;
  if(item.slot==='weapon'||item.slot==='shield') {
    const theme=townGearTheme(town);
    return item.region ? item.region===(theme==='north'?'north':theme==='south'?'south':null) : true;
  }
  if(/^(fantasy-|samurai-)/.test(item.id)&&townGearTheme(town)==='mercenary')return true;
  return matchesArmoryTheme(item,townGearTheme(town));
}
