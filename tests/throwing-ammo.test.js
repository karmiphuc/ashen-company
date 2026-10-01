import test from 'node:test';
import assert from 'node:assert/strict';
import { battleHTML } from '../src/battle-view.js';
import {
  createGame, getCampSites, getItem, equipItem, unequipItem, swapWeaponSet, startBattle, advanceBattle,
  finishBattle, buySupplies, validateSave, throwingCapacity, SETTLEMENTS,
} from '../src/engine.js';

function addItem(state, id) {
  state.inventory.push(id);
  state.inventoryCondition.push(null);
}

function arm(state, active = 'javelins', reserve = null) {
  addItem(state, active);
  assert.equal(equipItem(state, 'captain', active).ok, true);
  if (reserve) {
    addItem(state, reserve);
    assert.equal(equipItem(state, 'captain', reserve, 'reserve').ok, true);
  }
}

function enterBattle(state) {
  const camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y };
  assert.equal(startBattle(state, camp.id).ok, true);
  const battle = state.battle;
  const actor = battle.units.find(unit => unit.id === 'captain');
  const at = (id, q, r) => {
    Object.assign(battle.units.find(unit => unit.id === id), { q, r });
    Object.assign(battle.field.tiles.find(tile => tile.q === q && tile.r === r), { terrain: 'open', height: 0 });
  };
  const activate = () => {
    battle.turnIndex = battle.turnOrder.indexOf('captain');
    battle.activeId = 'captain';
  };
  return { battle, actor, at, activate };
}

test('five-charge bundles stay separate through swaps, stowing, and save reload', () => {
  const state = createGame(81);
  arm(state, 'javelins', 'heavy-throwing-axes');
  const person = state.party[0];
  assert.equal(throwingCapacity('javelins'), 5);
  assert.deepEqual(person.throwingAmmo, { active: 5, reserve: 5 });
  person.throwingAmmo = { active: 2, reserve: 4 };
  assert.equal(swapWeaponSet(state, 'captain').ok, true);
  assert.deepEqual(person.throwingAmmo, { active: 4, reserve: 2 });
  assert.equal(unequipItem(state, 'captain', 'weapon').ok, true);
  const packedIndex = state.inventory.indexOf('heavy-throwing-axes');
  assert.equal(state.inventoryCondition[packedIndex], 4);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.inventoryCondition[restored.inventory.indexOf('heavy-throwing-axes')], 4);
  assert.equal(equipItem(state, 'captain', 'heavy-throwing-axes').ok, true);
  assert.deepEqual(person.throwingAmmo, { active: 4, reserve: 2 });
  assert.equal(validateSave(state).party[0].throwingAmmo.active, 4);
});

test('throwing attacks spend charges, keep campaign ammo separate, and switch to a loaded reserve', () => {
  const state = createGame(82);
  arm(state, 'javelins', 'heavy-throwing-axes');
  state.party[0].throwingAmmo = { active: 1, reserve: 2 };
  state.supplies.ammo = 0;
  const { battle, actor, at, activate } = enterBattle(state);
  at('captain', 2, 2);
  at('guard', 1, 1);
  at('enemy-1', 4, 2);
  activate();
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(battle.lastEvent.weaponId, 'javelins');
  assert.equal(actor.throwingAmmo.active, 0);
  assert.equal(state.supplies.ammo, 0);
  const combatView = battleHTML(battle, 0);
  assert.match(combatView, /Ammo 0\/5 · R2\/5/);
  assert.match(combatView, /throwing ammunition Javelins 0\/5; reserve Heavy Throwing Axes 2\/5/);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.battle.units.find(unit => unit.id === 'captain').throwingAmmo.active, 0);

  activate();
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(battle.lastEvent.type, 'swap');
  assert.equal(actor.equipment.weapon, 'heavy-throwing-axes');
  assert.deepEqual(actor.throwingAmmo, { active: 2, reserve: 0 });
  assert.equal(state.supplies.ammo, 0);
});

test('an exhausted heavy thrower uses the punch instead of recovering for its higher fatigue cost', () => {
  const state = createGame(83);
  arm(state, 'heavy-throwing-axes');
  state.supplies.ammo = 0;
  const { battle, actor, at, activate } = enterBattle(state);
  actor.throwingAmmo.active = 0;
  actor.fatigue = actor.maxFatigue - 12;
  at('captain', 2, 2);
  at('enemy-1', 3, 2);
  activate();
  assert.equal(advanceBattle(state).ok, true);
  assert.ok(['attack', 'miss'].includes(battle.lastEvent.type));
  assert.notEqual(battle.lastEvent.weaponId, 'heavy-throwing-axes');
  assert.equal(actor.throwingAmmo.active, 0);
  assert.equal(state.supplies.ammo, 0);
});

test('shield wall leaves an empty thrower and will not ready it again', () => {
  const state = createGame(831);
  arm(state, 'javelins', 'greatsword');
  state.tactic = 'shield-wall';
  const { battle, actor, activate } = enterBattle(state);
  actor.throwingAmmo.active = 0;
  activate();
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(battle.lastEvent.type, 'swap');
  assert.equal(actor.equipment.weapon, 'greatsword');
  assert.equal(actor.reserveEquipment.weapon, 'javelins');
  activate();
  advanceBattle(state);
  assert.equal(actor.equipment.weapon, 'greatsword');
  assert.equal(actor.throwingAmmo.reserve, 0);
});

test('fight-end refill preserves swapped bundles and only spends the ammo available', () => {
  const state = createGame(84);
  arm(state, 'javelins', 'javelins');
  assert.equal(unequipItem(state, 'captain', 'shield').ok, true);
  state.party[0].throwingAmmo = { active: 3, reserve: 4 };
  state.supplies.ammo = 0;
  const { battle, actor } = enterBattle(state);
  actor.battleSetSwapped = true;
  actor.throwingAmmo = { active: 1, reserve: 3 };
  actor.equipment.weapon = 'javelins';
  actor.reserveEquipment.weapon = 'javelins';
  state.supplies.ammo = 1;
  battle.status = 'victory';
  assert.equal(finishBattle(state).ok, true);
  assert.deepEqual(state.party[0].throwingAmmo, { active: 4, reserve: 1 });
  assert.equal(state.supplies.ammo, 0);
  assert.ok(state.log.some(entry => entry.includes('replenishes 1 throwing weapon charge')));
  assert.deepEqual(validateSave(state).party[0].throwingAmmo, { active: 4, reserve: 1 });
});

test('legacy enemy throwers receive a finite bundle and captured empty bundles stay empty', () => {
  const state = createGame(841);
  arm(state);
  const { battle } = enterBattle(state);
  const enemy = battle.units.find(unit => unit.side === 'enemy');
  enemy.equipment.weapon = 'javelins';
  enemy.equipment.shield = null;
  enemy.shieldDurability = 0;
  enemy.maxShieldDurability = 0;
  delete enemy.throwingAmmo;
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.battle.units.find(unit => unit.id === enemy.id).throwingAmmo.active, 5);

  const currentEnemy = battle.units.find(unit => unit.id === enemy.id);
  currentEnemy.throwingAmmo = { active: 0, reserve: 0 };
  for (const unit of battle.units.filter(entry => entry.side === 'enemy')) {
    unit.alive = false;
    unit.hp = 0;
    unit.equipment = { armor: null, attachment: null, helmet: null, weapon: null, shield: null, mount: null };
    unit.throwingAmmo = { active: 0, reserve: 0 };
    unit.bodyArmor = 0;
    unit.attachmentArmor = 0;
    unit.headArmor = 0;
    unit.maxBodyArmor = 0;
    unit.maxAttachmentArmor = 0;
    unit.maxHeadArmor = 0;
    unit.shieldDurability = 0;
    unit.maxShieldDurability = 0;
  }
  currentEnemy.equipment.weapon = 'javelins';
  currentEnemy.throwingAmmo.active = 0;
  battle.famedDrop = null;
  state.supplies.ammo = 0;
  const actor = battle.units.find(unit => unit.id === 'captain');
  battle.activeId = actor.id;
  assert.equal(advanceBattle(state).ok, true);
  assert.equal(battle.status, 'victory');
  const lootIndex = battle.loot.items.indexOf('javelins');
  assert.notEqual(lootIndex, -1);
  assert.equal(battle.loot.itemConditions[lootIndex], 0);
  assert.equal(finishBattle(state).ok, true);
  assert.equal(state.inventoryCondition[state.inventory.lastIndexOf('javelins')], 0);
});

test('valid battle starts and purchased ammo refill bundles, while rejected starts spend nothing', () => {
  const state = createGame(85);
  arm(state);
  state.party[0].throwingAmmo.active = 2;
  state.supplies.ammo = 3;
  const camp = getCampSites(state)[0];
  state.position = { x: camp.x, y: camp.y };
  state.destination = { x: camp.x, y: camp.y };
  assert.equal(startBattle(state, camp.id).ok, false);
  assert.equal(state.party[0].throwingAmmo.active, 2);
  assert.equal(state.supplies.ammo, 3);
  state.destination = null;
  assert.equal(startBattle(state, camp.id).ok, true);
  assert.equal(state.battle.units.find(unit => unit.id === 'captain').throwingAmmo.active, 5);
  assert.equal(state.supplies.ammo, 0);

  const market = createGame(86);
  arm(market);
  market.party[0].throwingAmmo.active = 0;
  market.supplies.ammo = 0;
  market.position = { x: SETTLEMENTS[0].x, y: SETTLEMENTS[0].y };
  assert.equal(buySupplies(market, 'ammo', 2).ok, true);
  assert.equal(market.party[0].throwingAmmo.active, 2);
  assert.equal(market.supplies.ammo, 0);
});

test('legacy saves restore five charges and reject invalid charge counts', () => {
  const state = createGame(87);
  arm(state);
  const legacy = JSON.parse(JSON.stringify(state));
  delete legacy.party[0].throwingAmmo;
  legacy.inventory.push('javelins');
  legacy.inventoryCondition.push(null);
  const restored = validateSave(legacy);
  assert.deepEqual(restored.party[0].throwingAmmo, { active: 5, reserve: 0 });
  assert.equal(restored.inventoryCondition.at(-1), 5);

  const invalid = JSON.parse(JSON.stringify(state));
  invalid.party[0].throwingAmmo.active = 6;
  assert.throws(() => validateSave(invalid), /person throwing ammo/);
});
