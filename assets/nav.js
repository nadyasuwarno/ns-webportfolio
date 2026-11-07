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

