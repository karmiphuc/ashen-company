import { getItem, getDirewolfCraftQuote } from './engine.js';
import { DIREWOLF_HIDE, DIREWOLF_MAIL, MOONFANG_ITEM, MOONFANG_FEE, MOONFANG_ART } from './direwolf-crafting.js';
import { itemImage } from './portraits.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function armorerNavigationHTML(active) {
  return `<nav class="armorer-recipes" aria-label="Armorer recipes"><button data-action="ancient-armorer" aria-pressed="${active === 'ancient'}">Ancient restoration</button><button data-action="direwolf-armorer" aria-pressed="${active === 'direwolf'}">Direwolf fusion</button><button data-action="direwolf-helmets" aria-pressed="${active === 'helmets'}">Direwolf helmets</button></nav>`;
}
export function direwolfArmorerHTML(state, selection = {}) {
  const quote = getDirewolfCraftQuote(state, selection.hideIndex, selection.mailIndex);
  const materials = [[DIREWOLF_HIDE, 'hideIndex'], [DIREWOLF_MAIL, 'mailIndex']].map(([id, key]) => {
    const item = getItem(id);
    const copies = state.inventory.flatMap((copy, index) => copy === id ? [`<option value="${index}" ${selection[key] === index ? 'selected' : ''}>Copy ${index + 1} · ${state.inventoryCondition[index]} / ${item.armor} condition</option>`] : []);
    return `<label class="direwolf-material"><img src="${itemImage(item)}" alt=""><span><strong>${esc(item.name)}</strong><select data-direwolf-copy="${key}" aria-label="${esc(item.name)} material"><option value="">Choose a stash copy</option>${copies.join('')}</select>${copies.length ? '' : '<small>No ordinary copies in stash</small>'}</span></label>`;
  }).join('');
  return `<section class="direwolf-workbench"><figure class="direwolf-hero"><img src="${MOONFANG_ART.icon}" alt="Direwolf Moonfang Harness: ash-grey wolf mantle, dark leather and silver mail"><figcaption><h3>${MOONFANG_ITEM.name}</h3><strong>195 armor · 13 fatigue</strong></figcaption></figure><section><p>An ash-tipped mantle, fitted hide and close-woven mail. The wolf head and silver crescent survive as the marks of a masterwork.</p><p><strong>Guaranteed crafting · 3% chance of named workmanship</strong><br>Named bonuses improve the displayed baseline.</p><p>Pair with Direwolf Leather Hood, Wolf Helmet or Alpha Helm for the Direwolf set bonus.</p><p>Successful melee hits deal +5 morale damage before resolve resistance. Does not stack with Direwolf Fur; no effect on shots or undead.</p><fieldset class="ancient-copies"><legend>One hide + one mail</legend>${materials}</fieldset><p>Both selected pieces are permanently consumed. Worn and broken ordinary pieces qualify; equipped, named and reforged pieces do not. Your new harness is fully repaired.</p><p><strong>${MOONFANG_FEE} crowns</strong> · ${state.gold} available</p>${quote.ok ? '' : `<p role="status">${esc(quote.message)}</p>`}<button class="primary" data-action="direwolf-confirm" ${quote.ok && quote.affordable ? '' : 'disabled'}>Review crafting</button></section></section>`;
}
export function direwolfConfirmationHTML(quote) {
  return `<section><h3>Craft ${MOONFANG_ITEM.name}</h3><p>Permanently consume <strong>one Direwolf Hide Armor</strong> (stash copy ${quote.hideIndex + 1}), <strong>one Direwolf Mail Armor</strong> (stash copy ${quote.mailIndex + 1}) and <strong>${MOONFANG_FEE} crowns</strong>.</p><p>Guaranteed success: 195 armor / 13 fatigue, fully repaired. A separate 3% named chance adds exceptional workmanship.</p><div class="button-row"><button class="danger" data-action="direwolf-commit">Consume pieces &amp; craft</button><button data-action="direwolf-armorer">Cancel</button></div></section>`;
}
export function direwolfResultHTML(outcome) {
  const item = getItem(outcome.itemId);
  return `<section class="ancient-result"><img src="${itemImage(item)}" alt="${esc(item.name)}"><h3>${esc(item.name)}</h3><p>${item.armor} armor · ${item.fatigue} fatigue${outcome.named ? ' · Named workmanship' : ''}</p><p>Your fully repaired harness is in the stash.</p><div class="button-row"><button data-inspect="${esc(item.id)}" data-item-source="direwolf-armorer">Inspect harness</button><button data-action="direwolf-armorer">Craft another</button><button data-action="close-modal">Close</button></div></section>`;
}
