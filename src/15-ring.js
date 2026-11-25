// The brightness ring. A 2px arc around a 32px toggle, from 9 o'clock and
// clockwise, that fills to the light's brightness over a faint full track.
// lamplight-rooms and lamplight-light use it.
//
// It is an SVG stroke and not a masked conic-gradient. A hard gradient stop is
// not anti-aliased, so at DPR 1 the conic arc stepped at its edges and its end.
// A stroke is anti-aliased at every DPR. The lit toggle also lost its border,
// because at DPR 1 a 1-device-pixel gap between the border and the ring showed
// two circles. One design for every screen, so Law 09.2 holds.
// design-docs/brightness_ring_low_dpi_options.html, option 3, 2 October 2026.
//
// The geometry did not change: a 38 x 38 box at inset -4px from the toggle's
// padding box (-3px from its border box), and a band from radius 17 to 19.

const LAMP_RING_R = 18;                         // the band is radius 17 to 19
const LAMP_RING_LEN = 2 * Math.PI * LAMP_RING_R;

// The ring element. Append it as the toggle's first child. It is hidden until
// lampRingPaint() gives it a percentage.
function lampRingCreate() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 38 38');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;inset:-4px;width:38px;height:38px;' +
    'overflow:visible;pointer-events:none;display:none';
  const track = document.createElementNS(NS, 'circle');
  const arc = document.createElementNS(NS, 'circle');
  [track, arc].forEach(function (c) {
    c.setAttribute('cx', '19'); c.setAttribute('cy', '19');
    c.setAttribute('r', String(LAMP_RING_R));
    c.setAttribute('fill', 'none'); c.setAttribute('stroke-width', '2');
  });
  // The full track stays under the arc. A track cut to the unfilled part
  // leaves a thin seam where two butt ends meet at the same angle.
  track.setAttribute('stroke', 'rgba(255,255,255,0.07)');
  arc.setAttribute('stroke-linecap', 'butt');
  // A circle's stroke starts at 3 o'clock. 180 degrees puts the start at
  // 9 o'clock, where conic-gradient(from -90deg) started.
  arc.setAttribute('transform', 'rotate(180 19 19)');
  svg.appendChild(track);
  svg.appendChild(arc);
  return svg;
}

// pct null hides the ring. rgb is 'r,g,b'.
function lampRingPaint(svg, pct, rgb, alpha) {
  if (pct === null) { svg.style.display = 'none'; return; }
  const arc = svg.lastChild;
  arc.setAttribute('stroke', 'rgba(' + rgb + ',' + alpha + ')');
  arc.setAttribute('stroke-dasharray',
    lampRound(LAMP_RING_LEN * pct / 100, 3) + ' ' + lampRound(LAMP_RING_LEN, 3));
  svg.style.display = 'block';
}
