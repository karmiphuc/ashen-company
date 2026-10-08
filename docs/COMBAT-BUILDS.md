# Combat builds and mounts

Updated 2026-10-01 for v0.33. These are simplified game rules, not a complete reproduction of Battle Brothers.

## Shields

Axes and throwing weapons damage active shields on hits and blocks. Ordinary javelins and throwing spears deal 12 shield damage; heavy javelins deal 18; throwing axes deal 18; heavy throwing axes deal 24. Melee axes deal 12. A normal round shield has 48 durability, so an unprotected shield breaks after four javelin impacts, three throwing axes or two heavy throwing axes. Shield Expert halves wear. Ordinary arrows only wear shields on a block; ordinary melee hits retain their small wear.

The combat log reports shield damage. At zero durability, shield defense and shield perks stop applying. The item remains repairable with tools at camp or at a Smithy. Reserve shields keep their own durability.

## Getting a mount

Highpass receives one Riding Horse on days 8, 22, 36 and every 14 days after. It stays in the equipment market through that week until bought. Prices still follow town events. This gives a reliable route without flooding every settlement with mounts.

Large towns and castles retain a 2% weekly chance to stock one random mount. The pool includes Riding Horse, War Horse, Armored War Horse, Warg and Dire Wolf. War Horse and Armored War Horse use actual Fantasy Brothers artwork; see [asset provenance](../assets/fantasy-mount-source.json). A captured mount is also possible after defeating rare mounted elite enemies, with their existing late-game gate preserved.

Living mounted fighters control adjacent hexes. An enemy can enter the zone or circle within it, but cannot step out while that rider lives. This applies to both sides and to formation movement and ranged repositioning. Dead riders exert no control. Every equipped mount adds 10% company travel speed and extra daily food consumption.

## Builds

The maximum level is 30. Level-ups continue to grant one perk point and a choice of three rolled attributes. Nimble and Fleet Footed allow at most 15 total fatigue from body armor, head armor and shoulder attachment. Weapon masteries continue to reduce attack fatigue by 25% without stacking overlapping masteries twice.

Four additional combat perks are simplified adaptations: Gifted (+3 melee/ranged skill and +2 defenses), Reach Advantage (+5 melee defense with a two-handed melee weapon), Relentless (half the equipment initiative penalty and half the combat-fatigue loss from Dodge), and Battle Flow (recover up to 10 fatigue on a kill). Perks are shown by unlock level within each category.

Reference material: [Battle Brothers developer update on Relentless](https://battlebrothersgame.com/update-1-4/), [official forum discussion of Gifted and Reach Advantage](https://battlebrothersgame.com/forums/reply/20264/), and [Legends](https://www.nexusmods.com/battlebrothers/mods/60).

## Throwing bundles

Each throwing weapon carries five throws. Active and reserve bundles have separate counts; swapping sets or stowing a bundle does not refill it. The AI uses a loaded spare bundle or a melee backup when a bundle runs dry, and punches if nothing usable remains. Throwing consumes bundle charges in battle; equipped bundles refill after battle from company ammunition, one supply per restored throw. Buying ammunition or preparing for a valid fight also tops them up at the same supply cost. If supplies run short, the partial bundle persists. Looted and stowed bundles retain their remaining charges. Bows and crossbows keep their existing ammunition rules.

Flankers approach outside the enemy melee line and avoid other enemies' melee reach while routing. Loaded throwing weapons fire from the wings instead of pursuing a distant archer when a wing shot is already available. A throwing flanker can draw a reserve dagger to attack an enemy engaged by an ally, provided a safe one-step approach, the swap, and an attack fit its AP and fatigue. This uses existing surround/backstab rules, rather than adding a new damage bonus. Breakers are aggressive frontliners, not wing fighters. In rounds 1–4 they approach the nearest reachable front and charge its weak points; they do not detour toward archers. Safe multi-enemy area attacks receive extra priority, while existing friendly-fire restrictions remain in force. From round 5, under Offense or Focus, they can pursue exposed archers/polearms through openings whose route costs at most two movement-cost units more than the nearest approach. An engaged Breaker may take such a step only while remaining adjacent to every currently adjacent enemy, avoiding disengagement strikes. Once unengaged, it hunts reachable backline stragglers directly. Formation orders, Spearwall and crowded-landing checks, fatigue limits, and wounded-brother self-preservation still apply. A mounted Charge requires an unengaged rider and its existing straight, clear lane; breaking through does not grant a free charge out of melee.

Dagger AI prefers an affordable Puncture against body armor, or Qatal Deathblow against a vulnerable target. Ordinary Stab takes priority when at least 75% of its successful damage rolls finish the enemy; it also remains available against unarmored targets or when the special cannot be afforded.

Melee approach decisions reserve enough AP and fatigue for a real attack before
entering new hostile melee reach. This applies to pursuit, formation advance,
shield reformation and Skirmish movement. A shorter weapon budgets every step
needed through a longer weapon's reach, including terrain costs, movement
credits, mounts, mastery and dazed fatigue limits. Cautious fighters otherwise
stage outside hostile reach, without reversing their previous approach. Safe
movement still uses spare AP, and ranged targets do not impose a melee buffer.
Healthy one-hex frontliners, working shield carriers and Breakers may push into
one new opponent; wounded fighters and approaches into multiple new melee
threats still require the attack budget. Already-engaged fighters remain free
to attack or move without being forced to retreat. Legacy battles keep their
previous approach policy.

Double Grip automatically multiplies one-handed melee weapon damage by 1.25
when the active offhand is empty. It applies to ordinary/named weapons, weapon
skills and weapon reactions for all factions, and is included in AI damage
predictions. It stacks multiplicatively with Duelist (1.25 × 1.12 = 1.40).
Ranged/throwing weapons, two-handed weapons, unarmed attacks, mount bites and
fixed damage do not receive it. Equipped shields, including broken shields,
prevent Double Grip; reserve shields do not. Eligibility updates on weapon
swaps without saving an extra stat. Older pre-completion battle rules stay
unchanged. Weapon details and a battle status icon explain the bonus.

Mounted Flankers prioritize intercepting reachable broken enemies (morale below
25, excluding morale-immune enemies) when no opponent is adjacent. They approach
within one hex, using their current melee weapon or drawing a melee reserve or
pocket weapon with normal swap costs. This interception duty takes precedence
over wing targeting and formation commands; wounded-brother preservation still
wins. Routes avoid other opponents’ adjacent hexes and obey terrain, fatigue,
movement AP and approach-safety checks. Already engaged riders do not abandon
healthy adjacent opponents to pursue another enemy. At contact with a broken
enemy they retain melee gear and prefer attacking that enemy, so normal escape
attempts provoke existing opportunity strikes. This adds no guaranteed root,
free stun or escape cancellation: casualties and existing combat effects decide
whether the enemy gets away. Targets are reevaluated every action, so recovery,
death, escape and blocked paths do not leave stale pursuit orders.

## Reach Support

Auto selects Reach Support for an equipped melee weapon with more than one hex
of reach, before the mounted Breaker rule; explicit roles and ranged-loadout
rules retain priority. The role is also selectable in Battle behavior. Existing
active battles retain their saved role until the next battle.

Reach Support attacks from a useful current position instead of repositioning
for marginal cover. When it advances, it prefers a position immediately behind
an intact shield carrier, then another melee teammate, provided the screen is
closer to the target and its route costs no more than two extra movement-cost
units. Without a screen it approaches only to weapon reach, avoiding every
opponent's adjacent hexes along the route. Occupancy, terrain and enemy movement
are reevaluated each action; rough terrain can select an alternate route rather
than repeatedly attempting an unaffordable attack position. Steps entering its
attack range reserve AP and fatigue for an actual basic attack.

An adjacent opponent causes fighting rather than disengagement. An affordable
one-hex melee reserve can be drawn if the swap and an attack fit the budget;
the reach weapon returns once unengaged. Without a usable backup it keeps fighting
with the current weapon. It never uses mounted Charge, and does not Hook a
nonadjacent enemy into its own adjacent hex. Formation commands, friendly-fire
safety and wounded-brother preservation still apply. This is a positioning role,
not an extra range, damage, armor or free-movement bonus.
