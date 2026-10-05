// Camera state belongs to the view, never the combat save or simulation.
let zoom = 1, surface = null, listeners = null;
const clamp = value => Math.max(.5, Math.min(1.75, value));
export function resetBattleCamera() { zoom = 1; }
function paint() {
  const field = surface?.querySelector('.battlefield'), space = surface?.querySelector('.battle-camera-space');
  if (!field || !space) return;
  space.style.width = `${field.offsetWidth * zoom}px`;
  space.style.height = `${field.offsetHeight * zoom}px`;
  field.style.transform = `scale(${zoom})`;
  const button = document.querySelector('[data-battle-zoom="reset"]');
  if (button) button.textContent = `${Math.round(zoom * 100)}%`;
  for (const [direction, disabled] of [['out',zoom<=.5],['in',zoom>=1.75]]) {
    const control = document.querySelector(`[data-battle-zoom="${direction}"]`);
    if (control) control.disabled = disabled;
  }
}
function scaleTo(value, x, y) {
  if (!surface) return;
  const space = surface.querySelector('.battle-camera-space');
  const rect = space.getBoundingClientRect();
  const point = {x:(x-rect.left)/zoom, y:(y-rect.top)/zoom};
  zoom = clamp(value); paint();
  const updated = space.getBoundingClientRect();
  surface.scrollLeft += updated.left + point.x*zoom - x;
  surface.scrollTop += updated.top + point.y*zoom - y;
}
export function zoomBattleCamera(direction) {
  if (!surface) return;
  const rect = surface.getBoundingClientRect();
  scaleTo(direction==='reset'?1:zoom*(direction==='in'?1.2:1/1.2),rect.left+surface.clientWidth/2,rect.top+surface.clientHeight/2);
}
export function bindBattleCamera(nextSurface) {
  listeners?.abort(); listeners = new AbortController(); surface = nextSurface; paint();
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
    surface.scrollLeft-=dx;surface.scrollTop-=dy;
    if(previous.distance>0&&current.distance>0)scaleTo(zoom*current.distance/previous.distance,current.x,current.y);
    previous=current;
  },options);
  const release=event=>{pointers.delete(event.pointerId);previous=pointers.size?geometry():null;};
  surface.addEventListener('pointerup',release,options);surface.addEventListener('pointercancel',release,options);
  surface.addEventListener('lostpointercapture',release,options);
  surface.addEventListener('click',event=>{if(moved){event.preventDefault();event.stopPropagation();moved=false;}},{...options,capture:true});
}
