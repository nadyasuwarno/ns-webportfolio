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
    let items = [...document.querySelectorAll('.case-section, .timeline-row')]
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
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  };
  open();
  addEventListener('hashchange', open);
})();


/* Case studies: the hovered card grows to lead and plays */
(() => {
  const row = document.querySelector('.showcase');
  if (!row || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia('(min-width: 901px)');
  const cards = [...row.querySelectorAll('.project')];

  const lead = card => {
    cards.forEach(c => {
      const on = c === card;
      c.classList.toggle('is-lead', on);
      const v = c.querySelector('.cover-vid');
      if (!v) return;
      if (on && !calm) {
        v.play().then(() => c.classList.add('is-playing')).catch(() => {});
      } else {
        c.classList.remove('is-playing');
        setTimeout(() => { if (!c.classList.contains('is-lead')) { v.pause(); v.currentTime = 0; } }, 500);
      }
    });
    row.classList.toggle('has-lead', !!card && wide.matches);
  };
  cards.forEach(c => c.addEventListener('pointerenter', () => lead(c)));
  row.addEventListener('pointerleave', () => lead(null));
  wide.addEventListener('change', () => row.classList.toggle('has-lead', wide.matches && cards.some(c => c.classList.contains('is-lead'))));
})();

/* The glass cursor pill: follows the pointer over anything marked data-cursor */
(() => {
  const targets = document.querySelectorAll('[data-cursor]');
  if (!targets.length || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons = {
    view: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>',
    soon: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.6"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
    ig: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>'
  };
  const words = { view: 'View case study', soon: 'Coming soon', ig: 'View on nescreative' };
  const pill = document.createElement('div');
  pill.className = 'cursor-pill';
  pill.setAttribute('aria-hidden', 'true');
  document.body.append(pill);
  let kind = '', tx = 0, ty = 0, x = 0, y = 0, raf = 0, shown = false;
  const tick = () => {
    x += (tx - x) * (calm ? 1 : .2); y += (ty - y) * (calm ? 1 : .2);
    pill.style.transform = `translate(${x + 16}px, ${y + 14}px)`;
    raf = (Math.abs(tx - x) + Math.abs(ty - y) > .3) ? requestAnimationFrame(tick) : 0;
  };
  targets.forEach(t => {
    t.addEventListener('pointerenter', e => {
      const k = t.dataset.cursor;
      if (k !== kind) { kind = k; pill.innerHTML = icons[k] + '<span>' + words[k] + '</span>'; }
      tx = e.clientX; ty = e.clientY;
      if (!shown) { x = tx; y = ty; tick(); }
      shown = true; pill.classList.add('is-on');
    });
    t.addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; pill.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(tick);
    });
    t.addEventListener('pointerleave', () => { shown = false; pill.classList.remove('is-on'); });
  });
})();

/* Case study: hero film play/pause, the skip-to rail's active step and progress, keys 1–4 */
(() => {
  const film = document.getElementById('hero-film');
  const state = document.querySelector('.c2-film-state');
  if (film && state) {
    const sync = () => {
      const off = film.paused;
      state.textContent = off ? 'Play video' : 'Pause video';
      state.setAttribute('aria-pressed', String(off));
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { film.removeAttribute('autoplay'); film.pause(); }
    const toggle = () => { film.paused ? film.play().catch(() => {}) : film.pause(); };
    state.addEventListener('click', toggle);
    film.addEventListener('click', toggle);
    film.addEventListener('play', sync); film.addEventListener('pause', sync); sync();
  }

  const rail = document.querySelector('.c2-rail');
  if (!rail) return;
  const list = rail.querySelector('ol');
  const links = [...list.querySelectorAll('a')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href')));
  let raf = 0;
  const update = () => {
    raf = 0;
    const line = innerHeight * .35;
    let i = 0;
    secs.forEach((s, k) => { if (s && s.getBoundingClientRect().top <= line) i = k; });
    links.forEach((a, k) => {
      a.classList.toggle('is-active', k === i);
      if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    // progress: whole steps passed plus how far through the current one
    const s = secs[i], next = secs[i + 1];
    let f = 0;
    if (s) {
      const top = s.getBoundingClientRect().top - line;
      const end = next ? next.getBoundingClientRect().top - line : s.getBoundingClientRect().bottom - innerHeight * .9;
      f = Math.min(1, Math.max(0, -top / Math.max(1, end - top)));
    }
    list.style.setProperty('--p', ((i + (i < secs.length - 1 ? f : 0)) / (secs.length - 1)).toFixed(4));
    if (matchMedia('(max-width: 1100px)').matches) {
      const a = links[i];
      list.scrollTo({ left: a.offsetLeft - 32, behavior: 'smooth' });
    }
  };
  const ask = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  update();

  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const go = el => {
    if (el.id === 'top') { scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' }); history.replaceState(null, '', location.pathname); return; }
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }); history.replaceState(null, '', '#' + el.id);
  };
  document.querySelectorAll('.c2-rail ol a, .c2-top, .c2-skip, .c2-watch').forEach(a => a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault(); go(el);
  }));
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable) return;
    const k = Number(e.key);
    if (k >= 1 && k <= secs.length && secs[k - 1]) go(secs[k - 1]);
  });
})();
