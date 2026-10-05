# Simultaneous combat beta

Goal: keep the existing hex battlefield and tactical decisions while allowing every fighter to act independently, so larger engagements do not wait for one fighter's whole turn or animation.

## Scope and activation

Default off. Opening the game with `?combat-beta=1` opts into the beta and unlocks a collapsed Experimental combat control in Save / Menu. `?combat-beta=0` disables it. The preference applies to new encounters only. Each active battle saves its own clock, so disabling the setting never converts a battle or discards actions. Old battles and old saves retain their existing rules.

## Simulation plan

- Fixed 50 ms simulation steps, independent per-fighter readiness, and a shared 6-second AP cycle. Everyone refreshes 9 AP together; Berserk retains its existing extra AP. Initiative, fatigue, Daze and Stagger affect recovery timing. A caught company grants the attackers a short opening head start.
- Run the existing role, tactic, weapon-swap, skill, target, movement and damage logic as one atomic action when a fighter becomes ready. Do not create another competing AI. Reactions, ammo costs, fatigue, loot, XP and allied ownership use the existing rules.
- Equal-time actions resolve by effective initiative, then stable unit ID. Each action reads the latest grid. A occupied destination is unavailable to later actions; movement, Rotation, knockback, charge and reactions never bypass the engine's legality checks. This is concurrent action scheduling with deterministic atomic conflict resolution, not simultaneous stale-state damage writes.
- Action costs determine independent recovery; even a free swap or bleeding tick has a minimum delay. Nobody can exhaust the whole company's turn queue before opponents act. Holds wait for the next AP cycle, and exhausted units cannot spin on zero-cost decisions.
- Stun lasts 6 seconds; Daze, Stagger, Disarm and Howling use saved timed expiries corresponding to their existing number of turns. Bleeding, per-cycle perks, stances, adaptive tactics and morale checks use the shared AP cycle. Overwhelm affects a target with remaining AP and expires at the next cycle. This beta timing differs from sequential turn order.
- Pause, menus, background tabs and reload stop simulation. A module worker runs bounded batches outside the UI thread. A saved pending-action queue retains equal-time actors between batches; these work budgets never change priority or RNG outcomes. Pausing, hiding, or changing tactics terminates in-flight work and keeps the last applied snapshot. Browsers without module workers fall back to bounded main-thread execution. Bounded catch-up prevents a suspended tab from instantly resolving a battle. Saving retains RNG, AP, timers, fractional elapsed remainder, bounded backlog, pending equal-time actors, wounds and action readiness; animation/audio history stays ephemeral to prevent replay on reload.

## Presentation and verification

Render multiple fighters, reactions and projectiles together. Update changed units in place so unrelated actions do not restart movement, reset the camera, or replay sounds. All combat speeds advance the shared clock; Cinematic uses a 1× shared clock with faster movement visuals and slower attack visuals, without freezing other fighters. Standard combat keeps its existing Cinematic timing.

Verify deterministic split-tick and reload results, collision legality, both sides acting within the same cycle, initiative/fatigue timing, AP bounds, status expiry, reactions and ammo, death/retreat/loot settlement, allies, old saves, hidden configuration, and 47-fighter joined encounters (15 brothers + 8 allies + 24 undead) and 45-fighter marshal battles (15 brothers + 30 undead). Do not raise roster limits or rewrite campaign enemy generation as part of this beta.
