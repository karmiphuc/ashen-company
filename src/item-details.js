import { getItem, shieldMaximum, shieldImpactDamage, throwingCapacity } from './engine.js';
import { equipmentSkills, weaponSkillFamily } from './combat-skills.js';

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
  if (!item || !base) return null;
  const baseRole = ROLES[base.id] || base.role;
  if (!baseRole) return null;
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
      { label: 'Attack AP', value: `${['dagger', 'qatal'].includes(weaponSkillFamily(item)) || item.reloadTurns ? 3 : !ranged && (item.twoHanded || (item.range ?? 1) > 1) ? 6 : 4} (new battles)` },
      { label: 'Attack fatigue', value: String(item.fatigueCost ?? (ranged ? 9 : 11)) },
      { label: 'Hands', value: item.twoHanded ? 'Two; shield stowed' : 'One; shield allowed' },
    );
    if (ranged) {
      stats.push({ label: 'Ammunition', value: item.throwing ? '1 bundle charge per throw' : '1 per shot' });
      if (item.throwing) stats.push({ label: 'Bundle throws', value: `${Number.isFinite(condition) ? Math.max(0, Math.min(throwingCapacity(item), condition)) : throwingCapacity(item)} / ${throwingCapacity(item)}` });
      if (item.reloadTurns) stats.push({ label: 'Reload', value: '4 AP after each shot (new battles)' });
      notes.push('Ranged attacks use ranged skill and ranged defense. The battle AI tries to keep at least two hexes from every enemy when it can.');
      notes.push('Bow and crossbow fighters keep their distance while ammunition remains. When ammunition runs out, they draw a pocket weapon or reserve melee set and fight according to the selected tactic. Drawing or switching costs 4 AP in new battles; Quick Hands makes the first swap each round free.');
      if (item.throwing) notes.push('Throwing weapons are one-handed and carry five throws per bundle. Active and reserve bundles have separate counts, preserved when swapping or stowing. After battle, equipped bundles refill from company ammunition, one supply per restored throw; shortages leave partial bundles. Carry a spare bundle or melee weapon. Without a usable backup, the fighter punches.');
      if (item.ranged && !item.throwing && !item.twoHanded) notes.push('This ranged weapon leaves the other hand free for a shield.');
      if (!item.throwing) notes.push('A bow or crossbow shot from an adjacent hex has a 12-point hit penalty if the fighter cannot reposition or switch to melee.');
      notes.push('Throwers switch to a melee backup when enemies close or ammunition runs out. A fighter trapped without a usable weapon can only make the basic unarmed attack.');
    } else if ((item.range ?? 1) > 1) {
      notes.push('Extra reach still uses melee skill and melee defense; it does not spend ammunition.');
    }
    if (shieldImpactDamage(item)) {
      stats.push({ label: 'Shield damage', value: `${shieldImpactDamage(item)} per hit or block` });
      notes.push('Axes and thrown spears damage an active shield even when the attack is blocked. Shield Expert halves this wear; a broken shield stays repairable.');
    }
    if (item.pocketWeapon) {
      notes.push('The battle AI draws this pocket weapon when a ranged fighter is forced into close combat and returns it to the pocket when range opens and ammunition remains. Drawing or returning it costs 4 AP in new battles.');
    }
    notes.push('Hit modifier changes hit chance in percentage points before other bonuses and penalties.');
    notes.push('Remaining armor reduces direct health damage. Damage that breaks through armor can add more health damage.');
    notes.push('Ordinary attacks: 22% of landed hits strike the head. A head hit adds 10% armor damage and 25% health damage. Body-only and head-targeting skills override this chance.');
    notes.push('Signature skills apply to newly started battles. Existing active battles finish with the rules they started under. The AI chooses affordable skills using the personal preference and company tactic.');
  } else if (item.slot === 'shield') {
    const maximum = shieldMaximum(item.id);
    const current = Number.isFinite(condition) ? Math.max(0, Math.min(maximum, Math.floor(condition))) : maximum;
    stats.push(
      { label: 'Shield durability', value: `${current} / ${maximum}${current === 0 ? ' (broken)' : ''}` },
      { label: 'Melee defense', value: signed(current > 0 ? item.defense ?? 0 : 0) },
      { label: 'Ranged defense', value: signed(current > 0 ? item.defense ?? 0 : 0) },
      { label: 'Fatigue load', value: String(item.fatigue ?? 0) },
    );
    notes.push('A shield makes attacks less likely to hit. It does not provide body or head armor durability.');
    notes.push('Incoming melee attacks and blocked arrows wear down the active shield. Axes and thrown spears inflict heavy shield damage on hits and blocks. At zero durability it provides no shield defense or shield perk bonuses. It stays repairable; rest with tools or visit a Smithy to repair active and reserve shields.');
    notes.push('Its fatigue load lowers both maximum fatigue and initiative by the same amount, subject to minimums.');
    notes.push('A two-handed weapon stows the shield before combat.');
  } else if (item.slot === 'attachment') {
    const maximum = item.armor ?? 0;
    const current = Number.isFinite(condition) ? Math.max(0, Math.min(maximum, Math.floor(condition))) : maximum;
    stats.push(
      { label: 'Attachment armor', value: `${current} / ${maximum}` },
      { label: 'Fatigue load', value: String(item.fatigue ?? 0) },
      { label: 'Armor per fatigue', value: item.fatigue > 0 ? String(Math.round(maximum / item.fatigue * 10) / 10) : 'Weightless' },
    );
    notes.push('Fits one dedicated attachment slot and requires body armor. It absorbs body armor damage before the main suit; head hits still use the helmet.');
    notes.push('Swapping body armor keeps the attachment fitted. Stowing body armor also stows its attachment, preserving both items and their condition.');
    notes.push('Its weight lowers maximum fatigue and initiative. Camp tools and the Smithy repair its durability. Padding and leather reinforcement sit beneath the armor; outer mantles and pauldrons appear on the portrait.');
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
  } else if (item.slot === 'mount') {
    stats.push(
      { label: 'Company travel speed', value: `+${Math.round(item.travelBonus * 100)}% while equipped` },
      { label: 'Hit chance', value: `+${item.hitBonus} percentage points` },
      { label: 'Attack damage', value: `+${Math.round(item.damageBonus * 100)}%` },
      { label: 'Combat movement', value: `+${item.movementBonus} movement points per turn` },
      { label: 'Initiative', value: `+${item.initiativeBonus}` },
      { label: 'Extra daily food', value: String(item.foodUpkeep) },
    );
    notes.push('One mount fits the dedicated mount slot. Each living mounted brother adds 10% to company travel speed; three mounts give +30%. Stashed mounts give no bonus and consume no food.');
    notes.push('Mounted fighters control adjacent hexes: enemies may enter or move within this zone, but cannot step out while the rider lives. This applies to both sides.');
    notes.push('Highpass receives one Riding Horse on days 8, 22, 36 and every 14 days after. It stays on sale through that week until bought. Large towns and castles also have a 2% weekly chance of a rare mount; late-game mounted enemies may surrender their mount as victory loot.');
    notes.push('The movement bonus only helps movement, never grants another attack, and still respects terrain, occupied hexes, and your formation tactic. Mounted attacks retain normal range and ammunition costs.');
    notes.push('Mounts are extremely rare in large town and castle markets. A defeated mounted enemy may leave a surviving mount to capture.');
  } else if (item.slot === 'accessory') {
    if (item.consumable === 'heal') {
      stats.push({ label: 'Effect', value: `Restores up to ${item.heal ?? 0} health` }, { label: 'Uses', value: 'One' });
      notes.push('At 50% health or lower, the battle AI prioritizes healing even in melee. Use consumes the item and 4 AP in new battles; Combat Bandaging makes the first healing item each round cost no AP. Healing never repairs armor.');
    } else if (item.consumable === 'recover') {
      stats.push({ label: 'Effect', value: `Reduces fatigue by ${item.recover ?? 0}` }, { label: 'Uses', value: 'One' });
      notes.push('At 75% of maximum fatigue or higher, with enemies at least two hexes away, the battle AI may use it. Use consumes the item and 4 AP in new battles.');
    } else {
      stats.push({ label: 'Uses', value: 'One' });
    }
    notes.push('Consumables occupy one of the two accessory slots and are removed after use. Free healing keeps the fighter ready for another action.');
  }
  for (const skill of equipmentSkills(item)) {
    stats.push({ label: skill.name, value: `${skill.ap} AP${skill.fatigue ? ` · ${skill.fatigue} fatigue before masteries` : ''}` });
    notes.push(`${skill.name}: ${skill.description}`);
  }
  if (item.slot === 'weapon') notes.push('A matching weapon mastery reduces attacks and weapon skills by 1 AP, once even with overlapping masteries. Base costs are shown above; shield skills, reloads and reactions are unchanged.');
  const role = item.rarity === 'famed'
    ? `A rare ${base.name.toLowerCase()} with ${bonuses.map(row => `${String(row.label).toLowerCase()} ${row.value}`).join(', ')} compared with the ordinary version.`
    : baseRole;
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
