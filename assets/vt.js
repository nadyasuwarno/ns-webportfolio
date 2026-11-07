/* Page transitions: only the one piece of work that really links two pages travels between them.
   A home card and its case study hero morph into each other when both are on screen;
   every other shared name is dropped, so nothing flies in from off screen or pops in crisp. */
(() => {
  const SEL = '.vt-bibble, .vt-wm, .vt-mosaic';
  const file = u => { try { return new URL(u, location.href).pathname.split('/').pop() || 'index.html'; } catch (_) { return ''; } };
  const onScreen = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 60 && r.top < innerHeight; };
  const belongs = (el, other) => {
    const href = el.getAttribute('href');
    if (href) return file(href) === other;   // a home card travels only to its own case study
    return other === 'home.html';            // a case study hero travels only back to Home
  };
  const prune = other => document.querySelectorAll(SEL).forEach(el => {
    if (!onScreen(el) || !belongs(el, other)) el.style.viewTransitionName = 'none';
  });
  const restore = () => document.querySelectorAll(SEL).forEach(el => { el.style.viewTransitionName = ''; });

  addEventListener('pageswap', e => {
    if (!e.viewTransition) return;
    const to = e.activation && e.activation.entry ? e.activation.entry.url : '';
    prune(file(to));
  });
  addEventListener('pagereveal', e => {
    if (!e.viewTransition) return;
    const nav = window.navigation;
    const from = (nav && nav.activation && nav.activation.from && nav.activation.from.url) || document.referrer;
    prune(file(from));
    e.viewTransition.finished.finally(restore);
  });
  addEventListener('pageshow', e => { if (e.persisted) restore(); });
})();
