import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,createGame,createFamedItemId,getItem,getCompanyStats,shieldMaximum,getMarket,equipItem,startBattle,resolveBattle,finishBattle,validateSave,mergedNamedItemId,mergeOwnedNamedBonuses,buyItem,sellItem,unequipItem} from '../src/engine.js';
import {NAMED_WEAPONS,NAMED_WEAPON_DESIGNS} from '../src/named-weapons.js';
import {getItemDetails} from '../src/item-details.js';
import {equipmentCatalogHTML} from '../src/equipment-catalog.js';
import {itemImage,portraitHTML} from '../src/portraits.js';
const v=(id,seed,version)=>getItem(createFamedItemId(id,seed,version));
function equip(s,id,slot='active'){const i=getItem(id);s.inventory.push(id);s.inventoryCondition.push(i.slot==='shield'?shieldMaximum(id):i.armor??null);assert.equal(equipItem(s,'captain',id,slot).ok,true);}

test('merged weapons retain the same two BB rolls and add exactly the older damage, accuracy and armor damage bonuses',()=>{
 for(const base of ITEMS.filter(i=>i.slot==='weapon'))for(let seed=0;seed<128;seed++){
  const old=v(base.id,seed,1),rolled=v(base.id,seed,2),merged=v(base.id,seed,3);assert.equal(merged.rollVersion,3);assert.equal(createFamedItemId(base.id,seed),merged.id);assert.deepEqual(merged.rollModifiers,rolled.rollModifiers);assert.equal(new Set(merged.rollModifiers).size,2);
  assert.equal(merged.damageMin,rolled.damageMin+old.damageMin-base.damageMin);assert.equal(merged.damageMax,rolled.damageMax+old.damageMax-base.damageMax);assert.equal(merged.hitBonus,rolled.hitBonus+old.hitBonus-(base.hitBonus??0));assert.ok(Math.abs(merged.armorDamage-(rolled.armorDamage+old.armorDamage-(base.armorDamage??1)))<1e-9);
  for(const key of ['armorPiercing','headChance','fatigue','ammoMax','fatigueOnSkillUse','shieldDamage'])assert.equal(merged[key],rolled[key]);assert.equal(merged.bonuses.length,5);assert.deepEqual(merged,v(base.id,seed,3));assert.ok(Object.isFrozen(merged)&&Object.isFrozen(merged.bonuses));
 }
});

test('all four armor signature traits stack with unchanged BB protection and weight and affect company stats',()=>{
 for(const [index,signature,stat,value] of [[0,'guarded','meleeDefense',2],[1,'deflecting','rangedDefense',3],[2,'stalwart','resolve',4],[3,'vigorous','maxFatigue',4]]){
  const seed=index<<12,rolled=v('mail-shirt',seed,2),merged=v('mail-shirt',seed,3),s=createGame(73);equip(s,rolled.id);const before=getCompanyStats(s.party[0]);s.party[0].equipment.armor=merged.id;const after=getCompanyStats(s.party[0]);assert.equal(merged.armor,rolled.armor);assert.equal(merged.fatigue,rolled.fatigue);assert.equal(merged.signature,signature);assert.equal(merged.statBonuses[stat],value);assert.equal(after[stat]-before[stat],value);assert.ok(merged.name.includes(' of '));assert.ok(getItemDetails(merged).notes.includes(merged.signatureDescription));assert.deepEqual(validateSave(s),s);
 }
});

test('imported named armor restores its original trait and Fangshire has exactly its innate five ranged defense',()=>{
 for(const base of ITEMS.filter(i=>i.sourceArmor!==undefined))for(const seed of [0,12345,0xffffffff]){
  const merged=v(base.id,seed,3),rolled=v(base.id,seed,2);assert.equal(merged.armor,rolled.armor);assert.equal(merged.fatigue,rolled.fatigue);assert.equal(merged.signature,base.signature);assert.deepEqual(merged.statBonuses,base.statBonuses);assert.ok(Object.isFrozen(merged.statBonuses));
 }
 assert.equal(v('bb-fangshire',73,3).statBonuses.rangedDefense,5);
});

test('merged shields retain independent BB defenses and durability plus the old shared defense and fatigue relief',()=>{
 for(const base of ITEMS.filter(i=>i.slot==='shield'))for(let seed=0;seed<128;seed++){
  const rolled=v(base.id,seed,2),merged=v(base.id,seed,3),old=v(base.id,seed,1),extra=old.defense-base.defense;assert.deepEqual(merged.rollModifiers,rolled.rollModifiers);assert.equal(merged.defense,rolled.defense+extra);assert.equal(merged.rangedDefense,rolled.rangedDefense+extra);assert.equal(merged.fatigue,Math.max(0,rolled.fatigue-(base.fatigue-old.fatigue)));assert.equal(shieldMaximum(merged.id),shieldMaximum(rolled.id));assert.equal(merged.fatigueOnSkillUse,rolled.fatigueOnSkillUse);
 }
});

test('outside battle, owned version-two items and concrete named weapons upgrade once without changing seeds or damage',()=>{
 const s=createGame(73),armor=v('mail-shirt',42,2),weapon=v('arming-sword',91,2),shield=v('round-shield',17,2),raw=NAMED_WEAPONS[0];equip(s,armor.id);equip(s,weapon.id,'reserve');s.inventory.push(shield.id,raw.id);s.inventoryCondition.push(12,null);s.party[0].armorDurability.body=armor.armor-19;
 const conditions=[...s.inventoryCondition],damage=s.party[0].armorDurability.body;assert.equal(mergeOwnedNamedBonuses(s),true);assert.equal(s.party[0].equipment.armor,createFamedItemId('mail-shirt',42,3));assert.equal(s.party[0].reserveEquipment.weapon,createFamedItemId('arming-sword',91,3));assert.deepEqual(s.inventoryCondition,conditions);assert.equal(s.party[0].armorDurability.body,damage);assert.equal(getItem(s.inventory.at(-1)).rollVersion,3);assert.deepEqual(validateSave(s),s);const before=structuredClone(s);assert.equal(mergeOwnedNamedBonuses(s),false);assert.deepEqual(s,before);
});

test('an old active fight stays unchanged; its owned gear upgrades after the result while health and damage remain exact',()=>{
 const s=createGame(73),armor=v('mail-shirt',42,2),weapon=v('arming-sword',91,2);equip(s,armor.id);equip(s,weapon.id);s.position={x:440,y:520};assert.equal(startBattle(s,'quarry-camp').ok,true);const before=structuredClone(s);assert.equal(mergeOwnedNamedBonuses(s),false);assert.deepEqual(s,before);assert.deepEqual(validateSave(s),s);
 const actor=s.battle.units.find(u=>u.id==='captain');actor.hp=73;actor.bodyArmor=armor.armor-19;s.battle.units.filter(u=>u.side==='enemy').forEach(u=>{u.hp=0;u.alive=false;});resolveBattle(s);assert.equal(finishBattle(s).ok,true);assert.equal(s.party[0].hp,73);assert.equal(s.party[0].armorDurability.body,armor.armor-19);assert.equal(s.party[0].equipment.weapon,createFamedItemId('arming-sword',91,3));assert.deepEqual(validateSave(s),s);
});

test('every concrete named weapon preview and upgrade has combined bonuses and retains its actual artwork and unrolled source baseline',()=>{
 for(const [index,base] of NAMED_WEAPON_DESIGNS.entries()){
  const raw=NAMED_WEAPONS[index],merged=getItem(mergedNamedItemId(base.id));assert.equal(merged.rollVersion,3);assert.equal(merged.bonuses.length,5);assert.deepEqual(merged.rollModifiers,raw.rollModifiers);assert.deepEqual(merged.sourceStats,base.sourceStats);assert.equal(itemImage(merged),itemImage(raw));assert.equal(merged.damageMin-raw.damageMin,2+((0x42420000+index)&15)%5);assert.ok(portraitHTML({seed:42,name:'Test'},{weapon:merged}).includes('bb-portrait'));
 }
 const html=equipmentCatalogHTML('named-weapons');assert.equal((html.match(/data-item-source="catalog"/g)||[]).length,47);assert.match(html,/data-inspect="famed3:impaler:/);
});

test('merged named loot retains stats and item condition through equipment, sale, buyback and a real battle import',()=>{
 const s=createGame(73);s.gold=50000;const item=v('mail-shirt',42,3);equip(s,item.id);s.party[0].armorDurability.body-=19;assert.equal(unequipItem(s,'captain','armor').ok,true);assert.equal(sellItem(s,item.id).ok,true);assert.equal(buyItem(s,item.id).ok,true);assert.equal(s.inventoryCondition[s.inventory.indexOf(item.id)],item.armor-19);assert.equal(equipItem(s,'captain',item.id).ok,true);s.position={x:440,y:520};assert.equal(startBattle(s,'quarry-camp').ok,true);assert.deepEqual(validateSave(s),s);assert.equal(s.battle.units.find(u=>u.id==='captain').bodyArmor,item.armor-19);
});

test('combined identities reject malformed seeds and ineligible slots while previous resolvers stay unchanged',()=>{
 for(const id of ['famed3:arming-sword:01','famed3:arming-sword:4294967296','famed3:unknown:1','famed3:war-horse:1','famed3:arming-sword:-1'])assert.equal(getItem(id),undefined);assert.throws(()=>createFamedItemId('arming-sword',1,4),TypeError);assert.equal(v('arming-sword',42,2).rollVersion,2);assert.equal(v('arming-sword',42,2).bonuses.length,2);assert.equal(v('mail-shirt',42,1).rollVersion,undefined);assert.equal(mergedNamedItemId('famed:mail-shirt:42'),'famed:mail-shirt:42');
});

test('existing town stock and damaged buybacks merge without resetting sold-out offers or quantities',()=>{
 const s=createGame(73);s.gold=50000;const common=getMarket(s).equipment.find(r=>!getItem(r.itemId).rarity&&r.stock>0);buyItem(s,common.itemId);const market=s.marketStock.oakwatch,armor=v('mail-shirt',42,2),shield=v('round-shield',17,2);
 market.equipment[armor.id]=0;market.equipment[shield.id]=2;market.buyback=[{itemId:shield.id,condition:12}];assert.equal(mergeOwnedNamedBonuses(s),true);assert.equal(market.equipment[createFamedItemId('mail-shirt',42,3)],0);assert.equal(market.equipment[createFamedItemId('round-shield',17,3)],2);assert.deepEqual(market.buyback,[{itemId:createFamedItemId('round-shield',17,3),condition:12}]);assert.deepEqual(validateSave(s),s);
});
