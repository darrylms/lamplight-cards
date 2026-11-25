// lamplight-climate-detail. The body of a climate pop-up: three answers about a room.
//
// THE DECISION (15 Nov 2026, design-docs/climate_quiet_options.html, option 2 "Three Answers")
// The household asked the sheet to feel like a premium smart-home product, not a weather instrument.
// It asks three things of a room, in this order: how does it feel now; how has it been; is there
// anything worth addressing. The old sheet answered each question up to four times (the reading and
// the 24-hour low each appeared four times), and its last three sections had one identical form, so
// nothing told the eye which one mattered. Until this date the body was, top to bottom: the reading
// at 36px, a lead sentence, a detail line, Inside and out (a key, a gutter of 5-degree figures, the
// weather's low and high with their times), Nights, Damp (a sentence, a humidity chart, a bar of the
// week's hours) and The week (option 8 of popup_sheets_rework_options.html, 27 Sep 2026, and option 15
// "On the Clock" of climate_card_options.html, 13 Nov 2026).
//
// THE SHEET, top to bottom:
//   Now            the reading at 56px (the type table's `reading` step), and beside it the comfort
//                  word and the humidity now
//   How it's been  the last 24 hours: the room's line in `line_color`, the band under it in one
//                  blue ramp (faint, the same in every room), the weather as a faint dotted line that ends
//                  in "Outside 10°", the night (`night`, 23:00 to 07:00) shaded with a small moon, and
//                  the room's low and high as rings with their times. No gutter and no key. The
//                  household set aside the 21 Sep 2026 sparkline rule for this chart on 13 Nov 2026
//                  (d-156): the gap between the room and the weather is the reading.
//                  Under it, one line on the nights: with `bedroom: true`, how many were cool enough for
//                  sleep (a night's mean at or under `sleep_max_temp`); else the range of the night means.
//   Worth a look   only when one of these is true; on a normal day the section does not exist.
//                  Measured over a year of hourly readings (one check a day, 331 to 339 days a room):
//     humid        the week stays humid (kind `stays`, below): 43% of days in the Bedroom, 33% in the
//                  Bathroom, 0 to 8% elsewhere
//     colder       the last 24 hours went 2 degrees under the lowest of the 7 days before: 1.2 to 1.5%
//                  of days in each room
//     warmer       the last 24 hours went 2 degrees over the highest of the 7 days before: 1.8 to 3.6%
//                  A fixed rate of change was rejected: the heating and the shower set it off (a rise of
//                  2 degrees in 2 hours on 42% of the Hallway's days).
//
// THE HUMID RULE (kind `stays`, 7 Nov 2026, option 1 of design-docs/climate_damp_wording_options.html):
// a humidity peak took over 24 hours to clear, and 3/4 of the hours or more were at the middle band
// or above. "Humid all week" when every hour was, else "Humid most of the week".
//
// A ROW IS OPTIONAL WHEN ITS DATA IS
// `humidity` is optional. Without it there is no humidity beside the reading and no humid note.
// `outside` is optional. Without it the chart shows the room only.
// `graph` is optional: another household can still put a mini-graph-card slot at the foot of the
// sheet, with its night bands and day strip. Lamplight does not reimplement the sparkline.
//
// Configuration:
//   temperature     required. The same sensor as the room's lamplight-climate
//   humidity        optional. See above
//   bedroom         true for a bedroom: the nights line says how many nights were cool enough for sleep
//   sleep_max_temp  a night whose average is above this is warm for sleep. Default 20 (°C)
//   damp_range      [middle, high] humidity bands, in %. Default [60, 70]
//   night_hours     [start hour, end hour], local time. Default [23, 7]
//   outside         optional. The outdoor temperature sensor
//   line_color      "r,g,b" | hex | rgb(). The room's line. Default white
//   graph           optional. A whole card configuration for a mini-graph-card slot at the foot
//   comfort_range, comfort_words   the same keys and defaults as lamplight-climate (comfort_colors is no longer read)

const LAMP_CLIMATE_DETAIL_STATS_MS = 5 * 60 * 1000;
const LAMP_CLIMATE_DETAIL_HOUR = 3600000;
const LAMP_CLIMATE_DETAIL_WEEK_HOURS = 168;
// Over this time, all the peaks of a long spell wait for the same hour, so the time measures the
// spell and not a recovery. Measured 7 Nov 2026: of 415 weeks in five rooms, 39 had a clear time over
// 24 hours, and in each of the 39 the room was at the middle band or above for 95% of the hours.
const LAMP_CLIMATE_DETAIL_CLEAR_MAX_H = 24;
const LAMP_CLIMATE_DETAIL_STAYS_SHARE = 0.75;
// "Colder or warmer than usual": this many degrees past the lowest or highest of the 7 days before
// the last 24 hours. The rule needs 20 of the last 24 hours and 140 of the 168 before.
const LAMP_CLIMATE_DETAIL_UNUSUAL = 2;
// The colour of the mark on each note: the humidity's blue, and the spectrum at 13 and 28 degrees.
const LAMP_CLIMATE_DETAIL_LOOK = { humid: '140,200,255', colder: 13, warmer: 28 };
const LAMP_CLIMATE_DETAIL_MOON = 'M5.2 -5.6A6 6 0 1 0 6 3.4A4.8 4.8 0 0 1 5.2 -5.6Z';

function lampClimateDetailWeekday(t, long) {
  return new Date(t).toLocaleDateString('en-GB', { weekday: long ? 'long' : 'short' });
}

function lampClimateDetailHM(t) {
  const d = new Date(t);
  return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':00';
}

// Keep the rows the recorder gives for one sensor, oldest first, inside the last `hours` (168).
function lampClimateDetailRows(list, now, hours) {
  return (list || [])
    .map(function (r) {
      return { t: typeof r.start === 'number' ? r.start : Date.parse(r.start), mean: r.mean, min: r.min, max: r.max };
    })
    .filter(function (r) { return r.t >= now - (hours || LAMP_CLIMATE_DETAIL_WEEK_HOURS) * LAMP_CLIMATE_DETAIL_HOUR; })
    .filter(function (r) { return r.mean !== null && r.mean !== undefined; })
    .sort(function (a, b) { return a.t - b.t; });
}

// The nights, matched by local hour so a change of summer time does not break them. A night is
// kept when it has ended and half of its hours or more have a reading. Each night: its start, the
// mean and the lowest temperature, and the humidity at its first and last hour.
function lampClimateDetailNights(tRows, hRows, night, now) {
  const len = night[1] > night[0] ? night[1] - night[0] : 24 - night[0] + night[1];
  const hBy = new Map(hRows.map(function (r) { return [r.t, r]; }));
  const out = [];
  tRows.forEach(function (r) {
    if (new Date(r.t).getHours() !== night[0]) return;
    // The end is the next hour whose local hour is the night's end, found on the clock, not by
    // adding `len` hours: the night the clocks change is one hour longer or shorter.
    let end = r.t + len * LAMP_CLIMATE_DETAIL_HOUR;
    for (let k = len - 1; k <= len + 1; k++) {
      const t = r.t + k * LAMP_CLIMATE_DETAIL_HOUR;
      if (new Date(t).getHours() === night[1]) { end = t; break; }
    }
    if (end > now) return;
    const rows = tRows.filter(function (x) { return x.t >= r.t && x.t < end; });
    if (rows.length < len / 2) return;
    const last = rows[rows.length - 1];
    const ha = hBy.get(r.t), hb = hBy.get(end - LAMP_CLIMATE_DETAIL_HOUR) || hBy.get(last.t);
    out.push({
      t: r.t,
      mean: rows.reduce(function (s, x) { return s + x.mean; }, 0) / rows.length,
      min: Math.min.apply(null, rows.map(function (x) { return x.min; })),
      hStart: ha ? ha.mean : null,
      hEnd: hb ? hb.mean : null
    });
  });
  return out;
}

// The week's damp, from the hourly humidity. `bands` is [middle, high].
function lampClimateDetailDamp(hRows, nights, bands) {
  const mid = bands[0], high = bands[1], clear = (mid + high) / 2;
  const o = { under: 0, middle: 0, over: 0, total: hRows.length, peaks: [], kind: 'dry' };
  hRows.forEach(function (r) {
    if (r.mean >= high) o.over++; else if (r.mean >= mid) o.middle++; else o.under++;
  });
  // A peak is a run of hours whose highest reading reaches `high`. It clears at the first hour
  // after its highest reading whose mean is back under the middle of the two bands.
  for (let i = 0; i < hRows.length; i++) {
    if (hRows[i].max < high) continue;
    let j = i;
    while (j + 1 < hRows.length && hRows[j + 1].max >= high) j++;
    let top = hRows[i];
    for (let k = i; k <= j; k++) if (hRows[k].max > top.max) top = hRows[k];
    let cleared = null;
    for (let k = hRows.indexOf(top) + 1; k < hRows.length; k++) {
      if (hRows[k].mean < clear) { cleared = hRows[k]; break; }
    }
    // `waitH` also counts a peak that has not cleared: the time from the peak to the last reading.
    const until = cleared || hRows[hRows.length - 1];
    o.peaks.push({ v: top.max, t: top.t, clearH: cleared ? (cleared.t - top.t) / LAMP_CLIMATE_DETAIL_HOUR : null,
      waitH: (until.t - top.t) / LAMP_CLIMATE_DETAIL_HOUR });
    i = j;
  }
  const longWait = o.peaks.some(function (p) { return p.waitH > LAMP_CLIMATE_DETAIL_CLEAR_MAX_H; });
  const changes = nights.filter(function (n) { return n.hStart !== null && n.hEnd !== null; })
    .map(function (n) { return { d: n.hEnd - n.hStart, a: n.hStart, b: n.hEnd }; });
  const avg = function (a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; };
  if (changes.length >= 3) {
    const up = changes.filter(function (c) { return c.d > 0; }).length;
    const md = avg(changes.map(function (c) { return c.d; }));
    o.nights = { n: changes.length, up: up, md: md,
      a: avg(changes.map(function (c) { return c.a; })), b: avg(changes.map(function (c) { return c.b; })) };
  }
  if (longWait && o.middle + o.over >= o.total * LAMP_CLIMATE_DETAIL_STAYS_SHARE) o.kind = 'stays';
  else if (o.peaks.length) o.kind = 'peaks';
  else if (o.nights && o.nights.up >= o.nights.n - 2 && o.nights.md >= 1) o.kind = 'rise';
  else if (o.nights && o.nights.n - o.nights.up >= o.nights.n - 2 && o.nights.md <= -1) o.kind = 'drier';
  else if (o.total && o.middle + o.over >= o.total / 2) o.kind = 'often';
  return o;
}

// "Humid all week" when every hour is at the middle band or above, else "Humid most of the week".
function lampClimateDetailStaysWord(o) {
  return o.middle + o.over === o.total ? 'humid all week' : 'humid most of the week';
}


// The nights line, under the chart. Bold, because it is the answer and not a note.
function lampClimateDetailSleepSay(nights, sleep, sleepMax) {
  if (!nights.length) return null;
  const n = nights.length;
  if (!sleep) {
    const lo = Math.min.apply(null, nights.map(function (x) { return x.mean; }));
    const hi = Math.max.apply(null, nights.map(function (x) { return x.mean; }));
    return 'Overnight ' + lo.toFixed(1) + '–' + hi.toFixed(1) + '° on average';
  }
  const good = nights.filter(function (x) { return x.mean <= sleepMax; }).length;
  if (good === n) return 'Good for sleep, all ' + n + ' nights';
  if (good === 0) return 'Warm for sleep, all ' + n + ' nights';
  return good + ' of ' + n + ' nights good for sleep';
}

// Colder or warmer than usual. `rows` are the hourly rows of the last 192 hours, oldest first.
// Each answer: { v (the reading), t (its hour), by (degrees past the week before) }, or null.
function lampClimateDetailUnusual(rows, now) {
  const cut = now - 24 * LAMP_CLIMATE_DETAIL_HOUR;
  const day = rows.filter(function (r) { return r.t > cut; });
  const prev = rows.filter(function (r) { return r.t <= cut && r.t > cut - LAMP_CLIMATE_DETAIL_WEEK_HOURS * LAMP_CLIMATE_DETAIL_HOUR; });
  if (day.length < 20 || prev.length < 140) return { colder: null, warmer: null };
  const lowest = function (a) { return a.reduce(function (p, q) { return q.min < p.min ? q : p; }); };
  const highest = function (a) { return a.reduce(function (p, q) { return q.max > p.max ? q : p; }); };
  const dl = lowest(day), dh = highest(day), pl = lowest(prev).min, ph = highest(prev).max;
  return {
    colder: dl.min <= pl - LAMP_CLIMATE_DETAIL_UNUSUAL ? { v: dl.min, t: dl.t, by: pl - dl.min } : null,
    warmer: dh.max >= ph + LAMP_CLIMATE_DETAIL_UNUSUAL ? { v: dh.max, t: dh.t, by: dh.max - ph } : null
  };
}

// The notes of Worth a look, in the order the household asked: damp first, then the temperature.
// Each: { kind, head, line }.
function lampClimateDetailLooks(damp, unusual, bands) {
  const out = [];
  if (damp && damp.kind === 'stays') {
    const n = damp.middle + damp.over, word = lampClimateDetailStaysWord(damp);
    const top = damp.peaks.reduce(function (a, b) { return b.v > a.v ? b : a; });
    out.push({ kind: 'humid', head: word.charAt(0).toUpperCase() + word.slice(1),
      line: 'At ' + bands[0] + '% or more for ' + (n === damp.total ? 'every hour of the week' : n + ' of ' + damp.total + ' hours') +
        (damp.over ? ', and ' + bands[1] + '% or more for ' + damp.over : '') + '. The highest was ' + Math.round(top.v) + '%.' });
  }
  if (unusual && unusual.colder) {
    const c = unusual.colder;
    out.push({ kind: 'colder', head: 'Colder than usual',
      line: 'Down to ' + c.v.toFixed(1) + '° at ' + lampClimateDetailHM(c.t) + ' — ' + c.by.toFixed(1) + '° under the coldest of the week before.' });
  }
  if (unusual && unusual.warmer) {
    const w = unusual.warmer;
    out.push({ kind: 'warmer', head: 'Warmer than usual',
      line: 'Up to ' + w.v.toFixed(1) + '° at ' + lampClimateDetailHM(w.t) + ' — ' + w.by.toFixed(1) + '° over the warmest of the week before.' });
  }
  return out;
}

// ---- the chart of the last 24 hours ------------------------------------------------

// The value of a step series at time t: the last reading at or before t.
function lampClimateDetailAt(pts, t) {
  let v = pts[0][1];
  for (let i = 0; i < pts.length; i++) { if (pts[i][0] <= t) v = pts[i][1]; else break; }
  return v;
}

// A five-sample moving average: an hour, at 15 minutes a sample.
function lampClimateDetailSmooth(a) {
  return a.map(function (v, i) {
    const w = a.slice(Math.max(0, i - 2), i + 3);
    return w.reduce(function (p, q) { return p + q; }, 0) / w.length;
  });
}

function lampClimateDetailExtremes(pts) {
  let lo = pts[0], hi = pts[0];
  pts.forEach(function (p) { if (p[1] < lo[1]) lo = p; if (p[1] > hi[1]) hi = p; });
  return { lo: lo, hi: hi };
}

function lampClimateDetailHMM(t) {
  const d = new Date(t);
  return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
}

// Text width at 11px Roboto, near enough to keep two labels apart.
function lampClimateDetailTextW(txt) {
  let w = 0;
  for (const c of txt) w += /[0-9]/.test(c) ? 6.2 : /[:·.]/.test(c) ? 2.8 : c === ' ' ? 2.8 : c === '°' ? 4 : 6;
  return w;
}

// The band's blue ramp: [offset from the top of the band, "r,g,b"]. The foot is the spectrum's 11°.
const LAMP_CLIMATE_DETAIL_BAND = [[0, '96,180,255'], [0.5, '60,140,250'], [1, '40,100,235']];

// The sheet's ground under the chart, for the halo round a label.
const LAMP_CLIMATE_DETAIL_GROUND = 'rgb(24,25,29)';

// The chart. o: { W, pin, pout (or null), now, line ("r,g,b"), night ([start, end] hours) }. pin and
// pout are [time, value], oldest first, with the first row clamped to the start of the window.
// Until 15 Nov 2026 it had a 26px gutter of 5-degree figures, a stronger band (85% at the room's
// line), a cold wash under the weather, a solid weather line and the weather's own low and high.
function lampClimateDetailChart(o) {
  const W = o.W, now = o.now, t0 = now - 24 * LAMP_CLIMATE_DETAIL_HOUR;
  const TOP = 22, H = 112, PW = W, N = 97;
  const line = 'rgb(' + o.line + ')', out = o.pout && o.pout.length ? o.pout : null;
  const xs = [], vi = [], vo = [];
  for (let i = 0; i < N; i++) {
    const t = t0 + i * (now - t0) / (N - 1);
    xs.push(i / (N - 1) * PW);
    vi.push(lampClimateDetailAt(o.pin, t));
    if (out) vo.push(lampClimateDetailAt(out, t));
  }
  const si = lampClimateDetailSmooth(vi), so = out ? lampClimateDetailSmooth(vo) : [];
  const all = si.concat(so);
  const lo = Math.floor(Math.min.apply(null, all) - 1), hi = Math.ceil(Math.max.apply(null, all) + 1);
  const f = function (v) { return v.toFixed(1); };
  const y = function (v) { return TOP + (hi - v) / (hi - lo) * (H - TOP - 6); };
  const tx = function (t) { return (Math.max(t, t0) - t0) / (now - t0) * PW; };
  const path = function (a) { return a.map(function (v, i) { return (i ? 'L' : 'M') + f(xs[i]) + ' ' + f(y(v)); }).join(''); };
  // The band: from the room's line back along the weather's, or down to the floor with no weather.
  const back = out ? so.slice().reverse().map(function (v, j) { return 'L' + f(xs[N - 1 - j]) + ' ' + f(y(v)); }).join('')
    : 'L' + f(PW) + ' ' + H + 'L0 ' + H;
  const band = path(si) + back + 'Z';
  const bandTop = Math.max.apply(null, all), bandBot = out ? Math.min.apply(null, all) : lo;

  // The band's colour: one blue ramp from the top of the band to its foot, the same in every room.
  // Until 15 Nov 2026 (0.116.0-dev) each height had the spectrum colour of its own degree. Then a warm
  // room (the Games Room at 22.6°) had a yellow top, and the household asked for one look in all rooms.
  const stops = LAMP_CLIMATE_DETAIL_BAND.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="rgb(' + s[1] + ')"/>'; }).join('');

  // The night: the last whole or part night inside the window, shaded, with a small moon.
  let g = '';
  const nt = o.night || LAMP_DEFAULTS['climate-detail'].night_hours;
  const nightLen = nt[1] > nt[0] ? nt[1] - nt[0] : 24 - nt[0] + nt[1];
  for (let t = Math.floor(now / LAMP_CLIMATE_DETAIL_HOUR) * LAMP_CLIMATE_DETAIL_HOUR; t > t0 - nightLen * LAMP_CLIMATE_DETAIL_HOUR; t -= LAMP_CLIMATE_DETAIL_HOUR) {
    if (new Date(t).getHours() !== nt[0] || new Date(t).getMinutes() !== 0) continue;
    const a = tx(t), b = tx(Math.min(now, t + nightLen * LAMP_CLIMATE_DETAIL_HOUR));
    if (b - a < 20) continue;
    g += '<rect x="' + f(a) + '" y="' + (TOP - 6) + '" width="' + f(b - a) + '" height="' + (H - TOP + 6) + '" rx="3" fill="#fff" fill-opacity=".028"/>' +
      '<path d="' + LAMP_CLIMATE_DETAIL_MOON + '" transform="translate(' + f(a + 9) + ' ' + (TOP + 2) + ') scale(.62)" fill="#fff" fill-opacity=".36"/>';
    break;
  }

  // The clock: a tick every three hours, a figure every six, midnight by name with its dotted line.
  const h0 = new Date(t0); h0.setMinutes(0, 0, 0);
  for (let t = h0.getTime() + LAMP_CLIMATE_DETAIL_HOUR; t < now; t += LAMP_CLIMATE_DETAIL_HOUR) {
    const hr = new Date(t).getHours();
    if (hr % 3) continue;
    const x = tx(t);
    g += '<line x1="' + f(x) + '" x2="' + f(x) + '" y1="' + H + '" y2="' + (H + 3) + '" stroke="rgba(255,255,255,.3)"/>';
    if (hr % 6) continue;
    if (!hr) g += '<line x1="' + f(x) + '" x2="' + f(x) + '" y1="' + (TOP - 4) + '" y2="' + H + '" stroke="rgba(255,255,255,.16)" stroke-dasharray="1 3"/>';
    const txt = hr ? (hr < 10 ? '0' : '') + hr + ':00' : 'midnight', w = lampClimateDetailTextW(txt);
    if (x - w / 2 < 0 || x + w / 2 > PW) continue;
    g += '<text x="' + f(x) + '" y="' + (H + 15) + '" font-size="11" text-anchor="middle" fill="rgba(255,255,255,.45)">' + txt + '</text>';
  }

  // The room's low and high. A label sits above or below its ring; if that place is taken, it takes the other.
  const halo = 'paint-order:stroke;stroke:' + LAMP_CLIMATE_DETAIL_GROUND + ';stroke-width:3px;stroke-linejoin:round;font-variant-numeric:tabular-nums';
  const boxes = [];
  const hit = function (b) { return boxes.some(function (q) { return b.x < q.x + q.w + 4 && q.x < b.x + b.w + 4 && b.y < q.y + q.h && q.y < b.y + b.h; }); };
  const label = function (px, py, txt, side, ink, anchor) {
    const w = lampClimateDetailTextW(txt), sides = side === 'up' ? ['up', 'down'] : side === 'left' ? ['left'] : ['down', 'up'];
    let pick = null;
    sides.forEach(function (sd) {
      if (pick && !pick.hit) return;
      const ty = sd === 'up' ? py - 8 : sd === 'left' ? py + 4 : py + 16;
      if (ty - 10 < 0 || ty > H + 2) return;
      const bx = sd === 'left' ? px - 8 - w : Math.min(Math.max(px - w / 2, 0), PW - w);
      const b = { x: bx, y: ty - 10, w: w, h: 12 };
      b.hit = hit(b);
      if (!pick || !b.hit) pick = b;
    });
    if (!pick || (side === 'left' && pick.hit)) return '';
    boxes.push(pick);
    return '<text x="' + f(pick.x) + '" y="' + f(pick.y + 10) + '" font-size="11" fill="' + ink + '" style="' + halo + '">' + txt + '</text>';
  };
  const xin = lampClimateDetailExtremes(o.pin);
  let marks = '';
  [xin.hi, xin.lo].forEach(function (q) {
    marks += '<circle cx="' + f(tx(q[0])) + '" cy="' + f(y(q[1])) + '" r="3" fill="' + LAMP_CLIMATE_DETAIL_GROUND + '" stroke="' + line + '" stroke-width="1.5"/>';
  });
  marks += label(tx(xin.hi[0]), y(xin.hi[1]), xin.hi[1].toFixed(1) + '° · ' + lampClimateDetailHMM(xin.hi[0]), 'up', 'rgba(255,255,255,.88)');
  marks += label(tx(xin.lo[0]), y(xin.lo[1]), xin.lo[1].toFixed(1) + '° · ' + lampClimateDetailHMM(xin.lo[0]), 'down', 'rgba(255,255,255,.88)');
  // The weather's line ends in its name and reading, left of its dot, when there is room.
  if (out) marks += label(PW, y(so[N - 1]), 'Outside ' + Math.round(out[out.length - 1][1]) + '°', 'left', 'rgba(255,255,255,.5)');

  return '<svg width="' + W + '" height="' + (H + 16) + '" style="display:block;overflow:visible"><defs>' +
    '<linearGradient id="cd-spec" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(y(bandTop)) + '" x2="0" y2="' + f(y(bandBot)) + '">' + stops + '</linearGradient>' +
    '<linearGradient id="cd-depth" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(y(bandTop)) + '" x2="0" y2="' + f(y(bandBot)) + '">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".45" stop-color="#fff" stop-opacity=".2"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity=".03"/></linearGradient>' +
    '<mask id="cd-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#cd-depth)"/></mask></defs>' + g +
    '<path d="' + band + '" fill="url(#cd-spec)" mask="url(#cd-mask)"/>' +
    (out ? '<path d="' + path(so) + '" fill="none" stroke="rgba(255,255,255,.34)" stroke-width="1.2" stroke-dasharray="1.5 3" stroke-linecap="round"/>' : '') +
    '<path d="' + path(si) + '" fill="none" stroke="' + line + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<circle cx="' + f(PW) + '" cy="' + f(y(si[N - 1])) + '" r="3.5" fill="' + line + '"/>' +
    (out ? '<circle cx="' + f(PW) + '" cy="' + f(y(so[N - 1])) + '" r="2.6" fill="rgba(255,255,255,.5)"/>' : '') +
    marks + '</svg>';
}

const LAMP_CLIMATE_DETAIL_CSS = '<style>' +
  '.cd{font-family:var(--primary-font-family, Roboto, Noto, sans-serif);color:#fff;line-height:1.25}' +
  '.cd-now{display:flex;align-items:flex-end;gap:14px;padding:0 2px}' +
  '.cd-big{font-size:var(--lamplight-t-reading);font-weight:300;letter-spacing:-.02em;line-height:1;color:var(--lamplight-ink-strong);font-variant-numeric:tabular-nums}' +
  '.cd-big span{font-size:var(--lamplight-t-title);font-weight:300;letter-spacing:0;color:var(--lamplight-ink-soft);vertical-align:top;position:relative;top:3px;margin-left:1px}' +
  '.cd-feel{display:flex;flex-direction:column;gap:3px;padding-bottom:7px}' +
  '.cd-feel b{font-size:var(--lamplight-t-name);font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.cd-feel span{font-size:var(--lamplight-t-body);color:var(--lamplight-ink-soft)}' +
  '.cd-eb{display:flex;justify-content:space-between;align-items:baseline;padding:24px 2px 12px;line-height:1;font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--lamplight-ink-quiet)}' +
  '.cd-eb span{font-size:var(--lamplight-t-caption);font-weight:400;letter-spacing:0;text-transform:none;color:var(--lamplight-ink-quiet)}' +
  '.cd-io-chart{margin:0 2px}' +
  '.cd-sleep{display:flex;gap:9px;align-items:center;font-size:var(--lamplight-t-body);line-height:1.35;color:var(--lamplight-ink-soft);margin:12px 2px 0}' +
  '.cd-sleep svg{flex:none}' +
  '.cd-sleep b{font-weight:500;color:var(--lamplight-ink-strong)}' +
  '.cd-look{position:relative;border-radius:14px;background:rgba(255,255,255,.04);padding:13px 15px 14px 18px;margin:0 2px 8px}' +
  '.cd-look::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 2px 2px 0;background:var(--k)}' +
  '.cd-look b{display:block;font-size:var(--lamplight-t-name);font-weight:500;color:var(--lamplight-ink-strong);margin-bottom:3px}' +
  '.cd-look span{display:block;font-size:var(--lamplight-t-body);line-height:1.45;color:var(--lamplight-ink-mid)}' +
  '.cd-graph-wrap{position:relative;margin-top:4px}' +
  '.cd-bands{position:absolute;inset:0;width:100%;height:100%;z-index:0}' +
  '.cd-child{position:relative;z-index:1;display:block}' +
  '</style>';

// LAMP_SVG_NS is declared in 97-plug-detail.js; every module shares one closure.

class LampClimateDetail extends HTMLElement {

  static getStubConfig() {
    return { temperature: '' };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (!config.temperature) throw new Error('lamplight-climate-detail needs a `temperature`');
    this._config = config;
    this._temperature = config.temperature;
    this._humidity = config.humidity || null;
    this._graph = config.graph || null;
    this._outside = config.outside || null;
    this._line = lampColour(config.line_color || '255,255,255', 'soft');
    this._daySeries = null;
    this._sleep = config.bedroom === true;
    this._sleepMax = typeof config.sleep_max_temp === 'number' ? config.sleep_max_temp : lampDefault('climate-detail', 'sleep_max_temp');
    this._damp = Array.isArray(config.damp_range) && config.damp_range.length === 2 ? config.damp_range : lampDefault('climate-detail', 'damp_range');
    this._night = Array.isArray(config.night_hours) && config.night_hours.length === 2 ? config.night_hours : lampDefault('climate-detail', 'night_hours');
    this._range = config.comfort_range || LAMP_CLIMATE_RANGE;
    this._words = Object.assign({}, LAMP_CLIMATE_WORDS, config.comfort_words || {});
    this._stats = null;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._child) this._child.hass = hass;
    if (first) this._startStats();
    this._update();
  }

  connectedCallback() { if (this._hass) this._startStats(); }
  disconnectedCallback() { this._stopStats(); }

  getCardSize() { return this._graph ? 7 : 5; }

  // ---- the card -------------------------------------------------------------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    this.style.display = 'block';

    const card = document.createElement('ha-card');
    this._card = card;
    [['background', 'transparent'], ['border', 'none'], ['border-radius', '0'],
     ['box-shadow', 'none'], ['backdrop-filter', 'none'], ['-webkit-backdrop-filter', 'none']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    card.style.padding = '2px 2px 8px';
    card.style.boxSizing = 'border-box';
    card.style.display = 'block';
    card.style.textAlign = 'left';

    const sheet = document.createElement('div');
    sheet.className = 'cd';
    sheet.innerHTML = LAMP_CLIMATE_DETAIL_CSS;
    this._body = sheet;

    this._heroEl = document.createElement('div');
    sheet.appendChild(this._heroEl);
    // ---- how it's been. A ResizeObserver draws it: the sheet opens hidden, with no width.
    this._ioEl = document.createElement('div');
    sheet.appendChild(this._ioEl);
    this._ioW = 0;
    if (this._ro) this._ro.disconnect();
    this._ro = new ResizeObserver(() => {
      const w = Math.round(this._ioEl.clientWidth);
      if (w > 0 && w !== this._ioW) { this._ioW = w; this._paintIO(); }
    });
    this._ro.observe(this._ioEl);
    this._sectionsEl = document.createElement('div');
    sheet.appendChild(this._sectionsEl);

    // ---- the optional graph slot, at the foot
    if (this._graph) {
      const eb = document.createElement('div');
      eb.className = 'cd-eb';
      eb.textContent = 'Last 7 days';
      sheet.appendChild(eb);
      this._gWrap = document.createElement('div');
      this._gWrap.className = 'cd-graph-wrap';
      const gh = typeof this._graph.height === 'number' ? this._graph.height : 192;
      this._gWrap.style.aspectRatio = '500 / ' + gh;
      this._bandsSvg = document.createElementNS(LAMP_SVG_NS, 'svg');
      this._bandsSvg.setAttribute('class', 'cd-bands');
      this._bandsSvg.setAttribute('preserveAspectRatio', 'none');
      this._gWrap.appendChild(this._bandsSvg);
      sheet.appendChild(this._gWrap);
      this._daysSvg = document.createElementNS(LAMP_SVG_NS, 'svg');
      this._daysSvg.setAttribute('height', '26');
      this._daysSvg.style.display = 'block';
      this._daysSvg.style.width = '100%';
      sheet.appendChild(this._daysSvg);
    }

    card.appendChild(sheet);
    this.shadowRoot.appendChild(card);
    this._buildChild();
  }

  // ---- the statistics ---------------------------------------------------------

  _startStats() {
    if (this._statsTimer || !this.isConnected) return;
    const self = this;
    this._fetchStats();
    this._statsTimer = setInterval(function () { self._fetchStats(); }, LAMP_CLIMATE_DETAIL_STATS_MS);
  }

  _stopStats() {
    clearInterval(this._statsTimer);
    this._statsTimer = null;
  }

  // One query for both sensors: 194 hours of hourly mean, min and max. The week is the last 168;
  // "than usual" needs the 168 hours before the last 24 as well.
  async _fetchStats() {
    if (!this._hass) return;
    const ids = [this._temperature];
    if (this._humidity) ids.push(this._humidity);
    const now = Date.now();
    try {
      const st = await this._hass.connection.sendMessagePromise({
        type: 'recorder/statistics_during_period', period: 'hour', types: ['mean', 'min', 'max'],
        statistic_ids: ids, start_time: new Date(now - 194 * LAMP_CLIMATE_DETAIL_HOUR).toISOString(),
        end_time: new Date(now).toISOString()
      });
      this._setStats(lampClimateDetailRows(st[this._temperature], now, 192),
        this._humidity ? lampClimateDetailRows(st[this._humidity], now) : [], now);
      this._paintBandsAndStrip();
    } catch (e) {
      // Keep the last good statistics; the next tick tries again.
    }
    this._fetchDay();
  }

  // The last 24 hours of the room and the weather, as recorded: one query.
  async _fetchDay() {
    const ids = [this._temperature];
    if (this._outside) ids.push(this._outside);
    const now = Date.now(), t0 = now - 24 * LAMP_CLIMATE_DETAIL_HOUR;
    try {
      const r = await this._hass.connection.sendMessagePromise({
        type: 'history/history_during_period', start_time: new Date(t0).toISOString(),
        end_time: new Date(now).toISOString(), entity_ids: ids, minimal_response: true, no_attributes: true
      });
      const rows = function (id) {
        if (!id) return null;
        const pts = (r[id] || []).map(function (e) {
          return [Math.max(t0, e.lu ? e.lu * 1000 : Date.parse(e.last_updated || e.last_changed)),
            parseFloat(e.s !== undefined ? e.s : e.state)];
        }).filter(function (p) { return !isNaN(p[1]); });
        return pts.length ? pts : null;
      };
      this._daySeries = { now: now, pin: rows(this._temperature), pout: rows(this._outside) };
    } catch (e) {
      // Keep the last good series; the next tick tries again.
    }
    this._update();
  }

  // Everything the sheet says, from the hourly rows. The tests call this directly. `tRows` may hold
  // up to 192 hours; the week is the last 168 of them.
  _setStats(tRows, hRows, now) {
    const weekStart = now - LAMP_CLIMATE_DETAIL_WEEK_HOURS * LAMP_CLIMATE_DETAIL_HOUR;
    const week = tRows.filter(function (r) { return r.t >= weekStart; });
    const nights = lampClimateDetailNights(week, hRows, this._night, now);
    const damp = this._humidity && hRows.length ? lampClimateDetailDamp(hRows, nights, this._damp) : null;
    this._stats = {
      now: now,
      nights: nights,
      damp: damp,
      looks: lampClimateDetailLooks(damp, lampClimateDetailUnusual(tRows, now), this._damp)
    };
    this._paintSections();
  }

  // ---- the state ------------------------------------------------------------

  _number(id) {
    if (!id) return null;
    const s = this._hass.states[id];
    const v = s ? parseFloat(s.state) : NaN;
    return isNaN(v) ? null : v;
  }

  _update() {
    if (!this._hass || !this._body) return;
    this._paintHero();
    this._paintIO();
  }

  // Now: the reading, the comfort word, the humidity. Reads the raw state for the comfort word, not
  // `_number`'s null: an unavailable sensor falls through both comparisons and reads as
  // "Comfortable", the same quirk lamplight-climate keeps.
  _paintHero() {
    const tState = this._hass.states[this._temperature];
    const tRaw = tState ? parseFloat(tState.state) : NaN;
    const tVal = this._number(this._temperature);
    const word = tRaw < this._range[0] ? this._words.cool : (tRaw > this._range[1] ? this._words.warm : this._words.comfortable);
    const hVal = this._humidity ? this._number(this._humidity) : null;
    const html = '<div class="cd-now"><div class="cd-big">' + (tVal === null ? '--' : tVal.toFixed(1)) + '<span>°</span></div>' +
      '<div class="cd-feel"><b>' + word + '</b>' + (hVal !== null ? '<span>' + Math.round(hVal) + '% humidity</span>' : '') + '</div></div>';
    if (html !== this._heroHtml) { this._heroHtml = html; this._heroEl.innerHTML = html; }
  }

  // How it's been: the eyebrow and the chart.
  _paintIO() {
    const ds = this._daySeries, W = this._ioW;
    if (!ds || !ds.pin || !W) { this._ioEl.innerHTML = ''; this._ioKey = null; return; }
    const tin = this._number(this._temperature), tout = this._outside ? this._number(this._outside) : null;
    const now = Date.now();
    // hass is set on every state change in the house; draw again only when this chart would change.
    const k = [tin, tout, ds.now, W, Math.floor(now / 60000)].join('|');
    if (k === this._ioKey) return;
    this._ioKey = k;
    // The newest reading closes each line at now.
    const pin = ds.pin.concat(tin !== null ? [[now, tin]] : []);
    const pout = ds.pout ? ds.pout.concat(tout !== null ? [[now, tout]] : []) : null;
    this._ioEl.innerHTML = '<div class="cd-eb">How it’s been<span>last 24 hours</span></div>' +
      '<div class="cd-io-chart">' + lampClimateDetailChart({ W: W - 4, pin: pin, pout: pout, now: now, line: this._line, night: this._night }) + '</div>';
  }

  // The nights line, and Worth a look when there is something to say.
  _paintSections() {
    const s = this._stats;
    if (!s) { this._sectionsEl.innerHTML = ''; return; }
    const sleep = lampClimateDetailSleepSay(s.nights, this._sleep, this._sleepMax);
    let html = sleep ? '<p class="cd-sleep"><svg viewBox="-7 -7 14 14" width="13" height="13" aria-hidden="true"><path d="' +
      LAMP_CLIMATE_DETAIL_MOON + '" fill="rgba(255,255,255,.56)"/></svg><span><b>' + sleep + '</b></span></p>' : '';
    if (s.looks.length) {
      html += '<div class="cd-eb">Worth a look</div>' + s.looks.map(function (l) {
        const k = LAMP_CLIMATE_DETAIL_LOOK[l.kind], col = typeof k === 'number' ? lampComfortColour(k) : k;
        return '<div class="cd-look" style="--k:rgb(' + col + ')"><b>' + l.head + '</b><span>' + l.line + '</span></div>';
      }).join('');
    }
    this._sectionsEl.innerHTML = html;
  }

  // ---- the optional graph slot -------------------------------------------------

  // Build the graph child as a <hui-card>, the way lamplight-climate builds its sparkline.
  async _buildChild() {
    if (!this._graph) return;
    await window.loadCardHelpers();
    const el = document.createElement('hui-card');
    el.className = 'cd-child';
    if (this._hass) el.hass = this._hass;
    el.config = this._graph;
    this._gWrap.appendChild(el);
    this._child = el;
    this._flattenChild(el);
  }

  // Take the theme's blur and the child's own box away, the same trap lamplight-climate records:
  // the theme blurs a child ha-card with backdrop-filter, which blurs the night bands behind it.
  _flattenChild(huiCard) {
    const apply = function () {
      const el = huiCard.firstElementChild || huiCard;
      const sr = el.shadowRoot;
      if (!sr) return false;
      if (sr.querySelector('style[data-lamp]')) return true;
      const s = document.createElement('style');
      s.setAttribute('data-lamp', '');
      s.textContent = 'ha-card, .card-content > ha-card {' +
        'background: none !important; box-shadow: none !important; border: none !important;' +
        'border-radius: 0 !important; padding: 0 !important;' +
        'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }';
      sr.appendChild(s);
      return true;
    };
    if (apply()) return;
    let n = 0;
    const t = setInterval(function () { if (apply() || ++n > 50) clearInterval(t); }, 40);
  }

  // The slot draws `hours_to_show` points, point `i` being the hour bucket ending
  // `hours_to_show - 1 - i` hours before now, so time `t` maps to x with
  // first = end - hours_to_show * 1h + 0.5h and x = (t - first) / ((hours_to_show - 1) * 1h) * width.
  _paintBandsAndStrip() {
    if (!this._graph) return;
    const w = this._gWrap.clientWidth || 339;
    const gh = this._gWrap.clientHeight || (w * (typeof this._graph.height === 'number' ? this._graph.height : 192) / 500);
    const hoursToShow = typeof this._graph.hours_to_show === 'number' ? this._graph.hours_to_show : 24;
    const end = Date.now();
    const first = end - hoursToShow * LAMP_CLIMATE_DETAIL_HOUR + LAMP_CLIMATE_DETAIL_HOUR / 2;
    const span = (hoursToShow - 1) * LAMP_CLIMATE_DETAIL_HOUR;
    const xOf = function (t) { return ((t - first) / span) * w; };

    this._bandsSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + gh);
    let bands = '';
    const nightLenH = this._night[1] > this._night[0] ? this._night[1] - this._night[0] : 24 - this._night[0] + this._night[1];
    for (let t = first; t <= end; t += LAMP_CLIMATE_DETAIL_HOUR) {
      if (new Date(t).getHours() !== this._night[0]) continue;
      const x0 = Math.max(0, xOf(t)), x1 = Math.min(w, xOf(t + nightLenH * LAMP_CLIMATE_DETAIL_HOUR));
      if (x1 > x0) bands += '<rect x="' + x0.toFixed(1) + '" y="0" width="' + (x1 - x0).toFixed(1) + '" height="' + gh + '" fill="rgba(255,255,255,.045)"/>';
    }
    this._bandsSvg.innerHTML = bands;

    let d = '<line x1="0" x2="' + w + '" y1="0.5" y2="0.5" stroke="rgba(255,255,255,.10)"/>';
    const mids = [];
    for (let t = first; t <= end; t += LAMP_CLIMATE_DETAIL_HOUR) {
      if (new Date(t).getHours() === 0 && xOf(t) >= 0) mids.push(t);
    }
    mids.forEach(function (t, i) {
      const x = xOf(t), nx = i + 1 < mids.length ? xOf(mids[i + 1]) : w, last = i === mids.length - 1;
      d += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="0" y2="5" stroke="rgba(255,255,255,.25)"/>';
      const segW = (last ? w : nx) - x;
      const label = last ? 'Today' : lampClimateDetailWeekday(t);
      const labelW = label.length * 6.5 + 6;
      const midX = last ? w : (x + nx) / 2;
      if (i > 0 || segW >= labelW || last) {
        d += '<text x="' + midX.toFixed(1) + '" y="19" font-size="11" font-family="Roboto,sans-serif" ' +
          'text-anchor="' + (last ? 'end' : 'middle') + '" fill="rgba(255,255,255,' + (last ? '.92' : '.5') + ')" ' +
          'font-weight="' + (last ? '500' : '400') + '">' + label + '</text>';
      }
    });
    this._daysSvg.setAttribute('viewBox', '0 0 ' + w + ' 26');
    this._daysSvg.innerHTML = d;
  }
}

customElements.define('lamplight-climate-detail', LampClimateDetail);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-climate-detail',
  name: 'Lamplight Climate Detail',
  description: 'A climate pop-up body: the room now, its last 24 hours, and a note when something is worth a look.',
  preview: false
});
