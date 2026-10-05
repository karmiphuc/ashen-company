import { bindBattleCamera, zoomBattleCamera, resetBattleCamera } from './battle-camera.js';
import { blacksmithPanelHTML, blacksmithJournalHTML, blacksmithSummonsHTML, forgeConfirmationHTML, forgeSuccessHTML } from './blacksmith-ui.js';
import { getLegendaryBlacksmith, getBlacksmithQuestEncounters, checkBlacksmithDiscovery, acknowledgeBlacksmithSummons, acceptBlacksmithQuest, turnInBlacksmithQuest, claimBlacksmithReward, getReforgeQuote, reforgeItem } from './engine.js';
import { combatBetaConfigHTML, setSimultaneousBetaEnabled } from './combat-config.js';
import { simultaneousEvents } from './simultaneous-combat.js';
import { queueSimultaneousFrame, stopSimultaneousWorker } from './simultaneous-runner.js';
import { isWorldFogEnabled, setWorldFogEnabled, worldPointVisible, worldPointExplored } from './world-fog.js';
import { crisisBannerHTML, settlementCrisisHTML, crisisJournalHTML } from './crisis-ui.js';
import { settlementScenery } from './settlement-scenery.js';
import { equipmentCatalogHTML } from './equipment-catalog.js';
import { REGIONS, regionAt, regionalTownArt, regionalTownSpecialty } from './geography.js';
import {hireRetinueMember,upgradeScout,getTimeOfDay,getCargoCapacity,getCompanyTravelMultiplier,buyCompanyCart,mergeOwnedNamedBonuses,MAX_COMPANY_SIZE,MAX_BATTLE_SIZE,getBattleRoster,getReserveSlots,setCompanyAutomation,applyCompanyAutomation,MAX_SAVE_FILE_BYTES,GOODS,SETTLEMENTS,createGame,travelTo,tick,townAt,acceptContract,buyItem,buyAll,getPurchaseQuote,activateMapTarget,sellItem,equipItem,unequipItem,swapWeaponSet,recruit,getRecruitOffers,camp,forage,getItem,getEquipment,getFormation,moveFormation,terrainAt,validateSave,getMarket,getTownServiceQuote,useTownService,buyFood,buyGood,sellGood,getContractOffers,getCompanyStats,getCampSites,startBattle,advanceBattle,resolveBattle,retreatBattle,finishBattle,trainAttributes,getLevelUp,getPerkPoints,learnPerk,buySupplies,getRoamingBands,getFactionPatrols,getCaravans,getEncounterSites,pursueBand,getDailyFood,shieldMaximum,claimMountReward,hireBountyHunter,getLootKeepQuote,getSettlementAccess,getUndeadEncounters,claimAshenReward} from './engine.js';
import {portraitSVG,itemImage} from './portraits.js';
import {setCombatSettings} from './engine.js';
import {mapHTML,mountMap,updateMap,focusMap,zoomMap,selectMapTown,selectMapCamp} from './map.js';
import {battleHTML,tacticsHTML,battleActionDuration,parseBattleSpeed,updateSimultaneousBattleView} from './battle-view.js';
import {setBattleTactic,SETTLEMENT_TYPES} from './engine.js';
import {getItemDetails,getMainItemComparison} from './item-details.js';
import {createGameAudio} from './audio.js';
import {companyHintHTML,companyAutomationHTML,resourceHTML,townFacilitiesHTML,townStatusHTML,townActionsHTML,inventoryProtectionText,formationHTML,companySheetHTML,hiringHTML,townEventHTML,mountRewardHTML,marketNewsHTML,caravanSidebarHTML,townServiceHTML,levelUpHTML,perksHTML,campSidebarHTML,huntContractHTML,contractOffersHTML,battleResultsHTML,gameOverHTML,difficultyHTML,discoveryNewsHTML,retinueHTML} from './campaign-ui.js';
const SAVE_KEY='ashen-company-save-v1',$=s=>document.querySelector(s);
let companyHintButton=null,companyHintPinned=false;
function closeCompanyHint(){if(companyHintButton){companyHintButton.setAttribute('aria-expanded','false');document.getElementById(companyHintButton.getAttribute('aria-describedby'))?.setAttribute('hidden','');}companyHintButton=null;companyHintPinned=false;}
function openCompanyHint(button,pinned=false){
  if(companyHintButton!==button)closeCompanyHint();companyHintButton=button;companyHintPinned=pinned;
  const tip=document.getElementById(button.getAttribute('aria-describedby'));if(!tip)return;
  tip.hidden=false;button.setAttribute('aria-expanded','true');
  const r=button.getBoundingClientRect(),t=tip.getBoundingClientRect(),edge=8;
  tip.style.left=`${Math.max(edge,Math.min(r.left,innerWidth-t.width-edge))}px`;
  tip.style.top=`${Math.max(edge,r.bottom+t.height+edge<innerHeight?r.bottom+6:r.top-t.height-6)}px`;
}
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const b=e.target.closest('[data-company-hint]');if(b&&!companyHintPinned)openCompanyHint(b);});
document.addEventListener('pointerout',e=>{if(!companyHintPinned&&companyHintButton&&!companyHintButton.closest('.company-hint').contains(e.relatedTarget))closeCompanyHint();});
document.addEventListener('focusin',e=>{const b=e.target.closest('[data-company-hint]');if(b)openCompanyHint(b);});
document.addEventListener('focusout',e=>{if(!companyHintPinned&&companyHintButton&&!companyHintButton.closest('.company-hint').contains(e.relatedTarget))closeCompanyHint();});
document.addEventListener('click',e=>{if(companyHintButton&&!e.target.closest('.company-hint'))closeCompanyHint();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&companyHintButton){e.preventDefault();closeCompanyHint();}});
window.addEventListener('resize',closeCompanyHint);
document.addEventListener('scroll',e=>{const tip=companyHintButton&&document.getElementById(companyHintButton.getAttribute('aria-describedby'));if(tip&&!tip.contains(e.target))closeCompanyHint();},true);
const BATTLE_SPEED_KEY='ashen-company-battle-speed-v1';
const gameAudio=createGameAudio();
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const item=getItem,town=id=>SETTLEMENTS.find(t=>t.id===id),good=id=>GOODS.find(g=>g.id===id);
const specialties={oakwatch:'Timber & grain',greyhaven:'Wool market',ironford:'Iron & affordable steel',thornwall:'High demand for supplies',redmere:'Salt trade',highpass:'Mountain trading post',saltwick:'Cheap salt',barrowfield:'Grain & wool',pinecross:'Timber market',dunridge:'Mountain iron',eastmere:'Salt & wool',stonebridge:'Iron & steel',southwatch:'Frontier timber',wheatmere:'Grain & wool',blackfen:'Marsh salt',farhold:'Frontier supplies'};
const townArt=Object.fromEntries(SETTLEMENTS.map(settlement=>[settlement.id,regionalTownArt(settlement)]));
for (const settlement of SETTLEMENTS) { townArt[settlement.id] ??= regionalTownArt(settlement); specialties[settlement.id] ??= regionalTownSpecialty(settlement); }
let forgeSelection={donor:null,recipient:null,filter:'all',search:''},forgeQuote=null,blacksmithSummonsOpen=false;
let simultaneousSoundBattle=null,simultaneousSoundCursor=0,simultaneousResolveToken=0;
let lootKeepSelection=[],chosenCamp=null,battleCameraTarget='company',battleSpeed=0,battleElapsed=0,battleResultAt=0,trainingSelection=[],perkSelection=null,formationSelection=null,warnedHunters='';
let defaultBattleSpeed=4;
try{const stored=localStorage.getItem(BATTLE_SPEED_KEY),saved=parseBattleSpeed(stored,4);if(saved!==0)defaultBattleSpeed=saved;if(stored==='3')localStorage.setItem(BATTLE_SPEED_KEY,'4');}catch{}
let state=createGame(7391),tab='world',selected='captain',chosenTown='oakwatch',speed=0,slotFilter='all',marketTab='gear',toastTimer,saveProblem=false,corruptSave=null,unreadSave=false,saveError="";
try{const raw=localStorage.getItem(SAVE_KEY);if(raw){try{state=validateSave(JSON.parse(raw));chosenTown=townAt(state)?.id||'oakwatch';}catch(error){unreadSave=true;corruptSave=raw;saveError=error.message;}}}catch{saveProblem=true;}
if(state.battle)tab='battle';
let catalogCollection='all';
let marketReturnScroll=null;
let marketSlot='all',marketSort='name',marketAffordable=false,marketRare=false;
function equipmentCatalog(){showModal('Equipment collections',equipmentCatalogHTML(catalogCollection),'Base game & expansions');}
chosenCamp=state.pursuit||(['caravan','rescue','deserters','bounty'].includes(state.destinationAction?.type)?state.destinationAction.id:null);
function save(){if(unreadSave)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));saveProblem=false;}catch{if(!saveProblem)toast('Autosave unavailable. Export a save before closing.');saveProblem=true;}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000);}
function person(){return state.party.find(p=>p.id===selected)||state.party[0];}
function levelUp(reset=true){const p=person();if(!p||!getLevelUp(p))return;if(reset)trainingSelection=[];showModal(`Level up ${esc(p.name)}`,levelUpHTML(p,trainingSelection),'CHARACTER ADVANCEMENT');$('#modal').scrollTop=0;}
function perksModal(reset=true){const p=person();if(!p||state.battle)return;if(reset)perkSelection=null;const scroll=$('#modal').scrollTop;showModal(`Perks for ${esc(p.name)}`,perksHTML(p,perkSelection),'CHARACTER ADVANCEMENT');$('#modal').scrollTop=reset?0:scroll;}
function formationModal(reset=true){if(state.battle)return;if(reset)formationSelection=null;const scroll=$('#modal').scrollTop;showModal('Battle formation',formationHTML(state,formationSelection),'COMPANY TACTICS');$('#modal').scrollTop=reset?0:scroll;}
function icon(i,extra=''){return `<img class="equipment-icon ${['famed','named'].includes(i?.rarity)?'famed-item-icon ':''}${extra}" src="${itemImage(i)}" alt="${esc(i?.name)}" loading="lazy">`;}
function resources(){const light=getTimeOfDay(state.hour),phase=state.battle?(state.battle.lighting??'day'):light.phase;document.body.dataset.timeOfDay=phase;let indicator=document.getElementById('time-of-day-indicator');if(!indicator){indicator=document.createElement('div');indicator.id='time-of-day-indicator';indicator.setAttribute('role','status');document.querySelector('.main-nav').after(indicator);}indicator.textContent=phase==='night'?'☾ Night · Travel −20% · Ranged −40 · Melee −10':{day:'☀ Daylight',evening:'◐ Evening',dawn:'◐ Dawn'}[phase];$('#resources').innerHTML=resourceHTML(state,speed);const news=$('#discovery-news');if(news)news.innerHTML=discoveryNewsHTML(state);}
function syncAudio(){gameAudio.sync({battleId:state.battle?.id??null,active:!!state.battle&&(state.battle.status==='active'||!!battleResultAt),playing:!!battleSpeed&&!$('#modal').open,hidden:document.hidden});}
function audioControlsHTML(){const audio=gameAudio.getPreferences();return `<div class="divider"></div><h3>Battle audio</h3><p>Fantasy music and combat sounds. The world map stays quiet. Audio starts after a tap and pauses with the battle or when you leave the app.</p><div class="button-row"><button data-audio-toggle="music" aria-pressed="${audio.music}">Battle music: ${audio.music?'On':'Off'}</button><button data-audio-toggle="effects" aria-pressed="${audio.effects}">Combat sounds: ${audio.effects?'On':'Off'}</button></div><p>Your sound settings stay on this device. The offline audio download is about 1.2 MB.</p>`;}
function enterBattleView(){resetBattleCamera();battleCameraTarget='company';lootKeepSelection=[];speed=0;battleSpeed=defaultBattleSpeed;battleElapsed=0;battleResultAt=0;tab='battle';if($('#modal').open)$('#modal').close();save();render();}
function handleBlockade(result){
 if(!result.blockedTown)return;
 speed=0;chosenTown=result.blockedTown;chosenCamp=null;tab='world';$('#modal').close();
}
function run(action,...args){stopSimultaneousWorker();const hadBattle=!!state.battle,result=action(state,...args);handleBlockade(result);toast(result.message);if(!hadBattle&&state.battle){enterBattleView();return result;}save();render();return result;}
function retinueTransaction(action,...args){
 const scroll=$('#modal').scrollTop,card=document.activeElement?.closest('[data-retinue-card]')?.dataset.retinueCard;
 const result=run(action,...args);
 showModal('Retinue & rare finds',`<p class="retinue-feedback" role="status">${esc(result.message)}</p>${retinueHTML(state)}`);
 $('#modal').scrollTop=scroll;
 if(card)$('#modal').querySelector(`[data-retinue-card="${card}"] h3`)?.focus({preventScroll:true});
}
function showModal(title,body,kicker='ASHEN COMPANY'){stopSimultaneousWorker();simultaneousResolveToken++;document.querySelector('.simultaneous-battle')?.classList.add('sim-paused');closeCompanyHint();speed=0;battleSpeed=0;updateSpeed();resources();$('#modal-content').innerHTML=`<div class="modal-header"><div><div class="eyebrow">${kicker}</div><h2>${title}</h2></div><button class="close-button" data-action="close-modal" aria-label="Close dialog">Close</button></div><div class="modal-body">${body}</div>`;if(!$('#modal').open)$('#modal').showModal();syncAudio();}
function captureScrollState(){
 const elements=[];
 for(const element of document.body.querySelectorAll('*')){
  const style=getComputedStyle(element),vertical=['auto','scroll'].includes(style.overflowY)&&element.scrollHeight>element.clientHeight,horizontal=['auto','scroll'].includes(style.overflowX)&&element.scrollWidth>element.clientWidth;
  if(!vertical&&!horizontal)continue;
  const path=[];let node=element;
  while(node!==document.body){const parent=node.parentElement;if(!parent){path.length=0;break;}path.unshift(Array.prototype.indexOf.call(parent.children,node));node=parent;}
  elements.push({path,top:element.scrollTop,left:element.scrollLeft});
 }
 return {pageX:window.scrollX,pageY:window.scrollY,elements};
}
function restoreScrollState(snapshot){
 const restore=()=>{window.scrollTo(snapshot.pageX,snapshot.pageY);for(const {path,top,left} of snapshot.elements){const element=path.reduce((parent,index)=>parent?.children[index],document.body);if(element){element.scrollLeft=left;element.scrollTop=top;}}};
 restore();requestAnimationFrame(restore);
}
function marketTransaction(action,...args){const active=document.activeElement,tradeAttribute=active?.closest(".market-item")?["data-buy","data-sell"].find(attr=>active.hasAttribute(attr)):null,tradeId=tradeAttribute?active.getAttribute(tradeAttribute):null;const scroll=marketReturnScroll||captureScrollState();marketReturnScroll=null;const result=run(action,...args);market();restoreScrollState(scroll);if(tradeAttribute){const next=[...document.querySelectorAll(`[${tradeAttribute}]`)].find(button=>button.getAttribute(tradeAttribute)===tradeId&&!button.disabled);(next||document.querySelector("[data-market-filter=slot]"))?.focus({preventScroll:true});}return result;}
function returnToMarket(){const scroll=marketReturnScroll;marketReturnScroll=null;market();if(scroll)restoreScrollState(scroll);}
function contractHTML(){
 if(['hunt','assault','rescue','deserters','bounty'].includes(state.contract?.type))return huntContractHTML(state,state.contract);
 if(!state.contract)return `<div class="contract-card"><h3>Find your next contract</h3><p>Earn crowns delivering goods or driving brigands from their camps.</p><button class="primary" data-action="contracts">View the notice board</button></div>`;
 const c=state.contract,t=town(c.to),supply=c.type==='supply';return `<div class="contract-card"><div class="eyebrow">${supply?'Supply contract':'Sealed dispatches'}</div><h3>${supply?`${c.quantity} ${good(c.goodId).name}`:'Delivery'} to ${t.name}</h3><p>${supply?`Cargo: ${state.cargo[c.goodId]||0} / ${c.quantity}. Buy goods at a market, then deliver.`:'Your dispatches are packed. Reach the destination to collect payment.'}</p><div class="contract-reward">${c.reward} crowns · ${c.renown||1} renown</div><button class="primary" data-travel="${t.id}">Travel to ${t.name}</button></div>`;
}
function sidebarHTML(){
 if(chosenCamp){const encounter=getEncounterSites(state).find(c=>c.id===chosenCamp)||getCaravans(state).find(c=>c.id===chosenCamp);if(encounter && encounter.kind!=='blacksmith' && !(getCampSites(state).some(c=>c.id===encounter.id)?worldPointExplored(state,encounter):worldPointVisible(state,encounter)))chosenCamp=null;}
 if(chosenCamp){const caravan=getCaravans(state).find(c=>c.id===chosenCamp);if(caravan)return caravanSidebarHTML(state,caravan)+(state.contract?contractHTML():'');const site=getEncounterSites(state).find(c=>c.id===chosenCamp);if(site)return campSidebarHTML(state,site)+(state.contract?contractHTML():'');}
 const t=town(chosenTown)||townAt(state)||SETTLEMENTS[0],here=townAt(state)?.id===t.id;
 const access=getSettlementAccess(state,t.id);
 const distance=Math.round(Math.hypot(t.x-state.position.x,t.y-state.position.y)/(55*getCompanyTravelMultiplier(state))*10)/10;
 return `<div class="location-header"><div class="eyebrow">${here?'Current settlement':'Selected destination'}</div><h2>${t.name}</h2><img class="settlement-portrait" src="./assets/world/${townArt[t.id]}.png" alt="${t.name}"><p class="town-specialty">${t.kind} · ${specialties[t.id]}</p><p class="location-description">${esc(SETTLEMENT_TYPES[t.kind].summary)}</p></div>${settlementCrisisHTML(state,t.id)}${access.servicesAvailable?townStatusHTML(state,t.id):''}<button class="market-news-open" data-action="market-news">Market news</button><label class="destination-label" for="destinations">Destinations</label><select id="destinations">${REGIONS.map(region=>`<optgroup label="${region.name}">${SETTLEMENTS.filter(s=>regionAt(s.x,s.y).id===region.id).map(s=>`<option value="${s.id}" ${s.id===t.id?'selected':''}>${s.name}${townAt(state)?.id===s.id?' (here)':''}${getSettlementAccess(state,s.id).status==='open'?'':` · ${getSettlementAccess(state,s.id).status}`}</option>`).join('')}</optgroup>`).join('')}<optgroup label="Brigand camps">${getCampSites(state).map(c=>`<option value="camp:${c.id}">${c.name}${c.cleared?" (cleared)":""}</option>`).join('')}</optgroup><optgroup label="Odran’s side quest">${getBlacksmithQuestEncounters(state).map(e=>`<option value="blacksmith:${e.id}">${esc(e.name)} (${e.enemies.length} guards)</option>`).join('')}</optgroup><optgroup label="Ashen Winter">${getUndeadEncounters(state).map(e=>`<option value="crisis:${e.id}">${esc(e.name)} (${e.enemies.length} undead)</option>`).join('')}</optgroup><optgroup label="Armory caravans">${getCaravans(state).filter(c=>c.status==='en-route'||c.status==='under-attack').map(c=>`<option value="caravan:${c.id}">${esc(town(c.destinationId)?.name)} caravan${c.status==='under-attack'?' (under attack)':''}</option>`).join('')}</optgroup></select><div class="stack sidebar-actions">${here&&access.servicesAvailable?`<button class="primary" data-action="town">Enter settlement</button>${townActionsHTML(state,t.id)}`:`<p class="travel-estimate">About ${distance} hours · terrain may slow travel</p><button class="primary" data-travel="${t.id}">Travel here</button>`}<div class="two-buttons"><button data-action="retinue">Retinue &amp; rare finds</button><button data-action="camp">Camp · 6h</button><button data-action="forage">Forage · 4h</button></div></div>${state.contract?contractHTML():''}<div class="upkeep">Daily upkeep: ${state.party.reduce((n,p)=>n+(getCompanyStats(p).dailyWage||5),0)} crowns + ${getDailyFood(state)} food${getCompanyTravelMultiplier(state)!==1?` · Travel speed ${getCompanyTravelMultiplier(state)>1?'+':''}${Math.round((getCompanyTravelMultiplier(state)-1)*100)}%`:``}</div>`;
}
function stripHTML(){
 const locked=!!state.battle||state.gameOver;
 return `<section class="company-strip" aria-label="Your company"><div class="strip-intro"><h3>Your company</h3><p>${state.party.length} / ${MAX_COMPANY_SIZE} brothers · ${getBattleRoster(state).length} fielded</p></div><div class="strip-roster">${state.party.map(p=>{
   const unit=state.battle?.units.find(u=>u.id===p.id),hp=unit?.hp??p.hp,maxHp=unit?.maxHp??getCompanyStats(p).maxHp;
   return `<button class="mini-person ${tab==='company'&&p.id===selected?'active':''}" data-person="${p.id}" ${locked?'disabled':''} aria-label="${locked?'':'Equip '}${esc(p.name)}">${portraitSVG(p,getEquipment(p),80)}<span class="mini-name">${esc(p.name.split(' ')[0])}${getReserveSlots(state).includes(p.id)?' <small>Reserve</small>':''}</span><span class="hp-bar"><span style="width:${Math.max(0,hp/maxHp*100)}%"></span></span></button>`;
 }).join('')}<button class="strip-recruit" data-action="recruit" aria-label="Recruit a companion" ${locked?'disabled':''}>+</button></div><button class="secondary small" data-tab="company" ${locked?'disabled':''}>Equipment</button><button class="small formation-open" data-action="formation" ${locked?'disabled':''}>Battle formation</button></section>`;
}
function worldHTML(){return `<div id="crisis-banner">${crisisBannerHTML(state)}</div><div id="discovery-news">${discoveryNewsHTML(state)}</div><section class="world-layout"><div class="map-wrap">${mapHTML()}<div class="map-caption"><span>${regionAt(state.position.x,state.position.y).name}</span><small>Gold highways · local roads · borders mark regions</small></div><div class="map-zoom"><button data-action="zoom-in" aria-label="Zoom in">+</button><button data-action="zoom-out" aria-label="Zoom out">−</button><button data-action="center" aria-label="Center on company">Company</button></div><div class="map-controls"><button data-speed="0" aria-label="Pause travel">Pause</button><button data-speed="1" aria-label="Normal travel speed">1×</button><button data-speed="3" aria-label="Fast travel speed">3×</button><span id="march-status">${state.destination?'On the march':'Company at rest'}</span></div></div><aside class="world-sidebar">${sidebarHTML()}</aside></section>`;}
function inventoryHTML(){
 const counts=new Map();state.inventory.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
 const owned=[...counts].filter(([id])=>{const entry=item(id);return slotFilter==='all'||entry.slot===slotFilter||(slotFilter==='accessory'&&entry.pocketWeapon);});
 return owned.map(([id,count])=>{const i=item(id),condition=state.inventoryCondition?.[state.inventory.indexOf(id)],armor=['armor','helmet','attachment','shield'].includes(i.slot),maximum=i.slot==='shield'?shieldMaximum(id):i.armor;return `<button class="inventory-item" data-inspect="${id}" data-item-source="stash">${icon(i)}<strong>${i.name}${count>1?` ×${count}`:''}</strong><span>${armor?inventoryProtectionText(i,condition,maximum):itemStatText(i)}</span></button>`;}).join('')||'<p class="empty-state">No spare items in this slot. Buy gear at a settlement, or select another slot.</p>';
}
function companyHTML(){const p=person();if(!p)return gameOverHTML(state);selected=p.id;return companyAutomationHTML(state,true)+companySheetHTML(state,p,slotFilter,inventoryHTML());}
function journalHTML(){return `<section class="page"><div class="page-heading"><div><div class="eyebrow">DAY ${state.day}</div><h1>The company chronicle</h1></div><button data-tab="world">Return to the map</button></div><div class="journal-layout"><div>${blacksmithJournalHTML(state)}${crisisJournalHTML(state)}${[...state.log].reverse().map(s=>`<div class="journal-entry">${esc(s)}</div>`).join('')}</div><aside class="paper-card"><h2>A living on the road</h2><ol><li>Take a courier job for a guaranteed payment.</li><li>Buy local goods cheaply and sell where demand is high.</li><li>Supply orders need purchased cargo; check the required quantity.</li><li>Buy food before leaving. Each person eats once per day; equipped mounts need additional rations.</li><li>Equip your companions by tapping their portraits.</li></ol><button data-action="market-news">Market news</button><h3>Trade routes</h3><p>Oakwatch timber sells well at Highpass. Saltwick salt is prized at Thornwall. Ironford has cheaper iron and equipment.</p><h3>Life as a mercenary</h3><p>Raiders can pursue and attack you outside settlements, including while camping or foraging. Watch their map labels and reach a settlement to escape. Hunt small roaming bands to earn experience and loot; larger warbands guard the frontier. Armory raiders physically close on wagons, and clearing them protects the delivery. Defeated bands are replaced after two days. When your brothers are ready, accept a brigand contract and assault its camp. Choose Offense to advance, Defense to hold the line, or Thin them out to concentrate attacks. Advance in Formation moves the company forward one hex at a time without chasing. Shield Wall puts shielded melee fighters and skirmishers ahead of archers and unshielded two-handers. You can change tactics before or during combat. Battles play automatically. Armored fighters form the front line; archers hold their distance. Fighters recover fatigue and find routes around allies. Armor protects head and body separately; fatigue and morale affect the fighting. Afterward, collect loot, rest with tools and medicine, and return for payment.</p><p>Brothers gain experience. Choose three different attributes at each level-up, with saved random bonuses of +1 to +5. Talents add +1 (★), +2 (★★), or guarantee +5 (★★★), capped at +5. Fallen brothers stay dead.</p><button data-action="settings">Save & offline settings</button></aside></div></section>`;}
function setBattleLogVisible(visible){const view=$('.battle-view'),button=$('[data-battle-log-toggle]');if(!view||!button)return;view.classList.toggle('battle-log-collapsed',!visible);$('#battle-event-sidebar').hidden=!visible;button.setAttribute('aria-expanded',String(visible));button.textContent=visible?'Hide log':'Show log';}
function focusBattleCamera(target){
 const surface=$('.battle-scroll');if(!surface||!state.battle)return;battleCameraTarget=target;
 const units=state.battle.units.filter(u=>u.alive&&!u.escaped&&(target==='active'?u.id===state.battle.activeId:target==='company'?u.side==='company'&&!u.ally:u.side==='enemy'));
 const pawns=units.map(u=>surface.querySelector(`[data-unit-id="${u.id}"]`)).filter(Boolean);if(!pawns.length)return;
 const bounds=surface.getBoundingClientRect(),rects=pawns.map(p=>p.getBoundingClientRect());surface.scrollLeft+=rects.reduce((n,r)=>n+r.left+r.width/2,0)/rects.length-bounds.left-surface.clientWidth/2;surface.scrollTop+=rects.reduce((n,r)=>n+r.top+r.height/2,0)/rects.length-bounds.top-surface.clientHeight/2;
}
window.addEventListener('resize',()=>requestAnimationFrame(()=>{if(state.battle)focusBattleCamera(battleCameraTarget);}));
function render(animateEvent=false){closeCompanyHint();
 const findCompany=$('#find-company-button');findCompany.disabled=state.gameOver;findCompany.setAttribute('aria-label',state.battle?'Center battlefield on your company':'Center world map on your company');
 syncAudio();if(animateEvent)gameAudio.playEvent(state.battle?.lastEvent,battleActionDuration(battleSpeed,state.battle?.lastEvent),{cinematic:battleSpeed==='cinematic'});
 resources();
 if(state.battle)tab='battle';
 const previousBattleScroll=$('.battle-scroll'),scroll=previousBattleScroll?.scrollLeft||0,scrollTop=previousBattleScroll?.scrollTop||0;
 const sidebarOpen=$('[data-battle-log-toggle]')?.getAttribute('aria-expanded')!=='false';
 const battleLogOpen=$('.battle-log-details')?.open??matchMedia('(min-width:721px)').matches,battleHelpOpen=$('.battle-morale-help')?.open??false;
 const focused=document.activeElement,battleFocus=focused?.closest('.battle-view')?['data-battle-speed','data-battle-camera','data-battle-zoom','data-battle-log-toggle','data-tactic','data-battle-tactic'].find(attr=>focused.hasAttribute(attr)):null;
 const battleFocusSelector=battleFocus?`[${battleFocus}="${focused.getAttribute(battleFocus)}"]`:focused?.matches('.battle-log-details>summary')?'.battle-log-details>summary':focused?.matches('.battle-morale-help>summary')?'.battle-morale-help>summary':null;
 const rosterScroll=$('#company-roster .strip-roster')?.scrollLeft??0;
 $('#main').innerHTML=state.battle?(state.battle.status==='active'||battleResultAt?battleHTML(state.battle,battleSpeed,animateEvent):battleResultsHTML(state,lootKeepSelection)):state.gameOver?gameOverHTML(state):tab==='world'?worldHTML():tab==='company'?companyHTML():tab==='town'?townHTML():journalHTML();
 $('#company-roster').innerHTML=stripHTML();
 $('#company-roster .strip-roster').scrollLeft=rosterScroll;
 if($('.battle-scroll')){const surface=$('.battle-scroll');bindBattleCamera(surface);setBattleLogVisible(sidebarOpen);surface.scrollLeft=scroll;surface.scrollTop=scrollTop;if(!previousBattleScroll)focusBattleCamera('company');$('.battle-log-details').open=battleLogOpen;if($('.battle-morale-help'))$('.battle-morale-help').open=battleHelpOpen;if(battleFocusSelector)$(battleFocusSelector)?.focus({preventScroll:true});}
 document.querySelectorAll('.nav-tabs [data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.disabled=!!state.battle;});
 if(tab==='world'&&!state.battle&&!state.gameOver){mountMap(state,chooseTown,startTravel,chooseCamp,activateTarget);if(chosenCamp)selectMapCamp(chosenCamp);else selectMapTown(town(chosenTown));}updateSpeed();
}
function chooseTown(t){chosenCamp=null;chosenTown=t.id;selectMapTown(t);const side=$('.world-sidebar');if(side)side.innerHTML=sidebarHTML();}
function chooseCamp(site){chosenCamp=site.id;selectMapCamp(site.id);const side=$('.world-sidebar');if(side)side.innerHTML=sidebarHTML();}
function townHTML(){
 const t=townAt(state);if(t&&!getSettlementAccess(state,t.id).servicesAvailable){chosenTown=t.id;tab='world';return worldHTML();}if(!t){tab='world';return worldHTML();}
 return `<section class="page settlement-page"><div class="page-heading"><div><div class="eyebrow">${esc(t.kind)} · ${esc(regionAt(t.x,t.y).name)}</div><h1>${esc(t.name)}</h1><span class="settlement-specialty">${esc(specialties[t.id])}</span></div><button data-tab="world">Leave settlement</button></div><div class="settlement-local-status">${townStatusHTML(state,t.id)}<button class="small" data-action="market-news">Market news</button></div><div class="settlement-hub"><div class="settlement-place"><button class="settlement-info" data-action="town-info" aria-label="About ${esc(t.name)}: settlement details"><img src="./assets/world/${townArt[t.id]}.png" alt="" draggable="false"><span>${esc(t.name)} <small>Town details</small></span></button><div class="settlement-outskirts" aria-hidden="true">${settlementScenery(state,t,{caravans:getCaravans(state)}).filter(s=>['blacksmith','armorsmith','industry'].includes(s.slot)).map(s=>`<img src="./assets/world/${s.art}.png" alt="" title="${esc(s.label)}">`).join('')}</div></div><nav class="settlement-services" aria-label="Settlement services">${townActionsHTML(state,t.id,true)}<button class="settlement-service" data-action="camp" aria-label="Make camp for 6 hours" title="Rest for 6 hours. Tools repair gear and medicine helps wounded brothers recover."><img src="./assets/world/figure_player_party.png" alt=""><strong>Camp <small>6h</small></strong></button></nav></div>${state.contract?`<details class="settlement-contract"><summary>Current contract · ${esc(state.contract.name||'Company work')}</summary>${contractHTML()}</details>`:''}</section>`;
}
function engage(siteId){const site=getEncounterSites(state).find(c=>c.id===siteId);if(!site)return;if(site.kind==='band'){beginBattle(siteId);return;}showModal(site.name,`<div class="encounter-summary"><img src="./assets/world/fortified_outpost_01.png" alt=""><div>${difficultyHTML(site.difficulty)}<h3>${site.kind.startsWith('undead-')?'Undead ahead':'Brigands ahead'}</h3><p>${site.enemies?.length||site.enemyCount||'?'} ${site.enemies.length===1?'enemy':'enemies'} at this location. Your ${getBattleRoster(state).length} fielded brothers will fight automatically with their current equipment.</p></div></div><p>Check armor, hitpoints, ammunition and formation. Death is permanent. Retreat remains possible during the battle.</p>${tacticsHTML(state.tactic)}<div class="button-row"><button class="primary" data-fight="${site.id}">To arms!</button><button data-action="formation">Adjust formation</button><button data-action="close-modal">Leave them be</button></div>`,'ENCOUNTER');}
function beginBattle(siteId){const result=startBattle(state,siteId);toast(result.message);if(!result.ok)return;enterBattleView();}
function activateTarget({type,id}){const result=activateMapTarget(state,type,id);toast(result.message);if(!result.ok)return;if(state.battle){enterBattleView();return;}chosenCamp=type==='town'?null:id;if(type==='town')chosenTown=id;handleBlockade(result);tab=result.openTown?'town':'world';speed=state.destination?1:0;save();render();}
function buyAllButton(kind,id=''){const quote=getPurchaseQuote(state,kind,id);return `<button data-buy-all="${kind}" data-buy-id="${id}" ${quote.quantity?'':'disabled'}>Buy all (${quote.quantity}) · ${quote.cost} crowns</button>`;}
function suppliesHTML(market){return '<div class="supply-shop">'+(market.supplies||[]).map(row=>`<article class="provision-card"><span class="supply-symbol supply-${row.kind}"></span><h3>${esc(row.name)}</h3><p>Stores ${row.owned} · Stock ${row.stock}</p><button data-supply="${row.kind}" data-quantity="5" ${row.stock<5||state.gold<row.buyPrice*5?'disabled':''}>Buy 5 · ${row.buyPrice*5} crowns</button>${buyAllButton('supplies',row.kind)}</article>`).join('')+(market.supplies.some(row=>row.stock>0)?'':'<p>No supplies in stock today.</p>')+'</div><details class="market-background"><summary>Auto-buy & preparation</summary>'+companyAutomationHTML(state)+'</details>';}
function gearMarketHTML(market){
 const visible=(row,selling)=>{const i=item(row.itemId);return (selling?row.owned:row.stock)>0&&(marketSlot==='all'||i.slot===marketSlot)&&(!marketRare||['famed','named'].includes(i.rarity))&&(selling||!marketAffordable||row.buyPrice<=state.gold);};
 const rows=selling=>market.equipment.filter(row=>visible(row,selling)).sort((a,b)=>marketSort==='name'?item(a.itemId).name.localeCompare(item(b.itemId).name):(marketSort==='price-high'?-1:1)*((selling?a.sellPrice:a.buyPrice)-(selling?b.sellPrice:b.buyPrice))||item(a.itemId).name.localeCompare(item(b.itemId).name));
 const tile=(row,selling)=>{const i=item(row.itemId),price=selling?row.sellPrice:row.buyPrice,rare=['famed','named'].includes(i.rarity);return `<article class="market-item ${rare?'market-item-rare':''}"><button class="market-item-inspect" data-inspect="${i.id}" data-item-source="${selling?'sell':'buy'}" aria-label="Inspect ${esc(i.name)}"><span class="stock-count" aria-label="${selling?'Owned':'In stock'}: ${selling?row.owned:row.stock}">×${selling?row.owned:row.stock}</span>${icon(i)}<strong>${esc(i.name)}</strong><small>${rare?`${i.rarity.toUpperCase()} · `:''}${itemStatText(i)}</small></button><button class="market-item-trade" ${selling?`data-sell="${i.id}"`:`data-buy="${i.id}"`} aria-label="${selling?'Sell':'Buy'} one ${esc(i.name)} for ${price} crowns" ${!selling&&state.gold<price?'disabled':''}>${selling?'Sell':'Buy'} · ${price}</button></article>`;};
 const stash=rows(true),stock=rows(false);
 return `<div class="market-filters" aria-label="Filter equipment"><label>Category<select data-market-filter="slot">${['all','weapon','armor','helmet','shield','attachment','accessory','mount'].map(slot=>`<option value="${slot}" ${marketSlot===slot?'selected':''}>${slot==='all'?'All gear':slot[0].toUpperCase()+slot.slice(1)}</option>`).join('')}</select></label><label>Sort<select data-market-filter="sort">${[['name','Name'],['price-low','Price ↑'],['price-high','Price ↓']].map(([value,label])=>`<option value="${value}" ${marketSort===value?'selected':''}>${label}</option>`).join('')}</select></label><label class="market-check"><input type="checkbox" data-market-filter="affordable" ${marketAffordable?'checked':''}>Affordable</label><label class="market-check"><input type="checkbox" data-market-filter="rare" ${marketRare?'checked':''}>Named / famed</label></div><div class="market-ledger"><section class="market-company-stock"><div class="inventory-title"><h3>Stash · ${stash.length}</h3><button class="small" data-action="go-company">Equip</button></div><div class="shop-stash">${stash.map(row=>tile(row,true)).join('')||'<p>No matching spare gear.</p>'}</div></section><section class="market-trader-stock"><div class="inventory-title"><h3>Trader · ${stock.length}</h3><small>Tap art to inspect</small></div><div class="trader-grid">${stock.map(row=>tile(row,false)).join('')||'<p>No matching stock. Try another filter.</p>'}</div></section></div>`;
}
function itemStatText(i){return i.slot==='mount'?`+${Math.round(i.travelBonus*100)}% travel · +${i.foodUpkeep} food/day`:i.slot==='accessory'?i.consumable==='heal'?`Restores ${i.heal||0} hitpoints`:i.consumable==='recover'?`Recovers ${i.recover||0} fatigue`:'Carried accessory':i.slot==='shield'?`+${i.defense||0} defense`:i.slot==='weapon'?`${i.damageMin||0}–${i.damageMax||0} damage${i.range>1?` · ${i.range} ${i.ranged?'range':'reach'}`:''}${i.armorPiercing?` · ${Math.round(i.armorPiercing*100)}% pierce`:''}${i.reloadTurns?' · reload':''}`:`${i.armor} durability · ${i.fatigue} fatigue`;}
function inspectItem(id,source,lootIndex,location='active',equippedSlot){
 const i=item(id);if(!i)return;
 const p=person(),marketSource=source==='buy'||source==='sell';
 const offer=marketSource&&townAt(state)?getMarket(state).equipment.find(row=>row.itemId===id):null;
 const condition=source==='equipped'&&i.throwing?p?.throwingAmmo?.[location==='reserve'?'reserve':'active']:source==='equipped'&&i.slot==='shield'?p?.armorDurability[location==='reserve'?'reserveShield':'shield']:source==='equipped'&&location==='attachment-2'?p?.armorDurability.attachment2:source==='equipped'&&location==='active'?(i.slot==='armor'?p?.armorDurability.body:i.slot==='helmet'?p?.armorDurability.head:i.slot==='attachment'?p?.armorDurability.attachment:undefined):source==='buy'?offer?.condition:source==='loot'&&Number.isInteger(lootIndex)?state.battle?.loot?.itemConditions?.[lootIndex]:source==='stash'||source==='sell'?state.inventoryCondition?.[state.inventory.indexOf(id)]:undefined;
 const details=getItemDetails(i,condition),wornComparison=getMainItemComparison(i,p,condition);
 const wornHeader=wornComparison?`<p class="item-equipped-comparison">Compared with ${esc(p.name)}’s main <strong>${esc(wornComparison.equipped.name)}</strong> <small><span class="item-stat-better">▲ Better</span> · <span class="item-stat-worse">▼ Worse</span></small></p>`:'';
 const statRows=wornComparison?.stats??details.stats;
 const statValue=row=>row.parts?row.parts.map(part=>part.change&&part.change!=='equal'?`<span class="item-stat-${part.change}" title="${esc(`${part.change==='better'?'Better':'Worse'} than equipped: ${part.previous} (${part.delta>0?'+':''}${part.delta})`)}">${esc(part.text)}<span class="item-stat-arrow" aria-label="${part.change}">${part.change==='better'?'▲':'▼'}</span></span>`:esc(part.text)).join(''):esc(row.value);
 let actions='',availability='';
 if(source==='forge'){actions='<button data-action="legendary-blacksmith">Back to forge</button>';}
 if(source==='catalog'){availability='Available through rotating regional armories and frontier spoils.';actions='<button data-action="equipment-catalog">Back to collections</button>';}
 if(source==='buy'&&offer){availability=`${offer.stock} in stock · ${state.gold} crowns available`;actions=`<button class="primary" data-buy="${id}" ${!offer.stock||state.gold<offer.buyPrice?'disabled':''}>Buy for ${offer.buyPrice} crowns</button>${buyAllButton('equipment',id)}`;}
 else if(source==='sell'&&offer){availability=`${offer.owned} in company stash`;actions=`<button class="primary" data-sell="${id}" ${!offer.owned?'disabled':''}>Sell for ${offer.sellPrice} crowns</button>`;}
 else if(source==='stash'&&p){const first=esc(p.name.split(' ')[0]),activeAction=['armor','helmet','attachment','weapon','shield','mount'].includes(i.slot)?`<button class="primary" data-equip="${id}" data-equip-destination="active">${i.slot==='mount'?'Equip mount':i.slot==='attachment'?'Equip attachment 1':'Equip active'}</button>`:'',reserveAction=(i.slot==='weapon'||i.slot==='shield')?`<button data-equip="${id}" data-equip-destination="reserve">Equip reserve</button>`:'',accessoryActions=(i.slot==='accessory'||i.pocketWeapon)?`<button data-equip="${id}" data-equip-destination="accessory-1">Accessory 1</button><button data-equip="${id}" data-equip-destination="accessory-2">Accessory 2</button>`:'';availability=`Choose where ${first} will carry this item.`;actions=activeAction+(i.slot==='attachment'&&p.perks?.includes('layered-armor')?`<button data-equip="${id}" data-equip-destination="attachment-2">Equip attachment 2</button>`:'')+reserveAction+accessoryActions;}
 else if(source==='equipped'&&p){const locationName={active:'Active equipment','attachment-2':'Attachment slot 2',reserve:'Reserve set','accessory-1':'Accessory slot 1','accessory-2':'Accessory slot 2'}[location]||'Equipment';availability=`${locationName} on ${p.name}`;actions=`<button data-unequip="${equippedSlot||i.slot}" data-equipment-location="${location}">Stow in company stash</button>`;}
 const famed=['famed','named'].includes(details.rarity);
 const kind={armor:'BODY ARMOR',helmet:'HEAD ARMOR',attachment:'ARMOR ATTACHMENT',weapon:'WEAPON',shield:'SHIELD',accessory:'ACCESSORY',mount:'RARE MOUNT'}[i.slot];
 const comparison=famed?`<section class="item-famed-comparison"><span class="item-rarity">${details.rarity==='named'?'NAMED':'FAMED'}</span><div><strong>Improved over ${esc(details.baseName)}</strong><dl>${details.bonuses.map(row=>`<div><dt>${esc(row.label)}</dt><dd>${esc(row.value)}</dd></div>`).join('')}</dl></div></section>`:'';
 showModal(i.name,`<article class="item-detail ${famed?'item-detail-famed':''}"><div class="item-detail-intro">${icon(i)}<div><p class="item-flavor">${esc(details.description)}</p><p>${esc(details.role)}</p></div></div>${comparison}${wornHeader}<dl class="item-stat-list">${statRows.map(row=>`<div><dt>${esc(row.label)}</dt><dd>${statValue(row)}</dd></div>`).join('')}</dl><div class="item-mechanics">${details.notes.map(note=>`<p>${esc(note)}</p>`).join('')}</div>${availability?`<p class="item-availability">${esc(availability)}</p>`:''}<div class="button-row item-detail-actions">${actions}<button data-action="${source==='forge'?'legendary-blacksmith':marketSource?'market':'close-modal'}">${marketSource?'Back to marketplace':'Back'}</button></div></article>`,famed?`${details.rarity==='named'?'NAMED':'FAMED'} · ${kind}`:kind);
 $('#modal').scrollTop=0;$('#modal .close-button').focus();
}
function updateSpeed(notify=false){const hunters=[...getRoamingBands(state),...getUndeadEncounters(state)].filter(b=>b.behavior==='hunting-company'),key=hunters.map(b=>b.id).sort().join(',');if(notify){if(key&&key!==warnedHunters){toast(`${hunters[0].name} are pursuing you. Reach a town or prepare to fight.`);if(speed>1)speed=1;}warnedHunters=key;}document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===speed));const s=$('#march-status');if(s){s.classList.toggle('is-threat',hunters.length>0);s.textContent=hunters.length?`${hunters[0].name} pursuing you${speed?'':' · Paused'}`:state.pursuit?(speed?'Pursuing brigands':'Pursuit paused'):state.destination?(speed?'On the march':'Travel paused'):speed?'Waiting - time passes':'Company at rest';}}
function market(){applyCompanyAutomation(state);save();const market=getMarket(state);if(!market){toast('Travel to a settlement to trade.');return;}const t=market.town;let content;
 if(marketTab==='gear')content=gearMarketHTML(market);
 else if(marketTab==='supplies')content=suppliesHTML(market);
 else if(marketTab==='trade')content=`<p class="market-tip">Cargo ${Object.values(state.cargo).reduce((s,n)=>s+n,0)} / ${getCargoCapacity(state)}.</p><div class="goods-list">${market.goods.filter(r=>r.stock>0||r.owned>0).map(r=>`<article class="trade-row"><div><h3>${r.name}</h3><details class="trade-description"><summary>Details</summary><p>${r.description}</p></details><small>Stock: ${r.stock} · In cargo: ${r.owned}</small>${r.brokerLocal?`<span class="broker-local">Local resale ${companyHintHTML(`broker-${r.goodId}`,'Local resale','Broker gives +50% on cargo brought from another settlement. Goods bought here sell at the normal price until carried elsewhere.')}</span>`:''}</div><div class="trade-actions">${r.stock>0?`<button data-buy-good="${r.goodId}" ${r.stock===0||state.gold<r.buyPrice?'disabled':''}>Buy ${r.buyPrice}</button>${buyAllButton('goods',r.goodId)}`:''}<button data-sell-good="${r.goodId}" ${!r.owned?'disabled':''}>Sell ${r.sellPrice}</button></div></article>`).join('')}</div><details class="market-background"><summary>Suggested trade routes</summary><p>Oakwatch timber → Highpass · Saltwick salt → Thornwall · Ironford iron → Saltwick.</p></details>`;
 else content=market.food.stock>0?`<div class="provision-card"><h3>Food for the road</h3><p>${state.food} provisions in the company, enough for ${Math.floor(state.food/(getDailyFood(state)||1))} days.<br>Daily consumption: ${getDailyFood(state)} including equipped mounts. Merchant stock: ${market.food.stock}.</p><div class="button-row"><button class="primary" data-food="5" ${market.food.stock<5||state.gold<market.food.buyPrice*5?'disabled':''}>Buy 5 · ${market.food.buyPrice*5} crowns</button><button data-food="15" ${market.food.stock<15||state.gold<market.food.buyPrice*15?'disabled':''}>Buy 15 · ${market.food.buyPrice*15} crowns</button>${buyAllButton('food')}</div><p>Or forage for four hours to gather supplies without spending crowns.</p><button data-action="forage">Forage · 4 hours</button></div>`:'<p>No provisions in stock today.</p><button data-action="forage">Forage · 4 hours</button>';
 showModal('Marketplace',`<div class="market-workspace"><div class="market-summary"><span>${specialties[t.id]} · Rotation day ${market.armory.nextRestockDay}</span><strong>${state.gold} crowns</strong></div><div class="market-readiness" aria-label="Company stores"><span>Food · ${Math.floor(state.food/(getDailyFood(state)||1))} days</span><span>Tools · ${state.supplies.tools}</span><span>Medicine · ${state.supplies.medicine}</span><span>Ammo · ${state.supplies.ammo}</span></div><div class="market-browser"><div class="market-tabs" role="group" aria-label="Market category">${[['gear','Equipment'],['trade','Trade goods'],['food','Provisions'],['supplies','Supplies']].map(([id,label])=>`<button data-market-tab="${id}" aria-pressed="${marketTab===id}" class="${marketTab===id?'active':''}">${label}</button>`).join('')}</div><div class="market-content">${townEventHTML(state,t.id,true)}${content}<details class="market-background"><summary>Local workshops & market information</summary>${townFacilitiesHTML(state,t.id)}<p>${esc(market.armory.summary)}</p><div class="button-row"><button data-action="market-news">Market news</button><button data-action="equipment-catalog">Equipment collections</button></div></details></div></div></div>`,t.name);

}
function contracts(){const t=townAt(state);if(t&&!getSettlementAccess(state,t.id).servicesAvailable){toast(getSettlementAccess(state,t.id).reason);return;}if(!t){toast('Reach a settlement to find work.');return;}if(state.contract){showModal('Your current contract',contractHTML(),t.name);return;}showModal('Available contracts',contractOffersHTML(state,getContractOffers(state,t.id)),t.name);}
function recruitModal(){const here=townAt(state);if(here&&!getSettlementAccess(state,here.id).servicesAvailable){toast(getSettlementAccess(state,here.id).reason);return;}const settlement=townAt(state);if(!settlement){toast('Reach a settlement to hire companions.');return;}showModal('Companions for hire',hiringHTML(state,getRecruitOffers(state)),settlement.name);}
function townService(service){const quote=getTownServiceQuote(state,service);if(!quote.townId||state.battle||state.gameOver){toast(quote.message);return;}showModal(service==='doctor'?'Doctor':'Smithy',townServiceHTML(state,quote),town(quote.townId).name);}
function settings(){showModal('Save & offline play',`<p>Your company is saved on this device. Export a backup before travelling.</p><div class="save-note">On iPad: open in Safari online, Share → Add to Home Screen, then launch the icon. Wait for <strong>Offline ready</strong>, and test an airplane-mode relaunch before your flight.</div><div class="button-row"><button class="primary" data-action="export">Export save</button><button data-action="import">Import save</button>${corruptSave!==null?'<button data-action="export-recovery">Export damaged save</button>':''}</div><input id="import-file" class="hidden" type="file" accept=".json,application/json"><p>${saveProblem?'Autosave unavailable. Export your progress.':unreadSave?`A save could not be loaded (${esc(saveError)}). The original is preserved for export.`:'Autosave active. Saves do not sync between devices.'}</p>${companyAutomationHTML(state)}<div class="divider"></div><h3>World map</h3><label><input type="checkbox" data-world-fog ${isWorldFogEnabled()?'checked':''}> Fog of war</label><p>Wide scouting view around your band. Explored ground stays dimmed; distant parties are hidden. Uncheck to reveal the whole map for debugging.</p><div class="divider"></div>${combatBetaConfigHTML()}<h3>Battle speed</h3><p>Default speed when a new battle starts. Active battles pause when you reload or return from another app.</p><div class="button-row"><button data-battle-default-speed="1" aria-pressed="${defaultBattleSpeed===1}">Normal · 1×</button><button data-battle-default-speed="4" aria-pressed="${defaultBattleSpeed===4}">Fast · 4×</button><button data-battle-default-speed="cinematic" aria-pressed="${defaultBattleSpeed==='cinematic'}" title="4× movement, slow-motion attacks and skills">Cinematic</button></div>${audioControlsHTML()}<div class="divider"></div><div class="button-row"><button class="danger" data-action="new-game">Start a new company</button></div><p class="credits">Artwork: Battle Brothers / Legends contributors. Personal noncommercial prototype. <a href="https://github.com/karmiphuc/ashen-company/blob/main/docs/ASSET-CREDITS.md" target="_blank" rel="noopener">Asset credits</a>.<br>Version 0.52.0 · Ashen Winter.</p>`);}
function exportSave(recovery=false){const preserved=(recovery||unreadSave)&&corruptSave!==null;const text=preserved?corruptSave:JSON.stringify(state,null,2);const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=preserved?'ashen-company-damaged-save.json':`ashen-company-day-${state.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Save exported. Keep the file as a backup.');}
function startTravel(x,y){const r=travelTo(state,x,y);toast(r.message);if(r.ok){speed=1;tab='world';$('#modal').close();save();render();}}
document.addEventListener('change',event=>{const input=event.target;if(input.hasAttribute('data-world-fog')){setWorldFogEnabled(input.checked);updateMap(state);render();return;}if(input.dataset.marketFilter){const kind=input.dataset.marketFilter;if(kind==='slot')marketSlot=input.value;else if(kind==='sort')marketSort=input.value;else if(kind==='affordable')marketAffordable=input.checked;else if(kind==='rare')marketRare=input.checked;market();document.querySelector(`[data-market-filter="${kind}"]`)?.focus({preventScroll:true});return;}if(input.dataset.companyAutomation){const r=setCompanyAutomation(state,input.dataset.companyAutomation,input.checked);toast(r.message);save();render();if($('#modal').open){if($('#modal [data-market-tab]')){marketTab='supplies';market();}else settings();$('#modal [data-company-automation="'+input.dataset.companyAutomation+'"]')?.focus();}else $('[data-company-automation="'+input.dataset.companyAutomation+'"]')?.focus();return;}if(input.dataset.keepLoot===undefined)return;const index=Number(input.dataset.keepLoot);lootKeepSelection=input.checked?[...new Set([...lootKeepSelection,index])]:lootKeepSelection.filter(value=>value!==index);const scroll=captureScrollState();render();restoreScrollState(scroll);document.querySelector(`[data-keep-loot="${index}"]`)?.focus({preventScroll:true});});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-company-hint')){if(companyHintButton===b&&companyHintPinned)closeCompanyHint();else openCompanyHint(b,true);return;}
 if(b.dataset.battleDefaultSpeed!==undefined){const value=parseBattleSpeed(b.dataset.battleDefaultSpeed,4);if(value!==0){defaultBattleSpeed=value;try{localStorage.setItem(BATTLE_SPEED_KEY,String(value));}catch{}settings();}return;}
 if(b.dataset.audioToggle){gameAudio.toggle(b.dataset.audioToggle);settings();return;}
 if(b.dataset.selectCaravan){const c=getCaravans(state).find(c=>c.id===b.dataset.selectCaravan);if(c){chosenCamp=c.id;tab='world';$('#modal').close();speed=0;render();focusMap(c);}return;}
 if(b.dataset.questTravel){$('#modal').close();activateTarget({type:b.dataset.questTravel,id:b.dataset.targetId});return;}
 if(b.dataset.followCaravan){activateTarget({type:'caravan',id:b.dataset.followCaravan});return;}
 if(b.dataset.caravanAttacker){const r=pursueBand(state,b.dataset.caravanAttacker);toast(r.message);if(r.ok){if(state.battle)enterBattleView();else{chosenCamp=b.dataset.caravanAttacker;speed=1;tab='world';$('#modal').close();save();render();}}return;}
 if(b.dataset.eventTown){const t=town(b.dataset.eventTown);if(t&&!state.battle){chosenTown=t.id;chosenCamp=null;tab='world';$('#modal').close();render();focusMap(t);}return;}
 if(b.dataset.inspect){if(['buy','sell'].includes(b.dataset.itemSource)&&$('#modal .market-tabs'))marketReturnScroll=captureScrollState();inspectItem(b.dataset.inspect,b.dataset.itemSource||'loot',b.dataset.lootIndex===undefined?undefined:Number(b.dataset.lootIndex),b.dataset.itemLocation||'active',b.dataset.itemSlot);return;}
 if(b.dataset.formationSlot!==undefined){const index=Number(b.dataset.formationSlot),formation=[...getFormation(state),...getReserveSlots(state)];if(!Number.isInteger(index)||index<0||index>=formation.length)return;if(formationSelection===null){if(!formation[index]){toast('Select a fighter before choosing an empty position.');return;}formationSelection=index;formationModal(false);$(`[data-formation-slot="${index}"]`)?.focus();return;}if(formationSelection===index){formationSelection=null;formationModal(false);$(`[data-formation-slot="${index}"]`)?.focus();return;}const result=moveFormation(state,formationSelection,index);toast(result.message);if(result.ok){formationSelection=null;save();render();}formationModal(false);$(`[data-formation-slot="${index}"]`)?.focus();return;}
 if(b.dataset.tactic){stopSimultaneousWorker();const r=setBattleTactic(state,b.dataset.tactic);if(r.ok){save();const controls=b.closest('.battle-tactics');if(controls){controls.outerHTML=tacticsHTML(state.battle.tactic);$(`[data-tactic="${state.battle.tactic}"]`)?.focus({preventScroll:true});};}else toast(r.message);return;}
 if(b.hasAttribute('data-battle-log-toggle')){setBattleLogVisible(b.getAttribute('aria-expanded')!=='true');return;}
 if(b.dataset.battleZoom){zoomBattleCamera(b.dataset.battleZoom);return;}
 if(b.dataset.battleCamera){focusBattleCamera(b.dataset.battleCamera);return;}
 if(b.dataset.battleSpeed!==undefined){stopSimultaneousWorker();simultaneousResolveToken++;battleSpeed=parseBattleSpeed(b.dataset.battleSpeed);battleElapsed=0;render();return;}
 if(b.dataset.fight){beginBattle(b.dataset.fight);return;}
 if(b.dataset.engage){engage(b.dataset.engage);return;}
 if(b.dataset.selectCamp){const site=getEncounterSites(state).find(c=>c.id===b.dataset.selectCamp);if(site){chosenCamp=site.id;tab='world';$('#modal').close();render();focusMap(site);}return;}
 if(b.dataset.joinPatrol){activateTarget({type:'patrol',id:b.dataset.joinPatrol});return;}
 if(b.dataset.campTravel){const site=getEncounterSites(state).find(c=>c.id===b.dataset.campTravel);if(site){chosenCamp=site.id;if(site.kind==='band'){const hadBattle=!!state.battle,r=pursueBand(state,site.id);toast(r.message);if(r.ok){if(!hadBattle&&state.battle)enterBattleView();else{speed=state.destination?1:0;tab='world';save();render();}}}else startTravel(site.x,site.y);}return;}
 if(b.dataset.levelStat){const key=b.dataset.levelStat;trainingSelection=trainingSelection.includes(key)?trainingSelection.filter(value=>value!==key):trainingSelection.length<3?[...trainingSelection,key]:trainingSelection;levelUp(false);$('[data-level-stat="'+key+'"]')?.focus();return;}
 if(b.dataset.perk){perkSelection=b.dataset.perk;perksModal(false);return;}
 if(b.dataset.viewPerk){perkSelection=b.dataset.viewPerk;perksModal(false);$('#modal').scrollTop=0;return;}
 if(b.dataset.townService){run(useTownService,b.dataset.townService,b.dataset.serviceMember??null);townService(b.dataset.townService);return;}
 if(b.dataset.hireRetinue){retinueTransaction(hireRetinueMember,b.dataset.hireRetinue);return;}
 if(b.dataset.hireRecruit){run(recruit,b.dataset.hireRecruit);recruitModal();return;}
 if(b.dataset.supply){marketTransaction(buySupplies,b.dataset.supply,Number(b.dataset.quantity)||5);return;}
 if(b.dataset.tab){if(state.battle)return;tab=b.dataset.tab;speed=0;render();return;}
 if(b.dataset.person){selected=b.dataset.person;tab='company';speed=0;render();return;}
 if(b.dataset.slot){slotFilter=b.dataset.slot;render();return;}
 if(b.dataset.speed!==undefined){speed=Number(b.dataset.speed);updateSpeed();resources();return;}
 if(b.dataset.travel){$('#modal').close();activateTarget({type:'town',id:b.dataset.travel});return;}
 if(b.dataset.marketTab){marketTab=b.dataset.marketTab;market();return;}
 if(b.dataset.swapWeaponSet){run(swapWeaponSet,b.dataset.swapWeaponSet);return;}
 if(b.dataset.equip){run(equipItem,selected,b.dataset.equip,b.dataset.equipDestination||'active');$('#modal').close();return;}
 if(b.dataset.unequip){run(unequipItem,selected,b.dataset.unequip,b.dataset.equipmentLocation||'active');$('#modal').close();return;}
 if(b.dataset.buyAll){marketTransaction(buyAll,b.dataset.buyAll,b.dataset.buyId);return;}
 if(b.dataset.buy){marketTransaction(buyItem,b.dataset.buy);return;}
 if(b.dataset.sell){marketTransaction(sellItem,b.dataset.sell);return;}
 if(b.dataset.food){marketTransaction(buyFood,Number(b.dataset.food));return;}
 if(b.dataset.buyGood){marketTransaction(buyGood,b.dataset.buyGood);return;}
 if(b.dataset.sellGood){marketTransaction(sellGood,b.dataset.sellGood);return;}
 if(b.dataset.accept){run(acceptContract,b.dataset.origin,b.dataset.accept);$('#modal').close();return;}
 switch(b.dataset.action){
 case 'claim-ashen-reward':run(claimAshenReward);return;
 case 'claim-mount-reward':{const r=claimMountReward(state,b.dataset.claimMountReward);toast(r.message);if(r.ok){save();render();}break;}
 case 'inspect-terrain':battleSpeed=0;showModal('Battlefield terrain',`<p>${esc(b.dataset.detail)}</p><p>Climbing costs 1 extra movement point, up to 2 per tile. Each height level gives the higher fighter +10 percentage points to hit and +10% damage when attacking downhill.</p><button data-action="close-modal">Return to battle</button>`);break;
 case 'doctor':run(useTownService,'doctor');break;case 'smithy':run(useTownService,'smithy');break;
 case 'market-news':showModal('Market news',marketNewsHTML(state),`Day ${state.day} · Across the Marches`);break;
 case 'formation':formationModal();break;
 case 'level-up':levelUp();break;
 case 'perks':perksModal();break;
 case 'learn-perk':{const r=learnPerk(state,person()?.id,perkSelection);toast(r.message);if(r.ok){save();render();perksModal();}break;}
 case 'confirm-level-up':{const r=trainAttributes(state,person()?.id,trainingSelection);toast(r.message);if(r.ok){save();render();if(getLevelUp(person()))levelUp();else if(getPerkPoints(person()))perksModal();else $('#modal').close();}break;}
 case 'town-info':{const t=townAt(state);if(t)showModal(t.name,`<p>${esc(t.description)}</p><p>${esc(SETTLEMENT_TYPES[t.kind].summary)}</p>${townFacilitiesHTML(state,t.id)}${townEventHTML(state,t.id)}${mountRewardHTML(state,t.id)}`,specialties[t.id]);break;}
 case 'town':applyCompanyAutomation(state);save();tab='town';speed=0;render();break;
 case 'company':tab='company';speed=0;render();break;
 case 'nearest-town':chosenCamp=null;chosenTown=[...SETTLEMENTS].sort((a,b)=>Math.hypot(a.x-state.position.x,a.y-state.position.y)-Math.hypot(b.x-state.position.x,b.y-state.position.y))[0].id;render();break;
 case 'resolve-battle':if(state.battle?.simultaneous){void fastResolveSimultaneous();break;}battleSpeed=0;battleResultAt=0;run(resolveBattle);break;
 case 'retreat-battle':battleSpeed=0;showModal('Retreat from battle?', '<p>Your company will attempt to disengage. Wounds and armor damage remain; retreating can cost lives.</p><div class="button-row"><button class="danger" data-action="confirm-retreat">Retreat now</button><button data-action="close-modal">Keep fighting</button></div>');break;
 case 'confirm-retreat':run(retreatBattle);$('#modal').close();break;
 case 'keep-loot':
 case 'donate-all':
 case 'finish-battle':{const liberatedTown=state.battle?.encounterType==='undead-liberation'?state.battle.crisisContext?.townId:null;const siteId=state.battle?.encounterType==='band'||state.battle?.encounterType?.startsWith('undead-')?null:state.battle?.campId;const r=finishBattle(state,b.dataset.action==='finish-battle'?{}:{shareLootIndices:getLootKeepQuote(state,b.dataset.action==='donate-all'?[]:lootKeepSelection)?.donateIndices??null});toast(r.message);if(r.ok){lootKeepSelection=[];chosenCamp=siteId;if(liberatedTown)chosenTown=liberatedTown;tab='world';selected=state.party[0]?.id||'';save();render();}break;}
 case 'equipment-catalog':equipmentCatalog();break;
 case 'retinue':showModal('Retinue & rare finds',retinueHTML(state));break;
 case 'buy-company-cart':retinueTransaction(buyCompanyCart);break;
 case 'hire-bounty-hunter':retinueTransaction(hireBountyHunter);break;
 case 'upgrade-scout':retinueTransaction(upgradeScout);break;
 case 'close-modal':marketReturnScroll=null;$('#modal').close();if(state.battle)render();break;case 'market':returnToMarket();break;case 'contracts':contracts();break;case 'recruit':recruitModal();break;
 case 'camp':speed=0;run(camp);break;case 'forage':speed=0;run(forage);if($('#modal').open)market();break;
 case 'go-company':$('#modal').close();tab='company';slotFilter='all';render();break;case 'settings':settings();break;
 case 'find-company':if(state.battle){focusBattleCamera('company');}else{tab='world';render();focusMap(state.position);window.scrollTo({top:0,behavior:'auto'});}break;
 case 'center':focusMap(state.position);break;case 'zoom-in':zoomMap(1.25);break;case 'zoom-out':zoomMap(.8);break;
 case 'export':exportSave();break;case 'export-recovery':exportSave(true);break;case 'import':$('#import-file').click();break;
 case 'new-game':showModal('Replace your company?',`<p>This replaces the save on this device. Export a backup first to keep the current company.</p><div class="button-row"><button data-action="export">Export current save</button><button class="danger" data-action="confirm-new">Replace company</button><button data-action="close-modal">Keep playing</button></div>`);break;
 case 'confirm-new':state=createGame();chosenCamp=null;battleSpeed=0;selected=state.party[0].id;chosenTown='oakwatch';unreadSave=false;corruptSave=null;save();tab='world';$('#modal').close();render();toast('Your new company gathers at Oakwatch.');break;
 }
});
document.addEventListener('change',async e=>{if(e.target.hasAttribute('data-simultaneous-beta')){setSimultaneousBetaEnabled(e.target.checked);toast('Combat setting saved. Applies to new battles.');return;}if(e.target.hasAttribute('data-battle-tactic')){stopSimultaneousWorker();const r=setBattleTactic(state,e.target.value);if(r.ok){save();render();}else toast(r.message);return;}if(e.target.hasAttribute('data-catalog-filter')){catalogCollection=e.target.value;equipmentCatalog();return;}if(e.target.id==='destinations'){const value=e.target.value;if(value.startsWith('blacksmith:')){const site=getBlacksmithQuestEncounters(state).find(e=>e.id===value.slice(11));if(site){chooseCamp(site);focusMap(site);}return;}else if(value.startsWith('caravan:')){const caravan=getCaravans(state).find(c=>c.id===value.slice(8));if(caravan){chooseCamp(caravan);focusMap(caravan);}}else if(value.startsWith('crisis:')){const site=getUndeadEncounters(state).find(e=>e.id===value.slice(7));if(site){chooseCamp(site);focusMap(site);}return;}else if(value.startsWith('camp:')){const site=getEncounterSites(state).find(c=>c.id===value.slice(5));chooseCamp(site);focusMap(site);}else{chooseTown(town(value));focusMap(town(value));}return;}if(e.target.id!=='import-file')return;const file=e.target.files[0];if(!file)return;try{if(file.size>MAX_SAVE_FILE_BYTES)throw new Error('Save file is too large.');state=validateSave(JSON.parse(await file.text()));lootKeepSelection=[];unreadSave=false;selected=state.party[0]?.id||'';chosenTown=townAt(state)?.id||'oakwatch';chosenCamp=state.pursuit||(['caravan','rescue','deserters','bounty'].includes(state.destinationAction?.type)?state.destinationAction.id:null);battleSpeed=0;tab=state.battle?'battle':'world';speed=0;save();$('#modal').close();render();toast('Company restored from your save.');}catch(error){toast(`Could not import save: ${error.message}`);}});
$('#settings-button').addEventListener('click',settings);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSimultaneousWorker();simultaneousResolveToken++;speed=0;battleSpeed=0;save();if(state.battle)render();else updateSpeed();}syncAudio();});window.addEventListener('pagehide',()=>{stopSimultaneousWorker();save();gameAudio.sync({active:false,playing:false,hidden:true,battleId:state.battle?.id??null});});
// A new cache cannot replace the renderer in an already open offline session.
// Pause and persist before the worker navigates to the completely cached build.
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',event=>{
 if(event.data?.type!=='PREPARE_UPDATE')return;
 speed=0;battleSpeed=0;save();
 let ready=false;try{ready=!unreadSave&&!saveProblem&&localStorage.getItem(SAVE_KEY)===JSON.stringify(state);}catch{}
 event.ports[0]?.postMessage({ready});
 if(!ready){$('#offline-status').textContent='Update paused · save unavailable';}
});
// Touch grants audio activation at tap completion, not at pointerdown.
// Retain early mouse unlock, and cover touch, keyboard-generated clicks and Safari.
document.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse')gameAudio.unlock();},{capture:true});
document.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')gameAudio.unlock();},{capture:true});
document.addEventListener('touchend',()=>gameAudio.unlock(),{capture:true});
document.addEventListener('click',()=>gameAudio.unlock(),{capture:true});
document.addEventListener('change',e=>{const key=e.target.dataset.combatSetting;if(!['combatRole','skillPreference'].includes(key))return;const result=setCombatSettings(state,e.target.dataset.personId,{[key]:e.target.value});toast(result.message);if(result.ok){save();render();}});
document.addEventListener('keydown',()=>gameAudio.unlock(),{capture:true});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!$('#modal').open&&!['INPUT','SELECT','BUTTON'].includes(e.target.tagName)){e.preventDefault();if(state.battle?.simultaneous){stopSimultaneousWorker();simultaneousResolveToken++;battleSpeed=battleSpeed?0:1;render();return;}speed=speed?0:1;updateSpeed();resources();}});
async function fastResolveSimultaneous(){
 const battle=state.battle,token=++simultaneousResolveToken;
 if(!battle?.simultaneous||battle.status!=='active')return;
 stopSimultaneousWorker();battleSpeed=0;battleResultAt=0;render();
 while(state.battle===battle&&battle.status==='active'&&token===simultaneousResolveToken&&!document.hidden&&!$('#modal').open){
  // Yield between bounded batches so Pause, menus and the browser stay responsive.
  await new Promise(requestAnimationFrame);
  if(token!==simultaneousResolveToken||document.hidden||$('#modal').open)break;
  const before=battle.simultaneous.time;const step=queueSimultaneousFrame(state,1000);
  if(!step.updated)continue;
  const entries=simultaneousEvents(battle);simultaneousSoundBattle=battle;simultaneousSoundCursor=entries.at(-1)?.id??simultaneousSoundCursor;
  updateSimultaneousBattleView($('#main'),battle,0);
  if(performance.now()-lastSave>2000){save();lastSave=performance.now();}
 }
 stopSimultaneousWorker();save();if(state.battle===battle&&battle.status!=='active'){battleResultAt=performance.now()+700;render();}
}
let last=performance.now(),lastSave=0,lastHour='';
function animate(now){
 const elapsed=Math.min((now-last)/1000,.25);last=now;
 if(!document.hidden&&!$('#modal').open){
  if(state.battle?.simultaneous&&state.battle.status!=='active'&&!battleResultAt&&$('.simultaneous-battle')){stopSimultaneousWorker();battleResultAt=now+700;save();render();}
  if(battleResultAt&&now>=battleResultAt){battleResultAt=0;battleSpeed=0;render();}
  else if(state.battle?.status==='active'&&battleSpeed&&state.battle.simultaneous){
   const battle=state.battle,before=battle.simultaneous.time;
   const step=queueSimultaneousFrame(state,elapsed*1000*(battleSpeed===4?4:1));
   if(simultaneousSoundBattle!==battle){simultaneousSoundBattle=battle;simultaneousSoundCursor=0;}
   const entries=simultaneousEvents(battle).filter(e=>e.id>simultaneousSoundCursor);
   // Mix a bounded number of simultaneous sounds; never replay them on later frames.
   for(const entry of entries.slice(-6))gameAudio.playEvent(entry.event,entry.duration/(battleSpeed===4?4:1)/1000,{cinematic:battleSpeed==='cinematic'});
   if(entries.length)simultaneousSoundCursor=entries.at(-1).id;
   if(step.updated||battle.simultaneous.time!==before){updateSimultaneousBattleView($('#main'),battle,battleSpeed);resources();}
   if(battle.status!=='active'){battleResultAt=now+700;save();render();}
   else if(now-lastSave>2000){save();lastSave=now;}
  }
  else if(state.battle?.status==='active'&&battleSpeed){battleElapsed+=elapsed;if(battleElapsed>=battleActionDuration(battleSpeed,state.battle?.lastEvent)){battleElapsed=0;advanceBattle(state);if(state.battle.status!=='active')battleResultAt=now+battleActionDuration(battleSpeed,state.battle?.lastEvent)*1000;save();render(true);}}
  else if(!state.battle&&speed&&tab==='world'){
   const before=state.contract,wasTraveling=!!state.destination,wasPursuing=!!state.pursuit,tickResult=tick(state,elapsed*(speed===1?.84:1.68));if(state.battle){toast(tickResult?.message||'The company catches the band. Battle begins.');enterBattleView();requestAnimationFrame(animate);return;}if(tickResult?.blockedTown){handleBlockade(tickResult);save();render();toast(tickResult.message);requestAnimationFrame(animate);return;}if(tickResult?.openTown){speed=0;chosenTown=tickResult.openTown;chosenCamp=null;tab='town';save();render();toast(tickResult.message);requestAnimationFrame(animate);return;}updateMap(state);const key=`${state.day}-${Math.floor(state.hour*4)}`;if(key!==lastHour){updateSpeed(true);resources();lastHour=key;const banner=$('#crisis-banner');if(banner)banner.innerHTML=crisisBannerHTML(state);const side=$('.world-sidebar');if(side&&document.activeElement?.id!=='destinations')side.innerHTML=sidebarHTML();}
   if(wasTraveling&&!state.destination){speed=0;chosenTown=townAt(state)?.id||chosenTown;save();render();toast(before&&!state.contract?'Contract fulfilled. Payment received.':wasPursuing?'The company catches the band. Ready to engage.':chosenCamp?.startsWith('shipment:')?'The caravan journey has ended. Check its report.':chosenCamp?'The company reaches the hostile location. Inspect the enemy before engaging.':'The company has arrived.');}
   if(now-lastSave>2000){save();lastSave=now;}
  }
 }
 maybeShowBlacksmithSummons();
 requestAnimationFrame(animate);
}
mergeOwnedNamedBonuses(state);if(!unreadSave)checkBlacksmithDiscovery(state);render();requestAnimationFrame(animate);if(unreadSave)toast('Your saved company could not be loaded. The original is preserved in Save / Menu.');else save();
function showBlacksmith(){showModal('Odran · Legendary Blacksmith',blacksmithPanelHTML(state,forgeSelection),'THE REKINDLED FORGE');}
function maybeShowBlacksmithSummons(){if(unreadSave||state.battle||state.gameOver||document.hidden||$('#modal').open||state.legendaryBlacksmith?.announcement!=='pending')return;save();showModal('Odran’s summons',blacksmithSummonsHTML(state),'THE REKINDLED FORGE');blacksmithSummonsOpen=true;}
function acknowledgeSummons(){if(state.legendaryBlacksmith?.announcement==='pending'){acknowledgeBlacksmithSummons(state);save();}blacksmithSummonsOpen=false;}
$('#modal').addEventListener('close',()=>{if(blacksmithSummonsOpen)acknowledgeSummons();});
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 if(button.dataset.forgeSelect){const side=button.dataset.forgeSelect,index=Number(button.dataset.forgeIndex);forgeSelection[side]=index;if(side==='donor'&&(forgeSelection.recipient===index||item(state.inventory[forgeSelection.recipient])?.slot!==item(state.inventory[index])?.slot))forgeSelection.recipient=null;showBlacksmith();document.querySelector(`[data-forge-select="${side}"][data-forge-index="${index}"]`)?.focus({preventScroll:true});return;}
 if(button.dataset.blacksmithAccept){const r=acceptBlacksmithQuest(state,Number(button.dataset.blacksmithAccept));toast(r.message);save();render();showBlacksmith();return;}
 if(button.dataset.blacksmithTurnin){const r=turnInBlacksmithQuest(state,Number(button.dataset.blacksmithTurnin));toast(r.message);save();render();showBlacksmith();return;}
 if(button.dataset.blacksmithSite||button.dataset.blacksmithMarch){const id=button.dataset.blacksmithSite??button.dataset.blacksmithMarch,site=getBlacksmithQuestEncounters(state).find(e=>e.id===id);if(!site)return;acknowledgeSummons();$('#modal').close();tab='world';chosenCamp=id;chosenTown=null;if(button.dataset.blacksmithMarch){const r=activateMapTarget(state,'blacksmith',id);toast(r.message);if(state.battle){enterBattleView();return;}speed=state.destination?1:0;}save();render();focusMap(site);return;}
 switch(button.dataset.action){
 case 'legendary-blacksmith':acknowledgeSummons();showBlacksmith();break;
 case 'blacksmith-speak':acknowledgeSummons();showBlacksmith();break;
 case 'blacksmith-later':acknowledgeSummons();$('#modal').close();break;
 case 'blacksmith-map':{acknowledgeSummons();$('#modal').close();tab='world';chosenCamp=null;chosenTown='ironford';render();focusMap(town('ironford'));break;}
 case 'blacksmith-journal':acknowledgeSummons();$('#modal').close();tab='journal';render();$('#blacksmith-side-quest')?.scrollIntoView({block:'start'});break;
 case 'blacksmith-reward':{const r=claimBlacksmithReward(state);toast(r.message);save();render();showBlacksmith();break;}
 case 'forge-confirm':{const recipient=item(state.inventory[forgeSelection.recipient]);forgeQuote=getReforgeQuote(state,forgeSelection.donor,forgeSelection.recipient,['named','famed'].includes(recipient?.rarity)?'merge':'transfer');if(!forgeQuote.ok){toast(forgeQuote.message);showBlacksmith();break;}showModal('Confirm permanent sacrifice',forgeConfirmationHTML(forgeQuote),'ODRAN’S FORGE');break;}
 case 'forge-commit':{const r=reforgeItem(state,forgeQuote);forgeQuote=null;toast(r.message);save();render();if(r.ok){forgeSelection.donor=null;forgeSelection.recipient=null;showModal('The work is done',forgeSuccessHTML(state,r),'ODRAN’S FORGE');}else showBlacksmith();break;}
 }
});
document.addEventListener('change',event=>{if(!event.target.matches('[data-forge-filter],[data-forge-search]'))return;forgeSelection[event.target.hasAttribute('data-forge-filter')?'filter':'search']=event.target.value;showBlacksmith();document.querySelector(event.target.hasAttribute('data-forge-filter')?'[data-forge-filter]':'[data-forge-search]')?.focus();});
async function prepareOffline(){const label=$('#offline-status');if(!('serviceWorker'in navigator)){label.textContent='Offline unavailable';return;}try{await navigator.serviceWorker.register('./sw.js');const reg=await navigator.serviceWorker.ready;const check=()=>{const ch=new MessageChannel();ch.port1.onmessage=e=>{label.textContent=e.data?.ready?'Offline ready':'Downloading offline files…';label.classList.toggle('ready',!!e.data?.ready);};(navigator.serviceWorker.controller||reg.active)?.postMessage({type:'CHECK_OFFLINE'},[ch.port2]);};check();navigator.serviceWorker.addEventListener('controllerchange',check);}catch{label.textContent='Open online to prepare';}}
prepareOffline();
