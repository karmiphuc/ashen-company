import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, PERKS, createFamedItemId, createGame, getCampSites, getCompanyStats,
  getLevelUp, getPerkChoices, getPerkPoints, learnPerk, startBattle,
  advanceBattle, finishBattle, trainAttributes, validateSave, getCompanyTravelBonus,
} from '../src/engine.js';
import { hexDistance, tileAt } from '../src/battle-terrain.js';

function beginBattle(state) {
  const site = getCampSites(state)[0];
  state.position = { x: site.x, y: site.y };
  state.destination = null;
  assert.equal(startBattle(state, site.id).ok, true);
  return state.battle;
}

function activate(battle, id) {
  battle.turnIndex = battle.turnOrder.indexOf(id);
  battle.activeId = id;
}

function flatten(battle) {
  for (const tile of battle.field.tiles) {
    tile.terrain = 'open';
    tile.height = 0;
  }
}

function battleWithCaptain(perks = [], weapon = 'arming-sword') {
  const state = createGame(251);
  const captain = state.party.find(person => person.id === 'captain');
  captain.level = 20;
  captain.perks = [...perks];
  captain.equipment.weapon = weapon;
  if (ITEMS.find(item => item.id === weapon)?.twoHanded) captain.equipment.shield = null;
  const battle = beginBattle(state);
  flatten(battle);
  const byId = id => battle.units.find(unit => unit.id === id);
  Object.assign(byId('captain'), { q: 2, r: 2, fatigue: 0, morale: 50 });
  Object.assign(byId('scout'), { q: 1, r: 1 });
  Object.assign(byId('guard'), { q: 1, r: 2 });
  Object.assign(byId('enemy-1'), { q: 3, r: 2, bodyArmor: 0, headArmor: 0 });
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy' && unit.id !== 'enemy-1')) {
    enemy.hp = 0;
    enemy.alive = false;
  }
  activate(battle, 'captain');
  return { state, battle, captain: byId('captain'), target: byId('enemy-1'), byId };
}

test('perk catalog gives one independent point per level and learning is atomic', () => {
  assert.equal(PERKS.length, 46);
  assert.equal(new Set(PERKS.map(perk => perk.id)).size, PERKS.length);
  assert.ok(PERKS.every(perk => Object.isFrozen(perk) && perk.minLevel >= 2));
  assert.ok(PERKS.every(perk => ['general', 'weapon', 'defense', 'ranged', 'mobility'].includes(perk.category) && typeof perk.icon === 'string'));
  assert.equal(PERKS.find(perk => perk.id === 'recover').category, 'mobility');
  for (const id of ['quick-hands', 'combat-bandaging']) {
    const novice = createGame(201);
    novice.party[0].level = 2;
    assert.equal(learnPerk(novice, novice.party[0].id, id).ok, true);
    assert.deepEqual(validateSave(novice), novice);
  }
  const state = createGame(201);
  const captain = state.party[0];
  assert.deepEqual(captain.perks, []);
  assert.equal(getPerkPoints(captain), 0);
  assert.deepEqual(getPerkChoices(captain), []);
  captain.level = 8;
  assert.equal(getPerkPoints(captain), 7);
  assert.ok(getPerkChoices(captain).some(perk => perk.id === 'killing-frenzy'));
  assert.equal(learnPerk(state, captain.id, 'colossus').ok, true);
  assert.equal(getPerkPoints(captain), 6);
  const after = structuredClone(state);
  for (const id of ['colossus', 'missing']) {
    assert.equal(learnPerk(state, captain.id, id).ok, false);
    assert.deepEqual(state, after);
  }
  captain.level = 2;
  const locked = structuredClone(state);
  assert.equal(learnPerk(state, captain.id, 'berserk').ok, false);
  assert.deepEqual(state, locked);
});

test('legacy members gain unspent perks while malformed and overspent lists fail validation', () => {
  const legacy = createGame(202);
  legacy.party[0].level = 4;
  legacy.party[0].xp = 0;
  delete legacy.party[0].perks;
  const migrated = validateSave(legacy);
  assert.deepEqual(migrated.party[0].perks, []);
  assert.equal(getPerkPoints(migrated.party[0]), 3);
  assert.deepEqual(validateSave(migrated), migrated);

  for (const perks of [['missing'], ['colossus', 'colossus'], ['colossus', 'pathfinder']]) {
    const bad = createGame(203);
    bad.party[0].level = perks.length === 2 ? 2 : 4;
    bad.party[0].perks = perks;
    assert.throws(() => validateSave(bad), /Invalid save: person perks/);
  }

  const active = createGame(204);
  beginBattle(active);
  delete active.battle.units[0].perks;
  delete active.battle.units[0].adaptation;
  delete active.battle.units[0].berserkRound;
  delete active.battle.units[0].frenzyUntilRound;
  delete active.battle.units[0].turnStartedRound;
  const restored = validateSave(active);
  assert.deepEqual(restored.battle.units[0].perks, []);
  assert.equal(restored.battle.units[0].adaptation, 0);
  const forged = structuredClone(restored);
  forged.battle.units[0].perks = ['berserk'];
  assert.throws(() => validateSave(forged), /Invalid save: battle perk owner/);
  for (const mutate of [
    unit => { unit.adaptation = 1001; },
    unit => { unit.berserkRound = restored.battle.round + 1; },
    unit => { unit.frenzyUntilRound = restored.battle.round + 3; },
    unit => { unit.turnStartedRound = restored.battle.round + 1; },
  ]) {
    const bad = structuredClone(restored);
    mutate(bad.battle.units[0]);
    assert.throws(() => validateSave(bad), /Invalid save: battle/);
  }
});

test('removed world perks refund points in legacy party and active battle saves', () => {
  const state = createGame(205);
  const captain = state.party[0];
  captain.level = 7;
  captain.perks = ['student', 'field-medic', 'forager', 'paymaster', 'trailblazer', 'sword-training'];
  assert.equal(getPerkPoints(captain), 5);
  assert.equal(getCompanyStats(captain).dailyWage, 11);
  assert.equal(getCompanyTravelBonus(state), 0);
  const battle = beginBattle(state);
  assert.deepEqual(battle.units.find(unit => unit.id === 'captain').perks, captain.perks);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.party[0].perks, ['sword-training']);
  assert.deepEqual(restored.battle.units.find(unit => unit.id === 'captain').perks, ['sword-training']);
  assert.equal(getPerkPoints(restored.party[0]), 5);
  assert.deepEqual(validateSave(restored), restored);
  const forgedBattle = structuredClone(restored);
  forgedBattle.battle.units.find(unit => unit.id === 'captain').perks = ['unknown-retired-perk'];
  assert.throws(() => validateSave(forgedBattle), /Invalid save: battle perks/);
  for (const enemy of restored.battle.units.filter(unit => unit.side === 'enemy')) { enemy.hp = 0; enemy.alive = false; }
  advanceBattle(restored);
  finishBattle(restored);
  assert.equal(restored.party[0].xp, 30, 'retired Student no longer increases battle experience');

  const unknown = createGame(206);
  unknown.party[0].level = 2;
  unknown.party[0].perks = ['unknown-retired-perk'];
  assert.throws(() => validateSave(unknown), /Invalid save: person perks/);
});

test('Colossus preserves wound deficit when learned and when max health is trained', () => {
  let state = createGame(10);
  const rawCaptain = state.party[0];
  rawCaptain.level = 2;
  rawCaptain.xp = 0;
  rawCaptain.trainingPoints = 1;
  delete rawCaptain.pendingLevelUps;
  state = validateSave(state);
  const captain = state.party[0];
  assert.equal(getLevelUp(captain).rolls.maxHp, 4);
  assert.equal(learnPerk(state, captain.id, 'colossus').ok, true);
  assert.equal(getCompanyStats(captain).maxHp, 125);
  assert.equal(captain.hp, 125);
  captain.hp -= 7;
  assert.equal(trainAttributes(state, captain.id, ['maxHp', 'meleeSkill', 'resolve']).ok, true);
  assert.equal(getCompanyStats(captain).maxHp, 130);
  assert.equal(captain.hp, 123);
});

test('passive stat perks apply their stated rounded bonuses', () => {
  const state = createGame(205);
  const captain = state.party[0];
  captain.level = 20;
  const base = getCompanyStats(captain);
  captain.perks = ['shield-expert'];
  assert.equal(getCompanyStats(captain).meleeDefense, base.meleeDefense + 2);
  captain.perks = ['brawny'];
  assert.ok(getCompanyStats(captain).maxFatigue > base.maxFatigue);
  assert.ok(getCompanyStats(captain).initiative > base.initiative);
  captain.perks = ['dodge'];
  assert.equal(getCompanyStats(captain).meleeDefense, base.meleeDefense + Math.floor(base.initiative * .15));
  captain.perks = ['fortified-mind'];
  assert.equal(getCompanyStats(captain).resolve, Math.ceil(base.resolve * 1.25));
});

test('Pathfinder crosses two rough uphill tiles for the normal two-point move budget', () => {
  const base = battleWithCaptain([]);
  Object.assign(base.captain, { q: 2, r: 2 });
  Object.assign(base.target, { q: 7, r: 2 });
  for (const tile of base.battle.field.tiles) {
    tile.terrain = 'trees';
    tile.height = Math.min(2, Math.max(0, tile.q - 2));
  }
  const origin = { q: base.captain.q, r: base.captain.r };
  const pathfinder = structuredClone(base.state);
  pathfinder.battle.units.find(unit => unit.id === 'captain').perks = ['pathfinder'];
  advanceBattle(base.state);
  advanceBattle(pathfinder);
  const normal = base.battle.units.find(unit => unit.id === 'captain');
  const swift = pathfinder.battle.units.find(unit => unit.id === 'captain');
  assert.equal(hexDistance(origin, normal), 1);
  assert.equal(hexDistance(origin, swift), 1);
  assert.equal(normal.fatigue, 6);
  assert.equal(swift.fatigue, 3);
  assert.equal(normal.ap, 5);
  assert.equal(swift.ap, 7, 'Pathfinder halves this rough uphill move from 4 AP to 2 AP');
});

test('Bullseye, Anticipation, Backstabber, and Fast Adaptation alter deterministic hit rolls', () => {
  const bullseye = battleWithCaptain(['bullseye'], 'hunting-bow');
  Object.assign(bullseye.captain, { rangedSkill: 55, q: 2, r: 2 });
  Object.assign(bullseye.target, { q: 5, r: 2 });
  tileAt(bullseye.battle.field, 5, 2).terrain = 'trees';
  bullseye.battle.rng = 19000;
  const noBullseye = structuredClone(bullseye.state);
  noBullseye.battle.units.find(unit => unit.id === 'captain').perks = [];
  advanceBattle(noBullseye);
  advanceBattle(bullseye.state);
  assert.equal(noBullseye.battle.lastEvent.type, 'miss');
  assert.equal(bullseye.battle.lastEvent.type, 'attack');

  const anticipation = battleWithCaptain([], 'hunting-bow');
  Object.assign(anticipation.captain, { rangedSkill: 15, q: 2, r: 2 });
  Object.assign(anticipation.target, { q: 5, r: 2, rangedDefense: 0 });
  anticipation.battle.rng = 2;
  const anticipated = structuredClone(anticipation.state);
  anticipated.battle.units.find(unit => unit.id === 'enemy-1').perks = ['anticipation'];
  advanceBattle(anticipation.state);
  advanceBattle(anticipated);
  assert.equal(anticipation.battle.lastEvent.type, 'attack');
  assert.equal(anticipated.battle.lastEvent.type, 'miss');

  const backstabber = battleWithCaptain([], 'arming-sword');
  Object.assign(backstabber.captain, { meleeSkill: 0 });
  Object.assign(backstabber.target, { meleeDefense: 0 });
  Object.assign(backstabber.byId('guard'), { q: 3, r: 1 });
  backstabber.battle.rng = 2;
  const flanking = structuredClone(backstabber.state);
  flanking.battle.units.find(unit => unit.id === 'captain').perks = ['backstabber'];
  advanceBattle(backstabber.state);
  advanceBattle(flanking);
  assert.equal(backstabber.battle.lastEvent.type, 'miss');
  assert.equal(flanking.battle.lastEvent.type, 'attack');

  const adaptation = battleWithCaptain(['fast-adaptation']);
  Object.assign(adaptation.captain, { meleeSkill: 0 });
  Object.assign(adaptation.target, { meleeDefense: 200 });
  adaptation.battle.rng = 0;
  advanceBattle(adaptation.state);
  assert.equal(adaptation.battle.lastEvent.type, 'miss');
  assert.equal(adaptation.captain.adaptation, 1);
  Object.assign(adaptation.captain, { ap: 4, meleeSkill: 200 });
  activate(adaptation.battle, 'captain');
  advanceBattle(adaptation.state);
  assert.equal(adaptation.battle.lastEvent.type, 'attack');
  assert.equal(adaptation.captain.adaptation, 0);
});

test('weapon masteries cover every bow and crossbow visual, including famed copies', () => {
  const ranged = ITEMS.filter(item => item.slot === 'weapon' && item.ranged && !item.throwing && item.visual?.includes('bow'));
  assert.ok(ranged.some(item => item.visual.includes('crossbow')));
  assert.ok(ranged.some(item => !item.visual.includes('crossbow')));
  for (const base of ranged) {
    for (const weaponId of [base.id, createFamedItemId(base.id, 17)]) {
      const perk = base.visual.includes('crossbow') ? 'crossbow-mastery' : 'bow-mastery';
      const mastered = battleWithCaptain([perk], weaponId);
      const weapon = ITEMS.find(item => item.id === base.id);
      const range = weapon.range + (perk === 'bow-mastery' ? 1 : 0);
      Object.assign(mastered.captain, { q: 2, r: 2, rangedSkill: 200 });
      Object.assign(mastered.target, { q: 2 + range, r: 2, rangedDefense: 0, bodyArmor: 100, maxBodyArmor: 100 });
      mastered.battle.rng = 0;
      advanceBattle(mastered.state);
      assert.equal(mastered.battle.lastEvent.type, 'attack', `${weaponId} should attack at mastery range`);
      const skillFatigue = mastered.battle.lastEvent.skillName === 'Piercing Bolt' ? 16
        : mastered.battle.lastEvent.skillName === 'Aimed Shot' ? 15 : weapon.fatigueCost ?? 9;
      assert.equal(mastered.captain.fatigue, Math.ceil(skillFatigue * .75), `${weaponId} mastery discounts the selected shot`);
    }
  }
});

test('damage, morale, and Recover perks have concrete battle effects', () => {
  const base = battleWithCaptain([]);
  Object.assign(base.captain, { meleeSkill: 200 });
  Object.assign(base.target, { hp: 80, maxHp: 100, morale: 80 });
  base.battle.rng = 0;
  const executioner = structuredClone(base.state);
  executioner.battle.units.find(unit => unit.id === 'captain').perks = ['executioner'];
  advanceBattle(base.state);
  advanceBattle(executioner);
  assert.ok(executioner.battle.lastEvent.hpDamage > base.battle.lastEvent.hpDamage);

  const head = battleWithCaptain([]);
  Object.assign(head.captain, { meleeSkill: 200 });
  Object.assign(head.target, { hp: 100, maxHp: 100 });
  head.battle.rng = 2;
  const brow = structuredClone(head.state);
  brow.battle.units.find(unit => unit.id === 'enemy-1').perks = ['steel-brow'];
  advanceBattle(head.state);
  advanceBattle(brow);
  assert.equal(head.battle.lastEvent.head, true);
  assert.ok(head.battle.lastEvent.hpDamage > brow.battle.lastEvent.hpDamage);

  const fear = battleWithCaptain(['fearsome']);
  Object.assign(fear.captain, { meleeSkill: 200 });
  Object.assign(fear.target, { hp: 100, maxHp: 100, morale: 80 });
  fear.battle.rng = 0;
  const ordinary = structuredClone(fear.state);
  ordinary.battle.units.find(unit => unit.id === 'captain').perks = [];
  const fortified = structuredClone(fear.state);
  fortified.battle.units.find(unit => unit.id === 'enemy-1').perks = ['fortified-mind'];
  advanceBattle(ordinary);
  advanceBattle(fear.state);
  advanceBattle(fortified);
  assert.ok(fear.target.morale < ordinary.battle.units.find(unit => unit.id === 'enemy-1').morale);
  assert.ok(fortified.battle.units.find(unit => unit.id === 'enemy-1').morale > fear.target.morale);

  const recovery = battleWithCaptain(['recover']);
  recovery.captain.fatigue = 95;
  recovery.captain.maxFatigue = 100;
  recovery.captain.turnStartedRound = recovery.battle.round;
  advanceBattle(recovery.state);
  assert.equal(recovery.battle.lastEvent.type, 'recover');
  assert.equal(recovery.captain.fatigue, 47);

});

test('Berserk grants 4 AP once per round without a second turn recovery and starts Killing Frenzy', () => {
  const fight = battleWithCaptain(['berserk', 'killing-frenzy']);
  const second = fight.battle.units.find(unit => unit.id === 'enemy-2');
  const third = fight.battle.units.find(unit => unit.id === 'enemy-3');
  second.alive = true;
  Object.assign(second, { hp: 1, maxHp: 100, q: 3, r: 1, bodyArmor: 0, headArmor: 0 });
  third.alive = true;
  Object.assign(third, { hp: 100, maxHp: 100, q: 8, r: 2, bodyArmor: 0, headArmor: 0 });
  Object.assign(fight.captain, { meleeSkill: 200 });
  Object.assign(fight.target, { hp: 1, maxHp: 100 });
  fight.battle.rng = 0;
  advanceBattle(fight.state);
  assert.equal(fight.target.alive, false);
  assert.equal(fight.battle.activeId, 'captain');
  assert.equal(fight.captain.ap, 9, 'Berserk adds 4 AP to the 5 left after a 4 AP attack');
  assert.equal(fight.captain.berserkRound, fight.battle.round);
  assert.equal(fight.captain.frenzyUntilRound, fight.battle.round + 2);
  assert.match(fight.battle.lastEvent.message, /Killing Frenzy: \+25% damage\. Berserk: \+4 AP\./);
  const reloaded = validateSave(JSON.parse(JSON.stringify(fight.state)));
  const fatigue = fight.captain.fatigue;
  advanceBattle(fight.state);
  advanceBattle(reloaded);
  assert.deepEqual(reloaded.battle, fight.state.battle, 'the immediate bonus action is identical after save and reload');
  assert.equal(fight.captain.fatigue, fatigue + 11, 'the bonus action does not repeat normal turn recovery');
  assert.equal(second.alive, false);
  assert.equal(third.alive, true);
  assert.doesNotMatch(fight.battle.lastEvent.message, /Berserk:/, 'Berserk cannot trigger twice in one round');
  assert.equal(fight.captain.ap, 5, 'the second kill earns no extra AP in the same round');
  for (let action = 0; action < 5 && fight.battle.activeId === 'captain'; action++) advanceBattle(fight.state);
  assert.notEqual(fight.battle.activeId, 'captain');
  assert.deepEqual(validateSave(fight.state), fight.state);
});

test('new battle saves accept the Berserk AP ceiling and reject larger forged values', () => {
  const state = createGame(252);
  beginBattle(state);
  const captain = state.battle.units.find(unit => unit.id === 'captain');
  captain.ap = 13;
  assert.equal(validateSave(JSON.parse(JSON.stringify(state))).battle.units.find(unit => unit.id === 'captain').ap, 13);
  const forged = structuredClone(state);
  forged.battle.units.find(unit => unit.id === 'captain').ap = 14;
  assert.throws(() => validateSave(forged), /Invalid save: battle stamina/);
});

test('Berserk keeps the 2 AP effect in legacy active battles', () => {
  const fight = battleWithCaptain(['berserk']);
  fight.battle.rulesVersion = 1;
  delete fight.battle.weaponSkillsVersion;
  for (const unit of fight.battle.units) {
    unit.ap = 2;
    delete unit.shieldWallActive;
    delete unit.aiTargetId;
    delete unit.formationMovedRound;
    delete unit.movementCredit;
    for (const key of ['spearwallActive', 'riposteActive', 'stunnedTurns', 'stunProtected', 'pendingBerserkAp']) delete unit[key];
  }
  Object.assign(fight.captain, { meleeSkill: 200 });
  Object.assign(fight.target, { hp: 1, maxHp: 100 });
  fight.battle.rng = 0;
  advanceBattle(fight.state);
  assert.equal(fight.captain.ap, 2);
  assert.match(fight.battle.lastEvent.message, /Berserk: \+2 AP\./);
  assert.equal(validateSave(fight.state).battle.units.find(unit => unit.id === 'captain').ap, 2);
});
