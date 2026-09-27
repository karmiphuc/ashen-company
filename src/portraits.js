// Original, dependency-free SVG portraits for Ashen Company.
// Layers are deliberately named so a caller can inspect or restyle equipment.

const PALETTE = {
  skin: ['#f3c39d', '#d9956e', '#a9654c', '#744333', '#c9825f'],
  hair: ['#201913', '#4d2d1c', '#80502d', '#b77738', '#39342c'],
  cloth: ['#3a4a51', '#5d4232', '#5a5a49', '#33404a', '#57423d'],
  metal: ['#9fa5a1', '#b9b8a8', '#78888b', '#c2b7a1'],
};

function hash(value) {
  let h = 2166136261;
  const text = String(value ?? '0');
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(values, n, offset = 0) {
  return values[(n + offset) % values.length];
}

function safeColor(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback;
}

function visual(item) {
  return String(item?.visual || item?.id || '').toLowerCase();
}

function silhouetteArmor(kind, color, metal, accent) {
  switch (kind) {
    case 'leather':
      return `<path d="M29 150 Q35 119 61 113 L99 113 Q127 119 133 150Z" fill="${color}"/>
        <path d="M35 144 Q62 127 80 143 Q98 127 127 144 M50 119 L64 150 M110 119 L96 150" fill="none" stroke="${accent}" stroke-width="4" opacity=".75"/>
        <path d="M57 115 L63 150 M74 114 L76 151 M103 114 L99 151" fill="none" stroke="#251b16" stroke-width="2" opacity=".65"/>`;
    case 'mail':
      return `<path d="M26 150 Q32 116 59 111 L101 111 Q128 116 134 150Z" fill="${metal}"/>
        <path d="M32 143 H128 M37 134 H123 M44 125 H116 M53 117 H107" fill="none" stroke="#53666a" stroke-width="4" stroke-dasharray="2 5" opacity=".95"/>
        <path d="M62 113 V150 M80 112 V150 M98 113 V150" fill="none" stroke="#d4d1bd" stroke-width="2" opacity=".8"/>`;
    case 'brigandine':
      return `<path d="M27 150 Q34 117 60 111 L100 111 Q126 117 133 150Z" fill="${color}"/>
        <path d="M52 116 L52 150 M70 112 L70 150 M90 112 L90 150 M108 116 L108 150" fill="none" stroke="${metal}" stroke-width="5"/>
        <path d="M39 133 H121" stroke="#271f18" stroke-width="3" opacity=".65"/>`;
    case 'plate':
      return `<path d="M23 150 Q30 116 58 109 L102 109 Q130 116 137 150Z" fill="${metal}"/>
        <path d="M45 115 Q55 137 80 142 Q105 137 115 115 M31 136 Q54 129 61 150 M129 136 Q106 129 99 150" fill="none" stroke="#51666a" stroke-width="4"/>
        <path d="M80 112 V145" stroke="#dee0d0" stroke-width="3"/><circle cx="80" cy="124" r="3" fill="${accent}"/>`;
    case 'padded':
    default:
      return `<path d="M25 150 Q31 118 57 111 L103 111 Q129 118 135 150Z" fill="${color}"/>
        <path d="M35 143 Q50 129 65 143 Q80 129 95 143 Q110 129 125 143 M43 129 Q56 117 69 129 Q82 117 95 129 Q108 117 119 129" fill="none" stroke="${accent}" stroke-width="3" opacity=".85"/>`;
  }
}

function weaponArt(kind, color, metal) {
  switch (kind) {
    case 'sword':
      return `<g transform="rotate(24 126 99)"><path d="M122 145 L126 44 L132 44 L134 145" fill="${metal}"/><path d="M120 62 L129 27 L138 62Z" fill="#d7d7c7"/><path d="M114 140 H142" stroke="#4a3020" stroke-width="6"/><path d="M123 145 H134 V158 H123Z" fill="${color}"/></g>`;
    case 'axe':
      return `<g transform="rotate(20 125 103)"><path d="M122 154 L129 42" stroke="#6a4127" stroke-width="7"/><path d="M127 57 Q147 43 153 60 Q145 79 128 76Z" fill="${metal}" stroke="#283235" stroke-width="3"/></g>`;
    case 'bow':
      return `<g transform="rotate(14 126 98)"><path d="M127 38 Q158 89 127 151" fill="none" stroke="#845536" stroke-width="6"/><path d="M127 38 L127 151" stroke="#d4c8a3" stroke-width="1.5"/><path d="M118 76 L140 76" stroke="${metal}" stroke-width="3"/><path d="M136 72 L145 76 L136 80" fill="${metal}"/></g>`;
    case 'spear':
    default:
      return `<g transform="rotate(18 124 100)"><path d="M122 157 L129 44" stroke="#785235" stroke-width="7"/><path d="M129 20 L140 51 L129 61 L118 51Z" fill="${metal}" stroke="#273235" stroke-width="3"/></g>`;
  }
}

function shieldArt(kind, color, metal) {
  if (kind === 'kite') {
    return `<path d="M110 113 Q132 106 149 115 L147 139 Q140 153 130 158 Q117 151 111 137Z" fill="${color}"/>
      <path d="M130 111 V153 M113 127 H147" stroke="${metal}" stroke-width="4"/><path d="M130 116 V149" stroke="#efe2ba" stroke-width="2"/>`;
  }
  return `<circle cx="130" cy="133" r="24" fill="${color}"/><circle cx="130" cy="133" r="19" fill="none" stroke="${metal}" stroke-width="4"/><circle cx="130" cy="133" r="6" fill="${metal}"/>`;
}

function helmetArt(kind, metal, leather, face) {
  switch (kind) {
    case 'nasal':
      return `<path d="M48 89 L48 59 Q56 32 80 31 Q104 32 112 59 L112 89 L102 82 V60 Q94 44 80 44 Q66 44 58 60 V82Z" fill="${metal}"/>
        <path d="M80 42 V91" stroke="#4b5a5b" stroke-width="7"/><path d="M54 61 Q80 52 106 61" fill="none" stroke="#d6d7c4" stroke-width="3"/><path d="M75 91 L80 104 L85 91" fill="${metal}"/>`;
    case 'kettle':
      return `<path d="M42 62 Q46 35 80 30 Q114 35 118 62 L112 74 H48Z" fill="${metal}"/><path d="M35 68 Q80 57 125 68 L119 77 Q80 70 41 77Z" fill="${metal}"/><path d="M51 60 Q80 51 109 60" fill="none" stroke="#d9d9c7" stroke-width="3"/>`;
    case 'greathelm':
      return `<path d="M47 88 V56 Q55 31 80 29 Q105 31 113 56 V91 Q98 102 80 103 Q62 102 47 91Z" fill="${metal}"/>
        <path d="M80 35 V98 M53 59 H107" stroke="#485759" stroke-width="5"/><path d="M57 69 H72 M88 69 H103" stroke="#242b2c" stroke-width="4"/><path d="M61 87 H99" stroke="#d6d3bf" stroke-width="2"/>`;
    case 'hood':
    default:
      return `<path d="M43 91 Q39 62 53 43 Q66 27 81 29 Q102 33 114 54 L116 92 Q104 79 101 61 Q94 45 80 45 Q64 45 57 63 Q55 81 43 91Z" fill="${leather}"/>
        <path d="M48 67 Q80 48 111 67" fill="none" stroke="#211b19" stroke-width="3" opacity=".7"/>`;
  }
}

/**
 * Return a self-contained, deterministic mercenary bust SVG.
 * `equipment` accepts armor, helmet, weapon and shield item objects.
 */
export function portraitSVG(person = {}, equipment = {}, size = 160) {
  const seed = hash(`${person.seed ?? 0}|${person.name ?? ''}`);
  const n = (offset) => (seed >>> ((offset % 6) * 4)) & 15;
  const armor = equipment.armor || {};
  const helmet = equipment.helmet || null;
  const weapon = equipment.weapon || null;
  const shield = equipment.shield || null;
  const armorKind = visual(armor) || 'padded';
  const armorColor = safeColor(armor.color, pick(PALETTE.cloth, n(0)));
  const skin = safeColor(person.skin, pick(PALETTE.skin, n(1)));
  const hair = pick(PALETTE.hair, n(2));
  const metal = safeColor(helmet?.color, pick(PALETTE.metal, n(3)));
  const accent = safeColor(armor.color, '#c59a57');
  const prefix = `ac-${hash(`${seed}|${armor.id || ''}|${helmet?.id || ''}|${weapon?.id || ''}|${shield?.id || ''}`).toString(36)}`;
  const beard = n(4) % 3;
  const scar = n(5) % 4 === 0;
  const faceWidth = 27 + (n(0) % 4);
  const weaponKind = visual(weapon) || 'spear';
  const shieldKind = visual(shield) || 'round';
  const shieldColor = safeColor(shield?.color, '#774534');
  const helmetKind = visual(helmet) || 'hood';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="${size}" height="${size}" role="img" aria-label="Mercenary portrait" data-portrait-id="${prefix}">
    <defs>
      <linearGradient id="${prefix}-paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e7d5a9"/><stop offset="1" stop-color="#b98c5d"/></linearGradient>
      <radialGradient id="${prefix}-shade" cx="48%" cy="38%"><stop offset=".48" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#291a14" stop-opacity=".38"/></radialGradient>
      <filter id="${prefix}-rough"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" result="noise"/><feComposite in="noise" in2="SourceGraphic" operator="in" result="texture"/><feBlend in="SourceGraphic" in2="texture" mode="multiply"/></filter>
    </defs>
    <g data-layer="background"><rect width="160" height="160" rx="10" fill="url(#${prefix}-paper)"/><path d="M8 20 Q45 8 75 17 T151 12 M7 146 Q53 132 96 147 T156 139" fill="none" stroke="#8d6541" stroke-width="2" opacity=".45"/></g>
    <g data-layer="weapon" stroke="#251d18" stroke-width="3" stroke-linejoin="round">${weapon ? weaponArt(weaponKind, safeColor(weapon.color, '#523526'), metal) : ''}</g>
    <g data-layer="torso" stroke="#251d18" stroke-width="3" stroke-linejoin="round">
      <path d="M62 108 L80 128 L98 108" fill="#2d2926"/>
      ${silhouetteArmor(armorKind, armorColor, metal, accent)}
      <path d="M71 111 L80 126 L89 111" fill="none" stroke="#e0c28b" stroke-width="3"/>
    </g>
    <g data-layer="face" stroke="#251d18" stroke-width="3" stroke-linejoin="round">
      <path d="M${80 - faceWidth} 59 Q${80 - faceWidth - 1} 92 80 108 Q${80 + faceWidth + 1} 92 ${80 + faceWidth} 59 Q105 41 80 39 Q55 41 ${80 - faceWidth} 59Z" fill="${skin}"/>
      <path d="M${80 - faceWidth + 4} 59 Q80 38 ${80 + faceWidth - 4} 59 Q99 49 93 44 Q80 36 66 45 Q58 49 ${80 - faceWidth + 4} 59Z" fill="${hair}"/>
      <path d="M62 70 Q68 66 74 70 M86 70 Q92 66 98 70" fill="none" stroke="#251d18" stroke-width="3"/>
      <path d="M66 74 L73 74 M87 74 L94 74" stroke="#d9e2dc" stroke-width="2"/>
      <path d="M80 72 L77 85 L82 86" fill="none" stroke="#7c4736" stroke-width="2"/>
      <path d="M73 94 Q80 98 88 94" fill="none" stroke="#743c32" stroke-width="2"/>
      ${beard === 1 ? `<path d="M61 86 Q66 108 80 110 Q95 108 100 86 Q92 97 80 96 Q68 97 61 86Z" fill="${hair}"/>` : ''}
      ${beard === 2 ? `<path d="M66 89 Q70 109 80 110 Q90 109 94 89 L89 100 H71Z" fill="${hair}"/><path d="M68 91 Q80 96 92 91" fill="none" stroke="#1e1814" stroke-width="2"/>` : ''}
      ${scar ? '<path d="M93 77 L88 90" stroke="#8b3d34" stroke-width="2"/>' : ''}
    </g>
    <g data-layer="helmet" stroke="#251d18" stroke-width="3" stroke-linejoin="round">${helmet ? helmetArt(helmetKind, metal, safeColor(helmet.color, '#49382c'), skin) : ''}</g>
    <g data-layer="shield" stroke="#251d18" stroke-width="3" stroke-linejoin="round">${shield ? shieldArt(shieldKind, shieldColor, metal) : ''}</g>
    <g data-layer="finish"><rect width="160" height="160" rx="10" fill="url(#${prefix}-shade)" pointer-events="none"/><rect x="4" y="4" width="152" height="152" rx="7" fill="none" stroke="#3a251b" stroke-width="3" opacity=".7"/></g>
  </svg>`;
}

export default portraitSVG;
