import { weaponTrainingVisual } from './perks.js';

export const COMBAT_SKILLS = Object.freeze({
  'quick-shot': { id: 'quick-shot', name: 'Quick Shot', ap: 4, description: 'A normal bow shot; leaves AP for another shot or movement.' },
  'aimed-shot': { id: 'aimed-shot', name: 'Aimed Shot', ap: 7, fatigue: 15, hitBonus: 15, rangeBonus: 1, description: 'Aim carefully: +15 hit chance and +1 range.' },
  shieldwall: { id: 'shieldwall', name: 'Shieldwall', ap: 4, fatigue: 20, description: 'Double the active shield defense until the next turn or a gear change.' },
  'knock-back': { id: 'knock-back', name: 'Knock Back', ap: 4, fatigue: 20, description: 'Push an adjacent enemy into a free hex; no damage. Cannot push through trees, fighters or cliffs.' },
});

export function equipmentSkills(item) {
  if (!item) return [];
  if (item.slot === 'shield') return [COMBAT_SKILLS.shieldwall, COMBAT_SKILLS['knock-back']];
  const visual = weaponTrainingVisual(item);
  return item.ranged && !item.throwing && visual.includes('bow') && !visual.includes('crossbow')
    ? [COMBAT_SKILLS['quick-shot'], COMBAT_SKILLS['aimed-shot']] : [];
}
