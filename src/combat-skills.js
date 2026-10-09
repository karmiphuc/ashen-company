import { weaponTrainingVisual } from './perks.js';

export const COMBAT_SKILLS = Object.freeze({
  lunge: {id:'lunge',name:'Lunge',ap:4,fatigue:25,description:'With a fencing sword, step toward a target exactly two hexes away and thrust. Damage scales with current initiative, up to double. Requires a free, level path and no adjacent enemy; Spearwall can stop the step.'},
  charge: { id: 'charge', name: 'Charge', ap: 6, description: 'Ride 2-3 clear hexes in a straight line, then make a normal melee attack. A hit always stuns and pushes the survivor one hex if it is free. Costs normal attack plus movement fatigue; weapon mastery does not reduce the 6 AP.' },
  howling: { id: 'howling', name: 'Howling', ap: 0, description: '20% chance after a warg rider attacks: enemies within 3 hexes deal 20% less damage for their next 2 turns. Repeated howls refresh the duration without stacking.' },
  'wolf-bite': { id: 'wolf-bite', name: 'Wolf Bite', ap: 0, description: 'After a rider attack, bite one adjacent surviving enemy for 12-20 damage with 40% armor penetration. Separate hit roll; no AP, fatigue or ammunition cost. No bite after reactions.' },
  'quick-shot': { id: 'quick-shot', name: 'Quick Shot', ap: 4, description: 'A normal bow shot; leaves AP for another shot or movement.' },
  'aimed-shot': { id: 'aimed-shot', name: 'Aimed Shot', ap: 7, fatigue: 15, hitBonus: 15, rangeBonus: 1, description: 'Aim carefully: +15 hit chance and +1 range.' },
  shieldwall: { id: 'shieldwall', name: 'Shieldwall', ap: 4, fatigue: 20, description: 'Double the active shield defense until the next turn or a gear change.' },
  'knock-back': { id: 'knock-back', name: 'Knock Back', ap: 4, fatigue: 20, description: 'Push an adjacent enemy into a free hex; no damage. Cannot push through trees, fighters or cliffs.' },
  spearwall: { id: 'spearwall', name: 'Spearwall', ap: 4, fatigue: 30, description: 'Brace a spear (Spetum: 6 AP, 35 fatigue); a hit stops an entering enemy. A miss ends the stance unless Spear Mastery preserves it in a new battle.' },
  riposte: { id: 'riposte', name: 'Riposte', ap: 2, fatigue: 25, description: 'Counter an adjacent melee attack that misses. Each counter costs 5 fatigue.' },
  split: { id: 'split', name: 'Split', ap: 6, fatigue: 25, description: 'Strike a target and the next hex behind it with a two-handed sword.' },
  swing: { id: 'swing', name: 'Swing', ap: 6, fatigue: 30, damageMultiplier: .8, description: 'Strike up to three adjacent hexes with a two-handed sword at 80% damage.' },
  'knock-out': { id: 'knock-out', name: 'Knock Out', ap: 4, fatigue: 25, description: 'A half-damage mace strike that stuns on a hit; two-handed maces cost 6 AP.' },
  puncture: { id: 'puncture', name: 'Puncture', ap: 4, fatigue: 20, hitBonus: -15, description: 'A body-only dagger thrust that bypasses armor without damaging it.' },
  deathblow: { id: 'deathblow', name: 'Deathblow', ap: 3, fatigue: 10, description: 'A Qatal strike that deals 50% more damage to a stunned target.' },
  'split-shield': { id: 'split-shield', name: 'Split Shield', ap: 4, fatigue: 18, description: 'An axe strike aimed at an active shield. New audited battles always damage the shield, without damaging health or body/head armor.' },
  'crush-armor': { id: 'crush-armor', name: 'Crush Armor', ap: 4, fatigue: 18, description: 'A hammer blow that deals 50% more armor damage.' },
  decapitate: { id: 'decapitate', name: 'Decapitate', ap: 4, fatigue: 18, description: 'A cleaver cut that deals 40% more damage to an injured target.' },
  'flail-headshot': { id: 'flail-headshot', name: 'Lash', ap: 4, fatigue: 18, hitBonus: -10, description: 'A flail strike that targets the head and bypasses an active shield at -10 hit chance.' },
  hook: { id: 'hook', name: 'Hook', ap: 6, fatigue: 20, description: 'A polearm strike that pulls its target into a free hex toward the attacker.' },
  'power-throw': { id: 'power-throw', name: 'Power Throw', ap: 4, fatigue: 18, description: 'A forceful throw that deals 25% more damage and spends one bundle charge.' },
  'piercing-bolt': { id: 'piercing-bolt', name: 'Piercing Bolt', ap: 3, fatigue: 16, description: 'A crossbow shot with 20 points more armor penetration; reload afterward.' },
  'whip-crack': { id: 'whip-crack', name: 'Whip Crack', ap: 4, fatigue: 16, hitBonus: -10, description: 'A long-range head strike that slips past an active shield at -10 hit chance.' },
  'stunning-stone': { id: 'stunning-stone', name: 'Stunning Stone', ap: 4, fatigue: 18, hitBonus: -10, description: 'A sling stone for half damage that stuns on a hit at -10 hit chance.' },
});

export function weaponSkillFamily(item) {
  if (!item || item.slot !== 'weapon') return null;
  const visual = weaponTrainingVisual(item) ?? '';
  if (item.throwing) return 'throwing';
  if (item.ranged) return visual.includes('crossbow') ? 'crossbow' : visual.includes('bow') ? 'bow'
    : visual.includes('sling') ? 'sling' : null;
  if (visual === 'qatal') return 'qatal';
  if (visual === 'dagger' || visual === 'fighting-knife') return 'dagger';
  if (visual === 'whip') return 'whip';
  if (item.spearwall || !item.twoHanded && /spear/.test(visual)) return 'spear';
  if (visual.includes('flail')) return 'flail';
  if (visual.includes('hammer')) return 'hammer';
  if (visual.includes('mace') || visual === 'goedendag') return 'mace';
  if (/axe|bardiche/.test(visual)) return 'axe';
  if (visual.includes('cleaver') || visual === 'falx') return 'cleaver';
  if (/sword|shamshir|estoc/.test(visual)) return item.twoHanded ? 'two-handed-sword' : 'sword';
  if (item.range >= 2) return 'polearm';
  return null;
}

const FAMILY_SKILLS = Object.freeze({
  bow: ['quick-shot', 'aimed-shot'], crossbow: ['piercing-bolt'], spear: ['spearwall'], sword: ['riposte'],
  'two-handed-sword': ['split', 'swing'], mace: ['knock-out'], dagger: ['puncture'], qatal: ['deathblow'],
  axe: ['split-shield'], hammer: ['crush-armor'], cleaver: ['decapitate'], flail: ['flail-headshot'],
  polearm: ['hook'], throwing: ['power-throw'], whip: ['whip-crack'], sling: ['stunning-stone'],
});

export function legacyEquipmentSkills(item) {
  if (!item) return [];
  if (item.slot === 'mount') return [COMBAT_SKILLS[/horse/.test(item.visual) ? 'charge' : 'wolf-bite'], ...(item.howlChance ? [COMBAT_SKILLS.howling] : [])];
  if (item.slot === 'shield') return [COMBAT_SKILLS.shieldwall, COMBAT_SKILLS['knock-back']];
  return [...(FAMILY_SKILLS[weaponSkillFamily(item)] ?? []),...(item.fencing?['lunge']:[])].map(id => {
    const skill = COMBAT_SKILLS[id];
    return item.twoHanded && !item.ranged && skill.ap < 6
      ? { ...skill, ap: 6 } : skill;
  });
}

// Combat identity is independent of the art/training family. Rolled copies retain baseId.
const skill = (id, name, ap, fatigue, description, rules = {}) => Object.freeze({id,name,ap,fatigue,description,...rules});
export const WEAPON_ACTIONS = Object.freeze({
  slash: skill('slash','Slash',4,11,'A quick cutting attack.',{basic:true}),
  chop: skill('chop','Chop',4,12,'A normal axe attack.',{basic:true}),
  thrust: skill('thrust','Thrust',4,10,'A normal spear thrust.',{basic:true}),
  stab: skill('stab','Stab',3,8,'A quick dagger attack.',{basic:true}),
  strike: skill('strike','Strike',6,15,'A normal two-hex polearm strike.',{basic:true}),
  impale: skill('impale','Impale',6,15,'A two-hex pike thrust.',{basic:true}),
  prong: skill('prong','Prong',6,15,'A two-hex spetum thrust.',{basic:true}),
  'overhead-strike': skill('overhead-strike','Overhead Strike',6,15,'A full-force two-handed sword strike.',{basic:true}),
  bash: skill('bash','Bash',4,10,'A normal mace blow.',{basic:true}),
  hammer: skill('hammer','Hammer',4,12,'A normal hammer blow.',{basic:true,minimumHealth:6}),
  batter: skill('batter','Batter',6,15,'A two-hex polehammer blow.',{basic:true,minimumHealth:6}),
  crumble: skill('crumble','Crumble',6,15,'A two-hex polemace blow.',{basic:true}),
  cleave: skill('cleave','Cleave',4,12,'A cutting attack; a wound inflicts 3 health bleeding for two turns.',{basic:true,bleed:3}),
  flail: skill('flail','Flail',4,12,'Strike around an active shield.',{basic:true,shieldBypass:true}),
  cascade: skill('cascade','Cascade',4,13,'Three independent strikes, each dealing one third damage and bypassing shield defense.',{basic:true,hits:3,damageMultiplier:1/3,shieldBypass:true}),
  hail: skill('hail','Hail',4,25,'Three independent strikes aimed at the head, each dealing one third damage and bypassing shields.',{hits:3,damageMultiplier:1/3,shieldBypass:true,head:true}),
  pound: skill('pound','Pound',6,15,'A two-handed flail strike around shields, with 30% chance to stun.',{basic:true,shieldBypass:true,stunChance:.3}),
  thresh: skill('thresh','Thresh',6,35,'Strike every adjacent fighter at −15 hit chance; 20% chance to stun each survivor. Can hit allies.',{area:'ring',hitBonus:-15,shieldBypass:true,stunChance:.2}),
  smite: skill('smite','Smite',6,15,'A heavy hammer strike that staggers: −50% initiative for one turn.',{basic:true,stagger:1,minimumHealth:6}),
  shatter: skill('shatter','Shatter',6,30,'Sweep three adjacent hexes at −15 hit chance, staggering survivors. Can hit allies.',{area:'arc',hitBonus:-15,stagger:1}),
  cudgel: skill('cudgel','Cudgel',6,15,'A heavy mace strike that dazes: −25% damage, maximum fatigue and initiative for two turns.',{basic:true,daze:2}),
  'strike-down': skill('strike-down','Strike Down',6,30,'A half-damage two-handed mace blow that stuns.',{stunChance:1,damageMultiplier:.5}),
  'knock-over': skill('knock-over','Knock Over',6,30,'A half-damage polemace blow that stuns at two hexes.',{stunChance:1,damageMultiplier:.5}),
  'split-man': skill('split-man','Split Man',6,15,'A full axe blow plus a half-strength hit to the opposite body location.',{basic:true,oppositeHit:true}),
  'round-swing': skill('round-swing','Round Swing',6,35,'Strike all six adjacent hexes at −15 hit chance. Can hit allies.',{area:'ring',hitBonus:-15}),
  'split-axe': skill('split-axe','Split Axe',6,30,'A bardiche strike through two hexes in a straight line. Can hit allies.',{area:'line'}),
  reap: skill('reap','Reap',6,30,'Sweep three neighboring hexes at two-hex reach. Can hit allies.',{area:'reach-arc'}),
  repel: skill('repel','Repel',6,25,'A non-damaging shove at two hexes that pushes one free hex, breaks stances and staggers.',{hitBonus:10,noDamage:true,push:true,stagger:1}),
  rupture: skill('rupture','Rupture',6,12,'A goblin-pike thrust; a wound inflicts 3 bleeding health for two turns.',{basic:true,bleed:3}),
  'demolish-armor': skill('demolish-armor','Demolish Armor',6,35,'A polehammer attack with +45% armor damage and only 6 direct health damage.',{armorMultiplier:1.45,fixedHealth:6}),
  gash: skill('gash','Gash',4,20,'An accurate (+10 hit) shamshir cut with a 34% lower injury threshold, or 50% with Sword Mastery. Wounds persist until recovered.',{hitBonus:10,daze:2,woundThreshold:.075}),
  'whip-strike': skill('whip-strike','Whip',4,15,'Crack the whip. A wound inflicts 6 bleeding health per turn for two turns.',{basic:true,bleed:6}),
  disarm: skill('disarm','Disarm',5,30,'At −20 hit chance, prevent weapon attacks and reactions for the target’s next turn. No damage.',{hitBonus:-20,noDamage:true,disarm:1}),
  'shoot-bolt': skill('shoot-bolt','Shoot Bolt',3,12,'A normal crossbow shot; reload afterward.',{basic:true}),
  'impaler-bolt': skill('impaler-bolt','Impaler Bolt',3,12,'A crossbow hit pushes its surviving target one free hex and breaks stances; reload afterward.',{basic:true,push:true}),
  'throw-javelin': skill('throw-javelin','Throw Javelin',4,12,'Throw one javelin or spear from the active bundle.',{basic:true}),
  'throw-axe': skill('throw-axe','Throw Axe',4,12,'Throw one axe from the active bundle.',{basic:true}),
  'sling-stone': skill('sling-stone','Sling Stone',4,12,'A normal sling shot.',{basic:true}),
  'estoc-thrust': skill('estoc-thrust','Estoc Thrust',6,15,'An accurate armor-piercing thrust with the rigid two-handed blade.',{basic:true}),
});
const profile = (id, basic, ...active) => Object.freeze({id,actions:Object.freeze([basic,...active])});
const PROFILES = Object.freeze({
 sword:profile('sword','slash','riposte'), fencing:profile('fencing','slash','lunge'), shamshir:profile('shamshir','slash','gash'),
 spear:profile('spear','thrust','spearwall'), spetum:profile('spetum','prong','spearwall'),
 axe:profile('axe','chop','split-shield'), greataxe:profile('greataxe','split-man','round-swing','split-shield'), bardiche:profile('bardiche','split-man','split-axe','split-shield'), longaxe:profile('longaxe','strike','split-shield'),
 hammer:profile('hammer','hammer','crush-armor'), polehammer:profile('polehammer','batter','demolish-armor'), heavyhammer:profile('heavyhammer','smite','shatter','split-shield'),
 mace:profile('mace','bash','knock-out'), polemace:profile('polemace','crumble','knock-over'), heavymace:profile('heavymace','cudgel','strike-down','split-shield'),
 flail:profile('flail','flail','flail-headshot'), threeflail:profile('threeflail','cascade','hail'), heavyflail:profile('heavyflail','pound','thresh'),
 cleaver:profile('cleaver','cleave','decapitate'), heavycleaver:profile('heavycleaver','cleave','decapitate','split-shield'),
 greatsword:profile('greatsword','overhead-strike','split','swing','split-shield'), warbrand:profile('warbrand','slash','split','swing'),
 billhook:profile('billhook','strike','hook'), pike:profile('pike','impale','repel'), goblinpike:profile('goblinpike','rupture','repel'), scythe:profile('scythe','strike','reap'), rhomphaia:profile('rhomphaia','strike','reap','split','swing'),
 dagger:profile('dagger','stab','puncture'), qatal:profile('qatal','stab','deathblow'), whip:profile('whip','whip-strike','disarm'),
 bow:profile('bow','quick-shot','aimed-shot'), crossbow:profile('crossbow','shoot-bolt','piercing-bolt'), impaler:profile('impaler','impaler-bolt','piercing-bolt'),
 javelin:profile('javelin','throw-javelin','power-throw'), throwingaxe:profile('throwingaxe','throw-axe','power-throw'), sling:profile('sling','sling-stone','stunning-stone'), estoc:profile('estoc','estoc-thrust'),
});
const IDENTITIES = Object.freeze({
 'three-headed-flail':'threeflail','bb-named-three-headed-flail':'threeflail','bb-named-two-handed-flail':'heavyflail',
 'bb-named-polemace':'polemace','bb-named-spetum':'spetum','bb-named-warbrand':'warbrand','bb-named-fencing-sword':'fencing',
 'bb-named-goblin-pike':'goblinpike',impaler:'impaler',estoc:'estoc',
});
export function weaponCombatProfile(item) {
 if(!item||item.slot!=='weapon')return null;
 const identity=item.baseId??item.id, visual=weaponTrainingVisual(item)??'';
 let id=IDENTITIES[identity];
 if(!id){
  if(item.throwing)id=/axe/.test(visual)?'throwingaxe':'javelin';
  else if(item.ranged)id=/crossbow/.test(visual)?'crossbow':/bow/.test(visual)?'bow':/sling/.test(visual)?'sling':null;
  else if(item.fencing)id='fencing';
  else if(visual==='rhomphaia')id='rhomphaia';
  else if(/warscythe|war-scythe|battle-glaive/.test(visual))id='scythe';
  else if(/billhook|hooked-bill/.test(visual))id='billhook';
  else if(/pike/.test(visual))id='pike';
  else if(/polehammer/.test(visual))id='polehammer';
  else if(/longaxe/.test(visual))id='longaxe';
  else if(/bardiche/.test(visual))id='bardiche';
  else {const family=weaponSkillFamily(item);id=family==='two-handed-sword'?'greatsword':family==='flail'&&item.twoHanded?'heavyflail':family==='mace'&&item.twoHanded&&visual!=='goedendag'?'heavymace':family==='hammer'&&item.twoHanded?'heavyhammer':family==='axe'&&item.twoHanded?'greataxe':family==='cleaver'&&item.twoHanded?'heavycleaver':visual==='shamshir'?'shamshir':family;}
 }
 return PROFILES[id]??null;
}
export function equipmentSkills(item) {
 if(item?.slot!=='weapon')return legacyEquipmentSkills(item);
 const profile=weaponCombatProfile(item);
 return (profile?.actions??[]).map((id,index)=>{
  const action=WEAPON_ACTIONS[id]??COMBAT_SKILLS[id];
  let ap=action.ap, fatigue=action.fatigue;
  if(id==='spearwall'&&profile.id==='spetum'){ap=6;fatigue=35;}
  else if(item.twoHanded&&!item.ranged&&ap<6&&!['cleave','decapitate','slash'].includes(id))ap=6;
  if(['warbrand','rhomphaia'].includes(profile.id)&&['split','swing'].includes(id))ap=5;
  const knockout=id==='knock-out'&&weaponTrainingVisual(item)==='goedendag';
  return {...action,...(knockout?{damageMultiplier:.75,description:'A Goedendag strike at 75% normal damage that stuns on a hit.'}:{}),ap,...(fatigue===undefined?{}:{fatigue}),...(index===0?{basic:true}:{}),...(id==='decapitate'?{bleed:3}:{}),...(id==='split'?{area:'line'}:id==='swing'?{area:'arc'}:{}),...(profile.id==='impaler'&&id==='piercing-bolt'?{push:true}:{})};
 });
}
