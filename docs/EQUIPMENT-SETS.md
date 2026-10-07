# Equipment sets

The Assassin set uses existing Assassin's Robe with Assassin's Face Mask or
Assassin's Head Wrap. Both must be worn. Named and reforged variants qualify by
their original design; transferred affixes do not transfer set membership.

The pair adds 15% head/body armor (rounded down), reduces helmet fatigue by 10%
and body fatigue by 15% (each rounded to the nearest integer). The standard robe
and mask therefore provide 138 body armor, 161 head armor, and 13 armor fatigue.
Set fitting precedes fatigue-sensitive perks and Brawny. Attachments do not
receive this bonus. Sets do not consume prefix or suffix slots.

Stored item condition always stays in base-armor units. New battles record an
immutable starting condition and boosted armor pool. Only damage taken is
converted back to base wear, rounding wear up. Entering, retreating, or changing
the pair cannot repair gear. Loot and surviving enemies also retain base wear.
Broken pieces still count as worn, grant no protection, and retain their weight.

Battle `equipmentSetRulesVersion: 1` opts into set snapshots. Existing active
battles without the version retain their original protection and fatigue rules;
the pair becomes effective in the next battle. Save validation verifies each
snapshot against its original item design and starting condition.

`src/equipment-sets.js` owns definitions, membership, fitting, and wear conversion.
To add a set, add its original design IDs and bonuses there, then cover matching,
missing pieces, wear, saves, and fatigue-sensitive perks in regression tests.
