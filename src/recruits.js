const freezeEntry = entry => Object.freeze({ ...entry, bonuses: Object.freeze({ ...entry.bonuses }) });

export const RECRUIT_BACKGROUNDS = Object.freeze([
  freezeEntry({ id: 'wayfarer', name: 'Wayfarer', role: 'support', cost: 120, description: 'Years on the road made this traveler quick and hard to tire.', bonuses: { initiative: 4, maxFatigue: 2 } }),
  freezeEntry({ id: 'farmhand', name: 'Farmhand', role: 'frontline', cost: 130, description: 'Field work built a sturdy frame and lasting endurance.', bonuses: { maxHp: 6, maxFatigue: 4 } }),
  freezeEntry({ id: 'sailor', name: 'Sailor', role: 'support', cost: 140, description: 'A steady stance learned on wet decks helps in a close fight.', bonuses: { meleeDefense: 2, maxFatigue: 3 } }),
  freezeEntry({ id: 'tinker', name: 'Tinker', role: 'ranged', cost: 140, description: 'Patient hands and a sharp eye suit careful ranged work.', bonuses: { rangedDefense: 2, rangedSkill: 3 } }),
  freezeEntry({ id: 'pilgrim', name: 'Pilgrim', role: 'support', cost: 130, description: 'Long journeys made this wanderer resilient and watchful.', bonuses: { maxHp: 5, rangedDefense: 2 } }),
  freezeEntry({ id: 'deserter', name: 'Deserter', role: 'frontline', cost: 150, description: 'Hard drill remains useful, even after leaving the banner behind.', bonuses: { meleeSkill: 4, initiative: 2 } }),
  freezeEntry({ id: 'caravan-guard', name: 'Caravan Guard', role: 'frontline', cost: 180, description: 'Roadside skirmishes taught a practical mix of grit and guard work.', bonuses: { meleeSkill: 4, meleeDefense: 2, maxHp: 3 } }),
  freezeEntry({ id: 'hunter', name: 'Hunter', role: 'ranged', cost: 180, description: 'A practiced shot who knows how to act before prey bolts.', bonuses: { rangedSkill: 8, initiative: 3 } }),
  freezeEntry({ id: 'outrider', name: 'Outrider', role: 'ranged', cost: 180, description: 'Scouting ahead rewards speed, awareness, and stamina.', bonuses: { rangedSkill: 5, initiative: 5, maxFatigue: 2 } }),
  freezeEntry({ id: 'brawler', name: 'Brawler', role: 'frontline', cost: 150, description: 'Tavern scraps left this fighter tough and comfortable up close.', bonuses: { meleeSkill: 4, maxHp: 4 } }),
  freezeEntry({ id: 'elf-wanderer', name: 'Elf Wanderer', role: 'ranged', cost: 320, appearanceId: 'elf', description: 'An elven archer whose long practice lends a patient eye and nimble footing.', bonuses: { rangedSkill: 8, initiative: 5, rangedDefense: 2 } }),
  freezeEntry({ id: 'half-orc-mercenary', name: 'Half-Orc Mercenary', role: 'frontline', cost: 340, appearanceId: 'half-orc', description: 'A half-orc mercenary who endures hard blows and longer marches.', bonuses: { maxHp: 9, maxFatigue: 5, meleeSkill: 1 } }),
  freezeEntry({ id: 'dwarf-guard', name: 'Dwarf Guard', role: 'frontline', cost: 360, appearanceId: 'dwarf', description: 'A dwarf veteran drilled to hold the line with a steady shield and stout resolve.', bonuses: { maxHp: 7, resolve: 5, meleeDefense: 3 } }),
  freezeEntry({ id: 'goblin-scout', name: 'Goblin Scout', role: 'ranged', cost: 240, appearanceId: 'goblin', description: 'A goblin scout whose nimble escapes and quick shots keep danger at a distance.', bonuses: { rangedSkill: 4, initiative: 6, rangedDefense: 3 } }),
  freezeEntry({ id: 'samurai', name: 'Samurai', role: 'frontline', cost: 420, appearanceId: 'samurai', description: 'Formal blade and guard training makes this fighter accurate, guarded, and ready.', bonuses: { meleeSkill: 8, meleeDefense: 4, initiative: 3 } }),
  freezeEntry({ id: 'ronin', name: 'Ronin', role: 'frontline', cost: 350, description: 'Years of duels on the road taught quick, accurate strikes with a lighter guard.', bonuses: { meleeSkill: 6, initiative: 7, meleeDefense: 1 } }),
  freezeEntry({ id: 'ninja', name: 'Ninja', role: 'ranged', cost: 390, appearanceId: 'ninja', description: 'Stealth and skirmish training favor quick ranged strikes and evasive movement.', bonuses: { rangedSkill: 6, initiative: 7, rangedDefense: 3 } }),
  freezeEntry({ id: 'warrior-monk', name: 'Warrior Monk', role: 'support', cost: 300, description: 'Disciplined practice builds calm resolve, endurance, and a steady stance.', bonuses: { resolve: 7, maxFatigue: 6, meleeDefense: 1 } }),
]);

export const RECRUIT_TRAITS = Object.freeze([
  freezeEntry({ id: 'tough', name: 'Tough', kind: 'positive', description: 'Takes a little more punishment before going down.', bonuses: { maxHp: 5 } }),
  freezeEntry({ id: 'strong', name: 'Strong', kind: 'positive', description: 'Carries effort well during a long fight.', bonuses: { maxFatigue: 4 } }),
  freezeEntry({ id: 'dexterous', name: 'Dexterous', kind: 'positive', description: 'Quick hands make close attacks a little more reliable.', bonuses: { meleeSkill: 3 } }),
  freezeEntry({ id: 'eagle-eyed', name: 'Eagle Eyes', kind: 'positive', description: 'Picks out distant openings more easily.', bonuses: { rangedSkill: 3 } }),
  freezeEntry({ id: 'quick', name: 'Quick', kind: 'positive', description: 'Usually gets moving before the fight settles.', bonuses: { initiative: 4 } }),
  freezeEntry({ id: 'sure-footed', name: 'Sure-Footed', kind: 'positive', description: 'Keeps a sound stance when blows come close.', bonuses: { meleeDefense: 2 } }),
  freezeEntry({ id: 'hulking', name: 'Hulking', kind: 'tradeoff', description: 'Harder to bring down, but slower to get moving.', bonuses: { maxHp: 4, initiative: -4 } }),
  freezeEntry({ id: 'cautious', name: 'Cautious', kind: 'tradeoff', description: 'Guards carefully, at the cost of some attacking confidence.', bonuses: { meleeDefense: 2, meleeSkill: -2 } }),
  freezeEntry({ id: 'aggressive', name: 'Aggressive', kind: 'tradeoff', description: 'Presses attacks eagerly and leaves a few openings.', bonuses: { meleeSkill: 2, meleeDefense: -2 } }),
  freezeEntry({ id: 'stocky', name: 'Stocky', kind: 'tradeoff', description: 'Has extra staying power, but moves a little later.', bonuses: { maxFatigue: 4, initiative: -4 } }),
  freezeEntry({ id: 'lean', name: 'Lean', kind: 'tradeoff', description: 'Acts quickly, though with a little less staying power.', bonuses: { initiative: 4, maxHp: -4 } }),
  freezeEntry({ id: 'impatient', name: 'Impatient', kind: 'tradeoff', description: 'Acts sooner, but rushes careful ranged attacks.', bonuses: { initiative: 3, rangedSkill: -3 } }),
]);

export const RECRUIT_BACKGROUND_BY_ID = new Map(RECRUIT_BACKGROUNDS.map(entry => [entry.id, entry]));
export const RECRUIT_TRAIT_BY_ID = new Map(RECRUIT_TRAITS.map(entry => [entry.id, entry]));

const NAMES = Object.freeze([
  'Elsi Rowan', 'Garrick Vale', 'Nessa Flint', 'Odo Fen', 'Iris Blackwell', 'Hugo Reed',
  'Ada Pike', 'Kellan Moss', 'Sera Wren', 'Milo Hart', 'Tamsin Crow', 'Rolf Mercer',
  'Petra Dain', 'Jonas Vey', 'Lina Marsh', 'Corin Ash', 'Freya Dunn', 'Emil Rook',
]);
const ROLE_BACKGROUNDS = Object.freeze({
  frontline: Object.freeze(['farmhand', 'deserter', 'caravan-guard', 'brawler']),
  ranged: Object.freeze(['tinker', 'hunter', 'outrider']),
  support: Object.freeze(['wayfarer', 'sailor', 'pilgrim']),
});
const ROLES = Object.freeze(['frontline', 'ranged', 'support']);
const SPECIAL_BACKGROUNDS = RECRUIT_BACKGROUNDS.filter(background => background.cost >= 220);
const POSITIVE_TRAITS = RECRUIT_TRAITS.filter(trait => trait.kind === 'positive');
const TRADEOFF_TRAITS = RECRUIT_TRAITS.filter(trait => trait.kind === 'tradeoff');

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function mixSeed(value) {
  let hash = hashSeed(value);
  hash = Math.imul(hash ^ hash >>> 16, 0x7feb352d);
  hash = Math.imul(hash ^ hash >>> 15, 0x846ca68b);
  return (hash ^ hash >>> 16) >>> 0;
}

function directlyCancels(positive, tradeoff) {
  return Object.entries(positive.bonuses).some(([stat, value]) => value > 0 && (tradeoff.bonuses[stat] ?? 0) < 0);
}

export function makeRecruitProfile(seed, townId, day, slot) {
  const base = hashSeed(`${seed}:${townId}:${day}:recruit`);
  const role = ROLES[(slot + base) % ROLES.length];
  const choices = ROLE_BACKGROUNDS[role];
  const specialSlot = mixSeed(`${base}:special-chance`) % 6 === 0
    ? mixSeed(`${base}:special-slot`) % 3 : -1;
  const specialChoices = SPECIAL_BACKGROUNDS.filter(background => background.role === role);
  const backgroundId = slot === specialSlot
    ? specialChoices[mixSeed(`${base}:special-background`) % specialChoices.length].id
    : choices[hashSeed(`${base}:${slot}:background`) % choices.length];
  const positive = POSITIVE_TRAITS[hashSeed(`${base}:${slot}:positive`) % POSITIVE_TRAITS.length];
  const traits = [positive.id];
  if (hashSeed(`${base}:${slot}:tradeoff-chance`) % 2 === 0) {
    const compatible = TRADEOFF_TRAITS.filter(trait => !directlyCancels(positive, trait));
    traits.push(compatible[hashSeed(`${base}:${slot}:tradeoff`) % compatible.length].id);
  }
  return Object.freeze({
    offerId: `hire:${townId}:${day}:${slot}`,
    name: NAMES[(base + slot * 7) % NAMES.length],
    backgroundId,
    traitIds: Object.freeze(traits),
    personSeed: hashSeed(`${base}:${slot}:person`),
  });
}
