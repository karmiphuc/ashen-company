// Pure rendering plans. No campaign entities, route distances or saved fields are changed.
export function visualRandom(seed,key){let h=2166136261;for(const c of `${seed}:${key}`)h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return ((h^(h>>>16))>>>0)/4294967296;}
export const REGION_STYLE=Object.freeze({
 'western-marches':{density:.22,detail:'furrows',color:'#a6a065'},
 'northern-highlands':{density:.58,detail:'snowdrift',color:'#b1c4c8'},
 greenwood:{density:.82,detail:'deadwood',color:'#567b50'},
 'eastern-frontier':{density:.36,detail:'stones',color:'#b39a77'},
 'far-steppe':{density:.12,detail:'scrub',color:'#c4b57c'},
 'southern-marches':{density:.27,detail:'furrows',color:'#9ca873'},
 'blackwater-basin':{density:.7,detail:'reeds',color:'#657e70'},
 'saffron-coast':{density:.23,detail:'scrub',color:'#cbbd91'},
 sunlands:{density:.16,detail:'stones',color:'#c7a36c'},
});
export function terrainStamp(seed,row,column,x,y,terrain,neighbor,region){
 const r=n=>visualRandom(seed,`terrain:${row}:${column}:${n}`),mass=['forest','mountain','marsh'].includes(terrain);
 const family=neighbor!==terrain&&r(2)<.22?neighbor:terrain;
 return {x:x+(r(0)*2-1)*18,y:y+(r(1)*2-1)*10,width:(mass?235:195)+r(3)*(mass?85:40),variant:r(4),family};
}
export function roadCurve(seed,road){const [a,b]=road.points,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);const bend=(visualRandom(seed,`road:${road.id}`)*2-1)*Math.min(12,length*.04);return {x:(a.x+b.x)/2-(length?dy/length:0)*bend,y:(a.y+b.y)/2+(length?dx/length:0)*bend};}
export function settlementProfile(town){return town.kind==='castle'?{width:144,radius:73,yards:3,military:true}:town.kind==='village'?{width:98,radius:51,yards:2,military:false}:town.major?{width:150,radius:79,yards:7,military:false}:{width:122,radius:64,yards:4,military:false};}
export function settlementGround(seed,town){const profile=settlementProfile(town);return {...profile,points:Array.from({length:14},(_,i)=>{const angle=i*Math.PI/7,r=profile.radius*(.78+visualRandom(seed,`${town.id}:ground:${i}`)*.22);return {x:town.x+Math.cos(angle)*r,y:town.y+Math.sin(angle)*r*.42};})};}
export function overviewBorderAlpha(zoom){return Math.max(0,Math.min(.18,(.65-zoom)*.4));}
export function showActorLabel(zoom,selected,danger=false){return zoom>=.65||selected||danger;}
export function movementPose(previous,current,destination=null){const dx=previous?current.x-previous.x:0,dy=previous?current.y-previous.y:0,moving=Math.hypot(dx,dy)>.01;const facing=moving?dx:destination?destination.x-current.x:0;return {moving,flip:Math.abs(facing)>.01?facing<0:previous?.flip??false,dx,dy};}
