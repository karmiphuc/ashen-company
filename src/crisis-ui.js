import { SETTLEMENTS, getSettlementAccess, getUndeadEncounters, getAshenFinalItem, getItem } from './engine.js';
import { campaignHour } from './crisis-director.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hoursLeft = (state, until) => Math.max(0, Math.ceil(until - campaignHour(state)));

export function crisisBannerHTML(state) {
  const crisis = state.ashenWinter;
  if (!crisis || ['dormant', 'scheduled', 'completed'].includes(crisis.phase)) return '';
  const closed = Object.values(crisis.towns).filter(t => ['besieged', 'occupied'].includes(t.status)).length;
  return `<section class="crisis-banner" role="status"><strong>Ashen Winter · ${esc(crisis.phase)}</strong><span>${crisis.phase === 'warning'
    ? `${hoursLeft(state, crisis.activationHour)} hours until the invasion. Stock food and repair the company.`
    : `${crisis.fronts.filter(f => f.defeated).length} / 3 commanders defeated · ${closed} settlements closed. ${crisis.phase === 'cleanup' ? 'Liberate every remaining settlement.' : 'Defeat the dead to restore services.'}`}</span><button data-tab="journal">Crisis journal</button></section>`;
}

export function settlementCrisisHTML(state, townId) {
  const access = getSettlementAccess(state, townId);
  if (access.status === 'open') return '';
  const encounter = getUndeadEncounters(state).find(e => e.id === access.encounterId);
  return `<section class="settlement-crisis ${access.servicesAvailable ? 'is-warning' : 'is-blocked'}"><h3>${access.servicesAvailable ? access.status === 'recovering' ? 'Rebuilding · services open' : 'Undead approaching' : '☠ Settlement closed'}</h3><p>${access.status === 'threatened'
    ? `Services remain open. Lockdown cannot begin for at least ${hoursLeft(state, access.warningUntil)} hours. Intercept the approaching host.`
    : access.status === 'recovering' ? `Food and supply prices are temporarily higher. ${hoursLeft(state, access.recoveryUntil)} hours of recovery remain.`
      : `Liberate to restore services. ${access.status === 'occupied' ? 'Occupied by an undead garrison.' : `Under siege · occupation in ${hoursLeft(state, access.siegeUntil)} hours.`} ${encounter?.enemies.length ?? 0} undead hold the settlement.`}</p>${encounter ? `<button class="primary" data-quest-travel="${encounter.kind}" data-target-id="${encounter.id}">Liberate settlement</button>` : ''}</section>`;
}

export function crisisJournalHTML(state) {
  const crisis = state.ashenWinter;
  if (!crisis || ['dormant', 'scheduled'].includes(crisis.phase)) return '';
  const encounters = getUndeadEncounters(state);
  const fronts = crisis.fronts.map(f => {
    const encounter = encounters.find(e => e.id === f.force.id);
    return `<article><h3>${esc(f.name)}</h3><p>${f.defeated ? 'Defeated · this front cannot close more settlements.' : crisis.phase === 'warning' ? 'Awakens when the invasion begins.' : 'Destroy this commander to stop new attacks on its front.'}</p>${encounter ? `<button data-quest-travel="${encounter.kind}" data-target-id="${encounter.id}">Confront commander</button>` : ''}</article>`;
  }).join('');
  const towns = SETTLEMENTS.filter(t => getSettlementAccess(state, t.id).status !== 'open').map(t => `<article><h3>${esc(t.name)}</h3>${settlementCrisisHTML(state, t.id)}</article>`).join('');
  const hosts = encounters.filter(e => e.kind === 'undead-host').map(e => `<p>${esc(e.name)} · ${e.enemies.length} undead${e.townId ? ` → ${esc(SETTLEMENTS.find(t => t.id === e.townId)?.name)}` : ' · road patrol'} <button data-quest-travel="${e.kind}" data-target-id="${e.id}">Intercept host</button></p>`).join('');
  const finalItem = getAshenFinalItem(state);
  return `<section class="crisis-journal paper-card"><h2>Ashen Winter</h2><p>${crisis.phase === 'completed' ? `The invasion is over. ${crisis.liberationCount} settlements liberated; ${crisis.hostVictories} hosts intercepted. Earned 1,000 crowns and 5 renown.` : 'Victory requires all three commanders defeated and every closed settlement liberated. Waiting will not reopen towns.'}</p><div class="crisis-objectives">${fronts}</div>${towns}${hosts}${finalItem ? `<p>Equipment reward: ${esc(getItem(finalItem).name)}</p>${crisis.finalItemClaimed ? '<p>Reward claimed.</p>' : '<button data-action="claim-ashen-reward">Claim equipment reward</button><p>Make room in your stash; this reward waits for you.</p>'}` : ''}</section>`;
}
