// Local raster layers from Battle-Brothers-Legends/Legends-public.
// See assets/portraits/legends-source.json for the pinned source manifest.
import { DLC_ITEMS } from './dlc-items.js';
import { DLC_ART } from './dlc-art.js';
import { FANTASY_ARMOR_VISUALS, FANTASY_HELMET_VISUALS, FANTASY_ITEM_IMAGES, FANTASY_APPEARANCES, FANTASY_CLOSED_HELMETS, FANTASY_HIDDEN_HEADS } from './fantasy-art.js';

const PORTRAIT_ROOT = 'assets/portraits/';
const ITEM_ROOT = 'assets/items/';
const CANVAS = { width: 104, height: 142 };

const APPEARANCES = [
  { body: 'body-03.png', head: 'head-34.png', headLeft: 27 },
  { body: 'body-african-00.png', head: 'head-african-01.png', headLeft: 25, hair: 'hair-black-22.png', beard: 'beard-black-01.png' },
  { body: 'body-african-01.png', head: 'head-african-02.png', headLeft: 25, hair: 'hair-brown-24.png' },
  { body: 'body-african-02.png', head: 'head-african-03.png', headLeft: 25, hair: 'hair-blonde-27.png' },
  { body: 'body-african-00.png', head: 'head-african-04.png', headLeft: 25, hair: 'hair-red-29.png', beard: 'beard-red-18.png' },
  { body: 'body-african-01.png', head: 'head-african-05.png', headLeft: 25, hair: 'hair-grey-33.png', beard: 'beard-grey-01.png' },
];

export const VISUALS = {
  armor: {
    ...FANTASY_ARMOR_VISUALS,
    ...Object.fromEntries(DLC_ITEMS.filter(item=>item.slot==='armor').map(item=>[item.visual,[DLC_ART[item.id].portrait,DLC_ART[item.id].left,DLC_ART[item.id].top]])),
    padded: ['armor-padded.png', 5, 46],
    gambeson: ['armor-gambeson.png', 5, 46],
    leather: ['armor-leather.png', 5, 46],
    mail: ['armor-mail.png', 5, 46],
    reinforcedmail: ['armor-reinforced-mail.png', 5, 46],
    brigandine: ['armor-brigandine.png', 5, 46],
    plate: ['armor-plate.png', 5, 46],
    lamellar: ['armor-lamellar.png', 5, 46],
    nomad: ['armor-nomad.png', 5, 46],
    noblemail: ['armor-noblemail.png', 5, 46],
    scales: ['armor-scales.png', 5, 46],
    southernmail: ['armor-southernmail.png', 5, 46],
    'wolf-gambeson': ['armor-wolf-gambeson.png', 5, 46],
    'riveted-leather': ['armor-riveted-leather.png', 5, 46],
    'sleeveless-hauberk': ['armor-sleeveless-hauberk.png', 5, 46],
    'scale-shirt': ['armor-scale-shirt.png', 5, 46],
    'reinforced-lamellar': ['armor-reinforced-lamellar.png', 5, 46],
    'riveted-mail': ['armor-riveted-mail.png', 5, 46],
    'plate-cuirass': ['armor-plate-cuirass.png', 5, 46],
    'noble-tabard': ['armor-noble-tabard.png', 5, 46],
    'northern-fur-coat': ['armor-northern-fur-coat.png', 10, 46],
    'northern-animal-pelt': ['armor-northern-animal-pelt.png', 5, 46],
    'northern-rusty-mail': ['armor-northern-rusty-mail.png', 5, 46],
    'northern-rusted-hauberk': ['armor-northern-rusted-hauberk.png', 5, 46],
    'northern-heavy-lamellar': ['armor-northern-heavy-lamellar.png', 5, 46],
    'northern-horned-plate': ['armor-northern-horned-plate.png', 5, 46],
  },
  helmet: {
    ...FANTASY_HELMET_VISUALS,
    ...Object.fromEntries(DLC_ITEMS.filter(item=>item.slot==='helmet').map(item=>[item.visual,[DLC_ART[item.id].portrait,DLC_ART[item.id].left,DLC_ART[item.id].top]])),
    hood: ['helmet-hood.png', -16, -60],
    nasal: ['helmet-nasal.png', -20, -55],
    kettle: ['helmet-kettle.png', -23, -59],
    greathelm: ['helmet-greathelm.png', -20, -58],
    bascinet: ['helmet-bascinet.png', 17, -13],
    mailcoif: ['helmet-mailcoif.png', -20, -55],
    headwrap: ['helmet-headwrap.png', -20, -63],
    southernhelm: ['helmet-southern.png', -20, -63],
    barbarianhelm: ['helmet-barbarian.png', -20, -55],
    sallet: ['helmet-sallet.png', -20, -61],
    barbute: ['helmet-barbute.png', -20, -55],
    'flat-top-helm': ['helmet-flat-top-helm.png', -20, -61],
    'full-helm': ['helmet-full-helm.png', -20, -55],
    'southern-turban': ['helmet-southern-turban.png', -20, -55],
    'high-kettle-helm': ['helmet-high-kettle-helm.png', -20, -57],
    'northern-leather-hood': ['helmet-northern-leather-hood.png', -20, -55],
    'northern-metal-cap': ['helmet-northern-metal-cap.png', -20, -55],
    'northern-ritual-helm': ['helmet-northern-ritual-helm.png', -20, -55],
    'northern-skull-helm': ['helmet-northern-skull-helm.png', -20, -76],
    'northern-bear-head': ['helmet-northern-bear-head.png', -20, -55],
  },
  weapon: {
    spear: ['weapon-spear.png', 87, 33, 'rotate(-38deg)', '4px 70px'],
    sword: ['weapon-sword.png', 83, 57, 'rotate(-35deg)', '8px 46px'],
    axe: ['weapon-axe.png', 81, 65, 'rotate(-45deg)', '7px 38px'],
    bow: ['weapon-bow.png', 63, 53, 'rotate(-30deg)', '27px 42px'],
    mace: ['weapon-mace.png', 83, 46, 'rotate(-35deg)', '8px 57px'],
    dagger: ['weapon-dagger.png', 84, 60, 'rotate(-35deg)', '7px 43px'],
    crossbow: ['weapon-crossbow.png', 45, 62, 'rotate(-25deg)', '28px 28px'],
    billhook: ['weapon-billhook.png', 34, -2, 'scale(.8) rotate(30deg)', '58px 107px'],
    falchion: ['weapon-falchion.png', 55, 85, 'scale(.85) rotate(175deg)', '35px 18px'],
    'fighting-spear': ['weapon-fighting-spear.png', 86, 33, 'rotate(-34deg)', '4px 70px'],
    'military-cleaver': ['weapon-military-cleaver.png', 21, 2, 'rotate(35deg)', '69px 101px'],
    flail: ['weapon-flail.png', 78, 50, 'rotate(-50deg)', '12px 53px'],
    warhammer: ['weapon-warhammer.png', 82, 40, 'rotate(-30deg)', '8px 63px'],
    'winged-mace': ['weapon-winged-mace.png', 84, 48, 'rotate(-30deg)', '6px 55px'],
    greatsword: ['weapon-greatsword.png', 30, 6, 'rotate(35deg)', '60px 97px'],
    greataxe: ['weapon-greataxe.png', 20, 13, 'rotate(35deg)', '70px 90px'],
    'two-handed-hammer': ['weapon-two-handed-hammer.png', 11, 5, 'rotate(35deg)', '79px 98px'],
    pike: ['weapon-pike.png', 27, -8, 'scale(.9) rotate(35deg)', '63px 111px'],
    polehammer: ['weapon-polehammer.png', 26, -7, 'scale(.9) rotate(27deg)', '64px 110px'],
    'war-scythe': ['weapon-war-scythe.png', 35, -22, 'scale(.82) rotate(20deg)', '55px 125px'],
    whip: ['weapon-whip.png', 80, 42, 'rotate(-40deg)', '10px 61px'],
    shamshir: ['weapon-shamshir.png', 76, 36, 'scale(.9) rotate(-35deg)', '14px 67px'],
    'qatal-dagger': ['weapon-qatal.png', 84, 49, 'rotate(-25deg)', '6px 54px'],
    warbow: ['weapon-warbow.png', 63, 53, 'rotate(-30deg)', '27px 42px'],
    'heavy-crossbow': ['weapon-heavy-crossbow.png', 45, 62, 'scale(.8) rotate(-25deg)', '28px 28px'],
    javelins: ['weapon-javelins.png', 84, 35, 'scale(.95) rotate(-25deg)', '6px 68px'],
    'throwing-axes': ['weapon-throwing-axes.png', 82, 61, 'scale(.85) rotate(-45deg)', '8px 42px'],
    'heavy-javelins': ['weapon-heavy-javelins.png', 84, 29, 'scale(.9) rotate(-25deg)', '6px 74px'],
    'heavy-throwing-axes': ['weapon-heavy-throwing-axes.png', 78, 58, 'scale(.8) rotate(-45deg)', '12px 45px'],
    cleaver: ['weapon-military-cleaver.png', 21, 2, 'rotate(35deg)', '69px 101px'],
    hammer: ['weapon-warhammer.png', 82, 40, 'rotate(-30deg)', '8px 63px'],
    heavyhammer: ['weapon-two-handed-hammer.png', 11, 5, 'rotate(35deg)', '79px 98px'],
    warscythe: ['weapon-war-scythe.png', 35, -22, 'scale(.82) rotate(20deg)', '55px 125px'],
    qatal: ['weapon-qatal.png', 84, 49, 'rotate(-25deg)', '6px 54px'],
    heavycrossbow: ['weapon-heavy-crossbow.png', 45, 62, 'scale(.8) rotate(-25deg)', '28px 28px'],
    javelin: ['weapon-javelins.png', 84, 35, 'scale(.95) rotate(-25deg)', '6px 68px'],
    throwingaxe: ['weapon-throwing-axes.png', 82, 61, 'scale(.85) rotate(-45deg)', '8px 42px'],
    heavyjavelin: ['weapon-heavy-javelins.png', 84, 29, 'scale(.9) rotate(-25deg)', '6px 74px'],
    heavythrowingaxe: ['weapon-heavy-throwing-axes.png', 78, 58, 'scale(.8) rotate(-45deg)', '12px 45px'],
    'hand-axe': ['weapon-hand-axe.png', 89, 41, 'rotate(-40deg)', '1px 62px'],
    longaxe: ['weapon-longaxe.png', 10, 19, 'scale(.65) rotate(35deg)', '80px 84px'],
    bardiche: ['weapon-bardiche.png', 2, -2, 'scale(.6) rotate(30deg)', '88px 105px'],
    'hooked-bill': ['weapon-hooked-bill.png', 31, -6, 'rotate(30deg)', '59px 109px'],
    'bladed-pike': ['weapon-bladed-pike.png', 35, -15, 'rotate(30deg)', '55px 118px'],
    goedendag: ['weapon-goedendag.png', 16, 3, 'rotate(30deg)', '74px 100px'],
    estoc: ['weapon-estoc.png', 53, -1, 'rotate(16deg)', '37px 104px'],
    falx: ['weapon-falx.png', 87, 35, 'rotate(-30deg)', '3px 68px'],
    'three-headed-flail': ['weapon-three-headed-flail.png', 86, 27, 'rotate(-25deg)', '4px 76px'],
    'battle-glaive': ['weapon-battle-glaive.png', 35, 27, 'rotate(30deg)', '55px 76px'],
    'short-bow': ['weapon-short-bow.png', 65, 59, 'rotate(-25deg)', '25px 44px'],
    'composite-bow': ['weapon-composite-bow.png', 63, 53, 'rotate(-25deg)', '27px 50px'],
    'throwing-spears': ['weapon-throwing-spears.png', 85, 25, 'rotate(-30deg)', '5px 78px'],
    'fighting-knife': ['weapon-fighting-knife.png', 89, 67, 'rotate(-50deg)', '1px 36px'],
    rhomphaia: ['weapon-rhomphaia.png', 29, 4, 'scale(.55) rotate(23deg)', '63px 99px'],
    'reinforced-crossbow': ['weapon-reinforced-crossbow.png', 65, 81, 'rotate(-25deg)', '23px 22px'],
    'military-spear': ['weapon-military-spear.png', 89, 23, 'rotate(-32deg)', '1px 80px'],
    longsword: ['weapon-longsword.png', 80, 46, 'rotate(-30deg)', '10px 57px'],
    'northern-crude-club': ['weapon-northern-crude-club.png', 77, 57, 'rotate(-35deg)', '10px 45px'],
    'northern-serrated-axe': ['weapon-northern-serrated-axe.png', 16, 5, 'scale(.65) rotate(32deg)', '75px 105px'],
    'northern-warcleaver': ['weapon-northern-warcleaver.png', 20, 3, 'scale(.65) rotate(30deg)', '78px 103px'],
    'northern-rusty-greatsword': ['weapon-northern-rusty-greatsword.png', 14, 0, 'scale(.65) rotate(32deg)', '78px 103px'],
    'northern-heavy-flail': ['weapon-northern-heavy-flail.png', 40, 10, 'scale(.8) rotate(20deg)', '55px 95px'],
    'northern-broadhead-spear': ['weapon-northern-broadhead-spear.png', 60, 31, 'rotate(-25deg)', '15px 70px'],
    'northern-sling': ['weapon-northern-sling.png', 73, 57, 'rotate(-25deg)', '5px 60px'],
  },
  shield: {
    round: ['shield-round.png', 8, 68],
    kite: ['shield-kite.png', 6, 54],
    heater: ['shield-heater.png', 6, 54],
    adarga: ['shield-adarga.png', 8, 68],
    'painted-round-shield': ['shield-painted-round-shield.png', 8, 68],
    'painted-heater-shield': ['shield-painted-heater-shield.png', 6, 54],
    'painted-tower-shield': ['shield-painted-tower-shield.png', 2, 28, 'scale(.65)', '0 0'],
    'northern-heartwood-shield': ['shield-northern-heartwood-shield.png', 5, 54],
    'northern-iron-round-shield': ['shield-northern-iron-round-shield.png', 8, 68],
  },
  accessory: {
    bandages: ['../items/bandages.png'],
    medical: ['../items/medical-satchel.png'],
    stimulant: ['../items/stimulant.png'],
    'surgeons-kit': ['../items/surgeons-kit.png'],
  },
  attachment: {
    'padded-lining': {},
    'leather-reinforcement': {},
    'fur-mantle': {
      back: ['attachment-fur-mantle-back.png', 59, 48],
      front: ['attachment-fur-mantle-front.png', 2, 46],
    },
    'iron-pauldrons': { front: ['attachment-iron-pauldrons.png', 5, 46] },
    'scale-mantle': { front: ['attachment-scale-mantle.png', 5, 46] },
    'bone-platings': { front: ['attachment-bone-platings.png', 5, 46] },
    'horned-pauldrons': {
      back: ['attachment-horned-pauldrons-back.png', 59, 48],
      front: ['attachment-horned-pauldrons-front.png', 2, 46],
    },
    'chain-mantle': { front: ['attachment-chain-mantle.png', 5, 46] },
    'heraldic-plates': { front: ['attachment-heraldic-plates.png', 5, 46] },
    'gladiator-pauldrons': { front: ['attachment-gladiator-pauldrons.png', 5, 46] },
    'skull-chain': { front: ['attachment-skull-chain.png', 5, 46] },
    'spiked-chain': { front: ['attachment-spiked-chain.png', 5, 46] },
    'stag-plates': { front: ['attachment-stag-plates.png', 5, 46] },
    'heraldic-shoulders': {
      back: ['attachment-heraldic-shoulders-back.png', 65, 53],
      front: ['attachment-heraldic-shoulders-front.png', 5, 51],
    },
    'kraken-mantle': { front: ['attachment-kraken-mantle.png', 5, 46] },
  },
  mount: {
    horse: ['mount-horse-body.png', 'mount-horse-head.png', 12, 42, 52, 35, null, 1],
    warhorse: ['mount-war-horse-body.png', 'mount-war-horse-head.png', -15, 20, 55, 38, null, 1],
    armoredhorse: ['mount-armored-war-horse-body.png', 'mount-armored-war-horse-head.png', -15, 20, 55, 38, null, 1],
    warg: ['mount-wolf-body.png', 'mount-wolf-head.png', 4, 55, 27, 71, 'sepia(.85) saturate(.7) brightness(.7)'],
    wolf: ['mount-wolf-body.png', 'mount-wolf-head.png', 4, 55, 27, 71],
  },
};
const PORTRAIT = VISUALS;

const ITEM_IMAGES = {
  ...FANTASY_ITEM_IMAGES,
  'frontier-scout-armor': 'frontier-scout-armor.png',
  'frontier-scout-helmet': 'frontier-scout-helmet.png',
  'frontier-warden-armor': 'frontier-warden-armor.png',
  'frontier-warden-helmet': 'frontier-warden-helmet.png',
  'frontier-sentinel-armor': 'frontier-sentinel-armor.png',
  'frontier-sentinel-helmet': 'frontier-sentinel-helmet.png',

  'patched-coat': 'patched-coat.png',
  'quilted-jack': 'quilted-jack.png',
  'padded-gambeson': 'padded-gambeson.png',
  'leather-vest': 'leather-vest.png',
  'mail-shirt': 'mail-shirt.png',
  'reinforced-mail': 'reinforced-mail.png',
  brigandine: 'brigandine.png',
  'plate-harness': 'plate-harness.png',
  'cloth-hood': 'cloth-hood.png',
  'leather-cap': 'leather-cap.png',
  'iron-helm': 'iron-helm.png',
  'kettle-helm': 'kettle-helm.png',
  greathelm: 'greathelm.png',
  bascinet: 'bascinet.png',
  'arming-sword': 'arming-sword.png',
  spear: 'spear.png',
  'wood-axe': 'wood-axe.png',
  'hunting-bow': 'hunting-bow.png',
  bludgeon: 'bludgeon.png',
  'rondel-dagger': 'rondel-dagger.png',
  'light-crossbow': 'light-crossbow.png',
  billhook: 'billhook.png',
  buckler: 'buckler.png',
  'round-shield': 'round-shield.png',
  'kite-shield': 'kite-shield.png',
  falchion: 'falchion.png',
  'fighting-spear': 'fighting-spear.png',
  'military-cleaver': 'military-cleaver.png',
  flail: 'flail.png',
  warhammer: 'warhammer.png',
  'winged-mace': 'winged-mace.png',
  greatsword: 'greatsword.png',
  greataxe: 'greataxe.png',
  'two-handed-hammer': 'two-handed-hammer.png',
  pike: 'pike.png',
  polehammer: 'polehammer.png',
  'war-scythe': 'war-scythe.png',
  whip: 'whip.png',
  shamshir: 'shamshir.png',
  'qatal-dagger': 'qatal-dagger.png',
  warbow: 'warbow.png',
  'heavy-crossbow': 'heavy-crossbow.png',
  javelins: 'javelins.png',
  'throwing-axes': 'throwing-axes.png',
  'heavy-javelins': 'heavy-javelins.png',
  'heavy-throwing-axes': 'heavy-throwing-axes.png',
  'leather-lamellar': 'leather-lamellar.png',
  'nomad-robe': 'nomad-robe.png',
  'noble-mail': 'noble-mail.png',
  'coat-of-scales': 'coat-of-scales.png',
  'southern-mail': 'southern-mail.png',
  'mail-coif': 'mail-coif.png',
  'nomad-head-wrap': 'nomad-head-wrap.png',
  'southern-helmet': 'southern-helmet.png',
  'barbarian-helmet': 'barbarian-helmet.png',
  'heater-shield': 'heater-shield.png',
  adarga: 'adarga.png',
  bandages: 'bandages.png',
  'medical-satchel': 'medical-satchel.png',
  stimulant: 'stimulant.png',
  'hand-axe': 'hand-axe.png',
  longaxe: 'longaxe.png',
  bardiche: 'bardiche.png',
  'hooked-bill': 'hooked-bill.png',
  'bladed-pike': 'bladed-pike.png',
  goedendag: 'goedendag.png',
  estoc: 'estoc.png',
  falx: 'falx.png',
  'three-headed-flail': 'three-headed-flail.png',
  'battle-glaive': 'battle-glaive.png',
  'short-bow': 'short-bow.png',
  'composite-bow': 'composite-bow.png',
  'throwing-spears': 'throwing-spears.png',
  'fighting-knife': 'fighting-knife.png',
  rhomphaia: 'rhomphaia.png',
  'reinforced-crossbow': 'reinforced-crossbow.png',
  'military-spear': 'military-spear.png',
  longsword: 'longsword.png',
  'wolf-gambeson': 'wolf-gambeson.png',
  'riveted-leather': 'riveted-leather.png',
  'sleeveless-hauberk': 'sleeveless-hauberk.png',
  'scale-shirt': 'scale-shirt.png',
  'reinforced-lamellar': 'reinforced-lamellar.png',
  'riveted-mail': 'riveted-mail.png',
  'plate-cuirass': 'plate-cuirass.png',
  'noble-tabard': 'noble-tabard.png',
  sallet: 'sallet.png',
  barbute: 'barbute.png',
  'flat-top-helm': 'flat-top-helm.png',
  'full-helm': 'full-helm.png',
  'southern-turban': 'southern-turban.png',
  'high-kettle-helm': 'high-kettle-helm.png',
  'riding-horse': 'riding-horse.png',
  'war-horse': 'war-horse.png',
  'armored-war-horse': 'armored-war-horse.png',
  'warg-mount': 'warg-mount.png',
  'dire-wolf-mount': 'dire-wolf-mount.png',
  'painted-round-shield': 'painted-round-shield.png',
  'painted-heater-shield': 'painted-heater-shield.png',
  'painted-tower-shield': 'painted-tower-shield.png',
  'surgeons-kit': 'surgeons-kit.png',
  'northern-crude-club': 'northern-crude-club.png',
  'northern-serrated-axe': 'northern-serrated-axe.png',
  'northern-warcleaver': 'northern-warcleaver.png',
  'northern-rusty-greatsword': 'northern-rusty-greatsword.png',
  'northern-heavy-flail': 'northern-heavy-flail.png',
  'northern-broadhead-spear': 'northern-broadhead-spear.png',
  'northern-sling': 'northern-sling.png',
  'northern-fur-coat': 'northern-fur-coat.png',
  'northern-animal-pelt': 'northern-animal-pelt.png',
  'northern-rusty-mail': 'northern-rusty-mail.png',
  'northern-rusted-hauberk': 'northern-rusted-hauberk.png',
  'northern-heavy-lamellar': 'northern-heavy-lamellar.png',
  'northern-horned-plate': 'northern-horned-plate.png',
  'northern-leather-hood': 'northern-leather-hood.png',
  'northern-metal-cap': 'northern-metal-cap.png',
  'northern-ritual-helm': 'northern-ritual-helm.png',
  'northern-skull-helm': 'northern-skull-helm.png',
  'northern-bear-head': 'northern-bear-head.png',
  'northern-heartwood-shield': 'northern-heartwood-shield.png',
  'northern-iron-round-shield': 'northern-iron-round-shield.png',
  'padded-lining': 'padded-lining.png',
  'leather-reinforcement': 'leather-reinforcement.png',
  'fur-mantle': 'fur-mantle.png',
  'iron-pauldrons': 'iron-pauldrons.png',
  'scale-mantle': 'scale-mantle.png',
  'bone-platings': 'bone-platings.png',
  'horned-pauldrons': 'horned-pauldrons.png',
  'chain-mantle': 'chain-mantle.png',
  'heraldic-plates': 'heraldic-plates.png',
  'gladiator-pauldrons': 'gladiator-pauldrons.png',
  'skull-chain': 'skull-chain.png',
  'spiked-chain': 'spiked-chain.png',
  'stag-plates': 'stag-plates.png',
  'heraldic-shoulders': 'heraldic-shoulders.png',
  'kraken-mantle': 'kraken-mantle.png',
};

function hash(value) {
  let result = 2166136261;
  for (const char of String(value ?? '0')) {
    result ^= char.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function visual(item) {
  return String(item?.visual || '').toLowerCase();
}

function layerSpec(category, item) {
  const source = DLC_ART[item?.baseId || item?.id || visual(item)];
  if (source && (category === 'armor' || category === 'helmet')) return [source.portrait, source.left, source.top];
  const variants = PORTRAIT[category];
  const id = String(item?.baseId || item?.id || '').toLowerCase();
  return variants[id] || variants[visual(item)];
}

function layer(name, spec, item) {
  if (!spec) return `<span data-layer="${name}" class="bb-layer bb-layer-${name}"></span>`;
  const [file, left, top, transform, transformOrigin] = spec;
  const origin = transformOrigin ?? 'center';
  const weaponStyle = name === 'weapon' && transform ? `--layer-rest:${transform};--layer-origin:${origin};--weapon-rest:${transform};--weapon-origin:${origin};` : '';
  const transformStyle = transform ? `${weaponStyle}transform:${transform};transform-origin:${origin};` : '';
  const famed = item?.rarity === 'famed' ? ' bb-layer-famed' : '';
  const zIndex = { armor: 1, ear: 4, helmet: 5, shield: 6, weapon: 7 }[name] ?? 0;
  return `<img data-layer="${name}" class="bb-layer bb-layer-${name}${famed}" src="${file.startsWith('data:') ? file : PORTRAIT_ROOT + file}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;${transformStyle}max-width:none;pointer-events:none;z-index:${zIndex}">`;
}

function bodyLayer(file, armored, left = 11, top = 50) {
  const source = `${file.startsWith('data:') ? file : PORTRAIT_ROOT + file}`;
  if (!armored) return `<img data-layer="body" class="bb-layer bb-layer-body" src="${source}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;max-width:none;pointer-events:none">`;
  return `<span data-layer="body" class="bb-layer bb-layer-body"><img src="${source}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;clip-path:polygon(0 0,22px 0,22px 60px,0 60px);max-width:none;pointer-events:none"><img src="${source}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;clip-path:polygon(22px 0,60px 0,60px 34px,22px 34px);max-width:none;pointer-events:none"><img src="${source}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;clip-path:polygon(60px 0,82px 0,82px 60px,60px 60px);max-width:none;pointer-events:none"></span>`;
}

function attachmentLayer(spec, part) {
  const layerSpec = spec?.[part];
  if (!layerSpec) return '';
  const [file, left, top] = layerSpec;
  return `<img data-layer="attachment-${part}" class="bb-layer bb-layer-attachment" src="${file.startsWith('data:') ? file : PORTRAIT_ROOT + file}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;max-width:none;pointer-events:none;z-index:${part === 'back' ? 2 : 3}">`;
}

function mountLayer(spec, part) {
  if (!spec) return '';
  const [body, head, bodyLeft, bodyTop, headLeft, headTop, filter, facing = -1] = spec;
  const file = part === 'body' ? body : head;
  const left = part === 'body' ? bodyLeft : headLeft;
  const top = part === 'body' ? bodyTop : headTop;
  return `<img data-layer="mount-${part}" class="bb-layer bb-layer-mount" src="${file.startsWith('data:') ? file : PORTRAIT_ROOT + file}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;transform:scaleX(${facing});${filter ? `filter:${filter};` : ''}max-width:none;pointer-events:none">`;
}

function portraitSize(size) {
  const parsed = Number(size);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(1000, Math.round(parsed))) : 160;
}

/** Return a fixed-anchor HTML raster composition for one company member. */
export function portraitHTML(person = {}, equipment = {}, size = 160) {
  const portraitSeed = hash(`${person.seed ?? 0}|${person.name ?? ''}`);
  const appearanceIndex = (((portraitSeed >>> 16) ^ portraitSeed) >>> 0) % APPEARANCES.length;
  const specialAppearances = FANTASY_APPEARANCES[person.appearanceId];
  const appearance = specialAppearances ? specialAppearances[portraitSeed % specialAppearances.length] : APPEARANCES[appearanceIndex];
  const width = portraitSize(size);
  const height = Math.round(width * CANVAS.height / CANVAS.width);
  const scale = Number((width / CANVAS.width).toFixed(6));
  const armor = layerSpec('armor', equipment.armor);
  const attachment = layerSpec('attachment', equipment.attachment);
  const mount = layerSpec('mount', equipment.mount);
  const horseHeadFront = ['horse', 'warhorse', 'armoredhorse'].includes(visual(equipment.mount));
  const helmet = layerSpec('helmet', equipment.helmet);
  const helmetVisual = visual(equipment.helmet);
  const coveredHead = Boolean(helmet);
  const dlcHelmet = DLC_ART[equipment.helmet?.baseId || equipment.helmet?.id];
  const hiddenHead = FANTASY_HIDDEN_HEADS.includes(helmetVisual) || dlcHelmet?.hideHead;
  const closedHelmet = dlcHelmet?.hideBeard || helmetVisual === 'greathelm' || helmetVisual === 'full-helm' || FANTASY_CLOSED_HELMETS.includes(helmetVisual);
  const faceClip = helmetVisual === 'bascinet' ? 'clip-path:polygon(9px 17px,49px 17px,49px 54px,10px 58px);' : '';
  const compositionTop = helmetVisual === 'bascinet' ? 13 : 0;
  const rider = `${bodyLayer(appearance.body, Boolean(armor), appearance.bodyLeft, appearance.bodyTop)}
        ${attachmentLayer(attachment, 'back')}
        ${layer('armor', armor, equipment.armor)}
        ${attachmentLayer(attachment, 'front')}
        ${hiddenHead ? '' : `<img data-layer="head" class="bb-layer bb-layer-head" src="${PORTRAIT_ROOT}${appearance.head}" alt="" draggable="false" style="position:absolute;left:${appearance.headLeft}px;top:${appearance.headTop ?? 0}px;${faceClip}max-width:none;pointer-events:none;z-index:4">`}
        ${coveredHead || !appearance.ear ? '' : layer('ear', appearance.ear)}
        ${coveredHead || !appearance.hair ? '' : `<img data-layer="hair" class="bb-layer bb-layer-hair" src="${PORTRAIT_ROOT}${appearance.hair}" alt="" draggable="false" style="position:absolute;left:${appearance.hairLeft ?? 25}px;top:${appearance.hairTop ?? 0}px;max-width:none;pointer-events:none;z-index:4">`}
        ${closedHelmet || !appearance.beard ? '' : `<img data-layer="beard" class="bb-layer bb-layer-beard" src="${PORTRAIT_ROOT}${appearance.beard}" alt="" draggable="false" style="position:absolute;left:27px;top:0;${faceClip}max-width:none;pointer-events:none;z-index:4">`}
        ${layer('helmet', helmet, equipment.helmet)}
        ${layer('shield', layerSpec('shield', equipment.shield), equipment.shield)}
        ${layer('weapon', layerSpec('weapon', equipment.weapon), equipment.weapon)}`;

  return `<span class="bb-portrait" data-portrait-canvas="${CANVAS.width}x${CANVAS.height}" data-appearance="${appearanceIndex}" style="display:inline-block;position:relative;width:${width}px;height:${height}px;overflow:hidden;vertical-align:middle;background:transparent">
    <span class="bb-portrait-canvas" style="display:block;position:absolute;width:104px;height:142px;transform:scale(${scale});transform-origin:top left">
      <span class="bb-portrait-composition" style="display:block;position:absolute;left:0;top:${compositionTop}px;width:104px;height:142px">
        ${mountLayer(mount, 'body')}
        ${horseHeadFront ? '' : mountLayer(mount, 'head')}
        ${mount ? `<span class="bb-portrait-rider" style="display:block;position:absolute;left:0;top:0;width:104px;height:142px;transform:translate(2px,0) scale(.76);transform-origin:top left">${rider}</span>` : rider}
        ${horseHeadFront ? mountLayer(mount, 'head') : ''}
      </span>
    </span>
  </span>`;
}

/** Backward-compatible portrait API retained for existing game UI calls. */
export const portraitSVG = portraitHTML;

/** Return the locally packaged inventory icon for an engine item. */
export function itemImage(item) {
  const id = item?.baseId || item?.id;
  if (DLC_ART[id]) return DLC_ART[id].icon;
  return ITEM_IMAGES[id] ? `${ITEM_ROOT}${ITEM_IMAGES[id]}` : null;
}

export default portraitHTML;
