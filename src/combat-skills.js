import { weaponTrainingVisual } from './perks.js';

export const COMBAT_SKILLS = Object.freeze({
  'quick-shot': { id: 'quick-shot', name: 'Quick Shot', ap: 4, description: 'A normal bow shot; leaves AP for another shot or movement.' },
  'aimed-shot': { id: 'aimed-shot', name: 'Aimed Shot', ap: 7, fatigue: 15, hitBonus: 15, rangeBonus: 1, description: 'Aim carefully: +15 hit chance and +1 range.' },
  shieldwall: { id: 'shieldwall', name: 'Shieldwall', ap: 4, fatigue: 20, description: 'Double the active shield defense until the next turn or a gear change.' },
  'knock-back': { id: 'knock-back', name: 'Knock Back', ap: 4, fatigue: 20, description: 'Push an adjacent enemy into a free hex; no damage. Cannot push through trees, fighters or cliffs.' },
  spearwall: { id: 'spearwall', name: 'Spearwall', ap: 4, fatigue: 30, description: 'Brace a one-handed spear; a hit stops an entering enemy, and a miss ends the stance.' },
  riposte: { id: 'riposte', name: 'Riposte', ap: 4, fatigue: 25, description: 'Counter an adjacent melee attack that misses. Each counter costs 5 fatigue.' },
  split: { id: 'split', name: 'Split', ap: 6, fatigue: 25, description: 'Strike a target and the next hex behind it with a two-handed sword.' },
  swing: { id: 'swing', name: 'Swing', ap: 6, fatigue: 30, damageMultiplier: .8, description: 'Strike up to three adjacent hexes with a two-handed sword at 80% damage.' },
  'knock-out': { id: 'knock-out', name: 'Knock Out', ap: 4, fatigue: 25, description: 'A half-damage mace strike that stuns on a hit; two-handed maces cost 6 AP.' },
  puncture: { id: 'puncture', name: 'Puncture', ap: 4, fatigue: 20, hitBonus: -15, description: 'A body-only dagger thrust that bypasses armor without damaging it.' },
  deathblow: { id: 'deathblow', name: 'Deathblow', ap: 3, fatigue: 10, description: 'A Qatal strike that deals 50% more damage to a stunned target.' },
  'split-shield': { id: 'split-shield', name: 'Split Shield', ap: 4, fatigue: 18, description: 'An axe strike aimed at an active shield, dealing extra shield wear.' },
  'crush-armor': { id: 'crush-armor', name: 'Crush Armor', ap: 4, fatigue: 18, description: 'A hammer blow that deals 50% more armor damage.' },
  decapitate: { id: 'decapitate', name: 'Decapitate', ap: 4, fatigue: 18, description: 'A cleaver cut that deals 40% more damage to an injured target.' },
  'flail-headshot': { id: 'flail-headshot', name: 'Lash', ap: 4, fatigue: 18, hitBonus: -10, description: 'A flail strike that targets the head and bypasses an active shield at -10 hit chance.' },
  hook: { id: 'hook', name: 'Hook', ap: 6, fatigue: 20, description: 'A polearm strike that pulls its target into a free hex toward the attacker.' },
  'power-throw': { id: 'power-throw', name: 'Power Throw', ap: 4, fatigue: 18, description: 'A forceful throw that deals 25% more damage and spends one bundle charge.' },
  'piercing-bolt': { id: 'piercing-bolt', name: 'Piercing Bolt', ap: 3, fatigue: 16, description: 'A crossbow shot with 20 points more armor penetration; reload afterward.' },
  'whip-crack': { id: 'whip-crack', name: 'Whip Crack', ap: 4, fatigue: 16, hitBonus: -10, description: 'A long-range head strike that slips past an active shield at -10 hit chance.' },
  'stunning-stone': { id: 'stunning-stone', name: 'Stunning Stone', ap: 4, fatigue: 18, hitBonus: -10, description: 'A sling stone for half damage that stuns on a hit at -10 hit chance.' },
});

export function weaponSkillFamily(item) {
  if (!item || item.slot !== 'weapon') return null;
  const visual = weaponTrainingVisual(item) ?? '';
  if (item.throwing) return 'throwing';
  if (item.ranged) return visual.includes('crossbow') ? 'crossbow' : visual.includes('bow') ? 'bow'
    : visual.includes('sling') ? 'sling' : null;
  if (visual === 'qatal') return 'qatal';
  if (visual === 'dagger' || visual === 'fighting-knife') return 'dagger';
  if (visual === 'whip') return 'whip';
  if (!item.twoHanded && /spear/.test(visual)) return 'spear';
  if (visual.includes('flail')) return 'flail';
  if (visual.includes('hammer')) return 'hammer';
  if (visual.includes('mace') || visual === 'goedendag') return 'mace';
  if (/axe|bardiche/.test(visual)) return 'axe';
  if (visual.includes('cleaver') || visual === 'falx') return 'cleaver';
  if (/sword|shamshir|estoc/.test(visual)) return item.twoHanded ? 'two-handed-sword' : 'sword';
  if (item.range >= 2) return 'polearm';
  return null;
}

const FAMILY_SKILLS = Object.freeze({
  bow: ['quick-shot', 'aimed-shot'], crossbow: ['piercing-bolt'], spear: ['spearwall'], sword: ['riposte'],
  'two-handed-sword': ['split', 'swing'], mace: ['knock-out'], dagger: ['puncture'], qatal: ['deathblow'],
  axe: ['split-shield'], hammer: ['crush-armor'], cleaver: ['decapitate'], flail: ['flail-headshot'],
  polearm: ['hook'], throwing: ['power-throw'], whip: ['whip-crack'], sling: ['stunning-stone'],
});

export function equipmentSkills(item) {
  if (!item) return [];
  if (item.slot === 'shield') return [COMBAT_SKILLS.shieldwall, COMBAT_SKILLS['knock-back']];
  return (FAMILY_SKILLS[weaponSkillFamily(item)] ?? []).map(id => {
    const skill = COMBAT_SKILLS[id];
    return item.twoHanded && !item.ranged && skill.ap < 6
      ? { ...skill, ap: 6 } : skill;
  });
}
