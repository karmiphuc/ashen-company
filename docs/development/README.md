# Development guide

[Documentation index](../README.md) · [Project README](../../README.md#development)

## Local development

Use Node.js 24 and `npm ci` to install the pinned development dependencies. Run `npm start` and open `http://127.0.0.1:4173`. The runtime is a static browser app with relative URLs and no application server.

After runtime or artwork changes, run `npm run prepare-offline` to regenerate development release metadata and the content-derived offline cache. Do not edit generated `src/release.js` or `sw.js` manually. Run `npm test` for the full unit/regression suite.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/engine.js` | Campaign rules, combat, item resolution and save validation |
| `src/app.js` | Interface actions and local save handling |
| `src/campaign-ui.js`, `src/campaign.css` | Campaign and company screens |
| `src/battle-view.js` | Combat rendering and animation |
| `src/portraits.js` | Character and equipment composition |
| `src/*-ui.js` | Feature-specific interface rendering |
| `assets/` | Runtime artwork/audio and provenance manifests |
| `tests/`, `e2e/` | Node regression tests and production browser checks |
| `tools/` | Static serving, content generation, cache and release tooling |
| `.github/workflows/release.yml` | Validated build, Pages deployment and live verification |

## Production checks

Run `npm run build`, install Chromium with `npx playwright install --with-deps chromium`, then run `npm run test:release`. Full Git history is required, and the release base must occur in the checkout's first-parent history; PR checks use a merge checkout. The generated `dist/` contains runtime files only.

Production generation changes release metadata and cache in its checkout. After local production checks, run `npm run prepare-offline` before committing to restore development outputs. Do not commit `dist/` or manually bump a patch version.

See the [release process](RELEASES.md) for numbering, publishing requirements, offline updates and deployment verification. Consult [historical verification](../releases/VERIFICATION.md) for prior evidence and its limits.

## Documentation maintenance

Keep the project README focused on playing and starting development. Add release summaries to [release notes](../releases/NOTES.md), with entries in the [release log](../releases/CHANGELOG.md). Add or update the appropriate topic document and its link in the [documentation index](../README.md).

Current mechanics belong in gameplay, equipment or world references. Keep design research and future plans explicitly separate; dated QA and verification records describe the revision tested, not every later build. Use relative Markdown links and update source/tool references when moving a document.
