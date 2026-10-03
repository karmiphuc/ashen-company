import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/engine.js';
import { companySheetHTML } from '../src/campaign-ui.js';
import { battleHTML } from '../src/battle-view.js';

test('company sheet exposes saved role and skill preference with automatic defaults', () => {
  const state = createGame(6401);
  const person = state.party[0];
  const defaults = companySheetHTML(state, person, 'all', '');
  assert.match(defaults, /data-combat-setting="combatRole" data-person-id="[^"]+"[^>]*aria-label="[^"]+ battle role"/);
  assert.match(defaults, /<option value="auto" selected>Auto<\/option>/);
  assert.match(defaults, /data-combat-setting="skillPreference" data-person-id="[^"]+"[^>]*aria-label="[^"]+ skill preference"/);
  assert.match(defaults, /<option value="balanced" selected>Balanced<\/option>/);
  assert.match(defaults, /Auto follows current gear/);

  person.combatRole = 'flanker';
  person.skillPreference = 'control';
  const configured = companySheetHTML(state, person, 'all', '');
  assert.match(configured, /<option value="flanker" selected>Flanker<\/option>/);
  assert.match(configured, /<option value="control" selected>Control<\/option>/);
  assert.match(configured, /Prefers ranged and polearm enemies/);
});

test('battle pawn shows rules-version AP maximum and shield-wall status, with current skill in the report', () => {
  const unit = {
    id:'captain',name:'Mara',side:'company',q:2,r:2,hp:100,maxHp:100,ap:7,fatigue:19,
    shieldWallActive:true,equipment:{weapon:'arming-sword',shield:'buckler'},
  };
  const battle = {
    rulesVersion:2,status:'active',round:1,activeId:'captain',units:[unit],
    lastEvent:{actorId:'captain',type:'hold',skillName:'Shield & Strike',message:'Used a skill.'},
  };
  const current = battleHTML(battle, 0, true);
  assert.match(current, /7\/9 AP · 19 F/);
  assert.match(current, /class="battle-shieldwall[^\"]*"[^>]*aria-label="Shield wall active"/);
  assert.match(current, /Skill used: Shield &amp; Strike/);
  assert.match(current, /2 AP to enter/);

  battle.rulesVersion = 1;
  unit.ap = 2;
  const legacy = battleHTML(battle, 0, false);
  assert.match(legacy, /2\/2 AP · 19 F/);
  assert.doesNotMatch(legacy, /Skill used: Shield/);
  assert.match(legacy, /1 AP to enter/);
});

test('a successful shield push animates the target from its prior hex', () => {
  const units = [
    { id:'captain',side:'company',q:2,r:2,hp:100,equipment:{weapon:'arming-sword',shield:'buckler'} },
    { id:'enemy',side:'enemy',q:4,r:2,hp:100,equipment:{weapon:'spear'} },
  ];
  const html = battleHTML({rulesVersion:2,status:'active',units,lastEvent:{type:'move',actorId:'captain',targetId:'enemy',pushedFrom:{q:3,r:2},skillName:'Knock Back'}},0,true);
  assert.match(html, /class="[^"]*action-move[^"]*" data-unit-id="enemy"[^>]*--move-x:-76px/);
});
