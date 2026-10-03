import { campaignHour } from './crisis-director.js';

export function settlementAccess(state, townId) {
  const town = state.ashenWinter?.towns[townId];
  const now = campaignHour(state);
  const status = town?.status === 'recovering' && town.recoveryUntil <= now ? 'open' : town?.status ?? 'open';
  const servicesAvailable = status !== 'besieged' && status !== 'occupied';
  return { status, servicesAvailable, reason: servicesAvailable ? '' : 'Settlement closed — liberate it to restore services.',
    encounterId: servicesAvailable ? null : town.force.id,
    warningUntil: status === 'threatened' ? town.warningUntil : null,
    siegeUntil: status === 'besieged' ? town.siegeUntil : null,
    recoveryUntil: status === 'recovering' ? town.recoveryUntil : null };
}
