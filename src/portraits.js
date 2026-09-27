// Local raster layers from Battle-Brothers-Legends/Legends-public.
// See assets/portraits/legends-source.json for the pinned source manifest.

const PORTRAIT_ROOT = 'assets/portraits/';
const ITEM_ROOT = 'assets/items/';
const CANVAS = { width: 104, height: 142 };

const PORTRAIT = {
  armor: {
    padded: ['armor-padded.png', 5, 46],
    leather: ['armor-leather.png', 5, 46],
    mail: ['armor-mail.png', 5, 46],
    brigandine: ['armor-brigandine.png', 5, 46],
    plate: ['armor-plate.png', 5, 46],
  },
  helmet: {
    hood: ['helmet-hood.png', -13, -59],
    nasal: ['helmet-nasal.png', 3, -55],
    kettle: ['helmet-kettle.png', -21, -59],
    greathelm: ['helmet-greathelm.png', -20, -58],
  },
  weapon: {
    spear: ['weapon-spear.png', 44, 0],
    sword: ['weapon-sword.png', 61, 4],
    axe: ['weapon-axe.png', 0, 45],
    bow: ['weapon-bow.png', 45, 0],
  },
  shield: {
    round: ['shield-round.png', 60, 68],
    kite: ['shield-kite.png', 58, 54],
  },
};

const ITEM_IMAGES = {
  'patched-coat': 'patched-coat.png',
  'quilted-jack': 'quilted-jack.png',
  'leather-vest': 'leather-vest.png',
  'mail-shirt': 'mail-shirt.png',
  brigandine: 'brigandine.png',
  'plate-harness': 'plate-harness.png',
  'cloth-hood': 'cloth-hood.png',
  'leather-cap': 'leather-cap.png',
  'iron-helm': 'iron-helm.png',
  'kettle-helm': 'kettle-helm.png',
  greathelm: 'greathelm.png',
  'arming-sword': 'arming-sword.png',
  spear: 'spear.png',
  'wood-axe': 'wood-axe.png',
  'hunting-bow': 'hunting-bow.png',
  buckler: 'buckler.png',
  'round-shield': 'round-shield.png',
  'kite-shield': 'kite-shield.png',
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

function layer(name, spec) {
  if (!spec) return `<span data-layer="${name}" class="bb-layer bb-layer-${name}"></span>`;
  const [file, left, top] = spec;
  return `<img data-layer="${name}" class="bb-layer bb-layer-${name}" src="${PORTRAIT_ROOT}${file}" alt="" draggable="false" style="position:absolute;left:${left}px;top:${top}px;max-width:none;pointer-events:none">`;
}

function bodyLayer(file, armored) {
  const source = `${PORTRAIT_ROOT}${file}`;
  if (!armored) return `<img data-layer="body" class="bb-layer bb-layer-body" src="${source}" alt="" draggable="false" style="position:absolute;left:11px;top:60px;max-width:none;pointer-events:none">`;
  return `<span data-layer="body" class="bb-layer bb-layer-body"><img src="${source}" alt="" draggable="false" style="position:absolute;left:11px;top:50px;clip-path:polygon(0 0,22px 0,22px 60px,0 60px);max-width:none;pointer-events:none"><img src="${source}" alt="" draggable="false" style="position:absolute;left:11px;top:50px;clip-path:polygon(22px 0,60px 0,60px 34px,22px 34px);max-width:none;pointer-events:none"><img src="${source}" alt="" draggable="false" style="position:absolute;left:11px;top:50px;clip-path:polygon(60px 0,82px 0,82px 60px,60px 60px);max-width:none;pointer-events:none"></span>`;
}

function portraitSize(size) {
  const parsed = Number(size);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(1000, Math.round(parsed))) : 160;
}

/** Return a fixed-anchor HTML raster composition for one company member. */
export function portraitHTML(person = {}, equipment = {}, size = 160) {
  const portraitSeed = hash(`${person.seed ?? 0}|${person.name ?? ''}`);
  const width = portraitSize(size);
  const height = Math.round(width * CANVAS.height / CANVAS.width);
  const scale = Number((width / CANVAS.width).toFixed(6));
  const body = portraitSeed % 2 ? 'body-03.png' : 'body-04.png';
  const hair = portraitSeed % 3 ? 'hair-black-21.png' : 'hair-brown-21.png';
  const beard = portraitSeed % 3 === 0 ? 'beard-brown-01.png' : 'beard-black-01.png';
  const armor = PORTRAIT.armor[visual(equipment.armor)];
  const helmet = PORTRAIT.helmet[visual(equipment.helmet)];
  const helmetVisual = visual(equipment.helmet);
  const coveredHead = Boolean(helmet);
  const closedHelmet = helmetVisual === 'greathelm';

  return `<span class="bb-portrait" data-portrait-canvas="${CANVAS.width}x${CANVAS.height}" style="display:inline-block;position:relative;width:${width}px;height:${height}px;overflow:hidden;vertical-align:middle;background:transparent">
    <span class="bb-portrait-canvas" style="display:block;position:absolute;width:104px;height:142px;transform:scale(${scale});transform-origin:top left">
      ${layer('weapon', PORTRAIT.weapon[visual(equipment.weapon)])}
      ${bodyLayer(body, Boolean(armor))}
      ${layer('armor', armor)}
      <img data-layer="head" class="bb-layer bb-layer-head" src="${PORTRAIT_ROOT}head-34.png" alt="" draggable="false" style="position:absolute;left:27px;top:0;max-width:none;pointer-events:none">
      ${coveredHead ? '' : `<img data-layer="hair" class="bb-layer bb-layer-hair" src="${PORTRAIT_ROOT}${hair}" alt="" draggable="false" style="position:absolute;left:25px;top:0;max-width:none;pointer-events:none">`}
      ${closedHelmet ? '' : `<img data-layer="beard" class="bb-layer bb-layer-beard" src="${PORTRAIT_ROOT}${beard}" alt="" draggable="false" style="position:absolute;left:27px;top:0;max-width:none;pointer-events:none">`}
      ${layer('helmet', helmet)}
      ${layer('shield', PORTRAIT.shield[visual(equipment.shield)])}
    </span>
  </span>`;
}

/** Backward-compatible portrait API retained for existing game UI calls. */
export const portraitSVG = portraitHTML;

/** Return the locally packaged inventory icon for an engine item. */
export function itemImage(item) {
  return ITEM_IMAGES[item?.id] ? `${ITEM_ROOT}${ITEM_IMAGES[item.id]}` : null;
}

export default portraitHTML;
