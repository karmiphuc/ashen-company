export const CARAVAN_TRAVEL_HOURS = 60;
export const CARAVAN_ATTACK_WARNING_HOURS = 7;
export const CARAVAN_SHORTAGE_HOURS = 96;

export function shipmentId(townId, startDay) {
  return `shipment:${townId}:${startDay}`;
}

export function shipmentPlan(town, settlements, event, travelHours = CARAVAN_TRAVEL_HOURS, travelStartHour = (event.startDay - 1) * 24) {
  // Eastmere's eastern trade road crosses Stonebridge rather than the northern pass.
  const origin = town.id === 'eastmere' ? settlements.find(place => place.id === 'stonebridge') : settlements.filter(place => place.id !== town.id)
    .sort((a, b) => Math.hypot(a.x - town.x, a.y - town.y) - Math.hypot(b.x - town.x, b.y - town.y) || a.id.localeCompare(b.id))[0];
  const departureHour = (event.startDay - 1) * 24;
  return { id: shipmentId(town.id, event.startDay), originId: origin.id, destinationId: town.id,
    departureHour, travelHours, travelStartHour, arrivalHour: travelStartHour + travelHours };
}

export function shipmentPosition(plan, origin, destination, hour) {
  const fraction = Math.max(0, Math.min(1, (hour - plan.travelStartHour) / plan.travelHours));
  return { x: origin.x + (destination.x - origin.x) * fraction,
    y: origin.y + (destination.y - origin.y) * fraction };
}

function pointSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

export function routeSegmentDistance(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC * abD <= 0 && cdA * cdB <= 0
    && Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <= Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x))
    && Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <= Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y))) return 0;
  return Math.min(pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b));
}
