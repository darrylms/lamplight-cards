// The name and icon of a card that shows one entity (22 Nov 2026, Lamplight 0.143.0-dev).
//
// The household can give a `name` and an `icon` in the card config. A value the household gives
// always wins. If the household gives none, the card reads the entity: `friendly_name` and
// `attributes.icon`. If the entity has no icon, the card uses the icon of its domain below.
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

function lampEntityName(hass, entityId, given) {
  if (given) return given;
  const s = hass && hass.states && hass.states[entityId];
  return (s && s.attributes && s.attributes.friendly_name) || entityId || '';
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
