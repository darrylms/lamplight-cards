// The pop-up header glyphs, drawn in line. Used by lamplight-popup (94-popup.js).
//
// THE DECISION (27 Sep 2026, design-docs/popup_sheets_rework_options.html, revision 6)
// The household chose option 3: every header glyph is an outline in the sheet's accent, 165px,
// in place of a 220px cropped MDI icon. The climate sheets use option 19 (moving air). The plug
// sheets use option 7: the device itself (access point, modem, string lights), not a socket.
// The Day Card's weather glyph is drawn in line as well, from the same geometry as the solid set
// in 65-glyphs.js.
//
// THE DRAWINGS
// Each one is in a 100 x 100 box, except the weather, which keeps the 24-unit grid of
// 65-glyphs.js and is scaled up. `F` is the accent gradient (core, accent, ember), in bounding-box
// units. A gradient in bounding-box units does not paint an element with no width or no height,
// so a straight line is never drawn alone: it shares a path with another line, or it is a rect.
//
// THE PARTS OF A PLUG GLYPH carry the class `lp-part`. The plug body tells the header its state
// (`lamp-glyph-state`), and the header dims the parts as the body used to: lit when the plug
// draws, and always lit for an access point.
//
// `shift` moves a wide drawing left, so the crop at the sheet's right edge does not cut it.

const LAMP_POPUP_GLYPHS = {
  battery: {
    mdi: 'mdi:battery',
    draw: function (F) {
      return '<rect x="25" y="17" width="50" height="76" rx="9" fill="none" stroke="' + F + '" stroke-width="3.2"/>' +
        '<rect x="40" y="7" width="20" height="8" rx="3" fill="' + F + '"/>' +
        [26, 44, 62, 80].map(function (y) {
          return '<rect x="33" y="' + (y - 1) + '" width="34" height="11" rx="2.5" fill="' + F + '" opacity="' + (y === 26 ? 0.28 : 1) + '"/>';
        }).join('');
    }
  },
  window: {
    mdi: 'mdi:window-closed-variant',
    draw: function (F) {
      return '<rect x="17" y="9" width="66" height="78" rx="4" fill="none" stroke="' + F + '" stroke-width="3.2"/>' +
        '<path d="M50 9V87M17 48H83" stroke="' + F + '" stroke-width="3.2"/>' +
        '<rect x="8" y="91" width="84" height="4" rx="2" fill="' + F + '"/>' +
        '<path d="M60 38L73 20M64 42L70 34" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>';
    }
  },
  air: {
    mdi: 'mdi:weather-windy',
    shift: -8,
    draw: function (F) {
      return '<path d="M10 36H58a11 11 0 1 0-11-11M10 52H76a11 11 0 1 1-11 11M10 68H44" fill="none" stroke="' + F +
        '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>';
    }
  },
  thermometer: {
    mdi: 'mdi:thermometer',
    draw: function (F) {
      return '<path d="M38 16a12 12 0 0 1 24 0V62a19 19 0 1 1-24 0Z" fill="none" stroke="' + F + '" stroke-width="3.2" stroke-linejoin="round"/>' +
        '<rect x="47" y="31" width="6" height="42" rx="3" fill="' + F + '"/><circle cx="50" cy="76.7" r="9" fill="' + F + '"/>' +
        '<path d="M68 20h7M68 30h5M68 40h7M68 50h5" stroke="' + F + '" stroke-width="2.4" stroke-linecap="round"/>';
    }
  },
  socket: {
    mdi: 'mdi:power-socket-uk',
    draw: function (F) {
      return '<rect x="11" y="11" width="78" height="78" rx="15" fill="none" stroke="' + F + '" stroke-width="3.2"/>' +
        '<rect x="45" y="24" width="10" height="20" rx="2" fill="' + F + '"/><rect x="24" y="58" width="20" height="10" rx="2" fill="' + F + '"/>' +
        '<rect x="56" y="58" width="20" height="10" rx="2" fill="' + F + '"/>';
    }
  },
  'access-point': {
    mdi: 'mdi:access-point',
    draw: function (F) {
      return '<path class="lp-part" d="M38.7 64.7A16 16 0 0 1 61.3 64.7M28.8 54.8A30 30 0 0 1 71.2 54.8M18.9 44.9A44 44 0 0 1 81.1 44.9" fill="none" stroke="' + F +
        '" stroke-width="3.4" stroke-linecap="round"/><circle cx="50" cy="76" r="6.5" fill="' + F + '"/>';
    }
  },
  modem: {
    mdi: 'mdi:router-network',
    draw: function (F) {
      return '<rect x="17" y="44" width="66" height="32" rx="9" fill="none" stroke="' + F + '" stroke-width="3.2"/>' +
        '<path d="M34 44V28M66 44V28" stroke="' + F + '" stroke-width="3.2" stroke-linecap="round"/>' +
        [36, 50, 64].map(function (x) { return '<circle class="lp-part" cx="' + x + '" cy="60" r="4.4" fill="' + F + '"/>'; }).join('');
    }
  },
  'string-lights': {
    mdi: 'mdi:string-lights',
    draw: function (F) {
      return '<path d="M6 30Q50 68 94 30" fill="none" stroke="' + F + '" stroke-width="2.6" stroke-linecap="round"/>' +
        [[15, 47.5], [32.5, 57], [50, 60], [67.5, 57], [85, 47.5]].map(function (p) {
          return '<ellipse class="lp-part" cx="' + p[0] + '" cy="' + p[1] + '" rx="5" ry="7" fill="' + F + '"/>';
        }).join('');
    }
  },
  // The air purifier (24 Oct 2026, design-docs/air_purifier_options.html): a tall cabinet, the
  // round outlet grille on its face, and the intake slots below it. Static: it draws no state.
  purifier: {
    mdi: 'mdi:air-purifier',
    draw: function (F) {
      return '<rect x="27" y="8" width="46" height="84" rx="10" fill="none" stroke="' + F + '" stroke-width="3.2"/>' +
        '<circle cx="50" cy="36" r="14" fill="none" stroke="' + F + '" stroke-width="3.2"/>' +
        '<circle cx="50" cy="36" r="5" fill="' + F + '"/>' +
        '<path d="M38 62H62M38 70H62M38 78H62" stroke="' + F + '" stroke-width="3.2" stroke-linecap="round"/>';
    }
  }
};

// The weather glyph in line, on the 24-unit grid of 65-glyphs.js. The back cloud is cut where
// the front cloud covers it, and so is a sun or a moon behind the cloud: an outline that runs on
// behind another outline reads as a knot. `mid` is an id for that mask, unique to the card.
function lampPopupWeatherLine(key, F, mid) {
  const W = 0.8;
  const st = function (d, w) {
    return '<path d="' + d + '" fill="none" stroke="' + F + '" stroke-width="' + (w || W) +
      '" stroke-linecap="round" stroke-linejoin="round"/>';
  };
  const fill = function (d) { return '<path d="' + d + '" fill="' + F + '"/>'; };
  const tr = function (p) { return 'translate(' + p[1] + ',' + p[2] + ') scale(' + p[0] + ')'; };
  const rays = function (cx, cy, r0, r1) {
    let d = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      d += 'M' + (cx + Math.cos(a) * r0).toFixed(2) + ' ' + (cy + Math.sin(a) * r0).toFixed(2) +
           'L' + (cx + Math.cos(a) * r1).toFixed(2) + ' ' + (cy + Math.sin(a) * r1).toFixed(2);
    }
    return d;
  };
  const flake = function (x, y, r) {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3;
      d += 'M' + (x - Math.cos(a) * r).toFixed(2) + ' ' + (y - Math.sin(a) * r).toFixed(2) +
           'L' + (x + Math.cos(a) * r).toFixed(2) + ' ' + (y + Math.sin(a) * r).toFixed(2);
    }
    return d;
  };
  // back and front: [scale, x, y], the same pairs as lampCloudUp, lampCloudMid and lampCloudLow.
  // `behind` (a sun or a moon) is cut by both clouds; the back cloud is cut by the front one.
  const cut = function (id, list) {
    return '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32">' +
      '<rect x="-4" y="-4" width="32" height="32" fill="#fff"/>' + list.map(function (c) {
        return '<g transform="' + tr(c) + '"><path d="' + LAMP_CLOUD + '" fill="#000" stroke="#000" stroke-width="' +
          (W * 2.6 / c[0]).toFixed(2) + '"/></g>';
      }).join('') + '</mask>';
  };
  const clouds = function (back, front, behind) {
    return cut(mid, [front]) + (behind ? cut(mid + 'b', [back, front]) + '<g mask="url(#' + mid + 'b)">' + behind + '</g>' : '') +
      '<g mask="url(#' + mid + ')"><g transform="' + tr(back) + '">' + st(LAMP_CLOUD, (W / back[0]).toFixed(2)) + '</g></g>' +
      '<g transform="' + tr(front) + '">' + st(LAMP_CLOUD, (W / front[0]).toFixed(2)) + '</g>';
  };
  const UP = [[0.62, 8.2, -1.0], [0.92, -0.5, -0.4]];
  const MID = [[0.62, 8.2, 0.6], [0.92, -0.5, 1.2]];
  const LOW = [[0.54, 7.0, 3.4], [0.78, -0.8, 4.4]];
  const up = function () { return clouds(UP[0], UP[1]); };
  const drops = function (list) {
    return fill(list.map(function (p) { return lampDrop(p[0], p[1], p[2]); }).join(''));
  };
  switch (key) {
    case 'sunny':
      return '<circle cx="12" cy="12" r="5" fill="none" stroke="' + F + '" stroke-width="' + W + '"/>' + st(rays(12, 12, 7.4, 10.2));
    case 'clear-night':
      return st(LAMP_MOON);
    case 'partlycloudy-day':
      return clouds(LOW[0], LOW[1], '<circle cx="16.8" cy="7" r="3.3" fill="none" stroke="' + F + '" stroke-width="' + W + '"/>' +
        st(rays(16.8, 7, 4.9, 6.6)));
    case 'partlycloudy-night':
      return clouds(LOW[0], LOW[1], '<g transform="translate(10.2,1.4) scale(.46)">' + st(LAMP_MOON, (W / 0.46).toFixed(2)) + '</g>');
    case 'cloudy':
      return clouds(MID[0], MID[1]);
    case 'fog':
      return up() + st('M5.1 17.7H17.5M7.7 20.9H17.1');
    case 'windy':
      return st('M2.6 8h11.6a2.9 2.9 0 1 0-2.9-2.9M2.2 13.6h15a2.6 2.6 0 1 1-2.6 2.6M3.6 21.4h8.4', 0.9);
    case 'rainy':
      return up() + drops([[8.2, 16.4], [12.2, 17.7], [16.2, 16.4]]);
    case 'pouring':
      return up() + drops([[7.2, 16.1], [10.4, 17.7], [13.6, 16.1], [16.8, 17.7], [12, 20.3]]);
    case 'hail':
      return up() + drops([[8.2, 16.5]]) + '<circle cx="13" cy="17.9" r="2.1" fill="' + F + '"/><circle cx="17.3" cy="20.9" r="1.75" fill="' + F + '"/>';
    case 'snowy':
      return up() + st(flake(8.2, 17.8, 2.05) + flake(12.4, 20.6, 2.05) + flake(16.3, 17.5, 2.05), 0.75);
    case 'snowy-rainy':
      return up() + drops([[8.6, 16.6, 1.25]]) + st(flake(15.8, 18.6, 2.8), 0.85);
    case 'lightning':
      return up() + fill(LAMP_BOLT);
    case 'lightning-rainy':
      return up() + fill(LAMP_BOLT) + drops([[6.9, 16.4], [18.3, 16.4]]);
    case 'exceptional':
      return st(LAMP_ALERT_EDGE) + '<path d="M11.05 10.9h1.9v5.5h-1.9z M11.05 17.8h1.9v1.9h-1.9z" fill="' + F + '"/>';
    default:
      return clouds(MID[0], MID[1]);
  }
}

// THE DAY'S ARC (#today), 27 OCTOBER 2026; "FLAT HORIZON", 2 NOVEMBER 2026
// Option 7, "the Gilded Arc", of design-docs/weather_hero_options.html replaced the weather line
// drawing on #today on 27 Oct. On 2 Nov the household chose option 5g of
// design-docs/today_scene_options.html: the same arc, "smartened up", in the live header's own size.
//
// A fine arc runs from a flat horizon line to the right of the title. A disc stands where the light
// is now: the sun on the sunrise-to-sunset arc by day, the moon at its real phase on the
// sunset-to-sunrise arc at night. A low disc sets behind the line.
// - The travelled part: a 1.6px line, a 5px glow and a 12px sheen, in the colour of the light at that
//   hour (rose at the horizon, gold, pale gold at noon; violet at dusk, silver-blue at the zenith).
//   The rest of the arc is round dots, 1.9px every 6.2px, at 55% white.
// - The sun: a white disc with a cream edge, in one broad amber glow that fades out over five radii,
//   with 36 fine, soft rays in it. The glow's shape was measured on the household's own pictures;
//   it is drawn at LAMP_SUN_GLOW of that strength (they found the full glow "too intense").
// - The moon: the lit face with five soft seas, and a thin rim of light to 1.9 r (the household
//   preferred this gentler glow to the old 16px halo).
// - The foot: a white point with a small round glow, 12px wide, 36px as the disc comes down to it.
// - At night, stars in the sky right of the title, faded in from the left and from the top, dimmer in twilight,
//   and behind them a night sky round the arc whose colour follows the height (option 2, Layered Sky,
//   8 Nov 2026; it replaced the navy dome of the same day).
// - The title keeps a soft shade in the glow (Law 13.1): at sunrise "The day ahead" on the
//   household's phone ends 12px from the sun, and the full glow brought its last letter to 2.47:1.
// The rays, the stars and the foot glow carry no state; the header's exception to Law 02.2 allows them.
// The renderer of the design study is lamplight-cards/test/today-scene.js (ground 'flat', frame 'live').
//
// The left foot follows the title (28 Oct 2026, options 1 + 3 of design-docs/today_arc_fit_options.html).
// The pop-up gives o.left, 12px after the title's ink, and never less than W - 161. The arc keeps its
// shape: ry is 60/71 of rx. The disc, the glows and the foot keep their size.
const LAMP_ARC_DAY = [[0, '255,140,80'], [0.2, '255,184,72'], [0.5, '255,214,120'],
  [0.8, '255,184,72'], [1, '255,140,80']];
const LAMP_ARC_NIGHT = [[0, '186,150,232'], [0.5, '196,214,248'], [1, '186,150,232']];
// The narrowest arc, foot to foot. Under it the title steps down; at 20px the header drops the arc.
const LAMP_ARC_MIN = 110;
// The sun's glow, as a share of the pictures' measured glow (option 5g: 50%).
const LAMP_SUN_GLOW = 0.5;
// The glow above the sheet by distance (share of five radii): offset, opacity, warmth (1 = the cream).
const LAMP_SUN_PROFILE = [[0.2, 0.95, 1], [0.24, 0.9, 0.7], [0.28, 0.82, 0.35], [0.32, 0.74, 0], [0.4, 0.6, 0],
  [0.5, 0.43, 0], [0.6, 0.29, 0], [0.7, 0.18, 0], [0.8, 0.11, 0], [0.9, 0.055, 0], [1, 0, 0]];

// The colour of a gradient at u (0 to 1), as "r,g,b".
function lampArcAt(stops, u) {
  let i = 0;
  while (i < stops.length - 2 && stops[i + 1][0] < u) i++;
  const a = stops[i], b = stops[i + 1], t = Math.max(0, Math.min(1, (u - a[0]) / (b[0] - a[0])));
  const p = a[1].split(',').map(Number), q = b[1].split(',').map(Number);
  return p.map(function (v, k) { return Math.round(v + (q[k] - v) * t); }).join(',');
}

// A seeded random source, so the rays and the stars stand in the same places at every paint.
function lampArcRandom(seed) {
  let q = seed;
  return function () { q = (q * 16807) % 2147483647; return (q - 1) / 2147483646; };
}

// o: { W (the sheet's width), left (the left foot's x; default W - 161), frac (0 to 1 along the arc),
// night, phase (lit fraction), waning, id (unique to the card) }.
// Returns { svg, at (the trail's colour at the disc), x, y }.
function lampPopupArc(o) {
  const W = o.W, H = 220, id = o.id, night = !!o.night;
  const left = o.left == null ? W - 161 : o.left;
  const right = W - 19, rx = (right - left) / 2, k = rx / 71, ry = 60 * k, cx = left + rx, hz = 120;
  const frac = Math.max(0, Math.min(1, o.frac));
  const th = Math.PI * (1 - frac);
  const x = cx + rx * Math.cos(th), y = hz - ry * Math.sin(th);
  const f = function (v) { return v.toFixed(2); };
  const rgb = function (c) { return 'rgb(' + c + ')'; };
  const mixc = function (a, b, t) {
    const p = a.split(',').map(Number), q = b.split(',').map(Number);
    return p.map(function (v, i) { return Math.round(v + (q[i] - v) * t); }).join(',');
  };
  const sm = function (a, b, v) { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const stops = night ? LAMP_ARC_NIGHT : LAMP_ARC_DAY;
  const at = lampArcAt(stops, (x - left) / (2 * rx));
  const low = 1 - sm(0, 0.45, Math.sin(Math.PI * frac));       // the sun's dawn and dusk warmth
  const blur = function (n, sd) {
    return '<filter id="' + id + n + '" filterUnits="userSpaceOnUse" x="-20" y="0" width="' + (W + 40) + '" height="' + H + '">' +
      '<feGaussianBlur stdDeviation="' + sd + '"/></filter>';
  };
  const defs = [blur('b1', 3.2), blur('b2', 7), blur('b3', 0.5), blur('gb', 0.8), blur('tb', 5)];

  // The trail's gradient, and the title's shade: x from the sheet's edge to 6px past the title's ink.
  const tx = left > W - 161 ? left - 12 : W - 173;
  defs.push('<linearGradient id="' + id + 'tr" gradientUnits="userSpaceOnUse" x1="' + f(left) + '" x2="' + f(right) + '" y1="0" y2="0">' +
    stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + rgb(s[1]) + '"/>'; }).join('') + '</linearGradient>' +
    '<mask id="' + id + 'tm" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="#fff"/>' +
    '<rect x="-20" y="80" width="' + f(tx + 26) + '" height="34" fill="#000" filter="url(#' + id + 'tb)"/></mask>' +
    '<clipPath id="' + id + 'up"><rect x="0" y="-40" width="' + W + '" height="' + (hz + 40) + '"/></clipPath>');

  // Stars: 34 across a whole sheet, fewer in the narrower sky right of the title; faded in from the
  // left (from 70px before the foot) and from the top.
  let stars = '';
  if (night) {
    const sx0 = Math.max(0, left - 70), rnd = lampArcRandom(7), n = Math.round(34 * (W - sx0) / 375);
    // In twilight, near either end of the night arc, the stars are dimmer (to a quarter at the horizon).
    const dim = 1 - 0.75 * (1 - sm(0, 0.35, Math.sin(Math.PI * frac)));
    defs.push('<linearGradient id="' + id + 'sx" gradientUnits="userSpaceOnUse" x1="' + sx0 + '" x2="' + (left + 70) + '" y1="0" y2="0">' +
      [[0, 0], [0.2, 0.04], [0.4, 0.16], [0.6, 0.42], [0.8, 0.78], [1, 1]].map(function (s) {
        return '<stop offset="' + s[0] + '" stop-color="#fff" stop-opacity="' + s[1] + '"/>'; }).join('') + '</linearGradient>' +
      '<linearGradient id="' + id + 'sy" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="' + hz + '"><stop offset="0" stop-color="#000"/>' +
      '<stop offset="' + f(34 / hz) + '" stop-color="#fff"/><stop offset="1" stop-color="#fff"/></linearGradient>' +
      '<mask id="' + id + 'sk" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'sx)"/></mask>' +
      '<mask id="' + id + 'sk2" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + hz + '" fill="url(#' + id + 'sy)"/></mask>');
    for (let i = 0; i < n; i++) {
      const X = sx0 + rnd() * (W - sx0), Y = 6 + Math.pow(rnd(), 1.4) * (hz - 18);
      const r = rnd() < 0.18 ? 1.05 : 0.45 + rnd() * 0.4, a = (0.25 + rnd() * 0.6) * dim * (1 - Y / hz * 0.5);
      stars += '<circle cx="' + f(X) + '" cy="' + f(Y) + '" r="' + f(r) + '" fill="#fff" fill-opacity="' + f(a) + '"/>';
    }
    stars = '<g mask="url(#' + id + 'sk)"><g mask="url(#' + id + 'sk2)">' + stars + '</g></g>';
    // The night sky (8 Nov 2026, option 2 "Layered Sky" of design-docs/today_night_sky_options.html).
    // It replaces the navy dome of option 3 "Night Dome" (popup_header_unity_options.html, earlier the same
    // day). Inside the arc the dome changed by 4 levels of blue in 45px and then by 19 at its rim, so it
    // read as a disc. Now the colour follows the height, as a real night sky does: a cool blue on the
    // horizon, then navy, then indigo above, from 36% down to 22%. A soft oval decides where the sky
    // shows: 54px beyond the arc at the sides and 36px above it at full size. So it stops short of the
    // sheet's top and corners, and fades before the title. It is behind the stars and the moon. It dims
    // in twilight as the stars do. It is drawn at night only; the day keeps the sun's glow alone.
    const ex = rx + 54 * k, ey = ry + 36 * k, top = hz - ey;
    defs.push('<linearGradient id="' + id + 'nc" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="' + hz + '" y2="' + f(top) + '">' +
      [[0, '66,94,158', 0.36], [0.35, '38,54,110', 0.31], [0.7, '28,30,80', 0.26], [1, '24,22,66', 0.22]].map(function (s) {
        return '<stop offset="' + s[0] + '" stop-color="rgb(' + s[1] + ')" stop-opacity="' + f(s[2] * dim) + '"/>'; }).join('') + '</linearGradient>' +
      '<radialGradient id="' + id + 'nm" gradientUnits="userSpaceOnUse" cx="' + f(cx) + '" cy="' + hz + '" r="' + f(ex) + '"' +
      ' gradientTransform="translate(' + f(cx) + ' ' + hz + ') scale(1 ' + f(ey / ex) + ') translate(' + f(-cx) + ' ' + (-hz) + ')">' +
      [[0, 1], [0.5, 0.92], [0.78, 0.45], [1, 0]].map(function (s) {
        return '<stop offset="' + s[0] + '" stop-color="#fff" stop-opacity="' + s[1] + '"/>'; }).join('') + '</radialGradient>' +
      '<mask id="' + id + 'nk" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + hz + '"><rect width="' + W + '" height="' + hz + '" fill="url(#' + id + 'nm)"/></mask>');
    stars = '<rect x="0" y="' + f(top) + '" width="' + W + '" height="' + f(ey) + '" fill="url(#' + id + 'nc)" mask="url(#' + id + 'nk)"/>' + stars;
  }

  const arcD = 'M' + f(left) + ' ' + hz + 'A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + f(right) + ' ' + hz;
  const doneD = 'M' + f(left) + ' ' + hz + 'A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + f(x) + ' ' + f(y);

  // The disc: its glow (which takes the title's shade) and the disc itself.
  let glow, core;
  if (night) {
    const r = 9, kg = Math.cbrt(Math.max(0.02, o.phase)), ex = r * Math.abs(1 - 2 * o.phase);
    // The lit face is one path: the limb on the lit side, then the terminator, a half-ellipse of
    // half-width ex. A waning moon is lit on the left; a waxing moon on the right.
    // Until 0.100.0-dev a whole lit disc was drawn and a shadow was laid on top. Both were clipped to
    // the same circle, so each pixel on the dark limb was antialiased twice and kept about a quarter of
    // the light. A thin moon then showed a stepped, light ring round its dark side (13 Nov 2026). Now the
    // dark disc is drawn first and the lit face over it, so each edge is antialiased once.
    const sweep = (o.phase < 0.5) === !!o.waning ? 1 : 0;
    const litD = o.phase >= 0.995 ? '' : 'M' + f(x) + ' ' + f(y - r) + 'A' + r + ' ' + r + ' 0 0 ' + (o.waning ? 0 : 1) + ' ' + f(x) + ' ' + f(y + r) +
      'A' + f(Math.max(ex, 0.01)) + ' ' + r + ' 0 0 ' + sweep + ' ' + f(x) + ' ' + f(y - r) + 'Z';
    const face = litD ? '<path d="' + litD + '"' : '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '"';
    defs.push('<radialGradient id="' + id + 'mn" gradientUnits="userSpaceOnUse" cx="' + f(x - 0.24 * r) + '" cy="' + f(y - 0.28 * r) + '" r="' + r + '">' +
      '<stop offset="0" stop-color="#fbfcff"/><stop offset="1" stop-color="#c3cde6"/></radialGradient>' +
      '<radialGradient id="' + id + 'mg"><stop offset=".47" stop-color="rgb(170,186,232)" stop-opacity="' + f(0.34 * kg) + '"/>' +
      '<stop offset=".62" stop-color="rgb(150,164,214)" stop-opacity="' + f(0.16 * kg) + '"/><stop offset="1" stop-color="rgb(150,164,214)" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + id + 'mc">' + face + '/></clipPath>');
    // The seas, at the moon's own places on its face, are clipped to the lit face.
    // The dark side is rgb(14,16,25): the old shadow, rgb(8,10,18) at 97% over the lit face. That is a little darker than the
    // night sky behind it, so the dark of the moon is not a grey disc lighter than the sky. Near black (4,5,10) was tried in
    // 0.77.1-dev; on the household's phone it looked too black (8 Nov 2026).
    const sea = function (dx, dy, a, b, t) {
      return '<ellipse cx="' + f(x + dx) + '" cy="' + f(y + dy) + '" rx="' + a + '" ry="' + b + '" transform="rotate(' + t + ' ' + f(x + dx) + ' ' + f(y + dy) +
        ')" fill="rgb(126,138,168)" fill-opacity=".38"/>';
    };
    glow = '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r * 1.9) + '" fill="url(#' + id + 'mg)"/>';
    core = (litD ? '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="rgb(14,16,25)"/>' : '') +
      face + ' fill="url(#' + id + 'mn)"/>' +
      '<g clip-path="url(#' + id + 'mc)"><g filter="url(#' + id + 'b3)">' + sea(-2.6, -2.8, 3.2, 2.2, -20) + sea(1.6, -3.4, 2.4, 1.7, 10) +
      sea(2.8, 0.6, 2.2, 2.8, 0) + sea(-1.2, 1.4, 2.6, 1.6, 30) + sea(-3.2, 4.4, 1.8, 1.2, 0) + '</g></g>';
  } else {
    const R = 9.5, K = LAMP_SUN_GLOW, G = 5 * R * (0.75 + 0.25 * K);
    const amber = mixc('246,150,34', '255,130,56', low), warm = mixc('253,196,104', '255,170,110', low);
    defs.push('<radialGradient id="' + id + 'gg" gradientUnits="userSpaceOnUse" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(G) + '">' +
      '<stop offset="0" stop-color="' + rgb(warm) + '" stop-opacity="' + f(0.95 * Math.max(K, 0.6)) + '"/>' +
      LAMP_SUN_PROFILE.map(function (q) {
        return '<stop offset="' + q[0] + '" stop-color="' + rgb(mixc(amber, warm, q[2])) + '" stop-opacity="' + f(q[1] * (q[0] <= 0.22 ? Math.max(K, 0.6) : K)) + '"/>';
      }).join('') + '</radialGradient>' +
      '<radialGradient id="' + id + 'gr" gradientUnits="userSpaceOnUse" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(G * 0.85) + '">' +
      '<stop offset=".22" stop-color="' + rgb(mixc(amber, warm, 0.3)) + '" stop-opacity="' + f(0.5 * K) + '"/>' +
      '<stop offset=".5" stop-color="' + rgb(amber) + '" stop-opacity="' + f(0.3 * K) + '"/><stop offset="1" stop-color="' + rgb(amber) + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'gd" cx=".46" cy=".44"><stop offset="0" stop-color="#fff"/><stop offset=".62" stop-color="rgb(255,251,240)"/>' +
      '<stop offset=".88" stop-color="' + rgb(mixc('255,236,190', '255,218,176', low)) + '"/><stop offset="1" stop-color="' + rgb(warm) + '"/></radialGradient>');
    // 36 rays, the upright and level ones a little longer, each a thin wedge from the disc's edge.
    const rs = lampArcRandom(23);
    let rays = '';
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * 2 * Math.PI + (rs() - 0.5) * 0.1, card = Math.abs(Math.sin(2 * a));
      const L = G * (0.6 + rs() * 0.25 + (1 - card) * 0.15), w = R * (0.06 + rs() * 0.07);
      const ca = Math.cos(a), sa = Math.sin(a), r0 = R * 0.9;
      rays += 'M' + f(x + ca * r0 - sa * w) + ' ' + f(y + sa * r0 + ca * w) + 'L' + f(x + ca * L) + ' ' + f(y + sa * L) +
        'L' + f(x + ca * r0 + sa * w) + ' ' + f(y + sa * r0 - ca * w) + 'Z';
    }
    glow = '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(G) + '" fill="url(#' + id + 'gg)"/>' +
      '<path d="' + rays + '" fill="url(#' + id + 'gr)" filter="url(#' + id + 'gb)"/>';
    core = '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + R + '" fill="url(#' + id + 'gd)"/>';
  }

  // The horizon: one fine line, faded at both ends, from 24px before the foot to the sheet's edge.
  const l0 = left - 24;
  defs.push('<linearGradient id="' + id + 'hz" gradientUnits="userSpaceOnUse" x1="' + f(l0) + '" x2="' + W + '" y1="0" y2="0">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".2" stop-color="#fff" stop-opacity=".3"/>' +
    '<stop offset=".9" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>');
  // The foot's glow widens over the first 30% of the arc, as the disc comes down to it.
  const near = 1 - sm(0, 0.3, frac);
  defs.push('<radialGradient id="' + id + 'ft"><stop offset="0" stop-color="' + rgb(at) + '" stop-opacity="' + (night ? 0.6 : 0.8) + '"/>' +
    '<stop offset="1" stop-color="' + rgb(at) + '" stop-opacity="0"/></radialGradient>');

  const svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><defs>' + defs.join('') + '</defs>' + stars +
    '<path d="' + arcD + '" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.9" stroke-dasharray="0 6.2" stroke-linecap="round"/>' +
    '<path d="' + doneD + '" fill="none" stroke="url(#' + id + 'tr)" stroke-opacity=".34" stroke-width="12" stroke-linecap="round" filter="url(#' + id + 'b2)"/>' +
    '<path d="' + doneD + '" fill="none" stroke="url(#' + id + 'tr)" stroke-opacity=".6" stroke-width="5" stroke-linecap="round" filter="url(#' + id + 'b1)"/>' +
    '<path d="' + doneD + '" fill="none" stroke="url(#' + id + 'tr)" stroke-width="1.6" stroke-linecap="round"/>' +
    '<g clip-path="url(#' + id + 'up)"><g mask="url(#' + id + 'tm)">' + glow + '</g>' + core + '</g>' +
    '<rect x="' + f(l0) + '" y="' + (hz - 0.5) + '" width="' + f(W - l0) + '" height="1" fill="url(#' + id + 'hz)"/>' +
    '<ellipse cx="' + f(left) + '" cy="' + hz + '" rx="' + f(6 + 12 * near) + '" ry="' + f(4.5 + 0.5 * near) + '" fill="url(#' + id + 'ft)"/>' +
    '<circle cx="' + f(left) + '" cy="' + hz + '" r="2" fill="#fff" fill-opacity=".95"/></svg>';
  return { svg: svg, at: at, x: x, y: y };
}

// ---- THE LIVE HEROES, 28 Oct 2026 (design-docs/popup_hero_options.html, "After the Arc") ------------
// `hero: live` on a lamplight-popup (94-popup.js). Each form is drawn across the whole header in the Day's
// Arc finish, as lampPopupArc is: a faded horizon at y 120, a lit line with a 12px sheen and a 5px glow,
// a disc with a halo, a glint on the horizon. Every number comes from test/probe-popup-heroes.js, which
// the household saw live. The colours are the room's hero accent, core and ember (62% chroma), except
// the sky panes, which are painted white (30 Oct 2026).
// The forms: the comfort ring (climate), the trace (plug, purifier), the skyline (batteries), the sky panes (the room
// window sheets), sunlight and moonlight (#windows), and the gilded object (the fallback, when the
// data does not come). Each draw function returns { svg, x, y, at }: the disc's place, for the wash.
// o: { W, left (the zone's left edge), id, acc, core, ember } and the form's own keys.
const LAMP_HERO_OPEN = LAMP_MEANINGS.window.open;
// The colour of the sunlight at the glass and on the floor, by the sun's elevation (#windows).
// The place is the elevation / 60 degrees. The stops are an OKLCH ramp along the gold hues: amber at
// the horizon, gold at 6 degrees, cream at 15, a warm white at 30 and a butter white at 60. They are
// not the blackbody curve: 5000 K reads peach on a screen, and 2200 K is far past the gold the
// household found too saturated (HSV 0.69). The floor is the same hue, a little deeper; at the
// horizon its chroma is 0.13 (HSV 0.62). Option 2 "Hard Light" of
// design-docs/windows_sunlight_options.html, 30 Oct 2026. Until then the colour followed the place in
// the light period, light orange at noon (2989 K), and composited to brown (#886545) on the sheet.
// By night the light is LAMP_HERO_NIGHT_GLASS at the glass and LAMP_ARC_NIGHT on the floor.
const LAMP_HERO_SUN_GLASS = [[0, '254,166,96'], [0.05, '255,183,109'], [0.1, '255,200,124'],
  [0.1667, '255,214,149'], [0.25, '255,230,180'], [0.3667, '255,238,197'], [0.5, '255,245,215'],
  [0.75, '254,248,225'], [1, '253,251,236']];
const LAMP_HERO_SUN_FLOOR = [[0, '240,153,91'], [0.05, '249,167,92'], [0.1, '255,182,95'],
  [0.1667, '255,196,115'], [0.25, '254,212,141'], [0.3667, '252,221,159'], [0.5, '251,230,179'],
  [0.75, '250,234,190'], [1, '249,239,201']];
// The hot corner of the glass by day: OKLCH 0.99, 0.012, 95.
const LAMP_HERO_SUN_HOT = '254,252,243';
const LAMP_HERO_NIGHT_GLASS = '150,196,255';
// Option 6 of design-docs/windows_frame_options.html (31 Oct 2026): the night's silver (OKLCH about
// 0.95, 0.02, 265), the frame's paint by day and by night, and the stars in the night glass (x and y on
// the glass, 0 to 1).
const LAMP_HERO_SILVER = '226,234,252';
const LAMP_HERO_FRAME_DAY = { hi: '84,80,76', mid: '56,54,55', lo: '34,34,38' };
const LAMP_HERO_FRAME_NIGHT = { hi: '56,62,82', mid: '32,36,50', lo: '16,18,28' };
const LAMP_HERO_STARS = [[0.10, 0.08], [0.30, 0.16], [0.22, 0.40], [0.08, 0.62], [0.40, 0.74], [0.62, 0.86], [0.90, 0.70], [0.56, 0.08], [0.94, 0.48]];

// The shared finish. The blur filters cover the whole header in user space (a % region cut the Arc's
// glow on 27 Oct 2026).
function lampHeroKit(o) {
  const id = o.id, W = o.W, HZ = 120, L = o.left, R = o.W - 19;
  const f = function (v) { return v.toFixed(2); };
  const blur = function (n, sd) {
    return '<filter id="' + id + n + '" filterUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220">' +
      '<feGaussianBlur stdDeviation="' + sd + '"/></filter>';
  };
  return {
    L: L, R: R, HZ: HZ, f: f,
    defs: function (extra) {
      return '<defs>' + blur('b1', 3.2) + blur('b2', 7) +
        '<linearGradient id="' + id + 'hz" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
        '<stop offset=".25" stop-color="#fff" stop-opacity=".16"/><stop offset=".75" stop-color="#fff" stop-opacity=".16"/>' +
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="' + id + 'tr" gradientUnits="userSpaceOnUse" x1="' + L + '" x2="' + R + '" y1="0" y2="0">' +
        '<stop offset="0" stop-color="rgb(' + o.ember + ')"/><stop offset=".55" stop-color="rgb(' + o.acc + ')"/>' +
        '<stop offset="1" stop-color="rgb(' + o.core + ')"/></linearGradient>' +
        '<linearGradient id="' + id + 'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(' + o.core + ')"/>' +
        '<stop offset=".55" stop-color="rgb(' + o.acc + ')"/><stop offset="1" stop-color="rgb(' + o.ember + ')"/></linearGradient>' +
        '<radialGradient id="' + id + 'hl"><stop offset="0" stop-color="rgb(' + o.acc + ')" stop-opacity=".5"/>' +
        '<stop offset="1" stop-color="rgb(' + o.acc + ')" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + id + 'dc" cx=".35" cy=".35"><stop offset="0" stop-color="#fff"/>' +
        '<stop offset="1" stop-color="rgb(' + o.core + ')"/></radialGradient>' + (extra || '') + '</defs>';
    },
    blur: blur,
    horizon: function (x0, x1) {
      return '<rect x="' + (x0 - 20) + '" y="' + HZ + '" width="' + (x1 - x0 + 40) + '" height="1" fill="url(#' + id + 'hz)"/>';
    },
    glint: function (x, c) {
      return '<ellipse cx="' + f(x) + '" cy="' + HZ + '" rx="30" ry="2.4" fill="rgb(' + (c || o.acc) +
        ')" fill-opacity=".55" filter="url(#' + id + 'b1)"/>';
    },
    lit: function (d, paint) {
      return '<path d="' + d + '" fill="none" stroke="' + paint + '" stroke-opacity=".32" stroke-width="12" stroke-linecap="round" filter="url(#' + id + 'b2)"/>' +
        '<path d="' + d + '" fill="none" stroke="' + paint + '" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" filter="url(#' + id + 'b1)"/>' +
        '<path d="' + d + '" fill="none" stroke="' + paint + '" stroke-opacity=".9" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    disc: function (x, y) {
      return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="16" fill="url(#' + id + 'hl)"/>' +
        '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="5" fill="url(#' + id + 'dc)"/>';
    },
    svg: function (inner) {
      return '<svg width="' + W + '" height="220" viewBox="0 0 ' + W + ' 220">' + inner + '</svg>';
    }
  };
}

// The last 24 hours of an entity as 96 points, a step function, oldest first. Returns null when no
// data comes. The mean of the recorder's statistics ('hour' for a spiky sensor); else the entity's
// history, where on and off read as 1 and 0.
async function lampHeroSeries(hass, eid, period, now) {
  const start = now - 86400000;
  let rows = [];
  try {
    const st = await hass.connection.sendMessagePromise({
      type: 'recorder/statistics_during_period', start_time: new Date(start).toISOString(),
      end_time: new Date(now).toISOString(), statistic_ids: [eid], period: period, types: ['mean']
    });
    rows = (st[eid] || []).filter(function (r) { return r.mean !== null && r.mean !== undefined && isFinite(r.mean); })
      .map(function (r) { return { t: r.start, v: r.mean }; });
  } catch (e) { rows = []; }
  if (!rows.length) {
    try {
      const r = await hass.connection.sendMessagePromise({
        type: 'history/history_during_period', start_time: new Date(start).toISOString(),
        end_time: new Date(now).toISOString(), entity_ids: [eid], minimal_response: true,
        no_attributes: true, significant_changes_only: false
      });
      rows = (r[eid] || []).map(function (h) {
        return { t: (h.lu || h.lc || 0) * 1000 || Date.parse(h.last_updated || h.last_changed),
          v: h.s !== undefined ? h.s : h.state };
      }).map(function (h) { return { t: h.t, v: h.v === 'on' ? 1 : h.v === 'off' ? 0 : parseFloat(h.v) }; })
        .filter(function (h) { return isFinite(h.v) && isFinite(h.t); });
    } catch (e) { rows = []; }
  }
  if (!rows.length) return null;
  const out = [];
  for (let i = 0, j = 0; i < 96; i++) {
    const t = start + i * 86400000 / 95;
    while (j < rows.length - 1 && rows[j + 1].t <= t) j++;
    out.push(rows[j].t <= t || j === 0 ? rows[j].v : rows[0].v);
  }
  return out;
}

// The trace. o: { series (96 values), kind: 'plug' | 'purifier', now (ms; the series ends here) }.
function lampHeroTrace(o) {
  const k = lampHeroKit(o), f = k.f, s = o.series, id = o.id;
  let lo = Math.min.apply(null, s), hi = Math.max.apply(null, s);
  // The least range: 4 W, 10 ug/m3. The scale starts at 0.
  const span = o.kind === 'purifier' ? 10 : 4;
  lo = 0; hi = Math.max(hi, span);
  const top = 66, bot = 114;
  const pts = s.map(function (v, i) { return [k.L + (k.R - 8 - k.L) * i / 95, bot - (v - lo) / (hi - lo) * (bot - top)]; });
  const d = 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L');
  const end = pts[95];
  // Midnight: a faint dotted mark where yesterday ends, and its name under the horizon (option 3
  // "Midnight" of design-docs/climate_time_scale_options.html, critique F21, 31 Oct 2026). The word
  // is centred on the mark, but it stays inside the trace's width, so near the ends it moves in.
  const mid = new Date(o.now); mid.setHours(0, 0, 0, 0);
  const mx = k.L + (k.R - 8 - k.L) * (1 - (o.now - mid.getTime()) / 86400000);
  const tx = Math.min(Math.max(mx, k.L + 21), k.R - 8 - 21);
  const svg = k.svg(k.defs() + k.horizon(k.L, k.R) +
    '<path d="M' + f(mx) + ' ' + (top - 4) + 'V' + k.HZ + '" stroke="rgba(255,255,255,.18)" stroke-width="1" stroke-dasharray="1.5 4" stroke-linecap="round"/>' +
    '<text x="' + f(tx) + '" y="' + (k.HZ + 14) + '" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.50)">midnight</text>' +
    k.glint(end[0]) + k.lit(d, 'url(#' + id + 'tr)') + k.disc(end[0], end[1]));
  return { svg: svg, x: end[0], y: end[1], at: o.acc };
}

// The spectrum of the climate sheets' chart: each height in the colour of its own degree. It was the
// temperature arc's band (option 9a, 8 Nov 2026) until the arc was replaced on 15 Nov 2026.
const LAMP_COMFORT_SPECTRUM = [[11, [40, 100, 235]], [15, [60, 160, 255]], [18, [110, 215, 235]], [21.5, [228, 236, 196]],
  [25, [250, 190, 95]], [30, [245, 125, 70]], [40, [225, 70, 105]]];
// The spectrum's colour at a temperature, as 'r,g,b'.
function lampComfortColour(t) {
  const S = LAMP_COMFORT_SPECTRUM;
  let c = S[S.length - 1][1];
  if (t <= S[0][0]) c = S[0][1];
  else for (let i = 1; i < S.length; i++) {
    if (t <= S[i][0]) {
      const k = (t - S[i - 1][0]) / (S[i][0] - S[i - 1][0]);
      c = S[i - 1][1].map(function (v, j) { return v + (S[i][1][j] - v) * k; });
      break;
    }
  }
  return c.map(Math.round).join(',');
}
// The damp band of a humidity: 0 under damp[0], 1 from damp[0], 2 from damp[1]; and the number to show, which
// stays inside its band.
function lampComfortDamp(hum, damp) {
  const band = hum >= damp[1] ? 2 : hum >= damp[0] ? 1 : 0;
  let n = Math.round(hum);
  if (band < 2 && n >= damp[band]) n = damp[band] - 1;
  return { band: band, n: n };
}

// The picture of the climate sheets: header F6 "Light in the Air" of design-docs/climate_quiet_options.html,
// decided 15 Nov 2026 with body option 2, and lit as F6a "Emitted Light" (revision 2.5, the same day). It
// replaces the temperature arc (option 9a of climate_temperature_options.html, 8 Nov 2026), which the
// household found read as an instrument.
//   The mark    a frost crystal under 20.5 degrees, a sun from 20.5 (the middle hour of the house's year
//               is 20.3). The crystal grows as the room cools, to its largest at 15; the sun grows as the
//               room warms, to its largest at 30. Crystal: six arms with one fork each, a second fork from
//               about 17.6, and a 12px core. Sun: twelve rays, long and short in turn, round an 18px core.
//               The shape changes only 0.15 past 20.5 on either side, so a room that sits at 20.5 does not
//               flip back and forth (the caller keeps the shape).
//   The colour  the household's ramp: ice blue (118,188,255 at 15, 176,218,255 near 20.5), pale yellow
//               from 20.5, warm amber at 27, soft orange at 30. From 19.75 to 21.25 the yellow rises from
//               the foot of the mark, over a soft 6px line, blue always above. The light is at full chroma:
//               the climate exception to the header's 62% rule.
//   The light   emitted, as in the household's reference (Weather Temperature Progression Grid): the mark
//               is a crisp 1.5px line in a pale tint of its colour, a third of the way to white, round a
//               tinted core, and its colour is in the light round it. That light is the shape itself in its
//               full colour, blurred at 1.5, 5 and 14px at 80%, 50% and 24%, so it follows the arms and
//               rays and ends 6 to 11px past the tips. There is no round halo and no fine ray. Until
//               revision 2.5 (0.115.0-dev) it was the #today sun's round glow with a white core, which
//               reached 11 to 22px past the tips and turned brown round the sun.
//   The damp    mist under the mark from damp[0], over its lower half from damp[1].
const LAMP_FROST_SUN = { mid: 20.5, cold: 15, hot: 30, margin: 0.15, blend: 0.75,
  far: [118, 188, 255], near: [176, 218, 255],
  sun: [[20.5, [255, 234, 150]], [24, [255, 224, 118]], [27, [255, 190, 84]], [30, [255, 148, 96]]] };
// The space the picture and its glow need from the sheet's right edge.
const LAMP_FROST_SUN_ROOM = 150;
const LAMP_FROST_SUN_DX = 99, LAMP_FROST_SUN_CY = 72;

function lampFrostSunMix(a, b, t) { return a.map(function (v, k) { return Math.round(v + (b[k] - v) * t); }); }
// The colour of the mark at a temperature, blue or yellow, as [r, g, b].
function lampFrostSunBlue(t) {
  const F = LAMP_FROST_SUN;
  return lampFrostSunMix(F.near, F.far, Math.max(0, Math.min(1, (F.mid - t) / (F.mid - F.cold))));
}
function lampFrostSunYellow(t) {
  const S = LAMP_FROST_SUN.sun;
  if (t <= S[0][0]) return S[0][1];
  for (let i = 1; i < S.length; i++) if (t <= S[i][0]) return lampFrostSunMix(S[i - 1][1], S[i][1], (t - S[i - 1][0]) / (S[i][0] - S[i - 1][0]));
  return S[S.length - 1][1];
}

// o: { W, id, temp, shape ('frost' or 'sun'), band (the damp band, 0 to 2) }.
function lampHeroFrostSun(o) {
  const F = LAMP_FROST_SUN, W = o.W, id = o.id, t = o.temp, X = F.mid, frost = o.shape === 'frost';
  const clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  const f = function (v) { return v.toFixed(2); };
  const rgb = function (c) { return 'rgb(' + c.join(',') + ')'; };
  const WHITE = [255, 255, 255];
  const k = frost ? clamp((X - t) / (X - F.cold)) : clamp((t - X) / (F.hot - X));
  const size = 0.06 + 0.94 * k, ext = frost ? 19 + 24 * size : 23 + 17 * size;
  const cx = W - LAMP_FROST_SUN_DX, cy = LAMP_FROST_SUN_CY, RD = frost ? 6 : 9;
  const top = lampFrostSunBlue(Math.min(t, X)), bot = lampFrostSunYellow(Math.max(t, X));
  // The share of the mark's height in yellow: 0 under 19.75, 1 from 21.25.
  const share = clamp((t - (X - F.blend)) / (2 * F.blend));
  const P = function (r, a) { const q = a * Math.PI / 180; return f(cx + r * Math.cos(q)) + ' ' + f(cy + r * Math.sin(q)); };
  let lines = '', wedges = '';
  if (frost) {
    for (let i = 0; i < 6; i++) {
      const a = -90 + 60 * i;
      lines += 'M' + P(RD + 3, a) + 'L' + P(ext, a);
      [[0.6, 0], [0.84, 0.45]].forEach(function (q) {
        if (size < q[1]) return;
        const r0 = 13 + (ext - 13) * q[0], len = 3 + 5 * size, ra = a * Math.PI / 180;
        const e0 = [cx + r0 * Math.cos(ra), cy + r0 * Math.sin(ra)];
        [-55, 55].forEach(function (d) {
          const rb = (a + d) * Math.PI / 180;
          lines += 'M' + f(e0[0]) + ' ' + f(e0[1]) + 'L' + f(e0[0] + len * Math.cos(rb)) + ' ' + f(e0[1] + len * Math.sin(rb));
        });
      });
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const a = -90 + 30 * i, L = 17 + (i % 2 ? 4 + 9 * size : 6 + 17 * size);
      wedges += 'M' + P(RD + 4, a - 5.5) + 'L' + P(L, a) + 'L' + P(RD + 4, a + 5.5) + 'Z';
    }
  }
  const blur = function (n, sd) {
    return '<filter id="' + id + n + '" filterUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220"><feGaussianBlur stdDeviation="' + sd + '"/></filter>';
  };
  const defs = [blur('fsa', 1.5), blur('fsb', 5), blur('fsc', 14), blur('fsm', 7)];
  // The shape in one paint. w = the line width; disc = the core's radius in this layer, or 0.
  const shape = function (paint, w, disc) {
    return (lines ? '<path d="' + lines + '" fill="none" stroke="' + paint + '" stroke-width="' + w + '" stroke-linecap="round"/>' : '') +
      (wedges ? '<path d="' + wedges + '" fill="' + paint + '" stroke="' + paint + '" stroke-width="' + f(Math.max(0, w - 1.4)) + '" stroke-linejoin="round"/>' : '') +
      (disc ? '<circle cx="' + f(cx) + '" cy="' + cy + '" r="' + f(disc) + '" fill="' + paint + '"/>' : '');
  };
  // One light in one colour c: the light round the mark, the mark, and the core.
  const light = function (c, sfx) {
    const g = id + sfx, C = rgb(c);
    defs.push('<radialGradient id="' + g + 'e" cx=".45" cy=".42"><stop offset="0" stop-color="' + rgb(lampFrostSunMix(c, WHITE, 0.72)) + '"/>' +
      '<stop offset="1" stop-color="' + rgb(lampFrostSunMix(c, WHITE, 0.4)) + '"/></radialGradient>');
    return {
      glow: '<g filter="url(#' + id + 'fsc)" opacity=".24">' + shape(C, 5, RD + 4) + '</g>' +
        '<g filter="url(#' + id + 'fsb)" opacity=".5">' + shape(C, 3.5, RD + 2) + '</g>' +
        '<g filter="url(#' + id + 'fsa)" opacity=".8">' + shape(C, 2.4, RD + 0.5) + '</g>',
      marks: shape(rgb(lampFrostSunMix(c, WHITE, 0.32)), 1.5, 0),
      disc: '<circle cx="' + f(cx) + '" cy="' + cy + '" r="' + RD + '" fill="url(#' + g + 'e)"/>'
    };
  };
  // Two colours: blue above, yellow under one line. The light changes over 20px, the marks over 6px.
  // The core is drawn once, in the colour of the middle of the mark, so it does not split.
  const ys = cy + ext - 2 * ext * share;
  const split = function (nm, s, above) {
    defs.push('<linearGradient id="' + id + nm + 'v" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(ys - s) + '" x2="0" y2="' + f(ys + s) + '">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="' + (above ? 1 : 0) + '"/><stop offset="1" stop-color="#fff" stop-opacity="' + (above ? 0 : 1) + '"/></linearGradient>' +
      '<mask id="' + id + nm + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220"><rect width="' + W + '" height="220" fill="url(#' + id + nm + 'v)"/></mask>');
    return function (inner) { return '<g mask="url(#' + id + nm + ')">' + inner + '</g>'; };
  };
  let art, at;
  if (share > 0 && share < 1) {
    const A = light(top, 'fsa'), B = light(bot, 'fsb');
    const D = light(lampFrostSunMix(top, bot, clamp((share - 0.5) / 0.3 + 0.5)), 'fsd');
    art = split('fsga', 10, true)(A.glow) + split('fsgb', 10, false)(B.glow) +
      split('fsma', 3, true)(A.marks) + split('fsmb', 3, false)(B.marks) + D.disc;
    at = lampFrostSunMix(top, bot, share);
  } else {
    const c = share ? bot : top, A = light(c, 'fsa');
    art = A.glow + A.marks + A.disc;
    at = c;
  }
  if (o.band) {
    art += '<ellipse cx="' + f(cx) + '" cy="' + f(cy + ext * (o.band === 2 ? 0.35 : 0.8)) + '" rx="74" ry="' + (o.band === 2 ? 17 : 10) +
      '" fill="rgba(170,212,255,' + (o.band === 2 ? 0.3 : 0.2) + ')" filter="url(#' + id + 'fsm)"/>';
  }
  return { svg: '<svg width="' + W + '" height="220" viewBox="0 0 ' + W + ' 220"><defs>' + defs.join('') + '</defs>' + art + '</svg>',
    x: cx, y: cy, at: at.join(',') };
}

// The skyline of #batteries. o: { levels (percent, lowest first), bands (the band of each level:
// 'alert', 'notice', 'hand' or 'full'), bandRgb (the body's band colours) }.
// Option 10 "One Light for Every Bar" of design-docs/battery_hero_rework_options.html, 8 Nov 2026,
// after the household's inspiration images. Until then the bars were the accent at 62% chroma, each
// light at its own top, with orange at or under 20% and no floor.
//   The bars   each bar is its band's colour at full chroma, as on the body's rows: the one exception
//              to the header's 62% rule. One gradient for each band spans the full 58px, so the light is
//              set by the height above the floor and is the same on every bar: the band colour at the
//              floor, whiter towards 100%. A 5px glint at 14% sits on each rounded end.
//   The floor  polished. Each bar is mirrored at its full height in its solid colour, in two layers: a
//              sharp one (0.45px blur, 64%) gone 12px down, and a soft one (blurred 3px down and 0.6px
//              across, so each stays a streak) at 54% that runs 46px. Under the bars, a soft glow in each
//              bar's colour, strongest 10px down and gone at 30px, a faint pool and a bright point at
//              each foot. All of it lies under one oval of light centred on the lowest bar's foot: full
//              there, 74% half way out, 32% at the last bar, gone 60px down. The disc lights the floor.
//   The halo   the bars' 3.2px glow stops at the horizon; the floor has its own light.
function lampHeroSkyline(o) {
  const lv = o.levels, n = lv.length, id = o.id;
  const tones = {};
  const toneOf = function (b) {
    if (!tones[b]) { const c = o.bandRgb[b]; tones[b] = { acc: c, core: lampCore(c), ember: lampEmber(c) }; }
    return tones[b];
  };
  const low = toneOf(o.bands[0]);
  const k = lampHeroKit(Object.assign({}, o, low)), f = k.f, HZ = k.HZ, Y = HZ + 1, W = o.W;
  const step = (k.R - k.L) / n, bw = Math.max(1.5, Math.min(5, step * 0.5));
  const H = function (v) { return Math.max(2, Math.min(100, v) / 100 * 58); };
  const filt = function (nm, sd) {
    return '<filter id="' + id + nm + '" filterUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220"><feGaussianBlur stdDeviation="' + sd + '"/></filter>';
  };
  const vgrad = function (nm, y1, y2, stops) {
    return '<linearGradient id="' + id + nm + '" gradientUnits="userSpaceOnUse" x1="0" y1="' + y1 + '" x2="0" y2="' + y2 + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + s[2] + '"/>'; }).join('') + '</linearGradient>';
  };
  const below = function (nm, g, h) {
    return '<mask id="' + id + nm + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220"><rect x="0" y="' + Y + '" width="' + W + '" height="' + h + '" fill="url(#' + id + g + ')"/></mask>';
  };

  let defs = filt('fs', 0.45) + filt('fp', 4) + filt('fb', '.6 3') + filt('fh', '6 4') +
    vgrad('cap', 0, 1, [[0, '#fff', 0.14], [1, '#fff', 0]]).replace('gradientUnits="userSpaceOnUse" ', '') +
    vgrad('m1', Y, Y + 12, [[0, '#fff', 0.64], [1, '#fff', 0]]) + below('k1', 'm1', 12) +
    vgrad('m2', Y, Y + 46, [[0, '#fff', 0.54], [0.35, '#fff', 0.24], [1, '#fff', 0]]) + below('k2', 'm2', 46) +
    '<clipPath id="' + id + 'fc"><rect x="0" y="' + Y + '" width="' + W + '" height="' + (220 - Y) + '"/></clipPath>' +
    '<clipPath id="' + id + 'hc"><rect x="0" y="0" width="' + W + '" height="' + Y + '"/></clipPath>';
  Object.keys(o.bands.reduce(function (m, b) { m[b] = 1; return m; }, {})).forEach(function (b) {
    const t = toneOf(b), c = 'rgb(' + t.acc + ')';
    defs += vgrad('g' + b, HZ - 58, HZ, [[0, 'rgb(' + lampMix(t.acc, '255,255,255', 0.55) + ')', 1],
      [0.22, 'rgb(' + lampMix(t.acc, '255,255,255', 0.3) + ')', 1], [0.6, 'rgb(' + lampMix(t.acc, '255,255,255', 0.1) + ')', 1], [1, c, 1]]) +
      vgrad('h' + b, 0, 1, [[0, c, 0.12], [0.33, c, 0.32], [1, c, 0]]).replace('gradientUnits="userSpaceOnUse" ', '');
  });
  const x0 = k.L + step * 0.5;
  // The oval of light under the disc: the last bar sits at 0.92 of its radius.
  defs += '<radialGradient id="' + id + 'ov" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(' + f(x0) + ' ' + Y + ') scale(' + f((k.R - x0) / 0.92) + ' 60)">' +
    '<stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".74"/>' +
    '<stop offset=".92" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<mask id="' + id + 'ok" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220"><rect x="0" y="' + Y + '" width="' + W + '" height="' + (220 - Y) + '" fill="url(#' + id + 'ov)"/></mask>';

  let bars = '', flat = '', caps = '', solid = '', haze = '', pools = '', feet = '';
  lv.forEach(function (v, i) {
    const b = o.bands[i], t = toneOf(b), x = k.L + step * (i + 0.5), h = H(v);
    const r = '<rect x="' + f(x - bw / 2) + '" y="' + f(HZ - h) + '" width="' + f(bw) + '" height="' + f(h) + '" rx="' + f(bw / 2) + '"';
    bars += r + ' fill="url(#' + id + 'g' + b + ')" fill-opacity="' + (i === 0 ? 1 : 0.86) + '"/>';
    flat += r + ' fill="url(#' + id + 'g' + b + ')"/>';
    solid += r + ' fill="rgb(' + t.acc + ')"/>';
    caps += '<rect x="' + f(x - bw / 2) + '" y="' + f(HZ - h) + '" width="' + f(bw) + '" height="' + f(Math.min(5, h)) + '" rx="' + f(bw / 2) + '" fill="url(#' + id + 'cap)"/>';
    haze += '<rect x="' + f(x - step * 0.8) + '" y="' + Y + '" width="' + f(step * 1.6) + '" height="30" fill="url(#' + id + 'h' + b + ')"/>';
    pools += '<ellipse cx="' + f(x) + '" cy="' + (Y + 2) + '" rx="' + f(step * 1.1) + '" ry="6" fill="rgb(' + t.acc + ')" fill-opacity=".1"/>';
    feet += '<ellipse cx="' + f(x) + '" cy="' + Y + '" rx="' + f(bw * 0.8) + '" ry=".9" fill="rgb(' + t.core + ')" fill-opacity=".4"/>';
  });
  const mirror = function (fl, m) {
    return '<g mask="url(#' + id + m + ')"><g filter="url(#' + id + fl + ')"><g transform="matrix(1 0 0 -1 0 ' + (2 * Y) + ')">' + solid + '</g></g></g>';
  };
  const floor = '<g mask="url(#' + id + 'ok)">' +
    '<g clip-path="url(#' + id + 'fc)"><g filter="url(#' + id + 'fh)">' + haze + '</g></g>' +
    '<g clip-path="url(#' + id + 'fc)"><g filter="url(#' + id + 'fp)">' + pools + '</g></g>' +
    mirror('fb', 'k2') + mirror('fs', 'k1') + '<g filter="url(#' + id + 'fs)">' + feet + '</g></g>';
  const y0 = HZ - H(lv[0]) - 9;
  const svg = k.svg(k.defs(defs) + k.horizon(k.L, k.R) + floor +
    '<g clip-path="url(#' + id + 'hc)"><g filter="url(#' + id + 'b1)" opacity=".5">' + flat + '</g></g>' +
    bars + caps + k.glint(x0) + k.disc(x0, y0));
  return { svg: svg, x: x0, y: y0, at: o.acc };
}

// The sky panes of a room's window sheet. o: { windows: [{ open }], urlA, urlB (or null), t (the share of urlB) }.
// One casement for each window, with one sky across the glass of all the closed ones.
// Option 2 "Painted Frames" of design-docs/windows_room_hero_options.html, 30 Oct 2026: each casement
// is a solid frame of white paint, lit from the top left, on a stone sill. The drawing has no room
// accent and no glow; the eyebrow keeps the accent. Until then the frames were 1.25px lines in the
// room's accent, and the household found them "a little unprofessional".
const LAMP_HERO_PAINT = { hi: '246,244,238', mid: '214,211,203', lo: '150,147,140' };
const LAMP_HERO_WALL = '200,206,216';                // the wash on the wall, when all are closed
function lampHeroPanes(o) {
  const k = lampHeroKit(o), f = k.f, id = o.id, HZ = k.HZ, n = o.windows.length, P = LAMP_HERO_PAINT;
  const bx = o.W - 161, bw = 104, wh = 82, wy = HZ - 2 - wh, fw = 3.2, gap = n > 1 ? 5 : 0, pw = (bw - gap * (n - 1)) / n;
  const sky = function () {
    return '<image href="' + lampEsc(o.urlA) + '" x="' + (bx - 150) + '" y="' + (wy - 20) + '" width="420" height="140" preserveAspectRatio="xMidYMid slice"/>' +
      (o.urlB ? '<image href="' + lampEsc(o.urlB) + '" x="' + (bx - 150) + '" y="' + (wy - 20) + '" width="420" height="140" preserveAspectRatio="xMidYMid slice" opacity="' + o.t + '"/>' : '');
  };
  const rect = function (x, y, w, h, fill) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"' + (fill ? ' fill="' + fill + '"' : '') + '/>';
  };
  let clip = '', glass = '', paint = '', opened = 0;
  o.windows.forEach(function (w, i) {
    const x = bx + i * (pw + gap), gx = x + fw, gy = wy + fw, gwid = pw - 2 * fw, ght = wh - 2 * fw, yb = gy + ght * 0.42;
    // The frame is a ring of paint; the reveal is a shadow inside it, where the glass meets the frame.
    paint += '<path fill-rule="evenodd" fill="url(#' + id + 'pf)" d="M' + f(x) + ' ' + f(wy) + 'h' + f(pw) + 'v' + wh + 'h' + f(-pw) + 'Z' +
      'M' + f(gx) + ' ' + f(gy) + 'v' + f(ght) + 'h' + f(gwid) + 'v' + f(-ght) + 'Z"/>' + rect(gx, gy, gwid, ght, 'url(#' + id + 'rv)');
    if (!w.open) {
      clip += rect(gx, gy, gwid, ght);
      // The glazing bars: a transom at 42%, and a mullion when the pane is wide. They are lighter than
      // the frame, and each has a small shadow.
      const bars = 'M' + f(gx) + ' ' + f(yb) + 'H' + f(gx + gwid) + (pw > 40 ? 'M' + f(x + pw / 2) + ' ' + f(gy) + 'V' + f(gy + ght) : '');
      paint += '<path d="' + bars + '" stroke="#000" stroke-opacity=".35" stroke-width="2" transform="translate(.6 .9)" filter="url(#' + id + 'b0)"/>' +
        '<path d="' + bars + '" stroke="url(#' + id + 'pb)" stroke-width="2"/>';
      return;
    }
    opened++;
    // The open casement turns out, away from the viewer, on the hinge at the outer side of the set. It
    // lies beyond the wall, so it is seen through the opening, narrow and a little smaller at its free
    // edge, and it stays inside its own opening. The rest of the opening shows the sky, unshaded.
    const right = i >= (n - 1) / 2, sw = gwid * 0.3, hx = right ? gx + gwid : gx, ex = right ? hx - sw : hx + sw;
    glass += '<clipPath id="' + id + 'o' + i + '">' + rect(gx, gy, gwid, ght) + '</clipPath>' +
      '<g clip-path="url(#' + id + 'o' + i + ')">' + sky() + rect(gx, gy, gwid, ght, 'url(#' + id + 'rv)') + '</g>';
    const sash = 'M' + f(hx) + ' ' + f(gy) + 'L' + f(ex) + ' ' + f(gy + 4) + 'L' + f(ex) + ' ' + f(gy + ght - 4) + 'L' + f(hx) + ' ' + f(gy + ght) + 'Z';
    paint += '<path d="' + sash + '" fill="rgb(' + LAMP_HERO_OPEN + ')" fill-opacity=".22"/>' +
      '<path d="' + sash + '" fill="none" stroke="url(#' + id + 'pf)" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M' + f(hx) + ' ' + f(yb) + 'L' + f(ex) + ' ' + f(gy + 4 + (ght - 8) * 0.42) + '" stroke="url(#' + id + 'pb)" stroke-width="1.4"/>';
  });
  // The sill: a stone shelf, 7px wider than the set on each side, with its shadow on the wall.
  const sy = HZ - 1;
  const sill = '<rect x="' + f(bx - 7) + '" y="' + f(sy + 2) + '" width="' + (bw + 14) + '" height="4" fill="#000" fill-opacity=".45" filter="url(#' + id + 'b0)"/>' +
    '<rect x="' + f(bx - 7) + '" y="' + f(sy - 1) + '" width="' + (bw + 14) + '" height="3.5" rx=".8" fill="url(#' + id + 'pb)"/>' +
    '<rect x="' + f(bx - 7) + '" y="' + f(sy - 1) + '" width="' + (bw + 14) + '" height=".8" fill="#fff" fill-opacity=".7"/>';
  const svg = k.svg(k.defs(k.blur('b0', 0.6) + k.blur('b3', 5) + '<clipPath id="' + id + 'cp">' + clip + '</clipPath>' +
    '<linearGradient id="' + id + 'pf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgb(' + P.hi + ')"/>' +
    '<stop offset=".5" stop-color="rgb(' + P.mid + ')"/><stop offset="1" stop-color="rgb(' + P.lo + ')"/></linearGradient>' +
    '<linearGradient id="' + id + 'pb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(' + P.hi + ')"/>' +
    '<stop offset="1" stop-color="rgb(' + P.mid + ')"/></linearGradient>' +
    '<linearGradient id="' + id + 'rv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/>' +
    '<stop offset=".18" stop-color="#000" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="' + id + 'sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#101219" stop-opacity=".55"/>' +
    '<stop offset=".5" stop-color="#101219" stop-opacity="0"/></linearGradient>') +
    k.horizon(k.L - 40, k.R) +
    // The window's own soft light on the wall around it.
    '<rect x="' + (bx - 6) + '" y="' + (wy - 6) + '" width="' + (bw + 12) + '" height="' + (wh + 6) + '" rx="6" fill="#dfe6f2" fill-opacity=".05" filter="url(#' + id + 'b3)"/>' +
    '<g clip-path="url(#' + id + 'cp)">' + sky() + rect(bx, wy, bw, wh, 'url(#' + id + 'sh)') +
    // A faint reflection across the glass, from the top left.
    '<path d="M' + f(bx) + ' ' + f(wy + wh * 0.55) + 'L' + f(bx + bw * 0.45) + ' ' + f(wy) + 'H' + f(bx + bw * 0.6) + 'L' + f(bx) + ' ' + f(wy + wh * 0.85) + 'Z" fill="#fff" fill-opacity=".06"/></g>' +
    glass + paint + sill);
  return { svg: svg, x: bx + bw / 2, y: HZ - 50, at: opened ? LAMP_HERO_OPEN : LAMP_HERO_WALL };
}

// Option 3 "Cut from the Plate" of design-docs/windows_room_frame_options.html, 7 Nov 2026: the room window
// frames are cut from the #windows plate, so the light comes from behind them. lampHeroPanes above stays as
// the drawing for a plate that does not load, or for `header_images: false`.
// o: { windows, urlA, urlB, t, plates: { day, night }, nightShare (0 to 1), muted (cloud or fog) }.
// - Each casement has 10 slices: 2 sides, top, foot, 4 corners and 2 bars. The sill has 3. The left side is the
//   right side mirrored, because the plate's real left side holds the rays.
// - The bands scale with the window count: 1, 0.78, 0.55 for 1, 2, 3 windows.
// - The day image loses its colour under cloud or fog. After sunset the night image fades in over 3 degrees.
// - A slice is a nested svg. Its width, height and overflow are inline, because `.gw svg` sets them too.
// LAMP_HERO_FRAME holds the bands in the px of the plate file. A new plate set needs new values here.
const LAMP_HERO_FRAME = { w: 1270, h: 423, scale: 0.3, gR: 1010, oR: 1039, oT: 47, gT: 77, gF: 275, sT: 290, sB: 311, capR: 1039, capW: 14,
  runX: 930, runW: 70, sideY: 180, sideH: 90, barY: 168, barH: 13, mulX: 909, mulW: 13, mulY: 85, mulH: 75 };
// The open window (24 Nov 2026, option 8 "Soft Light in the Gap" of design-docs/windows_room_open_options.html). Until then
// a blue oval lay on the floor at y 123. It stayed there when the window rose to y 82, the sunlight covered it, and it
// could not say which window was open. Now:
// - The casement is wider (`w`: the share of the opening, for one, two and three windows). It stands behind the frame,
//   clipped to its own opening, and its free edge is smaller by `recede`, so it opens outwards as the household's
//   windows do. It has no dark line: `pvc` is the glazing bars' edge and body, read from the closed windows. By night it
//   is a step lighter than the bars, because the bars' own tone is a dark line against the blue glass.
// - A cool light in the open blue stands in the gap. It is hottest where the opening meets the sill, where it takes the place of the
//   sun's gold, and it goes up the sides and along the head. `body`, `core` and `halo` are the strengths of the
//   blue, the white line and the soft halo, by day and cloud, and by night. The white core gives the glare and the
//   blue carries the sign, so the core is low.
// - The light of lampHeroRoomLight gives an open window all its panes' rays, 25% stronger (`ray`). Before, an open window
//   counted as one pane, and the shaft of the Bathroom lost 19% of its light when its window opened.
const LAMP_HERO_FRAME_OPEN = { w: [0.36, 0.45, 0.52], recede: 7, tint: 0.45, deep: '18,128,214', hot: '214,250,255', wall: [0.16, 0.3],
  body: [0.88, 0.80], core: [0.55, 0.50], halo: [0.65, 0.60], ray: [1.25, 0.15],
  pvc: { warm: ['250,248,244', '214,209,202'], grey: ['226,226,226', '190,189,188'], night: ['146,160,190', '118,130,158'] } };
// v: { id, i, f, mat, right, fr (the casement's share), x, pw, gx, gy, gw, gh, foot, footH, sillH, bx, box }, in the window
// group's px. It gives { over (behind the casement), sash, front (the foot rail, the sill and the hot line) }.
function lampHeroOpenWindow(v) {
  const G = LAMP_HERO_FRAME_OPEN, id = v.id, f = v.f, mat = v.mat, nn = mat === 'night' ? 1 : 0, k = G.body[nn], kc = G.core[nn], kh = G.halo[nn], B = 'rgb(' + LAMP_HERO_OPEN + ')';
  const q = function (a) { return id + a + v.i; };
  const st = function (o, col, a) { return '<stop offset="' + o + '" stop-color="rgb(' + col + ')" stop-opacity="' + (a * k).toFixed(3) + '"/>'; };
  const el = function (cx, cy, rx, ry, c, a, blur) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + ry + '" fill="' + c + '" fill-opacity="' + a + '" filter="url(#' + id + blur + ')"/>'; };
  const box = function (x, y, w, h, rest) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"' + rest + '/>'; };
  const gx = v.gx, gy = v.gy, gw = v.gw, gh = v.gh, y1 = gy + gh, op = LAMP_HERO_OPEN, dk = G.deep;
  // The gap beside the casement, and its middle.
  const gapW = gw * (1 - v.fr * 0.55), c = (v.right ? gx : gx + gw - gapW) + gapW / 2, wc = v.x + v.pw / 2;
  const defs = '<linearGradient id="' + q('gu') + '" x1="0" y1="1" x2="0" y2="0">' + st(0, op, 0.95) + st(0.1, op, 0.6) + st(0.28, dk, 0.3) + st(0.6, dk, 0.08) + st(1, dk, 0) + '</linearGradient>' +
    '<linearGradient id="' + q('gj') + '" x1="0" y1="1" x2="0" y2="0">' + st(0, op, 1) + st(0.3, op, 0.75) + st(0.65, op, 0.35) + st(1, op, 0.65) + '</linearGradient>' +
    '<radialGradient id="' + q('gs') + '" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(' + f(c * 0.6 + wc * 0.4) + ' ' + f(v.foot - 1) + ') scale(' + f(v.pw * 0.5 + 12) + ' ' + f(v.sillH + v.footH + 5) + ')">' +
    st(0, op, 1) + st(0.35, op, 0.92) + st(0.6, dk, 0.72) + st(0.82, dk, 0.28) + st(1, dk, 0) + '</radialGradient>' +
    '<clipPath id="' + q('gc') + '">' + box(gx, gy, gw, gh, '') + '</clipPath>' +
    // This window's frame without its opening, and the sill.
    '<clipPath id="' + q('gz') + '"><path clip-rule="evenodd" d="M' + f(v.x) + ' ' + f(gy) + 'H' + f(v.x + v.pw) + 'V' + f(v.foot) + 'H' + f(v.x) + 'ZM' + f(gx) + ' ' + f(gy) + 'V' + f(y1) + 'H' + f(gx + gw) + 'V' + f(gy) + 'Z"/>' +
    box(v.bx - 7, v.foot - 0.2, v.box + 14, v.sillH, '') + '</clipPath>';
  const jamb = function (x, w) { return box(x, gy, w, gh, ' fill="url(#' + q('gj') + ')"'); };
  const over = '<defs>' + defs + '</defs><g clip-path="url(#' + q('gc') + ')">' + box(gx, gy, gw, gh, ' fill="url(#' + q('gu') + ')"') + '</g>' +
    jamb(v.right ? gx - 1 : gx + gw - 0.6, 1.6) + jamb(v.right ? gx + gw - 0.2 : gx - 1, 1.2) +
    box(gx, gy - 0.8, gw, 1.5, ' fill="' + B + '" fill-opacity="' + 0.7 * k + '"');
  const hx = v.right ? gx + gw : gx, ex = v.right ? hx - gw * v.fr : hx + gw * v.fr;
  const d = 'M' + f(hx) + ' ' + f(gy) + 'L' + f(ex) + ' ' + f(gy + G.recede) + 'L' + f(ex) + ' ' + f(y1 - G.recede * 0.8) + 'L' + f(hx) + ' ' + f(y1) + 'Z';
  const line = function (c2, w) { return '<path d="' + d + '" fill="none" stroke="rgb(' + c2 + ')" stroke-width="' + w + '" stroke-linejoin="miter"/>'; };
  const sash = '<g clip-path="url(#' + q('gc') + ')"><path d="' + d + '" fill="' + B + '" fill-opacity="' + G.tint + '"/>' + line(G.pvc[mat][0], 3.8) + line(G.pvc[mat][1], 2.2) + '</g>';
  const front = '<g clip-path="url(#' + q('gz') + ')">' + box(v.bx - 7, y1 - 24, v.box + 14, 54, ' fill="url(#' + q('gs') + ')"') + '</g>' +
    el(c, v.foot - 2, gapW * 0.56 + 5, 6, B, (0.55 * kh).toFixed(2), 'ow') +
    el(c, v.foot + v.sillH + 2, gapW * 0.5 + 4, 3, B, (G.wall[mat === 'warm' ? 0 : 1] * kh).toFixed(3), 'ow') +
    el(c, v.foot - 0.6, gapW * 0.46, 2, 'rgb(' + G.hot + ')', (0.95 * kc).toFixed(2), 'ob') +
    el(c, v.foot - 0.3, gapW * 0.36, 1, '#fff', (0.95 * kc).toFixed(2), 'b0');
  return { over: over, sash: sash, front: front };
}
// White PVC (21 Nov 2026, A2 "Soft White" and B of design-docs/windows_room_pvc_options.html). The household's windows are
// white PVC; the plate paints its frame warm brown (85,65,46, OKLCH C 0.041) with gold bars (C 0.079). The room frames
// stay cut from the plate, so the carving and the lit edges stay. One colour matrix maps the plate's luma from
// [inLo, inHi] to [lo, hi] times a tint: by day a white in its own shade, by night a moonlit pale grey that is lighter
// than the wall. The House #windows picture keeps the plate's frame. `bar`: the glazing bar's height in the glass. It
// was 0.42, from the drawn fallback, with no recorded reason, so the bottom pane was 40% taller than the top one.
const LAMP_HERO_FRAME_PVC = { inLo: 0.15, inHi: 0.6, day: [0.50, 0.84, [1, 1, 1]], night: [0.26, 0.52, [0.88, 0.95, 1.10]], bar: 0.5 };
function lampHeroPvcFilter(id, w, p) {
  const P = LAMP_HERO_FRAME_PVC, k = (p[1] - p[0]) / (P.inHi - P.inLo), off = p[0] - P.inLo * k;
  const row = function (c) { return [0.2126 * k * c, 0.7152 * k * c, 0.0722 * k * c, 0, off * c].map(function (v) { return +v.toFixed(4); }).join(' '); };
  return '<filter id="' + id + '" filterUnits="userSpaceOnUse" x="0" y="0" width="' + w + '" height="220" color-interpolation-filters="sRGB">' +
    '<feColorMatrix type="matrix" values="' + row(p[2][0]) + ' ' + row(p[2][1]) + ' ' + row(p[2][2]) + ' 0 0 0 1 0"/></filter>';
}
const LAMP_HERO_FRAME_CAST = { warm: '18,14,14', grey: '12,12,14', night: '0,10,32' };
// The room round the frames (8 Nov 2026, option 2b of design-docs/popup_hero_harmony_options.html). The frames
// stood on the bare sheet ground, a cut-out beside the #windows painting they came from. Now:
// - the sky in the glass takes the painting's saturation (LAMP_HERO_PLATE.saturate: 100% since 9 Nov 2026, 115% before that on the same day). By day it was the
//   most saturated colour of any header, p95 chroma 0.160 against the painting's 0.108;
// - the painting's own wall and skirting stand behind the frames (21 Nov 2026, option 5 "Wall and Skirting, Quiet
//   Night" of design-docs/windows_room_wall_options.html). Until then a faint radial wash stood there; it added only
//   OKLab dE 0.021 and the window seemed to hang in the middle of nowhere. The House picture reads as a room because
//   its wall has a foot, so the room sheets take the wall and the skirting, and leave the boards, the branch and the
//   leaf shadows to the House. LAMP_HERO_ROOM_WALL says where;
// - the window hangs partway up the wall (option 3, revision 2): the frames, the glass and the sill rise as one
//   group, scaled by `raise.scale` about the window's foot, so the sill is at `raise.sill`. Until then the sill stood
//   on the floor line and the window seemed to stand on the floor. From 8 Nov 2026 the sill was at y 96 at 0.85 (the
//   #windows painting's sill, 20% up the wall); on 21 Nov 2026 the household found it too low (C2 "Higher and Smaller"
//   of design-docs/windows_room_pvc_options.html): y 82 at 0.75, 32% up the wall, head at y 19;
// - the window's light is drawn as #windows draws it (option 5, revision 3): one soft shaft in the air from the
//   glass to the floor, and a print of the panes on the floor, the mapping of lampHeroSun: a point of the glass at
//   height y lands kk(HZ - y) px to the left, and 0.3 to 5.3px under the line, lower the higher it is on the glass
//   (5.3px: at 7.8px the #windows patch reached the body's headline box on a 360px telephone). A long soft glow lies
//   along the line under the print. The colours are the painting's own print (p95 138,166,203 by night and 227,204,131
//   by day): `gold` by the sun's elevation by day, grey under cloud or fog, `night` after sunset by the night share.
//   Since 24 Nov 2026 this drawing is only for a sky under cloud or fog (grey). A clear or fair sky takes
//   lampHeroRoomLight below. Until then it drew gold and silver too, and its shaft was grey on the navy wall (OKLCH C
//   0.007 against the House picture's 0.051). Its plus-lighter did nothing, because a clip-path group isolates its
//   content from what is below; the style is removed (0 pixels change).
const LAMP_HERO_ROOM = { raise: { sill: 82, scale: 0.75 }, kk: 0.85, grey: '206,204,196', night: '150,176,214',
  shaft: [0.16, 0.13], glow: [0.40, 0.30], soft: 0.5, sharp: 0.85 };
// The wall behind the room frames, in the px of the plate file. The crop (x 0 to w, y 0 to foot) holds the wall and
// the skirting, with no beam, no leaf shadow and no branch, so the live shaft is not doubled. It is drawn so that the
// plate's floor line (y foot) lands on the horizon, twice side by side from the sheet's right edge, the second copy
// mirrored. A straight fade on its left (from W - fade[0] to W - fade[1]) returns it to the stage; a straight edge
// never reads as a disc (d-138, d-144) and does not follow the text (d-115). Under cloud the wall takes the frames'
// filter. By night the plate's wall is twice as saturated as by day (OKLCH C 0.040 against 0.021): `nightSat` brings
// it to the day's level (C 0.024), so the wall only darkens after sunset; the household found it too blue.
const LAMP_HERO_ROOM_WALL = { w: 400, foot: 382, fade: [205, 150], nightSat: 0.6 };
// The light of a clear or fair sky: one soft field, from the sun by day and the moon by night (24 Nov 2026, option 7
// "From the Sun" of design-docs/windows_room_sun_options.html). All the light leaves one point S, far outside and up to
// the right: the left edge runs at 0.92 (x to y) and the right edge at 0.66, so the field opens by about 9 degrees.
// It is drawn as `wedges` thin wedges of one smooth profile, not as separate beams: a base (`veil`) with a soft edge, and
// broad rays that overlap and only change its strength. The rays follow the panes (at most four) loosely, and the
// strongest one runs on the line of the sun or the moon. Two layers cross over along the light: near the window the
// rays show, and near the floor they are wider and softer. The print is a soft pool with the panes only hinted in it.
// `jit`, `wid` and `str` are the rays' fixed offset, width and strength, in order across the light; nothing moves by day.
// - The glass holds a small sun at the top right of the last window. It sinks with the sun's elevation: 12px under the
//   head at 40 degrees and above, 45% of the glass down at the horizon. At night the glass holds the moon of the House
//   picture: its real phase, higher in the middle of the night. A cloud that crosses it covers it. The frames that
//   face the light are lit.
// - The air is deeper than the light, because a pale yellow on the navy wall makes olive grey. The blend (plus-lighter)
//   is on the clipped group itself, because a clip-path group isolates its content.
// - The night share mixes the sun into the moon at dusk. The sun leaves by a share of 0.5, and the moon comes after it.
const LAMP_HERO_ROOM_LIGHT = {
  air: [[0, '216,96,14'], [0.1, '214,110,18'], [0.17, '210,120,24'], [0.37, '208,122,30'], [0.5, '208,124,36'], [1, '206,130,50']],
  print: [[0, '255,160,92'], [0.1, '255,182,104'], [0.17, '255,186,102'], [0.37, '252,194,110'], [0.5, '252,200,120'], [1, '252,208,138']],
  moon: { air: '74,104,158', print: '150,178,220', hot: '214,226,246', r: 4.8 },
  beam: 0.78, nightBeam: 0.66, veil: 0.14, bounce: 0.18, skirt: 0.07, slope: [0.92, 0.66], wedges: 44,
  jit: [0.035, -0.045, 0.05, -0.02], wid: [0.036, 0.055, 0.028, 0.044], str: [0.6, 0.95, 0.5, 0.7]
};
// v: { o, k, id, W, HZ, T (the window group to the header), g (each window's glass, in the group's px), bx, box, foot, up, ns,
//   sky (the glass's sky, as a function), frac, phase, waning }. Each g: { gx, gy, gw, gh, open }. It gives the svg parts
// { defs, wall, glass, rim, light }. `glass` and `rim` go in the window group; `wall` and `light` in the header.
function lampHeroRoomLight(v) {
  const L = LAMP_HERO_ROOM_LIGHT, id = v.id, f = v.k.f, HZ = v.HZ, W = v.W, o = v.o, n = v.g.length, ns = v.ns, kk = LAMP_HERO_ROOM.kk, wide = v.pw > 40;
  const dayK = Math.max(0, 1 - 2 * ns), nightK = Math.max(0, 2 * ns - 1);
  const mx = function (a, b) { return lampHeroRoomMix(a, b, ns); };
  const air = mx(lampArcAt(L.air, v.up), L.moon.air), print = mx(lampArcAt(L.print, v.up), L.moon.print), hot = mx(LAMP_HERO_SUN_HOT, L.moon.hot);
  const near = lampHeroRoomMix(air, print, 0.28), gl = mx(lampArcAt(LAMP_HERO_SUN_GLASS, v.up), LAMP_HERO_NIGHT_GLASS), rim0 = lampHeroRoomMix(gl, print, 0.35);
  const beam = L.beam * (1 - (1 - L.nightBeam) * ns), poolA = 1 - 0.35 * ns, rimA = 1 - 0.45 * ns, add = ' style="mix-blend-mode:plus-lighter"';
  const g = v.g.map(function (w) {
    const a = v.T(w.gx, w.gy), b = v.T(w.gx + w.gw, w.gy + w.gh);
    return { x: w.gx, gx: w.gx, gy: w.gy, gw: w.gw, gh: w.gh, open: w.open, x0: a[0], y0: a[1], x1: b[0], y1: b[1] };
  });
  const stop = function (t, c, a) { return '<stop offset="' + t + '" stop-color="rgb(' + c + ')" stop-opacity="' + a + '"/>'; };
  const full = '<rect x="0" y="0" width="' + W + '" height="220" fill="';
  const P = function (q) { return f(q[0]) + ' ' + f(q[1]); };
  const last = g[n - 1];
  // Where the sun and the moon stand in the last glass, in the window group's px.
  const sun = [last.gx + last.gw - Math.min(9, last.gw * 0.24), last.gy + 12 + (last.gh * 0.45 - 12) * (1 - Math.min(1, v.up * 1.5))];
  const moonX = last.gx + last.gw * (n === 1 ? 0.72 : wide ? 0.26 : 0.36);
  // The panes: one point for each, and the two nearest merge until four are left. q is the place across the light.
  let gs = [];
  g.forEach(function (w) {
    const cols = wide ? [0.27, 0.73] : [0.5], rows = [0.25, 0.75], ww = w.x1 - w.x0, wh = w.y1 - w.y0;
    cols.forEach(function (c) { rows.forEach(function (r) { gs.push({ at: [w.x0 + ww * c, w.y0 + wh * r], q: w.x0 + ww * c + kk * (w.y0 + wh * r), m: 1, open: w.open }); }); });
  });
  gs.sort(function (a, b) { return a.q - b.q; });
  while (gs.length > 4) {
    let j = 0;
    for (let i = 1; i < gs.length - 1; i++) if (gs[i + 1].q - gs[i].q < gs[j + 1].q - gs[j].q - 0.01) j = i;
    const a = gs[j], b = gs[j + 1], m = a.m + b.m;
    gs.splice(j, 2, { at: [0, 1].map(function (x) { return (a.at[x] * a.m + b.at[x] * b.m) / m; }), q: (a.q * a.m + b.q * b.m) / m, m: m, open: a.open || b.open });
  }
  // The point S, and u: the place of a point's line on the diagonal from the first glass's top left to the last one's foot.
  const A0 = [g[0].x0, g[0].y0], A1 = [last.x1, last.y1], Sl = L.slope[0], Sr = L.slope[1];
  const Sy = (A0[0] + Sl * A0[1] - A1[0] - Sr * A1[1]) / (Sl - Sr), S = [A0[0] + Sl * (A0[1] - Sy), Sy];
  const ap = function (u) { return [A0[0] + (A1[0] - A0[0]) * u, A0[1] + (A1[1] - A0[1]) * u]; };
  const foot = function (q, y) { const t = (y - S[1]) / (q[1] - S[1]); return [S[0] + (q[0] - S[0]) * t, y]; };
  const uOf = function (pt) { const dx = pt[0] - S[0], dy = pt[1] - S[1], ex = A1[0] - A0[0], ey = A1[1] - A0[1]; return ((S[0] - A0[0]) * dy - (S[1] - A0[1]) * dx) / (ex * dy - ey * dx); };
  const R = LAMP_HERO_FRAME_OPEN.ray;
  const us = gs.map(function (e, i) { return { u: uOf(e.at) + L.jit[i % 4], w: L.wid[i % 4], s: e.open ? Math.min(1, L.str[i % 4] * R[0] + R[1]) : L.str[i % 4] }; });
  const at = nightK > 0 ? [moonX, last.gy + last.gh * 0.17] : sun;
  const lead = Math.max(0.2, Math.min(0.8, uOf(v.T(at[0], at[1]))));
  us.push({ u: lead, w: 0.06, s: 0.8 });
  const edge = function (u) { const q = Math.max(0, Math.min(1, Math.min(u / 0.36, (1 - u) / 0.42))); return q * q * (3 - 2 * q); };
  const prof = function (u, far) {
    let m = 0;
    us.forEach(function (e) { const d = (u - e.u) / (e.w * (1 + 0.75 * far)); m = 1 - (1 - m) * (1 - e.s * Math.exp(-d * d / 2)); });
    const veil = L.veil + 0.16 * far, q = (u - lead) / 0.5;
    return edge(u) * (veil + (1 - veil) * m) * (0.72 + 0.28 * Math.exp(-q * q / 2));
  };
  const up14 = function (u) { const q = ap(u), l = Math.hypot(q[0] - S[0], q[1] - S[1]); return [q[0] + (S[0] - q[0]) * 14 / l, q[1] + (S[1] - q[1]) * 14 / l]; };
  const wedges = function (far) {
    let out = '';
    for (let i = 0; i < L.wedges; i++) {
      const u0 = i / L.wedges, u1 = (i + 1) / L.wedges, a = prof((u0 + u1) / 2, far);
      if (a < 0.004) continue;
      out += '<path d="M' + P(up14(u0)) + 'L' + P(up14(u1)) + 'L' + P(foot(ap(u1), HZ + 14)) + 'L' + P(foot(ap(u0), HZ + 14)) + 'Z" fill-opacity="' + a.toFixed(3) + '"/>';
    }
    return out;
  };
  // Along the light, on the field's middle line: from the glass to the floor.
  const m0 = ap(0.5), s0 = [m0[0] + 26, m0[1] - 33], s1 = foot(m0, HZ + 4);
  const lin = function (nm, inner) { return '<linearGradient id="' + id + nm + '" gradientUnits="userSpaceOnUse" x1="' + f(s0[0]) + '" y1="' + f(s0[1]) + '" x2="' + f(s1[0]) + '" y2="' + f(s1[1]) + '">' + inner + '</linearGradient>'; };
  const mask = function (nm, inner) { return '<mask id="' + id + nm + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220">' + inner + '</mask>'; };
  const blur2 = function (nm, sx, sy) { return '<filter id="' + id + nm + '" filterUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220"><feGaussianBlur stdDeviation="' + sx + ' ' + sy + '"/></filter>'; };
  const al = function (x) { return (beam * x).toFixed(3); };
  let defs = lin('la', stop(0.12, near, 0) + stop(0.3, near, al(0.3)) + stop(0.44, near, al(0.82)) + stop(0.54, near, al(1)) + stop(0.7, air, al(0.86)) + stop(0.85, air, al(0.62)) + stop(1, air, al(0.36))) +
    lin('ln', stop(0.5, '255,255,255', 1) + stop(0.95, '255,255,255', 0)) + lin('lr', stop(0.5, '255,255,255', 0) + stop(0.95, '255,255,255', 1)) +
    mask('lN', full + 'url(#' + id + 'ln)"/>') + mask('lR', full + 'url(#' + id + 'lr)"/>') +
    v.k.blur('l1', 1.5) + v.k.blur('l3', 3.6) + v.k.blur('l9', 9) + v.k.blur('l0', 0.35) + blur2('lx', 3.4, 0.55) + blur2('ly', 9, 1.1) +
    mask('lM', '<g mask="url(#' + id + 'lN)"><g fill="#fff" filter="url(#' + id + 'l1)">' + wedges(0) + '</g></g><g mask="url(#' + id + 'lR)"><g fill="#fff" filter="url(#' + id + 'l3)">' + wedges(1) + '</g></g>') +
    '<clipPath id="' + id + 'ls"><rect x="0" y="111.5" width="' + W + '" height="8.5"/></clipPath>';
  const lo = foot(A0, HZ)[0], hi = foot(A1, HZ)[0], half = (hi - lo) / 2, lx = foot(ap(lead), HZ)[0], cx = (lo + hi) / 2 * 0.55 + lx * 0.45;
  // The floor's light on the wall above it, and then the field and the skirting.
  const wall = '<g clip-path="url(#' + id + 'fl)"' + add + '><ellipse cx="' + f(cx) + '" cy="' + (HZ + 2) + '" rx="' + f(half) + '" ry="22" fill="rgb(' + air + ')" fill-opacity="' + L.bounce + '" filter="url(#' + id + 'l9)"/></g>';
  let light = '<g clip-path="url(#' + id + 'fl)"' + add + '><g mask="url(#' + id + 'lM)">' + full + 'url(#' + id + 'la)"/></g></g>' +
    '<g clip-path="url(#' + id + 'ls)"' + add + '><ellipse cx="' + f(cx) + '" cy="116" rx="' + f(half * 0.95) + '" ry="7" fill="rgb(' + air + ')" fill-opacity="' + L.skirt + '" filter="url(#' + id + 'l3)"/></g>';
  // The floor: a pool, and the panes hinted in it. The blur runs along the floor, and hardly up or down: the body's
  // headline box starts at y 127 (Law 13.1).
  let pr = '';
  g.forEach(function (w) {
    const wh = w.y1 - w.y0, yb = (w.y0 + w.y1) / 2, xm = (w.x0 + w.x1) / 2;
    const mp = function (x, y) { return [foot([x, y], HZ)[0], HZ + 0.3 + (w.y1 - y) / wh * 5]; };
    const quad = function (xa, ya, xb, yb2) { return 'M' + [mp(xa, ya), mp(xb, ya), mp(xb, yb2), mp(xa, yb2)].map(P).join('L') + 'Z'; };
    const cols = !w.open && wide ? [[w.x0, xm - 1], [xm + 1, w.x1]] : [[w.x0, w.x1]];
    cols.forEach(function (c) { pr += w.open ? quad(c[0], w.y0, c[1], w.y1) : quad(c[0], w.y0, c[1], yb - 1) + quad(c[0], yb + 1, c[1], w.y1); });
  });
  defs += '<linearGradient id="' + id + 'lp" gradientUnits="userSpaceOnUse" x1="' + f(lo) + '" x2="' + f(hi) + '" y1="0" y2="0">' +
    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(function (u) { return stop(u, print, Math.min(1, prof(u, 1) * 1.15).toFixed(3)); }).join('') + '</linearGradient>' +
    '<radialGradient id="' + id + 'lc">' + stop(0, hot, 0.5) + stop(0.4, hot, 0.24) + stop(1, hot, 0) + '</radialGradient>';
  light += '<ellipse cx="' + f(cx) + '" cy="' + (HZ + 1.6) + '" rx="' + f(half * 0.86) + '" ry="2.3" fill="rgb(' + air + ')" fill-opacity="' + f(0.6 * poolA) + '" filter="url(#' + id + 'ly)"/>' +
    '<path d="' + pr + '" fill="url(#' + id + 'lp)" fill-opacity="' + f(0.85 * poolA) + '" filter="url(#' + id + 'lx)"/>' +
    '<ellipse cx="' + f(lx * 0.6 + cx * 0.4) + '" cy="' + (HZ + 2.4) + '" rx="' + f(half * 0.62) + '" ry="2.2" fill="url(#' + id + 'lc)" fill-opacity="' + f(poolA) + '"/>';
  // The sun in the glass.
  let glass = '', rim = '';
  const gx0 = g[0].gx, gx1 = last.gx + last.gw, box = 'x="' + f(gx0) + '" y="' + f(g[0].gy) + '" width="' + f(gx1 - gx0) + '" height="' + f(g[0].gh) + '"';
  const rad = function (nm, r, inner) { return '<radialGradient id="' + id + nm + '" gradientUnits="userSpaceOnUse" cx="' + f(sun[0]) + '" cy="' + f(sun[1]) + '" r="' + r + '">' + inner + '</radialGradient>'; };
  defs += '<clipPath id="' + id + 'lg">' + g.map(function (w) { return '<rect x="' + f(w.gx) + '" y="' + f(w.gy) + '" width="' + f(w.gw) + '" height="' + f(w.gh) + '"/>'; }).join('') + '</clipPath>' +
    rad('lq', 92, stop(0, '255,226,150', 0.4 * dayK) + stop(0.14, '255,206,110', 0.3 * dayK) + stop(0.34, '255,180,70', 0.2 * dayK) + stop(0.62, '255,160,50', 0.11 * dayK) + stop(1, '255,150,40', 0.05 * dayK)) +
    rad('ld', 26, stop(0, hot, dayK) + stop(0.15, hot, 0.96 * dayK) + stop(0.3, rim0, 0.74 * dayK) + stop(0.6, rim0, 0.3 * dayK) + stop(1, rim0, 0)) +
    rad('lo', 17, stop(0, gl, 0.4 * dayK) + stop(0.55, gl, 0.12 * dayK) + stop(1, gl, 0));
  // The sun's layers draw by night too, with no strength: without them the browser sets the edges of the frames a
  // fraction of a pixel away (8 of 255 on a 1px line).
  glass = '<g clip-path="url(#' + id + 'lg)"' + add + '><rect ' + box + ' fill="url(#' + id + 'lq)"/></g><g clip-path="url(#' + id + 'lg)"><rect ' + box + ' fill="url(#' + id + 'ld)"/></g>';
  rim = '<circle cx="' + f(sun[0]) + '" cy="' + f(sun[1]) + '" r="17" fill="url(#' + id + 'lo)"' + add + '/>';
  // The moon in the glass, as lampHeroPlate draws it. The bright parts of the sky cut the disc; its glow stays.
  if (nightK > 0) {
    const r = L.moon.r, ph = v.phase == null ? 1 : v.phase, ex = r * Math.abs(1 - 2 * ph), mX = moonX;
    const mY = last.gy + last.gh * (0.34 - 0.18 * Math.sin(Math.PI * Math.max(0, Math.min(1, v.frac == null ? 0.4 : v.frac))));
    const turn = !v.waning ? '' : ' transform="translate(' + f(2 * mX) + ' 0) scale(-1 1)"';
    defs += '<radialGradient id="' + id + 'lh">' + stop(0, LAMP_HERO_SILVER, 0.75) + stop(0.35, '150,178,235', 0.3) + stop(1, '150,178,235', 0) + '</radialGradient>' +
      mask('lm', full + '#fff"/><g filter="url(#' + id + 'lf)">' + v.sky() + '</g>') +
      '<filter id="' + id + 'lf" filterUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="220" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ' + [0.2126, 0.7152, 0.0722].map(function (c) { return (c * 3.4).toFixed(3); }).join(' ') + ' 0 -1.36"/></filter>' +
      '<radialGradient id="' + id + 'le" cx=".38" cy=".35" r=".75">' + stop(0, '255,255,255', 1) + stop(0.6, LAMP_HERO_SILVER, 1) + stop(1, '188,202,232', 1) + '</radialGradient>' +
      '<clipPath id="' + id + 'lw"><rect x="' + f(last.gx) + '" y="' + f(last.gy) + '" width="' + f(last.gw) + '" height="' + f(last.gh) + '"/></clipPath>';
    glass += '<g clip-path="url(#' + id + 'lw)"' + add + ' opacity="' + f(nightK * Math.max(0.3, ph)) + '"><circle cx="' + f(mX) + '" cy="' + f(mY) + '" r="' + f(r * 3.4) + '" fill="url(#' + id + 'lh)"/></g>' +
      '<g mask="url(#' + id + 'lm)" opacity="' + f(nightK) + '"><path' + turn + ' d="M' + f(mX) + ' ' + f(mY - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + f(mX) + ' ' + f(mY + r) + 'A' + f(Math.max(ex, 0.01)) + ' ' + r + ' 0 0 ' + (ph < 0.5 ? 0 : 1) + ' ' + f(mX) + ' ' + f(mY - r) + 'Z" fill="url(#' + id + 'le)"/></g>';
  }
  // The frames that face the light: the left reveal and the foot of each opening, and the top of the sill.
  const ln = function (x1, y1, x2, y2, c, a) { return '<path d="M' + f(x1) + ' ' + f(y1) + 'L' + f(x2) + ' ' + f(y2) + '" stroke="rgb(' + c + ')" stroke-opacity="' + a + '" stroke-width="1.3" filter="url(#' + id + 'l0)"/>'; };
  g.forEach(function (w) { rim += ln(w.gx - 0.6, w.gy + 2, w.gx - 0.6, w.gy + w.gh + 0.4, print, 0.9 * rimA) + ln(w.gx - 0.6, w.gy + w.gh + 0.6, w.gx + w.gw, w.gy + w.gh + 0.6, print, 0.9 * rimA); });
  defs += '<linearGradient id="' + id + 'lk" gradientUnits="userSpaceOnUse" x1="' + (v.bx - 7) + '" x2="' + (v.bx + v.box + 7) + '" y1="0" y2="0">' + stop(0, print, 0.6) + stop(0.35, hot, 1) + stop(0.75, print, 0.8) + stop(1, print, 0.2) + '</linearGradient>';
  rim += '<rect x="' + (v.bx - 7) + '" y="' + f(v.foot - 0.2) + '" width="' + (v.box + 14) + '" height="1.5" fill="url(#' + id + 'lk)" fill-opacity="' + f(rimA) + '" filter="url(#' + id + 'l0)"/>';
  return { defs: defs, wall: wall, glass: glass, rim: rim, light: light };
}
function lampHeroRoomMix(a, b, t) {
  a = a.split(',').map(Number); b = b.split(',').map(Number);
  return a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',');
}
function lampHeroFrames(o) {
  const k = lampHeroKit(o), f = k.f, id = o.id, HZ = k.HZ, P = LAMP_HERO_FRAME, n = o.windows.length;
  const box = 104, bx = o.W - 161, top = 36, foot = 117, h = foot - top, ov = 0.25;
  const q = n === 1 ? 1 : n === 2 ? 0.78 : 0.55, S = P.scale * q, gap = n > 1 ? 5 : 0, pw = (box - gap * (n - 1)) / n;
  const sideW = (P.oR - P.gR) * S, topH = (P.gT - P.oT) * S, footH = (P.sT - P.gF) * S, sq = P.scale * (n === 1 ? 1 : 0.9), sillH = (P.sB - P.sT) * sq, capW = P.capW * sq;
  const mat = o.nightShare > 0.5 ? 'night' : o.muted ? 'grey' : 'warm', cast = 'rgb(' + LAMP_HERO_FRAME_CAST[mat] + ')';
  const rect = function (x, y, w, hh, fill, extra) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(hh) + '"' + (fill ? ' fill="' + fill + '"' : '') + (extra || '') + '/>';
  };
  const sky = function () {
    return '<image href="' + lampEsc(o.urlA) + '" x="' + (bx - 150) + '" y="' + (top - 20) + '" width="420" height="140" preserveAspectRatio="xMidYMid slice"/>' +
      (o.urlB ? '<image href="' + lampEsc(o.urlB) + '" x="' + (bx - 150) + '" y="' + (top - 20) + '" width="420" height="140" preserveAspectRatio="xMidYMid slice" opacity="' + o.t + '"/>' : '');
  };
  // All the slices of one plate image.
  const slices = function (href) {
    const piece = function (sx, sy, sw, sh, dx, dy, dw, dh, flip) {
      const im = '<image href="' + lampEsc(href) + '" x="0" y="0" width="' + P.w + '" height="' + P.h + '" preserveAspectRatio="none"/>';
      return '<svg x="' + f(dx) + '" y="' + f(dy) + '" width="' + f(dw) + '" height="' + f(dh) + '" viewBox="' + sx + ' ' + sy + ' ' + sw + ' ' + sh +
        '" preserveAspectRatio="none" style="overflow:hidden;width:' + f(dw) + 'px;height:' + f(dh) + 'px">' +
        (flip ? '<g transform="translate(' + (2 * sx + sw) + ' 0) scale(-1 1)">' + im + '</g>' : im) + '</svg>';
    };
    const sw = P.oR - P.gR, th = P.gT - P.oT, fh = P.sT - P.gF;
    let out = '';
    o.windows.forEach(function (w, i) {
      const x = bx + i * (pw + gap), gx = x + sideW, gy = top + topH, gw = pw - 2 * sideW, gh = h - topH - footH;
      // The sides first, then the top and the foot over them. Each overlaps its neighbour by 0.25px, so no seam shows.
      out += piece(P.gR, P.sideY, sw, P.sideH, gx + gw, gy - ov, sideW, gh + 2 * ov) + piece(P.gR, P.sideY, sw, P.sideH, x, gy - ov, sideW, gh + 2 * ov, true) +
        piece(P.runX, P.oT, P.runW, th, gx - ov, top, gw + 2 * ov, topH) + piece(P.runX, P.gF, P.runW, fh, gx - ov, gy + gh, gw + 2 * ov, footH) +
        piece(P.gR, P.oT, sw, th, gx + gw, top, sideW, topH) + piece(P.gR, P.oT, sw, th, x, top, sideW, topH, true) +
        piece(P.gR, P.gF, sw, fh, gx + gw, gy + gh, sideW, footH) + piece(P.gR, P.gF, sw, fh, x, gy + gh, sideW, footH, true);
      if (w.open) return;
      const bh = P.barH * S;
      out += piece(P.runX, P.barY, P.runW, P.barH, gx - ov, gy + gh * LAMP_HERO_FRAME_PVC.bar - bh / 2, gw + 2 * ov, bh);
      if (pw > 40) { const bw = P.mulW * S; out += piece(P.mulX, P.mulY, P.mulW, P.mulH, gx + gw / 2 - bw / 2, gy, bw, gh); }
    });
    // The shadow under the sill is drawn outside the paint filter (in the window group), so it stays dark.
    return out +
      piece(P.runX, P.sT, P.runW, P.sB - P.sT, bx - 7 + capW - ov, foot, box + 14 - 2 * capW + 2 * ov, sillH) +
      piece(P.capR, P.sT, P.capW, P.sB - P.sT, bx + box + 7 - capW, foot, capW, sillH) + piece(P.capR, P.sT, P.capW, P.sB - P.sT, bx - 7, foot, capW, sillH, true);
  };
  const R = LAMP_HERO_ROOM, cx = bx + box / 2, ns = Math.max(0, Math.min(1, o.nightShare || 0));
  const sat = LAMP_HERO_PLATE.saturate, calm = sat !== 1 ? ' filter="url(#' + id + 'ss)"' : '';
  const up = Math.max(0, Math.min(60, isFinite(o.elev) ? o.elev : 30)) / 60;
  const lc = lampHeroRoomMix(R.grey, R.night, ns);
  const mixA = function (pair) { return pair[0] + (pair[1] - pair[0]) * ns; };
  // The raise: local (x, y) of the window group to the header.
  const s = R.raise.scale, lift = HZ - R.raise.sill;
  const T = function (x, y) { return [cx + (x - cx) * s, HZ - lift + (y - HZ) * s]; };
  const lifted = 'translate(' + f(cx) + ' ' + f(HZ - lift) + ') scale(' + s + ') translate(' + f(-cx) + ' ' + (-HZ) + ')';
  const RW = LAMP_HERO_ROOM_WALL, ws = HZ / RW.foot, ww = RW.w * ws;
  const room = '<linearGradient id="' + id + 'rl" gradientUnits="userSpaceOnUse" x1="' + (o.W - RW.fade[0]) + '" y1="0" x2="' + (o.W - RW.fade[1]) + '" y2="0">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>' +
    '<mask id="' + id + 'rm" maskUnits="userSpaceOnUse" x="0" y="0" width="' + o.W + '" height="220"><rect x="0" y="0" width="' + o.W + '" height="220" fill="url(#' + id + 'rl)"/></mask>' +
    '<filter id="' + id + 'rn" filterUnits="userSpaceOnUse" x="0" y="0" width="' + o.W + '" height="220" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="' + RW.nightSat + '"/></filter>' +
    k.blur('b3r', 3) + k.blur('b5r', 5) + '<clipPath id="' + id + 'fl"><rect x="0" y="0" width="' + o.W + '" height="' + HZ + '"/></clipPath>' +
    (calm ? '<filter id="' + id + 'ss" filterUnits="userSpaceOnUse" x="0" y="0" width="' + o.W + '" height="220" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="' + sat + '"/></filter>' : '');
  let under = '', clip = '', glass = '', glow = '', sash = '', opened = 0, printD = '', shaftD = '', lo = 1e9, hi = -1e9;
  const P2 = function (p) { return f(p[0]) + ' ' + f(p[1]); };
  o.windows.forEach(function (w, i) {
    const x = bx + i * (pw + gap), gx = x + sideW, gy = top + topH, gw = pw - 2 * sideW, gh = h - topH - footH;
    under += rect(x + 0.9, top + 0.9, pw, h, cast, ' fill-opacity=".7" filter="url(#' + id + 'b0)"');
    // The light through this window's glass, in the header's own coordinates.
    const a = T(gx, gy), b = T(gx + gw, gy + gh), x0 = a[0], y0 = a[1], x1 = b[0], y1 = b[1], wh = y1 - y0, yb = y0 + wh * LAMP_HERO_FRAME_PVC.bar, g = 1.4 * s;
    const map = function (px, py) { return [px - R.kk * (HZ - py), HZ + 0.3 + (y1 - py) / wh * 5]; };
    const quad = function (q) { return 'M' + [map(q[0], q[1]), map(q[2], q[1]), map(q[2], q[3]), map(q[0], q[3])].map(P2).join('L') + 'Z'; };
    const cols = (!w.open && pw > 40) ? [[x0, (x0 + x1) / 2 - g], [(x0 + x1) / 2 + g, x1]] : [[x0, x1]];
    cols.forEach(function (c) { printD += w.open ? quad([c[0], y0, c[1], y1]) : quad([c[0], y0, c[1], yb - g]) + quad([c[0], yb + g, c[1], y1]); });
    shaftD += 'M' + P2([x0, y0]) + 'L' + P2([x1, y0]) + 'L' + P2([x1, y1]) + 'L' + P2(map(x1, y1)) + 'L' + P2(map(x0, y1)) + 'L' + P2(map(x0, y0)) + 'Z';
    lo = Math.min(lo, map(x0, y0)[0]); hi = Math.max(hi, map(x1, y1)[0]);
    if (!w.open) { clip += rect(gx, gy, gw, gh); return; }
    opened++;
    glass += '<clipPath id="' + id + 'o' + i + '">' + rect(gx, gy, gw, gh) + '</clipPath><g clip-path="url(#' + id + 'o' + i + ')"' + calm + '>' + sky() + '</g>';
    // The open casement and its light stay over the filter and over the sunlight.
    const g2 = lampHeroOpenWindow({ id: id, i: i, f: f, mat: mat, right: i >= (n - 1) / 2, fr: LAMP_HERO_FRAME_OPEN.w[Math.min(n, 3) - 1], x: x, pw: pw,
      gx: gx, gy: gy, gw: gw, gh: gh, foot: foot, footH: footH, sillH: sillH, bx: bx, box: box });
    glow += g2.over; sash += g2.sash + g2.front;
  });
  const mute = '<filter id="' + id + 'de" filterUnits="userSpaceOnUse" x="0" y="0" width="' + o.W + '" height="220" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".2"/></filter>';
  const layers = (o.nightShare < 1 ? '<g' + (o.muted ? ' filter="url(#' + id + 'de)"' : '') + '><g filter="url(#' + id + 'pd)">' + slices(o.plates.day) + '</g></g>' : '') +
    (o.nightShare > 0 ? '<g opacity="' + o.nightShare + '"><g filter="url(#' + id + 'pn)">' + slices(o.plates.night) + '</g></g>' : '');
  const pvc = lampHeroPvcFilter(id + 'pd', o.W, LAMP_HERO_FRAME_PVC.day) + lampHeroPvcFilter(id + 'pn', o.W, LAMP_HERO_FRAME_PVC.night);
  const band = function (href) {
    const im = '<image href="' + lampEsc(href) + '" x="0" y="0" width="' + P.w + '" height="' + P.h + '" preserveAspectRatio="none"/>';
    const one = function (dx, flip) {
      return '<svg x="' + f(dx) + '" y="0" width="' + f(ww + 0.5) + '" height="' + f(HZ) + '" viewBox="0 0 ' + RW.w + ' ' + RW.foot + '" preserveAspectRatio="none" style="overflow:hidden;width:' +
        f(ww + 0.5) + 'px;height:' + f(HZ) + 'px">' + (flip ? '<g transform="translate(' + RW.w + ' 0) scale(-1 1)">' + im + '</g>' : im) + '</svg>';
    };
    return one(o.W - ww) + one(o.W - 2 * ww, true);
  };
  const wall = '<g mask="url(#' + id + 'rm)">' + (o.nightShare < 1 ? '<g' + (o.muted ? ' filter="url(#' + id + 'de)"' : '') + '>' + band(o.plates.day) + '</g>' : '') +
    (o.nightShare > 0 ? '<g opacity="' + o.nightShare + '" filter="url(#' + id + 'rn)">' + band(o.plates.night) + '</g>' : '') + '</g>';
  // A clear or fair sky: the field, the sun or the moon, and the lit frames. Under cloud or fog: the grey shaft below.
  const lit = o.muted ? null : lampHeroRoomLight({ o: o, k: k, id: id, W: o.W, HZ: HZ, T: T, bx: bx, box: box, foot: foot, pw: pw, up: up, ns: ns, sky: sky,
    frac: o.frac, phase: o.phase, waning: o.waning,
    g: o.windows.map(function (w, i) { const x = bx + i * (pw + gap); return { gx: x + sideW, gy: top + topH, gw: pw - 2 * sideW, gh: h - topH - footH, open: w.open }; }) });
  const light = lit ? lit.light : '<g clip-path="url(#' + id + 'fl)"><path d="' + shaftD + '" fill="rgb(' + lc + ')" fill-opacity="' + mixA(R.shaft).toFixed(3) +
      '" filter="url(#' + id + 'b5r)"/></g>' +
    '<ellipse cx="' + f((lo + hi) / 2) + '" cy="' + HZ + '" rx="' + f((hi - lo) / 2 + 6) + '" ry="2.6" fill="rgb(' + lc + ')" fill-opacity="' + mixA(R.glow).toFixed(3) + '" filter="url(#' + id + 'b3r)"/>' +
    '<path d="' + printD + '" fill="rgb(' + lc + ')" fill-opacity="' + R.soft + '" filter="url(#' + id + 'b3r)"/>' +
    '<path d="' + printD + '" fill="rgb(' + lc + ')" fill-opacity="' + R.sharp + '" filter="url(#' + id + 'b0)"/>';
  const svg = k.svg(k.defs((lit ? lit.defs : '') + k.blur('b0', 0.6) + (opened ? k.blur('ob', 1.6) + k.blur('ow', 4) : '') + pvc + mute + room + '<clipPath id="' + id + 'cp">' + clip + '</clipPath>') + wall + (lit ? lit.wall : '') + k.horizon(k.L - 40, k.R) +
    '<g transform="' + lifted + '">' + under + '<g clip-path="url(#' + id + 'cp)"' + calm + '>' + sky() + '</g>' + glass + (lit ? lit.glass : '') +
    rect(bx - 7, foot + sillH - 1, box + 14, 3, cast, ' fill-opacity=".6" filter="url(#' + id + 'b0)"') + layers + (lit ? lit.rim : '') + '</g>' + light +
    (opened ? '<g transform="' + lifted + '">' + glow + sash + '</g>' : ''));
  return { svg: svg, x: bx + box / 2, y: HZ - 50, at: opened ? LAMP_HERO_OPEN : LAMP_HERO_WALL };
}

// Sunlight and moonlight on #windows: one window seen from inside, the light falling to the floor.
// o: { frac (0 to 1 along the light period, for the night), elev (the sun's elevation in degrees, for
// the day), night, open (any window open), phase (the moon's lit fraction), waning }.
// Option 6 "Silver Moonlight" of design-docs/windows_frame_options.html, 31 Oct 2026. By day it is
// option 5 "Clear Sunbeams", after the household's reference "Golden Sunbeams Through a Four-Pane
// Window"; by night, after "Moonlit Window with Silvery Rays".
// - The frame is solid: a 3.6px ring and 2.6px bars, dark against the light (warm grey by day, navy by
//   night), with a sill and a reveal. The glass's light spreads a little over its inner edges.
// - The glass holds a sky. By day: cool at the top left, the light's colour, a deeper gold at the
//   bottom right, three gold clouds, and a sun with a short starburst that rises in the right panes
//   with its elevation. By night: navy, nine stars, silver-edged clouds, and the moon at its real
//   phase, which rises and sets with the night. The clouds carry no weather.
// - Four broad beams start inside the panes and pass in front of the frame (the household keeps the
//   rays that start in the pane). Their sides are sharp and nothing glows round the window: the
//   household found a halo hazy (option 4). The bar shadows start at the window's edge.
// - The light's colour is Hard Light's (30 Oct 2026): by day it follows the sun's elevation; the deeper
//   gold never passes HSV 0.65 (the cap is 0.69). By night it is LAMP_ARC_NIGHT, by the place in the night.
// - The window's four panes lie on the floor, 0.3px to 5.3px under the floor line, by day and by night.
//   The body's headline box starts at y 127 (Law 13.1); at 7.8px deep the patch reached into it on a
//   360px telephone (30 Oct 2026).
// - An open window turns its right casement in the opening, with open-blue glass and a glowing blue
//   outline, and the light is 25% stronger.
// The light adds over the sheet's ground with plus-lighter. A browser that does not draw plus-lighter
// paints the layers normally.
function lampHeroSun(o) {
  const k = lampHeroKit(o), f = k.f, id = o.id, HZ = k.HZ, open = o.open, day = !o.night;
  const frac = Math.max(0, Math.min(1, o.frac));
  const up = Math.max(0, Math.min(60, o.elev || 0)) / 60;
  const C = day ? lampArcAt(LAMP_HERO_SUN_FLOOR, up) : lampArcAt(LAMP_ARC_NIGHT, frac);
  const CT = day ? lampArcAt(LAMP_HERO_SUN_GLASS, up) : LAMP_HERO_NIGHT_GLASS;
  const SV = LAMP_HERO_SILVER;
  const ng = day ? 1.45 : 1.2;                       // the light is 45% (night 20%) stronger than the Arc's
  const pool = open ? 1.25 : 1;
  const add = day ? ' style="mix-blend-mode:plus-lighter"' : '';
  const addN = ' style="mix-blend-mode:plus-lighter"';
  const lerp = function (p, q, t) { return p + (q - p) * t; };
  const x0 = o.W - 129, y0 = 30, ww = 56, wh = 66, x1 = x0 + ww, y1 = y0 + wh, xm = x0 + ww / 2, yb = y0 + wh * 0.45;
  const kk = 0.85;                                   // the light falls 0.85px left for each px down
  const pr = function (x, y) { return [x - kk * (HZ - y), HZ]; };
  const P = function (pt) { return f(pt[0]) + ' ' + f(pt[1]); };
  const rect = function (x, y, w, h, extra) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"' + (extra || '') + '/>';
  };
  const a = pr(x0, y0), b = pr(x1, y1), mid = f((a[0] + b[0]) / 2);
  const shaft = 'M' + x1 + ' ' + y0 + 'L' + x0 + ' ' + y0 + 'L' + P(a) + 'L' + P(b) + 'L' + x1 + ' ' + y1 + 'Z';
  const bar = function (sx, sy) {
    return '<path d="M' + f(sx) + ' ' + f(sy) + 'L' + P(pr(sx, sy)) + '" stroke="#101219" stroke-opacity="' + (day ? '.7' : '.55') +
      '" stroke-width="' + (day ? 2.2 : 2.6) + '" filter="url(#' + id + 'b0)"/>';
  };
  const bars = (open ? '' : bar(xm + 14, y0)) + bar(xm, y0 + 6) + bar(x0, yb) + bar(x0 + ww * 0.5, yb);

  // The frame: fo is the outer edge, fw its width; the glass is inside it.
  const fo = 1, fw = 3.6, bw = 2.6;
  const ox = x0 - fo, oy = y0 - fo, ow = ww + 2 * fo, oh = wh + 2 * fo;
  const gx = ox + fw, gy = oy + fw, gw = ow - 2 * fw, gh = oh - 2 * fw;
  const pd = function (q) { return 'M' + f(q[0]) + ' ' + f(q[1]) + 'h' + f(q[2]) + 'v' + f(q[3]) + 'h' + f(-q[2]) + 'Z'; };
  const panes = [[gx, gy, xm - bw / 2 - gx, yb - bw / 2 - gy], [xm + bw / 2, gy, gx + gw - xm - bw / 2, yb - bw / 2 - gy],
    [gx, yb + bw / 2, xm - bw / 2 - gx, gy + gh - yb - bw / 2], [xm + bw / 2, yb + bw / 2, gx + gw - xm - bw / 2, gy + gh - yb - bw / 2]];
  // An open casement: the left half keeps its panes, the right half is a clear opening.
  const openD = 'M' + f(xm + bw / 2) + ' ' + f(gy) + 'H' + f(gx + gw) + 'V' + f(gy + gh) + 'H' + f(xm + bw / 2) + 'Z';
  const glassD = open ? pd(panes[0]) + pd(panes[2]) : panes.map(pd).join('');
  const allD = glassD + (open ? openD : '');
  const ringD = pd([ox, oy, ow, oh]) + allD;
  const PT = day ? LAMP_HERO_FRAME_DAY : LAMP_HERO_FRAME_NIGHT;
  const frame = '<path fill-rule="evenodd" d="' + ringD + '" fill="url(#' + id + 'pf)"/>' +
    '<path fill-rule="evenodd" d="' + ringD + '" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width=".6" clip-path="url(#' + id + 'tl)"/>';
  // The glass's light over the frame's inner edges (the eye's halation): the bars look thinner.
  const bloom = '<g clip-path="url(#' + id + 'oc)"><path d="' + allD + '" fill="url(#' + id + 'gl)" fill-opacity="' + (day ? '.5' : '.4') +
    '" filter="url(#' + id + 'b5)"' + addN + '/></g>';
  // The reveal: by day the sun lights the left jamb under the frame's shadow line.
  const rv = 3.4;
  const reveal = day ? '<path d="M' + f(ox - rv) + ' ' + f(oy + 10) + 'L' + f(ox) + ' ' + f(oy + 6) + 'V' + f(oy + oh) + 'H' + f(ox - rv) + 'Z" fill="url(#' + id + 'jm)"' + add + '/>' : '';
  // The sill: a shelf 7px wider than the opening on each side, its top lit, its shadow on the wall.
  const sx0 = ox - rv - 4, sw = ow + 2 * rv + 8, sy = oy + oh;
  const sill = rect(sx0, sy + 3, sw, 4, ' fill="#000" fill-opacity=".5" filter="url(#' + id + 'b0)"') +
    rect(sx0, sy, sw, 3.6, ' rx=".8" fill="url(#' + id + 'sl)"') +
    rect(sx0 + 0.5, sy, sw - 1, 0.9, ' fill="rgb(' + CT + ')" fill-opacity="' + (day ? '.75' : '.35') + '"' + addN) +    (day ? '<path d="M' + f(x0 + 3) + ' ' + f(sy + 0.2) + 'H' + f(x0 + ww * 0.62) + '" stroke="rgb(' + LAMP_HERO_SUN_HOT + ')" stroke-opacity=".7" stroke-width="1.1" filter="url(#' + id + 'b0)"' + addN + '/>' : '');
  // The open casement, hinged on the right and turned into the room: open-blue glass, frame paint, and
  // a glowing blue outline.
  const sashD = 'M' + f(gx + gw) + ' ' + f(gy) + 'L' + f(gx + gw - 7) + ' ' + f(gy + 3) + 'L' + f(gx + gw - 7) + ' ' + f(gy + gh - 3) + 'L' + f(gx + gw) + ' ' + f(gy + gh) + 'Z';
  const sash = open ? '<path d="' + sashD + '" fill="rgb(' + LAMP_HERO_OPEN + ')" fill-opacity=".45" filter="url(#' + id + 'b1)"' + addN + '/>' +
    '<path d="' + sashD + '" fill="rgb(' + LAMP_HERO_OPEN + ')" fill-opacity=".6"/>' +
    '<path d="' + sashD + '" fill="none" stroke="url(#' + id + 'pf)" stroke-width="2" stroke-linejoin="round"/>' +
    k.lit(sashD, 'rgb(' + LAMP_HERO_OPEN + ')') : '';
  // The bar shadows start at the window's edge: no shadow shows on bright glass.
  const mask = '<mask id="' + id + 'mk" maskUnits="userSpaceOnUse" x="0" y="0" width="' + o.W + '" height="220">' +
    '<rect width="' + o.W + '" height="220" fill="#fff"/>' + rect(ox - 0.5, oy - 0.5, ow + 1, oh + 4, ' fill="#000" filter="url(#' + id + 'b0)"') + '</mask>';

  // The window on the floor: a point of the glass at (x, y) lands kk(HZ - y) to the left, and lower the
  // higher it is on the glass. A glazing bar's shadow is 2.8px wide.
  const map = function (x, y) { return [x - kk * (HZ - y), HZ + 0.3 + (y1 - y) / wh * 5]; };
  const quad = function (q) { return 'M' + [map(q[0], q[1]), map(q[2], q[1]), map(q[2], q[3]), map(q[0], q[3])].map(P).join('L') + 'Z'; };
  const g = 1.4;
  const printD = [[x0 + 3, y0 + 3, xm - g, yb - g], [xm + g, y0 + 3, x1 - 3, yb - g],
    [x0 + 3, yb + g, xm - g, y1 - 3], [xm + g, yb + g, x1 - 3, y1 - 3]].map(quad).join('');
  const patch = day
    ? '<path d="' + printD + '" fill="rgb(' + C + ')" fill-opacity="' + Math.min(1, 0.55 * pool) + '" filter="url(#' + id + 'b0)"' + add + '/>' +
      '<path d="' + printD + '" fill="rgb(' + CT + ')" fill-opacity="' + Math.min(1, 0.72 * pool) + '"' + add + '/>'
    : '<path d="' + printD + '" fill="rgb(' + C + ')" fill-opacity="' + Math.min(1, 0.5 * pool) + '" filter="url(#' + id + 'b7)"' + addN + '/>' +
      '<path d="' + printD + '" fill="rgb(' + SV + ')" fill-opacity="' + Math.min(1, 0.55 * pool) + '"' + addN + '/>';

  // The sky in the glass. G is a deeper gold by day: the floor colour with its HSV saturation times 1.45.
  // By night it is the floor colour. RM is the rim's colour: G by day, silver by night.
  const deep = function (rgb, m) {
    const c = rgb.split(',').map(Number), mx = Math.max.apply(null, c), mn = Math.min.apply(null, c), s0 = (mx - mn) / mx;
    const s1 = Math.min(0.65, s0 * m);
    return c.map(function (u) { return Math.round(mx - (mx - u) * (s1 / s0)); }).join(',');
  };
  const G = day ? deep(C, 1.45) : C, RM = day ? G : SV;
  // The sun, or the moon, in the right panes: low at the horizon, high at 36 degrees or at midnight.
  const dX = xm + bw / 2 + (gx + gw - xm - bw / 2) * 0.58;
  const dY = lerp(yb + 8, gy + 7, day ? Math.min(1, up * 1.6) : Math.sin(Math.PI * frac));
  const cloud1 = function (x, y, w, col, op) {
    return '<g fill="rgb(' + col + ')" fill-opacity="' + op + '" filter="url(#' + id + (day ? 'b0' : 'b7') + ')">' +
      '<ellipse cx="' + f(x + w * 0.5) + '" cy="' + f(y + w * 0.05) + '" rx="' + f(w * 0.5) + '" ry="' + f(w * 0.07) + '"/>' +
      '<ellipse cx="' + f(x + w * 0.32) + '" cy="' + f(y - w * 0.02) + '" rx="' + f(w * 0.2) + '" ry="' + f(w * 0.12) + '"/>' +
      '<ellipse cx="' + f(x + w * 0.56) + '" cy="' + f(y - w * 0.07) + '" rx="' + f(w * 0.2) + '" ry="' + f(w * 0.16) + '"/></g>';
  };
  // By day a cloud is gold with a lit top edge; by night it is navy with a silver top edge.
  const cloud = function (x, y, w) {
    return day ? cloud1(x, y + 0.7, w, G, '.6') + cloud1(x + w * 0.05, y, w * 0.9, LAMP_HERO_SUN_HOT, '.5')
      : cloud1(x, y - 0.5, w, '160,182,228', '.6') + cloud1(x, y + 0.3, w, '30,44,86', '.95');
  };
  let disc;
  if (day) {
    let burst = '';
    for (let i = 0; i < 12; i++) {
      const t = i / 12 * Math.PI * 2, r1 = 4.2, r2 = i % 2 ? 7.5 : 11;
      burst += 'M' + f(dX + Math.cos(t) * r1) + ' ' + f(dY + Math.sin(t) * r1) + 'L' + f(dX + Math.cos(t) * r2) + ' ' + f(dY + Math.sin(t) * r2);
    }
    disc = '<circle cx="' + f(dX) + '" cy="' + f(dY) + '" r="15" fill="url(#' + id + 'sn)"' + addN + '/>' +
      '<path d="' + burst + '" stroke="rgb(' + LAMP_HERO_SUN_HOT + ')" stroke-opacity=".6" stroke-width=".5" stroke-linecap="round"' + addN + '/>' +
      '<circle cx="' + f(dX) + '" cy="' + f(dY) + '" r="3.4" fill="rgb(' + LAMP_HERO_SUN_HOT + ')"/>';
  } else {
    // The moon at its phase, as on the Day's Arc: the shadow is drawn on the right (a waning moon's dark
    // side) and turned over for a waxing moon. The shadow is the sky's navy.
    // The shadow is 0.3px larger than the disc, so no lit edge shows round a new moon.
    const r = 3.1, rs = r + 0.3, phase = o.phase == null ? 1 : o.phase, ex = rs * Math.abs(1 - 2 * phase);
    const turn = o.waning ? '' : ' transform="translate(' + f(2 * dX) + ' 0) scale(-1 1)"';
    disc = '<path d="M' + f(dX) + ' ' + f(dY) + 'L' + f(dX - 18) + ' ' + f(dY + 22) + '" stroke="rgb(' + SV + ')" stroke-opacity="' + f(0.22 * Math.max(0.3, phase)) +
      '" stroke-width="2.4" stroke-linecap="round" filter="url(#' + id + 'b5)"' + addN + '/>' +
      '<circle cx="' + f(dX) + '" cy="' + f(dY) + '" r="10" fill="url(#' + id + 'sn)" fill-opacity="' + f(Math.max(0.3, phase)) + '"' + addN + '/>' +
      '<circle cx="' + f(dX) + '" cy="' + f(dY) + '" r="' + r + '" fill="rgb(' + SV + ')"/>' +
      '<circle cx="' + f(dX - 0.9) + '" cy="' + f(dY - 0.6) + '" r=".8" fill="rgb(176,188,214)" fill-opacity=".55"/>' +
      '<circle cx="' + f(dX + 0.9) + '" cy="' + f(dY + 0.9) + '" r=".55" fill="rgb(176,188,214)" fill-opacity=".45"/>' +
      (phase < 0.995 ? '<path' + turn + ' d="M' + f(dX) + ' ' + f(dY - rs) + 'A' + rs + ' ' + rs + ' 0 0 1 ' + f(dX) + ' ' + f(dY + rs) +
        'A' + f(Math.max(ex, 0.01)) + ' ' + rs + ' 0 0 ' + (phase < 0.5 ? 1 : 0) + ' ' + f(dX) + ' ' + f(dY - rs) + 'Z" fill="rgb(22,33,68)" fill-opacity=".94"/>' : '');
  }
  const stars = day ? '' : LAMP_HERO_STARS.map(function (q, i) {
    return '<circle cx="' + f(gx + gw * q[0]) + '" cy="' + f(gy + gh * q[1]) + '" r="' + (i % 3 ? '.35' : '.5') + '" fill="rgb(' + SV + ')" fill-opacity="' + (i % 2 ? '.55' : '.85') + '"/>';
  }).join('');
  const sky = '<path d="' + allD + '" fill="url(#' + id + 'sk)"/>' +
    '<g clip-path="url(#' + id + 'gc)">' + stars + cloud(gx + 1, gy + gh * 0.24, 15) + cloud(xm + 3, yb + 13, 17) + cloud(gx + 2, gy + gh - 9, 13) + disc + '</g>' +
    (open ? '<path d="' + openD + '" fill="rgb(' + LAMP_HERO_OPEN + ')" fill-opacity=".14"/>' : '');

  // The beams: x and y on the window (0 to 1), strength, width at the start and at the floor. Each is
  // faint where it starts in the pane and brightest where it leaves the window.
  let beamDefs = '', beams = '';
  [[0.16, 0.22, 0.62, 5, 13], [0.36, 0.62, 0.5, 6, 16], [0.66, 0.30, 0.58, 7, 18], [0.86, 0.56, 0.4, 4, 11]].forEach(function (r, i) {
    const sx = x0 + ww * r[0], sy = y0 + wh * r[1], e = pr(sx, sy), s = Math.min(1, r[2] * pool * ng * (day ? 0.8 : 0.95));
    beamDefs += '<linearGradient id="' + id + 'bm' + i + '" gradientUnits="userSpaceOnUse" x1="' + f(sx) + '" y1="' + f(sy) + '" x2="' + f(e[0]) + '" y2="' + HZ + '">' +
      '<stop offset="0" stop-color="rgb(' + CT + ')" stop-opacity="0"/><stop offset=".25" stop-color="rgb(' + CT + ')" stop-opacity="' + f(s * 0.4) + '"/>' +
      '<stop offset=".45" stop-color="rgb(' + CT + ')" stop-opacity="' + f(s) + '"/><stop offset=".72" stop-color="rgb(' + G + ')" stop-opacity="' + f(s * 0.55) + '"/>' +
      '<stop offset="1" stop-color="rgb(' + G + ')" stop-opacity="' + f(s * 0.25) + '"/></linearGradient>';
    beams += '<path' + add + ' d="M' + f(sx - r[3] / 2) + ' ' + f(sy) + 'L' + f(sx + r[3] / 2) + ' ' + f(sy) + 'L' + f(e[0] + r[4] / 2) + ' ' + HZ + 'L' + f(e[0] - r[4] / 2) + ' ' + HZ +
      'Z" fill="url(#' + id + 'bm' + i + ')" filter="url(#' + id + (day ? 'b0' : 'b7') + ')"/>';
  });
  // The rim: the light catches the frame's outer top and left edges; a faint casing line round the
  // opening. By night a silver line also runs round each pane on the glass side.
  const rim = '<path d="M' + f(ox) + ' ' + f(oy) + 'H' + f(ox + ow) + '" stroke="url(#' + id + 'rh)" stroke-width=".7"' + addN + '/>' +
    '<path d="M' + f(ox) + ' ' + f(oy) + 'V' + f(oy + oh) + '" stroke="url(#' + id + 'rw)" stroke-width=".7"' + addN + '/>' +
    '<path d="M' + f(ox - rv - 0.4) + ' ' + f(oy + oh) + 'V' + f(oy - 2) + 'H' + f(ox + ow + 2) + '" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width=".6"/>' +
    (day ? '' : '<path d="' + glassD + '" fill="none" stroke="rgb(' + SV + ')" stroke-opacity=".3" stroke-width=".45"' + addN + '/>');
  // The skirting board: a dark band along the foot of the wall, with a fine lit top edge.
  const skirt = rect(k.L - 60, HZ - 3.2, k.R - k.L + 80, 3.2, ' fill="url(#' + id + 'kb)"') +
    rect(k.L - 60, HZ - 3.5, k.R - k.L + 80, 0.5, ' fill="url(#' + id + 'hz)" fill-opacity=".6"');

  // The broad shaft behind the beams is weak, so the gaps between the beams read dark.
  const shTop = 0.30 * pool * ng * (day ? 1.05 : 1) * 0.4, shFoot = 0.07 * pool * ng * (day ? 1.6 : 1) * 0.4;
  const rimA = day ? '.85' : '.8';
  const svg = k.svg(k.defs(k.blur('b0', day ? 0.6 : 1.4) + k.blur('b3', 5) + k.blur('b4', day ? 2.4 : 5) + k.blur('b5', 1.1) + k.blur('b7', 0.6) +
    '<linearGradient id="' + id + 'sf" gradientUnits="userSpaceOnUse" x1="' + xm + '" y1="' + y0 + '" x2="' + mid + '" y2="' + HZ + '">' +
    '<stop offset="0" stop-color="rgb(' + CT + ')" stop-opacity="' + shTop + '"/><stop offset="1" stop-color="rgb(' + C + ')" stop-opacity="' + shFoot + '"/></linearGradient>' +
    // The glass's own light, for the bloom: from the hot corner (by day), through the light's colour, to the floor colour.
    '<linearGradient id="' + id + 'gl" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + y1 + '"><stop offset="0" stop-color="rgb(' + (day ? LAMP_HERO_SUN_HOT : CT) + ')" stop-opacity="' + Math.min(1, (day ? 0.62 : 0.42) * ng) + '"/>' +
    (day ? '<stop offset=".45" stop-color="rgb(' + CT + ')" stop-opacity="' + f(Math.min(1, 0.62 * ng) * 0.75) + '"/>' : '') +
    '<stop offset="1" stop-color="rgb(' + C + ')" stop-opacity="' + (day ? '.22' : '.10') + '"/></linearGradient>' +
    '<linearGradient id="' + id + 'sk" gradientUnits="userSpaceOnUse" x1="' + f(gx) + '" y1="' + f(gy) + '" x2="' + f(gx + gw) + '" y2="' + f(gy + gh) + '">' +
    (day ? '<stop offset="0" stop-color="rgb(124,144,170)" stop-opacity="' + f(0.25 + 0.5 * Math.min(1, up * 2)) + '"/>' +
      '<stop offset=".38" stop-color="rgb(' + CT + ')" stop-opacity=".92"/><stop offset="1" stop-color="rgb(' + G + ')" stop-opacity=".9"/>'
      : '<stop offset="0" stop-color="rgb(14,22,48)" stop-opacity=".96"/><stop offset=".5" stop-color="rgb(26,40,82)" stop-opacity=".96"/>' +
      '<stop offset="1" stop-color="rgb(44,66,120)" stop-opacity=".94"/>') + '</linearGradient>' +
    '<radialGradient id="' + id + 'sn"><stop offset="0" stop-color="rgb(' + (day ? LAMP_HERO_SUN_HOT : SV) + ')" stop-opacity="' + (day ? '1' : '.7') + '"/>' +
    '<stop offset=".35" stop-color="rgb(' + (day ? CT : '150,178,235') + ')" stop-opacity="' + (day ? '.55' : '.28') + '"/><stop offset="1" stop-color="rgb(' + CT + ')" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="' + id + 'rh" gradientUnits="userSpaceOnUse" x1="' + f(ox) + '" y1="0" x2="' + f(ox + ow) + '" y2="0"><stop offset="0" stop-color="rgb(' + RM + ')" stop-opacity="' + rimA + '"/>' +
    '<stop offset="1" stop-color="rgb(' + RM + ')" stop-opacity="' + (day ? '0' : '.25') + '"/></linearGradient>' +
    '<linearGradient id="' + id + 'rw" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(oy) + '" x2="0" y2="' + f(oy + oh) + '"><stop offset="0" stop-color="rgb(' + RM + ')" stop-opacity="' + rimA + '"/>' +
    '<stop offset="1" stop-color="rgb(' + RM + ')" stop-opacity="' + (day ? '.1' : '.3') + '"/></linearGradient>' +
    '<linearGradient id="' + id + 'pf" gradientUnits="userSpaceOnUse" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + ow) + '" y2="' + (oy + oh) + '">' +
    '<stop offset="0" stop-color="rgb(' + PT.hi + ')"/><stop offset=".5" stop-color="rgb(' + PT.mid + ')"/><stop offset="1" stop-color="rgb(' + PT.lo + ')"/></linearGradient>' +
    '<linearGradient id="' + id + 'sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(' + PT.hi + ')"/><stop offset="1" stop-color="rgb(' + PT.lo + ')"/></linearGradient>' +
    '<linearGradient id="' + id + 'jm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(' + C + ')" stop-opacity="0"/>' +
    '<stop offset=".35" stop-color="rgb(' + C + ')" stop-opacity=".2"/><stop offset="1" stop-color="rgb(' + CT + ')" stop-opacity=".3"/></linearGradient>' +
    '<linearGradient id="' + id + 'kb" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".25" stop-color="#000" stop-opacity=".28"/>' +
    '<stop offset=".85" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="' + id + 'oc">' + rect(ox, oy, ow, oh) + '</clipPath>' +
    '<clipPath id="' + id + 'gc"><path d="' + allD + '"/></clipPath>' +
    '<clipPath id="' + id + 'tl"><path d="M' + f(ox - 2) + ' ' + f(oy - 2) + 'H' + f(ox + ow + 2) + 'L' + f(ox - 2) + ' ' + f(oy + oh + 2) + 'Z"/></clipPath>' +
    mask + '<clipPath id="' + id + 'fl"><rect x="0" y="0" width="' + o.W + '" height="' + HZ + '"/></clipPath>' + beamDefs) +
    k.horizon(k.L - 40, k.R) + skirt +
    '<g clip-path="url(#' + id + 'fl)"' + (day ? ' style="isolation:isolate"' : '') + '><path d="' + shaft + '" fill="url(#' + id + 'sf)" filter="url(#' + id + (day ? 'b4' : 'b3') + ')"' + add + '/>' +
    '<g mask="url(#' + id + 'mk)">' + bars + '</g></g>' +
    reveal + sky + frame + bloom + rim + sash + sill +
    '<g clip-path="url(#' + id + 'fl)"' + (day ? ' style="isolation:isolate"' : '') + '>' + beams + '</g>' +
    // Where the light lands: a long, soft pool on the floor line.
    '<ellipse cx="' + mid + '" cy="' + HZ + '" rx="' + f((b[0] - a[0]) / 2 + 6) + '" ry="2.6" fill="rgb(' + C + ')" fill-opacity="' +
      Math.min(1, (day ? 0.4025 : 0.3) * pool) + '" filter="url(#' + id + 'b1)"/>' +
    patch);
  return { svg: svg, x: xm, y: y0 + wh / 2, at: CT };
}

// The #windows painted plate (6 Nov 2026, option 5 "Along the Light" of design-docs/windows_hero_options.html).
// `header_images` on the lamplight-popup gives a day image and a night image, each drawn 381 x 127px and anchored to
// the right edge. Three true things stay live over the painting: the moon at its phase, the open casement, and
// the sun's colour by elevation. When a plate does not load, lampHeroSun draws instead.
// - The fade (8 Nov 2026, option 5 "Along the Light, Rounded" of design-docs/windows_hero_drawn_options.html): one
//   ellipse laid along the light, from the window down to the left, opaque over its inner half and eased out over
//   the outer half. Its size is solved for each sheet: the zero contour touches the nearest of the title's ink and
//   the eyebrow's ink, 6px out (Law 13.1: the text stands on the plain sheet), or the plate's left edge, so no edge
//   of the plate shows at any width (on the 540px sheet the plate starts right of the title, and a straight fade
//   was spent before it). The mask has white stops with stop-opacity, so it does not depend on the colour space
//   that a browser uses for luminance. A patch that follows the text was refused: it drew the outline of the text.
//   The ellipse is one curve round the window; it touches the text at one point and runs away from it.
// - The wide sheet (9 Nov 2026, a revision of option 5 asked by the household): on the 540px sheet the solved
//   ellipse was 2.6 times the telephone's, so the right of the picture did not fade at all. When the second
//   ellipse (LAMP_HERO_FADE_LEAF, round the hanging leaves and the beams) clears the text and the plate's left
//   edge, the window's ellipse keeps the telephone's scale (kWide), so the right side fades as on the telephone,
//   and the leaf ellipse holds the leaves at 90% or more and fades out before the plate's left edge. The two join
//   in the mask by alpha "over", so the edge reads as one soft curve. On the telephone and at 375px the leaf
//   ellipse does not clear the title, so only the window's ellipse draws, as before.
// - The tint: the plate is painted at about 22 degrees. A `color` blend, masked by the plate's own
//   luminance, moves the lit parts to the colour of the live sun.
// The plates ship with the cards, in dist/lamplight-windows/<LAMP_HERO_PLATE_SET>/, beside lamplight.js. A new plate
// set needs a new folder and a new LAMP_HERO_PLATE_SET, because HACS adds its cache tag only to the card file.
// LAMP_HERO_PLATE holds the glass of the plate set in source px. Set 2: the household's two ChatGPT images,
// 2172 x 724, registered to about 2 source px, drawn 381 x 127. A new plate set needs new values here.
// Set 3 (8 Nov 2026, option 1 "The Hanging Branch" of design-docs/windows_hero_drawn_options.html): our own
// plates, drawn in code by design-docs/windows_hero_drawn/draw_windows.mjs in the house drawing style. The
// window is in the same place as set 2, so these values and LAMP_HERO_FRAME do not change. Set 2 stays in dist/.
const LAMP_HERO_PLATE_SET = '3';
const LAMP_HERO_PLATE = {
  scale: 127 / 724, width: 381, height: 127,
  left: 1580, right: 1729, glassTop: 130, midBar: 291, glassFoot: 472, windowX: 1565,
  sunElev: 22, moon: 4.2, nightSky: '6,40,90', saturate: 1, sunsetSat: 0.88
};
// The fade's ellipse in the plate's CSS px (x from the plate's left edge): centre, axis ratios, the angle of its long
// axis (down and to the left, along the rays of slope 1.5), the opaque core, and the clearance round the text.
const LAMP_HERO_FADE = { cx: 262, cy: 74, ax: 1.7, ay: 1.25, rot: Math.atan2(1, -1.5), core: 0.5, clear: 6, kWide: 64 };
// The leaf ellipse for a wide sheet, in plate px: centre, and the semi-axes of its zero contour (same angle).
const LAMP_HERO_FADE_LEAF = { cx: 164, cy: 64, a: 156, b: 172 };
const LAMP_HERO_FADE_EASE = [[0, 1], [0.15, 0.97], [0.3, 0.88], [0.45, 0.72], [0.6, 0.5], [0.75, 0.27], [0.88, 0.1], [1, 0]];

// The House picture with the weather (27 Nov 2026, option 6d of design-docs/windows_house_sky_options.html). Plate set 4
// is plate set 3 taken apart (lamplight-build/tools/house_plates4_build.py), so that the weather changes its light:
// - the glass: the plate's own leaves, toned by the weather, with the weather's light behind them; by day on a clear or
//   fair sky the sun shines through. One file for each sky and light, named as the weather plates, so lampPlateChoose
//   crossfades them as it does the skies;
// - the room: sunlit on a clear sky, 60% sunlit on a fair sky, grey (soft, even light, no beams) under cloud, rain, snow
//   and fog. By night the moonbeams draw only on a clear or fair sky. The frame is white paint in the picture's light,
//   in its key: honey by day, peach under cloud, moon-blue by night;
// - drops on the glass in rain and thunder, snow on the panes and the sill, mist in fog;
// - by night the moon shows only where the light shows through the leaves (moon-mask.png), with a soft glow round it.
// The elevation tint follows the sun's share: none under cloud. File px: glass 818-1012 x 75-277, marks 780-1054 x 45-311.
const LAMP_HERO_WX_SET = '7';
const LAMP_HERO_WX = { file: [1270, 423], glass: [818, 75, 194, 202], marks: [780, 45, 274, 266], sun: { clear: 1, fair: 0.6 },
  mark: { rain: 'rain', thunder: 'rain', snow: 'snow', fog: 'fog' }, glow: 0.3 };
function lampHeroWxPick(base, state, elev, night) {
  const X = LAMP_HERO_WX, pick = lampPlateChoose(state, elev, base + 'glass/'), cond = pick.plate;
  const sun = night ? 0 : (X.sun[cond] || 0), lit = !!X.sun[cond];
  const rooms = night ? [base + 'room-night-' + (lit ? 'sun' : 'grey') + '.webp'] : sun >= 1 ? [base + 'room-day-sun.webp'] :
    sun <= 0 ? [base + 'room-day-grey.webp'] : [base + 'room-day-grey.webp', base + 'room-day-sun.webp'];
  const mk = X.mark[cond] ? base + 'marks-' + X.mark[cond] + '-' + (night ? 'night' : 'day') + '.webp' : null;
  const mask = night && lit ? base + 'moon-mask.png' : null;
  const files = [pick.urlA].concat(pick.urlB ? [pick.urlB] : [], rooms, mk ? [mk] : [], mask ? [mask] : []);
  return { cond: cond, sun: sun, lit: lit, glassA: pick.urlA, glassB: pick.urlB, t: pick.t, rooms: rooms, marks: mk, mask: mask, files: files,
    key: pick.key + '|' + rooms.join(',') + '|' + (mk || '') };
}

function lampHeroPlate(o) {
  const k = lampHeroKit(o), f = k.f, id = o.id, day = !o.night, W = o.W, P = LAMP_HERO_PLATE;
  const add = ' style="mix-blend-mode:plus-lighter"';
  const dx = W - P.width, sx = function (x) { return dx + x * P.scale; }, sy = function (y) { return y * P.scale; };
  const gx0 = sx(P.left), gx1 = sx(P.right), gy0 = sy(P.glassTop), gy1 = sy(P.midBar), gy2 = sy(P.glassFoot);
  let im = '<image href="' + lampEsc(o.url) + '" x="' + dx + '" y="0" width="' + P.width + '" height="' + P.height + '" preserveAspectRatio="none"/>';
  const X = LAMP_HERO_WX, wx = o.wx;
  const wxX = function (x) { return dx + x * P.width / X.file[0]; }, wxY = function (y) { return y * P.height / X.file[1]; };
  const box = function (href, r, op) {
    return '<image href="' + lampEsc(href) + '" x="' + f(wxX(r[0])) + '" y="' + f(wxY(r[1])) + '" width="' + f(r[2] * P.width / X.file[0]) + '" height="' + f(r[3] * P.height / X.file[1]) +
      '" preserveAspectRatio="none"' + (op != null ? ' opacity="' + f(op) + '"' : '') + '/>';
  };
  if (wx) {
    // The glass under the room; the room's glass is transparent but for the frame's shade on it.
    const full = function (href, op) { return '<image href="' + lampEsc(href) + '" x="' + dx + '" y="0" width="' + P.width + '" height="' + P.height + '" preserveAspectRatio="none"' + (op != null ? ' opacity="' + f(op) + '"' : '') + '/>'; };
    im = box(wx.glassA, X.glass) + (wx.glassB ? box(wx.glassB, X.glass, wx.t) : '') + full(wx.rooms[0]) + (wx.rooms[1] ? full(wx.rooms[1], wx.sun) : '');
  }

  let top = '', extra = '';
  if (!day && (!wx || wx.lit)) {
    // The moon: the same drawing as lampHeroSun's, in the plate's right panes. The plate holds no moon.
    const dX = gx0 + (gx1 - gx0) * 0.55, dY = gy1 - (gy1 - gy0) * (0.3 + 0.4 * Math.sin(Math.PI * Math.max(0, Math.min(1, o.frac))));
    const r = P.moon, rs = r + 0.3, phase = o.phase == null ? 1 : o.phase, ex = rs * Math.abs(1 - 2 * phase);
    const turn = o.waning ? '' : ' transform="translate(' + f(2 * dX) + ' 0) scale(-1 1)"';
    extra += '<radialGradient id="' + id + 'sn"><stop offset="0" stop-color="rgb(' + LAMP_HERO_SILVER + ')" stop-opacity=".7"/>' +
      '<stop offset=".4" stop-color="rgb(150,178,235)" stop-opacity=".25"/><stop offset="1" stop-color="rgb(150,178,235)" stop-opacity="0"/></radialGradient>';
    top += '<circle cx="' + f(dX) + '" cy="' + f(dY) + '" r="' + f(r * 3) + '" fill="url(#' + id + 'sn)" fill-opacity="' + f(Math.max(0.3, phase)) + '"' + add + '/>' +
      '<circle cx="' + f(dX) + '" cy="' + f(dY) + '" r="' + r + '" fill="rgb(' + LAMP_HERO_SILVER + ')"/>' +
      (phase < 0.995 ? '<path' + turn + ' d="M' + f(dX) + ' ' + f(dY - rs) + 'A' + rs + ' ' + rs + ' 0 0 1 ' + f(dX) + ' ' + f(dY + rs) +
        'A' + f(Math.max(ex, 0.01)) + ' ' + rs + ' 0 0 ' + (phase < 0.5 ? 1 : 0) + ' ' + f(dX) + ' ' + f(dY - rs) + 'Z" fill="rgb(' + P.nightSky + ')" fill-opacity=".96"/>' : '');
    if (wx && wx.mask) {
      // Behind the leaves the moon shows only through the gaps; its light glows over the leaves round it.
      const g = X.glass, gx = wxX(g[0]), gy = wxY(g[1]), gw = g[2] * P.width / X.file[0], gh = g[3] * P.height / X.file[1];
      extra += '<mask id="' + id + 'mm" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + P.height + '">' + box(wx.mask, g) + '</mask>' +
        '<clipPath id="' + id + 'mg"><rect x="' + f(gx) + '" y="' + f(gy) + '" width="' + f(gw) + '" height="' + f(gh) + '"/></clipPath>' +
        '<radialGradient id="' + id + 'mb"><stop offset="0" stop-color="rgb(180,204,240)" stop-opacity="1"/><stop offset="1" stop-color="rgb(180,204,240)" stop-opacity="0"/></radialGradient>';
      top = '<g clip-path="url(#' + id + 'mg)"><circle cx="' + f(dX) + '" cy="' + f(dY) + '" r="14" fill="url(#' + id + 'mb)" fill-opacity="' + f(X.glow * Math.max(0.3, phase) * (wx.cond === 'clear' ? 1 : 0.6)) + '"' + add + '/></g>' +
        '<g mask="url(#' + id + 'mm)">' + top + '</g>';
    }
  }
  if (o.open) {
    // The open casement over the right panes: open-blue glass, and a glowing outline.
    const l = gx0 - 3, openD = 'M' + f(l) + ' ' + f(gy0) + 'H' + f(gx1) + 'V' + f(gy2) + 'H' + f(l) + 'Z';
    const sashD = 'M' + f(gx1) + ' ' + f(gy0) + 'L' + f(gx1 - 11) + ' ' + f(gy0 + 4) + 'L' + f(gx1 - 11) + ' ' + f(gy2 - 4) + 'L' + f(gx1) + ' ' + f(gy2) + 'Z';
    top += '<path d="' + openD + '" fill="rgb(' + LAMP_HERO_OPEN + ')" fill-opacity=".22"/>' +
      '<path d="' + sashD + '" fill="rgb(' + LAMP_HERO_OPEN + ')" fill-opacity=".6"/>' + k.lit(sashD, 'rgb(' + LAMP_HERO_OPEN + ')');
  }

  let tint = '';
  if (day) {
    const up = Math.max(0, Math.min(60, o.elev || 0)) / 60, e = o.elev || 0;
    const t = Math.min(1, Math.abs(e - P.sunElev) / 18) * (e < P.sunElev ? 0.8 : 0.45) * (wx ? wx.sun : 1);
    if (t > 0.01) {
      extra += '<mask id="' + id + 'tm" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + P.height + '">' + im + '</mask>';
      tint = '<rect x="0" y="0" width="' + W + '" height="' + P.height + '" fill="rgb(' + lampArcAt(LAMP_HERO_SUN_GLASS, up) + ')" fill-opacity="' + f(t) +
        '" mask="url(#' + id + 'tm)" style="mix-blend-mode:color"/>';
    }
  }

  // The fade: the ellipse, scaled so its zero contour touches the nearest text ink (6px out) or the plate's left edge.
  // o.text holds the ink boxes { l, r, t, b } of the title and the eyebrow; without it, the title's end stands in.
  const F = LAMP_HERO_FADE, fc = Math.cos(F.rot), fs = Math.sin(F.rot), fx = dx + F.cx, fy = F.cy;
  const rho = function (x, y) { const u = (x - fx) * fc + (y - fy) * fs, v = -(x - fx) * fs + (y - fy) * fc; return Math.hypot(u / F.ax, v / F.ay); };
  const text = o.text || [{ l: 22, r: o.tEnd, t: 82, b: 110 }, { l: 22, r: 68, t: 66, b: 77 }];
  let kf = Infinity;
  text.forEach(function (b) {
    const L = b.l, R = b.r + F.clear, T = b.t - F.clear, B = b.b + F.clear;
    for (let q = 0; q <= 10; q++) {
      const t = q / 10;
      kf = Math.min(kf, rho(R, T + (B - T) * t), rho(L + (R - L) * t, T), rho(L + (R - L) * t, B));
    }
  });
  for (let y = 0; y <= P.height; y += 4) kf = Math.min(kf, rho(dx + 1, y));
  // The wide sheet: the leaf ellipse draws only when its zero contour clears the text (6px out) and the plate's left edge.
  const Lf = LAMP_HERO_FADE_LEAF, lx = dx + Lf.cx;
  const rhoL = function (x, y) { const u = (x - lx) * fc + (y - Lf.cy) * fs, v = -(x - lx) * fs + (y - Lf.cy) * fc; return Math.hypot(u / Lf.a, v / Lf.b); };
  let leafFits = kf > F.kWide;
  text.forEach(function (b) {
    const L = b.l, R = b.r + F.clear, T = b.t - F.clear, B = b.b + F.clear;
    for (let q = 0; q <= 10 && leafFits; q++) {
      const t = q / 10;
      if (Math.min(rhoL(R, T + (B - T) * t), rhoL(L + (R - L) * t, T), rhoL(L + (R - L) * t, B)) < 1) leafFits = false;
    }
  });
  for (let y = 0; y <= P.height && leafFits; y += 4) if (rhoL(dx + 1, y) < 1) leafFits = false;
  if (leafFits) kf = F.kWide;
  const stops = '<stop offset="0" stop-color="#fff" stop-opacity="1"/>' +
    LAMP_HERO_FADE_EASE.map(function (q) { return '<stop offset="' + f(F.core + (1 - F.core) * q[0]) + '" stop-color="#fff" stop-opacity="' + q[1] + '"/>'; }).join('');
  const grad = function (gid, x, y, a, b) {
    return '<radialGradient id="' + gid + '" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(' + f(x) + ' ' + f(y) +
      ') rotate(' + f(F.rot * 180 / Math.PI) + ') scale(' + f(a) + ' ' + f(b) + ')">' + stops + '</radialGradient>';
  };
  const fill = function (gid) { return '<rect x="0" y="0" width="' + W + '" height="' + P.height + '" fill="url(#' + gid + ')"/>'; };
  extra += grad(id + 'tg', fx, fy, F.ax * kf, F.ay * kf) + (leafFits ? grad(id + 'tl', lx, Lf.cy, Lf.a, Lf.b) : '') +
    '<mask id="' + id + 'tf" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + P.height + '">' + fill(id + 'tg') + (leafFits ? fill(id + 'tl') : '') + '</mask>';

  // The painting's saturation, on the picture and its tint only. The moon and the open casement stay true. The
  // room frames use the same files without this filter. 9 Nov 2026: 115% for set 3 (was 75% for set 2's ChatGPT
  // plates, which were too saturated; our drawn plates looked dull under it). Later on 9 Nov 2026 the household set it
  // back to 100%, so no filter draws. The filter runs for any value other than 1.
  // Sunset at Rest (21 Nov 2026, option 3 of design-docs/windows_sunset_options.html): below the painted elevation
  // the saturation follows the tint's ramp, from 100% at 22 degrees to P.sunsetSat (88%) at 4 degrees and below.
  // The household found the sunset too saturated. The OKLCH chroma does not rise at sunset; the tint turns the lit
  // parts from gold (hue 110) to amber (76), and HSV saturation p95 rose from 0.59 to 0.67. The filter keeps the
  // amber and brings the saturation back to the noon level (0.61). Above 22 degrees and by night there is no filter.
  const sunK = day && (o.elev || 0) < P.sunElev ? Math.min(1, (P.sunElev - (o.elev || 0)) / 18) : 0;
  const satv = +(P.saturate * (1 - (1 - P.sunsetSat) * sunK)).toFixed(3);
  const calm = satv !== 1;
  if (calm) extra += '<filter id="' + id + 'ps" filterUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + P.height + '" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="' + satv + '"/></filter>';
  const marks = wx && wx.marks ? box(wx.marks, X.marks) : '';
  const svg = k.svg(k.defs(extra) + '<g mask="url(#' + id + 'tf)"><g' + (calm ? ' filter="url(#' + id + 'ps)"' : '') + ' style="isolation:isolate">' + im + tint + marks + '</g></g>' + top);
  return { svg: svg, x: sx(P.windowX), y: 60, at: day ? '255,214,160' : '150,178,235' };
}

// Load an image once, for a hero that needs it. It answers true when the image is ready. `done` runs when a
// load ends well; a load that fails answers false until the page reloads, so the drawn hero stays.
const LAMP_HERO_IMAGES = new Map();
function lampHeroImage(url, done) {
  let e = LAMP_HERO_IMAGES.get(url);
  if (!e) {
    e = { state: 'loading', waiting: new Set(), im: new Image() };
    LAMP_HERO_IMAGES.set(url, e);
    e.im.onload = function () { e.state = 'ok'; e.waiting.forEach(function (fn) { fn(); }); e.waiting.clear(); };
    e.im.onerror = function () { e.state = 'bad'; e.waiting.clear(); };
    e.im.src = url;
  }
  if (e.state === 'loading' && done) e.waiting.add(done);
  return e.state === 'ok';
}

// The gilded object, the fallback: the sheet's own drawing as a hairline on the horizon, with two
// blurred copies for the light. o: { glyph (an entry of LAMP_POPUP_GLYPHS) }.
function lampHeroGilded(o) {
  const k = lampHeroKit(o), f = k.f, id = o.id, g = o.glyph;
  const s = 0.8, cx = (k.L + k.R) / 2 + 6;
  const grad = '<linearGradient id="' + id + 'g" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(' + o.core + ')"/>' +
    '<stop offset="0.45" stop-color="rgb(' + o.acc + ')"/><stop offset="1" stop-color="rgb(' + o.ember + ')" stop-opacity="0.85"/></linearGradient>';
  const drawing = '<g transform="translate(' + (g.shift || 0) + ' 0)">' + g.draw('url(#' + id + 'g)') + '</g>';
  const obj = function (cls) {
    return '<g class="' + cls + '" transform="translate(' + f(cx - 50 * s) + ' ' + f(k.HZ - 95 * s) + ') scale(' + s + ')">' + drawing + '</g>';
  };
  const style = '<style>.o5 [stroke]{stroke-width:5px;vector-effect:non-scaling-stroke}' +
    '.o12 [stroke]{stroke-width:12px;vector-effect:non-scaling-stroke}' +
    '.o1 [stroke]{stroke-width:1.4px;vector-effect:non-scaling-stroke}</style>';
  const svg = k.svg(style + k.defs(grad) + k.horizon(k.L, k.R) + k.glint(cx) +
    '<g filter="url(#' + id + 'b2)" opacity=".3">' + obj('o12') + '</g>' +
    '<g filter="url(#' + id + 'b1)" opacity=".55">' + obj('o5') + '</g>' + obj('o1'));
  return { svg: svg, x: cx, y: k.HZ - 40, at: o.acc, gilded: true };
}
