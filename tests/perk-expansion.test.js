import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, PERKS, createGame, getCompanyStats, getCompanyTravelBonus, getDailyFood,
  getCampSites, startBattle, advanceBattle, validateSave, camp, forage, tick,
} from '../src/engine.js';
import { hexDistance } from '../src/battle-terrain.js';

const added = [
  'sword-training', 'axe-training', 'mace-training', 'spear-training', 'polearm-training',
  'dagger-training', 'throwing-training', 'shield-bearer', 'shield-strike', 'iron-jaw',
  'battle-forged', 'nimble', 'duelist', 'opportunist', 'last-stand', 'marksman',
  'point-blank', 'volley-fire', 'reload-drill', 'fleet-footed', 'marathoner',
  'high-ground', 'field-medic', 'forager', 'paymaster', 'trailblazer',
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
  advanceBattle(armed.state);
  advanceBattle(control);
  assert.equal(armed.battle.lastEvent.type, 'attack', perk);
  assert.equal(control.battle.lastEvent.type, 'attack', perk);
  return { perk: armed.battle.lastEvent, plain: control.battle.lastEvent, armed, control };
}

test('expanded perk catalog is unique, grouped, saveable, and uses bundled icon IDs', () => {
  assert.equal(added.length, 26);
  assert.equal(PERKS.length, 45);
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

test('light defense, shields, wages, forage, camp healing, and travel have concrete passive effects', () => {
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
  person.perks = ['paymaster', 'trailblazer', 'forager', 'field-medic'];
  assert.equal(getCompanyStats(person).dailyWage, 23);
  assert.equal(getCompanyTravelBonus(state), .05);
  assert.equal(getDailyFood(state), 3);
  for (const band of Object.values(state.bands)) band.defeatedUntil = 1000;
  const food = state.food;
  assert.equal(forage(state).ok, true);
  assert.ok(state.food >= food + 5);
  person.hp -= 50;
  const wounded = person.hp;
  assert.equal(camp(state).ok, true);
  assert.equal(person.hp - wounded, 32);
});

test('movement perks increase reach or reduce movement fatigue', () => {
  const base = battleWith('arming-sword', [], 5);
  base.actor.equipment.armor = 'patched-coat';
  base.actor.equipment.helmet = null;
  base.actor.q = 2;
  base.actor.r = 2;
  const origin = { q: 2, r: 2 };
  const fleet = structuredClone(base.state);
  fleet.battle.units.find(unit => unit.id === 'captain').perks = ['fleet-footed'];
  advanceBattle(base.state);
  advanceBattle(fleet);
  const walker = base.battle.units.find(unit => unit.id === 'captain');
  const runner = fleet.battle.units.find(unit => unit.id === 'captain');
  assert.ok(hexDistance(origin, runner) > hexDistance(origin, walker));
  const marathon = battleWith('arming-sword', ['marathoner'], 5);
  marathon.actor.equipment.armor = 'patched-coat';
  marathon.actor.equipment.helmet = null;
  const plain = structuredClone(marathon.state);
  plain.battle.units.find(unit => unit.id === 'captain').perks = [];
  advanceBattle(marathon.state);
  advanceBattle(plain);
  assert.ok(marathon.actor.fatigue < plain.battle.units.find(unit => unit.id === 'captain').fatigue);
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
