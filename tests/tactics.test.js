import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, createGame, getCampSites, getRoamingBands, getMarket, buyItem,
  travelTo, tick, pursueBand, startBattle, advanceBattle, resolveBattle,
  setBattleTactic, validateSave,
} from '../src/engine.js';

function approach(state, id = 'quarry-camp') {
  const until = (state.day - 1) * 24 + state.hour + 48;
  for (const [bandId, progress] of Object.entries(state.bands)) {
    if (bandId !== id) progress.defeatedUntil = until;
  }
  if (state.bands[id]) state.bands[id].defeatedUntil = 0;
  if (id === 'quarry-camp') {
    const site = getCampSites(state)[0];
    assert.equal(travelTo(state, site.x, site.y).ok, true);
  } else assert.equal(pursueBand(state, id).ok, true);
  for (let step = 0; step < 12 && state.destination; step++) tick(state, 12);
  assert.equal(state.destination, null);
  if (id === 'quarry-camp') assert.equal(startBattle(state, id).ok, true);
  else assert.equal(state.battle?.campId, id, 'catching a patrol starts its battle');
}

function activate(battle, id) {
  battle.turnIndex = battle.turnOrder.indexOf(id);
  battle.activeId = id;
}

test('offense advances, defense holds, and active tactics can change safely', () => {
  const offense = createGame(1);
  const defense = createGame(1);
  assert.equal(offense.tactic, 'offense');
  assert.equal(setBattleTactic(defense, 'defense').ok, true);
  approach(offense);
  approach(defense);
  assert.equal(defense.battle.tactic, 'defense');
  assert.equal(advanceBattle(offense).ok, true);
  assert.equal(advanceBattle(defense).ok, true);
  assert.equal(offense.battle.lastEvent.type, 'move');
  assert.equal(defense.battle.lastEvent.type, 'hold');
  assert.notDeepEqual(offense.battle.lastEvent.from, offense.battle.lastEvent.to);
  assert.deepEqual(defense.battle.lastEvent.from, defense.battle.lastEvent.to);
  const contactRound = defense.battle.lastContactRound;
  assert.equal(setBattleTactic(defense, 'defense').ok, true);
  assert.equal(defense.battle.lastContactRound, contactRound);
  assert.equal(setBattleTactic(defense, 'focus').ok, true);
  assert.equal(defense.battle.tactic, 'focus');
  assert.equal(setBattleTactic(defense, 'wrong').ok, false);
  assert.equal(defense.battle.tactic, 'focus');
  assert.deepEqual(validateSave(defense), defense);
});

test('defense keeps the line while engaged, then moves against a ranged standoff', () => {
  const state = createGame(4);
  setBattleTactic(state, 'defense');
  approach(state);
  const bowman = state.battle.units.find(unit => unit.id === 'enemy-3');
  for (const enemy of state.battle.units.filter(unit => unit.side === 'enemy' && unit !== bowman)) {
    enemy.hp = 0;
    enemy.alive = false;
  }
  let firstMoveRound = null;
  let holds = 0;
  for (let turn = 0; turn < 80 && firstMoveRound === null; turn++) {
    assert.equal(advanceBattle(state).ok, true);
    const event = state.battle.lastEvent;
    if (event.actorId && state.party.some(person => person.id === event.actorId)) {
      if (event.type === 'hold') holds += 1;
      if (event.type === 'move') firstMoveRound = state.battle.round;
    }
  }
  assert.ok(holds >= 4);
  assert.ok(firstMoveRound >= 5);
});

test('focus survives an enemy turn and keeps attacks on a shared target', () => {
  const state = createGame(5);
  setBattleTactic(state, 'focus');
  approach(state);
  const byId = id => state.battle.units.find(unit => unit.id === id);
  Object.assign(byId('guard'), { q: 1, r: 1 });
  Object.assign(byId('captain'), { q: 2, r: 2 });
  Object.assign(byId('scout'), { q: 2, r: 3 });
  Object.assign(byId('enemy-1'), { q: 3, r: 2, hp: 37, bodyArmor: 20 });
  Object.assign(byId('enemy-2'), { q: 1, r: 3, hp: 37, bodyArmor: 0 });
  Object.assign(byId('enemy-3'), { q: 8, r: 4 });
  state.battle.turnOrder = ['captain', 'enemy-1', 'scout', ...state.battle.turnOrder.filter(id => !['captain', 'enemy-1', 'scout'].includes(id))];
  activate(state.battle, 'captain');
  advanceBattle(state);
  assert.equal(state.battle.focusTargetId, 'enemy-2');
  assert.equal(state.battle.lastEvent.targetId, 'enemy-2');
  byId('enemy-1').hp = 1;
  advanceBattle(state);
  assert.equal(state.battle.focusTargetId, 'enemy-2');
  advanceBattle(state);
  assert.equal(state.battle.lastEvent.targetId, 'enemy-2');
  assert.deepEqual(validateSave(state), state);
});

test('new weapons have working reach, piercing, bolts, reload, and town stock', () => {
  const ids = ['bludgeon', 'rondel-dagger', 'light-crossbow', 'billhook', 'padded-gambeson', 'reinforced-mail', 'bascinet'];
  for (const id of ids) assert.ok(ITEMS.some(item => item.id === id));
  const market = getMarket(createGame(1));
  for (const id of ids) assert.ok(market.equipment.find(entry => entry.itemId === id));
  const bought = createGame(2);
  assert.equal(buyItem(bought, 'billhook').ok, true);

  const polearm = createGame(3);
  polearm.party[0].equipment.weapon = 'billhook';
  polearm.party[0].equipment.shield = null;
  approach(polearm);
  const poleActor = polearm.battle.units.find(unit => unit.id === 'captain');
  const poleTarget = polearm.battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(poleActor, { q: 2, r: 2 });
  Object.assign(poleTarget, { q: 4, r: 2 });
  activate(polearm.battle, 'captain');
  const ammo = polearm.supplies.ammo;
  advanceBattle(polearm);
  assert.equal(polearm.battle.lastEvent.weaponId, 'billhook');
  assert.equal(polearm.battle.lastEvent.ranged, false);
  assert.deepEqual(polearm.battle.lastEvent.from, { q: 2, r: 2 });
  assert.deepEqual(polearm.battle.lastEvent.to, { q: 4, r: 2 });
  assert.equal(polearm.supplies.ammo, ammo);

  const crossbow = createGame(4);
  crossbow.party[0].equipment.weapon = 'light-crossbow';
  crossbow.party[0].equipment.shield = null;
  approach(crossbow);
  const archer = crossbow.battle.units.find(unit => unit.id === 'captain');
  const target = crossbow.battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(crossbow.battle.units.find(unit => unit.id === 'guard'), { q: 1, r: 1 });
  Object.assign(archer, { q: 2, r: 2 });
  Object.assign(target, { q: 6, r: 2 });
  activate(crossbow.battle, 'captain');
  const arrows = crossbow.supplies.ammo;
  advanceBattle(crossbow);
  assert.equal(crossbow.supplies.ammo, arrows - 1);
  assert.equal(crossbow.battle.lastEvent.projectile, 'bolt');
  assert.equal(archer.reload, 1);
  activate(crossbow.battle, 'captain');
  advanceBattle(crossbow);
  assert.equal(crossbow.battle.lastEvent.type, 'recover');
  assert.equal(crossbow.battle.lastEvent.projectile, null);
  assert.equal(archer.reload, 0);
  assert.deepEqual(validateSave(crossbow), crossbow);

  const comparePiercing = weaponId => {
    const state = createGame(8);
    state.party[0].equipment.weapon = weaponId;
    approach(state);
    const actor = state.battle.units.find(unit => unit.id === 'captain');
    const foe = state.battle.units.find(unit => unit.id === 'enemy-1');
    Object.assign(actor, { q: 2, r: 2, meleeSkill: 200 });
    Object.assign(foe, { q: 3, r: 2, equipment: { ...foe.equipment, armor: 'plate-harness' }, bodyArmor: 300, maxBodyArmor: 300 });
    state.battle.rng = 0;
    activate(state.battle, 'captain');
    advanceBattle(state);
    return state.battle.lastEvent.hpDamage;
  };
  assert.ok(comparePiercing('rondel-dagger') > comparePiercing('arming-sword'));
});

test('legacy markets and active battles migrate; malformed tactical records fail', () => {
  const old = createGame(6);
  buyItem(old, 'spear');
  for (const id of ['bludgeon', 'rondel-dagger', 'light-crossbow', 'billhook', 'padded-gambeson', 'reinforced-mail', 'bascinet']) delete old.marketStock.oakwatch.equipment[id];
  delete old.tactic;
  approach(old);
  advanceBattle(old);
  delete old.battle.tactic;
  delete old.battle.focusTargetId;
  delete old.battle.lastContactRound;
  delete old.battle.engaged;
  for (const unit of old.battle.units) delete unit.reload;
  old.battle.lastEvent = { actorId: old.battle.lastEvent.actorId, targetId: old.battle.lastEvent.targetId, type: 'hit', message: 'Old hit.', hpDamage: 3, armorDamage: 4 };
  const migrated = validateSave(old);
  assert.equal(migrated.tactic, 'offense');
  assert.equal(migrated.battle.tactic, 'offense');
  assert.equal(migrated.battle.engaged, false);
  assert.equal(migrated.battle.lastEvent.type, 'attack');
  assert.ok(migrated.marketStock.oakwatch.equipment['light-crossbow'] >= 0);
  assert.equal(migrated.battle.units[0].reload, 0);
  assert.deepEqual(validateSave(migrated), migrated);
  for (const mutate of [
    save => { save.tactic = 'invalid'; },
    save => { save.battle.tactic = 'invalid'; },
    save => { save.battle.lastContactRound = 999; },
    save => { save.battle.units[0].reload = -1; },
    save => { save.battle.lastEvent.from = { q: NaN, r: 2 }; },
    save => { save.battle.lastEvent.projectile = 'laser'; },
  ]) {
    const bad = structuredClone(migrated);
    mutate(bad);
    assert.throws(() => validateSave(bad), /Invalid save/);
  }
});

test('every tactical event remains serializable through a complete battle', () => {
  for (const tactic of ['offense', 'defense', 'focus']) {
    let state = createGame(7);
    setBattleTactic(state, tactic);
    approach(state);
    for (let turn = 0; turn < 200 && state.battle.status === 'active'; turn++) {
      assert.equal(advanceBattle(state).ok, true);
      state = validateSave(JSON.parse(JSON.stringify(state)));
    }
    assert.equal(state.battle.status, 'victory');
  }
});

test('all tactics resolve early encounters across seeded companies', () => {
  for (const tactic of ['offense', 'defense', 'focus']) {
    for (const encounter of ['road-thieves', 'quarry-camp']) {
      let wins = 0;
      let fullRosters = 0;
      for (let seed = 1; seed <= 50; seed++) {
        const state = createGame(seed);
        setBattleTactic(state, tactic);
        approach(state, encounter);
        assert.equal(resolveBattle(state).ok, true);
        wins += Number(state.battle.status === 'victory');
        fullRosters += Number(state.battle.units.filter(unit => unit.side === 'company').every(unit => unit.alive));
      }
      assert.equal(wins, 50, `${tactic} should win ${encounter}`);
      assert.ok(fullRosters >= (encounter === 'quarry-camp' ? 43 : 49), `${tactic} should preserve the company against ${encounter}`);
    }
  }
});
