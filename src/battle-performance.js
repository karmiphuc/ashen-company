export const PERFORMANCE_KEYS = Object.freeze(['kills','armorDamageDealt','hpDamageDealt','armorDamageReceived']);
export const newBattlePerformance = () => Object.fromEntries(PERFORMANCE_KEYS.map(key => [key,0]));

// Actual losses, not damage rolls: overkill and armor beyond durability do not count.
// Optional counters keep legacy battles honest rather than inventing a full history.
export function recordBattlePerformance(actor,target,hpLost,armorLost,killed) {
  if (target.battleStats) target.battleStats.armorDamageReceived += armorLost;
  if (actor.side === target.side || !actor.battleStats) return;
  actor.battleStats.hpDamageDealt += hpLost;
  actor.battleStats.armorDamageDealt += armorLost;
  if (killed) actor.battleStats.kills++;
}
