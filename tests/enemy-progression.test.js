import test from 'node:test';
import assert from 'node:assert/strict';
import { enemyProgression, enemyRosterSize } from '../src/enemy-progression.js';
import { createGame, getCampSites, getRoamingBands, startBattle, advanceBattle, validateSave } from '../src/engine.js';

function company(level, day, size = 3, seed = 7391) {
  const state = createGame(seed);
  const original = structuredClone(state.party[0]);
  while (state.party.length < size) state.party.push({ ...structuredClone(original), id: `fighter-${state.party.length}`, name: `Fighter ${state.party.length}` });
  for (const person of state.party) person.level = level;
  state.formation = Array.from({ length: 36 }, (_, index) => state.party[index]?.id ?? null);
  state.day = day;
  state.shipments = {};
  state.shipmentLegacyThroughDay = day;
  return state;
}

test('enemy growth needs both experienced fighters and campaign age', () => {
  assert.equal(enemyProgression(company(1, 200, 12), 3).rank, 0);
  assert.equal(enemyProgression(company(20, 1, 12), 3).rank, 0);
  assert.equal(enemyProgression(company(5, 14), 3).rank, 1);
  assert.equal(enemyProgression(company(7, 21), 3).rank, 2);
  assert.equal(enemyProgression(company(9, 28), 3).rank, 3);
  assert.equal(enemyProgression(company(20, 200, 12), 3).rank, 8);
  assert.equal(enemyProgression(company(30, 200, 15), 3).rank, 10);
  assert.equal(enemyProgression(company(20, 200, 12), 2).rank, 3);
});

test('enemy cavalry requires late campaign and high-level core, and never appears in easier tiers', () => {
  for (const [level, day] of [[1, 1], [8, 100], [20, 34]]) {
    assert.equal(enemyProgression(company(level, day), 3).cavalry, false);
  }
  assert.equal(enemyProgression(company(9, 35), 3).cavalry, true);
  for (const tier of [0, 1, 2]) assert.equal(enemyProgression(company(20, 200), tier).cavalry, false);
  for (let seed = 1; seed <= 100; seed++) {
    const early = company(1, 1, 3, seed);
    assert.ok([...getCampSites(early), ...getRoamingBands(early)].every(site => site.enemies.every(enemy => !enemy.mount)));
  }
});

test('starter bands and low-tier camps remain training encounters throughout the campaign', () => {
  const early = company(1, 1), late = company(20, 200, 12);
  const easy = state => [...getRoamingBands(state), ...getCampSites(state)].filter(site => site.difficulty <= 1)
    .map(site => [site.id, site.enemies.length, site.veteranRank]);
  // Time changes seeded respawn cycles for bands, so compare their permitted low-tier limits.
  assert.ok(easy(late).every(([, count, rank]) => count <= 4 && rank === 0));
  assert.equal(getCampSites(early)[0].enemies.length, getCampSites(late)[0].enemies.length);
});

test('strongest six avoid recruit dilution while casualties reduce the surviving core', () => {
  const state = company(11, 60, 6);
  const rank = enemyProgression(state, 3).rank;
  const novice = structuredClone(state.party[0]);
  state.party.push({ ...novice, id: 'novice', level: 1 });
  assert.equal(enemyProgression(state, 3).rank, rank);
  for (const person of state.party.slice(0, 6)) person.hp = 0;
  assert.equal(enemyProgression(state, 3).rank, 0);
});

test('late encounters add bounded veteran numbers and stats, deploy legally, and survive reload', () => {
  const early = company(1, 1), late = company(13, 42, 15);
  const encounterId = getCampSites(late).find(site => site.difficulty===3&&site.enemies.length===20).id;
  const enter = state => {
    const site = getCampSites(state).find(camp => camp.id === encounterId);
    state.position = { x: site.x, y: site.y };
    assert.equal(startBattle(state, site.id).ok, true);
    return state.battle.units.filter(unit => unit.side === 'enemy');
  };
  const initial = enter(early), veterans = enter(late);
  assert.equal(veterans.length, 20);
  assert.equal(veterans[1].maxHp - initial[1].maxHp, 40);
  assert.equal(veterans[1].meleeSkill - initial[1].meleeSkill, 20);
  assert.equal(veterans[1].meleeDefense - initial[1].meleeDefense, 10);
  assert.equal(new Set(late.battle.units.map(unit => `${unit.q}:${unit.r}`)).size, late.battle.units.length);
  const loaded = validateSave(JSON.parse(JSON.stringify(late)));
  assert.deepEqual(loaded.battle, late.battle);
  assert.equal(advanceBattle(loaded).ok, true);
  assert.doesNotThrow(() => validateSave(loaded));
});

test('legacy saves retain their twelve-enemy ownership limit', () => {
  const state = company(1, 1, 3);
  const site = getCampSites(state).find(camp => camp.id === 'hideout');
  state.position = { x: site.x, y: site.y };
  startBattle(state, site.id);
  delete state.battle.enemyScalingVersion;
  state.battle.units.find(unit => unit.side === 'enemy').id = 'enemy-13';
  assert.throws(() => validateSave(state), /battle unit ownership/);
});


test('elite roster growth is gated, scales with player numbers, reaches 18–20 and never exceeds 20',()=>{
 for(const size of [3,6,9,12,15,18]){
  const state=company(13,60,size);
  const sizes=[5,6,7].map(base=>enemyRosterSize(state,3,base));
  assert.ok(sizes.every(n=>n<=20));if(size>=15)assert.deepEqual(new Set(sizes),new Set([18,19,20]));
  if(size===3)assert.ok(Math.max(...sizes)<13);
  for(const tier of [0,1,2])assert.ok(enemyRosterSize(state,tier,5)<=12);
 }
 assert.equal(enemyRosterSize(company(1,200,18),3,6),6);assert.equal(enemyRosterSize(company(20,1,18),3,6),6);
 const state=company(13,60,15),before=JSON.stringify(state);
 const elites=[...getCampSites(state),...getRoamingBands(state)].filter(s=>s.difficulty===3);
 assert.ok(elites.some(s=>s.enemies.length===20));assert.ok(elites.some(s=>s.enemies.length===18));assert.ok(elites.every(s=>s.enemies.length<=20));assert.equal(JSON.stringify(state),before);
});
test('20-enemy battles and world casualties survive reload while enemy 21 is rejected',()=>{
 const state=company(13,60,15),site=getCampSites(state).find(s=>s.enemies.length===20);state.position={x:site.x,y:site.y};startBattle(state,site.id);
 const enemy=state.battle.units.find(u=>u.id==='enemy-20'),actor=state.battle.units.find(u=>u.side==='company');actor.aiTargetId=enemy.id;
 const loaded=validateSave(JSON.parse(JSON.stringify(state)));assert.deepEqual(loaded.battle,state.battle);assert.equal(loaded.battle.units.filter(u=>u.side==='company').length,15);
 const bad=structuredClone(state);bad.battle.units.find(u=>u.id==='enemy-20').id='enemy-21';assert.throws(()=>validateSave(bad),/battle unit ownership/);
 state.battle=null;state.worldLosses={[site.id]:{cycle:0,size:20,survivors:[0,19]}};assert.doesNotThrow(()=>validateSave(state));
});

test('18–20 troops require fifteen living deployed brothers, regardless of campaign age or veteran rank',()=>{
 for(const size of [3,6,9,12,14]){const s=company(30,300,size);for(const base of [5,6,7])assert.ok(enemyRosterSize(s,3,base)<=17,`${size} brothers cannot roll 18–20 enemies`);}
 const full=company(30,300,15);assert.equal(enemyRosterSize(full,3,6),20);
 const reserves=company(30,300,18);reserves.formation[14]=null;reserves.formation[15]=null;reserves.formation[16]=null;reserves.formation[17]=null;
 assert.ok(enemyRosterSize(reserves,3,6)<=17,'reserve headcount cannot unlock twenty');
 full.party[0].hp=0;assert.ok(enemyRosterSize(full,3,6)<=17,'a fallen deployed brother does not count');
});
