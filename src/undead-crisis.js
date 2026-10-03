import { ASHEN_CONFIG as C, crisisHash, campaignHour, initialAshenWinter, eligibleForAshen } from './crisis-director.js';
import { regionAt, roadRoute, roadNetwork, WORLD_LIMITS } from './geography.js';
import { enemyProgression } from './enemy-progression.js';

export const UNDEAD_TYPES = Object.freeze(['undead-host', 'undead-liberation', 'undead-commander']);
const frontRegions = ['northern-highlands', 'eastern-frontier', 'blackwater-basin'];
const commanders = ['The Frostbound Marshal', 'The Ashen Castellan', 'The Drowned Regent'];
const blocked = town => ['besieged', 'occupied'].includes(town.status);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const point = p => ({ x: p.x, y: p.y });

export function exteriorPoint(town, settlements, avoid = []) {
  for (const radius of [60, 90, 130, 180]) {
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI / 8;
      const p = { x: town.x + radius * Math.cos(angle), y: town.y + radius * Math.sin(angle) };
      if (p.x >= WORLD_LIMITS.minX && p.x <= WORLD_LIMITS.maxX && p.y >= WORLD_LIMITS.minY && p.y <= WORLD_LIMITS.maxY
        && settlements.every(t => distance(p, t) > 38) && avoid.every(t => distance(p, t) > 40)) return p;
    }
  }
  throw new Error(`No safe exterior position for ${town.id}`);
}

function force(crisis, id, size, tier, rank = 0) {
  return { id, seed: crisisHash(`${crisis.seed}:${id}:force`), size, tier, rank,
    troops: Array.from({ length: size }, (_, i) => i), damage: {}, generation: 0 };
}

function prepareFronts(state, context) {
  const crisis = state.ashenWinter;
  crisis.fronts = frontRegions.map((regionId, i) => {
    const candidates = context.settlements.filter(t => regionAt(t.x, t.y).id === regionId).sort((a, b) => a.id.localeCompare(b.id));
    const home = candidates[crisisHash(`${crisis.seed}:${regionId}:site`) % candidates.length];
    const id = `ashen:${i + 1}`;
    return { id, regionId, homeId: home.id, site: exteriorPoint(home, context.settlements), name: commanders[i],
      defeated: false, nextSpawnHour: crisis.activationHour, spawnIndex: 0,
      force: force(crisis, `${id}:commander`, C.commanderSize, 3, Math.min(2, enemyProgression(state,3).rank)) };
  });
}

function targetFor(state, front, context) {
  const crisis = state.ashenWinter, now = campaignHour(state);
  const records = Object.values(crisis.towns);
  const reservations = records.filter(t => t.status === 'threatened');
  if (records.filter(blocked).length + reservations.length >= C.maxBlocked
    || records.filter(t => t.frontId === front.id && (blocked(t) || t.status === 'threatened')).length >= C.blockedPerFront
    || records.filter(t => ['threatened', 'besieged'].includes(t.status)).length >= C.maxThreats
    || records.some(t => t.frontId === front.id && ['threatened', 'besieged'].includes(t.status))) return null;
  const origins = context.settlements.filter(t => t.id === front.homeId || blocked(crisis.towns[t.id] ?? {}) && crisis.towns[t.id].frontId === front.id);
  const neighborIds = new Set(roadNetwork(context.settlements).flatMap(e => origins.some(t => t.id === e.from) ? [e.to] : origins.some(t => t.id === e.to) ? [e.from] : []));
  const home = context.settlements.find(t => t.id === front.homeId);
  const candidates = context.settlements.filter(t => {
    const entry = crisis.towns[t.id];
    return (t.id === front.homeId || neighborIds.has(t.id)) && (!entry || entry.status === 'open' || entry.status === 'recovering')
      && (entry?.protectionUntil ?? 0) <= now;
  }).sort((a, b) => distance(a, home) - distance(b, home) || crisisHash(`${crisis.seed}:${front.spawnIndex}:${a.id}`) - crisisHash(`${crisis.seed}:${front.spawnIndex}:${b.id}`));
  // The caps leave most of the world open. Check separation explicitly as well.
  return candidates.find(candidate => {
    const open = context.settlements.filter(t => t.id !== candidate.id && !blocked(crisis.towns[t.id] ?? {}) && crisis.towns[t.id]?.status !== 'threatened');
    return open.some(a => open.some(b => distance(a, b) >= 700));
  }) ?? null;
}

function spawnHost(state, front, context) {
  const crisis = state.ashenWinter, now = campaignHour(state);
  if (Object.keys(crisis.hosts).length >= C.maxHosts || Object.values(crisis.hosts).filter(h => h.frontId === front.id).length >= C.hostsPerFront) return;
  const target = targetFor(state, front, context);
  const index = ++front.spawnIndex, id = `${front.id}:host:${index}`;
  const home = context.settlements.find(t => t.id === front.homeId);
  const origin = target ? context.settlements.filter(t => t.id === home.id || crisis.towns[t.id]?.frontId === front.id && blocked(crisis.towns[t.id]))
    .sort((a, b) => distance(a, target) - distance(b, target) || a.id.localeCompare(b.id))[0] : home;
  const route = target ? [exteriorPoint(origin, context.settlements), ...roadRoute(context.settlements, origin.id, target.id).map(point)]
    : [exteriorPoint(home, context.settlements), point(home), exteriorPoint(home, context.settlements)];
  const length = route.slice(1).reduce((sum, p, i) => sum + distance(p, route[i]), 0);
  const warningUntil = now + Math.ceil(Math.max(C.approachHours, length / C.hostSpeed + 24) * 4) / 4;
  const host = { id, frontId: front.id, x: route[0].x, y: route[0].y, route, waypoint: 1,
    targetTownId: target?.id ?? null, warningUntil,
    force: force(crisis, id, index === 1 ? C.openingSize : C.hostSize, 2, index === 1 ? 0 : Math.min(1, enemyProgression(state,2).rank)),
    occupationForce: force(crisis, `${id}:occupation`, C.garrisonSize, 2, Math.min(1, enemyProgression(state,2).rank)) };
  crisis.hosts[id] = host;
  if (target) {
    crisis.towns[target.id] = { status: 'threatened', frontId: front.id, hostId: id, warningUntil,
      siegeUntil: null, protectionUntil: 0, recoveryUntil: 0, force: null, occupationForce: null };
    context.report(`Ashen Winter: an undead host approaches ${target.name}. Services will close no earlier than day ${Math.floor(warningUntil / 24) + 1}.`);
  }
  front.nextSpawnHour = now + C.spawnHours;
}

function redirectRoadHost(state, host, context) {
  const crisis = state.ashenWinter, front = crisis.fronts.find(f => f.id === host.frontId);
  if (front.defeated || host.targetTownId || crisis.phase !== 'active') return;
  const target = targetFor(state, front, context);
  if (!target) return;
  const origin = [...context.settlements].sort((a,b) => distance(a,host)-distance(b,host)||a.id.localeCompare(b.id))[0];
  host.route = [point(host), ...roadRoute(context.settlements,origin.id,target.id).map(point)];
  host.waypoint = 1; host.targetTownId = target.id;
  const length = host.route.slice(1).reduce((sum,p,i)=>sum+distance(p,host.route[i]),0);
  host.warningUntil = campaignHour(state) + Math.ceil(Math.max(C.approachHours,length/C.hostSpeed+24)*4)/4;
  crisis.towns[target.id] = { status:'threatened', frontId:front.id, hostId:host.id, warningUntil:host.warningUntil,
    siegeUntil:null, protectionUntil:0, recoveryUntil:0, force:null, occupationForce:null };
  context.report(`Ashen Winter: an undead host now approaches ${target.name}. Intercept it before the settlement closes.`);
}

function moveHost(host) {
  let remaining = C.hostSpeed * .25;
  while (host.waypoint < host.route.length && remaining > 0) {
    const target = host.route[host.waypoint], length = distance(host, target);
    if (length <= remaining) { host.x = target.x; host.y = target.y; host.waypoint++; remaining -= length; }
    else { host.x += (target.x - host.x) * remaining / length; host.y += (target.y - host.y) * remaining / length; remaining = 0; }
  }
  if (!host.targetTownId && host.waypoint === host.route.length) {
    host.route.reverse(); host.waypoint = 1;
  }
}

export function advanceAshenWinter(state, context) {
  const crisis = state.ashenWinter ??= initialAshenWinter(state.seed), now = campaignHour(state);
  if (crisis.phase === 'dormant' && eligibleForAshen(state)) {
    crisis.phase = 'scheduled'; crisis.eligibilityHour = now;
    crisis.warningHour = now + (7 + crisisHash(`${crisis.seed}:delay`) % 8) * 24;
    crisis.activationHour = crisis.warningHour + C.warningHours;
  }
  if (crisis.phase === 'scheduled' && now >= crisis.warningHour) {
    prepareFronts(state, context); crisis.phase = 'warning';
    context.report('Ashen Winter approaches. Three ancient commanders stir. Prepare the company before the dead close the settlements.');
  }
  if (crisis.phase === 'warning' && now >= crisis.activationHour) {
    crisis.phase = 'active'; context.report('Ashen Winter begins. Liberate closed settlements and destroy all three commanders.');
  }
  if (!['active', 'cleanup'].includes(crisis.phase)) return null;
  if (crisis.phase === 'active') for (const front of crisis.fronts) {
    if (!front.defeated && now >= front.nextSpawnHour) spawnHost(state, front, context);
  }
  const reserved = new Set([state.pursuit, state.destinationAction?.id, state.battle?.campId]);
  let displacement = null;
  for (const host of Object.values(crisis.hosts)) {
    redirectRoadHost(state,host,context);
    if (reserved.has(host.id) && distance(state.position, host) <= 40) continue;
    moveHost(host);
    if (!host.targetTownId || host.waypoint !== host.route.length || now < host.warningUntil) continue;
    const town = context.settlements.find(t => t.id === host.targetTownId), record = crisis.towns[town.id];
    record.status = 'besieged'; record.siegeUntil = now + C.siegeHours;
    record.force = host.force; record.occupationForce = host.occupationForce;
    delete crisis.hosts[host.id];
    context.report(`${town.name} is closed by the undead. Defeat its besieging host to restore all services.`);
    if (distance(state.position, town) <= 38) {
      state.position = exteriorPoint(town, context.settlements, context.hostiles?.() ?? []);
      state.destination = null; state.destinationAction = null; state.pursuit = null;
      state.encounterGraceUntil = Math.max(state.encounterGraceUntil ?? 0, now + 1);
      displacement = { townId: town.id, message: `${town.name} is closed. The company withdraws outside the blockade.` };
    }
  }
  for (const [townId, record] of Object.entries(crisis.towns)) {
    if (record.status === 'besieged' && now >= record.siegeUntil) {
      record.status = 'occupied';
      // A deadline never resurrects casualties or changes equipment after a retreat.
      if (!Object.keys(record.force.damage).length && record.force.troops.length === record.force.size)
        record.force = record.occupationForce;
      context.report(`${context.settlements.find(t => t.id === townId).name} is occupied. Its services remain closed until liberation.`);
    }
    if (record.status === 'recovering' && now >= record.recoveryUntil) record.status = 'open';
  }
  return displacement;
}

export function ashenEncounterRecords(state, settlements) {
  const crisis = state.ashenWinter;
  if (!crisis || !['active', 'cleanup'].includes(crisis.phase)) return [];
  return [
    ...crisis.fronts.filter(f => !f.defeated).map(f => ({ id: f.force.id, kind: 'undead-commander', name: f.name,
      ...f.site, frontId: f.id, force: f.force, townId: null })),
    ...Object.values(crisis.hosts).map(h => ({ id: h.id, kind: 'undead-host', name: 'Ashen Legion Host',
      x: h.x, y: h.y, frontId: h.frontId, force: h.force, townId: h.targetTownId })),
    ...Object.entries(crisis.towns).filter(([, t]) => blocked(t)).map(([townId, t]) => {
      const town = settlements.find(s => s.id === townId);
      return { id: t.force.id, kind: 'undead-liberation', name: `${town.name} ${t.status === 'occupied' ? 'Occupation' : 'Blockade'}`,
        ...exteriorPoint(town, settlements), frontId: t.frontId, force: t.force, townId };
    }),
  ];
}

export function recordAshenCasualties(state, encounterId, survivors, damage = {}) {
  const crisis = state.ashenWinter;
  const record = [...crisis.fronts.map(f => f.force), ...Object.values(crisis.hosts).map(h => h.force),
    ...Object.values(crisis.towns).filter(blocked).map(t => t.force)].find(f => f.id === encounterId);
  if (!record) return;
  record.troops = survivors; record.damage = damage;
}

export function resolveAshenObjective(state, encounter, context) {
  const crisis = state.ashenWinter, now = campaignHour(state);
  if (crisis.resolved.includes(encounter.id)) return false;
  crisis.resolved.push(encounter.id);
  if (encounter.kind === 'undead-commander') {
    const front = crisis.fronts.find(f => f.id === encounter.frontId);
    front.defeated = true;
    for (const host of Object.values(crisis.hosts).filter(h => h.frontId === front.id)) {
      if (host.targetTownId) { const t = crisis.towns[host.targetTownId]; t.status = 'open'; t.hostId = null; }
      host.targetTownId = null;
    }
    state.renown += 3;
  } else if (encounter.kind === 'undead-liberation') {
    const town = crisis.towns[encounter.townId];
    town.status = 'recovering'; town.protectionUntil = now + C.protectionHours; town.recoveryUntil = now + C.recoveryHours;
    town.force = null; town.occupationForce = null; town.hostId = null;
    crisis.liberationCount++; state.renown += 2;
    context.report(`${context.settlements.find(t => t.id === encounter.townId).name} is liberated. All settlement services have reopened.`);
  } else {
    const host = crisis.hosts[encounter.id];
    if (host?.targetTownId) {
      const town = crisis.towns[host.targetTownId]; town.status = 'open'; town.protectionUntil = now + C.protectionHours; town.hostId = null;
    }
    delete crisis.hosts[encounter.id]; crisis.hostVictories++;
  }
  evaluateAshenCompletion(state, context);
  return true;
}

export function evaluateAshenCompletion(state, context) {
  const crisis = state.ashenWinter;
  if (!['active', 'cleanup'].includes(crisis.phase) || !crisis.fronts.every(f => f.defeated)) return;
  crisis.phase = 'cleanup';
  if (Object.values(crisis.towns).some(blocked)) return;
  crisis.phase = 'completed'; crisis.completedHour = campaignHour(state); crisis.hosts = {};
  crisis.aftermath = { completedHour: crisis.completedHour, liberated: crisis.liberationCount, hostsDefeated: crisis.hostVictories,
    towns: Object.keys(crisis.towns).sort() };
  if (!crisis.finalRewardGranted) {
    state.gold += C.finalGold; state.renown += C.finalRenown; crisis.finalRewardGranted = true;
  }
  context.report('Ashen Winter ends. All commanders are defeated and every blocked settlement is liberated. Your final equipment reward awaits in the journal.');
}

// NPC road victories stop approaches but never grant player rewards.
export function npcAshenVictory(state, id) {
  const host = state.ashenWinter.hosts[id];
  if (!host) return;
  if (host.targetTownId) {
    const town = state.ashenWinter.towns[host.targetTownId]; town.status = 'open'; town.hostId = null;
    town.protectionUntil = campaignHour(state) + C.protectionHours;
  }
  delete state.ashenWinter.hosts[id];
  if (state.destinationAction?.id === id) { state.destinationAction = null; state.destination = null; }
}

export function validateAshenWinter(input, seed, settlements) {
  if (input === undefined) return initialAshenWinter(seed);
  const check = (ok, name) => { if (!ok) throw new TypeError(`Invalid save: Ashen Winter ${name}`); };
  const object = x => x && typeof x === 'object' && !Array.isArray(x);
  const keys = (x, names) => object(x) && Object.keys(x).length === names.length && names.every(k => Object.hasOwn(x,k));
  const count = x => Number.isSafeInteger(x) && x >= 0 && x <= 1000000;
  const hour = x => Number.isFinite(x) && x >= 0 && x <= 24000024 && Number.isInteger(x * 4);
  const nullableHour = x => x === null || hour(x);
  const validPoint = p => object(p) && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= WORLD_LIMITS.minX && p.x <= WORLD_LIMITS.maxX && p.y >= WORLD_LIMITS.minY && p.y <= WORLD_LIMITS.maxY;
  const townIds = new Set(settlements.map(t => t.id));
  const checkForce = f => {
    check(keys(f,['id','seed','size','tier','rank','troops','damage','generation']) && typeof f.id === 'string' && /^ashen:[1-3]:(commander|host:[1-9]\d*(?::occupation)?)$/.test(f.id)
      && Number.isSafeInteger(f.seed) && f.seed === crisisHash(`${input.seed}:${f.id}:force`)
      && [6, 8, 10, 12].includes(f.size) && [2, 3].includes(f.tier) && [0, 1, 2].includes(f.rank) && f.generation === 0, 'force');
    check(Array.isArray(f.troops) && f.troops.length <= f.size && new Set(f.troops).size === f.troops.length && f.troops.every(i => count(i) && i < f.size), 'troop identities');
    check(object(f.damage) && Object.keys(f.damage).every(i => f.troops.includes(Number(i))), 'casualty damage');
    for (const [troop, d] of Object.entries(f.damage)) check(keys(d,['hp','bodyArmor','headArmor','shieldDurability']) && ['hp', 'bodyArmor', 'headArmor', 'shieldDurability'].every(k => count(d[k]) && d[k] <= (k === 'hp' ? 300 : 500)) && d.hp > 0 && d.hp <= 25 + f.tier * 12 + f.rank * 8 + (Number(troop) === 0 && f.tier === 3 ? 12 : 0), 'damage');
  };
  check(keys(input,['version','crisisId','seed','phase','eligibilityHour','warningHour','activationHour','completedHour','fronts','hosts','towns','resolved','liberationCount','hostVictories','finalRewardGranted','finalItemClaimed','aftermath']) && input.version === 1 && input.crisisId === 'ashen-winter' && input.seed === crisisHash(`${seed}:ashen-winter`), 'identity');
  check(['dormant', 'scheduled', 'warning', 'active', 'cleanup', 'completed'].includes(input.phase), 'phase');
  check(['eligibilityHour', 'warningHour', 'activationHour', 'completedHour'].every(k => nullableHour(input[k])), 'deadlines');
  check(input.phase === 'dormant' ? input.eligibilityHour === null && input.warningHour === null && input.activationHour === null
    : hour(input.eligibilityHour) && hour(input.warningHour) && input.warningHour >= input.eligibilityHour + 7 * 24 && input.warningHour <= input.eligibilityHour + 14 * 24 && input.activationHour === input.warningHour + C.warningHours, 'schedule');
  check(Array.isArray(input.fronts) && input.fronts.length === (['dormant', 'scheduled'].includes(input.phase) ? 0 : 3), 'fronts');
  input.fronts.forEach((f, i) => {
    check(keys(f,['id','regionId','homeId','site','name','defeated','nextSpawnHour','spawnIndex','force']) && f.id === `ashen:${i + 1}` && f.regionId === frontRegions[i] && townIds.has(f.homeId) && regionAt(...['x', 'y'].map(k => settlements.find(t => t.id === f.homeId)[k])).id === f.regionId
      && validPoint(f.site) && f.name === commanders[i] && typeof f.defeated === 'boolean' && hour(f.nextSpawnHour) && count(f.spawnIndex), 'front');
    checkForce(f.force); check(f.force.id === `${f.id}:commander` && f.force.size === 12 && f.force.tier === 3 && f.force.rank <= 2, 'commander');
  });
  check(object(input.hosts) && Object.keys(input.hosts).length <= C.maxHosts && object(input.towns) && Object.keys(input.towns).length <= settlements.length, 'entity caps');
  const fronts = new Set(input.fronts.map(f => f.id));
  for (const [id, h] of Object.entries(input.hosts)) {
    check(keys(h,['id','frontId','x','y','route','waypoint','targetTownId','warningUntil','force','occupationForce']) && h.id === id && fronts.has(h.frontId) && validPoint(h) && (h.targetTownId === null || townIds.has(h.targetTownId)) && hour(h.warningUntil), 'host');
    check(Array.isArray(h.route) && h.route.length >= 2 && h.route.length <= settlements.length + 2 && h.route.every(validPoint) && count(h.waypoint) && h.waypoint >= 1 && h.waypoint <= h.route.length, 'host route');
    checkForce(h.force); checkForce(h.occupationForce); check(h.force.id === id && h.force.troops.length > 0 && h.occupationForce.id === `${id}:occupation` && h.occupationForce.size === C.garrisonSize && h.force.tier === 2 && h.force.rank <= 1 && h.occupationForce.tier === 2 && h.occupationForce.rank <= 1 && h.force.size === (id.endsWith(':1') ? C.openingSize : C.hostSize) && Number(id.split(':')[3]) <= input.fronts.find(f=>f.id===h.frontId).spawnIndex, 'host force');
  }
  for (const [id, t] of Object.entries(input.towns)) {
    check(townIds.has(id) && keys(t,['status','frontId','hostId','warningUntil','siegeUntil','protectionUntil','recoveryUntil','force','occupationForce']) && fronts.has(t.frontId) && ['open', 'threatened', 'besieged', 'occupied', 'recovering'].includes(t.status), 'town');
    check(hour(t.warningUntil) && nullableHour(t.siegeUntil) && hour(t.protectionUntil) && hour(t.recoveryUntil), 'town deadlines');
    if (t.status === 'threatened') check(input.hosts[t.hostId]?.targetTownId === id && input.hosts[t.hostId].frontId === t.frontId && input.hosts[t.hostId].warningUntil === t.warningUntil && !input.fronts.find(f=>f.id===t.frontId).defeated && t.force === null, 'approach reservation');
    if (blocked(t)) {
      checkForce(t.force); checkForce(t.occupationForce); check(hour(t.siegeUntil) && !input.hosts[t.hostId] && t.force.id.startsWith(`${t.frontId}:host:`) && t.force.tier === 2 && t.force.rank <= 1 && t.force.troops.length > 0 && t.occupationForce.id === `${t.hostId}:occupation` && t.occupationForce.size === C.garrisonSize && [t.hostId,t.occupationForce.id].includes(t.force.id), 'blockade');
    } else check(t.force === null && t.occupationForce === null, 'open force');
  }
  for (const h of Object.values(input.hosts)) if (h.targetTownId) check(input.towns[h.targetTownId]?.hostId === h.id && input.towns[h.targetTownId].status === 'threatened', 'host reservation');
  const records = Object.values(input.towns);
  const activeForces = [...input.fronts.filter(f=>!f.defeated).map(f=>f.force),...Object.values(input.hosts).map(h=>h.force),...records.filter(blocked).map(t=>t.force)];
  check(activeForces.every(f=>f.troops.length>0) && new Set(activeForces.map(f=>f.id)).size===activeForces.length,'active force identities');
  check(records.filter(blocked).length + records.filter(t => t.status === 'threatened').length <= C.maxBlocked && records.filter(t => ['threatened', 'besieged'].includes(t.status)).length <= C.maxThreats, 'town caps');
  for (const f of input.fronts) check(Object.values(input.hosts).filter(h => h.frontId === f.id).length <= C.hostsPerFront && records.filter(t => t.frontId === f.id && (blocked(t) || t.status === 'threatened')).length <= C.blockedPerFront
    && records.filter(t => t.frontId === f.id && ['threatened', 'besieged'].includes(t.status)).length <= 1, 'front caps');
  check(Array.isArray(input.resolved) && input.resolved.length <= 10000 && new Set(input.resolved).size === input.resolved.length && input.resolved.every(id => typeof id === 'string' && /^ashen:[1-3]:(commander|host:[1-9]\d*(?::occupation)?)$/.test(id)), 'resolved objectives');
  check(count(input.liberationCount) && count(input.hostVictories) && typeof input.finalRewardGranted === 'boolean' && typeof input.finalItemClaimed === 'boolean', 'contribution');
  check(input.fronts.every(f => f.defeated === input.resolved.includes(f.force.id)) && input.liberationCount + input.hostVictories === input.resolved.length - input.fronts.filter(f=>f.defeated).length, 'objective outcomes');
  check([...Object.values(input.hosts).map(h => h.force), ...records.filter(blocked).map(t => t.force)].every(f => !input.resolved.includes(f.id)), 'resolved force');
  if (input.phase === 'completed') {
    check(input.fronts.every(f => f.defeated) && !records.some(blocked) && Object.keys(input.hosts).length === 0 && hour(input.completedHour) && input.finalRewardGranted && keys(input.aftermath,['completedHour','liberated','hostsDefeated','towns'])
      && input.aftermath.completedHour === input.completedHour && input.aftermath.liberated === input.liberationCount && input.aftermath.hostsDefeated === input.hostVictories
      && Array.isArray(input.aftermath.towns) && input.aftermath.towns.length === Object.keys(input.towns).length && input.aftermath.towns.every(id => Object.hasOwn(input.towns, id)), 'aftermath');
  } else check(input.completedHour === null && input.aftermath === null && !input.finalRewardGranted && !input.finalItemClaimed, 'unearned reward');
  if (input.phase === 'active') check(input.fronts.some(f=>!f.defeated), 'active commander');
  if (input.phase === 'cleanup') check(input.fronts.every(f => f.defeated) && !records.some(t => t.status === 'threatened'), 'cleanup');
  if (['dormant', 'scheduled', 'warning'].includes(input.phase)) check(!Object.keys(input.hosts).length && !records.length && !input.resolved.length && input.liberationCount === 0 && input.hostVictories === 0, 'premature outcomes');
  return structuredClone(input);
}
