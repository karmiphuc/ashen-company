import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { combatSoundCue, createGameAudio } from '../src/audio.js';

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

test('combat cues distinguish misses, ranged flight, armor hits, and item use', () => {
  assert.deepEqual(combatSoundCue({ type: 'miss', ranged: false }), [
    { name: 'swing', delay: 0, volume: .4, rate: 1 },
  ]);
  assert.deepEqual(combatSoundCue({ type: 'attack', ranged: true, armorDamage: 0 }).map(cue => [cue.name, cue.delay]), [
    ['swing', 0], ['impact', .14],
  ]);
  assert.deepEqual(combatSoundCue({ type: 'attack', ranged: false, armorDamage: 3 }).map(cue => cue.name), ['swing', 'metal']);
  assert.deepEqual(combatSoundCue({ type: 'miss', ranged: true, shieldDamage: 18 }).map(cue => cue.name), ['swing', 'metal']);
  assert.deepEqual(combatSoundCue({ type: 'use' }).map(cue => cue.name), ['cloth']);
  assert.deepEqual(combatSoundCue({ type: 'movement' }), []);
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
  assert.deepEqual(context.sources.map(source => [source.buffer.name, source.at]), [['swing', 4], ['impact', 4.14]]);
  now = 50;
  audio.playEvent({ type: 'attack', armorDamage: 4 });
  assert.equal(context.sources.length, 2, 'rapid events are throttled');
  now = 120;
  audio.playEvent({ type: 'attack', armorDamage: 4 });
  assert.equal(context.sources.length, 3, 'at most three voices play together');
  now = 240;
  audio.playEvent({ type: 'attack', armorDamage: 4 });
  assert.equal(context.sources.length, 3);
  context.sources[0].onended();
  now = 360;
  audio.playEvent({ type: 'use' });
  assert.equal(context.sources.at(-1).buffer.name, 'cloth');
  audio.sync({ ...battle, playing: false });
  assert.ok(context.sources.at(-1).stopped, 'pausing stops active effects');
});

test('offline audio references are valid MP3s within the advertised download budget', async () => {
  const names = ['heartfelt-battle', 'swing', 'metal', 'impact', 'cloth'];
  let bytes = 0;
  for (const name of names) {
    const file = fileURLToPath(new URL(`../assets/audio/${name}.mp3`, import.meta.url));
    const data = await readFile(file);
    bytes += data.length;
    assert.ok(data.length > 1000, `${name} is nonempty`);
    assert.ok(data.subarray(0, 3).toString() === 'ID3' || data[0] === 0xff && (data[1] & 0xe0) === 0xe0, `${name} has an MP3 header`);
  }
  assert.ok(bytes <= 1_300_000, `audio uses ${bytes} bytes`);
});
