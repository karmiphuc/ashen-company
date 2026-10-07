import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DLC_ART} from '../src/dlc-art.js';
import {DIREWOLF_HELMET_ART} from '../src/direwolf-helmets.js';
import {DLC_ITEMS} from '../src/dlc-items.js';
import {getItem} from '../src/engine.js';
import {portraitHTML} from '../src/portraits.js';
const native=JSON.parse(readFileSync(new URL('./fixtures/helmet-anchors.json',import.meta.url)));
const source=JSON.parse(readFileSync(new URL('../assets/dlc-equipment-source.json',import.meta.url)));
const sourceById=new Map(source.assets.map(a=>[a.id,a]));
const helmets=DLC_ITEMS.filter(i=>i.slot==='helmet');
const headOrigin=native.headBrush.localTop+native.headBrush.bounds[3];

test('all imported helmets use the native head origin, preserving the earlier forehead-placement correction',()=>{
 assert.equal(headOrigin,48);assert.equal(helmets.length,113);
 for(const item of helmets){const art=DLC_ART[item.id],asset=sourceById.get(item.id);
  assert.equal(art.top+asset.brushBounds[3],headOrigin,`${item.id}: head origin, not torso origin`);
  assert.equal(art.left-asset.brushBounds[0],52,item.id);
  assert.deepEqual(asset.portraitOrigin,native.headBrush.origin,item.id);
 }
 // Independent reference shapes include caps, headbands, full mail, masks, horns and a tall hat.
 for(const reference of native.helmetReferences){assert.deepEqual(sourceById.get(reference.id).brushBounds,reference.bounds);assert.equal(DLC_ART[reference.id].top,reference.expectedTop,reference.id);}
 // Armor remains on the torso origin; correcting helmets must not move body protection.
 for(const item of DLC_ITEMS.filter(i=>i.slot==='armor'))assert.equal(DLC_ART[item.id].top+sourceById.get(item.id).brushBounds[3],63,item.id);
});

test('all helmet crowns and horns keep their full size and source anchors across faces and named variants',()=>{
 const people=new Map();for(let seed=0;seed<100;seed++){const person={name:'Alignment',seed},html=portraitHTML(person),index=Number(html.match(/data-appearance="(\d+)"/)[1]);people.set(index,person);}
 assert.ok(people.size>=6);
 for(const item of helmets)for(const person of people.values())for(const helmet of [getItem(item.id),getItem(`famed:${item.id}:123`)]){
  const art=DIREWOLF_HELMET_ART[item.id] ?? DLC_ART[item.id],html=portraitHTML(person,{helmet,armor:getItem('leather-vest'),weapon:getItem('arming-sword'),shield:getItem('kite-shield')});
  const style=html.match(/bb-portrait-composition" style="([^"]+)"/)[1];
  const x=Number(style.match(/left:([\d.-]+)px/)[1]),y=Number(style.match(/top:([\d.-]+)px/)[1]),scale=Number(style.match(/transform:scale\(([\d.]+)\)/)?.[1]??1);
  assert.equal(x,0,`${item.id}: equipment does not shift the rider horizontally`);
  assert.equal(scale,1,`${item.id}: tall helmets cannot shrink the character`);
  assert.match(html,/overflow:visible/,`${item.id}: crowns and horns can extend beyond the nominal canvas`);
  assert.ok(Number.isFinite(y+art.top*scale),`${item.id}: source crown remains positioned`);
  if(!art.hideHead)assert.match(html,/data-layer="head"[^>]*top:0px/,`${item.id}: local face origin stays fixed`);
  assert.ok(html.includes(`left:${art.left}px;top:${art.top}px;`),`${item.id}: source anchor applies to ordinary and named gear`);
  const mounted=portraitHTML(person,{helmet,mount:getItem('war-horse')});
  assert.ok(mounted.includes(`left:${art.left}px;top:${art.top}px;`),`${item.id}: mounted rider retains alignment`);
 }
});
