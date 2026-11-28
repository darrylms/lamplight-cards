// lamplight-waste. When the bins go out.
//
// One complete panel: the shell, the eyebrow and the content. It replaces a
// custom:stack-in-card holding two custom:button-cards, one of which carried a
// 4,442-character JavaScript template. The output is the same card.
//
// WHERE THE DATES COME FROM
// The Waste Collection Schedule integration puts every future collection on the
// sensor as an ATTRIBUTE KEY in YYYY-MM-DD form. The state is not the date and
// is not read. Each bin is a separate sensor, so a day with three bins out is
// the same date appearing on three sensors, and the card groups by date.
//
// A different integration needs a different reader, not a different card. Keep
// the scan in _collections() and give it another branch.
//
// THE ACCENT MOVES
// The panel takes the colour of the bin that is next out, so it carries four
// accents and four colour sets. This is master_design.html section 05's one
// exception and the reason the card owns its accent instead of declaring one:
// it must find the next collection for its own content, so the colour is free.
// Where two bins go out together the first one in `bins` wins, which is the
// order the Jinja it replaces also used.
//
// Configuration:
//   heading     { icon, label }
//   bins        one entry per sensor, in the order they should win a tie:
//                 entity   required
//                 label    required. The household's word, not the sensor's
//                 icon     required
//                 color    required. A palette name (grape, mustard, bluebell, mint, ...).
//                          The palette gives the icon and the dot (soft), the chip fill
//                          and border (deep), the icon's glow and the chip label
//   show_following_collection  true (default). The "Then ..." line for the collection after
//   locale      "en-GB" by default. Used for both dates
//   idle_color  when no bin has a future date. Default panel-rest (143,160,189)
//   tap_action  { action: "more-info" } by default, on the bin next out
//   plus every key of the shell - see 20-shell.js
//
// It also re-reads itself just after midnight, which the button-card template
// could not do: that template had no clock and waited for a sensor to change
// before it stopped saying "today" about yesterday.

class LampWaste extends LampShell {

  static getStubConfig() {
    return {
      heading: { icon: 'mdi:delete-outline', label: 'Waste Collection' },
      bins: []
    };
  }

  // THE LIGHT (1 Oct 2026). The card used the activity wash (core, key, shade).
  // The household asked for the same light as the other cards: the accent
  // fill from the top right, the bounce and the rim, in the colour of the bin
  // that is next out (purple while Food is next). The card forces the accent family, as
  // LampFootPanel does, so it has no `light_style` of its own.
  setConfig(config) {
    super.setConfig(Object.assign({}, config, { light_style: 'accent' }));
  }

  _setup(config) {
    if (!Array.isArray(config.bins) || !config.bins.length) {
      throw new Error('lamplight-waste needs a `bins` list');
    }
    this._bins = config.bins.map(function (b) {
      if (!b.entity) throw new Error('every bin needs an entity');
      if (!b.color) throw new Error('every bin needs a color: ' + b.entity);
      // One colour gives the whole bin. A palette name (src/02-palette.js) gives the icon and the dot
      // (soft), the chip fill and border (deep), the icon's glow (the entry's `glow`, else deep) and the
      // chip label (the entry's `ink`, else a tint of deep). Any other colour is used for all of them.
      const m = lampIsPalette(b.color) && String(b.color).trim().match(/^([a-z]+)/);
      const e = m ? LAMP_PALETTE[m[1]] : null;
      const color = lampColour(b.color, 'soft');
      const chip = e ? e.deep : color;
      return {
        entity: b.entity,
        label: b.label || b.entity,
        icon: b.icon || 'mdi:trash-can-outline',
        color: color,
        chip: chip,
        glow: e && e.glow ? e.glow : chip,
        text: e && e.ink ? e.ink : lampTint(chip)
      };
    });
    this._fallback = lampColour(config.idle_color || lampDefault('waste', 'idle_color'), 'deep');
    this._locale = lampOpt('waste', config, 'locale');
    this._showAfter = lampOpt('waste', config, 'show_following_collection') !== false;
    this._sig = null;
    this._midnight();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timer) clearTimeout(this._timer);
    if (this._observer) { this._observer.disconnect(); this._observer = null; }
  }

  // Home Assistant takes a card out of the document and puts it back while it
  // renders a view. A disconnect stops both the clock and the width watcher,
  // so start them again here. Measured 21 September 2026: without this the
  // card has no watcher after its first paint, and the midnight re-read - the
  // reason this card exists instead of a button-card template - never runs.
  connectedCallback() {
    super.connectedCallback();
    if (!this._content) return;        // setConfig has not run yet
    this._watch();
    this._midnight();
  }

  // Re-read shortly after the next midnight, so "today" is never yesterday.
  _midnight() {
    if (this._timer) clearTimeout(this._timer);
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 30);
    const self = this;
    this._timer = setTimeout(function () {
      self._sig = null;
      self._onHass(self._hass);
      self._paint();
      self._midnight();
    }, next - now);
  }

  // ---- the data ----------------------------------------------------------

  // Every future collection, grouped by date. The keys of each sensor's
  // attributes are the dates; anything else on the sensor is ignored.
  _collections() {
    const hass = this._hass;
    const RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byDate = {};
    this._bins.forEach(function (b) {
      const s = hass && hass.states[b.entity];
      if (!s || !s.attributes) return;
      Object.keys(s.attributes).forEach(function (k) {
        if (!RE.test(k)) return;
        if (new Date(k + 'T00:00:00') < today) return;
        if (!byDate[k]) byDate[k] = [];
        byDate[k].push(b);
      });
    });
    const dates = Object.keys(byDate).sort();
    return { dates: dates, byDate: byDate };
  }

  _accent() {
    const c = this._collections();
    if (!c.dates.length) return this._fallback;
    return c.byDate[c.dates[0]][0].chip;
  }

  _onHass() {
    if (!this._body) return;
    const c = this._collections();
    const sig = JSON.stringify(c.dates.map(function (d) {
      return [d, c.byDate[d].map(function (b) { return b.entity; })];
    }));
    if (sig === this._sig) return;      // nothing the card shows has moved
    this._sig = sig;
    this._draw(c);
  }

  // ---- the card ----------------------------------------------------------

  _build() {
    const eb = this._config.heading || {};
    this._body.appendChild(lampEyebrow(eb.icon || 'mdi:delete-outline',
                                       eb.label || 'Waste Collection'));
    this._content = document.createElement('div');
    this._content.className = 'lamp-waste-body';
    // No line under the eyebrow (14 Nov 2026, design-docs/divider_rule_options.html, option 1):
    // a line is drawn only between items of a list. The 1px of padding keeps the old height.
    this._content.style.paddingTop = '1px';
    const self = this;
    const tap = this._config.tap_action || { action: 'more-info' };
    if (tap.action === 'more-info') {
      this._content.style.cursor = 'pointer';
      this._content.addEventListener('click', function () {
        const c = self._collections();
        const bin = c.dates.length ? c.byDate[c.dates[0]][0] : self._bins[0];
        self._moreInfo(bin.entity);
      });
    }
    this._body.appendChild(this._content);
    this._watch();
    if (this._hass) this._onHass(this._hass);
  }

  _date(key, form) {
    return new Date(key + 'T00:00:00').toLocaleDateString(this._locale, form);
  }

  // "Out tomorrow" on the day before a collection, "Out today" on the day, and
  // '' on every other day. Round, because a day with a clock change is 23 or
  // 25 hours long. The "Next out in N days" line and its show_next_out key
  // were removed on 1 Nov 2026: the household did not use the line.
  _countdown(key) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const n = Math.round((new Date(key + 'T00:00:00') - today) / 86400000);
    if (n <= 0) return 'Out today';
    if (n === 1) return 'Out tomorrow';
    return '';
  }

  _draw(c) {
    if (!c.dates.length) {
      this._content.innerHTML =
        '<div style="padding:16px 18px;text-align:left;font-size:var(--lamplight-t-body);' +
        'color:var(--lamplight-ink-soft)">No collections scheduled</div>';
      return;
    }

    const next = c.dates[0], after = c.dates[1];
    const nb = c.byDate[next];

    const rail = nb.length === 1
      ? 'rgb(' + nb[0].color + ')'
      : 'linear-gradient(180deg,' + nb.map(function (b) {
          return 'rgb(' + b.color + ')'; }).join(',') + ')';

    const chips = nb.map(function (b) {
      // From 0.91.0-dev the chip has the lit edge of the icon tiles (17-edge.js), in its own
      // colour. render() adds the edge. The edge takes the border's place: 1px of padding
      // keeps the chip 31px high.
      return '<div class="lamp-waste-chip" data-rgb="' + b.chip + '" style="display:flex;' +
        'align-items:center;gap:7px;padding:7px 13px 7px 8px;border:none;' +
        'border-radius:999px;font-size:var(--lamplight-t-state);font-weight:500;line-height:1.4;' +
        'background:rgba(' + b.chip + ',0.13);' +
        'color:' + b.text + '">' +
        '<ha-icon icon="' + lampEsc(b.icon) + '" style="line-height:0;--mdc-icon-size:17px;' +
        'width:17px;height:17px;margin:0;color:rgb(' + b.color + ');' +
        'filter:drop-shadow(0 0 4px rgba(' + b.glow + ',0.9))"></ha-icon>' +
        // The label sat 0.6px above the chip's centre: the line box centres the font's
        // ascent and descent, not its capitals. text-box trims the label to its capitals,
        // so the flex centre puts them on the chip's centre. Text moves in whole pixels,
        // so 0.5px more puts the capitals on the drawn centre of the icon, 15.9px of 31.
        // Measured at 375px, 12 November 2026. A browser without text-box moves 0.5px only.
        '<span style="text-box:trim-both cap alphabetic;position:relative;top:0.5px">' +
        lampEsc(b.label) + '</span></div>';
    }).join('');

    let foot = '';
    if (after && this._showAfter) {
      const ab = c.byDate[after];
      // The footer text sat 3px low between its rule and the card edge (13.7
      // above, 16.8 below). It moves 1px down - text moves in whole pixels -
      // and the -1px margin keeps the card the same height. The dots sat
      // 0.25px below the centre of the text's capitals and are lifted 0.25px.
      // Measured 24 September 2026, Lamplight 0.16.3-dev.
      foot = '<div class="lamp-waste-foot" style="margin-top:14px;padding-top:12px;margin-bottom:-1px;' +
        'border-top:1px solid rgba(255,255,255,0.06);font-size:var(--lamplight-t-state);' +
        'color:var(--lamplight-ink-soft);display:flex;align-items:center;gap:8px;' +
        'flex-wrap:nowrap;font-variant-numeric:tabular-nums">' +
        'Then <span style="color:var(--lamplight-ink-soft);white-space:nowrap">' +
        this._date(after, { weekday: 'short', day: 'numeric', month: 'short' }) +
        '</span>' +
        '<span class="lamp-waste-break" style="display:none;flex-basis:100%;height:0"></span>' +
        '<span class="lamp-waste-what" style="white-space:nowrap">' +
        '<span class="lamp-waste-sep">&mdash; </span>' +
        ab.map(function (b) { return lampEsc(b.label); }).join(', ') + '</span>' +
        '<span style="display:inline-flex;gap:4px;margin-left:auto;flex:none;' +
        'transform:translateY(-0.25px)">' +
        ab.map(function (b) {
          return '<i style="width:7px;height:7px;border-radius:50%;' +
                 'display:block;background:rgb(' + b.color + ')"></i>'; }).join('') +
        '</span></div>';
    }

    // THE HEADLINE (1 Nov 2026, option 3 of waste_attention_options.html).
    // On most days the date is the headline. On the day before a collection
    // and on the day, "Out tomorrow" or "Out today" takes the date's place and
    // type, and the date steps down under it to 13px / 500, white 56%. The
    // line was a 13px white 50% lead-in above the date (option 5 of
    // waste_next_out_options.html), and the household missed it: the most
    // important fact on the card was its dimmest text. 13.7:1 on the Food wash.
    const when = this._countdown(next);
    const date = this._date(next, { weekday: 'long', day: 'numeric', month: 'short' });
    const head = '<b style="display:block;font-size:var(--lamplight-t-title);font-weight:500;letter-spacing:-0.005em;line-height:1.1">';
    this._content.innerHTML =
      '<div style="position:relative;padding:13px 18px 14px 22px;text-align:left;">' +
      '<div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:' + rail + '"></div>' +
      (when
        ? head.replace('<b ', '<b class="lamp-waste-when" ') + when + '</b>' +
          '<div style="margin-top:4px;font-size:var(--lamplight-t-state);font-weight:500;line-height:1.2;' +
          'color:var(--lamplight-ink-soft)">' + date + '</div>'
        : head + date + '</b>') +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:13px">' + chips + '</div>' +
      foot + '</div>';
    this._content.querySelectorAll('.lamp-waste-chip').forEach(function (chip) {
      lampEdgePaint(lampEdge(chip, '999px'), chip.dataset.rgb, LAMP_EDGE.lit);
    });

    this._lastWidth = null;
    this._fitFoot();
  }

  // ---- the footer ladder ---------------------------------------------------
  //
  // "Then <date> &mdash; <bins>" fits at 375px with 45px to spare, but the
  // household's telephone draws the same text 13.6% wider, which leaves it
  // 0.9px OVER its box. Measured on 21 September 2026 from a screenshot taken
  // on 18 September, before this card existed: the card is 1032 physical px at
  // device pixel ratio 3, so the viewport is 360 CSS px and the footer box is
  // 302 CSS px. The text run is 279 CSS px there and 245.6 px on the desktop.
  // The dots in that screenshot already sat 11 physical px outside the card's
  // right padding. The line has never had room on that telephone.
  //
  // The width of a font is not knowable from the configuration, so the card
  // measures its own line and gives up the least it can:
  //
  //   0  the line as designed. 375px and every desktop stay on this level, so
  //      the figures in master_design.html do not go stale
  //   1  the em dash goes and the two gaps close to 6px. This saves 18.9px and
  //      puts the telephone back on one line with 19.7px to spare
  //   2  the bins and the dots move to a second line
  //
  // Each group has white-space:nowrap, so a flex item can never become
  // narrower than its own text. That makes an overflow measurable, and it also
  // stops the break that caused this work: "Tue 29 / Sept" on two lines.
  //
  // Level 2 uses a hidden flex-basis:100% element to put the break in one
  // place. Without it, a very narrow card breaks after "Then" and gives four
  // short lines instead of two.
  _fitFoot() {
    const foot = this._content.querySelector('.lamp-waste-foot');
    if (!foot) return;
    const sep = foot.querySelector('.lamp-waste-sep');
    const brk = foot.querySelector('.lamp-waste-break');
    const LEVELS = [
      { gap: '8px', row: '', sep: '', brk: 'none', wrap: 'nowrap' },
      { gap: '6px', row: '', sep: 'none', brk: 'none', wrap: 'nowrap' },
      { gap: '6px', row: '3px', sep: 'none', brk: 'block', wrap: 'wrap' }
    ];
    for (let i = 0; i < LEVELS.length; i++) {
      const L = LEVELS[i];
      foot.style.flexWrap = L.wrap;
      foot.style.gap = L.gap;
      foot.style.rowGap = L.row;
      if (sep) sep.style.display = L.sep;
      if (brk) brk.style.display = L.brk;
      this._level = i;
      if (foot.scrollWidth <= foot.clientWidth) break;
    }
  }

  // A new width needs a new measurement. Height is ignored, because level 2
  // changes the height itself and the card would measure its own answer.
  _watch() {
    if (!window.ResizeObserver || this._observer || !this._content) return;
    const self = this;
    this._observer = new ResizeObserver(function (entries) {
      const w = Math.round(entries[0].contentRect.width);
      if (w === self._lastWidth) return;
      self._lastWidth = w;
      self._fitFoot();
    });
    this._observer.observe(this._content);
    // A web font arrives after the first paint and is usually wider.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { self._fitFoot(); });
    }
  }
}

customElements.define('lamplight-waste', LampWaste);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-waste',
  name: 'Lamplight Waste',
  description: 'The next waste collection, and the one after it.',
  preview: false
});
