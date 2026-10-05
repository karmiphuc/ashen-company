const PERK_CATEGORIES = {
  general: ['colossus', 'gifted', 'fast-adaptation', 'executioner', 'berserk', 'killing-frenzy', 'battle-flow', 'fearsome', 'duelist', 'opportunist'],
  weapon: ['backstabber', 'sword-training', 'axe-training', 'mace-training', 'spear-training', 'polearm-training', 'dagger-training', 'throwing-training', 'shield-strike'],
  defense: ['steel-brow', 'dodge', 'fortified-mind', 'shield-expert', 'brawny', 'layered-armor', 'shield-bearer', 'iron-jaw', 'battle-forged', 'nimble', 'reach-advantage', 'last-stand'],
  ranged: ['bullseye', 'anticipation', 'bow-mastery', 'crossbow-mastery', 'marksman', 'point-blank', 'volley-fire', 'reload-drill'],
  mobility: ['pathfinder', 'recover', 'fleet-footed', 'relentless', 'marathoner', 'high-ground', 'quick-hands', 'combat-bandaging'],
};
const CATEGORY_ICONS = { general: 'executioner', weapon: 'backstabber', defense: 'shield-expert', ranged: 'bullseye', mobility: 'pathfinder' };
const ORIGINAL_PERK_ICONS = new Set(['colossus', 'pathfinder', 'fast-adaptation', 'recover', 'bullseye', 'executioner', 'steel-brow', 'dodge', 'fortified-mind', 'shield-expert', 'backstabber', 'anticipation', 'brawny', 'bow-mastery', 'crossbow-mastery', 'berserk', 'killing-frenzy', 'fearsome']);

export const REMOVED_PERK_MIN_LEVEL = new Map([['student', 2], ['field-medic', 2], ['forager', 2], ['paymaster', 2], ['trailblazer', 3]]);

export const PERKS = Object.freeze([
  { id: 'colossus', name: 'Colossus', description: 'Gain 25% maximum health.', minLevel: 2 },
  { id: 'gifted', name: 'Gifted', description: 'Gain +3 melee and ranged skill and +2 melee and ranged defense.', minLevel: 2 },
  { id: 'pathfinder', name: 'Pathfinder', description: 'Reduce rough terrain and uphill movement costs by 1, to a minimum of 1.', minLevel: 2 },
  { id: 'fast-adaptation', name: 'Fast Adaptation', description: 'Gain +10 hit chance after each consecutive miss. The bonus resets on a hit.', minLevel: 2 },
  { id: 'recover', name: 'Recover', description: 'When catching your breath, recover at least 22 fatigue and otherwise halve current fatigue.', minLevel: 2 },
  { id: 'quick-hands', name: 'Quick Hands', description: 'The first weapon-set swap or pocket weapon draw or stow each round costs no AP. Continue fighting after switching.', minLevel: 2 },
  { id: 'combat-bandaging', name: 'Combat Bandaging', description: 'The first healing item used each round costs no AP. At half health or lower, heal before other actions, even in melee. The item is still consumed.', minLevel: 2 },
  { id: 'bullseye', name: 'Bullseye', description: 'Ignore ranged accuracy penalties from trees and brush. Height still applies.', minLevel: 3 },
  { id: 'executioner', name: 'Executioner', description: 'Deal 20% more damage to a target below full health.', minLevel: 3 },
  { id: 'steel-brow', name: 'Steel Brow', description: 'Head hits no longer deal extra health damage.', minLevel: 3 },
  { id: 'dodge', name: 'Dodge', description: 'Gain 15% of current initiative as melee and ranged defense.', minLevel: 3 },
  { id: 'fortified-mind', name: 'Fortified Mind', description: 'Gain 25% resolve and take 20% less morale damage.', minLevel: 3 },
  { id: 'shield-expert', name: 'Shield Expert', description: 'Gain 25% more melee and ranged defense from shields and halve shield durability wear.', minLevel: 4 },
  { id: 'backstabber', name: 'Backstabber', description: 'Gain +5 melee hit chance for each other ally adjacent to the target.', minLevel: 4 },
  { id: 'anticipation', name: 'Anticipation', description: 'Gain 10% of current ranged defense per tile of distance, with a minimum +10.', minLevel: 4 },
  { id: 'layered-armor', name: 'Layered Armor', description: 'Unlock a second armor attachment slot. Both attachments add protection and keep independent durability. Attachment fatigue is excluded from armor-weight perk checks.', minLevel: 4 },
  { id: 'brawny', name: 'Brawny', description: 'Reduce armor and helmet fatigue penalties by 30%. Attachments keep their full fatigue cost.', minLevel: 4 },
  { id: 'bow-mastery', name: 'Bow Mastery', description: 'Gain +1 range with bows and reduce their attack fatigue by 25%. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 5 },
  { id: 'crossbow-mastery', name: 'Crossbow Mastery', description: 'Crossbow attacks gain +20 percentage points of armor penetration and cost 25% less fatigue. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 5 },
  { id: 'berserk', name: 'Berserk', description: 'After a kill in a new battle, gain 4 AP for immediate actions, once per round. Old battles retain 2 AP.', minLevel: 7 },
  { id: 'killing-frenzy', name: 'Killing Frenzy', description: 'After a kill, deal 25% more damage through the next 2 rounds.', minLevel: 8 },
  { id: 'battle-flow', name: 'Battle Flow', description: 'Recover 10 fatigue after a kill.', minLevel: 5 },
  { id: 'fearsome', name: 'Fearsome', description: 'Health damage from a hit inflicts 10 additional morale damage.', minLevel: 8 },
  { id: 'sword-training', name: 'Sword Mastery', description: 'Gain +8 hit chance and spend 25% less attack fatigue with swords, cleavers, shamshirs, estocs, and falxes. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 2 },
  { id: 'axe-training', name: 'Axe Mastery', description: 'Axes and bardiches deal 15% more armor damage and spend 25% less attack fatigue. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 2 },
  { id: 'mace-training', name: 'Mace Mastery', description: 'Maces, hammers, flails, and goedendags deal 10% more health damage and spend 25% less attack fatigue. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 2 },
  { id: 'spear-training', name: 'Spear Mastery', description: 'Gain +8 hit chance and spend 25% less attack fatigue with melee spears and pikes. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 2 },
  { id: 'polearm-training', name: 'Polearm Mastery', description: 'Deal 10% more damage and spend 25% less attack fatigue with melee weapons that reach at least two hexes. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 3 },
  { id: 'dagger-training', name: 'Dagger Mastery', description: 'Daggers and fighting knives gain 15 percentage points of armor penetration and spend 25% less attack fatigue. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 3 },
  { id: 'throwing-training', name: 'Throwing Mastery', description: 'Gain +8 hit chance and spend 25% less attack fatigue with thrown weapons. Matching attacks and weapon skills cost 1 less AP in new weapon-skill battles.', minLevel: 3 },
  { id: 'shield-bearer', name: 'Shield Bearer', description: 'Gain +5 melee and ranged defense while using a shield.', minLevel: 2 },
  { id: 'shield-strike', name: 'Shield Strike', description: 'Deal 10% more melee damage while using a shield.', minLevel: 3 },
  { id: 'iron-jaw', name: 'Iron Jaw', description: 'Take 20% less health damage from every hit.', minLevel: 4 },
  { id: 'battle-forged', name: 'Battle Forged', description: 'Armor takes 15% less damage from hits.', minLevel: 5 },
  { id: 'nimble', name: 'Nimble', description: 'Gain +5 melee and ranged defense when armor and helmet fatigue total at most 15.', minLevel: 4 },
  { id: 'reach-advantage', name: 'Reach Advantage', description: 'Gain +5 melee defense while wielding a two-handed melee weapon.', minLevel: 4 },
  { id: 'duelist', name: 'Duelist', description: 'Deal 12% more melee damage with a one-handed weapon and an empty offhand or buckler.', minLevel: 4 },
  { id: 'opportunist', name: 'Opportunist', description: 'Deal 10% more melee damage to enemies without a shield.', minLevel: 4 },
  { id: 'last-stand', name: 'Last Stand', description: 'Gain +8 melee and ranged defense while at or below half health.', minLevel: 5 },
  { id: 'marksman', name: 'Marksman', description: 'Gain +8 hit chance with ranged attacks from at least three hexes away.', minLevel: 3 },
  { id: 'point-blank', name: 'Point Blank', description: 'Remove the 12-point hit penalty for shooting an adjacent enemy.', minLevel: 3 },
  { id: 'volley-fire', name: 'Volley Fire', description: 'Deal 10% more ranged damage from at least three hexes away.', minLevel: 4 },
  { id: 'reload-drill', name: 'Reload Drill', description: 'Recover 12 fatigue when spending a turn reloading.', minLevel: 3 },
  { id: 'fleet-footed', name: 'Fleet Footed', description: 'Gain one movement point when advancing toward a target if armor and helmet fatigue total at most 15.', minLevel: 3 },
  { id: 'relentless', name: 'Relentless', description: 'Halve equipment fatigue lost from initiative, excluding attachment weight, and combat fatigue lost from Dodge defense.', minLevel: 3 },
  { id: 'marathoner', name: 'Marathoner', description: 'Spend 2 fatigue per combat movement point instead of 3.', minLevel: 3 },
  { id: 'high-ground', name: 'High Ground', description: 'Gain +8 hit chance when attacking from a higher hex.', minLevel: 3 },
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
