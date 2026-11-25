// lamplight-weather. The Overview weather card.
//
// master_design.html section 11 makes this card the one deliberate exception on
// the dashboard: a full-height sky instead of a corner wash, and no lines at
// all. So this card does NOT use either wash geometry. It overrides
// _background() and paints the sky itself.
//
// WHAT THIS REPLACES
// A stock `weather-forecast` card carrying 14,479 characters of card_mod Jinja.
// The Jinja did four jobs, and this card does all four in JavaScript:
//
//   the sky        eleven skies plus golden hour, from the condition and sun.sun
//   the sentence   the rain answer in words, on the sub-line
//   the ribbon     the 12-hour probability silhouette at the foot
//   the warning    the Met Office severe weather strip, which takes the same foot
//
// WHAT PHASE 5 ADDED
// Until 21 September 2026 this card held a stock `weather-forecast` as a child
// and skinned it, so Home Assistant still drew the condition glyph, the current
// row and the hourly tiles. That kept the picture identical through the
// rebuild, which was the point at the time, but it left two costs: the card was
// coupled to sixteen of Home Assistant's private class names, and the weather
// glyphs were the only pictures on this dashboard the household had not chosen.
//
// The child is gone. This card now draws the row and the tiles itself, from the
// same subscription it already had, with the Lamplight glyph set in
// src/65-glyphs.js. Design document: design-docs/weather_glyph_options.html,
// option D, agreed by the household 21 September 2026.
//
// The class names below are deliberately the same ones the stock card used.
// They are ours now and nothing can rename them, and keeping them meant the
// ribbon, the warning strip and all three card heights carried over unchanged.
//
// Two behaviours were dropped on purpose, both asked for:
//   * the day separator tile. Home Assistant inserts a `label-only` tile when
//     the window crosses midnight, which spends one of the four forecast hours
//     and makes the card 231px. The strip now always shows four hours.
//   * Home Assistant's condition wording. The card says "Sleet", not
//     "Snowy rainy" - and it says the same word the rain sentence uses.
//
// THE ONE HOST DEPENDENCY THIS DROPS
// `sensor.met_office_rain_ahead` in entity-templates.yaml. It exists only
// because a Jinja template cannot read a forecast. This card subscribes to
// `weather/subscribe_forecast` and builds the same twelve hours itself.
// Measured against the live sensor 21 September 2026: same count, same horizon,
// same peak. The sensor is still on the host and nothing else reads it; the
// household chose to retire it as a separate, reversible step.
//
// Configuration:
//   entity            the weather entity. Required
//   sun_entity        default sun.sun
//   warning_sensor    the warning sensor. Optional: without it there is no warning strip
//   warning_count_sensor  the number of warnings. Optional
//   warning_start_sensor  the warning's start time. Optional
//   warning_end_sensor  the warning's end time. Optional; without from and until the strip has no
//                     time. See THE WARNING'S TIME
//   gust_sensor, uv_sensor  the fallback ladder's sensors. Optional: without `gust_sensor` the ladder uses the
//                     entity's wind_gust_speed only; without `uv_sensor` there is no UV rung
//   feels_like_sensor the felt temperature, named beside the condition word. Optional. See FEELS LIKE
//   No sensor key has a default (22 Nov 2026, 0.136.0-dev). The defaults named one household's
//   Met Office sensors, and on another installation they failed without a warning.
//   outlook_hours     the window, in hours. Default 12
//   rain_ribbon_threshold  the peak that makes the ribbon appear. Default 40
//   hide_ha_title     true hides the view title in Home Assistant's own toolbar.
//                     See src/25-ha-title.js
//   forecast_type     passed to the child. Default hourly
//   forecast_slots    passed to the child. Default 4
//   tap_action        passed to the child, which handles it
//   smooth_gradient   true (default)
//   sky_style         'plates' (default), 'painted' or 'classic'. See THE PLATE SKY and
//                     THE PAINTED SKY. `painted` is the sky of 0.35.0-dev and earlier, and
//                     the fallback when a plate does not load. `classic` keeps the
//                     gradient sky of 0.30.0-dev and earlier exactly. It is the revert path
//   plate_folder      the folder of the 28 plates. Default
//                     LAMP_SKY_BASE + 'lamplight-sky/' + LAMP_PLATE_SET + '/'. Give the
//                     whole folder, with the trailing slash
//   mask_folder       the folder of the 17 sky masks. Default
//                     LAMP_SKY_BASE + 'lamplight-sky/' + LAMP_SKY_SET + '/'. Give the
//                     whole folder, with the trailing slash
//
// THE PLATE SKY
// Design option 2 "Turning Plates" (design-docs/weather_plates_build_options.html), agreed
// 26 October 2026. The sky is one of 28 pre-rendered plates (7 conditions x 4 lights),
// blended by the sun's elevation. The layout is "Open Sky": a 64px band with no text, the
// words and the temperature below it, the hourly tiles with their glyphs. There is no large
// current glyph and no reading shade; the ground (1b Afterglow) and the fade take their
// place. The functions are in src/68b-plates.js. The ground counts as sky for Law 05.2.
// The signature in `data-sky` holds the two plate names and the rounded blend weight.
//
// THE PAINTED SKY
// Design option 7 (design-docs/weather_effects_options.html), agreed 11 October
// 2026. In `painted` mode the sky is a stack of layers in `div.lamp-sky`, the
// first child of the card. The functions are in src/68-sky.js. The layers, from
// the bottom: light (a gradient and a light pool, blended by the sun's
// elevation), stars, cloud (two masks, shade and lit), veil (fog), air (the
// marks, with clear air round the words), the reading shade, and the grain.
// The card itself paints only the rim and the ground. The stack is drawn again
// only when its signature changes (the condition, the elevation to 0.5 degree,
// the wind to 2 km/h and 10 degrees, the card size and the foot band). The
// signature is written to `data-sky` on the stack.
//
// THE WARNING'S TIME
// Option A3 of design-docs/weather_warning_detail_options.html, chosen 21 October 2026.
// The strip names the next change: "Wind · from 23:00 tomorrow" before the start, and
// "Wind · until 13:00" in force. The phrases are in src/69-warn-time.js. The card writes
// the longest phrase that fits the line, measured in the card itself, so the telephone's
// wider text is measured too. If no phrase fits, the reason is alone. Before the start the
// chip is a 20% tint with light letters; at the start it fills. Only the chip waits: the
// rim and the foot wash of amber and red show from the moment the warning is issued, by
// household decision. At the end the strip goes, even while the feed still lists it. A
// timer looks once a minute, because the phrase changes with no state push.

// The eleven skies. Each entry is [sky, sky alpha, pool, pool alpha, side].
// `l` puts the light pool top-left, which is where the moon is; `r` top-right.
// These are master_design section 11's numbers and must not be changed here -
// a change to them is an amendment to the document.
const LAMP_SKIES = {
  sunny:        ['84,158,246',  0.70, '209,162,75',  0.90, 'r'],
  partlycloudy: ['74,142,232',  0.62, '219,165,72',  0.90, 'r'],
  golden:       ['255,150,96',  0.58, '240,165,90',  0.78, 'r'],
  cloudy:       ['150,170,205', 0.52, '205,214,225', 0.64, 'r'],
  rainy:        ['78,132,190',  0.62, '151,184,212', 0.88, 'r'],
  pouring:      ['64,110,168',  0.66, '153,194,229', 0.84, 'r'],
  lightning:    ['122,110,235', 0.58, '204,194,245', 0.76, 'r'],
  fog:          ['168,176,190', 0.46, '193,198,205', 0.74, 'r'],
  snowy:        ['200,224,255', 0.48, '182,188,194', 0.70, 'r'],
  clearnight:   ['48,62,118',   0.66, '242,234,145', 0.38, 'l'],
  cloudynight:  ['66,78,118',   0.56, '145,155,176', 0.62, 'l']
};

// The three warning levels. Each entry is
// [chip colour, the foot of the wash, does the rim change, the letters on a tinted chip].
// Yellow stays quiet on purpose: section 11 says a yellow warning is routine
// here, and one treatment for all three would either shout about a coat or
// whisper about a danger.
// The tinted chip's letters are lighter than the chip colour for amber and red. Red
// letters on the red tint measured 3.8:1; these measure 6.6, 6.4 and 6.0:1 (Law 13.1).
// The values are the weather status `sky` set in src/02-palette.js, keyed by status.
const LAMP_WARN = {};
['moderate', 'severe', 'extreme'].forEach(function (k) {
  const c = LAMP_MEANINGS.weather[k].sky;
  LAMP_WARN[k] = [c.chip, c.foot, c.rim, c.ink];
});

// Jinja prints a float with a decimal point even when it is whole: `0.0`, not
// `0`. The ribbon's polygon points came from Jinja, so they must still read
// that way or the data URI is a different string.
function lampFloat(v) {
  const s = String(v);
  return s.indexOf('.') >= 0 || s.indexOf('e') >= 0 ? s : s + '.0';
}

// `HH:MM` in local time, which is what timestamp_custom('%H:%M', true) gives.
function lampClock(d) {
  const p = (n) => (n < 10 ? '0' : '') + n;
  return p(d.getHours()) + ':' + p(d.getMinutes());
}

// Jinja's `capitalize` raises the first letter and lowers the rest.
function lampCapitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

// FEELS LIKE (design-docs/weather_feels_like_options.html, options 1 and 4, 29 Oct 2026).
// The felt temperature is named only when it differs from the air by this many degrees or
// more. lamplight-day uses the same number for its felt range and sentence, so the card and the
// pop-up name it on the same days (master_design.html section 15, one threshold, one answer).
// Until 0.40.0-dev it was a rung of the sub-line ladder at 3 degrees, and it showed only on a
// calm, dry day: rain or a gust took the line on the days when the gap is largest.
const LAMP_FEELS_GAP = 2;

// THE WIND (16 Nov 2026, replaces the one gust rule of 30 km/h, d-045). The Met Office gust is
// about twice the mean wind, so a gust of 30 km/h came with a mean of 13 km/h: 46 of the 48
// forecast hours on 16 Nov passed it, and the gust showed every day. Now the mean wind names
// the wind, and the gust is added only when it is high. lamplight-weather and lamplight-day use these
// same steps, so the card and the pop-up name the wind on the same days (one threshold, one
// answer). The steps are in km/h; lampToKmh converts a value in the provider's own unit.
// In the 11 days of recorder history before 16 Nov, the daytime mean reached 20 on 2 days.
const LAMP_WIND_BREEZY = 20;
const LAMP_WIND_WINDY = 30;
const LAMP_WIND_GUSTS = 50;
const LAMP_KMH = { 'km/h': 1, 'mph': 1.609344, 'm/s': 3.6, 'kn': 1.852, 'ft/s': 1.09728 };

function lampToKmh(v, unit) { return v * (LAMP_KMH[unit] || 1); }

// The wind words, or null on a calm day. `mean` and `gust` are in `unit`, which is printed.
//   "Breezy, 22 km/h"   "Windy, 31 km/h, gusts to 58"   "Gusts to 52 km/h"
// `short` gives one item for a line that does not wrap: the gust when it is high, else the word.
function lampWindText(mean, gust, unit, short) {
  const m = isFinite(mean) ? lampToKmh(mean, unit) : 0;
  const g = isFinite(gust) ? lampToKmh(gust, unit) : 0;
  const word = m >= LAMP_WIND_WINDY ? 'Windy' : m >= LAMP_WIND_BREEZY ? 'Breezy' : '';
  const high = g >= LAMP_WIND_GUSTS;
  if (!word && !high) return null;
  const sp = lampRound(mean, 0) + ' ' + unit;
  const gs = lampRound(gust, 0);
  if (!word || (short && high)) return 'Gusts to ' + gs + ' ' + unit;
  return word + ', ' + sp + (high ? ', gusts to ' + gs : '');
}

class LampWeather extends LampShell {

  static getStubConfig(hass) {
    return {
      entity: lampFirstWeather(hass)
    };
  }

  _setup(config) {
    if (!config.entity) throw new Error('lamplight-weather needs an `entity`');
    this._entity = config.entity;
    this._sun = lampOpt('weather', config, 'sun_entity');
    this._warnEntity = config.warning_sensor || null;
    this._warnCount = config.warning_count_sensor || null;
    this._warnFrom = config.warning_start_sensor || null;
    this._warnUntil = config.warning_end_sensor || null;
    this._warnTick = null;
    this._warnKey = null;
    this._gust = config.gust_sensor || null;
    this._feels = config.feels_like_sensor || null;
    this._uv = config.uv_sensor || null;
    this._window = lampOpt('weather', config, 'outlook_hours');
    this._threshold = lampOpt('weather', config, 'rain_ribbon_threshold');
    this._skies = config.skies || LAMP_SKIES;
    const skyStyle = lampOpt('weather', config, 'sky_style');
    if (['plates', 'painted', 'classic'].indexOf(skyStyle) < 0) {
      throw new Error("sky_style must be 'plates', 'painted' or 'classic'");
    }
    this._skyMode = skyStyle;
    this._plateOk = true;        // false when a plate does not load; the painted sky takes over
    this._plateAssets = config.plate_folder
      ? config.plate_folder.replace(/\/?$/, '/')
      : LAMP_SKY_BASE + 'lamplight-sky/' + LAMP_PLATE_SET + '/';
    this._skyAssets = config.mask_folder
      ? config.mask_folder.replace(/\/?$/, '/')
      : LAMP_SKY_BASE + 'lamplight-sky/' + LAMP_SKY_SET + '/';
    this._skyEl = null;          // div.lamp-sky, in painted mode
    this._skyKey = null;         // what the stack shows now
    this._skyRo = null;
    this._slots = lampOpt('weather', config, 'forecast_slots');
    this._tap = config.tap_action || { action: 'more-info' };
    this._showCurrent = config.show_current !== false;
    this._showForecast = config.show_forecast !== false;
    this._hours = null;          // the twelve-hour window, once it arrives
    this._tiles = null;          // the four hours the strip shows
    this._hiLo = null;           // today's high and low, from the same list
    this._skin = null;
    this._state = null;
    this._lastState = null;
    this._lastRow = null;
    this._unsub = null;
  }

  getCardSize() { return 4; }

  // ---- the forecast subscription ----------------------------------------
  //
  // This is the whole reason the host sensor existed. A Jinja template cannot
  // read a forecast, but a card can subscribe to it.

  // Home Assistant takes a card out of the document and puts it back, so the
  // sky's ResizeObserver is made again here, next to the subscription.
  // The warning timer is made again here too: a card that loses it on a
  // re-attach stops changing its phrase.
  connectedCallback() {
    this._subscribe(); this._observeSky();
    if (!this._warnTick) {
      const self = this;
      this._warnTick = setInterval(function () { self._warnClock(); }, 60000);
    }
    lampHaTitle(this, lampHaTitleWanted(this));
  }

  disconnectedCallback() {
    lampHaTitle(this, false);
    if (this._unsub) { this._unsub(); this._unsub = null; }
    if (this._skyRo) { this._skyRo.disconnect(); this._skyRo = null; }
    if (this._warnTick) { clearInterval(this._warnTick); this._warnTick = null; }
  }

  // Once a minute: paint again only if the strip would say something different,
  // or the warning started or ended.
  _warnClock() {
    if (!this._hass) return;
    const w = this._warning();
    const key = w ? w.level + '|' + w.live + '|' + w.forms.join('/') : '-';
    if (key === this._warnKey) return;
    this._skinState();
    this._paint();
  }

  _subscribe() {
    if (this._unsub || !this._hass || !this._entity) return;
    const self = this;
    const type = (this._config && this._config.forecast_type) || lampDefault('weather', 'forecast_type');
    let killed = false;
    this._unsub = function () { killed = true; };
    this._hass.connection.subscribeMessage(
      function (msg) { self._forecast(msg && msg.forecast); },
      { type: 'weather/subscribe_forecast', entity_id: this._entity,
        forecast_type: type }
    ).then(function (off) {
      if (killed) { off(); return; }
      self._unsub = off;
    }).catch(function () { self._unsub = null; });
  }

  // Build the same window the template sensor built, with the same two guards:
  // the list can start in the past, so drop every hour older than this one, and
  // take no more than `hours` entries.
  _forecast(list) {
    if (!Array.isArray(list)) return;
    const t0 = Math.floor(Date.now() / 1000 / 3600) * 3600;
    const out = [];
    for (let i = 0; i < list.length && out.length < this._window; i++) {
      const h = list[i];
      const ts = Date.parse(h.datetime) / 1000;
      if (!isFinite(ts) || ts < t0) continue;
      const at = new Date(ts * 1000);
      out.push({
        t: lampClock(at),
        p: parseInt(h.precipitation_probability, 10) || 0,
        c: h.condition,
        m: parseFloat(h.precipitation) || 0,
        at: at,
        label: at.getHours() + ':' + (at.getMinutes() < 10 ? '0' : '') + at.getMinutes(),
        temp: h.temperature
      });
    }
    this._hours = out.length ? out : null;
    this._tiles = out.length ? out.slice(0, this._slots) : null;
    this._hiLo = this._today(list);
    this._skinState();
    this._row();
    this._paint();
  }

  // Today's high and low, from the hourly list. The provider gives no
  // `templow` on an hourly entry, so an hour's own temperature is both. Walk
  // the list from the start and stop at the first entry that is not today -
  // the list is in order, so a later day cannot raise today's figures.
  _today(list) {
    const day = new Date().getDate();
    let hi, lo;
    for (let i = 0; i < list.length; i++) {
      const h = list[i];
      const at = new Date(h.datetime);
      if (at.getDate() !== day) break;
      const top = h.temperature;
      const bot = h.templow !== undefined ? h.templow : h.temperature;
      if (typeof top === 'number' && (hi === undefined || top > hi)) hi = top;
      if (typeof bot === 'number' && (lo === undefined || bot < lo)) lo = bot;
    }
    return (hi === undefined && lo === undefined) ? null : { hi: hi, lo: lo };
  }

  // Is that moment dark? `sun.sun` carries the next rising and the next
  // setting, which is enough for a window this short: if the sun is up now,
  // dark begins at the next setting; if it is down, dark ends at the next
  // rising.
  _night(ms) {
    const sun = this._hass && this._hass.states[this._sun];
    if (!sun) return false;
    const up = sun.state === 'above_horizon';
    const rise = Date.parse(sun.attributes.next_rising);
    const set = Date.parse(sun.attributes.next_setting);
    if (up) return isFinite(set) ? ms >= set : false;
    return isFinite(rise) ? ms < rise : true;
  }

  // ---- the sky -----------------------------------------------------------

  _sky() {
    const st = this._hass && this._hass.states[this._entity];
    const c = st ? st.state : 'unknown';
    const sun = this._hass && this._hass.states[this._sun];
    const up = !!sun && sun.state === 'above_horizon';
    const el = sun && sun.attributes.elevation !== undefined
      ? parseFloat(sun.attributes.elevation) : 90;
    const golden = up && el < 8 && (c === 'sunny' || c === 'partlycloudy');
    let k = 'cloudy';
    if (c === 'clear-night') k = 'clearnight';
    else if (c === 'rainy') k = 'rainy';
    else if (c === 'pouring') k = 'pouring';
    else if (c === 'lightning' || c === 'lightning-rainy') k = 'lightning';
    else if (c === 'snowy' || c === 'snowy-rainy' || c === 'hail') k = 'snowy';
    else if (c === 'fog') k = 'fog';
    else if (c === 'sunny') k = golden ? 'golden' : (up ? 'sunny' : 'clearnight');
    else if (c === 'partlycloudy') k = golden ? 'golden' : (up ? 'partlycloudy' : 'cloudynight');
    else k = up ? 'cloudy' : 'cloudynight';
    return this._skies[k] || this._skies.cloudy;
  }

  // The card's ground. In `classic` mode, five layers: the grain, the light pool
  // where the sun or moon stands, the sky itself falling to the panel ground, the
  // rim on the border box, and the ground under all of it. In `painted` mode,
  // two: the rim and the ground. The grain, the pool and the sky move into the
  // stack (div.lamp-sky, see _paintSky).
  //
  // The rim is at a fixed position, not tracked to an active row, because this
  // card has no rows to track. Section 11 settles that.
  _background() {
    const w = this._warning();
    const rim = (w && LAMP_WARN[w.level][2])
      ? LAMP_WARN[w.level][0] : '150,170,205';
    const ra = (w && LAMP_WARN[w.level][2])
      ? ['0.55', '0.194', '0.055'] : ['0.30', '0.106', '0.03'];
    const rimLayer = 'radial-gradient(120% 90% at 100% 12%, rgba(' + rim + ',' + ra[0] +
      ') 0%, rgba(' + rim + ',' + ra[1] + ') 38%, rgba(' + rim + ',' + ra[2] + ') 100%) border-box';
    if (this._skyMode !== 'classic') {
      return [rimLayer, LAMP_GROUND + ' padding-box'].join(',\n    ');
    }
    const v = this._sky();
    const sky = v[0], sa = v[1], pool = v[2], pa = v[3];
    const pos = v[4] === 'l' ? '34% 48% at 24% 2%' : '42% 56% at 84% 2%';
    const layers = [];
    if (this._grain) layers.push('url(' + LAMP_GRAIN + ') padding-box');
    layers.push(
      'radial-gradient(' + pos + ', rgba(' + pool + ',' + lampNum(pa) + ') 0%, rgba(' +
        pool + ',' + lampNum(lampRound(pa * 0.30, 3)) + ') 34%, transparent 64%) padding-box',
      'linear-gradient(168deg, rgba(' + sky + ',' + lampNum(sa) + ') 0%, rgba(' +
        sky + ',' + lampNum(lampRound(sa * 0.55, 3)) +
        ') 40%, rgba(26,32,48,0.42) 74%, ' + LAMP_GROUND + ' 100%) padding-box',
      rimLayer,
      LAMP_GROUND + ' padding-box'
    );
    return layers.join(',\n    ');
  }

  // This card paints its own sky, not the activity/accent wash, so the
  // dithered canvas in LampShell does not apply here.
  _washLayers() { return null; }

  // ---- the words ---------------------------------------------------------

  // The next sun event, and the label for it.
  _sunLine() {
    const sun = this._hass && this._hass.states[this._sun];
    const up = !!sun && sun.state === 'above_horizon';
    const raw = sun && sun.attributes[up ? 'next_setting' : 'next_rising'];
    const at = raw ? new Date(raw) : null;
    return {
      label: up ? 'Sunset' : 'Sunrise',
      time: at && isFinite(at.getTime()) ? lampClock(at) : '--:--'
    };
  }

  _num(entity, fallback) {
    const st = this._hass && this._hass.states[entity];
    const v = st ? parseFloat(st.state) : NaN;
    return isFinite(v) ? v : fallback;
  }

  // The fallback ladder. The first true item wins: a gale, then a high UV, then
  // the sun. The felt temperature left the ladder on 29 October 2026 and is now
  // beside the condition word (_feelsText), so the ladder cannot hide it.
  //
  // The wind rung uses THE WIND steps, in the short form. The values come from the weather
  // entity's wind_speed and wind_gust_speed, in its wind_speed_unit. Until 0.124.0-dev the
  // rung read the gust sensor as km/h, but a Met Office gust sensor can be in mph:
  // it named a gust of 19 mph as "gusting 19 km/h", and only above 30 mph. The `gust` sensor
  // is now a fallback for a provider without wind_gust_speed, read in its own unit.
  _windRung() {
    const a = (this._hass && this._hass.states[this._entity] || {}).attributes || {};
    const unit = a.wind_speed_unit || 'km/h';
    let gust = parseFloat(a.wind_gust_speed);
    if (!isFinite(gust)) {
      const gs = this._hass && this._hass.states[this._gust];
      const gv = gs ? parseFloat(gs.state) : NaN;
      const gu = gs && gs.attributes.unit_of_measurement;
      if (isFinite(gv)) gust = lampToKmh(gv, gu) / lampToKmh(1, unit);
    }
    const w = lampWindText(parseFloat(a.wind_speed), gust, unit, true);
    return w && w.charAt(0).toLowerCase() + w.slice(1);
  }

  _ladder(sl) {
    const wind = this._windRung();
    const uv = this._num(this._uv, -1);
    if (wind) return wind;
    if (uv >= 6) return 'UV ' + lampRound(uv, 0);
    return sl.label.toLowerCase() + ' ' + sl.time;
  }

  // The clause after the condition word, or '' when the air feels as it is.
  _feelsText() {
    const feels = this._num(this._feels, NaN);
    const st = this._hass && this._hass.states[this._entity];
    const now = st ? parseFloat(st.attributes.temperature) : NaN;
    if (!isFinite(feels) || !isFinite(now) || Math.abs(feels - now) < LAMP_FEELS_GAP) return '';
    return '· feels ' + lampRound(feels, 0) + '°';
  }

  // The condition line does not wrap, so a clause that does not fit would end in an
  // ellipsis. Remove the clause instead: the word is the line's first job. The widest
  // case measured at 375px, "Thunder and rain · feels -10°", had 14.1% spare, and the
  // phone draws text about 15% wider. A line that is not laid out yet is checked on
  // the next frame.
  _fitFeels(tries) {
    const s = this._wrap && this._wrap.querySelector('.state');
    const f = s && s.querySelector('.feels');
    if (!f) return;
    if (!s.clientWidth) {
      if ((tries || 0) < 10) requestAnimationFrame(() => this._fitFeels((tries || 0) + 1));
      return;
    }
    if (s.scrollWidth > s.clientWidth + 0.5) f.remove();
  }

  // The word on the state line. `pouring` says "Heavy rain" only when this
  // hour's forecast has 4 mm or more (lampDayMmWord); otherwise it says "Rain".
  // This is the rule of the rain sentence (see _sentence), so the two lines
  // cannot disagree. With no forecast for this hour, it says "Rain".
  // Decided 21 November 2026. The glyph stays as the condition gives it.
  _stateWord(key) {
    if (key !== 'pouring') return LAMP_CONDITION_WORD[key] || '';
    const h = this._hours && this._hours[0];
    const now = Math.floor(Date.now() / 3600000);
    const mm = h && Math.floor(h.at.getTime() / 3600000) === now ? h.m : 0;
    return lampDayMmWord(mm) === 'heavy' ? LAMP_CONDITION_WORD.pouring : LAMP_CONDITION_WORD.rainy;
  }

  // The rain answer, in one sentence. Four forms, and a fifth for the case
  // where there is no forecast at all.
  _sentence() {
    const sl = this._sunLine();
    const ladder = this._ladder(sl);
    const H = this._hours;
    let sub;
    if (H && H.length) {
      const wet = H.filter(function (h) { return h.p >= 40; });
      const peak = H.reduce(function (m, h) { return h.p > m ? h.p : m; }, H[0].p);
      // The kind of weather comes from the hourly condition; the severest wet
      // hour wins. "Heavy" does not come from the condition. It comes from the
      // millimetres, by lamplight-day's own bands (lampDayMmWord, 4 mm or more), so
      // the two cards cannot disagree. The Met Office gives `pouring` when heavy
      // rain is possible nearby; the household found lamplight-day's "light" more
      // true. Decided 21 November 2026; check again in the next rainy season.
      const cw = wet.map(function (h) { return h.c; });
      const has = function (k) { return cw.indexOf(k) >= 0; };
      // Only a rain hour counts: 5 mm of snow is not heavy rain.
      const mmax = wet.reduce(function (m, h) {
        return (h.c === 'rainy' || h.c === 'pouring') && h.m > m ? h.m : m;
      }, 0);
      const rw = (has('lightning-rainy') || has('lightning')) ? 'thunder'
               : has('hail') ? 'hail'
               : lampDayMmWord(mmax) === 'heavy' ? 'heavy rain'
               : has('snowy') ? 'snow'
               : has('snowy-rainy') ? 'sleet' : 'rain';
      if (wet.length && wet[0].t === H[0].t) {
        sub = lampCapitalize(rw) + ' now · ' + peak + '% peak';
      } else if (wet.length) {
        sub = 'Dry until ' + wet[0].t + ' · ' + rw + ', ' + wet[0].p + '%';
      } else if (peak >= 15) {
        sub = 'Dry for ' + H.length + ' hours · peak ' + peak + '%';
      } else {
        sub = 'Dry for ' + H.length + ' hours · ' + ladder;
      }
    } else {
      const plain = sl.label.toLowerCase() + ' ' + sl.time;
      sub = ladder !== plain
        ? (sl.label + ' ' + sl.time + ' · ' + ladder)
        : (sl.label + ' ' + sl.time);
    }
    // The sentence goes into a CSS `content` string in single quotes.
    return sub.replace(/'/g, '');
  }

  // ---- the warning -------------------------------------------------------

  // `live` is false only before a known start. With no time sensors the
  // warning is live and has no phrases, as before 0.34.0.
  _warning() {
    const st = this._hass && this._hass.states[this._warnEntity];
    const w = st ? st.state : 'none';
    if (['none', 'unknown', 'unavailable', ''].indexOf(w) >= 0) return null;
    const now = new Date();
    const span = lampWarnSpan(this._hass, this._warnFrom, this._warnUntil, now);
    if (span && span.over) return null;
    const wx = lampWeatherWarning(w);
    const level = wx.status;
    let reason = lampWarnReason(w);
    reason = reason.replace(/'/g, '').replace(/\\/g, '');
    const n = parseInt((this._hass.states[this._warnCount] || {}).state, 10) || 0;
    return { level: level, label: wx.label, reason: reason,
             more: n > 1 ? ' · ' + n + ' warnings' : '',
             live: span ? span.live : true,
             forms: lampWarnStripForms(span, now) };
  }

  // Write the reason, the longest phrase that fits, and the count. The test is
  // the text's own width against the line's width, in this card, so the
  // telephone measures its own font. A card with no width yet (not laid out)
  // takes the first phrase; the ResizeObserver calls this again.
  _fitWarn() {
    const strip = this._wrap && this._wrap.querySelector('.lamp-warn');
    const w = this._warning();
    this._warnKey = w ? w.level + '|' + w.live + '|' + w.forms.join('/') : '-';
    if (!strip || !w) return;
    const t = strip.lastChild;
    // The time matters more than the count, so a phrase loses the count before
    // the next, shorter phrase is tried.
    const tries = [];
    w.forms.concat(['']).forEach(function (f) {
      if (w.more) tries.push([f, w.more]);
      tries.push([f, '']);
    });
    const range = document.createRange();
    const reason = w.reason.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    for (let i = 0; i < tries.length; i++) {
      const html = reason + (tries[i][0] ? '<span class="lamp-warn-time"> · ' + tries[i][0] + '</span>' : '') + tries[i][1];
      if (t.innerHTML !== html) t.innerHTML = html;
      const box = t.clientWidth;
      if (!box) break;
      range.selectNodeContents(t);
      if (range.getBoundingClientRect().width <= box + 0.5) break;
    }
  }

  // ---- the skin ----------------------------------------------------------
  //
  // Everything below is the card_mod stylesheet with the Jinja taken out. The
  // static half never changes and is written once. The state half is rewritten
  // when the sky, the sentence, the ribbon or the warning moves.

  // THIS SHEET IS NOW COMPLETE, NOT AN OVERRIDE.
  //
  // Until phase 5 it was a skin: a set of overrides pushed into a stock
  // `weather-forecast` card's shadow root, on top of Home Assistant's own
  // stylesheet. Sixteen of the selectors below were that card's private class
  // names, and any release could have renamed one and broken a rule silently.
  //
  // The markup is ours now, so the names are ours and nothing can rename them.
  // They are KEPT THE SAME ON PURPOSE. Every measurement in
  // master_design.html section 11 - the three card heights, the geometry of the
  // row, the ribbon and the warning strip - was taken against these selectors,
  // and the ribbon and warning code below is unchanged from phase 4. Renaming
  // them would have thrown that away for tidiness.
  //
  // Every number is measured from the card this replaced, at 375 x 812.
  _staticCss() {
    return [
      // The shell paints the ground, the rim, the radius and the shadow. This
      // card adds two things only: a positioning context for the ribbon and the
      // warning strip, and a clip, because both reach into the card's corners.
      'ha-card { position: relative !important; overflow: hidden !important; }',
      ':host { display: block; }',
      '.lamp-wx { display: block; }',
      '.lamp-warn { display: none; }',
      '.lamp-rib { display: none; }',

      // ---- the plate sky: Open Sky layout ----
      '.lamp-wx.plates .content { align-items: flex-start; padding: ' + LAMP_PLATE_BAND + 'px 18px 0; }',
      '.lamp-wx.plates .icon-image { display: none; }',
      '.lamp-wx.plates .forecast { padding: 6px 10px 8px; background: none; }',
      '.lamp-wx.plates .forecast-item { padding: 2px; gap: 3px; }',
      '.lamp-wx.plates .forecast-image-icon { padding: 2px 0; margin: 2px 0 0; }',
      // The glass (option 8, 0.120.0-dev): the quiet text is one step brighter, and the unit takes
      // the temperature's white. With them the glass can stay thin. Plates mode only: the painted
      // and classic skies keep their own inks.
      '.lamp-wx.plates .name::after { color: var(--lamplight-ink-mid) !important; }',
      '.lamp-wx.plates .temp-attribute .attribute { color: var(--lamplight-ink-mid); }',
      '.lamp-wx.plates .temp-attribute .temp span { color: #ffffff; }',
      '.lamp-wx.plates .lamp-rib .lr-scale span { color: var(--lamplight-ink-mid); }',

      // ---- the current row ----
      '.content { display: flex; flex-direction: row; align-items: center;',
      '  justify-content: space-between; gap: 14px; padding: 15px 18px 14px;',
      '  overflow: visible; }',
      '.icon-image { flex: 0 0 auto; width: 44px; height: 44px; min-width: 44px;',
      '  display: flex; align-items: center; justify-content: center; margin: 0;',
      '  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.40)); }',
      '.info { display: flex; flex-direction: row; justify-content: space-between;',
      '  flex: 1 1 auto; min-width: 0; overflow: visible; }',
      '.name-state { flex: 1 1 auto; min-width: 0; padding-right: 12px;',
      '  overflow: visible; }',
      '.state { font-size: var(--lamplight-t-inline); font-weight: 600; letter-spacing: -0.01em;',
      '  line-height: 1.2; color: #ffffff; overflow: hidden;',
      '  text-overflow: ellipsis; white-space: nowrap; }',
      // White at .80 measured 5.19:1 against the brightest sky pixel at this height on
      // the Cloudy day plate (.72 was 4.56). Law 13.1.
      '.state .feels { font-size: var(--lamplight-t-state); font-weight: 400; letter-spacing: 0;',
      '  color: var(--lamplight-ink-strong); font-variant-numeric: tabular-nums; }',
      // The rain sentence is drawn as this element's ::after, so the element
      // stays in the flow and carries no text of its own.
      '.name { font-size: 0; line-height: 1.3; margin-top: 2px; overflow: visible;',
      '  min-width: 0; white-space: nowrap; }',
      '.temp-attribute { flex: 0 0 auto; text-align: right; }',
      // The unit is OUT OF FLOW, and that is load-bearing. The stock card put
      // `position: absolute; top: 1px` on this span in its own stylesheet, so
      // the unit adds no width to the block and the column is sized by the
      // high/low line below it instead. Drawn in the flow the column is 5.34px
      // wider, the rain sentence loses that width, it wraps to a second line,
      // and the card grows from 179.3px to 186.1px. The `top: 1px` is also why
      // the unit sits against the top of the figure rather than on its
      // baseline. Measured against a stock card 21 September 2026.
      '.temp-attribute .temp { font-size: var(--lamplight-t-display); font-weight: 300;',
      '  letter-spacing: -0.02em; line-height: 1; color: #ffffff;',
      '  font-variant-numeric: tabular-nums; margin-right: 16px;',
      '  position: relative; direction: ltr; }',
      '.temp-attribute .temp span { font-size: var(--lamplight-t-body); font-weight: 500; letter-spacing: 0;',
      '  color: var(--lamplight-ink-soft); position: absolute; top: 1px; }',
      '.temp-attribute .attribute { font-size: var(--lamplight-t-caption); line-height: 1.2;',
      '  color: var(--lamplight-ink-soft); font-variant-numeric: tabular-nums;',
      '  margin-top: 5px; white-space: nowrap; }',

      // ---- the hourly strip ----
      '.forecast { display: flex; flex-direction: row; justify-content: space-between;',
      '  gap: 0; padding: 10px 10px 12px; margin: 0; border-top: none;',
      '  background: url(' + LAMP_GRAIN + '), linear-gradient(180deg, rgba(5,8,18,0) 0%, rgba(5,8,18,0.26) 34%, rgba(5,8,18,0.34) 100%); }',
      '.forecast-item { flex: 1 1 0; min-width: 0; box-sizing: border-box;',
      '  display: flex; flex-direction: column; align-items: center; gap: 4px;',
      '  padding: 6px 2px; text-align: center; border-radius: 0; box-shadow: none; }',
      '.forecast-item-label { font-size: var(--lamplight-t-caption); line-height: 1;',
      '  color: var(--lamplight-ink-strong); font-variant-numeric: tabular-nums;',
      '  letter-spacing: 0.02em; white-space: nowrap; }',
      '.forecast-image-icon { width: 22px; height: 22px; padding: 4px 0;',
      '  margin: 4px 0 2px; display: flex; justify-content: center; opacity: 1; }',
      '.forecast-item .temp { font-size: var(--lamplight-t-state); font-weight: 600; line-height: 1;',
      '  color: #ffffff; font-variant-numeric: tabular-nums; }'
      // A tile has no wash. See the note in 65-glyphs.js.
    ].join('\n');
  }

  // The 12-hour silhouette. Until 1 Nov 2026 it was a polygon in a data URI on
  // .forecast::after, with NOW and the end hour as two more pseudo-elements. It is
  // now a real element, .lamp-rib, drawn by lampRibbon() (src/66-ribbon.js) at the
  // card's real width; _drawRibbon() writes it. Not a bar chart: with real Met
  // Office data twelve bars measure 2.0, 2.0, 3.3 ... 13.2px in a 26px band, which
  // is eleven invisible slivers and one blue block. See technical_reference.md.
  //
  // The band keeps its height. The plot is 20px and its top is 39px above the
  // card's bottom edge, 9px under the tile temperatures. The labels sit under the
  // baseline, 4px above the bottom edge. Before, they sat above the plot at 28px.
  _ribbonCss() {
    return [
      'ha-card { position: relative !important; }',
      '.forecast { padding-bottom: ' + (50 - this._footCut()) + 'px !important; }',
      '.lamp-rib {',
      '  display: block; position: absolute; left: 12px; right: 12px; bottom: 4px; height: 35px;',
      '  pointer-events: none;',
      '}',
      '.lamp-rib .lr-scale { height: 11px; margin-top: 4px; }',
      '.lamp-rib .lr-scale span {',
      '  position: absolute; top: 0; white-space: nowrap;',
      '  font-size: var(--lamplight-t-caption); line-height: 1; letter-spacing: 0; font-weight: 400;',
      '  color: var(--lamplight-ink-quiet); font-variant-numeric: tabular-nums;',
      '}'
    ].join('\n');
  }

  // Draw the ribbon into .lamp-rib at the width the band has now. The key holds
  // the width and the hours, so a hass push that changes neither writes nothing.
  _drawRibbon() {
    const el = this._wrap && this._wrap.querySelector('.lamp-rib');
    if (!el) return;
    const H = this._hours;
    if (this._footBand() !== 'ribbon' || !H) {
      if (this._ribKey !== '-') { el.innerHTML = ''; this._ribKey = '-'; }
      return;
    }
    const W = el.clientWidth;
    if (!W) return;                    // not laid out yet; the observer calls again
    const key = W + '|' + H.map(function (h) { return h.t + ':' + h.p; }).join(',');
    if (key === this._ribKey) return;
    this._ribKey = key;
    el.innerHTML = lampRibbon(H.map(function (h) { return h.p; }),
      H.map(function (h) { return parseInt(h.t, 10); }), ['NOW', H[H.length - 1].t], W, 20, null, true);   // true: the glow (16 Nov 2026)
  }

  // The chip and the reason are one flex row in real elements (.lamp-warn).
  // Until 0.33.1 they were two pseudo-elements, and the reason started at a
  // fixed inset of 74px. The phone draws text about 15% wider, so on the phone
  // the YELLOW chip reached into the reason. Now the reason follows the chip
  // at a 7px gap, whatever the chip measures.
  _warningCss(w) {
    const L = LAMP_WARN[w.level];
    return [
      '.forecast {',
      '  position: relative !important;',
      '  padding-bottom: ' + (42 - this._footCut()) + 'px !important;',
      '  background: url(' + LAMP_GRAIN + '), linear-gradient(180deg, rgba(5,8,18,0) 0%, rgba(5,8,18,0.26) 24%, rgba(5,8,18,0.40) 58%, rgba(' + L[1] + ') 100%) !important;',
      '}',
      '.lamp-warn {',
      '  display: flex; align-items: center; gap: 7px;',
      '  position: absolute; left: 12px; right: 12px; bottom: 11px;',
      '  pointer-events: none;',
      '}',
      // The chip's capitals and the reason's capitals must share a centre line.
      // A fixed offset cannot do it: the phone draws a different font, with
      // taller capitals. 1px up was right on the desktop and 1px wrong on the
      // phone. text-box trims each box to its capital height, so the centred
      // boxes put the capitals on one line in any font. Without text-box,
      // the boxes are centred and the capitals can be about 1px apart.
      '.lamp-warn-chip {',
      '  flex: 0 0 auto;',
      '  font-size: var(--lamplight-t-label); font-weight: 600; letter-spacing: 0.12em; line-height: 1;',
      '  padding: 4px 7px 4px 8px; border-radius: 5px;',
      w.live
        ? '  background: rgb(' + L[0] + '); color: ' + LAMP_GROUND + ';'
        : '  background: rgba(' + L[0] + ',0.20); color: rgb(' + L[3] + ');',
      '}',
      '.lamp-warn-time { color: var(--lamplight-ink-mid); font-weight: 400; }',
      '.lamp-warn-text {',
      '  flex: 1 1 auto; min-width: 0;',
      '  text-align: left; font-size: var(--lamplight-t-state); line-height: 1.2;',
      '  font-weight: ' + (w.level === 'extreme' ? 600 : 500) + ';',
      '  color: rgba(255,255,255,' + (w.level === 'extreme' ? 0.96 : 0.94) + ');',
      '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
      '}',
      '@supports (text-box: trim-both cap alphabetic) {',
      '  .lamp-warn-chip { text-box: trim-both cap alphabetic; padding: 5.5px 7px 5.5px 8px; }',
      '  .lamp-warn-text { text-box: trim-both cap alphabetic; padding: 3px 0; }',
      '}'
    ].join('\n');
  }

  // The half of the stylesheet that moves. Law, section 11: the foot of this
  // card holds one band, and a severe weather warning takes it. An amber
  // warning of rain and the shape of that rain are the same information, and
  // the warning says it better.
  _stateCss() {
    const out = [
      '.name::after {',
      "  content: '" + this._sentence() + "'; display: block;",
      '  font-size: var(--lamplight-t-state) !important; line-height: 1.3 !important;',
      '  white-space: normal !important; overflow-wrap: anywhere;',
      '  color: var(--lamplight-ink-soft) !important; font-variant-numeric: tabular-nums;',
      '}'
    ];
    const band = this._footBand();
    if (band === 'warning') out.push(this._warningCss(this._warning()));
    else if (band === 'ribbon') out.push(this._ribbonCss());
    return out.join('\n');
  }

  // The plate layout has 4px less padding under the tiles, so the foot band takes 4px less.
  _footCut() { return this._plates() ? 4 : 0; }

  _plates() { return this._skyMode === 'plates' && this._plateOk; }

  // What holds the foot of the card: 'warning', 'ribbon' or 'none'. A warning
  // takes the foot from the ribbon.
  _footBand() {
    if (this._warning()) return 'warning';
    const H = this._hours;
    const peak = H && H.length
      ? H.reduce(function (m, h) { return h.p > m ? h.p : m; }, H[0].p) : 0;
    return H && H.length > 1 && peak >= this._threshold ? 'ribbon' : 'none';
  }

  // ---- the markup --------------------------------------------------------

  _onHass() {
    this._subscribe();
    this._row();
    this._skinState();
  }

  // Build the card's own DOM. There is no child card any more: the gradient
  // definitions, the current row and the hourly strip are all drawn here.
  //
  // Everything goes inside ONE wrapper. `lamp-body` is a flex column with the
  // stack gap on it, so two children would put 8px of air between the row and
  // the strip and make the card 8px taller than section 11 records.
  _build() {
    const sheet = document.createElement('style');
    sheet.textContent = this._staticCss();
    this.shadowRoot.appendChild(sheet);
    this._skin = sheet;

    const state = document.createElement('style');
    this.shadowRoot.appendChild(state);
    this._state = state;
    this._lastState = null;

    const wrap = document.createElement('div');
    wrap.className = 'lamp-wx' + (this._plates() ? ' plates' : '');
    wrap.innerHTML = LAMP_GLYPH_DEFS +
      (this._showCurrent
        ? '<div class="content">' +
          '<div class="icon-image"></div>' +
          '<div class="info">' +
            '<div class="name-state"><div class="state"></div><div class="name"></div></div>' +
            '<div class="temp-attribute">' +
              '<div class="temp"></div><div class="attribute"></div>' +
            '</div>' +
          '</div></div>'
        : '') +
      (this._showForecast ? '<div class="forecast"></div>' +
        '<div class="lamp-warn"><span class="lamp-warn-chip"></span>' +
        '<span class="lamp-warn-text"></span></div>' +
        '<div class="lamp-rib"></div>' : '');
    wrap.addEventListener('click', this._onTap.bind(this));
    wrap.style.cursor = this._tap.action === 'none' ? 'default' : 'pointer';
    this._body.appendChild(wrap);
    this._wrap = wrap;

    // The sky stack. It is a child of the card, behind the content, in the same
    // way as the shell's canvas. The wrapper gets no position of its own: the
    // ribbon and the warning strip position against the card.
    if (this._skyMode !== 'classic') {
      const sky = document.createElement('div');
      sky.className = 'lamp-sky';
      // The mask (0.128.1-dev) makes the stack one group, so the card's rounded clip cuts it once.
      // Without it Chrome clips the plate, the frost and the glass one by one, and on the part-covered
      // pixels of the curve the light plate showed through the glass: a light line round the bottom
      // corners, plain once the foot made the glass dark (rgb 83,110,152 on 39,52,92). The mask is
      // fully opaque, so nothing else changes (at most 3 of 255 away from the corners).
      sky.style.cssText = 'position:absolute;inset:0;z-index:-1;pointer-events:none;' +
        'overflow:hidden;border-radius:inherit;' +
        '-webkit-mask-image:linear-gradient(#000,#000);mask-image:linear-gradient(#000,#000)';
      this._card.prepend(sky);
      this._card.style.setProperty('position', 'relative');
      this._card.style.setProperty('isolation', 'isolate');
      this._skyEl = sky;
      this._skyKey = null;
    }

    this._row();
    this._skinState();
    this._observeSky();
    this._paintSky();
  }

  // The text boxes that the glass must serve, relative to the card (0.120.0-dev). Each is
  // { n: role, x, y, w, h, ink: the text's white alpha, floor }. The word and the small text use
  // their ink boxes. The rain sentence is the ::after of .name, so its width comes from the text
  // and the font, 15% wider for the telephone, never wider than its column.
  _glassRoles() {
    const sr = this.shadowRoot, card = this._card, out = [];
    if (!card) return out;
    // Relative to the sky stack, not the card: the stack starts inside the card's 1 px border, and
    // one px on the glass's ramp is about 4% of contrast at the condition line.
    const r0 = (this._skyEl || card).getBoundingClientRect();
    const alpha = function (cs) {
      const m = (cs.color || '').match(/rgba?\(([^)]+)\)/);
      if (!m) return 1;
      const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return p.length > 3 ? p[3] : 1;
    };
    const add = function (n, b, ink, floor) {
      if (!b || !b.width || !b.height) return;
      out.push({ n: n, x: b.left - r0.left, y: b.top - r0.top, w: b.width, h: b.height, ink: Math.round(ink * 100) / 100, floor: floor });
    };
    const inkBox = function (el) { const g = document.createRange(); g.selectNodeContents(el); return g.getBoundingClientRect(); };
    const each = function (sel, n, floor, box) {
      sr.querySelectorAll(sel).forEach(function (el) {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
        add(n, box ? el.getBoundingClientRect() : inkBox(el), alpha(getComputedStyle(el)), floor);
      });
    };
    each('.state', 'word', 4.5);
    const nm = sr.querySelector('.name');
    if (nm) {
      const cs = getComputedStyle(nm, '::after'), b = nm.getBoundingClientRect();
      const txt = (cs.content || '').replace(/^["']|["']$/g, '');
      let w = b.width;
      if (txt && txt !== 'none') {
        const g = document.createElement('canvas').getContext('2d');
        g.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
        if (b.height < 1.5 * lh) w = Math.min(b.width, g.measureText(txt).width * 1.15);
      }
      add('sentence', { left: b.left, top: b.top, width: w, height: b.height }, alpha(cs), 4.5);
    }
    each('.temp-attribute .temp', 'temp', 3, true);
    each('.temp-attribute .temp span', 'unit', 4.5, true);
    each('.temp-attribute .attribute', 'hilo', 4.5);
    each('.forecast-item-label', 'labels', 4.5);
    each('.forecast-item .temp', 'hourtemp', 4.5);
    each('.lamp-rib .lr-scale span', 'scale', 4.5);
    each('.lamp-warn-text', 'warning', 4.5);
    return out;
  }

  // ---- the painted sky ---------------------------------------------------

  _observeSky() {
    if (this._skyRo) { this._skyRo.disconnect(); this._skyRo = null; }
    // The ribbon is drawn at the card's width, so a card with no sky observes too.
    if ((!this._skyEl && !this._showForecast) || !this.isConnected) return;
    const self = this;
    this._skyRo = new ResizeObserver(function () { self._fitWarn(); self._drawRibbon(); self._paintSky(); });
    this._skyRo.observe(this._card);
  }

  // Draw the stack again, but only if its signature changed. Home Assistant
  // sends a state object many times a minute. The signature holds the inputs to
  // the picture; the row and the state sheet are in the key too, because they
  // move the words, and the clear air follows the words.
  _paintSky() {
    const root = this._skyEl;
    if (!root || !this._hass || !this._card) return;
    const W = this._card.clientWidth, H = this._card.clientHeight;
    if (!W || !H) return;              // not in the layout yet; the observer calls again
    const hass = this._hass;
    const st = hass.states[this._entity];
    const cond = st ? st.state : 'unknown';
    const sun = hass.states[this._sun];
    const e = sun && sun.attributes ? parseFloat(sun.attributes.elevation) : NaN;
    const el = isFinite(e) ? Math.round(e * 2) / 2 : 90;   // no sun: the day keyframe
    const a = st && st.attributes ? st.attributes : {};
    const sp = parseFloat(a.wind_speed), br = parseFloat(a.wind_bearing);
    const wind = isFinite(sp) && isFinite(br)
      ? [Math.round(sp / 2) * 2, Math.round(br / 10) * 10 % 360] : null;   // no wind: no lean
    const band = this._footBand();
    let sig = [cond, el, wind ? wind[0] : '-', wind ? wind[1] : '-', W + 'x' + H, band].join('|');

    // The plate sky. A plate that is still loading waits (the old picture stays); a plate that
    // fails to load ends the mode, and the painted sky takes over from the next draw.
    if (this._plates()) {
      const pick = lampPlateChoose(cond, el, this._plateAssets);
      const self = this;
      const again = function () { self._skyKey = null; self._paintSky(); };
      const A = lampPlateLoad(pick.urlA, again);
      const B = pick.urlB ? lampPlateLoad(pick.urlB, again) : null;
      if (A.state === 'fail' || (B && B.state === 'fail')) {
        this._plateOk = false;
        if (this._wrap) this._wrap.classList.remove('plates');
        this._skinState();
        this._skyKey = null;
        return this._paintSky();
      }
      if (A.state === 'wait' || (B && B.state === 'wait')) return;
      // The hot sun (0.119.0-dev, design-docs/weather_hot_sun_options.html option 5): the felt
      // temperature, or the air's when the sensor has no number, gives the heat share. It joins the
      // signature only from LAMP_PLATE_HOT.from, to 0.5 degree, so a mild day redraws as before.
      const air = parseFloat(a.temperature);
      const felt = this._num(this._feels, isFinite(air) ? air : NaN);
      const Hh = LAMP_PLATE_HOT;
      const heat = isFinite(felt) && felt >= Hh.from ? Math.min(1, (Math.round(felt * 2) / 2 - Hh.from) / (Hh.to - Hh.from)) : 0;
      if (heat > 0) sig += '|h' + Math.round(felt * 2) / 2;
      sig += '|' + pick.key;
      // The glass follows the words: their boxes join the signature, as a short hash.
      const roles = this._glassRoles();
      let hs = 0;
      roles.forEach(function (r) {
        const k = r.n + Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.w) + ',' + Math.round(r.h) + ',' + r.ink;
        for (let i = 0; i < k.length; i++) hs = (hs * 31 + k.charCodeAt(i)) | 0;
      });
      sig += '|g' + (hs >>> 0).toString(36);
      // The deeper foot (LAMP_PLATE_FOOT) is off while a severe weather warning colours the foot.
      const warned = !!this._warning();
      if (warned) sig += '|w';
      if (sig === this._skyKey) return;
      this._skyKey = sig;
      root.setAttribute('data-sky', sig);
      root.textContent = '';
      try {
        lampPlatesBuild(root, pick, A, B, {
          cond: cond, wind: wind || [0, 0], heat: heat, roles: roles, foot: !warned,
          grain: this._grain ? 'url(' + LAMP_GRAIN + ')' : ''
        }, W, H);
      } catch (err) {
        root.textContent = '';
      }
      return;
    }

    const key = sig + '~' + this._lastRow + '~' + this._lastState;
    if (key === this._skyKey) return;
    this._skyKey = key;
    root.setAttribute('data-sky', sig);
    root.textContent = '';

    // Clear air: the boxes of the words and the glyphs, relative to the card.
    const r = this._card.getBoundingClientRect(), knock = [];
    this.shadowRoot.querySelectorAll(
      '.state, .name, .temp, .attribute, .icon-image svg, .forecast-item-label, ' +
      '.forecast-image-icon svg, .forecast-item .temp'
    ).forEach(function (n) {
      const b = n.getBoundingClientRect();
      knock.push([b.left - r.left, b.top - r.top, b.width, b.height]);
    });
    const assets = this._skyAssets;
    try {
      lampSkyBuild(root, cond, el, {
        skies: this._skies,
        masks: function (name) { return assets + 'sky_' + name + '.webp'; },
        wind: wind || [0, 0],
        knock: knock,
        ribbonTop: band === 'ribbon' ? H - 40 : band === 'warning' ? H - 44 : undefined,
        grain: this._grain ? 'url(' + LAMP_GRAIN + ')' : ''
      }, W, H);
    } catch (err) {
      root.textContent = '';           // a failed sky must never break the card
    }
  }

  // The card this replaced handed the tap to the stock child. It is ours now.
  // The household's configuration navigates to #today, the Day Card pop-up.
  _onTap() {
    const a = this._tap || {};
    if (a.action === 'none') return;
    if (a.action === 'navigate' && a.navigation_path) {
      history.pushState(null, '', a.navigation_path);
      const ev = new Event('location-changed', { bubbles: true, composed: true });
      ev.detail = { replace: false };
      this.dispatchEvent(ev);
      return;
    }
    this._moreInfo(a.entity || this._entity);
  }

  // The current row and the four tiles. Written only when something in them
  // moved: the card is repainted on every state object Home Assistant sends,
  // and most of them change nothing here.
  _row() {
    if (!this._wrap || !this._hass) return;
    const st = this._hass.states[this._entity];
    if (!st) return;
    const key = lampGlyphKey(st.state, this._night(Date.now()));
    const temp = st.attributes.temperature;
    const unit = st.attributes.temperature_unit || '';
    const hl = this._hiLo;
    // The glyph key is worked out HERE and not when the forecast arrived. A
    // forecast is pushed every few minutes, but sunset is not an event the
    // provider sends: keyed at arrival, a tile would hold its daylight form
    // until the next push, so the sun could set on the card several minutes
    // late. `_night` reads sun.sun, which moves on its own.
    const self = this;
    const tiles = (this._tiles || []).map(function (h) {
      return { label: h.label, temp: h.temp,
               key: lampGlyphKey(h.c, self._night(h.at.getTime())) };
    });
    const feels = this._feelsText();
    const word = this._stateWord(key);
    const sig = [key, word, temp, unit, feels, hl && hl.hi, hl && hl.lo,
                 tiles.map(function (h) {
                   return h.label + '|' + h.key + '|' + h.temp;
                 }).join(',')].join('~');
    if (sig === this._lastRow) return;
    this._lastRow = sig;

    if (this._showCurrent) {
      const q = this._wrap.querySelector.bind(this._wrap);
      q('.icon-image').innerHTML = lampGlyph(key, 40);
      q('.state').textContent = word;
      if (feels) {
        const f = document.createElement('span');
        f.className = 'feels';
        f.textContent = ' ' + feels;
        q('.state').appendChild(f);
        this._fitFeels(0);
      }
      // The non-breaking space holds the gap the absolutely positioned unit
      // then sits in. See the note on `.temp span` in _staticCss.
      q('.temp').innerHTML = temp === undefined ? ''
        : this._n(temp) + '&nbsp;<span>' + unit + '</span>';
      q('.attribute').textContent = hl
        ? this._n(hl.hi) + ' ' + unit + ' / ' + this._n(hl.lo) + ' ' + unit : '';
    }
    if (this._showForecast) {
      this._wrap.querySelector('.forecast').innerHTML =
        tiles.map(function (h) {
          return '<div class="forecast-item">' +
            '<div class="forecast-item-label">' + h.label + '</div>' +
            '<div class="forecast-image-icon">' + lampGlyph(h.key, 22) + '</div>' +
            '<div class="temp">' + self._n(h.temp) + '\u00b0</div>' +
            '</div>';
        }).join('');
    }
  }

  // A temperature, as the card this replaced printed it: a whole number loses
  // its `.0`, and nothing is rounded.
  _n(v) {
    return typeof v === 'number' && isFinite(v) ? String(Number(v)) : '';
  }

  _skinState() {
    if (!this._state || !this._hass) return;
    let css;
    try { css = this._stateCss(); } catch (e) { return; }
    // The warning words are text, not CSS, so they are written before the test.
    const strip = this._wrap && this._wrap.querySelector('.lamp-warn');
    const w = this._warning();
    if (strip && w) strip.firstChild.textContent = w.label.toUpperCase();
    if (css !== this._lastState) {             // nothing moved, so write nothing
      this._lastState = css;
      this._state.textContent = css;
    }
    // After the sheet: the strip is display:none until the sheet shows it, and
    // a hidden line has no width to measure. The ribbon is the same.
    this._fitWarn();
    this._drawRibbon();
  }

  // The shell paints the ground on its own ha-card. The weather card also needs
  // no padding of its own: the child draws to the edge.
  _paint() {
    super._paint();
    if (this._card) this._card.style.setProperty('padding', '0', 'important');
    this._paintSky();
  }
}

customElements.define('lamplight-weather', LampWeather);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-weather',
  name: 'Lamplight Weather',
  description: 'A weather card with a sky, a rain sentence and a probability ribbon.',
  preview: false
});
