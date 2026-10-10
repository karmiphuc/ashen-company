# After-battle performance

The company results panel uses a two-column grid. Fallen brothers appear first,
in original roster order, with a visible death label and warm red border. Living
brothers follow without an arbitrary performance ranking. Allied troops have a
separate grid, also with casualties first. Portraits retain their aspect ratio.
Six compact metrics show enemy kills, enemy armor damage dealt, enemy HP damage
dealt, armor damage received, remaining HP/max HP, and the awarded battle XP.
Icons, directional arrows and short labels identify metrics; hover/accessibility
labels and the panel hint explain them. Wound details are collapsed per brother.
Loot actions remain in the Spoils of war panel.

New battles initialize optional per-unit `battleStats` counters. The shared hit
resolver records actual health lost (capping overkill), actual head/body/attachment
armor lost, and kills. Normal hits, area and multi-strike attacks, bleeding with
an attributable source, mount follow-ups, and reaction attacks use that resolver.
Damage dealt and kills exclude friendly fire; armor received includes it. Shield
wear is not armor damage. Counters do not consume RNG or change combat rewards.
HP remaining comes directly from the unit, and XP uses the existing reward helper;
donation XP remains in the loot donation preview. Fallen brothers receive no XP.

Counters survive active/results saves and realtime snapshots. Save validation
requires exactly the four counter keys with nonnegative safe integer values.
Old saves without counters remain valid and do not gain fabricated history;
completed or active legacy battles show a dash for unrecorded metrics.

Loot actions use a compact 2×2 group. ★ Keep named keeps every loot copy whose
resolved item rarity is `famed`, including weapons, armor and shields, and donates
the exact complement using the existing XP/morale rules. It ignores manual
checkbox selections, preserves retained item conditions, and collects crowns and
supplies normally. The shortcut is disabled when no named items are present.
The hint lists the kept/donated item counts; it does not create extra rewards.

Four company MVP categories highlight the winning metric box with a bold gold
border and a small ★: Most Lethal (kills), Tanker (armor received), Tank Killer
(armor stripped), and Assassin (HP damage inflicted). Accessible labels, hover
labels and the panel hint name each award. All positive ties share an award,
including fallen brothers; allied NPCs, zero scores and unrecorded stats do not
win. Awards are visual recognition and do not change XP or loot.
