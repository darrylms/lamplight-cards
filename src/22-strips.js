// lamplight-strips. Two footer tiles on one row, 12px apart.
//
// Home Assistant's own `grid` card (columns: 2, square: false) gives its
// children an 8px gap, not the view's 12px, and card-mod is not on this
// dashboard to change it. Measured in the live frontend, 29 September 2026
// (design-docs/overview_batteries_windows_options.html, options 13 and 8). This is
// the small Lamplight container the design document names as the fallback.
//
// Configuration:
//   cards   exactly two child card configs, left then right

class LampStrips extends HTMLElement {

  static getStubConfig() {
    return { cards: [] };
  }

  setConfig(config) {
    this._config = config || {};
    this._cards = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._cards) this._cards.forEach(function (c) { c.hass = hass; });
  }

  getCardSize() { return 2; }

  async _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    const wrap = document.createElement('div');
    // minmax(0, 1fr), not 1fr. A bare 1fr track has a minimum of its content's
    // own width, so a long line of words that does not wrap made the right
    // card wider than half (two bedroom windows open, 1 October 2026).
    wrap.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px';
    this.shadowRoot.appendChild(wrap);
    const list = this._config.cards || [];
    if (!list.length) return;
    await window.loadCardHelpers();          // makes sure hui-card is defined
    const self = this;
    this._cards = list.map(function (cfg) {
      const el = document.createElement('hui-card');
      if (self._hass) el.hass = self._hass;
      el.config = cfg;
      wrap.appendChild(el);
      return el;
    });
  }
}

customElements.define('lamplight-strips', LampStrips);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-strips',
  name: 'Lamplight Strips',
  description: 'Two footer tiles side by side, with the view\'s own 12px gap.',
  preview: false
});
