// lamplight-day. The content of the Day Card (#today) pop-up on Overview.
//
// WHAT THIS REPLACES
// custom_templates/weather_day.jinja - a 286-line macro - plus sensor.met_office_day, a
// trigger template sensor that called the macro every 15 minutes and stored its JSON output
// as attributes for a button-card to read. The macro existed only because a Jinja template
// cannot read a forecast. This card can: it subscribes to weather/subscribe_forecast, exactly
// as lamplight-weather does, and computes the same window, groups, ledger and ribbon in JavaScript.
// The macro and the sensor both retire - see plans.md, phase 11, "open from phase 4".
//
// THE MACRO IS PROVIDER-AGNOSTIC ALREADY
// Read for what it depends on (technical_reference.md, phase 11): seven standard forecast
// fields, the standard fifteen conditions plus `overcast` (used additively, never asserted),
// and no provider name anywhere in the text. `lampDayCompute` below is a direct, function-for-
// function port - same window rule, same scoring, same sentence logic - not a rewrite. Nothing
// here is Met Office specific except the entity IDs in the configuration.
//
// VERIFIED AGAINST THE LIVE SENSOR, 22 SEPTEMBER 2026
// `lampDayCompute`, called with the same forecast, the same sun.sun snapshot and the same
// instant as the live sensor's own recompute (forced with the metoffice_day_refresh event so
// both draw on the same cached forecast poll), gave title, date, high, low, sunrise, sunset,
// brief, brief_dim, groups, ledger, ribbon_points and peak_label all identical to the live
// attributes. A first attempt, comparing two fetches taken a minute apart, showed the night
// group's low temperature off by one degree - real forecast data revision between the two
// reads, not a bug, and resolved by forcing both reads from one poll.
//
// THE POP-UP ITSELF DOES NOT MOVE
// Other parts of the dashboard address #today by #hash navigation. This card is the body
// card inside the bubble-card pop-up, the same relationship lamplight-batteries has to #batteries.
//
// ONE SCALE (27 Sep 2026, option 5 of design-docs/popup_sheets_rework_options.html). Every pop-up
// body now uses the Day Card's order: the number, one sentence, then the detail. The Day Card
// keeps its layout and takes the shared sizes: 14 for rows, 12.5 for detail, 11.5 for small
// labels under marks, and the one section label (10.5px, weight 500, 0.14em, 42% white).
//
// THE WARNING STRIP
// Read directly from the two Met Office warning sensors, the same entities lamplight-weather reads
// (technical_reference.md §6). This card does not share code with lamplight-weather's warning wash -
// the Day Card's warning is a chip at the top of a scrolling body, lamplight-weather's is a wash
// colour - but both read the same two sensors so they agree when a warning is in force.
//
// THE WARNING'S TIME (21 Oct 2026, options B1 + B3 of design-docs/weather_warning_detail_options.html)
// With the two time sensors, the block also gives the span and a count ("Starts in 25 hours ·
// lasts 14 hours"), and the timeline draws a rail in the warning colour beside the hours the
// warning covers, with one line where the rail begins. The words are in src/69-warn-time.js. The
// paint key holds the words, and a timer looks once a minute, so the count stays true and the
// warning goes at its end.
//
// Configuration:
//   entity           the weather entity. Required
//   sun_entity       default sun.sun
//   warning_sensor   the warning sensor. Optional: without it there is no warning block
//   warning_count_sensor  the number of warnings. Optional
//   warning_start_sensor  the warning's start time. Optional
//   warning_end_sensor  the warning's end time. Optional: without from and until the warning block
//                    has no times and the timeline no warning rail
//   No sensor key has a default (22 Nov 2026, 0.136.0-dev), as in lamplight-weather.
//   forecast_type    passed to the subscription. Default hourly

function lampDayJInt(v, def) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isFinite(n) ? Math.trunc(n) : def;
}
function lampDayJFloat(v, def) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isFinite(n) ? n : def;
}
function lampDayPad2(n) { return (n < 10 ? '0' : '') + n; }
function lampDayHM(d) { return lampDayPad2(d.getHours()) + ':' + lampDayPad2(d.getMinutes()); }
function lampDayDateStr(d) {
  return d.getFullYear() + '-' + lampDayPad2(d.getMonth() + 1) + '-' + lampDayPad2(d.getDate());
}
function lampDayMinutes(d) { return d.getHours() * 60 + d.getMinutes(); }

const LAMP_DAY_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LAMP_DAY_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
function lampDayLabel(d) {
  return LAMP_DAY_WEEKDAYS[d.getDay()] + ' ' + d.getDate() + ' ' + LAMP_DAY_MONTHS[d.getMonth()];
}

function lampDayMmWord(mm) {
  if (mm < 0.2) return 'a trace';
  if (mm < 1) return 'light';
  if (mm < 4) return 'moderate';
  return 'heavy';
}
function lampDayBand(minutes) {
  if (minutes < 300) return 'overnight';
  if (minutes < 660) return 'this morning';
  if (minutes < 810) return 'around midday';
  if (minutes < 1080) return 'this afternoon';
  if (minutes < 1290) return 'this evening';
  return 'tonight';
}
// THE GLYPHS ARE THE WEATHER CARD'S
// Until 24 September 2026 this card drew emoji, so the telephone's own emoji font chose the
// pictures. It now draws the Lamplight set from 65-glyphs.js, the same as lamplight-weather.
// master_design.html 6.12 widens the section 08 exception to cover this card.
// An hour row takes the glyph for its condition, and night is the hour's own `day` flag. A group
// takes one glyph that agrees with its words - see lampDayGroupKey.

// The index where a night changes from clear to cloudy, or back, when it changes once and each
// side holds two hours or more. Otherwise -1. `clr` is one boolean for each hour.
function lampDayNightCut(clr) {
  let cut = -1;
  for (let i = 1; i < clr.length; i++) {
    if (clr[i] === clr[i - 1]) continue;
    if (cut >= 0) return -1;
    cut = i;
  }
  return cut >= 2 && clr.length - cut >= 2 ? cut : -1;
}

const LAMP_DAY_WET =['rainy', 'pouring', 'lightning-rainy', 'lightning', 'snowy', 'snowy-rainy', 'hail'];

// A wet group shows its most severe hour, first in this list. A group can be wet on a chance of
// 40% or more with no wet condition in it; that group shows `rainy`.
const LAMP_DAY_SEVERITY = ['lightning-rainy', 'lightning', 'hail', 'pouring', 'snowy-rainy',
  'snowy', 'rainy'];

function lampDayGroupKey(bkt, seg, clearish) {
  if (bkt === 'wet') {
    for (let i = 0; i < LAMP_DAY_SEVERITY.length; i++) {
      const c = LAMP_DAY_SEVERITY[i];
      if (seg.some(function (h) { return h.c === c; })) return c;
    }
    return 'rainy';
  }
  if (bkt === 'bright') return 'partlycloudy-day';
  if (bkt === 'dull') return 'cloudy';
  return clearish ? 'clear-night' : 'partlycloudy-night';
}

// The window rule, the scoring and the sentence logic are a direct port of
// custom-templates/weather_day.jinja's day_card() macro. See the file header for how this was
// verified against the live sensor.
// The gust is printed in windUnit, the weather entity's own wind_speed_unit: the forecast arrives
// in that unit, so nothing is converted. The Jinja macro printed "mph" for a value in km/h; the
// household corrected the word on 24 September 2026. On 16 November 2026 the gust threshold of 30
// gave way to THE WIND steps in src/70-weather.js: the mean wind names the wind, and a gust is
// named only from 50 km/h.
function lampDayCompute(forecast, nextRisingIso, nextSettingIso, now, windUnit) {
  now = now || new Date();
  windUnit = windUnit || 'km/h';
  const t0 = Math.floor(now.getTime() / 1000 / 3600) * 3600;
  const today = lampDayDateStr(now);
  const tomorrow = lampDayDateStr(new Date(now.getTime() + 86400000));

  const srD = new Date(Date.parse(nextRisingIso));
  const ssD = new Date(Date.parse(nextSettingIso));
  const srMin = lampDayMinutes(srD), ssMin = lampDayMinutes(ssD);
  const sunrise = lampDayHM(srD), sunset = lampDayHM(ssD);

  let rem = 0;
  (forecast || []).forEach(function (h) {
    const ts = Date.parse(h.datetime) / 1000;
    if (ts >= t0 && lampDayDateStr(new Date(ts * 1000)) === today) rem++;
  });

  // TONIGHT AND TOMORROW (option 1 of design-docs/day_tomorrow_options.html, 31 Oct 2026).
  // From today's sunset, or when fewer than 6 hours of today are left, the window runs from now
  // to tomorrow's sunset. Until this date the card showed today only until 19:00, then jumped to
  // tomorrow at midnight: from sunset to 19:00 it had no tomorrow, and from 19:00 it had no
  // tonight. After sunset, next_setting is tomorrow's. Before it, tomorrow's is about a day later.
  const afterSunset = lampDayDateStr(ssD) !== today;
  const endTs = (afterSunset ? ssD.getTime() : ssD.getTime() + 86400000) / 1000;
  let mode, title;
  if (afterSunset || rem < 6) { mode = 'tonight'; title = 'Tonight and tomorrow'; }
  else { mode = 'today'; title = rem >= 12 ? 'Today' : 'This evening'; }

  const hrs = [];
  (forecast || []).forEach(function (h) {
    const ts = Date.parse(h.datetime) / 1000;
    const at = new Date(ts * 1000);
    const d = lampDayDateStr(at);
    const tod = lampDayMinutes(at);
    if (mode === 'today' ? (d === today && ts >= t0) : (ts >= t0 && ts < endTs)) {
      hrs.push({
        ts: ts, t: lampDayHM(at), tod: tod, c: h.condition,
        temp: Math.trunc(lampRound(lampDayJFloat(h.temperature, 0), 0)),
        p: lampDayJInt(h.precipitation_probability, 0),
        m: lampRound(lampDayJFloat(h.precipitation, 0), 2),
        g: Math.trunc(lampRound(lampDayJFloat(h.wind_gust_speed, 0), 0)),
        w: Math.trunc(lampRound(lampDayJFloat(h.wind_speed, 0), 0)),
        uv: lampDayJInt(h.uv_index, 0),
        // null when the provider gives no felt temperature: the felt range and sentence then stay away.
        f: h.apparent_temperature == null ? null
          : Math.trunc(lampRound(lampDayJFloat(h.apparent_temperature, 0), 0)),
        day: tod >= srMin && tod < ssMin
      });
    }
  });

  // After sunset the hour that holds the sunset is still a day hour. It is over, so it goes.
  if (afterSunset) while (hrs.length && hrs[0].day && lampDayDateStr(new Date(hrs[0].ts * 1000)) === today) hrs.shift();

  // The tonight window names tomorrow: the date that the evening leads to.
  const dateAt = mode === 'tonight' ? new Date(Date.parse(tomorrow + 'T12:00:00'))
    : (hrs.length ? new Date(hrs[0].ts * 1000) : new Date(t0 * 1000));
  const dateLabel = lampDayLabel(dateAt);
  // The short form, without the weekday, for a date line that does not fit (LampDay._fitDate).
  const dateShort = dateAt.getDate() + ' ' + LAMP_DAY_MONTHS[dateAt.getMonth()];

  const temps = hrs.map(function (h) { return h.temp; });
  const high = temps.length ? Math.max.apply(null, temps) : 0;
  const low = temps.length ? Math.min.apply(null, temps) : 0;
  const pmaxAll = hrs.length ? Math.max.apply(null, hrs.map(function (h) { return h.p; })) : 0;
  const gmaxAll = hrs.length ? Math.max.apply(null, hrs.map(function (h) { return h.g; })) : 0;
  const wmaxAll = hrs.length ? Math.max.apply(null, hrs.map(function (h) { return h.w; })) : 0;
  // THE WIND (src/70-weather.js): the strongest mean and the strongest gust of the window.
  const windText = lampWindText(wmaxAll, gmaxAll, windUnit, false);
  const uvmaxAll = hrs.length ? Math.max.apply(null, hrs.map(function (h) { return h.uv; })) : 0;

  const labels = hrs.map(function (h) {
    if (LAMP_DAY_WET.indexOf(h.c) >= 0 || h.p >= 40) return 'wet';
    if (!h.day) return 'night';
    return 'day';
  });

  const groups = [];
  let start = 0;
  for (let i = 0; i < hrs.length; i++) {
    if (i + 1 === hrs.length || labels[i + 1] !== labels[i]) {
      const seg = hrs.slice(start, i + 1);
      const cb = labels[i];
      const cloudyCt = seg.filter(function (h) { return ['cloudy', 'overcast', 'fog'].indexOf(h.c) >= 0; }).length;
      const bkt = cb === 'day' ? ((cloudyCt * 2 > seg.length) ? 'dull' : 'bright') : cb;
      const stemps = seg.map(function (h) { return h.temp; });
      const tmin = Math.min.apply(null, stemps), tmax = Math.max.apply(null, stemps);
      const pmax = Math.max.apply(null, seg.map(function (h) { return h.p; }));
      const gmax = Math.max.apply(null, seg.map(function (h) { return h.g; }));
      const uvmax = Math.max.apply(null, seg.map(function (h) { return h.uv; }));
      const mmax = Math.max.apply(null, seg.map(function (h) { return h.m; }));
      const trange = tmin === tmax ? (tmin + '°') : (tmin + '–' + tmax + '°');
      const span = seg.length === 1 ? seg[0].t : (seg[0].t + ' – ' + seg[seg.length - 1].t);
      // A dry period can hold an hour from 15% to 39%. The line names the highest one, so the
      // hour does not need a row of its own.
      const pHour = seg.filter(function (h) { return h.p === pmax; })[0];
      const slight = pmax >= 15 ? ' A slight chance, ' + pmax + '%, at ' + pHour.t + '.' : '';
      let rr, line, clearish = false, turn = null;
      if (bkt === 'wet') {
        // No "Peak n%": the value on the right and the hour rows give it.
        rr = pmax + '%';
        line = 'Rain, ' + lampDayMmWord(mmax) + ' — ' + mmax + ' mm.' +
          (lampToKmh(gmax, windUnit) >= LAMP_WIND_GUSTS ? ' Gusts to ' + gmax + ' ' + windUnit + '.' : '');
      } else if (bkt === 'bright') {
        rr = tmax + '°';
        line = 'Bright, up to ' + tmax + '°.' + (pmax >= 15 ? '' : ' Dry, under ' + Math.max(pmax, 5) + '%.') +
          (uvmax >= 3 ? ' UV ' + uvmax + '.' : '') + slight;
      } else if (bkt === 'dull') {
        rr = tmax + '°';
        line = 'Cloudy, ' + trange + '.' + (pmax >= 15 ? slight : ' Dry.');
      } else {
        rr = tmin + '°';
        const clr = seg.map(function (h) { return ['clear-night', 'sunny', 'partlycloudy'].indexOf(h.c) >= 0; });
        clearish = clr.filter(Boolean).length * 2 >= seg.length;
        // A night that changes once, with two hours or more on each side, says where it changes.
        // A majority vote called 17:00-06:00 "Cloudy" when the evening was clear until 22:00.
        const cut = lampDayNightCut(clr);
        if (cut > 0) {
          turn = { first: clr[0] ? 'Clear' : 'Cloudy', then: clr[0] ? 'cloudy' : 'clear', at: seg[cut].t };
          line = turn.first + ' until ' + turn.at + ', then ' + turn.then + ', down to ' + tmin + '°.' + slight;
        } else {
          line = (clearish ? 'Clear' : 'Cloudy') + ' overnight, down to ' + tmin + '°.' + slight;
        }
      }
      groups.push({ span: span, bkt: bkt, rr: rr, line: line, turn: turn, tmin: tmin, clearish: clearish,
        glyph: turn ? 'partlycloudy-night' : lampDayGroupKey(bkt, seg, clearish),
        start: seg[0].tod, mmax: mmax, pmax: pmax, seg: seg,
        sky: bkt === 'wet' ? 'wet' : (bkt === 'night' ? 'night' : 'day') });
      start = i + 1;
    }
  }

  // THROUGH THE DAY (25 Sep 2026, design-docs/day_card_sections_options.html, option D).
  // One timeline replaces "Worth knowing" and "Show every hour". Until this date the two lists
  // came from two segmentations of the same hours, so on a dry day they printed the same periods
  // twice. On a wet day they could also disagree: each took a majority of cloudy hours over a
  // different span, so one morning read "Bright" above and "Cloudy" below.
  // Now each period is one item, in time order, with no ranking. A wet period is a block with its
  // hour rows. A tick marks sunrise or sunset between items, or between rows in a wet block.
  const timeline = [];
  // In the tonight window, the sunrise into tomorrow also names the day. It is markup: the
  // weekday is bold. lampDayEsc does not escape, and nothing here comes from a user.
  const tickText = function (a, b) {
    if (!b.day) return 'sunset ' + sunset;
    const into = mode === 'tonight' && lampDayDateStr(new Date(b.ts * 1000)) === tomorrow;
    return (into ? '<b>' + LAMP_DAY_WEEKDAYS[new Date(b.ts * 1000).getDay()] + '</b> · ' : '') + 'sunrise ' + sunrise;
  };
  groups.forEach(function (g, gi) {
    const prev = groups[gi - 1];
    if (prev) {
      const a = prev.seg[prev.seg.length - 1], b = g.seg[0];
      if (a.day !== b.day) timeline.push({ kind: 'tick', text: tickText(a, b), from: prev.sky, to: g.sky });
    }
    // t0 and t1 are the item's first and last instants, in ms. The warning rail reads them.
    const item = { kind: g.sky === 'wet' ? 'wet' : 'band', sky: g.sky, span: g.span, glyph: g.glyph,
      rr: g.rr, line: g.line, p: g.pmax, rows: [],
      t0: g.seg[0].ts * 1000, t1: g.seg[g.seg.length - 1].ts * 1000 + 3600000 };
    // A one-hour wet period needs no row: its line already gives the hour.
    if (item.kind === 'wet' && g.seg.length > 1) {
      g.seg.forEach(function (h, k) {
        if (k && g.seg[k - 1].day !== h.day) item.rows.push({ tick: tickText(g.seg[k - 1], h) });
        item.rows.push({ t: h.t, t0: h.ts * 1000, glyph: lampGlyphKey(h.c, !h.day), p: h.p, temp: h.temp,
          mm: h.p >= 40 ? (lampDayMmWord(h.m) + ' · ' + h.m + ' mm') : '' });
      });
    }
    timeline.push(item);
  });

  const n = hrs.length;
  const pts = [];
  hrs.forEach(function (h, i) {
    const x = lampRound(i * (340 / Math.max(n - 1, 1)), 1);
    const y = lampRound(30 - (h.p / 100 * 24), 1);
    pts.push(lampFloat(x) + ',' + lampFloat(y));
  });
  const ribbonPoints = '0,30 ' + pts.join(' ') + (pts.length ? ' ' : '') + '340,30';

  let peakHour = null;
  if (hrs.length) {
    const sorted = hrs.slice().sort(function (a, b) { return a.p - b.p; });
    peakHour = sorted[sorted.length - 1];
  }
  const peakLabel = (peakHour && pmaxAll >= 15) ? ('peak ' + pmaxAll + '% at ' + peakHour.t) : 'dry all day';

  const wetGroups = groups.filter(function (g) { return g.bkt === 'wet'; });

  // THE RAIN WINDOW (option 4 of design-docs/weather_rain_ribbon_options.html, 1 Nov 2026).
  // The caption under the ribbon names each wet period: when, and the wettest hour's amount.
  // It takes the timeline's own wet periods, so it always agrees with the wet blocks below.
  // `wet` holds each period's first and last hour index; the ribbon marks them on its baseline.
  const rainWet = wetGroups.map(function (g) {
    return [hrs.indexOf(g.seg[0]), hrs.indexOf(g.seg[g.seg.length - 1])];
  }).filter(function (r) { return r[0] >= 0 && r[1] >= 0; });
  const rainLines = wetGroups.map(function (g) {
    return { span: g.span, word: lampDayMmWord(g.mmax), mm: g.mmax };
  });
  const dayGroups = groups.filter(function (g) { return g.bkt === 'dull' || g.bkt === 'bright'; });
  const peakTempHour = hrs.length ? (hrs.filter(function (h) { return h.temp === high; })[0] || null) : null;

  // THE FELT RANGE (option 4 of design-docs/weather_feels_like_options.html, 29 Oct 2026). The
  // highest and lowest felt values come from the same hours as the high and low. They show when
  // either end differs by LAMP_FEELS_GAP or more (src/70-weather.js), the card's own rule. `dir`
  // says which way the air feels, from the end that differs more: it picks the colour of the line.
  // The sentence names that end, and adds "in the wind" only when the hour it comes from passes
  // THE WIND steps (src/70-weather.js). The Met Office value also holds humidity, and in summer it can be
  // warmer than the air, so "in the wind" is not always true.
  let feels = null, feelsLine = '', windSaid = false;
  if (hrs.length && hrs.every(function (h) { return h.f !== null; })) {
    const fs = hrs.map(function (h) { return h.f; });
    const fHigh = Math.max.apply(null, fs), fLow = Math.min.apply(null, fs);
    const dHigh = fHigh - high, dLow = fLow - low;
    if (Math.abs(dHigh) >= LAMP_FEELS_GAP || Math.abs(dLow) >= LAMP_FEELS_GAP) {
      // On a tie, a warm day names its felt high and a cold day its felt low.
      const far = Math.abs(dLow) > Math.abs(dHigh) ? fLow
        : Math.abs(dHigh) > Math.abs(dLow) ? fHigh : (dHigh > 0 ? fHigh : fLow);
      const dir = (far === fLow ? dLow : dHigh) < 0 ? 'cold' : 'warm';
      feels = { high: fHigh, low: fLow, dir: dir };
      const at = hrs.filter(function (h) { return h.f === far; })[0];
      // The grey note gives the speed, so the wind is said once, with no number here.
      windSaid = dir === 'cold' && !!windText && !!lampWindText(at.w, at.g, windUnit, false);
      feelsLine = ' Feels nearer ' + far + '°' + (windSaid ? ' in the wind' : '') + '.';
    }
  }

  let brief;
  if (mode === 'tonight') {
    brief = lampDayTonightBrief(hrs, groups, Date.parse(nextRisingIso) / 1000) + feelsLine;
  } else if (wetGroups.length) {
    const wg = wetGroups[0];
    const before = dayGroups.filter(function (g) { return g.start < wg.start; });
    const opening = before.length ? (before[before.length - 1].bkt === 'bright' ? 'Bright' : 'Cloudy') : 'A wet start';
    const wetMid = parseInt(wg.span.split(' – ')[0].split(':')[0], 10) * 60;
    const after = dayGroups.filter(function (g) { return g.start > wg.start; });
    if (before.length) {
      brief = opening + ' until ' + wg.span.split(' – ')[0] + ', then rain ' + lampDayBand(wetMid) +
        ' — ' + lampDayMmWord(wg.mmax) + ' only.';
    } else {
      brief = 'Rain ' + lampDayBand(wetMid) + ' — ' + lampDayMmWord(wg.mmax) + ' only.';
    }
    if (after.length && after.some(function (g) { return g.bkt === 'bright'; })) {
      brief += ' Brightening through the afternoon to ' + high + '°.';
    } else if (after.length) {
      brief += ' Staying cloudy after, around ' + high + '°.';
    }
    brief += feelsLine;
  } else {
    const brightN = dayGroups.filter(function (g) { return g.bkt === 'bright'; }).length;
    const dullN = dayGroups.filter(function (g) { return g.bkt === 'dull'; }).length;
    if (brightN >= dullN && dayGroups.length) {
      brief = 'A dry, bright day, up to ' + high + '°' +
        (peakTempHour ? ' around ' + peakTempHour.t : '') + '.';
    } else if (dayGroups.length) {
      brief = 'Dry but cloudy, ' + low + '–' + high + '° through the day.';
    } else {
      brief = 'Dry, ' + low + '–' + high + '°.';
    }
    brief += feelsLine;
    // "By evening" needs a day before the night (F08, 31 Oct 2026).
    if (dayGroups.length && groups.length && groups[groups.length - 1].bkt === 'night' &&
      groups[groups.length - 1].line.indexOf('Clear') >= 0) {
      brief += ' Clear by evening.';
    }
  }
  // The grey note: the wind on a breezy or gusty day, else a high UV.
  const briefDim = windText ? windText + '.'
    : (uvmaxAll >= 4 ? ('UV ' + uvmaxAll + ' around midday.') : '');

  return {
    title: title, section: mode === 'tonight' ? 'Through the night and day' : 'Through the day',
    date: dateLabel, date_short: dateShort, high: high, low: low, feels: feels, sunrise: sunrise, sunset: sunset,
    brief: brief, brief_dim: briefDim, timeline: timeline,
    ribbon_points: ribbonPoints, peak_label: peakLabel, pmax: pmaxAll,
    rain: { p: hrs.map(function (h) { return h.p; }), h: hrs.map(function (h) { return parseInt(h.t, 10); }),
      end: hrs.length ? hrs[hrs.length - 1].t : '', wet: rainWet, lines: rainLines }
  };
}

// The brief of the tonight window: one sentence for the night, then one for tomorrow's daylight.
//   "Clear tonight, cloudy from 22:00, down to 8°. Tomorrow dry but cloudy, up to 12°."
// Tonight is every hour before the next sunrise; tomorrow is every hour after it. A daylight
// evening before sunset (summer, from 19:00) is in the timeline, not in the brief.
function lampDayTonightBrief(hrs, groups, riseTs) {
  const night = hrs.filter(function (h) { return h.ts < riseTs && !h.day; });
  const day = hrs.filter(function (h) { return h.ts >= riseTs && h.day; });
  const inN = function (g) { return g.seg[0].ts < riseTs; };
  let s = '';
  if (night.length) {
    const low = Math.min.apply(null, night.map(function (h) { return h.temp; }));
    const wet = groups.filter(function (g) { return g.bkt === 'wet' && inN(g); });
    const ng = groups.filter(function (g) { return g.bkt === 'night' && inN(g); });
    if (wet.length) {
      const mm = Math.max.apply(null, wet.map(function (g) { return g.mmax; }));
      s = 'Rain tonight — ' + lampDayMmWord(mm) + ', down to ' + low + '°.';
    } else if (ng.length === 1 && ng[0].turn) {
      const t = ng[0].turn;
      s = t.first + ' tonight, ' + t.then + ' from ' + t.at + ', down to ' + low + '°.';
    } else {
      const clear = ng.length && ng.every(function (g) { return g.clearish; });
      s = (clear ? 'Clear' : 'Cloudy') + ' tonight, down to ' + low + '°.';
    }
  }
  if (day.length) {
    const high = Math.max.apply(null, day.map(function (h) { return h.temp; }));
    const wet = groups.filter(function (g) { return g.bkt === 'wet' && !inN(g); });
    const dull = groups.filter(function (g) { return g.bkt === 'dull' && !inN(g); }).length;
    const bright = groups.filter(function (g) { return g.bkt === 'bright' && !inN(g); }).length;
    let t;
    if (wet.length) {
      // lampDayBand speaks of today ("this morning"); tomorrow's part is "in the morning".
      const band = lampDayBand(parseInt(wet[0].span.split(':')[0], 10) * 60).replace(/^this /, 'in the ');
      t = 'Tomorrow, rain ' + band + ', up to ' + high + '°.';
    } else {
      t = 'Tomorrow dry' + (bright >= dull ? ' and bright' : ' but cloudy') + ', up to ' + high + '°.';
    }
    s += (s ? ' ' : '') + t;
  }
  return s;
}

// ---- the HTML. A direct port of the button-card custom_field the sensor fed. -----------

function lampDayEsc(x) { return String(x == null ? '' : x); }
function lampDayBoldMm(t) { return lampDayEsc(t).replace(/([0-9.]+ mm)/, '<b>$1</b>'); }

// The small thermometer in front of the felt range. It takes the line's colour.
const LAMP_DAY_THERMO = "<svg width='9' height='15' viewBox='0 0 9 15' aria-hidden='true'>" +
  "<rect x='2.5' y='0.75' width='4' height='9' rx='2' fill='none' stroke='currentColor' stroke-width='1.3'/>" +
  "<circle cx='4.5' cy='11.5' r='2.6' fill='currentColor'/></svg>";

// The warning block in each weather status: the colours are the `sheet` set in src/02-palette.js.
// The alphas are this card's own: [gradient start, gradient end, the detail text].
const LAMP_DAY_WARN_A = { moderate: ['.26', '.12', '.7'], severe: ['.30', '.14', '.72'], extreme: ['.32', '.15', '.75'] };
function lampDayWarnCss(fn) {
  return Object.keys(LAMP_DAY_WARN_A).map(function (k) {
    return fn(k, LAMP_MEANINGS.weather[k].sheet, LAMP_DAY_WARN_A[k]);
  }).join('');
}

const LAMP_DAY_CSS =
  '<style>' +
  '.dc-wrap{font-family:Roboto,system-ui,sans-serif;color:#fff;white-space:normal}' +
  '.dc-warn{border-radius:14px;padding:12px 14px;margin:2px 0 16px}' +
  '.dc-warn .wt{font-size:var(--lamplight-t-body);font-weight:600;display:flex;align-items:center;gap:7px}' +
  '.dc-warn .wg{line-height:0;display:flex;--mdc-icon-size:16px}' +
  lampDayWarnCss(function (k, c) { return '.dc-warn.' + k + ' .wg{color:rgb(' + c.w + ')}'; }) +
  '.dc-warn .ww{font-size:var(--lamplight-t-caption);margin-top:7px;letter-spacing:0;opacity:.72}' +
  lampDayWarnCss(function (k, c, a) {
    return '.dc-warn.' + k + '{background:linear-gradient(100deg,rgba(' + c.w + ',' + a[0] + '),rgba(' + c.w + ',' + a[1] + '))}' +
      '.dc-warn.' + k + ' .wt{color:rgb(' + c.ink + ')}.dc-warn.' + k + ' .ww{color:rgba(' + c.ink + ',' + a[2] + ')}';
  }) +
  // THE NOTICE (option B1 of design-docs/weather_warning_detail_options.html, 21 Oct 2026). The span
  // and the count sit under the title, in line with its words (16px glyph + 7px gap). Measured on the
  // block's darkest end: the span 5.9 to 6.6:1; the count at .80, 4.9 to 5.4:1 (red at .74 was 4.4).
  '.dc-warn .wn{font-size:var(--lamplight-t-state);font-weight:500;margin:6px 0 0 23px;font-variant-numeric:tabular-nums}' +
  '.dc-warn .wc{font-size:var(--lamplight-t-state);margin:3px 0 0 23px;font-variant-numeric:tabular-nums}' +
  '.dc-warn .ww{margin-left:23px}' +
  lampDayWarnCss(function (k, c) {
    return '.dc-warn.' + k + ' .wn{color:rgba(' + c.ink + ',.92)}.dc-warn.' + k + ' .wc{color:rgba(' + c.ink + ',.80)}';
  }) +
  '.dc-date{font-size:var(--lamplight-t-state);color:var(--lamplight-ink-quiet);letter-spacing:0;padding:0 2px}.dc-date .ti{color:var(--lamplight-ink-strong);font-weight:600}' +
  // Top padding 10px, was 2px (24 Sep 2026): the ink gap from the date line to the numeral was
  // 5px and looked cramped. It is now 13px, still less than the 24px from the numeral to the brief.
  '.dc-head{display:flex;align-items:flex-end;justify-content:space-between;padding:10px 2px 14px}' +
  // 36px, was 44px (1 Oct 2026; 38px before 27 Sep): the same size as every other pop-up hero, and a step above
  // the 24px sheet title. Option 1 of design-docs/popup_type_scale_options.html.
  '.dc-t{font-size:var(--lamplight-t-display);font-weight:300;letter-spacing:-.02em;line-height:1}' +
  '.dc-t .lo{font-size:var(--lamplight-t-inline);letter-spacing:0;color:var(--lamplight-ink-quiet);margin-left:8px}' +
  '.dc-r{text-align:right;font-size:var(--lamplight-t-state);color:var(--lamplight-ink-quiet);line-height:1.5}' +
  // The felt range, under the high and low (option 4 of design-docs/weather_feels_like_options.html).
  // The colour says which way the air feels: periwinkle colder, amber warmer. 7.93 and 9.52:1 on the
  // sheet's ground, rgb(25,26,31). The head grows from 61.5 to 92px on the days it shows.
  // Periwinkle, was ice blue rgb(150,190,240) (0.40.0-dev): on a wet day the ice blue read as the
  // rain blue #8ac8ec, 20 degrees of OKLCH hue apart. Periwinkle is 52 degrees apart. Household
  // choice, 29 Oct 2026.
  '.dc-f{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:var(--lamplight-t-name);letter-spacing:0;font-variant-numeric:tabular-nums}' +
  '.dc-f svg{flex:0 0 auto}' +
  '.dc-f.cold{color:rgb(' + LAMP_MEANINGS.felt.colder + ')}.dc-f.warm{color:rgb(' + LAMP_MEANINGS.felt.warmer + ')}' +
  '.dc-brief{font-size:var(--lamplight-t-name);line-height:1.5;color:var(--lamplight-ink-strong);padding:0 2px 4px}' +
  '.dc-brief .d{color:var(--lamplight-ink-quiet)}' +
  '.dc-brief b{color:#8ac8ec;font-weight:500}' +
  '.dc-sh{font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--lamplight-ink-quiet);padding:26px 2px 10px;font-weight:600}' +
  // The ribbon is drawn by lampRibbon() (src/66-ribbon.js) once the card knows its width.
  // Until 1 Nov 2026 the caption was "peak n% at hh:mm" in monospace; §06 has one family.
  '.dc-rib{position:relative;min-height:48px;margin:2px 0 0}' +
  '.dc-rib .lr-scale{height:11px;margin-top:7px}' +
  '.dc-rib .lr-scale span{position:absolute;top:0;white-space:nowrap;font-size:var(--lamplight-t-caption);line-height:1;' +
    'letter-spacing:0;color:var(--lamplight-ink-quiet);font-variant-numeric:tabular-nums}' +
  '.dc-riblab{font-size:var(--lamplight-t-state);line-height:1.35;color:#8ac8ec;padding:8px 0 0;font-variant-numeric:tabular-nums}' +
  '.dc-riblab div{white-space:nowrap}' +
  '.dc-riblab b{font-weight:500;color:rgb(170,215,242)}' +
  // THE HOUR LEDGER IS A TIMELINE (24 Sep 2026, design-docs/day_card_ledger_options.html, option C).
  // A 3px rail down the left takes the colour of each item's sky: gold by day, indigo at night, rain
  // blue for a wet hour. An hour row has a dot on the rail; a quiet band is a plain segment; a tick
  // marks sunrise or sunset where the rail changes. No item draws a line. Until this date each quiet
  // band drew a line above and below itself, so two bands made a double line 4px apart.
  // The night rail is rgb(96,112,178), not the night sky's rgb(48,62,118): that is 1.72:1 on this
  // ground, below the 3:1 floor for a graphic. The dot's ring is the measured ground, rgb(25,26,31).
  // Text alphas went up with it: the hour count was white 30%, 2.71:1; every label is now 5.8:1+.
  '.dc-ledger{padding-top:10px;--sky-day:rgb(209,162,75);--sky-night:rgb(96,112,178);--sky-wet:rgb(90,186,238)}' +
  '.dc-ledger>div{position:relative}' +
  '.dc-ledger>div::before{content:"";position:absolute;left:7px;top:0;bottom:0;width:3px;background:var(--sky)}' +
  '.dc-ledger>div:first-child::before{top:8px;border-radius:2px 2px 0 0}' +
  '.dc-ledger>div:last-child::before{bottom:8px;border-radius:0 0 2px 2px}' +
  '.dc-ledger .s-day{--sky:var(--sky-day)}.dc-ledger .s-night{--sky:var(--sky-night)}.dc-ledger .s-wet{--sky:var(--sky-wet)}' +
  '.dc-row{display:grid;grid-template-columns:44px 24px 1fr 40px;align-items:center;gap:0 8px;padding:7px 2px 7px 22px;font-size:var(--lamplight-t-body)}' +
  '.dc-row::after{content:"";position:absolute;left:4px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%;background:var(--sky);box-shadow:0 0 0 2px rgb(25,26,31)}' +
  '.dc-row .t{font-variant-numeric:tabular-nums;color:var(--lamplight-ink-mid);font-size:var(--lamplight-t-state)}' +
  '.dc-row .g{display:flex;justify-content:center;line-height:0}' +
  '.dc-row .tm{text-align:right;font-variant-numeric:tabular-nums;font-size:var(--lamplight-t-body)}' +
  // The bar is a <span>, so it needs display:block. Without it the bar had no box and never drew.
  '.dc-bar{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.08);position:relative;overflow:hidden}' +
  '.dc-bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(31,127,184,.7),rgba(90,186,238,1));border-radius:2px}' +
  '.dc-pc{font-variant-numeric:tabular-nums;font-size:var(--lamplight-t-caption);color:var(--lamplight-ink-soft);margin-top:3px;display:flex;gap:6px;align-items:baseline}' +
  '.dc-mm{color:#8ac8ec;font-size:var(--lamplight-t-caption)}' +
  '.dc-tick{padding:3px 2px 3px 22px;font-size:var(--lamplight-t-caption);letter-spacing:0;color:var(--lamplight-ink-soft);font-variant-numeric:tabular-nums}' +
  '.dc-ledger>.dc-tick::before{background:linear-gradient(var(--from),var(--to))}' +
  '.dc-tick b{font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.dc-ledger>.dc-tick::after{content:"";position:absolute;left:2px;top:50%;width:13px;height:1.5px;background:rgba(255,255,255,.55)}' +
  // A period on the rail: time, glyph, value, then the sentence that "Worth knowing" gave it.
  '.dc-band{padding:9px 2px 9px 22px}' +
  '.dc-band .bh{display:flex;align-items:center;gap:9px;font-size:var(--lamplight-t-body)}' +
  '.dc-band .tt{font-variant-numeric:tabular-nums;color:var(--lamplight-ink-mid);font-size:var(--lamplight-t-state);min-width:78px}' +
  '.dc-band .gg{display:flex;line-height:0;flex:0 0 auto}' +
  '.dc-band .rr{margin-left:auto;font-variant-numeric:tabular-nums;font-size:var(--lamplight-t-body);color:var(--lamplight-ink-strong)}' +
  '.dc-band .bb{font-size:var(--lamplight-t-state);color:var(--lamplight-ink-soft);margin-top:4px;line-height:1.45}' +
  '.dc-band .bb b{color:#8ac8ec;font-weight:500}' +
  // A wet period is the one tinted object: the tint of the old "Worth knowing" rain box, on the
  // rail, with its hour rows inside. The rows inside it have no dot; the block is the mark.
  '.dc-wetblk{margin:4px 0 4px 22px;border-radius:12px;background:rgba(31,127,184,.15);padding:2px 0 4px}' +
  '.dc-wetblk .dc-band{padding-left:12px;padding-right:12px}' +
  '.dc-wetblk .dc-row{padding-left:12px;padding-right:10px}' +
  '.dc-wetblk .dc-row::after{display:none}' +
  '.dc-wetblk .dc-tick{padding-left:12px}' +
  // THE WARNING RAIL (option B3, 21 Oct 2026). A second 3px rail in the warning colour, 6px left
  // of the sky rail, beside the hours the warning covers. It is a real element, not a pseudo-
  // element: ::before is the sky rail and a tick's ::after is its mark. In a wet block the rail
  // goes on the block's rows (left -21px reaches the ledger's 1px through the block's 22px
  // margin), and reaches over the block's margin and padding (6px above, 8px below) where the
  // warning goes on past the block. One line in the warning's colour says where it begins.
  lampDayWarnCss(function (k, c) {
    return '.dc-ledger' + (k === 'moderate' ? '' : '.w-' + k) + '{--warn:rgb(' + c.w + ');--warn-ink:rgba(' + c.ink + ',.86)}';
  }) +
  '.dc-wr{position:absolute;left:1px;top:0;bottom:0;width:3px;background:var(--warn);pointer-events:none}' +
  '.dc-ledger>div:last-child>.dc-wr{bottom:8px;border-radius:0 0 2px 2px}' +
  '.dc-wetblk>.w-in{position:relative}' +
  '.dc-wetblk>.w-in>.dc-wr{left:-21px}' +
  '.dc-wetblk>.w-in>.dc-wr.up{top:-6px}.dc-wetblk>.w-in>.dc-wr.dn{bottom:-8px}' +
  '.dc-ledger>div:last-child .dc-wr.dn{bottom:0}' +
  '.dc-wn{font-size:var(--lamplight-t-state);color:var(--warn-ink);margin-top:5px;line-height:1.4}' +
  '.dc-wetblk>.dc-wn{margin:0;padding:2px 12px 6px}' +
  '</style>';

// The warning's one line on the timeline, where its rail begins.
//   starts in the card's day   "Wind warning from 23:00", "... from 23:00, to Friday 13:00"
//   started before it          "Wind warning until 13:00", "... until Friday 13:00"
// `day` is a moment in the card's day; a time on another date takes its weekday.
function lampDayWarnLine(reason, span, startsHere, day) {
  const other = function (t) { return lampWarnDayGap(t, day) !== 0; };
  const at = function (t) { return (other(t) ? LAMP_WARN_DAYS[t.getDay()] + ' ' : '') + lampWarnHM(t); };
  if (startsHere) {
    return reason + ' warning from ' + lampWarnHM(span.from) +
      (other(span.until) ? ', to ' + at(span.until) : ' to ' + lampWarnHM(span.until));
  }
  return reason + ' warning until ' + at(span.until);
}

// The chip text is the sensor's own state string, as before. `span` is from lampWarnSpan, or null
// when the time sensors are missing; `now` is the paint's clock. A warning whose end has passed
// is not drawn at all.
function lampDayBody(d, warnState, warnCount, span, now) {
  let h = LAMP_DAY_CSS + LAMP_GLYPH_DEFS + "<div class='dc-wrap'>";
  now = now || new Date();
  let cls = null;

  if (warnState && ['none', 'unknown', 'unavailable', ''].indexOf(warnState) < 0 && !(span && span.over)) {
    cls = lampWeatherStatus(warnState);
    const n = warnCount ? parseInt(warnCount, 10) : 0;
    const note = lampWarnNotice(span, now);
    h += "<div class='dc-warn " + cls + "'>" +
      "<div class='wt'><span class='wg'><ha-icon icon='mdi:alert'></ha-icon></span>" + lampDayEsc(warnState) + "</div>" +
      (note ? "<div class='wn'>" + lampDayEsc(note.span) + "</div><div class='wc'>" + lampDayEsc(note.count) + "</div>" : "") +
      (n > 1 ? "<div class='ww'>" + n + " warnings in force</div>" : "") +
      "</div>";
  }
  const wr = cls && span ? span : null;
  const wf = wr ? wr.from.getTime() : 0, wu = wr ? wr.until.getTime() : 0;
  const on = function (t0, t1) { return !!wr && t0 < wu && t1 > wf; };
  const reason = cls ? lampWarnReason(warnState) : '';
  let lined = false;
  // The one line goes after the first element the rail is on.
  const wline = function (t0) {
    if (lined) return '';
    lined = true;
    return "<div class='dc-wn'>" + lampDayEsc(lampDayWarnLine(reason, wr, wf >= t0, new Date(t0))) + "</div>";
  };

  h += "<div class='dc-date'><span class='ti'>" + lampDayEsc(d.title) + "</span> · <span class='dd' data-full='" +
    lampDayEsc(d.date) + "' data-short='" + lampDayEsc(d.date_short || d.date) + "'>" + lampDayEsc(d.date) + "</span></div>";
  h += "<div class='dc-head'><div><div class='dc-t'>" + lampDayEsc(d.high) + "°" +
    "<span class='lo'>/ " + lampDayEsc(d.low) + "°</span></div>" +
    (d.feels ? "<div class='dc-f " + d.feels.dir + "'>" + LAMP_DAY_THERMO + "<span>feels " +
      lampDayEsc(d.feels.high) + "° / " + lampDayEsc(d.feels.low) + "°</span></div>" : '') + "</div>" +
    "<div class='dc-r'>Sunrise " + lampDayEsc(d.sunrise) + "<br>Sunset " + lampDayEsc(d.sunset) + "</div></div>";

  h += "<div class='dc-brief'>" + lampDayEsc(d.brief) +
    (d.brief_dim ? " <span class='d'>" + lampDayEsc(d.brief_dim) + "</span>" : "") + "</div>";

  // The section shows only when an hour reaches 15%, the card's own "dry all day" line. On a
  // dry day it drew a flat ribbon. Household decision, 24 September 2026.
  if (d.pmax >= 15) {
    h += "<div class='dc-sh'>Chance of rain</div>";
    // The plot is drawn into .dc-rib by LampDay._drawRib(), at the measured width.
    h += "<div class='dc-rib'></div>";
    const R = d.rain || { lines: [] };
    h += "<div class='dc-riblab'>" + (R.lines.length ? R.lines.map(function (l) {
      return "<div><b>Rain likely " + lampDayEsc(l.span) + "</b> · " + lampDayEsc(l.word) + ", up to " +
        lampDayEsc(l.mm) + " <span class='u'>mm an hour</span></div>";
    }).join('') : "<div>No hour above " + lampDayEsc(d.pmax) + "%</div>") + "</div>";
  }

  // THROUGH THE DAY. Always open: it replaces two sections, one of them behind a tap.
  // Each item carries data-p, its highest chance of rain, for test/verify-day.js.
  const tl = d.timeline || [];
  if (tl.length) {
    const band = function (it) {
      return "<div class='bh'><span class='tt'>" + lampDayEsc(it.span) + "</span>" +
        "<span class='gg'>" + lampGlyph(it.glyph, 20) + "</span>" +
        "<span class='rr'>" + lampDayEsc(it.rr) + "</span></div>" +
        "<div class='bb'>" + lampDayBoldMm(it.line) + "</div>";
    };
    const WR = "<i class='dc-wr'></i>";
    // Is the item before and the item after this tick under the warning?
    const near = function (i) {
      const a = tl[i - 1], b = tl[i + 1];
      return !!(a && b && a.t0 !== undefined && b.t0 !== undefined && on(a.t0, a.t1) && on(b.t0, b.t1));
    };
    h += "<div class='dc-sh'>" + lampDayEsc(d.section || 'Through the day') + "</div><div class='dc-ledger" + (cls && cls !== 'moderate' ? ' w-' + cls : '') + "'>";
    tl.forEach(function (it, i) {
      if (it.kind === 'tick') {
        h += "<div class='dc-tick' style='--from:var(--sky-" + it.from + ");--to:var(--sky-" + it.to + ")'>" +
          lampDayEsc(it.text) + (near(i) ? WR : '') + "</div>";
      } else if (it.kind === 'band') {
        const w = on(it.t0, it.t1);
        h += "<div class='dc-band s-" + it.sky + "' data-p='" + it.p + "'" + (w ? " data-warn='1'" : '') + ">" +
          band(it) + (w ? wline(it.t0) + WR : '') + "</div>";
      } else {
        // A whole block under the warning, or a block with no rows, takes one rail. Otherwise
        // the rail is on the header and the rows it covers.
        const all = on(it.t0, it.t1) && (!it.rows.length || (wf <= it.t0 && wu >= it.t1));
        const part = !all && on(it.t0, it.t1);
        h += "<div class='dc-wetwrap s-wet' data-p='" + it.p + "'" + (all || part ? " data-warn='1'" : '') + ">" +
          (all ? WR : '') + "<div class='dc-wetblk'>";
        const head = part && wf <= it.t0;
        h += "<div class='dc-band" + (head ? " w-in" : '') + "'>" + band(it) +
          (head ? "<i class='dc-wr up'></i>" : '') + "</div>";
        if (all) h += wline(it.t0);
        else if (head) h += wline(it.t0).replace("class='dc-wn'", "class='dc-wn w-in'").replace('</div>', WR + '</div>');
        const rowOn = function (r) { return !!r && r.t0 !== undefined && part && on(r.t0, r.t0 + 3600000); };
        // The last covered row reaches down over the block's foot when the warning goes on past it.
        const lastOn = (function () {
          for (let k = it.rows.length - 1; k >= 0; k--) if (rowOn(it.rows[k])) return k;
          return -1;
        })();
        it.rows.forEach(function (r, k) {
          if (r.tick) {
            const w = (head || rowOn(it.rows[k - 1])) && rowOn(it.rows[k + 1]);
            h += "<div class='dc-tick" + (w ? " w-in" : '') + "'>" + lampDayEsc(r.tick) + (w ? WR : '') + "</div>";
            return;
          }
          const w = rowOn(r);
          const note = w ? wline(r.t0) : '';
          const cap = w && k === lastOn && wu > it.t1 ? " dn" : '';
          h += "<div class='dc-row s-wet" + (w ? " w-in" : '') + "'><span class='t'>" + lampDayEsc(r.t) + "</span>" +
            "<span class='g'>" + lampGlyph(r.glyph, 20) + "</span>" +
            "<span><span class='dc-bar'><i style='width:" + lampDayEsc(r.p) + "%'></i></span>" +
            "<span class='dc-pc'>" + lampDayEsc(r.p) + "%" +
            (r.mm ? " <span class='dc-mm'>" + lampDayEsc(r.mm) + "</span>" : "") + "</span></span>" +
            "<span class='tm'>" + lampDayEsc(r.temp) + "°</span>" +
            (w ? "<i class='dc-wr" + (note ? '' : cap) + "'></i>" : '') + "</div>";
          // The line follows the row it begins on, and carries the rail on to the next row.
          if (note) h += note.replace("class='dc-wn'", "class='dc-wn w-in'").replace('</div>', "<i class='dc-wr" + cap + "'></i></div>");
        });
        h += "</div></div>";
      }
    });
    h += "</div>";
  }

  h += "</div>";
  return h;
}

class LampDay extends HTMLElement {

  static getStubConfig(hass) {
    return { entity: lampFirstWeather(hass) };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (!config.entity) throw new Error('lamplight-day needs an `entity`');
    this._config = config;
    this._entity = config.entity;
    this._sun = lampOpt('day', config, 'sun_entity');
    this._warnEntity = config.warning_sensor || null;
    this._warnCount = config.warning_count_sensor || null;
    this._warnFrom = config.warning_start_sensor || null;
    this._warnUntil = config.warning_end_sensor || null;
    this._forecastType = lampOpt('day', config, 'forecast_type');
    this._unsub = null;
    this._forecast = null;
    this._key = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._subscribe();
    this._maybePaint();
  }

  getCardSize() { return 6; }

  connectedCallback() {
    this._subscribe();
    if (!this._tick) {
      const self = this;
      this._tick = setInterval(function () { self._maybePaint(); }, 60000);
    }
  }

  disconnectedCallback() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    if (this._tick) { clearInterval(this._tick); this._tick = null; }
  }

  _subscribe() {
    if (this._unsub || !this._hass || !this._entity) return;
    const self = this;
    let killed = false;
    this._unsub = function () { killed = true; };
    this._hass.connection.subscribeMessage(
      function (msg) { self._forecast = (msg && msg.forecast) || []; self._paint(); },
      { type: 'weather/subscribe_forecast', entity_id: this._entity, forecast_type: this._forecastType }
    ).then(function (off) {
      if (killed) { off(); return; }
      self._unsub = off;
    }).catch(function () { self._unsub = null; });
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    // An inline host gives a shadow child no clientWidth, and the ribbon is drawn at its width.
    this.style.display = 'block';
    const card = document.createElement('ha-card');
    this._card = card;
    [['background', 'transparent'], ['border', 'none'], ['border-radius', '0'],
     ['box-shadow', 'none'], ['backdrop-filter', 'none'], ['-webkit-backdrop-filter', 'none']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    card.style.padding = '2px 2px 8px';
    card.style.boxSizing = 'border-box';
    card.style.display = 'block';
    this._body = document.createElement('div');
    card.appendChild(this._body);
    this.shadowRoot.appendChild(card);
    if (window.ResizeObserver) {
      const self = this;
      if (this._ro) this._ro.disconnect();
      this._ro = new ResizeObserver(function () { self._fitDate(); self._drawRib(); });
      this._ro.observe(card);
    }
  }

  // THE DATE LINE FITS ON ONE LINE (31 Oct 2026). "Tonight and tomorrow · Wednesday 30 September"
  // is about 286px at 375px, and the household's 360px phone draws text about 15% wider, so it
  // wraps there. When the text times 1.15 is wider than the line, the date drops its weekday:
  // the sunrise tick names the weekday in that window. The text is measured in the DOM with a
  // Range, never with canvas measureText. A card with no width yet keeps the full date; the
  // ResizeObserver calls this again when the pop-up opens.
  _fitDate() {
    const line = this._body && this._body.querySelector('.dc-date');
    const dd = line && line.querySelector('.dd');
    if (!dd) return;
    if (dd.textContent !== dd.dataset.full) dd.textContent = dd.dataset.full;
    const cs = getComputedStyle(line);
    const box = line.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (!box) return;
    // A wrapped line is as wide as the box, so measure each piece's own width and add.
    let w = 0;
    line.childNodes.forEach(function (n) {
      const r = document.createRange();
      r.selectNodeContents(n);
      w += r.getBoundingClientRect().width;
    });
    if (w * 1.15 > box) dd.textContent = dd.dataset.short;
  }

  // A forecast push always repaints - it is the one thing this card exists to react to. A
  // plain hass push (a warning sensor, sun.sun) repaints only when something it reads moved.
  _maybePaint() {
    const key = this._stateKey();
    if (key === this._key) return;
    this._paint();
  }

  _stateKey() {
    const h = this._hass;
    if (!h) return '-';
    const w = h.states[this._warnEntity];
    const wc = h.states[this._warnCount];
    const sun = h.states[this._sun];
    const span = lampWarnSpan(h, this._warnFrom, this._warnUntil, new Date());
    const note = lampWarnNotice(span, new Date());
    return (w ? w.state : '-') + '|' + (wc ? wc.state : '-') + '|' +
      (sun ? sun.attributes.next_rising + ':' + sun.attributes.next_setting : '-') + '|' +
      (span ? span.from.getTime() + ':' + span.until.getTime() + ':' + span.over : '-') + '|' +
      (note ? note.span + ':' + note.count : '-');
  }

  _paint() {
    if (!this._hass || !this._body) return;
    this._key = this._stateKey();
    const sun = this._hass.states[this._sun];
    if (!sun || !this._forecast) {
      this._body.innerHTML = LAMP_DAY_CSS + "<div class='dc-wrap' style='padding:16px 2px'>--</div>";
      return;
    }
    const wx = this._hass.states[this._entity];
    const d = lampDayCompute(this._forecast, sun.attributes.next_rising,
      sun.attributes.next_setting, new Date(), wx && wx.attributes.wind_speed_unit);
    const w = this._hass.states[this._warnEntity];
    const wc = this._hass.states[this._warnCount];
    // "Show every hour" was a <details> here until 25 September 2026; the timeline is always open,
    // so the paint has no open state to carry.
    const now = new Date();
    this._body.innerHTML = lampDayBody(d, w ? w.state : null, wc ? wc.state : null,
      lampWarnSpan(this._hass, this._warnFrom, this._warnUntil, now), now);
    this._rain = d.rain;
    this._fitDate();
    this._drawRib();
  }

  // Draw the ribbon at the width .dc-rib has now, then fit the caption. A card with no width
  // yet (the pop-up is closed) draws nothing; the ResizeObserver calls this when it opens.
  _drawRib() {
    const el = this._body && this._body.querySelector('.dc-rib');
    const R = this._rain;
    if (!el || !R) return;
    const W = el.clientWidth;
    if (!W) return;
    if (el.dataset.w !== String(W) || !el.firstChild) {
      el.dataset.w = String(W);
      el.innerHTML = lampRibbon(R.p, R.h, ['NOW', R.end], W, 30, R.wet, true);   // true: the glow (16 Nov 2026)
    }
    this._fitRain();
  }

  // The caption is one line for each wet period. The phone draws text about 15% wider, so a
  // line whose text times 1.15 is wider than the box says "mm/h" in place of "mm an hour".
  // The text is measured in the DOM with a Range, as _fitDate does.
  _fitRain() {
    const cap = this._body && this._body.querySelector('.dc-riblab');
    if (!cap) return;
    const box = cap.clientWidth;
    if (!box) return;
    cap.querySelectorAll('div').forEach(function (line) {
      const u = line.querySelector('.u');
      if (!u) return;
      u.textContent = 'mm an hour';
      const r = document.createRange();
      r.selectNodeContents(line);
      if (r.getBoundingClientRect().width * 1.15 > box) u.textContent = 'mm/h';
    });
  }
}

customElements.define('lamplight-day', LampDay);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-day',
  name: 'Lamplight Day',
  description: 'The Day Card: a day’s forecast, a rain ribbon and one timeline of the day.',
  preview: false
});
