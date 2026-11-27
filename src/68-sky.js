// The painted sky of lamplight-weather. Design option 7, "Painted Plates in the Turning
// Light": design-docs/weather_effects_options.html (option 7 and its Decision
// section). Built from the prototype design-docs/evidence/weather_sky_engine.js.
// Colours, thresholds and masks are the prototype's. A change to any of them is a
// design decision, not a port.
//
// The sky is a stack of layers. Each layer shows one thing. From the bottom:
//   light   the sky gradient and the light pool. Four keyframes (day, golden,
//           twilight, night), blended by the sun's elevation. The day keyframe
//           is the card's `skies` table (LAMP_SKIES).
//   stars   up to 18 points under the cloud. Visible below -4 degrees, and only
//           when the cover is 0.35 or less.
//   cloud   the shade colour through a body mask, the lit colour through a lit
//           mask. At night broken and overcast cloud change to the night masks.
//   veil    fog: one body mask in the fog colour.
//   air     the marks (rain, heavy rain, sleet, snow, hail), with clear air
//           round the words. Opacity 0.75 at night, 1.0 by day.
//   shade   the reading shade. It is a legibility aid (household, 11 Oct 2026),
//           kept only while a measurement needs it.
//   grain   LAMP_GRAIN, on top of all the layers.
//
// The masks are 17 WebP files in dist/lamplight-sky/<LAMP_SKY_SET>/. The
// household copies that folder to the host (the agent cannot write a binary
// file). tools/sky_plates_webp.py makes them. Change the folder name and
// LAMP_SKY_SET together, and only when the masks change: HACS adds its cache tag
// only to the card file, so a new mask set needs a new folder name.
//
// The functions here only draw. 70-weather.js decides what to draw and when.

const LAMP_SKY_SET = '1';

// Each condition: the sky key, the cloud plate, how much the cloud hides the
// pool, the marks, and the veil.
const LAMP_SKY_PLATE = {
  'sunny':              { sky: 'sunny',        cloud: null,            hide: 0,   air: null },
  'partlycloudy':       { sky: 'partlycloudy', cloud: 'fair',          hide: 0.25, air: null },
  'cloudy':             { sky: 'cloudy',       cloud: 'overcast',      hide: 0.6,  air: null },
  'windy':              { sky: 'cloudy',       cloud: 'overcast',      hide: 0.6,  air: null },
  'exceptional':        { sky: 'cloudy',       cloud: 'overcast',      hide: 0.6,  air: null },
  'rainy':              { sky: 'rainy',        cloud: 'rain',          hide: 0.8,  air: 'rain' },
  'pouring':            { sky: 'pouring',      cloud: 'pour',          hide: 0.9,  air: 'pour' },
  'lightning':          { sky: 'lightning',    cloud: 'storm',         hide: 0.8,  air: null },
  'lightning-rainy':    { sky: 'lightning',    cloud: 'storm',         hide: 0.8,  air: 'rain' },
  'hail':               { sky: 'snowy',        cloud: 'rain',          hide: 0.8,  air: 'hail' },
  'snowy':              { sky: 'snowy',        cloud: 'snow',          hide: 0.6,  air: 'snow' },
  'snowy-rainy':        { sky: 'snowy',        cloud: 'snow',          hide: 0.6,  air: 'sleet' },
  'fog':                { sky: 'fog',          cloud: null,            hide: 0.5,  air: null, veil: true },
  'clear-night':        { sky: 'clearnight',   cloud: null,            hide: 0,   air: 'stars' },
  'partlycloudy-night': { sky: 'cloudynight',  cloud: 'nightbroken',   hide: 0.3,  air: null },
  'cloudy-night':       { sky: 'cloudynight',  cloud: 'nightovercast', hide: 0.6,  air: null }
};

// Each plate's day colours (from tools/sky_plates.js), its cover, and its night plate.
const LAMP_SKY_CLOUD = {
  fair:     { lit: [242, 238, 230], shade: [108, 124, 156], cover: 0.3,  night: 'nightbroken' },
  overcast: { lit: [172, 180, 196], shade: [82, 92, 110],   cover: 0.7,  night: 'nightovercast' },
  rain:     { lit: [146, 164, 190], shade: [50, 60, 78],    cover: 0.85 },
  pour:     { lit: [124, 142, 168], shade: [36, 44, 60],    cover: 0.95 },
  storm:    { lit: [192, 186, 216], shade: [60, 50, 108],   cover: 0.85 },
  snow:     { lit: [170, 178, 194], shade: [104, 114, 132], cover: 0.7 }
};
const LAMP_SKY_NIGHT_LIT = { nightbroken: [152, 162, 190], nightovercast: [126, 136, 164] };
const LAMP_SKY_NIGHT_SHADE = { nightbroken: [38, 44, 66], nightovercast: [32, 38, 56] };
const LAMP_SKY_COVER = {
  sunny: 0, 'clear-night': 0, partlycloudy: 0.3, cloudy: 0.7, windy: 0.7, exceptional: 0.7,
  rainy: 0.85, pouring: 0.95, lightning: 0.85, 'lightning-rainy': 0.85, hail: 0.85,
  snowy: 0.7, 'snowy-rainy': 0.7, fog: 0.6
};

// The reading shade. Soft, dark, behind the row's words. It carries no weather:
// it is there so that a brighter sky does not cost the words their contrast.
const LAMP_READING_SHADE =
  'radial-gradient(70% 34% at 34% 24%, rgba(8,10,16,0.46) 0%, rgba(8,10,16,0.30) 48%, rgba(8,10,16,0) 100%),' +
  'radial-gradient(28% 28% at 84% 27%, rgba(8,10,16,0.38) 0%, rgba(8,10,16,0) 100%)';

const lampSkyR3 = (v) => Math.round(v * 1000) / 1000;

// The light pool and the sky gradient, as the card's classic sky draws them.
const lampSkyPool = (p, pa, side) => 'radial-gradient(' +
  (side === 'l' ? '34% 48% at 24% 2%' : '42% 56% at 84% 2%') +
  ', rgba(' + p + ',' + lampSkyR3(pa) + ') 0%, rgba(' + p + ',' + lampSkyR3(pa * 0.3) +
  ') 34%, transparent 64%)';
const lampSkyGradient = (s, sa) => 'linear-gradient(168deg, rgba(' + s + ',' + lampSkyR3(sa) +
  ') 0%, rgba(' + s + ',' + lampSkyR3(sa * 0.55) + ') 40%, rgba(26,32,48,0.42) 74%, ' +
  LAMP_GROUND + ' 100%)';

// A small seeded random number generator, so the marks and the stars are the
// same on every draw.
function lampSkyRng(seed) {
  let s = seed;
  return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// The light is four keyframes, blended by the sun's elevation:
//   day      8 degrees and above
//   golden   0 degrees (from 8 down to 0)
//   twilight -3 degrees (sunset to the middle of civil twilight)
//   night    -6 degrees and below (the moon's pool rises on the left)
function lampLightWeights(el) {
  if (el >= 8) return { day: 1, golden: 0, twilight: 0, night: 0 };
  if (el >= 0) { const t = (8 - el) / 8; return { day: 1 - t, golden: t, twilight: 0, night: 0 }; }
  if (el >= -3) { const t = -el / 3; return { day: 0, golden: 1 - t, twilight: t, night: 0 }; }
  if (el >= -6) { const t = (-el - 3) / 3; return { day: 0, golden: 0, twilight: 1 - t, night: t }; }
  return { day: 0, golden: 0, twilight: 0, night: 1 };
}

const lampSkyP3 = (s) => typeof s === 'string' ? s.split(',').map(Number) : s;
const lampSkyMix = (a, b, t) => { a = lampSkyP3(a); b = lampSkyP3(b); return a.map((v, i) => v + (b[i] - v) * t); };
const lampSkyScale = (a, k) => lampSkyP3(a).map((v) => v * k);
const lampSkyCss = (c) => c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(',');

// The palette for one condition at one elevation. `SK` is the day table, which
// the card passes in as `this._skies`, so `config.skies` keeps working.
function lampSkyPalette(cond, el, SK) {
  const w = lampLightWeights(el), base = cond.replace('-night', '');
  const day = LAMP_SKY_PLATE[base === 'clear' ? 'sunny' : base] || LAMP_SKY_PLATE.cloudy;
  const v = SK[day.sky === 'clearnight' ? 'sunny'
    : day.sky === 'cloudynight' ? (base === 'cloudy' ? 'cloudy' : 'partlycloudy') : day.sky];
  const cover = LAMP_SKY_COVER[base] !== undefined ? LAMP_SKY_COVER[base] : 0.7;
  const warm = 1 - 0.75 * cover;
  const nightKey = cover <= 0.05 ? 'clearnight' : 'cloudynight';
  const NV = SK[nightKey];
  const K = {
    day:      { sky: lampSkyP3(v[0]), sa: v[1], pool: lampSkyP3(v[2]), pa: v[3] },
    golden:   { sky: lampSkyMix(v[0], SK.golden[0], warm), sa: v[1] + (SK.golden[1] - v[1]) * warm,
                pool: lampSkyMix(v[2], SK.golden[2], warm), pa: v[3] + (SK.golden[3] - v[3]) * warm },
    twilight: { sky: lampSkyMix(lampSkyMix(v[0], [90, 96, 120], 0.45), [170, 112, 150], warm), sa: 0.56,
                pool: lampSkyMix(v[2], [236, 140, 110], warm), pa: 0.62 * (0.4 + 0.6 * warm) },
    night:    { sky: cover > 0.75 ? lampSkyMix(v[0], [40, 48, 72], 0.72) : lampSkyP3(NV[0]), sa: NV[1],
                pool: lampSkyP3(NV[2]), pa: NV[3] * (1 - 0.5 * cover) }
  };
  const blend = (f) => ['day', 'golden', 'twilight', 'night'].reduce(function (acc, k) {
    const x = f(K[k]);
    return acc ? acc.map((a, i) => a + x[i] * w[k]) : x.map((c) => c * w[k]);
  }, null);
  const sky = blend((k) => k.sky), sa = blend((k) => [k.sa])[0];
  const dayPool = blend((k) => k === K.night ? [0, 0, 0, 0] : k.pool.concat([k.pa]));
  const sumDay = 1 - w.night;
  const pool = sumDay > 0 ? dayPool.slice(0, 3).map((c) => c / sumDay) : [0, 0, 0];
  const pa = sumDay > 0 ? dayPool[3] / sumDay : 0;
  // The cloud's colours at this light. A warm light changes the cloud's colour,
  // never makes it brighter than by day: the words were measured against the
  // day colours.
  const Y = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const cap = (c, ref) => { const k = Y(c) > Y(ref) ? Y(ref) / Y(c) : 1; return lampSkyScale(c, k); };
  const cloudAt = function (pl) {
    const L = LAMP_SKY_CLOUD[pl];
    const lk = {
      day:      { lit: L.lit, shade: L.shade },
      golden:   { lit: cap(lampSkyMix(L.lit, [255, 196, 148], warm * 0.85), L.lit),
                  shade: cap(lampSkyMix(L.shade, [120, 96, 110], warm * 0.5), L.shade) },
      twilight: { lit: cap(lampSkyMix(lampSkyScale(L.lit, 0.8), [226, 150, 160], warm * 0.85), L.lit),
                  shade: lampSkyMix(lampSkyScale(L.shade, 0.7), [70, 56, 84], 0.6) },
      night:    { lit: lampSkyMix(L.lit, [60, 68, 92], 0.72), shade: [24, 28, 40] }
    };
    const pick = (part) => (k) => k === K.day ? lk.day[part] : k === K.golden ? lk.golden[part]
      : k === K.twilight ? lk.twilight[part] : lk.night[part];
    return { lit: blend(pick('lit')), shade: blend(pick('shade')) };
  };
  const fog = blend((k) => k === K.day ? [196, 202, 210]
    : k === K.golden ? lampSkyMix([196, 202, 210], [218, 196, 176], 0.55)
    : k === K.twilight ? [150, 132, 150] : [70, 76, 92]);
  const stars = cover <= 0.35 ? Math.max(0, Math.min(1, (-4 - el) / 4)) * (1 - cover) : 0;
  return { w: w, sky: sky, sa: sa, pool: pool, pa: pa, cover: cover, nightPool: NV, cloudAt: cloudAt,
           fog: fog, stars: stars, marksDim: 0.75 + 0.25 * (1 - w.night) };
}

// Size a canvas to its box at the device ratio (3 at most) and clear it.
function lampSkyCanvas(cv, W, H) {
  const D = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(W * D); cv.height = Math.round(H * D);
  const g = cv.getContext('2d');
  g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H);
  return g;
}

// The marks (design option 1): rain, heavy rain, sleet, snow and hail.
// o.wind is [km/h, bearing]; o.knock is the boxes to keep clear; o.ribbonTop is
// where the foot band starts, and nothing is drawn below it.
function lampSkyMarks(cv, W, H, kind, o) {
  const g = lampSkyCanvas(cv, W, H);
  if (!kind) return;
  const R = lampSkyRng(11 + kind.length * 7), bottom = o.ribbonTop || H;
  const sp = o.wind ? o.wind[0] : 10;
  // The plate sky sets o.boost (stronger marks in low light) and o.density (marks per area).
  const boost = o.boost || 1, sc = o.density === undefined ? 1 : o.density;
  const dir = Math.sin(((o.wind ? o.wind[1] : 270) + 180) * Math.PI / 180);
  const lean = Math.min(sp / 40, 1) * 0.55 * dir;
  g.lineCap = 'round';
  const drop = function (n, lmin, lvar, wd) {
    for (let i = 0; i < n; i++) {
      const y = R() * H, x = R() * (W + 80) - 40, l = lmin + R() * lvar, a = Math.min(0.6, (0.10 + R() * 0.14) * boost);
      if (y > bottom) continue;
      g.strokeStyle = 'rgba(' + (boost > 1 ? '218,234,252,' : '205,225,245,') + a.toFixed(3) + ')'; g.lineWidth = wd;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + lean * l, y + l); g.stroke();
    }
  };
  const dot = function (n, rmin, rvar, amin, avar) {
    for (let i = 0; i < n; i++) {
      const x = R() * W, y = R() * H, r = rmin + R() * rvar, a = amin + R() * avar;
      if (y > bottom) continue;
      const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.7);
      gr.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 1.7, 0, 6.2832); g.fill();
    }
  };
  const n = function (v) { return Math.round(v * sc); };
  if (kind === 'rain') drop(n(60), 8, 8, 1);
  if (kind === 'pour') drop(n(120), 12, 8, 1.2);
  if (kind === 'sleet') { drop(n(50), 8, 8, 1); dot(n(10), 1.6, 1.4, 0.45, 0.3); }
  if (kind === 'snow') dot(n(22), 1.6, 1.4, 0.45, 0.3);
  if (kind === 'hail') { drop(n(40), 8, 8, 1); dot(n(14), 1.3, 0.6, 0.55, 0.1); }
  // Clear air round the words.
  if (o.knock) {
    g.globalCompositeOperation = 'destination-out';
    try { g.filter = 'blur(3px)'; } catch (e) { /* older iOS Safari: no canvas filter */ }
    g.fillStyle = '#000';
    for (const k of o.knock) g.fillRect(k[0] - 5, k[1] - 4, k[2] + 10, k[3] + 8);
    g.filter = 'none'; g.globalCompositeOperation = 'source-over';
  }
}

// Revision 3's stars: points, not flakes. A crisp core, most of them faint, a
// few in colour, the two brightest with a short four-point spike. They thin out
// towards the foot of the card and near the moon, and sit under the cloud, so a
// broken sky shows them in its gaps.
function lampSkyStars(cv, W, H, amount, o) {
  const g = lampSkyCanvas(cv, W, H);
  if (amount <= 0) return;
  const R = lampSkyRng(97), TINT = ['205,220,255', '255,255,250', '255,255,250', '255,238,210'];
  let placed = 0, tries = 0;
  while (placed < 18 && tries++ < 400) {
    const x = 6 + R() * (W - 12), y = 3 + Math.pow(R(), 1.6) * H * 0.62;
    // fewer near the moon (top left) and none under the words
    const dm = Math.hypot((x - W * 0.24) / (W * 0.30), (y - H * 0.02) / (H * 0.42));
    if (dm < 1 && R() < 0.75) continue;
    if (o.knock && o.knock.some((k) => x > k[0] - 4 && x < k[0] + k[2] + 4 && y > k[1] - 3 && y < k[1] + k[3] + 3)) continue;
    const big = placed < 2, mid = placed >= 2 && placed < 6;
    const a = amount * (big ? 1 : mid ? 0.72 : 0.32 + R() * 0.3);
    const r = big ? 0.9 : mid ? 0.62 : 0.42 + R() * 0.14;
    const tint = TINT[Math.floor(R() * TINT.length)];
    g.fillStyle = 'rgba(' + tint + ',' + a.toFixed(3) + ')';
    g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    if (big) {
      const gl = g.createRadialGradient(x, y, 0, x, y, 2.6);
      gl.addColorStop(0, 'rgba(' + tint + ',' + (a * 0.30).toFixed(3) + ')');
      gl.addColorStop(1, 'rgba(' + tint + ',0)');
      g.fillStyle = gl; g.beginPath(); g.arc(x, y, 2.6, 0, 6.2832); g.fill();
      for (const d of [[1, 0], [0, 1]]) {
        const L = 4.2, gr = g.createLinearGradient(x - d[0] * L, y - d[1] * L, x + d[0] * L, y + d[1] * L);
        gr.addColorStop(0, 'rgba(' + tint + ',0)');
        gr.addColorStop(0.5, 'rgba(' + tint + ',' + (a * 0.75).toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(' + tint + ',0)');
        g.strokeStyle = gr; g.lineWidth = 0.45;
        g.beginPath(); g.moveTo(x - d[0] * L, y - d[1] * L); g.lineTo(x + d[0] * L, y + d[1] * L); g.stroke();
      }
    }
    placed++;
  }
}

// Draw every layer into `root`, an empty element that is positioned and clipped.
//   cond  a Home Assistant condition
//   el    the sun's elevation in degrees
//   o     { skies, masks: function (name) -> url, wind: [km/h, bearing], knock: [[x,y,w,h]...],
//           ribbonTop, grain: a CSS url() or '' }
//   W, H  the card's client size
function lampSkyBuild(root, cond, el, o, W, H) {
  const base = cond === 'clear-night' ? 'sunny' : cond.replace('-night', '');
  const c = LAMP_SKY_PLATE[base] || LAMP_SKY_PLATE.cloudy;
  const P = lampSkyPalette(base, el, o.skies), w = P.w;
  const layer = function (css) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;inset:0;' + (css || '');
    root.appendChild(d);
    return d;
  };
  const canvas = function (opacity) {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%' +
      (opacity !== undefined ? ';opacity:' + opacity.toFixed(3) : '');
    root.appendChild(cv);
    return cv;
  };
  // light: the sky, the day pool on the right, the moon's pool on the left
  const pools = [];
  if (w.night > 0) pools.push(lampSkyPool(P.nightPool[2], P.nightPool[3] * (1 - 0.5 * P.cover) * w.night, 'l'));
  if (w.night < 1) pools.push(lampSkyPool(lampSkyCss(P.pool), P.pa * (1 - c.hide * 0.7) * (1 - w.night), 'r'));
  layer('background:' + pools.join(',') + (pools.length ? ',' : '') + lampSkyGradient(lampSkyCss(P.sky), P.sa));
  if (P.stars > 0) lampSkyStars(canvas(), W, H, P.stars, o);
  // cloud: the shade through the body mask, the light through the lit mask.
  // A mask that does not load paints nothing, and the sky still shows.
  const masked = function (name, colour, opacity) {
    const m = 'url(' + o.masks(name) + ') top center / 100% auto no-repeat';
    layer('background:rgb(' + lampSkyCss(colour) + ');-webkit-mask:' + m + ';mask:' + m +
      ';opacity:' + opacity.toFixed(3));
  };
  if (c.cloud) {
    const pl = c.cloud === 'nightbroken' ? 'fair' : c.cloud === 'nightovercast' ? 'overcast' : c.cloud;
    const col = P.cloudAt(pl), nightPl = LAMP_SKY_CLOUD[pl].night;
    const wn = nightPl ? w.night : 0;
    if (wn < 1) { masked(pl + '_body', col.shade, 1 - wn); masked(pl + '_lit', col.lit, 1 - wn); }
    if (wn > 0) {
      masked(nightPl + '_body', LAMP_SKY_NIGHT_SHADE[nightPl], wn);
      masked(nightPl + '_lit', LAMP_SKY_NIGHT_LIT[nightPl], wn);
    }
  }
  if (c.veil) masked('fog_body', P.fog, 1);
  // air: the marks, dimmer at night
  lampSkyMarks(canvas(P.marksDim), W, H, c.air !== 'stars' ? c.air : null, o);
  // shade and grain
  layer('background:' + (o.grain ? o.grain + ', ' : '') + LAMP_READING_SHADE);
}
