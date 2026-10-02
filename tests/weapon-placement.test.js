import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ITEMS, getItem} from '../src/engine.js';
import {portraitHTML, portraitWeaponAnchor} from '../src/portraits.js';

const person = {name:'Rest pose', seed:42};
const weapons = ITEMS.filter(item=>item.slot==='weapon');
const shields = ITEMS.filter(item=>item.slot==='shield');
const mounts = ITEMS.filter(item=>item.slot==='mount');
const tag = (html, name)=>html.match(new RegExp(`<img data-layer="${name}"[^>]+>`))?.[0];
const value = (text, key)=>Number(text.match(new RegExp(`${key}:([\\d.-]+)px`))[1]);
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
  const bytes=readFileSync(new URL('../'+src,import.meta.url));
  return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
}

test('every shield and one-handed family share the right hand while the center chest stays clear',()=>{
  for(const weapon of weapons.filter(w=>!w.twoHanded))for(const shield of shields){
    for(const item of [weapon,getItem(`famed:${weapon.id}:73`),{visual:weapon.visual,id:weapon.id}]){
      const html=portraitHTML(person,{weapon:item,shield}),w=pose(html,'weapon'),s=pose(html,'shield');
      assert.equal(w.x+w.gx,82,weapon.id);assert.equal(w.y+w.gy,111,weapon.id);
      const scale=Number(s.image.match(/transform:scale\(([\d.]+)\)/)?.[1]??1);
      const right=s.x+pngSize(s.image)[0]*scale;
      assert.ok(s.x>=60,`${shield.id}: center chest x=38..60 remains visible`);
      assert.ok(s.x<=82 && right>=82,`${shield.id}: weapon and shield share the hand`);
      const f=frame(html);assert.ok(f.x+right*f.scale<=104+1e-8,`${shield.id}: right edge is framed`);
      assert.match(w.image,/z-index:7/);assert.match(s.image,/z-index:6/);
    }
  }
});

test('every two-handed melee family is enlarged at the opposite hand and fits completely, including named mounted variants',()=>{
  for(const weapon of weapons.filter(w=>w.twoHanded&&!w.ranged))for(const mount of [null,...mounts]){
    for(const item of [weapon,getItem(`famed:${weapon.id}:73`),{id:weapon.id,visual:weapon.visual}]){
      const html=portraitHTML(person,{weapon:item,mount,helmet:getItem('bb-flat-top-helmet')}),w=pose(html,'weapon'),f=frame(html);
      assert.equal(w.x+w.gx,78,weapon.id);assert.equal(w.y+w.gy,116,weapon.id);
      const scale=Number(w.image.match(/transform:scale\(([\d.]+)\)/)[1]);
      const angle=Number(w.image.match(/rotate\(([\d.-]+)deg\)/)[1])*Math.PI/180;
      assert.ok(scale>=1.05,`${weapon.id}: native art is enlarged`);
      const [width,height]=pngSize(w.image);
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
    const scale=Number(w.image.match(/transform:scale\(([\d.]+)\)/)[1]);
    const angle=Number(w.image.match(/rotate\(([\d.-]+)deg\)/)[1])*Math.PI/180;
    const x=w.x+w.gx+scale*((tip[0]-w.gx)*Math.cos(angle)-(tip[1]-w.gy)*Math.sin(angle));
    const y=w.y+w.gy+scale*((tip[0]-w.gx)*Math.sin(angle)+(tip[1]-w.gy)*Math.cos(angle));
    assert.ok(x<15&&y<40,`${id}: blade starts beyond the opposite shoulder`);
    const shoulderX=x+(78-x)*(55-y)/(116-y);
    assert.ok(shoulderX<38,`${id}: crosses shoulder at x<38, leaving the face clear`);
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

test('Riding Horse stays below the face and leaves the center chest visible on the shared plate',()=>{
  for(let seed=0;seed<24;seed++)for(const helmet of [null,getItem('bb-fangshire'),getItem('bb-flat-top-helmet')]){
    const html=portraitHTML({name:'Rider',seed},{mount:getItem('riding-horse'),armor:getItem('plate-harness'),helmet,weapon:getItem('arming-sword'),shield:getItem('painted-tower-shield')});
    const h=pose(html,'mount-head'),b=pose(html,'mount-body');
    assert.match(h.image,/scale\(0.72\)/);assert.match(b.image,/scale\(0.72\)/);
    const [width,height]=pngSize(h.image);
    assert.ok(h.y>=60,'horse cannot hide the rider face');
    assert.ok(h.x+width*.72<=48,'horse leaves the center chest visible');
    assert.ok(Math.abs(h.y+height*.72-124)<1,'horse head sits on the plate');
    assert.match(tag(html,'head'),/top:0px/);
    assert.equal((html.match(/data-layer="base-plate"/g)||[]).length,1);
  }
});
