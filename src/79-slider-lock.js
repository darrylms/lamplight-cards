// The slider lock. A clear glass pane over the slider in a lamplight-light row.
// From 29 October 2026, Lamplight 0.42.0-dev. Option 6 of
// design-docs/slider_guard_options.html, "Parked Glass with a Grip".
//
// WHY
// A thumb that starts a scroll on a slider can drag it, and a light changes.
// The two fixes of 0.41.0-dev (relative slide, scroll quiet time) make the
// change small. They do not stop it. The lock stops it.
//
// WHAT IT DOES
// Locked, a clear pane covers the bar and a closed lock shows in the glyph
// gutter beside it. The pane takes every touch in the slot, so the slider
// gets none. A vertical movement still scrolls the page (touch-action pan-y).
// To open: tap the lock or the glass, or slide the glass left by its grip.
// The pane parks over the gutter, and an open lock shows under it.
// To close: tap the parked glass, or drag it right. The pane also closes
// `relock` seconds after the last touch on the slider, and at once when the
// household goes to another view.
//
// It is optional. lamplight-light makes one only when its config has
// `slider_lock`. Without the key, nothing here runs.
//
// IT DOES NOT TOUCH THE SLIDER. It is a layer over the slot. The household
// decided on 21 September 2026 that Lamplight does not reimplement the
// slider. The one change inside the child: the lock hides the child's own
// gutter glyph, because the lock glyph takes its place.
//
// GEOMETRY
// The bar and the gutter are measured from bubble-card each time the slot
// changes size. Measured on 29 October 2026 at 375px: the capsule is 325 x 48
// with a 16px radius, the bar is at x 47 (277 x 46), the gutter at x 3
// (42 x 42). A child that is not bubble-card gets these numbers, scaled to
// the slot.
//
// THE LOCK TILE
// From Lamplight 0.96.0-dev, option 1 of design-docs/slider_lock_tile_options.html,
// "The Twin Tile". The household chose it on 12 November 2026. bubble-card's
// capsule border is transparent, so the gutter reads as a tile in the icon
// column, not as part of the capsule. At 42 x 42 and x 3 it was 3px off the
// column that the head tile and the Scenes bar start on, 2px from the bar, and
// 2px inside the bar's top and bottom. The tile is now the head tile's twin:
// 36 x 36, radius 11, at x 0 of the slot, with a 20px glyph. It is centred on
// the bar (5px inside), 11px from it. The parked glass follows the tile,
// because _layout() measures the container after it sets the size.
//
// THE DOCKED GLASS
// From Lamplight 0.97.0-dev, option 2 of design-docs/slider_park_edge_options.html,
// "The Tile's Twin". The household chose it on 12 November 2026. Before, the docked
// glass was the pane's right end, 38 x 46, cut on its left side by the capsule's
// invisible edge: no rim on that side, a 16px corner, and the tile's r11 plate
// showing as a second box inside it. Now, in the last LAMP_LOCK_CLOSE px of travel,
// a clip on the pane's face closes onto the tile (36 x 36, radius 11), and a rim
// fades in all round it. The pane itself is not clipped, so the touch target
// stays 38 x 46. A slide animates the clip with keyframes sampled on the pane's
// own easing, because the clip is not a straight function of the pane's place.
//
// THE OPEN BAR
// From Lamplight 0.97.0-dev, option 4 of the same document, "The Scenes Edge".
// Open, the bar takes the Scenes bar's lit edge (LAMP_EDGE.bar, 17-edge.js). It
// fades in as the glass leaves and out as the glass returns, so the bar has one
// line at a time: the glass's rim when locked, this edge when open.
//
// THE GLASS
// From Lamplight 0.63.0-dev, option 6 of design-docs/slider_glass_flat_options.html,
// "Wedge, Last of the Glow". The household chose it on 5 November 2026. It replaces
// option 6 of design-docs/slider_glass_rim_options.html, which read as a raised tube:
// its outline was pure white, and its body ran light, dark, light from top to foot.
// The pane is a flat sheet of glass lit from the top right, as the panel wash is.
// The light is baked once into two images for each pane size, shared by all the
// panes; nothing redraws while the page is open. One image is the sheet in white
// and black: a 1px rim, a veil at the top, and one wedge of reflection in the top
// right corner. The other is a mask for the lamp's colour at the foot. Four marks
// show the lamp. All are as long as the fill, and an off lamp has none:
//   the soft end   the fill's end fades over LAMP_LOCK_SOFT px, in the fill's own
//                  colour, so the fill's hard edge cannot show. It is not a blur:
//                  backdrop-filter draws a bevel on iOS (master_design.html section 04)
//   the foot       the lamp's light rises a few px from the foot of the sheet
//   the line       a 1px line in the lamp's colour on the foot
//   the outer glow the foot's light goes on for 6px below the capsule, on the panel.
//                  It has its own element in the slot, because the root clips the pane
// They change only when the light changes. The glow carries state, so it passes
// Law 02.2 by its main clause; the household accepted this mark outside the
// capsule when it chose this option.
//
// THE CAPTION
// From Lamplight 0.47.0-dev, option 4 with caption 4b of
// design-docs/slider_hint_options.html. The household chose it on 30 October
// 2026, after critique F04: a guest read the closed pane as a slider, with the
// grip as its thumb at 100%. A small caption before the grip says what the
// grip is for. The caption and the grip are each drawn twice: dark over the
// lamp's fill, white over the empty track. The split is at the fill edge,
// because white text on a lit fill measured 2.0 to 2.4:1. Both fade as the
// pane parks.
//
// Configuration, the `slider_lock` key of lamplight-light:
//   true         the lock with its defaults
//   relock       10. Seconds after the last touch before the pane closes.
//                0: the pane stays open until it is closed by hand
//   slide        true. false: only a tap opens and closes the pane
//   hint         true: "Slide to unlock", or "Tap to unlock" when slide is
//                false. A string: that text. false: no caption

const LAMP_LOCK_RELOCK = 10;          // seconds
const LAMP_LOCK_MOVE = 250;           // ms, the pane's slide
const LAMP_LOCK_FLICK = 0.5;          // px per ms; faster than this parks or closes
const LAMP_LOCK_SIDE = 4;             // px sideways that starts a drag of the pane
const LAMP_LOCK_DOWN = 10;            // px down that gives the touch to the page
const LAMP_LOCK_GONE = 300;           // ms off the page after which the lock closes
const LAMP_LOCK_ICONS = ['mdi:lock-outline', 'mdi:lock-open-variant-outline'];
const LAMP_LOCK_GLYPH = 'rgba(255,255,255,0.80)';   // the child's own glyph colour
const LAMP_LOCK_GEOMETRY = { radius: 16, bar: [47, 1, 277, 46], gutter: [0, 6, 36, 36] };
const LAMP_LOCK_TILE = 36;            // px, the lock tile: the same as lamplight-light's head icon tile
const LAMP_LOCK_TILE_RADIUS = 11;     // px, the head icon tile's radius
const LAMP_LOCK_TILE_SHIFT = -1;      // px; bubble-card's wrapper starts 1px in, this puts the tile on x 0
const LAMP_LOCK_GLYPH_SIZE = 20;      // px; the head tile's glyph is 19px
const LAMP_LOCK_PANE_RADIUS = 14;     // px
const LAMP_LOCK_SETTLE = 600;         // ms; bubble-card eases the fill for 500 ms
const LAMP_LOCK_SOFT = 14;            // px, the soft end of the fill
const LAMP_LOCK_DEEP = 1.15;          // the power that deepens the fill under the glass: same hue, more saturation
const LAMP_LOCK_OUTER = 0.11;         // the outer glow's strength at the capsule
const LAMP_LOCK_OUTER_H = 6;          // px, the outer glow's height
const LAMP_LOCK_LINE = 0.6;           // the lamp's line on the foot
const LAMP_LOCK_TRACK = [46, 43, 41]; // the empty track as drawn under the glass, measured 3 November 2026
const LAMP_LOCK_GRIP = 44;            // px, the grip's width at the pane's right end
const LAMP_LOCK_CLOSE = 40;           // px of travel before the dock in which the glass closes onto the tile
const LAMP_LOCK_EASE = [0.2, 0.8, 0.2, 1];   // the slide's cubic-bezier
// The docked glass's rim, lit from the top right as the pane's baked rim is:
// about .52 on the pane's top at its right end, .30 on its right, .13 on a left side.
const LAMP_LOCK_DOCK_RIM = 'linear-gradient(225deg,rgba(255,255,255,.55),rgba(255,255,255,.26) 50%,rgba(255,255,255,.13))';
// Option 10 "Lit Edges" (0.90.0-dev) gave the rim the lamp's glow colour at the top right and
// a white glint at the corner. The household asked on 12 November 2026 to remove it (0.91.0-dev).
// The lock tile in the gutter is bubble-card's icon container. Its theme fill is white .11;
// option 10 makes it the one white plate, .07, the same as the empty track and the Scenes bar.
const LAMP_LOCK_GUTTER_FILL = 'rgba(255,255,255,0.07)';
// The ink of the caption and the grip: [over the fill, over the empty track].
// Measured 5 November 2026 at the worst pixel on all 8 rows: caption 4.63:1 at the
// lowest (Hallway, the fill's end under it). The veil and the wedge lift the ground
// under the grip, so its white is 65%, not 55%: 3.15:1 at the lowest (Table Lamps
// off, under the wash). The floors are 4.5:1 and 3:1.
const LAMP_LOCK_HINT_INK = ['rgba(0,0,0,0.84)', 'rgba(255,255,255,0.62)'];
const LAMP_LOCK_GRIP_INK = ['rgba(0,0,0,0.72)', 'rgba(255,255,255,0.65)'];
const LAMP_LOCK_EDGE = ['drop-shadow(0 0.5px 0 rgba(255,255,255,0.25))',
  'drop-shadow(0 0 0.75px rgba(0,0,0,0.75)) drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))'];

// The light on the glass, baked once for each size. A rim of one line, because a
// second line reads as a bevel. A veil that falls once from the top, with no dip
// and no peak, and grows to the right. A wedge in the top right corner: its lower
// edge falls to the right and stops above the grip's bars, and it ends before the
// caption. A faint shade in the bottom left. The glass image is white and black, so
// it suits any lamp and any theme. The foot image is a mask for the lamp's colour.
const lampLockBakes = new Map();

function lampLockBake(w, h, r) {
  const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  const key = w + 'x' + h + '@' + dpr;
  if (lampLockBakes.has(key)) return lampLockBakes.get(key);
  let urls = null;
  try {
    const PW = Math.round(w * dpr), PH = Math.round(h * dpr);
    const make = function () { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return c; };
    const ca = make(), cb = make(), ga = ca.getContext('2d'), gb = cb.getContext('2d');
    const ia = ga.createImageData(PW, PH), ib = gb.createImageData(PW, PH), pa = ia.data, pb = ib.data;
    const smooth = function (a, b, t) { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
    for (let j = 0; j < PH; j++) for (let i = 0; i < PW; i++) {
      const x = (i + 0.5) / dpr, y = (j + 0.5) / dpr, u = x / w, n = (j * PW + i) * 4;
      // The foot's mask fills the whole pane; the pane's own radius clips it.
      pb[n] = pb[n + 1] = pb[n + 2] = 255;
      pb[n + 3] = Math.round(255 * 0.5 * Math.exp(-(h - y) / 3.4) * smooth(4, 18, x));
      // Distance in from the rounded outline, and the outward normal there.
      const qx = Math.abs(x - w / 2) - (w / 2 - r), qy = Math.abs(y - h / 2) - (h / 2 - r);
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0), out = Math.hypot(ox, oy);
      const d = r - (out + Math.min(Math.max(qx, qy), 0));
      const cover = Math.min(1, Math.max(0, d * dpr + 0.5));
      if (!cover) continue;
      let nx, ny;
      if (qx > 0 && qy > 0) { nx = ox / out; ny = oy / out; } else if (qx > qy) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
      nx *= Math.sign(x - w / 2 || 1); ny *= Math.sign(y - h / 2 || 1);
      const up = Math.max(0, -ny), dn = Math.max(0, ny), rt = Math.max(0, nx), lf = Math.max(0, -nx);
      const sum = Math.max(0.001, up + dn + rt + lf);
      // The rim: 1px, strongest toward the top right.
      const t = smooth(0.3, 1, u);
      const edge = (up * (0.17 + 0.35 * t) + dn * (0.12 + 0.08 * t) + rt * 0.3 + lf * 0.13) / sum;
      const tr = Math.pow(Math.max(0, (nx - ny) * Math.SQRT1_2), 9);
      const rim = Math.min(1, Math.max(0, (1 - d) * dpr + 0.5)) * Math.min(1, edge + 0.22 * tr);
      // The reflection.
      const veil = 0.13 * (0.35 + 0.65 * smooth(0.1, 0.9, u)) * Math.exp(-Math.pow(y / 9, 2));
      const e = 0.14 * (x - 0.58 * w);
      const wedge = 0.2 * (0.4 + 0.6 * smooth(0.6, 1, u)) * smooth(-5, 1, e - y) * smooth(0.56, 0.76, u);
      const bloom = y > e ? 0.05 * smooth(0.6, 1, u) * Math.exp(-(y - e) / 8) : 0;
      const refl = 1 - (1 - veil) * (1 - wedge) * (1 - bloom);
      const shade = 0.05 * (1 - smooth(0, 0.42, u)) * smooth(0.35, 1, y / h);
      const a = 1 - (1 - rim) * (1 - refl);
      const k = shade * (1 - rim);
      const A = a + k * (1 - a);
      pa[n] = pa[n + 1] = pa[n + 2] = A ? Math.round(255 * a / A) : 0;
      pa[n + 3] = Math.round(255 * A * cover);
    }
    ga.putImageData(ia, 0, 0); gb.putImageData(ib, 0, 0);
    urls = { glass: ca.toDataURL('image/png'), foot: cb.toDataURL('image/png') };
  } catch (e) { urls = null; }
  lampLockBakes.set(key, urls);
  return urls;
}

// The caption's own two inks meet on the soft end where the ground's luminance is
// 0.179: there black and white both give 4.58:1. This returns that place, in px
// past the fill's edge. The soft end's alpha is 1 at its start, 0.62 at 35% and 0
// at its end. It returns null for a fill that is darker than that, a blue or a
// red: black does not hold on it, so all the ink is white.
function lampLockMeet(rgb, len) {
  const lum = function (c) {
    const f = function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const seen = rgb.map(function (v) { return 255 * Math.pow(v / 255, LAMP_LOCK_DEEP); });
  if (lum(seen) <= 0.179) return null;
  let t = 0;
  for (; t < 1; t += 0.01) {
    if (lum(seen.map(function (v, i) { return v + (LAMP_LOCK_TRACK[i] - v) * t; })) <= 0.179) break;
  }
  const alpha = 1 - t;
  return LAMP_LOCK_SOFT * (alpha > 0.62 ? (1 - alpha) / 0.38 * 0.35 : 0.35 + (0.62 - alpha) / 0.62 * 0.65);
}

// The slide's easing at time t (0 to 1), as CSS draws cubic-bezier(LAMP_LOCK_EASE).
function lampLockEase(t) {
  const E = LAMP_LOCK_EASE;
  const at = function (s, a, b) { return 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s; };
  let lo = 0, hi = 1, s = t;
  for (let i = 0; i < 24; i++) { s = (lo + hi) / 2; if (at(s, E[0], E[2]) < t) lo = s; else hi = s; }
  return at(s, E[1], E[3]);
}

function lampLockConfig(v) {
  if (!v) return null;
  const o = v === true ? {} : v;
  const slide = o.slide !== false;
  let hint = o.hint === undefined || o.hint === true ? (slide ? 'Slide to unlock' : 'Tap to unlock') : o.hint;
  if (typeof hint !== 'string' || !hint) hint = null;
  return {
    relock: o.relock === undefined ? LAMP_LOCK_RELOCK : Math.max(0, Number(o.relock) || 0),
    slide: slide,
    hint: hint
  };
}

class LampSliderLock {

  constructor(slot, cfg, name) {
    this._slot = slot;
    this._cfg = cfg;
    this._name = name;
    this._open = false;
    this._pos = 0;          // the pane's translateX, from 0 (over the bar) to _park
    this._park = 0;
    this._touch = null;     // the touch on the pane, while there is one
    this._timer = null;
    this._width = 0;        // the slot width of the last layout
    this._build();
  }

  _build() {
    const self = this;
    this._slot.style.position = 'relative';

    // The root covers the slot and clips the pane to the capsule.
    const root = document.createElement('div');
    root.setAttribute('role', 'button');
    root.setAttribute('tabindex', '0');
    root.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:1;' +
      'overflow:hidden;touch-action:pan-y;-webkit-tap-highlight-color:transparent;' +
      'user-select:none;-webkit-user-select:none;outline-offset:2px';

    const glyph = document.createElement('div');
    glyph.style.cssText = 'position:absolute;display:flex;align-items:center;' +
      'justify-content:center;pointer-events:none';
    const icon = document.createElement('ha-icon');
    const gs = LAMP_LOCK_GLYPH_SIZE + 'px';
    icon.style.cssText = '--mdc-icon-size:' + gs + ';width:' + gs + ';height:' + gs + ';line-height:0;' +
      'display:flex;color:' + LAMP_LOCK_GLYPH;
    glyph.appendChild(icon);

    // The glass. _layout() gives it the baked light; until then, and where a
    // canvas cannot bake, it is a plain tint and rim. No backdrop-filter: the
    // theme's blur draws a bevel on iOS (master_design.html section 04).
    const pane = document.createElement('div');
    pane.style.cssText = 'position:absolute;border-radius:' + LAMP_LOCK_PANE_RADIUS + 'px;overflow:hidden;' +
      'pointer-events:none;will-change:transform';
    // The face holds everything that is drawn. Docked, its clip closes onto the
    // tile; the pane is not clipped, so it keeps the touch target (0.97.0-dev).
    const face = document.createElement('div');
    face.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;' +
      'border-radius:inherit;background:rgba(255,255,255,0.03);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.18)';
    pane.appendChild(face);
    // The layers, from the back. _light() sets the lamp's. No blend modes: the
    // pane is its own layer, so a blend would see only the pane and never the fill.
    const layer = function (css) {
      const e = document.createElement('div');
      e.style.cssText = 'position:absolute;pointer-events:none;' + css;
      face.appendChild(e);
      return e;
    };
    const soft = layer('left:0;top:0;height:100%;width:0');
    const lit = layer('left:0;top:0;right:0;bottom:0');
    const foot = layer('left:0;top:0;width:100%;height:100%');
    const line = layer('left:0;bottom:0;height:1px;width:0');
    // The outer glow is in the slot, not the pane, because the root clips the pane.
    const outer = document.createElement('div');
    outer.style.cssText = 'position:absolute;pointer-events:none;height:' + LAMP_LOCK_OUTER_H + 'px;width:0;z-index:0';
    this._slot.appendChild(outer);
    // The grip: three short bars at the right end, a 44px target. The pane
    // parks to the left, so the thumb starts here and has the full travel.
    // Two copies, dark and white; _ink() clips each to its side of the fill
    // edge. The white one keeps a dark edge, the dark one a faint light edge.
    const grip = document.createElement('div');
    grip.style.cssText = 'position:absolute;right:0;top:0;width:' + LAMP_LOCK_GRIP + 'px;height:100%;' +
      'pointer-events:none';
    this._gripInk = [0, 1].map(function (n) {
      const layer = document.createElement('div');
      layer.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;display:flex;' +
        'align-items:center;justify-content:center;gap:4px;filter:' + LAMP_LOCK_EDGE[n];
      for (let k = 0; k < 3; k++) {
        const g = document.createElement('i');
        g.style.cssText = 'display:block;width:2px;height:16px;border-radius:1px;' +
          'background:' + LAMP_LOCK_GRIP_INK[n];
        layer.appendChild(g);
      }
      grip.appendChild(layer);
      return layer;
    });
    if (this._cfg.slide) face.appendChild(grip);
    // The caption, centred on the whole pane. Two copies, as the grip. Centred
    // in the space before the grip, it looked off centre (0.47.1-dev). Two more
    // copies at full alpha cross the soft end, where the ground falls through the
    // middle greys and neither of the usual inks holds.
    const hint = document.createElement('div');
    hint.setAttribute('aria-hidden', 'true');
    hint.style.cssText = 'position:absolute;left:0;top:0;bottom:0;right:0;pointer-events:none';
    const text = this._cfg.hint;
    const copy = function (color) {
      const e = document.createElement('div');
      e.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;display:flex;' +
        'align-items:center;justify-content:center;white-space:nowrap;overflow:hidden;' +
        'font:400 var(--lamplight-t-label)/1 Roboto,Noto,sans-serif;letter-spacing:0.1em;color:' + color;
      e.textContent = text;
      hint.appendChild(e);
      return e;
    };
    this._hintInk = LAMP_LOCK_HINT_INK.map(copy);
    this._hintSoft = ['rgb(0,0,0)', 'rgb(255,255,255)'].map(copy);
    if (text) face.appendChild(hint);
    // The docked glass's rim, over the face. _dock() sets its box and strength.
    const rim = lampEdge(pane, LAMP_LOCK_PANE_RADIUS + 'px');
    rim.style.right = rim.style.bottom = 'auto';
    rim.style.width = rim.style.height = '0';
    rim.style.opacity = '0';
    rim.style.background = LAMP_LOCK_DOCK_RIM;

    root.appendChild(glyph);
    root.appendChild(pane);
    this._slot.appendChild(root);
    // The open bar's edge, in the slot over the bar. _layout() places it.
    const edge = document.createElement('div');
    edge.style.cssText = 'position:absolute;pointer-events:none;z-index:1;opacity:0';
    lampEdgePaint(lampEdge(edge, LAMP_LOCK_PANE_RADIUS + 'px'), '255,255,255', LAMP_EDGE.bar);
    this._slot.appendChild(edge);
    this._root = root; this._glyph = glyph; this._icon = icon;
    this._pane = pane; this._face = face; this._rim = rim; this._edge = edge;
    this._grip = grip; this._hint = hint;
    this._soft = soft; this._lit = lit; this._foot = foot; this._line = line;
    this._outer = outer;
    this._ink(0);

    root.addEventListener('pointerdown', function (ev) { self._down(ev); });
    root.addEventListener('pointermove', function (ev) { self._move(ev); });
    root.addEventListener('pointerup', function (ev) { self._up(ev); });
    root.addEventListener('pointercancel', function () { self._cancel(); });
    root.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); self._set(!self._open, true); }
    });

    // A touch on the open slider holds the relock timer; lifting it starts
    // the timer again. Capture, so the slider's own handlers cannot hide it.
    this._slot.addEventListener('pointerdown', function () {
      if (self._open) self._disarm();
    }, true);
    this._slot.addEventListener('pointerup', function () {
      if (self._open) self._arm();
    }, true);

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(function () { self._width = 0; self._tries = 0; self.sync(self._state); });
      this._ro.observe(this._slot);
    }
    this._onNavigate = function () { self.reset(); };
    this._set(false, false);
  }

  // Called by lamplight-light on each hass update, with the state of its light.
  // Cheap when nothing changed: Home Assistant makes a new state object only
  // when the light changes.
  sync(state) {
    this._hideChildGlyph();
    if (this._slot.offsetWidth && this._slot.offsetWidth !== this._width) this._layout();
    if (state !== this._state) {
      this._state = state;
      this._light();
      // bubble-card eases the fill to its new place. Read it again after.
      const self = this;
      if (this._settle) clearTimeout(this._settle);
      this._settle = setTimeout(function () { self._settle = null; self._light(); }, LAMP_LOCK_SETTLE);
    }
  }

  // The lamp's marks, from the fill as bubble-card draws it: its colour, and
  // where its edge is on the bar.
  _light() {
    if (!this._root) return;
    const r = this._childRoot();
    const fill = r && r.querySelector('.bubble-range-fill');
    const bar = r && r.querySelector('.bubble-range-slider');
    let len = 0, rgb = null;
    if (fill && bar) {
      const m = (getComputedStyle(fill).backgroundColor.match(/[\d.]+/g) || []).map(Number);
      // An off lamp's fill is see-through; it lights nothing.
      if (m.length >= 3 && (m.length < 4 || m[3] === 1)) rgb = m.slice(0, 3);
      const fb = fill.getBoundingClientRect(), bb = bar.getBoundingClientRect();
      const k = bb.width / (bar.offsetWidth || bb.width) || 1;
      len = Math.max(0, Math.min(bar.offsetWidth, (fb.right - bb.left) / k));
    }
    const on = rgb && len >= 1;
    const S = LAMP_LOCK_SOFT, end = on ? len + S : 0;
    const set = function (el, prop, value) { el.style.setProperty(prop, value); };
    const mask = function (el, value) { set(el, '-webkit-mask', value); set(el, 'mask', value); };
    this._meet = on ? lampLockMeet(rgb, len) : 0;
    if (!on) {
      this._soft.style.width = this._line.style.width = this._outer.style.width = '0';
      this._foot.style.background = 'none';
      this._ink(0);
      return;
    }
    this._ink(len);
    const own = rgb.join(',');
    const deep = rgb.map(function (v) { return Math.round(255 * Math.pow(v / 255, LAMP_LOCK_DEEP)); }).join(',');
    // The fill scaled to full brightness, which keeps its hue, and 20% toward white.
    const top = Math.max.apply(null, rgb) || 1;
    const glow = rgb.map(function (v) { return Math.round(v * 255 / top * 0.8 + 51); }).join(',');
    this._soft.style.width = end + 'px';
    this._soft.style.background = 'linear-gradient(90deg,rgb(' + deep + ') 0,rgb(' + deep + ') ' + len + 'px,' +
      'rgba(' + deep + ',0.62) ' + (len + S * 0.35) + 'px,rgba(' + deep + ',0) ' + end + 'px)';
    this._foot.style.background = this._baked
      ? 'linear-gradient(90deg,rgb(' + glow + ') 0,rgb(' + glow + ') ' + Math.max(0, len - 2) + 'px,rgba(' + glow + ',0) ' + end + 'px)'
      : 'none';
    // The line stops short of the capsule's right corner, on a full fill too.
    const stop = Math.min(len, this._pane.offsetWidth - 14), L = LAMP_LOCK_LINE;
    this._line.style.width = (stop + 8) + 'px';
    this._line.style.background = 'linear-gradient(90deg,rgba(' + glow + ',0) 10px,rgba(' + glow + ',' + L + ') 22px,' +
      'rgba(' + glow + ',' + L + ') ' + Math.max(22, stop - 6) + 'px,rgba(' + glow + ',0) ' + (stop + 8) + 'px)';
    const o = LAMP_LOCK_OUTER;
    // The glow stops at the capsule's end, on a full fill too.
    const tip = Math.min(len + 8, this._pane.offsetWidth);
    this._outer.style.width = tip + 'px';
    this._outer.style.background = 'linear-gradient(180deg,rgba(' + own + ',' + o + ') 0,rgba(' + own + ',' + o * 0.45 + ') 40%,' +
      'rgba(' + own + ',0) 100%)';
    mask(this._outer, 'linear-gradient(90deg,transparent 0,#000 18px,#000 ' + Math.max(18, tip - 16) + 'px,transparent ' + tip + 'px)');
  }

  // Split the caption and the grip along the fill, `len` px from the pane's left
  // end: the dark copy over the fill, the white copy over the track, and on the
  // soft end the full-alpha copies, which meet at _meet. An off lamp has only
  // white. A dark fill has only white, at full alpha over the fill.
  _ink(len) {
    this._len = len;
    const w = this._pane.offsetWidth;
    const clip = function (el, start, width, a, b) {
      const l = Math.min(width, Math.max(0, a - start)), r = Math.min(width, Math.max(0, b - start));
      el.style.clipPath = r > l ? 'inset(0 ' + (width - r) + 'px 0 ' + l + 'px)' : 'inset(0 100% 0 0)';
    };
    const dark = len && this._meet === null;
    const at = len && !dark ? len + this._meet : 0, end = len ? len + LAMP_LOCK_SOFT : 0;
    clip(this._hintInk[0], 0, w, 0, dark ? 0 : len);
    clip(this._hintSoft[0], 0, w, len, at);
    clip(this._hintSoft[1], 0, w, dark ? 0 : at, end);
    clip(this._hintInk[1], 0, w, end, w);
    clip(this._gripInk[0], w - LAMP_LOCK_GRIP, LAMP_LOCK_GRIP, 0, at);
    clip(this._gripInk[1], w - LAMP_LOCK_GRIP, LAMP_LOCK_GRIP, at, w);
  }

  // The child's own root, if it is a bubble-card.
  _childRoot() {
    const hc = this._slot.querySelector('hui-card');
    const c = hc && hc.firstElementChild;
    return c && c.shadowRoot ? c.shadowRoot : null;
  }

  _hideChildGlyph() {
    const r = this._childRoot();
    const g = r && r.querySelector('.bubble-main-icon');
    if (g && g.style.getPropertyValue('visibility') !== 'hidden')
      g.style.setProperty('visibility', 'hidden', 'important');
    // The theme's 1px rim on the capsule adds nothing under the lock
    // (0.43.1-dev). Transparent, not none, so the bar does not move.
    // The capsule's shadow darkens the panel round it, so the capsule shows
    // as a pale plate (0.43.2-dev).
    const c = r && r.querySelector('.bubble-container');
    if (c && c.style.getPropertyValue('border-color') !== 'transparent') {
      c.style.setProperty('border-color', 'transparent', 'important');
      c.style.setProperty('box-shadow', 'none', 'important');
    }
  }

  _layout() {
    const slot = this._slot, W = slot.offsetWidth, H = slot.offsetHeight;
    if (!W) return;
    const G = LAMP_LOCK_GEOMETRY;
    let radius = G.radius;
    let bar = [G.bar[0], G.bar[1], W - G.bar[0] - 1, H - 2 * G.bar[1]];
    let gutter = G.gutter.slice();
    let measured = false;
    const r = this._childRoot();
    const barEl = r && r.querySelector('.bubble-range-slider');
    const gutEl = r && r.querySelector('.bubble-main-icon-container');
    if (barEl && gutEl) {
      gutEl.style.setProperty('background-color', LAMP_LOCK_GUTTER_FILL, 'important');
      // The Twin Tile (0.96.0-dev). Fixed sizes, because the container is a flex
      // item that bubble-card stretches; align-self centres it on the bar.
      const t = LAMP_LOCK_TILE + 'px';
      ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height'].forEach(function (k) {
        gutEl.style.setProperty(k, t, 'important');
      });
      gutEl.style.setProperty('align-self', 'center', 'important');
      gutEl.style.setProperty('border-radius', LAMP_LOCK_TILE_RADIUS + 'px', 'important');
      gutEl.style.setProperty('margin-left', LAMP_LOCK_TILE_SHIFT + 'px', 'important');
      // Measure in the slot's own pixels. A panel bounce scales the panel for
      // a moment, so divide by the scale of the slot.
      const sb = slot.getBoundingClientRect();
      const k = sb.width / W || 1;
      const rel = function (e) {
        const b = e.getBoundingClientRect();
        return [(b.left - sb.left) / k, (b.top - sb.top) / k, b.width / k, b.height / k];
      };
      const b = rel(barEl), g = rel(gutEl);
      if (b[2] > 0 && g[2] > 0) { bar = b; gutter = g; measured = true; }
      const card = r.querySelector('ha-card');
      const cr = card && parseFloat(getComputedStyle(card).borderTopLeftRadius);
      if (cr) radius = cr;
    }
    // The child draws after the slot has its size. Until it does, use the
    // defaults and measure again on the next update, 20 times at most.
    this._tries = (this._tries || 0) + 1;
    if (measured || this._tries > 20) this._width = W;
    this._root.style.borderRadius = radius + 'px';
    const px = function (n) { return Math.round(n * 10) / 10 + 'px'; };
    this._glyph.style.left = px(gutter[0]); this._glyph.style.top = px(gutter[1]);
    this._glyph.style.width = px(gutter[2]); this._glyph.style.height = px(gutter[3]);
    this._pane.style.left = px(bar[0]); this._pane.style.top = px(bar[1]);
    this._pane.style.width = px(bar[2]); this._pane.style.height = px(bar[3]);
    const baked = lampLockBake(Math.round(bar[2] * 10) / 10, Math.round(bar[3] * 10) / 10, LAMP_LOCK_PANE_RADIUS);
    this._baked = !!baked;
    if (baked) {
      this._face.style.background = 'none';
      // No drop shadow: the pane sits flat on the card, like the rows
      // round it (0.43.3-dev).
      this._face.style.boxShadow = 'none';
      this._lit.style.background = 'url(' + baked.glass + ') 0 0/100% 100% no-repeat';
      const m = 'url(' + baked.foot + ') 0 0/100% 100% no-repeat';
      this._foot.style.setProperty('-webkit-mask', m);
      this._foot.style.setProperty('mask', m);
    }
    this._outer.style.left = px(bar[0]);
    this._outer.style.top = px(bar[1] + bar[3]);
    this._edge.style.left = px(bar[0]); this._edge.style.top = px(bar[1]);
    this._edge.style.width = px(bar[2]); this._edge.style.height = px(bar[3]);
    this._bar = bar; this._gutter = gutter;
    if (measured) this._light(); else this._ink(this._len || 0);
    // Parked, the pane's right edge stops 2px past the gutter.
    this._park = (gutter[0] + gutter[2] + 2) - (bar[0] + bar[2]);
    this._place(this._open ? this._park : 0, false);
  }

  // ---- state -----------------------------------------------------------------

  _set(open, animate) {
    this._open = open;
    this._root.style.pointerEvents = open ? 'none' : 'auto';
    // Open, only the parked glass takes a touch. The rest of it is clipped,
    // and a clipped part of an element does not take a touch.
    this._pane.style.pointerEvents = open ? 'auto' : 'none';
    this._icon.icon = LAMP_LOCK_ICONS[open ? 1 : 0];
    this._root.setAttribute('aria-label',
      (open ? 'Lock ' : 'Unlock ') + (this._name || 'the') + ' brightness');
    this._root.setAttribute('aria-pressed', open ? 'false' : 'true');
    this._place(open ? this._park : 0, animate);
    if (open) this._arm(); else this._disarm();
  }

  _place(pos, animate) {
    const reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const moving = animate && !reduced;
    // Where the pane is now, mid-slide too, for the clip's first keyframe.
    let from = this._pos || 0;
    if (moving && window.DOMMatrixReadOnly) {
      const m = getComputedStyle(this._pane).transform;
      if (m && m !== 'none') from = new DOMMatrixReadOnly(m).m41;
    }
    this._pos = pos;
    const t = moving
      ? 'transform ' + LAMP_LOCK_MOVE + 'ms cubic-bezier(' + LAMP_LOCK_EASE.join(',') + ')'
      : 'none';
    this._pane.style.transition = t;
    this._grip.style.transition = this._hint.style.transition =
      this._outer.style.transition = this._edge.style.transition =
      t === 'none' ? 'none' : 'opacity ' + LAMP_LOCK_MOVE + 'ms';
    this._pane.style.transform = 'translateX(' + pos + 'px)';
    this._dock(from, pos, moving);
    // The open bar's edge shows as the glass leaves the bar.
    this._edge.style.opacity = this._park ? String(pos / this._park) : '0';
    // The lamp's marks stay over the fill while the glass slides.
    this._soft.style.transition = this._foot.style.transition = this._line.style.transition = t;
    this._soft.style.transform = this._foot.style.transform = this._line.style.transform =
      'translateX(' + (-pos) + 'px)';
    // The grip and the caption fade as the pane parks: parked, there is
    // nothing to slide. The outer glow fades too: an open capsule is the real
    // slider, not the glass.
    this._grip.style.opacity = this._hint.style.opacity =
      this._outer.style.opacity =
      this._park ? String(1 - pos / this._park) : '1';
  }

  // The docked glass at pane place `pos`: the face's clip and the rim's box, in
  // the pane's own px. Far from the dock, nothing. In the last LAMP_LOCK_CLOSE px
  // the clip closes from the pane's outline onto the tile, and the rim fades in.
  _dockAt(pos) {
    const b = this._bar, g = this._gutter;
    if (!b || !g || !this._park) return null;
    const u = 1 - Math.min(1, Math.max(0, (pos - this._park) / LAMP_LOCK_CLOSE));
    const q = u * u * (3 - 2 * u);
    const gl = g[0] - (b[0] + pos), gt = g[1] - b[1];
    const l = Math.max(0, gl) * q, t = gt * q;
    const r = (b[2] - gl - g[2]) * q, d = (b[3] - gt - g[3]) * q;
    const rad = LAMP_LOCK_PANE_RADIUS + (LAMP_LOCK_TILE_RADIUS - LAMP_LOCK_PANE_RADIUS) * q;
    const f = function (n) { return Math.round(n * 100) / 100 + 'px'; };
    return { q: q,
      clip: 'inset(' + f(t) + ' ' + f(r) + ' ' + f(d) + ' ' + f(l) + ' round ' + f(rad) + ')',
      rim: { left: f(l), top: f(t), width: f(b[2] - l - r), height: f(b[3] - t - d),
        borderRadius: f(rad), opacity: String(q) } };
  }

  // Set the docked glass for `pos`. A slide from `from` animates it with keyframes
  // sampled on the slide's easing, so the clip stays with the moving pane.
  _dock(from, pos, moving) {
    if (this._dockAnims) { this._dockAnims.forEach(function (a) { a.cancel(); }); this._dockAnims = null; }
    const end = this._dockAt(pos);
    if (!end) return;
    const self = this;
    const apply = function (s) {
      self._face.style.clipPath = s.q ? s.clip : 'none';
      const k = s.rim;
      for (const p in k) self._rim.style[p] = k[p];
    };
    apply(end);
    if (!moving || from === pos || !this._face.animate) return;
    const clip = [], rim = [], N = 16;
    for (let i = 0; i <= N; i++) {
      const s = this._dockAt(from + (pos - from) * lampLockEase(i / N));
      clip.push({ offset: i / N, clipPath: s.clip });
      rim.push(Object.assign({ offset: i / N }, s.rim));
    }
    // Nothing to draw when the whole slide is far from the dock.
    if (!clip.some(function (k, i) { return rim[i].opacity !== '0'; })) return;
    const o = { duration: LAMP_LOCK_MOVE, easing: 'linear' };
    this._dockAnims = [this._face.animate(clip, o), this._rim.animate(rim, o)];
  }

  _arm() {
    this._disarm();
    if (!this._cfg.relock) return;
    const self = this;
    this._timer = setTimeout(function () {
      self._timer = null;
      if (self._open && !self._touch) self._set(false, true);
    }, this._cfg.relock * 1000);
  }

  _disarm() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  // Lock at once, with no motion. It runs when the household leaves the view.
  // See attach() below.
  reset() {
    this._touch = null;
    if (this._root) this._set(false, false);
  }

  // The lock closes when the household leaves the view, by any route:
  //   a tab tap         Home Assistant fires `location-changed`
  //   the back gesture  the browser fires `popstate` and nothing else
  //                     (measured 29 October 2026; the phone did not relock)
  //   anything else     the row leaves the page. Home Assistant also detaches
  //                     a row for a moment during a render, so the lock
  //                     closes only if the row is still gone after LAMP_LOCK_GONE ms.
  attach() {
    window.addEventListener('location-changed', this._onNavigate);
    window.addEventListener('popstate', this._onNavigate);
    if (this._leave) { clearTimeout(this._leave); this._leave = null; }
  }

  detach() {
    window.removeEventListener('location-changed', this._onNavigate);
    window.removeEventListener('popstate', this._onNavigate);
    this._disarm();
    const self = this;
    if (this._leave) clearTimeout(this._leave);
    this._leave = setTimeout(function () { self._leave = null; self.reset(); }, LAMP_LOCK_GONE);
  }

  destroy() {
    this.detach();
    if (this._settle) { clearTimeout(this._settle); this._settle = null; }
    if (this._leave) { clearTimeout(this._leave); this._leave = null; }
    if (this._ro) this._ro.disconnect();
    if (this._outer) this._outer.remove();
    if (this._edge) this._edge.remove();
    if (this._root) this._root.remove();
    this._root = null;
  }

  // ---- the touch on the pane --------------------------------------------------

  _down(ev) {
    if (ev.button > 0) return;
    this._disarm();
    this._touch = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, base: this._pos,
      mode: 'wait', lx: ev.clientX, lt: ev.timeStamp, v: 0 };
  }

  _move(ev) {
    const t = this._touch;
    if (!t || ev.pointerId !== t.id || t.mode === 'page') return;
    const dx = ev.clientX - t.x0, dy = ev.clientY - t.y0;
    if (t.mode === 'wait') {
      // The same test as bubble-card's, so a scroll stays a scroll.
      if (Math.abs(dx) >= LAMP_LOCK_SIDE) {
        t.mode = this._cfg.slide ? 'drag' : 'page';
        if (t.mode === 'drag') {
          // Open, the root takes no touch, so the pane holds the capture.
          const el = this._open ? this._pane : this._root;
          try { el.setPointerCapture(ev.pointerId); } catch (e) { /* touch captures anyway */ }
        }
      } else if (Math.abs(dy) >= LAMP_LOCK_DOWN) {
        t.mode = 'page';
      }
      if (t.mode !== 'drag') return;
    }
    const pos = Math.min(0, Math.max(this._park, t.base + dx));
    const dt = ev.timeStamp - t.lt;
    if (dt > 0) t.v = 0.6 * ((ev.clientX - t.lx) / dt) + 0.4 * t.v;
    t.lx = ev.clientX; t.lt = ev.timeStamp;
    this._place(pos, false);
  }

  _up(ev) {
    const t = this._touch;
    if (!t || ev.pointerId !== t.id) return;
    this._touch = null;
    if (t.mode === 'wait') { this._set(!this._open, true); return; }
    if (t.mode === 'drag') {
      // Past half way, or a flick, decides. Short of both, it springs back.
      let open = this._park ? this._pos / this._park > 0.5 : this._open;
      if (t.v < -LAMP_LOCK_FLICK) open = true;
      if (t.v > LAMP_LOCK_FLICK) open = false;
      this._set(open, true);
      return;
    }
    if (this._open) this._arm();
  }

  _cancel() {
    if (!this._touch) return;
    this._touch = null;
    this._set(this._open, true);
  }
}
