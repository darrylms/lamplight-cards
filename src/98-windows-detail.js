// lamplight-windows-detail. The Windows pop-up body: the room's windows now, after dark, and against
// the usual, in words, and a row for each window. With a `rooms` key it is the home-wide body.
//
// THE DECISION (27 Sep 2026, design-docs/popup_sheets_rework_options.html, options 10, 20, 22
// and 12). Until this date the body drew a Today ribbon and a week of ribbons (option 3 of
// windows_popup_options.html, 26 Sep 2026). The household asks three things, in this order: is a
// window open now, and for how long; was one left open after dark; and today against the usual.
// The ribbons showed all three, but you had to find them. Now:
//   the hero        the room: "All closed", "1 open", "2 open". Never "shut"
//   the lead        one 15px sentence that names the window that is open, or says since when all
//                   are closed and how long a window was open today
//   After dark      in words only (option 22). A row of day dots read as a weather forecast
//   Today and usual one sentence and one bar: today's hours against a tick at the usual
//   the rows        one a window, each with its own state and, with two windows or more, its
//                   own count of evenings after dark
// Every line above the rows speaks for the room ("a window"); every line in a row speaks for that
// window (option 20).
//
// THE QUIET SHEET (16 Nov 2026, design-docs/windows_room_refresh_options.html, option 5 "Plain
// Words and the Weather"). The body above said each fact two or three times at one weight (four
// repeats, three bold sentences, three labels). Now each thing is said once, in the climate
// sheet's grammar:
//   the hero        as before
//   the lead        the open window and since when; or "Since Tue 12:36." and today's time
//   the band        the house sheet's weather band, while a window here is open and the next
//                   hours are bad (the rule of lampWinBand), without the open phrase
//   the rows        an open window first. A row says its time only when the lead does not
//   Worth a look    only while a rule is true: still open after dark; left open after dark on an
//                   evening in the past `days`; open longer than usual today; no signal
//   How it's been   Record rows: open after dark, open today, a usual day. A fact that the lead
//                   or a note says is not repeated; an empty section is not drawn
// The 0-14h bar and the After dark and Today and usual sentences are gone. A row's battery shows
// at 39% or less, in the battery sheet's bands (master 19.23). "This week" is never written for
// the rolling `days`: the words are "the past 7 days". Time for the room is the time at least one window was open, never a sum:
// two windows open together for one hour is one hour.
//
// THE OPEN COLOUR is sky 60,200,235 (option 12). The orange 235,120,70 means "replace" and "warm"
// on this dashboard; an open window is not an alarm.
//
// AFTER DARK. An evening runs from that day's sunset for 12 hours. A window is "after dark" on
// an evening when one of its open intervals overlaps it. The sunset of each day is read from the
// sun entity's own history (the first change to below_horizon after noon), fetched in the same
// query as the contacts. A day with no sunset in the history uses today's, which is at most a
// few minutes wrong over a week.
//
// Configuration:
//   windows          required, not empty. [{entity, name, battery_sensor}]. `name` defaults to
//                    the entity's own friendly name
//   accent           the "open" colour, "r,g,b". Default 60,200,235
//   sun_entity       a sun entity, for "after dark". Default sun.sun. Omit (null) to leave After
//                    dark out
//   history_days     the evenings and days looked at, today included. Default 7
//   weather, warning_sensor, warning_count_sensor, outlook_hours, cold_below, rain_above
//                    as in house mode (below). With `weather`, the room sheet shows the band
//
//   rooms            HOUSE MODE (below). Replaces `windows`
//
// No household entity is a default (the portability goal, project memory
// project_lamplight_portability_goal).
//
// HOUSE MODE (1 Oct 2026, design-docs/windows_house_popup_options.html, option 5 with the colour
// of option 7). With a `rooms` key the card draws the home-wide #windows body and `windows` mode
// does not change. The body has the hero, a lead, a weather band while a window is open and the
// weather is bad, and the rows by room. It has no After dark and no Today and usual section:
// windows close at any time in the evening, so after dark is not a warning.
//   rooms            [{ name, windows: [{ entity, name, long_name, battery_sensor }] }].
//                    `long_name` is the name in a sentence. Default: the room name and the
//                    row name in lower case ("Bedroom left")
//   weather          a weather entity with an hourly forecast. Omit it for no outlook
//   warning_sensor   a Met Office warning sensor. State "none" when clear. Optional
//   warning_count_sensor  the sensor that counts the warnings. Optional
//   outlook_hours    hours the outlook looks ahead, from the start of this hour. Default 6
//   cold_below       the band shows when "feels like" is this many degrees C or less. Default 12
//   rain_above       the band shows when the chance of rain is this many percent or more.
//                    Default 40, the Day Card's threshold
// Bad weather is a band on the Met Office scale: yellow for rain, snow, sleet, hail, cold and a
// yellow warning; amber and red only for an amber or red warning. The Day Card's rain blue
// 90,186,238 is 0.042 (OKLab) from the open-window sky, so it is never used here.

const LAMP_WIN_ACCENT = LAMP_MEANINGS.window.open;
const LAMP_WIN_HISTORY_MS = 5 * 60 * 1000;
const LAMP_WIN_EVENING_MS = 12 * 3600000;

function lampWinHM(d) {
  return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
}

function lampWinDur(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? (h + 'h ' + (m < 10 ? '0' : '') + m + 'm') : (m + 'm');
}

// "about 11 hours", "about an hour", "about 40 minutes".
function lampWinAbout(ms) {
  const h = ms / 3600000;
  if (h < 0.75) return 'about ' + Math.max(5, Math.round(ms / 300000) * 5) + ' minutes';
  if (h < 1.5) return 'about an hour';
  return 'about ' + Math.round(h) + ' hours';
}

function lampWinDayName(d, long) {
  return d.toLocaleDateString('en-GB', { weekday: long ? 'long' : 'short' });
}

function lampWinMidnight(d) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

// "since HH:MM" today, "since Ddd HH:MM" before.
function lampWinSince(ts, now) {
  const d = new Date(ts);
  if (ts >= lampWinMidnight(now).getTime()) return 'since ' + lampWinHM(d);
  return 'since ' + lampWinDayName(d) + ' ' + lampWinHM(d);
}

// "since 21:14 last night" from 18:00 yesterday, "since 14:53 yesterday" before it, else
// "since Fri 21:14". Until 0.53.1-dev every time yesterday was "last night", so a window closed
// at 14:53 read "since 14:53 last night". 18:00 is where §12 starts "tonight". Yesterday's
// midnight comes from the calendar, not from 24 hours, so a clock change does not move it.
function lampWinSinceNight(ts, now) {
  const d = new Date(ts);
  const t0 = lampWinMidnight(now);
  const y0 = new Date(t0);
  y0.setDate(y0.getDate() - 1);
  if (ts >= y0.getTime() && ts < t0.getTime()) {
    return 'since ' + lampWinHM(d) + (d.getHours() >= 18 ? ' last night' : ' yesterday');
  }
  return lampWinSince(ts, now);
}

// "Monday", "Monday and Friday", "Monday, Tuesday and Friday".
function lampWinList(a) {
  if (a.length <= 1) return a.join('');
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}

// ---- history -> intervals --------------------------------------------------------------

// One entity's raw samples (ascending, `s` state and `t` ms) become a list of `on` intervals
// covering [rangeStart, now]. The last interval is `ongoing: true` when the entity is still on.
function lampWinIntervals(samples, rangeStart, now) {
  const out = [];
  if (!samples.length) return out;
  let state = samples[0].s;
  let start = Math.max(rangeStart, samples[0].t);
  for (let i = 1; i < samples.length; i++) {
    const t = samples[i].t;
    if (state === 'on' && t > start) out.push({ start: start, end: t, ongoing: false });
    start = t;
    state = samples[i].s;
  }
  if (state === 'on' && now > start) out.push({ start: start, end: now, ongoing: true });
  return out;
}

// Intervals clipped to [from, to).
function lampWinClip(intervals, from, to) {
  const out = [];
  intervals.forEach(function (iv) {
    const s = Math.max(iv.start, from), e = Math.min(iv.end, to);
    if (e > s) out.push({ start: s, end: e, ongoing: iv.ongoing && iv.end <= to });
  });
  return out;
}

// The `days` local midnights, ascending, the last one today.
function lampWinDayStarts(days, now) {
  const t0 = lampWinMidnight(new Date(now));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(t0);
    d.setDate(d.getDate() - i);
    out.push(d.getTime());
  }
  return out;
}

// The time at least one window was open, from every window's clipped intervals.
function lampWinUnionMs(perWindow) {
  const events = [];
  perWindow.forEach(function (list) {
    list.forEach(function (iv) { events.push([iv.start, 1], [iv.end, -1]); });
  });
  events.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  let count = 0, from = 0, total = 0;
  events.forEach(function (e) {
    if (count === 0 && e[1] > 0) from = e[0];
    count += e[1];
    if (count === 0) total += e[0] - from;
  });
  return total;
}

// The most recent interval that has closed, or null.
function lampWinLastClose(intervals) {
  let best = null;
  intervals.forEach(function (iv) {
    if (!iv.ongoing && (!best || iv.end > best.end)) best = iv;
  });
  return best;
}

// Today's sunset from a sun entity's next_setting. When the next setting falls tomorrow, today's
// has passed, so 24 hours come off; that is about 2 minutes wrong.
function lampWinSunsetToday(hass, id, now) {
  const s = id ? hass.states[id] : null;
  if (!s || !s.attributes.next_setting) return null;
  let d = new Date(s.attributes.next_setting);
  if (lampWinMidnight(d).getTime() !== lampWinMidnight(new Date(now)).getTime()) d = new Date(d.getTime() - 86400000);
  return d.getTime();
}

// The sunset of each day, from the sun's own history: the first change to below_horizon after
// noon. A day with none uses today's sunset, moved to that day.
function lampWinSunsets(sunSamples, dayStarts, fallback) {
  return dayStarts.map(function (d0) {
    const found = (sunSamples || []).find(function (x) {
      return x.s === 'below_horizon' && x.t >= d0 + 12 * 3600000 && x.t < d0 + 86400000;
    });
    if (found) return found.t;
    if (fallback === null) return null;
    return d0 + (fallback - lampWinMidnight(new Date(fallback)).getTime());
  });
}

// The evenings: for each day, each window's after-dark close. `close` is null while it is still
// open. Returns [{ d0, set, windows: [{ i, close, afterMs }] }].
function lampWinEvenings(raw, dayStarts, sunsets, now) {
  return dayStarts.map(function (d0, k) {
    const set = sunsets[k];
    const ev = { d0: d0, set: set, windows: [] };
    if (set === null || set > now) return ev;
    raw.forEach(function (ivs, i) {
      const hit = ivs.filter(function (iv) { return iv.end > set && iv.start < set + LAMP_WIN_EVENING_MS; });
      if (!hit.length) return;
      const last = hit[hit.length - 1];
      ev.windows.push({ i: i, close: last.ongoing ? null : last.end, afterMs: (last.ongoing ? now : last.end) - set });
    });
    return ev;
  });
}

// ---- the words ---------------------------------------------------------------------------

function lampWinHero(list, accent) {
  const open = list.filter(function (w) { return w.state === 'on'; }).length;
  return open
    ? "<div class='wd-big' style='color:rgb(" + accent + ")'>" + open + ' open</div>'
    : "<div class='wd-big'>All closed</div>";
}

// The room lead. It names the open windows and since when, or says since when all are closed and
// today's time. `last` is the latest close of any window, or null.
function lampWinRoomLead(list, unionTodayMs, now, last, days) {
  const open = list.filter(function (w) { return w.state === 'on'; });
  const n = list.length;
  if (open.length) {
    const names = lampWinList(open.map(function (w) { return lampEsc(w.name); }));
    const sinces = open.map(function (w) { return lampWinSince(w.sinceTs, now); });
    if (open.length === 1) return '<b>' + names + ' is open,</b> ' + sinces[0] + '.';
    if (sinces.every(function (x) { return x === sinces[0]; })) return '<b>' + names + ' are open,</b> ' + sinces[0] + '.';
    return '<b>' + names + ' are open.</b> ' + open.map(function (w, i) { return lampEsc(w.name) + ' ' + sinces[i]; }).join(', ') + '.';
  }
  if (!last) return '<b>' + (n === 1 ? 'Not' : 'None') + ' opened in the past ' + days + ' days.</b>';
  const head = lampWinSinceNight(last, now).replace(/^s/, 'S') + '.';
  const today = unionTodayMs > 0
    ? (n === 1 ? 'It was' : 'A window was') + ' open for ' + lampWinDur(unionTodayMs) + ' today.'
    : (n === 1 ? 'Not' : 'None') + ' opened today.';
  return '<b>' + head + '</b> ' + today;
}

// "about 3h", "about 1h", "about 40m": the usual in a Record row.
function lampWinAboutShort(ms) {
  const h = ms / 3600000;
  if (h < 0.75) return 'about ' + Math.max(5, Math.round(ms / 300000) * 5) + 'm';
  if (h < 1.5) return 'about 1h';
  return 'about ' + Math.round(h) + 'h';
}

// The notes of Worth a look, in this order: still open after dark, left open after dark, open
// longer than usual, no signal. Returns { looks: [{ k, head, line }], afterDark, longer }.
// `k` is the colour of the note's mark: the open sky, or quiet white for no signal.
function lampWinRoomLooks(evenings, list, todayMs, usualMs, now, accent) {
  const looks = [];
  const n = list.length;
  let afterDark = false;
  if (evenings) {
    const today = evenings[evenings.length - 1];
    const dayWord = function (e) { return e === today ? 'this evening' : lampWinDayName(new Date(e.d0), true); };
    const still = today.windows.filter(function (x) { return x.close === null; });
    const hits = [];
    evenings.forEach(function (e) {
      e.windows.forEach(function (x) { if (x.close !== null) hits.push({ e: e, x: x }); });
    });
    const evs = hits.map(function (h) { return h.e; }).filter(function (e, i, a) { return a.indexOf(e) === i; });
    if (still.length) {
      // A window open after sunset now. The other evenings are a clause, not a second note.
      afterDark = true;
      const names = lampWinList(still.map(function (x) { return lampEsc(list[x.i].name); }));
      const other = evs.filter(function (e) { return e !== today; });
      looks.push({ k: accent, head: 'Open after dark',
        line: names + (still.length === 1 ? ' has' : ' have') + ' been open ' + lampWinDur(still[0].afterMs) +
          ' since sunset at ' + lampWinHM(new Date(today.set)) + '.' +
          (other.length ? ' Also on ' + lampWinList(other.map(dayWord)) + '.' : ' No other evening in the past ' + evenings.length + ' days.') });
    } else if (evs.length) {
      // Left open after dark on one or more evenings, now closed. The latest close ends the line.
      afterDark = true;
      const wins = hits.map(function (h) { return h.x.i; }).filter(function (i, k, a) { return a.indexOf(i) === k; });
      const who = wins.length === 1 ? lampEsc(list[wins[0]].name) : 'A window';
      const when = evs.length === 1 ? (evs[0] === today ? 'this evening' : 'on ' + dayWord(evs[0]))
        : evs.length === 2 ? 'twice' : 'on ' + evs.length + ' evenings';
      let line = '';
      if (wins.length > 1) {
        line = wins.map(function (i) {
          const ds = evs.filter(function (e) { return e.windows.some(function (x) { return x.i === i && x.close !== null; }); });
          return lampEsc(list[i].name) + ' on ' + lampWinList(ds.map(dayWord));
        }).join('; ') + '. ';
      } else if (evs.length > 1) {
        line = lampWinList(evs.map(dayWord)).replace(/^./, function (c) { return c.toUpperCase(); }) + '. ';
      }
      const lastE = evs[evs.length - 1];
      let best = null;
      lastE.windows.forEach(function (x) { if (x.close !== null && (!best || x.close > best.close)) best = x; });
      const subj = wins.length > 1 ? lampEsc(list[best.i].name) : 'it';
      const lead = evs.length === 1 && wins.length === 1 ? 'It'
        : (lastE === today ? 'This evening ' : 'On ' + dayWord(lastE) + ' ') + subj;
      line += lead + ' closed at ' + lampWinHM(new Date(best.close)) + ', ' + lampWinDur(best.afterMs) + ' after sunset.';
      looks.push({ k: accent, head: who + ' open after dark ' + when, line: line });
    }
  }
  // At least half again the usual, and an hour over it, so a short usual does not set it off.
  const longer = usualMs !== null && todayMs >= 1.5 * usualMs && todayMs - usualMs >= 3600000;
  if (longer) {
    looks.push({ k: accent, head: 'Open longer than usual today',
      line: (n === 1 ? 'A day it opens' : 'A day with a window open') + ' is usually ' + lampWinAbout(usualMs) + '.' });
  }
  list.forEach(function (w) {
    if (w.state === 'gone') looks.push({ k: '255,255,255', head: lampEsc(w.name) + ' gives no signal', line: 'Its state is not known.' });
  });
  return { looks: looks, afterDark: afterDark, longer: longer };
}

// ---- house mode: the weather ----------------------------------------------------------------

// The yellow detail text is .75, not the mockup's .70: .70 measured 4.47:1 on the live layers
// (Law 13.1, 1 Oct 2026), under the 4.5:1 floor.
// The colours are the weather status `sheet` set in src/02-palette.js. The alpha of the detail
// text is this card's own.
const LAMP_WIN_WX_A = { notice: '.75', moderate: '.75', severe: '.72', extreme: '.75' };
const LAMP_WIN_WX = {};
Object.keys(LAMP_WIN_WX_A).forEach(function (k) {
  const c = LAMP_MEANINGS.weather[k].sheet;
  LAMP_WIN_WX[k] = { w: c.w, wt: 'rgb(' + c.ink + ')', ww: 'rgba(' + c.ink + ',' + LAMP_WIN_WX_A[k] + ')' };
});

const LAMP_WIN_GLYPH = {
  rain: '<path d="M7 14a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 7.5a3.3 3.3 0 0 1-.5 6.5Z" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="M9 17l-1 3M13 17l-1 3M17 17l-1 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5L4.2 16.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '<path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  cold: '<path d="M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0Z" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="M12 9v8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="17.4" r="2" fill="currentColor"/>',
  warn: '<path d="M12 4L21 19H3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M12 10v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1.1" fill="currentColor"/>'
};

// The forecast hours inside the look-ahead: from the start of the current hour for `hours`
// hours. The hourly list starts in the past, so earlier entries are dropped.
// Returns [{ t, cond, pop, feels }] in time order. `pop` and `feels` are null when missing.
function lampWinLook(forecast, now, hours) {
  const h0 = lampWinHourStart(now), end = h0 + hours * 3600000;
  return (forecast || []).map(function (e) {
    const num = function (v) { return typeof v === 'number' && !isNaN(v) ? v : null; };
    return { t: Date.parse(e.datetime), cond: e.condition || '', pop: num(e.precipitation_probability),
      feels: num(e.apparent_temperature) };
  }).filter(function (e) { return e.t >= h0 && e.t < end; }).sort(function (a, b) { return a.t - b.t; });
}

function lampWinHourStart(now) {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

// The warning sensor, parsed as lamplight-weather's _warning() does (src/70-weather.js): the first word
// is the level, the text after " warning of " is the reason. Returns null when clear.
function lampWinWarning(hass, entity, countEntity) {
  const st = entity && hass.states[entity];
  const w = st ? st.state : 'none';
  if (['none', 'unknown', 'unavailable', ''].indexOf(w) >= 0) return null;
  const wx = lampWeatherWarning(w);
  const reason = w.indexOf(' warning of ') >= 0 ? w.split(' warning of ').pop().replace(/'/g, '').replace(/\\/g, '') : '';
  const n = parseInt(((countEntity && hass.states[countEntity]) || {}).state, 10) || 0;
  return { level: wx.status, label: wx.label, title: reason ? 'Warning of ' + reason : w.charAt(0).toUpperCase() + w.slice(1), count: n };
}

// "Kitchen is open", "Both bedroom windows are open", "All 3 lounge windows are open", "4 windows are open".
function lampWinOpenPhrase(list) {
  const open = list.filter(function (w) { return w.state === 'on'; });
  if (open.length === 1) return lampEsc(open[0].longName) + ' is open';
  const rooms = open.map(function (w) { return w.room; }).filter(function (r, i, a) { return a.indexOf(r) === i; });
  if (rooms.length === 1) {
    const total = list.filter(function (w) { return w.room === rooms[0]; }).length;
    if (total === open.length) {
      return (total === 2 ? 'Both ' : 'All ' + total + ' ') + lampEsc(rooms[0].toLowerCase()) + ' windows are open';
    }
  }
  return open.length + ' windows are open';
}

// The detail line: the facts, then the open phrase. The phrase starts with a capital only when
// it is first on the line.
function lampWinJoin(facts, phrase) {
  if (!phrase) return facts.join(' · ');
  if (!facts.length) return phrase;
  return facts.join(' · ') + ' · ' + phrase.replace(/^(Both|All) /, function (m) { return m.toLowerCase(); });
}

// The band for bad weather, or null. The first true row of the table in the build brief wins:
// warning, snow, sleet or hail, rain, cold. "now" replaces "from HH:00" in the current hour, and from
// 0.149.1-dev (25 Nov 2026) also "by HH:00" for cold: at 18:29 it said "by 18:00".
// `at` is the time in ms that the pill on lamplight-window-strip shows: the start of the snow, sleet,
// hail or rain, the lowest feels-like hour for cold, and null for a warning.
function lampWinBand(look, now, warn, phrase, o) {
  if (warn) {
    const facts = ['In force'];
    if (warn.count > 1) facts.push(warn.count + ' warnings');
    return { level: warn.level, glyph: 'warn', chip: warn.label.toUpperCase(), title: lampEsc(warn.title),
      detail: lampWinJoin(facts, phrase), at: null };
  }
  const h0 = lampWinHourStart(now);
  const from = function (e) { return e.t === h0 ? 'now' : 'from ' + lampWinHM(new Date(e.t)); };
  const chance = function (e) { return e.pop === null ? [] : [Math.round(e.pop) + '% chance']; };
  const by = function (word, glyph, e) {
    return { level: 'notice', glyph: glyph, chip: '', title: word + ' ' + from(e), detail: lampWinJoin(chance(e), phrase),
      at: e.t };
  };
  let e = look.find(function (x) { return x.cond === 'snowy'; });
  if (e) return by('Snow', 'snow', e);
  e = look.find(function (x) { return x.cond === 'snowy-rainy' || x.cond === 'hail'; });
  if (e) return by(e.cond === 'hail' ? 'Hail' : 'Sleet', 'rain', e);
  e = look.find(function (x) {
    return x.cond === 'rainy' || x.cond === 'pouring' || x.cond === 'lightning-rainy' || (x.pop !== null && x.pop >= o.rain);
  });
  if (e) return by('Rain', 'rain', e);
  let low = null;
  look.forEach(function (x) { if (x.feels !== null && (low === null || x.feels < low.feels)) low = x; });
  if (low && low.feels <= o.cold) {
    return { level: 'notice', glyph: 'cold', chip: '',
      title: 'Cold, feels like ' + Math.round(low.feels) + '° ' + (low.t === h0 ? 'now' : 'by ' + lampWinHM(new Date(low.t))), detail: phrase,
      at: low.t };
  }
  return null;
}

// The good outlook, a plain sentence for the lead: "Dry until 20:00 at least, feels like 13° at the coolest."
function lampWinGood(look) {
  if (!look.length) return '';
  const until = lampWinHM(new Date(look[look.length - 1].t + 3600000));
  let low = null;
  look.forEach(function (x) { if (x.feels !== null && (low === null || x.feels < low)) low = x.feels; });
  return 'Dry until ' + until + ' at least' + (low === null ? '.' : ', feels like ' + Math.round(low) + '° at the coolest.');
}

function lampWinBandHtml(b) {
  const c = LAMP_WIN_WX[b.level];
  return "<div class='wd-wx' style='--w:" + c.w + ';--wt:' + c.wt + ';--ww:' + c.ww + "'>" +
    "<svg viewBox='0 0 24 24'>" + LAMP_WIN_GLYPH[b.glyph] + '</svg><div>' +
    "<div class='wt'>" + (b.chip ? "<span class='chip'>" + b.chip + '</span>' : '') + b.title + '</div>' +
    (b.detail ? "<div class='ww'>" + b.detail + '</div>' : '') + '</div></div>';
}

// The house lead. `wx` is { on, look, band } : `on` is true when a weather entity is set.
function lampWinHouseLead(list, unionTodayMs, now, wx) {
  const open = list.filter(function (w) { return w.state === 'on'; });
  const gone = list.filter(function (w) { return w.state === 'gone'; });
  const tail = gone.length
    ? ' ' + lampWinList(gone.map(function (w) { return lampEsc(w.longName); })) + (gone.length === 1 ? ' gives' : ' give') + ' no signal.' : '';
  if (open.length) {
    const rooms = open.map(function (w) { return w.room; }).filter(function (r, i, a) { return a.indexOf(r) === i; });
    const names = rooms.length === 1 && open.every(function (w) { return !w.customLong; })
      ? lampEsc(rooms[0]) + ' ' + lampWinList(open.map(function (w) { return lampEsc(w.name.toLowerCase()); }))
      : lampWinList(open.map(function (w) { return lampEsc(w.longName); }));
    const verb = open.length === 1 ? ' is open' : ' are open';
    const sinces = open.map(function (w) { return lampWinSince(w.sinceTs, now); });
    let s;
    if (sinces.every(function (x) { return x === sinces[0]; })) {
      s = '<b>' + names + verb + ',</b> ' + sinces[0] + '.';
    } else {
      s = '<b>' + names + verb.replace(' is', ' are') + '.</b> ' +
        open.map(function (w, i) { return lampEsc(w.longName) + ' ' + sinces[i]; }).join(', ') + '.';
    }
    if (wx.on && !wx.band) s += ' ' + (wx.look.length ? lampWinGood(wx.look) : 'No forecast yet.');
    return s + tail;
  }
  const opened = list.filter(function (w) { return w.todayOpenMs > 0; });
  let say;
  if (!opened.length) {
    say = 'None opened today.';
  } else {
    const rooms = opened.map(function (w) { return w.room; }).filter(function (r, i, a) { return a.indexOf(r) === i; });
    if (rooms.length > 1) {
      say = 'Windows were open for ' + lampWinDur(unionTodayMs) + ' today.';
    } else {
      const total = list.filter(function (w) { return w.room === rooms[0]; }).length;
      let who;
      if (total === 1) who = 'The ' + lampEsc(opened[0].longName.toLowerCase()) + ' was';
      else if (opened.length === total) who = 'The ' + lampEsc(rooms[0].toLowerCase()) + ' windows were';
      else if (opened.length === 1) who = lampEsc(opened[0].longName) + ' was';
      else who = lampWinList(opened.map(function (w) { return lampEsc(w.longName); })) + ' were';
      say = who + ' open for ' + lampWinDur(unionTodayMs) + ' today.';
    }
  }
  // The hero already says "All closed", so the lead does not say it again (critique F15,
  // 31 Oct 2026). The first sentence is bold, as in every other lead.
  return '<b>' + say + '</b>' + tail;
}

// ---- the rows ----------------------------------------------------------------------------

// The room sheet's mark: the battery sheet's notice yellow at 21-39%, alert orange at 20% or less.
function lampWinRoomBattery(v) {
  return v <= 20 ? { icon: 'mdi:battery-alert', col: 'rgb(' + LAMP_MEANINGS.battery.alert + ')' } : { icon: 'mdi:battery', col: 'rgb(' + LAMP_MEANINGS.battery.notice + ')' };
}

function lampWinBatteryBand(v) {
  if (v <= 20) return { icon: 'mdi:battery-alert', col: 'rgb(' + LAMP_MEANINGS.battery.alert + ')' };
  if (v <= 39) return { icon: 'mdi:battery', col: 'var(--lamplight-ink-soft)' };
  return { icon: 'mdi:battery', col: 'var(--lamplight-ink-quiet)' };
}

// `room` is set on the room sheet: { leadClose }. There a row says its time only when the lead
// does not (the lead names an open window and since when, and says the latest close), it has no
// count of evenings, and its battery shows at 39% or less in the battery sheet's bands (19.23).
function lampWinRow(w, now, accent, first, darkCount, house, room) {
  const gone = w.state === 'gone';
  const open = w.state === 'on';
  const tileBg = open ? 'rgba(' + accent + ',.12)' : 'rgba(255,255,255,.05)';
  const tileBorder = gone ? '1px dashed rgba(255,255,255,.14)'
    : open ? '1px solid rgba(' + accent + ',.30)' : '1px solid rgba(255,255,255,.10)';
  const glyph = gone ? 'mdi:help-circle-outline' : open ? 'mdi:window-open' : 'mdi:window-closed';
  const glyphCol = gone ? 'rgba(255,255,255,.30)' : open ? 'rgb(' + accent + ')' : 'rgba(255,255,255,.34)';

  let sub;
  if (gone) sub = "<span style='color:var(--lamplight-ink-quiet)'>no signal</span>";
  else if (open && room) sub = "<span style='color:rgba(" + accent + ",.95)'>open</span>";
  else if (open) sub = "<span style='color:rgba(" + accent + ",.95)'>open · " + lampWinSince(w.sinceTs, now) + '</span>';
  // The lead shows minutes, so a window that closed in the lead's minute says no time: two windows
  // closed seconds apart read "closed" and "closed" under "Since Tue 12:36." (0.118.1-dev).
  else if (room) sub = 'closed' + (w.lastCloseTs && Math.floor(w.lastCloseTs / 60000) !== Math.floor((room.leadClose || 0) / 60000)
    ? ' · ' + lampWinSince(w.lastCloseTs, now) : '');
  else if (w.todayOpenMs > 0) sub = 'closed · open ' + lampWinDur(w.todayOpenMs) + ' today';
  else if (house) sub = 'closed · not opened ' + (w.lastCloseTs ? 'today' : 'this week');
  else sub = 'closed' + (w.lastCloseTs ? ' · ' + lampWinSince(w.lastCloseTs, now) : '');
  // The count of evenings after dark is on a second sub-line. Until 0.22.2-dev it ended the first
  // line, and four of six live rows clipped at 375px (1 Oct 2026): "closed · open 8h 52m today ·
  // after dark 4 days" is 257px in a 224.8px box, and the telephone draws text about 15% wider.
  // Three lines are 52.8px high, inside the row's 56px min-height. The ellipsis stays as the last
  // defence: the longest first line, "closed · open 10h 05m today", is about 190px on the telephone.
  // The row lines are lower case, as on every state line (F10, 31 Oct 2026).
  const dark = darkCount && !gone
    ? "<span class='wd-sub'>after dark " + darkCount + (darkCount === 1 ? ' day' : ' days') + '</span>' : '';

  let batt = '';
  // House rows show a battery only in the alert band; #batteries holds the rest.
  if (w.battery !== null && (room ? w.battery <= 39 : (!house || w.battery <= 20))) {
    const b = room ? lampWinRoomBattery(w.battery) : lampWinBatteryBand(w.battery);
    batt = "<span class='wd-batt' style='color:" + b.col + "'><ha-icon icon='" + b.icon +
      "' style='--mdc-icon-size:14px;width:14px;height:14px;line-height:0;color:" + b.col + "'></ha-icon>" +
      Math.round(w.battery) + '%</span>';
  }

  return "<div class='wd-row'" + (first ? '' : " style='border-top:1px solid rgba(255,255,255,.06)'") + '>' +
    "<span class='wd-tile' style='background:" + tileBg + ';border:' + tileBorder + "'>" +
    "<ha-icon icon='" + glyph + "' style='--mdc-icon-size:19px;width:19px;height:19px;line-height:0;color:" +
    glyphCol + "'></ha-icon></span>" +
    "<span class='wd-nm'><span class='wd-name'>" + lampEsc(w.name) + "</span><span class='wd-sub'>" + sub + '</span>' + dark + '</span>' +
    "<span class='wd-right'>" + batt + '</span></div>';
}

const LAMP_WIN_CSS = '<style>' +
  '.wd{font-family:var(--primary-font-family, Roboto, Noto, sans-serif);color:#fff;line-height:1.25}' +
  '.wd-big{font-size:var(--lamplight-t-display);font-weight:300;letter-spacing:-.02em;line-height:1;padding:0 2px;color:var(--lamplight-ink-strong)}' +
  '.wd-lead{font-size:var(--lamplight-t-name);line-height:1.5;color:var(--lamplight-ink-mid);margin-top:12px;padding:0 2px}' +
  '.wd-lead b{font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.wd-eb{display:flex;align-items:baseline;justify-content:space-between;padding:26px 2px 10px;' +
  'line-height:1;font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:.16em;text-transform:uppercase;' +
  'color:var(--lamplight-ink-quiet)}' +
  '.wd-eb .c{font-size:var(--lamplight-t-caption);font-weight:400;text-transform:none;letter-spacing:0;color:var(--lamplight-ink-quiet);' +
  'font-variant-numeric:tabular-nums}' +
  '.wd-rows{margin-top:18px}' +
  // The Record rows of the plug sheet (97-plug-detail.js) and the notes of the climate sheet
  // (91-climate-detail.js), for How it's been and Worth a look.
  '.wd-rec{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:0 2px;min-height:44px;' +
  'font-size:var(--lamplight-t-body);color:var(--lamplight-ink-mid);border-top:1px solid rgba(255,255,255,.06)}' +
  '.wd-eb + .wd-rec{border-top:0}' +
  '.wd-rec .vv{text-align:right;font-variant-numeric:tabular-nums;font-weight:500;color:var(--lamplight-ink-strong);white-space:nowrap}' +
  '.wd-look{position:relative;border-radius:14px;background:rgba(255,255,255,.04);padding:13px 15px 14px 18px;margin:0 2px 8px}' +
  '.wd-look::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 2px 2px 0;background:var(--k)}' +
  '.wd-look b{display:block;font-size:var(--lamplight-t-name);font-weight:500;color:var(--lamplight-ink-strong);margin-bottom:3px}' +
  '.wd-look span{display:block;font-size:var(--lamplight-t-body);line-height:1.45;color:var(--lamplight-ink-mid)}' +
  '.wd-row{display:grid;grid-template-columns:34px 1fr auto;column-gap:12px;align-items:center;' +
  'min-height:56px;padding:0 2px}' +
  '.wd-tile{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center}' +
  '.wd-nm{min-width:0;overflow:hidden}' +
  '.wd-name{display:block;font-size:var(--lamplight-t-body);font-weight:500;color:var(--lamplight-ink-strong);' +
  'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.wd-sub{display:block;font-size:var(--lamplight-t-state);color:var(--lamplight-ink-soft);font-variant-numeric:tabular-nums;' +
  'margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.wd-batt{display:inline-flex;align-items:center;gap:4px;font-size:var(--lamplight-t-state);font-variant-numeric:tabular-nums}' +
  '.wd-wx{display:grid;grid-template-columns:22px 1fr;column-gap:10px;align-items:start;border-radius:12px;' +
  'padding:10px 12px 11px;margin-top:14px;background:linear-gradient(100deg,rgba(var(--w),.26),rgba(var(--w),.12))}' +
  '.wd-wx svg{width:20px;height:20px;margin-top:1px;color:var(--wt)}' +
  '.wd-wx .wt{font-size:var(--lamplight-t-body);font-weight:500;line-height:1.35;color:var(--wt)}' +
  '.wd-wx .ww{font-size:var(--lamplight-t-state);line-height:1.4;color:var(--ww);margin-top:2px}' +
  '.wd-wx .chip{display:inline-block;font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:.12em;line-height:1;' +
  'padding:4px 6px 3px;border-radius:5px;background:rgb(var(--w));color:#101219;margin-right:7px;vertical-align:2px}' +
  '</style>';

class LampWindowsDetail extends HTMLElement {

  static getStubConfig() {
    return { windows: [] };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    this._house = Array.isArray(config.rooms) && config.rooms.length > 0;
    if (this._house) {
      // House mode. One flat list of windows, each with its room.
      const flat = [];
      config.rooms.forEach(function (r) {
        if (!Array.isArray(r.windows) || !r.windows.length) {
          throw new Error('lamplight-windows-detail: each room needs a non-empty `windows` list');
        }
        r.windows.forEach(function (w) { flat.push(Object.assign({}, w, { room: r.name })); });
      });
      this._windows = flat;
      this._sun = null;
    } else {
      if (!Array.isArray(config.windows) || !config.windows.length) {
        throw new Error('lamplight-windows-detail needs a non-empty `windows` list');
      }
      this._windows = config.windows;
      this._sun = config.sun_entity === undefined ? lampDefault('windows-detail', 'sun_entity') : (config.sun_entity || null);
    }
    this._config = config;
    this._accent = lampColour(config.accent || LAMP_WIN_ACCENT, 'soft');
    this._days = typeof config.history_days === 'number' ? config.history_days : lampDefault('windows-detail', 'history_days');
    this._hours = typeof config.outlook_hours === 'number' ? config.outlook_hours : lampDefault('windows-detail', 'outlook_hours');
    this._cold = typeof config.cold_below === 'number' ? config.cold_below : lampDefault('windows-detail', 'cold_below');
    this._rain = typeof config.rain_above === 'number' ? config.rain_above : lampDefault('windows-detail', 'rain_above');
    this._forecast = null;
    this._fcRev = 0;
    this._raw = null;
    this._sunSamples = null;
    this._key = null;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) { this._startHistory(); this._subscribe(); }
    else this._checkChanged();
    this._update();
  }

  connectedCallback() {
    if (this._hass) { this._startHistory(); this._subscribe(); }
    if (!this._minuteTimer) {
      const self = this;
      this._minuteTimer = setInterval(function () { self._update(true); }, 60000);
    }
  }

  disconnectedCallback() {
    this._stopHistory();
    if (this._unsub) { this._unsub(); this._unsub = null; }
    clearInterval(this._minuteTimer);
    this._minuteTimer = null;
  }

  getCardSize() {
    return 6;
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    const card = document.createElement('ha-card');
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

  _startHistory() {
    if (this._historyTimer || !this.isConnected) return;
    const self = this;
    this._fetchHistory();
    this._historyTimer = setInterval(function () { self._fetchHistory(); }, LAMP_WIN_HISTORY_MS);
  }

  // The hourly forecast, as src/95-day.js subscribes to it. House mode, and a room sheet with `weather`.
  _subscribe() {
    if (!this._config.weather || this._unsub || !this._hass || !this.isConnected) return;
    const self = this;
    let killed = false;
    this._unsub = function () { killed = true; };
    this._hass.connection.subscribeMessage(
      function (msg) { self._forecast = (msg && msg.forecast) || []; self._fcRev++; self._update(); },
      { type: 'weather/subscribe_forecast', entity_id: this._config.weather, forecast_type: 'hourly' }
    ).then(function (off) {
      if (killed) { off(); return; }
      self._unsub = off;
    }).catch(function () { self._unsub = null; });
  }

  _stopHistory() {
    clearInterval(this._historyTimer);
    this._historyTimer = null;
  }

  // Refetch at once when a listed contact's own last_changed moves.
  _checkChanged() {
    if (!this._lastChanged) return;
    const self = this;
    let moved = false;
    this._windows.forEach(function (w) {
      const s = self._hass.states[w.entity];
      if (self._lastChanged[w.entity] !== (s ? s.last_changed : null)) moved = true;
    });
    if (moved) this._fetchHistory();
  }

  // One history read: every contact and the sun, from the first day's midnight.
  async _fetchHistory() {
    if (!this._hass) return;
    const now = Date.now();
    const dayStarts = lampWinDayStarts(this._days, now);
    const ids = this._windows.map(function (w) { return w.entity; });
    if (this._sun) ids.push(this._sun);
    try {
      const resp = await this._hass.connection.sendMessagePromise({
        type: 'history/history_during_period', start_time: new Date(dayStarts[0]).toISOString(),
        entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false
      });
      const samples = function (id) {
        return ((resp && resp[id]) || []).map(function (it) { return { s: it.s, t: (it.lu || it.lc) * 1000 }; });
      };
      const raw = {}, lastChanged = {};
      this._windows.forEach(function (w) {
        raw[w.entity] = lampWinIntervals(samples(w.entity), dayStarts[0], now);
        const s = this._hass.states[w.entity];
        lastChanged[w.entity] = s ? s.last_changed : null;
      }, this);
      this._sunSamples = this._sun ? samples(this._sun) : null;
      this._raw = raw;
      this._lastChanged = lastChanged;
      this._key = null;
      this._update();
    } catch (e) {
      // A bare `3` is a dropped connection, not an unsupported call. Keep the last result; the
      // 5-minute timer tries again.
    }
  }

  _update(force) {
    if (!this._hass || !this._body || !this._raw) return;
    const key = JSON.stringify(this._windows.map(function (w) {
      const s = this._hass.states[w.entity];
      const b = w.battery_sensor ? this._hass.states[w.battery_sensor] : null;
      return (s ? s.state : '-') + ':' + (b ? b.state : '-');
    }, this)) + (this._config.weather ? '|' + [this._config.warning_sensor, this._config.warning_count_sensor].map(function (id) {
      const s = id && this._hass.states[id];
      return s ? s.state : '-';
    }, this).join(',') + '|' + this._fcRev : '');
    if (!force && key === this._key) return;
    this._key = key;
    this._body.innerHTML = this._html(Date.now());
  }

  // The whole body for one instant. The tests call this directly.
  _html(now) {
    const dayStarts = lampWinDayStarts(this._days, now);
    const todayStart = dayStarts[dayStarts.length - 1];
    const n = this._windows.length;
    const raw = this._windows.map(function (w) { return this._raw[w.entity] || []; }, this);

    const list = this._windows.map(function (w, i) {
      const s = this._hass.states[w.entity];
      const state = (!s || s.state === 'unavailable' || s.state === 'unknown') ? 'gone' : s.state;
      const today = lampWinClip(raw[i], todayStart, now);
      const lastClose = lampWinLastClose(raw[i]);
      const ongoing = raw[i].length && raw[i][raw[i].length - 1].ongoing ? raw[i][raw[i].length - 1] : null;
      const battS = w.battery_sensor ? this._hass.states[w.battery_sensor] : null;
      const battV = battS ? parseFloat(battS.state) : NaN;
      const name = w.name || (s && s.attributes.friendly_name) || w.entity;
      const dflt = w.room ? w.room + ' ' + name.toLowerCase() : name;
      return {
        name: name,
        room: w.room,
        longName: w.long_name || dflt,
        customLong: !!w.long_name && w.long_name !== dflt,
        state: state,
        todayOpenMs: today.reduce(function (sum, iv) { return sum + (iv.end - iv.start); }, 0),
        sinceTs: ongoing ? ongoing.start : now,
        lastCloseTs: lastClose ? lastClose.end : null,
        closedToday: !!(lastClose && lastClose.end >= todayStart),
        battery: isNaN(battV) ? null : battV
      };
    }, this);

    // Room time: at least one window open, per day.
    const unionPerDay = dayStarts.map(function (d0, k) {
      const d1 = k < dayStarts.length - 1 ? dayStarts[k + 1] : now;
      return lampWinUnionMs(raw.map(function (ivs) { return lampWinClip(ivs, d0, d1); }));
    });
    const todayMs = unionPerDay[unionPerDay.length - 1];
    const past = unionPerDay.slice(0, -1).filter(function (ms) { return ms > 0; });
    const usualMs = past.length ? past.reduce(function (s, v) { return s + v; }, 0) / past.length : null;

    if (this._house) return this._houseHtml(list, raw, now, todayStart);

    const setToday = this._sun ? lampWinSunsetToday(this._hass, this._sun, now) : null;
    const accent = this._accent;
    const anyOpen = list.some(function (w) { return w.state === 'on'; });
    const closes = list.map(function (w) { return w.lastCloseTs; }).filter(Boolean);
    const last = closes.length ? Math.max.apply(null, closes) : null;

    // Now: the hero, the lead and, while a window is open, the weather band.
    let html = LAMP_WIN_CSS + "<div class='wd'>" + lampWinHero(list, accent) +
      "<div class='wd-lead'>" + lampWinRoomLead(list, todayMs, now, last, this._days) + '</div>';
    if (anyOpen && this._config.weather) {
      const band = lampWinBand(lampWinLook(this._forecast, now, this._hours), now,
        lampWinWarning(this._hass, this._config.warning_sensor, this._config.warning_count_sensor), '', { cold: this._cold, rain: this._rain });
      if (band) html += lampWinBandHtml(band);
    }

    // The rows, an open window first. The sort is stable, so the others keep their order.
    const room = { leadClose: anyOpen ? null : last };
    const rows = list.slice().sort(function (a, b) { return (b.state === 'on') - (a.state === 'on'); });
    html += "<div class='wd-rows'>" + rows.map(function (w) { return lampWinRow(w, now, accent, false, null, false, room); }).join('') + '</div>';

    // Worth a look, only while a rule is true.
    const evenings = this._sun ? lampWinEvenings(raw, dayStarts, lampWinSunsets(this._sunSamples, dayStarts, setToday), now) : null;
    const lk = lampWinRoomLooks(evenings, list, todayMs, usualMs, now, accent);
    if (lk.looks.length) {
      html += "<div class='wd-eb'><span>Worth a look</span></div>" + lk.looks.map(function (l) {
        return "<div class='wd-look' style='--k:rgb(" + l.k + ")'><b>" + l.head + '</b><span>' + l.line + '</span></div>';
      }).join('');
    }

    // How it's been: the facts that the lead and the notes do not say.
    const rec = function (k, v) { return "<div class='wd-rec'><span>" + k + "</span><span class='vv'>" + v + '</span></div>'; };
    let facts = '';
    if (evenings && !lk.afterDark) facts += rec('Open after dark', 'no');
    if (anyOpen) facts += rec('Open today', lampWinDur(todayMs));
    if (usualMs !== null && !lk.longer) facts += rec(n === 1 ? 'A day it opens' : 'A day with a window open', lampWinAboutShort(usualMs));
    if (facts) html += "<div class='wd-eb'><span>How it’s been</span><span class='c'>" + this._days + ' days</span></div>' + facts;
    return html + '</div>';
  }

  // House mode: hero, lead, the weather band, then the rows by room.
  _houseHtml(list, raw, now, todayStart) {
    const accent = this._accent;
    const unionToday = lampWinUnionMs(raw.map(function (ivs) { return lampWinClip(ivs, todayStart, now); }));
    const anyOpen = list.some(function (w) { return w.state === 'on'; });
    const on = !!this._config.weather;
    const look = on ? lampWinLook(this._forecast, now, this._hours) : [];
    const band = anyOpen && on
      ? lampWinBand(look, now, lampWinWarning(this._hass, this._config.warning_sensor, this._config.warning_count_sensor),
        lampWinOpenPhrase(list), { cold: this._cold, rain: this._rain })
      : null;
    let html = LAMP_WIN_CSS + "<div class='wd'>" + lampWinHero(list, accent) + "<div class='wd-lead'>" +
      lampWinHouseLead(list, unionToday, now, { on: on, look: look, band: band }) + '</div>';
    if (band) html += lampWinBandHtml(band);
    const rooms = [];
    list.forEach(function (w) { if (rooms.indexOf(w.room) < 0) rooms.push(w.room); });
    rooms.forEach(function (room) {
      const ws = list.filter(function (w) { return w.room === room; });
      const n = ws.filter(function (w) { return w.state === 'on'; }).length;
      html += "<div class='wd-eb'><span>" + lampEsc(room) + "</span><span class='c'" +
        (n ? " style='color:rgba(" + accent + ",.95)'" : '') + '>' + n + ' of ' + ws.length + ' open</span></div>';
      html += ws.map(function (w, i) { return lampWinRow(w, now, accent, i === 0, null, true); }).join('');
    });
    return html + '</div>';
  }
}

customElements.define('lamplight-windows-detail', LampWindowsDetail);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-windows-detail',
  name: 'Lamplight Windows Detail',
  description: 'The Windows pop-up body: the room’s windows now, a row for each window, a note only when something is unusual, and how the past days have been.',
  preview: false
});
