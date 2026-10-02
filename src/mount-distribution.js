import { regionAt } from './geography.js';
const roll = value => {let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
export function regionalMountPool(x,y,{reward=false}={}) {
  const region=regionAt(x,y).id;
  const beasts=['northern-highlands','greenwood','blackwater-basin'].includes(region);
  return reward ? ['war-horse','armored-war-horse',...(beasts?['warg-mount','dire-wolf-mount']:[])] : beasts ? ['warg-mount','dire-wolf-mount'] : ['war-horse'];
}
export function cityMountOffer(seed,town,cycle) {
  const chance=roll(`${seed}:${town.id}:${cycle}:stable-offer`)%100;
  if(town.kind==='town'){
    if(chance<20)return 'riding-horse';
    if(chance<25)return 'war-horse';
    if(chance<26&&town.major)return 'armored-war-horse';
    if(chance>=26&&chance<28){const pool=regionalMountPool(town.x,town.y);return pool[roll(`${seed}:${town.id}:${cycle}:stable-kind`)%pool.length];}
  } else if(town.kind==='castle'&&chance<3) return chance===0?'armored-war-horse':'war-horse';
  return null;
}
export function campMountReward(seed,camp) {
  if(!camp.random||camp.difficulty!==3||roll(`${seed}:${camp.id}:${camp.generation}:mount-reward`)%100>=12)return null;
  const pool=regionalMountPool(camp.x,camp.y,{reward:true});
  return pool[roll(`${seed}:${camp.id}:${camp.generation}:mount-kind`)%pool.length];
}
