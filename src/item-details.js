import { getItem } from './engine.js';

const ROLES = {
  'patched-coat': 'Very light body cover for a new recruit; its 20 armor wears out quickly.',
  'quilted-jack': 'Affordable early body armor with more staying power than a patched coat and little fatigue load.',
  'leather-vest': 'A light upgrade for a front-line fighter who still needs speed and stamina.',
  'padded-gambeson': 'A balanced middle step: more protection than leather without the weight of mail.',
  'mail-shirt': 'Solid body protection for a fighter who can spare more fatigue and initiative.',
  'reinforced-mail': 'Heavy mid-tier cover that preserves more health through repeated body hits.',
  brigandine: 'Strong front-line armor; the 25-point load makes the wearer slower and easier to tire.',
  'plate-harness': 'Maximum body protection for a veteran; the 38-point load sharply cuts stamina and initiative.',
  'cloth-hood': 'Almost weightless head cover; replace it before facing hard-hitting enemies.',
  'leather-cap': 'A cheap, light improvement over a hood for a recruit or archer.',
  'iron-helm': 'The first substantial helmet, trading some initiative for safer head hits.',
  'kettle-helm': 'A sturdy mid-tier helmet with more protection and load than iron.',
  bascinet: 'Strong head armor for a front-line fighter who is not ready for a greathelm.',
  greathelm: 'The toughest helmet here, with a large fatigue and initiative cost.',
  'arming-sword': 'Reliable one-handed damage with a small accuracy bonus; works well beside a shield.',
  spear: 'A forgiving one-handed starter weapon with a large hit bonus, but weaker armor damage.',
  'wood-axe': 'Cheap, hard armor damage and high base damage, offset by a hit penalty.',
  bludgeon: 'Steady one-handed strikes that deal more health damage through armor than ordinary weapons.',
  'rondel-dagger': 'An accurate armor-gap weapon: strong damage through armor but low base and armor damage.',
  billhook: 'A two-handed melee weapon that can strike from two hexes away; its attacks are tiring.',
  'hunting-bow': 'Four-hex ranged pressure without a reload turn; each shot uses ammunition and struggles against armor.',
  'light-crossbow': 'A stronger five-hex ranged shot with a hit bonus and armor pressure, followed by a reload turn.',
  buckler: 'A light shield for modest melee and ranged defense without much fatigue load.',
  'round-shield': 'A balanced shield with more defense than a buckler at a moderate load.',
  'kite-shield': 'The strongest shield defense here, but its weight reduces stamina and initiative most.',
};

function signed(value) { return value > 0 ? `+${value}` : String(value); }

export function getItemDetails(item, condition) {
  const base = item?.baseId ? getItem(item.baseId) : item;
  if (!item || !base || !Object.hasOwn(ROLES, base.id)) return null;
  const stats = [];
  const notes = [];
  const bonuses = item.rarity === 'famed' && Array.isArray(item.bonuses) ? item.bonuses : [];
  if (item.slot === 'weapon') {
    const ranged = item.ranged === true;
    stats.push(
      { label: 'Base damage', value: `${item.damageMin}-${item.damageMax}` },
      { label: 'Hit modifier', value: signed(item.hitBonus ?? 0) },
      { label: 'Armor damage', value: `${Math.round((item.armorDamage ?? 1) * 100)}% of base hit` },
      { label: 'Damage through armor', value: `${Math.round((item.armorPiercing ?? .30) * 100)}% of base hit` },
      { label: 'Reach', value: `${item.range ?? 1} ${item.range === 1 || item.range === undefined ? 'hex' : 'hexes'}` },
      { label: 'Attack skill', value: ranged ? 'Ranged' : 'Melee' },
      { label: 'Attack fatigue', value: String(item.fatigueCost ?? (ranged ? 9 : 11)) },
      { label: 'Hands', value: item.twoHanded ? 'Two; shield stowed' : 'One; shield allowed' },
    );
    if (ranged) {
      stats.push({ label: 'Ammunition', value: '1 per shot' });
      if (item.reloadTurns) stats.push({ label: 'Reload', value: `${item.reloadTurns} turn after each shot` });
      notes.push('Ranged attacks use ranged skill and ranged defense; firing next to an enemy has a 12-point hit penalty.');
      notes.push('Without ammunition, the fighter falls back to an 8-12 damage unarmed melee attack.');
    } else if ((item.range ?? 1) > 1) {
      notes.push('Extra reach still uses melee skill and melee defense; it does not spend ammunition.');
    }
    notes.push('Hit modifier changes hit chance in percentage points before other bonuses and penalties.');
    notes.push('Remaining armor reduces direct health damage. Damage that breaks through armor can add more health damage.');
    notes.push('For every weapon, 22% of landed hits strike the head. A head hit adds 10% armor damage and 25% health damage; this weapon has no extra head-hit bonus.');
  } else if (item.slot === 'shield') {
    stats.push(
      { label: 'Melee defense', value: signed(item.defense ?? 0) },
      { label: 'Ranged defense', value: signed(item.defense ?? 0) },
      { label: 'Fatigue load', value: String(item.fatigue ?? 0) },
    );
    notes.push('A shield makes attacks less likely to hit. It does not provide body or head armor durability.');
    notes.push('Its fatigue load lowers both maximum fatigue and initiative by the same amount, subject to minimums.');
    notes.push('A two-handed weapon stows the shield before combat.');
  } else if (item.slot === 'armor' || item.slot === 'helmet') {
    const maximum = item.armor ?? 0;
    const current = Number.isFinite(condition) ? Math.max(0, Math.min(maximum, Math.floor(condition))) : maximum;
    stats.push(
      { label: item.slot === 'armor' ? 'Body armor' : 'Head armor', value: `${current} / ${maximum}` },
      { label: 'Fatigue load', value: String(item.fatigue ?? 0) },
    );
    notes.push(item.slot === 'armor'
      ? 'Body armor is damaged by body hits. Head hits use the helmet instead.'
      : 'For every weapon, 22% of landed hits strike the head; this helmet absorbs those hits.');
    notes.push('Armor can still let reduced health damage through while durability remains.');
    notes.push('Its fatigue load lowers both maximum fatigue and initiative by the same amount, subject to minimums.');
  }
  const role = item.rarity === 'famed'
    ? `A rare ${base.name.toLowerCase()} with ${bonuses.map(row => `${String(row.label).toLowerCase()} ${row.value}`).join(', ')} compared with the ordinary version.`
    : ROLES[base.id];
  return {
    description: item.description,
    role,
    rarity: item.rarity,
    baseName: item.baseId ? base.name : null,
    bonuses,
    stats,
    notes,
  };
}
