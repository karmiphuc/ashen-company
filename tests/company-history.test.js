import {test} from 'node:test';
import assert from 'node:assert/strict';
import {companyMemory,appendCompanyMemory,readCompanyHistory,companyHistoryHTML,COMPANY_HISTORY_LIMIT} from '../src/company-history.js';
import {storeLegacyRetirement} from '../src/company-legacy.js';
import {entombedCompany} from './fixtures/entombed-company.mjs';
import {createLegacyCampaign,getLegacySetRetirementQuote,getItem,validateSave} from '../src/engine.js';
function fixture(){const {state,indices}=entombedCompany();const next=createLegacyCampaign(state,getLegacySetRetirementQuote(state,indices)).state;return {state,next,memory:companyMemory(state,next,getItem)};}
test('retirement memory preserves actual roster, exact gear names and warrior without altering either campaign',()=>{
 const {state,next,memory}=fixture(),before=JSON.stringify([state,next]);
 assert.equal(memory.warrior,next.legacyWarrior.member.name);assert.equal(memory.crisis,true);assert.equal(memory.sets.length,3);assert.equal(memory.sets[0][0],getItem(next.companyLegacy.sets[0].helmet.itemId).name);
 assert.deepEqual(readCompanyHistory(appendCompanyMemory(null,memory)).entries,[memory]);assert.equal(JSON.stringify([state,next]),before);validateSave(next);
});
test('history remains bounded, newest first, and repeated retirement identity cannot duplicate rewards or records',()=>{
 const {memory}=fixture();let raw=null;
 for(let n=0;n<30;n++)raw=appendCompanyMemory(raw,{...memory,id:`banner-${n}`,generation:n+1});
 let history=readCompanyHistory(raw);assert.equal(history.entries.length,COMPANY_HISTORY_LIMIT);assert.equal(history.entries[0].id,'banner-29');assert.equal(history.entries.at(-1).id,'banner-18');
 raw=appendCompanyMemory(raw,history.entries[0]);assert.equal(readCompanyHistory(raw).entries.length,COMPANY_HISTORY_LIMIT);
});
test('history, backup and active-save failures preserve all previous stored records and permit retry',()=>{
 const {state,next,memory}=fixture();
 for(const failure of ['save-history','save-retired','save']){
  const original=new Map([['save',JSON.stringify(state)],['save-retired','older backup'],['save-history',appendCompanyMemory(null,{...memory,id:'older'})]]),values=new Map(original);let failed=false;
  const storage={getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k),setItem(k,v){if(k===failure&&!failed){failed=true;throw Error('quota');}values.set(k,v);}};
  assert.throws(()=>storeLegacyRetirement(storage,'save',state,next,memory),/quota/);assert.deepEqual(values,original);
  storeLegacyRetirement(storage,'save',state,next,memory);assert.deepEqual(validateSave(JSON.parse(values.get('save'))),validateSave(next));assert.equal(readCompanyHistory(values.get('save-history')).entries.length,2);
 }
});
test('malformed history is rejected without replacing an active save; displayed names are escaped',()=>{
 const {state,next,memory}=fixture();
 for(const bad of ['{','{}',JSON.stringify({version:2,entries:[]}),JSON.stringify({version:1,entries:[{...memory,roster:[{name:'x',level:31,alive:true}]}]}),JSON.stringify({version:1,entries:[memory,memory]}),' '.repeat(250001)])assert.throws(()=>readCompanyHistory(bad));
 const values=new Map([['save',JSON.stringify(state)],['save-history','broken']]);const storage={getItem:k=>values.get(k)??null,setItem(k,v){values.set(k,v);}};
 assert.throws(()=>storeLegacyRetirement(storage,'save',state,next,memory));assert.equal(values.get('save'),JSON.stringify(state));assert.equal(values.has('save-retired'),false);
 memory.warrior='<img onerror=bad>';memory.roster[0].name='<script>bad</script>';const html=companyHistoryHTML({version:1,entries:[memory]});assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('&lt;img onerror=bad&gt;'));
});

test('a validated pre-gallery retirement summary survives the first new history write',()=>{
 const {state,next,memory}=fixture(),prior={...memory,id:'prior-banner',generation:1};
 const values=new Map([['save',JSON.stringify(state)],['save-retired','prior full save']]);
 const storage={getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k),setItem(k,v){values.set(k,v);}};
 storeLegacyRetirement(storage,'save',state,next,memory,{version:1,entries:[prior]});
 assert.deepEqual(readCompanyHistory(values.get('save-history')).entries.map(e=>e.id),[memory.id,'prior-banner']);
});
