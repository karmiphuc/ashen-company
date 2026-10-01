const KILL_THRESHOLD = .9;
const EPSILON = 1e-12;
const finiteNonnegative = value => Number.isFinite(value) && value >= 0;
const probability = value => finiteNonnegative(value) && value <= 1;

export function evaluateAreaSafety(impacts, { safeKillProbabilityById = {} } = {}) {
  const denied = reason => ({ allowed: false, exception: false, allyHealthDamage: 0, allyArmorDamage: 0, reason });
  if (!Array.isArray(impacts) || !impacts.length || impacts.some(impact => !impact
    || typeof impact.id !== 'string' || !impact.id || typeof impact.ally !== 'boolean'
    || !probability(impact.killProbability) || !finiteNonnegative(impact.maxHealthDamage)
    || !finiteNonnegative(impact.expectedHealthDamage) || !finiteNonnegative(impact.expectedArmorDamage)
    || !Number.isFinite(impact.hp) || impact.hp <= 0
    || impact.expectedHealthDamage > impact.maxHealthDamage + EPSILON
    || impact.maxHealthDamage < impact.hp && impact.killProbability > EPSILON)) return denied('Incomplete damage bounds');
  if (new Set(impacts.map(impact => impact.id)).size !== impacts.length) return denied('Duplicate affected fighter');
  const enemies = impacts.filter(impact => !impact.ally);
  const allies = impacts.filter(impact => impact.ally);
  if (!enemies.length) return denied('No enemy affected');
  if (!allies.length) return { allowed: true, exception: false, allyHealthDamage: 0, allyArmorDamage: 0, reason: '' };
  if (allies.some(impact => impact.maxHealthDamage >= impact.hp)) return denied('A friendly could die');
  const necessaryKill = enemies.some(impact => {
    if (impact.killProbability + EPSILON < KILL_THRESHOLD
      || !Object.hasOwn(safeKillProbabilityById, impact.id)) return false;
    const safeProbability = safeKillProbabilityById[impact.id];
    return probability(safeProbability) && safeProbability + EPSILON < KILL_THRESHOLD;
  });
  if (!necessaryKill) return denied('No necessary high-confidence kill');
  return {
    allowed: true,
    exception: true,
    allyHealthDamage: allies.reduce((sum, impact) => sum + impact.expectedHealthDamage, 0),
    allyArmorDamage: allies.reduce((sum, impact) => sum + impact.expectedArmorDamage, 0),
    reason: 'Necessary high-confidence kill; all friendlies survive worst-case damage',
  };
}

export function compareAreaSafety(left, right) {
  return left.allyHealthDamage - right.allyHealthDamage || left.allyArmorDamage - right.allyArmorDamage;
}
