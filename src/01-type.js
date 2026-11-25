// Type. One table for each size and each strength of white text on the dashboard.
// Decision: design-docs/type_rank_options.html, option 2 Earned Rank, 5 Nov 2026.
//
// Each card writes font-size:var(--lamplight-t-*) and color:var(--lamplight-ink-*). A custom property
// crosses a shadow root, so this one rule on :root reaches each card. See THE TOKENS below. Do not write a px size
// in a card: test/verify-type-scale.js fails on a size that is not in this table.
//
// The four exceptions, all in the allow list of that test: the title steps of lamplight-popup
// (22, 20), the dialog title of lamplight-confirm (20, as Home Assistant's own dialog), the strut
// of lamplight-chips, and the stock-card theme values in lamplight-panel.
const LAMP_TYPE = {
  label: '10px',     // caps, weight 600, 0.16em: eyebrows and sheet sections
  caption: '11px',   // units, ticks, sheet notes
  state: '12px',     // state lines, pills, details
  body: '14px',      // sentences and sheet rows
  name: '15px',      // row names and the sheet lead
  inline: '17px',    // a figure in a row
  room: '18px',      // the room name
  title: '24px',     // a sheet title, the Waste date, a foot figure at rest
  display: '36px',   // a hero figure, a foot figure with a fault
  reading: '56px'    // the reading of a climate sheet (design-docs/climate_quiet_options.html, option 2, 15 Nov 2026)
};
const LAMP_INK = {
  quiet: 'rgba(255,255,255,0.50)',  // never on the wallpaper or the Batteries tile
  soft: 'rgba(255,255,255,0.56)',
  mid: 'rgba(255,255,255,0.72)',
  strong: 'rgba(255,255,255,0.92)'
};
// THE TOKENS (22 Nov 2026, 0.138.0-dev). The type sizes, the inks and the three shell values are
// CSS custom properties, so another household can change them without a fork:
//
//   --lamplight-t-<size>     the sizes in LAMP_TYPE, for example --lamplight-t-body
//   --lamplight-ink-<step>   the inks in LAMP_INK, for example --lamplight-ink-mid
//   --lamplight-ground       the panel ground. Default rgb(19,20,24)
//   --lamplight-radius       the panel radius. Default 20px
//   --lamplight-shadow       the panel shadow. Default 0 6px 22px rgba(0,0,0,0.35)
//
// Three places can set a token. The first that has it wins:
//   1. a card's `theme` key, for one card (99y-theme.js)
//   2. a Home Assistant theme, which writes on <html> and beats the rule below
//   3. the defaults below, a :root rule. This dashboard uses only these.
const LAMP_SHELL_TOKENS = {
  ground: LAMP_GROUND_DEFAULT,
  radius: '20px',
  shadow: '0 6px 22px rgba(0,0,0,0.35)'
};

// Every token name, without the prefix. The `theme` key accepts these and no others.
const LAMP_TOKEN_NAMES = []
  .concat(Object.keys(LAMP_TYPE).map(function (k) { return 't-' + k; }))
  .concat(Object.keys(LAMP_INK).map(function (k) { return 'ink-' + k; }))
  .concat(Object.keys(LAMP_SHELL_TOKENS));

(function () {
  if (document.getElementById('lamplight-tokens')) return;
  const s = document.createElement('style');
  s.id = 'lamplight-tokens';
  s.textContent = ':root{' +
    Object.keys(LAMP_TYPE).map(function (k) { return '--lamplight-t-' + k + ':' + LAMP_TYPE[k]; }).join(';') + ';' +
    Object.keys(LAMP_INK).map(function (k) { return '--lamplight-ink-' + k + ':' + LAMP_INK[k]; }).join(';') + ';' +
    Object.keys(LAMP_SHELL_TOKENS).map(function (k) { return '--lamplight-' + k + ':' + LAMP_SHELL_TOKENS[k]; }).join(';') + '}';
  document.head.appendChild(s);
})();
