// The glass lamp. lamplight-routines (src/89-routines.js) draws it with lamp: glass. Until 0.152.0-dev the
// foot panels (src/21-strip.js) drew it too; they now draw a gauge.
//
// A lamp is a round box with three parts: the glass, a lit layer on top of the glass, and an icon.
// Each function below returns one CSS string. The card writes the string to the part named here.
//   glass      the box background (lampGlassCss) and the box-shadow rim and glow (lampGlowCss)
//   lit layer  the background (lampLitCss), the inset rim (lampLitRing) and the opacity (lampLitOpacity)
//   icon       the colour (lampIconInk) and the filter (lampIconFilter)
// `acc` is the lamp colour and `wash` is the glow colour, both as "r,g,b". `s` is the strength, 0 to 1.
// `glass` is an optional colour for the unlit glass, and `mix` is how much of it the glass holds.
// The lamp is lit when s > 0.
//
// THE DEEP GLASS (option 7 of design-docs/house_scenes_journey_options.html, 6 November 2026).
// A dark base with strong local light: a soft glow at the top left, a soft glow at the bottom middle,
// and a thin rim that is brightest at the top and the foot. Each highlight is the lamp's own colour
// mixed towards white, not white, and each lies over opaque colour stops. So the grey patch of option 14
// of the Routines rework cannot return. The glass and the lit layer each hold their own highlights, so
// the lit layer's opacity fades from one to the other.
// lamplight-routines adds its own 3s transition.

function lampHighlights(T) {
  return 'radial-gradient(ellipse 42% 32% at 30% 18%, rgba(' + T + ',0.55) 0%, rgba(' + T + ',0.20) 52%, rgba(' + T + ',0) 100%), ' +
    'radial-gradient(ellipse 60% 26% at 50% 100%, rgba(' + T + ',0.58) 0%, rgba(' + T + ',0.20) 55%, rgba(' + T + ',0) 100%)';
}

function lampRim(T) {
  return 'inset 0 1px 1px rgba(' + T + ',0.55), inset 0 -1px 1px rgba(' + T + ',0.45), inset 0 0 0 1px rgba(' + T + ',0.12)';
}

// The highlight colour of the unlit glass. A saturated `glass` colour needs less white to stay its colour.
function lampGlassLight(acc, glass) {
  return glass ? lampMix(glass, '255,255,255', 0.62) : lampMix(acc, '255,255,255', 0.72);
}

function lampGlassCss(acc, glass, mix) {
  const tint = glass || acc;
  const base = lampMix(lampMix('44,45,52', tint, mix || 0.31), '255,255,255', 0.03);
  return lampHighlights(lampGlassLight(acc, glass)) + ', ' +
    'radial-gradient(circle at 50% 46%, rgb(' + lampMix(base, tint, 0.06) + ') 0%, rgb(' + base +
    ') 60%, rgb(' + lampMix(base, '0,0,0', 0.06) + ') 100%)';
}

function lampLitCss(acc) {
  return lampHighlights(lampMix(acc, '255,255,255', 0.60)) + ', ' +
    'radial-gradient(circle at 50% 46%, rgb(' + lampMix(acc, '0,0,0', 0.05) +
    ') 0%, rgb(' + lampMix(acc, '0,0,0', 0.10) + ') 100%)';
}

function lampLitRing(acc) {
  return lampRim(lampMix(acc, '255,255,255', 0.60));
}

function lampLitOpacity(s) {
  return s > 0 ? (0.45 + 0.55 * s).toFixed(3) : '0';
}

function lampGlowCss(acc, wash, s, glass) {
  const on = s > 0, T = lampGlassLight(acc, glass);
  return lampRim(T) + ', 0 0 3px rgba(' + T + ',0.18), 0 0 ' + Math.round(12 + 26 * s) +
    'px rgba(' + wash + ',' + (on ? (0.35 + 0.4 * s).toFixed(2) : '0') + ')';
}

function lampIconInk(acc, on, glass) {
  return on ? '#fff' : 'rgb(' + lampMix(glass || acc, '255,255,255', 0.74) + ')';
}

function lampIconFilter(wash, on) {
  return 'drop-shadow(0 0 2px rgba(' + lampMix(wash, '0,0,0', 0.3) + ',' + (on ? '0.9' : '0') + '))';
}
