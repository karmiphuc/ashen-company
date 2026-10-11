import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('publishing preflight accepts Actions, rejects legacy with an admin link and preserves API failures',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ashen-pages-check-'));
 try{
  // Only a read-only Pages query is permitted by this fake gh executable.
  await writeFile(join(dir,'gh'),`#!/bin/sh
if [ "$*" != 'api repos/karmiphuc/ashen-company/pages --jq .build_type' ]; then exit 95; fi
if [ "\${PAGES_TEST_EXIT:-0}" != 0 ]; then exit "$PAGES_TEST_EXIT"; fi
printf '%s\\n' "$PAGES_TEST_MODE"
`,{mode:0o755});
  const check=(mode,exit='0')=>spawnSync('bash',['tools/check-pages-publishing.sh'],{cwd:new URL('../',import.meta.url),encoding:'utf8',env:{...process.env,PATH:`${dir}:${process.env.PATH}`,GITHUB_REPOSITORY:'karmiphuc/ashen-company',PAGES_TEST_MODE:mode,PAGES_TEST_EXIT:exit}});
  assert.equal(check('workflow').status,0);
  const legacy=check('legacy');assert.equal(legacy.status,1);assert.match(legacy.stdout,/raw source without production version metadata/);assert.match(legacy.stdout,/https:\/\/github.com\/karmiphuc\/ashen-company\/settings\/pages/);
  assert.equal(check('workflow','7').status,7,'API failures must not masquerade as a valid publishing mode');
 }finally{await rm(dir,{recursive:true,force:true});}
});
