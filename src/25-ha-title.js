// The Home Assistant title. A card with `hide_ha_title: true` hides the view title in
// Home Assistant's own toolbar while the card is on the screen.
//
// Option 2 of design-docs/header_title_options.html. Chosen by the household on
// 1 November 2026. The toolbar title repeated the room name that lamplight-header
// shows 56px below it.
//
// The toolbar is in the shadow root of `hui-root`, outside the dashboard config.
// The card finds that hui-root above itself and adds one style rule to its shadow
// root. The rule hides only the title. The back arrow, the sidebar button and the
// menu stay, so "Edit dashboard" stays in the menu. In edit mode the rule does
// not match, and the edit toolbar keeps its own title.
//
// The rule uses three private class names of Home Assistant: `edit-mode`,
// `header` and `main-title`. If a release renames one, the rule matches nothing
// and the title shows again. Nothing else breaks.
//
// Only a dashboard with such a card is changed. When the last card that asks
// leaves the screen, the rule is removed. The removal waits one task, so that a
// view change from one such card to the next does not show the title for a frame.
//
// Configuration, on lamplight-header and lamplight-weather:
//   hide_ha_title  true hides the toolbar title. Omitted, nothing changes

const LAMP_HA_TITLE_RULE = 'div:not(.edit-mode) > .header .main-title { visibility: hidden; }';

// hui-root -> the set of cards that ask it to hide its title.
const lampHaTitleOwners = new Map();

// The hui-root above `el`, across shadow roots. Null when the card is not in a
// dashboard view, for example in the card editor's preview.
function lampHuiRoot(el) {
  let n = el;
  while (n) {
    if (n.tagName === 'HUI-ROOT') return n;
    n = n.parentNode || n.host;
  }
  return null;
}

function lampHaTitleApply(root) {
  const sr = root.shadowRoot;
  if (!sr) return;
  const owners = lampHaTitleOwners.get(root);
  let style = sr.querySelector('style[data-lamp-ha-title]');
  if (owners && owners.size) {
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-lamp-ha-title', '');
      style.textContent = LAMP_HA_TITLE_RULE;
      sr.appendChild(style);
    }
  } else {
    if (style) style.remove();
    lampHaTitleOwners.delete(root);
  }
}

// Call from connectedCallback, disconnectedCallback and setConfig. `hide` is
// true when the card is connected and its config asks for it.
function lampHaTitle(card, hide) {
  if (hide) {
    const root = lampHuiRoot(card);
    if (!root) return;
    if (card._lampHaRoot && card._lampHaRoot !== root) lampHaTitle(card, false);
    card._lampHaRoot = root;
    if (!lampHaTitleOwners.has(root)) lampHaTitleOwners.set(root, new Set());
    lampHaTitleOwners.get(root).add(card);
    lampHaTitleApply(root);
    return;
  }
  const root = card._lampHaRoot;
  if (!root) return;
  card._lampHaRoot = null;
  const owners = lampHaTitleOwners.get(root);
  if (owners) owners.delete(card);
  setTimeout(function () { lampHaTitleApply(root); }, 0);
}

function lampHaTitleWanted(card) {
  return !!(card.isConnected && card._config && card._config.hide_ha_title === true);
}
