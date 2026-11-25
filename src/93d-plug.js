// The hero of the plug sheets: "The Painted Glow", option 4 of design-docs/plug_hero_options.html,
// chosen by the household on 8 Nov 2026. It replaces the 24-hour trace, which scaled to each day's own
// peak: a steady 4 W modem and a steady 11 W access point drew the same flat line, and a plug that was
// off drew the same line as one that was on at under 1 W.
//
// THE PICTURE
// A UK smart plug, in the style of the #windows painting, at an angle, 85px wide. Since 0.85.0-dev
// (9 Nov 2026) it is drawn in code (design-docs/plug_hero_drawn/draw_plug.mjs) from the camera of the
// household's painted plug, which it replaces (that image: 8 Nov 2026, lamplight-cards/popup_art_brief.md).
// Its foot stands on the header's horizon at y 120, and its right edge stops 8px before the close
// button's column. Three plates (93c-plug-plates.js):
//   base  the dormant plug, matte, lit from the top right, at the tones of the painted off plug, with no
//         lit border. It is drawn in every state
//   glow  the active light alone: the ring with its pale core, the face lit from inside, a warm spill on
//         the plug's own top and side, and a deep amber pool on the floor, textured, with a darker band
//         under the foot. It is added to the base (plus-lighter), so base + glow is the lit plug
//   idle  the idle light alone: the thin ring
// One tint, or one ramp by brightness, cannot make that light: the face and the floor have the same
// brightness and different colours. So the glow keeps the painted colour of every pixel.
//
// THE STATES (the plug body works them out and sends them up; see 97-plug-detail.js)
//   off     the base only
//   idle    the base and the idle light. Rule B: under 1 W is idle only for a plug that usually draws
//           1 W or more (its seven-day mean), so a device that is meant to sip half a watt is active
//   active  the base and the glow
//   gone    the base at 45%, the weight of a dead contact
//
// THE COLOUR
// The plates are painted in the Lounge amber, marigold.deep 250,152,30 (LAMP_PLUG_HERO.ref). Since 0.123.0-dev
// (16 Nov 2026) every plug sheet shows one colour, LAMP_PLUG_HERO.amber, not the room accent. From
// 0.123.0-dev to 0.144.0-dev it was a gold, 239,160,0: the hue of the reference image's bright ring
// (inspiration/smartplug-popup/, OKLCH h 75) at the amber's chroma. On 22 Nov 2026 the household found
// that gold yellowish. They compared five hues from 73.8 to 63.9 degrees
// (design-docs/plug_hero_drawn/amber_compare.png) and chose the amber itself, so the light now shows
// as painted, with no hue turn.
// lampPlugLight turns the light's OKLab hue by the angle from `ref` to the colour it gets, once, in a
// canvas, so every pixel keeps its lightness and chroma. The light is at full chroma: the named exception
// to the header's 62% rule, as #batteries is. The air purifier still turns to its room accent.
//
// MOTION only explains a change. When the state changes while the sheet is open, the old light fades
// out and the new one in, over 0.6 s. Nothing moves when the sheet opens. prefers-reduced-motion stops it.

// THE WEIGHT (8 Nov 2026, option 2a of design-docs/popup_hero_harmony_options.html): the lit plug was the
// heaviest picture of the set: body lightness 0.69 against 0.36-0.44, and 45% of the hero box. Now it is
// 85px wide, its body draws at 80% and its light at 75%, so the lit body is at the battery bars' 0.57 and
// covers 34%. `size` is the width, `body` and `light` the two strengths.
const LAMP_PLUG_HERO = { w: 344, h: 456, left: 20, right: 320, foot: 316, size: 85, body: 0.8, light: 0.75, ref: LAMP_PALETTE.marigold.deep, amber: LAMP_MEANINGS.plug.light };
// The space the plug needs from the sheet's right edge. Its left ink is at W - 62 - size, and the title's
// ink (plus the 12px that _titleEnd's caller adds) may come 4px further left. At 100px wide this was 158:
// at 161 the rounding of "Christmas Lights" (ink to 202.7px at 375px) left that sheet with no plug
// (0.75.0-dev, found by the live check on 8 Nov 2026).
const LAMP_PLUG_ROOM = 58 + LAMP_PLUG_HERO.size;
// A long title (design-docs/long_title_options.html, option 3, 8 Nov 2026): before the title steps down,
// the plug slides right, up to LAMP_PLUG_SLIDE px, and passes under the close button. Past
// LAMP_PLUG_SMOKE_AT px its corner is under the button, and the button's glass is smoked (94-popup.js).
const LAMP_PLUG_SLIDE = 35, LAMP_PLUG_SMOKE_AT = 8;
const LAMP_PLUG_TINTS = new Map();

function lampPlugLab(r, g, b) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  r = lin(r); g = lin(g); b = lin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720453 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function lampPlugRgb(L, A, B, out, i) {
  const gam = (x) => { x = Math.min(1, Math.max(0, x)); return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)); };
  const l3 = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m3 = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s3 = Math.pow(L - 0.0894841775 * A - 1.2914855480 * B, 3);
  out[i] = gam(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3);
  out[i + 1] = gam(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3);
  out[i + 2] = gam(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3);
}

// The light for one accent: 'glow' or 'idle'. Returns a URL that is loaded, or null while it is made
// (then `done` runs when it is ready).
// `plates` is the plate set (default the plug's; the purifier passes LAMP_PURIFIER_PLATES). Both lights were painted
// in the same amber, so both turn from LAMP_PLUG_HERO.ref.
function lampPlugLight(accent, which, done, plates) {
  plates = plates || LAMP_PLUG_PLATES;
  const src = plates[which];
  const hue = (rgb) => { const p = lampPlugLab.apply(null, rgb.split(',').map(Number)); return Math.atan2(p[2], p[1]); };
  let d = hue(accent) - hue(LAMP_PLUG_HERO.ref);
  d = Math.atan2(Math.sin(d), Math.cos(d));
  if (Math.abs(d) < 0.035) return lampHeroImage(src, done) ? src : null;    // within 2 degrees: as painted
  const key = accent + '|' + which + '|' + (plates === LAMP_PLUG_PLATES ? 'plug' : 'other');
  let url = LAMP_PLUG_TINTS.get(key);
  if (url === undefined) {
    if (!lampHeroImage(src, done)) return null;
    url = null;
    try {
      const im = LAMP_HERO_IMAGES.get(src).im;
      const cv = document.createElement('canvas');
      cv.width = im.naturalWidth;
      cv.height = im.naturalHeight;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(im, 0, 0);
      const px = g.getImageData(0, 0, cv.width, cv.height), a = px.data, cs = Math.cos(d), sn = Math.sin(d);
      for (let i = 0; i < a.length; i += 4) {
        if (a[i] + a[i + 1] + a[i + 2] < 3) continue;
        const p = lampPlugLab(a[i], a[i + 1], a[i + 2]);
        lampPlugRgb(p[0], p[1] * cs - p[2] * sn, p[1] * sn + p[2] * cs, a, i);
      }
      g.putImageData(px, 0, 0);
      url = cv.toDataURL('image/png');
    } catch (e) { url = null; }
    LAMP_PLUG_TINTS.set(key, url);
  }
  return url && lampHeroImage(url, done) ? url : null;
}

// o: { W, id, acc (the accent at full chroma), state, light (the URL for the state's light, or null),
//      from: { light } (the light before a change, which fades out) or null, shift (px to the right) }.
function lampHeroPlug(o) {
  const P = LAMP_PLUG_HERO, k = P.size / (P.right - P.left), f = (v) => v.toFixed(2), HZ = 120;
  const dw = P.w * k, dh = P.h * k, x0 = o.W - 54 - 8 - P.right * k + (o.shift || 0), y0 = HZ - 2 - P.foot * k;
  const cx = x0 + (P.left + P.right) / 2 * k;
  const img = (href, extra) => '<image href="' + href + '" x="' + f(x0) + '" y="' + f(y0) + '" width="' + f(dw) + '" height="' + f(dh) + '"' + (extra || '') + '/>';
  const add = ' style="mix-blend-mode:plus-lighter"';
  // The body's strength is a colour matrix, not a CSS filter, so every browser draws it the same.
  const b = P.body;
  let g = '<defs><filter id="' + o.id + 'b1" filterUnits="userSpaceOnUse" x="0" y="0" width="' + o.W + '" height="220">' +
    '<feGaussianBlur stdDeviation="3"/></filter>' +
    '<filter id="' + o.id + 'bd" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' +
    b + ' 0 0 0 0 0 ' + b + ' 0 0 0 0 0 ' + b + ' 0 0 0 0 0 1 0"/></filter></defs>';
  // The contact shadow: the plate's own shadow is lost where it is darker than the header.
  g += '<ellipse cx="' + f(cx) + '" cy="' + (HZ - 1) + '" rx="' + f(52 * P.size / 100) + '" ry="3" fill="#000" fill-opacity=".6" filter="url(#' + o.id + 'b1)"/>';
  g += img(LAMP_PLUG_PLATES.base, ' filter="url(#' + o.id + 'bd)"' + (o.state === 'gone' ? ' opacity=".45"' : ''));
  // The light's strength is its opacity; the fades in 94-popup.js run from and to this value.
  const lo = ' opacity="' + P.light + '"';
  if (o.from && o.from.light) g += img(o.from.light, add + lo + ' class="lp-out"');
  if (o.light) g += img(o.light, add + lo + (o.from ? ' class="lp-in"' : ''));
  const lit = o.state === 'active' || o.state === 'idle';
  return { svg: '<svg width="' + o.W + '" height="220" viewBox="0 0 ' + o.W + ' 220">' + g + '</svg>', x: cx, y: 70, at: lit ? o.acc : '0,0,0' };
}
