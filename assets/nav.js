document.documentElement.classList.add('js');

document.querySelectorAll('.nav-group').forEach(group => {
  let closeTimer;
  const open = () => {
    clearTimeout(closeTimer);
    group.classList.add('is-open');
  };
  const close = () => {
    closeTimer = setTimeout(() => group.classList.remove('is-open'), 220);
  };
  group.addEventListener('mouseenter', open);
  group.addEventListener('mouseleave', close);
  group.addEventListener('focusin', open);
  group.addEventListener('focusout', close);
});

/* Hover-to-play videos (home card + case hero) — skip autoplay ones */
document.querySelectorAll('.thumb-vid, .hero-vid').forEach(video => {
  if (video.hasAttribute('autoplay')) return;
  const host = video.parentElement;
  host.addEventListener('mouseenter', () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  });
  host.addEventListener('mouseleave', () => { video.pause(); });
});

/* Soft arrival on scroll, and phones (no hover) bring the centred cover into focus */
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm) {
    let items = [...document.querySelectorAll('.works .project, .case-section, .bib-section, .timeline-row, .case-hero, .case-metagrid')]
      .filter(el => el.getBoundingClientRect().top > innerHeight * .9);
    items.forEach(el => el.classList.add('will-reveal'));
    const show = () => {
      const edge = innerHeight * .94;
      items = items.filter(el => {
        if (el.getBoundingClientRect().top > edge) return true;
        el.classList.add('is-in');
        return false;
      });
      if (!items.length) removeEventListener('scroll', show);
    };
    addEventListener('scroll', show, { passive: true });
    addEventListener('resize', show);
    show();
  }
  if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    const near = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { rootMargin: '-38% 0px -38% 0px' });
    document.querySelectorAll('.cover').forEach(c => near.observe(c));
  }
})();

/* Case Studies / Explorations tabs, with Creative Tech / Writings inside */
(() => {
  const lists = [...document.querySelectorAll('[role="tablist"]')];
  if (!lists.length) return;
  const panelOf = b => document.getElementById(b.getAttribute('aria-controls'));
  const select = (b, focus) => {
    const btns = [...b.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    btns.forEach(x => {
      const on = x === b;
      x.setAttribute('aria-selected', on);
      x.tabIndex = on ? 0 : -1;
      panelOf(x).hidden = !on;
    });
    if (focus) b.focus();
  };
  lists.forEach(list => {
    const btns = [...list.querySelectorAll('[role="tab"]')];
    btns.forEach((b, i) => {
      b.addEventListener('click', () => { select(b); history.replaceState(null, '', '#' + b.getAttribute('aria-controls')); });
      b.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        select(btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length], true);
      });
    });
    select(btns.find(b => b.getAttribute('aria-selected') === 'true') || btns[0]);
  });
  const open = () => {
    const id = location.hash.slice(1);
    const tab = id && document.querySelector(`[role="tab"][aria-controls="${CSS.escape(id)}"]`);
    if (!tab) return;
    const outer = tab.closest('[role="tabpanel"]');
    if (outer) select(document.querySelector(`[role="tab"][aria-controls="${outer.id}"]`));
    select(tab);
    requestAnimationFrame(() => document.getElementById('work')?.scrollIntoView());
  };
  open();
  addEventListener('hashchange', open);
})();

