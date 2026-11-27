// lamplight-panel. A shell that holds other cards.
//
// It is LampShell with a `cards:` list. The children go inside the one
// ha-card, and each child keeps its own tap action, because each child is its
// real element. The child's own ha-card gets no background, no shadow and no
// radius: depth is shown once, at the edge of the panel.
//
// Every configuration key of the shell applies here - see 20-shell.js, which
// also documents the changing accent. The extra keys are:
//   cards       the children
//   heading     { icon, label }. Optional. The panel's header, drawn by the
//               same shared code as lamplight-waste and lamplight-rooms. It replaced a
//               button-card first child on 13 panels, 22 September 2026
//   restyle_children true (default) | false. A child that is not a Lamplight card
//               (its `type` does not start with `custom:lamplight-`) takes the
//               Lamplight colours and type through Home Assistant theme
//               variables, which the panel sets on the child's <hui-card>. The
//               panel puts no stylesheet into the child for this. The variables
//               are in LAMP_CHILD_THEME. The accent ones follow the accent of
//               the panel, also when it changes (see 20-shell.js). `false`
//               sets no variable. Lamplight 0.30.0-dev, 10 October 2026
//
// A panel with `light_style: accent` and no `entities` holds its rim at `glow_strength`.
// A panel with `light_style: accent` and `entities` holds the fill and lets the rim
// read the fraction that is active.

// The theme variables for a child that is not a Lamplight card (restyle_children).
// A value of LAMP_CHILD_ACCENT is the accent of the panel, as rgb(r,g,b). Do not
// add --primary-color: some stock cards draw text in it, and Law 07.1 does not
// permit the accent on text. The switches and the gauge read the variables below.
const LAMP_CHILD_ACCENT = '@accent';
const LAMP_CHILD_THEME = [
  ['--ha-card-border-width', '0px'],
  ['--ha-card-border-color', 'transparent'],
  ['--ha-card-border-radius', '0px'],
  ['--primary-text-color', 'rgba(255,255,255,0.92)'],
  ['--secondary-text-color', 'rgba(255,255,255,0.56)'],
  ['--state-icon-color', 'rgba(255,255,255,0.40)'],
  ['--state-inactive-color', 'rgba(255,255,255,0.40)'],
  ['--state-switch-off-color', 'rgba(255,255,255,0.40)'],
  ['--state-active-color', LAMP_CHILD_ACCENT],
  ['--state-switch-active-color', LAMP_CHILD_ACCENT],
  ['--state-switch-on-color', LAMP_CHILD_ACCENT],
  ['--switch-checked-color', LAMP_CHILD_ACCENT],
  ['--switch-checked-track-color', LAMP_CHILD_ACCENT],
  ['--switch-checked-button-color', '#ffffff'],
  ['--switch-unchecked-button-color', 'rgba(255,255,255,0.75)'],
  ['--switch-unchecked-track-color', 'rgba(255,255,255,0.30)'],
  ['--ha-switch-checked-background-color', LAMP_CHILD_ACCENT],
  ['--ha-switch-checked-border-color', LAMP_CHILD_ACCENT],
  ['--ha-switch-checked-thumb-background-color', '#ffffff'],
  ['--ha-switch-background-color', 'rgba(255,255,255,0.14)'],
  ['--ha-switch-border-color', 'transparent'],
  ['--ha-switch-thumb-background-color', 'rgba(255,255,255,0.75)'],
  ['--control-switch-on-color', LAMP_CHILD_ACCENT],
  ['--control-switch-off-color', 'rgba(255,255,255,0.75)'],
  ['--info-color', LAMP_CHILD_ACCENT],                        // the gauge fill
  ['--divider-color', 'rgba(255,255,255,0.05)'],
  ['--primary-background-color', 'rgba(255,255,255,0.08)'],  // the gauge track
  ['--ha-font-size-m', '15px'],
  ['--ha-font-size-s', '12px'],
  ['--ha-font-weight-medium', '600'],
  ['--ha-tile-icon-border-radius', '11px'],
  ['--ha-tile-info-secondary-color', 'rgba(255,255,255,0.56)']
];

class LampPanel extends LampShell {

  static getStubConfig() {
    return { accent: '255,146,28', entities: [],
             heading: { icon: 'mdi:lightbulb-group', label: 'Lights' }, cards: [] };
  }

  _setup(config) {
    this._cards = null;
    this._childTheme = lampOpt('panel', config, 'restyle_children') !== false;
    this._themed = [];               // the <hui-card> children that have the theme
    this._themeAccent = undefined;   // the accent last written; null = none
  }

  _onHass(hass) {
    if (this._cards) this._cards.forEach(function (c) { c.hass = hass; });
  }

  getCardSize() {
    if (!this._cards) return 1;
    return this._cards.reduce(function (n, c) {
      return n + (c.getCardSize ? c.getCardSize() : 1); }, 0);
  }

  // The eyebrow goes in first and synchronously, so it is on screen before the
  // children have loaded. It is a sibling of the children in the same flex
  // column, so it takes the same gap the button-card eyebrow it replaces took.
  _build() {
    const eb = this._config.heading;
    if (eb) this._body.appendChild(lampEyebrow(eb.icon, eb.label));
    this._children();
  }

  // Build each child as a <hui-card>, which is how Home Assistant's own
  // stacks do it. DO NOT use helpers.createCardElement here: it returns the
  // bare card element and card_mod never sees it, so a child carrying its own
  // card_mod renders unstyled. That cost the Routines seasonal row its
  // flex-wrap and 53px of height. Measured 20 September 2026.
  async _children() {
    const list = this._config.cards || [];
    if (!list.length) return;
    await window.loadCardHelpers();          // makes sure hui-card is defined
    const self = this;
    this._cards = list.map(function (cfg) {
      const el = document.createElement('hui-card');
      if (self._hass) el.hass = self._hass;
      el.config = cfg;
      self._body.appendChild(el);
      self._flatten(el);
      self._themeChild(el, cfg);
      return el;
    });
  }

  // The accent can change (the `first-on` rule), so the accent variables follow
  // it. _render() calls _paint() before _build(), so the first call finds no
  // children: _themeChild() writes the accent for each child it adds.
  _paint() {
    super._paint();
    if (!this._themed || !this._themed.length) return;
    const A = this._childAccent();
    if (A === this._themeAccent) return;           // nothing moved, so write nothing
    this._themeAccent = A;
    this._themed.forEach(function (el) { this._writeAccent(el, A); }, this);
  }

  // The accent as rgb(r,g,b), or null when there is none yet (no accent, or
  // `light_style: off` with no accent). Then the Home Assistant colours stay.
  _childAccent() {
    try { return 'rgb(' + this._accent() + ')'; } catch (e) { return null; }
  }

  _writeAccent(el, A) {
    LAMP_CHILD_THEME.forEach(function (p) {
      if (p[1] !== LAMP_CHILD_ACCENT) return;
      if (A) el.style.setProperty(p[0], A); else el.style.removeProperty(p[0]);
    });
  }

  // Set the theme variables on the child's <hui-card>. Do NOT set them on
  // this._body: from there they reach the cards inside Lamplight cards (the
  // sliders in lamplight-light, the graph in lamplight-climate, the name of a lamplight-row).
  // A Lamplight child is left alone. Custom properties inherit into the light
  // DOM of the card.
  _themeChild(huiCard, cfg) {
    if (!this._childTheme) return;
    const type = cfg && typeof cfg.type === 'string' ? cfg.type : '';
    if (/^custom:lamplight-/.test(type)) return;
    LAMP_CHILD_THEME.forEach(function (p) {
      if (p[1] !== LAMP_CHILD_ACCENT) huiCard.style.setProperty(p[0], p[1]);
    });
    const A = this._childAccent();
    this._writeAccent(huiCard, A);
    if (this._themed.indexOf(huiCard) < 0) this._themed.push(huiCard);
    this._themeAccent = A;
  }

  // Take the child's own card out of the picture. The style goes inside the
  // child's shadow root, so it survives the child's own re-renders. A child
  // that has not upgraded yet has no shadow root, so try again for two seconds.
  _flatten(huiCard) {
    const apply = () => {
      // hui-card renders the real card into its light DOM, not a shadow root.
      const el = huiCard.firstElementChild || huiCard;
      const sr = el.shadowRoot;
      if (!sr) return false;
      // A band card says so with a static `lampBand`. See LAMP_BAND_PAD.
      if (el.constructor && el.constructor.lampBand) huiCard.setAttribute('data-lamp-band', '');
      if (sr.querySelector('style[data-lamp]')) return true;
      const s = document.createElement('style');
      s.setAttribute('data-lamp', '');
      // Take away only what the shell owns. Do NOT set `border`: a row draws
      // its own 1px divider, and removing it makes the panel 1px short and
      // takes a line out of the design. Measured on the Bedroom Windows row,
      // 20 September 2026.
      s.textContent = 'ha-card, .card-content > ha-card {' +
        'background: none !important;' +
        'box-shadow: none !important; border-radius: 0 !important;' +
        'margin: 0 !important; backdrop-filter: none !important;' +
        '-webkit-backdrop-filter: none !important; }';
      sr.appendChild(s);
      return true;
    };
    if (apply()) return;
    let n = 0;
    const t = setInterval(() => { if (apply() || ++n > 50) clearInterval(t); }, 40);
  }
}

customElements.define('lamplight-panel', LampPanel);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-panel',
  name: 'Lamplight Panel',
  description: 'A panel shell with a light at its right edge.',
  preview: false
});
