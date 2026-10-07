import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceBattle, createGame, getCampSites, getMoraleEffects, startBattle, validateSave,
  ITEMS, getItem, createFamedItemId, isMoraleImmune, camp, tick, retreatBattle, finishBattle,
  getLootShareQuote, unequipItem } from '../src/engine.js';
import { isAncientHelmet } from '../src/armory-themes.js';
import { getItemDetails } from '../src/item-details.js';
import { battleHTML } from '../src/battle-view.js';

function duel() {
  const state = createGame(251);
  const site = getCampSites(state)[0];
  state.position = { x: site.x, y: site.y };
  assert.equal(startBattle(state, site.id).ok, true);
  const battle = state.battle;
  for (const tile of battle.field.tiles) {
    tile.terrain = 'open';
    tile.height = 0;
  }
  const actor = battle.units.find(unit => unit.id === 'captain');
  const target = battle.units.find(unit => unit.id === 'enemy-1');
  Object.assign(actor, { q: 2, r: 2, fatigue: 0, morale: 50 });
  Object.assign(battle.units.find(unit => unit.id === 'scout'), { q: 1, r: 1 });
  Object.assign(battle.units.find(unit => unit.id === 'guard'), { q: 1, r: 2 });
  Object.assign(target, { q: 3, r: 2, hp: 300, maxHp: 300, bodyArmor: 0, headArmor: 0, fatigue: 0, morale: 80 });
  for (const enemy of battle.units.filter(unit => unit.side === 'enemy' && unit !== target)) {
    enemy.hp = 0;
    enemy.alive = false;
  }
  battle.turnIndex = battle.turnOrder.indexOf(actor.id);
  battle.activeId = actor.id;
  battle.rng = 0;
  return { state, battle, actor, target };
}

test('resolve and Fortified Mind resist the same wound stress without changing damage', () => {
  const low = duel();
  Object.assign(low.actor, { meleeSkill: 200 });
  low.target.resolve = 20;
  const high = structuredClone(low.state);
  high.battle.units.find(unit => unit.id === 'enemy-1').resolve = 100;
  const fortified = structuredClone(high);
  fortified.battle.units.find(unit => unit.id === 'enemy-1').perks = ['fortified-mind'];
  for (const state of [low.state, high, fortified]) assert.equal(advanceBattle(state).ok, true);
  const highTarget = high.battle.units.find(unit => unit.id === 'enemy-1');
  const fortifiedTarget = fortified.battle.units.find(unit => unit.id === 'enemy-1');
  assert.equal(low.battle.lastEvent.hpDamage, high.battle.lastEvent.hpDamage);
  assert.ok(low.target.morale < highTarget.morale);
  assert.ok(highTarget.morale < fortifiedTarget.morale);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(high))), high);
});

test('morale tiers change hit chance and defense on identical rolls', () => {
  assert.deepEqual([0, 24, 25, 49, 50, 79, 80, 100].map(morale => getMoraleEffects({ morale })), [
    { name: 'Breaking', modifier: -.2 }, { name: 'Breaking', modifier: -.2 },
    { name: 'Wavering', modifier: -.1 }, { name: 'Wavering', modifier: -.1 },
    { name: 'Steady', modifier: 0 }, { name: 'Steady', modifier: 0 },
    { name: 'Confident', modifier: .1 }, { name: 'Confident', modifier: .1 },
  ]);
  const steady = duel();
  Object.assign(steady.actor, { meleeSkill: 18, morale: 50 });
  Object.assign(steady.target, { meleeDefense: 15, morale: 50 });
  const confident = structuredClone(steady.state);
  confident.battle.units.find(unit => unit.id === 'captain').morale = 80;
  advanceBattle(steady.state);
  advanceBattle(confident);
  assert.equal(steady.battle.lastEvent.type, 'miss');
  assert.equal(confident.battle.lastEvent.type, 'attack');

  const normalDefense = duel();
  Object.assign(normalDefense.actor, { meleeSkill: 25, morale: 50 });
  Object.assign(normalDefense.target, { meleeDefense: 20, morale: 50 });
  const confidentDefense = structuredClone(normalDefense.state);
  confidentDefense.battle.units.find(unit => unit.id === 'enemy-1').morale = 80;
  advanceBattle(normalDefense.state);
  advanceBattle(confidentDefense);
  assert.equal(normalDefense.battle.lastEvent.type, 'attack');
  assert.equal(confidentDefense.battle.lastEvent.type, 'miss');
});

test('a kill rallies living allies, stresses surviving enemies, and clamps morale', () => {
  const { state, battle, actor, target } = duel();
  Object.assign(actor, { meleeSkill: 200, morale: 98 });
  Object.assign(target, { hp: 1, maxHp: 300 });
  const ally = battle.units.find(unit => unit.id === 'scout');
  ally.morale = 99;
  const enemyAlly = battle.units.find(unit => unit.id === 'enemy-2');
  Object.assign(enemyAlly, { hp: enemyAlly.maxHp, alive: true, morale: 5 });
  advanceBattle(state);
  assert.equal(target.alive, false);
  assert.equal(actor.morale, 100);
  assert.equal(ally.morale, 100);
  assert.equal(enemyAlly.morale, 0);
  assert.ok(battle.units.every(unit => Number.isInteger(unit.morale) && unit.morale >= 0 && unit.morale <= 100));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

function wearHelmet(state, unit, id = 'bb-ancient-legionary-helmet') {
  unit.equipment.helmet = id;
  const maximum = getItem(id).armor;
  if (state.battle) { unit.maxHeadArmor = maximum; unit.headArmor = maximum; }
  const person = state.party.find(p => p.id === unit.id);
  if (person) { person.equipment.helmet = id; person.armorDurability.head = maximum; }
}

test('all original and restored ancient helmets and their named variants give steady morale, even when damaged', () => {
  const helmets = ITEMS.filter(isAncientHelmet);
  assert.equal(helmets.length, 12);
  for (const helmet of helmets) for (const id of [helmet.id, ...[1,2,3].map(version => createFamedItemId(helmet.id, 10, version))]) {
    for (const morale of [0, 24, 50, 80, 100]) {
      const wearer = { morale, equipment: { helmet: id }, headArmor: 0 };
      assert.equal(isMoraleImmune(wearer), true);
      assert.deepEqual(getMoraleEffects(wearer), { name: 'Steady', modifier: 0 });
    }
    assert.match(getItemDetails(getItem(id)).notes.join(' '), /no positive or negative morale changes/);
  }
  assert.equal(isMoraleImmune({ equipment: { helmet: 'greathelm', armor: 'bb-ancient-mail' } }), false);
  assert.equal(isMoraleImmune({ equipment: { helmet: null } }), false);
  assert.ok(!getItemDetails(getItem('greathelm')).notes.some(note => /Morale immunity/.test(note)));
});

test('ancient helmets remove both morale bonuses and penalties from real attack and defense rolls', () => {
  for (const side of ['actor', 'target']) {
    const fixture = duel(); wearHelmet(fixture.state, fixture[side]);
    const events = [0, 50, 100].map(morale => {
      const state = structuredClone(fixture.state), unit = state.battle.units.find(u => u.id === fixture[side].id);
      unit.morale = morale;
      advanceBattle(state);
      return state.battle.lastEvent;
    });
    assert.deepEqual(events[0], events[1]);
    assert.deepEqual(events[2], events[1]);
  }
});

test('ancient helmets ignore wound stress and kill rallies on both sides, including save reloads', () => {
  const { state, battle, actor, target } = duel();
  wearHelmet(state, target); actor.meleeSkill = 200;
  const morale = target.morale;
  advanceBattle(state);
  assert.ok(battle.lastEvent.hpDamage > 0);
  assert.equal(target.morale, morale);
  assert.deepEqual(validateSave(structuredClone(state)), state);

  const kill = duel(); wearHelmet(kill.state, kill.actor);
  const scout = kill.battle.units.find(u => u.id === 'scout'); wearHelmet(kill.state, scout);
  const guard = kill.battle.units.find(u => u.id === 'guard'); guard.morale = 50;
  const enemy = kill.battle.units.find(u => u.id === 'enemy-2');
  Object.assign(enemy, { hp: enemy.maxHp, alive: true, morale: 10 }); wearHelmet(kill.state, enemy);
  Object.assign(kill.actor, { meleeSkill: 200, morale: 50 }); kill.target.hp = 1;
  const scoutMorale = scout.morale;
  advanceBattle(kill.state);
  assert.equal(kill.target.alive, false);
  assert.equal(kill.actor.morale, 50); assert.equal(scout.morale, scoutMorale);
  assert.equal(enemy.morale, 10); assert.equal(guard.morale, 52);
  assert.deepEqual(validateSave(structuredClone(kill.state)), kill.state);
});

test('ancient helmets stop automatic fleeing even with a saved successful flight roll', () => {
  const { state, battle, target } = duel(); wearHelmet(state, target);
  Object.assign(target, { q: 8, morale: 0, fleeRollRound: battle.round, fleeRound: battle.round });
  battle.activeId = target.id; battle.turnIndex = battle.turnOrder.indexOf(target.id); battle.rng = 0;
  const restored = validateSave(structuredClone(state));
  const html = battleHTML(restored.battle);
  assert.match(html, /Morale immune: no positive or negative morale changes/);
  assert.ok(!html.includes('title="Fleeing"'));
  advanceBattle(restored);
  assert.notEqual(restored.battle.lastEvent?.skillName, 'Flee');
  assert.ok(!restored.battle.units.find(u => u.id === target.id).escaped);
  assert.deepEqual(validateSave(structuredClone(restored)), restored);
});

test('ancient helmets ignore camp gains and shortage losses; removing one restores normal morale', () => {
  const state = createGame(251), wearer = state.party[0], normal = state.party[1];
  wearHelmet(state, wearer); wearer.morale = 50; normal.morale = 50;
  assert.equal(camp(state).ok, true);
  assert.equal(wearer.morale, 50); assert.equal(normal.morale, 59);
  state.hour = 23.75; state.food = 0; state.gold = 0;
  tick(state, .25);
  assert.equal(wearer.morale, 50); assert.equal(normal.morale, 37);
  assert.deepEqual(validateSave(structuredClone(state)), state);
  assert.equal(unequipItem(state, wearer.id, 'helmet').ok, true);
  wearer.morale = 80;
  assert.deepEqual(getMoraleEffects(wearer), { name: 'Confident', modifier: .1 });
  assert.equal(camp(state).ok, true); assert.equal(wearer.morale, 89);
});

test('ancient helmets ignore retreat penalties and loot morale rewards without suppressing other rewards', () => {
  const retreat = duel(); wearHelmet(retreat.state, retreat.actor);
  const hp = retreat.actor.hp;
  assert.equal(retreatBattle(retreat.state).ok, true);
  assert.equal(retreat.actor.morale, 50); assert.equal(retreat.actor.hp, hp - 5);
  assert.equal(finishBattle(retreat.state).ok, true);
  assert.equal(retreat.state.party.find(p => p.id === retreat.actor.id).morale, 50);
  assert.deepEqual(validateSave(structuredClone(retreat.state)), retreat.state);

  const victory = duel(); wearHelmet(victory.state, victory.actor);
  for (const unit of victory.battle.units.filter(u => u.side === 'enemy')) { unit.hp = 0; unit.alive = false; }
  advanceBattle(victory.state); assert.equal(victory.battle.status, 'victory');
  victory.battle.loot.items = ['plate-harness']; victory.battle.loot.itemConditions = [320];
  const quote = getLootShareQuote(victory.state, [0]), scout = victory.battle.units.find(u => u.id === 'scout');
  const normalMorale = scout.morale, xp = victory.state.party[0].xp;
  assert.ok(quote.morale > 0); assert.ok(quote.xp > 0);
  assert.equal(finishBattle(victory.state, { shareLootIndices: [0] }).ok, true);
  assert.equal(victory.state.party[0].morale, 50);
  assert.ok(victory.state.party[0].xp > xp);
  assert.equal(victory.state.party.find(p => p.id === scout.id).morale, Math.min(100, normalMorale + quote.morale));
  assert.deepEqual(validateSave(structuredClone(victory.state)), victory.state);
});
