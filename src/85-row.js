// lamplight-row. The small row: icon tile, name, sub-line, one thing on the right.
//
// It replaces three button-card templates that all drew the same shape and
// differed only in what the right-hand thing did - a plug row, a network row,
// a Christmas-lights row, three routine rows and a window-contact row. One
// card with a `kind:` key, not three cards, because three sets of
// near-identical row code is the drift this whole effort exists to remove.
// It also removes the last `card_mod` from any row.
//
// FOUR KINDS
//   toggle   a switch. Left rail carries the accent; the right slot is a
//            pill switch.
//   fan      an air purifier: a toggle whose sub-line gives the mode and the
//            air in words, or a filter job when a filter is low (84-air.js).
//   run      a script or a scene. The right slot is a play button.
//   contact  a binary sensor, read only. The right slot is an optional
//            battery reading.
//
// TWO THINGS THE LIVE ROWS DID THAT THIS CARD DOES NOT
// The three routine rows cross-read each other's `last_triggered` to glow
// whichever played most recently. The household dropped this on 22 September
// 2026: it is not what the phase asked for, and a generic version of it would
// need a sibling list the way the shell's own accent-pick rule takes one.
// The window row appended a ticking "· 2h 15m" to its state line, computed by
// server-rendered card_mod Jinja every few seconds. The household does not
// need that surfaced here and dropped it the same day, which is also what
// lets this card draw entirely in the browser with no card_mod anywhere.
//
// ROW HEIGHT IS NOT A REPRODUCTION OF BUTTON-CARD'S OWN GRID
// Measured live 22 September 2026: the switch rows compute four grid row
// tracks (two carrying content, two empty at 0px) because their own config
// sets an explicit `row-gap`; the routine and window rows compute exactly two
// tracks with no gap. All three reach the same ~36px two-line content height
// by different, accidental routes - a button-card artefact, not a design
// decision. This card draws two rows with normal line-height stacking and
// does not chase either number.
//
// Configuration, every kind:
//   kind       required. toggle | run | contact
//   entity     required
//   name       optional. Default: the entity's friendly_name. The household's name wins
//   icon       optional. Default: the entity's icon, else its domain's. The household's icon wins. The tile glyph. For `contact`, the glyph when off
//   accent     required. The tile, its border and (for `run`) the glow
//   tap_action default `more-info` on `entity` (toggle, contact) or `none`
//              (run)
//
// `kind: toggle` only:
//   power_sensor  a sensor read for the watts shown after "on"
//   side_bar_opacity [0.08, 0.60]. The 3px left bar when off and when on.
//                 false takes the bar away
//   confirm_off   optional. Ask before the toggle turns the device off (30 Oct 2026,
//                 design-docs/plug_guard_options.html, option 4b). For a device that cuts
//                 something the household needs, such as the network. Turning on never asks.
//                 true, or { title, text, confirm, dismiss }. The defaults are
//                 "Turn off the <name>?", no text, "Turn off" and "Keep it on". 86-confirm.js
//                 draws the dialog. Only the toggle asks: a tap on the row still opens its sheet
//
// `kind: fan` only (24 Oct 2026, design-docs/air_purifier_options.html):
//   power_sensor and side_bar_opacity as for `toggle`, and:
//   air_sensor    a PM2.5 sensor. Omitted, the sub-line gives the mode only
//   air_quality_limits  the upper edge of each air word. Default [12, 35, 55]
//   air_quality_labels  the words. Default ['clean', 'fair', 'poor', 'very poor']
//   filters       [{ entity, name, job: clean | replace }]. A filter at or
//                 under `filter_alert_level` puts "<job> the <name>" in the sub-line
//   filter_alert_level  default 20, the battery mark's threshold
//
// `kind: run` only:
//   The entity's domain picks the service: `script.turn_on` for a script,
//   `scene.turn_on` for a scene. A scene has no "running" state, so its state
//   is read as its own last-activated time.
//
// `kind: contact` only:
//   icon_on        the glyph when the sensor is on. Default: `icon`
//   icon_unknown   default mdi:help-circle-outline
//   battery_sensor a sensor read for the battery badge. Omitted, no badge. The badge shows
//                  only at 39% or less, in the battery sheet's band colour

// Ported from the old button-card template. A state line, so lower case since 0.50.1-dev (F10,
// 31 Oct 2026). No live row uses kind: run now.
function lampRowLastRun(iso) {
  if (!iso) return 'never run';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'never run';
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const y0 = new Date(t0.getTime() - 86400000);
  const hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d >= t0) return 'ran today, ' + hm;
  if (d >= y0) return 'ran yesterday, ' + hm;
  const opts = d.getFullYear() === t0.getFullYear()
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' };
  return 'last run ' + d.toLocaleDateString('en-GB', opts);
}

class LampRow extends HTMLElement {

  // A band: lamplight-panel removes the stack gap between two bands. See LAMP_BAND_PAD.
  static get lampBand() { return true; }

  static getStubConfig() {
    return { kind: 'toggle', entity: '', name: '', icon: 'mdi:power-plug', accent: LAMP_PALETTE.cornflower.soft };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (['toggle', 'fan', 'run', 'contact'].indexOf(config.kind) === -1) {
      throw new Error('lamplight-row needs a `kind` of toggle, fan, run or contact');
    }
    if (!config.entity) throw new Error('lamplight-row needs an `entity`');
    if (!config.accent) throw new Error('lamplight-row needs an `accent`');
    this._config = config;
    this._kind = config.kind;
    // A fan row is a toggle row with another sub-line.
    this._switchy = config.kind === 'toggle' || config.kind === 'fan';
    this._entity = config.entity;
    this._domain = config.entity.split('.')[0];
    // `name` and `icon` are optional: the entity gives them (01-entity.js). Resolved in `set hass`.
    this._name = config.name || this._entity;
    this._icon = config.icon || lampEntityIcon(null, config.entity);
    this._accent = lampColour(config.accent, 'soft');
    this._tap = config.tap_action ||
      (this._kind === 'run' ? { action: 'none' } : { action: 'more-info' });
    this._powerSensor = config.power_sensor || null;
    this._railAlpha = config.side_bar_opacity === false ? false
      : lampOpt('row', config, 'side_bar_opacity');
    this._iconOn = config.icon_on || null;   // null: the same glyph as off
    this._iconUnknown = config.icon_unknown || 'mdi:help-circle-outline';
    this._batterySensor = config.battery_sensor || null;
    this._airSensor = config.air_sensor || null;
    this._airBands = config.air_quality_limits || null;
    this._airWords = config.air_quality_labels || null;
    this._filters = config.filters || [];
    this._filterAlert = lampOpt('row', config, 'filter_alert_level');
    const co = config.confirm_off;
    this._confirmOff = !co ? null : {
      title: co.title || null,   // null: 'Turn off the <name>?', written when it is asked
      text: co.text || '',
      confirm: co.confirm || 'Turn off',
      dismiss: co.dismiss || 'Keep it on'
    };
    this._key = null;
    this._render();
  }

  set hass(hass) { this._hass = hass; this._resolveLabels(); this._update(); }

  // The household's name and icon win. Without them the entity gives them.
  _resolveLabels() {
    const c = this._config;
    const name = lampEntityName(this._hass, this._entity, c.name);
    const icon = lampEntityIcon(this._hass, this._entity, c.icon);
    if (name !== this._name) {
      this._name = name;
      if (this._nameInner) this._nameInner.textContent = name;
    }
    if (icon !== this._icon) {
      this._icon = icon;
      if (this._tileIcon) this._tileIcon.setAttribute('icon', icon);
    }
  }

  getCardSize() { return 1; }

  // ---- the card -----------------------------------------------------------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    const self = this;
    this.style.display = 'block';

    const card = document.createElement('ha-card');
    this._card = card;
    [['background', 'transparent'],
     ['backdrop-filter', 'none'],
     ['-webkit-backdrop-filter', 'none'],
     ['border', 'none'],
     ['border-top', '1px solid rgba(255,255,255,0.05)'],
     ['border-radius', '0'],
     ['box-shadow', 'none'],
     // LAMP_BAND_PAD more above and below: this row is a band.
     ['padding', (this._kind === 'run' ? 11 : 10) + LAMP_BAND_PAD + 'px 16px'],
     ['position', 'relative'],
     ['overflow', 'hidden'],
     ['box-sizing', 'border-box'],
     ['display', 'block']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    card.style.setProperty('font-family', 'var(--primary-font-family, Roboto, Noto, sans-serif)');
    card.style.setProperty('line-height', 'normal');
    card.style.setProperty('font-size', '1.2em');
    if (this._tap.action !== 'none') card.style.cursor = 'pointer';

    if (this._switchy && this._railAlpha !== false) {
      this._railEl = document.createElement('div');
      this._railEl.style.cssText =
        'position:absolute;left:0;top:0;bottom:0;width:3px;pointer-events:none';
      card.appendChild(this._railEl);
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;box-sizing:content-box;' +
      'grid-template-areas:"i n g" "i s g";grid-template-columns:auto 1fr auto;' +
      'column-gap:13px;row-gap:3px;align-items:center';
    this._grid = grid;
    // THE LINES USE THE ROOMS ROW'S SPACING. The name has a 1.25 line height
    // and the two lines have a 3px gap, the same as a lamplight-rooms row. Before
    // this, the lines were 15px (switch) or 16px (run, contact) apart, and the
    // Rooms lines 19px, so the rows did not match from panel to panel. The
    // window name also sat 0.55px high. Now each text block is centred on its
    // tile, within half a pixel. Measured 24 September 2026, Lamplight
    // 0.16.1-dev.

    // ---- i, the icon tile
    const tile = document.createElement('div');
    tile.style.cssText = 'grid-area:i;box-sizing:content-box;width:34px;height:34px;' +
      'border-radius:11px;display:flex;align-items:center;justify-content:center;' +
      'align-self:center;justify-self:start;overflow:hidden;position:relative;' +
      'background:rgba(' + this._accent + ',0.12);' +
      // The lit edge (17-edge.js) takes the border's place: 1px of padding keeps the 36px.
      'border:none;padding:1px';
    const iconSize = this._switchy ? '18px' : '19px';
    const icon = document.createElement('ha-icon');
    icon.setAttribute('icon', this._icon);
    this._tileIcon = icon;
    icon.style.cssText = '--mdc-icon-size:' + iconSize + ';width:' + iconSize +
      ';height:' + iconSize + ';display:flex;align-items:center;justify-content:center;' +
      'line-height:0';
    tile.appendChild(icon);
    this._edge = lampEdge(tile, '11px');
    lampEdgePaint(this._edge, this._accent, LAMP_EDGE.lit);
    grid.appendChild(tile);
    this._tile = tile; this._icon_el = icon;

    const ell = (area, js, as, extra) => {
      const d = document.createElement('div');
      d.style.cssText = 'grid-area:' + area + ';justify-self:' + js +
        ';align-self:' + as + ';display:block;overflow:hidden;' +
        'white-space:nowrap;text-overflow:ellipsis;' + (extra || '');
      grid.appendChild(d);
      return d;
    };

    // ---- n, the name
    this._nameWrap = ell('n', 'start', 'end');
    this._nameInner = document.createElement('div');
    this._nameInner.style.cssText = this._kind === 'contact'
      ? 'font-size:var(--lamplight-t-body);font-weight:500;line-height:1.25;color:var(--primary-text-color)'
      : 'font-size:var(--lamplight-t-name);font-weight:600;letter-spacing:-0.01em;line-height:1.25';
    this._nameInner.textContent = this._name;
    this._nameWrap.appendChild(this._nameInner);

    // ---- s, the sub-line
    this._subWrap = ell('s', 'start', 'start',
      this._kind === 'contact'
        ? 'font-size:var(--lamplight-t-state);color:var(--lamplight-ink-quiet)'
        : 'font-size:var(--lamplight-t-state);color:var(--lamplight-ink-soft);font-variant-numeric:tabular-nums');
    this._sub = document.createElement('span');
    this._subWrap.appendChild(this._sub);

    // ---- g, the right-hand slot
    const slot = document.createElement('div');
    slot.style.cssText = 'grid-area:g;align-self:center;justify-self:end;overflow:visible';
    grid.appendChild(slot);
    this._slot = slot;

    if (this._switchy) this._buildToggle(slot);
    else if (this._kind === 'run') this._buildPlay(slot);
    else this._buildBattery(slot);

    card.appendChild(grid);
    this.shadowRoot.appendChild(card);

    card.addEventListener('click', function () { self._tapRow(); });
  }

  // ---- the right-hand slot, one build method per kind ---------------------

  _buildToggle(slot) {
    const self = this;
    slot.style.cssText += ';width:38px;height:22px';
    const pill = document.createElement('div');
    pill.style.cssText = 'box-sizing:border-box;position:relative;width:38px;height:22px;' +
      'border-radius:999px;cursor:pointer';
    const knob = document.createElement('span');
    knob.style.cssText = 'position:absolute;top:2px;width:18px;height:18px;border-radius:50%';
    pill.appendChild(knob);
    slot.appendChild(pill);
    this._pill = pill; this._knob = knob;
    pill.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!self._hass) return;
      // A fan row toggles its own domain; a toggle row has always called `switch`.
      const dom = self._kind === 'fan' ? self._domain : 'switch';
      const s = self._hass.states[self._entity];
      if (self._confirmOff && s && s.state === 'on') {
        // turn_off, not toggle: the state can change while the dialog is open.
        lampConfirm(Object.assign({}, self._confirmOff, { title: self._confirmOff.title || 'Turn off the ' + self._name + '?' })).then(function (yes) {
          if (yes && self._hass) self._hass.callService(dom, 'turn_off', { entity_id: self._entity });
        });
        return;
      }
      self._hass.callService(dom, 'toggle', { entity_id: self._entity });
    });
  }

  _buildPlay(slot) {
    const self = this;
    slot.style.cssText += ';width:32px;height:32px';
    const btn = document.createElement('div');
    btn.style.cssText = 'box-sizing:border-box;width:32px;height:32px;border-radius:50%;' +
      'display:flex;align-items:center;justify-content:center;cursor:pointer;' +
      'background:rgba(255,255,255,0.055);border:1px solid rgba(255,255,255,0.12);' +
      'color:var(--lamplight-ink-soft)';
    const i = document.createElement('ha-icon');
    i.setAttribute('icon', 'mdi:play');
    i.style.cssText = '--mdc-icon-size:15px;width:15px;height:15px;margin:0;' +
      'display:flex;align-items:center;justify-content:center;line-height:0';
    btn.appendChild(i);
    slot.appendChild(btn);
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!self._hass) return;
      const svc = self._domain === 'scene' ? 'scene' : 'script';
      self._hass.callService(svc, 'turn_on', { entity_id: self._entity });
    });
  }

  _buildBattery(slot) {
    if (!this._batterySensor) return;
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:var(--lamplight-t-caption);' +
      'font-variant-numeric:tabular-nums;white-space:nowrap';
    const i = document.createElement('ha-icon');
    i.style.cssText = '--mdc-icon-size:14px;width:14px;height:14px;line-height:0';
    const t = document.createElement('span');
    wrap.appendChild(i); wrap.appendChild(t);
    slot.appendChild(wrap);
    this._batWrap = wrap; this._batIcon = i; this._batText = t;
  }

  _tapRow() {
    const a = this._tap;
    if (a.action === 'none') return;
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
      return;
    }
    const ev = new Event('hass-more-info', { bubbles: true, composed: true });
    ev.detail = { entityId: a.entity || this._entity };
    this.dispatchEvent(ev);
  }

  // ---- the state ------------------------------------------------------------

  _update() {
    if (!this._hass || !this._card) return;
    const s = this._hass.states[this._entity];
    const key = s ? s.state + ':' + s.last_changed + ':' + JSON.stringify(s.attributes)
                  : this._entity + ':-';
    const extra = (this._powerSensor && this._hass.states[this._powerSensor]) || '';
    const battKey = (this._batterySensor && this._hass.states[this._batterySensor]) || '';
    const h = this._hass;
    const airKey = this._kind === 'fan'
      ? [this._airSensor].concat(this._filters.map(function (f) { return f && f.entity; }))
          .map(function (id) { const x = id && h.states[id]; return x ? x.state : '-'; }).join(',')
      : '';
    const fullKey = key + '|' + JSON.stringify(extra) + '|' + JSON.stringify(battKey) + '|' + airKey;
    if (fullKey === this._key) return;
    this._key = fullKey;

    if (this._switchy) this._paintToggle(s);
    else if (this._kind === 'run') this._paintRun(s);
    else this._paintContact(s);
  }

  // ---- toggle ---------------------------------------------------------------

  _paintToggle(s) {
    const on = !!(s && s.state === 'on');
    // Off, the tile is the one white plate (.07) of option 10, with a white lit edge.
    this._tile.style.background = on ? 'rgba(' + this._accent + ',0.12)' : 'rgba(255,255,255,0.07)';
    lampEdgePaint(this._edge, on ? this._accent : '255,255,255', on ? LAMP_EDGE.lit : LAMP_EDGE.off);
    this._icon_el.style.color = on ? 'rgb(' + this._accent + ')' : 'rgba(255,255,255,0.40)';
    this._icon_el.style.filter = on ? 'drop-shadow(0 0 6px rgba(' + this._accent + ',0.55))' : 'none';
    this._nameInner.style.color = on ? '#ffffff' : 'var(--lamplight-ink-mid)';

    let sub = on ? 'on' : 'off';
    if (on && this._powerSensor) {
      const w = this._hass.states[this._powerSensor];
      const watts = w && !isNaN(parseFloat(w.state)) ? parseFloat(w.state) : null;
      if (watts !== null) sub += ' · ' + watts + ' W';
    }
    if (this._kind === 'fan') this._paintFanSub(s, on);
    else this._sub.textContent = sub;

    this._pill.style.background = on ? 'rgb(' + this._accent + ')' : 'rgba(255,255,255,0.14)';
    this._knob.style.background = on ? '#ffffff' : 'rgba(255,255,255,0.75)';
    this._knob.style.left = on ? '' : '2px';
    this._knob.style.right = on ? '2px' : '';

    if (this._railEl) {
      const ra = on ? this._railAlpha[1] : this._railAlpha[0];
      this._railEl.style.background = 'rgba(' + this._accent + ',' + ra + ')';
    }
  }

  // ---- fan --------------------------------------------------------------

  // "auto · air clean". Off, the mode is "off", as on every toggle row. A low
  // filter takes the place of the air words, in the alert orange, so the row
  // stays one line: "sleep · clean the pre-filter". A state line is lower case
  // (F10, 31 Oct 2026); lampFanMode keeps its capital for the pop-up hero and buttons. 156px at phone width in a
  // 225px column, measured 24 Oct 2026; name a filter short ("filter").
  _paintFanSub(s, on) {
    const gone = !s || s.state === 'unavailable' || s.state === 'unknown';
    this._sub.textContent = '';
    if (gone) { this._sub.textContent = 'no signal'; return; }
    const head = on ? lampFanMode(s).toLowerCase() : 'off';
    const low = lampFilterList(this._hass, this._filters, this._filterAlert)
      .filter(function (f) { return f.alert; });
    let tail = null, alert = false;
    if (low.length) {
      tail = low[0].job + ' the ' + low[0].name;
      alert = true;
    } else if (on) {
      const v = lampAirValue(this._hass, this._airSensor);
      if (v !== null) tail = 'air ' + lampAirWord(v, this._airBands, this._airWords);
    }
    this._sub.appendChild(document.createTextNode(head + (tail ? ' · ' : '')));
    if (tail) {
      const t = document.createElement('span');
      t.textContent = tail;
      if (alert) t.style.color = 'rgb(' + LAMP_ALERT_RGB + ')';
      this._sub.appendChild(t);
    }
  }

  // ---- run --------------------------------------------------------------

  _paintRun(s) {
    this._nameInner.style.color = '#ffffff';
    this._icon_el.style.color = 'rgb(' + this._accent + ')';
    this._icon_el.style.filter = 'drop-shadow(0 0 6px rgba(' + this._accent + ',0.8))';

    let txt;
    if (this._domain === 'script') {
      txt = (s && s.state === 'on') ? 'running…' : lampRowLastRun(s && s.attributes.last_triggered);
    } else {
      txt = lampRowLastRun(s && s.state);
    }
    this._sub.textContent = txt;
  }

  // ---- contact ------------------------------------------------------------

  _paintContact(s) {
    const unknown = !s || s.state === 'unavailable' || s.state === 'unknown';
    const on = !unknown && s.state === 'on';

    this._icon_el.setAttribute('icon', unknown ? this._iconUnknown : (on ? (this._iconOn || this._icon) : this._icon));
    this._tile.style.background = on ? 'rgba(' + this._accent + ',0.12)' : 'rgba(255,255,255,0.07)';
    // A dead contact keeps its dashed border (section 10): that border is state. It
    // takes the padding's place, and the lit edge goes.
    this._tile.style.border = unknown ? '1px dashed rgba(255,255,255,0.14)' : 'none';
    this._tile.style.padding = unknown ? '0' : '1px';
    lampEdgePaint(this._edge, on ? this._accent : '255,255,255',
      unknown ? null : (on ? LAMP_EDGE.lit : LAMP_EDGE.off));
    this._icon_el.style.color = unknown ? 'rgba(255,255,255,0.30)'
      : (on ? 'rgb(' + this._accent + ')' : 'rgba(255,255,255,0.34)');
    this._icon_el.style.filter = on ? 'drop-shadow(0 0 6px rgba(' + this._accent + ',.45))' : 'none';

    // A state line is lower case, as on every other row (F10, 31 Oct 2026).
    this._sub.textContent = unknown ? 'no signal' : (on ? 'open' : 'closed');

    // The battery mark shows only in an alert band (12 Nov 2026, 0.92.0-dev, household
    // decision). It uses the bands and colours of the battery sheet (96-batteries.js):
    // yellow at 21-39% ("Worth noticing"), orange with a glow at 20% or less ("Replace
    // soon"). At 40% or more, the mark is hidden. Until this date it showed at every level.
    if (this._batWrap) {
      const b = this._batterySensor && this._hass.states[this._batterySensor];
      const v = b ? parseFloat(b.state) : NaN;
      const band = isNaN(v) ? null : lampBattBand(v, lampBattLimits());
      if (band !== 'alert' && band !== 'notice') {
        this._batWrap.style.display = 'none';
      } else {
        // flex, not '': an empty value also clears the flex that the build gives the badge.
        this._batWrap.style.display = 'flex';
        const rgb = LAMP_BATT_BAND_RGB[band];
        const col = 'rgb(' + rgb + ')';
        this._batWrap.style.color = col;
        this._batIcon.setAttribute('icon', band === 'alert' ? 'mdi:battery-alert' : 'mdi:battery');
        this._batIcon.style.color = col;
        this._batIcon.style.filter = band === 'alert' ? 'drop-shadow(0 0 5px rgba(' + rgb + ',.45))' : 'none';
        this._batText.textContent = Math.round(v) + '%';
      }
    }
  }
}

customElements.define('lamplight-row', LampRow);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-row',
  name: 'Lamplight Row',
  description: 'A row: icon tile, name, sub-line, and a toggle, a play button or a battery reading. The fan kind shows a purifier\'s mode, air and filter job.',
  preview: false
});
