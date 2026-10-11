import {getCampSites} from '../../src/engine.js';
// A legal campaign with a full player roster and accumulated wounded defenders.
// The live history exceeds the isolated rival-combat source limit.
export function populateLateGameHistory(world){
 while(world.party.length<18){const member=structuredClone(world.party[0]);member.id=`bro-${world.party.length+1}`;world.party.push(member);}
 world.formation=Array.from({length:36},(_,i)=>i<15?world.party[i].id:null);world.reserveIds=world.party.slice(15).map(p=>p.id);
 for(const camp of getCampSites(world).slice(0,128))world.rivalCompanies.campWear[camp.id]={generation:camp.generation,units:Array.from({length:20},(_,index)=>({index,hp:40,bodyArmor:20,headArmor:20,shieldDurability:0,reserveShieldDurability:0,attachmentArmor:0,morale:50,injuries:['fractured-hand','fractured-ribs','crushed-finger','fractured-elbow'].map(id=>({id,acquiredDay:world.day,healingDays:0,treated:false}))}))};
 return world;
}
