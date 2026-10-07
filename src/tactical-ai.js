import { equipmentRangedReach, equipmentBoost, equipmentPerk } from './item-affixes.js';
import { hexDistance, hexLine } from './battle-terrain.js';

export const COMBAT_ROLES = Object.freeze(['auto', 'frontliner', 'skirmisher', 'ranged', 'flanker', 'breaker']);
export const SKILL_PREFERENCES = Object.freeze(['balanced', 'damage', 'control']);
export const ENEMY_TACTIC_COOLDOWN = 2;
export const ENEMY_TACTICS = Object.freeze(['offense', 'defense', 'shield-wall', 'skirmish']);

// Recomputed from living fighters: no saved flag can keep a recovered brother idle.
export function shouldPreserveBrother(battle, actor) {
  if (actor.side !== 'company' || actor.ally || !actor.alive || actor.escaped) return false;
  const living = battle.units.filter(unit => unit.alive && !unit.escaped);
  const allies = living.filter(unit => unit.side === actor.side);
  const enemies = living.filter(unit => unit.side !== actor.side);
  const health = unit => Math.max(0, Math.min(1, unit.hp / Math.max(1, unit.maxHp)));
  if (!enemies.length || !allies.some(unit => unit.id !== actor.id && health(unit) > .5)) return false;
  const strength = units => units.reduce((sum, unit) => sum + .25 + .75 * health(unit), 0);
  const winning = strength(allies) >= strength(enemies) * 1.35;
  return health(actor) <= (winning ? .45 : .25);
}

export function resolveCombatRole(member, weapon, reserveWeapon, equipment = {}) {
  if (COMBAT_ROLES.includes(member.combatRole) && member.combatRole !== 'auto') return member.combatRole;
  const weapons = [weapon, reserveWeapon].filter(Boolean);
  if (weapons.some(item => item.ranged && !item.throwing)) return 'ranged';
  if (weapons.some(item => item.throwing)) return 'skirmisher';
  if (['warhorse','armoredhorse'].includes(equipment.mount?.visual) && (equipment.armor?.armor ?? 0)>=160) return 'breaker';
  return 'frontliner';
}

// Shared by candidate selection and scoring: preferences never make an
// unaffordable action a valid reason to discard affordable alternatives.
export function isAffordableAction(actor, action) {
  return action.legal !== false && (action.apCost ?? 0) <= actor.ap
    && (action.fatigueCost ?? 0) <= Math.max(0, actor.maxFatigue - actor.fatigue);
}

export function scoreTacticalAction(actor, action, context = {}) {
  if (!isAffordableAction(actor, action)) return -Infinity;
  const role = actor.tacticalRole ?? context.role ?? 'frontliner';
  const preference = actor.skillPreference ?? 'balanced';
  const damageWeight = preference === 'damage' ? 1.25 : preference === 'control' ? .85 : 1;
  const protectionWeight = preference === 'control' ? 1.4 : preference === 'damage' ? .8 : 1;
  const riskWeight = { frontliner: .9, skirmisher: 1.35, ranged: 1.8, flanker: 1.2, breaker: .95 }[role] ?? 1;
  const value = key => Number.isFinite(action[key]) ? action[key] : 0;
  let score = damageWeight * (value('expectedHealthDamage') + .25 * value('expectedArmorDamage') + .35 * value('expectedShieldDamage'))
    + 35 * value('killProbability') + protectionWeight * value('preventedDamage')
    - riskWeight * value('incomingDamage') - .35 * value('apCost') - .12 * value('fatigueCost')
    - 18 * value('blocksAlly') - 3 * value('wastedAmmo');
  if (action.targetId && action.targetId === context.previousTargetId) score += 2;
  if (action.targetId && action.targetId === context.focusTargetId) score += 6;
  if (['defense', 'advance-formation', 'shield-wall', 'skirmish'].includes(context.tactic)) score -= 4 * value('formationDistance');
  if (role === 'ranged' || role === 'skirmisher') score += 3 * value('spacingGain');
  if (role === 'flanker' || role === 'breaker') score += 4 * value('flankGain');
  if (context.targetPriorities !== false && action.target) score += tacticalTargetPriority(role, action.target, action.targetWeapon,
    value('targetDistance'), context.nearestDistance ?? value('targetDistance'));
  return score + value('bonus');
}

export function rankTacticalActions(actor, candidates, context = {}) {
  return candidates.map((action, index) => ({ ...action, score: scoreTacticalAction(actor, action, context), candidateIndex: index }))
    .filter(action => Number.isFinite(action.score))
    .sort((a, b) => b.score - a.score || String(a.id ?? a.type).localeCompare(String(b.id ?? b.type))
      || String(a.targetId ?? '').localeCompare(String(b.targetId ?? '')) || a.candidateIndex - b.candidateIndex);
}

/** Read a committed adaptive command, or the original policy for an older fight. */
export function enemyBattleTactic(battle, getItem) {
  if (battle.enemyTacticsVersion !== 1) return 'offense';
  if (battle.enemyAdaptiveRulesVersion === 1 && battle.enemyTacticalState) return battle.enemyTacticalState.tactic;
  const ranged = battle.units.filter(unit => unit.side === 'enemy' && unit.alive && !unit.escaped
    && getItem(unit.equipment?.weapon)?.ranged
    && (!getItem(unit.equipment.weapon).throwing || unit.throwingAmmo?.active > 0));
  return ranged.length >= 3 ? 'defense' : 'offense';
}

// Commands are committed once per round, never while scoring a candidate or rendering.
export function updateEnemyTactic(battle, getItem, companyAmmo) {
  if (battle.enemyAdaptiveRulesVersion !== 1 || battle.status !== 'active') return false;
  const plan = battle.enemyTacticalState;
  if (plan.lastEvaluatedRound === battle.round) return false;
  plan.lastEvaluatedRound = battle.round;
  if (battle.round - plan.lastChangedRound < ENEMY_TACTIC_COOLDOWN) return false;
  const desired = recommendEnemyTactic(battle, getItem, companyAmmo);
  if (desired === plan.tactic) return false;
  plan.tactic = desired;
  plan.lastChangedRound = battle.round;
  for (const unit of battle.units) if (unit.side === 'enemy') delete unit.skirmishReturn;
  return true;
}

export function recommendEnemyTactic(battle, getItem, companyAmmo) {
  const living = unit => unit.alive && !unit.escaped;
  const enemies = battle.units.filter(unit => unit.side === 'enemy' && living(unit));
  const company = battle.units.filter(unit => unit.side === 'company' && living(unit));
  if (!enemies.length || !company.length) return 'offense';
  const ranged = units => units.filter(unit => {
    const weapon = getItem(unit.equipment?.weapon);
    return weapon?.ranged && (weapon.throwing ? unit.throwingAmmo?.active > 0
      : unit.side === 'enemy' || unit.ally || companyAmmo > 0);
  });
  const range = unit => {
    const weapon = getItem(unit.equipment.weapon);
    const bow = !weapon.throwing && weapon.visual?.includes('bow') && !weapon.visual.includes('crossbow');
    return (weapon.range ?? 1) + equipmentBoost(unit,'rangedReach',getItem) + (!weapon.throwing?equipmentRangedReach(unit,getItem):0) + (bow ? 1 + Number(Boolean(unit.perks?.includes('bow-mastery')||equipmentPerk(unit,'bow-mastery',getItem))) : 0);
  };
  const shooters = ranged(enemies);
  const threats = ranged(company).filter(unit => enemies.some(enemy => hexDistance(unit, enemy) <= range(unit)));
  const ready = shooters.filter(unit => company.some(target => hexDistance(unit, target) <= range(unit)));
  const infantry = enemies.filter(unit => !getItem(unit.equipment?.weapon)?.ranged);
  const engaged = infantry.filter(unit => company.some(target => hexDistance(unit, target) <= 1));
  if (engaged.length && engaged.length * 2 >= infantry.length) return 'offense';
  const lastAttackRound=battle.enemyTacticalState?.lastRangedAttackRound ?? 0;
  const underFire = threats.length > 0 || lastAttackRound > 0 && battle.round-lastAttackRound <= 2;
  if (underFire && (ready.length < threats.length || ready.length * 2 < shooters.length || !ready.length)) {
    const shields = infantry.filter(unit => unit.equipment.shield && unit.shieldDurability > 0
      && !getItem(unit.equipment.weapon)?.twoHanded);
    if (shields.length && shields.length * 2 >= infantry.length) return 'shield-wall';
    if (shooters.length) return 'skirmish';
    return 'offense';
  }
  return shooters.length >= 3 && ready.length >= 3 ? 'defense' : 'offense';
}


export function tacticalTargetPriority(role, target, weapon, distance, nearest = distance) {
  if (role === 'flanker') return weapon?.ranged ? 40 : (weapon?.range ?? 1) > 1 ? 30 : 0;
  if (role === 'breaker') return (weapon?.ranged ? 22 : (weapon?.range ?? 1)>1 ? 14 : 0)
    + (target.equipment?.shield && target.shieldDurability>0 ? 0 : 8)
    + Math.max(0,Math.min(10,(20-(target.meleeDefense ?? 0))*.4))
    + Math.max(0,Math.min(12,(1-target.hp/Math.max(1,target.maxHp))*12));
  if (role === 'skirmisher') return -Math.min(48, Math.max(0, distance-nearest)*16) + (!weapon?.ranged ? 6 : 0);
  if (role === 'ranged') return (weapon?.ranged ? 10 : 0)
    + (target.equipment?.shield && target.shieldDurability > 0 ? 0 : 8)
    + Math.max(-10, Math.min(10, (20-(target.rangedDefense ?? 0))*.3));
  return 0;
}

// An intact friendly shield within two hexes screens shots through its hex.
// The best screen applies once, so stacking soldiers cannot make a target unhittable.
export function rangedScreenModifier(battle, from, target) {
  const line = new Set(hexLine(from,target).map(p=>`${p.q},${p.r}`));
  let penalty = 0;
  for (const unit of battle.units) if (unit.id !== target.id && unit.side === target.side
    && unit.alive && !unit.escaped && unit.equipment?.shield && unit.shieldDurability > 0
    && hexDistance(unit,target) <= 2 && line.has(`${unit.q},${unit.r}`))
    penalty = Math.max(penalty,unit.shieldWallActive ? 18 : 12);
  return penalty ? -penalty : 0;
}
