/* About page: visitors share their firsts and suggest Nadya's next one.
   Posts appear straight away. Nadya removes anything unwanted from the Supabase dashboard.

   To switch on the shared wall, paste the project's URL and anon public key below.
   (The anon key is meant to be public; the database only lets visitors add and read.)
   Until then the page runs in preview mode and keeps posts in this browser only. */
const FIRSTS_CONFIG = {
  url: '',      // e.g. 'https://abcd1234.supabase.co'
  key: ''       // the "anon public" key from Project Settings → API
};

/* The deck of firsts: click a card (or the button, or press → on it) to send the top one to the back */
(() => {
  const deck = document.getElementById('deck');
  if (!deck) return;
  const cards = [...deck.querySelectorAll('.washi')];
  const btn = document.querySelector('.deck-next');
  const iEl = document.querySelector('.deck-i'), nEl = document.querySelector('.deck-n');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let order = cards.map((_, i) => i), busy = false, shown = 0;
  if (nEl) nEl.textContent = cards.length;
  const place = () => order.forEach((c, pos) => {
    cards[c].dataset.pos = pos;
    cards[c].setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
  });
  const next = () => {
    if (busy) return;
    busy = true;
    const top = cards[order[0]];
    top.classList.add('is-leaving');
    setTimeout(() => {
      order.push(order.shift());
      top.classList.remove('is-leaving');
      top.style.transition = 'none';
      place();
      void top.offsetWidth;
      top.style.transition = '';
      shown = (shown + 1) % cards.length;
      if (iEl) iEl.textContent = shown + 1;
      busy = false;
    }, calm ? 0 : 520);
  };
  place();
  deck.addEventListener('click', next);
  if (btn) btn.addEventListener('click', next);
  deck.tabIndex = 0;
  deck.setAttribute('role', 'button');
  deck.setAttribute('aria-label', 'Flip to the next first');
  deck.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); next(); } });
})();

(() => {
  const forms = document.querySelectorAll('.ab-form[data-store]');
  if (!forms.length) return;

  const live = !!(FIRSTS_CONFIG.url && FIRSTS_CONFIG.key);
  const TABLE = { firsts: 'firsts', next: 'next_firsts' };
  const COOLDOWN = 45 * 1000;
  const MAX = 120;
  // Catches links and the worst words before anything posts. Nadya can remove the rest by hand.
  const BLOCK = /(https?:\/\/|www\.|\.(com|net|org|ru|xyz)\b|\bf+u+c+k|\bs+h+i+t+\b|\bc+u+n+t|\bbitch|\bporn|\bnazi|\bn+i+g+g|\bf+a+g+g?o+t|\bretard|\bkill\s+(yourself|urself)|\bkys\b)/i;

  const api = (path, opts = {}) => fetch(`${FIRSTS_CONFIG.url}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: FIRSTS_CONFIG.key, Authorization: `Bearer ${FIRSTS_CONFIG.key}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  }).then(r => { if (!r.ok) throw new Error(r.status); return r.status === 204 ? null : r.json(); });

  const local = {
    read: store => JSON.parse(localStorage.getItem('ns-' + store) || '[]'),
    write: (store, rows) => localStorage.setItem('ns-' + store, JSON.stringify(rows.slice(0, 80)))
  };

  const load = async store => {
    if (!live) return local.read(store);
    const cols = store === 'next' ? 'id,text,status,created_at' : 'id,text,created_at';
    return api(`${TABLE[store]}?select=${cols}&order=created_at.desc&limit=80`);
  };
  const add = async (store, text) => {
    const row = { text };
    if (!live) {
      const r = { id: Date.now(), text, created_at: new Date().toISOString(), status: 'suggested' };
      local.write(store, [r, ...local.read(store)]);
      return r;
    }
    const out = await api(TABLE[store], { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
    return out && out[0] ? out[0] : { text, created_at: new Date().toISOString(), status: 'suggested' };
  };

  const when = iso => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    if (s < 86400 * 2) return 'yesterday';
    if (s < 86400 * 14) return Math.floor(s / 86400) + ' days ago';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };
  const STATUS = { suggested: 'Suggested', planned: 'Planned', done: 'Done ✓' };

  // Built with textContent only, so nothing a visitor types can run as code.
  const item = (store, r, fresh) => {
    const li = document.createElement('li');
    if (fresh) li.classList.add('is-new');
    const p = document.createElement('p'); p.textContent = r.text; li.append(p);
    if (store === 'next') {
      const s = document.createElement('span'); s.textContent = STATUS[r.status] || STATUS.suggested; li.append(s);
    } else {
      const t = document.createElement('time'); t.dateTime = r.created_at; t.textContent = when(r.created_at); li.append(t);
    }
    return li;
  };
  const empty = store => {
    const li = document.createElement('li'); li.className = 'ab-empty';
    li.textContent = store === 'next' ? 'No suggestions yet. Be the first.' : 'Nothing here yet. Be the first to share a first.';
    return li;
  };

  const render = async store => {
    const wall = document.querySelector(`[data-wall="${store}"]`);
    if (!wall) return;
    try {
      const rows = await load(store);
      wall.replaceChildren(...(rows.length ? rows.map(r => item(store, r)) : [empty(store)]));
    } catch (_) {
      wall.replaceChildren(empty(store));
    }
  };

  forms.forEach(form => {
    const store = form.dataset.store;
    const input = form.querySelector('input[name="text"]');
    const trap = form.querySelector('.ab-trap');
    const btn = form.querySelector('button');
    const note = form.parentElement.querySelector('.ab-note');
    const base = note ? note.textContent : '';
    const say = (msg, warn) => { if (!note) return; note.textContent = msg; note.classList.toggle('is-warn', !!warn); };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const text = input.value.replace(/\s+/g, ' ').trim().slice(0, MAX);
      if (trap && trap.value) return;                                   // a bot filled the hidden field
      if (text.length < 2) { say('Write a few words first.', true); input.focus(); return; }
      if (BLOCK.test(text)) { say('Let’s keep it kind, and without links.', true); return; }
      const last = Number(localStorage.getItem('ns-last-' + store) || 0);
      if (Date.now() - last < COOLDOWN) { say('Thank you! Give it a moment before the next one.', true); return; }

      btn.disabled = true;
      try {
        const row = await add(store, text);
        localStorage.setItem('ns-last-' + store, String(Date.now()));
        const wall = document.querySelector(`[data-wall="${store}"]`);
        if (wall) {
          wall.querySelector('.ab-empty')?.remove();
          wall.prepend(item(store, row, true));
        }
        input.value = '';
        say(store === 'next' ? 'Added. I’ll let you know how it goes.' : 'Thank you for sharing.');
        setTimeout(() => say(base), 4000);
      } catch (_) {
        say('That didn’t send. Try again in a moment.', true);
      } finally {
        btn.disabled = false;
      }
    });
  });

  render('firsts');
  render('next');
})();
