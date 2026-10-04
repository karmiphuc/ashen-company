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
export const WORLD_LANDMARK_ASSETS=Object.freeze([
 'landmark_tower',
 'battlefield_wagon_wreck','battlefield_bones','battlefield_corpse_blue','battlefield_corpse_red','battlefield_firepit',
 'landmark_pyramid','landmark_sphinx','landmark_cave_forest','landmark_cave_mountain','landmark_cave_desert',
 ...['green','snow','desert'].flatMap(kind=>[1,2,3,4].map(n=>`landmark_mountain_${kind}_${n}`)),
]);
export function drawWorldLandmark(c,o,seed,sprite){
 if(o.kind==='battlefield'){
  // User-provided battlefield tiles compose a small, abandoned scene. They are
  // scenery only: no entities, loot, active fires or click targets are created.
  const variant=Math.floor(visualRandom(seed,o.id+':scene')*3);
  if(variant===0){
   sprite(c,'battlefield_wagon_wreck',o.x-18,o.y+2,o.width*.55,.88);
   sprite(c,'battlefield_corpse_blue',o.x+27,o.y+8,o.width*.17,.8);
  }else if(variant===1){
   sprite(c,'battlefield_corpse_red',o.x-24,o.y+7,o.width*.18,.8);
   sprite(c,'battlefield_corpse_blue',o.x+25,o.y-5,o.width*.18,.8);
  }else{
   sprite(c,'battlefield_bones',o.x-25,o.y+5,o.width*.165,.82);
   sprite(c,'battlefield_wagon_wreck',o.x+20,o.y+3,o.width*.5,.85);
  }
  sprite(c,'battlefield_firepit',o.x+6,o.y+14,o.width*.25,.84);
  for(let i=0;i<5;i++){
   const x=o.x+6+i*2,y=o.y-2-i*7,r=4+i*1.6,g=c.createRadialGradient(x,y,1,x,y,r);
   g.addColorStop(0,'#343a3638');g.addColorStop(1,'#343a3600');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
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
