# Direwolf Moonfang Harness

The selected third design becomes a craft-only body armor: an asymmetric
ash-tipped direwolf mantle over dark chevron leather, with a visible steel mail
sleeve and a silver crescent clasp. Inventory and worn layers have distinct
framing; the wolf head stays on the viewer's left shoulder. It fits beneath
existing faces and helmets and uses the same art for named and reforged variants.

## Recipe and progression

At every open settlement's **Armorer → Direwolf fusion**, consume one ordinary
Direwolf Hide Armor, one ordinary Direwolf Mail Armor and **600 crowns**.
Players choose the exact stash copies. Initial selection favors worn copies;
broken pieces qualify. Equipped, named, reforged and already crafted pieces do
not. Crafting is guaranteed, creates one fully repaired harness, and has an
independent **3% named chance** using existing version-7 affixes.

The **180 armor / 13 fatigue** baseline follows the selected lighter Moonfang
direction. It improves on Direwolf Hide (100/9) and Direwolf Mail (140/13) while
keeping a mobile fighter's distinct role below the heavier restored Ancient
armor. Price is 1,090 (original pieces' values plus crafting fee); resale uses
the existing market rules. It cannot spawn in ordinary stocks, shipments or
courier rewards; crafted pieces may be sold and bought back normally.

Successful melee hits add **5 morale damage before resolve resistance**. This
is the existing Direwolf Fur magnitude and does not stack with either attachment
slot: the largest equipped intimidation value applies once. Shots and no-damage
actions do not trigger it, undead remain immune, and armor depletion does not
remove the effect. Named and reforged harnesses retain it; transferring affixes
to another base design does not transfer intrinsic intimidation. No area aura
or new set bonus is introduced.

## Transaction and save behavior

The engine revalidates location, settlement access, travel/battle/game-over
state, exact material identities, distinct indices, gold and quote freshness.
Both materials are replaced by the output, so a full stash needs no spare slot.
Confirmation discloses permanent consumption. Cancellation spends nothing.

The UI computes on a cloned state and persists the complete save before adopting
the transaction. Storage failure leaves materials, gold and the next roll intact
and permits retry; successful transactions invalidate their quote immediately.
The optional `direwolfCraftSerial` supports old saves that omit it and is bounded
to one million. Success increments it exactly once. The named roll depends only
on campaign seed and this independent sequence, never on material condition,
town, day, previews or Ancient restoration attempts. As with other campaign RNG,
restoring an external pre-attempt backup restores the earlier state.

## Artwork

The inventory PNG is 140×280, and the worn layer is 104×94 at left 0 / top 20
in the existing portrait frame. Both have alpha transparency and are cached
offline. The source manifest in `assets/direwolf-moonfang/` records the selected
concept, generated asset masters, reference designs and SHA-256 checksums.
Image generation created the artwork; ImageMagick performs only aspect-preserving
asset sizing and transparent canvas packaging. Generated master files remain in
the session's `/workspace/generated_images` directory.

Validation covers ordinary/named crafting, exact-copy consumption, invalid and
stale quotes, affordability, old saves, full stashes, equip/resale/buyback,
named/forge identity, melee intimidation, shots/undead, duplicate fur effects,
PNG transparency and offline packaging. Chromium checks exercise desktop,
tablet and mobile crafting, cancellation, named output, inspection navigation,
reload persistence and quota-failure recovery. Worn compositions were inspected
with uncovered heads, open helmets and closed helmets.
