import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advanceRivalSimulation,SETTLEMENTS,getItem,getCompanyStats,equipItem,validateSave} from '../src/engine.js';
import {enableRivalCombat} from '../src/rival-world-combat.js';
import {NAMED_WEAPONS} from '../src/named-weapons.js';
import {equipRivalLoot} from '../src/rival-equipment.js';
import {rivalRiskMargin,RIVAL_GOALS} from '../src/rival-goals.js';
const context={getItem,stats:getCompanyStats,equipItem,itemCondition:id=>getItem(id)?.durability??getItem(id)?.armor??null};
function scene(){const world=createGame(12);advanceRivalSimulation(world);enableRivalCombat(world);return {world,company:world.rivalCompanies.companies[0]};}
test('earned upgrades preserve native durability, displaced gear, HP and ranged/reach weapon styles',()=>{
 const {world,company}=scene(),person=company.party[0],archer=company.party.at(-1),reach=company.party[3];
 person.armorDurability.head=41;person.hp=37;
 const view={...world,party:company.party,inventory:['full-helm','winged-mace','greatsword'],inventoryCondition:[180,null,null],log:[]};
 const oldBow=archer.equipment.weapon,oldReach=reach.equipment.weapon;
 const possessions=()=>[...view.inventory,...view.party.flatMap(p=>Object.values(p.equipment).filter(Boolean))].sort();const owned=possessions();
 assert.ok(equipRivalLoot(view,context)>0);
 assert.equal(person.equipment.helmet,'full-helm');assert.equal(person.armorDurability.head,180);assert.equal(person.hp,37);
 assert.equal(view.inventoryCondition[view.inventory.indexOf('iron-helm')],41);
 assert.ok(company.party.some(p=>p.equipment.weapon==='winged-mace'));
 assert.equal(archer.equipment.weapon,oldBow);assert.equal(reach.equipment.weapon,oldReach);assert.ok(view.inventory.includes('greatsword'));
 assert.deepEqual(possessions(),owned);
});
test('a badly damaged heavier helmet is not an upgrade over healthy current protection',()=>{
 const {world,company}=scene();const view={...world,party:company.party,inventory:['full-helm'],inventoryCondition:[0],log:[]};
 assert.equal(equipRivalLoot(view,context),0);assert.ok(company.party.every(p=>p.equipment.helmet==='iron-helm'));
});
test('saleable spoils route to a nearby open non-home town and survive save/reload without diverting into camps',()=>{
 const {world,company}=scene(),town=SETTLEMENTS.find(t=>!['oakwatch','greyhaven','stonebridge'].includes(t.id));
 company.position={x:town.x,y:town.y};company.status='travelling';company.inventory=Array(13).fill('arming-sword');company.inventoryCondition=Array(13).fill(null);
 const before=company.gold;world.hour+=.25;advanceRivalSimulation(world);
 assert.equal(company.targetTownId,town.id);assert.equal(company.targetCampId,null);assert.equal(company.status,'resting');assert.equal(company.inventory.length,1);assert.ok(company.gold>before);
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(world))).rivalCompanies,world.rivalCompanies);
});
test('ordinary loot increases risk caution, while retained named reserves do not trap rivals at town forever',()=>{
 const {company}=scene();assert.equal(rivalRiskMargin(company,context),RIVAL_GOALS[company.id].margin);
 company.inventory=[NAMED_WEAPONS[0].id];assert.equal(rivalRiskMargin(company,context),RIVAL_GOALS[company.id].margin);
 company.inventory=['arming-sword'];assert.equal(rivalRiskMargin(company,context),RIVAL_GOALS[company.id].margin*1.75);
});
