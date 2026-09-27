const EVENT_INTERVAL_DAYS = 12;

const EVENTS = Object.freeze({
  'good-harvest': Object.freeze({
    type: 'good-harvest',
    name: 'Good Harvest',
    description: 'Full granaries have brought food sellers into the market.',
    effects: Object.freeze(['Provisions and grain cost 20% less.', 'Food and grain stocks are plentiful.']),
  }),
  'poor-harvest': Object.freeze({
    type: 'poor-harvest',
    name: 'Poor Harvest',
    description: 'A thin harvest has tightened local food supplies.',
    effects: Object.freeze(['Provisions and grain cost 20% more.', 'Stocks are thinner, but basic food remains available.']),
  }),
  'trade-caravan': Object.freeze({
    type: 'trade-caravan',
    name: 'Trade Caravan',
    description: 'Fresh wagons have filled the market with goods from the road.',
    effects: Object.freeze(['Trade goods cost 10% less.', 'Trade-good stocks are plentiful.']),
  }),
  'market-fair': Object.freeze({
    type: 'market-fair',
    name: 'Market Fair',
    description: 'Visiting buyers are paying well for useful cargo.',
    effects: Object.freeze(['Trade goods sell for 15% more.']),
  }),
  'armorer-shipment': Object.freeze({
    type: 'armorer-shipment',
    name: 'Armorer Shipment',
    description: 'A guarded wagon has delivered a small consignment of quality arms.',
    effects: Object.freeze(['Ordinary gear costs 10% less.', 'The armory has extra uncommon gear while supplies last.']),
  }),
  'militia-muster': Object.freeze({
    type: 'militia-muster',
    name: 'Militia Muster',
    description: 'Local levies are buying equipment before they take the field.',
    effects: Object.freeze(['Ordinary gear costs 15% more.', 'Some armory stock is reserved for the militia.']),
  }),
});

const EVENT_TYPES = Object.freeze(Object.keys(EVENTS));

export function townEventHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

export function scheduledTownEvent(state, town) {
  const firstStart = 1 + townEventHash(`${state.seed}:${town.id}:event-offset`) % EVENT_INTERVAL_DAYS;
  if (state.day < firstStart) return null;
  const cycle = Math.floor((state.day - firstStart) / EVENT_INTERVAL_DAYS);
  const startDay = firstStart + cycle * EVENT_INTERVAL_DAYS;
  const duration = 3 + townEventHash(`${state.seed}:${town.id}:${cycle}:event-duration`) % 2;
  const endDay = startDay + duration - 1;
  if (state.day > endDay) return null;
  const type = town.kind === 'city'
    ? 'armorer-shipment'
    : EVENT_TYPES[townEventHash(`${state.seed}:${town.id}:${cycle}:event-type`) % EVENT_TYPES.length];
  const definition = EVENTS[type];
  const effects = [...definition.effects];
  return {
    id: `${town.id}:${startDay}:${type}`,
    type,
    name: definition.name,
    description: definition.description,
    effects,
    effectText: effects.join(' '),
    startDay,
    endDay,
    daysRemaining: endDay - state.day + 1,
  };
}

export function townEventModifiers(event) {
  switch (event?.type) {
    case 'good-harvest': return { foodBuy: .8, grainBuy: .8, foodStock: 10, grainStock: 5 };
    case 'poor-harvest': return { foodBuy: 1.2, grainBuy: 1.2, foodStock: -9, grainStock: -3 };
    case 'trade-caravan': return { goodsBuy: .9, goodsStock: 4 };
    case 'market-fair': return { goodsSell: 1.15 };
    case 'armorer-shipment': return { equipmentBuy: .9 };
    case 'arms-shortage': return { equipmentBuy: 1.2, equipmentSell: .9 };
    case 'militia-muster': return { equipmentBuy: 1.15, militiaReserve: true };
    default: return {};
  }
}
