import { execFileSync } from 'node:child_process';
import { releaseVersion } from './build-release.mjs';

export function releaseBuild(pkg, cwd) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'] }).trim();
  const commit = git('rev-parse', 'HEAD'), base = pkg.release.baseCommit;
  // Never guess when history is missing: that could reuse a deployed number.
  if (!/^[a-f0-9]{40}$/.test(base)) throw new Error('Invalid release base commit');
  git('merge-base', '--is-ancestor', base, commit);
  if (!git('rev-list', '--first-parent', commit).split('\n').includes(base)) throw new Error('Release base must belong to the first-parent history');
  const distance = Number(git('rev-list', '--first-parent', '--count', `${base}..${commit}`));
  return { version:releaseVersion(pkg.version, distance), distance, commit };
}
