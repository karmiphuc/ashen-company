# Three-piece equipment completions

This extends the [matching head/body sets](EQUIPMENT-SETS.md). Wear a complete
existing pair plus one qualifying attachment to replace the two-piece bonus
with that completion's totals. It never adds another bonus on top of the pair.
No new armor designs, attachment designs or races are needed.

## Curated signatures

These nine completions require a **named** version of the specific attachment.
Ordinary signature attachments retain their normal protection and effects.

| Matching head/body family | Signature attachment | Head/body armor | Fatigue on the three matching pieces |
| --- | --- | ---: | ---: |
| Northern / Barbarian | Horned Pauldrons | +20% | −15% |
| Adorned | Noble Brocade Mantle | +30% | −15% |
| Ancient | Ancient Gilded Collar | +35% | −15% |
| Black & Gold | Gladiator Pauldrons | +35% | −20% |
| Golden Scale | Scale Mantle | +40% | −20% |
| Heraldic Knight | Heraldic Plates | +40% | −20% |
| Golden Lamellar | Gladiator Pauldrons | +50% | −20% |
| Green Plate | Stag Plates | +50% | −20% |
| Ritual Bone: Ritual Armor + Ritual Helmet | Bone Platings | +50% | −20% |

Northern gear has many inexpensive interchangeable pieces, so its completion
normally only raises protection from +15% to +20% and helmet fatigue reduction from 10%
to 15%; body fatigue reduction stays at 15%. Broad Ancient fitting remains
below the narrow heavy pairs. Efficient Black & Gold gets a smaller armor
increase than Golden Lamellar or Green Plate. Early mail and light eastern
sets have no bespoke signature tier.

**Ritual Bone** is a strict exception inside Northern: `bb-barbarian-ritual-armor`
(Ritual Armor, 300 armor) + `bb-barbarian-ritual-helmet` (Ritual Helmet, 300 armor)
+ named Bone Platings. The separate `northern-ritual-helm` (Ritual Helm, 150 armor)
does not qualify, nor does Horned Plate or another northern body piece. Ordinary,
named and reforged versions of the two original Ritual designs qualify. The
ordinary full-condition pair becomes 450 body/450 head armor, with fitted loads
of 24 body/22 head before perks; attachment armor stays unchanged. Without the
matching named Bones, these pieces keep their ordinary Northern fitting or an
applicable trophy completion. Bone Platings do not boost the whole Northern family.

The armor totals are **450/450 before attachments and affixes**, not a promise
that the character sheet's combined body protection will read 450. Bone Platings
have their own armor pool, added to body protection in the sheet; named rolls
can change that pool. Ordinary Bone Platings have 55 armor and 2 fatigue, but
do not unlock Ritual Bone. A named attachment's fitted fatigue is
`round(rolled fatigue × 0.8)`; a 2-fatigue roll therefore remains 2 after rounding.
The completion grants no extra Bone Platings charge or affix slots. Bone Platings
have an intrinsic [once-per-battle absorption effect](ATTACHMENT-SPECIAL-EFFECTS.md)
in new battles, independent of the set.

Ritual Bone is an outfit name within the Northern family, not a nineteenth
head/body family. Wearing only one Ritual piece cannot activate it. A second
qualifying trophy or signature never adds its bonus to Ritual Bone; only the
selected attachment receives the fatigue discount. In a version-7 battle,
an existing trophy completion remains selected even if the other slot holds
named Bones; the Ritual upgrade waits until the next battle.

## Rare trophy alternatives

Unhold and Direwolf pelts have no equivalent dedicated head/body family. A
pelt, ordinary or named, therefore completes **any valid existing head/body pair**.
It cannot turn two unrelated armor pieces into a set.

| Trophy attachment | Head/body armor | Fatigue on the three matching pieces | Existing native effect |
| --- | ---: | ---: | --- |
| Unhold Fur | +30% | −15% | +5 ranged defense and 25% less incoming ranged damage |
| Direwolf Fur | +25% | −20% | +5 morale damage on successful melee hits, before resolve resistance |

Both ordinary and named pelts qualify; stronger named rolls remain intact.
The rarer pelts reward hunting while staying below the strongest signature
pairs. Their native effects retain their existing non-stacking rules.

## Fitting, selection and condition

- Either attachment slot can qualify; the second slot still requires Layered Armor.
- At most one completion applies. Choose the highest armor percentage; ties prefer
  the greater fatigue reduction, then attachment 1. This is deterministic.
- The selected profile replaces the +15% armor and −10% head/−15% body fatigue
  pair profile. Multiply each piece's existing rolled/reforged values, round armor
  down and round each fatigue load to the nearest integer.
- Only the worn helmet, body armor and selected attachment get fitted fatigue.
  Another attachment keeps its full load. Attachment weight still does not count
  toward Nimble, Agile Defense or Fleet Footed, and Brawny still applies only to
  head/body weight. Weapon/shield load is unchanged.
- Attachment armor stays at its ordinary or rolled value. Completions do not
  amplify attachment effects, create affix slots or transfer membership during
  reforging. Restored Ancient gear retains its original-design membership.
- Stashed pieces do not count. Broken worn pieces still count toward fitting but
  contribute zero protection in their own armor pool. Breaking an attachment
  does not change a battle's starting completion or repair another pool.
- Removing the qualifying attachment outside battle restores the two-piece
  profile. Stored item condition remains in base units; scaled battle damage
  converts back to conservative base wear for survivors, casualties and loot.

## Small visual cue

The existing head/body chain remains. A second small chain badge sits inside
one attachment box, avoiding a new row or a connection across wrapped columns.
Both turn gold for a complete outfit, with accessible **3/3** labels. An eligible
but missing attachment has a muted cue. Tap, hover or keyboard focus reveals
specific companions, varied bonuses and trophy alternatives. Fitted attachment
inspection shows its reduced fatigue and confirms that its armor stays unchanged.

## Save compatibility

New battles use `equipmentSetRulesVersion: 8`.
Version 7 introduced the original signature and trophy completions; version 8
adds the conditional Ritual Bone completion. Two-piece snapshots keep their
existing shape. Three-piece snapshots additionally record `attachmentSlot`.
Validation reconstructs the expected completion and rejects changed slots,
ordinary signature/nonqualifying attachments, forged maxima and missing completion data.

Battles saved under versions 1–7 finish under their previous protection and
fatigue rules, even when already carrying an attachment that would qualify in a
new battle. Snapshot fitting is used by brothers, allies and enemies. Turn-based
and realtime battles share the same wear and compatibility rules.

## Regression coverage and review checklist

`tests/ritual-bone-set.test.js` checks every Northern body/head combination
with ordinary and named Bones: exactly one original-design pair can unlock
Ritual Bone under version 8, and none under version 7. It also covers missing
pieces, named/reforged membership, stowing, both attachment slots, competing
trophies without stacking, fitted loads, realtime/turn-based save round trips,
conservative retreat wear and rejection of tampered snapshot membership.

The broader equipment/attachment suites cover broken pieces, incoming damage,
fatigue-sensitive perks, champion drops and original-design loot condition.
For future changes, verify a version-7 trophy plus Bones in the other slot as
well as a version-7 pair with Bones alone; neither may gain protection on reload.
Check portrait and landscape equipment layouts, attachment-slot chains,
inspection hints and combat status text whenever eligibility or names change.

## Attachment ideas considered

This is a design shortlist, **not extra live eligibility**. The signature and
trophy tables above are the implemented rules. Other combinations need their
own balance decision; they should not inherit a universal +50% bonus.

| Existing attachment | Visual/mechanical candidate families | Status |
| --- | --- | --- |
| Padded Lining | Basic Mail, Field Mail, Hauberk | Future modest tier candidate |
| Fur Mantle | Northern / Barbarian | Future candidate |
| Leather Reinforcement | Wokou, Ronin, early mail | Future modest tier candidate |
| Iron Pauldrons | Adorned, Tycoon | Future candidate |
| Scale Mantle | Golden Scale; possibly Golden Lamellar | Named Golden Scale signature only |
| Bone Platings | Exact Ritual Armor + 300-armor Ritual Helmet | Named Ritual Bone signature only |
| Horned Pauldrons | Northern / Barbarian | Named signature |
| Chain Mantle | Hauberk, Field Mail, Adorned | Future modest tier candidate |
| Heraldic Plates | Heraldic Knight; possibly Noble | Named Heraldic Knight signature only |
| Gladiator Pauldrons | Golden Lamellar, Black & Gold | Named signatures with different totals |
| Skull Chain | Ancient, Northern / Barbarian | Future candidate |
| Spiked Chain | Northern / Barbarian | Future candidate |
| Stag Plates | Green Plate | Named signature |
| Heraldic Shoulders | Noble, Heraldic Knight | Future candidate |
| Kraken Mantle | No convincing existing match | Reserve for a future maritime set |
| Double Mail | Field Mail, Hauberk, Adorned | Future modest tier candidate |
| Unhold Fur | Any complete existing pair | Trophy alternative |
| Direwolf Fur | Any complete existing pair | Trophy alternative |
| Hyena Fur | Assassin, Wokou | Future modest tier candidate |
| Northern Pelt Mantle | Northern / Barbarian | Future candidate |
| Ancient Gilded Collar | Ancient | Named signature |
| Noble Brocade Mantle | Adorned; possibly Noble/Black & Gold | Named Adorned signature only |

Samurai and Ninja currently lack a convincing signature attachment; this change
keeps their dedicated pair identities rather than forcing a cultural mismatch.
