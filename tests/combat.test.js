import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, getCampSites, acceptContract, travelTo, tick,
  startBattle, advanceBattle, resolveBattle, retreatBattle, finishBattle,
  getCompanyStats, getMarket, buyItem, buyFood, buySupplies, equipItem, unequipItem,
  camp, forage, getLevelUp, trainAttributes, validateSave,
} from '../src/engine.js';
import { findOffer } from './helpers/contract-offers.js';

function approach(state, site) {
  const until = (state.day - 1) * 24 + state.hour + 48;
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = until;
  assert.equal(travelTo(state, site.x, site.y).ok, true);
  for (let i = 0; i < 8 && state.destination; i++) tick(state, 12);
  assert.equal(state.destination, null);
}

test('the first camp is reachable and a deterministic battle survives save/load', () => {
  const first = createGame(1);
  const campSite = getCampSites(first)[0];
  assert.equal(campSite.cleared, false);
  approach(first, campSite);
  assert.equal(startBattle(first, campSite.id).ok, true);
  assert.equal(first.battle.status, 'active');
  assert.equal(first.battle.units.length, 6);
  assert.equal(first.battle.field.columns, 22);
  assert.equal(first.battle.field.rows, 24);
  assert.ok(first.battle.units.every(unit => unit.q >= 0 && unit.q < 22 && unit.r >= 0 && unit.r < 24));
  assert.equal(advanceBattle(first).ok, true);
  assert.deepEqual(validateSave(first), first);

  const restored = validateSave(JSON.parse(JSON.stringify(first)));
  assert.equal(resolveBattle(first).ok, true);
  assert.equal(resolveBattle(restored).ok, true);
  assert.equal(first.battle.status, 'victory');
  assert.deepEqual(restored.battle, first.battle);
  assert.deepEqual(validateSave(first), first);
  assert.equal(finishBattle(first).ok, true);
  assert.equal(getCampSites(first)[0].cleared, true);
  assert.equal(startBattle(first, campSite.id).ok, false);
  const claimed = structuredClone(first);
  assert.equal(finishBattle(first).ok, false);
  assert.deepEqual(first, claimed);
});

test('a stocked hunt remains reloadable after every battle turn', () => {
  let state = createGame(7391);
  assert.equal(buySupplies(state, 'tools', 5).ok, true);
  const hunt = findOffer(state, 'hunt');
  assert.equal(acceptContract(state, 'oakwatch', hunt.id).ok, true);
  const site = getCampSites(state).find(entry => entry.id === hunt.campId);
  approach(state, site);
  assert.equal(startBattle(state, site.id).ok, true);
  while (state.battle.status === 'active') {
    assert.equal(advanceBattle(state).ok, true);
    state = validateSave(JSON.parse(JSON.stringify(state)));
  }
  assert.equal(state.battle.status, 'victory');
});

test('active battles block travel, commerce, equipment and time actions', () => {
  const state = createGame(2);
  const site = getCampSites(state)[0];
  approach(state, site);
  startBattle(state, site.id);
  const before = structuredClone(state);
  assert.equal(travelTo(state, 350, 460).ok, false);
  assert.equal(tick(state, 1).ok, false);
  assert.equal(equipItem(state, 'captain', 'cloth-hood').ok, false);
  assert.equal(unequipItem(state, 'captain', 'armor').ok, false);
  assert.equal(buyItem(state, 'spear').ok, false);
  assert.equal(buySupplies(state, 'tools').ok, false);
  assert.equal(camp(state).ok, false);
  assert.equal(forage(state).ok, false);
  assert.deepEqual(state, before);
});

test('retreat has consequences, preserves survivors and leaves the camp open', () => {
  const state = createGame(3);
  const site = getCampSites(state)[0];
  approach(state, site);
  startBattle(state, site.id);
  advanceBattle(state);
  const food = state.food;
  assert.equal(retreatBattle(state).ok, true);
  assert.equal(state.battle.status, 'retreat');
  assert.equal(state.food, food - 2);
  assert.deepEqual(validateSave(state), state);
  assert.equal(finishBattle(state).ok, true);
  assert.equal(state.battle, null);
  assert.equal(state.party.length, 3);
  assert.equal(getCampSites(state)[0].cleared, false);
  assert.equal(startBattle(state, site.id).ok, true);
});

test('casualties leave the roster, their gear is recovered on victory, and defeat ends the company', () => {
  const state = createGame(7391);
  const site = getCampSites(state)[0];
  approach(state, site);
  startBattle(state, site.id);
  const fallenGuard = state.battle.units.find(unit => unit.id === 'guard');
  fallenGuard.hp = 0;
  fallenGuard.alive = false;
  // Isolate casualty cleanup from the encounter's changing tactical balance.
  for (const unit of state.battle.units.filter(unit => unit.side === 'company' && unit.alive)) unit.meleeSkill = unit.rangedSkill = 200;
  for (const unit of state.battle.units.filter(unit => unit.side === 'enemy')) unit.hp = 1;
  resolveBattle(state);
  assert.equal(state.battle.status, 'victory');
  assert.ok(state.battle.casualties.includes('guard'));
  const survivor = state.battle.units.find(unit => unit.id === 'captain');
  finishBattle(state);
  assert.equal(state.party.some(person => person.id === 'guard'), false);
  assert.ok(state.inventory.includes('round-shield'));
  assert.equal(state.party.find(person => person.id === 'captain').armorDurability.body, survivor.bodyArmor);

  const doomed = createGame(4);
  doomed.party = [doomed.party[0]];
  doomed.formation = doomed.formation.map(id => id === doomed.party[0].id ? id : null);
  doomed.party[0].hp = 1;
  const doomedSite = getCampSites(doomed)[0];
  approach(doomed, doomedSite);
  startBattle(doomed, doomedSite.id);
  // Exercise defeat cleanup directly; a one-HP fighter can now win with Riposte.
  const fallenCaptain=doomed.battle.units.find(unit=>unit.id==='captain');
  fallenCaptain.hp=0;fallenCaptain.alive=false;
  resolveBattle(doomed);
  assert.equal(doomed.battle.status, 'defeat');
  finishBattle(doomed);
  assert.equal(doomed.party.length, 0);
  assert.equal(doomed.gameOver, true);
  assert.deepEqual(validateSave(doomed), doomed);
  assert.equal(travelTo(doomed, 350, 460).ok, false);
});

test('hunt rewards require clearing the camp and returning to the issuer', () => {
  const state = createGame(1);
  const hunt = findOffer(state, 'hunt');
  assert.equal(acceptContract(state, 'oakwatch', hunt.id).ok, true);
  const site = getCampSites(state).find(entry => entry.id === hunt.campId);
  approach(state, site);
  startBattle(state, site.id);
  resolveBattle(state);
  finishBattle(state);
  assert.equal(state.contract?.type, 'hunt');
  const beforeReward = state.gold;
  const beforeDay = state.day;
  const dailyWages = state.party.reduce((total, person) => total + getCompanyStats(person).dailyWage, 0);
  approach(state, { x: 350, y: 460 });
  assert.equal(state.contract, null);
  assert.equal(state.renown, 2);
  assert.equal(state.gold, beforeReward + hunt.reward - (state.day - beforeDay) * dailyWages);
});

test('bow equipment stows shields atomically and armor condition survives swapping', () => {
  const state = createGame(6);
  assert.equal(buyFood(state, 1).ok, true);
  state.marketStock.oakwatch.equipment['hunting-bow'] = 1;
  assert.equal(buyItem(state, 'hunting-bow').ok, true);
  const ownedBefore = [...state.inventory, ...state.party.flatMap(person => Object.values(person.equipment).filter(Boolean))].sort();
  assert.equal(equipItem(state, 'captain', 'hunting-bow').ok, true);
  assert.equal(state.party[0].equipment.shield, null);
  assert.ok(state.inventory.includes('buckler'));
  assert.equal(equipItem(state, 'captain', 'buckler').ok, true);
  assert.equal(state.party[0].equipment.weapon, null);
  assert.ok(state.inventory.includes('hunting-bow'));
  const ownedAfter = [...state.inventory, ...state.party.flatMap(person => Object.values(person.equipment).filter(Boolean))].sort();
  assert.deepEqual(ownedAfter, ownedBefore);
  state.party[0].armorDurability.body -= 20;
  const damaged = state.party[0].armorDurability.body;
  assert.equal(unequipItem(state, 'captain', 'armor').ok, true);
  assert.equal(equipItem(state, 'captain', 'leather-vest').ok, true);
  assert.equal(state.party[0].armorDurability.body, damaged);
  assert.deepEqual(validateSave(state), state);
});

test('shields raise defense while armor absorbs damage in a real battle', () => {
  const equipped = createGame(1);
  const site = getCampSites(equipped)[0];
  const shielded = getCompanyStats(equipped.party[0]);
  const bareStats = getCompanyStats({ ...equipped.party[0], equipment: { ...equipped.party[0].equipment, shield: null } });
  assert.equal(shielded.meleeDefense - bareStats.meleeDefense, 10);
  const bare = structuredClone(equipped);
  for (const person of bare.party) {
    person.equipment.armor = null;
    person.equipment.helmet = null;
    person.equipment.shield = null;
    person.armorDurability = { body: 0, head: 0 };
  }
  for (const state of [equipped, bare]) {
    approach(state, site);
    assert.equal(startBattle(state, site.id).ok, true);
    assert.equal(resolveBattle(state).ok, true);
  }
  assert.equal(equipped.battle.status, 'victory');
  assert.equal(bare.battle.status, 'victory');
  let armorWasStruck = equipped.battle.units.some(unit => unit.side === 'company' && (unit.bodyArmor < unit.maxBodyArmor || unit.headArmor < unit.maxHeadArmor));
  for (let seed = 2; seed <= 6 && !armorWasStruck; seed++) {
    const state = createGame(seed);
    approach(state, getCampSites(state)[0]);
    startBattle(state, getCampSites(state)[0].id);
    resolveBattle(state);
    armorWasStruck = state.battle.units.some(unit => unit.side === 'company' && (unit.bodyArmor < unit.maxBodyArmor || unit.headArmor < unit.maxHeadArmor));
  }
  assert.ok(armorWasStruck);
});

test('camp spends medicine and tools, leveling offers three rolled attributes', () => {
  const state = createGame(1);
  const captain = state.party[0];
  captain.hp = 50;
  captain.armorDurability.body -= 40;
  const tools = state.supplies.tools;
  const medicine = state.supplies.medicine;
  assert.equal(camp(state).ok, true);
  assert.equal(captain.hp, 74);
  assert.equal(captain.armorDurability.body, getCompanyStats(captain).maxBodyArmor);
  assert.equal(state.supplies.tools, tools - 2);
  assert.equal(state.supplies.medicine, medicine - 1);
  const offer = getMarket(state).supplies.find(entry => entry.kind === 'tools');
  assert.equal(buySupplies(state, 'tools', 2).ok, true);
  assert.equal(state.supplies.tools, tools);
  assert.equal(state.gold, 900 - offer.buyPrice * 2);

  const site = getCampSites(state)[0];
  approach(state, site);
  startBattle(state, site.id);
  resolveBattle(state);
  finishBattle(state);
  const trained = state.party.find(person => person.trainingPoints > 0);
  assert.ok(trained);
  const levelUp = getLevelUp(trained);
  const oldSkill = getCompanyStats(trained).meleeSkill;
  const oldHp = trained.hp;
  assert.equal(trainAttributes(state, trained.id, ['meleeSkill', 'maxHp', 'resolve']).ok, true);
  assert.equal(getCompanyStats(trained).meleeSkill, oldSkill + levelUp.rolls.meleeSkill);
  assert.equal(trained.hp, oldHp + levelUp.rolls.maxHp);
  assert.equal(trained.trainingPoints, 0);
  assert.equal(getLevelUp(trained), null);
  assert.deepEqual(validateSave(state), state);
});

test('old saves gain defaults while malformed battle and resource records are rejected', () => {
  const old = createGame(7);
  for (const key of ['inventoryCondition', 'supplies', 'camps', 'battle', 'gameOver']) delete old[key];
  for (const person of old.party) for (const key of ['level', 'xp', 'trainingPoints', 'pendingLevelUps', 'attributes', 'armorDurability']) delete person[key];
  const imported = validateSave(old);
  assert.deepEqual(imported.supplies, { tools: 8, medicine: 5, ammo: 16 });
  assert.equal(imported.party[0].armorDurability.body, getCompanyStats(imported.party[0]).maxBodyArmor);
  assert.equal(imported.inventoryCondition.length, imported.inventory.length);

  const state = createGame(8);
  const site = getCampSites(state)[0];
  approach(state, site);
  startBattle(state, site.id);
  const variants = [
    save => { save.supplies.tools = -1; },
    save => { save.camps.fake = { clearedDay: 1 }; },
    save => { save.battle.units[0].q = 22; },
    save => { save.battle.units[0].bodyArmor = -1; },
    save => { save.battle.turnOrder = ['missing']; },
    save => { save.battle.status = 'unknown'; },
    save => { save.battle.status = 'victory'; save.battle.activeId = null; },
    save => { save.battle.lastEvent = { actorId: null, targetId: null, type: 'hit', message: 'hit', hpDamage: -1 }; },
    save => { save.camps[site.id] = { clearedDay: save.day }; },
    save => { save.destination = { x: site.x + 1, y: site.y }; },
    save => { save.battle.units.shift(); },
  ];
  for (const mutate of variants) {
    const corrupted = structuredClone(state);
    mutate(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
});
