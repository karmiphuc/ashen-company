import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getCampSites, startBattle, advanceBattle, validateSave, setCombatSettings, setBattleTactic, shieldMaximum } from '../src/engine.js';
import { hexNeighbors } from '../src/battle-terrain.js';
import { rankTacticalActions } from '../src/tactical-ai.js';

function battleWithCaptain(weapon = 'arming-sword', shield = null, seed = 51) {
  const state = createGame(seed);
  const person = state.party.find(member => member.id === 'captain');
  person.equipment.weapon = weapon;
  person.equipment.shield = shield;
  person.armorDurability.shield = shield ? 12 : 0;
  const site = getCampSites(state)[0];
  state.position = { x: site.x, y: site.y };
  assert.equal(startBattle(state, site.id).ok, true);
  const battle = state.battle;
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  const at = (id, q, r) => Object.assign(battle.units.find(unit => unit.id === id), { q, r });
  at('captain', 2, 2); at('guard', 1, 1); at('scout', 1, 3);
  at('enemy-1', 4, 2); at('enemy-2', 11, 4); at('enemy-3', 12, 5);
  battle.turnIndex = battle.turnOrder.indexOf('captain');
  battle.activeId = 'captain';
  return { state, battle, actor: battle.units.find(unit => unit.id === 'captain'), at };
}

test('new fights use 9 AP and two bow Quick Shots, while old saved fights keep 2 AP', () => {
  const { state, battle, actor } = battleWithCaptain('hunting-bow');
  const target = battle.units.find(unit => unit.id === 'enemy-1');
  target.hp = target.maxHp = 300;
  assert.equal(battle.rulesVersion, 2);
  assert.equal(actor.ap, 9);
  const ammo = state.supplies.ammo;
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(battle.lastEvent.skillName, 'Quick Shot');
  assert.equal(actor.ap, 5);
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(battle.lastEvent.skillName, 'Quick Shot');
  assert.equal(actor.ap, 1);
  assert.equal(state.supplies.ammo, ammo - 2);
  assert.equal(actor.fatigue, 18);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);

  const legacy = battleWithCaptain().state;
  delete legacy.battle.rulesVersion;
  delete legacy.battle.weaponSkillsVersion;
  delete legacy.battle.mountSkillsVersion; delete legacy.battle.mountBalanceVersion;
  for (const unit of legacy.battle.units) {
    unit.ap = 2;
    delete unit.shieldWallActive;
    delete unit.aiTargetId;
    delete unit.formationMovedRound;
    delete unit.movementCredit;
    for (const key of ['spearwallActive', 'riposteActive', 'stunnedTurns', 'stunProtected', 'pendingBerserkAp']) delete unit[key];
  }
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(legacy))), legacy);
  assert.equal(advanceBattle(legacy).ok, true);
  assert.equal(legacy.battle.units.find(unit => unit.id === 'captain').ap, 0);
});

test('Aimed Shot reaches one extra hex for 7 AP and 15 fatigue, reduced by Bow Mastery', () => {
  for (const mastery of [false, true]) {
    const { state, battle, actor, at } = battleWithCaptain('hunting-bow');
    at('enemy-1', mastery ? 8 : 7, 2);
    if (mastery) {
      state.party.find(member => member.id === 'captain').perks.push('bow-mastery');
      actor.perks.push('bow-mastery');
    }
    const ammo = state.supplies.ammo;
    advanceBattle(state);
    assert.equal(battle.lastEvent.skillName, 'Aimed Shot');
    assert.equal(actor.ap, mastery ? 3 : 2);
    assert.equal(actor.fatigue, mastery ? 12 : 15);
    assert.equal(state.supplies.ammo, ammo - 1);
    if (!mastery) assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
  }
});

test('Shieldwall protects until the owner next acts, and Knock Back pushes without damage', () => {
  const wall = battleWithCaptain('arming-sword', 'round-shield');
  setBattleTactic(wall.state, 'shield-wall');
  wall.actor.skillPreference = 'control';
  wall.state.party.find(person => person.id === 'captain').skillPreference = 'control';
  advanceBattle(wall.state);
  assert.equal(wall.battle.lastEvent.skillName, 'Shieldwall');
  assert.equal(wall.actor.ap, 5);
  assert.equal(wall.actor.fatigue, 20);
  assert.equal(wall.actor.shieldWallActive, true);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(wall.state))), wall.state);
  for (let step = 0; step < 100 && (wall.battle.round === 1 || wall.battle.activeId !== 'captain'); step++) advanceBattle(wall.state);
  assert.equal(wall.battle.activeId, 'captain');
  assert.equal(wall.actor.shieldWallActive, false);

  const push = battleWithCaptain('arming-sword', 'round-shield');
  push.actor.skillPreference = 'control';
  push.actor.shieldWallActive = true;
  push.at('enemy-1', 3, 2);
  const target = push.battle.units.find(unit => unit.id === 'enemy-1');
  target.meleeSkill = 200;
  target.meleeDefense = 200;
  target.equipment.shield = 'round-shield';
  target.shieldDurability = 12;
  target.maxShieldDurability = shieldMaximum('round-shield');
  target.shieldWallActive = true;
  const free = { q: 4, r: 2 };
  const occupied = hexNeighbors(push.battle.field, target).filter(point => !(point.q === 2 && point.r === 2)
    && !(point.q === free.q && point.r === free.r));
  for (const [index, unit] of push.battle.units.filter(unit => unit.id !== 'captain' && unit.id !== 'enemy-1').entries()) {
    unit.q = occupied[index].q; unit.r = occupied[index].r;
  }
  push.battle.rng = 1972;
  const before = { hp: target.hp, bodyArmor: target.bodyArmor, headArmor: target.headArmor };
  advanceBattle(push.state);
  assert.equal(push.battle.lastEvent.skillName, 'Knock Back');
  assert.deepEqual({ q: target.q, r: target.r }, free);
  assert.equal(target.shieldWallActive, false, 'forced movement cancels the target stance');
  assert.deepEqual({ hp: target.hp, bodyArmor: target.bodyArmor, headArmor: target.headArmor }, before);
  assert.equal(push.actor.ap, 5);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(push.state))), push.state);
  target.q = 3; target.r = 2; target.shieldWallActive = true;
  push.actor.ap = 9;
  push.battle.rng = 0;
  advanceBattle(push.state);
  assert.equal(push.battle.lastEvent.skillName, 'Knock Back');
  assert.match(push.battle.lastEvent.message, /fails to knock back/);
  assert.equal(target.shieldWallActive, true, 'a failed push preserves the stance');

  const broken = battleWithCaptain('arming-sword', 'round-shield');
  broken.at('enemy-1', 3, 2);
  broken.actor.shieldWallActive = true;
  broken.actor.shieldDurability = 1;
  const attacker = broken.battle.units.find(unit => unit.id === 'enemy-1');
  attacker.equipment.weapon = 'wood-axe';
  attacker.meleeSkill = 200;
  broken.battle.turnIndex = broken.battle.turnOrder.indexOf(attacker.id);
  broken.battle.activeId = attacker.id;
  broken.battle.rng = 0;
  advanceBattle(broken.state);
  assert.equal(broken.actor.shieldDurability, 0);
  assert.equal(broken.actor.shieldWallActive, false, 'a broken shield ends the stance immediately');
});

test('combat settings validate atomically and resolve a chosen battle role', () => {
  const state = createGame(124);
  const before = structuredClone(state);
  assert.equal(setCombatSettings(state, 'captain', { combatRole: 'dragon' }).ok, false);
  assert.deepEqual(state, before);
  assert.equal(setCombatSettings(state, 'captain', { combatRole: 'ranged', skillPreference: 'damage' }).ok, true);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
  const site = getCampSites(state)[0];
  state.position = { x: site.x, y: site.y };
  assert.equal(startBattle(state, site.id).ok, true);
  const captain = state.battle.units.find(unit => unit.id === 'captain');
  assert.equal(captain.tacticalRole, 'ranged');
  assert.equal(captain.skillPreference, 'damage');
});

test('Knock Back rejects a cliff and formation movement cannot spend unavailable AP', () => {
  const blocked = battleWithCaptain('arming-sword', 'round-shield');
  blocked.actor.skillPreference = 'control';
  blocked.actor.shieldWallActive = true;
  blocked.at('enemy-1', 3, 2);
  const target = blocked.battle.units.find(unit => unit.id === 'enemy-1');
  target.meleeSkill = target.meleeDefense = 200;
  const free = { q: 4, r: 2 };
  const occupied = hexNeighbors(blocked.battle.field, target).filter(point => !(point.q === 2 && point.r === 2)
    && !(point.q === free.q && point.r === free.r));
  for (const [index, unit] of blocked.battle.units.filter(unit => unit.id !== 'captain' && unit.id !== 'enemy-1').entries()) {
    unit.q = occupied[index].q; unit.r = occupied[index].r;
  }
  blocked.battle.field.tiles.find(tile => tile.q === free.q && tile.r === free.r).height = 2;
  advanceBattle(blocked.state);
  assert.notEqual(blocked.battle.lastEvent.skillName, 'Knock Back');
  assert.deepEqual({ q: target.q, r: target.r }, { q: 3, r: 2 });

  const formation = battleWithCaptain();
  setBattleTactic(formation.state, 'advance-formation');
  formation.actor.ap = 1;
  const origin = { q: formation.actor.q, r: formation.actor.r };
  advanceBattle(formation.state);
  assert.deepEqual({ q: formation.actor.q, r: formation.actor.r }, origin);
});

test('role-aware utility values ranged spacing, skirmisher safety, and flanking', () => {
  const actor = { ap: 9, fatigue: 0, maxFatigue: 100, skillPreference: 'balanced' };
  const exposed = { id: 'a', type: 'attack', apCost: 4, fatigueCost: 9, expectedHealthDamage: 12, incomingDamage: 5 };
  const spaced = { id: 'z', type: 'attack', apCost: 4, fatigueCost: 9, expectedHealthDamage: 8, incomingDamage: 1, spacingGain: 2 };
  assert.equal(rankTacticalActions({ ...actor, tacticalRole: 'frontliner' }, [exposed, spaced])[0].id, 'a');
  for (const role of ['ranged', 'skirmisher']) {
    assert.equal(rankTacticalActions({ ...actor, tacticalRole: role }, [exposed, spaced])[0].id, 'z');
  }
  const direct = { id: 'a', type: 'move', apCost: 2, fatigueCost: 3 };
  const flank = { id: 'z', type: 'move', apCost: 2, fatigueCost: 3, flankGain: 1 };
  assert.equal(rankTacticalActions({ ...actor, tacticalRole: 'frontliner' }, [direct, flank])[0].id, 'a');
  assert.equal(rankTacticalActions({ ...actor, tacticalRole: 'flanker' }, [direct, flank])[0].id, 'z');
});
