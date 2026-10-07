import { DIREWOLF_HIDE, DIREWOLF_MAIL, MOONFANG_ID } from './direwolf-crafting.js';

export const DIREWOLF_LEATHER_HELMET = 'direwolf-leather-hood';
export const DIREWOLF_EXISTING_HELMET = 'bb-wolf-helmet';
export const DIREWOLF_ALPHA_HELMET = 'direwolf-alpha-helm';
export const DIREWOLF_BODY_IDS = Object.freeze([DIREWOLF_HIDE, DIREWOLF_MAIL, MOONFANG_ID]);
export const DIREWOLF_HELMET_ITEMS = Object.freeze([
  Object.freeze({
    id: DIREWOLF_LEATHER_HELMET, name: 'Direwolf Leather Hood', slot: 'helmet', visual: DIREWOLF_LEATHER_HELMET,
    armor: 120, fatigue: 3, price: 475, craftOnly: true, collection: 'crafted', sourceKind: 'crafted',
    description: 'A snarling ash-grey wolf crown above a fitted leather hood. A small silver crescent secures the pelt, leaving the wearer’s face clear.',
    role: 'Light direwolf headgear: 120 head protection for 3 fatigue. Pairs with Direwolf Hide, Direwolf Mail or Moonfang body armor.',
  }),
  Object.freeze({
    id: DIREWOLF_ALPHA_HELMET, name: 'Direwolf Alpha Helm', slot: 'helmet', visual: DIREWOLF_ALPHA_HELMET,
    armor: 265, fatigue: 15, price: 2045, craftOnly: true, collection: 'crafted', sourceKind: 'crafted',
    statBonuses: Object.freeze({ resolve: 4 }),
    description: 'An imposing wolf crown over a reinforced steel brow, layered leather cheek guards and a silver mail drape. The crescent clasp marks the pack’s finest workmanship.',
    role: 'Heavy direwolf headgear: 265 head protection for 15 fatigue. Retains the Wolf Helmet’s +4 resolve and pairs with direwolf body armor.',
  }),
]);
export const DIREWOLF_HELMET_ART = Object.freeze({
  [DIREWOLF_LEATHER_HELMET]: Object.freeze({ icon: './assets/direwolf-helmets/leather-icon.png', portrait: './assets/direwolf-helmets/leather-portrait.png', left: 14, top: -26, width: 74, height: 110, hideHead: false, hideBeard: true }),
  [DIREWOLF_ALPHA_HELMET]: Object.freeze({ icon: './assets/direwolf-helmets/alpha-icon.png', portrait: './assets/direwolf-helmets/alpha-portrait.png', left: 14, top: -26, width: 74, height: 110, hideHead: false, hideBeard: true }),
});
export const DIREWOLF_HELMET_RECIPES = Object.freeze({
  [DIREWOLF_LEATHER_HELMET]: Object.freeze({ itemId: DIREWOLF_LEATHER_HELMET, fee: 300, materialIds: Object.freeze([DIREWOLF_HIDE]) }),
  [DIREWOLF_ALPHA_HELMET]: Object.freeze({ itemId: DIREWOLF_ALPHA_HELMET, fee: 450, materialIds: Object.freeze([DIREWOLF_LEATHER_HELMET, DIREWOLF_EXISTING_HELMET]) }),
});
export function direwolfHelmetRecipe(itemId) { return Object.hasOwn(DIREWOLF_HELMET_RECIPES, itemId) ? DIREWOLF_HELMET_RECIPES[itemId] : null; }
