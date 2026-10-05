// Hidden opt-in. Existing battles always retain the mode saved when they started.
const KEY = 'ashen-company-simultaneous-beta-v1';
let enabled = false, unlocked = false;
try {
  const query = new URLSearchParams(globalThis.location?.search ?? '').get('combat-beta');
  enabled = globalThis.localStorage?.getItem(KEY) === 'on';
  if (query === '1' || query === '0') { unlocked = true; enabled = query === '1'; globalThis.localStorage?.setItem(KEY,enabled?'on':'off'); }
} catch {}
export const isSimultaneousBetaEnabled = () => enabled;
export const isCombatBetaConfigVisible = () => unlocked || enabled;
export function setSimultaneousBetaEnabled(value) {
  enabled = !!value;
  try { globalThis.localStorage?.setItem(KEY,enabled?'on':'off');
    if(globalThis.location&&globalThis.history){const url=new URL(globalThis.location.href);url.searchParams.delete('combat-beta');globalThis.history.replaceState(globalThis.history.state,'',url);}
  } catch {}
}
export function combatBetaConfigHTML() {
  return isCombatBetaConfigVisible() ? `<details class="combat-beta-config"><summary>Experimental combat</summary><label><input type="checkbox" data-simultaneous-beta ${enabled?'checked':''}> Simultaneous combat · beta</label><p>New battles only. Everyone acts on independent clocks. Hexes, roles, AP, initiative and fatigue still apply. AP refreshes every 6 battle seconds. Existing battles keep their saved mode.</p></details>` : '';
}
