import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const code=(name,next)=>app.slice(app.indexOf(`function ${name}(`),app.indexOf(`function ${next}(`));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

test('Save menu renders the actual escaped load error instead of a literal template expression',()=>{
 let html;runInNewContext(code('settings','exportSave')+'settings();',{showModal:(title,content)=>html=content,esc,state:{},saveProblem:false,unreadSave:true,corruptSave:'{}',saveError:'Invalid save: <town deadlines>',companyAutomationHTML:()=>'',combatBetaConfigHTML:()=>'',audioControlsHTML:()=>'',isWorldFogEnabled:()=>true,defaultBattleSpeed:4});
 assert.ok(html.includes('A save could not be loaded (Invalid save: &lt;town deadlines&gt;)'));assert.ok(!html.includes('${esc(saveError)}'));assert.ok(html.includes('data-action="export-recovery"'));
});

test('rejected stored saves are preserved byte-for-byte and cannot be overwritten by autosave',()=>{
 const raw=' { "campaign" : "preserved" } ',storage=new Map([['save',raw]]),writes=[];
 const env={state:{newCompany:true},chosenTown:'oakwatch',SAVE_KEY:'save',unreadSave:false,corruptSave:null,saveError:'',saveProblem:false,localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>writes.push([key,value])},validateSave:()=>{throw Error('Invalid save: Ashen Winter town deadlines');},townAt:()=>null,toast(){}};
 const load=app.slice(app.indexOf('try{const raw=localStorage.getItem(SAVE_KEY)'),app.indexOf("if(state.battle)tab='battle';"));
 runInNewContext(load+code('save','toast')+'save();',env);assert.equal(env.corruptSave,raw);assert.equal(env.saveError,'Invalid save: Ashen Winter town deadlines');assert.equal(env.unreadSave,true);assert.equal(writes.length,0);assert.equal(storage.get('save'),raw);
});

for(const recovery of [false,true])test(`export ${recovery?'recovery':'default'} downloads the preserved save rather than the fallback company`,async()=>{
 const raw=' { "campaign" : "preserved" } ';let blob,download;const a={click(){download=this.download;}};
 runInNewContext(code('exportSave','startTravel')+`exportSave(${recovery});`,{unreadSave:true,corruptSave:raw,state:{newCompany:true},Blob,URL:{createObjectURL:value=>{blob=value;return 'blob:test';},revokeObjectURL(){}},document:{createElement:()=>a},setTimeout(){},toast(){}});
 assert.equal(await blob.text(),raw);assert.equal(download,'ashen-company-damaged-save.json');
});
