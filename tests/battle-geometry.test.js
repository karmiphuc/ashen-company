import test from 'node:test';
import assert from 'node:assert/strict';
import {BATTLE_PROJECTION as grid, BATTLE_GROUND_SHEAR as shear, tilePosition, elevationFaces} from '../src/battle-geometry.js';

const vertices = [[38,0],[76,11],[76,33],[38,44],[0,33],[0,11]];
function corners(q,r) {
  const origin=tilePosition({q,r,height:0});
  return vertices.map(([x,y])=>[origin.x+x-shear*(y-grid.height/2),origin.y+y]);
}

test('near-rectangular projection preserves shared edges with all six axial neighbors',()=>{
  const center=corners(3,3);
  for(const [dq,dr] of [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]]) {
    const neighbor=corners(3+dq,3+dr);
    const shared=center.filter(([x,y])=>neighbor.some(([nx,ny])=>Math.abs(x-nx)<1e-8&&Math.abs(y-ny)<1e-8));
    assert.equal(shared.length,2,`neighbor ${dq},${dr} shares a complete edge`);
  }
  assert.equal(tilePosition({q:0,r:23,height:0}).x-tilePosition({q:0,r:0,height:0}).x,184);
});

test('sheared cliff tops match hex edges while elevation drops stay vertical',()=>{
  const tile={q:3,r:3,height:2};
  const faces=elevationFaces(tile,()=>({height:0}));
  for(const {points:[a,b,c,d]} of faces) {
    assert.equal(c[0],b[0]);assert.equal(d[0],a[0]);
    assert.equal(c[1]-b[1],24);assert.equal(d[1]-a[1],24);
    for(const [x,y] of [a,b])assert(vertices.some(([vx,vy])=>Math.abs(x-(vx-shear*(vy-grid.height/2)))<1e-8&&y===vy));
  }
});
