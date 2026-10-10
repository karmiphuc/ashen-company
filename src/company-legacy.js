import { tombReady, validateEntombedLegacy } from './entombed-legacy.js';
// Bounded, campaign-local inheritance. No combat bonuses or separate account progression.
export const LEGACY_STAGES = Object.freeze([
  { name: 'A New Banner', townId: 'oakwatch', objective: 'Register your company in Oakwatch: 100 crowns and 10 provisions.' },
  { name: 'The Sealed Reliquary', townId: 'ironford', objective: 'Prepare the heirloom in Ironford: 500 crowns, 4 iron, 4 timber and 5 tools.' },
  { name: 'An Honest Reputation', townId: 'stonebridge', objective: 'Complete 3 ordinary contracts after preparing the reliquary. Report to Stonebridge.' },
  { name: 'Earn the Old Name', townId: 'ironford', objective: 'Win 3 difficulty-2+ camp or roaming-band battles after your report. Reach day 30 and 150 renown; return to Ironford.' },
]);
export const LEGACY_STASH_LIMIT = 3;
export const LEGACY_STASH_SLOTS = Object.freeze(['weapon','armor','helmet','shield','attachment','accessory','mount']);
export function initialLegacy(source, itemId, condition, generation = 1, stash = []) {
  return { version: stash.length ? 2 : 1, generation, source: { ...source }, itemId, condition, stage: 1, contracts: [], victories: [], ...(stash.length ? {stash:structuredClone(stash)} : {}) };
}
export function legacyStageReady(state) {
  const legacy = state.companyLegacy;
  if(legacy?.version===3)return tombReady(state)&&legacy.defeated;
  if (!legacy || legacy.stage === 5) return false;
  if (legacy.stage === 1) return state.gold >= 100 && state.food >= 10;
  if (legacy.stage === 2) return state.gold >= 500 && (state.cargo.iron ?? 0) >= 4 && (state.cargo.timber ?? 0) >= 4 && state.supplies.tools >= 5;
  if (legacy.stage === 3) return legacy.contracts.length === 3;
  return legacy.victories.length === 3 && state.day >= 30 && state.renown >= 150;
}
export function recordLegacyContract(state, id) {
  const legacy = state.companyLegacy;
  if (legacy?.version!==3 && legacy?.stage === 3 && !legacy.contracts.includes(id) && legacy.contracts.length < 3) legacy.contracts.push(id);
}
export function recordLegacyVictory(state, battle) {
  const legacy = state.companyLegacy;
  if (legacy?.version===3 || legacy?.stage !== 4 || battle.status !== 'victory' || !['camp', 'band'].includes(battle.encounterType) || battle.difficulty < 2) return;
  const key = battle.id;
  if (!legacy.victories.includes(key) && legacy.victories.length < 3) legacy.victories.push(key);
}
export function validateLegacy(input, { getItem, isNamedItem, itemCondition, now }) {
  if (input === undefined) return undefined;
  if(input?.version===3)return validateEntombedLegacy(input,{getItem,itemCondition,now});
  const check = (ok, label) => { if (!ok) throw new TypeError(`Invalid company legacy: ${label}`); };
  const count = n => Number.isSafeInteger(n) && n >= 0;
  const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
  check(keys(input, ['version', 'generation', 'source', 'itemId', 'condition', 'stage', 'contracts', 'victories', ...(input?.version === 2 ? ['stash'] : [])]), 'fields');
  check([1,2].includes(input.version) && count(input.generation) && input.generation >= 1 && input.generation <= 1000000, 'version/generation');
  check(keys(input.source, ['seed', 'day', 'renown']) && count(input.source.seed) && input.source.seed <= 0xffffffff && count(input.source.day) && input.source.day >= 1 && input.source.day <= 1000000 && count(input.source.renown) && input.source.renown <= 1000000, 'source');
  check(typeof input.itemId === 'string' && input.itemId.length <= 16000, 'item identity');
  const item = getItem(input.itemId);
  check(item && isNamedItem(item) && ['weapon', 'armor', 'helmet', 'shield'].includes(item.slot), 'named heirloom');
  const maximum = itemCondition(input.itemId);
  check(maximum === null ? input.condition === null : count(input.condition) && input.condition <= maximum, 'condition');
  if(input.version===2){
    check(Array.isArray(input.stash)&&input.stash.length<=LEGACY_STASH_LIMIT,'stash size');
    for(const entry of input.stash){
      check(keys(entry,['itemId','condition'])&&typeof entry.itemId==='string'&&entry.itemId.length<=16000,'stash fields');
      check(LEGACY_STASH_SLOTS.includes(getItem(entry.itemId)?.slot),'stash item');
      const maximum=itemCondition(entry.itemId);
      check(maximum===null?entry.condition===null:count(entry.condition)&&entry.condition<=maximum,'stash condition');
    }
  }
  check(Number.isInteger(input.stage) && input.stage >= 1 && input.stage <= 5, 'stage');
  for (const key of ['contracts', 'victories']) check(Array.isArray(input[key]) && input[key].length <= 3 && new Set(input[key]).size === input[key].length && input[key].every(id => typeof id === 'string' && id.length > 0 && id.length <= 256), key);
  check(input.stage > 2 || input.contracts.length === 0, 'premature contracts');
  check(input.stage < 4 || input.contracts.length === 3, 'missing contracts');
  check(input.stage > 3 || input.victories.length === 0, 'premature victories');
  check(input.stage < 5 || input.victories.length === 3 && now >= 29 * 24, 'premature restoration');
  return structuredClone(input);
}

// Archive first. A failed active-save write also attempts to preserve the previous archive.
export function storeLegacyRetirement(storage, key, current, next) {
  const archiveKey=key+'-retired', currentText=JSON.stringify(current), nextText=JSON.stringify(next);
  const previous=storage.getItem(archiveKey);
  storage.setItem(archiveKey,currentText);
  try { storage.setItem(key,nextText); }
  catch(error) {
    try { if(previous===null)storage.removeItem(archiveKey);else storage.setItem(archiveKey,previous); } catch { /* The active save remains unchanged even if archive rollback fails. */ }
    throw error;
  }
}
