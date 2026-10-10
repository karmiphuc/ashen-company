import { getCompanyLegacy, getLegacyRetirementQuote, getItem, townAt, getSettlementAccess, SETTLEMENTS } from './engine.js';
import { itemImage } from './portraits.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const townName = id => SETTLEMENTS.find(t => t.id === id)?.name;
export function legacyPanelHTML(state) {
  const legacy=getCompanyLegacy(state);
  if(!legacy)return '<p>No heirloom has been entrusted to this company.</p>';
  const progress=legacy.stage===3?`${legacy.contracts.length}/3 contracts`:legacy.stage===4?`${legacy.victories.length}/3 victories · Day ${state.day}/30 · Renown ${state.renown}/150`:'';
  const atTown=legacy.quest&&!state.destination&&townAt(state)?.id===legacy.quest.townId&&getSettlementAccess(state,legacy.quest.townId).servicesAvailable;
  return `<section class="legacy-panel"><div class="legacy-heirloom"><img src="${esc(itemImage(legacy.item))}" alt="${esc(legacy.item.name)}"><div><span class="eyebrow">${legacy.stage===5?'RESTORED':'SEALED HEIRLOOM'} · GENERATION ${legacy.generation}</span><h3>${esc(legacy.item.name)}</h3><small>Passed on after day ${legacy.source.day} · ${legacy.source.renown} renown</small></div></div>${legacy.quest?`<div class="eyebrow">SIDE QUEST ${legacy.stage}/4 · ${esc(townName(legacy.quest.townId))}</div><h3>${esc(legacy.quest.name)}</h3><p>${esc(legacy.quest.objective)}</p>${progress?`<p role="status">${esc(progress)}</p>`:''}<div class="button-row"><button class="${legacy.ready?'is-ready primary':''}" data-legacy-turnin="${legacy.stage}" ${legacy.ready&&atTown?'':'disabled'}>${legacy.stage===4?'◇ Restore heirloom':'✓ Complete step'}</button><button data-action="legacy-map">⌖ Show settlement</button></div>${atTown?'':`<small>Report in ${esc(townName(legacy.quest.townId))}. Settlement services must be open.</small>`}<details><summary>Inheritance rules</summary><p>The heirloom cannot be equipped or sold while sealed. It returns with its original bonuses and condition after all four steps; no extra rolls or stacking buffs. Ordinary contracts remain available. Materials are consumed; existing contract cargo may also need them.</p></details>`:'<p>Your heirloom was restored to the stash. This inheritance is complete.</p>'}</section>`;
}
export function legacyJournalHTML(state) {
  if(state.companyLegacy)return `<section class="paper-card legacy-journal"><div class="eyebrow">COMPANY LEGACY</div>${legacyPanelHTML(state)}</section>`;
  if(state.ashenWinter?.phase!=='completed')return '';
  return '<section class="paper-card legacy-journal"><div class="eyebrow">AFTER THE CRISIS</div><h2>A new banner</h2><p>Retire in an open settlement and entrust one named item to a new company.</p><button data-action="legacy-retire">◇ Plan your legacy</button></section>';
}
export function legacyRetirementHTML(state) {
  const eligible=state.inventory.flatMap((id,index)=>getLegacyRetirementQuote(state,index).ok?[{item:getItem(id),index}]:[]);
  if(!eligible.length){const quote=getLegacyRetirementQuote(state,0);return `<p>${esc(quote.ok?'Choose one named item from your stash.':quote.message)}</p><p>Equipped heirlooms must be stowed first.</p><button data-action="close-modal">Keep playing</button>`;}
  return `<p>Choose <strong>one</strong> named heirloom. It starts sealed; four side quests restore it, no earlier than day 30 and 150 renown.</p><div class="legacy-items">${eligible.map(({item,index})=>`<button data-legacy-item="${index}" title="${esc(item.name)}" aria-label="Choose ${esc(item.name)}"><img src="${esc(itemImage(item))}" alt=""><span>${esc(item.name)}</span><small>${esc(item.slot)}</small></button>`).join('')}</div><details><summary>What carries over?</summary><p>Only this item's identity, bonuses and condition, plus a short company history. Gold, roster, XP, contracts, retinue, cargo and other equipment stay behind. The retired save is backed up on this device before your new company replaces it; export it for a durable backup. A later retirement replaces that backup.</p></details>`;
}
export function legacyConfirmationHTML(state,quote) {
  const item=getItem(quote.itemId);
  return `<div class="legacy-heirloom"><img src="${esc(itemImage(item))}" alt="${esc(item.name)}"><h3>${esc(item.name)}</h3></div><p><strong>This ends your current campaign and replaces its active save.</strong> One local retirement backup is kept; export your save for safekeeping.</p><p>Your new company starts with normal recruits and resources. This item stays sealed until four side quests, day 30 and 150 renown. Its original bonuses and wear are preserved.</p><div class="button-row"><button data-action="export">Export current save</button><button class="danger" data-action="legacy-confirm">Retire &amp; found new company</button><button data-action="close-modal">Keep playing</button></div>`;
}
