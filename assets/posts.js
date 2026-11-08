/* Writings: likes and comments on each post.
   Uses the Supabase project in assets/supabase.js. While that is empty, it runs in preview mode
   and keeps likes and comments in this browser only. Nadya removes comments in the Supabase dashboard. */
(() => {
  const blocks = document.querySelectorAll('.post-actions[data-post]');
  if (!blocks.length) return;

  const CFG = window.NS_SUPABASE || { url: '', key: '' };
  const live = !!(CFG.url && CFG.key);
  const MAX = 500, COOLDOWN = 45 * 1000;
  const BLOCK = /(https?:\/\/|www\.|\.(com|net|org|ru|xyz)\b|\bf+u+c+k|\bs+h+i+t+\b|\bc+u+n+t|\bbitch|\bporn|\bnazi|\bn+i+g+g|\bf+a+g+g?o+t|\bretard|\bkill\s+(yourself|urself)|\bkys\b)/i;

  const api = (path, opts = {}) => fetch(`${CFG.url}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: CFG.key, Authorization: `Bearer ${CFG.key}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const store = {
    get: k => JSON.parse(localStorage.getItem(k) || '[]'),
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v.slice(0, 200)))
  };

  const countLikes = async post => {
    if (!live) return store.get('ns-likes-' + post).length;
    const r = await api(`post_likes?select=id&post=eq.${encodeURIComponent(post)}`, { method: 'HEAD', headers: { Prefer: 'count=exact' } });
    const range = r.headers.get('content-range') || '*/0';
    return Number(range.split('/')[1]) || 0;
  };
  const addLike = async post => {
    if (!live) { store.set('ns-likes-' + post, [Date.now(), ...store.get('ns-likes-' + post)]); return; }
    const r = await api('post_likes', { method: 'POST', body: JSON.stringify({ post }) });
    if (!r.ok) throw new Error(r.status);
  };
  const loadComments = async post => {
    if (!live) return store.get('ns-comments-' + post);
    const r = await api(`post_comments?select=id,name,text,created_at&post=eq.${encodeURIComponent(post)}&order=created_at.desc&limit=100`);
    if (!r.ok) throw new Error(r.status);
    return r.json();
  };
  const addComment = async (post, name, text) => {
    const row = { post, name: name || null, text };
    if (!live) {
      const c = { ...row, id: Date.now(), created_at: new Date().toISOString() };
      store.set('ns-comments-' + post, [c, ...store.get('ns-comments-' + post)]);
      return c;
    }
    const r = await api('post_comments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
    if (!r.ok) throw new Error(r.status);
    const out = await r.json();
    return out[0] || { ...row, created_at: new Date().toISOString() };
  };

  const when = iso => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    if (s < 86400 * 14) return Math.max(1, Math.floor(s / 86400)) + ' d ago';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  // textContent only, so nothing a visitor writes can run as code
  const commentItem = (c, fresh) => {
    const li = document.createElement('li');
    if (fresh) li.classList.add('is-new');
    const head = document.createElement('p'); head.className = 'post-c-head';
    const n = document.createElement('span'); n.className = 'post-c-name'; n.textContent = c.name || 'Someone';
    const t = document.createElement('time'); t.dateTime = c.created_at; t.textContent = when(c.created_at);
    head.append(n, t);
    const body = document.createElement('p'); body.className = 'post-c-text'; body.textContent = c.text;
    li.append(head, body);
    return li;
  };

  blocks.forEach(block => {
    const post = block.dataset.post;
    const likeBtn = block.querySelector('.post-like');
    const likeCount = block.querySelector('[data-count="likes"]');
    const cBtn = block.querySelector('.post-comment-btn');
    const cCount = block.querySelector('[data-count="comments"]');
    const panel = document.getElementById(cBtn.getAttribute('aria-controls'));
    const list = panel.querySelector('.post-list');
    const form = panel.querySelector('.post-form');
    const note = panel.querySelector('.post-note');
    const say = (m, warn) => { note.textContent = m; note.classList.toggle('is-warn', !!warn); };

    const likedKey = 'ns-liked-' + post;
    const setLiked = on => { likeBtn.setAttribute('aria-pressed', String(on)); likeBtn.classList.toggle('is-liked', on); };
    setLiked(localStorage.getItem(likedKey) === '1');
    countLikes(post).then(n => { likeCount.textContent = n; }).catch(() => {});

    likeBtn.addEventListener('click', async () => {
      if (localStorage.getItem(likedKey) === '1') return;      // one like per visitor
      setLiked(true); localStorage.setItem(likedKey, '1');
      likeCount.textContent = Number(likeCount.textContent) + 1;
      likeBtn.classList.add('is-pop'); setTimeout(() => likeBtn.classList.remove('is-pop'), 500);
      try { await addLike(post); } catch (_) { /* keep the heart filled; the count refreshes next visit */ }
    });

    const renderComments = rows => {
      cCount.textContent = rows.length;
      list.replaceChildren(...rows.map(c => commentItem(c)));
      if (!rows.length) { const li = document.createElement('li'); li.className = 'post-empty'; li.textContent = 'No comments yet. Be the first.'; list.append(li); }
    };
    loadComments(post).then(renderComments).catch(() => renderComments([]));

    cBtn.addEventListener('click', () => {
      const open = cBtn.getAttribute('aria-expanded') !== 'true';
      cBtn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      if (open) form.querySelector('textarea').focus();
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.website.value) return;                          // a bot filled the hidden field
      const name = form.name.value.replace(/\s+/g, ' ').trim().slice(0, 40);
      const text = form.text.value.replace(/[ \t]+/g, ' ').trim().slice(0, MAX);
      if (text.length < 2) { say('Write a few words first.', true); return; }
      if (BLOCK.test(text) || BLOCK.test(name)) { say('Let’s keep it kind, and without links.', true); return; }
      const last = Number(localStorage.getItem('ns-last-comment') || 0);
      if (Date.now() - last < COOLDOWN) { say('Thank you! Give it a moment before the next one.', true); return; }
      const btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
      try {
        const c = await addComment(post, name, text);
        localStorage.setItem('ns-last-comment', String(Date.now()));
        list.querySelector('.post-empty')?.remove();
        list.prepend(commentItem(c, true));
        cCount.textContent = Number(cCount.textContent) + 1;
        form.text.value = '';
        say('Thanks for reading.');
      } catch (_) {
        say('That didn’t send. Try again in a moment.', true);
      } finally { btn.disabled = false; }
    });
  });
})();
