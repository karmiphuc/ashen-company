import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getItem,createFamedItemId,createGame,validateSave,getMarket,SETTLEMENTS} from '../src/engine.js';
import {equipmentSkills,weaponCombatProfile} from '../src/combat-skills.js';
import {weaponMasteryMatches,PERKS} from '../src/perks.js';
import {itemImage,portraitHTML} from '../src/portraits.js';
const ids=['flanged-mace','footmans-mace','two-handed-spiked-club','two-handed-flanged-mace'];
test('maces keep mastery, control skills, artwork and famed inheritance distinct from hammers',()=>{
 for(const id of ids){const w=getItem(id),rolled=getItem(createFamedItemId(id,719));assert.ok(weaponMasteryMatches('mace-training',w));assert.equal(weaponCombatProfile(w).id,w.twoHanded?'heavymace':'mace');assert.equal(equipmentSkills(w)[0].id,w.twoHanded?'cudgel':'bash');assert.ok(equipmentSkills(w).some(s=>s.id===(w.twoHanded?'strike-down':'knock-out')));assert.equal(weaponCombatProfile(rolled).id,weaponCombatProfile(w).id);assert.equal(itemImage(rolled),itemImage(w));assert.match(portraitHTML({seed:1,name:'Mace bearer'},{weapon:w},104),new RegExp(`weapon-${id}.png`));assert.ok(w.armorDamage<getItem(w.twoHanded?'two-handed-hammer':'warhammer').armorDamage);}
});
test('new mace assets have pinned source hashes and preserved PNG artwork',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../assets/items/mace-source-manifest.json',import.meta.url)));assert.equal(manifest.length,8);
 for(const entry of manifest){const data=await readFile(new URL('../'+entry.asset,import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),entry.sha256);assert.ok(entry.source.includes('b014cdf8520e69b2383116d1654977e9dbb10d96'));}
});
test('all masteries have dedicated weapon icons and every perk avoids category fallbacks',()=>{
 for(const p of PERKS)assert.equal(p.icon,p.id,p.id);
 const masteries=PERKS.filter(p=>/Mastery/.test(p.name));assert.equal(new Set(masteries.map(p=>p.icon)).size,masteries.length);
});
test('maces are available through normal rotating armories and save cleanly',()=>{
 const found=new Set();for(let seed=1;seed<=12;seed++){const s=createGame(seed);for(const town of SETTLEMENTS){s.position={x:town.x,y:town.y};const market=getMarket(s);for(const row of market.equipment)if(ids.includes(row.itemId)&&row.stock>0)found.add(row.itemId);}validateSave(s);}assert.equal(found.size,4);
});
