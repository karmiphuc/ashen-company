# Automated releases and offline updates

## What failed

The UI hardcoded 0.53.0 while package metadata had reached 0.54.0. Later equipment
features shipped without another release number. Legacy GitHub Pages published
main directly: no repository test/build gate caught the drift. Version 0.55.0
unified the displayed version; the Verified release pipeline removes the remaining
manual patch-bump and deployment steps.

## Automatic numbering

`package.json` specifies the base version and `release.baseCommit`. Production
builds add the number of first-parent commits after that ancestor to the base
patch number. With base 0.55.0 at commit `79ea856`, the next merged commit is
0.55.1, then 0.55.2. Every main commit, including documentation changes, receives
a distinct version. Rebuilding a commit produces the same version and cache.
Full git history is required; missing or unrelated anchors fail the build.

For a deliberate minor release, update the base version and anchor together to
an existing main ancestor and add a README summary. Do not manually increment
patch numbers for individual PRs. Development `prepare-offline` displays the
base version; the production `build` generates both version and exact commit.
Save / Menu shows the release and eight-character build ID; `release.json` in
the published artifact records the full commit. Save/battle rule versions remain
independent. No company reset or schema change follows from a release bump.

## Pipeline

`.github/workflows/release.yml` runs on PRs, main pushes and manual dispatch:

1. Check out full history; use Node 24, pinned actions and `npm ci` with a lockfile.
2. Regenerate development metadata/cache and run the complete Node test suite.
3. Generate production version/cache and copy only runtime files into `dist`.
4. Browser-test that exact build in an iPad-sized Chromium viewport: boot, correct
   version/build ID, complete offline cache, offline reload and company retention.
5. For main only, upload the tested artifact and deploy it through GitHub Pages.
   Deployment requires validation success; PRs have no publishing permissions.
6. Reject a build superseded by a newer main commit before deployment. Serialize
   main releases instead of interrupting a deployment halfway through.
7. Fetch the published receipt, release module and service worker, retrying CDN
   propagation, and compare them with the exact expected commit and contents.
   A deployment is complete only when **Verify live release** succeeds.

Validation/build/browser failure prevents publishing and leaves the previous
Pages deployment intact. A live-verification failure marks the run failed and
requires investigation; it does not prove the site has rolled back. Correct
with a reviewed fix or revert PR, producing a fresh main commit and version.
Never bypass validation by uploading files directly. Failed browser traces are uploaded as diagnostics for seven days; use them
when diagnosing failures.

The repository must use Pages **GitHub Actions** publishing, not legacy branch
publishing. `Validate release` should also be a required branch check where an
administrator can configure it. The current connector cannot read or edit
branch-protection settings (HTTP 403); the workflow still gates deployment.

## Commands and update behavior

- `npm ci`: reproduce pinned development dependencies.
- `npm run prepare-offline`: generate development metadata and cache.
- `npm test`: complete unit/regression suite.
- `npm run build`: produce commit-numbered, deterministic `dist`.
- `npx playwright install --with-deps chromium`: install the pinned browser.
- `npm run test:release`: check the built artifact, including offline play.

Production generation changes source metadata/cache in its disposable checkout.
Do not commit those production outputs back to main or create a release-commit
loop. Run `prepare-offline` again after local production checks to restore the
base development metadata before committing. `dist` is ignored by git.

Offline caches use a content hash, not just the version number. A stale label
alone did not prove that gameplay was old. After the new worker fully caches
the app, it asks open windows to pause/save before reloading their modules.
A failed save prevents automatic reload; incomplete caching keeps the old cache.

To update, open online and wait for **Offline ready**, then check Save / Menu.
An offline app retains its installed version until reconnecting. Do not clear
site data to update: that removes the device's company. Export a save backup
when troubleshooting.
