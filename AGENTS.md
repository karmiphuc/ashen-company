# Delivery

Deliver repository changes through pull requests. Complete the implementation and relevant checks, commit and push a task branch, and open a pull request against `main` before reporting completion. Include the pull request link and validation results in the final response.

If GitHub access blocks pull request creation, preserve the completed work on a pushed branch when possible and report the specific blocker. Merge only when the user requests it.

# Releases

Deployment automatically advances the patch version from `package.json` using
the first-parent commit count since `release.baseCommit`. Do not manually bump
the patch for each PR. For a new minor release, set its base version and anchor
to an existing ancestor commit together, and add its summary to README.md.
Run `npm run prepare-offline` for development metadata and the offline worker.
Never hardcode a separate version in the UI or edit the generated files manually.
Run `node --test tests/release.test.js tests/offline.test.js` before opening the PR.
The Verified release workflow runs the full suite, builds and browser-tests the
production artifact, and checks the live commit/cache. Wait for it before
reporting deployment. Docs/test merges get distinct build numbers too.
Release versions are separate from save and combat rule versions; do not change
save schemas merely to update the displayed release number.
