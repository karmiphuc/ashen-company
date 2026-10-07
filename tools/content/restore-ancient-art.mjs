// Reproducible selective recoloring of the original RGBA sprites, never a redraw.
import { inflateSync, deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { DLC_ART } from '../../src/dlc-art.js';
import { ANCIENT_RESTORATION_TARGETS } from '../../src/ancient-restoration.js';

const root = new URL('../../', import.meta.url);
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length); out.write(type, 4); data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, -4)), out.length - 4);
  return out;
}
export function decodePng(bytes) {
  const png = typeof bytes === 'string' ? Buffer.from(bytes.split(',')[1], 'base64') : bytes, idats = [];
  let width, height;
  for (let pos = 8; pos < png.length;) {
    const length = png.readUInt32BE(pos), type = png.toString('ascii', pos + 4, pos + 8), data = png.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('Expected noninterlaced 8-bit RGBA source.');
    }
    if (type === 'IDAT') idats.push(data);
    pos += length + 12;
  }
  const raw = inflateSync(Buffer.concat(idats)), stride = width * 4, rgba = Buffer.alloc(width * height * 4);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) throw new Error('Invalid PNG filter.');
    for (let x = 0; x < stride; x++) {
      const p = y * stride + x, a = x >= 4 ? rgba[p - 4] : 0, b = y ? rgba[p - stride] : 0, c = y && x >= 4 ? rgba[p - stride - 4] : 0;
      rgba[p] = raw[y * (stride + 1) + x + 1] + [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
    }
  }
  return { width, height, rgba };
}
function encode({ width, height, rgba }) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const stride = width * 4, raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
export function restorePixels(image, finish, sourceId, layer) {
  const { width, height } = image, rgba = Buffer.from(image.rgba);
  const armor = !sourceId.endsWith('-helmet');
  // The breastplate's lower hanging skirt is leather, not bronze.
  const leatherSkirt = sourceId === 'bb-ancient-breastplate';
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = (y * width + x) * 4, [r, g, b, a] = rgba.subarray(p, p + 4);
    if (!a) continue;
    if (leatherSkirt && y / height > (layer === 'icon' ? .62 : .74)) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), saturation = (max - min) / Math.max(1, max);
    // Exclude neutral iron/mail, dark leather, and the helmet's dark plume.
    const bronze = r >= g * 1.03 && g >= b * 1.12;
    const patina = g >= r * .88 && g >= b * 1.13;
    if (max < (armor ? 42 : 48) || saturation < .16 || (!bronze && !patina)) continue;
    const light = .299 * r + .587 * g + .114 * b;
    // Retain a trace of green in darker corroded seams rather than bleach them.
    const amount = finish === 'steel' ? .94 : patina && !bronze && light < 70 ? .58 : .84;
    const base = Math.min(235, light * 1.28 + 9);
    const target = finish === 'steel' ? [base * .96, base, base * 1.04] : [base * 1.23, base * .91, base * .59];
    for (let c = 0; c < 3; c++) rgba[p + c] = Math.min(255, Math.round(rgba[p + c] * (1 - amount) + target[c] * amount));
  }
  return { width, height, rgba };
}

export async function generateAncientArt() {
await mkdir(new URL('assets/ancient-restoration/', root), { recursive: true });
const art = {}, assets = [];
for (const sourceId of Object.keys(ANCIENT_RESTORATION_TARGETS)) {
  const source = DLC_ART[sourceId]; art[sourceId] = {};
  for (const finish of ['bronze', 'steel']) {
    const spec = { ...source };
    for (const layer of ['icon', 'portrait']) {
      const path = `assets/ancient-restoration/${sourceId}-${finish}-${layer}.png`;
      const original = Buffer.from(source[layer].split(',')[1], 'base64');
      const bytes = encode(restorePixels(decodePng(original), finish, sourceId, layer));
      await writeFile(new URL(path, root), bytes);
      assets.push({ sourceId, finish, layer, path, sourceSha256: createHash('sha256').update(original).digest('hex'), sha256: createHash('sha256').update(bytes).digest('hex') });
      spec[layer] = `./${path}`;
    }
    art[sourceId][finish] = spec;
  }
}
await writeFile(new URL('src/ancient-restoration-art.js', root), `// Generated by tools/content/restore-ancient-art.mjs; original layer bounds retained.\nexport const ANCIENT_RESTORATION_ART = Object.freeze(${JSON.stringify(art, null, 2)});\n`);
await writeFile(new URL('assets/ancient-restoration/source-manifest.json', root), JSON.stringify({ version: 1, source: 'src/dlc-art.js', sourceManifest: 'assets/dlc-equipment-source.json', method: 'Selective metal-color mask; source pixel dimensions, alpha and portrait anchors unchanged. Neutral mail, dark leather and plumes excluded; breastplate leather skirt spatially excluded.', generator: 'tools/content/restore-ancient-art.mjs', assets }, null, 2) + '\n');
console.log(`Restored ${Object.keys(art).length} ancient designs in bronze and steel (icons + worn layers).`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await generateAncientArt();
