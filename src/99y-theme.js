// The `theme` key (22 Nov 2026, 0.138.0-dev). Every Lamplight card accepts it.
//
//   theme:
//     ground: '#101418'
//     radius: 16px
//     t-body: 15px
//     ink-mid: 'rgba(255,255,255,0.75)'
//
// The names are the tokens in 01-type.js, without `--lamplight-`. The values go on the card's own
// element as custom properties, so they reach the card and every card inside it, and they beat a
// Home Assistant theme. An unknown name is an error, so a typing mistake does not fail quietly.
// The panel keys `radius` and `shadow` still work, and they beat `theme` on that panel.

function lampApplyTheme(el, config) {
  const t = config && config.theme;
  if (t !== undefined && (t === null || typeof t !== 'object' || Array.isArray(t))) {
    throw new Error('theme must be a list of tokens, for example theme: { radius: 16px }');
  }
  const keys = t ? Object.keys(t) : [];
  keys.forEach(function (k) {
    if (LAMP_TOKEN_NAMES.indexOf(k) === -1) {
      throw new Error('theme: `' + k + '` is not a token. Tokens: ' + LAMP_TOKEN_NAMES.join(', '));
    }
  });
  // Remove the tokens of an earlier configuration, then write the new ones.
  (el._lampThemeKeys || []).forEach(function (k) { el.style.removeProperty('--lamplight-' + k); });
  keys.forEach(function (k) { el.style.setProperty('--lamplight-' + k, String(t[k])); });
  el._lampThemeKeys = keys;
}

// One hook on each card's setConfig, so no card needs its own copy.
['batteries', 'battery-strip', 'chips', 'climate', 'climate-detail', 'day', 'header', 'light',
  'panel', 'plug-detail', 'popup', 'purifier-detail', 'rooms', 'routines', 'row', 'scenes', 'spacer',
  'strips', 'waste', 'weather', 'windows-detail', 'window-strip'].forEach(function (n) {
  const Card = customElements.get('lamplight-' + n);
  if (!Card || Card.prototype._lampThemeHook) return;
  const own = Card.prototype.setConfig;
  Card.prototype.setConfig = function (config) {
    lampApplyTheme(this, config);
    return own.call(this, config);
  };
  Card.prototype._lampThemeHook = true;
});
