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
].map(perk => Object.freeze(perk)));

export const PERK_BY_ID = new Map(PERKS.map(perk => [perk.id, perk]));

export function hasPerk(person, perkId) {
  return person?.perks?.includes(perkId) ?? false;
}
