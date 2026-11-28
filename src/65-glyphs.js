// The Lamplight weather glyph set. Fifteen pictures, lit and volumetric.
//
// WHY THIS EXISTS
// Until phase 5 the weather card held a stock `weather-forecast` as a child and
// let Home Assistant draw the condition glyphs. That cost two things: the card
// was coupled to sixteen of Home Assistant's private class names, and the only
// pictures on this dashboard the household had not chosen were the weather
// ones. Design document: design-docs/weather_glyph_options.html, option D,
// agreed 21 September 2026.
//
// NOTHING HERE IS COPIED. Home Assistant's own glyphs were read to measure what
// they draw and where they fail; every path below was drawn for this household
// on a 24-unit grid. The references the household chose are in
// weather-glyph-ideas/: colourful.png gave two cloud volumes instead of one
// silhouette, hyper-realistic.jpg gave a corona and weather that glows.
//
// THE RULES OF THE SET
//   the grid    24 units. Every drawing, corona included, stays inside it
//   the light   every gradient runs from a lit top right to a dark lower left,
//               because that is where this card's light pool stands
//   the cloud   one silhouette used three times: dim behind at 0.62, lit in
//               front at 0.92, and a smaller pair at 0.54 and 0.78 when a sun
//               or a moon shares the box
//   the marks   six and no more - a drop, a six-point flake, a round pellet, a
//               soft bar, a curled streak, a warm bolt
//
// Fewer and larger beats more and smaller at tile size, and no two pictures
// share a mark AND a count. That is what hail and sleet came down to: hail is
// one drop and two round pellets, sleet is one drop and one spiked flake.
//
// Wind is the one picture with no cloud, deliberately. When the wind is the
// story the cloud is not, and it puts the greatest distance between wind and
// fog - the other pair that was close, because both were pale strokes under
// the same cloud.
//
// THE IDENTIFIERS ARE SAFE. Every `url(#...)` below resolves inside the shadow
// root that holds the matching <defs>, because an id is scoped to its own tree.
// Two weather cards on one dashboard cannot take each other's gradients.

const LAMP_GLYPH_DEFS =
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
  '<radialGradient id="lg-sunC" cx="36%" cy="30%" r="78%">' +
    '<stop offset="0%" stop-color="#FFF3C4"/><stop offset="42%" stop-color="#FFCE4E"/>' +
    '<stop offset="100%" stop-color="#FF9E1B"/></radialGradient>' +
  '<filter id="lg-halo" x="-60%" y="-60%" width="220%" height="220%">' +
    '<feGaussianBlur stdDeviation="1.5"/></filter>' +
  '<linearGradient id="lg-moonC" x1="78%" y1="10%" x2="20%" y2="92%">' +
    '<stop offset="0%" stop-color="#FFFDF2"/><stop offset="55%" stop-color="#F0EED9"/>' +
    '<stop offset="100%" stop-color="#BCC3D4"/></linearGradient>' +
  '<linearGradient id="lg-clL" x1="88%" y1="2%" x2="22%" y2="100%">' +
    '<stop offset="0%" stop-color="#FBFDFF"/><stop offset="38%" stop-color="#DCE9FA"/>' +
    '<stop offset="100%" stop-color="#93AED4"/></linearGradient>' +
  '<linearGradient id="lg-clB" x1="88%" y1="2%" x2="22%" y2="100%">' +
    '<stop offset="0%" stop-color="#C8D8EE"/><stop offset="45%" stop-color="#93A9C8"/>' +
    '<stop offset="100%" stop-color="#5E7092"/></linearGradient>' +
  '<linearGradient id="lg-clD" x1="88%" y1="2%" x2="22%" y2="100%">' +
    '<stop offset="0%" stop-color="#DCE4F0"/><stop offset="40%" stop-color="#A8B8CE"/>' +
    '<stop offset="100%" stop-color="#63748E"/></linearGradient>' +
  '<linearGradient id="lg-clBD" x1="88%" y1="2%" x2="22%" y2="100%">' +
    '<stop offset="0%" stop-color="#9FAEC4"/><stop offset="45%" stop-color="#76869F"/>' +
    '<stop offset="100%" stop-color="#4B5A73"/></linearGradient>' +
  '<linearGradient id="lg-drop" x1="50%" y1="0%" x2="50%" y2="100%">' +
    '<stop offset="0%" stop-color="#9FE0FF"/><stop offset="100%" stop-color="#2E90E6"/></linearGradient>' +
  '<linearGradient id="lg-bolt" x1="20%" y1="0%" x2="80%" y2="100%">' +
    '<stop offset="0%" stop-color="#FFE07A"/><stop offset="55%" stop-color="#FFC02E"/>' +
    '<stop offset="100%" stop-color="#FF8A1E"/></linearGradient>' +
  '<linearGradient id="lg-flake" x1="80%" y1="0%" x2="20%" y2="100%">' +
    '<stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#C6DCF5"/></linearGradient>' +
  '<linearGradient id="lg-mist" x1="100%" y1="0%" x2="0%" y2="0%">' +
    '<stop offset="0%" stop-color="#EEF5FF"/><stop offset="70%" stop-color="#B9CBE6"/>' +
    '<stop offset="100%" stop-color="rgba(185,203,230,.30)"/></linearGradient>' +
  '<radialGradient id="lg-hail" cx="34%" cy="26%" r="76%">' +
    '<stop offset="0%" stop-color="#FFFFFF"/><stop offset="58%" stop-color="#DCEAFB"/>' +
    '<stop offset="100%" stop-color="#9DB6D6"/></radialGradient>' +
  '<linearGradient id="lg-alert" x1="76%" y1="4%" x2="24%" y2="100%">' +
    '<stop offset="0%" stop-color="#FFD97E"/><stop offset="48%" stop-color="#FFA83C"/>' +
    '<stop offset="100%" stop-color="#F2711C"/></linearGradient>' +
  '</defs></svg>';

// The one cloud silhouette. Three circles tangent to a flat base, joined by
// three arcs: centres (7.6,13.4) r4, (12.4,10.6) r5.4, (17,13.6) r3.8, base
// y 17.4. The arc junctions are the circle intersections, so the outline has no
// corner in it.
const LAMP_CLOUD =
  'M7.6 17.4A4 4 0 0 1 7.129 9.428A5.4 5.4 0 0 1 17.751 9.875A3.8 3.8 0 0 1 17 17.4Z';
const LAMP_MOON = 'M15.6 4A8.3 8.3 0 1 0 19.9 15.3A6.7 6.7 0 0 1 15.6 4Z';
const LAMP_BOLT = 'M14 15.1L9.8 21h2.6l-1.15 3 4.8-5.8h-2.6l1.45-3.1z';
const LAMP_ALERT =
  'M12 4.2 22.1 21.5H1.9Z M11.05 10.9h1.9v5.5h-1.9z M11.05 17.8h1.9v1.9h-1.9z';

// THE HALO. The sun, the moon and the alert each glow. The glow is a copy of
// the body under the body, in one flat colour, blurred by `lg-halo`. So the
// glow follows the outline of the body: it goes round the crescent and not
// across the dark side of the moon. Until 24 September 2026 each halo was a
// round gradient 1.6 to 1.8 times the radius of the body. Design document:
// design-docs/weather_halo_options.html, option B, strength 1.0.
//
// The colour is the inner stop of the old gradient. The alpha is higher than
// that stop, because the body covers the brightest part of the copy.
const LAMP_HALO = {
  sun:   'rgba(255,190,70,.85)',
  moon:  'rgba(246,242,200,.55)',
  alert: 'rgba(255,146,58,.70)'
};
const LAMP_ALERT_EDGE = 'M12 4.2 22.1 21.5H1.9Z';

function lampHalo(kind, shape) {
  return '<g filter="url(#lg-halo)" fill="' + LAMP_HALO[kind] + '">' + shape + '</g>';
}

function lampCloud(id, sc, x, y) {
  return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
         '<path d="' + LAMP_CLOUD + '" fill="url(#lg-' + id + ')"/></g>';
}
// The cloud high in the box, so the weather has room under it.
function lampCloudUp(front, back) {
  return lampCloud(back, 0.62, 8.2, -1.0) + lampCloud(front, 0.92, -0.5, -0.4);
}
// The same pair lower, when nothing falls out of it.
function lampCloudMid(front, back) {
  return lampCloud(back, 0.62, 8.2, 0.6) + lampCloud(front, 0.92, -0.5, 1.2);
}
// Smaller and down in the left corner, when a sun or a moon shares the box.
function lampCloudLow(front, back) {
  return lampCloud(back, 0.54, 7.0, 3.4) + lampCloud(front, 0.78, -0.8, 4.4);
}

// `k` scales the drop about its own tip, so sleet can carry one large drop
// where rain carries three ordinary ones.
function lampDrop(x, y, k) {
  k = k || 1;
  return 'M' + x + ' ' + y +
    'c' + (-0.9 * k) + ' ' + (1.2 * k) + ' ' + (-1.38 * k) + ' ' + (1.9 * k) +
    ' ' + (-1.38 * k) + ' ' + (2.46 * k) +
    'a' + (1.38 * k) + ' ' + (1.38 * k) + ' 0 0 0 ' + (2.76 * k) + ' 0' +
    'c0 ' + (-0.56 * k) + ' ' + (-0.48 * k) + ' ' + (-1.26 * k) + ' ' +
    (-1.38 * k) + ' ' + (-2.46 * k) + 'z';
}
function lampFlake(x, y, r) {
  let d = '';
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI / 3;
    d += 'M' + (x - Math.cos(a) * r).toFixed(2) + ' ' + (y - Math.sin(a) * r).toFixed(2) +
         'L' + (x + Math.cos(a) * r).toFixed(2) + ' ' + (y + Math.sin(a) * r).toFixed(2);
  }
  return '<path d="' + d + '" stroke="url(#lg-flake)" stroke-width="' +
         (r * 0.52).toFixed(2) + '" stroke-linecap="round" fill="none"/>';
}
function lampPellet(x, y, r) {
  return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#lg-hail)"/>';
}
function lampBar(x, y, w) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w +
         '" height="1.85" rx=".92" fill="url(#lg-mist)"/>';
}
function lampStreak(d, w) {
  return '<path d="' + d + '" fill="none" stroke="url(#lg-mist)" stroke-width="' +
         (w || 1.7) + '" stroke-linecap="round"/>';
}
function lampRays(cx, cy, r0, r1, w) {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    d += 'M' + (cx + Math.cos(a) * r0).toFixed(2) + ' ' + (cy + Math.sin(a) * r0).toFixed(2) +
         'L' + (cx + Math.cos(a) * r1).toFixed(2) + ' ' + (cy + Math.sin(a) * r1).toFixed(2);
  }
  return '<path d="' + d + '" fill="none" stroke="url(#lg-sunC)" stroke-width="' + w +
         '" stroke-linecap="round"/>';
}

// The fifteen pictures.
const LAMP_GLYPHS = {
  'sunny': function () {
    return lampHalo('sun', '<circle cx="12" cy="12" r="6.7"/>') +
           '<circle cx="12" cy="12" r="6.7" fill="url(#lg-sunC)"/>';
  },
  'clear-night': function () {
    return lampHalo('moon', '<path d="' + LAMP_MOON + '"/>') +
           '<path d="' + LAMP_MOON + '" fill="url(#lg-moonC)"/>';
  },
  'partlycloudy-day': function () {
    return lampHalo('sun', '<circle cx="16.8" cy="7" r="4.3"/>') +
           '<circle cx="16.8" cy="7" r="4.3" fill="url(#lg-sunC)"/>' +
           lampCloudLow('clL', 'clB');
  },
  // The blur is outside the transform, so its radius is in grid units, the
  // same as on the full-size moon.
  'partlycloudy-night': function () {
    const moon = '<g transform="translate(10.2,1.4) scale(.46)"><path d="' + LAMP_MOON + '"';
    return lampHalo('moon', moon + '/></g>') +
           moon + ' fill="url(#lg-moonC)"/></g>' + lampCloudLow('clL', 'clB');
  },
  'cloudy': function () { return lampCloudMid('clL', 'clB'); },
  'fog': function () {
    return lampCloudUp('clL', 'clB') + lampBar(4.2, 16.8, 14.2) + lampBar(6.8, 20.0, 11.2);
  },
  'windy': function () {
    return lampStreak('M2.6 8h11.6a2.9 2.9 0 1 0-2.9-2.9', 2.5) +
           lampStreak('M2.2 13.6h15a2.6 2.6 0 1 1-2.6 2.6', 2.5) +
           lampStreak('M3.6 21.4h8.4', 2.5);
  },
  'rainy': function () {
    return lampCloudUp('clD', 'clBD') + '<path d="' +
      lampDrop(8.2, 16.4) + lampDrop(12.2, 17.7) + lampDrop(16.2, 16.4) +
      '" fill="url(#lg-drop)"/>';
  },
  'pouring': function () {
    return lampCloudUp('clD', 'clBD') + '<path d="' +
      lampDrop(7.2, 16.1, 1) + lampDrop(10.4, 17.7, 1) + lampDrop(13.6, 16.1, 1) +
      lampDrop(16.8, 17.7, 1) + lampDrop(12, 20.3) + '" fill="url(#lg-drop)"/>';
  },
  'hail': function () {
    return lampCloudUp('clD', 'clBD') +
      '<path d="' + lampDrop(8.2, 16.5) + '" fill="url(#lg-drop)"/>' +
      lampPellet(13.0, 17.9, 2.1) + lampPellet(17.3, 20.9, 1.75);
  },
  'snowy': function () {
    return lampCloudUp('clD', 'clBD') +
      lampFlake(8.2, 17.8, 2.05) + lampFlake(12.4, 20.6, 2.05) + lampFlake(16.3, 17.5, 2.05);
  },
  'snowy-rainy': function () {
    return lampCloudUp('clD', 'clBD') +
      '<path d="' + lampDrop(8.6, 16.6, 1.25) + '" fill="url(#lg-drop)"/>' +
      lampFlake(15.8, 18.6, 2.8);
  },
  'lightning': function () {
    return lampCloudUp('clD', 'clBD') + '<path d="' + LAMP_BOLT + '" fill="url(#lg-bolt)"/>';
  },
  'lightning-rainy': function () {
    return lampCloudUp('clD', 'clBD') + '<path d="' + LAMP_BOLT + '" fill="url(#lg-bolt)"/>' +
      '<path d="' + lampDrop(6.9, 16.4) + lampDrop(18.3, 16.4) + '" fill="url(#lg-drop)"/>';
  },
  'exceptional': function () {
    return lampHalo('alert', '<path d="' + LAMP_ALERT_EDGE + '"/>') +
      '<path d="' + LAMP_ALERT + '" fill="url(#lg-alert)" fill-rule="evenodd"/>';
  }
};

// The condition string, plus whether that hour is dark, gives one picture.
// Sixteen strings, fifteen pictures: the two windy strings share one, and
// `partlycloudy` has a day form and a night form. A condition nobody has heard
// of draws a cloud, which is the quietest wrong answer available.
function lampGlyphKey(condition, night) {
  switch (condition) {
    case 'sunny': return night ? 'clear-night' : 'sunny';
    case 'clear-night': return 'clear-night';
    case 'partlycloudy': return night ? 'partlycloudy-night' : 'partlycloudy-day';
    case 'windy':
    case 'windy-variant': return 'windy';
    case 'cloudy': case 'fog': case 'rainy': case 'pouring': case 'hail':
    case 'snowy': case 'snowy-rainy': case 'lightning': case 'lightning-rainy':
    case 'exceptional': return condition;
    default: return 'cloudy';
  }
}

function lampGlyph(key, px) {
  const build = LAMP_GLYPHS[key] || LAMP_GLYPHS.cloudy;
  // `data-glyph` names the picture. Nothing reads it to draw; it is there so a
  // test, and a person with the inspector open, can see which of the fifteen
  // was chosen without matching path data.
  return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 24 24" ' +
         'data-glyph="' + lampEsc(key) + '" aria-hidden="true" focusable="false">' +
         build() + '</svg>';
}

// NO TILE WASH. Until 24 September 2026 each forecast hour had a round
// radial gradient behind it, in a colour from a table here keyed by the same
// string as the glyph. It was 84px wide round a 22px glyph, and when the halo
// began to follow the body it was the only round shape left on the card. The
// household removed it. The glyph and its halo are now the only light in a
// tile. Master design 6.18.

// The words on the card. Household wording, not Home Assistant's: "Sleet", not
// "Snowy rainy". Each one matches the word the rain sentence already uses for
// the same weather, so the state and the sentence cannot say two things.
// Agreed 21 September 2026.
const LAMP_CONDITION_WORD = {
  'sunny': 'Sunny',
  'clear-night': 'Clear',
  'partlycloudy-day': 'Partly cloudy',
  'partlycloudy-night': 'Partly cloudy',
  'cloudy': 'Cloudy',
  'fog': 'Fog',
  'windy': 'Windy',
  'rainy': 'Rain',
  'pouring': 'Heavy rain',
  'hail': 'Hail',
  'snowy': 'Snow',
  'snowy-rainy': 'Sleet',
  'lightning': 'Thunder',
  'lightning-rainy': 'Thunder and rain',
  'exceptional': 'Unusual weather'
};
