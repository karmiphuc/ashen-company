import { getItem, getDirewolfHelmetQuote } from './engine.js';
import { DIREWOLF_HELMET_RECIPES, DIREWOLF_LEATHER_HELMET, DIREWOLF_EXISTING_HELMET } from './direwolf-helmets.js';
import { itemImage } from './portraits.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function direwolfHelmetHTML(state, selection = {}) {
  const recipeId = Object.hasOwn(DIREWOLF_HELMET_RECIPES, selection.recipeId) ? selection.recipeId : DIREWOLF_LEATHER_HELMET;
  const recipe = DIREWOLF_HELMET_RECIPES[recipeId], item = getItem(recipeId), indices = selection.indices ?? [];
  const quote = getDirewolfHelmetQuote(state, recipeId, indices), wolf = getItem(DIREWOLF_EXISTING_HELMET);
  const recipeButtons = Object.values(DIREWOLF_HELMET_RECIPES).map(r => `<button data-direwolf-helmet-recipe="${r.itemId}" aria-pressed="${r.itemId === recipeId}">${esc(getItem(r.itemId).name)}</button>`).join('');
  const copies = recipe.materialIds.map((id, i) => {
    const source = getItem(id), rows = state.inventory.flatMap((copy, index) => copy === id ? [`<option value="${index}" ${indices[i] === index ? 'selected' : ''}>Copy ${index + 1} · ${state.inventoryCondition[index]} / ${source.armor} condition</option>`] : []);
    return `<label class="direwolf-material"><img src="${itemImage(source)}" alt=""><span><strong>${esc(source.name)}</strong><select data-direwolf-helmet-copy="${i}" aria-label="${esc(source.name)} material"><option value="">Choose a stash copy</option>${rows.join('')}</select>${rows.length ? '' : '<small>No eligible copies in stash</small>'}</span></label>`;
  }).join('');
  return `<section><div class="armorer-recipes" aria-label="Helmet recipes">${recipeButtons}</div><p>The existing Wolf Helmet supplies the mail design: ${wolf.armor} armor / ${wolf.fatigue} fatigue, +4 resolve. Its stats and artwork are preserved.</p><section class="direwolf-workbench"><figure class="direwolf-hero direwolf-helmet-hero"><img src="${itemImage(item)}" alt="${esc(item.name)}"><figcaption><h3>${esc(item.name)}</h3><strong>${item.armor} armor · ${item.fatigue} fatigue</strong>${item.statBonuses?.resolve ? '<p>+4 resolve</p>' : ''}</figcaption></figure><section><p>${esc(item.description)}</p><p><strong>Guaranteed crafting · 3% named chance</strong><br>Success creates one fully repaired helmet. Named bonuses improve its baseline.</p><p>Wear with Direwolf Hide, Direwolf Mail or Moonfang Harness: +15% head/body armor, −10% helmet fatigue and −15% body fatigue.</p><fieldset class="ancient-copies"><legend>Choose exact materials</legend>${copies}</fieldset><p>All selected pieces are permanently consumed. Worn and broken originals qualify, including the original rare Wolf Helmet. Added named workmanship and reforged variants cannot be used.</p><p><strong>${recipe.fee} crowns</strong> · ${state.gold} available</p>${quote.ok ? '' : `<p role="status">${esc(quote.message)}</p>`}<button class="primary" data-action="direwolf-helmet-confirm" ${quote.ok && quote.affordable ? '' : 'disabled'}>Review helmet crafting</button></section></section></section>`;
}
export function direwolfHelmetConfirmationHTML(quote, state) {
  const materials = quote.indices.map(index => `<li>${esc(getItem(state.inventory[index]).name)} · stash copy ${index + 1} · ${state.inventoryCondition[index]} condition</li>`).join('');
  return `<section><h3>Craft ${esc(quote.item.name)}</h3><p>Permanently consume:</p><ul>${materials}</ul><p><strong>${quote.fee} crowns</strong> · Guaranteed success, ${quote.item.armor} armor / ${quote.item.fatigue} fatigue, fully repaired. Separate 3% named chance.</p><div class="button-row"><button class="danger" data-action="direwolf-helmet-commit">Consume pieces &amp; craft</button><button data-action="direwolf-helmets">Cancel</button></div></section>`;
}
export function direwolfHelmetResultHTML(outcome) {
  const item = getItem(outcome.itemId);
  return `<section class="ancient-result"><img src="${itemImage(item)}" alt="${esc(item.name)}"><h3>${esc(item.name)}</h3><p>${item.armor} armor · ${item.fatigue} fatigue${outcome.named ? ' · Named workmanship' : ''}</p><p>Your fully repaired helmet is in the stash.</p><div class="button-row"><button data-inspect="${esc(item.id)}" data-item-source="direwolf-helmets">Inspect helmet</button><button data-action="direwolf-helmets">Craft another</button><button data-action="close-modal">Close</button></div></section>`;
}
