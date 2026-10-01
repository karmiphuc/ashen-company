import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,PERKS} from '../src/engine.js';
import {companySheetHTML,perksHTML} from '../src/campaign-ui.js';

test('level thirty sheet shows the cap while lower levels still show their experience target',()=>{
  const state=createGame(41),person=state.party[0];person.level=30;
  assert.match(companySheetHTML(state,person,'all',''),/Maximum level reached/);
  person.level=29;
  assert.match(companySheetHTML(state,person,'all',''),/0 \/ 1450 experience/);
});

test('perk categories display earlier unlocks before later perks',()=>{
  const html=perksHTML(createGame(41).party[0]);
  for(const section of html.matchAll(/<section class="perk-category">([\s\S]*?)<\/section>/g)){
    const levels=[...section[1].matchAll(/data-perk="([^"]+)"/g)].map(match=>PERKS.find(perk=>perk.id===match[1]).minLevel);
    for(let i=1;i<levels.length;i++)assert.ok(levels[i]>=levels[i-1]);
  }
});
