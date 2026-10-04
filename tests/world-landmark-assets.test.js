import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { WORLD_LANDMARK_ASSETS, drawWorldLandmark, drawMountainRanges, worldLandmarks, SCENERY_LAYOUTS } from '../src/world-landmarks.js';
import { listOfflineAssets } from '../tools/build-cache.mjs';

test('every landmark sprite has intact licensed provenance, PNG dimensions, and offline coverage', async()=>{
 const {assets}=JSON.parse(await readFile(new URL('../assets/world/landmark-sources.json',import.meta.url),'utf8'));
 const offline=new Set(await listOfflineAssets());
 assert.equal(new Set(assets.map(a=>a.file)).size,assets.length);
 assert.ok(assets.every(a=>a.author!=='Cethiel'));
 for(const name of ['temple','temple_sand','ruin_arch','ruin_arch_sand','ruin_wall','ruin_wall_sand','rubble']){
  assert.ok(!offline.has('./assets/world/landmark_'+name+'.png'));
  assert.ok(!WORLD_LANDMARK_ASSETS.includes('landmark_'+name));
 }
 assert.equal(assets.filter(a=>a.sourceType==='user-provided').length,26);

 assert.deepEqual(new Set(assets.map(a=>a.file.split('/').at(-1).replace('.png',''))),new Set(WORLD_LANDMARK_ASSETS));
 for(const a of assets){
  assert.ok(a.author&&a.original&&a.changes);
  if(a.sourceType==='user-provided'){
   assert.match(a.source,/Pasted battlefield sheet/);assert.equal(a.license,'User-provided artwork authorized for this project');
   assert.equal(a.preparedSheetSha256.length,64);assert.equal(a.crop.length,4);assert.ok(a.width<=128&&a.height<=128);
  }else{
   assert.match(a.source,/^https:\/\/(opengameart.org|github.com)\//);
  assert.match(a.license,/^https:\/\/creativecommons.org\/(licenses\/by(?:-sa)?\/3.0|publicdomain\/zero\/1.0)\/$/);
  }
  const png=await readFile(new URL('../'+a.file,import.meta.url));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),a.width);assert.equal(png.readUInt32BE(20),a.height);assert.equal(png[25],6,'transparent RGBA sprite');
  assert.equal(png.length,a.bytes);assert.equal(createHash('sha256').update(png).digest('hex'),a.sha256);
  assert.ok(offline.has('./'+a.file));
 }
});

test('all landmark kinds and ridge palettes draw imported art with no geometric fallback',()=>{
 const drawn=[];
 const sprite=(c,name,x,y,width,anchor)=>{assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&width>0&&anchor>0);drawn.push(name);};
 // The mock intentionally has no paths/polygons: an accidental geometric-art
 // fallback cannot satisfy this rendering contract.
 const ctx={save(){},restore(){},translate(){},rotate(){},fillRect(){},createRadialGradient(){return{addColorStop(){}};}};
 for(const o of worldLandmarks(7192))drawWorldLandmark(ctx,o,7192,sprite);
 drawMountainRanges(ctx,7192,sprite);
 assert.ok(drawn.length>30);
 assert.ok(drawn.every(n=>WORLD_LANDMARK_ASSETS.includes(n)||['arms_cart','world_detail_forest_green_04','world_detail_forest_green_02'].includes(n)));
 for(const name of ['pyramid','sphinx','tower','cave_forest','cave_mountain','cave_desert'])assert.ok(drawn.includes('landmark_'+name));
 for(const kind of ['green','snow','desert'])assert.ok(drawn.some(n=>n.startsWith('landmark_mountain_'+kind+'_')));
});


test('authored scenes use the whole supplied prop selection and retain small human remains',()=>{
 const used=new Set(),signatures=new Set();
 for(const [id,parts]of Object.entries(SCENERY_LAYOUTS)){
  signatures.add(JSON.stringify(parts));
  for(const p of parts){
   used.add(p.art);
   if(/corpse_|bones$|skeleton$/.test(p.art))assert.ok(p.scale>=.165&&p.scale<=.18,'remains stay half their former scale in every scene');
   assert.ok(Math.abs(p.x)+p.scale*.5<=.58,'props stay within the authored site footprint');
  }
 }
 assert.equal(signatures.size,Object.keys(SCENERY_LAYOUTS).length,'each site has its own arrangement');
 assert.equal(used.size,26,'all imported user tiles are used');
 for(const prefix of ['tent_','banner_','corpse_','fallen_'])assert.ok([...used].filter(n=>n.startsWith('battlefield_'+prefix)).length>=2);
});
