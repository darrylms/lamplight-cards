// LampFootPanel. What the two small panels at the foot of Overview stand on:
// lamplight-battery-strip and lamplight-window-strip.
//
// Option 1 "Lamplight", design-docs/overview_footer_rework_options.html, chosen by the
// household on 7 October 2026 (built 7 October 2026, 0.28.0-dev). Each card is a small
// panel. It extends LampShell, so it has the 20px radius, the one shadow, the
// rgb(19,20,24) ground and an eyebrow. Three things set it apart:
//   1. A glass lamp, 36 x 36px, in the top right corner (src/16-lamp.js, the lamp of
//      lamplight-routines). It hangs over the eyebrow row and the divider. It is not a button:
//      the whole panel taps.
//   2. The accent light is centred on the lamp: a 150px circle of light from the lamp, not
//      an ellipse from above the corner. The bounce and the rim stay, so the seven parts
//      of the accent family stay (Law 05.2).
//   3. The figure is 36px (28px before). The words name the lowest battery at rest.
// The strength s (0 to 1) sets the lamp glow, the lit layer and the light together. A
// subclass gives { rgb, s, icon } in _light(): the colour, the strength and the lamp glyph.
// Why: the measured causes are in the design document.
// History: option 8 (1 Oct 2026) made the cards panels with a light from above the corner.
// Before that they were LampStrip tiles (option 13).
//
// The card has no fixed height: an eyebrow 38px, a 1px divider, then the figure and one
// line of words, with 14px padding at the bottom. It is 116px at 375px, and 128px with a
// battery in the alert band. The household's telephone draws text taller, so the card must
// not be fixed (windows-text.jpg, 1 Oct 2026). Each card fills the height of its lamplight-strips
// row, so the two cards always have the same height (7 Nov 2026, 0.73.0-dev).
//
// A subclass gives its content through _buildContent(body) and its light through
// _light() -> { rgb, s, icon }. The words line fits with lampFitText.

// Try candidate strings, longest-wanted first, and keep the first that fits
// the element's own box. `el` gets the chosen text. LampFootPanel calls it
// again when the card resizes or the fonts load.
//
// Each candidate is written to the element and checked with scrollWidth vs
// clientWidth - the real layout of the real font on the real device, not a
// canvas measureText estimate. lamplight-day's title (94-popup.js _fitTitle) and
// lamplight-waste's foot (50-waste.js _fitFoot) fit the same way. A canvas
// estimate (29 Sep 2026) measured 0% spare against the live telephone, which
// draws text wider than desktop Chrome (reference_ha_phone_draws_text_wider.md).
function lampFitText(el, candidates) {
  if (!candidates || !candidates.length) { el.textContent = ''; return; }
  for (let i = 0; i < candidates.length; i++) {
    el.textContent = candidates[i];
    if (el.scrollWidth <= el.clientWidth) return;
  }
  // None fit: the last candidate is already set. text-overflow:ellipsis is
  // the last defence.
}

// The accent at rest: every window closed, or no battery reading. Slate, the
// option 8 mockup's colour and the Routines panel's fallback.
const LAMP_FOOT_REST = LAMP_MEANINGS.panel.rest;

class LampFootPanel extends LampShell {

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    // Always the decorative accent fill: the state is a reading, not a
    // fraction of things active (Law 05.1).
    const c = Object.assign({}, config, { light_style: 'accent' });
    this._tap = config.tap_action || this._defaultTap();
    this._fits = [];
    super.setConfig(c);
  }

  // Override in a subclass whose default tap_action is not "none".
  _defaultTap() { return { action: 'none' }; }

  // Override to return { rgb, s, icon }: the accent of the light and the rim, the strength
  // 0 to 1, and the glyph in the lamp.
  _light() { return { rgb: LAMP_FOOT_REST, s: 0, icon: null }; }

  _accent() { return this._light().rgb; }

  _buildContent() {}

  getCardSize() { return 2; }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._fitRo) { this._fitRo.disconnect(); this._fitRo = null; }
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._card && !this._fitRo) this._observeFit();
  }

  _observeFit() {
    const self = this;
    // The light depends on the size of the card, and the card grows when the fonts load.
    this._fitRo = new ResizeObserver(function () { self._refitAll(); self._paint(); });
    this._fitRo.observe(this._card);
  }

  // A words element registers its own candidate list here, longest-wanted
  // first. The card fits it now and again on resize and on a font load.
  _registerFit(el, candidates) {
    const row = this._fits.filter(function (f) { return f.el === el; })[0];
    if (row) row.candidates = candidates;
    else this._fits.push({ el: el, candidates: candidates });
    lampFitText(el, candidates);
  }

  _refitAll() {
    this._fits.forEach(function (f) { lampFitText(f.el, f.candidates); });
  }

  _render() {
    // A custom element defaults to display:inline, which starves a block
    // child inside its shadow root of a real width (clientWidth 0), and
    // lampFitText then has nothing to fit against. Found the hard way,
    // 29 September 2026.
    this.style.display = 'block';
    this.style.height = '100%';
    super._render();
    this._card.style.setProperty('height', '100%');
    this._card.style.setProperty('box-sizing', 'border-box');
  }

  _build() {
    const self = this;
    const card = this._card;
    // The lamp is positioned against the card. Set it here: do not rely on the canvas code.
    card.style.setProperty('position', 'relative');
    card.style.cursor = (this._tap && this._tap.action !== 'none') ? 'pointer' : 'default';
    card.addEventListener('click', function () { self._tapRow(); });
    // The eyebrow meets the divider with no gap, as in the mockup.
    this._body.style.gap = '0';
    this._body.appendChild(lampEyebrow(this._icon(), this._label()));
    const body = document.createElement('div');
    // No line under the eyebrow (design-docs/divider_rule_options.html, option 1): the strip
    // shows one figure, not a list. The extra 1px of padding keeps the old height.
    body.style.cssText = 'padding:5px 16px 14px';
    this._body.appendChild(body);
    this._buildContent(body);
    this._buildLamp();
    this._paintLamp();
    if (this.isConnected && !this._fitRo) this._observeFit();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { self._refitAll(); });
    }
  }

  _icon() { return null; }
  _label() { return ''; }

  // The lamp: a box, a lit layer and an icon. It lies over the eyebrow row and the divider.
  // It is not a tap target (pointer-events:none): the whole card taps.
  _buildLamp() {
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:absolute;top:8px;right:14px;width:36px;height:36px;' +
      'border-radius:50%;z-index:1;pointer-events:none';
    const lit = document.createElement('span');
    lit.style.cssText = 'position:absolute;inset:0;border-radius:50%';
    const icon = document.createElement('ha-icon');
    icon.style.cssText = 'position:absolute;left:10px;top:10px;--mdc-icon-size:16px;' +
      'width:16px;height:16px;display:flex;line-height:0';
    box.appendChild(lit);
    box.appendChild(icon);
    this._card.appendChild(box);
    this._lamp = { box: box, lit: lit, icon: icon };
  }

  // Write the lamp from _light(). The wash of a foot lamp is its accent.
  _paintLamp() {
    if (!this._lamp) return;
    const l = this._light(), acc = l.rgb, s = l.s || 0, on = s > 0, P = this._lamp;
    P.box.style.background = lampGlassCss(acc);
    P.box.style.boxShadow = lampGlowCss(acc, acc, s);
    P.lit.style.background = lampLitCss(acc);
    P.lit.style.boxShadow = lampLitRing(acc);
    P.lit.style.opacity = lampLitOpacity(s);
    if (l.icon) P.icon.setAttribute('icon', l.icon); else P.icon.removeAttribute('icon');
    P.icon.style.color = lampIconInk(acc, on);
    P.icon.style.filter = lampIconFilter(acc, on);
  }

  // The glyph can change alone (46% shows battery-50, 42% shows battery-40), and
  // LampShell._paint returns early when the background did not change. So the lamp
  // is always written here.
  _paint() {
    super._paint();
    this._paintLamp();
  }

  // The light, centred on the lamp. W and H are the padding box, which the canvas fills.
  // Before the first layout the size is 0: use the size at 375px.
  _footLight() {
    const W = (this._card && this._card.clientWidth) || 172;
    const H = (this._card && this._card.clientHeight) || 126;
    const l = this._light(), Hc = l.rgb, s = l.s || 0;
    const a = lampRound(0.20 + 0.22 * s, 3);
    const layer = {
      cx: (W - 32) / W, cy: 26 / H, rx: 150 / W, ry: 150 / H,
      stops: lampSmoothStops([[Hc, a, 0], [Hc, lampRound(a * 0.55, 4), 0.20],
                              [Hc, lampRound(a * 0.20, 4), 0.48], [Hc, 0, 0.80]])
    };
    return { W: W, Hc: Hc, s: s, layers: [layer, lampBounceLayer(Hc, this._bounce()),
                                          { solid: 'ground' }] };
  }

  // glow_strength, edge_strength and glow_position have no effect on a foot panel: the light comes from the
  // strength s. The fill stays 'accent' so that the bounce and the rim come from the
  // accent family. The CSS order is the same as lampAccentWash: grain, light, bounce,
  // ground, rim.
  _background() {
    const f = this._footLight(), parts = [];
    if (this._grain) parts.push('url(' + LAMP_GRAIN + ') padding-box');
    parts.push(lampRadialCss(f.layers[0]) + ' padding-box',
               lampRadialCss(f.layers[1]) + ' padding-box',
               'linear-gradient(' + LAMP_GROUND + ', ' + LAMP_GROUND + ') padding-box',
               'radial-gradient(circle 190px at ' + (f.W - 31) + 'px 27px, rgba(' + f.Hc + ',' +
                 lampNum(lampRound(0.18 + 0.3 * f.s, 3)) + ') 0%, rgba(' + f.Hc + ',0.035) 100%) border-box');
    return parts.join(',\n    ');
  }

  _washLayers() {
    if (!this._grain) return null;
    return this._footLight().layers;
  }

  // The figure and the words below it. `fig` holds the number and a <small>
  // with its unit; `words` is the line the ladder fits.
  _figureAndWords(body) {
    this._fig = document.createElement('div');
    this._fig.style.cssText = 'margin-top:9px;font-size:var(--lamplight-t-title);font-weight:300;letter-spacing:-.02em;' +
      'line-height:1;color:var(--lamplight-ink-strong);font-variant-numeric:tabular-nums;white-space:nowrap';
    this._figNum = document.createTextNode('');
    this._figSmall = document.createElement('small');
    this._figSmall.style.cssText = 'font-size:var(--lamplight-t-state);font-weight:400;letter-spacing:0;' +
      'color:var(--lamplight-ink-soft);margin-left:5px';
    this._fig.appendChild(this._figNum);
    this._fig.appendChild(this._figSmall);
    body.appendChild(this._fig);

    this._words = document.createElement('div');
    this._words.style.cssText = 'margin-top:9px;line-height:15px;font-size:var(--lamplight-t-state);color:var(--lamplight-ink-soft);' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    body.appendChild(this._words);
  }

  // Attention sets the size: a figure at rest is quiet, and a fault draws at display size.
  _setFigure(num, small, colour, fault) {
    this._fig.style.fontSize = fault ? 'var(--lamplight-t-display)' : 'var(--lamplight-t-title)';
    this._figNum.textContent = num;
    this._figSmall.textContent = small;
    this._fig.style.color = colour || 'var(--lamplight-ink-strong)';
  }

  _tapRow() {
    const a = this._tap;
    if (!a || a.action === 'none') return;
    if (a.action === 'navigate' && a.navigation_path) {
      history.pushState(null, '', a.navigation_path);
      this.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }));
      return;
    }
    if (a.action === 'call-service' || a.action === 'perform-action') {
      const bits = (a.perform_action || a.service || '').split('.');
      if (bits.length === 2 && this._hass) {
        this._hass.callService(bits[0], bits[1], a.data || {}, a.target || {});
      }
    }
  }
}
