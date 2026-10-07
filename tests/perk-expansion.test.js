import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, PERKS, createGame, getCompanyStats,
  getCampSites, startBattle, advanceBattle, validateSave,
} from '../src/engine.js';
import { COMBAT_SKILLS, equipmentSkills } from '../src/combat-skills.js';
import { hexDistance } from '../src/battle-terrain.js';

const added = [
  'sword-training', 'axe-training', 'mace-training', 'spear-training', 'polearm-training',
  'dagger-training', 'throwing-training', 'shield-bearer', 'shield-strike', 'iron-jaw',
  'battle-forged', 'nimble', 'duelist', 'opportunist', 'last-stand', 'marksman',
  'point-blank', 'volley-fire', 'reload-drill', 'fleet-footed', 'marathoner',
  'high-ground',
];

function battleWith(weapon, perks = [], distance = 1) {
  const state = createGame(251);
  const person = state.party[0];
  person.level = 20;
  person.perks = [...perks];
  person.equipment.weapon = weapon;
  if (ITEMS.find(item => item.id === weapon)?.twoHanded) person.equipment.shield = null;
  const site = getCampSites(state)[0];
  state.position = { x: site.x, y: site.y };
  assert.equal(startBattle(state, site.id).ok, true);
  const battle = state.battle;
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  const actor = battle.units.find(unit => unit.id === 'captain');
  const target = battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(actor, { q: 2, r: 2, meleeSkill: 200, rangedSkill: 200, morale: 50, fatigue: 0 });
  Object.assign(target, { q: 2 + distance, r: 2, hp: 300, maxHp: 300, bodyArmor: 0, headArmor: 0, meleeDefense: 0, rangedDefense: 0, morale: 80 });
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy' && unit.id !== 'enemy-1')) {
    enemy.hp = 0; enemy.alive = false;
  }
  battle.turnIndex = battle.turnOrder.indexOf(actor.id);
  battle.activeId = actor.id;
  battle.rng = 0;
  return { state, battle, actor, target };
}

function compareAttack({ weapon, perk, distance = 1, armored = false, shield = true, actorShield = true, targetPerk = false }) {
  const armed = battleWith(weapon, targetPerk ? [] : [perk], distance);
  const control = structuredClone(armed.state);
  const target = armed.target;
  if (armored) target.bodyArmor = target.headArmor = 100;
  if (!shield) target.equipment.shield = null;
  if (targetPerk) target.perks = [perk];
  const plainTarget = control.battle.units.find(unit => unit.id === target.id);
  plainTarget.bodyArmor = target.bodyArmor;
  plainTarget.headArmor = target.headArmor;
  plainTarget.equipment.shield = target.equipment.shield;
  const plainActor = control.battle.units.find(unit => unit.id === armed.actor.id);
  if (!actorShield) { armed.actor.equipment.shield = null; plainActor.equipment.shield = null; }
  if (!targetPerk) plainActor.perks = [];
  if (perk === 'dagger-training') {
    // Compare ordinary armor-piercing attacks; Puncture already bypasses all armor.
    for (const actor of [armed.actor, plainActor]) {
      actor.fatigue = actor.maxFatigue - 11;
      actor.turnStartedRound = armed.battle.round;
    }
  }
  advanceBattle(armed.state);
  advanceBattle(control);
  assert.equal(armed.battle.lastEvent.type, 'attack', perk);
  assert.equal(control.battle.lastEvent.type, 'attack', perk);
  return { perk: armed.battle.lastEvent, plain: control.battle.lastEvent, armed, control };
}

test('expanded perk catalog is unique, grouped, saveable, and uses bundled icon IDs', () => {
  assert.equal(added.length, 22);
  assert.equal(PERKS.length, 54);
  assert.ok(added.every(id => PERKS.some(perk => perk.id === id && perk.category && perk.icon)));
  const state = createGame(211);
  state.party[0].level = 20;
  state.party[0].perks = added.slice(0, 19);
  assert.deepEqual(validateSave(state), state);
  state.position = { x: 440, y: 520 };
  assert.equal(startBattle(state, 'quarry-camp').ok, true);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('weapon, shield, and range damage perks change deterministic attacks', () => {
  for (const [perk, weapon, options, field] of [
    ['axe-training', 'wood-axe', { armored: true }, 'armorDamage'],
    ['mace-training', 'bludgeon', {}, 'hpDamage'],
    ['polearm-training', 'billhook', { distance: 2 }, 'hpDamage'],
    ['dagger-training', 'rondel-dagger', { armored: true }, 'hpDamage'],
    ['shield-strike', 'arming-sword', {}, 'hpDamage'],
    ['duelist', 'arming-sword', { actorShield: false }, 'hpDamage'],
    ['opportunist', 'arming-sword', { shield: false }, 'hpDamage'],
    ['volley-fire', 'hunting-bow', { distance: 3 }, 'hpDamage'],
  ]) {
    const result = compareAttack({ perk, weapon, ...options });
    assert.ok(result.perk[field] > result.plain[field], perk);
  }
});

test('defensive perks reduce health or armor damage', () => {
  const iron = compareAttack({ perk: 'iron-jaw', weapon: 'arming-sword', targetPerk: true });
  assert.ok(iron.perk.hpDamage < iron.plain.hpDamage);
  const forged = compareAttack({ perk: 'battle-forged', weapon: 'arming-sword', armored: true, targetPerk: true });
  assert.ok(forged.perk.armorDamage < forged.plain.armorDamage);
});

test('light defense and shield perks have concrete passive effects', () => {
  const state = createGame(212);
  const person = state.party[0];
  person.level = 20;
  const base = getCompanyStats(person);
  person.perks = ['shield-bearer'];
  assert.equal(getCompanyStats(person).meleeDefense, base.meleeDefense + 5);
  person.equipment.armor = 'patched-coat';
  person.equipment.helmet = null;
  person.perks = ['nimble'];
  const lightBase = getCompanyStats({ ...person, perks: [] });
  assert.equal(getCompanyStats(person).rangedDefense, lightBase.rangedDefense + 5);
  person.equipment.armor = 'mail-shirt';
  assert.equal(getCompanyStats(person).rangedDefense, getCompanyStats({ ...person, perks: [] }).rangedDefense + 5,
    'Nimble includes armor with exactly 15 fatigue');
  person.equipment.helmet = 'cloth-hood';
  assert.equal(getCompanyStats(person).rangedDefense, getCompanyStats({ ...person, perks: [] }).rangedDefense,
    'Nimble stops above 15 fatigue');
});

test('Gifted and Relentless improve combat stats without changing level-up rolls', () => {
  const state = createGame(213);
  const person = state.party[0];
  person.level = 4;
  person.equipment.armor = 'mail-shirt';
  const baseline = getCompanyStats(person);
  person.perks = ['gifted', 'relentless'];
  const improved = getCompanyStats(person);
  assert.equal(improved.meleeSkill, baseline.meleeSkill + 3);
  assert.equal(improved.rangedSkill, baseline.rangedSkill + 3);
  assert.equal(improved.meleeDefense, baseline.meleeDefense + 2);
  assert.equal(improved.rangedDefense, baseline.rangedDefense + 2);
  assert.equal(improved.initiative, baseline.initiative + 10);
  assert.equal(person.attributes.meleeSkill, 0, 'Gifted does not add permanent training');
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('Reach Advantage follows the equipped two-handed melee weapon', () => {
  const state = createGame(214);
  const person = state.party[0];
  person.level = 4;
  person.equipment.weapon = 'greatsword';
  person.equipment.shield = null;
  person.perks = ['reach-advantage'];
  assert.equal(getCompanyStats(person).meleeDefense, getCompanyStats({ ...person, perks: [] }).meleeDefense + 5);
  person.equipment.weapon = 'hunting-bow';
  assert.equal(getCompanyStats(person).meleeDefense, getCompanyStats({ ...person, perks: [] }).meleeDefense);
  person.equipment.weapon = 'arming-sword';
  assert.equal(getCompanyStats(person).meleeDefense, getCompanyStats({ ...person, perks: [] }).meleeDefense);
});

test('Reach Advantage changes a real melee hit roll and stops after swapping weapons', () => {
  const fight = battleWith('arming-sword');
  fight.actor.meleeSkill = 35;
  Object.assign(fight.target, { meleeDefense: 0, morale: 50 });
  fight.target.equipment.weapon = 'greatsword';
  fight.target.equipment.shield = null;
  fight.target.perks = ['reach-advantage'];
  let selectedRoll = null;
  for (let roll = 0; roll < 500 && selectedRoll === null; roll++) {
    const protectedState = structuredClone(fight.state);
    const plainState = structuredClone(fight.state);
    protectedState.battle.rng = plainState.battle.rng = roll * 1000000;
    plainState.battle.units.find(unit => unit.id === fight.target.id).perks = [];
    advanceBattle(protectedState);
    advanceBattle(plainState);
    if (protectedState.battle.lastEvent.type === 'miss' && plainState.battle.lastEvent.type === 'attack') selectedRoll = roll;
  }
  assert.notEqual(selectedRoll, null);
  const swapped = structuredClone(fight.state);
  swapped.battle.rng = selectedRoll * 1000000;
  swapped.battle.units.find(unit => unit.id === fight.target.id).equipment.weapon = 'arming-sword';
  advanceBattle(swapped);
  assert.equal(swapped.battle.lastEvent.type, 'attack');
});

test('Relentless preserves Dodge defense as combat fatigue rises', () => {
  const fight = battleWith('arming-sword');
  fight.actor.meleeSkill = 35;
  Object.assign(fight.target, { meleeDefense: 0, morale: 50, initiative: 100, fatigue: 80, maxFatigue: 100 });
  fight.target.perks = ['dodge', 'relentless'];
  let changed = false;
  for (let roll = 0; roll < 1000 && !changed; roll++) {
    const relentless = structuredClone(fight.state);
    const plain = structuredClone(fight.state);
    relentless.battle.rng = plain.battle.rng = roll * 1000000;
    plain.battle.units.find(unit => unit.id === fight.target.id).perks = ['dodge'];
    advanceBattle(relentless);
    advanceBattle(plain);
    changed = relentless.battle.lastEvent.type === 'miss' && plain.battle.lastEvent.type === 'attack';
  }
  assert.equal(changed, true);
});

test('Relentless keeps exact initiative across shield and weapon set swaps', () => {
  for (const [seed, armor, perks] of [
    [215, 'quilted-jack', ['relentless']],
    [216, 'padded-gambeson', ['relentless', 'brawny']],
  ]) {
    const state = createGame(seed);
    const person = state.party[0];
    person.level = 4;
    person.perks = perks;
    person.equipment = { ...person.equipment, armor, helmet: null, weapon: 'javelins', shield: 'buckler' };
    person.reserveEquipment = { weapon: 'arming-sword', shield: 'round-shield' };
    person.armorDurability.body = ITEMS.find(item => item.id === armor).armor;
    person.armorDurability.head = 0;
    const firstInitiative = getCompanyStats(person).initiative;
    const secondInitiative = getCompanyStats({ ...person, equipment: { ...person.equipment, weapon: 'arming-sword', shield: 'round-shield' } }).initiative;
    assert.equal(firstInitiative - secondInitiative, 1, `${armor} changes the rounding of a 3-fatigue swap`);
    assert.deepEqual(validateSave(state), state);

    const site = getCampSites(state)[0];
    state.position = { x: site.x, y: site.y };
    assert.equal(startBattle(state, site.id).ok, true);
    const battle = state.battle;
    const actor = battle.units.find(unit => unit.id === person.id);
    const enemies = battle.units.filter(unit => unit.side === 'enemy');
    Object.assign(actor, { q: 2, r: 2 });
    enemies.forEach((enemy, index) => Object.assign(enemy, { q: 3 + index, r: 2 }));
    battle.turnIndex = battle.turnOrder.indexOf(actor.id);
    battle.activeId = actor.id;
    assert.equal(actor.initiative, firstInitiative);
    assert.equal(advanceBattle(state).ok, true);
    assert.equal(battle.lastEvent.type, 'swap');
    assert.equal(actor.initiative, secondInitiative);

    enemies.forEach((enemy, index) => Object.assign(enemy, { q: 8 + index, r: 2 }));
    battle.turnIndex = battle.turnOrder.indexOf(actor.id);
    battle.activeId = actor.id;
    assert.equal(advanceBattle(state).ok, true);
    assert.equal(battle.lastEvent.type, 'swap');
    assert.equal(actor.initiative, firstInitiative, 'returning to the first set adds no extra initiative');
  }
});

test('movement perks increase reach or reduce movement fatigue', () => {
  const base = battleWith('arming-sword', [], 7);
  base.actor.equipment.armor = 'mail-shirt';
  base.actor.equipment.helmet = null;
  base.actor.q = 2;
  base.actor.r = 2;
  const origin = { q: 2, r: 2 };
  const fleet = structuredClone(base.state);
  fleet.battle.units.find(unit => unit.id === 'captain').perks = ['fleet-footed'];
  fleet.battle.units.find(unit => unit.id === 'captain').movementCredit = 2;
  advanceBattle(base.state);
  advanceBattle(fleet);
  const walker = base.battle.units.find(unit => unit.id === 'captain');
  const runner = fleet.battle.units.find(unit => unit.id === 'captain');
  assert.equal(runner.ap, walker.ap + 2, 'Fleet Footed saves 2 movement AP on the first step');
  for (const state of [base.state, fleet]) {
    for (let action = 0; action < 20 && state.battle.activeId === 'captain'; action++) advanceBattle(state);
  }
  assert.ok(hexDistance(origin, runner) > hexDistance(origin, walker));
  assert.equal(hexDistance(origin, runner), 5, 'Fleet Footed adds a fifth open-ground step at 15 armor fatigue');
  const marathon = battleWith('arming-sword', ['marathoner'], 5);
  marathon.actor.equipment.armor = 'patched-coat';
  marathon.actor.equipment.helmet = null;
  const plain = structuredClone(marathon.state);
  plain.battle.units.find(unit => unit.id === 'captain').perks = [];
  advanceBattle(marathon.state);
  advanceBattle(plain);
  assert.ok(marathon.actor.fatigue < plain.battle.units.find(unit => unit.id === 'captain').fatigue);
});

test('Battle Flow refunds fatigue only when an attack kills', () => {
  const fight = battleWith('arming-sword', ['battle-flow']);
  fight.target.hp = 1;
  const plain = structuredClone(fight.state);
  plain.battle.units.find(unit => unit.id === 'captain').perks = [];
  advanceBattle(fight.state);
  advanceBattle(plain);
  assert.equal(fight.battle.lastEvent.fallen, true);
  assert.equal(plain.battle.units.find(unit => unit.id === 'captain').fatigue - fight.actor.fatigue, 10);
  assert.match(fight.battle.lastEvent.message, /Battle Flow: -10 fatigue/);
  assert.deepEqual(fight.battle.lastEvent.effects,[{id:'battle-flow',amount:10}]);

  const surviving = battleWith('arming-sword', ['battle-flow']);
  advanceBattle(surviving.state);
  assert.equal(surviving.battle.lastEvent.fallen, false);
  assert.equal(surviving.battle.lastEvent.effects,undefined);
  assert.equal(surviving.actor.fatigue, 11);
});

test('reload drill restores fatigue on the automatic reload turn', () => {
  const drilled = battleWith('light-crossbow', ['reload-drill'], 5);
  drilled.actor.reload = 1;
  drilled.actor.fatigue = 40;
  const plain = structuredClone(drilled.state);
  plain.battle.units.find(unit => unit.id === 'captain').perks = [];
  advanceBattle(drilled.state);
  advanceBattle(plain);
  assert.equal(plain.battle.units.find(unit => unit.id === 'captain').fatigue - drilled.actor.fatigue, 12);
});

test('accuracy perks and last stand change hit outcomes at the same roll', () => {
  const conditions = [
    { perk: 'sword-training', weapon: 'arming-sword', distance: 1 },
    { perk: 'sword-training', weapon: 'falchion', distance: 1 },
    { perk: 'sword-training', weapon: 'northern-warcleaver', distance: 1 },
    { perk: 'spear-training', weapon: 'spear', distance: 1 },
    { perk: 'spear-training', weapon: 'northern-broadhead-spear', distance: 1 },
    { perk: 'throwing-training', weapon: 'javelins', distance: 3 },
    { perk: 'marksman', weapon: 'hunting-bow', distance: 3 },
    { perk: 'point-blank', weapon: 'hunting-bow', distance: 1, setup: fight => {
      Object.assign(fight.actor, { q: 0, r: 0 });
      Object.assign(fight.target, { q: 1, r: 0 });
      Object.assign(fight.battle.units.find(unit => unit.id === 'scout'), { q: 0, r: 1 });
    } },
    { perk: 'high-ground', weapon: 'arming-sword', distance: 1, setup: fight => { fight.battle.field.tiles.find(tile => tile.q === fight.actor.q && tile.r === fight.actor.r).height = 1; } },
    { perk: 'last-stand', weapon: 'arming-sword', distance: 1, targetPerk: true, setup: fight => { fight.target.hp = 150; } },
  ];
  for (const condition of conditions) {
    const fight = battleWith(condition.weapon, condition.targetPerk ? [] : [condition.perk], condition.distance);
    fight.actor.meleeSkill = fight.actor.rangedSkill = 25;
    condition.setup?.(fight);
    if (condition.targetPerk) fight.target.perks = [condition.perk];
    let changed = false;
    for (let roll = 0; roll < 500 && !changed; roll++) {
      const skilled = structuredClone(fight.state);
      const plain = structuredClone(fight.state);
      skilled.battle.rng = plain.battle.rng = roll * 1000000;
      if (condition.targetPerk) plain.battle.units.find(unit => unit.id === 'enemy-1').perks = [];
      else plain.battle.units.find(unit => unit.id === 'captain').perks = [];
      advanceBattle(skilled);
      advanceBattle(plain);
      changed = condition.targetPerk
        ? skilled.battle.lastEvent.type === 'miss' && plain.battle.lastEvent.type === 'attack'
        : skilled.battle.lastEvent.type === 'attack' && plain.battle.lastEvent.type === 'miss';
    }
    assert.equal(changed, true, condition.perk);
  }
});

test('northern melee weapons inherit training families while slings remain separate from bows', () => {
  for (const [perk, weapon, field, armored] of [
    ['axe-training', 'northern-serrated-axe', 'armorDamage', true],
    ['mace-training', 'northern-crude-club', 'hpDamage', false],
    ['mace-training', 'northern-heavy-flail', 'hpDamage', false],
  ]) {
    const result = compareAttack({ perk, weapon, armored });
    assert.ok(result.perk[field] > result.plain[field], weapon);
  }
  const slinger = battleWith('northern-sling', ['bow-mastery'], 3);
  Object.assign(slinger.battle.units.find(unit => unit.id === 'scout'), { q: 0, r: 0 });
  Object.assign(slinger.battle.units.find(unit => unit.id === 'guard'), { q: 0, r: 1 });
  const plain = structuredClone(slinger.state);
  plain.battle.units.find(unit => unit.id === 'captain').perks = [];
  advanceBattle(slinger.state);
  advanceBattle(plain);
  assert.equal(slinger.battle.lastEvent.projectile, 'stone');
  assert.equal(slinger.actor.fatigue, plain.battle.units.find(unit => unit.id === 'captain').fatigue);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(slinger.state))), slinger.state);
});

test('each weapon mastery reduces attack fatigue once, including northern weapons', () => {
  for (const [perk, weapon, distance] of [
    ['sword-training', 'northern-warcleaver', 1],
    ['axe-training', 'northern-serrated-axe', 1],
    ['mace-training', 'northern-heavy-flail', 1],
    ['spear-training', 'northern-broadhead-spear', 1],
    ['polearm-training', 'longaxe', 2],
    ['dagger-training', 'rondel-dagger', 1],
    ['throwing-training', 'javelins', 3],
  ]) {
    const mastered = battleWith(weapon, [perk], distance);
    const plain = structuredClone(mastered.state);
    plain.battle.units.find(unit => unit.id === 'captain').perks = [];
    advanceBattle(mastered.state);
    advanceBattle(plain);
    assert.equal(mastered.battle.lastEvent.type, 'attack', weapon);
    const item = ITEMS.find(entry => entry.id === weapon);
    const fatigueFor = event => equipmentSkills(item).find(skill => skill.name === event.skillName)?.fatigue
      ?? item.fatigueCost ?? (item.ranged ? 9 : 11);
    assert.equal(mastered.actor.fatigue, Math.ceil(fatigueFor(mastered.battle.lastEvent) * .75), weapon);
    assert.equal(plain.battle.units.find(unit => unit.id === 'captain').fatigue, fatigueFor(plain.battle.lastEvent), weapon);
  }

  const overlapping = battleWith('longaxe', ['axe-training', 'polearm-training'], 2);
  advanceBattle(overlapping.state);
  assert.equal(overlapping.actor.fatigue, Math.ceil(equipmentSkills(ITEMS.find(item => item.id === 'longaxe'))[0].fatigue * .75));
});

test('AI uses reduced attack cost when deciding whether to recover', () => {
  const mastered = battleWith('arming-sword', ['sword-training']);
  mastered.actor.fatigue = mastered.actor.maxFatigue - 10;
  mastered.actor.turnStartedRound = mastered.battle.round;
  const plain = structuredClone(mastered.state);
  plain.battle.units.find(unit => unit.id === 'captain').perks = [];
  advanceBattle(mastered.state);
  advanceBattle(plain);
  assert.equal(mastered.battle.lastEvent.type, 'attack');
  assert.equal(plain.battle.lastEvent.type, 'recover');
});
