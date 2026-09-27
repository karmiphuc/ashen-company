// Local raster layers from Battle-Brothers-Legends/Legends-public.
// See assets/portraits/legends-source.json for the pinned source manifest.

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
  },
  helmet: {
    hood: ['helmet-hood.png', -16, -60],
    nasal: ['helmet-nasal.png', -20, -55],
    kettle: ['helmet-kettle.png', -23, -59],
    greathelm: ['helmet-greathelm.png', -20, -58],
    bascinet: ['helmet-bascinet.png', 17, -13],
    mailcoif: ['helmet-mailcoif.png', -20, -55],
    headwrap: ['helmet-headwrap.png', -20, -55],
    southernhelm: ['helmet-southern.png', -20, -55],
    barbarianhelm: ['helmet-barbarian.png', -20, -55],
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
  },
  shield: {
    round: ['shield-round.png', 8, 68],
    kite: ['shield-kite.png', 6, 54],
    heater: ['shield-heater.png', 6, 54],
    adarga: ['shield-adarga.png', 8, 68],
  },
  accessory: {
    bandages: ['../items/bandages.png'],
    medical: ['../items/medical-satchel.png'],
    stimulant: ['../items/stimulant.png'],
  },
};
const PORTRAIT = VISUALS;

const ITEM_IMAGES = {
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
  return `<img data-layer="${name}" class="bb-layer bb-layer-${name}${famed}" src="${PORTRAIT_ROOT}${file}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;${transformStyle}max-width:none;pointer-events:none">`;
}

function bodyLayer(file, armored) {
  const source = `${PORTRAIT_ROOT}${file}`;
  if (!armored) return `<img data-layer="body" class="bb-layer bb-layer-body" src="${source}" alt="" draggable="false" style="position:absolute;left:11px;top:50px;max-width:none;pointer-events:none">`;
  return `<span data-layer="body" class="bb-layer bb-layer-body"><img src="${source}" alt="" draggable="false" style="position:absolute;left:11px;top:50px;clip-path:polygon(0 0,22px 0,22px 60px,0 60px);max-width:none;pointer-events:none"><img src="${source}" alt="" draggable="false" style="position:absolute;left:11px;top:50px;clip-path:polygon(22px 0,60px 0,60px 34px,22px 34px);max-width:none;pointer-events:none"><img src="${source}" alt="" draggable="false" style="position:absolute;left:11px;top:50px;clip-path:polygon(60px 0,82px 0,82px 60px,60px 60px);max-width:none;pointer-events:none"></span>`;
}

function portraitSize(size) {
  const parsed = Number(size);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(1000, Math.round(parsed))) : 160;
}

/** Return a fixed-anchor HTML raster composition for one company member. */
export function portraitHTML(person = {}, equipment = {}, size = 160) {
  const portraitSeed = hash(`${person.seed ?? 0}|${person.name ?? ''}`);
  const appearanceIndex = (((portraitSeed >>> 16) ^ portraitSeed) >>> 0) % APPEARANCES.length;
  const appearance = APPEARANCES[appearanceIndex];
  const width = portraitSize(size);
  const height = Math.round(width * CANVAS.height / CANVAS.width);
  const scale = Number((width / CANVAS.width).toFixed(6));
  const armor = layerSpec('armor', equipment.armor);
  const helmet = layerSpec('helmet', equipment.helmet);
  const helmetVisual = visual(equipment.helmet);
  const coveredHead = Boolean(helmet);
  const closedHelmet = helmetVisual === 'greathelm';
  const faceClip = helmetVisual === 'bascinet' ? 'clip-path:polygon(9px 17px,49px 17px,49px 54px,10px 58px);' : '';
  const compositionTop = helmetVisual === 'bascinet' ? 13 : 0;

  return `<span class="bb-portrait" data-portrait-canvas="${CANVAS.width}x${CANVAS.height}" data-appearance="${appearanceIndex}" style="display:inline-block;position:relative;width:${width}px;height:${height}px;overflow:hidden;vertical-align:middle;background:transparent">
    <span class="bb-portrait-canvas" style="display:block;position:absolute;width:104px;height:142px;transform:scale(${scale});transform-origin:top left">
      <span class="bb-portrait-composition" style="display:block;position:absolute;left:0;top:${compositionTop}px;width:104px;height:142px">
        ${bodyLayer(appearance.body, Boolean(armor))}
        ${layer('armor', armor, equipment.armor)}
        <img data-layer="head" class="bb-layer bb-layer-head" src="${PORTRAIT_ROOT}${appearance.head}" alt="" draggable="false" style="position:absolute;left:${appearance.headLeft}px;top:0;${faceClip}max-width:none;pointer-events:none">
        ${coveredHead || !appearance.hair ? '' : `<img data-layer="hair" class="bb-layer bb-layer-hair" src="${PORTRAIT_ROOT}${appearance.hair}" alt="" draggable="false" style="position:absolute;left:25px;top:0;max-width:none;pointer-events:none">`}
        ${closedHelmet || !appearance.beard ? '' : `<img data-layer="beard" class="bb-layer bb-layer-beard" src="${PORTRAIT_ROOT}${appearance.beard}" alt="" draggable="false" style="position:absolute;left:27px;top:0;${faceClip}max-width:none;pointer-events:none">`}
        ${layer('helmet', helmet, equipment.helmet)}
        ${layer('shield', layerSpec('shield', equipment.shield), equipment.shield)}
        ${layer('weapon', layerSpec('weapon', equipment.weapon), equipment.weapon)}
      </span>
    </span>
  </span>`;
}

/** Backward-compatible portrait API retained for existing game UI calls. */
export const portraitSVG = portraitHTML;

/** Return the locally packaged inventory icon for an engine item. */
export function itemImage(item) {
  const id = item?.baseId || item?.id;
  return ITEM_IMAGES[id] ? `${ITEM_ROOT}${ITEM_IMAGES[id]}` : null;
}

export default portraitHTML;
