const REWARDS = Object.freeze([
  Object.freeze({ id: 'war-horse', itemId: 'war-horse', name: 'War Horse', title: "Retired Outrider's Promise", townId: 'oakwatch', townName: 'Oakwatch', firstDay: 10, scene: 'A retired outrider stands beside his battle-scarred horse. He asks you to carry it with honor on the roads he can no longer ride.', acceptLabel: 'Accept the War Horse' }),
  Object.freeze({ id: 'armored-war-horse', itemId: 'armored-war-horse', name: 'Armored War Horse', title: "The Smith's Last Charger", townId: 'ironford', townName: 'Ironford', firstDay: 24, scene: 'An Ironford smith unveils the last charger he armored before the forge fire took his sight. He offers it to a company willing to put it back in the field.', acceptLabel: 'Accept the Armored Charger' }),
  Object.freeze({ id: 'dire-wolf-mount', itemId: 'dire-wolf-mount', name: 'Dire Wolf', title: "The Marsh Hunter's Bond", townId: 'blackfen', townName: 'Blackfen', firstDay: 40, scene: 'A Blackfen hunter arrives with a scarred dire wolf at his heel. The animal has chosen no rider; the hunter offers you the chance to earn its trust.', acceptLabel: 'Accept the Dire Wolf' }),
]);

function delayFor(seed, id) {
  let hash = 2166136261;
  for (const char of `${seed}:${id}:mount-reward`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % 4;
}

export function getMountRewardDefinitions() {
  return REWARDS;
}

export function scheduledMountReward(state, reward) {
  const availableDay = reward.firstDay + delayFor(state.seed, reward.id);
  return {
    ...reward,
    availableDay,
    available: state.day >= availableDay,
    daysUntilAvailable: Math.max(0, availableDay - state.day),
  };
}
