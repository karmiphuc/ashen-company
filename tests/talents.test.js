import test from 'node:test';
import assert from 'node:assert/strict';
import {makeTalents,talentGain,TALENT_ATTRIBUTES,RECRUIT_BACKGROUNDS} from '../src/recruits.js';
import {createGame,validateSave,getRecruitOffers,recruit,getCompanyStats,startBattle,finishBattle,resolveBattle,getLevelUp,trainAttributes,equipItem} from '../src/engine.js';
import {hiringHTML,companySheetHTML,levelUpHTML} from '../src/campaign-ui.js';
function oldRolls(seed,level){const hash=value=>{let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};return Object.fromEntries(TALENT_ATTRIBUTES.map(key=>[key,1+hash(`${seed}:${level}:${key}`)%5]));}
function pending(s,levels=[2]){const p=s.party[0];p.level=levels.at(-1);p.trainingPoints=levels.length;p.pendingLevelUps=levels.map(level=>({level,rolls:Object.fromEntries(Object.entries(oldRolls(p.seed,level)).map(([k,v])=>[k,talentGain(v,p.talents?.[k]??0)]))}));return p;}
test('one and two stars add their exact bonus capped at five; three always grants five',()=>{
 for(let roll=1;roll<=5;roll++){assert.equal(talentGain(roll,0),roll);assert.equal(talentGain(roll,1),Math.min(5,roll+1));assert.equal(talentGain(roll,2),Math.min(5,roll+2));assert.equal(talentGain(roll,3),5);}
});
test('all backgrounds generate three distinct stable talents and all attributes and star tiers occur',()=>{
 const attributes=new Set(),tiers=new Set();
 for(const bg of RECRUIT_BACKGROUNDS)for(let seed=0;seed<256;seed++){
  const t=makeTalents(seed,bg.id);assert.deepEqual(t,makeTalents(seed,bg.id));assert.equal(Object.keys(t).length,3);
  for(const [k,v] of Object.entries(t)){assert.ok(TALENT_ATTRIBUTES.includes(k)&&v>=1&&v<=3);attributes.add(k);tiers.add(v);}
  if(bg.id==='samurai'){assert.ok(t.meleeSkill>=2&&t.meleeDefense>=2&&t.resolve>=1);}
  if(bg.cost>=700)assert.ok(t[bg.role==='ranged'?'rangedSkill':'meleeSkill']>=2);
 }
 assert.deepEqual(attributes,new Set(TALENT_ATTRIBUTES));assert.deepEqual(tiers,new Set([1,2,3]));
});
test('hired talents remain identical to the preview, do not change starting stats, and persist across saves and gear swaps',()=>{
 const s=createGame(8801);s.gold=5000;const o=getRecruitOffers(s)[0],before=structuredClone(s);assert.deepEqual(getRecruitOffers(s)[0].person.talents,o.person.talents);assert.deepEqual(s,before);
 assert.deepEqual(getCompanyStats({...o.person,talents:{}}),o.stats);assert.equal(recruit(s,o.id).ok,true);const p=s.party.at(-1);assert.deepEqual(p.talents,o.person.talents);assert.deepEqual(validateSave(s),s);const fixed={...p.talents};s.inventory.push('arming-sword');s.inventoryCondition.push(null);equipItem(s,p.id,'arming-sword');assert.deepEqual(p.talents,fixed);
});
test('real combat experience applies talents to every queued level and three-star rewards train exactly five',()=>{
 const s=createGame(73),p=s.party[0];p.talents={meleeSkill:1,meleeDefense:2,resolve:3};s.position={x:440,y:520};assert.equal(startBattle(s,'quarry-camp').ok,true);
 s.battle.units.filter(u=>u.side==='enemy').forEach(u=>{u.hp=0;u.alive=false;});resolveBattle(s);s.battle.xp[p.id]=350;assert.equal(finishBattle(s).ok,true);
 assert.ok(p.pendingLevelUps.length>=3);
 for(const e of p.pendingLevelUps){const raw=oldRolls(p.seed,e.level);for(const k of TALENT_ATTRIBUTES)assert.equal(e.rolls[k],talentGain(raw[k],p.talents[k]??0));}
 assert.deepEqual(validateSave(s),s);const gain=getLevelUp(p).rolls,old={...p.attributes};assert.equal(trainAttributes(s,p.id,['meleeSkill','meleeDefense','resolve']).ok,true);assert.equal(p.attributes.resolve-old.resolve,5);assert.equal(p.attributes.meleeSkill-old.meleeSkill,gain.meleeSkill);assert.equal(p.attributes.meleeDefense-old.meleeDefense,gain.meleeDefense);
});
test('legacy pending levels receive talents once without changing learned stats or current battle snapshots',()=>{
 const s=createGame(73),p=s.party[0];delete p.talents;pending(s,[2,3]);p.attributes.meleeSkill=9;const before=structuredClone(s),m=validateSave(s),q=m.party[0];assert.deepEqual(s,before);assert.deepEqual(q.talents,makeTalents(q.seed));assert.equal(q.attributes.meleeSkill,9);
 for(const e of q.pendingLevelUps){const raw=oldRolls(q.seed,e.level);for(const k of TALENT_ATTRIBUTES)assert.equal(e.rolls[k],talentGain(raw[k],q.talents[k]??0));}
 assert.deepEqual(validateSave(m),m);
 const fight=createGame(73);fight.position={x:440,y:520};startBattle(fight,'quarry-camp');const snapshot=structuredClone(fight.battle);fight.party.forEach(p=>delete p.talents);const loaded=validateSave(fight);assert.deepEqual(loaded.battle,snapshot);assert.ok(loaded.party.every(p=>Object.keys(p.talents).length===3));
});
test('legacy unspent points gain the same talents as a saved pending queue',()=>{
 const a=createGame(10);delete a.party[0].talents;pending(a,[2,3]);const b=structuredClone(a);delete b.party[0].pendingLevelUps;assert.deepEqual(validateSave(a).party[0],validateSave(b).party[0]);
});
test('malformed talents and forged boosted pending rolls are rejected',()=>{
 for(const talents of [null,[],{unknown:1,maxHp:2,resolve:3},{maxHp:0,resolve:1,meleeSkill:2},{maxHp:4,resolve:1,meleeSkill:2},{maxHp:1.5,resolve:1,meleeSkill:2},{maxHp:1},Object.fromEntries(TALENT_ATTRIBUTES.map(k=>[k,3]))]){const s=createGame(3);s.party[0].talents=talents;assert.throws(()=>validateSave(s),/Invalid save/);}
 const s=createGame(73),p=pending(s);p.pendingLevelUps[0].rolls.resolve=p.pendingLevelUps[0].rolls.resolve%5+1;assert.throws(()=>validateSave(s),/Invalid save/);
});
test('hiring, company and level-up screens expose stars with accessible descriptions and all eight stats',()=>{
 const s=createGame(73),p=pending(s);p.talents={meleeSkill:1,meleeDefense:2,resolve:3};pending(s);
 for(const html of [companySheetHTML(s,p,'all',''),levelUpHTML(p)])for(const n of [1,2,3])assert.ok(html.includes(`aria-label="${n}-star talent"`));
 const hiring=hiringHTML(s,getRecruitOffers(s));assert.match(hiring,/Resolve/);assert.match(hiring,/talent-stars/);assert.match(hiring,/guarantees \+5/);assert.match(levelUpHTML(p),/guarantee \+5/);
});
test('Samurai is an elite 2000-crown hire with stronger actual combat stats and a matching daily wage',()=>{
 let s,o;outer:for(let seed=1;seed<100;seed++){s=createGame(seed);for(let day=1;day<40;day++){s.day=day;o=getRecruitOffers(s).find(x=>x.background.id==='samurai');if(o)break outer;}}
 assert.ok(o);assert.equal(o.cost,2000);assert.ok(o.stats.meleeSkill>=70&&o.stats.meleeDefense>=15&&o.stats.resolve>=52&&o.stats.maxFatigue>=108);assert.equal(o.stats.dailyWage,15);const poor=structuredClone(s);assert.equal(recruit(s,o.id).ok,false);assert.deepEqual(s,poor);s.shipments={};s.gold=2000;assert.equal(recruit(s,o.id).ok,true);assert.equal(s.gold,0);assert.deepEqual(validateSave(s),s);
 s.position={x:440,y:520};startBattle(s,'quarry-camp');const u=s.battle.units.find(u=>u.id===o.person.id);assert.equal(u.meleeSkill,o.stats.meleeSkill);assert.equal(u.meleeDefense,o.stats.meleeDefense);
});
