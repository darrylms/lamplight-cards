// lamplight-chips. A strip of pill buttons, with an optional label on its own line.
//
// It replaces the Seasonal strip in the Routines panel: a horizontal-stack with
// a card_mod and three button-cards. It is a child card. It draws its own
// ground and top rule, and it has no ha-card, so the theme has nothing to
// override.
//
// Configuration:
//   label        optional. Shown in capitals on the first line
//   chips        required. A list, each with:
//     entity       required unless tap_action says what to do
//     name         optional with an `entity`: its friendly_name. The household's name wins
//     icon         optional with an `entity`: its icon. The household's icon wins
//     icon_color   default rgba(255,255,255,0.56)
//     tap_action   default: run the entity - script.turn_on for a script,
//                  scene.turn_on for a scene, more-info for anything else.
//                  Any Home Assistant action is accepted, confirmation too.
//     months       optional. The months this chip shows, as numbers 1-12.
//                  It replaces the card's `months` for this chip
//     confirm      optional. Ask before the chip runs its action (21 Nov 2026,
//                  "All lights off"). { title, text, confirm, dismiss }, the
//                  options of lampConfirm (86-confirm.js). The title is required.
//                  The action runs only after the confirm button
//   months       optional. The months the chips show, as numbers 1-12, for
//                example [11, 12, 1, 2, 3] for November to March. Omitted,
//                the chips show all year
//   full_width   true: the chips share the whole row, and their content is
//                centred. Default false
//   raised       true: a stronger border, a soft top-to-foot gradient and a
//                button shadow. The gradient is neutral: a chip still carries
//                no light. Default false. Option 7 of
//                design-docs/house_scenes_journey_options.html, 6 Nov 2026
//
// THE SEASON. A seasonal chip that shows all year is noise for the rest of the
// year (critique F24, 31 Oct 2026). Out of its months, a chip is not drawn.
// When no chip and no label is left, the card hides itself. The strip is a
// band, so the panel's gap before it is already cancelled: a hidden strip
// leaves no space. The month is read from the browser clock at each hass
// update, so the strip comes back on the first day of its season.
//
// THE LABEL SITS WHERE BUTTON-CARD PUT IT. THE PILL NAME DOES NOT
// button-card put each name in a block with its own 16.8px font and a normal
// line height, and the smaller name went in that block as an inline span on the
// baseline. The line box, not the name, sets the height, so the pill is 36px
// and the label line is 20px. The label is still built this way. Measured
// 24 September 2026 at 375 x 812.
// In a pill, that baseline put the name 1.2px low: the capitals had 13.5px
// above them and 11.0px below, inside the border. The icon is centred. So the
// pill name has its own 12.5px font in a 20px box. A 20px line height put the
// capitals 0.75px high (11.5 above, 13.0 below), so the line height is 21.5px:
// 12.5 above, 12.0 below, the same as the icon to half a device pixel. The
// pill stays 36px tall. Measured 24 September 2026, Lamplight 0.13.2-dev.
//
// THE ICON IS WHOLE. BUTTON-CARD CUT IT
// button-card drew the icon's SVG 4.6px below its 14px box, and the box is
// overflow: hidden, so the bottom of each icon was cut off - the tree had no
// trunk. This card centres the whole icon. The household chose this on
// 24 September 2026. It is the only pixel difference from the strip it
// replaces: 597 device pixels, all inside the two icons.
//
// THE PRESS STATE
// While a finger or the pointer holds a chip, its border is brighter. Nothing
// changes when the chip is not pressed.

const LAMP_CHIP_BORDER = 'rgba(255,255,255,0.08)';
const LAMP_CHIP_BORDER_PRESSED = 'rgba(255,255,255,0.24)';
const LAMP_CHIP_TEXT = 'var(--lamplight-ink-soft)';

const LAMP_CHIPS_CSS =
  ':host{display:block}' +
  '.strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;' +
    'gap:8px 10px;padding:' + (11 + LAMP_BAND_PAD) + 'px 16px ' + (13 + LAMP_BAND_PAD) +
    'px;box-sizing:border-box;' +
    'border-top:1px solid ' + LAMP_CHIP_BORDER + ';background:rgba(0,0,0,0.18);' +
    'font-family:var(--primary-font-family, Roboto, Noto, sans-serif)}' +
  '.line{font-size:16.8px;line-height:normal;white-space:nowrap;overflow:hidden}' +
  // The label moves 6px up and the pills do not move: the two margins cancel.
  // It sat 24.7 below the strip's rule and 11.8 above the pills; now 18.7 and
  // 17.8, with 17 under the pills. A strip with no label does not change.
  // Measured 24 September 2026, Lamplight 0.16.3-dev.
  '.label{flex:0 0 100%;height:20px;margin:-6px 0 6px}' +
  '.label span{font-size:var(--lamplight-t-label);font-weight:600;letter-spacing:0.16em;text-transform:uppercase;' +
    'color:rgba(255,255,255,0.28)}' +
  '.chip{flex:0 0 auto;display:flex;align-items:center;gap:6px;box-sizing:border-box;' +
    'padding:7px 12px 7px 9px;border:1px solid ' + LAMP_CHIP_BORDER + ';border-radius:999px;' +
    'cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;' +
    'transition:border-color 120ms ease-out}' +
  '.strip.fill{flex-wrap:nowrap}' +
  '.strip.fill .chip{flex:1 1 auto;justify-content:center}' +
  '.strip.raised .chip{border-color:rgba(255,255,255,0.17);' +
    'background:linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03) 62%,rgba(255,255,255,0.02));' +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 2px 6px rgba(0,0,0,0.42)}' +
  '.strip .chip.pressed{border-color:' + LAMP_CHIP_BORDER_PRESSED + ';transition:none}' +
  '.chip:focus-visible{outline:2px solid ' + LAMP_CHIP_BORDER_PRESSED + ';outline-offset:2px}' +
  '.chip ha-icon{--mdc-icon-size:14px;width:14px;height:14px;display:flex;line-height:0;flex:0 0 auto}' +
  '.chip .line{height:20px;font-size:var(--lamplight-t-state);line-height:21.5px}' +
  '.chip .line span{font-size:var(--lamplight-t-state);color:' + LAMP_CHIP_TEXT + '}';

// Check a `months` value: absent, or a list of whole numbers 1-12.
function lampChipsMonths(months, who) {
  if (months === undefined || months === null) return;
  if (!Array.isArray(months) || !months.length || !months.every(function (m) {
    return Number.isInteger(m) && m >= 1 && m <= 12;
  })) {
    throw new Error(who + ': `months` must be a list of month numbers 1-12');
  }
}

class LampChips extends HTMLElement {

  // A band: lamplight-panel removes the stack gap between two bands. See LAMP_BAND_PAD.
  static get lampBand() { return true; }

  static getStubConfig() {
    return { label: '', chips: [{ entity: '', name: 'Run', icon: 'mdi:play' }] };
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.chips) || !config.chips.length) {
      throw new Error('lamplight-chips needs a list of `chips`');
    }
    config.chips.forEach(function (c, i) {
      if (!c) throw new Error('chip ' + (i + 1) + ' is empty');
      if (!c.entity && !c.tap_action) {
        throw new Error('chip ' + (i + 1) + ' needs an `entity` or a `tap_action`');
      }
      // With an entity, `name` and `icon` are optional (01-entity.js). Without one they are required.
      if (!c.entity && !c.name) throw new Error('chip ' + (i + 1) + ' needs a `name`');
      if (!c.entity && !c.icon) throw new Error('chip ' + (i + 1) + ' needs an `icon`');
      lampChipsMonths(c.months, 'chip ' + (i + 1));
      // Check the colour here, so that a chip out of season also shows a bad value.
      if (c.icon_color) {
        try { lampCssColour(c.icon_color, 'soft'); } catch (e) { throw new Error('chip ' + (i + 1) + ': ' + e.message); }
      }
      if (c.confirm !== undefined && (!c.confirm || !c.confirm.title)) {
        throw new Error('chip ' + (i + 1) + ': `confirm` needs a `title`');
      }
    });
    lampChipsMonths(config.months, 'lamplight-chips');
    this._config = config;
    this._month = new Date().getMonth() + 1;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const m = new Date().getMonth() + 1;
    // Draw again when the month changes, or when an entity gives another name or icon.
    const sig = this._config ? this._config.chips.map(function (c) {
      return lampEntityName(hass, c.entity, c.name) + '|' + lampEntityIcon(hass, c.entity, c.icon);
    }).join('\n') : '';
    if (this._config && (m !== this._month || sig !== this._labelSig)) {
      this._month = m; this._labelSig = sig; this._render();
    }
  }

  // True when chip `c` shows in the current month.
  _inSeason(c) {
    const months = c.months || this._config.months;
    return !months || months.indexOf(this._month) >= 0;
  }

  getCardSize() { return 2; }

  // The action a chip runs when its configuration gives none.
  _defaultTap(entity) {
    const domain = entity.split('.')[0];
    if (domain === 'script' || domain === 'scene') {
      return { action: 'perform-action', perform_action: domain + '.turn_on',
               target: { entity_id: entity } };
    }
    return { action: 'more-info' };
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const root = this.shadowRoot;
    root.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = LAMP_CHIPS_CSS;
    root.appendChild(style);

    const strip = document.createElement('div');
    strip.className = 'strip' + (lampOpt('chips', this._config, 'full_width') ? ' fill' : '') + (this._config.raised ? ' raised' : '');
    root.appendChild(strip);

    if (this._config.label) {
      const label = document.createElement('div');
      label.className = 'line label';
      const t = document.createElement('span');
      t.textContent = this._config.label;
      label.appendChild(t);
      strip.appendChild(label);
    }

    const self = this;
    const shown = this._config.chips.filter(function (c) { return self._inSeason(c); });
    shown.forEach(function (c) {
      strip.appendChild(self._chip(c));
    });
    this.style.display = shown.length || this._config.label ? '' : 'none';
  }

  _chip(c) {
    const self = this;
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    const cName = lampEntityName(this._hass, c.entity, c.name);
    chip.setAttribute('aria-label', cName);

    const i = document.createElement('ha-icon');
    i.setAttribute('icon', lampEntityIcon(this._hass, c.entity, c.icon));
    i.style.color = c.icon_color ? lampCssColour(c.icon_color, 'soft') : LAMP_CHIP_TEXT;
    chip.appendChild(i);

    const line = document.createElement('div');
    line.className = 'line';
    const t = document.createElement('span');
    t.textContent = cName;
    line.appendChild(t);
    chip.appendChild(line);

    const press = function () { chip.classList.add('pressed'); };
    const release = function () { chip.classList.remove('pressed'); };
    chip.addEventListener('pointerdown', press);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (e) {
      chip.addEventListener(e, release);
    });

    const act = function () {
      const tap = c.tap_action || self._defaultTap(c.entity);
      self.dispatchEvent(new CustomEvent('hass-action', {
        bubbles: true, composed: true,
        detail: { config: { entity: c.entity, tap_action: tap }, action: 'tap' }
      }));
    };
    // A chip with `confirm` opens the dialog. Only its confirm button runs the action.
    let asking = false;
    const run = function (ev) {
      ev.stopPropagation();
      if (!c.confirm) { act(); return; }
      if (asking) return;
      asking = true;
      lampConfirm(c.confirm).then(function (yes) {
        asking = false;
        if (yes) act();
      });
    };
    chip.addEventListener('click', run);
    chip.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); run(ev); }
    });
    return chip;
  }
}

customElements.define('lamplight-chips', LampChips);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-chips',
  name: 'Lamplight Chips',
  description: 'A strip of pill buttons with an optional label. A chip runs its script or scene.',
  preview: false
});
