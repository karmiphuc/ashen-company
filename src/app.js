import { ITEMS, SETTLEMENTS, createGame, travelTo, tick, townAt, acceptContract, buyItem, sellItem, equipItem, unequipItem, recruit, camp, forage, getEquipment, terrainAt, validateSave } from './engine.js';
import { portraitSVG } from './portraits.js';
import { mapSVG, updateMap } from './map.js';

const SAVE_KEY='ashen-company-save-v1';
const $=selector=>document.querySelector(selector);
const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const itemById=id=>ITEMS.find(i=>i.id===id);
const townById=id=>SETTLEMENTS.find(t=>t.id===id);
const icons={armor:'♜',helmet:'♟',weapon:'⚔',shield:'◈'};
let state=createGame(7391),tab='world',selected='captain',speed=0,toastTimer,saveProblem=false;
let unreadSave=false,corruptSave=null;
try {
  const raw=localStorage.getItem(SAVE_KEY);
  if(raw) {try {state=validateSave(JSON.parse(raw));} catch {unreadSave=true;corruptSave=raw;}}
} catch {saveProblem=true;}

function save() {
  if(unreadSave) return;
  try {localStorage.setItem(SAVE_KEY,JSON.stringify(state));saveProblem=false;} catch {if(!saveProblem) toast('Storage is unavailable. Export your save before closing.');saveProblem=true;}
}
function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
function run(action,...args) {const result=action(state,...args);toast(result.message);save();render();return result;}
function showModal(title,body,kicker='THE ASHEN COMPANY') {
  speed=0;updateSpeed();
  $('#modal-content').innerHTML=`<div class="modal-header"><div><div class="eyebrow">${kicker}</div><h2>${title}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">×</button></div><div class="modal-body">${body}</div>`;
  if(!$('#modal').open) $('#modal').showModal();
}
function resources() {
  $('#resources').innerHTML=`<div class="resource"><span class="symbol">◉</span><span><strong>${state.gold.toLocaleString()}</strong><small>Crowns</small></span></div><div class="resource"><span class="symbol">❧</span><span><strong>${state.food}</strong><small>Provisions</small></span></div><div class="resource renown"><span class="symbol">⚑</span><span><strong>${state.renown}</strong><small>Renown</small></span></div>`;
}
function contractHTML() {
  if(!state.contract) return `<div class="contract-card"><div class="eyebrow">A COMPANY NEEDS WORK</div><h3>Every road has a story.</h3><p>Visit a settlement and take a delivery contract. A full purse buys better steel.</p></div>`;
  const target=townById(state.contract.to);
  return `<div class="contract-card"><div class="eyebrow">SEALED DISPATCHES</div><h3>Onward to ${target.name}</h3><p>Deliver the council's letter. Payment is yours when the company arrives.</p><div class="contract-reward">◉ ${state.contract.reward} crowns · 1 renown</div><button class="small secondary" data-travel="${target.id}" style="margin-top:13px;width:100%">Travel to ${target.name} →</button></div>`;
}
function sidebarHTML() {
  const town=townAt(state),moving=!!state.destination;
  const terrain=terrainAt(state.position.x,state.position.y);
  return `<div><div class="eyebrow" id="world-date">DAY ${state.day} · ${String(Math.floor(state.hour)).padStart(2,'0')}:00</div><h2 id="location-name">${town?town.name:'The open road'}</h2><div class="location-pill" id="travel-status">${moving?'➤ On the march':'◇ Company at rest'} · ${terrain}</div><p class="sidebar-description">${town?town.description:'Beyond the gates, the Marches belong to whoever can endure them.'}</p></div><div class="divider"></div><div class="stack sidebar-actions">${town?`<button data-action="market">Marketplace <span>↗</span></button><button data-action="contracts">Contracts <span>▤</span></button><button data-action="recruit">Recruit a companion <span>+</span></button>`:`<button data-action="forage">Forage for provisions <span>4h</span></button>`}<button class="secondary" data-action="camp">Make camp <span>6h</span></button></div>${contractHTML()}<p class="intro-tip">Tap a settlement or open ground to travel. Time pauses when you arrive or open a menu.</p><div class="weather"><span>☼ Clear skies</span><span>${state.party.length * 5} crowns / day</span></div>`;
}
function stripHTML() {
  return `<section class="company-strip" aria-label="Your company"><div class="strip-intro"><div class="eyebrow">YOUR BANNER</div><h3>The company</h3><p>${state.party.length} of 8 companions</p></div><div class="strip-roster">${state.party.map(p=>`<button class="mini-person" data-person="${p.id}" aria-label="Equip ${esc(p.name)}">${portraitSVG(p,getEquipment(p),90)}<span class="mini-name">${esc(p.name.split(' ')[0])}</span><span class="hp-bar"><span style="width:${p.hp}%"></span></span></button>`).join('')}<button class="strip-recruit" data-action="recruit" aria-label="Recruit a companion">+</button></div><button class="secondary small" data-tab="company">Manage<br>company →</button></section>`;
}
function worldHTML() {
  return `<section class="world-layout"><div class="map-wrap"><div class="map-heading"><div class="eyebrow">THE WORLD AWAITS</div><h1>The Marches</h1><p>A land of small fortunes and long roads.</p></div>${mapSVG()}<div class="map-vignette"></div><div class="map-controls" aria-label="Travel speed"><button data-speed="0" aria-label="Pause travel">Ⅱ</button><button data-speed="1" aria-label="Normal travel speed">1×</button><button data-speed="3" aria-label="Fast travel speed">3×</button></div><div class="map-scale">30 LEAGUES</div></div><aside class="world-sidebar">${sidebarHTML()}</aside></section>${stripHTML()}`;
}
function inventoryHTML() {
  const counts=new Map();state.inventory.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
  return [...counts].map(([id,count])=>{const item=itemById(id);return `<div class="item-row"><span class="item-icon">${icons[item.slot]}</span><div class="item-info"><strong>${item.name}${count>1?` ×${count}`:''}</strong><small>${item.slot} · ${item.armor?`${item.armor} protection`: `${item.power||0} power`}</small></div><button class="small" data-equip="${id}">Equip</button></div>`;}).join('') || '<div class="empty-state">Your baggage is empty. Visit a marketplace to buy equipment.</div>';
}
function companyHTML() {
  const person=state.party.find(p=>p.id===selected)||state.party[0];selected=person.id;
  const equipment=getEquipment(person),gear=Object.values(equipment).filter(Boolean),armor=gear.reduce((sum,i)=>sum+(i.armor||0),0),fatigue=gear.reduce((sum,i)=>sum+(i.fatigue||0),0);
  return `<section class="page"><div class="page-heading"><div><div class="eyebrow">PEOPLE BEHIND THE BANNER</div><h1>The company</h1><p>Every piece of steel tells a different story. Equip a companion to see it.</p></div><span class="status-tag">${state.party.length} / 8 COMPANIONS</span></div><div class="company-layout"><div class="roster-list">${state.party.map(p=>`<button class="roster-person ${selected===p.id?'active':''}" data-person="${p.id}">${portraitSVG(p,getEquipment(p),65)}<span><strong>${esc(p.name)}</strong><small>${esc(p.background)}</small></span></button>`).join('')}<button class="secondary small" data-action="recruit">+ Recruit</button></div><article class="character-card"><div class="eyebrow">${esc(person.background)}</div><h2>${esc(person.name)}</h2><div class="hero-portrait">${portraitSVG(person,equipment,280)}</div><div class="character-stats"><div><strong>${person.hp}</strong><small>Health</small></div><div><strong>${armor}</strong><small>Protection</small></div><div><strong>${person.morale}</strong><small>Morale</small></div></div><div class="equipment-slots">${['helmet','armor','weapon','shield'].map(slot=>`<button class="slot" data-unequip="${slot}" ${!equipment[slot]?'disabled':''}><small>${slot}</small><strong>${equipment[slot]?.name||'Unequipped'}</strong><span>${equipment[slot]?'Tap to move into baggage':'Choose an item from baggage'}</span></button>`).join('')}</div><p class="controls-hint">Gear weight: ${fatigue} · Combat stats are reserved for phase 2.</p></article><aside class="inventory-panel"><div class="eyebrow">SHARED INVENTORY</div><h3 style="margin-top:7px">Company baggage</h3><p>Equip items on ${esc(person.name.split(' ')[0])}. Replaced gear returns here.</p>${inventoryHTML()}<button class="secondary small" data-action="market" style="width:100%;margin-top:15px">Visit marketplace →</button></aside></div></section>`;
}
function journalHTML() {
  return `<section class="page"><div class="page-heading"><div><div class="eyebrow">INK, DUST & SMALL FORTUNES</div><h1>The chronicle</h1><p>The last thirty entries from your company's journey.</p></div><span class="status-tag">DAY ${state.day}</span></div><div class="journal-layout"><div>${[...state.log].reverse().map(entry=>`<div class="journal-entry">${esc(entry)}</div>`).join('')}</div><aside class="paper-card"><div class="eyebrow">THE CAPTAIN'S FIELD NOTES</div><h2>A living to be made</h2><p>You have a banner, a few companions, and enough coin for a beginning.</p><ul><li>Take <strong>delivery contracts</strong> in settlements.</li><li>Tap your destination, then watch the road.</li><li>Buy armor and helmets in the marketplace.</li><li>Equip each companion in <strong>The company</strong>.</li><li>Pay 5 crowns and 1 provision per person each day.</li><li>Camp to recover. Forage to replenish supplies.</li></ul><p><strong>First chapter:</strong> travel, contracts, trade and equipment. Automated battles, enemies and loot are planned for the next chapter.</p><button class="primary" data-action="settings">Prepare for offline play</button></aside></div></section>`;
}
function render() {
  resources();$('#main').innerHTML=tab==='world'?worldHTML():tab==='company'?companyHTML():journalHTML();
  document.querySelectorAll('.nav-tabs [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  updateMap(state);updateSpeed();
}
function updateSpeed() {document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===speed));}
function market() {
  const town=townAt(state);if(!town){toast('Visit a settlement to trade.');return;}
  const sell=[...new Set(state.inventory)].map(id=>{const item=itemById(id);return `<div class="item-row"><div class="item-info"><strong>${item.name}</strong><small>In company baggage</small></div><button class="small" data-sell="${id}">Sell · ${Math.floor(item.price/2)} ◉</button></div>`;}).join('');
  showModal('The marketplace',`<p>Outfit your company. You have <strong>${state.gold} crowns</strong>. New purchases go into company baggage.</p><div class="market-grid">${ITEMS.map(item=>`<article class="shop-item"><div class="eyebrow">${item.slot}</div><h3>${item.name}</h3><p>${item.description}</p><button data-buy="${item.id}" ${state.gold<item.price?'disabled':''}>Buy · ${item.price} ◉</button></article>`).join('')}</div><h3 style="margin-top:24px">Sell from baggage</h3>${sell||'<p>No spare equipment to sell.</p>'}<div class="button-row"><button data-action="forage">Forage for provisions · 4h</button><button class="primary" data-action="go-company">Equip your company →</button></div>`,town.name.toUpperCase());
}
function contracts() {
  const town=townAt(state);if(!town){toast('Visit a settlement to find work.');return;}
  if(state.contract){showModal('Work in hand',`${contractHTML()}<p style="margin-top:16px">Finish your delivery before taking another contract.</p>`);return;}
  const preview=structuredClone(state);acceptContract(preview,town.id);const target=townById(preview.contract.to);
  showModal('A letter for the road',`<p>The council needs sealed dispatches carried to <strong>${target.name}</strong>. The payment is modest, the work honest enough.</p><div class="paper-card"><div class="eyebrow">DELIVERY CONTRACT</div><h2>${town.name} → ${target.name}</h2><p>No deadline. Payment on arrival.</p><h3>${preview.contract.reward} crowns + 1 renown</h3></div><div class="button-row"><button class="primary" data-accept="${town.id}">Accept the contract</button><button class="secondary" data-action="close-modal">Perhaps later</button></div>`,town.name.toUpperCase());
}
function recruitModal() {
  if(!townAt(state)){toast('Recruit companions at a settlement.');return;}
  const preview=structuredClone(state),res=recruit(preview);
  if(!res.ok){toast(res.message);return;}
  const person=preview.party.at(-1),cost=state.gold-preview.gold;
  showModal('Another hand for the road',`<div style="display:flex;align-items:center;gap:22px">${portraitSVG(person,getEquipment(person),150)}<div><div class="eyebrow">${esc(person.background)}</div><h2>${esc(person.name)}</h2><p>A place beneath your banner, a share of the road.</p></div></div><p>Hiring fee: <strong>${cost} crowns</strong>. Upkeep: 5 crowns and 1 provision per day. Company: ${state.party.length}/8.</p><div class="button-row"><button class="primary" data-action="hire">Hire companion · ${cost} ◉</button><button class="secondary" data-action="close-modal">Leave</button></div>`);
}
function settings() {
  showModal('Ready for the long journey',`<p>Your company saves automatically on this device. Export a backup before your flight.</p><div class="save-note"><strong>On your iPad</strong><br>1. Open this game in Safari while online.<br>2. Share → Add to Home Screen, then open that icon.<br>3. Wait for <strong>Offline ready</strong> in the top bar.<br>4. Turn on airplane mode, close the game, and reopen it once to check.</div><p style="margin-top:15px">iPadOS can remove website data when storage is low. Keep an exported save in Files. This device's save does not sync with other devices.</p><div class="button-row"><button class="primary" data-action="export">Export save</button><button data-action="import">Import save</button>${corruptSave!==null?'<button data-action="export-recovery">Export damaged save</button>':' '}</div><input class="hidden" type="file" accept=".json,application/json" id="import-file"><p>${saveProblem?'Saving is unavailable. Export before closing.':unreadSave?'A damaged old save is preserved. Current play is temporary: export the current company, then import that file to resume autosaving. You can also export the damaged file for recovery.':'Company progress saves automatically.'}</p><div class="divider"></div><div class="button-row"><button class="secondary danger" data-action="new-game">Start a new company</button></div><p>Version 0.1 · An original mercenary chronicle.<br>Travel and equipment are playable. Auto-combat is planned for phase 2.</p>`);
}
function exportSave(recovery=false) {
  const text=recovery&&corruptSave!==null?corruptSave:JSON.stringify(state,null,2);
  const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=recovery?'ashen-company-damaged-save.json':`ashen-company-day-${state.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Save exported. Keep it in Files for the journey.');
}
function startTravel(x,y) {
  const result=travelTo(state,x,y);toast(result.message);
  if(result.ok){speed=1;tab='world';$('#modal').close();save();render();}
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button) {
    if(button.disabled) return;
    if(button.dataset.tab){tab=button.dataset.tab;speed=0;render();return;}
    if(button.dataset.person){selected=button.dataset.person;tab='company';speed=0;render();return;}
    if(button.dataset.speed!==undefined){speed=Number(button.dataset.speed);if(speed&&!state.destination){speed=0;toast('Tap the map to choose a destination first.');}updateSpeed();return;}
    if(button.dataset.travel){const t=townById(button.dataset.travel);startTravel(t.x,t.y);return;}
    if(button.dataset.equip){run(equipItem,selected,button.dataset.equip);return;}
    if(button.dataset.unequip){run(unequipItem,selected,button.dataset.unequip);return;}
    if(button.dataset.buy){run(buyItem,button.dataset.buy);market();return;}
    if(button.dataset.sell){run(sellItem,button.dataset.sell);market();return;}
    if(button.dataset.accept){run(acceptContract,button.dataset.accept);$('#modal').close();return;}
    switch(button.dataset.action) {
      case 'close-modal':$('#modal').close();break;
      case 'market':market();break;
      case 'contracts':contracts();break;
      case 'recruit':recruitModal();break;
      case 'hire':run(recruit);$('#modal').close();break;
      case 'camp':speed=0;run(camp);break;
      case 'forage':speed=0;run(forage);if($('#modal').open) market();break;
      case 'go-company':$('#modal').close();tab='company';render();break;
      case 'settings':settings();break;
      case 'export':exportSave();break;
      case 'export-recovery':exportSave(true);break;
      case 'import':$('#import-file').click();break;
      case 'new-game':showModal('A new banner?',`<p>This replaces the company saved on this device. Export your current save first if you want to keep it.</p><div class="button-row"><button class="primary" data-action="export">Export current save</button><button class="danger" data-action="confirm-new">Replace company</button><button data-action="close-modal">Keep playing</button></div>`);break;
      case 'confirm-new':state=createGame();selected=state.party[0].id;unreadSave=false;save();tab='world';$('#modal').close();render();toast('A new company gathers at Oakwatch.');break;
    }
    return;
  }
  const map=event.target.closest('#world-map');
  if(map){const settlement=event.target.closest('[data-town]');if(settlement){const t=townById(settlement.dataset.town);if(townAt(state)?.id===t.id){contracts();return;}startTravel(t.x,t.y);}else {const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(map.getScreenCTM().inverse());startTravel(point.x,point.y);}}
});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-town]')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
document.addEventListener('change',async event=>{
  if(event.target.id!=='import-file') return;
  const file=event.target.files[0];if(!file)return;
  try{if(file.size>250000)throw new Error('Save file is too large.');const imported=validateSave(JSON.parse(await file.text()));state=imported;unreadSave=false;selected=state.party[0].id;speed=0;save();$('#modal').close();render();toast('Company restored from your save.');}catch(error){toast(`Could not import save: ${error.message}`);}
});
$('#settings-button').addEventListener('click',settings);
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('#modal').close();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){speed=0;save();updateSpeed();}});
window.addEventListener('pagehide',save);
let lastFrame=performance.now(),lastSave=0,lastSidebar='';
function animate(now) {
  const elapsed=Math.min((now-lastFrame)/1000,.25);lastFrame=now;
  if(speed&&state.destination&&!document.hidden&&!$('#modal').open&&tab==='world') {
    const contractBefore=state.contract;
    tick(state,elapsed*speed*.42);updateMap(state);
    const key=`${state.day}-${Math.floor(state.hour)}-${townAt(state)?.id}-${!!state.destination}`;
    if(key!==lastSidebar){$('.world-sidebar').innerHTML=sidebarHTML();resources();lastSidebar=key;}
    if(!state.destination){speed=0;save();render();toast(contractBefore&&!state.contract?'Delivery complete. Your payment is in the purse.':'The company has arrived.');}
    if(now-lastSave>2000){save();lastSave=now;}
  }
  requestAnimationFrame(animate);
}
render();requestAnimationFrame(animate);
if(unreadSave)toast('An old save could not be read and was preserved. Open settings to recover.');
else save();

async function prepareOffline() {
  const label=$('#offline-status');
  if(!('serviceWorker' in navigator)){label.textContent='Offline unavailable';return;}
  try {
    await navigator.serviceWorker.register('./sw.js');
    const registration=await navigator.serviceWorker.ready;
    const check=()=>{const channel=new MessageChannel();channel.port1.onmessage=e=>{if(e.data?.ready){label.textContent='Offline ready';label.classList.add('ready');}else label.textContent='Open online to prepare';};(navigator.serviceWorker.controller||registration.active)?.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);};
    check();navigator.serviceWorker.addEventListener('controllerchange',check);
  } catch {label.textContent='Open online to prepare';}
}
prepareOffline();
