import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SETTLEMENTS, MAX_COMPANY_SIZE, createGame, getRecruitOffers, recruit,
  getBackground, getTraits, getCompanyStats, getCampSites, travelTo, tick,
  startBattle, validateSave,
} from '../src/engine.js';
import { RECRUIT_BACKGROUNDS, RECRUIT_BACKGROUND_BY_ID, makeRecruitProfile } from '../src/recruits.js';

const STAT_KEYS = ['maxHp', 'meleeSkill', 'rangedSkill', 'meleeDefense', 'rangedDefense', 'maxFatigue', 'initiative', 'resolve'];

function approach(state, place) {
  const until = (state.day - 1) * 24 + state.hour + 48;
  for (const progress of Object.values(state.bands)) progress.defeatedUntil = until;
  assert.equal(travelTo(state, place.x, place.y).ok, true);
  for (let index = 0; index < 8 && state.destination; index++) tick(state, 12);
  assert.equal(state.destination, null);
}

test('daily recruit offers are deterministic, varied, visible, and pure', () => {
  const state = createGame(8801);
  const before = structuredClone(state);
  const offers = getRecruitOffers(state);
  assert.deepEqual(state, before);
  assert.deepEqual(offers, getRecruitOffers(state));
  assert.equal(offers.length, 3);
  assert.deepEqual(new Set(offers.map(offer => offer.background.role)), new Set(['frontline', 'ranged', 'support']));
  assert.equal(new Set(offers.map(offer => offer.background.id)).size, 3);

  for (const offer of offers) {
    assert.match(offer.id, /^hire:oakwatch:1:[0-2]$/);
    assert.ok(offer.cost >= 120 && offer.cost <= 540);
    assert.equal(offer.cost, offer.background.cost);
    assert.equal(offer.person.hp, offer.stats.maxHp);
    assert.equal(offer.person.level, 1);
    assert.deepEqual(offer.person.equipment, { armor: null, helmet: null, weapon: null, shield: null, attachment: null, attachment2: null, mount: null });
    assert.equal(offer.traits[0].kind, 'positive');
    assert.ok(offer.traits.length === 1 || offer.traits[1].kind === 'tradeoff');
    assert.deepEqual(getBackground(offer.person), offer.background);
    assert.deepEqual(getTraits(offer.person), offer.traits);

    const baseline = getCompanyStats({ ...offer.person, background: 'Untrained', backgroundId: undefined, traits: [] });
    const bonuses = [offer.background, ...offer.traits].reduce((total, entry) => {
      for (const [key, value] of Object.entries(entry.bonuses)) total[key] = (total[key] ?? 0) + value;
      return total;
    }, {});
    for (const key of STAT_KEYS) assert.equal(offer.stats[key] - baseline[key], bonuses[key] ?? 0, `${offer.person.name} ${key}`);
  }

  const pristine = structuredClone(offers);
  offers[0].person.name = 'Changed outside the engine';
  offers[0].background.bonuses.maxHp = 999;
  assert.deepEqual(getRecruitOffers(state), pristine);
});

test('hiring consumes only the selected offer and tomorrow refreshes the pool', () => {
  const state = createGame(8802);
  const offers = getRecruitOffers(state);
  const selected = offers[1];
  const untouched = [offers[0], offers[2]];
  const gold = state.gold;
  assert.equal(recruit(state, selected.id).ok, true);
  assert.equal(state.gold, gold - selected.cost);
  assert.deepEqual(state.party.at(-1), selected.person);
  assert.equal(state.recruitSerial, 1);
  assert.deepEqual(state.hiredRecruitOffers, [selected.id]);
  assert.deepEqual(getRecruitOffers(state), untouched);

  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  assert.deepEqual(getRecruitOffers(restored), untouched);

  assert.equal(tick(restored, 16).ok, true);
  assert.equal(restored.day, 2);
  const rolledOver = structuredClone(restored);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(restored))), rolledOver);
  const tomorrow = getRecruitOffers(restored);
  assert.equal(tomorrow.length, 3);
  assert.ok(tomorrow.every(offer => offer.id.includes(':2:')));
  assert.equal(recruit(restored, tomorrow[0].id).ok, true);
  assert.deepEqual(restored.hiredRecruitOffers, [tomorrow[0].id]);
});

test('explicit and shorthand hiring validate atomically', () => {
  const state = createGame(8803);
  const first = getRecruitOffers(state)[0];
  const beforeUnknown = structuredClone(state);
  assert.equal(recruit(state, 'hire:oakwatch:1:9').ok, false);
  assert.deepEqual(state, beforeUnknown);

  state.gold = first.cost - 1;
  const beforePoor = structuredClone(state);
  assert.equal(recruit(state, first.id).ok, false);
  assert.deepEqual(state, beforePoor);

  state.gold = 100000;
  assert.equal(recruit(state).ok, true);
  assert.equal(state.party.at(-1).id, first.person.id);

  while (state.party.length < MAX_COMPANY_SIZE) {
    if (!getRecruitOffers(state).length) state.day += 1;
    assert.equal(recruit(state, getRecruitOffers(state)[0].id).ok, true);
  }
  state.day += 1;
  const full = structuredClone(state);
  assert.equal(recruit(state, getRecruitOffers(state)[0].id).ok, false);
  assert.deepEqual(state, full);

  const away = createGame(8804);
  away.position = { x: 400, y: 400 };
  const beforeAway = structuredClone(away);
  assert.equal(recruit(away).ok, false);
  assert.deepEqual(away, beforeAway);
});

test('stale, wrong-town, and consumed offers are rejected atomically', () => {
  const state = createGame(8810);
  const dayOne = getRecruitOffers(state)[0];
  const otherTownState = structuredClone(state);
  const greyhaven = SETTLEMENTS.find(town => town.id === 'greyhaven');
  otherTownState.position = { x: greyhaven.x, y: greyhaven.y };
  const wrongTown = getRecruitOffers(otherTownState)[0];

  const beforeWrongTown = structuredClone(state);
  assert.equal(recruit(state, wrongTown.id).ok, false);
  assert.deepEqual(state, beforeWrongTown);

  assert.equal(tick(state, 16).ok, true);
  const beforeStale = structuredClone(state);
  assert.equal(recruit(state, dayOne.id).ok, false);
  assert.deepEqual(state, beforeStale);

  const current = getRecruitOffers(state)[0];
  assert.equal(recruit(state, current.id).ok, true);
  const beforeConsumed = structuredClone(state);
  assert.equal(recruit(state, current.id).ok, false);
  assert.deepEqual(state, beforeConsumed);
});

test('recruit bonuses feed the actual battle unit stats', () => {
  const state = createGame(8805);
  const selected = getRecruitOffers(state)[0];
  assert.equal(recruit(state, selected.id).ok, true);
  const member = state.party.find(person => person.id === selected.person.id);
  const expected = getCompanyStats(member);
  const camp = getCampSites(state)[0];
  approach(state, camp);
  assert.equal(startBattle(state, camp.id).ok, true);
  const unit = state.battle.units.find(entry => entry.id === member.id);
  for (const key of STAT_KEYS) assert.equal(unit[key], expected[key], key);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  const restoredMember = restored.party.find(person => person.id === member.id);
  const restoredUnit = restored.battle.units.find(entry => entry.id === member.id);
  assert.deepEqual(restoredMember.traits, member.traits);
  assert.equal(restoredMember.backgroundId, member.backgroundId);
  assert.deepEqual(getCompanyStats(restoredMember), expected);
  for (const key of STAT_KEYS) assert.equal(restoredUnit[key], expected[key], `restored ${key}`);
});

test('the deterministic catalog reaches every background and trait without canceling its positive trait', () => {
  const backgrounds = new Set();
  const traits = new Set();
  for (let seed = 1; seed <= 64; seed++) {
    const state = createGame(seed);
    for (let day = 1; day <= 8; day++) {
      state.day = day;
      for (const offer of getRecruitOffers(state)) {
        backgrounds.add(offer.background.id);
        for (const trait of offer.traits) traits.add(trait.id);
        const positive = offer.traits[0];
        const tradeoff = offer.traits[1];
        if (tradeoff) {
          for (const [stat, bonus] of Object.entries(positive.bonuses)) {
            if (bonus > 0) assert.ok((tradeoff.bonuses[stat] ?? 0) >= 0, `${positive.id} canceled by ${tradeoff.id}`);
          }
        }
        const baseline = getCompanyStats({ ...offer.person, background: 'Untrained', backgroundId: undefined, traits: [] });
        const totalBonuses = [offer.background, ...offer.traits].reduce((total, entry) => {
          for (const [key, value] of Object.entries(entry.bonuses)) total[key] = (total[key] ?? 0) + value;
          return total;
        }, {});
        for (const key of STAT_KEYS) assert.equal(offer.stats[key] - baseline[key], totalBonuses[key] ?? 0);
      }
    }
  }
  assert.ok(RECRUIT_BACKGROUNDS.filter(background => background.cost < 220).every(background => backgrounds.has(background.id)));
  assert.equal(traits.size, 12);
});

test('ordinary recruit backgrounds match settlement type while rare specialists remain available', () => {
  const ordinaryByKind = {
    town: new Set(['wayfarer', 'farmhand', 'sailor', 'tinker', 'pilgrim', 'deserter', 'caravan-guard', 'hunter', 'outrider', 'brawler']),
    village: new Set(['farmhand', 'brawler', 'tinker', 'hunter', 'wayfarer', 'pilgrim']),
    castle: new Set(['deserter', 'caravan-guard', 'hunter', 'outrider']),
  };
  const specialIds = new Set(RECRUIT_BACKGROUNDS.filter(background => background.cost >= 220).map(background => background.id));
  for (const [kind, ordinary] of Object.entries(ordinaryByKind)) {
    const seenOrdinary = new Set();
    const seenSpecial = new Set();
    for (let seed = 1; seed <= 64; seed++) {
      for (let day = 1; day <= 12; day++) {
        const slotCount = kind === 'village' ? 2 : 3;
        const profiles = Array.from({ length: slotCount }, (_, slot) => makeRecruitProfile(seed, 'oakwatch', day, slot, kind));
        assert.deepEqual(profiles, Array.from({ length: slotCount }, (_, slot) => makeRecruitProfile(seed, 'oakwatch', day, slot, kind)));
        const specials = profiles.filter(profile => specialIds.has(profile.backgroundId));
        assert.ok(specials.length <= 1, kind);
        for (const profile of profiles) {
          if (specialIds.has(profile.backgroundId)) seenSpecial.add(profile.backgroundId);
          else {
            assert.ok(ordinary.has(profile.backgroundId), `${kind}: ${profile.backgroundId}`);
            seenOrdinary.add(profile.backgroundId);
          }
        }
      }
    }
    assert.deepEqual(seenOrdinary, ordinary, kind);
    assert.deepEqual(seenSpecial, specialIds, kind);
  }
});

test('fantasy race bonuses and their hiring premiums double without changing other special backgrounds', () => {
  const fantasy = {
    'elf-wanderer': { cost: 460, bonuses: { rangedSkill: 16, initiative: 10, rangedDefense: 4 } },
    'half-orc-mercenary': { cost: 500, bonuses: { maxHp: 18, maxFatigue: 10, meleeSkill: 2 } },
    'dwarf-guard': { cost: 540, bonuses: { maxHp: 14, resolve: 10, meleeDefense: 6 } },
    'goblin-scout': { cost: 300, bonuses: { rangedSkill: 8, initiative: 12, rangedDefense: 6 } },
  };
  for (const [id, expected] of Object.entries(fantasy)) {
    const background = RECRUIT_BACKGROUND_BY_ID.get(id);
    assert.equal(background.cost, expected.cost, id);
    assert.deepEqual(background.bonuses, expected.bonuses, id);
  }
  assert.deepEqual(RECRUIT_BACKGROUND_BY_ID.get('samurai').bonuses, { meleeSkill: 8, meleeDefense: 4, initiative: 3 });
  assert.equal(RECRUIT_BACKGROUND_BY_ID.get('samurai').cost, 420);

  const specials = RECRUIT_BACKGROUNDS.filter(background => background.cost >= 220);
  const byId = Object.fromEntries(specials.map(background => [background.id, background.bonuses]));
  assert.equal(specials.length, 8);
  assert.equal(new Set(specials.map(background => JSON.stringify(background.bonuses))).size, specials.length);
  for (const background of specials) {
    assert.ok(Object.keys(background.bonuses).every(key => STAT_KEYS.includes(key)), background.id);
    const total = Object.values(background.bonuses).reduce((sum, value) => sum + value, 0);
    assert.ok(total >= 8 && total <= (fantasy[background.id] ? 30 : 16), `${background.id} bonus total: ${total}`);
  }

  assert.ok(byId['elf-wanderer'].rangedSkill > byId['goblin-scout'].rangedSkill);
  assert.ok(byId['goblin-scout'].initiative > byId['elf-wanderer'].initiative);
  assert.ok(byId['half-orc-mercenary'].maxHp > byId['dwarf-guard'].maxHp);
  assert.ok(byId['half-orc-mercenary'].maxFatigue > 0);
  assert.ok(byId['dwarf-guard'].resolve > 0 && byId['dwarf-guard'].meleeDefense > 0);
  assert.ok(byId.samurai.meleeSkill > byId.ronin.meleeSkill);
  assert.ok(byId.samurai.meleeDefense > byId.ronin.meleeDefense);
  assert.ok(byId.ronin.initiative > byId.samurai.initiative);
  assert.ok(byId.ninja.rangedSkill > 0 && byId.ninja.rangedDefense > 0);
  assert.ok(byId['elf-wanderer'].initiative > byId.ninja.initiative);
  assert.ok(byId['warrior-monk'].resolve > 0 && byId['warrior-monk'].maxFatigue > 0);
});

test('rare special recruits span towns and days while ordinary offers remain', () => {
  const found = new Map();
  const specials = RECRUIT_BACKGROUNDS.filter(background => background.cost >= 220);
  for (let seed = 1; seed <= 64; seed++) {
    const state = createGame(seed);
    for (let day = 1; day <= 24; day++) {
      state.day = day;
      for (const town of SETTLEMENTS) {
        state.position = { x: town.x, y: town.y };
        const offers = getRecruitOffers(state);
        const rare = offers.filter(offer => offer.cost >= 220);
        assert.equal(offers.length, town.kind === 'village' ? 2 : 3);
        assert.ok(rare.length <= 1);
        assert.ok(offers.filter(offer => offer.cost < 220).length >= offers.length - 1);
        for (const offer of rare) {
          assert.ok(offer.cost <= 540);
          assert.equal(offer.person.appearanceId, offer.background.appearanceId);
          if (!found.has(offer.background.id)) found.set(offer.background.id, { seed, day, town });
        }
      }
    }
    if (found.size === specials.length) break;
  }
  assert.deepEqual(new Set(found.keys()), new Set(specials.map(background => background.id)));

  for (const background of specials) {
    const { seed, day, town } = found.get(background.id);
    const state = createGame(seed);
    state.day = day;
    state.position = { x: town.x, y: town.y };
    state.gold = 1000;
    const offer = getRecruitOffers(state).find(entry => entry.background.id === background.id);
    const withoutBackground = getCompanyStats({ ...offer.person, background: 'Untrained', backgroundId: undefined });
    for (const key of STAT_KEYS) {
      assert.equal(offer.stats[key] - withoutBackground[key], background.bonuses[key] ?? 0, `${background.id} ${key}`);
    }
    assert.equal(recruit(state, offer.id).ok, true);
    assert.equal(state.gold, 1000 - background.cost);
    assert.equal(state.party.at(-1).appearanceId, background.appearanceId);
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
  }

  const { seed, day, town } = found.get('elf-wanderer');
  const state = createGame(seed);
  state.day = day;
  state.position = { x: town.x, y: town.y };
  state.gold = 1000;
  const offer = getRecruitOffers(state).find(entry => entry.background.id === 'elf-wanderer');
  assert.equal(recruit(state, offer.id).ok, true);
  const camp = getCampSites(state)[0];
  approach(state, camp);
  assert.equal(startBattle(state, camp.id).ok, true);
  const unit = state.battle.units.find(entry => entry.id === offer.person.id);
  assert.equal(unit.appearanceId, 'elf');
  const expectedStats = getCompanyStats(state.party.find(person => person.id === unit.id));
  for (const key of STAT_KEYS) assert.equal(unit[key], expectedStats[key], `special battle ${key}`);
  const restored = validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.battle.units.find(entry => entry.id === unit.id).appearanceId, 'elf');
  for (const mutate of [
    save => { save.party.find(person => person.id === unit.id).appearanceId = 'goblin'; },
    save => { save.battle.units.find(entry => entry.id === unit.id).appearanceId = 'goblin'; },
  ]) {
    const corrupted = structuredClone(state);
    mutate(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
});

test('old saves migrate without buffs and malformed hiring data is rejected', () => {
  const legacy = createGame(8806);
  const oldStats = legacy.party.map(getCompanyStats);
  delete legacy.hiredRecruitOffers;
  for (const person of legacy.party) delete person.traits;
  const migrated = validateSave(legacy);
  assert.deepEqual(migrated.hiredRecruitOffers, []);
  assert.ok(migrated.party.every(person => person.traits.length === 0 && person.backgroundId === undefined));
  assert.deepEqual(migrated.party.map(getCompanyStats), oldStats);

  const base = createGame(8807);
  const validOffer = getRecruitOffers(base)[0].id;
  const variants = [
    save => { save.hiredRecruitOffers = [validOffer, validOffer]; },
    save => { save.hiredRecruitOffers = ['hire:unknown:1:0']; },
    save => { save.hiredRecruitOffers = ['hire:oakwatch:2:0']; },
    save => {
      save.day = 2;
      save.hiredRecruitOffers = [
        ...SETTLEMENTS.flatMap(town => [0, 1, 2].map(slot => `hire:${town.id}:1:${slot}`)),
        'hire:oakwatch:2:0',
      ];
    },
    save => { save.party[0].backgroundId = 'unknown'; },
    save => { save.party[0].traits = ['unknown']; },
    save => { save.party[0].traits = ['tough']; },
  ];
  for (const mutate of variants) {
    const corrupted = structuredClone(base);
    mutate(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }

  const hired = createGame(8808);
  recruit(hired, getRecruitOffers(hired)[0].id);
  const recruitIndex = hired.party.length - 1;
  const hiredVariants = [
    save => { save.party[recruitIndex].backgroundId = 'unknown'; },
    save => { save.party[recruitIndex].background = 'Wrong label'; },
    save => { save.party[recruitIndex].traits = ['tough', 'tough']; },
    save => { save.party[recruitIndex].traits = ['hulking']; },
    save => { save.party[recruitIndex].traits = ['tough', 'hulking', 'quick']; },
  ];
  for (const mutate of hiredVariants) {
    const corrupted = structuredClone(hired);
    mutate(corrupted);
    assert.throws(() => validateSave(corrupted), /Invalid save/);
  }
});
