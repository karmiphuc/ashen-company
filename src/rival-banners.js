import {RIVAL_DEFINITIONS} from './rival-companies.js';
const outline=[[0,0],[30,0],[30,38],[15,31],[0,38]];
const path='M0 0H30V38L15 31L0 38Z';
const patterns={
 'gilded-road':{mark:'◇',decoration:'M0 7H30M0 25H30'},
 'red-jackals':{mark:'⚒',decoration:'M0 0L30 30M0 8L30 38'},
 'bronze-oath':{mark:'♜',decoration:'M3 0V36M27 0V36'},
};
export function rivalBannerSpec(id){
 const definition=RIVAL_DEFINITIONS.find(d=>d.id===id.replace(/^rival:/,''));
 return definition?{...patterns[definition.id],color:definition.color,name:definition.name}:null;
}
export function rivalBannerHTML(id){
 const spec=rivalBannerSpec(id);if(!spec)return '';
 return `<svg class="rival-banner" viewBox="-5 -3 40 47" aria-hidden="true" focusable="false"><path d="M-3 43V-2H32" fill="none" stroke="#d6b477" stroke-width="2"/><path d="${path}" fill="${spec.color}" stroke="#161510" stroke-width="2"/><path d="${spec.decoration}" fill="none" stroke="#fff4d2" stroke-opacity=".55" stroke-width="2"/><text x="15" y="23" text-anchor="middle" font-family="Georgia" font-size="20" font-weight="bold" fill="#171713">${spec.mark}</text></svg>`;
}
export function drawRivalBanner(context,id,x,y,zoom=1,selected=false,compact=false){
 const spec=rivalBannerSpec(id);if(!spec)return;
 // Heraldry remains recognizable when the world is zoomed out, without a label.
 const scale=compact?Math.max(.45,.4/Math.max(.1,zoom)):Math.max(.9,1/Math.max(.1,zoom));
 context.save();context.translate(x-15*scale,y-28*scale);context.scale(scale,scale);
 context.lineWidth=selected?3:2;context.strokeStyle=selected?'#fff3bd':'#d6b477';context.beginPath();context.moveTo(-3,43);context.lineTo(-3,-2);context.lineTo(32,-2);context.stroke();
 context.beginPath();outline.forEach(([px,py],index)=>index?context.lineTo(px,py):context.moveTo(px,py));context.closePath();context.fillStyle=spec.color;context.fill();context.strokeStyle='#161510';context.lineWidth=2;context.stroke();
 context.save();context.clip();context.strokeStyle='#fff4d2';context.globalAlpha=.55;context.lineWidth=2;
 context.stroke(new Path2D(spec.decoration));context.restore();
 context.font='bold 20px Georgia';context.textAlign='center';context.fillStyle='#171713';context.fillText(spec.mark,15,23);context.restore();
}
