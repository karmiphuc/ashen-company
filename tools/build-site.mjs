import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { buildCache } from './build-cache.mjs';
import { releaseBuild } from './release-history.mjs';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const { version, distance, commit } = releaseBuild(pkg, root);
await buildCache({ distance, commit });
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive:true, force:true });
await mkdir(output, { recursive: true });
// Publish only runtime files, never source tests, tooling or repository metadata.
for (const path of ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'assets']) {
  await cp(new URL(path, root), new URL(path, output), { recursive: true });
}
await writeFile(new URL('release.json', output), JSON.stringify({ version, commit }, null, 2) + '\n');
console.log(`Built ${version} from ${commit}`);
