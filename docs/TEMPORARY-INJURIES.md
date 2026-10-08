# Temporary injuries — v0.53.0

Persistent wounds are separate from missing HP. Brothers can return to full HP and still need treatment or reserve duty. They can continue taking contracts. Permanent injuries and surviving fatal blows remain a separate follow-up: this change does not resurrect casualties.

## Combat

New battles use `injuryRulesVersion: 1`. Original Battle Brothers thresholds and wound definitions are pinned to the community-decompiled vanilla source at [`e06d68df`](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7), specifically `scripts/config/character_injuries.nut`, `scripts/config/character.nut`, `scripts/entity/tactical/actor.nut` and `scripts/skills/injury/`.

- Resolve health damage after armor. Surviving susceptible actors need at least 10 health damage from that hit. Ordinary thresholds are 25% and 50% of maximum HP, with source-specific exceptions. Head thresholds are multiplied by 1.25.
- Select one eligible wound per hit from the action's body/head damage pool. Lesser wounds remain eligible on severe hits; duplicates and invalid wounds are excluded. Separate strikes can inflict separate wounds.
- Both sides use wound effects. Existing ancient undead have injury immunity through their existing tactical trait; human wearers of ancient helmets retain normal injury susceptibility. No new races are introduced.
- The catalogue contains 46 source-defined wounds across blunt, cutting, piercing and burning pools. Current weapon actions use the matching blunt/cutting/piercing pools; burning definitions are retained for future attacks and do not create a new fire system.
- Specific effects cover melee/ranged skill and defense, damage, initiative, fatigue capacity and recovery, movement AP, turn AP and maximum HP. Leg wounds add their exact listed AP penalty per tile, after normal movement credit; this does not multiply their penalty or add an unlisted fatigue cost.
- Fresh maximum-HP penalties are deferred until the battle ends. Source-defined acquisition HP caps apply immediately. Existing HP-reducing wounds carry their reduced maximum HP into subsequent battles.
- Cut Artery, Cut Neck Vein and Grazed Neck cause continuing bleeding while fresh in combat. Existing wounds do not restart that bleeding in the next battle. Damage uses the existing casualty pipeline and cannot generate additional wounds.
- Gash lowers injury thresholds to 0.66, or 0.50 with Sword Mastery, rather than applying the old temporary daze surrogate. Crippling Strikes multiplies thresholds by 0.66; the 10-health minimum remains. Executioner grants its 20% damage bonus against a target with an actual temporary injury.

Wounds use a separate saved random stream, so selection does not consume existing hit/damage random draws. Effective tactical attributes are read centrally from raw values; weapon swaps and shield breaks cannot apply penalties repeatedly. Initiative also feeds the simultaneous-combat scheduler. Shield-bypassing attacks remove the shield contribution before applying wound penalties, so wounded defenders do not lose that defense twice.

## Recovery and care

At each crossed world-day boundary, each ordinary wound consumes one medicine and gains one healing day. Without medicine, that wound's progress pauses. Wounds are processed in roster/wound order when medicine is insufficient; the UI warns about stores below the company's daily need. Medicine is consumed even before the wound's minimum recovery time is reached.

Once the minimum healing time is reached, recovery chance is healing days divided by maximum healing duration. Recovery is guaranteed at the maximum when medicine is available. Stable per-brother, wound, acquisition day and current day rolls prevent rerolling recovery through reload or splitting travel into smaller steps.

Doctor has two distinct services:

- **Restore HP:** the existing immediate HP service, which keeps injuries.
- **Treat wounds:** pay crowns to halve original recovery durations. This does not instantly heal HP or remove wounds, and daily medicine remains necessary. Individual brothers can be treated when the company cannot afford all care. Already-treated wounds cannot be charged again.

The Surgeon keeps existing rest healing and Doctor discounts and adds one day less wound recovery, minimum one day. Treatment costs scale with remaining recovery days and level, with a 25% Surgeon discount before rounding to tens of crowns. This adapts the OG temple service to our existing Doctor and economy rather than introducing a new building.

Camping reserves the company's next day of wound medicine before consuming optional medicine for HP healing. It still restores 8 HP without extra medicine or 24 with it, before Surgeon scaling. This avoids silently spending the last wound-care supply on a short rest. Recovering maximum HP makes room for later healing; it does not award free HP.

## UX

The sticky roster shows a compact wound count and accessible description. Equipment inspection shows names, recovery ranges, treatment state and a single care-supply warning. Exact penalties and recovery rules are behind existing keyboard/touch-accessible hint icons. Doctor remains discoverable for a full-HP brother with untreated wounds. Battle actors have individual wound status icons; the aftermath identifies fresh wounds before loot is collected. Wound hints remain pinned while their button is visible during scrolling.

## Save compatibility

Party wounds store `{id, acquiredDay, healingDays, treated}`. Tactical copies also store `fresh` and `sourceId` for deferred effects and bleeding attribution. Validation checks known unique IDs, exact record shapes, nonfuture dates, integer recovery progress, treatment flags, original wound ownership and valid tactical source IDs. Normalization copies records rather than retaining caller-owned arrays.

Old party saves migrate to an empty wound collection. Missing HP never creates a retroactive injury. Battles saved before this feature do not opt into injury rules or the new random stream: Gash retains its daze surrogate and Executioner retains its historical below-full-HP trigger. New wounds transfer to surviving brothers once through battle completion, including retreat; transient bleeding metadata is removed. Reserves recover through the same daily care path.

## Deliberate scope and adaptations

This first implementation covers temporary wounds and their supported weapon/perk interactions. It does not add permanent wounds, death survival, infections, injury-causing world events, Iron Will or special cures. Those systems need their own source review and compatibility work.

Ashen Company's ranged vision is modeled as an injury-only reach cap of seven minus vision penalties, while preserving existing uninjured ranges and melee reach. Continuing injury bleeding is scheduled once at the actor's first turn processing in a round, or at the simultaneous round boundary, alongside existing bleeding; OG uses turn-end/wait hooks. Recovery is based on crossed campaign days, consistent with the original daily checks, rather than adding continuous hourly wound simulation. Medicine reservations, hint UX and isolated random streams are deliberate improvements for this game's automation and saves.
