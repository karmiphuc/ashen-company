import { compactPoint, regionAt, distanceToRoad } from './geography.js';
import { visualRandom } from './map-illustration.js';
import { WORLD_MOUNTAIN_RANGES, worldBlocked } from './world-navigation.js';

export const LEGENDARY_CAVES=Object.freeze([
 {id:'greenwood-cave',kind:'cave',name:'Veiled Hollow',x:2020,y:970,width:66,setting:'forest'},
 {id:'frostspine-cave',kind:'cave',name:'Frostspine Grotto',x:2140,y:314,width:72,setting:'mountain'},
 {id:'sunlands-cave',kind:'cave',name:'Sunken Passage',x:3750,y:2100,width:70,setting:'desert'},
].map(p=>Object.freeze({...p,...compactPoint(p),futureQuest:true})));
// Deliberate sites: old military borders, abandoned crossings, and a southern necropolis.
const sites=[
 ['march-watch','tower',780,790,82,'western-marches'],
 ['old-crossing','battlefield',1510,580,118,'greenwood'],
 ['drowned-watch','tower',2100,1230,82,'blackwater-basin'],
 ['south-border','tower',710,1690,88,'southern-marches'],
 ['burnt-convoy','battlefield',1220,1790,100,'saffron-coast'],
 ['frost-watch','tower',2800,285,90,'northern-highlands'],
 ['frontier-battle','battlefield',2880,920,110,'eastern-frontier'],
 ['steppe-watch','tower',4610,1340,84,'far-steppe'],
 ['steppe-battle','battlefield',3990,570,104,'far-steppe'],
 // Encampments follow the region's history: sheltered forest hunters, an old
 // northern muster, coastal supply losses, and a southern caravan bivouac.
 ['march-muster','warcamp',900,450,128,'western-marches'],
 ['frost-muster','warcamp',1875,330,102,'northern-highlands'],
 ['woodland-hideout','warcamp',1850,850,126,'greenwood'],
 ['fen-bivouac','warcamp',1750,1300,120,'blackwater-basin'],
 ['abandoned-siege','warcamp',680,1120,142,'southern-marches'],
 ['coastal-supply-camp','warcamp',1300,2400,134,'saffron-coast'],
 ['frontier-encampment','warcamp',2900,1100,138,'eastern-frontier'],
 ['steppe-bivouac','warcamp',4400,750,124,'far-steppe'],
 ['desert-caravan-camp','warcamp',4150,2250,136,'sunlands'],
 ['lesser-pyramid','pyramid',2680,1690,148,'sunlands'],
 ['necropolis-pyramid','pyramid',3560,1980,224,'sunlands'],
 ['necropolis-sphinx','sphinx',3780,2000,146,'sunlands'],
 ['desert-pyramid','pyramid',4740,2580,170,'sunlands'],
];
export function worldLandmarks(seed,{settlements=[],camps=[],roads=[]}={}){
 const landmarks=[];
 for(const [id,kind,x,y,width,region]of sites){
  const p=compactPoint({x,y});
  // Major monuments keep their authored grouping; minor sites vary a little by campaign.
  const jitter=['pyramid','sphinx'].includes(kind)?0:14;
  p.x+=(visualRandom(seed,id+':x')*2-1)*jitter;p.y+=(visualRandom(seed,id+':y')*2-1)*jitter;
  const radius=width*.4;
  if(regionAt(p.x,p.y).id!==region || worldBlocked(p)
    || settlements.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<radius+85)
    || !['pyramid','sphinx'].includes(kind) && camps.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<radius+45)
    || distanceToRoad(p.x,p.y,roads)<radius*.6+22)continue;
  landmarks.push({id,kind,...p,width,region});
 }
 return [...landmarks,...LEGENDARY_CAVES];
}
export function landmarkAt(landmarks,p){return landmarks.find(o=>Math.hypot((o.x-p.x)/(o.width*.48),(o.y-p.y)/(o.width*.32))<1);}
// Freely licensed textured sprites; provenance and adaptation recipes are recorded
// in assets/world/landmark-sources.json. No flat geometric landmark fallback.
// Layouts use a shared scene scale, with authored offsets and depth ordering.
// Repetition is limited to useful shared props; each place has its own silhouette.
// Human remains stay half their earlier size, even in a large encampment.
// Tents define the scene scale. Supplies and loose equipment are subordinate
// details, not buildings; use the same proportions in every regional layout.
const PROP_SCALE=Object.freeze({crate:.5,crates:.5,supply_wagon:.65,wagon_wreck:.65,
 wheel:.6,discarded_weapons:.6,helmets:.55,stone_pile:.6,firepit:.6,burnt_logs:.6,
 timbers:.65,barricade:.75,broken_barricade:.75,banner_red:.75,banner_blue:.75,
 fallen_horse:.85,fallen_armored_horse:.85});
const piece=(art,x,y,scale)=>Object.freeze({art:'battlefield_'+art,x,y,scale:scale*(PROP_SCALE[art]??1)});
const layout=(...parts)=>Object.freeze(parts.map(p=>piece(...p)).sort((a,b)=>a.y-b.y));
export const SCENERY_LAYOUTS=Object.freeze({
 'old-crossing':layout(['broken_barricade',-.24,-.06,.44],['wheel',.28,-.09,.15],['corpse_blue',.17,.10,.17],['corpse_mail',-.21,.16,.18],['discarded_weapons',.02,.21,.23],['firepit',.03,-.02,.25]),
 'burnt-convoy':layout(['supply_wagon',-.20,-.08,.48],['crates',.28,.06,.24],['burnt_logs',-.03,.19,.29],['corpse_green',-.25,.24,.17],['crate',.33,.23,.13]),
 'frontier-battle':layout(['barricade',-.23,-.08,.42],['fallen_armored_horse',.22,.03,.30],['helmets',-.02,.19,.15],['corpse_red',-.27,.20,.18],['banner_red',.28,-.13,.19],['firepit',.04,-.05,.25]),
 'steppe-battle':layout(['wagon_wreck',-.23,-.04,.45],['fallen_horse',.24,.06,.29],['corpse_green',-.12,.20,.17],['skeleton',.25,.25,.165],['timbers',-.02,-.18,.28]),
 'march-muster':layout(['tent_side',-.24,-.12,.41],['tent_front',.24,-.06,.32],['banner_blue',-.32,-.24,.19],['crates',.31,.17,.24],['firepit',-.01,.10,.25],['barricade',-.20,.28,.36],['discarded_weapons',.26,.30,.21]),
 'frost-muster':layout(['tent_round',-.24,-.10,.36],['tent_front',.22,-.09,.33],['banner_red',.28,-.23,.18],['supply_wagon',-.22,.20,.39],['burnt_logs',.19,.17,.27],['helmets',.01,.29,.14]),
 'woodland-hideout':layout(['tent_side',-.20,-.10,.39],['tent_round',.24,.02,.28],['timbers',-.26,.21,.26],['firepit',.03,.11,.25],['crate',.29,.22,.15],['discarded_weapons',-.01,.29,.20]),
 'fen-bivouac':layout(['tent_front',-.20,-.10,.34],['broken_barricade',.23,.05,.37],['wagon_wreck',-.24,.22,.31],['skeleton',.22,.25,.165],['stone_pile',.03,-.19,.22]),
 'abandoned-siege':layout(['tent_side',-.24,-.15,.36],['tent_round',.24,-.13,.29],['barricade',-.23,.16,.40],['broken_barricade',.22,.21,.38],['supply_wagon',.01,-.28,.33],['burnt_logs',.04,.03,.25],['corpse_mail',-.12,.31,.17],['banner_red',.32,-.02,.17]),
 'coastal-supply-camp':layout(['tent_front',-.25,-.12,.33],['supply_wagon',.23,-.02,.43],['crates',-.27,.17,.28],['crate',.27,.23,.15],['wheel',.09,.23,.14],['firepit',-.01,.12,.25]),
 'frontier-encampment':layout(['tent_side',-.27,-.09,.39],['tent_front',.24,-.13,.32],['tent_round',.01,-.28,.27],['barricade',-.21,.22,.35],['banner_blue',.34,.08,.18],['crates',.29,.28,.22],['firepit',.02,.07,.25]),
 'steppe-bivouac':layout(['tent_round',-.23,-.07,.38],['tent_round',.24,-.13,.30],['fallen_horse',.27,.20,.28],['firepit',-.01,.12,.25],['wheel',-.28,.23,.15],['corpse_green',.04,.29,.17]),
 'desert-caravan-camp':layout(['tent_round',-.26,-.12,.35],['tent_side',.23,-.09,.36],['supply_wagon',-.26,.22,.40],['crates',.26,.21,.23],['stone_pile',.03,-.24,.21],['firepit',.01,.11,.25]),
 'march-watch':layout(['barricade',-.34,.21,.32],['crate',.30,.23,.16]),
 'drowned-watch':layout(['broken_barricade',-.28,.24,.34],['bones',.27,.21,.165],['stone_pile',.32,-.10,.23]),
 'south-border':layout(['timbers',-.30,.22,.32],['burnt_logs',.31,.19,.26]),
 'frost-watch':layout(['tent_front',.34,.16,.28],['crates',-.28,.23,.21]),
 'steppe-watch':layout(['wheel',-.26,.20,.17],['wagon_wreck',.30,.19,.33]),
});
export const WORLD_LANDMARK_ASSETS=Object.freeze([
 'landmark_tower',
 ...new Set(Object.values(SCENERY_LAYOUTS).flatMap(parts=>parts.map(p=>p.art))),
 'landmark_pyramid','landmark_sphinx','landmark_cave_forest','landmark_cave_mountain','landmark_cave_desert',
 ...['green','snow','desert'].flatMap(kind=>[1,2,3,4].map(n=>`landmark_mountain_${kind}_${n}`)),
]);
export function drawWorldLandmark(c,o,seed,sprite){
 const parts=SCENERY_LAYOUTS[o.id]??SCENERY_LAYOUTS['old-crossing'];
 if(o.kind==='battlefield'||o.kind==='warcamp'){
  // These are abandoned scenery, never active camps or selectable entities.
  if(o.region==='greenwood')sprite(c,'world_detail_forest_green_04',o.x-o.width*.36,o.y-o.width*.15,o.width*.5,.85);
  for(const p of parts)sprite(c,p.art,o.x+p.x*o.width,o.y+p.y*o.width,o.width*p.scale,.88);
  const hearth=parts.find(p=>['battlefield_burnt_logs','battlefield_firepit'].includes(p.art));
  // Only fresh scorched sites smoke: bone fields and empty bivouacs stay quiet.
  if(hearth&&['burnt-convoy','frontier-battle','abandoned-siege'].includes(o.id)){
   for(let i=0;i<5;i++){
    const x=o.x+hearth.x*o.width+i*2,y=o.y+hearth.y*o.width-10-i*7,r=4+i*1.6,g=c.createRadialGradient(x,y,1,x,y,r);
    g.addColorStop(0,'#343a3638');g.addColorStop(1,'#343a3600');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
   }
  }
  return;
 }
 let art;
 if(o.kind==='cave'){
  art=`landmark_cave_${o.setting}`;
  if(o.setting==='forest'){
   sprite(c,'world_detail_forest_green_04',o.x-29,o.y-7,58,.85);
   sprite(c,'world_detail_forest_green_02',o.x+31,o.y-12,60,.85);
  }
 }
 else if(o.kind==='tower')art='landmark_tower';
 else art='landmark_'+o.kind;
 sprite(c,art,o.x,o.y,o.width,.9);
 if(o.kind==='tower')for(const p of SCENERY_LAYOUTS[o.id]??[])sprite(c,p.art,o.x+p.x*o.width,o.y+p.y*o.width,o.width*p.scale,.88);
 if(o.setting==='forest'){
  sprite(c,'world_detail_forest_green_04',o.x-35,o.y+13,38,.85);
  sprite(c,'world_detail_forest_green_02',o.x+35,o.y+15,36,.85);
 }
}
export function drawMountainRanges(c,seed,sprite){
 const stamps=[];
 for(const range of WORLD_MOUNTAIN_RANGES)for(const [partIndex,points]of range.parts.entries()){
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  for(let y=minY+14,row=0;y<=maxY;y+=34,row++)for(let x=minX+28,col=0;x<maxX;x+=67,col++){
   const key=`${range.id}:${partIndex}:${row}:${col}`,r=n=>visualRandom(seed,key+':'+n),cx=x+(row%2)*28,cy=y+r(0)*7;
   if(!worldBlocked({x:cx,y:cy}))continue;
   let width=94+r(1)*22;
   while(width>32&&(!worldBlocked({x:cx-width*.42,y:cy})||!worldBlocked({x:cx+width*.42,y:cy})))width-=6;
   if(width<=32)continue;
   const kind=range.desert?'desert':range.snow?'snow':'green';
   stamps.push({x:cx,y:cy,width,art:`landmark_mountain_${kind}_${1+Math.floor(r(2)*4)}`});
  }
 }
 // Back-to-front textured clusters make ridges readable, with the central cleft
 // still visibly open. All stamps sit inside the same navigational polygons.
 stamps.sort((a,b)=>a.y-b.y).forEach(p=>sprite(c,p.art,p.x,p.y,p.width,.91));
}

export function landmarkCampPoint(point){
 let p={...point};
 const protectedSites=[...sites.filter(s=>['pyramid','sphinx'].includes(s[1])).map(([id,kind,x,y,width])=>({...compactPoint({x,y}),width})),...LEGENDARY_CAVES];
 for(const site of protectedSites){const d=Math.hypot(p.x-site.x,p.y-site.y),radius=site.width*.4+48;if(d<radius){const dx=d?(p.x-site.x)/d:1,dy=d?(p.y-site.y)/d:0;p={x:site.x+dx*(radius+5),y:site.y+dy*(radius+5)};}}
 return p;
}
