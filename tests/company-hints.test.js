import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getCompanyStats,ITEMS} from '../src/engine.js';
import {companySheetHTML,companyAutomationHTML,companyHintHTML} from '../src/campaign-ui.js';

test('company sheet keeps stats, injuries and gear actions while explanations start hidden',()=>{
 const state=createGame(7391),person=state.party[0];person.injuries=[{name:'Broken nose'}];
 const before=JSON.stringify(state),stats=getCompanyStats(person),html=companySheetHTML(state,person,'all','<button data-inspect="cloth-hood">Cloth Hood</button>');
 const ids=[...html.matchAll(/role="tooltip" hidden/g)];assert.ok(ids.length>=10);
 const references=[...html.matchAll(/aria-describedby="([^"]+)"/g)].map(m=>m[1]);assert.equal(references.length,new Set(references).size);
 for(const id of references)assert.ok(html.includes(`id="${id}" role="tooltip" hidden`));
 assert.ok(html.includes('Broken nose'));assert.ok(html.includes(`${person.hp} / ${stats.maxHp}`));assert.ok(html.includes('Maximum Fatigue'));assert.ok(html.includes('data-unequip="weapon"'));assert.ok(html.includes('data-swap-weapon-set'));assert.ok(html.includes('data-combat-setting="combatRole"'));
 assert.ok(html.includes('Attachment weight does not count toward Nimble or Fleet Footed'));assert.ok(html.includes('Quick Hands'));assert.ok(html.includes('Resolve reduces morale loss'));
 assert.ok(!html.includes('class="equipment-auto-note"'));assert.ok(!html.includes('class="inventory-help"'));assert.equal(JSON.stringify(state),before);
});
test('compact preparation keeps checkboxes separate from tappable help and preserves Menu guidance',()=>{
 const state=createGame(7391);state.automation.buyAmmo=true;
 const compact=companyAutomationHTML(state,true),menu=companyAutomationHTML(state);
 assert.ok(compact.includes('data-company-automation="buyAmmo" checked'));assert.equal((compact.match(/data-company-hint/g)||[]).length,2);
 assert.ok(!/<label>[\s\S]*?<button/.test(compact.split('</label>')[0]));
 for(const html of [compact,menu]){assert.ok(html.includes('Buy ammunition at settlements until stores reach 999'));assert.ok(html.includes('limited by available stock and crowns'));assert.ok(!html.includes('Buy all available ammunition'));}assert.ok(menu.includes('Best tiers from the stash first'));assert.ok(!menu.includes('data-company-hint'));
});
test('hint labels and details escape markup and carry accessible names and closed state',()=>{
 const html=companyHintHTML('test','Armor <info>','Damage <script>alert(1)</script> & protection');
 assert.ok(html.includes('aria-label="About Armor &lt;info&gt;"'));assert.ok(html.includes('aria-expanded="false"'));assert.ok(html.includes('role="tooltip" hidden'));assert.ok(!html.includes('<script>'));
});


test('company armor summary combines both attachment layers into body protection and hides reserve shield',()=>{
 const state=createGame(7391),person=state.party[0];
 const attachment=Object.values(ITEMS).find(i=>i.slot==='attachment'&&i.armor>0);
 assert.ok(attachment);
 person.equipment.attachment=attachment.id;person.equipment.attachment2=attachment.id;
 person.perks.push('layered-armor');person.reserveEquipment.shield='buckler';
 person.armorDurability.body=12;person.armorDurability.attachment=7;person.armorDurability.attachment2=3;person.armorDurability.reserveShield=5;
 const before=JSON.stringify(state),stats=getCompanyStats(person),html=companySheetHTML(state,person,'all','');
 const bars=html.match(/<div class="condition-list">([\s\S]*?)<div class="experience-bar">/)[1];
 assert.match(bars,new RegExp(`<span>Body</span>[\\s\\S]*?<strong>22 / ${stats.maxBodyArmor+stats.maxAttachmentArmor+stats.maxAttachment2Armor}</strong>`));
 assert.match(bars,new RegExp(`<span>Head</span>[\\s\\S]*?<strong>${stats.headArmor} / ${stats.maxHeadArmor}</strong>`));
 assert.doesNotMatch(bars,/<span>(?:Attachment(?: 2)?|Reserve shield)<\/span>/);
 assert.match(bars,/<span>Shield<\/span>/);assert.match(bars,/<span>Hitpoints<\/span>/);
 assert.equal(JSON.stringify(state),before);
});
