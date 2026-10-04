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
 ['fallen-gate','ruins',1120,490,114,'greenwood'],
 ['old-crossing','battlefield',1510,580,118,'greenwood'],
 ['forest-sanctuary','temple',1900,865,152,'greenwood'],
 ['peat-temple','temple',1680,1320,126,'blackwater-basin'],
 ['drowned-watch','tower',2100,1230,82,'blackwater-basin'],
 ['south-border','tower',710,1690,88,'southern-marches'],
 ['burnt-convoy','battlefield',1220,1790,100,'saffron-coast'],
 ['coast-ruins','ruins',640,2260,132,'saffron-coast'],
 ['frost-watch','tower',2800,285,90,'northern-highlands'],
 ['frontier-battle','battlefield',2880,920,110,'eastern-frontier'],
 ['frontier-gate','ruins',2570,1240,146,'eastern-frontier'],
 ['steppe-colossus','temple',4500,470,176,'far-steppe'],
 ['steppe-watch','tower',4610,1340,84,'far-steppe'],
 ['steppe-battle','battlefield',3990,570,104,'far-steppe'],
 ['lesser-pyramid','pyramid',2680,1690,148,'sunlands'],
 ['necropolis-pyramid','pyramid',3560,1980,224,'sunlands'],
 ['necropolis-sphinx','sphinx',3780,2000,146,'sunlands'],
 ['buried-temple','temple',4430,2230,186,'sunlands'],
 ['desert-pyramid','pyramid',4740,2580,170,'sunlands'],
 ['desert-ruins','ruins',3230,2790,128,'sunlands'],
];
export function worldLandmarks(seed,{settlements=[],camps=[],roads=[]}={}){
 const landmarks=[];
 for(const [id,kind,x,y,width,region]of sites){
  const p=compactPoint({x,y});
  // Major monuments keep their authored grouping; minor sites vary a little by campaign.
  const jitter=['pyramid','sphinx','temple'].includes(kind)?0:14;
  p.x+=(visualRandom(seed,id+':x')*2-1)*jitter;p.y+=(visualRandom(seed,id+':y')*2-1)*jitter;
  const radius=width*.4;
  if(regionAt(p.x,p.y).id!==region || worldBlocked(p)
    || settlements.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<radius+85)
    || !['pyramid','sphinx','temple'].includes(kind) && camps.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<radius+45)
    || distanceToRoad(p.x,p.y,roads)<radius*.6+22)continue;
  landmarks.push({id,kind,...p,width,region});
 }
 return [...landmarks,...LEGENDARY_CAVES];
}
export function landmarkAt(landmarks,p){return landmarks.find(o=>Math.hypot((o.x-p.x)/(o.width*.48),(o.y-p.y)/(o.width*.32))<1);}
// Freely licensed textured sprites; provenance and adaptation recipes are recorded
// in assets/world/landmark-sources.json. No flat geometric landmark fallback.
export const WORLD_LANDMARK_ASSETS=Object.freeze([
 'landmark_temple','landmark_temple_sand','landmark_ruin_arch','landmark_ruin_arch_sand',
 'landmark_ruin_wall','landmark_ruin_wall_sand','landmark_rubble','landmark_tower',
 'landmark_pyramid','landmark_sphinx','landmark_cave_forest','landmark_cave_mountain','landmark_cave_desert',
 ...['green','snow','desert'].flatMap(kind=>[1,2,3,4].map(n=>`landmark_mountain_${kind}_${n}`)),
]);
export function drawWorldLandmark(c,o,seed,sprite){
 const desert=o.region==='sunlands'||o.setting==='desert',suffix=desert?'_sand':'';
 if(o.kind==='battlefield'){
  // Existing credited wagon art plus imported masonry debris mark an abandoned
  // convoy, rather than creating an active caravan or an encounter target.
  sprite(c,'landmark_rubble',o.x-22,o.y+6,o.width*.58,.86);
  c.save();c.filter='brightness(.52) saturate(.35)';c.translate(o.x+16,o.y);c.rotate(-.28);
  sprite(c,'arms_cart',0,0,o.width*.44,.85);c.restore();
  for(let i=0;i<6;i++){
   const x=o.x+16+i*2,y=o.y-14-i*9,r=6+i*2,g=c.createRadialGradient(x,y,1,x,y,r);
   g.addColorStop(0,'#343a3640');g.addColorStop(1,'#343a3600');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
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
 else if(o.kind==='temple')art='landmark_temple'+suffix;
 else if(o.kind==='ruins')art=(visualRandom(seed,o.id+':art')<.5?'landmark_ruin_arch':'landmark_ruin_wall')+suffix;
 else art='landmark_'+o.kind;
 sprite(c,art,o.x,o.y,o.width,.9);
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
 const protectedSites=[...sites.filter(s=>['pyramid','sphinx','temple'].includes(s[1])).map(([id,kind,x,y,width])=>({...compactPoint({x,y}),width})),...LEGENDARY_CAVES];
 for(const site of protectedSites){const d=Math.hypot(p.x-site.x,p.y-site.y),radius=site.width*.4+48;if(d<radius){const dx=d?(p.x-site.x)/d:1,dy=d?(p.y-site.y)/d:0;p={x:site.x+dx*(radius+5),y:site.y+dy*(radius+5)};}}
 return p;
}
