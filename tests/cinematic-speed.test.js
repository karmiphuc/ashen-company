import test from 'node:test';
import assert from 'node:assert/strict';
import {battleActionDuration,parseBattleSpeed,cinematicActionKind,battleHTML} from '../src/battle-view.js';
import {combatSoundCue} from '../src/audio.js';

test('Cinematic keeps ordinary actions at 4x but allows the full attack and skill presentation before advancing',()=>{
 for(const event of [null,{type:'move'},{type:'hold'},{type:'recover'},{type:'hold',skillName:'Stunned'},{type:'hold',skillName:'Hold'}]){
  assert.equal(battleActionDuration('cinematic',event),battleActionDuration(4,event));
 }
 for(const type of ['attack','miss','hit','fall'])assert.ok(battleActionDuration('cinematic',{type})>3*battleActionDuration(4,{type}));
 for(const event of [{type:'use'},{type:'hold',skillName:'Shieldwall'},{type:'recover',skillName:'Reload'},{type:'move',skillName:'Knock Back'}])assert.ok(battleActionDuration('cinematic',event)>battleActionDuration(4,event));
 const interception={type:'move',reactions:[{type:'attack',skillName:'Spearwall'}]};
 assert.equal(cinematicActionKind(interception),'attack');
 assert.equal(battleActionDuration('cinematic',interception),battleActionDuration('cinematic',{type:'attack'}));
 assert.equal(battleActionDuration(1,{type:'attack'}),battleActionDuration(1));
 assert.equal(battleActionDuration(3,{type:'attack'}),battleActionDuration(3));
});

test('speed preferences migrate saved 3x settings to 4x and retain Cinematic as a named mode',()=>{
 for(const mode of [0,1,4,'cinematic'])assert.equal(parseBattleSpeed(String(mode)),mode);
 assert.equal(parseBattleSpeed('3'),4);
 assert.equal(parseBattleSpeed(3),4);
 for(const invalid of [null,undefined,'',2,'fast','NaN'])assert.equal(parseBattleSpeed(invalid,4),4);
 assert.equal(battleActionDuration(3),battleActionDuration(4),'older callers retain fast timing');
});

test('Cinematic sounds release after the build-up and contact follows release for melee, arrows, bolts and throws',()=>{
 for(const [weaponId,ranged,projectile] of [['arming-sword',false,null],['hunting-bow',true,'arrow'],['light-crossbow',true,'bolt'],['javelins',true,'javelin']]){
  const event={type:'attack',weaponId,ranged,projectile,hpDamage:10,armorDamage:20};
  const duration=battleActionDuration('cinematic',event),cues=combatSoundCue(event,duration,{cinematic:true});
  const contact=cues.filter(c=>/armor-|pierce$|slash-hit$/.test(c.name));
  assert.ok(cues[0].delay>0,'release must wait for the wind-up');
  assert.ok(contact.length);assert.ok(contact.every(c=>c.delay>cues[0].delay&&c.delay<duration));
  assert.equal(combatSoundCue(event,battleActionDuration(4))[0].delay,0,'fast mode retains its original cue schedule');
 }
 const miss=combatSoundCue({type:'miss',weaponId:'hunting-bow',ranged:true},1.15,{cinematic:true});
 assert.ok(miss.every(c=>!c.name.includes('pierce')),'a miss still has no contact sound');
});

test('Cinematic selection remains visible while paused/restored views do not replay attack feedback',()=>{
 const battle={status:'active',round:1,units:[{id:'captain',side:'company',name:'Mara',q:2,r:2,hp:100,maxHp:100,equipment:{weapon:'arming-sword'}},{id:'enemy',side:'enemy',name:'Raider',q:3,r:2,hp:60,maxHp:100,equipment:{weapon:'wood-axe'}}],lastEvent:{type:'attack',actorId:'captain',targetId:'enemy',hpDamage:40,weaponId:'arming-sword'}};
 assert.match(battleHTML(battle,'cinematic'),/data-battle-speed="cinematic" aria-pressed="true"/);
 assert.doesNotMatch(battleHTML(battle,'cinematic'),/cinematic-attack|action-swing|action-hit/);
 assert.match(battleHTML(battle,'cinematic',true),/cinematic-attack/);
 assert.match(battleHTML(battle,'cinematic',true),/--move-time:0.1375s/);
 assert.match(battleHTML(battle,4,true),/data-battle-speed="4" aria-pressed="true">4x/);
 assert.doesNotMatch(battleHTML(battle,4,true),/cinematic-attack/);
});
