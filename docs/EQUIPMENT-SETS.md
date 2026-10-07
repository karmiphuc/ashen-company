# Equipment sets

The Assassin set uses existing Assassin's Robe with Assassin's Face Mask or
Assassin's Head Wrap. Both must be worn. Named and reforged variants qualify by
their original design; transferred affixes do not transfer set membership.

The pair adds 15% head/body armor (rounded down), reduces helmet fatigue by 10%
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

Stored item condition always stays in base-armor units. New battles record an
immutable starting condition and boosted armor pool. Only damage taken is
converted back to base wear, rounding wear up. Entering, retreating, or changing
the pair cannot repair gear. Loot and surviving enemies also retain base wear.
Broken pieces still count as worn, grant no protection, and retain their weight.

Battle `equipmentSetRulesVersion: 1` opts into Assassin snapshots only; version 2
also enables the cultural families. Existing active battles without a version,
or with version 1, retain their original protection and fatigue rules. Newly
enabled sets become effective in the next battle. Save validation verifies each
snapshot against its original item design, rule version and starting condition.

Definitions have a `since` version to keep older battles stable. Expand the
battle rule version when adding or broadening membership. Set names, pairing
guidance and bonus text feed the compact chain hint, item details and combat
status, so each screen describes the same family.

`src/equipment-sets.js` owns definitions, membership, fitting, and wear conversion.
To add a set, add its original design IDs and bonuses there, then cover matching,
missing pieces, wear, saves, and fatigue-sensitive perks in regression tests.
