// The default value of each configuration key, in one place.
//
// A card reads a key in this order: the card's own config, then LAMP_DEFAULTS[card], then
// LAMP_DEFAULTS.shell. Use lampDefault(card, key). No card holds a default number of its own.
// The values are the ones this household's dashboard shows. Change a value here and every card
// that uses it changes. A key that names an entity has no default (the portability goal).
//
// radius and shadow are not here: they come from the theme variables --lamplight-radius and
// --lamplight-shadow (10-wash.js, lampShellProps).
//
// A pair [a, b] is a ramp: the value with no active rows and the value with every row active.
// A card that has no rows takes the first value. A config key with one number replaces the ramp.
//
// Design document: config_rename_plan.md. Written 22 Nov 2026, Lamplight 0.140.0-dev.

const LAMP_DEFAULTS = {

  // Every panel, and every card that stands on LampShell.
  shell: {
    light_style: 'activity',        // activity | accent | off
    light_from: 'corner',           // corner | top-edge (accent and activity light)
    smooth_gradient: true,          // a dithered canvas over the light hides colour banding
    // The light. activity: the wash, the edge line and where the light stands (in % of the card
    // height) follow the fraction of active rows. accent: one source above the top right corner.
    // top_edge: the source on the top edge (light_from: top-edge).
    light: {
      activity:  { glow_strength: [0.11, 0.30], edge_strength: [0.19, 0.35], glow_position: [12, 88] },
      accent:    { glow_strength: 0.30 },
      top_edge:  { glow_strength: 0.30, edge_strength: 0.30 }
    },
    bounce_strength: [0.048, 0.066] // the ember glow from the bottom left, on every light panel
  },

  waste: {
    show_following_collection: true,
    locale: 'en-GB',
    idle_color: 'panel-rest'
  },

  panel: { restyle_children: true },

  light: {
    side_bar_opacity: [0.14, 0.85],
    side_bar_default_color: '120,120,130',
    toggle_color: '255,190,120',
    toggle_icon_color_on: '#ffe4c0',
    scroll_guard_ms: 500,
    tap_area: 'icon'
  },

  rooms: {
    side_bar_opacity: [0.22, 0.60],
    toggle_color: '255,190,120',
    toggle_icon_color_on: '#ffd9a0',
    humidity_range: [45, 65]
  },

  row: {
    side_bar_opacity: [0.08, 0.60],
    air_quality_limits: [12, 35, 55],
    air_quality_labels: ['clean', 'fair', 'poor', 'very poor'],
    filter_alert_level: 20
  },

  routines: {
    brightness_tolerance: 3,
    layout: 'path',
    lamp_style: 'glass',
    lit_lamps: 'all',
    columns: 3
  },

  climate: {
    humidity_range: [45, 65],
    damp_range: [60, 70],
    dry_below: 40,                  // the comfort word says "dry" under this humidity (%)
    show_wave: true
  },

  'climate-detail': {
    bedroom: false,
    sleep_max_temp: 20,
    damp_range: [60, 70],
    dry_below: 40,
    night_hours: [23, 7]
  },

  weather: {
    sun_entity: 'sun.sun',          // Home Assistant's own sun entity
    outlook_hours: 12,
    rain_ribbon_threshold: 40,
    sky_style: 'plates',
    forecast_type: 'hourly',
    forecast_slots: 4
  },

  day: { sun_entity: 'sun.sun', forecast_type: 'hourly' },

  'window-strip': { outlook_hours: 6, cold_below: 12, rain_above: 40 },

  'windows-detail': { sun_entity: 'sun.sun', outlook_hours: 6, cold_below: 12, rain_above: 40, history_days: 7 },

  'plug-detail': { active_watts: 1, usual_tolerance: 0.2, device_icon: 'plug' },

  'purifier-detail': {
    air_quality_limits: [12, 35, 55],
    air_quality_labels: ['clean', 'fair', 'poor', 'very poor'],
    air_label: 'PM2.5',
    filter_thresholds: { replace_soon: 20, worth_noticing: 39 },
    modes: ['auto', 'sleep', 'turbo']
  },

  batteries: { thresholds: { replace_soon: 20, worth_noticing: 39, fine: 99 } },

  chips: { full_width: false },

  scenes: { show_count: true }
};

// The value of a key for one card: the card's default, else the shell's, else undefined.
function lampDefault(card, key) {
  const own = LAMP_DEFAULTS[card];
  if (own && own[key] !== undefined) return own[key];
  return LAMP_DEFAULTS.shell[key];
}

// A config value, or the default of the card.
function lampOpt(card, config, key) {
  return config && config[key] !== undefined ? config[key] : lampDefault(card, key);
}

// The value of a ramp [none active, all active] for a fraction f of rows active.
// The span is rounded to 6 places, so 0.35 - 0.19 is 0.16 and not 0.15999999999999998. A rounded
// result must not move a tie (see lampRound in 10-wash.js).
function lampRamp(pair, f) {
  return pair[0] + Number((pair[1] - pair[0]).toFixed(6)) * f;
}
