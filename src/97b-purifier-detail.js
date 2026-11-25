// lamplight-purifier-detail. The air purifier pop-up body.
//
// THE DECISION (24 Oct 2026, design-docs/air_purifier_options.html, option A without C)
// The row in the Climate panel (lamplight-row, kind fan) turns the purifier on and off and gives
// the mode, the air and a low filter in one line. This sheet holds the rest: the PM2.5 figure
// as the hero, one lead sentence, the mode as four buttons, and each filter as a row with a
// meter and the time to its next job.
//
// THE SHAPE follows every other body: a 44px hero, a 15px lead, then 10.5px labels over 14px
// rows with 12.5px detail. The filter row is the battery sheet's row (name, 84px meter,
// percentage), with the battery bands: green above 39%, yellow to 21%, orange at 20% and under.
// The sheet adds no colour.
//
// WHAT IT LEAVES OUT. Medium, manual speed and the off-timer: the household named no moment
// for them. Temperature and humidity: the purifier reads its own warm inside, 24.1 against the
// room's 18.2 on 24 Oct 2026, and the Climate panel above already shows the room's real
// figures. A pop-up body has no panel, so this extends HTMLElement, not LampShell.
//
// Configuration:
//   entity        the fan. Required
//   air_sensor    a PM2.5 sensor in ug/m3. Omitted, the hero is the mode
//   air_label     the name after the unit on the hero. Default 'PM2.5'; '' shows the unit
//                 only. Without it, "1 µg/m³" did not say what it measures (critique F18)
//   air_quality_limits  as for lamplight-row. Default [12, 35, 55]
//   air_quality_labels  as for lamplight-row. Default ['clean', 'fair', 'poor', 'very poor']
//   accent        the selected mode's colour, "r,g,b". Default 250,152,30. Pass the room accent
//   modes         the preset buttons after Off. Default ['auto', 'sleep', 'turbo']
//   filters       [{ entity, name, job: clean | replace }]. The sheet shows `sheet_name`
//                 when it is given, so the row can say "filter" and the sheet "NanoProtect filter"
//   filter_thresholds { replace_soon: 20, worth_noticing: 39 }

const LAMP_PUR_BAND_RGB = LAMP_MEANINGS.filter;

const LAMP_PUR_CSS = '<style>' +
  '.pu{font-family:var(--primary-font-family, Roboto, Noto, sans-serif);color:#fff;line-height:1.25}' +
  '.pu-hero{font-size:var(--lamplight-t-display);font-weight:300;letter-spacing:-.02em;line-height:1;color:var(--lamplight-ink-strong)}' +
  '.pu-hero small{font-size:var(--lamplight-t-name);font-weight:400;letter-spacing:0;color:var(--lamplight-ink-soft);margin-left:6px}' +
  '.pu-lead{font-size:var(--lamplight-t-name);line-height:1.5;color:var(--lamplight-ink-mid);margin-top:12px}' +
  '.pu-lead b{font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.pu-lbl{font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--lamplight-ink-quiet);padding:26px 2px 10px;line-height:1}' +
  '.pu-modes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}' +
  '.pu-mode{box-sizing:border-box;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;' +
    'font-size:var(--lamplight-t-body);font-weight:500;color:var(--lamplight-ink-mid);background:rgba(255,255,255,.05);' +
    'border:1px solid rgba(255,255,255,.08);cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}' +
  '.pu-mode:focus-visible{outline:2px solid rgba(255,255,255,.4);outline-offset:2px}' +
  '.pu-mode[aria-disabled=true]{opacity:.4;cursor:default}' +
  '.pu-row{display:grid;grid-template-columns:1fr 84px 40px;align-items:center;gap:12px;padding:6px 2px;min-height:46px;box-sizing:border-box}' +
  '.pu-row .nm{font-size:var(--lamplight-t-body);color:var(--lamplight-ink-mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.pu-row .dt{font-size:var(--lamplight-t-state);color:var(--lamplight-ink-quiet);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.pu-row .vv{font-size:var(--lamplight-t-body);text-align:right;font-variant-numeric:tabular-nums;font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.pu-row .vv b{font-weight:400;font-size:var(--lamplight-t-caption);color:var(--lamplight-ink-quiet)}' +
  '.pu-meter{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}' +
  '.pu-meter i{display:block;height:100%;border-radius:2px}' +
  '</style>';

function lampPurBand(v, t) {
  return v <= t.alert ? 'alert' : v <= t.notice ? 'notice' : 'hand';
}

function lampPurEsc(x) {
  return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

class LampPurifierDetail extends HTMLElement {

  static getStubConfig() {
    return { entity: '', air_sensor: '', filters: [] };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error('lamplight-purifier-detail needs an `entity`');
    this._entity = config.entity;
    this._airSensor = config.air_sensor || null;
    this._airLabel = String(lampOpt('purifier-detail', config, 'air_label'));
    this._airBands = config.air_quality_limits || null;
    this._airWords = config.air_quality_labels || null;
    this._modes = lampOpt('purifier-detail', config, 'modes');
    this._filters = config.filters || [];
    this._t = lampBattLimits(config.filter_thresholds, LAMP_DEFAULTS['purifier-detail'].filter_thresholds);
    this._accent = lampColour(config.accent || 'marigold', 'deep');
    this._key = null;
    this._render();
  }

  set hass(hass) { this._hass = hass; this._update(); }

  getCardSize() { return 4; }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    const card = document.createElement('ha-card');
    // The flat shell of every pop-up body: the sheet sits on the pop-up ground.
    [['background', 'transparent'], ['border', 'none'], ['border-radius', '0'],
     ['box-shadow', 'none'], ['backdrop-filter', 'none'], ['-webkit-backdrop-filter', 'none']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    card.style.padding = '2px 2px 8px';
    card.style.boxSizing = 'border-box';
    card.style.display = 'block';
    card.style.textAlign = 'left';
    this._body = document.createElement('div');
    this._body.className = 'pu';
    // The selected mode takes the sheet's accent, at the tile's fill and border alphas x 2.
    this._body.style.setProperty('--pu-on-bg', 'rgba(' + this._accent + ',0.22)');
    this._body.style.setProperty('--pu-on-bd', 'rgba(' + this._accent + ',0.5)');
    card.appendChild(this._body);
    this.shadowRoot.innerHTML = LAMP_PUR_CSS;
    this.shadowRoot.appendChild(card);

    // One handler for the mode buttons, which are drawn again on each change.
    const self = this;
    const act = function (ev) {
      const b = ev.target.closest && ev.target.closest('.pu-mode');
      if (!b || b.getAttribute('aria-disabled') === 'true' || !self._hass) return;
      if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      const m = b.dataset.mode;
      if (m === 'off') self._hass.callService('fan', 'turn_off', { entity_id: self._entity });
      else self._hass.callService('fan', 'set_preset_mode', { entity_id: self._entity, preset_mode: m });
    };
    this._body.addEventListener('click', act);
    this._body.addEventListener('keydown', act);
  }

  _update() {
    if (!this._hass || !this._body) return;
    const h = this._hass;
    const s = h.states[this._entity];
    const ids = [this._airSensor].concat(this._filters.map(function (f) { return f && f.entity; }));
    const key = (s ? s.state + ':' + (s.attributes.preset_mode || '') : '-') + '|' +
      ids.map(function (id) {
        const x = id && h.states[id];
        return x ? x.state + ':' + (x.attributes.time_remaining || '') : '-';
      }).join(',');
    if (key === this._key) return;
    this._key = key;
    this._body.innerHTML = this._html(s);
  }

  _html(s) {
    const gone = !s || s.state === 'unavailable' || s.state === 'unknown';
    const on = !gone && s.state === 'on';
    const v = lampAirValue(this._hass, this._airSensor);
    const word = v === null ? null : lampAirWord(v, this._airBands, this._airWords);

    // The hero: the air, because "is the air bad" is what the sheet is opened for.
    const hero = v !== null
      ? "<div class='pu-hero'>" + Math.round(v) + '<small>µg/m³' +
        (this._airLabel ? ' ' + lampPurEsc(this._airLabel) : '') + '</small></div>'
      : "<div class='pu-hero'>" + (gone ? '--' : (on ? lampPurEsc(lampFanMode(s)) : 'Off')) + '</div>';

    // The lead: the answer first, then what the purifier does about it.
    let lead = word ? '<b>The air is ' + lampPurEsc(word) + '.</b> ' : '';
    if (gone) lead += 'The purifier is not answering.';
    else if (!on) lead += 'The purifier is off.';
    else lead += lampPurEsc(lampFanMode(s)) + ' is running.';

    const cur = gone ? null : (on ? (s.attributes.preset_mode || null) : 'off');
    const btn = function (mode, label) {
      return "<div class='pu-mode' role='button' tabindex='0' data-mode='" + lampPurEsc(mode) + "'" +
        (gone ? " aria-disabled='true'" : '') + " aria-pressed='" + (cur === mode) + "'" +
        (cur === mode ? " style='color:#fff;background:var(--pu-on-bg);border-color:var(--pu-on-bd)'" : '') +
        '>' + lampPurEsc(label) + '</div>';
    };
    const modes = "<div class='pu-lbl'>Mode</div><div class='pu-modes' style='grid-template-columns:repeat(" +
      (this._modes.length + 1) + ",1fr)'>" + btn('off', 'Off') +
      this._modes.map(function (m) { return btn(m, m.charAt(0).toUpperCase() + m.slice(1)); }).join('') + '</div>';

    const t = this._t;
    const list = lampFilterList(this._hass, this._filters, t.alert);
    const rows = list.map(function (f) {
      const c = f.cfg;
      const band = lampPurBand(f.v, t);
      const when = lampFilterWhen(f.hours);
      const verb = f.job === 'clean' ? 'Clean' : 'Replace';
      const detail = when ? verb + ' ' + when : '';
      return "<div class='pu-row'><div style='min-width:0'><div class='nm'>" + lampPurEsc(c.sheet_name || f.name) +
        '</div>' + (detail ? "<div class='dt'" + (band === 'alert' ? " style='color:rgb(" + LAMP_ALERT_RGB + ")'" : '') +
        '>' + lampPurEsc(detail) + '</div>' : '') + '</div>' +
        "<span class='pu-meter'><i style='width:" + Math.max(2, Math.round(f.v)) + '%;background:rgb(' +
        LAMP_PUR_BAND_RGB[band] + ")'></i></span>" +
        "<span class='vv'" + (band === 'alert' ? " style='color:rgb(" + LAMP_ALERT_RGB + ")'" : '') + '>' +
        Math.round(f.v) + '<b>%</b></span></div>';
    }).join('');

    return hero + "<div class='pu-lead'>" + lead + '</div>' + modes +
      (rows ? "<div class='pu-lbl'>Filters</div>" + rows : '');
  }
}

customElements.define('lamplight-purifier-detail', LampPurifierDetail);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-purifier-detail',
  name: 'Lamplight Purifier Detail',
  description: 'The air purifier pop-up body: the air as the hero, the mode as buttons, and each filter with a meter and the time to its next job.',
  preview: false
});
