import { getEquipment, getItem, getMoraleEffects, shieldMaximum, throwingCapacity } from './engine.js';
import { portraitHTML, itemImage } from './portraits.js';

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
  const rows = Math.max(3, Math.min(12, Math.floor(number(source.rows, 5))));
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
  return { columns, rows, biome: String(source.biome || 'grassland').toLowerCase().replace(/[^a-z0-9-]/g, ''), tiles };
}

function gridModel(field) {
  return {
    ...TILE,
    fieldWidth: TILE.padX * 2 + (field.columns - 1) * TILE.stepX + (field.rows - 1) * TILE.stagger + TILE.width,
    fieldHeight: TILE.padY + (field.rows - 1) * TILE.stepY + Math.max(TILE.height, 122) + TILE.padBottom,
  };
}

function fieldTile(field, q, r) {
  return field.tiles[r * field.columns + q] || { q, r, terrain: 'open', height: 0 };
}

function tileHTML(tile, grid) {
  const [name, effect] = TERRAIN[tile.terrain];
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
  const attacking = ['attack', 'hit', 'fall', 'miss'].includes(event.type);
  const actor = event.actorId === unit.id;
  const target = event.targetId === unit.id;
  const origin = coordinates(event.from || unit, field, grid);
  const moveOrigin = coordinates(actor && event.moveFrom ? event.moveFrom : event.from || unit, field, grid);
  const destination = coordinates(event.to || unit, field, grid);
  const dx = destination.x - origin.x, dy = destination.y - origin.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const weapon = equipmentFor(unit).weapon;
  const motion = event.ranged ? 'shoot' : ['spear', 'billhook', 'dagger'].includes(weapon?.visual) ? 'thrust' : 'swing';
  const classes = [
    'battle-unit',
    unit.side === 'company' ? 'battle-unit-company' : 'battle-unit-enemy',
    unit.ally ? 'battle-unit-ally' : '',
    alive ? 'battle-unit-alive' : 'battle-unit-down',
    (animateEvent && event.actorId ? event.actorId : battle.activeId) === unit.id ? 'is-active' : '',
    event.actorId === unit.id ? 'is-acting' : '',
    event.targetId === unit.id ? 'is-target' : '',
    actor && attacking ? `action-${motion}` : '',
    actor && (event.type === 'move' || event.moveFrom) ? 'action-move' : '',
    actor && ['recover', 'hold', 'swap', 'use'].includes(event.type) ? 'action-hold' : '',
    target && attacking && event.type !== 'miss' ? 'action-hit' : '',
    target && event.fallen ? 'action-fall' : '',
  ].filter(Boolean).join(' ');
  const health = percent(unit.hp, unit.maxHp ?? 100);
  const bodyArmor = number(unit.bodyArmor) + number(unit.attachmentArmor);
  const maxBodyArmor = number(unit.maxBodyArmor ?? unit.bodyArmor) + number(unit.maxAttachmentArmor);
  const body = percent(bodyArmor, Math.max(maxBodyArmor, 1));
  const head = percent(unit.headArmor, unit.maxHeadArmor ?? Math.max(number(unit.headArmor), 1));
  const shield = shieldCondition(unit);
  const beforeHealth = target && attacking ? percent(number(unit.hp) + number(event.hpDamage), unit.maxHp ?? 100) : health;
  const beforeBody = target && attacking && !event.head ? percent(bodyArmor + number(event.armorDamage), maxBodyArmor || 1) : body;
  const beforeHead = target && attacking && event.head ? percent(number(unit.headArmor) + number(event.armorDamage), unit.maxHeadArmor || 1) : head;
  const display = { seed: unit.seed ?? unit.id ?? 0, name: unit.name ?? 'Unknown' };
  const morale = getMoraleEffects(unit);
  const moraleLabel = `${morale.name} morale: ${Math.round(number(unit.morale, 50))}/100; resolve ${Math.round(number(unit.resolve, 50))}`;

  return `<article class="${classes}" data-unit-id="${esc(unit.id)}" style="left:${x}px;top:${y}px;--unit-depth:${15 + number(unit.r) * 10};--move-x:${moveOrigin.x - x}px;--move-y:${moveOrigin.y - y}px;--strike-x:${(dx / length * 13).toFixed(2)}px;--strike-y:${(dy / length * 13).toFixed(2)}px" aria-label="${unit.ally?'Allied fighter, ':''}${esc(unit.name)}: ${Math.round(number(unit.hp))} health">
    <div class="battle-unit-bars" aria-hidden="true">
      <span class="battle-unit-bar battle-unit-head"><i style="width:${head}%;--before-width:${beforeHead}%;--after-width:${head}%"></i></span>
      <span class="battle-unit-bar battle-unit-body"><i style="width:${body}%;--before-width:${beforeBody}%;--after-width:${body}%"></i></span>
      ${shield ? `<span class="battle-unit-bar battle-unit-shield" title="Shield: ${shield.current} / ${shield.max} durability${shield.current===0?' · Broken':''}"><i style="width:${percent(shield.current,shield.max)}%;background:#a98b55"></i></span>` : ''}
      <span class="battle-unit-bar battle-unit-health"><i style="width:${health}%;--before-width:${beforeHealth}%;--after-width:${health}%"></i></span>
    </div>
    <span class="battle-pawn">${portraitHTML(display, equipmentFor(unit), 64)}</span>
    <span class="battle-morale-flag morale-${morale.name.toLowerCase()}" title="${esc(moraleLabel)}" aria-label="${esc(moraleLabel)}">${morale.name[0]}</span>
    ${battleKitHTML(unit)}
    <strong>${esc(pawnName(unit))}</strong>
    <small>${Math.max(0, Math.round(number(unit.ap)))} AP · ${Math.max(0, Math.round(number(unit.fatigue)))} F</small>
    ${target && attacking ? `<span class="battle-impact" aria-hidden="true">${event.type === 'miss' ? 'Miss' : `${event.hpDamage || 0}${event.armorDamage ? ` / ${event.armorDamage}` : ''}`}</span>` : ''}
    ${actor && ['recover', 'hold', 'swap', 'use'].includes(event.type) ? `<span class="battle-order">${event.type === 'hold' ? 'Hold' : event.type === 'swap' ? 'Swap set' : event.type === 'use' ? 'Use item' : event.message?.includes(' reloads ') ? 'Reload' : 'Recover'}</span>` : ''}
  </article>`;
}

function projectileHTML(battle, animateEvent, field, grid) {
  const event = battle.lastEvent;
  if (!animateEvent || !event?.ranged || !['attack', 'hit', 'fall', 'miss'].includes(event.type)) return '';
  const actor = battle.units.find(unit => unit.id === event.actorId);
  const target = battle.units.find(unit => unit.id === event.targetId);
  if (!actor || !target) return '';
  const start = coordinates(event.from || actor, field, grid), end = coordinates(event.to || target, field, grid);
  start.x += actor.side === 'enemy' ? -18 : 18; start.y += 52; end.y += event.head ? 29 : 50;
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
          <div class="battle-units">${units.map(unit => unitHTML(unit, battle, animateEvent, field, grid)).join('')}${projectileHTML(battle, animateEvent, field, grid)}</div>
        </div>
      </div>
      <aside class="battle-log" aria-label="Battle event log">
        ${active ? `<section class="battle-morale-report morale-${morale.name.toLowerCase()}"><h3>${esc(active.name)}</h3><strong>${morale.name} · ${Math.round(number(active.morale, 50))}/100 morale</strong><p>Resolve ${Math.round(number(active.resolve, 50))} · ${moralePercent > 0 ? '+' : ''}${moralePercent}% attack and defense</p>${shieldCondition(active)?`<p>Shield ${shieldCondition(active).current} / ${shieldCondition(active).max} durability${shieldCondition(active).current===0?' · Broken, no defense':''}</p>`:''}<small>Resolve reduces morale loss from wounds and fallen allies. Kills lift the surviving side's morale.</small></section>` : ''}
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
