# Equipment sets

For the combined player-facing design overview, see
[equipment design features](EQUIPMENT-DESIGN-FEATURES.md).

The Assassin set uses existing Assassin's Robe with Assassin's Face Mask or
Assassin's Head Wrap. Both must be worn. Named and reforged variants qualify by
their original design; transferred affixes do not transfer set membership.

The two-piece pair adds 15% head/body armor (rounded down), reduces helmet fatigue by 10%
and body fatigue by 15% (each rounded to the nearest integer). The standard robe
and mask therefore provide 138 body armor, 161 head armor, and 13 armor fatigue.
Set fitting precedes fatigue-sensitive perks and Brawny. Attachments do not
receive this bonus. Sets do not consume prefix or suffix slots.

Ancient gear forms one interchangeable family: all 11 ancient body designs and
six ancient helmets/headpieces qualify, including priest and lich attire.
Northern/barbarian gear forms another: the northern catalog, barbarian armor and
headpieces, Nordic helmets, authored named northern pieces, and the original
Barbarian Helmet. Any body/head combination within a family activates the same
bonuses. Ancient and northern pieces do not match across families. Cultist gear
shares an expansion with barbarian gear but has a separate style; decayed
mercenary armor is not ancient legionary gear. Neither belongs to these families.

Southern fitting is deliberately curated: Golden Scale Armor pairs only with
Gold and Black Turban; Golden Lamellar Armor pairs only with Heavy Lamellar
Helmet. Ordinary southern/nomad gear and mixed Assassin/desert pieces do not
qualify. This avoids multiplying the efficiency of the whole desert catalog
and gives players specific visually coherent high-end pairs to hunt.

Ninja Suit and Elite Ninja Suit pair with Ninja Mask or Elite Ninja Mask;
regular and elite pieces can mix. Samurai gear does not qualify as Ninja.
Assassin fitting remains restricted to its robe and mask/head wrap.

Adorned Mail Shirt, Adorned Warrior’s Armor and Adorned Heavy Mail Hauberk
match Adorned Closed Flat Top or Adorned Full Helm. This provides a themed
progression from medium mail to a heavy questing-knight outfit. Adorned Full
Helm also retains its existing Noble membership; a complete pair wins and
bonuses never stack. Samurai Armor pairs only with Samurai Helmet, and Tycoon
Armor pairs only with Tycoon Helmet. Ninja, Samurai and Tycoon do not mix;
other eastern designs do not automatically qualify.

Basic Mail pairs Basic Mail Shirt or Patched Mail Shirt with either Mail
Coif design. Field Mail pairs either Mail Shirt design with Reinforced Mail
Coif or either Mail Coif design. Hauberk pairs Mail Hauberk or Sleeveless Hauberk with
Closed Mail Coif. These are specific early mail progressions; other coifs and
helms do not automatically qualify.

Three regal pairs offer more distinct hunting goals: Black And Gold Armor with
Golden Feathers Helmet; Green Coat Of Plates Armor with Sallet Green Helmet;
and Heraldic Hauberk with Decorated Full Helm. Existing Noble membership stays
intact, including the green sallet and heraldic body piece.

Kasa pairs with Wokou Light Armor (Wokou set) or Ronin Clothes (Ronin set).
Ronin Clothes also match Ronin Hat. The shared Kasa hint lists both companions;
wearing one complete pair activates only its own family. Other eastern armor
and bamboo hats do not automatically match.

The two plain Mail Shirt designs are `mail-shirt` (110 armor, 15 fatigue) and
`bb-mail-shirt` (130 armor, 14 fatigue); both belong to Field Mail. Basic Mail
Shirt (`bb-basic-mail-shirt`) is a separate design in Basic Mail. Plain Mail
Coif has two designs too: `mail-coif` (80 armor, 6 fatigue) and `bb-mail-coif`
(80 armor, 4 fatigue). Both qualify in Basic Mail and Field Mail. Reinforced
Mail Coif belongs to Field Mail; Closed Mail Coif belongs to Hauberk. Similar
names alone do not confer membership.

Kasa means `fantasy-kasa` (105 armor, 5 fatigue), not Bamboo Hat
(`samurai-bamboo-hat`). Ronin Hat is the alternative only for Ronin Clothes.

All 18 families use the same two-piece percentages. Selected attachment
completions replace them with varied three-piece totals; see
[three-piece completions and attachment ideas](THREE-PIECE-SETS.md).
Bonuses apply once, never stack.
They activate automatically when both pieces are worn, for company brothers,
enemies and allies. Pieces in the stash do not count. Sets are not restricted
to named items and do not require a crafting recipe or activation fee.

Noble gear pairs noble/heraldic body clothing (including authored named noble
mail) with noble/heraldic headgear and knightly full helms, bascinets and sallets.
Its nine body designs and ten head designs are interchangeable within Noble.
Plain mercenary body armor, decayed gear and culturally unrelated headgear do
not qualify. Adorned Full Helm and Sallet Green Helmet retain Noble membership;
a full Adorned or Green Plate pair still applies only one bonus. Kasa likewise
belongs to both Wokou and Ronin, with the worn body piece choosing the family.
Incomplete hints prefer the body armor’s companion, falling back to the helmet
when the body has no set membership.

Restored bronze/steel Ancient pieces, including their named and reforged
variants, qualify through `restorationSourceId`. Their upgraded baseline gets
the same Ancient bonus; restoration does not create a second stacking set.

Stored item condition always stays in base-armor units. New battles record an
immutable starting condition and boosted armor pool. Only damage taken is
converted back to base wear, rounding wear up. Entering, retreating, or changing
the pair cannot repair gear. Loot and surviving enemies also retain base wear.
Broken pieces still count as worn, grant no protection, and retain their weight.

Battle `equipmentSetRulesVersion: 1` opts into Assassin snapshots only; version 2
also enables Ancient and Northern, and version 3 adds broad Southern and Noble.
Version 4 replaces broad Southern with the two curated pairs and adds Ninja.
Version 5 adds Adorned, Samurai and Tycoon.
Version 6 adds the early mail, regal and Kasa pairings.
Version 7 adds selective attachment completions with varied replacement totals.
Existing active battles without a version, or with versions 1–6, retain their
original protection and fatigue rules. Newly enabled sets become effective in the next battle. Save validation verifies each
snapshot against its original item design, rule version and starting condition.

Definitions have a `since` version to keep older battles stable. When adding
a family, bump the battle rule version and give the definition that `since`
version. When changing an existing family’s members or percentages, preserve
its previous definition for earlier saved rules; bumping the version alone is
insufficient. The retired broad Southern definition is retained for version 3,
and cannot appear in current item membership hints. Set names, pairing
guidance and bonus text feed the compact chain hint, item details and combat
status, so each screen describes the same family.

`src/equipment-sets.js` owns definitions, membership, fitting, and wear conversion.
To add a set, add its original design IDs and bonuses there, then cover matching,
missing pieces, wear, saves, and fatigue-sensitive perks in regression tests.

## Verified ordinary-item examples

These two-piece values exclude attachment completions and perks; fatigue is the combined fitted
helmet/body load, before Brawny. Rounding can leave a low-fatigue piece unchanged.

| Worn pair | Body armor | Head armor | Fitted armor fatigue |
| --- | ---: | ---: | ---: |
| Basic Mail Shirt + imported Mail Coif | 132 | 92 | 14 |
| Wokou Light Armor + Kasa | 115 | 120 | 13 |
| Ronin Clothes + Kasa | 184 | 120 | 15 |
| Black And Gold Armor + Golden Feathers Helmet | 296 | 333 | 28 |

For damaged gear, the effective maximum is rounded down first; current armor
is then scaled by its remaining fraction of base condition and rounded down.
Zero-condition pieces grant zero protection even when the chain stays active.
Stored condition never changes merely because a matching piece is equipped.
