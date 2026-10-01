import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, createFamedItemId, createGame, getCampSites, getItem, startBattle, advanceBattle, resolveBattle, setBattleTactic, validateSave } from '../src/engine.js';
import { COMBAT_SKILLS, equipmentSkills, weaponSkillFamily } from '../src/combat-skills.js';
import { hexNeighbors } from '../src/battle-terrain.js';

function battleWith(weapon, seed = 911) {
  const state = createGame(seed);
  const captain = state.party.find(person => person.id === 'captain');
  captain.equipment.weapon = weapon;
  if (getItem(weapon).twoHanded) {
    captain.equipment.shield = null;
    captain.armorDurability.shield = 0;
  }
  const camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y };
  assert.equal(startBattle(state, camp.id).ok, true);
  const battle = state.battle;
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  const at = (id, q, r) => Object.assign(battle.units.find(unit => unit.id === id), { q, r });
  const actor = at('captain', 2, 2);
  at('guard', 0, 1); at('scout', 0, 3);
  at('enemy-1', 4, 2); at('enemy-2', 11, 5); at('enemy-3', 12, 6);
  battle.activeId = actor.id;
  battle.turnIndex = battle.turnOrder.indexOf(actor.id);
  return { state, battle, actor, at };
}

test('every catalog weapon and famed copy has an explicit skill family and matching heavy AP', () => {
  const weapons = ITEMS.filter(item => item.slot === 'weapon');
  assert.ok(weapons.length > 40);
  for (const item of weapons) {
    assert.ok(weaponSkillFamily(item), item.id);
    assert.ok(equipmentSkills(item).length, item.id);
    for (const skill of equipmentSkills(item)) {
      assert.equal(COMBAT_SKILLS[skill.id].name, skill.name, item.id);
      if (item.twoHanded && !item.ranged) assert.ok(skill.ap >= 6, item.id);
    }
    const famed = getItem(createFamedItemId(item.id, 17));
    assert.equal(weaponSkillFamily(famed), weaponSkillFamily(item), item.id);
    assert.deepEqual(equipmentSkills(famed).map(skill => skill.id), equipmentSkills(item).map(skill => skill.id), item.id);
  }
});

test('Spearwall hit stops one step, spends reaction fatigue, and survives save reload', () => {
  const { state, battle, actor, at } = battleWith('spear');
  const mover = at('enemy-1', 4, 2);
  actor.spearwallActive = true;
  actor.meleeSkill = 200;
  mover.meleeDefense = 0;
  battle.activeId = mover.id;
  battle.turnIndex = battle.turnOrder.indexOf(mover.id);
  battle.rng = 1972;
  const before = { q: mover.q, r: mover.r };
  advanceBattle(state);
  assert.deepEqual({ q: mover.q, r: mover.r }, before);
  assert.equal(actor.fatigue, 5);
  assert.equal(actor.spearwallActive, true);
  assert.equal(battle.lastEvent.reactions?.[0]?.skillName, 'Spearwall');
  assert.equal(battle.lastEvent.reactions[0].type, 'attack');
  assert.deepEqual(validateSave(structuredClone(state)), state);
});

test('Defense braces with Spearwall before an approaching enemy reaches the line', () => {
  const { state, battle, actor } = battleWith('spear');
  actor.skillPreference = 'control';
  assert.equal(setBattleTactic(state, 'defense').ok, true);
  advanceBattle(state);
  assert.equal(battle.lastEvent.skillName, 'Spearwall');
  assert.equal(actor.spearwallActive, true);
  assert.equal(actor.ap, 5);
});

test('Spearwall is not raised when no enemy has a legal approach', () => {
  const { state, battle, actor } = battleWith('spear');
  actor.skillPreference = 'control';
  for (const point of hexNeighbors(battle.field, actor)) {
    battle.field.tiles.find(tile => tile.q === point.q && tile.r === point.r).terrain = 'dense-trees';
  }
  advanceBattle(state);
  assert.notEqual(battle.lastEvent.skillName, 'Spearwall');
  assert.equal(actor.spearwallActive, false);
});

test('Spearwall miss breaks stance and the attempted step completes', () => {
  const { state, battle, actor, at } = battleWith('spear');
  const mover = at('enemy-1', 4, 2);
  actor.spearwallActive = true;
  actor.meleeSkill = 0;
  mover.meleeDefense = 200;
  battle.activeId = mover.id;
  battle.turnIndex = battle.turnOrder.indexOf(mover.id);
  battle.rng = 0;
  advanceBattle(state);
  assert.equal(actor.spearwallActive, false);
  assert.equal(actor.fatigue, 5);
  assert.equal(battle.lastEvent.reactions?.[0]?.type, 'miss');
  assert.deepEqual({ q: mover.q, r: mover.r }, { q: 3, r: 2 });
  assert.deepEqual(validateSave(structuredClone(state)), state);
});

test('Riposte counter costs fatigue and cannot recursively trigger a second counter', () => {
  const { state, battle, actor, at } = battleWith('arming-sword');
  const attacker = at('enemy-1', 3, 2);
  attacker.equipment.weapon = 'arming-sword';
  actor.riposteActive = true;
  attacker.riposteActive = true;
  attacker.meleeSkill = 0;
  actor.meleeDefense = 200;
  battle.activeId = attacker.id;
  battle.turnIndex = battle.turnOrder.indexOf(attacker.id);
  battle.rng = 0;
  advanceBattle(state);
  assert.equal(battle.lastEvent.reactions?.length, 1);
  assert.equal(battle.lastEvent.reactions[0].skillName, 'Riposte');
  assert.equal(actor.fatigue, 5);
  assert.deepEqual(validateSave(structuredClone(state)), state);
});

test('Riposte waits for an adjacent enemy who can actually make a melee attack', () => {
  for (const disabled of ['stunned', 'ranged']) {
    const { state, battle, actor, at } = battleWith('arming-sword');
    const target = at('enemy-1', 3, 2);
    actor.skillPreference = 'control';
    actor.meleeSkill = 0;
    target.meleeDefense = 200;
    if (disabled === 'stunned') { target.stunnedTurns = 1; target.stunProtected = true; }
    else target.equipment.weapon = 'hunting-bow';
    advanceBattle(state);
    assert.notEqual(battle.lastEvent.skillName, 'Riposte', disabled);
    assert.equal(actor.riposteActive, false, disabled);
  }
});

test('off-turn Riposte kill carries Berserk AP into the reactor next activation', () => {
  const { state, battle, actor, at } = battleWith('arming-sword');
  const attacker = at('enemy-1', 3, 2);
  state.party.find(person => person.id === actor.id).level = 20;
  state.party.find(person => person.id === actor.id).perks.push('berserk');
  actor.perks.push('berserk');
  actor.riposteActive = true;
  actor.ap = 0;
  actor.meleeSkill = 200;
  actor.meleeDefense = 200;
  attacker.hp = 1;
  attacker.meleeSkill = 0;
  battle.activeId = attacker.id;
  battle.turnIndex = battle.turnOrder.indexOf(attacker.id);
  battle.rng = 0;
  advanceBattle(state);
  assert.equal(attacker.alive, false);
  assert.equal(actor.pendingBerserkAp, 4);
  assert.equal(actor.ap, 0);
  assert.match(battle.log.at(-1), /Berserk: \+4 AP next turn/);
  assert.deepEqual(validateSave(structuredClone(state)), state);
  let steps = 0;
  while (battle.status === 'active' && battle.activeId !== actor.id && steps < 100) {
    advanceBattle(state);
    steps += 1;
  }
  assert.equal(battle.activeId, actor.id);
  assert.equal(actor.ap, 13);
  assert.equal(actor.pendingBerserkAp, 0);
  assert.deepEqual(validateSave(structuredClone(state)), state);
});

test('exhausted stances cannot take a free reaction', async t => {
  await t.test('Spearwall', () => {
    const { state, battle, actor, at } = battleWith('spear');
    const mover = at('enemy-1', 4, 2);
    actor.spearwallActive = true;
    actor.fatigue = actor.maxFatigue - 4;
    battle.activeId = mover.id;
    battle.turnIndex = battle.turnOrder.indexOf(mover.id);
    advanceBattle(state);
    assert.deepEqual({ q: mover.q, r: mover.r }, { q: 3, r: 2 });
    assert.equal(battle.lastEvent.reactions, undefined);
    assert.equal(actor.fatigue, actor.maxFatigue - 4);
  });
  await t.test('Riposte', () => {
    const { state, battle, actor, at } = battleWith('arming-sword');
    const attacker = at('enemy-1', 3, 2);
    actor.riposteActive = true;
    actor.fatigue = actor.maxFatigue - 4;
    attacker.meleeSkill = 0;
    actor.meleeDefense = 200;
    battle.activeId = attacker.id;
    battle.turnIndex = battle.turnOrder.indexOf(attacker.id);
    advanceBattle(state);
    assert.equal(battle.lastEvent.reactions, undefined);
    assert.equal(actor.fatigue, actor.maxFatigue - 4);
  });
});

test('weapon stances end at the owner turn and when its weapon set changes', () => {
  const expiry = battleWith('spear');
  expiry.actor.spearwallActive = true;
  expiry.battle.activeId = 'enemy-1';
  expiry.battle.turnIndex = expiry.battle.turnOrder.indexOf('enemy-1');
  let steps = 0;
  while (expiry.battle.activeId !== expiry.actor.id && steps < 100) {
    advanceBattle(expiry.state);
    steps += 1;
  }
  assert.equal(expiry.battle.activeId, expiry.actor.id);
  assert.equal(expiry.actor.spearwallActive, false);
  assert.deepEqual(validateSave(structuredClone(expiry.state)), expiry.state);

  const swap = battleWith('spear');
  const member = swap.state.party.find(person => person.id === 'captain');
  member.reserveEquipment.weapon = swap.actor.reserveEquipment.weapon = 'javelins';
  swap.actor.throwingAmmo.reserve = 5;
  member.throwingAmmo.reserve = 5;
  swap.actor.spearwallActive = true;
  swap.at('enemy-1', 7, 2);
  advanceBattle(swap.state);
  assert.equal(swap.battle.lastEvent.type, 'swap');
  assert.equal(swap.actor.spearwallActive, false);
});

test('two-handed sword area action records each target and never hits a bystander by default', () => {
  const clean = battleWith('greatsword');
  clean.at('enemy-1', 3, 2);
  clean.at('enemy-2', 4, 2);
  clean.actor.meleeSkill = 200;
  clean.actor.skillPreference = 'damage';
  advanceBattle(clean.state);
  assert.ok(['Split', 'Swing'].includes(clean.battle.lastEvent.skillName));
  assert.equal(clean.battle.lastEvent.affectedTargets?.length, 2);
  assert.ok(clean.battle.lastEvent.affectedTargets.every(impact => typeof impact.hit === 'boolean'));
  assert.deepEqual(validateSave(structuredClone(clean.state)), clean.state);

  const guarded = battleWith('greatsword');
  guarded.at('enemy-1', 3, 2);
  guarded.at('guard', 4, 2);
  guarded.actor.meleeSkill = 200;
  const guardHp = guarded.battle.units.find(unit => unit.id === 'guard').hp;
  advanceBattle(guarded.state);
  assert.equal(guarded.battle.lastEvent.affectedTargets, undefined);
  assert.equal(guarded.battle.units.find(unit => unit.id === 'guard').hp, guardHp);
});

test('necessary Split through a surviving ally can finish an unreachable enemy', () => {
  const { state, battle, actor, at } = battleWith('greatsword');
  const ally = at('guard', 3, 2);
  const enemy = at('enemy-1', 4, 2);
  enemy.hp = 1;
  actor.meleeSkill = 200;
  actor.skillPreference = 'damage';
  const allyHp = ally.hp;
  advanceBattle(state);
  assert.equal(battle.lastEvent.skillName, 'Split');
  assert.equal(battle.lastEvent.friendlyFire, true);
  assert.deepEqual(battle.lastEvent.affectedTargets.map(impact => impact.id), [ally.id, enemy.id]);
  assert.ok(ally.hp > 0 && ally.hp <= allyHp);
  assert.equal(enemy.alive, false);
  assert.match(battle.lastEvent.message, /necessary finishing strike risks friendly fire/);
  assert.deepEqual(validateSave(structuredClone(state)), state);
});

test('area safety rejects low-confidence, lethal-to-ally, and safe-finisher friendly fire', async t => {
  const cases = [
    ['below 90% kill chance', ({ actor, enemy }) => { actor.meleeSkill = 0; enemy.meleeDefense = 200; }],
    ['ally may die', ({ ally }) => { ally.hp = 1; }],
    ['movement and basic attack can finish', ({ actor }) => { actor.movementCredit = 4; }],
    ['free pocket swap can finish', ({ actor }) => { actor.perks.push('quick-hands'); actor.accessories[0] = 'rondel-dagger'; }],
    ['extra AP could fund two safe attacks', ({ actor, battle }) => { actor.ap = 13; actor.turnStartedRound = battle.round; }],
  ];
  for (const [name, change] of cases) await t.test(name, () => {
    const fight = battleWith('greatsword');
    const ally = fight.at('guard', 3, 2);
    const enemy = fight.at('enemy-1', 4, 2);
    enemy.hp = 1;
    fight.actor.meleeSkill = 200;
    change({ ...fight, ally, enemy });
    const beforeHp = ally.hp;
    advanceBattle(fight.state);
    assert.notEqual(fight.battle.lastEvent.friendlyFire, true, fight.battle.lastEvent.message);
    assert.equal(ally.hp, beforeHp, 'the bystander is never attacked');
  });
});

test('among necessary area exceptions the AI chooses the ally with lower expected harm', () => {
  const { state, battle, actor, at } = battleWith('greatsword');
  const exposed = at('guard', 3, 2);
  const protectedAlly = at('scout', 2, 3);
  exposed.bodyArmor = exposed.attachmentArmor = exposed.headArmor = 0;
  protectedAlly.bodyArmor = 80;
  protectedAlly.attachmentArmor = 0;
  at('enemy-1', 4, 2).hp = 1;
  at('enemy-2', 2, 4).hp = 1;
  actor.meleeSkill = 200;
  advanceBattle(state);
  assert.equal(battle.lastEvent.friendlyFire, true);
  assert.equal(battle.lastEvent.targetId, protectedAlly.id);
  assert.deepEqual(battle.lastEvent.affectedTargets.map(impact => impact.id), [protectedAlly.id, 'enemy-2']);
});

test('Focus and adjacent melee priority apply to new area candidates', () => {
  const focus = battleWith('greatsword');
  focus.at('enemy-1', 3, 2);
  const focused = focus.at('enemy-2', 2, 3);
  focus.at('enemy-3', 3, 1);
  focus.actor.meleeSkill = 200;
  assert.equal(setBattleTactic(focus.state, 'focus').ok, true);
  focus.battle.focusTargetId = focused.id;
  advanceBattle(focus.state);
  assert.ok(focus.battle.lastEvent.targetId === focused.id
    || focus.battle.lastEvent.affectedTargets?.some(impact => impact.id === focused.id));

  const adjacent = battleWith('greatsword');
  adjacent.at('guard', 3, 2);
  adjacent.at('enemy-1', 4, 2).hp = 1;
  const threat = adjacent.at('enemy-2', 3, 1);
  adjacent.actor.meleeSkill = 200;
  advanceBattle(adjacent.state);
  assert.notEqual(adjacent.battle.lastEvent.friendlyFire, true);
  assert.ok(adjacent.battle.lastEvent.targetId === threat.id
    || adjacent.battle.lastEvent.affectedTargets?.some(impact => impact.id === threat.id));
});

test('Knock Out stuns for one skipped turn and protects against immediate restun', () => {
  const { state, battle, actor, at } = battleWith('winged-mace');
  const target = at('enemy-1', 3, 2);
  actor.meleeSkill = 200;
  actor.skillPreference = 'control';
  target.meleeSkill = 200;
  target.hp = target.maxHp = 300;
  battle.rng = 1972;
  advanceBattle(state);
  assert.equal(battle.lastEvent.skillName, 'Knock Out');
  assert.equal(target.stunnedTurns, 1);
  assert.equal(target.stunProtected, true);
  assert.deepEqual(validateSave(structuredClone(state)), state);
  battle.activeId = target.id;
  battle.turnIndex = battle.turnOrder.indexOf(target.id);
  advanceBattle(state);
  assert.equal(target.stunnedTurns, 0);
  assert.equal(target.stunProtected, true);
  assert.match(battle.lastEvent.message, /loses a turn/);
  assert.deepEqual(validateSave(structuredClone(state)), state);
  battle.round += 1;
  battle.activeId = target.id;
  battle.turnIndex = battle.turnOrder.indexOf(target.id);
  target.ap = 9;
  advanceBattle(state);
  assert.equal(target.stunProtected, false);
});

test('weapon stance and stun fields reject forged save combinations', () => {
  const { state, actor } = battleWith('arming-sword');
  const invalidStun = structuredClone(state);
  const forged = invalidStun.battle.units.find(unit => unit.id === actor.id);
  forged.stunnedTurns = 1;
  forged.stunProtected = false;
  assert.throws(() => validateSave(invalidStun), /battle stun protection/);
  const invalidStance = structuredClone(state);
  invalidStance.battle.units.find(unit => unit.id === actor.id).spearwallActive = true;
  assert.throws(() => validateSave(invalidStance), /battle spearwall weapon/);
});

test('each weapon family chooses its situational signature over an ordinary attack', async t => {
  const scenarios = [
    ['rondel-dagger', 'Puncture', target => { target.bodyArmor = 100; }],
    ['qatal-dagger', 'Deathblow', target => { target.stunnedTurns = 1; target.stunProtected = true; }],
    ['wood-axe', 'Split Shield', target => { target.equipment.shield = 'kite-shield'; target.shieldDurability = 80; }],
    ['warhammer', 'Crush Armor', target => { target.bodyArmor = target.headArmor = 100; }],
    ['military-cleaver', 'Decapitate', target => { target.hp = 150; target.maxHp = 250; }],
    ['flail', 'Lash', target => { target.headArmor = 0; target.bodyArmor = 100; }],
    ['billhook', 'Hook', target => { target.bodyArmor = 0; }],
    ['javelins', 'Power Throw', target => { target.bodyArmor = 0; }],
    ['light-crossbow', 'Piercing Bolt', target => { target.bodyArmor = 100; }],
    ['whip', 'Whip Crack', target => { target.headArmor = 0; target.bodyArmor = 100; target.equipment.shield = 'round-shield'; target.shieldDurability = 24; }],
    ['northern-sling', 'Stunning Stone', target => { target.meleeSkill = 200; }],
  ];
  for (const [weapon, expected, configure] of scenarios) await t.test(weapon, () => {
    const { state, battle, actor, at } = battleWith(weapon);
    const target = at('enemy-1', weapon === 'billhook' ? 4 : 3, 2);
    target.hp = target.maxHp = 250;
    actor.meleeSkill = actor.rangedSkill = 200;
    actor.skillPreference = expected === 'Stunning Stone' ? 'control' : 'damage';
    configure(target);
    battle.rng = 1972;
    const before = { bodyArmor: target.bodyArmor, headArmor: target.headArmor, shield: target.shieldDurability,
      throwingAmmo: actor.throwingAmmo.active };
    advanceBattle(state);
    assert.equal(battle.lastEvent.skillName, expected, `${weapon}: ${battle.lastEvent.message}`);
    assert.equal(battle.lastEvent.type, 'attack', weapon);
    if (expected === 'Puncture') {
      assert.equal(target.bodyArmor, before.bodyArmor);
      assert.equal(target.headArmor, before.headArmor);
      assert.equal(battle.lastEvent.head, false);
    }
    if (expected === 'Split Shield') assert.ok(before.shield - target.shieldDurability >= 28);
    if (expected === 'Crush Armor') assert.ok(battle.lastEvent.armorDamage > 0);
    if (['Lash', 'Whip Crack'].includes(expected)) assert.equal(battle.lastEvent.head, true);
    if (expected === 'Hook') assert.deepEqual({ q: target.q, r: target.r }, { q: 3, r: 2 });
    if (expected === 'Power Throw') assert.equal(actor.throwingAmmo.active, before.throwingAmmo - 1);
    if (expected === 'Piercing Bolt') assert.equal(actor.reload, 1);
    if (expected === 'Stunning Stone') assert.deepEqual([target.stunnedTurns, target.stunProtected], [1, true]);
  });
});

test('dagger Stab costs 3 AP only in weapon-skill battles', () => {
  for (const newRules of [false, true]) {
    const { state, battle, actor, at } = battleWith('fighting-knife');
    if (!newRules) {
      delete battle.weaponSkillsVersion;
      for (const unit of battle.units) for (const key of ['spearwallActive', 'riposteActive', 'stunnedTurns', 'stunProtected', 'pendingBerserkAp']) delete unit[key];
    }
    const target = at('enemy-1', 3, 2);
    target.headArmor = target.bodyArmor = target.attachmentArmor = 0;
    actor.meleeSkill = 200;
    advanceBattle(state);
    assert.equal(actor.ap, newRules ? 6 : 5);
  }
});

test('signature damage and penetration materially exceed matching ordinary attacks', async t => {
  const cases = [
    ['qatal-dagger', 'Deathblow', target => { target.stunnedTurns = 1; target.stunProtected = true; target.bodyArmor = target.headArmor = 0; }, 'hpDamage'],
    ['warhammer', 'Crush Armor', target => { target.bodyArmor = target.headArmor = 100; }, 'armorDamage'],
    ['military-cleaver', 'Decapitate', target => { target.hp = 150; target.maxHp = 250; target.bodyArmor = target.headArmor = 0; }, 'hpDamage'],
    ['javelins', 'Power Throw', target => { target.bodyArmor = target.headArmor = 0; }, 'hpDamage'],
    ['light-crossbow', 'Piercing Bolt', target => { target.bodyArmor = target.headArmor = 100; }, 'hpDamage'],
  ];
  for (const [weapon, skill, configure, metric] of cases) await t.test(skill, () => {
    const { state, battle, actor, at } = battleWith(weapon);
    const target = at('enemy-1', 3, 2);
    target.hp = target.maxHp = 250;
    actor.meleeSkill = actor.rangedSkill = 200;
    actor.skillPreference = 'damage';
    configure(target);
    battle.rng = 1972;
    const ordinary = structuredClone(state);
    delete ordinary.battle.weaponSkillsVersion;
    for (const unit of ordinary.battle.units) for (const key of ['spearwallActive', 'riposteActive', 'stunnedTurns', 'stunProtected', 'pendingBerserkAp']) delete unit[key];
    advanceBattle(state);
    advanceBattle(ordinary);
    assert.equal(battle.lastEvent.skillName, skill);
    assert.equal(battle.lastEvent.type, 'attack');
    assert.equal(ordinary.battle.lastEvent.type, 'attack');
    assert.ok(battle.lastEvent[metric] > ordinary.battle.lastEvent[metric],
      `${skill}: ${battle.lastEvent[metric]} versus ${ordinary.battle.lastEvent[metric]}`);
  });
});

test('stance-heavy tactics resolve in bounds and match stepwise save reloads', async t => {
  for (const [weapon, tactic] of [['spear', 'defense'], ['arming-sword', 'shield-wall'], ['spear', 'focus']]) await t.test(`${weapon}/${tactic}`, () => {
    let { state } = battleWith(weapon, 1188);
    assert.equal(setBattleTactic(state, tactic).ok, true);
    const instant = structuredClone(state);
    assert.equal(resolveBattle(instant).ok, true);
    let steps = 0;
    while (state.battle.status === 'active' && steps < 2000) {
      advanceBattle(state);
      state = validateSave(structuredClone(state));
      steps += 1;
    }
    assert.notEqual(state.battle.status, 'active', `stalled after ${steps} actions`);
    assert.deepEqual(state, instant);
  });
});
