// Colour. A panel declares one accent. The other two colours come from it.
//
// CORE  = accent, saturation x 0.46           (hue and value stay)
// EMBER = accent, hue turned 12 degrees to red the short way,
//         saturation x 0.92, value x 0.79
//
// A turn of the hue, not a mix with red. A mix pulls a blue accent through
// grey and destroys it. A turn of 12 degrees makes each hue warmer by the
// same amount and destroys none.

// The ground is a theme token (01-type.js, THE TOKENS). LAMP_GROUND goes into CSS, where the
// browser resolves it for each card, so a card's own `theme` key or a Home Assistant theme wins.
// The canvas cannot read a var(), so it asks lampGroundRgb for the numbers.
const LAMP_GROUND_DEFAULT = 'rgb(19,20,24)';
const LAMP_GROUND = 'var(--lamplight-ground, ' + LAMP_GROUND_DEFAULT + ')';

// The ground as [r, g, b] for the element `el`. A custom property gives its text as written
// ("#131418", "rgb(19 20 24)"), so a 2D context turns it into numbers. Cached by the text.
const LAMP_GROUND_CACHE = {};
function lampGroundRgb(el) {
  let raw = '';
  try { raw = getComputedStyle(el).getPropertyValue('--lamplight-ground').trim(); } catch (e) { /* not in a document */ }
  raw = raw || LAMP_GROUND_DEFAULT;
  if (LAMP_GROUND_CACHE[raw]) return LAMP_GROUND_CACHE[raw];
  let rgb = [19, 20, 24];
  try {
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = '#000'; c.fillStyle = raw;
    const v = c.fillStyle;
    if (v[0] === '#') rgb = [1, 3, 5].map(function (i) { return parseInt(v.substr(i, 2), 16); });
    else rgb = (v.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  } catch (e) { /* keep the default */ }
  LAMP_GROUND_CACHE[raw] = rgb;
  return rgb;
}

function lampToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d !== 0) {
    if (mx === r) h = 60 * (((g - b) / d) % 6);
    else if (mx === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return [(h + 360) % 360, mx === 0 ? 0 : d / mx, mx];
}

function lampToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  s = Math.min(1, Math.max(0, s));
  v = Math.min(1, Math.max(0, v));
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
          : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return t.map(u => Math.round((u + m) * 255)).join(',');
}

// An accent already inside 12 degrees of red lands on red.
function lampTowardRed(h, deg) {
  const d = ((0 - h + 180) % 360 + 360) % 360 - 180;
  return Math.abs(d) <= deg ? 0 : (h + deg * Math.sign(d) + 360) % 360;
}

function lampCore(rgb) {
  const [h, s, v] = lampToHsv(...rgb.split(',').map(Number));
  return lampToRgb(h, s * 0.46, v);
}

function lampEmber(rgb) {
  const [h, s, v] = lampToHsv(...rgb.split(',').map(Number));
  return lampToRgb(lampTowardRed(h, 12), s * 0.92, v * 0.79);
}

// Multiply the OKLCH chroma of a colour by f. The OKLab lightness and hue stay.
// OKLCH chroma is fair across hues; an HSV saturation is not. Used by the
// pop-up header glyph (94-popup.js). A result outside sRGB is clipped per channel.
function lampTemper(rgb, f) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const gam = (x) => {
    x = Math.min(1, Math.max(0, x));
    return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055));
  };
  const [r, g, b] = rgb.split(',').map(Number).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720453 * s;
  const A = (1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s) * f;
  const B = (0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s) * f;
  const l3 = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m3 = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s3 = Math.pow(L - 0.0894841775 * A - 1.2914855480 * B, 3);
  return [gam(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
          gam(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
          gam(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3)].join(',');
}

// Read an accent as "r,g,b". Three forms are permitted:
//   "255,64,160"   the internal form
//   "#ff40a0"      hex, three or six digits
//   "rgb(255, 64, 160)"
function lampAccent(v) {
  if (typeof v !== 'string') throw new Error('accent must be a string');
  const s = v.trim();
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
  }
  m = s.match(/^rgba?\(([^)]+)\)$/i);
  const parts = (m ? m[1] : s).split(',').slice(0, 3).map(x => Number(x.trim()));
  if (parts.length !== 3 || parts.some(x => !isFinite(x) || x < 0 || x > 255)) {
    throw new Error('accent is not a colour: ' + v);
  }
  return parts.map(x => Math.round(x)).join(',');
}

// A pale tint of an accent, for text that sits on a chip of the same colour.
// Keep the hue, take most of the saturation out, and lift the value near white.
// This is only a DEFAULT. The four bin colours on the household dashboard were
// picked by hand and do not follow one rule, so they are given explicitly.
function lampTint(rgb) {
  const [h, s, v] = lampToHsv(...rgb.split(',').map(Number));
  return '#' + lampToRgb(h, s * 0.25, Math.max(v, 0.97))
    .split(',').map(x => (+x).toString(16).padStart(2, '0')).join('');
}

// Mix two "r,g,b" colours. t = 0 gives a, t = 1 gives b.
function lampMix(a, b, t) {
  const A = String(a).split(',').map(Number), B = String(b).split(',').map(Number);
  return A.map(function (v, k) { return Math.round(v + (B[k] - v) * t); }).join(',');
}
