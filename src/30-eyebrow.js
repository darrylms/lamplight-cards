// The eyebrow header. The first thing in every panel: an icon and an uppercase
// label, and nothing else.
//
// master_design.html section 10 settled the right-hand slot on 19 September
// 2026: it is empty, and it stays empty. The eyebrow names the card; it does
// not report on it. Do not add a second field here.
//
// The numbers come from the button-card eyebrows this replaces, which measure
// 37.98px on all sixteen panels. Padding 17/16/8 with a 13px icon row gives
// the same figure, because the 10px label's line box is shorter than the icon.
//
// THE EYEBROW IS CENTRED IN ITS BAND. The band runs from the panel's top edge
// to the first divider: the 38px eyebrow and the 8px gap below it. With
// padding 14/11 the icon and label had 14-15px above them and 20-22px below.
// Padding 17/8 moves them 3px down, and the eyebrow is still 38px. The icon
// also sat 0.25-0.5px below the label's capitals, because the flex row centres
// it on the label's line box, which has room for descenders. It is lifted
// 0.5px. The label cannot move by less than a pixel; the icon can. After both,
// each group is within 0.5px of the band's centre and the icon within 0.25px
// of the capitals. Measured on all 16 panels, 24 September 2026, Lamplight
// 0.16.2-dev.
//
// Quiet text has two steps (F05, option 2, 0.48.0-dev). The eyebrow, the sub-lines and the
// chips are white 56%. The counts, the units and the pop-up eyebrows are white 50%. White 50%
// fails on the wallpaper and on the Batteries tile (4.46:1), so do not put that step there.
// design-docs/secondary_text_contrast_options.html.

function lampEyebrow(icon, label) {
  const wrap = document.createElement('div');
  wrap.className = 'lamp-eyebrow';
  wrap.style.cssText = 'padding:17px 16px 8px;font-size:var(--lamplight-t-label);font-weight:600;' +
    'letter-spacing:0.16em;text-transform:uppercase;color:var(--lamplight-ink-soft)';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:9px';

  if (icon) {
    const i = document.createElement('ha-icon');
    i.setAttribute('icon', icon);
    // line-height:0 is the icon Law of section 08. Without it ha-svg-icon sits
    // on a text baseline and the glyph renders low.
    i.style.cssText = '--mdc-icon-size:13px;width:13px;height:13px;margin:0;' +
      'display:flex;align-items:center;justify-content:center;line-height:0;' +
      'transform:translateY(-0.5px)';
    row.appendChild(i);
  }
  row.appendChild(document.createTextNode(label || ''));
  wrap.appendChild(row);
  return wrap;
}
