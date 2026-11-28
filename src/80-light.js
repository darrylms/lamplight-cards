// lamplight-light. The row inside every Lights panel.
//
// It replaces a 55,915-character `custom:button-card` template that the
// dashboard held seven times over, together with the `card_mod` on each copy.
// It is a ROW, not a panel: put it inside a `lamplight-panel`, the same way the
// button-card it replaces sat inside one.
//
// WHAT A ROW SHOWS
// A 34px icon tile in the room's accent, the light's name, a line saying how
// many of its bulbs are lit, the brightness as a percentage, the colour in
// words or in Kelvin, and a 32px toggle with a brightness ring. Below
// them, two optional slots: a brightness slider and a scene list. Four grid
// rows, four columns:
//
//     "i n t g"      i tile   n name   t brightness   g toggle
//     "i s h g"      s lit count and colour   h colour or Kelvin
//     "c c c c"      the slider slot
//     "p p p p"      the scenes slot
//
// A 3px rail runs down the left edge in the bulbs' own live colour.
//
// TWO OPTIONAL SLOTS, AND THE CARD WORKS WITH BOTH EMPTY
// `slider:` and `scenes:` each take a whole card configuration and hold it as
// a child, the same way `lamplight-panel` holds a child and for the same reason:
// the card does not care what the child is. This household passes a
// `custom:bubble-card` into the first and a `custom:lamplight-scenes` into the
// second. With both left out the row still gives the tile, the name, the lit
// count, the brightness figure, the colour and a toggle with a ring, which is
// a complete light row without a drag target. That is the test every optional
// child has to pass - see NOTES.md.
//
// **Lamplight does not reimplement the slider.** Settled by the household on
// 21 September 2026. A slider is the hardest widget to reproduce and the
// decision behind this one was taken after comparing six engines.
//
// MEMBERS, AND WHY THEY ARE CONFIGURATION
// master_design.html section 07: read member entities, never a group. A
// group's `rgb_color` is a CIE-xy average and can report a colour no bulb
// produces. So `members:` defaults to the group's own `attributes.entity_id`,
// and falls back to the light itself when there is no such attribute - which
// is the case for a single bulb, not a group.
//
// **The rail is a separate list, and it is not always the members.** Measured
// on the live dashboard 22 September 2026: three of the seven rails read a
// hand-picked entity rather than the whole group, and Home Assistant reports
// the Lounge Ceiling's two members bottom-first, so a rail derived from
// `attributes.entity_id` would draw its gradient upside down. `side_bar:`
// therefore takes its own list and defaults to `members`.
//
// THE COLOUR NAME USES HSV SATURATION, NOT HSL
// master_design.html section 10 is explicit: HSL calls (255,245,225) fully
// saturated and would name a warm white "orange". Below 0.15 saturation the
// name comes from R - B. Kelvin wins when the lamp reports it, and two bulbs
// more than 30 apart in any channel are "two-tone".
//
// THE ARITHMETIC IS PORTED, NOT REWRITTEN. The hue and saturation here are
// computed on 0-255 values, exactly as the template did, and NOT through
// `lampToHsv` in 00-colour.js, which divides by 255 first. The two agree to
// about 1e-15, and the colour-name buckets have integer boundaries - so a
// colour sitting on 55.0 degrees could fall either side. Same numbers in,
// same word out.
//
// THE TOGGLE READS THE MEMBERS (from 23 September 2026)
// The toggle's fill, its glow and its ring take `rgb_color` from the first
// lit member, the same colour as the colour word. (The lit border also took
// it until 2 October 2026; it is now transparent.) Until 23 September
// 2026 they read the light the row names, which for six of the seven rows is a
// group, and a group's averaged colour disagreed with section 07. The
// household decided to follow section 07. On a two-tone group the toggle is
// the first member's colour, not a mix that no bulb shows.
//
// Configuration:
//   light        required. The light or light group the row names
//   name         optional. Default: the light's own name. Text, or HA name parts (01-entity.js). The household's word wins
//   icon         optional. Default: the light's icon, else mdi:ceiling-light. The household's icon wins. The tile glyph
//   accent       required. The tile, its border and the icon's glow
//   members      default `attributes.entity_id`, else [light]. The lit count
//                and the colour name read these
//   side_bar     default `members`. The 3px left bar, one stop for each
//   side_bar_opacity [0.14, 0.85]. The bar when the bulb is dark and when it is
//                lit. false takes the bar away
//   side_bar_default_color '120,120,130'. A bulb that reports no colour
//   tap_action   default { action: more-info } on `light`
//   tap_area     'icon' (default) or 'row'. Where a tap runs `tap_action`.
//                See TAP AREA below
//   toggle_color '255,190,120'. The toggle when the light reports no colour
//   toggle_icon_color_on '#ffe4c0'. The glyph inside a lit toggle
//   icon_on / icon_off  the toggle glyph. Defaults mdi:lightbulb-on and
//                mdi:lightbulb-outline
//   slider       a card configuration for the `c` slot. Omitted, the row has
//                no slider and is 57px shorter. The slot carries
//                `--lamplight-light-fill`: the first lit member's colour x 0.84,
//                which is bubble-card's own fill arithmetic. A slider reads it
//                with var(--lamplight-light-fill, var(--bubble-slider-fill-color, ...)).
//                It is not set when no lit member reports a colour.
//   scenes       a card configuration for the `p` slot. Omitted, the row has
//                no scene list and is 43px shorter
//   words        the lit-count line. See LAMP_LIGHT_WORDS
//   effect_colors  optional. A map from an `effect` value to a colour, for
//                example { Scene: white }. See EFFECT COLOUR below
//   scroll_guard_ms 500. The time in ms after the last scroll in which the
//                slider slot ignores a touch. 0 turns it off. See SCROLL
//                QUIET TIME below
//   slider_lock  optional, off when left out. true, or { relock, slide, hint }.
//                A clear pane locks the slider until it is tapped or slid
//                aside. See src/79-slider-lock.js
//
// TAP AREA (from 13 November 2026, household decision)
// With `tap_area: icon`, only the icon tile runs `tap_action`. A tap on the
// name, the state line or the space between them does nothing. The tile is
// 36 x 36, which is less than the 44px of Law 09.1, so a clear 44 x 44 hit
// area sits on the tile. Its -4px margins keep its size in the grid at 36px,
// so the layout does not move. It is not a child of the tile, because the
// tile clips. With `tap_area: row` the whole row runs `tap_action`, as it did
// until 0.99.1-dev, and the toggle and the two slots stop the tap.
//
// SCROLL QUIET TIME (from 29 October 2026)
// bubble-card 3.1.6 starts a drag when a touch moves 4px sideways before it
// moves 10px down. A thumb that starts a scroll often does that, and the light
// changes. The household reported it on the room tabs. While the page scrolls,
// and for `scroll_guard_ms` ms after, a capture listener on the slider slot stops
// `pointerdown` before the slider gets it. The scroll continues. The listener
// also stops the click that ends a stopped touch. It does not handle the drag
// itself: Lamplight does not reimplement the slider. The household also set
// `relative_slide: true` on each slider, so a drag that starts by accident
// moves the level by the drag distance and does not jump.
// EFFECT COLOUR (from 21 October 2026)
// Some integrations report a stale `rgb_color` while an effect runs. tuya_local
// in Tuya Scene mode reports the last colour set, not the scene's colour. The
// card cannot know the scene's colour, so the person who knows it says it.
// While a bulb's `effect` is a key of `effect_colors`, every part of the row
// uses that colour in place of `rgb_color`, and the Kelvin figure is not shown.
// The value is `white` (LAMP_LIGHT_EFFECT_WHITE) or any colour that `accent`
// takes. With the key left out, nothing changes.
//
// WHITE WITH NO KELVIN (from 31 October 2026, critique F19)
// A lit bulb in `color_temp` or `white` mode can report no Kelvin and no
// colour. The Lounge Kitchen bulb (tuya_local) does this with `effect: off`.
// The row then said "colour" and the slider was bubble-card's grey. Now the
// word is "white", and the toggle, ring, rail and slider take
// LAMP_LIGHT_WHITE_RGB, a slightly warm white. The household set the slider
// fill to 214,206,204 on 31 October 2026; 2700 K (0.54.0-dev) was far more
// orange than the bulb. An `effect_colors` key wins over this rule.

const LAMP_LIGHT_WORDS = {
  off: 'off',                   // the light is off and has no known since-time
  off_since: 'off since {t}',   // {t} is HH:MM from last_changed
  one: 'lit',                   // a group of one, and it is on
  both: 'both lit',             // a group of two, and both are on
  all: 'all {n} lit',           // every bulb of three or more
  some: '{on} of {n} lit'       // some of them
};

// The colour-name buckets, by hue in degrees. Ported from the live template.
const LAMP_LIGHT_HUES = [
  [15, 'red'], [33, 'orange'], [55, 'amber'], [70, 'yellow'], [150, 'green'],
  [175, 'mint'], [200, 'cyan'], [248, 'blue'], [268, 'indigo'], [288, 'violet'],
  [310, 'purple'], [332, 'magenta'], [345, 'pink'], [361, 'red']
];

// Above this difference in any one channel, two bulbs are not showing one
// colour and the row says so instead of naming a colour neither is.
const LAMP_LIGHT_TWO_TONE = 30;
// bubble-card's slider fill strength: the fill is the light's colour x 0.84.
const LAMP_LIGHT_FILL = 0.84;

// Below this saturation the name comes from R - B, not from the hue.
const LAMP_LIGHT_WHITE = 0.15;
const LAMP_LIGHT_WARM = 18;

// `effect_colors: { X: white }`. R - B is 15, so the colour word is "white".
const LAMP_LIGHT_EFFECT_WHITE = '255,248,240';
// See WHITE WITH NO KELVIN. x 0.84 gives the slider fill 214,206,204.
const LAMP_LIGHT_WHITE_RGB = [255, 245, 243];

// See SCROLL QUIET TIME. One listener for the page records the time of the
// last scroll. A capture listener on `document` also gets the scroll of an
// element in the light DOM. Home Assistant scrolls the document itself.
let lampLightLastScroll = -Infinity;
let lampLightScrollWatched = false;
function lampLightWatchScroll() {
  if (lampLightScrollWatched) return;
  lampLightScrollWatched = true;
  document.addEventListener('scroll', function () {
    lampLightLastScroll = performance.now();
  }, { capture: true, passive: true });
}

// Name a colour from an average of the bulbs that are on. The arithmetic is
// the live template's, on 0-255 values.
function lampLightColourName(R, G, B) {
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), dd = mx - mn;
  if (mx && dd / mx < LAMP_LIGHT_WHITE) {
    const wm = R - B;
    return wm > LAMP_LIGHT_WARM ? 'warm white'
         : (wm < -LAMP_LIGHT_WARM ? 'cool white' : 'white');
  }
  let hu;
  if (dd === 0) hu = 0;
  else if (mx === R) hu = 60 * ((((G - B) / dd) % 6 + 6) % 6);
  else if (mx === G) hu = 60 * (((B - R) / dd) + 2);
  else hu = 60 * (((R - G) / dd) + 4);
  if (hu < 0) hu += 360;
  for (let i = 0; i < LAMP_LIGHT_HUES.length; i++) {
    if (hu < LAMP_LIGHT_HUES[i][0]) return LAMP_LIGHT_HUES[i][1];
  }
  return 'red';
}

class LampLight extends HTMLElement {

  // A band: lamplight-panel removes the stack gap between two bands. See LAMP_BAND_PAD.
  static get lampBand() { return true; }

  static getStubConfig() {
    return { light: '', name: '', icon: 'mdi:ceiling-light', accent: '255,146,28' };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (!config.light) throw new Error('lamplight-light needs a `light`');
    if (!config.accent) throw new Error('lamplight-light needs an `accent`');
    this._config = config;
    this._light = config.light;
    // `name` and `icon` are optional: the light gives them (01-entity.js). Resolved in `set hass`.
    this._name = lampNameText(config.name) || config.light;
    this._icon = config.icon || 'mdi:ceiling-light';
    this._accent = lampColour(config.accent, 'soft');
    this._members = config.members || null;          // null means "work it out"
    this._rail = config.side_bar || null;
    this._railAlpha = config.side_bar_opacity === false ? false
      : lampOpt('light', config, 'side_bar_opacity');
    this._railFallback = lampOpt('light', config, 'side_bar_default_color');
    this._toggleAccent = lampColour(lampOpt('light', config, 'toggle_color'), 'soft');
    this._toggleIconOn = lampOpt('light', config, 'toggle_icon_color_on');
    this._iconOn = config.icon_on || 'mdi:lightbulb-on';
    this._iconOff = config.icon_off || 'mdi:lightbulb-outline';
    this._tap = config.tap_action || { action: 'more-info' };
    this._tapArea = lampOpt('light', config, 'tap_area') === 'row' ? 'row' : 'icon';
    this._scrollQuiet = Number(lampOpt('light', config, 'scroll_guard_ms')) || 0;
    this._lockCfg = lampLockConfig(config.slider_lock);
    this._words = Object.assign({}, LAMP_LIGHT_WORDS, config.words || {});
    this._effectColour = null;
    if (config.effect_colors) {
      const fx = {};
      Object.keys(config.effect_colors).forEach(function (k) {
        const v = config.effect_colors[k];
        fx[k] = lampAccent(v === 'white' ? LAMP_LIGHT_EFFECT_WHITE : String(v))
          .split(',').map(Number);
      });
      this._effectColour = fx;
    }
    this._key = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._resolveLabels();
    if (this._children) this._children.forEach(function (c) { c.hass = hass; });
    this._update();
    if (this._lock) this._lock.sync(hass.states[this._light]);
  }

  // Only the slider lock needs these. See src/79-slider-lock.js.
  connectedCallback() { if (this._lock) this._lock.attach(); }
  disconnectedCallback() { if (this._lock) this._lock.detach(); }

  getCardSize() { return 2; }

  // The bulbs this row reads. A single bulb has no `entity_id` attribute, so
  // it stands for itself - which is the Bedroom Floor Lamp on this dashboard.
  _memberIds() {
    if (this._members) return this._members;
    const s = this._hass && this._hass.states[this._light];
    const m = s && s.attributes && s.attributes.entity_id;
    return (Array.isArray(m) && m.length) ? m : [this._light];
  }

  _railIds() { return this._rail || this._memberIds(); }

  // The colour configured for the bulb's running effect, or null.
  _effectRgb(st) {
    const fx = this._effectColour, e = st && st.attributes.effect;
    return (fx && e && Object.prototype.hasOwnProperty.call(fx, e)) ? fx[e] : null;
  }

  // True for a lit bulb in a white mode that reports no Kelvin and no colour.
  // See WHITE WITH NO KELVIN.
  _whiteOnly(st) {
    if (!st || st.state !== 'on' || this._effectRgb(st)) return false;
    const a = st.attributes;
    return (a.color_mode === 'color_temp' || a.color_mode === 'white') &&
      !a.color_temp_kelvin && !a.rgb_color;
  }

  // The colour a bulb shows: `effect_colors` first, then `rgb_color`, then
  // warm white for a white bulb that reports neither.
  _rgb(st) {
    if (!st) return null;
    return this._effectRgb(st) || st.attributes.rgb_color ||
      (this._whiteOnly(st) ? LAMP_LIGHT_WHITE_RGB : null);
  }

  // ---- the card ----------------------------------------------------------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (this._lock) { this._lock.destroy(); this._lock = null; }
    this.shadowRoot.innerHTML = '';
    const self = this;
    // A custom element is `display: inline` until told otherwise. The card
    // inside is a block, so the row still measures right - but the host then
    // sits on a text baseline and the anonymous box around it moves the panel's
    // painting by a fraction of a pixel. It showed up as 10,598 pixels of
    // dither noise at one unit per channel, in the bottom 17px of the NEXT
    // panel down, with both panels' own geometry and backgrounds identical.
    // Measured 22 September 2026.
    this.style.display = 'block';

    const card = document.createElement('ha-card');
    this._card = card;
    // The theme sets `ha-card { background: none !important }` and a blurring
    // backdrop-filter, and a rule in this card's own shadow root loses to it.
    [['background', 'transparent'],
     ['backdrop-filter', 'none'],
     ['-webkit-backdrop-filter', 'none'],
     ['border', 'none'],
     ['border-top', '1px solid rgba(255,255,255,0.05)'],
     ['border-radius', '0'],
     ['box-shadow', 'none'],
     // LAMP_BAND_PAD more above and below: this row is a band.
     ['padding', (11 + LAMP_BAND_PAD) + 'px 16px ' + (13 + LAMP_BAND_PAD) + 'px'],
     ['position', 'relative'],
     // The card clips, the way an ha-card does. That is what holds a lit
     // toggle's 14px glow inside the row - NOTES.md records the same trap
     // costing lamplight-rooms a defect the DOM comparison could not see.
     ['overflow', 'hidden'],
     ['box-sizing', 'border-box'],
     ['display', 'block']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    card.style.setProperty('font-family',
      'var(--primary-font-family, Roboto, Noto, sans-serif)');
    card.style.setProperty('line-height', 'normal');
    // button-card's own ha-card is 1.2em, which on this dashboard's 14px host
    // computes to 16.8px. Every field below sets its own size, so this is
    // visible in one place only: the ellipsis glyph drawn when a long name
    // clips is the wrapper's font, not the name's. Written as `1.2em` rather
    // than `16.8px` so a theme that changes the base size moves this too.
    card.style.setProperty('font-size', '1.2em');

    // ---- the rail. A real element, not a ::before, because a card_mod rule
    // needs a card_mod to render it and this card has none.
    if (this._railAlpha !== false) {
      this._railEl = document.createElement('div');
      this._railEl.style.cssText =
        'position:absolute;left:0;top:0;bottom:0;width:3px;pointer-events:none';
      card.appendChild(this._railEl);
    }

    const grid = document.createElement('div');
    // The same template the button-card wrote for itself, letter for letter,
    // so a comparison of computed `grid-template-areas` is meaningful.
    // FOUR ROW TRACKS, ALWAYS, AND THE FIRST ONE IS `1fr`.
    // This is not decoration and it is not guesswork. button-card's own
    // stylesheet carries
    //     #container.vertical { grid-template:
    //       "i" 1fr "n" min-content "s" min-content "l" min-content / 1fr; }
    // and the inline `grid-template-areas` the row writes overrides the AREAS
    // only - the row sizing survives. Two things follow, and both were measured
    // on the live card 22 September 2026:
    //
    //   * The first track is `1fr`, so it takes all the slack the 36px icon
    //     tile leaves when it spans rows 1 and 2. Left at `auto` the slack
    //     splits evenly and every field in the row sits 0.125px out.
    //   * button-card always had four tracks. A row with no scene list still
    //     had a fourth, empty one - 0px of track and one more 3px gap, so the
    //     Bedroom Floor Lamp was 124px and not 121px.
    //
    // The second was a button-card artefact, not a design decision. From
    // 23 September 2026 (household decision) the row has one track for each
    // row of areas, so an empty slot adds no gap.
    grid.style.cssText = 'display:grid;box-sizing:content-box;' +
      'grid-template-areas:"i n t g" "i s h g" "c c c c" "p p p p";' +
      'grid-template-columns:auto 1fr auto auto;' +
      'grid-template-rows:1fr min-content min-content min-content;' +
      'column-gap:13px;row-gap:3px;align-items:center';
    if (!this._config.slider && !this._config.scenes) {
      grid.style.gridTemplateAreas = '"i n t g" "i s h g"';
    } else if (!this._config.scenes) {
      grid.style.gridTemplateAreas = '"i n t g" "i s h g" "c c c c"';
    } else if (!this._config.slider) {
      grid.style.gridTemplateAreas = '"i n t g" "i s h g" "p p p p"';
    }
    const tracks = grid.style.gridTemplateAreas.split('" "').length;
    grid.style.gridTemplateRows = '1fr' + ' min-content'.repeat(tracks - 1);
    this._grid = grid;

    // ---- i, the icon tile
    const tile = document.createElement('div');
    // content-box, not border-box. button-card's img_cell is content-box, so
    // its 34px plus a 1px border measures 36px. Set border-box and the tile
    // is 34px and everything beside it moves.
    tile.style.cssText = 'grid-area:i;box-sizing:content-box;width:34px;height:34px;' +
      'border-radius:11px;display:flex;align-items:center;justify-content:center;' +
      'align-self:center;justify-self:start;' +
      // img_cell clips, which keeps the icon's 6px glow inside the tile.
      'overflow:hidden;position:relative;' +
      'background:rgba(' + this._accent + ',0.12);' +
      // The lit edge (17-edge.js) takes the border's place: 1px of padding keeps the 36px.
      'border:none;padding:1px';
    const icon = document.createElement('ha-icon');
    icon.setAttribute('icon', this._icon);
    this._tileIcon = icon;
    // line-height 0 is section 08's icon Law.
    icon.style.cssText = '--mdc-icon-size:19px;width:19px;height:19px;' +
      'display:flex;align-items:center;justify-content:center;line-height:0;' +
      'color:rgb(' + this._accent + ');' +
      'filter:drop-shadow(0 0 6px rgba(' + this._accent + ',0.55))';
    tile.appendChild(icon);
    this._tileEl = tile; this._tileIcon = icon;
    this._tileEdge = lampEdge(tile, '11px');
    lampEdgePaint(this._tileEdge, this._accent, LAMP_EDGE.lit);
    grid.appendChild(tile);

    // The 44 x 44 hit area on the tile. See TAP AREA.
    if (this._tapArea === 'icon') {
      const hit = document.createElement('div');
      hit.style.cssText = 'grid-area:i;align-self:center;justify-self:start;' +
        'box-sizing:border-box;width:44px;height:44px;margin:-4px;' +
        'position:relative;z-index:1;cursor:pointer;border-radius:13px;' +
        '-webkit-tap-highlight-color:transparent;outline-offset:-2px';
      hit.setAttribute('role', 'button');
      hit.setAttribute('tabindex', '0');
      hit.setAttribute('aria-label', this._name);
      grid.appendChild(hit);
      this._hitEl = hit;
    }

    // button-card wraps each field in a `.ellipsis` div - block, overflow
    // hidden, text-overflow ellipsis. Without it a long name pushes the
    // brightness figure off a 375px phone. NOTES.md records it costing
    // lamplight-rooms one of five defects.
    const ell = (area, js, as, extra) => {
      const d = document.createElement('div');
      // `min-width` stays at `auto`, which is what button-card's .ellipsis
      // computes to. Setting it to 0 - the usual fix for a grid item that will
      // not shrink - makes this column narrower than the live one.
      d.style.cssText = 'grid-area:' + area + ';justify-self:' + js +
        ';align-self:' + as + ';display:block;overflow:hidden;' +
        'white-space:nowrap;text-overflow:ellipsis;' + (extra || '');
      grid.appendChild(d);
      return d;
    };

    // ---- n, the name
    this._nameWrap = ell('n', 'start', 'end');
    const nameInner = document.createElement('div');
    nameInner.style.cssText = 'display:flex;align-items:center;font-size:var(--lamplight-t-name);' +
      'font-weight:600;letter-spacing:-0.01em;color:#ffffff;line-height:1.25';
    nameInner.textContent = this._name;
    this._nameText = nameInner;
    this._nameWrap.appendChild(nameInner);

    // ---- s, the lit count
    this._subWrap = ell('s', 'start', 'start',
      'font-size:var(--lamplight-t-state);color:var(--lamplight-ink-soft);font-variant-numeric:tabular-nums');
    this._sub = document.createElement('span');
    this._subWrap.appendChild(this._sub);

    // ---- t, the brightness
    this._pctWrap = ell('t', 'end', 'end',
      'font-size:var(--lamplight-t-inline);font-weight:500;letter-spacing:-0.01em;color:#ffffff;' +
      'font-variant-numeric:tabular-nums;line-height:1');

    // ---- h, the colour or the Kelvin
    this._colWrap = ell('h', 'end', 'start',
      'font-size:var(--lamplight-t-caption);font-weight:400;font-variant-numeric:tabular-nums;' +
      'line-height:1');
    this._col = document.createElement('span');
    this._colWrap.appendChild(this._col);

    // ---- g, the toggle and its ring
    const slot = document.createElement('div');
    slot.style.cssText = 'grid-area:g;align-self:center;justify-self:end;' +
      // The cell must not clip: the ring sits 4px outside the toggle. The
      // card_mod this replaces said `#g { overflow: visible !important }`.
      'width:32px;height:32px;overflow:visible';
    const toggle = document.createElement('div');
    // border-box, so the 1px border sits inside the 32px the way an ha-card
    // does it. Left at content-box the toggle is 34px and overflows its column.
    toggle.style.cssText = 'box-sizing:border-box;position:relative;' +
      'width:32px;height:32px;border-radius:50%;display:flex;' +
      'align-items:center;justify-content:center;overflow:visible;cursor:pointer';
    // The ring is an SVG arc (src/15-ring.js). Since 2 October 2026 a lit
    // toggle has a transparent border, so the ring is the only circle.
    const ring = lampRingCreate();
    const tIcon = document.createElement('ha-icon');
    tIcon.style.cssText = '--mdc-icon-size:15px;width:15px;height:15px;margin:0;' +
      'display:flex;align-items:center;justify-content:center;line-height:0';
    toggle.appendChild(ring);
    toggle.appendChild(tIcon);
    slot.appendChild(toggle);
    grid.appendChild(slot);
    this._toggle = toggle; this._ring = ring; this._tIcon = tIcon;

    // ---- c and p, the two slots
    this._cSlot = this._config.slider ? this._slot('c') : null;
    this._pSlot = this._config.scenes ? this._slot('p') : null;

    card.appendChild(grid);
    this.shadowRoot.appendChild(card);

    // With `tap_area: icon` (see TAP AREA), only the hit area opens the light.
    // With `tap_area: row`, the row opens the light. Three things inside it
    // stop the tap before it gets there: the toggle, the slider slot and the
    // scenes slot.
    //
    // THE TWO SLOTS MUST STOP IT TOO, and that is not obvious. The button-card
    // this replaces put its tap action on the whole card, but a tap that landed
    // on a nested card never reached it - button-card stops at the child. A
    // plain listener on `ha-card` does not: without these two lines, opening the
    // scene list, dragging the slider or tapping a scene ALSO opens the
    // more-info dialog over the top. No pixel test can see that; it was found
    // by an `elementFromPoint` check that hit an `ha-more-info-dialog`.
    if (this._hitEl) {
      this._hitEl.addEventListener('click', function () { self._tapRow(); });
      this._hitEl.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        self._tapRow();
      });
    } else {
      card.addEventListener('click', function () { self._tapRow(); });
      [this._cSlot, this._pSlot].forEach(function (slot) {
        if (slot) slot.addEventListener('click', function (ev) { ev.stopPropagation(); });
      });
    }
    toggle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (self._hass) self._hass.callService('light', 'toggle', { entity_id: self._light });
    });

    // See SCROLL QUIET TIME. Do not use `pointer-events: none` on the slot:
    // the touch then goes to the row below it, and the row opens more-info.
    if (this._cSlot && this._scrollQuiet > 0) {
      lampLightWatchScroll();
      let stopped = false;
      this._cSlot.addEventListener('pointerdown', function (ev) {
        stopped = performance.now() - lampLightLastScroll < self._scrollQuiet;
        if (stopped) ev.stopPropagation();
      }, true);
      this._cSlot.addEventListener('click', function (ev) {
        if (stopped) { stopped = false; ev.stopPropagation(); }
      }, true);
    }

    // The slider lock, only when the config asks for it. It goes on after the
    // quiet time, so a touch the quiet time stops never reaches the lock.
    if (this._cSlot && this._lockCfg) {
      this._lock = new LampSliderLock(this._cSlot, this._lockCfg, this._name);
      if (this.isConnected) this._lock.attach();
    }

    this._buildChildren();
  }

  // No `grid-column: 1 / -1` here, although the card this replaces carries one.
  // The area itself is four columns wide - "c c c c" - so the two say the same
  // thing, and button-card writes its own `grid-area` after the field's styles,
  // which resets the column back to the area. Setting both makes the computed
  // `grid-area` read `c / 1 / c / -1` where the live card reads `c`.
  _slot(area) {
    const d = document.createElement('div');
    d.style.cssText = 'grid-area:' + area + ';margin-top:9px';
    this._grid.appendChild(d);
    return d;
  }

  // Build each child as a <hui-card>, the way Home Assistant's own stacks do
  // it. NOT helpers.createCardElement: that returns the bare element and
  // card_mod never sees it, so a child carrying card_mod renders unstyled.
  async _buildChildren() {
    const jobs = [];
    if (this._cSlot) jobs.push([this._cSlot, this._config.slider]);
    if (this._pSlot) jobs.push([this._pSlot, this._config.scenes]);
    if (!jobs.length) return;
    await window.loadCardHelpers();
    const self = this;
    this._children = jobs.map(function (j) {
      const el = document.createElement('hui-card');
      if (self._hass) el.hass = self._hass;
      el.config = j[1];
      j[0].appendChild(el);
      return el;
    });
  }

  _tapRow() {
    const a = this._tap || {};
    if (a.action === 'none') return;
    if (a.action === 'navigate' && a.navigation_path) {
      history.pushState(null, '', a.navigation_path);
      this.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }));
      return;
    }
    if (a.action === 'call-service' || a.action === 'perform-action') {
      const bits = (a.perform_action || a.service || '').split('.');
      if (bits.length === 2 && this._hass) {
        this._hass.callService(bits[0], bits[1], a.data || {}, a.target || {});
      }
      return;
    }
    const ev = new Event('hass-more-info', { bubbles: true, composed: true });
    ev.detail = { entityId: a.entity || this._light };
    this.dispatchEvent(ev);
  }

  // ---- the state ---------------------------------------------------------

  // Everything the row draws from, as one string. Home Assistant pushes a new
  // hass on every state change in the house; repainting on each is work for
  // nothing.
  _stateKey(ids) {
    const self = this;
    const one = function (id) {
      const s = self._hass.states[id];
      if (!s) return id + ':-';
      const a = s.attributes;
      return id + ':' + s.state + ':' + s.last_changed + ':' + a.brightness +
             ':' + (a.rgb_color || []).join('-') + ':' + a.color_temp_kelvin +
             ':' + a.effect;
    };
    return [this._light].concat(ids).map(one).join('|');
  }

  // The household's name and icon win. Without them the light gives them. A light with no icon of
  // its own keeps the old default, mdi:ceiling-light.
  _resolveLabels() {
    const c = this._config;
    const name = lampEntityName(this._hass, this._light, c.name);
    const s = this._hass.states[this._light];
    const icon = c.icon || (s && s.attributes.icon) || 'mdi:ceiling-light';
    if (name !== this._name) {
      this._name = name;
      if (this._nameText) this._nameText.textContent = name;
      if (this._hitEl) this._hitEl.setAttribute('aria-label', name);
      if (this._lock) this._lock._name = name;
    }
    if (icon !== this._icon) {
      this._icon = icon;
      if (this._tileIcon) this._tileIcon.setAttribute('icon', icon);
    }
  }

  _update() {
    if (!this._hass || !this._card) return;
    const members = this._memberIds(), rail = this._railIds();
    const key = this._stateKey(members.concat(rail));
    if (key === this._key) return;
    this._key = key;

    const s = this._hass.states[this._light];
    const on = !!(s && s.state === 'on');
    this._paintSub(s, on, members);
    this._paintBrightness(s, on);
    this._paintColour(s, on, members);
    this._paintToggle(s, on, members);
    this._paintSliderFill(members);
    this._paintRail(rail);
  }

  _paintSub(s, on, members) {
    const w = this._words;
    // The household's words lead a lit row (type_rank_options.html, option 2).
    this._sub.style.color = on ? 'var(--lamplight-ink-mid)' : '';
    if (!on) {
      let txt = w.off;
      const d = s ? new Date(s.last_changed) : null;
      if (d && !isNaN(d.getTime())) {
        const hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
        txt = w.off_since.replace('{t}', hh);
      }
      this._sub.textContent = txt;
      return;
    }
    if (members.length < 2) { this._sub.textContent = w.one; return; }
    const self = this;
    const n = members.filter(function (e) {
      const m = self._hass.states[e];
      return m && m.state === 'on';
    }).length;
    if (n === members.length) {
      this._sub.textContent = members.length === 2 ? w.both
        : w.all.replace('{n}', n);
    } else {
      this._sub.textContent = w.some.replace('{on}', n).replace('{n}', members.length);
    }
  }

  _paintBrightness(s, on) {
    this._pctWrap.innerHTML = '';
    if (!on) return;
    const b = s.attributes.brightness;
    const pct = (b === undefined || b === null) ? '--' : Math.round(b / 255 * 100);
    this._pctWrap.appendChild(document.createTextNode(String(pct)));
    const i = document.createElement('i');
    i.style.cssText = 'font-style:normal;font-size:var(--lamplight-t-caption);font-weight:500;letter-spacing:0;' +
      'color:var(--lamplight-ink-quiet);margin-left:1px';
    i.textContent = '%';
    this._pctWrap.appendChild(i);
  }

  _paintColour(s, on, members) {
    if (!on) {
      this._col.textContent = '';
      return;
    }
    const self = this;
    const arrs = members.map(function (e) { return self._hass.states[e]; })
      .filter(function (m) { return m && m.state === 'on' && self._rgb(m); })
      .map(function (m) { return self._rgb(m); });

    let spread = 0;
    if (arrs.length > 1) {
      for (let i = 0; i < 3; i++) {
        const vals = arrs.map(function (a) { return a[i]; });
        spread = Math.max(spread, Math.max.apply(null, vals) - Math.min.apply(null, vals));
      }
    }
    const twoTone = spread > LAMP_LIGHT_TWO_TONE;
    const k = this._effectRgb(s) ? null : s.attributes.color_temp_kelvin;
    let txt;
    if (twoTone) {
      txt = 'two-tone';
    } else if (k) {
      txt = k + ' K';
    } else {
      const src = arrs.length ? arrs : (this._rgb(s) ? [this._rgb(s)] : []);
      const lit = members.map(function (e) { return self._hass.states[e]; })
        .filter(function (m) { return m && m.state === 'on' && self._rgb(m); });
      if (lit.length ? lit.every(function (m) { return self._whiteOnly(m); }) : this._whiteOnly(s)) {
        txt = 'white';
      } else if (!src.length) {
        txt = 'colour';
      } else {
        let R = 0, G = 0, B = 0;
        src.forEach(function (a) { R += a[0]; G += a[1]; B += a[2]; });
        txt = lampLightColourName(R / src.length, G / src.length, B / src.length);
      }
    }
    const c = twoTone ? null
      : (arrs.length ? arrs[0].join(',')
        : (this._rgb(s) ? this._rgb(s).join(',') : null));
    this._col.style.color = c ? 'rgb(' + c + ')' : 'var(--lamplight-ink-mid)';
    this._col.textContent = txt;
  }

  // The toggle takes the colour of the first lit member, the same rule as the
  // colour word. master_design.html section 07: read members, never a group.
  // If no member reports a colour, it uses the light the row names, then the
  // accent.
  _paintToggle(s, on, members) {
    const self = this;
    const lit = members.map(function (e) { return self._hass.states[e]; })
      .find(function (m) { return m && m.state === 'on' && self._rgb(m); });
    const c = lit ? this._rgb(lit).join(',')
      : this._rgb(s) ? this._rgb(s).join(',')
      : this._toggleAccent;
    this._tIcon.setAttribute('icon', on ? this._iconOn : this._iconOff);
    this._tIcon.style.color = on ? this._toggleIconOn : 'rgba(255,255,255,0.45)';
    this._toggle.style.background = on ? 'rgba(' + c + ',0.18)'
                                       : 'rgba(255,255,255,0.055)';
    this._toggle.style.border = on ? '1px solid transparent'
                                   : '1px solid rgba(255,255,255,0.12)';
    this._toggle.style.boxShadow = on ? '0 0 14px -2px rgba(' + c + ',0.55)' : 'none';

    // The tile goes quiet when the light is off, as a plug's and a window's do. Before
    // option 10 (12 November 2026) an off lamp's tile looked lit: the one row mark that
    // said something untrue.
    if (this._tileEl) {
      this._tileEl.style.background = on ? 'rgba(' + this._accent + ',0.12)' : 'rgba(255,255,255,0.07)';
      this._tileIcon.style.color = on ? 'rgb(' + this._accent + ')' : 'rgba(255,255,255,0.40)';
      this._tileIcon.style.filter = on ? 'drop-shadow(0 0 6px rgba(' + this._accent + ',0.55))' : 'none';
      lampEdgePaint(this._tileEdge, on ? this._accent : '255,255,255', on ? LAMP_EDGE.lit : LAMP_EDGE.off);
    }

    if (!on) { lampRingPaint(this._ring, null); return; }
    // The same arithmetic as the Jinja it replaces: brightness out of 255 as
    // a whole percent, and a light with no brightness reads zero.
    const b = s.attributes.brightness;
    const pct = (b === undefined || b === null) ? 0 : Math.round(b / 255 * 100);
    lampRingPaint(this._ring, pct, c, 0.95);
  }

  // The slider reads members too (section 07, from 23 September 2026).
  // bubble-card writes its own --bubble-slider-fill-color inline on its fill
  // element from the entity it is given, which is the group, and a card
  // cannot overwrite an inline value from outside. So the slot carries a
  // second variable and the slider's `styles` read it first. x 0.84 and
  // Math.round are bubble-card's own, measured: 255,175,105 -> 214,147,88.
  _paintSliderFill(members) {
    if (!this._cSlot) return;
    const self = this;
    const lit = members.map(function (e) { return self._hass.states[e]; })
      .find(function (m) { return m && m.state === 'on' && self._rgb(m); });
    // One name only from 0.146.0-dev (22 Nov 2026): the slider module (companions/bubble-card,
    // version 1.1) reads `--lamplight-light-fill`. The old `--lamp-light-fill` is gone.
    const slot = this._cSlot, name = '--lamplight-light-fill';
    if (!lit) { slot.style.removeProperty(name); return; }
    const c = this._rgb(lit).map(function (v) { return Math.round(v * LAMP_LIGHT_FILL); });
    slot.style.setProperty(name, 'rgb(' + c.join(', ') + ')');
  }

  // One stop for each rail entity, top to bottom, in the order given. One stop
  // paints flat; two or more paint a linear gradient. The alpha says whether
  // that bulb is lit, so a half-lit pair reads at a glance.
  _paintRail(rail) {
    if (!this._railEl) return;
    const self = this, A = this._railAlpha;
    const stops = rail.map(function (id) {
      const st = self._hass.states[id];
      const c = self._rgb(st) ? self._rgb(st).join(',') : self._railFallback;
      const a = (st && st.state === 'on') ? A[1] : A[0];
      return 'rgba(' + c + ',' + a + ')';
    });
    if (!stops.length) { this._railEl.style.background = 'transparent'; return; }
    this._railEl.style.background = stops.length === 1
      ? stops[0]
      : 'linear-gradient(180deg, ' + stops.map(function (s, i) {
          return s + ' ' + Math.round(i / (stops.length - 1) * 100) + '%';
        }).join(', ') + ')';
  }
}

customElements.define('lamplight-light', LampLight);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-light',
  name: 'Lamplight Light Row',
  description: 'A light row: brightness, colour, a toggle, a slider and its scenes.',
  preview: false
});
