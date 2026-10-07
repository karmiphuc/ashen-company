import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { buildCache } from './build-cache.mjs';
import { releaseVersion } from './build-release.mjs';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
const base = pkg.release.baseCommit;
// Full history and ancestry are required: guessing here could reuse a version.
if (!/^[a-f0-9]{40}$/.test(base)) throw new Error('Invalid release base commit');
git('merge-base', '--is-ancestor', base, commit);
if (!git('rev-list', '--first-parent', commit).split('\n').includes(base)) throw new Error('Release base must belong to the first-parent history');
const distance = Number(git('rev-list', '--first-parent', '--count', `${base}..${commit}`));
const version = releaseVersion(pkg.version, distance);
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
