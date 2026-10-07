import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import { PREFIX_EFFECTS, EXPANDED_PREFIXES, AFFIX_MASTERIES } from '../src/affix-prefixes.js';
import { equipmentBoost, equipmentPerk, perkFlags } from '../src/item-affixes.js';
import { encodeForgeItem, extractForgeProfile } from '../src/reforged-items.js';
import { companySheetHTML } from '../src/campaign-ui.js';
import { getItemDetails } from '../src/item-details.js';
import { simultaneousInitiative } from '../src/simultaneous-combat.js';
import { setSimultaneousBetaEnabled } from '../src/combat-config.js';

const catalog=id=>game.ITEMS.find(i=>i.id===id);
const forged=(base,profile)=>game.getItem(encodeForgeItem(base,profile,catalog));
function equip(s,item,destination='active'){s.inventory.push(item.id);s.inventoryCondition.push(item.slot==='shield'?game.shieldMaximum(item.id):item.armor??null);assert.ok(game.equipItem(s,'captain',item.id,destination).ok);}
const reload=s=>game.validateSave(structuredClone(s));
function fight({profile={},weapon='arming-sword',armor=null,perks=[],realtime=false,setup=null}={}){
  const s=game.createGame(51),p=s.party[0];p.level=20;p.perks=perks;
  equip(s,forged(weapon,{accuracy:1,...profile}));if(armor)equip(s,armor);
  game.unequipItem(s,p.id,'shield');if(setup)setup(s,p);
  const site=game.getCampSites(s)[0];s.position={x:site.x,y:site.y};
  setSimultaneousBetaEnabled(realtime);try{assert.ok(game.startBattle(s,site.id).ok);}finally{setSimultaneousBetaEnabled(false);}
  const b=s.battle,a=b.units.find(u=>u.id==='captain'),t=b.units.find(u=>u.id==='enemy-1');
  for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
  for(const [index,u] of b.units.entries()){u.q=index+1;u.r=13;}
  Object.assign(a,{q:5,r:5,meleeSkill:200,rangedSkill:100,skillPreference:'damage'});
  Object.assign(t,{q:game.getItem(weapon).ranged?8:6,r:5,hp:300,maxHp:300,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,shieldDurability:0});t.equipment.shield=null;
  b.activeId=a.id;b.turnIndex=b.turnOrder.indexOf(a.id);b.rng=1972;
  return {s,b,a,t,p};
}
function hit(options){const f=fight(options);game.advanceBattle(f.s);assert.equal(f.b.lastEvent.type,'attack');return f;}

test('every requested prefix and grade is reachable, deterministic, inspected and fully reforged',()=>{
  const seen=new Map(),masteries=new Set();
  for(const base of ['arming-sword','hunting-bow','patched-coat','cloth-hood','round-shield'])for(let seed=0;seed<6000;seed++){
    const item=game.getItem(game.createFamedItemId(base,seed)),prefix=item.affixPrefix;
    assert.equal(item.rollVersion,7);assert.deepEqual(item,game.getItem(item.id));
    const values=seen.get(prefix.id)??new Set();values.add(prefix.value);seen.set(prefix.id,values);
    if(prefix.id==='masterful')item.grantedPerks.forEach(id=>masteries.add(id));
    if(seed<100){const profile=extractForgeProfile(item,catalog,{shieldMaximum:game.shieldMaximum,shieldDamage:game.shieldImpactDamage});assert.ok(profile,item.id);const copy=forged(base,profile);assert.deepEqual(copy.perkBoosts,Object.fromEntries([...Object.entries(item.perkBoosts),...['berserkAp','nimble','battleForged'].filter(k=>!Object.hasOwn(item.perkBoosts,k)).map(k=>[k,0])]));assert.deepEqual(copy.grantedPerks,item.grantedPerks);}
  }
  for(const prefix of EXPANDED_PREFIXES)assert.deepEqual([...seen.get(prefix.id)].sort((a,b)=>a-b),[...prefix.grades].sort((a,b)=>a-b),prefix.id);
  assert.deepEqual([...masteries].sort(),[...AFFIX_MASTERIES].sort());
});

test('health grades scale maximum HP with Colossus, strongest-copy rules and safe unequip',()=>{
  for(const grade of [5,10,15]){const s=game.createGame(51),p=s.party[0];p.perks=['colossus'];p.level=20;const baseline=game.getCompanyStats(p).maxHp;equip(s,forged('leather-vest',{healthPct:grade}));assert.equal(game.getCompanyStats(p).maxHp,Math.round(baseline*(1+grade/100)));equip(s,forged('leather-cap',{healthPct:5}));assert.equal(equipmentBoost(p,'healthPct',game.getItem),grade);p.hp=game.getCompanyStats(p).maxHp;game.unequipItem(s,p.id,'armor');game.unequipItem(s,p.id,'helmet');assert.equal(p.hp,baseline);assert.deepEqual(reload(s),s);}
});

test('Executioner grades increase real damage only against injuries with the learned perk',()=>{
  const damage=(boost,learned,injured)=>{const f=fight({profile:boost?{executionerPct:boost}:{},perks:learned?['executioner']:[]});if(injured)f.t.injuries=[{id:'fractured-ribs',acquiredDay:1,healingDays:0,treated:false,fresh:true,sourceId:f.a.id}];game.advanceBattle(f.s);return f.b.lastEvent.hpDamage;};
  const ordinary=damage(0,true,true);let last=ordinary;
  for(const grade of [10,15,20]){const next=damage(grade,true,true);assert.ok(next>=last);assert.ok(next>ordinary);last=next;assert.equal(damage(grade,false,true),damage(0,false,true));assert.equal(damage(grade,true,false),damage(0,true,false));}
});

test('Duelist grades use its one-handed melee eligibility and require Duelist',()=>{
  const base=hit({perks:['duelist']}).b.lastEvent.hpDamage;
  for(const grade of [10,15,20])assert.ok(hit({profile:{duelistPct:grade},perks:['duelist']}).b.lastEvent.hpDamage>base);
  assert.equal(hit({profile:{duelistPct:20}}).b.lastEvent.hpDamage,hit({}).b.lastEvent.hpDamage);
  const ranged=hit({profile:{duelistPct:20},perks:['duelist'],weapon:'light-crossbow'});assert.equal(ranged.b.lastEvent.hpDamage,hit({perks:['duelist'],weapon:'light-crossbow'}).b.lastEvent.hpDamage);
});

test('kill momentum banks all three grades, survives reload and misses, consumes one hit and refreshes on a kill',()=>{
  for(const grade of [50,75,100]){
    const f=fight({profile:{killMomentumPct:grade}});f.t.hp=1;game.advanceBattle(f.s);assert.equal(f.a.killMomentumPct,grade);assert.deepEqual(reload(f.s),f.s);
    const next=f.b.units.find(u=>u.id==='enemy-2');Object.assign(next,{q:6,r:5,hp:300,maxHp:300,bodyArmor:0,attachmentArmor:0,headArmor:0,equipment:{...next.equipment,shield:null},shieldDurability:0,meleeDefense:300});
    f.a.ap=9;f.a.fatigue=0;f.a.meleeSkill=0;f.b.activeId=f.a.id;f.b.turnIndex=f.b.turnOrder.indexOf(f.a.id);f.b.rng=1;game.advanceBattle(f.s);assert.equal(f.b.lastEvent.type,'miss');assert.equal(f.a.killMomentumPct,grade);
    next.meleeDefense=0;f.a.meleeSkill=200;f.a.fatigue=0;f.a.ap=9;f.b.rng=1972;
    const plain=structuredClone(f.s);delete plain.battle.units.find(u=>u.id===f.a.id).killMomentumPct;
    game.advanceBattle(f.s);game.advanceBattle(plain);assert.ok(f.b.lastEvent.hpDamage>plain.battle.lastEvent.hpDamage);assert.equal(f.a.killMomentumPct,undefined);assert.deepEqual(reload(f.s),f.s);
  }
});

test('head-hit daze affects skill and initiative, keeps fatigue unchanged and saves in both combat modes',()=>{
  for(const realtime of [false,true]){
    const f=fight({profile:{dazeHead:1,headChance:100},realtime});
    if(realtime)for(const u of f.b.units)f.b.simultaneous.actors[u.id].readyAt=u===f.a?0:1000;
    const before=simultaneousInitiative(f.t);game.advanceBattle(f.s);assert.equal(f.t.affixDazedTurns,2);assert.ok(simultaneousInitiative(f.t)<before*.6);assert.deepEqual(reload(f.s),f.s);
    const w=game.getItem(f.t.equipment.weapon);f.t.meleeSkill=60;f.a.meleeDefense=10;f.t.fatigue=0;
    const dazed=game.attackHitChance(f.b,f.t,f.a,w);const plain={...f.t,affixDazedTurns:0};assert.ok(game.attackHitChance(f.b,plain,f.a,w)>dazed);
  }
});

test('head chance boosts are relative and preserve head/body-forcing skills',()=>{
  for(const grade of [25,50]){const f=fight({profile:{headChancePct:grade}}),w=game.getItem(f.a.equipment.weapon);assert.equal(game.getHeadHitChance(f.a,w),.22*(1+grade/100));assert.equal(game.getHeadHitChance(f.a,w,{head:false}),0);assert.equal(game.getHeadHitChance(f.a,w,{head:true}),1);assert.equal(game.getHeadHitChance(f.a,w,{id:'puncture'}),0);}
});

test('shield damage grades scale real shield impacts and durability bonus survives forging exactly',()=>{
  const damage=boost=>{const f=fight({profile:boost?{shieldDamagePct:boost}:{},weapon:'wood-axe'});f.t.equipment.shield='kite-shield';f.t.shieldDurability=f.t.maxShieldDurability=game.shieldMaximum('kite-shield');game.advanceBattle(f.s);return f.b.lastEvent.shieldDamage;};
  const base=damage(0);assert.equal(damage(25),Math.ceil(base*1.25));assert.equal(damage(50),Math.ceil(base*1.5));
  const plain=forged('round-shield',{shieldDurability:11}),boost=forged('round-shield',{shieldDurability:11,shieldHealthPct:25});assert.equal(boost.durability,Math.ceil(plain.durability*1.25));assert.deepEqual(extractForgeProfile(boost,catalog),{shieldDurability:11,shieldHealthPct:25});
});

test('injury prefix lowers thresholds alone and combines with Crippling Strikes',()=>{
  let alone=false,combined=false;
  for(const maxHp of [100,120,140,160,180,200]){
    const wounded=(prefix,perk)=>{const f=fight({profile:prefix?{injuryThreshold:17}:{},perks:perk?['crippling-strikes']:[]});f.t.maxHp=f.t.hp=maxHp;game.advanceBattle(f.s);return f.t.injuries?.length??0;};
    alone ||= wounded(true,false)>wounded(false,false);combined ||= wounded(true,true)>wounded(false,true);
  }
  assert.ok(alone);assert.ok(combined);
});

test('Masterful grants matching mastery AP/fatigue effects without spending or duplicating a perk',()=>{
  for(const [weapon,mastery] of [['arming-sword','sword-training'],['light-crossbow','crossbow-mastery']]){
    const f=hit({weapon,profile:{perkFlags:perkFlags([mastery])}}),base=hit({weapon});assert.equal(f.a.ap,base.a.ap+1);assert.ok(f.a.fatigue<base.a.fatigue);assert.deepEqual(f.p.perks,[]);
    const learned=hit({weapon,profile:{perkFlags:perkFlags([mastery])},perks:[mastery]});assert.equal(learned.a.ap,f.a.ap);assert.deepEqual(reload(f.s),f.s);
  }
});

test('Agile Defense threshold extends by three and requires Agile Defense',()=>{
  const unit={equipment:{armor:forged('brigandine',{weight:7,agileThreshold:3}).id,helmet:null},perks:['agile-defense']};assert.equal(game.getAgileDefenseMultiplier(unit),.4);
  unit.equipment.armor=forged('brigandine',{weight:7}).id;assert.ok(game.getAgileDefenseMultiplier(unit)>.4);
  unit.equipment.armor=forged('brigandine',{weight:7,agileThreshold:3}).id;unit.perks=[];assert.equal(game.getAgileDefenseMultiplier(unit),1);
});

test('Last Stand adds ten defense at half health; Anticipation adds five percentage points per tile',()=>{
  const f=fight(),weapon=game.getItem('light-crossbow');Object.assign(f.a,{rangedSkill:85,q:2,r:5});Object.assign(f.t,{q:6,r:5,rangedDefense:30,meleeDefense:10,perks:['last-stand'],hp:150});
  f.t.equipment.armor=forged('leather-vest',{lastStand:10}).id;const boost=game.attackHitChance(f.b,f.a,f.t,weapon);f.t.equipment.armor='leather-vest';assert.equal(game.attackHitChance(f.b,f.a,f.t,weapon)-boost,10);
  f.t.hp=151;f.t.equipment.armor=forged('leather-vest',{lastStand:10}).id;const healthy=game.attackHitChance(f.b,f.a,f.t,weapon);f.t.equipment.armor='leather-vest';assert.equal(game.attackHitChance(f.b,f.a,f.t,weapon),healthy);
  f.t.perks=['anticipation'];f.t.equipment.armor=forged('leather-vest',{anticipationPct:5}).id;const anticipated=game.attackHitChance(f.b,f.a,f.t,weapon);f.t.equipment.armor='leather-vest';assert.equal(game.attackHitChance(f.b,f.a,f.t,weapon)-anticipated,6);
});

test('Volley Fire enhancement activates at two tiles, ranged accuracy uses flat +5/+8',()=>{
  const ranged=(boost,perk)=>{const f=fight({profile:boost?{volleyDistance:1}:{},weapon:'light-crossbow',perks:perk?['volley-fire']:[]});f.t.q=7;f.a.rangedSkill=200;game.advanceBattle(f.s);return f.b.lastEvent.hpDamage;};
  assert.ok(ranged(true,true)>ranged(false,true));assert.equal(ranged(true,false),ranged(false,false));
  for(const grade of [5,8]){const f=fight({profile:{rangedHit:grade},weapon:'light-crossbow'});f.a.rangedSkill=45;const w=game.getItem(f.a.equipment.weapon),chance=game.attackHitChance(f.b,f.a,f.t,w);f.a.equipment.weapon=forged('light-crossbow',{accuracy:1}).id;assert.equal(chance-game.attackHitChance(f.b,f.a,f.t,game.getItem(f.a.equipment.weapon)),grade);}
});

test('Longshot extends bow, crossbow and thrown targeting by one with a real 12% damage tradeoff',()=>{
  for(const weapon of ['hunting-bow','light-crossbow','throwing-axes']){
    const f=fight({weapon,profile:{rangedReach:1}});const w=game.getItem(f.a.equipment.weapon);f.t.q=f.a.q+w.range+1;f.a.rangedSkill=200;f.a.ap=4;game.advanceBattle(f.s);assert.equal(f.b.lastEvent.type,'attack');assert.equal(f.b.lastEvent.targetId,f.t.id);
    const short=fight({weapon});short.t.q=short.a.q+game.getItem(short.a.equipment.weapon).range+1;short.a.rangedSkill=200;short.a.ap=4;game.advanceBattle(short.s);assert.notEqual(short.b.lastEvent.type,'attack');
    assert.ok(hit({weapon,profile:{rangedReach:1}}).b.lastEvent.hpDamage<hit({weapon}).b.lastEvent.hpDamage);
  }
});

test('agile climbing removes elevation surcharges while keeping normal movement and fatigue costs',()=>{
  const move=boost=>{const f=fight({armor:boost?forged('leather-vest',{heightRelief:1}):null});f.a.q=1;f.a.r=1;f.t.q=5;f.t.r=1;f.b.tactic='advance-formation';for(const tile of f.b.field.tiles)if(tile.q>=2)tile.height=1;const before=f.a.ap;game.advanceBattle(f.s);assert.equal(f.b.lastEvent.type,'move');return {spent:before-f.a.ap,fatigue:f.a.fatigue};};
  const plain=move(false),agile=move(true);assert.ok(agile.spent<plain.spent);assert.ok(agile.spent>0);assert.ok(agile.fatigue>0);assert.ok(agile.fatigue<plain.fatigue);
});

test('extra AP starts and refreshes in both modes, is bounded, stacks with Berserk and reloads',()=>{
  for(const realtime of [false,true]){
    const f=fight({profile:{actionPoints:1,berserkAp:2},armor:forged('leather-vest',{actionPoints:1}),perks:['berserk'],realtime});assert.equal(f.a.ap,10);assert.equal(game.getTurnAp(f.a),10);f.t.hp=1;
    if(realtime)for(const u of f.b.units)f.b.simultaneous.actors[u.id].readyAt=u===f.a?0:1000;
    game.advanceBattle(f.s);assert.equal(f.b.lastEvent.effects.find(e=>e.id==='berserk').amount,6);assert.deepEqual(reload(f.s),f.s);
    f.a.ap=17;assert.throws(()=>reload(f.s),/battle stamina/);
  }
});

test('free bandaging and swapping grant existing one-per-round mechanics without learning them',()=>{
  const healing=fight({armor:forged('leather-vest',{perkFlags:perkFlags(['combat-bandaging'])}),setup:s=>{s.inventory.push('bandages');s.inventoryCondition.push(null);assert.ok(game.equipItem(s,'captain','bandages','accessory-1').ok);}});healing.a.hp=Math.floor(healing.a.maxHp*.4);const ap=healing.a.ap;game.advanceBattle(healing.s);assert.equal(healing.a.ap,ap);assert.equal(healing.a.accessories[0],null);assert.equal(healing.a.freeHealRound,healing.b.round);assert.deepEqual(healing.p.perks,[]);assert.deepEqual(reload(healing.s),healing.s);
  const swapping=fight({weapon:'light-crossbow',armor:forged('leather-vest',{perkFlags:perkFlags(['quick-hands'])}),setup:s=>equip(s,forged('arming-sword',{accuracy:1}),'reserve')});swapping.t.q=6;swapping.s.supplies.ammo=0;swapping.a.reload=1;game.advanceBattle(swapping.s);assert.equal(swapping.a.freeSwapRound,swapping.b.round);assert.equal(swapping.a.ap,9);assert.deepEqual(swapping.p.perks,[]);assert.deepEqual(reload(swapping.s),swapping.s);
});

test('free second attachment unlocks UI, combat and saves and safely stows when its grant is removed',()=>{
  const s=game.createGame(51),p=s.party[0],armor=forged('leather-vest',{perkFlags:perkFlags(['layered-armor'])});equip(s,armor);equip(s,game.getItem('scale-mantle'),'attachment-2');assert.ok(game.hasEquipmentPerk(p,'layered-armor'));assert.deepEqual(p.perks,[]);assert.match(companySheetHTML(s,p,'all',''),/data-equipment-location="attachment-2"/);assert.deepEqual(reload(s),s);
  const site=game.getCampSites(s)[0];s.position={x:site.x,y:site.y};assert.ok(game.startBattle(s,site.id).ok);assert.deepEqual(reload(s),s);
  const peaceful=game.createGame(51);equip(peaceful,armor);equip(peaceful,game.getItem('scale-mantle'),'attachment-2');peaceful.party[0].armorDurability.attachment2=12;equip(peaceful,game.getItem('mail-shirt'));assert.equal(peaceful.party[0].equipment.attachment2,null);assert.equal(peaceful.inventoryCondition[peaceful.inventory.indexOf('scale-mantle')],12);assert.deepEqual(reload(peaceful),peaceful);
});

test('legacy named gear, forge IDs and frozen champion generations retain their affix rules',()=>{
  assert.equal(game.getItem('famed5:arming-sword:123').affixPrefix.tier,undefined);assert.equal(game.getItem('famed3:arming-sword:123').affixPrefix,undefined);
  const old=forged('mail-shirt',{perkFlags:perkFlags(['pathfinder']),berserkAp:1});assert.ok(old.id.startsWith('forge2:'));assert.equal(old.id.split(':')[2].split('.').length,30);
  for(const malformed of [old.id.replace('forge2:','forge3:'),'famed7:fur-mantle:1','famed7:arming-sword:01'])assert.equal(game.getItem(malformed),undefined);
  const s=game.createGame(1),site=game.getCampSites(s).find(c=>c.id==='wild-camp-19');s.discoveryRolls[site.id]={cycle:site.generation,champion:0,famed:0,mount:0,championGearVersion:1,namedAffixVersion:1};const frozen=game.getCampSites(s).find(c=>c.id===site.id);assert.ok(frozen.enemies.some(e=>game.getItem(e.weapon)?.rollVersion===5));assert.ok(!frozen.enemies.some(e=>game.getItem(e.weapon)?.rollVersion===7));assert.deepEqual(reload(s),s);
});

test('AP enhancement refreshes and the head-hit daze expires on real turn and realtime transitions',()=>{
  const classic=fight({armor:forged('leather-vest',{actionPoints:1})});classic.a.ap=0;classic.a.stunnedTurns=1;classic.a.affixDazedTurns=2;game.advanceBattle(classic.s);assert.equal(classic.a.affixDazedTurns,1);
  // Ending the last fighter's turn wraps to a new round with the enhanced budget.
  classic.b.turnOrder=[...classic.b.turnOrder.filter(id=>id!==classic.a.id),classic.a.id];classic.b.activeId=classic.a.id;classic.b.turnIndex=classic.b.turnOrder.length-1;classic.a.stunnedTurns=1;game.advanceBattle(classic.s);assert.equal(classic.b.round,2);assert.equal(classic.a.affixDazedTurns,0);
  const realtime=fight({armor:forged('leather-vest',{actionPoints:1}),realtime:true});
  for(const u of realtime.b.units)realtime.b.simultaneous.actors[u.id].readyAt=12050;
  realtime.a.affixDazedTurns=2;realtime.b.simultaneous.actors[realtime.a.id].effects.affixDazedTurns=12000;
  for(let n=0;n<120;n++)game.advanceSimultaneousBattle(realtime.s,50);
  assert.equal(realtime.b.round,2);assert.equal(realtime.a.ap,10);assert.equal(realtime.a.affixDazedTurns,1);assert.deepEqual(reload(realtime.s),realtime.s);
  for(let n=0;n<120;n++)game.advanceSimultaneousBattle(realtime.s,50);
  assert.equal(realtime.a.affixDazedTurns,0);assert.equal(realtime.b.simultaneous.actors[realtime.a.id].effects.affixDazedTurns,undefined);assert.deepEqual(reload(realtime.s),realtime.s);
});

test('removing a helmet-based attachment grant preserves layer durability and rejects a full stash atomically',()=>{
  const s=game.createGame(51),p=s.party[0];equip(s,forged('leather-cap',{perkFlags:perkFlags(['layered-armor'])}));equip(s,game.getItem('scale-mantle'),'attachment-2');p.armorDurability.attachment2=11;
  while(s.inventory.length<game.getStashCapacity(s)-1){s.inventory.push('bandages');s.inventoryCondition.push(null);}
  const before=structuredClone(s);assert.equal(game.unequipItem(s,p.id,'helmet').ok,false);assert.deepEqual(s,before);
  s.inventory.pop();s.inventoryCondition.pop();assert.equal(game.unequipItem(s,p.id,'helmet').ok,true);assert.equal(p.equipment.attachment2,null);assert.equal(s.inventoryCondition[s.inventory.indexOf('scale-mantle')],11);assert.deepEqual(reload(s),s);
});

test('camp reward identities stay in the frozen old prefix pool across reload and retreat',()=>{
  const s=game.createGame(17),site=game.getCampSites(s).find(c=>c.id==='quarry-camp');s.discoveryRolls[site.id]={cycle:site.generation,champion:0,famed:0,mount:0,championGearVersion:1,namedAffixVersion:1};s.position={x:site.x,y:site.y};assert.ok(game.startBattle(s,site.id).ok);const id=s.battle.famedDrop;assert.match(id,/^famed5:/);assert.deepEqual(reload(s),s);assert.ok(game.retreatBattle(s).ok);assert.ok(game.finishBattle(s).ok);assert.ok(game.startBattle(s,site.id).ok);assert.equal(s.battle.famedDrop,id);assert.deepEqual(reload(s),s);
});
