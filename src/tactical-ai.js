export const COMBAT_ROLES = Object.freeze(['auto', 'frontliner', 'skirmisher', 'ranged', 'flanker']);
export const SKILL_PREFERENCES = Object.freeze(['balanced', 'damage', 'control']);

export function resolveCombatRole(member, weapon, reserveWeapon) {
  if (COMBAT_ROLES.includes(member.combatRole) && member.combatRole !== 'auto') return member.combatRole;
  const weapons = [weapon, reserveWeapon].filter(Boolean);
  if (weapons.some(item => item.ranged && !item.throwing)) return 'ranged';
  if (weapons.some(item => item.throwing)) return 'skirmisher';
  return 'frontliner';
}

export function scoreTacticalAction(actor, action, context = {}) {
  if (action.legal === false || action.apCost > actor.ap || action.fatigueCost > actor.maxFatigue - actor.fatigue) return -Infinity;
  const role = actor.tacticalRole ?? context.role ?? 'frontliner';
  const preference = actor.skillPreference ?? 'balanced';
  const damageWeight = preference === 'damage' ? 1.25 : preference === 'control' ? .85 : 1;
  const protectionWeight = preference === 'control' ? 1.4 : preference === 'damage' ? .8 : 1;
  const riskWeight = { frontliner: .9, skirmisher: 1.35, ranged: 1.8, flanker: 1.2 }[role] ?? 1;
  const value = key => Number.isFinite(action[key]) ? action[key] : 0;
  let score = damageWeight * (value('expectedHealthDamage') + .25 * value('expectedArmorDamage') + .35 * value('expectedShieldDamage'))
    + 35 * value('killProbability') + protectionWeight * value('preventedDamage')
    - riskWeight * value('incomingDamage') - .35 * value('apCost') - .12 * value('fatigueCost')
    - 18 * value('blocksAlly') - 3 * value('wastedAmmo');
  if (action.targetId && action.targetId === context.previousTargetId) score += 2;
  if (action.targetId && action.targetId === context.focusTargetId) score += 6;
  if (['defense', 'advance-formation', 'shield-wall'].includes(context.tactic)) score -= 4 * value('formationDistance');
  if (role === 'ranged' || role === 'skirmisher') score += 3 * value('spacingGain');
  if (role === 'flanker') score += 4 * value('flankGain');
  return score + value('bonus');
}

export function rankTacticalActions(actor, candidates, context = {}) {
  return candidates.map((action, index) => ({ ...action, score: scoreTacticalAction(actor, action, context), candidateIndex: index }))
    .filter(action => Number.isFinite(action.score))
    .sort((a, b) => b.score - a.score || String(a.id ?? a.type).localeCompare(String(b.id ?? b.type))
      || String(a.targetId ?? '').localeCompare(String(b.targetId ?? '')) || a.candidateIndex - b.candidateIndex);
}
