// The plate sky of lamplight-weather: `sky: 'plates'`. Design: design-docs/weather_plates_build_options.html
// (option 2, "Turning Plates"), agreed 26 October 2026. The replica that this file ports is
// design-docs/weather_anime_style_sheet.html (palette, disc, groundOf, afterglow, plateRows, paintPair).
// The numbers are the replica's. A change to any of them is a design decision, not a port.
//
// The sky is a pre-rendered plate: 28 WebP files, 7 conditions x 4 lights, in
// dist/lamplight-sky/<LAMP_PLATE_SET>/<cond>-<light>.webp. The household copies that folder to the host.
// Change the folder name and LAMP_PLATE_SET together, and only when a plate changes: HACS adds its
// cache tag only to the card file.
//
// The stack, from the bottom (all inside div.lamp-sky), since 0.120.0-dev (THE GLASS, below):
//   plate   the plate over the whole card (1.5 times the card width, centred, its horizon row
//           LAMP_PLATE_ROW on y 64), a second plate on top at the blend opacity
//   frost   three blurred copies of the plate, faded in from y 36 to y 72 (LAMP_PLATE_GLASS.steps)
//   sky     one box 64 px + 24 px high, faded out with a smootherstep mask. It holds the sun or
//           the moon and the rain marks. The plate is no longer in it
//   glass   the tint: the card's own sky colours, as thick at each height as the words need,
//           with the deeper foot (LAMP_PLATE_FOOT) in the same gradient
//   grain   LAMP_GRAIN, over everything
// Until 0.119.0-dev the plate was in the 88 px box only, over the "1b Afterglow" ground, with a dark
// foot layer in luminosity blend (the October foot). That foot is gone; LAMP_PLATE_FOOT is now the
// deeper glass foot of 0.128.0-dev (below).
//
// THE GLASS (0.120.0-dev): option 8 "One Smooth Curve" of design-docs/weather_glass_options.html,
// chosen by the household on 16 November 2026. The plate files are 1536 x 960, so the plate
// covers the card. The tint is thick only where the words need it: for each text role, the card
// finds the least tint that gives its floor + 0.05 on the brightest pixels of the plate behind it
// (lampPlateGlass). Each role gets a soft ramp from y 36 to the top of its box. The tint is the
// highest ramp at each height, with a 30% minimum, then blurred (Gaussian, sigma 16 px) so that it
// has no corners, then raised by the least factor that meets every role again. The colours blend
// down the card, never in a step: a step drew a line above the hours in the design probe.
// The measure uses the sharp plate, which is stricter than the frosted one.
//
// The tone (0.37.0-dev): option 10 "Your Mix" of design-docs/weather_tone_options.html, chosen by the
// household on 27 October 2026. The plate and the ground keep LAMP_PLATE_CHROMA of their colour, and
// the foot darkens the lower card. Without it the card had 5 to 9 times the colour of the other panels.
//
// Turning Plates: the sun's elevation gives weights to the four lights (lampLightWeights). The plate
// with the larger weight is the base. The other plate lies on top at w2 / (w1 + w2).
// The ground counts as sky for Law 05.2.

// plates-3 (0.155.0-dev, 27 November 2026): new fair and clear plates (day, golden, twilight) with a deep
// lower sky, made by the household from design-docs/weather_plates/plates3_brief.md. On the old plates
// the sky was light under the words, so the glass was thick (0.6 to 0.76) on a partly cloudy or sunny day.
// Now it is at or near its minimum. The other 22 files are the plates-2 files (tools/plates3_build.py).
// The room window sheets show the same plates through their glass, by the household's choice.
const LAMP_PLATE_SET = 'plates-3';
// The horizon row, as a share of the plate's width: the 80% row of the 1536 x 512 plates-1 files.
// It places the 1536 x 960 plates-2 and plates-3 files in the same way.
const LAMP_PLATE_ROW = 0.8 * 512 / 1536;
// The glass (option 8). blur: px; steps: [share of the blur, mask from y, mask to y]; y0: where
// each role's ramp starts; min, minTo: the least tint and where the minimum ramp ends; sig: the
// Gaussian sigma in px; cap: the most tint; deep: the contrast the tint colours are deepened to
// for white at .52; margin: above each floor.
const LAMP_PLATE_GLASS = { blur: 3, steps: [[0.25, 36, 48], [0.5, 48, 60], [1, 60, 72]], y0: 36,
  min: 0.30, minTo: 120, sig: 16, cap: 0.95, deep: 5.3, margin: 0.2 };
const LAMP_PLATE_BAND = 64;           // the height of the sky band, in px
const LAMP_PLATE_ORDER = ['day', 'golden', 'twilight', 'night'];

// HA condition -> plate condition.
const LAMP_PLATE_OF = {
  'sunny': 'clear', 'clear-night': 'clear',
  'partlycloudy': 'fair', 'partlycloudy-night': 'fair',
  'cloudy': 'overcast', 'cloudy-night': 'overcast', 'windy': 'overcast', 'exceptional': 'overcast',
  'rainy': 'rain', 'pouring': 'rain', 'hail': 'rain',
  'lightning': 'thunder', 'lightning-rainy': 'thunder',
  'snowy': 'snow', 'snowy-rainy': 'snow',
  'fog': 'fog'
};
const LAMP_PLATE_COVER = { overcast: 1, rain: 1, thunder: 1, snow: 1 };

// Where the light stands, as fractions of the sky box. The sun is at the top right, the moon at the top left.
// Day and night y were 0.034 until 31 October 2026: the centre was 3 px below the card's top, so 7 px of the
// 10 px disc was cut off (critique F23). At 0.17 (15 px) the disc and most of its glow are whole.
const LAMP_PLATE_LIGHT = {
  day:      { x: 0.933, y: 0.17 },
  golden:   { x: 0.955, y: 0.60 },
  twilight: { x: 0.86,  y: 1.25 },
  night:    { x: 0.067, y: 0.17 }
};
// The tone. The plate and the ground keep this share of their OKLab chroma.
const LAMP_PLATE_CHROMA = 0.74;
// THE FOOT (0.128.0-dev): option 1 "Deeper Glass" of design-docs/weather_foot_options.html, chosen by
// the household on 21 November 2026. The glass goes deeper at the foot of the card. The ink is the
// glass's own foot colour at OKLab lightness inkL, with its hue and chroma kept. Its opacity is
// max * u^pow, where u runs from 0 at `from` of the card height to 1 at the foot: it starts behind the
// hour glyphs, so the words above keep the glass as it was. The ink is put over the tint in the same
// gradient, so the glass stays one layer and one smooth curve. A severe weather warning colours the
// foot of the card (Law 11.1), so the foot is off while a warning shows (o.foot false).
const LAMP_PLATE_FOOT = { inkL: 0.13, max: 0.55, pow: 2, from: 0.75 };

// The moon behind the cloud (0.58.0-dev): option 4 "Behind the Cloud, by Phase" of
// design-docs/weather_moon_cloud_options.html, chosen by the household on 1 November 2026. Before, the
// moon was painted on top of the plate, so it was in front of the plate's clouds.
// The cloud line (0.127.0-dev): option 3 "Line from the Plate's Own Sky" of
// design-docs/weather_moon_mask_options.html, chosen by the household on 21 November 2026. Until then the
// line was a fixed 0.30 to 0.34. The plates-2 night sky is L 0.31 to 0.36, so the mask read clear sky as
// cloud and only 4 to 7% of the disc showed. The faint rest showed the sky's texture: a pixellated moon.
//   sky      the share of the plate's px in the moon's box that is darker than the open sky (0.25)
//   above    the line starts this far above that sky lightness
//   width    the width of the smoothstep from 0 (clear night sky) to 1 (cloud)
//   ceil     the highest start; a box that is mostly cloud cannot lift the line above the cloud
//   fog      fog is cloud everywhere at this value; the disc shows through at 1 - fog
//   halo     the strength of the light in the cloud in front of the moon, at full moon
//   haloR    the radius of that light, in disc radii (a Gaussian)
const LAMP_PLATE_MOON = { sky: 0.25, above: 0.02, width: 0.10, ceil: 0.40, fog: 0.5, halo: 0.6, haloR: 2.6 };

// The sun behind the cloud, and the hot sun (0.119.0-dev): option 5 "Behind the Cloud, in Real Light" of
// design-docs/weather_hot_sun_options.html, chosen by the household on 16 November 2026. Before, the sun
// was painted on top of the plate, in front of its cloud, and never showed heat. The probe that set these
// numbers is lamplight-cards/test/probe-sun-behind.py --final. Chroma values are the raw plate's; the
// toned plate has LAMP_PLATE_CHROMA of them, and the code scales them.
//   cloud    the cloud that catches the sun's light (the halo and the glare): OKLab lightness l0 to l1,
//            and on a day plate also chroma c0 down to c1 (cloud in shade), then the moon's 3 px blur
//   dens     the cloud that hides the sun: lightness l0 to l1 (day: chroma c0 to c1), blurred over
//            (2 blur + 1) px, then smoothstep(o0, o1). Thin cloud glows and hides almost nothing.
//   pass     the share of the sun that solid cloud lets through (a soft disc stays at golden hour)
//   halo     the light in the cloud in front of the sun, at haloR disc radii (a Gaussian), behind the disc
//   glare    near-white light round a sun in cloud, at glareR radii, x the cloud touching the sun (2 r)
//            x sqrt(the disc's visible share). It is not masked: sky next to the sun blows out.
//   lift     near a sun in cloud, each plate px is lifted toward the sun's light by how much darker it is
//            (OKLab L, smoothstep need0 to need1), at liftR radii, x smoothstep(cn0, cn1, cloud near it)
//   box      the half-width of the box that is masked and lit, in px
// Fog keeps the sun in front: its plate is cloud everywhere (the moon uses LAMP_PLATE_MOON.fog).
const LAMP_PLATE_SUN = {
  cloud: { l0: 0.70, l1: 0.80, c0: 0.115, c1: 0.075 },
  dens: { l0: 0.74, l1: 0.90, c0: 0.10, c1: 0.05, blur: 2, o0: 0.35, o1: 0.95 },
  pass: 0.2, halo: 0.7, haloR: 2.6, glare: 0.9, glareR: 1.7,
  lift: 1.0, liftR: 2.4, need0: 0.05, need1: 0.25, cn0: 0.3, cn1: 0.6, box: 80
};
// The hot sun. The heat share runs from 0 at a felt temperature of `from` to 1 at `to`; the #today glow
// and its 36 rays (LAMP_SUN_PROFILE) are drawn at that strength, under the disc. Their centre is the
// plate's cream, not the #today warm orange: on a sky, an orange ring round the disc looked like a dark
// edge (the household's note on option 1).
//   amber, ambLow   the outer glow and rays, by day and with the sun low
//   heart, heartLow the glow's centre, the plate's day and golden glow
const LAMP_PLATE_HOT = { from: 24, to: 30, amber: [246, 150, 34], ambLow: [255, 130, 56],
  heart: [255, 242, 198], heartLow: [255, 201, 94] };

// The marks of rain and thunder are stronger when the light is low.
const LAMP_PLATE_BOOST = { day: 1, golden: 1, twilight: 1.6, night: 1.9 };

// The replica's palette: only the colours that the ground and the disc use.
const LAMP_PLATE_CLEAR = {
  day:      { rim: '#ffffff', glow: '#fff2c6', disc: '#fffaf0' },
  golden:   { rim: '#ffd36a', glow: '#ffc95e', disc: '#fff1b6' },
  twilight: { rim: '#ff9db2', glow: '#ff8da2', disc: null },
  night:    { rim: '#c6d6fb', glow: '#cfdcff', disc: '#eef3ff' }
};
const LAMP_PLATE_GREY = {
  overcast: { rim: '#d0dbe8', glow: '#eef3f8' },
  rain:     { rim: '#afc6cd', glow: '#e4eef0' },
  thunder:  { rim: '#a797de', glow: '#c9bdf5' },
  snow:     { rim: '#eceffd', glow: '#f2f4ff' }
};
const LAMP_PLATE_TINT = { golden: '#ffc76a', twilight: '#ff9db2', night: '#a9c0f2' };

// ---- colour (OKLab, as the replica) ---------------------------------------

const lampPlHex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lampPlToHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const lampPlLin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lampPlDelin = (v) => { v = Math.max(0, v); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); };
function lampPlToLab(c) {
  const r = lampPlLin(c[0]), g = lampPlLin(c[1]), b = lampPlLin(c[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function lampPlFromLab(q) {
  const l = Math.pow(q[0] + 0.3963377774 * q[1] + 0.2158037573 * q[2], 3);
  const m = Math.pow(q[0] - 0.1055613458 * q[1] - 0.0638541728 * q[2], 3);
  const s = Math.pow(q[0] - 0.0894841775 * q[1] - 1.2914855480 * q[2], 3);
  return [lampPlDelin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
          lampPlDelin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
          lampPlDelin(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
}
const lampPlMix = (a, b, t) => {
  const A = lampPlToLab(lampPlHex(a)), B = lampPlToLab(lampPlHex(b));
  return lampPlToHex(lampPlFromLab(A.map((v, i) => v + (B[i] - v) * t)));
};
const lampPlAdj = (h, kL, kC) => {
  const q = lampPlToLab(lampPlHex(h));
  return lampPlToHex(lampPlFromLab([q[0] * kL, q[1] * kC, q[2] * kC]));
};
const lampPlRgba = (h, a) => {
  const c = lampPlHex(h);
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
};
const lampPlY = (r, g, b) => 0.2126 * lampPlLin(r) + 0.7152 * lampPlLin(g) + 0.0722 * lampPlLin(b);
// The contrast of white at `a` over a flat colour.
function lampPlFlatCr(a, bg) {
  const c = lampPlHex(bg), lb = lampPlY(c[0], c[1], c[2]);
  const lt = lampPlY(a * 255 + (1 - a) * c[0], a * 255 + (1 - a) * c[1], a * 255 + (1 - a) * c[2]);
  return (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05);
}
// Deepen a colour, keeping its hue, until white at `a` on it clears `cr`.
function lampPlDeepenTo(c0, a, cr) {
  const q = lampPlToLab(lampPlHex(c0)); let L = q[0], col = c0;
  for (let i = 0; i < 90 && lampPlFlatCr(a, col) < cr; i++) { L -= 0.01; col = lampPlToHex(lampPlFromLab([L, q[1], q[2]])); }
  return col;
}
const lampPlChroma = (c, f) => { const q = lampPlToLab(lampPlHex(c)); return lampPlToHex(lampPlFromLab([q[0], q[1] * f, q[2] * f])); };
// The ground under the words: the zenith's hue, deepened until white at `a` clears 4.7:1.
function lampPlGroundA(zenith, a) {
  const q = lampPlToLab(lampPlHex(zenith)); let L = Math.min(q[0], a > 0.6 ? 0.5 : 0.3), col;
  for (let i = 0; i < 60; i++) {
    col = lampPlToHex(lampPlFromLab([L, q[1] * 0.8, q[2] * 0.8]));
    if (lampPlFlatCr(a, col) >= 4.7) break;
    L -= 0.01;
  }
  return col;
}

// ---- the palette of one plate at one light --------------------------------

// rim and glow decide the light pool of the ground; disc and glow draw the sun or moon.
function lampPlatePal(plate, light) {
  const L = LAMP_PLATE_CLEAR[light];
  if (plate === 'clear' || plate === 'fair' || plate === 'fog') return { rim: L.rim, glow: L.glow, disc: L.disc };
  const G = LAMP_PLATE_GREY[plate];
  if (light === 'day') return { rim: G.rim, glow: G.glow, disc: L.disc };
  let rim = lampPlMix(G.rim, LAMP_PLATE_TINT[light], 0.6);
  if (light === 'night' && plate === 'overcast') rim = lampPlAdj(rim, 0.82, 1);
  return { rim: rim, glow: L.glow, disc: L.disc };
}

// ---- loading a plate --------------------------------------------------------

// The mean colour of a band of rows in a plate, as hex.
function lampPlateRows(im, y0, y1) {
  const c = document.createElement('canvas'); c.width = 144; c.height = 36;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, 144, 36);
  const d = g.getImageData(0, Math.round(y0 * 36), 144, Math.max(1, Math.round((y1 - y0) * 36))).data;
  let r = 0, gg = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
  return lampPlToHex([r / n, gg / n, b / n]);
}

// The plate at `k` of its OKLab chroma, in a canvas. The lightness does not change.
function lampPlateTone(im, k) {
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
  if (k === 1) return c;
  const L = new Float32Array(256);
  for (let i = 0; i < 256; i++) L[i] = lampPlLin(i);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = L[p[i]], gg = L[p[i + 1]], b = L[p[i + 2]];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * gg + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * gg + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * gg + 0.6299787005 * b);
    const Q = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const A = k * (1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s);
    const B = k * (0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
    const l3 = Math.pow(Q + 0.3963377774 * A + 0.2158037573 * B, 3);
    const m3 = Math.pow(Q - 0.1055613458 * A - 0.0638541728 * B, 3);
    const s3 = Math.pow(Q - 0.0894841775 * A - 1.2914855480 * B, 3);
    // The pixel array clamps values above 255.
    p[i] = lampPlDelin(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3);
    p[i + 1] = lampPlDelin(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3);
    p[i + 2] = lampPlDelin(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3);
  }
  g.putImageData(d, 0, 0);
  return c;
}

// The OKLab lightness of a plate at a third of its width, 0-255, for the cloud mask of the moon.
function lampPlateLum(im) {
  const w = Math.max(1, Math.round((im.naturalWidth || im.width) / 3));
  const h = Math.max(1, Math.round((im.naturalHeight || im.height) / 3));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(im, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, L = new Uint8Array(w * h), C = new Uint8Array(w * h);
  for (let i = 0; i < L.length; i++) {
    const q = lampPlToLab([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
    L[i] = Math.round(255 * q[0]);
    // The OKLab chroma x 1000, for the sun's cloud by day (0.119.0-dev). It is the toned plate's.
    C[i] = Math.min(255, Math.round(1000 * Math.hypot(q[1], q[2])));
  }
  return { L: L, C: C, w: w, h: h };
}
// The toned plate's colours at half its size, for the glass's measure (0.120.0-dev). A third was
// too coarse: a bright cumulus edge on a phone measured 0.1 under the floor.
function lampPlateRgb(im) {
  const w = Math.max(1, Math.round((im.naturalWidth || im.width) / 2));
  const h = Math.max(1, Math.round((im.naturalHeight || im.height) / 2));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(im, 0, 0, w, h);
  return { rgb: g.getImageData(0, 0, w, h).data, w: w, h: h };
}

const lampPlateCache = {};
// Returns { state: 'wait' | 'ok' | 'fail', sky, w, h, src, lum }. `src` is the toned plate as a blob
// URL (the file's URL if the tone fails). `lum` is null if it cannot be read: the moon then has no
// cloud mask. A plate that is still loading calls `done` once.
function lampPlateLoad(url, done) {
  let e = lampPlateCache[url];
  if (!e) {
    e = lampPlateCache[url] = { state: 'wait', cbs: [] };
    const im = new Image();
    const end = function (ok) {
      e.state = ok ? 'ok' : 'fail';
      const cbs = e.cbs; e.cbs = [];
      cbs.forEach(function (f) { f(); });
    };
    im.onload = function () {
      let src = im;
      try { src = lampPlateTone(im, LAMP_PLATE_CHROMA); } catch (err) { src = im; }
      try {
        // The rows are shares of the 3:1 band at the top of the file (all of a plates-1 file).
        const bf = Math.min(1, im.naturalWidth / 3 / im.naturalHeight);
        e.sky = [lampPlateRows(src, 0, 0.2 * bf), lampPlateRows(src, 0.45 * bf, 0.6 * bf), lampPlateRows(src, 0.85 * bf, bf)];
        e.w = im.naturalWidth; e.h = im.naturalHeight;
      } catch (err) { end(false); return; }
      try { e.lum = lampPlateLum(src); } catch (err) { e.lum = null; }
      try { e.px = lampPlateRgb(src); } catch (err) { e.px = null; }
      if (src === im) { e.src = url; end(true); return; }
      src.toBlob(function (blob) {
        e.src = blob ? URL.createObjectURL(blob) : url;
        end(true);
      }, 'image/webp', 0.95);
    };
    im.onerror = function () { end(false); };
    im.src = url;
  }
  if (e.state === 'wait' && done) e.cbs.push(done);
  return e;
}

// ---- the choice -------------------------------------------------------------

// The moon's phase from the date: the lit fraction, and whether it wanes. There is no moon entity.
function lampPlateMoon(date) {
  const P = 29.530588;
  const age = (((date.getTime() / 86400000 - 10962.76) % P) + P) % P;
  return { phase: (1 - Math.cos(2 * Math.PI * age / P)) / 2, waning: age > P / 2 };
}

// Which plates, and how much of the second. `el` is the sun's elevation (rounded by the caller).
function lampPlateChoose(cond, el, base) {
  const plate = LAMP_PLATE_OF[cond] || 'overcast';
  const w = lampLightWeights(el);
  const on = LAMP_PLATE_ORDER.filter(function (l) { return w[l] > 0; })
    .sort(function (p, q) { return w[q] - w[p]; });
  const a = on[0];
  let b = on[1] || null, t = 0;
  if (b) { t = Math.round(w[b] / (w[a] + w[b]) * 20) / 20; if (!t) b = null; }
  const url = function (l) { return base + plate + '-' + l + '.webp'; };
  const covered = !!LAMP_PLATE_COVER[plate];
  const moon = !covered && w.night > 0 ? lampPlateMoon(new Date()) : null;
  return {
    plate: plate, w: w, a: a, b: b, t: t, urlA: url(a), urlB: b ? url(b) : null,
    key: plate + '-' + a + (b ? '+' + b + '@' + t : '') +
      (moon ? '|m' + Math.round(moon.phase * 20) + (moon.waning ? 'w' : '') : ''),
    moon: moon
  };
}

// ---- the sun and the moon ---------------------------------------------------

// The replica's glow: two round gradients from 0.9 r, at strength k (1 for the sun).
function lampPlateGlow(g, x, y, r, glow, k) {
  for (const f of [[2.1, 0.14], [1.5, 0.22]]) {
    const rg = g.createRadialGradient(x, y, r * 0.9, x, y, r * f[0] * 1.3);
    rg.addColorStop(0, lampPlRgba(glow, f[1] * 1.6 * k)); rg.addColorStop(1, lampPlRgba(glow, 0));
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r * f[0] * 1.3, 0, 6.2832); g.fill();
  }
}

// The replica's `disc`, round and soft, with its glow. `c` holds disc and glow. The sun only.
function lampPlateDisc(g, x, y, r, c) {
  lampPlateGlow(g, x, y, r, c.glow, 1);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.clip();
  const rg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, c.disc);
  g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.restore();
}

// The moon's light by phase. The phase angle a comes from the lit fraction, the light from the moon's
// magnitude law (0.026 a + 4e-9 a^4 magnitudes, a in degrees). `k` is its cube root: the eye sees
// lightness close to a cube root, and a halo at the true light would vanish at half moon.
// `dx` is the centre of the lit part, from the disc's centre, to the lit side:
// 4 / (3 pi) * (r + ex) for a crescent, 4 / (3 pi) * (r - ex) for a gibbous moon.
function lampPlateMoonLight(phase, waning, r) {
  const a = Math.acos(Math.max(-1, Math.min(1, 2 * phase - 1))) * 180 / Math.PI;
  const k = Math.cbrt(Math.pow(10, -0.4 * (0.026 * a + 4e-9 * Math.pow(a, 4))));
  const ex = r * Math.abs(1 - 2 * phase);
  const dx = 4 / (3 * Math.PI) * (phase < 0.5 ? r + ex : r - ex);
  return { k: k, dx: waning ? -dx : dx };
}

// The cloud mask round the moon, one value for each px of the box (bx, by, bw, bh) of the sky box.
// 0 is clear sky, 1 is cloud. A blend mixes the masks of its two plates by the blend weight.
// A plate without `lum` counts as clear sky.
function lampPlateCloud(plate, A, B, t, W, top, bx, by, bw, bh) {
  const m = new Float32Array(bw * bh);
  if (plate === 'fog') { m.fill(LAMP_PLATE_MOON.fog); return m; }
  const M = LAMP_PLATE_MOON, pw = W * 1.5;
  const raw = new Float32Array(bw * bh);
  [[A, B ? 1 - t : 1], [B, t]].forEach(function (pair) {
    const P = pair[0], wt = pair[1];
    if (!P || !P.lum || !wt) return;
    const x0 = (W - pw) / 2, y0 = top - LAMP_PLATE_ROW * pw, s = P.lum.w / pw;
    const Lb = new Uint8Array(bw * bh);
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      const u = Math.min(P.lum.w - 1, Math.max(0, Math.floor((bx + i + 0.5 - x0) * s)));
      const v = Math.min(P.lum.h - 1, Math.max(0, Math.floor((by + j + 0.5 - y0) * s)));
      Lb[j * bw + i] = P.lum.L[v * P.lum.w + u];
    }
    // The line from this plate's own sky: the M.sky share of the box's px is darker than the sky.
    const hist = new Uint32Array(256);
    for (let i = 0; i < Lb.length; i++) hist[Lb[i]]++;
    let c = 0, sky = 0;
    while (sky < 255 && (c += hist[sky]) < M.sky * Lb.length) sky++;
    const l0 = Math.min(M.ceil, sky / 255 + M.above), l1 = l0 + M.width;
    for (let i = 0; i < Lb.length; i++) {
      const q = Math.max(0, Math.min(1, (Lb[i] / 255 - l0) / (l1 - l0)));
      raw[i] += wt * q * q * (3 - 2 * q);
    }
  });
  // A 3 px box blur takes out the stars and softens the edge to the plate's own softness.
  // A speck under 0.22 is a star, not a cloud: a star of one or two px blurs to 0.11 or 0.22.
  // From 0.22 to 0.4 the mask comes in by a smooth ramp. Until 0.100.2-dev it was a hard cut at
  // 0.25, so the fade jumped from 0 to 25% at the edge of a cloud.
  for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
    let s = 0, n = 0;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      const I = i + a, J = j + b;
      if (I >= 0 && I < bw && J >= 0 && J < bh) { s += raw[J * bw + I]; n++; }
    }
    const q = s / n, e = Math.max(0, Math.min(1, (q - 0.22) / 0.18));
    m[j * bw + i] = q * e * e * (3 - 2 * e);
  }
  return m;
}

// The moon behind the cloud, drawn into `g` (a canvas of the sky box, W x SH, with its pixel ratio).
// The glow, then only the lit part of the disc: the dark limb is the plate seen through the glow.
// Then the disc and glow fade by the cloud mask, and the cloud in front of the moon takes a halo.
// `k` is the night weight. `c` holds disc and glow. `mask` is { m, x, y, w, h } from lampPlateCloud.
function lampPlateMoonDraw(g, W, x, y, r, c, moon, mask, k) {
  const cv = g.canvas, D = cv.width / W;
  const lt = lampPlateMoonLight(moon.phase, moon.waning, r);
  const lay = document.createElement('canvas'); lay.width = cv.width; lay.height = cv.height;
  const L = lay.getContext('2d', { willReadFrequently: true }); L.setTransform(D, 0, 0, D, 0, 0);
  lampPlateGlow(L, x + lt.dx, y, r, c.glow, lt.k);
  const dc = document.createElement('canvas'); dc.width = cv.width; dc.height = cv.height;
  const d = dc.getContext('2d'); d.setTransform(D, 0, 0, D, 0, 0);
  // The lit part is one path: the limb on the lit side, then the terminator, a half-ellipse of
  // half-width ex. It is drawn for a waxing moon and turned over for a waning one, whose lit side is
  // on the left. The path is made in the turned frame and filled in the plain frame, so the gradient's
  // highlight stays at the top left.
  // Until 0.100.1-dev the whole disc was clipped to the circle, and then all outside the lit part was
  // erased along the same circle. Each pixel on the lit limb was antialiased twice, so a thin moon
  // had a stepped edge (13 Nov 2026). Now each edge is antialiased once.
  const rg = d.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, c.disc);
  d.save();
  if (moon.waning) { d.translate(x, 0); d.scale(-1, 1); d.translate(-x, 0); }
  d.beginPath();
  if (moon.phase < 0.995) {
    const ex = r * Math.abs(1 - 2 * moon.phase);
    d.moveTo(x, y - r); d.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
    d.ellipse(x, y, Math.max(ex, 0.01), r, 0, Math.PI / 2, -Math.PI / 2, moon.phase < 0.5);
    d.closePath();
  } else d.arc(x, y, r, 0, 6.2832);
  d.restore();
  d.fillStyle = rg; d.fill();
  // The seas, only on the lit part: `source-atop` paints where the lit part already is.
  d.save(); d.globalCompositeOperation = 'source-atop';
  const R = lampSkyRng(7);
  for (let i = 0; i < 6; i++) {
    d.fillStyle = 'rgba(120,140,190,0.16)';
    d.beginPath(); d.arc(x + (R() - 0.5) * r * 1.2, y + (R() - 0.5) * r * 1.2, r * (0.15 + R() * 0.25), 0, 6.2832); d.fill();
  }
  d.restore();
  L.setTransform(1, 0, 0, 1, 0, 0); L.drawImage(dc, 0, 0);

  // The fade and the halo, pixel by pixel in the mask's box only.
  const M = LAMP_PLATE_MOON, gc = lampPlHex(c.glow), R0 = r * M.haloR, hx = x + lt.dx;
  const X0 = Math.round(mask.x * D), Y0 = Math.round(mask.y * D);
  const X1 = Math.min(cv.width, Math.round((mask.x + mask.w) * D)), Y1 = Math.min(cv.height, Math.round((mask.y + mask.h) * D));
  if (X1 > X0 && Y1 > Y0) {
    const img = L.getImageData(X0, Y0, X1 - X0, Y1 - Y0), p = img.data;
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) {
      const xx = X / D, yy = Y / D, i = ((Y - Y0) * (X1 - X0) + (X - X0)) * 4;
      // The mask has one value for each CSS px, at the px centre. It is blended between the four nearest
      // values, so that the fade has no 2 or 3 device px steps (13 Nov 2026, 0.100.3-dev).
      const u = (X + 0.5) / D - mask.x - 0.5, v = (Y + 0.5) / D - mask.y - 0.5;
      const i0 = Math.max(0, Math.min(mask.w - 1, Math.floor(u))), i1 = Math.min(mask.w - 1, i0 + 1);
      const j0 = Math.max(0, Math.min(mask.h - 1, Math.floor(v))), j1 = Math.min(mask.h - 1, j0 + 1);
      const fu = Math.max(0, Math.min(1, u - i0)), fv = Math.max(0, Math.min(1, v - j0)), mk = mask.m;
      const top0 = (mk[j0 * mask.w + i0] || 0) * (1 - fu) + (mk[j0 * mask.w + i1] || 0) * fu;
      const bot0 = (mk[j1 * mask.w + i0] || 0) * (1 - fu) + (mk[j1 * mask.w + i1] || 0) * fu;
      const mm = top0 * (1 - fv) + bot0 * fv;
      let a = p[i + 3] / 255 * (1 - mm), cr = p[i], cg = p[i + 1], cb = p[i + 2];
      const dd = Math.hypot(xx - hx, yy - y), h = M.halo * lt.k * Math.exp(-(dd / R0) * (dd / R0)) * mm;
      if (h > 0.002) {
        const A = h + a * (1 - h);
        cr = (gc[0] * h + cr * a * (1 - h)) / A; cg = (gc[1] * h + cg * a * (1 - h)) / A; cb = (gc[2] * h + cb * a * (1 - h)) / A;
        a = A;
      }
      p[i] = cr; p[i + 1] = cg; p[i + 2] = cb; p[i + 3] = Math.round(255 * a);
    }
    L.putImageData(img, X0, Y0);
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = k; g.drawImage(lay, 0, 0); g.restore();
}

// The sun's cloud maps in the box (bx, 0, bw, SH) of the sky box, one value for each CSS px:
// m (catches light), occ (hides the sun) and L (the plate's lightness). A blend mixes the two plates by
// the blend weight. `la`, `lb` are the plates' lights. Returns null if a plate has no `lum`.
function lampPlateSunMaps(A, B, t, la, lb, W, top, bx, bw, bh) {
  const S = LAMP_PLATE_SUN, k = LAMP_PLATE_CHROMA, pw = W * 1.5, n = bw * bh;
  const ss = function (a, b, v) { const u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
  const raw = new Float32Array(n), den = new Float32Array(n), L = new Float32Array(n);
  let ok = true;
  [[A, B ? 1 - t : 1, la], [B, t, lb]].forEach(function (pr) {
    const P = pr[0], wt = pr[1], day = pr[2] === 'day';
    if (!P || !wt) return;
    if (!P.lum || !P.lum.C) { ok = false; return; }
    const x0 = (W - pw) / 2, y0 = top - LAMP_PLATE_ROW * pw, s = P.lum.w / pw;
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      const u = Math.min(P.lum.w - 1, Math.max(0, Math.floor((bx + i + 0.5 - x0) * s)));
      const v = Math.min(P.lum.h - 1, Math.max(0, Math.floor((j + 0.5 - y0) * s)));
      const q = P.lum.L[v * P.lum.w + u] / 255, c = P.lum.C[v * P.lum.w + u] / 1000 / k, o = j * bw + i;
      raw[o] += wt * Math.max(ss(S.cloud.l0, S.cloud.l1, q), day ? ss(S.cloud.c0, S.cloud.c1, c) : 0);
      den[o] += wt * Math.max(ss(S.dens.l0, S.dens.l1, q), day ? ss(S.dens.c0, S.dens.c1, c) : 0);
      L[o] += wt * q;
    }
  });
  if (!ok) return null;
  const box = function (src, R) {
    const out = new Float32Array(n);
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      let s = 0, c = 0;
      for (let b = -R; b <= R; b++) for (let a = -R; a <= R; a++) {
        const I = i + a, J = j + b;
        if (I >= 0 && I < bw && J >= 0 && J < bh) { s += src[J * bw + I]; c++; }
      }
      out[j * bw + i] = s / c;
    }
    return out;
  };
  // The light mask: the moon's blur and speck cut. The hiding mask: a wider blur, then the thin-cloud curve.
  const m = box(raw, 1), occ = box(den, S.dens.blur);
  for (let i = 0; i < n; i++) {
    const e = Math.max(0, Math.min(1, (m[i] - 0.22) / 0.18));
    m[i] = m[i] * e * e * (3 - 2 * e);
    occ[i] = ss(S.dens.o0, S.dens.o1, occ[i]);
  }
  return { m: m, occ: occ, L: L, x: bx, w: bw, h: bh };
}

// The sun behind the cloud, drawn into `g` (a canvas of the sky box, W x SH, with its pixel ratio) at
// strength `k` (the sun's weight). `c` holds disc and glow (hex); `heat` is the heat share, 0 to 1;
// `low` is the golden share of the sun's light; `maps` is from lampPlateSunMaps, or null (no cloud).
// Order: the hot glow and rays, the plate glow and disc; then, pixel by pixel in the box, the fade by
// the cloud, the halo and the lift behind what is left, and the glare on top.
function lampPlateSunDraw(g, W, SH, x, y, r, c, heat, low, maps, k) {
  const S = LAMP_PLATE_SUN, Hh = LAMP_PLATE_HOT, cv = g.canvas, D = cv.width / W;
  const lay = document.createElement('canvas'); lay.width = cv.width; lay.height = cv.height;
  const d = lay.getContext('2d', { willReadFrequently: true }); d.setTransform(D, 0, 0, D, 0, 0);
  const mix = function (a, b, u) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * u); }); };
  const rgba = function (q, a) { return 'rgba(' + q.join(',') + ',' + a + ')'; };
  const disc = lampPlHex(c.disc), glow = lampPlHex(c.glow);
  const K = Math.max(0, Math.min(1, heat)), G = 5 * r * (0.75 + 0.25 * K);
  const amber = mix(Hh.amber, Hh.ambLow, low), heart = mix(Hh.heart, Hh.heartLow, low);
  if (K > 0) {
    // The #today glow (LAMP_SUN_PROFILE) at strength K, its inner floor scaled in by the heat.
    const fl = K, rg = d.createRadialGradient(x, y, 0, x, y, G);
    rg.addColorStop(0, rgba(heart, 0.95 * fl));
    LAMP_SUN_PROFILE.forEach(function (q) { rg.addColorStop(q[0], rgba(mix(amber, heart, q[2]), q[1] * (q[0] <= 0.22 ? fl : K))); });
    d.fillStyle = rg; d.beginPath(); d.arc(x, y, G, 0, 6.2832); d.fill();
    // The 36 rays of lampPopupArc, from the same seed, blurred 0.8 px where the browser can.
    const rs = lampArcRandom(23), rr = d.createRadialGradient(x, y, 0, x, y, G * 0.85);
    rr.addColorStop(0, rgba(mix(amber, heart, 0.3), 0)); rr.addColorStop(0.22, rgba(mix(amber, heart, 0.3), 0.5 * K));
    rr.addColorStop(0.5, rgba(amber, 0.3 * K)); rr.addColorStop(1, rgba(amber, 0));
    d.save(); d.filter = 'blur(0.8px)'; d.fillStyle = rr; d.beginPath();
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * 2 * Math.PI + (rs() - 0.5) * 0.1, card = Math.abs(Math.sin(2 * a));
      const Ln = G * (0.6 + rs() * 0.25 + (1 - card) * 0.15), ww = r * (0.06 + rs() * 0.07);
      const ca = Math.cos(a), sa = Math.sin(a), r0 = r * 0.9;
      d.moveTo(x + ca * r0 - sa * ww, y + sa * r0 + ca * ww); d.lineTo(x + ca * Ln, y + sa * Ln);
      d.lineTo(x + ca * r0 + sa * ww, y + sa * r0 - ca * ww); d.closePath();
    }
    d.fill(); d.restore();
  }
  lampPlateDisc(d, x, y, r, c);

  if (maps) {
    const bw = maps.w, bh = maps.h, ss = function (a, b, v) { const u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
    // How much of the disc shows, and how much cloud touches the sun (within 2 r).
    let vs = 0, vn = 0, cs = 0, cn0 = 0;
    for (let j = Math.max(0, Math.floor(y - 2 * r)); j < Math.min(bh, Math.ceil(y + 2 * r)); j++)
      for (let i = Math.max(0, Math.floor(x - maps.x - 2 * r)); i < Math.min(bw, Math.ceil(x - maps.x + 2 * r)); i++) {
        const dd = Math.hypot(maps.x + i + 0.5 - x, j + 0.5 - y);
        if (dd <= r) { vs += 1 - (1 - S.pass) * maps.occ[j * bw + i]; vn++; }
        if (dd <= 2 * r) { cs += maps.m[j * bw + i]; cn0++; }
      }
    const vis = vn ? vs / vn : 1, cn = cn0 ? cs / cn0 : 0;
    const hc = mix(glow, mix(amber, heart, 0.35), K), gc = mix(disc, mix(amber, heart, 0.6), 0.25 * K);
    const R0 = r * S.haloR + (G * 0.7 - r * S.haloR) * K;
    const Lgc = lampPlToLab(gc)[0], liftK = S.lift * ss(S.cn0, S.cn1, cn), gK = S.glare * Math.sqrt(vis);
    const X0 = Math.round(maps.x * D), X1 = Math.min(cv.width, Math.round((maps.x + bw) * D)), Y1 = Math.min(cv.height, Math.round(bh * D));
    if (X1 > X0) {
      const img = d.getImageData(X0, 0, X1 - X0, Y1), p = img.data, IW = X1 - X0;
      const over = function (i, q, h, a) {   // q at strength h behind what is there (alpha a); returns the new alpha
        const A = a + h * (1 - a);
        p[i] = (p[i] * a + q[0] * h * (1 - a)) / A; p[i + 1] = (p[i + 1] * a + q[1] * h * (1 - a)) / A; p[i + 2] = (p[i + 2] * a + q[2] * h * (1 - a)) / A;
        return A;
      };
      for (let Y = 0; Y < Y1; Y++) for (let X = X0; X < X1; X++) {
        const xx = (X + 0.5) / D, yy = (Y + 0.5) / D, i = (Y * IW + (X - X0)) * 4;
        // The maps blended between the four nearest values, as lampPlateMoonDraw does: no px steps.
        const u = xx - maps.x - 0.5, v = yy - 0.5;
        const i0 = Math.max(0, Math.min(bw - 1, Math.floor(u))), i1 = Math.min(bw - 1, i0 + 1);
        const j0 = Math.max(0, Math.min(bh - 1, Math.floor(v))), j1 = Math.min(bh - 1, j0 + 1);
        const fu = Math.max(0, Math.min(1, u - i0)), fv = Math.max(0, Math.min(1, v - j0));
        const bl = function (M) {
          return (M[j0 * bw + i0] * (1 - fu) + M[j0 * bw + i1] * fu) * (1 - fv) + (M[j1 * bw + i0] * (1 - fu) + M[j1 * bw + i1] * fu) * fv;
        };
        const mk = bl(maps.m), oc = bl(maps.occ), dd = Math.hypot(xx - x, yy - y);
        let a = p[i + 3] / 255 * (1 - (1 - S.pass) * oc);
        const hh = S.halo * Math.exp(-(dd / R0) * (dd / R0)) * mk;
        if (hh > 0.002) a = over(i, hc, hh, a);
        if (liftK > 0) {
          const lf = liftK * Math.exp(-(dd / (S.liftR * r)) * (dd / (S.liftR * r))) * ss(S.need0, S.need1, Lgc - bl(maps.L));
          if (lf > 0.002) a = over(i, gc, lf, a);
        }
        const lc = Math.max(0, Math.min(1, oc / 0.4));
        const gl = gK * Math.exp(-(dd / (S.glareR * r)) * (dd / (S.glareR * r))) * Math.max(lc * lc * (3 - 2 * lc), cn);
        if (gl > 0.002) {   // the glare lies on top
          const A = gl + a * (1 - gl);
          p[i] = (gc[0] * gl + p[i] * a * (1 - gl)) / A; p[i + 1] = (gc[1] * gl + p[i + 1] * a * (1 - gl)) / A; p[i + 2] = (gc[2] * gl + p[i + 2] * a * (1 - gl)) / A;
          a = A;
        }
        p[i + 3] = Math.round(255 * a);
      }
      d.putImageData(img, X0, 0);
    }
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = k; g.drawImage(lay, 0, 0); g.restore();
}

// ---- the build --------------------------------------------------------------

const lampPlPx = (v) => (Math.round(v * 100) / 100) + 'px';

// ---- the glass (0.120.0-dev) --------------------------------------------------

// The contrast of white at `a` over an [r, g, b] colour.
function lampPlCrRgb(a, c) {
  const lb = lampPlY(c[0], c[1], c[2]);
  const lt = lampPlY(a * 255 + (1 - a) * c[0], a * 255 + (1 - a) * c[1], a * 255 + (1 - a) * c[2]);
  return (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05);
}
// The soft linear ramp of the glass: quadratic ends of 20 percent.
function lampPlSoft(u) {
  u = Math.max(0, Math.min(1, u));
  const E = 0.2, k = 2 * E * (1 - E);
  return u < E ? u * u / k : (u > 1 - E ? 1 - (1 - u) * (1 - u) / k : (u - E / 2) / (1 - E));
}
// A mask that fades in from y0 to y1 on a smootherstep curve.
function lampPlRamp(y0, y1) {
  const s = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8, k = u * u * u * (u * (u * 6 - 15) + 10);
    s.push('rgba(0,0,0,' + k.toFixed(3) + ') ' + lampPlPx(y0 + (y1 - y0) * u));
  }
  return 'linear-gradient(180deg,' + s.join(',') + ')';
}
// The tint at each px of the card height, 0 .. H. `roles` are the text boxes of the card:
// [{ n: role, x, y, w, h: card px, ink: the text's white alpha, floor }]. `cols` are the tint's
// colours at y 40, y1 and the foot, as [r, g, b]. Returns null when the plate has no pixels.
function lampPlateGlass(A, B, t, W, H, top, roles, cols, y1) {
  const G = LAMP_PLATE_GLASS;
  if (!A.px) return null;
  const pw = W * 1.5, x0 = (W - pw) / 2, yp = top - LAMP_PLATE_ROW * pw;
  const tint = function (y) {
    const p = y <= 40 ? [cols[0], cols[0], 0] : (y <= y1 ? [cols[0], cols[1], (y - 40) / (y1 - 40)] :
      [cols[1], cols[2], Math.min(1, (y - y1) / Math.max(1, H - y1))]);
    return [0, 1, 2].map(function (i) { return p[0][i] + (p[1][i] - p[0][i]) * p[2]; });
  };
  // The brightest of the 2 x 2 pixels round the point, at half the plate's size: a phone draws the
  // plate at full size, where a bright cloud edge is brighter than an average shows.
  const pix = function (P, x, y) {
    const s = P.px.w / pw, W1 = P.px.w - 1, H1 = P.px.h - 1;
    const u0 = Math.min(W1, Math.max(0, Math.floor((x - x0) * s - 0.5)));
    const v0 = Math.min(H1, Math.max(0, Math.floor((y - yp) * s - 0.5)));
    let best = null, bY = -1;
    for (let dv = 0; dv <= 1; dv++) for (let du = 0; du <= 1; du++) {
      const i = (Math.min(H1, v0 + dv) * P.px.w + Math.min(W1, u0 + du)) * 4;
      const c = [P.px.rgb[i], P.px.rgb[i + 1], P.px.rgb[i + 2]], yv = lampPlY(c[0], c[1], c[2]);
      if (yv > bY) { bY = yv; best = c; }
    }
    return best;
  };
  const useB = B && B.px && t > 0;
  // The least tint for each role, on its 80 brightest pixels.
  const groups = {};
  roles.forEach(function (r) { (groups[r.n] = groups[r.n] || []).push(r); });
  const needs = [];
  Object.keys(groups).forEach(function (n) {
    const g = groups[n], pts = [];
    let topY = Infinity;
    g.forEach(function (r) {
      topY = Math.min(topY, r.y);
      for (let y = Math.floor(r.y); y < r.y + r.h; y++) for (let x = Math.floor(r.x); x < r.x + r.w; x++) {
        let c = pix(A, x + 0.5, y + 0.5);
        if (useB) { const d = pix(B, x + 0.5, y + 0.5); c = [0, 1, 2].map(function (i) { return c[i] * (1 - t) + d[i] * t; }); }
        pts.push([lampPlY(c[0], c[1], c[2]), c, y + 0.5]);
      }
    });
    if (!pts.length) return;
    pts.sort(function (p, q) { return q[0] - p[0]; });
    const top80 = pts.slice(0, 80).map(function (p) { return [p[1], tint(p[2])]; });
    const ink = g[0].ink, floor = g[0].floor + G.margin;
    let a = 0;
    const low = function (al) {
      let m = 99;
      top80.forEach(function (q) { m = Math.min(m, lampPlCrRgb(ink, [0, 1, 2].map(function (i) { return q[0][i] * (1 - al) + q[1][i] * al; }))); });
      return m;
    };
    while (a < 0.98 && low(a) < floor) a = Math.round((a + 0.02) * 100) / 100;
    needs.push([topY, a]);
  });
  // The envelope: the highest of the ramps, and the minimum ramp.
  const env = new Float32Array(H + 1);
  const ramp = function (y) {
    let v = G.min * lampPlSoft((y - G.y0) / (G.minTo - G.y0));
    needs.forEach(function (q) { v = Math.max(v, q[1] * lampPlSoft((y - G.y0) / Math.max(8, q[0] - G.y0))); });
    return v;
  };
  for (let y = 0; y <= H; y++) env[y] = ramp(y);
  // A Gaussian blur of the envelope, then the least factor that meets every role again.
  const R = 3 * G.sig, ker = [];
  for (let i = -R; i <= R; i++) ker.push(Math.exp(-0.5 * (i / G.sig) * (i / G.sig)));
  const sm = new Float32Array(H + 1);
  for (let y = 0; y <= H; y++) {
    let sum = 0, wt = 0;
    for (let j = 0; j < ker.length; j++) {
      const yy = y + j - R;
      sum += (yy < 0 ? 0 : env[Math.min(H, yy)]) * ker[j]; wt += ker[j];
    }
    sm[y] = sum / wt;
  }
  let k = 1;
  roles.forEach(function (r) {
    for (let y = Math.max(0, Math.floor(r.y)); y <= Math.min(H, Math.ceil(r.y + r.h)); y++) if (sm[y] > 0) k = Math.max(k, env[y] / sm[y]);
  });
  const prof = new Float32Array(H + 1);
  for (let y = 0; y <= H; y++) prof[y] = Math.min(G.cap, sm[y] * k);
  prof.needs = needs; prof.k = k;
  return prof;
}


// Draw the plate sky into `root`, an empty element that is positioned and clipped.
//   pick   the result of lampPlateChoose
//   A, B   the loaded plates: { sky, w, h }. B is null when there is no blend
//   o      { cond (the HA condition), wind: [km/h, bearing], grain: a CSS url() or '',
//            heat: the hot sun's share, 0 to 1 (LAMP_PLATE_HOT; 0 or missing on a mild day),
//            roles: the text boxes for the glass (see lampPlateGlass),
//            foot: false to leave out the deeper foot (LAMP_PLATE_FOOT); missing means true }
//   W, H   the card's client size
function lampPlatesBuild(root, pick, A, B, o, W, H) {
  const top = LAMP_PLATE_BAND, SH = top + 24, plate = pick.plate, w = pick.w, t = pick.t;
  const covered = !!LAMP_PLATE_COVER[plate];
  const layer = function (parent, css) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;inset:0;' + (css || '');
    parent.appendChild(d);
    return d;
  };

  // The colours. In a blend, the two plates' colours are mixed by the same weight as the plates.
  const mixTo = function (x, y) { return B ? lampPlMix(x, y, t) : x; };
  const sky = [0, 1, 2].map(function (i) { return mixTo(A.sky[i], B ? B.sky[i] : null); });

  // The tint's colours: the "1b Afterglow" colours (0.36.0-dev), deepened again for the glass.
  const a = 0.52, kG = LAMP_PLATE_CHROMA, G = LAMP_PLATE_GLASS;
  let base = lampPlGroundA(sky[0], a);
  let hz = lampPlDeepenTo(lampPlChroma(lampPlMix(base, sky[2], 0.8), 1.5), a, 4.7);
  // The tone: the ground's colours at kG of their chroma, deepened again to the same floor.
  if (kG !== 1) {
    base = lampPlDeepenTo(lampPlChroma(base, kG), a, 4.7);
    hz = lampPlDeepenTo(lampPlChroma(hz, kG), a, 4.7);
  }
  const foot = lampPlAdj(base, 0.72, 1.15);
  const cols = [hz, base, foot].map(function (c) { return lampPlHex(lampPlDeepenTo(c, a, G.deep)); });
  const y1 = 40 + 0.45 * (H - 40);

  // The plate, over the whole card, and the second plate at the blend weight.
  const pw = W * 1.5;
  const plates = function (parent, pad) {
    [[A, A.src || pick.urlA, 1], [B, B ? (B.src || pick.urlB) : null, t]].forEach(function (q) {
      if (!q[0]) return;
      const ph = pw * q[0].h / q[0].w;
      layer(parent, 'background:url(' + q[1] + ') no-repeat;background-size:' + lampPlPx(pw) + ' ' + lampPlPx(ph) +
        ';background-position:' + lampPlPx((W - pw) / 2 + pad) + ' ' + lampPlPx(top - LAMP_PLATE_ROW * pw + pad) +
        (q[2] < 1 ? ';opacity:' + q[2].toFixed(3) : ''));
    });
  };
  plates(root, 0);

  // The frost: three blurred copies of the plate, each faded in a little lower. A copy of the plate,
  // not backdrop-filter: the theme's backdrop blur is what draws the iOS bevel.
  G.steps.forEach(function (st) {
    const b = G.blur * st[0], pad = Math.ceil(3 * b) + 2, m = lampPlRamp(st[1], st[2]);
    const wrap = layer(root, 'overflow:hidden;-webkit-mask-image:' + m + ';mask-image:' + m);
    plates(layer(wrap, 'inset:-' + pad + 'px;filter:blur(' + b + 'px)'), pad);
  });

  // The sky box, faded from top - 40 to top + 28 on a smootherstep curve. It holds the sun or the
  // moon and the marks; they stay sharp over the frost.
  const stops = ['#000 0px'];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, s = u * u * u * (u * (u * 6 - 15) + 10);
    stops.push('rgba(0,0,0,' + (1 - s).toFixed(4) + ') ' + lampPlPx(top - 40 + u * 68));
  }
  const mask = 'linear-gradient(180deg,' + stops.join(',') + ')';
  const box = layer(root, 'bottom:auto;height:' + SH + 'px;overflow:hidden;-webkit-mask-image:' + mask + ';mask-image:' + mask);

  const canvas = function () {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    box.appendChild(cv);
    return lampSkyCanvas(cv, W, SH);
  };

  // The sun, then the moon. A covered sky has neither. The sun's place follows the weights of
  // day, golden and twilight; the moon fades in with the night weight.
  if (!covered) {
    const g = canvas(), p = lampPlatePal(plate, 'day');
    const sunW = w.day + w.golden + w.twilight;
    if (sunW > 0) {
      let sx = 0, sy = 0, disc = null, glow = null;
      ['day', 'golden', 'twilight'].forEach(function (l) {
        sx += w[l] * LAMP_PLATE_LIGHT[l].x; sy += w[l] * LAMP_PLATE_LIGHT[l].y;
      });
      sx /= sunW; sy /= sunW;
      const pd = lampPlatePal(plate, 'day'), pg = lampPlatePal(plate, 'golden');
      const wd = w.day + w.golden;
      if (wd > 0) {
        disc = lampPlMix(pd.disc, pg.disc, w.golden / wd);
        glow = lampPlMix(pd.glow, pg.glow, w.golden / wd);
        // The sun is behind the plate's cloud (LAMP_PLATE_SUN), except on fog, and hot by o.heat.
        const X = sx * W, Y = sy * SH, bx = Math.max(0, Math.floor(X - LAMP_PLATE_SUN.box));
        const bw = Math.min(W, Math.ceil(X + LAMP_PLATE_SUN.box)) - bx;
        let maps = null;
        try { if (plate !== 'fog') maps = lampPlateSunMaps(A, B, t, pick.a, pick.b, W, top, bx, bw, SH); } catch (err) { maps = null; }
        lampPlateSunDraw(g, W, SH, X, Y, 10, { disc: disc, glow: glow }, o.heat || 0, w.golden / wd, maps, sunW);
      }
    }
    // The moon is behind the plate's cloud: the mask covers 60 px round it, which holds the glow
    // (27 px) and all of the halo that can be seen.
    if (w.night > 0 && pick.moon) {
      const pn = lampPlatePal(plate, 'night');
      const mx = LAMP_PLATE_LIGHT.night.x * W, my = LAMP_PLATE_LIGHT.night.y * SH;
      const bx = Math.max(0, Math.floor(mx - 60)), bw = Math.min(W, Math.ceil(mx + 60)) - bx;
      const mask = { x: bx, y: 0, w: bw, h: SH, m: lampPlateCloud(plate, A, B, t, W, top, bx, 0, bw, SH) };
      lampPlateMoonDraw(g, W, mx, my, 10, { disc: pn.disc, glow: pn.glow }, pick.moon, mask, w.night);
    }
  }

  // The marks, over the plate. The card's own marks; stronger in low light for rain and thunder.
  const kind = LAMP_SKY_PLATE[o.cond] ? LAMP_SKY_PLATE[o.cond].air : null;
  if (kind && kind !== 'stars') {
    let boost = 1;
    if (plate === 'rain' || plate === 'thunder') {
      boost = 0;
      LAMP_PLATE_ORDER.forEach(function (l) { boost += w[l] * LAMP_PLATE_BOOST[l]; });
    }
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    box.appendChild(cv);
    lampSkyMarks(cv, W, SH, kind, { wind: o.wind, boost: boost, density: (W * SH) / (359 * 179) });
  }

  // The glass: the tint at each height, from lampPlateGlass. If the plate has no pixels, a safe
  // curve: 80% from y 36 to y 110.
  let prof = null;
  try { prof = lampPlateGlass(A, B, t, W, H, top, o.roles || [], cols, y1); } catch (err) { prof = null; }
  if (!prof) {
    prof = new Float32Array(H + 1);
    for (let y = 0; y <= H; y++) prof[y] = 0.8 * lampPlSoft((y - 36) / 74);
  }
  const tintAt = function (y) {
    const p = y <= 40 ? [cols[0], cols[0], 0] : (y <= y1 ? [cols[0], cols[1], (y - 40) / (y1 - 40)] :
      [cols[1], cols[2], Math.min(1, (y - y1) / Math.max(1, H - y1))]);
    return [0, 1, 2].map(function (i) { return Math.round(p[0][i] + (p[1][i] - p[0][i]) * p[2]); });
  };
  // The foot: its ink over the tint, as one colour and one opacity at each stop. Over the plate P,
  // the tint T at g and then the ink K at f give (1 - g)(1 - f) P + (1 - f) g T + f K.
  const F = LAMP_PLATE_FOOT, useFoot = o.foot !== false;
  const fq = lampPlToLab(cols[2]);
  const ink = lampPlHex(lampPlToHex(lampPlFromLab([F.inkL, fq[1], fq[2]])));
  const fy0 = F.from * H;
  const footAt = function (y) {
    return (!useFoot || y <= fy0) ? 0 : F.max * Math.pow(Math.min(1, (y - fy0) / (H - fy0)), F.pow);
  };
  const stop = function (y) {
    const c = tintAt(y), g = prof[y], f = footAt(y);
    if (f <= 0) return 'rgba(' + c.join(',') + ',' + g.toFixed(3) + ') ' + y + 'px';
    const A = 1 - (1 - g) * (1 - f);
    const m = [0, 1, 2].map(function (i) { return Math.round(((1 - f) * g * c[i] + f * ink[i]) / A); });
    return 'rgba(' + m.join(',') + ',' + A.toFixed(3) + ') ' + y + 'px';
  };
  const gs = [];
  for (let y = 0; y <= H; y += 2) gs.push(stop(y));
  if (H % 2) gs.push(stop(H));
  layer(root, 'background:linear-gradient(180deg,' + gs.join(',') + ')');
  // For the checks: the tint at the condition line (y 65) and at the foot, and each role's need.
  root.setAttribute('data-glass', prof[Math.min(H, 65)].toFixed(2) + '/' + prof[H].toFixed(2) +
    (useFoot ? '|f' + F.from + ':' + ink.join(',') : '|nofoot') +
    (prof.needs ? '|' + prof.needs.map(function (q) { return Math.round(q[0]) + ':' + q[1]; }).join(',') : '|safe'));

  if (o.grain) layer(root, 'background:' + o.grain);
}
