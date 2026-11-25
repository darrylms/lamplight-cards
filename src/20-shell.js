// LampShell. What every Lamplight card stands on.
//
// It owns the things master_design.html section 05 says a panel may not drop:
// the accent, the 20px radius, the one shadow, the rgb(19,20,24) ground and the
// light from the right edge. A card that extends it gets all of them and fills
// `this._body`.
//
// Configuration every card accepts:
//   accent      "255,64,160" | "#ff40a0" | "rgb(255,64,160)" | a resolver
//   light_style "activity" (default) | "accent" | "off". An accent panel draws a bounce
//               at bounce_strength (f is 0 with no entities). "off" draws the
//               ground and a quiet rim, and no light: for a panel whose
//               children are the light (lamplight-routines). It needs no accent
//   entities    the rows, in the order they appear on the card
//   glow_strength, edge_strength, glow_position
//               literal values that replace the ones from `entities`. glow_strength is the
//               peak of the wash (on an accent panel, the fill). edge_strength is the edge
//               line. glow_position is where the light stands, in % of the card height.
//               The defaults are in 01-defaults.js
//   bounce_strength  the ember glow from the bottom left. Default: a ramp in 01-defaults.js
//   light_from  "top-edge". On an accent panel it puts the light on the top edge at 84%,
//               with a sheen down the right half; without it, the source is 16% above
//               the card. On an activity panel it adds the sheen only, at a x 0.35
//               (10-wash.js, THE EDGE SOURCE)
//   smooth_gradient  true (default). Draws a dithered canvas over the wash, which
//               hides the 8-bit banding the CSS layers leave. false paints
//               the CSS wash alone.
//   gap         space between children. Default follows Home Assistant's own
//               --vertical-stack-card-gap / --stack-card-gap, which is 8px
//   radius      default "20px", from the theme variable --lamplight-radius
//   shadow      default "0 6px 22px rgba(0,0,0,0.35)", from --lamplight-shadow
//
// A CHANGING ACCENT
// `accent` is usually one colour. It may instead be a rule that reads the state
// and picks one from a list:
//
//   accent:
//     pick: most-recently-triggered
//     from:
//       - { entity: script.morning, accent: '252,160,30' }
//       - { entity: script.evening, accent: '250,88,48' }
//     fallback: '143,160,189'
//
// `most-recently-triggered` compares the `last_triggered` attribute and takes
// the largest. An entity with no value counts as never. The first entry in the
// list wins a tie, which is what the Jinja it replaces did. If no entity has a
// value, the rule gives `fallback`, or the first entry.
//
// `first-on` takes the accent of the first entry whose state is `on`. If no
// entity is on, the rule gives `fallback`, or the first entry. Bedroom Windows
// uses it: the room accent while every contact is closed, sky when one opens,
// so the hue of the card shows the state (design-docs/windows_colour_options.html,
// option B, 25 September 2026; orange became sky 27 September 2026, option 12 of
// design-docs/popup_sheets_rework_options.html, because an open window is not an alarm):
//
//   accent:
//     pick: first-on
//     from:
//       - { entity: binary_sensor.bedroom_left_window_sensor_contact, accent: '60,200,235' }
//     fallback: '255,64,160'
//
// Only two rules exist, deliberately. A card that needs a harder rule has the
// state in front of it already and should override `_accent()` instead - which
// is what lamplight-waste does, because it must find the next collection for its own
// content and the colour falls out of that work.

const LAMP_PICKERS = {
  'most-recently-triggered': function (hass, from) {
    let best = null, bestAt = -1;
    from.forEach(function (row) {
      const st = hass && hass.states[row.entity];
      const raw = st && st.attributes && st.attributes.last_triggered;
      const at = raw ? Date.parse(raw) : NaN;
      const ts = isFinite(at) ? at : 0;
      if (ts > bestAt) { bestAt = ts; best = row; }   // > keeps the first of a tie
    });
    return bestAt > 0 && best ? best.accent : null;
  },
  'first-on': function (hass, from) {
    for (let i = 0; i < from.length; i++) {
      const st = hass && hass.states[from[i].entity];
      if (st && st.state === 'on') return from[i].accent;
    }
    return null;
  }
};

// A BAND is a row that draws its own 1px divider at its top edge: a lamplight-row,
// a lamplight-light, a lamplight-chips strip and a lamplight-rooms row. The panel's stack gap
// used to sit below each band, under the content and above the next divider,
// so the content of every band but the last was 8px high: 10px above the tile
// and 18px below it. The household chose option B on 24 September 2026: two
// bands next to each other have no gap between them, and each band has half
// the gap more padding above and below its content. The gap between the
// eyebrow and the first band, and around any other child, does not change.
const LAMP_BAND_PAD = 4;

// The wait, in ms, from the last change in a panel's size to the canvas draw.
// See LampShell._resized.
const LAMP_REDRAW_WAIT = 150;

// Composite the padding-box layers of a wash on a canvas: decimals, one
// triangular dither (the same draw for R, G and B, so no colour speckle),
// round once. This is the fix in 10-wash.js's note on banding.
//
// `layers` holds the plain objects lampActivityLayers/lampAccentLayers
// return: cx, cy, rx, ry in the 0..1 fraction of the box, and stops as
// [colour, alpha, position]; or { solid: [r,g,b] } for the ground.
//
// `layers` is in CSS order: the top layer first, the ground last. The "over"
// step below needs the bottom layer first, so the list is reversed. In
// 0.17.4-dev it was not: the ground came last with alpha 1 and covered every
// layer, and the Waste card showed a flat ground. 26 September 2026.
// SPEED, 0.94.0-dev (12 November 2026). This painter gives the same bytes as
// the 0.93 one for the same noise: proved on 1,220 layer sets, 16.9 million
// pixels, with the live Lounge layers and random ones. It is 2.6 to 2.9 times
// faster: the stops are typed arrays, dx^2 is worked out once a column, the
// stop search starts from the last pixel's stop, and a row skips the pixels
// outside a layer's clear last stop. The noise is an xorshift, not
// Math.random; it has the same triangular spread.
function lampPaintCanvas(ctx, layers, w, h) {
  const im = ctx.createImageData(w, h);
  const d = im.data;
  // Bottom layer first. A solid layer covers all below it exactly, so start there.
  const all = layers.slice().reverse();
  let base = 0, gr = 0, gg = 0, gb = 0;
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].solid) {
      // 'ground' is the theme token, read from the canvas's own place in the page.
      const g = all[i].solid === 'ground' ? lampGroundRgb(ctx.canvas) : all[i].solid;
      base = i + 1; gr = g[0]; gg = g[1]; gb = g[2]; break;
    }
  }
  const P = [];
  for (let i = base; i < all.length; i++) {
    const l = all[i];
    if (l.solid) continue;                        // cannot happen after base
    const n = l.stops.length;
    const pos = new Float64Array(n), R = new Float64Array(n), G = new Float64Array(n),
      B = new Float64Array(n), A = new Float64Array(n);
    let clear = true;
    l.stops.forEach(function (s, j) {
      const c = s[0].split(',').map(Number), a = s[1];
      R[j] = c[0] * a; G[j] = c[1] * a; B[j] = c[2] * a; A[j] = a; pos[j] = s[2];
      if (a !== 0 || R[j] !== 0 || G[j] !== 0 || B[j] !== 0) clear = false;
    });
    if (clear) continue;                          // r * 1 + 0 is r
    const dR = new Float64Array(n), dG = new Float64Array(n), dB = new Float64Array(n),
      dA = new Float64Array(n), dP = new Float64Array(n);
    let sorted = true;
    for (let j = 1; j < n; j++) {
      dR[j] = R[j] - R[j - 1]; dG[j] = G[j] - G[j - 1]; dB[j] = B[j] - B[j - 1];
      dA[j] = A[j] - A[j - 1]; dP[j] = pos[j] - pos[j - 1];
      if (pos[j] < pos[j - 1]) sorted = false;
    }
    // cyPx and ryPx are in CSS px, not a fraction of the height (the edge source, 10-wash.js).
    const cx = l.cx * w, rx = l.rx * w,
      cy = l.cyPx !== undefined ? l.cyPx : l.cy * h,
      ry = l.ryPx !== undefined ? l.ryPx : l.ry * h;
    const dx2 = new Float64Array(w);
    for (let x = 0; x < w; x++) { const dx = (x + 0.5 - cx) / rx; dx2[x] = dx * dx; }
    // Outside the last stop the layer is the last stop. When that stop is clear
    // the layer changes nothing there, so a row skips the pixels it cannot reach.
    const last = n - 1, s2 = pos[last] * pos[last];
    // The old walk tests the first stop before the last, so this holds only
    // when the stops are in order and the first is before the last.
    const skip = sorted && pos[0] < pos[last] && A[last] === 0 && R[last] === 0 && G[last] === 0 && B[last] === 0 &&
      Math.abs(rx) < 1e5 && isFinite(s2);
    P.push({ n: n, pos: pos, R: R, G: G, B: B, A: A, dR: dR, dG: dG, dB: dB, dA: dA, dP: dP,
      sorted: sorted, cx: cx, cy: cy, rx: Math.abs(rx), ry: ry, dx2: dx2, dy2: 0, j: 1,
      skip: skip, s2: s2, lo: 0, hi: w });
  }
  const K = P.length;
  // Triangular noise, the same draw for R, G and B. An xorshift is about four
  // times cheaper than two Math.random calls a pixel and as good for a dither.
  let seed = (Math.random() * 4294967296) >>> 0 || 1;
  let o = 0;
  for (let y = 0; y < h; y++) {
    for (let k = 0; k < K; k++) {
      const q = P[k], dy = (y + 0.5 - q.cy) / q.ry;
      q.dy2 = dy * dy; q.j = 1;
      if (!q.skip) { q.lo = 0; q.hi = w; continue; }
      if (q.dy2 >= q.s2) { q.lo = q.hi = 0; continue; }   // sqrt(q) >= the last stop
      // 2px past the edge on each side: there t^2 is more than the last stop^2
      // by 4 / rx^2 or more, far above any rounding.
      const hw = q.rx * Math.sqrt(q.s2 - q.dy2);
      q.lo = Math.max(0, Math.floor(q.cx - hw - 0.5) - 2);
      q.hi = Math.min(w, Math.ceil(q.cx + hw - 0.5) + 3);
    }
    for (let x = 0; x < w; x++) {
      let r = gr, g = gg, b = gb;
      for (let k = 0; k < K; k++) {
        const q = P[k];
        if (x < q.lo || x >= q.hi) continue;
        const pos = q.pos, n = q.n;
        const t = Math.sqrt(q.dx2[x] + q.dy2);
        let sr, sg, sb, sa;
        if (t <= pos[0]) { sr = q.R[0]; sg = q.G[0]; sb = q.B[0]; sa = q.A[0]; }
        else if (t >= pos[n - 1]) { sr = q.R[n - 1]; sg = q.G[n - 1]; sb = q.B[n - 1]; sa = q.A[n - 1]; }
        else {
          // The first stop at or past t, as the old linear walk from 1 found it.
          // t moves a little from one pixel to the next, so walk from the last one.
          let j;
          if (q.sorted) {
            j = q.j;
            while (j > 1 && pos[j - 1] >= t) j--;
            while (pos[j] < t) j++;
            q.j = j;
          } else {
            j = 1;
            while (pos[j] < t) j++;
          }
          const u = (t - pos[j - 1]) / q.dP[j];
          sr = q.R[j - 1] + q.dR[j] * u; sg = q.G[j - 1] + q.dG[j] * u;
          sb = q.B[j - 1] + q.dB[j] * u; sa = q.A[j - 1] + q.dA[j] * u;
        }
        r = r * (1 - sa) + sr; g = g * (1 - sa) + sg; b = b * (1 - sa) + sb;
      }
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      const r1 = (seed >>> 0) / 4294967296;
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      const n0 = r1 - (seed >>> 0) / 4294967296;
      d[o] = r + n0; d[o + 1] = g + n0; d[o + 2] = b + n0; d[o + 3] = 255;
      o += 4;
    }
  }
  ctx.putImageData(im, 0, 0);
  return im;
}

class LampShell extends HTMLElement {

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    this._config = config;
    const style = lampOpt('shell', config, 'light_style');
    if (style !== 'activity' && style !== 'accent' && style !== 'off') {
      throw new Error("light_style must be 'activity', 'accent' or 'off'");
    }
    this._lightStyle = style;
    this._entities = config.entities || [];
    this._grain = lampOpt('shell', config, 'smooth_gradient') !== false;
    this._bg = null;
    this._readAccent(config.accent);
    this._setup(config);            // the card's own configuration
    this._render();
  }

  // Accept a colour or a rule. A card that overrides _accent() may omit both.
  _readAccent(a) {
    this._staticAccent = null;
    this._rule = null;
    if (a === undefined || a === null) return;
    if (typeof a === 'string') { this._staticAccent = lampColour(a, 'deep'); return; }
    if (typeof a === 'object' && a.pick) {
      if (!LAMP_PICKERS[a.pick]) throw new Error('unknown accent rule: ' + a.pick);
      if (!Array.isArray(a.from) || !a.from.length) {
        throw new Error('an accent rule needs a `from` list');
      }
      this._rule = {
        pick: a.pick,
        from: a.from.map(function (r) {
          if (!r.entity) throw new Error('every `from` entry needs an entity');
          return { entity: r.entity, accent: lampColour(r.accent, 'deep') };
        }),
        fallback: a.fallback ? lampColour(a.fallback, 'deep') : null
      };
      return;
    }
    throw new Error('accent must be a colour or a rule');
  }

  // Override this in a card that works its accent out from its own data.
  _accent() {
    if (this._rule) {
      const picked = LAMP_PICKERS[this._rule.pick](this._hass, this._rule.from);
      return picked || this._rule.fallback || this._rule.from[0].accent;
    }
    if (!this._staticAccent) throw new Error('accent is required');
    return this._staticAccent;
  }

  set hass(hass) {
    this._hass = hass;
    this._onHass(hass);
    this._paint();
  }

  disconnectedCallback() {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
    if (this._redraw) { clearTimeout(this._redraw); this._redraw = null; }
  }

  // Home Assistant takes a card out of the document and puts it back while it
  // renders a view. The first draw usually finds the card with no size, so the
  // ResizeObserver must run again here, or the canvas stays blank (0.17.4-dev:
  // every card except Waste).
  connectedCallback() {
    if (this._canvas && !this._ro) this._observeCanvas();
  }

  _observeCanvas() {
    const self = this;
    this._ro = new ResizeObserver(function () { self._resized(); });
    this._ro.observe(this._card);
  }

  // A panel that changes size draws its canvas again only when the size stops
  // changing. Before 0.93.0-dev each change drew it at once. A lamplight-scenes list
  // that opens changes the panel height on each frame, and one draw of a
  // 390 x 600 panel takes about 30 ms on a desktop and 125 ms on a phone. The
  // slide showed 4 frames in 0.35 s (measured 12 November 2026). The canvas is
  // stretched to the panel by CSS, so until the draw the old wash stretches
  // with it. The first draw at a size, and a draw for a new state, are not
  // delayed.
  //
  // From 0.95.0-dev a change after a quiet moment also draws at once. A
  // lamplight-scenes list now changes the panel size in one step and slides on the
  // GPU, and a draw 150 ms later landed in the middle of that slide. Only a
  // size that keeps changing waits. _drawCanvas keeps the last two washes it
  // drew, so a list that opens again draws nothing.
  _resized() {
    if (!this._canvas || !this._layers) return;
    const w = this._card.clientWidth, h = this._card.clientHeight;
    if (w === this._canvas.width && h === this._canvas.height) return;
    const now = Date.now(), quiet = !this._redraw && now - (this._sizedAt || 0) > LAMP_REDRAW_WAIT;
    this._sizedAt = now;
    if (quiet || !this._canvas.width || !this._canvas.height ||
        this._canvas.width === 300 && this._canvas.height === 150) {
      this._drawCanvas();            // never drawn: 300 x 150 is the canvas default
      return;
    }
    const self = this;
    if (this._redraw) clearTimeout(this._redraw);
    this._redraw = setTimeout(function () {
      self._redraw = null;
      self._drawCanvas();
    }, LAMP_REDRAW_WAIT);
  }

  // Hooks for the card. _setup runs once with the configuration, _onHass on
  // every state change, _build once when the shell is ready for content.
  //
  // The hook is _build and NOT _fill. `light_style` was `fill` until 22 Nov 2026, section 05's
  // word for the family a panel belongs to. A method with the name of the string that setConfig
  // keeps is shadowed by that string, and calling it throws "this._fill is not a function".
  // Found the hard way, 20 September 2026. The string is now this._lightStyle.
  _setup() {}
  _onHass() {}
  _build() {}

  getCardSize() { return 3; }

  // ---- the light ---------------------------------------------------------

  _metrics() {
    const c = this._config;
    const m = lampActivity(this._hass, this._entities);
    // `glow_strength`, `edge_strength` and `glow_position` replace the values that the rows give.
    return {
      a: c.glow_strength !== undefined ? c.glow_strength : m.a,
      b: c.edge_strength !== undefined ? c.edge_strength : m.b,
      py: c.glow_position !== undefined ? c.glow_position : m.py
    };
  }

  // The bounce alpha of an accent panel. `bounce_strength` in the configuration replaces it.
  _bounce() {
    if (this._config.bounce_strength !== undefined) return this._config.bounce_strength;
    return lampBounceAlpha(lampActivity(this._hass, this._entities).f);
  }

  _background() {
    if (this._lightStyle === 'off') {
      return 'linear-gradient(' + LAMP_GROUND + ', ' + LAMP_GROUND + ') padding-box,\n    ' +
        'linear-gradient(rgba(255,255,255,0.07), rgba(255,255,255,0.07)) border-box';
    }
    const H = this._accent(), m = this._metrics();
    if (this._lightStyle === 'accent') {
      const edge = this._config.light_from === 'top-edge';
      const fill = this._config.glow_strength !== undefined ? this._config.glow_strength
                 : (edge ? LAMP_EDGE_FILL : LAMP_DEFAULTS.shell.light.accent.glow_strength);
      // No entities means nothing to read, so the rim holds at the fill alpha
      // (at 0.30 for the edge source, whose fill is higher).
      const b = this._config.edge_strength !== undefined ? this._config.edge_strength
              : (this._entities.length ? m.b : (edge ? LAMP_EDGE_RIM : fill));
      return (edge ? lampEdgeWash : lampAccentWash)(H, fill, b, this._grain, this._bounce());
    }
    return lampActivityWash(H, m.a, m.b, m.py, this._grain, this._config.light_from === 'top-edge');
  }

  // The same wash as _background(), as layer data for lampPaintCanvas instead
  // of a CSS string. Override to return null in a card whose _background()
  // does not come from lampActivityWash/lampAccentWash (lamplight-weather). An accent
  // panel has the bounce layer here, with the same alpha as the CSS.
  _washLayers() {
    if (!this._grain) return null;     // smooth_gradient: false asks for no dither either
    if (this._lightStyle === 'off') return null;
    const H = this._accent(), m = this._metrics();
    if (this._lightStyle === 'accent') {
      const edge = this._config.light_from === 'top-edge';
      const fill = this._config.glow_strength !== undefined ? this._config.glow_strength
                 : (edge ? LAMP_EDGE_FILL : LAMP_DEFAULTS.shell.light.accent.glow_strength);
      return (edge ? lampEdgeLayers : lampAccentLayers)(H, fill, this._bounce());
    }
    return lampActivityLayers(H, m.a, m.b, m.py, this._config.light_from === 'top-edge');
  }

  _paint() {
    if (!this._card) return;
    let bg, layers;
    try {
      bg = this._background();
      layers = this._washLayers();
    } catch (e) {
      return;                          // no accent yet; paint on the next state
    }
    if (bg === this._bg) return;       // nothing moved, so write nothing
    this._bg = bg;
    this._layers = layers;
    const st = this._card.style;
    lampShellProps(bg, this._config.radius, this._config.shadow)
      .forEach(function (p) { st.setProperty(p[0], p[1], 'important'); });
    this._paintCanvas();
  }

  // The dithered canvas that sits over the CSS wash. The CSS stays, so
  // verify-wash.js still compares the same strings; the canvas paints over it
  // and removes the banding. z-index -1 puts it above ha-card's own
  // background and below the card's content (CSS paints an element's own
  // background before a negative-z-index child).
  _paintCanvas() {
    if (!this._layers) {
      if (this._canvas) {
        if (this._ro) { this._ro.disconnect(); this._ro = null; }
        this._canvas.remove();
        this._canvas = null;
      }
      return;
    }
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this._canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
        'z-index:-1;pointer-events:none;border-radius:inherit';
      this._card.style.setProperty('position', 'relative');
      this._card.style.setProperty('isolation', 'isolate');
      this._card.prepend(this._canvas);
    }
    if (!this._ro && this.isConnected) this._observeCanvas();
    this._drawCanvas();
  }

  _drawCanvas() {
    if (!this._canvas || !this._layers) return;
    const w = this._card.clientWidth, h = this._card.clientHeight;
    if (!w || !h) return;               // not yet in the layout
    if (this._canvas.width !== w) this._canvas.width = w;
    if (this._canvas.height !== h) this._canvas.height = h;
    const ctx = this._canvas.getContext('2d'), key = w + 'x' + h;
    // The last two washes, by size, for the layers they were drawn from. One
    // is 1.3 MB for a 390 x 839 panel.
    if (this._washFor !== this._layers) { this._washFor = this._layers; this._washes = []; }
    const i = this._washes.findIndex(function (e) { return e.key === key; });
    if (i >= 0) {
      const hit = this._washes.splice(i, 1)[0];
      this._washes.unshift(hit);
      ctx.putImageData(hit.im, 0, 0);
      return;
    }
    const im = lampPaintCanvas(ctx, this._layers, w, h);
    this._washes.unshift({ key: key, im: im });
    if (this._washes.length > 2) this._washes.length = 2;
  }

  // ---- the shell ---------------------------------------------------------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    // A second setConfig (the card editor's preview does it) draws a new ha-card. The old canvas,
    // its observer and its stored washes belong to the old card, so let them go: _paint() below
    // makes a new canvas in the new card. Until 0.146.0-dev the old canvas stayed in this._canvas,
    // out of the page, and the panel fell back to the PNG grain until a reload.
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
    if (this._redraw) { clearTimeout(this._redraw); this._redraw = null; }
    this._canvas = null;
    this._washes = [];
    this._washFor = null;
    this._card = document.createElement('ha-card');
    this._body = document.createElement('div');
    this._body.className = 'lamp-body';
    // Home Assistant's own vertical stack puts its children in a flex column
    // with a gap. A panel that does not do the same is 8px shorter for each
    // space between two children. Read the same two variables, so a theme that
    // changes stack spacing changes this too.
    // A custom element's shadow root does not inherit the typography a
    // button-card sets for itself. Left alone it takes line-height 16px and a
    // system font stack, which makes the eyebrow 41px instead of 38px and every
    // block of text taller than the card it replaces. Measured 20 September
    // 2026 against a button-card built with the same fields.
    this._card.style.setProperty('font-family',
      'var(--primary-font-family, Roboto, Noto, sans-serif)');
    this._card.style.setProperty('line-height', 'normal');
    this._body.style.display = 'flex';
    this._body.style.flexDirection = 'column';
    this._body.style.gap = this._config.gap ||
      'var(--vertical-stack-card-gap, var(--stack-card-gap, 8px))';
    this._card.appendChild(this._body);
    // A negative margin cancels the flex gap between two bands only. A card
    // marks itself a band with the data-lamp-band attribute.
    const bands = document.createElement('style');
    bands.textContent = '.lamp-body > [data-lamp-band] + [data-lamp-band]' +
      '{margin-top:calc(-1 * (' + this._body.style.gap + '))}';
    this.shadowRoot.appendChild(bands);
    this.shadowRoot.appendChild(this._card);
    this._paint();
    this._build();
  }

  // Ask Home Assistant to open the more-info dialog for an entity.
  _moreInfo(entityId) {
    const ev = new Event('hass-more-info', { bubbles: true, composed: true });
    ev.detail = { entityId: entityId };
    this.dispatchEvent(ev);
  }
}
