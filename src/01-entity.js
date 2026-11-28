// The name and icon of a card that shows one entity (22 Nov 2026, Lamplight 0.143.0-dev).
//
// The household can give a `name` and an `icon` in the card config. A value the household gives
// always wins. If the household gives none, the card reads the entity: its name and
// `attributes.icon`. If the entity has no icon, the card uses the icon of its domain below.
//
// The name (28 Nov 2026, Lamplight 1.1.3-dev). Home Assistant will remove the `friendly_name`
// attribute in a future release. From HA 2026.4, `hass.formatEntityName()` builds the name from
// the registry, as the built-in cards do. The card uses it first. On an older HA, or if it gives
// an empty name, the card uses `friendly_name`, then the entity ID. The default parts are the
// device name and the entity name, which give the same text as `friendly_name` (127 of 127
// entities on the household's dashboard, measured 28 Nov 2026). Each part must be an object:
// HA shows a string part as literal text.
//
// Name parts in the config (28 Nov 2026, Lamplight 1.1.3-dev). A `name` is text, one name part,
// or a list of name parts, in the form of HA's own cards: { type: area | device | entity | floor }
// or { type: text, text: '...' }. HA joins the parts with a space and skips an empty part. It
// does not remove a word that two parts share. A bare string in a list is text. If the parts give
// an empty name, the card uses `friendly_name`, then the entity ID.
// The entity is not known until Home Assistant sends `hass`, so a card calls these in its
// `set hass` and draws again only when a result changes.

// Escape a value for HTML text and for an attribute in single or double quotes. Use it on each
// entity value, config string and feed value that a card writes into innerHTML. This is the one
// escape helper for all cards: do not write a copy in a card (28 Nov 2026).
function lampEsc(x) {
  return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

const LAMP_DOMAIN_ICONS = {
  light: 'mdi:lightbulb-outline',
  switch: 'mdi:toggle-switch-variant-outline',
  fan: 'mdi:fan',
  script: 'mdi:script-text-outline',
  scene: 'mdi:palette-outline',
  automation: 'mdi:robot-outline',
  input_boolean: 'mdi:toggle-switch-outline',
  lock: 'mdi:lock-outline',
  cover: 'mdi:window-shutter',
  button: 'mdi:gesture-tap-button',
  sensor: 'mdi:eye-outline',
  binary_sensor: 'mdi:checkbox-blank-circle-outline'
};

const LAMP_BINARY_ICONS = {
  window: 'mdi:window-closed-variant',
  door: 'mdi:door-closed',
  garage_door: 'mdi:garage',
  motion: 'mdi:motion-sensor',
  battery: 'mdi:battery-outline'
};

const LAMP_NAME_PARTS = [{ type: 'device' }, { type: 'entity' }];

// The name that Home Assistant builds from the registry, or '' if this HA has no helper.
// `parts` is one part or a list of parts, for example { type: 'device' }.
function lampHaName(hass, s, parts) {
  if (!s || !hass || typeof hass.formatEntityName !== 'function') return '';
  try {
    return String(hass.formatEntityName(s, parts || LAMP_NAME_PARTS) || '').trim();
  } catch (e) {
    return '';
  }
}

// The text of a config `name`, or '' if the name is name parts or is not given.
function lampNameText(given) {
  if (typeof given === 'string') return given;
  if (typeof given === 'number') return String(given);
  return '';
}

// The name parts of a config `name`, or null if the name is text or is not given.
function lampNameParts(given) {
  if (!given || typeof given !== 'object') return null;
  const parts = (Array.isArray(given) ? given : [given])
    .map(function (p) { return typeof p === 'string' ? { type: 'text', text: p } : p; })
    .filter(function (p) { return p && typeof p.type === 'string'; });
  return parts.length ? parts : null;
}

function lampEntityName(hass, entityId, given, parts) {
  const text = lampNameText(given);
  if (text) return text;
  const s = hass && hass.states && hass.states[entityId];
  return lampHaName(hass, s, lampNameParts(given) || parts) ||
    (s && s.attributes && s.attributes.friendly_name) || entityId || '';
}

function lampEntityIcon(hass, entityId, given) {
  if (given) return given;
  const s = hass && hass.states && hass.states[entityId];
  const a = s && s.attributes;
  if (a && a.icon) return a.icon;
  const domain = String(entityId || '').split('.')[0];
  if (domain === 'binary_sensor' && a && LAMP_BINARY_ICONS[a.device_class]) {
    return LAMP_BINARY_ICONS[a.device_class];
  }
  return LAMP_DOMAIN_ICONS[domain] || 'mdi:circle-outline';
}
