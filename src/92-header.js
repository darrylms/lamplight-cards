// lamplight-header. The room header: one 48px line, "[house] > ROOM NAME", on the page
// wallpaper. When a lamp in the room is on, a silver light rises from behind the
// first panel.
//
// Silver Caps, option 18 of design-docs/room_header_rework_options.html (revision 7).
// Chosen by the household on 6 October 2026. Built 6 October 2026. It replaces
// Lit Name (option 7), which drew the word HOME, a room glyph, a hairline and a
// warm halo on the name.
//
// Layout, from the left: the house glyph (mdi:home-outline, 22px) in a 44 x 44px
// box, a 16px chevron, a 10px gap, then the room name in 18px capitals. Only the
// house box is a tap target, and it is 44px tall (Law 09.1). The chevron and the
// room name are deliberately inert (master_design.html section 15). The house
// names the destination and matches the Home tab of the tab bar.
//
// It is NOT a panel and draws no ground. It sits on the page wallpaper, and it
// uses no ha-card, so the theme's ha-card rules (background, backdrop blur)
// have nothing to reach and need no !important override.
//
// The typography is the view's own, deliberately: no font-family is set. The
// button-cards it replaced inherited the system font stack. Measured 22 September
// 2026. Setting Roboto here would change the header's letterforms.
//
// Configuration:
//   name    required. The room name. Drawn uppercase
//   back    { label, navigation_path, icon }. The house link. Omitted, no link
//           and the name starts at the left edge. `icon` defaults to
//           mdi:home-outline. `label` is not drawn: it is the accessible name
//           (default "Home"). The key `icon` of the card itself is ignored
//   lights  optional. A list of light entities. Each entry is a string (the
//           light), or { light, members } with the same meaning as in
//           lamplight-light. Omitted, the header draws no light, so the card holds
//           no household entity.
//   hide_ha_title optional. true hides the view title in Home Assistant's own
//           toolbar, which repeats the room name. See src/25-ha-title.js
//
// Light rules. The header is on or off. It is lit when any member of any entry
// is `on`. Brightness, colour and the number of lit entries have no effect. The
// light is one fixed silver, never the accent and never a lamp's colour
// (Law 07.1), at a peak of 0.12. It is one pool, centred on the room name, in a
// layer that reaches 60px down behind the first panel. The panel paints over the
// lower part, so the source is hidden and no hard edge of light shows in the gap
// or at the panel's edge. The text colours never change.
//
// A change of state fades the pool over 400ms. There is no fade on the first
// paint, on a view change or on a rebuild of the card. There is no fade when the
// user prefers reduced motion.

// One fixed silver. OKLCH L 0.924, C 0.012, h 265.
const LAMP_HEADER_LIGHT = [226, 230, 238];
const LAMP_HEADER_FADE = '400ms ease';
// The layer is 8px wider than the row on each side. On a wide screen its left
// edge is inside the page, and the pool still has alpha there, so the edge shows
// as a step. A mask fades each end of the layer over 40px. On a phone the screen
// edge hides the layer's ends, and the mask changes nothing the eye can see.
const LAMP_HEADER_EDGE = 'linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)';

// The members of one `lights` entry: its own list, else the light's entity_id
// attribute, else the light itself.
function lampHeaderMembers(states, e) {
  const id = typeof e === 'string' ? e : e.light;
  if (typeof e === 'object' && Array.isArray(e.members) && e.members.length) return e.members;
  const s = states[id];
  const m = s && s.attributes && s.attributes.entity_id;
  return (Array.isArray(m) && m.length) ? m : [id];
}

// True when any member of any entry is on. An entity that does not exist is off.
function lampHeaderLit(hass, entries) {
  const states = (hass && hass.states) || {};
  return (entries || []).some(function (e) {
    return lampHeaderMembers(states, e).some(function (x) {
      return states[x] && states[x].state === 'on';
    });
  });
}

// The `background` of the light layer: one ellipse `rx` px by 73px, centred at
// `cx` px across and 66px down a layer 118px tall (the 48px row, 10px above it
// and 60px below it). Fades to rgba(...,0), never to transparent.
function lampHeaderPool(cx, rx) {
  const c = LAMP_HEADER_LIGHT.join(',');
  return 'radial-gradient(ellipse ' + lampRound(rx, 0) + 'px 73px at ' + lampRound(cx, 1) + 'px 66px, ' +
    'rgba(' + c + ',0.12) 0%, rgba(' + c + ',0.05) 38%, ' +
    'rgba(' + c + ',0.014) 70%, rgba(' + c + ',0) 100%)';
}

class LampHeader extends HTMLElement {

  static getStubConfig() {
    return { name: 'Lounge', back: { navigation_path: '/' } };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (!config.name) throw new Error('lamplight-header needs a `name`');
    this._config = config;
    this._render();
  }

  // A change of state sets the pool opacity only. It never rebuilds
  // the shadow DOM, so the back link keeps its focus and ripple.
  set hass(hass) {
    this._hass = hass;
    this._paint();
  }

  connectedCallback() {
    if (this._ro && this._name) this._ro.observe(this._name);
    lampHaTitle(this, lampHaTitleWanted(this));
  }

  disconnectedCallback() {
    if (this._ro) this._ro.disconnect();
    lampHaTitle(this, false);
  }

  getCardSize() { return 1; }

  _entries() {
    return Array.isArray(this._config.lights) ? this._config.lights : [];
  }

  // The pool is centred on the room name. It is 1.6 of the name's width, 190px at
  // least. The layer starts 8px left of the row, so cx adds 8px.
  _measure() {
    if (!this._pool || !this._name || !this._row || !this._entries().length) return;
    const r = this._row.getBoundingClientRect();
    const n = this._name.getBoundingClientRect();
    if (!n.width) return;
    this._pool.style.background = lampHeaderPool(n.left - r.left + 8 + n.width / 2,
      Math.max(190, 1.6 * n.width));
  }

  _paint() {
    if (!this._pool || !this._hass) return;
    const entries = this._entries();
    if (!entries.length) return;
    const states = this._hass.states || {};
    const key = entries.map(function (e) {
      const id = typeof e === 'string' ? e : e.light;
      return [id].concat(lampHeaderMembers(states, e)).map(function (x) {
        return states[x] ? states[x].state : '-';
      }).join(',');
    }).join(';');
    if (key !== this._key) {
      this._key = key;
      const lit = lampHeaderLit(this._hass, entries);
      this._pool.style.opacity = lit ? '1' : '0';
    }
    this._arm();
  }

  // The first paint with a real `hass` has no fade. The transitions turn on two
  // frames later. A rebuilt DOM starts again with the transitions off.
  _arm() {
    if (this._armed || this._arming) return;
    this._arming = true;
    const pool = this._pool;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this._arming = false;
      if (this._pool !== pool) return;
      this._armed = true;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      pool.style.transition = 'opacity ' + LAMP_HEADER_FADE;
    }));
  }

  _render() {
    if (this._ro) this._ro.disconnect();
    this._armed = false;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '';
    this.style.display = 'block';
    const c = this._config;
    const back = c.back && c.back.navigation_path ? c.back : null;

    // 48px row. The foreground line is 47px, the strut of the probe.
    const row = document.createElement('div');
    row.style.cssText = 'position:relative;height:48px;padding:0 16px;box-sizing:border-box;' +
      'overflow:visible;line-height:normal';
    this._row = row;

    // The light layer reaches 10px above the row and 60px below it, behind the
    // first panel. z-index:-1 puts it under the foreground line.
    const pool = document.createElement('div');
    pool.setAttribute('aria-hidden', 'true');
    pool.style.cssText = 'position:absolute;pointer-events:none;left:-8px;right:-8px;top:-10px;' +
      'bottom:-60px;z-index:-1;background:none;opacity:0;transition:none;' +
      '-webkit-mask-image:' + LAMP_HEADER_EDGE + ';mask-image:' + LAMP_HEADER_EDGE;
    row.appendChild(pool);
    this._pool = pool;

    const line = document.createElement('div');
    line.style.cssText = 'position:relative;z-index:1;height:47px;display:flex;align-items:center';

    if (back) {
      // The house box is the only tap target: 44 x 44px, with a negative left
      // margin so the glyph sits 16px from the screen edge. Proved with elementFromPoint.
      const b = document.createElement('div');
      b.style.cssText = 'position:relative;display:inline-flex;align-items:center;justify-content:center;' +
        'width:44px;height:44px;flex:none;margin-left:-11px;cursor:pointer;color:rgb(' + LAMP_MEANINGS.page.ink + ')';
      b.setAttribute('role', 'link');
      b.setAttribute('tabindex', '0');
      b.setAttribute('aria-label', back.label || 'Home');
      b.setAttribute('data-hit', '');
      // Home Assistant's own press feedback. It draws nothing at rest.
      const rip = document.createElement('ha-ripple');
      rip.style.borderRadius = '10px';
      b.appendChild(rip);
      // line-height:0 is section 08's icon Law.
      const i = document.createElement('ha-icon');
      i.setAttribute('icon', back.icon || 'mdi:home-outline');
      i.style.cssText = '--mdc-icon-size:22px;width:22px;height:22px;display:inline-block;line-height:0';
      b.appendChild(i);

      const go = () => {
        history.pushState(null, '', back.navigation_path);
        this.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }));
      };
      b.addEventListener('click', go);
      b.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
      line.appendChild(b);

      const chev = document.createElement('ha-icon');
      chev.setAttribute('icon', 'mdi:chevron-right');
      chev.setAttribute('aria-hidden', 'true');
      chev.style.cssText = '--mdc-icon-size:16px;width:16px;height:16px;display:inline-block;' +
        'line-height:0;flex:none;color:rgba(' + LAMP_MEANINGS.page.ink + ',0.55)';
      line.appendChild(chev);
      const gap = document.createElement('span');
      gap.style.cssText = 'width:10px;flex:none';
      line.appendChild(gap);
    }

    const name = document.createElement('span');
    name.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;' +
      'font-family:var(--primary-font-family, Roboto, Noto, sans-serif);' +
      'font-size:var(--lamplight-t-room);font-weight:500;letter-spacing:0.10em;text-transform:uppercase;' +
      'color:var(--lamplight-ink-strong)';
    name.textContent = c.name;
    line.appendChild(name);
    row.appendChild(line);
    this._name = name;

    this.shadowRoot.appendChild(row);
    // The width of the name changes when the web font loads, so measure on
    // every change of its size.
    if (this._entries().length && typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this._measure());
      if (this.isConnected) this._ro.observe(name);
    }
    // A rebuilt DOM is unpainted. Forget the key so the lights draw again.
    this._key = null;
    this._paint();
  }
}

customElements.define('lamplight-header', LampHeader);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-header',
  name: 'Lamplight Room Header',
  description: 'A home glyph and the room name, above the first panel. ' +
    'With `lights:`, a silver light rises from behind the first panel when a lamp in the room is on.',
  preview: false
});
