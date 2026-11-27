// lamplight-routines. The routines as lamps on the path of the sun.
//
// It replaces the four lamplight-row `kind: run` rows in the Routines panel. It is
// option 18, "Lamplit · Tinted Glass", of design-docs/routines_rework_options.html,
// which the household selected on 7 October 2026.
//
// WHAT IT DRAWS
// One line through the lamps. Each routine is a 40px glass lamp at its place on
// the line: in the day order, from the left. A horizon crosses the card, the land
// under it is dark, and the names lie on the land. The whole column, lamp and name,
// is the button that runs the routine. There are no counts, no times and no room
// lists: the state is light only.
//
// THE HORIZON (the household's request, 7 November 2026). The horizon and its land
// came back after one day of the clear sky of option 7 of
// design-docs/house_scenes_journey_options.html. The rule and the fade of that
// option are removed. The line has its point at noon again, and it is dotted under
// the horizon. The land cuts the glow at the horizon, and Bedtime's lamp is 4px from
// its name. Both are as the household asked. A lit name keeps the line under it, and
// the length of that line is the share of rooms still set.
//
// THE LIGHT IS "STILL SET"
// Each routine names the rooms it sets, as a scene and the light that scene
// changes. A room is still set when all four are true:
//   the light is on
//   the scene's own time is not older than the light's `last_changed`, less 2s.
//     A scene that switches a light on lands 0.9-1.3s BEFORE the light's
//     `last_changed`. Measured 6 October 2026
//   no other scene for that light has a later time. The other scenes are each
//     scene with the same Hue `group_name` as a scene named here for that
//     light, each scene whose `entity_id` list holds the light, and each scene
//     named here for that light
//   the light's brightness is the scene's own `brightness`, within
//     `tolerance` (default 3). Hue gives 190 back for a scene of 191. Measured
//     7 October 2026, Games Room. For a group, the card compares the
//     brightest member that is on: HA gives the group the average of its
//     members, but the scene's `brightness` is its brightest light. Hallway
//     "Wind down" sets 63, 78 and 46, the group shows 62, the scene says 78.
//     Measured 7 October 2026
// The share of a routine is the rooms still set divided by its rooms. Two
// routines can share a room (Evening and Bedtime set the same Lounge scene), so
// two lamps can be lit at the same time. That is true, and the card shows it.
//
// THE LAMP
// Unlit, the lamp is glass of its own colour at a third of full strength (src/16-lamp.js).
// Lit, a second layer lies on top, every stop opaque. Its opacity is
// 0.45 + 0.55 x share, so a lamp set in 1 of 3 rooms is dimmer than one set in all
// of them. The opacity moves over 3s, the time the scenes take to change the
// lights. Every colour stop is opaque so that no grey shows through (the fault
// of option 14).
//
// Configuration:
//   routines    required. In the day order, from the left. Each has:
//     entity      required. The script. A tap runs it
//     name        optional: the script's friendly_name. The household's name wins
//     icon        optional: the script's icon. The household's icon wins
//     accent      required. The lamp's colour: a palette name (marigold), or "r,g,b". A palette name
//                 also gives the glow, the glass and the orb of that colour
//     glow_color  the colour of its glow. Default: the deep tone of a palette accent, else accent
//     glass_color the colour of the unlit glass, "r,g,b". Default: accent
//     glass_tint  how much of `glass_color` the unlit glass holds, 0-1. Default 0.31
//     rooms       a list of { scene, light }. Omitted, the lamp is never lit
//     lamp_height the lamp's height on the line, px from the top. Default: the
//                 four places (70, 40, 70, 118) for four routines
//     tap_action  default: run the script
//   brightness_tolerance  brightness, 0-255. Default 3
//   layout      'path' (default) or 'grid'
//   columns     the lamps in one row of the grid. Default 3
//   lit_lamps   'all' (default) or 'one'
//   lamp_style  the display type of the whole card: one type for every routine, never a mix.
//                 'glass' (default)  the glass lamp. The only type for the path layout
//                 'orb'              the fitted glass orb (THE ORB below). It needs `layout: grid` and an
//                                    `orb` on each routine; a routine without one is a config error
//                 'icon'             a line icon in a backlight (THE ICON below). It needs `layout: grid`
//               A new display type is one more entry in LAMP_RT_LOOKS: its grid sizes, a build and a paint.
//   light_spill true: the lit icon's light spills faintly across the card (THE SPILL below). Only with
//               `lamp_style: icon`. Default false
//     orb         the fitted orb of the routine (see THE ORB below):
//       off, lit    the glass, unlit and lit: the model numbers that lampOrbCss reads
//       halo        { c: "r,g,b", b1, a1, b2, a2 }: two blurred shadows round the lit orb
//       icon        { off: "r,g,b", lit: "r,g,b" }: the icon's colour in each state
//
// THE GRID AND THE ONE LIGHT (option 7 of design-docs/house_scenes_late_night_options.html,
// which the household selected on 13 November 2026, when Late Night became the fifth scene).
// `layout: grid` puts the lamps in rows, in the day order, each above its name. A short last
// row is in the centre. The grid has no horizon, no land and no line, so the number of the
// routines does not change the design. A row is 84px, and the card is 10px more than its rows.
// `lit_lamps: one` lights only one lamp: the routine with the largest share. If two routines have the
// same share, the routine that ran last is lit (`last_triggered` of its script). The house
// holds one scene at a time, and the panel shows that scene only.

// THE ORB (option 8, "Clear Glass and Glow", of design-docs/house_scenes_restyle_options.html, which the
// household selected on 16 November 2026). `lamp_style: orb` draws each routine as a 52px glass orb. The household
// gave two reference pictures, one with all the orbs unlit and one with all of them lit. Each orb's glass was
// fitted to them, pixel by pixel, by the tools in test/orb-fit/. The config holds the fitted numbers and this
// card turns them into CSS gradients. Back to front, in units of the orb's radius:
//   body   the core colour C0 to a radius p, then an S-curve to the edge colour C1 at p1, about (cx, cy)
//   side   a ring of colour S that rises from r0 to the edge, strength aS
//   top    a glow of colour T about (tx, ty): it rises from t0 to t1, strength aT, then to aT x tk over tw
//   foot   the same, with B, bx, by, b0, b1, aB, bw, bk
//   rim    a ring R0 (width w0, strength a0) and two thin crescents at the top (RT, yT, wT, aRT) and the
//          foot (RB, yB, wB, aRB): the rim lines
// Every rise is an S-curve (smoothstep) drawn with nine stops, so that no edge shows inside the glass.
// The lit orb lies on the unlit orb and fades in with the share, as the glass lamp's lit layer does. Its
// halo is two blurred shadows. There is no pool of light: the household's lit picture has none.
const LAMP_ORB = { D: 52, ROW: 98, GY: 38, NAME: 70, SHARE: 91, ICON: 24, R: 26 };

function lampOrbSs(t) { return t * t * (3 - 2 * t); }
function lampOrbPx(d) { return (d * LAMP_ORB.R).toFixed(2) + 'px'; }

// A glow about (cx, cy): 0 at d0, an S-curve to a at d1, then a straight line to a x k at d1 + w.
function lampOrbGlow(col, cx, cy, d0, d1, a, w, k) {
  const s = ['rgba(' + col + ',0) ' + lampOrbPx(d0)];
  for (let q = 1; q <= 8; q++) {
    const t = q / 8;
    s.push('rgba(' + col + ',' + (a * lampOrbSs(t)).toFixed(3) + ') ' + lampOrbPx(d0 + (d1 - d0) * t));
  }
  s.push('rgba(' + col + ',' + (a * k).toFixed(3) + ') ' + lampOrbPx(d1 + w));
  return 'radial-gradient(circle 120px at ' + lampOrbPx(1 + cx) + ' ' + lampOrbPx(1 + cy) + ', ' + s.join(', ') + ')';
}

function lampOrbCss(M) {
  const side = [], body = ['rgb(' + M.C0 + ') 0px'];
  for (let q = 0; q <= 8; q++) {
    const t = q / 8;
    side.push('rgba(' + M.S + ',' + (M.aS * lampOrbSs(t)).toFixed(3) + ') ' + lampOrbPx(M.r0 + (1 - M.r0) * t));
    body.push('rgb(' + lampMix(M.C0, M.C1, lampOrbSs(t)) + ') ' + lampOrbPx(M.p + (M.p1 - M.p) * t));
  }
  return [
    lampOrbGlow(M.RB, 0, -M.yB, 1 + M.yB - M.wB, 1 + M.yB, M.aRB, 0.01, 1),
    lampOrbGlow(M.RT, 0, M.yT, 1 + M.yT - M.wT, 1 + M.yT, M.aRT, 0.01, 1),
    lampOrbGlow(M.R0, 0, 0, 1 - M.w0, 1, M.a0, 0.01, 1),
    lampOrbGlow(M.B, M.bx, M.by, M.b0, M.b1, M.aB, M.bw, M.bk),
    lampOrbGlow(M.T, M.tx, M.ty, M.t0, M.t1, M.aT, M.tw, M.tk),
    'radial-gradient(circle 120px at 50% 50%, ' + side.join(', ') + ')',
    'radial-gradient(circle 120px at ' + lampOrbPx(1 + M.cx) + ' ' + lampOrbPx(1 + M.cy) + ', ' + body.join(', ') + ')'
  ].join(', ');
}

// The orb's own icons: line glyphs of one stroke, with the sun's disc and the moon filled, as the household's
// pictures draw them. An icon that is not here is drawn by ha-icon.
const LAMP_ORB_GLYPHS = {
  'mdi:weather-sunset-up': '<path d="M3 16.5h18M7.5 16.5a4.5 4.5 0 0 1 9 0M12 6.5v2.2M5.6 9.6l1.5 1.5M18.4 9.6l-1.5 1.5M9.6 21l2.4-2.4 2.4 2.4"/>',
  'mdi:white-balance-sunny': '<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  'mdi:weather-sunset-down': '<path d="M3 14.5h18M7.5 14.5a4.5 4.5 0 0 1 9 0M12 4.5v2.2M5.6 7.6l1.5 1.5M18.4 7.6l-1.5 1.5M9.6 18.5l2.4 2.4 2.4-2.4"/>',
  'mdi:moon-waning-crescent': '<path fill="currentColor" transform="translate(12 12) scale(0.84) translate(-12 -12)" d="M15.5 4A8.2 8.2 0 1 0 20 16.4 6.6 6.6 0 0 1 15.5 4Z"/>',
  'mdi:weather-night': '<path d="M12.5 7A7.2 7.2 0 1 0 18.6 17.4 5.8 5.8 0 0 1 12.5 7Z"/><path d="M18 3v3.4M16.3 4.7h3.4M21 9.2v2.2M19.9 10.3h2.2"/>'
};

// THE ICON (option 15, "Backlight, Even Glow", of design-docs/house_scenes_restyle_options.html, which the
// household selected on 21 November 2026). `lamp_style: icon` draws each routine as a 30px line icon, with no disc
// and no tile, as sheet F of the household's inspiration sheet does. The icons are outlines, one stroke.
//   unlit   the accent 18% of the way to white, at alpha 0.70
//   lit     the accent 88% of the way to white (sheet F's lit stroke is white with a trace of its colour),
//           with a 2px bloom of the glow colour
//   glow    a backlight, 144px across, behind the lit icon, in place of the 320px pool. Its colour is the wash
//           pushed 35% further from its own grey, so that it is deep and rich, as sheet F's. Its fall-off is
//           sheet F's, measured on both sides of the lit icon and scaled to the phone (LAMP_ICON.FALL: px from
//           the centre, and the lift over the ground in levels of the colour's strongest channel). The layer
//           blends with `screen`, so a stop's alpha is lift / (strongest channel x (1 - ground)).
//   even    a deep blue glow stands out less from the dark ground than a magenta or gold one at the same
//           strength. At the 22px stop, the card measures how far the glow stands out from the ground (OKLab,
//           lightness and colour together). If it is less than sheet F's lit glow (50,32,55 on 22.5,23.5,28.5),
//           the card lifts the whole glow until it matches. It never cuts a glow, and it lifts by 1.6 at most.
//           Live, 21 Nov 2026: Morning and Daylight 1.00, Evening 1.20, Late Night 1.24, Bedtime 1.40.
//   share   the backlight's opacity is 0.75 + 0.25 x share, and the share line shows the share.
const LAMP_ICON = {
  D: 34, ROW: 78, GY: 28, NAME: 52, SHARE: 73, ICON: 30, BR: 72,
  FALL: [[0, 60], [8, 54], [15, 47], [18, 36], [22, 28], [27, 22], [33, 19], [38, 15], [47, 10], [59, 4], [72, 0]],
  GROUND: 0.08, DEEP: 1.35, LIFT_MAX: 1.6, WHITE: 0.88
};

// THE SPILL (option 4, "Smooth Spill", of design-docs/house_scenes_light_options.html, which the household
// selected on 21 November 2026, Law 05.2). With `spill: true` (icon type only), the lit icon's light also spills
// faintly across the scenes card, so that the card is not bare ground outside the 72px backlight.
//   one fall-off  the backlight and the spill together give T(r) = PEAK x exp(-r / SCALE) levels over the
//           ground (before the even-glow lift). The spill is T - B, where B is the backlight's own fall-off
//           (LAMP_ICON.FALL). So the sum has no knee at 72px. The household saw that knee on 21 November 2026 in
//           the first build (a 420 x 260px ellipse, 4 levels at 80px): the backlight stood on the spill as a disc
//           with a hard edge. The household then selected fall-off B of the two smooth fall-offs it was shown
//           (design-docs/house_scenes_light/falloff_compare.png): 5.3 levels at 80px, 2.9 at 100px, 0.9 at 137px
//   shape   a circle of R px round the icon's centre, in the backlight's deep colour, blended with `screen`,
//           with a stop every STEP px. At R, T is 0.1 levels, so the last stop at 0 draws no edge
//   grain   the panel grain tile in the same layer. Near 1-2 levels the ground steps from cool grey to warm grey
//           in two channels at once, and the eye reads the 8-bit step as a ring. The grain scatters the step
//   foot    a mask fades the layer out over the last FOOT px of the card, so it never reaches the chip strip
//           and draws no edge at the card's clip
//   share   the layer's opacity is the backlight's, 0.75 + 0.25 x share; it is 0 for an unlit scene
// The layer starts UP px over the card, as far as the card's clip-path lets light rise into the eyebrow band.
const LAMP_SPILL = { PEAK: 60, SCALE: 33, R: 210, STEP: 5, FOOT: 28, UP: 120 };

// The backlight's fall-off B(r), in levels, from LAMP_ICON.FALL; 0 from 72px.
function lampIconFall(r) {
  const F = LAMP_ICON.FALL;
  if (r >= F[F.length - 1][0]) return 0;
  for (let j = 1; j < F.length; j++) {
    if (r <= F[j][0]) return F[j - 1][1] + (F[j][1] - F[j - 1][1]) * (r - F[j - 1][0]) / (F[j][0] - F[j - 1][0]);
  }
  return 0;
}

// The spill's gradient stops for a deep colour, in px from the centre: lift x (T - B).
function lampSpillStops(deep) {
  const S = LAMP_SPILL, W = Math.max(1, Math.max.apply(null, deep.split(',').map(Number))), lift = lampIconLift(deep);
  const stops = [];
  for (let r = 0; r <= S.R; r += S.STEP) {
    const L = r >= S.R ? 0 : Math.max(0, S.PEAK * Math.exp(-r / S.SCALE) - lampIconFall(r)) * lift;
    stops.push('rgba(' + deep + ',' + Math.min(1, L / (W * (1 - LAMP_ICON.GROUND))).toFixed(4) + ') ' + r + 'px');
  }
  return stops.join(', ');
}

// Put the spill round the icon's centre (cx, cy in card px); h is the card's height.
function lampSpillPlace(p, cx, cy, w, h) {
  const S = LAMP_SPILL, el = p.spl;
  el.style.width = w + 'px';
  el.style.height = (h + S.UP) + 'px';
  el.style.top = -S.UP + 'px';
  el.style.background = 'url(' + LAMP_GRAIN + '), radial-gradient(circle ' + S.R + 'px at ' +
    cx.toFixed(1) + 'px ' + (cy + S.UP).toFixed(1) + 'px, ' + p.splStops + ')';
}

// The icon type's own glyphs: outlines of one stroke, the sun's disc and the moons not filled, as sheet F.
// An icon that is not here is drawn by ha-icon.
const LAMP_ICON_GLYPHS = {
  'mdi:weather-sunset-up': LAMP_ORB_GLYPHS['mdi:weather-sunset-up'],
  'mdi:white-balance-sunny': '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  'mdi:weather-sunset-down': LAMP_ORB_GLYPHS['mdi:weather-sunset-down'],
  'mdi:moon-waning-crescent': '<path d="M15.5 4A8.2 8.2 0 1 0 20 16.4 6.6 6.6 0 0 1 15.5 4Z"/>',
  'mdi:weather-night': LAMP_ORB_GLYPHS['mdi:weather-night']
};

// An SVG glyph of `size` px in the middle of a box of `box` px.
function lampRtGlyph(paths, size, box) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  g.setAttribute('viewBox', '0 0 24 24');
  g.setAttribute('fill', 'none');
  g.setAttribute('stroke', 'currentColor');
  g.setAttribute('stroke-width', '1.75');
  g.setAttribute('stroke-linecap', 'round');
  g.setAttribute('stroke-linejoin', 'round');
  g.innerHTML = paths;
  g.style.cssText = 'position:absolute;overflow:visible;left:' + ((box - size) / 2) + 'px;top:' + ((box - size) / 2) +
    'px;width:' + size + 'px;height:' + size + 'px;transition:color 3s ease,filter 3s ease';
  return g;
}

// The deep glow colour: the wash pushed LAMP_ICON.DEEP times as far from its own grey.
function lampIconDeep(wash) {
  const c = wash.split(',').map(Number), m = (c[0] + c[1] + c[2]) / 3;
  return c.map(function (v) { return Math.max(0, Math.min(255, Math.round(m + LAMP_ICON.DEEP * (v - m)))); }).join(',');
}

// The even-glow lift of a deep colour (THE ICON above, `even`). The spill uses it too.
function lampIconLift(deep) {
  const I = LAMP_ICON, D = deep.split(',').map(Number), W = Math.max(1, Math.max.apply(null, D));
  const alpha = function (L, k) { return Math.min(1, L / (W * (1 - I.GROUND)) * k); };
  const G0 = [22.5, 23.5, 28.5], g0 = lampPlToLab(G0);
  const dist = function (c) { const q = lampPlToLab(c); return Math.hypot(q[0] - g0[0], q[1] - g0[1], q[2] - g0[2]); };
  const target = dist([50, 32, 55]);
  const at = function (k) { const a = alpha(28, k); return dist(G0.map(function (g, j) { return g + a * D[j] * (255 - g) / 255; })); };
  let lift = 1;
  if (at(I.LIFT_MAX) <= target) lift = I.LIFT_MAX;
  else if (at(1) < target) {
    let lo = 1, hi = I.LIFT_MAX;
    for (let t = 0; t < 24; t++) { const k = (lo + hi) / 2; if (at(k) < target) lo = k; else hi = k; }
    lift = (lo + hi) / 2;
  }
  return lift;
}

// The backlight's gradient for a deep colour, with the even-glow lift.
function lampIconBacklight(deep) {
  const I = LAMP_ICON, W = Math.max(1, Math.max.apply(null, deep.split(',').map(Number)));
  const alpha = function (L, k) { return Math.min(1, L / (W * (1 - I.GROUND)) * k); };
  const lift = lampIconLift(deep);
  return 'radial-gradient(closest-side, ' + I.FALL.map(function (f) {
    return 'rgba(' + deep + ',' + alpha(f[1], lift).toFixed(3) + ') ' + (f[0] / I.BR * 100).toFixed(1) + '%';
  }).join(', ') + ')';
}

const LAMP_RT = {
  H: 178,            // the card's height
  HZ: 92,            // the horizon
  D: 40,             // the lamp
  PAD: 8,            // the space at each side of the columns
  NAME: 142,         // the top of the names
  SHARE: 163,        // the top of the share line
  Y4: [70, 40, 70, 118],
  NOON: 28,          // the top of the path, between the second and third lamp
  SLACK: 2000,       // ms
  RISE: '3s',
  ROW: 84,           // the grid: the height of one row
  GY: 34,            // the grid: the lamp's centre in its row
  GNAME: 58,         // the grid: the top of the name in its row
  GSHARE: 79,        // the grid: the top of the share line in its row
  GFOOT: 10          // the grid: the space under the last row
};

// OPEN SKY (1 Nov 2026). The card clipped its glow at its own top edge, 47px
// under the panel's top, so the light stopped in a hard line below the
// eyebrow, and the household read that edge as a divider. The card now clips
// only at its foot (the clip-path), so the glow rises through the eyebrow band
// to the panel's own edge, and does not reach the Christmas strip. The glow
// has no hard edge now, so the 1px line (::after) that d-052 added is gone
// (14 Nov 2026, design-docs/divider_rule_options.html, option 1): a line is
// drawn only between items of a list, and the scenes are a grid.
const LAMP_RT_CSS =
  ':host{display:block}' +
  '.v{position:relative;height:' + LAMP_RT.H + 'px;clip-path:inset(-120px -40px 0 -40px);' +
    'font-family:var(--primary-font-family, Roboto, Noto, sans-serif);' +
    '-webkit-font-smoothing:antialiased}' +
  '.sky{position:absolute;inset:0;pointer-events:none}' +
  '.pool{position:absolute;width:320px;height:320px;border-radius:50%;pointer-events:none;' +
    'mix-blend-mode:screen;transition:opacity ' + LAMP_RT.RISE + ' ease,transform ' + LAMP_RT.RISE + ' ease}' +
  '.land{position:absolute;left:0;right:0;top:' + LAMP_RT.HZ + 'px;bottom:0;' +
    'background:linear-gradient(180deg, rgba(0,0,0,0.30), rgba(0,0,0,0.16))}' +
  '.shr{position:absolute;left:50%;top:' + LAMP_RT.SHARE + 'px;width:46px;height:2px;margin-left:-23px;' +
    'border-radius:1px;background:rgba(255,255,255,0.12);overflow:hidden;opacity:0;' +
    'transition:opacity ' + LAMP_RT.RISE + ' ease}' +
  '.shr i{position:absolute;left:0;top:0;bottom:0;border-radius:1px;width:0;' +
    'transition:width ' + LAMP_RT.RISE + ' ease}' +
  'svg{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}' +
  '.col{position:absolute;top:0;bottom:0;cursor:pointer;-webkit-tap-highlight-color:transparent;' +
    'user-select:none;outline:none}' +
  '.col:focus-visible .nm{outline:2px solid rgba(255,255,255,0.24);outline-offset:2px;border-radius:4px}' +
  '.glb{position:absolute;width:' + LAMP_RT.D + 'px;height:' + LAMP_RT.D + 'px;border-radius:50%;' +
    'transition:box-shadow ' + LAMP_RT.RISE + ' ease,transform 120ms ease-out}' +
  '.col.pressed .glb{transform:scale(0.94);transition:box-shadow ' + LAMP_RT.RISE + ' ease}' +
  '.lit{position:absolute;inset:0;border-radius:50%;transition:opacity ' + LAMP_RT.RISE + ' ease}' +
  '.glb ha-icon{position:absolute;left:11px;top:11px;--mdc-icon-size:18px;width:18px;height:18px;' +
    'display:flex;line-height:0;transition:color ' + LAMP_RT.RISE + ' ease,filter ' + LAMP_RT.RISE + ' ease}' +
  '.spl{position:absolute;left:0;pointer-events:none;mix-blend-mode:screen;opacity:0;' +
    '-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - ' + LAMP_SPILL.FOOT + 'px),transparent);' +
    'mask-image:linear-gradient(to bottom,#000 calc(100% - ' + LAMP_SPILL.FOOT + 'px),transparent);' +
    'transition:opacity ' + LAMP_RT.RISE + ' ease}' +
  '.still *{transition:none!important}' +
  '.nm{position:absolute;left:0;right:0;top:' + LAMP_RT.NAME + 'px;padding:0 4px;text-align:center;' +
    'font-size:var(--lamplight-t-body);line-height:17px;font-weight:400;letter-spacing:0;' +
    'transition:color ' + LAMP_RT.RISE + ' ease,text-shadow ' + LAMP_RT.RISE + ' ease}';

// THE DISPLAY TYPES. Each entry has:
//   grid    the sizes in the grid: D (the lamp box), ROW, GY (the lamp's centre), NAME, SHARE
//   pool    half the size of the pool layer, px
//   build   changes the parts of one routine once, when the card draws
//   paint   lights one routine as far as its share `s`. The card itself paints the name and the share line.
const LAMP_RT_LOOKS = {
  glass: {
    grid: { D: LAMP_RT.D, ROW: LAMP_RT.ROW, GY: LAMP_RT.GY, NAME: LAMP_RT.GNAME, SHARE: LAMP_RT.GSHARE },
    pool: 160,
    build: function () {},
    paint: function (p, s, on) {
      p.lit.style.opacity = lampLitOpacity(s);
      p.glb.style.boxShadow = lampGlowCss(p.acc, p.wash, s, p.r.glass_color);
      p.icon.style.color = lampIconInk(p.acc, on, p.r.glass_color);
      p.icon.style.filter = lampIconFilter(p.wash, on);
      p.nm.style.textShadow = '0 0 12px rgba(' + p.wash + ',' + (on ? '0.35' : '0') + ')';
      p.pool.style.opacity = on ? ((0.14 + 0.30 * s) / 0.44).toFixed(3) : '0';
      p.pool.style.transform = 'scale(' + ((250 + 70 * s) / 320).toFixed(3) + ')';
    }
  },

  // The orb: the fitted glass in place of the glass lamp, the orb's own icon, no pool.
  orb: {
    grid: LAMP_ORB,
    pool: 160,
    build: function (p) {
      const O = LAMP_ORB, orb = p.r.orb;
      p.orb = orb;
      p.glb.style.width = p.glb.style.height = O.D + 'px';
      p.glb.style.background = lampOrbCss(orb.off);
      p.lit.style.background = lampOrbCss(orb.lit);
      p.lit.style.boxShadow = 'none';
      if (LAMP_ORB_GLYPHS[p.r.icon]) {
        p.icon.style.display = 'none';
        p.icon = lampRtGlyph(LAMP_ORB_GLYPHS[p.r.icon], O.ICON, O.D);
        p.glb.appendChild(p.icon);
      } else {
        p.icon.style.left = p.icon.style.top = ((O.D - 18) / 2) + 'px';
      }
      p.pool.style.display = 'none';
      p.fill.style.background = 'rgb(' + orb.halo.c + ')';
    },
    paint: function (p, s, on) {
      p.lit.style.opacity = lampLitOpacity(s);
      // The halo is as strong as the lit glass, so a scene set in fewer rooms glows less.
      const op = on ? 0.45 + 0.55 * s : 0, h = p.orb.halo;
      p.glb.style.boxShadow = '0 2px 6px rgba(0,0,0,0.32)' + (on ? ', 0 0 ' + h.b1 + 'px rgba(' + h.c + ',' +
        (h.a1 * op).toFixed(3) + '), 0 0 ' + h.b2 + 'px rgba(' + h.c + ',' + (h.a2 * op).toFixed(3) + ')' : '');
      // The off picture's icons have no glow; a wider glow turned the middle of the glass grey.
      p.icon.style.color = 'rgb(' + (on ? p.orb.icon.lit : p.orb.icon.off) + ')';
      p.icon.style.filter = on ? 'drop-shadow(0 0 1px rgba(' + p.orb.icon.lit + ',0.25))' : 'none';
      p.nm.style.textShadow = 'none';
    }
  },

  // The icon: a line icon in a backlight (THE ICON above). No glass and no lit layer.
  icon: {
    grid: LAMP_ICON,
    pool: LAMP_ICON.BR,
    build: function (p) {
      const I = LAMP_ICON;
      p.deep = lampIconDeep(p.wash);
      p.glb.style.width = p.glb.style.height = I.D + 'px';
      p.glb.style.borderRadius = '0';
      p.glb.style.background = 'none';
      p.glb.style.boxShadow = 'none';
      p.lit.style.display = 'none';
      if (LAMP_ICON_GLYPHS[p.r.icon]) {
        p.icon.style.display = 'none';
        p.icon = lampRtGlyph(LAMP_ICON_GLYPHS[p.r.icon], I.ICON, I.D);
        p.glb.appendChild(p.icon);
      } else {
        p.icon.style.left = p.icon.style.top = ((I.D - I.ICON) / 2) + 'px';
        p.icon.style.width = p.icon.style.height = I.ICON + 'px';
        p.icon.style.setProperty('--mdc-icon-size', I.ICON + 'px');
      }
      p.pool.style.width = p.pool.style.height = (2 * I.BR) + 'px';
      p.pool.style.transform = 'none';
      p.pool.style.background = lampIconBacklight(p.deep);
      p.nm.style.textShadow = 'none';
    },
    paint: function (p, s, on) {
      const k = on ? 0.75 + 0.25 * s : 0;
      p.pool.style.opacity = k.toFixed(3);
      p.icon.style.color = on ? 'rgb(' + lampMix(p.acc, '255,255,255', LAMP_ICON.WHITE) + ')'
        : 'rgba(' + lampMix(p.acc, '255,255,255', 0.18) + ',0.70)';
      p.icon.style.filter = on ? 'drop-shadow(0 0 2px rgba(' + p.deep + ',' + (0.55 * k).toFixed(2) + '))' : 'none';
    }
  }
};

// The Catmull-Rom path through the points, from the second point to the last
// but one. The first and the last point only set the slope at the ends.
function lampRtPath(P) {
  let d = 'M' + P[1].join(',');
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ' C' + c1.map(function (v) { return v.toFixed(1); }).join(',') + ' ' +
      c2.map(function (v) { return v.toFixed(1); }).join(',') + ' ' + p2.join(',');
  }
  return d;
}

// A routine with its colours read. An `accent` that is a bare palette name (src/02-palette.js)
// gives the accent (soft), the glow (deep), and the glass and the orb where the palette has them.
// A key written on the routine wins. Each colour key then goes through lampColour, so a routine
// can also write a hex colour, an `r,g,b` triple or a reserved name.
function lampRtColor(r) {
  let base = {};
  const m = typeof r.accent === 'string' && r.accent.trim().match(/^([a-z]+)$/);
  const e = m && LAMP_PALETTE[m[1]];
  if (e) {
    base = { accent: e.soft, glow_color: e.deep };
    if (e.glass) { base.glass_color = e.glass[0]; base.glass_tint = e.glass[1]; }
    if (e.orb) base.orb = e.orb;
  }
  const out = Object.assign(base, r);
  if (e) out.accent = e.soft;
  out.accent = lampColour(out.accent, 'soft');
  if (out.glow_color) out.glow_color = lampColour(out.glow_color, 'deep');
  if (out.glass_color) out.glass_color = lampColour(out.glass_color, 'soft');
  return out;
}

class LampRoutines extends HTMLElement {

  // A band: lamplight-panel removes the stack gap between this and the chip strip.
  static get lampBand() { return true; }

  static getStubConfig() {
    return { routines: [{ entity: '', name: 'Evening', icon: 'mdi:weather-sunset-down', accent: '232,121,107' }] };
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.routines) || !config.routines.length) {
      throw new Error('lamplight-routines needs a list of `routines`');
    }
    config.routines.forEach(function (r, i) {
      ['entity', 'accent'].forEach(function (k) {
        if (!r || !r[k]) throw new Error('routine ' + (i + 1) + ' needs `' + k + '`');
      });
    });
    // `name` and `icon` are optional (01-entity.js). The household's values are kept here. The script
    // gives the rest in `set hass`. Until then the entity ID and a script icon fill the gap.
    this._given = config.routines.map(function (r) { return { name: r.name, icon: r.icon }; });
    config = Object.assign({}, config, { routines: config.routines.map(function (r) {
      return Object.assign({}, r, { name: r.name || r.entity, icon: r.icon || lampEntityIcon(null, r.entity) });
    }) });
    // An `accent` that is a palette name gives the accent (soft), the glow (deep), and the glass and
    // the orb where the palette has them. A key written on the routine wins.
    config = Object.assign({}, config, { routines: config.routines.map(lampRtColor) });
    this._config = config;
    this._tol = lampOpt('routines', config, 'brightness_tolerance');
    this._grid = lampOpt('routines', config, 'layout') === 'grid';
    this._cols = Math.max(1, parseInt(lampOpt('routines', config, 'columns'), 10) || 3);
    this._one = lampOpt('routines', config, 'lit_lamps') === 'one';
    // The display type. One type for the whole card; see `lamp_style` above.
    const look = lampOpt('routines', config, 'lamp_style');
    if (!LAMP_RT_LOOKS[look]) {
      throw new Error('lamplight-routines: `lamp_style` is one of ' + Object.keys(LAMP_RT_LOOKS).join(', ') + ', not `' + look + '`');
    }
    if (look !== 'glass' && !this._grid) throw new Error('lamplight-routines: `lamp_style: ' + look + '` needs `layout: grid`');
    if (look === 'orb') {
      config.routines.forEach(function (r, i) {
        if (!r.orb) {
          throw new Error('routine ' + (i + 1) + ' (' + r.name + ') needs `orb` for `lamp_style: orb`' +
            (r.accent ? '. The accent "' + r.accent + '" has no fitted orb. Palette colours with an orb: ' +
              Object.keys(LAMP_PALETTE).filter(function (k) { return LAMP_PALETTE[k].orb; }).join(', ') : ''));
        }
      });
    }
    this._look = LAMP_RT_LOOKS[look];
    // The spill (THE SPILL above). Only the icon type has a backlight to spill.
    this._spill = config.light_spill === true;
    if (this._spill && look !== 'icon') throw new Error('lamplight-routines: `light_spill` needs `lamp_style: icon`');
    this._rivals = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._resolveLabels();
    this._update();
  }

  // The household's name and icon win. Without them the script gives them.
  _resolveLabels() {
    const self = this;
    (this._parts || []).forEach(function (p, i) {
      const g = self._given[i] || {};
      const name = lampEntityName(self._hass, p.r.entity, g.name);
      const icon = lampEntityIcon(self._hass, p.r.entity, g.icon);
      if (name !== p.r.name) { p.r.name = name; p.nm.textContent = name; }
      if (icon !== p.r.icon) {
        p.r.icon = icon;
        // A drawn glyph (orb or icon style) replaced the ha-icon only for the household's own
        // glyph names, which an entity never gives.
        if (p.icon && p.icon.tagName === 'HA-ICON') p.icon.setAttribute('icon', icon);
      }
    });
  }

  getCardSize() { return 4; }

  // Home Assistant takes a card out of the document and puts it back while it
  // renders a view, so the observer starts again here.
  connectedCallback() { this._observe(); }

  _observe() {
    if (this._ro || !this._v || !this.isConnected) return;
    const self = this;
    this._ro = new ResizeObserver(function () { self._layout(); });
    this._ro.observe(this._v);
  }

  disconnectedCallback() {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }

  // ---- the state ---------------------------------------------------------

  // The scenes that compete for each light. Kept until the number of states
  // changes, because the list of scenes changes only when a scene is added.
  _rivalsFor(light) {
    const h = this._hass, n = Object.keys(h.states).length;
    if (!this._rivals || this._rivals.n !== n) {
      const own = {}, groups = {};
      this._config.routines.forEach(function (r) {
        (r.rooms || []).forEach(function (m) {
          (own[m.light] = own[m.light] || {})[m.scene] = true;
          const s = h.states[m.scene], g = s && s.attributes.group_name;
          if (g) (groups[m.light] = groups[m.light] || {})[g] = true;
        });
      });
      const map = {};
      Object.keys(own).forEach(function (l) {
        const set = Object.assign({}, own[l]), gs = groups[l] || {};
        Object.keys(h.states).forEach(function (id) {
          if (id.indexOf('scene.') !== 0) return;
          const a = h.states[id].attributes;
          if ((a.group_name && gs[a.group_name]) ||
              (Array.isArray(a.entity_id) && a.entity_id.indexOf(l) !== -1)) set[id] = true;
        });
        map[l] = Object.keys(set);
      });
      this._rivals = { n: n, map: map };
    }
    return this._rivals.map[light] || [];
  }

  // Is this room still as the routine set it?
  _held(room) {
    const h = this._hass, S = h.states[room.scene], L = h.states[room.light];
    if (!S || !L || L.state !== 'on') return false;
    const ts = Date.parse(S.state), lc = Date.parse(L.last_changed);
    if (isNaN(ts) || isNaN(lc) || ts < lc - LAMP_RT.SLACK) return false;
    let best = -1;
    this._rivalsFor(room.light).forEach(function (id) {
      const s = h.states[id], t = s ? Date.parse(s.state) : NaN;
      if (!isNaN(t) && t > best) best = t;
    });
    if (ts !== best) return false;
    const want = S.attributes.brightness;
    let got = L.attributes.brightness;
    const lit = (L.attributes.entity_id || []).map(function (id) {
      const m = h.states[id];
      return m && m.state === 'on' ? m.attributes.brightness : null;
    }).filter(function (b) { return typeof b === 'number'; });
    if (lit.length) got = Math.max.apply(null, lit);
    if (typeof want === 'number' && typeof got === 'number' &&
        Math.abs(want - got) > this._tol) return false;
    return true;
  }

  _share(r) {
    const rooms = r.rooms || [];
    if (!rooms.length || !this._hass) return 0;
    const self = this;
    return rooms.filter(function (m) { return self._held(m); }).length / rooms.length;
  }

  // The share of each routine. With `lit_lamps: one`, only the routine with the largest share keeps
  // its share. Two routines can have the same rooms, so the last run decides between them.
  _shares() {
    const self = this, h = this._hass;
    const S = this._parts.map(function (p) { return self._share(p.r); });
    if (!this._one) return S;
    let best = -1, bestT = -1;
    S.forEach(function (s, i) {
      if (s <= 0) return;
      const st = h.states[self._parts[i].r.entity];
      const t = st ? Date.parse(st.attributes.last_triggered) || 0 : 0;
      if (best < 0 || s > S[best] || (s === S[best] && t > bestT)) { best = i; bestT = t; }
    });
    return S.map(function (s, i) { return i === best ? s : 0; });
  }

  // ---- the drawing -------------------------------------------------------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const root = this.shadowRoot;
    root.innerHTML = '';
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
    this._land = null;
    this._w = 0;
    const style = document.createElement('style');
    style.textContent = LAMP_RT_CSS;
    root.appendChild(style);

    // The first paint has no transitions: a lamp that is lit when the page
    // opens is lit at once. Only a change of state rises over 3s.
    const v = document.createElement('div');
    v.className = 'v still';
    const sky = document.createElement('div');
    sky.className = 'sky';
    v.appendChild(sky);
    root.appendChild(v);
    this._v = v;
    this._sky = sky;

    const self = this;
    this._parts = this._config.routines.map(function (r) {
      const acc = r.accent, wash = r.glow_color || r.accent;
      const pool = document.createElement('span');
      pool.className = 'pool';
      // The pool's gradient is drawn at full strength. Its opacity scales it, so
      // the three stops keep the same ratios at every share.
      pool.style.background = 'radial-gradient(closest-side, rgba(' + wash + ',0.44) 0%, ' +
        'rgba(' + wash + ',0.167) 42%, rgba(' + wash + ',0.044) 75%, rgba(' + wash + ',0) 100%)';
      pool.style.opacity = '0';
      sky.appendChild(pool);

      const col = document.createElement('div');
      col.className = 'col';
      col.setAttribute('role', 'button');
      col.setAttribute('tabindex', '0');
      col.setAttribute('aria-label', r.name);

      const glb = document.createElement('div');
      glb.className = 'glb';
      glb.style.background = lampGlassCss(acc, r.glass_color, r.glass_tint);
      const lit = document.createElement('div');
      lit.className = 'lit';
      lit.style.background = lampLitCss(acc);
      lit.style.boxShadow = lampLitRing(acc);
      lit.style.opacity = '0';
      glb.appendChild(lit);
      const icon = document.createElement('ha-icon');
      icon.setAttribute('icon', r.icon);
      glb.appendChild(icon);
      col.appendChild(glb);

      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = r.name;
      col.appendChild(nm);
      const shr = document.createElement('div');
      shr.className = 'shr';
      const fill = document.createElement('i');
      fill.style.background = 'rgb(' + acc + ')';
      shr.appendChild(fill);
      col.appendChild(shr);
      v.appendChild(col);

      // The display type changes the parts it needs: the glass, the icon, the pool.
      const part = { r: r, acc: acc, wash: wash, pool: pool, col: col, glb: glb, lit: lit, icon: icon, nm: nm, shr: shr,
                     fill: fill, orb: null, s: -1 };
      self._look.build(part);
      if (self._spill) {
        // Under the pools, so that the backlight lies on top of the spill.
        part.spl = document.createElement('span');
        part.spl.className = 'spl';
        part.splStops = lampSpillStops(part.deep);
        sky.insertBefore(part.spl, sky.firstChild);
      }

      const press = function () { col.classList.add('pressed'); };
      const release = function () { col.classList.remove('pressed'); };
      col.addEventListener('pointerdown', press);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (e) {
        col.addEventListener(e, release);
      });
      const run = function (ev) {
        ev.stopPropagation();
        const tap = r.tap_action || { action: 'perform-action', perform_action: 'script.turn_on',
                                       target: { entity_id: r.entity } };
        self.dispatchEvent(new CustomEvent('hass-action', {
          bubbles: true, composed: true,
          detail: { config: { entity: r.entity, tap_action: tap }, action: 'tap' }
        }));
      };
      col.addEventListener('click', run);
      col.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); run(ev); }
      });
      return part;
    });

    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    v.insertBefore(this._svg, v.children[1]);
    this._layout();
    this._update();
    this._observe();
    setTimeout(function () { v.classList.remove('still'); }, 400);
  }

  // Place the path, the lamps and the columns for the card's width.
  _layout() {
    const w = this._v.clientWidth;
    if (!w || w === this._w) return;
    this._w = w;
    if (this._grid) { this._layoutGrid(w); return; }
    const n = this._parts.length, cw = (w - 2 * LAMP_RT.PAD) / n, HZ = LAMP_RT.HZ;
    const pts = this._parts.map(function (p, i) {
      const y = p.r.lamp_height !== undefined ? p.r.lamp_height
        : n === 4 ? LAMP_RT.Y4[i]
        : Math.round(HZ - 52 * Math.sin(Math.PI * (i + 0.5) / n));
      return [+(LAMP_RT.PAD + cw * (i + 0.5)).toFixed(1), y];
    });
    this._pts = pts;
    const P = [[-14, 104]].concat(pts.slice(0, 2), n === 4 ? [[+(w / 2).toFixed(1), LAMP_RT.NOON]] : [],
      pts.slice(2), [[w + 14, 124]]);
    const d = lampRtPath(P);
    const H = LAMP_RT.H;
    this._svg.setAttribute('width', w);
    this._svg.setAttribute('height', H);
    this._svg.setAttribute('viewBox', '0 0 ' + w + ' ' + H);
    // The path is a solid line in the sky and a dotted line under the horizon.
    this._svg.innerHTML =
      '<defs><clipPath id="up"><rect x="0" y="0" width="' + w + '" height="' + HZ + '"/></clipPath>' +
      '<clipPath id="dn"><rect x="0" y="' + HZ + '" width="' + w + '" height="' + (H - HZ) + '"/></clipPath></defs>' +
      '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.1" clip-path="url(#up)"/>' +
      '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,0.11)" stroke-width="1.1" stroke-dasharray="2 4" clip-path="url(#dn)"/>' +
      '<line x1="16" x2="' + (w - 16) + '" y1="' + HZ + '" y2="' + HZ + '" stroke="rgba(255,255,255,0.15)"/>';
    this._parts.forEach(function (p, i) {
      const left = LAMP_RT.PAD + cw * i;
      p.col.style.left = left.toFixed(2) + 'px';
      p.col.style.width = cw.toFixed(2) + 'px';
      p.glb.style.left = (pts[i][0] - left - LAMP_RT.D / 2).toFixed(1) + 'px';
      p.glb.style.top = (pts[i][1] - LAMP_RT.D / 2) + 'px';
      p.pool.style.left = (pts[i][0] - 160) + 'px';
      p.pool.style.top = (pts[i][1] - 160) + 'px';
    });
    if (!this._land) {
      this._land = document.createElement('div');
      this._land.className = 'land';
      this._sky.appendChild(this._land);   // after the pools, so it darkens them
    }
  }

  // The grid: rows of `columns` lamps, each above its name. A short last row is in the centre.
  // Each column is a cell of the grid, and the whole cell is the button.
  _layoutGrid(w) {
    const n = this._parts.length, cols = Math.min(this._cols, n), rows = Math.ceil(n / cols);
    // Each display type has its own sizes: the orb's rows are taller, the icon's are shorter.
    const G = this._look.grid, P = this._look.pool;
    const cw = (w - 2 * LAMP_RT.PAD) / cols, R = G.ROW, H = rows * R + LAMP_RT.GFOOT;
    this._v.style.height = H + 'px';
    this._svg.innerHTML = '';
    this._parts.forEach(function (p, i) {
      const row = Math.floor(i / cols), inRow = row === rows - 1 ? n - row * cols : cols;
      const left = w / 2 + (i - row * cols - inRow / 2) * cw, top = row * R;
      p.col.style.left = left.toFixed(2) + 'px';
      p.col.style.width = cw.toFixed(2) + 'px';
      p.col.style.top = top + 'px';
      p.col.style.bottom = 'auto';
      p.col.style.height = (R + (row === rows - 1 ? LAMP_RT.GFOOT : 0)) + 'px';
      p.glb.style.left = (cw / 2 - G.D / 2).toFixed(1) + 'px';
      p.glb.style.top = (G.GY - G.D / 2) + 'px';
      p.nm.style.top = G.NAME + 'px';
      p.shr.style.top = G.SHARE + 'px';
      p.pool.style.left = (left + cw / 2 - P).toFixed(1) + 'px';
      p.pool.style.top = (top + G.GY - P) + 'px';
      if (p.spl) lampSpillPlace(p, left + cw / 2, top + G.GY, w, H);
    });
  }

  // Light each lamp as far as its routine is still set. Write only what moved.
  _update() {
    if (!this._parts || !this._hass) return;
    const S = this._shares(), look = this._look;
    this._parts.forEach(function (p, i) {
      const s = S[i];
      if (s === p.s) return;
      p.s = s;
      const on = s > 0;
      look.paint(p, s, on);
      if (p.spl) p.spl.style.opacity = on ? (0.75 + 0.25 * s).toFixed(3) : '0';
      // The name and the share line are the same for every display type.
      p.nm.style.color = on ? 'var(--lamplight-ink-strong)' : 'var(--lamplight-ink-soft)';
      p.nm.style.fontWeight = on ? '600' : '400';
      p.shr.style.opacity = on ? '1' : '0';
      p.fill.style.width = (s * 100).toFixed(1) + '%';
      p.col.setAttribute('aria-label', p.r.name + (on ? ', set' : ''));
    });
  }
}

customElements.define('lamplight-routines', LampRoutines);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-routines',
  name: 'Lamplight Routines',
  description: 'Routines as glass lamps on a line in the day order. Each lamp is lit as far as its routine is still set.',
  preview: false
});
