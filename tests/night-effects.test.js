import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/engine.js';
import {battleHTML} from '../src/battle-view.js';
const battleAt=hour=>{const s=e.createGame(7391);s.hour=hour;const c=e.getCampSites(s)[0];s.position={x:c.x,y:c.y};assert.equal(e.startBattle(s,c.id).ok,true);return s;};
test('lighting and night travel follow clock boundaries',()=>{
 for(const [hour,phase] of [[0,'night'],[5.99,'night'],[6,'dawn'],[7.99,'dawn'],[8,'day'],[17.99,'day'],[18,'evening'],[19.99,'evening'],[20,'night'],[23.99,'night']]){assert.equal(e.getTimeOfDay(hour).phase,phase);const s=e.createGame(7391);s.hour=hour;assert.equal(e.getCompanyTravelMultiplier(s),phase==='night'?.8:1);}
});
test('night movement stacks with cart and mounts and upgrade removes only cart penalty',()=>{
 const s=e.createGame(7391);s.gold=22500;s.party[0].equipment.mount='riding-horse';s.hour=22;const mount=1+e.getCompanyTravelBonus(s);assert.equal(e.getCompanyTravelMultiplier(s),mount*.8);e.buyCompanyCart(s);assert.equal(e.getCompanyTravelMultiplier(s),mount*.95*.8);e.buyCompanyCart(s);assert.equal(e.getCompanyTravelMultiplier(s),mount*.8);
});
test('actual world movement at night is twenty percent slower',()=>{
 const distances=[];for(const hour of [12,22]){const s=e.createGame(7391);s.hour=hour;for(const p of Object.values(s.bands))p.defeatedUntil=48;const origin={...s.position};e.travelTo(s,origin.x+100,origin.y);e.tick(s,.25);distances.push(Math.hypot(s.position.x-origin.x,s.position.y-origin.y));}assert(distances[0]>0);assert(Math.abs(distances[1]/distances[0]-.8)<1e-8);
});
test('night accuracy subtracts flat forty ranged and ten melee points for both sides',()=>{
 const s=battleAt(12),b=s.battle;const company=b.units.find(u=>u.side==='company'),enemy=b.units.find(u=>u.side==='enemy');company.q=4;company.r=4;enemy.q=5;enemy.r=4;for(const tile of b.field.tiles){tile.height=0;tile.terrain='open';}
 for(const [actor,target] of [[company,enemy],[enemy,company]])for(const ranged of [false,true]){actor.meleeSkill=80;actor.rangedSkill=80;actor.fatigue=0;target.meleeDefense=0;target.rangedDefense=0;target.equipment.shield=null;target.perks=[];target.shieldDurability=0;actor.perks=[];const weapon=e.getItem(ranged?'hunting-bow':'arming-sword');b.lighting='day';const day=e.attackHitChance(b,actor,target,weapon);b.lighting='night';assert.equal(e.attackHitChance(b,actor,target,weapon),Math.max(12,day-(ranged?40:10)));actor.meleeSkill=1000;actor.rangedSkill=1000;assert.equal(e.attackHitChance(b,actor,target,weapon),ranged?50:80);actor.meleeSkill=0;actor.rangedSkill=0;assert.equal(e.attackHitChance(b,actor,target,weapon),12);}
});
test('new night battles keep lighting through reload and invalid lighting is rejected',()=>{
 const s=battleAt(22);assert.equal(s.battle.lighting,'night');assert.deepEqual(e.validateSave(structuredClone(s)),s);const restored=e.validateSave(structuredClone(s));assert.equal(restored.battle.lighting,'night');assert.match(battleHTML(s.battle,0),/Night battle.*Ranged hit chance −40/);
 const bad=structuredClone(s);bad.battle.lighting='eclipse';assert.throws(()=>e.validateSave(bad),/lighting/);delete s.battle.lighting;assert.equal(e.validateSave(s).battle.lighting,undefined);assert.equal(e.getNightHitPenalty(s.battle,true),0);
});

test('night combat remains deterministic across saves between actions',()=>{
 const s=battleAt(22);let restored=e.validateSave(structuredClone(s));
 for(let i=0;i<20&&s.battle.status==='active';i++){e.advanceBattle(s);e.advanceBattle(restored);restored=e.validateSave(structuredClone(restored));assert.deepEqual(restored,s);assert.equal(restored.battle.lighting,'night');}
});
