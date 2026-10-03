import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {NAMED_WEAPON_ART} from '../src/named-weapon-art.js';
import {ITEMS, getItem} from '../src/engine.js';
import {portraitHTML, portraitWeaponAnchor} from '../src/portraits.js';

const person = {name:'Rest pose', seed:42};
const weapons = ITEMS.filter(item=>item.slot==='weapon');
const shields = ITEMS.filter(item=>item.slot==='shield');
const mounts = ITEMS.filter(item=>item.slot==='mount');
const tag = (html, name)=>html.match(new RegExp(`<img data-layer="${name}"[^>]+>`))?.[0];
const value = (text, key)=>Number(text.match(new RegExp(`${key}:([\\d.eE+-]+)px`))[1]);
function pose(html, name) {
  const image=tag(html,name),origin=image.match(/transform-origin:([\d.-]+)px ([\d.-]+)px/);
  return {image,x:value(image,'left'),y:value(image,'top'),gx:Number(origin?.[1]??0),gy:Number(origin?.[2]??0)};
}
function frame(html) {
  const style=html.match(/bb-portrait-composition" style="([^"]+)"/)[1];
  return {x:value(style,'left'),y:value(style,'top'),scale:Number(style.match(/transform:scale\(([\d.]+)\)/)?.[1]??1)};
}
function pngSize(image) {
  const src=image.match(/src="([^"]+)"/)[1];
  const bytes=src.startsWith('data:')?Buffer.from(src.split(',')[1],'base64'):readFileSync(new URL('../'+src,import.meta.url));
  return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
}
function transformedPoint(image,x,y) {
  const [gx,gy]=image.match(/transform-origin:([\d.-]+)px ([\d.-]+)px/).slice(1).map(Number);
  const transform=image.match(/transform:([^;]+)/)[1];
  const point=[x-gx,y-gy];
  for(const [,kind,args] of [...transform.matchAll(/(scaleX|scale|rotate)\(([^)]+)\)/g)].reverse()){
    if(kind==='rotate'){
      const angle=Number(args.replace('deg',''))*Math.PI/180,[px,py]=point;
      point[0]=px*Math.cos(angle)-py*Math.sin(angle);point[1]=px*Math.sin(angle)+py*Math.cos(angle);
    }else if(kind==='scaleX')point[0]*=Number(args);
    else {point[0]*=Number(args);point[1]*=Number(args);}
  }
  return [gx+point[0],gy+point[1]];
}

test('every shield and one-handed family share the right hand while the center chest stays clear',()=>{
  for(const weapon of weapons.filter(w=>!w.twoHanded))for(const shield of shields){
    for(const item of [weapon,getItem(`famed:${weapon.id}:73`),{visual:weapon.visual,id:weapon.id}]){
      const html=portraitHTML(person,{weapon:item,shield}),w=pose(html,'weapon'),s=pose(html,'shield');
      assert.equal(w.x+w.gx,74,weapon.id);if(NAMED_WEAPON_ART[weapon.id])assert.ok(w.y+w.gy<=111,weapon.id);else assert.equal(w.y+w.gy,111,weapon.id);
      const scale=[...s.image.match(/transform:([^;]+)/)[1].matchAll(/scale\(([\d.]+)\)/g)].reduce((n,m)=>n*Number(m[1]),1);
      const right=s.x+pngSize(s.image)[0]*scale;
      assert.ok(s.x>=60,`${shield.id}: center chest x=38..60 remains visible`);
      assert.ok(s.x<=82 && right>=82,`${shield.id}: weapon and shield share the hand`);
      const f=frame(html);assert.ok(f.x+right*f.scale<=104+1e-8,`${shield.id}: right edge is framed`);
      assert.match(w.image,/z-index:7/);assert.match(s.image,/z-index:6/);
    }
  }
});

test('one-handed melee weapons keep a 30-degree facing tilt at the hand anchor',()=>{
  for(const weapon of weapons.filter(w=>!w.twoHanded&&!w.ranged))for(const mount of [null,...mounts]){
    const html=portraitHTML(person,{weapon,mount}),w=pose(html,'weapon');
    const source=NAMED_WEAPON_ART[weapon.id];
    if(source){const [tx,ty]=transformedPoint(w.image,...source.tip),[gx,gy]=transformedPoint(w.image,...source.grip);const tilt=Math.atan2(tx-gx,gy-ty)*180/Math.PI;assert.ok(Math.abs(tilt-30)<.001,`${weapon.id}: native shaft leans 30 degrees`);}
    else assert.match(w.image,/transform:scaleX\(-1\) rotate\(-30deg\)/,weapon.id);
    assert.equal(w.x+w.gx,mount?82:74,`${weapon.id}: tilt pivots around the right-hand grip`);
    if(source)assert.ok(w.y+w.gy<=111+(mount?36:0),`${weapon.id}: grip keeps the enlarged butt above the base`);else assert.equal(w.y+w.gy,111+(mount?36:0),`${weapon.id}: tilt preserves the grip height and mounted offset`);
  }
});

test('tilted sword, mace, spear, axe and cleaver art fits the frame at every mount height',()=>{
  for(const id of ['arming-sword','bludgeon','spear','wood-axe','military-cleaver'])for(const mount of [null,...mounts]){
    const weapon=getItem(id),html=portraitHTML(person,{weapon,mount}),w=pose(html,'weapon'),f=frame(html),[width,height]=pngSize(w.image);
    for(const x of [0,width])for(const y of [0,height]){
      const [wx,wy]=transformedPoint(w.image,x,y);
      const px=f.x+(w.x+wx)*f.scale,py=f.y+(w.y+wy)*f.scale;
      assert.ok(px>=-1e-8&&px<=104+1e-8&&py>=-1e-8&&py<=142+1e-8,`${id}${mount?` on ${mount.id}`:''}: art corner fits (${px},${py})`);
    }
  }
});

test('mace shaft tilts about 30 degrees from upright toward the enemy',()=>{
  const w=pose(portraitHTML(person,{weapon:getItem('bludgeon')}),'weapon');
  const [tipX,tipY]=transformedPoint(w.image,39,9),[gripX,gripY]=transformedPoint(w.image,8,57);
  assert.ok(tipX>gripX&&tipY<gripY,'the mace head leans up and toward friendly-right');
  const tiltFromVertical=Math.atan2(tipX-gripX,gripY-tipY)*180/Math.PI;
  assert.ok(25<=tiltFromVertical&&tiltFromVertical<=35,`shaft tilt is ${tiltFromVertical} degrees`);
  // Battle enemies mirror the whole portrait, so the same pose leans left toward them.
});

test('every two-handed melee family stays in proportion to the pawn and fits, including named mounted variants',()=>{
  for(const weapon of weapons.filter(w=>w.twoHanded&&!w.ranged))for(const mount of [null,...mounts]){
    for(const item of [weapon,getItem(`famed:${weapon.id}:73`),{id:weapon.id,visual:weapon.visual}]){
      const html=portraitHTML(person,{weapon:item,mount,helmet:getItem('bb-flat-top-helmet')}),w=pose(html,'weapon'),f=frame(html);
      assert.equal(w.x+w.gx,78,weapon.id);if(NAMED_WEAPON_ART[weapon.id])assert.ok(w.y+w.gy<=100+(mount?36:0),weapon.id);else assert.equal(w.y+w.gy,100+(mount?36:0),weapon.id);
      const scale=[...w.image.match(/transform:([^;]+)/)[1].matchAll(/scale\(([\d.]+)\)/g)].reduce((n,m)=>n*Number(m[1]),1);
      const angle=Number(w.image.match(/rotate\(([\d.-]+)deg\)/)[1])*Math.PI/180;
      assert.ok(scale>0,`${weapon.id}: valid scale`);
      const [width,height]=pngSize(w.image);
      assert.ok(Math.hypot(width,height)*scale<=144.03,`${weapon.id}: enlarged silhouette stays within 150% of the former 96px limit`);
      for(const x of [0,width])for(const y of [0,height]){
        const px=f.x+(w.x+w.gx+scale*((x-w.gx)*Math.cos(angle)-(y-w.gy)*Math.sin(angle)))*f.scale;
        const py=f.y+(w.y+w.gy+scale*((x-w.gx)*Math.sin(angle)+(y-w.gy)*Math.cos(angle)))*f.scale;
        assert.ok(px>=-1e-8&&px<=104+1e-8&&py>=-1e-8&&py<=142+1e-8,`${weapon.id}: blade and grip fit (${px},${py})`);
      }
      assert.ok(w.image.includes('--weapon-rest:')&&w.image.includes('--weapon-origin:'),`${weapon.id}: animations retain the rest pose`);
    }
  }
});

test('reference sword, axe and falx axes cross from the opposite shoulder to the hand rather than covering the face upright',()=>{
  for(const [id,tip] of [['greatsword',[5,8]],['greataxe',[18,9]],['falx',[35,7]]]){
    const w=pose(portraitHTML(person,{weapon:getItem(id)}),'weapon');
    const scale=[...w.image.match(/transform:([^;]+)/)[1].matchAll(/scale\(([\d.]+)\)/g)].reduce((n,m)=>n*Number(m[1]),1);
    const angle=Number(w.image.match(/rotate\(([\d.-]+)deg\)/)[1])*Math.PI/180;
    const x=w.x+w.gx+scale*((tip[0]-w.gx)*Math.cos(angle)-(tip[1]-w.gy)*Math.sin(angle));
    const y=w.y+w.gy+scale*((tip[0]-w.gx)*Math.sin(angle)+(tip[1]-w.gy)*Math.cos(angle));
    assert.ok(x<38&&y<70,`${id}: blade starts beyond the opposite shoulder`);
    const shoulderX=x+(78-x)*(55-y)/(100-y);
    assert.ok(shoulderX<44,`${id}: crosses the left shoulder below the face`);
  }
});

test('all five mounts share one plate and coordinate space; equipment is above the front animal layer',()=>{
  assert.equal(mounts.length,5);
  for(const mount of mounts)for(const weapon of [getItem('arming-sword'),getItem('greatsword')]){
    const equipment={mount,weapon,shield:weapon.twoHanded?null:getItem('kite-shield'),helmet:getItem('bb-fangshire')};
    const html=portraitHTML(person,equipment);
    assert.equal((html.match(/data-layer="base-plate"/g)||[]).length,1);
    assert.equal((html.match(/class="bb-portrait-composition"/g)||[]).length,1);
    assert.doesNotMatch(html,/bb-portrait-rider|translate\(2px,0\)|scale\(\.76\)/);
    assert.match(tag(html,'mount-head'),/z-index:5/);
    for(const layer of ['shield','weapon'])assert.ok(html.indexOf('data-layer="mount-head"')<html.indexOf(`data-layer="${layer}"`));
    const anchor=portraitWeaponAnchor(equipment),w=pose(html,'weapon'),f=frame(html);
    assert.equal(anchor.x,f.x+(w.x+w.gx)*f.scale);assert.equal(anchor.y,f.y+(w.y+w.gy)*f.scale);
  }
});


const rasterCache=new Map();
function opaquePixels(image) {
  const src=image.match(/src="([^"]+)"/)[1];if(rasterCache.has(src))return rasterCache.get(src);
  const bytes=src.startsWith('data:')?Buffer.from(src.split(',')[1],'base64'):readFileSync(new URL('../'+src,import.meta.url));
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  assert.equal(bytes[24],8);assert.equal(bytes[25],6);assert.equal(bytes[28],0,'noninterlaced RGBA mount art');
  const chunks=[];for(let offset=8;offset<bytes.length;){const size=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);if(type==='IDAT')chunks.push(bytes.subarray(offset+8,offset+8+size));offset+=12+size;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=[],decoded=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
  let minX=width,minY=height,maxX=0,maxY=0;
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];assert.ok(filter<=4);
    for(let i=0;i<stride;i++){
      const at=y*stride+i,left=i>=4?decoded[at-4]:0,up=y?decoded[at-stride]:0,corner=y&&i>=4?decoded[at-stride-4]:0;
      decoded[at]=(raw[y*(stride+1)+1+i]+[0,left,up,Math.floor((left+up)/2),paeth(left,up,corner)][filter])&255;
    }
    for(let x=0;x<width;x++)if(decoded[y*stride+x*4+3]){
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x+1);maxY=Math.max(maxY,y+1);
      if(decoded[y*stride+x*4+3]>16)pixels.push([x+.5,y+.5]);
    }
  }
  const result={pixels,bounds:[minX,minY,maxX,maxY]};rasterCache.set(src,result);return result;
}
function mountGeometry(html,part) {
  const p=pose(html,'mount-'+part),raster=opaquePixels(p.image);
  const xy=p.image.match(/transform:scale\(([\d.-]+),([\d.-]+)\)/);
  const scale=Number(p.image.match(/ scale\(([\d.]+)\)/)?.[1]??1);
  const sx=xy?Number(xy[1]):Number(p.image.match(/scaleX\((-?1)\)/)[1])*scale,sy=xy?Number(xy[2]):scale;
  const [x1,y1,x2,y2]=raster.bounds;
  return {...p,sx,sy,pixels:raster.pixels.map(([x,y])=>[p.x+x*sx,p.y+y*sy]),
    left:Math.min(p.x+x1*sx,p.x+x2*sx),right:Math.max(p.x+x1*sx,p.x+x2*sx),top:p.y+y1*sy,bottom:p.y+y2*sy};
}

test('every mount stays low on the right, visibly supports the rider and remains visible behind every shield',()=>{
  const profiles=new Set();
  for(let seed=0;seed<24;seed++)for(const mount of mounts)for(const helmet of [null,getItem('bb-fangshire'),getItem('bb-named-conic-helmet-with-faceguard'),getItem('bb-gunner-hat')])for(const shield of shields){
    const html=portraitHTML({name:'Rider',seed},{mount,armor:getItem('plate-harness'),helmet,weapon:getItem('arming-sword'),shield});
    profiles.add(html.match(/data-appearance="(\d+)"/)[1]);
    const head=mountGeometry(html,'head'),body=mountGeometry(html,'body'),s=pose(html,'shield'),f=frame(html);
    assert.ok(head.left>=64,`${mount.id}: animal is on the right, not beside the left arm`);
    assert.ok(head.top>=(mount.visual==='warhorse'||mount.visual==='armoredhorse'?35:54),`${mount.id}: animal cannot obscure the face`);
    assert.ok(head.bottom>=153.5&&head.bottom<=156,`${mount.id}: all muzzles meet the same plate`);
    assert.ok(Math.abs(body.left-0)<1e-8&&Math.abs(body.right-(/warhorse|armoredhorse/.test(mount.visual)?140:129))<1e-8,`${mount.id}: rear body spans beneath the rider`);
    assert.ok(Math.abs(body.top-(mount.visual==='warg'||mount.visual==='wolf'?78:/warhorse|armoredhorse/.test(mount.visual)?156-98*1.18:58))<1e-8&&Math.abs(body.bottom-156)<1e-8);
    const support=body.pixels.filter(([x,y])=>x>=45&&x<=80&&y>=112&&y<=146).length*Math.abs(body.sx*body.sy);
    const grounded=body.pixels.filter(([x,y])=>x>=8&&x<=35&&y>=140&&y<=156&&((x-70)/70)**2+((y-149)/11)**2<=1).length*Math.abs(body.sx*body.sy);
    assert.ok(grounded>30,`${mount.id}: lower-left haunch touches the actual plate ellipse (${grounded})`);
    assert.ok(support>100,`${mount.id}: actual opaque pixels support the rider (${support})`);
    const scale=[...s.image.match(/transform:([^;]+)/)[1].matchAll(/scale\(([\d.]+)\)/g)].reduce((n,m)=>n*Number(m[1]),1),right=s.x+pngSize(s.image)[0]*scale;
    assert.ok(right-s.x<=48+1e-8,'mounted shields cannot hide the whole animal');
    const visible=head.pixels.filter(([x])=>x>right+1).length*Math.abs(head.sx*head.sy);
    assert.ok(visible>100,`${mount.id}: recognizable mount remains visible beyond ${shield.id} (${visible})`);
    for(const part of [head,body])assert.ok(f.x+part.left*f.scale>=-1e-8&&f.x+part.right*f.scale<=104+1e-8&&f.y+part.bottom*f.scale<=142+1e-8,`${mount.id}: opaque art is framed`);
    assert.equal((html.match(/data-layer="base-plate"/g)||[]).length,1);
    if(tag(html,'head'))assert.match(tag(html,'head'),/top:0px/);
  }
  assert.equal(profiles.size,6,'covers every human appearance');
});


test('mounted pawns stay grounded while enlarged war horses share the same base',()=>{
  const appearances=new Set();
  const heads={'riding-horse':[78,54,1.25],'war-horse':[81,33.6544,1.2272],'armored-war-horse':[81,33.28,1.2272],'warg-mount':[139,70,.98],'dire-wolf-mount':[139,70,.98]};
  for(let seed=0;seed<24;seed++)for(const mount of mounts){
    const html=portraitHTML({name:'Rider',seed},{mount}),body=pose(html,'body'),raster=opaquePixels(body.image),head=pose(html,'mount-head');
    const rider=html.match(/data-layer="rider" style="([^"]+)"/)[1],drop=value(rider,'top');
    appearances.add(html.match(/data-appearance="(\d+)"/)[1]);
    const touching=raster.pixels.filter(([x,y])=>{x+=body.x;y+=body.y+drop;return y>=140&&y<=160&&((x-70)/70)**2+((y-149)/11)**2<=1;});
    assert.ok(touching.length>40,`${mount.id}: actual pawn pixels reach the base (${touching.length})`);
    assert.deepEqual([head.x,head.y,Number(head.image.match(/ scale\(([\d.]+)\)/)[1])],heads[mount.id],'animal feet remain anchored after the deliberate war-horse size change');
  }
  assert.equal(appearances.size,6);
  assert.doesNotMatch(portraitHTML(person),/data-layer="rider"/,'unmounted portraits keep their original position');
});


test('war horse silhouettes are 18% taller with a broader body and an unchanged rider/base frame',()=>{
  const geometry=id=>{const html=portraitHTML({name:'Rider',seed:42},{mount:getItem(id)});return {html,body:mountGeometry(html,'body'),head:mountGeometry(html,'head'),frame:frame(html)};};
  const riding=geometry('riding-horse');
  for(const id of ['war-horse','armored-war-horse']){
    const war=geometry(id);
    assert.ok(Math.abs((war.body.bottom-war.body.top)/(riding.body.bottom-riding.body.top)-1.18)<1e-8);
    assert.ok(war.body.right-war.body.left>riding.body.right-riding.body.left);
    assert.ok((war.head.bottom-war.head.top)/(riding.head.bottom-riding.head.top)>=1.17);
    assert.deepEqual(war.frame,riding.frame,'enlarging the animal must not shrink or lift its rider');
    assert.equal(war.body.bottom,riding.body.bottom);
  }
});


test('every named two-handed handle stays above the pawn ground anchor, including all mounts and rerolls',()=>{
 for(const weapon of weapons.filter(w=>w.twoHanded&&!w.ranged&&NAMED_WEAPON_ART[w.id]))for(const mount of [null,...mounts])for(const item of [weapon,getItem(`famed2:${weapon.id}:7913`),{id:weapon.id,visual:weapon.visual}]){
  const html=portraitHTML(person,{weapon:item,mount}),w=pose(html,'weapon'),ground=116+(mount?36:0);
  for(const [x,y] of opaquePixels(w.image).pixels){const [,ty]=transformedPoint(w.image,x,y);assert.ok(w.y+ty<=ground,`${weapon.id}: visible handle reaches ${w.y+ty}, below base ${ground}`);}
  const [width,height]=pngSize(w.image);
  for(const x of [0,width])for(const y of [0,height]){const [,ty]=transformedPoint(w.image,x,y);assert.ok(w.y+ty<=ground,`${weapon.id}: entire sprite is bounded above the base`);}
 }
});


test('foreground equipment keeps readable proportions after framing, including mounted shields',()=>{
 for(const mount of [null,...mounts]){
  const html=portraitHTML(person,{weapon:getItem('arming-sword'),shield:getItem('round-shield'),mount}),w=pose(html,'weapon'),s=pose(html,'shield'),f=frame(html);
  const scale=im=>[...im.match(/transform:([^;]+)/)[1].matchAll(/scale\(([\d.]+)\)/g)].reduce((n,m)=>n*Number(m[1]),1);
  assert.ok(scale(w.image)*f.scale>=(mount ? .88 : .95),'sword must remain readable after final framing');
  assert.ok(pngSize(s.image)[0]*scale(s.image)>=44,'shield retains its size relative to the pawn while the larger composition is framed');
 }
 for(const mount of mounts)for(const shield of shields){
  const html=portraitHTML(person,{shield,mount}),s=pose(html,'shield');
  const scale=Number(s.image.match(/transform:scale\(([\d.]+)\)/)[1]);
  assert.ok(s.y+pngSize(s.image)[1]*scale<=156+1e-8,`${shield.id}: enlarged shield stays above the shared base`);
 }
});


test('enlarged named one-handed handles stay above the pawn base on every mount',()=>{
 for(const weapon of weapons.filter(w=>!w.twoHanded&&NAMED_WEAPON_ART[w.id]))for(const mount of [null,...mounts]){
  const w=pose(portraitHTML(person,{weapon,mount}),'weapon'),[width,height]=pngSize(w.image);
  for(const x of [0,width])for(const y of [0,height]){const [,ty]=transformedPoint(w.image,x,y);assert.ok(w.y+ty<=116+(mount?36:0),weapon.id);}
 }
});


test('equipped weapons use the requested additional scale for ordinary and named variants',()=>{
 for(const weapon of weapons)for(const mount of [null,...mounts])for(const item of [weapon,getItem(`famed:${weapon.id}:73`)]){
  const w=pose(portraitHTML(person,{weapon:item,mount}),'weapon');
  if(!w)continue;
  const boosts=[...w.image.match(/transform:([^;]+)/)[1].matchAll(/scale\(([\d.]+)\)/g)].map(m=>Number(m[1]));
  const shoulder=weapon.twoHanded&&!weapon.ranged;
  assert.equal(boosts.at(-1),shoulder?1.5:weapon.twoHanded?1.8:1.56,`${weapon.id}: requested growth pivots around its grip`);
 }
});
