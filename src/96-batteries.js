// lamplight-batteries and lamplight-battery-strip. The Batteries pop-up body, and the footer tile on
// Overview that opens it.
//
// At 100% the figure is "100%" with no unit and the words are "All at full" (10 Oct 2026,
// design-docs/windows_panel_warning_options.html, option 18).
//
// THE FOOTER PANEL (1 Oct 2026, option 8 of design-docs/overview_batteries_windows_options.html)
// lamplight-battery-strip is a small panel (LampFootPanel, src/21-strip.js), half the width of the
// view and 128px high: an eyebrow, the lowest level as the figure ("46% lowest"), and one line
// of words, by the ladder in lampBattWords, so the line never wraps. At rest the words name
// the lowest battery ("Lounge dimmer"). When a battery is at or under `alert`, the figure
// turns orange ("12% replace") and the words name it with the count. Since 7 Oct 2026
// (option 1 "Lamplight", design-docs/overview_footer_rework_options.html) the panel has a
// glass lamp in the top right corner and the light is centred on it. The lamp and the light
// take the lowest battery's band colour. The strength is LAMP_BATT_LAMP_S, and the lamp
// shows the battery glyph of the lowest level. From 29 Sep to 1 Oct 2026 it was an 84px
// LampStrip tile with a meter (option 13). `icon` is still an accepted key; it is ignored.
//
// WHAT THESE REPLACE
// The `#batteries` pop-up's button-card body (10,719 characters) and the footer row button-
// card on Overview (3,288 characters) that navigates to it. Both read the same list - every
// sensor.* entity with device_class battery, minus an exclusion list, with a name/model
// override map - so the list-building is one function, lampBatteryList, and each card draws
// its own shape from it. This is shared logic, not a shared card: the pop-up body and the
// footer row are different roles with different HTML, the same distinction lamplight-day and
// lamplight-weather keep although both read a forecast.
//
// PORTABILITY
// The live household writes 14 entity IDs into an exclusion list (three phone/watch battery
// sensors HA reports that are not physical devices to replace) and a name/model map (13
// entries, because "Hue dimmer switch bedroom battery" reads better as "Bedroom dimmer" with
// "Hue dimmer switch" underneath). Both are configuration here, not defaults: a stranger who
// gives neither still gets every battery-class sensor, named from its own friendly name with
// " Battery" trimmed off the end - the same fallback the live template used for anything not
// in its map.
//
// Configuration (lamplight-batteries and lamplight-battery-strip share these):
//   exclude       entity IDs to leave out entirely. Default []
//   names         { entity_id: { name, model } }. Default {}
//   categories    { model: plural-free category word, e.g. "Hue dimmer switch": "dimmer" }.
//                 Used in the pop-up's "at full" fold and in the footer tile's text ladder.
//                 Default {} - falls back to the model string itself, lower-cased
//   thresholds    { replace_soon: 20, worth_noticing: 39, fine: 99 }. A reading at or under
//                 `replace_soon` is "Replace soon"; at or under `worth_noticing`, "Worth noticing";
//                 at or under `fine`, "Fine"; above `fine`, folded as "at full"
//
// lamplight-battery-strip only:
//   tap_action    default { action: navigate, navigation_path: '#batteries' }
//   icon          accepted, ignored (the eyebrow always shows mdi:battery-60)
//
// `names` may also give a `short` value beside `name` and `model` - a shorter name for the
// tile's text ladder when the full name does not fit (see lampBattWords below).

// The band limits as the code reads them: alert, notice and hand. The config names are
// replace_soon, worth_noticing and fine. A key that is missing takes the default.
function lampBattLimits(t, base) {
  const d = base || LAMP_DEFAULTS.batteries.thresholds, c = t || {};
  const out = {};
  [['alert', 'replace_soon'], ['notice', 'worth_noticing'], ['hand', 'fine']].forEach(function (k) {
    const v = c[k[1]] !== undefined ? c[k[1]] : d[k[1]];
    if (v !== undefined) out[k[0]] = v;
  });
  return out;
}

// The list every battery card in this file reads. Sorted ascending by reading, so the lowest
// battery is always first - the live template's own order.
function lampBatteryList(hass, exclude, names) {
  const ex = exclude || [];
  const nm = names || {};
  const list = [];
  Object.keys(hass.states).forEach(function (id) {
    if (id.indexOf('sensor.') !== 0) return;
    const s = hass.states[id];
    if (!s || s.attributes.device_class !== 'battery') return;
    if (ex.indexOf(id) >= 0) return;
    const v = parseFloat(s.state);
    if (isNaN(v)) return;
    const meta = nm[id] || {};
    // The household's text or name parts first (01-entity.js). Else the device name (HA 2026.4
    // and later). Else the old way: `friendly_name` without its " Battery" word.
    const name = lampNameText(meta.name) ||
      lampHaName(hass, s, lampNameParts(meta.name) || { type: 'device' }) ||
      (s.attributes.friendly_name || id).replace(/ Battery( level)?$/i, '');
    list.push({ id: id, v: v, n: name, m: meta.model || '', s: meta.short || '' });
  });
  list.sort(function (a, b) { return a.v - b.v || (a.n < b.n ? -1 : 1); });
  return list;
}

// ---- lamplight-battery-strip: the footer tile -----------------------------------------------

const LAMP_BATT_TILE_RGB = LAMP_MEANINGS.battery;

// The strength of the foot panel's light and edge, by the band of the lowest battery.
const LAMP_BATT_LAMP_S = { alert: 1, notice: 0.6, hand: 0.3, full: 0.3 };

// THE BATTERY GAUGE (option 4 of design-docs/footer_refresh_options.html, 25 Nov 2026, 0.152.0-dev).
// An outline battery, 30 x 52 units (shown at 75%, LAMP_GAUGE_SCALE in src/21-strip.js), filled to the level of the lowest battery in its band colour. The
// fill is lighter at the top, with a bright line at the top of the charge and a soft glow of its own
// colour that grows with the strength s. The empty part is a faint glass. The panel's light is
// centred on the top of the charge, so it drops as the charge drops. `id` makes the svg ids unique,
// `rgb` is the band colour, `s` the strength, `v` the level 0 to 1 (null: no reading, no fill).
const LAMP_BATT_GAUGE = { w: 30, h: 52, top: 8.5, inner: 40 };

function lampBattGauge(id, rgb, s, v) {
  const G = LAMP_BATT_GAUGE, ink = lampMix(rgb, '255,255,255', 0.5);
  const lv = v === null ? 0 : Math.max(0, Math.min(1, v));
  // A battery at 1% still shows a line of charge.
  const h = lv > 0 ? Math.max(1.2, G.inner * lv) : 0, top = G.top + G.inner - h;
  const fill = !h ? '' :
    '<g clip-path="url(#' + id + 'c)" style="filter:drop-shadow(0 0 6px rgba(' + rgb + ',' + (0.30 + 0.40 * s).toFixed(2) + '))">' +
    '<rect x="4.25" y="' + top.toFixed(2) + '" width="21.5" height="' + h.toFixed(2) + '" fill="url(#' + id + 'f)"/>' +
    '<rect x="4.25" y="' + top.toFixed(2) + '" width="21.5" height="1" fill="rgb(' + lampMix(rgb, '255,255,255', 0.75) + ')"/></g>';
  return {
    w: G.w, h: G.h, light: [G.w / 2, h ? top : G.top + G.inner],
    svg: '<svg viewBox="0 0 30 52" width="30" height="52" style="display:block;overflow:visible">' +
      '<defs><linearGradient id="' + id + 'f" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="rgb(' + lampMix(rgb, '255,255,255', 0.32) + ')" stop-opacity=".95"/>' +
      '<stop offset="1" stop-color="rgb(' + rgb + ')" stop-opacity=".62"/></linearGradient>' +
      '<clipPath id="' + id + 'c"><rect x="4.25" y="8.5" width="21.5" height="40" rx="4"/></clipPath></defs>' +
      '<rect x="10.5" y="1" width="9" height="4" rx="1.5" fill="rgba(' + ink + ',.72)"/>' +
      '<rect x="1.75" y="5.75" width="26.5" height="45.5" rx="6.5" fill="rgba(255,255,255,.025)" ' +
      'stroke="rgba(' + ink + ',.72)" stroke-width="1.5"/>' + fill + '</svg>'
  };
}

// The words ladder, longest-wanted first. `lowest` is list[0]; `lowCount` is how many
// batteries sit at or under `alert`. At rest (lowCount 0) the words name the lowest battery. Fitting-text.html cases: lamplight-cards/test/verify-
// strips-states.js proves the ten hard cases from "Fitting the words" in the design document.
function lampBattWords(lowest, lowCount, total, categories) {
  const cat = lowest.m ? (categories[lowest.m] || lowest.m.toLowerCase()) : null;
  if (!lowCount) {
    return [
      lowest.n,
      lowest.s || null,
      cat ? ('A ' + cat) : null,
      'Lowest of ' + total
    ].filter(function (x) { return x; });
  }
  const plus = lowCount > 1 ? (' +' + (lowCount - 1)) : '';
  return [
    lowest.n + plus,
    lowest.s ? (lowest.s + plus) : null,
    (lowCount === 1 && cat) ? ('A ' + cat) : null,
    lowCount + ' to replace'
  ].filter(function (x) { return x; });
}

class LampBatteryStrip extends LampFootPanel {

  static getStubConfig() {
    return { exclude: [], names: {} };
  }

  _defaultTap() { return { action: 'navigate', navigation_path: '#batteries' }; }

  _setup(config) {
    this._exclude = config.exclude || [];
    this._names = config.names || {};
    this._categories = config.categories || {};
    this._thresholds = lampBattLimits(config.thresholds);
    this._state = null;
    this._key = null;
  }

  _icon() { return 'mdi:battery-60'; }
  _label() { return 'Batteries'; }

  _buildContent(body) {
    this._figureAndWords(body);
    if (this._hass) { this._key = null; this._onHass(this._hass); }
  }

  _onHass(hass) {
    if (!this._fig) return;
    const list = lampBatteryList(hass, this._exclude, this._names);
    const key = JSON.stringify(list.map(function (x) { return x.id + ':' + x.v; }));
    if (key === this._key) return;
    this._key = key;
    if (!list.length) {
      this._setFigure('', '');
      this._registerFit(this._words, ['No readings']);
      this._words.style.color = 'rgba(255,255,255,.30)';
      this._state = { rgb: LAMP_FOOT_REST, s: 0, v: null };
      return;
    }
    const lowest = list[0];
    const band = lampBattBand(lowest.v, this._thresholds);
    const lowCount = list.filter(function (x) { return x.v <= this._thresholds.alert; }, this).length;
    const alert = band === 'alert';
    // Every battery at 100%: "100% lowest" measured 146px on the phone in a 139.5px line. The
    // figure loses the unit, and the words say what 100% lowest means. The figure draws at
    // display size only in the alert band (type_rank_options.html, option 2).
    const full = Math.round(lowest.v) >= 100;
    this._setFigure(Math.round(lowest.v) + '%', full ? '' : (alert ? 'replace' : 'lowest'),
      alert ? 'rgb(' + LAMP_MEANINGS.battery.alert + ')' : null, alert);
    this._words.style.color = 'var(--lamplight-ink-soft)';
    this._registerFit(this._words, full ? ['All at full']
      : lampBattWords(lowest, lowCount, list.length, this._categories));
    this._state = { rgb: LAMP_BATT_TILE_RGB[band], s: LAMP_BATT_LAMP_S[band], v: lowest.v / 100 };
  }

  _light() { return this._state || { rgb: LAMP_FOOT_REST, s: 0, v: null }; }

  _gauge() {
    const l = this._light();
    return lampGaugeScale(lampBattGauge(this._gid || 'lg', l.rgb, l.s || 0, l.v));
  }
}

customElements.define('lamplight-battery-strip', LampBatteryStrip);

// ---- lamplight-batteries: the pop-up body ---------------------------------------------------

// THE SHEET (24 Sep 2026, design-docs/battery_popup_colour_options.html, option D)
// The colour is the band, not a decoration. Until this date the sheet was a panel with the
// Climate panel's fixed blue fill (master design 4.3), which reported nothing, and each row drew
// the full-battery glyph at every level. Now the sheet sits on the pop-up ground like #today,
// each row has a meter in its band colour, and the hero has two states:
//   no battery at or under `alert`   a summary: the count, and the lowest battery as a row
//   one or more at or under `alert`  that battery: its level in orange, name, model and meter
// The alarm hero starts at `alert` (20%), not at `notice` as the old headline did, so orange
// means "buy a cell now". Household decision, 24 September 2026.
// Colours: green 78,200,130 (the comfort pill's "comfortable"), yellow 232,195,74 (the Day
// Card's yellow warning), orange 235,120,70. On the pop-up ground rgb(25,26,31) they measure
// 8.20, 10.20 and 6.04:1.
//
// THE SUMMARY (25 Sep 2026, design-docs/battery_hero_options.html, option C)
// Until this date the summary drew a 4px bar of the band mix under the count, with a key. The bar
// had the height, radius, colour and left-edge fill of a row meter, so it read as the lowest
// battery's meter (on the day, 6 of 13 filled 45.9% and the lowest read 46%). The key repeated the
// band eyebrows. Now the summary is the count and the lowest battery as a list row, under a
// "Lowest" label. The row leaves the list, as the alarm hero's battery does.
//
// ONE SCALE AND A LEAD (27 Sep 2026, option 5 of design-docs/popup_sheets_rework_options.html)
// The summary is the count and one 15px sentence that says what it means: "Nothing to replace.
// The lowest is the Lounge dimmer, at 46%." The "Lowest" row is gone, because the sentence names
// that battery, and the battery stays in its own band. The alarm hero keeps its layout. All
// pop-up bodies share five text sizes: 36 hero (44 until 1 Oct 2026), 15 lead, 14 row, 12.5 detail, 10.5 label.

const LAMP_BATT_BAND_RGB = LAMP_MEANINGS.battery;
// "Fine", not "On hand": "On hand" read as spare batteries (critique F17, 31 Oct 2026).
const LAMP_BATT_WORD = { alert: 'Replace soon', notice: 'Worth noticing', hand: 'Fine', full: 'At full' };

function lampBattBand(v, t) {
  return v <= t.alert ? 'alert' : v <= t.notice ? 'notice' : v <= t.hand ? 'hand' : 'full';
}

// The bars on the #batteries hero, from the sorted levels (design-docs/battery_hero_rework_options.html,
// 8 Nov 2026). Every battery has a bar while there are `max` (24) or fewer: 24 bars give a 5.9px pitch
// in the hero's 142px. Above that, every battery at or under `notice` keeps its bar, and the other
// places go to the healthier batteries, picked at equal steps by rank, so the first and the last of
// them always stay and the curve keeps its true shape. The count in the body stays the true count.
const LAMP_BATT_HERO_MAX = 24;
function lampBattHeroPick(levels, notice, max) {
  max = max || LAMP_BATT_HERO_MAX;
  if (levels.length <= max) return levels.slice();
  const low = levels.filter(function (v) { return v <= notice; });
  const hi = levels.filter(function (v) { return v > notice; });
  const slots = Math.max(0, max - low.length);
  const out = low.slice();
  for (let j = 0; j < slots; j++) out.push(hi[slots === 1 ? hi.length - 1 : Math.round(j * (hi.length - 1) / (slots - 1))]);
  return out;
}

const LAMP_BATT_CSS = '<style>' +
  '.bs{font-family:var(--primary-font-family, Roboto, Noto, sans-serif);color:#fff;line-height:1.25}' +
  '.bs-eb{display:flex;align-items:baseline;justify-content:space-between;padding:26px 2px 10px;line-height:1}' +
  '.bs-eb .l{font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--lamplight-ink-quiet);display:flex;align-items:center;gap:7px}' +
  '.bs-eb .l i{width:6px;height:6px;border-radius:50%}' +
  '.bs-eb .c{font-size:var(--lamplight-t-caption);color:var(--lamplight-ink-quiet);font-variant-numeric:tabular-nums}' +
  '.bs-row{display:grid;grid-template-columns:1fr 84px 40px;align-items:center;gap:12px;padding:0 2px;min-height:46px;font-size:var(--lamplight-t-body);color:var(--lamplight-ink-mid)}' +
  '.bs-row .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.bs-row .vv{text-align:right;font-variant-numeric:tabular-nums;font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.bs-row .vv b{font-weight:400;font-size:var(--lamplight-t-caption);color:var(--lamplight-ink-quiet)}' +
  '.bs-meter{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}' +
  '.bs-meter i{display:block;height:100%;border-radius:2px}' +
  '.bs-sum{padding:14px 2px 0}' +
  '.bs-big{font-size:var(--lamplight-t-display);font-weight:300;letter-spacing:-.02em;line-height:1;color:var(--lamplight-ink-strong)}' +
  '.bs-big small{font-size:var(--lamplight-t-name);font-weight:400;letter-spacing:0;color:var(--lamplight-ink-soft);margin-left:8px}' +
  '.bs-lead{font-size:var(--lamplight-t-name);line-height:1.5;color:var(--lamplight-ink-mid);margin-top:12px}' +
  '.bs-lead b{font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.bs-alarm .hl{font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgb(' + LAMP_MEANINGS.battery.alert + ');display:block;margin-bottom:10px}' +
  '.bs-alarm .bs-big{color:rgb(' + LAMP_MEANINGS.battery.alert + ')}' +
  '.bs-alarm .bs-big small{font-size:var(--lamplight-t-inline);margin-left:2px;color:rgba(' + LAMP_MEANINGS.battery.alert + ',.6)}' +
  '.bs-alarm .hn{font-size:var(--lamplight-t-name);font-weight:500;color:var(--lamplight-ink-strong);margin-top:10px}' +
  '.bs-alarm .hm{font-size:var(--lamplight-t-state);color:var(--lamplight-ink-soft);margin-top:2px}' +
  '.bs-alarm .bs-meter{margin-top:13px}' +
  '.bs-foot{display:flex;justify-content:space-between;gap:12px;margin-top:14px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);font-size:var(--lamplight-t-state);color:var(--lamplight-ink-soft);font-variant-numeric:tabular-nums}' +
  '.bs-foot b{font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.bs-det summary{list-style:none;cursor:pointer;pointer-events:auto;display:flex;align-items:center;gap:12px;padding:11px 2px;min-height:52px}' +
  '.bs-det summary::-webkit-details-marker{display:none}' +
  '.bs-det[open] .bs-chev{transform:rotate(90deg)}' +
  '.bs-tile{width:34px;height:34px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(' + LAMP_MEANINGS.battery.full + ',.12);border:1px solid rgba(' + LAMP_MEANINGS.battery.full + ',.26)}' +
  '</style>';

function lampBattRow(x, t) {
  const b = lampBattBand(x.v, t);
  return "<div class='bs-row'><span class='nm'>" + lampEsc(x.n) + "</span>" +
    "<span class='bs-meter'><i style='width:" + Math.max(2, Math.round(x.v)) + "%;background:rgb(" +
    LAMP_BATT_BAND_RGB[b] + ")'></i></span>" +
    "<span class='vv'" + (b === 'alert' ? " style='color:rgb(" + LAMP_MEANINGS.battery.alert + ")'" : '') + '>' + Math.round(x.v) +
    '<b>%</b></span></div>';
}

function lampBattEyebrow(band, count) {
  return "<div class='bs-eb'><span class='l'" + (band === 'alert' ? " style='color:rgb(" + LAMP_MEANINGS.battery.alert + ")'" : '') +
    "><i style='background:rgb(" + LAMP_BATT_BAND_RGB[band] + ")'></i>" + LAMP_BATT_WORD[band] +
    "</span><span class='c'>" + count + '</span></div>';
}

// The lead: the answer first, then the battery that is nearest to it.
function lampBattLead(list, t) {
  const low = list[0];
  const worth = list.filter(function (x) { return lampBattBand(x.v, t) === 'notice'; }).length;
  const at = lampEsc(low.n) + ', at ' + Math.round(low.v) + '%';
  if (worth) {
    return '<b>Nothing to replace yet.</b> ' + worth + ' worth noticing; the lowest is the ' + at + '.';
  }
  return '<b>Nothing to replace.</b> The lowest is the ' + at + '.';
}

function lampBattSummary(list, t) {
  return "<div class='bs-sum'><div class='bs-big'>" + list.length +
    '<small>' + (list.length === 1 ? 'battery' : 'batteries') + '</small></div>' +
    "<div class='bs-lead'>" + lampBattLead(list, t) + '</div></div>';
}

function lampBattAlarm(list, lowCount) {
  const top = list[0];
  const foot = lowCount > 1
    ? "<b style='color:rgb(" + LAMP_MEANINGS.battery.alert + ")'>" + lowCount + '</b> to replace'
    : (list[1] ? 'next lowest <b>' + Math.round(list[1].v) + '%</b>' : '');
  return "<div class='bs-sum bs-alarm'><span class='hl'>Replace soon</span>" +
    "<div class='bs-big'>" + Math.round(top.v) + '<small>%</small></div>' +
    "<div class='hn'>" + lampEsc(top.n) + '</div>' +
    (top.m ? "<div class='hm'>" + lampEsc(top.m) + '</div>' : '') +
    "<span class='bs-meter'><i style='width:" + Math.max(2, Math.round(top.v)) +
    "%;background:rgb(" + LAMP_MEANINGS.battery.alert + ")'></i></span>" +
    "<div class='bs-foot'><span><b>" + list.length + '</b> ' + (list.length === 1 ? 'battery' : 'batteries') +
    '</span><span>' + foot + '</span></div></div>';
}

function lampBattFold(devs, categories, t) {
  const byModel = {};
  devs.forEach(function (x) {
    const k = x.m || 'device';
    byModel[k] = (byModel[k] || 0) + 1;
  });
  const parts = Object.keys(byModel).map(function (k) {
    const n = byModel[k];
    const cat = (categories && categories[k]) || k.toLowerCase() || 'device';
    return n + ' ' + lampEsc(cat + (n === 1 ? '' : 's'));
  }).sort(function (a, b) { return parseInt(b, 10) - parseInt(a, 10); });

  return "<details class='bs-det'><summary>" +
    "<span class='bs-tile'><ha-icon icon='mdi:battery' style='--mdc-icon-size:19px;width:19px;height:19px;" +
    "line-height:0;color:rgb(" + LAMP_MEANINGS.battery.full + ")'></ha-icon></span>" +
    "<span style='flex:1;min-width:0'>" +
    "<span style='display:block;font-size:var(--lamplight-t-body);font-weight:500;color:var(--lamplight-ink-mid)'>" + devs.length + ' device' + (devs.length === 1 ? '' : 's') +
    ' at 100%</span>' +
    "<span style='display:block;font-size:var(--lamplight-t-state);color:var(--lamplight-ink-soft);margin-top:2px'>" +
    parts.join(' &middot; ') + '</span></span>' +
    "<ha-icon icon='mdi:chevron-right' class='bs-chev' style='--mdc-icon-size:18px;width:18px;" +
    "height:18px;line-height:0;color:rgba(255,255,255,.26);flex:none;transition:transform .2s'>" +
    '</ha-icon></summary>' +
    '<div>' + devs.map(function (x) { return lampBattRow(x, t); }).join('') + '</div></details>';
}

function lampBattBody(list, thresholds, categories) {
  if (!list.length) {
    return "<div style='padding:16px 2px;color:rgba(255,255,255,.30)'>no readings</div>";
  }
  const bands = { alert: [], notice: [], hand: [], full: [] };
  list.forEach(function (x) { bands[lampBattBand(x.v, thresholds)].push(x); });

  const alarm = bands.alert.length > 0;
  const blocks = [alarm ? lampBattAlarm(list, bands.alert.length) : lampBattSummary(list, thresholds)];
  // The alarm hero shows the lowest battery, so its row is not repeated in its band. The summary
  // only names it in a sentence, so there it stays in its band.
  const rows = { alert: bands.alert, notice: bands.notice, hand: bands.hand, full: bands.full };
  if (alarm) rows.alert = rows.alert.slice(1);
  ['alert', 'notice', 'hand'].forEach(function (b) {
    if (!rows[b].length) return;
    blocks.push(lampBattEyebrow(b, rows[b].length) +
      rows[b].map(function (x) { return lampBattRow(x, thresholds); }).join(''));
  });
  if (rows.full.length) {
    blocks.push(lampBattEyebrow('full', rows.full.length) + lampBattFold(rows.full, categories, thresholds));
  }
  return LAMP_BATT_CSS + "<div class='bs'>" + blocks.join('') + '</div>';
}

class LampBatteries extends HTMLElement {

  static getStubConfig() {
    return { exclude: [], names: {} };
  }

  setConfig(config) {
    config = config || {};
    this._exclude = config.exclude || [];
    this._names = config.names || {};
    this._categories = config.categories || {};
    this._thresholds = lampBattLimits(config.thresholds);
    this._key = null;
    this._render();
  }

  set hass(hass) { this._hass = hass; this._update(); }

  getCardSize() { return 4; }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    const card = document.createElement('ha-card');
    this._card = card;
    // The same flat shell as lamplight-day: the sheet sits on the pop-up ground, with no panel.
    [['background', 'transparent'], ['border', 'none'], ['border-radius', '0'],
     ['box-shadow', 'none'], ['backdrop-filter', 'none'], ['-webkit-backdrop-filter', 'none']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    card.style.padding = '2px 2px 8px';
    card.style.boxSizing = 'border-box';
    card.style.display = 'block';
    card.style.textAlign = 'left';
    this._body = document.createElement('div');
    card.appendChild(this._body);
    this.shadowRoot.appendChild(card);
  }

  _update() {
    if (!this._hass || !this._body) return;
    const list = lampBatteryList(this._hass, this._exclude, this._names);
    const key = JSON.stringify(list.map(function (x) { return x.id + ':' + x.v; }));
    if (key === this._key) return;
    this._key = key;
    const was = this._body.querySelector('details');
    const open = !!(was && was.open);
    this._body.innerHTML = lampBattBody(list, this._thresholds, this._categories);
    // THE FOLD. Until 24 September 2026 the summary carried an inline onclick that toggled the
    // <details>, and then the browser's own toggle closed it again: a click did nothing. (On a
    // telephone the ontouchend handler stopped the click, so a tap worked.) The same fault and
    // the same fix as lamplight-day's "Show every hour": one handler stops the browser's toggle and
    // toggles once. A new reading paints the body again, so the open state carries across.
    const det = this._body.querySelector('details');
    if (det) {
      det.open = open;
      det.querySelector('summary').addEventListener('click', function (ev) {
        ev.preventDefault();
        det.open = !det.open;
      });
    }
  }
}

customElements.define('lamplight-batteries', LampBatteries);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-batteries',
  name: 'Lamplight Batteries',
  description: 'The Batteries pop-up body: the lowest battery or a battery to replace, banded rows with meters, and a fold for full ones.',
  preview: false
});
window.customCards.push({
  type: 'lamplight-battery-strip',
  name: 'Lamplight Battery Strip',
  description: 'A footer row summarising every battery-class sensor, opening a pop-up on tap.',
  preview: false
});
