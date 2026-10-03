export function enemyProgression(state, difficulty) {
  const living = state.party.filter(person => person.hp > 0);
  const core = living.map(person => person.level ?? 1).sort((a, b) => b - a).slice(0, 6);
  const level = core.length ? core.reduce((total, value) => total + value, 0) / core.length : 1;
  const levelRank = Math.max(0, Math.floor((level - 3) / 2));
  const ageRank = Math.max(0, Math.floor((state.day - 7) / 7));
  const rank = difficulty < 2 ? 0 : Math.min(difficulty === 2 ? 3 : 10, levelRank, ageRank);
  return {
    rank,
    reinforcements: rank ? Math.min(6, Math.max(0, Math.floor((living.length - 4) / 2)) + Math.floor(rank / 2)) : 0,
    cavalry: difficulty === 3 && state.day >= 35 && level >= 9,
  };
}


// Preserve starter/medium rosters. Elite forces grow with company numbers and
// the existing level-and-age gates; seed-authored base size gives 18–20 elites
// against a full veteran line rather than making every fight identical.
export function enemyRosterSize(state,difficulty,baseCount){
 const progression=enemyProgression(state,difficulty);
 const normal=Math.min(12,baseCount+progression.reinforcements);
 if(difficulty!==3||!progression.rank)return normal;
 const living=Math.min(15,state.party.filter(person=>person.hp>0).length);
 const target=living+Math.floor(progression.rank*1.4)-3+(baseCount%3)-1;
 return Math.min(20,Math.max(normal,target));
}
