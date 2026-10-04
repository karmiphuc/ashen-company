import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, getItem, createFamedItemId } from '../src/engine.js';
import { getItemDetails } from '../src/item-details.js';
import { equipmentSkills, weaponSkillFamily } from '../src/combat-skills.js';

const item = id => ITEMS.find(entry => entry.id === id);
const value = (details, label) => details.stats.find(stat => stat.label === label)?.value;

test('every weapon including famed copies exposes its family signatures and correct AP costs', () => {
  for (const base of ITEMS.filter(entry => entry.slot === 'weapon')) {
    assert.ok(weaponSkillFamily(base), `${base.id} needs a weapon family`);
    const skills = equipmentSkills(base);
    assert.ok(skills.length, `${base.id} needs a signature`);
    for (const weapon of [base, getItem(createFamedItemId(base.id, 17))]) {
      assert.deepEqual(equipmentSkills(weapon), skills);
      const details = getItemDetails(weapon);
      for (const skill of skills) {
        assert.ok(details.stats.some(stat => stat.label === skill.name && stat.value.includes(`${skill.ap} AP`)), `${weapon.id} describes ${skill.name}`);
      }
    }
  }
});

test('every catalog item has useful details without changing the item', () => {
  assert.equal(ITEMS.length, 463);
  for (const entry of ITEMS) {
    const before = structuredClone(entry);
    const details = getItemDetails(entry);
    assert.equal(details.description, entry.description);
    assert.ok(details.role.length > 45, `${entry.id} needs a distinct use case`);
    assert.ok(details.stats.length >= 2, `${entry.id} needs mechanical stats`);
    assert.ok(details.stats.every(stat => typeof stat.label === 'string' && stat.label && typeof stat.value === 'string' && stat.value));
    assert.ok(details.notes.length >= 2 && details.notes.every(note => typeof note === 'string' && note.length > 20));
    assert.deepEqual(entry, before);
  }
  assert.equal(getItemDetails(null), null);
  assert.equal(getItemDetails({ id: 'unknown', slot: 'weapon' }), null);
});

test('bow and crossbow explain actual ranged costs and differences', () => {
  const bow = getItemDetails(item('hunting-bow'));
  assert.equal(value(bow, 'Base damage'), '16-26');
  assert.equal(value(bow, 'Hit modifier'), '0');
  assert.equal(value(bow, 'Armor damage'), '60% of base hit');
  assert.equal(value(bow, 'Damage through armor'), '30% of base hit');
  assert.equal(value(bow, 'Reach'), '4 hexes');
  assert.equal(value(bow, 'Attack skill'), 'Ranged');
  assert.equal(value(bow, 'Attack fatigue'), '9');
  assert.equal(value(bow, 'Ammunition'), '1 per shot');
  assert.equal(value(bow, 'Reload'), undefined);
  assert.ok(bow.notes.some(note => note.includes('12-point hit penalty')));
  assert.ok(bow.notes.some(note => note.includes('When ammunition runs out, they draw a pocket weapon')));
  assert.ok(bow.notes.some(note => note.includes('percentage points')));
  assert.ok(bow.notes.some(note => note.includes('22% of landed hits')));

  const crossbow = getItemDetails(item('light-crossbow'));
  assert.equal(value(crossbow, 'Base damage'), '25-38');
  assert.equal(value(crossbow, 'Hit modifier'), '+8');
  assert.equal(value(crossbow, 'Armor damage'), '120% of base hit');
  assert.equal(value(crossbow, 'Damage through armor'), '45% of base hit');
  assert.equal(value(crossbow, 'Reach'), '5 hexes');
  assert.equal(value(crossbow, 'Reload'), '4 AP after each shot (new battles)');
  assert.equal(value(crossbow, 'Hands'), 'Two; shield stowed');
});

test('throwing bundles expose remaining throws and shield damage', () => {
  const axes=getItemDetails(item('heavy-throwing-axes'),2);
  assert.equal(value(axes,'Bundle throws'),'2 / 5');
  assert.equal(value(axes,'Shield damage'),'24 per hit or block');
  assert.ok(axes.notes.some(note=>note.includes('refill from company ammunition')));
  assert.equal(value(getItemDetails(item('javelins'),0),'Bundle throws'),'0 / 5');
});

test('bow and shield skills expose AP costs and famed gear inherits the same skills', () => {
  for (const bow of [item('hunting-bow'), getItem(createFamedItemId('hunting-bow', 41))]) {
    const details = getItemDetails(bow);
    assert.equal(value(details, 'Quick Shot'), '4 AP');
    assert.equal(value(details, 'Aimed Shot'), '7 AP · 15 fatigue before masteries');
    assert.ok(details.notes.some(note => note.includes('+15 hit chance and +1 range')));
  }
  const shield = getItemDetails(item('round-shield'));
  assert.equal(value(shield, 'Shieldwall'), '4 AP · 20 fatigue before masteries');
  assert.equal(value(shield, 'Knock Back'), '4 AP · 20 fatigue before masteries');
  assert.equal(value(getItemDetails(item('light-crossbow')), 'Aimed Shot'), undefined);
});

test('billhook, dagger, and axe show their real tradeoffs', () => {
  const billhook = getItemDetails(item('billhook'));
  assert.equal(value(billhook, 'Reach'), '2 hexes');
  assert.equal(value(billhook, 'Attack skill'), 'Melee');
  assert.equal(value(billhook, 'Attack fatigue'), '15');
  assert.equal(value(billhook, 'Ammunition'), undefined);
  assert.ok(billhook.notes.some(note => note.includes('does not spend ammunition')));

  const dagger = getItemDetails(item('rondel-dagger'));
  assert.equal(value(dagger, 'Base damage'), '12-19');
  assert.equal(value(dagger, 'Hit modifier'), '+12');
  assert.equal(value(dagger, 'Armor damage'), '45% of base hit');
  assert.equal(value(dagger, 'Damage through armor'), '75% of base hit');
  assert.equal(value(dagger, 'Attack fatigue'), '8');
  assert.equal(value(getItemDetails(item('wood-axe')), 'Hit modifier'), '-5');
});

test('shields give defense rather than armor, while gear shows current durability', () => {
  const shield = getItemDetails(item('kite-shield'));
  assert.equal(value(shield, 'Melee defense'), '+18');
  assert.equal(value(shield, 'Ranged defense'), '+18');
  assert.equal(value(shield, 'Fatigue load'), '8');
  assert.equal(value(shield, 'Body armor'), undefined);
  assert.ok(shield.notes.some(note => note.includes('does not provide body or head armor')));

  const gambeson = getItemDetails(item('padded-gambeson'), 44);
  assert.equal(value(gambeson, 'Body armor'), '44 / 85');
  assert.equal(value(gambeson, 'Fatigue load'), '10');
  assert.equal(value(getItemDetails(item('padded-gambeson')), 'Body armor'), '85 / 85');
  assert.equal(value(getItemDetails(item('bascinet'), 70), 'Head armor'), '70 / 175');
  assert.ok(getItemDetails(item('bascinet')).notes.some(note => note.includes('22% of landed hits')));
  assert.equal(value(getItemDetails(item('greathelm'), -10), 'Head armor'), '0 / 210');
});

test('armor attachments explain fit, damage order, weight and repair', () => {
  const details = getItemDetails(item('fur-mantle'), 9);
  assert.equal(value(details, 'Attachment armor'), '9 / 25');
  assert.equal(value(details, 'Fatigue load'), '1');
  assert.equal(value(details, 'Armor per fatigue'), '25');
  assert.ok(details.notes.some(note => note.includes('requires body armor')));
  assert.ok(details.notes.some(note => note.includes('before the main suit')));
  assert.ok(details.notes.some(note => note.includes('Smithy')));
});

test('shield details preserve worn and broken condition and explain repair', () => {
  const worn = getItemDetails(item('kite-shield'), 17);
  assert.equal(value(worn, 'Shield durability'), '17 / 80');
  assert.equal(value(worn, 'Melee defense'), '+18');
  const broken = getItemDetails(item('kite-shield'), 0);
  assert.equal(value(broken, 'Shield durability'), '0 / 80 (broken)');
  assert.equal(value(broken, 'Melee defense'), '0');
  assert.equal(value(broken, 'Ranged defense'), '0');
  assert.ok(broken.notes.some(note => note.includes('Smithy') && note.includes('reserve shields')));
});
