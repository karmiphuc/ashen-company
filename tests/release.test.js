import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APP_VERSION } from '../src/release.js';
import { renderRelease } from '../tools/build-release.mjs';
import { listOfflineAssets } from '../tools/build-cache.mjs';

test('displayed release is generated from package metadata and cached offline', async () => {
  const root = new URL('../', import.meta.url);
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  assert.equal(APP_VERSION, pkg.version);
  assert.equal(await readFile(new URL('src/release.js', root), 'utf8'), await renderRelease(), 'Run npm run prepare-offline after bumping package.json');
  const app = await readFile(new URL('src/app.js', root), 'utf8');
  assert.match(app, /Version \$\{APP_VERSION\}/);
  assert.doesNotMatch(app, /Version \d+\.\d+\.\d+/);
  assert.ok((await listOfflineAssets()).includes('./src/release.js'));
  assert.match(await readFile(new URL('README.md', root), 'utf8'), new RegExp(`Version ${pkg.version.replaceAll('.', '\\.')}`));
});
