import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listOfflineAssets, renderServiceWorker } from '../tools/build-cache.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function runtimePngs(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return runtimePngs(path);
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.png') && !/^contact[-_]sheet/i.test(entry.name)) {
      return ['./' + relative(ROOT, path).split(sep).join('/')];
    }
    return [];
  }));
  return paths.flat().sort();
}

test('offline list contains every runtime image and required app file', async () => {
  const assets = await listOfflineAssets();
  assert.equal(new Set(assets).size, assets.length);
  for (const path of ['./', './index.html', './src/app.js', './src/engine.js', './src/map.js', './src/portraits.js', './src/style.css', './manifest.webmanifest', './assets/icon.svg']) {
    assert.ok(assets.includes(path), `${path} is missing`);
  }
  assert.deepEqual(assets.filter(path => path.endsWith('.png')).sort(), await runtimePngs(join(ROOT, 'assets')));
  assert.ok(assets.every(path => !path.includes('contact-sheet') && !path.includes('ASSET-CREDITS')));
  for (const path of assets) {
    await assert.doesNotReject(readFile(join(ROOT, path === './' ? 'index.html' : path.slice(2))));
  }
});

test('generated service worker matches current content and serves local requests from cache', async () => {
  const source = await readFile(join(ROOT, 'sw.js'), 'utf8');
  const manifest = source.match(/^const ASSETS = (\[[\s\S]*?\]);$/m);
  assert.ok(manifest, 'generated asset list is missing');
  assert.deepEqual(JSON.parse(manifest[1]), await listOfflineAssets());
  assert.equal(source, await renderServiceWorker(), 'run node tools/build-cache.mjs after changing app files or art');
  assert.match(source, /cache\.addAll\(urls\.map\(url => new Request\(url, \{ cache: 'reload' \}\)\)\)/);
  assert.match(source, /await caches\.delete\(CACHE\)/);
  assert.match(source, /count: present\.filter\(Boolean\)\.length/);
  assert.doesNotMatch(source, /fetch\(event\.request\)/);
});
