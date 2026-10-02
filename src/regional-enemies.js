import { regionAt } from './geography.js';
import { REGIONAL_ENEMY_FACTIONS } from './enemy-rosters.js';
import { DLC_ITEMS } from './dlc-items.js';

const profile = (label, family, names, camps, collections, extra = '') => Object.freeze({label, family, names: Object.freeze(names), camps: Object.freeze(camps), collections: Object.freeze(collections), extra});
export const WORLD_ENEMY_PROFILES = Object.freeze({
  'western-marches': profile('Marchland Brigands', 'east', ['Tollroad Spear', 'Roadside Crossbow', 'Hedge Swordsman', 'Marchland Bill', 'Wagon Skirmisher', 'Bandit Shield'], ['Tollroad Den', 'Broken Wagon Camp', 'Hedge Fort'], ['base']),
  'northern-highlands': profile('Highland Clans', 'north', ['Wolf Clan Raider', 'Frostbound Spear', 'Crag Axethrower', 'Raven Hunter', 'Iron Reaver', 'Highland Slinger'], ['Wolf Clan Hold', 'Frostbound Hall', 'Raven Cairn'], ['warriors-of-the-north', 'base']),
  greenwood: profile('Greenwood Hunters', 'forest', ['Greenwood Poacher', 'Briar Bowhunter', 'Thicket Knife', 'Forester Spear', 'Timber Axeman', 'Snareline Bill'], ['Poacher Lodge', 'Briar Hideout', 'Snareline Camp'], ['base'], 'hunt'),
  'eastern-frontier': profile('Frontier Free Companies', 'east', ['Free Company Spear', 'Siege Crossbow', 'Oathbroken Sword', 'Campaign Bill', 'Mercenary Thrower', 'Redoubt Guard'], ['Free Company Redoubt', 'Oathbroken Keep', 'Deserter Muster'], ['base', 'of-flesh-and-faith']),
  'far-steppe': profile('Steppe Warbands', 'south', ['Steppe Horsebow', 'Grassland Thrower', 'Kargan Lancer', 'Windrest Shamshir', 'Steppe Glaive', 'Longgrass Scout'], ['Horsebow Camp', 'Kargan Warcamp', 'Grassland Corral'], ['blazing-deserts', 'base'], 'steppe'),
  'southern-marches': profile('Border Deserters', 'east', ['Border Spear', 'Grainroad Crossbow', 'Garrison Deserter', 'Border Bill', 'Field Skirmisher', 'Oathbroken Guard'], ['Garrison Ruins', 'Grainroad Blockade', 'Border Redoubt'], ['base', 'of-flesh-and-faith']),
  'blackwater-basin': profile('Blackwater Cultists', 'forest', ['Blackwater Bow', 'Bogland Hunter', 'Ritual Knife', 'Reed Spear', 'Graveyard Cleaver', 'Blackwater Scythe'], ['Sunken Shrine', 'Reed Cult Camp', 'Graveyard Vigil'], ['base', 'warriors-of-the-north'], 'cult'),
  'saffron-coast': profile('Saffron Corsairs', 'south', ['Corsair Bowman', 'Dockside Qatal', 'Saltroad Spear', 'Saffron Archer', 'Corsair Thrower', 'Harbor Duelist'], ['Corsair Cove', 'Saltroad Hideout', 'Harbor Blockade'], ['blazing-deserts', 'base'], 'coast'),
  sunlands: profile('Sunland Nomads', 'south', ['Nomad Qatal', 'Desert Warbow', 'Lamellar Lancer', 'Arena Shamshir', 'Sandstorm Thrower', 'Sunland Glaive'], ['Dune Encampment', 'Gladiator Refuge', 'Lamellar Stronghold'], ['blazing-deserts', 'base']),
});
const progressionNames = ['', 'Recruit', 'Veteran', 'Elite'];
export function enemyCombatRole(enemy) {
  if (/bow|sling/.test(enemy.weapon)) return 'ranged';
  if (/javelin|throwing/.test(enemy.weapon)) return 'skirmisher';
  return enemy.shield ? 'shield' : 'melee';
}
export function worldEnemyTemplates(x, y, difficulty) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError('Enemy coordinates must be finite.');
  if (!Number.isSafeInteger(difficulty) || difficulty < 1 || difficulty > 3) throw new RangeError('Enemy difficulty must be 1, 2, or 3.');
  const region = regionAt(x,y), p = WORLD_ENEMY_PROFILES[region.id];
  const entries = REGIONAL_ENEMY_FACTIONS[p.family].tiers[difficulty];
  return entries.map((entry,index)=>{
    const enemy = {...entry, name: `${p.names[index]} ${progressionNames[difficulty]}`};
    if(p.extra==='steppe') { enemy.weapon = ['composite-bow', difficulty===1?'javelins':'heavy-javelins', 'military-spear', 'shamshir', difficulty===3?'battle-glaive':'war-scythe', 'short-bow'][index]; enemy.shield = [0,4,5].includes(index)?null:'adarga'; }
    if(p.extra==='cult' && index>=4) { enemy.weapon=index===4?'military-cleaver':'war-scythe'; enemy.shield=null; }
    return enemy;
  });
}
export function worldCampText(x,y,enemyCount,index) {
  const region=regionAt(x,y),p=WORLD_ENEMY_PROFILES[region.id];
  return { factionId:region.id, factionLabel:p.label, name:`${p.camps[index%p.camps.length]} ${index+1}`, description:`${enemyCount} ${p.label.toLowerCase()} hold this position in ${region.name}. Survivors may establish another camp after three days.` };
}
// Stable rolls use authored IDs, campaign seed and generation, never the frame clock.
function hash(value) { let h=2166136261;for(const char of String(value)){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0; }
const pools = new Map();
function regionalDesign(item,p) {
  if(!p.collections.includes(item.collection))return false;
  const ancient=/ancient|decayed/.test(item.id), cult=/cultist|monk|dark-cowl|wizard|witchhunter/.test(item.id);
  if(p.extra==='cult')return ancient||cult||/robe|hood|mail|scythe/.test(item.id);
  if(ancient||cult||/vizier|noble-gear|noble-headgear|jester|straw|apron|mouth-piece/.test(item.id))return false;
  if(p.extra==='hunt')return /leather|tunic|gambeson|surcoat|padded|mail|hood|hat|cap|werewolf/.test(item.id);
  return true;
}
export function regionalOutfit(enemy,seed,index,x,y,difficulty,{champions=true}={}) {
  if(difficulty===0)return {...enemy};
  const result={...enemy,name:enemy.name.replace(/ Champion$/,'')},p=WORLD_ENEMY_PROFILES[regionAt(x,y).id],role=enemyCombatRole(enemy);
  for(const slot of ['armor','helmet']) {
    const ranged=role==='ranged',skirmish=role==='skirmisher';
    const max=ranged?(slot==='armor'?90:110):skirmish?[0,85,120,150][difficulty]:[0,slot==='armor'?100:110,slot==='armor'?190:210,slot==='armor'?320:350][difficulty];
    const min=ranged?[0,5,15,25][difficulty]:[0,15,55,100][difficulty];
    const fatigueMax=ranged?(slot==='armor'?12:8):skirmish?(slot==='armor'?18:10):50;
    const key=`${regionAt(x,y).id}:${role}:${difficulty}:${slot}`;
    if(!pools.has(key))pools.set(key,DLC_ITEMS.filter(item=>item.slot===slot&&item.sourceKind==='ordinary'&&item.armor>=min&&item.armor<=max&&item.fatigue<=fatigueMax&&regionalDesign(item,p)));
    const choices=pools.get(key);
    if(choices.length)result[slot]=choices[hash(`${seed}:${index}:${slot}`)%choices.length].id;
  }
  // Reclaimed decorative layers enter regional outfits as real armor attachments.
  if(difficulty>=2&&hash(`${seed}:${index}:reclaimed-attachment`)%5===0){
    const region=regionAt(x,y).id;
    const attachments=['northern-highlands','greenwood'].includes(region)?['northern-pelt-mantle']
      :region==='blackwater-basin'?['ancient-gilded-collar']
      :['western-marches','eastern-frontier','southern-marches','saffron-coast','sunlands'].includes(region)?['noble-brocade-mantle']:[];
    if(attachments.length)result.attachment=attachments[0];
  }
  // A single elite leader may carry a named trophy; legendary relics stay out of common outfits.
  if(champions&&difficulty===3&&index===0&&hash(`${seed}:champion`)%8===0) {
    const slot=hash(`${seed}:trophy-slot`)%2?'armor':'helmet';
    const trophies=DLC_ITEMS.filter(item=>item.slot===slot&&item.rarity==='named'&&(item.sourceKind!=='legendary'||item.id==='bb-fangshire')&&(p.collections.includes(item.collection)||['northern-highlands','greenwood'].includes(regionAt(x,y).id)&&['lindwurm','supporter-edition'].includes(item.collection))&&item.armor<=(role==='ranged'?110:role==='skirmisher'?180:400));
    if(trophies.length){result[slot]=trophies[hash(`${seed}:trophy`)%trophies.length].id;result.name=`${result.name} Champion`;}
  }
  return result;
}
export function enemyRoleBonuses(enemy,difficulty) {
  const role=enemyCombatRole(enemy);
  if(difficulty===0)return {perks:[],meleeSkill:0,rangedSkill:0,initiative:0};
  return {perks:difficulty===3?[role==='ranged'?'bullseye':role==='shield'?'shield-expert':role==='skirmisher'?'quick-hands':'backstabber']:[],meleeSkill:role==='melee'?3:0,rangedSkill:role==='ranged'||role==='skirmisher'?5:0,initiative:role==='ranged'||role==='skirmisher'?8:0};
}
