# Permanent company support

Hire specialists once at an open settlement. All hires stack, occupy no formation
slots, and consume no wages or food. Existing Bounty Hunter and cart progression
remain available alongside the seven new specialists.

| Hire | Crowns | Effect |
| --- | ---: | --- |
| Quartermaster | 5,000 | Daily food −20%, including equipped mounts |
| Surgeon | 6,000 | Rest healing +25%; doctor fees −25% |
| Armorer | 5,000 | Rest repair output +25%; repair tools −20% |
| Drillmaster | 7,500 | Surviving fielded brothers’ earned battle XP +15%; reserves train after victories |
| Broker | 6,000 | Cargo carried from another settlement sells +50%; equipment sells +10% |
| Scout | 5,000 | World movement ×1.10 |
| Scavenger | 4,000 | Victory battle-loot gold +25% |

Scout has one upgrade for an additional 10,000 crowns: roaming enemy bands’
detection radius and pursuit leash become 67% of their original ranges. Their
speed and close contact radius stay the same; player pursuit and caravans are
unaffected. Movement stacks multiplicatively with mounts, cart and night.

## Rewards and rounding

Quartermaster accumulates integer fifths across days and saves: five days consume
four days’ original food. Armorer accumulates quarter durability and fifth tool
units across rests/saves: four work units restore 125 durability, five consume
four tools. At least one tool is needed to start work. Excess durability at an
item’s maximum is discarded, as with ordinary repairs. All equipped protection,
attachments, active and reserve shields are included. Town smithy prices stay
unchanged.

Surgeon changes six-hour rest healing from 24/8 to 30/10 with/without medicine.
Doctor discounts round up per brother. Neither service resurrects casualties.

Drillmaster rounds earned battle XP ×1.15 to the nearest point. On victory,
reserves receive 15% of surviving fielded fighters’ average **unboosted** battle
XP, rounded to the nearest point. Donation XP is added separately and is not
multiplied. Normal level-up rolls and level-30 cap apply. Fallen fighters receive
nothing. The results screen displays boosted field XP.

Scavenger rounds victory loot gold ×1.25 down. The results screen uses the same
quote as collection. Item rolls, supplies, named drops, contracts and donations
are unchanged.

## Trading safeguards

All cargo purchases record source settlement and quantity, even before Broker is
hired. Selling at that same settlement uses ordinary resale prices, preventing a
buy/resell gold loop. Cargo purchased elsewhere receives the full +50% bonus,
rounded down per unit. Mixed cargo sells eligible units first; bulk proceeds use
the actual mix. Sales and supply-contract delivery remove matching source lots.
Legacy cargo without recorded origins is eligible; future purchases are tracked.
The market marks local-only cargo with an explanatory hint.

Equipment sale quotes and receipts increase by 10%, rounded down, capped below
the local purchase price (minimum one crown). All purchase prices are unchanged.

## Save and interaction behavior

Old saves normalize to no specialists, no Scout upgrade and zero savings.
Validation rejects unknown/duplicate hires, inconsistent Scout levels, invalid
rounding counters and cargo origins exceeding owned quantities. Restored arrays
and origin lots are copied. Failed purchases leave state unchanged.

The interface groups cards into travel/supplies, recovery/training and
trade/spoils. Each shows artwork, status, benefit chips and an explicit one-time
cost. Unaffordable/locked actions explain the next step. Hint buttons support
hover, keyboard focus and touch; Escape dismisses the hint. Purchases announce
the result and preserve scroll position. Cards collapse to one column on phones.
