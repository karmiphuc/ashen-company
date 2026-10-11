// Fixed campaign arrivals, independent of the player's strength or possessions.
export const RIVAL_DEFINITIONS = Object.freeze([
 {id:'gilded-road',name:'Gilded Road',crest:'◇',color:'#ddbd65',identity:'Contract specialists',homes:['oakwatch','greyhaven','stonebridge'],size:6,level:3,gold:12000},
 {id:'red-jackals',name:'Red Jackals',crest:'⚒',color:'#d78068',identity:'Camp hunters',homes:['ironford','highpass','ravenfell'],size:7,level:4,gold:9000},
 {id:'bronze-oath',name:'Bronze Oath',crest:'♜',color:'#9db7ce',identity:'Faction-backed veterans',homes:['ambercross','windrest','kargan'],size:8,level:5,gold:16000},
].map(d=>Object.freeze({...d,homes:Object.freeze(d.homes)})));
