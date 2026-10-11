// Scouting estimates guide movement only. Battles always use the shared engine.
export const RIVAL_GOALS=Object.freeze({
 'gilded-road':{label:'Cautious earners',icon:'¤',margin:1.6,huntRange:80,description:'Protect wage reserves; take low-risk spoils near the supply route.'},
 'red-jackals':{label:'Loot hunters',icon:'⚒',margin:1.05,huntRange:180,description:'Pursue profitable camps and isolated bands while supplies and health permit.'},
 'bronze-oath':{label:'Road wardens',icon:'♜',margin:1.25,huntRange:130,description:'Prioritize raiders threatening caravans, then nearby road spoils.'},
});
export function rivalStrength(company,context){
 return company.party.reduce((sum,p)=>{const s=context.stats(p),fitness=.15+.85*Math.max(0,p.hp)/Math.max(1,s.maxHp);
  return sum+(s.maxHp*(.5+(s.meleeSkill+s.rangedSkill*.25)/100)+(p.armorDurability.body+p.armorDurability.head)*.25+(s.meleeDefense??0)*2)*fitness;},0);
}
export function bandStrength(band,context){
 const tier=band.difficulty??0,rank=band.veteranRank??0;
 return band.enemies.reduce((sum,e)=>{const wear=e.savedDamage,base=25+tier*12+rank*8,hp=e.hp??Math.min(300,Math.ceil(base*(e.marshal?2:e.champion?1.4:1))),skill=e.skill??e.meleeSkill??30+tier*6+rank*4+(e.champion?12:0);
  const fitness=.15+.85*(wear?.hp??hp)/Math.max(1,hp);
  return sum+(hp*(.5+skill/100)+((wear?.bodyArmor??context.itemCondition(e.armor)??0)+(wear?.headArmor??context.itemCondition(e.helmet)??0))*.25+(e.defense??2+tier*2+rank*2+(e.champion?8:0))*2)*fitness;},0);
}
export function rivalCanHunt(company,band,context){return rivalStrength(company,context)>=bandStrength(band,context)*RIVAL_GOALS[company.id].margin;}
