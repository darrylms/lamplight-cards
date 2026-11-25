// lamplight-climate. The room header: the temperature now, the comfort word, and three readings.
//
// It replaces the second of two `custom:button-card`s inside every Climate panel - the first
// draws the "Climate" eyebrow and is untouched, this row is the content below it. It is a ROW,
// not a panel: put it inside a `lamplight-panel`.
//
// THE DECISION (14 Nov 2026, design-docs/climate_row_polish_options.html, option 11 "Softer Colour")
// It replaces option 11 "Mercury Tiles" of 13 Nov 2026 (design-docs/climate_card_options.html).
//
//     15.3 °C                  [drop]   64%  humidity      the number on the left, its readings
//     Cool                     [sun]  17.7°  high · 17:53  on the right in one table
//                              [ice]  14.6°  low · 03:50
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   the wave: the last 24 hours
//
// There is no hairline and there are no tiles. The grid does the alignment: the figures are one
// right-aligned column, so the digits line up, and the comfort word sits under the numeral.
//
// THE GLOW UNDER THE NUMBER
// Two layers in the room accent, as the wave is: a bloom shaped like the digits (two text shadows),
// and a wide, low pool under the number. The pool is an ellipse with an eased fall over seven stops
// and 6.5% at its centre, so it has no rim. The household rejected a plain radial disc at 17%
// (option 9) as too strong, and a glow in the comfort colour (0.101.0-dev) as odd beside the room's
// own colour (14 Nov 2026, 0.102.0-dev).
//
// THE ICONS (14 Nov 2026, design-docs/climate_row_icons/, option A2 "Soft White, Room Tint")
// Drawn here, not taken from MDI: a drop, a sun for the high and a frost crystal for the low. They are
// FLAT: one colour each and no gradient. The household found a lit sun looked like a ball here; the
// weather card keeps its lit glyphs.
// The icons are QUIET INK. The colour is white with 20% of the room accent mixed in, and the glyph
// is drawn at 56% opacity, the in-panel quiet step. The opacity is on the whole SVG, so the frost's
// crossing strokes do not add up. Measured contrast on the panel is 5.2 to 5.5 in each room: near
// the labels (5.2), far below the figures (14.8). The wave now carries the room colour, so the
// icons do not need to stand out. Until 0.102.0-dev they had three fixed colours at contrast 11
// (the Law 02.2 exception, which stays but is not used here). The full accent is not used: on a
// lamplight-light row a glowing accent icon means "on", and a reading has no on state.
// The humidity reading stays in the colour of its figure. The drop is full (d-156's drop filled to
// the humidity was replaced in d-158), and it glows only from the damp band's top end, the same rule
// as the drop on the climate sheet.
//
// THE WAVE
// The crest is the room's temperature over the last 24 hours: sampled every 30 minutes, the last
// value held, smoothed (a 7-point mean, six passes), with the newest reading at the right edge. A day
// with less than 3.5 degrees of range is drawn as 3.5 degrees, so a mild day is a calm wave. The 21 Sep
// 2026 rule "Lamplight does not reimplement the sparkline" was set aside for this wave by the household
// (14 Nov 2026).
//
// THE WAVE'S TWO COLOURS (14 Nov 2026, 0.104.0-dev; probes in design-docs/climate_wave_tune/)
// The right end is the room accent. The left end is the accent turned toward blue (HSL hue 222), the
// short way round the hue circle, by at least 45 and at most 100 degrees. The reference image goes
// from blue to violet; until 0.103.0-dev the turn was a fixed 34 degrees and no room reached blue.
//   Bedroom 326 -> 226 (blue, the 100 maximum)    Lounge 36 -> 296 (magenta, the 100 maximum)
//   Games Room 267 -> 222    Bathroom 176 -> 222    Hallway 217 -> 262 (violet, the 45 minimum)
// The minimum keeps two tones when the accent is already blue. The maximum stops a warm accent from
// going to blue through a rainbow. The left fifth holds the left colour. Then the colour goes to
// the accent in a straight line through OKLab, eased, not round the hue circle: a far pair meets
// through a quieter middle, so a fade never shows a third hue. The household rejected a fixed turn
// of -100, -75 or -50 (green starts in the Hallway and the Bathroom, or no blue in the Bedroom).
//
// Five layers on one canvas, each faded at the ends: a glow above the crest only (the crest 18px wide,
// blurred 7px, 16%, faded out before the canvas top), a haze (18px, blurred 11px, 10%), the body (15%
// at the crest, eased to 2% at the foot), a crest glow (3px, blurred 5px, 30%) and a 0.8px line at 55%.
// The canvas is 100px tall, 30px taller than the wave needs, so that the glow is not cut flat at the
// top. The household asked for the glow (the reference has one) and then for less of it: 24px, 9px
// and 22% was too strong. A triangular dither of one alpha step goes over the result, against banding.
// The panel does not clip its children, so the canvas rounds its own bottom corners, but only when
// this row is the last in its panel. In the Lounge the purifier row is under it.
//
// THE READINGS
// The low and the high are of the LAST 24 HOURS, not of the day since midnight (13 Nov 2026: since
// midnight, the high was the evening's heat still in the room at 00:00). Each figure has its time.
// The history is read when the card connects and every 10 minutes; a new reading that goes past the
// low or the high moves it at once, and moves the right end of the wave.
//
// THE COMFORT WORD DEFAULTS TO "COMFORTABLE" WHEN THE SENSOR HAS NO READING
// Ported from the live template, on purpose. `parseFloat` of a missing or unavailable state is
// `NaN`, and `NaN < lo` and `NaN > hi` are both false, so the word falls through to the middle word
// and colour instead of showing a dash. The large numerals still show "--".
//
// Configuration:
//   temperature     required. The sensor read for the numerals, the comfort word, the low and high
//   humidity        optional. Omitted, the row has two readings
//   accent          "r,g,b" | hex | rgb(). The colour of the wave and of the glow under the number. Give the accent that the room's
//                   lamplight-light rows use (Bedroom 235,110,180). Default '90,150,245'
//   comfort_range   [18, 25]. Below the low end reads "Cool", above the high end "Warm",
//                   between them "Comfortable"
//   comfort_colors  {cool, warm, comfortable}. Defaults '90,150,245', '235,120,70', '78,200,130'
//   comfort_words   {cool, warm, comfortable}. Defaults 'Cool', 'Warm', 'Comfortable'
//   humidity_range  [45, 65]. The dry and wet ends of the humidity colour ramp
//   humidity_colors three rgb triples: dry, middle, wet. The middle sits at 0.55 of the ramp,
//                   the same break lamplight-rooms uses
//   damp_range      [60, 70], as on lamplight-climate-detail. The drop glows from the second value
//   hot_icon_color  "r,g,b". The sun. Default: white with 20% of the accent
//   cold_icon_color "r,g,b". The frost. Default: the same
//   humid_icon_color "r,g,b". The drop. Default: the same. Each icon is drawn at 56% opacity
//   show_wave       true. false draws no wave
//   tap_action      default { action: more-info } on `temperature`
//   graph, midnight no longer read (until 0.98.0-dev: the sparkline slot and its midnight mark)

const LAMP_CLIMATE_RANGE = [18, 25];
const LAMP_CLIMATE_COLORS = LAMP_MEANINGS.comfort;
const LAMP_CLIMATE_WORDS = { cool: 'Cool', warm: 'Warm', comfortable: 'Comfortable' };
const LAMP_CLIMATE_HUMIDITY_COLORS = LAMP_MEANINGS.humidity.ramp;
// The icons: white with this part of the room accent, drawn at this opacity.
const LAMP_CLIMATE_ICON_TINT = 0.2;
const LAMP_CLIMATE_ICON_ALPHA = 0.56;

// Where the middle humidity colour sits on the ramp. Not configurable, the same reason
// lamplight-rooms gives: a third stop that moves is two decisions to explain and nobody has needed
// the first one.
const LAMP_CLIMATE_BREAK = 0.55;
const LAMP_CLIMATE_HOUR = 3600000;
const LAMP_CLIMATE_REFETCH_MS = 10 * 60 * 1000;

// The wave. Its box is 100px tall; the crest moves between 60px and 84px from the box's top. The
// 60px above the highest crest is for the glow.
const LAMP_CLIMATE_WAVE_H = 100;
const LAMP_CLIMATE_WAVE_TOP = 60, LAMP_CLIMATE_WAVE_RISE = 24;
// The left colour: the accent turned toward this HSL hue, by at least the first and at most the
// second number of degrees.
const LAMP_CLIMATE_WAVE_COOL = 222;
const LAMP_CLIMATE_WAVE_TURN = [45, 100];
const LAMP_CLIMATE_WAVE_N = 49;          // 24 hours every 30 minutes, both ends included
const LAMP_CLIMATE_WAVE_MIN_SPAN = 3.5;  // degrees
const LAMP_CLIMATE_WAVE_PAD = 40;        // the row's bottom padding when it has a wave
const LAMP_CLIMATE_PANEL_RADIUS = 19;    // the panel's 20px radius inside its 1px border

function lampClimateRgb(c, a) {
  return a === undefined ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + a + ')';
}
function lampClimateMix(c, d, k) {
  return c.map(function (v, i) { return Math.round(v + (d[i] - v) * k); });
}
function lampClimateTriple(s) { return String(s).split(',').map(Number); }

// Two straight lines through three stops, ported from the live template. Returns [r, g, b].
function lampClimateHumidityRgb(h, ramp, colors) {
  const lo = ramp[0], hi = ramp[1];
  const f = Math.max(0, Math.min(1, (h - lo) / (hi - lo)));
  const A = colors[0], B = colors[1], C = colors[2];
  const k = LAMP_CLIMATE_BREAK;
  const p = f <= k
    ? A.map(function (v, i) { return v + (B[i] - v) * (f / k); })
    : B.map(function (v, i) { return v + (C[i] - v) * ((f - k) / (1 - k)); });
  return p.map(function (v) { return Math.round(v); });
}

// ---- the glyphs: flat, one colour each, at the icon opacity -----------------------------------

const LAMP_CLIMATE_SVG_STYLE = 'display:block;overflow:visible;opacity:' + LAMP_CLIMATE_ICON_ALPHA;

// The sun: a disc and eight rays.
function lampClimateSun(c, h) {
  let rays = '';
  for (let k = 0; k < 8; k++) rays += '<path transform="rotate(' + (k * 45) + ' 16 16)" d="M16 2.8v3.4"/>';
  return '<svg viewBox="0 0 32 32" width="' + h + '" height="' + h + '" style="' + LAMP_CLIMATE_SVG_STYLE + '">' +
    '<g stroke="' + lampClimateRgb(c) + '" stroke-width="2.4" stroke-linecap="round">' + rays + '</g>' +
    '<circle cx="16" cy="16" r="6.6" fill="' + lampClimateRgb(c) + '"/></svg>';
}

// The frost: a crystal with six arms.
function lampClimateFrost(c, h) {
  let arms = '';
  for (let k = 0; k < 6; k++) {
    arms += '<g transform="rotate(' + (k * 60) + ' 16 16)">' +
      '<path d="M16 16V3.2M16 7.4l-3.2-3M16 7.4l3.2-3M16 11.6l-2.4-2.2M16 11.6l2.4-2.2"/></g>';
  }
  return '<svg viewBox="0 0 32 32" width="' + h + '" height="' + h + '" style="' + LAMP_CLIMATE_SVG_STYLE + '">' +
    '<g fill="none" stroke="' + lampClimateRgb(c) + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + arms + '</g></svg>';
}

// The drop: full and flat. The white highlight went with the fixed colours (option A2): on a
// near-white drop it does not show.
function lampClimateDrop(c, h) {
  const d = 'M13 1.6C12.5 1.6 12.1 1.9 11.8 2.3 8.6 7 3 14.6 3 21.4a10 10 0 0 0 20 0C23 14.6 17.4 7 14.2 2.3 13.9 1.9 13.5 1.6 13 1.6z';
  return '<svg viewBox="0 0 26 34" width="' + (h * 26 / 34).toFixed(2) + '" height="' + h + '" style="' + LAMP_CLIMATE_SVG_STYLE + '">' +
    '<path d="' + d + '" fill="' + lampClimateRgb(c) + '"/></svg>';
}

function lampClimateHM(t) {
  const d = new Date(t);
  return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
}

// The last 24 hours of a sensor: its readings, and the lowest and highest, each with its time.
// The first row the recorder gives is the state at the start of the window; its time is clamped.
async function lampClimateDay(hass, id, now) {
  const t0 = now - 24 * LAMP_CLIMATE_HOUR;
  const r = await hass.connection.sendMessagePromise({
    type: 'history/history_during_period', start_time: new Date(t0).toISOString(),
    end_time: new Date(now).toISOString(), entity_ids: [id], minimal_response: true, no_attributes: true
  });
  let lo = null, hi = null;
  const rows = [];
  (r[id] || []).forEach(function (e) {
    const v = parseFloat(e.s !== undefined ? e.s : e.state);
    if (isNaN(v)) return;
    const t = Math.max(t0, e.lu ? e.lu * 1000 : Date.parse(e.last_updated || e.last_changed));
    rows.push({ t: t, v: v });
    if (!lo || v < lo.v) lo = { v: v, t: t };
    if (!hi || v > hi.v) hi = { v: v, t: t };
  });
  return lo ? { lo: lo, hi: hi, rows: rows, t0: t0 } : null;
}

// ---- the wave ---------------------------------------------------------------------------------

// The values under the crest: every 30 minutes from t0, the last reading held, the newest value at
// the right end, then smoothed.
function lampClimateWaveValues(day, now, latest) {
  const N = LAMP_CLIMATE_WAVE_N, step = 24 * LAMP_CLIMATE_HOUR / (N - 1), t0 = now - 24 * LAMP_CLIMATE_HOUR;
  const rows = day.rows;
  const out = [];
  let j = 0, last = rows.length ? rows[0].v : latest;
  for (let i = 0; i < N; i++) {
    const t = t0 + i * step;
    while (j < rows.length && rows[j].t <= t) { last = rows[j].v; j++; }
    out.push(last);
  }
  if (latest !== null) out[N - 1] = latest;
  let sm = out;
  for (let k = 0; k < 6; k++) {
    sm = sm.map(function (x, i) {
      let a = 0;
      for (let q = -3; q <= 3; q++) a += sm[Math.max(0, Math.min(N - 1, i + q))];
      return a / 7;
    });
  }
  return sm;
}

function lampClimateHsl(c) {
  const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
  const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2;
  let h = 0, s = 0;
  if (M !== m) {
    const d = M - m;
    s = l > 0.5 ? d / (2 - M - m) : d / (M + m);
    h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function lampClimateFromHsl(h, s, l) {
  const k = function (n) { return (n + h / 30) % 12; };
  const a = s * Math.min(l, 1 - l);
  const f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); };
  return [f(0), f(8), f(4)].map(function (x) { return Math.round(x * 255); });
}
// The wave's left colour: the accent turned toward LAMP_CLIMATE_WAVE_COOL the short way round, by
// at least LAMP_CLIMATE_WAVE_TURN[0] and at most LAMP_CLIMATE_WAVE_TURN[1] degrees. HSL saturation
// and lightness stay.
function lampClimateCoolEnd(c) {
  const hsl = lampClimateHsl(c);
  const s = ((LAMP_CLIMATE_WAVE_COOL - hsl[0] + 540) % 360) - 180;
  const turn = Math.max(LAMP_CLIMATE_WAVE_TURN[0], Math.min(LAMP_CLIMATE_WAVE_TURN[1], Math.abs(s)));
  return lampClimateFromHsl((hsl[0] + (s > 0 ? turn : -turn) + 720) % 360, hsl[1], hsl[2]);
}

// THE FAR COLOUR (14 Nov 2026, design-docs/climate_top_wash_options.html, option 8 "Warm Stays Warm,
// Ember"). The wave's left end, and the bounce of every `source: edge` panel (10-wash.js), use it.
// A warm accent (HSL hue under 90: red, orange, amber, yellow) takes its EMBER, 12 degrees toward
// red and darker. Every other accent takes the cool end above. Why: amber (hue 36) is almost
// opposite blue, so the short way to blue runs through magenta, and the Lounge got magenta beside
// its amber. The household rejected that, and rejected the darkened accent with no turn (option 9)
// as too near the yellow. Measured OKLCH hue shift: Lounge 18 toward red; Hallway 31, Games Room 34,
// Bathroom 79, Bedroom 86 toward blue or violet.
const LAMP_CLIMATE_WARM_BELOW = 90;
function lampClimateFarEnd(c) {
  if (lampClimateHsl(c)[0] < LAMP_CLIMATE_WARM_BELOW) return lampEmber(c.join(',')).split(',').map(Number);
  return lampClimateCoolEnd(c);
}

// sRGB [r, g, b] to OKLab [L, a, b], and back. A result outside sRGB is clipped per channel.
function lampClimateLab(c) {
  const lin = function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function lampClimateFromLab(L) {
  const gam = function (v) {
    v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  };
  const l = Math.pow(L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2], 3);
  const m = Math.pow(L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2], 3);
  const s = Math.pow(L[0] - 0.0894841775 * L[1] - 1.2914855480 * L[2], 3);
  return [gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    gam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
}

// The wave's colour stops, [position, [r, g, b]]: the left colour held for the first fifth, then a
// straight, eased OKLab line to the accent.
function lampClimateWaveStops(a) {
  const c0 = lampClimateFarEnd(a), A = lampClimateLab(c0), B = lampClimateLab(a), out = [[0, c0]];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8, t = k * k * (3 - 2 * k);
    out.push([0.2 + 0.8 * k, lampClimateFromLab([0, 1, 2].map(function (j) { return A[j] + (B[j] - A[j]) * t; }))]);
  }
  return out;
}

// Draw the wave on `canvas`. o: { w, h, dpr, values, accent [r,g,b], round }.
function lampClimateWave(canvas, o) {
  const w = o.w, h = o.h, dpr = o.dpr;
  const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
  canvas.width = W; canvas.height = H;
  // willReadFrequently: the dither reads the pixels back once each draw.
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  const v = o.values, N = v.length;
  const mn = Math.min.apply(null, v), mx = Math.max.apply(null, v);
  const span = Math.max(LAMP_CLIMATE_WAVE_MIN_SPAN, mx - mn), base = (mn + mx) / 2 - span / 2;
  const P = v.map(function (x, i) {
    return [i / (N - 1) * w, LAMP_CLIMATE_WAVE_TOP + (1 - (x - base) / span) * LAMP_CLIMATE_WAVE_RISE];
  });
  const crestTop = Math.min.apply(null, P.map(function (p) { return p[1]; }));
  // A Catmull-Rom curve through the points, as cubic Beziers.
  const trace = function (c) {
    c.beginPath();
    c.moveTo(P[0][0], P[0][1]);
    for (let i = 0; i < N - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(N - 1, i + 2)];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
  };
  const a = o.accent;
  const stops = lampClimateWaveStops(a);
  // cols[1], the middle colour, is the colour of a blurred layer where the canvas has no filter.
  const cols = [stops[0][1], stops[5][1], a];
  const hues = function (c) {
    const g = c.createLinearGradient(0, 0, w, 0);
    stops.forEach(function (s) { g.addColorStop(s[0], lampClimateRgb(s[1])); });
    return g;
  };
  const fade = function (c, stops, vertical) {
    const g = vertical ? c.createLinearGradient(0, crestTop, 0, h) : c.createLinearGradient(0, 0, w, 0);
    stops.forEach(function (s) { g.addColorStop(s[0], 'rgba(255,255,255,' + s[1] + ')'); });
    return g;
  };
  // The left end fades less than until 0.103.0-dev, so that the left colour shows.
  const BODY_FADE = [[0, 0.75], [0.15, 1], [0.8, 1], [1, 0.55]];
  const LINE_FADE = [[0, 0.3], [0.12, 1], [0.75, 1], [1, 0.2]];
  const GLOW_FADE = [[0, 0.6], [0.15, 1], [0.6, 1], [1, 0.45]];
  // The glow goes to nothing before the canvas top: 0 at the top, full at 55% of the way to the crest.
  const glowTop = ctx.createLinearGradient(0, 0, 0, crestTop);
  glowTop.addColorStop(0, 'rgba(255,255,255,0)');
  glowTop.addColorStop(0.55, 'rgba(255,255,255,1)');
  glowTop.addColorStop(1, 'rgba(255,255,255,1)');
  const DOWN = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    DOWN.push([t, Math.pow(1 - t, 2.2) * 0.15 + 0.02 * (1 - t)]);
  }
  // Safari before 18 has no canvas filter. There the blurred layers use a shadow, in the middle hue.
  const filters = typeof ctx.filter === 'string';
  // One layer: draw it on its own canvas, cut it by each fade, then lay it on the wave.
  const layer = function (draw, blur, masks) {
    const t = document.createElement('canvas');
    t.width = W; t.height = H;
    const c = t.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (blur && filters) c.filter = 'blur(' + (blur * dpr).toFixed(2) + 'px)';
    draw(c, blur && !filters ? blur : 0);
    c.filter = 'none';
    masks.forEach(function (m) {
      c.globalCompositeOperation = 'destination-in';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = m;
      c.fillRect(0, 0, w, h);
    });
    ctx.drawImage(t, 0, 0);
  };
  // A blurred stroke without a filter: the shadow of a stroke drawn off the canvas.
  const strokeLine = function (c, width, alpha, shadowBlur) {
    c.lineWidth = width; c.lineCap = 'round'; c.globalAlpha = alpha;
    if (shadowBlur) {
      c.save();
      c.translate(-10000, 0);
      c.shadowOffsetX = 10000 * dpr; c.shadowBlur = shadowBlur * 2 * dpr;
      c.shadowColor = lampClimateRgb(cols[1]);
      c.strokeStyle = lampClimateRgb(cols[1]);
      trace(c); c.stroke();
      c.restore();
    } else {
      c.strokeStyle = hues(c); trace(c); c.stroke();
    }
  };
  // 0. The glow above the crest: a wide blurred stroke, with all of it under the crest cut away.
  layer(function (c, sb) {
    strokeLine(c, 18, 0.16, sb);
    c.filter = 'none'; c.globalAlpha = 1;
    c.globalCompositeOperation = 'destination-out';
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    trace(c); c.lineTo(w, h + 40); c.lineTo(0, h + 40); c.closePath(); c.fill();
    c.globalCompositeOperation = 'source-over';
  }, 7, [fade(ctx, GLOW_FADE), glowTop]);
  // 1. The haze that rises off the crest.
  layer(function (c, sb) { strokeLine(c, 18, 0.10, sb); }, 11, [fade(ctx, BODY_FADE)]);
  // 2. The body under the crest.
  layer(function (c) {
    trace(c); c.lineTo(w, h); c.lineTo(0, h); c.closePath();
    c.fillStyle = hues(c); c.fill();
  }, filters ? 1.2 : 0, [fade(ctx, DOWN, true), fade(ctx, BODY_FADE)]);
  // 3. The glow on the crest.
  layer(function (c, sb) { strokeLine(c, 3, 0.30, sb); }, 5, [fade(ctx, LINE_FADE)]);
  // 4. The crest line.
  layer(function (c) { strokeLine(c, 0.8, 0.55, 0); }, 0, [fade(ctx, LINE_FADE)]);
  // The panel's bottom corners, when this row is the panel's last.
  if (o.round) {
    // The panel's radius token, inside its 1px border. 19 when the token is not set.
    const tr = parseFloat(getComputedStyle(ctx.canvas).getPropertyValue('--lamplight-radius'));
    const r = isFinite(tr) ? Math.max(0, tr - 1) : LAMP_CLIMATE_PANEL_RADIUS;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h - r);
    ctx.arc(w - r, h - r, r, 0, Math.PI / 2);
    ctx.lineTo(r, h);
    ctx.arc(r, h - r, r, Math.PI / 2, Math.PI);
    ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  // A triangular dither of one alpha step, against banding in the faint fades.
  const im = ctx.getImageData(0, 0, W, H), d = im.data;
  let seed = (Math.random() * 4294967296) >>> 0 || 1;
  const rnd = function () { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] === 0) continue;
    d[i] = Math.max(0, Math.min(255, Math.round(d[i] + rnd() - rnd())));
  }
  ctx.putImageData(im, 0, 0);
}

// The lamplight-panel that holds `el`, through shadow roots.
function lampClimatePanelOf(el) {
  let p = el;
  for (let i = 0; i < 16 && p; i++) {
    p = p.parentNode || p.host;
    if (p && p.tagName === 'LAMP-PANEL') return p;
  }
  return null;
}

class LampClimate extends HTMLElement {

  static getStubConfig() {
    return { temperature: '', humidity: '' };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (!config.temperature) throw new Error('lamplight-climate needs a `temperature`');
    this._config = config;
    this._temperature = config.temperature;
    this._humidity = config.humidity || null;
    this._accent = lampClimateTriple(lampColour(config.accent || LAMP_PALETTE.cornflower.soft, 'soft'));
    this._range = config.comfort_range || LAMP_CLIMATE_RANGE;
    this._colors = Object.assign({}, LAMP_CLIMATE_COLORS, config.comfort_colors || {});
    this._words = Object.assign({}, LAMP_CLIMATE_WORDS, config.comfort_words || {});
    this._ramp = lampOpt('climate', config, 'humidity_range');
    this._humColors = config.humidity_colors || LAMP_CLIMATE_HUMIDITY_COLORS;
    this._damp = Array.isArray(config.damp_range) && config.damp_range.length === 2 ? config.damp_range : lampDefault('climate', 'damp_range');
    const ink = lampClimateMix([255, 255, 255], this._accent, LAMP_CLIMATE_ICON_TINT);
    const icon = function (v) { return v ? lampClimateTriple(lampColour(v, 'soft')) : ink; };
    this._high = icon(config.hot_icon_color);
    this._low = icon(config.cold_icon_color);
    this._drop = icon(config.humid_icon_color);
    this._wave = lampOpt('climate', config, 'show_wave') !== false;
    this._tap = config.tap_action || { action: 'more-info' };
    this._key = null;
    this._day = null;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._startDay();
    this._update();
  }

  // Re-arm in connectedCallback: Home Assistant detaches and re-attaches cards during a render.
  connectedCallback() {
    if (this._hass) this._startDay();
    if (this._ro && this._card) this._ro.observe(this._card);
  }
  disconnectedCallback() {
    clearInterval(this._dayTimer); this._dayTimer = null;
    if (this._ro) this._ro.disconnect();
  }

  getCardSize() { return 3; }

  // ---- the card -----------------------------------------------------------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    const self = this;
    this.style.display = 'block';

    const card = document.createElement('ha-card');
    this._card = card;
    [['background', 'transparent'],
     ['backdrop-filter', 'none'],
     ['-webkit-backdrop-filter', 'none'],
     ['border', 'none'],
     ['border-radius', '0'],
     ['box-shadow', 'none'],
     ['padding', '0 16px ' + (this._wave ? LAMP_CLIMATE_WAVE_PAD : 14) + 'px'],
     ['box-sizing', 'border-box'],
     ['display', 'block'],
     ['position', 'relative']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    card.style.setProperty('font-family', 'var(--primary-font-family, Roboto, Noto, sans-serif)');
    card.style.setProperty('line-height', 'normal');
    if (this._tap.action !== 'none') card.style.cursor = 'pointer';

    // ---- the wave, under everything
    this._canvas = null;
    if (this._wave) {
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;left:0;right:0;bottom:0;width:100%;height:' + LAMP_CLIMATE_WAVE_H +
        'px;pointer-events:none;z-index:0;display:block';
      card.appendChild(cv);
      this._canvas = cv;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'position:relative;z-index:1;display:grid;grid-template-columns:1fr auto;column-gap:16px;align-items:center';

    // ---- the left: the number, its glow, and the comfort word under it
    const left = document.createElement('div');
    left.style.cssText = 'position:relative;min-width:0';
    this._pool = document.createElement('div');
    this._pool.style.cssText = 'position:absolute;left:-14px;top:6px;width:230px;height:96px;pointer-events:none';
    left.appendChild(this._pool);
    this._tWrap = document.createElement('div');
    this._tWrap.style.cssText = 'position:relative';
    left.appendChild(this._tWrap);
    // The word in its colour is the mark: no box (0.90.0-dev). 12px, the state step: under the numeral
    // the 15px name step read as too large (household, 14 Nov 2026, 0.102.0-dev), and the 14px body
    // step still read as a little large (household, 14 Nov 2026, 0.112.0-dev).
    this._word = document.createElement('div');
    this._word.style.cssText = 'position:relative;margin-top:10px;font-size:var(--lamplight-t-state);font-weight:500;line-height:1;white-space:nowrap';
    left.appendChild(this._word);
    grid.appendChild(left);

    // ---- the right: the readings, one table
    // Option B "one size down, lighter" (household, 14 Nov 2026, 0.106.0-dev; probe in
    // design-docs/climate_row_text_sizes/). The figures are 15px at weight 400 on 18px lines; the
    // icons and the 9px row gap stay, so the table is 72px tall. Until 0.104.0-dev the figures were
    // 17px at weight 500: a 78px table, heavier than the 36px numeral at weight 300 beside it.
    // Option C (0.105.0-dev: 3px row gap, smaller icons, a 60px table) was live for one hour; the
    // household changed to B. The labels stay 11px.
    const table = document.createElement('div');
    table.style.cssText = 'display:grid;grid-template-columns:26px auto auto;column-gap:10px;row-gap:9px;align-items:center';
    this._cells = {};
    const names = this._humidity ? ['hum', 'hi', 'lo'] : ['hi', 'lo'];
    names.forEach(function (k) {
      const glyph = document.createElement('div');
      glyph.style.cssText = 'display:flex;justify-content:center;align-items:center;line-height:0';
      const fig = document.createElement('div');
      fig.style.cssText = 'font-size:var(--lamplight-t-name);font-weight:400;letter-spacing:-0.01em;line-height:18px;text-align:right;' +
        'font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--lamplight-ink-strong)';
      const lab = document.createElement('div');
      lab.style.cssText = 'font-size:var(--lamplight-t-caption);line-height:14px;white-space:nowrap;' +
        'font-variant-numeric:tabular-nums;color:var(--lamplight-ink-quiet)';
      table.appendChild(glyph); table.appendChild(fig); table.appendChild(lab);
      self._cells[k] = { glyph: glyph, fig: fig, lab: lab };
    });
    grid.appendChild(table);
    card.appendChild(grid);
    this.shadowRoot.appendChild(card);

    card.addEventListener('click', function () { self._tapRow(); });

    // Draw the wave again when the row changes size.
    if (this._ro) this._ro.disconnect();
    this._ro = null;
    if (this._wave && typeof ResizeObserver === 'function') {
      this._ro = new ResizeObserver(function () {
        clearTimeout(self._waveWait);
        self._waveWait = setTimeout(function () { self._paintWave(); }, LAMP_REDRAW_WAIT);
      });
      if (this.isConnected) this._ro.observe(card);
    }
  }

  _tapRow() {
    const a = this._tap;
    if (a.action === 'none') return;
    if (a.action === 'navigate' && a.navigation_path) {
      history.pushState(null, '', a.navigation_path);
      this.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }));
      return;
    }
    if (a.action === 'call-service' || a.action === 'perform-action') {
      const bits = (a.perform_action || a.service || '').split('.');
      if (bits.length === 2 && this._hass) {
        this._hass.callService(bits[0], bits[1], a.data || {}, a.target || {});
      }
      return;
    }
    const ev = new Event('hass-more-info', { bubbles: true, composed: true });
    ev.detail = { entityId: a.entity || this._temperature };
    this.dispatchEvent(ev);
  }

  // ---- the last 24 hours -----------------------------------------------------

  _startDay() {
    if (this._dayTimer || !this.isConnected) return;
    const self = this;
    this._fetchDay();
    this._dayTimer = setInterval(function () { self._fetchDay(); }, LAMP_CLIMATE_REFETCH_MS);
  }

  async _fetchDay() {
    if (!this._hass) return;
    try {
      this._day = await lampClimateDay(this._hass, this._temperature, Date.now());
    } catch (e) {
      // Keep the last good figures; the next tick tries again.
    }
    this._key = null;
    this._update();
  }

  // ---- the state ------------------------------------------------------------

  _number(id) {
    const s = this._hass.states[id];
    const v = s ? parseFloat(s.state) : NaN;
    return isNaN(v) ? null : v;
  }

  _stateKey() {
    const t = this._hass.states[this._temperature];
    const h = this._humidity ? this._hass.states[this._humidity] : null;
    return (t ? t.state + ':' + t.last_changed : '-') + '|' +
           (h ? h.state + ':' + h.last_changed : '-');
  }

  _update() {
    if (!this._hass || !this._card) return;
    const key = this._stateKey();
    if (key === this._key) return;
    this._key = key;
    this._paintTemperature();
    this._paintComfort();
    this._paintReadings();
    this._paintWave();
  }

  // The comfort state as { word, colour [r,g,b] }. Reads the raw sensor state, not `_number`'s
  // null - see the note at the top of this file.
  _comfort() {
    const s = this._hass.states[this._temperature];
    const t = s ? parseFloat(s.state) : NaN;
    const lo = this._range[0], hi = this._range[1];
    const k = t < lo ? 'cool' : (t > hi ? 'warm' : 'comfortable');
    return { word: this._words[k], colour: lampClimateTriple(this._colors[k]) };
  }

  _paintTemperature() {
    const v = this._number(this._temperature);
    const c = this._accent;
    this._tWrap.innerHTML = '';
    const num = document.createElement('div');
    num.style.cssText = 'font-size:var(--lamplight-t-display);font-weight:300;letter-spacing:-0.02em;line-height:1;' +
      'font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--lamplight-ink-strong)';
    // The bloom: the light comes from the digits.
    num.style.textShadow = '0 0 10px ' + lampClimateRgb(c, 0.22) + ', 0 0 28px ' + lampClimateRgb(c, 0.10);
    num.textContent = v === null ? '--' : v.toFixed(1);
    const unit = document.createElement('i');
    unit.style.cssText = 'font-style:normal;font-size:var(--lamplight-t-body);font-weight:400;letter-spacing:0;' +
      'color:var(--lamplight-ink-quiet);margin-left:3px';
    unit.textContent = '°C';
    num.appendChild(unit);
    this._tWrap.appendChild(num);
    // The pool under the number: an eased fall over seven stops, 6.5% at the centre.
    const pool = [[0, 0.065], [0.18, 0.055], [0.36, 0.038], [0.54, 0.022], [0.72, 0.010], [0.88, 0.003], [1, 0]]
      .map(function (s) { return lampClimateRgb(c, s[1]) + ' ' + (s[0] * 100) + '%'; }).join(',');
    this._pool.style.background = 'radial-gradient(ellipse closest-side at 38% 50%,' + pool + ')';
  }

  _paintComfort() {
    const k = this._comfort();
    this._word.textContent = k.word;
    this._word.style.color = lampClimateRgb(k.colour);
  }

  // The low and the high, with a new reading taken in.
  _extremes() {
    const v = this._number(this._temperature), now = Date.now();
    let lo = this._day ? Object.assign({}, this._day.lo) : null;
    let hi = this._day ? Object.assign({}, this._day.hi) : null;
    if (v !== null) {
      if (!lo || v < lo.v) lo = { v: v, t: now };
      if (!hi || v > hi.v) hi = { v: v, t: now };
    }
    return { lo: lo, hi: hi };
  }

  _paintReadings() {
    const x = this._extremes();
    const put = function (cell, r, word, glyph) {
      cell.glyph.innerHTML = glyph;
      cell.fig.textContent = r ? r.v.toFixed(1) + '°' : '--';
      cell.lab.textContent = r && this._day ? word + ' · ' + lampClimateHM(r.t) : word;
    }.bind(this);
    put(this._cells.hi, x.hi, 'high', lampClimateSun(this._high, 18));
    put(this._cells.lo, x.lo, 'low', lampClimateFrost(this._low, 17));
    if (this._cells.hum) {
      const h = this._number(this._humidity);
      const c = this._cells.hum;
      const col = h === null ? [255, 255, 255] : lampClimateHumidityRgb(h, this._ramp, this._humColors);
      c.glyph.innerHTML = lampClimateDrop(this._drop, 17);
      // The drop glows from the damp band's top end, as the sheet's drop does.
      c.glyph.style.filter = h !== null && h >= this._damp[1] ? 'drop-shadow(0 0 3px ' + lampClimateRgb(this._drop, 0.45) + ')' : 'none';
      // A whole number, as on the Rooms row and the pop-up (critique F20, 31 Oct 2026).
      c.fig.textContent = h === null ? '--' : Math.round(h) + '%';
      c.fig.style.color = h === null ? 'rgba(255,255,255,0.30)' : lampClimateRgb(col);
      c.lab.textContent = 'humidity';
    }
  }

  _paintWave() {
    const cv = this._canvas;
    if (!cv || !this._hass) return;
    if (!this._day || !this._day.rows.length) {
      const c = cv.getContext('2d', { willReadFrequently: true });
      if (c) c.clearRect(0, 0, cv.width, cv.height);
      return;
    }
    const w = this._card.getBoundingClientRect().width;
    if (w < 10) return;
    // Round the corners only when this row is the last in its panel.
    const panel = lampClimatePanelOf(this);
    const pb = panel ? panel.getBoundingClientRect().bottom : null;
    const round = pb !== null && Math.abs(pb - this._card.getBoundingClientRect().bottom) < 3;
    lampClimateWave(cv, {
      w: w, h: LAMP_CLIMATE_WAVE_H, dpr: window.devicePixelRatio || 1,
      values: lampClimateWaveValues(this._day, Date.now(), this._number(this._temperature)),
      accent: this._accent, round: round
    });
  }
}

customElements.define('lamplight-climate', LampClimate);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-climate',
  name: 'Lamplight Climate Row',
  description: 'A room header: the temperature and its comfort word, the humidity, the low and high of the last 24 hours, and a wave of the day.',
  preview: false
});
