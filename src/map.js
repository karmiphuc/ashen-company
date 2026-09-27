import { SETTLEMENTS, terrainAt } from './engine.js';

const tree = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 1v14" stroke="#4d5138" stroke-width="3"/><path d="m0-26-13 20h6l-11 13h36L7-6h6Z" fill="#475d45" stroke="#354e3b" stroke-width="1.5"/><path d="m0-23-8 15h8l-9 13h9" fill="#6e7950"/></g>`;
const mountain = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="m-35 21 34-68 42 68Z" fill="#898975" stroke="#656e5b" stroke-width="2"/><path d="m-1-47 4 66h38Z" fill="#737d6c"/><path d="m-1-47-13 26 11-5 10 7 1-12 10 5Z" fill="#e1ddbd"/></g>`;
const village = (town) => `<g class="settlement ${town.kind==='castle'?'castle':''}" data-town="${town.id}" role="button" tabindex="0" aria-label="Travel to ${town.name}" transform="translate(${town.x} ${town.y})"><circle class="town-hit" r="36" fill="transparent"/><ellipse cy="10" rx="24" ry="10" fill="#535d42" opacity=".25"/><path d="M-20 9v-20h15v20M4 9v-28h17V9" fill="#d3c4a0" stroke="#565746" stroke-width="2"/><path d="m-23-11 11-12L0-11Zm24-8 11-13 12 13Z" fill="#995e42" stroke="#565746" stroke-width="2"/><path d="M-7 12v-26H9v26Z" fill="#e5d7ad" stroke="#565746" stroke-width="2"/><path d="m-11-14 12-14 12 14Z" fill="#745c46" stroke="#464e3e" stroke-width="2"/><path d="M-2 11V2h7v9" fill="#4a5040"/><path d="M1-29v-17l13 3-13 7" stroke="#5c5942" fill="${town.color || '#ac603e'}" stroke-width="2"/><text y="36" text-anchor="middle" class="town-label">${town.name}</text><text y="50" text-anchor="middle" class="town-kind">${town.kind}</text></g>`;

export function mapSVG() {
  let seed=73;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const decor=[];
  for(let i=0;i<600;i++) {
    const x=190+random()*985,y=55+random()*690;
    if(SETTLEMENTS.some(t=>Math.hypot(x-t.x,y-t.y)<58)) continue;
    const terrain=terrainAt(x,y);
    if(terrain==='forest' && random()>.18) decor.push({y,svg:tree(x,y,.6+random()*.55)});
    else if(terrain==='mountain' || terrain==='mountains') {if(random()>.55) decor.push({y,svg:mountain(x,y,.6+random()*.8)});}
    else if(random()>.65) decor.push({y,svg:`<path d="m${x} ${y} 3-4 3 4m4-1 2-3 2 3" stroke="#818760" opacity=".36" fill="none"/>`});
  }
  const roads=SETTLEMENTS.slice(1).map((t,i)=>{const prev=SETTLEMENTS[i];return `<path d="M${prev.x} ${prev.y} Q${(prev.x+t.x)/2-40} ${(prev.y+t.y)/2+50} ${t.x} ${t.y}"/>`;}).join('');
  return `<svg id="world-map" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" aria-label="The Marches world map. Tap land to travel.">
  <defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".11"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter><radialGradient id="land"><stop stop-color="#cbd0a0"/><stop offset="1" stop-color="#aab789"/></radialGradient><pattern id="waves" width="45" height="28" patternUnits="userSpaceOnUse"><path d="M3 16q7-5 15 0t15 0" fill="none" stroke="#c5d3bd" stroke-width="1" opacity=".3"/></pattern></defs>
  <rect width="1200" height="800" fill="#799d97"/><rect width="1200" height="800" fill="url(#waves)"/>
  <path d="M150-30Q190 40 138 91T158 186Q100 233 145 290T116 390Q147 456 103 499T122 594Q84 660 141 722L120 840H1240V-30Z" fill="url(#land)" stroke="#e4dbb4" stroke-width="14"/>
  <path d="M1020 0Q830 90 915 177T790 276Q927 359 877 460T947 589L1160 800H1200V0" fill="#b9bf93" opacity=".6"/>
  <path d="M405 0Q451 130 390 189T409 304Q469 348 461 401T500 484Q480 553 532 598T614 800" fill="none" stroke="#759b94" stroke-width="9"/>
  <path d="M406 0Q452 130 391 189T410 304Q470 348 462 401T501 484Q481 553 533 598T615 800" fill="none" stroke="#afc0a6" stroke-width="3"/>
  <g fill="none" stroke="#cbbb8f" stroke-width="8">${roads}</g><g fill="none" stroke="#eddfb5" stroke-width="3" stroke-dasharray="4 5">${roads}</g>
  ${decor.sort((a,b)=>a.y-b.y).map(d=>d.svg).join('')}
  <rect width="1200" height="800" fill="#d8d0ac" filter="url(#paper)" opacity=".12" pointer-events="none"/>
  <g class="region-labels"><text x="91" y="408" transform="rotate(-85 91 408)">THE SALT REACH</text><text x="635" y="107">THE GREY MARCHES</text><text x="690" y="696">THE LOWLANDS</text></g>
  <g id="travel-route"></g>${SETTLEMENTS.map(village).join('')}
  <g id="caravan"><path d="M-9 0h18v10H-9Z" fill="#8c6344"/><path d="M-10 0q10-17 20 0Z" fill="#e5d9b4" stroke="#776a4d"/><circle cx="-6" cy="12" r="3" fill="#4a4d39"/><circle cx="7" cy="12" r="3" fill="#4a4d39"/></g>
  <g id="company-marker"><ellipse cy="13" rx="23" ry="9" fill="#263d33" opacity=".3"/><circle r="19" fill="#233d37" stroke="#e9d5a0" stroke-width="3"/><path d="M-4 12v-43l24 6-24 10" fill="#c48b4b" stroke="#f2dfb0" stroke-width="2"/><path d="m3-25 8 2-5 4" fill="#eee0bb"/><circle cy="8" r="4" fill="#e8d5aa"/></g>
  <g transform="translate(1110 98)" opacity=".64"><circle r="37" fill="none" stroke="#4f614c"/><path d="M0-45 9-9 0 0-9-9Zm0 90 9-36L0 0l-9 9Z" fill="#4f614c"/><path d="M-30 0 0-7 30 0 0 7Z" fill="#687555"/><text y="-53" text-anchor="middle" fill="#3f5140" font-size="17" font-family="Georgia">N</text></g>
  </svg>`;
}

export function updateMap(state) {
  const marker=document.querySelector('#company-marker');
  if(!marker) return;
  marker.setAttribute('transform',`translate(${state.position.x} ${state.position.y})`);
  const route=document.querySelector('#travel-route');
  route.innerHTML=state.destination?`<path d="M${state.position.x} ${state.position.y} L${state.destination.x} ${state.destination.y}" stroke="#8c4e36" stroke-width="3" stroke-dasharray="6 6" fill="none"/><circle cx="${state.destination.x}" cy="${state.destination.y}" r="10" stroke="#8c4e36" stroke-width="2" fill="none"/>`:'';
  const progress=(state.day*24+state.hour)/20;
  const a=SETTLEMENTS[0],b=SETTLEMENTS[1],t=(Math.sin(progress)+1)/2;
  document.querySelector('#caravan').setAttribute('transform',`translate(${a.x+(b.x-a.x)*t} ${a.y+(b.y-a.y)*t})`);
}
