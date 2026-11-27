// lampConfirm. A dialog that asks before an action that is hard to undo.
//
// WHY LAMPLIGHT DRAWS ITS OWN (30 Oct 2026, design-docs/plug_guard_options.html, option 4b)
// The household chose a dialog with its own title and its own button words. Home Assistant has
// one, `dialog-box`, but it is not loaded when the page opens: it loads only after HA shows its
// first confirmation. The first tap after each page load would then show the stock "Are you sure?
// / OK" dialog. It is also not a documented card API. So this module draws the same dialog
// itself, copied from HA's dialog as measured live on 30 Oct 2026: 9px from each side at 375px,
// radius 32px, a dark glass with an 18px blur, the title 20/500/24px, the text 14px, pill
// buttons. The buttons are 44px tall, not HA's 40px, because a 44px row is a thumb target (Law
// 09.1).
//
// THE SAFE ANSWER IS THE EASY ANSWER. The dismiss button has the focus. Escape, a tap outside the
// dialog, the back gesture and any change of view all dismiss. Only the confirm button confirms.
//
// NO EXIT ANIMATION. The dialog leaves the page at once. A close that waits for `transitionend`
// can leave a backdrop over the view when the view changes during the transition (critique F25,
// the same fault in lamplight-popup).
//
//   lampConfirm({ title, text, confirm, dismiss, accent }) -> Promise<boolean>
//     title    required. A question: "Turn off the Modem?"
//     text     optional. What stops working
//     confirm  default 'Turn off'. Drawn in the alert red: the action is destructive
//     dismiss  default 'Cancel'

const LAMP_CONFIRM_RED = '163,40,58';
const LAMP_CONFIRM_DISMISS = 'rgb(149,181,203)';

function lampConfirm(opts) {
  return new Promise(function (resolve) {
    const host = document.createElement('lamplight-confirm');
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:block';
    const root = host.attachShadow({ mode: 'open' });
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.innerHTML =
      '<style>' +
      ':host{font-family:var(--primary-font-family,Roboto,Noto,sans-serif)}' +
      '.scrim{position:absolute;inset:0;background:rgba(0,0,0,0.42)}' +
      '.box{position:absolute;left:9px;right:9px;top:50%;transform:translateY(-50%);' +
      'max-width:560px;margin:0 auto;box-sizing:border-box;padding:22px 24px 16px;border-radius:32px;' +
      'background:rgba(2,6,11,0.35);-webkit-backdrop-filter:blur(18px) saturate(1.2);' +
      'backdrop-filter:blur(18px) saturate(1.2);color:rgba(234,235,238,0.98);' +
      'box-shadow:0 24px 64px rgba(0,0,0,0.48),0 2px 8px rgba(0,0,0,0.28);' +
      'border:1px solid rgba(255,255,255,0.08)}' +
      (reduce ? '' : '.box{animation:lc-in .16s ease-out}.scrim{animation:lc-fade .16s ease-out}' +
        '@keyframes lc-in{from{opacity:0;transform:translateY(-50%) scale(.96)}}' +
        '@keyframes lc-fade{from{opacity:0}}') +
      'h2{margin:0 0 18px;font-size:20px;font-weight:500;line-height:24px;letter-spacing:normal}' +
      'p{margin:0 0 22px;font-size:var(--lamplight-t-body);line-height:1.45}' +
      '.bt{display:flex;justify-content:flex-end;gap:8px}' +
      'button{font:inherit;font-size:var(--lamplight-t-body);font-weight:500;height:44px;padding:0 18px;border-radius:9999px;' +
      'border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      'button:focus-visible{outline:2px solid rgba(255,255,255,0.7);outline-offset:2px}' +
      '.no{background:transparent;color:' + LAMP_CONFIRM_DISMISS + '}' +
      '.yes{background:rgb(' + LAMP_CONFIRM_RED + ');color:#fff}' +
      '</style>' +
      '<div class="scrim"></div>' +
      '<div class="box" role="alertdialog" aria-modal="true" aria-labelledby="t" aria-describedby="d">' +
      '<h2 id="t"></h2><p id="d"></p>' +
      '<div class="bt"><button class="no" type="button"></button>' +
      '<button class="yes" type="button"></button></div></div>';
    root.getElementById('t').textContent = opts.title;
    const d = root.getElementById('d');
    if (opts.text) d.textContent = opts.text; else d.remove();
    const no = root.querySelector('.no'), yes = root.querySelector('.yes');
    no.textContent = opts.dismiss || 'Cancel';
    yes.textContent = opts.confirm || 'Turn off';

    let done = false;
    const finish = function (answer) {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('popstate', onLeave);
      window.removeEventListener('location-changed', onLeave);
      host.remove();
      resolve(answer);
    };
    const onKey = function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); finish(false); }
    };
    const onLeave = function () { finish(false); };
    no.addEventListener('click', function () { finish(false); });
    yes.addEventListener('click', function () { finish(true); });
    root.querySelector('.scrim').addEventListener('click', function () { finish(false); });
    // The page must not scroll under the dialog.
    host.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('popstate', onLeave);
    window.addEventListener('location-changed', onLeave);

    document.body.appendChild(host);
    no.focus({ preventScroll: true });
  });
}
