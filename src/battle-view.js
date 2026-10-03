import { weaponSkillFamily } from './combat-skills.js';
import { getEquipment, getItem, getMoraleEffects, shieldMaximum, throwingCapacity } from './engine.js';
import { portraitHTML, portraitWeaponAnchor, itemImage } from './portraits.js';

const LEGACY_FIELD = { columns: 10, rows: 5, biome: 'grassland', tiles: [] };
const TILE = { width: 76, height: 85, stepX: 76, stepY: 64, stagger: 38, elevation: 20, padX: 16, padY: 80, padBottom: 22 };
const TERRAIN = {
  open: ['Open ground', '1 AP to enter · no cover'],
  trees: ['Trees', '20 percentage points ranged protection · 2 AP to enter'],
  'dense-trees': ['Dense trees', 'Impassable · obstructs ranged shots'],
  brush: ['Brush', '10 percentage points ranged protection · 1 AP to enter'],
  mud: ['Mud', '2 AP to enter · no cover'],
  rock: ['Rock', '1 AP to enter · no height advantage unless raised'],
};
const TACTICS = [
  ['offense', 'Offense', 'Advance and engage the nearest reachable enemy.'],
  ['defense', 'Defense', 'Hold the line and shoot. Advance if the enemy refuses to close.'],
  ['focus', 'Thin them out', 'Concentrate fire and attacks on one reachable enemy at a time.'],
  ['advance-formation', 'Advance in Formation', 'Advance together one hex at a time. Keep ranks and attack without chasing ahead.'],
  ['shield-wall', 'Shield Wall', 'Shielded melee fighters and skirmishers form the front. Archers and unshielded two-handers stay behind.'],
];

export function battleActionDuration(speed = 1) { return speed === 3 ? .275 : speed === 1 ? .55 : 1.1; }

export function tacticsHTML(tactic = 'offense', disabled = false) {
  const current = TACTICS.find(entry => entry[0] === tactic) || TACTICS[0];
  return `<div class="battle-tactics"><div role="group" aria-label="Company tactics">${TACTICS.map(([id, label]) => `<button data-tactic="${id}" aria-pressed="${current[0] === id}" ${disabled ? 'disabled' : ''}>${label}</button>`).join('')}</div><p>${current[2]}</p></div>`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percent(value, maximum) {
  return Math.max(0, Math.min(100, Math.round(number(value) / Math.max(1, number(maximum, 1)) * 100)));
}

function fieldModel(battle) {
  const source = battle?.field && typeof battle.field === 'object' ? battle.field : LEGACY_FIELD;
  const columns = Math.max(4, Math.min(20, Math.floor(number(source.columns, 10))));
  const rows = Math.max(3, Math.min(16, Math.floor(number(source.rows, 5))));
  const supplied = Array.isArray(source.tiles) ? source.tiles : [];
  const byCoordinate = new Map();
  for (const tile of supplied) {
    const q = Math.floor(number(tile?.q, -1)), r = Math.floor(number(tile?.r, -1));
    if (q < 0 || q >= columns || r < 0 || r >= rows) continue;
    const terrain = Object.hasOwn(TERRAIN, tile?.terrain) ? tile.terrain : 'open';
    byCoordinate.set(`${q},${r}`, { q, r, terrain, height: Math.max(0, Math.min(2, Math.floor(number(tile?.height)))) });
  }
  const tiles = [];
  for (let r = 0; r < rows; r++) for (let q = 0; q < columns; q++) tiles.push(byCoordinate.get(`${q},${r}`) || { q, r, terrain: 'open', height: 0 });
  return { columns, rows, biome: String(source.biome || 'grassland').toLowerCase().replace(/[^a-z0-9-]/g, ''), tiles, apScale: battle?.rulesVersion === 2 ? 2 : 1 };
}

function gridModel(field) {
  return {
    ...TILE,
    apScale: field.apScale,
    fieldWidth: TILE.padX * 2 + (field.columns - 1) * TILE.stepX + (field.rows - 1) * TILE.stagger + TILE.width,
    fieldHeight: TILE.padY + (field.rows - 1) * TILE.stepY + Math.max(TILE.height, 122) + TILE.padBottom,
  };
}

function fieldTile(field, q, r) {
  return field.tiles[r * field.columns + q] || { q, r, terrain: 'open', height: 0 };
}

function tileHTML(tile, grid) {
  const [name, baseEffect] = TERRAIN[tile.terrain];
  const effect = baseEffect.replace(/\b([12]) AP to enter/g, (_, cost) => `${Number(cost) * grid.apScale} AP to enter`);
  const elevation = tile.height ? `Height ${tile.height}; high-ground attacks gain 10 hit per level` : 'Ground level';
  const detail = `${name}, ${elevation}. ${effect}`;
  const x = grid.padX + tile.q * grid.stepX + tile.r * grid.stagger;
  const y = grid.padY + tile.r * grid.stepY - tile.height * grid.elevation;
  const variant = tile.terrain === 'open' && (tile.q + tile.r) % 3 === 1 ? ' battle-hex-grass-alt' : '';
  const wall = tile.height ? '<span class="battle-hex-wall" aria-hidden="true"></span>' : '';
  const obstacle = tile.terrain === 'dense-trees' ? '<span class="battle-tree-obstacle" aria-hidden="true"></span>' : '';
  return `<button type="button" class="battle-hex battle-terrain-${tile.terrain} battle-height-${tile.height}${variant}" style="left:${x}px;top:${y}px;--tile-row:${tile.r};--tile-height:${tile.height};--tile-rise:${tile.height * grid.elevation}px" data-action="inspect-terrain" data-q="${tile.q}" data-r="${tile.r}" data-terrain="${tile.terrain}" data-height="${tile.height}" data-detail="${esc(detail)}" title="${esc(detail)}" aria-label="Column ${tile.q + 1}, row ${tile.r + 1}: ${esc(detail)}">${wall}<span class="battle-hex-top" aria-hidden="true"></span>${obstacle}${tile.height ? `<span class="battle-height-label" aria-hidden="true">+${tile.height}</span>` : ''}</button>`;
}

function coordinates(unit, field, grid) {
  const q = Math.max(0, Math.min(field.columns - 1, Math.floor(number(unit?.q))));
  const r = Math.max(0, Math.min(field.rows - 1, Math.floor(number(unit?.r))));
  const height = fieldTile(field, q, r).height;
  return { x: grid.padX + q * grid.stepX + r * grid.stagger + grid.width / 2, y: grid.padY + r * grid.stepY - height * grid.elevation + 2 };
}

function pawnName(unit) {
  const words = String(unit.name || 'Unknown').trim().split(/\s+/).filter(word => !/^\d+$/.test(word));
  return unit.ally ? words.at(-1) || 'Ally' : unit.side === 'company' ? words[0] || 'Companion' : words.at(-1) || 'Enemy';
}

function equipmentFor(unit) {
  try {
    const equipment = getEquipment(unit);
    return equipment.shield && unit.shieldDurability === 0 ? { ...equipment, shield: null } : equipment;
  } catch {
    return {};
  }
}

function shieldCondition(unit) {
  const max = unit.equipment?.shield ? unit.maxShieldDurability ?? shieldMaximum(unit.equipment.shield) : 0;
  return max ? { current: unit.shieldDurability ?? max, max } : null;
}

const WEAPON_MOVES = { sword: 'Slash', 'two-handed-sword': 'Overhead Strike', dagger: 'Stab', qatal: 'Stab',
  spear: 'Thrust', polearm: 'Strike', axe: 'Chop', cleaver: 'Cleave', mace: 'Bash', hammer: 'Smash',
  flail: 'Lash', whip: 'Whip Crack', bow: 'Loose Arrow', crossbow: 'Fire Bolt', sling: 'Sling Stone', throwing: 'Throw' };
function actionCallout(event, weapon) {
  if (event.skillName === 'Hold' || event.type === 'hold' && !event.skillName) return '';
  if (event.skillName) return event.skillName;
  if (['attack', 'miss', 'hit', 'fall'].includes(event.type)) return WEAPON_MOVES[weaponSkillFamily(weapon)] ?? 'Strike';
  return { move: 'Move', recover: event.message?.includes(' reloads ') ? 'Reload' : 'Recover',
    hold: 'Hold', swap: 'Swap set', use: 'Use item' }[event.type] ?? '';
}
function perkEffectsHTML(effects) {
  const names = { 'battle-flow': 'Battle Flow', 'killing-frenzy': 'Killing Frenzy', berserk: 'Berserk', howling: 'Howling' };
  return effects.filter(effect => names[effect.id]).map(effect => `<span class="battle-perk-proc proc-${effect.id}" role="status"><i aria-hidden="true"></i>${names[effect.id]}<small>${effect.id === 'battle-flow' ? `−${number(effect.amount)} fatigue` : effect.id === 'killing-frenzy' ? '+25% damage' : effect.id === 'howling' ? 'Enemy damage −20% · 2 turns' : `+${number(effect.amount)} AP${effect.nextTurn ? ' next turn' : ''}`}</small></span>`).join('');
}

function statusIconsHTML(unit, battle) {
  const statuses = [
    unit.alive !== false && unit.hp > 0 && unit.frenzyUntilRound > 0 && unit.frenzyUntilRound >= battle.round ? ['frenzy', 'Killing Frenzy: +25% damage', '<path d="m8 1 2 5 3-2-1 7-4 4-4-4-1-7 3 2z"/>'] : null,
    unit.alive && unit.howlTurns > 0 ? ['howled', `Howled: −20% damage for ${unit.howlTurns} more turn${unit.howlTurns === 1 ? '' : 's'}`, '<path d="M1 7h2v2H1zm4-3h2v8H5zm4-2h2v12H9zm4 3h2v6h-2z"/>'] : null,
    unit.alive && unit.fleeRound === battle.round ? ['fleeing', 'Fleeing', '<path d="M1 7h10L8 4l1-1 5 5-5 5-1-1 3-3H1z"/>'] : null,
    unit.shieldWallActive ? ['shieldwall', 'Shield wall active', '<path d="M8 1 14 3v4.5c0 3.2-2.1 5.9-6 7.5-3.9-1.6-6-4.3-6-7.5V3z"/>'] : null,
    unit.spearwallActive ? ['spearwall', 'Spearwall active', '<path d="M2 14 11.3 4.7l.9.9L2.9 15zM11 2l3 3-1 1-3-3z"/>'] : null,
    unit.riposteActive ? ['riposte', 'Riposte active', '<path d="M2 3 3 2l11 11-1 1zm11-1 1 1L3 14l-1-1zM2 2l3 1-2 2zm9 9 3 0-1 3zm3-9-3 1 2 2zm-9 9-3 0 1 3z"/>'] : null,
    number(unit.stunnedTurns) > 0 ? ['stunned', 'Stunned', '<path d="m8 1 1.2 4.3 3.8-2.3-1.7 4 4.7.2-4.1 1.9 3.1 3.5-4.5-1.2-.5 4.6-2-4.2-3.4 3 .9-4.6-4.6-.8 4-2.1-3.3-3.3 4.6 1z"/>'] : null,
    unit.stunProtected && number(unit.stunnedTurns) === 0 ? ['stun-protected', 'Stun protected', '<path d="M8 1 14 3v4.5c0 3.2-2.1 5.9-6 7.5-3.9-1.6-6-4.3-6-7.5V3zM7 10l-2-2 1-1 1 1 3-3 1 1z"/>'] : null,
  ].filter(Boolean);
  return statuses.map(([id, label, path], index) => `<span class="battle-shieldwall battle-status-icon battle-status-${id}" style="left:${index * 18}px" role="img" title="${label}" aria-label="${label}"><svg viewBox="0 0 16 16" aria-hidden="true">${path}</svg></span>`).join('');
}

function reactionsFor(event) {
  return Array.isArray(event?.reactions) ? event.reactions : [];
}

function impactsFor(event, unitId) {
  const affected = Array.isArray(event?.affectedTargets) ? event.affectedTargets : [];
  const impacts = affected.filter(entry => (entry?.id ?? entry?.targetId) === unitId);
  if (event?.targetId === unitId && ['attack', 'hit', 'fall', 'miss'].includes(event.type)
    && !affected.some(entry => (entry?.id ?? entry?.targetId) === unitId)) impacts.push(event);
  for (const reaction of reactionsFor(event)) if (reaction?.targetId === unitId) impacts.push(reaction);
  return impacts;
}

function battleKitHTML(unit) {
  const reserve = [unit?.reserveEquipment?.weapon,unit?.reserveEquipment?.shield].filter(Boolean).length;
  const accessories = Array.isArray(unit?.accessories) ? unit.accessories.filter(Boolean).length : 0;
  const stowed = unit?.pocketDrawnFrom !== null && unit?.pocketDrawnFrom !== undefined;
  const activeWeapon = getItem(stowed ? unit?.pocketStowedWeapon : unit?.equipment?.weapon);
  const reserveWeapon = getItem(unit?.reserveEquipment?.weapon);
  const activeCharges = activeWeapon?.throwing ? unit?.throwingAmmo?.active ?? throwingCapacity(activeWeapon) : null;
  const reserveCharges = reserveWeapon?.throwing ? unit?.throwingAmmo?.reserve ?? throwingCapacity(reserveWeapon) : null;
  const ammo = [activeCharges === null ? '' : activeCharges + '/' + throwingCapacity(activeWeapon), reserveCharges === null ? '' : 'R' + reserveCharges + '/' + throwingCapacity(reserveWeapon)].filter(Boolean).join(' · ');
  const ammoDetails = [activeCharges === null ? '' : activeWeapon.name + ' ' + activeCharges + '/' + throwingCapacity(activeWeapon), reserveCharges === null ? '' : 'reserve ' + reserveWeapon.name + ' ' + reserveCharges + '/' + throwingCapacity(reserveWeapon)].filter(Boolean).join('; ');
  if (!reserve && !accessories && !ammo && !unit.ally) return '';
  const labels = [unit.ally ? 'Allied fighter' : '', reserve ? `reserve set ${reserve === 2 ? 'ready' : 'partial'}` : '', accessories ? `${accessories} carried ${accessories === 1 ? 'accessory' : 'accessories'}` : '', ammoDetails ? 'throwing ammunition ' + ammoDetails : ''].filter(Boolean);
  return '<span class="battle-kit" aria-label="' + esc(labels.join('; ')) + '">' + (unit.ally ? '<i>Ally</i>' : '') + (reserve ? '<i>Reserve</i>' : '') + (accessories ? '<i>Bag ' + accessories + '</i>' : '') + (ammo ? '<i>Ammo ' + esc(ammo) + '</i>' : '') + '</span>';
}

function unitHTML(unit, battle, animateEvent, field, grid) {
  const { x, y } = coordinates(unit, field, grid);
  const alive = unit.alive !== false && number(unit.hp, 1) > 0;
  const event = animateEvent ? battle.lastEvent || {} : {};
  const reactions = reactionsFor(event);
  const primaryActor = event.actorId === unit.id;
  const reaction = reactions.find(entry => entry?.actorId === unit.id);
  const reactionTarget = reactions.some(entry => entry?.targetId === unit.id);
  const effects = [...(primaryActor ? event.effects ?? [] : []), ...reactions.filter(entry => entry.actorId === unit.id).flatMap(entry => entry.effects ?? [])];
  const frenzy = alive && unit.frenzyUntilRound > 0 && unit.frenzyUntilRound >= battle.round;
  const callouts = [...new Set([...(primaryActor ? [actionCallout(event, getItem(event.weaponId) ?? equipmentFor(unit).weapon)] : []),
    ...reactions.filter(entry => entry.actorId === unit.id).map(entry => actionCallout(entry, getItem(entry.weaponId) ?? equipmentFor(unit).weapon))].filter(Boolean))];
  const primaryTarget = event.targetId === unit.id;
  const impacts = impactsFor(event, unit.id);
  const hasImpact = impacts.length > 0;
  const primaryMiss = primaryTarget && event.type === 'miss';
  const hasHit = impacts.some(impact => impact.hit !== false && impact.type !== 'miss');
  const hasMiss = primaryMiss || impacts.some(impact => impact.hit === false || impact.type === 'miss');
  const shieldDamage = impacts.reduce((total, impact) => total + number(impact.shieldDamage), 0);
  const attacking = ['attack', 'hit', 'fall', 'miss'].includes(event.type);
  const origin = coordinates(event.from || unit, field, grid);
  const moveOrigin = coordinates(primaryTarget && event.pushedFrom ? event.pushedFrom : primaryActor && event.moveFrom ? event.moveFrom : event.from || unit, field, grid);
  const destination = coordinates(event.to || unit, field, grid);
  const strikeOrigin = reaction ? coordinates(reaction.from || unit, field, grid) : origin;
  const reactionTargetUnit = reaction ? battle.units.find(entry => entry.id === reaction.targetId) : null;
  const strikeDestination = reaction ? coordinates(reaction.to || reactionTargetUnit || unit, field, grid) : destination;
  const dx = strikeDestination.x - strikeOrigin.x, dy = strikeDestination.y - strikeOrigin.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const weapon = equipmentFor(unit).weapon;
  const primaryWeapon = primaryActor ? getItem(event.weaponId) || weapon : weapon;
  const motionFor = (item, ranged) => ranged || item?.ranged ? 'shoot' : ['spear', 'billhook', 'dagger'].includes(item?.visual) ? 'thrust' : 'swing';
  const primaryMotion = primaryActor && attacking ? motionFor(primaryWeapon, event.ranged) : null;
  const reactionMotion = reaction ? reaction.skillName === 'Wolf Bite' ? 'bite' : motionFor(weapon, reaction.ranged) : null;
  const motionClasses = [...new Set([primaryMotion, reactionMotion].filter(Boolean).map(motion => `action-${motion}`))];
  const hpDamage = impacts.reduce((total, impact) => total + number(impact.hpDamage), 0);
  const bodyDamage = impacts.reduce((total, impact) => total + (impact.head ? 0 : number(impact.armorDamage)), 0);
  const headDamage = impacts.reduce((total, impact) => total + (impact.head ? number(impact.armorDamage) : 0), 0);
  const impactFallen = impacts.some(impact => impact.fallen) || primaryTarget && Boolean(event.fallen);
  const attacker = battle.units.find(entry => entry.id === event.actorId);
  const friendlyFire = event.friendlyFire === true && attacker && attacker.id !== unit.id && attacker.side === unit.side && hasHit;
  const classes = [
    'battle-unit',
    unit.side === 'company' ? 'battle-unit-company' : 'battle-unit-enemy',
    unit.ally ? 'battle-unit-ally' : '',
    unit.champion ? 'battle-unit-champion' : '',
    alive ? 'battle-unit-alive' : 'battle-unit-down',
    (animateEvent && event.actorId ? event.actorId : battle.activeId) === unit.id || reaction ? 'is-active' : '',
    primaryActor || reaction ? 'is-acting' : '',
    reaction ? 'is-reacting' : '',
    primaryTarget || hasImpact || reactionTarget ? 'is-target' : '',
    ...motionClasses,
    primaryActor && (event.type === 'move' || event.moveFrom) || primaryTarget && event.pushedFrom ? 'action-move' : '',
    primaryActor && ['recover', 'hold', 'swap', 'use'].includes(event.type) ? 'action-hold' : '',
    hasHit || shieldDamage > 0 ? 'action-hit' : '',
    impactFallen ? 'action-fall' : '',
    friendlyFire ? 'is-friendly-fire' : '',
    frenzy ? 'has-killing-frenzy' : '',
    alive && unit.howlTurns > 0 ? 'is-howled' : '',
    effects.length && y < effects.length * 45 + Math.max(80, callouts.length * 26 + 30) ? 'perks-below' : '',
    x < 85 ? 'feedback-at-left' : x > grid.fieldWidth - 85 ? 'feedback-at-right' : '',
    ...effects.map(effect => `effect-${effect.id}`),
  ].filter(Boolean).join(' ');
  const health = percent(unit.hp, unit.maxHp ?? 100);
  const bodyArmor = number(unit.bodyArmor) + number(unit.attachmentArmor) + number(unit.attachment2Armor);
  const maxBodyArmor = number(unit.maxBodyArmor ?? unit.bodyArmor) + number(unit.maxAttachmentArmor) + number(unit.maxAttachment2Armor);
  const body = percent(bodyArmor, Math.max(maxBodyArmor, 1));
  const head = percent(unit.headArmor, unit.maxHeadArmor ?? Math.max(number(unit.headArmor), 1));
  const shield = shieldCondition(unit);
  const beforeShield = shield && hasImpact ? percent(shield.current + shieldDamage, shield.max) : shield ? percent(shield.current, shield.max) : 0;
  const maxAp = battle.rulesVersion === 2 ? 9 : 2;
  const beforeHealth = hasImpact ? percent(number(unit.hp) + hpDamage, unit.maxHp ?? 100) : health;
  const beforeBody = hasImpact ? percent(bodyArmor + bodyDamage, maxBodyArmor || 1) : body;
  const beforeHead = hasImpact ? percent(number(unit.headArmor) + headDamage, unit.maxHeadArmor || 1) : head;
  const display = { seed: unit.seed ?? unit.id ?? 0, name: unit.name ?? 'Unknown' };
  const morale = getMoraleEffects(unit);
  const moraleLabel = `${morale.name} morale: ${Math.round(number(unit.morale, 50))}/100; resolve ${Math.round(number(unit.resolve, 50))}`;

  return `<article class="${classes}" data-unit-id="${esc(unit.id)}" style="left:${x}px;top:${y}px;--unit-depth:${15 + number(unit.r) * 10};--callout-space:${Math.max(34, callouts.length * 26 + 8)}px;--move-x:${moveOrigin.x - x}px;--move-y:${moveOrigin.y - y}px;--strike-x:${(dx / length * 13).toFixed(2)}px;--strike-y:${(dy / length * 13).toFixed(2)}px" aria-label="${unit.ally?'Allied fighter, ':''}${esc(unit.name)}: ${Math.round(number(unit.hp))} health${friendlyFire?', friendly fire impact':''}">
    <div class="battle-unit-bars" aria-hidden="true">
      <span class="battle-unit-bar battle-unit-head"><i style="width:${head}%;--before-width:${beforeHead}%;--after-width:${head}%"></i></span>
      <span class="battle-unit-bar battle-unit-body"><i style="width:${body}%;--before-width:${beforeBody}%;--after-width:${body}%"></i></span>
      ${shield ? `<span class="battle-unit-bar battle-unit-shield" title="Shield: ${shield.current} / ${shield.max} durability${shield.current===0?' · Broken':''}"><i style="width:${percent(shield.current,shield.max)}%;--before-width:${beforeShield}%;--after-width:${percent(shield.current,shield.max)}%;background:#a98b55"></i></span>` : ''}
      <span class="battle-unit-bar battle-unit-health"><i style="width:${health}%;--before-width:${beforeHealth}%;--after-width:${health}%"></i></span>
    </div>
    <span class="battle-pawn">${frenzy ? '<span class="battle-frenzy-aura" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}${effects.some(effect => effect.id === 'howling') ? '<span class="battle-howl-waves" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}${portraitHTML(display, equipmentFor(unit), 64)}</span>
    <span class="battle-morale-flag morale-${morale.name.toLowerCase()}" title="${esc(moraleLabel)}" aria-label="${esc(moraleLabel)}">${morale.name[0]}</span>
    ${statusIconsHTML(unit, battle)}
    ${battleKitHTML(unit)}
    <strong>${unit.champion?'<span class="champion-star" title="Champion · guaranteed named trophy">★</span> ':''}${esc(pawnName(unit))}</strong>
    <small>${Math.max(0, Math.round(number(unit.ap)))}/${maxAp} AP · ${Math.max(0, Math.round(number(unit.fatigue)))} F</small>
    ${hasImpact || primaryMiss ? `<span class="battle-impact" aria-hidden="true">${hasHit ? `${friendlyFire ? 'Friendly fire · ' : ''}${hpDamage}${bodyDamage + headDamage ? ` / ${bodyDamage + headDamage}` : ''}${shieldDamage ? ` · Shield -${shieldDamage}` : ''}${hasMiss ? ' · Miss' : ''}` : shieldDamage ? `Deflected · Shield -${shieldDamage}` : 'Miss'}</span>` : ''}
    ${callouts.length ? `<span class="battle-orders">${callouts.map(label => `<span class="battle-order">${esc(label)}</span>`).join('')}</span>` : ''}
    ${effects.length ? `<span class="battle-perk-effects">${perkEffectsHTML(effects)}</span>` : ''}
  </article>`;
}

function projectileHTML(battle, animateEvent, field, grid) {
  const event = battle.lastEvent;
  if (!animateEvent || !event?.ranged || !['attack', 'hit', 'fall', 'miss'].includes(event.type)) return '';
  const actor = battle.units.find(unit => unit.id === event.actorId);
  const target = battle.units.find(unit => unit.id === event.targetId);
  if (!actor || !target) return '';
  const start = coordinates(event.from || actor, field, grid), end = coordinates(event.to || target, field, grid);
  const grip = portraitWeaponAnchor(equipmentFor(actor));
  start.x += (grip.x - 52) * (64 / 104) * (actor.side === 'enemy' ? -1 : 1);
  start.y += 10 + grip.y * (64 / 104); end.y += event.head ? 29 : 50;
  if (event.type === 'miss') { end.x += 20; end.y -= 12; }
  const dx = end.x - start.x, dy = end.y - start.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const kind = ['bolt','javelin','axe','stone'].includes(event.projectile) ? event.projectile : 'arrow';
  const thrownWeapon = kind === 'javelin' || kind === 'axe' ? getItem(event.weaponId) : null;
  const thrownIcon = thrownWeapon ? itemImage(thrownWeapon) || `assets/items/${thrownWeapon.baseId || thrownWeapon.id}.png` : null;
  const label = { arrow:'Arrow', bolt:'Crossbow bolt', javelin:'Javelin', axe:'Throwing axe', stone:'Sling stone' }[kind];
  return `<div class="battle-projectile is-${kind}" aria-label="${label} in flight" style="left:${start.x}px;top:${start.y}px;--flight-x:${dx}px;--flight-y:${dy}px;--flight-angle:${angle}deg">${thrownIcon?`<img src="${thrownIcon}" alt="" draggable="false">`:'<span></span>'}</div>`;
}

function statusText(status) {
  return ({ victory: 'Victory', defeat: 'Defeat', retreat: 'Retreat' }[status] || 'Engaged');
}

function terrainLegend(field) {
  const terrain = [...new Set(field.tiles.map(tile => tile.terrain))];
  return `<div class="battle-terrain-key" aria-label="Terrain legend"><strong>${esc(field.biome || 'Battlefield')} · ${field.columns} × ${field.rows}</strong>${terrain.map(kind => `<span><i class="battle-key-${kind}"></i>${esc(TERRAIN[kind][0])}</span>`).join('')}<span><i class="battle-key-height"></i>Raised</span><small>Tap a tile for terrain and height.</small></div>`;
}

/** Render a scrollable tactical battle surface from battle state. */
export function battleHTML(battle = {}, speed = 1, animateEvent = false) {
  const units = Array.isArray(battle.units) ? battle.units : [];
  const active = units.find(unit => unit.id === (animateEvent && battle.lastEvent?.actorId ? battle.lastEvent.actorId : battle.activeId));
  const field = fieldModel(battle);
  const grid = gridModel(field);
  const tiles = field.tiles.map(tile => tileHTML(tile, grid)).join('');
  const log = Array.isArray(battle.log) ? battle.log.slice(-6).reverse() : [];
  const selectedSpeed = [0, 1, 3].includes(Number(speed)) ? Number(speed) : 1;
  const status = String(battle.status || 'active');
  const morale = getMoraleEffects(active || {});
  const moralePercent = Math.round(morale.modifier * 100);
  const skillName = animateEvent && battle.lastEvent?.actorId === active?.id ? battle.lastEvent?.skillName : null;

  return `<section class="battle-view battle-status-${esc(status)}" style="--action-time:${battleActionDuration(speed)}s" aria-label="Tactical battle">
    <header class="battle-topbar">
      <div><span class="battle-kicker">TACTICAL ENGAGEMENT</span><strong>Round ${Math.max(1, Math.round(number(battle.round, 1)))}</strong></div>
      <div class="battle-turn"><span>TURN</span><strong>${esc(active?.name || 'Resolving')} ${active ? animateEvent ? 'acting' : 'to act' : ''}</strong></div>
      <strong class="battle-status">${statusText(status)}</strong>
    </header>
    <div class="battle-layout">
      <div class="battle-scroll" tabindex="0" aria-label="Battlefield scroll area">
        ${terrainLegend(field)}
        <div class="battlefield battle-biome-${esc(field.biome)}" style="--field-width:${grid.fieldWidth}px;--field-height:${grid.fieldHeight}px" role="group" aria-label="${field.columns} by ${field.rows} hex battlefield with ${units.filter(unit => unit.side === 'company' && !unit.ally).length} company fighters, ${units.filter(unit => unit.ally).length} allied fighters and ${units.filter(unit => unit.side !== 'company').length} enemies">
          <div class="battle-terrain">${tiles}</div>
          <div class="battle-units">${units.filter(unit => !unit.escaped).map(unit => unitHTML(unit, battle, animateEvent, field, grid)).join('')}${projectileHTML(battle, animateEvent, field, grid)}</div>
        </div>
      </div>
      <aside class="battle-log" aria-label="Battle event log">
        ${active ? `<section class="battle-morale-report morale-${morale.name.toLowerCase()}"><h3>${esc(active.name)}</h3><strong>${morale.name} · ${Math.round(number(active.morale, 50))}/100 morale</strong><p>Resolve ${Math.round(number(active.resolve, 50))} · ${moralePercent > 0 ? '+' : ''}${moralePercent}% attack and defense</p>${skillName?`<p class="battle-skill-status">Skill used: ${esc(skillName)}</p>`:''}${shieldCondition(active)?`<p>Shield ${shieldCondition(active).current} / ${shieldCondition(active).max} durability${shieldCondition(active).current===0?' · Broken, no defense':''}</p>`:''}<small>Resolve reduces morale loss from wounds and fallen allies. Kills lift the surviving side's morale.</small></section>` : ''}
        <h3>Combat log</h3>
        <ol>${log.length ? log.map(entry => `<li>${esc(entry)}</li>`).join('') : '<li>Both lines are waiting for the first clash.</li>'}</ol>
      </aside>
    </div>
    ${tacticsHTML(battle.tactic, status !== 'active')}
    <footer class="battle-controls">
      <div class="battle-speed" aria-label="Battle speed">
        <button class="${selectedSpeed === 0 ? 'is-selected' : ''}" data-battle-speed="0" aria-pressed="${selectedSpeed === 0}">Pause</button>
        <button class="${selectedSpeed === 1 ? 'is-selected' : ''}" data-battle-speed="1" aria-pressed="${selectedSpeed === 1}">1x</button>
        <button class="${selectedSpeed === 3 ? 'is-selected' : ''}" data-battle-speed="3" aria-pressed="${selectedSpeed === 3}">3x</button>
      </div>
      <button class="battle-retreat" data-action="retreat-battle" ${status === 'active' ? '' : 'disabled'}>Retreat</button>
      <button class="battle-resolve" data-action="resolve-battle" ${status === 'active' ? '' : 'disabled'}>Resolve battle</button>
    </footer>
  </section>`;
}

export default battleHTML;
