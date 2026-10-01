import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {battleHTML, tacticsHTML} from '../src/battle-view.js';

const battleCSS=readFileSync(new URL('../src/battle.css',import.meta.url),'utf8');

const units = [
  {id:'captain',name:'Mara',side:'company',q:2,r:2,hp:100,maxHp:100,equipment:{weapon:'hunting-bow',armor:'mail-shirt',helmet:'iron-helm'}},
  {id:'enemy',name:'Raider',side:'enemy',q:7,r:2,hp:70,maxHp:100,bodyArmor:25,maxBodyArmor:50,equipment:{weapon:'wood-axe'}},
];
const battle = {units,status:'active',round:1,tactic:'focus',lastEvent:{actorId:'captain',targetId:'enemy',type:'attack',from:{q:2,r:2},to:{q:7,r:2},ranged:true,projectile:'arrow',hpDamage:30,armorDamage:25}};

test('battle exposes each morale state and the active fighters actual resolve and combat modifier', () => {
  const example = structuredClone(battle);
  Object.assign(example.units[0], { morale: 85, resolve: 65 });
  Object.assign(example.units[1], { morale: 20, resolve: 25 });
  example.activeId = 'captain';
  const html = battleHTML(example, 0);
  assert.match(html, /Confident morale: 85\/100; resolve 65/);
  assert.match(html, /Breaking morale: 20\/100; resolve 25/);
  assert.match(html, /Confident · 85\/100 morale/);
  assert.match(html, /Resolve 65 · \+10% attack and defense/);
  assert.match(html, /battle-morale-flag morale-breaking/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('battle shows shield durability and hides a broken shield from the portrait', () => {
  const example = structuredClone(battle);
  example.activeId = 'captain';
  example.units[0].equipment.shield = 'buckler';
  example.units[0].maxShieldDurability = 24;
  example.units[0].shieldDurability = 12;
  const damaged = battleHTML(example, 0);
  assert.match(damaged, /class="battle-unit-bar battle-unit-shield" title="Shield: 12 \/ 24 durability"><i style="width:50%;/);
  assert.match(damaged, /Shield 12 \/ 24 durability/);
  assert.match(damaged, /<img data-layer="shield"/);

  example.units[0].shieldDurability = 0;
  const broken = battleHTML(example, 0);
  assert.match(broken, /Shield: 0 \/ 24 durability · Broken/);
  assert.match(broken, /Shield 0 \/ 24 durability · Broken, no defense/);
  assert.doesNotMatch(broken, /<img data-layer="shield"/);
});

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
  assert.match(tacticsHTML('advance-formation'), /data-tactic="advance-formation" aria-pressed="true"/);
  assert.match(tacticsHTML('advance-formation'), /one hex at a time/);
  assert.match(tacticsHTML('shield-wall'), /data-tactic="shield-wall" aria-pressed="true"/);
  assert.match(tacticsHTML('shield-wall'), /unshielded two-handers stay behind/);
  assert.equal((tacticsHTML('offense',true).match(/disabled/g)||[]).length,5);
});

test('body bar includes attachment protection and sling stones render distinctly', () => {
  const layered = structuredClone(battle);
  Object.assign(layered.units[1], { attachmentArmor: 25, maxAttachmentArmor: 50 });
  layered.lastEvent.projectile = 'stone';
  layered.lastEvent.weaponId = 'northern-sling';
  const html = battleHTML(layered, 1, true);
  assert.match(html, /width:50%;--before-width:75%;--after-width:50%/);
  assert.match(html, /class="battle-projectile is-stone" aria-label="Sling stone in flight"/);
});

test('attack effects support misses and remain safe when older events have no positions', () => {
  const old = {...battle,lastEvent:{actorId:'captain',targetId:'enemy',type:'miss',ranged:true}};
  assert.match(battleHTML(old,3,true), /Arrow in flight/);
  assert.match(battleHTML(old,3,true), />Miss<\/span>/);
  assert.doesNotMatch(battleHTML({...battle,units:[]},1,true), /Arrow in flight/);
});

test('enemy projectiles start at the mirrored weapon hand and travel toward the company', () => {
  const html = battleHTML({
    ...battle,
    lastEvent: {...battle.lastEvent, actorId:'enemy', targetId:'captain', from:{q:7,r:2}, to:{q:2,r:2}},
  },1,true);
  assert.match(html, /class="battle-projectile is-arrow"[^>]*left:644px;top:262px;--flight-x:-362px;--flight-y:-2px/);
  assert.match(html, /--strike-x:-13.00px;--strike-y:0.00px/);
});

test('throwing weapons fly with their exact packaged icon while crossbows remain bolts', () => {
  const projectile = (weapon, kind) => battleHTML({
    ...battle,
    units:[{...units[0],equipment:{...units[0].equipment,weapon}},units[1]],
    lastEvent:{...battle.lastEvent,weaponId:weapon,projectile:kind},
  },1,true);
  const javelin=projectile('heavy-javelins','javelin');
  assert.match(javelin,/class="battle-projectile is-javelin" aria-label="Javelin in flight"/);
  assert.match(javelin,/src="assets\/items\/heavy-javelins\.png"/);
  const axe=projectile('throwing-axes','axe');
  assert.match(axe,/class="battle-projectile is-axe" aria-label="Throwing axe in flight"/);
  assert.match(axe,/src="assets\/items\/throwing-axes\.png"/);
  const bolt=projectile('heavy-crossbow','bolt');
  assert.match(bolt,/class="battle-projectile is-bolt" aria-label="Crossbow bolt in flight"/);
  assert.match(bolt,/class="battle-projectile is-bolt"[^>]*><span><\/span>/);
  assert.match(battleCSS,/@keyframes thrown-spin/);
});

test('14 by 8 terrain fields render inspectable cover, height, and elevation-aligned units', () => {
  const tiles = Array.from({length:14},(_,q)=>Array.from({length:8},(_,r)=>({q,r,terrain:'open',height:0}))).flat();
  Object.assign(tiles.find(tile=>tile.q===2&&tile.r===2),{terrain:'trees',height:1});
  Object.assign(tiles.find(tile=>tile.q===13&&tile.r===7),{terrain:'rock',height:2});
  const expanded = {
    ...battle,
    field:{columns:14,rows:8,biome:'forest',tiles},
    units:[
      {...units[0],q:2,r:2},
      {...units[1],q:13,r:7},
    ],
    lastEvent:{...battle.lastEvent,to:{q:13,r:7}},
  };
  const html=battleHTML(expanded,1,true);
  assert.equal((html.match(/class="battle-hex /g)||[]).length,112);
  assert.match(html,/--field-width:1362px;--field-height:672px/);
  assert.match(html,/battle-biome-forest/);
  assert.match(html,/data-action="inspect-terrain" data-q="2" data-r="2" data-terrain="trees" data-height="1"/);
  assert.match(html,/Trees, Height 1; high-ground attacks gain 10 hit per level\. 20 percentage points ranged protection · 2 AP to enter/);
  assert.match(html,/data-unit-id="captain" style="left:282px;top:190px/);
  assert.match(html,/data-unit-id="enemy" style="left:1308px;top:490px/);
  assert.match(html,/--tile-rise:40px/);
  assert.equal((html.match(/class="battle-hex-wall"/g)||[]).length,2);
  assert.match(html,/forest · 14 × 8/);
  assert.doesNotMatch(html,/NaN|undefined/);
});

test('sixteen-row fields render every tile and units on the last row', () => {
  const field = { columns: 14, rows: 16, biome: 'plains', tiles: [] };
  const expanded = { ...battle, field, units: [{ ...units[0], q: 2, r: 15 }] };
  const html = battleHTML(expanded, 0);
  assert.equal((html.match(/class="battle-hex /g) || []).length, 224);
  assert.match(html, /plains · 14 × 16/);
  assert.match(html, /data-q="13" data-r="15"/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('fieldless legacy battles keep a flat 10 by 5 battlefield', () => {
  const html=battleHTML(battle,0);
  assert.equal((html.match(/class="battle-hex /g)||[]).length,50);
  assert.match(html,/--field-width:944px;--field-height:480px/);
  assert.match(html,/grassland · 10 × 5/);
  assert.doesNotMatch(html,/battle-height-[12]/);
});

test('attack events with a movement origin animate from the matching raised tile', () => {
  const tiles=Array.from({length:14},(_,q)=>Array.from({length:8},(_,r)=>({q,r,terrain:'open',height:q===1&&r===1?2:0}))).flat();
  const moved={
    ...battle,
    field:{columns:14,rows:8,biome:'plains',tiles},
    units:[{...units[0],q:2,r:1},units[1]],
    lastEvent:{...battle.lastEvent,from:{q:2,r:1},moveFrom:{q:1,r:1}},
  };
  const html=battleHTML(moved,1,true);
  const captainTag=(html.match(/<article\b[^>]*>/g)||[]).find(tag=>tag.includes('data-unit-id="captain"'));
  assert.ok(captainTag,'captain unit article is rendered');
  const captainClasses=captainTag.match(/\bclass="([^"]*)"/)?.[1].split(/\s+/)??[];
  assert.ok(captainClasses.includes('action-shoot'));
  assert.ok(captainClasses.includes('action-move'));
  assert.match(html,/--move-x:-76px;--move-y:-40px/);
});

test('terrain tiles remain tappable below the pointer-transparent pawn layer', () => {
  assert.match(battleCSS,/\.battle-terrain\{top:0;z-index:auto\}/);
  assert.match(battleCSS,/\.battle-units\{top:0;z-index:auto;pointer-events:none\}/);
});

test('dense trees show a raised obstacle and explicitly describe impassable terrain', () => {
  const field={columns:14,rows:8,biome:'forest',tiles:[{q:4,r:3,height:2,terrain:'dense-trees'}]};
  const html=battleHTML({...battle,field},0);
  assert.match(html,/Dense trees, Height 2;[^\"]+Impassable/);
  assert.match(html,/class="battle-tree-obstacle"/);
  assert.match(html,/class="battle-hex-wall"/);
  assert.match(html,/class="battle-height-label"[^>]*>\+2/);
  assert.doesNotMatch(html,/NaN|undefined/);
});

test('spearwall, riposte, and stun statuses remain visible accessibly while paused', () => {
  const statusBattle = {
    ...battle,
    activeId:'captain',
    units:[{...units[0],shieldWallActive:true,spearwallActive:true,riposteActive:true,stunnedTurns:1,stunProtected:true}],
  };
  const html=battleHTML(statusBattle,0,false);
  for (const [id,label] of [['shieldwall','Shield wall active'],['spearwall','Spearwall active'],['riposte','Riposte active'],['stunned','Stunned']]) {
    assert.match(html,new RegExp(`battle-status-icon battle-status-${id}[^>]*aria-label="${label}"`));
  }
  assert.doesNotMatch(html,/action-(?:swing|thrust|shoot|hit)|battle-projectile/);
  assert.match(battleHTML(statusBattle,1,true),/battle-status-spearwall/);
  const protectedBattle={...statusBattle,units:[{...statusBattle.units[0],stunnedTurns:0,stunProtected:true}]};
  assert.match(battleHTML(protectedBattle,0,false),/battle-status-stun-protected[^>]*aria-label="Stun protected"/);
});

test('area impacts animate every affected unit and identify friendly fire without hiding the skill action', () => {
  const areaBattle = {
    ...battle,
    activeId:'captain',
    units:[
      {...units[0],equipment:{...units[0].equipment,weapon:'arming-sword'}},
      {...units[1],hp:75,bodyArmor:15,maxBodyArmor:50},
      {id:'ally-1',name:'Guard',side:'company',ally:true,q:2,r:3,hp:75,maxHp:80,equipment:{weapon:'arming-sword'}},
    ],
    lastEvent:{actorId:'captain',targetId:'enemy',type:'attack',skillName:'Swing',weaponId:'arming-sword',ranged:false,
      from:{q:2,r:2},to:{q:7,r:2},hpDamage:25,armorDamage:10,head:false,fallen:false,friendlyFire:true,
      affectedTargets:[
        {id:'enemy',hit:true,hpDamage:25,armorDamage:10,head:false,fallen:false},
        {id:'ally-1',hit:true,hpDamage:5,armorDamage:0,head:false,fallen:false},
      ]},
  };
  const html=battleHTML(areaBattle,1,true);
  const article=id=>(html.match(/<article\b[^>]*>/g)||[]).find(tag=>tag.includes(`data-unit-id="${id}"`));
  assert.match(article('captain'),/is-acting[^>]*action-swing|action-swing[^>]*is-acting/);
  assert.match(article('enemy'),/is-target[^>]*action-hit|action-hit[^>]*is-target/);
  assert.match(article('ally-1'),/is-friendly-fire/);
  assert.match(html,/>25 \/ 10<\/span>/);
  assert.match(html,/>Friendly fire · 5<\/span>/);
  assert.match(article('ally-1'),/friendly fire impact/);
  assert.match(html,/Skill used: Swing/);
});

test('area misses render as deflections and animate shield wear without false health damage', () => {
  const blocked = {
    ...battle,
    units:[
      {...units[0],equipment:{...units[0].equipment,weapon:'arming-sword'}},
      {...units[1],hp:70,maxHp:100,equipment:{weapon:'wood-axe',shield:'round-shield'},shieldDurability:30,maxShieldDurability:48},
    ],
    lastEvent:{actorId:'captain',targetId:'enemy',type:'attack',weaponId:'arming-sword',ranged:false,
      from:{q:2,r:2},to:{q:7,r:2},hpDamage:0,armorDamage:0,shieldDamage:18,head:false,fallen:false,
      affectedTargets:[{id:'enemy',hit:false,hpDamage:0,armorDamage:0,shieldDamage:18,head:false,fallen:false}]},
  };
  const html=battleHTML(blocked,1,true);
  const enemy=(html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g)||[]).find(tag=>tag.includes('data-unit-id="enemy"'));
  assert.match(enemy,/action-hit/);
  assert.match(html,/>Deflected · Shield -18<\/span>/);
  assert.match(html,/width:63%;--before-width:100%;--after-width:63%;background:#a98b55/);
  assert.match(enemy,/battle-unit-health"><i style="width:70%;--before-width:70%;--after-width:70%/);
  assert.doesNotMatch(enemy,/is-friendly-fire/);
});

test('a riposte reaction animates beside the initiating miss and damages its own target', () => {
  const reactionBattle = {
    ...battle,
    activeId:'enemy',
    units:[
      {...units[0],equipment:{...units[0].equipment,weapon:'arming-sword'}},
      {...units[1],hp:54,maxHp:70,equipment:{weapon:'wood-axe'}},
    ],
    lastEvent:{actorId:'enemy',targetId:'captain',type:'miss',weaponId:'wood-axe',ranged:false,
      from:{q:7,r:2},to:{q:2,r:2},message:'Raider misses Mara; Mara ripostes.',reactions:[
        {actorId:'captain',targetId:'enemy',type:'riposte',skillName:'Riposte',from:{q:2,r:2},to:{q:7,r:2},hpDamage:16,armorDamage:4,shieldDamage:0,head:false,fallen:false},
      ]},
  };
  const html=battleHTML(reactionBattle,3,true);
  const article=id=>(html.match(/<article\b[^>]*>/g)||[]).find(tag=>tag.includes(`data-unit-id="${id}"`));
  assert.match(article('enemy'),/is-acting[^>]*action-swing|action-swing[^>]*is-acting/);
  assert.match(article('enemy'),/action-hit/);
  assert.match(article('captain'),/is-reacting/);
  assert.match(article('captain'),/--strike-x:13\.00px/);
  assert.match(html,/>Miss<\/span>/);
  assert.match(html,/>16 \/ 4<\/span>/);
  assert.match(html,/>Riposte<\/span>/);
  assert.match(html,/--action-time:0\.275s/);
});
