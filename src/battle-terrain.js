export const BATTLE_COLUMNS = 14;
export const BATTLE_ROWS = 16;
export const TILE_TERRAINS = Object.freeze(['open', 'trees', 'brush', 'mud', 'rock', 'dense-trees']);

const DIRECTIONS = [[1, 0], [1, -1], [0, 1], [0, -1], [-1, 0], [-1, 1]];

function hash(value) {
  let number = 2166136261;
  for (const character of String(value)) number = Math.imul(number ^ character.charCodeAt(0), 16777619);
  number ^= number >>> 16;
  number = Math.imul(number, 0x7feb352d);
  number ^= number >>> 15;
  number = Math.imul(number, 0x846ca68b);
  number ^= number >>> 16;
  return number >>> 0;
}

function random(seed) {
  return (hash(seed) >>> 0) / 4294967296;
}

function deploymentTile(q) {
  return q <= 2 || q >= BATTLE_COLUMNS - 4;
}

function walkableTilesConnected(tiles) {
  const walkable = tiles.filter(tile => tile.terrain !== 'dense-trees');
  if (!walkable.length) return false;
  const byPoint = new Map(tiles.map(tile => [`${tile.q},${tile.r}`, tile]));
  const seen = new Set([`${walkable[0].q},${walkable[0].r}`]);
  const queue = [walkable[0]];
  for (const point of queue) for (const [dq, dr] of DIRECTIONS) {
    const next = byPoint.get(`${point.q + dq},${point.r + dr}`);
    const key = next && `${next.q},${next.r}`;
    if (next && next.terrain !== 'dense-trees' && !seen.has(key)) {
      seen.add(key);
      queue.push(next);
    }
  }
  return seen.size === walkable.length;
}

export function createBattleField(seed, encounterId, biome) {
  const terrainWeights = {
    plains: [76, 4, 13, 4, 3],
    forest: [49, 27, 18, 3, 3],
    mountain: [55, 4, 8, 2, 31],
    marsh: [48, 8, 18, 23, 3],
  }[biome] ?? [76, 4, 13, 4, 3];
  const hillCount = biome === 'mountain' ? 3 : biome === 'marsh' ? 1 : 2;
  const hills = Array.from({ length: hillCount }, (_, index) => ({
    q: 1 + Math.floor(random(`${seed}:${encounterId}:hill-q:${index}`) * 12),
    r: 1 + Math.floor(random(`${seed}:${encounterId}:hill-r:${index}`) * (BATTLE_ROWS - 2)),
    radius: biome === 'mountain' ? 3.5 : biome === 'forest' ? 2.8 : 2.2,
  }));
  const tiles = [];
  for (let q = 0; q < BATTLE_COLUMNS; q++) {
    for (let r = 0; r < BATTLE_ROWS; r++) {
      const roll = random(`${seed}:${encounterId}:terrain:${q}:${r}`) * 100;
      let threshold = 0;
      let terrain = 'open';
      for (let index = 0; index < terrainWeights.length; index++) {
        threshold += terrainWeights[index];
        if (roll < threshold) { terrain = TILE_TERRAINS[index]; break; }
      }
      if (biome === 'forest' && ((q === 4 && r >= 2 && r <= 4) || (q === 9 && r >= 3 && r <= 4))) terrain = 'trees';
      const nearestHill = Math.min(...hills.map(hill => Math.hypot(q - hill.q, r - hill.r) / hill.radius));
      const height = nearestHill < (biome === 'marsh' ? 0 : .43) ? 2 : nearestHill < 1 ? 1 : 0;
      tiles.push({ q, r, terrain, height });
    }
  }
  const denseChance = biome === 'forest' ? .7 : .4;
  const denseCandidates = tiles.filter(tile => tile.terrain === 'trees' && !deploymentTile(tile.q)
    && random(`${seed}:${encounterId}:dense:${tile.q}:${tile.r}`) < denseChance);
  for (const tile of denseCandidates) {
    tile.terrain = 'dense-trees';
    if (!walkableTilesConnected(tiles)) tile.terrain = 'trees';
  }
  return { columns: BATTLE_COLUMNS, rows: BATTLE_ROWS, biome, tiles };
}

export function legacyBattleField() {
  const tiles = [];
  for (let q = 0; q < 10; q++) for (let r = 0; r < 5; r++) tiles.push({ q, r, terrain: 'open', height: 0 });
  return { columns: 10, rows: 5, biome: 'plains', tiles };
}

export function tileAt(field, q, r) {
  if (!field || !Number.isInteger(q) || !Number.isInteger(r) || q < 0 || r < 0 || q >= field.columns || r >= field.rows) return null;
  const indexed = field.tiles[q * field.rows + r];
  return indexed?.q === q && indexed?.r === r ? indexed : field.tiles.find(tile => tile.q === q && tile.r === r) ?? null;
}

export function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function hexNeighbors(field, point) {
  return DIRECTIONS.map(([dq, dr]) => ({ q: point.q + dq, r: point.r + dr }))
    .filter(next => tileAt(field, next.q, next.r));
}

export function movementCost(field, from, to) {
  const tile = tileAt(field, to.q, to.r);
  const origin = tileAt(field, from.q, from.r);
  if (!tile || !origin || tile.terrain === 'dense-trees' || origin.terrain === 'dense-trees' || hexDistance(from, to) !== 1) return Infinity;
  const ground = tile.terrain === 'trees' || tile.terrain === 'mud' ? 2 : 1;
  return Math.min(2, ground + (tile.height > origin.height ? 1 : 0));
}

export function heightHitModifier(field, from, to) {
  const source = tileAt(field, from.q, from.r);
  const target = tileAt(field, to.q, to.r);
  return source && target ? Math.max(-20, Math.min(20, (source.height - target.height) * 10)) : 0;
}

function roundedHex(q, r) {
  const x = q;
  const z = r;
  const y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

export function rangedCoverModifier(field, from, to) {
  const target = tileAt(field, to.q, to.r);
  if (!target) return 0;
  let penalty = target.terrain === 'trees' || target.terrain === 'dense-trees' ? 20 : target.terrain === 'brush' ? 10 : 0;
  const distance = hexDistance(from, to);
  for (let step = 1; step < distance; step++) {
    const point = roundedHex(from.q + (to.q - from.q) * step / distance, from.r + (to.r - from.r) * step / distance);
    const terrain = tileAt(field, point.q, point.r)?.terrain;
    if (terrain === 'trees' || terrain === 'dense-trees') penalty += 8;
    else if (terrain === 'brush') penalty += 4;
  }
  return -Math.min(36, penalty);
}
