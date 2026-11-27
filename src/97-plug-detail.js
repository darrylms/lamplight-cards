// lamplight-plug-detail. The body of a smart-plug detail pop-up.
//
// WHAT THIS REPLACES
// The four plug detail pop-ups (Lounge Access Point, Lounge Christmas Lights, Modem, Games
// Room Access Point) each held three sibling cards: a button-card "now" tile (about 1,450
// characters each), a mini-graph-card with its own card_mod, and a statistics-graph with its
// own card_mod. Only the tile was template logic; the two graphs were already plain
// configuration. `lamplight-plug-detail` draws the tile itself and holds both graphs as optional
// child slots, the same way `lamplight-climate` holds its sparkline.
//
// THE SIGNAL SHEET (25 Sep 2026, design-docs/plug_popup_sheet_options.html, option 3)
// Until this date the body was three boxes: a tile with a glowing accent numeral, and the two
// graphs, each on its own panel. The graphs used 516px of 687px to draw signals that do not
// change: mini-graph-card scaled its axis from 10 to 11 W, so a 1 W wobble filled the full
// height, and the statistics-graph drew the energy counter's 0.1 kWh rounding as 0.2/0.3 bars.
// Now the body is a flat sheet on the pop-up ground, the same shell as #today and #batteries:
//   the glyph    the device's own drawing in the plug's accent. The body of the glyph says the
//                plug is on. The parts that light say it draws `active_watts` or more. All parts
//                light together: arcs that count up would read as Wi-Fi signal strength, and a
//                plug cannot measure that
//   the numeral  44px, weight 300, white. An "on" plug that reads 0 W shows "<1": the Innr
//                plugs report whole watts. Off, the numeral dims
//   the lead     one 15px sentence: the state in words (master design §10: the body says on or
//                off), then a comparison with the plug's own last seven days. It was two 12.5px
//                lines until 27 Sep 2026 (option 5 of design-docs/popup_sheets_rework_options.html:
//                one type scale and a lead sentence on every sheet)
//   Record       Today so far, Last 7 days and Since fitted. The first two are read from the
//                power statistics' mean, not from the energy counter, so the rounding does
//                not reach them
// The household left both graph slots empty. The slots stay for another household; a slot
// that is configured draws below the sheet, flat, with no panel.
//
// THE ACCESS POINT IS ALWAYS FULL (27 Sep 2026). The household saw the Lounge Access Point's arcs
// dim: that plug reads under 1 W all week, so its parts never reached `active_watts`. Dim arcs over
// a lit dot read as a weak Wi-Fi signal. The access-point glyph now lights its arcs whenever the
// switch is on. The words under the numeral still compare the watts.
//
// THE GLYPH MAY LIVE IN THE HEADER (27 Sep 2026, option 7 of design-docs/
// popup_sheets_rework_options.html). With `icon_in_header`, the body draws no glyph and the numeral
// starts at the left edge, as on every other sheet. The card still works out the glyph state and
// sends it up as a `lamp-glyph-state` event, so the lamplight-popup header lights the device's parts.
//
// THE HEADER'S PLUG (8 Nov 2026, option 4 of design-docs/plug_hero_options.html). The card also sends
// the hero state (`hero` in the event): off, idle, active or gone. Rule B: a plug that is on but under
// `active_watts` is idle only when its seven-day mean is `active_watts` or more, that is, when its device is
// not drawing as it usually does. A device that is meant to sip under 1 W (the Lounge access point,
// 0.54 W) is active, and so is a string of lights that reads 0 or 1 W. Until the week's statistics
// come, a plug that is on is active.
//
// MOTION explains a change only. When the glyph goes from "on" to "drawing" while the card is
// connected, its parts light in turn, 0.18 s apart, and the access point sends one ring out
// from its dot. Drawing to on: the parts go dark together in 0.35 s. On and off: the body fills
// or empties in 0.35 s. The first draw has no motion. prefers-reduced-motion stops all of it.
//
// Configuration:
//   entity          the switch. Required
//   power_sensor    optional. A power reading in watts. Omitted, the numeral reads "--", the
//                   glyph's parts follow the switch, and the card draws no comparison
//   energy_sensor   optional. A cumulative energy reading in kWh, for "Since fitted"
//   accent          the plug's colour, as an "r,g,b" triple. Default 90,150,245. Pass the
//                   plug row's own accent
//   device_icon     access-point | modem | string-lights | plug. Default plug
//   active_watts    the watts at which the glyph's parts light. Default 1
//   icon_in_header  true: draw no glyph here, and send its state to the lamplight-popup header
//   usual_tolerance how far from the seven-day mean still reads "about its usual", as a
//                   fraction. Default 0.2
//   power_graph     optional card configuration for a slot below the sheet
//   usage_graph     optional card configuration for a slot below the sheet

const LAMP_PLUG_ACCENT = LAMP_PALETTE.cornflower.soft;
const LAMP_PLUG_OFF = 'rgba(255,255,255,0.35)';
const LAMP_PLUG_DIM = 'rgba(255,255,255,0.12)';
const LAMP_PLUG_GONE = 'rgba(255,255,255,0.05)';
const LAMP_PLUG_STATS_MS = 5 * 60 * 1000;

// The glyph drawings, in a 96 x 80 box. `body` is the part that says "on"; `parts` light at
// active_watts. `paint` names the attribute the colour goes on. `full` lights the parts whenever the
// switch is on.
const LAMP_PLUG_GLYPHS = {
  'access-point': {
    full: true,
    body: [{ tag: 'circle', a: { cx: 48, cy: 66, r: 6.5 }, paint: 'dot' }],
    parts: [
      { tag: 'path', a: { d: 'M36.7 54.7A16 16 0 0 1 59.3 54.7', 'stroke-width': 3.4, 'stroke-linecap': 'round', fill: 'none' }, paint: 'stroke' },
      { tag: 'path', a: { d: 'M26.8 44.8A30 30 0 0 1 69.2 44.8', 'stroke-width': 3.4, 'stroke-linecap': 'round', fill: 'none' }, paint: 'stroke' },
      { tag: 'path', a: { d: 'M16.9 34.9A44 44 0 0 1 79.1 34.9', 'stroke-width': 3.4, 'stroke-linecap': 'round', fill: 'none' }, paint: 'stroke' }
    ],
    ring: { cx: 48, cy: 66 }
  },
  'modem': {
    body: [
      { tag: 'rect', a: { x: 16, y: 36, width: 64, height: 30, rx: 8, 'stroke-width': 2.5, fill: 'none' }, paint: 'stroke' },
      { tag: 'path', a: { d: 'M32 36V22M64 36V22', 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none' }, paint: 'stroke' }
    ],
    parts: [34, 48, 62].map(function (x) {
      return { tag: 'circle', a: { cx: x, cy: 51, r: 4.2 }, paint: 'fill' };
    })
  },
  'string-lights': {
    body: [{ tag: 'path', a: { d: 'M6 22Q48 58 90 22', 'stroke-width': 2.2, fill: 'none' }, paint: 'stroke' }],
    parts: [[14.4, 38.5], [31.2, 47.1], [48, 50], [64.8, 47.1], [81.6, 38.5]].map(function (p) {
      return { tag: 'ellipse', a: { cx: p[0], cy: p[1], rx: 5, ry: 7 }, paint: 'fill' };
    })
  },
  'plug': {
    body: [{ tag: 'circle', a: { cx: 48, cy: 44, r: 27, 'stroke-width': 3, fill: 'none' }, paint: 'stroke' }],
    parts: [37, 54].map(function (x) {
      return { tag: 'rect', a: { x: x, y: 34, width: 5, height: 16, rx: 2 }, paint: 'fill' };
    })
  }
};

const LAMP_PLUG_CSS = '<style>' +
  '.ps{font-family:var(--primary-font-family, Roboto, Noto, sans-serif);color:#fff;line-height:1.25}' +
  '.ps-sig{display:flex;align-items:center;gap:16px;padding:2px 2px 0}' +
  '.ps-sig svg{flex:none;overflow:visible}' +
  '.ps-big{font-size:var(--lamplight-t-display);font-weight:300;letter-spacing:-.02em;line-height:1;color:var(--lamplight-ink-strong);font-variant-numeric:tabular-nums;transition:opacity .35s}' +
  '.ps-big small{font-size:var(--lamplight-t-name);font-weight:400;letter-spacing:0;color:var(--lamplight-ink-soft);margin-left:7px}' +
  '.ps-big.off{opacity:.45}' +
  '.ps-st{font-size:var(--lamplight-t-name);color:var(--lamplight-ink-mid);margin-top:12px;line-height:1.5}' +
  '.ps-st b{color:var(--lamplight-ink-strong);font-weight:500}' +
  '.ps-eb{display:flex;align-items:baseline;padding:26px 2px 10px;line-height:1;font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--lamplight-ink-quiet)}' +
  '.ps-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:0 2px;min-height:44px;font-size:var(--lamplight-t-body);color:var(--lamplight-ink-mid);border-top:1px solid rgba(255,255,255,.06)}' +
  '.ps-eb + .ps-row{border-top:0}' +
  '.ps-row .vv{text-align:right;font-variant-numeric:tabular-nums;font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.ps-row .vv b{font-weight:400;font-size:var(--lamplight-t-caption);color:var(--lamplight-ink-quiet);margin-left:2px}' +
  '.pg-p{transition:fill .35s,stroke .35s}' +
  '@keyframes pgLit{0%{opacity:.15}60%{opacity:1}100%{opacity:1}}' +
  '@keyframes pgRing{0%{opacity:0;transform:scale(.5)}35%{opacity:.6}100%{opacity:0;transform:scale(1.6)}}' +
  '.pg-ring{opacity:0;transform-box:view-box}' +
  'svg.go .pg-part{animation:pgLit .7s ease-out both}' +
  'svg.go .pg-ring{animation:pgRing 1.1s ease-out .5s both}' +
  '@media (prefers-reduced-motion:reduce){.pg-p,.ps-big{transition:none}svg.go .pg-part,svg.go .pg-ring{animation:none}}' +
  '</style>';

const LAMP_SVG_NS = 'http://www.w3.org/2000/svg';

function lampPlugKwh(v) {
  if (v === null || v === undefined) return null;
  return v === 0 ? '0' : v.toFixed(2);
}

function lampPlugHM(d) {
  return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
}

function lampPlugWatts(w) {
  return Math.abs(w % 1) < 0.05 ? w.toFixed(0) : w.toFixed(1);
}

// Reduce the two statistics reads to what the card says. `today` is 5-minute rows since
// midnight; `days` is day rows for the seven whole days before today. Each row carries
// mean, min and max in watts.
function lampPlugStats(today, days) {
  const t = (today || []).filter(function (r) { return r.mean !== null && r.mean !== undefined; });
  const d = (days || []).filter(function (r) { return r.mean !== null && r.mean !== undefined; });
  const out = { todayKwh: null, weekKwh: null, weekMean: null, todayMin: null, todayMax: null,
    weekFlat: null, daysDrawing: null, dayCount: d.length, last: null };
  if (t.length) {
    out.todayKwh = t.reduce(function (s, r) { return s + r.mean; }, 0) * (5 / 60) / 1000;
    out.todayMin = Math.min.apply(null, t.map(function (r) { return r.min; }));
    out.todayMax = Math.max.apply(null, t.map(function (r) { return r.max; }));
    const lr = t[t.length - 1];
    out.last = { w: lr.mean, at: new Date(lr.end || (lr.start + 300000)) };
  }
  if (d.length) {
    out.weekKwh = d.reduce(function (s, r) { return s + r.mean; }, 0) * 24 / 1000;
    out.weekMean = d.reduce(function (s, r) { return s + r.mean; }, 0) / d.length;
    const lo = Math.min.apply(null, d.map(function (r) { return r.min; }));
    const hi = Math.max.apply(null, d.map(function (r) { return r.max; }));
    out.weekFlat = lo === hi ? lo : null;
  }
  return out;
}

// What the card says for one state. `sw` is the switch state string; `w` the power reading or
// null; `s` the result of lampPlugStats or null; `c` the thresholds. Returns the glyph state
// (off | on | draw | gone), the numeral and the lead: `l1` is its bold answer, `l2` the rest.
function lampPlugPhrase(sw, w, s, c, hasPower) {
  const r = { g: 'off', big: '--', dim: false, l1: '', l2: '' };
  if (sw === undefined || sw === 'unavailable' || sw === 'unknown') {
    r.g = 'gone';
    r.l1 = '<b>No answer.</b>';
    if (s && s.last) r.l2 = 'The last reading was ' + lampPlugWatts(s.last.w) + ' W, at ' + lampPlugHM(s.last.at) + '.';
    return r;
  }
  const on = sw === 'on';
  if (w !== null) r.big = (on && w === 0) ? '&lt;1' : lampPlugWatts(w);
  if (!on) {
    r.g = 'off';
    r.dim = true;
    r.l1 = '<b>Off.</b>';
    if (s && s.dayCount) {
      const n = s.daysDrawing;
      if (n) r.l2 = 'It was on ' + n + ' of the last ' + s.dayCount + ' days.';
      else r.l1 = '<b>Off all week.</b>';
    }
    return r;
  }
  // No power sensor: the parts follow the switch, and there is nothing to compare.
  if (!hasPower || w === null) {
    r.g = hasPower ? 'on' : 'draw';
    r.l1 = '<b>On.</b>';
    return r;
  }
  const mean = s ? s.weekMean : null;
  const usual = mean === null ? null : (mean < c.active_watts ? 'under ' + c.active_watts + ' W' : Math.round(mean) + ' W');
  if (w < c.active_watts) {
    r.g = 'on';
    r.l1 = '<b>On,</b> under ' + c.active_watts + ' W';
    if (mean === null) r.l1 += '.';
    else r.l2 = mean < c.active_watts ? ', as it was all week.' : '. Usually ' + usual + '.';
    return r;
  }
  r.g = 'draw';
  if (mean === null || mean < c.active_watts) {
    r.l1 = '<b>On and drawing.</b>';
    if (mean !== null) r.l2 = 'Usually under ' + c.active_watts + ' W.';
    return r;
  }
  const band = c.usual_tolerance * mean;
  if (Math.abs(w - mean) <= band) {
    r.l1 = '<b>On, about its usual.</b>';
    const lo = Math.min(s.todayMin === null ? w : s.todayMin, w);
    const hi = Math.max(s.todayMax === null ? w : s.todayMax, w);
    if (lo === hi && s.weekFlat === lo) r.l2 = lampPlugWatts(lo) + ' W all week.';
    else if (lo === hi) r.l2 = lampPlugWatts(lo) + ' W all day.';
    else r.l2 = lampPlugWatts(lo) + ' – ' + lampPlugWatts(hi) + ' W today.';
  } else {
    r.l1 = '<b>On, ' + (w > mean ? 'above' : 'below') + ' its usual.</b>';
    r.l2 = 'Usually ' + usual + '.';
  }
  return r;
}

// The header's plug state, from the glyph state (off | on | draw | gone) by Rule B (see above).
function lampPlugHeroState(g, s, c) {
  if (g === 'gone' || g === 'off') return g;
  if (g === 'draw') return 'active';
  const mean = s ? s.weekMean : null;
  return mean !== null && mean !== undefined && mean >= c.active_watts ? 'idle' : 'active';
}

class LampPlugDetail extends HTMLElement {

  static getStubConfig() {
    return { entity: '' };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (!config.entity) throw new Error('lamplight-plug-detail needs an `entity`');
    this._config = config;
    this._entity = config.entity;
    this._power = config.power_sensor || null;
    this._energy = config.energy_sensor || null;
    this._accent = lampColour(config.accent || LAMP_PLUG_ACCENT, 'deep');
    this._glyphType = LAMP_PLUG_GLYPHS[config.device_icon] ? config.device_icon : lampDefault('plug-detail', 'device_icon');
    this._inHeader = config.icon_in_header === true;
    this._c = {
      active_watts: typeof config.active_watts === 'number' ? config.active_watts : lampDefault('plug-detail', 'active_watts'),
      usual_tolerance: typeof config.usual_tolerance === 'number' ? config.usual_tolerance : lampDefault('plug-detail', 'usual_tolerance')
    };
    this._key = null;
    this._stats = null;
    this._gstate = null;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._powerChild) this._powerChild.hass = hass;
    if (this._usageChild) this._usageChild.hass = hass;
    if (first) this._startStats();
    this._update();
  }

  connectedCallback() {
    if (this._hass) this._startStats();
    this._sendGlyph();
  }
  disconnectedCallback() { this._stopStats(); }

  getCardSize() {
    return 3 + (this._config.power_graph ? 1 : 0) + (this._config.usage_graph ? 1 : 0);
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    this.style.display = 'block';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px';

    // The same flat shell as lamplight-day and lamplight-batteries: the sheet sits on the pop-up ground.
    const card = document.createElement('ha-card');
    this._card = card;
    [['background', 'transparent'], ['border', 'none'], ['border-radius', '0'],
     ['box-shadow', 'none'], ['backdrop-filter', 'none'], ['-webkit-backdrop-filter', 'none']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    card.style.padding = '2px 2px 8px';
    card.style.boxSizing = 'border-box';
    card.style.display = 'block';
    card.style.textAlign = 'left';

    const sheet = document.createElement('div');
    sheet.className = 'ps';
    sheet.innerHTML = LAMP_PLUG_CSS;
    const sig = document.createElement('div');
    sig.className = 'ps-sig';
    this._svg = this._buildGlyph();
    if (!this._inHeader) sig.appendChild(this._svg);
    const words = document.createElement('div');
    this._bigEl = document.createElement('div');
    this._bigEl.className = 'ps-big';
    this._stEl = document.createElement('div');
    this._stEl.className = 'ps-st';
    words.appendChild(this._bigEl);
    words.appendChild(this._stEl);
    sig.appendChild(words);
    sheet.appendChild(sig);
    this._recEl = document.createElement('div');
    sheet.appendChild(this._recEl);
    // _body stays the name of the text the card writes, for the tests.
    this._body = sheet;
    card.appendChild(sheet);
    wrap.appendChild(card);

    if (this._config.power_graph) {
      this._powerSlot = document.createElement('div');
      wrap.appendChild(this._powerSlot);
    }
    if (this._config.usage_graph) {
      this._usageSlot = document.createElement('div');
      wrap.appendChild(this._usageSlot);
    }

    this.shadowRoot.appendChild(wrap);
    this._buildChildren();
  }

  _buildGlyph() {
    const g = LAMP_PLUG_GLYPHS[this._glyphType];
    const svg = document.createElementNS(LAMP_SVG_NS, 'svg');
    svg.setAttribute('width', '104');
    svg.setAttribute('height', '86');
    svg.setAttribute('viewBox', '0 0 96 80');
    svg.setAttribute('aria-hidden', 'true');
    const make = function (spec, cls) {
      const el = document.createElementNS(LAMP_SVG_NS, spec.tag);
      Object.keys(spec.a).forEach(function (k) { el.setAttribute(k, spec.a[k]); });
      el.setAttribute('class', cls);
      el._paint = spec.paint;
      svg.appendChild(el);
      return el;
    };
    this._gBody = g.body.map(function (s) { return make(s, 'pg-p'); });
    this._gParts = g.parts.map(function (s, i) {
      const el = make(s, 'pg-p pg-part');
      el.style.animationDelay = (i * 0.18) + 's';
      return el;
    });
    this._gRing = null;
    if (g.ring) {
      const ring = document.createElementNS(LAMP_SVG_NS, 'circle');
      ring.setAttribute('cx', g.ring.cx);
      ring.setAttribute('cy', g.ring.cy);
      ring.setAttribute('r', '40');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke-width', '1.5');
      ring.setAttribute('class', 'pg-ring');
      ring.style.transformOrigin = g.ring.cx + 'px ' + g.ring.cy + 'px';
      svg.appendChild(ring);
      this._gRing = ring;
    }
    return svg;
  }

  // Colour the glyph for one state, in place, so the CSS transitions run between states.
  _paintGlyph(state) {
    const A = 'rgb(' + this._accent + ')';
    const on = state === 'on' || state === 'draw';
    const gone = state === 'gone';
    this._gBody.forEach(function (el) {
      if (el._paint === 'dot') {
        el.setAttribute('fill', on ? A : 'rgba(255,255,255,0)');
        el.setAttribute('stroke', on ? A : LAMP_PLUG_OFF);
        el.setAttribute('stroke-width', on ? '0' : '3');
        el.setAttribute('r', on ? '6.5' : '6');
      } else {
        el.setAttribute('stroke', on ? A : LAMP_PLUG_OFF);
      }
      if (gone) el.setAttribute('stroke-dasharray', '4 4');
      else el.removeAttribute('stroke-dasharray');
    });
    const full = LAMP_PLUG_GLYPHS[this._glyphType].full;
    const lit = state === 'draw' || (full && state === 'on');
    const pc = lit ? A : gone ? LAMP_PLUG_GONE : LAMP_PLUG_DIM;
    this._gParts.forEach(function (el) { el.setAttribute(el._paint, pc); });
    if (this._gRing) this._gRing.setAttribute('stroke', A);

    // Motion only for a change into "drawing" after the first draw. A full glyph is already lit
    // at "on", so only a change from off or gone moves it.
    const was = this._gstate;
    this._gstate = state;
    this._sendGlyph();
    const from = full ? (was === 'off' || was === 'gone') : (was !== null && was !== 'draw');
    if (from && state === 'draw') {
      const svg = this._svg;
      svg.classList.remove('go');
      void svg.getBoundingClientRect();
      svg.classList.add('go');
      clearTimeout(this._goTimer);
      this._goTimer = setTimeout(function () { svg.classList.remove('go'); }, 1800);
    }
  }

  // Tell a lamplight-popup header the glyph state. Sent again on connect, because the first paint can
  // happen before the card is in the page.
  _sendGlyph() {
    if (!this._inHeader || !this._gstate) return;
    this.dispatchEvent(new CustomEvent('lamp-glyph-state', { bubbles: true, composed: true,
      detail: { state: this._gstate, full: !!LAMP_PLUG_GLYPHS[this._glyphType].full, hero: this._heroState || null } }));
  }

  async _buildChildren() {
    if (!this._powerSlot && !this._usageSlot) return;
    await window.loadCardHelpers();
    if (this._powerSlot) {
      const el = document.createElement('hui-card');
      if (this._hass) el.hass = this._hass;
      el.config = this._config.power_graph;
      this._powerSlot.appendChild(el);
      this._powerChild = el;
      this._flattenChild(el);
    }
    if (this._usageSlot) {
      const el = document.createElement('hui-card');
      if (this._hass) el.hass = this._hass;
      el.config = this._config.usage_graph;
      this._usageSlot.appendChild(el);
      this._usageChild = el;
      this._flattenChild(el);
    }
  }

  // Take the graph's own card out of the picture, so a configured slot sits on the pop-up
  // ground like the sheet above it.
  _flattenChild(huiCard) {
    const apply = () => {
      const el = huiCard.firstElementChild || huiCard;
      const sr = el.shadowRoot;
      if (!sr) return false;
      if (sr.querySelector('style[data-lamp]')) return true;
      const s = document.createElement('style');
      s.setAttribute('data-lamp', '');
      s.textContent = 'ha-card, .card-content > ha-card {' +
        'background: transparent !important; border: none !important;' +
        'border-radius: 0 !important; box-shadow: none !important;' +
        'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }';
      sr.appendChild(s);
      return true;
    };
    if (apply()) return;
    let n = 0;
    const t = setInterval(() => { if (apply() || ++n > 50) clearInterval(t); }, 40);
  }

  _startStats() {
    if (!this._power || this._statsTimer || !this.isConnected) return;
    const self = this;
    this._fetchStats();
    this._statsTimer = setInterval(function () { self._fetchStats(); }, LAMP_PLUG_STATS_MS);
  }

  _stopStats() {
    clearInterval(this._statsTimer);
    this._statsTimer = null;
  }

  // Two reads from the recorder: 5-minute rows since midnight, and day rows for the seven
  // whole days before today. A failed read keeps the last result; the next tick tries again.
  async _fetchStats() {
    if (!this._hass || !this._power) return;
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const weekStart = new Date(midnight.getTime() - 7 * 86400000);
    const call = (start, end, period) => this._hass.connection.sendMessagePromise({
      type: 'recorder/statistics_during_period', start_time: start.toISOString(),
      end_time: end ? end.toISOString() : undefined, statistic_ids: [this._power],
      period: period, types: ['mean', 'min', 'max']
    });
    try {
      const a = await call(midnight, null, '5minute');
      const b = await call(weekStart, midnight, 'day');
      // The recorder also returns the day that starts at end_time - today. Drop it.
      const days = (b[this._power] || []).filter((r) => r.start < midnight.getTime());
      const s = lampPlugStats(a[this._power] || [], days);
      s.daysDrawing = days.filter((r) => r.max !== null && r.max >= this._c.active_watts).length;
      this._stats = s;
      this._key = null;
      this._update();
    } catch (e) {
      // Keep the last good statistics.
    }
  }

  _number(id) {
    if (!id) return null;
    const s = this._hass.states[id];
    const v = s ? parseFloat(s.state) : NaN;
    return isNaN(v) ? null : v;
  }

  _stateKey() {
    const e = this._hass.states[this._entity];
    const p = this._power ? this._hass.states[this._power] : null;
    const k = this._energy ? this._hass.states[this._energy] : null;
    return (e ? e.state : '-') + '|' + (p ? p.state : '-') + '|' + (k ? k.state : '-');
  }

  _update() {
    if (!this._hass || !this._body) return;
    const key = this._stateKey();
    if (key === this._key) return;
    this._key = key;
    const st = this._hass.states[this._entity];
    const w = this._number(this._power);
    const s = this._stats;
    const p = lampPlugPhrase(st ? st.state : undefined, w, s, this._c, !!this._power);

    this._heroState = lampPlugHeroState(p.g, s, this._c);
    this._paintGlyph(p.g);
    this._bigEl.innerHTML = p.big + '<small>W</small>';
    this._bigEl.classList.toggle('off', p.dim);
    // One sentence. A tail that starts with its own punctuation (", as it was all week." or
    // ". Usually 5 W.") joins with no space; any other tail follows a space.
    this._stEl.innerHTML = p.l1 + (p.l2 ? (/^[.,]/.test(p.l2) ? '' : ' ') + p.l2 : '');

    const rows = [];
    if (s && s.todayKwh !== null) rows.push(['Today, so far', lampPlugKwh(s.todayKwh)]);
    if (s && s.weekKwh !== null) rows.push(['Last 7 days', lampPlugKwh(s.weekKwh)]);
    const k = this._energy ? this._hass.states[this._energy] : null;
    if (k && !isNaN(parseFloat(k.state))) rows.push(['Since fitted', String(parseFloat(k.state))]);
    this._recEl.innerHTML = rows.length
      ? "<div class='ps-eb'>Record</div>" + rows.map(function (r) {
        return "<div class='ps-row'><span>" + r[0] + "</span><span class='vv'>" + r[1] + '<b>kWh</b></span></div>';
      }).join('')
      : '';
  }
}

customElements.define('lamplight-plug-detail', LampPlugDetail);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-plug-detail',
  name: 'Lamplight Plug Detail',
  description: 'A smart-plug pop-up body: the device glyph lit by state, live wattage against its own week, and a record of use.',
  preview: false
});
