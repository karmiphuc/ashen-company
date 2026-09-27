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
  assert.equal(tick(state, 8).ok, true);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.deepEqual(
    { day: state.day, hour: state.hour, status: caravan?.status, attackerId: caravan?.attackerId, attackHoursRemaining: caravan?.attackHoursRemaining },
    { day: 1, hour: 16, status: 'under-attack', attackerId: 'river-raiders', attackHoursRemaining: 7 },
  );
  return state;
}

function defeatAttacker(state) {
  const caravan = getCaravans(state).find(row => row.status === 'under-attack');
  const band = getRoamingBands(state).find(row => row.id === caravan.attackerId);
  assert.ok(band, 'the threatened band remains a possible encounter');
  state.position = { x: band.x, y: band.y };
  assert.equal(pursueBand(state, band.id).ok, true);
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
    { day: 1, hour: 23, status: 'lost', resolvedHour: 23 },
  );
  return state;
}

function ordinaryRows(market) {
  return market.equipment.filter(row => !row.famed && !['bandages', 'net', 'antidote'].includes(row.itemId));
}

test('a scheduled armorer wagon stays en route until its 30-hour journey physically delivers finite stock', () => {
  const state = createGame(16);
  atTown(state, 'eastmere');
  const before = getMarket(state);
  const snapshot = structuredClone(state);
  assert.equal(getTownEvent(state, 'eastmere')?.type, 'armorer-shipment-en-route');
  assert.equal(getCaravans(state).find(row => row.id === 'shipment:eastmere:1')?.etaHours, 22);
  assert.deepEqual(state, snapshot, 'market and caravan getters are read-only before arrival');

  assert.equal(tick(state, 22).ok, true);
  const after = getMarket(state);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:eastmere:1');
  assert.deepEqual(
    { day: state.day, hour: state.hour, status: caravan?.status, etaHours: caravan?.etaHours, resolvedHour: caravan?.resolvedHour },
    { day: 2, hour: 6, status: 'delivered', etaHours: 0, resolvedHour: 30 },
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
  const rescued = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.equal(rescued.status, 'en-route');
  assert.equal(rescued.attackerId, null);
  assert.equal(state.shipments.ironford.attackHour, null);

  assert.equal(tick(state, 14).ok, true);
  const delivered = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.equal(delivered.status, 'delivered');
  assert.equal(delivered.resolvedHour, 30);
  assert.equal(state.log.filter(entry => /turn toward the armorer wagon/.test(entry)).length, 1,
    'the original warning is recorded once and does not respawn after the victory');
});

test('clearing the raiders before their attack window prevents the warning and protects delivery', () => {
  const state = createGame(2);
  assert.equal(tick(state, 7).ok, true);
  const band = getRoamingBands(state).find(row => row.id === 'river-raiders');
  state.position = { x: band.x, y: band.y };
  assert.equal(pursueBand(state, band.id).ok, true);
  assert.equal(resolveBattle(state).ok, true);
  assert.equal(finishBattle(state).ok, true);
  assert.equal(tick(state, 15).ok, true);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:ironford:1');
  assert.equal(caravan.status, 'delivered');
  assert.ok(!state.log.some(entry => /turn toward the armorer wagon/.test(entry)));
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
  for (let step = 0; step < 6; step++) assert.equal(tick(state, 72).ok, true);
  assert.equal(tick(state, 12).ok, true);
  const caravan = getCaravans(state).find(row => row.id === 'shipment:eastmere:19');
  assert.deepEqual(
    { day: state.day, hour: state.hour, status: caravan?.status, resolvedHour: caravan?.resolvedHour },
    { day: 19, hour: 20, status: 'lost', resolvedHour: 452 },
  );

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
  const id = 'shipment:eastmere:1';
  assert.equal(activateMapTarget(state, 'caravan', id).ok, true);
  assert.equal(state.destinationAction?.type, 'caravan');
  assert.equal(tick(state, 1).ok, true);
  assert.equal(camp(state).ok, true);
  assert.equal(forage(state).ok, true);
  assert.deepEqual(state.destinationAction, { type: 'caravan', id });
  assert.equal(tick(state, 11).ok, true);
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
    save => { save.shipments.ironford.extra = true; },
  ];
  for (const change of variants) {
    const corrupted = structuredClone(state);
    change(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
});
