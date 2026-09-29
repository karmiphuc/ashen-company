const PERK_CATEGORIES = {
  general: ['colossus', 'fast-adaptation', 'executioner', 'berserk', 'killing-frenzy', 'fearsome', 'duelist', 'opportunist'],
  weapon: ['backstabber', 'sword-training', 'axe-training', 'mace-training', 'spear-training', 'polearm-training', 'dagger-training', 'throwing-training', 'shield-strike'],
  defense: ['steel-brow', 'dodge', 'fortified-mind', 'shield-expert', 'brawny', 'shield-bearer', 'iron-jaw', 'battle-forged', 'nimble', 'last-stand'],
  ranged: ['bullseye', 'anticipation', 'bow-mastery', 'crossbow-mastery', 'marksman', 'point-blank', 'volley-fire', 'reload-drill'],
  mobility: ['pathfinder', 'fleet-footed', 'marathoner', 'high-ground'],
  support: ['student', 'recover', 'field-medic', 'forager', 'paymaster', 'trailblazer'],
};
const CATEGORY_ICONS = { general: 'executioner', weapon: 'backstabber', defense: 'shield-expert', ranged: 'bullseye', mobility: 'pathfinder', support: 'recover' };
const ORIGINAL_PERK_ICONS = new Set(['colossus', 'student', 'pathfinder', 'fast-adaptation', 'recover', 'bullseye', 'executioner', 'steel-brow', 'dodge', 'fortified-mind', 'shield-expert', 'backstabber', 'anticipation', 'brawny', 'bow-mastery', 'crossbow-mastery', 'berserk', 'killing-frenzy', 'fearsome']);

export const PERKS = Object.freeze([
  { id: 'colossus', name: 'Colossus', description: 'Gain 25% maximum health.', minLevel: 2 },
  { id: 'student', name: 'Student', description: 'Gain 20% more experience from battle.', minLevel: 2 },
  { id: 'pathfinder', name: 'Pathfinder', description: 'Reduce rough terrain and uphill movement costs by 1, to a minimum of 1.', minLevel: 2 },
  { id: 'fast-adaptation', name: 'Fast Adaptation', description: 'Gain +10 hit chance after each consecutive miss. The bonus resets on a hit.', minLevel: 2 },
  { id: 'recover', name: 'Recover', description: 'When catching your breath, recover at least 22 fatigue and otherwise halve current fatigue.', minLevel: 2 },
  { id: 'bullseye', name: 'Bullseye', description: 'Ignore ranged accuracy penalties from trees and brush. Height still applies.', minLevel: 3 },
  { id: 'executioner', name: 'Executioner', description: 'Deal 20% more damage to a target below full health.', minLevel: 3 },
  { id: 'steel-brow', name: 'Steel Brow', description: 'Head hits no longer deal extra health damage.', minLevel: 3 },
  { id: 'dodge', name: 'Dodge', description: 'Gain 15% of current initiative as melee and ranged defense.', minLevel: 3 },
  { id: 'fortified-mind', name: 'Fortified Mind', description: 'Gain 25% resolve and take 20% less morale damage.', minLevel: 3 },
  { id: 'shield-expert', name: 'Shield Expert', description: 'Gain 25% more melee and ranged defense from shields.', minLevel: 4 },
  { id: 'backstabber', name: 'Backstabber', description: 'Gain +5 melee hit chance for each other ally adjacent to the target.', minLevel: 4 },
  { id: 'anticipation', name: 'Anticipation', description: 'Gain 10% of base ranged defense per tile of distance, with a minimum +10.', minLevel: 4 },
  { id: 'brawny', name: 'Brawny', description: 'Reduce armor and helmet fatigue penalties by 30%.', minLevel: 4 },
  { id: 'bow-mastery', name: 'Bow Mastery', description: 'Gain +1 range with bows and reduce their attack fatigue by 25%.', minLevel: 5 },
  { id: 'crossbow-mastery', name: 'Crossbow Mastery', description: 'Crossbow attacks gain +20 percentage points of armor penetration and cost 25% less fatigue.', minLevel: 5 },
  { id: 'berserk', name: 'Berserk', description: 'After a kill, gain 2 AP for one immediate bonus action, once per round.', minLevel: 7 },
  { id: 'killing-frenzy', name: 'Killing Frenzy', description: 'After a kill, deal 25% more damage through the next 2 rounds.', minLevel: 8 },
  { id: 'fearsome', name: 'Fearsome', description: 'Health damage from a hit inflicts 10 additional morale damage.', minLevel: 8 },
  { id: 'sword-training', name: 'Sword Training', description: 'Gain +8 hit chance with swords, cleavers, shamshirs, estocs, and falxes.', minLevel: 2 },
  { id: 'axe-training', name: 'Axe Training', description: 'Axes and bardiches deal 15% more armor damage.', minLevel: 2 },
  { id: 'mace-training', name: 'Mace Training', description: 'Maces, hammers, flails, and goedendags deal 10% more health damage.', minLevel: 2 },
  { id: 'spear-training', name: 'Spear Training', description: 'Gain +8 hit chance with melee spears and pikes.', minLevel: 2 },
  { id: 'polearm-training', name: 'Polearm Training', description: 'Deal 10% more damage with melee weapons that reach at least two hexes.', minLevel: 3 },
  { id: 'dagger-training', name: 'Dagger Training', description: 'Daggers and fighting knives gain 15 percentage points of armor penetration.', minLevel: 3 },
  { id: 'throwing-training', name: 'Throwing Training', description: 'Gain +8 hit chance with thrown weapons.', minLevel: 3 },
  { id: 'shield-bearer', name: 'Shield Bearer', description: 'Gain +5 melee and ranged defense while using a shield.', minLevel: 2 },
  { id: 'shield-strike', name: 'Shield Strike', description: 'Deal 10% more melee damage while using a shield.', minLevel: 3 },
  { id: 'iron-jaw', name: 'Iron Jaw', description: 'Take 20% less health damage from every hit.', minLevel: 4 },
  { id: 'battle-forged', name: 'Battle Forged', description: 'Armor takes 15% less damage from hits.', minLevel: 5 },
  { id: 'nimble', name: 'Nimble', description: 'Gain +5 melee and ranged defense when armor and helmet fatigue total at most 10.', minLevel: 4 },
  { id: 'duelist', name: 'Duelist', description: 'Deal 12% more melee damage with a one-handed weapon and no shield.', minLevel: 4 },
  { id: 'opportunist', name: 'Opportunist', description: 'Deal 10% more melee damage to enemies without a shield.', minLevel: 4 },
  { id: 'last-stand', name: 'Last Stand', description: 'Gain +8 melee and ranged defense while at or below half health.', minLevel: 5 },
  { id: 'marksman', name: 'Marksman', description: 'Gain +8 hit chance with ranged attacks from at least three hexes away.', minLevel: 3 },
  { id: 'point-blank', name: 'Point Blank', description: 'Remove the 12-point hit penalty for shooting an adjacent enemy.', minLevel: 3 },
  { id: 'volley-fire', name: 'Volley Fire', description: 'Deal 10% more ranged damage from at least three hexes away.', minLevel: 4 },
  { id: 'reload-drill', name: 'Reload Drill', description: 'Recover 12 fatigue when spending a turn reloading.', minLevel: 3 },
  { id: 'fleet-footed', name: 'Fleet Footed', description: 'Gain one movement point when advancing toward a target if armor and helmet fatigue total at most 10.', minLevel: 3 },
  { id: 'marathoner', name: 'Marathoner', description: 'Spend 2 fatigue per combat movement point instead of 3.', minLevel: 3 },
  { id: 'high-ground', name: 'High Ground', description: 'Gain +8 hit chance when attacking from a higher hex.', minLevel: 3 },
  { id: 'field-medic', name: 'Field Medic', description: 'This member recovers 8 extra health when camping.', minLevel: 2 },
  { id: 'forager', name: 'Forager', description: 'Find 2 extra provisions when the company forages.', minLevel: 2 },
  { id: 'paymaster', name: 'Paymaster', description: 'Reduce this member\'s daily wage by 1 crown, to a minimum of 1.', minLevel: 2 },
  { id: 'trailblazer', name: 'Trailblazer', description: 'Increase company travel speed by 5% while this member lives.', minLevel: 3 },
].map(perk => {
  const category = Object.entries(PERK_CATEGORIES).find(([, ids]) => ids.includes(perk.id))?.[0];
  if (!category) throw new Error(`Missing perk category: ${perk.id}`);
  return Object.freeze({ ...perk, category, icon: ORIGINAL_PERK_ICONS.has(perk.id) ? perk.id : CATEGORY_ICONS[category] });
}));

export const PERK_BY_ID = new Map(PERKS.map(perk => [perk.id, perk]));

export function hasPerk(person, perkId) {
  return person?.perks?.includes(perkId) ?? false;
}

export function weaponTrainingVisual(weapon) {
  return weapon?.trainingVisual ?? weapon?.visual;
}
