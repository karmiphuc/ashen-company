import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APP_VERSION } from '../src/release.js';
import { renderRelease, releaseVersion } from '../tools/build-release.mjs';
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

test('automatic versions are deterministic, advance past the base and reject invalid counters', () => {
  assert.equal(releaseVersion('0.55.0', 1), '0.55.1');
  assert.equal(releaseVersion('0.55.0', 27), '0.55.27');
  assert.equal(releaseVersion('0.56.2', 3), '0.56.5');
  for (const distance of [-1, 1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => releaseVersion('0.55.0', distance));
  assert.throws(() => releaseVersion('0.55.1', Number.MAX_SAFE_INTEGER));
  assert.throws(() => releaseVersion('0.55', 1));
  assert.throws(() => releaseVersion('999999999999999999.55.0', 1));
});

test('production release module records the exact build commit', async () => {
  const commit = 'a'.repeat(40);
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok((await renderRelease({ distance:3, commit })).includes(`APP_VERSION = "${releaseVersion(version, 3)}"`));
  assert.match(await renderRelease({ distance:3, commit }), new RegExp(`BUILD_COMMIT = "${commit}"`));
  await assert.rejects(renderRelease({ commit:'bad' }), /commit/);
});
