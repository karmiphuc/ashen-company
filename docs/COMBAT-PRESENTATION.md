# Realtime combat presentation

Realtime combat keeps the existing independent action clocks, AP costs, mounted
movement and save rules. Riders still pay 1 AP per walkable hex; their movement
advantage is not removed to mask rendering problems.

The view preserves fighter, pawn and unchanged portrait elements. Movement runs
on the fighter, attacking on the pawn/weapon, and receiving damage on the portrait.
Each incoming damage callout keeps its own event identity and timestamp. A newer
hit cannot borrow an older movement clock or replay the last second of damage.
Health bars and falls use the incoming impact clock, while projectiles use their
source event clock. Forced movement such as shield pushes has its own motion
clock, allowing an ongoing attack to continue without snapping the recipient. Cinematic attacks retain their extended visual lifetime.

The browser presentation clock is monotonic and survives rebuilding the view.
It extrapolates at most 100 simulation milliseconds between worker snapshots.
Animation progress is sought from that clock every display frame; paused playback
retains its previous rate. Changing speed adjusts duration and progress together.
No extra action queue, deliberate one-second delay or save fields are introduced.
Initiative-based recovery with AP remaining is capped at 1,000 simulation ms;
ordinary shorter recoveries retain their original pace. Exhausted fighters still
settle at their animation end, and Berserk AP remain available in the same cycle.
Stuns and other effects retain their simulation expiry. A stunned fighter with
unspent AP cannot keep an otherwise exhausted cycle waiting at the six-second
boundary. Empty-tail skipping waits for recent impact animations to settle;
pause still advances no time. Bleeding and AP refresh run through the existing
round transition.
Terminal battles keep advancing the final hit/fall through a hold of at most one
second. Completed CSS animation handles are retained so the next identical rider
step or attack can restart without replacing its element.

Full rendering initializes animation tracks immediately; playback buttons and the
space shortcut update the existing battlefield and synchronize playback audio.

Animation discovery is batched after DOM writes rather than causing one style
flush per fighter. Unchanged DOM subtrees and finished animation tracks are skipped.
Event indexes are shared across fighters. These reduce main-thread work while the
simulation continues in its existing worker.

## Browser regression coverage

`e2e/combat-presentation.spec.js` covers overlapping movement and hits, multiple
incoming hits, stable DOM/portrait identity, separate impact timestamps, cinematic
lifetimes, shield pushes during attacks, terminal falls after movement, pause/resume including pausing from 4x, and actual app playback controls.
The mixed-combat fixture explicitly fields nine brothers (three mounted), versus
ten foot enemies, on a 1024 x 768 viewport. It exercises the real worker at both
speeds across multiple AP cycles with normal CPU execution and Chromium's four-times CPU throttling.

Performance guards require average FPS above 45 normally and 30 under throttling,
95th-percentile frame gaps below 50ms normally and 100ms under throttling, and no
frame, worker-snapshot or visible-action idle gap of one second. The fixture
runs eight seconds per speed and must cross an AP-cycle boundary. Warm-up/worker startup is included.
These are regression budgets for this controlled fixture, not a guarantee for all
hardware, battle sizes or browser resource pressure. The first passing measured
runs averaged about 60 FPS normally and 31–52 FPS under throttling; snapshot gaps
were below 350ms after integration with the newer armory assets. Physical iPad verification remains useful.

Run `npm run build` followed by `npm run test:release`. The existing realtime,
mounted-control and battle-view Node tests check the unchanged combat rules;
the release browser tests also verify save-preserving offline updates.
