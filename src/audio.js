import { getItem } from './engine.js';
import { weaponSkillFamily } from './combat-skills.js';
const MUSIC_URL = new URL('../assets/audio/heartfelt-battle.mp3', import.meta.url).href;
export const EFFECT_NAMES = Object.freeze(['swing', 'metal', 'impact', 'cloth', 'sword-swish', 'heavy-swish', 'thrust',
  'bow-release', 'dagger-swish', 'axe-chop', 'chain', 'crossbow-release', 'sling-release', 'whip-release', 'reload',
  'shield-wood', 'armor-clang', 'armor-dent', 'blunt-hit', 'pierce-hit', 'cut-hit', 'hammer-hit', 'flesh-hit', 'arrow-pierce', 'throwing-pierce', 'bolt-pierce',
  'slash-hit', 'cavalry-hooves', 'charge-hit', 'shield-blunt', 'shield-slash', 'shield-pierce', 'armor-blunt', 'armor-slash', 'armor-pierce', 'flesh-pierce']);
const EFFECT_URLS = Object.freeze(Object.fromEntries(EFFECT_NAMES.map(name => [name, new URL(`../assets/audio/${name}.mp3`, import.meta.url).href])));
const SETTINGS_KEY = 'ashen-company-audio-v1';
const PROFILES = {
  sword: ['sword-swish', 'slash-hit'], 'two-handed-sword': ['heavy-swish', 'slash-hit'], cleaver: ['heavy-swish', 'axe-chop'],
  dagger: ['dagger-swish', 'pierce-hit'], qatal: ['dagger-swish', 'pierce-hit'], spear: ['thrust', 'pierce-hit'],
  polearm: ['thrust', 'slash-hit'], axe: ['heavy-swish', 'axe-chop'], mace: ['heavy-swish', 'blunt-hit'],
  hammer: ['heavy-swish', 'hammer-hit'], flail: ['chain', 'blunt-hit'], whip: ['whip-release', 'slash-hit'],
  bow: ['bow-release', 'arrow-pierce'], crossbow: ['crossbow-release', 'bolt-pierce'], sling: ['sling-release', 'blunt-hit'],
};

export function combatSoundCue(event, duration = .55, {cinematic=false} = {}) {
  if (!event) return [];
  duration = Number.isFinite(duration) ? Math.max(.15, Math.min(2, duration)) : .55;
  const cue = (name, delay = 0, volume = .4, rate = 1) => ({ name, delay, volume, rate });
  function action(entry, offset = 0) {
    if(entry.skillName==='Bleeding')return entry.hpDamage>0?[cue('flesh-hit',offset,.25)]:[];
    if(entry.strikes)return entry.strikes.flatMap((impact,index)=>action({...entry,...impact,type:impact.hit?'attack':'miss',strikes:undefined,skipRelease:index>0},offset+.06*index));
    if (entry.type === 'use') return [cue('cloth', offset)];
    if (entry.skillName === 'Reload') return [cue('reload', offset), cue('crossbow-release', offset + duration * .5, .25)];
    const charging = entry.skillName === 'Charge' && !!entry.moveFrom;
    if (!['attack', 'miss'].includes(entry.type)) return charging ? [cue('cavalry-hooves', offset, .42)] : [];
    const weapon = getItem(entry.weaponId), family = weaponSkillFamily(weapon);
    const heavy = weapon?.twoHanded && !weapon.ranged;
    const profile = entry.skillName === 'Wolf Bite' ? ['thrust', 'pierce-hit']
      : family === 'throwing' ? entry.projectile === 'axe' || /axe/.test(weapon?.trainingVisual ?? weapon?.visual ?? '')
        ? ['heavy-swish', 'axe-chop'] : ['thrust', 'throwing-pierce']
      : PROFILES[family] ?? ['swing', 'impact'];
    const releaseAt=offset+(cinematic?duration*(entry.ranged||weapon?.ranged? .4:.5):0);
    const cues = entry.skipRelease?[]:[cue(profile[0], releaseAt, family === 'bow' ? .55 : .35, heavy ? .88 : 1)];
    if (charging) cues.push(cue('cavalry-hooves', offset, .42, 1));
    if (family === 'crossbow') cues.push(cue('bow-release', releaseAt + .025, .35, 1.2));
    if (family === 'flail'&&!entry.skipRelease) cues.push(cue('heavy-swish', releaseAt + .02, .22));
    if (family === 'sling') cues.push(cue('thrust', releaseAt + .04, .2, 1.15));
    // Release is separate from contact. Select contact foley from the actual
    // damaged material and damage type, never a second release/weapon-strike clip.
    const style = /^(Wolf Bite|Stab|Thrust|Impale|Puncture|Lunge)$/.test(entry.skillName ?? '') ? 'pierce'
      : ['mace','hammer','flail','sling'].includes(family) ? 'blunt'
      : ['dagger','qatal','spear','bow','crossbow'].includes(family) || family==='throwing' && profile[1]==='throwing-pierce' ? 'pierce' : 'slash';
    const impacts = entry.affectedTargets ?? [entry];
    const at = offset + duration * .65;
    const shield = impacts.some(impact => impact.shieldDamage > 0);
    const armor = impacts.some(impact => impact.armorDamage > 0);
    const flesh = impacts.some(impact => impact.hpDamage > 0);
    const hit = impacts.some(impact => impact.hit === true || impact.hit !== false && impact.type === 'attack');
    const legacyContact = hit && impacts.every(impact => ['hpDamage','armorDamage','shieldDamage'].every(key=>impact[key]===undefined));
    const contactRate = heavy ? .88 : 1;
    const contactVolume = (heavy ? .65 : .6) / Math.sqrt(Math.max(1,Number(shield)+Number(armor)+Number(flesh || legacyContact)));
    if (shield) cues.push(cue('shield-'+style, at, contactVolume, contactRate));
    if (armor) cues.push(cue('armor-'+style, at + (shield ? .012 : 0), contactVolume, contactRate));
    if (flesh || legacyContact) {
      const body = legacyContact || !weapon ? 'impact' : family==='bow' ? 'arrow-pierce' : family==='crossbow' ? 'bolt-pierce'
        : family==='throwing' && style==='pierce' ? 'throwing-pierce'
        : style==='blunt' ? 'flesh-hit' : style==='pierce' ? 'flesh-pierce' : 'slash-hit';
      cues.push(cue(body, at + (armor || shield ? .024 : 0), contactVolume, contactRate));
    }
    if (charging && (flesh || armor || hit)) cues.push(cue('charge-hit', at, .55));
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
  let music = null, context = null, musicUnlocked = false, priming = false, loading = null, resuming = null;
  let scene = { active: false, playing: false, hidden: false, battleId: null }, lastEffectAt = -Infinity;
  const buffers = new Map(), voices = new Map();
  let pending = [], lastLoadAt = -Infinity;
  const audible = () => preferences.effects && scene.active && scene.playing && !scene.hidden;
  const contact = name => /^(?:impact|metal|shield-.+|axe-chop|armor-.+|.+-hit|.+-pierce)$/.test(name);
  function stopVoice(source) {
    const voice = voices.get(source); if (!voice) return;
    voices.delete(source);
    try { source.stop(); } catch {}
    source.disconnect(); voice.gain.disconnect();
  }

  function stopEffects() {
    pending = [];
    for (const source of voices.keys()) stopVoice(source);
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
      else if (audible && preferences.effects && context.state !== 'running' && context.state !== 'closed') resumeEffects();
    }
  }
  function resumeEffects() {
    if (!context || resuming || context.state === 'closed') return resuming;
    resuming = Promise.resolve(context.resume()).then(() => flushPending(!loading)).catch(() => {}).finally(() => { resuming = null; });
    return resuming;
  }
  function loadEffects(force = false) {
    if (!context || loading || !force && clock() - lastLoadAt < 1000) return loading;
    const missing = Object.entries(EFFECT_URLS).filter(([name]) => !buffers.has(name));
    if (!missing.length) return null;
    lastLoadAt = clock();
    loading = Promise.allSettled(missing.map(async ([name, url]) => {
      const response = await fetcher(url);
      if (!response.ok) throw new Error('Sound unavailable');
      buffers.set(name, await context.decodeAudioData(await response.arrayBuffer()));
      flushPending(false);
    })).finally(() => { loading = null; flushPending(true); });
    return loading;
  }
  function schedule(cues, elapsed = 0) {
    // Reserve contact layers first. Busy volleys may lose a whoosh, never their
    // impact to an older whoosh occupying the last voice slot.
    const selected = cues.filter(c => buffers.has(c.name))
      .map((cue, index) => ({...cue, index}))
      .sort((a,b) => Number(contact(b.name)) - Number(contact(a.name)) || a.index-b.index).slice(0,8);
    while (voices.size + selected.length > 8) {
      const victim = [...voices].find(([,voice]) => !voice.contact) ?? voices.entries().next().value;
      stopVoice(victim[0]);
    }
    for (const cue of selected.sort((a,b) => a.index-b.index)) {
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffers.get(cue.name); source.playbackRate.value = cue.rate; gain.gain.value = cue.volume;
      source.connect(gain); gain.connect(context.destination); voices.set(source,{gain,contact:contact(cue.name)});
      source.onended = () => { if (!voices.delete(source)) return; source.disconnect(); gain.disconnect(); };
      source.start(context.currentTime + Math.max(0, cue.delay - elapsed));
    }
  }
  function flushPending(allowPartial) {
    if (!audible() || context?.state !== 'running') return;
    const now = clock(), waiting = [];
    for (const event of pending) {
      if (event.battleId !== scene.battleId || now > event.expires) continue;
      if (!allowPartial && !event.cues.every(c => buffers.has(c.name))) { waiting.push(event); continue; }
      schedule(event.cues, (now-event.at)/1000);
    }
    pending = waiting;
  }
  function unlock() {
    if (scene.hidden) return;
    if (preferences.effects) {
      try {
        context ??= createContext();
        if (context) { resumeEffects(); void loadEffects(true); }
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
    if (next.battleId !== scene.battleId) { stopEffects(); lastEffectAt = -Infinity; }
    if (next.battleId !== scene.battleId && music) { try { music.currentTime = 0; } catch {} }
    scene = { ...next };
    applyScene();
  }
  function playEvent(event, duration, options) {
    if (!audible() || !context || context.state === 'closed') return;
    const cues = combatSoundCue(event, duration, options), now = clock();
    if (!cues.length || now - lastEffectAt < 110) return;
    lastEffectAt = now;
    if (context.state === 'running' && cues.every(c => buffers.has(c.name))) schedule(cues);
    else {
      const ttl=options?.cinematic?Math.max(750,(Number.isFinite(duration)?duration:.55)*1000+150):750;
      pending.push({cues, at:now, expires:now+ttl, battleId:scene.battleId});
      pending = pending.slice(-3);
      if (context.state !== 'running') resumeEffects();
      void loadEffects();
      flushPending(!loading);
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
