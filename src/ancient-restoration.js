import { DLC_ITEMS } from './dlc-items.js';

// Versioned, craft-only baselines. Neither ordinary loot nor old saves change.
export const ANCIENT_RESTORATION_TARGETS = Object.freeze({
  'bb-ancient-breastplate': [180, 16],
  'bb-ancient-mail': [140, 12],
  'bb-ancient-double-layer-mail': [160, 13],
  'bb-ancient-scale-harness': [170, 14],
  'bb-ancient-scale-coat': [250, 20],
  'bb-ancient-plated-mail-hauberk': [240, 19],
  'bb-ancient-plate-harness': [260, 20],
  'bb-ancient-plated-scale-hauberk': [280, 22],
  'bb-ancient-household-helmet': [130, 9],
  'bb-ancient-legionary-helmet': [180, 12],
  'bb-ancient-honorguard-helmet': [240, 16],
});
Object.values(ANCIENT_RESTORATION_TARGETS).forEach(Object.freeze);
export function restoredAncientId(sourceId, finish) {
  if (!Object.hasOwn(ANCIENT_RESTORATION_TARGETS, sourceId) || !['bronze', 'steel'].includes(finish)) return null;
  return `rest-${finish === 'bronze' ? 'b' : 's'}-${sourceId.slice(3)}`;
}
export const RESTORED_ANCIENT_ITEMS = Object.freeze(Object.entries(ANCIENT_RESTORATION_TARGETS).flatMap(([sourceId, [armor, fatigue]]) => {
  const source = DLC_ITEMS.find(item => item.id === sourceId);
  return ['bronze', 'steel'].map(finish => Object.freeze({
    ...source,
    id: restoredAncientId(sourceId, finish),
    restorationSourceId: sourceId,
    restorationFinish: finish,
    craftOnly: true,
    name: `${finish === 'bronze' ? 'Restored Bronze' : 'Restored Steel'} ${source.name.replace(/^Ancient /, '')}`,
    armor: finish === 'steel' ? Math.round(armor * 1.2) : armor,
    fatigue: finish === 'steel' ? Math.round(fatigue * 1.12) : fatigue,
    price: source.price + (source.slot === 'armor' ? 450 : 300),
    description: `An ancient ${source.name.replace(/^Ancient /, '').toLowerCase()}, restored by a town armorer. Its original ornament survives in ${finish === 'bronze' ? 'warm bronze with traces of patina' : 'silverish steel'}.`,
    role: 'Restored ancient workmanship combines improved protection with a carefully fitted lining.',
  }));
}));
export function ancientRestorationRecipe(sourceId) {
  if (!Object.hasOwn(ANCIENT_RESTORATION_TARGETS, sourceId)) return null;
  const source = DLC_ITEMS.find(item => item.id === sourceId);
  return { sourceId, count: source.slot === 'armor' ? 3 : 2, fee: ANCIENT_RESTORATION_TARGETS[sourceId][0] * 2 + ANCIENT_RESTORATION_TARGETS[sourceId][1] * 5 };
}

// Separate rolls: 80/10/10 first, then 3% named only when a piece exists.
export function ancientRestorationOutcome(primary, named) {
  if (![primary, named].every(n => Number.isFinite(n) && n >= 0 && n < 1)) throw new TypeError('Invalid restoration roll.');
  const finish = primary < .8 ? 'bronze' : primary < .9 ? 'steel' : null;
  return { finish, named: finish !== null && named < .03 };
}

export function ancientRestorationRolls(seed, serial) {
  let state = (seed ^ Math.imul(serial + 1, 0x9e3779b1)) >>> 0;
  const next = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let x = Math.imul(state ^ (state >>> 15), state | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const primary = next();
  if (primary >= .9) return { finish: null, named: false, namedSeed: null };
  return { ...ancientRestorationOutcome(primary, next()), namedSeed: Math.floor(next() * 4294967296) };
}
