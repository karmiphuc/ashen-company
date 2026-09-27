export const CARAVAN_TRAVEL_HOURS = 30;
export const CARAVAN_ATTACK_WARNING_HOURS = 7;
export const CARAVAN_SHORTAGE_HOURS = 96;

export function shipmentId(townId, startDay) {
  return `shipment:${townId}:${startDay}`;
}

export function shipmentPlan(town, settlements, event) {
  // Eastmere's eastern trade road crosses Stonebridge rather than the northern pass.
  const origin = town.id === 'eastmere' ? settlements.find(place => place.id === 'stonebridge') : settlements.filter(place => place.id !== town.id)
    .sort((a, b) => Math.hypot(a.x - town.x, a.y - town.y) - Math.hypot(b.x - town.x, b.y - town.y) || a.id.localeCompare(b.id))[0];
  const departureHour = (event.startDay - 1) * 24;
  return { id: shipmentId(town.id, event.startDay), originId: origin.id, destinationId: town.id,
    departureHour, arrivalHour: departureHour + CARAVAN_TRAVEL_HOURS };
}

export function shipmentPosition(plan, origin, destination, hour) {
  const fraction = Math.max(0, Math.min(1, (hour - plan.departureHour) / CARAVAN_TRAVEL_HOURS));
  return { x: origin.x + (destination.x - origin.x) * fraction,
    y: origin.y + (destination.y - origin.y) * fraction };
}
