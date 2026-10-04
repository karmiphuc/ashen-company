// Culture is separate from protection tier: an elite hunter still travels light.
export function armoryTheme(regionId) {
  return regionId === 'northern-highlands' ? 'north'
    : ['sunlands', 'saffron-coast', 'far-steppe', 'southern-marches'].includes(regionId) ? 'south'
    : regionId === 'greenwood' ? 'forest' : regionId === 'blackwater-basin' ? 'cult' : 'mercenary';
}
export function matchesArmoryTheme(item, theme) {
  const id = item.baseId ?? item.id;
  const ancient = /ancient|decayed/.test(id);
  const cult = /cultist|^bb-monk|dark-cowl|wizard|witchhunter/.test(id);
  if (theme === 'ancient') return /ancient/.test(id);
  if (ancient) return false;
  if (theme === 'cult') return cult || /robe|hood|cowl/.test(id);
  if (cult || /vizier|noble-gear|noble-headgear|jester|straw|apron|mouth-piece/.test(id)) return false;
  if (theme === 'north') return item.region === 'north' || /nordic|plated-fur|skull-and-chain/.test(id);
  if (theme === 'south') return item.region === 'south' || item.collection === 'blazing-deserts';
  if (item.region === 'north' || item.region === 'south' || ['warriors-of-the-north','blazing-deserts'].includes(item.collection)) return false;
  if (theme === 'forest') return /leather|tunic|gambeson|surcoat|padded|mail|hood|hat|cap|werewolf/.test(id)
    && (item.slot === 'armor' ? item.armor <= 150 && item.fatigue <= 15 : item.armor <= 110 && item.fatigue <= 9);
  return true;
}

export function isAncientHelmet(item) {
  return item?.slot === 'helmet' && matchesArmoryTheme(item, 'ancient');
}
