// Camera state belongs to the view, never the combat save or simulation.
let zoom = 1, surface = null, listeners = null, overview = false, observer = null;
const clamp = value => Math.max(.15, Math.min(1.75, value));
export function resetBattleCamera() { zoom = 1; overview = false; }
function paint() {
  const field = surface?.querySelector('.battlefield'), space = surface?.querySelector('.battle-camera-space');
  if (!field || !space) return;
  surface.classList.toggle('battle-overview',overview);
  space.style.width = `${field.offsetWidth * zoom}px`;
  space.style.height = `${field.offsetHeight * zoom}px`;
  field.style.transform = `scale(${zoom})`;
  const button = document.querySelector('[data-battle-zoom="reset"]');
  if (button) button.textContent = `${Math.round(zoom * 100)}%`;
  for (const [direction, disabled] of [['out',zoom<=.15],['in',zoom>=1.75]]) {
    const control = document.querySelector(`[data-battle-zoom="${direction}"]`);
    if (control) control.disabled = disabled;
  }
}
export function fitBattleCamera() {
  const field=surface?.querySelector('.battlefield');if(!field||!surface.isConnected||!field.offsetWidth||!field.offsetHeight)return;
  const style=getComputedStyle(surface),width=surface.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=surface.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-(surface.querySelector('.battle-terrain-key')?.offsetHeight??0);
  zoom=Math.min(1,width/field.offsetWidth,height/field.offsetHeight);overview=true;paint();surface.scrollLeft=0;surface.scrollTop=0;
}
function scaleTo(value, x, y) {
  if (!surface) return;
  const space = surface.querySelector('.battle-camera-space');
  const rect = space.getBoundingClientRect();
  const point = {x:(x-rect.left)/zoom, y:(y-rect.top)/zoom};
  overview=false;zoom = clamp(value); paint();
  const updated = space.getBoundingClientRect();
  surface.scrollLeft += updated.left + point.x*zoom - x;
  surface.scrollTop += updated.top + point.y*zoom - y;
}
export function zoomBattleCamera(direction) {
  if (!surface) return;
  if(direction==='fit'){fitBattleCamera();return;}
  const rect = surface.getBoundingClientRect();
  scaleTo(direction==='reset'?1:zoom*(direction==='in'?1.2:1/1.2),rect.left+surface.clientWidth/2,rect.top+surface.clientHeight/2);
}
export function bindBattleCamera(nextSurface) {
  listeners?.abort(); listeners = new AbortController(); surface = nextSurface; observer?.disconnect();paint();
  observer=new ResizeObserver(()=>{if(overview)fitBattleCamera();});observer.observe(surface);
  const pointers = new Map(); let previous = null, moved = false;
  const geometry = () => {
    const points = [...pointers.values()];
    return {x:points.reduce((s,p)=>s+p.x,0)/points.length,y:points.reduce((s,p)=>s+p.y,0)/points.length,
      distance:points.length===2?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0};
  };
  const options = {signal:listeners.signal};
  surface.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch'||event.target.closest('summary,a,input,select,button:not(.battle-hex)'))return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});event.target.setPointerCapture(event.pointerId);previous=geometry();moved=false;
  },options);
  surface.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const current=geometry();
    const dx=current.x-previous.x,dy=current.y-previous.y;
    if(Math.abs(dx)+Math.abs(dy)>2||current.distance!==previous.distance)moved=true;
    overview=false;surface.scrollLeft-=dx;surface.scrollTop-=dy;
    if(previous.distance>0&&current.distance>0)scaleTo(zoom*current.distance/previous.distance,current.x,current.y);
    previous=current;
  },options);
  const release=event=>{pointers.delete(event.pointerId);previous=pointers.size?geometry():null;};
  surface.addEventListener('pointerup',release,options);surface.addEventListener('pointercancel',release,options);
  surface.addEventListener('lostpointercapture',release,options);
  surface.addEventListener('click',event=>{if(moved){event.preventDefault();event.stopPropagation();moved=false;}},{...options,capture:true});
}
