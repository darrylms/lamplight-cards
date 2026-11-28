// lamplight-popup. The Lamplight pop-up that replaces bubble-card's `pop-up`.
//
// WHAT THIS REPLACES
// The bubble-card `card_type: pop-up` wrapper on all 12 pop-ups. bubble-card stays installed for
// the 7 light sliders. browser_mod was rejected. Portability is a side benefit, not the reason.
// Build brief: lamplight-cards/popup_build_brief.md. Design document: design-docs/
// popup_header_options.html, option 7 ("the Poster, lit": the lit glyph over a quiet background),
// with the plug sheets' smart-plug glyph from option 12. Law 02.2 has an exception for the pop-up
// header (master design 8.0): the header may be decorative and need not encode state.
//
// WHY OPTION 7 REPLACED OPTION 12, 27 SEPTEMBER 2026
// Option 12's light stopped in a hard line at 250px. The line cut through the body text on the
// Day, Climate and Plug sheets, and more so on the telephone, which draws text about 15% larger.
// Option 7's gradients are gone by about 150px. A mask fades the grain tile from 150px to 220px,
// so no edge falls on the body.
//
// THE LINE GLYPH, 27 SEPTEMBER 2026
// The household found the 220px cropped glyph too large and the MDI shapes unclear (a thermometer
// with no bulb, a battery that read as a slab). They chose option 3 of design-docs/
// popup_sheets_rework_options.html: a 165px outline drawn by Lamplight (93-popup-glyphs.js), in the
// room accent, cropped only a little at the right edge. The fade starts at 72% of its height, so
// the base of each object stays. The Day Card's weather glyph is drawn in line as well. An MDI
// icon still works, at the same size, for another household.
//
// A plug body with `icon_in_header` sends its glyph state up (`lamp-glyph-state`); the header
// dims the device's parts as the body did.
//
// THE HASH CONTRACT DOES NOT CHANGE
// Each pop-up keeps its `#hash`, so no opener elsewhere on the dashboard changes. The card opens
// when `location.hash` equals its configured hash, and closes by `history.back()` for a navigated
// open, or by removing the hash in place for a deep link (a hash present when the card connects).
//
// THE HEADER SCROLLS AWAY
// One scroller holds the header and the body, so a short body does not carry a 128px header for
// nothing. Only the grab bar and the close control stay fixed at the top of the sheet.
//
// PROVEN LIVE, 26 SEPTEMBER 2026
// test/probe-lamp-popup.js passed 22 of 22 behaviour checks at 375px: open on hash, above the
// toolbar, focus into the sheet, page scroll lock, back button, swipe on the header, swipe on an
// unscrolled body, a short swipe snaps back, Escape, the close control, a backdrop tap, a clean
// back stack, a deep link that opens and closes in place. This card copies that logic, with its
// two fixes: the body's scrollTop resets to 0 on each open, and close() is guarded by a
// `_closing` flag so a second close cannot call history.back() twice.
//
// test/probe-popup-headers.js drew option 7 (this header) over a real body card; its CSS and
// glyph code are the reference for the layout below.
//
// THE CLOSE FALLBACK, 31 OCTOBER 2026 (0.53.2-dev)
// _hide() hid the backdrop (`.wrap`) only on `transitionend`. A background tab runs no transition,
// so a pop-up closed by `history.back()` there left its 55% black backdrop over the view, and the
// backdrop blocked every tap. Seen on #climate-lounge. Now a hidden tab hides the wrap at once, and
// a 500ms timer runs the same end step if `transitionend` does not come. A reopen cancels both.
// Proved live on #climate-lounge: a normal close, a close with no transition, a reopen
// at 200ms into the close, and a close with `visibilityState` "hidden".
//
// EDIT MODE
// Home Assistant does not forward edit mode to a custom card element. It sets `.editMode` on the
// `hui-card` that wraps the card, in the light DOM, so `this.closest('hui-card').editMode` reads
// it. Proved live, 26 September 2026, by calling the dashboard's own `_enableEditMode()` and
// reading the wrapper's property before and after. The card checks this on every `hass` push and
// in `connectedCallback`, and shows a placeholder row instead of the overlay while it is true.
//
// Configuration:
//   hash              the pop-up's own #hash, with the '#'. Required
//   title             the sheet's title. A string, or a template holding {{ }}. Required
//   heading           the small word above the title. A string, or a template. Optional
//   icon              the header glyph. `lamp:<name>` for a Lamplight drawing (battery, window,
//                     air, thermometer, socket, access-point, modem, string-lights), an MDI icon,
//                     `lamp-weather:<entity>` for the weather glyph, or `lamp-arc:<sun entity>` for
//                     the Day's Arc (93-popup-glyphs.js; #today since 27 Oct 2026)
//   accent            "r,g,b" | hex | rgb(). The accent of the panel shell that opens this pop-up
//   header_art        `live` draws a live header from the first body card (28 Oct 2026, design-docs/
//                     popup_hero_options.html): a frost crystal or a sun on a climate sheet (15 Nov 2026), the lit plug on a plug sheet (8 Nov 2026), a 24 h trace on a purifier sheet, a
//                     skyline on lamplight-batteries, sky panes on lamplight-windows-detail with `windows:`,
//                     sunlight and moonlight on lamplight-windows-detail with `rooms:`. `icon` stays: it gives
//                     the fallback object when the data does not come. Absent: the header as before
//   header_images     { day: url, night: url }, or false for the drawings. Default: the plates in dist/, beside
//                     lamplight.js. They paint the sunlight hero (6 Nov 2026, design-docs/windows_hero_options.html)
//                     and the frames of the sky panes (7 Nov 2026, design-docs/windows_room_frame_options.html).
//                     Moon phase, open casement, sky and sun colour stay live. A plate that does not load leaves
//                     the drawing
//   weather           the weather entity for the sky panes. Default: the first weather.* entity
//   cards             the body: the same card list the bubble-card pop-up held
//   close_by_clicking_outside   default true
//   width_desktop     default "540px"

// THE HERO IS TURNED DOWN, 2 OCTOBER 2026
// The household found the glyph too saturated on the room Climate sheets and on #today. The room
// accents are vivid for small panels; at 165px the full accent became a large, pure field. Option 2
// of design-docs/popup_hero_chroma_options.html: the three stops, the halo and the wash use 62% of
// the accent's OKLCH chroma, and the halo is 35%, not 50%. Games Room stays the strongest; if it
// is still too strong, lower this factor to 0.55.
const LAMP_HERO_CHROMA = 0.62;

class LampPopup extends HTMLElement {

  static getStubConfig() {
    return { hash: '#example', title: 'Title', icon: 'mdi:window-closed-variant',
      accent: '255,64,160', cards: [] };
  }

  setConfig(config) {
    if (!config) throw new Error('no configuration');
    if (!config.hash) throw new Error('lamplight-popup needs a `hash`');
    if (!config.title) throw new Error('lamplight-popup needs a `title`');
    this._config = config;
    this._hash = config.hash;
    this._closeOutside = config.close_by_clicking_outside !== false;
    this._widthDesktop = config.width_desktop || '540px';
    this._accent = lampColour(config.accent || '255,64,160', 'deep');
    this._core = lampCore(this._accent);
    this._ember = lampEmber(this._accent);
    // The hero glyph, its halo and its wash use the accent at 62% of its OKLCH chroma
    // (option 2 of design-docs/popup_hero_chroma_options.html, 2 Oct 2026). The eyebrow keeps
    // the full core.
    this._heroAccent = lampTemper(this._accent, LAMP_HERO_CHROMA);
    this._heroCore = lampTemper(this._core, LAMP_HERO_CHROMA);
    this._heroEmber = lampTemper(this._ember, LAMP_HERO_CHROMA);
    this._cardsConfig = Array.isArray(config.cards) ? config.cards : [];

    const icon = config.icon || '';
    this._weatherEntity = icon.indexOf('lamp-weather:') === 0 ? icon.slice('lamp-weather:'.length) : null;
    const lamp = icon.indexOf('lamp:') === 0 ? icon.slice('lamp:'.length) : null;
    this._lampIcon = lamp && LAMP_POPUP_GLYPHS[lamp] ? lamp : null;
    this._arcEntity = icon.indexOf('lamp-arc:') === 0 ? icon.slice('lamp-arc:'.length) : null;
    this._mdiIcon = this._weatherEntity || this._arcEntity || lamp ? null : icon;
    this._wxKey = null;
    this._arcKey = null;
    if (config.header_art !== undefined && config.header_art !== 'live') throw new Error("header_art must be 'live'");
    this._hero = config.header_art === 'live' && !this._arcEntity && !this._weatherEntity ? this._heroForm() : null;
    const hp = config.header_images;
    if (hp !== undefined && hp !== false && !(hp && typeof hp.day === 'string' && typeof hp.night === 'string')) throw new Error('header_images needs `day` and `night`, or false');
    const plateBase = LAMP_SKY_BASE + 'lamplight-windows/' + LAMP_HERO_PLATE_SET + '/';
    const plates = hp === false ? null : hp || { day: plateBase + 'windows-day.webp', night: plateBase + 'windows-night.webp' };
    this._heroPlates = this._hero && (this._hero.form === 'sun' || this._hero.form === 'panes') ? plates : null;
    // Load both now, so that the first opening of the sheet does not show the drawing first.
    if (this._heroPlates) { lampHeroImage(this._heroPlates.day); lampHeroImage(this._heroPlates.night); }
    // The House picture with the weather (option 6d, see LAMP_HERO_WX in 93-popup-glyphs.js): only with the cards' own
    // plates. Header images of one's own keep the plain day and night picture.
    this._heroWx = this._hero && this._hero.form === 'sun' && hp === undefined ? LAMP_SKY_BASE + 'lamplight-windows/' + LAMP_HERO_WX_SET + '/' : null;
    if (this._heroWx) ['room-day-sun.webp', 'room-day-grey.webp', 'room-night-sun.webp', 'room-night-grey.webp'].forEach((n) => lampHeroImage(this._heroWx + n));
    this._heroKey = null;
    this._heroData = null;
    this._heroBusy = false;
    this._heroWait = false;
    this._heroGilded = false;
    this._glyphState = null;

    this._eyebrowRaw = config.heading || '';
    this._titleRaw = config.title;
    this._eyebrowTpl = typeof this._eyebrowRaw === 'string' && this._eyebrowRaw.indexOf('{{') >= 0;
    this._titleTpl = typeof this._titleRaw === 'string' && this._titleRaw.indexOf('{{') >= 0;
    this._eyebrowText = this._eyebrowTpl ? '' : this._eyebrowRaw;
    this._titleText = this._titleTpl ? '' : this._titleRaw;

    this._open = false;
    this._closing = false;
    this._deepLink = false;
    this._editMode = null;
    this._builtCards = false;
    this._cardEls = [];
    this._gradId = 'lpg' + Math.random().toString(36).slice(2);

    this._onLoc = () => this._sync(false);
    this._onGlyph = (e) => {
      this._glyphState = e.detail || {};
      this._applyGlyphState();
      if (this._hero && this._hero.form === 'plug' && this._open) this._paintHero();
    };
    this._onKey = (e) => { if (e.key === 'Escape' && this._open) { e.preventDefault(); this.close('escape'); } };

    this._render();
  }

  getCardSize() { return 0; }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this._checkEditMode();
    if (first) {
      if (this._eyebrowTpl) this._startTemplate('eyebrow');
      if (this._titleTpl) this._startTemplate('title');
    }
    if (this._weatherEntity) this._paintWeatherGlyph();
    if (this._arcEntity && this._open) this._paintArc();
    if (this._hero && this._open) this._paintHero();
    this._cardEls.forEach((el) => { el.hass = hass; });
  }

  connectedCallback() {
    window.addEventListener('location-changed', this._onLoc);
    window.addEventListener('popstate', this._onLoc);
    window.addEventListener('keydown', this._onKey, true);
    this._checkEditMode();
    if (!this._editMode) this._sync(true);
    // Re-arm the title's watcher (2 Nov 2026). disconnectedCallback drops it, and HA detaches and
    // re-attaches cards while it draws a view; without this a sheet that changed width (a telephone
    // turned with the sheet open) kept the arc or the hero at its old width until it was opened again.
    if (this.$hdrContent) this._watchTitle();
  }

  disconnectedCallback() {
    window.removeEventListener('location-changed', this._onLoc);
    window.removeEventListener('popstate', this._onLoc);
    window.removeEventListener('keydown', this._onKey, true);
    if (this._open) this._unlock();
    if (this._eyebrowUnsub) { this._eyebrowUnsub(); this._eyebrowUnsub = null; }
    if (this._titleUnsub) { this._titleUnsub(); this._titleUnsub = null; }
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }

  // ---- edit mode -----------------------------------------------------------

  _checkEditMode() {
    const host = this.closest('hui-card');
    const editMode = !!(host && host.editMode);
    if (editMode === this._editMode) return;
    this._editMode = editMode;
    this.$edit.style.display = editMode ? 'flex' : 'none';
    if (editMode && this._open) this._hide();
  }

  // ---- templates -------------------------------------------------------------

  _startTemplate(key) {
    if (!this._hass) return;
    const raw = key === 'eyebrow' ? this._eyebrowRaw : this._titleRaw;
    let killed = false;
    this._hass.connection.subscribeMessage((msg) => {
      const val = msg && msg.result != null ? String(msg.result) : '';
      if (key === 'eyebrow') this._eyebrowText = val; else this._titleText = val;
      this._paintHeaderText();
    }, { type: 'render_template', template: raw }).then((off) => {
      if (killed) { off(); return; }
      if (key === 'eyebrow') this._eyebrowUnsub = off; else this._titleUnsub = off;
    }).catch(() => {});
    if (key === 'eyebrow') this._eyebrowUnsub = () => { killed = true; };
    else this._titleUnsub = () => { killed = true; };
  }

  // ---- open / close ----------------------------------------------------------

  _sync(atConnect) {
    if (this._editMode) return;
    const want = location.hash === this._hash;
    if (want && !this._open) this._show(atConnect);
    else if (!want && this._open) this._hide();
  }

  _show(deepLink) {
    this._open = true;
    this._closing = false;
    this._deepLink = deepLink;
    this._lock();
    this._cancelHideEnd();
    this.$sheet.classList.add('drag');
    this.$sheet.style.transform = 'translateY(100%)';
    this.$wrap.hidden = false;
    this.$scroller.scrollTop = 0;
    this._prevFocus = this._deepActive();
    this.$sheet.focus({ preventScroll: true });
    if (!this._builtCards) this._buildCards();
    if (this._arcEntity) this._paintArc();
    this._plugShown = null;                             // nothing moves when the sheet opens
    if (this._hero) { this._heroFetch(); this._paintHero(); }
    this.$sheet.offsetHeight;
    this.$sheet.classList.remove('drag');
    this.$sheet.style.transform = '';
  }

  _hide() {
    this._open = false;
    this._unlock();
    if (this._prevFocus && this._prevFocus.focus) this._prevFocus.focus({ preventScroll: true });
    this.$sheet.style.transform = 'translateY(100%)';
    const sheet = this.$sheet, wrap = this.$wrap;
    const end = () => {
      this._cancelHideEnd();
      wrap.hidden = true;
      sheet.style.transform = '';
    };
    this._cancelHideEnd();
    // A hidden tab runs no transition, so there is nothing to show. Hide now.
    if (document.visibilityState === 'hidden') { end(); return; }
    this._hideEnd = (e) => { if (e.propertyName === 'transform') end(); };
    sheet.addEventListener('transitionend', this._hideEnd);
    // The fallback. The transition is 340ms; the timer runs the same end step once at 500ms.
    this._hideTimer = setTimeout(end, 500);
  }

  // A reopen calls this too, so a late transitionend or timer cannot hide the reopened sheet.
  _cancelHideEnd() {
    if (this._hideEnd) { this.$sheet.removeEventListener('transitionend', this._hideEnd); this._hideEnd = null; }
    if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
  }

  close(via) {
    if (this._closing || !this._open) return;
    this._closing = true;
    if (!this._deepLink) { history.back(); return; }
    history.replaceState(history.state, '', location.pathname + location.search);
    window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: true } }));
  }

  _lock() {
    const h = document.documentElement;
    this._saved = { ov: h.style.overflow, y: window.scrollY };
    h.style.overflow = 'hidden';
  }

  _unlock() {
    document.documentElement.style.overflow = this._saved ? this._saved.ov : '';
    if (this._saved) window.scrollTo(0, this._saved.y);
  }

  _deepActive() {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    return a;
  }

  // ---- the body cards --------------------------------------------------------

  async _buildCards() {
    this._builtCards = true;
    const helpers = await window.loadCardHelpers();
    this._cardsConfig.forEach((cfg) => {
      const el = helpers.createCardElement(cfg);
      if (this._hass) el.hass = this._hass;
      this._cardEls.push(el);
      this.$body.appendChild(el);
    });
  }

  // ---- the header --------------------------------------------------------

  async _paintMdiGlyph() {
    const probe = document.createElement('ha-icon');
    probe.icon = this._mdiIcon;
    probe.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(probe);
    let d = '';
    for (let i = 0; i < 40 && !d; i++) {
      await new Promise((r) => setTimeout(r, 50));
      const p = probe.shadowRoot && probe.shadowRoot.querySelector('ha-svg-icon');
      const path = p && p.shadowRoot && p.shadowRoot.querySelector('path');
      d = path ? path.getAttribute('d') : '';
    }
    probe.remove();
    if (!d) return;
    this.$gw.innerHTML = '<svg viewBox="0 0 24 24">' + this._gradDefs() +
      '<path d="' + lampEsc(d) + '" fill="url(#' + this._gradId + ')"/></svg>';
  }

  // The accent gradient, lit from the top right: core, accent, ember.
  _gradDefs() {
    return '<defs><linearGradient id="' + this._gradId + '" x1="1" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="rgb(' + this._heroCore + ')"/>' +
      '<stop offset="0.45" stop-color="rgb(' + this._heroAccent + ')"/>' +
      '<stop offset="1" stop-color="rgb(' + this._heroEmber + ')" stop-opacity="0.85"/>' +
      '</linearGradient></defs>';
  }

  _paintLampGlyph() {
    const g = LAMP_POPUP_GLYPHS[this._lampIcon];
    this.$gw.innerHTML = '<svg viewBox="0 0 100 100">' + this._gradDefs() +
      '<g transform="translate(' + (g.shift || 0) + ' 0)">' + g.draw('url(#' + this._gradId + ')') + '</g></svg>';
  }

  // #today only. Drawn in line from the weather glyphs' own grid (93-popup-glyphs.js), and drawn
  // again only when the picture changes. "The condition the Day Card leads with" needs the Day Card's own forecast
  // subscription and window rule (src/95-day.js, lampDayCompute); reaching that from a header
  // that only holds an entity id is not proven live yet, so this reads the weather entity's own
  // state instead, with night read from sun.sun. Tell the household this is a simplification.
  _paintWeatherGlyph() {
    if (!this._hass) return;
    const wx = this._hass.states[this._weatherEntity];
    if (!wx) return;
    const sun = this._hass.states['sun.sun'];
    const night = !!(sun && sun.state === 'below_horizon');
    const key = lampGlyphKey(wx.state, night);
    if (key === this._wxKey) return;
    this._wxKey = key;
    this.$gw.innerHTML = '<svg viewBox="0 0 100 100" data-glyph="' + lampEsc(key) + '">' + this._gradDefs() +
      '<g transform="translate(-6 0) scale(4.1667)">' +
      lampPopupWeatherLine(key, 'url(#' + this._gradId + ')', this._gradId + 'm') + '</g></svg>';
  }

  // #today. The Day's Arc (93-popup-glyphs.js). Drawn only while the sheet is open, because it needs
  // the sheet's width, and again only when the picture changes: the disc moves about 1/360 of the
  // period between two `hass` pushes at most. Night is read from the sun entity; the moon's phase
  // from the date (lampPlateMoon, 68b-plates.js), as the Overview weather card reads it.
  _paintArc() {
    if (!this._hass || !this.$sheet) return;
    const sun = this._hass.states[this._arcEntity];
    const W = this.$sheet.clientWidth;
    if (!sun || !W) return;
    const night = sun.state === 'below_horizon';
    const rise = Date.parse(sun.attributes.next_rising), set = Date.parse(sun.attributes.next_setting);
    if (!(rise && set)) return;
    // The period that holds now. The last sunrise or sunset is taken as the next one less a day;
    // in late October that is about 3 minutes early, under 1% of the arc.
    const now = Date.now(), DAY = 86400000;
    const frac = night ? (now - (set - DAY)) / (rise - (set - DAY)) : (now - (rise - DAY)) / (set - (rise - DAY));
    const moon = lampPlateMoon(new Date(now));
    // The left foot stands 12px after the title's ink, and never left of W - 161. _fitTitle makes the
    // title smaller first. When the 20px title leaves less than LAMP_ARC_MIN, the header has no arc.
    const left = Math.max(W - 161, Math.round(this._titleEnd()) + 12);
    const room = W - 19 - left >= LAMP_ARC_MIN;
    const key = [W, left, room ? 1 : 0, night ? 1 : 0, Math.round(frac * 360), Math.round(moon.phase * 40), moon.waning ? 1 : 0].join('|');
    if (key === this._arcKey) return;
    this._arcKey = key;
    this.$gw.classList.add('arc');
    if (!room) { this.$gw.innerHTML = ''; return; }
    const a = lampPopupArc({ W: W, left: left, frac: frac, night: night, phase: moon.phase, waning: moon.waning, id: this._gradId });
    this.$gw.classList.add('arc');
    this.$gw.innerHTML = a.svg;
    // The grain and the darkening from the top, as on every sheet. No wash of the light's colour: the
    // sun's own glow lights the header now (option 5g, 2 Nov 2026).
    this.$glow.style.background = "url('" + LAMP_GRAIN + "'), linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 70%)";
  }

  // A plug body tells the header its state, and the header dims the object. A live trace is not
  // dimmed: the trace shows the last day, and a plug that is off now still drew earlier.
  _applyGlyphState() {
    const d = this._hero && !this._heroGilded ? {} : (this._glyphState || {});
    this.$gw.dataset.state = d.state || '';
    this.$gw.toggleAttribute('data-full', !!d.full);
  }

  // ---- the live hero (header_art: live) ------------------------------------------------------------

  // The form, from the type of the first body card. null when the card gives none: the header is then
  // as it is without `header_art`.
  _heroForm() {
    const c = this._cardsConfig[0] || {};
    const t = String(c.type || '').replace('custom:', '');
    if (t === 'lamplight-climate-detail' && c.temperature) return { form: 'comfort', eid: c.temperature, hum: c.humidity || null };
    // The plug sheets draw the plug itself, lit by its state (8 Nov 2026, design-docs/plug_hero_options.html,
    // option 4). Until then they drew the 24-hour trace, as the purifier still does.
    if (t === 'lamplight-plug-detail' && c.entity) return { form: 'plug', eid: c.entity };
    // The purifier sheet draws the painted purifier, lit by its mode (8 Nov 2026, option 2d of
    // design-docs/popup_hero_harmony_options.html). Without a fan entity it keeps the trace of its air sensor.
    if (t === 'lamplight-purifier-detail' && c.entity) return { form: 'purifier', eid: c.entity };
    if (t === 'lamplight-purifier-detail' && c.air_sensor) return { form: 'trace', kind: 'purifier', eid: c.air_sensor };
    if (t === 'lamplight-batteries') return { form: 'skyline' };
    if (t === 'lamplight-windows-detail' && Array.isArray(c.windows) && c.windows.length) return { form: 'panes' };
    if (t === 'lamplight-windows-detail' && Array.isArray(c.rooms) && c.rooms.length) return { form: 'sun' };
    return null;
  }

  // The last 24 hours of the trace, fetched when the sheet opens and kept for 5 minutes (a failed fetch, 1 minute).
  async _heroFetch() {
    const h = this._hero;
    if (!h || h.form !== 'trace' || !this._hass || this._heroBusy) return;
    const d = this._heroData, now = Date.now();
    if (d && now - d.at < (d.series ? 300000 : 60000)) return;
    this._heroBusy = true;
    let series = null;
    try { series = await lampHeroSeries(this._hass, h.eid, h.kind === 'purifier' ? 'hour' : '5minute', now); } catch (e) { series = null; }
    this._heroBusy = false;
    this._heroData = { at: now, series: series };
    this._heroKey = null;
    if (this._open) this._paintHero();
  }

  // Draws the form across the whole header, as the Day's Arc is drawn: only while the sheet is open,
  // because it needs the sheet's width, and again only when its signature changes. The zone starts
  // 12px after the title's ink and never left of W - 161; _fitTitle makes the title smaller first.
  // When the data does not come, the sheet's own object is drawn instead (the gilded object).
  _paintHero() {
    const h = this._hero;
    if (!h || !this._hass || !this.$sheet) return;
    const W = this.$sheet.clientWidth;
    if (!W) return;
    const hass = this._hass, end = Math.round(this._titleEnd()) + 12, left = Math.max(W - 161, end);
    const room = h.form === 'panes' ? end <= W - 161 : h.form === 'comfort' ? end <= W - LAMP_FROST_SUN_ROOM
      : h.form === 'plug' ? end <= W - LAMP_PLUG_ROOM + LAMP_PLUG_SLIDE : h.form === 'purifier' ? end <= W - LAMP_PURIFIER_ROOM
      : W - 19 - left >= LAMP_ARC_MIN;
    let smoke = false;
    const o = { W: W, left: left, id: this._gradId, acc: this._heroAccent, core: this._heroCore, ember: this._heroEmber };
    let key, make = null;
    const gilded = () => {
      const g = this._lampIcon ? LAMP_POPUP_GLYPHS[this._lampIcon] : null;
      if (!g) { key = [W, 'none'].join('|'); return; }
      key = [W, left, 'g', this._lampIcon].join('|');
      make = () => lampHeroGilded(Object.assign(o, { glyph: g }));
    };
    if (!room) key = [W, left, 'room0'].join('|');
    else if (h.form === 'comfort') {
      // Frost or Sun, lit as the #today sun (header F6 of design-docs/climate_quiet_options.html, 15 Nov 2026).
      // Until then the temperature arc (option 9a, 8 Nov 2026), which needed the last 24 hours.
      const c = this._cardsConfig[0];
      const num = (id) => { const s = id && hass.states[id]; const v = s ? parseFloat(s.state) : NaN; return isNaN(v) ? null : v; };
      const temp = num(h.eid), hum = num(h.hum);
      const damp = Array.isArray(c.damp_range) && c.damp_range.length === 2 ? c.damp_range : LAMP_DEFAULTS['climate-detail'].damp_range;
      if (temp === null) gilded();
      else {
        // The shape changes only LAMP_FROST_SUN.margin past the middle, so a room that sits there keeps one.
        const X = LAMP_FROST_SUN.mid, m = LAMP_FROST_SUN.margin;
        this._frostShape = temp >= X + m ? 'sun' : temp < X - m ? 'frost' : (this._frostShape || (temp >= X ? 'sun' : 'frost'));
        const band = hum === null ? 0 : lampComfortDamp(hum, damp).band, shape = this._frostShape;
        key = [W, 'frostsun', temp.toFixed(1), shape, band].join('|');
        make = () => lampHeroFrostSun(Object.assign(o, { temp: temp, shape: shape, band: band }));
      }
    } else if (h.form === 'plug') {
      // The state comes from the plug body (Rule B); until it does, from the switch alone.
      const sw = hass.states[h.eid];
      const fall = !sw || sw.state === 'unavailable' || sw.state === 'unknown' ? 'gone' : sw.state === 'on' ? 'active' : 'off';
      const state = (this._glyphState && this._glyphState.hero) || fall;
      if (!this._onPlugLight) this._onPlugLight = () => { this._heroKey = null; if (this._open) this._paintHero(); };
      const which = state === 'active' ? 'glow' : state === 'idle' ? 'idle' : null;
      // The plug's light is one amber in every room, not the room accent (93d-plug.js, THE COLOUR).
      const amber = LAMP_PLUG_HERO.amber;
      const light = which ? lampPlugLight(amber, which, this._onPlugLight) : null;
      if (which && !light) return;                      // the light is being made
      // A change while the sheet is open fades the old light out and the new one in.
      const prev = this._plugShown;
      const from = prev && prev.state !== state ? { light: prev.light } : null;
      // The plug slides right, under the close button, as far as the title needs (up to LAMP_PLUG_SLIDE).
      const shift = Math.max(0, Math.min(LAMP_PLUG_SLIDE, end - (W - LAMP_PLUG_ROOM)));
      smoke = shift > LAMP_PLUG_SMOKE_AT;
      key = [W, 'plug', state, amber, light ? 1 : 0, shift].join('|');
      make = () => {
        this._plugShown = { state: state, light: light };
        return lampHeroPlug(Object.assign(o, { acc: amber, state: state, light: light, from: from, shift: shift }));
      };
    } else if (h.form === 'purifier') {
      const s = hass.states[h.eid];
      const state = !s || s.state === 'unavailable' || s.state === 'unknown' ? 'gone' : s.state !== 'on' ? 'off'
        : (s.attributes.preset_mode === 'sleep' ? 'quiet' : 'working');
      if (!this._onPlugLight) this._onPlugLight = () => { this._heroKey = null; if (this._open) this._paintHero(); };
      const which = state === 'working' ? 'glow' : state === 'quiet' ? 'quiet' : null;
      const light = which ? lampPlugLight(this._accent, which, this._onPlugLight, LAMP_PURIFIER_PLATES) : null;
      if (which && !light) return;                      // the light for this accent is being made
      const prev = this._plugShown;
      const from = prev && prev.state !== state ? { light: prev.light, state: prev.state } : null;
      key = [W, 'purifier', state, this._accent, light ? 1 : 0].join('|');
      make = () => {
        this._plugShown = { state: state, light: light };
        return lampHeroPurifier(Object.assign(o, { acc: this._accent, state: state, light: light, from: from }));
      };
    } else if (h.form === 'trace') {
      const d = this._heroData;
      if (!d) return;                                   // the fetch has not ended
      if (!d.series) gilded();
      else {
        key = [W, left, 'trace', d.at].join('|');
        make = () => lampHeroTrace(Object.assign(o, { series: d.series, kind: h.kind, now: d.at }));
      }
    } else if (h.form === 'skyline') {
      const c = this._cardsConfig[0];
      const list = lampBatteryList(hass, c.exclude, c.names);
      if (!list.length) gilded();
      else {
        const th = lampBattLimits(c.thresholds);
        const levels = lampBattHeroPick(list.map((b) => b.v), th.notice);
        const bands = levels.map((v) => lampBattBand(v, th));
        key = [W, left, 'sky', th.alert, th.notice, th.hand, levels.join(',')].join('|');
        make = () => lampHeroSkyline(Object.assign(o, { levels: levels, bands: bands, bandRgb: LAMP_BATT_BAND_RGB }));
      }
    } else if (h.form === 'panes') {
      const c = this._cardsConfig[0];
      const wins = c.windows.map((w) => ({ open: !!(hass.states[w.entity] && hass.states[w.entity].state === 'on') }));
      const wxId = this._config.weather || Object.keys(hass.states).filter((id) => id.indexOf('weather.') === 0)[0];
      const wx = wxId ? hass.states[wxId] : null;
      const sun = hass.states['sun.sun'];
      const e = sun && sun.attributes ? parseFloat(sun.attributes.elevation) : NaN;
      if (!wx) gilded();
      else {
        const pick = lampPlateChoose(wx.state, isFinite(e) ? Math.round(e * 2) / 2 : 90,
          LAMP_SKY_BASE + 'lamplight-sky/' + LAMP_PLATE_SET + '/');
        const again = () => { this._heroWait = false; this._heroKey = null; if (this._open) this._paintHero(); };
        const A = lampPlateLoad(pick.urlA, this._heroWait ? null : again);
        const B = pick.urlB ? lampPlateLoad(pick.urlB, this._heroWait ? null : again) : null;
        if (A.state === 'fail' || (B && B.state === 'fail')) gilded();
        else if (A.state === 'wait' || (B && B.state === 'wait')) { this._heroWait = true; return; }
        else {
          // The frames are cut from the plates. After sunset the night image fades in; under cloud or fog the day
          // image loses its colour (7 Nov 2026, design-docs/windows_room_frame_options.html).
          const plates = this._heroPlates;
          const nightShare = Math.round((pick.w.twilight + pick.w.night) * 20) / 20;
          const muted = !!LAMP_PLATE_COVER[pick.plate] || pick.plate === 'fog';
          if (plates && !this._onPlate) this._onPlate = () => { this._heroKey = null; if (this._open) this._paintHero(); };
          const painted = !!plates && (nightShare >= 1 || lampHeroImage(plates.day, this._onPlate)) && (nightShare <= 0 || lampHeroImage(plates.night, this._onPlate));
          // On a clear or fair sky the last glass holds the moon by night: the place in the night and the phase.
          const rise = sun ? Date.parse(sun.attributes.next_rising) : NaN, set = sun ? Date.parse(sun.attributes.next_setting) : NaN;
          const below = !!sun && sun.state === 'below_horizon', now = Date.now(), DAY = 86400000;
          const moon = nightShare > 0.5 && !muted ? lampPlateMoon(new Date(now)) : null;
          const step = moon ? Math.round(Math.max(0, Math.min(1, below && rise && set ? (now - (set - DAY)) / (rise - (set - DAY)) : 0.4)) * 96) / 96 : null;
          key = [W, left, 'panes', pick.urlA, pick.urlB || '', pick.t, wins.map((w) => w.open ? 1 : 0).join(''), painted ? nightShare + (muted ? 'm' : '') + (isFinite(e) ? Math.round(e) : '') + (moon ? 'n' + step + 'p' + Math.round(moon.phase * 40) + (moon.waning ? 'w' : '') : '') : ''].join('|');
          const panes = { windows: wins, urlA: pick.urlA, urlB: pick.urlB, t: pick.t };
          make = painted ? () => lampHeroFrames(Object.assign(o, panes, { plates: plates, nightShare: nightShare, muted: muted, elev: isFinite(e) ? e : NaN,
            frac: step, phase: moon ? moon.phase : null, waning: !!moon && moon.waning })) : () => lampHeroPanes(Object.assign(o, panes));
        }
      }
    } else if (h.form === 'sun') {
      const c = this._cardsConfig[0];
      const sun = hass.states['sun.sun'];
      const rise = sun ? Date.parse(sun.attributes.next_rising) : NaN, set = sun ? Date.parse(sun.attributes.next_setting) : NaN;
      if (!(rise && set)) gilded();
      else {
        const night = sun.state === 'below_horizon', now = Date.now(), DAY = 86400000;
        const frac = night ? (now - (set - DAY)) / (rise - (set - DAY)) : (now - (rise - DAY)) / (set - (rise - DAY));
        const open = c.rooms.some((r) => (r.windows || []).some((w) => hass.states[w.entity] && hass.states[w.entity].state === 'on'));
        // By day the light's colour follows the sun's elevation, in 0.5 degree steps; by night the moon's
        // follows the place in the night (30 Oct 2026, design-docs/windows_sunlight_options.html). The moon
        // in the glass shows its phase, from the date, as on the Day's Arc (31 Oct 2026,
        // design-docs/windows_frame_options.html).
        const elev = Number(sun.attributes.elevation) || 0;
        const moon = lampPlateMoon(new Date(now));
        const step = night ? Math.round(Math.max(0, Math.min(1, frac)) * 360) + 'm' + Math.round(moon.phase * 40) + (moon.waning ? 'w' : '')
          : 'e' + Math.round(elev * 2);
        const plate = this._heroPlates ? (night ? this._heroPlates.night : this._heroPlates.day) : null;
        if (plate && !this._onPlate) this._onPlate = () => { this._heroKey = null; if (this._open) this._paintHero(); };
        // The weather (27 Nov 2026, option 6d of design-docs/windows_house_sky_options.html): the House card's weather
        // entity gives the sky; the picture's light, glass and marks follow it. While its files load, the plain plate draws.
        let wx = null;
        if (this._heroWx) {
          const wxId = this._config.weather || c.weather || Object.keys(hass.states).filter((id) => id.indexOf('weather.') === 0)[0];
          const ws = wxId ? hass.states[wxId] : null;
          if (ws) {
            wx = lampHeroWxPick(this._heroWx, ws.state, Math.round(elev * 2) / 2, night);
            const all = wx.files.map((u) => lampHeroImage(u, this._onPlate));
            if (all.indexOf(false) >= 0) wx = null;
          }
        }
        const painted = plate ? lampHeroImage(plate, this._onPlate) : false;
        const tEnd = Math.round(this._titleEnd()), text = this._textInk();
        const ink = text.map((b) => [b.l, b.r, b.t, b.b].map(Math.round).join(',')).join(';');
        key = [W, left, 'sun', night ? 1 : 0, step, open ? 1 : 0, painted ? plate + '|' + ink : '', wx ? wx.key : ''].join('|');
        const light = { frac: frac, elev: elev, night: night, open: open, phase: moon.phase, waning: moon.waning };
        make = painted ? () => lampHeroPlate(Object.assign(o, light, { url: plate, tEnd: tEnd, text: text, wx: wx })) : () => lampHeroSun(Object.assign(o, light));
      }
    }
    if (key === this._heroKey) return;
    this._heroKey = key;
    // Smoked glass while a picture lies under the close button, so the cross keeps its contrast.
    this.$x.classList.toggle('smoke', !!make && smoke);
    if (!make) {
      // No room for a hero, or no object to draw: the header shows nothing here, or its own glyph.
      this._heroGilded = false;
      this.$glow.style.background = '';
      if (!room || !(this._lampIcon || this._mdiIcon)) { this.$gw.classList.add('arc'); this.$gw.innerHTML = ''; }
      else this._paintDefaultGlyph();
      this._applyGlyphState();
      return;
    }
    const r = make();
    this._heroGilded = !!r.gilded;
    this.$gw.classList.add('arc');
    this.$gw.innerHTML = r.svg;
    this.$glow.style.background = "url('" + LAMP_GRAIN + "'), radial-gradient(40% 55% at " + (r.x / W * 100).toFixed(1) + '% ' +
      (r.y / 220 * 100).toFixed(1) + '%, rgba(' + r.at + ',0.08), rgba(' + r.at + ',0) 75%), ' +
      'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 70%)';
    this._applyGlyphState();
  }

  // The header's own glyph, as it is without `header_art`.
  _paintDefaultGlyph() {
    this.$gw.classList.remove('arc');
    if (this._mdiIcon) this._paintMdiGlyph();
    else if (this._lampIcon) this._paintLampGlyph();
  }

  _paintHeaderText() {
    this.$eb.textContent = this._eyebrowText;
    this.$ttl.textContent = this._titleText;
    this.$sheet.setAttribute('aria-label', this._titleText || '');
    this._fitTitle();
  }

  // With the Day's Arc, the title also steps down until it leaves the arc LAMP_ARC_MIN and its 12px
  // gap (28 Oct 2026, option 3 of design-docs/today_arc_fit_options.html). The arc then follows it.
  // A long title (8 Nov 2026, option 3 of design-docs/long_title_options.html): the plug first slides
  // under the close button (LAMP_PLUG_SLIDE, in _paintHero); then the title steps from 24 to 22px; then
  // it takes two balanced lines at 22px, clamped at two. 20px is retired. Until then it went 24, 22, 20,
  // and a picture with no room was dropped.
  _fitTitle() {
    const el = this.$ttl;
    if (!el || !el.isConnected) return;
    const LEVELS = [24, 22];
    const W = (this._arcEntity || this._hero) && this._open ? this.$sheet.clientWidth : 0;
    // The sky panes stand at W - 161, so the title must end 12px before that; the plug needs
    // LAMP_PLUG_ROOM (0.75.2-dev: until then it used the trace's limit, so on the 360px telephone
    // "Christmas Lights" stayed at 24px and the plug gave way); the other forms need LAMP_ARC_MIN
    // between the title and the right margin.
    const form = this._hero && this._hero.form;
    // The climate picture needs LAMP_FROST_SUN_ROOM (the temperature arc needed LAMP_COMFORT_ROOM, 198, until
    // 15 Nov 2026); until 0.76.1-dev this used the trace's limit, and the ring was dropped.
    const lim = form === 'panes' ? W - 161 : form === 'plug' ? W - LAMP_PLUG_ROOM + LAMP_PLUG_SLIDE : form === 'purifier' ? W - LAMP_PURIFIER_ROOM
      : form === 'comfort' ? W - LAMP_FROST_SUN_ROOM : W - 19 - LAMP_ARC_MIN;
    el.classList.remove('two');
    el.style.maxWidth = '';
    let fit = false;
    for (let i = 0; i < LEVELS.length && !fit; i++) {
      el.style.fontSize = LEVELS[i] + 'px';
      fit = el.scrollWidth <= el.clientWidth && (!W || this._titleEnd() + 12 <= lim);
    }
    if (!fit) {
      el.classList.add('two');
      if (W) el.style.maxWidth = Math.max(80, Math.floor(lim - 12 - (el.getBoundingClientRect().left - this.$sheet.getBoundingClientRect().left))) + 'px';
    }
    if (W) { if (this._arcEntity) this._paintArc(); else this._paintHero(); }
  }

  // The right edge of the title's ink, in px from the sheet's left edge. 0 when there is no text.
  _titleEnd() {
    const r = document.createRange();
    r.selectNodeContents(this.$ttl);
    const box = r.getBoundingClientRect();
    return box.width ? box.right - this.$sheet.getBoundingClientRect().left : 0;
  }

  // The ink of the title and the eyebrow, in the header picture's px (a Range over each text, not its box: the
  // eyebrow's box is the sheet's full width). The #windows fade keeps clear of both.
  _textInk() {
    const g = this.$gw.getBoundingClientRect();
    return [this.$ttl, this.$eb].filter((e) => e && e.textContent.trim()).map((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      const b = r.getBoundingClientRect();
      return { l: b.left - g.left, r: b.right - g.left, t: b.top - g.top, b: b.bottom - g.top };
    });
  }

  _watchTitle() {
    if (!window.ResizeObserver || this._ro) return;
    const self = this;
    this._ro = new ResizeObserver(() => self._fitTitle());
    this._ro.observe(this.$hdrContent);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => self._fitTitle());
  }

  // ---- the shell --------------------------------------------------------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const A = this._accent, C = this._core, H = this._heroAccent;
    const GRAIN = "url('" + LAMP_GRAIN + "')";
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: contents; }
        * { box-sizing: border-box; }
        .wrap[hidden] { display: none; }
        .back { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.55);
                touch-action: none; }
        .sheet { position: fixed; left: 0; right: 0; bottom: 0; top: 64px; z-index: 101;
                 margin: 0 auto; max-width: ${lampEsc(this._widthDesktop)}; background: #101219;
                 border-radius: 28px 28px 0 0; overflow: hidden; display: flex;
                 flex-direction: column; outline: none; transition: transform 340ms ease;
                 font-family: var(--primary-font-family, Roboto, Noto, sans-serif);
                 color: #fff; }
        .sheet.drag { transition: none; }
        .scroller { flex: 1; overflow-y: auto; overscroll-behavior: contain;
                    -webkit-overflow-scrolling: touch; }
        .grab { position: absolute; top: 8px; left: 50%; width: 36px; height: 5px;
                margin-left: -18px; border-radius: 3px; background: rgba(255,255,255,0.22);
                z-index: 3; }
        .x { position: absolute; top: 14px; right: 14px; z-index: 3; width: 40px; height: 40px;
             border: 0; padding: 0; border-radius: 20px; display: flex; align-items: center;
             justify-content: center; background: rgba(255,255,255,0.08);
             backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
             color: var(--lamplight-ink-strong); --mdc-icon-size: 20px; line-height: 0; }
        .x ha-icon { line-height: 0; }
        .x { transition: background-color .35s; }
        /* Smoked glass while a picture lies under the button (8 Nov 2026, design-docs/long_title_options.html):
           through the 8% glass the lit plug left the cross at 3.4 : 1; smoked, it is 8.6 : 1. */
        .x.smoke { background: rgba(14,15,20,0.55); }
        .hdrwrap { position: relative; }
        .clip { position: absolute; inset: 0; height: 220px; overflow: hidden; pointer-events: none; }
        .glow { position: absolute; left: 0; right: 0; top: 0; height: 220px;
          background:
            ${GRAIN},
            radial-gradient(60% 80% at 88% 8%, rgba(${H},0.16), rgba(${H},0) 75%),
            linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 70%);
          -webkit-mask-image: linear-gradient(to bottom, #000 68%, transparent 100%);
          mask-image: linear-gradient(to bottom, #000 68%, transparent 100%); }
        /* 165px, was 220px (27 Sep 2026, option 3). Cropped only at the right edge; the fade starts
           at 72%, so the base of each object stays. */
        .gw { position: absolute; right: -22px; top: 6px; width: 165px; height: 165px;
              line-height: 0;
              -webkit-mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
              mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
              filter: drop-shadow(0 0 10px rgba(${H},0.35)) drop-shadow(0 8px 22px rgba(0,0,0,0.45)); }
        .gw svg { width: 100%; height: 100%; overflow: visible; transition: opacity .35s; }
        /* The Day's Arc draws across the whole header, with no mask and no drop shadow. */
        .gw.arc { left: 0; right: 0; top: 0; width: auto; height: 220px; filter: none;
                  -webkit-mask-image: none; mask-image: none; }
        .gw .lp-part { transition: opacity .35s; }
        .gw[data-state="off"] svg { opacity: .45; }
        .gw[data-state="gone"] svg { opacity: .25; }
        .gw[data-state="off"] .lp-part, .gw[data-state="gone"] .lp-part,
        .gw[data-state="on"]:not([data-full]) .lp-part { opacity: .22; }
        /* The plug hero: a change of state fades the old light out and the new one in (93d-plug.js). */
        .gw .lp-in { animation: lp-plug-in .6s ease-out both; }
        .gw .lp-out { animation: lp-plug-out .6s ease-in both; }
        @keyframes lp-plug-in { from { opacity: 0; } }
        @keyframes lp-plug-out { to { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .gw svg, .gw .lp-part, .x { transition: none; }
          .gw .lp-in { animation: none; } .gw .lp-out { display: none; } }
        /* 128px, was 164px (27 Sep 2026). The 24px title left 47px of empty light between the close
           button and the eyebrow; the household saw it on the telephone. The eyebrow now sits 11px
           under the close button, and the body starts 36px higher, in the glyph's fade. */
        .hdrcontent { position: relative; z-index: 2; height: 128px; padding: 0 22px 18px;
                      display: flex; flex-direction: column; justify-content: flex-end; }
        .eb { font-size: var(--lamplight-t-label); font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
              color: rgb(${C}); line-height: 1; }
        /* The title is a name, not a figure (27 Sep 2026, option 1 of
           design-docs/popup_type_scale_options.html). At 38px weight 300 it had the display
           numeral's role and read at the same rank as the body's hero. Weight 500 is the heaviest
           face under 700: Home Assistant loads no Roboto 600, so 600 draws as 700. */
        .ttl { font-size: var(--lamplight-t-title); font-weight: 500; letter-spacing: -0.005em; line-height: 1.08;
               color: var(--lamplight-ink-strong); margin-top: 7px; overflow: hidden;
               text-overflow: ellipsis; white-space: nowrap; }
        /* A long title takes two balanced lines at 22px (_fitTitle), never three. */
        .ttl.two { white-space: normal; text-wrap: balance; line-height: 1.12; display: -webkit-box;
                   -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        .body { position: relative; z-index: 1; padding: 0 18px; display: flex;
                flex-direction: column; gap: 8px; }
        .edit { display: none; align-items: center; gap: 10px; padding: 12px 16px;
                border-radius: 12px; background: rgba(255,255,255,0.04);
                color: var(--lamplight-ink-mid); font-size: var(--lamplight-t-state); line-height: 1.3; }
        .edit ha-icon { --mdc-icon-size: 18px; line-height: 0; color: rgb(${A}); flex: none; }
        .edit .eh { margin-left: auto; color: var(--lamplight-ink-quiet); font-size: var(--lamplight-t-caption);
                    font-variant-numeric: tabular-nums; }
      </style>
      <div class="edit"><ha-icon icon="${lampEsc(this._mdiIcon || (this._lampIcon && LAMP_POPUP_GLYPHS[this._lampIcon].mdi) || (this._arcEntity && 'mdi:weather-sunset') || 'mdi:weather-cloudy')}"></ha-icon>
        <span class="et"></span><span class="eh">${lampEsc(this._hash)}</span></div>
      <div class="wrap" hidden>
        <div class="back"></div>
        <div class="sheet" tabindex="-1" role="dialog" aria-modal="true">
          <div class="grab"></div>
          <button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button>
          <div class="scroller">
            <div class="hdrwrap">
              <div class="clip"><div class="glow"></div><div class="gw"></div></div>
              <div class="hdrcontent"><div class="eb"></div><div class="ttl"></div></div>
            </div>
            <div class="body"></div>
          </div>
        </div>
      </div>`;
    const r = this.shadowRoot;
    this.$edit = r.querySelector('.edit');
    this.$edit.querySelector('.et').textContent =
      (this._eyebrowText || '') + (this._eyebrowText ? ' · ' : '') + (this._titleText || this._titleRaw || '');
    this.$wrap = r.querySelector('.wrap');
    this.$sheet = r.querySelector('.sheet');
    this.$scroller = r.querySelector('.scroller');
    this.$gw = r.querySelector('.gw');
    this.$glow = r.querySelector('.glow');
    this.$hdrContent = r.querySelector('.hdrcontent');
    this.$eb = r.querySelector('.eb');
    this.$ttl = r.querySelector('.ttl');
    this.$x = r.querySelector('.x');
    this.$body = r.querySelector('.body');
    this.$body.addEventListener('lamp-glyph-state', this._onGlyph);
    r.querySelector('.x').addEventListener('click', () => this.close('button'));
    if (this._closeOutside) r.querySelector('.back').addEventListener('click', () => this.close('backdrop'));
    this._swipe();
    this._paintHeaderText();
    this._watchTitle();
    if (this._mdiIcon && !this._hero) this._paintMdiGlyph();
    if (this._lampIcon && !this._hero) this._paintLampGlyph();
    if (this._weatherEntity && this._hass) { this._wxKey = null; this._paintWeatherGlyph(); }
  }

  _swipe() {
    let y0 = null, dy = 0, fromHead = false;
    const sheet = this.$sheet, grab = this.$sheet.querySelector('.grab'), x = this.$sheet.querySelector('.x');
    sheet.addEventListener('touchstart', (e) => {
      y0 = e.touches[0].clientY; dy = 0;
      const p = e.composedPath()[0];
      fromHead = grab.contains(p) || x.contains(p);
    }, { passive: true });
    sheet.addEventListener('touchmove', (e) => {
      if (y0 === null) return;
      const d = e.touches[0].clientY - y0;
      if (d > 0 && (fromHead || this.$scroller.scrollTop <= 0)) {
        e.preventDefault();
        dy = d;
        sheet.classList.add('drag');
        sheet.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: false });
    sheet.addEventListener('touchend', () => {
      sheet.classList.remove('drag');
      const far = dy > 90;
      y0 = null;
      sheet.style.transform = '';
      if (far) this.close('swipe');
    });
  }
}

customElements.define('lamplight-popup', LampPopup);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-popup',
  name: 'Lamplight Pop-up',
  description: 'The Lamplight pop-up: a #hash bottom sheet with a line-drawn header glyph, replacing bubble-card’s pop-up.',
  preview: false
});
