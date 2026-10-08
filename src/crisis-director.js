// Saved campaign time, rather than rendering or wall time, drives the crisis.
export const ASHEN_CONFIG = Object.freeze({
  earliestDay: 60, companySize: 6, averageLevel: 7, delayDays: Object.freeze([7, 14]), warningHours: 168,
  waveDays: Object.freeze([3, 7]), waveBands: Object.freeze([2, 4]),
  // Legacy save validation only; current invasions have no gameplay caps.
  maxHosts: 12, hostsPerFront: 4, maxThreats: 3, maxBlocked: 12, blockedPerFront: 4, approachHours: 48, siegeHours: 72, protectionHours: 72,
  recoveryHours: 72, hostSpeed: 45, openingSize: 20, hostSize: 24, garrisonSize: 24,
  commanderSize: 30, hostGold: 150, liberationGold: 300, commanderGold: 600,
  finalGold: 1000, finalRenown: 5,
});
export function crisisHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export const campaignHour = state => (state.day - 1) * 24 + state.hour;
export function initialAshenWinter(seed) {
  return { version: 4, crisisId: 'ashen-winter', seed: crisisHash(`${seed}:ashen-winter`),
    phase: 'dormant', eligibilityHour: null, warningHour: null, activationHour: null,
    completedHour: null, fronts: [], hosts: {}, towns: {}, resolved: [],
    liberationCount: 0, hostVictories: 0, finalRewardGranted: false,
    finalItemClaimed: false, aftermath: null };
}
export function eligibleForAshen(state) {
  const equipped = state.party.filter(p => p.hp > 0 && p.equipment.weapon && p.equipment.armor)
    .map(p => p.level ?? 1).sort((a, b) => b - a);
  return state.day >= ASHEN_CONFIG.earliestDay && equipped.length >= ASHEN_CONFIG.companySize
    && equipped.slice(0, 6).reduce((sum, level) => sum + level, 0) / 6 >= ASHEN_CONFIG.averageLevel;
}
