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
const polygon=(c,points,fill,stroke='#625b43')=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke();}};
function rubble(c,seed,id,count=16){for(let i=0;i<count;i++){const r=n=>visualRandom(seed,`${id}:rubble:${i}:${n}`),x=(r(0)-.5)*100,y=r(1)*18;c.fillStyle=i%2?'#716b51':'#9d9679';c.beginPath();c.ellipse(x,y,3+r(2)*5,2+r(3)*3,-.3,0,Math.PI*2);c.fill();}}
export function drawWorldLandmark(c,o,seed,sprite){
 c.save();c.translate(o.x,o.y);c.scale(o.width/120,o.width/120);c.lineWidth=.7;c.lineJoin='round';
 c.fillStyle='#25251938';c.beginPath();c.ellipse(8,8,57,16,-.1,0,Math.PI*2);c.fill();
 const desert=o.region==='sunlands'||o.setting==='desert',stone=desert?'#b49a69':'#827d65',light=desert?'#d3b984':'#b0aa8d',dark=desert?'#806c46':'#535747';
 if(o.kind==='pyramid'){
  polygon(c,[[-58,5],[4,-75],[58,5],[4,24]],dark);
  const face=c.createLinearGradient(-40,-65,30,22);face.addColorStop(0,'#ddc796');face.addColorStop(1,'#b59a68');
  const shade=c.createLinearGradient(4,-70,50,20);shade.addColorStop(0,'#b69a68');shade.addColorStop(1,'#8e744c');
  polygon(c,[[-58,5],[4,-75],[4,24]],face);polygon(c,[[4,-75],[58,5],[4,24]],shade);
  weatherStone(c,seed,o.id,[[-58,5],[4,-75],[58,5],[4,24]],350);
  c.save();c.beginPath();c.moveTo(-58,5);c.lineTo(4,-75);c.lineTo(4,24);c.closePath();c.clip();c.strokeStyle='#8c764956';c.lineWidth=.8;
  for(let y=-62;y<22;y+=7){c.beginPath();c.moveTo(-60,y);c.lineTo(10,y+12);c.stroke();for(let x=-60;x<10;x+=13){c.beginPath();c.moveTo(x+(y%2)*4,y);c.lineTo(x+(y%2)*4,y+7);c.stroke();}}c.restore();
  polygon(c,[[-5,13],[-5,-1],[1,-7],[7,0],[7,18]],'#443f2d');rubble(c,seed,o.id,12);
 }else if(o.kind==='sphinx'){
  // Reclining lion, paired forepaws, human face and striped royal headdress.
  polygon(c,[[-53,8],[-43,-13],[17,-10],[49,0],[48,15],[-45,17]],dark);
  c.fillStyle=stone;c.beginPath();c.ellipse(-13,-7,35,17,0,0,Math.PI*2);c.fill();
  polygon(c,[[-49,5],[-28,0],[36,11],[34,18],[-48,16]],light);
  polygon(c,[[12,-18],[12,10],[48,15],[54,9],[28,-3]],stone);
  polygon(c,[[4,-44],[13,-60],[29,-60],[40,-44],[37,-15],[9,-16]],dark);
  polygon(c,[[10,-40],[15,-53],[27,-54],[33,-39],[29,-23],[17,-22]],light);
  c.strokeStyle='#544932';c.beginPath();c.moveTo(17,-38);c.lineTo(22,-37);c.moveTo(27,-39);c.lineTo(31,-38);c.moveTo(24,-36);c.lineTo(22,-30);c.lineTo(26,-30);c.moveTo(19,-27);c.lineTo(27,-27);c.stroke();
  for(let y=-48;y<-17;y+=5){c.strokeStyle=light;c.beginPath();c.moveTo(6,y);c.lineTo(12,y+1);c.moveTo(33,y);c.lineTo(39,y+1);c.stroke();}rubble(c,seed,o.id,8);
  weatherStone(c,seed,o.id,[[-53,16],[-43,-13],[4,-20],[4,-44],[13,-60],[29,-60],[40,-44],[37,-15],[54,9],[48,18]],180);
 }else if(o.kind==='cave'){
  polygon(c,[[-55,13],[-46,-13],[-26,-36],[0,-41],[32,-29],[52,0],[55,15]],stone);
  polygon(c,[[-46,-13],[-26,-36],[-9,-19],[-20,10]],light);polygon(c,[[0,-41],[32,-29],[52,0],[18,-8]],dark);
  c.fillStyle='#191e17';c.beginPath();c.moveTo(-20,13);c.lineTo(-20,-4);c.bezierCurveTo(-20,-28,19,-28,20,-4);c.lineTo(23,13);c.closePath();c.fill();
  c.strokeStyle=light;c.lineWidth=5;c.beginPath();c.moveTo(-23,12);c.lineTo(-23,-4);c.bezierCurveTo(-24,-29,22,-29,23,-4);c.lineTo(26,12);c.stroke();rubble(c,seed,o.id,9);
  weatherStone(c,seed,o.id,[[-55,13],[-46,-13],[-26,-36],[0,-41],[32,-29],[52,0],[55,15]],100);
  if(o.setting==='forest'){sprite(c,'world_detail_forest_green_04',-43,-7,56,.7);sprite(c,'world_detail_forest_green_02',43,1,53,.7);}
  if(o.setting==='mountain'){polygon(c,[[-26,-36],[0,-41],[12,-34],[-3,-29],[-13,-31]],'#cbd3ca',null);}
 }else if(o.kind==='tower'){
  sprite(c,'stone_watchtower_01',0,4,72,.9);c.globalAlpha=.65;rubble(c,seed,o.id,22);
  polygon(c,[[-15,-53],[-13,-42],[0,-47],[9,-42],[14,-54],[0,-61]],dark,null);
  c.strokeStyle='#393c30';c.beginPath();c.moveTo(-4,-39);c.lineTo(1,-31);c.lineTo(-3,-21);c.stroke();
 }else if(o.kind==='battlefield'){
  rubble(c,seed,o.id,24);c.strokeStyle='#3e3526';c.lineWidth=3;c.beginPath();c.moveTo(-37,2);c.lineTo(-18,-18);c.moveTo(-27,-15);c.lineTo(-15,4);c.stroke();
  c.fillStyle='#3b3528';c.fillRect(0,-6,28,11);c.strokeStyle='#544a35';c.lineWidth=2;
  for(const x of [3,24]){c.beginPath();c.arc(x,9,6,0,Math.PI*2);c.stroke();}
  polygon(c,[[-45,7],[-34,-1],[-20,7],[-28,15]],'#6b6350');c.fillStyle='#bb753d';c.fillRect(10,0,3,2);c.fillRect(18,1,2,2);
  // Static smoke is baked into the raster; no ambient animation or new simulated actors.
  for(let i=0;i<6;i++){const x=14+i*3,y=-8-i*10,r=7+i*2,g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,'#343a3650');g.addColorStop(1,'#343a3600');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 }else{
  // Monumental abandoned halls with broken columns, arches and an eroded raised plinth.
  polygon(c,[[-56,8],[-45,-2],[47,-2],[57,8],[40,20],[-43,20]],dark);
  polygon(c,[[-45,-2],[-45,-9],[47,-9],[47,-2]],light);
  for(const [i,x]of [-35,-12,12,35].entries()){
   const top=o.kind==='temple'?-50:(i%2?-24:-38);polygon(c,[[x-5,0],[x-5,top],[x+6,top-2],[x+6,0]],stone);
   c.fillStyle=light;c.fillRect(x-7,top-3,16,5);c.strokeStyle=dark;c.beginPath();c.moveTo(x,top+3);c.lineTo(x,0);c.stroke();
  }
  if(o.kind==='temple'){polygon(c,[[-46,-52],[0,-75],[46,-52]],stone);polygon(c,[[-46,-52],[0,-75],[-4,-56]],light);c.fillStyle=dark;c.fillRect(-44,-53,87,7);}
  rubble(c,seed,o.id,20);
 }
 c.restore();
}
function weatherStone(c,seed,id,outline,count){
 c.save();c.beginPath();outline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 for(let i=0;i<count;i++){const r=n=>visualRandom(seed,`${id}:grain:${i}:${n}`),x=(r(0)-.5)*116,y=r(1)*100-76;
  c.fillStyle=i%3?'#53483222':'#ffebbc35';c.fillRect(x,y,.5+r(2)*2,.4+r(3));}
 c.restore();
}
export function drawMountainRanges(c,seed,sprite){
 for(const range of WORLD_MOUNTAIN_RANGES)for(const [partIndex,points]of range.parts.entries()){
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  for(let y=minY+15,row=0;y<=maxY;y+=32,row++)for(let x=minX+20,col=0;x<maxX;x+=49,col++){
   const key=`${range.id}:${partIndex}:${row}:${col}`,r=n=>visualRandom(seed,key+':'+n),cx=x+(row%2)*24+r(0)*13,cy=y+r(1)*9;
   if(!worldBlocked({x:cx,y:cy}))continue;
   let w=38+r(2)*19;while(w>12&&(!worldBlocked({x:cx-w,y:cy})||!worldBlocked({x:cx+w,y:cy})))w-=4;
   if(w<=12)continue;
   const h=range.desert?24+r(3)*28:32+r(3)*37,tip=cx-12+r(4)*20;
   c.save();c.lineWidth=.6;
   const shadow=c.createRadialGradient(cx,cy,1,cx,cy,w*1.2);shadow.addColorStop(0,'#27322655');shadow.addColorStop(1,'#27322600');c.fillStyle=shadow;c.fillRect(cx-w*1.2,cy-12,w*2.4,28);
   if(sprite)sprite(c,'world_highlands_02',cx,cy,w*2,.5);
   const left=c.createLinearGradient(cx-w,cy-h,tip,cy);left.addColorStop(0,range.desert?'#c3ac7b':'#a1aa97');left.addColorStop(1,range.desert?'#907751':'#6b7b64');
   const right=c.createLinearGradient(tip,cy-h,cx+w,cy);right.addColorStop(0,range.desert?'#9b8057':'#738274');right.addColorStop(1,range.desert?'#65553a':'#3f5043');
   const outline=range.desert?[[cx-w,cy],[cx-w*.63,cy-h*.38],[tip-17,cy-h],[tip+19,cy-h+3],[cx+w*.62,cy-h*.44],[cx+w,cy],[cx+4,cy+7]]
    :[[cx-w,cy],[cx-w*.63,cy-h*.31],[tip-11,cy-h*.72],[tip,cy-h],[tip+10,cy-h*.69],[cx+w*.62,cy-h*.37],[cx+w,cy],[cx+4,cy+7]];
   polygon(c,outline,right,range.desert?'#75644680':'#4f605080');
   polygon(c,[[cx-w,cy],[cx-w*.63,cy-h*.31],[tip-11,cy-h*.72],[tip,cy-h],[tip-4,cy-h*.55],[tip+4,cy-h*.29],[cx+4,cy+7]],left,null);
   polygon(c,[[tip,cy-h],[tip+10,cy-h*.69],[cx+w*.62,cy-h*.37],[cx+w,cy],[tip+5,cy-h*.15]],right,null);
   c.strokeStyle=range.desert?'#6e593855':'#40504155';c.beginPath();c.moveTo(tip+2,cy-h*.61);c.lineTo(tip+14,cy-h*.25);c.lineTo(cx+21,cy);c.moveTo(tip-12,cy-h*.6);c.lineTo(cx-w*.5,cy-8);c.stroke();
   if(range.desert){
    c.save();c.beginPath();outline.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.clip();
    c.strokeStyle='#dac09245';c.lineWidth=1.6;for(let band=0;band<5;band++){const yy=cy-h+8+band*h/5;c.beginPath();c.moveTo(cx-w,yy);c.lineTo(cx+w,yy+4);c.stroke();}c.restore();
    polygon(c,[[tip-17,cy-h],[tip+19,cy-h+3],[tip+11,cy-h+7],[tip-12,cy-h+5]],'#b99d6d',null);
   }
   if(range.snow)polygon(c,[[tip,cy-h],[tip-11,cy-h*.72],[tip-16,cy-h*.58],[tip-9,cy-h*.63],[tip-4,cy-h*.47],[tip+1,cy-h*.57],[tip+8,cy-h*.46],[tip+5,cy-h*.67],[tip+10,cy-h*.69]],'#d1d9cb',null);
   c.save();c.beginPath();outline.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.clip();
   for(let i=0;i<45;i++){c.fillStyle=i%2?'#26362720':'#e8e2bd26';c.fillRect(cx+(r(8+i)-.5)*w*2,cy-r(60+i)*h,1+r(110+i)*2,1);}
   c.restore();c.restore();
  }
 }
}

export function landmarkCampPoint(point){
 let p={...point};
 const protectedSites=[...sites.filter(s=>['pyramid','sphinx','temple'].includes(s[1])).map(([id,kind,x,y,width])=>({...compactPoint({x,y}),width})),...LEGENDARY_CAVES];
 for(const site of protectedSites){const d=Math.hypot(p.x-site.x,p.y-site.y),radius=site.width*.4+48;if(d<radius){const dx=d?(p.x-site.x)/d:1,dy=d?(p.y-site.y)/d:0;p={x:site.x+dx*(radius+5),y:site.y+dy*(radius+5)};}}
 return p;
}
