const MUSIC_URL = new URL('../assets/audio/heartfelt-battle.mp3', import.meta.url).href;
const EFFECT_URLS = Object.freeze(Object.fromEntries(['swing', 'metal', 'impact', 'cloth'].map(name => [name, new URL(`../assets/audio/${name}.mp3`, import.meta.url).href])));
const SETTINGS_KEY = 'ashen-company-audio-v1';

export function combatSoundCue(event) {
  if (!event) return [];
  if (event.type === 'use') return [{ name: 'cloth', delay: 0, volume: .4, rate: 1 }];
  if (!['attack', 'miss'].includes(event.type)) return [];
  const cues = [{ name: 'swing', delay: 0, volume: event.ranged ? .3 : .4, rate: event.ranged ? 1.5 : 1 }];
  if (event.type === 'attack') cues.push({ name: event.armorDamage > 0 ? 'metal' : 'impact', delay: event.ranged ? .14 : .08, volume: .5, rate: 1 });
  return cues;
}

export function createGameAudio({ createMusic = () => typeof Audio === 'function' ? new Audio(MUSIC_URL) : null,
  createContext = () => { const Context = globalThis.AudioContext || globalThis.webkitAudioContext; return Context ? new Context() : null; },
  fetcher = (...args) => fetch(...args), storage, clock = () => performance.now() } = {}) {
  let preferences = { music: true, effects: true };
  try { storage ??= globalThis.localStorage; const saved = JSON.parse(storage?.getItem(SETTINGS_KEY) || 'null');
    for (const key of ['music', 'effects']) if (typeof saved?.[key] === 'boolean') preferences[key] = saved[key];
  } catch {}
  let music = null, context = null, musicUnlocked = false, priming = false, loading = false;
  let scene = { active: false, playing: false, hidden: false, battleId: null }, lastEffectAt = -Infinity;
  const buffers = new Map(), voices = new Set();

  function stopEffects() {
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
  }
  function applyScene() {
    const audible = scene.active && scene.playing && !scene.hidden;
    if (!audible || !preferences.effects) stopEffects();
    if (music && !priming) {
      music.volume = .22;
      if (audible && preferences.music && musicUnlocked && music.paused) {
        Promise.resolve(music.play()).catch(() => { musicUnlocked = false; });
      } else if (!audible || !preferences.music) music.pause();
    }
    if (context) {
      if ((!audible || !preferences.effects) && context.state === 'running') Promise.resolve(context.suspend()).catch(() => {});
      else if (audible && preferences.effects && context.state === 'suspended') Promise.resolve(context.resume()).catch(() => {});
    }
  }
  async function loadEffects() {
    if (!context || loading) return;
    loading = true;
    await Promise.allSettled(Object.entries(EFFECT_URLS).map(async ([name, url]) => {
      const response = await fetcher(url);
      if (!response.ok) throw new Error('Sound unavailable');
      buffers.set(name, await context.decodeAudioData(await response.arrayBuffer()));
    }));
  }
  function unlock() {
    if (scene.hidden) return;
    if (preferences.effects) {
      try {
        context ??= createContext();
        if (context) { Promise.resolve(context.resume()).catch(() => {}); void loadEffects(); }
      } catch {}
    }
    if (preferences.music && !musicUnlocked && !priming) {
      try {
        music ??= createMusic();
        if (music) {
          music.loop = true; music.preload = 'none'; music.volume = 0;
          if (typeof document !== 'undefined' && !music.parentNode) { music.id = 'battle-music'; music.hidden = true; document.body.append(music); }
          priming = true;
          Promise.resolve(music.play()).then(() => { musicUnlocked = true; }).catch(() => {}).finally(() => { priming = false; applyScene(); });
        }
      } catch { priming = false; }
    }
    applyScene();
  }
  function sync(next) {
    if (next.hidden) musicUnlocked = false;
    if (next.battleId !== scene.battleId && music) { try { music.currentTime = 0; } catch {} }
    scene = { ...next };
    applyScene();
  }
  function playEvent(event) {
    if (!preferences.effects || !scene.active || !scene.playing || scene.hidden || context?.state !== 'running') return;
    const cues = combatSoundCue(event), now = clock();
    if (!cues.length || now - lastEffectAt < 110) return;
    lastEffectAt = now;
    for (const cue of cues) {
      const buffer = buffers.get(cue.name);
      if (!buffer || voices.size >= 3) continue;
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer; source.playbackRate.value = cue.rate; gain.gain.value = cue.volume;
      source.connect(gain); gain.connect(context.destination); voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); };
      source.start(context.currentTime + cue.delay);
    }
  }
  function toggle(kind) {
    if (!Object.hasOwn(preferences, kind)) return;
    preferences[kind] = !preferences[kind];
    try { storage?.setItem(SETTINGS_KEY, JSON.stringify(preferences)); } catch {}
    unlock(); applyScene();
  }
  return { unlock, sync, playEvent, toggle, getPreferences: () => ({ ...preferences }) };
}
