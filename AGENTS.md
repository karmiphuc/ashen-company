# Delivery

Deliver repository changes through pull requests. Complete the implementation and relevant checks, commit and push a task branch, and open a pull request against `main` before reporting completion. Include the pull request link and validation results in the final response.

If GitHub access blocks pull request creation, preserve the completed work on a pushed branch when possible and report the specific blocker. Merge only when the user requests it.

# Releases

Deployment automatically advances the patch version from `package.json` using
the first-parent commit count since `release.baseCommit`. Do not manually bump
the patch for each PR. For a new minor release, set its base version and anchor
to an existing ancestor commit together, and add its summary to
`docs/releases/NOTES.md`, indexed in `docs/releases/CHANGELOG.md`.
Run `npm run prepare-offline` for development metadata and the offline worker.
Never hardcode a separate version in the UI or edit the generated files manually.
Run `node --test tests/release.test.js tests/offline.test.js` before opening the PR.
The Verified release workflow runs the full suite, builds and browser-tests the
production artifact, and checks the live commit/cache. Wait for it before
reporting deployment. Docs/test merges get distinct build numbers too.
Release versions are separate from save and combat rule versions; do not change
save schemas merely to update the displayed release number.

# Torso armor artwork

Preserve the Battle Brothers worn torso perspective: the wearer turns slightly
toward their own left (the viewer's right). This is a shallow three-quarter
turn, not a square, symmetrical front view or a pronounced side view. Ground
the exact angle in the original worn armor layer being replaced.

Keep the reference's unequal shoulder widths, sleeve projection, offset collar
opening, chest-plane angles and plate overlaps. Carry that perspective through
new plates, pauldrons, reinforcement, recoloring and generated artwork. A clean
material finish must not flatten the torso into a front-facing inventory display.

Treat inventory icons and worn torso layers as distinct compositions. Adapt the
approved design to the existing worn silhouette and perspective; do not squeeze
or stretch a full-length icon into the short, wide torso layer. Preserve neck and
shoulder placement, portrait anchors, transparency, layering and character scale.

Before accepting new armor art, compare it with the original worn layer and
inspect it on an assembled brother at inventory and combat sizes, including
helmet, weapon and shield overlap. Check that the slight turn remains visible
and that the shoulders and collar fit. Include these perspective requirements
and the original worn layer in image-generation references/prompts. Reject a
symmetrical front-facing torso even if its standalone finish looks cleaner.
