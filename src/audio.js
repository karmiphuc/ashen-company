import { getItem } from './engine.js';
import { weaponSkillFamily } from './combat-skills.js';
const MUSIC_URL = new URL('../assets/audio/heartfelt-battle.mp3', import.meta.url).href;
export const EFFECT_NAMES = Object.freeze(['swing', 'metal', 'impact', 'cloth', 'sword-swish', 'heavy-swish', 'thrust',
  'bow-release', 'dagger-swish', 'axe-chop', 'chain', 'crossbow-release', 'sling-release', 'whip-release', 'reload',
  'shield-wood', 'armor-clang', 'armor-dent', 'blunt-hit', 'pierce-hit', 'cut-hit', 'hammer-hit']);
const EFFECT_URLS = Object.freeze(Object.fromEntries(EFFECT_NAMES.map(name => [name, new URL(`../assets/audio/${name}.mp3`, import.meta.url).href])));
const SETTINGS_KEY = 'ashen-company-audio-v1';
const PROFILES = {
  sword: ['sword-swish', 'cut-hit'], 'two-handed-sword': ['heavy-swish', 'cut-hit'], cleaver: ['heavy-swish', 'axe-chop'],
  dagger: ['dagger-swish', 'pierce-hit'], qatal: ['dagger-swish', 'pierce-hit'], spear: ['thrust', 'pierce-hit'],
  polearm: ['thrust', 'cut-hit'], axe: ['heavy-swish', 'axe-chop'], mace: ['heavy-swish', 'blunt-hit'],
  hammer: ['heavy-swish', 'hammer-hit'], flail: ['chain', 'blunt-hit'], whip: ['whip-release', 'cut-hit'],
  bow: ['bow-release', 'pierce-hit'], crossbow: ['crossbow-release', 'pierce-hit'], sling: ['sling-release', 'blunt-hit'],
};

export function combatSoundCue(event, duration = .55) {
  if (!event) return [];
  duration = Number.isFinite(duration) ? Math.max(.15, Math.min(2, duration)) : .55;
  const cue = (name, delay = 0, volume = .4, rate = 1) => ({ name, delay, volume, rate });
  function action(entry, offset = 0) {
    if (entry.type === 'use') return [cue('cloth', offset)];
    if (entry.skillName === 'Reload') return [cue('reload', offset), cue('crossbow-release', offset + duration * .5, .25)];
    if (!['attack', 'miss'].includes(entry.type)) return [];
    const weapon = getItem(entry.weaponId), family = weaponSkillFamily(weapon);
    const heavy = weapon?.twoHanded && !weapon.ranged;
    const profile = entry.skillName === 'Wolf Bite' ? ['thrust', 'pierce-hit']
      : family === 'throwing' ? entry.projectile === 'axe' || /axe/.test(weapon?.trainingVisual ?? weapon?.visual ?? '')
        ? ['heavy-swish', 'axe-chop'] : ['thrust', 'pierce-hit']
      : PROFILES[family] ?? ['swing', 'impact'];
    const cues = [cue(profile[0], offset, family === 'bow' ? .55 : .35, heavy ? .88 : 1)];
    if (family === 'crossbow') cues.push(cue('bow-release', offset + .025, .35, 1.2));
    if (family === 'flail') cues.push(cue('heavy-swish', offset + .02, .22));
    if (family === 'sling') cues.push(cue('thrust', offset + .04, .2, 1.15));
    // One contact per strike: misses stay silent unless a shield actually deflects it.
    const impacts = entry.affectedTargets ?? [entry];
    const contact = impacts.find(impact => impact.shieldDamage > 0)
      ?? impacts.find(impact => impact.armorDamage > 0)
      ?? impacts.find(impact => impact.hit === true || impact.type === 'attack' || !entry.affectedTargets && entry.type === 'attack');
    if (contact) cues.push(cue(contact.shieldDamage > 0 ? 'shield-wood' : contact.armorDamage > 0
      ? ['mace', 'hammer', 'axe', 'flail', 'sling'].includes(family) || heavy ? 'armor-dent' : 'armor-clang'
      : profile[1], offset + duration * .65, heavy ? .55 : .45));
    return cues;
  }
  return [...action(event), ...(event.reactions ?? []).slice(0, 3).flatMap((reaction, index) => action(reaction, .04 * (index + 1)))];
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
  function playEvent(event, duration) {
    if (!preferences.effects || !scene.active || !scene.playing || scene.hidden || context?.state !== 'running') return;
    const cues = combatSoundCue(event, duration), now = clock();
    if (!cues.length || now - lastEffectAt < 110) return;
    lastEffectAt = now;
    for (const cue of cues) {
      const buffer = buffers.get(cue.name);
      if (!buffer || voices.size >= 8) continue;
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
