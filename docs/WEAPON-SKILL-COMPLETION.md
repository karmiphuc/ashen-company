# Existing weapon skill completion

101 existing catalog weapons, including all 46 imported named weapons, are covered. No new weapons or handgun work.

## Source and scope

Astra reviewed the plan once before implementation. The named weapon `onEquip()` lists and active definitions were checked against [the pinned Battle Brothers source](https://github.com/kovasap/battle-bros-decompiled/tree/e06d68df0915827967f98a05d0c705c1f53df0b7/scripts/items/weapons/named). Tests retain those independent lists in `tests/fixtures/weapon-source-skills.json`. Combat profiles resolve stable base identity before art/training families, so rolled items retain their actions. UI, AI, costs and execution share resolved actions. Old active saves retain their previous rules; new battles opt into `weaponCompletionVersion: 1`.

## Shared mechanics

- Distinct line, adjacent arc, six-hex ring and two-hex arc attacks. AI considers empty arc anchors, excludes extreme height differences and retains ally-risk checks. Area actions spend AP/fatigue once and defer kill perks.
- Cascade/Hail: three independent strikes at one-third damage, paid once. Split Man: a full blow and half-strength opposite-location hit. Reactions can stop remaining strikes if the attacker dies. Saved per-strike events drive separate impact sounds.
- Disarm suppresses weapon attacks, cavalry/lunge actions and weapon reactions; movement, shields and recovery remain available. It expires after the affected owner's next turn.
- Cudgel dazes for two owner turns: −25% damage, fatigue capacity and initiative. Smite/Shatter/Repel stagger for one owner turn: −50% initiative. Remaining turn order and initiative-dependent Dodge/Lunge respond immediately; original stats remain intact.
- Cleave/Decapitate/Rupture wounds inflict 3 bleeding health per owner turn; Whip inflicts 6. Repeated wounds stack to 18 and refresh two turns. Explicit undead troops resist bleeding/daze. Bleeding uses ordinary death, morale and killer XP/perk handling without attack AP, fatigue, ammo, reload or mount attacks.
- Repel and Impaler push surviving targets to a legal neighboring hex farther from the attacker, canceling stances. Terrain, occupancy and height checks share existing shield displacement rules.
- Warbrand and 2H cleaver basics cost 4 AP before mastery. Spetum Spearwall costs 6 AP / 35 fatigue before mastery and guards its two-hex boundary. Reload remains an automatic combat action.

## Deliberate adaptations and remaining fidelity work

Existing scaled weapon damage, named rolls and established special skills are retained. Bleeding uses scaled 3/6 health rather than BB's 5/10. Non-damaging Repel omits falling damage because current displacement rules reject cliffs. The game has no persistent injury or rooted/net system: Gash gives a two-turn debilitating wound using Daze after at least 7.5% maximum-health damage, rather than BB's varied cutting injuries; Deathblow recognizes stun and daze. Multi-hit kill probability is conservative in tactical prediction: multi-strike attacks currently receive zero predicted lethal probability; all strikes execute normally. Hammer/Smite/Batter use a scaled minimum health hit; Demolish deals 6 health plus 145% armor damage. Project-specific estoc uses a penetrating thrust; goedendag uses heavy club actions; glaive/rhomphaia use cutting polearm/Reap actions. These are authored assignments, not verbatim BB mechanics.

Follow-up candidates: location-specific injury rules, net/root eligibility, falling damage for Repel, precise multi-strike kill prediction, and mastery-specific BB variations beyond existing game mastery rules. All present weapons have their intended action sets and executable mechanics.

## Complete catalog coverage

| Weapon | Combat profile | Actions (AP before mastery) |
| --- | --- | --- |
| arming-sword | sword | Slash (4), Riposte (4) |
| spear | spear | Thrust (4), Spearwall (4) |
| wood-axe | axe | Chop (4), Split Shield (4) |
| bludgeon | mace | Bash (4), Knock Out (4) |
| rondel-dagger | dagger | Stab (3), Puncture (4) |
| billhook | billhook | Strike (6), Hook (6) |
| hunting-bow | bow | Quick Shot (4), Aimed Shot (7) |
| light-crossbow | crossbow | Shoot Bolt (3), Piercing Bolt (3) |
| falchion | sword | Slash (4), Riposte (4) |
| fighting-spear | spear | Thrust (4), Spearwall (4) |
| military-cleaver | cleaver | Cleave (4), Decapitate (4) |
| flail | flail | Flail (4), Lash (4) |
| warhammer | hammer | Hammer (4), Crush Armor (4) |
| winged-mace | mace | Bash (4), Knock Out (4) |
| greatsword | greatsword | Overhead Strike (6), Split (6), Swing (6), Split Shield (6) |
| greataxe | greataxe | Split Man (6), Round Swing (6), Split Shield (6) |
| two-handed-hammer | heavyhammer | Smite (6), Shatter (6), Split Shield (6) |
| pike | pike | Impale (6), Repel (6) |
| polehammer | polehammer | Batter (6), Demolish Armor (6) |
| war-scythe | scythe | Strike (6), Reap (6) |
| whip | whip | Whip (4), Disarm (5) |
| shamshir | shamshir | Slash (4), Gash (4) |
| qatal-dagger | qatal | Stab (3), Deathblow (3) |
| warbow | bow | Quick Shot (4), Aimed Shot (7) |
| heavy-crossbow | crossbow | Shoot Bolt (3), Piercing Bolt (3) |
| javelins | javelin | Throw Javelin (4), Power Throw (4) |
| throwing-axes | throwingaxe | Throw Axe (4), Power Throw (4) |
| heavy-javelins | javelin | Throw Javelin (4), Power Throw (4) |
| heavy-throwing-axes | throwingaxe | Throw Axe (4), Power Throw (4) |
| hand-axe | axe | Chop (4), Split Shield (4) |
| longaxe | longaxe | Strike (6), Split Shield (6) |
| bardiche | bardiche | Split Man (6), Split Axe (6), Split Shield (6) |
| hooked-bill | billhook | Strike (6), Hook (6) |
| bladed-pike | pike | Impale (6), Repel (6) |
| goedendag | mace | Bash (6), Knock Out (6) |
| estoc | estoc | Estoc Thrust (6) |
| falx | heavycleaver | Cleave (4), Decapitate (4), Split Shield (6) |
| three-headed-flail | threeflail | Cascade (4), Hail (4) |
| battle-glaive | scythe | Strike (6), Reap (6) |
| short-bow | bow | Quick Shot (4), Aimed Shot (7) |
| composite-bow | bow | Quick Shot (4), Aimed Shot (7) |
| throwing-spears | javelin | Throw Javelin (4), Power Throw (4) |
| fighting-knife | dagger | Stab (3), Puncture (4) |
| rhomphaia | scythe | Strike (6), Reap (6) |
| reinforced-crossbow | crossbow | Shoot Bolt (3), Piercing Bolt (3) |
| military-spear | spear | Thrust (4), Spearwall (4) |
| longsword | greatsword | Overhead Strike (6), Split (6), Swing (6), Split Shield (6) |
| northern-crude-club | mace | Bash (4), Knock Out (4) |
| northern-serrated-axe | axe | Chop (4), Split Shield (4) |
| northern-warcleaver | cleaver | Cleave (4), Decapitate (4) |
| northern-rusty-greatsword | greatsword | Overhead Strike (6), Split (6), Swing (6), Split Shield (6) |
| northern-heavy-flail | heavyflail | Pound (6), Thresh (6) |
| northern-broadhead-spear | spear | Thrust (4), Spearwall (4) |
| northern-sling | sling | Sling Stone (4), Stunning Stone (4) |
| bb-named-axe | axe | Chop (4), Split Shield (4) |
| bb-named-bardiche | bardiche | Split Man (6), Split Axe (6), Split Shield (6) |
| bb-named-battle-whip | whip | Whip (4), Disarm (5) |
| bb-named-billhook | billhook | Strike (6), Hook (6) |
| bb-named-bladed-pike | pike | Impale (6), Repel (6) |
| bb-named-cleaver | cleaver | Cleave (4), Decapitate (4) |
| bb-named-crossbow | crossbow | Shoot Bolt (3), Piercing Bolt (3) |
| bb-named-crypt-cleaver | heavycleaver | Cleave (4), Decapitate (4), Split Shield (6) |
| bb-named-dagger | dagger | Stab (3), Puncture (4) |
| bb-named-fencing-sword | fencing | Slash (4), Lunge (4) |
| bb-named-flail | flail | Flail (4), Lash (4) |
| bb-named-goblin-falchion | sword | Slash (4), Riposte (4) |
| bb-named-goblin-heavy-bow | bow | Quick Shot (4), Aimed Shot (7) |
| bb-named-goblin-pike | goblinpike | Rupture (6), Repel (6) |
| bb-named-goblin-spear | spear | Thrust (4), Spearwall (4) |
| bb-named-greataxe | greataxe | Split Man (6), Round Swing (6), Split Shield (6) |
| bb-named-greatsword | greatsword | Overhead Strike (6), Split (6), Swing (6), Split Shield (6) |
| bb-named-heavy-rusty-axe | greataxe | Split Man (6), Round Swing (6), Split Shield (6) |
| bb-named-javelin | javelin | Throw Javelin (4), Power Throw (4) |
| bb-named-khopesh | cleaver | Cleave (4), Decapitate (4) |
| bb-named-longaxe | longaxe | Strike (6), Split Shield (6) |
| bb-named-mace | mace | Bash (4), Knock Out (4) |
| bb-named-orc-axe | axe | Chop (4), Split Shield (4) |
| bb-named-orc-cleaver | cleaver | Cleave (4), Decapitate (4) |
| bb-named-pike | pike | Impale (6), Repel (6) |
| bb-named-polehammer | polehammer | Batter (6), Demolish Armor (6) |
| bb-named-polemace | polemace | Crumble (6), Knock Over (6) |
| bb-named-qatal-dagger | qatal | Stab (3), Deathblow (3) |
| bb-named-rusty-warblade | heavycleaver | Cleave (4), Decapitate (4), Split Shield (6) |
| bb-named-shamshir | shamshir | Slash (4), Gash (4) |
| bb-named-skullhammer | heavyhammer | Smite (6), Shatter (6), Split Shield (6) |
| bb-named-spear | spear | Thrust (4), Spearwall (4) |
| bb-named-spetum | spetum | Prong (6), Spearwall (6) |
| bb-named-sword | sword | Slash (4), Riposte (4) |
| bb-named-swordlance | scythe | Strike (6), Reap (6) |
| bb-named-three-headed-flail | threeflail | Cascade (4), Hail (4) |
| bb-named-throwing-axe | throwingaxe | Throw Axe (4), Power Throw (4) |
| bb-named-two-handed-flail | heavyflail | Pound (6), Thresh (6) |
| bb-named-two-handed-hammer | heavyhammer | Smite (6), Shatter (6), Split Shield (6) |
| bb-named-two-handed-mace | heavymace | Cudgel (6), Strike Down (6), Split Shield (6) |
| bb-named-two-handed-scimitar | heavycleaver | Cleave (4), Decapitate (4), Split Shield (6) |
| bb-named-two-handed-spiked-mace | heavymace | Cudgel (6), Strike Down (6), Split Shield (6) |
| bb-named-warbow | bow | Quick Shot (4), Aimed Shot (7) |
| bb-named-warbrand | warbrand | Slash (4), Split (6), Swing (6) |
| bb-named-warhammer | hammer | Hammer (4), Crush Armor (4) |
| bb-named-warscythe | scythe | Strike (6), Reap (6) |
| impaler | impaler | Impaler Bolt (3), Piercing Bolt (3) |
