import { compactPoint, WORLD_LIMITS } from './geography.js';

// Authored ridges stay between the existing trade roads. Frostspine's cleft is walkable.
export const WORLD_MOUNTAIN_RANGES = Object.freeze([
  {id:'frostspine',name:'Frostspine',snow:true,parts:[[[1840,210],[2220,205],[2310,245],[2250,280],[1940,280]],[[2020,345],[2260,345],[2350,415],[2200,450],[2030,420]]]},
  {id:'stormteeth',name:'Stormteeth',snow:false,parts:[[[3710,860],[4080,870],[4240,1030],[4130,1100],[3790,1040]]]},
  {id:'sunwall',name:'Sunwall',desert:true,parts:[[[3350,2220],[3890,2200],[4130,2300],[4050,2420],[3500,2380]]]},
].map(r=>Object.freeze({...r,parts:Object.freeze(r.parts.map(p=>Object.freeze(p.map(([x,y])=>Object.freeze(compactPoint({x,y}))))))})));
const polygons=WORLD_MOUNTAIN_RANGES.flatMap(r=>r.parts);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function inside(point,polygon){let sign=0;for(let i=0;i<polygon.length;i++){const n=cross(polygon[i],polygon[(i+1)%polygon.length],point);if(Math.abs(n)<1e-7)continue;if(sign && Math.sign(n)!==sign)return false;sign=Math.sign(n);}return true;}
export function worldBlocked(point){return polygons.some(p=>inside(point,p));}
export function worldSegmentClear(a,b){
 if(worldBlocked(a)||worldBlocked(b))return false;
 for(const p of polygons){
  let low=0,high=1;
  const orientation=Math.sign(p.reduce((n,q,i)=>n+q.x*p[(i+1)%p.length].y-q.y*p[(i+1)%p.length].x,0));
  for(let i=0;i<p.length;i++){
   const c=p[i],d=p[(i+1)%p.length],v=cross(c,d,a)*orientation,slope=(cross(c,d,b)-cross(c,d,a))*orientation;
   if(Math.abs(slope)<1e-9){if(v<0){low=2;break;}}
   else if(slope>0)low=Math.max(low,-v/slope);else high=Math.min(high,-v/slope);
  }
  if(low<=high+1e-9)return false;
 }
 return true;
}
export function nearestWorldPoint(point){
 if(!worldBlocked(point))return {x:point.x,y:point.y};
 const options=[];
 for(const p of polygons){if(!inside(point,p))continue;
  const center={x:p.reduce((v,q)=>v+q.x,0)/p.length,y:p.reduce((v,q)=>v+q.y,0)/p.length};
  for(let i=0;i<p.length;i++){
   const a=p[i],b=p[(i+1)%p.length],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));
   const edge={x:a.x+dx*t,y:a.y+dy*t},length=distance(edge,center);
   const q={x:edge.x+(edge.x-center.x)/length*10,y:edge.y+(edge.y-center.y)/length*10};
   if(!worldBlocked(q))options.push(q);
  }
 }
 return options.sort((a,b)=>distance(a,point)-distance(b,point)||a.x-b.x||a.y-b.y)[0]??null;
}
const vertices=polygons.flatMap(p=>{
 const center={x:p.reduce((v,q)=>v+q.x,0)/p.length,y:p.reduce((v,q)=>v+q.y,0)/p.length};
 return p.map(q=>{const n=distance(q,center);return {x:q.x+(q.x-center.x)/n*12,y:q.y+(q.y-center.y)/n*12};});
});
const graph=vertices.map((v,i)=>vertices.flatMap((w,j)=>i!==j&&worldSegmentClear(v,w)?[{index:j,cost:distance(v,w)}]:[]));
// Pure derived paths: changing destinations and imported saves need no stored waypoints.
export function worldRoute(from,to){
 if(!Number.isFinite(from.x)||!Number.isFinite(from.y)||!Number.isFinite(to.x)||!Number.isFinite(to.y)||worldBlocked(to))return null;
 if(worldBlocked(from)){const exit=nearestWorldPoint(from);const rest=exit&&worldRoute(exit,to);return rest?[exit,...rest]:null;}
 if(worldSegmentClear(from,to))return [{x:to.x,y:to.y}];
 const nodes=[...vertices,from,to],start=vertices.length,end=start+1,costs=new Map([[start,0]]),previous=new Map(),done=new Set();
 const edges=nodes.map((v,i)=>i<start?[...graph[i]]:[]);
 for(let i=0;i<end;i++)for(const j of [start,end])if(i!==j&&worldSegmentClear(nodes[i],nodes[j])){edges[i].push({index:j,cost:distance(nodes[i],nodes[j])});edges[j].push({index:i,cost:distance(nodes[i],nodes[j])});}
 while(!done.has(end)){
  const current=[...costs].filter(([i])=>!done.has(i)).sort((a,b)=>a[1]-b[1]||a[0]-b[0])[0];if(!current)return null;
  const [index,cost]=current;done.add(index);
  for(const e of edges[index])if(!done.has(e.index)&&cost+e.cost<(costs.get(e.index)??Infinity)){costs.set(e.index,cost+e.cost);previous.set(e.index,index);}
 }
 const path=[end];while(path[0]!==start)path.unshift(previous.get(path[0]));return path.slice(1).map(i=>({x:nodes[i].x,y:nodes[i].y}));
}
export function moveWorldToward(actor,target,budget){
 const route=worldRoute(actor,target);if(!route)return false;
 for(const next of route){const length=distance(actor,next);if(length<=budget){actor.x=next.x;actor.y=next.y;budget-=length;}else{actor.x+=(next.x-actor.x)*budget/length;actor.y+=(next.y-actor.y)*budget/length;return false;}}
 return true;
}
export function worldPointInBounds(p){return p.x>=WORLD_LIMITS.minX&&p.x<=WORLD_LIMITS.maxX&&p.y>=WORLD_LIMITS.minY&&p.y<=WORLD_LIMITS.maxY;}
