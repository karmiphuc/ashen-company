// Spend only points already earned by the shared XP/level rules. No XP, levels,
// equipment or catch-up rewards are generated here. HP changes follow normal
// training/perk rules.
export function spendRivalLevelUps(state,context){
 for(const member of state.party){
  const priorities=member.combatRole==='ranged'
   ?['rangedSkill','rangedDefense','maxFatigue']
   :member.combatRole==='reach-support'
    ?['meleeSkill','maxFatigue','meleeDefense']
    :['meleeSkill','meleeDefense','maxFatigue'];
  while(member.pendingLevelUps.length){
   const result=context.train(state,member.id,priorities);
   if(!result.ok)throw new TypeError(`Rival training failed: ${result.message}`);
  }
  while(context.points(member)>0){
   const choices=context.choices(member).slice().sort((a,b)=>a.id.localeCompare(b.id,'en'));
   if(!choices.length)break;
   const roll=context.hash(`${member.seed}:rival-perk:${member.level}:${member.perks.length}:v1`);
   const result=context.learn(state,member.id,choices[roll%choices.length].id);
   if(!result.ok)throw new TypeError(`Rival perk failed: ${result.message}`);
  }
 }
 return state;
}
