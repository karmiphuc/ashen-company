import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, getCampSites, getRoamingBands, travelTo, tick, pursueBand,
  startBattle, advanceBattle, finishBattle, retreatBattle, recruit,
  getFormation, moveFormation, getItem, validateSave,
} from '../src/engine.js';

function approachCamp(state, site = getCampSites(state)[0]) {
  for(const patrol of Object.values(state.factionPatrols)){patrol.troops=[];patrol.defeatedUntil=(state.day-1)*24+state.hour+72;}
  const until = (state.day - 1) * 24 + state.hour + 48;
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = until;
  assert.equal(travelTo(state, site.x, site.y).ok, true);
  for (let step = 0; step < 12 && state.destination; step++) tick(state, 12);
  assert.equal(state.destination, null);
  return site;
}

function makeVictoryWithoutDamageSimulation(state) {
  for (const unit of state.battle.units.filter(entry => entry.side === 'enemy')) {
    unit.hp = 0;
    unit.alive = false;
  }
  const captain = state.battle.units.find(unit => unit.id === 'captain');
  state.battle.turnIndex = state.battle.turnOrder.indexOf(captain.id);
  state.battle.activeId = captain.id;
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(state.battle.status, 'victory');
}

function setLootTestGear(state) {
  const enemies = state.battle.units.filter(unit => unit.side === 'enemy');
  assert.ok(enemies.length >= 3);
  for (const [unit, armor, durability] of [
    [enemies[0], 'leather-vest', 20],
    [enemies[1], 'leather-vest', 18],
    [enemies[2], 'padded-gambeson', 0],
  ]) {
    unit.equipment.armor = armor;
    unit.maxBodyArmor = getItem(armor).armor;
    unit.bodyArmor = durability;
  }
  enemies[0].equipment.helmet = 'cloth-hood';
  enemies[0].maxHeadArmor = getItem('cloth-hood').armor;
  enemies[0].headArmor = 3;
}

test('formation saves 36 unique slots, recruits into a vacancy, and deploys by row', () => {
  const state = createGame(1201);
  const original = getFormation(state);
  assert.equal(original.length, 36);
  assert.equal(original.filter(Boolean).length, state.party.length);
  assert.deepEqual(new Set(original.filter(Boolean)), new Set(state.party.map(person => person.id)));
  assert.equal(original.slice(12).filter(Boolean).length, 0, 'the starter company has no ranged weapon yet');

  const captainSlot = original.indexOf('captain');
  assert.equal(moveFormation(state, captainSlot, 11).ok, true);
  assert.equal(getFormation(state)[11], 'captain');
  assert.equal(getFormation(state)[captainSlot], null);
  const beforeInvalid = structuredClone(state.formation);
  for (const [from, to] of [[-1, 0], [36, 0], [0, 36], [captainSlot, captainSlot]]) {
    assert.equal(moveFormation(state, from, to).ok, false);
    assert.deepEqual(state.formation, beforeInvalid);
  }

  assert.equal(recruit(state).ok, true);
  const captainPosition = getFormation(state).indexOf('captain');
  const guardPosition = getFormation(state).indexOf('guard');
  assert.equal(moveFormation(state, captainPosition, guardPosition).ok, true);
  assert.equal(getFormation(state)[captainPosition], 'guard');
  assert.equal(getFormation(state)[guardPosition], 'captain');
  const scoutSlot = getFormation(state).indexOf('scout');
  assert.equal(moveFormation(state, scoutSlot, 7).ok, true);
  assert.equal(getFormation(state)[7], 'scout');
  const formation = getFormation(state);
  assert.equal(formation.filter(Boolean).length, state.party.length);
  assert.equal(new Set(formation.filter(Boolean)).size, state.party.length);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);

  const site = approachCamp(state);
  assert.equal(startBattle(state, site.id).ok, true);
  const lockedFormation = structuredClone(state.formation);
  assert.equal(moveFormation(state, 0, 1).ok, false, 'formation cannot change during battle');
  assert.deepEqual(state.formation, lockedFormation);
  const expected = new Map(getFormation(state).flatMap((id, slot) => id ? [[id, { q: 2 - Math.floor(slot / 12), r: 6 + slot % 12 }]] : []));
  for (const unit of state.battle.units.filter(entry => entry.side === 'company')) {
    assert.deepEqual({ q: unit.q, r: unit.r }, expected.get(unit.id));
  }
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('all three formation ranks and outer rows deploy with flank space', () => {
  const state = createGame(1234);
  for (const [id, destination] of [['captain', 0], ['guard', 23], ['scout', 35]]) {
    assert.equal(moveFormation(state, getFormation(state).indexOf(id), destination).ok, true);
  }
  const site = approachCamp(state);
  assert.equal(startBattle(state, site.id).ok, true);
  for (const [id, q, r] of [['captain', 2, 6], ['guard', 1, 17], ['scout', 0, 17]]) {
    const unit = state.battle.units.find(unit => unit.id === id);
    assert.deepEqual({ q: unit.q, r: unit.r }, { q, r });
  }
  assert.equal(state.battle.field.rows, 24);
  assert.deepEqual(validateSave(structuredClone(state)), state);
});

test('old twelve-slot formations expand without moving an active eight-row battle', () => {
  const state = createGame(1235);
  const site = approachCamp(state);
  startBattle(state, site.id);
  state.formation = Array(12).fill(null);
  state.formation[0] = 'captain';
  state.formation[5] = 'guard';
  state.formation[11] = 'scout';
  state.battle.field.columns = 14;
  state.battle.field.rows = 8;
  delete state.battle.escapeRulesVersion;
  state.battle.field.tiles = state.battle.field.tiles.filter(tile => tile.r < 8 && tile.q < 14).map(tile=>({...tile,terrain:'open'}));
  state.battle.units.forEach((unit, index) => { unit.r = index % 6 + 1; });
  const originalBattle = structuredClone(state.battle);
  const restored = validateSave(state);
  assert.equal(restored.formation.length, 36);
  assert.equal(restored.formation[3], 'captain');
  assert.equal(restored.formation[8], 'guard');
  assert.equal(restored.formation[32], 'scout');
  assert.deepEqual(restored.battle, originalBattle);
  assert.deepEqual(validateSave(restored), restored);
});

test('a fallen member leaves an empty formation slot while survivors retain order', () => {
  const state = createGame(1202);
  const site = approachCamp(state);
  assert.equal(startBattle(state, site.id).ok, true);
  const fallen = state.battle.units.find(unit => unit.id === 'scout');
  fallen.hp = 0;
  fallen.alive = false;
  makeVictoryWithoutDamageSimulation(state);
  assert.equal(finishBattle(state).ok, true);
  assert.equal(state.party.some(person => person.id === 'scout'), false);
  assert.equal(getFormation(state).includes('scout'), false);
  assert.equal(getFormation(state).filter(Boolean).length, state.party.length);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
  assert.equal(moveFormation(state, 0, 1).ok, false, 'an empty source cannot be moved');
});

test('victory salvage retains damaged armor condition, excludes ruined armor, and claims duplicate IDs once', () => {
  let foundDuplicate = null;
  for (let seed = 1; seed <= 256 && !foundDuplicate; seed++) {
    const state = createGame(seed);
    const site = approachCamp(state);
    assert.equal(startBattle(state, site.id).ok, true);
    setLootTestGear(state);
    const lootSeed = state.battle.lootSeed;
    makeVictoryWithoutDamageSimulation(state);
    const { items, itemConditions } = state.battle.loot;
    assert.equal(items.length, itemConditions.length);
    assert.equal(items.includes('padded-gambeson'), false, 'armor below one-quarter condition is not salvaged');
    for (let index = 0; index < items.length; index++) {
      const item = getItem(items[index]);
      const condition = itemConditions[index];
      if (item.slot === 'armor' || item.slot === 'attachment' || item.slot === 'helmet') {
        assert.ok(Number.isInteger(condition) && condition >= 0 && condition <= item.armor);
      } else assert.equal(condition, null);
    }
    for (let first = 0; first < items.length; first++) {
      for (let second = first + 1; second < items.length; second++) {
        if (items[first] === 'leather-vest' && items[second] === 'leather-vest' && itemConditions[first] === 20 && itemConditions[second] === 18) {
          foundDuplicate = { state, lootSeed, items: [...items], conditions: [...itemConditions] };
        }
      }
    }
  }
  assert.ok(foundDuplicate, 'deterministic salvage should preserve two copies at different condition');
  const { state, lootSeed, items, conditions } = foundDuplicate;
  assert.equal(state.battle.lootSeed, lootSeed);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.battle.loot.items, items);
  assert.deepEqual(restored.battle.loot.itemConditions, conditions);
  const previousInventoryLength = restored.inventory.length;
  assert.equal(finishBattle(restored).ok, true);
  assert.deepEqual(restored.inventory.slice(previousInventoryLength), items);
  assert.deepEqual(restored.inventoryCondition.slice(previousInventoryLength), conditions);
  const claimed = structuredClone(restored);
  assert.equal(finishBattle(restored).ok, false);
  assert.deepEqual(restored, claimed, 'claiming the same salvage twice changes nothing');
  assert.deepEqual(validateSave(restored), restored);
});

test('loot roll seed is stable across retreat, reload, and battle RNG changes', () => {
  const state = createGame(1203);
  const site = approachCamp(state);
  assert.equal(startBattle(state, site.id).ok, true);
  const initialLootSeed = state.battle.lootSeed;
  assert.equal(retreatBattle(state).ok, true);
  assert.equal(finishBattle(state).ok, true);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(startBattle(restored, site.id).ok, true);
  assert.equal(restored.battle.lootSeed, initialLootSeed);
  restored.battle.rng = 1;
  const comparison = structuredClone(restored);
  comparison.battle.rng = 0xffffffff;
  setLootTestGear(restored);
  setLootTestGear(comparison);
  makeVictoryWithoutDamageSimulation(restored);
  makeVictoryWithoutDamageSimulation(comparison);
  assert.deepEqual(restored.battle.loot, comparison.battle.loot);
});

test('victory supplies stay bounded and camp medicine rolls cover zero, one, and two', () => {
  const medicineRolls = new Set();
  const assertLootBounds = loot => {
    assert.ok(Number.isSafeInteger(loot.gold) && loot.gold > 0 && loot.gold <= 100000);
    for (const key of ['food', 'tools', 'ammo']) assert.ok(Number.isSafeInteger(loot[key]) && loot[key] > 0 && loot[key] <= 1000);
    assert.ok(Number.isSafeInteger(loot.medicine) && loot.medicine >= 0 && loot.medicine <= 2);
    assert.ok(Array.isArray(loot.items) && loot.items.length <= 24);
    assert.equal(loot.items.length, loot.itemConditions.length);
  };
  for (let seed = 1; seed <= 8; seed++) {
    const state = createGame(seed);
    const site = approachCamp(state);
    assert.equal(startBattle(state, site.id).ok, true);
    makeVictoryWithoutDamageSimulation(state);
    assertLootBounds(state.battle.loot);
    medicineRolls.add(state.battle.loot.medicine);
  }
  for (let seed = 1; seed <= 12; seed++) {
    const state = createGame(seed);
    const origin = state.position;
    const site = getCampSites(state).filter(entry => entry.difficulty >= 2)
      .sort((a, b) => Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y))[0];
    assert.ok(site, 'a higher-difficulty camp is available');
    approachCamp(state, site);
    assert.equal(startBattle(state, site.id).ok, true);
    makeVictoryWithoutDamageSimulation(state);
    assertLootBounds(state.battle.loot);
    medicineRolls.add(state.battle.loot.medicine);
  }
  assert.deepEqual([...medicineRolls].sort(), [0, 1, 2]);
});

test('patrol contact starts battle immediately without spending additional world time', () => {
  const near = createGame(1204);
  const band = getRoamingBands(near).find(entry => entry.id === 'road-thieves');
  near.position = { x: band.x, y: band.y };
  const before = { day: near.day, hour: near.hour };
  assert.equal(pursueBand(near, band.id).ok, true);
  assert.equal(near.battle?.campId, band.id);
  assert.equal(near.battle?.encounterType, 'band');
  assert.deepEqual({ day: near.day, hour: near.hour }, before);
  assert.equal(near.destination, null);
  assert.equal(near.pursuit, null);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(near))), near);

  const chasing = createGame(1205);
  assert.equal(pursueBand(chasing, 'frontier-veterans').ok, true);
  const startHours = (chasing.day - 1) * 24 + chasing.hour;
  let requestedHours = 0;
  while (!chasing.battle && requestedHours < 72) {
    assert.equal(tick(chasing, 12).ok, true);
    requestedHours += 12;
  }
  assert.ok(chasing.battle, 'the pursuit eventually catches the patrol');
  const elapsed = (chasing.day - 1) * 24 + chasing.hour - startHours;
  assert.ok(elapsed > 0 && elapsed < requestedHours, 'remaining time in the tick call is not consumed after contact');
});

test('legacy formations and loot migrate while malformed formation or condition arrays fail', () => {
  const old = createGame(1206);
  const site = approachCamp(old);
  assert.equal(startBattle(old, site.id).ok, true);
  const captain = old.battle.units.find(unit => unit.id === 'captain');
  Object.assign(captain, { q: 2, r: 5 });
  const oldPosition = { q: captain.q, r: captain.r };
  old.battle.loot.items = ['leather-vest', 'arming-sword'];
  delete old.battle.loot.itemConditions;
  delete old.battle.lootSeed;
  delete old.formation;
  const migrated = validateSave(old);
  assert.equal(migrated.battle.loot.itemConditions[0], getItem('leather-vest').armor);
  assert.equal(migrated.battle.loot.itemConditions[1], null);
  assert.deepEqual(
    (({ q, r }) => ({ q, r }))(migrated.battle.units.find(unit => unit.id === 'captain')),
    oldPosition,
  );
  assert.equal(migrated.formation.filter(Boolean).length, migrated.party.length);
  assert.deepEqual(validateSave(migrated), migrated);

  for (const mutate of [
    save => { save.formation[0] = 'captain'; },
    save => { save.formation[save.formation.indexOf('captain')] = null; },
    save => { save.formation.pop(); },
    save => { save.battle.loot.itemConditions.pop(); },
    save => { save.battle.loot.itemConditions[0] = getItem('leather-vest').armor + 1; },
    save => { save.battle.loot.itemConditions[1] = 0; },
  ]) {
    const corrupted = structuredClone(migrated);
    mutate(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
});
