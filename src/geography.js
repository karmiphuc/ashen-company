// Compact the added frontier while preserving the original campaign footprint.
export const WORLD_LAYOUT_VERSION = 2;
export const FRONTIER_SCALE = 0.6850883976607238;
export const LEGACY_WORLD_LIMITS = Object.freeze({minX:180,maxX:5000,minY:80,maxY:3000});
export function compactPoint(point) { return {x:point.x<=2120?point.x:2120+(point.x-2120)*FRONTIER_SCALE,y:point.y<=1380?point.y:1380+(point.y-1380)*FRONTIER_SCALE}; }
export function authoredPoint(point) { return {x:point.x<=2120?point.x:2120+(point.x-2120)/FRONTIER_SCALE,y:point.y<=1380?point.y:1380+(point.y-1380)/FRONTIER_SCALE}; }
export const REGIONS = Object.freeze([
  { id: 'western-marches', name: 'Western Marches', x: 700, y: 90, color: '#b7b67a', climate: 'temperate', grain: .75, timber: .80, iron: 1.15, salt: 1.15, wool: .90, gear: 1.02 },
  { id: 'northern-highlands', name: 'Northern Highlands', x: 2250, y: 90, color: '#b5c7ce', climate: 'snow', grain: 1.45, timber: 1.20, iron: .80, salt: 1.35, wool: 1.10, gear: 1.15 },
  { id: 'greenwood', name: 'Greenwood', x: 1590, y: 860, color: '#87a87b', climate: 'forest', grain: 1.10, timber: .60, iron: 1.15, salt: 1.20, wool: .90, gear: 1.05 },
  { id: 'eastern-frontier', name: 'Eastern Frontier', x: 2830, y: 1230, color: '#c2aa83', climate: 'temperate', grain: .90, timber: 1.10, iron: 1.05, salt: 1.20, wool: .80, gear: 1.10 },
  { id: 'far-steppe', name: 'Far Steppe', x: 4260, y: 500, color: '#c8b87c', climate: 'steppe', grain: .80, timber: 1.40, iron: 1.20, salt: 1.10, wool: .60, gear: 1.12 },
  { id: 'southern-marches', name: 'Southern Marches', x: 690, y: 1390, color: '#b3bc79', climate: 'temperate', grain: .60, timber: .85, iron: 1.25, salt: 1.15, wool: .85, gear: 1.04 },
  { id: 'blackwater-basin', name: 'Blackwater Basin', x: 1800, y: 1380, color: '#91a99c', climate: 'marsh', grain: 1.10, timber: .80, iron: 1.30, salt: .70, wool: 1.20, gear: 1.15 },
  { id: 'saffron-coast', name: 'Saffron Coast', x: 1140, y: 2370, color: '#d3bf89', climate: 'coastal', grain: .85, timber: 1.15, iron: 1.30, salt: .55, wool: 1.00, gear: 1.08 },
  { id: 'sunlands', name: 'Sunlands', x: 3700, y: 2200, color: '#d8b274', climate: 'desert', grain: 1.25, timber: 1.45, iron: .95, salt: .80, wool: 1.10, gear: 1.18 },
].map(region => Object.freeze({...region,...compactPoint(region)})));
const regionById = new Map(REGIONS.map(region => [region.id, region]));
export function regionAt(x, y) {
  ({x,y}=authoredPoint({x,y}));
  const id = y >= 1700 && x < 2200 ? 'saffron-coast'
    : y >= 1400 && x >= 2200 ? 'sunlands'
    : x >= 3400 ? 'far-steppe'
    : y <= 360 && x >= 1100 ? 'northern-highlands'
    : y >= 1000 && x >= 1400 && x < 2200 ? 'blackwater-basin'
    : y >= 800 && x < 1400 ? 'southern-marches'
    : x >= 2200 ? 'eastern-frontier'
    : x >= 1100 ? 'greenwood' : 'western-marches';
  return regionById.get(id);
}
const town = (id, name, x, y, kind, description, major = false) => { const point=compactPoint({x,y}),region=regionAt(point.x,point.y);return Object.freeze({id,name,...point,kind,description,major,regionId:region.id,color:region.color}); };
export const REGIONAL_SETTLEMENTS = Object.freeze([
  town('frostgate', 'Frostgate', 2380, 140, 'castle', 'The northern iron road passes beneath its frost-bound walls.'),
  town('ravenfell', 'Ravenfell', 3200, 140, 'town', 'Fur merchants and caravan guards shelter from the highland wind.'),
  town('silverpeak', 'Silverpeak', 3360, 350, 'village', 'Miners haul silver and iron down from the snowy ridges.'),
  town('longgrass', 'Longgrass', 3800, 200, 'village', 'Shepherds graze their flocks beside the northern steppe road.'),
  town('kargan', 'Kargan', 4300, 300, 'town', 'A horse-trading market on the long eastern highway.', true),
  town('stormpost', 'Stormpost', 4700, 150, 'castle', 'A frontier garrison watches the empty plains.'),
  town('fieldcross', 'Fieldcross', 3550, 780, 'village', 'Grain wagons meet the steppe road at a broad ford.'),
  town('windrest', 'Windrest', 4150, 700, 'town', 'Merchants rest their pack animals behind low stone walls.'),
  town('duskfort', 'Duskfort', 4700, 1050, 'castle', 'Heavy infantry defend the eastern caravan approach.'),
  town('redcliff', 'Redcliff', 3800, 1200, 'town', 'A red stone quarry supplies the steppe forts.'),
  town('elmvale', 'Elmvale', 1850, 1500, 'town', 'Timber and peat are traded on the edge of the Blackwater.'),
  town('fenwatch', 'Fenwatch', 2250, 1550, 'castle', 'A frontier watchtower guards the crossing into the Sunlands.'),
  town('bogmere', 'Bogmere', 1600, 1720, 'village', 'Reed cutters sell salt fish at the coast road junction.'),
  town('southmarch', 'Southmarch', 430, 1450, 'castle', 'The southern grain road runs beneath an old border fortress.'),
  town('ashgrove', 'Ashgrove', 960, 1550, 'village', 'Farmers and charcoal burners share the forest edge.'),
  town('westport', 'Westport', 350, 1900, 'town', 'Salt traders bring their wares to the western coast highway.'),
  town('woolhaven', 'Woolhaven', 1000, 2000, 'village', 'Wool bales and grain fill the barns of this coastal market.'),
  town('greenbank', 'Greenbank', 1600, 2100, 'town', 'A busy riverside market feeds the southern caravans.'),
  town('saffronbay', 'Saffron Bay', 450, 2500, 'town', 'Spice wagons and salt merchants gather by the saffron coast.', true),
  town('pearlwick', 'Pearlwick', 1050, 2700, 'village', 'Fishers and cloth traders settle beside the coast road.'),
  town('sunharbor', 'Sunharbor', 1800, 2750, 'town', 'A wealthy southern city trades mail, salt, and provisions.', true),
  town('oasis', 'Oasis', 2400, 1900, 'village', 'Cool wells and grain stores sustain the desert crossing.'),
  town('sandwatch', 'Sandwatch', 3000, 1850, 'castle', 'Lamellar-clad guards protect the oasis road.'),
  town('brassgate', 'Brassgate', 3550, 1600, 'town', 'Armorers and spice factors work behind the brass gates.', true),
  town('sultans-rest', "Sultan's Rest", 4150, 1900, 'town', 'Southern merchants sell fine mail and gladiator equipment.', true),
  town('dawnspire', 'Dawnspire', 4750, 1600, 'castle', 'The easternmost citadel watches the desert frontier.'),
  town('spicehaven', 'Spicehaven', 3000, 2450, 'town', 'A southern caravan city with a renowned armory.', true),
  town('emberkeep', 'Emberkeep', 4500, 2750, 'castle', 'Veteran guards hold a remote fortress above the dunes.'),
]);
export const WORLD_LIMITS = Object.freeze({ minX: 180, maxX: compactPoint({x:5000,y:3000}).x, minY: 80, maxY: compactPoint({x:5000,y:3000}).y });
// Camps added after the original twelve use these cells; the original seeded grid is untouched.
export const FRONTIER_CAMP_CELLS = Object.freeze([
  { x: 2240, y: 80, width: 550, height: 250 }, { x: 2850, y: 80, width: 500, height: 250 },
  { x: 3420, y: 80, width: 650, height: 570 }, { x: 4160, y: 80, width: 740, height: 570 },
  { x: 3400, y: 700, width: 650, height: 600 }, { x: 4150, y: 700, width: 750, height: 600 },
  { x: 220, y: 1400, width: 1050, height: 230 }, { x: 1450, y: 1360, width: 650, height: 270 },
  { x: 220, y: 1770, width: 1700, height: 1100 }, { x: 2220, y: 1450, width: 650, height: 1450 },
  { x: 2980, y: 1450, width: 750, height: 1450 }, { x: 3880, y: 1450, width: 1000, height: 1450 },
].map(Object.freeze));
function authoredDistance(a,b){a=authoredPoint(a);b=authoredPoint(b);return Math.hypot(a.x-b.x,a.y-b.y);}
const roadCache = new WeakMap();
const routeCache = new WeakMap();
const legacyEdges = [['oakwatch','greyhaven'],['greyhaven','ironford'],['ironford','thornwall'],['ironford','redmere'],['greyhaven','highpass'],['oakwatch','saltwick'],['oakwatch','barrowfield'],['barrowfield','redmere'],['barrowfield','ironford'],['eastmere','stonebridge']];
const highways = [['highpass','dunridge'],['dunridge','frostgate'],['frostgate','sunspire'],['sunspire','ravenfell'],['ravenfell','longgrass'],['longgrass','kargan'],['kargan','stormpost'],['eastmere','ambercross'],['ambercross','fieldcross'],['fieldcross','windrest'],['windrest','duskfort'],['southwatch','southmarch'],['southmarch','westport'],['westport','saffronbay'],['saffronbay','pearlwick'],['pearlwick','sunharbor'],['farhold','elmvale'],['elmvale','fenwatch'],['fenwatch','oasis'],['oasis','sandwatch'],['sandwatch','brassgate'],['brassgate','sultans-rest'],['sultans-rest','dawnspire'],['sunharbor','spicehaven'],['spicehaven','emberkeep']];
export function roadNetwork(settlements) {
  if (roadCache.has(settlements)) return roadCache.get(settlements);
  const byId = new Map(settlements.map(town => [town.id, town])), edges = new Map();
  const add = (a, b, kind = 'road') => {
    if (a === b || !byId.has(a) || !byId.has(b)) return;
    const pair = [a,b].sort(), id = pair.join(':');
    if (edges.has(id) && kind !== 'highway') return;
    const start = byId.get(pair[0]), end = byId.get(pair[1]);
    edges.set(id, Object.freeze({ id, from: pair[0], to: pair[1], kind, name: `${start.name}–${end.name}`, length: Math.hypot(start.x-end.x,start.y-end.y), points: Object.freeze([Object.freeze({x:start.x,y:start.y}),Object.freeze({x:end.x,y:end.y})]) }));
  };
  for (const [a,b] of legacyEdges) add(a,b);
  for (const [a,b] of highways) add(a,b,'highway');
  // Two local links per settlement form loops, rather than a single brittle tree.
  for (const town of settlements) for (const neighbor of settlements.filter(other=>other.id!==town.id).sort((a,b)=>authoredDistance(town,a)-authoredDistance(town,b)||a.id.localeCompare(b.id)).slice(0,2)) add(town.id,neighbor.id);
  // Connect any remaining components deterministically.
  const connected = new Set([settlements[0]?.id]);
  const flood = () => { let changed=true; while(changed){changed=false;for(const edge of edges.values())if(connected.has(edge.from)!==connected.has(edge.to)){connected.add(edge.from);connected.add(edge.to);changed=true;}} };
  flood();
  while(connected.size<settlements.length){let best=null;for(const a of settlements.filter(t=>connected.has(t.id)))for(const b of settlements.filter(t=>!connected.has(t.id))){const length=authoredDistance(a,b);if(!best||length<best.length)best={a,b,length};}if(!best)break;add(best.a.id,best.b.id);flood();}
  const roads = Object.freeze([...edges.values()].sort((a,b)=>a.id.localeCompare(b.id)));roadCache.set(settlements,roads);return roads;
}
export function roadRoute(settlements, from, to) {
  if (!routeCache.has(settlements)) routeCache.set(settlements,new Map());
  const cached=routeCache.get(settlements),key=`${from}:${to}`;
  if(cached.has(key))return cached.get(key);
  const byId = new Map(settlements.map(town=>[town.id,town]));
  if(!byId.has(from)||!byId.has(to))return [];
  const roads=roadNetwork(settlements), costs=new Map([[from,0]]), previous=new Map(), done=new Set();
  while(!done.has(to)){
    const current=[...costs].filter(([id])=>!done.has(id)).sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]))[0];if(!current)return [];
    done.add(current[0]);
    for(const edge of roads){const next=edge.from===current[0]?edge.to:edge.to===current[0]?edge.from:null;if(!next||done.has(next))continue;const cost=current[1]+edge.length;if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);previous.set(next,current[0]);}}
  }
  const path=[to];while(path[0]!==from)path.unshift(previous.get(path[0]));const result=Object.freeze(path.map(id=>Object.freeze({x:byId.get(id).x,y:byId.get(id).y})));cached.set(key,result);return result;
}
export function distanceToRoad(x,y,roads){
  let nearest=Infinity;
  for(const road of roads){const[a,b]=road.points,dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));nearest=Math.min(nearest,Math.hypot(x-a.x-dx*t,y-a.y-dy*t));}
  return nearest;
}
export function regionalTownArt(town) {
  if (town.kind === 'castle') return ({ironford:'stronghold_01',highpass:'fortified_outpost_01',southwatch:'stronghold_01',farhold:'fortified_outpost_01'})[town.id] ?? 'stronghold_02';
  return town.kind === 'village' ? 'townhall_01' : town.major ? 'houses_02_01' : 'houses_03_01';
}
export function regionalTownSpecialty(town) { const region=regionAt(town.x,town.y);return `${region.name} · ${town.kind==='castle'?'Military armory':town.kind==='village'?'Provisions & local goods':'Trade & regional equipment'}`; }
