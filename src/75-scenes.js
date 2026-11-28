// lamplight-scenes. A collapsed list of scenes, with the active one marked.
//
// It replaces `custom:expander-card` and the `custom:button-card`s inside it.
// On the dashboard it was built for there are six of them, one in each light
// row, and together they are 75,731 characters - the largest single block of
// embedded code on that dashboard.
//
// IT IS NOT A PANEL, SO IT DRAWS NO PANEL
// The card it replaces carried a `card_mod` that took its ground, its rim, its
// shadow and its padding away, because it sits inside a light row. This card
// draws the same transparent `ha-card` and nothing else. Put it inside a
// `lamplight-panel` if you want a ground under it; that is what `lamplight-panel` is for.
//
// WHAT IT DRAWS
// A 34px header: the title on the left, the scene count on the right, and a
// chevron. Below it, one 34px pill for each scene, each with a 2px left border
// and a 1px divider under it. The last pill has no divider.
//
//   collapsed   34px
//   open        34px + 34px for each scene
//
// THE ACTIVE SCENE
// master_design.html section 10 makes this a Law: read `last_changed`, never
// `last_updated`. Applying a scene updates the light 1.14s AFTER the scene's
// own timestamp, so a `last_updated` test is false the instant you apply one.
//
// A scene is the active one when all four are true:
//   the light is on
//   the scene's own state parses as a time
//   that time is not older than the light's `last_changed`
//   no other scene in the list has a later time
//
// Give no `light:` and no scene is ever marked, which is the right answer for
// a list that does not belong to one light.
//
// THE ONE PIXEL IT DOES NOT MATCH
// Measured against the live card at 375 x 812, device pixel ratio 2, by standing
// the two in the same slot and photographing each: every state is 0 differing
// pixels except one. An ACTIVE pill's round mark rasterises about 0.02px further
// right and 31 of its 176,800 pixels differ, at most 7 of 255, on the glyph's
// antialiased edge alone. Its core is identical and so is the ground around it.
//
// Everything measurable about the two marks is the same: the same x of
// 333.953125, the same width of 10.046875, the same font, size, weight, colour,
// padding and resolved auto margin, and the same grayscale antialiasing. Four
// things were tried and none of them moved it - matching button-card's grid
// layout path instead of a flex row, `white-space: nowrap`, `display: ''` in
// place of `display: inline`, and `overflow: hidden` on the pill. Two of the
// four were right for their own reasons and were kept.
//
// It is invisible and it is not worth more. Do not chase it again without a new
// idea; write the idea here if you have one.
//
// THE ANIMATION
// The household sees what expander-card did: the list stands still behind
// `overflow: hidden` and the rows below slide down to uncover it, over 0.35s
// ease, while it fades in over 0.5s ease. Measured on the live card, 22
// September 2026.
//
// From 0.95.0-dev (option 2 of design-docs/scenes_motion_options.html, 12
// November 2026) no layout property is animated. Until then `margin-bottom`
// was, and each frame laid out and painted the view again: 10.5 ms of main
// thread a frame at CPU x4, against 8.3 ms a frame on the household's 120 Hz
// telephone, which stuttered. Now the layout changes once, at the start of an
// open or at the end of a close. Every element after the card is moved back
// to its old place with `transform` and let go, so the GPU carries it (FLIP).
// The wrap moves with the rows and the list moves back inside it, so the
// clip edge uncovers a list that stands still. A `clip-path` on the panel
// keeps its bottom edge with the rows. The panel's outer shadow is clipped
// for the 0.35s too. Web Animations write no inline style, and all of them
// are cancelled when the slide ends.
//
// Configuration:
//   scenes      required. One entry for each pill, top to bottom:
//                 entity   required. The scene
//                 name     the pill's word. Default: the friendly name
//   light       the light the scenes belong to. Omitted marks nothing
//   title       default "Scenes"
//   icon        default mdi:chevron-down
//   accent      the active mark. Default "255,176,58"
//   show_count  show the count on the header. Default true
//   expanded    open on load. Default false
//   animation   default true
//   remember_open_as  a localStorage key suffix. Given, the open state survives a
//               reload. Omitted, the card opens in the `expanded` state every
//               time. There is no default, deliberately: a card that writes to
//               a browser store without being asked is a surprise.

const LAMP_SCENE_ACCENT = '255,176,58';
const LAMP_SCENE_STORE = 'lamp-scenes-';

// The measured constants of the card this replaces. Every one of them came
// from the live DOM at 375 x 812 on 22 September 2026.
const LAMP_SCENE = {
  // The header is 44px with a 14px radius from 24 September 2026. It was 34px
  // and 9px: below the 44px touch-target Law of master_design.html section
  // 09, and much thinner than the 48px brightness slider above it. The
  // household chose 44px and the slider's radius, so the two read as one
  // family and the slider stays the stronger control. Lamplight 0.16.4-dev.
  headerHeight: 44,
  headerRadius: '14px',
  // From 0.90.0-dev (option 10 of design-docs/visual_refresh_options.html, 12 November
  // 2026) the fill is the one white plate, .07, and the flat .10 border is a lit edge
  // (17-edge.js, LAMP_EDGE.bar) that brightens toward the top right. The bar stays flat.
  headerFill: 'rgba(255,255,255,0.07)',
  titleSize: 'var(--lamplight-t-state)',
  titleWeight: '500',
  titleColour: 'var(--lamplight-ink-mid)',
  countSize: 'var(--lamplight-t-caption)',
  countColour: 'var(--lamplight-ink-quiet)',
  countPad: '8px',
  icoSize: 17,
  pillHeight: 34,
  pillPad: '0 6px 0 10px',
  pillDivider: '1px solid rgba(255,255,255,0.045)',
  pillSize: 'var(--lamplight-t-state)',
  pillWeight: '500',
  pillColour: 'var(--lamplight-ink-strong)',
  activeWeight: '600',
  activeColour: '#ffd9a0',
  activeFillAlpha: 0.06,
  dotSize: 'var(--lamplight-t-label)',
  dotPad: '4px',
  slide: '0.35s',
  fade: '0.5s',
  slideMs: 350,
  fadeMs: 500
};

// A slide's helpers. The top of an element as it is drawn now, with any
// transform; the y translate of an element now; a translate as CSS.
function lampSceneTop(e) { return e.getBoundingClientRect().top; }
function lampSceneShift(e) {
  const t = getComputedStyle(e).transform;
  if (!t || t === 'none') return 0;
  try { return new DOMMatrixReadOnly(t).m42; } catch (err) { return 0; }
}
function lampSceneY(y) { return 'translateY(' + y + 'px)'; }

// Is this scene the one the light is showing?
function lampSceneActive(hass, sceneId, lightId, all) {
  if (!hass || !lightId) return false;
  const S = hass.states[sceneId], L = hass.states[lightId];
  if (!L || L.state !== 'on' || !S) return false;
  const ts = Date.parse(S.state), lc = Date.parse(L.last_changed);
  if (isNaN(ts) || isNaN(lc) || ts < lc) return false;
  let best = -1;
  all.forEach(function (id) {
    const s = hass.states[id];
    if (!s) return;
    const t = Date.parse(s.state);
    if (!isNaN(t) && t > best) best = t;
  });
  return ts === best;
}

class LampScenes extends HTMLElement {

  static getStubConfig() {
    return { title: 'Scenes', scenes: [] };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (!Array.isArray(config.scenes) || !config.scenes.length) {
      throw new Error('lamplight-scenes needs a `scenes` list');
    }
    this._config = config;
    this._scenes = config.scenes.map(function (s) {
      const row = (typeof s === 'string') ? { entity: s } : s;
      if (!row.entity) throw new Error('every scene needs an entity');
      return { entity: row.entity, name: row.name || null };
    });
    this._ids = this._scenes.map(function (s) { return s.entity; });
    this._light = config.light || null;
    this._title = config.title === undefined ? 'Scenes' : config.title;
    this._icon = config.icon || 'mdi:chevron-down';
    this._accent = lampColour(config.accent || LAMP_SCENE_ACCENT, 'soft');
    this._count = lampOpt('scenes', config, 'show_count') !== false;
    this._animate = config.animation !== false;
    this._store = config.remember_open_as || null;
    this._open = this._read();
    this._marks = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  getCardSize() { return 1; }

  // ---- the open state ----------------------------------------------------

  // A card with no `store` never touches localStorage, in either direction.
  _read() {
    const want = !!this._config.expanded;
    if (!this._store) return want;
    try {
      const v = localStorage.getItem(LAMP_SCENE_STORE + this._store);
      if (v === 'true') return true;
      if (v === 'false') return false;
    } catch (e) { /* a browser that refuses the store gives the default */ }
    return want;
  }

  _write(open) {
    if (!this._store) return;
    try {
      localStorage.setItem(LAMP_SCENE_STORE + this._store, open ? 'true' : 'false');
    } catch (e) { /* nothing to do, and nothing depends on it */ }
  }

  // ---- the card ----------------------------------------------------------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    const self = this;

    const card = document.createElement('ha-card');
    this._card = card;
    // The theme sets `ha-card { background: none !important }` and a blurring
    // backdrop-filter, and a rule in this card's own shadow root loses to it.
    // The three that must be written as inline important properties are the
    // background and both spellings of the backdrop filter.
    [['background', 'transparent'],
     ['backdrop-filter', 'none'],
     ['-webkit-backdrop-filter', 'none'],
     ['border', 'none'],
     ['box-shadow', 'none'],
     ['padding', '0'],
     ['display', 'block'],
     ['overflow', 'visible']
    ].forEach(function (p) { card.style.setProperty(p[0], p[1], 'important'); });
    // A custom element does not inherit the typography a button-card sets for
    // itself. The pills take Roboto from here; the header title overrides it
    // below, because expander-card's header reads --ha-font-family-body and
    // the two are not the same font.
    card.style.setProperty('font-family',
      'var(--primary-font-family, Roboto, Noto, sans-serif)');
    card.style.setProperty('line-height', 'normal');

    // ---- the header
    const head = document.createElement('div');
    head.className = 'lamp-scenes-header';
    head.setAttribute('role', 'button');
    head.setAttribute('tabindex', '0');
    head.style.cssText = 'box-sizing:border-box;display:flex;flex-direction:row;' +
      'align-items:center;height:' + LAMP_SCENE.headerHeight + 'px;padding:1px 11px;' +
      'border-radius:' + LAMP_SCENE.headerRadius + ';background:' + LAMP_SCENE.headerFill +
      ';border:none;position:relative;cursor:pointer;width:100%;' +
      '-webkit-tap-highlight-color:transparent';
    lampEdgePaint(lampEdge(head, LAMP_SCENE.headerRadius), '255,255,255', LAMP_EDGE.bar);

    const primary = document.createElement('div');
    primary.style.cssText = 'display:flex;align-items:center;width:100%;' +
      'font-family:var(--primary-font-family, Roboto, Noto, sans-serif);' +
      'font-size:' + LAMP_SCENE.titleSize + ';font-weight:' + LAMP_SCENE.titleWeight +
      ';color:' + LAMP_SCENE.titleColour;
    primary.appendChild(document.createTextNode(this._title || ''));

    if (this._count) {
      const n = document.createElement('span');
      n.style.cssText = 'margin-left:auto;padding-right:' + LAMP_SCENE.countPad +
        ';font-size:' + LAMP_SCENE.countSize + ';color:' + LAMP_SCENE.countColour +
        ';flex:none';
      n.textContent = String(this._scenes.length);
      primary.appendChild(n);
    }
    head.appendChild(primary);

    const ico = document.createElement('ha-icon');
    ico.setAttribute('icon', this._icon);
    // line-height:0 is section 08's icon Law. Without it ha-svg-icon sits on a
    // text baseline and the chevron renders low.
    ico.style.cssText = '--mdc-icon-size:' + LAMP_SCENE.icoSize + 'px;' +
      'width:' + LAMP_SCENE.icoSize + 'px;height:' + LAMP_SCENE.icoSize + 'px;' +
      'line-height:0;flex:none;color:var(--primary-text-color,#fff);' +
      (this._animate ? 'transition:transform ' + LAMP_SCENE.slide + ';' : '');
    this._ico = ico;
    head.appendChild(ico);

    head.addEventListener('click', function () { self._toggle(); });
    head.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); self._toggle(); }
    });
    card.appendChild(head);

    // ---- the list
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;overflow:hidden';
    this._wrap = wrap;

    const list = document.createElement('div');
    list.style.cssText = 'display:block';
    this._list = list;

    this._pills = this._scenes.map(function (s, i) {
      return self._pill(s, i === self._scenes.length - 1);
    });
    this._pills.forEach(function (p) { list.appendChild(p.el); });
    wrap.appendChild(list);
    card.appendChild(wrap);

    this.shadowRoot.appendChild(card);
    this._apply(false);
  }

  _pill(scene, last) {
    const self = this;
    const el = document.createElement('div');
    el.className = 'lamp-scenes-pill';
    el.style.cssText = 'box-sizing:border-box;display:flex;align-items:center;' +
      'height:' + LAMP_SCENE.pillHeight + 'px;padding:' + LAMP_SCENE.pillPad + ';' +
      'border-left:2px solid transparent;' +
      'border-bottom:' + (last ? 'none' : LAMP_SCENE.pillDivider) + ';' +
      'border-radius:0;background:transparent;cursor:pointer;overflow:hidden;' +
      '-webkit-tap-highlight-color:transparent';
    // `overflow: hidden` is what the pill it replaces has, because that pill is
    // an `ha-card` and an `ha-card` clips. Nothing in a pill glows today, so it
    // changes no pixel now; it is here so that the first thing that does glow
    // is clipped the same way. NOTES.md records the same trap for the icon
    // tile and the row in lamplight-rooms, where it cost four defects.

    const line = document.createElement('div');
    // `white-space: nowrap` is not decoration. button-card sets it on its own
    // card and the live pill inherits it; without it the active dot's glyph is
    // shaped a fraction of a pixel further right and 31 pixels of its edge
    // differ. Everything else about the two dots is bit-identical - the same
    // x of 333.953125 and the same width of 10.046875. Measured 22 September
    // 2026, and it was the last pixel between the two cards.
    line.style.cssText = 'display:flex;align-items:center;width:100%;' +
      'white-space:nowrap;' +
      'font-size:' + LAMP_SCENE.pillSize + ';font-weight:' + LAMP_SCENE.pillWeight +
      ';color:' + LAMP_SCENE.pillColour;

    const word = document.createElement('span');
    word.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap';

    const dot = document.createElement('span');
    dot.style.cssText = 'margin-left:auto;padding-right:' + LAMP_SCENE.dotPad +
      ';font-size:' + LAMP_SCENE.dotSize + ';color:rgb(' + this._accent + ');flex:none;' +
      'display:none';
    dot.textContent = '●';

    line.appendChild(word);
    line.appendChild(dot);
    el.appendChild(line);

    el.addEventListener('click', function () {
      if (!self._hass) return;
      self._hass.callService('scene', 'turn_on', {},
        { entity_id: scene.entity });
    });

    return { el: el, line: line, word: word, dot: dot, scene: scene };
  }

  // ---- open and close ----------------------------------------------------

  _toggle() {
    this._open = !this._open;
    this._write(this._open);
    this._apply(this._animate);
  }

  // `animate` false sets the end state at once, which is what a first render
  // and a card with `animation: false` both need. See THE ANIMATION above.
  _apply(animate) {
    const list = this._list, wrap = this._wrap, open = this._open;
    this._ico.style.transform = open ? 'rotate(180deg)' : 'none';

    // Read where everything is now, before a running slide stops. A tap in the
    // middle of a slide starts the new slide from here, not from an end.
    const running = this._anims && this._anims.length > 0;
    const movers = animate && typeof wrap.animate === 'function' ? this._movers() : null;
    const seen = movers ? movers.map(lampSceneTop) : null;
    const shift = running ? lampSceneShift(wrap) : null;
    const fade = running ? Number(getComputedStyle(list).opacity) : null;
    this._stop();

    list.style.transition = 'none';
    list.style.marginBottom = '0px';
    if (!movers) {
      list.style.opacity = open ? '1' : '0';
      list.style.display = open ? 'block' : 'none';
      return;
    }

    // The open layout, and for a close the closed one too. A close keeps the
    // list in the layout until its slide ends.
    list.style.opacity = '1';
    list.style.display = 'block';
    const h = list.offsetHeight;
    const L = movers.map(lampSceneTop);
    let C = null;
    if (!open) {
      list.style.display = 'none';
      C = movers.map(lampSceneTop);
      list.style.display = 'block';
    }

    // `from` and `to` are the wrap's translate: -h hides the list, 0 shows it.
    const from = shift !== null ? shift : (open ? -h : 0), to = open ? 0 : -h;
    if (!h || Math.abs(to - from) < 0.5) {
      if (!open) list.style.display = 'none';
      return;
    }
    const part = Math.abs(to - from) / h;
    const o = { duration: LAMP_SCENE.slideMs * part, easing: 'ease', fill: 'forwards' };
    const A = [];
    // The wrap moves with the rows below, and the list moves back by the same
    // amount: the list stands still and the wrap's clip edge uncovers it.
    A.push(wrap.animate([{ transform: lampSceneY(from) }, { transform: lampSceneY(to) }], o));
    A.push(list.animate([{ transform: lampSceneY(-from) }, { transform: lampSceneY(-to) }], o));
    A.push(list.animate([{ opacity: fade !== null ? fade : (open ? 0 : 1) }, { opacity: open ? 1 : 0 }],
      { duration: LAMP_SCENE.fadeMs * part, easing: 'ease', fill: 'forwards' }));
    movers.forEach(function (m, i) {
      const a = seen[i] - L[i], b = open ? 0 : C[i] - L[i];
      if (Math.abs(a) > 0.5 || Math.abs(b) > 0.5) {
        A.push(m.animate([{ transform: lampSceneY(a) }, { transform: lampSceneY(b) }], o));
      }
    });
    // The panel's bottom edge follows the rows below, or the next panel would
    // cover it and its bottom corners during the slide.
    const panel = this._panel();
    if (panel) {
      const cs = getComputedStyle(panel);
      const r = [cs.borderTopLeftRadius, cs.borderTopRightRadius,
        cs.borderBottomRightRadius, cs.borderBottomLeftRadius].join(' ');
      A.push(panel.animate([{ clipPath: 'inset(0 0 ' + -from + 'px 0 round ' + r + ')' },
        { clipPath: 'inset(0 0 ' + -to + 'px 0 round ' + r + ')' }], o));
    }
    this._anims = A;

    const self = this;
    A[0].finished.then(function () {
      if (self._anims !== A) return;
      // A pill left in the tab order behind a closed header is a tap target
      // nobody can see, so a closed list goes out of the layout.
      if (!self._open) list.style.display = 'none';
      self._stop();
    }, function () { /* cancelled by a newer slide */ });
  }

  _stop() {
    (this._anims || []).forEach(function (a) { a.cancel(); });
    this._anims = [];
  }

  // Everything after this card in the page, at each level up to the view:
  // later rows in the same panel, and later cards. They are found by place,
  // not by type, so a card that is not a Lamplight card moves too. A card in
  // another column has no change of place and is not animated. A transform
  // has no effect on an inline box, so an inline element is left out, and the
  // children of a `display: contents` element take its place.
  _movers() {
    const out = [];
    function add(n) {
      if (n.localName === 'style' || n.localName === 'script' || n.localName === 'template') return;
      const d = getComputedStyle(n).display;
      if (d === 'contents') { Array.prototype.forEach.call(n.children, add); return; }
      if (d === 'none' || d === 'inline') return;
      const r = n.getBoundingClientRect();
      if (r.width || r.height) out.push(n);
    }
    let a = this;
    while (a && a.nodeType === 1 && a.localName !== 'hui-view' && a !== document.body) {
      for (let n = a.nextElementSibling; n; n = n.nextElementSibling) add(n);
      const p = a.parentNode;
      a = p && (p.host || p);
    }
    return out;
  }

  // The outermost `ha-card` round this card, below the view: the panel whose
  // bottom edge moves. Null when the card is not inside one.
  _panel() {
    let found = null, a = this;
    while (a && a.nodeType === 1 && a.localName !== 'hui-view' && a !== document.body) {
      const p = a.parentNode;
      a = p && (p.host || p);
      if (a && a.localName === 'ha-card') found = a;
    }
    return found;
  }

  // ---- the state ---------------------------------------------------------

  _update() {
    if (!this._hass || !this._pills) return;
    const self = this;
    // A key of everything this card draws from. Home Assistant pushes a new
    // hass on every state change in the house; repainting on each one is work
    // for nothing.
    const key = this._ids.map(function (id) {
      const s = self._hass.states[id];
      return s ? s.state : '';
    }).join('|') + '#' + (function () {
      const l = self._light && self._hass.states[self._light];
      return l ? l.state + '@' + l.last_changed : '';
    })();
    if (key === this._marks) return;
    this._marks = key;

    this._pills.forEach(function (p) {
      const name = lampEntityName(self._hass, p.scene.entity, p.scene.name);
      if (p.word.textContent !== name) p.word.textContent = name;

      const on = lampSceneActive(self._hass, p.scene.entity, self._light, self._ids);
      p.el.style.background = on
        ? 'rgba(' + self._accent + ',' + LAMP_SCENE.activeFillAlpha + ')'
        : 'transparent';
      p.el.style.borderLeft = on
        ? '2px solid rgb(' + self._accent + ')' : '2px solid transparent';
      p.line.style.fontWeight = on ? LAMP_SCENE.activeWeight : LAMP_SCENE.pillWeight;
      p.line.style.color = on ? LAMP_SCENE.activeColour : LAMP_SCENE.pillColour;
      p.dot.style.display = on ? '' : 'none';
    });
  }
}

customElements.define('lamplight-scenes', LampScenes);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-scenes',
  name: 'Lamplight Scenes',
  description: 'A collapsed list of scenes, with the active one marked.',
  preview: false
});
