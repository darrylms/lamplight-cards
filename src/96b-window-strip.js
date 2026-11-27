// lamplight-window-strip. The small panel on Overview beside lamplight-battery-strip (LampFootPanel,
// src/21-strip.js): an eyebrow, the count as the figure ("2 open", or "6 closed"), and one
// line of words that names what is open, by a ladder that never wraps (lampFitText).
// The light is slate while every window is closed and sky when one opens. A drawn window sits in
// the top right corner and the light is centred on its glass (LampFootPanel, src/21-strip.js). The
// window is shut, or one sash stands open. The strength is 0.25 when all are closed and
// 0.6 + 0.4 x n / total when n are open.
//
// Option 4 of design-docs/footer_refresh_options.html, 25 November 2026 (0.152.0-dev), drew the
// window; option 1 "Lamplight" of design-docs/overview_footer_rework_options.html (7 October 2026)
// had a glass lamp there. Option 8
// (design-docs/overview_batteries_windows_options.html, 1 October 2026) made the card a panel.
// From 29 Sep to 1 Oct 2026 it was an 84px LampStrip tile with a mark for each window (option 13).
//
// PORTABILITY. The card holds no household entity ID. Configuration:
//   rooms        [{ name, windows: [{ entity, name }] }], in the order the text ladder
//                uses. `name` on a window defaults to its own `friendly_name`.
//   tap_action   default { action: navigate, navigation_path: '#windows' }, so a stranger's
//                config works once that pop-up exists. The household's own config sets
//                { action: none }: there is no #windows pop-up yet.
//
// THE WARNING PILL (10 Oct 2026, options 10 + 13 + 18 of design-docs/windows_panel_warning_options.html)
// With a `weather` key, the panel shows a small disc beside the figure, while the
// #windows pop-up shows its weather band. It is the same test: lampWinLook(), lampWinWarning() and
// lampWinBand() in src/98-windows-detail.js, called only while a window is open. The pill shows the
// band's glyph and its hour ("Now", "15:00"), or "Warning". It is flat, like the Waste pills: a 13%
// fill, a 30% border and pale text. Since 0.152.0-dev the window drawing takes the right of the
// figure row, so the pill is always the 22px disc with the glyph only, 8px after the figure (option 4
// of design-docs/footer_refresh_options.html). It is not a tap target. Without `weather`, there is
// no pill.
//   weather, warning_sensor, warning_count_sensor   the same entities as the #windows pop-up (house mode)
//   outlook_hours (6), cold_below (12), rain_above (40)   the same thresholds as the pop-up
//
// THE TODAY LINE (from 31 October 2026, option 2 "Today" of design-docs/windows_panel_line_options.html,
// critique F16). While every window is closed, the line says what the day has done: "None opened today",
// or "since 14:20" after the last window closed today. Until then it said "Every window", which only
// repeated the figure. It is the #windows sheet's lead, cut to the panel, from the same recorder read and
// the same functions (lampWinIntervals, lampWinClip, lampWinUnionMs, lampWinLastClose in
// src/98-windows-detail.js), so the panel and the sheet agree. `unavailable` is not open: a restart that
// drops every contact does not read as an opening. The read runs at load, when a contact changes (and
// again 6 s later, for the recorder's commit), at midnight, and every LAMP_WIN_HISTORY_MS. Until the
// first read answers, the line is empty. "All closed since 14:20" does not fit: 121 of 140px, 13.6%
// spare, and the phone needs 15%.
//
// A contact is open when its state is 'on', closed for 'off'. A single contact that is
// `unavailable` or `unknown` counts as closed. "No readings" is reserved for every contact
// being `unavailable` or `unknown` at once.

const LAMP_WIN_SKY = LAMP_MEANINGS.window.open;

// THE WINDOW GAUGE (option 4 of design-docs/footer_refresh_options.html, 25 Nov 2026, 0.152.0-dev).
// A two-casement window, 46 x 50 units with its sill (shown at 75%, LAMP_GAUGE_SCALE in src/21-strip.js), drawn as the household's reference pictures draw
// one. Each frame part is a small bar with a lit top-left edge, a shaded face and a dark bottom-right
// edge: the outer frame, the sash frame, the centre bar and the sill. A dark gap lies between the
// outer frame and the sash frame. The glass is dark, and one wide diagonal sheen with a crisp lower
// edge crosses both panes. The window and the sill cast soft shadows.
// Open: the right sash turns out on its hinge at the right side of the frame, as the household's
// windows do. It lies beyond the wall, so it is seen through the opening, narrow and a little
// smaller at its free edge (the rule of the room window heroes, src/93-popup-glyphs.js). The rest
// of the opening is the sky, darker under the head of the frame. The window takes a trace of the
// accent: slate when shut, sky when open.
// `id` makes the svg ids unique, `rgb` is the accent, `open` true when any window is open.
function lampWinGauge(id, rgb, open) {
  const r2 = function (v) { return Math.round(v * 100) / 100; };
  const metal = lampMix('224,229,236', rgb, open ? 0.20 : 0.08);
  const hi = lampMix(metal, '255,255,255', 0.75), lo = lampMix(metal, '0,0,0', 0.42);
  const glass = open ? lampMix('12,22,31', rgb, 0.20) : lampMix('15,18,26', rgb, 0.08);
  const ghi = lampMix(glass, '255,255,255', 0.085), gedge = lampMix(glass, '255,255,255', 0.17);
  const M = 'url(#' + id + 'm)';
  // A rectangular bar frame of thickness t, shaded as a lit profile.
  function ring(x0, y0, x1, y1, t) {
    return '<path d="M' + x0 + ' ' + y0 + 'H' + x1 + 'V' + y1 + 'H' + x0 + 'Z M' + r2(x0 + t) + ' ' + r2(y0 + t) +
      'V' + r2(y1 - t) + 'H' + r2(x1 - t) + 'V' + r2(y0 + t) + 'Z" fill="' + M + '" fill-rule="evenodd"/>' +
      '<path d="M' + r2(x0 + 0.18) + ' ' + r2(y1 - 0.2) + 'V' + r2(y0 + 0.18) + 'H' + r2(x1 - 0.2) +
      '" fill="none" stroke="rgb(' + hi + ')" stroke-opacity=".95" stroke-width=".36"/>' +
      '<path d="M' + r2(x1 - 0.16) + ' ' + r2(y0 + 0.3) + 'V' + r2(y1 - 0.16) + 'H' + r2(x0 + 0.3) +
      '" fill="none" stroke="rgb(' + lo + ')" stroke-width=".32"/>' +
      '<path d="M' + r2(x0 + t) + ' ' + r2(y1 - t) + 'V' + r2(y0 + t) + 'H' + r2(x1 - t) +
      '" fill="none" stroke="#000" stroke-opacity=".55" stroke-width=".34"/>' +
      '<path d="M' + r2(x1 - t) + ' ' + r2(y0 + t + 0.2) + 'V' + r2(y1 - t) + 'H' + r2(x0 + t + 0.2) +
      '" fill="none" stroke="rgb(' + hi + ')" stroke-opacity=".40" stroke-width=".28"/>';
  }
  const defs = '<defs>' +
    '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgb(' + hi + ')"/>' +
    '<stop offset=".45" stop-color="rgb(' + metal + ')"/><stop offset="1" stop-color="rgb(' + lampMix(metal, lo, 0.55) + ')"/></linearGradient>' +
    '<linearGradient id="' + id + 'v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgb(' + hi + ')"/>' +
    '<stop offset=".5" stop-color="rgb(' + metal + ')"/><stop offset="1" stop-color="rgb(' + lampMix(metal, lo, 0.6) + ')"/></linearGradient>' +
    '<linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(' + hi + ')"/>' +
    '<stop offset=".5" stop-color="rgb(' + metal + ')"/><stop offset="1" stop-color="rgb(' + lo + ')"/></linearGradient>' +
    // The sheen. The gradient is in the drawing's own px, so the two panes share one sheen.
    '<linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="40" y1="41" x2="6" y2="5">' +
    '<stop offset="0" stop-color="rgb(' + lampMix(glass, '0,0,0', 0.25) + ')"/><stop offset=".47" stop-color="rgb(' + glass + ')"/>' +
    '<stop offset=".475" stop-color="rgb(' + gedge + ')"/><stop offset=".56" stop-color="rgb(' + ghi + ')"/>' +
    '<stop offset="1" stop-color="rgb(' + lampMix(ghi, glass, 0.4) + ')"/></linearGradient>' +
    '<linearGradient id="' + id + 'k" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="rgb(' + lampMix(rgb, '255,255,255', 0.05) + ')" stop-opacity=".78"/>' +
    '<stop offset="1" stop-color="rgb(' + lampMix(rgb, '255,255,255', 0.32) + ')" stop-opacity=".95"/></linearGradient>' +
    '<linearGradient id="' + id + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".40"/>' +
    '<stop offset=".16" stop-color="#000" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="' + id + 'o"><rect x="23.7" y="2.6" width="18.7" height="40.8"/></clipPath></defs>';
  let body = '<rect x="3.6" y="2.6" width="38.8" height="40.8" fill="rgb(' + lampMix(glass, '0,0,0', 0.55) + ')"/>';
  if (!open) {
    body += '<rect x="6" y="5" width="34" height="36" fill="url(#' + id + 'g)"/>' + ring(4.7, 3.7, 41.3, 42.3, 1.3) +
      // The centre bar, lit on its left.
      '<rect x="22.35" y="5" width="1.3" height="36" fill="url(#' + id + 'v)"/>' +
      '<path d="M22.52 5V41" stroke="rgb(' + hi + ')" stroke-opacity=".9" stroke-width=".32"/>' +
      '<path d="M23.82 5V41" stroke="#000" stroke-opacity=".5" stroke-width=".34"/>';
  } else {
    // The sash beyond the wall: hinge edge hx at the frame, free edge ex, 0.3 of the opening away.
    const hx = 42.4, ex = 35, t0 = 3.7, b0 = 42.3, ti = 5.5, bi = 40.5;
    const lerp = function (a, b, k) { return a + (b - a) * k; };
    const ix0 = hx - 1.15, ix1 = ex + 1, k0 = (hx - ix0) / (hx - ex), k1 = (hx - ix1) / (hx - ex);
    const yT = function (k) { return r2(lerp(t0, ti, k) + 1.1); }, yB = function (k) { return r2(lerp(b0, bi, k) - 1.1); };
    const outer = 'M' + hx + ' ' + t0 + 'L' + ex + ' ' + ti + 'L' + ex + ' ' + bi + 'L' + hx + ' ' + b0 + 'Z';
    const inner = 'M' + r2(ix0) + ' ' + yT(k0) + 'L' + r2(ix1) + ' ' + yT(k1) + 'L' + r2(ix1) + ' ' + yB(k1) + 'L' + r2(ix0) + ' ' + yB(k0) + 'Z';
    const shine = 'M' + r2(ix0) + ' ' + yT(k0) + 'L' + r2(ix1) + ' ' + yT(k1) + 'L' + r2(ix1) + ' ' + r2(lerp(yT(k1), yB(k1), 0.45)) +
      'L' + r2(ix0) + ' ' + r2(lerp(yT(k0), yB(k0), 0.28)) + 'Z';
    body += '<rect x="6" y="5" width="16.35" height="36" fill="url(#' + id + 'g)"/>' +
      '<g clip-path="url(#' + id + 'o)"><rect x="23.7" y="2.6" width="18.7" height="40.8" fill="url(#' + id + 'k)"/>' +
      '<path d="' + inner + '" fill="rgb(' + glass + ')" fill-opacity=".82"/>' +
      '<path d="' + shine + '" fill="#fff" fill-opacity=".09"/>' +
      '<path d="' + outer + ' ' + inner + '" fill="' + M + '" fill-rule="evenodd"/>' +
      '<path d="M' + (ex + 0.15) + ' ' + r2(bi - 0.2) + 'V' + r2(ti + 0.2) + 'L' + hx + ' ' + r2(t0 + 0.15) +
      '" fill="none" stroke="rgb(' + hi + ')" stroke-opacity=".9" stroke-width=".32"/>' +
      '<path d="M' + r2(ix1) + ' ' + yB(k1) + 'V' + yT(k1) + '" stroke="#000" stroke-opacity=".5" stroke-width=".3"/>' +
      '<rect x="23.7" y="2.6" width="18.7" height="40.8" fill="url(#' + id + 'r)"/></g>' +
      // The fixed sash on the left: its frame, then the edge it shares with the opening.
      '<path d="M4.7 3.7H23.65V42.3H4.7Z M6 5V41H22.35V5Z" fill="' + M + '" fill-rule="evenodd"/>' +
      '<path d="M4.88 42.1V3.88H23.4" fill="none" stroke="rgb(' + hi + ')" stroke-opacity=".95" stroke-width=".36"/>' +
      '<path d="M6 41V5H22.35" fill="none" stroke="#000" stroke-opacity=".55" stroke-width=".34"/>' +
      '<path d="M23.65 3.9V42.3" stroke="rgb(' + lo + ')" stroke-width=".32"/>' +
      '<path d="M23.95 3.7V42.3" stroke="#000" stroke-opacity=".45" stroke-width=".3"/>';
  }
  return {
    w: 46, h: 50, light: [23, 24],
    svg: '<svg viewBox="0 0 46 50" width="46" height="50" style="display:block;overflow:visible">' + defs +
      '<g style="filter:drop-shadow(0 .8px 1.2px rgba(0,0,0,.55));opacity:' + (open ? 1 : 0.9) + '">' + body +
      ring(2, 1, 44, 45, 1.6) +
      '<rect x="0.4" y="45.3" width="45.2" height="2.3" rx=".55" fill="url(#' + id + 's)"/>' +
      '<path d="M0.8 45.5H45.2" stroke="#fff" stroke-opacity=".75" stroke-width=".35"/></g>' +
      '<path d="M1 48.4H45" stroke="#000" stroke-opacity=".55" stroke-width="1.1" style="filter:blur(.7px)"/></svg>'
  };
}

// The pale text colour of a flat pill: the pill colour mixed 60% toward white.
function lampWinPale(rgb) {
  return 'rgb(' + rgb.split(',').map(function (c) { return Math.round(parseFloat(c) * 0.4 + 255 * 0.6); }).join(',') + ')';
}

// The words ladder, longest-wanted first. `open` is the list of {room, name} for every open
// window, in the rooms/windows configuration order. `roomOrder` is every room name in order.
function lampWinWords(open, total, roomOrder) {
  if (!open.length) return ['All closed'];
  if (open.length === total) return ['Every window'];
  const names = open.map(function (w) { return w.name; }).join(', ');
  const rooms = roomOrder.filter(function (r) {
    return open.some(function (w) { return w.room === r; });
  });
  const oneRoom = rooms.length === 1;
  return [
    names,
    oneRoom ? (rooms[0] + ', ' + open.length + ' windows') : rooms.join(', '),
    oneRoom ? rooms[0] : (rooms.length + ' rooms')
  ];
}

class LampWindowStrip extends LampFootPanel {

  static getStubConfig() {
    return { rooms: [] };
  }

  _defaultTap() { return { action: 'navigate', navigation_path: '#windows' }; }

  _setup(config) {
    this._rooms = (config.rooms || []).map(function (r) {
      return {
        name: r.name,
        windows: (r.windows || []).map(function (w) {
          return { entity: w.entity, name: w.name || null };
        })
      };
    });
    this._weather = config.weather || null;
    this._warning = config.warning_sensor || null;
    this._warningCount = config.warning_count_sensor || null;
    this._hours = typeof config.outlook_hours === 'number' ? config.outlook_hours : lampDefault('window-strip', 'outlook_hours');
    this._cold = typeof config.cold_below === 'number' ? config.cold_below : lampDefault('window-strip', 'cold_below');
    this._rain = typeof config.rain_above === 'number' ? config.rain_above : lampDefault('window-strip', 'rain_above');
    this._forecast = null;
    this._fcRev = 0;
    this._pillBand = null;
    this._key = null;
    this._state = null;
    this._today = null;
    this._todayRev = 0;
    this._histKey = null;
  }

  _icon() { return 'mdi:window-closed-variant'; }
  _label() { return 'Windows'; }

  _buildContent(body) {
    this._content = body;
    this._figureAndWords(body);
    this._buildPill();
    if (this._hass) { this._key = null; this._onHass(this._hass); }
  }

  connectedCallback() {
    super.connectedCallback();
    this._subscribe();
    if (!this._histTimer) {
      const self = this;
      this._histTimer = setInterval(function () { self._fetchToday(); }, LAMP_WIN_HISTORY_MS);
    }
    this._fetchToday();
    if (!this._minuteTimer) {
      const self = this;
      this._minuteTimer = setInterval(function () {
        self._key = null;
        if (self._hass) self._onHass(self._hass);
      }, 60000);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsub) { this._unsub(); this._unsub = null; }
    clearInterval(this._minuteTimer);
    this._minuteTimer = null;
    clearInterval(this._histTimer);
    this._histTimer = null;
    clearTimeout(this._histAgain);
  }

  // One recorder read from today's midnight: did any window open today, and when did the last one
  // close? See THE TODAY LINE.
  async _fetchToday() {
    if (!this._hass || !this.isConnected) return;
    const ids = [];
    this._rooms.forEach(function (r) { r.windows.forEach(function (w) { ids.push(w.entity); }); });
    if (!ids.length) return;
    const now = Date.now(), day = lampWinMidnight(new Date(now)).getTime();
    try {
      const resp = await this._hass.connection.sendMessagePromise({
        type: 'history/history_during_period', start_time: new Date(day).toISOString(),
        entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false
      });
      const per = ids.map(function (id) {
        const samples = ((resp && resp[id]) || []).map(function (it) { return { s: it.s, t: (it.lu || it.lc) * 1000 }; });
        return lampWinClip(lampWinIntervals(samples, day, now), day, now);
      });
      const closes = per.map(function (list) { const c = lampWinLastClose(list); return c ? c.end : 0; });
      this._today = { day: day, opened: lampWinUnionMs(per) > 0, since: Math.max.apply(null, closes) || null };
      this._todayRev++;
      this._key = null;
      if (this._hass) this._onHass(this._hass);
    } catch (e) {
      // A bare `3` is a dropped connection. Keep the last answer; the timer tries again.
    }
  }

  // Read again when a contact changes, and at midnight.
  _checkToday(states) {
    const day = lampWinMidnight(new Date()).getTime();
    const key = states.map(function (s) { return s ? s.state + s.last_changed : ''; }).join(',') + '|' + day;
    if (key === this._histKey) return;
    const first = this._histKey === null;
    this._histKey = key;
    this._fetchToday();
    if (!first) {
      const self = this;
      clearTimeout(this._histAgain);
      this._histAgain = setTimeout(function () { self._fetchToday(); }, 6000);
    }
  }

  // The hourly forecast, as the #windows pop-up subscribes to it (src/98-windows-detail.js).
  _subscribe() {
    if (!this._weather || this._unsub || !this._hass || !this.isConnected) return;
    const self = this;
    let killed = false;
    this._unsub = function () { killed = true; };
    this._hass.connection.subscribeMessage(
      function (msg) {
        self._forecast = (msg && msg.forecast) || [];
        self._fcRev++;
        if (self._hass) self._onHass(self._hass);
      },
      { type: 'weather/subscribe_forecast', entity_id: this._weather, forecast_type: 'hourly' }
    ).then(function (off) {
      if (killed) { off(); return; }
      self._unsub = off;
    }).catch(function () { self._unsub = null; });
  }

  // The pill: a glyph and a text (the text is hidden: the pill is always the disc). It lies in the
  // card, not in the body, so the body keeps its layout. Flat material, as the Waste pills
  // (option 13). It is not a tap target.
  _buildPill() {
    const pill = document.createElement('div');
    pill.setAttribute('aria-hidden', 'true');
    pill.style.cssText = 'position:absolute;left:0;top:0;z-index:2;display:none;box-sizing:border-box;' +
      'height:22px;border-radius:999px;align-items:center;justify-content:center;gap:4px;' +
      'font-size:var(--lamplight-t-state);font-weight:600;line-height:1;white-space:nowrap;pointer-events:none;' +
      'font-variant-numeric:tabular-nums';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.cssText = 'width:14px;height:14px;display:block;flex:none;line-height:0';
    const text = document.createElement('span');
    pill.appendChild(svg);
    pill.appendChild(text);
    this._card.appendChild(pill);
    this._pill = { box: pill, svg: svg, text: text };
  }

  // Write the pill from the band, or hide it.
  _setPill(band, now) {
    const P = this._pill;
    this._pillBand = band;
    if (!P) return;
    if (!band) { P.box.style.display = 'none'; return; }
    const rgb = LAMP_WIN_WX[band.level].w, pale = lampWinPale(rgb);
    P.box.style.background = 'rgba(' + rgb + ',0.13)';
    P.box.style.border = '1px solid rgba(' + rgb + ',0.30)';
    P.box.style.color = pale;
    P.svg.innerHTML = LAMP_WIN_GLYPH[band.glyph];
    P.text.textContent = band.at === null ? 'Warning'
      : (band.at === lampWinHourStart(now) ? 'Now' : lampWinHM(new Date(band.at)));
    this._layoutPill();
  }

  // Place the disc. Since 0.152.0-dev the window drawing takes the right of the figure row, so the pill
  // is always the 22px disc with the glyph only. It sits 8px after the figure's own text, which a Range
  // measures in the DOM, and it stays 6px clear of the drawing. A figure too wide for that (two digits
  // on a narrow card) puts the disc on the drawing's bottom left corner instead.
  _layoutPill() {
    const P = this._pill;
    if (!P || !this._pillBand) return;
    const box = P.box;
    box.style.display = 'flex';
    box.style.width = '22px'; box.style.padding = '0'; box.style.gap = '0';
    box.style.right = 'auto';
    P.text.style.display = 'none';
    const fig = this._fig.getBoundingClientRect();
    if (!fig.width) return;       // not laid out yet: the card resizes soon and calls this again
    const range = document.createRange();
    range.selectNodeContents(this._fig);
    const figRight = range.getBoundingClientRect().right;
    const card = this._card.getBoundingClientRect(), ox = card.left + this._card.clientLeft;
    const g = this._gauge(), gLeft = this._card.clientWidth - LAMP_GAUGE_AT[1] - (g ? g.w : 0);
    const left = figRight - ox + 8;
    if (left + 22 + 6 <= gLeft) {
      box.style.left = left + 'px';
      box.style.top = (fig.top - card.top - this._card.clientTop + fig.height / 2 + 4 - 11) + 'px';
    } else {
      box.style.left = (gLeft - 11) + 'px';
      box.style.top = (LAMP_GAUGE_AT[0] + (g ? g.h : 0) - 11) + 'px';
    }
  }

  _refitAll() {
    super._refitAll();
    this._layoutPill();
  }

  _onHass(hass) {
    if (!this._fig) return;
    this._subscribe();
    const flat = [];
    this._rooms.forEach(function (room) {
      room.windows.forEach(function (w) { flat.push({ room: room.name, entity: w.entity, given: w.name }); });
    });
    const states = flat.map(function (w) { return hass && hass.states[w.entity]; });
    const sensor = function (id) { return id && hass && hass.states[id] ? hass.states[id].state : ''; };
    this._checkToday(states);
    const key = states.map(function (s) { return s ? s.state : ''; }).join(',') + '|' +
      sensor(this._warning) + '|' + sensor(this._warningCount) + '|' + this._fcRev + '|' + this._todayRev;
    if (key === this._key) return;
    this._key = key;
    const now = Date.now();

    const readable = states.filter(function (s) { return s && (s.state === 'on' || s.state === 'off'); });
    if (flat.length && !readable.length) {
      this._setFigure('', '');
      this._registerFit(this._words, ['No readings']);
      this._words.style.color = 'rgba(255,255,255,.30)';
      this._state = { rgb: LAMP_FOOT_REST, s: 0, open: false };
      this._setPill(null, now);
      return;
    }

    const open = [];
    flat.forEach(function (w, i) {
      const s = states[i];
      if (s && s.state === 'on') {
        const label = w.given || (s.attributes && s.attributes.friendly_name) || w.entity;
        open.push({ room: w.room, name: label });
      }
    });

    const n = open.length;
    const roomOrder = this._rooms.map(function (r) { return r.name; });
    // The same test as the #windows pop-up: only while a window is open, and with the same
    // functions. The phrase is empty: the pill shows no words from it.
    const band = n && this._weather
      ? lampWinBand(lampWinLook(this._forecast, now, this._hours), now,
        lampWinWarning(hass, this._warning, this._warningCount), '', { cold: this._cold, rain: this._rain })
      : null;
    if (n) {
      // An open window keeps the 24px figure of the closed state. The sky colour marks it.
      // Only a battery in the alert band draws at display size (7 Nov 2026, 0.73.0-dev).
      this._setFigure(String(n), 'open', 'rgb(' + LAMP_WIN_SKY + ')');
      this._registerFit(this._words, lampWinWords(open, flat.length, roomOrder));
      this._words.style.color = 'var(--lamplight-ink-mid)';
      this._state = { rgb: LAMP_WIN_SKY, s: 0.6 + 0.4 * n / flat.length, open: true };
    } else {
      this._setFigure(String(flat.length), 'closed');
      const td = this._today;
      this._registerFit(this._words, [!td ? '' : (td.opened && td.since) ? lampWinSince(td.since, now) : 'None opened today']);
      this._words.style.color = 'var(--lamplight-ink-soft)';
      this._state = { rgb: LAMP_FOOT_REST, s: 0.25, open: false };
    }
    // After the figure: the pill or the disc is chosen from the width of the new figure.
    this._setPill(band, now);
  }

  _light() { return this._state || { rgb: LAMP_FOOT_REST, s: 0, open: false }; }

  _gauge() {
    const l = this._light();
    return lampGaugeScale(lampWinGauge(this._gid || 'lg', l.rgb, !!l.open));
  }
}

customElements.define('lamplight-window-strip', LampWindowStrip);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-window-strip',
  name: 'Lamplight Window Strip',
  description: 'A small panel with a glass lamp, the count of open windows and a text ladder that names what is open.',
  preview: false
});
