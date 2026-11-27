// THE RAIN RIBBON (option 4 of design-docs/weather_rain_ribbon_options.html, 1 Nov 2026).
//
// lamplight-weather and lamplight-day draw the chance of rain with this one function. Until this date
// each card drew its own polygon: two blues, two scales, straight lines and no time marks.
//
// The curve is a monotone cubic through the hourly values. It cannot overshoot, so a value
// between two hours is never higher than the higher hour. The top edge carries the value: its
// alpha follows its height, so a dry hour is a faint floor line and a peak is bright. The fill
// under it is faint. The household ruled on 1 Nov 2026 that this edge is a mark, not a stroke
// in the sense of the line-free rule (§11).
//
// The baseline is the zero of the scale. A tick and a label mark each hour that is a multiple
// of 3. The first label is NOW and the last is the end hour. An inner label that comes within
// LAMP_RIB_END px of either end is dropped with its tick. The phone draws text about 15% wider.
//
// The SVG is drawn at the real pixel width, not stretched from a viewBox. A stretched edge
// would be thicker on the slopes than on the flat. So the caller passes the width it measured.
//
//   ps     chance of rain for each hour, 0 to 100
//   hours  the clock hour of each value, 0 to 23
//   ends   the text of the first and the last label
//   W, H   the width and the height of the plot in px
//   wet    [[i0, i1], ...] hour indexes to mark with a bar on the baseline (lamplight-day only)
//   glow   true adds a soft glow under the edge (both cards pass true, 16 Nov 2026)
//
// THE GLOW. A blurred copy of the edge sits under it. Its alpha follows the height on a
// steeper gradient than the edge: it is LAMP_RIB_GLOW.a at the top, and zero from
// LAMP_RIB_GLOW.zero of the way down to the baseline. So a dry hour has no glow and a likely
// hour has the most. The glow shows the chance of rain; it is not decoration (Law 02.6).
//
// It returns the plot and the scale as HTML. The caller styles `.lr-scale span`.
const LAMP_RAIN_BLUE = '90,186,238';
const LAMP_RIB_END = 42;
const LAMP_RIB_GLOW = { a: 0.55, zero: 0.8, blur: 2, width: 3 };   // household chose "55" over "75", 16 Nov 2026
let lampRibId = 0;

function lampRibCurve(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  if (n === 1) return 'M0,' + ys[0];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  // Fritsch-Carlson: limit the tangents so that no segment overshoots.
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  const f = function (v) { return v.toFixed(2); };
  let p = 'M' + f(xs[0]) + ',' + f(ys[0]);
  for (let i = 0; i < n - 1; i++) {
    const h = xs[i + 1] - xs[i];
    p += 'C' + f(xs[i] + h / 3) + ',' + f(ys[i] + m[i] * h / 3) + ' ' +
      f(xs[i + 1] - h / 3) + ',' + f(ys[i + 1] - m[i + 1] * h / 3) + ' ' + f(xs[i + 1]) + ',' + f(ys[i + 1]);
  }
  return p;
}

// The glow's gradient and blur. The filter region is in px and reaches 4 blur radii past
// the plot on each side, so the blur is not cut at the plot edge.
function lampRibGlowDefs(id, W, H, top, base) {
  const G = LAMP_RIB_GLOW, B = LAMP_RAIN_BLUE, m = 4 * G.blur;
  return "<linearGradient id='" + id + "g' gradientUnits='userSpaceOnUse' x1='0' y1='" + top + "' x2='0' y2='" + base + "'>" +
    "<stop offset='0' stop-color='rgb(" + B + ")' stop-opacity='" + G.a + "'/>" +
    "<stop offset='" + G.zero + "' stop-color='rgb(" + B + ")' stop-opacity='0'/></linearGradient>" +
    "<filter id='" + id + "b' filterUnits='userSpaceOnUse' x='" + (-m) + "' y='" + (-m) + "' width='" + (W + 2 * m) +
    "' height='" + (H + 2 * m) + "'><feGaussianBlur stdDeviation='" + G.blur + "'/></filter>";
}

function lampRibbon(ps, hours, ends, W, H, wet, glow) {
  const n = ps.length;
  if (n < 2 || !(W > 0)) return '';
  const id = 'lr' + (++lampRibId);
  const B = LAMP_RAIN_BLUE, top = 2, base = H;
  const xs = ps.map(function (_, i) { return i * W / (n - 1); });
  const ys = ps.map(function (p) { return base - Math.max(0, Math.min(100, p)) / 100 * (base - top); });
  const line = lampRibCurve(xs, ys);
  const area = line + 'L' + W + ',' + base + 'L0,' + base + 'Z';

  // The labelled hours: the two ends, and each multiple of 3 clear of them.
  const marks = [0];
  for (let i = 1; i < n - 1; i++) {
    if (hours[i] % 3 === 0 && xs[i] >= LAMP_RIB_END && W - xs[i] >= LAMP_RIB_END) marks.push(i);
  }
  marks.push(n - 1);

  let s = "<svg xmlns='http://www.w3.org/2000/svg' width='" + W + "' height='" + H + "' viewBox='0 0 " + W + ' ' + H +
    "' style='display:block;overflow:visible'><defs>" +
    "<linearGradient id='" + id + "f' gradientUnits='userSpaceOnUse' x1='0' y1='" + top + "' x2='0' y2='" + base + "'>" +
    "<stop offset='0' stop-color='rgb(" + B + ")' stop-opacity='.34'/>" +
    "<stop offset='1' stop-color='rgb(" + B + ")' stop-opacity='.03'/></linearGradient>" +
    "<linearGradient id='" + id + "e' gradientUnits='userSpaceOnUse' x1='0' y1='" + top + "' x2='0' y2='" + base + "'>" +
    "<stop offset='0' stop-color='rgb(" + B + ")' stop-opacity='.95'/>" +
    "<stop offset='.7' stop-color='rgb(" + B + ")' stop-opacity='.5'/>" +
    "<stop offset='1' stop-color='rgb(" + B + ")' stop-opacity='.22'/></linearGradient>" +
    (glow ? lampRibGlowDefs(id, W, H, top, base) : '') + '</defs>' +
    "<line x1='0' y1='" + (base - 0.5) + "' x2='" + W + "' y2='" + (base - 0.5) + "' stroke='rgba(255,255,255,.14)' stroke-width='1'/>";
  marks.forEach(function (i) {
    s += "<line x1='" + xs[i].toFixed(2) + "' y1='" + base + "' x2='" + xs[i].toFixed(2) + "' y2='" + (base + 3) +
      "' stroke='rgba(255,255,255,.30)' stroke-width='1'/>";
  });
  s += "<path d='" + area + "' fill='url(#" + id + "f)'/>" +
    (glow ? "<path d='" + line + "' fill='none' stroke='url(#" + id + "g)' stroke-width='" + LAMP_RIB_GLOW.width +
      "' stroke-linejoin='round' stroke-linecap='round' filter='url(#" + id + "b)'/>" : '') +
    "<path d='" + line + "' fill='none' stroke='url(#" + id + "e)' stroke-width='1.5' stroke-linejoin='round' stroke-linecap='round'/>";
  (wet || []).forEach(function (r) {
    s += "<rect x='" + xs[r[0]].toFixed(2) + "' y='" + (base - 1.5) + "' width='" + Math.max(3, xs[r[1]] - xs[r[0]]).toFixed(2) +
      "' height='2' rx='1' fill='rgb(" + B + ")'/>";
  });
  s += '</svg>';

  let lab = '';
  marks.forEach(function (i, k) {
    const txt = k === 0 ? ends[0] : k === marks.length - 1 ? ends[1] : String(hours[i]).padStart(2, '0') + ':00';
    const pos = k === 0 ? 'left:0' : k === marks.length - 1 ? 'right:0'
      : 'left:' + xs[i].toFixed(1) + 'px;transform:translateX(-50%)';
    lab += "<span style='" + pos + (txt === 'NOW' ? ';letter-spacing:.12em' : '') + "'>" + txt + '</span>';
  });
  return "<div class='lr-plot' style='height:" + H + "px'>" + s + '</div>' +
    "<div class='lr-scale' style='position:relative'>" + lab + '</div>';
}
