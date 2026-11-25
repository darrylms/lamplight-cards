// The light. Two geometries carry every panel.
//
// ACTIVITY  five painted layers and a rim. The source stands at the centre of
//           gravity of the active rows and gets brighter with the fraction that
//           is active. For a panel whose state is a fraction of things active.
//
//   a (wash peak) = 0.11 + 0.19 * f    ->  0.11 .. 0.30
//   b (rim)       = 0.19 + 0.16 * f    ->  0.19 .. 0.35
//   c  = mean over the active rows i of n of (i + 0.5) / n
//   py = clamp(c, 0.12, 0.88)          ->  12% when nothing is active
//
// ACCENT    one source above the top-right corner, off the card, and a rim that
//           repeats the same ellipse. For a panel that shows a reading and has
//           no fraction to measure. The rim alpha either holds at 0.30 or comes
//           from the fraction, which gives the third behaviour: the fill holds
//           and the rim reads the state. Every accent panel also draws the
//           bounce of the activity family, at lampBounceAlpha(f) (0.048 + 0.018 f).
//           Since 1 Oct 2026 this includes Climate, the Overview foot panels and
//           Waste (which forces this family), which have no f and sit at 0.048. Before that (1 Oct 2026,
//           design-docs/card_bounce_options.html, option 1) only a panel with
//           entities had it, at a * 0.22.
//
// Do not add a third ramp. If a panel's activity is not a fraction, write it as
// one (count / total), or give it the accent geometry.
//
// Every layer fades to rgba(r,g,b,0), never to `transparent`. The keyword means
// rgba(0,0,0,0) and CSS mixes premultiplied, so a fade to it goes through grey.
//
// The ground is a gradient, never a background-color. background-color paints
// behind the border-box layer and hides the rim.
//
// The browser rounds each layer to 8 bits before it composites the next one,
// and five layers of small alpha over a dark ground add these errors into a
// visible band. LampShell (20-shell.js) fixes this: it composites the
// padding-box layers again on a canvas, in decimals, adds one dither, and
// rounds once. Proved 26 Sep 2026, test/probe-canvas-wash.js.

// The folder that holds lamplight.js: /local/ for a manual install,
// /hacsfiles/lamplight-cards/ through HACS. Read once, while the file loads.
// Do not use import.meta here: tools/check_build.js compiles the file with
// vm.Script, which refuses it, and deploy.py then refuses the upload.
const LAMP_SKY_BASE = (function () {
  try {
    const m = /(https?:\/\/[^\s'"()]+\/)[^\/\s'"()]+\.js(?:\?[^\s'"():]*)?/.exec(new Error().stack || '');
    return m ? new URL(m[1]).pathname : '/local/';
  } catch (e) { return '/local/'; }
})();

// The tile ships with the cards, in dist/, beside lamplight.js. On a manual install
// the folder is /local/, so the address stays /local/panel-grain.png.
const LAMP_GRAIN = LAMP_SKY_BASE + 'panel-grain.png';

// Jinja `round` uses Python `round`, which rounds a half to the even digit.
// The live styles were made by Jinja, so this does the same.
function lampRound(v, n) {
  const p = Math.pow(10, n);
  const x = v * p;
  const fl = Math.floor(x);
  // An exact half goes to the even digit, which is what Python does. The test
  // must be exact: 0.297 * 0.35 * 10000 is 1039.4999999999998, and Python
  // rounds it down. An epsilon here makes it a tie and rounds it up, which
  // moved one rim stop by 0.0001 against the live card.
  const r = (x - fl === 0.5) ? ((fl % 2 === 0) ? fl : fl + 1) : Math.round(x);
  return r / p;
}

// Write a number the way Jinja writes a float: no trailing zeros.
function lampNum(v) {
  return String(Number(v.toFixed(6)));
}

// Read the fraction active, and where the light stands.
function lampActivity(hass, entities, onStates) {
  const E = Array.isArray(entities) ? entities : [];
  const on = onStates || ['on'];
  let s = 0, n = 0;
  E.forEach((e, i) => {
    const st = hass && hass.states[e];
    if (st && on.indexOf(st.state) >= 0) { s += (i + 0.5) / E.length; n += 1; }
  });
  const f = E.length ? n / E.length : 0;
  const L = LAMP_DEFAULTS.shell.light.activity;
  return {
    f: f,
    n: n,
    a: lampRound(lampRamp(L.glow_strength, f), 3),
    b: lampRound(lampRamp(L.edge_strength, f), 3),
    py: lampRound(100 * (n === 0 ? L.glow_position[0] / 100
      : Math.min(Math.max(s / n, L.glow_position[0] / 100), L.glow_position[1] / 100)), 1)
  };
}

// MACH BAND FIX (0.17.6-dev, 26 Sep 2026).
//
// A wash layer fades in straight lines between its 2-5 stops, because CSS
// interpolates alpha in straight lines. The slope changes suddenly at each
// stop, and the eye reads the sudden change as a band. On the Waste card it
// was an oval at the top right: layer 1 ends (100%) on almost the same
// ellipse as layer 2's 38% stop, so the two sudden slopes add.
//
// lampSmoothStops puts a monotone cubic (Fritsch-Carlson) through a layer's
// own stops, flat at the last one so the fade still lands at its old alpha,
// and adds 16 evenly spaced samples between the first and last stop. It keeps
// every original stop at its own position and alpha, so master_design.html
// section 05's mid stop ratio does not move. Proved in
// lamplight-cards/test/probe-smooth-stops.js: the largest sudden slope
// change on the Waste card fell from 0.232 to 0.095 levels per pixel, with
// 16 stops and a flat end. Without the flat end there is no gain.
//
// The rim (the border-box layer) keeps its straight lines. It is thin and the
// household did not ask for it to change; the fix is for the wide padding-box
// wash only.
function lampSmoothCurve(xs, ys) {
  const n = xs.length;
  if (n < 2) return function () { return ys[0]; };
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  for (let i = 1; i < n - 1; i++) m[i] = (d[i - 1] * d[i] <= 0) ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
  m[n - 1] = 0;                        // flat end: the fade still lands on the last stop
  for (let i = 0; i < n - 1; i++) {    // Fritsch-Carlson limit
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return function (x) {
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] +
           (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}

// Add 16 samples of that curve to one layer's stops. `stops` is
// [[colour, alpha, position], ...], sorted by position, one colour per
// layer. Returns the union of the original positions and the 16 samples,
// sorted, with the original alpha kept exactly at its own position.
function lampSmoothStops(stops, n) {
  n = n || 16;
  if (stops.length < 2) return stops.slice();
  const xs = stops.map(function (s) { return s[2]; });
  const ys = stops.map(function (s) { return s[1]; });
  const c = stops[0][0];
  const curve = lampSmoothCurve(xs, ys);
  const x0 = xs[0], x1 = xs[xs.length - 1];
  const out = stops.map(function (s) { return [s[0], s[1], s[2]]; });
  const have = xs.map(function (x) { return lampRound(x, 4); });
  for (let k = 0; k < n; k++) {
    const x = x0 + (x1 - x0) * k / (n - 1);
    const key = lampRound(x, 4);
    if (have.indexOf(key) >= 0) continue;      // an original stop already sits here
    have.push(key);
    out.push([c, Math.max(0, lampRound(curve(x), 4)), key]);
  }
  out.sort(function (a, b) { return a[2] - b[2]; });
  return out;
}

// Write one padding-box radial layer's stops as CSS. Position is a fraction
// of the box (0..1) in the layer data; CSS wants a percentage with at most
// two decimals, so it is rounded and scaled here, once.
function lampRadialCss(l) {
  // A key with "Px" after it (ryPx, cyPx) is a length in px, not a fraction of the box.
  const geom = ['rx', 'ry', 'cx', 'cy'].map(function (k) {
    if (l[k + 'Px'] !== undefined) return lampNum(l[k + 'Px']) + 'px';
    return lampNum(lampRound(l[k] * 100, 2)) + '%';
  });
  const stops = l.stops.map(function (s) {
    return 'rgba(' + s[0] + ',' + lampNum(s[1]) + ') ' + lampNum(lampRound(s[2] * 100, 2)) + '%';
  }).join(', ');
  return 'radial-gradient(' + geom[0] + ' ' + geom[1] + ' at ' + geom[2] + ' ' + geom[3] + ', ' + stops + ')';
}

// The last two layers of the activity wash: the ground and the rim. LampShell writes them alone
// while the light moves, because the moving canvas covers every other layer.
function lampActivityRim(H, b, py) {
  const B = (k) => lampNum(lampRound(b * k, 4));
  return ['linear-gradient(' + LAMP_GROUND + ', ' + LAMP_GROUND + ') padding-box',
    'radial-gradient(120% 90% at 100% ' + lampNum(py) + '%, rgba(' + H + ',' + lampNum(b) + ') 0%, rgba(' + H + ',' + B(0.35) + ') 38%, rgba(' + H + ',' + B(0.1) + ') 100%) border-box'];
}

function lampActivityWash(H, a, b, py, grain, edge, fill) {
  const L = lampActivityLayers(H, a, b, py, edge, fill);
  const layers = [];
  if (grain) layers.push('url(' + LAMP_GRAIN + ') padding-box');
  L.forEach(function (l) {
    if (!l.solid) layers.push(lampRadialCss(l) + ' padding-box');
  });
  layers.push.apply(layers, lampActivityRim(H, b, py));
  return layers.join(',\n    ');
}

// The same four padding-box layers as lampActivityWash, as numbers instead of
// a CSS string, with the smooth stops already added. The dithered canvas
// reads this; it does not parse the CSS. lampActivityWash builds its CSS
// from this same data, so the two cannot disagree.
// `edge` (the panel key `light_from: top-edge`) puts the edge sheen on top, at a x 0.35, and gives the
// bounce the far colour at a x 0.462. See THE EDGE SOURCE and THE BOUNCE OF AN EDGE PANEL.
//
// THE ROOM FILL (25 Nov 2026, design-docs/rooms_brightness_options.html, option 4 "The Even Wall").
// `fill` is the active fraction f, and only LampRooms gives it. Without it the layers are the
// same as before. Two things change with it: the shade fades by 1 - f, and one wide glow in the
// accent enters from the left at 0.11 f. Reason: the shade (a x 0.73) got darker as the
// light got brighter, so the left half of the Rooms card moved only L* 6.5 to 6.6 with every
// light on. It is now 6.5 to 11.4. The bounce keeps the family strength: three times it made
// the bottom-left corner brown (option 2). A fill over the whole card took the humidity to
// 3.55:1, so it stays on the left. At f 0 the fill layer is omitted.
const LAMP_ROOM_FILL = { alpha: 0.11, rx: 0.82, ry: 1.25, cy: 0.38, power: 1.2, stops: 24 };
function lampActivityLayers(H, a, b, py, edge, fill) {
  const C = lampCore(H), M = lampEmber(H);
  const A = (k) => lampRound(a * k, 4);
  const p = py / 100, q = lampRound(100 - py, 1) / 100;
  const sheen = edge ? [lampEdgeSheen(H, A(LAMP_EDGE_LIGHTS_SHEEN))] : [];
  return sheen.concat([
    { rx: 0.30, ry: 0.24, cx: 1, cy: p,
      stops: lampSmoothStops([[C, A(0.34), 0], [C, A(0.12), 0.55], [C, 0, 1]]) },
    { rx: 0.85, ry: 0.75, cx: 1, cy: p,
      stops: lampSmoothStops([[H, A(0.82), 0], [H, A(0.58), 0.18], [H, A(0.3), 0.38], [H, A(0.11), 0.6], [H, 0, 0.8]]) },
    edge ? lampEdgeBounce(H, A(lampRound(0.22 * LAMP_EDGE_BOUNCE, 4)))
         : { rx: 1.50, ry: 0.90, cx: 0.08, cy: 1,
             stops: lampSmoothStops([[M, A(0.22), 0], [M, 0, 0.66]]) },
    { rx: 0.90, ry: 0.70, cx: 0, cy: q,
      stops: lampSmoothStops([['0,0,0', lampRound(A(0.73) * (1 - (fill || 0)), 4), 0], ['0,0,0', 0, 0.72]]) }
  ], fill ? [{ rx: LAMP_ROOM_FILL.rx, ry: LAMP_ROOM_FILL.ry, cx: 0, cy: LAMP_ROOM_FILL.cy,
    stops: lampEasedStops(H, lampRound(LAMP_ROOM_FILL.alpha * fill, 4), LAMP_ROOM_FILL.stops, LAMP_ROOM_FILL.power) }] : [],
  [{ solid: 'ground' }]);
}

// The bounce every light panel draws (1 Oct 2026). It starts at 0.048 and
// rises 0.018 as the fraction f of things active goes from 0 to 1. 0.048 gives
// a lower half as bright as a Lights panel's. A panel with no entities, such
// as Climate, the Overview foot panels and Waste, has f = 0.
function lampBounceAlpha(f) {
  return lampRound(lampRamp(LAMP_DEFAULTS.shell.bounce_strength, f), 4);
}

// The bounce layer of an accent panel: an ember glow from the bottom left. The foot
// panels (LampFootPanel) draw the same layer under their own light.
function lampBounceLayer(H, bounce) {
  const M = lampEmber(H);
  return { rx: 1.50, ry: 0.90, cx: 0.08, cy: 1,
           stops: lampSmoothStops([[M, bounce, 0], [M, 0, 0.66]]) };
}

// The padding-box layers of lampAccentWash, as numbers. See the note above
// lampActivityLayers. `bounce` is an alpha. When it is 0 or undefined, there is
// no bounce layer.
function lampAccentLayers(H, fill, bounce) {
  const F = (k) => lampRound(fill * k, 4);
  const L = [
    { rx: 0.96, ry: 0.92, cx: 0.90, cy: -0.16,
      stops: lampSmoothStops([[H, fill, 0], [H, F(13 / 30), 0.30], [H, F(0.15), 0.52], [H, 0, 0.76]]) }
  ];
  if (bounce) L.push(lampBounceLayer(H, bounce));
  L.push({ solid: 'ground' });
  return L;
}

function lampAccentWash(H, fill, b, grain, bounce) {
  const B = (k) => lampNum(lampRound(b * k, 4));
  const L = lampAccentLayers(H, fill, bounce);
  const layers = [];
  if (grain) layers.push('url(' + LAMP_GRAIN + ') padding-box');
  L.forEach(function (l) {
    if (!l.solid) layers.push(lampRadialCss(l) + ' padding-box');
  });
  layers.push(
    'linear-gradient(' + LAMP_GROUND + ', ' + LAMP_GROUND + ') padding-box',
    'radial-gradient(96% 92% at 90% -16%, rgba(' + H + ',' + lampNum(b) + ') 0%, rgba(' + H + ',' + B(0.35) + ') 38%, rgba(' + H + ',' + B(0.1) + ') 100%) border-box'
  );
  return layers.join(',\n    ');
}

// THE EDGE SOURCE (14 Nov 2026, design-docs/climate_top_wash_options.html, option 2 "Lamp on the Edge")
// `light_from: top-edge` on an accent panel. The Climate panels use it; the other accent panels do not.
// The household compared the Climate panel with its reference image. The reference's top-right glow
// is about 1.75 times as bright at its peak, and it continues down the right side as a faint sheen.
// The accent geometry above stops at 53.9% of the card height.
//
// Two layers in the accent, over the bounce:
//   the source   62% x 123px at 84% across, 6px above the top edge. Peak 0.40 (the fill).
//   the sheen    105% x 198px at the top-right corner. Peak 0.06 (the fill x 0.15).
// Each layer falls as (1 - t)^p over dense stops (p 2.0 for the source, 1.6 for the sheen), so
// no ring shows. The rim repeats the source's ellipse (d-092) and holds at 0.30, as before.
//
// The vertical sizes are in px. They come from the Bedroom panel, 158px high. With a percentage,
// the 231px Lounge panel got a longer throw onto the readings, and "humidity" fell to 4.17:1.
// With px, every Climate panel gets the same top. The worst measured contrast is now 4.69:1
// ("humidity", Lounge). Probe: design-docs/climate_wash/top_wash_probe.js.
//
// THE OTHER PANELS (14 Nov 2026, the household's request after the build on Climate)
// Smart plugs, Windows and Waste take the same edge source. Plugs and Windows keep their rim on the
// fraction (b = 0.19 + 0.16 f); Waste keeps its configured b 0.30. The text in their top 200px stays
// at 5.25:1 or more (probe: design-docs/climate_wash/edge_all_probe.js).
// The Lights panels keep the activity wash, so the moving source still shows how many rows are lit
// and where. They take the sheen only, on top, at a x 0.35 (0.039 with nothing lit, 0.105 with
// all lit). It follows a, so it shows state too (Law 02.2). It has no corner source: a fixed bright
// corner would hide where the moving source stands. Lounge Lights, all lit: the top-right corner
// goes from 25,24,25 to 45,35,25.
// TONED DOWN (15 Nov 2026): the household found the top-right corner a little too strong.
// 0.113.0-dev set the peak to 0.34. After a side-by-side with a 0.30 probe, 0.114.0-dev set 0.30
// (25% less than 0.40). The sheen follows it (0.06 to 0.045). The rim, the bounce and the Lights
// panels do not change. The contrast can only go up. Probe and image:
// design-docs/climate_wash/edge_fill_030_probe.js, edge_030_vs_034.png.
const LAMP_EDGE_FILL = LAMP_DEFAULTS.shell.light.top_edge.glow_strength;
const LAMP_EDGE_RIM = LAMP_DEFAULTS.shell.light.top_edge.edge_strength;
const LAMP_EDGE_SHEEN = 0.15;
const LAMP_EDGE_LIGHTS_SHEEN = 0.35;

// THE BOUNCE OF AN EDGE PANEL (14 Nov 2026, the same design document, option 8 "Warm Stays Warm,
// Ember"). It is 2.1 times stronger than the family bounce: 0.10 on a reading panel with no rows
// (0.048 + 0.018 f, times 2.1), a x 0.462 on a Lights panel (0.05 .. 0.14). Its colour is the far
// colour of the Climate wave (lampClimateFarEnd, 90-climate.js): ember for a warm accent (HSL hue
// under 90), else the accent turned 45 to 100 degrees toward blue. So a panel runs from the far
// colour at the bottom left to the accent at the top right, as the reference image does, and a
// Climate panel's bounce matches the left end of its wave. The bounce moves no label by more than
// 0.1; the lowest row near it is 5.14:1 (Lounge Windows), and the lowest label on an edge panel
// stays 4.63:1, under the top light (design-docs/climate_wash/bounce_probe.js).
const LAMP_EDGE_BOUNCE = 2.1;
// TRIAL (14 Nov 2026, 0.110.0-dev): the household asked to try option 6 "Own Colour". The bounce
// is the accent itself, darkened as EMBER is (each channel x 0.79, so the hue and the HSV
// saturation stay). 'far' is option 8 above, the decision in master design 22.5 (d-163). The
// Climate wave keeps the far colour in both cases. To go back, set this to 'far'.
const LAMP_EDGE_BOUNCE_COLOUR = 'own';
function lampEdgeBounceColour(H) {
  const c = H.split(',').map(Number);
  if (LAMP_EDGE_BOUNCE_COLOUR === 'own') return c.map(function (v) { return Math.round(v * 0.79); }).join(',');
  return lampClimateFarEnd(c).join(',');
}
function lampEdgeBounce(H, alpha) {
  const M = lampEdgeBounceColour(H);
  return { rx: 1.50, ry: 0.90, cx: 0.08, cy: 1, stops: lampSmoothStops([[M, alpha, 0], [M, 0, 0.66]]) };
}

// The sheen: 105% x 198px at the top-right corner, falling as (1 - t)^1.6.
function lampEdgeSheen(H, peak) {
  return { rx: 1.05, ryPx: 198, cx: 1.0, cyPx: 0, stops: lampEasedStops(H, peak, 10, 1.6) };
}

// Stops that fall as peak * (1 - t)^p, n + 1 of them, from t 0 to 1.
function lampEasedStops(H, peak, n, p) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([H, +(peak * Math.pow(1 - t, p)).toFixed(4), +t.toFixed(4)]);
  }
  return out;
}

function lampEdgeLayers(H, fill, bounce) {
  const L = [
    { rx: 0.62, ryPx: 123, cx: 0.84, cyPx: -6, stops: lampEasedStops(H, fill, 14, 2.0) },
    lampEdgeSheen(H, lampRound(fill * LAMP_EDGE_SHEEN, 4))
  ];
  if (bounce) L.push(lampEdgeBounce(H, lampRound(bounce * LAMP_EDGE_BOUNCE, 4)));
  L.push({ solid: 'ground' });
  return L;
}

function lampEdgeWash(H, fill, b, grain, bounce) {
  const B = (k) => lampNum(lampRound(b * k, 4));
  const L = lampEdgeLayers(H, fill, bounce);
  const layers = [];
  if (grain) layers.push('url(' + LAMP_GRAIN + ') padding-box');
  L.forEach(function (l) {
    if (!l.solid) layers.push(lampRadialCss(l) + ' padding-box');
  });
  layers.push(
    'linear-gradient(' + LAMP_GROUND + ', ' + LAMP_GROUND + ') padding-box',
    'radial-gradient(62% 123px at 84% -6px, rgba(' + H + ',' + lampNum(b) + ') 0%, rgba(' + H + ',' + B(0.35) + ') 38%, rgba(' + H + ',' + B(0.1) + ') 100%) border-box'
  );
  return layers.join(',\n    ');
}

// The six things a panel may not drop: the accent, the 20px radius, the one
// shadow, the eyebrow, the rgb(19,20,24) ground, and light from the right.
//
// These go on the element as inline properties, not as a rule in a stylesheet.
// A rule in the card's own shadow root loses to the theme, although it carries
// `!important` and the theme's rule is in a different tree. Measured on the
// live instance 20 September 2026: the rule parses, it matches the element, and
// the computed background stays `none`. An inline property with `!important`
// wins. See the note in the reference.
function lampShellProps(background, radius, shadow) {
  return [
    ['border', '1px solid transparent'],
    ['background', background],
    ['border-radius', radius || 'var(--lamplight-radius, 20px)'],
    ['box-shadow', shadow || 'var(--lamplight-shadow, 0 6px 22px rgba(0,0,0,0.35))'],
    ['overflow', 'hidden'],
    ['backdrop-filter', 'none'],
    ['-webkit-backdrop-filter', 'none']
  ];
}

// The same declarations as text. Used by the tests and by a person reading the
// element in the inspector.
function lampShellCss(background, radius, shadow) {
  return lampShellProps(background, radius, shadow)
    .map(function (p) { return p[0] + ': ' + p[1] + ' !important;'; })
    .join('\n  ');
}
