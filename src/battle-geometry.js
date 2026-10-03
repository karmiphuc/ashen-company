// BB terrain uses broad 180×100 hex tops; keep that shape at campaign scale.
export const BATTLE_PROJECTION = Object.freeze({width:76,height:44,stepX:76,stepY:33,stagger:38,elevation:12,padX:16,padY:88,padBottom:22});
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
    return [{edge:edge.id,drop,points:[edge.a,edge.b,[edge.b[0],edge.b[1]+rise],[edge.a[0],edge.a[1]+rise]]}];
  });
}
