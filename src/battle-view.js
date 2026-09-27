import { getEquipment } from './engine.js';
import { portraitHTML } from './portraits.js';

const GRID = { columns: 10, rows: 5, width: 76, height: 85, stepX: 76, stepY: 64, stagger: 38 };

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

function tileHTML(q, r) {
  const x = q * GRID.stepX + r * GRID.stagger;
  const y = r * GRID.stepY;
  return `<span class="battle-hex" style="left:${x}px;top:${y}px" aria-hidden="true"></span>`;
}

function coordinates(unit) {
  const q = Math.max(0, Math.min(GRID.columns - 1, Math.floor(number(unit.q))));
  const r = Math.max(0, Math.min(GRID.rows - 1, Math.floor(number(unit.r))));
  return { x: q * GRID.stepX + r * GRID.stagger + GRID.width / 2, y: r * GRID.stepY + 2 };
}

function pawnName(unit) {
  const words = String(unit.name || 'Unknown').trim().split(/\s+/).filter(word => !/^\d+$/.test(word));
  return unit.side === 'company' ? words[0] || 'Companion' : words.at(-1) || 'Enemy';
}

function equipmentFor(unit) {
  try {
    return getEquipment(unit);
  } catch {
    return {};
  }
}

function unitHTML(unit, battle) {
  const { x, y } = coordinates(unit);
  const alive = unit.alive !== false && number(unit.hp, 1) > 0;
  const event = battle.lastEvent || {};
  const classes = [
    'battle-unit',
    unit.side === 'company' ? 'battle-unit-company' : 'battle-unit-enemy',
    alive ? 'battle-unit-alive' : 'battle-unit-down',
    battle.activeId === unit.id ? 'is-active' : '',
    event.actorId === unit.id ? 'is-acting' : '',
    event.targetId === unit.id ? 'is-target' : '',
  ].filter(Boolean).join(' ');
  const health = percent(unit.hp, unit.maxHp ?? 100);
  const body = percent(unit.bodyArmor, unit.maxBodyArmor ?? Math.max(number(unit.bodyArmor), 1));
  const head = percent(unit.headArmor, unit.maxHeadArmor ?? Math.max(number(unit.headArmor), 1));
  const display = { seed: unit.seed ?? unit.id ?? 0, name: unit.name ?? 'Unknown' };

  return `<article class="${classes}" data-unit-id="${esc(unit.id)}" style="left:${x}px;top:${y}px" aria-label="${esc(unit.name)}: ${Math.round(number(unit.hp))} health">
    <div class="battle-unit-bars" aria-hidden="true">
      <span class="battle-unit-bar battle-unit-head"><i style="width:${head}%"></i></span>
      <span class="battle-unit-bar battle-unit-body"><i style="width:${body}%"></i></span>
      <span class="battle-unit-bar battle-unit-health"><i style="width:${health}%"></i></span>
    </div>
    <span class="battle-pawn">${portraitHTML(display, equipmentFor(unit), 64)}</span>
    <strong>${esc(pawnName(unit))}</strong>
    <small>${Math.max(0, Math.round(number(unit.ap)))} AP · ${Math.max(0, Math.round(number(unit.fatigue)))} F</small>
  </article>`;
}

function statusText(status) {
  return ({ victory: 'Victory', defeat: 'Defeat', retreat: 'Retreat' }[status] || 'Engaged');
}

/** Render a compact tactical battle surface from battle state. */
export function battleHTML(battle = {}, speed = 1) {
  const units = Array.isArray(battle.units) ? battle.units : [];
  const active = units.find(unit => unit.id === battle.activeId);
  const tiles = Array.from({ length: GRID.rows }, (_, r) => Array.from({ length: GRID.columns }, (_, q) => tileHTML(q, r)).join('')).join('');
  const log = Array.isArray(battle.log) ? battle.log.slice(-6).reverse() : [];
  const selectedSpeed = [0, 1, 3].includes(Number(speed)) ? Number(speed) : 1;
  const status = String(battle.status || 'active');

  return `<section class="battle-view battle-status-${esc(status)}" aria-label="Tactical battle">
    <header class="battle-topbar">
      <div><span class="battle-kicker">TACTICAL ENGAGEMENT</span><strong>Round ${Math.max(1, Math.round(number(battle.round, 1)))}</strong></div>
      <div class="battle-turn"><span>TURN</span><strong>${esc(active?.name || 'Resolving')} ${active ? 'to act' : ''}</strong></div>
      <strong class="battle-status">${statusText(status)}</strong>
    </header>
    <div class="battle-layout">
      <div class="battle-scroll" tabindex="0" aria-label="Battlefield scroll area">
        <div class="battlefield" role="img" aria-label="Hex battlefield with ${units.filter(unit => unit.side === 'company').length} company fighters and ${units.filter(unit => unit.side !== 'company').length} enemies">
          <div class="battle-terrain">${tiles}</div>
          <div class="battle-units">${units.map(unit => unitHTML(unit, battle)).join('')}</div>
        </div>
      </div>
      <aside class="battle-log" aria-label="Battle event log">
        <h3>Combat log</h3>
        <ol>${log.length ? log.map(entry => `<li>${esc(entry)}</li>`).join('') : '<li>Both lines are waiting for the first clash.</li>'}</ol>
      </aside>
    </div>
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
