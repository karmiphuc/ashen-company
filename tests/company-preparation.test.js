import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,validateSave,getMarket,setCompanyAutomation,applyCompanyAutomation,buyItem,getItem,getCompanyStats,getRecruitOffers,recruit,MAX_COMPANY_SIZE,MAX_BATTLE_SIZE,getBattleRoster,getReserveSlots,getFormation,moveFormation,startBattle,advanceBattle,resolveBattle,finishBattle,tick,travelTo,SETTLEMENTS,getDailyFood} from '../src/engine.js';
import {formationHTML,hiringHTML,companyAutomationHTML} from '../src/campaign-ui.js';

function fullCompany(){const s=createGame(73),base=s.party[0];s.party=Array.from({length:18},(_,i)=>({...structuredClone(base),id:`bro-${i}`,name:`Brother ${i}`,seed:base.seed+i}));s.formation=Array(36).fill(null);s.party.slice(0,15).forEach((p,i)=>s.formation[i]=p.id);s.reserveIds=s.party.slice(15).map(p=>p.id);return s;}
function atCamp(s){s.position={x:440,y:520};assert.equal(startBattle(s,'quarry-camp').ok,true);}

test('automation preferences default off, persist independently and reject invalid or mid-battle changes atomically',()=>{
 const s=createGame(31);assert.deepEqual(s.automation,{buyAmmo:false,equipBandages:false});setCompanyAutomation(s,'equipBandages',true);assert.deepEqual(validateSave(s).automation,s.automation);
 const legacy=structuredClone(s);delete legacy.automation;delete legacy.reserveIds;assert.deepEqual(validateSave(legacy).automation,{buyAmmo:false,equipBandages:false});
 for(const change of [['bad',true],['buyAmmo',1]]){const before=structuredClone(s);assert.equal(setCompanyAutomation(s,...change).ok,false);assert.deepEqual(s,before);}
 for(const automation of [null,[],{buyAmmo:'true',equipBandages:false},{buyAmmo:false}])assert.throws(()=>validateSave({...s,automation}),/company automation/);
 atCamp(s);const before=structuredClone(s);assert.equal(setCompanyAutomation(s,'buyAmmo',true).ok,false);applyCompanyAutomation(s);assert.deepEqual(s,before);
});

test('automatic ammo purchases use real prices, remaining stock and affordable quantities without repeated charges',()=>{
 const s=createGame(91);s.supplies.ammo=95;const offer=getMarket(s).supplies.find(e=>e.kind==='ammo'),gold=s.gold;setCompanyAutomation(s,'buyAmmo',true);
 assert.equal(s.supplies.ammo,95+offer.stock);assert.equal(s.gold,gold-offer.stock*offer.buyPrice);assert.equal(getMarket(s).supplies.find(e=>e.kind==='ammo').stock,0);
 const before=structuredClone(s);applyCompanyAutomation(s);assert.deepEqual(s,before);
 const poor=createGame(91);poor.supplies.ammo=0;poor.gold=offer.buyPrice*2+1;setCompanyAutomation(poor,'buyAmmo',true);assert.equal(poor.supplies.ammo,2);assert.equal(poor.gold,1);
 const stock=createGame(91);stock.supplies.ammo=0;const available=getMarket(stock).supplies.find(e=>e.kind==='ammo').stock;setCompanyAutomation(stock,'buyAmmo',true);assert.equal(stock.supplies.ammo,available);assert.equal(getMarket(stock).supplies.find(e=>e.kind==='ammo').stock,0);
 const away=createGame(91);away.position={x:440,y:520};const g=away.gold;setCompanyAutomation(away,'buyAmmo',true);assert.equal(away.gold,g);assert.equal(away.supplies.ammo,16);
});

test('auto ammo restocks on actual arrival and refills throwing bundles even with abundant stores',()=>{
 const s=createGame(31);s.gold=10000;s.supplies.ammo=95;s.party[0].equipment.weapon='javelins';const w=getItem('javelins');assert.ok(w?.throwing);s.party[0].throwingAmmo.active=0;const initialStock=getMarket(s).supplies.find(e=>e.kind==='ammo').stock;setCompanyAutomation(s,'buyAmmo',true);assert.equal(s.party[0].throwingAmmo.active,w.ammo??5);assert.equal(s.supplies.ammo,95+initialStock-(w.ammo??5));
 s.supplies.ammo=900;const t=SETTLEMENTS.find(t=>t.id==='greyhaven'),stock=getMarket({...s,position:{x:t.x,y:t.y}}).supplies.find(e=>e.kind==='ammo').stock;s.position={x:t.x-50,y:t.y};assert.equal(travelTo(s,t.x,t.y).ok,true);assert.equal(tick(s,12).ok,true);assert.equal(s.supplies.ammo,900+stock);
});

test('bandages equip strongest first, upgrade healing only and preserve nonmedical gear and inventory conditions',()=>{
 const s=createGame(12);s.inventory=['bandages','medical-satchel','surgeons-kit'];s.inventoryCondition=[null,null,null];s.party[0].accessories=['rondel-dagger',null];setCompanyAutomation(s,'equipBandages',true);
 assert.deepEqual(getBattleRoster(s).map(p=>p.accessories.find(id=>getItem(id)?.consumable==='heal')),['surgeons-kit','medical-satchel','bandages']);assert.equal(s.party[0].accessories[0],'rondel-dagger');assert.deepEqual(s.inventory,[]);
 s.inventory=['surgeons-kit'];s.inventoryCondition=[null];applyCompanyAutomation(s);assert.equal(s.party[0].accessories[1],'surgeons-kit');assert.equal(s.party[1].accessories[0],'medical-satchel');assert.deepEqual(s.inventory,['bandages']);assert.deepEqual(s.inventoryCondition,[null]);
 const before=structuredClone(s);applyCompanyAutomation(s);assert.deepEqual(s,before);assert.deepEqual(validateSave(s).party.map(p=>p.accessories),s.party.map(p=>p.accessories));
 const blocked=createGame(12);blocked.party.forEach(p=>p.accessories=['rondel-dagger','rondel-dagger']);blocked.inventory=['surgeons-kit'];blocked.inventoryCondition=[null];setCompanyAutomation(blocked,'equipBandages',true);assert.deepEqual(blocked.inventory,['surgeons-kit']);
});

test('purchased bandages prepare immediately and a disabled preference leaves equipment untouched',()=>{
 const s=createGame(12);s.gold=10000;setCompanyAutomation(s,'equipBandages',true);const offer=getMarket(s).equipment.find(e=>getItem(e.itemId)?.consumable==='heal'&&e.stock>0);assert.ok(offer);assert.equal(buyItem(s,offer.itemId).ok,true);assert.equal(getBattleRoster(s)[0].accessories[0],offer.itemId);
 setCompanyAutomation(s,'equipBandages',false);s.inventory.push('surgeons-kit');s.inventoryCondition.push(null);const before=structuredClone(s);applyCompanyAutomation(s);assert.deepEqual(s,before);
});

test('18 brothers round trip with 15 fielded and 3 reserves; malformed membership and overfilled deployment are rejected',()=>{
 const s=fullCompany();assert.equal(MAX_COMPANY_SIZE,18);assert.equal(MAX_BATTLE_SIZE,15);assert.equal(getBattleRoster(s).length,15);assert.equal(getReserveSlots(s).filter(Boolean).length,3);assert.equal(getDailyFood(s),18);assert.deepEqual(validateSave(s),s);
 const bad=structuredClone(s);bad.reserveIds[0]=bad.formation[0];assert.throws(()=>validateSave(bad),/formation/);const over=structuredClone(s);over.formation[15]=over.reserveIds[0];over.reserveIds[0]=null;assert.throws(()=>validateSave(over),/formation/);
 assert.throws(()=>validateSave({...s,reserveIds:['bro-15']}),/reserves/);assert.throws(()=>validateSave({...s,party:[...s.party,{...s.party[0],id:'overflow'}]}),/party/);
});

test('formation swaps reserve and fielded brothers, rejects a 16th fielded brother and locks during fights',()=>{
 const s=fullCompany();assert.equal(moveFormation(s,36,0).ok,true);assert.equal(s.formation[0],'bro-15');assert.equal(s.reserveIds[0],'bro-0');const before=structuredClone(s);assert.equal(moveFormation(s,36,35).ok,false);assert.deepEqual(s,before);
 assert.equal(moveFormation(s,0,36).ok,true);atCamp(s);const fighting=structuredClone(s);assert.equal(moveFormation(s,36,0).ok,false);assert.deepEqual(s,fighting);assert.deepEqual(validateSave(s),s);
});

test('reserve brothers keep equipment, health and XP through a full battle and cannot gain combat XP',()=>{
 const s=fullCompany();s.inventory=Array(15).fill('bandages');s.inventoryCondition=Array(15).fill(null);setCompanyAutomation(s,'equipBandages',true);const reserves=structuredClone(s.party.slice(15));atCamp(s);
 assert.equal(s.battle.units.filter(u=>u.side==='company'&&!u.ally).length,15);assert.ok(reserves.every(p=>!s.battle.units.some(u=>u.id===p.id)));let steps=0;while(s.battle.status==='active'&&steps++<10000){advanceBattle(s);if(steps%20===0)assert.deepEqual(validateSave(s),s);}assert.notEqual(s.battle.status,'active');assert.equal(finishBattle(s).ok,true);
 assert.deepEqual(s.party.filter(p=>s.reserveIds.includes(p.id)),reserves);assert.deepEqual(validateSave(s),s);
});

test('a wiped deployed force leaves reserves alive and requires deploying someone before the next fight',()=>{
 const s=fullCompany(),reserves=structuredClone(s.party.slice(15));atCamp(s);s.battle.units.filter(u=>u.side==='company').forEach(u=>{u.hp=0;u.alive=false;});resolveBattle(s);assert.equal(s.battle.status,'defeat');assert.equal(finishBattle(s).ok,true);assert.deepEqual(s.party,reserves);assert.equal(s.gameOver,false);assert.equal(getBattleRoster(s).length,0);assert.equal(startBattle(s,'quarry-camp').ok,false);assert.equal(moveFormation(s,36,0).ok,true);assert.equal(startBattle(s,'quarry-camp').ok,true);
});

test('preparation and reserve UI exposes saved checkboxes, all reserve slots and the new hiring limit',()=>{
 const s=fullCompany(),html=formationHTML(s,36);assert.match(html,/15 \/ 15 fielded/);assert.match(html,/3 \/ 3 reserves/);assert.match(html,/data-formation-slot="38"/);assert.match(html,/Reserve position 1: Brother 15/);assert.match(hiringHTML(s,[]),/18 \/ 18 companions/);assert.match(companyAutomationHTML(s),/type="checkbox" data-company-automation="buyAmmo"/);
});

test('ammo automation keeps buying replenished daily stock and respects the existing supply capacity',()=>{
 const s=createGame(91);s.gold=10000;s.food=500;s.supplies.ammo=500;setCompanyAutomation(s,'buyAmmo',true);const before=s.supplies.ammo;assert.equal(tick(s,24).ok,true);assert.ok(s.supplies.ammo>before);assert.equal(getMarket(s).supplies.find(e=>e.kind==='ammo').stock,0);
 const capped=createGame(91);capped.supplies.ammo=9999;const stock=getMarket(capped).supplies.find(e=>e.kind==='ammo').stock;setCompanyAutomation(capped,'buyAmmo',true);assert.equal(capped.supplies.ammo,10000);assert.equal(getMarket(capped).supplies.find(e=>e.kind==='ammo').stock,stock-1);const snapshot=structuredClone(capped);applyCompanyAutomation(capped);assert.deepEqual(capped,snapshot);
});

test('consumed medical supplies are replaced from the stash after claiming a completed battle',()=>{
 const s=createGame(73);s.inventory=Array(6).fill('bandages');s.inventoryCondition=Array(6).fill(null);setCompanyAutomation(s,'equipBandages',true);atCamp(s);const fighter=s.battle.units.find(u=>u.side==='company');fighter.accessories[0]=null;s.battle.units.filter(u=>u.side==='enemy').forEach(u=>{u.hp=0;u.alive=false;});resolveBattle(s);assert.equal(s.battle.status,'victory');assert.equal(finishBattle(s).ok,true);assert.equal(s.party.find(p=>p.id===fighter.id).accessories[0],'bandages');assert.equal(s.inventory.filter(id=>id==='bandages').length,2);assert.deepEqual(validateSave(s),s);
});

test('actual hiring fills fifteen deployment places then three reserves and rejects the nineteenth recruit without spending crowns',()=>{
 const s=createGame(31);s.gold=100000;s.food=500;while(s.party.length<18){const offer=getRecruitOffers(s)[0];if(!offer){assert.equal(tick(s,24).ok,true);continue;}assert.equal(recruit(s,offer.id).ok,true);assert.deepEqual(validateSave(s),s);}
 assert.equal(getBattleRoster(s).length,15);assert.equal(getReserveSlots(s).filter(Boolean).length,3);assert.equal(tick(s,24).ok,true);const snapshot=structuredClone(s);assert.equal(recruit(s,getRecruitOffers(s)[0].id).ok,false);assert.deepEqual(s,snapshot);
});
