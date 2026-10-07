# Release versions and offline updates

`package.json` is the source of the player-facing release number. Running
`npm run prepare-offline` generates `src/release.js`, used by Save / Menu,
then rebuilds the offline worker from the actual application files. Commit
both generated files with the release change. Release tests reject a stale
generated number, a hardcoded UI number, or missing offline release metadata.

Use a patch bump for player-visible fixes and a minor bump for features. Add
a README release note describing the shipped behavior; docs/tests alone need
no bump. Version 0.55.0 catches up the named forging, equipment family and
three-piece features that shipped after Ancient restoration. Previous UI
builds incorrectly continued to display 0.53.0 despite package version 0.54.0.

The offline cache uses a content hash, not the release number. A stale label
alone therefore did not prove that the gameplay build was old. File changes
create a new cache even when a release bump was missed. When a new worker has
fully cached the app, it asks open windows to pause and save before reloading
their modules. Failed caching keeps the previous working offline build.

To receive an update, open online and wait for **Offline ready**. Save / Menu
should show the current release after activation. An already-open offline app
keeps its installed build until it reconnects. Do not clear site data to update:
that would remove the device's company save. Export a backup from Save / Menu
when troubleshooting.

The release number is separate from the world-save schema and versioned battle
mechanics. Bumping it neither resets companies nor rewrites saved battle rules.

Before delivery, run `node --test tests/release.test.js tests/offline.test.js`,
check Save / Menu in the browser, and verify deployment succeeded for the exact
merged commit. Further tests should follow the gameplay changes in that release.
