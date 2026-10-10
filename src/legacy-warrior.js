// A fixed survivor from a retired company, never a newly rolled boss template.
export const WARRIOR_STAGES=Object.freeze([
 {name:'Footprints in the Chronicle',townId:'oakwatch',objective:'Reach day 30 and 150 renown. Bring 100 crowns and 5 provisions to Oakwatch.'},
 {name:'The Frozen Vigil',townId:'ravenfell',objective:'Bring 4 wool, 5 medicine and 8 tools to Ravenfell to thaw the warrior.'},
 {name:'A Warrior Remembers',townId:'ironford',objective:'Reach day 60 and 300 renown. Bring 1,000 crowns, 6 iron and 6 tools to Ironford.'},
 {name:'The Last Challenge',townId:'ravenfell',objective:'Defeat the awakened warrior alone at the Frozen Vigil. Return to Ravenfell to recruit him.'},
]);
export function freezeLegacyWarrior(state,hash,stats){
 const survivors=state.party.filter(p=>p.hp>0),highest=Math.max(...survivors.map(p=>p.level));
 const top=survivors.filter(p=>p.level>=highest-2).sort((a,b)=>b.level-a.level||(stats(b).meleeSkill+stats(b).rangedSkill+stats(b).meleeDefense)-(stats(a).meleeSkill+stats(a).rangedSkill+stats(a).meleeDefense)||a.id.localeCompare(b.id)).slice(0,3);
 if(!top.length)return undefined;
 const member=structuredClone(top[hash(`${state.seed}:legacy-warrior:v1`)%top.length]);
 return {version:1,sourceSeed:state.seed,sourceDay:state.day,member,stage:1,defeated:false,condition:null};
}
export function warriorReady(state){const w=state.legacyWarrior;if(!w||w.stage===5)return false;
 if(w.stage===1)return state.day>=30&&state.renown>=150&&state.gold>=100&&state.food>=5;
 if(w.stage===2)return (state.cargo.wool??0)>=4&&state.supplies.medicine>=5&&state.supplies.tools>=8;
 if(w.stage===3)return state.day>=60&&state.renown>=300&&state.gold>=1000&&(state.cargo.iron??0)>=6&&state.supplies.tools>=6;
 return w.defeated;
}
