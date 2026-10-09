// Intrinsic effects stay with the base design through named rolls and reforging.
export const EQUIPMENT_EFFECTS_VERSION=1;
export function hasBonePlating(actor,getItem){return ['attachment','attachment2'].some(slot=>getItem(actor.equipment?.[slot])?.absorbsFirstBodyHit);}
export function bonePlatingReady(actor,getItem){return actor.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&actor.bonePlatingSpent===false&&hasBonePlating(actor,getItem);}
export function bonePlatingAbsorbs(actor,getItem,head,piercing,option){return !head&&!option?.noArmor&&!option?.noDamage&&!option?.dot&&option?.id!=='puncture'&&piercing<1&&bonePlatingReady(actor,getItem);}
export function livingShieldRegeneration(actor,getItem){return actor.equipmentEffectsVersion===EQUIPMENT_EFFECTS_VERSION&&actor.shieldDurability>0?getItem(actor.equipment?.shield)?.shieldRegeneration??0:0;}
