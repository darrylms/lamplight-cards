// THE LIT EDGE
// From Lamplight 0.90.0-dev, option 10 "Lit Edges" of design-docs/visual_refresh_options.html
// (revision 4). The household chose it on 12 November 2026.
//
// A flat plate in a row gets a 1px edge that is brighter on the side the light comes from,
// the top right, and fades toward the bottom left. This is the rule of d-092 for a panel's
// rim: a flat line of one strength reads as an outline round a picture, and a graded line
// reads as a lit object. The plate itself stays flat: no sheen, no inner shade, no glow.
//
// The edge is its own element, because the plates have a see-through fill. A gradient in the
// border box would show through the fill. The host gives up its 1px border and takes 1px of
// padding in its place, so its size does not change. The edge then lies over that padding,
// and a mask cuts it to a ring 1px wide.
//
// The strengths, [at the lit corner, at 58% of the way across]. The far corner is LAMP_EDGE.tail.
//   lit   an icon tile that is on, in its own colour. The old border was 0.26 all round.
//   off   an icon tile that is off, in white. The old border was 0.10 all round.
//   bar   the Scenes bar, in white. The old border was 0.10 all round. It stays under half of
//         the slider glass's rim, so the slider stays the stronger control (section 10).
const LAMP_EDGE = { lit: [0.30, 0.09], off: [0.17, 0.05], bar: [0.24, 0.06], tail: 0.02, angle: 225 };

// Add an edge to a host. The host must give up its border for 1px of padding.
function lampEdge(host, radius) {
  if (!host.style.position) host.style.position = 'relative';
  const e = document.createElement('span');
  e.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;box-sizing:border-box;' +
    'padding:1px;pointer-events:none;border-radius:' + radius;
  // The ring: the content box is cut out of the whole box. Both syntaxes, for Safari and Chrome.
  e.style.setProperty('-webkit-mask', 'linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)');
  e.style.setProperty('-webkit-mask-composite', 'xor');
  e.style.setProperty('mask', 'linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)');
  e.style.setProperty('mask-composite', 'exclude');
  host.appendChild(e);
  return e;
}

// Paint an edge. rgb is "r,g,b"; a is one of the LAMP_EDGE pairs, or null for no edge.
function lampEdgePaint(e, rgb, a) {
  if (!e) return;
  e.style.background = a
    ? 'linear-gradient(' + LAMP_EDGE.angle + 'deg,rgba(' + rgb + ',' + a[0] + '),rgba(' + rgb + ',' +
      a[1] + ') 58%,rgba(' + rgb + ',' + LAMP_EDGE.tail + '))'
    : 'none';
}
