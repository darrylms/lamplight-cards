// The air purifier helpers. Shared by the `fan` kind of lamplight-row (85-row.js) and by
// lamplight-purifier-detail (97b-purifier-detail.js), so the row and its sheet cannot disagree.
//
// THE DECISION (24 Oct 2026, design-docs/air_purifier_options.html, option A without C)
// The purifier is one row in the room's Climate panel, and a pop-up holds the mode and the
// filters. The row's sub-line gives the mode and the air in words. When a filter is at or
// under `filter_alert_level` (20%, the battery mark's own threshold), the filter job replaces the
// air words, in the alert orange.
//
// THE AIR WORDS
// The four bands of the Philips app: clean to 12 ug/m3 of PM2.5, fair to 35, poor to 55, very
// poor above. A stranger with another purifier can give other `air_quality_limits` and `air_quality_labels`.
//
// PORTABILITY
// No household entity is written here. A filter is a sensor that reads its life in percent,
// with an optional `time_remaining` attribute in hours. The Philips CoAP integration gives
// both.

const LAMP_ALERT_RGB = LAMP_MEANINGS.filter.alert;

function lampAirWord(v, bands, words) {
  const b = bands || LAMP_DEFAULTS.row.air_quality_limits;
  const w = words || LAMP_DEFAULTS.row.air_quality_labels;
  for (let i = 0; i < b.length; i++) if (v <= b[i]) return w[i];
  return w[b.length];
}

// The air reading as a number, or null when the sensor gives none.
function lampAirValue(hass, id) {
  const s = id && hass.states[id];
  const v = s ? parseFloat(s.state) : NaN;
  return isNaN(v) ? null : v;
}

// The mode word for the sub-line and the lead. A preset first; a fan with no preset is "on".
function lampFanMode(s) {
  const p = s && s.attributes.preset_mode;
  if (!p) return 'On';
  return p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, ' ');
}

// Each filter as { name, job, v, hours, alert, cfg }, in the order of the config. A filter with no
// reading is left out.
function lampFilterList(hass, filters, alert) {
  const a = alert == null ? LAMP_DEFAULTS.row.filter_alert_level : alert;
  const out = [];
  (filters || []).forEach(function (f) {
    const s = f && f.entity && hass.states[f.entity];
    const v = s ? parseFloat(s.state) : NaN;
    if (isNaN(v)) return;
    const h = parseFloat(s.attributes.time_remaining);
    out.push({
      name: f.name || (s.attributes.friendly_name || f.entity),
      job: f.job === 'clean' ? 'clean' : 'replace',
      v: v,
      hours: isNaN(h) ? null : h,
      alert: v <= a,
      cfg: f
    });
  });
  return out;
}

// "in 15 days", "in about 13 months". The hours come from the purifier's own count of run
// time, so a long figure is only an estimate: past 60 days it is given in months, with "about".
function lampFilterWhen(hours) {
  if (hours == null) return '';
  if (hours < 48) return 'in ' + Math.max(0, Math.round(hours)) + ' hours';
  const days = Math.round(hours / 24);
  if (days < 60) return 'in ' + days + ' days';
  return 'in about ' + Math.round(days / 30.4) + ' months';
}
