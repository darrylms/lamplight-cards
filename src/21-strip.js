// LampFootPanel. What the two small panels at the foot of Overview stand on:
// lamplight-battery-strip and lamplight-window-strip.
//
// THE GAUGE (option 4 with extra E of design-docs/footer_refresh_options.html, revision 3, chosen by
// the household on 25 November 2026, 0.152.0-dev). Each card is a small panel. It extends LampShell,
// so it has the 20px radius, the one shadow, the rgb(19,20,24) ground and an eyebrow. Three things
// set it apart:
//   1. A drawing in the top right corner that holds the reading: a battery filled to the lowest
//      level, or a window that is shut or open. The subclass draws it in _gauge(). It is 12px from
//      the top and 16px from the right of the card. It is not a tap target: the whole panel taps.
//   2. The accent light is centred on a point of the drawing that the subclass gives: the top of
//      the charge, or the middle of the glass. So the light still comes from the right edge
//      (Law 05.2), and on Batteries it drops as the charge drops. The bounce stays.
//   3. The rim is a lit top edge: a line along the top of the card, brightest above the drawing,
//      in the accent of the state at the strength s, with a faint glow under it (lampFootEdge).
//      It is a border-box layer of the background (Law 05.3), and it follows the light (d-092).
// The strength s (0 to 1) sets the light and the edge together. A subclass gives { rgb, s } in
// _light(): the colour and the strength.
// Why: the glass lamp of 7 Oct 2026 measured 1.8:1 for its white glyph on its own lit glass, with a
// halo wider than the lamp and two glossy highlights. The household brought pictures of a drawn
// battery and window, and chose them.
// History: option 1 "Lamplight" (7 Oct 2026, design-docs/overview_footer_rework_options.html) put a
// 36px glass lamp in the corner, with the light centred on it. Option 8 (1 Oct 2026) made the cards
// panels. Before that they were LampStrip tiles (option 13).
//
// The card has no fixed height: an eyebrow 38px, a 1px divider, then the figure and one
// line of words, with 14px padding at the bottom. It is 116px at 375px, and 128px with a
// battery in the alert band. The household's telephone draws text taller, so the card must
// not be fixed (windows-text.jpg, 1 Oct 2026). Each card fills the height of its lamplight-strips
// row, so the two cards always have the same height (7 Nov 2026, 0.73.0-dev).
//
// A subclass gives its content through _buildContent(body), its light through _light() -> { rgb, s },
// and its drawing through _gauge() -> { w, h, light: [x, y], svg }. The words line fits with
// lampFitText.

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

// Where the drawing sits: [top, right] in px from the card's edges.
const LAMP_GAUGE_AT = [12, 16];

// THE LIT TOP EDGE (extra E, 25 Nov 2026). Two layers of the background. `edge` lies in the border box,
// so it shows only in the card's 1px border: a wide, flat ellipse centred above the drawing at the
// top edge, so the top border is bright there and the sides fade. `glow` lies in the padding box,
// under the ground: a faint band of the same light just under the top edge. W is the card width,
// x the centre of the drawing's light, rgb the accent, s the strength 0 to 1.
function lampFootEdge(W, x, rgb, s) {
  const cx = Math.round(Math.min(x, W - 24));
  return {
    edge: 'radial-gradient(ellipse ' + Math.round(W) + 'px 56px at ' + cx + 'px 0px, rgba(' +
      lampMix(rgb, '255,255,255', 0.55) + ',' + lampNum(lampRound(0.75 + 0.25 * s, 3)) + ') 0%, rgba(' + rgb + ',' +
      lampNum(lampRound(0.30 + 0.25 * s, 3)) + ') 40%, rgba(' + rgb + ',0.05) 100%) border-box',
    glow: 'radial-gradient(ellipse ' + Math.round(W * 0.8) + 'px 22px at ' + cx + 'px 0px, rgba(' + rgb + ',' +
      lampNum(lampRound(0.14 + 0.16 * s, 3)) + ') 0%, rgba(' + rgb + ',0) 100%) padding-box'
  };
}

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

  // Override to return { rgb, s }: the accent of the light and the edge, and the strength 0 to 1.
  _light() { return { rgb: LAMP_FOOT_REST, s: 0 }; }

  // Override to return the drawing: { w, h, light: [x, y], svg }. w and h are its size in px, light
  // is the centre of the accent light in the drawing's own px, and svg is the markup for the state.
  _gauge() { return null; }

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
    // The drawing is positioned against the card. Set it here: do not rely on the canvas code.
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
    this._buildGauge();
    this._paintGauge();
    if (this.isConnected && !this._fitRo) this._observeFit();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { self._refitAll(); });
    }
  }

  _icon() { return null; }
  _label() { return ''; }

  // The drawing's box. It lies over the eyebrow row, at the right. It is not a tap target
  // (pointer-events:none): the whole card taps. Each card has its own shadow root, so the ids in
  // the drawing do not meet the ids of another card; _gid makes them unique all the same.
  _buildGauge() {
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:absolute;top:' + LAMP_GAUGE_AT[0] + 'px;right:' + LAMP_GAUGE_AT[1] + 'px;' +
      'line-height:0;z-index:1;pointer-events:none';
    this._card.appendChild(box);
    this._gaugeBox = box;
    this._gaugeSvg = null;
    this._gid = 'lg' + Math.random().toString(36).slice(2, 8);
  }

  // Write the drawing from _gauge(), only when its markup changed.
  _paintGauge() {
    if (!this._gaugeBox) return;
    const g = this._gauge();
    const svg = g ? g.svg : '';
    if (svg === this._gaugeSvg) return;
    this._gaugeSvg = svg;
    this._gaugeBox.style.width = g ? g.w + 'px' : '0';
    this._gaugeBox.innerHTML = svg;
  }

  // The drawing can change alone (the level moves inside one band), and LampShell._paint returns
  // early when the background did not change. So the drawing is always written here.
  _paint() {
    super._paint();
    this._paintGauge();
  }

  // The light, centred on the drawing's light point. W and H are the padding box, which the canvas
  // fills. Before the first layout the size is 0: use the size at 375px.
  _footLight() {
    const W = (this._card && this._card.clientWidth) || 172;
    const H = (this._card && this._card.clientHeight) || 126;
    const l = this._light(), Hc = l.rgb, s = l.s || 0;
    const a = lampRound(0.20 + 0.22 * s, 3);
    const g = this._gauge();
    const lx = g ? W - LAMP_GAUGE_AT[1] - g.w + g.light[0] : W - 32;
    const ly = g ? LAMP_GAUGE_AT[0] + g.light[1] : 26;
    const layer = {
      cx: lampRound(lx / W, 4), cy: lampRound(ly / H, 4), rx: 150 / W, ry: 150 / H,
      stops: lampSmoothStops([[Hc, a, 0], [Hc, lampRound(a * 0.55, 4), 0.20],
                              [Hc, lampRound(a * 0.20, 4), 0.48], [Hc, 0, 0.80]])
    };
    return { W: W, Hc: Hc, s: s, lx: lx, layers: [layer, lampBounceLayer(Hc, this._bounce()),
                                          { solid: 'ground' }] };
  }

  // glow_strength, edge_strength and glow_position have no effect on a foot panel: the light comes from the
  // strength s. The fill stays 'accent' so that the bounce and the edge come from the
  // accent family. The CSS order is the same as lampAccentWash: grain, light, bounce,
  // the glow under the edge, ground, edge.
  _background() {
    const f = this._footLight(), parts = [], e = lampFootEdge(f.W, f.lx, f.Hc, f.s);
    if (this._grain) parts.push('url(' + LAMP_GRAIN + ') padding-box');
    parts.push(lampRadialCss(f.layers[0]) + ' padding-box',
               lampRadialCss(f.layers[1]) + ' padding-box',
               e.glow,
               'linear-gradient(' + LAMP_GROUND + ', ' + LAMP_GROUND + ') padding-box',
               e.edge);
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
