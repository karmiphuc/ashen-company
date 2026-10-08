import { WORLD_LIMITS } from './geography.js';

// Wide daylight scouting radius; exploration is saved independently of the debug toggle.
export const WORLD_VIEW_RADIUS = 560;
export const FOG_CELL_SIZE = 40;
export const FOG_COLUMNS = Math.ceil((WORLD_LIMITS.maxX-WORLD_LIMITS.minX)/FOG_CELL_SIZE);
export const FOG_ROWS = Math.ceil((WORLD_LIMITS.maxY-WORLD_LIMITS.minY)/FOG_CELL_SIZE);
export const FOG_CELL_COUNT = FOG_COLUMNS*FOG_ROWS;
const KEY = 'ashen-company-world-fog-v1';
let enabled = true;
try { enabled = globalThis.localStorage?.getItem(KEY) !== 'off'; } catch {}
export function isWorldFogEnabled() { return enabled; }
export function setWorldFogEnabled(value) {
  enabled = !!value;
  try { globalThis.localStorage?.setItem(KEY,enabled?'on':'off'); } catch {}
}
export function validExploration(value) {
  return typeof value==='string' && value.length===FOG_CELL_COUNT && /^[01]+$/.test(value);
}
export function fogCell(point) {
  const x=Math.floor((point.x-WORLD_LIMITS.minX)/FOG_CELL_SIZE),y=Math.floor((point.y-WORLD_LIMITS.minY)/FOG_CELL_SIZE);
  return x<0||y<0||x>=FOG_COLUMNS||y>=FOG_ROWS ? -1 : y*FOG_COLUMNS+x;
}
export function revealWorld(state, settlements=[]) {
  const initial=state.worldExploration===undefined;
  const cells=(state.worldExploration??'0'.repeat(FOG_CELL_COUNT)).split('');
  const reveal=(point,radius)=>{
    const left=Math.max(0,Math.floor((point.x-radius-WORLD_LIMITS.minX)/FOG_CELL_SIZE));
    const right=Math.min(FOG_COLUMNS-1,Math.floor((point.x+radius-WORLD_LIMITS.minX)/FOG_CELL_SIZE));
    const top=Math.max(0,Math.floor((point.y-radius-WORLD_LIMITS.minY)/FOG_CELL_SIZE));
    const bottom=Math.min(FOG_ROWS-1,Math.floor((point.y+radius-WORLD_LIMITS.minY)/FOG_CELL_SIZE));
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
      const px=WORLD_LIMITS.minX+(x+.5)*FOG_CELL_SIZE,py=WORLD_LIMITS.minY+(y+.5)*FOG_CELL_SIZE;
      if(Math.hypot(px-point.x,py-point.y)<=radius)cells[y*FOG_COLUMNS+x]='1';
    }
  };
  // Older campaigns remember visited settlements, without revealing their connecting roads.
  if(initial)for(const town of settlements)if(state.visited?.includes(town.id))reveal(town,180);
  reveal(state.position,WORLD_VIEW_RADIUS);
  state.worldExploration=cells.join('');
}
export function worldPointVisible(state,point) {
  return !enabled || Math.hypot(point.x-state.position.x,point.y-state.position.y)<=WORLD_VIEW_RADIUS-60;
}
export function worldPointExplored(state,point) {
  return worldPointVisible(state,point) || state.worldExploration?.[fogCell(point)]==='1';
}
