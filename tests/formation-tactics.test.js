import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, getCampSites, travelTo, tick, startBattle, advanceBattle,
  setBattleTactic, validateSave, resolveBattle,
} from '../src/engine.js';

function start(state) {
  const until = (state.day - 1) * 24 + state.hour + 48;
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = until;
  const site = getCampSites(state)[0];
  assert.equal(travelTo(state, site.x, site.y).ok, true);
  while (state.destination) tick(state, 12);
  assert.equal(startBattle(state, site.id).ok, true);
}

function activate(battle, id) {
  battle.turnIndex = battle.turnOrder.indexOf(id);
  battle.activeId = id;
}

test('advance formation moves one hex per round without rear ranks catching a stationary front', () => {
  const state = createGame(4101);
  state.party.find(person => person.id === 'scout').equipment.weapon = 'hunting-bow';
  const scoutSlot = state.formation.indexOf('scout');
  [state.formation[scoutSlot], state.formation[6]] = [state.formation[6], state.formation[scoutSlot]];
  assert.equal(setBattleTactic(state, 'advance-formation').ok, true);
  start(state);
  const battle = state.battle;
  const company = battle.units.filter(unit => unit.side === 'company');
  const origins = new Map(company.map(unit => [unit.id, unit.q]));
  const firstRound = battle.round;
  while (battle.round === firstRound) advanceBattle(state);
  for (const unit of company) assert.equal(unit.q, origins.get(unit.id) + 1, `${unit.id} completed the first bound`);
  const scout = company.find(unit => unit.id === 'scout');
  assert.equal(scout.q, origins.get('scout') + 1, 'the archer advances even while targets are in bow range');

  const secondRound = battle.round;
  company.find(unit => unit.id === 'captain').reload = 1;
  while (battle.round === secondRound) advanceBattle(state);
  for (const unit of company) assert.equal(unit.q, origins.get(unit.id) + 2, `${unit.id} moves at most once and reload does not break the bound`);

  const front = Math.max(...company.map(unit => unit.q));
  const foe = battle.units.find(unit => unit.side === 'enemy');
  Object.assign(foe, { q: front + 1, r: company.find(unit => unit.q === front).r, hp: 300, maxHp: 300, meleeDefense: 300 });
  const beforeContactRound = new Map(company.map(unit => [unit.id, unit.q]));
  const contactRound = battle.round;
  while (battle.round === contactRound && battle.status === 'active') advanceBattle(state);
  for (const unit of company.filter(unit => unit.alive)) assert.equal(unit.q, beforeContactRound.get(unit.id), 'contact prevents a new bound');
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('a late completed bound cannot give its last mover a second formation step that round', () => {
  const state = createGame(4106);
  setBattleTactic(state, 'advance-formation');
  start(state);
  const battle = state.battle;
  const captain = battle.units.find(unit => unit.id === 'captain');
  for (const ally of battle.units.filter(unit => unit.side === 'company' && unit.id !== captain.id)) {
    ally.hp = 0;
    ally.alive = false;
  }
  activate(battle, captain.id);
  advanceBattle(state);
  const afterBound = { q: captain.q, r: captain.r };
  assert.equal(battle.formationAdvance.completedRound, battle.round);
  captain.ap = 2;
  activate(battle, captain.id);
  advanceBattle(state);
  assert.deepEqual({ q: captain.q, r: captain.r }, afterBound, 'bonus action does not open another bound');
});

test('shield wall deploys shield sets forward without changing company formation', () => {
  const state = createGame(4102);
  const captain = state.party.find(person => person.id === 'captain');
  captain.equipment = { ...captain.equipment, weapon: 'billhook', shield: null };
  captain.reserveEquipment = { weapon: 'arming-sword', shield: 'kite-shield' };
  const scout = state.party.find(person => person.id === 'scout');
  scout.equipment = { ...scout.equipment, weapon: 'hunting-bow', shield: null };
  const savedFormation = structuredClone(state.formation);
  setBattleTactic(state, 'shield-wall');
  start(state);
  const byId = id => state.battle.units.find(unit => unit.id === id);
  assert.equal(byId('captain').q, 2, 'a reserve shield qualifies for front duty');
  assert.equal(byId('guard').q, 2);
  assert.ok(byId('scout').q < 2, 'a pure bow remains behind the wall');
  assert.deepEqual(state.formation, savedFormation, 'battle deployment does not rewrite the saved company formation');

  activate(state.battle, 'captain');
  advanceBattle(state);
  assert.equal(byId('captain').equipment.shield, 'kite-shield');
  assert.equal(byId('captain').equipment.weapon, 'arming-sword');
  activate(state.battle, 'captain');
  advanceBattle(state);
  assert.equal(byId('captain').equipment.shield, 'kite-shield', 'ordinary approach AI retains the wall set');
});

test('bows and crossbows stay rear despite a shield reserve, and full deployments stay bounded', () => {
  for (const rangedWeapon of ['hunting-bow', 'light-crossbow']) {
    const state = createGame(`rear-${rangedWeapon}`);
    const scout = state.party.find(person => person.id === 'scout');
    scout.equipment = { ...scout.equipment, weapon: rangedWeapon, shield: null };
    scout.reserveEquipment = { weapon: 'arming-sword', shield: 'round-shield' };
    setBattleTactic(state, 'shield-wall');
    start(state);
    const unit = state.battle.units.find(entry => entry.id === 'scout');
    assert.ok(unit.q < 2, `${rangedWeapon} deployed behind the wall`);
    activate(state.battle, unit.id);
    advanceBattle(state);
    assert.equal(unit.equipment.weapon, rangedWeapon, `${rangedWeapon} was not replaced by its shield reserve`);
    assert.equal(unit.equipment.shield, null);
  }

  for (const allRanged of [false, true]) {
    const state = createGame(`full-${allRanged}`);
    const source = state.party[0];
    state.party = Array.from({ length: 12 }, (_, index) => ({
      ...structuredClone(source), id: `member-${index}`, name: `Member ${index}`, seed: source.seed + index + 1,
      equipment: { ...source.equipment, weapon: allRanged ? 'hunting-bow' : 'arming-sword', shield: allRanged ? null : 'round-shield' },
      reserveEquipment: { weapon: null, shield: null },
    }));
    state.formation = state.party.map(person => person.id);
    setBattleTactic(state, 'shield-wall');
    start(state);
    const company = state.battle.units.filter(unit => unit.side === 'company');
    assert.equal(new Set(company.map(unit => `${unit.q},${unit.r}`)).size, 12);
    assert.ok(company.every(unit => unit.q >= 0 && unit.q < state.battle.field.columns && unit.r >= 0 && unit.r < state.battle.field.rows));
  }
});

test('switching to shield wall reforms through legal moves and no-shield companies remain orderly', () => {
  const state = createGame(4103);
  start(state);
  const battle = state.battle;
  const captain = battle.units.find(unit => unit.id === 'captain');
  const guard = battle.units.find(unit => unit.id === 'guard');
  captain.equipment.weapon = 'billhook';
  captain.equipment.shield = null;
  Object.assign(captain, { q: 3, r: 2 });
  Object.assign(guard, { q: 2, r: 4 });
  setBattleTactic(state, 'shield-wall');
  activate(battle, 'captain');
  const captainFrom = { q: captain.q, r: captain.r };
  advanceBattle(state);
  assert.equal(Math.abs(captain.q - captainFrom.q) + Math.abs(captain.r - captainFrom.r) <= 2, true);
  assert.equal(captain.q, 2, 'unshielded two-hander physically yields the front rank');
  activate(battle, 'guard');
  advanceBattle(state);
  assert.equal(guard.q, 3, 'shield bearer physically steps into the front rank');

  const noShields = createGame(4104);
  for (const person of noShields.party) {
    person.equipment.shield = null;
    person.reserveEquipment.shield = null;
  }
  setBattleTactic(noShields, 'shield-wall');
  start(noShields);
  assert.ok(noShields.battle.units.filter(unit => unit.side === 'company').every(unit => unit.meleeDefense < 100));
  assert.equal(validateSave(JSON.parse(JSON.stringify(noShields))).tactic, 'shield-wall');
});

test('new tactics switch and reload safely, reject malformed plans, and finish ranged standoffs', () => {
  const switching = createGame(4105);
  start(switching);
  setBattleTactic(switching, 'advance-formation');
  advanceBattle(switching);
  let restored = validateSave(JSON.parse(JSON.stringify(switching)));
  assert.equal(restored.tactic, 'advance-formation');
  assert.ok(restored.battle.formationAdvance);
  setBattleTactic(restored, 'shield-wall');
  restored = validateSave(JSON.parse(JSON.stringify(restored)));
  assert.equal(restored.battle.tactic, 'shield-wall');
  assert.ok(restored.battle.formationAdvance);
  const malformed = structuredClone(restored);
  malformed.battle.formationAdvance.direction = 'teleport';
  assert.throws(() => validateSave(malformed), /Invalid save/);
  for (const mutate of [
    save => { save.battle.formationAdvance.step = 14; },
    save => {
      const [first, second] = save.battle.units.filter(unit => unit.side === 'company' && unit.alive);
      save.battle.formationAdvance.origins[second.id] = { ...save.battle.formationAdvance.origins[first.id] };
    },
    save => {
      const first = save.battle.units.find(unit => unit.side === 'company' && unit.alive);
      save.battle.formationAdvance.direction = 'w';
      save.battle.formationAdvance.origins[first.id].q = 0;
    },
  ]) {
    const bad = structuredClone(restored);
    mutate(bad);
    assert.throws(() => validateSave(bad), /Invalid save/);
  }

  for (const tactic of ['advance-formation', 'shield-wall']) {
    for (const seed of [1, 2, 8, 17]) {
      const state = createGame(seed);
      state.supplies.ammo = 0;
      setBattleTactic(state, tactic);
      start(state);
      assert.equal(resolveBattle(state).ok, true, `${tactic}/${seed} resolves without a ranged standoff`);
    }
  }
});

test('shield-wall archer retreat refreshes the saved bound plan and still resolves', () => {
  let state = createGame(4107);
  state.party.find(person => person.id === 'scout').equipment.weapon = 'hunting-bow';
  setBattleTactic(state, 'shield-wall');
  start(state);
  const battle = state.battle;
  const scout = battle.units.find(unit => unit.id === 'scout');
  const enemy = battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(scout, { q: 1, r: 3 });
  Object.assign(enemy, { q: 2, r: 3 });
  for (const [index, other] of battle.units.filter(unit => unit.side === 'enemy' && unit.id !== enemy.id).entries()) {
    Object.assign(other, { q: 10 + index, r: 5 + index });
  }
  setBattleTactic(state, 'focus');
  setBattleTactic(state, 'shield-wall');
  const before = { q: scout.q, r: scout.r };
  activate(battle, scout.id);
  advanceBattle(state);
  assert.notDeepEqual({ q: scout.q, r: scout.r }, before, 'the pressured archer retreats legally');
  assert.deepEqual(battle.formationAdvance.origins[scout.id], { q: scout.q, r: scout.r }, 'the wall plan follows the off-plan retreat');
  state = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(resolveBattle(state).ok, true, 'the reloaded wall does not retain a stale target row');
});
