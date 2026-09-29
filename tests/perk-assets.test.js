import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PERKS} from '../src/perks.js';
import {listOfflineAssets} from '../tools/build-cache.mjs';

test('every perk has its credited image bundled for offline play', async () => {
  const manifest=JSON.parse(await readFile(new URL('../assets/perks/source-manifest.json',import.meta.url),'utf8'));
  assert.ok(PERKS.every(perk => manifest.some(entry => entry.perk === perk.icon)), 'every perk reuses a credited bundled icon');
  const assets=await listOfflineAssets();
  assert.ok(assets.includes('./src/perks.js'));
  for(const entry of manifest){
    assert.equal(entry.asset,`assets/perks/${entry.perk}.png`);
    const data=await readFile(new URL('../'+entry.asset,import.meta.url));
    assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(createHash('sha256').update(data).digest('hex'),entry.sha256);
    assert.ok(assets.includes('./'+entry.asset));
  }
});
