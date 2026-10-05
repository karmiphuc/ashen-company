import { simultaneousEvents } from './simultaneous-combat.js';
import { getNightHitPenalty } from './engine.js';
import { BATTLE_PROJECTION, tilePosition, elevationFaces } from './battle-geometry.js';
import { enemyBattleTactic, ENEMY_TACTIC_COOLDOWN } from './tactical-ai.js';
import { weaponSkillFamily } from './combat-skills.js';
import { getEquipment, getItem, getDoubleGripBonus, getLoneWolfBonus, getMoraleEffects, isMoraleImmune, shieldMaximum } from './engine.js';
import { portraitHTML, portraitWeaponAnchor, portraitGroundAnchor, itemImage } from './portraits.js';

const LEGACY_FIELD = { columns: 10, rows: 5, biome: 'grassland', tiles: [] };
const TILE = BATTLE_PROJECTION;
const TERRAIN = {
  open: ['Open ground', '1 AP to enter · no cover'],
  trees: ['Trees', '20 percentage points ranged protection · 2 AP to enter'],
  'dense-trees': ['Dense trees', 'Impassable · obstructs ranged shots'],
  brush: ['Brush', '10 percentage points ranged protection · 1 AP to enter'],
  mud: ['Mud', '2 AP to enter · no cover'],
  palisade: ['Palisade', 'Impassable wooden wall · gates remain open · ranged shots can pass with cover'],
  rock: ['Rock', '1 AP to enter · no height advantage unless raised'],
};
const TACTICS = [
  ['offense', 'Offense', 'Advance and engage the nearest reachable enemy.'],
  ['defense', 'Defense', 'Hold the line and shoot. Advance if the enemy refuses to close.'],
  ['focus', 'Thin them out', 'Concentrate fire and attacks on one reachable enemy at a time.'],
  ['advance-formation', 'Advance in Formation', 'Advance together one hex at a time. Keep ranks and attack without chasing ahead.'],
  ['skirmish', 'Skirmish', 'Hold a shield line about 5–6 hexes from the enemy. Ranged fighters step up to shoot and fall back to shelter, ideally in the same turn; safe Aimed Shots stay stationary. Close in when ranged ammunition runs out.'],
  ['shield-wall', 'Shield Wall', 'Shielded melee fighters and skirmishers form the front. Archers and unshielded two-handers stay behind.'],
];

export function parseBattleSpeed(value,fallback=1){
  if(value==='cinematic')return value;
  if(value===3||value==='3')return 4;
  return [0,1,4,'0','1','4'].includes(value)?Number(value):fallback;
}
export function cinematicActionKind(event){
  // Fleeing stays at movement speed, including strikes triggered while escaping.
  if(!event||event.skillName==='Flee')return null;
  if(['attack','miss','hit','fall'].includes(event.type)||event.reactions?.some(r=>['attack','miss','hit','fall'].includes(r.type)))return 'attack';
  if(event.type==='use'||event.skillName&&!['Hold','Stunned','Wait','Recover'].includes(event.skillName))return 'skill';
  return null;
}
export function battleActionDuration(speed = 1,event=null) {
  if(speed==='cinematic'){const kind=cinematicActionKind(event);return kind==='attack'?1.15:kind==='skill'?.8:.1375;}
  return speed === 3 || speed === 4 ? .1375 : speed === 1 ? .55 : 1.1;
}

export function tacticsHTML(tactic = 'offense', disabled = false, skirmishSupported = true) {
  const current = TACTICS.find(entry => entry[0] === tactic) || TACTICS[0];
  return `<div class="battle-tactics"><div role="group" aria-label="Company tactics">${TACTICS.map(([id, label]) => `<button data-tactic="${id}" aria-pressed="${current[0] === id}" ${disabled || id==='skirmish'&&!skirmishSupported ? 'disabled' : ''}>${label}</button>`).join('')}</div><label class="battle-tactic-picker"><span>Tactic</span><select data-battle-tactic aria-label="Company tactic" ${disabled?'disabled':''}>${TACTICS.map(([id,label])=>`<option value="${id}" ${current[0]===id?'selected':''}${id==='skirmish'&&!skirmishSupported?' disabled':''}>${label}</option>`).join('')}</select></label><p>${current[2]}</p></div>`;
}

function enemyIntentHTML(battle) {
  if (battle.enemyTacticsVersion!==1) return '';
  const tactic=enemyBattleTactic(battle,getItem);
  const descriptions={offense:'Offensive · close with the company',defense:'Defensive · ranged fighters hold the line',
    'shield-wall':'Shield-wall advance · infantry advance under raised shields',skirmish:'Skirmish · ranged fighters step up and fall back'};
  const remaining=battle.enemyAdaptiveRulesVersion===1 ? Math.max(0,ENEMY_TACTIC_COOLDOWN-(battle.round-battle.enemyTacticalState.lastChangedRound)) : 0;
  return `<p class="battle-enemy-intent">Enemy tactic: ${descriptions[tactic]}${remaining?` · Change cooldown: ${remaining} ${remaining===1?'round':'rounds'}`:''}</p>`;
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
  const columns = Math.max(4, Math.min(22, Math.floor(number(source.columns, 10))));
  const rows = Math.max(3, Math.min(24, Math.floor(number(source.rows, 5))));
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

function tileHTML(tile, grid, field) {
  const [name, baseEffect] = TERRAIN[tile.terrain];
  const effect = baseEffect.replace(/\b([12]) AP to enter/g, (_, cost) => `${Number(cost) * grid.apScale} AP to enter`);
  const elevation = tile.height ? `Height ${tile.height}; high-ground attacks gain 10 hit per level` : 'Ground level';
  const detail = `${name}, ${elevation}. ${effect}`;
  const {x,y} = tilePosition(tile,grid);
  const variant = tile.terrain === 'open' && (tile.q + tile.r) % 3 === 1 ? ' battle-hex-grass-alt' : '';
  const faces=elevationFaces(tile,(q,r)=>q>=0&&q<field.columns&&r>=0&&r<field.rows?fieldTile(field,q,r):null,grid);
  const wall=faces.length?`<svg class="battle-hex-wall" width="${grid.width}" height="${grid.height+tile.height*grid.elevation}" aria-hidden="true"><defs><pattern id="cliff-${tile.q}-${tile.r}" width="76" height="44" patternUnits="userSpaceOnUse"><image href="assets/battle/socket-earth.png" width="76" height="44" preserveAspectRatio="none"/></pattern></defs>${faces.map(face=>`<polygon data-edge="${face.edge}" data-drop="${face.drop}" points="${face.points.map(p=>p.join(',')).join(' ')}" class="battle-cliff-${face.edge.toLowerCase()}"/><polygon points="${face.points.map(p=>p.join(',')).join(' ')}" fill="url(#cliff-${tile.q}-${tile.r})" opacity=".4"/>`).join('')}</svg>`:'';
  const obstacle = tile.terrain === 'dense-trees' ? '<span class="battle-tree-obstacle" aria-hidden="true"></span>' : tile.terrain === 'palisade' ? `<img class="battle-palisade" src="assets/battle/camp-wall-${[1,14,5,18].includes(tile.r)?'01':'02'}.png" alt="" draggable="false" aria-hidden="true">` : '';
  return `<button type="button" class="battle-hex battle-terrain-${tile.terrain} battle-height-${tile.height}${variant}" style="left:${x}px;top:${y}px;--tile-row:${tile.r};--tile-height:${tile.height};--tile-rise:${tile.height * grid.elevation}px" data-action="inspect-terrain" data-q="${tile.q}" data-r="${tile.r}" data-terrain="${tile.terrain}" data-height="${tile.height}" data-detail="${esc(detail)}" title="${esc(detail)}" aria-label="Column ${tile.q + 1}, row ${tile.r + 1}: ${esc(detail)}">${wall}<span class="battle-hex-top" aria-hidden="true"></span>${obstacle}${tile.height ? `<span class="battle-height-label" aria-hidden="true">+${tile.height}</span>` : ''}</button>`;
}

function coordinates(unit, field, grid, appearance=unit) {
  const q = Math.max(0, Math.min(field.columns - 1, Math.floor(number(unit?.q))));
  const r = Math.max(0, Math.min(field.rows - 1, Math.floor(number(unit?.r))));
  const height = fieldTile(field, q, r).height;
  const ground=tilePosition({q,r,height},grid);
  const foot=10+portraitGroundAnchor(equipmentFor(appearance??{})).y*(64/104);
  return { x:ground.x+grid.width/2, y:ground.y+grid.height/2-foot, foot };
}

function pawnName(unit) {
  const words = String(unit.name || 'Unknown').trim().split(/\s+/).filter(word => !/^\d+$/.test(word));
  return unit.ally ? words.at(-1) || 'Ally' : unit.side === 'company' ? words[0] || 'Companion' : words.at(-1) || 'Enemy';
}

const equipmentViews=new WeakMap();
const portraitKey=unit=>JSON.stringify([unit.seed,unit.name,unit.equipment,unit.shieldDurability===0]);
function equipmentFor(unit) {
  const key=portraitKey(unit),cached=equipmentViews.get(unit);
  if(cached?.key===key)return cached.value;
  try {
    const equipment = getEquipment(unit);
    const value=equipment.shield && unit.shieldDurability === 0 ? { ...equipment, shield: null } : equipment;
    equipmentViews.set(unit,{key,value});return value;
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
    unit.alive && getLoneWolfBonus(battle, unit) > 0 ? ['lone-wolf', 'Lone Wolf: +15% melee/ranged skill, defense and resolve', '<path d="m2 1 4 3h4l4-3v7l-3 5H5L2 8zm3 5v2h2V6zm4 0v2h2V6z"/>'] : null,
    unit.alive && unit.overwhelmed?.round === battle.round ? ['overwhelmed', `Overwhelmed ×${unit.overwhelmed.stacks}: −${Math.min(100, unit.overwhelmed.stacks * 10)}% melee/ranged skill until turn ends`, '<path d="M2 2h3v6h2L3.5 13 0 8h2zm7 0h3v6h2l-3.5 5L7 8h2z"/>'] : null,
    unit.alive && unit.headHunterReady ? ['head-hunter', 'Head Hunter: next successful eligible hit strikes the head', '<path d="M8 1a4 4 0 0 1 4 4v3l-2 2v3H6v-3L4 8V5a4 4 0 0 1 4-4zm-2 4v2h1V5zm3 0v2h1V5z"/>'] : null,
    unit.alive && battle.weaponCompletionVersion===1 && getDoubleGripBonus(unit)>0 ? ['double-grip','Double Grip: +25% one-handed melee damage with an empty offhand','<path d="M3 2h2v5l2 2 2-2V2h2v6l-3 5H6L3 8z"/>'] : null,
    unit.disarmedTurns>0?['disarmed','Disarmed: weapon attacks and reactions disabled for one turn','<path d="m2 2 12 12M3 12l9-9"/>']:null,
    unit.dazedTurns>0?['dazed','Dazed: −25% damage, fatigue capacity and initiative for '+unit.dazedTurns+' turns','<circle cx="8" cy="8" r="5"/>']:null,
    unit.staggeredTurns>0?['staggered','Staggered: −50% initiative for one turn','<path d="m3 3 10 10M13 3 3 13"/>']:null,
    unit.bleeding?['bleeding','Bleeding: '+unit.bleeding.damage+' health per turn · '+unit.bleeding.turns+' turns','<path d="M8 1 3 9a5 5 0 0 0 10 0Z"/>']:null,
    unit.alive !== false && unit.hp > 0 && unit.frenzyUntilRound > 0 && unit.frenzyUntilRound >= battle.round ? ['frenzy', 'Killing Frenzy: +25% damage', '<path d="m8 1 2 5 3-2-1 7-4 4-4-4-1-7 3 2z"/>'] : null,
    unit.alive && unit.howlTurns > 0 ? ['howled', `Howled: −20% damage for ${unit.howlTurns} more turn${unit.howlTurns === 1 ? '' : 's'}`, '<path d="M1 7h2v2H1zm4-3h2v8H5zm4-2h2v12H9zm4 3h2v6h-2z"/>'] : null,
    unit.alive && !isMoraleImmune(unit) && unit.fleeRound === battle.round ? ['fleeing', 'Fleeing', '<path d="M1 7h10L8 4l1-1 5 5-5 5-1-1 3-3H1z"/>'] : null,
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
    && !affected.some(entry => (entry?.id ?? entry?.targetId) === unitId)) impacts.push(...(event.strikes?event.strikes.map(x=>({...x,type:x.hit?'attack':'miss'})):[event]));
  for (const reaction of reactionsFor(event)) if (reaction?.targetId === unitId) impacts.push(reaction);
  return impacts;
}

function unitHTML(unit, battle, animateEvent, field, grid, simultaneous = null) {
  const { x, y, foot } = coordinates(unit, field, grid);
  const alive = unit.alive !== false && number(unit.hp, 1) > 0;
  const event = simultaneous?.event ?? (animateEvent ? battle.lastEvent || {} : {});
  const reactions = reactionsFor(event);
  const primaryActor = event.actorId === unit.id;
  const reaction = reactions.find(entry => entry?.actorId === unit.id);
  const reactionTarget = reactions.some(entry => entry?.targetId === unit.id);
  const effects = [...(primaryActor ? event.effects ?? [] : []), ...reactions.filter(entry => entry.actorId === unit.id).flatMap(entry => entry.effects ?? [])];
  const frenzy = alive && unit.frenzyUntilRound > 0 && unit.frenzyUntilRound >= battle.round;
  const callouts = [...new Set([...(primaryActor&&event.skillName!=='Bleeding' || event.targetId===unit.id&&event.skillName==='Bleeding' ? [actionCallout(event, getItem(event.weaponId) ?? equipmentFor(unit).weapon)] : []),
    ...reactions.filter(entry => entry.actorId === unit.id).map(entry => actionCallout(entry, getItem(entry.weaponId) ?? equipmentFor(unit).weapon))].filter(Boolean))];
  const primaryTarget = event.targetId === unit.id;
  const impacts = simultaneous?.impacts ?? impactsFor(event, unit.id);
  const hasImpact = impacts.length > 0;
  const primaryMiss = primaryTarget && event.type === 'miss';
  const hasHit = impacts.some(impact => impact.hit !== false && impact.type !== 'miss');
  const hasMiss = primaryMiss || impacts.some(impact => impact.hit === false || impact.type === 'miss');
  const shieldDamage = impacts.reduce((total, impact) => total + number(impact.shieldDamage), 0);
  const attacking = event.skillName!=='Bleeding'&&['attack', 'hit', 'fall', 'miss'].includes(event.type);
  const origin = coordinates(event.from || unit, field, grid, unit);
  const moveOrigin = coordinates(primaryTarget && event.pushedFrom ? event.pushedFrom : primaryActor && event.moveFrom ? event.moveFrom : event.from || unit, field, grid, unit);
  const destination = coordinates(event.to || unit, field, grid, unit);
  const strikeOrigin = reaction ? coordinates(reaction.from || unit, field, grid, unit) : origin;
  const reactionTargetUnit = reaction ? battle.units.find(entry => entry.id === reaction.targetId) : null;
  const strikeDestination = reaction ? coordinates(reaction.to || reactionTargetUnit || unit, field, grid, reactionTargetUnit || unit) : destination;
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
    simultaneous?.cinematic ? `sim-cinematic-${simultaneous.cinematic}` : '',
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
  const moraleLabel = isMoraleImmune(unit) ? 'Morale immune: no bonuses, penalties, or automatic fleeing.' : `${morale.name} morale: ${Math.round(number(unit.morale, 50))}/100; resolve ${Math.round(number(unit.resolve, 50) * (1 + getLoneWolfBonus(battle, unit)))}`;

  return `<article class="${classes}" data-unit-id="${esc(unit.id)}"${simultaneous?` data-sim-portrait="${esc(portraitKey(unit))}"`: ''} style="${simultaneous?.style??''}left:${x}px;top:${y}px;--unit-depth:${15 + number(unit.r) * 10};--pawn-foot:${foot}px;--callout-space:${Math.max(34, callouts.length * 26 + 8)}px;--move-x:${moveOrigin.x - x}px;--move-y:${moveOrigin.y - y}px;--strike-x:${(dx / length * 13).toFixed(2)}px;--strike-y:${(dy / length * 13).toFixed(2)}px" aria-label="${unit.ally?'Allied fighter, ':''}${esc(unit.name)}: ${Math.round(number(unit.hp))} health${friendlyFire?', friendly fire impact':''}">
    <div class="battle-unit-bars" aria-hidden="true">
      <span class="battle-unit-bar battle-unit-head"><i style="width:${head}%;--before-width:${beforeHead}%;--after-width:${head}%"></i></span>
      <span class="battle-unit-bar battle-unit-body"><i style="width:${body}%;--before-width:${beforeBody}%;--after-width:${body}%"></i></span>
      ${shield ? `<span class="battle-unit-bar battle-unit-shield" title="Shield: ${shield.current} / ${shield.max} durability${shield.current===0?' · Broken':''}"><i style="width:${percent(shield.current,shield.max)}%;--before-width:${beforeShield}%;--after-width:${percent(shield.current,shield.max)}%;background:#a98b55"></i></span>` : ''}
      <span class="battle-unit-bar battle-unit-health"><i style="width:${health}%;--before-width:${beforeHealth}%;--after-width:${health}%"></i></span>
    </div>
    <span class="battle-pawn">${frenzy ? '<span class="battle-frenzy-aura" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}${effects.some(effect => effect.id === 'howling') ? '<span class="battle-howl-waves" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}${simultaneous?.portraitMarkup??portraitHTML(display,equipmentFor(unit),64)}</span>
    <span class="battle-morale-flag morale-${morale.name.toLowerCase()}" title="${esc(moraleLabel)}" aria-label="${esc(moraleLabel)}">${morale.name[0]}</span>
    ${statusIconsHTML(unit, battle)}
    ${unit.ally ? '<span class="battle-ally-label" aria-label="Allied fighter"><i>Ally</i></span>' : ''}
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
  const start = coordinates(event.from || actor, field, grid, actor), end = coordinates(event.to || target, field, grid, target);
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

const simultaneousRenderCaches = new WeakMap();
const simultaneousFullFrames = new WeakMap();
const animationRates = new WeakMap();
function simultaneousRate(battle,speed) {
  if(speed!==0)animationRates.set(battle,speed===4?4:1);
  return animationRates.get(battle)??1;
}
function simultaneousUnitContext(unit,battle,speed) {
  const entries=simultaneousEvents(battle);
  const own=entries.filter(e=>e.event.actorId===unit.id||reactionsFor(e.event).some(r=>r.actorId===unit.id)).at(-1);
  const incoming=entries.filter(e=>e.event.targetId===unit.id||impactsFor(e.event,unit.id).length).at(-1);
  const selected=own??incoming;
  const event=selected?{...selected.event,reactions:entries.flatMap(e=>reactionsFor(e.event))}:{};
  const rate=simultaneousRate(battle,speed),duration=selected?(speed==='cinematic'&&cinematicActionKind(event)==='attack'?Math.max(selected.duration,900):event.type==='move'&&speed==='cinematic'?selected.duration/4:selected.duration):450;
  const age=selected?Math.max(0,battle.simultaneous.time-selected.time):0;
  return {event,impacts:entries.flatMap(e=>impactsFor(e.event,unit.id)),
    cinematic:speed==='cinematic'?cinematicActionKind(event):null,
    style:`--action-time:${duration/rate/1000}s;--move-time:${duration/rate/1000}s;--sim-delay:${-age/rate/1000}s;`,
    key:entries.filter(e=>e.event.actorId===unit.id||e.event.targetId===unit.id||impactsFor(e.event,unit.id).length||reactionsFor(e.event).some(r=>r.actorId===unit.id)).map(e=>e.id).join(',')};
}
function simultaneousProjectileHTML(battle,speed,field,grid,entry) {
  const rate=simultaneousRate(battle,speed),age=Math.max(0,battle.simultaneous.time-entry.time);
  return projectileHTML({...battle,lastEvent:entry.event},true,field,grid)
    .replace('class="battle-projectile',`data-sim-projectile="${entry.id}" class="battle-projectile`)
    .replace('style="',`style="--action-time:${entry.duration/rate/1000}s;--sim-delay:${-age/rate/1000}s;`);
}

// Patch changed pawns/projectiles only. Preserve camera, focused controls and other animations.
export function updateSimultaneousBattleView(root,battle,speed) {
  const view=root.querySelector('.simultaneous-battle'),surface=view?.querySelector('.battle-units');
  if(!surface)return false;
  view.classList.toggle('sim-paused',speed===0);
  const field=fieldModel(battle),grid=gridModel(field),cache=simultaneousRenderCaches.get(view)??new Map(simultaneousFullFrames.get(battle)??[]);
  for(const unit of battle.units){
    const context=simultaneousUnitContext(unit,battle,speed),key=JSON.stringify(unit)+':'+context.key+':'+speed;
    const node=[...surface.querySelectorAll('[data-unit-id]')].find(n=>n.dataset.unitId===unit.id);
    if(unit.escaped){node?.remove();cache.delete(unit.id);continue;}
    if(cache.get(unit.id)===key)continue;
    const portrait=node?.dataset.simPortrait===portraitKey(unit)?node.querySelector('.bb-portrait'):null;
    if(portrait)context.portraitMarkup='';
    const template=root.ownerDocument.createElement('template');template.innerHTML=unitHTML(unit,battle,true,field,grid,context);
    if(portrait)template.content.querySelector('.battle-pawn').append(portrait);
    if(node)node.replaceWith(template.content.firstElementChild);else surface.append(template.content.firstElementChild);
    cache.set(unit.id,key);
  }
  simultaneousRenderCaches.set(view,cache);
  const entries=simultaneousEvents(battle).filter(e=>battle.simultaneous.time-e.time<e.duration&&e.event.ranged);
  const ids=new Set(entries.map(e=>String(e.id)));
  surface.querySelectorAll('[data-sim-projectile]').forEach(node=>{if(!ids.has(node.dataset.simProjectile))node.remove();});
  for(const entry of entries)if(!surface.querySelector(`[data-sim-projectile="${entry.id}"]`))surface.insertAdjacentHTML('beforeend',simultaneousProjectileHTML(battle,speed,field,grid,entry));
  view.querySelector('.battle-cycle').textContent=`Cycle ${battle.round} · ${(battle.simultaneous.time/1000).toFixed(1)}s`;
  const count=side=>battle.units.filter(u=>u.alive&&!u.escaped&&(side==='ally'?u.ally:side==='company'?u.side===side&&!u.ally:u.side===side)).length;
  view.querySelector('.battle-counts').textContent=`${count('company')} brothers · ${count('enemy')} enemies${count('ally')?` · ${count('ally')} allies`:''}`;
  view.querySelector('.battle-status').textContent=statusText(battle.status);
  const log=view.querySelector('.battle-log-details ol'),text=battle.log.slice(-6).reverse().map(x=>`<li>${esc(x)}</li>`).join('');
  if(log.innerHTML!==text)log.innerHTML=text;
  const intent=view.querySelector('.battle-enemy-intent');if(intent){const template=root.ownerDocument.createElement('template');template.innerHTML=enemyIntentHTML(battle);if(intent.outerHTML!==template.innerHTML)intent.replaceWith(template.content.firstElementChild);}
  return true;
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
  const tiles = field.tiles.map(tile => tileHTML(tile, grid, field)).join('');
  const log = Array.isArray(battle.log) ? battle.log.slice(-6).reverse() : [];
  const selectedSpeed = parseBattleSpeed(speed);
  const cinematicKind=!battle.simultaneous&&selectedSpeed==='cinematic'&&animateEvent?cinematicActionKind(battle.lastEvent):null;
  const status = String(battle.status || 'active');
  const morale = getMoraleEffects(active || {});
  const moralePercent = Math.round(morale.modifier * 100);
  const skillName = animateEvent && battle.lastEvent?.actorId === active?.id ? battle.lastEvent?.skillName : null;

  if(battle.simultaneous)simultaneousFullFrames.set(battle,new Map(units.map(u=>[u.id,JSON.stringify(u)+':'+simultaneousUnitContext(u,battle,speed).key+':'+speed])));
  const brothers=units.filter(u=>u.side==='company'&&!u.ally&&u.alive&&!u.escaped).length,enemies=units.filter(u=>u.side==='enemy'&&u.alive&&!u.escaped).length,allies=units.filter(u=>u.ally&&u.alive&&!u.escaped).length;
  return `<section class="battle-view battle-status-${esc(status)}${battle.simultaneous?` simultaneous-battle${selectedSpeed===0?' sim-paused':''}`:''}${cinematicKind?` cinematic-action cinematic-${cinematicKind}`:''}" style="--action-time:${battleActionDuration(speed,battle.lastEvent)}s;--move-time:${speed==='cinematic'?.1375:battleActionDuration(speed,battle.lastEvent)}s" aria-label="Tactical battle">
    <header class="battle-topbar">
      <div><span class="battle-kicker">TACTICAL ENGAGEMENT</span><strong class="battle-cycle">${battle.simultaneous?`Cycle ${battle.round} · ${(battle.simultaneous.time/1000).toFixed(1)}s`:`Round ${Math.max(1, Math.round(number(battle.round, 1)))}`}</strong><small class="battle-counts">${brothers} ${brothers===1?'brother':'brothers'} · ${enemies} ${enemies===1?'enemy':'enemies'}${allies?` · ${allies} ${allies===1?'ally':'allies'}`:''}</small></div>
      <div class="battle-turn"><span>${battle.simultaneous?'SIMULTANEOUS · BETA':'TURN'}</span><strong>${battle.simultaneous?'Independent action clocks':esc(active?.name || 'Resolving')} ${!battle.simultaneous&&active ? animateEvent ? 'acting' : 'to act' : ''}</strong></div>
      <strong class="battle-status">${statusText(status)}</strong>
    </header>
    ${getNightHitPenalty(battle,true)?'<p class="battle-night-warning">☾ Night battle · Ranged hit chance −40 points · Melee −10 points · Both sides</p>':''}
    <div class="battle-controls">
      <div class="battle-speed" aria-label="Battle speed">
        <button class="${selectedSpeed === 0 ? 'is-selected' : ''}" data-battle-speed="0" aria-pressed="${selectedSpeed === 0}">Pause</button>
        <button class="${selectedSpeed === 1 ? 'is-selected' : ''}" data-battle-speed="1" aria-pressed="${selectedSpeed === 1}">1x</button>
        <button class="${selectedSpeed === 4 ? 'is-selected' : ''}" data-battle-speed="4" aria-pressed="${selectedSpeed === 4}">4x</button>
        <button class="${selectedSpeed === 'cinematic' ? 'is-selected' : ''}" data-battle-speed="cinematic" aria-pressed="${selectedSpeed === 'cinematic'}" title="4× movement with slow-motion attacks, skills and impacts">Cinematic</button>
      </div>
      <div class="battle-camera" role="group" aria-label="Battlefield camera"><button data-battle-camera="company" aria-label="Center battlefield on your company">Company</button><button data-battle-camera="enemy" aria-label="Center battlefield on enemies" ${units.some(u=>u.side==='enemy'&&u.alive&&!u.escaped)?'':'disabled'}>Enemies</button><button data-battle-camera="active" aria-label="Center battlefield on the acting fighter" ${active?.alive&&!active.escaped?'':'disabled'}>Acting</button></div>
      <button class="battle-retreat" data-action="retreat-battle" ${status === 'active' ? '' : 'disabled'}>Retreat</button>
      <button class="battle-resolve" data-action="resolve-battle" ${status === 'active' ? '' : 'disabled'}>Resolve battle</button>
    </div>
    ${tacticsHTML(battle.tactic, status !== 'active', battle.rulesVersion===2)}
    ${enemyIntentHTML(battle)}

    <div class="battle-layout">
      <div class="battle-scroll" tabindex="0" aria-label="Battlefield scroll area">
        ${terrainLegend(field)}
        <div class="battlefield battle-biome-${esc(field.biome)}" style="--field-width:${grid.fieldWidth}px;--field-height:${grid.fieldHeight}px" role="group" aria-label="${field.columns} by ${field.rows} hex battlefield with ${units.filter(unit => unit.side === 'company' && !unit.ally).length} company fighters, ${units.filter(unit => unit.ally).length} allied fighters and ${units.filter(unit => unit.side !== 'company').length} enemies">
          <div class="battle-terrain">${tiles}</div>
          <div class="battle-units">${units.filter(unit => !unit.escaped).map(unit => unitHTML(unit,battle,animateEvent,field,grid,battle.simultaneous?simultaneousUnitContext(unit,battle,speed):null)).join('')}${battle.simultaneous?simultaneousEvents(battle).filter(e=>battle.simultaneous.time-e.time<e.duration).map(e=>simultaneousProjectileHTML(battle,speed,field,grid,e)).join(''):projectileHTML(battle,animateEvent,field,grid)}</div>
        </div>
      </div>
      <aside class="battle-log" aria-label="Battle event log">
        ${active&&!battle.simultaneous ? `<section class="battle-morale-report morale-${morale.name.toLowerCase()}"><h3>${esc(active.name)}</h3><strong>${morale.name} · ${Math.round(number(active.morale, 50))}/100 morale</strong><p>Resolve ${Math.round(number(active.resolve, 50) * (1 + getLoneWolfBonus(battle, active)))} · ${moralePercent > 0 ? '+' : ''}${moralePercent}% attack and defense</p>${skillName?`<p class="battle-skill-status">Skill used: ${esc(skillName)}</p>`:''}${shieldCondition(active)?`<p>Shield ${shieldCondition(active).current} / ${shieldCondition(active).max} durability${shieldCondition(active).current===0?' · Broken, no defense':''}</p>`:''}<p class="battle-vitals">HP ${Math.round(number(active.hp))}/${Math.round(number(active.maxHp))} · AP ${Math.round(number(active.ap))}/${battle.rulesVersion===2?9:2}<br>Fatigue ${Math.round(number(active.fatigue))}/${Math.round(number(active.maxFatigue))}</p><details class="battle-morale-help"><summary>Morale effects</summary><small>${isMoraleImmune(active)?'Morale immune: no positive or negative morale changes, no attack or defense modifiers, and no automatic fleeing.':"Resolve reduces morale loss from wounds and fallen allies. Kills lift the surviving side's morale."}</small></details></section>` : ''}
        <details class="battle-log-details" open><summary>Combat log</summary>
        <ol>${log.length ? log.map(entry => `<li>${esc(entry)}</li>`).join('') : '<li>Both lines are waiting for the first clash.</li>'}</ol></details>
      </aside>
    </div>

  </section>`;
}

export default battleHTML;
