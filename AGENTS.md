# Delivery

Deliver repository changes through pull requests. Complete the implementation and relevant checks, commit and push a task branch, and open a pull request against `main` before reporting completion. Include the pull request link and validation results in the final response.

If GitHub access blocks pull request creation, preserve the completed work on a pushed branch when possible and report the specific blocker. Merge only when the user requests it.

# Releases

For player-visible gameplay or UI changes, bump `package.json` before delivery
(patch for fixes, minor for features), and add the release summary to README.md.
Run `npm run prepare-offline` to generate `src/release.js` and rebuild `sw.js`.
Never hardcode a separate version in the UI or edit the generated files manually.
Run `node --test tests/release.test.js tests/offline.test.js` before opening the PR.
Documentation-only and test-only changes do not need a release bump.
Release versions are separate from save and combat rule versions; do not change
save schemas merely to update the displayed release number.
