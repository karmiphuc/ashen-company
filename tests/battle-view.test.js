import test from 'node:test';
import assert from 'node:assert/strict';
import {battleHTML, tacticsHTML} from '../src/battle-view.js';

const units = [
  {id:'captain',name:'Mara',side:'company',q:2,r:2,hp:100,maxHp:100,equipment:{weapon:'hunting-bow',armor:'mail-shirt',helmet:'iron-helm'}},
  {id:'enemy',name:'Raider',side:'enemy',q:7,r:2,hp:70,maxHp:100,bodyArmor:25,maxBodyArmor:50,equipment:{weapon:'wood-axe'}},
];
const battle = {units,status:'active',round:1,tactic:'focus',lastEvent:{actorId:'captain',targetId:'enemy',type:'attack',from:{q:2,r:2},to:{q:7,r:2},ranged:true,projectile:'arrow',hpDamage:30,armorDamage:25}};

test('restored or paused battle renders without replaying the last projectile', () => {
  assert.doesNotMatch(battleHTML(battle,0), /Arrow in flight|action-shoot|action-hit/);
  const animated = battleHTML(battle,1,true);
  assert.match(animated, /Arrow in flight/);
  assert.match(animated, /action-shoot/);
  assert.match(animated, /action-hit/);
  assert.match(animated, /width:70%;--before-width:100%;--after-width:70%/);
  assert.doesNotMatch(animated, /NaN|undefined/);
});

test('tactic choice is clear and results disable further changes', () => {
  assert.match(tacticsHTML('defense'), /data-tactic="defense" aria-pressed="true"/);
  assert.match(tacticsHTML('focus'), /Thin them out/);
  assert.equal((tacticsHTML('offense',true).match(/disabled/g)||[]).length,3);
});

test('attack effects support misses and remain safe when older events have no positions', () => {
  const old = {...battle,lastEvent:{actorId:'captain',targetId:'enemy',type:'miss',ranged:true}};
  assert.match(battleHTML(old,3,true), /Arrow in flight/);
  assert.match(battleHTML(old,3,true), />Miss<\/span>/);
  assert.doesNotMatch(battleHTML({...battle,units:[]},1,true), /Arrow in flight/);
});
