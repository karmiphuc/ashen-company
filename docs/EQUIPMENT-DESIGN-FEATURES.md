# Equipment design features: named affixes, merging and armory sets

Named-item bonuses and armory sets give players two ways to build distinctive
equipment: improve an individual piece through reforging, then pair it with
gear that shares its style. Both systems reuse existing equipment designs.

## Named equipment and the merging formula

Named items combine their original craftsmanship rolls with two kinds of
bonuses:

- **Prefixes** provide special effects: perk enhancements, free actions,
  movement benefits, or combat abilities.
- **Suffixes** improve stats such as accuracy, defense, health, or fatigue
  capacity.

Reforged equipment can hold **up to two prefix families and two suffix
families**. Original named craftsmanship remains separate from those slots.
Older named gear without RPG affixes represents its stat package as a legacy
craftsmanship suffix.

The legendary blacksmith's four side quests unlock reforging without occupying
a normal contract slot. Select a named donor and a recipient from the stash;
confirming destroys the donor and improves the recipient.

| Recipient | Result |
| --- | --- |
| Ordinary item | Receives the donor's complete enhancement package, including craftsmanship and affixes. |
| Named item | Keeps its own craftsmanship and inherits 1–3 eligible complete affixes, subject to available slots. |

The named merge formula is:

**Recipient design + existing craftsmanship + bounded merged prefixes and
suffixes**

The recipient keeps its existing affixes. New families occupy free slots;
duplicate families can upgrade their complete roll without occupying another
slot. An upgrade must preserve every existing benefit in that affix and improve
at least one. Duplicate values never add together.

For example, **Hearty +5% health** can become **Hearty +15%**, rather than +20%.
A third distinct prefix cannot enter an item whose two prefix slots are already
occupied. A stronger duplicate can still upgrade one of those occupied slots.

Transfers stay within equipment categories: weapon to weapon, body armor to
body armor, helmet to helmet, and shield to shield. Weapon classes may differ,
but effects retain their perk and weapon requirements. Inactive effects still
occupy slots. Full transfers preserve them; named merges select applicable
improvements. Older reforged packages with unverifiable affix provenance retain
their bonuses but remain locked against accumulating merges, including after
a full transfer.

The first reforge waives gold and materials. Later work costs **1,000 crowns
plus cargo materials**, shown before confirmation:

- Timber supports ranged and movement effects.
- Wool supports many defensive, fitting, utility and healing effects.
- Iron supports other effects; Unyoked's extra AP requires three iron.

A merge's recipe covers all eligible donor affixes, independently of which
1–3 the transaction selects. Reopening menus or reloading cannot reroll the
same transaction. The confirmation checks the current stash, gold and cargo
before consuming the donor or payment.

The design rewards collecting useful donors and trading goods while keeping
long-term growth bounded. Complete affix rolls stay readable, and players
cannot accumulate an unlimited collection of effects on one item.

## Armory matching sets

Matching worn head and body gear grants:

| Bonus | Calculation |
| --- | --- |
| Body and head armor | Each piece's armor × 1.15, rounded down |
| Helmet fatigue | Helmet load × 0.90, rounded to the nearest integer |
| Body-armor fatigue | Body load × 0.85, rounded to the nearest integer |

These percentages apply to the piece's existing rolled/reforged values. A
standard Assassin's Robe and Face Mask therefore provide **138 body armor,
161 head armor, and 13 combined armor fatigue**.

| Family | Matching designs |
| --- | --- |
| Assassin | Assassin's Robe with Assassin's Face Mask or Head Wrap |
| Ancient | Any ancient body armor and ancient helmet/headpiece, including priest and lich attire |
| Northern / Barbarian | Interchangeable northern and barbarian body/head designs, including Nordic helmets |
| Ninja | Ninja/Elite Ninja Suit with Ninja/Elite Ninja Mask; regular and elite pieces can mix |
| Golden Scale | Golden Scale Armor with Gold and Black Turban |
| Golden Lamellar | Golden Lamellar Armor with Heavy Lamellar Helmet |
| Noble | Noble/heraldic body gear with noble, heraldic or knightly headgear, including full helms, bascinets and sallets |

Ordinary, named and reforged versions qualify by their **original design**.
Transferring bonuses preserves the recipient's armory identity. Other families
do not match across cultures; cultist clothing and decayed mercenary armor
retain their separate styles.

Southern sets use specific high-end pairs to reward hunting without further
boosting the efficiency of ordinary desert armor. Mixed Assassin/Southern gear
does not qualify. A complete match takes priority over a partial match,
and **only one set bonus applies**. Sets consume no prefix or suffix slots.

Fitted fatigue counts before Nimble, Agile Defense, Fleet Footed and Brawny;
it also affects fatigue capacity, initiative and light-armor ranged-reach
eligibility. Attachments do not receive the head/body set bonus.

The equipment UI uses a small **gold chain between the head and body boxes**
for a complete pair and a muted broken chain for an incomplete pair. Hover,
keyboard focus or tap reveals the family and bonuses. Equipped-item inspection
shows fitted values, and combat uses a compact family status icon. The cue
occupies the existing slot gap, keeping the gear itself prominent.

Removing a piece disables the bonus. Stored item condition stays in base units;
boosted combat damage converts back into wear conservatively. Entering battle,
retreating or changing sets cannot repair equipment. Broken pieces still count
as worn, but provide no protection. Older active battles retain their original
set rules, with newly enabled families becoming effective in the next battle.

This system rewards a coherent visual style and creates a reason to keep
compatible pieces across different quality levels, while allowing named-item
customization within that style.

## Implementation references

- [Named affix effects and bounded reforging](NAMED-AFFIXES.md)
- [Original named craftsmanship rolls](NAMED-ROLLS.md)
- [Equipment-set membership, wear and compatibility](EQUIPMENT-SETS.md)
- [Legendary blacksmith quest and service design](LEGENDARY-BLACKSMITH-DESIGN.md)

Current behavior is defined by `src/reforged-items.js`, the forge transactions
in `src/engine.js`, and `src/equipment-sets.js`.

Battles saved under set rules 1–3 retain their original memberships and bonuses
until they finish, including the former broad Southern family. New battles use
the curated version-4 rules; stored gear condition remains unchanged.
