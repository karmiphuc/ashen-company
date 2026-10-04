import { compactPoint, regionAt, distanceToRoad } from './geography.js';
import { visualRandom } from './map-illustration.js';
import { worldBlocked, worldPointInBounds } from './world-navigation.js';

// Scene units are world pixels: enlarging a place never enlarges its casualties
// or supplies. Upright architecture stays upright; only ground debris rotates.
const prop=(art,x,y,width,options={})=>Object.freeze({art,x,y,width,anchor:.88,...options});
const b=(art,x,y,width=13,options={})=>prop('battlefield_'+art,x,y,width,options);
const s=(art,x,y,width,options={})=>prop('scene_'+art,x,y,width,options);
const ground=(art,x,y,width,rotation=0)=>s('ground_'+art,x,y,width,{anchor:.5,layer:'ground',rotation});
const tight=parts=>parts.map(p=>Object.freeze({...p,x:p.x*.7,y:p.y*.7,width:/corpse_|bones|skeleton/.test(p.art)?p.width:p.width*.7}));
const plan=(...parts)=>Object.freeze(parts.sort((a,b)=>(a.layer==='ground'?-1000:a.y)-(b.layer==='ground'?-1000:b.y)));
const bodies=(arts,points)=>points.map(([x,y,rotation=0],i)=>b(arts[i%arts.length],x,y,13,{rotation,anchor:.5}));
const graves=Array.from({length:10},(_,i)=>{const angle=Math.PI+(i+.4)*Math.PI/10;return s('gravestone',Math.cos(angle)*67,Math.sin(angle)*34-18,10+(i%3),{flip:i%3===0});});
export const REGIONAL_SCENE_LAYOUTS=Object.freeze({
 'bloodied-oasis':plan(
  ground('stone',-10,-2,155,-.1),ground('ash',27,24,54),
  s('dead_palm',-65,-17,37),s('dead_palm',-27,-44,31),s('dead_palm',52,-26,35),s('dead_palm',74,2,28),
  s('ruin_wall',-12,-25,92),s('well',-12,4,49),
  ...bodies(['corpse_blue_back','corpse_red_back','corpse_blue_side'],[[-43,22,-.2],[9,25,.3],[-23,43,-.35]]),
  b('fallen_armored_horse',45,35,29,{anchor:.5}),b('discarded_weapons',-9,26,12),b('loose_sword',11,41,7,{rotation:.6,anchor:.5})),
 'caravan-massacre':plan(
  ground('stone',14,-12,97),ground('ash',-27,-7,93),ground('mud',18,26,112,-.3),
  s('ruin_wall',34,-24,68),b('wagon_wreck',-30,0,43),b('supply_wagon',32,22,42,{flip:true}),
  b('ash_heap',-29,9,22),b('wheel',-53,20,10),
  ...[[-1,18],[7,24],[19,35],[46,36],[54,27],[42,42]].map(([x,y],i)=>b(i%3?'crate':'crates',x,y,8+i%3)),
  ...bodies(['skeleton','skeleton_curled','bones_scattered'],[[-39,28,-.3],[8,42,.2],[52,47,-.3],[-4,-15,.1]]),b('discarded_weapons',-17,37,11)),
 'shattered-sanctuary':plan(...tight([
  ground('frost',0,-7,215),ground('stone',9,7,153,.1),
  s('frost_ruin',-42,-10,69),s('sanctuary',23,8,104),s('ruin_wall',54,-15,51),
  s('angel',-15,20,19),s('angel',53,27,20,{flip:true}),
  s('gravestone',-67,11,12),s('gravestone',-62,26,11),
  ...[[-2,33],[25,37],[53,40],[-27,24],[68,29]].map(([x,y])=>b('stone_pile',x,y,12)),
  b('timbers',4,47,16),b('broken_barricade',33,47,23),b('skeleton_curled',-42,33,13,{anchor:.5})])),
 'frozen-skirmish':plan(...tight([
  ground('frost',0,6,214),ground('ash',-24,-9,69),
  b('tent_side',-39,-12,43),b('tent_front',-4,-26,33),b('firepit',-18,10,13),
  b('broken_barricade',37,17,35),b('banner_blue',41,19,13,{rotation:.45,anchor:.5}),b('timbers',56,25,15),
  ...bodies(['corpse_green_back','corpse_blue_back','corpse_blue_side','corpse_green_side'],[[-36,24,-.3],[-15,31,.15],[5,35,-.25],[25,39,.2],[48,35,-.1],[56,7,.35],[22,-3,-.3],[64,18,.1]]),
  b('fallen_horse',-51,43,27,{anchor:.5}),b('fallen_armored_horse',66,42,29,{anchor:.5}),b('loose_axe',34,25,6,{rotation:.7,anchor:.5})])),
 'overgrown-chapel':plan(
  ground('moss',0,0,217),ground('stone',2,15,101),
  prop('world_detail_forest_green_01',-72,-30,64),prop('world_detail_forest_green_03',72,-27,62),
  prop('world_detail_forest_green_02',-29,-54,44),prop('world_detail_forest_green_04',29,-52,43),
  ...graves,s('ruin_wall',-45,-6,39),s('chapel',-5,17,75),s('sanctuary',11,27,64),s('ruin_tower',29,0,30),
  s('gravestone',-58,21,11),s('gravestone',54,23,12),b('stone_pile',-32,29,13),b('bones_scattered',37,38,13,{anchor:.5}),
  // Local forest sprites share depth order so foliage overlaps wall feet, not
  // an indiscriminate green overlay hiding the entire building.
  prop('world_detail_forest_green_02',-53,-36,56),prop('world_detail_forest_green_04',53,-25,53),
  prop('world_detail_forest_green_01',-44,23,27),prop('world_detail_forest_green_03',45,30,25)),
 'ambushed-supply-train':plan(
  ground('mud',0,12,214,.28),ground('ash',38,-1,65),
  b('supply_wagon',-38,6,44),b('wagon_wreck',38,22,43,{flip:true}),b('wheel',53,35,10),b('burnt_logs',34,20,15),
  ...[[-45,26],[-27,22],[-16,29],[-9,33],[1,36],[10,30],[19,40],[29,39],[40,43],[53,49]].map(([x,y],i)=>b('crate',x,y,8+i%3)),
  ...bodies(['corpse_guard','corpse_mail_back','corpse_blue_side','corpse_mail_side','corpse_blue_back'],[[-53,17,-.2],[-17,12,.1],[31,30,.2],[56,21,-.15],[5,44,.35]]),
  b('discarded_weapons',11,23,12),b('loose_sword',-4,37,6,{rotation:.5,anchor:.5})),
 'burned-farming-village':plan(
  ground('ash',-36,-12,110),ground('ash',35,-11,91),ground('ash',-15,37,85),ground('mud',20,32,93,.2),
  s('charred_frame',-43,-14,60),s('ruin_house',32,-3,51),s('ruin_farm',-14,39,52),
  b('broken_barricade',52,30,27),b('timbers',60,42,16),b('wagon_wreck',23,39,28),b('wheel',32,52,9),
  b('ash_heap',-35,7,18),b('burnt_logs',43,5,16),b('loose_axe',8,28,7,{rotation:.2,anchor:.5}),b('discarded_weapons',-34,45,10),
  ...bodies(['corpse_levy'],[[-51,22,-.3],[2,51,.2]])),
 'knights-last-stand':plan(
  ground('stone',0,9,145),ground('ash',52,26,55),s('statue',-5,0,33),
  b('banner_red',-52,4,18,{rotation:-.35}),b('banner_blue',51,17,18,{rotation:.4}),b('broken_barricade',-30,23,28),
  ...bodies(['corpse_mail_back','corpse_mail_side','corpse_guard','corpse_mail','corpse_red_side','corpse_blue_back'],[[-40,-14,-.15],[-59,0,.3],[-61,19,-.25],[-52,39,.2],[-29,48,-.2],[-4,49,.1],[18,45,-.25],[40,39,.2],[60,15,-.2],[46,-4,.15],[23,-18,-.25],[-4,-23,.3]]),
  b('fallen_armored_horse',65,38,29,{anchor:.5}),b('fallen_horse',31,57,29,{anchor:.5}),b('discarded_weapons',15,28,13),b('loose_sword',45,24,6,{rotation:.6,anchor:.5})),
});
const site=(id,name,x,y,width,region,smoke=null)=>Object.freeze({id,name,...compactPoint({x,y}),width,region,kind:'scene',smoke:smoke&&Object.freeze(smoke)});
// Geographic anchors supersede approximate percentage coordinates. Northern
// scenes must be north of y=360, not in the temperate Eastern Frontier.
export const REGIONAL_STORY_SITES=Object.freeze([
 site('bloodied-oasis','The Bloodied Oasis',3200,2660,215,'sunlands'),
 site('caravan-massacre','Forgotten Caravan Massacre',3820,1570,215,'sunlands'),
 site('shattered-sanctuary','The Shattered Sanctuary Pass',1830,285,160,'northern-highlands'),
 site('frozen-skirmish','Frozen Skirmish Site',1190,230,160,'northern-highlands'),
 site('overgrown-chapel','The Overgrown Chapel & Graveyard',1900,900,225,'greenwood'),
 site('ambushed-supply-train','The Ambushed Supply Train',2100,1280,225,'blackwater-basin',{x:34,y:20}),
 site('burned-farming-village','Burned Farming Village',940,450,225,'western-marches',{x:-35,y:7}),
 site('knights-last-stand',"The Knight’s Last Stand",980,1330,225,'southern-marches'),
]);
export const REGIONAL_SCENE_ASSETS=Object.freeze([...new Set(Object.values(REGIONAL_SCENE_LAYOUTS).flatMap(parts=>parts.map(p=>p.art)))].filter(n=>n.startsWith('scene_')||/^battlefield_(corpse_.+_(back|side)|corpse_(levy|guard)|skeleton_curled|bones_scattered|loose_(sword|axe)|ash_heap)$/.test(n)));
export function sceneFootprintContains(scene,p,pad=0){return Math.hypot((p.x-scene.x)/(scene.width*.52+pad),(p.y-scene.y)/(scene.width*.42+pad))<1;}
export function regionalSceneFits(scene,{settlements=[],camps=[],roads=[],reserved=[]}={}){
 const radius=scene.width*.45;
 // Check the full envelope against region edges and blocked peaks, not merely
 // the origin; decoration never consumes roads, town service yards or caves.
 for(let i=0;i<12;i++){const a=i*Math.PI/6,p={x:scene.x+Math.cos(a)*radius,y:scene.y+Math.sin(a)*radius*.8};
  if(!worldPointInBounds(p)||worldBlocked(p)||regionAt(p.x,p.y).id!==scene.region)return false;}
 return !worldBlocked(scene)&&!settlements.some(t=>Math.hypot(t.x-scene.x,t.y-scene.y)<radius+75)
  &&!camps.some(t=>Math.hypot(t.x-scene.x,t.y-scene.y)<radius+45)
  &&distanceToRoad(scene.x,scene.y,roads)>=scene.width*.24+22
  &&!reserved.some(t=>Math.hypot(t.x-scene.x,t.y-scene.y)<radius+t.width*.45+12);
}
export function regionalStoryScenes(seed,args={}){
 const result=[];
 for(const site of REGIONAL_STORY_SITES){
  const candidates=[{x:site.x,y:site.y}];
  const start=visualRandom(seed,site.id+':placement')*Math.PI*2;
  for(const radius of [35,70,105,140,180,225])for(let i=0;i<16;i++){const a=start+i*Math.PI/8;candidates.push({x:site.x+Math.cos(a)*radius,y:site.y+Math.sin(a)*radius});}
  const chosen=candidates.find(p=>regionalSceneFits({...site,...p},{...args,reserved:[...(args.reserved??[]),...result]}));
  if(chosen)result.push({...site,...chosen});
 }
 return result;
}
export function drawRegionalScene(c,scene,sprite){
 for(const p of REGIONAL_SCENE_LAYOUTS[scene.id]??[]){
  const x=scene.x+p.x,y=scene.y+p.y;
  if(p.rotation){c.save();c.translate(x,y);c.rotate(p.rotation);sprite(c,p.art,0,0,p.width,p.anchor,p.flip);c.restore();}
  else sprite(c,p.art,x,y,p.width,p.anchor,p.flip);
 }
 if(scene.smoke)for(let i=0;i<4;i++){
  const x=scene.x+scene.smoke.x+i*2,y=scene.y+scene.smoke.y-8-i*7,r=4+i*2,g=c.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,'#35312c35');g.addColorStop(1,'#35312c00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
 }
}
