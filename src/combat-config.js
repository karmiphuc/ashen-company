// Settings opt-in. Existing battles retain the mode saved when they started.
const KEY = 'ashen-company-simultaneous-beta-v1';
let enabled = false;
try {
  const query = new URLSearchParams(globalThis.location?.search ?? '').get('combat-beta');
  enabled = globalThis.localStorage?.getItem(KEY) === 'on';
  if (query === '1' || query === '0') { enabled = query === '1'; globalThis.localStorage?.setItem(KEY,enabled?'on':'off'); }
} catch {}
export const isSimultaneousBetaEnabled = () => enabled;
export const isCombatBetaConfigVisible = () => true;
export function setSimultaneousBetaEnabled(value) {
  enabled = !!value;
  try { globalThis.localStorage?.setItem(KEY,enabled?'on':'off');
    if(globalThis.location&&globalThis.history){const url=new URL(globalThis.location.href);url.searchParams.delete('combat-beta');globalThis.history.replaceState(globalThis.history.state,'',url);}
  } catch {}
}
export function combatBetaConfigHTML() {
  return `<section class="combat-beta-config"><h3>Combat mode</h3><label><input type="checkbox" data-simultaneous-beta ${enabled?'checked':''}> Realtime combat · beta</label><details><summary>How it works</summary><p>Applies to new battles. Fighters act on independent clocks; AP refreshes every 6 battle seconds. Turn off for turn-based combat. Existing battles keep their saved mode.</p></details></section>`;
}
