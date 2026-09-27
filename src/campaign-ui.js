import { SETTLEMENTS, getItem, getEquipment, getFormation, getCompanyStats, getCampSites, getLevelUp, huntComplete, PERKS, getPerkPoints, getBackground, getTraits, getTownEvent, getTownEconomy, getCaravans, getRoamingBands } from './engine.js';
import { portraitHTML, itemImage } from './portraits.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const item = getItem;
const town = id => SETTLEMENTS.find(entry => entry.id === id);
const itemIcon = (entry, alt=entry?.name) => `<img class="equipment-icon${entry?.rarity === 'famed' ? ' famed-item-icon' : ''}" src="${itemImage(entry)}" alt="${esc(alt)}">`;
export const statLabels = {maxHp:'Hitpoints',maxFatigue:'Maximum Fatigue',resolve:'Resolve',initiative:'Initiative',meleeSkill:'Melee Skill',rangedSkill:'Ranged Skill',meleeDefense:'Melee Defense',rangedDefense:'Ranged Defense'};

export function townServiceHTML(state, quote) {
  const doctor=quote.service==='doctor', verb=doctor?'Heal':'Repair';
  const description=doctor?'Restore missing hitpoints. 1 crown per hitpoint.':'Restore equipped body armor and helmets. 1 crown per 2 durability, rounded up per brother.';
  return `<section class="town-service"><div class="service-summary"><div><span class="supply-symbol ${doctor?'supply-medicine':'supply-tools'}" aria-hidden="true"></span><p>${description}<br>Immediate service. Your ${doctor?'medicine is':'tools are'} not consumed.</p></div><strong>${state.gold} crowns</strong></div><div class="service-roster">${quote.entries.map(entry=>{
    const person=state.party.find(member=>member.id===entry.memberId), needsWork=entry.amount>0, affordable=state.gold>=entry.cost;
    const details=doctor?`<p class="service-condition"><strong>${entry.currentHp} / ${entry.maxHp}</strong> hitpoints${needsWork?` <span>+${entry.amount} to restore</span>`:''}</p>`:entry.repairs.map(repair=>`<div class="service-gear">${itemIcon(item(repair.itemId),'')}<span>${esc(item(repair.itemId)?.name)}<small>${repair.current} / ${repair.max} durability${repair.missing?` · +${repair.missing} to restore`:''}</small></span></div>`).join('')||'<p class="service-condition">No armor or helmet equipped.</p>';
    return `<article class="service-brother">${portraitHTML(person,getEquipment(person),72)}<div class="service-details"><h3>${esc(entry.name)}</h3>${details}</div><div class="service-payment"><button data-town-service="${quote.service}" data-service-member="${esc(entry.memberId)}" aria-label="${verb} ${esc(entry.name)} for ${entry.cost} crowns" ${!needsWork||!affordable?'disabled':''}>${needsWork?`${verb} · ${entry.cost} crowns`:doctor?'Fully healed':'Gear ready'}</button>${needsWork&&!affordable?`<small>Need ${entry.cost-state.gold} more crowns</small>`:''}</div></article>`;
  }).join('')}</div><div class="service-total"><div><strong>${quote.totalAmount?`${quote.totalAmount} ${doctor?'hitpoints':'durability'} to restore`:doctor?'Everyone is fully healed.':'All equipped armor is ready.'}</strong><p>${quote.totalAmount?`Company total: ${quote.totalCost} crowns`:'No charge needed.'}</p>${quote.totalAmount&&state.gold<quote.totalCost?`<small>Need ${quote.totalCost-state.gold} more crowns for everyone. You can ${doctor?'heal':'repair for'} individual brothers above.</small>`:''}</div><button class="primary" data-town-service="${quote.service}" ${!quote.ok?'disabled':''}>${doctor?'Heal everyone':'Repair all equipped'} · ${quote.totalCost} crowns</button></div><p class="service-note">${doctor?'Fallen brothers cannot be revived.':'Weapons and shields do not wear down. Stashed items are not included.'}</p></section>`;
}

export function townEventHTML(state, townId, compact=false) {
  const event=getTownEvent(state,townId);
  if(!event)return '';
  return `<section class="town-event ${compact?'compact':''}"><div class="town-event-heading"><strong>${esc(event.name)}</strong><small>Through day ${event.endDay} · ${event.daysRemaining} ${event.daysRemaining===1?'day':'days'} left</small></div>${compact?'':`<p>${esc(event.description)}</p>`}<p class="town-event-effects">${event.effects.map(esc).join(' · ')}</p></section>`;
}

const caravanStatus = { 'en-route':'On the road', 'under-attack':'Under attack', delivered:'Delivered', lost:'Shipment lost' };
const caravanActive = caravan => caravan.status==='en-route'||caravan.status==='under-attack';
const hoursText = hours => `${Math.max(0,Math.ceil(hours*10)/10)}h`;

export function caravanSidebarHTML(state, caravan) {
  const origin=town(caravan.originId), destination=town(caravan.destinationId), attacker=getRoamingBands(state).find(band=>band.id===caravan.attackerId);
  return `<div class="location-header caravan-location"><div class="eyebrow">Friendly armory caravan</div><h2>${esc(caravan.name)}</h2><img class="caravan-portrait" src="./assets/world/figure_player_trader.png" alt=""><p class="caravan-status ${caravan.status}">${caravanStatus[caravan.status]}</p></div><p class="caravan-route">${esc(origin?.name)} &rarr; ${esc(destination?.name)}</p><p class="location-description">${esc(caravan.description)}</p>${caravanActive(caravan)?`<div class="caravan-report"><p><strong>Arrival in ${hoursText(caravan.etaHours)}</strong></p>${caravan.status==='under-attack'?`<p class="caravan-danger">${esc(attacker?.name||'Brigands')} are closing in. Defeat them within ${hoursText(caravan.attackHoursRemaining)} to save the shipment.</p>`:attacker?`<p class="caravan-danger">${esc(attacker.name)} are targeting this wagon.</p>`:'<p>No band is attacking this caravan.</p>'}</div><div class="stack">${attacker?`<button class="primary" data-caravan-attacker="${attacker.id}">Pursue ${esc(attacker.name)}</button>`:''}<button class="${attacker?'':'primary'}" data-follow-caravan="${caravan.id}">Follow caravan</button><button data-event-town="${caravan.destinationId}">Show destination</button><button data-action="market-news">Market news</button></div><p class="caravan-note">Clear the raiders to keep the shipment moving. Time pauses during battle.</p>`:`<div class="stack"><button data-event-town="${caravan.destinationId}">Show ${esc(destination?.name)} on map</button><button data-action="market-news">Market news</button></div>`}`;
}

export function caravanListHTML(state, compact=false) {
  const caravans=getCaravans(state), visible=compact?caravans.filter(caravanActive):caravans;
  if(!visible.length)return '';
  return `<section class="caravan-list ${compact?'compact':''}"><h3>${compact?'Caravans on the road':'Armory caravans'}</h3>${visible.map(caravan=>`<button class="caravan-listing ${caravan.status}" data-select-caravan="${caravan.id}"><img src="./assets/world/figure_player_trader.png" alt=""><span><strong>${esc(town(caravan.destinationId)?.name)}</strong><small>${caravanStatus[caravan.status]}${caravan.status==='under-attack'?` · ${hoursText(caravan.attackHoursRemaining)} to intervene`:caravanActive(caravan)?` · ${hoursText(caravan.etaHours)} to arrive`:''}</small></span><span aria-hidden="true">&rarr;</span></button>`).join('')}</section>`;
}

export function marketNewsHTML(state) {
  const events=getTownEconomy(state).events;
  return `<section class="market-news"><p class="market-news-intro">Word from the trade roads. City armorer caravans depart every 12 days. Clear raiders to help them arrive; a lost shipment leaves a temporary shortage where equipment sells for more. Prices may change before you reach town.</p>${caravanListHTML(state)}<div class="market-news-grid">${events.map(event=>`<article class="market-news-card"><div class="eyebrow">${esc(event.town.kind)} · ${esc(event.town.name)}</div>${townEventHTML(state,event.town.id)}<button data-event-town="${event.town.id}">Show ${esc(event.town.name)} on map</button></article>`).join('')||'<p>The markets are quiet today. New local events arrive throughout the fortnight.</p>'}</div><p class="market-news-note">Completed courier jobs have a 50% chance to bring one extra piece of equipment to the destination market. Check the chronicle for arrivals.</p></section>`;
}

const bonusText = bonuses => Object.entries(bonuses || {}).map(([key,value])=>`${value>0?'+':''}${value} ${statLabels[key] || key}`).join(' · ');
const traitHTML = trait => `<div class="recruit-trait ${trait.kind}"><strong>${esc(trait.name)}${trait.kind==='tradeoff'?'<small>Trade-off</small>':''}</strong><span>${esc(bonusText(trait.bonuses))}</span></div>`;

function backgroundHTML(person) {
  const background=getBackground(person), traits=getTraits(person);
  return `<section class="brother-background"><h3>${esc(background.name)}</h3><p>${esc(background.description)}</p>${Object.keys(background.bonuses || {}).length?`<p class="background-bonus">${esc(bonusText(background.bonuses))}</p>`:''}<h4>Traits</h4>${traits.length?traits.map(traitHTML).join(''):'<p>No distinctive traits.</p>'}</section>`;
}

export function hiringHTML(state, offers) {
  const labels={maxHp:'Hitpoints',meleeSkill:'Melee skill',rangedSkill:'Ranged skill',meleeDefense:'Melee defense',rangedDefense:'Ranged defense',maxFatigue:'Max. fatigue',initiative:'Initiative'};
  return `<section class="hiring-board"><div class="hiring-summary"><span>${state.party.length} / 12 companions · Day ${state.day}</span><strong>${state.gold} crowns</strong></div><p class="hiring-intro">Choose a companion. Every strength and trade-off is shown; new faces arrive tomorrow. Backgrounds never restrict weapons or perks.</p><div class="recruit-grid">${offers.map(offer=>{const {person,background,traits,stats,cost}=offer,full=state.party.length>=12,poor=state.gold<cost;return `<article class="recruit-card"><div class="recruit-heading">${portraitHTML(person,getEquipment(person),64)}<div><div class="eyebrow">${esc(background.role)}</div><h3>${esc(person.name)}</h3><strong>${esc(background.name)}</strong></div></div><div class="recruit-history"><p>${esc(background.description)}</p><p class="background-bonus">${esc(bonusText(background.bonuses))}</p></div><div class="recruit-traits">${traits.map(traitHTML).join('')}</div><dl class="recruit-stats">${Object.entries(labels).map(([key,label])=>`<div><dt>${label}</dt><dd>${stats[key]}</dd></div>`).join('')}</dl><div class="recruit-hire"><p>${stats.dailyWage} crowns + 1 food / day<br>Arrives without equipment.</p><button class="primary" data-hire-recruit="${esc(offer.id)}" aria-label="Hire ${esc(person.name)} for ${cost} crowns" ${full||poor?'disabled':''}>${full?'Company full':poor?`Need ${cost-state.gold} more crowns`:`Hire · ${cost} crowns`}</button>${full||poor?`<small>Hiring fee: ${cost} crowns</small>`:''}</div></article>`;}).join('')||'<p class="hiring-empty">All available companions have joined you. Come back tomorrow for new recruits.</p>'}</div></section>`;
}

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

export function formationHTML(state, selectedIndex=null) {
  const formation=getFormation(state);
  const selectedId=Number.isInteger(selectedIndex)?formation[selectedIndex]:null;
  const selectedPerson=state.party.find(person=>person.id===selectedId);
  const slot=(index,line,position)=>{
    const member=state.party.find(person=>person.id===formation[index]);
    const selected=index===selectedIndex;
    return `<button class="formation-slot ${member?'is-occupied':'is-empty'} ${selected?'is-selected':''}" data-formation-slot="${index}" aria-pressed="${selected}" aria-label="${line} position ${position}: ${member?esc(member.name):'empty'}${selected?', selected':''}">${member?`${portraitHTML(member,getEquipment(member),44)}<span><strong>${esc(member.name)}</strong><small>${selected?'Selected · tap a destination':`${line} ${position}`}</small></span>`:`<span class="formation-empty"><strong>Empty</strong><small>${line} ${position}</small></span>`}</button>`;
  };
  const line=(front)=>Array.from({length:6},(_,row)=>slot((front?0:6)+row,front?'Front':'Rear',row+1)).join('');
  return `<section class="formation-editor"><p class="formation-help" role="status">${selectedPerson?`${esc(selectedPerson.name)} selected. Tap another position to move or swap; tap the selected position again to cancel.`:'Tap a fighter, then tap another position to move or swap.'}</p><div class="formation-board"><section><h3>Rear line</h3><div class="formation-line">${line(false)}</div></section><section><h3>Front line</h3><div class="formation-line">${line(true)}</div></section><div class="formation-enemy" aria-label="Enemies approach from the right"><span aria-hidden="true">&rarr;</span><strong>Enemy line</strong></div></div><p class="formation-note">Front fighters begin closer to the enemy. Rear fighters start one hex behind them. Formation is locked once battle begins.</p></section>`;
}

function conditionRow(label, current, max, type) {
  return `<div class="condition-row"><span>${label}</span><div class="condition-meter ${type}"><i style="width:${max ? Math.max(0,Math.min(100,current/max*100)) : 0}%"></i><strong>${Math.round(current)} / ${max}</strong></div></div>`;
}

export function companySheetHTML(state, person, filter, inventory) {
  const stats = getCompanyStats(person), gear = getEquipment(person);
  const reserve = { weapon:item(person.reserveEquipment?.weapon), shield:item(person.reserveEquipment?.shield) };
  const accessories = [item(person.accessories?.[0]),item(person.accessories?.[1])];
  const training = stats.trainingPoints ?? person.trainingPoints ?? 0;
  const perkPoints = getPerkPoints(person), learned = PERKS.filter(perk => person.perks?.includes(perk.id));
  const body = stats.bodyArmor ?? gear.armor?.armor ?? 0, head = stats.headArmor ?? gear.helmet?.armor ?? 0;
  const equipmentSlot=(slot,entry,location,label)=>`<div class="slot-wrap"><button class="slot ${filter===slot||(slot==='accessory'&&filter==='accessory')?'active':''}" ${entry?`data-inspect="${entry.id}" data-item-source="equipped" data-item-location="${location}" data-item-slot="${slot}"`:`data-slot="${slot}"`}><small>${label}</small>${entry?itemIcon(entry):'<span class="empty-slot">Empty</span>'}<strong>${entry?.name||'Unequipped'}</strong></button>${entry?`<button class="stow-button" data-unequip="${slot}" data-equipment-location="${location}">Stow</button>`:''}</div>`;
  return `<section class="page company-page"><div class="page-heading"><div><div class="eyebrow">${esc(person.background)} · LEVEL ${stats.level || 1}</div><h1>${esc(person.name)}</h1><p>${state.party.length} / 12 brothers · ${state.renown} renown</p></div><div class="button-row"><button class="${perkPoints?'primary':''}" data-action="perks">Perks${perkPoints?` · ${perkPoints} available`:''}</button><button data-tab="world">Return to the world map</button></div></div>
  <div class="company-layout detailed-company"><article class="character-card"><div class="hero-portrait">${portraitHTML(person,gear,150)}</div>
  <div class="condition-list">${conditionRow('Head',head,gear.helmet?.armor||0,'armor')}${conditionRow('Body',body,gear.armor?.armor||0,'armor')}${conditionRow('Hitpoints',person.hp,stats.maxHp,'health')}</div>
  <div class="experience-bar"><i style="width:${Math.min(100,((stats.xp||0)/Math.max(1,stats.nextLevelXp||100))*100)}%"></i><span>${stats.xp||0} / ${stats.nextLevelXp||100} experience</span></div>
  <p class="gear-note">${person.morale >= 80?'Confident':person.morale>=50?'Steady':person.morale>=25?'Wavering':'Breaking'} morale · ${person.morale}<br>${person.injuries?.length?esc(person.injuries.map(i=>typeof i==='string'?i:i.name).join(', ')):person.hp<stats.maxHp?'Wounded - recovering':'Uninjured'}</p>  <div class="attribute-list">${Object.entries(statLabels).map(([key,label])=>`<div><span>${label}</span><strong>${stats[key] ?? 0}</strong></div>`).join('')}</div>${training?`<div class="training-ready"><p>${training} ${training===1?'level-up':'level-ups'} ready · Choose 3 attributes per level</p><button class="primary" data-action="level-up">Level up ${esc(person.name.split(' ')[0])}</button></div>`:''}${backgroundHTML(person)}<section class="brother-perks"><h3>Perks</h3><p>${perkPoints?`${perkPoints} perk ${perkPoints===1?'point':'points'} available`:'Earn one perk point with every level-up.'}</p><button class="${perkPoints?'primary':''}" data-action="perks">${perkPoints?'Choose a perk':'View perks'}</button>${learned.length?`<div class="learned-perks">${learned.map(perk=>`<button data-view-perk="${perk.id}" title="${esc(perk.description)}"><img src="./assets/perks/${perk.id}.png" alt=""><span>${esc(perk.name)}</span></button>`).join('')}</div>`:''}</section></article>
  <section class="equipment-panel equipment-panel-v11"><h3>Equipment</h3><p>Choose the starting set here. Fighters handle reserve gear and accessories automatically in battle.</p><h4>Protection</h4><div class="equipment-slots">${equipmentSlot('helmet',gear.helmet,'active','Head armor')}${equipmentSlot('armor',gear.armor,'active','Body armor')}</div><div class="equipment-set-heading"><h4>Active set</h4><button class="swap-set-button" data-swap-weapon-set="${person.id}" ${reserve.weapon||reserve.shield?'':'disabled'}>Swap sets</button></div><div class="equipment-slots">${equipmentSlot('weapon',gear.weapon,'active','Active weapon')}${equipmentSlot('shield',gear.shield,'active','Active shield')}</div><h4>Reserve set</h4><div class="equipment-slots">${equipmentSlot('weapon',reserve.weapon,'reserve','Reserve weapon')}${equipmentSlot('shield',reserve.shield,'reserve','Reserve shield')}</div><h4>Accessories</h4><div class="equipment-slots accessory-slots">${equipmentSlot('accessory',accessories[0],'accessory-1','Accessory 1')}${equipmentSlot('accessory',accessories[1],'accessory-2','Accessory 2')}</div><p class="equipment-auto-note">In battle, fighters spend a turn swapping when the reserve weapon fits the target better. They spend a turn using carried remedies when wounded or exhausted; a pocket dagger is a last resort.</p>
</section>
  <aside class="inventory-panel"><div class="inventory-title"><h3>Company stash</h3><span>${state.inventory.length} items</span></div><div class="filter-tabs">${['all','armor','helmet','weapon','shield','accessory'].map(slot=>`<button class="small ${filter===slot?'active':''}" data-slot="${slot}">${slot==='all'?'All':slot[0].toUpperCase()+slot.slice(1)}</button>`).join('')}</div><div class="inventory-grid">${inventory}</div><p class="inventory-help">Inspect gear to choose its exact slot. Weapons and shields can start active or in reserve. Remedies and pocket daggers fit either accessory slot.</p><button class="primary" data-action="market">Visit the marketplace</button><div class="brother-notes"><h3>After a battle</h3><p>Rest to heal wounds and repair damaged armor. Medicine and tools are consumed. Fallen brothers stay dead. Victory allows their equipment to be recovered.</p></div></aside></div></section>`;
}

export function levelUpHTML(person, selected=[]) {
  const pending = getLevelUp(person);
  if (!pending) return '';
  const stats = getCompanyStats(person);
  return `<section class="level-up"><p class="level-up-instructions">Choose <strong>3 different attributes</strong> for level ${pending.level}. Each offers a rolled bonus of +1 to +5. You can change your choices before confirming.</p><div class="level-up-count" role="status">${selected.length} / 3 selected</div><div class="level-up-grid">${Object.entries(statLabels).map(([key,label])=>{const chosen=selected.includes(key),gain=pending.rolls[key],after=getCompanyStats({...person,attributes:{...person.attributes,[key]:(person.attributes?.[key]??0)+gain}})[key];return `<button class="level-up-stat ${chosen?'chosen':''}" data-level-stat="${key}" aria-pressed="${chosen}" aria-label="${esc(label)} +${gain}" ${selected.length===3&&!chosen?'disabled':''}><span>${label}</span><strong>${stats[key]}${chosen?` <span aria-hidden="true">→</span> ${after}`:''}</strong><span class="level-up-gain">+${gain}</span><small>${chosen?'Selected':'Choose'}</small></button>`;}).join('')}</div><p class="level-up-note">These rolls are saved for this level. Perks apply after the attribute increase. Closing this panel or reloading will not reroll them.</p><div class="button-row level-up-actions"><button class="primary" data-action="confirm-level-up" ${selected.length!==3?'disabled':''}>Confirm 3 attributes</button><button data-action="close-modal">Choose later</button></div></section>`;
}

export function perksHTML(person, selectedId=null) {
  const points=getPerkPoints(person), level=person.level??1;
  const learned=new Set(person.perks??[]), selected=PERKS.find(perk=>perk.id===selectedId);
  const canLearn=selected&&!learned.has(selected.id)&&level>=selected.minLevel&&points>0;
  return `<section class="perk-picker"><p class="perk-intro"><strong>${points} perk ${points===1?'point':'points'} available</strong> · Level ${level}<br>Gain one point every level after the first. Each perk costs one point and can be learned once. Unspent points stay with this brother.</p><div class="perk-grid">${PERKS.map(perk=>{const owned=learned.has(perk.id),locked=level<perk.minLevel;return `<button class="perk-card ${owned?'learned':''} ${locked?'locked':''} ${perk.id===selectedId?'chosen':''}" data-perk="${perk.id}" aria-pressed="${perk.id===selectedId}" aria-label="${esc(perk.name)}${owned?', learned':locked?`, unlocks at level ${perk.minLevel}`:''}"><img src="./assets/perks/${perk.id}.png" alt=""><span><strong>${esc(perk.name)}</strong><small>${owned?'Learned':locked?`Requires level ${perk.minLevel}`:'1 perk point'}</small></span><p>${esc(perk.description)}</p></button>`;}).join('')}</div><div class="perk-actions"><p role="status">${selected?`${esc(selected.name)}: ${learned.has(selected.id)?'Already learned.':level<selected.minLevel?`Unlocks at level ${selected.minLevel}.`:points?'Ready to learn.':'No perk points available.'}`:'Select a perk to review, then learn it.'}</p><div class="button-row"><button class="primary" data-action="learn-perk" ${canLearn?'':'disabled'}>${selected?`Learn ${esc(selected.name)}`:'Learn selected perk'}</button><button data-action="close-modal">Done</button></div></div></section>`;
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
  return `<section class="battle-results page"><div class="page-heading"><div><div class="eyebrow">AFTER THE BATTLE · ${battle.round} ROUNDS</div><h1>${victory?'Victory!':battle.status==='retreat'?'Retreat':'Defeat'}</h1><p>${victory?'The enemy is defeated. Count the spoils and tend to your company.':'Gather whoever remains and leave the battlefield.'}</p></div></div><div class="result-columns"><section class="result-panel"><h2>Your brothers</h2>${[...survivors,...fallen].map(unit=>`<div class="battle-roster-row ${unit.alive?'':'fallen'}">${portraitHTML(unit,getEquipment(unit),54)}<div><strong>${esc(unit.name)}</strong><small>${unit.alive?`${Math.ceil(unit.hp)} / ${unit.maxHp} hitpoints · ${battle.xp?.[unit.id]||0} experience`:'Killed in battle'}</small></div></div>`).join('')}</section><section class="result-panel"><h2>${victory?'Spoils of war':'Losses'}</h2><div class="loot-resources">${['gold','food','tools','medicine','ammo'].filter(key=>loot[key]).map(key=>`<div><strong>${loot[key]}</strong><span>${{gold:'Crowns',food:'Provisions',tools:'Tools',medicine:'Medicine',ammo:'Ammunition'}[key]}</span></div>`).join('')||'<p>No spoils recovered.</p>'}</div><div class="loot-items">${(loot.items||[]).map((id,index)=>{const lootItem=item(id),condition=loot.itemConditions?.[index],damaged=(lootItem?.slot==='armor'||lootItem?.slot==='helmet')&&Number.isFinite(condition)&&condition<lootItem.armor;return `<button class="loot-item" data-inspect="${id}" data-item-source="loot" data-loot-index="${index}">${itemIcon(lootItem,'')}<span>${esc(lootItem?.name)}</span>${damaged?`<small class="loot-condition">${condition} / ${lootItem.armor} durability</small>`:''}</button>`;}).join('')}</div><p class="battle-warning">${fallen.length?`${fallen.length} ${fallen.length===1?'brother has':'brothers have'} fallen. ${victory?"Their equipment is recovered where stash space allows.":"Their worn equipment is lost."}`:'All brothers survived.'}</p><p>Armor damage and wounds carry over to the world map. Make camp with tools and medicine to recover.</p><button class="primary" data-action="finish-battle">${victory?'Take all loot and continue':'Leave the battlefield'}</button></section></div></section>`;
}

export function gameOverHTML(state) {
  return `<section class="page ending-page"><div class="eyebrow">DAY ${state.day} · ${state.renown} RENOWN</div><h1>The company has fallen</h1><p>No brothers survived. This company's campaign is over.</p><div class="button-row"><button class="primary" data-action="new-game">Found a new company</button><button data-action="settings">Save / Menu</button></div></section>`;
}
