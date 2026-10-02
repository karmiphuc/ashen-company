import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SETTLEMENTS, createFamedItemId, createGame, getCaravans, getMarket, getRoamingBands,
  getTownEconomy, getTownEvent, pursueBand, resolveBattle, finishBattle, camp, tick, validateSave,
  buyItem, sellItem, forage, activateMapTarget,
} from '../src/engine.js';

const town = id => {
  const entry = SETTLEMENTS.find(place => place.id === id);
  assert.ok(entry, `missing settlement ${id}`);
  return entry;
};

function atTown(state, townId) {
  const target = town(townId);
  state.position = { x: target.x, y: target.y };
  state.destination = null;
  state.destinationAction = null;
}

function ironfordAttack() {
  const state = createGame(2);
  assert.equal(tick(state, 7.5).ok, true);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.equal(caravan?.status, 'under-attack');
  assert.equal(caravan?.contact, true);
  assert.equal(caravan?.attackHoursRemaining, 7);
  return state;
}

function protectShipment(state, townId) {
  const shipment = state.shipments[townId];
  if (shipment.attackerId) {
    state.bands[shipment.attackerId].behavior = 'patrolling';
    state.bands[shipment.attackerId].targetId = null;
  }
  Object.assign(shipment, { attackerId: null, attackerSpawnCycle: null, attackHour: null, raidCleared: true });
}

function defeatAttacker(state) {
  const caravan = getCaravans(state).find(row => row.status === 'under-attack');
  const band = getRoamingBands(state).find(row => row.id === caravan.attackerId);
  assert.ok(band, 'the threatened band remains a possible encounter');
  state.position = { x: band.x, y: band.y };
  assert.equal(pursueBand(state, band.id).ok, true);
  for (const enemy of state.battle.units.filter(unit => unit.side === 'enemy')) Object.assign(enemy, { hp: 1, bodyArmor: 0, headArmor: 0, morale: 0 });
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(state.battle.status, 'victory');
  assert.equal(finishBattle(state).ok, true);
}

function loseIronfordShipment() {
  const state = ironfordAttack();
  assert.equal(tick(state, 1).ok, true);
  assert.equal(camp(state).ok, true);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.deepEqual(
    { day: state.day, hour: state.hour, status: caravan?.status, resolvedHour: caravan?.resolvedHour },
    { day: 1, hour: 22.5, status: 'lost', resolvedHour: 22.5 },
  );
  return state;
}

function ordinaryRows(market) {
  return market.equipment.filter(row => !row.famed && !['bandages', 'net', 'antidote'].includes(row.itemId));
}

test('a scheduled armorer wagon stays en route until its 60-hour journey physically delivers finite stock', () => {
  const state = createGame(16);
  protectShipment(state, 'eastmere');
  atTown(state, 'eastmere');
  const before = getMarket(state);
  const snapshot = structuredClone(state);
  assert.equal(getTownEvent(state, 'eastmere')?.type, 'armorer-shipment-en-route');
  assert.equal(getCaravans(state).find(row => row.id === 'shipment:eastmere:1')?.etaHours, 52);
  assert.deepEqual(state, snapshot, 'market and caravan getters are read-only before arrival');

  assert.equal(tick(state, 52).ok, true);
  const after = getMarket(state);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:eastmere:1');
  assert.deepEqual(
    { day: state.day, hour: state.hour, status: caravan?.status, etaHours: caravan?.etaHours, resolvedHour: caravan?.resolvedHour },
    { day: 3, hour: 12, status: 'delivered', etaHours: 0, resolvedHour: 60 },
  );
  assert.equal(getTownEvent(state, 'eastmere')?.type, 'armorer-shipment');
  const beforeRows = Object.fromEntries(ordinaryRows(before).map(row => [row.itemId, row]));
  const afterRows = ordinaryRows(after);
  assert.ok(afterRows.some(row => row.buyPrice < beforeRows[row.itemId].buyPrice), 'the delivery applies its ordinary-gear discount only after arrival');
  assert.ok(afterRows.some(row => row.stock > beforeRows[row.itemId].stock), 'the delivered wagon adds finite ordinary gear');
  assert.ok(afterRows.every(row => row.stock <= 1024));

  const afterRead = structuredClone(state);
  assert.deepEqual(getMarket(state), after);
  assert.deepEqual(state, afterRead, 'reading a delivered market cannot mint a second shipment');
  assert.equal(tick(state, 1).ok, true);
  assert.deepEqual(ordinaryRows(getMarket(state)), afterRows, 'time after delivery does not replay the same stock grant');
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('raids warn for seven hours, victory rescues the wagon, and the same defeated band cannot attack it again', () => {
  const state = ironfordAttack();
  assert.equal(getTownEvent(state, 'ironford')?.type, 'armorer-shipment-en-route');
  assert.match(getCaravans(state)[0].description, /targeting this wagon/);

  defeatAttacker(state);
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = Math.max(progress.defeatedUntil, (state.day - 1) * 24 + state.hour + 48);
  const rescued = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.equal(rescued.status, 'en-route');
  assert.equal(rescued.attackerId, null);
  assert.equal(state.shipments.ironford.attackHour, null);

  assert.equal(tick(state, 44.5).ok, true);
  const delivered = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.equal(delivered.status, 'delivered');
  assert.equal(delivered.resolvedHour, 60);
  assert.equal(state.log.filter(entry => /reach the armorer wagon/.test(entry)).length, 1,
    'the original warning is recorded once and does not respawn after the victory');
});

test('clearing the raiders before their attack window prevents the warning and protects delivery', () => {
  const state = createGame(2);
  assert.equal(tick(state, 7).ok, true);
  const band = getRoamingBands(state).find(row => row.id === state.shipments.ironford.attackerId);
  state.position = { x: band.x, y: band.y };
  assert.equal(pursueBand(state, band.id).ok, true);
  for (const enemy of state.battle.units.filter(unit => unit.side === 'enemy')) Object.assign(enemy, { hp: 1, bodyArmor: 0, headArmor: 0, morale: 0 });
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(finishBattle(state).ok, true);
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = Math.max(progress.defeatedUntil, (state.day - 1) * 24 + state.hour + 48);
  assert.equal(tick(state, 53).ok, true);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.equal(caravan.status, 'delivered');
  assert.ok(!state.log.some(entry => /reach the armorer wagon/.test(entry)));
});

test('ignoring a raid loses the wagon at its deadline and a camp action has the same caravan outcome as partitioned ticks', () => {
  const camped = ironfordAttack();
  const stepped = ironfordAttack();
  assert.equal(tick(camped, 1).ok, true);
  assert.equal(tick(stepped, 1).ok, true);
  assert.equal(camp(camped).ok, true);
  for (let hour = 0; hour < 6; hour++) assert.equal(tick(stepped, 1).ok, true);
  assert.deepEqual(camped.shipments, stepped.shipments, 'camping does not skip or delay caravan deadlines');
  assert.deepEqual(getCaravans(camped), getCaravans(stepped));

  const oneStep = createGame(2);
  const partitioned = createGame(2);
  assert.equal(tick(oneStep, 15).ok, true);
  for (let hour = 0; hour < 15; hour++) assert.equal(tick(partitioned, 1).ok, true);
  assert.deepEqual(oneStep, partitioned, 'the same elapsed time has one deterministic shipment result');

  const loss = loseIronfordShipment();
  assert.equal(getTownEvent(loss, 'ironford')?.type, 'arms-shortage');
  assert.equal(tick(loss, 72).ok, true);
  assert.equal(tick(loss, 24).ok, true);
  assert.equal(getCaravans(loss).some(row => row.id === 'shipment:ironford:1'), false, 'the resolved record expires after its four-day shortage');
  assert.notEqual(getTownEvent(loss, 'ironford')?.type, 'arms-shortage');
});

test('shortages raise only ordinary equipment prices and retain a same-town trade loss', () => {
  const normal = createGame(2);
  const shortage = loseIronfordShipment();
  atTown(normal, 'ironford');
  atTown(shortage, 'ironford');
  const famedId = createFamedItemId('spear', 1234);
  for (const state of [normal, shortage]) {
    state.inventory.push(famedId);
    state.inventoryCondition.push(null);
  }
  const normalMarket = getMarket(normal);
  const shortageMarket = getMarket(shortage);
  const byId = (market, id) => market.equipment.find(row => row.itemId === id);
  assert.ok(byId(shortageMarket, 'mail-shirt').buyPrice > byId(normalMarket, 'mail-shirt').buyPrice);
  assert.ok(byId(shortageMarket, 'mail-shirt').sellPrice > byId(normalMarket, 'mail-shirt').sellPrice);
  for (const id of ['bandages', famedId]) assert.deepEqual(
    { buyPrice: byId(shortageMarket, id).buyPrice, sellPrice: byId(shortageMarket, id).sellPrice },
    { buyPrice: byId(normalMarket, id).buyPrice, sellPrice: byId(normalMarket, id).sellPrice },
    `${id} is not boosted by an arms shortage`,
  );
  assert.ok(byId(shortageMarket, 'mail-shirt').buyPrice > byId(shortageMarket, 'mail-shirt').sellPrice,
    'the shortage cannot turn same-town buy and sell into an arbitrage loop');
});

test('a shortage pays a small cross-town ordinary-gear profit without creating same-town arbitrage', () => {
  const state = createGame(1);
  // Keep soldiers reforming so this pricing fixture cannot be rescued by a patrol.
  const advanceWithoutPatrols = hours => {
    while (hours > 0) {
      const now = (state.day - 1) * 24 + state.hour;
      for (const p of Object.values(state.factionPatrols)) { p.troops = []; p.defeatedUntil = now + 72; }
      const step = Math.min(hours, 71.75);
      assert.equal(tick(state, step).ok, true);
      hours -= step;
    }
  };
  advanceWithoutPatrols(444);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:eastmere:19');
  assert.equal(caravan?.status, 'lost');
  assert.ok(caravan.resolvedHour <= (state.day - 1) * 24 + state.hour);

  state.gold = 100000;
  atTown(state, 'ironford');
  const source = getMarket(state);
  atTown(state, 'eastmere');
  const shortage = getMarket(state);
  const destinationRow = id => shortage.equipment.find(row => row.itemId === id);
  const deal = source.equipment.find(row => !row.famed && row.stock > 0 && row.buyPrice < destinationRow(row.itemId).sellPrice);
  assert.ok(deal, 'a lower-price town has a real outlet during the shortage');
  const sale = destinationRow(deal.itemId);
  assert.ok(sale.buyPrice > sale.sellPrice, 'the shortage settlement itself still buys and sells at a loss');

  atTown(state, 'ironford');
  const goldBefore = state.gold;
  assert.equal(buyItem(state, deal.itemId).ok, true);
  assert.equal(state.gold, goldBefore - deal.buyPrice);
  atTown(state, 'eastmere');
  assert.equal(sellItem(state, deal.itemId).ok, true);
  assert.equal(state.gold, goldBefore - deal.buyPrice + sale.sellPrice);
  assert.ok(state.gold > goldBefore, 'the price difference rewards moving equipment to the shortage');
});

test('following a wagon survives camp and forage but ends cleanly when the wagon resolves', () => {
  const state = createGame(16);
  protectShipment(state, 'eastmere');
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = 48;
  const id = 'shipment:eastmere:1';
  assert.equal(activateMapTarget(state, 'caravan', id).ok, true);
  assert.equal(state.destinationAction?.type, 'caravan');
  assert.equal(tick(state, 1).ok, true);
  assert.equal(camp(state).ok, true);
  assert.equal(forage(state).ok, true);
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = (state.day - 1) * 24 + state.hour + 48;
  assert.deepEqual(state.destinationAction, { type: 'caravan', id });
  assert.equal(tick(state, getCaravans(state).find(row => row.id === id).etaHours).ok, true);
  assert.equal(getCaravans(state).find(row => row.id === id)?.status, 'delivered');
  assert.equal(state.destinationAction, null);
  assert.equal(state.destination, null);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
});

test('caravan getters and saved shipment records survive reload while legacy and malformed records stay bounded', () => {
  const state = ironfordAttack();
  const snapshot = structuredClone(state);
  const rows = getCaravans(state);
  const townEvent = getTownEvent(state, 'ironford');
  getTownEconomy(state);
  assert.deepEqual(getCaravans(state), rows);
  assert.deepEqual(getTownEvent(state, 'ironford'), townEvent);
  assert.deepEqual(state, snapshot, 'all caravan getters are pure');
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);

  const oldSave = createGame(2);
  delete oldSave.shipments;
  delete oldSave.shipmentLegacyThroughDay;
  const migrated = validateSave(oldSave);
  assert.deepEqual(migrated.shipments, {});
  assert.equal(migrated.shipmentLegacyThroughDay, oldSave.day);

  const variants = [
    save => { save.shipments = { unknown: save.shipments.ironford }; },
    save => { save.shipmentLegacyThroughDay = save.day + 1; },
    save => { save.shipments.ironford.attackHour = Infinity; },
    save => { save.shipments.ironford.status = 'teleported'; },
    save => { save.shipments.ironford.attackerSpawnCycle = 1000001; },
    save => { save.shipments.ironford.travelHours = 30; },
    save => { save.shipments.ironford.travelStartHour = -31; },
    save => { save.shipments.ironford.extra = true; },
  ];
  for (const change of variants) {
    const corrupted = structuredClone(state);
    change(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
});

test('old active wagons keep their position while remaining travel doubles; old outcomes remain final', () => {
  const nearArrival = createGame(16);
  protectShipment(nearArrival, 'eastmere');
  assert.equal(tick(nearArrival, 21).ok, true);
  delete nearArrival.shipments.eastmere.travelHours;
  delete nearArrival.shipments.eastmere.travelStartHour;
  const migrated = validateSave(nearArrival);
  const wagon = getCaravans(migrated).find(row => row.id === 'shipment:eastmere:1');
  const origin = town('stonebridge');
  const destination = town('eastmere');
  assert.equal(wagon.x, origin.x + (destination.x - origin.x) * 29 / 30);
  assert.equal(wagon.y, origin.y + (destination.y - origin.y) * 29 / 30);
  assert.equal(wagon.etaHours, 2);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(migrated))), migrated);
  assert.equal(tick(migrated, 2).ok, true);
  assert.equal(getCaravans(migrated).find(row => row.id === wagon.id)?.status, 'delivered');

  const threatened = ironfordAttack();
  threatened.hour = 16;
  threatened.shipments.ironford.attackHour = 16;
  delete threatened.shipments.ironford.travelHours;
  delete threatened.shipments.ironford.travelStartHour;
  delete threatened.shipments.ironford.raidCleared;
  const resumed = validateSave(threatened);
  const warning = getCaravans(resumed).find(row => row.id === 'shipment:ironford:1');
  assert.equal(warning.etaHours, 28);
  assert.equal(warning.attackHoursRemaining, 7);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(resumed))), resumed);

  const fighting = ironfordAttack();
  fighting.hour = 16;
  const raider = getRoamingBands(fighting).find(row => row.id === fighting.shipments.ironford.attackerId);
  fighting.position = { x: raider.x, y: raider.y };
  assert.equal(pursueBand(fighting, raider.id).ok, true);
  fighting.shipments.ironford.attackHour = 16;
  delete fighting.shipments.ironford.travelHours;
  delete fighting.shipments.ironford.travelStartHour;
  delete fighting.shipments.ironford.raidCleared;
  assert.equal(validateSave(fighting).battle?.status, 'active', 'an old save can resume its caravan defense battle');

  const legacyLost = loseIronfordShipment();
  legacyLost.hour = 23;
  legacyLost.shipments.ironford.attackHour = 16;
  legacyLost.shipments.ironford.resolvedHour = 23;
  delete legacyLost.shipments.ironford.travelHours;
  delete legacyLost.shipments.ironford.travelStartHour;
  delete legacyLost.shipments.ironford.raidCleared;
  const settled = validateSave(legacyLost);
  assert.deepEqual([settled.shipments.ironford.travelHours, settled.shipments.ironford.travelStartHour], [30, 0]);
  assert.equal(getCaravans(settled).find(row => row.id === 'shipment:ironford:1')?.status, 'lost');

  const legacyDelivered = createGame(16);
  protectShipment(legacyDelivered, 'eastmere');
  assert.equal(tick(legacyDelivered, 22).ok, true);
  Object.assign(legacyDelivered.shipments.eastmere, { status: 'delivered', resolvedHour: 30 });
  delete legacyDelivered.shipments.eastmere.travelHours;
  delete legacyDelivered.shipments.eastmere.travelStartHour;
  delete legacyDelivered.shipments.eastmere.raidCleared;
  const arrived = validateSave(legacyDelivered);
  assert.deepEqual([arrived.shipments.eastmere.travelHours, arrived.shipments.eastmere.travelStartHour], [30, 0]);
  assert.equal(getCaravans(arrived).find(row => row.id === 'shipment:eastmere:1')?.status, 'delivered');
});
