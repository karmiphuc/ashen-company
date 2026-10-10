export const PERFORMANCE_KEYS = Object.freeze(['kills','armorDamageDealt','hpDamageDealt','armorDamageReceived']);
export const newBattlePerformance = () => Object.fromEntries(PERFORMANCE_KEYS.map(key => [key,0]));

// Actual losses, not damage rolls: overkill and armor beyond durability do not count.
// Optional counters keep legacy battles honest rather than inventing a full history.
export function recordBattlePerformance(actor,target,hpLost,armorLost,killed) {
  if (target.battleStats) target.battleStats.armorDamageReceived += armorLost;
  if (actor.side === target.side || !actor.battleStats) return;
  actor.battleStats.hpDamageDealt += hpLost;
  actor.battleStats.armorDamageDealt += armorLost;
  if (killed) actor.battleStats.kills++;
}

export const MVP_CATEGORIES = Object.freeze({kills:'Most Lethal',armorDamageReceived:'Tanker',armorDamageDealt:'Tank Killer',hpDamageDealt:'Assassin'});
export function battleMvpAwards(units) {
  const brothers=units.filter(u=>u.side==='company'&&!u.ally), awards=new Map();
  for(const [key,label] of Object.entries(MVP_CATEGORIES)) {
    const maximum=Math.max(0,...brothers.map(u=>u.battleStats?.[key]??0));
    if(maximum===0)continue;
    for(const unit of brothers)if(unit.battleStats?.[key]===maximum){
      if(!awards.has(unit.id))awards.set(unit.id,{});
      awards.get(unit.id)[key]=label;
    }
  }
  return awards;
}
