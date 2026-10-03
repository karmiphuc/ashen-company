import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getCompanyStats, getCampSites, getItem, startBattle, advanceBattle, resolveBattle, validateSave, setBattleTactic } from '../src/engine.js';
import { equipmentSkills } from '../src/combat-skills.js';
import { battleHTML } from '../src/battle-view.js';

function fight(mount = 'war-horse', distance = 3, weapon = 'arming-sword') {
  const state = createGame(7391), person = state.party[0];
  person.equipment.mount = mount; person.equipment.weapon = weapon;
  if (getItem(weapon).twoHanded) { person.equipment.shield = null; person.armorDurability.shield = 0; }
  const camp = getCampSites(state)[0]; state.position = { x: camp.x, y: camp.y }; startBattle(state, camp.id);
  const battle = state.battle, actor = battle.units.find(u => u.id === person.id), target = battle.units.find(u => u.side === 'enemy');
  for (const tile of battle.field.tiles) { tile.terrain = 'open'; tile.height = 0; }
  for (const unit of battle.units) if (unit !== actor && unit !== target) { unit.hp = 0; unit.alive = false; }
  Object.assign(actor, { q: 2, r: 3, meleeSkill: 200, turnStartedRound: 1, ap: 9, fatigue: 0 });
  Object.assign(target, { q: 2 + distance, r: 3, hp: 300, maxHp: 300, bodyArmor: 0, headArmor: 0,
    attachmentArmor: 0, meleeDefense: 0, rangedDefense: 0, morale: 60 });
  battle.activeId = actor.id; battle.turnIndex = battle.turnOrder.indexOf(actor.id); battle.rng = 1972;
  return { state, battle, actor, target };
}

test('all horses advertise Charge, wolves and wargs advertise their free bite', () => {
  for (const id of ['riding-horse', 'war-horse', 'armored-war-horse']) assert.equal(equipmentSkills(getItem(id))[0].id, 'charge');
  for (const id of ['warg-mount', 'dire-wolf-mount']) assert.equal(equipmentSkills(getItem(id))[0].id, 'wolf-bite');
});

test('Charge crosses two or three hexes for exactly 6 AP including with mastery, hits normally, stuns and pushes', () => {
  for (const distance of [3, 4]) {
    const { state, battle, actor, target } = fight('war-horse', distance);
    state.party[0].level = 30; state.party[0].perks = ['sword-training'];
    actor.perks = ['sword-training']; target.stunProtected = true;
    advanceBattle(state);
    assert.equal(battle.lastEvent.skillName, 'Charge'); assert.equal(battle.lastEvent.type, 'attack');
    assert.equal(actor.q, 2 + distance - 1); assert.equal(actor.ap, 3); assert.equal(target.q, 2 + distance + 1);
    assert.equal(target.stunnedTurns, 1); assert.equal(target.stunProtected, true); assert.ok(target.hp < 300);
    assert.deepEqual(battle.lastEvent.moveFrom, { q: 2, r: 3 });
    const html = battleHTML(battle, 1, true);
    assert.match(html, /battle-order">Charge/); assert.match(html, /action-move/); assert.match(html, /Stunned/);
    assert.deepEqual(validateSave(structuredClone(state)), state);
  }
});

test('a charge cannot jump trees, cliffs, allies, bend its route, exceed three steps or start too close', () => {
  for (const obstacle of ['tree', 'cliff', 'ally', 'bend', 'far', 'close', 'ap', 'fatigue']) {
    const { state, battle, actor, target } = fight('war-horse', obstacle === 'far' ? 5 : obstacle === 'close' ? 2 : 3);
    if (obstacle === 'tree') battle.field.tiles.find(t => t.q === 3 && t.r === 3).terrain = 'dense-trees';
    if (obstacle === 'cliff') battle.field.tiles.find(t => t.q === 3 && t.r === 3).height = 3;
    if (obstacle === 'ally') Object.assign(battle.units.find(u => u.id === 'guard'), { alive: true, hp: 60, q: 3, r: 3 });
    if (obstacle === 'bend') target.r++;
    if (obstacle === 'ap') actor.ap = 5;
    if (obstacle === 'fatigue') actor.fatigue = actor.maxFatigue - 1;
    advanceBattle(state); assert.notEqual(battle.lastEvent.skillName, 'Charge', obstacle);
  }
});

test('Charge supports all six straight directions and never pushes into an occupied hex', () => {
  for (const [q, r] of [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]) {
    const { state, battle, actor, target } = fight();
    Object.assign(actor, { q: 6, r: 6 }); Object.assign(target, { q: 6 + q * 3, r: 6 + r * 3 });
    const blocker = battle.units.find(u => u.id === 'guard');
    Object.assign(blocker, { alive: true, hp: 60, q: 6 + q * 4, r: 6 + r * 4 });
    advanceBattle(state); assert.equal(battle.lastEvent.skillName, 'Charge');
    assert.equal(target.q, 6 + q * 3); assert.equal(target.r, 6 + r * 3); assert.equal(target.stunnedTurns, 1);
    validateSave(structuredClone(state));
  }
});

test('Charge misses do not stun or push and an active Spearwall stops the rider before its attack', () => {
  const miss = fight(); miss.actor.meleeSkill = 0; miss.target.meleeDefense = 200; miss.battle.rng = 0;
  advanceBattle(miss.state); assert.equal(miss.battle.lastEvent.type, 'miss');
  assert.equal(miss.target.stunnedTurns, 0); assert.equal(miss.target.q, 5); assert.equal(miss.actor.ap, 3);
  const stopped = fight(); stopped.target.equipment.weapon = 'spear'; stopped.target.spearwallActive = true;
  stopped.target.meleeSkill = 200; stopped.actor.meleeDefense = 0;
  advanceBattle(stopped.state);
  assert.equal(stopped.battle.lastEvent.skillName, 'Charge'); assert.equal(stopped.battle.lastEvent.type, 'hold');
  assert.equal(stopped.battle.lastEvent.reactions[0].skillName, 'Spearwall');
  assert.equal(stopped.actor.q, 3); assert.equal(stopped.target.hp, 300); assert.equal(stopped.actor.ap, 3);
  validateSave(structuredClone(stopped.state));
});

test('formation tactics, ranged riders and old active battles never adopt Charge', () => {
  for (const tactic of ['defense', 'shield-wall', 'advance-formation']) {
    const f = fight(); setBattleTactic(f.state, tactic); advanceBattle(f.state);
    assert.notEqual(f.battle.lastEvent.skillName, 'Charge', tactic);
  }
  const ranged = fight('war-horse', 3, 'hunting-bow'); advanceBattle(ranged.state); assert.notEqual(ranged.battle.lastEvent.skillName, 'Charge');
  const old = fight(); delete old.battle.mountSkillsVersion; delete old.battle.mountBalanceVersion; advanceBattle(old.state); assert.notEqual(old.battle.lastEvent.skillName, 'Charge');
});

test('wolf bite follows a hit or miss once, costs no AP/fatigue/ammo and persists as an animated reaction', () => {
  for (const mount of ['dire-wolf-mount', 'warg-mount']) for (const miss of [false, true]) {
    const f = fight(mount, 1); f.actor.ap = 4;
    if (miss) { f.actor.meleeSkill = 0; f.target.meleeDefense = 200; f.battle.rng = 0; }
    const ammo = f.state.supplies.ammo;
    advanceBattle(f.state);
    assert.equal(f.battle.lastEvent.type, miss ? 'miss' : 'attack'); assert.equal(f.actor.ap, 0);
    assert.equal(f.actor.fatigue, getItem('arming-sword').fatigueCost ?? 11);
    assert.equal(f.state.supplies.ammo, ammo);
    assert.equal(f.battle.lastEvent.reactions.filter(r => r.skillName === 'Wolf Bite').length, 1);
    const html = battleHTML(f.battle, 1, true);
    assert.match(html, /action-bite/); assert.match(html, /battle-order">Wolf Bite/);
    assert.deepEqual(validateSave(structuredClone(f.state)), f.state);
  }
});

test('wolf bites do not reach distant enemies, follow an area attack only once, or trigger from counters', () => {
  const ranged = fight('dire-wolf-mount', 3, 'hunting-bow'); advanceBattle(ranged.state);
  assert.ok(!ranged.battle.lastEvent.reactions?.some(r => r.skillName === 'Wolf Bite'));
  const area = fight('dire-wolf-mount', 1, 'greatsword');
  const second = area.battle.units.find(u => u.side === 'enemy' && u !== area.target);
  Object.assign(second, { alive: true, hp: 300, maxHp: 300, q: 4, r: 3, bodyArmor: 0, headArmor: 0 });
  advanceBattle(area.state); assert.ok(area.battle.lastEvent.affectedTargets?.length >= 2);
  assert.equal(area.battle.lastEvent.reactions.filter(r => r.skillName === 'Wolf Bite').length, 1);
  const counter = fight('war-horse', 1); counter.target.equipment.mount = 'dire-wolf-mount';
  counter.target.riposteActive = true; counter.target.equipment.weapon = 'arming-sword';
  counter.actor.meleeSkill = 0; counter.target.meleeDefense = 200; counter.battle.rng = 0;
  advanceBattle(counter.state); assert.equal(counter.battle.lastEvent.reactions.length, 1);
  assert.equal(counter.battle.lastEvent.reactions[0].skillName, 'Riposte');
});

test('new mounted battles resolve identically with save reload after every action', () => {
  for (const mount of ['war-horse', 'dire-wolf-mount', 'warg-mount']) {
    const { state } = fight(mount); const instant = structuredClone(state); resolveBattle(instant);
    let stepped = validateSave(structuredClone(state)), steps = 0;
    while (stepped.battle.status === 'active' && steps++ < 1500) { advanceBattle(stepped); stepped = validateSave(structuredClone(stepped)); }
    assert.ok(steps < 1500); assert.deepEqual(stepped, instant);
  }
});

test('a wolf finisher credits its rider and grants Berserk AP immediately without spending ammo again', () => {
  const f = fight('dire-wolf-mount', 1, 'hunting-bow');
  f.state.party[0].level = 30; f.state.party[0].perks = ['berserk']; f.actor.perks = ['berserk'];
  f.actor.ap = 4; f.actor.rangedSkill = 0; f.target.rangedDefense = 200; f.target.hp = 1; f.battle.rng = 0;
  for (const tile of f.battle.field.tiles) if (!(tile.q === f.actor.q && tile.r === f.actor.r)
    && !(tile.q === f.target.q && tile.r === f.target.r)) tile.terrain = 'dense-trees';
  const ammo = f.state.supplies.ammo;
  advanceBattle(f.state);
  assert.equal(f.battle.lastEvent.type, 'miss'); assert.equal(f.battle.lastEvent.reactions[0].fallen, true);
  assert.equal(f.battle.xp[f.actor.id], 50); assert.equal(f.actor.ap, 4); assert.equal(f.actor.pendingBerserkAp, 0);
  assert.equal(f.state.supplies.ammo, ammo - 1); assert.ok(f.battle.log.some(entry => entry.includes('Wolf Bite')));
  assert.deepEqual(f.battle.lastEvent.reactions[0].effects,[{id:'berserk',amount:4}]);
  assert.equal(f.battle.lastEvent.reactions[0].weaponId,null);
});


test('each mount grants the requested distinct defenses, fatigue capacity and initiative', () => {
  const expected = { 'riding-horse': [5,-5,-5,0], 'war-horse': [10,-5,-5,0],
    'armored-war-horse': [20,5,-12,0], 'dire-wolf-mount': [5,5,0,3], 'warg-mount': [12,12,0,8] };
  const plain = createGame(7391), base = getCompanyStats(plain.party[0]);
  for (const [mount, values] of Object.entries(expected)) {
    const f = fight(mount);
    const stats = getCompanyStats(f.state.party[0]);
    assert.deepEqual(['meleeDefense','rangedDefense','maxFatigue','initiative'].map(key => stats[key] - base[key]), values);
    assert.equal(stats.meleeSkill, base.meleeSkill); assert.equal(stats.rangedSkill, base.rangedSkill);
    assert.equal(f.actor.maxFatigue, stats.maxFatigue);
    validateSave(structuredClone(f.state));
  }
});

test('riding and war horses boost melee and ranged damage while beasts do not', () => {
  for (const [weapon, distance] of [['arming-sword',1],['hunting-bow',3]]) {
    const amounts = {};
    for (const mount of [null,'riding-horse','war-horse','armored-war-horse','dire-wolf-mount','warg-mount']) {
      const f = fight(mount, distance, weapon); f.actor.rangedSkill = 200;
      advanceBattle(f.state); assert.equal(f.battle.lastEvent.type, 'attack');
      amounts[mount] = f.battle.lastEvent.hpDamage;
    }
    assert.ok(amounts['riding-horse'] > amounts.null, weapon);
    assert.ok(amounts['war-horse'] > amounts['riding-horse'], weapon);
    assert.equal(amounts['armored-war-horse'], amounts['war-horse'], weapon);
    assert.equal(amounts['dire-wolf-mount'], amounts.null, weapon);
    assert.equal(amounts['warg-mount'], amounts.null, weapon);
  }
});

test('all mounts spend exactly one AP on every legal movement step, including rough terrain', () => {
  for (const mount of ['riding-horse','war-horse','armored-war-horse','dire-wolf-mount','warg-mount']) {
    const f = fight(mount, 7); setBattleTactic(f.state, 'advance-formation');
    for (const tile of f.battle.field.tiles) tile.terrain = 'mud';
    for (let index = 0; index < 2; index++) {
      const ap = f.actor.ap, from = {q:f.actor.q,r:f.actor.r};
      advanceBattle(f.state);
      assert.equal(f.battle.lastEvent.type, 'move');
      assert.notDeepEqual({q:f.actor.q,r:f.actor.r}, from);
      assert.equal(f.actor.ap, ap - 1, mount);
      // Formation permits one step per round; start another activation for the cost assertion.
      f.battle.round++; f.actor.turnStartedRound = f.battle.round;
    }
  }
});

test('armored Charge deals extra weapon damage plus exactly 15 armor-bypassing HP and credits a trample kill', () => {
  for (const armor of [0,300]) {
    const a = fight('armored-war-horse'), b = fight('war-horse');
    for (const f of [a,b]) { f.target.bodyArmor = f.target.maxBodyArmor = armor; f.target.headArmor = f.target.maxHeadArmor = armor; }
    advanceBattle(a.state); advanceBattle(b.state);
    assert.equal(a.battle.lastEvent.skillName, 'Charge');
    assert.ok(a.battle.lastEvent.hpDamage >= b.battle.lastEvent.hpDamage + 15);
    assert.ok(a.battle.lastEvent.armorDamage >= b.battle.lastEvent.armorDamage);
    // The attack's second random roll determines base damage; compute penetration independently.
    let rng=1972;const roll=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
    roll();const weapon=getItem('arming-sword'),base=weapon.damageMin+Math.floor(roll()*(weapon.damageMax-weapon.damageMin+1));
    const head=roll()<.22,raw=Math.round(base*1.15*1.2);
    const wear=Math.max(1,Math.round(raw*(weapon.armorDamage??1)*(head?1.1:1)));
    let hp=armor>0?Math.max(1,Math.floor(raw*(weapon.armorPiercing??.30)-armor*.025)+Math.max(0,Math.floor((wear-armor)*.25))):raw;
    if(head)hp=Math.round(hp*1.25);
    assert.equal(a.battle.lastEvent.hpDamage,hp+15,'trample adds precisely 15 after armor and head modifiers');
  }
  // Compare actual HP results with the same armor, RNG and no head/armor reduction.
  const f = fight('armored-war-horse'); f.target.bodyArmor=f.target.maxBodyArmor; f.target.headArmor=f.target.maxHeadArmor;
  const probe=structuredClone(f.state); advanceBattle(probe);
  f.target.hp = probe.battle.lastEvent.hpDamage - 5;
  advanceBattle(f.state); assert.equal(f.target.alive,false);
  assert.equal(f.battle.lastEvent.fallen,true); assert.equal(f.battle.xp[f.actor.id],50);
  validateSave(structuredClone(f.state));
});

test('Howling rolls once after an attack, affects both sides only within three hexes, and refreshes without stacking', () => {
  let procs=0, example;
  for (let seed=0;seed<100;seed++) {
    const f=fight('warg-mount',1); f.battle.rng=seed*7919;
    const near=f.battle.units.find(unit=>unit.side==='enemy'&&unit!==f.target);
    Object.assign(near,{alive:true,hp:100,maxHp:100,q:5,r:3});
    const far=f.battle.units.find(unit=>unit.side==='enemy'&&unit!==f.target&&unit!==near);
    Object.assign(far,{alive:true,hp:100,maxHp:100,q:9,r:3});
    advanceBattle(f.state);
    if (!f.battle.lastEvent.effects?.some(effect=>effect.id==='howling')) continue;
    procs++; example ??= f;
    assert.equal(f.target.howlTurns,2); assert.equal(near.howlTurns,2);
    assert.equal(far.howlTurns,undefined); assert.equal(f.actor.howlTurns,undefined);
    assert.equal(f.battle.lastEvent.effects.filter(effect=>effect.id==='howling').length,1);
    assert.deepEqual(validateSave(structuredClone(f.state)),f.state);
  }
  assert.ok(procs >= 10 && procs <= 30, `expected an infrequent 20% proc, saw ${procs}`);
  assert.ok(example);
  const forged=structuredClone(example.state);forged.battle.units.find(unit=>unit.id===example.target.id).howlTurns=3;
  assert.throws(()=>validateSave(forged),/howl turns/);
});

test('Howled damage stays reduced for two complete activations and survives reloads', () => {
  const f=fight(null,1); f.actor.howlTurns=2; f.actor.ap=4;
  const plain=structuredClone(f.state); delete plain.battle.units.find(unit=>unit.id===f.actor.id).howlTurns;
  advanceBattle(plain); advanceBattle(f.state);
  assert.ok(f.battle.lastEvent.hpDamage < plain.battle.lastEvent.hpDamage);
  assert.equal(f.actor.howlTurns,1);
  let restored=validateSave(structuredClone(f.state));
  const actor=restored.battle.units.find(unit=>unit.id===f.actor.id);
  restored.battle.round++; actor.turnStartedRound=restored.battle.round;
  restored.battle.activeId=actor.id;restored.battle.turnIndex=restored.battle.turnOrder.indexOf(actor.id);actor.ap=4;
  advanceBattle(restored);assert.equal(actor.howlTurns,0);
  assert.deepEqual(validateSave(structuredClone(restored)),restored);
});

test('older mounted battles retain their damage and movement credits without adopting Howling', () => {
  const f=fight('warg-mount',1);delete f.battle.mountBalanceVersion;
  f.actor.movementCredit=4;f.battle.rng=0;
  const loaded=validateSave(structuredClone(f.state));advanceBattle(loaded);
  assert.equal(loaded.battle.mountBalanceVersion,undefined);
  assert.ok(!loaded.battle.lastEvent.effects?.some(effect=>effect.id==='howling'));
  assert.equal(loaded.battle.units.find(unit=>unit.id===f.actor.id).movementCredit,4);
});

test('enemy wargs can howl at the company and a second howl refreshes exactly two turns',()=>{
  let found;
  for(let seed=0;seed<100&&!found;seed++){
    const f=fight(null,1);f.target.equipment.mount='warg-mount';f.target.equipment.weapon='arming-sword';
    f.target.meleeSkill=200;f.actor.hp=f.actor.maxHp=300;f.actor.bodyArmor=0;f.actor.headArmor=0;
    f.battle.activeId=f.target.id;f.battle.turnIndex=f.battle.turnOrder.indexOf(f.target.id);f.battle.rng=seed*7919;
    advanceBattle(f.state);
    if(f.actor.howlTurns===2)found=f;
  }
  assert.ok(found,'enemy wargs use the same Howling proc');
  let refreshed;
  for(let seed=0;seed<100&&!refreshed;seed++){
    const state=structuredClone(found.state),b=state.battle;
    const rider=b.units.find(u=>u.id===found.target.id),victim=b.units.find(u=>u.id===found.actor.id);
    victim.howlTurns=1;victim.hp=300;rider.ap=4;rider.fatigue=0;b.rng=seed*7919;
    b.activeId=rider.id;b.turnIndex=b.turnOrder.indexOf(rider.id);
    advanceBattle(state);
    if(b.lastEvent.effects?.some(e=>e.id==='howling'))refreshed={state,victim};
  }
  assert.ok(refreshed);assert.equal(refreshed.victim.howlTurns,2);
  validateSave(structuredClone(refreshed.state));
});
