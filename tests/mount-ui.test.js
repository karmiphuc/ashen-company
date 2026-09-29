import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, getItem, getDailyFood} from '../src/engine.js';
import {companySheetHTML, resourceHTML, campSidebarHTML} from '../src/campaign-ui.js';
import {getItemDetails} from '../src/item-details.js';

test('mount equipment and item details expose costs and additive company benefits', () => {
  const state=createGame(41);
  state.party[0].equipment.mount='riding-horse';
  state.party[1].equipment.mount='warg-mount';
  const html=companySheetHTML(state,state.party[0],'mount','');
  assert.match(html,/data-unequip="mount" data-equipment-location="active"/);
  assert.match(html,/data-slot="mount"/);
  assert.match(html,/Company travel bonus: \+20%/);
  assert.equal(getDailyFood(state),6);
  assert.match(resourceHTML(state,0),/Provisions · 5 days/);
  for(const id of ['riding-horse','warg-mount','dire-wolf-mount']){
    const details=getItemDetails(getItem(id));
    assert.equal(details.stats.find(row=>row.label==='Company travel speed').value,'+10% while equipped');
    assert.equal(details.stats.find(row=>row.label==='Extra daily food').value,String(getItem(id).foodUpkeep));
    assert.ok(details.notes.some(note=>note.includes('never grants another attack')));
  }
});

test('scouting shows southern gear and mounted opponent before engagement', () => {
  const state=createGame(3);
  const html=campSidebarHTML(state,{id:'preview',name:'Nomad Riders',kind:'band',x:1500,y:1000,difficulty:3,factionLabel:'Southern Nomads',enemies:[{name:'Nomad Rider',armor:'leather-lamellar',helmet:'southern-helmet',weapon:'shamshir',shield:'adarga',mount:'riding-horse'}]});
  assert.match(html,/Southern Nomads/);
  assert.match(html,/Nomad Rider/);
  assert.match(html,/Riding Horse/);
  assert.match(html,/helmet-southern\.png/);
  assert.match(html,/data-layer="mount-body"/);
});
