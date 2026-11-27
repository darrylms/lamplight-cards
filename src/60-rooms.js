// lamplight-rooms. One row for each room.
//
// One complete panel: the shell, the eyebrow and a row for each room. It
// replaces a custom:lamplight-panel holding six custom:button-cards, five of them
// the same 7,100-character template with the room's names changed. The output
// is the same card.
//
// WHAT A ROW SHOWS
// A 34px icon tile in the room's accent, the room's name, a line that says how
// many of its lights are lit, the temperature, the humidity, and a 32px light
// toggle with a brightness ring. Two grid rows, four grid columns:
//
//     "i n t g"      i tile   n name   t temperature   g toggle
//     "i s h g"      s lights and chips   h humidity
//
// The row is 65px: a 36px tile, 14px of padding above and below, and one 1px
// divider. It was 57px with 10px padding and an 8px gap below it, until
// 24 September 2026 - see LAMP_BAND_PAD in 20-shell.js. The tile sets the height, so no text change can move it. This is
// master_design.html section 10's Law - the touch target sets the height.
//
// TWO TAP TARGETS
// The row goes to the room's view. The toggle switches the room's lights and
// stops the tap there, so a thumb on the lamp does not also change the view.
//
// THE BRIGHTNESS RING
// A 2px arc around the toggle, drawn from -90 degrees, that fills to the light
// group's brightness. The card it replaces drew it with a card_mod ::after
// rule. This card draws a real element instead, because a card_mod rule needs
// a card_mod to render it and this card has none. Since 2 October 2026 the arc
// is an SVG stroke (src/15-ring.js) and a lit toggle has a transparent border,
// because the conic arc stepped at DPR 1 and showed a second circle there
// (design-docs/brightness_ring_low_dpi_options.html, option 3).
//
// THE LEFT RAIL
// A 3px bar down the left edge of the row in the room's accent, at alpha 0.22
// when the room is dark and 0.60 when a light is on. master_design.html
// section 07 names it: the room carries its hue on the left rail and in its
// own icon tile. It was a card_mod ::before rule and is a real element here,
// for the same reason as the ring.
//
// Configuration:
//   heading     { icon, label }
//   rooms       one entry for each row, top to bottom:
//                 name         required. The household's word for the room
//                 icon         required. The tile glyph
//                 accent       required. The tile, its border and the glow
//                 light        required. The light or light group
//                 extra_lights a list of lights that are not in that group. They
//                              count in the lights line, the lit state and
//                              the toggle, and they move the wash
//                 temperature  a sensor. Omitted shows "--"
//                 humidity     a sensor. Omitted shows "--"
//                 tap_action   default { action: navigate, navigation_path: ... }
//                              is NOT supplied; give one or the row does not tap
//                 chip_color   the tile fill and border. Default: accent
//                 glow_color   the icon's drop shadow. Default: chip_color
//                 side_bar_color  the 3px left bar. Default: accent
//                 chips        extra counters on the lights line - see below
//                 humidity_range, humidity_colors  override the card's
//   side_bar_opacity [0.22, 0.60]. The left bar when the room is dark and
//                    when it is lit. false takes the rail away
//   humidity_range   [45, 65]. The dry and wet ends of the colour ramp
//   humidity_colors  three rgb triples: dry, middle, wet. The middle sits at
//                    0.55 of the ramp, which is where the card it replaces put
//                    it
//   toggle_color     255,190,120. The lit toggle, its ring and its glow
//   toggle_icon_color_on  #ffd9a0. The glyph inside a lit toggle
//   words            the lights line. See LAMP_ROOM_WORDS
//   plus every key of the shell - see 20-shell.js
//
// `entities` is not usually given: the wash reads the rooms' lights, in the
// order the rooms are listed, which is what the panel it replaces declared by
// hand. Give `entities` to read something else.
//
// A CHIP
// An extra counter on the lights line, for a thing the household wants to see
// from the Overview without opening the room:
//
//   chips:
//     - entities: [binary_sensor.bedroom_left_window_sensor_contact]
//       icon: mdi:window-open-variant
//       color: '60,200,235'
//
// The chip counts the entities that are `on` and hides itself at zero. With no `color`, a chip
// is orange 235,120,70, which means "attention". An open window is not an alarm, so the window
// chip is sky 60,200,235 (27 Sep 2026, option 12 of design-docs/popup_sheets_rework_options.html).

const LAMP_ROOM_WORDS = {
  none: 'dark',                 // no light in the group is on
  one: 'lit',                   // a group of one, and it is on
  both: 'both lit',             // a group of two, and both are on
  all: 'all {n} lit',           // every light of three or more
  some: '{on} of {n} lit',      // some of them
  unavailable: 'unavailable'    // the group is not in the state machine
};

const LAMP_ROOM_COLORS = LAMP_MEANINGS.humidity.ramp;

// Where the middle colour sits on the ramp. The card this replaces used 0.55
// and the value is not configurable, because a third stop that moves is two
// decisions to explain and nobody has needed the first one.
const LAMP_ROOM_BREAK = 0.55;

class LampRooms extends LampShell {

  static getStubConfig() {
    return {
      heading: { icon: 'mdi:home-thermometer-outline', label: 'Rooms' },
      accent: '255,146,28', rooms: []
    };
  }

  _setup(config) {
    if (!Array.isArray(config.rooms) || !config.rooms.length) {
      throw new Error('lamplight-rooms needs a `rooms` list');
    }
    const ramp = lampOpt('rooms', config, 'humidity_range');
    const colors = config.humidity_colors || LAMP_ROOM_COLORS;
    this._rooms = config.rooms.map(function (r) {
      if (!r.name) throw new Error('every room needs a name');
      if (!r.light) throw new Error('every room needs a light: ' + r.name);
      if (!r.accent) throw new Error('every room needs an accent: ' + r.name);
      const accent = lampColour(r.accent, 'soft');
      const chip = r.chip_color ? lampColour(r.chip_color, 'soft') : accent;
      return {
        name: r.name,
        icon: r.icon || 'mdi:home-outline',
        accent: accent,
        chip: chip,
        glow: r.glow_color ? lampColour(r.glow_color, 'soft') : chip,
        rail: r.side_bar_color ? lampColour(r.side_bar_color, 'soft') : accent,
        light: r.light,
        extra: r.extra_lights || [],
        temperature: r.temperature || null,
        humidity: r.humidity || null,
        tap: r.tap_action || null,
        ramp: r.humidity_range || ramp,
        colors: r.humidity_colors || colors,
        chips: (r.chips || []).map(function (c) {
          return {
            entities: c.entities || [],
            icon: c.icon || 'mdi:alert-circle-outline',
            color: lampColour(c.color || LAMP_MEANINGS.attention.mark, 'soft'),
            on: c.state || 'on'
          };
        })
      };
    });
    // The wash reads the rooms' lights unless the configuration names others.
    if (!config.entities) {
      this._entities = [].concat.apply([], this._rooms.map(function (r) {
        return [r.light].concat(r.extra);
      }));
    }
    this._railAlpha = config.side_bar_opacity === false ? null
                    : lampOpt('rooms', config, 'side_bar_opacity');
    this._toggleAccent = lampColour(lampOpt('rooms', config, 'toggle_color'), 'soft');
    this._toggleIconOn = lampOpt('rooms', config, 'toggle_icon_color_on');
    const w = config.words || {};
    this._words = {};
    const self = this;
    Object.keys(LAMP_ROOM_WORDS).forEach(function (k) {
      self._words[k] = w[k] !== undefined ? w[k] : LAMP_ROOM_WORDS[k];
    });
  }

  getCardSize() { return 1 + this._rooms.length; }

  // The card fills with light as the lights come on (THE ROOM FILL in 10-wash.js).
  _fillFraction() { return lampActivity(this._hass, this._entities).f; }

  // ---- the data ----------------------------------------------------------

  // The members of a light group. A light that is not a group counts as its
  // own one member, so a single bulb reads "lit" instead of "dark".
  _members(room) {
    const s = this._hass && this._hass.states[room.light];
    if (!s) return null;
    const m = s.attributes && s.attributes.entity_id;
    const own = (m && m.length) ? m : [room.light];
    return room.extra.length ? own.concat(room.extra.filter(function (e) {
      return own.indexOf(e) < 0;
    })) : own;
  }

  // The light that sets the toggle and the ring: the group when it is on,
  // else the first extra light that is on, else the group.
  _source(room) {
    const st = this._hass && this._hass.states;
    const g = st && st[room.light];
    if (!st || (g && g.state === 'on')) return g;
    const e = room.extra.filter(function (id) { return st[id] && st[id].state === 'on'; })[0];
    return e ? st[e] : g;
  }

  _lit(room) {
    const m = this._members(room);
    if (!m) return null;
    const hass = this._hass;
    const on = m.filter(function (e) {
      const st = hass.states[e];
      return st && st.state === 'on';
    }).length;
    return { on: on, n: m.length };
  }

  _summary(room) {
    const c = this._lit(room);
    if (!c) return this._words.unavailable;
    if (c.on === 0) return this._words.none;
    if (c.on === c.n) {
      if (c.n === 1) return this._words.one;
      if (c.n === 2) return this._words.both;
      return this._words.all.replace('{n}', c.n);
    }
    return this._words.some.replace('{on}', c.on).replace('{n}', c.n);
  }

  _number(entityId) {
    const s = this._hass && this._hass.states[entityId];
    const v = s ? parseFloat(s.state) : NaN;
    return isNaN(v) ? null : v;
  }

  // The humidity colour. Two straight lines through three stops, with the
  // middle stop at LAMP_ROOM_BREAK of the ramp.
  _humidityColour(h, room) {
    const lo = room.ramp[0], hi = room.ramp[1];
    const f = Math.max(0, Math.min(1, (h - lo) / (hi - lo)));
    const A = room.colors[0], B = room.colors[1], C = room.colors[2];
    const k = LAMP_ROOM_BREAK;
    const p = f <= k
      ? A.map(function (v, i) { return v + (B[i] - v) * (f / k); })
      : B.map(function (v, i) { return v + (C[i] - v) * ((f - k) / (1 - k)); });
    return 'rgb(' + p.map(function (v) { return Math.round(v); }).join(',') + ')';
  }

  // The state the card draws. Compared with the last one, so a state change
  // somewhere else in the house writes nothing.
  _signature() {
    const self = this;
    return JSON.stringify(this._rooms.map(function (r) {
      const s = self._source(r);
      return [
        self._lit(r),
        s ? s.attributes.brightness : null,
        s ? s.state : null,
        r.temperature ? self._number(r.temperature) : null,
        r.humidity ? self._number(r.humidity) : null,
        r.chips.map(function (c) {
          return c.entities.filter(function (e) {
            const st = self._hass && self._hass.states[e];
            return st && st.state === c.on;
          }).length;
        })
      ];
    }));
  }

  // ---- the card ----------------------------------------------------------

  _build() {
    const eb = this._config.heading || {};
    this._body.appendChild(lampEyebrow(eb.icon || 'mdi:home-thermometer-outline',
                                       eb.label || 'Rooms'));
    const self = this;
    this._parts = this._rooms.map(function (r) { return self._row(r); });
    this._sig = null;
    if (this._hass) this._onHass(this._hass);
  }

  _onHass() {
    if (!this._parts) return;
    const sig = this._signature();
    if (sig === this._sig) return;      // nothing the card shows has moved
    this._sig = sig;
    const self = this;
    this._rooms.forEach(function (r, i) { self._update(r, self._parts[i]); });
  }

  // Build one row and return the parts of it that change.
  _row(room) {
    const row = document.createElement('div');
    // overflow:hidden is what Home Assistant's own ha-card does, and the row
    // this replaces was one. It clips the last 1.5px of the lit toggle's
    // 14px glow at the top and bottom edge of the row. Nothing else in the
    // row reaches the edge: the brightness ring stops 8.5px inside it.
    // Each row is a band. See LAMP_BAND_PAD in 20-shell.js.
    row.setAttribute('data-lamp-band', '');
    row.style.cssText = 'position:relative;overflow:hidden;display:grid;align-items:center;' +
      'grid-template-areas:"i n t g" "i s h g";' +
      'grid-template-columns:auto 1fr auto auto;' +
      'column-gap:13px;row-gap:3px;padding:' + (10 + LAMP_BAND_PAD) + 'px 16px;' +
      'border-top:1px solid rgba(255,255,255,0.05)';

    // The left rail. It is absolute, so it is not a grid item and adds no
    // track. left and top resolve against the padding box, which starts
    // below the 1px divider - the same place the ::before it replaces sat.
    let rail = null;
    if (this._railAlpha) {
      rail = document.createElement('div');
      rail.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:3px;' +
        'pointer-events:none';
      row.appendChild(rail);
    }

    // i - the icon tile
    const tile = document.createElement('div');
    // overflow:hidden keeps the icon's 6px glow inside the tile. button-card's
    // img_cell clips by default and the card this replaces relied on it. Left
    // visible, the glow lights about 4px of the panel ground all round the
    // tile - a warm halo on 5,108 pixels that no computed style shows.
    // Measured 20 September 2026.
    tile.style.cssText = 'grid-area:i;width:34px;height:34px;border-radius:11px;' +
      'overflow:hidden;display:flex;align-items:center;justify-content:center;' +
      'align-self:center;justify-self:start;position:relative;' +
      'background:rgba(' + room.chip + ',0.12);' +
      // The lit edge (17-edge.js) takes the border's place: 1px of padding keeps the 36px.
      'border:none;padding:1px';
    const tileIcon = document.createElement('ha-icon');
    tileIcon.setAttribute('icon', room.icon);
    tileIcon.style.cssText = '--mdc-icon-size:19px;width:19px;height:19px;margin:0;' +
      'display:flex;align-items:center;justify-content:center;line-height:0;' +
      'color:rgb(' + room.accent + ');' +
      'filter:drop-shadow(0 0 6px rgba(' + room.glow + ',0.55))';
    tile.appendChild(tileIcon);
    lampEdgePaint(lampEdge(tile, '11px'), room.chip, LAMP_EDGE.lit);
    row.appendChild(tile);

    // n - the name
    const name = document.createElement('div');
    // The name clips with an ellipsis, the way button-card's .ellipsis wrapper
    // did. Without it a long room name pushes the temperature off a 375px
    // phone. It also clips one antialiasing pixel off the right of the word,
    // which is how the difference was found.
    name.style.cssText = 'grid-area:n;justify-self:start;align-self:baseline;' +
      'display:flex;align-items:center;font-size:var(--lamplight-t-name);font-weight:600;' +
      'letter-spacing:-0.01em;color:#ffffff;line-height:1.25;' +
      'min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    name.textContent = room.name;
    row.appendChild(name);

    // s - the lights line, and any chips
    const lights = document.createElement('div');
    lights.style.cssText = 'grid-area:s;justify-self:start;align-self:baseline;' +
      'display:flex;align-items:center;gap:6px;font-size:var(--lamplight-t-state);' +
      'color:var(--lamplight-ink-soft);font-variant-numeric:tabular-nums;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    const summary = document.createElement('span');
    lights.appendChild(summary);
    const chips = room.chips.map(function (c) {
      const el = document.createElement('span');
      el.style.cssText = 'display:none;align-items:center;gap:4px;' +
        'color:rgb(' + c.color + ')';
      const ic = document.createElement('ha-icon');
      ic.setAttribute('icon', c.icon);
      ic.style.cssText = '--mdc-icon-size:12px;width:12px;height:12px;margin:0;' +
        'display:flex;align-items:center;justify-content:center;line-height:0';
      // A text node, not a span. The live card puts the count straight on the
      // chip and an extra element would sit in the DOM for nothing.
      const n = document.createTextNode('');
      el.appendChild(ic);
      el.appendChild(n);
      lights.appendChild(el);
      return { el: el, n: n };
    });
    row.appendChild(lights);

    // t - the temperature
    // THE TWO COLUMNS SHARE TWO BASELINES. The temperature sat on the bottom
    // of its track and the humidity on the top of its track, so the right
    // column was 2px lower than the name and 2px higher than the lights line.
    // The four texts now use grid baseline alignment: the temperature is on
    // the name's baseline and the humidity is on the lights line's baseline.
    // The name and the lights line did not move, and the row stays 57px.
    // Measured 24 September 2026 at 375 x 812, Lamplight 0.15.2-dev.
    const temp = document.createElement('div');
    temp.style.cssText = 'grid-area:t;justify-self:end;align-self:baseline;' +
      'display:flex;align-items:baseline;justify-content:flex-end;' +
      'font-size:var(--lamplight-t-inline);font-weight:500;letter-spacing:-0.01em;color:#ffffff;' +
      'font-variant-numeric:tabular-nums;line-height:1;white-space:nowrap';
    const tempValue = document.createTextNode('');
    const degree = document.createElement('i');
    degree.textContent = '°';
    degree.style.cssText = 'font-style:normal;font-size:var(--lamplight-t-caption);font-weight:500;letter-spacing:0;' +
      'color:var(--lamplight-ink-quiet);margin-left:1px';
    temp.appendChild(tempValue);
    temp.appendChild(degree);
    row.appendChild(temp);

    // h - the humidity
    const hum = document.createElement('div');
    // align-items:baseline gives the flex box the baseline of its digits. With
    // center, the drop is the first item and has no text, so the box would
    // take the drop's lower edge as its baseline. The drop stays centred.
    hum.style.cssText = 'grid-area:h;justify-self:end;align-self:baseline;' +
      'display:flex;align-items:baseline;gap:3px;font-size:var(--lamplight-t-state);font-weight:400;' +
      'font-variant-numeric:tabular-nums;line-height:1;white-space:nowrap';
    const humIcon = document.createElement('ha-icon');
    humIcon.setAttribute('icon', 'mdi:water');
    humIcon.style.cssText = '--mdc-icon-size:12px;width:12px;height:12px;margin:0;' +
      'display:flex;align-items:center;justify-content:center;line-height:0;' +
      'align-self:center';
    const humValue = document.createTextNode('');
    hum.appendChild(humIcon);
    hum.appendChild(humValue);
    row.appendChild(hum);

    // g - the toggle
    const slot = document.createElement('div');
    slot.style.cssText = 'grid-area:g;align-self:center;justify-self:end;' +
      'width:32px;height:32px';
    const toggle = document.createElement('div');
    // box-sizing matters here. The 1px border must sit inside the 32px, the
    // way Home Assistant's own ha-card does it. Left at content-box the
    // toggle is 34px and overflows its grid column by 2px. Measured against
    // the live card, 20 September 2026.
    toggle.style.cssText = 'box-sizing:border-box;position:relative;' +
      'width:32px;height:32px;' +
      'border-radius:50%;display:flex;align-items:center;justify-content:center;' +
      'overflow:visible;cursor:pointer';
    // The ring is a real element and not an ::after, so it is in the DOM and
    // can be read. It is an SVG with a 2px arc at the outer edge of a circle
    // that sits 4px outside the toggle (src/15-ring.js).
    const ring = lampRingCreate();
    const toggleIcon = document.createElement('ha-icon');
    toggleIcon.style.cssText = '--mdc-icon-size:15px;width:15px;height:15px;margin:0;' +
      'display:flex;align-items:center;justify-content:center;line-height:0';
    toggle.appendChild(ring);
    toggle.appendChild(toggleIcon);
    slot.appendChild(toggle);
    row.appendChild(slot);

    // The row goes to the room. The toggle switches the lights and stops
    // there, so one thumb does not do both.
    const self = this;
    if (room.tap) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', function () { self._tap(room); });
    }
    toggle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      // One command for the whole room, so the lights do not part: all off when
      // any is lit, else all on.
      const src = self._source(room);
      const lit = !!(src && src.state === 'on');
      self._hass.callService('light', lit ? 'turn_off' : 'turn_on',
                             { entity_id: [room.light].concat(room.extra) });
    });

    this._body.appendChild(row);
    return { row: row, rail: rail, summary: summary, chips: chips, tempValue: tempValue,
             hum: hum, humValue: humValue, toggle: toggle, ring: ring,
             toggleIcon: toggleIcon };
  }

  _tap(room) {
    const a = room.tap;
    if (a.action === 'navigate' && a.navigation_path) {
      history.pushState(null, '', a.navigation_path);
      this.dispatchEvent(new Event('location-changed',
        { bubbles: true, composed: true }));
      return;
    }
    if (a.action === 'more-info') {
      this._moreInfo(a.entity || room.light);
      return;
    }
    if (a.action === 'call-service' || a.action === 'perform-action') {
      const call = a.perform_action || a.service || '';
      const bits = call.split('.');
      if (bits.length === 2) {
        this._hass.callService(bits[0], bits[1], a.data || {}, a.target || {});
      }
    }
  }

  // ---- the state ---------------------------------------------------------

  _update(room, p) {
    const said = this._summary(room);
    p.summary.textContent = said;
    // The household's words lead a lit row (type_rank_options.html, option 2).
    p.summary.style.color = /lit$/.test(said) ? 'var(--lamplight-ink-mid)' : '';

    room.chips.forEach(function (c, i) {
      const hass = this._hass;
      const n = c.entities.filter(function (e) {
        const st = hass && hass.states[e];
        return st && st.state === c.on;
      }).length;
      p.chips[i].n.nodeValue = String(n);
      p.chips[i].el.style.display = n > 0 ? 'flex' : 'none';
    }, this);

    const t = room.temperature ? this._number(room.temperature) : null;
    p.tempValue.textContent = t === null ? '--' : t.toFixed(1);

    const h = room.humidity ? this._number(room.humidity) : null;
    if (h === null) {
      p.humValue.textContent = '--';
      p.hum.style.color = 'rgba(255,255,255,0.30)';
    } else {
      p.humValue.textContent = Math.round(h) + '%';
      p.hum.style.color = this._humidityColour(h, room);
    }

    const s = this._source(room);
    const on = !!(s && s.state === 'on');
    const T = this._toggleAccent;
    if (p.rail) {
      p.rail.style.background = 'rgba(' + room.rail + ',' +
        this._railAlpha[on ? 1 : 0] + ')';
    }
    p.toggleIcon.setAttribute('icon', on ? 'mdi:lightbulb-on' : 'mdi:lightbulb-outline');
    p.toggleIcon.style.color = on ? this._toggleIconOn : 'rgba(255,255,255,0.45)';
    p.toggle.style.background = on ? 'rgba(' + T + ',0.18)' : 'rgba(255,255,255,0.055)';
    // A lit toggle keeps the 1px width but shows no border: the ring is the
    // only circle (2 October 2026).
    p.toggle.style.border = on ? '1px solid transparent'
                               : '1px solid rgba(255,255,255,0.12)';
    p.toggle.style.boxShadow = on ? '0 0 14px -2px rgba(' + T + ',0.55)' : 'none';

    if (!on) { lampRingPaint(p.ring, null); return; }
    // The same arithmetic as the Jinja it replaces: brightness out of 255 as
    // a whole percent, and a light with no brightness reads zero.
    const b = s.attributes.brightness;
    const pct = b === undefined || b === null ? 0 : Math.round(b / 255 * 100);
    lampRingPaint(p.ring, pct, T, 0.85);
  }
}

customElements.define('lamplight-rooms', LampRooms);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-rooms',
  name: 'Lamplight Rooms',
  description: 'One row for each room: lights, temperature and humidity.',
  preview: false
});
