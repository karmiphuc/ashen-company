# Verification - version 0.6, 2026-09-27

## Automated checks

`npm test` passes all 54 tests. Offline asset and generated service-worker cache consistency pass, as does `git diff --check`.

## Browser checks

At a confirmed 1024x768 viewport, the full crossbow detail and action controls remained visible. The six-face by six-helmet gallery showed complete helmet crowns, open face apertures, and no neck gaps. Six portrait profiles keep their head, hair, beard, and body identity when equipment changes.

The migrated day-2 save retained 133 crowns after the local origin server was stopped and direct HTTP requests failed. Reopening a fresh tab loaded the cached game and preserved the save. Crossbow stats and handling were inspectable; no JavaScript errors occurred in the exercised flows.

Physical iPad Safari installation, airplane-mode launch, and save retention have not been tested.

## Historical v0.5 verification

The previous version passed 47 automated tests and browser checks for battle tactics, combat animation, loot, and an offline battle reload. See Git history for the detailed record.

## Current limits

Combat remains a simplified automatic simulation with three fixed camps and four renewable small roaming bands. Faction armies, perks, and a procedural campaign are not implemented. Player travel crosses terrain directly, and wounds are represented by lost HP rather than Battle Brothers' full injury system.
