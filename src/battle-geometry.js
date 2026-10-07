// A near-rectangular view of the axial board. Shear only the ground plane;
// pawns and elevation drops stay upright. Adjacent hex edges still coincide.
export const BATTLE_PROJECTION = Object.freeze({width:76,height:44,stepX:76,stepY:33,stagger:8,elevation:12,padX:16,padY:88,padBottom:22});
export const BATTLE_GROUND_SHEAR = (BATTLE_PROJECTION.width / 2 - BATTLE_PROJECTION.stagger) / BATTLE_PROJECTION.stepY;
export function tilePosition(tile, grid=BATTLE_PROJECTION) {
  return {x:grid.padX+tile.q*grid.stepX+tile.r*grid.stagger,y:grid.padY+tile.r*grid.stepY-tile.height*grid.elevation};
}
/** Only forward-facing exposed drops have visible vertical faces. */
export function elevationFaces(tile, tileAt, grid=BATTLE_PROJECTION) {
  const edges=[{id:'SE',dq:0,dr:1,a:[grid.width,grid.height*.75],b:[grid.width/2,grid.height]},
    {id:'SW',dq:-1,dr:1,a:[grid.width/2,grid.height],b:[0,grid.height*.75]}];
  return edges.flatMap(edge=>{
    const neighbor=tileAt(tile.q+edge.dq,tile.r+edge.dr);
    const drop=tile.height-(neighbor?.height??0);
    if(drop<=0)return [];
    const rise=drop*grid.elevation;
    const shear=(grid.width/2-grid.stagger)/grid.stepY;
    const a=[edge.a[0]-shear*(edge.a[1]-grid.height/2),edge.a[1]];
    const b=[edge.b[0]-shear*(edge.b[1]-grid.height/2),edge.b[1]];
    return [{edge:edge.id,drop,points:[a,b,[b[0],b[1]+rise],[a[0],a[1]+rise]]}];
  });
}
