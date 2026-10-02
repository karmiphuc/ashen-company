import { townFacilities } from './town-facilities.js';
import { regionAt } from './geography.js';
import { SETTLEMENTS, WORLD_BOUNDS, terrainAt, getCampSites, getRoamingBands, getQuestEncounter, getFactionPatrols, getCaravans, WORLD_REGIONS, WORLD_ROADS } from './engine.js';

const names = [
  'world_desert_01', 'world_desert_02', 'world_desert_03',
  'world_grass_01', 'world_grass_02', 'world_grass_03', 'world_grass_04',
  'world_plains_01', 'world_plains_02', 'world_plains_03',
  'world_highlands_01', 'world_highlands_02', 'world_highlands_03',
  'world_forest_01', 'world_forest_02', 'world_swamp_01', 'world_snow_01', 'world_snow_02', 'world_ocean_00',
  'world_detail_forest_green_01', 'world_detail_forest_green_02', 'world_detail_forest_green_03', 'world_detail_forest_green_04',
  'world_detail_autumn_green_01', 'world_detail_autumn_green_02',
  'legend_world_grass_hill_01', 'legend_world_grass_hill_02', 'legend_world_grass_hill_03',
  'houses_01_01', 'houses_02_01', 'houses_03_01', 'townhall_01', 'townhall_02',
  'stronghold_01', 'stronghold_02', 'fortified_outpost_01', 'wheat_farm_01', 'wheat_field_01', 'harbor_sw', 'stone_watchtower_01',
  'figure_player_party', 'figure_player_trader', 'figure_player_ranger', 'figure_player_beggar',
  'figure_player_berserker', 'figure_player_assassin', 'figure_player_slave', 'figure_player_nomad',
  'banner_101', 'banner_102', 'banner_103',
];
const images = new Map();
const loaded = typeof Image === 'undefined' ? Promise.resolve() : Promise.all(names.map(name => new Promise(resolve => {
  const image = new Image();
  image.onload = resolve;
  image.onerror = resolve;
  image.src = new URL(`../assets/world/${name}.png`, import.meta.url).href;
  images.set(name, image);
})));

const knownTownArt = {
  oakwatch: 'houses_02_01', greyhaven: 'townhall_02', ironford: 'stronghold_01', thornwall: 'stronghold_02',
  redmere: 'townhall_01', highpass: 'fortified_outpost_01', saltwick: 'houses_01_01', barrowfield: 'houses_03_01',
};
const buildingByKind = { town: 'townhall_01', castle: 'stronghold_02', village: 'houses_03_01' };
const WORLD_PAD = 170;
const DOUBLE_TAP_DELAY = 350;
const DOUBLE_TAP_DISTANCE = 24;
const TAP_MOVEMENT_LIMIT = 7;
const BACKGROUND_BOUNDS = {
  x: WORLD_BOUNDS.minX - WORLD_PAD,
  y: WORLD_BOUNDS.minY - WORLD_PAD,
  width: Math.ceil(WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + WORLD_PAD * 2),
  height: Math.ceil(WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY + WORLD_PAD * 2),
};
const camera = {
  x: (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2,
  y: (WORLD_BOUNDS.minY + WORLD_BOUNDS.maxY) / 2,
  zoom: 1,
  initialized: false,
};

let canvas, context, state, selection = null, townCallback, campCallback, activationCallback, background = null, resizeObserver;
let width = 0, height = 0, pointers = new Map(), dragOrigin = null, pinchStart = null, dragged = false;
let activationTracker = createMapActivationTracker();

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function isMapTapGesture(start, end) {
  return Boolean(start && end && Math.hypot(end.x - start.x, end.y - start.y) <= TAP_MOVEMENT_LIMIT);
}

export function createMapActivationTracker() {
  let previous = null;
  return {
    tap(target, point, time) {
      if (!target || target.id == null || !Number.isFinite(point?.x) || !Number.isFinite(point?.y) || !Number.isFinite(time)) {
        previous = null;
        return null;
      }
      const matches = previous
        && previous.type === target.type
        && previous.id === target.id
        && time >= previous.time
        && time - previous.time <= DOUBLE_TAP_DELAY
        && Math.hypot(point.x - previous.x, point.y - previous.y) <= DOUBLE_TAP_DISTANCE;
      previous = matches ? null : { type: target.type, id: target.id, x: point.x, y: point.y, time };
      return matches ? target : null;
    },
    cancel() { previous = null; },
  };
}

function sprite(target, name, x, y, spriteWidth, anchor = .83) {
  const image = images.get(name);
  if (!image?.naturalWidth) return;
  const spriteHeight = spriteWidth * image.naturalHeight / image.naturalWidth;
  target.drawImage(image, x - spriteWidth / 2, y - spriteHeight * anchor, spriteWidth, spriteHeight);
}

function townArt(town) {
  return knownTownArt[town.id] || buildingByKind[town.kind] || 'houses_02_01';
}

function bands() {
  const quest=state?getQuestEncounter(state):null;
  const value = state ? [...getRoamingBands(state),...(quest?.kind==='deserters'?[quest]:[])] : [];
  return Array.isArray(value) ? value : [];
}

function caravans() {
  const value = state ? getCaravans(state) : [];
  return Array.isArray(value) ? value.filter(item => item.status === 'en-route' || item.status === 'under-attack') : [];
}

function caravanContact(caravan) {
  return caravan.contact === true || (caravan.contact == null && caravan.status === 'under-attack');
}

function bandCount(band) {
  return Math.max(1, Number(band.enemyCount ?? band.enemies?.length ?? band.count ?? 1) || 1);
}

function bandActivity(band) {
  if (band.behavior === 'hunting-company') return 'Hunting company';
  if (band.behavior === 'raiding-caravan') {
    const caravan = caravans().find(item => item.id === band.targetId);
    const destination = SETTLEMENTS.find(town => town.id === caravan?.destinationId);
    return destination ? `Raiding ${destination.name} wagon` : 'Raiding a wagon';
  }
  return '';
}


function terrainSprites(terrain) {
  if (terrain === 'snow') return ['world_snow_01', 'world_snow_02'];
  if (terrain === 'desert') return ['world_desert_01', 'world_desert_02', 'world_desert_03'];
  if (terrain === 'sea') return ['world_ocean_00'];
  if (terrain === 'mountain') return ['world_highlands_01', 'world_highlands_02', 'world_highlands_03'];
  if (terrain === 'forest') return ['world_forest_01', 'world_forest_02'];
  if (terrain === 'marsh') return ['world_swamp_01'];
  return ['world_grass_01', 'world_grass_02', 'world_grass_03', 'world_grass_04', 'world_plains_01', 'world_plains_02', 'world_plains_03'];
}

function buildBackground() {
  const surface = document.createElement('canvas');
  const rasterScale = Math.min(1, 4096 / Math.max(BACKGROUND_BOUNDS.width, BACKGROUND_BOUNDS.height));
  surface.width = Math.ceil(BACKGROUND_BOUNDS.width * rasterScale);
  surface.height = Math.ceil(BACKGROUND_BOUNDS.height * rasterScale);
  const target = surface.getContext('2d');
  target.scale(rasterScale, rasterScale);
  target.translate(-BACKGROUND_BOUNDS.x, -BACKGROUND_BOUNDS.y);
  target.fillStyle = '#244b47';
  target.fillRect(BACKGROUND_BOUNDS.x, BACKGROUND_BOUNDS.y, BACKGROUND_BOUNDS.width, BACKGROUND_BOUNDS.height);
  let seed = 71491;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const rows = Math.ceil(BACKGROUND_BOUNDS.height / 40) + 3;
  const columns = Math.ceil(BACKGROUND_BOUNDS.width / 80) + 3;
  for (let row = -1; row < rows; row++) for (let column = -1; column < columns; column++) {
    const x = BACKGROUND_BOUNDS.x + 80 + column * 80 + (row % 2) * 40;
    const y = BACKGROUND_BOUNDS.y + row * 40;
    const choices = terrainSprites(terrainAt(x, y));
    sprite(target, choices[Math.floor(random() * choices.length)], x, y, 210, .5);
  }

  // A subtle regional wash and borders make the geography readable at overview zoom.
  target.save();
  for (let x = WORLD_BOUNDS.minX; x < WORLD_BOUNDS.maxX; x += 80) for (let y = WORLD_BOUNDS.minY; y < WORLD_BOUNDS.maxY; y += 80) {
    const region = regionAt(x+40,y+40);
    target.fillStyle = region.color + (region.climate === 'desert' ? '55' : '22');
    target.fillRect(x,y,80,80);
    target.strokeStyle = '#ded1ae55'; target.lineWidth=2; target.setLineDash([8,10]);
    if (regionAt(x+120,y+40).id !== region.id) { target.beginPath();target.moveTo(x+80,y);target.lineTo(x+80,y+80);target.stroke(); }
    if (regionAt(x+40,y+120).id !== region.id) { target.beginPath();target.moveTo(x,y+80);target.lineTo(x+80,y+80);target.stroke(); }
  }
  target.restore();
  target.lineCap = 'round';
  for (const road of WORLD_ROADS) {
    const [first, second] = road.points;
    target.beginPath();
    target.moveTo(first.x, first.y);
    target.lineTo(second.x, second.y);
    target.strokeStyle = '#514c32'; target.lineWidth = road.kind === 'highway' ? 11 : 7; target.stroke();
    target.strokeStyle = road.kind === 'highway' ? '#d7c08a' : '#b1a16b'; target.lineWidth = road.kind === 'highway' ? 6 : 4; target.stroke();
    target.strokeStyle = '#ccbb85aa'; target.lineWidth = 1; target.stroke();
  }

  const objects = [];
  const objectCount = Math.min(1600, Math.round(BACKGROUND_BOUNDS.width * BACKGROUND_BOUNDS.height / 5200));
  for (let index = 0; index < objectCount; index++) {
    const x = WORLD_BOUNDS.minX + random() * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX);
    const y = WORLD_BOUNDS.minY + random() * (WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY);
    if (SETTLEMENTS.some(town => Math.hypot(x - town.x, y - town.y) < 66)) continue;
    const terrain = terrainAt(x, y);
    if (terrain === 'forest') objects.push({ x, y, name: `world_detail_forest_green_0${1 + Math.floor(random() * 4)}`, width: 65 + random() * 30 });
    else if (terrain === 'mountain') objects.push({ x, y, name: `legend_world_grass_hill_0${1 + Math.floor(random() * 3)}`, width: 100 + random() * 70 });
    else if (random() < .1) objects.push({ x, y, name: `world_detail_autumn_green_0${1 + Math.floor(random() * 2)}`, width: 45 + random() * 28 });
  }
  SETTLEMENTS.forEach((town, index) => {
    const facilities=townFacilities(state.seed,town);
    facilities.forEach((facility,i)=>sprite(context,facility.id==='blacksmith'?'houses_01_01':'houses_02_01',town.x-33+i*63,town.y+15,25,.9));
    if(facilities.length&&camera.zoom>=.65){context.font='bold 9px Arial';context.textAlign='center';context.lineWidth=3;context.strokeStyle='#241a14';const label=facilities.map(f=>f.name).join(' · ');context.strokeText(label,town.x,town.y+48);context.fillStyle='#edcf89';context.fillText(label,town.x,town.y+48);}

    objects.push({ x: town.x, y: town.y, name: townArt(town), width: town.kind === 'village' ? 100 : 122 });
    if (town.kind === 'village') objects.push({ x: town.x - 60, y: town.y + 40, name: index % 2 ? 'wheat_farm_01' : 'wheat_field_01', width: 100 });
    if (town.id === 'saltwick') objects.push({ x: town.x - 68, y: town.y + 32, name: 'harbor_sw', width: 83 });
  });
  objects.sort((a, b) => a.y - b.y).forEach(object => sprite(target, object.name, object.x, object.y, object.width));
  background = { canvas: surface, ...BACKGROUND_BOUNDS };
}

function minimumZoom() {
  if (!width || !height) return .2;
  const spanX = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + 120;
  const spanY = WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY + 120;
  return clamp(Math.min(width / spanX, height / spanY), .12, 1);
}

function constrainCamera() {
  if (!width || !height) return;
  const halfWidth = width / (2 * camera.zoom), halfHeight = height / (2 * camera.zoom);
  const centerX = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2;
  const centerY = (WORLD_BOUNDS.minY + WORLD_BOUNDS.maxY) / 2;
  camera.x = halfWidth * 2 >= WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX
    ? centerX
    : clamp(camera.x, WORLD_BOUNDS.minX + halfWidth, WORLD_BOUNDS.maxX - halfWidth);
  camera.y = halfHeight * 2 >= WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY
    ? centerY
    : clamp(camera.y, WORLD_BOUNDS.minY + halfHeight, WORLD_BOUNDS.maxY - halfHeight);
}

function setZoom(value) {
  camera.zoom = clamp(value, minimumZoom(), 2.5);
  constrainCamera();
}

function campDifficulty(camp) {
  return clamp(Math.round(Number(camp.difficulty) || Math.ceil((camp.enemies?.length || 2) / 2)), 1, 3);
}

function campLabel(camp) {
  if (camp.cleared && camp.respawnHours > 0) return `${camp.name} · returns in ${camp.respawnHours}h`;
  return `${camp.name} · ${['', 'Low', 'Medium', 'High'][campDifficulty(camp)]}`;
}

export function mapHTML() {
  return `<canvas id="world-map" role="img" aria-label="World map with nine named regions, roads and highways. Drag to pan, pinch or use plus and minus to zoom. Select a settlement using the destination list."></canvas><div class="map-loading">Preparing the Marches…</div>`;
}

export const mapSVG = mapHTML;

export function mountMap(game, onChooseTown, onTravel, onChooseCamp, onActivate) {
  resizeObserver?.disconnect();
  pointers.clear(); dragOrigin = null; pinchStart = null;
  activationTracker = createMapActivationTracker();
  canvas = document.querySelector('#world-map');
  if (!canvas) return;
  context = canvas.getContext('2d');
  state = game; townCallback = onChooseTown; campCallback = onChooseCamp; activationCallback = onActivate;
  const resize = () => {
    const rectangle = canvas.getBoundingClientRect();
    width = rectangle.width; height = rectangle.height;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density); canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    if (!camera.initialized) {
      camera.x = game.position?.x ?? camera.x; camera.y = game.position?.y ?? camera.y;
      camera.zoom = clamp(Math.max(width / 1180, height / 820), minimumZoom(), 1.4);
      camera.initialized = true;
    } else setZoom(camera.zoom);
    constrainCamera(); draw();
  };
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const point = event => {
    const rectangle = canvas.getBoundingClientRect();
    return { x: event.clientX - rectangle.left, y: event.clientY - rectangle.top };
  };
  canvas.onpointerdown = event => {
    canvas.setPointerCapture(event.pointerId);
    const current = point(event);
    pointers.set(event.pointerId, { ...current, startX: current.x, startY: current.y });
    dragOrigin = { ...current, cameraX: camera.x, cameraY: camera.y };
    dragged = false;
    if (pointers.size === 2) {
      const [first, second] = [...pointers.values()];
      pinchStart = { distance: Math.hypot(first.x - second.x, first.y - second.y), zoom: camera.zoom };
      dragged = true;
      activationTracker.cancel();
    }
  };
  canvas.onpointermove = event => {
    const active = pointers.get(event.pointerId);
    if (!active) return;
    const current = { ...point(event), startX: active.startX, startY: active.startY };
    pointers.set(event.pointerId, current);
    if (pointers.size === 2 && pinchStart) {
      const [first, second] = [...pointers.values()];
      setZoom(pinchStart.zoom * Math.hypot(first.x - second.x, first.y - second.y) / Math.max(1, pinchStart.distance));
      dragged = true;
      activationTracker.cancel();
    } else if (dragOrigin) {
      if (!isMapTapGesture({ x: active.startX, y: active.startY }, current)) {
        dragged = true;
        activationTracker.cancel();
      }
      if (dragged) {
        camera.x = dragOrigin.cameraX - (current.x - dragOrigin.x) / camera.zoom;
        camera.y = dragOrigin.cameraY - (current.y - dragOrigin.y) / camera.zoom;
        constrainCamera();
      }
    }
    draw();
  };
  canvas.onpointerup = event => {
    const active = pointers.get(event.pointerId);
    const current = point(event);
    pointers.delete(event.pointerId);
    if (!dragged && !pinchStart && isMapTapGesture(active && { x: active.startX, y: active.startY }, current)) {
      const world = { x: camera.x + (current.x - width / 2) / camera.zoom, y: camera.y + (current.y - height / 2) / camera.zoom };
      const town = SETTLEMENTS.find(item => Math.hypot(item.x - world.x, item.y - world.y) < 48);
      const camp = getCampSites(state).find(item => Math.hypot(item.x - world.x, item.y - world.y) < 34);
      const patrol = getFactionPatrols(state).filter(p=>p.active).find(item=>Math.hypot(item.x+24-world.x,item.y-24-world.y)<24);
      const band = bands().find(item => Math.hypot(item.x - world.x, item.y - world.y) < 34);
      const caravan = caravans().find(item => Math.hypot(item.x - world.x, item.y - world.y) < 24);
      const caravanDistance = caravan ? Math.hypot(caravan.x - world.x, caravan.y - world.y) : Infinity;
      const existingTarget = patrol ? {type:'patrol',id:patrol.id,entity:patrol} : band ? { type: band.kind==='deserters'?'deserters':'band', id: band.id, entity: band }
        : camp ? { type: 'camp', id: camp.id, entity: camp }
          : town ? { type: 'town', id: town.id, entity: town }
            : null;
      const existingDistance = existingTarget ? Math.hypot(existingTarget.entity.x - world.x, existingTarget.entity.y - world.y) : Infinity;
      const target = caravan && caravanDistance <= existingDistance
        ? { type: 'caravan', id: caravan.id, entity: caravan }
        : existingTarget;
      if ((target?.type === 'deserters' || target?.type === 'patrol' || target?.type === 'band' || target?.type === 'caravan') && campCallback) campCallback(target.entity);
      else if (target?.type === 'camp' && campCallback) campCallback(target.entity);
      else if (target?.type === 'town' && townCallback) townCallback(target.entity);
      else if (!target) onTravel(world.x, world.y);
      const activation = activationTracker.tap(target, current, Number(event.timeStamp));
      if (activation && activationCallback) activationCallback(activation);
    } else activationTracker.cancel();
    if (!pointers.size) { dragOrigin = null; pinchStart = null; }
    else {
      const remaining = [...pointers.values()][0];
      dragOrigin = { ...remaining, cameraX: camera.x, cameraY: camera.y };
    }
  };
  canvas.onpointercancel = () => {
    pointers.clear(); dragOrigin = null; pinchStart = null;
    activationTracker.cancel();
  };
  canvas.onwheel = event => { event.preventDefault(); setZoom(camera.zoom * (event.deltaY > 0 ? .9 : 1.1)); draw(); };
  loaded.then(() => {
    if (!background) buildBackground();
    document.querySelector('.map-loading')?.remove();
    draw();
  });
}

export function focusMap(position) {
  camera.x = position.x; camera.y = position.y;
  constrainCamera(); draw();
}

export function zoomMap(factor) {
  setZoom(camera.zoom * factor); draw();
}

export function selectMapTown(town) { selection = town?.id || null; draw(); }
export function selectMapCamp(id) { selection = id; draw(); }
export function updateMap(game) { state = game; if (canvas?.isConnected) draw(); }

function draw() {
  if (!context || !width || !height || !state) return;
  const caption = document.querySelector('.map-caption span');
  if (caption) caption.textContent = regionAt(state.position.x,state.position.y).name;
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2);
  context.scale(camera.zoom, camera.zoom);
  context.translate(-camera.x, -camera.y);
  const viewX = camera.x - width / (2 * camera.zoom), viewY = camera.y - height / (2 * camera.zoom);
  context.fillStyle = '#244b47';
  context.fillRect(viewX, viewY, width / camera.zoom, height / camera.zoom);
  if (background) context.drawImage(background.canvas, background.x, background.y, background.width, background.height);
  const darkness = state.hour < 5 || state.hour > 21 ? .20 : state.hour < 7 || state.hour > 19 ? .10 : 0;
  if (darkness) {
    context.fillStyle = `rgba(14,23,43,${darkness})`;
    context.fillRect(viewX, viewY, width / camera.zoom, height / camera.zoom);
  }

  getCampSites(state).forEach((camp, index) => {
    context.save();
    if (camp.cleared) context.globalAlpha = .48;
    if (!camp.cleared || selection === camp.id) {
      context.strokeStyle = camp.cleared?'#b4a78a':'#f29b46'; context.lineWidth = selection===camp.id?3:2;
      context.beginPath(); context.ellipse(camp.x, camp.y + 2, 33, 13, 0, 0, Math.PI * 2); context.stroke();
    }
    sprite(context, index % 3 === 1 ? 'stone_watchtower_01' : 'fortified_outpost_01', camp.x, camp.y, 70);
    sprite(context, `banner_10${campDifficulty(camp)}`, camp.x + 25, camp.y - 27, 18, .86);
    context.font = 'bold 12px Georgia'; context.textAlign = 'center'; context.lineWidth = 3; context.strokeStyle = '#241a14';
    context.strokeText(campLabel(camp), camp.x, camp.y + 20);
    context.fillStyle = camp.cleared ? '#b4a78a' : '#f29b46'; context.fillText(campLabel(camp), camp.x, camp.y + 20);
    context.restore();
  });

  const activeBands = bands();
  caravans().forEach(caravan => {
    const chosen = selection === caravan.id;
    const underAttack = caravan.status === 'under-attack';
    const inContact = caravanContact(caravan);
    const origin = SETTLEMENTS.find(town => town.id === caravan.originId);
    const destination = SETTLEMENTS.find(town => town.id === caravan.destinationId);
    context.save();
    if (chosen && origin && destination) {
      context.beginPath(); context.moveTo(origin.x, origin.y); context.lineTo(destination.x, destination.y);
      context.strokeStyle = '#eed28a99'; context.lineWidth = 2 / camera.zoom; context.setLineDash([7 / camera.zoom, 8 / camera.zoom]); context.stroke(); context.setLineDash([]);
    }
    const attacker = activeBands.find(band => band.behavior === 'raiding-caravan' && band.targetId === caravan.id)
      || (underAttack ? activeBands.find(band => band.id === caravan.attackerId) : null);
    if (attacker) {
      const angle = Math.atan2(caravan.y - attacker.y, caravan.x - attacker.x);
      const tipX = caravan.x - Math.cos(angle) * 20, tipY = caravan.y - Math.sin(angle) * 14;
      context.beginPath(); context.moveTo(attacker.x, attacker.y); context.lineTo(tipX, tipY);
      context.strokeStyle = inContact ? '#f06455' : '#dd9860'; context.lineWidth = 2.5 / camera.zoom; context.setLineDash([6 / camera.zoom, 5 / camera.zoom]); context.stroke(); context.setLineDash([]);
      context.beginPath(); context.moveTo(tipX, tipY); context.lineTo(tipX - Math.cos(angle - .55) * 8, tipY - Math.sin(angle - .55) * 8);
      context.lineTo(tipX - Math.cos(angle + .55) * 8, tipY - Math.sin(angle + .55) * 8); context.closePath();
      context.fillStyle = inContact ? '#f06455' : '#dd9860'; context.fill();
    }
    context.beginPath(); context.ellipse(caravan.x, caravan.y + 8, 20, 7, 0, 0, Math.PI * 2);
    context.fillStyle = '#14201688'; context.fill();
    if (chosen || underAttack) {
      context.beginPath(); context.ellipse(caravan.x, caravan.y + 4, chosen ? 27 : 24, chosen ? 11 : 9, 0, 0, Math.PI * 2);
      context.strokeStyle = underAttack ? (inContact ? '#e46c5e' : '#dd9860') : '#f1d380'; context.lineWidth = 2 / camera.zoom; context.stroke();
    }
    sprite(context, 'figure_player_trader', caravan.x, caravan.y, 34, .72);
    const eta = Math.max(0, Math.ceil(Number(caravan.etaHours) || 0));
    const label = caravan.quest ? `${caravan.name} · Awaiting rescue` : attacker ? `${caravan.name} · ${inContact ? 'Wagon intercepted' : 'Raiders closing'}${inContact && Number.isFinite(Number(caravan.attackHoursRemaining)) ? ` · ${Math.max(0, Math.ceil(Number(caravan.attackHoursRemaining)))}h` : ''}`
      : underAttack ? `${caravan.name} · ${inContact ? 'Wagon intercepted' : 'Raiders closing'}${inContact && Number.isFinite(Number(caravan.attackHoursRemaining)) ? ` · ${Math.max(0, Math.ceil(Number(caravan.attackHoursRemaining)))}h` : ''}`
      : `${caravan.name} · ${eta}h`;
    context.font = 'bold 10px Arial'; context.textAlign = 'center'; context.lineWidth = 3; context.strokeStyle = '#1c1913dd';
    context.strokeText(label, caravan.x, caravan.y + 25);
    context.fillStyle = underAttack ? (inContact ? '#f08d7e' : '#e5ad78') : chosen ? '#f0d998' : '#e3d8b7'; context.fillText(label, caravan.x, caravan.y + 25);
    context.restore();
  });

  activeBands.forEach((band, index) => {
    const count = bandCount(band), selected = selection === band.id, hunted = state.pursuit === band.id;
    const art = { 'northern-highlands':'figure_player_berserker',greenwood:'figure_player_ranger','blackwater-basin':'figure_player_slave','far-steppe':'figure_player_nomad','saffron-coast':'figure_player_nomad',sunlands:'figure_player_nomad','highland-clans':'figure_player_berserker','southern-sultanate':'figure_player_nomad',south: 'figure_player_nomad', north: 'figure_player_berserker', east: 'figure_player_assassin', forest: 'figure_player_ranger' }[band.factionId] || ['figure_player_beggar', 'figure_player_berserker', 'figure_player_assassin', 'figure_player_slave'][index % 4];
    context.save();
    if (band.behavior === 'hunting-company') {
      const angle = Math.atan2(state.position.y - band.y, state.position.x - band.x);
      const tipX = state.position.x - Math.cos(angle) * 19, tipY = state.position.y - Math.sin(angle) * 15;
      context.beginPath(); context.moveTo(band.x, band.y); context.lineTo(tipX, tipY);
      context.strokeStyle = '#ed6558'; context.lineWidth = 2.5 / camera.zoom; context.setLineDash([6 / camera.zoom, 5 / camera.zoom]); context.stroke(); context.setLineDash([]);
      context.beginPath(); context.moveTo(tipX, tipY); context.lineTo(tipX - Math.cos(angle - .55) * 8, tipY - Math.sin(angle - .55) * 8);
      context.lineTo(tipX - Math.cos(angle + .55) * 8, tipY - Math.sin(angle + .55) * 8); context.closePath();
      context.fillStyle = '#ed6558'; context.fill();
    }
    {
      context.lineWidth = selected?3:2; context.strokeStyle = band.behavior==='hunting-company'?'#ed6558':'#f29b46'; context.setLineDash(hunted ? [3, 3] : []);
      context.beginPath(); context.ellipse(band.x, band.y + 7, 25, 10, 0, 0, Math.PI * 2); context.stroke(); context.setLineDash([]);
    }
    context.beginPath(); context.ellipse(band.x, band.y + 8, 16, 6, 0, 0, Math.PI * 2); context.fillStyle = '#14201688'; context.fill();
    if (count > 1) sprite(context, ['figure_player_berserker', 'figure_player_ranger', 'figure_player_slave'][index % 3], band.x - 8, band.y + 1, 25, .72);
    sprite(context, art, band.x + (count > 1 ? 7 : 0), band.y, 29, .72);
    sprite(context, `banner_10${clamp(Number(band.difficulty) || Math.ceil(count / 2), 1, 3)}`, band.x + 16, band.y - 20, 17, .82);
    const label = `${band.name || 'Wandering Brigands'} · ${count} ${band.kind==='deserters'?'deserters':`brigand${count===1?'':'s'}`}`;
    context.font = 'bold 10px Arial'; context.textAlign = 'center'; context.lineWidth = 3; context.strokeStyle = '#1c1913cc'; context.strokeText(label, band.x, band.y + 24);
    context.fillStyle = band.behavior==='hunting-company'?'#ed6558':'#f29b46'; context.fillText(label, band.x, band.y + 24);
    const activity = bandActivity(band);
    if (activity) {
      context.font = 'bold 9px Arial'; context.strokeStyle = '#1c1913cc'; context.strokeText(activity, band.x, band.y + 36);
      context.fillStyle = band.behavior === 'hunting-company' ? '#f08072' : '#e3a267'; context.fillText(activity, band.x, band.y + 36);
    }
    context.restore();
  });

  getFactionPatrols(state).filter(p=>p.active).forEach(p=>{
    context.save();context.translate(24,-24);
    context.beginPath();context.arc(p.x,p.y+3,18,0,Math.PI*2);context.strokeStyle=p.color;context.lineWidth=selection===p.id?4:2;context.stroke();
    sprite(context,'figure_player_assassin',p.x,p.y,30,.85);
    context.font='bold 10px Arial';context.textAlign='center';context.strokeStyle='#142016';context.lineWidth=3;
    const label=camera.zoom>=.4||selection===p.id?`${p.factionLabel} · ${p.enemies.length}`:`${p.enemies.length}`;
    context.strokeText(label,p.x,p.y+28);context.fillStyle=p.color;context.fillText(label,p.x,p.y+28);context.restore();
  });

  if (state.destination) {
    context.strokeStyle = '#f0d783'; context.lineWidth = 2 / camera.zoom; context.setLineDash([5 / camera.zoom, 7 / camera.zoom]);
    context.beginPath(); context.moveTo(state.position.x, state.position.y); context.lineTo(state.destination.x, state.destination.y); context.stroke(); context.setLineDash([]);
    context.beginPath(); context.arc(state.destination.x, state.destination.y, 12, 0, Math.PI * 2); context.stroke();
  }
  for (const region of WORLD_REGIONS) {
    context.save();context.font=`bold ${12/camera.zoom}px Georgia`;context.textAlign='center';context.lineWidth=4;context.strokeStyle='#24251ddd';
    context.strokeText(region.name.toUpperCase(),region.x,region.y);context.fillStyle=region.color;context.fillText(region.name.toUpperCase(),region.x,region.y);context.restore();
  }
  SETTLEMENTS.forEach((town, index) => {
    if (selection === town.id || state.contract?.to === town.id) {
      context.strokeStyle = selection === town.id ? '#f4d78f' : '#dfcb73'; context.lineWidth = 2;
      context.beginPath(); context.ellipse(town.x, town.y + 3, 45, 17, 0, 0, Math.PI * 2); context.stroke();
    }
    sprite(context, `banner_10${1 + index % 3}`, town.x + 43, town.y - 29, 22, .9);
    if (camera.zoom >= .3 || town.major || selection === town.id || state.contract?.to === town.id) {
      context.font = `bold ${Math.max(17,9/camera.zoom)}px Georgia`; context.textAlign = 'center'; context.lineWidth = 3/camera.zoom; context.strokeStyle = '#29291edd'; context.strokeText(town.name, town.x, town.y + 25);
      context.fillStyle = '#f0e4bd'; context.fillText(town.name, town.x, town.y + 25);
    }
  });
  const progress = (state.day * 24 + state.hour) / 17, position = (Math.sin(progress) + 1) / 2;
  const first = SETTLEMENTS[1], second = SETTLEMENTS[2];
  sprite(context, 'figure_player_trader', first.x + (second.x - first.x) * position, first.y + (second.y - first.y) * position, 30);
  context.beginPath(); context.ellipse(state.position.x, state.position.y + 9, 20, 8, 0, 0, Math.PI * 2); context.fillStyle = '#15201666'; context.fill();
  sprite(context, 'figure_player_party', state.position.x, state.position.y, 36, .7);
  sprite(context, 'banner_101', state.position.x + 14, state.position.y - 23, 25, .8);
  context.restore();
}
