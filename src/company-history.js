// Device-local memories, separate from active campaign rules and full-save backups.
export const COMPANY_HISTORY_LIMIT = 12;
const fields = ['id','day','renown','generation','crisis','tombs','warrior','roster','sets'];
const text = value => typeof value === 'string' && value.length <= 160;
const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000;
const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === expected.length && expected.every(key=>Object.hasOwn(value,key));
export function readCompanyHistory(raw) {
 if(raw===null)return {version:1,entries:[]};
 if(typeof raw!=='string'||raw.length>250000)throw new TypeError('Invalid company history');
 const history=JSON.parse(raw);
 if(!keys(history,['version','entries'])||history.version!==1||!Array.isArray(history.entries)||history.entries.length>COMPANY_HISTORY_LIMIT)throw new TypeError('Invalid company history');
 const seen=new Set();
 for(const entry of history.entries){
  if(!keys(entry,fields)||!text(entry.id)||!entry.id||seen.has(entry.id)||!count(entry.day)||entry.day<1||!count(entry.renown)||!count(entry.generation)||entry.generation<1||typeof entry.crisis!=='boolean'||!count(entry.tombs)||entry.tombs>3||!(entry.warrior===null||text(entry.warrior))||!Array.isArray(entry.roster)||entry.roster.length>18||!Array.isArray(entry.sets)||entry.sets.length>3)throw new TypeError('Invalid company history entry');
  seen.add(entry.id);
  for(const member of entry.roster)if(!keys(member,['name','level','alive'])||!text(member.name)||!Number.isInteger(member.level)||member.level<1||member.level>30||typeof member.alive!=='boolean')throw new TypeError('Invalid history roster');
  for(const set of entry.sets)if(!Array.isArray(set)||set.length>7||!set.every(text))throw new TypeError('Invalid history equipment');
 }
 return history;
}
export function companyMemory(current,next,getItem) {
 const legacy=next.companyLegacy,generation=legacy?.generation??(current.companyLegacy?.generation??0)+1;
 return {id:`${current.seed}:${current.day}:${generation}`,day:current.day,renown:current.renown,generation,crisis:current.ashenWinter?.phase==='completed',tombs:current.companyLegacy?.version===3?Math.min(3,current.companyLegacy.stage-1):0,warrior:next.legacyWarrior?.member?.name??null,roster:current.party.map(p=>({name:p.name,level:p.level,alive:p.hp>0})),sets:legacy?.version===3?legacy.sets.map(set=>Object.values(set).filter(Boolean).map(entry=>getItem(entry.itemId).name)):legacy?[ [getItem(legacy.itemId).name,...(legacy.stash??[]).map(entry=>getItem(entry.itemId).name)] ]:[]};
}
export function appendCompanyMemory(raw,entry) {
 const history=readCompanyHistory(raw);
 history.entries=[entry,...history.entries.filter(old=>old.id!==entry.id)].slice(0,COMPANY_HISTORY_LIMIT);
 const result=JSON.stringify(history);
 readCompanyHistory(result);
 return result;
}
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function companyHistoryHTML(history) {
 return `<section class="company-history"><p class="eyebrow">◇ HALL OF FALLEN LEGENDS</p>${history.entries.length?`<div class="company-history-grid">${history.entries.map(entry=>`<article class="paper-card"><div class="eyebrow">BANNER ${entry.generation}</div><h3>Day ${entry.day} <small>· ${entry.renown} renown</small></h3><div class="button-row">${entry.crisis?'<span title="Ashen Winter defeated" aria-label="Ashen Winter defeated">♜ Ashen victor</span>':''}${entry.tombs?`<span title="Tomb sets unveiled in this campaign">◇ ${entry.tombs}/3 tombs</span>`:''}<span title="Surviving brothers at retirement">♟ ${entry.roster.filter(p=>p.alive).length}/${entry.roster.length}</span></div>${entry.warrior?`<p>❄ <strong>${esc(entry.warrior)}</strong><small> · preserved for the Frozen Vigil</small></p>`:''}<details><summary>♟ Brothers &amp; entombed gear</summary><ul>${entry.roster.map(p=>`<li>${p.alive?'♟':'†'} ${esc(p.name)} <small>· level ${p.level}${p.alive?'':' · fallen'}</small></li>`).join('')}</ul>${entry.sets.map((set,i)=>`<p><strong>◇ Legend ${i+1}</strong><br>${set.map(esc).join(' · ')}</p>`).join('')}</details></article>`).join('')}</div>`:'<p>Your first retired banner will be remembered here.</p>'}<details><summary>ⓘ Keeping your history</summary><p>Up to ${COMPANY_HISTORY_LIMIT} recent retirements are remembered on this device. These memories grant no rewards or bonuses. Export history for safekeeping; it is a summary, not a playable save. Export retired company separately to keep the full latest campaign.</p></details><div class="button-row"><button data-action="history-export" ${history.entries.length?'':'disabled'}>⇩ Export history</button><button data-action="legacy-export-retired">⇩ Retired save</button></div></section>`;
}
