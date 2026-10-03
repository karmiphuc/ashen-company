import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createFamedItemId, ITEMS } from '../src/engine.js';
import { createHash } from 'node:crypto';
import { combatSoundCue, createGameAudio, EFFECT_NAMES } from '../src/audio.js';

const battle = { active: true, playing: true, hidden: false, battleId: 'battle-1' };
const flush = () => new Promise(resolve => setImmediate(resolve));
const emptyStorage = { getItem: () => null, setItem() {} };

function fakeMusic() {
  return {
    paused: true, plays: [], pauses: 0, currentTime: 0,
    play() { this.plays.push(this.volume); this.paused = false; return Promise.resolve(); },
    pause() { this.pauses++; this.paused = true; },
  };
}

function fakeContext() {
  const sources = [];
  const context = {
    state: 'suspended', currentTime: 4, destination: {}, sources,
    resume() { this.state = 'running'; return Promise.resolve(); },
    suspend() { this.state = 'suspended'; return Promise.resolve(); },
    decodeAudioData(data) { return Promise.resolve({ name: new TextDecoder().decode(data) }); },
    createBufferSource() {
      const source = {
        playbackRate: {}, connect() {}, disconnect() {}, stop() { this.stopped = true; },
        start(at) { this.at = at; sources.push(this); },
      };
      return source;
    },
    createGain() { return { gain: {}, connect() {}, disconnect() {} }; },
  };
  return context;
}

const fetcher = async url => ({
  ok: true,
  arrayBuffer: async () => new TextEncoder().encode(url.split('/').at(-1).replace('.mp3', '')).buffer,
});

test('audio preferences persist, ignore malformed storage, and tolerate unsupported audio', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const create = () => createGameAudio({ storage, createMusic: () => null, createContext: () => null });
  const first = create();
  assert.deepEqual(first.getPreferences(), { music: true, effects: true });
  first.toggle('music');
  first.toggle('effects');
  assert.deepEqual(create().getPreferences(), { music: false, effects: false });
  first.toggle('unknown');
  assert.deepEqual(first.getPreferences(), { music: false, effects: false });

  values.set('ashen-company-audio-v1', '{bad json');
  assert.deepEqual(create().getPreferences(), { music: true, effects: true });
  const brokenStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const unsupported = createGameAudio({ storage: brokenStorage, createMusic: () => null, createContext: () => null });
  assert.doesNotThrow(() => {
    unsupported.sync(battle);
    unsupported.unlock();
    unsupported.playEvent({ type: 'attack' });
    unsupported.toggle('effects');
  });
});

test('music stays silent before a gesture, then plays only during an active visible battle', async () => {
  const music = fakeMusic();
  const audio = createGameAudio({ createMusic: () => music, createContext: () => null, storage: emptyStorage });
  audio.sync(battle);
  assert.deepEqual(music.plays, []);
  audio.unlock();
  assert.deepEqual(music.plays, [0], 'gesture primes music silently');
  await flush();
  assert.equal(music.volume, .22, 'the silent prime becomes audible in battle');
  audio.sync({ ...battle, playing: false });
  assert.equal(music.paused, true, 'battle pause stops music');
  audio.sync({ ...battle, active: false });
  assert.equal(music.paused, true, 'leaving the battle stays quiet');
  audio.sync(battle);
  assert.equal(music.paused, false);
  audio.sync({ ...battle, hidden: true });
  assert.equal(music.paused, true, 'hidden app pauses music');
  audio.sync({ ...battle, hidden: false });
  assert.equal(music.paused, true, 'returning to the app waits for a gesture');
  audio.unlock();
  await flush();
  assert.equal(music.paused, false);
});

test('weapon families use distinct release and contact recordings, including named gear', () => {
  const cases = [['arming-sword','sword-swish','cut-hit'],['greatsword','heavy-swish','cut-hit'],
    ['rondel-dagger','dagger-swish','pierce-hit'],['spear','thrust','pierce-hit'],['wood-axe','heavy-swish','axe-chop'],
    ['winged-mace','heavy-swish','blunt-hit'],['warhammer','heavy-swish','hammer-hit'],
    ['whip','whip-release','cut-hit'],['northern-sling','sling-release','blunt-hit'],['javelins','thrust','pierce-hit'],['throwing-axes','heavy-swish','axe-chop'],['military-cleaver','heavy-swish','axe-chop'],['billhook','thrust','cut-hit'],['flail','chain','blunt-hit'],['hunting-bow','bow-release','pierce-hit'],['light-crossbow','crossbow-release','pierce-hit']];
  for (const [weaponId, release, contact] of cases) {
    const cues = combatSoundCue({type:'attack',weaponId});
    assert.equal(cues[0].name,release,weaponId);
    assert.equal(cues.at(-1).name,contact,weaponId);
    assert.ok(cues.every(cue=>EFFECT_NAMES.includes(cue.name)));
  }
  const named = createFamedItemId('warhammer',42);
  assert.equal(combatSoundCue({type:'attack',weaponId:named})[0].name,'heavy-swish');
  for(const weapon of ITEMS.filter(item=>item.slot==='weapon')) assert.ok(combatSoundCue({type:'attack',weaponId:weapon.id}).every(cue=>EFFECT_NAMES.includes(cue.name)),weapon.id);
});

test('misses, shield deflection, armor, area targets and reaction audio follow actual contacts', () => {
  assert.equal(combatSoundCue({type:'miss',weaponId:'hunting-bow'}).length,1);
  assert.equal(combatSoundCue({type:'miss',weaponId:'arming-sword',shieldDamage:18}).at(-1).name,'shield-wood');
  assert.equal(combatSoundCue({type:'attack',weaponId:'arming-sword',armorDamage:3}).at(-1).name,'armor-clang');
  assert.equal(combatSoundCue({type:'attack',weaponId:'winged-mace',armorDamage:3}).at(-1).name,'armor-dent');
  assert.equal(combatSoundCue({type:'miss',weaponId:'greatsword',affectedTargets:[{hit:false},{hit:true,hpDamage:20}]}).at(-1).name,'cut-hit');
  const counter = combatSoundCue({type:'move',reactions:[{type:'attack',skillName:'Riposte',weaponId:'arming-sword'}]},.275);
  assert.deepEqual(counter.map(cue=>cue.name),['sword-swish','cut-hit']);
  assert.equal(counter[1].delay,.04+.275*.65);
  assert.deepEqual(combatSoundCue({type:'use'}).map(cue=>cue.name),['cloth']);
  assert.equal(combatSoundCue({type:'recover',skillName:'Reload'})[0].name,'reload');
  assert.deepEqual(combatSoundCue({type:'move'}),[]);
});

test('effects require explicit events and stay within the voice and timing limits', async () => {
  const context = fakeContext();
  let now = 0;
  const audio = createGameAudio({ createMusic: () => null, createContext: () => context, fetcher, storage: emptyStorage, clock: () => now });
  audio.sync(battle);
  audio.unlock();
  await flush();
  audio.sync(battle);
  audio.sync(battle);
  assert.equal(context.sources.length, 0, 'sync and repaint do not play event audio');
  audio.playEvent({ type: 'attack', ranged: true, armorDamage: 0 });
  assert.deepEqual(context.sources.map(source => [source.buffer.name, source.at]), [['swing', 4], ['impact', 4 + .55 * .65]]);
  now = 50;
  audio.playEvent({ type: 'attack', armorDamage: 4 });
  assert.equal(context.sources.length, 2, 'rapid events are throttled');
  now = 120;
  audio.playEvent({ type: 'attack', armorDamage: 4 });
  assert.equal(context.sources.length, 4);
  now = 240;
  audio.playEvent({ type: 'attack', armorDamage: 4 });
  assert.equal(context.sources.length, 6);
  now = 350;
  audio.playEvent({type:'attack',reactions:[{type:'attack'}]});
  assert.equal(context.sources.length,8,'at most eight voices, including scheduled reactions');
  context.sources[0].onended();
  now = 470;
  audio.playEvent({ type: 'use' });
  assert.equal(context.sources.at(-1).buffer.name, 'cloth');
  audio.sync({ ...battle, playing: false });
  assert.ok(context.sources.at(-1).stopped, 'pausing stops active effects');
});

test('offline audio references are valid MP3s within the advertised download budget', async () => {
  const names = ['heartfelt-battle', ...EFFECT_NAMES];
  let bytes = 0;
  for (const name of names) {
    const file = fileURLToPath(new URL(`../assets/audio/${name}.mp3`, import.meta.url));
    const data = await readFile(file);
    bytes += data.length;
    assert.ok(data.length > 1000, `${name} is nonempty`);
    assert.ok(data.subarray(0, 3).toString() === 'ID3' || data[0] === 0xff && (data[1] & 0xe0) === 0xe0, `${name} has an MP3 header`);
  }
  assert.ok(bytes <= 1_450_000, `audio uses ${bytes} bytes`);
});


test('recorded effects have traceable licenses, hashes and different encoded samples', async () => {
  const manifest = JSON.parse(await readFile(new URL('../assets/audio/source-manifest.json',import.meta.url),'utf8'));
  const hashes = new Set();
  for(const name of EFFECT_NAMES){
    const entry = manifest.files.find(entry=>entry.path===`assets/audio/${name}.mp3`);
    assert.ok(entry?.author && entry.source.startsWith('https://'));
    assert.ok(['CC0-1.0','CC-BY-4.0'].includes(entry.license));
    const data=await readFile(new URL(`../${entry.path}`,import.meta.url));
    const hash=createHash('sha256').update(data).digest('hex');
    assert.equal(hash,entry.sha256);assert.equal(data.length,entry.bytes);
    assert.ok(!hashes.has(hash),`${name} has its own recording`);hashes.add(hash);
  }
});
