// The hero of the purifier sheet: the painted purifier, lit by its state. Option 2d of
// design-docs/popup_hero_harmony_options.html, built 8 Nov 2026. It replaces the 24-hour PM2.5 trace, the last
// header that was a chart. It follows the plug's hero (93d-plug.js).
// Repainted 21 Nov 2026 (0.131.0-dev) from the household's second image, "Three Air Purifiers with Ambient
// Glow". The household found the first purifier too dark: it looked black or grey. Probes and plate script:
// design-docs/purifier_hero_v2/.
//
// THE PICTURE
// A short round matte tower with a ring of light round its top outlet and a lit leaf on its front. Its body is
// 96px tall and about 59px wide; its foot stands on the horizon and its right edge stops 8px before the close
// button's column. Four plates (93e-purifier-plates.js):
//   base   the off purifier with the leaf painted out. It is drawn in every state
//   leaf   the leaf's light alone, white. It is not turned to the accent
//   quiet  the Sleep light alone: the thin ring and a warm light on the body
//   glow   the working light alone: the ring, the light that rises from the outlet, and the pool on the floor
// The lights are added to the base (plus-lighter). The body draws at the painting's own lightness (OKLab L about
// 0.65): the household chose this on 21 Nov 2026, so the purifier body is lighter than the battery bars. The plug
// keeps the old limit. A light with a gain above 1 is drawn twice; the second copy carries the rest.
//
// THE STATES, from the purifier's fan entity
//   off      the base and the leaf. The purifier still answers, so its leaf stays lit
//   quiet    the base, the leaf and the ring at 1.5 x (preset_mode sleep). At 1 x the ring was lost on a phone
//   working  the base, the leaf and the glow (any other mode: auto, turbo, a manual speed)
//   gone     the base at 45% with a dark leaf (unavailable or unknown)
// The leaf draws at 1.6 x: at 1 x it was lost on the light body at phone size.
//
// THE COLOUR is the painted light, the Lounge's amber (the light's hue is 59 degrees, as in the first image).
// Another accent turns its hue with lampPlugLight, as the plug's light is turned. MOTION: a change fades one
// light into the other over 0.6 s (the plug's lp-in and lp-out); nothing moves when the sheet opens.

const LAMP_PURIFIER_HERO = { w: 350, h: 348, left: 144, right: 269, foot: 311, top: 109, height: 96, body: 1, light: 0.75,
  quiet: 1.5, leaf: 1.6 };
// The space the purifier needs from the sheet's right edge: its left ink is at about W - 62 - 59, and the
// title's ink plus 12px may come 4px further left.
const LAMP_PURIFIER_ROOM = 125;

// o: { W, id, acc, state, light (the URL of the state's light, or null), from: { light, state } or null }.
function lampHeroPurifier(o) {
  const P = LAMP_PURIFIER_HERO, k = P.height / (P.foot - P.top), f = (v) => v.toFixed(2), HZ = 120;
  const x0 = o.W - 54 - 8 - P.right * k, y0 = HZ - 2 - P.foot * k, dw = P.w * k, dh = P.h * k;
  const cx = x0 + (P.left + P.right) / 2 * k;
  const img = (href, extra) => '<image href="' + lampEsc(href) + '" x="' + f(x0) + '" y="' + f(y0) + '" width="' + f(dw) + '" height="' + f(dh) + '"' + (extra || '') + '/>';
  // One light at a strength: one copy at full for each whole step, and one copy for the rest.
  const add = (href, gain, cls) => {
    let s = '';
    for (let r = gain; r > 0.001; r -= 1) {
      s += img(href, ' style="mix-blend-mode:plus-lighter" opacity="' + f(Math.min(1, r)) + '"' + (cls ? ' class="' + cls + '"' : ''));
    }
    return s;
  };
  const gain = (state) => P.light * (state === 'quiet' ? P.quiet : 1), b = P.body;
  let g = '<defs><filter id="' + o.id + 'b1" filterUnits="userSpaceOnUse" x="0" y="0" width="' + o.W + '" height="220">' +
    '<feGaussianBlur stdDeviation="3"/></filter>';
  if (b !== 1) {
    g += '<filter id="' + o.id + 'bd" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' +
      b + ' 0 0 0 0 0 ' + b + ' 0 0 0 0 0 ' + b + ' 0 0 0 0 0 1 0"/></filter>';
  }
  g += '</defs>';
  // The contact shadow, as under the plug.
  g += '<ellipse cx="' + f(cx) + '" cy="' + (HZ - 1) + '" rx="' + f((P.right - P.left) * k * 0.56) + '" ry="3" fill="#000" fill-opacity=".6" filter="url(#' + o.id + 'b1)"/>';
  g += img(LAMP_PURIFIER_PLATES.base, (b !== 1 ? ' filter="url(#' + o.id + 'bd)"' : '') + (o.state === 'gone' ? ' opacity=".45"' : ''));
  if (o.state !== 'gone') g += add(LAMP_PURIFIER_PLATES.leaf, P.leaf);
  if (o.from && o.from.light) g += add(o.from.light, gain(o.from.state), 'lp-out');
  if (o.light) g += add(o.light, gain(o.state), o.from ? 'lp-in' : '');
  const lit = o.state === 'working' || o.state === 'quiet';
  return { svg: '<svg width="' + o.W + '" height="220" viewBox="0 0 ' + o.W + ' 220">' + g + '</svg>', x: cx, y: 70, at: lit ? o.acc : '0,0,0' };
}
