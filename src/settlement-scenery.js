import { SETTLEMENTS, WORLD_BOUNDS, getTownEvent, getTownLocalSupply, getCaravans, getCampSites, terrainAt } from './engine.js';
import { townFacilities } from './town-facilities.js';

const INDUSTRIES = {
  grain: ['wheat_farm_01', 'Grain farm'], timber: ['lumber_camp_01', 'Timber yard'],
  iron: ['iron_mine_01', 'Iron mine'], salt: ['salt_mine_01', 'Salt works'], wool: ['wool_spinner_01', 'Wool yard'],
};
const SLOTS = { blacksmith: [-87, 4], armorsmith: [88, 4], industry: [-76, 85], condition: [76, 88], shipment: [0, -102] };
export const SETTLEMENT_SCENERY_ASSETS = Object.freeze(['workshop_01', 'ore_smelters_01', 'militia_trainingcamp_01',
  'wheat_field_02', 'lumber_camp_01', 'wool_spinner_01', 'salt_mine_01', 'iron_mine_01', 'fishing_huts_01', 'trade_cart', 'arms_cart']);

let cachedSeed, initialCamps = [];
function initialCampLayout(state) {
  if (cachedSeed !== state.seed) {
    cachedSeed = state.seed;
    initialCamps = getCampSites({ ...state, camps: {} }).map(({ x, y }) => ({ x, y }));
  }
  return initialCamps;
}
function condition(event, arrivals, departures) {
  if (event?.type === 'poor-harvest') return { art: 'wheat_farm_01', label: 'Poor harvest', symbol: '!', tone: 'danger', detail: event.description, state: 'hungry' };
  if (event?.type === 'good-harvest') return { art: 'trade_cart', label: 'Good harvest', symbol: '+', tone: 'good', detail: event.description, state: 'harvest' };
  const incoming = arrivals.find(wagon => wagon.status === 'under-attack') ?? arrivals.find(wagon => wagon.status === 'en-route');
  if (event?.type === 'arms-shortage') return { art: 'arms_cart', label: 'Arms shortage', symbol: '!', tone: 'danger', detail: event.description, state: 'lost' };
  if (incoming) return { art: 'arms_cart', label: incoming.status === 'under-attack' ? 'Wagon threatened' : 'Arms incoming',
    symbol: incoming.status === 'under-attack' ? '!' : '→', tone: incoming.status === 'under-attack' ? 'danger' : 'trade',
    detail: incoming.description, state: incoming.status };
  switch (event?.type) {
    case 'trade-caravan': return { art: 'trade_cart', label: 'Trade caravan', symbol: '↔', tone: 'trade', detail: event.description, state: 'trade' };
    case 'market-fair': return { art: 'trade_cart', label: 'Market fair', symbol: '↔', tone: 'good', detail: event.description, state: 'fair' };
    case 'armorer-shipment': return { art: 'arms_cart', label: 'Arms delivered', symbol: '✓', tone: 'good', detail: event.description, state: 'delivered' };
    case 'militia-muster': return { art: 'militia_trainingcamp_01', label: 'Militia muster', symbol: '⚑', tone: 'trade', detail: event.description, state: 'muster' };
    default: return departures.length ? { art: 'arms_cart', label: 'Wagon departed', symbol: '→', tone: 'trade',
      detail: departures[0].description, state: 'departing' } : null;
  }
}

// Read-only scenery: these objects never acquire campaign entity IDs or actions.
export function settlementScenery(state, town, { event = getTownEvent(state, town.id), caravans = [] } = {}) {
  const structures = townFacilities(state.seed, town).map(facility => ({ slot: facility.id,
    art: facility.id === 'blacksmith' ? 'ore_smelters_01' : 'workshop_01',
    label: facility.id === 'blacksmith' ? 'Blacksmith' : 'Armory', detail: facility.description,
    emblem: facility.id, width: 64 }));
  const supply = getTownLocalSupply(town.id);
  if (supply) {
    const coastal = /harbor|fisher/i.test(`${town.id} ${town.description}`) && supply.goodId === 'salt';
    const [art, label] = coastal ? ['fishing_huts_01', 'Fishing harbor'] : INDUSTRIES[supply.goodId];
    structures.push({ slot: 'industry', art, label, detail: `Local ${supply.name.toLowerCase()} supply keeps base prices below the usual market rate.`, width: 66 });
  } else if (town.kind === 'castle') structures.push({ slot: 'industry', art: 'militia_trainingcamp_01', label: 'Garrison',
    detail: 'Military recruits and supplies are available at this castle.', width: 64 });
  const activity = condition(event, caravans.filter(wagon => wagon.destinationId === town.id),
    caravans.filter(wagon => wagon.originId === town.id && ['en-route', 'under-attack'].includes(wagon.status)));
  if (activity) structures.push({ slot: 'condition', ...activity, width: activity.state === 'muster' ? 60 : 48 });
  if (['hungry', 'harvest'].includes(activity?.state)) {
    const wagon = condition(null, caravans.filter(wagon => wagon.destinationId === town.id),
      caravans.filter(wagon => wagon.originId === town.id && ['en-route', 'under-attack'].includes(wagon.status)));
    if (wagon) structures.push({ slot: 'shipment', ...wagon, width: 48 });
  }
  const placed = [], obstacles = initialCampLayout(state);
  for (const structure of structures) {
    const [dx, dy] = SLOTS[structure.slot];
    // Keep land buildings on land, while coastal fishing huts can sit on the shore.
    const start = Math.atan2(dy, dx);
    const candidates = [[dx, dy], [dx, -dy - 20], [-dx, dy], [-dx, -dy],
      ...[96, 112, 136, 160].flatMap(radius => Array.from({ length: 24 }, (_, index) => [Math.cos(start + index * Math.PI / 12) * radius, Math.sin(start + index * Math.PI / 12) * radius]))];
    const offset = candidates.find(([ox, oy]) => {
      const x = town.x + ox, y = town.y + oy;
      return x >= WORLD_BOUNDS.minX && x <= WORLD_BOUNDS.maxX && y >= WORLD_BOUNDS.minY && y <= WORLD_BOUNDS.maxY
        && (structure.art === 'fishing_huts_01' || terrainAt(x, y) !== 'sea')
        && !SETTLEMENTS.some(other => other.id !== town.id && Math.hypot(x - other.x, y - other.y) < 95)
        && !obstacles.some(camp => Math.hypot(x - camp.x, y - camp.y) < 75)
        && !placed.some(other => Math.hypot(x - other.x, y - other.y) < (structure.width + other.width) / 2 + 12);
    }) ?? [dx, dy];
    placed.push({ ...structure, townId: town.id, key: `${town.id}:${structure.slot}`, x: town.x + offset[0], y: town.y + offset[1], targetable: false });
  }
  return placed;
}

export function worldSettlementScenery(state) {
  const caravans = getCaravans(state);
  return SETTLEMENTS.flatMap(town => settlementScenery(state, town, { caravans }));
}

export function sceneryAt(structures, point) {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return null;
  return structures.find(structure => Math.abs(point.x - structure.x) <= Math.max(40, structure.width / 2)
    && point.y >= structure.y - structure.width * .85 && point.y <= structure.y + 24) ?? null;
}
