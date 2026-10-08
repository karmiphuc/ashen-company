# Named weapons and skill checks — v0.46.9

The catalog adds **46 concrete Battle Brothers named weapon designs**, plus the explicit **Impaler** named crossbow. The handgonne is deferred at the user's request. Ordinary weapons remain unchanged. Two-handed portraits use an 80-pixel grip-to-tip target and a 96-pixel overall bounds limit, keeping weapons proportional to the pawn rather than enlarging long source sprites. New designs use actual pinned inventory images and worn entity-icon sprites, not recolored ordinary art.

The pool includes axes, bardiche, whip, billhook, bladed pike, cleavers, crossbow, dagger, fencing sword, flails, goblin falchion/bow/pike/spear, greataxe, greatsword, northern rusty axe/warblade/skullhammer/spiked mace, javelins, khopesh, longaxe, mace, orc axe/cleaver, pike, polehammer, polemace, qatal dagger, shamshir, spear, spetum, sword, swordlance, throwing axes, two-handed hammer/mace/scimitar, warbow, warbrand and warscythe. Original name pools supply generated names. Impaler retains its explicit name.

Each design receives two distinct modifiers using [the v0.46.8 roll rules](NAMED-ROLLS.md). New discoveries reroll against a frozen **unrolled** definition, never on top of a catalog's representative roll. Damage uses 60% of source min/max to match this campaign's lower fighter health; armor damage and penetration retain source ratios. Weapon load is real, and eligible heavy designs can roll lighter weight. Common skill accuracy is separate from additional named accuracy, preserving BB roll eligibility. Bows/throwers use the campaign's existing ranges and ammunition rules. Source scripts and their original skills/statistics remain recorded in the manifest.

## Discovery and persistence

- Weekly rare armory offers include named weapons in the existing 8% opportunity, at most one named item per eligible town. They replace a normal premium weapon slot. Northern and southern offers retain their culture; ancient and greenskin designs stay out of normal city shelves.
- Champions may wield a sourced design matching their weapon family, hands, reach and regional theme. If no compatible source design exists, the existing generated named weapon remains available. Defeating the champion guarantees the wielded item.
- Higher-tier frontier camps can yield regional source designs in their existing named-item reward roll. Ancient camps favor the crypt cleaver; lighter forest designs stay light. Chances do not increase merely because the pool is larger.
- The equipment collection browser has a **Named weapons** filter, including Impaler, with actual damage and weight rather than armor-only labels. Catalog rolls are representative; discovered variants have their own fixed identities.
- Source named items, alternate rolls, partial throwing bundles and buybacks persist through equip/stow, trade and save imports. Impaler is named from creation and reloads as a crossbow after each bolt.

## Skill audit

Existing weapon-family, named-roll, mastery, ranged/ammunition, reaction, mount and battle-save tests were reviewed and run together. New coverage tests every added design in an actual battle and representative complete battles with a reload between every action.

| Skill or action | Checks |
|---|---|
| Ordinary attacks / Quick Shot | Weapon family, reach, AP, fatigue, head chance, damage, ammunition and mastery |
| Aimed Shot | Extra range/accuracy, 7 AP, 15 fatigue, named discount before Bow Mastery |
| Piercing Bolt / Reload | Extra penetration, one bolt per shot, loaded-state persistence, 3 AP shot and 4 AP reload |
| Shieldwall / Knock Back | Shield-specific discounts, independent melee/ranged defense, duration, push without health damage, blocked terrain |
| Spearwall | Legal approach, interception, 5-fatigue reaction, hit stops movement, miss ends stance; two-hex Spetum reach |
| Riposte | Adjacent melee misses, no recursive counters, reaction cost, off-turn Berserk AP |
| Split / Swing | Geometry, separate hit rolls, one AP/fatigue/ammo payment, friendly-fire safety, aggregate kill perks |
| Knock Out / Stunning Stone | Half damage, one skipped activation, stun protection and no immediate stun locking |
| Puncture | Body-only health damage, no armor damage, accuracy penalty and affordability |
| Deathblow / Decapitate | Target status/health prerequisites and increased damage |
| Split Shield | Shield prerequisite, correct reach/cost; **new battles always strike shield durability only**, without health/armor damage, head hits or on-damage morale |
| Crush Armor | Armor prerequisite and increased armor damage |
| Lash / Whip Crack | Forced head hit and bypassed shield defense |
| Hook | Legal pull destination, only pulls on a hit, terrain/height/occupancy, stance cancellation |
| Power Throw | Increased damage, exactly one bundle charge, named ammunition capacity |
| Lunge | Fencing sword only; exactly two hexes; one free legal step and one thrust; 4 AP/25 fatigue before named discounts/mastery; initiative-scaled damage; no adjacent enemy; blockers/cliffs/insufficient fatigue rejected; Spearwall can intercept |
| Charge / Wolf Bite / Howling | Existing mount reaction, damage, movement, kill-credit and duration coverage retained |

**Split Shield was a real defect:** it previously dealt ordinary health/armor damage as well as shield wear. Its prediction and execution now agree on the shield-only effect. These corrections and Lunge are gated by `weaponAuditVersion: 1` for new battles. Already-active fights retain the previous skill rules. Named-stat discounts are applied before mastery, including newly added named designs.

Weapons use the campaign's existing family skill set, plus the fencing Lunge and Spetum's reach-aware Spearwall. This is not a claim to implement every original BB move: for example, source Reap/Disarm/Round Swing are recorded as provenance rather than newly implemented abilities. Handgonne and the separate legendary Lightbringer/Obsidian artifacts are outside this named pool.

## Reproducible sources

The source remains [kovasap/battle-bros-decompiled at e06d68df](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7). [The manifest](../../assets/named-weapons-source.json) records every imported definition, excluded named script, name pool, selected variant, inventory icon, worn brush/crop/grip and SHA-256 hash. [The importer](../../tools/content/import-bb-named-weapons.py) rebuilds deterministic data and embedded art:

```sh
python tools/content/import-bb-named-weapons.py --cache /tmp/bb-source
npm run prepare-offline
npm test
```

The actual `named/*.nut`, `scripts/config/item_names.nut`, `brushes/entity_icons.brush`, `gfx/entity_icons.png`, and `split_shield.nut`/`lunge_skill.nut` rules were inspected. BB art attribution remains in [ASSET-CREDITS.md](../art/ASSET-CREDITS.md).

The v0.47.1 portrait correction bounds the complete rotated named two-handed sprite above the pawn ground anchor. Designs with grips above long handle butts move upward individually, preserving their size and mounted rider offset, with a shallower opposite-shoulder resting angle. Pixel-based regression coverage checks every named two-hander, alternate rolls and all mount species.
