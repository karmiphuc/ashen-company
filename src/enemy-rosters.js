const template = (name, weapon, armor, helmet, shield = null) => Object.freeze({ name, weapon, armor, helmet, shield });

const faction = (id, label, campNames, description, tiers) => Object.freeze({
  id,
  label,
  campNames: Object.freeze(campNames),
  description,
  tiers: Object.freeze(Object.fromEntries(Object.entries(tiers).map(([tier, entries]) => [tier, Object.freeze(entries)]))),
});

export const REGIONAL_ENEMY_FACTIONS = Object.freeze({
  south: faction('south', 'Southern Nomads', ['Nomad Encampment', 'Dustwind Camp', 'Adarga Camp'], 'southern nomads and cutthroats', {
    1: [
      template('Nomad Bow Skirmisher', 'short-bow', 'nomad-robe', 'nomad-head-wrap'),
      template('Dustroad Cutthroat', 'qatal-dagger', 'patched-coat', 'southern-turban', 'adarga'),
      template('Adarga Spear', 'fighting-spear', 'nomad-robe', 'nomad-head-wrap', 'adarga'),
      template('Desert Archer', 'composite-bow', 'nomad-robe', 'southern-turban'),
      template('Caravan Waylayer', 'javelins', 'leather-lamellar', 'nomad-head-wrap', 'adarga'),
      template('Oasis Shamshir', 'shamshir', 'leather-lamellar', 'southern-turban', 'adarga'),
    ],
    2: [
      template('Qatal Ambusher', 'qatal-dagger', 'leather-lamellar', 'southern-turban', 'adarga'),
      template('Dune Bowmaster', 'composite-bow', 'nomad-robe', 'southern-turban'),
      template('Lamellar Lancer', 'military-spear', 'leather-lamellar', 'southern-helmet', 'adarga'),
      template('Shamshir Raider', 'shamshir', 'southern-mail', 'southern-turban', 'adarga'),
      template('Sandstorm Skirmisher', 'throwing-spears', 'nomad-robe', 'nomad-head-wrap', 'adarga'),
      template('Nomad Glaiveman', 'war-scythe', 'leather-lamellar', 'southern-turban'),
    ],
    3: [
      template('Emirate Freeblade', 'shamshir', 'reinforced-lamellar', 'southern-helmet', 'adarga'),
      template('Gilded Qatal', 'qatal-dagger', 'southern-mail', 'southern-turban', 'adarga'),
      template('Desert Warbow', 'warbow', 'nomad-robe', 'southern-turban'),
      template('Scorpion Glaive', 'battle-glaive', 'reinforced-lamellar', 'southern-helmet'),
      template('Dune Guard', 'military-spear', 'coat-of-scales', 'southern-helmet', 'adarga'),
      template('Swift Sandstrider', 'heavy-javelins', 'leather-lamellar', 'nomad-head-wrap', 'adarga'),
    ],
  }),
  north: faction('north', 'Northern Reavers', ['Reaver Hold', 'Wolf Camp', 'Frostbound Camp'], 'northern reavers and axe-bearing clansmen', {
    1: [
      template('Wolfskin Raider', 'hand-axe', 'wolf-gambeson', 'leather-cap', 'round-shield'),
      template('Frost Spear', 'fighting-spear', 'patched-coat', 'barbarian-helmet', 'round-shield'),
      template('Cliffside Axethrower', 'throwing-axes', 'wolf-gambeson', 'cloth-hood', 'buckler'),
      template('Pelt Bowhunter', 'hunting-bow', 'wolf-gambeson', 'cloth-hood'),
      template('Crag Cleaver', 'falchion', 'leather-vest', 'barbarian-helmet', 'round-shield'),
      template('Longaxe Youngblood', 'longaxe', 'patched-coat', 'leather-cap'),
    ],
    2: [
      template('Iron Wolf', 'hand-axe', 'riveted-leather', 'barbarian-helmet', 'painted-round-shield'),
      template('Reaver Axethrower', 'heavy-throwing-axes', 'wolf-gambeson', 'barbarian-helmet', 'round-shield'),
      template('Longaxe Huscarle', 'longaxe', 'sleeveless-hauberk', 'barbarian-helmet'),
      template('Northroad Breaker', 'goedendag', 'riveted-leather', 'iron-helm'),
      template('Icefield Spear', 'throwing-spears', 'wolf-gambeson', 'barbarian-helmet', 'painted-round-shield'),
      template('Raven Bow', 'warbow', 'wolf-gambeson', 'leather-cap'),
    ],
    3: [
      template('Wolf Clan Chieftain', 'greataxe', 'riveted-mail', 'barbarian-helmet'),
      template('Oathsworn Huscarle', 'military-cleaver', 'reinforced-mail', 'full-helm', 'painted-round-shield'),
      template('Frostmaul Veteran', 'two-handed-hammer', 'scale-shirt', 'barbarian-helmet'),
      template('Ravenstorm Thrower', 'heavy-javelins', 'wolf-gambeson', 'barbarian-helmet', 'painted-round-shield'),
      template('Northwind Longbow', 'warbow', 'wolf-gambeson', 'mail-coif'),
      template('Blooded Longaxe', 'longaxe', 'sleeveless-hauberk', 'barbarian-helmet'),
    ],
  }),
  forest: faction('forest', 'Woodland Outlaws', ['Poacher Den', 'Greenwood Hideout', 'Forester Camp'], 'poachers and hunters hidden beneath the trees', {
    1: [
      template('Greenwood Poacher', 'hunting-bow', 'patched-coat', 'cloth-hood'),
      template('Snareline Hunter', 'short-bow', 'wolf-gambeson', 'cloth-hood'),
      template('Brush Knife', 'fighting-knife', 'patched-coat', 'cloth-hood', 'buckler'),
      template('Forester Spear', 'spear', 'leather-vest', 'leather-cap', 'round-shield'),
      template('Timber Ambusher', 'wood-axe', 'quilted-jack', 'cloth-hood'),
      template('Briar Billman', 'billhook', 'patched-coat', 'leather-cap'),
    ],
    2: [
      template('Hartwood Marksman', 'warbow', 'wolf-gambeson', 'cloth-hood'),
      template('Blackbriar Poacher', 'hunting-bow', 'riveted-leather', 'leather-cap'),
      template('Thicket Skirmisher', 'javelins', 'quilted-jack', 'cloth-hood', 'buckler'),
      template('Forester Billhook', 'hooked-bill', 'leather-vest', 'kettle-helm'),
      template('Oakshield Outlaw', 'falchion', 'riveted-leather', 'leather-cap', 'heater-shield'),
      template('Boar Spear Veteran', 'military-spear', 'sleeveless-hauberk', 'mail-coif', 'round-shield'),
    ],
    3: [
      template('Kingswood Deadeye', 'warbow', 'wolf-gambeson', 'cloth-hood'),
      template('Old Stag Captain', 'longsword', 'noble-tabard', 'sallet'),
      template('Ironbark Shield', 'winged-mace', 'reinforced-mail', 'kettle-helm', 'painted-heater-shield'),
      template('Deepwood Glaive', 'battle-glaive', 'sleeveless-hauberk', 'mail-coif'),
      template('Silent Arbalester', 'heavy-crossbow', 'riveted-leather', 'cloth-hood'),
      template('Briarwood Scout', 'throwing-spears', 'wolf-gambeson', 'leather-cap', 'buckler'),
    ],
  }),
  east: faction('east', 'Eastern Freeblades', ['Freeblade Muster', 'Deserter Redoubt', 'Mercenary Camp'], 'mercenaries and battle-hardened deserters', {
    1: [
      template('Roadspear Deserter', 'fighting-spear', 'quilted-jack', 'iron-helm', 'heater-shield'),
      template('Freeblade Crossbow', 'light-crossbow', 'leather-vest', 'leather-cap'),
      template('Payless Swordsman', 'arming-sword', 'padded-gambeson', 'iron-helm', 'heater-shield'),
      template('Marching Billman', 'billhook', 'quilted-jack', 'kettle-helm'),
      template('Camp Skirmisher', 'javelins', 'leather-vest', 'leather-cap', 'buckler'),
      template('Company Falchion', 'falchion', 'padded-gambeson', 'iron-helm', 'round-shield'),
    ],
    2: [
      template('Contract Shieldman', 'military-spear', 'sleeveless-hauberk', 'sallet', 'painted-heater-shield'),
      template('Deserter Arbalester', 'reinforced-crossbow', 'riveted-leather', 'kettle-helm'),
      template('Free Company Bill', 'hooked-bill', 'mail-shirt', 'iron-helm'),
      template('Hardened Cleaver', 'military-cleaver', 'reinforced-mail', 'sallet', 'heater-shield'),
      template('Campaign Hammer', 'warhammer', 'brigandine', 'flat-top-helm', 'painted-round-shield'),
      template('Veteran Skirmisher', 'heavy-javelins', 'riveted-leather', 'kettle-helm', 'heater-shield'),
    ],
    3: [
      template('Free Company Captain', 'longsword', 'noble-tabard', 'full-helm'),
      template('Old Guard Shield', 'winged-mace', 'plate-cuirass', 'full-helm', 'painted-tower-shield'),
      template('Siege Arbalester', 'heavy-crossbow', 'sleeveless-hauberk', 'sallet'),
      template('Campaign Polehammer', 'polehammer', 'brigandine', 'barbute'),
      template('Greatsword Deserter', 'greatsword', 'reinforced-mail', 'bascinet'),
      template('Lightfoot Veteran', 'arming-sword', 'wolf-gambeson', 'sallet', 'painted-heater-shield'),
    ],
  }),
});

function coordinates(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError('Enemy region coordinates must be finite numbers.');
  return { x, y };
}

export function getRegionalEnemyFaction(x, y) {
  coordinates(x, y);
  if (y >= 900) return REGIONAL_ENEMY_FACTIONS.south;
  if (y <= 300) return REGIONAL_ENEMY_FACTIONS.north;
  if (x >= 1450) return REGIONAL_ENEMY_FACTIONS.east;
  return REGIONAL_ENEMY_FACTIONS.forest;
}

export function getRegionalEnemyTemplates(x, y, difficulty) {
  if (!Number.isSafeInteger(difficulty) || difficulty < 1 || difficulty > 3) throw new RangeError('Regional enemy difficulty must be 1, 2, or 3.');
  return getRegionalEnemyFaction(x, y).tiers[difficulty].map(entry => ({ ...entry }));
}

export function getRegionalCampText(x, y, difficulty, enemyCount, campIndex = 0) {
  if (!Number.isSafeInteger(difficulty) || difficulty < 1 || difficulty > 3) throw new RangeError('Regional camp difficulty must be 1, 2, or 3.');
  if (!Number.isSafeInteger(enemyCount) || enemyCount < 1) throw new RangeError('Regional camp enemy count must be a positive integer.');
  if (!Number.isSafeInteger(campIndex) || campIndex < 0) throw new RangeError('Regional camp index must be a non-negative integer.');
  const regionalFaction = getRegionalEnemyFaction(x, y);
  const campName = regionalFaction.campNames[campIndex % regionalFaction.campNames.length];
  return {
    factionId: regionalFaction.id,
    factionLabel: regionalFaction.label,
    name: `${campName} ${campIndex + 1}`,
    description: `${enemyCount} ${regionalFaction.description} occupy this camp. Survivors may establish another camp after three days.`,
  };
}
