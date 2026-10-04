// Local raster layers from Battle-Brothers-Legends/Legends-public.
// See assets/portraits/legends-source.json for the pinned source manifest.
import { DLC_ITEMS } from './dlc-items.js';
import { NAMED_WEAPON_ART } from './named-weapon-art.js';
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
    noblemail: ['armor-noblemail.png', 10, 52],
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
    'northern-animal-pelt': ['armor-northern-animal-pelt.png', 5, 51],
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
    round: ['shield-round.png', 62, 68],
    kite: ['shield-kite.png', 62, 54],
    heater: ['shield-heater.png', 62, 54],
    adarga: ['shield-adarga.png', 62, 68],
    'painted-round-shield': ['shield-painted-round-shield.png', 62, 68],
    'painted-heater-shield': ['shield-painted-heater-shield.png', 62, 54],
    'painted-tower-shield': ['shield-painted-tower-shield.png', 62, 28, 'scale(.65)', '0 0'],
    'northern-heartwood-shield': ['shield-northern-heartwood-shield.png', 62, 54],
    'northern-iron-round-shield': ['shield-northern-iron-round-shield.png', 62, 68],
  },
  accessory: {
    bandages: ['../items/bandages.png'],
    medical: ['../items/medical-satchel.png'],
    stimulant: ['../items/stimulant.png'],
    'surgeons-kit': ['../items/surgeons-kit.png'],
  },
  attachment: {
    'northern-pelt-mantle': {front:['attachment-northern-pelt-mantle.png',5,46]},
    'ancient-gilded-collar': {front:['attachment-ancient-gilded-collar.png',11,40]},
    'noble-brocade-mantle': {front:['attachment-noble-brocade-mantle.png',5,46]},
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
    'heraldic-plates': { back: ['attachment-heraldic-shoulders-back.png', 65, 53], front: ['attachment-heraldic-shoulders-front.png', 5, 51] },
    'gladiator-pauldrons': { front: ['attachment-gladiator-pauldrons.png', 5, 46] },
    'skull-chain': { front: ['attachment-skull-chain.png', 5, 46] },
    'spiked-chain': { front: ['attachment-spiked-chain.png', 5, 46] },
    'stag-plates': { front: ['attachment-stag-plates.png', 5, 46] },
    'heraldic-shoulders': { front: ['attachment-heraldic-plates.png', 5, 46] },
    'double-mail': { front: ['attachment-double-mail.png', 5, 44] },
    'direwolf-fur': { front: ['attachment-direwolf-fur.png', 5, 44] },
    'unhold-fur': { back: ['attachment-unhold-fur-back.png', 2, 42], front: ['attachment-unhold-fur-front.png', 5, 44] },
    'hyena-fur': { back: ['attachment-hyena-fur-back.png', 0, 42, 'scale(.8)'], front: ['attachment-hyena-fur-front.png', 5, 44] },
    'kraken-mantle': { front: ['attachment-kraken-mantle.png', 5, 46] },
  },
  mount: {
    horse: {body:'mount-horse-body.png',head:'mount-horse-head.png',headLeft:78,headTop:54,scale:1.25,facing:1},
    warhorse: {body:'mount-war-horse-body.png',head:'mount-war-horse-head.png',headLeft:81,headTop:33.6544,scale:1.2272,facing:1},
    armoredhorse: {body:'mount-armored-war-horse-body.png',head:'mount-armored-war-horse-head.png',headLeft:81,headTop:33.28,scale:1.2272,facing:1},
    warg: {body:'mount-wolf-body.png',head:'mount-wolf-head.png',headLeft:139,headTop:70,scale:.98,facing:-1,filter:'sepia(.85) saturate(.7) brightness(.7)'},
    wolf: {body:'mount-wolf-body.png',head:'mount-wolf-head.png',headLeft:139,headTop:70,scale:.98,facing:-1},
  },
};
const SHIELD_WIDTHS = {
  'shield-round.png': 44,
  'shield-kite.png': 48,
  'shield-heater.png': 46,
  'shield-adarga.png': 44,
  'shield-painted-round-shield.png': 46,
  'shield-painted-heater-shield.png': 46,
  'shield-painted-tower-shield.png': 100,
  'shield-northern-heartwood-shield.png': 66,
  'shield-northern-iron-round-shield.png': 56,
};
const SHIELD_HEIGHTS = {'shield-round.png':56,'shield-kite.png':90,'shield-heater.png':74,'shield-adarga.png':56,'shield-painted-round-shield.png':56,'shield-painted-heater-shield.png':74,'shield-painted-tower-shield.png':176,'shield-northern-heartwood-shield.png':88,'shield-northern-iron-round-shield.png':70};
// Rest poses are expressed around the grip, independent of the sprite's crop.
// Native BB long-weapon artwork already slopes from the opposite shoulder to
// the weapon hand: rotating it another 30–35 degrees made it stand upright.
const SHOULDER_WEAPONS = new Set([
  'billhook', 'greatsword', 'greataxe', 'two-handed-hammer', 'heavyhammer',
  'pike', 'polehammer', 'war-scythe', 'warscythe', 'longaxe', 'bardiche',
  'hooked-bill', 'bladed-pike', 'goedendag', 'estoc', 'falx', 'battle-glaive',
  'rhomphaia', 'longsword', 'northern-rusty-greatsword', 'northern-heavy-flail',
]);
const RANGED_WEAPONS = new Set(['bow', 'warbow', 'short-bow', 'composite-bow',
  'crossbow', 'heavy-crossbow', 'heavycrossbow', 'reinforced-crossbow']);
const REVERSED_ONE_HANDERS = new Set(['military-cleaver', 'cleaver',
  'northern-serrated-axe', 'northern-warcleaver']);
// Blade/haft endpoints from the packaged raster crops. Align their axis to
// the diagonal BB rest pose instead of applying one rotation to unlike art.
const SHOULDER_TIPS = {
  'weapon-billhook.png': [5, 8], 'weapon-greatsword.png': [5, 8],
  'weapon-greataxe.png': [18, 9], 'weapon-two-handed-hammer.png': [20, 10],
  'weapon-pike.png': [5, 6], 'weapon-polehammer.png': [18, 8],
  'weapon-war-scythe.png': [6, 5], 'weapon-longaxe.png': [18, 12],
  'weapon-bardiche.png': [8, 7], 'weapon-hooked-bill.png': [5, 8],
  'weapon-bladed-pike.png': [5, 6], 'weapon-goedendag.png': [8, 7],
  'weapon-estoc.png': [8, 8], 'weapon-falx.png': [35, 7],
  'weapon-battle-glaive.png': [7, 8], 'weapon-rhomphaia.png': [8, 7],
  'weapon-longsword.png': [42, 7], 'weapon-northern-rusty-greatsword.png': [8, 10],
  'weapon-northern-heavy-flail.png': [25, 10],
};
const SHOULDER_DIMENSIONS = {
  'weapon-billhook.png': [64, 116],
  'weapon-greatsword.png': [84, 102],
  'weapon-greataxe.png': [80, 94],
  'weapon-two-handed-hammer.png': [88, 104],
  'weapon-pike.png': [68, 114],
  'weapon-polehammer.png': [70, 114],
  'weapon-war-scythe.png': [60, 136],
  'weapon-longaxe.png': [84, 90],
  'weapon-bardiche.png': [96, 112],
  'weapon-hooked-bill.png': [64, 116],
  'weapon-bladed-pike.png': [60, 128],
  'weapon-goedendag.png': [80, 106],
  'weapon-estoc.png': [56, 114],
  'weapon-falx.png': [50, 72],
  'weapon-battle-glaive.png': [60, 80],
  'weapon-rhomphaia.png': [68, 104],
  'weapon-longsword.png': [50, 64],
  'weapon-northern-rusty-greatsword.png': [110, 127],
  'weapon-northern-heavy-flail.png': [74, 108],
};
const ONE_HANDED_DIMENSIONS = {
  'weapon-axe.png': [44, 46], 'weapon-dagger.png': [38, 50],
  'weapon-falchion.png': [70, 140], 'weapon-fighting-knife.png': [36, 40],
  'weapon-fighting-spear.png': [56, 74], 'weapon-flail.png': [44, 72],
  'weapon-hand-axe.png': [54, 62], 'weapon-mace.png': [48, 64],
  'weapon-military-cleaver.png': [78, 108], 'weapon-military-spear.png': [60, 80],
  'weapon-northern-broadhead-spear.png': [62, 86], 'weapon-northern-crude-club.png': [38, 54],
  'weapon-northern-serrated-axe.png': [91, 126], 'weapon-northern-sling.png': [64, 74],
  'weapon-qatal.png': [34, 64], 'weapon-shamshir.png': [64, 78],
  'weapon-spear.png': [60, 80], 'weapon-sword.png': [42, 56],
  'weapon-three-headed-flail.png': [52, 82], 'weapon-warhammer.png': [42, 66],
  'weapon-winged-mace.png': [42, 58], 'weapon-whip.png': [66, 70],
};


// A mounted pawn is one silhouette, not a miniature rider beside an animal.
// All species share this plate/envelope. Natural foreground heads sit on
// connected rear bodies; the exposed lower body reaches a plate below the rider.
const MOUNT_PLATE = {left: 0, top: 138, width: 140, height: 22};
const MOUNT_BODY_BOUNDS = {
  'mount-horse-body.png':[4,9,74,96],
  'mount-war-horse-body.png':[37,20,115,117],
  'mount-armored-war-horse-body.png':[35,20,115,120],
  'mount-wolf-body.png':[0,0,104,100],
};
function uniformScale(transform){return [...(transform??'').matchAll(/scale\(([\d.]+)\)/g)].reduce((product,m)=>product*Number(m[1]),1);}
function mountedShield(spec, mount) {
  if (!spec || !mount) return spec;
  const [file, left, top, transform, origin] = spec;
  const authoredScale = uniformScale(transform);
  const scale = Math.min(authoredScale, 48 / SHIELD_WIDTHS[file]);
  return [file, left, Math.min(Math.max(54, top) + 28,156-SHIELD_HEIGHTS[file]*scale), `scale(${scale})`, '0px 0px'];
}

// Grow foreground equipment around its grip, rather than enlarging the rider
// or horse. Moving the unmounted grip inward offsets the extra framing width.
function mountedWeapon(spec, mount, item) {
  if (!spec) return spec;
  const [file,left,top,transform,origin] = spec;
  const named = NAMED_WEAPON_ART[item?.baseId || item?.id];
  const shoulder = Boolean((item?.twoHanded??named?.twoHanded) && !(item?.ranged??named?.ranged)) || SHOULDER_WEAPONS.has(item?.baseId || item?.id) || SHOULDER_WEAPONS.has(visual(item));
  // Apply the requested increase to the previous equipped size, not inventory art.
  const twoHanded = item?.twoHanded ?? named?.twoHanded ?? shoulder;
  const boost = shoulder ? 1.5 : twoHanded ? 1.8 : 1.56;
  const result=[file,left-(mount||shoulder?0:8),top+(mount?36:0),
    boost===1?transform:`${transform} scale(${boost})`,origin];
  if(named){const bottom=weaponFrame(result,item).rawBottom;result[2]-=Math.max(0,bottom-(115+(mount?36:0)));}
  return result;
}

function weaponRest(spec, item) {
  if (!spec) return spec;
  const [file, , , rest, origin] = spec;
  const [gripX, gripY] = origin.split(' ').map(parseFloat);
  const key = SHOULDER_WEAPONS.has(item?.baseId || item?.id) ? item.baseId || item.id : visual(item);
  const shoulder = item?.twoHanded && !item.ranged || SHOULDER_WEAPONS.has(key);
  if (shoulder) {
    const [tipX, tipY] = SHOULDER_TIPS[file] ?? [0, 0];
    const length = Math.hypot(tipX - gripX, tipY - gripY);
    const [width,height]=SHOULDER_DIMENSIONS[file];
    const scale = Math.min(80 / length, 96 / Math.hypot(width,height));
    const rotation = -130 - Math.atan2(tipY - gripY, tipX - gripX) * 180 / Math.PI;
    return [file, 78 - gripX, 100 - gripY,
      `scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(4)}deg)`, origin];
  }
  if (RANGED_WEAPONS.has(visual(item)) || /crossbow|(?:^|-)bow$/.test(file.replace('weapon-', '').replace('.png', ''))) return spec;
  const reverse = REVERSED_ONE_HANDERS.has(item?.baseId || item?.id) || REVERSED_ONE_HANDERS.has(visual(item));
  return [file, 82 - gripX, 111 - gripY,
    `scaleX(-1) rotate(-30deg) ${reverse ? 'scale(.75) rotate(-30deg) scaleX(-1)' : rest}`, origin];
}

function weaponFrame(spec, item) {
  const key = item?.baseId || item?.id;
  const shoulder = Boolean(item?.twoHanded && !item.ranged) || SHOULDER_WEAPONS.has(key);
  const named=NAMED_WEAPON_ART[item?.baseId||item?.id];
  const dimensions = (named?[named.width,named.height]:null) ?? SHOULDER_DIMENSIONS[spec?.[0]] ??
    (!shoulder && !item?.ranged ? ONE_HANDED_DIMENSIONS[spec?.[0]] : null);
  if (!dimensions) return {left: 0, right: 104, top: 0, bottom: 142};
  const [, left, top, transform, origin] = spec;
  const [gx, gy] = origin.split(' ').map(parseFloat);
  const operations = [...transform.matchAll(/(scaleX|scale|rotate)\(([^)]+)\)/g)].reverse();
  const transformPoint = (x, y) => operations.reduce(([px, py], [, kind, args]) => {
    if (kind === 'rotate') {
      const angle = Number(args.replace('deg', '')) * Math.PI / 180;
      return [px * Math.cos(angle) - py * Math.sin(angle), px * Math.sin(angle) + py * Math.cos(angle)];
    }
    if (kind === 'scaleX') return [px * Number(args), py];
    const scale = Number(args);
    return [px * scale, py * scale];
  }, [x - gx, y - gy]);
  const points = [0, dimensions[0]].flatMap(x => [0, dimensions[1]].map(y => {
    const [px, py] = transformPoint(x, y);
    return [left + gx + px, top + gy + py];
  }));
  return {rawBottom:Math.max(...points.map(p=>p[1])),left: Math.min(0, ...points.map(p => p[0])), right: Math.max(104, ...points.map(p => p[0])),
    top: Math.min(0, ...points.map(p => p[1])), bottom: Math.max(142, ...points.map(p => p[1]))};
}

const PORTRAIT = VISUALS;

const ITEM_IMAGES = {
  'northern-pelt-mantle':'northern-pelt-mantle.png',
  'ancient-gilded-collar':'ancient-gilded-collar.png',
  'noble-brocade-mantle':'noble-brocade-mantle.png',
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
  'double-mail': 'double-mail.png',
  'direwolf-fur': 'direwolf-fur.png',
  'unhold-fur': 'unhold-fur.png',
  'hyena-fur': 'hyena-fur.png',
  'horned-pauldrons': 'horned-pauldrons.png',
  'chain-mantle': 'chain-mantle.png',
  'heraldic-plates': 'heraldic-shoulders.png',
  'gladiator-pauldrons': 'gladiator-pauldrons.png',
  'skull-chain': 'skull-chain.png',
  'spiked-chain': 'spiked-chain.png',
  'stag-plates': 'stag-plates.png',
  'heraldic-shoulders': 'heraldic-plates.png',
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
  const named=NAMED_WEAPON_ART[item?.baseId||item?.id];
  if(category==='weapon'&&named){
    const [gx,gy]=named.grip,[tx,ty]=named.tip;
    const angle=Math.atan2(ty-gy,tx-gx)*180/Math.PI;
    const ranged=item.ranged??named.ranged,heavy=(item.twoHanded??named.twoHanded)&&!ranged;
    const rangedPose=ranged&&!(item.throwing??named.throwing);
    const scale=Number((heavy?Math.min(80/Math.hypot(tx-gx,ty-gy),96/Math.hypot(named.width,named.height)):1).toFixed(4));
    const rotation=Number((rangedPose?0:heavy?-145-angle:-60-angle).toFixed(4));
    const radians=rotation*Math.PI/180;
    // A source grip can sit well above the butt. Bound the entire rotated sprite,
    // rather than letting its handle hang below the pawn's 116px ground anchor.
    const bottom=Math.max(...[0,named.width].flatMap(x=>[0,named.height].map(y=>scale*((x-gx)*Math.sin(radians)+(y-gy)*Math.cos(radians)))));
    const handY=heavy?Math.min(100,115-bottom):rangedPose?105:111;
    return [named.portrait,(heavy?78:rangedPose?70:82)-gx,handY-gy,`scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(4)}deg)`,`${gx}px ${gy}px`];
  }
  const source = DLC_ART[item?.baseId || item?.id || visual(item)];
  if (source && (category === 'armor' || category === 'helmet')) return [source.portrait, source.left, source.top];
  const variants = PORTRAIT[category];
  const id = String(item?.baseId || item?.id || '').toLowerCase();
  const spec = variants[id] || variants[visual(item)];
  if(category==='shield'&&spec){const [file,left,top,transform,origin]=spec;return [file,left,top,`${transform??''} scale(1.12)`.trim(),origin??'0px 0px'];}
  return category === 'weapon' ? weaponRest(spec, item) : spec;
}

function layer(name, spec, item) {
  if (!spec) return `<span data-layer="${name}" class="bb-layer bb-layer-${name}"></span>`;
  const [file, left, top, transform, transformOrigin] = spec;
  const origin = transformOrigin ?? 'center';
  const weaponStyle = name === 'weapon' && transform ? `--layer-rest:${transform};--layer-origin:${origin};--weapon-rest:${transform};--weapon-origin:${origin};` : '';
  const transformStyle = transform ? `${weaponStyle}transform:${transform};transform-origin:${origin};` : '';
  const famed = ['famed','named'].includes(item?.rarity) ? ' bb-layer-famed' : '';
  const zIndex = { armor: 1, ear: 4, helmet: 5, shield: 6, weapon: 7 }[name] ?? 0;
  return `<img data-layer="${name}" class="bb-layer bb-layer-${name}${famed}" src="${file.startsWith('data:') ? file : PORTRAIT_ROOT + file}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;${transformStyle}max-width:none;pointer-events:none;z-index:${zIndex}">`;
}

function bodyLayer(file, armored, left = 11, top = 50) {
  const source = `${file.startsWith('data:') ? file : PORTRAIT_ROOT + file}`;
  if (!armored) return `<img data-layer="body" class="bb-layer bb-layer-body" src="${source}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;max-width:none;pointer-events:none">`;
  return `<span data-layer="body" class="bb-layer bb-layer-body"><img src="${source}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;clip-path:polygon(0 0,22px 0,22px 60px,0 60px);max-width:none;pointer-events:none"><img src="${source}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;clip-path:polygon(22px 0,60px 0,60px 34px,22px 34px);max-width:none;pointer-events:none"><img src="${source}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;clip-path:polygon(60px 0,82px 0,82px 60px,60px 60px);max-width:none;pointer-events:none"></span>`;
}

function attachmentLayer(spec, part, slot='attachment') {
  const layerSpec = spec?.[part];
  if (!layerSpec) return '';
  const [file, left, top, transform] = layerSpec;
  return `<img data-layer="${slot}-${part}" class="bb-layer bb-layer-attachment" src="${file.startsWith('data:') ? file : PORTRAIT_ROOT + file}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;${transform ? `transform:${transform};transform-origin:top left;` : ''}max-width:none;pointer-events:none;z-index:${part === 'back' ? 2 : 3}">`;
}

function mountLayer(spec, part) {
  if (!spec) return '';
  const {body,head,headLeft,headTop,filter,facing,scale}=spec;
  const file=part==='body'?body:head;
  let left=headLeft,top=headTop,transform=`scaleX(${facing}) scale(${scale})`;
  if(part==='body'){
    // Rear animal mass supports the rider instead of becoming a second bust
    // beside them. Normalize its opaque crop beneath the torso; the rider
    // masks the upper portion. Leave a substantial lower body exposed beneath
    // the armor instead of enlarging only the concealed crop.
    const [x1,y1,x2,y2]=MOUNT_BODY_BOUNDS[body];
    const wolfBody = body === 'mount-wolf-body.png';
    const warHorse = body.includes('war-horse');
    const size = warHorse ? 1.18 : 1;
    const bodyTop = wolfBody ? 78 : 156 - 98 * size;
    const bodyWidth = warHorse ? 140 : 129;
    const sx=bodyWidth/(x2-x1),sy=(156-bodyTop)/(y2-y1);
    left=facing===1?0-x1*sx:bodyWidth+x1*sx;top=bodyTop-y1*sy;
    transform=`scale(${facing*sx},${sy})`;
  }
  return `<img data-layer="mount-${part}" class="bb-layer bb-layer-mount" src="${PORTRAIT_ROOT+file}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;transform:${transform};transform-origin:top left;${filter?`filter:${filter};`:''}z-index:${part==='head'?5:0};max-width:none;pointer-events:none">`;
}

function portraitFrame(equipment) {
  // Equipment must not change the rider's size. Tall weapons, horns and mounts
  // extend beyond the nominal canvas instead of shrinking the whole character.
  const top = visual(equipment.helmet) === 'bascinet' ? 13 : 0;
  return {left: 0, top, scale: 1, transform: ''};
}

/** Ground contact in the same framed coordinate space as the rendered pawn. */
export function portraitGroundAnchor(equipment = {}) {
  const frame=portraitFrame(equipment);
  const foot=equipment.mount?MOUNT_PLATE.top+MOUNT_PLATE.height:116;
  return {x:frame.left+(equipment.mount?70:52)*frame.scale,y:frame.top+foot*frame.scale};
}

/** Grip in the shared 104×142 coordinate space, including equipment framing. */
export function portraitWeaponAnchor(equipment = {}) {
  const weapon = mountedWeapon(layerSpec('weapon', equipment.weapon), equipment.mount, equipment.weapon);
  if (!weapon) return {x: 52, y: 95};
  const [, left, top, , origin] = weapon;
  const [gx, gy] = origin.split(' ').map(parseFloat);
  const frame = portraitFrame(equipment, weapon);
  return {x: frame.left + (left + gx) * frame.scale, y: frame.top + (top + gy) * frame.scale};
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
  const attachment2=layerSpec('attachment',equipment.attachment2);
  const mount = layerSpec('mount', equipment.mount);
  const helmet = layerSpec('helmet', equipment.helmet);
  const shield = mountedShield(layerSpec('shield', equipment.shield), mount);
  const weapon = mountedWeapon(layerSpec('weapon', equipment.weapon), equipment.mount, equipment.weapon);
  const helmetVisual = visual(equipment.helmet);
  const coveredHead = Boolean(helmet);
  const dlcHelmet = DLC_ART[equipment.helmet?.baseId || equipment.helmet?.id];
  const hiddenHead = FANTASY_HIDDEN_HEADS.includes(helmetVisual) || dlcHelmet?.hideHead;
  const closedHelmet = dlcHelmet?.hideBeard || helmetVisual === 'greathelm' || helmetVisual === 'full-helm' || FANTASY_CLOSED_HELMETS.includes(helmetVisual);
  const faceClip = helmetVisual === 'bascinet' ? 'clip-path:polygon(9px 17px,49px 17px,49px 54px,10px 58px);' : '';
  const {left: compositionLeft, top: compositionTop, transform: compositionTransform} = portraitFrame(equipment, weapon, shield);
  const rider = `${bodyLayer(appearance.body, Boolean(armor), appearance.bodyLeft, appearance.bodyTop)}
        ${attachmentLayer(attachment, 'back')}${attachmentLayer(attachment2,'back','attachment2')}
        ${layer('armor', armor, equipment.armor)}
        ${attachmentLayer(attachment, 'front')}${attachmentLayer(attachment2,'front','attachment2')}
        ${hiddenHead ? '' : `<img data-layer="head" class="bb-layer bb-layer-head" src="${PORTRAIT_ROOT}${appearance.head}" alt="" draggable="false" style="position:absolute;left:${appearance.headLeft}px;top:${appearance.headTop ?? 0}px;${faceClip}max-width:none;pointer-events:none;z-index:4">`}
        ${coveredHead || !appearance.ear ? '' : layer('ear', appearance.ear)}
        ${coveredHead || !appearance.hair ? '' : `<img data-layer="hair" class="bb-layer bb-layer-hair" src="${PORTRAIT_ROOT}${appearance.hair}" alt="" draggable="false" style="position:absolute;left:${appearance.hairLeft ?? 25}px;top:${appearance.hairTop ?? 0}px;max-width:none;pointer-events:none;z-index:4">`}
        ${closedHelmet || !appearance.beard ? '' : `<img data-layer="beard" class="bb-layer bb-layer-beard" src="${PORTRAIT_ROOT}${appearance.beard}" alt="" draggable="false" style="position:absolute;left:27px;top:0;${faceClip}max-width:none;pointer-events:none;z-index:4">`}
        ${layer('helmet', helmet, equipment.helmet)}`;

  return `<span class="bb-portrait" data-portrait-canvas="${CANVAS.width}x${CANVAS.height}" data-appearance="${appearanceIndex}" style="display:inline-block;position:relative;width:${width}px;height:${height}px;overflow:visible;vertical-align:middle;background:transparent">
    <span class="bb-portrait-canvas" style="display:block;position:absolute;width:104px;height:142px;transform:scale(${scale});transform-origin:top left">
      <span class="bb-portrait-composition" style="display:block;position:absolute;left:${compositionLeft}px;top:${compositionTop}px;width:104px;height:142px;${compositionTransform}">
        ${mount ? `<span data-layer="base-plate" class="bb-portrait-base" style="position:absolute;left:${MOUNT_PLATE.left}px;top:${MOUNT_PLATE.top}px;width:${MOUNT_PLATE.width}px;height:${MOUNT_PLATE.height}px;border-radius:50%;background:linear-gradient(#c4c5bc,#81847c 45%,#535850);border:2px solid #363b34;box-shadow:inset 0 -3px 0 #3d433a;box-sizing:border-box;z-index:0"></span>` : ''}
        ${mountLayer(mount, 'body')}
        ${mount ? `<span data-layer="rider" style="position:absolute;left:0;top:36px;width:104px;height:142px;z-index:1">${rider}</span>` : rider}
        ${mountLayer(mount, 'head')}
        ${layer('shield', shield, equipment.shield)}
        ${layer('weapon', weapon, equipment.weapon)}
      </span>
    </span>
  </span>`;
}

/** Backward-compatible portrait API retained for existing game UI calls. */
export const portraitSVG = portraitHTML;

/** Return the locally packaged inventory icon for an engine item. */
export function itemImage(item) {
  const id = item?.baseId || item?.id;
  if(NAMED_WEAPON_ART[id])return NAMED_WEAPON_ART[id].icon;
  if (DLC_ART[id]) return DLC_ART[id].icon;
  return ITEM_IMAGES[id] ? `${ITEM_ROOT}${ITEM_IMAGES[id]}` : null;
}

export default portraitHTML;
