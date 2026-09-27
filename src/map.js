import { SETTLEMENTS, terrainAt, getCampSites, getRoamingBands } from './engine.js';

const names=['world_grass_01','world_grass_02','world_grass_03','world_grass_04','world_plains_01','world_plains_02','world_plains_03','world_highlands_01','world_highlands_02','world_highlands_03','world_forest_01','world_forest_02','world_swamp_01','world_snow_01','world_ocean_00','world_detail_forest_green_01','world_detail_forest_green_02','world_detail_forest_green_03','world_detail_forest_green_04','world_detail_autumn_green_01','world_detail_autumn_green_02','legend_world_grass_hill_01','legend_world_grass_hill_02','legend_world_grass_hill_03','houses_01_01','houses_02_01','houses_03_01','townhall_01','townhall_02','stronghold_01','stronghold_02','fortified_outpost_01','wheat_farm_01','wheat_field_01','harbor_sw','stone_watchtower_01','figure_player_party','figure_player_trader','figure_player_ranger','figure_player_beggar','figure_player_berserker','figure_player_assassin','figure_player_slave','banner_101','banner_102','banner_103'];
const images=new Map();
const loaded=Promise.all(names.map(name=>new Promise(resolve=>{const img=new Image();img.onload=resolve;img.onerror=resolve;img.src=new URL(`../assets/world/${name}.png`,import.meta.url).href;images.set(name,img);})));
const townArt={oakwatch:'houses_02_01',greyhaven:'townhall_02',ironford:'stronghold_01',thornwall:'stronghold_02',redmere:'townhall_01',highpass:'fortified_outpost_01',saltwick:'houses_01_01',barrowfield:'houses_03_01'};
const roads=[[0,1],[1,2],[2,3],[2,4],[1,5],[0,6],[0,7],[7,4],[7,2]];
let canvas,ctx,state,selection=null,callback,campCallback,background=null,resizeObserver;
const camera={x:570,y:430,zoom:1.1,initialized:false};
let width=0,height=0,pointers=new Map(),dragOrigin=null,pinchStart=null,dragged=false;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function sprite(target,name,x,y,w,anchor=.83){const img=images.get(name);if(!img?.naturalWidth)return;const h=w*img.naturalHeight/img.naturalWidth;target.drawImage(img,x-w/2,y-h*anchor,w,h);}
function bands(){const value=state?getRoamingBands(state):[];return Array.isArray(value)?value:[];}
function bandCount(band){return Math.max(1,Number(band.enemyCount??band.enemies?.length??band.count??1)||1);}
function bandHunted(band){return state?.pursuit===band.id;}
function buildBackground(){
 const bg=document.createElement('canvas');bg.width=2700;bg.height=2100;const b=bg.getContext('2d');b.scale(1.5,1.5);b.translate(300,300);b.fillStyle='#244b47';b.fillRect(-300,-300,1800,1400);
 let seed=71491;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let row=-9;row<30;row++)for(let col=0;col<19;col++){
  const x=130+col*80+(row%2)*40,y=row*40;const t=terrainAt(x,y);
  const set=t==='mountain'?['world_highlands_01','world_highlands_02','world_highlands_03']:t==='forest'?['world_forest_01','world_forest_02']:t==='marsh'?['world_swamp_01']:['world_grass_01','world_grass_02','world_grass_03','world_grass_04','world_plains_01','world_plains_02'];
  sprite(b,set[Math.floor(rand()*set.length)],x,y,210,.5);
 }
 b.lineCap='round';
 roads.forEach(([a,c])=>{const p=SETTLEMENTS[a],q=SETTLEMENTS[c];b.beginPath();b.moveTo(p.x,p.y);b.quadraticCurveTo((p.x+q.x)/2+15,(p.y+q.y)/2+20,q.x,q.y);b.strokeStyle='#514c32';b.lineWidth=7;b.stroke();b.strokeStyle='#b1a16b';b.lineWidth=4;b.stroke();b.strokeStyle='#ccbb85aa';b.lineWidth=1;b.stroke();});
 const objects=[];
 for(let i=0;i<300;i++){
  const x=190+rand()*1020,y=30+rand()*760;
  if(SETTLEMENTS.some(t=>Math.hypot(x-t.x,y-t.y)<66))continue;
  const terrain=terrainAt(x,y);
  if(terrain==='forest')objects.push({x,y,name:`world_detail_forest_green_0${1+Math.floor(rand()*4)}`,w:65+rand()*30});
  else if(terrain==='mountain')objects.push({x,y,name:`legend_world_grass_hill_0${1+Math.floor(rand()*3)}`,w:100+rand()*70});
  else if(rand()<.1)objects.push({x,y,name:`world_detail_autumn_green_0${1+Math.floor(rand()*2)}`,w:45+rand()*28});
 }
 SETTLEMENTS.forEach((t,i)=>{objects.push({x:t.x,y:t.y,name:townArt[t.id],w:t.kind==='village'?100:122});if(i===0||i===7)objects.push({x:t.x-60,y:t.y+40,name:'wheat_field_01',w:100});if(i===6)objects.push({x:t.x-68,y:t.y+32,name:'harbor_sw',w:83});});
 objects.sort((a,b)=>a.y-b.y).forEach(o=>sprite(b,o.name,o.x,o.y,o.w));background=bg;
}
export function mapHTML(){return `<canvas id="world-map" role="img" aria-label="World map. Drag to pan, pinch or use plus and minus to zoom. Select a settlement using the destination list."></canvas><div class="map-loading">Preparing the Marches…</div>`;}
export const mapSVG=mapHTML;
export function mountMap(game,onChooseTown,onTravel,onChooseCamp){
 resizeObserver?.disconnect();pointers.clear();dragOrigin=null;pinchStart=null;canvas=document.querySelector('#world-map');if(!canvas)return;
 ctx=canvas.getContext('2d');state=game;callback=onChooseTown;campCallback=onChooseCamp;
 const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!camera.initialized){camera.zoom=clamp(Math.max(width/1120,height/820),.65,1.4);camera.initialized=true;}draw();};
 resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
 const point=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
 canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);const p=point(e);pointers.set(e.pointerId,p);dragOrigin={...p,cx:camera.x,cy:camera.y};dragged=false;if(pointers.size===2){const [a,b]=[...pointers.values()];pinchStart={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:camera.zoom};dragged=true;}};
 canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2&&pinchStart){const [a,b]=[...pointers.values()];camera.zoom=clamp(pinchStart.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinchStart.distance,.55,2.5);dragged=true;}else if(dragOrigin){if(Math.hypot(p.x-dragOrigin.x,p.y-dragOrigin.y)>7)dragged=true;if(dragged){camera.x=clamp(dragOrigin.cx-(p.x-dragOrigin.x)/camera.zoom,120,1150);camera.y=clamp(dragOrigin.cy-(p.y-dragOrigin.y)/camera.zoom,70,730);}}draw();};
 canvas.onpointerup=e=>{const p=point(e);pointers.delete(e.pointerId);if(!dragged&&!pinchStart){const world={x:camera.x+(p.x-width/2)/camera.zoom,y:camera.y+(p.y-height/2)/camera.zoom};const town=SETTLEMENTS.find(t=>Math.hypot(t.x-world.x,t.y-world.y)<48);const camp=getCampSites(state).find(c=>Math.hypot(c.x-world.x,c.y-world.y)<34);const band=bands().find(b=>Math.hypot(b.x-world.x,b.y-world.y)<34);if(band&&campCallback)campCallback({...band,kind:'band'});else if(camp&&campCallback)campCallback(camp);else if(town)callback(town);else onTravel(world.x,world.y);}if(!pointers.size){dragOrigin=null;pinchStart=null;}else{const remaining=[...pointers.values()][0];dragOrigin={...remaining,cx:camera.x,cy:camera.y};}};
 canvas.onpointercancel=()=>{pointers.clear();dragOrigin=null;pinchStart=null;};
 canvas.onwheel=e=>{e.preventDefault();camera.zoom=clamp(camera.zoom*(e.deltaY>0?.9:1.1),.55,2.5);draw();};
 loaded.then(()=>{if(!background)buildBackground();document.querySelector('.map-loading')?.remove();draw();});
}
export function focusMap(position){camera.x=position.x;camera.y=position.y;draw();}
export function zoomMap(factor){camera.zoom=clamp(camera.zoom*factor,.55,2.5);draw();}
export function selectMapTown(town){selection=town?.id||null;draw();}
export function selectMapCamp(id){selection=id;draw();}
export function updateMap(game){state=game;if(canvas?.isConnected)draw();}
function draw(){
 if(!ctx||!width||!height||!state)return;
 ctx.clearRect(0,0,width,height);ctx.save();ctx.translate(width/2,height/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 ctx.fillStyle='#244b47';ctx.fillRect(camera.x-width/camera.zoom,camera.y-height/camera.zoom,width*2/camera.zoom,height*2/camera.zoom);
 if(background)ctx.drawImage(background,-300,-300,1800,1400);
 const darkness=state.hour<5||state.hour>21?.20:state.hour<7||state.hour>19?.10:0;
 if(darkness){ctx.fillStyle=`rgba(14,23,43,${darkness})`;ctx.fillRect(-300,-300,1800,1400);}
 getCampSites(state).forEach(c=>{
  const cleared=c.cleared||c.clearedDay;ctx.save();if(cleared)ctx.globalAlpha=.45;
  if(selection===c.id||state.contract?.campId===c.id){ctx.strokeStyle='#dca673';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(c.x,c.y+2,33,13,0,0,Math.PI*2);ctx.stroke();}
  sprite(ctx,'fortified_outpost_01',c.x,c.y,70);
  ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#241a14';ctx.strokeText(c.name,c.x,c.y+20);ctx.fillStyle=cleared?'#b4a78a':'#e5b493';ctx.fillText(c.name,c.x,c.y+20);ctx.restore();
 });
 bands().forEach((band,index)=>{
  const count=bandCount(band),selected=selection===band.id,hunted=bandHunted(band),art=['figure_player_beggar','figure_player_berserker','figure_player_assassin','figure_player_slave'][index%4];
  ctx.save();
  if(selected||hunted){ctx.lineWidth=2;ctx.strokeStyle=selected?'#f1d380':'#c46d57';ctx.setLineDash(hunted?[3,3]:[]);ctx.beginPath();ctx.ellipse(band.x,band.y+7,25,10,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  ctx.beginPath();ctx.ellipse(band.x,band.y+8,16,6,0,0,Math.PI*2);ctx.fillStyle='#14201688';ctx.fill();
  if(count>1)sprite(ctx,['figure_player_berserker','figure_player_ranger','figure_player_slave'][index%3],band.x-8,band.y+1,25,.72);
  sprite(ctx,art,band.x+(count>1?7:0),band.y,29,.72);sprite(ctx,`banner_10${1+index%3}`,band.x+16,band.y-20,17,.82);
  const label=`${band.name||'Wandering Brigands'} · ${count} brigand${count===1?'':'s'}`;ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1c1913cc';ctx.strokeText(label,band.x,band.y+24);ctx.fillStyle=selected?'#f0d998':hunted?'#e8a389':'#d8cfad';ctx.fillText(label,band.x,band.y+24);ctx.restore();
 });
 if(state.destination){ctx.strokeStyle='#f0d783';ctx.lineWidth=2/camera.zoom;ctx.setLineDash([5/camera.zoom,7/camera.zoom]);ctx.beginPath();ctx.moveTo(state.position.x,state.position.y);ctx.lineTo(state.destination.x,state.destination.y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(state.destination.x,state.destination.y,12,0,Math.PI*2);ctx.stroke();}
 SETTLEMENTS.forEach((t,i)=>{
  if(selection===t.id||state.contract?.to===t.id){ctx.strokeStyle=selection===t.id?'#f4d78f':'#dfcb73';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(t.x,t.y+3,45,17,0,0,Math.PI*2);ctx.stroke();}
  sprite(ctx,`banner_10${1+i%3}`,t.x+43,t.y-29,22,.9);
  ctx.font='bold 17px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#29291edd';ctx.strokeText(t.name,t.x,t.y+25);ctx.fillStyle='#f0e4bd';ctx.fillText(t.name,t.x,t.y+25);
 });
 const progress=(state.day*24+state.hour)/17,t=(Math.sin(progress)+1)/2,a=SETTLEMENTS[1],b=SETTLEMENTS[2];sprite(ctx,'figure_player_trader',a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,30);
 ctx.beginPath();ctx.ellipse(state.position.x,state.position.y+9,20,8,0,0,Math.PI*2);ctx.fillStyle='#15201666';ctx.fill();sprite(ctx,'figure_player_party',state.position.x,state.position.y,36,.7);sprite(ctx,'banner_101',state.position.x+14,state.position.y-23,25,.8);ctx.restore();
}
