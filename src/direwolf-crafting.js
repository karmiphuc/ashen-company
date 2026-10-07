export const DIREWOLF_HIDE = 'bb-werewolf-hide-armor';
export const DIREWOLF_MAIL = 'bb-werewolf-mail-armor';
export const MOONFANG_ID = 'direwolf-moonfang-harness';
export const MOONFANG_FEE = 600;
export const MOONFANG_ITEM = Object.freeze({
  id: MOONFANG_ID, name: 'Direwolf Moonfang Harness', slot: 'armor', visual: MOONFANG_ID,
  armor: 195, fatigue: 13, price: 1090, craftOnly: true, collection: 'crafted', sourceKind: 'crafted', meleeMoraleDamage: 5,
  description: 'An ash-tipped direwolf mantle falls across layered dark hide and close-woven steel mail. A silver crescent clasps the pelt; the snarling head marks a hard-won trophy.',
  role: 'Mobile frontline armor: 195 body protection for 13 fatigue, with the direwolf’s intimidating presence.',
  intrinsicDescription: 'Successful melee hits inflict +5 morale damage before resolve resistance. No effect on shots or undead. Intimidation does not stack with Direwolf Fur and remains active when armor is depleted.',
});
export const MOONFANG_ART = Object.freeze({
  icon: './assets/direwolf-moonfang/icon.png', portrait: './assets/direwolf-moonfang/portrait.png',
  left: -10, top: 16, width: 120, height: 104,
});

// Its own saved sequence: previews, material condition, town and other recipes
// never change the named roll. Crafting always succeeds.
export function direwolfCraftRoll(seed, serial) {
  let state = (seed ^ 0x6d6f6f6e ^ Math.imul(serial + 1, 0x9e3779b1)) >>> 0;
  const next = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let x = Math.imul(state ^ (state >>> 15), state | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  return { named: next() < .03, namedSeed: Math.floor(next() * 4294967296) };
}
