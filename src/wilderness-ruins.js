import {compactPoint,regionAt,distanceToRoad} from './geography.js';
import {visualRandom} from './map-illustration.js';
import {worldBlocked,worldPointInBounds} from './world-navigation.js';
export const WILDERNESS_RUIN_ASSETS=Object.freeze(['manor','clocktower','cathedral','chapel','windmill','house','fortress','townhall'].map(k=>'user_ruin_'+k));
// Historic rural districts, abandoned forest chapels and old frontier garrisons.
// Ordinary houses/mills are more frequent than large cathedrals or fortresses.
const sites=[
 ['house',360,830,55],['windmill',720,750,61],['manor',1020,700,70],['chapel',1230,850,68],
 ['clocktower',1440,430,65],['cathedral',1870,680,100],['fortress',500,1190,108],
 ['house',300,1360,55],['windmill',650,1470,63],['chapel',1090,1520,70],
 ['townhall',1530,1550,72],['manor',1860,1630,73],['house',780,1920,55],
 ['windmill',1420,2240,64],['townhall',690,2720,72],['chapel',1850,2500,70],
 ['house',2680,730,57],['fortress',3200,1150,108],['manor',3200,780,75],
 ['windmill',3780,1040,65],['townhall',4380,910,73],['house',4520,500,56],
 ['clocktower',3020,295,63],['chapel',1470,320,64],
];
function fits(o,{settlements=[],camps=[],roads=[],reserved=[]}){
 const argsSettlements=settlements,argsCamps=camps;
 const ratio={cathedral:1.2,chapel:1,fortress:1,windmill:1.2,clocktower:1.25,house:1,manor:1,townhall:1}[o.variant];
 // Check the upright building envelope, including its roof, so tall ruins
 // cannot protrude into a mountain range, desert or the edge of the world.
 for(const dx of [-.52,0,.52])for(const dy of [-ratio*.88,0,ratio*.12]){
  const p={x:o.x+dx*o.width,y:o.y+dy*o.width};if(!worldPointInBounds(p)||worldBlocked(p)||regionAt(p.x,p.y).climate==='desert'
    ||(argsSettlements.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<130))
    ||(argsCamps.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<50)))return false;
 }
 return distanceToRoad(o.x,o.y,roads)>=o.width*.24+22
  &&!settlements.some(t=>Math.hypot(t.x-o.x,t.y-o.y)<o.width*.4+85)
  &&!camps.some(t=>Math.hypot(t.x-o.x,t.y-o.y)<o.width*.4+45)
  &&!reserved.some(t=>Math.hypot(t.x-o.x,t.y-o.y)<o.width*.5+t.width*.5+24);
}
export function wildernessRuins(seed,args={}){
 const result=[];
 for(const [index,[variant,x,y,width]]of sites.entries()){
  const id='wild-ruin-'+index,base=compactPoint({x,y}),o={id,kind:'wilderness-ruin',variant,width:width*(.96+visualRandom(seed,id+':size')*.08)};
  const start=visualRandom(seed,id+':position')*Math.PI*2;let chosen=null;
  for(const radius of [0,45,90,135,180]){
   for(let i=0;i<(radius?12:1);i++){const a=start+i*Math.PI/6,p={...o,x:base.x+Math.cos(a)*radius,y:base.y+Math.sin(a)*radius};
    if(fits(p,{...args,reserved:[...(args.reserved??[]),...result]})){chosen=p;break;}}
   if(chosen)break;
  }
  if(chosen)result.push({...chosen,region:regionAt(chosen.x,chosen.y).id});
 }
 return result;
}
export function drawWildernessRuin(c,o,sprite){
 // Texture footprint and small rubble ground the ruin without turning it
 // into a labelled, selectable town or active enemy camp.
 const floor=['windmill','house'].includes(o.variant)?'scene_ground_ash':'scene_ground_moss';
 sprite(c,floor,o.x,o.y+2,o.width*.92,.5);
 sprite(c,'user_ruin_'+o.variant,o.x,o.y,o.width,.88);
 if(['chapel','manor'].includes(o.variant))sprite(c,'world_detail_forest_green_03',o.x+o.width*.39,o.y+7,o.width*.25,.85);
}
