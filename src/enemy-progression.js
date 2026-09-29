export function enemyProgression(state, difficulty) {
  const living = state.party.filter(person => person.hp > 0);
  const core = living.map(person => person.level ?? 1).sort((a, b) => b - a).slice(0, 6);
  const level = core.length ? core.reduce((total, value) => total + value, 0) / core.length : 1;
  const levelRank = Math.max(0, Math.floor((level - 3) / 2));
  const ageRank = Math.max(0, Math.floor((state.day - 7) / 7));
  const rank = difficulty < 2 ? 0 : Math.min(difficulty === 2 ? 3 : 5, levelRank, ageRank);
  return {
    rank,
    reinforcements: rank ? Math.min(6, Math.max(0, Math.floor((living.length - 4) / 2)) + Math.floor(rank / 2)) : 0,
    cavalry: difficulty === 3 && state.day >= 35 && level >= 9,
  };
}
