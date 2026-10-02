import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DLC_ART} from '../src/dlc-art.js';
import {getItem,createGame,equipItem,unequipItem,getCompanyStats,validateSave,WORLD_REGIONS} from '../src/engine.js';
import {VISUALS,portraitHTML,itemImage} from '../src/portraits.js';
import {regionalOutfit} from '../src/regional-enemies.js';
const manifest=JSON.parse(readFileSync(new URL('../assets/reclaimed-attachments-source.json',import.meta.url)));
const dlc=JSON.parse(readFileSync(new URL('../assets/dlc-equipment-source.json',import.meta.url)));
const uriBytes=uri=>Buffer.from(uri.split(',')[1],'base64');
const file=path=>readFileSync(new URL('../'+path,import.meta.url));
const newIds=['northern-pelt-mantle','ancient-gilded-collar','noble-brocade-mantle'];

test('Vizier cloth headgear cannot inherit the generic metal icon; Ancient Attire uses a full cloth torso',()=>{
 const vizier=getItem('bb-vizier-headgear'),art=DLC_ART[vizier.id],source=dlc.assets.find(a=>a.id===vizier.id);
 assert.equal(vizier.armor,10);assert.equal(source.brush,'helmet_desert_noble_01');assert.equal(source.icon,null);assert.equal(art.icon,art.portrait);
 const ancient=dlc.records.find(a=>a.item.id==='bb-ancient-lich-attire');assert.equal(ancient.sourceSprite,'bust_body_skeleton_80');assert.equal(ancient.sprite,'bust_body_60');assert.ok(ancient.artAdaptation);
 assert.equal(DLC_ART[ancient.item.id].portrait,DLC_ART['bb-thick-dark-tunic'].portrait);
 assert.notDeepEqual(uriBytes(DLC_ART[ancient.item.id].portrait),file('assets/portraits/attachment-ancient-gilded-collar.png'));
});

test('legacy Animal Pelt and Noble Mail now use the exact native full armor icons, sprites and anchors',()=>{
 for(const [id,source]of [['northern-animal-pelt','bb-animal-hide-armor'],['noble-mail','bb-noble-mail-armor']]){
  const item=getItem(id),art=DLC_ART[source],spec=VISUALS.armor[item.visual];assert.deepEqual(file(itemImage(item)),uriBytes(art.icon));assert.deepEqual(file('assets/portraits/'+spec[0]),uriBytes(art.portrait));assert.deepEqual(spec.slice(1),[art.left,art.top]);
 }
 assert.equal(getItem('northern-animal-pelt').armor,85);assert.equal(getItem('noble-mail').armor,175);
});

test('all three decorative assets survive as independently wearable, damage-preserving attachments',()=>{
 assert.equal(manifest.assets.length,6);
 for(const row of manifest.assets){const data=file(row.local);assert.equal(data.length,row.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),row.sha256);}
 for(const id of newIds){const state=createGame(77),item=getItem(id),member=state.party[0],before=getCompanyStats(member);
  state.inventory.push(id);state.inventoryCondition.push(item.armor-7);assert.equal(equipItem(state,member.id,id).ok,true);
  assert.equal(member.equipment.armor,'leather-vest');assert.equal(member.equipment.attachment,id);assert.equal(member.armorDurability.attachment,item.armor-7);
  assert.equal(getCompanyStats(member).bodyArmor,before.bodyArmor);assert.equal(getCompanyStats(member).attachmentArmor,item.armor-7);
  for(const mount of [null,getItem('war-horse')]){const html=portraitHTML(member,{armor:getItem('leather-vest'),attachment:item,mount});assert.ok(html.includes('data-layer="armor"'));assert.ok(html.includes(`attachment-${id}.png`));}
  assert.deepEqual(validateSave(state),state);assert.equal(unequipItem(state,member.id,'attachment').ok,true);assert.equal(state.inventoryCondition[state.inventory.indexOf(id)],item.armor-7);
 }
});

test('reclaimed attachments enter regional enemy outfits and remain usable equipment',()=>{
 const seen=new Set();for(const region of WORLD_REGIONS)for(let seed=0;seed<60;seed++){const enemy=regionalOutfit({name:'Raider',weapon:'arming-sword',armor:'leather-vest',helmet:'leather-cap'},seed,0,region.x,region.y,2);if(newIds.includes(enemy.attachment)){seen.add(enemy.attachment);assert.equal(getItem(enemy.attachment).slot,'attachment');}}
 assert.deepEqual(seen,new Set(newIds));
});
