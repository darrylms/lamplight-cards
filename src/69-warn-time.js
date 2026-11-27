// The times of a severe weather warning, in words. lamplight-weather and lamplight-day use this.
//
// Design document: design-docs/weather_warning_detail_options.html, options A3 and B3,
// chosen 21 October 2026.
//
// THE SENSORS
// `sensor.met_office_se_warning_from` and `sensor.met_office_se_warning_until` hold the start
// and the end of the most severe warning, as ISO 8601 local time, or the string "none". They
// describe the same item as `sensor.met_office_se_warning`. See technical_reference.md §6.
// Without them, or with "none", the cards show the warning with no times, as before.
//
// THE DAY WORDS
// A time today has no word for an end, and "today" or "tonight" (from 18:00) for a start.
// A time on the next day is "tomorrow", but an early hour (before 06:00) after 18:00 today is
// "tonight". Any later day is the weekday. The clock is the 24-hour clock, as on the rest of
// the dashboard.

const LAMP_WARN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// The start and the end, or null when either is missing. `over` is true when the end has
// passed: the warning is over then, even while the feed still lists it, and the cards hide it.
// `live` is true from the start.
function lampWarnSpan(hass, fromId, untilId, now) {
  if (!hass) return null;
  const a = hass.states[fromId], b = hass.states[untilId];
  const from = a ? Date.parse(a.state) : NaN, until = b ? Date.parse(b.state) : NaN;
  if (!isFinite(from) || !isFinite(until) || until <= from) return null;
  return { from: new Date(from), until: new Date(until), over: until <= now.getTime(),
           live: from <= now.getTime() };
}

function lampWarnHM(d) {
  const p = function (n) { return (n < 10 ? '0' : '') + n; };
  return p(d.getHours()) + ':' + p(d.getMinutes());
}

// Whole days from now's date to d's date, by the calendar, not by 24-hour steps.
function lampWarnDayGap(d, now) {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86400000);
}

// The day word for d: '', 'today', 'tonight', 'tomorrow', 'yesterday' or the weekday.
// `start` says whether d is a start (a start today always has a word).
function lampWarnDayWord(d, now, start) {
  const gap = lampWarnDayGap(d, now);
  if (gap === 0) return start ? (d.getHours() >= 18 ? 'tonight' : 'today') : '';
  if (gap === 1) return (now.getHours() >= 18 && d.getHours() < 6) ? 'tonight' : 'tomorrow';
  if (gap === -1) return 'yesterday';
  return LAMP_WARN_DAYS[d.getDay()];
}

// The time phrases for the weather card strip, longest first. The card takes the first
// that fits on its one line, and the reason alone if none fits.
//   before the start   "from 23:00 tomorrow", "from Thu 23:00"
//   in force           "until 13:00 tomorrow", "until Fri 13:00"; "until 13:00" for today
function lampWarnStripForms(span, now) {
  if (!span || span.over) return [];
  const live = span.live;
  const d = live ? span.until : span.from;
  const hm = lampWarnHM(d);
  const lead = live ? 'until ' : 'from ';
  const word = lampWarnDayWord(d, now, !live);
  const short = LAMP_WARN_DAYS[d.getDay()].slice(0, 3);
  // An end in the next twelve hours needs no day word: "until 02:00" can only be the next one.
  if (live && (word === '' || d.getTime() - now.getTime() < 12 * 3600000)) return [lead + hm];
  const out = [];
  if (word === 'today' || word === 'tonight' || word === 'tomorrow') out.push(lead + hm + ' ' + word);
  out.push(lead + short + ' ' + hm);
  return out;
}

// "25 hours", "40 minutes", "3 days". Rounded to the nearest.
function lampWarnLength(ms) {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return min + (min === 1 ? ' minute' : ' minutes');
  const h = Math.round(min / 60);
  if (h < 48) return h + (h === 1 ? ' hour' : ' hours');
  const dd = Math.round(h / 24);
  return dd + ' days';
}

function lampWarnCap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// The Day Card's two lines: the span, and the count.
//   before   "Tomorrow 23:00 to Friday 13:00"       "Starts in 25 hours · lasts 14 hours"
//   in force "Since 23:00 yesterday, until 13:00"   "Ends in 11 hours"
function lampWarnNotice(span, now) {
  if (!span || span.over) return null;
  const f = span.from, u = span.until;
  const fw = lampWarnDayWord(f, now, true), uw = lampWarnDayWord(u, now, false);
  const sameDay = lampWarnDayGap(u, f) === 0;
  // The end: "13:00" on the start's day, else with its own day word.
  const endWords = function () {
    if (uw === '' ) return lampWarnHM(u);
    if (uw === 'tomorrow' || uw === 'tonight') return lampWarnHM(u) + ' ' + uw;
    return uw + ' ' + lampWarnHM(u);
  };
  let spanLine, countLine;
  if (!span.live) {
    const start = (fw === 'today' || fw === 'tonight' || fw === 'tomorrow')
      ? lampWarnCap(fw) + ' ' + lampWarnHM(f) : fw + ' ' + lampWarnHM(f);
    const end = sameDay ? lampWarnHM(u)
      : (lampWarnDayGap(u, now) === 1 ? 'tomorrow ' + lampWarnHM(u) : LAMP_WARN_DAYS[u.getDay()] + ' ' + lampWarnHM(u));
    spanLine = start + ' to ' + end;
    countLine = 'Starts in ' + lampWarnLength(f - now) + ' · lasts ' + lampWarnLength(u - f);
  } else {
    const since = fw === 'today' || fw === 'tonight' ? lampWarnHM(f)
      : (fw === 'yesterday' ? lampWarnHM(f) + ' yesterday' : fw + ' ' + lampWarnHM(f));
    spanLine = 'Since ' + since + ', until ' + endWords();
    countLine = 'Ends in ' + lampWarnLength(u - now);
  }
  return { span: spanLine, count: countLine };
}

// The reason from the warning sensor: "Yellow warning of wind" -> "Wind".
function lampWarnReason(state) {
  const r = state.indexOf(' warning of ') >= 0 ? state.split(' warning of ').pop() : state;
  return lampWarnCap(r);
}

// The first weather entity in the state machine, for a card picker's stub config. Home
// Assistant gives getStubConfig the hass object. Without it, or with no weather entity, the
// result is '' and the card asks for an `entity`.
function lampFirstWeather(hass) {
  const ids = hass && hass.states ? Object.keys(hass.states) : [];
  return ids.filter(function (id) { return id.indexOf('weather.') === 0; }).sort()[0] || '';
}
