import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getCampSites, startBattle, advanceBattle, learnPerk, getPerkPoints, validateSave, getItem, PERKS, attackHitChance, getLoneWolfBonus, getOverwhelmMultiplier, getHeadHitChance, rotateBattleUnits } from '../src/engine.js';
import { battleHTML } from '../src/battle-view.js';

const ids=['rotation','overwhelm','lone-wolf','underdog','head-hunter'];
function fixture(perks=[],weapon='arming-sword') {
 const s=createGame(73),p=s.party[0];p.level=20;p.perks=perks;p.equipment.weapon=weapon;p.equipment.shield=null;p.armorDurability.shield=0;
 const site=getCampSites(s)[0];s.position={x:site.x,y:site.y};assert.equal(startBattle(s,site.id).ok,true);
 const b=s.battle,a=b.units.find(u=>u.id===p.id),t=b.units.find(u=>u.side==='enemy'),ally=b.units.find(u=>u.id==='guard');
 for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
 for(const [index,u] of b.units.entries())Object.assign(u,{q:15,r:index+10});
 Object.assign(a,{q:5,r:5,meleeSkill:200,rangedSkill:200,morale:50,fatigue:0,ap:9,turnStartedRound:b.round,skillPreference:'damage'});
 Object.assign(t,{q:getItem(weapon).ranged?8:6,r:5,hp:500,maxHp:500,bodyArmor:0,headArmor:0,attachmentArmor:0,attachment2Armor:0,meleeDefense:0,rangedDefense:0,morale:50,equipment:{...t.equipment,shield:null},shieldDurability:0,turnStartedRound:0});
 b.turnOrder=[a.id,t.id,...b.units.filter(u=>u!==a&&u!==t).map(u=>u.id)];b.turnIndex=0;b.activeId=a.id;b.rng=1972;
 return {s,b,a,t,ally,p};
}
function activate(b,a){b.activeId=a.id;b.turnIndex=b.turnOrder.indexOf(a.id);a.ap=9;}
function hit(s,a,seed=1972){activate(s.battle,a);s.battle.rng=seed;advanceBattle(s);return s.battle.lastEvent;}

test('all five perks are distinct, grouped, level-gated and learn/save for one point each',()=>{
 for(const id of ids){const perk=PERKS.find(x=>x.id===id);assert.ok(perk?.category&&perk.icon);const s=createGame(123),p=s.party[0];p.level=perk.minLevel-1;assert.equal(learnPerk(s,p.id,id).ok,false);p.level=perk.minLevel;const before=getPerkPoints(p);assert.equal(learnPerk(s,p.id,id).ok,true);assert.equal(getPerkPoints(p),before-1);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);}
});
test('Rotation swaps two occupied hexes for exactly 3 AP/25 fatigue without opportunity attacks',()=>{
 const {s,b,a,ally}=fixture(['rotation']);Object.assign(ally,{q:5,r:6});const from={q:a.q,r:a.r},to={q:ally.q,r:ally.r},allyAp=ally.ap,allyFatigue=ally.fatigue,hp=a.hp;
 a.shieldWallActive=ally.shieldWallActive=true;
 assert.equal(rotateBattleUnits(s,a.id,ally.id).ok,true);assert.deepEqual({q:a.q,r:a.r},to);assert.deepEqual({q:ally.q,r:ally.r},from);
 assert.equal(a.ap,6);assert.equal(a.fatigue,25);assert.equal(ally.ap,allyAp);assert.equal(ally.fatigue,allyFatigue);assert.equal(a.hp,hp);assert.equal(a.shieldWallActive,false);assert.equal(ally.shieldWallActive,false);
 assert.equal(b.lastEvent.skillName,'Rotation');assert.equal(b.lastEvent.reactions,undefined);
 const html=battleHTML(b,1,true);assert.match(html,/Rotation/);assert.equal((html.match(/action-move/g)||[]).length,2);
});
test('invalid Rotation requests are atomic: no perk, wrong side/turn, distance, stun, fatigue or cliff',()=>{
 for(const kind of ['perk','side','turn','distance','stun','fatigue','cliff']){
  const {s,b,a,ally,t}=fixture(['rotation']);Object.assign(ally,{q:5,r:6});
  if(kind==='perk')a.perks=[];if(kind==='side')ally.side='enemy';if(kind==='turn')b.activeId=t.id;if(kind==='distance')ally.q=10;if(kind==='stun')ally.stunnedTurns=1;if(kind==='fatigue')a.fatigue=a.maxFatigue-24;if(kind==='cliff')b.field.tiles.find(x=>x.q===ally.q&&x.r===ally.r).height=3;
  const before=structuredClone(s);assert.equal(rotateBattleUnits(s,a.id,ally.id).ok,false,kind);assert.deepEqual(s,before,kind);
 }
});
test('Rotation AI rescues an exposed wounded ally and does not swap them back',()=>{
 const {s,b,a,ally,t}=fixture(['rotation']);Object.assign(a,{q:5,r:5});Object.assign(ally,{q:6,r:5,hp:20});Object.assign(t,{q:7,r:5});
 assert.equal(advanceBattle(s).ok,true);assert.equal(b.lastEvent.skillName,'Rotation');assert.equal(a.q,6);assert.equal(ally.q,5);
 activate(b,a);advanceBattle(s);assert.notEqual(b.lastEvent.skillName,'Rotation');
});
test('surround bonus is +5 per extra adjacent attacker and Underdog also cancels Backstabber',()=>{
 const {b,a,t,ally}=fixture();a.meleeSkill=40;t.meleeDefense=20;const w=getItem(a.equipment.weapon),alone=attackHitChance(b,a,t,w);
 Object.assign(ally,{q:6,r:4});assert.equal(attackHitChance(b,a,t,w),alone+5);
 a.perks=['backstabber'];assert.equal(attackHitChance(b,a,t,w),alone+10);
 t.perks=['underdog'];assert.equal(attackHitChance(b,a,t,w),alone);
 t.perks=[];delete b.perkCombatVersion;assert.equal(attackHitChance(b,a,t,w),alone+5);
});
test('Lone Wolf activates without adjacent allies, counts NPC allies and ignores dead/escaped allies',()=>{
 const {b,a,ally}=fixture(['lone-wolf']);Object.assign(ally,{q:7,r:5});assert.equal(getLoneWolfBonus(b,a),.15);
 ally.q=6;assert.equal(getLoneWolfBonus(b,a),0);ally.ally=true;assert.equal(getLoneWolfBonus(b,a),0);
 ally.alive=false;assert.equal(getLoneWolfBonus(b,a),.15);ally.alive=true;ally.escaped=true;assert.equal(getLoneWolfBonus(b,a),.15);
});
test('Lone Wolf dynamically increases melee/ranged attack skill and defense',()=>{
 const {b,a,t}=fixture(['lone-wolf']);Object.assign(a,{meleeSkill:40,rangedSkill:40});Object.assign(t,{meleeDefense:20,rangedDefense:20});
 for(const id of ['arming-sword','hunting-bow']){const w=getItem(id),buff=attackHitChance(b,a,t,w);a.perks=[];const plain=attackHitChance(b,a,t,w);assert.equal(buff,plain+6);a.perks=['lone-wolf'];}
 a.perks=[];t.perks=['lone-wolf'];const defended=attackHitChance(b,a,t,getItem('arming-sword'));t.perks=[];assert.equal(attackHitChance(b,a,t,getItem('arming-sword')),defended+3);
});
test('Overwhelm stacks on hits and misses for later enemies and reduces both attack skills',()=>{
 const {s,b,a,t}=fixture(['overwhelm']);a.ap=4;a.fatigue=0;const first=hit(s,a);assert.equal(first.type,'attack');assert.deepEqual(t.overwhelmed,{round:1,stacks:1});
 a.meleeSkill=-100;a.ap=4;const second=hit(s,a,19000);assert.equal(second.type,'miss');assert.equal(t.overwhelmed.stacks,2);assert.equal(getOverwhelmMultiplier(b,t),.8);
 const w=getItem(t.equipment.weapon);t.morale=50;t.meleeSkill=40;t.rangedSkill=40;Object.assign(a,{meleeDefense:20,rangedDefense:20});
 for(const weapon of [w,getItem('hunting-bow')]){const debuffed=attackHitChance(b,t,a,weapon);delete t.overwhelmed;const plain=attackHitChance(b,t,a,weapon);assert.equal(plain-debuffed,8);t.overwhelmed={round:1,stacks:2};}
});
test('Overwhelm does not affect an enemy whose turn has already begun and expires after their turn',()=>{
 const {s,b,a,t}=fixture(['overwhelm']);t.turnStartedRound=b.round;hit(s,a);assert.equal(t.overwhelmed,undefined);
 t.overwhelmed={round:b.round,stacks:2};activate(b,t);t.fatigue=t.maxFatigue;advanceBattle(s);assert.equal(t.overwhelmed,undefined);
 t.overwhelmed={round:b.round-1,stacks:3};assert.equal(getOverwhelmMultiplier(b,t),1);
});
test('a multistrike applies one Overwhelm stack per skill, rather than one per impact',()=>{
 const {s,a,t}=fixture(['overwhelm'],'bb-named-three-headed-flail');hit(s,a);assert.equal(t.overwhelmed.stacks,1);
});
test('Head Hunter banks a head hit, guarantees the next hit and then consumes the bonus',()=>{
 const {s,b,a}=fixture(['head-hunter'],'bb-named-flail');a.ap=9;
 const first=hit(s,a);assert.equal(first.head,true);assert.equal(a.headHunterReady,true);
 assert.equal(getHeadHitChance(a,getItem('arming-sword')),1);
 a.equipment.weapon='arming-sword';const next=hit(s,a);assert.equal(next.head,true);assert.equal(a.headHunterReady,false);
 assert.equal(getHeadHitChance(a,getItem('arming-sword')),.22);
 assert.match(battleHTML(b),/Head Hunter|Mara/);
});
test('Head Hunter misses/body-only skills preserve the bank, and mount bites cannot use it',()=>{
 const {s,a,t}=fixture(['head-hunter']);a.headHunterReady=true;a.meleeSkill=-100;
 assert.equal(hit(s,a,19000).type,'miss');assert.equal(a.headHunterReady,true);
 assert.equal(getHeadHitChance(a,getItem('rondel-dagger'),{id:'puncture'}),0);
 assert.equal(getHeadHitChance(a,getItem('arming-sword'),{freeFollowup:true}),.22);
 assert.equal(getHeadHitChance(a,{headChance:.22}),.22);
 a.meleeSkill=200;a.equipment.weapon='rondel-dagger';t.bodyArmor=t.headArmor=200;a.ap=9;a.fatigue=0;
 assert.equal(hit(s,a).skillName,'Puncture');assert.equal(a.headHunterReady,true);
});
test('new battle perk metadata round-trips and malformed stacks/head flags are rejected',()=>{
 const s=createGame(73),p=s.party[0];p.level=20;p.perks=ids;
 const site=getCampSites(s)[0];s.position={x:site.x,y:site.y};startBattle(s,site.id);const b=s.battle,a=b.units.find(u=>u.id===p.id),t=b.units.find(u=>u.side==='enemy');
 a.headHunterReady=true;a.rotationRound=1;t.overwhelmed={round:1,stacks:2};assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
 for(const kind of ['head','stacks','round','version']){const bad=structuredClone(s),u=bad.battle.units.find(x=>x.id===p.id),enemy=bad.battle.units.find(x=>x.id===t.id);if(kind==='head')u.headHunterReady=1;if(kind==='stacks')enemy.overwhelmed.stacks=-1;if(kind==='round')enemy.overwhelmed.round=2;if(kind==='version')delete bad.battle.perkCombatVersion;assert.throws(()=>validateSave(bad),/battle/);}
 assert.match(battleHTML(b),/Overwhelmed ×2/);assert.match(battleHTML(b),/Head Hunter: next/);
});

test('Rotation event and both fighters round-trip after a real swap',()=>{
 const s=createGame(73),p=s.party[0];p.level=20;p.perks=['rotation'];
 const site=getCampSites(s)[0];s.position={x:site.x,y:site.y};startBattle(s,site.id);const b=s.battle,a=b.units.find(u=>u.id===p.id),ally=b.units.find(u=>u.id==='guard');
 for(const tile of b.field.tiles){tile.terrain='open';tile.height=0;}
 Object.assign(a,{q:5,r:5,ap:9,fatigue:0});Object.assign(ally,{q:5,r:6});activate(b,a);
 assert.equal(rotateBattleUnits(s,a.id,ally.id).ok,true);
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
});
test('new perk battles remain deterministic with save reload after every action',()=>{
 const s=createGame(271);for(const p of s.party){p.level=20;p.perks=ids;}
 const site=getCampSites(s)[0];s.position={x:site.x,y:site.y};startBattle(s,site.id);let loaded=validateSave(JSON.parse(JSON.stringify(s)));
 for(let i=0;i<80&&s.battle.status==='active';i++){advanceBattle(s);advanceBattle(loaded);assert.deepEqual(loaded,s);loaded=validateSave(JSON.parse(JSON.stringify(loaded)));assert.deepEqual(loaded,s);}
});

test('a wounded Rotation owner can withdraw behind a healthy ally who has no Rotation perk',()=>{
 const {s,b,a,ally,t}=fixture(['rotation']);Object.assign(a,{q:6,r:5,hp:20});Object.assign(ally,{q:5,r:5});Object.assign(t,{q:7,r:5});
 advanceBattle(s);assert.equal(b.lastEvent.skillName,'Rotation');assert.equal(a.q,5);assert.equal(ally.q,6);
});

test('ranged Overwhelm works at distance and area attacks debuff each later enemy once',()=>{
 const ranged=fixture(['overwhelm'],'hunting-bow');hit(ranged.s,ranged.a);assert.equal(ranged.t.overwhelmed.stacks,1);
 const {s,b,a,t}=fixture(['overwhelm'],'greatsword');const other=b.units.find(u=>u.side==='enemy'&&u!==t);Object.assign(other,{q:5,r:6,hp:500,maxHp:500,bodyArmor:0,headArmor:0});
 hit(s,a);assert.ok(b.lastEvent.affectedTargets?.length>=2);assert.equal(t.overwhelmed.stacks,1);assert.equal(other.overwhelmed.stacks,1);
});


test('Lone Wolf reacts immediately to all six adjacent hexes and distinguishes opposing units',()=>{
 const {b,a,ally}=fixture(['lone-wolf']);
 for(const [dq,dr] of [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]]){
  Object.assign(ally,{q:a.q+dq,r:a.r+dr,side:'company'});assert.equal(getLoneWolfBonus(b,a),0);
  ally.side='enemy';assert.equal(getLoneWolfBonus(b,a),.15);ally.side='company';
  ally.q=a.q+dq*2;ally.r=a.r+dr*2;assert.equal(getLoneWolfBonus(b,a),.15);
 }
 a.perks=[];assert.equal(getLoneWolfBonus(b,a),0);
});
