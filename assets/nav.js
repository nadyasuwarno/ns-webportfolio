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

/* Explorations: category filter tabs */
(() => {
  const tabs = document.querySelectorAll('.filter-tab');
  const items = document.querySelectorAll('.exploration');
  const empty = document.querySelector('.exploration-empty');
  if (!tabs.length || !items.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      tabs.forEach(t => t.classList.toggle('is-active', t === tab));
      let visibleCount = 0;
      items.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.classList.toggle('is-hidden', !match);
        if (match) visibleCount++;
      });
      if (empty) empty.hidden = visibleCount > 0;
    });
  });
})();
