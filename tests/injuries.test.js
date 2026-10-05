import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import { INJURIES, INJURY_BY_ID, INJURY_POOLS, eligibleInjuries, attackInjuryPool, injuryStat, injuryAdjustment, injuryHealingRange, freshInjuryBleeding, injuryRange } from '../src/injuries.js';
import { injuryPanelHTML, townServiceHTML, companySheetHTML, battleResultsHTML, resourceHTML, townActionsHTML } from '../src/campaign-ui.js';
import { battleHTML } from '../src/battle-view.js';
import { simultaneousInitiative } from '../src/simultaneous-combat.js';

const wound=(id,day=1,extra={})=>({id,acquiredDay:day,healingDays:0,treated:false,...extra});
function atTown(seed=412){const state=game.createGame(seed),town=game.SETTLEMENTS.find(t=>t.id==='ironford');state.position={x:town.x,y:town.y};state.gold=100000;state.food=1000;return state;}
function injured(id='fractured-ribs',seed=412){const state=atTown(seed);state.party[0].injuries=[wound(id)];state.party[0].hp=Math.min(state.party[0].hp,game.getCompanyStats(state.party[0]).maxHp);return state;}
function battle(seed=412,weapon='arming-sword'){
 const state=game.createGame(seed),person=state.party[0];person.equipment.weapon=weapon;person.equipment.shield=null;person.armorDurability.shield=0;
 const site=game.getCampSites(state)[0];state.position={x:site.x,y:site.y};assert.ok(game.startBattle(state,site.id).ok);
 const b=state.battle,a=b.units.find(u=>u.id==='captain'),t=b.units.find(u=>u.id==='enemy-1');
 for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
 for(const [index,unit] of b.units.entries()){unit.q=index+1;unit.r=10;}
 Object.assign(a,{q:5,r:5,meleeSkill:200,skillPreference:'damage'});
 Object.assign(t,{q:6,r:5,hp:100,maxHp:100,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,shieldDurability:0});t.equipment.shield=null;
 b.activeId=a.id;b.turnIndex=b.turnOrder.indexOf(a.id);b.rng=1972;
 return {state,b,a,t};
}
const roundtrip=state=>game.validateSave(JSON.parse(JSON.stringify(state)));

test('OG body/head damage thresholds are inclusive and use individual health damage',()=>{
 const target={hp:80,maxHp:80,injuries:[]};
 assert.deepEqual(eligibleInjuries(target,INJURY_POOLS.BluntBody,19),[]);
 assert.equal(eligibleInjuries(target,INJURY_POOLS.BluntBody,20).length,6);
 assert.equal(eligibleInjuries(target,INJURY_POOLS.BluntBody,40).length,11);
 assert.deepEqual(eligibleInjuries(target,INJURY_POOLS.BluntHead,24,true),[]);
 assert.deepEqual(eligibleInjuries(target,INJURY_POOLS.BluntHead,25,true),['broken-nose']);
 assert.ok(!eligibleInjuries(target,INJURY_POOLS.BluntHead,59,true).includes('fractured-skull'));
 assert.ok(eligibleInjuries(target,INJURY_POOLS.BluntHead,60,true).includes('fractured-skull'));
 target.hp=1;assert.deepEqual(eligibleInjuries(target,INJURY_POOLS.BluntBody,19),[]);
});

test('modified thresholds retain the ten-health minimum; duplicates and invalid wounds are excluded',()=>{
 const target={hp:100,maxHp:100,injuries:[wound('fractured-ribs')]};
 assert.deepEqual(eligibleInjuries(target,INJURY_POOLS.BluntBody,9,false,.1),[]);
 assert.ok(eligibleInjuries(target,INJURY_POOLS.BluntBody,10,false,.1).length>0);
 assert.ok(!eligibleInjuries(target,INJURY_POOLS.BluntBody,50).includes('fractured-ribs'));
 target.injuries=[wound('broken-nose')];assert.ok(!eligibleInjuries(target,INJURY_POOLS.CuttingHead,50,true).includes('split-nose'));
 for(const flags of [{hp:0},{undeadTraitsVersion:1},{injuryImmune:true}])assert.deepEqual(eligibleInjuries({...target,...flags},INJURY_POOLS.BluntBody,80),[]);
 assert.deepEqual(attackInjuryPool({}, {dot:true}),[]);
 assert.deepEqual(attackInjuryPool({}, {id:'split-shield'}),[]);
});

test('action pools match their damage families, including ranged, dagger and lunge attacks',()=>{
 for(const id of ['bash','cascade','flail-headshot','smite','knock-out'])assert.equal(attackInjuryPool({}, {id}),INJURY_POOLS.BluntBody);
 for(const id of ['stab','deathblow','lunge','quick-shot','shoot-bolt','rupture','throw-javelin'])assert.equal(attackInjuryPool({}, {id}),INJURY_POOLS.PiercingBody);
 for(const id of ['gash','slash','cleave','throw-axe','strike'])assert.equal(attackInjuryPool({}, {id},true),INJURY_POOLS.CuttingHead);
 assert.equal(attackInjuryPool({ranged:true,visual:'northern-sling'}),INJURY_POOLS.BluntBody);
 assert.equal(attackInjuryPool(game.getItem('javelins'),{id:'power-throw'}),INJURY_POOLS.PiercingBody);
 assert.equal(attackInjuryPool(game.getItem('bb-named-two-handed-hammer'),{id:'charge'}),INJURY_POOLS.BluntBody);
});

test('source catalogue uses individual effects and durations, including severe wounds',()=>{
 assert.equal(INJURIES.length,46);
 assert.deepEqual(INJURY_BY_ID.get('fractured-ribs').days,[3,4]);
 assert.deepEqual(INJURY_BY_ID.get('cut-arm-sinew').effects,{damage:.6});
 assert.deepEqual(INJURY_BY_ID.get('pierced-lung').days,[5,7]);
 assert.equal(INJURY_BY_ID.get('pierced-lung').effects.maxFatigue,.4);
 const stats={maxFatigue:100,meleeSkill:80,initiative:100,injuries:[wound('fractured-ribs'),wound('pierced-lung'),wound('severe-concussion')]};
 assert.equal(injuryStat(stats,'maxFatigue'),28);assert.equal(injuryStat(stats,'meleeSkill'),40);assert.equal(injuryStat(stats,'initiative'),50);
 assert.equal(injuryAdjustment({injuries:[wound('broken-leg')]},'movement'),2);
 assert.equal(injuryAdjustment({injuries:[wound('dislocated-shoulder')]},'ap'),-3);
 assert.equal(injuryRange(stats,{ranged:true,range:9}),5);
 assert.equal(injuryRange({injuries:[]},{ranged:true,range:9}),9);
});

test('company stats and new battle reads agree; tactical saves store raw attributes without double application',()=>{
 const state=injured(),person=state.party[0],raw=game.getCompanyStats(person,{ignoreInjuries:true});
 assert.equal(game.getCompanyStats(person).maxFatigue,Math.floor(raw.maxFatigue*.7));
 const site=game.getCampSites(state)[0];state.position={x:site.x,y:site.y};game.startBattle(state,site.id);
 const unit=state.battle.units.find(u=>u.id===person.id);assert.equal(unit.maxFatigue,raw.maxFatigue);assert.equal(injuryStat(unit,'maxFatigue'),game.getCompanyStats(person).maxFatigue);
 assert.deepEqual(roundtrip(state),state);assert.deepEqual(roundtrip(roundtrip(state)),state);
});

test('new qualifying attacks persist one wound per hit and preserve the independent injury stream on reload',()=>{
 const f=battle(412,'bb-named-crypt-cleaver');game.advanceBattle(f.state);assert.equal(f.b.lastEvent.type,'attack');assert.equal(f.t.injuries.length,1);
 assert.match(f.b.lastEvent.message,/suffers/);assert.equal(f.t.injuries[0].sourceId,'captain');assert.deepEqual(roundtrip(f.state),f.state);
 const saved=roundtrip(f.state);for(let n=0;n<30&&f.b.status==='active';n++){game.advanceBattle(f.state);game.advanceBattle(saved);assert.deepEqual(saved,f.state);}
});

test('armored chip damage and lethal hits do not generate ordinary wounds',()=>{
 const armored=battle();armored.t.bodyArmor=armored.t.headArmor=300;armored.t.equipment.armor='plate-harness';armored.t.equipment.helmet='iron-helm';game.advanceBattle(armored.state);
 assert.ok(armored.b.lastEvent.hpDamage<10);assert.equal(armored.t.injuries.length,0);
 const lethal=battle();lethal.t.hp=1;game.advanceBattle(lethal.state);assert.equal(lethal.t.alive,false);assert.equal(lethal.t.injuries.length,0);
});

test('Gash causes real wounds while resumed legacy battles retain their daze surrogate',()=>{
 const modern=battle(412,'bb-named-shamshir');game.advanceBattle(modern.state);assert.equal(modern.b.lastEvent.skillName,'Gash');assert.equal(modern.t.injuries.length,1);assert.equal(modern.t.dazedTurns??0,0);
 const old=battle(412,'bb-named-shamshir');delete old.b.injuryRulesVersion;delete old.b.injuryRng;for(const unit of old.b.units)delete unit.injuries;
 const restored=roundtrip(old.state);game.advanceBattle(restored);assert.equal(restored.battle.injuryRulesVersion,undefined);assert.equal(restored.battle.units.find(u=>u.id===old.t.id).dazedTurns,2);assert.equal(restored.battle.units.find(u=>u.id===old.t.id).injuries,undefined);
});

test('fresh bleeding wounds tick once per round and cannot recursively generate injuries',()=>{
 const f=battle();f.a.injuries=[wound('cut-artery',1,{fresh:true,sourceId:f.t.id})];
 assert.equal(freshInjuryBleeding(f.a),3);const hp=f.a.hp;game.advanceBattle(f.state);assert.equal(f.a.hp,hp-3);assert.equal(f.a.injuries.length,1);
 game.advanceBattle(f.state);assert.equal(f.a.hp,hp-3);assert.deepEqual(roundtrip(f.state),f.state);
 f.a.injuries[0].fresh=false;assert.equal(freshInjuryBleeding(f.a),0);
});

test('daily care uses one medicine per wound, shortages pause progress, HP healing keeps wounds',()=>{
 const state=injured();state.party[1].injuries=[wound('cut-arm-sinew')];state.supplies.medicine=1;
 game.tick(state,24-state.hour);assert.equal(state.supplies.medicine,0);assert.equal(state.party[0].injuries[0].healingDays,1);assert.equal(state.party[1].injuries[0].healingDays,0);
 game.tick(state,24);assert.equal(state.party[0].injuries[0].healingDays,1);
 state.supplies.medicine=10;game.tick(state,24);assert.equal(state.party[0].injuries[0].healingDays,2);assert.equal(state.party[1].injuries[0].healingDays,1);
 state.party[0].hp=20;assert.ok(game.useTownService(state,'doctor',state.party[0].id).ok);assert.equal(state.party[0].injuries.length,1);
});

test('camping reserves daily wound medicine before consuming optional HP-healing medicine',()=>{
 const state=injured();state.party[0].hp=20;state.supplies.medicine=1;const oldHp=state.party[0].hp;
 assert.ok(game.camp(state).ok);assert.equal(state.supplies.medicine,1);assert.equal(state.party[0].hp,oldHp+8);
 state.supplies.medicine=2;const hp=state.party[0].hp;assert.ok(game.camp(state).ok);assert.equal(state.supplies.medicine,1);assert.equal(state.party[0].hp,hp+24);
});

test('daily recovery is invariant under travel partitioning and reload; maximum days guarantee recovery',()=>{
 const whole=injured('pierced-lung'),split=structuredClone(whole);whole.supplies.medicine=split.supplies.medicine=100;
 for(const hours of [72,72,24])assert.ok(game.tick(whole,hours).ok);for(let n=0;n<28;n++){game.tick(split,6);Object.assign(split,roundtrip(split));}
 assert.deepEqual(split.party,whole.party);assert.deepEqual(split.supplies,whole.supplies);assert.equal(whole.party[0].injuries.length,0);
});

test('treatment halves original durations without curing, preserves medicine and is affordable and repeat-safe',()=>{
 const state=injured('pierced-lung'),person=state.party[0],hp=person.hp,medicine=state.supplies.medicine;
 const quote=game.getTownServiceQuote(state,'injury-treatment',person.id);assert.ok(quote.ok);assert.equal(quote.totalAmount,1);assert.equal(quote.totalCost,140);
 const poor=structuredClone(state);poor.gold=quote.totalCost-1;const before=structuredClone(poor);assert.equal(game.useTownService(poor,'injury-treatment',person.id).ok,false);assert.deepEqual(poor,before);
 assert.ok(game.useTownService(state,'injury-treatment',person.id).ok);assert.equal(person.hp,hp);assert.equal(state.supplies.medicine,medicine);assert.equal(person.injuries.length,1);assert.equal(person.injuries[0].treated,true);
 assert.deepEqual(injuryHealingRange(person.injuries[0]),[2.5,3.5]);assert.deepEqual(injuryHealingRange(person.injuries[0],true),[1.5,2.5]);
 const after=structuredClone(state);assert.equal(game.useTownService(state,'injury-treatment',person.id).ok,false);assert.deepEqual(state,after);
});

test('maximum-HP penalties end without granting free HP, and fresh caps activate after combat',()=>{
 const state=injured('grazed-neck'),person=state.party[0];person.hp=40;state.supplies.medicine=100;
 assert.equal(game.getCompanyStats(person).maxHp,85);game.tick(state,48);assert.equal(person.injuries.length,0);assert.equal(person.hp,40);assert.equal(game.getCompanyStats(person).maxHp,100);
 const f=battle();f.a.injuries=[wound('deep-abdominal-cut',1,{fresh:true,sourceId:f.t.id})];f.a.hp=60;
 for(const unit of f.b.units.filter(u=>u.side==='enemy')){unit.hp=0;unit.alive=false;}
 f.b.status='victory';f.b.activeId=null;f.b.casualties=[];assert.ok(game.finishBattle(f.state).ok);
 const survivor=f.state.party.find(p=>p.id==='captain');assert.equal(survivor.hp,60);assert.equal(game.getCompanyStats(survivor).maxHp,75);assert.deepEqual(survivor.injuries,[wound('deep-abdominal-cut')]);assert.equal(f.state.battle,null);assert.deepEqual(roundtrip(f.state),f.state);
});

test('simultaneous initiative and new-battle AP reflect existing injuries',()=>{
 const unit={initiative:100,fatigue:0,injuries:[wound('severe-concussion')]};assert.equal(simultaneousInitiative(unit),50);
 const state=injured('dislocated-shoulder'),site=game.getCampSites(state)[0];state.position={x:site.x,y:site.y};game.startBattle(state,site.id);
 assert.equal(state.battle.units.find(u=>u.id==='captain').ap,6);assert.deepEqual(roundtrip(state),state);
});

test('save schema rejects unknown, duplicate, forged, future and impossible recovery records',()=>{
 for(const mutate of [p=>p.injuries=[wound('unknown')],p=>p.injuries=[wound('fractured-ribs'),wound('fractured-ribs')],p=>p.injuries=[wound('fractured-ribs',2)],p=>p.injuries=[wound('fractured-ribs',1,{healingDays:1})],p=>p.injuries=[wound('fractured-ribs',1,{treated:'yes'})],p=>p.injuries=[wound('fractured-ribs',1,{fresh:true})]]){
  const state=atTown();mutate(state.party[0]);assert.throws(()=>roundtrip(state),/person injuries/);
 }
 const legacy=atTown();for(const person of legacy.party)delete person.injuries;const migrated=roundtrip(legacy);assert.ok(migrated.party.every(p=>p.injuries.length===0));
 const f=battle(),bad=structuredClone(f.state);bad.battle.units[0].injuries=[wound('fractured-ribs',1,{fresh:false,sourceId:null})];assert.throws(()=>roundtrip(bad),/injury ownership/);
});

test('wound UI shows concise recovery, treatment state, accessible hints and paused care',()=>{
 const state=injured(),person=state.party[0];state.supplies.medicine=0;
 const panel=injuryPanelHTML(state,person);assert.match(panel,/Recovery paused/);assert.match(panel,/data-company-hint/);assert.match(panel,/Fractured Ribs/);assert.match(panel,/data-town-service-view="injury-treatment"/);assert.match(resourceHTML(state,0),/Medicine · 1\/day/);assert.match(resourceHTML(state,0),/Recovery paused: no medicine/);assert.match(townActionsHTML(state,'ironford'),/data-action="doctor"/);
 const sheet=companySheetHTML(state,person,'all','');assert.match(sheet,/injury-panel/);assert.doesNotMatch(sheet,/undefined/);
 const html=townServiceHTML(state,game.getTownServiceQuote(state,'injury-treatment'));assert.match(html,/Halve wound recovery/);assert.match(html,/data-town-service="injury-treatment"/);
 const f=battle();f.a.injuries=[wound('fractured-ribs',1,{fresh:true,sourceId:f.t.id})];assert.match(battleHTML(f.b),/wound-fractured-ribs/);f.b.status='retreat';assert.match(battleResultsHTML(f.state),/New · after battle/);
});


test('Crippling Strikes lowers actual attack thresholds without consuming hit or damage random draws',()=>{
 const ordinary=battle(),crippling=battle();crippling.state.party[0].level=2;crippling.state.party[0].perks=['crippling-strikes'];crippling.a.perks=['crippling-strikes'];
 game.advanceBattle(ordinary.state);game.advanceBattle(crippling.state);
 assert.equal(ordinary.t.injuries.length,0);assert.equal(crippling.t.injuries.length,1);
 assert.equal(ordinary.b.lastEvent.hpDamage,crippling.b.lastEvent.hpDamage);assert.equal(ordinary.b.rng,crippling.b.rng);assert.deepEqual(roundtrip(crippling.state),crippling.state);
});

test('leg wounds add the listed movement AP once without inventing extra movement fatigue',()=>{
 const healthy=battle(),limping=battle();healthy.t.q=limping.t.q=9;
 limping.a.injuries=[wound('broken-leg',1,{fresh:true,sourceId:limping.t.id})];
 game.advanceBattle(healthy.state);game.advanceBattle(limping.state);
 assert.equal(healthy.b.lastEvent.type,'move');assert.equal(limping.b.lastEvent.type,'move');
 assert.equal(limping.a.ap,healthy.a.ap-2);assert.equal(limping.a.fatigue,healthy.a.fatigue);assert.deepEqual(roundtrip(limping.state),limping.state);
});

test('acquiring an AP wound caps remaining AP without subtracting AP that was already spent',()=>{
 for(const [before,expected] of [[2,2],[9,6]]){
  const f=battle(412,'bb-named-two-handed-hammer');f.t.hp=f.t.maxHp=60;f.t.ap=before;f.b.rng=0;f.b.injuryRng=942;
  game.advanceBattle(f.state);assert.equal(f.t.injuries[0].id,'dislocated-shoulder');assert.equal(f.t.ap,expected);assert.deepEqual(roundtrip(f.state),f.state);
 }
});

test('Surgeon shortens wound recovery and treatment remains available for injured brothers at full HP',()=>{
 const state=injured('pierced-lung'),person=state.party[0];state.retinue.members.push('surgeon');state.supplies.medicine=100;
 assert.deepEqual(game.getInjuryCare(state,person)[0].remainingDays,[4,6]);
 assert.ok(game.useTownService(state,'injury-treatment',person.id).ok);
 for(let day=0;day<3;day++)assert.ok(game.tick(state,24).ok);
 assert.equal(person.injuries.length,0);assert.equal(person.hp,100);
});
