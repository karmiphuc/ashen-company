import { equipmentSetsForItem, equipmentSetBonusText } from './equipment-sets.js';
import { PREFIX_EFFECTS, prefixEffectText } from './affix-prefixes.js';
import { getItem, shieldMaximum, shieldImpactDamage, throwingCapacity } from './engine.js';
import { equipmentSkills, weaponSkillFamily } from './combat-skills.js';
import { isAncientHelmet } from './armory-themes.js';

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
  const definition = item?.baseId ? getItem(item.baseId) : item;
  const base=definition?.sourceStats?{...definition,...definition.sourceStats}:definition;
  if (!item || !base) return null;
  const baseRole = ROLES[base.id] || base.role;
  if (!baseRole) return null;
  const stats = [];
  const notes = [];
  if (isAncientHelmet(item)) notes.push('Morale immunity while equipped: no positive or negative morale changes, no morale bonuses or penalties to attack and defense, and no automatic fleeing.');
  if(item.rangedRangeBonus)notes.push('Extra ranged reach applies to bows and crossbows only while armor and helmet fatigue total at most 15. Multiple Farseeing effects do not stack.');
  if(item.perkBoosts?.berserkAp)notes.push('Requires Berserk: adds bonus AP to its once-per-round kill proc, including reaction kills credited to the next turn. Equipment bonuses stack up to +2 AP total.');
  if(item.perkBoosts?.nimble)notes.push('Requires Nimble: +10 melee and ranged defense with armor and helmet fatigue at most 20. Multiple Nimble enhancements do not multiply again.');
  if(item.perkBoosts?.battleForged)notes.push('Requires Battle Forged: reduces incoming armor damage by another 5 percentage points per bonus, up to 10 points.');
  for(const [key,value] of Object.entries(item.perkBoosts??{}))if(value&&PREFIX_EFFECTS[key])notes.push(prefixEffectText(key,value));
  if(item.signatureDescription)notes.push(item.signatureDescription);
  if(item.intrinsicDescription)notes.push(item.intrinsicDescription);
  if(item.forgeVersion){notes.push(...item.forgeWarnings,'Reforged equipment preserves accumulated bonuses through equip, combat and resale. Effective company combat stats remain bounded at 300.');}
  if(item.forgeAffixes)notes.push(item.forgeAffixes.locked?'Legacy forge bonuses are preserved. Further merges are locked; full transfers preserve the restriction.':`Affix slots: ${item.forgeAffixes.prefixes.length}/2 prefixes, ${item.forgeAffixes.suffixes.length}/2 suffixes. Duplicate affixes upgrade without adding; inactive affixes still occupy slots.`);
  for(const armorSet of equipmentSetsForItem(item))notes.push(`${armorSet.name} set piece: ${armorSet.pairing} ${equipmentSetBonusText(armorSet)}. Uses rounded fitted fatigue for Nimble, Agile Defense, Fleet Footed and Brawny. Named and reforged variants count; transferring bonuses to a different design does not transfer set membership.`);
  if(item.restorationFinish)notes.push(`Restored Ancient Armory · ${item.restorationFinish === 'steel' ? 'silverish steel' : 'bronze'} finish. The original ancient design is preserved. Already restored pieces cannot be used as restoration materials. Named bonuses apply above this restored baseline.`);
  const bonuses = ['famed','named'].includes(item.rarity) && Array.isArray(item.bonuses) ? item.bonuses : [];
  if (item.slot === 'weapon') {
    const ranged = item.ranged === true;
    stats.push(
      { label: 'Base damage', value: `${item.damageMin}-${item.damageMax}` },
      { label: 'Hit modifier', value: signed((item.hitBonus ?? 0)+(item.skillHitBonus ?? 0)) },
      { label: 'Armor damage', value: `${Math.round((item.armorDamage ?? 1) * 100)}% of base hit` },
      { label: 'Damage through armor', value: `${Math.round((item.armorPiercing ?? .30) * 100)}% of base hit` },
      { label: 'Reach', value: `${item.range ?? 1} ${item.range === 1 || item.range === undefined ? 'hex' : 'hexes'}` },
      { label: 'Attack skill', value: ranged ? 'Ranged' : 'Melee' },
      { label: 'Attack AP', value: `${equipmentSkills(item)[0]?.ap??4} (new battles)` },
      { label: 'Attack fatigue', value: String(Math.max(0,(equipmentSkills(item)[0]?.fatigue ?? item.fatigueCost ?? (ranged ? 9 : 11))+(item.fatigueOnSkillUse??0))) },
      { label: 'Hands', value: item.twoHanded ? 'Two; shield stowed' : 'One; shield allowed' },
    );
    if (!ranged && !item.twoHanded) notes.push('Double Grip: +25% damage while the offhand is empty. An equipped shield, including a broken shield, prevents this bonus. Stacks with Duelist.');
    if (ranged) {
      stats.push({ label: 'Ammunition', value: item.throwing ? '1 bundle charge per throw' : '1 per shot' });
      if (item.throwing) stats.push({ label: 'Bundle throws', value: `${Number.isFinite(condition) ? Math.max(0, Math.min(throwingCapacity(item), condition)) : throwingCapacity(item)} / ${throwingCapacity(item)}` });
      if (item.reloadTurns) stats.push({ label: 'Reload', value: '4 AP after each shot (new battles)' });
      notes.push('Firing beside an armed melee opponent provokes a free Opportunity Strike before the shot. Each adjacent opponent can react; a surviving shooter can still fire.');
      notes.push('Ranged attacks use ranged skill and ranged defense. The battle AI tries to keep at least two hexes from every enemy when it can.');
      notes.push('Bow and crossbow fighters keep their distance while ammunition remains. When ammunition runs out, they draw a pocket weapon or reserve melee set and fight according to the selected tactic. Drawing or switching costs 4 AP in new battles; Quick Hands makes the first swap each round free.');
      if (item.throwing) notes.push('Throwing weapons are one-handed; the bundle capacity shown above includes any named ammunition roll. Active and reserve bundles have separate counts, preserved when swapping or stowing. After battle, equipped bundles refill from company ammunition, one supply per restored throw; shortages leave partial bundles. Carry a spare bundle or melee weapon. Without a usable backup, the fighter punches.');
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
    if(item.sourceNamedWeapon)notes.push('Named BB weapon design: base damage is adapted to campaign health. Inventory and worn art use its actual source design; the two modifiers roll against its unrolled source baseline.');
    notes.push('Hit modifier changes hit chance in percentage points before other bonuses and penalties.');
    notes.push('Remaining armor reduces direct health damage. Damage that breaks through armor can add more health damage.');
    notes.push(`Ordinary attacks: ${Math.round((item.headChance ?? .22) * 100)}% of landed hits strike the head. A head hit adds 10% armor damage and 25% health damage. Body-only and head-targeting skills override this chance.`);
    notes.push('Signature skills apply to newly started battles. Existing active battles finish with the rules they started under. The AI chooses affordable skills using the personal preference and company tactic.');
  } else if (item.slot === 'shield') {
    const maximum = shieldMaximum(item.id);
    const current = Number.isFinite(condition) ? Math.max(0, Math.min(maximum, Math.floor(condition))) : maximum;
    stats.push(
      { label: 'Shield durability', value: `${current} / ${maximum}${current === 0 ? ' (broken)' : ''}` },
      { label: 'Melee defense', value: signed(current > 0 ? item.defense ?? 0 : 0) },
      { label: 'Ranged defense', value: signed(current > 0 ? item.rangedDefense??item.defense??0 : 0) },
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
    if(item.rangedDefenseBonus)stats.push({label:'Ranged defense',value:signed(item.rangedDefenseBonus)});
    if(item.initiativeBonus)stats.push({label:'Initiative',value:signed(item.initiativeBonus)});
    if(item.rangedDamageReduction)stats.push({label:'Incoming ranged damage',value:`−${Math.round(item.rangedDamageReduction*100)}%`});
    if(item.meleeMoraleDamage)stats.push({label:'Melee morale damage',value:signed(item.meleeMoraleDamage)});
    if(item.rangedDamageReduction||item.meleeMoraleDamage)notes.push('Fur effects work while equipped, even after its armor is depleted. Duplicate ranged reduction and intimidation do not stack; flat stat bonuses from both slots add together. Morale damage is reduced by resolve and does not affect undead.');
    notes.push('This attachment requires body armor. Layered Armor unlocks a second attachment slot; each layer has independent durability. Slot 2 absorbs body damage first, then slot 1, before the main suit; head hits use the helmet.');
    notes.push('Swapping body armor keeps the attachment fitted. Stowing body armor also stows both fitted attachments, preserving every item and its condition.');
    notes.push('Its weight lowers maximum fatigue and initiative, but is excluded from armor-weight perk checks and Brawny/Relentless weight reductions. Camp tools and the Smithy repair its durability. Padding and leather reinforcement sit beneath the armor; outer mantles and pauldrons appear on the portrait.');
  } else if (item.slot === 'armor' || item.slot === 'helmet') {
    const maximum = item.armor ?? 0;
    const current = Number.isFinite(condition) ? Math.max(0, Math.min(maximum, Math.floor(condition))) : maximum;
    stats.push(
      { label: item.slot === 'armor' ? 'Body armor' : 'Head armor', value: `${current} / ${maximum}` },
      { label: 'Fatigue load', value: String(item.fatigue ?? 0) },
    );
    if(item.meleeMoraleDamage)stats.push({label:'Melee morale damage',value:signed(item.meleeMoraleDamage)});
    notes.push(item.slot === 'armor'
      ? 'Body armor is damaged by body hits. Head hits use the helmet instead.'
      : 'Ordinary weapons: 22% of landed hits strike the head. Named rolls can raise that chance; this helmet absorbs head hits.');
    notes.push('Armor can still let reduced health damage through while durability remains.');
    notes.push('Its fatigue load lowers both maximum fatigue and initiative by the same amount, subject to minimums.');
  } else if (item.slot === 'mount') {
    stats.push(
      { label: 'Company travel speed', value: `+${Math.round(item.travelBonus * 100)}% while equipped` },
      { label: 'Melee defense', value: signed(item.meleeDefenseBonus ?? 0) },
      { label: 'Ranged defense', value: signed(item.rangedDefenseBonus ?? 0) },
      { label: 'Maximum fatigue', value: signed(-(item.fatigue ?? 0)) },
      { label: 'Attack damage', value: `+${Math.round(item.damageBonus * 100)}%` },
      { label: 'Combat movement', value: '1 AP per walkable hex' },
      { label: 'Initiative', value: `+${item.initiativeBonus}` },
      { label: 'Extra daily food', value: String(item.foodUpkeep) },
    );
    notes.push('One mount fits the dedicated mount slot. Each living mounted brother adds 10% to company travel speed; three mounts give +30%. Stashed mounts give no bonus and consume no food.');
    notes.push('Mounted fighters control adjacent hexes: enemies may enter or move within this zone, but cannot step out while the rider lives. This applies to both sides.');
    notes.push('Highpass receives one Riding Horse on days 8, 22, 36 and every 14 days after. It stays on sale through that week until bought. City stables have a 20% weekly chance of a riding horse and a 5% chance of a warhorse, with scarcer armored mounts in major cities and castles; late-game mounted enemies may surrender their mount as victory loot.');
    if (item.chargeDamageBonus) stats.push({ label: 'Charge damage', value: `+${Math.round(item.chargeDamageBonus * 100)}% weapon damage + ${item.chargeDirectDamage} direct health damage on hit` });
    notes.push('Movement respects terrain, occupied hexes and formation tactics. Horses charge only under Offense or Thin them out, with no adjacent threat. Wolf and warg bites only reach adjacent enemies and do not follow reactions.');
    notes.push('Wolves and wargs appear in northern, forest and swamp cities. High-tier frontier camps have a separate 12% mount reward chance alongside named loot. Capture mounts from defeated mounted enemies, or claim the three one-time town events: War Horse at Oakwatch, Armored War Horse at Ironford, Dire Wolf at Blackfen.');
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
  if(item.headChance!==undefined)stats.push({label:'Head hit chance',value:`${Math.round(item.headChance*100)}%`});
  if(item.fatigueOnSkillUse)notes.push(`Named roll: weapon/shield skills cost ${-item.fatigueOnSkillUse} less fatigue before masteries.`);
  if(item.rollVersion===2)notes.push('Battle Brothers-style rolls: weapons and shields receive exactly two distinct eligible modifiers. Body armor gains 10–25% protection and saves 3–9 fatigue; helmets gain 10–25% protection and save 1–4 fatigue, subject to their weight floors. Rolls stay fixed through saves, repairs and trading.');
  for (const skill of equipmentSkills(item)) {
    stats.push({ label: skill.name, value: `${skill.ap} AP${skill.fatigue ? ` · ${Math.max(0,skill.fatigue+((skill.id==='shieldwall'||skill.id==='knock-back')?(item.slot==='shield'?item.fatigueOnSkillUse??0:0):item.slot==='weapon'?item.fatigueOnSkillUse??0:0))} fatigue before masteries` : ''}` });
    notes.push(`${skill.name}: ${skill.description}`);
  }
  if (item.slot === 'weapon') notes.push('A matching weapon mastery reduces attacks and weapon skills by 1 AP, once even with overlapping masteries. Base costs are shown above; shield skills, reloads and reactions are unchanged.');
  if (item.collection === 'crafted') notes.push('Crafted at a town Armorer from ordinary stash pieces. Named and reforged versions preserve the original crafted design and its intrinsic effects; named bonuses apply above its crafted baseline.');
  else if (item.collection) {
    notes.push('Ordinary protection and fatigue follow the pinned Battle Brothers definition. New named designs roll protection and weight against that source baseline. Existing legacy designs keep their saved bonuses; prices are adapted to the campaign economy.');
    notes.push('Cosmetic variants use a fixed source design. Original helmet vision penalties and scripted magical effects are not simulated.');
  }
  const role = ['famed','named'].includes(item.rarity)
    ? `A rare ${base.name.toLowerCase()} with ${bonuses.map(row => `${String(row.label).toLowerCase()} ${row.value}`).join(', ')} compared with ${item.rollVersion >= 2 && (item.sourceArmor !== undefined || item.sourceNamedWeapon) ? 'the unrolled source design' : 'the ordinary version'}.`
    : baseRole;
  return {
    description: item.description,
    role,
    rarity: item.rarity,
    baseName: item.baseId ? `${base.name}${item.rollVersion >= 2 && (item.sourceArmor !== undefined || item.sourceNamedWeapon) ? ' source baseline' : ''}` : item.rarity==='named' ? `${item.name} source baseline` : null,
    bonuses,
    stats,
    notes,
  };
}

// Compare only the main worn set. Reserve and pocket items never supply a baseline.
export function getMainItemComparison(item, brother, condition) {
  if (!brother || !['weapon', 'armor', 'helmet', 'shield'].includes(item?.slot)) return null;
  const equipped = getItem(brother.equipment?.[item.slot]);
  if (!equipped) return null;
  const equippedCondition = item.slot === 'weapon' ? (equipped.throwing ? brother.throwingAmmo?.active : undefined)
    : brother.armorDurability?.[{ armor: 'body', helmet: 'head', shield: 'shield' }[item.slot]];
  const details = getItemDetails(item, condition), baseline = getItemDetails(equipped, equippedCondition);
  if (!details || !baseline) return null;
  const higher = new Set(['Base damage', 'Hit modifier', 'Armor damage', 'Damage through armor', 'Reach',
    'Shield damage', 'Head hit chance', 'Body armor', 'Head armor', 'Shield durability', 'Melee defense', 'Ranged defense', 'Bundle throws']);
  const lower = new Set(['Attack AP', 'Attack fatigue', 'Fatigue load']);
  const equippedSkills = equipmentSkills(equipped);
  const sharedSkills = new Set(equipmentSkills(item).filter(skill => equippedSkills.some(other => other.id === skill.id)).map(skill => skill.name));
  const rows = [...details.stats];
  if (item.slot === 'weapon') {
    if (baseline.stats.some(row => row.label === 'Head hit chance') && !rows.some(row => row.label === 'Head hit chance')) rows.push({ label: 'Head hit chance', value: `${Math.round((item.headChance ?? .22) * 100)}%` });
    if (baseline.stats.some(row => row.label === 'Shield damage') && !rows.some(row => row.label === 'Shield damage')) rows.push({ label: 'Shield damage', value: '0 per hit or block' });
  }
  const stats = rows.map(row => {
    let previous = baseline.stats.find(other => other.label === row.label)?.value;
    // Optional weapon modifiers have meaningful ordinary defaults.
    if (previous === undefined && row.label === 'Head hit chance') previous = `${Math.round((equipped.headChance ?? .22) * 100)}%`;
    if (previous === undefined && row.label === 'Shield damage') previous = '0 per hit or block';
    const direction = higher.has(row.label) ? 1 : lower.has(row.label) || sharedSkills.has(row.label) ? -1 : 0;
    if (!direction || previous === undefined) return { ...row, parts: [{ text: row.value }] };
    // Explicit numeric rows only: categorical text and differing skills stay neutral.
    const numbers = [...previous.matchAll(/[+−-]?\d+(?:\.\d+)?/g)].map(match => Number(match[0].replace('−', '-')));
    const matches = [...row.value.matchAll(/[+−-]?\d+(?:\.\d+)?/g)];
    // A hyphen in a damage interval is a separator, never a negative maximum.
    if (row.label === 'Base damage') {
      numbers[1] = Math.abs(numbers[1]);
      if (matches[1]?.[0].startsWith('-')) { matches[1].index++; matches[1][0] = matches[1][0].slice(1); }
    }
    if (numbers.length !== matches.length) return { ...row, parts: [{ text: row.value }] };
    let cursor = 0;
    const parts = [];
    matches.forEach((match, index) => {
      if (match.index > cursor) parts.push({ text: row.value.slice(cursor, match.index) });
      const delta = Number(match[0].replace('−', '-')) - numbers[index];
      parts.push({ text: match[0], change: delta * direction > 0 ? 'better' : delta * direction < 0 ? 'worse' : 'equal', previous: String(numbers[index]), delta });
      cursor = match.index + match[0].length;
    });
    if (cursor < row.value.length) parts.push({ text: row.value.slice(cursor) });
    return { ...row, previous, parts };
  });
  return { equipped, stats };
}
