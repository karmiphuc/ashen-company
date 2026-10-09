# Bone, Hyena and Living Tree Shield effects

This update adds the three approved intrinsic effects. Unhold Fur's existing
25% ranged mitigation at both hit locations and Direwolf Fur's existing +5 melee
morale damage are preserved, as are Moonfang intimidation and trophy set bonuses.

| Item | Effect |
| --- | --- |
| Bone Platings | Absorbs the first successful body hit per encounter that does not fully bypass armor. Blocks health and armor damage; one charge per wearer, not per attachment slot. |
| Hyena Fur | +15 initiative, plus the existing +5 ranged defense. Named fitting adds its own bonus on top. |
| Living Tree Shield | Regrows up to 20 durability at the owner's turn start while active and unbroken. In realtime, once at each AP-cycle start. Surviving active/reserve shields and recovered combat shields fully regrow after combat; broken shields remain repairable at zero. |

## Bone guardrails

Head hits, misses, bleeding, Puncture, fully armor-bypassing attacks and
shield-only/zero-damage skills do not consume the charge. A successful melee,
ranged, reaction or mount body hit can consume it. This blocks damage, not
separate control effects such as stun. An absorbed hit causes no wound, bleed or
damage-linked morale loss. Shield wear remains independent of body protection.

The charge starts ready once per battle, including when the worn attachment's
ordinary armor pool is depleted. It does not refresh on later turns, realtime
cycles or reloads. Two Bone pieces share one charge. Multi-hit skills consume
it on at most one eligible strike; later strikes still damage the wearer.
AI prediction accounts for one absorption across a multi-hit flail action without
mutating the real charge.

The campaign's existing 55 armor/2 fatigue stays intact to preserve named rolls
and Ritual Bone set balance. Adding absorption raises ordinary price from 375
to 850 crowns. Named Bone retains its intrinsic charge; set completion adds no
extra charge or special effect beyond its existing outfit bonuses.

## Living Shield guardrails

Normal turns regenerate before bleeding and stunned-turn handling. Realtime
cycles regenerate all living wearers at cycle start, including stunned wearers.
The first realtime cycle starts when the battle is created. Each owner records
that cycle/turn even with an ordinary shield; drawing a Living Shield later
cannot trigger extra regeneration. Reserve shields do not regenerate during
combat. The rolled/reforged maximum caps healing. Zero-durability shields never
regrow automatically; they provide no defense or gear-granted perks until repaired.

Combat completion repairs only participating shields and recovered spoils,
including a survivor's active/reserve shields and shields recovered from fallen
brothers. Stash shields and nonparticipants are untouched. Retreats use the same
surviving-shield rule. The effect is intrinsic to the Living Tree base design,
so named and reforged versions retain it, while transfers to ordinary shields
do not copy this innate property.

## Save and UI behavior

New battles/units carry `equipmentEffectsVersion: 1`. Old active battles omit
it and retain their damage/regeneration behavior and saved initiative. New rules
apply next battle. Hyena's current company-sheet bonus is +15 outside combat.

Bone charges and regeneration rounds serialize. Validation rejects unknown or
mismatched versions, invalid/missing Bone charges, impossible regeneration stamps,
and malformed absorption events. Multi-strike events preserve which strike was
absorbed. The existing rules and named-item identities are not rerolled.

Compact combat icons show Bone ready/spent and an unbroken active Living Shield.
Tooltips explain the effects; spent Bone is dimmed. Combat logs record absorption
and actual durability restored. Item inspection exposes concise effect rows.

## Original source references

Checked against the repository's pinned OG source commit
`e06d68df0915827967f98a05d0c705c1f53df0b7`:

- [Bone Plating](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/armor_upgrades/bone_platings_upgrade.nut): body hit with direct damage below 100%, once per combat.
- [Hyena Fur](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/armor_upgrades/hyena_fur_upgrade.nut): +15 initiative.
- [Living Tree Shield](https://github.com/kovasap/battle-bros-decompiled/blob/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/shields/special/craftable_schrat_shield.nut): +20 durability per turn; full repair at combat end.

Armor, fatigue and repairable broken-shield handling retain the campaign's
existing adaptation. Behavioral coverage lives in
`tests/equipment-special-effects.test.js`.
