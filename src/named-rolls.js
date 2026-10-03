// Battle Brothers named-item rules, pinned to kovasap/battle-bros-decompiled e06d68df.
// Existing unversioned famed IDs remain handled by the legacy resolver in engine.js.
export function rollNamedItem(original,id,seed,{shieldDurability=0,shieldDamage=0}={}) {
  let state=seed>>>0;
  const roll=(min,max)=>{state=(state+0x6D2B79F5)>>>0;let x=state;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return min+((x^(x>>>14))>>>0)%(max-min+1);};
  const design=original.sourceArmor!==undefined;
  const item={...original,id,baseId:original.id,rarity:design?'named':'famed',rollVersion:2};
  const bonuses=[],mods=[];
  delete item.signature;
  if(design){item.armor=original.sourceArmor;item.fatigue=original.sourceFatigue;delete item.statBonuses;}
  // Fangshire remains a unique story helmet with its campaign-specific innate bonus.
  if(original.id==='bb-fangshire')item.statBonuses=original.statBonuses;
  const add=(key,label,value)=>{mods.push(key);bonuses.push(Object.freeze({label,value}));};
  if(['armor','helmet'].includes(item.slot)){
    const armor=item.armor,fatigue=item.fatigue??0,pct=roll(110,125),relief=item.slot==='armor'?roll(3,9):roll(1,4);
    item.armor=Math.floor(armor*pct/100);item.fatigue=Math.max(Math.min(fatigue,item.slot==='armor'?8:4),fatigue-relief);
    add('protection','Protection',`+${item.armor-armor} (${pct-100}%)`);add('weight','Fatigue cost',`-${fatigue-item.fatigue}`);
  }else{
    const pool=[];
    if(item.slot==='shield'){
      const melee=item.defense??0,ranged=item.rangedDefense??melee;item.rangedDefense=ranged;item.durability=shieldDurability;
      pool.push(()=>{item.defense=Math.round(melee*roll(120,140)/100);add('melee-defense','Melee defense',`+${item.defense-melee}`);});
      pool.push(()=>{item.rangedDefense=Math.round(ranged*roll(120,140)/100);add('ranged-defense','Ranged defense',`+${item.rangedDefense-ranged}`);});
      pool.push(()=>{item.durability=Math.round(shieldDurability*roll(120,160)/100);add('durability','Shield durability',`+${item.durability-shieldDurability}`);});
      pool.push(()=>{const old=item.fatigue??0;item.fatigue=Math.round(old*roll(70,90)/100);add('weight','Fatigue cost',`-${old-item.fatigue}`);});
    }else{
      pool.push(()=>{const pct=roll(110,130);item.damageMin=Math.round(original.damageMin*pct/100);item.damageMax=Math.round(original.damageMax*pct/100);add('damage','Damage',`+${pct-100}%`);});
      pool.push(()=>{const pct=roll(10,30);item.armorDamage=Math.round(((original.armorDamage??1)+pct/100)*100)/100;add('armor-damage','Armor damage',`+${pct} percentage points`);});
      pool.push(()=>{const pct=roll(10,20);item.headChance=(original.headChance??.22)+pct/100;add('head-chance','Head hit chance',`+${pct} percentage points`);});
      if((original.armorPiercing??.3)<1)pool.push(()=>{const pct=roll(8,16);item.armorPiercing=Math.min(1,(original.armorPiercing??.3)+pct/100);add('piercing','Damage through armor',`+${Math.round((item.armorPiercing-(original.armorPiercing??.3))*100)} percentage points`);});
      if((original.fatigue??0)>=10)pool.push(()=>{item.fatigue=Math.round(original.fatigue*roll(50,80)/100);add('weight','Fatigue cost',`-${original.fatigue-item.fatigue}`);});
      if(shieldDamage>=16)pool.push(()=>{item.shieldDamage=Math.round(shieldDamage*roll(150,200)/100);add('shield-damage','Shield damage',`+${item.shieldDamage-shieldDamage}`);});
      if(original.throwing)pool.push(()=>{const extra=roll(1,3);item.ammoMax=(original.ammoMax??5)+extra;add('ammo','Bundle throws',`+${extra}`);});
      if(original.hitBonus||original.ranged)pool.push(()=>{const extra=roll(5,15);item.hitBonus=(original.hitBonus??0)+extra;add('accuracy','Hit modifier',`+${extra}`);});
    }
    pool.push(()=>{const relief=roll(1,3);item.fatigueOnSkillUse=(original.fatigueOnSkillUse??0)-relief;add('skill-fatigue','Skill fatigue',`-${relief}`);});
    for(let n=0;n<2;n++)pool.splice(roll(0,pool.length-1),1)[0]();
  }
  item.name=design?original.name:`${['Ashen','Blackthorn','Dawnward','Grimwolf','Ironbound','Oathkeeper','Ravenmark','Stormborn','Thornheart','Wolfguard'][seed%10]} ${original.name}`;
  item.description=`A rare ${original.name.toLowerCase()} with independently rolled Battle Brothers-style modifiers. ${original.description}`;
  item.price=Math.min(original.collection?20000:5000,Math.round(original.price*2.4+(['armor','helmet'].includes(item.slot)?item.armor-(design?original.sourceArmor:original.armor):0)));
  item.rollModifiers=Object.freeze(mods);item.bonuses=Object.freeze(bonuses);
  return Object.freeze(item);
}
