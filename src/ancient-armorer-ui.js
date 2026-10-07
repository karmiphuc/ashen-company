import { getItem, getAncientRestorationQuote, townAt, getSettlementAccess } from './engine.js';
import { ANCIENT_RESTORATION_TARGETS, ancientRestorationRecipe } from './ancient-restoration.js';
import { itemImage } from './portraits.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stats = item => `${item.armor} armor · ${item.fatigue} fatigue`;
const odds = '<p class="ancient-odds"><strong>80% bronze · 10% silverish steel · 10% failure</strong><br>On success: a separate 3% chance of named workmanship. Named bonuses improve the displayed baseline.</p>';

export function ancientArmorerHTML(state, selection = {}) {
  const here = townAt(state);
  if (!here || state.destination || state.battle || state.gameOver || !getSettlementAccess(state, here.id).servicesAvailable) return '<p>Visit an open settlement and stop traveling to use its Armorer.</p>';
  const designs = Object.keys(ANCIENT_RESTORATION_TARGETS);
  const sourceId = designs.includes(selection.sourceId) ? selection.sourceId : null;
  const indices = selection.indices ?? [];
  const recipes = designs.map(id => {
    const item = getItem(id), recipe = ancientRestorationRecipe(id), owned = state.inventory.filter(copy => copy === id).length;
    return `<button class="ancient-design${id === sourceId ? ' selected' : ''}" data-ancient-design="${id}" aria-pressed="${id === sourceId}"><img src="${itemImage(item)}" alt=""><span><strong>${esc(item.name)}</strong><small>${owned} in stash / ${recipe.count} needed · ${recipe.fee} crowns</small></span></button>`;
  }).join('');
  const recipe = ancientRestorationRecipe(sourceId);
  const quote = recipe ? getAncientRestorationQuote(state, indices) : null;
  const copies = recipe ? state.inventory.map((id, index) => ({ id, index })).filter(row => row.id === sourceId).map(({ index }) => `<label class="ancient-copy"><input type="checkbox" data-ancient-copy="${index}" ${indices.includes(index) ? 'checked' : ''}><span>Stash copy ${index + 1}<small>${state.inventoryCondition[index]} / ${getItem(sourceId).armor} condition</small></span></label>`).join('') : '';
  const source = sourceId ? getItem(sourceId) : null;
  const bronze = sourceId ? getItem(`rest-b-${sourceId.slice(3)}`) : null;
  const steel = sourceId ? getItem(`rest-s-${sourceId.slice(3)}`) : null;
  const preview = recipe ? `<h3>${esc(source.name)}</h3><div class="ancient-finishes">${[[bronze, '80% · Restored bronze'], [steel, '10% · Silverish steel']].map(([item, label]) => `<figure><img src="${itemImage(item)}" alt="${esc(item.name)}"><figcaption><strong>${label}</strong><span>${stats(item)}</span></figcaption></figure>`).join('')}</div><p>Steel has 20% more protection and 12% more fatigue than bronze, rounded to whole numbers.</p><fieldset class="ancient-copies"><legend>Choose ${recipe.count} matching stash pieces · ${indices.length} selected</legend>${copies || '<p>No ordinary copies of this design in your stash.</p>'}</fieldset><p class="forge-warning">All ${recipe.count} selected pieces are consumed, including on failure. Failure returns ${recipe.fee / 2} of ${recipe.fee} crowns and produces no equipment. Success produces one fully repaired piece.</p>${quote?.ok ? '' : `<p role="status">${esc(quote?.message ?? '')}</p>`}<p><strong>${recipe.fee} crowns</strong> · ${state.gold} available</p><button class="primary" data-action="ancient-confirm" ${quote?.ok && quote.affordable ? '' : 'disabled'}>Review restoration</button>` : '<p>Select an ancient design to preview its restored finishes and choose materials.</p>';
  return `<section class="ancient-armorer"><p>Restore recovered Ancient Armory equipment. Body armor: 3 matching pieces. Helmets: 2 matching pieces. Gold cost = restored bronze armor × 2 + fatigue × 5; steel and named upgrades carry no extra fee. Stash materials only; named and already restored pieces are excluded.</p>${odds}<div class="ancient-workbench"><section aria-label="Ancient designs"><h3>Ancient designs</h3><div class="ancient-designs">${recipes}</div></section><section class="ancient-preview" aria-live="polite">${preview}</section></div></section>`;
}
export function ancientRestorationConfirmationHTML(quote) {
  return `<section class="ancient-confirmation"><h3>Restore ${esc(quote.source.name)}</h3><p>Permanently consume <strong>${quote.count} matching pieces</strong> (stash copies ${quote.indices.map(index => index + 1).join(', ')}) and pay <strong>${quote.fee} crowns</strong>.</p>${odds}<ul><li>Bronze: ${stats(quote.bronze)}</li><li>Silverish steel: ${stats(quote.steel)}</li><li>Failure: pieces lost, no equipment, ${quote.refund} crowns refunded.</li></ul><div class="button-row"><button class="danger" data-action="ancient-commit">Consume pieces &amp; restore</button><button data-action="ancient-armorer">Cancel</button></div></section>`;
}
export function ancientRestorationResultHTML(outcome) {
  const item = getItem(outcome.itemId);
  return `<section class="ancient-result">${item ? `<img src="${itemImage(item)}" alt="${esc(item.name)}"><h3>${esc(item.name)}</h3><p>${stats(item)}${outcome.named ? ' · Named workmanship' : ''}</p><p>The restored piece is fully repaired and in your stash.</p>` : `<h3>Restoration failed</h3><p>${esc(outcome.message)}</p>`}<div class="button-row">${item ? `<button data-inspect="${esc(item.id)}" data-item-source="ancient-armorer">Inspect piece</button>` : ''}<button data-action="ancient-armorer">Restore another</button><button data-action="close-modal">Close</button></div></section>`;
}
