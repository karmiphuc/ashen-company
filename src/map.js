import { sceneFootprintContains } from './regional-scenes.js';
import { WORLD_LANDMARK_ASSETS, worldLandmarks, landmarkAt, drawWorldLandmark, drawMountainRanges } from './world-landmarks.js';
import { worldRoute } from './world-navigation.js';
import { visualRandom, REGION_STYLE, terrainStamp, roadCurve, settlementProfile, settlementGround, overviewBorderAlpha, showActorLabel, movementPose } from './map-illustration.js';
import { SETTLEMENT_SCENERY_ASSETS, worldSettlementScenery, sceneryAt } from './settlement-scenery.js';
import { regionAt, regionalTownArt } from './geography.js';
import { SETTLEMENTS, WORLD_BOUNDS, terrainAt, getCampSites, getRoamingBands, getQuestEncounter, getFactionPatrols, getCaravans, getUndeadEncounters, getSettlementAccess, getTownLocalSupply, WORLD_REGIONS, WORLD_ROADS } from './engine.js';

const names = [
  ...SETTLEMENT_SCENERY_ASSETS,
  ...WORLD_LANDMARK_ASSETS,
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
  'banner_101', 'banner_102', 'banner_103', 'figure_undead_host',
];
const images = new Map();
const loaded = typeof Image === 'undefined' ? Promise.resolve() : Promise.all(names.map(name => new Promise(resolve => {
  const image = new Image();
  image.onload = resolve;
  image.onerror = resolve;
  image.src = new URL(`../assets/world/${name}.${name==='figure_undead_host'?'svg':'png'}`, import.meta.url).href;
  images.set(name, image);
})));

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
let settlementStructures = [], landmarks = [];
let actorPoses = new Map(), previousPositions = new Map();

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

function sprite(target, name, x, y, spriteWidth, anchor = .83, flip = false) {
  const image = images.get(name);
  if (!image?.naturalWidth) return;
  const spriteHeight = spriteWidth * image.naturalHeight / image.naturalWidth;
  target.save();target.translate(x,y);if(flip)target.scale(-1,1);
  target.drawImage(image, -spriteWidth / 2, -spriteHeight * anchor, spriteWidth, spriteHeight);target.restore();
}

function townArt(town) {
  return regionalTownArt(town);
}

function bands() {
  const quest=state?getQuestEncounter(state):null;
  const value = state ? [...getRoamingBands(state),...getUndeadEncounters(state),...(['deserters','bounty'].includes(quest?.kind)?[quest]:[])] : [];
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
  if(band.battleHoursRemaining!==undefined)return `Fighting · ${Math.ceil(band.battleHoursRemaining)}h`;
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
  let seed = (state.seed ^ 71491) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const rows = Math.ceil(BACKGROUND_BOUNDS.height / 40) + 3;
  const columns = Math.ceil(BACKGROUND_BOUNDS.width / 80) + 3;
  for (let row = -1; row < rows; row++) for (let column = -1; column < columns; column++) {
    const x = BACKGROUND_BOUNDS.x + 80 + column * 80 + (row % 2) * 40;
    const y = BACKGROUND_BOUNDS.y + row * 40;
    const terrain=terrainAt(x,y),region=regionAt(x,y),stamp=terrainStamp(state.seed,row,column,x,y,terrain,terrainAt(x+40,y+20),region.id);
    const choices=terrainSprites(stamp.family);
    sprite(target,choices[Math.floor(stamp.variant*choices.length)],stamp.x,stamp.y,stamp.width,.5);
  }
  // Soft regional color variation, with no square color tiles or baked border grid.
  for(let x=WORLD_BOUNDS.minX;x<WORLD_BOUNDS.maxX;x+=180)for(let y=WORLD_BOUNDS.minY;y<WORLD_BOUNDS.maxY;y+=140){
    const style=REGION_STYLE[regionAt(x,y).id],g=target.createRadialGradient(x,y,0,x,y,170);
    g.addColorStop(0,style.color+'28');g.addColorStop(1,style.color+'00');target.fillStyle=g;target.fillRect(x-170,y-170,340,340);
  }
  target.lineCap='round';
  for(const road of WORLD_ROADS){const [a,b]=road.points,c=roadCurve(state.seed,road),high=road.kind==='highway';
    target.beginPath();target.moveTo(a.x,a.y);target.quadraticCurveTo(c.x,c.y,b.x,b.y);
    target.strokeStyle='#433e2b88';target.lineWidth=high?15:11;target.stroke();
    target.strokeStyle=high?'#c5ad79':'#a99b70';target.lineWidth=high?7:4;target.stroke();
    target.strokeStyle='#6a5c4144';target.lineWidth=1;target.stroke();
  }

  landmarks=worldLandmarks(state.seed,{settlements:SETTLEMENTS,camps:getCampSites(state),roads:WORLD_ROADS});
  const objects = [];
  const objectCount = Math.min(1600, Math.round(BACKGROUND_BOUNDS.width * BACKGROUND_BOUNDS.height / 5200));
  for (let index = 0; index < objectCount; index++) {
    const x = WORLD_BOUNDS.minX + random() * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX);
    const y = WORLD_BOUNDS.minY + random() * (WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY);
    if (SETTLEMENTS.some(town => Math.hypot(x - town.x, y - town.y) < 66) || landmarks.some(o=>o.kind==='scene' && sceneFootprintContains(o,{x,y},25))) continue;
    const terrain = terrainAt(x, y);
    const style=REGION_STYLE[regionAt(x,y).id];
    if(random()>style.density*(.35+.9*visualRandom(state.seed,`cluster:${Math.floor(x/240)}:${Math.floor(y/180)}`)))continue;
    if (terrain === 'forest') objects.push({ x, y, name: `world_detail_forest_green_0${1 + Math.floor(random() * 4)}`, width: 85 + random() * 55 });
    else if (terrain === 'mountain') objects.push({ x, y, name: `legend_world_grass_hill_0${1 + Math.floor(random() * 3)}`, width: 125 + random() * 65 });
    else if(terrain!=='sea')objects.push({x,y,detail:style.detail,width:20+random()*20});

  }
  objects.sort((a,b)=>a.y-b.y).forEach(o=>o.name?sprite(target,o.name,o.x,o.y,o.width):drawMicroDetail(target,o));
  drawMountainRanges(target,state.seed,sprite);
  landmarks.sort((a,b)=>a.y-b.y).forEach(o=>drawWorldLandmark(target,o,state.seed,sprite));
  for(const town of SETTLEMENTS)drawSettlementGround(target,town);
  const borders=[];
  for(let x=WORLD_BOUNDS.minX;x<WORLD_BOUNDS.maxX;x+=80)for(let y=WORLD_BOUNDS.minY;y<WORLD_BOUNDS.maxY;y+=80){
    const id=regionAt(x+40,y+40).id;
    if(regionAt(x+120,y+40).id!==id)borders.push([{x:x+80,y},{x:x+80,y:y+80}]);
    if(regionAt(x+40,y+120).id!==id)borders.push([{x,y:y+80},{x:x+80,y:y+80}]);
  }
  background = { canvas: surface, seed:state.seed, borders, ...BACKGROUND_BOUNDS };
}

function drawMicroDetail(target,o){
 target.save();target.translate(o.x,o.y);target.globalAlpha=.48;target.strokeStyle='#4b5540';target.fillStyle='#797d65';target.lineWidth=1.4;
 if(o.detail==='reeds'){target.fillStyle='#465f57';target.beginPath();target.ellipse(0,0,o.width*.7,5,0,0,Math.PI*2);target.fill();for(let i=-3;i<=3;i++){target.beginPath();target.moveTo(i*3,2);target.lineTo(i*4,-10-Math.abs(i));target.stroke();}}
 else if(o.detail==='snowdrift'){target.fillStyle='#d4ded8';target.beginPath();target.ellipse(0,0,o.width,5,-.15,0,Math.PI*2);target.fill();}
 else if(o.detail==='deadwood'){target.lineWidth=3;target.strokeStyle='#514a36';target.beginPath();target.moveTo(-12,4);target.lineTo(9,-4);target.moveTo(2,-1);target.lineTo(6,-12);target.stroke();}
 else if(o.detail==='furrows'){target.strokeStyle='#8c7950';for(let i=0;i<3;i++){target.beginPath();target.moveTo(-12,i*4);target.lineTo(12,i*4-5);target.stroke();}}
 else if(o.detail==='stones'){for(let i=0;i<3;i++){target.beginPath();target.ellipse(i*8-8,-i*2,5+i,3+i*.5,-.2,0,Math.PI*2);target.fill();}}
 else{for(let i=0;i<3;i++){target.beginPath();target.moveTo(i*6-6,2);target.lineTo(i*6-9,-6);target.moveTo(i*6-6,2);target.lineTo(i*6-3,-7);target.stroke();}}
 target.restore();
}
function drawSettlementGround(target,town){
 const g=settlementGround(state.seed,town);target.save();target.beginPath();g.points.forEach((p,i)=>i?target.lineTo(p.x,p.y):target.moveTo(p.x,p.y));target.closePath();target.fillStyle=regionAt(town.x,town.y).climate==='desert'?'#ae906244':'#927e5344';target.fill();
 for(let i=0;i<g.yards;i++){const angle=visualRandom(state.seed,`${town.id}:yard:${i}`)*Math.PI*2,x=town.x+Math.cos(angle)*g.radius*.8,y=town.y+Math.sin(angle)*g.radius*.32;
   target.strokeStyle='#685c3d66';target.lineWidth=2;target.beginPath();target.moveTo(x-9,y+3);target.lineTo(x+9,y+3);target.moveTo(x-8,y-1);target.lineTo(x-8,y+6);target.moveTo(x+8,y-1);target.lineTo(x+8,y+6);target.stroke();
   if(g.military){target.fillStyle='#675d4844';target.fillRect(x-8,y-5,16,6);}else{target.fillStyle='#b8a26a33';target.fillRect(x-8,y-4,16,7);}
 }
 if(!g.military&&['grain','wool'].includes(getTownLocalSupply(town.id)?.goodId)){target.save();target.translate(town.x-g.radius*.7,town.y+19);target.rotate(-.2);target.fillStyle='#94895366';target.fillRect(-20,-6,40,17);target.strokeStyle='#5d634955';target.lineWidth=1;for(let i=0;i<5;i++){target.beginPath();target.moveTo(-18,i*3-4);target.lineTo(18,i*3-4);target.stroke();}target.restore();}
 target.restore();
}
function drawOverviewBorders(){const alpha=overviewBorderAlpha(camera.zoom);if(!alpha)return;context.save();context.strokeStyle=`rgba(232,218,184,${alpha})`;context.lineWidth=1.2/camera.zoom;
 for(const [a,b] of background?.borders??[]){const c=roadCurve(state.seed,{id:`border:${a.x}:${a.y}`,points:[a,b]});context.beginPath();context.moveTo(a.x,a.y);context.quadraticCurveTo(c.x,c.y,b.x,b.y);context.stroke();}context.restore();}
function drawActorGround(id,x,y,wagon=false){const pose=actorPoses.get(id);context.save();context.fillStyle='#18201766';context.beginPath();context.ellipse(x+4,y+8,wagon?25:20,wagon?6:5,-.18,0,Math.PI*2);context.fill();
 if(pose?.moving&&terrainAt(x,y)!=='sea'){const length=Math.hypot(pose.dx,pose.dy);context.fillStyle='#c2ad7540';for(let i=1;i<=3;i++){context.beginPath();context.ellipse(x-pose.dx/length*(12+i*5),y+6-pose.dy/length*(12+i*5),5-i,2,0,0,Math.PI*2);context.fill();}}context.restore();}
function drawNightLights(){const glow=(x,y,radius,strength)=>{const g=context.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,`rgba(255,194,92,${strength})`);g.addColorStop(.28,`rgba(243,175,75,${strength*.35})`);g.addColorStop(1,'rgba(235,170,70,0)');context.fillStyle=g;context.fillRect(x-radius,y-radius,radius*2,radius*2);};context.save();
 for(const town of SETTLEMENTS){if(Math.abs(town.x-camera.x)>width/(2*camera.zoom)+160||Math.abs(town.y-camera.y)>height/(2*camera.zoom)+160||!getSettlementAccess(state,town.id).servicesAvailable)continue;
  const p=settlementProfile(town);if(p.military){for(const dx of [-27,0,27])glow(town.x+dx,town.y-10,27,.4);}else glow(town.x,town.y-9,p.radius*1.1,town.kind==='village'?.37:.28);
 }
 for(const c of caravans())glow(c.x+5,c.y-9,18,.42);context.restore();}

const SCENERY_COLORS = { danger: '#efb095', good: '#c5d895', trade: '#e5ca89' };
function drawWorkshopEmblem(structure) {
  const { x, y, emblem } = structure;
  context.save(); context.translate(x, y - 2);
  context.strokeStyle = '#2b241a'; context.lineWidth = 1.2;
  if (emblem === 'armorsmith') {
    // Three shields on an outdoor armor rack, rather than a generic house icon.
    context.fillStyle = '#453426'; context.fillRect(-15, -4, 30, 3); context.fillRect(-14, -4, 2, 14); context.fillRect(12, -4, 2, 14);
    for (const [offset, color] of [[-8, '#b8b7a6'], [0, '#75908c'], [8, '#bba16c']]) {
      context.beginPath(); context.moveTo(offset - 3, -2); context.lineTo(offset + 3, -2); context.lineTo(offset + 3, 3);
      context.lineTo(offset, 7); context.lineTo(offset - 3, 3); context.closePath(); context.fillStyle = color; context.fill(); context.stroke();
    }
  } else if (emblem === 'blacksmith') {
    context.fillStyle = '#c6b99d44';
    for (let puff = 0; puff < 3; puff++) { context.beginPath(); context.ellipse(-10 + puff * 3, -31 - puff * 5, 4 + puff, 2 + puff, -.4, 0, Math.PI * 2); context.fill(); }
    context.fillStyle = '#888a7e'; context.beginPath(); context.moveTo(-12, -4); context.lineTo(11, -4);
    context.lineTo(5, 0); context.lineTo(2, 0); context.lineTo(2, 5); context.lineTo(7, 7);
    context.lineTo(-6, 7); context.lineTo(-2, 5); context.lineTo(-2, 0); context.lineTo(-9, 0); context.closePath(); context.fill(); context.stroke();
  }
  context.restore();
}
function drawSettlementScenery() {
  const towns = new Map(SETTLEMENTS.map(town => [town.id, town]));
  const visible = settlementStructures.filter(structure => Math.abs(structure.x - camera.x) < width / (2 * camera.zoom) + 140
    && Math.abs(structure.y - camera.y) < height / (2 * camera.zoom) + 140);
  // Short dirt spurs connect the outlying yards to their parent settlement.
  context.save(); context.lineCap = 'round'; context.strokeStyle = '#ad956b77'; context.lineWidth = 4;
  for (const structure of visible) {
    const town = towns.get(structure.townId), dx = structure.x - town.x, dy = structure.y - town.y, length = Math.hypot(dx, dy);
    context.beginPath(); context.moveTo(town.x + dx / length * 53, town.y + dy / length * 40);
    context.lineTo(structure.x, structure.y); context.stroke();
  }
  context.restore();
  const townBuildings = SETTLEMENTS.filter(town => Math.abs(town.x - camera.x) < width / (2 * camera.zoom) + 140
    && Math.abs(town.y - camera.y) < height / (2 * camera.zoom) + 140).map(town => ({ ...town, townBuilding: true }));
  for (const structure of [...visible, ...townBuildings].sort((a, b) => a.y - b.y)) {
    if (structure.townBuilding) { sprite(context, townArt(structure), structure.x, structure.y, settlementProfile(structure).width); continue; }
    context.save();
    const { x, y, width: size } = structure;
    context.beginPath(); context.ellipse(x, y + 1, size * .43, size * .12, 0, 0, Math.PI * 2);
    context.fillStyle = '#342d1b44'; context.fill();
    if (structure.state === 'hungry') {
      // Bare furrows and a waiting civilian communicate scarce food without inventing a new economy rule.
      context.fillStyle = '#796b4688'; context.fillRect(x - 24, y - 8, 48, 18);
      context.strokeStyle = '#423e2f'; context.lineWidth = 1.5;
      for (let row = 0; row < 4; row++) { context.beginPath(); context.moveTo(x - 23, y - 6 + row * 5); context.lineTo(x + 22, y - 10 + row * 5); context.stroke(); }
      sprite(context, structure.art, x, y - 8, size, .83);
      sprite(context, 'figure_player_beggar', x + 22, y + 6, 16, .8);
    } else {
      if (structure.state === 'harvest') sprite(context, 'wheat_field_02', x - 14, y + 5, 56, .83);
      if (structure.state === 'lost') context.globalAlpha = .45;
      sprite(context, structure.art, x, y, size, .83);
    }
    context.globalAlpha = 1;
    if (structure.emblem) drawWorkshopEmblem(structure);
    if (structure.symbol) {
      const color = SCENERY_COLORS[structure.tone];
      context.strokeStyle = '#443628'; context.lineWidth = 1.5; context.beginPath(); context.moveTo(x + 20, y - 28); context.lineTo(x + 20, y - 7); context.stroke();
      context.fillStyle = color; context.beginPath(); context.moveTo(x + 20, y - 28); context.lineTo(x + 37, y - 25); context.lineTo(x + 20, y - 16); context.closePath(); context.fill();
      context.font = 'bold 11px Arial'; context.textAlign = 'center'; context.fillStyle = '#392b20'; context.fillText(structure.symbol, x + 27, y - 20);
    }
    if (camera.zoom >= .85 || selection === structure.townId && camera.zoom >= .5) {
      context.globalAlpha = selection === structure.townId ? .78 : .55;
      context.font = `${8 / camera.zoom}px Georgia`; context.textAlign = 'center'; context.lineWidth = 1.5 / camera.zoom;
      context.strokeStyle = '#231f16dd'; context.strokeText(structure.label, x, y + 16);
      context.fillStyle = SCENERY_COLORS[structure.tone] ?? '#e7d8b2'; context.fillText(structure.label, x, y + 16);
    }
    context.restore();
  }
  const chosen = towns.get(selection), details = settlementStructures.filter(structure => structure.townId === selection).map(structure => structure.label);
  canvas.setAttribute('aria-label', `World map with nine regions, roads, settlement outskirts, abandoned encampments, battlefields, regional monuments, three dormant caves and impassable mountain ridges with open passes. Drag to pan; pinch to zoom.${chosen ? ` ${chosen.name}: ${details.join(', ') || 'general traders'}.` : ''} Outlying structures are scenery; select the settlement to visit.`);
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
  return `${camp.enemies?.some(e=>e.champion)?'★ ':''}${camp.name} · ${['', 'Low', 'Medium', 'High'][campDifficulty(camp)]}`;
}

export function mapHTML() {
  return `<canvas id="world-map" role="img" aria-label="World map with nine named regions, roads, settlements, abandoned encampments, battlefields and regional monuments, three dormant cave entrances and impassable mountain ranges with accessible passes. Drag to pan, pinch or use plus and minus to zoom. Select a settlement using the destination list."></canvas><div class="map-scenery-key" aria-label="Settlement scenery legend"><span>⚒ Blacksmith</span><span>⬟ Armory</span><span>Wagons · trade</span><span>Fields · harvest</span></div><div class="map-loading">Preparing the Marches…</div>`;
}

export const mapSVG = mapHTML;

export function mountMap(game, onChooseTown, onTravel, onChooseCamp, onActivate) {
  resizeObserver?.disconnect();
  pointers.clear(); dragOrigin = null; pinchStart = null;
  activationTracker = createMapActivationTracker();
  canvas = document.querySelector('#world-map');
  if (!canvas) return;
  context = canvas.getContext('2d');
  if(state?.seed!==game.seed){previousPositions.clear();actorPoses.clear();}
  state = game; settlementStructures = worldSettlementScenery(game); townCallback = onChooseTown; campCallback = onChooseCamp; activationCallback = onActivate;
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
      const existingTarget = patrol ? {type:'patrol',id:patrol.id,entity:patrol} : band ? { type: band.kind.startsWith('undead-')?band.kind:['deserters','bounty'].includes(band.kind)?band.kind:'band', id: band.id, entity: band }
        : camp ? { type: 'camp', id: camp.id, entity: camp }
          : town ? { type: 'town', id: town.id, entity: town }
            : null;
      const existingDistance = existingTarget ? Math.hypot(existingTarget.entity.x - world.x, existingTarget.entity.y - world.y) : Infinity;
      const target = caravan && caravanDistance <= existingDistance
        ? { type: 'caravan', id: caravan.id, entity: caravan }
        : existingTarget;
      if ((target?.type?.startsWith('undead-') || target?.type === 'bounty' || target?.type === 'deserters' || target?.type === 'patrol' || target?.type === 'band' || target?.type === 'caravan') && campCallback) campCallback(target.entity);
      else if (target?.type === 'camp' && campCallback) campCallback(target.entity);
      else if (target?.type === 'town' && townCallback) townCallback(target.entity);
      else if (!target && !sceneryAt(settlementStructures, world) && !landmarkAt(landmarks,world)) onTravel(world.x, world.y);
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
    if (!background || background.seed!==state.seed) buildBackground();
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
export function updateMap(game) { if(state?.seed!==game.seed){previousPositions.clear();actorPoses.clear();}state = game;
  const actors=[{id:'company',...game.position,destination:game.destination},...bands(),...caravans(),...getFactionPatrols(game).filter(p=>p.active)];
  const next=new Map();for(const actor of actors){actorPoses.set(actor.id,movementPose(previousPositions.get(actor.id),actor,actor.destination));next.set(actor.id,{x:actor.x,y:actor.y,flip:actorPoses.get(actor.id).flip});}previousPositions=next;actorPoses=new Map(actors.map(a=>[a.id,actorPoses.get(a.id)])); settlementStructures = worldSettlementScenery(game); if (canvas?.isConnected) { if (background && background.seed!==game.seed) buildBackground(); draw(); } }

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
  drawOverviewBorders();
  drawSettlementScenery();
  const darkness = state.hour < 5 || state.hour > 21 ? .20 : state.hour < 7 || state.hour > 19 ? .10 : 0;
  if (darkness) {
    context.fillStyle = `rgba(14,23,43,${darkness})`;
    context.fillRect(viewX, viewY, width / camera.zoom, height / camera.zoom);
  }

  if(darkness)drawNightLights();

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
    if(showActorLabel(camera.zoom,selection===camp.id))context.strokeText(campLabel(camp), camp.x, camp.y + 20);
    context.fillStyle = camp.cleared ? '#b4a78a' : '#f29b46'; if(showActorLabel(camera.zoom,selection===camp.id))context.fillText(campLabel(camp), camp.x, camp.y + 20);
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
    drawActorGround(caravan.id,caravan.x,caravan.y,true);
    if (chosen || underAttack) {
      context.beginPath(); context.ellipse(caravan.x, caravan.y + 4, chosen ? 27 : 24, chosen ? 11 : 9, 0, 0, Math.PI * 2);
      context.strokeStyle = underAttack ? (inContact ? '#e46c5e' : '#dd9860') : '#f1d380'; context.lineWidth = 2 / camera.zoom; context.stroke();
    }
    sprite(context, 'figure_player_trader', caravan.x, caravan.y, 34, .72,actorPoses.get(caravan.id)?.flip);
    const eta = Math.max(0, Math.ceil(Number(caravan.etaHours) || 0));
    const label = caravan.quest ? `${caravan.name} · Awaiting rescue` : attacker ? `${caravan.name} · ${inContact ? 'Wagon intercepted' : 'Raiders closing'}${inContact && Number.isFinite(Number(caravan.attackHoursRemaining)) ? ` · ${Math.max(0, Math.ceil(Number(caravan.attackHoursRemaining)))}h` : ''}`
      : underAttack ? `${caravan.name} · ${inContact ? 'Wagon intercepted' : 'Raiders closing'}${inContact && Number.isFinite(Number(caravan.attackHoursRemaining)) ? ` · ${Math.max(0, Math.ceil(Number(caravan.attackHoursRemaining)))}h` : ''}`
      : `${caravan.name} · ${eta}h`;
    context.font = 'bold 10px Arial'; context.textAlign = 'center'; context.lineWidth = 3; context.strokeStyle = '#1c1913dd';
    if(showActorLabel(camera.zoom,chosen,underAttack))context.strokeText(label, caravan.x, caravan.y + 25);
    context.fillStyle = underAttack ? (inContact ? '#f08d7e' : '#e5ad78') : chosen ? '#f0d998' : '#e3d8b7'; if(showActorLabel(camera.zoom,chosen,underAttack))context.fillText(label, caravan.x, caravan.y + 25);
    context.restore();
  });

  activeBands.forEach((band, index) => {
    const count = bandCount(band), selected = selection === band.id, hunted = state.pursuit === band.id;
    const undead=band.kind.startsWith('undead-');
    const art = undead?'figure_undead_host':{ 'northern-highlands':'figure_player_berserker',greenwood:'figure_player_ranger','blackwater-basin':'figure_player_slave','far-steppe':'figure_player_nomad','saffron-coast':'figure_player_nomad',sunlands:'figure_player_nomad','highland-clans':'figure_player_berserker','southern-sultanate':'figure_player_nomad',south: 'figure_player_nomad', north: 'figure_player_berserker', east: 'figure_player_assassin', forest: 'figure_player_ranger' }[band.factionId] || ['figure_player_beggar', 'figure_player_berserker', 'figure_player_assassin', 'figure_player_slave'][index % 4];
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
    drawActorGround(band.id,band.x,band.y);
    if (!undead && count > 1) sprite(context, ['figure_player_berserker', 'figure_player_ranger', 'figure_player_slave'][index % 3], band.x - 8, band.y + 1, 25, .72,actorPoses.get(band.id)?.flip);
    sprite(context, art, band.x + (!undead && count > 1 ? 7 : 0), band.y, undead?35:29, .72,actorPoses.get(band.id)?.flip);
    sprite(context, `banner_10${clamp(Number(band.difficulty) || Math.ceil(count / 2), 1, 3)}`, band.x + 16, band.y - 20, 17, .82);
    const label = `${band.enemies.some(e=>e.champion)?'★ ':''}${band.name || 'Wandering Brigands'} · ${count} ${band.kind.startsWith('undead-')?'undead':band.kind==='deserters'?'deserters':`brigand${count===1?'':'s'}`}`;
    context.font = 'bold 10px Arial'; context.textAlign = 'center'; context.lineWidth = 3; context.strokeStyle = '#1c1913cc'; if(showActorLabel(camera.zoom,selected,hunted||band.behavior==='hunting-company'))context.strokeText(label, band.x, band.y + 24);
    context.fillStyle = band.behavior==='hunting-company'?'#ed6558':'#f29b46'; if(showActorLabel(camera.zoom,selected,hunted||band.behavior==='hunting-company'))context.fillText(label, band.x, band.y + 24);
    const activity = bandActivity(band);
    if (activity && showActorLabel(camera.zoom,selected,hunted)) {
      context.font = 'bold 9px Arial'; context.strokeStyle = '#1c1913cc'; context.strokeText(activity, band.x, band.y + 36);
      context.fillStyle = band.behavior === 'hunting-company' ? '#f08072' : '#e3a267'; context.fillText(activity, band.x, band.y + 36);
    }
    context.restore();
  });

  getFactionPatrols(state).filter(p=>p.active).forEach(p=>{
    context.save();context.translate(24,-24);
    context.beginPath();context.arc(p.x,p.y+3,18,0,Math.PI*2);context.strokeStyle=p.color;context.lineWidth=selection===p.id?4:2;context.stroke();
    drawActorGround(p.id,p.x,p.y);sprite(context,'figure_player_assassin',p.x,p.y,30,.85,actorPoses.get(p.id)?.flip);
    context.font='bold 10px Arial';context.textAlign='center';context.strokeStyle='#142016';context.lineWidth=3;
    const label=camera.zoom>=.4||selection===p.id?`${p.factionLabel} · ${p.enemies.length}`:`${p.enemies.length}`;
    context.strokeText(label,p.x,p.y+28);context.fillStyle=p.color;context.fillText(label,p.x,p.y+28);if(p.battleHoursRemaining!==undefined){context.fillStyle='#efd191';context.fillText(`⚔ Fighting · ${Math.ceil(p.battleHoursRemaining)}h`,p.x,p.y+40);}context.restore();
  });

  if (state.destination) {
    context.strokeStyle = '#f0d783'; context.lineWidth = 2 / camera.zoom; context.setLineDash([5 / camera.zoom, 7 / camera.zoom]);
    context.beginPath(); context.moveTo(state.position.x, state.position.y); for(const p of worldRoute(state.position,state.destination)??[])context.lineTo(p.x,p.y); context.stroke(); context.setLineDash([]);
    context.beginPath(); context.arc(state.destination.x, state.destination.y, 12, 0, Math.PI * 2); context.stroke();
  }
  for (const region of WORLD_REGIONS) {
    context.save();context.font=`bold ${12/camera.zoom}px Georgia`;context.textAlign='center';context.lineWidth=4;context.strokeStyle='#24251ddd';
    context.strokeText(region.name.toUpperCase(),region.x,region.y);context.fillStyle=region.color;context.fillText(region.name.toUpperCase(),region.x,region.y);context.restore();
  }
  SETTLEMENTS.forEach((town, index) => {
    const access=getSettlementAccess(state,town.id);
    if(access.status!=='open'){context.font='bold 15px Georgia';context.textAlign='center';context.strokeStyle='#211b19';context.lineWidth=3;const label=access.servicesAvailable?(access.status==='threatened'?'! Undead approaching':'Rebuilding'):'☠ CLOSED';context.strokeText(label,town.x,town.y-48);context.fillStyle=access.servicesAvailable?'#f3c777':'#ff9d89';context.fillText(label,town.x,town.y-48);}
    if (selection === town.id || state.contract?.to === town.id) {
      context.strokeStyle = selection === town.id ? '#f4d78f' : '#dfcb73'; context.lineWidth = 2;
      context.beginPath(); context.ellipse(town.x, town.y + 3, 45, 17, 0, 0, Math.PI * 2); context.stroke();
    }
    sprite(context, `banner_10${1 + index % 3}`, town.x + 43, town.y - 29, 22, .9);
    if (camera.zoom >= .65 || town.major || selection === town.id || state.contract?.to === town.id) {
      context.font = `bold ${Math.max(17,9/camera.zoom)}px Georgia`; context.textAlign = 'center'; context.lineWidth = 3/camera.zoom; context.strokeStyle = '#29291edd'; context.strokeText(town.name, town.x, town.y + 25);
      context.fillStyle = '#f0e4bd'; context.fillText(town.name, town.x, town.y + 25);
    }
  });
  drawActorGround('company',state.position.x,state.position.y);
  sprite(context, 'figure_player_party', state.position.x, state.position.y, 36, .7,actorPoses.get('company')?.flip);
  sprite(context, 'banner_101', state.position.x + 14, state.position.y - 23, 25, .8);
  context.restore();
}
