import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRecruitName,RECRUIT_NAME_POOLS} from '../src/recruits.js';
import {createGame,getRecruitOffers,recruit,validateSave,SETTLEMENTS} from '../src/engine.js';
import {regionAt} from '../src/geography.js';
const given=name=>name.split(' ')[0];
function matches(name,culture){const [first,...family]=name.split(' '),p=RECRUIT_NAME_POOLS[culture];assert.ok(p.given.includes(first),`${name}: ${culture}`);assert.ok(p.family.includes(family.join(' ')),`${name}: ${culture}`);}

for(const background of ['samurai','ninja','ronin','warrior-monk'])test(`${background} uses Japanese names regardless of hiring region`,()=>{
 for(let seed=1;seed<=100;seed++)for(const culture of ['western','northern','southern'])matches(makeRecruitName(seed,background,{culture}),'japanese');
});

for(const [background,culture] of [['elf-wanderer','elf'],['dwarf-guard','dwarf'],['half-orc-mercenary','orc'],['goblin-scout','goblin']])test(`${background} has its own fantasy names`,()=>{
 for(let seed=1;seed<=60;seed++)matches(makeRecruitName(seed,background),culture);
});

test('ordinary northern, Sunlands and western recruits draw from their regional names',()=>{
 for(const [region,culture] of [['northern-highlands','northern'],['sunlands','southern'],['western-marches','western']]){
  const town=SETTLEMENTS.find(t=>regionAt(t.x,t.y).id===region);assert.ok(town);
  const s=createGame(73);s.position={x:town.x,y:town.y};
  for(let day=1;day<=12;day++){s.day=day;for(const offer of getRecruitOffers(s).filter(o=>o.cost<220))matches(offer.person.name,culture);}
 }
});

test('company and same-board first names do not repeat; rerolls preserve offer stats and seeds',()=>{
 for(let seed=1;seed<=100;seed++){
  const s=createGame(seed),initial=getRecruitOffers(s),target=initial[0];s.party[0].name=target.person.name;
  const before=structuredClone(s),offers=getRecruitOffers(s),firsts=[...s.party.map(p=>given(p.name)),...offers.map(o=>given(o.person.name))];
  assert.equal(new Set(firsts).size,firsts.length);assert.notEqual(offers[0].person.name,target.person.name);
  assert.equal(offers[0].person.seed,target.person.seed);assert.equal(offers[0].person.backgroundId,target.person.backgroundId);assert.deepEqual(offers[0].stats,target.stats);assert.deepEqual(s,before);
 }
});

test('hiring any board slot leaves the remaining names unchanged across save imports',()=>{
 for(const slot of [0,1,2]){
  const s=createGame(73);s.gold=50000;const offers=getRecruitOffers(s),expected=new Map(offers.map(o=>[o.id,o.person.name]));
  assert.ok(recruit(s,offers[slot].id).ok);
  for(const offer of getRecruitOffers(s))assert.equal(offer.person.name,expected.get(offer.id));
  assert.deepEqual(getRecruitOffers(validateSave(s)),getRecruitOffers(s));
 }
});

test('existing names including old western-named samurai remain unchanged',()=>{
 const s=createGame(73);s.party[0].name='Hugo Reed';s.party[0].backgroundId='samurai';s.party[0].background='Samurai';s.party[0].appearanceId='samurai';s.party[0].traits=['dexterous'];
 const before=structuredClone(s);getRecruitOffers(s);assert.deepEqual(s,before);assert.equal(validateSave(s).party[0].name,'Hugo Reed');
});

test('expanded pools produce broad variety and deterministic full names',()=>{
 const firsts=new Set(),full=new Set();
 for(let seed=1;seed<=1000;seed++){const name=makeRecruitName(seed,'farmhand');firsts.add(given(name));full.add(name);assert.equal(name,makeRecruitName(seed,'farmhand'));assert.ok(name.length<=80);}
 assert.ok(firsts.size>=90);assert.ok(full.size>=800);
});

test('when a given-name pool is exhausted the generator still finds an unused full name',()=>{
 const used=RECRUIT_NAME_POOLS.japanese.given.map(first=>`${first} Takeda`),name=makeRecruitName(73,'ninja',{usedNames:used});
 matches(name,'japanese');assert.ok(!used.includes(name));assert.equal(name,makeRecruitName(73,'ninja',{usedNames:used}));
});
