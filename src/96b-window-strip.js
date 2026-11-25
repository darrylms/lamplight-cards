// lamplight-window-strip. The small panel on Overview beside lamplight-battery-strip (LampFootPanel,
// src/21-strip.js): an eyebrow, the count as the figure ("2 open", or "6 closed"), and one
// line of words that names what is open, by a ladder that never wraps (lampFitText).
// The light is slate while every window is closed and sky when one opens. A glass lamp sits in
// the top right corner and the light is centred on it (LampFootPanel, src/21-strip.js). The
// lamp shows an open window or a closed one. Its strength is 0.25 when all are closed and
// 0.6 + 0.4 x n / total when n are open.
//
// Option 1 "Lamplight", design-docs/overview_footer_rework_options.html, 7 October 2026. Option 8
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
// With a `weather` key, the panel shows a small pill under the lamp, level with the figure, while the
// #windows pop-up shows its weather band. It is the same test: lampWinLook(), lampWinWarning() and
// lampWinBand() in src/98-windows-detail.js, called only while a window is open. The pill shows the
// band's glyph and its hour ("Now", "15:00"), or "Warning". It is flat, like the Waste pills: a 13%
// fill, a 30% border and pale text. When the figure and the pill do not both fit, the pill becomes a
// 22px disc with the glyph only. The pill is not a tap target. Without `weather`, there is no pill.
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

  // The pill: a glyph and a text. It lies in the card, not in the body, so the body keeps its
  // layout. Flat material, as the Waste pills (option 13). It is not a tap target.
  _buildPill() {
    const pill = document.createElement('div');
    pill.setAttribute('aria-hidden', 'true');
    pill.style.cssText = 'position:absolute;right:12px;top:0;z-index:1;display:none;box-sizing:border-box;' +
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

  // Place the pill, and choose the pill or the disc (option 18). The text is measured in the
  // DOM, never with canvas measureText. A Range gives the width of the figure's own text; the
  // factor 1.15 allows for the household's phone, which draws text wider.
  _layoutPill() {
    const P = this._pill;
    if (!P || !this._pillBand) return;
    const box = P.box;
    box.style.display = 'flex';
    box.style.width = ''; box.style.padding = '0 9px 0 7px'; box.style.gap = '4px';
    P.text.style.display = '';
    const fig = this._fig.getBoundingClientRect();
    if (!fig.width) return;       // not laid out yet: the card resizes soon and calls this again
    const range = document.createRange();
    range.selectNodeContents(this._fig);
    const figW = range.getBoundingClientRect().width;
    const cs = getComputedStyle(this._content);
    const avail = this._content.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (figW * 1.15 + 8 + box.offsetWidth > avail) {
      box.style.width = '22px'; box.style.padding = '0'; box.style.gap = '0';
      P.text.style.display = 'none';
    }
    const card = this._card.getBoundingClientRect();
    box.style.top = (fig.top - card.top - this._card.clientTop + fig.height / 2 + 4 - 11) + 'px';
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
      this._state = { rgb: LAMP_FOOT_REST, s: 0, icon: 'mdi:window-closed-variant' };
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
      this._state = { rgb: LAMP_WIN_SKY, s: 0.6 + 0.4 * n / flat.length, icon: 'mdi:window-open' };
    } else {
      this._setFigure(String(flat.length), 'closed');
      const td = this._today;
      this._registerFit(this._words, [!td ? '' : (td.opened && td.since) ? lampWinSince(td.since, now) : 'None opened today']);
      this._words.style.color = 'var(--lamplight-ink-soft)';
      this._state = { rgb: LAMP_FOOT_REST, s: 0.25, icon: 'mdi:window-closed-variant' };
    }
    // After the figure: the pill or the disc is chosen from the width of the new figure.
    this._setPill(band, now);
  }

  _light() { return this._state || { rgb: LAMP_FOOT_REST, s: 0, icon: 'mdi:window-closed-variant' }; }
}

customElements.define('lamplight-window-strip', LampWindowStrip);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-window-strip',
  name: 'Lamplight Window Strip',
  description: 'A small panel with a glass lamp, the count of open windows and a text ladder that names what is open.',
  preview: false
});
