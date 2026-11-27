// lamplight-spacer. The blank space at the foot of a view.
//
// master_design.html section 09 sets it to 70px: the last panel must clear the
// phone's home indicator. It draws nothing and has no ha-card, so the theme has
// nothing to override.
//
// Configuration:
//   height   a CSS length, or a number of px. Default 70px

const LAMP_SPACER_HEIGHT = '70px';

class LampSpacer extends HTMLElement {

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const h = config && config.height;
    let css = LAMP_SPACER_HEIGHT;
    if (typeof h === 'number' && isFinite(h)) css = h + 'px';
    else if (typeof h === 'string' && h.trim()) css = h.trim();
    else if (h !== undefined && h !== null) throw new Error('height must be a length, for example 70px');
    this._height = css;
    this.style.display = 'block';
    this.style.height = css;
  }

  set hass(h) { /* nothing reads the state */ }

  getCardSize() { return 2; }
}

customElements.define('lamplight-spacer', LampSpacer);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lamplight-spacer',
  name: 'Lamplight Spacer',
  description: 'Blank space at the foot of a view, so the last card clears the home indicator. Default 70px.',
  preview: false
});
