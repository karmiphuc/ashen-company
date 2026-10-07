import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { releaseBuild } from '../tools/release-history.mjs';

test('merged PRs advance once, rebuild deterministically and reject bad or shallow anchors', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ashen-release-'));
  const cwd = join(root, 'repo');
  const git = (...args) => execFileSync('git', args, { cwd, encoding:'utf8', stdio:['ignore','pipe','pipe'] }).trim();
  try {
    execFileSync('git', ['init', '-b', 'main', cwd], { stdio:'ignore' });
    git('config', 'user.name', 'Release test');git('config', 'user.email', 'release@example.test');
    git('commit', '--allow-empty', '-m', 'base');const baseCommit = git('rev-parse', 'HEAD');
    const pkg = { version:'0.55.0', release:{baseCommit} };
    assert.equal(releaseBuild(pkg, cwd).version, '0.55.0');
    git('checkout', '-b', 'feature');git('commit', '--allow-empty', '-m', 'work 1');git('commit', '--allow-empty', '-m', 'work 2');
    const featureCommit = git('rev-parse', 'HEAD');
    git('checkout', 'main');git('merge', '--no-ff', 'feature', '-m', 'merge feature');
    const built = releaseBuild(pkg, cwd);
    assert.equal(built.version, '0.55.1');assert.equal(built.distance, 1);
    assert.deepEqual(releaseBuild(pkg, cwd), built);
    git('commit', '--allow-empty', '-m', 'next fix');assert.equal(releaseBuild(pkg, cwd).version, '0.55.2');
    assert.throws(() => releaseBuild({ ...pkg, release:{baseCommit:featureCommit} }, cwd), /first-parent/);
    assert.throws(() => releaseBuild({ ...pkg, release:{baseCommit:'bad'} }, cwd), /base commit/);
    const shallow = join(root, 'shallow');
    execFileSync('git', ['clone', '--depth', '1', `file://${cwd}`, shallow], { stdio:'ignore' });
    assert.throws(() => releaseBuild(pkg, shallow));
  } finally { await rm(root, { recursive:true, force:true }); }
});
