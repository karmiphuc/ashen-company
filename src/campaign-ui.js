import { SETTLEMENTS, getItem, getEquipment, getCompanyStats, getCampSites, getLevelUp, huntComplete } from './engine.js';
import { portraitHTML, itemImage } from './portraits.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const item = getItem;
const town = id => SETTLEMENTS.find(entry => entry.id === id);
const itemIcon = (entry, alt=entry?.name) => `<img class="equipment-icon${entry?.rarity === 'famed' ? ' famed-item-icon' : ''}" src="${itemImage(entry)}" alt="${esc(alt)}">`;
export const statLabels = {maxHp:'Hitpoints',maxFatigue:'Maximum Fatigue',resolve:'Resolve',initiative:'Initiative',meleeSkill:'Melee Skill',rangedSkill:'Ranged Skill',meleeDefense:'Melee Defense',rangedDefense:'Ranged Defense'};

export function resourceHTML(state, speed) {
  const values = [
    ['money',state.gold.toLocaleString(),'Crowns'],
    ['food',state.food,`Provisions · ${Math.floor(state.food / Math.max(1,state.party.length))} days`],
    ['tools',state.supplies?.tools ?? 0,'Tools & supplies'],
    ['medicine',state.supplies?.medicine ?? 0,'Medicine'],
    ['ammo',state.supplies?.ammo ?? 0,'Ammunition'],
  ];
  return values.map(([kind,value,label])=>`<div class="resource resource-${kind}" title="${label}"><span class="supply-symbol supply-${kind}" aria-hidden="true"></span><span><strong>${value}</strong><small>${label}</small></span></div>`).join('') + `<div class="resource clock"><span><strong>Day ${state.day}</strong><small>${String(Math.floor(state.hour)).padStart(2,'0')}:00 · ${speed?(state.pursuit?'Pursuing':state.destination?'On the march':'Waiting'):'Paused'}</small></span></div>`;
}

function conditionRow(label, current, max, type) {
  return `<div class="condition-row"><span>${label}</span><div class="condition-meter ${type}"><i style="width:${max ? Math.max(0,Math.min(100,current/max*100)) : 0}%"></i><strong>${Math.round(current)} / ${max}</strong></div></div>`;
}

export function companySheetHTML(state, person, filter, inventory) {
  const stats = getCompanyStats(person), gear = getEquipment(person);
  const training = stats.trainingPoints ?? person.trainingPoints ?? 0;
  const body = stats.bodyArmor ?? gear.armor?.armor ?? 0, head = stats.headArmor ?? gear.helmet?.armor ?? 0;
  return `<section class="page company-page"><div class="page-heading"><div><div class="eyebrow">${esc(person.background)} · LEVEL ${stats.level || 1}</div><h1>${esc(person.name)}</h1><p>${state.party.length} / 12 brothers · ${state.renown} renown</p></div><button data-tab="world">Return to the world map</button></div>
  <div class="company-layout detailed-company"><article class="character-card"><div class="hero-portrait">${portraitHTML(person,gear,150)}</div>
  <div class="condition-list">${conditionRow('Head',head,gear.helmet?.armor||0,'armor')}${conditionRow('Body',body,gear.armor?.armor||0,'armor')}${conditionRow('Hitpoints',person.hp,stats.maxHp,'health')}</div>
  <div class="experience-bar"><i style="width:${Math.min(100,((stats.xp||0)/Math.max(1,stats.nextLevelXp||100))*100)}%"></i><span>${stats.xp||0} / ${stats.nextLevelXp||100} experience</span></div>
  <p class="gear-note">${person.morale >= 80?'Confident':person.morale>=50?'Steady':person.morale>=25?'Wavering':'Breaking'} morale · ${person.morale}<br>${person.injuries?.length?esc(person.injuries.map(i=>typeof i==='string'?i:i.name).join(', ')):person.hp<stats.maxHp?'Wounded - recovering':'Uninjured'}</p>  <div class="attribute-list">${Object.entries(statLabels).map(([key,label])=>`<div><span>${label}</span><strong>${stats[key] ?? 0}</strong></div>`).join('')}</div>${training?`<div class="training-ready"><p>${training} ${training===1?'level-up':'level-ups'} ready · Choose 3 attributes per level</p><button class="primary" data-action="level-up">Level up ${esc(person.name.split(' ')[0])}</button></div>`:''}</article>
  <section class="equipment-panel"><h3>Equipment</h3><p>Tap worn equipment to inspect its protection and handling.</p><div class="equipment-slots">${['helmet','armor','weapon','shield'].map(slot=>`<div class="slot-wrap"><button class="slot ${filter===slot?'active':''}" ${gear[slot]?`data-inspect="${gear[slot].id}" data-item-source="equipped"`:`data-slot="${slot}"`}><small>${slot==='armor'?'Body armor':slot==='helmet'?'Head armor':slot}</small>${gear[slot]?itemIcon(gear[slot]):'<span class="empty-slot">Empty</span>'}<strong>${gear[slot]?.name||'Unequipped'}</strong></button>${gear[slot]?`<button class="stow-button" data-unequip="${slot}">Stow</button>`:''}</div>`).join('')}</div>
</section>
  <aside class="inventory-panel"><div class="inventory-title"><h3>Company stash</h3><span>${state.inventory.length} items</span></div><div class="filter-tabs">${['all','armor','helmet','weapon','shield'].map(slot=>`<button class="small ${filter===slot?'active':''}" data-slot="${slot}">${slot==='all'?'All':slot[0].toUpperCase()+slot.slice(1)}</button>`).join('')}</div><div class="inventory-grid">${inventory}</div><p class="inventory-help">Select an item to read its details, then choose Equip for ${esc(person.name.split(' ')[0])}. Bows, crossbows and billhooks need both hands. Shields improve defense; they are not body armor.</p><button class="primary" data-action="market">Visit the marketplace</button><div class="brother-notes"><h3>After a battle</h3><p>Rest to heal wounds and repair damaged armor. Medicine and tools are consumed. Fallen brothers stay dead. Victory allows their equipment to be recovered.</p></div></aside></div></section>`;
}

export function levelUpHTML(person, selected=[]) {
  const pending = getLevelUp(person);
  if (!pending) return '';
  const stats = getCompanyStats(person);
  return `<section class="level-up"><p class="level-up-instructions">Choose <strong>3 different attributes</strong> for level ${pending.level}. Each offers a rolled bonus of +1 to +5. You can change your choices before confirming.</p><div class="level-up-count" role="status">${selected.length} / 3 selected</div><div class="level-up-grid">${Object.entries(statLabels).map(([key,label])=>{const chosen=selected.includes(key),gain=pending.rolls[key];return `<button class="level-up-stat ${chosen?'chosen':''}" data-level-stat="${key}" aria-pressed="${chosen}" aria-label="${esc(label)} +${gain}" ${selected.length===3&&!chosen?'disabled':''}><span>${label}</span><strong>${stats[key]}${chosen?` <span aria-hidden="true">→</span> ${stats[key]+gain}`:''}</strong><span class="level-up-gain">+${gain}</span><small>${chosen?'Selected':'Choose'}</small></button>`;}).join('')}</div><p class="level-up-note">These rolls are saved for this level. Closing this panel or reloading will not reroll them.</p><div class="button-row level-up-actions"><button class="primary" data-action="confirm-level-up" ${selected.length!==3?'disabled':''}>Confirm 3 attributes</button><button data-action="close-modal">Choose later</button></div></section>`;
}

export function difficultyHTML(level=1) {
  return `<span class="difficulty" role="img" aria-label="Difficulty ${level} of 3"><span style="width:${Math.min(3,Math.max(1,level))*9.5}px"></span></span>`;
}

export function campSidebarHTML(state, site) {
  const near = !state.destination && Math.hypot(site.x-state.position.x,site.y-state.position.y) <= 35;
  const cleared = site.cleared;
  const roaming=site.kind==='band', pursuing=state.pursuit===site.id;
  const count=cleared?0:site.enemies?.length||0;
  const famedChance=Math.round((Number(site.famedChance)||0)*100);
  return `<div class="location-header hostile-location"><div class="eyebrow">${roaming?'Roaming brigands':cleared?'Location cleared':'Hostile camp'}</div><h2>${esc(site.name)}</h2><img class="settlement-portrait ${roaming?'band-portrait':''}" src="./assets/world/${roaming?'figure_player_beggar':'fortified_outpost_01'}.png" alt=""><p>${roaming&&site.difficulty===0?'<span class="small-band-rating">Small band · light equipment</span>':difficultyHTML(site.difficulty)}</p></div><p class="location-description">${cleared?`The brigands have been driven out. Raiders may return in ${site.respawnHours} hours.`:esc(site.description || 'Brigands have made this place their home.')}</p><div class="scouting-report"><h3>Scouting report</h3><p>${count} ${count===1?'brigand':'brigands'} · ${roaming&&site.difficulty===0?'An easier fight for a rested company':site.difficulty===1?'Thugs with simple weapons':site.difficulty===2?'Armed raiders':'Seasoned and armored raiders'}</p><p>${cleared?'No enemies remain.':esc(site.enemies.map(enemy=>enemy.name).join(', '))}</p>${!roaming&&!cleared&&famedChance?`<p class="famed-chance">Famed item chance: ${famedChance}%</p>`:''}</div><div class="stack">${cleared?'<button disabled>The camp is abandoned</button>':near?`<button class="primary" data-engage="${site.id}">Engage the enemy</button>`:`<button class="primary" data-camp-travel="${site.id}" ${pursuing?'disabled':''}>${pursuing?'Pursuing the band…':roaming?'Pursue this band':'Approach the camp'}</button>`}<button data-action="company">Inspect your company</button><button data-action="camp">Make camp · 6h</button><button data-action="nearest-town">Select nearest settlement</button></div><p class="battle-warning">${roaming?'Earn experience and loot before taking on fortified camps. Rest between fights; even small bands can hurt wounded brothers.':'Fight small roaming bands to train and afford better equipment before an assault.'}</p>`;
}

export function huntContractHTML(state, contract) {
  const site=getCampSites(state).find(c=>c.id===contract.campId), issuer=town(contract.from), cleared=huntComplete(state,contract);
  return `<div class="contract-card"><div class="eyebrow">Contract · Drive off brigands</div><h3>${esc(site?.name || 'Brigand camp')}</h3><p>${cleared?`The camp has fallen. Return to ${issuer.name} for payment.`:'Destroy the brigand camp, then return to your employer.'}</p><div class="contract-reward">${contract.reward} crowns</div>${cleared?`<button class="primary" data-travel="${issuer.id}">Return to ${issuer.name}</button>`:`<button class="primary" data-select-camp="${contract.campId}">Show the camp</button>`}</div>`;
}

export function contractOffersHTML(state, offers) {
  return `<div class="contract-offers bb-contracts">${offers.map(offer=>{
    const site=offer.type==='hunt'?getCampSites(state).find(c=>c.id===offer.campId):null;
    const title=offer.type==='hunt'?'Drive off brigands':offer.type==='supply'?'Deliver supplies':'Deliver a package';
    const details=offer.type==='hunt'?`Brigands are threatening our roads. Destroy their camp at ${site?.name || 'the marked location'}, then return here for your payment.`:offer.type==='supply'?`Take ${offer.quantity} ${offer.goodId} to ${town(offer.to).name}. You must buy the goods yourself.`:`Carry these sealed dispatches safely to ${town(offer.to).name}.`;
    return `<article class="paper-card contract-scroll"><div class="contract-seal">${difficultyHTML(site?.difficulty||1)}</div><div class="eyebrow">${town(offer.from).name}</div><h3>${title}</h3><p>${esc(details)}</p><strong>${offer.reward} crowns on completion</strong><button class="primary" data-accept="${offer.id}" data-origin="${offer.from}">Accept ${offer.type==='hunt'?'brigand contract':offer.type==='supply'?'supply order':'courier job'}</button></article>`;
  }).join('')}</div>`;
}

export function battleResultsHTML(state) {
  const battle=state.battle, victory=battle.status==='victory';
  const fallen=battle.units.filter(u=>u.side==='company'&&!u.alive), survivors=battle.units.filter(u=>u.side==='company'&&u.alive);
  const loot=battle.loot||{};
  return `<section class="battle-results page"><div class="page-heading"><div><div class="eyebrow">AFTER THE BATTLE · ${battle.round} ROUNDS</div><h1>${victory?'Victory!':battle.status==='retreat'?'Retreat':'Defeat'}</h1><p>${victory?'The enemy is defeated. Count the spoils and tend to your company.':'Gather whoever remains and leave the battlefield.'}</p></div></div><div class="result-columns"><section class="result-panel"><h2>Your brothers</h2>${[...survivors,...fallen].map(unit=>`<div class="battle-roster-row ${unit.alive?'':'fallen'}">${portraitHTML(unit,getEquipment(unit),54)}<div><strong>${esc(unit.name)}</strong><small>${unit.alive?`${Math.ceil(unit.hp)} / ${unit.maxHp} hitpoints · ${battle.xp?.[unit.id]||0} experience`:'Killed in battle'}</small></div></div>`).join('')}</section><section class="result-panel"><h2>${victory?'Spoils of war':'Losses'}</h2><div class="loot-resources">${['gold','food','tools','medicine','ammo'].filter(key=>loot[key]).map(key=>`<div><strong>${loot[key]}</strong><span>${{gold:'Crowns',food:'Provisions',tools:'Tools',medicine:'Medicine',ammo:'Ammunition'}[key]}</span></div>`).join('')||'<p>No spoils recovered.</p>'}</div><div class="loot-items">${(loot.items||[]).map(id=>{const lootItem=item(id);return `<button class="loot-item" data-inspect="${id}" data-item-source="loot">${itemIcon(lootItem,'')}<span>${esc(lootItem?.name)}</span></button>`;}).join('')}</div><p class="battle-warning">${fallen.length?`${fallen.length} ${fallen.length===1?'brother has':'brothers have'} fallen. ${victory?"Their equipment is recovered where stash space allows.":"Their worn equipment is lost."}`:'All brothers survived.'}</p><p>Armor damage and wounds carry over to the world map. Make camp with tools and medicine to recover.</p><button class="primary" data-action="finish-battle">${victory?'Take all loot and continue':'Leave the battlefield'}</button></section></div></section>`;
}

export function gameOverHTML(state) {
  return `<section class="page ending-page"><div class="eyebrow">DAY ${state.day} · ${state.renown} RENOWN</div><h1>The company has fallen</h1><p>No brothers survived. This company's campaign is over.</p><div class="button-row"><button class="primary" data-action="new-game">Found a new company</button><button data-action="settings">Save / Menu</button></div></section>`;
}
